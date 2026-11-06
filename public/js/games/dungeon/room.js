// Dungeon room 1: platforms, slimes and rats. Clear every enemy to unlock the exit.
import { createHero, drawHero } from './hero.js';
import { moveBody, groundAt, overlap } from './physics.js';
import { SLIME, RAT } from './sprites.js';

const T = 18;
const H = 180;
// # stone  = wooden ledge (jump up through it)  T torch  E entrance  D exit door  C chest
const MAP = [
  '########################################',
  '#......................................#',
  '#..T........T..........T...........T...#',
  '#...................C..................#',
  '#...................====...............#',
  '#.............====.........====........#',
  '#......................................#',
  '#.......====..........######..........D#',
  '#E....................######..........D#',
  '########################################',
];
const COLS = MAP[0].length;
const ROWS = MAP.length;
const WORLD_W = COLS * T;
const tile = (tx, ty) => (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS ? '#' : MAP[ty][tx]);

const ENEMY_TYPES = {
  slime: { art: SLIME, hw: 7, hh: 10, hp: 2, damage: 12, xp: 6, gold: [2, 4] },
  rat: { art: RAT, hw: 8, hh: 7, hp: 1, damage: 8, xp: 4, gold: [1, 3] },
};
const SPAWNS = [
  ['rat', 14, 8], ['slime', 10, 6], ['slime', 24, 6], ['rat', 32, 8], ['slime', 30, 4],
];

const world = {
  gravity: 900,
  solid(px, py) {
    const t = tile(Math.floor(px / T), Math.floor(py / T));
    return t === '#';
  },
  // One-way ledges: land on them only when falling onto their top edge.
  platformTop(xl, xr, y0, y1) {
    const ty = Math.floor(y1 / T);
    const top = ty * T;
    if (top < y0 - 0.001 || top > y1) return null;
    for (let tx = Math.floor(xl / T); tx <= Math.floor(xr / T); tx++) if (tile(tx, ty) === '=') return top;
    return null;
  },
};

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---------- Static art ----------

function buildRoom() {
  const c = document.createElement('canvas');
  c.width = WORLD_W;
  c.height = H;
  const g = c.getContext('2d');
  const rand = rng(5);
  const px = (color, x, y, w = 1, h = 1) => { g.fillStyle = color; g.fillRect(x, y, w, h); };

  // Back wall: dark bricks with the odd mossy or cracked stone.
  px('#16121c', 0, 0, WORLD_W, H);
  for (let y = 0; y < H; y += 9) {
    const off = (y / 9) % 2 ? 9 : 0;
    for (let x = -off; x < WORLD_W; x += 18) {
      const shade = rand();
      px(shade < 0.15 ? '#221c2a' : shade < 0.9 ? '#1d1824' : '#262030', x + 1, y + 1, 16, 7);
      if (rand() < 0.08) px('#2a3a26', x + 2 + Math.floor(rand() * 10), y + 6, 4, 2);
      if (rand() < 0.05) px('#100c14', x + 4 + Math.floor(rand() * 8), y + 2, 1, 5);
    }
  }
  // Chains and cobwebs.
  for (let i = 0; i < 6; i++) {
    const x = 40 + Math.floor(rand() * (WORLD_W - 80));
    const len = 10 + Math.floor(rand() * 24);
    for (let y = T; y < T + len; y += 3) px('#4a4654', x, y, 2, 2);
  }
  for (const [x, y, flip] of [[T, T, 1], [WORLD_W - T, T, -1]]) {
    for (let i = 0; i < 14; i++) px('rgba(200,200,220,0.25)', x + flip * i, y + i, 1, 1);
    for (let i = 0; i < 10; i++) px('rgba(200,200,220,0.2)', x + flip * i * 1.4, y + 3, 1, 1);
    for (let i = 0; i < 10; i++) px('rgba(200,200,220,0.2)', x + flip * 3, y + i * 1.4, 1, 1);
  }

  // Entrance archway with stairs going up.
  {
    const x = T, y = 7 * T;
    px('#0a080e', x, y - 6, T + 6, 2 * T + 6);
    for (let i = 0; i < 5; i++) px('#2e2838', x + i * 4, y + 2 * T - 6 - i * 7, 10, 3);
    px('#3d3648', x - 2, y - 8, T + 10, 3);
  }

  // Stone blocks and wooden ledges.
  for (let ty = 0; ty < ROWS; ty++) for (let tx = 0; tx < COLS; tx++) {
    const t = tile(tx, ty);
    const x = tx * T, y = ty * T;
    if (t === '#') {
      px('#3a3444', x, y, T, T);
      px('#4a4456', x + 1, y + 1, T - 2, T - 2);
      px('#2c2734', x, y + T - 1, T, 1);
      px('#2c2734', x + T - 1, y, 1, T);
      if (rand() < 0.4) px('#3f3a4a', x + 3 + Math.floor(rand() * 10), y + 4 + Math.floor(rand() * 8), 3, 2);
      if (tile(tx, ty - 1) !== '#') {
        px('#6a6478', x, y, T, 2); // lit top edge
        if (rand() < 0.5) px('#3f6a3a', x + Math.floor(rand() * 12), y - 1, 3 + Math.floor(rand() * 4), 2); // moss
      }
    } else if (t === '=') {
      px('#1a100a', x, y, T, 6);
      px('#8a5a30', x, y, T, 1);
      px('#7a4e2a', x, y + 1, T, 4);
      px('#5a3418', x + (tx % 2 ? 0 : 9), y + 1, 1, 4);
      if (tile(tx - 1, ty) !== '=') { px('#3a2412', x + 2, y + 6, 2, 6); px('#3a2412', x + 3, y + 10, 6, 2); }
      if (tile(tx + 1, ty) !== '=') { px('#3a2412', x + T - 4, y + 6, 2, 6); px('#3a2412', x + T - 9, y + 10, 6, 2); }
    }
  }
  return c;
}

