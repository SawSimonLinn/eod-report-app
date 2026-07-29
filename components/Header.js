'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import BrandMark from './BrandMark';
import ThemeToggleButton from './ThemeToggleButton';
import { loadHistory } from '../lib/history';

const NAV_LINKS = [
  { href: '/', label: 'Generate' },
  { href: '/expense', label: 'Expense' },
  { href: '/history', label: 'History', badge: true },
  { href: '/about', label: 'About' },
];

export default function Header() {
  const pathname = usePathname();
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    function readCount() {
      setHistoryCount(loadHistory().length);
    }
    readCount();
    window.addEventListener('storage', readCount);
    window.addEventListener('focus', readCount);
    return () => {
      window.removeEventListener('storage', readCount);
      window.removeEventListener('focus', readCount);
    };
  }, [pathname]);

  return (
    <header className="site-header">
      <Link className="brand" href="/">
        <BrandMark />
        <span className="brand-name">EOD Report</span>
      </Link>
      <nav>
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          const classNames = [link.cta ? 'nav-cta' : '', isActive ? 'active' : ''].filter(Boolean).join(' ') || undefined;
          return (
            <Link key={link.href} href={link.href} className={classNames}>
              {link.label}
              {link.badge && (
                <span className={`history-badge${historyCount > 0 ? ' show' : ''}`}>{historyCount}</span>
              )}
            </Link>
          );
        })}
        <ThemeToggleButton />
      </nav>
    </header>
  );
}
