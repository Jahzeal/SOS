'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  Line,
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
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  EyeOff,
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

// Sample time-series data for each time range
const DATA_BY_RANGE: Record<TimeRange, DataPoint[]> = {
  today: [
    { label: '00:00', verified: 320, notFound: 45, invalid: 12, total: 377, successRate: 84.9 },
    { label: '03:00', verified: 180, notFound: 28, invalid: 8, total: 216, successRate: 83.3 },
    { label: '06:00', verified: 490, notFound: 82, invalid: 18, total: 590, successRate: 83.1 },
    { label: '09:00', verified: 1450, notFound: 210, invalid: 64, total: 1724, successRate: 84.1 },
    { label: '12:00', verified: 2100, notFound: 340, invalid: 92, total: 2532, successRate: 82.9 },
    { label: '15:00', verified: 1890, notFound: 290, invalid: 75, total: 2255, successRate: 83.8 },
    { label: '18:00', verified: 1620, notFound: 230, invalid: 58, total: 1908, successRate: 84.9 },
    { label: '21:00', verified: 980, notFound: 140, invalid: 32, total: 1152, successRate: 85.1 },
  ],
  '7d': [
    { label: 'Mon', verified: 6850, notFound: 1120, invalid: 310, total: 8280, successRate: 82.7 },
    { label: 'Tue', verified: 7420, notFound: 1250, invalid: 290, total: 8960, successRate: 82.8 },
    { label: 'Wed', verified: 8910, notFound: 1480, invalid: 410, total: 10800, successRate: 82.5 },
    { label: 'Thu', verified: 9650, notFound: 1610, invalid: 480, total: 11740, successRate: 82.2 },
    { label: 'Fri', verified: 10820, notFound: 1790, invalid: 530, total: 13140, successRate: 82.3 },
    { label: 'Sat', verified: 6120, notFound: 980, invalid: 240, total: 7340, successRate: 83.4 },
    { label: 'Sun', verified: 5430, notFound: 840, invalid: 190, total: 6460, successRate: 84.1 },
  ],
  '30d': [
    { label: 'Week 1', verified: 45200, notFound: 7600, invalid: 2100, total: 54900, successRate: 82.3 },
    { label: 'Week 2', verified: 51300, notFound: 8400, invalid: 2350, total: 62050, successRate: 82.7 },
    { label: 'Week 3', verified: 58900, notFound: 9800, invalid: 2800, total: 71500, successRate: 82.4 },
    { label: 'Week 4', verified: 62400, notFound: 10100, invalid: 2950, total: 75450, successRate: 82.7 },
  ],
  '90d': [
    { label: 'Month 1', verified: 198000, notFound: 32000, invalid: 8900, total: 238900, successRate: 82.9 },
    { label: 'Month 2', verified: 224000, notFound: 36500, invalid: 10200, total: 270700, successRate: 82.7 },
    { label: 'Month 3', verified: 256000, notFound: 41200, invalid: 11400, total: 308600, successRate: 83.0 },
  ],
};

