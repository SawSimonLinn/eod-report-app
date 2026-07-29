'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function safeNextPath(nextParam) {
  if (nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')) return nextParam;
  return '/';
}

export default function PinForm() {
  const searchParams = useSearchParams();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const trimmed = pin.trim();
    if (!trimmed) return;

    setBusy(true);
    try {
      const res = await fetch('/api/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Incorrect PIN. Please try again.');
        setPin('');
        inputRef.current?.focus();
        return;
      }

      window.location.href = safeNextPath(searchParams.get('next'));
    } catch (err) {
      setError('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pin-wrap">
      <div className="card pin-card">
        <div className="mark">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <h1>Enter PIN</h1>
        <p className="sub">This tool is limited to store staff. Enter your PIN to continue.</p>

        <form onSubmit={handleSubmit} autoComplete="off">
          <input
            id="pinInput"
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={8}
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <button id="pinSubmitBtn" type="submit" disabled={busy}>
            {busy ? 'Checking...' : 'Unlock'}
          </button>
        </form>
        {error && <div id="pinError" style={{ display: 'block' }}>{error}</div>}
      </div>
    </div>
  );
}
