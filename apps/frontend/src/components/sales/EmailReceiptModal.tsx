'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Send, Copy, Check, ExternalLink, X, Receipt, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface EmailReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: {
    id?: string;
    receiptNumber?: string;
    invoiceNumber?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    date?: string;
    paymentMethod?: string;
    subtotal?: number;
    total?: number;
    totalAmount?: number;
    items?: any[];
    storeName?: string;
  } | null;
}

export function EmailReceiptModal({ isOpen, onClose, receipt }: EmailReceiptModalProps) {
  const [emailInput, setEmailInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (receipt) {
      const initialEmail =
        receipt.customerEmail ||
        (receipt.customerPhone && receipt.customerPhone.includes('@') ? receipt.customerPhone : '');
      setEmailInput(initialEmail || '');
      setCopied(false);
      setStatusMessage(null);
    }
  }, [receipt, isOpen]);

  if (!isOpen || !receipt) return null;

  const receiptNum = receipt.receiptNumber || receipt.invoiceNumber || receipt.id || 'Receipt';
  const storeName = receipt.storeName || 'VerifyFlow Retail Store';
  const totalAmount = Number(receipt.total ?? receipt.totalAmount ?? 0);
  const customerName = receipt.customerName || 'Valued Customer';
  const dateStr = receipt.date || new Date().toLocaleString();

  // Format item list
  const itemsText = (receipt.items || [])
    .map((item: any, idx: number) => {
      const itemTitle = item.model || item.description || `Item #${idx + 1}`;
      const detail = item.isDevice && item.imei ? ` (IMEI: ${item.imei})` : item.color ? ` (${item.color})` : '';
      const qty = item.quantity || 1;
      const price = Number(item.price ?? item.unitPrice ?? 0);
      return `• ${itemTitle}${detail} - Qty: ${qty} x ₦${price.toLocaleString()} = ₦${(price * qty).toLocaleString()}`;
    })
    .join('\n');

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
Phone: ${receipt.customerPhone || 'N/A'}
Payment Method: ${receipt.paymentMethod || 'PAID'}

----------------------------------------
PURCHASED ITEMS:
----------------------------------------
${itemsText || '• 1x Mobile Device / Retail Item'}

----------------------------------------
TOTAL PAID: ₦${totalAmount.toLocaleString()}
========================================