export default function VerificationActivityChart({ timeRange }: VerificationActivityChartProps) {
  const [viewType, setViewType] = useState<ChartViewType>('stacked');
  const [activeSeries, setActiveSeries] = useState({
    verified: true,
    notFound: true,
    invalid: true,
  });

  const rawData = DATA_BY_RANGE[timeRange] || DATA_BY_RANGE['7d'];

  // Calculate high-level summary KPIs for this timeframe
  const metrics = useMemo(() => {
    const totalVerified = rawData.reduce((sum, d) => sum + d.verified, 0);
    const totalNotFound = rawData.reduce((sum, d) => sum + d.notFound, 0);
    const totalInvalid = rawData.reduce((sum, d) => sum + d.invalid, 0);
    const totalLookups = totalVerified + totalNotFound + totalInvalid;
    const avgSuccessRate = totalLookups > 0 ? ((totalVerified / totalLookups) * 100).toFixed(1) : '0';

    let peakPoint = rawData[0];
    for (const d of rawData) {
      if (d.total > (peakPoint?.total || 0)) {
        peakPoint = d;
      }
    }

    return {
      totalLookups,
      totalVerified,
      totalNotFound,
      totalInvalid,
      avgSuccessRate,
      peakLabel: peakPoint?.label || '',
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
    return num.toLocaleString();
  };

  // Custom Glassmorphism Rich Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload as DataPoint;
    if (!data) return null;

    const total = data.verified + data.notFound + data.invalid;

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
                <span>{data.verified.toLocaleString()}</span>
                <span className="text-slate-400 text-[10px] font-normal">
                  ({total > 0 ? ((data.verified / total) * 100).toFixed(0) : 0}%)
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
                <span className="text-amber-300">{data.notFound.toLocaleString()}</span>
                <span className="text-slate-400 text-[10px] font-normal">
                  ({total > 0 ? ((data.notFound / total) * 100).toFixed(0) : 0}%)
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
                <span className="text-rose-400">{data.invalid.toLocaleString()}</span>
                <span className="text-slate-400 text-[10px] font-normal">
                  ({total > 0 ? ((data.invalid / total) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-[11px] font-bold text-slate-300">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Success Rate:
            </span>
            <span className="text-emerald-400 font-mono font-extrabold">{data.successRate}%</span>
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
              Live Flow
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Total traffic breakdown & verification outcome distribution
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80 self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setViewType('stacked')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
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
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
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
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
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

      {/* Mini KPI Highlights Bar */}
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
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-tight">Peak Period</span>
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
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
              activeSeries.verified
                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs'
                : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>Verified</span>
            {activeSeries.verified ? <Eye className="w-3 h-3 ml-0.5 opacity-60" /> : <EyeOff className="w-3 h-3 ml-0.5" />}
          </button>

          <button
            onClick={() => toggleSeries('notFound')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
              activeSeries.notFound
                ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-xs'
                : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Not Found</span>
            {activeSeries.notFound ? <Eye className="w-3 h-3 ml-0.5 opacity-60" /> : <EyeOff className="w-3 h-3 ml-0.5" />}
          </button>

          <button
            onClick={() => toggleSeries('invalid')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
              activeSeries.invalid
                ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs'
                : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Invalid</span>
            {activeSeries.invalid ? <Eye className="w-3 h-3 ml-0.5 opacity-60" /> : <EyeOff className="w-3 h-3 ml-0.5" />}
          </button>
        </div>

        <span className="text-[11px] font-medium text-slate-400 italic">
          Click series to toggle visibility
        </span>
      </div>

      {/* SVG Canvas Container */}
      <div className="flex-1 w-full min-h-[300px] bg-slate-50/70 border border-slate-100 rounded-xl p-3 relative">
        <ResponsiveContainer width="100%" height="100%">
          {viewType === 'stacked' ? (
            <BarChart data={rawData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={formatNumber}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              />
              <Tooltip content={<CustomTooltip />} />
              {activeSeries.invalid && (
                <Bar
                  dataKey="invalid"
                  name="Invalid"
                  stackId="traffic"
                  fill="#f43f5e"
                  radius={[0, 0, 0, 0]}
                />
              )}
              {activeSeries.notFound && (
                <Bar
                  dataKey="notFound"
                  name="Not Found"
                  stackId="traffic"
                  fill="#f59e0b"
                  radius={[0, 0, 0, 0]}
                />
              )}
              {activeSeries.verified && (
                <Bar
                  dataKey="verified"
                  name="Verified"
                  stackId="traffic"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                />
              )}
            </BarChart>
          ) : viewType === 'area' ? (
            <AreaChart data={rawData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="verifiedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="notFoundAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="invalidAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={formatNumber}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              />
              <Tooltip content={<CustomTooltip />} />
              {activeSeries.verified && (
                <Area
                  type="monotone"
                  dataKey="verified"
                  name="Verified"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#verifiedAreaGrad)"
                />
              )}
              {activeSeries.notFound && (
                <Area
                  type="monotone"
                  dataKey="notFound"
                  name="Not Found"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#notFoundAreaGrad)"
                />
              )}
              {activeSeries.invalid && (
                <Area
                  type="monotone"
                  dataKey="invalid"
                  name="Invalid"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#invalidAreaGrad)"
                />
              )}
            </AreaChart>
          ) : (
            <ComposedChart data={rawData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tickFormatter={formatNumber}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[50, 100]}
                unit="%"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#10b981', fontSize: 11, fontWeight: 700 }}
              />
              <Tooltip content={<CustomTooltip />} />
              {activeSeries.invalid && (
                <Bar
                  yAxisId="left"
                  dataKey="invalid"
                  name="Invalid"
                  stackId="traffic"
                  fill="#f43f5e"
                  radius={[0, 0, 0, 0]}
                />
              )}
              {activeSeries.notFound && (
                <Bar
                  yAxisId="left"
                  dataKey="notFound"
                  name="Not Found"
                  stackId="traffic"
                  fill="#f59e0b"
                  radius={[0, 0, 0, 0]}
                />
              )}
              {activeSeries.verified && (
                <Bar
                  yAxisId="left"
                  dataKey="verified"
                  name="Verified"
                  stackId="traffic"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                />
              )}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="successRate"
                name="Success Rate %"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: '#059669' }}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
