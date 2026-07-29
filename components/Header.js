'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import BrandMark from './BrandMark';
import ThemeToggleButton from './ThemeToggleButton';
import { MenuIcon, CloseIcon } from './icons';
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
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <>
      <header className="site-header">
        <Link className="brand" href="/">
          <BrandMark />
          <span className="brand-name">EOD Report</span>
        </Link>

        <nav className="nav-desktop">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className={isActive ? 'active' : undefined}>
                {link.label}
                {link.badge && (
                  <span className={`history-badge${historyCount > 0 ? ' show' : ''}`}>{historyCount}</span>
                )}
              </Link>
            );
          })}
          <ThemeToggleButton />
        </nav>

        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </header>

      <div className={`mobile-nav-overlay${menuOpen ? ' show' : ''}`} onClick={(e) => e.target === e.currentTarget && setMenuOpen(false)}>
        <div className="mobile-nav-panel">
          <button className="mobile-nav-close" type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
            <CloseIcon />
          </button>
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className={isActive ? 'active' : undefined}>
                {link.label}
                {link.badge && (
                  <span className={`history-badge${historyCount > 0 ? ' show' : ''}`}>{historyCount}</span>
                )}
              </Link>
            );
          })}
          <div className="mobile-nav-theme">
            <span>Theme</span>
            <ThemeToggleButton />
          </div>
        </div>
      </div>
    </>
  );
}
