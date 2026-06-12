import { useEffect, useRef, useState } from 'react';

const WIDTH = 480;
const HEIGHT = 720;

const R = 15;
const ROW_GAP = 26;
const COL_GAP = 32;
const START_X = 44;
const START_Y = 56;
const COLS = 12;

const DANGER_LINE_Y = HEIGHT - 158;

const AUTO_DROP_START_MS = 10000;
const AUTO_DROP_MIN_MS = 5000;

const SHOOTER_X = WIDTH / 2;
const SHOOTER_Y = HEIGHT - 72;

const COLORS = ['#0052ff', '#22c55e', '#facc15', '#ef4444', '#a855f7'];

const LABELS = {
  '#0052ff': 'B',
  '#22c55e': 'G',
  '#facc15': 'Y',
  '#ef4444': 'R',
  '#a855f7': 'P',
};

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function randomBubbleType() {
  return Math.random() < 0.12 ? 'bomb' : 'normal';
}

function createRandomShotBubble() {
  const type = randomBubbleType();

  if (type === 'bomb') {
    return {
      type: 'bomb',
      color: '#f97316',
    };
  }

  return {
    type: 'normal',
    color: randomColor(),
  };
}

function getAutoDropMs(level, shots) {
  const difficultyBoost = (level - 1) * 500 + shots * 120;
  return Math.max(AUTO_DROP_MIN_MS, AUTO_DROP_START_MS - difficultyBoost);
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function createBubble(row, col, color = randomColor(), dropOffset = 0, type = 'normal') {
  const offset = row % 2 === 1 ? COL_GAP / 2 : 0;

  return {
    id: `${row}-${col}-${Date.now()}-${Math.random()}`,
    row,
    col,
    x: START_X + col * COL_GAP + offset,
    y: START_Y + row * ROW_GAP + dropOffset,
    color,
    type,
  };
}

function createTopRow(dropOffset = 0) {
  const bubbles = [];

  for (let col = 0; col < COLS; col++) {
    const isBomb = Math.random() < 0.05;

    bubbles.push(
      createBubble(
        0,
        col,
        isBomb ? '#f97316' : randomColor(),
        dropOffset,
        isBomb ? 'bomb' : 'normal'
      )
    );
  }

  return bubbles;
}

function createBoard(level = 1, dropOffset = 0) {
  const board = [];
  const rows = Math.min(6 + level, 9);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < COLS; col++) {
      if (row > 5 && Math.random() > 0.65) continue;

      const isBomb = Math.random() < 0.035;

      board.push(
        createBubble(
          row,
          col,
          isBomb ? '#f97316' : randomColor(),
          dropOffset,
          isBomb ? 'bomb' : 'normal'
        )
      );
    }
  }

  return board;
}

function advanceBoardSlow(board, currentDropOffset) {
  const DROP_SPEED = ROW_GAP / 6;

  let nextDropOffset = currentDropOffset + DROP_SPEED;
  let shouldAddNewRow = false;

  if (nextDropOffset >= ROW_GAP) {
    nextDropOffset = 0;
    shouldAddNewRow = true;
  }

  const moved = board.map((bubble) => {
    const newRow = shouldAddNewRow ? bubble.row + 1 : bubble.row;
    const offset = newRow % 2 === 1 ? COL_GAP / 2 : 0;

    return {
      ...bubble,
      row: newRow,
      x: START_X + bubble.col * COL_GAP + offset,
      y: START_Y + newRow * ROW_GAP + nextDropOffset,
    };
  });

  if (shouldAddNewRow) {
    return {
      board: [...createTopRow(nextDropOffset), ...moved],
      dropOffset: nextDropOffset,
    };
  }

  return {
    board: moved,
    dropOffset: nextDropOffset,
  };
}

function advanceBoardOneFullRow(board, currentDropOffset) {
  const moved = board.map((bubble) => {
    const newRow = bubble.row + 1;
    const offset = newRow % 2 === 1 ? COL_GAP / 2 : 0;

    return {
      ...bubble,
      row: newRow,
      x: START_X + bubble.col * COL_GAP + offset,
      y: START_Y + newRow * ROW_GAP + currentDropOffset,
    };
  });

  return {
    board: [...createTopRow(currentDropOffset), ...moved],
    dropOffset: currentDropOffset,
  };
}

function getGridPosition(x, y, dropOffset) {
  let row = Math.round((y - START_Y - dropOffset) / ROW_GAP);
  row = Math.max(0, Math.min(18, row));

  const offset = row % 2 === 1 ? COL_GAP / 2 : 0;

  let col = Math.round((x - START_X - offset) / COL_GAP);
  col = Math.max(0, Math.min(COLS - 1, col));

  return {
    row,
    col,
    x: START_X + col * COL_GAP + offset,
    y: START_Y + row * ROW_GAP + dropOffset,
  };
}

