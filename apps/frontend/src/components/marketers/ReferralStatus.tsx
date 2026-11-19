'use client';

import React from 'react';

/** How a shop a marketer added is doing, in plain words. Shared by Admin and the marketer's tab. */
export const REFERRAL_STATUS: Record<string, { label: string; tone: string }> = {
  NOT_SIGNED_UP: { label: 'Not signed up yet', tone: 'bg-slate-50 text-slate-600 border-slate-200' },
  PAYMENT_PENDING: { label: 'Signed up, not paid yet', tone: 'bg-amber-50 text-amber-800 border-amber-200' },
  PAID: { label: 'Paid', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  EXPIRED: { label: 'Plan expired', tone: 'bg-red-50 text-red-700 border-red-200' },
  ALREADY_CUSTOMER: { label: 'Already a customer', tone: 'bg-blue-50 text-blue-700 border-blue-200' },
};

export function ReferralStatusBadge({ status, planName }: { status: string; planName?: string | null }) {
  const s = REFERRAL_STATUS[status] || REFERRAL_STATUS.NOT_SIGNED_UP;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-bold whitespace-nowrap ${s.tone}`}>
      {s.label}
      {status === 'PAID' && planName ? ` (${planName})` : ''}
    </span>
  );
}

/** Three numbers at the top: added, signed up, paid. */
export function ReferralCounts({ counts }: { counts: { added: number; signedUp: number; paid: number } }) {
  const items = [
    { label: 'Businesses added', value: counts.added, tone: 'text-slate-900' },
    { label: 'Signed up', value: counts.signedUp, tone: 'text-amber-700' },
    { label: 'Paid', value: counts.paid, tone: 'text-emerald-700' },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((i) => (
        <div key={i.label} className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4">
          <div className={`text-2xl font-extrabold ${i.tone}`}>{i.value}</div>
          <div className="text-xs text-slate-500 mt-0.5">{i.label}</div>
        </div>
      ))}
    </div>
  );
}
