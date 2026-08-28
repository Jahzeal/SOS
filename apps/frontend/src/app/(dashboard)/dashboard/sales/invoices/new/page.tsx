'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  User,
  Send,
  Save,
  CheckCircle2,
  Smartphone,
  Package,
  Printer,
  Share2,
  Mail,
  Search,
  AlertTriangle,
  Loader2,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

interface LineItem {
  id: string; // phoneRecord.id or custom item ID
  description: string;
  imei: string;
  quantity: number;
  unitPrice: number;
  isDevice: boolean;
}

export default function CreateInvoicePage() {
  const router = useRouter();

  // Invoice Meta State
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentTerms, setPaymentTerms] = useState('NET_15');
  const [invoicePaymentStatus, setInvoicePaymentStatus] = useState<'PENDING' | 'PAID' | 'DRAFT'>('PENDING');

  // Customer Details State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  // Line Items State (empty default)
  const [items, setItems] = useState<LineItem[]>([]);

  // Inventory Search State
  const [deviceSearch, setDeviceSearch] = useState('');
  const [inStockDevices, setInStockDevices] = useState<any[]>([]);
  const [isSearchingDevices, setIsSearchingDevices] = useState(false);

  // Form Inputs for Adding Custom Line Item
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemImei, setNewItemImei] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemPrice, setNewItemPrice] = useState('');

  const [notes, setNotes] = useState('Thank you for your business. Please remit payment before the due date.');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdInvoice, setCreatedInvoice] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [mobileStep, setMobileStep] = useState(1);

  // Search available in-stock devices
  useEffect(() => {
    const t = setTimeout(async () => {
      setIsSearchingDevices(true);
      try {
        const devices = await api.getInventory({
          status: 'IN_STOCK',
          search: deviceSearch.trim() || undefined,
        });
        setInStockDevices(devices || []);
      } catch (err) {
        console.error('Failed to load devices for invoice:', err);
        setInStockDevices([]);
      } finally {
        setIsSearchingDevices(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [deviceSearch]);

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

  // Add In-Stock Device from Inventory
  const handleAddDeviceToInvoice = (phone: any) => {
    const newItem: LineItem = {
      id: phone.id,
      description: `${phone.brand} ${phone.model}`,
      imei: phone.imei1,
      quantity: 1,
      unitPrice: phone.sellingPrice ?? phone.purchasePrice ?? 0,
      isDevice: true,
    };

    setItems((prev) => {
      if (prev.some((i) => i.id === newItem.id)) return prev;
      return [...prev, newItem];
    });
  };

  // Add Custom Line Item
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemDesc.trim() || !newItemPrice) return;

    setItems((prev) => [
      ...prev,
      {
        id: `CUSTOM-${Date.now()}`,
        description: newItemDesc.trim(),
        imei: newItemImei.trim() || 'N/A',
        quantity: parseInt(newItemQty, 10) || 1,
        unitPrice: parseFloat(newItemPrice) || 0,
        isDevice: false,
      },
    ]);

    setNewItemDesc('');
    setNewItemImei('');
    setNewItemQty('1');
    setNewItemPrice('');
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleEmailPDF = () => {
    if (!customerEmail.trim()) {
      alert('Please enter a customer email address first.');
      return;
    }
    const invNum = createdInvoice?.invoiceNumber || createdInvoice?.id || 'Statement';
    const subject = encodeURIComponent(`Invoice Statement #${invNum}`);
    const body = encodeURIComponent(
      `Hello ${customerName.trim() || 'Valued Customer'},\n\nPlease find your invoice statement for ₦${totalAmount.toLocaleString()} due on ${dueDate}.\n\nThank you for your business!`
    );
    window.location.href = `mailto:${customerEmail.trim()}?subject=${subject}&body=${body}`;
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItemPrice = (id: string, price: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, unitPrice: Math.max(0, price) } : i))
    );
  };

  // Issue Invoice via API
  const handleIssueInvoice = async (status: 'ISSUED' | 'DRAFT') => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      if (items.length === 0) {
        throw new Error('At least one item or appliance is required to issue an invoice statement.');
      }

      const payloadItems = items.map((item) => ({
        phoneRecordId: item.isDevice ? item.id : undefined,
        description: item.description,
        price: item.unitPrice,
        quantity: item.quantity || 1,
      }));

      const finalStatus = status === 'DRAFT' ? 'DRAFT' : invoicePaymentStatus;

      const sale = await api.checkoutSale({
        customerName: customerName.trim() || 'Invoice Customer',
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        paymentMethod: 'CASH',
        paymentStatus: finalStatus,
        items: payloadItems,
      });

      setCreatedInvoice({
        id: sale.invoiceNumber || sale.receiptNumber || sale.id,
        invoiceNumber: sale.invoiceNumber,
        receiptNumber: sale.receiptNumber,
        customerName: sale.customer?.name || customerName || 'Invoice Customer',
        totalAmount: sale.totalAmount || totalAmount,
        dueDate,
        status,
      });

      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Failed to issue invoice:', err);
      setErrorMessage(err.message || 'Failed to issue invoice statement. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8">

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Create Invoice Statement
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 font-medium max-w-xl mt-1 leading-relaxed">
            Build a formal bill for deferred payment or corporate clients — print, share via email/link, or save to invoices registry.
          </p>
        </div>
      </div>

      {/* Step Indicators on Mobile */}
      <div className="flex sm:hidden items-center justify-between border-b border-slate-200/80 pb-3 mb-2 text-[10px] font-extrabold text-slate-400">
        <button
          onClick={() => setMobileStep(1)}
          className={`pb-1 border-b-2 transition ${mobileStep === 1 ? 'border-blue-600 text-blue-600' : 'border-transparent'}`}
        >
          1. Customer Details
        </button>
        <button
          onClick={() => setMobileStep(2)}
          disabled={customerName.trim() === ''}
          className={`pb-1 border-b-2 transition ${mobileStep === 2 ? 'border-blue-600 text-blue-600' : 'border-transparent'} disabled:opacity-50`}
        >
          2. Invoice Items
        </button>
        <button
          onClick={() => setMobileStep(3)}
          disabled={items.length === 0}
          className={`pb-1 border-b-2 transition ${mobileStep === 3 ? 'border-blue-600 text-blue-600' : 'border-transparent'} disabled:opacity-50`}
        >
          3. Summary & Terms
        </button>
      </div>

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-bold animate-in fade-in duration-200">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">{errorMessage}</div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800 font-bold text-sm">✕</button>
        </div>
      )}

      {/* Main 2-Column Invoice Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT 8 COLUMNS: INVOICE FORM & ITEMS */}
        <div className="lg:col-span-8 space-y-6">

          {/* Customer & Meta Card */}
          <div className={`p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 ${mobileStep === 1 ? 'block' : 'hidden sm:block'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Customer / Business Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Acme Corp or Johnathan Doe..."
                  className="w-full text-[11px] sm:text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white placeholder-slate-400 placeholder:text-[10px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. client@example.com"
                  className="w-full text-[11px] sm:text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white placeholder-slate-400 placeholder:text-[10px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 234-5678"
                  className="w-full text-[11px] sm:text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white placeholder-slate-400 placeholder:text-[10px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Billing Address</label>
                <input
                  type="text"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder="e.g. 123 Corporate Blvd, New York, NY"
                  className="w-full text-[11px] sm:text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white placeholder-slate-400 placeholder:text-[10px]"
                />
              </div>
            </div>

            {/* Mobile Next Navigation Button */}
            <div className="block sm:hidden pt-3 border-t border-slate-100 mt-4">
              <Button
                variant="primary"
                fullWidth
                size="md"
                onClick={() => setMobileStep(2)}
                disabled={customerName.trim() === ''}
                className="bg-blue-600 hover:bg-blue-500 font-bold"
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next: Add Items
              </Button>
            </div>
          </div>

          {/* In-Stock Device Picker Section */}
          <div className={`p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 ${mobileStep === 2 ? 'block' : 'hidden sm:block'}`}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-600" /> Select In-Stock Device from Inventory
              </h2>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Available Inventory</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={deviceSearch}
                onChange={(e) => setDeviceSearch(e.target.value)}
                placeholder="Search by IMEI, Model, or Brand..."
                className="w-full text-[11px] sm:text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white placeholder-slate-400 placeholder:text-[10px]"
              />
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {isSearchingDevices ? (
                <div className="py-6 text-center text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Searching devices...
                </div>
              ) : inStockDevices.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs font-medium">
                  No matching in-stock devices found.
                </div>
              ) : (
                inStockDevices.map((phone) => {
                  const inInvoice = items.some((i) => i.id === phone.id);
                  return (
                    <div
                      key={phone.id}
                      onClick={() => !inInvoice && handleAddDeviceToInvoice(phone)}
                      className={`p-2 rounded-xl border flex items-center justify-between gap-2.5 transition cursor-pointer ${
                        inInvoice
                          ? 'bg-emerald-50/60 border-emerald-300 opacity-80 cursor-default'
                          : 'bg-slate-50 border-slate-200/90 hover:border-blue-500 hover:bg-blue-50/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold ${inInvoice ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600'}`}>
                          <Smartphone className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-[11px] sm:text-xs truncate">{phone.brand} {phone.model}</p>
                          <p className="text-[9px] font-mono text-slate-500 truncate">IMEI: {phone.imei1}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-bold text-slate-950 text-[11px] sm:text-xs">
                          ₦{(phone.sellingPrice ?? phone.purchasePrice ?? 0).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          disabled={inInvoice}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            inInvoice ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'
                          }`}
                        >
                          {inInvoice ? <><Check className="w-3.5 h-3.5" /> Added</> : <><Plus className="w-3.5 h-3.5" /> Add</>}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Line Items Table & Custom Add Item Form */}
          <div className={`p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 ${mobileStep === 2 ? 'block' : 'hidden sm:block'}`}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Invoice Line Items & Services
              </h2>
              <Badge variant="starter" size="sm">{items.length} ITEMS</Badge>
            </div>

            {/* Mobile Line Items View (Hidden on desktop) */}
            <div className="block sm:hidden divide-y divide-slate-100 bg-white">
              {items.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-medium text-xs">
                  No items added to invoice yet. Select a device above or add a custom item below.
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="py-3.5 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-extrabold text-slate-900">{item.description}</p>
                        <p className="text-[10px] font-mono text-slate-500">IMEI: {item.imei}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Qty:</span>
                        <span className="font-bold text-slate-800">{item.quantity}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Price:</span>
                        <div className="flex items-center gap-0.5">
                          <span className="text-slate-400 font-bold">₦</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                            className="w-16 text-right font-bold text-slate-900 bg-white border border-slate-200 rounded px-1 py-0.5"
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block mb-0.5">Total</span>
                        <span className="font-extrabold text-slate-900">₦{(item.unitPrice * item.quantity).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">IMEI / Serial</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Price (₦)</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        No items added to invoice yet. Select a device above or add a custom item below.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 font-extrabold text-slate-900">{item.description}</td>
                        <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">{item.imei}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">{item.quantity}</td>
                        <td className="py-3 px-3 text-right font-semibold text-slate-800">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                            className="w-20 text-right font-bold text-slate-900 bg-white border border-slate-200 rounded px-1.5 py-0.5"
                          />
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                          ₦{(item.unitPrice * item.quantity).toLocaleString()}
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
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Custom Line Item Form */}
            <form onSubmit={handleAddCustomItem} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 pt-4">
              <p className="text-[11px] font-bold text-slate-700">Add Custom Item / Service</p>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    required
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    placeholder="Description (e.g. Repair)..."
                    className="w-full text-[11px] sm:text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:border-blue-600 placeholder-slate-400 placeholder:text-[10px]"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={newItemImei}
                    onChange={(e) => setNewItemImei(e.target.value)}
                    placeholder="IMEI (Optional)..."
                    className="w-full font-mono text-[11px] sm:text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:border-blue-600 placeholder-slate-400 placeholder:text-[10px]"
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
                    className="w-full text-[11px] sm:text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:border-blue-600 text-center placeholder-slate-400 placeholder:text-[10px]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="Rate (₦)..."
                    className="w-full text-[11px] sm:text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:border-blue-600 placeholder-slate-400 placeholder:text-[10px]"
                  />
                </div>
              </div>
              <Button type="submit" variant="secondary" size="sm" className="text-xs font-bold" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Item to Invoice
              </Button>
            </form>

            {/* Mobile Navigation Buttons for Step 2 */}
            <div className="block sm:hidden flex items-center gap-2 pt-4 border-t border-slate-100 mt-2">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => setMobileStep(1)}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => setMobileStep(3)}
                disabled={items.length === 0}
                className="bg-blue-600 hover:bg-blue-500 font-bold"
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next: Summary
              </Button>
            </div>
          </div>

          {/* Notes & Terms Card */}
          <div className={`p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 ${mobileStep === 3 ? 'block' : 'hidden sm:block'}`}>
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
        <div className={`lg:col-span-4 space-y-5 ${mobileStep === 3 ? 'block' : 'hidden sm:block'}`}>

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

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Payment Status</label>
                <select
                  value={invoicePaymentStatus}
                  onChange={(e) => setInvoicePaymentStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  <option value="PENDING">PENDING (Awaiting Payment)</option>
                  <option value="PAID">PAID (Settled Immediately)</option>
                  <option value="DRAFT">DRAFT (Draft State)</option>
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
                <span className="font-bold text-slate-900">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (8%)</span>
                <span className="font-bold text-slate-900">₦{tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-900 font-extrabold">
                <span className="text-sm">Total Due</span>
                <span className="text-2xl text-blue-600 font-extrabold">₦{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <Button
                variant="primary"
                fullWidth
                size="md"
                isLoading={isSaving}
                onClick={() => handleIssueInvoice('ISSUED')}
                className="bg-blue-600 hover:bg-blue-500 font-bold shadow-lg shadow-blue-600/20"
                leftIcon={<Share2 className="w-4 h-4" />}
              >
                Issue & Share Invoice
              </Button>

              <Button
                variant="secondary"
                fullWidth
                size="md"
                onClick={() => handleIssueInvoice('DRAFT')}
                className="font-bold border border-slate-200 text-slate-700 hover:bg-slate-50"
                leftIcon={<Save className="w-4 h-4 text-slate-500" />}
              >
                Save Draft
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handlePrintPDF}
                  leftIcon={<Printer className="w-4 h-4 text-slate-600" />}
                >
                  Print PDF
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleEmailPDF}
                  leftIcon={<Mail className="w-4 h-4 text-slate-600" />}
                >
                  Email PDF
                </Button>
              </div>

              {/* Mobile Back Button for Step 3 */}
              <div className="block sm:hidden pt-3 border-t border-slate-100 mt-2">
                <Button
                  variant="secondary"
                  fullWidth
                  size="md"
                  onClick={() => setMobileStep(2)}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Back to Items
                </Button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Success Statement Share Modal */}
      {showSuccessModal && createdInvoice && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto border border-blue-200">
              <FileText className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Invoice Created Successfully!</h3>
              <p className="text-xs text-slate-600 font-medium mt-1">
                Invoice #: <strong>{createdInvoice.invoiceNumber || createdInvoice.id}</strong> • Due: <strong>{createdInvoice.dueDate}</strong>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-left space-y-2 font-medium">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span>Billed Customer</span>
                <span className="font-bold text-slate-900">{createdInvoice.customerName}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-1">
                <span>Total Amount Owed</span>
                <span className="text-blue-600 font-extrabold">${createdInvoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="primary" size="md" onClick={handlePrintPDF} leftIcon={<Printer className="w-4 h-4" />}>
                  Print PDF
                </Button>
                <Button variant="secondary" size="md" onClick={handleEmailPDF} leftIcon={<Mail className="w-4 h-4" />}>
                  Send Email
                </Button>
              </div>

              <Link href="/dashboard/sales/receipts">
                <Button variant="secondary" fullWidth size="lg">
                  View Receipts & Invoices Archive
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
