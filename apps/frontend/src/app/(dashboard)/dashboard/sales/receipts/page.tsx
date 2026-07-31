'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Search,
  Download,
  Plus,
  TrendingUp,
  TrendingDown,
  Printer,
  Mail,
  CreditCard,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface ReceiptItem {
  id: string;
  customer: string;
  customerInitials: string;
  items: string;
  amount: number;
  paymentMethod: string;
  date: string;
  status: 'PRINTED' | 'PENDING' | 'VOIDED';
}

const mockReceipts: ReceiptItem[] = [
  {
    id: '#RCP-92841',
    customer: 'John Doe',
    customerInitials: 'JD',
    items: 'iPhone 15 Pro, Case',
    amount: 1150.0,
    paymentMethod: 'Visa • 4242',
    date: 'Oct 24, 2023',
    status: 'PRINTED',
  },
  {
    id: '#RCP-92842',
    customer: 'Alice Smith',
    customerInitials: 'AS',
    items: 'Screen Protector, Adaptor',
    amount: 45.5,
    paymentMethod: 'Cash',
    date: 'Oct 24, 2023',
    status: 'PENDING',
  },
  {
    id: '#RCP-92843',
    customer: 'Mark Brown',
    customerInitials: 'MB',
    items: 'AirPods Max',
    amount: 549.0,
    paymentMethod: 'Amex • 1004',
    date: 'Oct 23, 2023',
    status: 'PRINTED',
  },
  {
    id: '#RCP-92844',
    customer: 'Guest Customer',
    customerInitials: 'GC',
    items: 'USB-C Cable (x3)',
    amount: 75.0,
    paymentMethod: 'Cash',
    date: 'Oct 23, 2023',
    status: 'VOIDED',
  },
];

export default function ReceiptsArchivePage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptItem | null>(null);

  const filteredReceipts = useMemo(() => {
    return mockReceipts.filter((rcp) => {
      const matchStatus = statusFilter === 'ALL' || rcp.status === statusFilter;
      const matchSearch =
        search === '' ||
        rcp.id.toLowerCase().includes(search.toLowerCase()) ||
        rcp.customer.toLowerCase().includes(search.toLowerCase()) ||
        rcp.items.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [search, statusFilter]);

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8 relative">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <nav className="flex items-center text-xs font-semibold text-slate-500 gap-1 mb-1">
            <Link href="/dashboard" className="hover:text-slate-900 transition">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900 font-bold">Sales & Invoices</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-blue-600 font-bold">Receipts</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Receipts Archive
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mt-1 leading-relaxed">
            Manage, re-print, and audit historical thermal sales receipts and customer transactions.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4 text-slate-600" />}>
            Export CSV
          </Button>
          <Link href="/dashboard/sales/new">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              New Sale
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Receipts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Receipt className="w-4 h-4" />
            </div>
            <span className="text-emerald-700 font-extrabold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              +12%
            </span>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Total Receipts</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">1,284</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">Archived this month</p>
        </div>

        {/* Revenue Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
            <span className="text-emerald-700 font-extrabold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              +4.2%
            </span>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Revenue Today</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">$14,290</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">24% of daily target reached</p>
        </div>

        {/* Average Sale */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-rose-600 font-extrabold text-[11px] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              -1.5%
            </span>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Average Sale</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">$245.00</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">Per transaction today</p>
        </div>

        {/* Reprints */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
              <Printer className="w-4 h-4" />
            </div>
            <span className="text-slate-500 font-bold text-[11px]">0 Alerts</span>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Reprints</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">18</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">Audit trail verified</p>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search receipt #, customer, or IMEI..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            {['ALL', 'PRINTED', 'PENDING', 'VOIDED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReceipts.map((rcp) => (
                <tr
                  key={rcp.id}
                  onClick={() => setSelectedReceipt(rcp)}
                  className="hover:bg-slate-50/80 transition cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{rcp.id}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center text-[10px] border border-blue-200">
                        {rcp.customerInitials}
                      </div>
                      <span className="font-extrabold text-slate-900">{rcp.customer}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{rcp.items}</td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">${rcp.amount.toFixed(2)}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-semibold flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" /> {rcp.paymentMethod}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium">{rcp.date}</td>
                  <td className="py-3.5 px-4 text-center">
                    {rcp.status === 'PRINTED' && <Badge variant="verified" size="sm">PRINTED</Badge>}
                    {rcp.status === 'PENDING' && <Badge variant="starter" size="sm">PENDING</Badge>}
                    {rcp.status === 'VOIDED' && <Badge variant="sold" size="sm">VOIDED</Badge>}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 text-slate-400 opacity-80 group-hover:opacity-100">
                      <button className="p-1.5 hover:text-blue-600 rounded" title="Print Thermal">
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 hover:text-blue-600 rounded" title="Email Receipt">
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div>
            Showing <strong className="text-slate-900">{filteredReceipts.length}</strong> of <strong className="text-slate-900">1,284</strong> receipts
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

      {/* Slide-Over Receipt Details Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 border-l border-slate-200">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <h3 className="text-lg font-extrabold text-slate-900">Receipt Details</h3>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Thermal Receipt Preview Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-dashed border-slate-300 font-mono text-xs text-slate-800 space-y-3">
                <div className="text-center space-y-1">
                  <p className="font-extrabold text-sm text-slate-900">CELLULAR SUITE</p>
                  <p className="text-[10px] text-slate-500 font-sans">Store #402 - NYC Branch<br />5th Ave, Manhattan, NY</p>
                </div>

                <div className="border-y border-slate-200 py-2 flex justify-between text-[11px]">
                  <span>{selectedReceipt.id}</span>
                  <span>{selectedReceipt.date}</span>
                </div>

                <div className="space-y-2 py-1">
                  <div className="flex justify-between">
                    <span>{selectedReceipt.items}</span>
                    <span>${(selectedReceipt.amount * 0.9).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Sales Tax (8%)</span>
                    <span>${(selectedReceipt.amount * 0.1).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between font-extrabold text-sm border-t border-slate-200 pt-2 text-slate-900">
                  <span>TOTAL</span>
                  <span>${selectedReceipt.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <Button variant="primary" fullWidth size="lg" leftIcon={<Printer className="w-4 h-4" />}>
                Print Thermal Receipt
              </Button>
              <Button variant="secondary" fullWidth size="md" leftIcon={<FileText className="w-4 h-4" />}>
                Print A4 Invoice Statement
              </Button>
              <Button variant="secondary" fullWidth size="md" leftIcon={<Mail className="w-4 h-4" />}>
                Email Receipt to Customer
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
