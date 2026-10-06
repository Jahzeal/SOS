import React from 'react';
import type { Viewport, Metadata } from 'next';
import { Providers } from './providers';
import { PwaRegister } from '@/components/PwaRegister';
import { NetworkStatusBanner } from '@/components/NetworkStatusBanner';
import './globals.css';

export const metadata: Metadata = {
  title: 'NOXGUARDA — Institutional Phone Retail OS & Anti-Theft Registry',
  description: 'Manage phone inventory, IMEI verification, POS receipts, customer warranties, and repairs from one secure platform.',
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
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0F172A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen" suppressHydrationWarning>
        <NetworkStatusBanner />
        <PwaRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
