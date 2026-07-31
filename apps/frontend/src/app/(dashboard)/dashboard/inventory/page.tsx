'use client';

import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface InventoryItem {
  id: string;
  model: string;
  brand: string;
  storage: string;
  color: string;
  imei: string;
  daysInInv: number;
  warrantyStatus: 'active' | 'expired';
  branch: string;
  value: string;
}

const mockInventory: InventoryItem[] = [
  {
    id: 'INV-101',
    model: 'iPhone 15 Pro',
    brand: 'Apple',
    storage: '256 GB',
    color: 'Titanium',
    imei: '352938•••••2104',
    daysInInv: 12,
    warrantyStatus: 'active',
    branch: 'Main Warehouse',
    value: '$1,099',
  },
  {
    id: 'INV-102',
    model: 'Galaxy S24 Ultra',
    brand: 'Samsung',
    storage: '512 GB',
    color: 'Black',
    imei: '861022•••••5590',
    daysInInv: 92,
    warrantyStatus: 'expired',
    branch: 'Store #04 (NY)',
    value: '$1,299',
  },
  {
    id: 'INV-103',
    model: 'Pixel 8 Pro',
    brand: 'Google',
    storage: '128 GB',
    color: 'Bay',
    imei: '357412•••••8832',
    daysInInv: 4,
    warrantyStatus: 'active',
    branch: 'Main Warehouse',
    value: '$999',
  },
  {
    id: 'INV-104',
    model: 'iPhone 14',
    brand: 'Apple',
    storage: '128 GB',
    color: 'Blue',
    imei: '351182•••••0059',
    daysInInv: 28,
    warrantyStatus: 'active',
    branch: 'Store #02 (LA)',
    value: '$649',
  },
  {
    id: 'INV-105',
    model: 'Galaxy Z Fold 5',
    brand: 'Samsung',
    storage: '512 GB',
    color: 'Phantom Black',
    imei: '359812•••••1029',
    daysInInv: 45,
    warrantyStatus: 'active',
    branch: 'Main Warehouse',
    value: '$1,399',
  },
];

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredItems = useMemo(() => {
    return mockInventory.filter((item) => {
      const matchSearch =
        search === '' ||
        item.model.toLowerCase().includes(search.toLowerCase()) ||
        item.imei.includes(search) ||
        item.brand.toLowerCase().includes(search.toLowerCase());

      const matchBrand = brandFilter === 'ALL' || item.brand.toUpperCase() === brandFilter.toUpperCase();

      return matchSearch && matchBrand;
    });
  }, [search, brandFilter]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredItems.map((i) => i.id));
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
        {/* 1. Available Devices */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider mb-1">Available Devices</p>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900">1,284</span>
            <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />+4%
            </span>
          </div>
        </div>

        {/* 2. Inventory Value */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider mb-1">Inventory Value</p>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900">$842.5k</span>
            <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />+12%
            </span>
          </div>
        </div>

        {/* 3. Brands in Stock */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider mb-1">Brands in Stock</p>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900">12</span>
            <span className="text-slate-400 font-bold text-[10px]">Active Vendors</span>
          </div>
        </div>

        {/* 4. Ageing Inventory Alert Card */}
        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200/90 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-rose-950 font-extrabold text-[10px] uppercase tracking-wider mb-1">Ageing Inventory</p>
          <div className="space-y-0.5 text-[11px] font-bold text-rose-900">
            <div className="flex justify-between"><span>30+ Days:</span> <span>42</span></div>
            <div className="flex justify-between"><span>60+ Days:</span> <span>18</span></div>
            <div className="flex justify-between text-rose-600 font-extrabold"><span>90+ Days:</span> <span>5</span></div>
          </div>
        </div>

        {/* 5. Recently Registered */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider mb-1">Recently Reg.</p>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-900">124</span>
            <span className="text-slate-400 font-bold text-[10px]">Last 7d</span>
          </div>
        </div>

        {/* 6. Ready for Sale */}
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-emerald-950 font-extrabold text-[10px] uppercase tracking-wider mb-1">Ready for Sale</p>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-emerald-950">1,150</span>
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
              {/* Clean Metric Donut Indicator */}
              <div className="w-28 h-28 rounded-full border-[10px] border-blue-600 border-t-emerald-500 border-r-amber-500 flex items-center justify-center shadow-subtle">
                <div className="text-center">
                  <p className="font-extrabold text-lg text-slate-900 leading-none">1.2k</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Total</p>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-2 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span>Apple (45%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Samsung (25%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Google (15%)</span>
                </div>
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
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>128 GB</span>
                  <span className="font-bold text-slate-900">450 units (45%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>256 GB</span>
                  <span className="font-bold text-slate-900">320 units (32%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: '32%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>512 GB</span>
                  <span className="font-bold text-slate-900">180 units (18%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: '18%' }} />
                </div>
              </div>
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
              <div className="p-3 bg-rose-50 border-l-4 border-rose-600 rounded-r-xl flex gap-3">
                <Clock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-rose-950">90+ Day Aging Stock</p>
                  <p className="text-rose-800 text-[11px] font-medium">5 units of iPhone 13 Pro Max require markdown.</p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl flex gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-amber-950">Missing Warranty Data</p>
                  <p className="text-amber-800 text-[11px] font-medium">12 devices registered today lack AppleCare log.</p>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border-l-4 border-emerald-600 rounded-r-xl flex gap-3">
                <Package className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-emerald-950">Low Stock Alert</p>
                  <p className="text-emerald-800 text-[11px] font-medium">Galaxy S24 Ultra is below 5% threshold.</p>
                </div>
              </div>
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
                    checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
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
              {filteredItems.map((item) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity Timeline Bar */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3">
          Recent Activity Timeline
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-medium">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold">
              +
            </div>
            <div>
              <p className="font-extrabold text-slate-900">New Registration</p>
              <p className="text-slate-500 text-[11px]">iPhone 15 Pro added to Main Warehouse</p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">2 MIN AGO</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
              ✓
            </div>
            <div>
              <p className="font-extrabold text-slate-900">Sale Confirmed</p>
              <p className="text-slate-500 text-[11px]">Galaxy S24 Ultra sold at Store #04</p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">15 MIN AGO</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold">
              ↔
            </div>
            <div>
              <p className="font-extrabold text-slate-900">Inter-branch Transfer</p>
              <p className="text-slate-500 text-[11px]">12 Units moved: Main → Store #04</p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">1 HR AGO</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-bold">
              !
            </div>
            <div>
              <p className="font-extrabold text-slate-900">Return Logged</p>
              <p className="text-slate-500 text-[11px]">Pixel 8 Pro returned (Defective Screen)</p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">3 HRS AGO</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
