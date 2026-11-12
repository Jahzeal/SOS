import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin | NoxGuarda',
  description: 'NoxGuarda platform administration.',
};

export default function SectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
