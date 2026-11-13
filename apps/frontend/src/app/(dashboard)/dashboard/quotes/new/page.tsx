'use client';
import { Table, THead, TBody, Tr, Th, Td } from '@/components/ui/DataTable';
import { TextInput, Select, Textarea } from '@/components/ui/Input';


import { notify, confirmDialog } from '@/lib/feedback';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileSpreadsheet,
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
  Mail,
  Search,
  AlertTriangle,
  Loader2,
  Check,
  Calendar,
  Percent,
  CreditCard,
  Clock,
  Bell,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';

interface LineItem {
  id: string; // phoneRecord.id or custom temp ID
  phoneRecordId?: string;
  description: string;
  imei?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  isDevice: boolean;
}

interface InstallmentScheduleItem {
  installmentNo: number;
  amountDue: number;
  dueDate: string;
  notes?: string;
}

const formatNumberWithCommas = (val: string | number | null | undefined): string => {
  if (val === null || val === undefined || val === '') return '';
  const str = val.toString().replace(/,/g, '');
  const parts = str.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

export default function CreateQuotePage() {
  const router = useRouter();
  const { checkCanPerformAction } = useSubscriptionGuard();

  // Quote Meta State
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [validityDays, setValidityDays] = useState(14);
  const [subject, setSubject] = useState('');

  // Customer Details State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  // Customers Lookup State
  const [existingCustomers, setExistingCustomers] = useState<any[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Line Items State
  const [items, setItems] = useState<LineItem[]>([]);

  // Inventory Devices Search State
  const [deviceSearch, setDeviceSearch] = useState('');
  const [inStockDevices, setInStockDevices] = useState<any[]>([]);
  const [isSearchingDevices, setIsSearchingDevices] = useState(false);

  // Form Inputs for Adding Custom Item
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDiscount, setNewItemDiscount] = useState('0');

  // Pricing Modifiers
  const [globalDiscount, setGlobalDiscount] = useState<string>('0');
  const [taxRate, setTaxRate] = useState<string>('0');

  // Part-Payment & Installments State
  const [hasInstallments, setHasInstallments] = useState(false);
  const [amountPaidInput, setAmountPaidInput] = useState<string>('0');
  const [splitCount, setSplitCount] = useState<number>(2);
  const [installmentIntervalDays, setInstallmentIntervalDays] = useState<number>(7); // 7 = weekly, 14 = biweekly, 30 = monthly
  const [installments, setInstallments] = useState<InstallmentScheduleItem[]>([]);
  const [sendCustomerReminders, setSendCustomerReminders] = useState(true);

  // Terms and Notes
  const [notes, setNotes] = useState('Thank you for your inquiry. Please review the estimated pricing and terms below.');
  const [terms, setTerms] = useState('This price quotation is valid for the stated duration. Device availability and warranty conditions apply upon final confirmation.');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdQuote, setCreatedQuote] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Load Business Defaults & Existing Customers
  useEffect(() => {
    async function loadDefaults() {
      try {
        const [templates, customersList] = await Promise.all([
          api.getBusinessTemplates().catch(() => null),
          api.getCustomers().catch(() => []),
        ]);

        if (templates) {
          if (templates.quoteNotes) setNotes(templates.quoteNotes);
          if (templates.quoteTerms) setTerms(templates.quoteTerms);
          if (templates.quoteValidityDays) setValidityDays(templates.quoteValidityDays);
        }

        if (Array.isArray(customersList)) {
          setExistingCustomers(customersList);
        }
      } catch (err) {
        console.error('Failed to load defaults:', err);
      }
    }
    loadDefaults();
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
        console.error('Failed to search devices:', err);
        setInStockDevices([]);
      } finally {
        setIsSearchingDevices(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [deviceSearch]);

  // Computed Expiry Date
  const expiryDate = useMemo(() => {
    const d = new Date(quoteDate);
    d.setDate(d.getDate() + validityDays);
    return d.toISOString().split('T')[0];
  }, [quoteDate, validityDays]);

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const line = item.unitPrice * (item.quantity || 1);
      const disc = item.discount ? (line * item.discount) / 100 : 0;
      return sum + (line - disc);
    }, 0);
  }, [items]);

  const numGlobalDiscount = parseFloat(globalDiscount.toString().replace(/,/g, '')) || 0;
  const numTaxRate = parseFloat(taxRate) || 0;
  const discountedSubtotal = Math.max(0, subtotal - numGlobalDiscount);
  const taxAmount = (discountedSubtotal * numTaxRate) / 100;
  const grandTotal = discountedSubtotal + taxAmount;

  const numAmountPaid = Math.min(grandTotal, Math.max(0, parseFloat(amountPaidInput.toString().replace(/,/g, '')) || 0));
  const remainingBalance = Math.max(0, grandTotal - numAmountPaid);

  // Auto-generate installment splits when total, deposit, split count, or interval changes
  useEffect(() => {
    if (!hasInstallments || remainingBalance <= 0 || splitCount <= 0) {
      if (!hasInstallments) setInstallments([]);
      return;
    }

    const perInstallment = Math.floor(remainingBalance / splitCount);
    const remainder = remainingBalance - (perInstallment * splitCount);

    const newInsts: InstallmentScheduleItem[] = [];
    const baseDate = new Date(quoteDate || new Date());

    for (let i = 1; i <= splitCount; i++) {
      const dueDateObj = new Date(baseDate);
      dueDateObj.setDate(dueDateObj.getDate() + (i * installmentIntervalDays));
      const dueDateStr = dueDateObj.toISOString().split('T')[0];

      // Add remainder to last installment to ensure exact sum match
      const amountDue = i === splitCount ? perInstallment + remainder : perInstallment;

      newInsts.push({
        installmentNo: i,
        amountDue,
        dueDate: dueDateStr,
        notes: `Installment payment ${i} of ${splitCount}`,
      });
    }

    setInstallments(newInsts);
  }, [hasInstallments, remainingBalance, splitCount, installmentIntervalDays, quoteDate]);

  const handleUpdateInstallment = (index: number, field: keyof InstallmentScheduleItem, value: any) => {
    setInstallments((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Add in-stock device to items
  const handleAddDevice = (device: any) => {
    if (items.some((i) => i.phoneRecordId === device.id)) {
      notify('This device is already in the quotation.');
      return;
    }

    const price = device.sellingPrice || device.purchasePrice || 0;
    const desc = `${device.brand} ${device.model} (${device.storageCapacity || ''} ${device.color || ''}) - ${device.condition || 'NEW'}`.trim();

    setItems((prev) => [
      ...prev,
      {
        id: device.id,
        phoneRecordId: device.id,
        description: desc,
        imei: device.imei1,
        quantity: 1,
        unitPrice: price,
        discount: 0,
        isDevice: true,
      },
    ]);
  };

  // Add custom accessory / service / general product
  const handleAddCustomItem = () => {
    if (!newItemDesc.trim()) {
      notify('Please enter an item description.');
      return;
    }
    const price = parseFloat(newItemPrice.toString().replace(/,/g, '')) || 0;
    const qty = parseInt(newItemQty, 10) || 1;
    const disc = parseFloat(newItemDiscount.toString().replace(/,/g, '')) || 0;

    setItems((prev) => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        description: newItemDesc.trim(),
        quantity: qty,
        unitPrice: price,
        discount: disc,
        isDevice: false,
      },
    ]);

    setNewItemDesc('');
    setNewItemPrice('');
    setNewItemQty('1');
    setNewItemDiscount('0');
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof LineItem, val: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleSelectCustomer = (c: any) => {
    setCustomerName(c.name || '');
    setCustomerPhone(c.phone || '');
    setCustomerEmail(c.email || '');
    setBillingAddress(c.address || '');
    setShowCustomerDropdown(false);
  };

  const handleSubmit = async (targetStatus: 'DRAFT' | 'SENT') => {
    if (!checkCanPerformAction('create_quote')) {
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Please add at least one device or service line item.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const payload = {
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        billingAddress: billingAddress.trim() || undefined,
        subject: subject.trim() || undefined,
        quoteDate,
        expiryDate,
        discount: numGlobalDiscount,
        taxRate: numTaxRate,
        amountPaid: numAmountPaid,
        hasInstallments,
        sendCustomerReminders,
        installments:
          hasInstallments && installments.length > 0
            ? installments.map((inst) => ({
                installmentNo: inst.installmentNo,
                amountDue: Number(inst.amountDue),
                dueDate: inst.dueDate,
                notes: inst.notes || undefined,
              }))
            : undefined,
        notes: notes.trim() || undefined,
        terms: terms.trim() || undefined,
        status: targetStatus,
        items: items.map((i) => ({
          phoneRecordId: i.phoneRecordId || undefined,
          description: i.description,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          discount: i.discount,
        })),
      };

      const quote = await api.createQuote(payload);
      setCreatedQuote(quote);
      setShowSuccessModal(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create quotation.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8">

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <nav className="flex items-center text-xs font-semibold text-slate-500 gap-1 mb-1">
            <Link href="/dashboard" className="hover:text-slate-900 transition">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/dashboard/quotes" className="hover:text-slate-900 transition">Quotations</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-accent-600 font-bold">New Quotation</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Create Quotation / Estimate
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mt-1 leading-relaxed">
            Prepare an itemized proposal with device specifications, validity duration, custom discounts, and terms.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/dashboard/quotes">
            <Button variant="secondary" size="md" className="font-bold border-slate-200 text-slate-700 hover:bg-slate-50">
              Cancel
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="md"
            onClick={() => handleSubmit('DRAFT')}
            disabled={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
            className="font-bold border-slate-200 text-slate-800"
          >
            Save Draft
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => handleSubmit('SENT')}
            disabled={isSaving}
            leftIcon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            className="bg-accent-600 hover:bg-accent-500 font-bold shadow-md shadow-accent-600/20"
          >
            {isSaving ? 'Creating...' : 'Create & Issue'}
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-xl text-xs font-bold text-danger-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-danger-600 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT 8 COLUMNS: PROPOSAL DETAILS & LINE ITEMS */}
        <div className="lg:col-span-8 space-y-6">

          {/* Card 1: Quotation Metadata */}
          <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <FileSpreadsheet className="w-4 h-4 text-accent-600" /> Quotation Subject & Timeline
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-3 space-y-1">
                <TextInput label="Proposal Subject / Reference"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Corporate Procurement - 10x iPhone 15 Pro Max (256GB)" />
              </div>

              <div className="space-y-1">
                <TextInput label="Quote Date"
                  type="date"
                  value={quoteDate}
                  onChange={(e) => setQuoteDate(e.target.value)} />
              </div>

              <div className="space-y-1">
                <Select label="Price Validity Duration"
                  value={validityDays}
                  onChange={(e) => setValidityDays(Number(e.target.value))}>
                  <option value={7}>7 Days (1 Week)</option>
                  <option value={14}>14 Days (2 Weeks)</option>
                  <option value={30}>30 Days (1 Month)</option>
                  <option value={60}>60 Days (2 Months)</option>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-xs sm:text-xs">Valid Until Date</label>
                <div className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-100/90 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 font-mono flex items-center justify-between">
                  <span>{expiryDate}</span>
                  <span className="text-xs text-slate-500 font-sans font-semibold">({validityDays}d)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Customer Information */}
          <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 sm:pb-3">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-accent-600" /> Prospective Client Information
              </h2>
              <span className="text-xs sm:text-xs text-slate-400 font-medium">Select existing or type new</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs relative">
              <div className="space-y-1 relative">
                <TextInput label="Customer / Company Name"
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="e.g. Adeola Johnson or TechCorp Ltd" />

                {/* Customer Autocomplete Dropdown */}
                {showCustomerDropdown && existingCustomers.length > 0 && customerName.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {existingCustomers
                      .filter((c) => c.name.toLowerCase().includes(customerName.toLowerCase()) || c.phone?.includes(customerName))
                      .slice(0, 5)
                      .map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectCustomer(c)}
                          className="w-full text-left p-2.5 hover:bg-accent-50 flex items-center justify-between text-xs transition"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{c.name}</p>
                            <p className="text-xs text-slate-500">{c.phone} {c.email ? `• ${c.email}` : ''}</p>
                          </div>
                          <span className="text-xs text-accent-600 font-bold">Select</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <TextInput label="Phone Number"
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +234 801 234 5678" />
              </div>

              <div className="space-y-1">
                <TextInput label="Email Address (For PDF Delivery)"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. client@company.ng" />
              </div>

              <div className="space-y-1">
                <TextInput label="Billing / Delivery Address"
                  type="text"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder="e.g. 14 Marina Street, Victoria Island, Lagos" />
              </div>
            </div>
          </div>

          {/* Card 3: Line Items Table & Adders */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-accent-600" /> Quotation Line Items
                </h2>
                <p className="text-xs text-slate-500">Pick in-stock devices from inventory or enter custom products/services.</p>
              </div>
              <span className="text-xs font-bold text-accent-600">{items.length} items added</span>
            </div>

            {/* In-Stock Device Picker Section */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-accent-600" /> Add In-Stock Phone / Device
                </span>
                <span className="text-xs text-slate-400">Search by brand, model, or IMEI</span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input aria-label="Search store inventory (e.g. iPhone 15, S24, 3582...)"
                  type="text"
                  value={deviceSearch}
                  onChange={(e) => setDeviceSearch(e.target.value)}
                  placeholder="Search store inventory (e.g. iPhone 15, S24, 3582...)"
                  className="w-full text-sm px-3 py-2 bg-white text-slate-900 placeholder-slate-400 rounded-control border border-slate-200 shadow-subtle transition-all duration-150 focus:outline-none focus:ring-2 focus:border-accent-600 focus:ring-accent-500/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed pl-8 pr-3"
                />
              </div>

              {/* Devices Result Badges */}
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {isSearchingDevices ? (
                  <p className="text-xs text-slate-400 py-2 text-center">Searching inventory...</p>
                ) : inStockDevices.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2 text-center">
                    {deviceSearch ? 'No in-stock devices matched.' : 'Type above to search registered devices.'}
                  </p>
                ) : (
                  inStockDevices.slice(0, 6).map((dev) => (
                    <div
                      key={dev.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-accent-300 text-xs transition"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{dev.brand} {dev.model}</span>
                        <span className="text-slate-500 text-xs ml-1.5">
                          {dev.storageCapacity} • {dev.color} • IMEI: {dev.imei1}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 font-mono text-xs">
                          ₦{(dev.sellingPrice || dev.purchasePrice || 0).toLocaleString()}
                        </span>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAddDevice(dev)}
                          className="text-xs py-1 px-2.5 h-auto font-bold border-accent-200 text-accent-700 hover:bg-accent-50"
                        >
                          + Add
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Custom Product / Service Item Row */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-accent-600" /> Add Custom Product, Repair, or Accessory
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                <div className="sm:col-span-5">
                  <input aria-label="Description (e.g. Screen Replacement Labor / 20W Adapter)"
                    type="text"
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    placeholder="Description (e.g. Screen Replacement Labor / 20W Adapter)"
                    className="w-full text-sm px-3 py-2 bg-white text-slate-900 placeholder-slate-400 rounded-control border border-slate-200 shadow-subtle transition-all duration-150 focus:outline-none focus:ring-2 focus:border-accent-600 focus:ring-accent-500/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input aria-label="Qty"
                    type="number"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    placeholder="Qty"
                    min="1"
                    className="w-full text-sm px-3 py-2 bg-white text-slate-900 placeholder-slate-400 rounded-control border border-slate-200 shadow-subtle transition-all duration-150 focus:outline-none focus:ring-2 focus:border-accent-600 focus:ring-accent-500/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-center"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input aria-label="Unit Price (₦)"
                    type="text"
                    inputMode="decimal"
                    value={formatNumberWithCommas(newItemPrice)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, '').replace(/[^\d.]/g, '');
                      setNewItemPrice(raw);
                    }}
                    placeholder="Unit Price (₦)"
                    className="w-full text-sm px-3 py-2 bg-white text-slate-900 placeholder-slate-400 rounded-control border border-slate-200 shadow-subtle transition-all duration-150 focus:outline-none focus:ring-2 focus:border-accent-600 focus:ring-accent-500/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleAddCustomItem}
                    className="w-full h-full py-2 font-bold bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    Add Item
                  </Button>
                </div>
              </div>
            </div>

            {/* Current Items List Table */}
            {items.length > 0 ? (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <Table>
                  <THead>
                    <tr>
                      <Th>Description</Th>
                      <Th align="center" className="w-16">Qty</Th>
                      <Th align="right" className="w-28">Unit Price</Th>
                      <Th align="center" className="w-20">Disc %</Th>
                      <Th align="right" className="w-28">Total</Th>
                      <Th align="center" className="w-10"></Th>
                    </tr>
                  </THead>
                  <TBody className="font-medium">
                    {items.map((item, idx) => {
                      const line = item.unitPrice * (item.quantity || 1);
                      const disc = item.discount ? (line * item.discount) / 100 : 0;
                      const lineTotal = line - disc;

                      return (
                        <Tr key={item.id}>
                          <Td>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                              className="w-full text-sm px-3 py-2 bg-white text-slate-900 placeholder-slate-400 rounded-control border border-slate-200 shadow-subtle transition-all duration-150 focus:outline-none focus:ring-2 focus:border-accent-600 focus:ring-accent-500/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                            />
                            {item.imei && (
                              <span className="text-xs text-slate-400 font-mono block px-1">IMEI: {item.imei}</span>
                            )}
                          </Td>

                          <Td align="center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                              className="w-14 text-center bg-slate-50 border border-slate-200 rounded py-1 font-bold text-slate-900"
                            />
                          </Td>

                          <Td align="right">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-24 text-right bg-slate-50 border border-slate-200 rounded py-1 px-1.5 font-mono font-bold text-slate-900"
                            />
                          </Td>

                          <Td align="center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discount}
                              onChange={(e) => handleUpdateItem(idx, 'discount', parseFloat(e.target.value) || 0)}
                              className="w-14 text-center bg-slate-50 border border-slate-200 rounded py-1 font-bold text-slate-700"
                            />
                          </Td>

                          <Td align="right" className="font-bold text-slate-900 font-mono">
                            ₦{lineTotal.toLocaleString()}
                          </Td>

                          <Td align="center">
                            <Button variant="ghostDanger" size="icon" aria-label="Remove item"
                              type="button"
                              onClick={() => handleRemoveItem(idx)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </Td>
                        </Tr>
                      );
                    })}
                  </TBody>
                </Table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6 border-2 border-dashed border-slate-200 rounded-xl font-bold">
                No items in proposal yet. Search and add devices or custom products above.
              </p>
            )}
          </div>

          {/* Card 4: Part-Payment & Installment Schedule */}
          <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-success-600" /> Part-Payment & Installment Schedule
                </h2>
                <p className="text-xs text-slate-500">
                  Allow client to pay in split installments with configurable due dates and automated push/email reminders.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={hasInstallments}
                  onChange={(e) => setHasInstallments(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success-600"></div>
                <span className="ml-2 text-xs font-bold text-slate-700">
                  {hasInstallments ? 'Installments Enabled' : 'Single Payment'}
                </span>
              </label>
            </div>

            {hasInstallments && (
              <div className="space-y-4 pt-1">
                {/* Deposit and Split Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-success-50/50 p-3.5 rounded-xl border border-success-100">
                  <div className="space-y-1">
                    <TextInput label="Initial Deposit Received Today (₦)"
                      type="text"
                      inputMode="decimal"
                      value={formatNumberWithCommas(amountPaidInput)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, '').replace(/[^\d.]/g, '');
                        setAmountPaidInput(raw);
                      }}
                      placeholder="0" className="font-mono" />
                    <span className="text-xs text-slate-500 font-medium">
                      Remaining Debt: <strong className="text-warning-700 font-mono">₦{remainingBalance.toLocaleString()}</strong>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Select label="Number of Split Payments"
                      value={splitCount}
                      onChange={(e) => setSplitCount(Number(e.target.value))}>
                      <option value={1}>1 Final Payment</option>
                      <option value={2}>2 Installments (50% / 50%)</option>
                      <option value={3}>3 Installments (33% each)</option>
                      <option value={4}>4 Installments (Weekly/Monthly)</option>
                      <option value={6}>6 Installments</option>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Select label="Payment Cadence / Due Interval"
                      value={installmentIntervalDays}
                      onChange={(e) => setInstallmentIntervalDays(Number(e.target.value))}>
                      <option value={7}>Every 7 Days (Weekly)</option>
                      <option value={14}>Every 14 Days (Bi-Weekly)</option>
                      <option value={30}>Every 30 Days (Monthly)</option>
                    </Select>
                  </div>
                </div>

                {/* Installments Table */}
                {installments.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" /> Agreed Installment Due Dates
                      </span>
                      <span className="text-xs text-slate-500">You can adjust any specific installment date or amount</span>
                    </div>

                    <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                      <Table>
                        <THead>
                          <tr>
                            <Th className="w-28">Stage</Th>
                            <Th className="w-36">Due Date</Th>
                            <Th align="right" className="w-36">Amount Due (₦)</Th>
                            <Th>Notes</Th>
                          </tr>
                        </THead>
                        <TBody className="font-medium">
                          {installments.map((inst, idx) => (
                            <Tr key={idx}>
                              <Td className="font-bold text-slate-800">
                                Installment #{inst.installmentNo}
                              </Td>
                              <Td>
                                <input
                                  type="date"
                                  value={inst.dueDate}
                                  onChange={(e) => handleUpdateInstallment(idx, 'dueDate', e.target.value)}
                                  className="w-full text-sm px-3 py-2 bg-white text-slate-900 placeholder-slate-400 rounded-control border border-slate-200 shadow-subtle transition-all duration-150 focus:outline-none focus:ring-2 focus:border-accent-600 focus:ring-accent-500/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                                />
                              </Td>
                              <Td align="right">
                                <input
                                  type="number"
                                  value={inst.amountDue}
                                  onChange={(e) => handleUpdateInstallment(idx, 'amountDue', parseFloat(e.target.value) || 0)}
                                  className="w-full text-sm px-3 py-2 bg-white text-slate-900 placeholder-slate-400 rounded-control border border-slate-200 shadow-subtle transition-all duration-150 focus:outline-none focus:ring-2 focus:border-accent-600 focus:ring-accent-500/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-right font-mono"
                                />
                              </Td>
                              <Td>
                                <input aria-label="e.g. Balance before delivery"
                                  type="text"
                                  value={inst.notes || ''}
                                  onChange={(e) => handleUpdateInstallment(idx, 'notes', e.target.value)}
                                  placeholder="e.g. Balance before delivery"
                                  className="w-full text-sm px-3 py-2 bg-white text-slate-900 placeholder-slate-400 rounded-control border border-slate-200 shadow-subtle transition-all duration-150 focus:outline-none focus:ring-2 focus:border-accent-600 focus:ring-accent-500/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                                />
                              </Td>
                            </Tr>
                          ))}
                        </TBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Automated Reminders Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-accent-50/60 border border-accent-100 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-accent-600 text-white flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-accent-950">Automated Installment Due Reminders</p>
                      <p className="text-xs text-accent-800">
                        Automatically dispatch customer app push notifications and branded emails on due dates.
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={sendCustomerReminders}
                    onChange={(e) => setSendCustomerReminders(e.target.checked)}
                    className="w-4 h-4 text-accent-600 rounded border-slate-300 focus:ring-accent-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card 5: Notes and Terms */}
          <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5 sm:pb-3">
              <FileText className="w-4 h-4 text-accent-600" /> Customer Note & Legal Terms
            </h2>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <Textarea label="Opening Greeting / Note to Client"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Thank you for your inquiry. Please review the estimated pricing and terms below." />
              </div>

              <div className="space-y-1">
                <Textarea label="Quotation Terms & Conditions"
                  rows={3}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="This price quotation is valid for the stated duration. Device availability and warranty conditions apply upon final confirmation." />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT 4 COLUMNS: PRICING SUMMARY & ACTIONS */}
        <div className="lg:col-span-4 space-y-6">

          {/* Pricing Summary Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5 sticky top-6">
            <h2 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Financial Summary
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Subtotal ({items.length} items):</span>
                <span className="font-mono font-bold text-slate-900">₦{subtotal.toLocaleString()}</span>
              </div>

              {/* Global Discount */}
              <div className="space-y-1 pt-1 border-t border-slate-100">
                <div className="flex justify-between items-center text-slate-700 font-bold">
                  <span>Overall Discount (₦):</span>
                  <input
                    type="number"
                    min="0"
                    value={globalDiscount}
                    onChange={(e) => setGlobalDiscount(e.target.value)}
                    className="w-24 text-right bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono font-bold text-danger-600"
                  />
                </div>
              </div>

              {/* Tax / VAT */}
              <div className="space-y-1 pt-1 border-t border-slate-100">
                <div className="flex justify-between items-center text-slate-700 font-bold">
                  <span>Tax / VAT (%):</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-16 text-right bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono font-bold text-slate-900"
                  />
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-xs text-slate-400 font-mono">
                    <span>Tax Amount:</span>
                    <span>+₦{taxAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Grand Total Highlight */}
              <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-baseline">
                <span className="font-black text-slate-900 text-sm uppercase">Estimated Total:</span>
                <span className="font-mono font-black text-xl text-accent-600">
                  ₦{grandTotal.toLocaleString()}
                </span>
              </div>

              {/* Part Payment Breakdown if enabled */}
              {(hasInstallments || numAmountPaid > 0) && (
                <div className="pt-3 border-t border-dashed border-slate-200 space-y-2 bg-slate-50 -mx-6 px-6 py-3">
                  <div className="flex justify-between text-xs font-semibold text-success-700">
                    <span>Deposit / Paid Today:</span>
                    <span className="font-mono font-bold">₦{numAmountPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-warning-700">
                    <span>Remaining Balance:</span>
                    <span className="font-mono font-black">₦{remainingBalance.toLocaleString()}</span>
                  </div>
                  {hasInstallments && installments.length > 0 && (
                    <p className="text-xs text-slate-500">
                      Scheduled over <strong>{installments.length} installment(s)</strong>.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2.5 pt-2">
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={() => handleSubmit('SENT')}
                disabled={isSaving}
                leftIcon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                className="w-full bg-accent-600 hover:bg-accent-500 font-extrabold shadow-lg shadow-accent-600/25"
              >
                {isSaving ? 'Creating Quotation...' : 'Create & Issue Quotation'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => handleSubmit('DRAFT')}
                disabled={isSaving}
                className="w-full font-bold border-slate-200 text-slate-700"
              >
                Save as Draft
              </Button>
            </div>

            <div className="p-3.5 bg-accent-50/70 rounded-xl border border-accent-100 text-xs text-accent-800 space-y-1">
              <p className="font-bold flex items-center gap-1">
                ℹ️ Stock is not deducted yet
              </p>
              <p className="text-accent-700 leading-relaxed">
                Creating this quotation keeps devices in stock until the customer accepts and you convert it to an official invoice.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Success Modal */}
      {showSuccessModal && createdQuote && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-success-50 text-success-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">Quotation Created!</h3>
              <p className="text-xs text-slate-500 font-medium">
                Quotation <strong className="font-mono text-slate-900 font-bold">#{createdQuote.quoteNumber}</strong> for <strong className="font-mono text-accent-600 font-bold">₦{createdQuote.totalAmount.toLocaleString()}</strong> is ready.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <a
                href={api.getQuotePdfDownloadUrl(createdQuote.id)}
                onClick={(e) => api.handlePdfLinkClick(e, api.getQuotePdfDownloadUrl(createdQuote.id), `Quotation-${createdQuote.quoteNumber || createdQuote.id}.pdf`)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button variant="secondary" size="md" leftIcon={<Printer className="w-4 h-4" />} className="w-full font-bold">
                  Print / PDF
                </Button>
              </a>

              <Button
                variant="primary"
                size="md"
                onClick={() => router.push(`/dashboard/quotes/${createdQuote.id}`)}
                leftIcon={<ChevronRight className="w-4 h-4" />}
                className="w-full bg-accent-600 hover:bg-accent-500 font-bold"
              >
                View Quote
              </Button>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <Link
                href="/dashboard/quotes"
                className="text-xs font-bold text-slate-500 hover:text-slate-900 transition"
              >
                ← Back to Quotations Registry
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
