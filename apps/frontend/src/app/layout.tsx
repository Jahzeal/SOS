import React from 'react';
import { Providers } from './providers';
import './globals.css';

export const metadata = {
  title: 'VerifyFlow Retail OS — Complete Operating System for Phone Retailers',
  description: 'Manage phone inventory, IMEI verification, POS receipts, customer warranties, and repairs from one secure platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
