// HTML layer drawn over the game: HUD, dialogue box, choices, banners and
// full-screen cards. Text stays crisp because it isn't drawn on the pixel canvas.
import { ICONS } from './sprites.js';

function div(cls, text) {
  const el = document.createElement('div');
  el.className = cls;
  if (text) el.textContent = text;
  return el;
}

function button(label, cls, onClick) {
  const b = document.createElement('button');
  b.className = cls;
  b.innerHTML = label;
  b.addEventListener('click', onClick);
  return b;
}

export function createUI(view, { onPause }) {
  const layer = div('dq-layer');

  // ----- HUD -----
  const hud = div('dq-hud');
  const stats = div('dq-hud-stats');
  const hpEl = div('dq-hud-item', '');
  const goldEl = div('dq-hud-item', '');
  const keyEl = div('dq-hud-item dq-key off', '');
  const lvlEl = div('dq-hud-item dq-lvl', '');
  hpEl.innerHTML = `${ICONS.heart}<b>100</b>`;
  goldEl.innerHTML = `${ICONS.coin}<b>0</b>`;
  keyEl.innerHTML = ICONS.key;
  lvlEl.innerHTML = '<b>LV1</b><span class="dq-xp"><i></i></span>';
  stats.append(hpEl, goldEl, keyEl, lvlEl);
  const pauseBtn = button('<span class="dq-pause-icon"></span>', 'dq-hud-btn', (e) => { e.stopPropagation(); onPause(); });
  pauseBtn.setAttribute('aria-label', 'Pause');
  const objective = div('dq-objective');
  hud.append(stats, pauseBtn, objective);

  // ----- Dialogue, choices, screens -----
  const dialog = div('dq-dialog');
  const nameEl = div('dq-name');
  const textEl = div('dq-text');
  const more = div('dq-more', '▼');
  dialog.append(nameEl, textEl, more);
  const choiceEl = div('dq-choice');
  const screen = div('dq-screen');
  const fadeEl = div('dq-fade');
  layer.append(hud, dialog, choiceEl, screen, fadeEl);
  view.append(layer);
  for (const el of [hud, objective, dialog, choiceEl, screen]) el.hidden = true;

  let queue = [];
  let line = null;
  let typer = null;
  let onDone = null;
  let fading = false;
  const timers = new Set();
  const later = (fn, ms) => {
    const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
  };

  function showLine() {
    line = queue.shift();
    nameEl.textContent = line.name || '';
    nameEl.hidden = !line.name;
    textEl.textContent = '';
    more.hidden = true;
    let shown = 0;
    clearInterval(typer);
    typer = setInterval(() => {
      shown += 1;
      textEl.textContent = line.text.slice(0, shown);
      if (shown >= line.text.length) finishTyping();
    }, 22);
  }

  function finishTyping() {
    clearInterval(typer);
    typer = null;
    textEl.textContent = line.text;
    more.hidden = false;
  }

  const activeModal = () => (!choiceEl.hidden ? choiceEl : !screen.hidden ? screen : null);

  const ui = {
    get dialogOpen() { return !dialog.hidden; },
    /** True while anything is on screen that should stop the hero acting. */
    get busy() { return !dialog.hidden || !choiceEl.hidden || !screen.hidden || fading; },

    showHud(on) { hud.hidden = !on; },
    setStats({ hp, gold, key, level, xp }) {
      if (hp !== undefined) hpEl.querySelector('b').textContent = hp;
      if (gold !== undefined) goldEl.querySelector('b').textContent = gold;
      if (key !== undefined) keyEl.classList.toggle('off', !key);
      if (level !== undefined) lvlEl.querySelector('b').textContent = `LV${level}`;
      if (xp !== undefined) lvlEl.querySelector('i').style.width = `${Math.round(xp * 100)}%`;
    },

    /** Show lines of dialogue: [{ name, text }, ...]. `done` runs after the last one. */
    say(lines, done) {
      queue = [...lines];
      onDone = done || null;
      dialog.hidden = false;
      showLine();
    },

    /** Finish typing the current line, or go to the next one. */
    advance() {
      if (dialog.hidden) return;
      if (typer) { finishTyping(); return; }
      if (queue.length) { showLine(); return; }
      dialog.hidden = true;
      line = null;
      const done = onDone;
      onDone = null;
      if (done) done();
    },

    /** Ask a question with buttons: options = [{ label, onPick }]. */
    choice(question, options) {
      choiceEl.replaceChildren(div('dq-question', question));
      const row = div('dq-buttons');
      options.forEach((opt, i) => {
        row.append(button(opt.label, i === 0 ? 'dq-btn' : 'dq-btn alt', (e) => {
          e.stopPropagation();
          choiceEl.hidden = true;
          if (opt.onPick) opt.onPick();
        }));
      });
      choiceEl.append(row);
      choiceEl.hidden = false;
      row.firstChild.focus({ preventScroll: true });
    },

    /** Full-screen card (title, pause, chapter end, ...). */
    showScreen(children, onTap) {
      screen.replaceChildren(...children);
      screen.onclick = onTap || null;
      screen.hidden = false;
      const first = screen.querySelector('button');
      if (first) first.focus({ preventScroll: true });
    },
    hideScreen() { screen.hidden = true; screen.onclick = null; },
    get screenOpen() { return !screen.hidden; },

    objective(text) {
      objective.textContent = text || '';
      objective.hidden = !text;
    },

    banner(text) {
      const b = div('dq-banner', text);
      layer.append(b);
      later(() => b.remove(), 3200);
    },

    /** Fade to black, run `mid`, fade back in. */
    fade(mid) {
      fading = true;
      fadeEl.style.opacity = '1';
      later(() => {
        mid();
        fadeEl.style.opacity = '0';
        later(() => { fading = false; }, 500);
      }, 550);
    },

    /** Route a control action to the UI. Returns true if the UI used it. */
    handleAction(name) {
      if (!dialog.hidden) {
        if (name === 'interact' || name === 'attack' || name === 'jump') ui.advance();
        return true;
      }
      const modal = activeModal();
      if (!modal) return fading;
      const buttons = [...modal.querySelectorAll('button')];
      const i = buttons.indexOf(document.activeElement);
      if (name === 'left') buttons[Math.max(0, i - 1)]?.focus();
      else if (name === 'right') buttons[Math.min(buttons.length - 1, i + 1)]?.focus();
      else if (name === 'interact' || name === 'attack') {
        if (i >= 0) buttons[i].click();
        else if (buttons[0]) buttons[0].click();
        else if (modal === screen && screen.onclick) screen.onclick();
      }
      return true;
    },

    dispose() {
      clearInterval(typer);
      timers.forEach(clearTimeout);
      layer.remove();
    },

    // Helpers for building screen content.
    el: div,
    button,
  };
  return ui;
}
