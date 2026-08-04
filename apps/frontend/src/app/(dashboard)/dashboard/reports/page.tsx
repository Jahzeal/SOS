'use client';

import React, { useState } from 'react';
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
  Star,
  Clock,
  Zap,
  ChevronRight,
  Download,
  Filter,
  Sparkles,
  Smartphone,
  Tablet,
  Minus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Search,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AnalyticsReportsPage() {
  const [selectedRange, setSelectedRange] = useState('30_DAYS');

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8">
      
      {/* ========================================================= */}
      {/* DESKTOP VIEW (hidden md:block)                            */}
      {/* ========================================================= */}
      <div className="hidden md:block space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <nav className="flex items-center text-xs font-semibold text-slate-500 gap-1 mb-1">
              <Link href="/dashboard" className="hover:text-slate-900 transition">Dashboard</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-blue-600 font-bold">Analytics</span>
            </nav>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
              <BarChart3 className="w-8 h-8 text-blue-600" /> Analytics Dashboard
            </h1>
            <p className="text-sm text-slate-500 font-medium max-w-2xl mt-1 leading-relaxed">
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
                <option value="YEAR">This Year (2026)</option>
              </select>
            </div>

            <Button
              variant="primary"
              size="md"
              leftIcon={<Download className="w-4 h-4" />}
              className="bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 font-bold"
            >
              Export
            </Button>
          </div>
        </div>

        {/* Executive Summary: 6 KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
          
          {/* KPI 1 */}
          <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-subtle flex flex-col justify-between space-y-3">
            <div>
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-2xl font-extrabold text-blue-900 mt-1">$142.5k</h3>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> 12%
              </span>
              <div className="w-10 h-5 flex items-end gap-1">
                <div className="bg-emerald-200 w-1.5 rounded-t-full h-[40%]" />
                <div className="bg-emerald-200 w-1.5 rounded-t-full h-[60%]" />
                <div className="bg-emerald-600 w-1.5 rounded-t-full h-[90%]" />
              </div>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-subtle flex flex-col justify-between space-y-3">
            <div>
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Total Sales</p>
              <h3 className="text-2xl font-extrabold text-blue-900 mt-1">842</h3>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> 8%
              </span>
              <div className="w-10 h-5 flex items-end gap-1">
                <div className="bg-emerald-200 w-1.5 rounded-t-full h-[30%]" />
                <div className="bg-emerald-600 w-1.5 rounded-t-full h-[65%]" />
                <div className="bg-emerald-200 w-1.5 rounded-t-full h-[45%]" />
              </div>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-subtle flex flex-col justify-between space-y-3">
            <div>
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Devices Sold</p>
              <h3 className="text-2xl font-extrabold text-blue-900 mt-1">612</h3>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> 15%
              </span>
              <div className="w-10 h-5 flex items-end gap-1">
                <div className="bg-emerald-200 w-1.5 rounded-t-full h-[20%]" />
                <div className="bg-emerald-200 w-1.5 rounded-t-full h-[50%]" />
                <div className="bg-emerald-600 w-1.5 rounded-t-full h-[95%]" />
              </div>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-subtle flex flex-col justify-between space-y-3">
            <div>
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Avg. Order</p>
              <h3 className="text-2xl font-extrabold text-blue-900 mt-1">$232</h3>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-500 flex items-center gap-0.5">
                <Minus className="w-3.5 h-3.5" /> 0%
              </span>
              <div className="w-10 h-5 flex items-end gap-1">
                <div className="bg-slate-300 w-1.5 rounded-t-full h-[50%]" />
                <div className="bg-slate-300 w-1.5 rounded-t-full h-[50%]" />
                <div className="bg-slate-300 w-1.5 rounded-t-full h-[50%]" />
              </div>
            </div>
          </div>

          {/* KPI 5 */}
          <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-subtle flex flex-col justify-between space-y-3">
            <div>
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">New Customers</p>
              <h3 className="text-2xl font-extrabold text-blue-900 mt-1">124</h3>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> 4%
              </span>
              <div className="w-10 h-5 flex items-end gap-1">
                <div className="bg-emerald-200 w-1.5 rounded-t-full h-[30%]" />
                <div className="bg-emerald-200 w-1.5 rounded-t-full h-[45%]" />
                <div className="bg-emerald-600 w-1.5 rounded-t-full h-[60%]" />
              </div>
            </div>
          </div>

          {/* KPI 6 */}
          <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-subtle flex flex-col justify-between space-y-3">
            <div>
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Repair Revenue</p>
              <h3 className="text-2xl font-extrabold text-blue-900 mt-1">$12.4k</h3>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-rose-600 flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" /> 2%
              </span>
              <div className="w-10 h-5 flex items-end gap-1">
                <div className="bg-rose-200 w-1.5 rounded-t-full h-[60%]" />
                <div className="bg-rose-200 w-1.5 rounded-t-full h-[50%]" />
                <div className="bg-rose-600 w-1.5 rounded-t-full h-[40%]" />
              </div>
            </div>
          </div>

        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Revenue & Product Table (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Revenue Trend Chart */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-subtle space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Revenue Trend</h3>
                  <p className="text-xs text-slate-500 font-medium">Daily volume of sales and repairs over time</p>
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

              {/* Chart Area */}
              <div className="h-64 w-full relative bg-gradient-to-b from-blue-50/50 to-transparent rounded-xl flex items-end px-4 gap-4 border border-slate-100 pt-4">
                <div className="flex-1 bg-blue-600/40 rounded-t-lg h-[40%] hover:bg-blue-600 transition" title="Week 1" />
                <div className="flex-1 bg-blue-600/40 rounded-t-lg h-[60%] hover:bg-blue-600 transition" title="Week 2" />
                <div className="flex-1 bg-blue-600/40 rounded-t-lg h-[55%] hover:bg-blue-600 transition" title="Week 3" />
                <div className="flex-1 bg-blue-600/60 rounded-t-lg h-[75%] hover:bg-blue-600 transition" title="Week 4" />
                <div className="flex-1 bg-blue-600/40 rounded-t-lg h-[65%] hover:bg-blue-600 transition" title="Week 5" />
                <div className="flex-1 bg-blue-600/40 rounded-t-lg h-[85%] hover:bg-blue-600 transition" title="Week 6" />
                <div className="flex-1 bg-blue-600 rounded-t-lg h-[95%] shadow-md" title="Current Week" />
              </div>
            </div>

            {/* Top Selling Models Table */}
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-subtle overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-sm font-extrabold text-slate-900">Top Selling Models</h3>
                <button className="text-xs font-bold text-blue-600 hover:text-blue-700">View All</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 text-slate-500 uppercase tracking-wider font-mono text-[10px] border-b border-slate-200/80">
                    <tr>
                      <th className="px-4 py-3">Model Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Units Sold</th>
                      <th className="px-4 py-3">Revenue</th>
                      <th className="px-4 py-3 text-right">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Smartphone className="w-4 h-4" />
                          </div>
                          <span className="font-extrabold text-slate-900">iPhone 15 Pro Max</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">Smartphone</td>
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">248</td>
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">$54,200</td>
                      <td className="px-4 py-3.5 text-right text-emerald-600">
                        <TrendingUp className="w-4 h-4 ml-auto" />
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Smartphone className="w-4 h-4" />
                          </div>
                          <span className="font-extrabold text-slate-900">Samsung S24 Ultra</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">Smartphone</td>
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">182</td>
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">$38,400</td>
                      <td className="px-4 py-3.5 text-right text-emerald-600">
                        <TrendingUp className="w-4 h-4 ml-auto" />
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <Tablet className="w-4 h-4" />
                          </div>
                          <span className="font-extrabold text-slate-900">iPad Air M2</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">Tablet</td>
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">92</td>
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">$12,800</td>
                      <td className="px-4 py-3.5 text-right text-rose-600">
                        <TrendingDown className="w-4 h-4 ml-auto" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Column 2: Insights & Performance (1 col) */}
          <div className="space-y-6">
            
            {/* AI Insights Card */}
            <div className="bg-slate-900 p-5 rounded-2xl text-white shadow-md space-y-4 border border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">AI Insights</h3>
              </div>
              <p className="text-xs text-slate-400">Actionable trends detected by VerifyFlow's engine.</p>
              
              <div className="space-y-2.5">
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm space-y-0.5">
                  <p className="text-xs font-extrabold text-emerald-400">Top Performance</p>
                  <p className="text-[11px] text-slate-200 leading-relaxed">
                    iPhone 15 is your fastest-moving asset, turnover in &lt;4 days.
                  </p>
                </div>

                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border-l-4 border-amber-400 space-y-0.5">
                  <p className="text-xs font-extrabold text-amber-400">Inventory Alert</p>
                  <p className="text-[11px] text-slate-200 leading-relaxed">
                    18 items aging 90+ days. Consider discounting to free up capital.
                  </p>
                </div>
              </div>
            </div>

            {/* Busiest Day */}
            <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-extrabold uppercase">
                <span>Busiest Day</span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="text-2xl font-extrabold text-slate-900">Saturday</h4>
              <p className="text-xs text-slate-500 font-medium">24% higher volume than weekly average.</p>
            </div>

            {/* Repair Performance Donut */}
            <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-subtle space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900">Repair Status</h3>
              
              <div className="flex items-center gap-4">
                {/* SVG Donut Chart */}
                <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="40" cy="40" r="32" fill="transparent" stroke="#f1f5f9" strokeWidth="7" />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      fill="transparent"
                      stroke="#2563eb"
                      strokeDasharray="201"
                      strokeDashoffset="50"
                      strokeWidth="7"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono text-xs font-extrabold text-slate-900">75%</span>
                  </div>
                </div>

                <div className="flex-1 space-y-2 text-xs font-bold text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-blue-600" /> Completed
                    </span>
                    <span className="font-mono text-slate-900">412</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Pending
                    </span>
                    <span className="font-mono text-slate-900">82</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> Delayed
                    </span>
                    <span className="font-mono text-slate-900">14</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold">Avg. Repair Time</span>
                <span className="text-blue-600 font-mono font-extrabold">1.2 Days</span>
              </div>
            </div>

          </div>

        </div>

        {/* Inventory Ageing Section */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-subtle space-y-6">
          <div className="flex justify-between items-end border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Inventory Ageing</h3>
              <p className="text-xs text-slate-500 font-medium">Breakdown of stock duration in inventory</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">Total Value at Risk</span>
              <p className="text-xl font-extrabold font-mono text-rose-600">$18,450</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-600 uppercase">
                <span>0-30 Days</span>
                <span className="font-mono text-slate-900">$124k (65%)</span>
              </div>
              <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 w-[65%] rounded-full transition-all duration-1000" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-600 uppercase">
                <span>31-60 Days</span>
                <span className="font-mono text-slate-900">$42k (20%)</span>
              </div>
              <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 w-[20%] rounded-full transition-all duration-1000" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-600 uppercase">
                <span>61-90 Days</span>
                <span className="font-mono text-slate-900">$12k (10%)</span>
              </div>
              <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-[10%] rounded-full transition-all duration-1000" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-600 uppercase">
                <span>90+ Days</span>
                <span className="font-mono text-rose-600">$8k (5%)</span>
              </div>
              <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-600 w-[5%] rounded-full transition-all duration-1000" />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* MOBILE VIEW (block md:hidden)                             */}
      {/* ========================================================= */}
      <div className="block md:hidden space-y-5">
        
        {/* Mobile Page Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900">Analytics</h1>
          <p className="text-xs text-slate-500 font-medium">Understand business performance, trends & insights.</p>
        </div>

        {/* Global Date Selector */}
        <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="font-extrabold text-slate-900">Last 30 Days</span>
          </div>
          <div className="flex items-center gap-1 font-mono font-bold text-emerald-600">
            <span>+12.4%</span>
            <span className="text-[10px] text-slate-400 font-sans font-medium">vs prev.</span>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="space-y-3">
          {/* Revenue Card */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Revenue</p>
                <p className="text-2xl font-extrabold text-blue-900 mt-0.5">$142.5k</p>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> +12%
              </span>
            </div>
            
            <div className="h-10 w-full flex items-end gap-1 pt-1">
              <div className="flex-1 bg-blue-100 h-[40%] rounded-t-sm" />
              <div className="flex-1 bg-blue-200 h-[60%] rounded-t-sm" />
              <div className="flex-1 bg-blue-300 h-[55%] rounded-t-sm" />
              <div className="flex-1 bg-blue-400 h-[80%] rounded-t-sm" />
              <div className="flex-1 bg-blue-600 h-[95%] rounded-t-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm space-y-1">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase">Sales</p>
              <p className="text-xl font-extrabold text-slate-900">842</p>
              <span className="text-[10px] font-bold text-emerald-600">+8% growth</span>
            </div>

            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm space-y-1">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase">New Users</p>
              <p className="text-xl font-extrabold text-slate-900">124</p>
              <span className="text-[10px] font-bold text-emerald-600">+15% signups</span>
            </div>
          </div>
        </div>

        {/* Revenue Trend Chart Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <p className="text-xs font-extrabold text-slate-900">Revenue Volume Trend</p>
            <span className="text-[10px] font-extrabold text-blue-600 uppercase">REVENUE</span>
          </div>

          <div className="relative h-40 w-full pt-2">
            <svg className="w-full h-full text-blue-600" preserveAspectRatio="none" viewBox="0 0 500 160">
              <path
                d="M0,140 Q50,130 100,100 T200,80 T300,50 T400,30 T500,10 L500,160 L0,160 Z"
                fill="#2563eb"
                fillOpacity="0.1"
              />
              <path
                d="M0,140 Q50,130 100,100 T200,80 T300,50 T400,30 T500,10"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
            </svg>
            <div className="w-full flex justify-between pt-1 text-[9px] font-mono text-slate-400">
              <span>Oct 1</span>
              <span>Oct 15</span>
              <span>Oct 30</span>
            </div>
          </div>
        </div>

        {/* Mobile Insights */}
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">Key Observations</p>
          
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
            <Star className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-extrabold text-emerald-950">Top Performance</p>
              <p className="text-[11px] text-emerald-800 leading-tight">iPhone 15 is your fastest-moving model this month.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-extrabold text-blue-950">Peak Traffic</p>
              <p className="text-[11px] text-blue-800 leading-tight">Saturday is your busiest sales day on average.</p>
            </div>
          </div>
        </div>

        {/* Mobile Bento Category Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm space-y-2">
            <div className="flex justify-between items-center text-xs text-rose-600 font-bold">
              <Wrench className="w-4 h-4" />
              <span>REPAIRS</span>
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-900">$12.4k</p>
              <p className="text-[10px] text-slate-400">Total Revenue</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm space-y-2">
            <div className="flex justify-between items-center text-xs text-amber-600 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>AGING</span>
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-900">18 Items</p>
              <p className="text-[10px] text-slate-400">Inventory Health</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
