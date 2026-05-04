import { useState, useRef, useEffect } from 'react';
import Logo from './Logo.jsx';

export default function GameBoard({ game, myId, myName, mySecretNumber, guessLog, onGuess, error }) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const logEndRef = useRef(null);

  if (!game) return null;

  const { settings, players, currentTurn, currentRound } = game;
  const isMyTurn = currentTurn === myId;
  const opponent = players.find(p => p.id !== myId);

  const myGuesses = guessLog.filter(e => e.guesserId === myId);

  useEffect(() => {
    if (isMyTurn && inputRef.current) inputRef.current.focus();
  }, [isMyTurn]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [guessLog]);

  function handleSubmit(e) {
    e.preventDefault();
    const n = parseInt(input, 10);
    if (isNaN(n)) return;
    setInput('');
    onGuess(n);
  }

  return (
    <div className="page page-wide">
      <div className="logo" style={{ marginTop: 16 }}>
        <Logo size="sm" />
      </div>

      <div className="round-badge flex-center" style={{ alignSelf: 'center' }}>
        Round {currentRound} of {settings.rounds}
      </div>

      {/* Scoreboard */}
      <div className="scoreboard">
        {players.map(p => {
          const isMe = p.id === myId;
          return (
            <div key={p.id} className={`score-card ${p.id === currentTurn ? 'active-turn' : ''}`}>
              <div className="score-name">
                {p.name}{isMe ? ' (you)' : ''}
              </div>
              <div className="score-value">{p.score}</div>
              {isMe && mySecretNumber !== null && (
                <div style={{
                  marginTop: 6,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: 'var(--bg)',
                  border: '1px solid var(--accent)',
                  borderRadius: 99,
                  padding: '2px 10px',
                  fontSize: '0.75rem',
                  color: 'var(--accent)',
                  fontWeight: 600,
                }}>
                  🔒 {mySecretNumber}
                </div>
              )}
              {p.id === currentTurn && (
                <div className="turn-indicator">● Guessing</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Turn status */}
      <div className="card" style={{ padding: '18px 24px' }}>
        {isMyTurn ? (
          <div className="text-center">
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>
              Your turn — guess {opponent?.name}'s number!
            </div>
            <div className="text-muted" style={{ fontSize: '0.82rem' }}>
              Range: {settings.lowerRange} – {settings.upperRange}
            </div>
          </div>
        ) : (
          <div className="flex-center">
            <span style={{ fontWeight: 600 }}>
              {players.find(p => p.id === currentTurn)?.name} is guessing…
            </span>
            <div className="waiting-dots">
              <span /><span /><span />
            </div>
          </div>
        )}
      </div>

      {/* Guess input */}
      {isMyTurn && (
        <div className="card">
          {error && <div className="alert alert-error mb-16">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="number-input-row">
              <input
                ref={inputRef}
                type="number"
                placeholder={`${settings.lowerRange} – ${settings.upperRange}`}
                value={input}
                onChange={e => setInput(e.target.value)}
                min={settings.lowerRange}
                max={settings.upperRange}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={input === ''}
                style={{ padding: '14px 28px', fontSize: '1rem' }}
              >
                Guess
              </button>
            </div>
          </form>
        </div>
      )}

      {/* My Guesses — quick view */}
      {myGuesses.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 12, fontSize: '0.95rem' }}>
            Your Guesses
            <span className="text-muted" style={{ fontWeight: 400, fontSize: '0.78rem', marginLeft: 8 }}>
              — this round
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {myGuesses.map((entry, i) => (
              <div
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: 99,
                  padding: '5px 12px',
                  fontSize: '0.85rem',
                }}
              >
                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--accent)' }}>
                  {entry.guess}
                </span>
                <span className={`guess-hint hint-${entry.hint}`} style={{ padding: '1px 7px', fontSize: '0.72rem' }}>
                  {entry.hint === 'higher' ? '↑' : '↓'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Guess History */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 14 }}>
          Full History
          <span className="text-muted" style={{ fontWeight: 400, fontSize: '0.82rem', marginLeft: 8 }}>
            — this round
          </span>
        </div>

        {guessLog.length === 0 ? (
          <div className="text-muted text-center" style={{ padding: '20px 0' }}>
            No guesses yet — {isMyTurn ? "you go first!" : "waiting for the first guess…"}
          </div>
        ) : (
          <div className="guess-log">
            {guessLog.map((entry, i) => {
              const isMe = entry.guesserId === myId;
              return (
                <div className="guess-entry" key={i}>
                  <div className="guess-player">
                    {isMe ? 'You' : entry.guesserName}
                  </div>
                  <div style={{ color: 'var(--text2)', fontSize: '0.8rem' }}>guessed</div>
                  <div className="guess-number">{entry.guess}</div>
                  <div className={`guess-hint hint-${entry.hint}`}>
                    {entry.hint === 'higher' ? '↑ Higher' : '↓ Lower'}
                  </div>
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
