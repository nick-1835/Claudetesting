import { shuffle } from '../engine.js';

const SYMBOLS = ['🍎', '🚀', '🎈', '🐙', '🌵', '🎲', '⚡', '🍩'];

export default {
  id: 'memory',
  title: 'Memory Match',
  icon: '🃏',
  description: 'Flip cards two at a time and find all eight pairs in as few moves as you can.',
  scoreLabel: 'moves',
  lowerIsBetter: true,
  help: 'Click or tap cards to flip them. Fewer moves = better score.',

  mount(root, api) {
    const status = document.createElement('p');
    status.className = 'status-line';
    const board = document.createElement('div');
    board.className = 'memory-board';
    const controls = document.createElement('div');
    controls.className = 'controls';
    const restart = document.createElement('button');
    restart.className = 'btn secondary';
    restart.textContent = 'New game';
    controls.append(restart);
    root.append(status, board, controls);

    let first, lock, moves, found, timer, seconds;

    function tick() {
      seconds++;
      api.setStat('Time', `${seconds}s`);
    }

    function start() {
      clearInterval(timer);
      first = null; lock = false; moves = 0; found = 0; seconds = 0;
      timer = null;
      api.setStat('Moves', 0);
      api.setStat('Time', '0s');
      status.textContent = 'Find all the pairs!';
      board.replaceChildren();
      for (const sym of shuffle([...SYMBOLS, ...SYMBOLS])) {
        const card = document.createElement('button');
        card.className = 'memory-card';
        card.dataset.sym = sym;
        card.setAttribute('aria-label', 'Hidden card');
        card.addEventListener('click', () => flip(card));
        board.append(card);
      }
    }

    function reveal(card, on) {
      card.classList.toggle('flipped', on);
      // Only put the picture in the card while it's face up.
      card.textContent = on ? card.dataset.sym : '';
      card.setAttribute('aria-label', on ? card.dataset.sym : 'Hidden card');
    }

    function flip(card) {
      if (lock || card === first || card.classList.contains('matched')) return;
      if (!timer) timer = setInterval(tick, 1000);
      reveal(card, true);
      if (!first) { first = card; return; }

      moves++;
      api.setStat('Moves', moves);
      if (first.dataset.sym === card.dataset.sym) {
        first.classList.add('matched');
        card.classList.add('matched');
        first.disabled = card.disabled = true;
        first = null;
        found++;
        if (found === SYMBOLS.length) win();
      } else {
        lock = true;
        const a = first;
        first = null;
        setTimeout(() => { reveal(a, false); reveal(card, false); lock = false; }, 750);
      }
    }

    function win() {
      clearInterval(timer);
      const best = api.submitScore(moves);
      status.textContent = `Solved in ${moves} moves and ${seconds}s${best ? ' — new best!' : ''} 🎉`;
    }

    restart.addEventListener('click', start);
    start();

    return () => clearInterval(timer);
  },
};
