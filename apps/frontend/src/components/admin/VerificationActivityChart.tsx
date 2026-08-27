'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Percent,
  Sparkles,
} from 'lucide-react';

export type TimeRange = 'today' | '7d' | '30d' | '90d';
export type ChartViewType = 'stacked' | 'area' | 'composed';

interface VerificationActivityChartProps {
  timeRange: TimeRange;
}

interface DataPoint {
  label: string;
  verified: number;
  notFound: number;
  invalid: number;
  total: number;
  successRate: number;
}

const getEmptyBuckets = (timeRange: TimeRange): DataPoint[] => {
  if (timeRange === 'today') {
    return ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'].map((label) => ({
      label,
      verified: 0,
      notFound: 0,
      invalid: 0,
      total: 0,
      successRate: 100,
    }));
  }
  if (timeRange === '7d') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const buckets: DataPoint[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      buckets.push({
        label: days[d.getDay()],
        verified: 0,
        notFound: 0,
        invalid: 0,
        total: 0,
        successRate: 100,
      });
    }
    return buckets;
  }
  if (timeRange === '30d') {
    return ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((label) => ({
      label,
      verified: 0,
      notFound: 0,
      invalid: 0,
      total: 0,
      successRate: 100,
    }));
  }
  return ['Month 1', 'Month 2', 'Month 3'].map((label) => ({
    label,
    verified: 0,
    notFound: 0,
    invalid: 0,
    total: 0,
    successRate: 100,
  }));
};

