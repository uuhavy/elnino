import { useEffect, useRef, useState } from 'react';

const WIDTH = 480;
const HEIGHT = 720;

const R = 18;
const ROW_GAP = 31;
const COL_GAP = 38;
const START_X = 50;
const START_Y = 58;
const ROWS = 8;
const COLS = 10;

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

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function createBoard() {
  const board = [];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (row > 5 && Math.random() > 0.55) continue;

      const offset = row % 2 === 1 ? COL_GAP / 2 : 0;

      board.push({
        id: `${row}-${col}-${Math.random()}`,
        row,
        col,
        x: START_X + col * COL_GAP + offset,
        y: START_Y + row * ROW_GAP,
        color: randomColor(),
      });
    }
  }

  return board;
}

function getGridPosition(x, y) {
  let row = Math.round((y - START_Y) / ROW_GAP);
  row = Math.max(0, Math.min(15, row));

  const offset = row % 2 === 1 ? COL_GAP / 2 : 0;

  let col = Math.round((x - START_X - offset) / COL_GAP);
  col = Math.max(0, Math.min(COLS - 1, col));

  return {
    row,
    col,
    x: START_X + col * COL_GAP + offset,
    y: START_Y + row * ROW_GAP,
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
    if (current.color !== start.color) continue;

    visited.add(current.id);
    cluster.push(current);

    const neighbors = getNeighbors(current, board);
    for (const n of neighbors) {
      if (!visited.has(n.id) && n.color === start.color) {
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

export default function App() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const boardRef = useRef([]);
  const projectileRef = useRef(null);
  const angleRef = useRef(-Math.PI / 2);
  const nextColorRef = useRef(randomColor());

  const [board, setBoard] = useState(() => createBoard());
  const [projectile, setProjectile] = useState(null);
  const [angle, setAngle] = useState(-Math.PI / 2);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    return Number(localStorage.getItem('elnino_bubble_best')) || 0;
  });
  const [shots, setShots] = useState(0);
  const [gameState, setGameState] = useState('ready');
  const [message, setMessage] = useState('Aim, shoot, match 3 bubbles.');

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

  function startGame() {
    const newBoard = createBoard();

    boardRef.current = newBoard;
    setBoard(newBoard);

    projectileRef.current = null;
    setProjectile(null);

    nextColorRef.current = randomColor();

    setScore(0);
    setShots(0);
    setMessage('Aim with mouse, click to shoot.');
    setGameState('playing');
  }

  function shoot() {
    if (gameState !== 'playing') return;
    if (projectileRef.current) return;

    const speed = 8;

    const p = {
      x: SHOOTER_X,
      y: SHOOTER_Y,
      vx: Math.cos(angleRef.current) * speed,
      vy: Math.sin(angleRef.current) * speed,
      color: nextColorRef.current,
    };

    projectileRef.current = p;
    setProjectile(p);

    nextColorRef.current = randomColor();

    setShots((v) => v + 1);
  }

  function attachProjectile(p) {
    const pos = getGridPosition(p.x, p.y);

    const newBubble = {
      id: `${pos.row}-${pos.col}-${Date.now()}-${Math.random()}`,
      row: pos.row,
      col: pos.col,
      x: pos.x,
      y: pos.y,
      color: p.color,
    };

    let newBoard = boardRef.current.filter(
      (b) => !(b.row === newBubble.row && b.col === newBubble.col)
    );

    newBoard.push(newBubble);

    const cluster = findCluster(newBubble, newBoard);
    let gained = 0;

    if (cluster.length >= 3) {
      const removeIds = new Set(cluster.map((b) => b.id));
      newBoard = newBoard.filter((b) => !removeIds.has(b.id));

      const floating = findFloating(newBoard);
      const floatingIds = new Set(floating.map((b) => b.id));

      newBoard = newBoard.filter((b) => !floatingIds.has(b.id));

      gained = cluster.length * 10 + floating.length * 20;

      setScore((oldScore) => {
        const newScore = oldScore + gained;
        updateBest(newScore);
        return newScore;
      });

      setMessage(`Nice shot! +${gained} points`);
    } else {
      setMessage('No match. Try another angle.');
    }

    boardRef.current = newBoard;
    setBoard(newBoard);

    projectileRef.current = null;
    setProjectile(null);

    if (newBoard.some((b) => b.y > HEIGHT - 180)) {
      updateBest(score + gained);
      setGameState('gameover');
      setMessage('Game over. The bubbles reached your zone.');
    }

    if (newBoard.length === 0) {
      updateBest(score + gained);
      setGameState('win');
      setMessage('Perfect clear.');
    }
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
  }, [gameState, score]);

  useEffect(() => {
    function loop() {
      const current = projectileRef.current;

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

      draw();
      animationRef.current = requestAnimationFrame(loop);
    }

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, score]);

  function drawBubble(ctx, bubble, glow = false) {
    ctx.save();

    if (glow) {
      ctx.shadowBlur = 16;
      ctx.shadowColor = bubble.color;
    }

    const gradient = ctx.createRadialGradient(
      bubble.x - 6,
      bubble.y - 8,
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
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(LABELS[bubble.color] || 'B', bubble.x, bubble.y);

    ctx.restore();
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
    ctx.fillRect(0, HEIGHT - 156, WIDTH, 156);

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, HEIGHT - 158, WIDTH, 2);
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
    ctx.fillRect(0, -8, 72, 16);
    ctx.strokeRect(0, -8, 72, 16);

    ctx.restore();

    ctx.fillStyle = '#0052ff';
    ctx.beginPath();
    ctx.arc(SHOOTER_X, SHOOTER_Y, 28, 0, Math.PI * 2);
    ctx.fill();

    drawBubble(
      ctx,
      {
        x: SHOOTER_X,
        y: SHOOTER_Y,
        color: nextColorRef.current,
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
        color: nextColorRef.current,
      },
      true
    );
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    drawBackground(ctx);

    for (const bubble of boardRef.current) {
      drawBubble(ctx, bubble);
    }

    drawAimLine(ctx);

    if (projectileRef.current) {
      drawBubble(ctx, projectileRef.current, true);
    }

    drawShooter(ctx);
    drawNextBubble(ctx);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 32);

    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = 'bold 13px Arial';
    ctx.fillText(`Best: ${bestScore}`, 20, 54);
    ctx.fillText(`Shots: ${shots}`, 20, 74);
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
                    Move your mouse to aim. Click to shoot. Match 3 bubbles to
                    clear them.
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

              {gameState === 'win' && (
                <div>
                  <h2>Perfect Clear</h2>
                  <p>You cleared the full board. Final score: {score}</p>
                  <button onClick={startGame}>Play Again</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="game-footer">
          <span>Theme: Base Builder</span>
          <span>PC: mouse aim + click</span>
          <span>Mobile: drag + release</span>
        </div>
      </section>
    </main>
  );
}