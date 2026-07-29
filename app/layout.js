import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import ServiceWorkerRegister from '../components/ServiceWorkerRegister';
import RouteProgress from '../components/RouteProgress';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata = {
  title: 'End of Day Report',
  description: 'Generate clean, consistent end-of-day store reports in seconds.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EOD Report',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  themeColor: '#ffffff',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={inter.variable}>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {"document.documentElement.setAttribute('data-theme', localStorage.getItem('eodTheme') || 'light');"}
        </Script>
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
