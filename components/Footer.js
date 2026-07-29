'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const FOOTER_LINKS = [
  { href: '/', label: 'Generate' },
  { href: '/expense', label: 'Expense' },
  { href: '/history', label: 'History' },
  { href: '/about', label: 'About' },
];

export default function Footer() {
  const pathname = usePathname();
  const links = FOOTER_LINKS.filter((link) => link.href !== pathname);

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="f-brand">
          <strong>EOD Report</strong> · internal store ops tool
        </div>
        <div className="f-links">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
