'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  Download,
  Trash2,
  ChevronRight,
  MoreVertical,
  RefreshCw,
  Eye,
  Edit,
  ArrowRight,
  Receipt,
  FileText,
  AlertCircle,
  XCircle,
  Loader2,
  Mail,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useQuotes, useDashboardCacheUtils } from '@/hooks/useDashboardQueries';
import { useQuery } from '@tanstack/react-query';

interface QuoteItem {
  id: string;
  description: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  totalPrice: number;
  phoneRecord?: {
    brand: string;
    model: string;
    imei1: string;
  };
}

interface Quote {
  id: string;
  quoteNumber: string;
  subject?: string;
  quoteDate: string;
  expiryDate?: string;
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  hasInstallments: boolean;
  sendCustomerReminders: boolean;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CONVERTED' | 'PARTIALLY_PAID';
  notes?: string;
  terms?: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  installments?: Array<{
    id: string;
    installmentNo: number;
    amountDue: number;
    amountPaid: number;
    dueDate: string;
    status: string;
  }>;
  items: QuoteItem[];
  convertedSale?: {
    id: string;
    invoiceNumber: string;
    receiptNumber?: string;
  };
  createdAt: string;
}

export default function QuotesRegistryPage() {
  const router = useRouter();
  const { invalidateQuotes, invalidateInvoices } = useDashboardCacheUtils();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Cached persistent queries
  const { data: rawQuotes = [], isLoading: loadingQuotes, refetch: loadQuotes } = useQuotes(debouncedSearch);
  const { data: stats } = useQuery({
    queryKey: ['quote-stats'],
    queryFn: async () => await api.getQuoteStats(),
    staleTime: 5 * 60 * 1000,
  });

  // Filter quotes in memory
  const quotes = useMemo(() => {
    if (statusFilter === 'ALL') return rawQuotes;
    return rawQuotes.filter((q: Quote) => q.status === statusFilter);
  }, [rawQuotes, statusFilter]);

  const loading = loadingQuotes && rawQuotes.length === 0;

  const [selectedQuoteForEmail, setSelectedQuoteForEmail] = useState<Quote | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccessMessage, setEmailSuccessMessage] = useState<string | null>(null);

  // Payment Recording Modal State
  const [selectedQuoteForPayment, setSelectedQuoteForPayment] = useState<Quote | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('TRANSFER');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // Reminder Modal State
  const [selectedQuoteForReminder, setSelectedQuoteForReminder] = useState<Quote | null>(null);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [reminderResult, setReminderResult] = useState<any>(null);

  const [convertingQuoteId, setConvertingQuoteId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleConvertToSale = async (quote: Quote) => {
    if (!confirm(`Convert Quotation ${quote.quoteNumber} into a Commercial Invoice / Sale? This will generate the invoice and lock device inventory.`)) {
      return;
    }

    setConvertingQuoteId(quote.id);
    try {
      const res = await api.convertQuoteToSale(quote.id, { asInvoice: true });
      if (res?.sale?.id) {
        router.push(`/dashboard/invoices`);
      } else {
        await loadQuotes();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to convert quotation to invoice.');
    } finally {
      setConvertingQuoteId(null);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedQuoteForEmail) return;
    setIsSendingEmail(true);
    setEmailSuccessMessage(null);
    try {
      await api.sendQuoteEmail(selectedQuoteForEmail.id, emailInput.trim() || undefined);
      setEmailSuccessMessage(`Quotation ${selectedQuoteForEmail.quoteNumber} successfully emailed with attached PDF!`);
      setTimeout(() => {
        setSelectedQuoteForEmail(null);
        setEmailSuccessMessage(null);
        loadQuotes();
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to send quotation email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleRecordPaymentSubmit = async () => {
    if (!selectedQuoteForPayment) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid deposit or payment amount.');
      return;
    }

    setIsRecordingPayment(true);
    try {
      await api.recordQuotePayment(selectedQuoteForPayment.id, {
        amount,
        paymentMethod,
        reference: paymentRef.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
      });
      alert(`Payment of ₦${amount.toLocaleString()} recorded successfully!`);
      setSelectedQuoteForPayment(null);
      setPaymentAmount('');
      setPaymentRef('');
      setPaymentNotes('');
      loadQuotes();
    } catch (err: any) {
      alert(err.message || 'Failed to record payment.');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleSendReminderSubmit = async (quote: Quote) => {
    setIsSendingReminder(true);
    setSelectedQuoteForReminder(quote);
    setReminderResult(null);
    try {
      const res = await api.sendQuoteInstallmentReminder(quote.id);
      setReminderResult(res);
      loadQuotes();
    } catch (err: any) {
      alert(err.message || 'Failed to send payment reminder.');
      setSelectedQuoteForReminder(null);
    } finally {
      setIsSendingReminder(false);
    }
  };

  const handleDelete = async (quote: Quote) => {
    if (!confirm(`Are you sure you want to delete quotation ${quote.quoteNumber}? This cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteQuote(quote.id);
      invalidateQuotes();
    } catch (err: any) {
      alert(err.message || 'Failed to delete quotation.');
    }
  };

  const getStatusBadge = (status: Quote['status']) => {
    switch (status) {
      case 'DRAFT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">DRAFT</span>;
      case 'SENT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">SENT</span>;
      case 'PARTIALLY_PAID':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300">PARTIAL DEPOSIT</span>;
      case 'ACCEPTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">ACCEPTED</span>;
      case 'CONVERTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">CONVERTED</span>;
      case 'DECLINED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">DECLINED</span>;
      case 'EXPIRED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">EXPIRED</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8">

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <nav className="flex items-center text-xs font-semibold text-slate-500 gap-1 mb-1">
            <Link href="/dashboard" className="hover:text-slate-900 transition">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900 font-bold">Sales & Invoices</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-blue-600 font-bold">Quotations & Estimates</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Quotations & Commercial Estimates
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mt-1 leading-relaxed">
            Create, manage, and email formal price proposals for phones, electronics, and repair services with 1-click invoice conversion.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/dashboard/templates">
            <Button variant="secondary" size="md" className="font-bold border-slate-200 text-slate-700 hover:bg-slate-50">
              Customize Template
            </Button>
          </Link>
          <Link href="/dashboard/quotes/new">
            <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />} className="bg-blue-600 hover:bg-blue-500 font-bold shadow-md shadow-blue-600/20">
              Create New Quote
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Quoted Value</span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            ₦{(stats?.totalQuotedAmount || 0).toLocaleString()}
          </p>
          <p className="text-[11px] font-semibold text-slate-400">
            Across {stats?.totalQuotesCount || 0} total proposals
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Accepted / Won</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
            ₦{(stats?.acceptedAmount || 0).toLocaleString()}
          </p>
          <p className="text-[11px] font-semibold text-slate-400">
            {stats?.acceptedCount || 0} quotes approved
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Active / Pending</span>
          <p className="text-xl sm:text-2xl font-black text-blue-600 font-mono">
            {stats?.activeCount || 0}
          </p>
          <p className="text-[11px] font-semibold text-slate-400">
            Awaiting client confirmation
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Win Rate</span>
          <p className="text-xl sm:text-2xl font-black text-purple-600 font-mono">
            {stats?.conversionRate || 0}%
          </p>
          <p className="text-[11px] font-semibold text-slate-400">
            {stats?.convertedCount || 0} converted to sales
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by quote number, subject, customer name, phone, or email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
          {['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'CONVERTED', 'EXPIRED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Quotes' : st}
            </button>
          ))}

          <button
            onClick={() => loadQuotes()}
            title="Refresh Quotes"
            className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition shrink-0 ml-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quotes Table List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-bold">Loading quotations registry...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="py-16 text-center px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">No quotations found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'ALL'
                ? 'No quotes match your current filters. Try changing your search keywords.'
                : 'Create your first price proposal to send out formal quotes and track won deals.'}
            </p>
            <div className="pt-2">
              <Link href="/dashboard/quotes/new">
                <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Create First Quote
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {/* Mobile Quote Cards (Visible on mobile < md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {quotes.map((quote) => {
                const isConverted = quote.status === 'CONVERTED';
                const formattedDate = new Date(quote.quoteDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                const expiryDateStr = quote.expiryDate
                  ? new Date(quote.expiryDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : null;

                return (
                  <div key={quote.id} className="p-4 space-y-3 bg-white hover:bg-slate-50/50 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/quotes/${quote.id}`}
                            className="font-black text-blue-600 hover:text-blue-700 font-mono text-sm"
                          >
                            {quote.quoteNumber}
                          </Link>
                          {getStatusBadge(quote.status)}
                        </div>
                        <p className="font-bold text-slate-900 text-xs mt-1">
                          {quote.customer?.name || 'Walk-in / General Client'}
                        </p>
                        {quote.customer?.phone && (
                          <p className="text-[11px] text-slate-400 font-mono">{quote.customer.phone}</p>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="font-black text-slate-900 font-mono text-base block">
                          ₦{quote.totalAmount.toLocaleString()}
                        </span>
                        {quote.amountPaid > 0 && (
                          <span className="text-[10px] text-emerald-600 font-mono font-bold block">
                            Paid: ₦{quote.amountPaid.toLocaleString()}
                          </span>
                        )}
                        {quote.balanceDue > 0 && quote.amountPaid > 0 && (
                          <span className="text-[10px] text-amber-700 font-mono font-bold block">
                            Due: ₦{quote.balanceDue.toLocaleString()}
                          </span>
                        )}
                        {quote.discount > 0 && (
                          <span className="text-[10px] text-rose-500 font-mono block">
                            Disc: -₦{quote.discount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
                      <p className="font-medium text-slate-800 line-clamp-1">
                        <strong className="text-slate-500">Subject:</strong> {quote.subject || quote.items[0]?.description || 'Equipment Quote'}
                      </p>
                      <div className="flex items-center justify-between text-slate-500 pt-0.5 text-[10px]">
                        <span>Issued: <strong className="text-slate-700">{formattedDate}</strong></span>
                        {expiryDateStr && <span>Valid to: <strong className="text-slate-700">{expiryDateStr}</strong></span>}
                        <span>{quote.items.length} {quote.items.length === 1 ? 'item' : 'items'}</span>
                      </div>
                      {quote.hasInstallments && quote.installments && quote.installments.length > 0 && (
                        <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                          <span className="text-blue-700 font-bold">
                            Installments: {quote.installments.filter(i => i.status === 'PAID').length}/{quote.installments.length} Paid
                          </span>
                          {quote.balanceDue > 0 && (
                            <span className="text-amber-700 font-bold">
                              Balance: ₦{quote.balanceDue.toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
                      <div className="flex items-center gap-1">
                        {!isConverted && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConvertToSale(quote)}
                            disabled={convertingQuoteId === quote.id}
                            leftIcon={
                              convertingQuoteId === quote.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                              ) : (
                                <Receipt className="w-3.5 h-3.5 text-blue-600" />
                              )
                            }
                            className="text-xs font-bold text-blue-700 bg-blue-50/80 hover:bg-blue-100 py-1.5 px-2.5 h-auto"
                            title="Convert to Invoice"
                          >
                            Convert
                          </Button>
                        )}
                        {!isConverted && quote.balanceDue > 0 && (
                          <button
                            onClick={() => {
                              setSelectedQuoteForPayment(quote);
                              setPaymentAmount(quote.balanceDue.toString());
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition"
                            title="Record Deposit or Installment Payment"
                          >
                            + Pay
                          </button>
                        )}
                        {!isConverted && quote.balanceDue > 0 && (
                          <button
                            onClick={() => handleSendReminderSubmit(quote)}
                            className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 transition"
                            title="Send Payment Reminder"
                          >
                            🔔
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedQuoteForEmail(quote);
                            setEmailInput(quote.customer?.email || '');
                          }}
                          className="p-2 rounded-lg text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 transition"
                          title="Email Quote"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={api.getQuotePdfDownloadUrl(quote.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <div className="flex items-center gap-1">
                        <Link
                          href={`/dashboard/quotes/${quote.id}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                        >
                          View Details →
                        </Link>
                        {!isConverted && (
                          <button
                            onClick={() => handleDelete(quote)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete Quote"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (Visible on md and above) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Quote #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Subject / Devices</th>
                    <th className="py-3 px-4">Dates & Validity</th>
                    <th className="py-3 px-4 text-right">Amount & Payments</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {quotes.map((quote) => {
                    const isConverted = quote.status === 'CONVERTED';
                    const formattedDate = new Date(quote.quoteDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    const expiryDateStr = quote.expiryDate
                      ? new Date(quote.expiryDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'N/A';

                    return (
                      <tr key={quote.id} className="hover:bg-slate-50/60 transition group">
                        {/* Quote Number */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Link href={`/dashboard/quotes/${quote.id}`} className="font-extrabold text-blue-600 hover:text-blue-700 hover:underline font-mono">
                            {quote.quoteNumber}
                          </Link>
                          {quote.hasInstallments && (
                            <span className="block text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded w-fit mt-0.5">
                              {quote.installments?.length || 0} Installments
                            </span>
                          )}
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{quote.customer?.name || 'Walk-in / General Client'}</p>
                          {quote.customer?.phone && (
                            <p className="text-[10px] text-slate-400 font-mono">{quote.customer.phone}</p>
                          )}
                        </td>

                        {/* Subject & Item Summary */}
                        <td className="py-3 px-4 max-w-xs truncate">
                          <p className="font-bold text-slate-800 truncate">{quote.subject || quote.items[0]?.description || 'Equipment Quote'}</p>
                          <p className="text-[10px] text-slate-400">
                            {quote.items.length} {quote.items.length === 1 ? 'item' : 'items'}
                            {quote.items.some((i) => i.phoneRecord) ? ' • Includes verified hardware' : ''}
                          </p>
                        </td>

                        {/* Dates */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                          <div>Issued: <span className="font-bold text-slate-800">{formattedDate}</span></div>
                          <div className="text-[10px] text-slate-400">Valid to: {expiryDateStr}</div>
                        </td>

                        {/* Amount & Payments */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span className="font-black text-slate-900 font-mono text-sm block">
                            ₦{quote.totalAmount.toLocaleString()}
                          </span>
                          {quote.amountPaid > 0 && (
                            <span className="text-[10px] text-emerald-600 font-mono font-bold block">
                              Deposit: ₦{quote.amountPaid.toLocaleString()}
                            </span>
                          )}
                          {quote.balanceDue > 0 && quote.amountPaid > 0 && (
                            <span className="text-[10px] text-amber-700 font-mono font-bold block">
                              Due: ₦{quote.balanceDue.toLocaleString()}
                            </span>
                          )}
                          {quote.discount > 0 && (
                            <p className="text-[9px] text-rose-500 font-mono">Disc: -₦{quote.discount.toLocaleString()}</p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {getStatusBadge(quote.status)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Quick Convert Button for Accepted or Sent Quotes */}
                            {!isConverted && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleConvertToSale(quote)}
                                disabled={convertingQuoteId === quote.id}
                                leftIcon={
                                  convertingQuoteId === quote.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                  ) : (
                                    <Receipt className="w-3.5 h-3.5 text-blue-600" />
                                  )
                                }
                                className="text-xs font-bold text-blue-700 bg-blue-50/80 hover:bg-blue-100"
                                title="Convert to Invoice"
                              >
                                Convert
                              </Button>
                            )}

                            {/* Record Payment Button */}
                            {!isConverted && quote.balanceDue > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedQuoteForPayment(quote);
                                  setPaymentAmount(quote.balanceDue.toString());
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
                                title="Record Deposit or Part Payment"
                              >
                                + Pay
                              </button>
                            )}

                            {/* Send Reminder Button */}
                            {!isConverted && quote.balanceDue > 0 && (
                              <button
                                onClick={() => handleSendReminderSubmit(quote)}
                                className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition"
                                title="Send Installment / Payment Reminder"
                              >
                                🔔
                              </button>
                            )}

                            {/* Email Quote Button */}
                            <button
                              onClick={() => {
                                setSelectedQuoteForEmail(quote);
                                setEmailInput(quote.customer?.email || '');
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                              title="Send Quote via Email"
                            >
                              <Mail className="w-4 h-4" />
                            </button>

                            {/* Download PDF */}
                            <a
                              href={api.getQuotePdfDownloadUrl(quote.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                              title="Download A4 PDF"
                            >
                              <Download className="w-4 h-4" />
                            </a>

                            {/* View */}
                            <Link
                              href={`/dashboard/quotes/${quote.id}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
                              title="View Full Quote"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            {/* Delete if not converted */}
                            {!isConverted && (
                              <button
                                onClick={() => handleDelete(quote)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Delete Quote"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {selectedQuoteForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" /> Record Deposit / Installment Payment
                </h3>
                <p className="text-xs text-slate-500">
                  Quote #{selectedQuoteForPayment.quoteNumber} • {selectedQuoteForPayment.customer?.name || 'Client'}
                </p>
              </div>
              <button
                onClick={() => setSelectedQuoteForPayment(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Total Amount</span>
                <span className="font-mono font-bold text-slate-900">₦{selectedQuoteForPayment.totalAmount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 font-bold block">Already Paid</span>
                <span className="font-mono font-bold text-emerald-700">₦{selectedQuoteForPayment.amountPaid.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-amber-700 font-bold block">Balance Due</span>
                <span className="font-mono font-bold text-amber-800">₦{selectedQuoteForPayment.balanceDue.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Amount Received Today (₦) *</label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedQuoteForPayment.balanceDue}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Payment Channel / Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  <option value="TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash in Hand</option>
                  <option value="CARD">POS / Card Terminal</option>
                  <option value="OTHER">Other Remittance</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Payment Reference / Transaction ID (Optional)</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. GTB/TRF/9812401"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Internal Audit Note (Optional)</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Received first 50% installment deposit"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedQuoteForPayment(null)}
                  disabled={isRecordingPayment}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRecordPaymentSubmit}
                  disabled={isRecordingPayment || !paymentAmount}
                  leftIcon={isRecordingPayment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  className="bg-emerald-600 hover:bg-emerald-500 font-bold"
                >
                  {isRecordingPayment ? 'Recording...' : 'Confirm & Issue Payment Receipt'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Dispatch Result Modal */}
      {selectedQuoteForReminder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  🔔 Payment Reminder Dispatched
                </h3>
                <p className="text-xs text-slate-500">
                  Quote #{selectedQuoteForReminder.quoteNumber} • {selectedQuoteForReminder.customer?.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedQuoteForReminder(null);
                  setReminderResult(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            {isSendingReminder ? (
              <div className="py-8 text-center text-slate-500 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                <p className="text-xs font-bold">Dispatching payment reminder...</p>
              </div>
            ) : reminderResult ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {reminderResult.message || 'Reminder processed successfully!'}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-[11px] text-slate-700">
                  <p><strong>Customer:</strong> {selectedQuoteForReminder.customer?.name}</p>
                  <p><strong>Outstanding Balance:</strong> ₦{selectedQuoteForReminder.balanceDue.toLocaleString()}</p>
                  {reminderResult.emailSent && (
                    <p className="text-emerald-700 font-bold">✓ Email statement sent to {selectedQuoteForReminder.customer?.email}</p>
                  )}
                </div>

                {reminderResult.whatsAppShareUrl && (
                  <div className="pt-1">
                    <a
                      href={reminderResult.whatsAppShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      <span>💬 Open in WhatsApp Web / Mobile</span>
                    </a>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedQuoteForReminder(null);
                      setReminderResult(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Email Dispatch Modal */}
      {selectedQuoteForEmail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" /> Send Quotation via Email
                </h3>
                <p className="text-xs text-slate-500">
                  Quote #{selectedQuoteForEmail.quoteNumber} (₦{selectedQuoteForEmail.totalAmount.toLocaleString()})
                </p>
              </div>
              <button
                onClick={() => setSelectedQuoteForEmail(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            {emailSuccessMessage ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {emailSuccessMessage}
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Recipient Email Address *</label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g. client@company.ng"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  <p className="text-[11px] text-slate-400">
                    The formal A4 PDF quotation will be attached automatically.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-[11px] text-slate-600">
                  <p><strong>Customer:</strong> {selectedQuoteForEmail.customer?.name || 'General Client'}</p>
                  <p><strong>Subject:</strong> {selectedQuoteForEmail.subject || selectedQuoteForEmail.items[0]?.description}</p>
                  <p><strong>Total Amount:</strong> ₦{selectedQuoteForEmail.totalAmount.toLocaleString()}</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedQuoteForEmail(null)}
                    disabled={isSendingEmail}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSendEmail}
                    disabled={isSendingEmail || !emailInput.trim()}
                    leftIcon={isSendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    className="bg-blue-600 hover:bg-blue-500 font-bold"
                  >
                    {isSendingEmail ? 'Sending Email...' : 'Send Quotation PDF'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
