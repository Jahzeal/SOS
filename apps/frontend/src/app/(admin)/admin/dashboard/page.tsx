'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  CreditCard,
  TrendingUp,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Clock,
  AlertTriangle,
  Info,
} from 'lucide-react';
import VerificationActivityChart from '@/components/admin/VerificationActivityChart';
import { api } from '@/lib/api';

export default function AdminOverviewDashboard() {
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | '90d'>('today');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalBusinesses: 0,
    activeBusinesses: 0,
    totalRegisteredPhones: 0,
    calculatedMrr: 0,
    totalRevenue: 0,
    systemHealth: '100% Operational',
  });
  const [systemLogs, setSystemLogs] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [metricsRes, logsRes] = await Promise.allSettled([
        api.adminGetMetrics(timeRange),
        api.adminGetSystemLogs(),
      ]);

      if (metricsRes.status === 'fulfilled' && metricsRes.value?.success) {
        setMetrics(metricsRes.value.kpis);
      }
      if (logsRes.status === 'fulfilled' && logsRes.value?.success) {
        setSystemLogs(logsRes.value.logs);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  return (
    <div className="space-y-6 pb-8 font-sans">
      {/* Header & Time Period Filters */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Overview</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            High-level system metrics and live device verification activity across the VerifyFlow network.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            title="Refresh Metrics"
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-slate-600 flex items-center justify-center transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <div className="flex items-center bg-slate-200/70 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            {(['today', '7d', '30d', '90d'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeRange === t
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t === 'today' ? 'Today' : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top 5 Bento KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Total Businesses */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-subtle hover:border-blue-300 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Total Businesses
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              {metrics.totalBusinesses}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Active directory</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Active Businesses */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-subtle hover:border-blue-300 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Active Stores
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              {metrics.activeBusinesses}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              <Activity className="w-3.5 h-3.5" />
              <span>Public lookup active</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Registered Devices */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-subtle hover:border-blue-300 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Registered Devices
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              {metrics.totalRegisteredPhones.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>IMEI secured</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Monthly Recurring Revenue (MRR) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-subtle hover:border-blue-300 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Active MRR
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              ₦{(metrics.calculatedMrr / 1000).toFixed(0)}k
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Subscription revenue</span>
            </div>
          </div>
        </div>

        {/* KPI 5: System Health */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-subtle hover:border-blue-300 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              System Health
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight mb-1">
              100%
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span>All clusters operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Verification Activity Chart Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-subtle">
        <VerificationActivityChart timeRange={timeRange} />
      </div>

      {/* Bottom Grid: Live System Logs & Quick Nav */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Activity Stream */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-subtle">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">System Activity Stream</h3>
              <p className="text-xs text-slate-400 font-medium">Real-time platform logs & transactions</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Feed
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {systemLogs.length > 0 ? (
              systemLogs.map((log, index) => (
                <div key={index} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        log.type === 'success'
                          ? 'bg-emerald-500'
                          : log.type === 'error'
                          ? 'bg-rose-500'
                          : log.type === 'warn'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <div>
                      <span className="font-mono font-bold text-slate-800">{log.code}</span>
                      {log.details && (
                        <p className="text-[11px] text-slate-500 font-medium">{log.details}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                    <span>{log.time}</span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        log.status === 'Success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'Failed'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                Awaiting incoming network events...
              </div>
            )}
          </div>
        </div>

        {/* Quick Admin Navigation Card */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-3">
              HQ Control Center
            </div>
            <h3 className="text-lg font-extrabold tracking-tight">Platform Operations</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Direct access to merchant subscriber controls, customer dispute tickets, and platform settings.
            </p>
          </div>

          <div className="space-y-2 mt-6">
            <Link
              href="/admin/businesses"
              className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold flex items-center justify-between transition border border-white/10"
            >
              <span>Manage Businesses</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>

            <Link
              href="/admin/subscriptions"
              className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold flex items-center justify-between transition border border-white/10"
            >
              <span>Subscription Plans</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>

            <Link
              href="/admin/support"
              className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold flex items-center justify-between transition border border-white/10"
            >
              <span>Support Desk</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
