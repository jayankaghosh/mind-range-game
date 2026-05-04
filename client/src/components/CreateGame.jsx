import { useState } from 'react';
import Logo from './Logo.jsx';

const LS_NAME = 'mindrange-name';
const LS_SETTINGS = 'mindrange-settings';

function loadSaved() {
  try {
    return {
      name: localStorage.getItem(LS_NAME) ?? '',
      ...JSON.parse(localStorage.getItem(LS_SETTINGS) ?? '{}'),
    };
  } catch {
    return { name: '' };
  }
}

export default function CreateGame({ onSubmit, onBack }) {
  const saved = loadSaved();
  const [name, setName] = useState(saved.name);
  const [lowerRange, setLowerRange] = useState(saved.lowerRange ?? '1');
  const [upperRange, setUpperRange] = useState(saved.upperRange ?? '100');
  const [rounds, setRounds] = useState(saved.rounds ?? '5');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const lo = parseInt(lowerRange, 10);
    const hi = parseInt(upperRange, 10);
    const r = parseInt(rounds, 10);

    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (isNaN(lo) || isNaN(hi)) { setError('Enter valid numbers for the range.'); return; }
    if (lo >= hi) { setError('Lower range must be less than upper range.'); return; }
    if (isNaN(r) || r < 1 || r > 20) { setError('Rounds must be between 1 and 20.'); return; }

    localStorage.setItem(LS_NAME, name.trim());
    localStorage.setItem(LS_SETTINGS, JSON.stringify({ lowerRange: lo, upperRange: hi, rounds: r }));

    onSubmit({ name: name.trim(), lowerRange: lo, upperRange: hi, rounds: r });
  }

  return (
    <div className="page">
      <div className="logo" style={{ marginTop: 24 }}>
        <Logo size="sm" />
      </div>

      <div className="card">
        <div className="card-title">Create a Game</div>

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
              autoFocus
            />
          </div>

          <div className="divider" style={{ margin: '20px 0' }} />

          <div className="card-title" style={{ fontSize: '0.9rem', marginBottom: 14, color: 'var(--text2)' }}>
            Game Settings
          </div>

          <div className="field-row">
            <div className="field">
              <label>Lower Range</label>
              <input
                type="number"
                value={lowerRange}
                onChange={e => setLowerRange(e.target.value)}
                min={-9999}
                max={9999}
              />
            </div>
            <div className="field">
              <label>Upper Range</label>
              <input
                type="number"
                value={upperRange}
                onChange={e => setUpperRange(e.target.value)}
                min={-9999}
                max={9999}
              />
            </div>
          </div>

          <div className="field">
            <label>Number of Rounds</label>
            <input
              type="number"
              value={rounds}
              onChange={e => setRounds(e.target.value)}
              min={1}
              max={20}
            />
            <div className="field-hint">
              Best of {rounds} — first to win the most rounds wins.
            </div>
          </div>

          <div className="btn-row" style={{ marginTop: 8 }}>
            <button type="submit" className="btn btn-primary btn-lg">
              Create Game
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
