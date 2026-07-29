'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { CopyIcon, DeleteIcon, CloseIcon } from '../../components/icons';
import { loadHistory, saveHistory } from '../../lib/history';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'eod', label: 'Reports' },
  { key: 'expense', label: 'Expenses' },
];

function itemTitle(item) {
  if (item.title) return item.title;
  if (item.payload?.store) return item.payload.store;
  return item.type === 'expense' ? 'Expense Report' : 'Report';
}

function itemBadgeLabel(item) {
  return item.type === 'expense' ? 'Expense' : item.length === 'long' ? 'Long' : 'Short';
}

function formatWhen(ts) {
  const d = new Date(ts);
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const date = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `${date} · ${time}`;
}

function ItemCopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="h-copy"
      title="Copy this report"
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch (err) {
          // ignore
        }
      }}
    >
      {copied ? '✓' : <CopyIcon />}
    </button>
  );
}

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [activeItem, setActiveItem] = useState(null);
  const [modalCopied, setModalCopied] = useState(false);
  const [confirm, setConfirm] = useState(null); // { message, onConfirm }

  const filteredItems = filter === 'all' ? items : items.filter((item) => (item.type || 'eod') === filter);

  useEffect(() => {
    setItems(loadHistory());
  }, []);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key !== 'Escape') return;
      if (confirm) {
        setConfirm(null);
        return;
      }
      if (activeItem) setActiveItem(null);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [confirm, activeItem]);

  function deleteItem(id) {
    const next = items.filter((i) => i.id !== id);
    saveHistory(next);
    setItems(next);
  }

  function clearAll() {
    saveHistory([]);
    setItems([]);
  }

  async function copyModalText() {
    if (!activeItem) return;
    try {
      await navigator.clipboard.writeText(activeItem.report);
      setModalCopied(true);
      setTimeout(() => setModalCopied(false), 1500);
    } catch (err) {
      setError('Could not copy. Please select the text manually.');
    }
  }

  return (
    <AppShell>
      <div className="hero">
        <div className="eyebrow">
          <span className="pulse"></span>This Device Only
        </div>
        <h1>Recent Reports</h1>
        <p className="sub">
          Reports you&apos;ve generated are saved in this browser so you can find and copy them again. Nothing is
          sent anywhere else.
        </p>
      </div>

      {error && (
        <div id="error" style={{ display: 'flex' }}>
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      <div className="length-toggle category-toggle">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            className={filter === cat.key ? 'active' : ''}
            onClick={() => setFilter(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="history-head">
        <div className="title">
          <span className="dot"></span>
          {CATEGORIES.find((c) => c.key === filter).label}{' '}
          <span className="count">{filteredItems.length > 0 ? `(${filteredItems.length})` : ''}</span>
        </div>
        <button
          id="clearHistoryBtn"
          onClick={() => {
            if (items.length === 0) return;
            setConfirm({ message: "Clear all saved reports on this device? This can't be undone.", onConfirm: clearAll });
          }}
        >
          Clear all
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <div id="historyEmpty">
          No reports yet. <a href="/generate">Generate one</a> and it&apos;ll show up here.
        </div>
      ) : (
        <div className="history-list">
          {filteredItems.map((item) => (
            <div
              className="history-item"
              key={item.id}
              onClick={() => {
                setModalCopied(false);
                setActiveItem(item);
              }}
            >
              <div className="h-info">
                <div className="h-top">
                  <span className="h-store">{itemTitle(item)}</span>
                  <span className={`h-length h-cat-${item.type || 'eod'}`}>{itemBadgeLabel(item)}</span>
                  <span className="h-time">{formatWhen(item.timestamp)}</span>
                </div>
                <div className="h-preview">{item.report.replace(/\s+/g, ' ')}</div>
              </div>
              <div className="h-actions">
                <ItemCopyButton text={item.report} />
                <button
                  className="h-delete"
                  title="Delete this report"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirm({ message: "Delete this report? This can't be undone.", onConfirm: () => deleteItem(item.id) });
                  }}
                >
                  <DeleteIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={`modal-overlay${activeItem ? ' show' : ''}`} onClick={(e) => e.target === e.currentTarget && setActiveItem(null)}>
        {activeItem && (
          <div className="modal-card">
            <div className="modal-head">
              <div className="title">
                <span className="dot"></span>
                {itemTitle(activeItem)}
              </div>
              <button className="modal-close" aria-label="Close" onClick={() => setActiveItem(null)}>
                <CloseIcon />
              </button>
            </div>
            <div className="report-text">{activeItem.report}</div>
            <div className="actions">
              <button
                className="btn-danger"
                onClick={() => {
                  const id = activeItem.id;
                  setConfirm({
                    message: "Delete this report? This can't be undone.",
                    onConfirm: () => {
                      deleteItem(id);
                      setActiveItem(null);
                    },
                  });
                }}
              >
                <DeleteIcon />
                Delete
              </button>
              <button className={`btn-copy${modalCopied ? ' copied' : ''}`} onClick={copyModalText}>
                <CopyIcon />
                {modalCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div
        className={`modal-overlay confirm-overlay${confirm ? ' show' : ''}`}
        onClick={(e) => e.target === e.currentTarget && setConfirm(null)}
      >
        {confirm && (
          <div className="modal-card confirm-card">
            <div className="modal-head">
              <div className="title">
                <span className="dot" style={{ background: '#e39a9a', boxShadow: '0 0 0 4px rgba(220,90,90,0.18)' }}></span>
                Delete report?
              </div>
            </div>
            <p className="confirm-message">{confirm.message}</p>
            <div className="actions">
              <button className="btn-regenerate" onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={() => {
                  const action = confirm.onConfirm;
                  setConfirm(null);
                  action();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
