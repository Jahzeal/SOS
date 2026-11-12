import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Report a Stolen or Lost Device — NoxGuarda',
  description:
    'Report a stolen or lost phone or laptop by IMEI or serial number so NoxGuarda stores and buyers see the alert when they check it. Free.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
