'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  FileText,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  User,
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
  ArrowLeft,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { A4CommercialInvoice } from '@/components/invoice/A4CommercialInvoice';

interface LineItem {
  id: string; // phoneRecord.id or custom item ID
  phoneRecordId?: string;
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

export default function EditInvoicePage({ params }: { params?: { id: string } }) {
  const router = useRouter();
  const routeParams = useParams();
  const invoiceId = (routeParams?.id as string) || params?.id || '';
  const queryClient = useQueryClient();

  // Loading & original data
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [originalInvoice, setOriginalInvoice] = useState<any>(null);

  // Invoice Meta State
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('NET_15');
  const [paymentStatus, setPaymentStatus] = useState<'DRAFT' | 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE'>('PENDING');

  // Customer Details State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  // Bank Account State
  const [useCustomBank, setUseCustomBank] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // Line Items State
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

  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mobileStep, setMobileStep] = useState(1);

  // Load existing invoice
  useEffect(() => {
    async function loadInvoice() {
      if (!invoiceId) return;
      setIsLoading(true);
      setLoadError(null);
      try {
        let inv = await api.getInvoiceById(invoiceId).catch(() => null);
        if (!inv) {
          const list = await api.getInvoices();
          inv = list?.find((i: any) => i.id === invoiceId || i.invoiceNumber === invoiceId || i.receiptNumber === invoiceId);
        }

        if (!inv) {
          setLoadError('Invoice not found.');
          return;
        }

        setOriginalInvoice(inv);
        setInvoiceNumber(inv.invoiceNumber || inv.receiptNumber || `INV-${inv.id.slice(-6)}`);
        
        // Date formatting
        if (inv.createdAt) {
          try {
            setIssueDate(new Date(inv.createdAt).toISOString().split('T')[0]);
          } catch {
            setIssueDate(new Date().toISOString().split('T')[0]);
          }
        }
        if (inv.dueDate) {
          try {
            setDueDate(new Date(inv.dueDate).toISOString().split('T')[0]);
          } catch {
            setDueDate('');
          }
        }
        if (inv.paymentTerms) setPaymentTerms(inv.paymentTerms);
        if (inv.paymentStatus) setPaymentStatus(inv.paymentStatus.toUpperCase());

        // Customer
        setCustomerName(inv.customer?.name || '');
        setCustomerEmail(inv.customer?.email || '');
        setCustomerPhone(inv.customer?.phone || '');
        setBillingAddress(inv.customer?.address || inv.billingAddress || '');

        // Bank details from notes tags or business profile
        const notesStr = inv.notes || '';
        const bankMatch = notesStr.match(/\[BANK:([^\]]+)\]/);
        const accMatch = notesStr.match(/\[ACC:([^\]]+)\]/);
        const accNameMatch = notesStr.match(/\[ACCNAME:([^\]]+)\]/);

        const bName = bankMatch ? bankMatch[1].trim() : (inv.business?.bankName || '');
        const bAcc = accMatch ? accMatch[1].trim() : (inv.business?.accountNumber || '');
        const bAccName = accNameMatch ? accNameMatch[1].trim() : (inv.business?.accountName || inv.business?.name || '');

        setBankName(bName);
        setAccountNumber(bAcc);
        setAccountName(bAccName);
        if (bankMatch || accMatch) setUseCustomBank(true);

        // Clean notes without tags
        const cleanNotes = notesStr.replace(/\[(BANK|ACC|ACCNAME):[^\]]+\]/g, '').trim();
        setNotes(cleanNotes);

