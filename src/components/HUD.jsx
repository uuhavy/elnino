import React from 'react';

export default function HUD({ score, coins, combo, distance }) {
  return (
    <div id="hud" style={{ display: 'block' }}>
      <div id="score-wrap">
        <div id="score-board">{score}</div>
        <div id="score-label">SCORE</div>
      </div>
      <div id="coin-wrap">
        <div className="coin-icon">C</div>
        <div id="coin-count">{coins}</div>
      </div>
      <div id="combo-wrap">
        <div id="combo-board">x{combo}</div>
      </div>
      <div id="dist-wrap">
        <div id="dist-label">DIST</div>
        <div id="dist-board">{distance}m</div>
      </div>
    </div>
  );
}
