'use client';

import { useEffect, useRef, useState } from 'react';
import AppShell from '../../components/AppShell';
import ScrollReveal from '../../components/ScrollReveal';
import { CopyIcon, RegenerateIcon, CloseIcon } from '../../components/icons';
import { addToHistory } from '../../lib/history';

const STORE_OPTIONS = [
  'FM265 PUYALLUP',
  'FM041 BONNEY LAKE',
  'FM186 LACEY',
  'FM603 SHELTON',
  'FM604 SPANAWAY',
  'FM615 UNIVERSITY PLACE',
  'FM691 GIG HARBOR',
  'FM665 SUMNER',
];

const LENGTH_KEY = 'eodReportLength';

function CopyButton({ text, className }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // ignore; caller-level error banner covers unreachable-server cases
    }
  }

  return (
    <button className={`${className}${copied ? ' copied' : ''}`} onClick={handleCopy} type="button">
      <CopyIcon />
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function GeneratePage() {
  const [form, setForm] = useState({
    store: '',
    issues: '',
    equipment: '',
    conditions: '',
    clockOut: '',
    note: '',
  });
  const [length, setLength] = useState('short');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState('');
  const [resultVisible, setResultVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const lastPayloadRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem(LENGTH_KEY);
    if (stored === 'long' || stored === 'short') setLength(stored);
  }, []);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape' && modalOpen) setModalOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [modalOpen]);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function setLengthAndPersist(value) {
    setLength(value);
    localStorage.setItem(LENGTH_KEY, value);
  }

  async function generate(payload, { openInModal } = {}) {
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      lastPayloadRef.current = payload;
      setReport(data.report);
      setResultVisible(true);
      addToHistory({
        type: 'eod',
        title: payload.store,
        payload,
        report: data.report,
        length: payload.length,
      });

      if (openInModal) setModalOpen(true);
    } catch (err) {
      setError('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function handleGenerateClick() {
    setResultVisible(false);
    const payload = {
      store: form.store.trim(),
      issues: form.issues.trim(),
      equipment: form.equipment.trim(),
      conditions: form.conditions.trim(),
      clockOut: form.clockOut.trim(),
      note: form.note.trim(),
      length,
    };
    generate(payload, { openInModal: true });
  }

  function handleRegenerate() {
    if (!lastPayloadRef.current) return;
    generate(lastPayloadRef.current);
  }

  return (
    <AppShell>
      <ScrollReveal className="hero">
        <div className="eyebrow">
          <span className="pulse"></span>Store Ops Tool
        </div>
        <h1>End of Day Report</h1>
        <p className="sub">Type a quick update for each part. Leave anything blank if there is nothing to say.</p>
        <div className="length-toggle">
          <button type="button" className={length === 'short' ? 'active' : ''} onClick={() => setLengthAndPersist('short')}>
            Short
          </button>
          <button type="button" className={length === 'long' ? 'active' : ''} onClick={() => setLengthAndPersist('long')}>
            Long
          </button>
        </div>
      </ScrollReveal>

      {error && (
        <div id="error" style={{ display: 'flex' }}>
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      <ScrollReveal className="card form-card" delay={80}>
        <ScrollReveal as="div" className="field" delay={0}>
          <label>Store Name</label>
          <div className="select-wrap">
            <select id="store" value={form.store} onChange={(e) => updateField('store', e.target.value)}>
              <option value="" disabled>
                Select a store
              </option>
              {STORE_OPTIONS.map((store) => (
                <option key={store} value={store}>
                  {store}
                </option>
              ))}
            </select>
          </div>
        </ScrollReveal>

        <ScrollReveal as="div" className="field" delay={60}>
          <label>
            Issues <span className="hint">optional</span>
          </label>
          <textarea
            placeholder="e.g. busy today, low on mango"
            value={form.issues}
            onChange={(e) => updateField('issues', e.target.value)}
          />
        </ScrollReveal>

        <ScrollReveal as="div" className="field" delay={120}>
          <label>
            Equipment / Facilities <span className="hint">optional</span>
          </label>
          <textarea
            placeholder="e.g. honeydew scratches"
            value={form.equipment}
            onChange={(e) => updateField('equipment', e.target.value)}
          />
        </ScrollReveal>

        <ScrollReveal as="div" className="field" delay={180}>
          <label>
            Store Conditions <span className="hint">optional</span>
          </label>
          <textarea
            placeholder="e.g. clean, fully stocked"
            value={form.conditions}
            onChange={(e) => updateField('conditions', e.target.value)}
          />
        </ScrollReveal>

        <ScrollReveal as="div" className="field" delay={240}>
          <label>
            Clock-out Time <span className="hint">optional</span>
          </label>
          <input
            type="text"
            placeholder="e.g. 5:15pm, no break"
            value={form.clockOut}
            onChange={(e) => updateField('clockOut', e.target.value)}
          />
        </ScrollReveal>

        <ScrollReveal as="div" className="field" delay={300}>
          <label>
            Note <span className="hint">optional</span>
          </label>
          <textarea
            placeholder="anything else to add"
            value={form.note}
            onChange={(e) => updateField('note', e.target.value)}
          />
        </ScrollReveal>

        <button id="generateBtn" onClick={handleGenerateClick} disabled={busy}>
          <span className={`spinner${busy ? ' show' : ''}`}></span>
          <span>{busy ? 'Generating...' : 'Generate Report'}</span>
        </button>
      </ScrollReveal>

      <div className={`card${resultVisible ? ' show' : ''}`} id="resultCard">
        <div className="result-head">
          <div className="title">
            <span className="dot"></span>Report
          </div>
        </div>
        <div className="report-text">{report}</div>
        <div className="actions">
          <button className="btn-regenerate" onClick={handleRegenerate} disabled={busy}>
            <RegenerateIcon />
            Regenerate
          </button>
          <CopyButton text={report} className="btn-copy" />
        </div>
      </div>

      <div className={`modal-overlay${modalOpen ? ' show' : ''}`} onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
        <div className="modal-card">
          <div className="modal-head">
            <div className="title">
              <span className="dot"></span>Report Ready
            </div>
            <button className="modal-close" aria-label="Close" onClick={() => setModalOpen(false)}>
              <CloseIcon />
            </button>
          </div>
          <div className="report-text">{report}</div>
          <div className="actions">
            <button className="btn-regenerate" onClick={handleRegenerate} disabled={busy}>
              <RegenerateIcon />
              Regenerate
            </button>
            <CopyButton text={report} className="btn-copy" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
