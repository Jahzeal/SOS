'use client';
import { TextInput } from '@/components/ui/Input';

import React, { useState, useEffect } from 'react';
import {
  Share2,
  X,
  Mail,
  Download,
  Copy,
  Check,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Receipt,
  ExternalLink,
  MessageSquare,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export interface ShareDocumentData {
  id: string;
  type: 'INVOICE' | 'RECEIPT' | 'QUOTE';
  docNumber: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  totalAmount: number;
  amountPaid?: number;
  balanceDue?: number;
  paymentStatus?: string;
  items?: Array<{
    description?: string;
    phoneRecord?: { brand?: string; model?: string; imei1?: string };
    quantity?: number;
    unitPrice?: number;
    price?: number;
  }>;
  storeName?: string;
}

export interface ShareDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ShareDocumentData | null;
}

export function ShareDocumentModal({ isOpen, onClose, document: doc }: ShareDocumentModalProps) {
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email'>('whatsapp');
  
  const [isSharingFile, setIsSharingFile] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [supportsNativeFileShare, setSupportsNativeFileShare] = useState(false);

  // The PDF is fetched as soon as the dialog opens. Phones only allow the share
  // menu to open directly from a tap, so the file must already be in hand when
  // the button is pressed; fetching it after the tap makes the phone refuse.
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);
  const [shareFailed, setShareFailed] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.canShare) {
      try {
        const testFile = new File([''], 'test.pdf', { type: 'application/pdf' });
        setSupportsNativeFileShare(navigator.canShare({ files: [testFile] }));
      } catch (e) {
        setSupportsNativeFileShare(false);
      }
    }
  }, []);

  useEffect(() => {
    if (doc) {
      setPhoneInput(doc.customerPhone || '');
      setEmailInput(doc.customerEmail || '');
      setEmailSuccessMsg(null);
      setActionError(null);
    }
  }, [doc, isOpen]);

  const docId = doc?.id;
  const docType = doc?.type;
  const docNumberForFile = doc?.docNumber;

  useEffect(() => {
    setPdfFile(null);
    setPdfLoadError(null);
    setShareFailed(false);
    if (!isOpen || !docId || !docType || !supportsNativeFileShare) return;

    let cancelled = false;
    const label = docType === 'INVOICE' ? 'Invoice' : docType === 'RECEIPT' ? 'Receipt' : 'Quotation';
    const url =
      docType === 'INVOICE'
        ? api.getInvoicePdfDownloadUrl(docId)
        : docType === 'RECEIPT'
        ? api.getReceiptPdfDownloadUrl(docId)
        : api.getQuotePdfDownloadUrl(docId);

    api
      .fetchPdfFile(url, `${label}-${docNumberForFile || docId}.pdf`)
      .then((file) => {
        if (!cancelled) setPdfFile(file);
      })
      .catch((err: any) => {
        if (cancelled) return;
        setPdfLoadError(err?.message || 'Could not prepare the PDF.');
        setActionError('The PDF could not be prepared. Please close this and try again.');
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, docId, docType, docNumberForFile, supportsNativeFileShare]);

  if (!isOpen || !doc) return null;

  const docLabel = doc.type === 'INVOICE' ? 'Invoice' : doc.type === 'RECEIPT' ? 'Receipt' : 'Quotation';
  const storeName = doc.storeName || 'NoxGuarda Retail Store';
  const customerName = doc.customerName || 'Valued Client';
  const totalAmount = Number(doc.totalAmount || 0);
  const paidAmount = Number(doc.amountPaid || 0);
  const balanceDue = Number(doc.balanceDue ?? Math.max(0, totalAmount - paidAmount));
  const status = (doc.paymentStatus || (balanceDue <= 0 ? 'PAID' : 'PENDING')).toUpperCase();

  // Normalize phone for WhatsApp wa.me
  const cleanPhone = phoneInput.replace(/[^0-9]/g, '');
  const formattedWhatsAppPhone = cleanPhone.startsWith('0')
    ? `234${cleanPhone.slice(1)}`
    : cleanPhone.startsWith('234')
    ? cleanPhone
    : cleanPhone;

  // Build items preview for message
  const itemsList = doc.items && doc.items.length > 0
    ? doc.items.slice(0, 3).map((it) => {
        const title = it.description || (it.phoneRecord ? `${it.phoneRecord.brand} ${it.phoneRecord.model}` : 'Item');
        const qty = it.quantity || 1;
        return `• ${title} (x${qty})`;
      }).join('\n') + (doc.items.length > 3 ? `\n• + ${doc.items.length - 3} more items` : '')
    : '• Equipment / Retail Order';

  // Formatted text message for WhatsApp or SMS
  const whatsappMessageText = `Hello ${customerName},

Please find your official ${docLabel} statement from *${storeName}*:

📄 *${docLabel} #:* ${doc.docNumber}
💰 *Total Amount:* ₦${totalAmount.toLocaleString()}
${doc.type === 'INVOICE' && status === 'PARTIALLY_PAID' ? `💳 *Amount Paid:* ₦${paidAmount.toLocaleString()}\n⏳ *Balance Due:* ₦${balanceDue.toLocaleString()}\n` : ''}📊 *Status:* ${status}

📦 *Items Summary:*
${itemsList}

Thank you for your business!`;

  const getPdfDownloadUrl = () => {
    if (doc.type === 'INVOICE') return api.getInvoicePdfDownloadUrl(doc.id);
    if (doc.type === 'RECEIPT') return api.getReceiptPdfDownloadUrl(doc.id);
    return api.getQuotePdfDownloadUrl(doc.id);
  };

  const getPdfFilename = () => {
    return `${docLabel}-${doc.docNumber || doc.id}.pdf`;
  };

  // 1. Native File Share (Attaches actual .pdf to WhatsApp on mobile/supported desktop)
  const handleSharePdfFile = async () => {
    if (!pdfFile) return; // still being prepared; the button is disabled until it is ready
    setIsSharingFile(true);
    setActionError(null);

    try {
      // Sharing the file on its own (no text) makes WhatsApp attach it as a document.
      await navigator.share({
        files: [pdfFile],
        title: getPdfFilename(),
      });
    } catch (err: any) {
      // AbortError = the person closed the share menu themselves.
      if (err?.name !== 'AbortError') {
        // Never fall back to a text-only message silently: show the manual route instead.
        setShareFailed(true);
        setActionError(
          'Your phone would not open the share menu. Save the PDF below, then attach it in the WhatsApp chat.',
        );
      }
    } finally {
      setIsSharingFile(false);
    }
  };

  // 2. Open WhatsApp Chat directly
  const handleOpenWhatsAppChat = () => {
    const encodedText = encodeURIComponent(whatsappMessageText);
    const targetUrl = formattedWhatsAppPhone
      ? `https://wa.me/${formattedWhatsAppPhone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // 3. Email PDF Dispatch via Backend API
  const handleSendEmail = async () => {
    const email = emailInput.trim();
    if (!email) {
      setActionError('Please enter a valid customer email address.');
      return;
    }

    setIsSendingEmail(true);
    setActionError(null);
    setEmailSuccessMsg(null);

    try {
      if (doc.type === 'INVOICE') {
        await api.sendInvoiceEmail(doc.id, email);
      } else if (doc.type === 'RECEIPT') {
        await api.sendReceiptEmail(doc.id, email);
      } else {
        await api.sendQuoteEmail(doc.id, email);
      }

      setEmailSuccessMsg(`Official ${docLabel} PDF dispatched to ${email}!`);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setActionError(err.message || 'Failed to dispatch email statement.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-scale-up">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-accent-50 text-accent-700 flex items-center justify-center font-black shrink-0 border border-accent-100">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900 truncate">
                  Share {docLabel}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono text-xs font-bold">
                  #{doc.docNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate">
                {customerName} • ₦{totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="w-8"
            onClick={onClose}
            aria-label="Close">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Channel Switcher Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/30 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-success-600 text-white shadow-sm shadow-success-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp Share</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'email'
                ? 'bg-accent-600 text-white shadow-sm shadow-accent-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email PDF</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-5">

          {/* Feedback Banners */}
          {actionError && (
            <div className="p-3.5 rounded-2xl bg-danger-50 border border-danger-200 text-danger-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-danger-600" />
              <span>{actionError}</span>
            </div>
          )}

          {emailSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-success-50 border border-success-200 text-success-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-success-600" />
              <span>{emailSuccessMsg}</span>
            </div>
          )}

          {/* WHATSAPP TAB */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="edocumentmodal-tsx-f1" className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Customer WhatsApp Number</span>
                  <span className="text-xs font-normal text-slate-400">e.g. 08012345678 or 2348012345678</span>
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input id="edocumentmodal-tsx-f1" aria-label="Enter phone number"
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full text-sm px-3 py-2 bg-white text-slate-900 placeholder-slate-400 rounded-control border border-slate-200 shadow-subtle transition-all duration-150 focus:outline-none focus:ring-2 focus:border-accent-600 focus:ring-accent-500/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed pl-10 pr-4"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                {supportsNativeFileShare && !shareFailed && !pdfLoadError ? (
                  <>
                    <Button variant="primary" size="lg" fullWidth
                      type="button"
                      onClick={handleSharePdfFile}
                      disabled={!pdfFile || isSharingFile}>
                      {!pdfFile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Preparing PDF File...</span>
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-4 h-4" />
                          <span>Share PDF File to WhatsApp</span>
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-slate-500 text-center leading-relaxed">
                      {pdfFile
                        ? 'Tap the button, choose WhatsApp, then pick the customer. The PDF is sent as a file.'
                        : 'Getting the PDF ready. The button turns on in a moment.'}
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenWhatsAppChat}
                      className="w-full text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Send a text summary only (no PDF)
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    <a
                      href={getPdfDownloadUrl()}
              onClick={(e) => api.handlePdfLinkClick(e, getPdfDownloadUrl(), getPdfFilename())}
                      download={getPdfFilename()}
                      className="py-3 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Save PDF to Device</span>
                    </a>

                    <Button variant="primary" size="lg"
                      type="button"
                      onClick={handleOpenWhatsAppChat}>
                      <ExternalLink className="w-4 h-4" />
                      <span>Open WhatsApp Web</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Message Preview */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                <span className="font-extrabold text-slate-800 uppercase tracking-wider text-xs block">
                  Text Summary Preview
                </span>
                <p className="whitespace-pre-line text-slate-600 font-mono text-[10.5px] leading-relaxed max-h-24 overflow-y-auto">
                  {whatsappMessageText}
                </p>
              </div>
            </div>
          )}

          {/* EMAIL TAB */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <TextInput label="Customer Email Address"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g. customer@example.com" leftIcon={<Mail className="w-4 h-4" />} />
              </div>

              <div className="p-3.5 rounded-2xl bg-accent-50/60 border border-accent-100 text-xs text-accent-900 space-y-1">
                <p className="font-bold">Official PDF Delivery Notice:</p>
                <p className="text-xs text-accent-800 leading-relaxed font-sans">
                  The recipient will receive an email containing their official formatted A4 statement attached as a PDF document ({getPdfFilename()}).
                </p>
              </div>

              <Button variant="primary" size="lg" fullWidth
                type="button"
                onClick={handleSendEmail}
                disabled={isSendingEmail || !!emailSuccessMsg}>
                {isSendingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dispatching PDF Email...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Send Official PDF Email</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Bottom Utility Bar */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm"
              type="button"
              onClick={onClose}>
              Close
            </Button>

            <a
              href={getPdfDownloadUrl()}
              onClick={(e) => api.handlePdfLinkClick(e, getPdfDownloadUrl(), getPdfFilename())}
              target="_blank"
              rel="noopener noreferrer"
              download={getPdfFilename()}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download PDF</span>
            </a>
          </div>

        </div>

      </div>
    </div>
  );
}
