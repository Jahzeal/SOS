'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Building2,
  RefreshCw,
  MoreVertical,
  Plus,
  CreditCard,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminSubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalSubscribers: 0,
    activeMRR: 0,
    projectedARR: 0,
    averageRevenuePerUser: 0,
    tierCounts: { starter: 0, business: 0, enterprise: 0 },
    tierPricing: { STARTER: 15000, BUSINESS: 45000, ENTERPRISE: 120000 },
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await api.adminGetSubscriptions();
      if (res?.success) {
        setSubscribers(res.subscribers || res.data || []);
        if (res.summary) {
          setSummary(res.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const filteredSubscribers = subscribers.filter((s) => {
    if (planFilter !== 'ALL' && s.plan !== planFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        s.businessName.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12 font-sans w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Subscriptions & MRR
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Active merchant billing tiers, subscription revenue analytics, and account quotas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSubscriptions}
            title="Refresh Metrics"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-slate-600 flex items-center justify-center transition shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-subtle">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Active Subscribers
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
            {summary.totalSubscribers}
          </div>
          <span className="text-[11px] font-bold text-blue-600">Merchant accounts</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-subtle">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Monthly Recurring Revenue (MRR)
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
            ₦{summary.activeMRR.toLocaleString()}
          </div>
          <span className="text-[11px] font-bold text-emerald-600">Live billings</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-subtle">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Projected ARR
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
            ₦{summary.projectedARR.toLocaleString()}
          </div>
          <span className="text-[11px] font-bold text-amber-600">Annual run rate</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-subtle">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-2">
            ARPU (Avg Revenue)
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
            ₦{summary.averageRevenuePerUser.toLocaleString()}
          </div>
          <span className="text-[11px] font-bold text-purple-600">Per subscriber / mo</span>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-subtle flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search business subscriber..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-[38px] pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="h-[38px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
          >
            <option value="ALL">All Tiers</option>
            <option value="STARTER">Starter Store (₦15,000/mo)</option>
            <option value="BUSINESS">Business Hub (₦45,000/mo)</option>
            <option value="ENTERPRISE">Enterprise Network (₦120,000/mo)</option>
          </select>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-subtle">
        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs min-w-[840px]">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-semibold">Subscriber</th>
                <th className="px-4 py-3 font-semibold">Tier Plan</th>
                <th className="px-4 py-3 font-semibold">Monthly Price</th>
                <th className="px-4 py-3 font-semibold text-center">Staff Quota</th>
                <th className="px-4 py-3 font-semibold text-center">Lookups / Mo</th>
                <th className="px-4 py-3 font-semibold text-center">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredSubscribers.length > 0 ? (
                filteredSubscribers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-extrabold text-slate-900">{s.businessName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">/{s.slug}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <select
                        value={s.plan}
                        onChange={async (e) => {
                          const newPlan = e.target.value;
                          try {
                            await api.adminUpdateBusinessPlan(s.id, newPlan);
                            fetchSubscriptions();
                          } catch (err) {
                            console.error('Failed to update plan:', err);
                          }
                        }}
                        className="text-[11px] font-extrabold py-1 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-600 cursor-pointer shadow-2xs"
                      >
                        <option value="STARTER">STARTER (₦15k/mo)</option>
                        <option value="BUSINESS">BUSINESS (₦45k/mo)</option>
                        <option value="ENTERPRISE">ENTERPRISE (₦120k/mo)</option>
                      </select>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      ₦{s.price?.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/ mo</span>
                    </td>

                    <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-800">
                      {s.usage?.staffCount || 0} / {s.limits?.maxStaff || 1}
                    </td>

                    <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-800">
                      {s.limits?.maxLookups?.toLocaleString() || 500}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          s.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono text-[11px] text-slate-400">
                      {s.memberSince ? new Date(s.memberSince).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    {loading ? 'Loading subscribers...' : 'No subscribers found in database.'}
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
