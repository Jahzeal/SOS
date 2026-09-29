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
  Eye,
  Mail,
  SlidersHorizontal,
  BellRing,
  Loader2,
  Printer,
  X,
  Copy,
  Check,
  Send,
  Share2,
  DollarSign,
  CreditCard,
  Building2,
  Wallet,
  ArrowRight,
  Trash2,
  Pencil,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useInvoices, useInventorySummary } from '@/hooks/useDashboardQueries';
import { A4CommercialInvoice } from '@/components/invoice/A4CommercialInvoice';

const getInvoiceBankDetails = (inv: any) => {
  if (!inv) return { bankName: '', accountNumber: '', accountName: '' };
  const notes = inv.notes || '';
  const bankMatch = notes.match(/\[BANK:([^\]]+)\]/);
  const accMatch = notes.match(/\[ACC:([^\]]+)\]/);
  const accNameMatch = notes.match(/\[ACCNAME:([^\]]+)\]/);

  return {
    bankName: bankMatch ? bankMatch[1].trim() : (inv.business?.bankName || ''),
    accountNumber: accMatch ? accMatch[1].trim() : (inv.business?.accountNumber || ''),
    accountName: accNameMatch ? accNameMatch[1].trim() : (inv.business?.accountName || inv.business?.name || ''),
  };
};

