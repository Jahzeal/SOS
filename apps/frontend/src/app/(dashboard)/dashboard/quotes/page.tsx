'use client';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/DataTable';
import { TextInput, Select } from '@/components/ui/Input';


import { notify, confirmDialog } from '@/lib/feedback';
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
  AlertTriangle,
  XCircle,
  Loader2,
  Mail,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ShareDocumentModal } from '@/components/sharing/ShareDocumentModal';
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

  const [selectedQuoteForShare, setSelectedQuoteForShare] = useState<Quote | null>(null);

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
    if (!await confirmDialog(`Convert Quotation ${quote.quoteNumber} into a Commercial Invoice / Sale? This will generate the invoice and lock device inventory.`)) {
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
      notify(err.message || 'Failed to convert quotation to invoice.');
    } finally {
      setConvertingQuoteId(null);
    }
  };

  const handleRecordPaymentSubmit = async () => {
    if (!selectedQuoteForPayment) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      notify('Please enter a valid deposit or payment amount.');
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
      notify(`Payment of ₦${amount.toLocaleString()} recorded successfully!`);
      setSelectedQuoteForPayment(null);
      setPaymentAmount('');
      setPaymentRef('');
      setPaymentNotes('');
      loadQuotes();
    } catch (err: any) {
      notify(err.message || 'Failed to record payment.');
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
      notify(err.message || 'Failed to send payment reminder.');
      setSelectedQuoteForReminder(null);
    } finally {
      setIsSendingReminder(false);
    }
  };

  // Delete Quote Modal State
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [isDeletingQuote, setIsDeletingQuote] = useState(false);
  const [deleteQuoteError, setDeleteQuoteError] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!quoteToDelete) return;
    setIsDeletingQuote(true);
    setDeleteQuoteError(null);
    try {
      await api.deleteQuote(quoteToDelete.id);
      setQuoteToDelete(null);
      invalidateQuotes();
    } catch (err: any) {
      setDeleteQuoteError(err.message || 'Failed to delete quotation.');
    } finally {
      setIsDeletingQuote(false);
    }
  };

  const getStatusBadge = (status: Quote['status']) => {
    switch (status) {
      case 'DRAFT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200">DRAFT</span>;
      case 'SENT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-accent-50 text-accent-700 border border-accent-200">SENT</span>;
      case 'PARTIALLY_PAID':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-warning-50 text-warning-800 border border-warning-300">PARTIAL DEPOSIT</span>;
      case 'ACCEPTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-success-50 text-success-700 border border-success-200">ACCEPTED</span>;
      case 'CONVERTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-50 text-purple-700 border border-purple-200">CONVERTED</span>;
      case 'DECLINED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-danger-50 text-danger-700 border border-danger-200">DECLINED</span>;
      case 'EXPIRED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-warning-50 text-warning-700 border border-warning-200">EXPIRED</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700">{status}</span>;
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
            <span className="text-accent-600 font-bold">Quotations & Estimates</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Quotations & Commercial Estimates
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mt-1 leading-relaxed">
            Create, manage, and email formal price proposals for phones, electronics, and repair services with 1-click invoice conversion.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 shrink-0">
          <Link href="/dashboard/templates">
            <Button variant="secondary" size="sm">
              Customize Template
            </Button>
          </Link>
          <Link href="/dashboard/quotes/new">
            <button className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition cursor-pointer border border-accent-600/30 text-accent-700 bg-accent-50/30 hover:bg-accent-50 sm:bg-accent-600 sm:text-white sm:border-accent-600 sm:hover:bg-accent-700 shadow-xs sm:shadow-md sm:shadow-accent-600/10">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-600 sm:text-white" />
              <span>Create New Quote</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Quoted Value</span>
          {loading && !stats ? (
            <div className="h-7 w-24 bg-slate-200/60 rounded-md animate-pulse my-1" />
          ) : (
            <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              ₦{(stats?.totalQuotedAmount || 0).toLocaleString()}
            </p>
          )}
          <p className="text-xs font-semibold text-slate-400">
            Across {stats?.totalQuotesCount || 0} total proposals
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-success-600 uppercase tracking-wider">Accepted / Won</span>
          {loading && !stats ? (
            <div className="h-7 w-24 bg-slate-200/60 rounded-md animate-pulse my-1" />
          ) : (
            <p className="text-xl sm:text-2xl font-black text-success-600 font-mono">
              ₦{(stats?.acceptedAmount || 0).toLocaleString()}
            </p>
          )}
          <p className="text-xs font-semibold text-slate-400">
            {stats?.acceptedCount || 0} quotes approved
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-accent-600 uppercase tracking-wider">Active / Pending</span>
          {loading && !stats ? (
            <div className="h-7 w-16 bg-slate-200/60 rounded-md animate-pulse my-1" />
          ) : (
            <p className="text-xl sm:text-2xl font-black text-accent-600 font-mono">
              {stats?.activeCount || 0}
            </p>
          )}
          <p className="text-xs font-semibold text-slate-400">
            Awaiting client confirmation
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Win Rate</span>
          {loading && !stats ? (
            <div className="h-7 w-16 bg-slate-200/60 rounded-md animate-pulse my-1" />
          ) : (
            <p className="text-xl sm:text-2xl font-black text-purple-600 font-mono">
              {stats?.conversionRate || 0}%
            </p>
          )}
          <p className="text-xs font-semibold text-slate-400">
            {stats?.convertedCount || 0} converted to sales
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input aria-label="Search by quote number, subject, customer name, phone, or email"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by quote number, subject, customer name, phone, or email..."
            className="w-full text-sm px-3 py-2 bg-white text-slate-900 placeholder-slate-400 rounded-control border border-slate-200 shadow-subtle transition-all duration-150 focus:outline-none focus:ring-2 focus:border-accent-600 focus:ring-accent-500/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed pl-9 pr-4"
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

          <Button variant="secondary" size="icon" className="shrink-0 ml-auto" aria-label="Refresh Quotes"
            onClick={() => loadQuotes()}
            title="Refresh Quotes">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent-600' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Quotes Table List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-accent-600" />
            <p className="text-xs font-bold">Loading quotations registry...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="py-16 text-center px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-accent-50 text-accent-600 flex items-center justify-center mx-auto">
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
                            className="font-black text-accent-600 hover:text-accent-700 font-mono text-sm"
                          >
                            {quote.quoteNumber}
                          </Link>
                          {getStatusBadge(quote.status)}
                        </div>
                        <p className="font-bold text-slate-900 text-xs mt-1">
                          {quote.customer?.name || 'Walk-in / General Client'}
                        </p>
                        {quote.customer?.phone && (
                          <p className="text-xs text-slate-400 font-mono">{quote.customer.phone}</p>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="font-black text-slate-900 font-mono text-base block">
                          ₦{quote.totalAmount.toLocaleString()}
                        </span>
                        {quote.amountPaid > 0 && (
                          <span className="text-xs text-success-600 font-mono font-bold block">
                            Paid: ₦{quote.amountPaid.toLocaleString()}
                          </span>
                        )}
                        {quote.balanceDue > 0 && quote.amountPaid > 0 && (
                          <span className="text-xs text-warning-700 font-mono font-bold block">
                            Due: ₦{quote.balanceDue.toLocaleString()}
                          </span>
                        )}
                        {quote.discount > 0 && (
                          <span className="text-xs text-danger-500 font-mono block">
                            Disc: -₦{quote.discount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                      <p className="font-medium text-slate-800 line-clamp-1">
                        <strong className="text-slate-500">Subject:</strong> {quote.subject || quote.items[0]?.description || 'Equipment Quote'}
                      </p>
                      <div className="flex items-center justify-between text-slate-500 pt-0.5 text-xs">
                        <span>Issued: <strong className="text-slate-700">{formattedDate}</strong></span>
                        {expiryDateStr && <span>Valid to: <strong className="text-slate-700">{expiryDateStr}</strong></span>}
                        <span>{quote.items.length} {quote.items.length === 1 ? 'item' : 'items'}</span>
                      </div>
                      {quote.hasInstallments && quote.installments && quote.installments.length > 0 && (
                        <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-xs">
                          <span className="text-accent-700 font-bold">
                            Installments: {quote.installments.filter(i => i.status === 'PAID').length}/{quote.installments.length} Paid
                          </span>
                          {quote.balanceDue > 0 && (
                            <span className="text-warning-700 font-bold">
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
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-600" />
                              ) : (
                                <Receipt className="w-3.5 h-3.5 text-accent-600" />
                              )
                            }
                            className="text-xs font-bold text-accent-700 bg-accent-50/80 hover:bg-accent-100 py-1.5 px-2.5 h-auto"
                            title="Convert to Invoice"
                          >
                            Convert
                          </Button>
                        )}
                        {!isConverted && quote.balanceDue > 0 && (
                          <Button variant="secondary" size="sm"
                            onClick={() => {
                              setSelectedQuoteForPayment(quote);
                              setPaymentAmount(quote.balanceDue.toString());
                            }}
                            title="Record Deposit or Installment Payment">
                            + Pay
                          </Button>
                        )}
                        {!isConverted && quote.balanceDue > 0 && (
                          <Button variant="secondary" size="md"
                            onClick={() => handleSendReminderSubmit(quote)}
                            title="Send Payment Reminder">
                            🔔
                          </Button>
                        )}
                        <Button variant="secondary" size="icon" aria-label="Share Quote via WhatsApp, Email, or PDF"
                          onClick={() => setSelectedQuoteForShare(quote)}
                          title="Share Quote via WhatsApp, Email, or PDF">
                          <Share2 className="w-3.5 h-3.5" />
                        </Button>
                        <a
                          href={api.getQuotePdfDownloadUrl(quote.id)}
                onClick={(e) => api.handlePdfLinkClick(e, api.getQuotePdfDownloadUrl(quote.id), `Quotation-${quote.quoteNumber || quote.id}.pdf`)}
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
                        <Button variant="secondary" size="icon" aria-label="Delete Quotation"
                          onClick={() => setQuoteToDelete(quote)}
                          title="Delete Quotation">
                          <Trash2 className="w-3.5 h-3.5 text-danger-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (Visible on md and above) */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <THead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-xs">
                    <Th>Quote #</Th>
                    <Th>Customer</Th>
                    <Th>Subject / Devices</Th>
                    <Th>Dates & Validity</Th>
                    <Th align="right">Amount & Payments</Th>
                    <Th align="center">Status</Th>
                    <Th align="right">Actions</Th>
                  </tr>
                </THead>
                <TBody className="font-medium">
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
                      <Tr className="group" key={quote.id}>
                        {/* Quote Number */}
                        <Td className="whitespace-nowrap">
                          <Link href={`/dashboard/quotes/${quote.id}`} className="font-extrabold text-accent-600 hover:text-accent-700 hover:underline font-mono">
                            {quote.quoteNumber}
                          </Link>
                          {quote.hasInstallments && (
                            <span className="block text-xs font-bold text-accent-700 bg-accent-50 px-1.5 py-0.5 rounded w-fit mt-0.5">
                              {quote.installments?.length || 0} Installments
                            </span>
                          )}
                        </Td>

                        {/* Customer */}
                        <Td>
                          <p className="font-bold text-slate-900">{quote.customer?.name || 'Walk-in / General Client'}</p>
                          {quote.customer?.phone && (
                            <p className="text-xs text-slate-400 font-mono">{quote.customer.phone}</p>
                          )}
                        </Td>

                        {/* Subject & Item Summary */}
                        <Td className="max-w-xs truncate">
                          <p className="font-bold text-slate-800 truncate">{quote.subject || quote.items[0]?.description || 'Equipment Quote'}</p>
                          <p className="text-xs text-slate-400">
                            {quote.items.length} {quote.items.length === 1 ? 'item' : 'items'}
                            {quote.items.some((i) => i.phoneRecord) ? ' • Includes verified hardware' : ''}
                          </p>
                        </Td>

                        {/* Dates */}
                        <Td className="whitespace-nowrap text-slate-600 text-xs">
                          <div>Issued: <span className="font-bold text-slate-800">{formattedDate}</span></div>
                          <div className="text-xs text-slate-400">Valid to: {expiryDateStr}</div>
                        </Td>

                        {/* Amount & Payments */}
                        <Td align="right" className="whitespace-nowrap">
                          <span className="font-black text-slate-900 font-mono text-sm block">
                            ₦{quote.totalAmount.toLocaleString()}
                          </span>
                          {quote.amountPaid > 0 && (
                            <span className="text-xs text-success-600 font-mono font-bold block">
                              Deposit: ₦{quote.amountPaid.toLocaleString()}
                            </span>
                          )}
                          {quote.balanceDue > 0 && quote.amountPaid > 0 && (
                            <span className="text-xs text-warning-700 font-mono font-bold block">
                              Due: ₦{quote.balanceDue.toLocaleString()}
                            </span>
                          )}
                          {quote.discount > 0 && (
                            <p className="text-xs text-danger-500 font-mono">Disc: -₦{quote.discount.toLocaleString()}</p>
                          )}
                        </Td>

                        {/* Status */}
                        <Td align="center" className="whitespace-nowrap">
                          {getStatusBadge(quote.status)}
                        </Td>

                        {/* Actions */}
                        <Td align="right" className="whitespace-nowrap">
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
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-600" />
                                  ) : (
                                    <Receipt className="w-3.5 h-3.5 text-accent-600" />
                                  )
                                }
                                className="text-xs font-bold text-accent-700 bg-accent-50/80 hover:bg-accent-100"
                                title="Convert to Invoice"
                              >
                                Convert
                              </Button>
                            )}

                            {/* Record Payment Button */}
                            {!isConverted && quote.balanceDue > 0 && (
                              <Button variant="secondary" size="sm"
                                onClick={() => {
                                  setSelectedQuoteForPayment(quote);
                                  setPaymentAmount(quote.balanceDue.toString());
                                }}
                                title="Record Deposit or Part Payment">
                                + Pay
                              </Button>
                            )}

                            {/* Send Reminder Button */}
                            {!isConverted && quote.balanceDue > 0 && (
                              <Button variant="secondary" size="md"
                                onClick={() => handleSendReminderSubmit(quote)}
                                title="Send Installment / Payment Reminder">
                                🔔
                              </Button>
                            )}

                            {/* Share Quote Button */}
                            <Button variant="ghost" size="icon" aria-label="Share Quote via WhatsApp, Email, or PDF"
                              onClick={() => setSelectedQuoteForShare(quote)}
                              title="Share Quote via WhatsApp, Email, or PDF">
                              <Share2 className="w-4 h-4" />
                            </Button>

                            {/* Download PDF */}
                            <a
                              href={api.getQuotePdfDownloadUrl(quote.id)}
                onClick={(e) => api.handlePdfLinkClick(e, api.getQuotePdfDownloadUrl(quote.id), `Quotation-${quote.quoteNumber || quote.id}.pdf`)}
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

                            {/* Delete Button */}
                            <Button variant="ghostDanger" size="icon" aria-label="Delete Quotation"
                              onClick={() => setQuoteToDelete(quote)}
                              title="Delete Quotation">
                              <Trash2 className="w-4 h-4 text-slate-400 hover:text-danger-600" />
                            </Button>
                          </div>
                        </Td>
                      </Tr>
                    );
                  })}
                </TBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {selectedQuoteForPayment && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-success-600" /> Record Deposit / Installment Payment
                </h3>
                <p className="text-xs text-slate-500">
                  Quote #{selectedQuoteForPayment.quoteNumber} • {selectedQuoteForPayment.customer?.name || 'Client'}
                </p>
              </div>
              <Button variant="ghost" size="md"
                onClick={() => setSelectedQuoteForPayment(null)}>
                ✕
              </Button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-xs text-slate-400 font-bold block">Total Amount</span>
                <span className="font-mono font-bold text-slate-900">₦{selectedQuoteForPayment.totalAmount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-xs text-success-600 font-bold block">Already Paid</span>
                <span className="font-mono font-bold text-success-700">₦{selectedQuoteForPayment.amountPaid.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-xs text-warning-700 font-bold block">Balance Due</span>
                <span className="font-mono font-bold text-warning-800">₦{selectedQuoteForPayment.balanceDue.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <TextInput label="Amount Received Today (₦)"
                  type="number"
                  step="0.01"
                  max={selectedQuoteForPayment.balanceDue}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 50000" className="font-mono" />
              </div>

              <div className="space-y-1">
                <Select label="Payment Channel / Method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash in Hand</option>
                  <option value="CARD">POS / Card Terminal</option>
                  <option value="OTHER">Other Remittance</option>
                </Select>
              </div>

              <div className="space-y-1">
                <TextInput label="Payment Reference / Transaction ID (Optional)"
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. GTB/TRF/9812401" />
              </div>

              <div className="space-y-1">
                <TextInput label="Internal Audit Note (Optional)"
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Received first 50% installment deposit" />
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
                  className="bg-success-600 hover:bg-success-500 font-bold"
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
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
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
              <Button variant="ghost" size="md"
                onClick={() => {
                  setSelectedQuoteForReminder(null);
                  setReminderResult(null);
                }}>
                ✕
              </Button>
            </div>

            {isSendingReminder ? (
              <div className="py-8 text-center text-slate-500 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-accent-600 mx-auto" />
                <p className="text-xs font-bold">Dispatching payment reminder...</p>
              </div>
            ) : reminderResult ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-success-50 border border-success-200 rounded-xl text-success-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-600 shrink-0" />
                  {reminderResult.message || 'Reminder processed successfully!'}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-700">
                  <p><strong>Customer:</strong> {selectedQuoteForReminder.customer?.name}</p>
                  <p><strong>Outstanding Balance:</strong> ₦{selectedQuoteForReminder.balanceDue.toLocaleString()}</p>
                  {reminderResult.emailSent && (
                    <p className="text-success-700 font-bold">✓ Email statement sent to {selectedQuoteForReminder.customer?.email}</p>
                  )}
                </div>

                {reminderResult.whatsAppShareUrl && (
                  <div className="pt-1">
                    <a
                      href={reminderResult.whatsAppShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-success-600 hover:bg-success-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
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

      {/* Universal Share Document Modal */}
      <ShareDocumentModal
        isOpen={Boolean(selectedQuoteForShare)}
        onClose={() => setSelectedQuoteForShare(null)}
        document={
          selectedQuoteForShare
            ? {
                id: selectedQuoteForShare.id,
                type: 'QUOTE',
                docNumber: selectedQuoteForShare.quoteNumber,
                customerName: selectedQuoteForShare.customer?.name,
                customerPhone: selectedQuoteForShare.customer?.phone,
                customerEmail: selectedQuoteForShare.customer?.email,
                totalAmount: Number(selectedQuoteForShare.totalAmount || 0),
                amountPaid: Number(selectedQuoteForShare.amountPaid || 0),
                balanceDue: Number(selectedQuoteForShare.balanceDue || 0),
                paymentStatus: selectedQuoteForShare.status,
                items: selectedQuoteForShare.items || [],
                storeName: 'NoxGuarda Retail Store',
              }
            : null
        }
      />

      {/* Delete Quote Confirmation Modal */}
      {quoteToDelete && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150 overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-danger-50 border border-danger-100 text-danger-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-slate-900 text-base">Delete Quotation</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            {deleteQuoteError && (
              <div className="p-3 bg-danger-50 border border-danger-200 rounded-xl text-xs text-danger-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-danger-600" />
                <span className="truncate">{deleteQuoteError}</span>
              </div>
            )}

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase text-xs">Quote #</span>
                <span className="font-mono font-bold text-accent-600 truncate ml-2">
                  {quoteToDelete.quoteNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase text-xs">Customer</span>
                <span className="font-bold text-slate-800 truncate ml-2">
                  {quoteToDelete.customer?.name || 'General Client'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase text-xs">Total Amount</span>
                <span className="font-extrabold text-slate-900">
                  ₦{Number(quoteToDelete.totalAmount || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete quotation <strong>#{quoteToDelete.quoteNumber}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isDeletingQuote}
                onClick={() => {
                  setQuoteToDelete(null);
                  setDeleteQuoteError(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" size="sm"
                type="button"
                disabled={isDeletingQuote}
                onClick={handleConfirmDelete}>
                {isDeletingQuote ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Quote</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
