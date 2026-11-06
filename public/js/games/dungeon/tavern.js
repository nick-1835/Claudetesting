// The Rusty Flagon (side view): title screen, the knight's entrance, Bram's
// quest, and the cellar door that leads into the dungeon.
import { BRAM, PATRON } from './sprites.js';
import { createHero, drawHero } from './hero.js';

const WORLD_W = 560;
const H = 180;
export const GROUND = 150; // y of the floor surface

const ZONES = {
  bram: { x0: 286, x1: 346 },
  patron: { x0: 138, x1: 202 },
  cellar: { x0: 496, x1: WORLD_W },
};
const DOOR_X = 33;
const FIRE = { x: 94, y: 140 };
const LANTERNS = [262, 372];
const CANDLES = [{ x: 168, y: 130 }, { x: 455, y: 130 }];

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

// ---------- Background: walls, fireplace, shelves (behind everyone) ----------

function buildBack() {
  const [c, g] = canvas(WORLD_W, H);
  const rand = rng(11);
  const px = (color, x, y, w = 1, h = 1) => { g.fillStyle = color; g.fillRect(x, y, w, h); };

  // Plank wall.
  px('#3a2416', 0, 0, WORLD_W, GROUND);
  for (let x = 0; x < WORLD_W; x += 10) {
    px('#2e1c11', x, 0, 1, GROUND);
    if (rand() < 0.5) px('#43291a', x + 2 + Math.floor(rand() * 6), Math.floor(rand() * 100), 1, 6 + Math.floor(rand() * 20));
    if (rand() < 0.3) px('#2a190f', x + 3 + Math.floor(rand() * 5), 20 + Math.floor(rand() * 80), 2, 2);
  }
  // Ceiling beam and lower wainscot.
  px('#1e120a', 0, 0, WORLD_W, 12);
  px('#4a2e1a', 0, 12, WORLD_W, 2);
  px('#2c1a10', 0, 110, WORLD_W, GROUND - 110);
  px('#5a3a20', 0, 108, WORLD_W, 2);
  for (let x = 0; x < WORLD_W; x += 20) px('#24150c', x, 112, 1, GROUND - 112);
  // Support posts.
  for (const x of [0, 210, 416, WORLD_W - 8]) {
    px('#24160c', x, 0, 8, GROUND);
    px('#3a2414', x + 1, 0, 1, GROUND);
  }

  // Front door.
  px('#1a100a', DOOR_X - 15, 96, 30, GROUND - 96);
  px('#6e4423', DOOR_X - 12, 99, 24, GROUND - 99);
  for (let x = DOOR_X - 12; x < DOOR_X + 12; x += 6) px('#5a3418', x, 99, 1, GROUND - 99);
  px('#4a4a52', DOOR_X - 12, 106, 24, 2);
  px('#4a4a52', DOOR_X - 12, 138, 24, 2);
  px('#d4a017', DOOR_X + 7, 122, 2, 3);

  // Fireplace.
  px('#4a4650', 66, 80, 56, GROUND - 80);
  for (let y = 80; y < GROUND; y += 6) {
    px('#34313a', 66, y, 56, 1);
    for (let x = 66 + ((y / 6) % 2) * 5; x < 122; x += 10) px('#34313a', x, y, 1, 6);
  }
  px('#5c3a20', 62, 76, 64, 5); // mantle
  px('#7a5030', 62, 76, 64, 1);
  px('#120806', 76, 104, 36, GROUND - 104);
  px('#1e0e08', 78, 106, 32, 4);
  px('#4a2a14', 80, GROUND - 6, 28, 3); // logs
  px('#3a2010', 84, GROUND - 9, 20, 3);
  // Shield over the mantle.
  g.fillStyle = '#1a1020'; g.beginPath(); g.arc(94, 58, 11, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#2f5fb3'; g.beginPath(); g.arc(94, 58, 10, 0, Math.PI * 2); g.fill();
  px('#e8b84a', 93, 49, 2, 18);
  px('#e8b84a', 85, 57, 18, 2);
  // Candlesticks on the mantle.
  px('#c9c9c9', 70, 70, 2, 6);
  px('#c9c9c9', 116, 70, 2, 6);

  // Wanted posters between door and fireplace.
  for (const [x, y] of [[48, 52]]) {
    px('#d9c79a', x, y, 12, 16);
    px('#8a6a3a', x + 2, y + 3, 8, 1);
    px('#5a3a1a', x + 3, y + 6, 6, 5);
    px('#8a6a3a', x + 2, y + 13, 8, 1);
  }

  // Window with moonlight.
  px('#24160c', 440, 44, 44, 40);
  px('#1b2848', 443, 47, 38, 34);
  px('#26375e', 443, 47, 38, 14);
  g.fillStyle = '#e8ecff'; g.beginPath(); g.arc(470, 58, 5, 0, Math.PI * 2); g.fill();
  px('#24160c', 461, 47, 2, 34);
  px('#24160c', 443, 63, 38, 2);
  for (let i = 0; i < 6; i++) px('#c9d4ff', 446 + Math.floor(rand() * 32), 50 + Math.floor(rand() * 10), 1, 1);

  // Bar back wall: shelves of bottles and a keg rack.
  px('#2c1a10', 224, 40, 184, 70);
  for (const sy of [62, 86]) {
    px('#6b4423', 226, sy, 180, 3);
    px('#4a2e18', 226, sy + 3, 180, 1);
    const colors = ['#3fa34d', '#b03a2e', '#d4a017', '#5b7bd5', '#8e44ad', '#2e8b7a'];
    for (let x = 230; x < 400; x += 5 + Math.floor(rand() * 5)) {
      if (rand() < 0.2) continue;
      const col = colors[Math.floor(rand() * colors.length)];
      const h = 7 + Math.floor(rand() * 5);
      px(col, x, sy - h + 2, 4, h - 2);
      px(col, x + 1, sy - h - 1, 2, 3);
      px('rgba(255,255,255,0.35)', x, sy - h + 3, 1, 3);
    }
  }
  for (const kx of [244, 300, 356]) { // kegs
    g.fillStyle = '#1a100a'; g.beginPath(); g.arc(kx, 100, 9, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#7a4e2a'; g.beginPath(); g.arc(kx, 100, 8, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#4a4a52'; g.lineWidth = 1; g.beginPath(); g.arc(kx, 100, 6, 0, Math.PI * 2); g.stroke();
    px('#c9c9c9', kx - 1, 104, 3, 4);
  }
  // Tavern sign.
  px('#5a3418', 280, 22, 80, 14);
  px('#7a5030', 280, 22, 80, 1);
  px('#1a1020', 280, 35, 80, 1);
  px('#c9a24a', 284, 26, 72, 6);
  px('#5a3418', 286, 27, 68, 4);
  // Lantern chains.
  for (const lx of LANTERNS) px('#4a4a52', lx, 14, 1, 20);

  // Cellar door: stone arch with an iron-banded door.
  px('#4a4650', 498, 86, 44, GROUND - 86);
  for (let y = 86; y < GROUND; y += 6) {
    px('#34313a', 498, y, 44, 1);
    for (let x = 498 + ((y / 6) % 2) * 5; x < 542; x += 10) px('#34313a', x, y, 1, 6);
  }
  px('#1a1020', 505, 96, 30, GROUND - 96);

  // Floor.
  px('#5e3e23', 0, GROUND, WORLD_W, H - GROUND);
  px('#8a5a30', 0, GROUND, WORLD_W, 1);
  px('#3a2414', 0, GROUND + 1, WORLD_W, 1);
  for (let y = GROUND + 6; y < H; y += 6) px('#4a301b', 0, y, WORLD_W, 1);
  for (let y = GROUND + 1; y < H; y += 6) {
    for (let x = Math.floor(rand() * 30); x < WORLD_W; x += 26 + Math.floor(rand() * 20)) px('#4a301b', x, y, 1, 5);
  }
  px('#24160c', 0, H - 6, WORLD_W, 6);
  return c;
}

// ---------- Middle layer: counter, tables, stools (in front of NPCs, behind the hero) ----------

function buildMid() {
  const [c, g] = canvas(WORLD_W, H);
  const px = (color, x, y, w = 1, h = 1) => { g.fillStyle = color; g.fillRect(x, y, w, h); };
  const TOP = 130; // counter top

  // Bar counter.
  px('#1a100a', 226, TOP - 1, 182, GROUND - TOP + 1);
  px('#9a6634', 226, TOP, 182, 4);
  px('#c08040', 226, TOP, 182, 1);
  px('#5a3418', 228, TOP + 4, 178, GROUND - TOP - 4);
  for (let x = 228; x < 406; x += 22) {
    px('#46280f', x, TOP + 4, 1, GROUND - TOP - 4);
    px('#46280f', x + 4, TOP + 7, 14, 1);
    px('#46280f', x + 4, GROUND - 3, 14, 1);
    px('#46280f', x + 4, TOP + 7, 1, GROUND - TOP - 10);
    px('#6a4020', x + 17, TOP + 7, 1, GROUND - TOP - 10);
  }
  for (const mx of [240, 352, 392]) { // mugs on the counter
    px('#c9c9c9', mx, TOP - 6, 5, 6);
    px('#9a9a9a', mx + 5, TOP - 5, 1, 4);
    px('#f5e6b0', mx, TOP - 6, 5, 1);
  }

  // Tables (side view) with a mug and candle.
  for (const t of CANDLES) {
    const x = t.x - 24;
    px('#1a100a', x, 136, 48, 4);
    px('#8a5a30', x, 136, 48, 1);
    px('#7a4e2a', x, 137, 48, 2);
    px('#3a2412', x + 4, 140, 3, GROUND - 140);
    px('#3a2412', x + 41, 140, 3, GROUND - 140);
    px('#e8dcc0', t.x - 1, 129, 3, 7);
    px('#c9c9c9', t.x + 10, 130, 5, 6);
    px('#f5e6b0', t.x + 10, 130, 5, 1);
  }
  // Benches.
  for (const [bx, bw] of [[134, 34], [430, 22]]) {
    px('#3a2412', bx, 142, bw, 3);
    px('#6b4423', bx, 141, bw, 1);
    px('#3a2412', bx + 2, 145, 2, GROUND - 145);
    px('#3a2412', bx + bw - 4, 145, 2, GROUND - 145);
  }
  return c;
}

// ---------- Scene ----------

export function createTavern(game, opts = {}) {
  const { ui, input } = game;
  const back = buildBack();
  const mid = buildMid();
  let light = null, lctx = null;

  const hero = createHero(DOOR_X, GROUND);
  // The tavern is one flat floor between two walls.
  const world = {
    gravity: 900,
    solid: (px, py) => py >= GROUND || px < 8 || px > WORLD_W - 8,
  };
  let state = 'title';
  let quest = !!opts.quest;
  let time = 0;
  let camX = 200;
  let doorOpen = 0; // 0..1
  let cellarOpen = quest ? 1 : 0;
  let bramTalks = 0, patronTalks = 0, pokeTime = -9;
  const embers = [];
  const zzz = [];
  const player = game.player;
  if (quest) player.key = true;

  const near = () => {
    for (const [id, z] of Object.entries(ZONES)) if (hero.x >= z.x0 && hero.x <= z.x1 && hero.onGround) return id;
    return null;
  };

  function updateObjective() {
    ui.objective(quest ? 'Go through the cellar door' : 'Talk to Bram, the barkeep');
  }

  function startPlay() {
    state = 'play';
    ui.showHud(true);
    game.syncHud();
    updateObjective();
  }

  function talkBram() {
    hero.face = 'right';
    if (!quest) {
      ui.say([
        { name: 'Bram', text: 'A knight! Good. Monsters have crawled up out of my cellar.' },
        { name: 'Bram', text: "Clear them out and 100 gold is yours. Here's the key — door's at the far end." },
      ], () => {
        quest = true;
        player.key = true;
        game.syncHud();
        ui.banner('Quest accepted: Clear the Cellar');
        updateObjective();
      });
    } else {
      const lines = [
        "Cellar door's at the far end.",
        'Drinks are on me when you get back.',
        "Still here? Go on, then.",
      ];
      ui.say([{ name: 'Bram', text: lines[bramTalks++ % lines.length] }]);
    }
  }

  function talkPatron() {
    hero.face = hero.x < 170 ? 'right' : 'left';
    const lines = [
      "Zzz... don't go in the cellar... zzz...",
      '*snore* ...one more ale... *snore*',
      'Zzz... the deepest room... has a guardian... zzz...',
    ];
    ui.say([{ name: 'Sleepy patron', text: lines[patronTalks++ % lines.length] }]);
  }

  function useCellar() {
    hero.face = 'right';
    if (!quest) {
      ui.say([{ text: "Locked. Maybe the barkeep has a key." }]);
      return;
    }
    ui.choice('Descend into the cellar?', [
      { label: 'Descend', onPick: () => ui.fade(() => game.goto('room')) },
      { label: 'Not yet' },
    ]);
  }

  function showTitle() {
    const { el, button } = ui;
    ui.showHud(false);
    ui.showScreen([
      el('dq-kicker', 'Chapter I'),
      el('dq-title', 'Dungeon Delve'),
      el('dq-sub', 'The Rusty Flagon'),
      button('Tap to begin', 'dq-tap', (e) => { e.stopPropagation(); begin(); }),
    ], begin);
  }

  function begin() {
    if (state !== 'title') return;
    ui.hideScreen();
    state = 'intro';
    hero.x = DOOR_X;
    hero.face = 'right';
    doorOpen = 0;
  }

  if (opts.returning) {
    hero.x = 488;
    hero.face = 'left';
    startPlay();
  } else {
    showTitle();
  }

  function update(dt) {
    time += dt;
    const { W } = game.view;

    if (Math.random() < dt * 8) embers.push({ x: FIRE.x - 10 + Math.random() * 20, y: GROUND - 8, vy: -14 - Math.random() * 16, life: 1 });
    for (const e of embers) { e.y += e.vy * dt; e.x += Math.sin(time * 3 + e.y) * 0.15; e.life -= dt * 0.8; }
    while (embers.length && embers[0].life <= 0) embers.shift();
    if (Math.random() < dt * 0.7) zzz.push({ x: 160, y: 118, life: 1 });
    for (const z of zzz) { z.y -= dt * 7; z.x += dt * 4; z.life -= dt * 0.45; }
    while (zzz.length && zzz[0].life <= 0) zzz.shift();
    cellarOpen += ((quest ? 1 : 0) - cellarOpen) * Math.min(1, dt * 3);

    let target;
    if (state === 'title') {
      target = 260 + Math.sin(time * 0.15) * 120 - W / 2; // slow pan
    } else {
      if (state === 'intro') {
        doorOpen = Math.min(1, doorOpen + dt * 2);
        if (doorOpen >= 1) hero.step(dt, 0.6, world);
        if (hero.x >= 72) {
          state = 'narration';
          ui.say([{ text: 'The Rusty Flagon. The barkeep looks like he has a job for you.' }], startPlay);
        }
      } else {
        if (state === 'narration') doorOpen = Math.max(0, doorOpen - dt * 2);
        hero.step(dt, ui.busy || state !== 'play' ? 0 : input.x, world);
      }
      target = hero.x - W / 2;
    }
    const maxCam = WORLD_W - W;
    target = maxCam < 0 ? maxCam / 2 : Math.max(0, Math.min(maxCam, target));
    camX += (target - camX) * Math.min(1, dt * (state === 'title' ? 2 : 8));

    input.setReady(state === 'play' && !ui.busy && !!near());
  }

  // ---------- Drawing ----------

  function drawFire(ctx) {
    for (let i = 0; i < 9; i++) {
      const h = 10 + Math.sin(time * 9 + i * 1.7) * 4 + Math.sin(time * 23 + i) * 2;
      const x = FIRE.x - 13 + i * 3;
      ctx.fillStyle = '#d9481a';
      ctx.fillRect(x, GROUND - 6 - h, 3, h);
      ctx.fillStyle = '#ffa62e';
      ctx.fillRect(x + 1, GROUND - 6 - h * 0.6, 1, h * 0.6);
    }
    ctx.fillStyle = '#ffe680';
    ctx.fillRect(FIRE.x - 5, GROUND - 10, 10, 4);
  }

  function flame(ctx, x, y) {
    ctx.fillStyle = Math.sin(time * 13 + x) > 0 ? '#ffb02e' : '#ffd23f';
    ctx.fillRect(x, y - 3, 2, 3);
    ctx.fillStyle = '#fff3b0';
    ctx.fillRect(x, y - 4, 1, 1);
  }

  function bubble(ctx, x, y, kind) {
    const bob = Math.round(Math.sin(time * 4) * 1.5);
    y += bob;
    if (kind === '!') {
      ctx.fillStyle = '#1a1020';
      ctx.fillRect(x - 2, y - 1, 5, 9);
      ctx.fillRect(x - 2, y + 9, 5, 4);
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(x - 1, y, 3, 7);
      ctx.fillRect(x - 1, y + 10, 3, 2);
      return;
    }
    // Speech bubble with an "A" (press A to interact).
    ctx.fillStyle = '#1a1020';
    ctx.fillRect(x - 6, y - 1, 13, 11);
    ctx.fillRect(x - 1, y + 10, 3, 2);
    ctx.fillStyle = '#f3e6c8';
    ctx.fillRect(x - 5, y, 11, 9);
    ctx.fillRect(x, y + 9, 1, 2);
    ctx.fillStyle = '#c0392b';
    const A = ['####.', '#...#', '####.', '#...#', '####.']; // "B" = use
    A.forEach((row, ry) => [...row].forEach((ch, rx) => { if (ch === '#') ctx.fillRect(x - 2 + rx, y + 2 + ry, 1, 1); }));
  }

  function render(ctx, view) {
    const { W, S } = view;
    if (!light || light.width !== W * S) {
      [light, lctx] = canvas(W * S, H * S);
      lctx.scale(S, S);
    }
    const cx = Math.round(camX);
    ctx.fillStyle = '#05030a';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(-cx, 0);

    ctx.drawImage(back, 0, 0);
    drawFire(ctx);
    flame(ctx, 70, 70);
    flame(ctx, 116, 70);

    // Lanterns.
    for (const lx of LANTERNS) {
      const sway = Math.round(Math.sin(time * 1.5 + lx) * 1);
      ctx.fillStyle = '#1a1020';
      ctx.fillRect(lx - 4 + sway, 33, 9, 12);
      ctx.fillStyle = Math.sin(time * 11 + lx) > -0.3 ? '#ffd76a' : '#ffbe3c';
      ctx.fillRect(lx - 3 + sway, 35, 7, 8);
      ctx.fillStyle = '#4a4a52';
      ctx.fillRect(lx - 4 + sway, 33, 9, 2);
    }

    // Front door opening during the intro.
    if (doorOpen > 0) {
      ctx.fillStyle = '#0b0710';
      ctx.fillRect(DOOR_X - 12, 99, Math.round(24 * doorOpen), GROUND - 99);
    }

    // Cellar door: swings open once you have the key.
    {
      const x = 505, w = 30, top = 96;
      ctx.fillStyle = '#0a0608';
      ctx.fillRect(x, top, w, GROUND - top);
      // Steps going down, visible through the open door.
      if (cellarOpen > 0.05) {
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = `rgba(90, 85, 100, ${cellarOpen * (0.7 - i * 0.15)})`;
          ctx.fillRect(x + 4 + i * 3, GROUND - 8 - i * 9, w - 8 - i * 6, 2);
        }
      }
      const dw = Math.round(w * (1 - cellarOpen * 0.8));
      ctx.fillStyle = '#5a3418';
      ctx.fillRect(x, top, dw, GROUND - top);
      ctx.fillStyle = '#4a4a52';
      ctx.fillRect(x, top + 8, dw, 2);
      ctx.fillRect(x, GROUND - 14, dw, 2);
      if (dw > 12) {
        ctx.fillStyle = '#46280f';
        for (let i = 6; i < dw; i += 6) ctx.fillRect(x + i, top, 1, GROUND - top);
        ctx.fillStyle = quest ? '#6a6a72' : '#c9a24a';
        ctx.fillRect(x + dw - 8, top + 26, 4, 5); // lock
      }
    }

    // Bram behind the bar, polishing a mug.
    const bramX = 302, bramY = 102 + (Math.sin(time * 2) > 0.95 ? -1 : 0);
    ctx.drawImage(BRAM, bramX, bramY);
    const polish = Math.round(Math.sin(time * 5) * 3);
    ctx.fillStyle = '#140c18';
    ctx.fillRect(bramX + 11 + polish, bramY + 19, 8, 8);
    ctx.fillStyle = '#c9c9c9';
    ctx.fillRect(bramX + 12 + polish, bramY + 20, 6, 6);
    ctx.fillStyle = '#f5e6b0';
    ctx.fillRect(bramX + 12 + polish, bramY + 20, 6, 1);

    // Sleeping patron slumped at his table.
    ctx.drawImage(PATRON, 142, 117);

    ctx.drawImage(mid, 0, 0);
    for (const t of CANDLES) flame(ctx, t.x, 129);

    if (state !== 'title') drawHero(ctx, hero, time);

    // Lighting: darken everything, then cut warm holes around light sources.
    lctx.globalCompositeOperation = 'source-over';
    lctx.clearRect(0, 0, W, H);
    lctx.fillStyle = 'rgba(8, 4, 18, 0.58)';
    lctx.fillRect(0, 0, W, H);
    lctx.globalCompositeOperation = 'destination-out';
    const lights = [
      [FIRE.x, GROUND - 14, 82 + Math.sin(time * 7) * 4],
      ...LANTERNS.map((lx) => [lx, 40, 62 + Math.sin(time * 5 + lx) * 2]),
      ...CANDLES.map((c) => [c.x, 126, 38 + Math.sin(time * 11 + c.x) * 2]),
      [70, 68, 18], [116, 68, 18],
      [462, 64, 40],
      [hero.x, hero.y - 24, 44],
    ];
    if (quest) lights.push([520, 124, 30 * cellarOpen + Math.sin(time * 3) * 2]);
    for (const [x, y, r] of lights) {
      const grad = lctx.createRadialGradient(x - cx, y, 0, x - cx, y, Math.max(1, r));
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = grad;
      lctx.fillRect(x - cx - r, y - r, r * 2, r * 2);
    }
    ctx.restore();
    ctx.drawImage(light, 0, 0, W, H);

    ctx.save();
    ctx.translate(-cx, 0);
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(FIRE.x, GROUND - 14, 0, FIRE.x, GROUND - 14, 90);
    glow.addColorStop(0, `rgba(255, 120, 40, ${0.2 + Math.sin(time * 9) * 0.03})`);
    glow.addColorStop(1, 'rgba(255, 120, 40, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(FIRE.x - 90, GROUND - 104, 180, 180);
    ctx.globalCompositeOperation = 'source-over';

    for (const e of embers) {
      ctx.fillStyle = `rgba(255, ${150 + e.life * 80}, 60, ${e.life})`;
      ctx.fillRect(e.x, e.y, 1, 1);
    }
    for (const z of zzz) {
      ctx.fillStyle = `rgba(220, 220, 255, ${z.life})`;
      const x = Math.round(z.x), y = Math.round(z.y);
      ctx.fillRect(x, y, 4, 1); ctx.fillRect(x + 2, y + 1, 1, 1); ctx.fillRect(x + 1, y + 2, 1, 1); ctx.fillRect(x, y + 3, 4, 1);
    }

    // Markers: quest "!" over Bram, "A" bubble over whatever you can use.
    if (state === 'play' || state === 'narration') {
      const n = state === 'play' && !ui.busy ? near() : null;
      if (n === 'bram') bubble(ctx, 317, 86, 'A');
      else if (!quest) bubble(ctx, 317, 86, '!');
      if (n === 'patron') bubble(ctx, 158, 98, 'A');
      if (n === 'cellar') bubble(ctx, 520, 74, 'A');
    }
    ctx.restore();
  }

  return {
    update,
    render,
    onAction(name) {
      if (state === 'title') { if (name === 'interact' || name === 'attack') begin(); return; }
      if (state !== 'play' || ui.busy) return;
      if (name === 'jump') hero.jump();
      else if (name === 'attack') {
        hero.attack();
        const n = near();
        if (time - pokeTime > 3 && (n === 'bram' || n === 'patron')) {
          pokeTime = time;
          ui.say([n === 'bram'
            ? { name: 'Bram', text: 'Oi! Save that for the cellar!' }
            : { name: 'Sleepy patron', text: '*snort* ...five more minutes...' }]);
        }
      } else if (name === 'interact') {
        const n = near();
        if (n === 'bram') talkBram();
        else if (n === 'patron') talkPatron();
        else if (n === 'cellar') useCellar();
        else hero.jump(); // B is jump when there's nothing to use
      }
    },
    dispose() { input.setReady(false); },
  };
}
