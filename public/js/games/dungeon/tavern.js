// The Rusty Flagon: title screen, intro walk-in, the barkeep's quest, and the
// cellar trapdoor that leads into the dungeon.
import { HERO, BARKEEP, PATRON } from './sprites.js';

export const T = 16;
const COLS = 15;
const ROWS = 20;
export const W = COLS * T;
export const H = ROWS * T;

// # wall  B bar  K barrel  T table  H hearth  D door  P sleeping patron  C cellar trapdoor
const MAP = [
  '###############',
  '###############',
  'KK...........KK',
  'BBBBBBBBBBBBBBB',
  '...............',
  '...............',
  '..TT.......TT..',
  '..TT.......TT..',
  '...............',
  'H..............',
  'H.....TT.......',
  'H.....TT.......',
  '..PP...........',
  '..TT...........',
  '..TT.......K.C.',
  '...........KK..',
  '...............',
  '...............',
  '...............',
  '#######D#######',
];
const SOLID = new Set('#BKTHDP');
const TABLES = [[2, 6], [11, 6], [6, 10], [2, 13]];
const TRAPDOOR = [13, 14];
const DOOR_X = 7 * T + 8;
const HERO_SPEED = 64;

const tileAt = (tx, ty) => (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS ? '#' : MAP[ty][tx]);
const solid = (tx, ty) => SOLID.has(tileAt(tx, ty));

// Small deterministic random so the background looks the same every time.
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---------- Static background (drawn once) ----------

