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
  Sparkles,
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
  const [storeName, setStoreName] = useState('VerifyFlow Retail POS');
  const [storeBranch, setStoreBranch] = useState('Main Store Branch');
  const [storeAddress, setStoreAddress] = useState('Computer Village, Ikeja, Lagos');
  const [storePhone, setStorePhone] = useState('+234 801 234 5678');
  const [receiptFooter, setReceiptFooter] = useState('Thank you for shopping! 30-Day Store Warranty included. No refunds without receipt.');
  const [showQrCode, setShowQrCode] = useState(true);
  const [showImei, setShowImei] = useState(true);

  // Invoice Customization Settings
  const [companyName, setCompanyName] = useState('VerifyFlow Wireless Systems Ltd');
  const [taxId, setTaxId] = useState('TIN-84920194-NG');
  const [invoiceHeaderNote, setInvoiceHeaderNote] = useState('Official Commercial Invoice & Device Ownership Guarantee Statement.');
  const [bankWireInfo, setBankWireInfo] = useState('Zenith Bank • Account: 1012345678 • VerifyFlow Systems');
  const [invoiceTerms, setInvoiceTerms] = useState('Payment is due within the selected term days. Late payments subject to a 1.5% monthly fee.');

  useEffect(() => {
    async function loadTemplates() {
      setLoading(true);
      setError(null);
      try {
        const profile = await api.getBusinessTemplates();
        if (profile) {
          if (profile.name) setStoreName(profile.name);
          if (profile.address) setStoreAddress(profile.address);
          if (profile.phone) setStorePhone(profile.phone);
          if (profile.logoUrl) setLogoUrl(profile.logoUrl);
          if (profile.receiptFooter) setReceiptFooter(profile.receiptFooter);
          if (profile.receiptTerms) setInvoiceTerms(profile.receiptTerms);
          if (profile.name) setCompanyName(profile.name);
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
        name: storeName.trim(),
        logoUrl: logoUrl.trim(),
        address: storeAddress.trim(),
        phone: storePhone.trim(),
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
              <Sparkles className="w-4 h-4 text-blue-600" /> Business Logo & Visual Identity
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Branch Subtitle</label>
                  <input
                    type="text"
                    value={storeBranch}
                    onChange={(e) => setStoreBranch(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Store Address</label>
                  <input
                    type="text"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Support Phone / Contact</label>
                  <input
                    type="text"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
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
                  <Building className="w-4 h-4 text-blue-600" /> Commercial Invoice & Odoo Layout Settings
                </h2>
                <p className="text-xs text-slate-500">Configure corporate information, payment history rules, and footer clauses for formal PDF invoices.</p>
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
                  <label className="font-bold text-slate-700">Tax ID / VAT Registration #</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Company Support Email</label>
                  <input
                    type="email"
                    value={storeAddress ? 'billing@' + storeName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com' : 'info@yourcompany.example.com'}
                    readOnly
                    className="w-full px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl font-medium text-slate-600 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Company Website / Portal</label>
                  <input
                    type="text"
                    value="https://verifyflow.app/verify"
                    readOnly
                    className="w-full px-3.5 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl font-medium text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Invoice Header Note / Description</label>
                <input
                  type="text"
                  value={invoiceHeaderNote}
                  onChange={(e) => setInvoiceHeaderNote(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Bank Wire & Transfer Instructions</label>
                <textarea
                  rows={2}
                  value={bankWireInfo}
                  onChange={(e) => setBankWireInfo(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                />
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
                  <p className="text-[10px] text-slate-500 font-sans">{storeBranch}</p>
                  <p className="text-[10px] text-slate-500 font-sans">{storeAddress}</p>
                  <p className="text-[10px] text-slate-500 font-sans">Tel: {storePhone}</p>
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
                  <p className="text-slate-600">{storeAddress || '1725 Slough Ave., demo'}</p>
                  <p className="text-slate-600">Scranton, PA 18540 • Tel: {storePhone || '89065 222'}</p>
                  <p className="text-slate-600">Email: info@{companyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company'}.com</p>
                </div>

                {logoUrl && showLogoOnInvoice ? (
                  <div className="h-12 w-28 flex items-center justify-end">
                    <img src={logoUrl} alt="Logo" className="max-h-12 max-w-full object-contain" />
                  </div>
                ) : (
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-800 tracking-tight font-mono">odoo</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200" />

              {/* Dual Box (Left: Invoice To, Right: Invoice No Solid Block) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
                {/* Left Card: Invoice To */}
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1">
                  <p className="font-black text-blue-700 text-xs tracking-tight">Invoice To:</p>
                  <p className="font-extrabold text-slate-900 text-xs">Camptocamp, Ayaan Agarwal</p>
                  <p className="text-slate-600 text-[10px]">93, Press Avenue, demo</p>
                  <p className="text-slate-600 text-[10px]">Le Bourget du Lac, 73377, France</p>
                  <p className="text-slate-600 text-[10px] font-medium pt-0.5">
                    <strong>Email:</strong> ayaan.agarwal@bestdesigners.example.com
                  </p>
                </div>

                {/* Right Card: Solid Blue Header Metadata Table */}
                <div className="rounded-xl border border-blue-900/20 overflow-hidden shadow-xs">
                  <div className="bg-[#3b5998] text-white px-3 py-2 flex justify-between items-center font-extrabold text-xs">
                    <span>Invoice No:</span>
                    <span className="font-mono tracking-wide">INV/2026/0013</span>
                  </div>
                  <div className="bg-white p-2 space-y-1 text-[10px] border-t border-blue-900/10">
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="font-bold text-slate-600">Invoice Date:</span>
                      <span className="font-mono text-slate-900">2026-09-17</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="font-bold text-slate-600">SO:</span>
                      <span className="font-mono text-slate-900">SO013</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="font-bold text-slate-600">Order Date:</span>
                      <span className="font-mono text-slate-900">2026-09-17</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-600">Due Date:</span>
                      <span className="font-mono text-slate-900">2026-10-17</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table with Solid Blue Header */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-[#3b5998] text-white font-black">
                    <tr>
                      <th className="py-2 px-2.5 w-8">Sr.</th>
                      <th className="py-2 px-2.5">Description</th>
                      <th className="py-2 px-2.5 text-center w-14">Quantity</th>
                      <th className="py-2 px-2.5 text-right w-20">Unit Price</th>
                      <th className="py-2 px-2.5 text-right w-14">Taxes</th>
                      <th className="py-2 px-2.5 text-right w-20">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    <tr className="bg-white">
                      <td className="py-2 px-2.5 text-slate-400 font-bold">1</td>
                      <td className="py-2 px-2.5">
                        <p className="font-bold text-slate-900">[A2325] iPad Retina Display</p>
                        <p className="text-[9px] text-slate-500 leading-tight">
                          7.9-Inch LED-Backlit, 128GB • Dual-Core A5 • FaceTime HD Camera (IMEI: 354892019482)
                        </p>
                      </td>
                      <td className="py-2 px-2.5 text-center font-bold">1.000</td>
                      <td className="py-2 px-2.5 text-right font-mono">$ 800.40</td>
                      <td className="py-2 px-2.5 text-right text-slate-400">$ 0.00</td>
                      <td className="py-2 px-2.5 text-right font-bold text-slate-900 font-mono">$ 800.40</td>
                    </tr>
                    <tr className="bg-slate-50/70">
                      <td className="py-2 px-2.5 text-slate-400 font-bold">2</td>
                      <td className="py-2 px-2.5">
                        <p className="font-bold text-slate-900">[CARD] Graphics Card</p>
                      </td>
                      <td className="py-2 px-2.5 text-center font-bold">1.000</td>
                      <td className="py-2 px-2.5 text-right font-mono">$ 885.00</td>
                      <td className="py-2 px-2.5 text-right text-slate-400">$ 0.00</td>
                      <td className="py-2 px-2.5 text-right font-bold text-slate-900 font-mono">$ 885.00</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="py-2 px-2.5 text-slate-400 font-bold">3</td>
                      <td className="py-2 px-2.5">
                        <p className="font-bold text-slate-900">[PRINT] Printer, All-In-One</p>
                      </td>
                      <td className="py-2 px-2.5 text-center font-bold">1.000</td>
                      <td className="py-2 px-2.5 text-right font-mono">$ 4,410.00</td>
                      <td className="py-2 px-2.5 text-right text-slate-400">$ 0.00</td>
                      <td className="py-2 px-2.5 text-right font-bold text-slate-900 font-mono">$ 4,410.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Subtotal & Total Right Aligned */}
              <div className="flex justify-end pt-1">
                <div className="w-56 space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>SubTotal</span>
                    <span className="font-mono text-slate-900">$ 6,095.40</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Taxes</span>
                    <span className="font-mono text-slate-900">$ 0.00</span>
                  </div>
                  <div className="border-t-2 border-slate-900 pt-1.5 flex justify-between text-slate-900 font-black text-xs">
                    <span>TOTAL</span>
                    <span className="font-mono text-slate-950 text-sm">$ 6,095.40</span>
                  </div>
                </div>
              </div>

              {/* Payment History Table (Odoo Signature Feature) */}
              <div className="space-y-1.5 pt-2">
                <h4 className="font-black text-xs text-slate-900">Payment History</h4>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-[10px]">
                    <thead className="bg-[#3b5998] text-white font-black">
                      <tr>
                        <th className="py-1.5 px-2.5 w-8">Sr.</th>
                        <th className="py-1.5 px-2.5">Date</th>
                        <th className="py-1.5 px-2.5">Method</th>
                        <th className="py-1.5 px-2.5">Ref.</th>
                        <th className="py-1.5 px-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      <tr className="bg-white">
                        <td className="py-1.5 px-2.5 text-slate-400 font-bold">1</td>
                        <td className="py-1.5 px-2.5 font-mono">2026-09-17</td>
                        <td className="py-1.5 px-2.5 font-bold text-slate-800">Cash</td>
                        <td className="py-1.5 px-2.5 font-mono text-slate-600">CSH1/2026/0005</td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">$ 2,000.00</td>
                      </tr>
                      <tr className="bg-slate-50/70">
                        <td className="py-1.5 px-2.5 text-slate-400 font-bold">2</td>
                        <td className="py-1.5 px-2.5 font-mono">2026-09-17</td>
                        <td className="py-1.5 px-2.5 font-bold text-slate-800">Bank / POS</td>
                        <td className="py-1.5 px-2.5 font-mono text-slate-600">BNK1/2026/0006</td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">$ 4,095.40</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Policy & Remark Bullets */}
              <div className="pt-2 text-[10px] text-slate-600 space-y-1">
                <p className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0" />
                  <strong>Payment Term:</strong> End Of Following Month (Net 30)
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0" />
                  <strong>Comment:</strong> 12-Month Official Store Guarantee Included • No refunds without statement
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0" />
                  <strong>Fiscal Position Remark:</strong> FY 2026 • VerifyFlow Authenticated Hardware
                </p>
              </div>

              {/* Bottom Footer Bar */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-1 text-[9px] text-slate-500 font-medium">
                <div>
                  Phone: {storePhone || '+1 555 123 8069'} • Email: info@{companyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'example'}.com • Web: https://verifyflow.app
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
