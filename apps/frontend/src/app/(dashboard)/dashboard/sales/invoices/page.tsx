'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Download,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Filter,
  DollarSign,
  Calendar,
  MapPin,
  Eye,
  Mail,
  Edit,
  MoreVertical,
  SlidersHorizontal,
  BellRing,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface Invoice {
  id: string;
  customerName: string;
  customerInitials: string;
  itemsSummary: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: 'PAID' | 'OVERDUE' | 'PENDING' | 'DRAFT';
}

const mockInvoices: Invoice[] = [
  {
    id: 'INV-84920',
    customerName: 'Johnathan Doe',
    customerInitials: 'JD',
    itemsSummary: 'iPhone 15 Pro, Case x2',
    issueDate: 'Oct 12, 2023',
    dueDate: 'Oct 26, 2023',
    amount: 1249.0,
    status: 'PAID',
  },
  {
    id: 'INV-84921',
    customerName: 'Alice Smith',
    customerInitials: 'AS',
    itemsSummary: 'Samsung S23, Screen Guard',
    issueDate: 'Oct 14, 2023',
    dueDate: 'Oct 28, 2023',
    amount: 899.5,
    status: 'OVERDUE',
  },
  {
    id: 'INV-84922',
    customerName: 'Robert King',
    customerInitials: 'RK',
    itemsSummary: 'AirPods Pro Gen 2',
    issueDate: 'Oct 15, 2023',
    dueDate: 'Oct 29, 2023',
    amount: 249.0,
    status: 'PENDING',
  },
  {
    id: 'INV-84923',
    customerName: 'Elena Martinez',
    customerInitials: 'EM',
    itemsSummary: 'Repair Service - Screen Replacement',
    issueDate: 'Oct 15, 2023',
    dueDate: 'Oct 29, 2023',
    amount: 120.0,
    status: 'DRAFT',
  },
  {
    id: 'INV-84924',
    customerName: 'Corporate Wireless LLC',
    customerInitials: 'CW',
    itemsSummary: 'Bulk Order: 50x SIM Starter Kits',
    issueDate: 'Oct 16, 2023',
    dueDate: 'Oct 30, 2023',
    amount: 5000.0,
    status: 'PAID',
  },
];

export default function InvoicesRegistryPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredInvoices = useMemo(() => {
    return mockInvoices.filter((inv) => {
      const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      const matchSearch =
        search === '' ||
        inv.id.toLowerCase().includes(search.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
        inv.itemsSummary.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [search, statusFilter]);

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <nav className="flex items-center text-xs font-semibold text-slate-500 gap-1 mb-1">
            <Link href="/dashboard" className="hover:text-slate-900 transition">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900 font-bold">Sales & Invoices</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-blue-600 font-bold">Invoices</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Invoice Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mt-1 leading-relaxed">
            View, track, and manage all billing operations, accounts receivable, and customer statements across branches.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4 text-slate-600" />}>
            Export Data
          </Button>
          <Link href="/dashboard/sales/new">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* 6 KPI Stat Cards Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Invoices */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Total Invoices</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">1,248</h3>
          <p className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-0.5 mt-1">
            <TrendingUp className="w-3 h-3" /> +12% this month
          </p>
        </div>

        {/* Draft */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Draft</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">42</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-1">Pending completion</p>
        </div>

        {/* Pending */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Pending</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">184</h3>
          <p className="text-[10px] text-amber-700 font-bold mt-1">Awaiting payment</p>
        </div>

        {/* Paid */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Paid</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">986</h3>
          <p className="text-[10px] text-emerald-700 font-bold mt-1">Successfully settled</p>
        </div>

        {/* Overdue */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Overdue</p>
          <h3 className="text-xl font-extrabold text-rose-600 mt-0.5">36</h3>
          <p className="text-[10px] text-rose-600 font-bold mt-1">Requires action</p>
        </div>

        {/* Outstanding Total */}
        <div className="bg-indigo-600 text-white p-4 rounded-2xl border border-indigo-700 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-indigo-100 font-extrabold text-[10px] uppercase tracking-wider">Outstanding</p>
          <h3 className="text-xl font-extrabold text-white mt-0.5">$142.5k</h3>
          <p className="text-[10px] text-indigo-100 font-medium mt-1">Total receivables</p>
        </div>
      </div>

      {/* Main Table & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice #, customer name or item..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">Status: All</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="OVERDUE">Overdue</option>
              <option value="DRAFT">Draft</option>
            </select>

            <Button variant="secondary" size="sm" leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}>
              Filters
            </Button>
          </div>
        </div>

        {/* Invoice Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{inv.id}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center text-[10px] border border-blue-200">
                        {inv.customerInitials}
                      </div>
                      <span className="font-extrabold text-slate-900">{inv.customerName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{inv.itemsSummary}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium">{inv.issueDate}</td>
                  <td className={`py-3.5 px-4 font-bold ${inv.status === 'OVERDUE' ? 'text-rose-600' : 'text-slate-700'}`}>
                    {inv.dueDate}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                    ${inv.amount.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {inv.status === 'PAID' && <Badge variant="verified" size="sm">PAID</Badge>}
                    {inv.status === 'PENDING' && <Badge variant="business" size="sm">PENDING</Badge>}
                    {inv.status === 'OVERDUE' && <Badge variant="sold" size="sm">OVERDUE</Badge>}
                    {inv.status === 'DRAFT' && <Badge variant="starter" size="sm">DRAFT</Badge>}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-400">
                      <button className="p-1 hover:text-blue-600 rounded" title="View Invoice">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 hover:text-blue-600 rounded" title="Send Mail">
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 hover:text-blue-600 rounded" title="Download PDF">
                        <Download className="w-3.5 h-3.5" />
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
            Showing <strong className="text-slate-900">{filteredInvoices.length}</strong> of <strong className="text-slate-900">1,248</strong> invoices
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

      {/* Contextual Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Branch Billing Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900">Branch Performance (Billing)</h3>
            <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-700">
              <option>Monthly</option>
              <option>Quarterly</option>
            </select>
          </div>

          <div className="h-44 w-full flex items-end justify-between gap-6 px-4 pt-2">
            {[
              { label: 'Week 1', height: '40%' },
              { label: 'Week 2', height: '65%' },
              { label: 'Week 3', height: '85%' },
              { label: 'Week 4', height: '50%' },
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-blue-100 rounded-t-xl relative overflow-hidden group" style={{ height: bar.height }}>
                  <div className="absolute inset-0 bg-blue-600 rounded-t-xl" />
                </div>
                <span className="text-[10px] font-extrabold text-slate-500">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Urgent Reminders Panel */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3 mb-3">
              Urgent Reminders
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-rose-50 border-l-4 border-rose-600 rounded-r-xl flex gap-3">
                <BellRing className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-rose-950">3 Overdue High Value</p>
                  <p className="text-rose-800 text-[11px] font-medium">Invoices above $2k are 5+ days overdue.</p>
                  <button className="text-[11px] font-extrabold text-rose-600 hover:underline mt-1">Notify Owners →</button>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl flex gap-3">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-amber-950">Tax Filing Due</p>
                  <p className="text-amber-800 text-[11px] font-medium">Export monthly billing reports by the 31st.</p>
                  <button className="text-[11px] font-extrabold text-amber-700 hover:underline mt-1">Prepare Report →</button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
