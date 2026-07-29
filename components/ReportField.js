'use client';

import { useState } from 'react';
import { CopyIcon } from './icons';

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

export { CopyButton, CopyIconButton, ReportField };
