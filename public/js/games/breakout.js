import { createCanvas, createLoop, trackKeys, pointerPos, clamp } from '../engine.js';

const W = 480;
const H = 560;
const COLS = 8;
const ROWS = 6;
const BRICK_H = 20;
const GAP = 4;
const TOP = 60;
const PAD_W = 80;
const PAD_H = 12;
const R = 6;
const COLORS = ['#f472b6', '#fb923c', '#fbbf24', '#a3e635', '#5eead4', '#60a5fa'];

export default {
  id: 'breakout',
  title: 'Brick Breaker',
  icon: '🧱',
  description: 'Bounce the ball off your paddle to smash every brick. Three lives per run.',
  help: 'Move with <kbd>←</kbd>/<kbd>→</kbd>, <kbd>A</kbd>/<kbd>D</kbd>, or the mouse / touch. <kbd>Space</kbd> launches & pauses.',

  mount(root, api) {
    const { canvas, ctx } = createCanvas(W, H);
    root.append(canvas);

    const pad = { x: W / 2 - PAD_W / 2 };
    const ball = { x: 0, y: 0, vx: 0, vy: 0, stuck: true };
    let bricks, score, lives, level, state, pointerX = null;

    function buildLevel() {
      bricks = [];
      const bw = (W - GAP * (COLS + 1)) / COLS;
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          bricks.push({
            x: GAP + c * (bw + GAP), y: TOP + r * (BRICK_H + GAP),
            w: bw, h: BRICK_H, color: COLORS[r % COLORS.length],
            points: (ROWS - r) * 10, alive: true,
          });
    }

    function resetBall() {
      ball.stuck = true;
      ball.vx = 0; ball.vy = 0;
    }

    function launch() {
      if (!ball.stuck) return;
      const speed = 330 + (level - 1) * 40;
      const angle = (Math.random() * 0.6 - 0.3) - Math.PI / 2;
      ball.vx = Math.cos(angle) * speed;
      ball.vy = Math.sin(angle) * speed;
      ball.stuck = false;
    }

    function start() {
      score = 0; lives = 3; level = 1;
      pad.x = W / 2 - PAD_W / 2;
      buildLevel();
      resetBall();
      updateStats();
      state = 'playing';
    }

    function updateStats() {
      api.setStat('Score', score);
      api.setStat('Lives', '❤'.repeat(lives) || '0');
      api.setStat('Level', level);
    }

    function end(title) {
      state = 'over';
      const best = api.submitScore(score);
      api.showOverlay({ title, text: `Score: ${score}${best ? ' — new best!' : ''}`, button: 'Play again', onClick: start });
    }

    function update(dt) {
      if (state !== 'playing') return;
      const speed = 480;
      if (keys.isDown('ArrowLeft') || keys.isDown('a') || keys.isDown('A')) { pad.x -= speed * dt; pointerX = null; }
      if (keys.isDown('ArrowRight') || keys.isDown('d') || keys.isDown('D')) { pad.x += speed * dt; pointerX = null; }
      if (pointerX !== null) pad.x = pointerX - PAD_W / 2;
      pad.x = clamp(pad.x, 0, W - PAD_W);

      const padY = H - 40;
      if (ball.stuck) {
        ball.x = pad.x + PAD_W / 2;
        ball.y = padY - R - 1;
        return;
      }

      // Sub-step so a fast ball can't tunnel through bricks.
      const steps = Math.ceil((Math.hypot(ball.vx, ball.vy) * dt) / R);
      const sdt = dt / steps;
      for (let i = 0; i < steps; i++) {
        ball.x += ball.vx * sdt;
        ball.y += ball.vy * sdt;

        if (ball.x < R) { ball.x = R; ball.vx = Math.abs(ball.vx); }
        if (ball.x > W - R) { ball.x = W - R; ball.vx = -Math.abs(ball.vx); }
        if (ball.y < R) { ball.y = R; ball.vy = Math.abs(ball.vy); }

        // Paddle
        if (ball.vy > 0 && ball.y + R >= padY && ball.y - R <= padY + PAD_H &&
            ball.x >= pad.x - R && ball.x <= pad.x + PAD_W + R) {
          const rel = clamp((ball.x - (pad.x + PAD_W / 2)) / (PAD_W / 2), -1, 1);
          const angle = rel * (Math.PI / 3) - Math.PI / 2;
          const sp = Math.hypot(ball.vx, ball.vy);
          ball.vx = Math.cos(angle) * sp;
          ball.vy = Math.sin(angle) * sp;
          ball.y = padY - R;
        }

        // Bricks
        for (const b of bricks) {
          if (!b.alive) continue;
          const cx = clamp(ball.x, b.x, b.x + b.w);
          const cy = clamp(ball.y, b.y, b.y + b.h);
          const dx = ball.x - cx, dy = ball.y - cy;
          if (dx * dx + dy * dy > R * R) continue;
          b.alive = false;
          score += b.points;
          if (Math.abs(dx) > Math.abs(dy)) ball.vx = Math.sign(dx || -ball.vx) * Math.abs(ball.vx);
          else ball.vy = Math.sign(dy || -ball.vy) * Math.abs(ball.vy);
          const sp = Math.hypot(ball.vx, ball.vy);
          if (sp < 650) { ball.vx *= 1.01; ball.vy *= 1.01; }
          updateStats();
          break;
        }

        if (ball.y > H + R) {
          lives--;
          updateStats();
          if (lives <= 0) { end('Game over'); return; }
          resetBall();
          return;
        }
      }

      if (bricks.every((b) => !b.alive)) {
        level++;
        buildLevel();
        resetBall();
        updateStats();
      }
    }

    function render() {
      ctx.fillStyle = '#070814';
      ctx.fillRect(0, 0, W, H);

      if (bricks) for (const b of bricks) {
        if (!b.alive) continue;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 4);
        ctx.fill();
      }

      ctx.fillStyle = '#5eead4';
      ctx.beginPath();
      ctx.roundRect(pad.x, H - 40, PAD_W, PAD_H, 6);
      ctx.fill();

      if (state === 'playing' || state === 'paused') {
        ctx.fillStyle = '#e8e9ff';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, R, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.textAlign = 'center';
      if (state === 'playing' && ball.stuck) {
        ctx.fillStyle = '#9a9cc4';
        ctx.font = '16px system-ui';
        ctx.fillText('Press Space or tap to launch', W / 2, H - 80);
      }
      if (state === 'paused') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#e8e9ff';
        ctx.font = 'bold 28px system-ui';
        ctx.fillText('Paused', W / 2, H / 2);
      }
    }

    const keys = trackKeys((key) => {
      if (key !== ' ') return;
      if (state === 'playing' && ball.stuck) launch();
      else if (state === 'playing') state = 'paused';
      else if (state === 'paused') state = 'playing';
    });
    const move = (e) => { pointerX = pointerPos(canvas, W, H, e).x; };
    const tap = (e) => { move(e); if (state === 'playing') launch(); };
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerdown', tap);

    const loop = createLoop(update, render);
    buildLevel();
    state = 'ready';
    loop.start();
    api.showOverlay({ title: 'Brick Breaker', text: 'Clear every brick. You have 3 lives.', button: 'Start', onClick: start });

    return () => {
      loop.stop();
      keys.dispose();
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerdown', tap);
    };
  },
};
