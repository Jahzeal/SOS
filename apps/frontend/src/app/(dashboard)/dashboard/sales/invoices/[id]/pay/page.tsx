'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  CreditCard,
  Building2,
  Wallet,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileText,
  Printer,
  Mail,
  User,
  Clock,
  ShieldCheck,
  DollarSign,
  Copy,
  Check,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { A4CommercialInvoice } from '@/components/invoice/A4CommercialInvoice';

export default function RecordInvoicePaymentPage({ params }: { params?: { id: string } }) {
  const router = useRouter();
  const routeParams = useParams();
  const invoiceId = (routeParams?.id as string) || params?.id || '';
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<any | null>(null);

  // Payment Form State
  const [paymentMode, setPaymentMode] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'CASH' | 'POS' | 'CARD' | 'SPLIT'>('BANK_TRANSFER');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Load invoice data
  useEffect(() => {
    async function loadInvoice() {
      if (!invoiceId) return;
      setIsLoading(true);
      setLoadError(null);
      try {
        let inv = await api.getInvoiceById(invoiceId).catch(() => null);
        if (!inv) {
          const list = await api.getInvoices();
          inv = list?.find((i: any) => i.id === invoiceId || i.invoiceNumber === invoiceId || i.receiptNumber === invoiceId);
        }

        if (!inv) {
          setLoadError('Invoice statement not found.');
          return;
        }

        setInvoice(inv);
      } catch (err: any) {
        console.error('Failed to load invoice for payment:', err);
        setLoadError(err.message || 'Failed to load invoice.');
      } finally {
        setIsLoading(false);
      }
    }

    loadInvoice();
  }, [invoiceId]);

  // Calculation figures
  const total = Number(invoice?.totalAmount || 0);
  const paid = Number(invoice?.amountPaid || 0);
  const remaining = Math.max(0, total - paid);

  const amountToPay = useMemo(() => {
    if (paymentMode === 'FULL') return remaining;
    const parsed = parseFloat(customAmount.replace(/,/g, '')) || 0;
    return Math.min(parsed, remaining);
  }, [paymentMode, remaining, customAmount]);

  const handleQuickPercent = (pct: number) => {
    setPaymentMode('PARTIAL');
    const amt = Math.round((remaining * pct) / 100);
    setCustomAmount(amt.toString());
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    if (amountToPay <= 0) {
      setSubmitError('Please enter a valid payment amount greater than zero.');
      return;
    }

    if (amountToPay > remaining) {
      setSubmitError(`Payment amount (₦${amountToPay.toLocaleString()}) cannot exceed the remaining balance of ₦${remaining.toLocaleString()}.`);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await api.markInvoicePaid(invoice.id, {
        paymentMethod,
        amount: amountToPay,
        reference: paymentReference.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['recent-sales'] });

      setIsSuccess(true);
    } catch (err: any) {
      console.error('Failed to record payment:', err);
      setSubmitError(err.message || 'Failed to record payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3 font-sans">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
        <p className="font-bold text-slate-600 text-sm">Loading invoice billing details...</p>
      </div>
    );
  }

  if (loadError || !invoice) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4 font-sans">
        <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Invoice Not Found</h2>
        <p className="text-xs text-slate-500">{loadError || 'Unable to locate invoice statement.'}</p>
        <Link href="/dashboard/sales/invoices">
          <Button variant="secondary" size="md">
            Back to Invoices Registry
          </Button>
        </Link>
      </div>
    );
  }

  const invoiceNum = invoice.invoiceNumber || invoice.receiptNumber || invoice.id;
  const status = (invoice.paymentStatus || 'PENDING').toUpperCase();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-28 md:pb-12 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
            <Link href="/dashboard/sales/invoices" className="hover:text-blue-600 transition flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Invoices Registry
            </Link>
            <span>/</span>
            <span className="font-mono text-slate-700">#{invoiceNum}</span>
            <span>/</span>
            <span className="text-slate-900">Record Payment</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
              Record Invoice Payment
            </h1>
            <Badge
              variant={
                status === 'PAID'
                  ? 'verified'
                  : status === 'PARTIALLY_PAID'
                  ? 'warning'
                  : 'business'
              }
              size="sm"
            >
              {status}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/dashboard/sales/invoices/${invoice.id}/edit`}>
            <Button variant="secondary" size="sm">
              Edit Invoice
            </Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={handlePrint} leftIcon={<Printer className="w-3.5 h-3.5" />}>
            Print Statement
          </Button>
        </div>
      </div>

      {isSuccess ? (
        /* Success Screen */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-950">Payment Recorded Successfully!</h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Payment of <strong className="text-slate-900 font-mono">₦{amountToPay.toLocaleString()}</strong> has been posted to invoice #{invoiceNum}.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Customer:</span>
              <span className="font-extrabold text-slate-900">{invoice.customer?.name || 'Customer'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Payment Method:</span>
              <span className="font-bold text-slate-900">{paymentMethod.replace('_', ' ')}</span>
            </div>
            {paymentReference && (
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Reference:</span>
                <span className="font-mono font-bold text-blue-600">{paymentReference}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
              <span className="text-slate-700">New Outstanding Balance:</span>
              <span className="font-mono text-emerald-700 font-extrabold text-sm">
                ₦{Math.max(0, remaining - amountToPay).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button variant="primary" size="md" onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>
              Print Updated A4 Statement
            </Button>
            <Link href="/dashboard/sales/invoices">
              <Button variant="secondary" size="md">
                Return to Invoices Registry
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Main Payment Form Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form: Payment Setup */}
          <form onSubmit={handleRecordPayment} className="lg:col-span-7 space-y-6">
            {submitError && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in fade-in">
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Payment Mode (Full vs Partial) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Settlement Type & Amount
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMode('FULL')}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                    paymentMode === 'FULL'
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <p className="font-extrabold text-xs text-slate-900">Full Settlement</p>
                  <p className="text-[11px] text-emerald-700 font-mono font-bold mt-0.5">
                    Pay entire ₦{remaining.toLocaleString()}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('PARTIAL')}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                    paymentMode === 'PARTIAL'
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <p className="font-extrabold text-xs text-slate-900">Partial Payment</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Custom installment amount
                  </p>
                </button>
              </div>

              {paymentMode === 'PARTIAL' && (
                <div className="space-y-3 pt-2 animate-in fade-in">
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-700">Enter Payment Amount (₦) *</label>
                    <input
                      type="text"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="e.g. 50000"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-base font-extrabold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-bold">Quick set:</span>
                    <button
                      type="button"
                      onClick={() => handleQuickPercent(25)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPercent(50)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPercent(75)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                    >
                      75%
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method Cards */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" /> Payment Channel
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-bold">
                {[
                  { id: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Building2 },
                  { id: 'CASH', label: 'Cash', icon: Wallet },
                  { id: 'POS', label: 'POS Terminal', icon: CreditCard },
                  { id: 'CARD', label: 'Card / Online', icon: CreditCard },
                  { id: 'SPLIT', label: 'Split Method', icon: ArrowRight },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Reference & Remarks */}
              <div className="space-y-3 pt-2 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Transaction Reference / Receipt #</label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g. NIP-TXN-893129 or POS Ref"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Internal Audit Remarks</label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="e.g. Received by cashier in morning shift"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action Bar */}
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                isLoading={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-600/20"
                leftIcon={<CheckCircle2 className="w-5 h-5" />}
              >
                Confirm & Record ₦{amountToPay.toLocaleString()} Payment
              </Button>
            </div>
          </form>

          {/* Right Summary Column: Ledger & Customer Details */}
          <div className="lg:col-span-5 space-y-6">
            {/* Balance Overview Card */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                INVOICE BALANCE SUMMARY
              </span>

              <div className="space-y-1">
                <p className="text-xs text-slate-300 font-medium">Outstanding Balance Due</p>
                <h3 className="text-3xl font-black tracking-tight text-white font-mono">
                  ₦{remaining.toLocaleString()}
                </h3>
              </div>

              <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Invoice</span>
                  <span className="font-bold text-slate-100 font-mono">₦{total.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Already Paid</span>
                  <span className="font-bold text-emerald-400 font-mono">₦{paid.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Billed Client Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs">
              <h4 className="font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> Billed Customer
              </h4>
              <div className="space-y-1">
                <p className="font-extrabold text-slate-900 text-sm">{invoice.customer?.name || 'Retail Customer'}</p>
                {invoice.customer?.phone && <p className="text-slate-600">Phone: {invoice.customer.phone}</p>}
                {invoice.customer?.email && <p className="text-slate-600">Email: {invoice.customer.email}</p>}
                {invoice.customer?.address && (
                  <p className="text-slate-500 break-words whitespace-normal leading-relaxed pt-1">
                    {invoice.customer.address}
                  </p>
                )}
              </div>
            </div>

            {/* Itemized Snapshot */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs">
              <h4 className="font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                <span>Invoice Items ({invoice.items?.length || 0})</span>
                <span className="font-mono text-slate-500 font-normal">#{invoiceNum}</span>
              </h4>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((it: any, idx: number) => {
                    const title = it.description || (it.phoneRecord ? `${it.phoneRecord.brand} ${it.phoneRecord.model}` : 'Item');
                    const qty = it.quantity || 1;
                    const price = Number(it.price || it.unitPrice || 0);
                    return (
                      <div key={idx} className="py-2 flex justify-between items-start gap-2">
                        <div>
                          <p className="font-bold text-slate-900">{title}</p>
                          {it.phoneRecord?.imei1 && (
                            <p className="text-[10px] text-slate-400 font-mono">IMEI: {it.phoneRecord.imei1}</p>
                          )}
                          <p className="text-[10px] text-slate-500">Qty: {qty}</p>
                        </div>
                        <span className="font-mono font-bold text-slate-900 shrink-0">
                          ₦{(price * qty).toLocaleString()}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="py-2 text-slate-400">No items listed</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Printable Invoice for Standard Clean A4 Page Output */}
      <div id="printable-a4-invoice" className="hidden print:block">
        <A4CommercialInvoice
          id="printable-a4-invoice-content"
          data={{
            invoiceNumber: invoiceNum,
            id: invoice.id,
            createdAt: invoice.createdAt,
            dueDate: invoice.dueDate,
            paymentStatus: isSuccess ? (amountToPay >= remaining ? 'PAID' : 'PARTIALLY_PAID') : status,
            paymentTerms: invoice.paymentTerms,
            notes: invoice.notes,
            totalAmount: total,
            amountPaid: isSuccess ? paid + amountToPay : paid,
            customerName: invoice.customer?.name,
            customerPhone: invoice.customer?.phone,
            customerEmail: invoice.customer?.email,
            customerAddress: invoice.customer?.address,
            business: invoice.business,
            items: invoice.items || [],
          }}
        />
      </div>

      {/* Global Print Styling */}
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
