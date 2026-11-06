// Placeholder for the dungeon itself. Next step: real rooms, enemies and combat.
import { W, H, T } from './tavern.js';
import { HERO } from './sprites.js';

export function createCellar(game) {
  const { ui } = game;
  let time = 0;

  ui.objective('');
  const { el, button } = ui;
  const title = el('h1', 'Room 1');
  title.className = 'dq-title small';
  ui.showScreen([
    el('dq-kicker', 'The Cellar'),
    title,
    el('dq-sub', 'The stairs creak beneath you. Somewhere in the dark, something growls...'),
    el('dq-note', 'Under construction: the rooms, monsters and combat come next!'),
    button('Back to the tavern', 'dq-btn', () => ui.fade(() => game.goto('tavern', { quest: true, returning: true }))),
  ]);

  return {
    update(dt) { time += dt; },
    render(ctx) {
      // Stone floor lit by a single torch.
      ctx.fillStyle = '#141018';
      ctx.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y += T) {
        for (let x = (y / T) % 2 ? -8 : 0; x < W; x += T) {
          ctx.fillStyle = '#2a2530';
          ctx.fillRect(x + 1, y + 1, T - 2, T - 2);
        }
      }
      ctx.drawImage(HERO.up[1], W / 2 - 6, H - 60);
      const r = 90 + Math.sin(time * 8) * 4;
      const grad = ctx.createRadialGradient(W / 2, H - 60, 10, W / 2, H - 60, r);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(5,3,10,0.92)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    },
    onTap() {},
    onKey() {},
    dispose() {},
  };
}
