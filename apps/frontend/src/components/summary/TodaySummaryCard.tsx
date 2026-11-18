'use client';

import React, { useEffect, useState } from 'react';
import { CalendarDays, MessageCircle } from 'lucide-react';
import { api, DailySummaryData } from '@/lib/api';

function naira(n: number) {
  return `₦${Math.round(Math.abs(n)).toLocaleString('en-NG')}`;
}

/** The text that goes into WhatsApp when the owner taps Share. */
function shareText(s: DailySummaryData, dayLabel: string, storeName?: string) {
  const lines = [
    `*${storeName ? `${storeName}: ` : ''}${dayLabel}*`,
    s.salesCount ? `💰 Sales: ${s.salesCount} · ${naira(s.revenue)}` : '💰 No sales recorded today',
    s.profit != null && s.salesCount ? `📈 Profit: ${s.profit < 0 ? '−' : ''}${naira(s.profit)}` : '',
    s.devicesSoldCount ? `📱 Devices sold: ${s.devicesSoldCount}` : '',
    s.tradeInsCount ? `🔄 Swaps: ${s.tradeInsCount} (${naira(s.tradeInsValue)} taken in)` : '',
    s.blockedCount ? `🔴 Stolen devices stopped: ${s.blockedCount}` : '',
    s.owed ? `🧾 Customers owe: ${naira(s.owed)}` : '',
    s.topSeller ? `👤 Top seller: ${s.topSeller.name} (${s.topSeller.sales})` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

/** Dashboard card with today's numbers and a Share to WhatsApp button (owners and managers). */
export function TodaySummaryCard({ storeName }: { storeName?: string }) {
  const [data, setData] = useState<{ dayLabel: string; summary: DailySummaryData } | null>(null);

  useEffect(() => {
    api.getDailySummaryToday().then(setData).catch(() => setData(null));
  }, []);

  if (!data) return null;
  const s = data.summary;

  const stats: Array<{ label: string; value: string; tone?: string }> = [
    { label: 'Sales', value: `${s.salesCount} · ${naira(s.revenue)}` },
    ...(s.profit != null ? [{ label: 'Profit', value: `${s.profit < 0 ? '−' : ''}${naira(s.profit)}`, tone: s.profit < 0 ? 'text-danger-700' : 'text-success-700' }] : []),
    { label: 'Devices sold', value: String(s.devicesSoldCount) },
    { label: 'Swaps', value: s.tradeInsCount ? `${s.tradeInsCount} · ${naira(s.tradeInsValue)}` : '0' },
    { label: 'Customers owe', value: naira(s.owed) },
  ];

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-accent-600" /> Today · {data.dayLabel}
        </h2>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText(s, data.dayLabel, storeName))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-success-600 hover:bg-success-700 text-white text-xs font-extrabold"
        >
          <MessageCircle className="w-4 h-4" /> Share to WhatsApp
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
