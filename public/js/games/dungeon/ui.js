// HTML layer drawn over the game canvas: dialogue box, choices, banners and
// full-screen cards. Text stays crisp because it isn't drawn on the pixel canvas.

function div(cls, text) {
  const el = document.createElement('div');
  el.className = cls;
  if (text) el.textContent = text;
  return el;
}

function button(label, cls, onClick) {
  const b = document.createElement('button');
  b.className = cls;
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}

export function createUI(root) {
  const layer = div('dq-layer');
  const objective = div('dq-objective');
  const hint = div('dq-hint');
  const dialog = div('dq-dialog');
  const nameEl = div('dq-name');
  const textEl = div('dq-text');
  const more = div('dq-more', '▼');
  dialog.append(nameEl, textEl, more);
  const choiceEl = div('dq-choice');
  const screen = div('dq-screen');
  const fadeEl = div('dq-fade');
  layer.append(objective, hint, dialog, choiceEl, screen, fadeEl);
  root.append(layer);
  for (const el of [objective, hint, dialog, choiceEl, screen]) el.hidden = true;

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

  const ui = {
    get dialogOpen() { return !dialog.hidden; },
    /** True while anything is on screen that should stop the hero moving. */
    get busy() { return !dialog.hidden || !choiceEl.hidden || !screen.hidden || fading; },

    /** Show lines of dialogue: [{ name, text }, ...]. `done` runs after the last one. */
    say(lines, done) {
      queue = [...lines];
      onDone = done || null;
      dialog.hidden = false;
      showLine();
    },

    /** Tap / key: finish typing the current line, or go to the next one. */
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
        row.append(button(opt.label, i === 0 ? 'dq-btn' : 'dq-btn alt', () => {
          choiceEl.hidden = true;
          if (opt.onPick) opt.onPick();
        }));
      });
      choiceEl.append(row);
      choiceEl.hidden = false;
      row.firstChild.focus({ preventScroll: true });
    },

    /** Full-screen card (title screen, chapter end, ...). */
    showScreen(children, onTap) {
      screen.replaceChildren(...children);
      screen.onclick = onTap || null;
      screen.hidden = false;
      const first = screen.querySelector('button');
      if (first) first.focus({ preventScroll: true });
    },
    hideScreen() { screen.hidden = true; screen.onclick = null; },

    objective(text) {
      objective.textContent = text || '';
      objective.hidden = !text;
    },

    hint(text) {
      if (hint.textContent !== (text || '')) hint.textContent = text || '';
      hint.hidden = !text || ui.busy;
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

    /** Keyboard while UI is open. Returns true if the key was used by the UI. */
    handleKey(key) {
      const act = key === ' ' || key === 'Enter' || key === 'e' || key === 'E';
      if (!dialog.hidden) {
        if (act) ui.advance();
        return true;
      }
      const modal = !choiceEl.hidden ? choiceEl : !screen.hidden ? screen : null;
      if (!modal) return fading;
      const buttons = [...modal.querySelectorAll('button')];
      const i = buttons.indexOf(document.activeElement);
      if (key === 'ArrowLeft' || key === 'ArrowUp') buttons[Math.max(0, i - 1)]?.focus();
      else if (key === 'ArrowRight' || key === 'ArrowDown') buttons[Math.min(buttons.length - 1, i + 1)]?.focus();
      else if (key === ' ' || key === 'e' || key === 'E') {
        if (i >= 0) buttons[i].click();
        else if (modal === screen && screen.onclick) screen.onclick();
      } else if (key === 'Enter' && i < 0 && modal === screen && screen.onclick) screen.onclick();
      return true;
    },

    dispose() {
      clearInterval(typer);
      timers.forEach(clearTimeout);
      layer.remove();
    },

    // Small helpers for building screen content.
    el: div,
    button,
  };
  return ui;
}
