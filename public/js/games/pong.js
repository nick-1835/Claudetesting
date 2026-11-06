import { createCanvas, createLoop, trackKeys, pointerPos, clamp } from '../engine.js';

const W = 640;
const H = 400;
const PAD_W = 10;
const PAD_H = 70;
const BALL = 10;
const WIN_SCORE = 7;

export default {
  id: 'pong',
  title: 'Pong',
  icon: '🏓',
  description: 'Classic paddle tennis against the computer. First to 7 wins.',
  scoreLabel: 'win margin',
  help: '<span class="keys">Move with <kbd>W</kbd>/<kbd>S</kbd>, <kbd>↑</kbd>/<kbd>↓</kbd> or the mouse. <kbd>Space</kbd> pauses.</span><span class="touch">Drag up and down on the court to move.</span>',

  mount(root, api) {
    const { canvas, ctx } = createCanvas(W, H);
    root.append(canvas);

    const player = { y: H / 2 - PAD_H / 2 };
    const cpu = { y: H / 2 - PAD_H / 2 };
    const ball = { x: 0, y: 0, vx: 0, vy: 0 };
    let scores, state, serveTimer, pointerY = null;

    function serve(toward) {
      ball.x = W / 2;
      ball.y = H / 2;
      const angle = (Math.random() * 0.8 - 0.4);
      const speed = 300;
      ball.vx = Math.cos(angle) * speed * toward;
      ball.vy = Math.sin(angle) * speed;
      serveTimer = 0.8;
    }

    function start() {
      scores = { you: 0, cpu: 0 };
      player.y = cpu.y = H / 2 - PAD_H / 2;
      api.setStat('You', 0);
      api.setStat('CPU', 0);
      serve(Math.random() < 0.5 ? -1 : 1);
      state = 'playing';
    }

    function hitPaddle(padX, padY, dirOut) {
      // Bounce angle depends on where the ball hits the paddle.
      const rel = (ball.y + BALL / 2 - (padY + PAD_H / 2)) / (PAD_H / 2);
      const angle = clamp(rel, -1, 1) * (Math.PI / 3.2);
      const speed = Math.min(Math.hypot(ball.vx, ball.vy) * 1.06, 900);
      ball.vx = Math.cos(angle) * speed * dirOut;
      ball.vy = Math.sin(angle) * speed;
      ball.x = dirOut > 0 ? padX + PAD_W : padX - BALL;
    }

    function point(winner) {
      scores[winner]++;
      api.setStat('You', scores.you);
      api.setStat('CPU', scores.cpu);
      if (scores[winner] >= WIN_SCORE) {
        state = 'over';
        const won = winner === 'you';
        const best = won && api.submitScore(scores.you - scores.cpu);
        api.showOverlay({
          title: won ? 'You win! 🎉' : 'CPU wins',
          text: `${scores.you} – ${scores.cpu}${best ? ' — best margin yet!' : ''}`,
          button: 'Rematch',
          onClick: start,
        });
        return;
      }
      serve(winner === 'you' ? 1 : -1);
    }

    function update(dt) {
      if (state !== 'playing') return;

      // Player paddle
      const speed = 420;
      if (keys.isDown('ArrowUp') || keys.isDown('w') || keys.isDown('W')) { player.y -= speed * dt; pointerY = null; }
      if (keys.isDown('ArrowDown') || keys.isDown('s') || keys.isDown('S')) { player.y += speed * dt; pointerY = null; }
      if (pointerY !== null) {
        const target = pointerY - PAD_H / 2;
        player.y += clamp(target - player.y, -speed * 1.6 * dt, speed * 1.6 * dt);
      }
      player.y = clamp(player.y, 0, H - PAD_H);

      // CPU paddle: follows the ball with limited speed and a little lag.
      const cpuSpeed = 270 + (scores.you - scores.cpu) * 12;
      const aim = ball.vx > 0 ? ball.y + BALL / 2 : H / 2;
      const diff = aim - (cpu.y + PAD_H / 2);
      if (Math.abs(diff) > 8) cpu.y += clamp(diff, -cpuSpeed * dt, cpuSpeed * dt);
      cpu.y = clamp(cpu.y, 0, H - PAD_H);

      if (serveTimer > 0) { serveTimer -= dt; return; }

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      if (ball.y < 0) { ball.y = 0; ball.vy = Math.abs(ball.vy); }
      if (ball.y > H - BALL) { ball.y = H - BALL; ball.vy = -Math.abs(ball.vy); }

      const pX = 20, cX = W - 20 - PAD_W;
      if (ball.vx < 0 && ball.x <= pX + PAD_W && ball.x >= pX - BALL &&
          ball.y + BALL >= player.y && ball.y <= player.y + PAD_H) hitPaddle(pX, player.y, 1);
      if (ball.vx > 0 && ball.x + BALL >= cX && ball.x <= cX + PAD_W &&
          ball.y + BALL >= cpu.y && ball.y <= cpu.y + PAD_H) hitPaddle(cX, cpu.y, -1);

      if (ball.x < -BALL) point('cpu');
      else if (ball.x > W) point('you');
    }

    function render() {
      ctx.fillStyle = '#070814';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#24274a';
      for (let y = 8; y < H; y += 24) ctx.fillRect(W / 2 - 2, y, 4, 12);

      ctx.font = 'bold 48px system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#24274a';
      if (scores) {
        ctx.fillText(scores.you, W / 4, 64);
        ctx.fillText(scores.cpu, (W * 3) / 4, 64);
      }

      ctx.fillStyle = '#5eead4';
      ctx.fillRect(20, player.y, PAD_W, PAD_H);
      ctx.fillStyle = '#f472b6';
      ctx.fillRect(W - 20 - PAD_W, cpu.y, PAD_W, PAD_H);
      if (state === 'playing' || state === 'paused') {
        ctx.fillStyle = '#e8e9ff';
        ctx.fillRect(ball.x, ball.y, BALL, BALL);
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
      if (key === ' ') {
        if (state === 'playing') state = 'paused';
        else if (state === 'paused') state = 'playing';
      }
    });
    const move = (e) => { pointerY = pointerPos(canvas, W, H, e).y; };
    const down = (e) => { canvas.setPointerCapture?.(e.pointerId); move(e); };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);

    const loop = createLoop(update, render);
    state = 'ready';
    loop.start();
    api.showOverlay({ title: 'Pong', text: `You're the green paddle. First to ${WIN_SCORE} wins.`, button: 'Start', onClick: start });

    return () => {
      loop.stop();
      keys.dispose();
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
    };
  },
};
