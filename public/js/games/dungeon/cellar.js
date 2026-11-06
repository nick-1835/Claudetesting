// Placeholder for the dungeon itself. Next step: real rooms, enemies and combat.
import { createHero, drawHero } from './hero.js';

const H = 180;
const GROUND = 150;

export function createCellar(game) {
  const { ui, input } = game;
  const hero = createHero(60, GROUND);
  let time = 0;

  ui.objective('');
  ui.showHud(true);
  const { el, button } = ui;
  ui.showScreen([
    el('dq-kicker', 'The Cellar'),
    el('dq-title small', 'Room 1'),
    el('dq-sub', 'The stairs creak beneath you. Somewhere in the dark, something growls...'),
    el('dq-note', 'Under construction: the rooms, monsters and combat come next!'),
    button('Back to the tavern', 'dq-btn', (e) => {
      e.stopPropagation();
      ui.fade(() => game.goto('tavern', { quest: true, returning: true }));
    }),
  ]);

  return {
    update(dt) { time += dt; hero.step(dt, ui.busy ? 0 : input.x, game.view.W); },
    render(ctx, { W }) {
      ctx.fillStyle = '#141018';
      ctx.fillRect(0, 0, W, H);
      for (let y = 0; y < GROUND; y += 12) {
        for (let x = (y / 12) % 2 ? -12 : 0; x < W; x += 24) {
          ctx.fillStyle = '#2a2530';
          ctx.fillRect(x + 1, y + 1, 22, 10);
        }
      }
      ctx.fillStyle = '#3d3a44';
      ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = '#5a5560';
      ctx.fillRect(0, GROUND, W, 2);
      drawHero(ctx, hero, time);
      const grad = ctx.createRadialGradient(hero.x, hero.y - 10, 10, hero.x, hero.y - 10, 110 + Math.sin(time * 8) * 4);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(5,3,10,0.93)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    },
    onAction(name) {
      if (name === 'jump') hero.jump();
      if (name === 'attack') hero.attack();
    },
    dispose() {},
  };
}