        // Line Items
        if (inv.items && Array.isArray(inv.items)) {
          const mappedItems: LineItem[] = inv.items.map((item: any) => {
            const isDevice = Boolean(item.phoneRecordId || item.phoneRecord);
            return {
              id: item.phoneRecordId || item.id || `ITEM-${Math.random().toString(36).slice(2, 7)}`,
              phoneRecordId: item.phoneRecordId || item.phoneRecord?.id,
              description: item.description || (item.phoneRecord ? `${item.phoneRecord.brand} ${item.phoneRecord.model}` : 'Line Item'),
              imei: item.imei || item.phoneRecord?.imei1 || 'N/A',
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || item.price || 0,
              isDevice,
            };
          });
          setItems(mappedItems);
        }
      } catch (err: any) {
        console.error('Failed to load invoice for editing:', err);
        setLoadError(err.message || 'Failed to load invoice.');
      } finally {
        setIsLoading(false);
      }
    }

    loadInvoice();
  }, [invoiceId]);

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

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [items]);

  const totalAmount = useMemo(() => subtotal, [subtotal]);

  // Add In-Stock Device from Inventory
  const handleAddDeviceToInvoice = (phone: any) => {
    const newItem: LineItem = {
      id: phone.id,
      phoneRecordId: phone.id,
      description: `${phone.brand} ${phone.model}`,
      imei: phone.imei1,
      quantity: 1,
      unitPrice: phone.sellingPrice ?? phone.purchasePrice ?? 0,
      isDevice: true,
    };

    setItems((prev) => {
      if (prev.some((i) => i.phoneRecordId === newItem.phoneRecordId || i.id === newItem.id)) return prev;
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

  // Remove Item
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Update Item Quantity / Price
  const handleUpdateItem = (index: number, field: 'quantity' | 'unitPrice', value: number) => {
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx === index) {
          return { ...it, [field]: value };
        }
        return it;
      })
    );
  };

  // Save / Update Invoice
  const handleSaveInvoice = async (targetStatus?: string) => {
    if (!customerName.trim()) {
      setErrorMessage('Please specify the customer name.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Please add at least one line item or device to this invoice.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const statusToSave = targetStatus || paymentStatus;

    // Append custom bank details to notes if enabled
    let finalNotes = notes.trim();
    if (useCustomBank && bankName.trim()) {
      finalNotes += ` [BANK:${bankName.trim()}] [ACC:${accountNumber.trim()}] [ACCNAME:${accountName.trim()}]`;
    }

    const payload = {
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      billingAddress: billingAddress.trim() || undefined,
      dueDate: dueDate || undefined,
      paymentTerms: paymentTerms || 'NET_15',
      paymentStatus: statusToSave,
      notes: finalNotes,
      items: items.map((it) => ({
        phoneRecordId: it.phoneRecordId || (it.isDevice ? it.id : undefined),
        description: it.description,
        price: it.unitPrice,
        quantity: it.quantity,
      })),
    };

    try {
      await api.updateInvoice(invoiceId, payload);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      
      setSuccessMessage('Invoice updated successfully!');
      setTimeout(() => {
        router.push('/dashboard/sales/invoices');
      }, 1200);
    } catch (err: any) {
      console.error('Failed to update invoice:', err);
      setErrorMessage(err.message || 'Failed to update invoice. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p className="font-bold text-slate-600 text-sm">Loading invoice for editing...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Invoice Error</h2>
        <p className="text-xs text-slate-500">{loadError}</p>
        <Link href="/dashboard/sales/invoices">
          <Button variant="secondary" size="md">
            Back to Invoices
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-28 md:pb-12 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
            <Link href="/dashboard/sales/invoices" className="hover:text-blue-600 transition flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Invoices Registry
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-800">Edit Invoice</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
              Edit Invoice #{invoiceNumber}
            </h1>
            <Badge
              variant={
                paymentStatus === 'PAID'
                  ? 'verified'
                  : paymentStatus === 'DRAFT'
                  ? 'starter'
                  : paymentStatus === 'PARTIALLY_PAID'
                  ? 'warning'
                  : 'business'
              }
              size="sm"
            >
              {paymentStatus}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handlePrint} leftIcon={<Printer className="w-3.5 h-3.5" />}>
            Print A4
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isSaving}
            onClick={() => handleSaveInvoice()}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Details & Items */}
        <div className="lg:col-span-8 space-y-6">
          {/* Customer & Billing Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> Customer Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Customer Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. John Doe or Retail Corp"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Customer Phone</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +234 800 000 0000"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Customer Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. customer@example.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Billing Address</label>
                <input
                  type="text"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder="e.g. Suite 4B, Victoria Island, Lagos"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Line Items Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" /> Line Items & Devices ({items.length})
              </h2>
            </div>

            {/* Inventory Quick Add Device */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Add from In-Stock Device Inventory</label>
              <div className="relative">
                <input
                  type="text"
                  value={deviceSearch}
                  onChange={(e) => setDeviceSearch(e.target.value)}
                  placeholder="Search available devices by brand, model, or IMEI..."
                  className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              {inStockDevices.length > 0 && (
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl shadow-xs mt-2">
                  {inStockDevices.map((phone) => (
                    <div
                      key={phone.id}
                      className="p-2.5 hover:bg-blue-50/50 flex items-center justify-between gap-2 text-xs transition"
                    >
                      <div>
                        <p className="font-extrabold text-slate-900">
                          {phone.brand} {phone.model}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">IMEI: {phone.imei1}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-800">
                          ₦{Number(phone.sellingPrice || phone.purchasePrice || 0).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddDeviceToInvoice(phone)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Line Item Form */}
            <form onSubmit={handleAddCustomItem} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Add Custom Product or Service</label>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="Item description (e.g. 20W Power Adapter, Screen Protector)"
                  className="sm:col-span-6 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <input
                  type="text"
                  value={newItemImei}
                  onChange={(e) => setNewItemImei(e.target.value)}
                  placeholder="Serial / IMEI (optional)"
                  className="sm:col-span-3 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <input
                  type="text"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(formatNumberWithCommas(e.target.value))}
                  placeholder="Unit Price ₦"
                  className="sm:col-span-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                />
                <button
                  type="submit"
                  className="sm:col-span-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer shadow-xs"
                  title="Add Line Item"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Existing Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                    <th className="py-2.5 px-3 w-32 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 w-32 text-right">Total</th>
                    <th className="py-2.5 px-3 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                        No items added yet. Search devices above or add custom products.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3">
                          <p className="font-extrabold text-slate-900">{item.description}</p>
                          {item.imei && item.imei !== 'N/A' && (
                            <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">
                              IMEI/SN: {item.imei}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                            }
                            className="w-14 py-1 px-1.5 text-center bg-white border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                          />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleUpdateItem(idx, 'unitPrice', Math.max(0, parseFloat(e.target.value) || 0))
                            }
                            className="w-24 py-1 px-1.5 text-right font-mono bg-white border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                          />
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                          ₦{(item.unitPrice * item.quantity).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
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
          </div>

          {/* Notes & Bank Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" /> Bank Remittance & Notes
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="customBank"
                  checked={useCustomBank}
                  onChange={(e) => setUseCustomBank(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="customBank" className="font-bold text-slate-700 cursor-pointer">
                  Specify or override bank account details on this invoice
                </label>
              </div>

              {useCustomBank && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl animate-in fade-in">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 text-[11px]">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Zenith Bank"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 text-[11px]">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 1012345678"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 text-[11px]">Account Name</label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="e.g. Retail Store Ltd"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1 pt-2">
                <label className="font-bold text-slate-700">Remarks & Customer Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Thank you for your business. Please remit before due date..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Billing & Summary Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 sticky top-6">
            <h2 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Billing Terms & Summary
            </h2>

            {/* Payment Status Selector */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700">Payment Status</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('PENDING')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentStatus === 'PENDING'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" /> PENDING
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus('PAID')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentStatus === 'PAID'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> PAID
                </button>
              </div>
              {paymentStatus === 'DRAFT' && (
                <p className="text-[11px] text-amber-600 font-bold mt-1">
                  Currently saved as DRAFT. Select PENDING or PAID above to issue active invoice.
                </p>
              )}
            </div>

            {/* Date Settings */}
            <div className="space-y-3 text-xs pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Issue Date</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  <option value="DUE_ON_RECEIPT">Due on Receipt</option>
                  <option value="NET_7">Net 7 Days</option>
                  <option value="NET_15">Net 15 Days</option>
                  <option value="NET_30">Net 30 Days</option>
                </select>
              </div>
            </div>

            {/* Calculation Totals */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({items.length} items):</span>
                <span className="font-mono font-bold text-slate-900">
                  ₦{subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>VAT / Tax (0%):</span>
                <span className="font-mono font-bold text-slate-900">₦0.00</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-sm font-black">
                <span className="text-slate-900">TOTAL DUE:</span>
                <span className="text-blue-600 font-mono text-base font-extrabold">
                  ₦{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <Button
                variant="primary"
                fullWidth
                size="md"
                isLoading={isSaving}
                onClick={() => handleSaveInvoice(paymentStatus === 'DRAFT' ? 'PENDING' : paymentStatus)}
                className="bg-blue-600 hover:bg-blue-700 font-bold shadow-md shadow-blue-600/20"
                leftIcon={<Save className="w-4 h-4" />}
              >
                {paymentStatus === 'DRAFT' ? 'Issue Active Invoice (Pending)' : 'Save Changes'}
              </Button>

              <Button
                variant="secondary"
                fullWidth
                size="md"
                onClick={handlePrint}
                leftIcon={<Printer className="w-4 h-4 text-slate-600" />}
              >
                Print Isolated A4 Invoice
              </Button>

              <Link href="/dashboard/sales/invoices">
                <Button variant="ghost" fullWidth size="md" className="text-slate-500 mt-1">
                  Cancel & Return
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Printable Invoice Portaled Directly to document.body for Guaranteed Clean A4 Output */}
      {typeof document !== 'undefined' && createPortal(
        <div id="printable-portal" className="hidden print:block">
          <A4CommercialInvoice
            id="printable-a4-invoice-content"
            data={{
              invoiceNumber: invoiceNumber,
              id: invoiceId,
              createdAt: issueDate || originalInvoice?.createdAt,
              dueDate: dueDate || originalInvoice?.dueDate,
              paymentStatus: paymentStatus,
              paymentTerms: paymentTerms,
              notes: notes,
              totalAmount: totalAmount,
              customerName: customerName,
              customerPhone: customerPhone,
              customerEmail: customerEmail,
              customerAddress: billingAddress,
              business: {
                name: originalInvoice?.business?.name,
                address: originalInvoice?.business?.address,
                phone: originalInvoice?.business?.phone,
                email: originalInvoice?.business?.email,
                logoUrl: originalInvoice?.business?.logoUrl,
                bankName: useCustomBank ? bankName : (originalInvoice?.business?.bankName || bankName),
                accountNumber: useCustomBank ? accountNumber : (originalInvoice?.business?.accountNumber || accountNumber),
                accountName: useCustomBank ? accountName : (originalInvoice?.business?.accountName || accountName),
                warrantyTerms: originalInvoice?.business?.warrantyTerms,
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
        </div>,
        document.body
      )}

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
          body > *:not(#printable-portal) {
            display: none !important;
          }
          body > #printable-portal {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body > #printable-portal * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
