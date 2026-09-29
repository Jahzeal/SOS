'use client';

import React from 'react';
import { Building2, ShieldCheck, CheckCircle2, QrCode } from 'lucide-react';

export interface A4InvoiceData {
  invoiceNumber?: string | null;
  receiptNumber?: string | null;
  id?: string;
  createdAt: Date | string;
  dueDate?: string | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  paymentTerms?: string | null;
  notes?: string | null;
  subtotal?: number;
  totalAmount: number;
  amountPaid?: number;
  balance?: number;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  customer?: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  } | null;
  business?: {
    name?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    logoUrl?: string | null;
    bankName?: string | null;
    accountNumber?: string | null;
    accountName?: string | null;
    taxId?: string | null;
    warrantyTerms?: string | null;
    receiptFooter?: string | null;
    receiptTerms?: string | null;
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

export function A4CommercialInvoice({
  data,
  id = 'printable-a4-invoice',
}: {
  data: A4InvoiceData;
  id?: string;
}) {
  const invoiceNum =
    data.invoiceNumber || data.receiptNumber || `INV-${data.id?.slice(-6) || '2026-001'}`;
  const storeName = data.business?.name || 'NOXGUARDA RETAIL STORE';
  const storeAddress = data.business?.address || 'Computer Village, Ikeja, Lagos';
  const storePhone = data.business?.phone || '+234 800 000 0000';
  const storeEmail = data.business?.email || 'support@noxguarda.com';
  const customerName = data.customer?.name || data.customerName || 'Valued Client';
  const customerAddress = data.customer?.address || data.customerAddress || 'Client Billing Address';
  const customerPhone = data.customer?.phone || data.customerPhone || 'N/A';
  const customerEmail = data.customer?.email || data.customerEmail || 'customer@example.com';

  const issueDateFormatted = new Date(data.createdAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const dueDateFormatted = data.dueDate
    ? new Date(data.dueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : new Date(new Date(data.createdAt || Date.now()).getTime() + 14 * 86400000).toLocaleDateString(
        'en-US',
        {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        },
      );

  const status = (data.paymentStatus || 'PENDING').toUpperCase();
  const isPaid = status === 'PAID';
  const total = Number(data.totalAmount || 0);
  const paidAmount = isPaid ? total : Number(data.amountPaid || 0);
  const balance = isPaid ? 0 : Math.max(0, total - paidAmount);

  const initials = storeName.slice(0, 2).toUpperCase() || 'NG';

  return (
    <div
      id={id}
      className="bg-white text-slate-900 font-sans p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm max-w-4xl mx-auto space-y-6 print:p-0 print:m-0 print:border-0 print:shadow-none print:w-full print:max-w-none print:space-y-4"
    >
      {/* Top Slim Blue Accent Line */}
      <div className="h-1.5 bg-blue-600 rounded-full w-full print:h-1" />

      {/* Header: Store details on Left, INVOICE title on Right */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3.5">
          {data.business?.logoUrl ? (
            <div className="h-14 max-w-[150px] flex items-center justify-start shrink-0">
              <img
                src={data.business.logoUrl}
                alt={storeName}
                className="max-h-14 max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-extrabold text-lg shadow-xs shrink-0">
              {initials}
            </div>
          )}
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight uppercase">
              {storeName}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {storeAddress}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Mobile: {storePhone} {storeEmail ? `• Email: ${storeEmail}` : ''}
              {data.business?.taxId ? ` • Tax ID: ${data.business.taxId}` : ''}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
            COMMERCIAL INVOICE
          </h1>
          <p className="text-xs sm:text-sm font-mono font-extrabold text-blue-600 mt-0.5">
            {invoiceNum}
          </p>
          <div className="mt-1">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isPaid
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* Dual Info Boxes: Invoice To on Left, Metadata Table on Right */}
      <div className="grid grid-cols-2 gap-4 print:grid-cols-2">
        {/* Left Box: Invoice To */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs min-w-0 overflow-hidden">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block border-b border-slate-200/80 pb-1">
            INVOICE TO / BILLED CLIENT
          </span>
          <p className="font-extrabold text-slate-900 text-sm break-words">{customerName}</p>
          <p className="text-slate-600 font-medium break-words whitespace-normal leading-relaxed">{customerAddress}</p>
          <p className="text-slate-600 font-medium break-words">Phone: {customerPhone}</p>
          <p className="text-slate-600 font-medium break-all">Email: {customerEmail}</p>
        </div>

        {/* Right Box: Invoice Details */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block border-b border-slate-200/80 pb-1">
            INVOICE STATEMENT DETAILS
          </span>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Invoice Date:</span>
            <span className="font-mono font-bold text-slate-900">{issueDateFormatted}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Payment Due Date:</span>
            <span className="font-mono font-bold text-slate-900">{dueDateFormatted}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Payment Terms:</span>
            <span className="font-bold text-slate-800">{data.paymentTerms || 'Due on Receipt'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Payment Status:</span>
            <span className={`font-black ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* Itemized Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3">Item Description & Specifications</th>
              <th className="py-2.5 px-3 w-16 text-center">Qty</th>
              <th className="py-2.5 px-3 w-28 text-right">Unit Price</th>
              <th className="py-2.5 px-3 w-28 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.items && data.items.length > 0 ? (
              data.items.map((item, idx) => {
                const itemTitle =
                  item.description ||
                  (item.phoneRecord
                    ? `${item.phoneRecord.brand || ''} ${item.phoneRecord.model || ''}`.trim()
                    : 'Invoice Line Item');
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
                      ₦{unitPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                      ₦{amount.toLocaleString()}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-400">
                  No line items listed.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Summary: Remittance / Bank Info on Left, Financial on Right */}
      <div className="grid grid-cols-2 gap-6 pt-2 items-start print:grid-cols-2">
        {/* Bank & Remittance Instructions */}
        <div className="space-y-3">
          {(data.business?.bankName || data.business?.accountNumber) && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block border-b border-slate-200/80 pb-1">
                BANK REMITTANCE DETAILS
              </span>
              <div className="grid grid-cols-2 gap-x-2 text-slate-600">
                <span>Bank:</span>
                <span className="font-bold text-slate-900">{data.business.bankName || 'N/A'}</span>
                <span>Account Number:</span>
                <span className="font-mono font-bold text-slate-900">
                  {data.business.accountNumber || 'N/A'}
                </span>
                <span>Account Name:</span>
                <span className="font-bold text-slate-900">
                  {data.business.accountName || storeName}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-1 text-[11px] text-slate-500">
            <p className="font-extrabold text-slate-900 text-xs">Terms & Store Warranty:</p>
            <p>
              • {data.business?.warrantyTerms || data.business?.receiptTerms || '12-Month Store Warranty on all verified hardware.'}
            </p>
            <p>• All IMEI/serial numbers are permanently registered in the NoxGuarda device registry.</p>
            {data.notes && <p className="italic text-slate-600">• Note: {data.notes}</p>}
          </div>
        </div>

        {/* Financial Calculation Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-mono font-bold text-slate-900">
              ₦{total.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Tax / VAT (0%):</span>
            <span className="font-mono font-bold text-slate-900">₦0.00</span>
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-sm font-black">
            <span className="text-slate-900 uppercase">TOTAL DUE:</span>
            <span className="text-blue-600 font-mono text-base font-extrabold">
              ₦{total.toLocaleString()}
            </span>
          </div>
          {paidAmount > 0 && !isPaid && (
            <>
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Amount Paid:</span>
                <span className="font-mono">₦{paidAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-amber-600 font-bold border-t border-slate-200 pt-1">
                <span>Balance Due:</span>
                <span className="font-mono">₦{balance.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 leading-relaxed">
        Commercial Invoice issued by {storeName}. Scannable security and ledger authenticity verified by NoxGuarda.
      </div>
    </div>
  );
}
