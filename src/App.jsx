import React from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { useWallet } from './hooks/useWallet';
import HUD from './components/HUD';
import LoadingScreen from './components/LoadingScreen';
import GameOverScreen from './components/GameOverScreen';
import PauseOverlay from './components/PauseOverlay';
import HudControls from './components/HudControls';

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
      <div id='game-container' ref={game.containerRef}></div>
      <div id='screen-flash'></div>

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

      {(game.gameState === 'playing' ||
        game.gameState === 'paused' ||
        game.gameState === 'gameover') && (
        <HUD
          score={game.score}
          coins={game.coins}
          combo={game.combo}
          distance={game.distance}
        />
      )}

      {(game.gameState === 'playing' || game.gameState === 'paused') && (
        <HudControls
          isMuted={game.isMuted}
          onToggleMute={game.toggleMute}
          onVolumeChange={game.setVolume}
          wallet={wallet}
        />
      )}

      {game.gameState === 'paused' && <PauseOverlay />}

      {game.gameState === 'gameover' && (
        <GameOverScreen
          score={game.finalScore}
          coins={game.finalCoins}
          combo={game.finalCombo}
          feeStatus={feeStatus}
          txHash={txHash}
          onRestart={handleRestartClick}
        />
      )}

      <div id='toast' className={game.toastMsg ? 'show' : ''}>
        {game.toastMsg}
      </div>
    </>
  );
}
