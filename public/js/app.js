// Arcade shell: lobby + hash router that mounts one game at a time.
import { getBest, submitScore } from './scores.js';
import snake from './games/snake.js';
import pong from './games/pong.js';
import breakout from './games/breakout.js';
import memory from './games/memory.js';
import tictactoe from './games/tictactoe.js';

// To add a game: create a module in js/games/ and add it to this list.
const GAMES = [snake, pong, breakout, memory, tictactoe];

const app = document.getElementById('app');
const nav = document.getElementById('nav');
let cleanup = null;

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
}

function renderLobby() {
  nav.replaceChildren();
  document.title = 'Pixel Arcade';
  const grid = el('div', { class: 'grid' });
  for (const g of GAMES) {
    const best = getBest(g.id);
    grid.append(
      el('a', { class: 'card', href: `#/play/${g.id}` },
        el('span', { class: 'icon' }, g.icon),
        el('h2', {}, g.title),
        el('p', {}, g.description),
        el('span', { class: 'best' }, best === null ? 'No record yet' : `Best ${g.scoreLabel || 'score'}: ${best}`),
      ),
    );
  }
  app.replaceChildren(
    el('div', { class: 'lobby' },
      el('section', { class: 'hero' },
        el('h1', {}, 'Pick a game'),
        el('p', {}, 'Quick, classic-style games that run right in your browser. High scores are saved on this device.'),
      ),
      grid,
    ),
  );
}

function renderGame(game) {
  document.title = `${game.title} · Pixel Arcade`;
  nav.replaceChildren(el('a', { href: '#/' }, '← All games'));

  const stats = el('div', { class: 'stats' });
  const statEls = {};
  const bestEl = el('span', { class: 'stat' });
  const updateBest = () => {
    const b = getBest(game.id);
    bestEl.innerHTML = `Best: <b>${b === null ? '—' : b}</b>`;
  };
  updateBest();
  stats.append(bestEl);

  const stage = el('div', { class: 'stage' });
  const overlay = el('div', { class: 'overlay', hidden: '' });
  const help = el('p', { class: 'help', html: game.help || '' });

  app.replaceChildren(
    el('div', { class: 'game-page' },
      el('div', { class: 'game-header' }, el('h1', {}, `${game.icon} ${game.title}`), stats),
      stage,
      help,
    ),
  );

  // The API each game receives.
  const api = {
    setStat(name, value) {
      if (!statEls[name]) {
        statEls[name] = el('span', { class: 'stat' });
        stats.insertBefore(statEls[name], bestEl);
      }
      statEls[name].innerHTML = `${name}: <b>${value}</b>`;
    },
    /** Record a score; returns true if it's a new personal best. */
    submitScore(score) {
      const isBest = submitScore(game.id, score, game.lowerIsBetter);
      updateBest();
      return isBest;
    },
    showOverlay({ title, text = '', button = 'Play', onClick }) {
      overlay.replaceChildren(
        el('h2', {}, title),
        text ? el('p', {}, text) : '',
        el('button', { class: 'btn', onclick: () => { api.hideOverlay(); onClick && onClick(); } }, button),
      );
      overlay.hidden = false;
      overlay.querySelector('button').focus();
    },
    hideOverlay() { overlay.hidden = true; },
  };

  const gameRoot = el('div');
  const frame = el('div', { class: 'frame' }, gameRoot, overlay);
  stage.append(frame);
  const unmount = game.mount(gameRoot, api);

  // Scale canvas games to the largest size that fits the screen (no scrolling).
  const canvas = gameRoot.querySelector('canvas.game');
  let observer = null;
  if (canvas) {
    const w = +canvas.dataset.w, h = +canvas.dataset.h;
    const fit = () => {
      const border = 4;
      const scale = Math.min((stage.clientWidth - border) / w, (stage.clientHeight - border) / h, 1.6);
      if (scale <= 0) return;
      canvas.style.width = `${Math.floor(w * scale)}px`;
      canvas.style.height = `${Math.floor(h * scale)}px`;
    };
    observer = new ResizeObserver(fit);
    observer.observe(stage);
    fit();
  } else {
    frame.classList.add('dom');
  }

  cleanup = () => {
    if (observer) observer.disconnect();
    if (unmount) unmount();
  };
}

function route() {
  if (cleanup) { cleanup(); cleanup = null; }
  const match = location.hash.match(/^#\/play\/([\w-]+)/);
  const game = match && GAMES.find((g) => g.id === match[1]);
  if (game) renderGame(game);
  else renderLobby();
}

// App-like feel: block pinch-zoom, double-tap zoom and page dragging.
// Only elements marked .lobby may scroll (and only if the screen is too small).
const noDefault = (e) => e.preventDefault();
document.addEventListener('gesturestart', noDefault);
document.addEventListener('gesturechange', noDefault);
document.addEventListener('dblclick', noDefault);
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1 || !e.target.closest('.lobby')) e.preventDefault();
}, { passive: false });
document.addEventListener('contextmenu', (e) => {
  if (e.target.closest('.game-page')) e.preventDefault();
});

window.addEventListener('hashchange', route);
route();
