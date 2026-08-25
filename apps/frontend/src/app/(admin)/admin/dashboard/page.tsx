'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Clock,
  AlertTriangle,
  Info,
} from 'lucide-react';

export default function AdminOverviewDashboard() {
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | '90d'>('today');

  const systemLogs = [
    { time: '10:42:01 AM', code: 'AUTH_REQ_B2B', status: 'Success', type: 'success' },
    { time: '10:41:15 AM', code: 'DEV_SYNC_ERR', status: 'Failed', type: 'error' },
    { time: '10:39:55 AM', code: 'API_RATE_WARN', status: 'Warn', type: 'warn' },
    { time: '10:35:20 AM', code: 'NODE_RESTART', status: 'Info', type: 'info' },
    { time: '10:30:00 AM', code: 'DB_BACKUP_OK', status: 'Success', type: 'success' },
    { time: '10:28:05 AM', code: 'AUTH_REQ_B2B', status: 'Success', type: 'success' },
  ];

  const chartData = [
    { label: 'Mon', verified: 65, notFound: 15, invalid: 5 },
    { label: 'Tue', verified: 45, notFound: 12, invalid: 3 },
    { label: 'Wed', verified: 80, notFound: 18, invalid: 6 },
    { label: 'Thu', verified: 95, notFound: 22, invalid: 8 },
    { label: 'Fri', verified: 55, notFound: 14, invalid: 4 },
    { label: 'Sat', verified: 70, notFound: 16, invalid: 5 },
    { label: 'Sun', verified: 85, notFound: 19, invalid: 7 },
  ];

  return (
    <div className="space-y-6 pb-8 font-sans">
      {/* Header & Time Period Filters */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Overview</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            High-level system metrics and recent verification activity across the VerifyFlow network.
          </p>
        </div>

        <div className="flex items-center bg-slate-200/70 p-1 rounded-xl border border-slate-200 self-start sm:self-auto text-xs font-bold">
          <button
            onClick={() => setTimeRange('today')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timeRange === 'today'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80 font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timeRange === '7d'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80 font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            7d
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timeRange === '30d'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80 font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            30d
          </button>
          <button
            onClick={() => setTimeRange('90d')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timeRange === '90d'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80 font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            90d
          </button>
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
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">12,450</div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+2.4% vs last period</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Active Businesses */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-subtle hover:border-blue-300 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Active Businesses
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">8,921</div>
            <div className="text-[11px] font-semibold text-slate-500">
              71.6% activation rate
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
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">34,102</div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+120 this week</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Verifications (Today) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-subtle hover:border-blue-300 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Verifications (Today)
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">142,880</div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>-1.2% vs yesterday</span>
            </div>
          </div>
        </div>

        {/* KPI 5: Monthly Revenue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-subtle hover:border-blue-300 transition-colors sm:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Monthly Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1 flex items-baseline">
              <span className="text-lg font-bold text-slate-500 mr-1">₦</span>
              <span className="font-mono">45.2M</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>On track for target</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area (Chart + Recent Activity Table) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Verification Activity Chart Area */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-subtle flex flex-col min-h-[420px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Verification Activity</h3>
              <p className="text-xs text-slate-500 font-medium">Daily lookup traffic by result type</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="text-slate-700">Verified (78%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-700">Not Found (18%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-700">Invalid (4%)</span>
              </div>
            </div>
          </div>

          {/* Interactive CSS Bar Chart Visualizer */}
          <div className="flex-1 rounded-xl bg-slate-50 border border-slate-100 p-6 flex flex-col justify-between relative overflow-hidden"
            style={{
              backgroundImage: 'linear-gradient(to right, #eceef0 1px, transparent 1px), linear-gradient(to bottom, #eceef0 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          >
            <div className="flex-1 flex items-end justify-around gap-3 pt-6 z-10">
              {chartData.map((item) => (
                <div key={item.label} className="flex-1 flex flex-col items-center gap-2 max-w-[50px] group">
                  <div className="w-full flex flex-col-reverse items-center gap-1 h-[220px] justify-start">
                    {/* Verified portion */}
                    <div
                      style={{ height: `${item.verified}%` }}
                      className="w-full bg-blue-600 rounded-t-md transition-all duration-300 group-hover:bg-blue-500 shadow-sm relative"
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-slate-900 text-white text-[10px] font-mono rounded pointer-events-none transition">
                        {item.verified * 150}
                      </span>
                    </div>
                    {/* Not Found portion */}
                    <div
                      style={{ height: `${item.notFound}%` }}
                      className="w-full bg-amber-400 rounded-t-sm transition-all duration-300 opacity-90"
                    />
                    {/* Invalid portion */}
                    <div
                      style={{ height: `${item.invalid}%` }}
                      className="w-full bg-rose-500 rounded-t-sm transition-all duration-300 opacity-90"
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-slate-900">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dense Recent System Activity Table */}
        <div className="xl:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Recent System Logs</h3>
                <p className="text-xs text-slate-500 font-medium">Real-time platform event stream</p>
              </div>
              <Link
                href="/admin/audit-logs"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                View All →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-mono text-[11px] border-b border-slate-100">
                    <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                    <th className="py-2.5 px-3 font-semibold">Event Code</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {systemLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.time}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 text-[11px]">
                        {log.code}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            log.type === 'success'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : log.type === 'error'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : log.type === 'warn'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> All Systems Operational
            </span>
            <Link href="/admin/audit-logs" className="text-blue-600 font-bold hover:underline">
              Inspect Audit Log
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
