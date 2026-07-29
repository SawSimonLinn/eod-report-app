'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

let historyPatched = false;

function patchHistory() {
  if (historyPatched || typeof window === 'undefined') return;
  historyPatched = true;
  const originalPushState = window.history.pushState.bind(window.history);
  window.history.pushState = (...args) => {
    const result = originalPushState(...args);
    setTimeout(() => window.dispatchEvent(new Event('nav-start')), 0);
    return result;
  };
}

export default function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const growTimer = useRef(null);
  const hideTimer = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    patchHistory();
    function handleStart() {
      clearInterval(growTimer.current);
      clearTimeout(hideTimer.current);
      setVisible(true);
      setProgress(15);
      growTimer.current = setInterval(() => {
        setProgress((p) => (p < 85 ? p + (85 - p) * 0.1 : p));
      }, 150);
    }
    window.addEventListener('nav-start', handleStart);
    return () => window.removeEventListener('nav-start', handleStart);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    clearInterval(growTimer.current);
    setProgress(100);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 200);
    return () => clearTimeout(hideTimer.current);
  }, [pathname, searchParams]);

  return <div className={`route-progress${visible ? ' show' : ''}`} style={{ width: `${progress}%` }} />;
}