Thank you for shopping with us!
For questions or warranty verification, please present this receipt.`;

  const [isSendingDirect, setIsSendingDirect] = useState(false);

  const getCleanEmail = () => emailInput.trim();

  // Direct Server Email Dispatch
  const handleSendDirectEmail = async () => {
    const to = getCleanEmail();
    if (!to) {
      setStatusMessage('Please enter a valid email address first.');
      return;
    }
    if (!receipt?.id) {
      handleOpenDefaultMail();
      return;
    }

    setIsSendingDirect(true);
    setStatusMessage(null);
    try {
      const res = await (await import('@/lib/api')).api.sendSaleEmail(receipt.id, to);
      setStatusMessage(`Receipt successfully emailed directly to ${to}!`);
    } catch (err: any) {
      console.warn('Direct server send failed, falling back to mail client:', err);
      handleOpenDefaultMail();
    } finally {
      setIsSendingDirect(false);
    }
  };

  // 1. Open Default OS / Desktop Email Client (Standard mailto protocol)
  const handleOpenDefaultMail = () => {
    const to = getCleanEmail();
    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(fullReceiptText)}`;
    
    // Direct navigation is standard for mailto: (does not open blank tabs or trigger popup blockers)
    window.location.href = mailtoUrl;
    setStatusMessage('Opening default mail client...');
  };

  // 2. Open in Gmail Web
  const handleOpenGmail = () => {
    const to = getCleanEmail();
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(fullReceiptText)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    setStatusMessage('Opened Gmail compose tab');
  };

  // 3. Open in Outlook Web
  const handleOpenOutlook = () => {
    const to = getCleanEmail();
    const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(fullReceiptText)}`;
    window.open(outlookUrl, '_blank', 'noopener,noreferrer');
    setStatusMessage('Opened Outlook compose tab');
  };

  // 4. Open in Yahoo Mail Web
  const handleOpenYahoo = () => {
    const to = getCleanEmail();
    const yahooUrl = `https://compose.mail.yahoo.com/?to=${encodeURIComponent(to)}&subj=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(fullReceiptText)}`;
    window.open(yahooUrl, '_blank', 'noopener,noreferrer');
    setStatusMessage('Opened Yahoo Mail compose tab');
  };

  // 5. Copy Text Receipt to Clipboard
  const handleCopyReceipt = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullReceiptText).then(() => {
        setCopied(true);
        setStatusMessage('Receipt copied to clipboard!');
        setTimeout(() => setCopied(false), 3000);
      });
    }
  };

  return (
    <div className="fixed -inset-1 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-subtle">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Send Email Receipt</h3>
              <p className="text-xs text-slate-500 font-medium">Receipt #{receiptNum}</p>
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
                  Please enter email
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

          {/* Quick Mail Actions */}
          <div className="space-y-2">
            <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Choose How to Send
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Default App */}
              <button
                type="button"
                onClick={handleOpenDefaultMail}
                className="p-3 rounded-2xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 transition text-left flex items-start gap-3 group"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-xs text-blue-950 group-hover:text-blue-900 flex items-center gap-1">
                    Default Mail App <ExternalLink className="w-3 h-3 text-blue-500" />
                  </p>
                  <p className="text-[10px] text-blue-700/80 font-medium">
                    Outlook, Windows Mail, Apple Mail
                  </p>
                </div>
              </button>

              {/* Option 2: Gmail Web */}
              <button
                type="button"
                onClick={handleOpenGmail}
                className="p-3 rounded-2xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 transition text-left flex items-start gap-3 group"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-xs text-rose-950 group-hover:text-rose-900 flex items-center gap-1">
                    Gmail Web <ExternalLink className="w-3 h-3 text-rose-500" />
                  </p>
                  <p className="text-[10px] text-rose-700/80 font-medium">
                    Open in browser compose tab
                  </p>
                </div>
              </button>

              {/* Option 3: Outlook.com */}
              <button
                type="button"
                onClick={handleOpenOutlook}
                className="p-3 rounded-2xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/60 transition text-left flex items-start gap-3 group"
              >
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-xs text-sky-950 group-hover:text-sky-900 flex items-center gap-1">
                    Outlook Web <ExternalLink className="w-3 h-3 text-sky-500" />
                  </p>
                  <p className="text-[10px] text-sky-700/80 font-medium">
                    Office 365 / Outlook.com
                  </p>
                </div>
              </button>

              {/* Option 4: Yahoo Mail */}
              <button
                type="button"
                onClick={handleOpenYahoo}
                className="p-3 rounded-2xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 transition text-left flex items-start gap-3 group"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-xs text-purple-950 group-hover:text-purple-900 flex items-center gap-1">
                    Yahoo Mail <ExternalLink className="w-3 h-3 text-purple-500" />
                  </p>
                  <p className="text-[10px] text-purple-700/80 font-medium">
                    Compose in Yahoo webmail
                  </p>
                </div>
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
                <span>Copy Formatted Receipt Text (for WhatsApp / SMS)</span>
              </>
            )}
          </button>

          {/* Feedback Status */}
          {statusMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Thermal Receipt Text Preview Box */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-slate-400" /> Receipt Preview
            </p>
            <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-100 text-[11px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed border border-slate-800">
              {fullReceiptText}
            </pre>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenDefaultMail}
              leftIcon={<Mail className="w-3.5 h-3.5" />}
            >
              Mail App
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSendingDirect}
              onClick={handleSendDirectEmail}
              leftIcon={<Send className="w-3.5 h-3.5" />}
              className="bg-blue-600 hover:bg-blue-500 font-bold"
            >
              Send Email
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
