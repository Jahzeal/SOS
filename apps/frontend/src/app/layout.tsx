import React from 'react';
import type { Viewport, Metadata } from 'next';
import { Providers } from './providers';
import { PwaRegister } from '@/components/PwaRegister';
import { NetworkStatusBanner } from '@/components/NetworkStatusBanner';
import './globals.css';
import './dark-fallback.css';

export const metadata: Metadata = {
  title: 'NoxGuarda — Inventory, Receipts & Device Verification for Phone, Laptop and Accessory Sellers',
  description: 'For Nigerian sellers of phones, laptops and accessories: stock by IMEI or serial number, receipts, invoices, quotations, repairs, warranty records, and a public check for stolen devices.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-64.png', sizes: '64x64', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon-32.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NoxGuarda',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var path = window.location.pathname || '';
                  var isInternal = path.startsWith('/dashboard') || path.startsWith('/admin');
                  if (isInternal) {
                    var saved = localStorage.getItem('noxguarda_theme_mode');
                    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (saved === 'dark' || (saved === 'system' && prefersDark)) {
                      document.documentElement.classList.add('dark');
                      document.documentElement.style.colorScheme = 'dark';
                      return;
                    }
                  }
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* The browser offers "install this app" once, early. Keep hold of the
            offer here so the Download App button can use it whenever it is clicked. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  window.addEventListener('beforeinstallprompt', function(e) {
                    e.preventDefault();
                    window.__ngInstallPrompt = e;
                    window.dispatchEvent(new Event('ng-install-change'));
                  });
                  window.addEventListener('appinstalled', function() {
                    window.__ngInstallPrompt = null;
                    window.__ngInstalled = true;
                    window.dispatchEvent(new Event('ng-install-change'));
                  });
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen" suppressHydrationWarning>
        <NetworkStatusBanner />
        <PwaRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
