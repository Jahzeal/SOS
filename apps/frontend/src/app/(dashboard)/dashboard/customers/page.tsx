'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Search,
  Download,
  Phone,
  Mail,
  Smartphone,
  ShieldCheck,
  Wrench,
  DollarSign,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  ShoppingCart,
  X,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function CustomersManagementPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomersData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [customersList, summary] = await Promise.all([
        api.getCustomers(searchTerm.trim() || undefined),
        api.getDashboardSummary(),
      ]);
      setCustomers(customersList || []);
      setSummaryData(summary || null);
    } catch (err: any) {
      console.error('Failed to load customer directory:', err);
      setError(err.message || 'Failed to load customer directory.');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  // Debounced search trigger
  useEffect(() => {
    const t = setTimeout(() => fetchCustomersData(), 300);
    return () => clearTimeout(t);
  }, [fetchCustomersData]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (selectedTypeFilter === 'ALL') return true;
      // Derive VIP/Business/New type from spending or record age
      if (selectedTypeFilter === 'VIP') return (c.totalSpending || 0) > 1000;
      if (selectedTypeFilter === 'REGULAR') return (c.totalSpending || 0) <= 1000 && (c.totalSpending || 0) > 0;
      if (selectedTypeFilter === 'NEW') {
        const monthAgo = Date.now() - 30 * 86400000;
        return new Date(c.createdAt).getTime() > monthAgo;
      }
      return true;
    });
  }, [customers, selectedTypeFilter]);

  const getCustomerInitials = (name?: string) => {
    if (!name) return 'CU';
    return name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const activeWarrantiesCount = useMemo(() => {
    let count = 0;
    const now = new Date();
    customers.forEach((c) => {
      (c.phoneRecords || []).forEach((p: any) => {
        if (p.warrantyExpiryDate && new Date(p.warrantyExpiryDate) > now) {
          count++;
        }
      });
    });
    return count;
  }, [customers]);

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8">

      {/* Mobile Full-Screen Profile View */}
      {selectedCustomer && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-16 z-30 bg-white overflow-y-auto p-4 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="flex items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-700"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Directory
            </button>
            <span className="text-[10px] font-mono text-slate-400">{selectedCustomer.id}</span>
          </div>

          {/* Customer Identity */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 font-extrabold text-xl flex items-center justify-center border-2 border-slate-200 shadow-md mx-auto">
              {getCustomerInitials(selectedCustomer.name)}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">{selectedCustomer.name}</h2>
              <p className="text-xs text-slate-500 font-medium">{selectedCustomer.phone} • {selectedCustomer.email || 'No Email'}</p>
            </div>

            <div className="flex items-center gap-2 justify-center pt-2">
              <Link href="/dashboard/sales/new" className="flex-1">
                <Button variant="primary" fullWidth size="md" className="bg-blue-600 hover:bg-blue-500 font-bold">
                  + New Sale
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Snapshot */}
          <div className="grid grid-cols-2 gap-3 text-center text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Lifetime Spend</p>
              <p className="text-base font-extrabold text-blue-600 mt-0.5">
                ${(selectedCustomer.totalSpending || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Devices Owned</p>
              <p className="text-base font-extrabold text-emerald-600 mt-0.5">
                {selectedCustomer.devicesCount || 0}
              </p>
            </div>
          </div>

          {/* Phones Owned */}
          <div className="space-y-2 text-xs">
            <h3 className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider">
              Phones Owned ({(selectedCustomer.phoneRecords || []).length})
            </h3>
            <div className="space-y-2">
              {(selectedCustomer.phoneRecords || []).map((dev: any) => (
                <div key={dev.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{dev.brand} {dev.model}</p>
                      <p className="text-[10px] font-mono text-slate-500">IMEI: {dev.imei1}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <nav className="flex items-center text-xs font-semibold text-slate-500 gap-1 mb-1">
            <Link href="/dashboard" className="hover:text-slate-900 transition">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-blue-600 font-bold">Customer Directory</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Customer Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mt-1 leading-relaxed">
            Customers created automatically upon completed Checkout POS sales. Click any customer row to inspect their profile.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button variant="secondary" size="md" leftIcon={<Download className="w-4 h-4 text-slate-600" />}>
            Export Customers
          </Button>
          <Link href="/dashboard/sales/new">
            <Button
              variant="primary"
              size="md"
              leftIcon={<ShoppingCart className="w-4 h-4" />}
              className="bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 font-bold"
            >
              New Sale Checkout
            </Button>
          </Link>
        </div>
      </div>

      {/* 6 KPI Stat Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Active</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{customers.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">New (30d)</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">
              {customers.filter((c) => (Date.now() - new Date(c.createdAt).getTime()) < 30 * 86400000).length}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">With Devices</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">
              {customers.filter((c) => (c.devicesCount || 0) > 0).length}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lifetime Rev</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">
              {summaryData?.kpis ? `₦${(summaryData.kpis.totalSalesRevenue / 1000).toFixed(1)}k` : '₦0.0k'}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Warranties</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{activeWarrantiesCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Repairs</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">
              {customers.reduce((sum, c) => sum + (c.repairs?.length || 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Data Table & Desktop Slide-Over Profile Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* CUSTOMERS CONTAINER */}
        <div className={selectedCustomer ? 'lg:col-span-8 space-y-4 transition-all' : 'lg:col-span-12 space-y-4 transition-all'}>

          <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, phone, email..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Type Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
                {['ALL', 'VIP', 'REGULAR', 'NEW'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition shrink-0 ${
                      selectedTypeFilter === type
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* DESKTOP CUSTOMERS TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Customer Name</th>
                    <th className="py-3 px-3">Contact Info</th>
                    <th className="py-3 px-3 text-center">Devices</th>
                    <th className="py-3 px-3 text-right">Lifetime Spend</th>
                    <th className="py-3 px-3 text-right">Last Purchase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <div className="flex items-center justify-center gap-2 text-slate-400 font-semibold">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Loading customers directory...
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <div className="flex items-center justify-center gap-2 text-rose-500 font-semibold">
                          <AlertTriangle className="w-5 h-5" />
                          {error}
                        </div>
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <Users className="w-10 h-10" />
                          <p className="font-bold text-sm text-slate-600">No customers found</p>
                          <p className="text-xs">Customers are created automatically when completing checkout sales.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust) => {
                      const isSelected = selectedCustomer?.id === cust.id;
                      return (
                        <tr
                          key={cust.id}
                          onClick={() => setSelectedCustomer(cust)}
                          className={`cursor-pointer transition ${
                            isSelected ? 'bg-blue-50/80 font-semibold border-l-4 border-l-blue-600' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 text-blue-600 font-extrabold flex items-center justify-center shrink-0 text-xs">
                                {getCustomerInitials(cust.name)}
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-900">{cust.name}</p>
                                <p className="text-[10px] font-mono text-slate-400">{cust.id.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <p className="font-bold text-slate-800">{cust.phone}</p>
                            <p className="text-[10px] text-slate-400">{cust.email || 'No email'}</p>
                          </td>
                          <td className="py-3.5 px-3 text-center font-extrabold text-slate-900">
                            {cust.devicesCount || 0}
                          </td>
                          <td className="py-3.5 px-3 text-right font-extrabold text-slate-900">
                            ₦{(cust.totalSpending || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <p className="font-bold text-slate-800">{cust.lastPurchaseDate}</p>
                            <p className="text-[10px] text-blue-600 truncate max-w-[120px]">{cust.lastPurchaseItem}</p>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>

        {/* DESKTOP PROFILE DRAWER */}
        {selectedCustomer && (
          <div className="hidden lg:block lg:col-span-4 space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-5 text-xs font-sans animate-in fade-in duration-200 sticky top-20">

              {/* Close Action */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Customer Profile</span>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Profile Header */}
              <div className="text-center space-y-2 border-b border-slate-100 pb-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 font-extrabold text-xl flex items-center justify-center border-2 border-slate-200 shadow-md mx-auto">
                  {getCustomerInitials(selectedCustomer.name)}
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">{selectedCustomer.name}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">{selectedCustomer.phone} • {selectedCustomer.email || 'No email'}</p>
                </div>

                {/* Quick Action Triggers */}
                <div className="flex items-center gap-2 justify-center pt-1">
                  <Link href="/dashboard/sales/new">
                    <Button variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-500 font-bold px-4">
                      + New Sale
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Lifetime Spend</p>
                  <p className="text-base font-extrabold text-blue-600 mt-0.5">
                    ₦{(selectedCustomer.totalSpending || 0).toLocaleString()}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Devices Owned</p>
                  <p className="text-base font-extrabold text-emerald-600 mt-0.5">
                    {selectedCustomer.devicesCount || 0}
                  </p>
                </div>
              </div>

              {/* Hardware / Devices Owned List */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider">
                    Phones Owned ({(selectedCustomer.phoneRecords || []).length})
                  </h4>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(selectedCustomer.phoneRecords || []).length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-2">No registered devices owned.</p>
                  ) : (
                    (selectedCustomer.phoneRecords || []).map((dev: any) => (
                      <div key={dev.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0 font-bold">
                            <Smartphone className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{dev.brand} {dev.model}</p>
                            <p className="text-[9px] font-mono text-slate-500">IMEI: {dev.imei1}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sales History */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider">
                  Purchase History ({(selectedCustomer.sales || []).length})
                </h4>
                <div className="space-y-2 border-l-2 border-slate-200 pl-3 max-h-40 overflow-y-auto">
                  {(selectedCustomer.sales || []).length === 0 ? (
                    <p className="text-[11px] text-slate-400">No previous purchases.</p>
                  ) : (
                    (selectedCustomer.sales || []).map((sale: any) => (
                      <div key={sale.id} className="space-y-0.5">
                        <p className="font-bold text-slate-900">
                          {sale.receiptNumber || sale.invoiceNumber || 'Sale Record'} — ₦{sale.totalAmount?.toLocaleString() || '0'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {sale.items?.map((i: any) => i.description).join(', ') || 'Item'}
                        </p>
                        <p className="text-[9px] font-mono text-slate-400">
                          {new Date(sale.createdAt).toLocaleDateString('en-US')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
