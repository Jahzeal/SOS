import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marketer sign-up — NoxGuarda',
  description: 'Choose a password to open your NoxGuarda marketer store.',
  robots: { index: false, follow: false },
};

export default function MarketerJoinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
