'use client';

import { useRef, useState } from 'react';
import AppShell from '../../components/AppShell';
import { CopyIcon, RegenerateIcon } from '../../components/icons';
import { addToHistory } from '../../lib/history';

const RECEIPT_MIN = 1;
const RECEIPT_MAX = 20;

function clamp(n) {
  if (Number.isNaN(n)) return RECEIPT_MIN;
  return Math.min(Math.max(n, RECEIPT_MIN), RECEIPT_MAX);
}

function formatMainReport(report) {
  return `Title: ${report.title}\n\nBusiness Purpose: ${report.businessPurpose}\n\nComment: ${report.comment}`;
}

function formatReceipt(receipt) {
  return `Receipt Title: ${receipt.receiptTitle}\nExpense Title: ${receipt.expenseTitle}\nNote: ${receipt.note}`;
}

function formatFullExpenseReport(data) {
  const receiptBlocks = data.receipts.map((receipt, i) => `Receipt ${i + 1}\n${formatReceipt(receipt)}`);
  return [formatMainReport(data.report), ...receiptBlocks].join('\n\n');
}

function CopyButton({ text, className }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // ignore
    }
  }

  return (
    <button className={`${className}${copied ? ' copied' : ''}`} onClick={handleCopy} type="button">
      <CopyIcon />
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function CopyIconButton({ text, label }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      // ignore
    }
  }

  return (
    <button
      className={`copy-icon-btn${copied ? ' copied' : ''}`}
      onClick={handleCopy}
      type="button"
      title={`Copy ${label}`}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
    >
      <CopyIcon />
    </button>
  );
}

