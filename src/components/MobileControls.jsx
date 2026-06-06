import React from 'react';

export default function MobileControls({ onInput }) {
  const handleInput = (action, event) => {
    event.preventDefault();
    onInput(action);
  };

  return (
    <div id='mobile-controls' style={{ display: 'flex' }}>
      <div id='mobile-row'>
        <button
          type='button'
          className='m-btn'
          id='mb-left'
          onClick={(e) => handleInput('left', e)}
          onTouchStart={(e) => handleInput('left', e)}
        >
          ←
        </button>
        <button
          type='button'
          className='m-btn'
          id='mb-right'
          onClick={(e) => handleInput('right', e)}
          onTouchStart={(e) => handleInput('right', e)}
        >
          →
        </button>
      </div>
      <div id='mobile-row'>
        <button
          type='button'
          className='m-btn'
          id='mb-roll'
          onClick={(e) => handleInput('roll', e)}
          onTouchStart={(e) => handleInput('roll', e)}
        >
          ▼
        </button>
        <button
          type='button'
          className='m-btn'
          id='mb-jump'
          onClick={(e) => handleInput('jump', e)}
          onTouchStart={(e) => handleInput('jump', e)}
        >
          ▲
        </button>
      </div>
    </div>
  );
}
