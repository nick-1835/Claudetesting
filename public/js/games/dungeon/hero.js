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
    hw: 7,
    hh: 45,
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
      if (s < 0.3 || s > 0.75) return null;
      const dir = hero.face === 'right' ? 1 : -1;
      return { x: hero.x + dir * 22, y: hero.y - 2, hw: 24, hh: 48 };
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
  const len = 25;
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

const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
const REST_ANGLE = 2.45; // sword held low, pointing back and down

// Sword-hand path through a swing (in sprite pixels, facing right) and blade angle.
function swingPose(s) {
  const rest = { x: 12, y: 26 }, raised = { x: 15, y: 9 }, struck = { x: 31, y: 22 };
  if (s < 0.25) { const t = ease(s / 0.25); return { hand: { x: lerp(rest.x, raised.x, t), y: lerp(rest.y, raised.y, t) }, angle: lerp(REST_ANGLE, 3.98, t), front: false }; }
  if (s < 0.6) { const t = ease((s - 0.25) / 0.35); return { hand: { x: lerp(raised.x, struck.x, t), y: lerp(raised.y, struck.y, t) }, angle: lerp(3.98, 6.98, t), front: true }; }
  const t = ease((s - 0.6) / 0.4);
  return { hand: { x: lerp(struck.x, rest.x, t), y: lerp(struck.y, rest.y, t) }, angle: lerp(6.98, REST_ANGLE + Math.PI * 2, t), front: t < 0.5 };
}

// Chunky pixel arm from shoulder to hand: outline, sleeve, then glove.
function drawArm(ctx, x0, y0, x1, y1) {
  const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for (const [color, r] of [['#140c18', 2], ['#213670', 1]]) {
    ctx.fillStyle = color;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      if (color !== '#140c18' && t > 0.55) ctx.fillStyle = '#7a4e2a'; // leather bracer
      ctx.fillRect(Math.round(lerp(x0, x1, t)) - r, Math.round(lerp(y0, y1, t)) - r, r * 2 + 1, r * 2 + 1);
    }
  }
}

export function drawHero(ctx, hero, time) {
  if (hero.hurtT > 0 && Math.floor(hero.hurtT * 14) % 2 === 0 && !hero.dead) return; // blink
  const set = HERO[hero.face];
  const dirSign = hero.face === 'right' ? 1 : -1;
  const sx = Math.round(hero.x - HERO.w / 2);
  const sy = Math.round(hero.y - HERO.h);
  const px = (lx) => sx + (dirSign > 0 ? lx : HERO.w - 1 - lx) + 0.5;

  if (hero.dead) {
    ctx.save();
    ctx.translate(hero.x, hero.y);
    ctx.rotate(dirSign * -Math.PI / 2);
    ctx.drawImage(set.stand, -HERO.w / 2, -HERO.h + 6);
    ctx.restore();
    return;
  }

  const s = hero.swing;
  if (s < 0) {
    // Guard stance: sword low behind him, shield forward.
    let img = set.stand;
    let bob = 0;
    if (!hero.onGround) img = set.jump;
    else if (hero.moving && hero.knockT <= 0) {
      const i = Math.floor(hero.walk) % 4;
      img = set.walk[i];
      bob = set.walkBob[i];
    }
    const hy = sy + HERO.hand.y + bob + (img === set.jump ? -2 : 0) + 0.5;
    drawSword(ctx, px(HERO.hand.x), hy, REST_ANGLE, dirSign);
    ctx.drawImage(img, sx, sy);
    return;
  }

  // Attacking: body without the sword arm, then the arm + sword drawn swinging.
  const pose = swingPose(s);
  const hx = px(pose.hand.x), hy = sy + pose.hand.y + 0.5;
  const shx = px(HERO.shoulder.x), shy = sy + HERO.shoulder.y + 0.5;
  if (!pose.front) { drawSword(ctx, hx, hy, pose.angle, dirSign); drawArm(ctx, shx, shy, hx, hy); }
  ctx.drawImage(set.attack, sx, sy);
  if (pose.front) { drawArm(ctx, shx, shy, hx, hy); drawSword(ctx, hx, hy, pose.angle, dirSign); }

  // Slash trail.
  if (s >= 0.3 && s < 0.75) {
    const alpha = 1 - (s - 0.3) / 0.45;
    const cx = px(20), cy = sy + 20;
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (dirSign > 0) ctx.arc(cx, cy, 27, -1.9, 0.9);
    else ctx.arc(cx, cy, 27, Math.PI - 0.9, Math.PI + 1.9);
    ctx.stroke();
    ctx.strokeStyle = `rgba(160, 210, 255, ${alpha * 0.5})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (dirSign > 0) ctx.arc(cx, cy, 22, -1.7, 0.8);
    else ctx.arc(cx, cy, 22, Math.PI - 0.8, Math.PI + 1.7);
    ctx.stroke();
  }
}
