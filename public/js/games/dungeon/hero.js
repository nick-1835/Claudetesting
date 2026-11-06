// The hero: movement, jumping, sword swings and taking damage. Shared by every scene.
import { HERO } from './sprites.js';
import { moveBody } from './physics.js';

const SPEED = 80;
const JUMP_V = 300;
const ATTACK_TIME = 0.34;
const HURT_TIME = 1.0;

export function createHero(x, y) {
  const hero = {
    x,
    y,
    vx: 0,
    vy: 0,
    hw: 6,
    hh: 27,
    face: 'right',
    walk: 0,
    moving: false,
    onGround: true,
    attackT: 0, // counts down while swinging
    swingId: 0, // changes every swing, so each enemy is hit once per swing
    hurtT: 0, // invulnerable while > 0
    knockT: 0,
    dead: false,

    /** Advance physics. `dir` is -1..1 from the joystick / keys. */
    step(dt, dir, world) {
      if (hero.dead) dir = 0;
      if (hero.knockT > 0) {
        hero.knockT -= dt;
      } else {
        hero.vx = dir * SPEED;
        hero.moving = Math.abs(dir) > 0.05;
        if (hero.moving) {
          hero.face = dir > 0 ? 'right' : 'left';
          hero.walk += dt * 9 * Math.min(1, Math.abs(dir) + 0.3);
        }
      }
      moveBody(hero, dt, world);
      if (hero.attackT > 0) hero.attackT = Math.max(0, hero.attackT - dt);
      if (hero.hurtT > 0) hero.hurtT = Math.max(0, hero.hurtT - dt);
    },
    jump() {
      if (!hero.onGround || hero.dead) return;
      hero.vy = -JUMP_V;
      hero.onGround = false;
    },
    attack() {
      if (hero.attackT > 0 || hero.dead) return false;
      hero.attackT = ATTACK_TIME;
      hero.swingId++;
      return true;
    },
    /** 0..1 progress through the current swing, or -1 when not attacking. */
    get swing() { return hero.attackT > 0 ? 1 - hero.attackT / ATTACK_TIME : -1; },
    /** Area the sword hits during the active part of a swing, or null. */
    get hitBox() {
      const s = hero.swing;
      if (s < 0.2 || s > 0.7) return null;
      const dir = hero.face === 'right' ? 1 : -1;
      return { x: hero.x + dir * 17, y: hero.y - 2, hw: 17, hh: 30 };
    },
    /** Take a hit from something at `fromX`. Returns false while still invulnerable. */
    hurt(fromX) {
      if (hero.hurtT > 0 || hero.dead) return false;
      hero.hurtT = HURT_TIME;
      hero.knockT = 0.22;
      hero.vx = hero.x < fromX ? -130 : 130;
      hero.vy = -140;
      return true;
    },
  };
  return hero;
}

// Crisp 1-pixel line (Bresenham) so the sword stays pixel-art at any angle.
function pixelLine(ctx, x0, y0, x1, y1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    ctx.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

function drawSword(ctx, hx, hy, angle, dirSign) {
  const a = dirSign > 0 ? angle : Math.PI - angle;
  const c = Math.cos(a), s = Math.sin(a);
  const len = 19;
  const bx = hx + c * 3, by = hy + s * 3;
  const tx = hx + c * len, ty = hy + s * len;
  // Blade: dark edge, steel, bright edge.
  ctx.fillStyle = '#1a1020';
  pixelLine(ctx, bx - s, by + c, tx - s, ty + c);
  ctx.fillStyle = '#b4bccb';
  pixelLine(ctx, bx, by, tx, ty);
  ctx.fillStyle = '#eef2f8';
  pixelLine(ctx, bx + s * 0.9, by - c * 0.9, tx - c, ty - s);
  // Cross-guard and grip.
  ctx.fillStyle = '#e8b84a';
  pixelLine(ctx, bx - s * 3, by + c * 3, bx + s * 3, by - c * 3);
  ctx.fillStyle = '#5a3a1a';
  pixelLine(ctx, hx, hy, hx - c * 2, hy - s * 2);
  ctx.fillStyle = '#e8b84a';
  ctx.fillRect(Math.round(hx - c * 3), Math.round(hy - s * 3), 1, 1);
}

export function drawHero(ctx, hero, time) {
  if (hero.hurtT > 0 && Math.floor(hero.hurtT * 14) % 2 === 0 && !hero.dead) return; // blink
  const set = HERO[hero.face];
  let img = set.stand;
  if (!hero.onGround) img = set.jump;
  else if (hero.moving && hero.knockT <= 0) img = set.walk[Math.floor(hero.walk) % 4];
  const sx = Math.round(hero.x - HERO.w / 2);
  const sy = Math.round(hero.y - HERO.h);
  const dirSign = hero.face === 'right' ? 1 : -1;
  const hx = sx + (dirSign > 0 ? HERO.hand.x : HERO.w - 1 - HERO.hand.x) + 0.5;
  const hy = sy + HERO.hand.y + 0.5;

  if (hero.dead) {
    ctx.save();
    ctx.translate(hero.x, hero.y);
    ctx.rotate(dirSign * -Math.PI / 2);
    ctx.drawImage(set.stand, -HERO.w / 2, -HERO.h + 4);
    ctx.restore();
    return;
  }

  // Sword angle: held low and forward at rest, or windup -> slash -> follow-through.
  const s = hero.swing;
  let angle = 0.55;
  if (s >= 0) {
    if (s < 0.2) angle = 0.55 - (s / 0.2) * 2.75;
    else if (s < 0.55) angle = -2.2 + ((s - 0.2) / 0.35) * 3.1;
    else angle = 0.9 - ((s - 0.55) / 0.45) * 0.35;
  }
  const behind = s >= 0 && s < 0.2;
  if (behind) drawSword(ctx, hx, hy, angle, dirSign);
  ctx.drawImage(img, sx, sy);
  if (!behind) drawSword(ctx, hx, hy, angle, dirSign);

  // Slash trail.
  if (s >= 0.2 && s < 0.7) {
    const alpha = 1 - (s - 0.2) / 0.5;
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (dirSign > 0) ctx.arc(hx, hy, 18, -2.0, 0.8);
    else ctx.arc(hx, hy, 18, Math.PI - 0.8, Math.PI + 2.0);
    ctx.stroke();
    ctx.strokeStyle = `rgba(160, 210, 255, ${alpha * 0.5})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (dirSign > 0) ctx.arc(hx, hy, 14, -1.8, 0.7);
    else ctx.arc(hx, hy, 14, Math.PI - 0.7, Math.PI + 1.8);
    ctx.stroke();
  }
}
