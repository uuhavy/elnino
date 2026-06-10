import { useEffect, useRef, useState } from 'react';
import { Game, Point, setGame, ut } from '../game/slitherEngine';

export function useGameEngine({ onPayEndFee }) {
  const engineRef = useRef({});

  const [gameState, setGameState] = useState('loading');
  const [loadMsg, setLoadMsg] = useState('Loading Slither Engine...');
  const [loadProgress, setLoadProgress] = useState(0);
  const [score, setScore] = useState(0); 
  const [finalScore, setFinalScore] = useState(0);

  useEffect(() => {
    let t1 = setTimeout(() => {
      setLoadProgress(50);
    }, 200);
    let t2 = setTimeout(() => {
      setLoadProgress(100);
      setGameState('ready');
      setLoadMsg('');
    }, 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    initSlither();
  };

  const restartGame = () => {
    setGameState('playing');
    setScore(0);
    initSlither();
  };

  const initSlither = () => {
    const cnvSnake = document.getElementById('canvasSnake');
    const cnvFood = document.getElementById('canvasFood');
    const cnvHex = document.getElementById('canvasHex');

    if (!cnvSnake || !cnvFood || !cnvHex) return;

    // Resize to fit screen
    cnvSnake.width = window.innerWidth;
    cnvSnake.height = window.innerHeight;
    cnvFood.width = window.innerWidth;
    cnvFood.height = window.innerHeight;
    cnvHex.width = window.innerWidth;
    cnvHex.height = window.innerHeight;

    const ctxSnake = cnvSnake.getContext('2d');
    const ctxFood = cnvFood.getContext('2d');
    const ctxHex = cnvHex.getContext('2d');

    const game = new Game(ctxSnake, ctxFood, ctxHex);
    setGame(game);

    game.onDeath = async () => {
      setGameState('gameover');
      setFinalScore(game.snakes[0] ? game.snakes[0].score : 0);
      cancelAnimationFrame(engineRef.current.updateId);
      if (onPayEndFee) {
        await onPayEndFee();
      }
    };

    let isPressing = false;
    let cursor = new Point(0, 0);

    const updateDirection = (clientX, clientY) => {
        if(!game.snakes[0] || game.snakes[0].state !== 0) return;
        const rect = cnvSnake.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        cursor = new Point(x, y);
        const ang = ut.getAngle(game.snakes[0].arr[0], cursor);
        game.snakes[0].changeAngle(ang);
    };

    cnvSnake.onmousemove = (e) => {
        if (isPressing) updateDirection(e.clientX, e.clientY);
    };
    cnvSnake.onmousedown = (e) => {
        isPressing = true;
        updateDirection(e.clientX, e.clientY);
    };
    cnvSnake.onmouseup = () => { isPressing = false; };
    cnvSnake.onmouseleave = () => { isPressing = false; };

    // Touch support for mobile
    cnvSnake.ontouchstart = (e) => {
        isPressing = true;
        updateDirection(e.touches[0].clientX, e.touches[0].clientY);
    };
    cnvSnake.ontouchmove = (e) => {
        if (isPressing) updateDirection(e.touches[0].clientX, e.touches[0].clientY);
        e.preventDefault(); 
    };
    cnvSnake.ontouchend = () => { isPressing = false; };

    document.body.style.touchAction = 'none';

    game.init();

    let previousDelta = performance.now();
    const fpsLimit = 40; 

    const update = (currentDelta) => {
        engineRef.current.updateId = requestAnimationFrame(update);
        const delta = currentDelta - previousDelta;
        if (fpsLimit && delta < 1000 / fpsLimit) return;
        previousDelta = currentDelta;

        ctxFood.clearRect(0, 0, cnvSnake.width, cnvSnake.height);
        ctxSnake.clearRect(0, 0, cnvSnake.width, cnvSnake.height);
        ctxHex.clearRect(0, 0, cnvSnake.width, cnvSnake.height);

        game.draw();

        if (game.snakes[0] && game.snakes[0].state === 0) {
            setScore(game.snakes[0].score);
        }
    };

    engineRef.current.updateId = requestAnimationFrame(update);
  };

  useEffect(() => {
    return () => {
        if (engineRef.current.updateId) {
            cancelAnimationFrame(engineRef.current.updateId);
        }
    };
  }, []);

  return {
    gameState,
    loadMsg,
    loadProgress,
    score,
    finalScore,
    startGame,
    restartGame,
  };
}
