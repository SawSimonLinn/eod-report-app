'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import { addToHistory } from '../../lib/history';
import { formatFullExpenseReport } from '../../lib/expenseFormat';
import { setExpenseResult } from '../../lib/expenseResultStore';

const RECEIPT_MIN = 1;
const RECEIPT_MAX = 20;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const LOADING_INTERVAL_MS = 1500;

const READING_MESSAGES = ['Reading your receipts...', 'Pulling amounts & dates off the photos...'];
const NOTES_MESSAGES = ['Reading your notes...'];
const GENERIC_MESSAGES = ['Calculating totals...', 'Writing your report...', 'Polishing the details...'];

function buildLoadingMessages(hasImages) {
  return [...(hasImages ? READING_MESSAGES : NOTES_MESSAGES), ...GENERIC_MESSAGES];
}

export default function ExpensePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [receiptNotes, setReceiptNotes] = useState(['']);
  const [receiptImages, setReceiptImages] = useState([null]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(GENERIC_MESSAGES);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const receiptCount = receiptNotes.length;

  useEffect(() => {
    if (!busy) return undefined;
    setLoadingIndex(0);
    const id = setInterval(() => {
      setLoadingIndex((i) => (i + 1) % loadingMessages.length);
    }, LOADING_INTERVAL_MS);
    return () => clearInterval(id);
  }, [busy, loadingMessages]);

  function addReceipt() {
    if (receiptCount >= RECEIPT_MAX) return;
    setReceiptNotes((notes) => [...notes, '']);
    setReceiptImages((images) => [...images, null]);
  }

  function removeReceipt(i) {
    if (receiptCount <= RECEIPT_MIN) return;
    setReceiptNotes((notes) => notes.filter((_, idx) => idx !== i));
    setReceiptImages((images) => images.filter((_, idx) => idx !== i));
  }

  function updateReceiptNote(i, value) {
    setReceiptNotes((notes) => notes.map((n, idx) => (idx === i ? value : n)));
  }

  function updateReceiptImage(i, value) {
    setReceiptImages((images) => images.map((img, idx) => (idx === i ? value : img)));
  }

  function isHeicFile(file) {
    const type = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    return type === 'image/heic' || type === 'image/heif' || name.endsWith('.heic') || name.endsWith('.heif');
  }

  function readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('read-failed'));
      reader.readAsDataURL(file);
    });
  }

  function convertHeicViaCanvas(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          if (!canvas.width || !canvas.height) throw new Error('empty-image');
          canvas.getContext('2d').drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('canvas-empty'))),
            'image/jpeg',
            0.85
          );
        } catch (err) {
          reject(err);
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('img-load-failed'));
      };
      img.src = url;
    });
  }

  async function convertHeicOnServer(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/convert-heic', { method: 'POST', body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.dataUrl) {
      throw new Error(data.error || 'server-conversion-failed');
    }
    return data.dataUrl;
  }

  async function handleReceiptImageChange(i, file) {
    setError('');
    if (!file) {
      updateReceiptImage(i, null);
      return;
    }
    if (!file.type.startsWith('image/') && !isHeicFile(file)) {
      setError('Please upload an image file for the receipt.');
      return;
    }

    if (isHeicFile(file)) {
      // Safari/iOS decode HEIC natively via <img>/canvas, which is far more reliable
      // than any in-browser wasm library; fall back to server-side conversion
      // (Node, no worker/sandbox quirks) when native decoding isn't supported,
      // e.g. desktop Chrome/Firefox.
      try {
        const converted = await convertHeicViaCanvas(file);
        if (converted.size > MAX_IMAGE_BYTES) {
          setError('Receipt image is too large. Please upload an image under 8MB.');
          return;
        }
        const dataUrl = await readAsDataUrl(converted);
        updateReceiptImage(i, dataUrl);
      } catch {
        try {
          const dataUrl = await convertHeicOnServer(file);
          updateReceiptImage(i, dataUrl);
        } catch (err) {
          console.error('HEIC conversion failed:', err);
          setError('Could not convert that HEIC photo. Please try a JPG/PNG instead.');
        }
      }
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError('Receipt image is too large. Please upload an image under 8MB.');
      return;
    }

    try {
      const dataUrl = await readAsDataUrl(file);
      updateReceiptImage(i, dataUrl);
    } catch {
      setError('Could not read that image. Please try another file.');
    }
  }

  async function handleGenerateClick() {
    const payload = {
      prompt: prompt.trim(),
      receiptCount,
      receiptPrompts: receiptNotes.map((n) => n.trim()),
      receiptImages,
    };

    setError('');
    setLoadingMessages(buildLoadingMessages(receiptImages.some(Boolean)));
    setBusy(true);
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

      setExpenseResult(payload, data);
      addToHistory({
        type: 'expense',
        title: data.report.title,
        payload: { ...payload, receiptImages: undefined },
        report: formatFullExpenseReport(data),
      });
      router.push('/expense/result');
    } catch (err) {
      setError('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="hero">
        <div className="eyebrow">
          <span className="pulse"></span>Expense Tool
        </div>
        <h1>Gas Expense Report</h1>
        <p className="sub">Describe the expense, then add a card for each receipt — optionally upload a photo or note for each one.</p>
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
          <label>
            Receipts <span className="hint">{receiptCount} of {RECEIPT_MAX}</span>
          </label>
          <div className="receipt-list">
            {receiptNotes.map((note, i) => (
              <div className="receipt-item" key={i}>
                <div className="receipt-item-head">
                  <span className="receipt-badge">{i + 1}</span>
                  {receiptCount > RECEIPT_MIN && (
                    <button
                      type="button"
                      className="receipt-remove"
                      aria-label={`Remove receipt ${i + 1}`}
                      onClick={() => removeReceipt(i)}
                    >
                      ×
                    </button>
                  )}
                </div>

                {receiptImages[i] ? (
                  <div className="receipt-preview">
                    <img src={receiptImages[i]} alt={`Receipt ${i + 1} preview`} />
                    <div className="receipt-preview-info">
                      <span>Photo attached</span>
                      <button type="button" className="link-btn" onClick={() => handleReceiptImageChange(i, null)}>
                        Remove photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="file-upload optional-toggle" htmlFor={`receipt-photo-${i}`}>
                    + Upload receipt photo <span className="hint">optional, pulls amount &amp; date</span>
                    <input
                      id={`receipt-photo-${i}`}
                      type="file"
                      accept="image/*,.heic,.heif"
                      className="file-upload-input"
                      onChange={(e) => handleReceiptImageChange(i, e.target.files?.[0] || null)}
                    />
                  </label>
                )}

                <textarea
                  placeholder="Optional note, e.g. Shell on Main St, filled up before store visit"
                  rows={2}
                  value={note}
                  onChange={(e) => updateReceiptNote(i, e.target.value)}
                />
              </div>
            ))}
          </div>

          {receiptCount < RECEIPT_MAX && (
            <button type="button" className="add-receipt-btn" onClick={addReceipt}>
              + Add another receipt
            </button>
          )}
        </div>

        <button id="generateBtn" onClick={handleGenerateClick} disabled={busy}>
          <span className={`spinner${busy ? ' show' : ''}`}></span>
          <span>{busy ? loadingMessages[loadingIndex] : 'Generate Report'}</span>
        </button>
      </div>
    </AppShell>
  );
}
