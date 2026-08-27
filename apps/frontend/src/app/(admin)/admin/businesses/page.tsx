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
} from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminBusinessesManagementPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [totalCount, setTotalCount] = useState(0);

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
    <div className="space-y-6 pb-12 font-sans w-full">
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
            <option value="STARTER">Starter</option>
            <option value="BUSINESS">Business</option>
            <option value="ENTERPRISE">Enterprise</option>
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

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-subtle">
        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs min-w-[760px]">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-semibold">Business</th>
                <th className="px-4 py-3 font-semibold">Contact / Email</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold text-center">Devices</th>
                <th className="px-4 py-3 font-semibold text-center">Public Verification</th>
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
                        <div>
                          <div className="font-extrabold text-slate-900">{b.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">/{b.slug}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="text-slate-900 font-semibold">{b.email || '—'}</div>
                      <div className="text-[11px] text-slate-400">
                        {b.phone && b.phone !== '+15550192834' ? b.phone : '—'}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            b.plan === 'ENTERPRISE'
                              ? 'bg-purple-100 text-purple-800'
                              : b.plan === 'BUSINESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {b.plan}
                        </span>
                        {b.subscriptionStatus === 'ACTIVE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active (Paid)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                            14-Day Trial
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-800">
                      {b.registeredDevicesCount ?? b._count?.phoneRecords ?? 0}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleVerification(b.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          b.publicVerificationEnabled
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {b.publicVerificationEnabled ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Enabled</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Disabled</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono text-[11px] text-slate-400">
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
