const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

/*
 * Kept on globalThis so the Map survives Next.js dev-server hot reloads
 * (each reload would otherwise re-evaluate this module and reset the log).
 */
const generationLog = globalThis.__eodGenerationLog || (globalThis.__eodGenerationLog = new Map());

function isRateLimited(key) {
  const now = Date.now();
  const timestamps = (generationLog.get(key) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX) {
    generationLog.set(key, timestamps);
    return true;
  }
  timestamps.push(now);
  generationLog.set(key, timestamps);
  return false;
}

function resetRateLimit() {
  generationLog.clear();
}

module.exports = { isRateLimited, resetRateLimit, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS };
