'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  FileText,
  Receipt,
  Store,
  Save,
  QrCode,
  Building,
  ChevronRight,
  Eye,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function ReceiptInvoiceTemplatesPage() {
  const [activeTab, setActiveTab] = useState<'receipt' | 'invoice'>('receipt');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Logo & Branding State
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [showLogoOnReceipt, setShowLogoOnReceipt] = useState(true);
  const [showLogoOnInvoice, setShowLogoOnInvoice] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Receipt Customization Settings
  const [storeName, setStoreName] = useState('');
  const [storeBranch, setStoreBranch] = useState('Main Store Branch');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('Thank you for shopping! 30-Day Store Warranty included. No refunds without receipt.');
  const [showQrCode, setShowQrCode] = useState(true);
  const [showImei, setShowImei] = useState(true);

  // Invoice Customization Settings
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [invoiceHeaderNote, setInvoiceHeaderNote] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [invoiceTerms, setInvoiceTerms] = useState('Payment is due within the selected term days. 12-Month Store Warranty Included.');

  useEffect(() => {
    async function loadTemplates() {
      setLoading(true);
      setError(null);
      try {
        const [profile, businessProf] = await Promise.all([
          api.getBusinessTemplates().catch(() => null),
          api.getBusinessProfile().catch(() => null),
        ]);
        const data = profile || businessProf;
        if (data) {
          if (data.name) {
            setStoreName(data.name);
            setCompanyName(data.name);
          }
          if (data.address) setStoreAddress(data.address);
          if (data.phone) setStorePhone(data.phone);
          if (data.email) setBusinessEmail(data.email);
          if (data.logoUrl) setLogoUrl(data.logoUrl);
          if (data.bankName) setBankName(data.bankName);
          if (data.accountNumber) setAccountNumber(data.accountNumber);
          if (data.accountName) setAccountName(data.accountName);
          if (data.receiptFooter) setReceiptFooter(data.receiptFooter);
          if (data.receiptTerms) setInvoiceTerms(data.receiptTerms);
        }
      } catch (err: any) {
        console.error('Failed to load business templates:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTemplates();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP, or SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file exceeds the 5MB size limit. Please choose a smaller image.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLogoUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await api.updateBusinessTemplates({
        name: (activeTab === 'invoice' ? companyName : storeName).trim(),
        logoUrl: logoUrl.trim(),
        address: storeAddress.trim(),
        phone: storePhone.trim(),
        email: businessEmail.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        receiptFooter: receiptFooter.trim(),
        receiptTerms: invoiceTerms.trim(),
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err: any) {
      console.error('Failed to save templates:', err);
      setError(err.message || 'Failed to save template settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8">

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <nav className="flex items-center text-xs font-semibold text-slate-500 gap-1 mb-1">
            <Link href="/dashboard" className="hover:text-slate-900 transition">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900 font-bold">Settings & Brand</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-blue-600 font-bold">Receipt & Invoice Templates</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Receipt & Invoice Templates Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mt-1 leading-relaxed">
            Customize your store logo, branding, return policies, tax IDs, and warranty disclaimers printed on receipts and invoices.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={isSaving}
            leftIcon={
              isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : isSaved ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Save className="w-4 h-4" />
              )
            }
            className="bg-blue-600 hover:bg-blue-500 font-bold shadow-md shadow-blue-600/20"
          >
            {isSaving ? 'Saving...' : isSaved ? 'Templates Saved!' : 'Save Template Settings'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          {error}
        </div>
      )}

      {/* Shared Brand Identity & Logo Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-600" /> Business Logo & Visual Identity
            </h2>
            <p className="text-xs text-slate-500">
              Upload your company or store logo. It will be printed on thermal sales receipts and embedded in commercial PDF invoices.
            </p>
          </div>
          {logoUrl && (
            <Badge variant="verified" size="sm">Logo Active</Badge>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Logo Preview Container */}
          <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center relative group shrink-0 shadow-inner">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Business Logo"
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 p-2 text-center">
                <ImageIcon className="w-7 h-7 text-slate-300" />
                <span className="text-[10px] font-bold">No Logo Uploaded</span>
              </div>
            )}
          </div>

          {/* Upload Controls & Guidelines */}
          <div className="space-y-3 flex-1">
            <div>
              <p className="text-xs font-bold text-slate-800">Upload Brand Logo</p>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Supported formats: PNG, JPG, WEBP, or SVG. Maximum file size: 5MB. Transparent PNG recommended for best thermal print clarity.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Upload className="w-3.5 h-3.5 text-blue-600" />}
                onClick={() => fileInputRef.current?.click()}
                className="font-bold border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                {logoUrl ? 'Change Logo' : 'Upload Logo'}
              </Button>

              {logoUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                  onClick={handleRemoveLogo}
                  className="text-rose-600 hover:bg-rose-50 font-bold"
                >
                  Remove Logo
                </Button>
              )}
            </div>

            {/* Display Toggles */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLogoOnReceipt}
                  onChange={(e) => setShowLogoOnReceipt(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Show on Thermal Receipts</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLogoOnInvoice}
                  onChange={(e) => setShowLogoOnInvoice(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Show on PDF Invoices</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('receipt')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'receipt'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" /> Thermal Receipt Template
        </button>

        <button
          onClick={() => setActiveTab('invoice')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'invoice'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" /> PDF Invoice Statement Template
        </button>
      </div>

      {/* Main 2-Column Customizer & Live Preview Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT 7 COLUMNS: CUSTOMIZATION FORM */}
        <div className="lg:col-span-7 space-y-6">

          {activeTab === 'receipt' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-blue-600" /> Receipt Header & Store Details
                </h2>
                <p className="text-xs text-slate-500">Configure information printed at the top of customer thermal receipts.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Store / Business Name *</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. NoxGuarda Retail POS"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Branch Subtitle</label>
                  <input
                    type="text"
                    value={storeBranch}
                    onChange={(e) => setStoreBranch(e.target.value)}
                    placeholder="e.g. Main Branch"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Store Address</label>
                  <input
                    type="text"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    placeholder="e.g. Computer Village, Ikeja, Lagos"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Support Phone / Contact</label>
                  <input
                    type="text"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    placeholder="e.g. +234 801 234 5678"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700">Support Email Address</label>
                  <input
                    type="email"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    placeholder="e.g. support@store.ng"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Toggles & Footer Disclaimer */}
              <div className="pt-3 border-t border-slate-100 space-y-4">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Receipt Policy & Display Controls
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Footer Return & Warranty Policy</label>
                  <textarea
                    rows={3}
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-600 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showQrCode}
                      onChange={(e) => setShowQrCode(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span>Print Verification QR Code</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showImei}
                      onChange={(e) => setShowImei(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span>Show Device IMEI / Serial</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'invoice' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-600" /> Commercial Invoice & Corporate Layout Settings
                </h2>
                <p className="text-xs text-slate-500">Configure corporate information, bank remittance details, and footer clauses for formal PDF invoices.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Legal Company / Store Name *</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Company Support Email *</label>
                  <input
                    type="email"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    placeholder="e.g. billing@yourstore.ng"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Company Support Phone</label>
                  <input
                    type="text"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    placeholder="+234 801 234 5678"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Business / Store Address</label>
                  <input
                    type="text"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    placeholder="e.g. Computer Village, Ikeja, Lagos"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Bank Remittance Details Box */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-3 text-xs">
                <div className="font-extrabold text-blue-900 flex items-center justify-between">
                  <span>Direct Bank Wire & Remittance Information</span>
                  <span className="text-[10px] text-blue-600 font-bold uppercase">Printed on Invoice Statement</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-[11px]">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Zenith Bank"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-[11px]">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 1012345678"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-[11px]">Account Name</label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="e.g. TechWorld Ltd"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Payment Terms & Legal Warranty Bullets</label>
                <textarea
                  rows={2}
                  value={invoiceTerms}
                  onChange={(e) => setInvoiceTerms(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          )}

        </div>

        {/* RIGHT 5 COLUMNS: LIVE PREVIEW CARD */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-blue-600" /> Real-Time Live Preview
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Updates Automatically</span>
          </div>

          {activeTab === 'receipt' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-4 max-w-sm mx-auto">
              {/* Thermal Paper Preview Container */}
              <div className="p-5 rounded-xl bg-slate-50 border border-dashed border-slate-300 font-mono text-xs text-slate-800 space-y-3 text-left">
                {/* Logo & Store Header */}
                <div className="text-center space-y-1 border-b border-slate-200 pb-3">
                  {logoUrl && showLogoOnReceipt && (
                    <div className="mb-2 flex justify-center">
                      <img
                        src={logoUrl}
                        alt="Store Logo"
                        className="h-10 max-w-[130px] object-contain filter grayscale contrast-125"
                      />
                    </div>
                  )}
                  <p className="font-extrabold text-sm text-slate-900">{storeName || 'Store Name'}</p>
                  {storeBranch && <p className="text-[10px] text-slate-500 font-sans">{storeBranch}</p>}
                  {storeAddress && <p className="text-[10px] text-slate-500 font-sans">{storeAddress}</p>}
                  {storePhone && <p className="text-[10px] text-slate-500 font-sans">Tel: {storePhone}</p>}
                  {businessEmail && <p className="text-[10px] text-slate-500 font-sans">Email: {businessEmail}</p>}
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                  <span>Receipt: <strong>#RCP-84920</strong></span>
                  <span>Aug 11, 2026</span>
                </div>

                <div className="border-y border-slate-200 py-2 space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <div>
                      <p className="font-bold text-slate-900">iPhone 15 Pro (256GB)</p>
                      {showImei && <p className="text-[9px] text-slate-500">IMEI: 358291048291048</p>}
                    </div>
                    <span className="font-bold text-slate-900">₦1,099,000</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <div>
                      <p className="font-bold text-slate-900">MagSafe Case Navy</p>
                    </div>
                    <span className="font-bold text-slate-900">₦49,000</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span>₦1,148,000</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-xs border-t border-slate-200 pt-1 text-slate-900">
                    <span>TOTAL PAID</span>
                    <span className="text-blue-600">₦1,148,000</span>
                  </div>
                </div>

                {showQrCode && (
                  <div className="pt-2 text-center border-t border-slate-200 space-y-1">
                    <div className="w-16 h-16 bg-white border border-slate-200 rounded mx-auto flex items-center justify-center text-slate-400">
                      <QrCode className="w-10 h-10" />
                    </div>
                    <p className="text-[9px] text-slate-400 font-sans">Scan QR to verify proof of purchase</p>
                  </div>
                )}

                <div className="pt-2 text-center text-[10px] text-slate-500 font-sans border-t border-slate-200 leading-snug">
                  {receiptFooter}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'invoice' && (
            <div className="p-5 sm:p-7 rounded-2xl bg-white border border-slate-300 shadow-2xl space-y-5 text-[11px] font-sans text-slate-800 max-w-xl mx-auto overflow-hidden">
              {/* Top Company Header (Left: Details, Right: Logo) */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-0.5">
                  <h3 className="font-black text-sm sm:text-base text-slate-950">{companyName || 'Your Company'}</h3>
                  <p className="text-slate-600">{storeAddress || 'Computer Village, Ikeja, Lagos'}</p>
                  <p className="text-slate-600">Tel: {storePhone || '+234 801 234 5678'} • Email: {businessEmail || 'billing@store.ng'}</p>
                </div>

                {logoUrl && showLogoOnInvoice ? (
                  <div className="h-12 w-28 flex items-center justify-end">
                    <img src={logoUrl} alt="Logo" className="max-h-12 max-w-full object-contain" />
                  </div>
                ) : (
                  <div className="text-right flex items-center gap-1.5 justify-end">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                      {(companyName || 'NG').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-lg font-black text-slate-900 tracking-tight">
                      {companyName || 'NoxGuarda'}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200" />

              {/* Dual Box (Left: Invoice To, Right: Invoice No Solid Block) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
                {/* Left Card: Invoice To */}
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1">
                  <p className="font-black text-blue-700 text-xs tracking-tight">Invoice To:</p>
                  <p className="font-extrabold text-slate-900 text-xs">Corporate Client Ltd, Adeola Johnson</p>
                  <p className="text-slate-600 text-[10px]">14 Marina Street, Victoria Island, Lagos</p>
                  <p className="text-slate-600 text-[10px] font-medium pt-0.5">
                    <strong>Email:</strong> procurement@client.example.ng
                  </p>
                </div>

                {/* Right Card: Solid Blue Header Metadata Table */}
                <div className="rounded-xl border border-blue-900/20 overflow-hidden shadow-xs">
                  <div className="bg-[#3b5998] text-white px-3 py-2 flex justify-between items-center font-extrabold text-xs">
                    <span>Invoice No:</span>
                    <span className="font-mono tracking-wide">VF-INV-0013</span>
                  </div>
                  <div className="bg-white p-2 space-y-1 text-[10px] border-t border-blue-900/10">
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="font-bold text-slate-600">Invoice Date:</span>
                      <span className="font-mono text-slate-900">2026-09-17</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="font-bold text-slate-600">Payment Status:</span>
                      <span className="font-bold text-amber-600">PENDING</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-600">Due Date:</span>
                      <span className="font-mono text-slate-900">2026-10-02</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table with Solid Blue Header */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-[#3b5998] text-white font-black">
                    <tr>
                      <th className="py-2 px-2.5 w-8">#</th>
                      <th className="py-2 px-2.5">Item Description & Specs</th>
                      <th className="py-2 px-2.5 text-center w-14">Qty</th>
                      <th className="py-2 px-2.5 text-right w-24">Unit Price</th>
                      <th className="py-2 px-2.5 text-right w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    <tr className="bg-white">
                      <td className="py-2 px-2.5 text-slate-400 font-bold">1</td>
                      <td className="py-2 px-2.5">
                        <p className="font-bold text-slate-900">Apple iPhone 15 Pro Max (256GB - Natural Titanium)</p>
                        <p className="text-[9px] text-slate-500 leading-tight">
                          IMEI: 354892019482910 • 12-Month Store Warranty
                        </p>
                      </td>
                      <td className="py-2 px-2.5 text-center font-bold">1</td>
                      <td className="py-2 px-2.5 text-right font-mono">₦1,450,000</td>
                      <td className="py-2 px-2.5 text-right font-bold text-slate-900 font-mono">₦1,450,000</td>
                    </tr>
                    <tr className="bg-slate-50/70">
                      <td className="py-2 px-2.5 text-slate-400 font-bold">2</td>
                      <td className="py-2 px-2.5">
                        <p className="font-bold text-slate-900">Samsung Galaxy S24 Ultra (512GB - Titanium Black)</p>
                        <p className="text-[9px] text-slate-500 leading-tight">
                          IMEI: 358902194829014 • Screen Guard & Case Installed
                        </p>
                      </td>
                      <td className="py-2 px-2.5 text-center font-bold">1</td>
                      <td className="py-2 px-2.5 text-right font-mono">₦1,680,000</td>
                      <td className="py-2 px-2.5 text-right font-bold text-slate-900 font-mono">₦1,680,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Subtotal, Total & Bank Remittance Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start pt-1">
                {/* Bank Wire Details on Left */}
                {bankName && accountNumber ? (
                  <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-[10px] space-y-1">
                    <p className="font-black text-blue-900 uppercase tracking-wide">
                      Direct Bank Remittance Instructions:
                    </p>
                    <p className="text-blue-950 font-bold">
                      Bank: <span className="font-normal">{bankName}</span>
                    </p>
                    <p className="text-blue-950 font-bold">
                      Account #: <span className="font-mono">{accountNumber}</span>
                    </p>
                    <p className="text-blue-950 font-bold">
                      Account Name: <span className="font-normal">{accountName || companyName}</span>
                    </p>
                    <p className="text-blue-700 text-[9px]">
                      Payment Ref: <span className="font-mono font-bold">VF-INV-0013</span>
                    </p>
                  </div>
                ) : (
                  <div />
                )}

                {/* Subtotal & Total Right Aligned */}
                <div className="space-y-1 text-[11px] sm:ml-auto w-full sm:w-56">
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>SubTotal</span>
                    <span className="font-mono text-slate-900">₦3,130,000</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>VAT (0%)</span>
                    <span className="font-mono text-slate-900">₦0.00</span>
                  </div>
                  <div className="border-t-2 border-slate-900 pt-1.5 flex justify-between text-slate-900 font-black text-xs">
                    <span>TOTAL DUE</span>
                    <span className="font-mono text-slate-950 text-sm">₦3,130,000</span>
                  </div>
                </div>
              </div>

              {/* Policy & Remark Bullets */}
              <div className="pt-2 text-[10px] text-slate-600 space-y-1">
                <p className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0" />
                  <strong>Payment Term:</strong> {invoiceTerms}
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0" />
                  <strong>Policy Remarks:</strong> All serial & IMEI numbers are permanently verified in store ledger.
                </p>
              </div>

              {/* Bottom Footer Bar */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-1 text-[9px] text-slate-500 font-medium">
                <div>
                  {companyName} • Phone: {storePhone || '+234 801 234 5678'} • Email: {businessEmail || 'billing@store.ng'}
                </div>
                <div className="font-bold text-slate-600">Page: 1 / 1</div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
