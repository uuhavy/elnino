import React from 'react';

export default function GameOverScreen({
  score,
  feeStatus,
  txHash,
  onRestart,
}) {
  return (
    <div id='game-over-screen' style={{ display: 'flex' }}>
      <div className='go-skull'>🐍</div>
      <div className='go-title'>GAME OVER</div>
      <div className='go-divider'></div>

      <div className='go-stats'>
        <div className='go-stat'>
          <div className='go-stat-label'>LENGTH</div>
          <div className='go-stat-val' id='final-score'>
            {score}
          </div>
        </div>
      </div>

      {txHash && (
        <div id='go-tx-wrap' style={{ display: 'block' }}>
          <a
            id='go-tx-link'
            href={`https://basescan.org/tx/${txHash}`}
            target='_blank'
            rel='noreferrer'
          >
            🔗
          </a>
        </div>
      )}

      <div className='go-buttons'>
        <button
          className='go-btn go-btn-restart'
          id='btn-restart'
          onClick={onRestart}
        >
          🔄 PLAY AGAIN
        </button>
      </div>
    </div>
  );
}
