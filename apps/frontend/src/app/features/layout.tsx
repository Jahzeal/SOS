import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features — NoxGuarda',
  description:
    'Device verification by IMEI or serial number, stock tracking, receipts, invoices and quotations, warranty records and a repair desk for sellers of phones, laptops and accessories.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