// ---------- Scene ----------

export function createRoom(game) {
  const { ui, input } = game;
  const player = game.player;
  const snapshot = { ...player }; // restored if you fall in this room
  const art = buildRoom();
  let light = null, lctx = null;

  const hero = createHero(5 * T, 9 * T);
  hero.face = 'right';
  let time = 0;
  let camX = 0;
  let shake = 0;
  let state = 'play';
  let cleared = false;
  let chestOpen = false;
  const total = SPAWNS.length;
  const torches = [];
  let door = null, chest = null;
  for (let ty = 0; ty < ROWS; ty++) for (let tx = 0; tx < COLS; tx++) {
    const t = tile(tx, ty);
    if (t === 'T') torches.push({ x: tx * T + 9, y: ty * T + 8 });
    if (t === 'D' && !door) door = { x: tx * T + 9, y: (ty + 2) * T };
    if (t === 'C') chest = { x: tx * T + 9, y: (ty + 1) * T };
  }

  const enemies = SPAWNS.map(([type, tx, ty], i) => {
    const def = ENEMY_TYPES[type];
    return {
      type, def, x: tx * T + 9, y: (ty + 1) * T, vx: 0, vy: 0, hw: def.hw, hh: def.hh,
      hp: def.hp, dir: i % 2 ? 1 : -1, timer: 0.5 + i * 0.3, anim: 0, flash: 0, hitBy: -1, onGround: false,
    };
  });
  const coins = [];
  const particles = [];
  const popups = [];

  const xpNeeded = () => 20 + (player.level - 1) * 15;

  function popup(x, y, text, color) { popups.push({ x, y, text, color, life: 1 }); }

  function burst(x, y, colors, n = 14) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 30 + Math.random() * 70;
      particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: 0.5 + Math.random() * 0.4, color: colors[i % colors.length] });
    }
  }

  function updateObjective() {
    const left = enemies.length;
    ui.objective(cleared ? 'Room clear! Go through the door' : `Defeat the monsters (${total - left}/${total})`);
  }

  function gainXp(n) {
    player.xp += n;
    while (player.xp >= xpNeeded()) {
      player.xp -= xpNeeded();
      player.level++;
      player.maxHp += 10;
      player.hp = player.maxHp;
      ui.banner(`Level up! LV${player.level}`);
    }
    game.syncHud();
  }

  function kill(e) {
    burst(e.x, e.y - e.hh / 2, e.type === 'slime' ? ['#5cc24a', '#c8f5b8', '#3a8a30'] : ['#7c7488', '#e8e0f0', '#55506a']);
    const [lo, hi] = e.def.gold;
    const n = lo + Math.floor(Math.random() * (hi - lo + 1));
    for (let i = 0; i < n; i++) {
      coins.push({ x: e.x, y: e.y - 4, vx: (Math.random() - 0.5) * 90, vy: -140 - Math.random() * 80, hw: 2, hh: 4, age: 0, onGround: false });
    }
    popup(e.x, e.y - e.hh - 4, `+${e.def.xp} XP`, '#9fd8ff');
    gainXp(e.def.xp);
    enemies.splice(enemies.indexOf(e), 1);
    if (!enemies.length) {
      cleared = true;
      ui.banner('Room cleared!');
    }
    updateObjective();
  }

  function die() {
    state = 'dead';
    hero.dead = true;
    setTimeout(() => {
      if (state !== 'dead') return;
      const { el, button } = ui;
      ui.showScreen([
        el('dq-title small', 'You were defeated'),
        el('dq-sub', 'The darkness takes you... but a true knight gets back up.'),
        button('Try the room again', 'dq-btn', (e) => {
          e.stopPropagation();
          Object.assign(player, snapshot);
          ui.fade(() => game.goto('room'));
        }),
        button('Back to the tavern', 'dq-btn alt', (e) => {
          e.stopPropagation();
          Object.assign(player, snapshot, { hp: snapshot.maxHp });
          ui.fade(() => game.goto('tavern', { quest: true, returning: true }));
        }),
      ]);
    }, 900);
  }

  function nearDoor() { return cleared && Math.abs(hero.x - door.x) < 18 && hero.onGround; }
  function nearChest() { return chest && !chestOpen && Math.abs(hero.x - chest.x) < 16 && Math.abs(hero.y - chest.y) < 4; }

  ui.showHud(true);
  game.syncHud();
  updateObjective();
  ui.banner('Room 1 — The Cellar');

  // ---------- Update ----------

  function updateEnemy(e, dt) {
    e.anim += dt;
    if (e.flash > 0) e.flash -= dt;
    const dx = hero.x - e.x;
    const close = Math.abs(dx) < 110 && Math.abs(hero.y - e.y) < 40 && !hero.dead;

    if (e.type === 'slime') {
      if (e.onGround) {
        e.vx *= 0.8;
        e.timer -= dt;
        if (e.timer <= 0) {
          e.dir = close ? Math.sign(dx) || 1 : (Math.random() < 0.5 ? -1 : 1);
          e.vx = e.dir * (close ? 70 : 40);
          e.vy = close ? -220 : -150;
          e.timer = close ? 0.9 + Math.random() * 0.5 : 1.4 + Math.random();
        }
      }
    } else {
      const speed = close ? 78 : 34;
      if (close) e.dir = Math.sign(dx) || e.dir;
      // Turn around at walls and ledge edges.
      const ahead = e.x + e.dir * (e.hw + 2);
      if (e.onGround && (!groundAt(world, ahead, e.y) || world.solid(ahead, e.y - 3))) {
        if (close) e.vx = 0; else e.dir *= -1;
      }
      if (e.onGround) e.vx = (close && !groundAt(world, ahead, e.y)) ? 0 : e.dir * speed;
    }
    if (e.knock > 0) e.knock -= dt;
    moveBody(e, dt, world);
    if (e.type === 'slime' && e.hitWall) e.dir *= -1;

    // Sword hits.
    const hb = hero.hitBox;
    if (hb && e.hitBy !== hero.swingId && overlap(hb, e)) {
      e.hitBy = hero.swingId;
      e.hp -= 1;
      e.flash = 0.15;
      e.vx = (e.x < hero.x ? -1 : 1) * 120;
      e.vy = -120;
      shake = 0.12;
      burst(e.x, e.y - e.hh / 2, ['#ffffff', '#ffe08a'], 6);
      if (e.hp <= 0) { kill(e); return; }
    }

    // Touching the hero hurts.
    if (!hero.dead && overlap(e, hero) && hero.hurt(e.x)) {
      player.hp = Math.max(0, player.hp - e.def.damage);
      popup(hero.x, hero.y - 44, `-${e.def.damage}`, '#ff6b5e');
      shake = 0.25;
      game.syncHud();
      if (player.hp <= 0) die();
    }
  }

  function update(dt) {
    time += dt;
    const { W } = game.view;
    const busy = ui.busy || state !== 'play';
    hero.step(dt, busy ? 0 : input.x, world);
    for (const e of [...enemies]) updateEnemy(e, dt);

    for (const c of [...coins]) {
      c.age += dt;
      moveBody(c, dt, world);
      if (c.onGround) c.vx *= 0.85;
      if (c.age > 0.3 && Math.abs(c.x - hero.x) < 12 && c.y > hero.y - 40 && c.y < hero.y + 4 && !hero.dead) {
        coins.splice(coins.indexOf(c), 1);
        player.gold += 1;
        popup(c.x, c.y - 8, '+1', '#ffe08a');
        game.syncHud();
      }
    }
    for (const p of particles) { p.vy += 300 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);
    for (const p of popups) { p.y -= 18 * dt; p.life -= dt * 0.9; }
    for (let i = popups.length - 1; i >= 0; i--) if (popups[i].life <= 0) popups.splice(i, 1);
    if (shake > 0) shake -= dt;

    const maxCam = WORLD_W - W;
    const target = maxCam < 0 ? maxCam / 2 : Math.max(0, Math.min(maxCam, hero.x - W / 2));
    camX += (target - camX) * Math.min(1, dt * 8);

    input.setReady(state === 'play' && !ui.busy && (nearDoor() || nearChest()));
  }

  // ---------- Draw ----------

  function drawEnemy(ctx, e) {
    const art = e.def.art;
    const frame = e.type === 'slime' ? (e.onGround ? (Math.sin(e.anim * 6) > 0 ? 0 : 1) : 0) : Math.floor(e.anim * 10) % 2;
    const facingLeft = e.type === 'rat' ? e.dir < 0 : false;
    const img = e.flash > 0
      ? (facingLeft ? art.flashLeft : art.flash)[frame]
      : (facingLeft ? art.left : art.right)[frame];
    ctx.drawImage(img, Math.round(e.x - art.w / 2), Math.round(e.y - art.h));
  }

  function drawDoor(ctx) {
    const x = door.x - 9, top = door.y - 2 * T;
    ctx.fillStyle = '#0a080e';
    ctx.fillRect(x - 2, top - 4, T + 4, 2 * T + 4);
    ctx.fillStyle = '#3d3648';
    ctx.fillRect(x - 4, top - 6, T + 8, 3);
    if (!cleared) {
      ctx.fillStyle = '#4a4654';
      ctx.fillRect(x, top, T, 2 * T);
      ctx.fillStyle = '#2c2734';
      for (let i = 3; i < T; i += 4) ctx.fillRect(x + i, top, 1, 2 * T);
      ctx.fillStyle = '#6a6478';
      ctx.fillRect(x, top + 6, T, 2);
      ctx.fillRect(x, top + 2 * T - 9, T, 2);
      ctx.fillStyle = '#c9a24a';
      ctx.fillRect(x + 6, top + 16, 6, 6); // padlock
      ctx.fillStyle = '#1a1020';
      ctx.fillRect(x + 8, top + 18, 2, 3);
    } else {
      const glow = 0.5 + Math.sin(time * 4) * 0.2;
      ctx.fillStyle = `rgba(255, 210, 120, ${glow * 0.35})`;
      ctx.fillRect(x, top, T, 2 * T);
    }
  }

  function drawChest(ctx) {
    if (!chest) return;
    const x = chest.x - 8, y = chest.y - 12;
    ctx.fillStyle = '#1a1020';
    ctx.fillRect(x - 1, y - 1, 18, 13);
    ctx.fillStyle = '#8a5a30';
    ctx.fillRect(x, y + 4, 16, 8);
    ctx.fillStyle = chestOpen ? '#2a1a10' : '#a86a34';
    ctx.fillRect(x, y, 16, 5);
    ctx.fillStyle = '#e8b84a';
    ctx.fillRect(x, y + 4, 16, 1);
    ctx.fillRect(x + 7, y + 3, 2, 4);
    if (chestOpen) { ctx.fillStyle = '#5a3418'; ctx.fillRect(x, y - 5, 16, 5); }
  }

  function bubbleA(ctx, x, y) {
    y += Math.round(Math.sin(time * 4) * 1.5);
    ctx.fillStyle = '#1a1020';
    ctx.fillRect(x - 6, y - 1, 13, 11);
    ctx.fillRect(x - 1, y + 10, 3, 2);
    ctx.fillStyle = '#f3e6c8';
    ctx.fillRect(x - 5, y, 11, 9);
    ctx.fillStyle = '#c0392b';
    ['.###.', '#...#', '#####', '#...#', '#...#'].forEach((row, ry) =>
      [...row].forEach((ch, rx) => { if (ch === '#') ctx.fillRect(x - 2 + rx, y + 2 + ry, 1, 1); }));
  }

  function render(ctx, view) {
    const { W, S } = view;
    if (!light || light.width !== W * S) {
      light = document.createElement('canvas');
      light.width = W * S;
      light.height = H * S;
      lctx = light.getContext('2d');
      lctx.scale(S, S);
    }
    let cx = Math.round(camX);
    if (shake > 0) cx += Math.round((Math.random() - 0.5) * 4);
    const cy = shake > 0 ? Math.round((Math.random() - 0.5) * 3) : 0;

    ctx.fillStyle = '#05030a';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(-cx, cy);
    ctx.drawImage(art, 0, 0);

    for (const t of torches) {
      ctx.fillStyle = '#3a3444';
      ctx.fillRect(t.x - 2, t.y + 2, 4, 8);
      ctx.fillStyle = '#5a3418';
      ctx.fillRect(t.x - 1, t.y - 2, 2, 5);
      for (let i = 0; i < 3; i++) {
        const h = 5 + Math.sin(time * 12 + i * 2 + t.x) * 2;
        ctx.fillStyle = i === 1 ? '#ffd23f' : '#ff7a1c';
        ctx.fillRect(t.x - 2 + i, t.y - 2 - h, 1 + (i === 1 ? 1 : 0), h);
      }
    }
    drawDoor(ctx);
    drawChest(ctx);

    for (const c of coins) {
      const spin = Math.abs(Math.sin(time * 8 + c.x));
      const w = Math.max(1, Math.round(4 * spin));
      ctx.fillStyle = '#1a1020';
      ctx.fillRect(Math.round(c.x - w / 2) - 1, Math.round(c.y - 6), w + 2, 6);
      ctx.fillStyle = '#f2c94c';
      ctx.fillRect(Math.round(c.x - w / 2), Math.round(c.y - 5), w, 4);
    }
    for (const e of enemies) drawEnemy(ctx, e);
    drawHero(ctx, hero, time);
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    }
    ctx.globalAlpha = 1;

    // Lighting: torches, the open door, and a soft glow around the hero.
    lctx.globalCompositeOperation = 'source-over';
    lctx.clearRect(0, 0, W, H);
    lctx.fillStyle = 'rgba(4, 2, 10, 0.72)';
    lctx.fillRect(0, 0, W, H);
    lctx.globalCompositeOperation = 'destination-out';
    const lights = [
      ...torches.map((t) => [t.x, t.y - 4, 62 + Math.sin(time * 9 + t.x) * 4]),
      [hero.x, hero.y - 20, 74],
      [T * 1.5, 8 * T, 40],
    ];
    if (cleared) lights.push([door.x, door.y - T, 46]);
    for (const [x, y, r] of lights) {
      const grad = lctx.createRadialGradient(x - cx, y + cy, 0, x - cx, y + cy, r);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = grad;
      lctx.fillRect(x - cx - r, y + cy - r, r * 2, r * 2);
    }
    ctx.restore();
    ctx.drawImage(light, 0, 0, W, H);

    ctx.save();
    ctx.translate(-cx, cy);
    ctx.globalCompositeOperation = 'lighter';
    for (const t of torches) {
      const grad = ctx.createRadialGradient(t.x, t.y - 4, 0, t.x, t.y - 4, 40);
      grad.addColorStop(0, 'rgba(255, 130, 40, 0.18)');
      grad.addColorStop(1, 'rgba(255, 130, 40, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(t.x - 40, t.y - 44, 80, 80);
    }
    ctx.globalCompositeOperation = 'source-over';

    if (state === 'play' && !ui.busy) {
      if (nearDoor()) bubbleA(ctx, door.x, door.y - 2 * T - 16);
      if (nearChest()) bubbleA(ctx, chest.x, chest.y - 26);
    }
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    for (const p of popups) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
      ctx.fillStyle = '#1a1020';
      ctx.fillText(p.text, Math.round(p.x) + 1, Math.round(p.y) + 1);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, Math.round(p.x), Math.round(p.y));
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  return {
    update,
    render,
    onAction(name) {
      if (state !== 'play' || ui.busy) return;
      if (name === 'jump') hero.jump();
      else if (name === 'attack') hero.attack();
      else if (name === 'interact') {
        if (nearChest()) {
          chestOpen = true;
          for (let i = 0; i < 12; i++) {
            coins.push({ x: chest.x, y: chest.y - 8, vx: (Math.random() - 0.5) * 120, vy: -160 - Math.random() * 90, hw: 2, hh: 4, age: 0, onGround: false });
          }
          burst(chest.x, chest.y - 10, ['#ffe08a', '#fff3b0'], 10);
        } else if (nearDoor()) {
          const { el, button } = ui;
          state = 'done';
          ui.showScreen([
            el('dq-kicker', 'Room 1'),
            el('dq-title small', 'Cleared!'),
            el('dq-sub', `Gold: ${player.gold} · Level ${player.level}`),
            el('dq-note', 'Room 2 is being built next — deeper, darker, and with tougher monsters.'),
            button('Back to the tavern', 'dq-btn', (e) => {
              e.stopPropagation();
              ui.fade(() => game.goto('tavern', { quest: true, returning: true }));
            }),
            button('Replay this room', 'dq-btn alt', (e) => {
              e.stopPropagation();
              Object.assign(player, snapshot);
              ui.fade(() => game.goto('room'));
            }),
          ]);
        }
      }
    },
    dispose() { input.setReady(false); state = 'gone'; },
  };
}
