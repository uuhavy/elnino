import React from 'react';

export default function PauseOverlay() {
  return (
    <div id="pause-overlay" style={{ display: 'flex' }}>
      <div className="pause-box">
        <div className="pause-title">PAUSED</div>
        <div className="pause-hint">Press 'P' to resume</div>
      </div>
    </div>
  );
}
