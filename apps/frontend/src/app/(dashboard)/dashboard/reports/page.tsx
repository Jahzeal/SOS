'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  ShoppingCart,
  Users,
  Wrench,
  AlertTriangle,
  Clock,
  Zap,
  ChevronRight,
  Download,
  Smartphone,
  Tablet,
  Minus,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function AnalyticsReportsPage() {
  const [selectedRange, setSelectedRange] = useState('30_DAYS');
  const [reportsData, setReportsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getReports(selectedRange);
      setReportsData(data || null);
    } catch (err: any) {
      console.error('Failed to load analytics reports:', err);
      setError(err.message || 'Failed to load analytics reports.');
    } finally {
      setLoading(false);
    }
  }, [selectedRange]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const kpis = reportsData?.kpis || {};
  const topSellingModels = reportsData?.topSellingModels || [];
  const inventoryAgeing = reportsData?.inventoryAgeing || {};
  const repairBreakdown = reportsData?.repairBreakdown || {};

  const inventoryTotal = useMemo(() => {
    return (
      (inventoryAgeing.age0_30 || 0) +
      (inventoryAgeing.age31_60 || 0) +
      (inventoryAgeing.age61_90 || 0) +
      (inventoryAgeing.age90_plus || 0)
    );
  }, [inventoryAgeing]);

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8">

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 shrink-0" /> Analytics Dashboard
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 font-medium max-w-2xl mt-1 leading-relaxed">
            Understand your business performance, discover revenue trends, and make data-driven decisions.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center bg-white border border-slate-200 shadow-subtle rounded-xl px-3.5 py-2 gap-2 text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="7_DAYS">Last 7 Days</option>
              <option value="30_DAYS">Last 30 Days</option>
              <option value="90_DAYS">Last 90 Days</option>
              <option value="YEAR">This Year</option>
            </select>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => window.print()}
            leftIcon={<Download className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 font-bold"
          >
            Export
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="flex flex-col items-center justify-center gap-2 text-slate-400 font-semibold">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            Generating analytics reports...
          </div>
        </div>
      ) : error ? (
        <div className="py-16 text-center">
          <div className="flex flex-col items-center justify-center gap-2 text-rose-500 font-semibold">
            <AlertTriangle className="w-8 h-8" />
            {error}
          </div>
        </div>
      ) : (
        <>
          {/* Executive Summary: 6 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">

            {/* KPI 1 */}
            <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-subtle flex flex-col justify-between space-y-3">
              <div>
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Total Revenue</p>
                <h3 className="text-2xl font-extrabold text-blue-900 mt-1">
                  ₦{(kpis.totalRevenue || 0).toLocaleString()}
                </h3>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Sales & Repairs
                </span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-subtle flex flex-col justify-between space-y-3">
              <div>
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Total Sales</p>
                <h3 className="text-2xl font-extrabold text-blue-900 mt-1">{kpis.totalSalesCount || 0}</h3>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-emerald-600 flex items-center gap-0.5">
                  <ShoppingCart className="w-3.5 h-3.5" /> Completed
                </span>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-subtle flex flex-col justify-between space-y-3">
              <div>
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Devices Sold</p>
                <h3 className="text-2xl font-extrabold text-blue-900 mt-1">{kpis.devicesSoldCount || 0}</h3>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-emerald-600 flex items-center gap-0.5">
                  <Smartphone className="w-3.5 h-3.5" /> Units
                </span>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-subtle flex flex-col justify-between space-y-3">
              <div>
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Avg. Order Value</p>
                <h3 className="text-2xl font-extrabold text-blue-900 mt-1">
                  ₦{(kpis.avgOrderValue || 0).toLocaleString()}
                </h3>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 flex items-center gap-0.5">
                  <DollarSign className="w-3.5 h-3.5" /> Per Ticket
                </span>
              </div>
            </div>

            {/* KPI 5 */}
            <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-subtle flex flex-col justify-between space-y-3">
              <div>
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">New Customers</p>
                <h3 className="text-2xl font-extrabold text-blue-900 mt-1">{kpis.newCustomersCount || 0}</h3>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-emerald-600 flex items-center gap-0.5">
                  <Users className="w-3.5 h-3.5" /> Signups
                </span>
              </div>
            </div>

            {/* KPI 6 */}
            <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-subtle flex flex-col justify-between space-y-3">
              <div>
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Repair Revenue</p>
                <h3 className="text-2xl font-extrabold text-blue-900 mt-1">
                  ₦{(kpis.repairRevenue || 0).toLocaleString()}
                </h3>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-blue-600 flex items-center gap-0.5">
                  <Wrench className="w-3.5 h-3.5" /> Service
                </span>
              </div>
            </div>

          </div>

          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Column 1: Revenue & Product Table */}
            <div className="lg:col-span-2 space-y-6">

              {/* Revenue Breakdown Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-subtle space-y-4">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Revenue Volume & Distribution</h3>
                    <p className="text-xs text-slate-500 font-medium">Sales vs Service Repair Revenue Breakdown</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                      <span className="text-[10px] font-extrabold text-blue-700 uppercase">Sales</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                      <div className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase">Repairs</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600 uppercase">Direct Sales Revenue</span>
                    <span className="text-blue-600 font-mono font-extrabold">
                      ₦{(kpis.salesRevenue || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                      style={{
                        width: `${kpis.totalRevenue > 0 ? Math.min(100, Math.round((kpis.salesRevenue / kpis.totalRevenue) * 100)) : 100}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-xs font-bold pt-2">
                    <span className="text-slate-600 uppercase">Service Repair Revenue</span>
                    <span className="text-emerald-600 font-mono font-extrabold">
                      ₦{(kpis.repairRevenue || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-1000"
                      style={{
                        width: `${kpis.totalRevenue > 0 ? Math.min(100, Math.round((kpis.repairRevenue / kpis.totalRevenue) * 100)) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Top Selling Models Table */}
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-subtle overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-sm font-extrabold text-slate-900">Top Selling Device Models</h3>
                  <span className="text-xs font-bold text-slate-500">Live POS Sales Data</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 text-slate-500 uppercase tracking-wider font-mono text-[10px] border-b border-slate-200/80">
                      <tr>
                        <th className="px-4 py-3">Model Name</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3 text-center">Units Sold</th>
                        <th className="px-4 py-3 text-right">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {topSellingModels.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-10 text-center text-slate-400">
                            No sales recorded within selected time range.
                          </td>
                        </tr>
                      ) : (
                        topSellingModels.map((m: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 transition">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                  <Smartphone className="w-4 h-4" />
                                </div>
                                <span className="font-extrabold text-slate-900">{m.model}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-600">{m.category}</td>
                            <td className="px-4 py-3.5 font-mono font-bold text-center text-slate-900">{m.units}</td>
                            <td className="px-4 py-3.5 font-mono font-bold text-right text-slate-900">
                              ₦{m.revenue.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Column 2: Insights & Repair Status */}
            <div className="space-y-6">

              {/* Repair Performance Card */}
              <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-subtle space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900">Repair Ticket Status</h3>

                <div className="space-y-2 text-xs font-bold text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed / Ready
                    </span>
                    <span className="font-mono text-slate-900">{repairBreakdown.completed || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-blue-600" /> Pending / Diagnosing
                    </span>
                    <span className="font-mono text-slate-900">{repairBreakdown.pending || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> Delayed / Waiting
                    </span>
                    <span className="font-mono text-slate-900">{repairBreakdown.delayed || 0}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">Total Tickets</span>
                  <span className="text-blue-600 font-mono font-extrabold">{repairBreakdown.total || 0} Tickets</span>
                </div>
              </div>

            </div>

          </div>

          {/* Inventory Ageing Section */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-subtle space-y-6">
            <div className="flex justify-between items-end border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Inventory Ageing</h3>
                <p className="text-xs text-slate-500 font-medium">Stock valuation breakdown by days in inventory</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Value at Risk (90+ Days)</span>
                <p className="text-xl font-extrabold font-mono text-rose-600">
                  ₦{(inventoryAgeing.totalValueAtRisk || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600 uppercase">
                  <span>0-30 Days</span>
                  <span className="font-mono text-slate-900">
                    ₦{(inventoryAgeing.age0_30 || 0).toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-1000"
                    style={{
                      width: `${inventoryTotal > 0 ? Math.round(((inventoryAgeing.age0_30 || 0) / inventoryTotal) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600 uppercase">
                  <span>31-60 Days</span>
                  <span className="font-mono text-slate-900">
                    ₦{(inventoryAgeing.age31_60 || 0).toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                    style={{
                      width: `${inventoryTotal > 0 ? Math.round(((inventoryAgeing.age31_60 || 0) / inventoryTotal) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600 uppercase">
                  <span>61-90 Days</span>
                  <span className="font-mono text-slate-900">
                    ₦{(inventoryAgeing.age61_90 || 0).toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                    style={{
                      width: `${inventoryTotal > 0 ? Math.round(((inventoryAgeing.age61_90 || 0) / inventoryTotal) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600 uppercase">
                  <span>90+ Days</span>
                  <span className="font-mono text-rose-600">
                    ₦{(inventoryAgeing.age90_plus || 0).toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-600 rounded-full transition-all duration-1000"
                    style={{
                      width: `${inventoryTotal > 0 ? Math.round(((inventoryAgeing.age90_plus || 0) / inventoryTotal) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

        </>
      )}

    </div>
  );
}
