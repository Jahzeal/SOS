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
  QrCode,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmailReceiptModal } from '@/components/sales/EmailReceiptModal';
import { api } from '@/lib/api';
import { useReceipts, useInventorySummary } from '@/hooks/useDashboardQueries';

export default function ReceiptsArchivePage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [receiptForEmailModal, setReceiptForEmailModal] = useState<any | null>(null);
  const [receiptToPrint, setReceiptToPrint] = useState<any | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Handle triggered print
  useEffect(() => {
    if (receiptToPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [receiptToPrint]);

  // Cached receipts query (instant 0ms switch)
  const {
    data: receipts = [],
    isLoading: loading,
    error: queryError,
  } = useReceipts(debouncedSearch || undefined);

  // Cached summary query
  const { data: summaryData } = useInventorySummary();
  const error = queryError ? (queryError as any).message || 'Failed to load receipts archive.' : null;

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

  const handlePrintReceipt = (rcp?: any) => {
    const target = rcp || selectedReceipt;
    if (!target) return;
    setReceiptToPrint(target);
  };

  const handleEmailReceipt = (rcp: any) => {
    if (!rcp) return;
    setReceiptForEmailModal(rcp);
  };

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8 relative">

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Receipts Archive
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 font-medium max-w-xl mt-1 leading-relaxed">
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
        {/* Total Sales Count */}
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
          {loading && !summaryData ? (
            <div className="h-7 w-16 bg-slate-200/60 rounded-md animate-pulse mt-1" />
          ) : (
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {summaryData?.kpis ? summaryData.kpis.totalSalesCount.toLocaleString() : receipts.length}
            </h3>
          )}
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
          {loading && !summaryData ? (
            <div className="h-7 w-24 bg-slate-200/60 rounded-md animate-pulse mt-1" />
          ) : (
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {summaryData?.kpis ? `₦${summaryData.kpis.totalSalesRevenue.toLocaleString()}` : (receipts.length > 0 ? `₦${receipts.reduce((s: number, r: any) => s + (r.totalAmount || 0), 0).toLocaleString()}` : '—')}
            </h3>
          )}
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
          {loading && !summaryData ? (
            <div className="h-7 w-20 bg-slate-200/60 rounded-md animate-pulse mt-1" />
          ) : (
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {summaryData?.kpis && summaryData.kpis.totalSalesCount > 0
                ? `₦${Math.round(summaryData.kpis.totalSalesRevenue / summaryData.kpis.totalSalesCount).toLocaleString()}`
                : (receipts.length > 0 ? `₦${Math.round(receipts.reduce((s: number, r: any) => s + (r.totalAmount || 0), 0) / receipts.length).toLocaleString()}` : '—')}
            </h3>
          )}
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
          {loading && !summaryData ? (
            <div className="h-7 w-24 bg-slate-200/60 rounded-md animate-pulse mt-1" />
          ) : (
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {summaryData?.business?.name || 'Main Branch'}
            </h3>
          )}
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

        {/* Mobile Cards View (Hidden on desktop) */}
        <div className="block sm:hidden divide-y divide-slate-100 bg-white">
          {loading ? (
            <div className="py-16 text-center">
              <div className="flex items-center justify-center gap-2 text-slate-400 font-semibold text-xs">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading receipts archive...
              </div>
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <div className="flex items-center justify-center gap-2 text-rose-500 font-semibold text-xs">
                <AlertTriangle className="w-5 h-5" />
                {error}
              </div>
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs animate-in fade-in duration-200">
              <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-600">No receipts found</p>
              <p>Process a new sale at the POS terminal to generate receipts.</p>
            </div>
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
                <div key={rcp.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center text-[10px] border border-blue-200 shrink-0">
                        {getCustomerInitials(customerName)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{customerName}</h4>
                        <p className="text-[10px] text-slate-400 font-mono font-bold text-blue-600">{displayNum}</p>
                      </div>
                    </div>
                    {/* Status & Method Badges */}
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={rcp.paymentStatus === 'PAID' ? 'verified' : rcp.paymentStatus === 'PENDING' ? 'business' : 'error'} size="sm">
                        {rcp.paymentStatus || 'PAID'}
                      </Badge>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">{rcp.paymentMethod || 'CASH'}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed">{getItemSummary(rcp.items)}</p>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Date</span>
                      <span className="font-bold text-slate-800 text-[11px]">{dateStr}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Total Paid</span>
                      <span className="font-extrabold text-slate-900 text-[13px]">
                        ₦{rcp.totalAmount ? rcp.totalAmount.toLocaleString() : '0'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
                    <button onClick={() => handlePrintReceipt(rcp)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition font-bold text-[11px] flex items-center gap-1">
                      <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                    <button onClick={() => handleEmailReceipt(rcp)} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition font-bold text-[11px] flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> Send
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View (Hidden on mobile) */}
        <div className="hidden sm:block overflow-x-auto">
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
                        ₦{rcp.totalAmount ? rcp.totalAmount.toLocaleString() : '0'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-semibold flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" /> {rcp.paymentMethod || 'CASH'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">{dateStr}</td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={rcp.paymentStatus === 'PAID' ? 'verified' : rcp.paymentStatus === 'PENDING' ? 'business' : 'error'} size="sm">
                          {rcp.paymentStatus || 'PAID'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 text-slate-400 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePrintReceipt(rcp); }}
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

      {/* Slide-over Receipt Details Drawer */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Receipt Details</h3>
                    <p className="text-[10px] text-slate-400 font-mono font-bold text-blue-600">
                      {selectedReceipt.receiptNumber || selectedReceipt.invoiceNumber || selectedReceipt.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Receipt Preview Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs space-y-3">
                <div className="text-center border-b border-slate-200 pb-3">
                  <h4 className="font-extrabold text-sm text-slate-900">
                    {selectedReceipt.business?.name || summaryData?.business?.name || 'NOXGUARDA STORE'}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    {selectedReceipt.business?.address || 'Ikeja Digital Village, Lagos'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {selectedReceipt.business?.phone || '+234 800 000 0000'}
                  </p>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date:</span>
                    <span className="font-bold text-slate-800">{new Date(selectedReceipt.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Customer:</span>
                    <span className="font-bold text-slate-800">{selectedReceipt.customer?.name || 'Retail Buyer'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Method:</span>
                    <span className="font-bold text-slate-800 uppercase">{selectedReceipt.paymentMethod || 'CASH'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className={`font-bold ${selectedReceipt.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {selectedReceipt.paymentStatus || 'PAID'}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t border-b border-slate-200 py-2 space-y-2">
                  {(selectedReceipt.items || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start text-[11px]">
                      <div>
                        <p className="font-bold text-slate-900">{item.description || (item.phoneRecord ? `${item.phoneRecord.brand} ${item.phoneRecord.model}` : 'Item')}</p>
                        {item.phoneRecord?.imei1 && (
                          <p className="text-[9px] text-slate-500">IMEI: {item.phoneRecord.imei1}</p>
                        )}
                      </div>
                      <span className="font-bold text-slate-900">₦{((item.unitPrice || 0) * (item.quantity || 1)).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between font-extrabold text-sm border-t border-slate-200 pt-2 text-slate-900">
                  <span>TOTAL PAID</span>
                  <span className="text-teal-700">₦{selectedReceipt.totalAmount?.toLocaleString() || '0'}</span>
                </div>


                <div className="pt-2 text-center text-[10px] text-slate-500 font-sans border-t border-slate-200 leading-snug">
                  {selectedReceipt.business?.receiptFooter || 'Thank you for your purchase! Devices verified with NoxGuarda.'}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <Button variant="primary" fullWidth size="lg" onClick={() => handlePrintReceipt(selectedReceipt)} leftIcon={<Printer className="w-4 h-4" />}>
                Print Thermal Receipt
              </Button>
              <Button variant="secondary" fullWidth size="md" onClick={() => handleEmailReceipt(selectedReceipt)} leftIcon={<Mail className="w-4 h-4" />}>
                Email Receipt to Customer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Printable Receipt for Clean 80mm Thermal Printer Output */}
      {(() => {
        const rcp = receiptToPrint || selectedReceipt;
        if (!rcp) return null;
        const displayNum = rcp.receiptNumber || rcp.invoiceNumber || (rcp.id ? `REC-${rcp.id.slice(0, 8).toUpperCase()}` : 'RECEIPT');
        const bizName = rcp.business?.name || summaryData?.business?.name || 'NOXGUARDA STORE';
        const bizAddress = rcp.business?.address || summaryData?.business?.address || 'Ikeja Digital Village, Lagos';
        const bizPhone = rcp.business?.phone || summaryData?.business?.phone || '+234 800 000 0000';
        const bizFooter = rcp.business?.receiptFooter || 'Thank you for your purchase! 30-Day Store Warranty included. Official IMEI verified on NoxGuarda Registry.';

        return (
          <div id="printable-pos-receipt" className="hidden font-mono">
            <div className="text-center pb-2 border-b border-black mb-2">
              <h2 className="font-extrabold text-sm uppercase tracking-wide">{bizName}</h2>
              <p className="text-[10px]">{bizAddress}</p>
              <p className="text-[10px]">Tel: {bizPhone}</p>
            </div>

            <div className="space-y-1 text-[10px] pb-2 border-b border-black mb-2">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-bold">{displayNum}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(rcp.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-bold">{rcp.customer?.name || 'Retail Buyer'}</span>
              </div>
              {rcp.customer?.phone && (
                <div className="flex justify-between">
                  <span>Phone:</span>
                  <span>{rcp.customer.phone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-bold uppercase">{rcp.paymentMethod || 'CASH'}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-bold uppercase">{rcp.paymentStatus || 'PAID'}</span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-1.5 text-[10px] pb-2 border-b border-black mb-2">
              {(rcp.items || []).map((item: any, idx: number) => {
                const itemTitle = item.description || (item.phoneRecord ? `${item.phoneRecord.brand} ${item.phoneRecord.model}` : 'Item');
                const qty = item.quantity || 1;
                const price = item.unitPrice || item.price || 0;
                const total = price * qty;
                const imei = item.phoneRecord?.imei1 || item.imei;

                return (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span>{itemTitle} {qty > 1 ? `x${qty}` : ''}</span>
                      <span>₦{total.toLocaleString()}</span>
                    </div>
                    {imei && (
                      <p className="text-[9px] text-slate-700">IMEI: {imei}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div className="text-xs font-black flex justify-between pb-2 border-b border-black mb-2">
              <span>TOTAL PAID</span>
              <span>₦{Number(rcp.totalAmount || 0).toLocaleString()}</span>
            </div>

            {/* QR Code & Anti Theft info */}
            <div className="text-center pt-2 space-y-1 text-[9px]">
              <p className="font-bold">NoxGuarda Anti-Theft Protection</p>
              <p className="text-[8px]">Scan or verify IMEI at noxguarda.com/verify</p>
              <p className="pt-1 text-[8px] italic leading-tight">{bizFooter}</p>
            </div>
          </div>
        );
      })()}

      {/* Global Print Styling for Clean POS Roll Output */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-pos-receipt,
          #printable-pos-receipt * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-pos-receipt {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
            padding: 12px !important;
            box-shadow: none !important;
            border: 1px dashed #000000 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11px !important;
            line-height: 1.35 !important;
            z-index: 99999 !important;
          }
        }
      `}</style>

      {/* Email Receipt Modal */}
      <EmailReceiptModal
        isOpen={Boolean(receiptForEmailModal)}
        onClose={() => setReceiptForEmailModal(null)}
        receipt={receiptForEmailModal}
      />

    </div>
  );
}
