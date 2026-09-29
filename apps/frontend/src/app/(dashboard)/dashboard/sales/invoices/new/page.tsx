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
  Building2,
  CreditCard,
  RefreshCw,
  Copy,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { A4CommercialInvoice } from '@/components/invoice/A4CommercialInvoice';

interface LineItem {
  id: string; // phoneRecord.id or custom item ID
  description: string;
  imei: string;
  quantity: number;
  unitPrice: number;
  isDevice: boolean;
}

const formatNumberWithCommas = (val: string | number | null | undefined): string => {
  if (val === null || val === undefined || val === '') return '';
  const str = val.toString().replace(/,/g, '');
  const parts = str.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

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

  // Bank Account State (Template or Custom)
  const [templateBank, setTemplateBank] = useState<{ bankName: string; accountNumber: string; accountName: string } | null>(null);
  const [useCustomBank, setUseCustomBank] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isLoadingBankTemplate, setIsLoadingBankTemplate] = useState(false);

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

  // Load default template bank details from /dashboard/templates
  useEffect(() => {
    async function loadTemplateBank() {
      setIsLoadingBankTemplate(true);
      try {
        const [tpl, prof] = await Promise.all([
          api.getBusinessTemplates().catch(() => null),
          api.getBusinessProfile().catch(() => null),
        ]);
        const data = tpl || prof;
        if (data?.bankName || data?.accountNumber) {
          const bData = {
            bankName: data.bankName || '',
            accountNumber: data.accountNumber || '',
            accountName: data.accountName || data.name || '',
          };
          setTemplateBank(bData);
          setBankName(bData.bankName);
          setAccountNumber(bData.accountNumber);
          setAccountName(bData.accountName);
        }
      } catch (err) {
        console.error('Failed to load bank template:', err);
      } finally {
        setIsLoadingBankTemplate(false);
      }
    }
    loadTemplateBank();
  }, []);

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

  const totalAmount = useMemo(() => subtotal, [subtotal]);

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
        unitPrice: parseFloat(newItemPrice.toString().replace(/,/g, '')) || 0,
        isDevice: false,
      },
    ]);

    setNewItemDesc('');
    setNewItemImei('');
    setNewItemQty('1');
    setNewItemPrice('');
  };

  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    if (!createdInvoice) return;
    const link = `${window.location.origin}/dashboard/sales/receipt/${createdInvoice.rawId || createdInvoice.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleEmailPDF = async () => {
    const targetEmail = customerEmail.trim();
    if (!targetEmail) {
      alert('Please enter a customer email address in the customer details section.');
      return;
    }

    setIsSendingEmail(true);
    setEmailNotice(null);

    const invNum = createdInvoice?.invoiceNumber || createdInvoice?.id || 'Statement';
    const amountStr = `₦${Number(createdInvoice?.totalAmount || totalAmount).toLocaleString()}`;
    const subject = encodeURIComponent(`Invoice Statement #${invNum}`);
    const body = encodeURIComponent(
      `Hello ${customerName.trim() || 'Valued Customer'},\n\nPlease find your invoice statement #${invNum} for ${amountStr} due on ${dueDate}.\n\nThank you for your business!`
    );

    try {
      if (createdInvoice?.rawId || createdInvoice?.id) {
        await api.sendSaleEmail(createdInvoice.rawId || createdInvoice.id, targetEmail);
        setEmailNotice(`Invoice statement successfully emailed to ${targetEmail}!`);
      } else {
        window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
        setEmailNotice(`Dispatched to your email client.`);
      }
    } catch (err: any) {
      console.warn('Backend email dispatch failed, opening mail client fallback:', err);
      window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
      setEmailNotice(`Opened email client for ${targetEmail}.`);
    } finally {
      setIsSendingEmail(false);
    }
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
    setEmailNotice(null);
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

      const sale = await api.createInvoice({
        customerName: customerName.trim() || 'Invoice Customer',
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        paymentMethod: 'CASH',
        paymentStatus: finalStatus,
        type: 'INVOICE',
        dueDate,
        paymentTerms,
        billingAddress: billingAddress.trim() || undefined,
        bankName: (useCustomBank ? bankName : (templateBank?.bankName || bankName))?.trim() || undefined,
        accountNumber: (useCustomBank ? accountNumber : (templateBank?.accountNumber || accountNumber))?.trim() || undefined,
        accountName: (useCustomBank ? accountName : (templateBank?.accountName || accountName))?.trim() || undefined,
        notes: notes.trim() || undefined,
        items: payloadItems,
      });

      if (status === 'DRAFT') {
        router.push('/dashboard/sales/invoices');
        return;
      }

      setCreatedInvoice({
        rawId: sale.id,
        id: sale.invoiceNumber || sale.id,
        invoiceNumber: sale.invoiceNumber,
        receiptNumber: sale.receiptNumber,
        customerName: sale.customer?.name || customerName || 'Invoice Customer',
        totalAmount: sale.totalAmount || totalAmount,
        dueDate,
        bankName: (useCustomBank ? bankName : (templateBank?.bankName || bankName))?.trim(),
        accountNumber: (useCustomBank ? accountNumber : (templateBank?.accountNumber || accountNumber))?.trim(),
        accountName: (useCustomBank ? accountName : (templateBank?.accountName || accountName))?.trim(),
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
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800 font-bold text-sm"></button>
        </div>
      )}

      {/* Main 2-Column Invoice Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT 8 COLUMNS: INVOICE FORM & ITEMS */}
        <div className="lg:col-span-8 space-y-6 min-w-0 w-full">

          {/* Customer & Meta Card */}
          <div className={`p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 overflow-hidden ${mobileStep === 1 ? 'block' : 'hidden sm:block'}`}>
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
          <div className={`p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 overflow-hidden ${mobileStep === 2 ? 'block' : 'hidden sm:block'}`}>
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
                  <Loader2 className="w-4 h-4 animate-spin" /> Searching...
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
          <div className={`p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 overflow-hidden ${mobileStep === 2 ? 'block' : 'hidden sm:block'}`}>
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
                    type="text"
                    inputMode="decimal"
                    required
                    value={formatNumberWithCommas(newItemPrice)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, '').replace(/[^\d.]/g, '');
                      setNewItemPrice(raw);
                    }}
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

          {/* Remittance Bank Account Selection Card */}
          <div className={`p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 overflow-hidden ${mobileStep === 3 ? 'block' : 'hidden sm:block'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Remittance Bank Account
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Payment destination printed on this customer's invoice statement
                  </p>
                </div>
              </div>

              {/* Mode Toggle Pills */}
              <div className="grid grid-cols-2 sm:flex sm:items-center bg-slate-100 p-1 rounded-xl gap-1 text-[11px] font-bold w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomBank(false);
                    if (templateBank) {
                      setBankName(templateBank.bankName);
                      setAccountNumber(templateBank.accountNumber);
                      setAccountName(templateBank.accountName);
                    }
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                    !useCustomBank
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">Template Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUseCustomBank(true)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                    useCustomBank
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">Custom Account</span>
                </button>
              </div>
            </div>

            {/* Template Bank Display */}
            {!useCustomBank ? (
              <div className="space-y-3">
                {templateBank?.accountNumber ? (
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-blue-950 text-sm">{templateBank.bankName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          Template Default
                        </span>
                      </div>
                      <p className="text-slate-700 font-mono font-bold text-xs">
                        Account #: <span className="text-blue-900">{templateBank.accountNumber}</span>
                      </p>
                      {templateBank.accountName && (
                        <p className="text-slate-600 font-medium text-[11px] truncate">
                          Beneficiary: <strong className="text-slate-900">{templateBank.accountName}</strong>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href="/dashboard/templates"
                        target="_blank"
                        className="px-3 py-1.5 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs transition"
                      >
                        Edit in Templates →
                      </Link>
                      <button
                        type="button"
                        onClick={() => setUseCustomBank(true)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer"
                      >
                        Override / Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-bold">No Default Bank Account in Templates</p>
                      <p className="text-[11px] text-amber-800">
                        You have not configured store bank details in /dashboard/templates yet.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href="/dashboard/templates"
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition"
                      >
                        Set up in Templates
                      </Link>
                      <button
                        type="button"
                        onClick={() => setUseCustomBank(true)}
                        className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-50 text-amber-900 font-bold text-xs transition cursor-pointer"
                      >
                        Enter Custom Account
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Custom Bank Account Form */
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Custom Remittance Account Details
                  </span>
                  {templateBank?.accountNumber && (
                    <button
                      type="button"
                      onClick={() => {
                        setBankName(templateBank.bankName);
                        setAccountNumber(templateBank.accountNumber);
                        setAccountName(templateBank.accountName);
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Fill Template Values</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Access Bank / Zenith"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Account Number</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/[^\d]/g, ''))}
                      placeholder="e.g. 0123456789"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Account / Beneficiary Name</label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="e.g. Store Trade Ltd"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes & Terms Card */}
          <div className={`p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 overflow-hidden ${mobileStep === 3 ? 'block' : 'hidden sm:block'}`}>
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Payment Terms & Remittance Instructions
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
        <div className={`lg:col-span-4 space-y-5 min-w-0 w-full ${mobileStep === 3 ? 'block' : 'hidden sm:block'}`}>

          <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5 overflow-hidden">
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

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center justify-between text-xs">
                  <span>Payment Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    invoicePaymentStatus === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {invoicePaymentStatus === 'PAID' ? 'PAID (Settled)' : 'PENDING (Unpaid)'}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setInvoicePaymentStatus('PENDING')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      invoicePaymentStatus === 'PENDING'
                        ? 'bg-white text-amber-700 shadow-xs border border-amber-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Pending</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvoicePaymentStatus('PAID')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      invoicePaymentStatus === 'PAID'
                        ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Paid</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-bold flex flex-wrap justify-between items-center gap-1">
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
        <div className="fixed -inset-1 z-[100] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
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
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span>Payment Status</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  invoicePaymentStatus === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {invoicePaymentStatus === 'PAID' ? 'PAID' : 'PENDING'}
                </span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-1">
                <span>Total Amount Owed</span>
                <span className="text-blue-600 font-extrabold">₦{Number(createdInvoice.totalAmount || 0).toLocaleString()}</span>
              </div>
            </div>

            {emailNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center animate-in fade-in">
                {emailNotice}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-xs text-slate-700 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Link Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copy Shareable Invoice Link</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="primary" size="md" onClick={handlePrintPDF} leftIcon={<Printer className="w-4 h-4" />}>
                  Print PDF
                </Button>
                <Button variant="secondary" size="md" isLoading={isSendingEmail} onClick={handleEmailPDF} leftIcon={<Mail className="w-4 h-4" />}>
                  Send Email
                </Button>
              </div>

              <Link href="/dashboard/sales/invoices">
                <Button variant="secondary" fullWidth size="lg">
                  View Invoices Registry
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Printable Invoice for Standard Clean A4 Page Output */}
      <div id="printable-a4-invoice" className="hidden print:block">
        <A4CommercialInvoice
          id="printable-a4-invoice-content"
          data={{
            invoiceNumber: createdInvoice?.invoiceNumber || 'INV/DRAFT',
            id: createdInvoice?.id,
            createdAt: issueDate,
            dueDate: dueDate,
            paymentStatus: invoicePaymentStatus,
            paymentTerms:
              paymentTerms === 'NET_7'
                ? 'Net 7 Days'
                : paymentTerms === 'NET_15'
                ? 'Net 15 Days'
                : paymentTerms === 'NET_30'
                ? 'Net 30 Days'
                : 'Due on Receipt',
            notes: notes,
            totalAmount: totalAmount,
            customerName: customerName || 'Valued Customer',
            customerPhone: customerPhone,
            customerEmail: customerEmail,
            customerAddress: billingAddress,
            business: {
              name: templateBank?.accountName || 'NoxGuarda Retail Store',
              bankName: useCustomBank ? bankName : templateBank?.bankName || bankName,
              accountNumber: useCustomBank ? accountNumber : templateBank?.accountNumber || accountNumber,
              accountName: useCustomBank ? accountName : templateBank?.accountName || accountName,
            },
            items: items.map((it) => ({
              description: it.description,
              imei: it.imei,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              totalPrice: it.unitPrice * it.quantity,
            })),
          }}
        />
      </div>

      {/* Global Print Styling for Clean A4 Page Output */}
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
