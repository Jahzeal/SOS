import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in | NoxGuarda',
  description: 'Sign in to your NoxGuarda store workspace.',
};

export default function SectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
