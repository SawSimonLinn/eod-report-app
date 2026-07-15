const generateBtn = document.getElementById('generateBtn');
const generateBtnText = document.getElementById('generateBtnText');
const spinner = document.getElementById('spinner');
const resultCard = document.getElementById('resultCard');
const resultText = document.getElementById('resultText');
const copyBtn = document.getElementById('copyBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const errorBox = document.getElementById('error');
const errorText = document.getElementById('errorText');

const modalOverlay = document.getElementById('modalOverlay');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalResultText = document.getElementById('modalResultText');
const modalCopyBtn = document.getElementById('modalCopyBtn');
const modalRegenerateBtn = document.getElementById('modalRegenerateBtn');

const shortBtn = document.getElementById('lengthShortBtn');
const longBtn = document.getElementById('lengthLongBtn');

const HISTORY_KEY = 'eodReportHistory';
const HISTORY_MAX = 30;
const LENGTH_KEY = 'eodReportLength';

let lastPayload = null;
let reportLength = localStorage.getItem(LENGTH_KEY) === 'long' ? 'long' : 'short';

function applyLengthUI() {
  shortBtn.classList.toggle('active', reportLength === 'short');
  longBtn.classList.toggle('active', reportLength === 'long');
}
applyLengthUI();

shortBtn.addEventListener('click', () => {
  reportLength = 'short';
  localStorage.setItem(LENGTH_KEY, reportLength);
  applyLengthUI();
});
longBtn.addEventListener('click', () => {
  reportLength = 'long';
  localStorage.setItem(LENGTH_KEY, reportLength);
  applyLengthUI();
});

function showError(msg) {
  errorText.textContent = msg;
  errorBox.style.display = 'flex';
}
function hideError() {
  errorBox.style.display = 'none';
}

function currentPayload() {
  return {
    store: document.getElementById('store').value.trim(),
    issues: document.getElementById('issues').value.trim(),
    equipment: document.getElementById('equipment').value.trim(),
    conditions: document.getElementById('conditions').value.trim(),
    clockOut: document.getElementById('clockOut').value.trim(),
    note: document.getElementById('note').value.trim(),
    length: reportLength,
  };
}

function copyIconHtml() {
  return '<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.8"/>' +
    '<path d="M4 16V5a1 1 0 0 1 1-1h10" stroke="currentColor" stroke-width="1.8"/></svg>';
}

function openModal() {
  modalOverlay.classList.add('show');
}
function closeModal() {
  modalOverlay.classList.remove('show');
}

function setBusy(busy) {
  generateBtn.disabled = busy;
  regenerateBtn.disabled = busy;
  modalRegenerateBtn.disabled = busy;
  if (busy) {
    spinner.classList.add('show');
    generateBtnText.textContent = 'Generating...';
  } else {
    spinner.classList.remove('show');
    generateBtnText.textContent = 'Generate Report';
  }
}

/* ---- History (localStorage), shared with history.html ---- */

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch (err) {
    return [];
  }
}

function saveHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

function addToHistory(payload, report) {
  const items = loadHistory();
  items.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    payload,
    report,
    length: payload.length || 'short',
    timestamp: Date.now(),
  });
  saveHistory(items.slice(0, HISTORY_MAX));
}

/* ---- Generate / Regenerate ---- */

async function generate(payload, { openInModal } = {}) {
  hideError();
  setBusy(true);

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      showError(data.error || 'Something went wrong. Please try again.');
      return;
    }

    lastPayload = payload;
    resultText.textContent = data.report;
    modalResultText.textContent = data.report;
    resultCard.classList.add('show');

    [copyBtn, modalCopyBtn].forEach(btn => {
      btn.classList.remove('copied');
      btn.innerHTML = copyIconHtml() + 'Copy';
    });

    addToHistory(payload, data.report);

    if (openInModal) {
      openModal();
    } else {
      resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  } catch (err) {
    showError('Could not reach the server. Please try again.');
  } finally {
    setBusy(false);
  }
}

async function copyReport(btn) {
  try {
    await navigator.clipboard.writeText(resultText.textContent);
    btn.innerHTML = copyIconHtml() + 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.innerHTML = copyIconHtml() + 'Copy';
      btn.classList.remove('copied');
    }, 1500);
  } catch (err) {
    showError('Could not copy. Please select the text manually.');
  }
}

generateBtn.addEventListener('click', () => {
  resultCard.classList.remove('show');
  generate(currentPayload(), { openInModal: true });
});

regenerateBtn.addEventListener('click', () => {
  if (!lastPayload) return;
  generate(lastPayload);
});

modalRegenerateBtn.addEventListener('click', () => {
  if (!lastPayload) return;
  generate(lastPayload);
});

copyBtn.addEventListener('click', () => copyReport(copyBtn));
modalCopyBtn.addEventListener('click', () => copyReport(modalCopyBtn));

modalCloseBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('show')) closeModal();
});

function updateHistoryBadge() {
  const badge = document.getElementById('historyBadge');
  if (!badge) return;
  const count = loadHistory().length;
  if (count > 0) {
    badge.textContent = count;
    badge.classList.add('show');
  } else {
    badge.classList.remove('show');
  }
}
updateHistoryBadge();
