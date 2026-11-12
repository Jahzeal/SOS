import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Choose a new password | NoxGuarda',
  description: 'Set a new NoxGuarda password.',
};

export default function SectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
