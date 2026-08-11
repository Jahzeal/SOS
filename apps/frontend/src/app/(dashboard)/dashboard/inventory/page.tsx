'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Package,
  Smartphone,
  Search,
  Download,
  Plus,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Filter,
  DollarSign,
  PieChart,
  BarChart3,
  Clock,
  ArrowRightLeft,
  XCircle,
  MoreVertical,
  SlidersHorizontal,
  Edit,
  Building,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [liveInventory, setLiveInventory] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [data, summary] = await Promise.all([
        api.getInventory({
          search: search || undefined,
          brand: brandFilter !== 'ALL' ? brandFilter : undefined,
        }),
        api.getDashboardSummary(),
      ]);
      setLiveInventory(data);
      setKpis(summary.kpis);
      // Build activity feed: merge recent registrations + recent sales, sort by date
      const registrations = (summary.recentPhones || []).slice(0, 4).map((p: any) => ({
        type: 'registration',
        label: 'New Registration',
        detail: `${p.brand} ${p.model} added to inventory`,
        time: p.createdAt,
        icon: '+',
        color: 'bg-blue-100 text-blue-700',
      }));
      const sales = (summary.recentSales || []).slice(0, 4).map((s: any) => {
        const first = s.items?.[0]?.phoneRecord;
        return {
          type: 'sale',
          label: 'Sale Confirmed',
          detail: first ? `${first.brand} ${first.model} sold` : 'Device sold',
          time: s.createdAt,
          icon: '✓',
          color: 'bg-emerald-100 text-emerald-700',
        };
      });
      const combined = [...registrations, ...sales]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 4);
      setRecentActivity(combined);
    } catch (err: any) {
      console.error('Failed to fetch inventory:', err);
      setError(err.message || 'Failed to load inventory.');
      setLiveInventory([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [search, brandFilter]);

  const items = useMemo(() => {
    return liveInventory.map((item) => ({
      id: item.id,
      model: item.model,
      brand: item.brand,
      storage: item.storageCapacity || 'N/A',
      color: item.color || 'Standard',
      imei: item.imei1 ? `${item.imei1.slice(0, 6)}•••••${item.imei1.slice(-4)}` : 'N/A',
      fullImei: item.imei1,
      daysInInv: Math.floor((Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24)) || 1,
      warrantyStatus: item.warrantyExpiryDate && new Date(item.warrantyExpiryDate) > new Date() ? 'active' : 'expired',
      branch: 'Main Flagship',
      value: item.sellingPrice ? `$${item.sellingPrice.toLocaleString()}` : '$0',
    }));
  }, [liveInventory]);

  // Brand breakdown from live data
  const brandBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    liveInventory.forEach((item) => {
      const b = item.brand || 'Other';
      counts[b] = (counts[b] || 0) + 1;
    });
    const total = liveInventory.length || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([brand, count]) => ({ brand, count, pct: Math.round((count / total) * 100) }));
  }, [liveInventory]);

  // Storage breakdown from live data
  const storageBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    liveInventory.forEach((item) => {
      const s = item.storageCapacity || 'Unknown';
      counts[s] = (counts[s] || 0) + 1;
    });
    const total = liveInventory.length || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([storage, count]) => ({ storage, count, pct: Math.round((count / total) * 100) }));
  }, [liveInventory]);

  // Ageing inventory from live data
  const ageing = useMemo(() => {
    const now = Date.now();
    const d30 = liveInventory.filter((i) => (now - new Date(i.createdAt).getTime()) > 30 * 86400000).length;
    const d60 = liveInventory.filter((i) => (now - new Date(i.createdAt).getTime()) > 60 * 86400000).length;
    const d90 = liveInventory.filter((i) => (now - new Date(i.createdAt).getTime()) > 90 * 86400000).length;
    return { d30, d60, d90 };
  }, [liveInventory]);

  // Missing warranty count
  const missingWarranty = useMemo(() =>
    liveInventory.filter((i) => !i.warrantyExpiryDate).length
  , [liveInventory]);

  const BRAND_COLORS = ['bg-blue-600', 'bg-emerald-500', 'bg-amber-500', 'bg-indigo-500'];
  const STORAGE_COLORS = ['bg-blue-600', 'bg-indigo-600', 'bg-emerald-600', 'bg-amber-500'];

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(items.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <nav className="flex items-center text-xs font-semibold text-slate-500 gap-1 mb-1">
            <Link href="/dashboard" className="hover:text-slate-900 transition">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-blue-600 font-bold">Inventory Overview</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Inventory Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mt-1 leading-relaxed">
            Monitor your available stock, inventory health, and overall performance in real time.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4 text-slate-600" />}>
            Export Inventory
          </Button>
          <Link href="/dashboard/register">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Register Phone
            </Button>
          </Link>
        </div>
      </div>

      {/* 6 KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Available Devices (in stock) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider mb-1">Available Devices</p>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900">{kpis ? kpis.inStockCount.toLocaleString() : '—'}</span>
            <TrendingUp className="w-3 h-3 text-emerald-600" />
          </div>
        </div>

        {/* 2. Inventory Value */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider mb-1">Inventory Value</p>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900">
              {kpis ? `$${(kpis.stockValuation / 1000).toFixed(1)}k` : '—'}
            </span>
            <TrendingUp className="w-3 h-3 text-emerald-600" />
          </div>
        </div>

        {/* 3. Brands in Stock */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider mb-1">Brands in Stock</p>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900">{brandBreakdown.length}</span>
            <span className="text-slate-400 font-bold text-[10px]">Brands</span>
          </div>
        </div>

        {/* 4. Ageing Inventory */}
        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200/90 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-rose-950 font-extrabold text-[10px] uppercase tracking-wider mb-1">Ageing Inventory</p>
          <div className="space-y-0.5 text-[11px] font-bold text-rose-900">
            <div className="flex justify-between"><span>30+ Days:</span> <span>{ageing.d30}</span></div>
            <div className="flex justify-between"><span>60+ Days:</span> <span>{ageing.d60}</span></div>
            <div className="flex justify-between text-rose-600 font-extrabold"><span>90+ Days:</span> <span>{ageing.d90}</span></div>
          </div>
        </div>

        {/* 5. Total Registered */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider mb-1">Total Registered</p>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900">{kpis ? kpis.totalRegistered.toLocaleString() : '—'}</span>
            <span className="text-slate-400 font-bold text-[10px]">All time</span>
          </div>
        </div>

        {/* 6. Ready for Sale (in stock) */}
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-emerald-950 font-extrabold text-[10px] uppercase tracking-wider mb-1">Ready for Sale</p>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-emerald-950">{kpis ? kpis.inStockCount.toLocaleString() : '—'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Analytics & Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: Brand & Storage Breakdown Charts */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Inventory by Brand */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-600" /> Inventory by Brand
              </h3>
            </div>
            <div className="h-44 flex items-center justify-around">
              <div className="w-28 h-28 rounded-full border-[10px] border-blue-600 border-t-emerald-500 border-r-amber-500 flex items-center justify-center shadow-subtle">
                <div className="text-center">
                  <p className="font-extrabold text-lg text-slate-900 leading-none">{liveInventory.length}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Total</p>
                </div>
              </div>
              <div className="space-y-2 text-xs font-bold text-slate-700">
                {brandBreakdown.length === 0 ? (
                  <p className="text-slate-400 text-[11px]">No data yet</p>
                ) : brandBreakdown.map((b, i) => (
                  <div key={b.brand} className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${BRAND_COLORS[i]}`} />
                    <span>{b.brand} ({b.pct}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Inventory by Storage */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" /> Inventory by Storage
              </h3>
            </div>
            <div className="space-y-3 text-xs font-semibold text-slate-700 pt-1">
              {storageBreakdown.length === 0 ? (
                <p className="text-slate-400 text-[11px] py-4 text-center">No data yet</p>
              ) : storageBreakdown.map((s, i) => (
                <div key={s.storage}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span>{s.storage}</span>
                    <span className="font-bold text-slate-900">{s.count} units ({s.pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${STORAGE_COLORS[i]}`} style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 4 Cols: Inventory Alerts Panel */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="font-extrabold text-sm text-slate-900">Inventory Alerts</h3>
            </div>
            <div className="space-y-2.5 text-xs">
              {ageing.d90 > 0 && (
                <div className="p-3 bg-rose-50 border-l-4 border-rose-600 rounded-r-xl flex gap-3">
                  <Clock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-rose-950">90+ Day Aging Stock</p>
                    <p className="text-rose-800 text-[11px] font-medium">{ageing.d90} unit{ageing.d90 !== 1 ? 's' : ''} sitting for 90+ days.</p>
                  </div>
                </div>
              )}
              {missingWarranty > 0 && (
                <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl flex gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-amber-950">Missing Warranty Data</p>
                    <p className="text-amber-800 text-[11px] font-medium">{missingWarranty} device{missingWarranty !== 1 ? 's' : ''} have no warranty set.</p>
                  </div>
                </div>
              )}
              {ageing.d90 === 0 && missingWarranty === 0 && (
                <p className="text-xs text-slate-400 font-medium py-4 text-center">No alerts at this time.</p>
              )}
            </div>
          </div>
          <Button variant="secondary" size="sm" fullWidth className="text-xs font-bold mt-2">
            View All Inventory Alerts →
          </Button>
        </div>

      </div>

      {/* Main Stock Data Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by IMEI, Model, or Serial..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">Brand: All</option>
              <option value="APPLE">Apple</option>
              <option value="SAMSUNG">Samsung</option>
              <option value="GOOGLE">Google</option>
            </select>

            <Button variant="secondary" size="sm" leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}>
              Filter
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.length === items.length && items.length > 0}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-3 px-4">Model</th>
                <th className="py-3 px-4">Specs</th>
                <th className="py-3 px-4">IMEI</th>
                <th className="py-3 px-4">Days in Inv.</th>
                <th className="py-3 px-4">Warranty</th>
                <th className="py-3 px-4">Branch Location</th>
                <th className="py-3 px-4">Value</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400 font-semibold">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading inventory records...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-rose-500 font-semibold">
                      <AlertTriangle className="w-5 h-5" />
                      {error}
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Smartphone className="w-10 h-10" />
                      <p className="font-bold text-sm text-slate-600">No inventory items found</p>
                      <p className="text-xs">Try adjusting your search filters or register a new phone.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => handleToggleSelect(item.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      {/* Hardware Vector Icon */}
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0 font-bold shadow-subtle">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 text-xs sm:text-sm">{item.model}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{item.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200/80 rounded font-bold text-[10px] text-slate-700">
                        {item.storage}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200/80 rounded font-bold text-[10px] text-slate-700">
                        {item.color}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{item.imei}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className={`w-2 h-2 rounded-full ${item.daysInInv > 60 ? 'bg-rose-600' : 'bg-emerald-600'}`} />
                      <span className={item.daysInInv > 60 ? 'text-rose-600 font-extrabold' : 'text-slate-800'}>
                        {item.daysInInv} Days
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={item.warrantyStatus === 'active' ? 'verified' : 'sold'} size="sm">
                      {item.warrantyStatus.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" /> {item.branch}
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">{item.value}</td>
                  <td className="py-3.5 px-4 text-right">
                    <Link href="/dashboard/records">
                      <Button variant="secondary" size="sm" className="text-[11px] font-bold">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3">
          Recent Activity
        </h3>
        {recentActivity.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium py-4 text-center">No recent activity yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-medium">
            {recentActivity.map((item, i) => {
              const diffMs = Date.now() - new Date(item.time).getTime();
              const mins = Math.floor(diffMs / 60000);
              const hrs = Math.floor(mins / 60);
              const timeLabel = hrs > 0 ? `${hrs} HR${hrs > 1 ? 'S' : ''} AGO` : `${mins} MIN AGO`;
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold ${item.color}`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900">{item.label}</p>
                    <p className="text-slate-500 text-[11px]">{item.detail}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{timeLabel}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
