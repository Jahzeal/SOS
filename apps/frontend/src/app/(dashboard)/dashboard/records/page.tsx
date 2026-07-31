'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  Search,
  Download,
  Layers,
  Plus,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Package,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Filter,
  Eye,
  ShoppingCart,
  CheckSquare,
  MoreHorizontal,
  Copy,
  Check,
  SlidersHorizontal,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface PhoneRecord {
  id: string;
  model: string;
  brand: string;
  condition: string;
  storage: string;
  color: string;
  imei: string;
  serial: string;
  carrier: string;
  warranty: string;
  warrantyStatus: 'active' | 'expired';
  status: 'AVAILABLE' | 'IN_TRANSIT' | 'UNDER_REPAIR' | 'FLAGGED' | 'SOLD';
  price: string;
}

const mockRecords: PhoneRecord[] = [
  {
    id: 'REC-1091',
    model: 'iPhone 15 Pro',
    brand: 'Apple',
    condition: 'Mint Condition',
    storage: '256GB',
    color: 'Space Black',
    imei: '358204-10-294711-0',
    serial: 'F2MZN1999X',
    carrier: 'Unlocked',
    warranty: 'Active (242 Days)',
    warrantyStatus: 'active',
    status: 'AVAILABLE',
    price: '$999.00',
  },
  {
    id: 'REC-1092',
    model: 'Galaxy S24 Ultra',
    brand: 'Samsung',
    condition: 'Brand New',
    storage: '512GB',
    color: 'Titanium Gray',
    imei: '990001-44-452891-2',
    serial: 'R5CT7998V8',
    carrier: 'Verizon',
    warranty: 'Active (364 Days)',
    warrantyStatus: 'active',
    status: 'IN_TRANSIT',
    price: '$1,150.00',
  },
  {
    id: 'REC-1093',
    model: 'Pixel 8 Pro',
    brand: 'Google',
    condition: 'Good Condition',
    storage: '128GB',
    color: 'Porcelain',
    imei: '351104-10-884321-9',
    serial: 'GP3XW109K2',
    carrier: 'T-Mobile',
    warranty: 'Expired',
    warrantyStatus: 'expired',
    status: 'UNDER_REPAIR',
    price: '$799.00',
  },
  {
    id: 'REC-1094',
    model: 'iPhone 14',
    brand: 'Apple',
    condition: 'Mint Condition',
    storage: '128GB',
    color: 'Blue',
    imei: '351182-00-005912-1',
    serial: 'LLN03881Z1',
    carrier: 'AT&T',
    warranty: 'Active (12 Days)',
    warrantyStatus: 'active',
    status: 'FLAGGED',
    price: '$649.00',
  },
  {
    id: 'REC-1095',
    model: 'Galaxy Z Fold 5',
    brand: 'Samsung',
    condition: 'Refurbished',
    storage: '512GB',
    color: 'Phantom Black',
    imei: '359812-49-102948-5',
    serial: 'SZF5019283',
    carrier: 'Unlocked',
    warranty: 'Active (180 Days)',
    warrantyStatus: 'active',
    status: 'AVAILABLE',
    price: '$1,299.00',
  },
];

