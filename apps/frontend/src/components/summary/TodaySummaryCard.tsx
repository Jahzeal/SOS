'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { api, DailySummaryData } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { can } from '@/lib/permissions';

/** Desktop columns for 3, 4 or 5 boxes (written out so the styling tool keeps them). */
const COLS: Record<number, string> = { 3: 'md:grid-cols-3', 4: 'md:grid-cols-4', 5: 'md:grid-cols-5' };

function naira(n: number) {
  return `₦${Math.round(Math.abs(n)).toLocaleString('en-NG')}`;
}

/**
 * Dashboard card with today's numbers at a glance, for everyone in the store.
 * Profit only reaches owners and managers; technicians get counts without amounts.
 */
export function TodaySummaryCard(_props: { storeName?: string }) {
  const user = useAuthStore((st) => st.user);
  const canSeeReports = can(user, 'reports');
  const selectedBranchId = useAuthStore((st) => st.selectedBranchId);
  // Cached for a minute like the rest of the dashboard, so coming back shows it at once.
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dailySummaryToday', selectedBranchId || 'all'],
    queryFn: () => api.getDailySummaryToday(),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Keep the card's space while it loads, so the page does not jump.
  if (isLoading) {
    return (
      <div aria-hidden="true" className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-pulse">
        <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }
  if (isError || !data) return null;
  const s = data.summary;

  const money = data.showAmounts !== false;
  const stats: Array<{ label: string; value: string; tone?: string }> = [
    { label: 'Sales', value: money ? `${s.salesCount} · ${naira(s.revenue)}` : String(s.salesCount) },
    ...(s.profit != null ? [{ label: 'Profit', value: `${s.profit < 0 ? '−' : ''}${naira(s.profit)}`, tone: s.profit < 0 ? 'text-danger-700' : 'text-success-700' }] : []),
    { label: 'Devices sold', value: String(s.devicesSoldCount) },
    { label: 'Swaps', value: s.tradeInsCount && money ? `${s.tradeInsCount} · ${naira(s.tradeInsValue)}` : String(s.tradeInsCount) },
    ...(money ? [{ label: 'Customers owe', value: naira(s.owed) }] : []),
  ];

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-accent-600" /> Today · {data.dayLabel}
        </h2>
        {canSeeReports && (
        <Link
          href="/dashboard/reports"
          className="inline-flex items-center gap-1 text-xs font-extrabold text-accent-600 hover:underline"
        >
          View report <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        )}
      </div>

      <div className={`grid grid-cols-2 gap-3 ${COLS[stats.length] || 'md:grid-cols-5'}`}>
        {stats.map((st) => (
          <div key={st.label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">{st.label}</p>
            <p className={`text-sm font-extrabold ${st.tone || 'text-slate-900 dark:text-white'}`}>{st.value}</p>
          </div>
        ))}
      </div>

      {(s.topSeller || s.blockedCount > 0) && (
        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
          {s.topSeller ? `Top seller: ${s.topSeller.name} (${s.topSeller.sales} sale${s.topSeller.sales === 1 ? '' : 's'}). ` : ''}
          {s.blockedCount > 0 ? `${s.blockedCount} stolen device${s.blockedCount === 1 ? ' was' : 's were'} stopped at the counter today.` : ''}
        </p>
      )}
    </div>
  );
}
