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
import { SearchInput } from '@/components/ui/Input';
import { Table, TableWrap, TBody, Td, Th, THead, Tr } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { useCustomers, useInventorySummary } from '@/hooks/useDashboardQueries';

export default function CustomersManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounced search trigger
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Cached persistent queries
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers(debouncedSearch);
  const { data: summaryData } = useInventorySummary();

  const loading = loadingCustomers && customers.length === 0;

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

  const handleExport = () => {
    if (customers.length === 0) return;
    const csvContent = 'data:text/csv;charset=utf-8,' +
      ['Name,Phone,Email,Total Spending,Created At']
        .concat(customers.map((c) => `"${c.name}","${c.phone}","${c.email || ''}",${c.totalSpending || 0},"${c.createdAt}"`))
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8">

      {/* Mobile Full-Screen Profile View */}
      {selectedCustomer && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-16 z-30 bg-white overflow-y-auto p-4 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <Button variant="link" onClick={() => setSelectedCustomer(null)} leftIcon={<ChevronLeft className="w-4 h-4" />}>
              Back to Directory
            </Button>
            <span className="text-xs font-mono text-slate-400">{selectedCustomer.id}</span>
          </div>

          {/* Customer Identity */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-accent-100 text-accent-700 font-extrabold text-xl flex items-center justify-center border-2 border-slate-200 shadow-md mx-auto">
              {getCustomerInitials(selectedCustomer.name)}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">{selectedCustomer.name}</h2>
              <p className="text-xs text-slate-500 font-medium">{selectedCustomer.phone} • {selectedCustomer.email || 'No Email'}</p>
            </div>

            <div className="flex items-center gap-2 justify-center pt-2">
              <Link href="/dashboard/sales/new" className="flex-1">
                <Button variant="primary" fullWidth size="md">
                  + New Sale
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Snapshot */}
          <div className="grid grid-cols-2 gap-3 text-center text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-400 font-bold uppercase">Lifetime Spend</p>
              <p className="text-base font-extrabold text-accent-600 mt-0.5">
                ₦{(selectedCustomer.totalSpending || 0).toLocaleString()}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-400 font-bold uppercase">Devices Owned</p>
              <p className="text-base font-extrabold text-success-600 mt-0.5">
                {selectedCustomer.devicesCount || 0}
              </p>
            </div>
          </div>

          {/* Phones Owned */}
          <div className="space-y-2 text-xs">
            <h3 className="font-extrabold text-slate-900 uppercase text-xs tracking-wider">
              Phones Owned ({(selectedCustomer.phoneRecords || []).length})
            </h3>
            <div className="space-y-2">
              {(selectedCustomer.phoneRecords || []).map((dev: any) => (
                <div key={dev.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-accent-600">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{dev.brand} {dev.model}</p>
                      <p className="text-xs font-mono text-slate-500">IMEI: {dev.imei1}</p>
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
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Customer Directory
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 font-medium max-w-xl mt-1 leading-relaxed">
            Customers created automatically upon completed Checkout POS sales. Click any customer row to inspect their profile.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 shrink-0">
          <Button variant="secondary" size="sm" onClick={() => handleExport()} leftIcon={<Download className="w-3.5 h-3.5" />}>
            Export
          </Button>
          <Link href="/dashboard/sales/new">
            <Button variant="primary" size="sm" leftIcon={<ShoppingCart className="w-4 h-4" />}>
              New Sale Checkout
            </Button>
          </Link>
        </div>
      </div>

      {/* 6 KPI Stat Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Active</p>
            {loading && customers.length === 0 ? (
              <div className="h-6 w-12 bg-slate-200/60 rounded-md animate-pulse mt-0.5" />
            ) : (
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">{customers.length}</p>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-success-50 text-success-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">New (30d)</p>
            {loading && customers.length === 0 ? (
              <div className="h-6 w-12 bg-slate-200/60 rounded-md animate-pulse mt-0.5" />
            ) : (
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                {customers.filter((c) => (Date.now() - new Date(c.createdAt).getTime()) < 30 * 86400000).length}
              </p>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-warning-50 text-warning-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">With Devices</p>
            {loading && customers.length === 0 ? (
              <div className="h-6 w-12 bg-slate-200/60 rounded-md animate-pulse mt-0.5" />
            ) : (
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                {customers.filter((c) => (c.devicesCount || 0) > 0).length}
              </p>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lifetime Rev</p>
            {loading && !summaryData ? (
              <div className="h-6 w-16 bg-slate-200/60 rounded-md animate-pulse mt-0.5" />
            ) : (
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                {summaryData?.kpis ? `₦${(summaryData.kpis.totalSalesRevenue / 1000).toFixed(1)}k` : '—'}
              </p>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Warranties</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{activeWarrantiesCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-danger-50 text-danger-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Repairs</p>
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

              <div className="w-full md:w-72">
                <SearchInput
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, phone, email..."
                  shortcutHint=""
                />
              </div>

              {/* Type Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
                {['ALL', 'VIP', 'REGULAR', 'NEW'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={selectedTypeFilter === type}
                    onClick={() => setSelectedTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-control text-xs font-extrabold transition-colors shrink-0 cursor-pointer ${
                      selectedTypeFilter === type
                        ? 'bg-accent-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* MOBILE CUSTOMER CARDS LIST */}
            <div className="block sm:hidden divide-y divide-slate-100 bg-white">
              {loading ? (
                <div className="py-16 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-400 font-semibold text-xs">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading customer directory...
                  </div>
                </div>
              ) : error ? (
                <div className="py-16 text-center">
                  <div className="flex items-center justify-center gap-2 text-danger-500 font-semibold text-xs">
                    <AlertTriangle className="w-5 h-5" />
                    {error}
                  </div>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-sm text-slate-600">No customers found</p>
                  <p>Customers are created automatically when completing checkout sales.</p>
                </div>
              ) : (
                filteredCustomers.map((cust) => {
                  const isSelected = selectedCustomer?.id === cust.id;
                  return (
                    <div
                      key={cust.id}
                      onClick={() => setSelectedCustomer(cust)}
                      className={`p-3.5 space-y-2.5 cursor-pointer transition ${
                        isSelected ? 'bg-accent-50/80 border-l-4 border-l-accent-600' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-accent-50 border border-accent-200 text-accent-600 font-extrabold flex items-center justify-center shrink-0 text-xs">
                            {getCustomerInitials(cust.name)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-900 text-sm truncate">{cust.name}</h4>
                            <p className="text-xs text-slate-400 font-mono">{cust.phone}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs text-slate-400 font-bold uppercase block">Devices</span>
                          <span className="font-extrabold text-slate-800 text-xs">{cust.devicesCount || 0} Owned</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                        <div>
                          <span className="text-xs text-slate-400 font-bold uppercase block">Last Purchase</span>
                          <span className="font-bold text-slate-800 text-xs block truncate">{cust.lastPurchaseItem || 'N/A'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 font-bold uppercase block">Lifetime Spend</span>
                          <span className="font-extrabold text-accent-600 text-xs">
                            ₦{(cust.totalSpending || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* DESKTOP CUSTOMERS TABLE */}
            <TableWrap className="hidden sm:block">
              <Table className="sm:text-xs">
                <THead>
                  <tr>
                    <Th>Customer Name</Th>
                    <Th>Contact Info</Th>
                    <Th align="center">Devices</Th>
                    <Th align="right">Lifetime Spend</Th>
                    <Th align="right">Last Purchase</Th>
                  </tr>
                </THead>
                <TBody>
                  {loading ? (
                    <tr>
                      <Td colSpan={5} align="center" className="py-16">
                        <div className="flex items-center justify-center gap-2 text-slate-400 font-semibold">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Loading customers directory...
                        </div>
                      </Td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <Td colSpan={5} align="center" className="py-16">
                        <div className="flex items-center justify-center gap-2 text-danger-500 font-semibold">
                          <AlertTriangle className="w-5 h-5" />
                          {error}
                        </div>
                      </Td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <Td colSpan={5} align="center" className="py-16">
                        <EmptyState
                          icon={<Users className="w-8 h-8" />}
                          title="No customers found"
                          description="Customers are created automatically when completing checkout sales."
                        />
                      </Td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust) => {
                      const isSelected = selectedCustomer?.id === cust.id;
                      return (
                        <Tr
                          key={cust.id}
                          onClick={() => setSelectedCustomer(cust)}
                          tabIndex={0}
                          aria-selected={isSelected}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setSelectedCustomer(cust);
                          }}
                          className={`cursor-pointer ${isSelected ? 'bg-accent-50 font-semibold border-l-4 border-l-accent-600' : ''}`}
                        >
                          <Td>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-accent-50 border border-accent-200 text-accent-600 font-extrabold flex items-center justify-center shrink-0 text-xs">
                                {getCustomerInitials(cust.name)}
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-900">{cust.name}</p>
                                <p className="text-xs font-mono text-slate-400">{cust.id.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </Td>
                          <Td>
                            <p className="font-bold text-slate-800">{cust.phone}</p>
                            <p className="text-xs text-slate-400">{cust.email || 'No email'}</p>
                          </Td>
                          <Td align="center" className="font-extrabold text-slate-900">
                            {cust.devicesCount || 0}
                          </Td>
                          <Td align="right" className="font-extrabold text-slate-900">
                            ₦{(cust.totalSpending || 0).toLocaleString()}
                          </Td>
                          <Td align="right">
                            <p className="font-bold text-slate-800">{cust.lastPurchaseDate}</p>
                            <p className="text-xs text-accent-600 truncate max-w-[120px]">{cust.lastPurchaseItem}</p>
                          </Td>
                        </Tr>
                      );
                    })
                  )}
                </TBody>
              </Table>
            </TableWrap>

          </div>

        </div>

        {/* DESKTOP PROFILE DRAWER */}
        {selectedCustomer && (
          <div className="hidden lg:block lg:col-span-4 space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-5 text-xs font-sans animate-in fade-in duration-200 sticky top-20">

              {/* Close Action */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs font-mono text-slate-400 uppercase font-bold">Customer Profile</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedCustomer(null)}
                  aria-label="Close customer profile"
                  leftIcon={<X className="w-4 h-4" />}
                />
              </div>

              {/* Profile Header */}
              <div className="text-center space-y-2 border-b border-slate-100 pb-4">
                <div className="w-16 h-16 rounded-2xl bg-accent-100 text-accent-700 font-extrabold text-xl flex items-center justify-center border-2 border-slate-200 shadow-md mx-auto">
                  {getCustomerInitials(selectedCustomer.name)}
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">{selectedCustomer.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedCustomer.phone} • {selectedCustomer.email || 'No email'}</p>
                </div>

                {/* Quick Action Triggers */}
                <div className="flex items-center gap-2 justify-center pt-1">
                  <Link href="/dashboard/sales/new">
                    <Button variant="primary" size="sm">
                      + New Sale
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <p className="text-xs text-slate-400 font-bold uppercase">Lifetime Spend</p>
                  <p className="text-base font-extrabold text-accent-600 mt-0.5">
                    ₦{(selectedCustomer.totalSpending || 0).toLocaleString()}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <p className="text-xs text-slate-400 font-bold uppercase">Devices Owned</p>
                  <p className="text-base font-extrabold text-success-600 mt-0.5">
                    {selectedCustomer.devicesCount || 0}
                  </p>
                </div>
              </div>

              {/* Hardware / Devices Owned List */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-slate-900 uppercase text-xs tracking-wider">
                    Phones Owned ({(selectedCustomer.phoneRecords || []).length})
                  </h4>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(selectedCustomer.phoneRecords || []).length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2">No registered devices owned.</p>
                  ) : (
                    (selectedCustomer.phoneRecords || []).map((dev: any) => (
                      <div key={dev.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-accent-600 shrink-0 font-bold">
                            <Smartphone className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{dev.brand} {dev.model}</p>
                            <p className="text-xs font-mono text-slate-500">IMEI: {dev.imei1}</p>
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
                <h4 className="font-extrabold text-slate-900 uppercase text-xs tracking-wider">
                  Purchase History ({(selectedCustomer.sales || []).length})
                </h4>
                <div className="space-y-2 border-l-2 border-slate-200 pl-3 max-h-40 overflow-y-auto">
                  {(selectedCustomer.sales || []).length === 0 ? (
                    <p className="text-xs text-slate-400">No previous purchases.</p>
                  ) : (
                    (selectedCustomer.sales || []).map((sale: any) => (
                      <div key={sale.id} className="space-y-0.5">
                        <p className="font-bold text-slate-900">
                          {sale.receiptNumber || sale.invoiceNumber || 'Sale Record'} — ₦{sale.totalAmount?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {sale.items?.map((i: any) => i.description).join(', ') || 'Item'}
                        </p>
                        <p className="text-xs font-mono text-slate-400">
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
