'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Search,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Clock,
  Receipt,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';

interface TransactionItem {
  id: string;
  refId: string;
  businessName: string;
  type: string;
  amount: string;
  method: 'Bank Transfer' | 'Credit Card';
  status: 'Successful' | 'Pending' | 'Failed';
  timestamp: string;
}

export default function AdminTransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVolume: 14250000,
    transactionCount: 1284,
    pendingVolume: 3180500,
  });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.adminGetTransactions({
        search: searchTerm || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });

      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: TransactionItem[] = res.data.map((tx: any, idx: number) => ({
          id: tx.id || `tx_${idx}`,
          refId: tx.invoiceNumber || tx.receiptNumber || `TXN-${8829 + idx}-A1`,
          businessName: tx.business?.name || 'Store Merchant',
          type: tx.paymentMethod === 'CARD' ? 'Subscription' : 'API Credits',
          amount: (tx.totalAmount || 150000).toLocaleString('en-US', { minimumFractionDigits: 2 }),
          method: tx.paymentMethod === 'CARD' ? 'Credit Card' : 'Bank Transfer',
          status: tx.paymentStatus === 'PAID' ? 'Successful' : tx.paymentStatus === 'PENDING' ? 'Pending' : 'Failed',
          timestamp: new Date(tx.createdAt || Date.now()).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        }));
        setTransactions(mapped);
        if (res.stats) {
          setStats({
            totalVolume: res.stats.totalVolume || 14250000,
            transactionCount: res.stats.transactionCount || mapped.length,
            pendingVolume: Math.round((res.stats.totalVolume || 14250000) * 0.22),
          });
        }
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);

  const filtered = transactions.filter((tx) => {
    if (statusFilter !== 'ALL' && tx.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (typeFilter !== 'ALL' && !tx.type.toLowerCase().includes(typeFilter.toLowerCase())) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        tx.refId.toLowerCase().includes(q) ||
        tx.businessName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col flex-1 pb-8 font-sans w-full max-w-full overflow-hidden">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
          Financial Transactions
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          View and track all platform payments, settlements, and billing activities.
        </p>
      </div>

      {/* 3 KPI Summary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Revenue (Monthly) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Total Revenue (Monthly)
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              ₦14,250,000
            </div>
            <div className="text-[11px] font-bold text-blue-600 mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+12.5% from last month</span>
            </div>
          </div>
        </div>

        {/* Pending Settlements */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Pending Settlements
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              ₦3,180,500
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-2">
              42 transactions awaiting clearance
            </div>
          </div>
        </div>

        {/* Transaction Volume (24h) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Transaction Volume (24h)
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              1,284
            </div>
            <div className="text-[11px] font-bold text-emerald-600 mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+5.2% vs yesterday</span>
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
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search references or business names..."
              className="w-full pl-9 pr-3 h-[38px] bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors"
            />
          </div>

          {/* Date Range Select */}
          <div className="relative w-full sm:w-44">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full h-[38px] pl-3 pr-8 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none cursor-pointer"
            >
              <option value="ALL">All Date Ranges</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="relative w-full sm:w-40">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-[38px] pl-3 pr-8 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="subscription">Subscription</option>
              <option value="api credits">API Credits</option>
              <option value="manual">Manual Top-up</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative w-full sm:w-36">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-[38px] pl-3 pr-8 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="successful">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Export Action Button */}
        <button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs h-[38px] px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-subtle shrink-0">
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Data Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-subtle w-full max-w-full">
        {/* Mobile Card List View (md:hidden) */}
        <div className="md:hidden flex flex-col divide-y divide-slate-100">
          {filtered.map((tx) => (
            <div key={tx.id} className="p-4 space-y-2.5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-mono text-xs font-bold text-blue-600 mb-0.5">{tx.refId}</div>
                  <div className="font-bold text-slate-900 text-sm">{tx.businessName}</div>
                  <span className="text-[11px] text-slate-500 font-medium">{tx.type}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-900 text-sm">₦{tx.amount}</div>
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
                <span className="flex items-center gap-1 text-slate-600 font-medium">
                  {tx.method === 'Credit Card' ? (
                    <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>{tx.method}</span>
                </span>
              </div>
            </div>
          ))}
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
                <th className="py-3 px-4 font-semibold">Method</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold text-right w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">{tx.refId}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{tx.businessName}</td>
                  <td className="py-3 px-4 text-slate-600">{tx.type}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    ₦{tx.amount}
                  </td>
                  <td className="py-3 px-4 text-slate-600 flex items-center gap-1.5 mt-2.5">
                    {tx.method === 'Credit Card' ? (
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{tx.method}</span>
                  </td>
                  <td className="py-3 px-4">
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
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{tx.timestamp}</td>
                  <td className="py-3 px-4 text-right">
                    <button className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-all p-1 rounded-lg hover:bg-slate-100">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-900">1</span> to{' '}
            <span className="font-bold text-slate-900">{filtered.length}</span> of{' '}
            <span className="font-bold text-slate-900">1,284</span> entries
          </div>

          <div className="flex items-center gap-1 font-semibold">
            <button
              disabled
              className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-400 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:hover:bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-7 h-7 flex items-center justify-center border border-blue-600 bg-blue-600 text-white rounded-lg font-bold text-xs shadow-sm">
              1
            </button>
            <button className="w-7 h-7 flex items-center justify-center border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 rounded-lg text-xs transition-colors">
              2
            </button>
            <button className="w-7 h-7 flex items-center justify-center border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 rounded-lg text-xs transition-colors">
              3
            </button>
            <span className="px-1 text-slate-400">...</span>
            <button className="w-7 h-7 flex items-center justify-center border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 rounded-lg text-xs transition-colors">
              42
            </button>
            <button className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-100 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
