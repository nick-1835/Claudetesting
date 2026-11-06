const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function winner(b) {
  for (const line of LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { mark: b[a], line };
  }
  return b.every(Boolean) ? { mark: 'draw', line: [] } : null;
}

// Minimax with depth so the CPU prefers quicker wins / slower losses.
function minimax(b, player, depth = 0) {
  const w = winner(b);
  if (w) return { score: w.mark === 'O' ? 10 - depth : w.mark === 'X' ? depth - 10 : 0 };
  let best = { score: player === 'O' ? -Infinity : Infinity, move: -1 };
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = player;
    const { score } = minimax(b, player === 'O' ? 'X' : 'O', depth + 1);
    b[i] = null;
    if (player === 'O' ? score > best.score : score < best.score) best = { score, move: i };
  }
  return best;
}

export default {
  id: 'tictactoe',
  title: 'Tic-Tac-Toe',
  icon: '❌',
  description: 'Three in a row. Play a friend on the same device or challenge the computer.',
  scoreLabel: 'wins vs CPU',
  help: 'You are <b>X</b>. In CPU mode, Easy makes mistakes and Hard never loses.',

  mount(root, api) {
    const status = document.createElement('p');
    status.className = 'status-line';
    const board = document.createElement('div');
    board.className = 'ttt-board';
    const controls = document.createElement('div');
    controls.className = 'controls';
    root.append(status, board, controls);

    const modes = { easy: 'vs CPU (Easy)', hard: 'vs CPU (Hard)', pvp: '2 Players' };
    let mode = 'easy';
    let cells, turn, over, wins = 0, cpuTimeout;
    const tally = { X: 0, O: 0, draw: 0 };

    for (const [key, label] of Object.entries(modes)) {
      const b = document.createElement('button');
      b.className = 'btn secondary';
      b.textContent = label;
      b.addEventListener('click', () => {
        mode = key;
        tally.X = tally.O = tally.draw = 0;
        wins = 0;
        start();
      });
      controls.append(b);
    }

    function updateStats() {
      api.setStat('X', tally.X);
      api.setStat('O', tally.O);
      api.setStat('Draws', tally.draw);
    }

    function start() {
      clearTimeout(cpuTimeout);
      cells = Array(9).fill(null);
      turn = 'X';
      over = false;
      board.replaceChildren();
      for (let i = 0; i < 9; i++) {
        const cell = document.createElement('button');
        cell.className = 'ttt-cell';
        cell.setAttribute('aria-label', `Square ${i + 1}`);
        cell.addEventListener('click', () => {
          if (mode !== 'pvp' && turn === 'O') return;
          play(i);
        });
        board.append(cell);
      }
      for (const b of controls.children) b.classList.toggle('secondary', b.textContent !== modes[mode]);
      status.textContent = `${modes[mode]} — X to move`;
      updateStats();
    }

    function play(i) {
      if (over || cells[i]) return;
      cells[i] = turn;
      const cell = board.children[i];
      cell.textContent = turn;
      cell.classList.add(turn.toLowerCase());
      cell.disabled = true;

      const w = winner(cells);
      if (w) return finish(w);
      turn = turn === 'X' ? 'O' : 'X';
      status.textContent = `${turn} to move`;
      if (mode !== 'pvp' && turn === 'O') cpuTimeout = setTimeout(cpuMove, 350);
    }

    function cpuMove() {
      const free = cells.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
      const move = mode === 'easy' && Math.random() < 0.45
        ? free[Math.floor(Math.random() * free.length)]
        : minimax([...cells], 'O').move;
      play(move);
    }

    function finish(w) {
      over = true;
      for (const c of board.children) c.disabled = true;
      w.line.forEach((i) => board.children[i].classList.add('win'));
      tally[w.mark]++;
      updateStats();
      let msg = w.mark === 'draw' ? "It's a draw." : `${w.mark} wins!`;
      if (mode !== 'pvp' && w.mark === 'X') {
        wins++;
        if (api.submitScore(wins)) msg += ' New record for wins this session!';
      }
      status.textContent = msg;
      cpuTimeout = setTimeout(() => {
        api.showOverlay({ title: msg, button: 'Next round', onClick: start });
      }, 600);
    }

    start();
    return () => clearTimeout(cpuTimeout);
  },
};
