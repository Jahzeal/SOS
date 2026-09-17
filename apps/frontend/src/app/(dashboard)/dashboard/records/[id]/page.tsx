'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Smartphone,
  ArrowLeft,
  Edit2,
  Save,
  X,
  Trash2,
  ShoppingCart,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Copy,
  Clock,
  User,
  Phone,
  Mail,
  Receipt,
  Wrench,
  Loader2,
  DollarSign,
  Tag,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

const STATUS_OPTIONS = [
  { value: 'IN_STOCK', label: 'In Stock' },
  { value: 'SOLD', label: 'Sold' },
  { value: 'IN_REPAIR', label: 'Under Repair' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'DISPOSED', label: 'Disposed' },
  { value: 'RETURNED', label: 'Returned' },
];

const CONDITION_OPTIONS = [
  { value: 'NEW', label: 'Brand New (Sealed)' },
  { value: 'LIKE_NEW', label: 'Like New / Open Box' },
  { value: 'REFURBISHED', label: 'Certified Refurbished' },
  { value: 'USED', label: 'Pre-Owned / Fair Condition' },
];

export default function PhoneRecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recordId = params?.id as string;

  const [record, setRecord] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Edit Form State
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    color: '',
    storageCapacity: '',
    condition: 'NEW',
    status: 'IN_STOCK',
    purchasePrice: 0,
    sellingPrice: 0,
    serialNumber: '',
    imei2: '',
    warrantyDurationMonths: 0,
    customerName: '',
    customerPhone: '',
    customerEmail: '',
  });

  const fetchRecord = async () => {
    if (!recordId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPhoneById(recordId);
      if (data) {
        setRecord(data);
        setFormData({
          brand: data.brand || '',
          model: data.model || '',
          color: data.color || '',
          storageCapacity: data.storageCapacity || '',
          condition: data.condition || 'NEW',
          status: data.status || 'IN_STOCK',
          purchasePrice: data.purchasePrice || 0,
          sellingPrice: data.sellingPrice || 0,
          serialNumber: data.serialNumber || '',
          imei2: data.imei2 || '',
          warrantyDurationMonths: data.warrantyDurationMonths || 0,
          customerName: data.customer?.name || '',
          customerPhone: data.customer?.phone || '',
          customerEmail: data.customer?.email || '',
        });
      } else {
        setError('Phone record not found.');
      }
    } catch (err: any) {
      console.error('Failed to load phone record:', err);
      setError(err.message || 'The requested phone record could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecord();
  }, [recordId]);

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updated = await api.updatePhone(recordId, formData);
      setRecord(updated);
      setIsEditing(false);
      setSuccessMessage('Device record successfully updated!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to update phone record:', err);
      setError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${record?.brand} ${record?.model} (${record?.imei1})? This action cannot be undone.`)) {
      return;
    }
    setSaving(true);
    try {
      await api.deletePhone(recordId);
      router.push('/dashboard/records');
    } catch (err: any) {
      alert(err.message || 'Failed to delete record');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
        <p className="text-xs font-bold text-slate-500">Loading device passport & records...</p>
      </div>
    );
  }

  if (error && !record) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Record Not Found</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
        <div className="pt-2">
          <Link href="/dashboard/records">
            <Button variant="primary" size="sm">
              ← Return to Phone Records
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isWarrantyActive = record?.warrantyExpiryDate && new Date(record.warrantyExpiryDate) > new Date();

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-12 max-w-7xl mx-auto">

      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Link href="/dashboard/records" className="hover:text-teal-600 transition flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Records
            </Link>
            <span>/</span>
            <span className="text-slate-900">{record?.brand} {record?.model}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {record?.brand} {record?.model}
            </h1>
            <Badge
              variant={
                record?.status === 'IN_STOCK'
                  ? 'verified'
                  : record?.status === 'SOLD'
                  ? 'sold'
                  : record?.status === 'IN_REPAIR'
                  ? 'business'
                  : 'starter'
              }
              size="md"
            >
              {record?.status?.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {isEditing ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={saving}
                leftIcon={<X className="w-3.5 h-3.5" />}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
                leftIcon={<Edit2 className="w-3.5 h-3.5 text-slate-600" />}
              >
                Edit Device
              </Button>
              {record?.status === 'IN_STOCK' && (
                <Link href={`/dashboard/checkout?device=${record.id}`}>
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
                    leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                  >
                    Quick Sell POS
                  </Button>
                </Link>
              )}
              <button
                onClick={handleDelete}
                disabled={saving}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-slate-200"
                title="Delete Record"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form & Bento Grid */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT 8 COLS: Device Specifications & Identity Passport */}
        <div className="lg:col-span-8 space-y-6">

          {/* Primary Hardware Specs Card */}
          <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Device Hardware & Identification</h3>
                  <p className="text-xs text-slate-500 font-medium">Core cryptographic IMEI identity and storage parameters.</p>
                </div>
              </div>
              {isEditing && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                  Editing Mode
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Brand */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                  Brand Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 text-slate-900"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 text-sm">
                    {record?.brand}
                  </div>
                )}
              </div>

              {/* Model */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                  Model / Variant
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 text-slate-900"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 text-sm">
                    {record?.model}
                  </div>
                )}
              </div>

              {/* Color */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                  Color Finish
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    placeholder="e.g. Space Gray, Titanium"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-teal-600 text-slate-900"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-semibold text-slate-800">
                    {record?.color || 'Standard / Unspecified'}
                  </div>
                )}
              </div>

              {/* Storage Capacity */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                  Storage Capacity
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    placeholder="e.g. 128GB, 256GB, 1TB"
                    value={formData.storageCapacity}
                    onChange={(e) => setFormData({ ...formData, storageCapacity: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-teal-600 text-slate-900"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-semibold text-slate-800">
                    {record?.storageCapacity || 'N/A'}
                  </div>
                )}
              </div>

              {/* Condition */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                  Physical Condition
                </label>
                {isEditing ? (
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-teal-600 text-slate-900 cursor-pointer"
                  >
                    {CONDITION_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-semibold text-slate-800">
                    {record?.condition?.replace('_', ' ')}
                  </div>
                )}
              </div>

              {/* Inventory Status */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                  Inventory Status
                </label>
                {isEditing ? (
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-teal-600 text-slate-900 cursor-pointer"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-semibold text-slate-800">
                    {record?.status?.replace('_', ' ')}
                  </div>
                )}
              </div>
            </div>

            {/* Identifiers (IMEI 1, IMEI 2, Serial Number) */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Device Hardware Identifiers</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* IMEI 1 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Primary IMEI (1)</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(record?.imei1, 'imei1')}
                      className="text-slate-400 hover:text-teal-600 cursor-pointer"
                      title="Copy IMEI 1"
                    >
                      {copiedField === 'imei1' ? (
                        <span className="text-[10px] font-extrabold text-emerald-600">Copied!</span>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="font-mono font-extrabold text-slate-900 text-xs sm:text-sm tracking-wide">
                    {record?.imei1}
                  </div>
                </div>

                {/* IMEI 2 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Secondary IMEI (2)</span>
                    {record?.imei2 && (
                      <button
                        type="button"
                        onClick={() => handleCopy(record?.imei2, 'imei2')}
                        className="text-slate-400 hover:text-teal-600 cursor-pointer"
                        title="Copy IMEI 2"
                      >
                        {copiedField === 'imei2' ? (
                          <span className="text-[10px] font-extrabold text-emerald-600">Copied!</span>
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      placeholder="Optional IMEI 2"
                      value={formData.imei2}
                      onChange={(e) => setFormData({ ...formData, imei2: e.target.value })}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono text-xs outline-none focus:border-teal-600"
                    />
                  ) : (
                    <div className="font-mono font-bold text-slate-800 text-xs">
                      {record?.imei2 || 'None'}
                    </div>
                  )}
                </div>

                {/* Serial Number */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Serial Number (SN)</span>
                    {record?.serialNumber && (
                      <button
                        type="button"
                        onClick={() => handleCopy(record?.serialNumber, 'sn')}
                        className="text-slate-400 hover:text-teal-600 cursor-pointer"
                        title="Copy Serial Number"
                      >
                        {copiedField === 'sn' ? (
                          <span className="text-[10px] font-extrabold text-emerald-600">Copied!</span>
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      placeholder="Optional Serial"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono text-xs outline-none focus:border-teal-600"
                    />
                  ) : (
                    <div className="font-mono font-bold text-slate-800 text-xs">
                      {record?.serialNumber || 'None'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Financial & Warranty Valuation */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Pricing & Warranty Valuation</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {/* Purchase Price */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                    Purchase / Buyback Cost (₦)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={formData.purchasePrice === 0 ? '' : formData.purchasePrice}
                      onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold outline-none focus:border-teal-600 text-slate-900"
                    />
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-mono font-bold text-slate-800 text-sm">
                      ₦{record?.purchasePrice?.toLocaleString() || 0}
                    </div>
                  )}
                </div>

                {/* Selling Price */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                    Retail Selling Price (₦)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={formData.sellingPrice === 0 ? '' : formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold outline-none focus:border-teal-600 text-slate-900"
                    />
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-mono font-extrabold text-teal-700 text-sm">
                      ₦{record?.sellingPrice?.toLocaleString() || 0}
                    </div>
                  )}
                </div>

                {/* Warranty Duration */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                    Warranty Duration (Months)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      max="36"
                      value={formData.warrantyDurationMonths}
                      onChange={(e) => setFormData({ ...formData, warrantyDurationMonths: Number(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-teal-600 text-slate-900"
                    />
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-800 text-sm flex items-center justify-between">
                      <span>{record?.warrantyDurationMonths || 0} Months</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${isWarrantyActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {isWarrantyActive ? 'Active' : 'Expired'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Linked Sales & Repairs History */}
          <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-teal-600" />
              <span>Transaction & Service Records</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Sales Link */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">POS Receipt / Invoice</span>
                {Array.isArray(record?.saleItems) && record.saleItems.length > 0 ? (
                  record.saleItems.map((si: any, idx: number) => (
                    <div key={idx} className="space-y-1 pt-1">
                      <div className="font-extrabold text-slate-900">Receipt #{si.sale?.receiptNumber || si.sale?.invoiceNumber || 'N/A'}</div>
                      <div className="text-slate-500">Sold for ₦{si.price?.toLocaleString()} on {new Date(si.sale?.createdAt).toLocaleDateString()}</div>
                      <Link href={`/dashboard/receipts?search=${si.sale?.receiptNumber || ''}`} className="text-teal-600 font-bold hover:underline inline-flex items-center gap-1 text-[11px] pt-1">
                        View Receipt →
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 font-medium">No sales recorded yet for this device.</p>
                )}
              </div>

              {/* Repair Tickets */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Repair Tickets</span>
                {Array.isArray(record?.repairs) && record.repairs.length > 0 ? (
                  record.repairs.map((r: any, idx: number) => (
                    <div key={idx} className="space-y-1 pt-1">
                      <div className="font-extrabold text-slate-900">Ticket #{r.ticketNumber} ({r.status})</div>
                      <div className="text-slate-500">{r.issueDescription}</div>
                      <Link href={`/dashboard/repairs?ticket=${r.ticketNumber}`} className="text-teal-600 font-bold hover:underline inline-flex items-center gap-1 text-[11px] pt-1">
                        View Ticket →
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 font-medium">No repair diagnostics logged.</p>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT 4 COLS: Customer Information & Digital QR Passport */}
        <div className="lg:col-span-4 space-y-6">

          {/* Digital QR Origin Passport */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-teal-600" />
                <span>QR Origin Passport</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                100% Genuine
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center space-y-3">
              {record?.qrCodeUrl ? (
                <img
                  src={record.qrCodeUrl}
                  alt={`QR Passport for IMEI ${record.imei1}`}
                  className="w-40 h-40 object-contain rounded-xl bg-white p-2 border border-slate-200 shadow-sm"
                />
              ) : (
                <div className="w-40 h-40 rounded-xl bg-white border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                  Generating QR...
                </div>
              )}
              <div className="text-center">
                <p className="font-mono text-xs font-extrabold text-slate-800">{record?.imei1}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Scannable by any smartphone camera</p>
              </div>
            </div>

            <a
              href={`/verify?imei=${record?.imei1}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline py-1"
            >
              <span>Open Public Verification Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Customer Association Card */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-teal-600" />
                <span>Customer Profile</span>
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Customer Name */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Customer / Buyer Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-teal-600 text-slate-900"
                  />
                ) : (
                  <div className="font-bold text-slate-900 text-sm">
                    {record?.customer?.name || 'No Customer Assigned'}
                  </div>
                )}
              </div>

              {/* Customer Phone */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    placeholder="e.g. +234 800 000 0000"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-teal-600 text-slate-900"
                  />
                ) : (
                  <div className="flex items-center justify-between font-mono font-semibold text-slate-700">
                    <span>{record?.customer?.phone || 'N/A'}</span>
                    {record?.customer?.phone && (
                      <a href={`tel:${record.customer.phone}`} className="text-teal-600 hover:underline text-[11px] font-bold">
                        Call →
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Customer Email */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    placeholder="e.g. customer@example.com"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-teal-600 text-slate-900"
                  />
                ) : (
                  <div className="font-medium text-slate-600">
                    {record?.customer?.email || 'N/A'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Audit & Registration Metadata */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2.5 text-xs text-slate-500 font-medium">
            <div className="flex items-center justify-between">
              <span>Registered On:</span>
              <span className="font-bold text-slate-800">{new Date(record?.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last Updated:</span>
              <span className="font-bold text-slate-800">{new Date(record?.updatedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Registered By:</span>
              <span className="font-bold text-slate-800">{record?.business?.name || 'Store Account'}</span>
            </div>
          </div>

        </div>

      </form>

    </div>
  );
}