function ReportField({ label, value }) {
  return (
    <div className="report-field">
      <div className="rf-head">
        <span className="rf-label">{label}</span>
        <CopyIconButton text={value} label={label} />
      </div>
      <div className="rf-value">{value}</div>
    </div>
  );
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export default function ExpensePage() {
  const [prompt, setPrompt] = useState('');
  const [receiptCount, setReceiptCount] = useState(1);
  const [receiptNotes, setReceiptNotes] = useState(['']);
  const [receiptImages, setReceiptImages] = useState([null]);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const lastPayloadRef = useRef(null);

  function handleReceiptCountChange(value) {
    const n = clamp(parseInt(value, 10));
    setReceiptCount(n);
    setReceiptNotes((notes) => {
      const next = notes.slice(0, n);
      while (next.length < n) next.push('');
      return next;
    });
    setReceiptImages((images) => {
      const next = images.slice(0, n);
      while (next.length < n) next.push(null);
      return next;
    });
  }

  function updateReceiptNote(i, value) {
    setReceiptNotes((notes) => notes.map((n, idx) => (idx === i ? value : n)));
  }

  function updateReceiptImage(i, value) {
    setReceiptImages((images) => images.map((img, idx) => (idx === i ? value : img)));
  }

  function handleReceiptImageChange(i, file) {
    setError('');
    if (!file) {
      updateReceiptImage(i, null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file for the receipt.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Receipt image is too large. Please upload an image under 8MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateReceiptImage(i, reader.result);
    reader.onerror = () => setError('Could not read that image. Please try another file.');
    reader.readAsDataURL(file);
  }

  async function generate(payload) {
    setError('');
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch('/api/generate-expense', {
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
      setResult(data);
      addToHistory({
        type: 'expense',
        title: data.report.title,
        payload: { ...payload, receiptImages: undefined },
        report: formatFullExpenseReport(data),
      });
    } catch (err) {
      setError('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function handleGenerateClick() {
    generate({
      prompt: prompt.trim(),
      receiptCount,
      receiptPrompts: receiptNotes.map((n) => n.trim()),
      receiptImages,
    });
  }

  function handleRegenerate() {
    if (!lastPayloadRef.current) return;
    generate(lastPayloadRef.current);
  }

  return (
    <AppShell>
      <div className="hero">
        <div className="eyebrow">
          <span className="pulse"></span>Expense Tool
        </div>
        <h1>Gas Expense Report</h1>
        <p className="sub">Describe the expense, pick how many receipts you have, and optionally add a note for each one.</p>
      </div>

      {error && (
        <div id="error" style={{ display: 'flex' }}>
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      <div className="card form-card">
        <div className="field">
          <label>
            Report Prompt <span className="hint">what is this expense for?</span>
          </label>
          <textarea
            placeholder="e.g. gas for driving between stores during the week of July 21-25 for inventory transfers"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Number of Receipts</label>
          <div className="stepper">
            <button
              type="button"
              className="stepper-btn"
              aria-label="Decrease"
              disabled={receiptCount <= RECEIPT_MIN}
              onClick={() => handleReceiptCountChange(receiptCount - 1)}
            >
              −
            </button>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="stepper-value"
              value={receiptCount}
              onChange={(e) => handleReceiptCountChange(e.target.value)}
            />
            <button
              type="button"
              className="stepper-btn"
              aria-label="Increase"
              disabled={receiptCount >= RECEIPT_MAX}
              onClick={() => handleReceiptCountChange(receiptCount + 1)}
            >
              +
            </button>
          </div>
        </div>

        <div className="field">
          <label>
            Per-Receipt Details <span className="hint">optional</span>
          </label>
          {notesExpanded ? (
            <div className="optional-section">
              {receiptNotes.map((note, i) => (
                <div key={i} style={{ marginTop: i === 0 ? 0 : 16 }}>
                  <label style={{ marginBottom: 5, fontSize: 12.5 }}>Receipt {i + 1}</label>
                  <textarea
                    placeholder="e.g. Shell on Main St, filled up before store visit"
                    rows={2}
                    value={note}
                    onChange={(e) => updateReceiptNote(i, e.target.value)}
                  />
                  <div style={{ marginTop: 8 }}>
                    <label style={{ marginBottom: 5, fontSize: 12.5 }}>
                      Upload Receipt Photo <span className="hint">optional — we&apos;ll pull the amount &amp; date from it</span>
                    </label>
                    {receiptImages[i] ? (
                      <div className="receipt-preview">
                        <img src={receiptImages[i]} alt={`Receipt ${i + 1} preview`} />
                        <button type="button" className="optional-toggle" onClick={() => handleReceiptImageChange(i, null)}>
                          Remove photo
                        </button>
                      </div>
                    ) : (
                      <label className="file-upload optional-toggle" htmlFor={`receipt-photo-${i}`}>
                        + Upload photo
                        <input
                          id={`receipt-photo-${i}`}
                          type="file"
                          accept="image/*"
                          className="file-upload-input"
                          onChange={(e) => handleReceiptImageChange(i, e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <button type="button" className="optional-toggle" onClick={() => setNotesExpanded(true)}>
              + Add a note or receipt photo
            </button>
          )}
        </div>

        <button id="generateBtn" onClick={handleGenerateClick} disabled={busy}>
          <span className={`spinner${busy ? ' show' : ''}`}></span>
          <span>{busy ? 'Generating...' : 'Generate Report'}</span>
        </button>
      </div>

      {result && (
        <div className="card show" id="resultCard">
          <div className="result-head">
            <div className="title">
              <span className="dot"></span>Expense Report
            </div>
          </div>
          <div className="report-fields">
            <ReportField label="Title" value={result.report.title} />
            <ReportField label="Business Purpose" value={result.report.businessPurpose} />
            <ReportField label="Comment" value={result.report.comment} />
          </div>
          <div className="actions">
            <button className="btn-regenerate" onClick={handleRegenerate} disabled={busy}>
              <RegenerateIcon />
              Regenerate
            </button>
            <CopyButton text={formatMainReport(result.report)} className="btn-copy" />
          </div>
        </div>
      )}

      {result && result.receipts.length > 0 && (
        <p className="section-title">{result.report.receiptsTitle}</p>
      )}

      {result &&
        result.receipts.map((receipt, i) => (
          <div className="card" key={i}>
            <div className="result-head">
              <div className="title">
                <span className="dot"></span>Receipt {i + 1}
              </div>
            </div>
            <div className="report-fields">
              <ReportField label="Receipt Title" value={receipt.receiptTitle} />
              <ReportField label="Expense Title" value={receipt.expenseTitle} />
              <ReportField label="Note" value={receipt.note} />
            </div>
            <div className="actions">
              <CopyButton text={formatReceipt(receipt)} className="btn-copy" />
            </div>
          </div>
        ))}
    </AppShell>
  );
}
