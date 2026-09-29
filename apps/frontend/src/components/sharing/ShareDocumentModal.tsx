'use client';

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
  const [copiedText, setCopiedText] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (doc) {
      setPhoneInput(doc.customerPhone || '');
      setEmailInput(doc.customerEmail || '');
      setCopiedText(false);
      setEmailSuccessMsg(null);
      setActionError(null);
    }
  }, [doc, isOpen]);

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
    setIsSharingFile(true);
    setActionError(null);

    try {
      const downloadUrl = getPdfDownloadUrl();
      const filename = getPdfFilename();
      const file = await api.fetchPdfFile(downloadUrl, filename);

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${docLabel} #${doc.docNumber}`,
          text: `Official ${docLabel} #${doc.docNumber} from ${storeName}`,
        });
      } else {
        // Fallback for browsers that do not support files in navigator.share:
        // Download PDF file & open WhatsApp Web/App
        const url = window.URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        handleOpenWhatsAppChat();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setActionError(err.message || 'Unable to share PDF file. Opening WhatsApp chat instead.');
        handleOpenWhatsAppChat();
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

  // 4. Copy Formatted Message to Clipboard
  const handleCopyText = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(whatsappMessageText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-scale-up">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-black shrink-0 border border-teal-100">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900 truncate">
                  Share {docLabel}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px] font-bold">
                  #{doc.docNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate">
                {customerName} • ₦{totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Channel Switcher Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/30 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
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
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
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
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
          )}

          {emailSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{emailSuccessMsg}</span>
            </div>
          )}

          {/* WHATSAPP TAB */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Customer WhatsApp Number</span>
                  <span className="text-[11px] font-normal text-slate-400">e.g. 08012345678 or 2348012345678</span>
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleSharePdfFile}
                  disabled={isSharingFile}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSharingFile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Preparing PDF File...</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Share PDF File Directly to WhatsApp</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleOpenWhatsAppChat}
                  className="w-full py-2.5 px-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open WhatsApp Chat with Statement Message</span>
                </button>
              </div>

              {/* Message Preview */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px] block">
                  WhatsApp Message Preview
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
                <label className="text-xs font-bold text-slate-700">Customer Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g. customer@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 space-y-1">
                <p className="font-bold">Official PDF Delivery Notice:</p>
                <p className="text-[11px] text-blue-800 leading-relaxed font-sans">
                  The recipient will receive an email containing their official formatted A4 statement attached as a PDF document ({getPdfFilename()}).
                </p>
              </div>

              <button
                type="button"
                onClick={handleSendEmail}
                disabled={isSendingEmail || !!emailSuccessMsg}
                className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-60"
              >
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
              </button>
            </div>
          )}

          {/* Bottom Utility Bar (Copy & Download) */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <a
              href={getPdfDownloadUrl()}
              target="_blank"
              rel="noopener noreferrer"
              download={getPdfFilename()}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
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
