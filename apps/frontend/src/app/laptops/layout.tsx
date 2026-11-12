import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Laptops — NoxGuarda',
  description:
    'Register, sell and repair laptops by serial number, with warranty records and a public verification check for buyers.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
