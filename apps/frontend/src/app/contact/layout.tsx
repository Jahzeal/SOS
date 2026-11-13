import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us — NoxGuarda',
  description: 'Send the NoxGuarda team a message about plans, your store account, billing, or a stolen device.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
