'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Search,
  Download,
  Plus,
  TrendingUp,
  Printer,
  Mail,
  CreditCard,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function ReceiptsArchivePage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);

  const [search, setSearch] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [receiptsData, summary] = await Promise.all([
        api.getReceipts(search.trim() || undefined),
        api.getDashboardSummary(),
      ]);
      setReceipts(receiptsData || []);
      setSummaryData(summary || null);
    } catch (err: any) {
      console.error('Failed to load receipts archive:', err);
      setError(err.message || 'Failed to load receipts archive.');
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  // Debounced search trigger
  useEffect(() => {
    const t = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  // Filtered receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter((rcp) => {
      if (paymentMethodFilter === 'ALL') return true;
      return rcp.paymentMethod === paymentMethodFilter;
    });
  }, [receipts, paymentMethodFilter]);

  const getCustomerInitials = (name?: string) => {
    if (!name) return 'RB';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const getItemSummary = (items?: any[]) => {
    if (!items || items.length === 0) return 'No items recorded';
    return items
      .map((i) => i.description || (i.phoneRecord ? `${i.phoneRecord.brand} ${i.phoneRecord.model}` : 'Item'))
      .join(', ');
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleEmailReceipt = (rcp: any) => {
    if (!rcp) return;
    const email = rcp.customer?.email || '';
    const name = rcp.customer?.name || 'Valued Customer';
    const rcpNum = rcp.receiptNumber || rcp.invoiceNumber || rcp.id;
    const subject = encodeURIComponent(`Receipt & Sales Record #${rcpNum}`);
    const body = encodeURIComponent(
      `Hello ${name},\n\nThank you for your purchase! Your sales receipt #${rcpNum} for $${rcp.totalAmount?.toFixed(2) || '0.00'} is confirmed.\n\nThank you for your business!`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

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

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Receipts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Receipt className="w-4 h-4" />
            </div>
            <span className="text-emerald-700 font-extrabold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Live
            </span>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Total Sales Count</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
            {summaryData?.kpis ? summaryData.kpis.totalSalesCount.toLocaleString() : receipts.length}
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-1">Archived in store database</p>
        </div>

        {/* Revenue Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
            <span className="text-emerald-700 font-extrabold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Live Revenue
            </span>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Total Revenue</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
            {summaryData?.kpis ? `$${summaryData.kpis.totalSalesRevenue.toLocaleString()}` : '$0.00'}
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-1">Total settled transactions</p>
        </div>

        {/* Average Sale */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Average Sale</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
            {summaryData?.kpis && summaryData.kpis.totalSalesCount > 0
              ? `$${(summaryData.kpis.totalSalesRevenue / summaryData.kpis.totalSalesCount).toFixed(2)}`
              : '$0.00'}
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-1">Average per sales receipt</p>
        </div>

        {/* Active Store */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Store Status</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
            {summaryData?.business?.name || 'Main Branch'}
          </h3>
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
            {['ALL', 'CASH', 'CARD', 'BANK_TRANSFER'].map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethodFilter(method)}
                className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                  paymentMethodFilter === method
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {method.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">Receipt / Invoice #</th>
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
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400 font-semibold">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading receipts archive...
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
              ) : filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Receipt className="w-10 h-10" />
                      <p className="font-bold text-sm text-slate-600">No receipts found</p>
                      <p className="text-xs">Process a new sale at the POS terminal to generate receipts.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((rcp) => {
                  const displayNum = rcp.receiptNumber || rcp.invoiceNumber || rcp.id;
                  const customerName = rcp.customer?.name || 'Retail Buyer';
                  const dateStr = new Date(rcp.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={rcp.id}
                      onClick={() => setSelectedReceipt(rcp)}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{displayNum}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center text-[10px] border border-blue-200">
                            {getCustomerInitials(customerName)}
                          </div>
                          <span className="font-extrabold text-slate-900">{customerName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{getItemSummary(rcp.items)}</td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        ${rcp.totalAmount ? rcp.totalAmount.toFixed(2) : '0.00'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-semibold flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" /> {rcp.paymentMethod || 'CASH'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">{dateStr}</td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant="verified" size="sm">{rcp.paymentStatus || 'PAID'}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 text-slate-400 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePrintReceipt(); }}
                            className="p-1.5 hover:text-blue-600 rounded"
                            title="Print Thermal"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEmailReceipt(rcp); }}
                            className="p-1.5 hover:text-blue-600 rounded"
                            title="Email Receipt"
                          >
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
            Showing <strong className="text-slate-900">{filteredReceipts.length}</strong> of <strong className="text-slate-900">{receipts.length}</strong> receipts
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
                  <p className="font-extrabold text-sm text-slate-900">VERIFYFLOW POS RECEIPT</p>
                  <p className="text-[10px] text-slate-500 font-sans">
                    {summaryData?.business?.name || 'Main Branch'}
                  </p>
                </div>

                <div className="border-y border-slate-200 py-2 flex justify-between text-[11px]">
                  <span>{selectedReceipt.receiptNumber || selectedReceipt.invoiceNumber || selectedReceipt.id}</span>
                  <span>{new Date(selectedReceipt.createdAt).toLocaleDateString('en-US')}</span>
                </div>

                <div className="space-y-2 py-1">
                  {selectedReceipt.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{item.description || (item.phoneRecord ? `${item.phoneRecord.brand} ${item.phoneRecord.model}` : 'Item')}</p>
                        {item.phoneRecord?.imei1 && (
                          <p className="text-[9px] text-slate-500">IMEI: {item.phoneRecord.imei1}</p>
                        )}
                      </div>
                      <span className="font-bold text-slate-900">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between font-extrabold text-sm border-t border-slate-200 pt-2 text-slate-900">
                  <span>TOTAL PAID</span>
                  <span className="text-blue-600">${selectedReceipt.totalAmount?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <Button variant="primary" fullWidth size="lg" onClick={handlePrintReceipt} leftIcon={<Printer className="w-4 h-4" />}>
                Print Thermal Receipt
              </Button>
              <Button variant="secondary" fullWidth size="md" onClick={() => handleEmailReceipt(selectedReceipt)} leftIcon={<Mail className="w-4 h-4" />}>
                Email Receipt to Customer
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