export default function VerificationActivityChart({ timeRange }: VerificationActivityChartProps) {
  const [viewType, setViewType] = useState<ChartViewType>('stacked');
  const [liveData, setLiveData] = useState<DataPoint[]>(getEmptyBuckets(timeRange));
  const [loading, setLoading] = useState(false);
  const [activeSeries, setActiveSeries] = useState({
    verified: true,
    notFound: true,
    invalid: true,
  });

  useEffect(() => {
    async function loadTraffic() {
      setLoading(true);
      try {
        const res = await api.adminGetVerificationTraffic(timeRange);
        if (res?.success && Array.isArray(res.data)) {
          setLiveData(res.data);
        } else {
          setLiveData(getEmptyBuckets(timeRange));
        }
      } catch (err) {
        console.error('Failed to load live traffic chart:', err);
        setLiveData(getEmptyBuckets(timeRange));
      } finally {
        setLoading(false);
      }
    }
    loadTraffic();
  }, [timeRange]);

  const rawData = liveData;

  // Calculate high-level summary KPIs for this timeframe (100% Real DB)
  const metrics = useMemo(() => {
    const totalVerified = rawData.reduce((sum, d) => sum + (d.verified || 0), 0);
    const totalNotFound = rawData.reduce((sum, d) => sum + (d.notFound || 0), 0);
    const totalInvalid = rawData.reduce((sum, d) => sum + (d.invalid || 0), 0);
    const totalLookups = totalVerified + totalNotFound + totalInvalid;
    const avgSuccessRate = totalLookups > 0 ? ((totalVerified / totalLookups) * 100).toFixed(1) : '100';

    let peakPoint = rawData[0];
    for (const d of rawData) {
      if ((d.total || 0) > (peakPoint?.total || 0)) {
        peakPoint = d;
      }
    }

    return {
      totalLookups,
      totalVerified,
      totalNotFound,
      totalInvalid,
      avgSuccessRate,
      peakLabel: peakPoint?.label || 'None',
      peakTotal: peakPoint?.total || 0,
    };
  }, [rawData]);

  const toggleSeries = (key: 'verified' | 'notFound' | 'invalid') => {
    const activeCount = Object.values(activeSeries).filter(Boolean).length;
    if (activeCount === 1 && activeSeries[key]) return;

    setActiveSeries((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
    return (num || 0).toLocaleString();
  };

  // Custom Glassmorphism Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload as DataPoint;
    if (!data) return null;

    const total = (data.verified || 0) + (data.notFound || 0) + (data.invalid || 0);

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-2xl border border-slate-700/80 min-w-[210px] text-xs font-sans animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2.5">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            {timeRange === 'today' ? `Time: ${label}` : `Period: ${label}`}
          </span>
          <span className="font-mono text-[11px] font-bold text-blue-400 bg-blue-950/80 border border-blue-800/60 px-1.5 py-0.5 rounded">
            {formatNumber(total)} lookups
          </span>
        </div>

        <div className="space-y-2">
          {activeSeries.verified && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" />
                <span className="text-slate-300">Verified</span>
              </div>
              <div className="font-mono flex items-center gap-1.5 font-bold">
                <span>{(data.verified || 0).toLocaleString()}</span>
                <span className="text-slate-400 text-[10px] font-normal">
                  ({total > 0 ? (((data.verified || 0) / total) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </div>
          )}

          {activeSeries.notFound && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm" />
                <span className="text-slate-300">Not Found</span>
              </div>
              <div className="font-mono flex items-center gap-1.5 font-bold">
                <span className="text-amber-300">{(data.notFound || 0).toLocaleString()}</span>
                <span className="text-slate-400 text-[10px] font-normal">
                  ({total > 0 ? (((data.notFound || 0) / total) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </div>
          )}

          {activeSeries.invalid && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
                <span className="text-slate-300">Invalid</span>
              </div>
              <div className="font-mono flex items-center gap-1.5 font-bold">
                <span className="text-rose-400">{(data.invalid || 0).toLocaleString()}</span>
                <span className="text-slate-400 text-[10px] font-normal">
                  ({total > 0 ? (((data.invalid || 0) / total) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-[11px] font-bold text-slate-300">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Success Rate:
            </span>
            <span className="text-emerald-400 font-mono font-extrabold">{data.successRate || 100}%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Chart Top Header & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900">Verification Activity</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
              Live DB Flow
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Total traffic breakdown & verification outcome distribution from PostgreSQL ledger.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80 self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setViewType('stacked')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              viewType === 'stacked'
                ? 'bg-white text-blue-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Stacked Volume Bars"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Volume Bars</span>
          </button>

          <button
            onClick={() => setViewType('area')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              viewType === 'area'
                ? 'bg-white text-blue-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Continuous Area Trend"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Trend Flow</span>
          </button>

          <button
            onClick={() => setViewType('composed')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              viewType === 'composed'
                ? 'bg-white text-blue-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Volume with Success Rate Line"
          >
            <Percent className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rate Overlay</span>
          </button>
        </div>
      </div>

      {/* Mini KPI Highlights Bar (100% Real DB Data) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-1">
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Total Volume</span>
          <span className="text-lg font-extrabold text-slate-900 font-mono mt-0.5">
            {formatNumber(metrics.totalLookups)}
          </span>
        </div>

        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-tight">Verified Rate</span>
          <span className="text-lg font-extrabold text-blue-700 font-mono mt-0.5">
            {metrics.avgSuccessRate}%
          </span>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-tight">Unresolved</span>
          <span className="text-lg font-extrabold text-amber-700 font-mono mt-0.5">
            {formatNumber(metrics.totalNotFound)}
          </span>
        </div>

        <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-tight">Peak Activity</span>
          <span className="text-sm font-extrabold text-slate-900 font-mono mt-1 truncate">
            {metrics.peakLabel} ({formatNumber(metrics.peakTotal)})
          </span>
        </div>
      </div>

      {/* Interactive Legend / Filter Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
          <button
            onClick={() => toggleSeries('verified')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-all cursor-pointer ${
              activeSeries.verified
                ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Verified Genuine ({formatNumber(metrics.totalVerified)})</span>
          </button>

          <button
            onClick={() => toggleSeries('notFound')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-all cursor-pointer ${
              activeSeries.notFound
                ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Not Found ({formatNumber(metrics.totalNotFound)})</span>
          </button>

          <button
            onClick={() => toggleSeries('invalid')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-all cursor-pointer ${
              activeSeries.invalid
                ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Flagged/Stolen ({formatNumber(metrics.totalInvalid)})</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="w-full h-64 sm:h-72 relative">
        <ResponsiveContainer width="100%" height="100%">
          {viewType === 'stacked' ? (
            <BarChart data={rawData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={formatNumber}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />
              {activeSeries.verified && (
                <Bar dataKey="verified" name="Verified" stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
              )}
              {activeSeries.notFound && (
                <Bar dataKey="notFound" name="Not Found" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              )}
              {activeSeries.invalid && (
                <Bar dataKey="invalid" name="Invalid" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          ) : viewType === 'area' ? (
            <AreaChart data={rawData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorNotFound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorInvalid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={formatNumber}
              />
              <Tooltip content={<CustomTooltip />} />
              {activeSeries.verified && (
                <Area
                  type="monotone"
                  dataKey="verified"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorVerified)"
                />
              )}
              {activeSeries.notFound && (
                <Area
                  type="monotone"
                  dataKey="notFound"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorNotFound)"
                />
              )}
              {activeSeries.invalid && (
                <Area
                  type="monotone"
                  dataKey="invalid"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorInvalid)"
                />
              )}
            </AreaChart>
          ) : (
            <ComposedChart data={rawData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={formatNumber}
              />
              <Tooltip content={<CustomTooltip />} />
              {activeSeries.verified && (
                <Bar dataKey="verified" stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
              )}
              {activeSeries.notFound && (
                <Bar dataKey="notFound" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              )}
              {activeSeries.invalid && (
                <Bar dataKey="invalid" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              )}
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
