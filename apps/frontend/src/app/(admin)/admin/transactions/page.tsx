'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  Search,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Clock,
  Receipt,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Building,
  Landmark,
  Banknote,
  Terminal,
  Layers,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

export type PaymentMethodType = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'POS' | 'SPLIT';

interface TransactionItem {
  id: string;
  refId: string;
  businessName: string;
  type: string;
  amount: number;
  method: PaymentMethodType;
  status: 'Successful' | 'Pending' | 'Failed';
  timestamp: string;
}

export default function AdminTransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [stats, setStats] = useState({
    totalVolume: 0,
    transactionCount: 0,
    pendingVolume: 0,
    pendingCount: 0,
    last24hCount: 0,
  });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.adminGetTransactions({
        search: searchTerm.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        paymentMethod: paymentMethodFilter !== 'ALL' ? paymentMethodFilter : undefined,
        page,
        limit: 20,
      });

      if (res?.success && Array.isArray(res.data)) {
        const mapped: TransactionItem[] = res.data.map((tx: any, idx: number) => {
          const rawMethod = (tx.paymentMethod || 'CASH').toUpperCase();
          const validMethod: PaymentMethodType =
            rawMethod === 'CARD'
              ? 'CARD'
              : rawMethod === 'BANK_TRANSFER' || rawMethod === 'TRANSFER'
              ? 'BANK_TRANSFER'
              : rawMethod === 'POS'
              ? 'POS'
              : rawMethod === 'SPLIT'
              ? 'SPLIT'
              : 'CASH';

          return {
            id: tx.id || `tx_${idx}`,
            refId: tx.invoiceNumber || tx.receiptNumber || `TXN-${8829 + idx}`,
            businessName: tx.business?.name || 'Store Merchant',
            type: tx.items?.length ? `${tx.items.length} item(s) sale` : 'Store POS Sale',
            amount: Number(tx.totalAmount) || 0,
            method: validMethod,
            status: tx.paymentStatus === 'PAID' ? 'Successful' : tx.paymentStatus === 'PENDING' ? 'Pending' : 'Failed',
            timestamp: tx.createdAt
              ? new Date(tx.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'N/A',
          };
        });

        setTransactions(mapped);
        setTotalPages(res.totalPages || 1);
        setTotalRecords(res.total || 0);
        if (res.stats) {
          setStats({
            totalVolume: Number(res.stats.totalVolume) || 0,
            transactionCount: Number(res.stats.transactionCount) || 0,
            pendingVolume: Number(res.stats.pendingVolume) || 0,
            pendingCount: Number(res.stats.pendingCount) || 0,
            last24hCount: Number(res.stats.last24hCount) || 0,
          });
        }
      } else {
        setTransactions([]);
        setTotalPages(1);
        setTotalRecords(0);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, paymentMethodFilter, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const renderPaymentMethod = (method: PaymentMethodType) => {
    switch (method) {
      case 'CARD':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-100">
            <CreditCard className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Card Payment</span>
          </span>
        );
      case 'BANK_TRANSFER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-semibold text-[11px] border border-indigo-100">
            <Landmark className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Bank Transfer</span>
          </span>
        );
      case 'POS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 font-semibold text-[11px] border border-purple-100">
            <Terminal className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>POS Terminal</span>
          </span>
        );
      case 'SPLIT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 font-semibold text-[11px] border border-amber-100">
            <Layers className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Split Payment</span>
          </span>
        );
      case 'CASH':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-100">
            <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Cash</span>
          </span>
        );
    }
  };

  const handleExportCsv = () => {
    if (transactions.length === 0) {
      alert('No transactions to export.');
      return;
    }
    const headers = ['Reference ID,Business Name,Type,Amount (NGN),Method,Status,Date'];
    const rows = transactions.map(
      (t) => `"${t.refId}","${t.businessName}","${t.type}","${t.amount}","${t.method}","${t.status}","${t.timestamp}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transactions_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col flex-1 pb-8 font-sans w-full max-w-full overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
            Financial Transactions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Live database ledger of all platform payments, settlements, and sales activities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTransactions}
            title="Refresh Transactions"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-slate-600 flex items-center justify-center transition shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3 KPI Summary Metric Cards (100% Real DB Data) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Processed Volume */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Total Processed Volume
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              ₦{stats.totalVolume.toLocaleString()}
            </div>
            <div className="text-[11px] font-bold text-blue-600 mt-2 flex items-center gap-1">
              <span>{stats.transactionCount} total recorded transactions</span>
            </div>
          </div>
        </div>

        {/* Pending Settlements */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Pending Volume
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              ₦{stats.pendingVolume.toLocaleString()}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-2">
              {stats.pendingCount} transaction(s) pending payment
            </div>
          </div>
        </div>

        {/* 24h Activity */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Activity (Last 24h)
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.last24hCount}
            </div>
            <div className="text-[11px] font-bold text-emerald-600 mt-2 flex items-center gap-1">
              <span>Transactions logged in the last 24 hours</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Controls / Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between mb-6 shadow-subtle">
        <div className="flex flex-col sm:flex-row flex-1 gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search references or business names..."
              className="w-full pl-9 pr-3 h-[38px] bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors"
            />
          </div>

          {/* Payment Method Filter */}
          <div className="relative w-full sm:w-48">
            <select
              value={paymentMethodFilter}
              onChange={(e) => {
                setPaymentMethodFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-[38px] pl-3 pr-8 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none cursor-pointer"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="CARD">Card Payment</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="POS">POS Terminal</option>
              <option value="CASH">Cash</option>
              <option value="SPLIT">Split Payment</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative w-full sm:w-44">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-[38px] pl-3 pr-8 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Successful (Paid)</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {/* Export Action Button */}
        <button
          onClick={handleExportCsv}
          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs h-[38px] px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-subtle shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Data Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-subtle w-full max-w-full">
        {/* Mobile Card List View (md:hidden) */}
        <div className="md:hidden flex flex-col divide-y divide-slate-100">
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <div key={tx.id} className="p-4 space-y-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono text-xs font-bold text-blue-600 mb-0.5">{tx.refId}</div>
                    <div className="font-bold text-slate-900 text-sm">{tx.businessName}</div>
                    <span className="text-[11px] text-slate-500 font-medium">{tx.type}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900 text-sm">
                      ₦{tx.amount.toLocaleString()}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full text-[10px] font-bold uppercase ${
                        tx.status === 'Successful'
                          ? 'bg-[#e6f4ea] text-[#137333] border border-[#ceead6]'
                          : tx.status === 'Pending'
                          ? 'bg-[#fff8e1] text-[#b08d00] border border-[#ffe082]'
                          : 'bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf]'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400 font-mono pt-2 border-t border-slate-100">
                  <span>{tx.timestamp}</span>
                  <div>{renderPaymentMethod(tx.method)}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              {loading ? 'Loading transactions...' : 'No transactions recorded in database.'}
            </div>
          )}
        </div>

        {/* Desktop Table View (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto w-full max-w-full custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs min-w-[800px]">
            <thead className="bg-slate-50/80 sticky top-0 z-10 border-b border-slate-200 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Reference ID</th>
                <th className="py-3 px-4 font-semibold">Business Name</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
                <th className="py-3 px-4 font-semibold text-center">Payment Method</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{tx.refId}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{tx.businessName}</td>
                    <td className="py-3 px-4 text-slate-600">{tx.type}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₦{tx.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {renderPaymentMethod(tx.method)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          tx.status === 'Successful'
                            ? 'bg-[#e6f4ea] text-[#137333] border border-[#ceead6]'
                            : tx.status === 'Pending'
                            ? 'bg-[#fff8e1] text-[#b08d00] border border-[#ffe082]'
                            : 'bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf]'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px]">
                      {tx.timestamp}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    {loading ? 'Loading transactions...' : 'No transactions recorded in database.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-900">{transactions.length > 0 ? (page - 1) * 20 + 1 : 0}</span> to{' '}
            <span className="font-bold text-slate-900">{(page - 1) * 20 + transactions.length}</span> of{' '}
            <span className="font-bold text-slate-900">{totalRecords}</span> entries
          </div>

          <div className="flex items-center gap-1 font-semibold">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
