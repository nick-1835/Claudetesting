// Dungeon Delve: a small side-view adventure.
// Scenes: tavern (start) -> cellar (dungeon rooms, coming next).
import { createLoop, trackKeys } from '../../engine.js';
import { createUI } from './ui.js';
import { createControls } from './controls.js';
import { createTavern } from './tavern.js';
import { createRoom } from './room.js';

const SCENES = { tavern: createTavern, room: createRoom };
const newPlayer = () => ({ hp: 100, maxHp: 100, gold: 10, level: 1, xp: 0, key: false });
const xpNeeded = (level) => 20 + (level - 1) * 15;
const VIEW_H = 180; // game pixels, top to bottom

export default {
  id: 'dungeon',
  title: 'Dungeon Delve',
  icon: '🗡️',
  description: 'A pixel-art knight adventure. Take a quest from the barkeep and clear the dungeon room by room.',
  immersive: true, // full screen, no arcade header

  mount(root) {
    root.classList.add('dq-root');
    const app = document.createElement('div');
    app.className = 'dq-app';
    const view = document.createElement('div');
    view.className = 'dq-view';
    const canvas = document.createElement('canvas');
    canvas.className = 'dq-canvas';
    view.append(canvas);
    app.append(view);
    root.append(app);
    const ctx = canvas.getContext('2d');

    let scene = null;
    let paused = false;
    const coarse = matchMedia('(pointer: coarse)').matches;

    const ui = createUI(view, { onPause: () => togglePause() });

    // ----- Input -----
    const action = (name) => {
      if (ui.handleAction(name)) return;
      if (paused) return;
      if (scene.onAction) scene.onAction(name);
    };
    const controls = createControls(action);
    app.append(controls.el);
    if (!coarse) app.classList.add('no-touch');

    const keys = trackKeys((key) => {
      if (key === 'Escape' || key === 'p' || key === 'P') { togglePause(); return; }
      if (key === 'e' || key === 'E' || key === 'Enter') action('interact');
      else if (key === 'j' || key === 'J' || key === 'x' || key === 'X' || key === 'k' || key === 'K') action('attack');
      else if (key === ' ' || key === 'w' || key === 'W' || key === 'ArrowUp') action(ui.busy ? 'interact' : 'jump');
      else if (key === 'ArrowLeft' || key === 'a' || key === 'A') action('left');
      else if (key === 'ArrowRight' || key === 'd' || key === 'D') action('right');
    });
    const held = (...names) => names.some((n) => keys.isDown(n));
    const input = {
      get x() {
        const k = (held('ArrowRight', 'd', 'D') ? 1 : 0) - (held('ArrowLeft', 'a', 'A') ? 1 : 0);
        return k || controls.x;
      },
      setReady: (on) => controls.setReady(on),
    };

    // ----- Layout: landscape = full screen with controls on top of the game;
    // portrait = game on top, controls underneath (handheld style). -----
    const game = {
      ui,
      input,
      view: { W: 320, H: VIEW_H, S: 3 },
      player: newPlayer(),
      syncHud() {
        const p = game.player;
        ui.setStats({ hp: p.hp, gold: p.gold, key: p.key, level: p.level, xp: p.xp / xpNeeded(p.level) });
      },
      goto(name, opts) {
        if (scene && scene.dispose) scene.dispose();
        ui.hideScreen();
        controls.reset();
        scene = SCENES[name](game, opts);
      },
      exit() { location.hash = '#/'; },
    };

    function layout() {
      const w = app.clientWidth, h = app.clientHeight;
      if (!w || !h) return;
      const portrait = h > w * 1.1;
      app.classList.toggle('portrait', portrait);
      app.classList.toggle('landscape', !portrait);
      let vw = w;
      let vh = portrait ? Math.min(Math.round(w * 0.95), h - 240) : h;
      // Game width in pixels follows the screen shape, within limits; if it hits a
      // limit, shrink the view instead of stretching the picture.
      const W = Math.max(200, Math.min(440, Math.round((VIEW_H * vw) / vh)));
      if (W === 200) vh = Math.round((vw * VIEW_H) / W);
      if (W === 440) vw = Math.round((vh * W) / VIEW_H);
      view.style.width = `${vw}px`;
      view.style.height = `${vh}px`;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const S = Math.max(1, Math.ceil((vh * dpr) / VIEW_H));
      canvas.width = W * S;
      canvas.height = VIEW_H * S;
      canvas.style.width = `${vw}px`;
      canvas.style.height = `${vh}px`;
      game.view = { W, H: VIEW_H, S };
    }
    // Tapping anywhere on the game moves dialogue along.
    view.addEventListener('pointerdown', () => { if (ui.dialogOpen) ui.advance(); });

    const ro = new ResizeObserver(layout);
    ro.observe(app);
    layout();

    // ----- Pause menu -----
    function togglePause() {
      if (ui.screenOpen && !paused) return; // title or chapter card is showing
      paused = !paused;
      if (!paused) { ui.hideScreen(); return; }
      const { el, button } = ui;
      const title = el('dq-title small', 'Paused');
      ui.showScreen([
        title,
        button('Resume', 'dq-btn', (e) => { e.stopPropagation(); togglePause(); }),
        button('Restart chapter', 'dq-btn alt', (e) => { e.stopPropagation(); paused = false; game.player = newPlayer(); game.goto('tavern'); }),
        button('Exit to arcade', 'dq-btn alt', (e) => { e.stopPropagation(); game.exit(); }),
        el('dq-note', coarse ? '' : 'Keys: A/D move · W or Space jump · J attack · E interact · Esc pause'),
      ]);
    }

    game.goto('tavern');

    const loop = createLoop(
      (dt) => { if (!paused) scene.update(dt); },
      () => {
        const { S } = game.view;
        ctx.setTransform(S, 0, 0, S, 0, 0);
        ctx.imageSmoothingEnabled = false;
        scene.render(ctx, game.view);
      },
    );
    loop.start();

    // Pause automatically when the app is sent to the background.
    const onHide = () => { if (document.hidden && !paused && !ui.screenOpen) togglePause(); };
    document.addEventListener('visibilitychange', onHide);

    return () => {
      loop.stop();
      ro.disconnect();
      keys.dispose();
      document.removeEventListener('visibilitychange', onHide);
      if (scene.dispose) scene.dispose();
      ui.dispose();
    };
  },
};