function buildBackground() {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  const rand = rng(7);
  const px = (color, x, y, w = 1, h = 1) => { g.fillStyle = color; g.fillRect(x, y, w, h); };

  // Floor planks everywhere first.
  for (let ty = 0; ty < ROWS; ty++) {
    const dark = ty === 2;
    for (let tx = 0; tx < COLS; tx++) {
      const x = tx * T, y = ty * T;
      px(dark ? '#4a301b' : '#5e3e23', x, y, T, T);
      px(dark ? '#3e2816' : '#4f331d', x, y + 7, T, 1);
      px(dark ? '#3e2816' : '#4f331d', x, y + 15, T, 1);
      px(dark ? '#3e2816' : '#4a301b', x + Math.floor(rand() * 14), y, 1, 7);
      px(dark ? '#3e2816' : '#4a301b', x + Math.floor(rand() * 14), y + 8, 1, 7);
      if (rand() < 0.3) px('#684528', x + Math.floor(rand() * 14), y + 2 + Math.floor(rand() * 10), 2, 1);
    }
  }

  // Back wall with shelves of mugs and bottles.
  px('#2b1b12', 0, 0, W, 2 * T);
  for (let x = 0; x < W; x += 8) px('#22150e', x, 0, 1, 2 * T);
  px('#1a100a', 0, 2 * T - 2, W, 2);
  px('#6b4423', 0, 13, W, 2);
  px('#6b4423', 0, 27, W, 2);
  const bottleColors = ['#3fa34d', '#b03a2e', '#d4a017', '#5b7bd5', '#8e44ad', '#2e8b7a'];
  for (let x = 3; x < W - 4; x += 4 + Math.floor(rand() * 4)) {
    if (rand() < 0.25) continue;
    const col = bottleColors[Math.floor(rand() * bottleColors.length)];
    const hgt = 5 + Math.floor(rand() * 3);
    px(col, x, 27 - hgt, 3, hgt - 2);
    px(col, x + 1, 27 - hgt - 2, 1, 2);
    px('rgba(255,255,255,0.35)', x, 27 - hgt + 1, 1, 2);
  }
  for (let x = 4; x < W - 6; x += 9) {
    if (rand() < 0.3) continue;
    px('#9a9a9a', x, 8, 4, 5);
    px('#7a7a7a', x + 4, 9, 1, 3);
    px('#c8c8c8', x, 8, 4, 1);
  }

  // Barrels.
  for (let ty = 0; ty < ROWS; ty++) for (let tx = 0; tx < COLS; tx++) {
    if (tileAt(tx, ty) !== 'K') continue;
    const x = tx * T, y = ty * T;
    px('#1a100a', x + 2, y + 1, 12, 15);
    px('#6e4423', x + 3, y + 1, 10, 14);
    px('#8a5a30', x + 5, y + 2, 2, 12);
    px('#4a4a52', x + 2, y + 4, 12, 1);
    px('#4a4a52', x + 2, y + 11, 12, 1);
    px('#3a2412', x + 3, y + 1, 10, 1);
  }

  // Bar counter.
  for (let tx = 0; tx < COLS; tx++) {
    const x = tx * T, y = 3 * T;
    px('#9a6634', x, y, T, 6);
    px('#c08040', x, y, T, 1);
    px('#3a2010', x, y + 6, T, 1);
    px('#5a3418', x, y + 7, T, 9);
    px('#46280f', x, y + 7, 1, 9);
    px('#46280f', x + 3, y + 9, 10, 1);
    px('#46280f', x + 3, y + 13, 10, 1);
  }
  // Mugs resting on the bar.
  for (const mx of [22, 58, 170, 205]) {
    px('#c9c9c9', mx, 3 * T - 3, 4, 5);
    px('#9a9a9a', mx + 4, 3 * T - 2, 1, 3);
    px('#f5e6b0', mx, 3 * T - 3, 4, 1);
  }

  // Tables with stools, mugs and candles.
  for (const [tx, ty] of TABLES) {
    const cx = tx * T + 16, cy = ty * T + 14;
    for (const [sx, sy] of [[-20, 0], [18, 0]]) { // stools
      g.fillStyle = '#3a2412';
      g.beginPath(); g.ellipse(cx + sx + 1, cy + sy + 2, 5, 4, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#6b4423';
      g.beginPath(); g.ellipse(cx + sx + 1, cy + sy, 5, 4, 0, 0, Math.PI * 2); g.fill();
    }
    px('#2a1a0e', cx - 2, cy + 6, 4, 10); // leg
    g.fillStyle = '#3a2412';
    g.beginPath(); g.ellipse(cx, cy + 3, 15, 10, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#7a4e2a';
    g.beginPath(); g.ellipse(cx, cy, 15, 10, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#8a5a30';
    g.beginPath(); g.ellipse(cx - 3, cy - 3, 8, 4, 0, 0, Math.PI * 2); g.fill();
    px('#c9c9c9', cx + 5, cy - 1, 4, 4); // mug
    px('#f5e6b0', cx + 5, cy - 1, 4, 1);
    px('#e8dcc0', cx - 1, cy - 4, 2, 4); // candle
  }

  // Hearth.
  for (let ty = 9; ty <= 11; ty++) {
    const x = 0, y = ty * T;
    px('#5a5560', x, y, T, T);
    for (let r = 0; r < 4; r++) {
      px('#3d3a44', x, y + r * 4 + 3, T, 1);
      px('#3d3a44', x + ((r % 2) * 6 + 3), y + r * 4, 1, 3);
    }
  }
  px('#1a0d08', 2, 9 * T + 6, 12, 11 * T + 12 - (9 * T + 6));
  px('#4a2a14', 3, 11 * T + 9, 10, 2); // logs
  px('#3a2010', 5, 11 * T + 7, 7, 2);

  // Cellar trapdoor.
  {
    const [tx, ty] = TRAPDOOR;
    const x = tx * T, y = ty * T;
    px('#1a100a', x, y, T, T);
    px('#4a2e18', x + 1, y + 1, 14, 14);
    for (let i = 0; i < 3; i++) px('#3a2412', x + 1, y + 4 + i * 4, 14, 1);
    px('#6a6a72', x + 3, y + 2, 3, 1);
    px('#6a6a72', x + 10, y + 2, 3, 1);
    px('#8a8a92', x + 6, y + 8, 4, 1);
    px('#8a8a92', x + 6, y + 11, 4, 1);
    px('#8a8a92', x + 6, y + 8, 1, 4);
    px('#8a8a92', x + 9, y + 8, 1, 4);
  }

  // Front wall and door.
  px('#2b1b12', 0, 19 * T, W, T);
  for (let x = 0; x < W; x += 8) px('#22150e', x, 19 * T, 1, T);
  px('#1a100a', 0, 19 * T, W, 2);
  px('#3a2412', 7 * T, 19 * T, T, T);
  px('#6e4423', 7 * T + 2, 19 * T + 2, 12, 14);
  px('#5a3418', 7 * T + 7, 19 * T + 2, 1, 14);
  px('#d4a017', 7 * T + 10, 19 * T + 9, 2, 2);

  return c;
}

// ---------- Path finding for tap-to-walk ----------

function findPath(from, isGoal) {
  const key = (x, y) => y * COLS + x;
  const prev = new Map([[key(...from), null]]);
  const queue = [from];
  while (queue.length) {
    const [x, y] = queue.shift();
    if (isGoal(x, y)) {
      const path = [];
      for (let k = key(x, y); k !== key(...from); k = prev.get(k)) path.unshift([k % COLS, Math.floor(k / COLS)]);
      return path;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (solid(nx, ny) || prev.has(key(nx, ny))) continue;
      prev.set(key(nx, ny), key(x, y));
      queue.push([nx, ny]);
    }
  }
  return null;
}

// ---------- Scene ----------

export function createTavern(game, opts = {}) {
  const { ui, input } = game;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const bg = buildBackground();
  const light = document.createElement('canvas');
  light.width = W * game.scale;
  light.height = H * game.scale;
  const lctx = light.getContext('2d');
  lctx.scale(game.scale, game.scale);

  const hero = { x: DOOR_X, y: H - 2, dir: 'up', walk: 0, moving: false };
  let state = 'title';
  let quest = !!opts.quest;
  let path = null;
  let pending = null;
  let time = 0;
  let doorOpen = false;
  let onTrapdoor = false;
  let tapMark = null;
  let bramTalks = 0;
  let patronTalks = 0;
  const embers = [];
  const zzz = [];

  const heroTile = () => [Math.floor(hero.x / T), Math.floor((hero.y - 3) / T)];

  const NPCS = [
    {
      id: 'bram',
      tiles: [[6, 3], [7, 3], [8, 3]],
      hit: { x: 5 * T, y: 1.5 * T, w: 5 * T, h: 2.5 * T },
      talk() {
        if (!quest) {
          ui.say([
            { name: 'Bram', text: 'Well now, another sellsword looking for coin? Pull up a stool, friend.' },
            { name: 'Bram', text: "I'll be straight with you. Something's crawled up from the old cellar beneath this tavern." },
            { name: 'Bram', text: 'My barrels go missing, the rats have all fled... and at night I hear scratching. Growling.' },
            { name: 'Bram', text: 'The cellar opens into tunnels — ruins far older than this town. Room after room of them.' },
            { name: 'Bram', text: "Clear them out, room by room. Every last creature. Do that and there's 100 gold in it for you." },
            { name: 'Bram', text: "Here — my old cellar key. The trapdoor's in the back corner, past the barrels. Mind the steps." },
          ], () => {
            quest = true;
            ui.banner('Quest accepted: Clear the Cellar');
            updateObjective();
          });
        } else {
          const lines = [
            "Trapdoor's in the back corner. Go on, then — and don't let anything follow you up.",
            "Drinks are on me when you're back. If you're back.",
            'Still here? Those beasts won\'t clear themselves out.',
          ];
          ui.say([{ name: 'Bram', text: lines[bramTalks++ % lines.length] }]);
        }
      },
    },
    {
      id: 'patron',
      tiles: [[2, 12], [3, 12]],
      hit: { x: 1.5 * T, y: 11.25 * T, w: 3 * T, h: 2 * T },
      talk() {
        const lines = [
          "Zzz... mmh... don't go in the cellar... the eyes... zzz...",
          '*snore* ...one more ale, Bram... *snore*',
          "Zzz... they say the deepest room has a guardian... zzz...",
        ];
        ui.say([{ name: 'Sleepy patron', text: lines[patronTalks++ % lines.length] }]);
      },
    },
  ];
  const inZone = (npc, tx, ty) => npc.tiles.some(([a, b]) => Math.abs(a - tx) <= 1 && Math.abs(b - ty) <= 1);
  const inside = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

  function updateObjective() {
    ui.objective(quest ? 'Objective: Go down the cellar trapdoor' : 'Objective: Talk to Bram, the barkeep');
  }

  function interact(npc) {
    path = null;
    pending = null;
    hero.moving = false;
    const [tx, ty] = heroTile();
    const [nx, ny] = npc.tiles[Math.floor(npc.tiles.length / 2)];
    if (Math.abs(nx - tx) > Math.abs(ny - ty)) hero.dir = nx > tx ? 'right' : 'left';
    else hero.dir = ny > ty ? 'down' : 'up';
    npc.talk();
  }

  function stepOnTrapdoor() {
    path = null;
    hero.moving = false;
    if (!quest) {
      ui.say([{ text: "A heavy trapdoor, locked tight. Cold air seeps up through the cracks. Maybe the barkeep has a key." }]);
      return;
    }
    ui.choice('Descend into the cellar?', [
      { label: 'Descend', onPick: () => ui.fade(() => game.goto('cellar')) },
      { label: 'Not yet' },
    ]);
  }

  function showTitle() {
    const { el, button } = ui;
    const title = el('h1', 'Dungeon Delve');
    title.className = 'dq-title';
    const start = button('Tap to begin', 'dq-tap', (e) => { e.stopPropagation(); begin(); });
    ui.showScreen([
      el('dq-kicker', 'Chapter I'),
      title,
      el('dq-sub', 'The Rusty Flagon'),
      start,
    ], begin);
  }

  function begin() {
    if (state !== 'title') return;
    ui.hideScreen();
    state = 'intro';
    doorOpen = true;
    hero.x = DOOR_X;
    hero.y = H - 2;
    hero.dir = 'up';
  }

  if (opts.returning) {
    state = 'play';
    hero.x = TRAPDOOR[0] * T + 8;
    hero.y = (TRAPDOOR[1] - 1) * T + 12;
    hero.dir = 'down';
    updateObjective();
  } else {
    showTitle();
  }

  // Movement with collision against solid tiles (hit box = the hero's feet).
  function blocked(x, y) {
    for (const [cx, cy] of [[x - 4, y - 5], [x + 3, y - 5], [x - 4, y - 1], [x + 3, y - 1]]) {
      if (solid(Math.floor(cx / T), Math.floor(cy / T))) return true;
    }
    return false;
  }

  function move(dx, dy, dt, collide = true) {
    const len = Math.hypot(dx, dy) || 1;
    const vx = (dx / len) * HERO_SPEED * dt;
    const vy = (dy / len) * HERO_SPEED * dt;
    if (!collide || !blocked(hero.x + vx, hero.y)) hero.x += vx;
    if (!collide || !blocked(hero.x, hero.y + vy)) hero.y += vy;
    if (Math.abs(dx) > Math.abs(dy)) hero.dir = dx > 0 ? 'right' : 'left';
    else hero.dir = dy > 0 ? 'down' : 'up';
    hero.walk += dt * 8;
    hero.moving = true;
  }

  function update(dt) {
    time += dt;
    hero.moving = false;

    // Embers from the fire, z's from the sleeper.
    if (Math.random() < dt * 6) embers.push({ x: 4 + Math.random() * 8, y: 11 * T + 6, vy: -12 - Math.random() * 14, life: 1 });
    for (const e of embers) { e.y += e.vy * dt; e.x += Math.sin(time * 3 + e.y) * 0.1; e.life -= dt * 0.9; }
    while (embers.length && embers[0].life <= 0) embers.shift();
    if (Math.random() < dt * 0.7) zzz.push({ x: 3 * T + 4, y: 12 * T, life: 1 });
    for (const z of zzz) { z.y -= dt * 8; z.x += dt * 4; z.life -= dt * 0.45; }
    while (zzz.length && zzz[0].life <= 0) zzz.shift();
    if (tapMark) { tapMark.t -= dt; if (tapMark.t <= 0) tapMark = null; }

    if (state === 'intro') {
      move(0, -1, dt * 0.7, false);
      if (hero.y <= 17 * T + 12) {
        hero.y = 17 * T + 12;
        doorOpen = false;
        state = 'narration';
        ui.say([
          { text: 'The Rusty Flagon. A crackling fire, cheap ale, and a barkeep who looks like he\'s been expecting you.' },
        ], () => {
          state = 'play';
          updateObjective();
        });
      }
      return;
    }
    if (state !== 'play') return;

    if (!ui.busy) {
      let dx = 0, dy = 0;
      if (input.left) dx -= 1;
      if (input.right) dx += 1;
      if (input.up) dy -= 1;
      if (input.down) dy += 1;
      if (dx || dy) {
        path = null;
        pending = null;
        move(dx, dy, dt);
      } else if (path) {
        if (!path.length) {
          path = null;
          if (pending) interact(pending);
        } else {
          const [tx, ty] = path[0];
          const gx = tx * T + 8, gy = ty * T + 12;
          const ddx = gx - hero.x, ddy = gy - hero.y;
          const dist = Math.hypot(ddx, ddy);
          if (dist <= HERO_SPEED * dt) { hero.x = gx; hero.y = gy; path.shift(); hero.moving = true; }
          else move(ddx, ddy, dt, false);
        }
      }

      const [tx, ty] = heroTile();
      const onTrap = tx === TRAPDOOR[0] && ty === TRAPDOOR[1];
      if (onTrap && !onTrapdoor) stepOnTrapdoor();
      onTrapdoor = onTrap;

      const near = NPCS.find((n) => inZone(n, tx, ty));
      ui.hint(near && !path ? (coarse ? 'Tap them to talk' : 'Press E to talk') : '');
    } else {
      ui.hint('');
    }
  }

  // ---------- Drawing ----------

  function drawSprite(ctx, img, x, y) {
    ctx.drawImage(img, Math.round(x), Math.round(y));
  }

  function drawFire(ctx) {
    const base = 11 * T + 9;
    for (let i = 0; i < 6; i++) {
      const h = 7 + Math.sin(time * 9 + i * 1.7) * 3 + Math.sin(time * 23 + i) * 1.5;
      ctx.fillStyle = '#e8541c';
      ctx.fillRect(3 + i * 1.7, base - h, 2, h);
      ctx.fillStyle = '#ffb02e';
      ctx.fillRect(3.5 + i * 1.7, base - h * 0.6, 1, h * 0.6);
    }
    ctx.fillStyle = '#ffe680';
    ctx.fillRect(6, base - 3, 4, 3);
  }

  function drawMarker(ctx, x, y, kind) {
    const bob = Math.round(Math.sin(time * 4) * 1.5);
    y += bob;
    if (kind === '!') {
      ctx.fillStyle = '#1a1020';
      ctx.fillRect(x - 2, y - 1, 4, 8);
      ctx.fillRect(x - 2, y + 7, 4, 4);
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(x - 1, y, 2, 6);
      ctx.fillRect(x - 1, y + 8, 2, 2);
    } else {
      ctx.fillStyle = '#ffd23f';
      for (let r = 0; r < 4; r++) ctx.fillRect(x - 3 + r, y + r, 7 - r * 2, 1);
    }
  }

  function render(ctx) {
    ctx.drawImage(bg, 0, 0);

    // Door opening during the intro.
    if (doorOpen) {
      ctx.fillStyle = '#0b0710';
      ctx.fillRect(7 * T + 2, 19 * T + 2, 12, 14);
    }

    drawFire(ctx);
    for (const [tx, ty] of TABLES) {
      const cx = tx * T + 16, cy = ty * T + 14;
      ctx.fillStyle = Math.sin(time * 13 + tx) > 0 ? '#ffb02e' : '#ffd23f';
      ctx.fillRect(cx - 1, cy - 6, 2, 2);
      ctx.fillStyle = '#fff3b0';
      ctx.fillRect(cx - 0.5, cy - 7, 1, 1);
    }

    // Bram behind the bar, polishing a mug.
    const bramX = 7 * T + 2, bramY = 2 * T + 4 + (Math.sin(time * 2) > 0.95 ? -1 : 0);
    drawSprite(ctx, BARKEEP, bramX, bramY);
    const polish = Math.sin(time * 5) * 2;
    ctx.fillStyle = '#c9c9c9';
    ctx.fillRect(Math.round(bramX + 4 + polish), bramY + 8, 4, 4);
    ctx.fillStyle = '#f2c29b';
    ctx.fillRect(Math.round(bramX + 3 + polish), bramY + 11, 6, 1);
    ctx.drawImage(bg, 0, 3 * T, W, T, 0, 3 * T, W, T); // counter in front of Bram

    // Y-sorted characters.
    const actors = [
      { y: 12 * T + 14, draw: () => drawSprite(ctx, PATRON, 2 * T + 2, 12 * T - 2) },
    ];
    if (state !== 'title') {
      const frames = HERO[hero.dir];
      const img = hero.moving ? frames[Math.floor(hero.walk) % 4] : frames[1];
      actors.push({ y: hero.y, draw: () => drawSprite(ctx, img, hero.x - 6, hero.y - 16) });
    }
    actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());

    // Lighting: darken the room, then cut warm holes around fire and candles.
    lctx.globalCompositeOperation = 'source-over';
    lctx.clearRect(0, 0, W, H);
    lctx.fillStyle = 'rgba(8, 4, 18, 0.6)';
    lctx.fillRect(0, 0, W, H);
    lctx.globalCompositeOperation = 'destination-out';
    const lights = [
      [10, 10.5 * T, 78 + Math.sin(time * 7) * 4],
      [4 * T, 2.6 * T, 52],
      [11 * T, 2.6 * T, 52],
      ...TABLES.map(([tx, ty]) => [tx * T + 16, ty * T + 8, 34 + Math.sin(time * 11 + tx) * 2]),
      [hero.x, hero.y - 8, 26],
    ];
    if (quest) lights.push([TRAPDOOR[0] * T + 8, TRAPDOOR[1] * T + 8, 22 + Math.sin(time * 3) * 3]);
    for (const [x, y, r] of lights) {
      const grad = lctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = grad;
      lctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.drawImage(light, 0, 0, W, H);

    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(10, 10.5 * T, 0, 10, 10.5 * T, 90);
    glow.addColorStop(0, `rgba(255, 120, 40, ${0.22 + Math.sin(time * 9) * 0.03})`);
    glow.addColorStop(1, 'rgba(255, 120, 40, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 10.5 * T - 90, 100, 180);
    ctx.globalCompositeOperation = 'source-over';

    for (const e of embers) {
      ctx.fillStyle = `rgba(255, ${150 + e.life * 80}, 60, ${e.life})`;
      ctx.fillRect(e.x, e.y, 1, 1);
    }
    for (const z of zzz) {
      ctx.fillStyle = `rgba(220, 220, 255, ${z.life})`;
      const x = Math.round(z.x), y = Math.round(z.y);
      ctx.fillRect(x, y, 3, 1); ctx.fillRect(x + 1, y + 1, 1, 1); ctx.fillRect(x, y + 2, 3, 1);
    }

    // Quest markers and trapdoor glow.
    if (state === 'play' || state === 'narration') {
      if (!quest) drawMarker(ctx, 7 * T + 8, 2 * T - 6, '!');
      else {
        const [tx, ty] = TRAPDOOR;
        ctx.strokeStyle = `rgba(255, 210, 90, ${0.45 + Math.sin(time * 4) * 0.3})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(tx * T + 0.5, ty * T + 0.5, T - 1, T - 1);
        drawMarker(ctx, tx * T + 8, ty * T - 9, 'v');
      }
    }

    if (tapMark) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${tapMark.t * 2})`;
      ctx.lineWidth = 1;
      const r = 6 - tapMark.t * 6;
      ctx.beginPath();
      ctx.ellipse(tapMark.x, tapMark.y, r + 2, (r + 2) * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  return {
    update,
    render,
    onTap(x, y) {
      if (state === 'title') { begin(); return; }
      if (state !== 'play' || ui.busy) return;
      const here = heroTile();
      const npc = NPCS.find((n) => inside(x, y, n.hit));
      if (npc) {
        if (inZone(npc, ...here)) { interact(npc); return; }
        path = findPath(here, (a, b) => inZone(npc, a, b));
        pending = path ? npc : null;
        return;
      }
      pending = null;
      const tx = Math.floor(x / T), ty = Math.floor(y / T);
      path = solid(tx, ty)
        ? findPath(here, (a, b) => Math.abs(a - tx) <= 1 && Math.abs(b - ty) <= 1)
        : findPath(here, (a, b) => a === tx && b === ty);
      if (path) tapMark = { x: tx * T + 8, y: ty * T + 12, t: 0.5 };
    },
    onKey(key) {
      if (state !== 'play') return;
      if (key === 'e' || key === 'E' || key === ' ' || key === 'Enter') {
        const [tx, ty] = heroTile();
        const npc = NPCS.find((n) => inZone(n, tx, ty));
        if (npc) interact(npc);
      }
    },
    dispose() {},
  };
}
