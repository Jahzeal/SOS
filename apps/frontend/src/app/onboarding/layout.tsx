import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create your account | NoxGuarda',
  description: 'Set up your NoxGuarda store workspace.',
};

export default function SectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
