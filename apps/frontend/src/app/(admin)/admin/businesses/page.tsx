'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Plus,
  X,
  Building2,
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Shield,
  Smartphone,
  Check,
  Mail,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { api } from '@/lib/api';

/** The store's contact email, or its owner's sign-in email when the store has none saved. */
function contactEmailOf(b: any): string {
  if (b?.email) return b.email;
  const owner = (b?.users || []).find((u: any) => u.role !== 'ADMIN') || b?.users?.[0];
  return owner?.email || '';
}

/** WhatsApp needs the international form: 0808… becomes 234808…. */
function whatsappNumber(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.startsWith('0') ? `234${digits.slice(1)}` : digits;
}

const hasPhone = (b: any) => !!b?.phone && b.phone !== '+15550192834';

/** What the store's subscription looks like right now, in plain words. */
function statusLabel(b: any): { text: string; tone: string } {
  if (b?.isMarketerStore) return { text: 'Marketer (free)', tone: 'bg-violet-50 text-violet-700 border-violet-200' };
  switch (String(b?.subscriptionStatus || '').toUpperCase()) {
    case 'ACTIVE':
      return { text: 'Active (Paid)', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'PENDING_PAYMENT':
      return { text: 'Payment pending', tone: 'bg-amber-50 text-amber-800 border-amber-200' };
    case 'TRIAL':
      return { text: 'Trial (old)', tone: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'EXPIRED':
    case 'PAST_DUE':
      return { text: 'Expired', tone: 'bg-red-50 text-red-700 border-red-200' };
    default:
      return { text: 'Free (old)', tone: 'bg-slate-50 text-slate-600 border-slate-200' };
  }
}

function PlanBadges({ b }: { b: any }) {
  const status = statusLabel(b);
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase bg-slate-100 text-slate-700">
        {b.plan}
      </span>
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase border ${status.tone}`}>
        {status.text}
      </span>
    </div>
  );
}

function ContactButtons({ b }: { b: any }) {
  const email = contactEmailOf(b);
  if (!email && !hasPhone(b)) return <span className="text-slate-400 text-xs">—</span>;
  return (
    <div className="flex items-center gap-1.5">
      {email && (
        <a
          href={`mailto:${email}?subject=NoxGuarda Store Support`}
          title={`Email ${email}`}
          aria-label={`Email ${b.name}`}
          className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
        >
          <Mail className="w-4 h-4" />
        </a>
      )}
      {hasPhone(b) && (
        <>
          <a
            href={`tel:${b.phone}`}
            title={`Call ${b.phone}`}
            aria-label={`Call ${b.name}`}
            className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
          >
            <Phone className="w-4 h-4" />
          </a>
          <a
            href={`https://wa.me/${whatsappNumber(b.phone)}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`WhatsApp ${b.phone}`}
            aria-label={`WhatsApp ${b.name}`}
            className="p-2 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
        </>
      )}
    </div>
  );
}

export default function AdminBusinessesManagementPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [totalCount, setTotalCount] = useState(0);
  const [planOptions, setPlanOptions] = useState<{ code: string; name: string }[]>([]);

  useEffect(() => {
    api
      .adminGetPlans()
      .then((r) => setPlanOptions((r?.plans || []).map((p: any) => ({ code: String(p.code), name: p.name || p.code }))))
      .catch(() => setPlanOptions([]));
  }, []);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const res = await api.adminGetBusinesses({
        search: searchTerm || undefined,
        plan: selectedPlan !== 'ALL' ? selectedPlan : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        limit: 50,
      });

      if (res?.success) {
        setBusinesses(res.businesses || res.data || []);
        setTotalCount(res.total || res.meta?.total || (res.businesses || res.data || []).length);
      }
    } catch (err) {
      console.error('Failed to load businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [selectedPlan, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBusinesses();
  };

  const handleToggleVerification = async (id: string) => {
    try {
      const res = await api.adminToggleBusinessVerification(id);
      if (res?.success) {
        setBusinesses((prev) =>
          prev.map((b) =>
            b.id === id ? { ...b, publicVerificationEnabled: res.data.publicVerificationEnabled } : b
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle verification:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans w-full min-w-0 max-w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Registered Businesses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Manage subscribed retail merchants, store branches, and verification permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBusinesses}
            title="Refresh List"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-slate-600 flex items-center justify-center transition shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search business, owner, slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-[38px] pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-600"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="h-[38px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
          >
            <option value="ALL">All Plans</option>
            {planOptions.map((p) => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
            <option value="FREE">Free (old)</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-[38px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active Lookup</option>
            <option value="inactive">Paused Lookup</option>
          </select>
        </div>
      </div>

      {/* Phones: one card per store */}
      <div className="md:hidden space-y-3">
        {businesses.length > 0 ? (
          businesses.map((b) => (
            <div key={b.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center font-bold text-sm shrink-0">
                    {b.name?.[0] || 'B'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-slate-900 truncate">{b.name}</div>
                    <div className="text-xs text-slate-400 font-mono truncate">/{b.slug}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-extrabold text-slate-900">{b.registeredDevicesCount ?? b._count?.phoneRecords ?? 0}</div>
                  <div className="text-[11px] text-slate-400">devices</div>
                </div>
              </div>
              <PlanBadges b={b} />
              <div className="text-xs space-y-0.5">
                <div className="text-slate-900 font-semibold break-all">{contactEmailOf(b) || 'No email'}</div>
                {!b.email && contactEmailOf(b) && <div className="text-[11px] text-slate-400">owner&apos;s sign-in email</div>}
                <div className="text-slate-500">{hasPhone(b) ? b.phone : 'No phone'}</div>
              </div>
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <ContactButtons b={b} />
                <span className="text-[11px] text-slate-400">Joined {new Date(b.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs bg-white border border-slate-200 rounded-2xl">
            {loading ? 'Loading registered merchants...' : 'No businesses found.'}
          </div>
        )}
      </div>

      {/* Bigger screens: the table */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-subtle">
        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-mono text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-semibold">Business</th>
                <th className="px-4 py-3 font-semibold">Contact / Email</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold text-center">Devices</th>
                <th className="px-4 py-3 font-semibold text-center">Contact Store</th>
                <th className="px-5 py-3 font-semibold text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {businesses.length > 0 ? (
                businesses.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center font-bold text-xs shrink-0">
                          {b.name?.[0] || 'B'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-slate-900">{b.name}</div>
                          <div className="text-xs text-slate-400 font-mono">/{b.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 max-w-[240px]">
                      <div className="text-slate-900 font-semibold break-all">{contactEmailOf(b) || '—'}</div>
                      {!b.email && contactEmailOf(b) && <div className="text-[11px] text-slate-400">owner&apos;s sign-in email</div>}
                      <div className="text-xs text-slate-400">{hasPhone(b) ? b.phone : '—'}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <PlanBadges b={b} />
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-800">
                      {b.registeredDevicesCount ?? b._count?.phoneRecords ?? 0}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-center">
                        <ContactButtons b={b} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs text-slate-400">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    {loading ? 'Loading registered merchants...' : 'No businesses found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
