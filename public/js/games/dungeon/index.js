// Dungeon Delve: a small 2D adventure. Scenes: tavern (start) -> cellar (dungeon rooms).
import { createLoop, trackKeys, pointerPos } from '../../engine.js';
import { createUI } from './ui.js';
import { createTavern, W, H } from './tavern.js';
import { createCellar } from './cellar.js';

const SCALE = 3; // canvas backing pixels per game pixel (keeps pixel art sharp)
const SCENES = { tavern: createTavern, cellar: createCellar };

export default {
  id: 'dungeon',
  title: 'Dungeon Delve',
  icon: '🗡️',
  description: 'A pixel-art adventure. Take a quest from the barkeep and clear the dungeon room by room.',
  help: '<span class="keys">Move with <kbd>WASD</kbd> / <kbd>Arrow keys</kbd> or click to walk. <kbd>E</kbd> / <kbd>Space</kbd> to talk.</span><span class="touch">Tap to walk. Tap people to talk.</span>',

  mount(root) {
    root.classList.add('dq-root');
    const canvas = document.createElement('canvas');
    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    canvas.dataset.w = W;
    canvas.dataset.h = H;
    canvas.dataset.maxScale = 3;
    canvas.className = 'game';
    const ctx = canvas.getContext('2d');
    root.append(canvas);

    const ui = createUI(root);
    let scene = null;

    const keys = trackKeys((key) => {
      if (ui.handleKey(key)) return;
      if (scene.onKey) scene.onKey(key);
    });
    const held = (...names) => names.some((n) => keys.isDown(n));
    const input = {
      get left() { return held('ArrowLeft', 'a', 'A'); },
      get right() { return held('ArrowRight', 'd', 'D'); },
      get up() { return held('ArrowUp', 'w', 'W'); },
      get down() { return held('ArrowDown', 's', 'S'); },
    };

    const game = {
      ui,
      input,
      scale: SCALE,
      goto(name, opts) {
        if (scene && scene.dispose) scene.dispose();
        ui.hideScreen();
        scene = SCENES[name](game, opts);
      },
    };
    game.goto('tavern');

    const onDown = (e) => {
      if (ui.dialogOpen) { ui.advance(); return; }
      if (e.target !== canvas || ui.busy) return;
      const p = pointerPos(canvas, W, H, e);
      scene.onTap(p.x, p.y);
    };
    root.addEventListener('pointerdown', onDown);

    const loop = createLoop(
      (dt) => scene.update(dt),
      () => {
        ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
        ctx.imageSmoothingEnabled = false;
        scene.render(ctx);
      },
    );
    loop.start();

    return () => {
      loop.stop();
      keys.dispose();
      root.removeEventListener('pointerdown', onDown);
      if (scene.dispose) scene.dispose();
      ui.dispose();
    };
  },
};
