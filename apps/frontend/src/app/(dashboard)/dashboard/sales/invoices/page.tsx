'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  DollarSign,
  Eye,
  Mail,
  SlidersHorizontal,
  BellRing,
  Loader2,
  Printer,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function InvoicesRegistryPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesData, summary] = await Promise.all([
        api.getReceipts(search.trim() || undefined),
        api.getDashboardSummary(),
      ]);
      setInvoices(salesData || []);
      setSummaryData(summary || null);
    } catch (err: any) {
      console.error('Failed to load invoice registry:', err);
      setError(err.message || 'Failed to load invoice registry.');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  // Status breakdown calculations
  const counts = useMemo(() => {
    let draft = 0;
    let pending = 0;
    let paid = 0;
    let overdue = 0;
    let outstandingTotal = 0;

    invoices.forEach((inv) => {
      const st = (inv.paymentStatus || 'PAID').toUpperCase();
      if (st === 'DRAFT') draft++;
      else if (st === 'PENDING') {
        pending++;
        outstandingTotal += inv.totalAmount || 0;
      } else if (st === 'OVERDUE') {
        overdue++;
        outstandingTotal += inv.totalAmount || 0;
      } else {
        paid++;
      }
    });

    return { draft, pending, paid, overdue, outstandingTotal };
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter === 'ALL') return true;
      const st = (inv.paymentStatus || 'PAID').toUpperCase();
      return st === statusFilter;
    });
  }, [invoices, statusFilter]);

  const getCustomerInitials = (name?: string) => {
    if (!name) return 'IC';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const getItemsSummary = (items?: any[]) => {
    if (!items || items.length === 0) return 'Invoice Statement';
    return items
      .map((i) => i.description || (i.phoneRecord ? `${i.phoneRecord.brand} ${i.phoneRecord.model}` : 'Item'))
      .join(', ');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = (inv: any) => {
    const email = inv.customer?.email || '';
    const name = inv.customer?.name || 'Customer';
    const invNum = inv.invoiceNumber || inv.receiptNumber || inv.id;
    const subject = encodeURIComponent(`Invoice Statement #${invNum}`);
    const body = encodeURIComponent(
      `Hello ${name},\n\nPlease find your invoice statement #${invNum} for $${inv.totalAmount?.toFixed(2) || '0.00'}.\n\nThank you for your business!`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

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
          <Link href="/dashboard/sales/invoices/new">
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
          <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{invoices.length}</h3>
          <p className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-0.5 mt-1">
            <TrendingUp className="w-3 h-3" /> Live records
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
          <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{counts.draft}</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-1">Draft state</p>
        </div>

        {/* Pending */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Pending</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{counts.pending}</h3>
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
          <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{counts.paid}</h3>
          <p className="text-[10px] text-emerald-700 font-bold mt-1">Settled invoices</p>
        </div>

        {/* Overdue */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Overdue</p>
          <h3 className="text-xl font-extrabold text-rose-600 mt-0.5">{counts.overdue}</h3>
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
          <h3 className="text-xl font-extrabold text-white mt-0.5">${counts.outstandingTotal.toFixed(2)}</h3>
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
                <th className="py-3 px-4">Invoice / Receipt #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400 font-semibold">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading invoice registry...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-rose-500 font-semibold">
                      <AlertTriangle className="w-5 h-5" />
                      {error}
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <FileText className="w-10 h-10" />
                      <p className="font-bold text-sm text-slate-600">No invoices found</p>
                      <p className="text-xs">Create a new invoice statement to view billing records.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const invNum = inv.invoiceNumber || inv.receiptNumber || inv.id;
                  const custName = inv.customer?.name || 'Invoice Customer';
                  const dateStr = new Date(inv.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  const status = (inv.paymentStatus || 'PAID').toUpperCase();

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{invNum}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center text-[10px] border border-blue-200">
                            {getCustomerInitials(custName)}
                          </div>
                          <span className="font-extrabold text-slate-900">{custName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{getItemsSummary(inv.items)}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">{dateStr}</td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                        ${inv.totalAmount ? inv.totalAmount.toFixed(2) : '0.00'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {status === 'PAID' && <Badge variant="verified" size="sm">PAID</Badge>}
                        {status === 'PENDING' && <Badge variant="business" size="sm">PENDING</Badge>}
                        {status === 'OVERDUE' && <Badge variant="sold" size="sm">OVERDUE</Badge>}
                        {status === 'DRAFT' && <Badge variant="starter" size="sm">DRAFT</Badge>}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-400">
                          <button onClick={handlePrint} className="p-1 hover:text-blue-600 rounded" title="Print PDF">
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleEmail(inv)} className="p-1 hover:text-blue-600 rounded" title="Send Mail">
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div>
            Showing <strong className="text-slate-900">{filteredInvoices.length}</strong> of <strong className="text-slate-900">{invoices.length}</strong> invoices
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
