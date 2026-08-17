import React from 'react';
import type { Viewport, Metadata } from 'next';
import { Providers } from './providers';
import { PwaRegister } from '@/components/PwaRegister';
import './globals.css';

export const metadata: Metadata = {
  title: 'VerifyFlow Retail OS — Complete Operating System for Phone Retailers',
  description: 'Manage phone inventory, IMEI verification, POS receipts, customer warranties, and repairs from one secure platform.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VerifyFlow',
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
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        <PwaRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
