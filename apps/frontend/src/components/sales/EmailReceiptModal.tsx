'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Send, Copy, Check, ExternalLink, X, Receipt, CheckCircle2, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export interface EmailReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: any | null;
}

export function EmailReceiptModal({ isOpen, onClose, receipt }: EmailReceiptModalProps) {
  const [emailInput, setEmailInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSendingDirect, setIsSendingDirect] = useState(false);

  useEffect(() => {
    if (receipt) {
      const initialEmail =
        receipt.customer?.email ||
        receipt.customerEmail ||
        (receipt.customer?.phone && receipt.customer?.phone.includes('@') ? receipt.customer.phone : '') ||
        (receipt.customerPhone && receipt.customerPhone.includes('@') ? receipt.customerPhone : '');
      setEmailInput(initialEmail || '');
      setCopied(false);
      setStatusMessage(null);
      setErrorMessage(null);
    }
  }, [receipt, isOpen]);

  if (!isOpen || !receipt) return null;

  const receiptNum = receipt.receiptNumber || receipt.invoiceNumber || receipt.id || 'Receipt';
  const storeName = receipt.business?.name || receipt.storeName || 'NoxGuarda Retail Store';
  const totalAmount = Number(receipt.totalAmount ?? receipt.total ?? 0);
  const customerName = receipt.customer?.name || receipt.customerName || 'Valued Customer';
  const customerPhone = receipt.customer?.phone || receipt.customerPhone || 'N/A';
  const paymentMethod = receipt.paymentMethod || 'CASH';
  
  let dateStr = 'Today';
  try {
    const d = receipt.createdAt ? new Date(receipt.createdAt) : new Date();
    dateStr = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    dateStr = 'Today';
  }

  // Format item list safely
  const itemsText = Array.isArray(receipt.items)
    ? receipt.items
        .map((item: any, idx: number) => {
          const itemTitle =
            item.description ||
            (item.phoneRecord ? `${item.phoneRecord.brand} ${item.phoneRecord.model}` : `Item #${idx + 1}`);
          const imei = item.phoneRecord?.imei1 || item.imei;
          const detail = imei ? ` (IMEI: ${imei})` : '';
          const qty = Number(item.quantity || 1);
          const price = Number(item.unitPrice ?? item.price ?? 0);
          return `• ${itemTitle}${detail} - Qty: ${qty} x ₦${price.toLocaleString()} = ₦${(price * qty).toLocaleString()}`;
        })
        .join('\n')
    : '• 1x Mobile Device / Retail Item';

  const emailSubject = `Sales Receipt #${receiptNum} - ${storeName}`;
  const fullReceiptText = `Dear ${customerName},

Thank you for your purchase! Here is your official verified sales receipt:

========================================
OFFICIAL SALES RECEIPT
========================================
Store: ${storeName}
Receipt #: ${receiptNum}
Date: ${dateStr}
Customer: ${customerName}
Phone: ${customerPhone}
Payment Method: ${paymentMethod}

----------------------------------------
PURCHASED ITEMS:
----------------------------------------
${itemsText}

----------------------------------------
TOTAL PAID: ₦${totalAmount.toLocaleString()}
========================================

Thank you for shopping with us!
For warranty or device verification, present this receipt.`;

  const getCleanEmail = () => emailInput.trim();

  // Direct Server Email Dispatch with attached PDF
  const handleSendDirectEmail = async () => {
    const to = getCleanEmail();
    if (!to) {
      setErrorMessage('Please enter a valid recipient email address.');
      return;
    }
    if (!receipt?.id) {
      handleOpenDefaultMail();
      return;
    }

    setIsSendingDirect(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      await api.sendSaleEmail(receipt.id, to);
      setStatusMessage(`Receipt and PDF attachment successfully dispatched to ${to}!`);
    } catch (err: any) {
      console.warn('Direct server email failed:', err);
      setErrorMessage(err?.message || 'Failed to dispatch email directly. Try the mail client below.');
    } finally {
      setIsSendingDirect(false);
    }
  };

  // 1. Open Default OS / Desktop Email Client
  const handleOpenDefaultMail = () => {
    const to = getCleanEmail();
    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(fullReceiptText)}`;
    window.location.href = mailtoUrl;
    setStatusMessage('Opened default mail application.');
  };

  // 2. Open in Gmail Web
  const handleOpenGmail = () => {
    const to = getCleanEmail();
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(fullReceiptText)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    setStatusMessage('Opened Gmail compose tab.');
  };

  // 3. Open in Outlook Web
  const handleOpenOutlook = () => {
    const to = getCleanEmail();
    const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(fullReceiptText)}`;
    window.open(outlookUrl, '_blank', 'noopener,noreferrer');
    setStatusMessage('Opened Outlook compose tab.');
  };

  // 4. Copy Text Receipt to Clipboard
  const handleCopyReceipt = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullReceiptText).then(() => {
        setCopied(true);
        setStatusMessage('Receipt copied to clipboard for WhatsApp / SMS!');
        setTimeout(() => setCopied(false), 3500);
      });
    }
  };

  return (
    <div className="fixed -inset-1 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Send Sales Receipt</h3>
              <p className="text-xs text-slate-500 font-medium font-mono">#{receiptNum}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Customer Email Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Customer Email Address</span>
              {!emailInput && (
                <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
                  Recipient required
                </span>
              )}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="customer@example.com"
                className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition"
                autoFocus
              />
            </div>
          </div>

          {/* PDF Attachment Notice */}
          <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-blue-900">
              <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Official PDF Document Attached:</span>
            </div>
            <p className="text-blue-800/90 font-mono text-[11px] pl-5">
              Receipt-{receiptNum}.pdf
            </p>
            <p className="text-[10px] text-blue-700/80 pl-5 pt-0.5">
              Customer will receive the official store receipt breakdown along with an A4 PDF attachment.
            </p>
          </div>

          {/* Quick Client Actions */}
          <div className="space-y-2">
            <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Alternative Options
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleOpenGmail}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition text-left flex items-center justify-between text-xs font-bold text-slate-700"
              >
                <span>Compose in Gmail</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={handleOpenOutlook}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition text-left flex items-center justify-between text-xs font-bold text-slate-700"
              >
                <span>Compose in Outlook</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Copy Receipt Text Button */}
          <button
            type="button"
            onClick={handleCopyReceipt}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100/80 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-extrabold">Receipt Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copy Formatted Receipt Text (WhatsApp / SMS)</span>
              </>
            )}
          </button>

          {/* Feedback Status */}
          {statusMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenDefaultMail}
              leftIcon={<Mail className="w-3.5 h-3.5" />}
            >
              Mail Client
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSendingDirect}
              onClick={handleSendDirectEmail}
              leftIcon={<Send className="w-3.5 h-3.5" />}
              className="bg-blue-600 hover:bg-blue-500 font-bold"
            >
              Send Direct Email
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
