import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { playSound, setSfxMuted } from './sounds.js';
import Landing from './components/Landing.jsx';
import CreateGame from './components/CreateGame.jsx';
import JoinGame from './components/JoinGame.jsx';
import Lobby from './components/Lobby.jsx';
import PickNumber from './components/PickNumber.jsx';
import GameBoard from './components/GameBoard.jsx';
import GameOver from './components/GameOver.jsx';

const SCREENS = {
  LANDING: 'landing',
  CREATE: 'create',
  JOIN: 'join',
  LOBBY: 'lobby',
  ROUND_START: 'round-start',
  PICKING: 'picking',
  GUESSING: 'guessing',
  ROUND_WON: 'round-won',
  GAME_OVER: 'game-over',
};

const initialState = {
  screen: SCREENS.LANDING,
  myId: null,
  myName: '',
  isHost: false,
  gameCode: '',
  game: null,
  myNumberPicked: false,
  mySecretNumber: null,
  guessLog: [],
  roundInfo: null,
  roundResult: null,
  gameResult: null,
  joinError: '',
  gameError: '',
  notification: '',
};

function loadPref(key, fallback) {
  try { const v = localStorage.getItem(key); return v === null ? fallback : v === 'true'; } catch { return fallback; }
}

export default function App() {
  const socketRef = useRef(null);
  const bgRef = useRef(null);
  const [state, setState] = useState(initialState);
  const notifTimer = useRef(null);

  const [bgMuted, setBgMuted] = useState(() => loadPref('mindrange-bg-muted', false));
  const [sfxMuted, setSfxMutedState] = useState(() => loadPref('mindrange-sfx-muted', false));

  // ── Background music ──
  useEffect(() => {
    const audio = new Audio('/sounds/bg.mp3');
    audio.loop = true;
    audio.volume = 0.25;
    bgRef.current = audio;

    if (!loadPref('mindrange-bg-muted', false)) {
      const tryPlay = () => {
        audio.play().catch(() => {});
        document.removeEventListener('pointerdown', tryPlay);
      };
      // Attempt immediately; browsers will allow after a user gesture
      audio.play().catch(() => {
        document.addEventListener('pointerdown', tryPlay, { once: true });
      });
    }

    return () => { audio.pause(); audio.src = ''; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!bgRef.current) return;
    if (bgMuted) {
      bgRef.current.pause();
    } else {
      bgRef.current.play().catch(() => {});
    }
    try { localStorage.setItem('mindrange-bg-muted', bgMuted); } catch {}
  }, [bgMuted]);

  // ── SFX mute ──
  useEffect(() => {
    setSfxMuted(sfxMuted);
    try { localStorage.setItem('mindrange-sfx-muted', sfxMuted); } catch {}
  }, [sfxMuted]);

  const patch = useCallback((update) => {
    setState(prev => ({ ...prev, ...update }));
  }, []);

  const showNotif = useCallback((msg) => {
    patch({ notification: msg });
    clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => patch({ notification: '' }), 2800);
  }, [patch]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001', { autoConnect: true });
    socketRef.current = socket;

    socket.on('connect', () => patch({ myId: socket.id }));

    socket.on('game-created', ({ code, game }) => {
      playSound('join');
      patch({ screen: SCREENS.LOBBY, gameCode: code, game, isHost: true,
               myNumberPicked: false, mySecretNumber: null, guessLog: [] });
    });

    socket.on('joined-game', ({ code, game }) => {
      playSound('join');
      patch({ screen: SCREENS.LOBBY, gameCode: code, game, isHost: false,
               myNumberPicked: false, mySecretNumber: null, guessLog: [] });
    });

    socket.on('join-error', ({ message }) => patch({ joinError: message }));

    socket.on('game-update', (game) => {
      setState(prev => {
        const updates = { game };

        if (game.phase === 'lobby') {
          updates.screen = SCREENS.LOBBY;
          if (game.players.length === 2 && prev.game?.players.length === 1) {
            playSound('join');
          }
        } else if (game.phase === 'picking') {
          updates.screen = SCREENS.PICKING;
          // Only reset pick state when first entering this phase, not on every broadcast
          if (prev.screen !== SCREENS.PICKING && prev.screen !== SCREENS.ROUND_START) {
            updates.myNumberPicked = false;
            updates.mySecretNumber = null;
          }
        } else if (game.phase === 'guessing') {
          updates.screen = SCREENS.GUESSING;
        }

        return { ...prev, ...updates };
      });
    });

    socket.on('round-start', ({ round, totalRounds }) => {
      playSound('round-start');
      setState(prev => ({
        ...prev,
        screen: SCREENS.ROUND_START,
        roundInfo: { round, totalRounds },
        guessLog: [],
        myNumberPicked: false,
        mySecretNumber: null,
        roundResult: null,
      }));
      setTimeout(() => {
        setState(prev => ({ ...prev, screen: SCREENS.PICKING, myNumberPicked: false, mySecretNumber: null }));
      }, 2000);
    });

    socket.on('number-confirmed', () => {
      playSound('number-lock');
      patch({ myNumberPicked: true });
    });

    socket.on('guess-made', (entry) => {
      setState(prev => {
        playSound(entry.guesserId === prev.myId ? entry.hint : 'guess');
        return { ...prev, guessLog: [...prev.guessLog, entry] };
      });
    });

    socket.on('round-won', (result) => {
      setState(prev => {
        playSound(result.winnerId === prev.myId ? 'round-win' : 'round-lose');
        return {
          ...prev,
          screen: SCREENS.ROUND_WON,
          roundResult: result,
          game: prev.game ? {
            ...prev.game,
            players: prev.game.players.map(p => {
              const s = result.scores.find(s => s.id === p.id);
              return s ? { ...p, score: s.score } : p;
            }),
          } : prev.game,
        };
      });
    });

    socket.on('game-over', (result) => {
      setState(prev => {
        playSound(result.tied ? 'round-win' : result.winnerId === prev.myId ? 'game-win' : 'game-lose');
        return { ...prev, screen: SCREENS.GAME_OVER, gameResult: result };
      });
    });

    socket.on('game-error', ({ message }) => {
      patch({ gameError: message });
      setTimeout(() => patch({ gameError: '' }), 3500);
    });

    socket.on('player-left', ({ name }) => {
      showNotif(`${name} disconnected. Game ended.`);
      setTimeout(() => setState(prev => ({ ...initialState, myId: socket.id, myName: prev.myName })), 3000);
    });

    return () => socket.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const createGame = useCallback(({ name, lowerRange, upperRange, rounds }) => {
    patch({ myName: name });
    socketRef.current.emit('create-game', { name, lowerRange, upperRange, rounds });
  }, [patch]);

  const joinGame = useCallback(({ code, name }) => {
    patch({ myName: name, joinError: '' });
    socketRef.current.emit('join-game', { code, name });
  }, [patch]);

  const startGame = useCallback(() => {
    playSound('game-start');
    socketRef.current.emit('start-game', { code: state.gameCode });
  }, [state.gameCode]);

  const pickNumber = useCallback((number) => {
    patch({ mySecretNumber: number });
    socketRef.current.emit('pick-number', { code: state.gameCode, number });
  }, [state.gameCode, patch]);

  const makeGuess = useCallback((number) => {
    socketRef.current.emit('guess', { code: state.gameCode, number });
  }, [state.gameCode]);

  const goHome = useCallback(() => {
    setState(prev => ({ ...initialState, myId: prev.myId }));
  }, []);

  const { screen, myId, myName, isHost, gameCode, game, myNumberPicked,
          mySecretNumber, guessLog, roundInfo, roundResult, gameResult,
          joinError, gameError, notification } = state;

  return (
    <>
      {/* Audio controls — always visible */}
      <div className="audio-controls">
        <button
          className={`audio-btn ${bgMuted ? 'audio-btn-muted' : ''}`}
          onClick={() => setBgMuted(m => !m)}
          title={bgMuted ? 'Unmute music' : 'Mute music'}
        >
          {bgMuted ? '🎵' : '🎵'}
          <span className="audio-label">Music</span>
          {bgMuted && <span className="audio-slash" />}
        </button>
        <button
          className={`audio-btn ${sfxMuted ? 'audio-btn-muted' : ''}`}
          onClick={() => setSfxMutedState(m => !m)}
          title={sfxMuted ? 'Unmute SFX' : 'Mute SFX'}
        >
          🔔
          <span className="audio-label">SFX</span>
          {sfxMuted && <span className="audio-slash" />}
        </button>
      </div>

      {notification && <div className="notif-banner">{notification}</div>}

      {screen === SCREENS.LANDING && (
        <Landing onCreateGame={() => patch({ screen: SCREENS.CREATE })} onJoinGame={() => patch({ screen: SCREENS.JOIN })} />
      )}
      {screen === SCREENS.CREATE && (
        <CreateGame onSubmit={createGame} onBack={() => patch({ screen: SCREENS.LANDING })} />
      )}
      {screen === SCREENS.JOIN && (
        <JoinGame onSubmit={joinGame} onBack={() => patch({ screen: SCREENS.LANDING, joinError: '' })} error={joinError} />
      )}
      {screen === SCREENS.LOBBY && (
        <Lobby game={game} gameCode={gameCode} isHost={isHost} myId={myId} onStartGame={startGame} />
      )}

      {screen === SCREENS.ROUND_START && roundInfo && (
        <div className="overlay">
          <div className="overlay-card">
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚔️</div>
            <div className="card-title" style={{ fontSize: '1.6rem', textAlign: 'center' }}>
              Round {roundInfo.round}
            </div>
            <p className="text-muted text-center mt-8">
              of {roundInfo.totalRounds} — Get ready to pick your number!
            </p>
          </div>
        </div>
      )}

      {screen === SCREENS.PICKING && game && (
        <PickNumber
          game={game}
          myName={myName}
          myNumberPicked={myNumberPicked}
          mySecretNumber={mySecretNumber}
          onPickNumber={pickNumber}
          error={gameError}
        />
      )}

      {screen === SCREENS.GUESSING && game && (
        <GameBoard
          game={game}
          myId={myId}
          myName={myName}
          mySecretNumber={mySecretNumber}
          guessLog={guessLog}
          onGuess={makeGuess}
          error={gameError}
        />
      )}

      {screen === SCREENS.ROUND_WON && roundResult && game && (
        <div className="overlay">
          <div className="overlay-card">
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>
              {roundResult.winnerId === myId ? '🎉' : '😔'}
            </div>
            <div className="card-title" style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: 8 }}>
              {roundResult.winnerId === myId ? 'You won the round!' : `${roundResult.winnerName} wins the round!`}
            </div>
            <p className="text-muted text-center" style={{ marginBottom: 16 }}>
              {roundResult.winnerName} guessed {roundResult.opponentName}'s number:{' '}
              <strong style={{ color: 'var(--accent)' }}>{roundResult.secretNumber}</strong>
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              {roundResult.scores.map(s => (
                <div key={s.id} style={{ textAlign: 'center' }}>
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>{s.name}</div>
                  <div style={{ fontFamily: 'Space Grotesk', fontSize: '2rem', fontWeight: 700, color: 'var(--text)' }}>
                    {s.score}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-muted text-center mt-16" style={{ fontSize: '0.85rem' }}>
              {roundResult.isLastRound ? 'Calculating final results…' : 'Next round starting soon…'}
            </p>
          </div>
        </div>
      )}

      {screen === SCREENS.GAME_OVER && gameResult && (
        <GameOver result={gameResult} myId={myId} myName={myName} onPlayAgain={goHome} />
      )}
    </>
  );
}
