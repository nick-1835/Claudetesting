// Tiny platformer physics shared by the hero, enemies and pickups.
// A body is { x, y, vx, vy, hw, hh }: x is its centre, y the bottom of its feet.
// A world provides: gravity, solid(px, py), and optionally platformTop(xl, xr, y0, y1)
// for one-way ledges you can jump up through and land on.

function hits(world, b, x, y) {
  const xs = [x - b.hw, x, x + b.hw - 0.01];
  const ys = [y - b.hh, y - b.hh / 2, y - 0.01];
  for (const px of xs) for (const py of ys) if (world.solid(px, py)) return true;
  return false;
}

export function moveBody(b, dt, world) {
  b.vy = Math.min(b.vy + world.gravity * dt, 520);
  b.hitWall = false;

  // Horizontal, one pixel at a time so nothing tunnels through walls.
  let rem = b.vx * dt;
  while (rem !== 0) {
    const s = Math.abs(rem) > 1 ? Math.sign(rem) : rem;
    if (hits(world, b, b.x + s, b.y)) { b.hitWall = true; b.vx = 0; break; }
    b.x += s;
    rem -= s;
  }

  // Vertical.
  b.onGround = false;
  rem = b.vy * dt;
  while (rem !== 0) {
    const s = Math.abs(rem) > 1 ? Math.sign(rem) : rem;
    const ny = b.y + s;
    if (s > 0 && world.platformTop) {
      const top = world.platformTop(b.x - b.hw, b.x + b.hw, b.y, ny);
      if (top !== null && !b.dropThrough) { b.y = top; b.vy = 0; b.onGround = true; break; }
    }
    if (hits(world, b, b.x, ny)) {
      if (s > 0) b.onGround = true;
      b.vy = 0;
      break;
    }
    b.y = ny;
    rem -= s;
  }
  if (!b.onGround && b.vy >= 0) b.onGround = standing(world, b);
}

/** Is there floor (or a ledge) directly under the body? */
export function standing(world, b) {
  if (hits(world, b, b.x, b.y + 1)) return true;
  return !!(world.platformTop && world.platformTop(b.x - b.hw, b.x + b.hw, b.y - 0.01, b.y + 1) !== null);
}

/** Is there ground at a point just ahead of the body (used so enemies don't walk off ledges)? */
export function groundAt(world, px, py) {
  return world.solid(px, py + 2) || !!(world.platformTop && world.platformTop(px, px, py - 0.5, py + 2) !== null);
}

export const overlap = (a, b) =>
  Math.abs(a.x - b.x) < a.hw + b.hw && a.y - a.hh < b.y && b.y - b.hh < a.y;
