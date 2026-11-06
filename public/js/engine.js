// Shared helpers used by the games.

/** Create a canvas with a fixed logical size, sharp on high-DPI screens. */
export function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.className = 'game';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { canvas, ctx, width, height };
}

/**
 * Fixed-timestep game loop. `update(dt)` runs at `hz` per second,
 * `render()` runs once per animation frame. Returns { start, stop, running }.
 */
export function createLoop(update, render, hz = 60) {
  const step = 1000 / hz;
  let acc = 0;
  let last = 0;
  let raf = 0;
  let running = false;

  function frame(now) {
    if (!running) return;
    acc += Math.min(now - last, 250);
    last = now;
    while (acc >= step) {
      update(step / 1000);
      acc -= step;
      if (!running) break;
    }
    render();
    raf = requestAnimationFrame(frame);
  }

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      acc = 0;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    get running() { return running; },
  };
}

/** Track which keys are held. Returns { isDown(key), dispose() }. */
export function trackKeys(onPress) {
  const down = new Set();
  const gameKeys = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ']);
  const kd = (e) => {
    if (gameKeys.has(e.key)) e.preventDefault();
    if (!down.has(e.key) && onPress) onPress(e.key, e);
    down.add(e.key);
  };
  const ku = (e) => down.delete(e.key);
  const blur = () => down.clear();
  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  window.addEventListener('blur', blur);
  return {
    isDown: (k) => down.has(k),
    dispose() {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('blur', blur);
    },
  };
}

/** Convert a pointer event to the canvas' logical coordinates. */
export function pointerPos(canvas, logicalW, logicalH, e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * logicalW,
    y: ((e.clientY - r.top) / r.height) * logicalH,
  };
}

/** Detect swipe direction on an element. Calls onSwipe('up'|'down'|'left'|'right'). */
export function onSwipe(el, onSwipeDir) {
  let sx = 0, sy = 0, active = false;
  const start = (e) => { active = true; sx = e.clientX; sy = e.clientY; };
  const end = (e) => {
    if (!active) return;
    active = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) onSwipeDir(dx > 0 ? 'right' : 'left');
    else onSwipeDir(dy > 0 ? 'down' : 'up');
  };
  el.addEventListener('pointerdown', start);
  el.addEventListener('pointerup', end);
  return () => {
    el.removeEventListener('pointerdown', start);
    el.removeEventListener('pointerup', end);
  };
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const randInt = (n) => Math.floor(Math.random() * n);

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