export default function InvoicesRegistryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Cached persistent queries
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices(debouncedSearch);
  const { data: summaryData } = useInventorySummary();

  const loading = loadingInvoices && invoices.length === 0;

  // Print Isolated Invoice State
  const [invoiceToPrint, setInvoiceToPrint] = useState<any | null>(null);

  useEffect(() => {
    if (invoiceToPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [invoiceToPrint]);

  // Keep invoice mounted during print dialog and reset only after print finishes/cancels
  useEffect(() => {
    const handleAfterPrint = () => {
      setInvoiceToPrint(null);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  // Delete Modal State
  const [invoiceToDelete, setInvoiceToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteInvoice(invoiceToDelete.id);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setInvoiceToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete invoice.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Email & View Modal State
  const [emailModalInvoice, setEmailModalInvoice] = useState<any | null>(null);
  const [viewModalInvoice, setViewModalInvoice] = useState<any | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Status breakdown calculations
  const counts = useMemo(() => {
    let draft = 0;
    let pending = 0;
    let partiallyPaid = 0;
    let paid = 0;
    let overdue = 0;
    let outstandingTotal = 0;

    invoices.forEach((inv) => {
      const st = (inv.paymentStatus || 'PAID').toUpperCase();
      const total = Number(inv.totalAmount || 0);
      const paidAmt = Number(inv.amountPaid || 0);
      const remaining = Math.max(0, total - paidAmt);

      if (st === 'DRAFT') draft++;
      else if (st === 'PENDING') {
        pending++;
        outstandingTotal += remaining || total;
      } else if (st === 'PARTIALLY_PAID') {
        partiallyPaid++;
        outstandingTotal += remaining;
      } else if (st === 'OVERDUE') {
        overdue++;
        outstandingTotal += remaining || total;
      } else {
        paid++;
      }
    });

    return { draft, pending, partiallyPaid, paid, overdue, outstandingTotal };
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

  const renderItemsSummary = (items?: any[], onOpenView?: () => void) => {
    if (!items || items.length === 0) {
      return <span className="text-slate-400 italic text-xs">No line items</span>;
    }

    // Aggregate counts by model/description
    const countsMap = new Map<string, number>();
    items.forEach((it) => {
      const rawName =
        it.description ||
        (it.phoneRecord ? `${it.phoneRecord.brand} ${it.phoneRecord.model}` : 'Item');
      const name = rawName.trim();
      countsMap.set(name, (countsMap.get(name) || 0) + (it.quantity || 1));
    });

    const totalQty = items.reduce((sum, it) => sum + (it.quantity || 1), 0);
    const grouped = Array.from(countsMap.entries());
    const fullTooltip = grouped.map(([name, count]) => `${name} (×${count})`).join('\n');

    // Case 1: Only 1 unique item
    if (grouped.length === 1) {
      const [name, count] = grouped[0];
      return (
        <div className="flex items-center gap-1.5 max-w-[280px]" title={fullTooltip}>
          <span className="font-semibold text-slate-800 text-xs truncate">{name}</span>
          {count > 1 && (
            <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-extrabold text-[10px] border border-blue-100 font-mono">
              ×{count}
            </span>
          )}
        </div>
      );
    }

    // Case 2: 2 unique items
    if (grouped.length === 2) {
      return (
        <div className="space-y-0.5 max-w-[300px]" title={fullTooltip}>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-800 text-xs truncate">{grouped[0][0]}</span>
            {grouped[0][1] > 1 && (
              <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[9px] font-mono">
                ×{grouped[0][1]}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <span className="truncate">{grouped[1][0]}</span>
            {grouped[1][1] > 1 && (
              <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[9px] font-mono">
                ×{grouped[1][1]}
              </span>
            )}
          </div>
        </div>
      );
    }

    // Case 3: 3 or more unique items / bulk inventory (e.g. 38 devices)
    const top1 = grouped[0];
    const top2 = grouped[1];
    const remainingCount = grouped.slice(2).reduce((sum, [, c]) => sum + c, 0);
    const remainingTypes = grouped.length - 2;

    return (
      <div className="space-y-1 max-w-[320px]" title={fullTooltip}>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-900 text-xs truncate">{top1[0]}</span>
          <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-extrabold text-[10px] border border-blue-200/60 font-mono">
            ×{top1[1]}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
          <span className="truncate max-w-[140px]">{top2[0]}</span>
          {top2[1] > 1 && (
            <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[9px] font-mono">
              ×{top2[1]}
            </span>
          )}
          <button
            type="button"
            onClick={onOpenView}
            className="shrink-0 px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 font-extrabold text-[10px] transition cursor-pointer border border-slate-200"
            title="Click to view all itemized products in statement modal"
          >
            +{remainingCount} more
          </button>
        </div>
      </div>
    );
  };

  const getItemsSummary = (items?: any[]) => {
    if (!items || items.length === 0) return 'Invoice Statement';
    const countsMap = new Map<string, number>();
    items.forEach((it) => {
      const name = (it.description || (it.phoneRecord ? `${it.phoneRecord.brand} ${it.phoneRecord.model}` : 'Item')).trim();
      countsMap.set(name, (countsMap.get(name) || 0) + (it.quantity || 1));
    });
    const entries = Array.from(countsMap.entries());
    if (entries.length <= 2) {
      return entries.map(([name, count]) => (count > 1 ? `${name} (×${count})` : name)).join(', ');
    }
    const top2 = entries.slice(0, 2).map(([name, count]) => (count > 1 ? `${name} (×${count})` : name)).join(', ');
    const remainingCount = entries.slice(2).reduce((sum, [, c]) => sum + c, 0);
    return `${top2} + ${remainingCount} more items`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrintInvoice = (inv: any) => {
    setInvoiceToPrint(inv);
  };

  const handleQuickIssueDraft = async (inv: any) => {
    try {
      await api.updateInvoice(inv.id, { paymentStatus: 'PENDING' });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    } catch (err: any) {
      alert(err.message || 'Failed to issue invoice.');
    }
  };

  const handleOpenEmailModal = (inv: any) => {
    setEmailModalInvoice(inv);
    setRecipientEmail(inv.customer?.email || '');
    setCopiedLink(false);
    setEmailStatusMsg(null);
  };

  const handleSendEmailClient = async () => {
    if (!emailModalInvoice) return;
    const email = recipientEmail.trim() || emailModalInvoice.customer?.email || '';
    if (!email) {
      setEmailStatusMsg('Please enter a recipient email address.');
      return;
    }

    setIsSendingEmail(true);
    setEmailStatusMsg(null);

    // If invoice is currently DRAFT, automatically activate it so customer doesn't see DRAFT
    if (emailModalInvoice.paymentStatus === 'DRAFT') {
      try {
        await api.updateInvoice(emailModalInvoice.id, { paymentStatus: 'PENDING' });
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      } catch (e) {
        console.warn('Failed to activate draft status before sending:', e);
      }
    }

    const name = emailModalInvoice.customer?.name || 'Valued Customer';
    const invNum = emailModalInvoice.invoiceNumber || emailModalInvoice.receiptNumber || emailModalInvoice.id;
    const amount = Number(emailModalInvoice.totalAmount || 0).toLocaleString();
    const subject = encodeURIComponent(`Invoice Statement #${invNum}`);
    const body = encodeURIComponent(
      `Hello ${name},\n\nPlease find your invoice statement #${invNum} for ₦${amount}.\n\nThank you for your business!`
    );

    try {
      await api.sendSaleEmail(emailModalInvoice.id, email);
      setEmailStatusMsg(`Invoice statement sent directly to ${email}!`);
    } catch (err: any) {
      console.warn('Backend email failed, opening mail client fallback:', err);
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
      setEmailStatusMsg(`Dispatched to your mail client.`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleCopyLink = () => {
    if (!emailModalInvoice) return;
    const link = `${window.location.origin}/dashboard/sales/receipt/${emailModalInvoice.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8">

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Invoice Registry
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 font-medium max-w-xl mt-1 leading-relaxed">
            View, track, and manage all billing operations, accounts receivable, and customer statements across branches.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            onClick={() => handlePrint()}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-200 text-slate-700 bg-transparent hover:bg-slate-50 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export</span>
          </button>
          <Link href="/dashboard/sales/invoices/new">
            <button className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition cursor-pointer border border-blue-600/30 text-blue-700 bg-blue-50/30 hover:bg-blue-50 sm:bg-blue-600 sm:text-white sm:border-blue-600 sm:hover:bg-blue-700 shadow-xs sm:shadow-md sm:shadow-blue-600/10">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 sm:text-white" />
              <span>Create Invoice</span>
            </button>
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
          {loading && invoices.length === 0 ? (
            <div className="h-6 w-12 bg-slate-200/60 rounded-md animate-pulse mt-0.5" />
          ) : (
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{invoices.length}</h3>
          )}
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
          {loading && invoices.length === 0 ? (
            <div className="h-6 w-12 bg-slate-200/60 rounded-md animate-pulse mt-0.5" />
          ) : (
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{counts.draft}</h3>
          )}
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
          {loading && invoices.length === 0 ? (
            <div className="h-6 w-12 bg-slate-200/60 rounded-md animate-pulse mt-0.5" />
          ) : (
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{counts.pending}</h3>
          )}
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
          {loading && invoices.length === 0 ? (
            <div className="h-6 w-12 bg-slate-200/60 rounded-md animate-pulse mt-0.5" />
          ) : (
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{counts.paid}</h3>
          )}
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
          {loading && invoices.length === 0 ? (
            <div className="h-6 w-12 bg-slate-200/60 rounded-md animate-pulse mt-0.5" />
          ) : (
            <h3 className="text-xl font-extrabold text-rose-600 mt-0.5">{counts.overdue}</h3>
          )}
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
          {loading && invoices.length === 0 ? (
            <div className="h-6 w-20 bg-indigo-500/60 rounded-md animate-pulse mt-0.5" />
          ) : (
            <h3 className="text-xl font-extrabold text-white mt-0.5">₦{counts.outstandingTotal.toLocaleString()}</h3>
          )}
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

        {/* Mobile Cards View (Hidden on desktop) */}
        <div className="block sm:hidden divide-y divide-slate-100 bg-white">
          {loading ? (
            <div className="py-16 text-center">
              <div className="flex items-center justify-center gap-2 text-slate-400 font-semibold text-xs">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading invoice registry...
              </div>
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <div className="flex items-center justify-center gap-2 text-rose-500 font-semibold text-xs">
                <AlertTriangle className="w-5 h-5" />
                {error}
              </div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs animate-in fade-in duration-200">
              <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-600">No invoices found</p>
              <p>Create a new invoice statement to view billing records.</p>
            </div>
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
              const total = Number(inv.totalAmount || 0);
              const paid = Number(inv.amountPaid || 0);
              const balance = Math.max(0, total - paid);

              return (
                <div key={inv.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center text-[10px] border border-blue-200 shrink-0">
                        {getCustomerInitials(custName)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{custName}</h4>
                        <p className="text-[10px] text-slate-400 font-mono font-bold text-blue-600">{invNum}</p>
                      </div>
                    </div>
                    {/* Status Badge */}
                    <div>
                      {status === 'PAID' && <Badge variant="verified" size="sm">PAID</Badge>}
                      {status === 'PARTIALLY_PAID' && <Badge variant="warning" size="sm">PARTIAL</Badge>}
                      {status === 'PENDING' && <Badge variant="business" size="sm">PENDING</Badge>}
                      {status === 'OVERDUE' && <Badge variant="sold" size="sm">OVERDUE</Badge>}
                      {status === 'DRAFT' && <Badge variant="starter" size="sm">DRAFT</Badge>}
                    </div>
                  </div>

                  <div className="pt-0.5">{renderItemsSummary(inv.items, () => setViewModalInvoice(inv))}</div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Issue Date</span>
                      <span className="font-bold text-slate-800 text-[11px]">{dateStr}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Amount</span>
                      <span className="font-extrabold text-slate-900 text-[13px]">
                        ₦{total.toLocaleString()}
                      </span>
                      {status === 'PARTIALLY_PAID' && (
                        <span className="text-[10px] text-amber-700 font-bold block">
                          Bal: ₦{balance.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs flex-wrap">
                    {status === 'DRAFT' && (
                      <button
                        onClick={() => handleQuickIssueDraft(inv)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                        title="Issue Invoice"
                      >
                        <Share2 className="w-3.5 h-3.5 text-blue-600" /> Issue
                      </button>
                    )}
                    {status !== 'PAID' && status !== 'DRAFT' && (
                      <Link
                        href={`/dashboard/sales/invoices/${inv.id}/pay`}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Pay
                      </Link>
                    )}
                    <Link
                      href={`/dashboard/sales/invoices/${inv.id}/edit`}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-500" /> Edit
                    </Link>
                    <button
                      onClick={() => handlePrintInvoice(inv)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                    <button
                      onClick={() => handleOpenEmailModal(inv)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" /> Send
                    </button>
                    <button
                      onClick={() => setInvoiceToDelete(inv)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      title="Delete Invoice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
                  const total = Number(inv.totalAmount || 0);
                  const paid = Number(inv.amountPaid || 0);
                  const balance = Math.max(0, total - paid);

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
                      <td className="py-3.5 px-4">{renderItemsSummary(inv.items, () => setViewModalInvoice(inv))}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">{dateStr}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-extrabold text-slate-900 text-[13px]">
                          ₦{total.toLocaleString()}
                        </div>
                        {status === 'PARTIALLY_PAID' && (
                          <div className="text-[10px] text-amber-700 font-bold mt-0.5">
                            Paid: ₦{paid.toLocaleString()} • Bal: ₦{balance.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {status === 'PAID' && <Badge variant="verified" size="sm">PAID</Badge>}
                        {status === 'PARTIALLY_PAID' && <Badge variant="warning" size="sm">PARTIAL</Badge>}
                        {status === 'PENDING' && <Badge variant="business" size="sm">PENDING</Badge>}
                        {status === 'OVERDUE' && <Badge variant="sold" size="sm">OVERDUE</Badge>}
                        {status === 'DRAFT' && <Badge variant="starter" size="sm">DRAFT</Badge>}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-slate-400">
                          {status === 'DRAFT' && (
                            <button
                              onClick={() => handleQuickIssueDraft(inv)}
                              className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 border border-blue-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                              title="Issue Active Invoice"
                            >
                              <Share2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>Issue</span>
                            </button>
                          )}
                          {status !== 'PAID' && status !== 'DRAFT' && (
                            <Link
                              href={`/dashboard/sales/invoices/${inv.id}/pay`}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 border border-emerald-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                              title="Record Payment & Settle Balance"
                            >
                              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Pay</span>
                            </Link>
                          )}
                          <Link
                            href={`/dashboard/sales/invoices/${inv.id}/edit`}
                            className="p-1 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                            title="Edit Invoice"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => setViewModalInvoice(inv)}
                            className="p-1 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                            title="View Commercial Invoice"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePrintInvoice(inv)}
                            className="p-1 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                            title="Print Isolated Statement"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEmailModal(inv)}
                            className="p-1 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                            title="Send Invoice by Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setInvoiceToDelete(inv)}
                            className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer text-slate-400"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Send Invoice by Email Modal */}
      {emailModalInvoice && (
        <div className="fixed -inset-1 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Send Invoice Statement</h3>
                  <p className="text-xs text-slate-500 font-medium font-mono">
                    #{emailModalInvoice.invoiceNumber || emailModalInvoice.receiptNumber || emailModalInvoice.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEmailModalInvoice(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Summary Pill */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Recipient</p>
                  <p className="font-extrabold text-sm text-slate-900">{emailModalInvoice.customer?.name || 'Customer'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Amount</p>
                  <p className="font-extrabold text-sm text-blue-600">
                    ₦{Number(emailModalInvoice.totalAmount || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Recipient Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Customer Email Address</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="e.g. customer@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Email Preview Details */}
              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-blue-900">Message Preview:</p>
                <p className="text-slate-600 leading-relaxed font-sans">
                  "Hello {emailModalInvoice.customer?.name || 'Customer'}, please find your invoice statement #{emailModalInvoice.invoiceNumber || emailModalInvoice.receiptNumber || emailModalInvoice.id} for ₦{Number(emailModalInvoice.totalAmount || 0).toLocaleString()}."
                </p>
              </div>

              {/* PDF Attachment Notice */}
              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Official PDF Document Attached:</span>
                </div>
                <p className="text-blue-800/90 font-mono text-[11px] pl-5">
                  Invoice-{emailModalInvoice.invoiceNumber || emailModalInvoice.id}.pdf
                </p>
                <p className="text-[10px] text-blue-700/80 pl-5 pt-0.5">
                  The recipient will receive an email with the complete commercial template and attached A4 PDF statement.
                </p>
              </div>

              {emailStatusMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2 border border-emerald-200 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  {emailStatusMsg}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setEmailModalInvoice(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200/50 text-xs font-bold transition-colors w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={handleSendEmailClient}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1.5 w-full sm:w-auto disabled:opacity-60"
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending PDF...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send PDF Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Commercial Invoice View & Print Modal */}
      {viewModalInvoice && (
        <div className="fixed -inset-1 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-auto overflow-hidden animate-scale-up">
            {/* Modal Controls Bar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/90 print:hidden">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900">
                  Commercial Invoice Statement Preview
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold text-xs">
                  {viewModalInvoice.invoiceNumber || viewModalInvoice.receiptNumber || viewModalInvoice.id}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {(viewModalInvoice.paymentStatus || 'PAID').toUpperCase() !== 'PAID' && (
                  <Link
                    href={`/dashboard/sales/invoices/${viewModalInvoice.id}/pay`}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Record Payment</span>
                  </Link>
                )}
                <Link
                  href={`/dashboard/sales/invoices/${viewModalInvoice.id}/edit`}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-600" />
                  <span>Edit</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    const inv = viewModalInvoice;
                    setViewModalInvoice(null);
                    setInvoiceToDelete(inv);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="Delete Invoice"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintInvoice(viewModalInvoice)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print A4 Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewModalInvoice(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div id="odoo-printable-invoice" className="p-6 sm:p-10 bg-white text-slate-900 font-sans space-y-6 text-xs">
              {/* Header Top: Store Details on Left, Logo on Right */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-0.5 text-slate-600 text-xs min-w-0">
                  <h2 className="font-black text-base text-slate-950 break-words">
                    {viewModalInvoice.business?.name || 'Verified Retail Store'}
                  </h2>
                  {viewModalInvoice.business?.address && (
                    <p className="break-words whitespace-normal">{viewModalInvoice.business.address}</p>
                  )}
                  <p className="break-words">
                    {viewModalInvoice.business?.phone ? `Mobile: ${viewModalInvoice.business.phone}` : ''}
                    {viewModalInvoice.business?.phone && viewModalInvoice.business?.email ? ' • ' : ''}
                    {viewModalInvoice.business?.email ? `Email: ${viewModalInvoice.business.email}` : ''}
                  </p>
                </div>

                {viewModalInvoice.business?.logoUrl ? (
                  <div className="h-12 max-w-[140px] flex items-center justify-end shrink-0">
                    <img
                      src={viewModalInvoice.business.logoUrl}
                      alt="Store Logo"
                      className="max-h-12 max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-right flex items-center gap-1.5 justify-end shrink-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                      {(viewModalInvoice.business?.name || 'NG').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-base font-black text-slate-900 tracking-tight">
                      {viewModalInvoice.business?.name || 'NoxGuarda'}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200" />

              {/* Dual Box Layout */}
              <div className="grid grid-cols-2 gap-4 items-stretch print:grid-cols-2">
                {/* Left: Invoice To */}
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1 min-w-0 overflow-hidden">
                  <p className="font-black text-blue-700 text-xs">Invoice To:</p>
                  <p className="font-extrabold text-slate-900 text-sm break-words">
                    {viewModalInvoice.customer?.name || 'Valued Store Customer'}
                  </p>
                  <p className="text-slate-600 text-xs break-words whitespace-normal leading-relaxed">
                    {viewModalInvoice.customer?.address || 'Retail Customer Address'}
                  </p>
                  <p className="text-slate-600 text-xs break-all">
                    Email: {viewModalInvoice.customer?.email || 'customer@example.com'}
                  </p>
                  <p className="text-slate-600 text-xs break-words">
                    Phone: {viewModalInvoice.customer?.phone || 'N/A'}
                  </p>
                </div>

                {/* Right: Solid Blue Banner Metadata Table */}
                <div className="rounded-xl border border-blue-900/20 overflow-hidden shadow-xs">
                  <div className="bg-[#3b5998] text-white px-3.5 py-2.5 flex justify-between items-center font-extrabold text-xs">
                    <span>Invoice No:</span>
                    <span className="font-mono tracking-wide">
                      {viewModalInvoice.invoiceNumber || viewModalInvoice.receiptNumber || 'INV/2026/0013'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 space-y-1.5 text-xs border-t border-blue-900/10">
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="font-bold text-slate-600">Invoice Date:</span>
                      <span className="font-mono text-slate-900">
                        {new Date(viewModalInvoice.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="font-bold text-slate-600">Payment Status:</span>
                      <span className={`font-extrabold ${viewModalInvoice.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {viewModalInvoice.paymentStatus || 'PENDING'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-600">Due Date:</span>
                      <span className="font-mono text-slate-900">
                        {viewModalInvoice.dueDate || new Date(new Date(viewModalInvoice.createdAt).getTime() + 15 * 86400000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table with Solid Blue Banner Header */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#3b5998] text-white font-black">
                    <tr>
                      <th className="py-2.5 px-3 w-10">Sr.</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-center w-16">Quantity</th>
                      <th className="py-2.5 px-3 text-right w-24">Unit Price</th>
                      <th className="py-2.5 px-3 text-right w-16">Taxes</th>
                      <th className="py-2.5 px-3 text-right w-24">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {viewModalInvoice.items && viewModalInvoice.items.length > 0 ? (
                      viewModalInvoice.items.map((it: any, idx: number) => {
                        const dev = it.phoneRecord;
                        return (
                          <tr key={it.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                            <td className="py-2.5 px-3 text-slate-400 font-bold">{idx + 1}</td>
                            <td className="py-2.5 px-3">
                              <p className="font-bold text-slate-900">
                                {it.description || (dev ? `${dev.brand} ${dev.model}` : 'Hardware Item')}
                              </p>
                              {dev?.imei1 && (
                                <p className="text-[11px] text-slate-500 font-mono">
                                  IMEI: {dev.imei1} {dev.color ? `• ${dev.color}` : ''} {dev.storageCapacity ? `• ${dev.storageCapacity}` : ''}
                                </p>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold">{it.quantity || 1}.000</td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              ₦{Number(it.unitPrice || it.price || 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-400">₦0.00</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                              ₦{Number(it.totalPrice || it.unitPrice || it.price || 0).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr className="bg-white">
                        <td className="py-2.5 px-3 text-slate-400 font-bold">1</td>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-slate-900">Electronics & Hardware Package</p>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">1.000</td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          ₦{Number(viewModalInvoice.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-400">₦0.00</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                          ₦{Number(viewModalInvoice.totalAmount || 0).toLocaleString()}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Subtotal, Total & Bank Remittance Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-1">
                {/* Bank Remittance Instructions on Left */}
                {(() => {
                  const bank = getInvoiceBankDetails(viewModalInvoice);
                  if (!bank.bankName && !bank.accountNumber) return <div />;
                  return (
                    <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs space-y-1">
                      <p className="font-extrabold text-blue-900 text-xs uppercase tracking-wide">
                        Direct Bank Remittance / Payment Details:
                      </p>
                      {bank.bankName && (
                        <p className="text-blue-950 font-bold">
                          Bank: <span className="font-normal">{bank.bankName}</span>
                        </p>
                      )}
                      {bank.accountNumber && (
                        <p className="text-blue-950 font-bold">
                          Account #: <span className="font-mono">{bank.accountNumber}</span>
                        </p>
                      )}
                      {bank.accountName && (
                        <p className="text-blue-950 font-bold">
                          Account Name: <span className="font-normal">{bank.accountName}</span>
                        </p>
                      )}
                      <p className="text-blue-700 text-[11px] pt-1">
                        Payment Ref: <span className="font-mono font-bold">{viewModalInvoice.invoiceNumber || viewModalInvoice.id}</span>
                      </p>
                    </div>
                  );
                })()}

                {/* Subtotal & Total Right Aligned */}
                <div className="space-y-1 text-xs sm:ml-auto w-full sm:w-64">
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>SubTotal</span>
                    <span className="font-mono text-slate-900">
                      ₦{Number(viewModalInvoice.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Taxes</span>
                    <span className="font-mono text-slate-900">₦0.00</span>
                  </div>
                  <div className="border-t-2 border-slate-900 pt-2 flex justify-between text-slate-900 font-black text-sm">
                    <span>TOTAL DUE</span>
                    <span className="font-mono text-slate-950 text-base">
                      ₦{Number(viewModalInvoice.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Policy & Remark Bullets */}
              <div className="pt-2 text-xs text-slate-600 space-y-1">
                <p className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0" />
                  <strong>Payment Term:</strong> {viewModalInvoice.paymentTerms || 'Due on invoice receipt'}
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0" />
                  <strong>Warranty:</strong> {viewModalInvoice.business?.warrantyTerms || '12-Month Official Store Guarantee Included • Serial verified in store ledger'}
                </p>
              </div>

              {/* Bottom Footer Bar */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-slate-500 font-medium">
                <div>
                  {viewModalInvoice.business?.name || 'NoxGuarda Retail Store'}
                  {viewModalInvoice.business?.phone ? ` • Phone: ${viewModalInvoice.business.phone}` : ''}
                  {viewModalInvoice.business?.email ? ` • Email: ${viewModalInvoice.business.email}` : ''}
                </div>
                <div className="font-bold text-slate-600">Page: 1 / 1</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {invoiceToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Delete Invoice</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Invoice #</span>
                <span className="font-mono font-bold text-blue-600">
                  {invoiceToDelete.invoiceNumber || invoiceToDelete.receiptNumber || invoiceToDelete.id}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Customer</span>
                <span className="font-bold text-slate-800">{invoiceToDelete.customer?.name || 'Retail Customer'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Total Amount</span>
                <span className="font-extrabold text-slate-900">
                  ₦{Number(invoiceToDelete.totalAmount || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete this invoice? Any linked unsold devices will be returned to available inventory.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isDeleting}
                onClick={() => {
                  setInvoiceToDelete(null);
                  setDeleteError(null);
                }}
              >
                Cancel
              </Button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteInvoice}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm shadow-rose-600/20 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Invoice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Printable Commercial Invoice for Standard Clean A4 Page Output */}
      {(() => {
        const inv = invoiceToPrint || viewModalInvoice;
        if (!inv) return null;

        const bank = getInvoiceBankDetails(inv);

        return (
          <div id="printable-a4-invoice" className="hidden print:block">
            <A4CommercialInvoice
              id="printable-a4-invoice-content"
              data={{
                invoiceNumber: inv.invoiceNumber || inv.receiptNumber,
                id: inv.id,
                createdAt: inv.createdAt,
                dueDate: inv.dueDate,
                paymentStatus: inv.paymentStatus,
                paymentMethod: inv.paymentMethod,
                paymentTerms: inv.paymentTerms,
                notes: inv.notes,
                totalAmount: inv.totalAmount || 0,
                amountPaid: inv.amountPaid || 0,
                customerName: inv.customer?.name,
                customerPhone: inv.customer?.phone,
                customerEmail: inv.customer?.email,
                customerAddress: inv.customer?.address || inv.billingAddress,
                business: {
                  name: inv.business?.name || summaryData?.business?.name,
                  address: inv.business?.address || summaryData?.business?.address,
                  phone: inv.business?.phone || summaryData?.business?.phone,
                  email: inv.business?.email || summaryData?.business?.email,
                  logoUrl: inv.business?.logoUrl || summaryData?.business?.logoUrl,
                  bankName: bank.bankName || inv.business?.bankName,
                  accountNumber: bank.accountNumber || inv.business?.accountNumber,
                  accountName: bank.accountName || inv.business?.accountName,
                  warrantyTerms: inv.business?.warrantyTerms,
                },
                items: inv.items || [],
              }}
            />
          </div>
        );
      })()}

      {/* Global Print Styling for Clean A4 Page Output */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            height: auto !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-a4-invoice,
          #printable-a4-invoice * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-a4-invoice {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            z-index: 999999 !important;
          }
        }
      `}</style>

    </div>
  );
}
