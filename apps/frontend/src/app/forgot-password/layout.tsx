import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset your password | NoxGuarda',
  description: 'Request a NoxGuarda password reset link.',
};

export default function SectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
