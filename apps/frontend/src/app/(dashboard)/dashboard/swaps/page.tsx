'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftRight, Loader2, Plus, ShieldAlert, Receipt as ReceiptIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { SearchInput } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/store/useAuthStore';
import { can } from '@/lib/permissions';
import { api } from '@/lib/api';

const FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'SWAP', label: 'Swaps' },
  { value: 'BUY', label: 'Bought for cash' },
  { value: 'BLOCKED', label: 'Blocked' },
] as const;

const CONDITION_LABELS: Record<string, string> = {
  LIKE_NEW: 'Like new',
  GOOD: 'Good',
  FAIR: 'Fair',
  FOR_PARTS: 'For parts',
  NEW: 'New',
  EXCELLENT: 'Excellent',
  REFURBISHED: 'Refurbished',
};

const STATUS_LABELS: Record<string, string> = {
  IN_STOCK: 'In stock',
  SOLD: 'Sold',
  IN_REPAIR: 'In repair',
  RESERVED: 'Reserved',
  RETURNED: 'Returned',
  DISPOSED: 'Disposed',
};

function naira(n?: number | null) {
  return `₦${Math.abs(Number(n) || 0).toLocaleString()}`;
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function longDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function staffName(t: any) {
  return [t?.createdBy?.firstName, t?.createdBy?.lastName].filter(Boolean).join(' ') || '—';
}

function deviceName(t: any) {
  return [t.brand, t.model].filter(Boolean).join(' ') || 'Unknown device';
}

function TypeBadge({ t }: { t: any }) {
  if (t.status === 'BLOCKED') return <Badge variant="error" size="sm">Blocked: stolen</Badge>;
  if (t.kind === 'BUY') return <Badge variant="neutral" size="sm">Bought</Badge>;
  return <Badge variant="starter" size="sm">Swap</Badge>;
}

export default function SwapsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const showCosts = can(user, 'seeCosts');

  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [data, setData] = useState<{ summary: { count: number; totalValue: number; blocked: number }; tradeIns: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getTradeIns({ filter, search: debounced || undefined })
      .then((res) => !cancelled && setData(res))
      .catch((err) => !cancelled && setError(err?.message || 'Could not load swaps.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filter, debounced]);

  useEffect(() => {
    if (!openId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    api
      .getTradeIn(openId)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [openId]);

  const rows = data?.tradeIns || [];

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Swaps & Trade-ins</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Every device customers dropped, who brought it in, and any stolen devices that were stopped.
          </p>
        </div>
        <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />} onClick={() => router.push('/dashboard/checkout?mode=swap')}>
          New swap
        </Button>
      </div>

      {/* This month */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">This month</p>
          <p className="text-2xl font-extrabold text-slate-900">{data?.summary.count ?? '—'}</p>
          <p className="text-xs text-slate-500">devices taken in</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">Value taken in</p>
          <p className="text-2xl font-extrabold text-slate-900">{data ? naira(data.summary.totalValue) : '—'}</p>
          <p className="text-xs text-slate-500">this month</p>
        </div>
        <div className={`p-4 rounded-2xl border shadow-sm ${data?.summary.blocked ? 'bg-danger-50 border-danger-200' : 'bg-white border-slate-200'}`}>
          <p className="text-xs font-bold text-slate-500 uppercase">Stolen devices stopped</p>
          <p className={`text-2xl font-extrabold ${data?.summary.blocked ? 'text-danger-700' : 'text-slate-900'}`}>{data?.summary.blocked ?? '—'}</p>
          <p className="text-xs text-slate-500">this month</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div role="group" aria-label="Filter swaps" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-colors ${
                filter === f.value ? 'border-accent-600 bg-accent-50 text-accent-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="md:ml-auto md:w-80">
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search IMEI, serial, name or phone" aria-label="Search swaps" shortcutHint="" />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-16 flex justify-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : error ? (
        <p role="alert" className="p-4 rounded-xl bg-danger-50 border border-danger-200 text-danger-800 text-xs font-bold">{error}</p>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRight className="w-6 h-6" />}
          title={debounced || filter !== 'ALL' ? 'No matching swaps' : 'No swaps yet'}
          description="When a customer drops a device at checkout, or you buy one for cash, it will show here."
          primaryAction={{ label: 'New swap', onClick: () => router.push('/dashboard/checkout?mode=swap') }}
        />
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          {/* Desktop table */}
          <table className="hidden md:table w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-extrabold">
              <tr>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Device in</th>
                <th className="text-left px-4 py-3">From</th>
                <th className="text-right px-4 py-3">Value</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">By</th>
                <th className="text-left px-4 py-3">Now</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setOpenId(t.id)}
                  className={`cursor-pointer hover:bg-slate-50 ${t.status === 'BLOCKED' ? 'bg-danger-50/40' : ''}`}
                >
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{shortDate(t.createdAt)}</td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{deviceName(t)}</p>
                    <p className="text-slate-500 font-mono">{t.imei1 || t.serialNumber}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{t.customerName || '—'}</p>
                    <p className="text-slate-500">{t.customerPhone || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{t.status === 'BLOCKED' ? '—' : naira(t.tradeInValue)}</td>
                  <td className="px-4 py-3"><TypeBadge t={t} /></td>
                  <td className="px-4 py-3 text-slate-600">{staffName(t)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {t.status === 'BLOCKED' ? 'Not accepted' : STATUS_LABELS[t.phoneRecord?.status] || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Phone list */}
          <ul className="md:hidden divide-y divide-slate-100">
            {rows.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(t.id)}
                  className={`w-full text-left p-4 space-y-1 ${t.status === 'BLOCKED' ? 'bg-danger-50/40' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-extrabold text-sm text-slate-900">{deviceName(t)}</p>
                    <TypeBadge t={t} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {shortDate(t.createdAt)} · {t.customerName || 'Unknown customer'} · by {staffName(t)}
                  </p>
                  {t.status !== 'BLOCKED' && <p className="text-xs font-bold text-slate-800">{naira(t.tradeInValue)}</p>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detail */}
      <Modal
        isOpen={!!openId}
        onClose={() => setOpenId(null)}
        title={detail ? deviceName(detail) : 'Swap details'}
        icon={detail?.status === 'BLOCKED' ? <ShieldAlert className="w-5 h-5 text-danger-600" /> : <ArrowLeftRight className="w-5 h-5 text-accent-600" />}
        size="lg"
      >
        {detailLoading || !detail ? (
          <div className="py-10 flex justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {detail.status === 'BLOCKED' && (
              <div role="alert" className="p-3 rounded-xl bg-danger-600 text-white font-bold">
                This device is reported stolen. It was NOT accepted. Attempt on {longDate(detail.createdAt)} by {staffName(detail)}.
              </div>
            )}

            <section className="space-y-1">
              <h3 className="font-extrabold text-slate-900 uppercase text-[11px]">Device</h3>
              <p><span className="text-slate-500">{detail.imei1 ? 'IMEI' : 'Serial'}:</span> <span className="font-mono font-bold">{detail.imei1 || detail.serialNumber}</span></p>
              {detail.imei2 && <p><span className="text-slate-500">IMEI 2:</span> <span className="font-mono">{detail.imei2}</span></p>}
              {detail.condition && <p><span className="text-slate-500">Condition:</span> {CONDITION_LABELS[detail.condition] || detail.condition}</p>}
              {detail.status !== 'BLOCKED' && <p><span className="text-slate-500">Trade-in value:</span> <strong>{naira(detail.tradeInValue)}</strong></p>}
            </section>

            <section className="space-y-1">
              <h3 className="font-extrabold text-slate-900 uppercase text-[11px]">Brought in by</h3>
              <p className="font-bold">{detail.customerName || '—'} {detail.customerPhone ? `· ${detail.customerPhone}` : ''}</p>
              {detail.idType && <p><span className="text-slate-500">ID:</span> {detail.idType}{detail.idNumber ? ` · ${detail.idNumber}` : ''}</p>}
              {detail.status !== 'BLOCKED' && <p className="text-slate-500">Confirmed the device is theirs: {detail.ownershipConfirmed ? 'Yes' : 'No'}</p>}
              <p className="text-slate-500">Recorded by {staffName(detail)}{detail.branch?.name ? ` at ${detail.branch.name}` : ''} on {longDate(detail.createdAt)}</p>
            </section>

            {detail.status !== 'BLOCKED' && (
              <section className="space-y-1">
                <h3 className="font-extrabold text-slate-900 uppercase text-[11px]">Money</h3>
                {detail.sale && (
                  <p>
                    <span className="text-slate-500">Customer received:</span>{' '}
                    {(detail.sale.items || []).map((i: any) => i.description).join(', ') || '—'} ({naira(detail.sale.totalAmount)})
                  </p>
                )}
                <p className="font-bold">
                  {detail.balance < 0
                    ? `Store paid customer ${naira(detail.balance)}`
                    : `Customer paid ${naira(detail.balance)}`}
                  {detail.paymentMethod ? ` · ${String(detail.paymentMethod).replace('_', ' ').toLowerCase()}` : ''}
                </p>
                {detail.sale?.id && (
                  <Link href="/dashboard/receipts" className="inline-flex items-center gap-1 font-bold text-accent-600 hover:underline">
                    <ReceiptIcon className="w-3.5 h-3.5" /> Receipt {detail.sale.receiptNumber || detail.sale.invoiceNumber}
                  </Link>
                )}
              </section>
            )}

            {detail.status !== 'BLOCKED' && (
              <section className="space-y-1">
                <h3 className="font-extrabold text-slate-900 uppercase text-[11px]">What happened to it</h3>
                {detail.resold ? (
                  <>
                    <p>
                      Sold on {longDate(detail.resold.date)}
                      {detail.resold.customerName ? ` to ${detail.resold.customerName}` : ''} for <strong>{naira(detail.resold.price)}</strong>
                    </p>
                    {showCosts && detail.resold.profit != null && (
                      <p className={`font-bold ${detail.resold.profit >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
                        {detail.resold.profit >= 0 ? 'Profit' : 'Loss'}: {naira(detail.resold.profit)}
                      </p>
                    )}
                  </>
                ) : (
                  <p>{STATUS_LABELS[detail.phoneRecord?.status] || 'In stock'}</p>
                )}
                {detail.phoneRecord?.id && (
                  <Link href={`/dashboard/records/${detail.phoneRecord.id}`} className="inline-block font-bold text-accent-600 hover:underline">
                    Open device record →
                  </Link>
                )}
              </section>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
