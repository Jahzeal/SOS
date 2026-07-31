'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Calendar,
  User,
  Building,
  DollarSign,
  Send,
  Save,
  CheckCircle2,
  Smartphone,
  Package,
  Printer,
  Share2,
  Download,
  Mail,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface LineItem {
  id: string;
  description: string;
  imei: string;
  quantity: number;
  unitPrice: number;
}

export default function CreateInvoicePage() {
  const router = useRouter();

  // Invoice Meta State
  const [invoiceNumber] = useState(`INV-${Math.floor(80000 + Math.random() * 10000)}`);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentTerms, setPaymentTerms] = useState('NET_15');
  
  // Customer Details State
  const [customerName, setCustomerName] = useState('Johnathan Doe');
  const [customerEmail, setCustomerEmail] = useState('johnathan@example.com');
  const [customerPhone, setCustomerPhone] = useState('+1 (555) 234-5678');
  const [billingAddress, setBillingAddress] = useState('123 Corporate Blvd, Suite 400, New York, NY 10001');

  // Line Items State
  const [items, setItems] = useState<LineItem[]>([
    {
      id: 'ITEM-1',
      description: 'iPhone 15 Pro (256GB - Natural Titanium)',
      imei: '358291048291048',
      quantity: 1,
      unitPrice: 1099.0,
    },
    {
      id: 'ITEM-2',
      description: 'AirPods Pro (2nd Gen) USB-C',
      imei: 'N/A',
      quantity: 1,
      unitPrice: 249.0,
    },
  ]);

  // Form Inputs for Adding New Line Item
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemImei, setNewItemImei] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemPrice, setNewItemPrice] = useState('');

  const [notes, setNotes] = useState('Thank you for your business. Please remit payment via bank transfer before the due date.');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Calculated Due Date
  const dueDate = useMemo(() => {
    const d = new Date(issueDate);
    if (paymentTerms === 'NET_7') d.setDate(d.getDate() + 7);
    else if (paymentTerms === 'NET_15') d.setDate(d.getDate() + 15);
    else if (paymentTerms === 'NET_30') d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  }, [issueDate, paymentTerms]);

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [items]);

  const tax = useMemo(() => subtotal * 0.08, [subtotal]);
  const totalAmount = useMemo(() => subtotal + tax, [subtotal, tax]);

  // Line Item Handlers
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemDesc || !newItemPrice) return;

    setItems((prev) => [
      ...prev,
      {
        id: `ITEM-${Date.now()}`,
        description: newItemDesc,
        imei: newItemImei || 'N/A',
        quantity: parseInt(newItemQty, 10) || 1,
        unitPrice: parseFloat(newItemPrice) || 0,
      },
    ]);

    setNewItemDesc('');
    setNewItemImei('');
    setNewItemQty('1');
    setNewItemPrice('');
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleIssueInvoice = (status: 'ISSUED' | 'DRAFT') => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccessModal(true);
    }, 700);
  };

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <nav className="flex items-center text-xs font-semibold text-slate-500 gap-1 mb-1">
            <Link href="/dashboard" className="hover:text-slate-900 transition">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/dashboard/sales/invoices" className="hover:text-slate-900 transition">Invoices</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-blue-600 font-bold">New Invoice Statement</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Create Invoice Statement
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mt-1 leading-relaxed">
            Build a formal bill for deferred payment or corporate clients — print, share via email/link, or save to invoices registry.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleIssueInvoice('DRAFT')}
            leftIcon={<Save className="w-4 h-4 text-slate-600" />}
          >
            Save Draft
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isSaving}
            onClick={() => handleIssueInvoice('ISSUED')}
            leftIcon={<Share2 className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-500 font-bold"
          >
            Issue & Share Invoice
          </Button>
        </div>
      </div>

      {/* Main 2-Column Invoice Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT 8 COLUMNS: INVOICE FORM & ITEMS */}
        <div className="lg:col-span-8 space-y-6">

          {/* Customer & Meta Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> Customer & Billing Details
              </h2>
              <span className="text-[10px] text-slate-400 font-bold uppercase">{invoiceNumber}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Customer / Business Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email Address</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Phone Number</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Billing Address</label>
                <input
                  type="text"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Line Items Table & Add Item Form */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Invoice Line Items & Services
              </h2>
              <Badge variant="starter" size="sm">{items.length} ITEMS</Badge>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">IMEI / Serial</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Price ($)</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-extrabold text-slate-900">{item.description}</td>
                      <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">{item.imei}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">{item.quantity}</td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-800">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add New Line Item Form (Includes Quantity Field) */}
            <form onSubmit={handleAddItem} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 pt-4">
              <p className="text-[11px] font-bold text-slate-700">Add Line Item / Device</p>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    required
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    placeholder="Description (e.g. iPhone 15 Pro)..."
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={newItemImei}
                    onChange={(e) => setNewItemImei(e.target.value)}
                    placeholder="IMEI / Serial (Optional)..."
                    className="w-full font-mono text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    min="1"
                    required
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    placeholder="Qty..."
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:border-blue-600 text-center"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="Rate ($)..."
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
              <Button type="submit" variant="secondary" size="sm" className="text-xs font-bold" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Item to Invoice
              </Button>
            </form>

          </div>

          {/* Notes & Terms Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Payment Terms & Bank Wire Instructions
            </h3>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-600 leading-relaxed"
            />
          </div>

        </div>

        {/* RIGHT 4 COLUMNS: INVOICE TERMS, SUMMARY & SHARE ACTIONS */}
        <div className="lg:col-span-4 space-y-5">
          
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Billing Summary & Terms
            </h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Issue Date</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  <option value="DUE_ON_RECEIPT">Due on Receipt</option>
                  <option value="NET_7">Net 7 Days</option>
                  <option value="NET_15">Net 15 Days</option>
                  <option value="NET_30">Net 30 Days</option>
                </select>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-bold flex justify-between items-center">
                <span>Calculated Due Date:</span>
                <span className="font-extrabold">{dueDate}</span>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs font-medium text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Sales Tax (8%)</span>
                <span className="font-bold text-slate-900">${tax.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-baseline pt-3 border-t border-slate-200 text-slate-900 font-extrabold">
                <span className="text-sm">Total Owed</span>
                <span className="text-2xl text-blue-600 font-extrabold">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons: Print, Email / Share, Save */}
            <div className="space-y-2 pt-2">
              <Button
                variant="primary"
                fullWidth
                size="lg"
                isLoading={isSaving}
                onClick={() => handleIssueInvoice('ISSUED')}
                className="bg-blue-600 hover:bg-blue-500 font-bold h-12 shadow-lg shadow-blue-600/20"
                leftIcon={<Share2 className="w-4 h-4" />}
              >
                Issue & Share Invoice
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => handleIssueInvoice('DRAFT')}
                  leftIcon={<Printer className="w-4 h-4 text-slate-600" />}
                >
                  Print PDF
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => handleIssueInvoice('DRAFT')}
                  leftIcon={<Mail className="w-4 h-4 text-slate-600" />}
                >
                  Email PDF
                </Button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Success Statement Share Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto border border-blue-200">
              <FileText className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Invoice Ready to Print & Share!</h3>
              <p className="text-xs text-slate-600 font-medium mt-1">
                Invoice ID: <strong>{invoiceNumber}</strong> • Due: <strong>{dueDate}</strong>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-left space-y-2 font-medium">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span>Billed Customer</span>
                <span className="font-bold text-slate-900">{customerName}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-1">
                <span>Total Amount Owed</span>
                <span className="text-blue-600 font-extrabold">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="primary" size="md" leftIcon={<Printer className="w-4 h-4" />}>
                  Print PDF
                </Button>
                <Button variant="secondary" size="md" leftIcon={<Mail className="w-4 h-4" />}>
                  Send Email
                </Button>
              </div>

              <Link href="/dashboard/sales/invoices">
                <Button variant="secondary" fullWidth size="lg">
                  View in Invoices Registry
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
