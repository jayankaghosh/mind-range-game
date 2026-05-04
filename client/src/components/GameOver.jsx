import Logo from './Logo.jsx';

export default function GameOver({ result, myId, myName, onPlayAgain }) {
  if (!result) return null;

  const { winnerId, winnerName, tied, scores } = result;
  const iWon = winnerId === myId;

  return (
    <div className="page">
      <div className="logo" style={{ marginTop: 40 }}>
        <Logo size="sm" />
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <div className="trophy">
          {tied ? '🤝' : iWon ? '🏆' : '🥈'}
        </div>

        {tied ? (
          <>
            <div className="winner-name" style={{ background: 'none', WebkitTextFillColor: 'var(--text)' }}>
              It's a Tie!
            </div>
            <p className="text-muted mt-8">Both players finished with the same score.</p>
          </>
        ) : (
          <>
            <div className="winner-name">
              {iWon ? 'You Win!' : `${winnerName} Wins!`}
            </div>
            <p className="text-muted mt-8">
              {iWon ? 'Congratulations, champion!' : `Better luck next time, ${myName}!`}
            </p>
          </>
        )}

        <div className="final-scores">
          {[...scores].sort((a, b) => b.score - a.score).map(s => (
            <div
              key={s.id}
              className={`final-score-row ${s.id === winnerId ? 'you-won' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {s.id === winnerId && !tied && (
                  <span style={{ fontSize: '1.1rem' }}>👑</span>
                )}
                <span style={{ fontWeight: 600 }}>
                  {s.name}{s.id === myId ? ' (you)' : ''}
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'Space Grotesk',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: s.id === winnerId && !tied ? 'var(--yellow)' : 'var(--text)',
                }}
              >
                {s.score}
              </span>
            </div>
          ))}
        </div>

        <div className="divider" style={{ margin: '24px 0' }} />

        <button className="btn btn-primary btn-lg" onClick={onPlayAgain}>
          Back to Home
        </button>
      </div>
    </div>
  );
}
