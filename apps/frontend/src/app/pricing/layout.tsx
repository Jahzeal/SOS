import React from 'react';
import type { Metadata } from 'next';
import { InitialPlansProvider } from './InitialPlans';

export const metadata: Metadata = {
  title: 'Pricing & Plans — NoxGuarda',
  description:
    'NoxGuarda plans for sellers of phones, laptops and accessories. Start free with up to 10 devices; paid plans are charged in naira through Paystack.',
};

// Plans are fetched on the server so the first HTML (and any link preview)
// already contains them. Refreshed at most every 5 minutes.
async function fetchPlans(): Promise<any[] | null> {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const base = (/^https?:\/\//.test(raw) ? raw : `https://${raw}`).replace(/\/$/, '');
  try {
    const res = await fetch(`${base}/plans`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    const plans = Array.isArray(data?.plans) ? data.plans : Array.isArray(data) ? data : null;
    return plans;
  } catch {
    return null; // the client falls back to fetching in the browser
  }
}

export default async function PricingLayout({ children }: { children: React.ReactNode }) {
  const plans = await fetchPlans();
  return <InitialPlansProvider plans={plans}>{children}</InitialPlansProvider>;
}
