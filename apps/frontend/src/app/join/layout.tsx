import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join your store — NoxGuarda',
  description: 'Accept your invitation and choose a password.',
  robots: { index: false, follow: false },
};

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
