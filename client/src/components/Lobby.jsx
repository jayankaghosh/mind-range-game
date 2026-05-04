import { useState } from 'react';
import Logo from './Logo.jsx';

function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback for non-HTTPS / older browsers
  const el = document.createElement('textarea');
  el.value = text;
  el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(el);
  el.focus();
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  return Promise.resolve();
}

export default function Lobby({ game, gameCode, isHost, myId, onStartGame }) {
  const [copied, setCopied] = useState(false);

  if (!game) return null;

  const { players, settings } = game;
  const canStart = isHost && players.length === 2;

  function handleCopy() {
    copyToClipboard(gameCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="page">
      <div className="logo" style={{ marginTop: 24 }}>
        <Logo size="sm" />
      </div>

      <div className="card">
        <div className="card-title">Game Code</div>
        <div className="game-code">
          <div className="game-code-value">{gameCode}</div>
          <button className="copy-btn" onClick={handleCopy}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <p className="text-muted text-center mt-8" style={{ fontSize: '0.82rem' }}>
          Share this code with your opponent to join
        </p>
      </div>

      <div className="card">
        <div className="card-title">Players</div>
        <div className="player-list">
          {players.map((p, i) => (
            <div className="player-slot" key={p.id}>
              <div className={`player-avatar ${i === 0 ? 'host' : 'guest'}`}>
                {p.name[0].toUpperCase()}
              </div>
              <span className="player-name">{p.name}</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                {p.id === game.host && (
                  <span className="player-badge badge-host">Host</span>
                )}
                {p.id === myId && (
                  <span className="player-badge badge-you">You</span>
                )}
              </div>
            </div>
          ))}

          {players.length < 2 && (
            <div className="player-slot">
              <div className="player-avatar empty">?</div>
              <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>
                Waiting for opponent…
              </span>
              <div className="waiting-dots" style={{ marginLeft: 'auto' }}>
                <span /><span /><span />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Game Settings</div>
        <div className="settings-row">
          <div className="setting-chip">
            Range: <span>{settings.lowerRange} – {settings.upperRange}</span>
          </div>
          <div className="setting-chip">
            Rounds: <span>{settings.rounds}</span>
          </div>
          <div className="setting-chip">
            Numbers: <span>{settings.upperRange - settings.lowerRange}</span> possible
          </div>
        </div>
      </div>

      {isHost ? (
        <button
          className="btn btn-green btn-lg"
          disabled={!canStart}
          onClick={onStartGame}
          style={{ width: '100%' }}
        >
          {canStart ? 'Start Game' : 'Waiting for opponent to join…'}
        </button>
      ) : (
        <div className="alert alert-info text-center">
          Waiting for the host to start the game…
        </div>
      )}
    </div>
  );
}
