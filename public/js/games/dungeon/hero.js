// The knight: side-view movement, jumping and sword swings. Shared by every scene.
import { KNIGHT } from './sprites.js';

const SPEED = 72;
const GRAVITY = 620;
const JUMP_V = 215;
const ATTACK_TIME = 0.32;

export function createHero(x, ground) {
  const hero = {
    x,
    y: ground,
    vy: 0,
    ground,
    face: 'right',
    walk: 0,
    moving: false,
    onGround: true,
    attackT: 0, // counts down while swinging

    /** Advance physics. `dir` is -1..1 from the joystick / keys. */
    step(dt, dir, worldW) {
      hero.moving = Math.abs(dir) > 0.05;
      if (hero.moving) {
        hero.x += dir * SPEED * dt;
        hero.face = dir > 0 ? 'right' : 'left';
        hero.walk += dt * 9 * Math.min(1, Math.abs(dir) + 0.3);
      }
      hero.x = Math.max(12, Math.min(worldW - 12, hero.x));
      hero.vy += GRAVITY * dt;
      hero.y += hero.vy * dt;
      if (hero.y >= hero.ground) { hero.y = hero.ground; hero.vy = 0; hero.onGround = true; }
      if (hero.attackT > 0) hero.attackT = Math.max(0, hero.attackT - dt);
    },
    jump() {
      if (!hero.onGround) return;
      hero.vy = -JUMP_V;
      hero.onGround = false;
    },
    attack() {
      if (hero.attackT > 0) return false;
      hero.attackT = ATTACK_TIME;
      return true;
    },
    /** 0..1 progress through the current swing, or -1 when not attacking. */
    get swing() { return hero.attackT > 0 ? 1 - hero.attackT / ATTACK_TIME : -1; },
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
  const cos = Math.cos(a), sin = Math.sin(a);
  const tipX = hx + cos * 11, tipY = hy + sin * 11;
  ctx.fillStyle = '#1a1020';
  pixelLine(ctx, hx + cos * 2 + 1, hy + sin * 2, tipX + 1, tipY);
  ctx.fillStyle = '#e6ebf2';
  pixelLine(ctx, hx + cos * 2, hy + sin * 2, tipX, tipY);
  // Cross-guard and grip.
  ctx.fillStyle = '#e8b84a';
  pixelLine(ctx, hx + cos * 2 - sin * 2, hy + sin * 2 + cos * 2, hx + cos * 2 + sin * 2, hy + sin * 2 - cos * 2);
  ctx.fillStyle = '#5a3a1a';
  pixelLine(ctx, hx, hy, hx - cos, hy - sin);
}

export function drawHero(ctx, hero, time) {
  const set = KNIGHT[hero.face];
  let img = set.stand;
  if (!hero.onGround) img = set.jump;
  else if (hero.moving) img = set.walk[Math.floor(hero.walk) % 4];
  const sx = Math.round(hero.x - KNIGHT.w / 2);
  const sy = Math.round(hero.y - KNIGHT.h + (!hero.moving && hero.onGround && Math.sin(time * 3) > 0.6 ? 0 : 0));
  const dirSign = hero.face === 'right' ? 1 : -1;
  const hx = sx + (dirSign > 0 ? KNIGHT.hand.x : KNIGHT.w - 1 - KNIGHT.hand.x) + 0.5;
  const hy = sy + KNIGHT.hand.y + 0.5;

  // Sword angle: resting upright, or windup -> slash -> follow-through.
  const s = hero.swing;
  let angle = -1.25;
  if (s >= 0) {
    if (s < 0.25) angle = -1.25 - (s / 0.25) * 0.9;
    else if (s < 0.6) angle = -2.15 + ((s - 0.25) / 0.35) * 2.8;
    else angle = 0.65 - ((s - 0.6) / 0.4) * 1.9;
  }
  const swordBehind = s >= 0 && s < 0.25;
  if (swordBehind) drawSword(ctx, hx, hy, angle, dirSign);
  ctx.drawImage(img, sx, sy);
  if (!swordBehind) drawSword(ctx, hx, hy, angle, dirSign);

  // Slash trail.
  if (s >= 0.25 && s < 0.75) {
    const alpha = 1 - (s - 0.25) / 0.5;
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (dirSign > 0) ctx.arc(hx, hy, 12, -1.6, 0.7);
    else ctx.arc(hx, hy, 12, Math.PI - 0.7, Math.PI + 1.6);
    ctx.stroke();
  }
}