function getNeighbors(bubble, board) {
  const even = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
    [-1, -1],
    [-1, 1],
  ];

  const odd = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
    [1, -1],
    [1, 1],
  ];

  const dirs = bubble.row % 2 === 1 ? odd : even;

  return dirs
    .map(([dc, dr]) =>
      board.find((b) => b.row === bubble.row + dr && b.col === bubble.col + dc)
    )
    .filter(Boolean);
}

function findCluster(start, board) {
  const visited = new Set();
  const cluster = [];
  const queue = [start];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) continue;
    if (visited.has(current.id)) continue;
    if (current.type === 'bomb') continue;
    if (current.color !== start.color) continue;

    visited.add(current.id);
    cluster.push(current);

    const neighbors = getNeighbors(current, board);

    for (const n of neighbors) {
      if (!visited.has(n.id) && n.type !== 'bomb' && n.color === start.color) {
        queue.push(n);
      }
    }
  }

  return cluster;
}

function findFloating(board) {
  const connected = new Set();
  const top = board.filter((b) => b.row === 0);
  const queue = [...top];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) continue;
    if (connected.has(current.id)) continue;

    connected.add(current.id);

    const neighbors = getNeighbors(current, board);

    for (const n of neighbors) {
      if (!connected.has(n.id)) {
        queue.push(n);
      }
    }
  }

  return board.filter((b) => !connected.has(b.id));
}

function normalizeAngle(angle) {
  const min = -Math.PI + 0.3;
  const max = -0.3;

  if (angle < min) return min;
  if (angle > max) return max;

  return angle;
}

function playTone(type) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audio = new AudioContext();

    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.connect(gain);
    gain.connect(audio.destination);

    if (type === 'shoot') {
      osc.frequency.value = 520;
      gain.gain.value = 0.05;
      osc.type = 'sine';
      osc.start();
      osc.stop(audio.currentTime + 0.06);
    }

    if (type === 'pop') {
      osc.frequency.value = 880;
      gain.gain.value = 0.06;
      osc.type = 'triangle';
      osc.start();
      osc.stop(audio.currentTime + 0.12);
    }

    if (type === 'bomb') {
      osc.frequency.value = 120;
      gain.gain.value = 0.1;
      osc.type = 'sawtooth';
      osc.start();
      osc.stop(audio.currentTime + 0.18);
    }

    if (type === 'lose') {
      osc.frequency.value = 180;
      gain.gain.value = 0.08;
      osc.type = 'sawtooth';
      osc.start();
      osc.stop(audio.currentTime + 0.22);
    }
  } catch {
    // ignore audio errors
  }
}

