// High score storage, kept in localStorage (per browser).
const KEY = 'pixel-arcade:best';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function getBest(gameId) {
  const v = readAll()[gameId];
  return typeof v === 'number' ? v : null;
}

/** Save the score if it beats the stored best. Returns true on a new record. */
export function submitScore(gameId, score, lowerIsBetter = false) {
  if (!lowerIsBetter && score <= 0) return false; // don't record empty runs
  const all = readAll();
  const prev = all[gameId];
  const better = typeof prev !== 'number' || (lowerIsBetter ? score < prev : score > prev);
  if (!better) return false;
  all[gameId] = score;
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable: ignore */
  }
  return true;
}
