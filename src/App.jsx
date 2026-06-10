import React from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { useWallet } from './hooks/useWallet';
import LoadingScreen from './components/LoadingScreen';
import GameOverScreen from './components/GameOverScreen';

export default function App() {
  const {
    wallet,
    feeStatus,
    txHash,
    connect,
    payStartFee,
    payEndFee,
    resetFeeStatus,
  } = useWallet();

  const game = useGameEngine({ onPayEndFee: payEndFee });

  const handlePlayClick = async () => {
    resetFeeStatus();
    await payStartFee();
    game.startGame();
  };

  const handleRestartClick = async () => {
    resetFeeStatus();
    await payStartFee();
    game.restartGame();
  };

  return (
    <>
      <div id='game-container' style={{ display: game.gameState === 'playing' ? 'block' : 'none', position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <canvas className="cnv" id="canvasHex" style={{position: 'absolute', top: 0, left: 0, zIndex: 1}}></canvas>
        <canvas className="cnv" id="canvasFood" style={{position: 'absolute', top: 0, left: 0, zIndex: 2}}></canvas>
        <canvas className="cnv" id="canvasSnake" style={{position: 'absolute', top: 0, left: 0, zIndex: 3}}></canvas>
      </div>

      {(game.gameState === 'loading' || game.gameState === 'ready') && (
        <LoadingScreen
          progress={game.loadProgress}
          msg={game.loadMsg}
          isReady={game.gameState === 'ready'}
          wallet={wallet}
          feeStatus={feeStatus}
          onConnect={connect}
          onPlay={handlePlayClick}
        />
      )}

      {game.gameState === 'gameover' && (
        <GameOverScreen
          score={game.finalScore}
          feeStatus={feeStatus}
          txHash={txHash}
          onRestart={handleRestartClick}
        />
      )}
    </>
  );
}