export default function App() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const boardRef = useRef([]);
  const projectileRef = useRef(null);
  const angleRef = useRef(-Math.PI / 2);

  const currentBubbleRef = useRef(createRandomShotBubble());
  const nextBubbleRef = useRef(createRandomShotBubble());

  const particlesRef = useRef([]);
  const dropOffsetRef = useRef(0);
  const lastAutoDropRef = useRef(performance.now());

  const [level, setLevel] = useState(1);
  const [board, setBoard] = useState(() => createBoard(1, 0));
  const [projectile, setProjectile] = useState(null);
  const [angle, setAngle] = useState(-Math.PI / 2);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    return Number(localStorage.getItem('elnino_bubble_best')) || 0;
  });
  const [shots, setShots] = useState(0);
  const [gameState, setGameState] = useState('ready');
  const [message, setMessage] = useState('Aim, shoot, match 3 bubbles.');

  const currentAutoDropMs = getAutoDropMs(level, shots);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    projectileRef.current = projectile;
  }, [projectile]);

  useEffect(() => {
    angleRef.current = angle;
  }, [angle]);

  function updateBest(value) {
    const oldBest = Number(localStorage.getItem('elnino_bubble_best')) || 0;

    if (value > oldBest) {
      setBestScore(value);
      localStorage.setItem('elnino_bubble_best', String(value));
    }
  }

  function resetShotBubbles() {
    currentBubbleRef.current = createRandomShotBubble();
    nextBubbleRef.current = createRandomShotBubble();
  }

  function checkDanger(boardToCheck, finalScore) {
    if (boardToCheck.some((b) => b.y + R >= DANGER_LINE_Y)) {
      loseGame(finalScore);
      return true;
    }

    return false;
  }

  function startGame() {
    const newLevel = 1;
    dropOffsetRef.current = 0;
    lastAutoDropRef.current = performance.now();

    const newBoard = createBoard(newLevel, dropOffsetRef.current);

    boardRef.current = newBoard;
    setBoard(newBoard);

    projectileRef.current = null;
    setProjectile(null);

    particlesRef.current = [];
    resetShotBubbles();

    setLevel(newLevel);
    setScore(0);
    setShots(0);
    setMessage('Aim with mouse, click to shoot.');
    setGameState('playing');
  }

  function nextLevel(currentScore) {
    const newLevel = level + 1;
    dropOffsetRef.current = 0;
    lastAutoDropRef.current = performance.now();

    const newBoard = createBoard(newLevel, dropOffsetRef.current);

    boardRef.current = newBoard;
    setBoard(newBoard);

    projectileRef.current = null;
    setProjectile(null);

    particlesRef.current = [];
    resetShotBubbles();

    setLevel(newLevel);
    setMessage(`Level ${newLevel}. More bubbles, more points.`);
    setGameState('playing');
    updateBest(currentScore);
  }

  function createExplosion(bubbles, sizeBoost = 1) {
    const particles = [];

    for (const bubble of bubbles) {
      for (let i = 0; i < 8 * sizeBoost; i++) {
        const angleValue = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3.5;

        particles.push({
          x: bubble.x,
          y: bubble.y,
          vx: Math.cos(angleValue) * speed,
          vy: Math.sin(angleValue) * speed,
          life: 28,
          color: bubble.type === 'bomb' ? '#f97316' : bubble.color,
          size: 2 + Math.random() * 3,
        });
      }
    }

    particlesRef.current = [...particlesRef.current, ...particles];
  }

  function shoot() {
    if (gameState !== 'playing') return;
    if (projectileRef.current) return;

    playTone('shoot');

    const speed = 8.5;
    const bubble = currentBubbleRef.current;

    const p = {
      x: SHOOTER_X,
      y: SHOOTER_Y,
      vx: Math.cos(angleRef.current) * speed,
      vy: Math.sin(angleRef.current) * speed,
      color: bubble.color,
      type: bubble.type,
    };

    projectileRef.current = p;
    setProjectile(p);

    currentBubbleRef.current = nextBubbleRef.current;
    nextBubbleRef.current = createRandomShotBubble();

    setShots((v) => v + 1);
  }

  function loseGame(finalScore) {
    playTone('lose');
    updateBest(finalScore);
    setGameState('gameover');
    setMessage('Game over. The bubbles touched the red line.');
  }

  function autoDropBoard() {
    if (gameState !== 'playing') return;
    if (projectileRef.current) return;

    const advanced = advanceBoardOneFullRow(boardRef.current, dropOffsetRef.current);

    dropOffsetRef.current = advanced.dropOffset;
    boardRef.current = advanced.board;
    setBoard(advanced.board);
    setMessage('The board dropped one row. Keep hunting.');

    checkDanger(advanced.board, score);
  }

  function attachProjectile(p) {
    const pos = getGridPosition(p.x, p.y, dropOffsetRef.current);

    const newBubble = {
      id: `${pos.row}-${pos.col}-${Date.now()}-${Math.random()}`,
      row: pos.row,
      col: pos.col,
      x: pos.x,
      y: pos.y,
      color: p.color,
      type: p.type,
    };

    let newBoard = boardRef.current.filter(
      (b) => !(b.row === newBubble.row && b.col === newBubble.col)
    );

    newBoard.push(newBubble);

    let gained = 0;

    if (newBubble.type === 'bomb') {
      playTone('bomb');

      const blastRadius = R * 4.1;
      const blasted = newBoard.filter((b) => dist(b, newBubble) <= blastRadius);
      const blastedIds = new Set(blasted.map((b) => b.id));

      newBoard = newBoard.filter((b) => !blastedIds.has(b.id));

      const floating = findFloating(newBoard);
      const floatingIds = new Set(floating.map((b) => b.id));

      newBoard = newBoard.filter((b) => !floatingIds.has(b.id));

      createExplosion([...blasted, ...floating], 2);

      gained = blasted.length * 15 + floating.length * 20 + level * 10;

      setScore((oldScore) => {
        const newScore = oldScore + gained;
        updateBest(newScore);
        return newScore;
      });

      setMessage(`Bomb blast! +${gained} points`);
    } else {
      const cluster = findCluster(newBubble, newBoard);

      if (cluster.length >= 3) {
        playTone('pop');

        const removeIds = new Set(cluster.map((b) => b.id));
        newBoard = newBoard.filter((b) => !removeIds.has(b.id));

        const floating = findFloating(newBoard);
        const floatingIds = new Set(floating.map((b) => b.id));

        newBoard = newBoard.filter((b) => !floatingIds.has(b.id));

        createExplosion([...cluster, ...floating], 1);

        gained = cluster.length * 10 + floating.length * 20 + level * 5;

        setScore((oldScore) => {
          const newScore = oldScore + gained;
          updateBest(newScore);
          return newScore;
        });

        setMessage(`Nice shot! +${gained} points`);
      } else {
        setMessage('No match. Board moved down slowly.');
      }
    }

    projectileRef.current = null;
    setProjectile(null);

    const finalScore = score + gained;

    if (newBoard.length === 0) {
      const levelScore = finalScore + 100 * level;
      boardRef.current = [];
      setBoard([]);
      setScore(levelScore);
      updateBest(levelScore);
      setMessage('Perfect clear. Next level incoming.');
      setTimeout(() => nextLevel(levelScore), 800);
      return;
    }

    const advanced = advanceBoardSlow(newBoard, dropOffsetRef.current);

    dropOffsetRef.current = advanced.dropOffset;
    newBoard = advanced.board;

    boardRef.current = newBoard;
    setBoard(newBoard);

    checkDanger(newBoard, finalScore);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function mouseMove(e) {
      const rect = canvas.getBoundingClientRect();

      const scaleX = WIDTH / rect.width;
      const scaleY = HEIGHT / rect.height;

      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      const newAngle = normalizeAngle(
        Math.atan2(mouseY - SHOOTER_Y, mouseX - SHOOTER_X)
      );

      setAngle(newAngle);
      angleRef.current = newAngle;
    }

    function touchMove(e) {
      e.preventDefault();

      const touch = e.touches[0];
      if (!touch) return;

      mouseMove({
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
    }

    function touchEnd(e) {
      e.preventDefault();
      shoot();
    }

    canvas.addEventListener('mousemove', mouseMove);
    canvas.addEventListener('click', shoot);
    canvas.addEventListener('touchmove', touchMove, { passive: false });
    canvas.addEventListener('touchend', touchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('mousemove', mouseMove);
      canvas.removeEventListener('click', shoot);
      canvas.removeEventListener('touchmove', touchMove);
      canvas.removeEventListener('touchend', touchEnd);
    };
  }, [gameState, score, level]);

  useEffect(() => {
    function loop(now) {
      const current = projectileRef.current;
      const autoDropMs = getAutoDropMs(level, shots);

      if (gameState === 'playing') {
        if (!current && now - lastAutoDropRef.current >= autoDropMs) {
          lastAutoDropRef.current = now;
          autoDropBoard();
        }
      }

      if (current && gameState === 'playing') {
        let p = {
          ...current,
          x: current.x + current.vx,
          y: current.y + current.vy,
        };

        if (p.x <= R || p.x >= WIDTH - R) {
          p.vx *= -1;
          p.x = Math.max(R, Math.min(WIDTH - R, p.x));
        }

        const hitTop = p.y <= R + 8;

        const hitBubble = boardRef.current.find((b) => dist(p, b) <= R * 2 - 2);

        if (hitTop || hitBubble) {
          attachProjectile(p);
        } else {
          projectileRef.current = p;
          setProjectile(p);
        }
      }

      updateParticles();
      draw(now);
      animationRef.current = requestAnimationFrame(loop);
    }

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, score, level, shots]);

  function updateParticles() {
    particlesRef.current = particlesRef.current
      .map((p) => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.05,
        life: p.life - 1,
      }))
      .filter((p) => p.life > 0);
  }

  function drawBubble(ctx, bubble, glow = false) {
    ctx.save();

    if (glow) {
      ctx.shadowBlur = bubble.type === 'bomb' ? 24 : 16;
      ctx.shadowColor = bubble.type === 'bomb' ? '#f97316' : bubble.color;
    }

    if (bubble.type === 'bomb') {
      const gradient = ctx.createRadialGradient(
        bubble.x - 5,
        bubble.y - 7,
        4,
        bubble.x,
        bubble.y,
        R
      );

      gradient.addColorStop(0, '#fff7ed');
      gradient.addColorStop(0.3, '#f97316');
      gradient.addColorStop(1, '#7c2d12');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, R, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'white';
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✦', bubble.x, bubble.y + 1);

      ctx.restore();
      return;
    }

    const gradient = ctx.createRadialGradient(
      bubble.x - 5,
      bubble.y - 7,
      4,
      bubble.x,
      bubble.y,
      R
    );

    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.25, bubble.color);
    gradient.addColorStop(1, '#020617');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, R, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(LABELS[bubble.color] || 'B', bubble.x, bubble.y);

    ctx.restore();
  }

  function drawParticles(ctx) {
    for (const p of particlesRef.current) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / 28);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawBackground(ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);

    bg.addColorStop(0, '#06245f');
    bg.addColorStop(0.58, '#06142f');
    bg.addColorStop(1, '#020617');

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i < 36; i++) {
      const x = (i * 83) % WIDTH;
      const y = (i * 137) % HEIGHT;

      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(239,68,68,0.16)';
    ctx.fillRect(0, DANGER_LINE_Y, WIDTH, HEIGHT - DANGER_LINE_Y);

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(0, DANGER_LINE_Y, WIDTH, 2);

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('DANGER LINE', WIDTH - 16, DANGER_LINE_Y - 8);
  }

  function drawDropTimer(ctx, now) {
    if (gameState !== 'playing') return;

    const autoDropMs = getAutoDropMs(level, shots);
    const elapsed = Math.min(autoDropMs, now - lastAutoDropRef.current);
    const progress = elapsed / autoDropMs;

    const x = 24;
    const y = HEIGHT - 128;
    const w = 150;
    const h = 8;

    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x, y, w * progress, h);

    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`AUTO DROP ${Math.ceil(autoDropMs / 1000)}S`, x, y - 6);
  }

  function drawAimLine(ctx) {
    ctx.save();

    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = 'rgba(255,255,255,0.36)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(SHOOTER_X, SHOOTER_Y);
    ctx.lineTo(
      SHOOTER_X + Math.cos(angleRef.current) * 180,
      SHOOTER_Y + Math.sin(angleRef.current) * 180
    );
    ctx.stroke();

    ctx.restore();
  }

  function drawShooter(ctx) {
    ctx.save();

    ctx.translate(SHOOTER_X, SHOOTER_Y);
    ctx.rotate(angleRef.current);

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.fillRect(0, -7, 68, 14);
    ctx.strokeRect(0, -7, 68, 14);

    ctx.restore();

    ctx.fillStyle = '#0052ff';
    ctx.beginPath();
    ctx.arc(SHOOTER_X, SHOOTER_Y, 25, 0, Math.PI * 2);
    ctx.fill();

    drawBubble(
      ctx,
      {
        x: SHOOTER_X,
        y: SHOOTER_Y,
        color: currentBubbleRef.current.color,
        type: currentBubbleRef.current.type,
      },
      true
    );
  }

  function drawNextBubble(ctx) {
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('NEXT', WIDTH - 58, HEIGHT - 102);

    drawBubble(
      ctx,
      {
        x: WIDTH - 58,
        y: HEIGHT - 74,
        color: nextBubbleRef.current.color,
        type: nextBubbleRef.current.type,
      },
      true
    );
  }

  function drawHud(ctx, now) {
    drawDropTimer(ctx, now);
  }

  function draw(now = performance.now()) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    drawBackground(ctx);

    for (const bubble of boardRef.current) {
      drawBubble(ctx, bubble);
    }

    drawParticles(ctx);
    drawAimLine(ctx);

    if (projectileRef.current) {
      drawBubble(ctx, projectileRef.current, true);
    }

    drawShooter(ctx);
    drawNextBubble(ctx);
    drawHud(ctx, now);
  }

  return (
    <main className="page">
      <section className="game-shell">
        <div className="game-header">
          <div>
            <h1>Elnino Bubble Hunt</h1>
            <p>{message}</p>
          </div>

          <div className="score-card">
            <span>Score</span>
            <strong>{score}</strong>
            <small>Best: {bestScore}</small>
            <small>Level: {level} | Shots: {shots}</small>
            <small>Drop: {Math.ceil(currentAutoDropMs / 1000)}s</small>
          </div>
        </div>

        <div className="canvas-wrap">
          <canvas
            ref={canvasRef}
            width={WIDTH}
            height={HEIGHT}
            className="game-canvas"
          />

          {gameState !== 'playing' && (
            <div className="menu">
              {gameState === 'ready' && (
                <div>
                  <h2>Ready to Hunt?</h2>
                  <p>
                    Match 3 bubbles to clear them. Bomb bubbles destroy a small
                    area. The board drops faster as you survive longer.
                  </p>
                  <button onClick={startGame}>Start Game</button>
                </div>
              )}

              {gameState === 'gameover' && (
                <div>
                  <h2>Game Over</h2>
                  <p>Your final score is {score}</p>
                  <button onClick={startGame}>Play Again</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="game-footer">
          <span>Theme: Base Builder</span>
          <span>PC: mouse aim + click</span>
          <span>Bombs: clear small area</span>
        </div>
      </section>
    </main>
  );
}