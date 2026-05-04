import Logo from './Logo.jsx';

export default function Landing({ onCreateGame, onJoinGame }) {
  return (
    <div className="page">
      <div className="logo" style={{ marginTop: 40, marginBottom: 8 }}>
        <Logo size="lg" />
        <div className="logo-sub" style={{ marginTop: 10 }}>A two-player number guessing battle</div>
      </div>

      <div className="card" style={{ marginTop: 8 }}>
        <p className="text-muted text-center mb-16" style={{ lineHeight: 1.7 }}>
          Each player secretly picks a number. Then take turns guessing
          your opponent's number. Closest guess gets the hint — win the
          most rounds to claim victory.
        </p>
        <div className="btn-row">
          <button className="btn btn-primary btn-lg" onClick={onCreateGame}>
            Create a Game
          </button>
          <button className="btn btn-secondary btn-lg" onClick={onJoinGame}>
            Join a Game
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 32, marginTop: 8 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>🎯</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>Pick your number</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>🔄</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>Take turns guessing</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>🏆</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>Win the most rounds</div>
        </div>
      </div>
    </div>
  );
}
