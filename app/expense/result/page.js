'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '../../../components/AppShell';
import { RegenerateIcon } from '../../../components/icons';
import { CopyButton, ReportField } from '../../../components/ReportField';
import { addToHistory } from '../../../lib/history';
import { formatMainReport, formatReceipt, formatFullExpenseReport } from '../../../lib/expenseFormat';
import { getExpenseResult, setExpenseResult } from '../../../lib/expenseResultStore';

export default function ExpenseResultPage() {
  const [state, setState] = useState(() => getExpenseResult());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!state.result) {
      window.location.replace('/expense');
    }
  }, [state.result]);

  async function handleRegenerate() {
    if (!state.payload) return;
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/generate-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setExpenseResult(state.payload, data);
      setState({ payload: state.payload, result: data });
      addToHistory({
        type: 'expense',
        title: data.report.title,
        payload: { ...state.payload, receiptImages: undefined },
        report: formatFullExpenseReport(data),
      });
    } catch (err) {
      setError('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const result = state.result;
  if (!result) {
    return (
      <AppShell>
        <div className="hero">
          <p className="sub">No report to show — redirecting you back...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link href="/expense" className="back-link">
        ← Start a new report
      </Link>

      <div className="hero">
        <div className="eyebrow">
          <span className="pulse"></span>Expense Tool
        </div>
        <h1>Your Expense Report</h1>
        <p className="sub">Review, copy, or regenerate before you submit it.</p>
      </div>

      {error && (
        <div id="error" style={{ display: 'flex' }}>
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

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
            {busy ? 'Regenerating...' : 'Regenerate'}
          </button>
          <CopyButton text={formatMainReport(result.report)} className="btn-copy" />
        </div>
      </div>

      {result.receipts.length > 0 && <p className="section-title">{result.report.receiptsTitle}</p>}

      {result.receipts.map((receipt, i) => (
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
