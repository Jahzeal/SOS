'use client';

import React from 'react';
import { Building2, ShieldCheck, CheckCircle2, QrCode } from 'lucide-react';

export interface A4ReceiptData {
  receiptNumber?: string | null;
  invoiceNumber?: string | null;
  createdAt: Date | string;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  totalAmount: number;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  business?: {
    name?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    logoUrl?: string | null;
    receiptFooter?: string | null;
  } | null;
  items: Array<{
    description?: string;
    phoneRecord?: {
      brand?: string;
      model?: string;
      imei1?: string | null;
      serialNumber?: string | null;
      storageCapacity?: string | null;
      condition?: string | null;
    } | null;
    imei?: string | null;
    quantity?: number;
    unitPrice?: number;
    price?: number;
    totalPrice?: number;
  }>;
}

export function A4SalesReceipt({ data, id = 'printable-a4-receipt' }: { data: A4ReceiptData; id?: string }) {
  const rawNum = data.receiptNumber || data.invoiceNumber || 'NG-REC-193170';
  const receiptNum = rawNum.replace(/^VF-/, 'NG-');
  const storeName = data.business?.name || 'NOXGUARDA RETAIL STORE';
  const storeAddress = data.business?.address || 'Computer Village, Ikeja, Lagos';
  const storePhone = data.business?.phone || '+234 800 000 0000';
  const storeEmail = data.business?.email || 'support@noxguarda.com';
  const customerName = data.customerName || 'Valued Retail Buyer';
  const customerAddress = data.customerAddress || 'Client Billing Address';
  const customerContact = [data.customerPhone, data.customerEmail].filter(Boolean).join(' • ') || 'Contact: N/A';

  const dateFormatted = new Date(data.createdAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const initials = storeName.slice(0, 2).toUpperCase() || 'NG';

  return (
    <div
      id={id}
      className="bg-white text-slate-900 font-sans p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-6 print:p-0 print:m-0 print:border-0 print:shadow-none print:w-full print:max-w-none print:space-y-4"
    >
      {/* Top Slim Brand Accent Line */}
      <div className="h-1 bg-blue-600 rounded-full w-full print:h-1" />

      {/* Header: Store Name & Monogram Left, SALES RECEIPT Right */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          {/* Branded Initials Box */}
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-extrabold text-lg shadow-xs shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight uppercase">
              {storeName}
            </h2>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
              Verified Device & Electronics Retail Ledger
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight uppercase">
            SALES RECEIPT
          </h1>
          <p className="text-xs sm:text-sm font-mono font-extrabold text-blue-600 mt-0.5">
            {receiptNum}
          </p>
        </div>
      </div>

      {/* Dual Info Boxes: Store Details Left, Billed To Right */}
      <div className="grid grid-cols-2 gap-4 print:grid-cols-2">
        {/* Left Box: Issued By */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block border-b border-slate-200/80 pb-1">
            ISSUED BY / STORE DETAILS
          </span>
          <p className="font-extrabold text-slate-900 text-sm">{storeName}</p>
          <p className="text-slate-600 font-medium">{storeAddress}</p>
          <p className="text-slate-600 font-medium">Phone: {storePhone}</p>
          <p className="text-slate-600 font-medium">Email: {storeEmail}</p>
        </div>

        {/* Right Box: Billed To */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block border-b border-slate-200/80 pb-1">
            BILLED TO / STATEMENT DETAILS
          </span>
          <p className="font-extrabold text-slate-900 text-sm">{customerName}</p>
          <p className="text-slate-600 font-medium">Address: {customerAddress}</p>
          <p className="text-slate-600 font-medium">Contact: {customerContact}</p>
          <p className="text-slate-600 font-medium">
            Issue Date: {dateFormatted} • Status:{' '}
            <span className="font-bold text-emerald-600">PAID</span>
          </p>
        </div>
      </div>

      {/* Itemized Hardware & Products Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3">Item Description & Hardware Specs</th>
              <th className="py-2.5 px-3 w-16 text-center">Qty</th>
              <th className="py-2.5 px-3 w-28 text-right">Unit Price</th>
              <th className="py-2.5 px-3 w-28 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.items.map((item, idx) => {
              const itemTitle =
                item.description ||
                (item.phoneRecord
                  ? `${item.phoneRecord.brand || ''} ${item.phoneRecord.model || ''}`.trim()
                  : 'Hardware Item');
              const imei = item.phoneRecord?.imei1 || item.imei || item.phoneRecord?.serialNumber;
              const qty = item.quantity || 1;
              const unitPrice = item.unitPrice || item.price || 0;
              const amount = item.totalPrice || unitPrice * qty;

              return (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <p className="font-extrabold text-slate-900 text-xs">{itemTitle}</p>
                    {imei && (
                      <p className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">
                        IMEI/SN: {imei}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-800">{qty}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                    NGN {unitPrice.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                    NGN {amount.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Summary: Policy Left, Financial Right */}
      <div className="grid grid-cols-2 gap-6 pt-2 items-start print:grid-cols-2">
        {/* Policy Remarks */}
        <div className="space-y-1.5 text-[11px] text-slate-500">
          <p className="font-extrabold text-slate-900 text-xs">Policy Remarks & Guarantee:</p>
          <p>• All serial & IMEI numbers are permanently verified in store ledger.</p>
          <p>• Store warranty is valid for 12 months from original issue date.</p>
        </div>

        {/* Financial Calculation Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-mono font-bold text-slate-900">
              NGN {data.totalAmount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Tax / VAT (0%):</span>
            <span className="font-mono font-bold text-slate-900">NGN 0.00</span>
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-sm font-black">
            <span className="text-slate-900 uppercase">TOTAL PAID:</span>
            <span className="text-blue-600 font-mono text-base font-extrabold">
              NGN {data.totalAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 leading-relaxed">
        Official commercial statement generated by {storeName} via NoxGuarda Retail OS. Scannable security verified.
      </div>
    </div>
  );
}
