import { useState } from 'react';
import Logo from './Logo.jsx';

const LS_NAME = 'mindrange-name';

export default function JoinGame({ onSubmit, onBack, error }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState(() => {
    try { return localStorage.getItem(LS_NAME) ?? ''; } catch { return ''; }
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    try { localStorage.setItem(LS_NAME, name.trim()); } catch {}
    onSubmit({ code: code.trim().toUpperCase(), name: name.trim() });
  }

  return (
    <div className="page">
      <div className="logo" style={{ marginTop: 24 }}>
        <Logo size="sm" />
      </div>

      <div className="card">
        <div className="card-title">Join a Game</div>

        {error && <div className="alert alert-error mb-16">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Your Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={20}
              autoFocus={!name}
            />
          </div>

          <div className="field">
            <label>Game Code</label>
            <input
              type="text"
              placeholder="e.g. ABC123"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              autoFocus={!!name}
              style={{
                fontFamily: 'Space Grotesk',
                fontSize: '1.3rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textAlign: 'center',
              }}
            />
          </div>

          <div className="btn-row" style={{ marginTop: 8 }}>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={!code.trim() || !name.trim()}
            >
              Join Game
            </button>
            <button type="button" className="btn btn-ghost" onClick={onBack}>
              ← Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
