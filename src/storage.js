const BEST_SCORE_KEY = 'buoyGame.bestScore';
const MUTED_KEY = 'buoyGame.muted';

export function loadBestScore(storage = safeStorage()) {
  const value = storage?.getItem(BEST_SCORE_KEY);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function saveBestScore(score, storage = safeStorage()) {
  storage?.setItem(BEST_SCORE_KEY, String(Math.max(0, Math.floor(score))));
}

export function loadMuted(storage = safeStorage()) {
  return storage?.getItem(MUTED_KEY) === 'true';
}

export function saveMuted(muted, storage = safeStorage()) {
  storage?.setItem(MUTED_KEY, muted ? 'true' : 'false');
}

function safeStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}
