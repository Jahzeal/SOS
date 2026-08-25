'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Download,
  Plus,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Building2,
  Calendar,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface SubscriptionItem {
  id: string;
  subId: string;
  initials: string;
  avatarBg: string;
  businessName: string;
  plan: 'Enterprise' | 'Business' | 'Starter';
  billingCycle: 'Monthly' | 'Annually';
  amount: string;
  status: 'Active' | 'Past Due' | 'Trial' | 'Cancelled';
  renewalDate: string;
}

const mockSubscriptions: SubscriptionItem[] = [
  {
    id: 's1',
    subId: 'SUB-89012',
    initials: 'AC',
    avatarBg: 'bg-blue-600 text-white',
    businessName: 'TechCorp Nigeria Ltd',
    plan: 'Enterprise',
    billingCycle: 'Annually',
    amount: '1,250,000',
    status: 'Active',
    renewalDate: 'Oct 24, 2026',
  },
  {
    id: 's2',
    subId: 'SUB-89013',
    initials: 'GL',
    avatarBg: 'bg-indigo-100 text-indigo-700',
    businessName: 'Globex Logistics',
    plan: 'Business',
    billingCycle: 'Monthly',
    amount: '150,000',
    status: 'Past Due',
    renewalDate: 'Oct 01, 2026',
  },
  {
    id: 's3',
    subId: 'SUB-89014',
    initials: 'IS',
    avatarBg: 'bg-amber-100 text-amber-800',
    businessName: 'InnoSoft Solutions',
    plan: 'Starter',
    billingCycle: 'Monthly',
    amount: '50,000',
    status: 'Trial',
    renewalDate: 'Nov 15, 2026',
  },
  {
    id: 's4',
    subId: 'SUB-89015',
    initials: 'ZV',
    avatarBg: 'bg-emerald-100 text-emerald-800',
    businessName: 'Zenith Verifications',
    plan: 'Business',
    billingCycle: 'Monthly',
    amount: '45,000',
    status: 'Active',
    renewalDate: 'Sep 19, 2026',
  },
  {
    id: 's5',
    subId: 'SUB-89016',
    initials: 'FT',
    avatarBg: 'bg-slate-200 text-slate-700',
    businessName: 'FlowTech Solutions',
    plan: 'Starter',
    billingCycle: 'Monthly',
    amount: '15,000',
    status: 'Cancelled',
    renewalDate: 'Aug 12, 2026',
  },
];

export default function AdminSubscriptionsManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = mockSubscriptions.filter((s) => {
    if (planFilter !== 'ALL' && s.plan.toLowerCase() !== planFilter.toLowerCase()) return false;
    if (statusFilter !== 'ALL' && s.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        s.businessName.toLowerCase().includes(q) ||
        s.subId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col flex-1 pb-8 font-sans w-full max-w-full overflow-hidden">
      {/* Page Header & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
            Subscriptions Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Monitor and manage business subscription plans across the platform.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button className="h-[38px] px-4 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-subtle">
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export List</span>
          </button>
          <Link
            href="/admin/subscriptions/new"
            className="h-[38px] px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>New Subscription</span>
          </Link>
        </div>
      </div>

      {/* 4 KPI Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Active */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-subtle">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Total Active
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">1,248</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1">+12% vs last month</div>
          </div>
        </div>

        {/* Monthly MRR */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-subtle">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Monthly MRR
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              ₦12.4M
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1">+4.5% vs last month</div>
          </div>
        </div>

        {/* Past Due */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-subtle">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Past Due
            </span>
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">42</div>
            <div className="text-[11px] font-bold text-rose-600 mt-1">Requires attention</div>
          </div>
        </div>

        {/* Enterprise Plans */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-subtle">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Enterprise Plans
            </span>
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">86</div>
            <div className="text-[11px] font-semibold text-slate-500 mt-1">High-value accounts</div>
          </div>
        </div>
      </div>

      {/* Data Table Section */}
      <div className="bg-white border border-slate-200 rounded-2xl flex flex-col shadow-subtle w-full max-w-full overflow-hidden">
        {/* Table Controls */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200/80 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter subscriptions..."
              className="w-full h-[36px] pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors shadow-subtle"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="h-[36px] px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none shadow-subtle"
            >
              <option value="ALL">All Plans</option>
              <option value="starter">Starter</option>
              <option value="business">Business</option>
              <option value="enterprise">Enterprise</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-[36px] px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none shadow-subtle"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="past due">Past Due</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button className="h-[36px] px-3 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-subtle">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Date Range</span>
            </button>
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filtered.map((s) => (
            <div key={s.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${s.avatarBg} flex items-center justify-center font-bold text-xs shrink-0`}>
                    {s.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{s.businessName}</h4>
                    <span className="font-mono text-[10px] text-slate-400 font-bold">{s.subId}</span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                    s.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : s.status === 'Past Due'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : s.status === 'Trial'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      s.status === 'Active'
                        ? 'bg-emerald-500'
                        : s.status === 'Past Due'
                        ? 'bg-rose-500'
                        : s.status === 'Trial'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  {s.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Plan & Cycle</span>
                  <div className="font-semibold text-slate-800">{s.plan} • {s.billingCycle}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Amount</span>
                  <div className="font-mono font-bold text-slate-900">₦{s.amount}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Renewal: <strong className="text-slate-800">{s.renewalDate}</strong></span>
                <button className="p-1 text-slate-400 hover:text-slate-700">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Responsive Desktop Table */}
        <div className="hidden md:block overflow-x-auto w-full max-w-full custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Business</th>
                <th className="py-3 px-4 font-semibold">Plan</th>
                <th className="py-3 px-4 font-semibold">Billing Cycle</th>
                <th className="py-3 px-4 font-semibold text-right">Amount (₦)</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Renewal Date</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${s.avatarBg} flex items-center justify-center font-bold text-xs shrink-0`}>
                        {s.initials}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{s.businessName}</p>
                        <p className="font-mono text-[10px] text-slate-400 font-semibold">{s.subId}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        s.plan === 'Enterprise'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : s.plan === 'Business'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {s.plan}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-600">{s.billingCycle}</td>

                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {s.amount}
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        s.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : s.status === 'Past Due'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : s.status === 'Trial'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          s.status === 'Active'
                            ? 'bg-emerald-500'
                            : s.status === 'Past Due'
                            ? 'bg-rose-500'
                            : s.status === 'Trial'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`}
                      />
                      {s.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                    {s.renewalDate}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-lg opacity-0 group-hover:opacity-100">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-900">1</span> to{' '}
            <span className="font-bold text-slate-900">{filtered.length}</span> of{' '}
            <span className="font-bold text-slate-900">1,248</span> entries
          </div>

          <div className="flex items-center gap-1 font-semibold">
            <button
              disabled
              className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-400 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:hover:bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-7 h-7 flex items-center justify-center border border-blue-600 bg-blue-600 text-white rounded-lg font-bold text-xs shadow-sm">
              1
            </button>
            <button className="w-7 h-7 flex items-center justify-center border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 rounded-lg text-xs transition-colors">
              2
            </button>
            <button className="w-7 h-7 flex items-center justify-center border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 rounded-lg text-xs transition-colors">
              3
            </button>
            <span className="px-1 text-slate-400">...</span>
            <button className="w-7 h-7 flex items-center justify-center border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 rounded-lg text-xs transition-colors">
              125
            </button>
            <button className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-100 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
