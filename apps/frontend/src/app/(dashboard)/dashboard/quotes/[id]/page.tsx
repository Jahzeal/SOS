'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  FileSpreadsheet,
  Printer,
  Mail,
  Receipt,
  Download,
  Edit,
  Trash2,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Send,
  Loader2,
  ArrowRight,
  Share2,
  Store,
  Building,
  Check,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'a4' | 'pos'>('a4');
  const [isConverting, setIsConverting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Email Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('TRANSFER');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // Reminder Modal State
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [reminderResult, setReminderResult] = useState<any>(null);

  const loadQuote = async () => {
    setLoading(true);
    try {
      const data = await api.getQuoteById(id);
      setQuote(data);
      if (data?.customer?.email) setEmailInput(data.customer.email);
    } catch (err) {
      console.error('Failed to load quote details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadQuote();
  }, [id]);

  const handleRecordPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    setIsRecordingPayment(true);
    try {
      await api.recordQuotePayment(id, {
        amount,
        paymentMethod,
        reference: paymentRef.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
      });
      alert(`Payment of ₦${amount.toLocaleString()} recorded successfully!`);
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentRef('');
      setPaymentNotes('');
      loadQuote();
    } catch (err: any) {
      alert(err.message || 'Failed to record payment.');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleSendReminder = async () => {
    setIsSendingReminder(true);
    setShowReminderModal(true);
    setReminderResult(null);
    try {
      const res = await api.sendQuoteInstallmentReminder(id);
      setReminderResult(res);
      loadQuote();
    } catch (err: any) {
      alert(err.message || 'Failed to send payment reminder.');
      setShowReminderModal(false);
    } finally {
      setIsSendingReminder(false);
    }
  };

  const handleConvertToSale = async () => {
    if (!confirm(`Convert Quotation #${quote?.quoteNumber} into a Commercial Invoice / Sale?`)) {
      return;
    }
    setIsConverting(true);
    try {
      const res = await api.convertQuoteToSale(id, { asInvoice: true });
      if (res?.sale?.id) {
        router.push(`/dashboard/invoices`);
      } else {
        await loadQuote();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to convert quotation.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    setIsUpdatingStatus(true);
    try {
      await api.updateQuote(id, { status });
      await loadQuote();
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailInput.trim()) {
      alert('Please enter a valid email address.');
      return;
    }
    setIsSendingEmail(true);
    setEmailSuccess(null);
    try {
      await api.sendQuoteEmail(id, emailInput.trim());
      setEmailSuccess(`Quotation successfully emailed to ${emailInput}!`);
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailSuccess(null);
        loadQuote();
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to send email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete quotation #${quote?.quoteNumber}?`)) {
      return;
    }
    try {
      await api.deleteQuote(id);
      router.push('/dashboard/quotes');
    } catch (err: any) {
      alert(err.message || 'Failed to delete quotation.');
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-bold">Loading quotation details...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-base font-bold text-slate-800">Quotation not found.</p>
        <Link href="/dashboard/quotes">
          <Button variant="secondary" size="sm">Back to Quotations</Button>
        </Link>
      </div>
    );
  }

  const isConverted = quote.status === 'CONVERTED';
  const isAccepted = quote.status === 'ACCEPTED';
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

  const accentColor = quote.business?.quoteAccentColor || '#2563EB';

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8">

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <nav className="flex items-center text-xs font-semibold text-slate-500 gap-1 mb-1">
            <Link href="/dashboard" className="hover:text-slate-900 transition">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/dashboard/quotes" className="hover:text-slate-900 transition">Quotations</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-blue-600 font-bold font-mono">{quote.quoteNumber}</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
              {quote.quoteNumber}
            </h1>
            <span className="text-xs font-black px-2.5 py-1 rounded-full uppercase border bg-slate-100 text-slate-800">
              {quote.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Issued on {formattedDate} • Valid until {expiryDateStr}
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!isConverted && (
            <Button
              variant="primary"
              size="md"
              onClick={handleConvertToSale}
              disabled={isConverting}
              leftIcon={isConverting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
              className="bg-purple-600 hover:bg-purple-500 font-bold shadow-md shadow-purple-600/20"
            >
              {isConverting ? 'Converting...' : 'Convert to Invoice'}
            </Button>
          )}

          {!isConverted && quote.balanceDue > 0 && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setPaymentAmount(quote.balanceDue.toString());
                setShowPaymentModal(true);
              }}
              leftIcon={<Receipt className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-500 font-bold shadow-md shadow-emerald-600/20"
            >
              Record Payment
            </Button>
          )}

          {!isConverted && quote.balanceDue > 0 && (
            <Button
              variant="secondary"
              size="md"
              onClick={handleSendReminder}
              leftIcon={<Clock className="w-4 h-4 text-amber-600" />}
              className="font-bold border-slate-200 text-amber-700 bg-amber-50 hover:bg-amber-100"
            >
              Send Reminder
            </Button>
          )}

          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowEmailModal(true)}
            leftIcon={<Mail className="w-4 h-4 text-blue-600" />}
            className="font-bold border-slate-200"
          >
            Email PDF
          </Button>

          <a
            href={api.getQuotePdfDownloadUrl(quote.id)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" size="md" leftIcon={<Download className="w-4 h-4" />} className="font-bold border-slate-200">
              Download PDF
            </Button>
          </a>

          <Button
            variant="secondary"
            size="md"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-4 h-4" />}
            className="font-bold border-slate-200"
          >
            Print
          </Button>

          {!isConverted && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition"
              title="Delete Quotation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Converted Banner Notice */}
      {isConverted && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold text-purple-900">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
            <span>
              This quotation was converted into an official sale.
              {quote.convertedSale?.invoiceNumber ? ` Invoice #${quote.convertedSale.invoiceNumber}` : ''}
            </span>
          </div>
          <Link href="/dashboard/invoices">
            <span className="text-purple-700 hover:underline flex items-center gap-1 font-bold">
              View Invoices Registry <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      )}

      {/* Status Bar / Workflow Switcher (if not converted) */}
      {!isConverted && (
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Update Status:</span>
            {['DRAFT', 'SENT', 'PARTIALLY_PAID', 'ACCEPTED', 'DECLINED'].map((st) => (
              <button
                key={st}
                onClick={() => handleUpdateStatus(st)}
                disabled={isUpdatingStatus || quote.status === st}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition border ${
                  quote.status === st
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                }`}
              >
                {st === 'PARTIALLY_PAID' ? 'PARTIAL DEPOSIT' : st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Format:</span>
            <button
              onClick={() => setViewMode('a4')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                viewMode === 'a4' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              A4 Proposal
            </button>
            <button
              onClick={() => setViewMode('pos')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                viewMode === 'pos' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              80mm Thermal Slip
            </button>
          </div>
        </div>
      )}

      {/* Main Document Display */}
      {viewMode === 'a4' ? (
        /* A4 Full Document Format */
        <div className="p-6 sm:p-10 rounded-2xl bg-white border border-slate-300 shadow-xl max-w-4xl mx-auto space-y-6 text-xs text-slate-800 font-sans print:border-none print:shadow-none print:p-0">

          {/* Header Banner */}
          <div className="flex justify-between items-start gap-4 border-b border-slate-200 pb-5">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-950 uppercase">{quote.business?.name || 'Your Store'}</h2>
              {quote.business?.address && <p className="text-slate-600">{quote.business.address}</p>}
              <p className="text-slate-600">
                {quote.business?.phone ? `Tel: ${quote.business.phone}` : ''}
                {quote.business?.email ? ` • Email: ${quote.business.email}` : ''}
              </p>
            </div>

            <div className="text-right space-y-1">
              <div
                className="inline-block px-3.5 py-1.5 rounded-xl text-white font-black text-xs tracking-wider"
                style={{ backgroundColor: accentColor }}
              >
                {quote.business?.quoteTitle || 'PRICE QUOTATION'}
              </div>
              <p className="font-mono text-slate-600 font-extrabold text-sm">{quote.quoteNumber}</p>
            </div>
          </div>

          {/* Dual Metadata Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Box */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1">
              <p className="font-black text-xs tracking-tight uppercase" style={{ color: accentColor }}>
                Quotation For / Prospective Client:
              </p>
              <p className="font-extrabold text-slate-900 text-sm">{quote.customer?.name || 'Valued Client'}</p>
              {quote.customer?.address && <p className="text-slate-600 text-xs">{quote.customer.address}</p>}
              <p className="text-slate-600 text-xs">
                {quote.customer?.phone ? `Contact: ${quote.customer.phone}` : ''}
                {quote.customer?.email ? ` • ${quote.customer.email}` : ''}
              </p>
            </div>

            {/* Quote Meta Box */}
            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="text-white px-3.5 py-2 flex justify-between items-center font-bold text-xs" style={{ backgroundColor: accentColor }}>
                <span>Proposal Timeline</span>
                <span className="font-mono font-black">{quote.status}</span>
              </div>
              <div className="p-3 bg-white space-y-1.5 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="font-bold text-slate-500">Quote Date:</span>
                  <span className="font-mono text-slate-900 font-bold">{formattedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500">Valid Until:</span>
                  <span className="font-mono text-slate-900 font-bold">{expiryDateStr}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subject note if any */}
          {quote.subject && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
              <strong>Subject:</strong> {quote.subject}
            </div>
          )}

          {/* Items Table */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="text-white font-black" style={{ backgroundColor: accentColor }}>
                <tr>
                  <th className="py-2.5 px-3.5 w-10">#</th>
                  <th className="py-2.5 px-3.5">Item Description & Specifications</th>
                  <th className="py-2.5 px-3.5 text-center w-16">Qty</th>
                  <th className="py-2.5 px-3.5 text-right w-28">Unit Price</th>
                  <th className="py-2.5 px-3.5 text-center w-16">Disc.</th>
                  <th className="py-2.5 px-3.5 text-right w-32">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 font-medium">
                {quote.items.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3.5 text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3 px-3.5">
                      <p className="font-bold text-slate-900">{item.description}</p>
                      {item.phoneRecord?.imei1 && (
                        <p className="text-[10px] text-slate-500 font-mono">
                          Hardware IMEI: {item.phoneRecord.imei1}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-center font-bold">{item.quantity}</td>
                    <td className="py-3 px-3.5 text-right font-mono">₦{item.unitPrice.toLocaleString()}</td>
                    <td className="py-3 px-3.5 text-center text-slate-500 font-mono">
                      {item.discount ? `${item.discount}%` : '-'}
                    </td>
                    <td className="py-3 px-3.5 text-right font-black text-slate-900 font-mono">
                      ₦{item.totalPrice.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Agreed Installment Payment Schedule (If Configured) */}
          {quote.hasInstallments && quote.installments && quote.installments.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" /> Agreed Installment Payment Schedule
                </h3>
                <span className="text-[10px] text-slate-500 font-medium">
                  {quote.sendCustomerReminders ? '✓ Automated customer reminders active' : 'Manual follow-ups'}
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Installment</th>
                      <th className="py-2 px-3">Due Date</th>
                      <th className="py-2 px-3 text-right">Amount Due</th>
                      <th className="py-2 px-3 text-right">Amount Paid</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-xs">
                    {quote.installments.map((inst: any) => {
                      const isPaid = inst.status === 'PAID';
                      const dueDateFormatted = new Date(inst.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });

                      return (
                        <tr key={inst.id || inst.installmentNo} className={isPaid ? 'bg-emerald-50/40' : 'hover:bg-slate-50'}>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            Installment #{inst.installmentNo}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 font-mono">
                            {dueDateFormatted}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            ₦{inst.amountDue.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                            ₦{(inst.amountPaid || 0).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                              isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {inst.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment History Ledger (If any payments recorded) */}
          {quote.payments && quote.payments.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-600" /> Payment & Deposit Receipts Received
              </h3>

              <div className="rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Method</th>
                      <th className="py-2 px-3">Reference / Notes</th>
                      <th className="py-2 px-3 text-right">Amount Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-xs">
                    {quote.payments.map((p: any) => {
                      const pDate = new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });
                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono text-slate-700">{pDate}</td>
                          <td className="py-2 px-3 font-bold text-slate-800">{p.paymentMethod}</td>
                          <td className="py-2 px-3 text-slate-600">
                            {p.reference ? <span className="font-mono font-bold mr-1">Ref: {p.reference}</span> : null}
                            {p.notes || '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-black text-emerald-700">
                            ₦{p.amount.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Totals & Remittance Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-2">
            {/* Bank Remittance Instructions */}
            {quote.business?.bankName && quote.business?.accountNumber ? (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <p className="font-black text-slate-900 uppercase tracking-wide">
                  Bank Remittance Instructions:
                </p>
                <p className="text-slate-800 font-bold">
                  Bank: <span className="font-normal">{quote.business.bankName}</span>
                </p>
                <p className="text-slate-800 font-bold">
                  Account #: <span className="font-mono">{quote.business.accountNumber}</span>
                </p>
                <p className="text-slate-800 font-bold">
                  Account Name: <span className="font-normal">{quote.business.accountName || quote.business.name}</span>
                </p>
                <p className="text-slate-500 text-[11px] pt-1">
                  Reference: <span className="font-mono font-bold text-slate-800">{quote.quoteNumber}</span>
                </p>
              </div>
            ) : (
              <div />
            )}

            {/* Financial Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs sm:ml-auto w-full sm:w-72">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-900 font-bold">₦{quote.subtotal.toLocaleString()}</span>
              </div>
              {quote.discount > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>Discount:</span>
                  <span className="font-mono">-₦{quote.discount.toLocaleString()}</span>
                </div>
              )}
              {quote.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Tax / VAT ({quote.taxRate}%):</span>
                  <span className="font-mono">+₦{quote.taxAmount.toLocaleString()}</span>
                </div>
              )}
              <div
                className="p-2.5 rounded-xl text-white flex justify-between items-baseline font-black pt-2"
                style={{ backgroundColor: accentColor }}
              >
                <span className="text-xs uppercase">Estimated Total:</span>
                <span className="font-mono text-base font-black">₦{quote.totalAmount.toLocaleString()}</span>
              </div>

              {quote.amountPaid > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                  <span>Deposit Received:</span>
                  <span className="font-mono">₦{quote.amountPaid.toLocaleString()}</span>
                </div>
              )}
              {quote.balanceDue > 0 && (
                <div className="flex justify-between text-amber-800 font-bold">
                  <span>Remaining Balance:</span>
                  <span className="font-mono">₦{quote.balanceDue.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Terms & Notes */}
          {(quote.notes || quote.terms) && (
            <div className="pt-2 border-t border-slate-200 text-xs text-slate-600 space-y-2">
              {quote.notes && (
                <p><strong className="text-slate-800">Note:</strong> {quote.notes}</p>
              )}
              {quote.terms && (
                <p><strong className="text-slate-800">Terms & Conditions:</strong> {quote.terms}</p>
              )}
            </div>
          )}

          {/* Signature Line */}
          {quote.business?.quoteShowSignature !== false && (
            <div className="pt-8 flex justify-end">
              <div className="w-56 text-center border-t border-slate-400 pt-1.5 text-xs font-bold text-slate-700">
                Authorized Signature / Company Stamp
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 80mm Thermal Slip View */
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xl max-w-sm mx-auto space-y-4 font-mono text-xs text-slate-900 text-left">
          <div className="text-center space-y-1 border-b border-slate-200 pb-3 font-sans">
            <p className="font-black text-sm text-slate-950 uppercase">{quote.business?.name || 'Your Store'}</p>
            {quote.business?.address && <p className="text-[10px] text-slate-500">{quote.business.address}</p>}
            {quote.business?.phone && <p className="text-[10px] text-slate-500">Tel: {quote.business.phone}</p>}
            <p className="font-black text-xs text-blue-600 pt-1 uppercase">ESTIMATE / QUOTATION</p>
          </div>

          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Quote #: {quote.quoteNumber}</span>
            <span>{formattedDate}</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Client: <strong className="text-slate-900">{quote.customer?.name || 'Walk-in'}</strong>
          </div>

          <div className="border-y border-slate-200 py-2 space-y-1.5">
            {quote.items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-xs">
                <div>
                  <p className="font-bold">{item.description}</p>
                  <p className="text-[10px] text-slate-500">Qty: {item.quantity} @ ₦{item.unitPrice.toLocaleString()}</p>
                </div>
                <span className="font-bold">₦{item.totalPrice.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>₦{quote.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-black text-sm border-t border-slate-200 pt-1 text-slate-900">
              <span>ESTIMATED TOTAL</span>
              <span className="text-blue-600">₦{quote.totalAmount.toLocaleString()}</span>
            </div>
            {quote.amountPaid > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold text-xs pt-1">
                <span>PAID DEPOSIT</span>
                <span>₦{quote.amountPaid.toLocaleString()}</span>
              </div>
            )}
            {quote.balanceDue > 0 && (
              <div className="flex justify-between text-amber-800 font-bold text-xs">
                <span>BALANCE DUE</span>
                <span>₦{quote.balanceDue.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="pt-2 text-center text-[10px] text-slate-500 font-sans border-t border-slate-200 leading-snug">
            {quote.terms || 'Prices valid for stated validity duration. Subject to stock availability.'}
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" /> Record Deposit / Payment
                </h3>
                <p className="text-xs text-slate-500">Quote #{quote.quoteNumber}</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Total Amount</span>
                <span className="font-mono font-bold text-slate-900">₦{quote.totalAmount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 font-bold block">Already Paid</span>
                <span className="font-mono font-bold text-emerald-700">₦{quote.amountPaid.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-amber-700 font-bold block">Balance Due</span>
                <span className="font-mono font-bold text-amber-800">₦{quote.balanceDue.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Amount Received Today (₦) *</label>
                <input
                  type="number"
                  step="0.01"
                  max={quote.balanceDue}
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
                  placeholder="e.g. Received installment deposit"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={isRecordingPayment}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRecordPayment}
                  disabled={isRecordingPayment || !paymentAmount}
                  leftIcon={isRecordingPayment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  className="bg-emerald-600 hover:bg-emerald-500 font-bold"
                >
                  {isRecordingPayment ? 'Recording...' : 'Confirm Payment Receipt'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Dispatch Result Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  🔔 Payment Reminder Dispatched
                </h3>
                <p className="text-xs text-slate-500">
                  Quote #{quote.quoteNumber} • {quote.customer?.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowReminderModal(false);
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
                  <p><strong>Customer:</strong> {quote.customer?.name}</p>
                  <p><strong>Outstanding Balance:</strong> ₦{quote.balanceDue.toLocaleString()}</p>
                  {reminderResult.emailSent && (
                    <p className="text-emerald-700 font-bold">✓ Email statement sent to {quote.customer?.email}</p>
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
                      setShowReminderModal(false);
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
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" /> Send Quotation PDF via Email
                </h3>
                <p className="text-xs text-slate-500">Quote #{quote.quoteNumber}</p>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            {emailSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {emailSuccess}
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Client Email Address *</label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g. client@company.ng"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowEmailModal(false)}
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
                    {isSendingEmail ? 'Sending...' : 'Send Quotation Email'}
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
