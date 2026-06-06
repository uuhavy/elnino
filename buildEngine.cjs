const fs = require('fs');

const indexContent = fs.readFileSync('index.html.bak', 'utf8');
const parts = indexContent.split('<script type="module">');
if (parts.length < 2) {
  console.log('Failed to find module script');
  process.exit(1);
}

let code = parts[1].split('</script>')[0];

code = code.replace(/import \* as THREE.*?;\n/g, '');
code = code.replace(/import \{ GLTFLoader \}.*?;\n/g, '');
code = code.replace(/import \* as SkeletonUtils.*?;\n/g, '');
code = code.replace(/import \{ ethers \} from 'ethers';\n/g, '');
code = code.replace(/\/\/ ===== BASE MAINNET CONFIG =====[\s\S]*?const LANE_XS/g, 'const LANE_XS');

const replacements = [
  [/document\.getElementById\('game-container'\)\.appendChild\(renderer\.domElement\);/g, 'container.appendChild(renderer.domElement);'],
  [/bar\.style\.width = .*?;/g, 'setLoadProgress((done / total) * 100);'],
  [/msg\.textContent = (.*?);/g, 'setLoadMsg($1);'],
  [/document\.getElementById\('loading-msg'\)\.textContent = '🏁 Ready!';/g, 'setLoadMsg(\'🏁 Ready!\'); setGameState(\'ready\');'],
  [/document\.getElementById\('btn-play'\)\.style\.display = 'block';/g, ''],
  [/document\.getElementById\('btn-play'\)\.addEventListener.*?;/g, ''],
  [/document\.getElementById\('btn-wallet'\)\.addEventListener.*?;/g, ''],
  [/document\.getElementById\('score-board'\)\.textContent = Math\.floor\(score\);/g, 'setScore(Math.floor(score));'],
  [/document\.getElementById\('coin-count'\)\.textContent = coins;/g, 'setCoins(coins);'],
  [/document\.getElementById\('combo-board'\)\.textContent = 'x' \+ combo;/g, 'setCombo(combo);'],
  [/document\.getElementById\('dist-board'\)\.textContent = Math\.floor\(distance\) \+ 'm';/g, 'setDistance(Math.floor(distance));'],
  [/const t = document\.getElementById\('toast'\);[\s\S]*?\}, dur\);/g, 'setToastMsg(msg); setTimeout(() => setToastMsg(\'\'), dur);'],
  [/const b = document\.getElementById\('btn-mute'\);\s*b\.textContent = m \? '🔇' : '🔊';/g, 'setIsMuted(m);'],
  [/document\.getElementById\('pause-overlay'\)\.style\.display = (.*?);/g, 'setGameState($1 === \'flex\' ? \'paused\' : \'playing\');'],
  [/document\.getElementById\('game-over-screen'\)\.style\.display = 'flex';/g, 'setGameState(\'gameover\'); setFinalScore(Math.floor(score)); setFinalCoins(coins); setFinalCombo(combo);'],
  [/document\.getElementById\('final-score'\)\.textContent = Math\.floor\(score\);/g, ''],
  [/document\.getElementById\('final-coins'\)\.textContent = coins;/g, ''],
  [/document\.getElementById\('final-combo'\)\.textContent = 'x' \+ combo;/g, ''],
  [/document\.getElementById\('hud'\)\.style\.display = (.*?);/g, ''],
  [/document\.getElementById\('hud-controls'\)\.style\.display = (.*?);/g, ''],
  [/document\.getElementById\('mobile-controls'\)\.style\.display = (.*?);/g, ''],
  [/document\.getElementById\('speed-lines'\)\.style\.display = (.*?);/g, ''],
  [/document\.getElementById\('go-tx-wrap'\)\.style\.display = 'none';/g, ''],
  [/if \(web3Wallet\) \{ setFeeStatus\('paying'\); payEndFee\(\); \}/g, 'if (onPayEndFee) onPayEndFee();'],
  [/function startGame\(\) \{/g, 'engineRef.current.startGame = async function startGame() {\n  setGameState(\'playing\');'],
  [/document\.getElementById\('loading-screen'\)\.style\.display = 'none';/g, ''],
  [/document\.getElementById\('btn-restart'\)\.addEventListener[\s\S]*?startGame\(\);\s*\}\);/g, ''],
  [/const volEl = document\.getElementById\('vol'\);[\s\S]*?Aud\.setVol\(parseInt\(volEl\.value\) \/ 100\),\s*\);/g, ''],
  [/document\.getElementById\('btn-mute'\)\.addEventListener\('click', \(\) => Aud\.toggleMute\(\)\);/g, ''],
  [/const mJump = document\.getElementById\('mb-jump'\);[\s\S]*?passive: false,\s*\}\);/g, ''],
];

for (const [regex, repl] of replacements) {
  code = code.replace(regex, repl);
}

const header = `import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export function useGameEngine({ onPayEndFee }) {
  const containerRef = useRef(null);
  const engineRef = useRef({});

  const [gameState, setGameState] = useState('loading');
  const [loadMsg, setLoadMsg] = useState('');
  const [loadProgress, setLoadProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [combo, setCombo] = useState(1);
  const [distance, setDistance] = useState(0);
  const [toastMsg, setToastMsg] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalCoins, setFinalCoins] = useState(0);
  const [finalCombo, setFinalCombo] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
`;

const footer = `
    engineRef.current.restartGame = function() {
      setGameState('ready');
      initMap();
      coins = 0;
      score = 0;
      totalDist = 0;
      combo = 1;
      p.spd = cfg.spdStart;
      isOver = false;
      isRunning = false;
      if (player) {
        player.position.set(LANE_XS[1], footOff, 30);
        playAnim('run');
      }
      if (guard) {
        guard.position.set(LANE_XS[1], footOff, player.position.z - 1.5);
      }
    };
    
    engineRef.current.togglePause = function() {
      if (!isRunning || isOver) return;
      isPaused = !isPaused;
      if (!isPaused) lastTime = performance.now();
      setGameState(isPaused ? 'paused' : 'playing');
    };
    
    engineRef.current.setVolume = function(v) {
      Aud.setVol(v);
    };
    
    engineRef.current.toggleMute = function() {
      Aud.toggleMute();
    };
    
    engineRef.current.handleInput = function(action) {
      if (isPaused || isOver || !isRunning) return;
      if (action === 'jump') handleInput('jump');
      if (action === 'roll') handleInput('roll');
      if (action === 'left') handleInput('left');
      if (action === 'right') handleInput('right');
    };

    return () => {
      isRunning = false;
      isOver = true;
      if (typeof renderer !== 'undefined') renderer.dispose();
      if (typeof Aud !== 'undefined') Aud.ctx?.close();
    };
  }, [onPayEndFee]);

  return {
    containerRef,
    gameState,
    setGameState,
    loadMsg,
    loadProgress,
    score, coins, combo, distance, toastMsg,
    finalScore, finalCoins, finalCombo,
    isMuted,
    startGame: () => engineRef.current.startGame && engineRef.current.startGame(),
    restartGame: () => engineRef.current.restartGame && engineRef.current.restartGame(),
    togglePause: () => engineRef.current.togglePause && engineRef.current.togglePause(),
    setVolume: (v) => engineRef.current.setVolume && engineRef.current.setVolume(v),
    toggleMute: () => engineRef.current.toggleMute && engineRef.current.toggleMute(),
    handleInput: (act) => engineRef.current.handleInput && engineRef.current.handleInput(act)
  };
}
`;

fs.writeFileSync('src/hooks/useGameEngine.js', header + code + footer);
console.log('Successfully created src/hooks/useGameEngine.js');
