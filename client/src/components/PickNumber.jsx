import { useState } from 'react';
import Logo from './Logo.jsx';

export default function PickNumber({ game, myName, myNumberPicked, mySecretNumber, onPickNumber, error }) {
  const [input, setInput] = useState('');

  if (!game) return null;

  const { settings, players } = game;
  const me = players.find(p => p.name === myName);
  const opponent = players.find(p => p.name !== myName);
  const opponentReady = opponent?.ready ?? false;

  function handleSubmit(e) {
    e.preventDefault();
    const n = parseInt(input, 10);
    if (isNaN(n)) return;
    onPickNumber(n);
  }

  return (
    <div className="page">
      <div className="logo" style={{ marginTop: 24 }}>
        <Logo size="sm" />
      </div>

      <div className="round-badge flex-center" style={{ alignSelf: 'center' }}>
        Round {game.currentRound} of {settings.rounds}
      </div>

      <div className="card">
        <div className="card-title" style={{ textAlign: 'center' }}>
          {myNumberPicked ? 'Number Locked In!' : 'Pick Your Secret Number'}
        </div>

        <div className="range-label" style={{ marginBottom: myNumberPicked ? 12 : 16 }}>
          {myNumberPicked
            ? 'Your secret number for this round:'
            : <>Choose any whole number between{' '}
                <strong style={{ color: 'var(--text)' }}>{settings.lowerRange}</strong>
                {' '}and{' '}
                <strong style={{ color: 'var(--text)' }}>{settings.upperRange}</strong>
              </>
          }
        </div>

        {/* The input area — transforms into a text display after locking */}
        {myNumberPicked ? (
          <div className="number-input-row">
            <div className="locked-number-display">
              <span className="locked-icon">🔒</span>
              <span className="locked-value">{mySecretNumber}</span>
            </div>
          </div>
        ) : (
          <>
            {!myNumberPicked && (
              <p className="text-muted text-center mb-16" style={{ fontSize: '0.82rem' }}>
                Your opponent will try to guess this. Keep it secret!
              </p>
            )}
            {error && <div className="alert alert-error mb-16">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="number-input-row">
                <input
                  type="number"
                  placeholder="?"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  min={settings.lowerRange}
                  max={settings.upperRange}
                  autoFocus
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={input === ''}
                  style={{ padding: '14px 24px', fontSize: '1rem' }}
                >
                  Lock In
                </button>
              </div>
            </form>
          </>
        )}

        <div className="divider" style={{ margin: '20px 0' }} />

        {/* Waiting status */}
        {myNumberPicked && (
          <div style={{ marginBottom: 16 }}>
            {opponentReady ? (
              <div className="alert alert-success text-center">
                Both players ready — starting guessing phase!
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <span className="text-muted">Waiting for {opponent?.name}</span>
                <div className="waiting-dots">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ready indicators */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: me?.ready ? 'var(--green)' : 'var(--text3)',
              transition: 'background 0.3s',
            }} />
            <span className="text-muted" style={{ fontSize: '0.82rem' }}>
              {myName} (you) — {me?.ready ? 'Ready ✓' : 'Picking…'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: opponentReady ? 'var(--green)' : 'var(--text3)',
              transition: 'background 0.3s',
            }} />
            <span className="text-muted" style={{ fontSize: '0.82rem' }}>
              {opponent?.name} — {opponentReady ? 'Ready ✓' : 'Picking…'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
