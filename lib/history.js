const HISTORY_KEY = 'eodReportHistory';
const HISTORY_MAX = 30;

function loadHistory() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch (err) {
    return [];
  }
}

function saveHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

function addToHistory({ type = 'eod', title = '', payload = null, report, length = 'short' }) {
  const items = loadHistory();
  items.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    title,
    payload,
    report,
    length,
    timestamp: Date.now(),
  });
  saveHistory(items.slice(0, HISTORY_MAX));
  return items.slice(0, HISTORY_MAX);
}

module.exports = { HISTORY_KEY, HISTORY_MAX, loadHistory, saveHistory, addToHistory };
