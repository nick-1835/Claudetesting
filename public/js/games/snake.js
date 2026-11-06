import { createCanvas, createLoop, trackKeys, onSwipe, randInt } from '../engine.js';

const COLS = 20;
const ROWS = 20;
const CELL = 22;

const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const KEY_DIRS = {
  ArrowUp: 'up', w: 'up', W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
};

export default {
  id: 'snake',
  title: 'Snake',
  icon: '🐍',
  description: 'Eat the food, grow longer, and don\'t bite yourself or the walls.',
  help: '<span class="keys">Move with <kbd>Arrow keys</kbd> / <kbd>WASD</kbd>. <kbd>Space</kbd> pauses.</span><span class="touch">Swipe anywhere to steer.</span>',

  mount(root, api) {
    const { canvas, ctx, width, height } = createCanvas(COLS * CELL, ROWS * CELL);
    root.append(canvas);

    let snake, dir, queue, food, score, tickTime, acc, state;

    function reset() {
      snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
      dir = DIRS.right;
      queue = [];
      score = 0;
      tickTime = 0.14;
      acc = 0;
      placeFood();
      api.setStat('Score', score);
      api.setStat('Length', snake.length);
    }

    function placeFood() {
      const free = [];
      for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++)
          if (!snake.some((s) => s.x === x && s.y === y)) free.push({ x, y });
      food = free.length ? free[randInt(free.length)] : null;
    }

    function turn(name) {
      if (state !== 'playing') return;
      const last = queue.length ? queue[queue.length - 1] : dir;
      const next = DIRS[name];
      // Ignore reversing into yourself and duplicate turns.
      if (next.x === -last.x && next.y === -last.y) return;
      if (next === last) return;
      if (queue.length < 3) queue.push(next);
    }

    function step() {
      if (queue.length) dir = queue.shift();
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      const eating = food && head.x === food.x && head.y === food.y;
      const body = eating ? snake : snake.slice(0, -1);
      const hitWall = head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS;
      if (hitWall || body.some((s) => s.x === head.x && s.y === head.y)) {
        gameOver();
        return;
      }
      snake.unshift(head);
      if (eating) {
        score += 10;
        tickTime = Math.max(0.06, tickTime * 0.97);
        placeFood();
        api.setStat('Score', score);
        api.setStat('Length', snake.length);
        if (!food) { gameOver(true); return; }
      } else {
        snake.pop();
      }
    }

    function update(dt) {
      if (state !== 'playing') return;
      acc += dt;
      while (acc >= tickTime && state === 'playing') {
        acc -= tickTime;
        step();
      }
    }

    function render() {
      ctx.fillStyle = '#070814';
      ctx.fillRect(0, 0, width, height);
      // Checkerboard grid
      ctx.fillStyle = '#0c0e22';
      for (let y = 0; y < ROWS; y++)
        for (let x = (y % 2); x < COLS; x += 2) ctx.fillRect(x * CELL, y * CELL, CELL, CELL);

      if (food) {
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL * 0.36, 0, Math.PI * 2);
        ctx.fill();
      }

      snake.forEach((s, i) => {
        const t = i / Math.max(1, snake.length - 1);
        ctx.fillStyle = i === 0 ? '#a7f3d0' : `hsl(${168 - t * 30}, 70%, ${58 - t * 18}%)`;
        ctx.beginPath();
        ctx.roundRect(s.x * CELL + 1.5, s.y * CELL + 1.5, CELL - 3, CELL - 3, 5);
        ctx.fill();
      });

      if (state === 'paused') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#e8e9ff';
        ctx.font = 'bold 28px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Paused', width / 2, height / 2);
      }
    }

    function start() {
      reset();
      state = 'playing';
    }

    function gameOver(won = false) {
      state = 'over';
      const best = api.submitScore(score);
      api.showOverlay({
        title: won ? 'You filled the board!' : 'Game over',
        text: `Score: ${score}${best ? ' — new best!' : ''}`,
        button: 'Play again',
        onClick: start,
      });
    }

    const keys = trackKeys((key) => {
      if (KEY_DIRS[key]) turn(KEY_DIRS[key]);
      else if (key === ' ') {
        if (state === 'playing') state = 'paused';
        else if (state === 'paused') state = 'playing';
      }
    });
    const unswipe = onSwipe(root.closest('.game-page') || canvas, turn);

    const loop = createLoop(update, render);
    reset();
    state = 'ready';
    loop.start();
    api.showOverlay({ title: 'Snake', text: 'Eat the pink dots. Avoid walls and your tail.', button: 'Start', onClick: start });

    return () => {
      loop.stop();
      keys.dispose();
      unswipe();
    };
  },
};
