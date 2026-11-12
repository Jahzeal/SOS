import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | NoxGuarda',
  description: 'Your NoxGuarda store workspace.',
};

export default function SectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
