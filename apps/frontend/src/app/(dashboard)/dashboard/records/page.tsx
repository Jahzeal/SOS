'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  Search,
  Download,
  Layers,
  Plus,
  TrendingUp,
  CheckCircle2,
  Package,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Eye,
  ShoppingCart,
  Copy,
  SlidersHorizontal,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

const STATUS_LABELS: Record<string, string> = {
  IN_STOCK: 'IN STOCK',
  SOLD: 'SOLD',
  IN_REPAIR: 'REPAIR',
  RESERVED: 'RESERVED',
  DISPOSED: 'DISPOSED',
  RETURNED: 'RETURNED',
};

export default function PhoneRecordsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState<{
    totalRegistered: number;
    inStockCount: number;
    soldCount: number;
    inRepairCount: number;
    activeWarrantiesCount: number;
  } | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedImei, setCopiedImei] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [phoneData, summaryData] = await Promise.all([
        api.getInventory({
          search: search || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          brand: brandFilter !== 'ALL' ? brandFilter : undefined,
        }),
        api.getDashboardSummary(),
      ]);
      setRecords(phoneData);
      setStats(summaryData.kpis);
    } catch (err: any) {
      setError(err.message || 'Failed to load records.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, brandFilter]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIds(e.target.checked ? records.map((r) => r.id) : []);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedImei(text);
    setTimeout(() => setCopiedImei(null), 1500);
  };

  const isWarrantyActive = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) > new Date();
  };

  const formatWarranty = (expiryDate: string | null) => {
    if (!expiryDate) return 'No Warranty';
    const exp = new Date(expiryDate);
    if (exp <= new Date()) return 'Expired';
    const daysLeft = Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return `Active (${daysLeft} Days)`;
  };

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8">

      {/* Top Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <nav className="flex items-center text-xs font-semibold text-slate-500 gap-1 mb-1">
            <Link href="/dashboard" className="hover:text-slate-900 transition">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-blue-600 font-bold">Phone Records</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Phone Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mt-1 leading-relaxed">
            Search, monitor, and manage every registered phone in your business ecosystem with real-time verification status.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4 text-slate-600" />}>
            Export Records
          </Button>
          <Button variant="secondary" size="sm" leftIcon={<Layers className="w-4 h-4 text-slate-600" />}>
            Bulk Actions
          </Button>
          <Link href="/dashboard/register">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Register Phone
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-105 transition-transform">
              <Package className="w-4 h-4" />
            </div>
            <span className="text-emerald-700 font-extrabold text-[11px] flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
            </span>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Total Registered</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{stats ? stats.totalRegistered.toLocaleString() : '—'}</h3>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Units Sold</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{stats ? stats.soldCount.toLocaleString() : '—'}</h3>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl group-hover:scale-105 transition-transform">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">In Stock</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{stats ? stats.inStockCount.toLocaleString() : '—'}</h3>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-105 transition-transform">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Under Repair</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{stats ? stats.inRepairCount.toLocaleString() : '—'}</h3>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Active Warranty</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{stats ? stats.activeWarrantiesCount.toLocaleString() : '—'}</h3>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Reserved</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{stats ? stats.inRepairCount.toLocaleString() : '—'}</h3>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">Status: All</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="SOLD">Sold</option>
              <option value="IN_REPAIR">Under Repair</option>
              <option value="RESERVED">Reserved</option>
              <option value="DISPOSED">Disposed</option>
            </select>

            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">Brand: All</option>
              <option value="Apple">Apple</option>
              <option value="Samsung">Samsung</option>
              <option value="Google">Google</option>
              <option value="OnePlus">OnePlus</option>
              <option value="Xiaomi">Xiaomi</option>
              <option value="Tecno">Tecno</option>
              <option value="Infinix">Infinix</option>
            </select>

            <Button variant="secondary" size="sm" leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}>
              More Filters
            </Button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search IMEI, SN, or model..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.length === records.length && records.length > 0}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-3 px-4">Device Info</th>
                <th className="py-3 px-4">Specs</th>
                <th className="py-3 px-4">Identifiers</th>
                <th className="py-3 px-4">Warranty</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400 font-semibold">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading records...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-rose-500 font-semibold">
                      <AlertTriangle className="w-5 h-5" />
                      {error}
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Smartphone className="w-10 h-10" />
                      <p className="font-bold text-sm text-slate-600">No records found</p>
                      <p className="text-xs">Try adjusting your filters or register a new phone.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((rec) => {
                  const warrantyActive = isWarrantyActive(rec.warrantyExpiryDate);
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition group">
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(rec.id)}
                          onChange={() => handleToggleSelect(rec.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0">
                            <Smartphone className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs sm:text-sm">{rec.model}</p>
                            <p className="text-[11px] text-slate-500 font-medium">{rec.brand} • {rec.condition}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {rec.storageCapacity && (
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200/80 rounded font-bold text-[10px] text-slate-700">
                              {rec.storageCapacity}
                            </span>
                          )}
                          {rec.color && (
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200/80 rounded font-bold text-[10px] text-slate-700">
                              {rec.color}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
                          <span>IMEI: {rec.imei1}</span>
                          <button onClick={() => handleCopy(rec.imei1)} title="Copy IMEI" className="text-slate-400 hover:text-slate-600 ml-1">
                            <Copy className="w-3 h-3" />
                          </button>
                          {copiedImei === rec.imei1 && (
                            <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                          )}
                        </div>
                        {rec.serialNumber && (
                          <p className="font-mono text-slate-500 text-[10px] font-medium">SN: {rec.serialNumber}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className={`w-1.5 h-1.5 rounded-full ${warrantyActive ? 'bg-emerald-600' : 'bg-rose-500'}`} />
                          <span className={warrantyActive ? 'text-emerald-700' : 'text-rose-600'}>
                            {formatWarranty(rec.warrantyExpiryDate)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {rec.status === 'IN_STOCK' && <Badge variant="verified" size="sm">IN STOCK</Badge>}
                        {rec.status === 'SOLD' && <Badge variant="sold" size="sm">SOLD</Badge>}
                        {rec.status === 'IN_REPAIR' && <Badge variant="business" size="sm">REPAIR</Badge>}
                        {rec.status === 'RESERVED' && <Badge variant="starter" size="sm">RESERVED</Badge>}
                        {rec.status === 'DISPOSED' && <Badge variant="sold" size="sm">DISPOSED</Badge>}
                        {rec.status === 'RETURNED' && <Badge variant="starter" size="sm">RETURNED</Badge>}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 text-right">
                        {rec.sellingPrice != null ? `₦${rec.sellingPrice.toLocaleString()}` : (rec.purchasePrice != null ? `₦${rec.purchasePrice.toLocaleString()}` : '—')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/dashboard/records/${rec.id}`}>
                            <button className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition" title="View Details">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          <Link href={`/dashboard/checkout?device=${rec.id}`}>
                            <button className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition" title="Quick Sell">
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div>
            Showing <strong className="text-slate-900">{records.length}</strong> of <strong className="text-slate-900">{stats?.totalRegistered ?? '—'}</strong> records
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
              Next Page
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
