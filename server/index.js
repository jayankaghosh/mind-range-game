import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL, methods: ['GET', 'POST'] },
});

// In-memory game store: code -> game
const games = {};

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function sanitizeGame(game) {
  return {
    code: game.code,
    host: game.host,
    players: game.players.map(({ id, name, score, ready }) => ({ id, name, score, ready })),
    settings: game.settings,
    currentRound: game.currentRound,
    phase: game.phase,
    currentTurn: game.currentTurn,
    firstPlayer: game.firstPlayer,
  };
}

function broadcastGame(code) {
  const game = games[code];
  if (game) io.to(code).emit('game-update', sanitizeGame(game));
}

io.on('connection', (socket) => {
  console.log('connected:', socket.id);

  socket.on('create-game', ({ name, lowerRange, upperRange, rounds }) => {
    let code;
    do { code = generateCode(); } while (games[code]);

    games[code] = {
      code,
      host: socket.id,
      players: [{ id: socket.id, name, score: 0, secretNumber: null, ready: false }],
      settings: {
        lowerRange: Number(lowerRange),
        upperRange: Number(upperRange),
        rounds: Number(rounds),
      },
      currentRound: 0,
      phase: 'lobby',
      currentTurn: null,
      firstPlayer: socket.id,
    };

    socket.join(code);
    socket.emit('game-created', { code, game: sanitizeGame(games[code]) });
  });

  socket.on('join-game', ({ code, name }) => {
    const game = games[code?.toUpperCase()];
    const upperCode = code?.toUpperCase();

    if (!game) {
      socket.emit('join-error', { message: 'Game not found. Check the code and try again.' });
      return;
    }
    if (game.players.length >= 2) {
      socket.emit('join-error', { message: 'This game is already full.' });
      return;
    }
    if (game.phase !== 'lobby') {
      socket.emit('join-error', { message: 'This game has already started.' });
      return;
    }
    if (game.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      socket.emit('join-error', { message: 'That name is already taken in this game.' });
      return;
    }

    game.players.push({ id: socket.id, name, score: 0, secretNumber: null, ready: false });
    socket.join(upperCode);

    socket.emit('joined-game', { code: upperCode, game: sanitizeGame(game) });
    io.to(upperCode).emit('game-update', sanitizeGame(game));
  });

  socket.on('start-game', ({ code }) => {
    const game = games[code];
    if (!game || game.host !== socket.id) return;
    if (game.players.length < 2) {
      socket.emit('game-error', { message: 'Need 2 players to start.' });
      return;
    }

    game.currentRound = 1;
    game.phase = 'picking';
    game.players.forEach(p => { p.secretNumber = null; p.ready = false; });

    io.to(code).emit('round-start', {
      round: game.currentRound,
      totalRounds: game.settings.rounds,
    });
    broadcastGame(code);
  });

  socket.on('pick-number', ({ code, number }) => {
    const game = games[code];
    if (!game || game.phase !== 'picking') return;

    const player = game.players.find(p => p.id === socket.id);
    if (!player || player.ready) return;

    const n = Number(number);
    const { lowerRange, upperRange } = game.settings;

    if (isNaN(n) || n < lowerRange || n > upperRange || !Number.isInteger(n)) {
      socket.emit('game-error', {
        message: `Pick a whole number between ${lowerRange} and ${upperRange}.`,
      });
      return;
    }

    player.secretNumber = n;
    player.ready = true;
    socket.emit('number-confirmed');

    broadcastGame(code);

    if (game.players.every(p => p.ready)) {
      game.phase = 'guessing';
      game.currentTurn = game.firstPlayer;
      broadcastGame(code);
    }
  });

  socket.on('guess', ({ code, number }) => {
    const game = games[code];
    if (!game || game.phase !== 'guessing') return;
    if (game.currentTurn !== socket.id) return;

    const n = Number(number);
    const { lowerRange, upperRange } = game.settings;

    if (isNaN(n) || n < lowerRange || n > upperRange || !Number.isInteger(n)) {
      socket.emit('game-error', {
        message: `Guess must be a whole number between ${lowerRange} and ${upperRange}.`,
      });
      return;
    }

    const guesser = game.players.find(p => p.id === socket.id);
    const opponent = game.players.find(p => p.id !== socket.id);
    const target = opponent.secretNumber;

    if (n === target) {
      guesser.score++;

      const scores = game.players.map(p => ({ id: p.id, name: p.name, score: p.score }));
      const isLastRound = game.currentRound >= game.settings.rounds;

      io.to(code).emit('round-won', {
        winnerId: guesser.id,
        winnerName: guesser.name,
        guess: n,
        secretNumber: target,
        opponentName: opponent.name,
        scores,
        round: game.currentRound,
        isLastRound,
      });

      if (isLastRound) {
        game.phase = 'gameOver';
        const p0 = game.players[0];
        const p1 = game.players[1];
        const tied = p0.score === p1.score;
        const winner = tied ? null : (p0.score > p1.score ? p0 : p1);

        setTimeout(() => {
          io.to(code).emit('game-over', {
            winnerId: winner?.id ?? null,
            winnerName: winner?.name ?? null,
            tied,
            scores,
          });
          delete games[code];
        }, 4000);
      } else {
        game.currentRound++;
        game.phase = 'picking';
        game.firstPlayer = guesser.id;
        game.currentTurn = null;
        game.players.forEach(p => { p.secretNumber = null; p.ready = false; });

        setTimeout(() => {
          io.to(code).emit('round-start', {
            round: game.currentRound,
            totalRounds: game.settings.rounds,
          });
          broadcastGame(code);
        }, 4000);
      }
    } else {
      const hint = n < target ? 'higher' : 'lower';

      io.to(code).emit('guess-made', {
        guesserId: guesser.id,
        guesserName: guesser.name,
        guess: n,
        hint,
      });

      game.currentTurn = opponent.id;
      broadcastGame(code);
    }
  });

  socket.on('disconnect', () => {
    for (const code in games) {
      const game = games[code];
      const player = game.players.find(p => p.id === socket.id);
      if (player) {
        io.to(code).emit('player-left', { name: player.name });
        delete games[code];
        break;
      }
    }
  });
});

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`Mind Range server running on http://localhost:${PORT}`);
});