export default function PhoneRecordsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [conditionFilter, setConditionFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedImei, setCopiedImei] = useState<string | null>(null);

  const filteredRecords = useMemo(() => {
    return mockRecords.filter((rec) => {
      const matchSearch =
        search === '' ||
        rec.model.toLowerCase().includes(search.toLowerCase()) ||
        rec.imei.includes(search) ||
        rec.serial.toLowerCase().includes(search.toLowerCase()) ||
        rec.brand.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || rec.status === statusFilter;
      const matchBrand = brandFilter === 'ALL' || rec.brand.toUpperCase() === brandFilter.toUpperCase();
      const matchCondition =
        conditionFilter === 'ALL' ||
        rec.condition.toLowerCase().includes(conditionFilter.toLowerCase());

      return matchSearch && matchStatus && matchBrand && matchCondition;
    });
  }, [search, statusFilter, brandFilter, conditionFilter]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredRecords.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
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

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8">
      
      {/* Top Page Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <nav className="flex items-center text-xs font-semibold text-slate-500 gap-1 mb-1">
            <Link href="/dashboard" className="hover:text-slate-900 transition">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900 font-bold">Phones</span>
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

        {/* Header Quick Action Buttons */}
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

      {/* KPI Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Total Registered */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-105 transition-transform">
              <Package className="w-4 h-4" />
            </div>
            <span className="text-emerald-700 font-extrabold text-[11px] flex items-center gap-0.5">
              +12% <TrendingUp className="w-3 h-3" />
            </span>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Total Registered</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">12,842</h3>
        </div>

        {/* Units Sold */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-emerald-700 font-extrabold text-[11px] flex items-center gap-0.5">
              +5.2% <TrendingUp className="w-3 h-3" />
            </span>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Units Sold</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">8,193</h3>
        </div>

        {/* In Inventory */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl group-hover:scale-105 transition-transform">
              <Smartphone className="w-4 h-4" />
            </div>
            <span className="text-rose-600 font-extrabold text-[11px] flex items-center gap-0.5">
              -2.1% <TrendingDown className="w-3 h-3" />
            </span>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">In Inventory</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">4,210</h3>
        </div>

        {/* Under Repair */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-105 transition-transform">
              <Wrench className="w-4 h-4" />
            </div>
            <span className="text-slate-400 font-bold text-[11px]">Stable</span>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Under Repair</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">142</h3>
        </div>

        {/* Active Warranty */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-emerald-700 font-extrabold text-[11px] flex items-center gap-0.5">
              +0.8% <TrendingUp className="w-3 h-3" />
            </span>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Active Warranty</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">6,842</h3>
        </div>

        {/* Req. Attention */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-rose-600 font-extrabold text-[11px] flex items-center gap-0.5">
              +24% <TrendingUp className="w-3 h-3" />
            </span>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Req. Attention</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">29</h3>
        </div>
      </div>

      {/* Main Table Controls & Data Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col space-y-0">
        
        {/* Filter Controls Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">Status: All</option>
              <option value="AVAILABLE">Available</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="UNDER_REPAIR">Under Repair</option>
              <option value="FLAGGED">Flagged</option>
            </select>

            {/* Brand Dropdown */}
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">Brand: All</option>
              <option value="APPLE">Apple</option>
              <option value="SAMSUNG">Samsung</option>
              <option value="GOOGLE">Google</option>
            </select>

            {/* Condition Dropdown */}
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">Condition: Any</option>
              <option value="Mint">Mint Condition</option>
              <option value="Brand New">Brand New</option>
              <option value="Good">Good Condition</option>
              <option value="Refurbished">Refurbished</option>
            </select>

            <Button variant="secondary" size="sm" leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}>
              More Filters
            </Button>
          </div>

          {/* Search Box */}
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

        {/* Enterprise Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.length === filteredRecords.length && filteredRecords.length > 0}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-3 px-4">Device Info</th>
                <th className="py-3 px-4">Specs & Color</th>
                <th className="py-3 px-4">Identifiers</th>
                <th className="py-3 px-4">Carrier</th>
                <th className="py-3 px-4">Warranty</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((rec) => (
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
                      {/* Sleek Icon Box Instead of Image */}
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0 font-bold shadow-subtle">
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
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200/80 rounded font-bold text-[10px] text-slate-700">
                        {rec.storage}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200/80 rounded font-bold text-[10px] text-slate-700">
                        {rec.color}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
                      <span>IMEI: {rec.imei}</span>
                      <button
                        onClick={() => handleCopy(rec.imei)}
                        title="Copy IMEI"
                        className="text-slate-400 hover:text-slate-600 ml-1"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {copiedImei === rec.imei && (
                        <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                      )}
                    </div>
                    <p className="font-mono text-slate-500 text-[10px] font-medium">SN: {rec.serial}</p>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{rec.carrier}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className={`w-1.5 h-1.5 rounded-full ${rec.warrantyStatus === 'active' ? 'bg-emerald-600' : 'bg-rose-500'}`} />
                      <span className={rec.warrantyStatus === 'active' ? 'text-emerald-700' : 'text-rose-600'}>
                        {rec.warranty}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {rec.status === 'AVAILABLE' && <Badge variant="verified" size="sm">AVAILABLE</Badge>}
                    {rec.status === 'IN_TRANSIT' && <Badge variant="starter" size="sm">IN TRANSIT</Badge>}
                    {rec.status === 'UNDER_REPAIR' && <Badge variant="business" size="sm" className="font-bold">REPAIR</Badge>}
                    {rec.status === 'FLAGGED' && <Badge variant="sold" size="sm">FLAGGED</Badge>}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href="/dashboard/verify">
                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition" title="Quick View">
                          <Eye className="w-4 h-4" />
                        </button>
                      </Link>
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition" title="Generate Receipt">
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div>
            Showing <strong className="text-slate-900">{filteredRecords.length}</strong> of <strong className="text-slate-900">12,842</strong> records
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
