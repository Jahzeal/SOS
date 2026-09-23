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
  FileSpreadsheet,
  Palette,
  Mail,
  Download,
  Paperclip,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function ReceiptInvoiceTemplatesPage() {
  const [activeTab, setActiveTab] = useState<'receipt' | 'invoice' | 'quote'>('receipt');
  const [receiptPreviewMode, setReceiptPreviewMode] = useState<'email' | 'thermal' | 'a4'>('email');
  const [invoicePreviewMode, setInvoicePreviewMode] = useState<'email' | 'a4'>('email');
  const [quotePreviewMode, setQuotePreviewMode] = useState<'email' | 'a4'>('email');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Logo & Branding State
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [showLogoOnReceipt, setShowLogoOnReceipt] = useState(true);
  const [showLogoOnInvoice, setShowLogoOnInvoice] = useState(true);
  const [showLogoOnQuote, setShowLogoOnQuote] = useState(true);
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

  // Quote Customization Settings
  const [quoteTitle, setQuoteTitle] = useState('PRICE QUOTATION');
  const [quoteValidityDays, setQuoteValidityDays] = useState(14);
  const [quoteNotes, setQuoteNotes] = useState('Thank you for your inquiry. Please review our formal price quotation and specifications below.');
  const [quoteTerms, setQuoteTerms] = useState('Prices quoted are valid for the stated duration. Device availability and warranty conditions apply upon final confirmation.');
  const [quoteAccentColor, setQuoteAccentColor] = useState('#2563EB');
  const [quoteShowBankDetails, setQuoteShowBankDetails] = useState(true);
  const [quoteShowSignature, setQuoteShowSignature] = useState(true);

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

          if (data.quoteTitle) setQuoteTitle(data.quoteTitle);
          if (data.quoteValidityDays) setQuoteValidityDays(data.quoteValidityDays);
          if (data.quoteNotes) setQuoteNotes(data.quoteNotes);
          if (data.quoteTerms) setQuoteTerms(data.quoteTerms);
          if (data.quoteAccentColor) setQuoteAccentColor(data.quoteAccentColor);
          if (data.quoteShowBankDetails !== undefined) setQuoteShowBankDetails(data.quoteShowBankDetails);
          if (data.quoteShowSignature !== undefined) setQuoteShowSignature(data.quoteShowSignature);
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
        quoteTitle: quoteTitle.trim(),
        quoteValidityDays: Number(quoteValidityDays),
        quoteNotes: quoteNotes.trim(),
        quoteTerms: quoteTerms.trim(),
        quoteAccentColor,
        quoteShowBankDetails,
        quoteShowSignature,
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
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Receipt, Invoice & Quotation Templates
            </h1>
            <Badge variant="new" size="sm">
              Live Studio
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl mt-1 leading-relaxed">
            Customize the exact brand identity, bank remittance instructions, customer email delivery, and print formats.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
              Upload your company or store logo. It is printed on receipts, commercial invoices, and customer email deliveries.
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
                Supported formats: PNG, JPG, WEBP, or SVG. Maximum file size: 5MB. Transparent PNG recommended.
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
                <span>Show on Receipts</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLogoOnInvoice}
                  onChange={(e) => setShowLogoOnInvoice(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Show on Invoices</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('receipt')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'receipt'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" /> Receipt & POS Template
        </button>

        <button
          onClick={() => setActiveTab('invoice')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'invoice'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" /> Commercial Invoice Template
        </button>

        <button
          onClick={() => setActiveTab('quote')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'quote'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-blue-400" /> Quotation / Estimate Template
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
                <p className="text-xs text-slate-500">Configure information printed on sales receipts and included in customer email deliveries.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Store / Business Name *</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Trantouch International"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Branch Subtitle</label>
                  <input
                    type="text"
                    value={storeBranch}
                    onChange={(e) => setStoreBranch(e.target.value)}
                    placeholder="e.g. Main Store Branch"
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
                    placeholder="e.g. 08028286644"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700">Support Email Address</label>
                  <input
                    type="email"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    placeholder="e.g. ucollins2@gmail.com"
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

          {activeTab === 'quote' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Quotation & Proforma Layout Settings
                </h2>
                <p className="text-xs text-slate-500">Customize the title, theme accents, validity duration, and standard terms printed on commercial proposals.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Document Title / Header *</label>
                  <input
                    type="text"
                    value={quoteTitle}
                    onChange={(e) => setQuoteTitle(e.target.value)}
                    placeholder="e.g. PRICE QUOTATION"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600 uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Default Price Validity (Days)</label>
                  <select
                    value={quoteValidityDays}
                    onChange={(e) => setQuoteValidityDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value={7}>7 Days (1 Week)</option>
                    <option value={14}>14 Days (2 Weeks - Standard)</option>
                    <option value={30}>30 Days (1 Month)</option>
                    <option value={60}>60 Days (2 Months)</option>
                  </select>
                </div>

                {/* Accent Color Picker */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-blue-600" /> Quotation Brand Accent Color
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    {[
                      { name: 'Royal Blue', hex: '#2563EB' },
                      { name: 'Indigo', hex: '#4F46E5' },
                      { name: 'Emerald', hex: '#059669' },
                      { name: 'Teal', hex: '#0D9488' },
                      { name: 'Purple', hex: '#7C3AED' },
                      { name: 'Amber', hex: '#D97706' },
                      { name: 'Slate Dark', hex: '#0F172A' },
                    ].map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setQuoteAccentColor(col.hex)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                          quoteAccentColor === col.hex
                            ? 'border-slate-900 ring-2 ring-slate-900/20 bg-slate-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: col.hex }} />
                        <span className="text-slate-800">{col.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-slate-700">Opening Greeting / Introductory Note</label>
                  <textarea
                    rows={2}
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-slate-700">Standard Quotation Terms & Conditions</label>
                  <textarea
                    rows={3}
                    value={quoteTerms}
                    onChange={(e) => setQuoteTerms(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quoteShowBankDetails}
                    onChange={(e) => setQuoteShowBankDetails(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>Show Bank Details on Quotation</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quoteShowSignature}
                    onChange={(e) => setQuoteShowSignature(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>Include Authorized Signature Line</span>
                </label>
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

          {/* ========================================================================= */}
          {/* RECEIPT TAB PREVIEWS                                                     */}
          {/* ========================================================================= */}
          {activeTab === 'receipt' && (
            <div className="space-y-3">
              {/* Receipt Preview Mode Switcher */}
              <div className="flex items-center justify-end gap-1.5 bg-slate-100 p-1 rounded-xl w-fit ml-auto">
                <button
                  type="button"
                  onClick={() => setReceiptPreviewMode('email')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
                    receiptPreviewMode === 'email'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Mail className="w-3 h-3" /> Customer Email UI
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptPreviewMode('thermal')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                    receiptPreviewMode === 'thermal'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  80mm POS Slip
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptPreviewMode('a4')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                    receiptPreviewMode === 'a4'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  A4 Receipt
                </button>
              </div>

              {receiptPreviewMode === 'email' ? (
                /* ================= EXACT CUSTOMER EMAIL DELIVERY PREVIEW ================= */
                <div className="rounded-2xl border border-slate-300 bg-slate-100 shadow-2xl overflow-hidden text-xs">
                  {/* Mail Client Envelope Header */}
                  <div className="bg-slate-900 text-white p-3.5 text-[11px] space-y-1.5 font-sans">
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-teal-400" /> Customer Email Delivery View
                      </span>
                      <span className="text-slate-300 font-mono">Today at 17:42</span>
                    </div>
                    <div className="text-slate-200">
                      <span className="text-slate-400">Subject: </span>
                      <strong className="text-white">[{storeName || 'Store Name'}] POS Sales Receipt #RCP-84920</strong>
                    </div>
                    <div className="flex justify-between text-slate-300 text-[10px]">
                      <div>
                        <span className="text-slate-400">From: </span>
                        <span>{storeName || 'Store'} &lt;{businessEmail || 'billing@store.ng'}&gt;</span>
                      </div>
                      <div>
                        <span className="text-slate-400">To: </span>
                        <span>Adeola Johnson &lt;adeola@example.com&gt;</span>
                      </div>
                    </div>
                  </div>

                  {/* Mail Body Container */}
                  <div className="p-4 sm:p-5 font-sans">
                    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4 text-slate-800 text-left">
                      {/* Store Header inside Email */}
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                        {logoUrl && showLogoOnReceipt ? (
                          <img
                            src={logoUrl}
                            alt="Store Logo"
                            className="h-9 max-w-[120px] object-contain"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                            {(storeName || 'NG').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="font-extrabold text-slate-950 text-sm leading-tight">
                            {storeName || 'Your Store Name'}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {storeBranch} • {storeAddress || 'Computer Village, Ikeja, Lagos'}
                          </p>
                        </div>
                      </div>

                      {/* Salutation & Intro */}
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900 text-xs">Hello Adeola Johnson,</p>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          Thank you for shopping with us! Please find attached your official sales receipt (<strong>#RCP-84920</strong>) and warranty documentation.
                        </p>
                      </div>

                      {/* Statement Overview Highlight Box */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1.5 font-medium">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Statement Number:</span>
                          <span className="font-mono font-bold text-slate-900">#RCP-84920</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Total Paid Amount:</span>
                          <span className="font-black text-emerald-700 text-xs">₦1,148,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Payment Status:</span>
                          <span className="font-bold text-emerald-600 uppercase">PAID (POS CARD)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Transaction Date:</span>
                          <span className="text-slate-800">23 Sep 2026</span>
                        </div>
                      </div>

                      {/* Purchased Items List */}
                      <div className="space-y-2 pt-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Items Summary:</p>
                        <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-200 space-y-2 text-[11px]">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-slate-900">Apple iPhone 15 Pro (256GB - Titanium)</p>
                              {showImei && (
                                <p className="text-[9px] text-teal-700 font-mono font-semibold">
                                  IMEI: 358291048291048
                                </p>
                              )}
                            </div>
                            <span className="font-bold text-slate-900 font-mono">₦1,099,000</span>
                          </div>
                          <div className="flex justify-between items-start pt-1.5 border-t border-slate-150">
                            <div>
                              <p className="font-bold text-slate-900">Oraimo 20,000mAh PowerBank (22.5W GaN)</p>
                              {showImei && (
                                <p className="text-[9px] text-slate-500 font-mono">
                                  SKU: PB-20K-84920
                                </p>
                              )}
                            </div>
                            <span className="font-bold text-slate-900 font-mono">₦49,000</span>
                          </div>
                        </div>
                      </div>

                      {/* Attached PDF Pill */}
                      <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-[10px]">
                            PDF
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-blue-950 truncate text-[11px]">Receipt-RCP-84920.pdf</p>
                            <p className="text-[10px] text-blue-600">Official Signed PDF Document • 142 KB</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-blue-700 hover:underline shrink-0 flex items-center gap-1 cursor-pointer">
                          <Download className="w-3.5 h-3.5" /> Download
                        </span>
                      </div>

                      {/* Policy & Warranty Note */}
                      <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 leading-relaxed font-medium">
                        {receiptFooter}
                      </div>

                      {/* Store Signature Footer */}
                      <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-500 space-y-0.5">
                        <p className="font-bold text-slate-800">{storeName || 'Your Store'}</p>
                        {storeAddress && <p>{storeAddress}</p>}
                        <p>
                          {storePhone && <span>Tel: {storePhone} </span>}
                          {businessEmail && <span>• Email: {businessEmail}</span>}
                        </p>
                        <p className="text-[9px] text-slate-400 pt-1">
                          Secured by NoxGuarda Electronics Ledger
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : receiptPreviewMode === 'thermal' ? (
                /* ================= 80mm POS Thermal Slip ================= */
                <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl p-6 max-w-sm mx-auto font-mono text-slate-900 text-xs relative overflow-hidden text-left">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-blue-500 to-indigo-500" />

                  <div className="text-center space-y-1.5 pb-4 border-b-2 border-dashed border-slate-300">
                    {logoUrl && showLogoOnReceipt ? (
                      <div className="mb-2 flex justify-center">
                        <img
                          src={logoUrl}
                          alt="Store Logo"
                          className="h-11 max-w-[140px] object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm mx-auto shadow-sm">
                        {(storeName || 'NG').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <h4 className="font-black text-base tracking-tight text-slate-950 uppercase font-sans">
                      {storeName || 'Your Store Name'}
                    </h4>
                    {storeBranch && (
                      <p className="text-[10px] font-bold text-teal-700 font-sans tracking-wide uppercase">
                        {storeBranch}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-600 leading-tight font-sans">
                      {storeAddress || 'Computer Village, Ikeja, Lagos'}
                    </p>
                    <div className="text-[10px] text-slate-500 font-sans flex flex-wrap justify-center gap-x-2">
                      {storePhone && <span>Tel: {storePhone}</span>}
                      {businessEmail && <span>• {businessEmail}</span>}
                    </div>
                  </div>

                  <div className="py-3 border-b border-slate-200 text-[11px] space-y-1 font-sans">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Receipt Ref:</span>
                      <span className="font-mono font-black text-slate-950 bg-slate-100 px-2 py-0.5 rounded">#RCP-84920</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Date & Time:</span>
                      <span className="font-bold text-slate-800">23 Sep 2026, 17:42</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Cashier / Sales Rep:</span>
                      <span className="font-bold text-slate-800">Attendant #02</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Customer:</span>
                      <span className="font-bold text-slate-800">Adeola Johnson</span>
                    </div>
                  </div>

                  <div className="py-3 border-b-2 border-dashed border-slate-300 space-y-2.5">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-2">
                        <p className="font-extrabold text-slate-950 text-xs font-sans">Apple iPhone 15 Pro</p>
                        <p className="text-[10px] text-slate-500 font-sans">256GB • Natural Titanium</p>
                        {showImei && (
                          <p className="text-[9px] font-mono text-teal-700 font-bold bg-teal-50 px-1.5 py-0.5 rounded w-fit mt-0.5">
                            IMEI: 358291048291048
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-950 font-sans">₦1,099,000</p>
                        <p className="text-[9px] text-slate-400">Qty: 1</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-start pt-1.5 border-t border-slate-100">
                      <div className="flex-1 pr-2">
                        <p className="font-extrabold text-slate-950 text-xs font-sans">Oraimo 20,000mAh PowerBank</p>
                        <p className="text-[10px] text-slate-500 font-sans">22.5W Fast Charge GaN</p>
                        {showImei && (
                          <p className="text-[9px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded w-fit mt-0.5">
                            SKU: PB-20K-84920
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-950 font-sans">₦49,000</p>
                        <p className="text-[9px] text-slate-400">Qty: 1</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-3 space-y-1.5 font-sans">
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Subtotal</span>
                      <span className="font-bold text-slate-900">₦1,148,000</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 text-white flex justify-between items-center mt-2">
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase font-black">Total Paid</p>
                        <p className="text-[10px] text-teal-400 font-bold">💳 POS / CARD TERMINAL</p>
                      </div>
                      <span className="text-base font-black tracking-tight text-white">₦1,148,000</span>
                    </div>
                  </div>

                  {showQrCode && (
                    <div className="pt-3 pb-2 text-center border-t border-dashed border-slate-300 space-y-1.5">
                      <div className="w-20 h-20 bg-white border-2 border-slate-900 p-1 rounded-xl mx-auto flex items-center justify-center shadow-xs">
                        <QrCode className="w-14 h-14 text-slate-950" />
                      </div>
                      <p className="text-[9px] font-bold text-slate-700 font-sans uppercase tracking-wider">
                        Scan for Digital Proof & Warranty
                      </p>
                    </div>
                  )}

                  <div className="pt-2 text-center text-[10px] text-slate-600 font-sans border-t border-slate-200 leading-relaxed font-medium">
                    {receiptFooter}
                  </div>

                  <div className="pt-4 text-center text-[8px] text-slate-400 font-mono tracking-widest select-none">
                    - - - - - - - - - - ✂ - - - - - - - - - -
                  </div>
                </div>
              ) : (
                /* ================= Standard A4 Full Retail Receipt ================= */
                <div className="p-5 sm:p-7 rounded-2xl bg-white border border-slate-300 shadow-2xl space-y-5 text-[11px] font-sans text-slate-800 max-w-xl mx-auto overflow-hidden text-left">
                  <div className="flex justify-between items-start gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="font-black text-base text-slate-950">{storeName || 'Your Store Name'}</h3>
                      <p className="text-slate-600">{storeBranch}</p>
                      <p className="text-slate-600">{storeAddress || 'Computer Village, Ikeja, Lagos'}</p>
                      <p className="text-slate-600">Tel: {storePhone || '+234 801 234 5678'} • Email: {businessEmail || 'support@store.ng'}</p>
                    </div>
                    {logoUrl && showLogoOnReceipt ? (
                      <div className="h-12 w-28 flex items-center justify-end">
                        <img src={logoUrl} alt="Logo" className="max-h-12 max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-xs">
                        {(storeName || 'ST').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Customer Information</p>
                      <p className="font-extrabold text-slate-900 text-xs mt-0.5">Adeola Johnson</p>
                      <p className="text-slate-600 text-[10px]">08028286644 • adeola@example.com</p>
                    </div>
                    <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200">
                      <p className="text-[10px] font-bold text-teal-800 uppercase">Official Sales Receipt</p>
                      <p className="font-mono font-black text-slate-900 text-xs mt-0.5">#RCP-84920</p>
                      <p className="text-teal-700 text-[10px] font-bold">Status: FULLY PAID (POS CARD)</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-slate-900 text-white font-bold">
                        <tr>
                          <th className="py-2 px-2.5">Item & IMEI / SKU</th>
                          <th className="py-2 px-2.5 text-center w-12">Qty</th>
                          <th className="py-2 px-2.5 text-right w-24">Price</th>
                          <th className="py-2 px-2.5 text-right w-24">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="py-2 px-2.5">
                            <p className="font-bold text-slate-900">Apple iPhone 15 Pro (256GB - Titanium)</p>
                            {showImei && <p className="text-[9px] text-teal-700 font-mono">IMEI: 358291048291048</p>}
                          </td>
                          <td className="py-2 px-2.5 text-center font-bold">1</td>
                          <td className="py-2 px-2.5 text-right font-mono">₦1,099,000</td>
                          <td className="py-2 px-2.5 text-right font-bold text-slate-900 font-mono">₦1,099,000</td>
                        </tr>
                        <tr className="bg-slate-50/50">
                          <td className="py-2 px-2.5">
                            <p className="font-bold text-slate-900">Oraimo 20,000mAh PowerBank (22.5W Fast Charge)</p>
                            {showImei && <p className="text-[9px] text-slate-500 font-mono">SKU: PB-20K-84920</p>}
                          </td>
                          <td className="py-2 px-2.5 text-center font-bold">1</td>
                          <td className="py-2 px-2.5 text-right font-mono">₦49,000</td>
                          <td className="py-2 px-2.5 text-right font-bold text-slate-900 font-mono">₦49,000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-1">
                    <div className="w-56 space-y-1 text-[11px]">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal</span>
                        <span className="font-mono text-slate-900">₦1,148,000</span>
                      </div>
                      <div className="border-t-2 border-slate-900 pt-1.5 flex justify-between text-slate-900 font-black text-xs">
                        <span>TOTAL PAID</span>
                        <span className="font-mono text-teal-700 text-sm">₦1,148,000</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 text-[10px] text-slate-500 border-t border-slate-200 text-center font-medium">
                    {receiptFooter}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* INVOICE TAB PREVIEWS                                                     */}
          {/* ========================================================================= */}
          {activeTab === 'invoice' && (
            <div className="space-y-3">
              <div className="flex items-center justify-end gap-1.5 bg-slate-100 p-1 rounded-xl w-fit ml-auto">
                <button
                  type="button"
                  onClick={() => setInvoicePreviewMode('email')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
                    invoicePreviewMode === 'email'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Mail className="w-3 h-3" /> Customer Email UI
                </button>
                <button
                  type="button"
                  onClick={() => setInvoicePreviewMode('a4')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                    invoicePreviewMode === 'a4'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  A4 PDF Statement
                </button>
              </div>

              {invoicePreviewMode === 'email' ? (
                /* Invoice Customer Email Preview */
                <div className="rounded-2xl border border-slate-300 bg-slate-100 shadow-2xl overflow-hidden text-xs text-left">
                  <div className="bg-slate-900 text-white p-3.5 text-[11px] space-y-1.5 font-sans">
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-blue-400" /> Customer Email Delivery View
                      </span>
                      <span className="text-slate-300 font-mono">2026-09-17</span>
                    </div>
                    <div className="text-slate-200">
                      <span className="text-slate-400">Subject: </span>
                      <strong className="text-white">[{companyName || 'Your Company'}] Commercial Invoice Statement #VF-INV-0013</strong>
                    </div>
                    <div className="flex justify-between text-slate-300 text-[10px]">
                      <div>
                        <span className="text-slate-400">From: </span>
                        <span>{companyName || 'Your Company'} &lt;{businessEmail || 'billing@store.ng'}&gt;</span>
                      </div>
                      <div>
                        <span className="text-slate-400">To: </span>
                        <span>Corporate Client Ltd &lt;procurement@client.example.ng&gt;</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 font-sans">
                    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4 text-slate-800">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900 text-xs">Hello Corporate Client Ltd,</p>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          Please find attached your official commercial invoice statement (<strong>#VF-INV-0013</strong>) from <strong>{companyName || 'Your Company'}</strong>.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1.5 font-medium">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Statement Number:</span>
                          <span className="font-mono font-bold text-slate-900">VF-INV-0013</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Total Due Amount:</span>
                          <span className="font-black text-blue-700 text-xs">₦3,130,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Due Date:</span>
                          <span className="font-bold text-slate-900">2026-10-02</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Payment Status:</span>
                          <span className="font-bold text-amber-600 uppercase">PENDING REMITTANCE</span>
                        </div>
                      </div>

                      {bankName && accountNumber && (
                        <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-[11px] space-y-1 text-emerald-950">
                          <p className="font-black text-emerald-900 uppercase text-[10px] tracking-wider">
                            Direct Bank Remittance Instructions:
                          </p>
                          <p><strong>Bank:</strong> {bankName}</p>
                          <p><strong>Account Number:</strong> <span className="font-mono font-bold">{accountNumber}</span></p>
                          <p><strong>Account Name:</strong> {accountName || companyName}</p>
                          <p className="text-[10px] text-emerald-700 font-bold pt-0.5">Payment Reference: VF-INV-0013</p>
                        </div>
                      )}

                      <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-[10px]">
                            PDF
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-blue-950 truncate text-[11px]">Invoice-VF-INV-0013.pdf</p>
                            <p className="text-[10px] text-blue-600">Commercial Invoice Document • 158 KB</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-blue-700 hover:underline shrink-0 flex items-center gap-1 cursor-pointer">
                          <Download className="w-3.5 h-3.5" /> Download
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 space-y-0.5">
                        <p className="font-bold text-slate-800">{companyName || 'Your Company'}</p>
                        {storeAddress && <p>{storeAddress}</p>}
                        <p>{storePhone && `Tel: ${storePhone}`} {businessEmail && `• Email: ${businessEmail}`}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* A4 PDF Statement View */
                <div className="p-5 sm:p-7 rounded-2xl bg-white border border-slate-300 shadow-2xl space-y-5 text-[11px] font-sans text-slate-800 max-w-xl mx-auto overflow-hidden text-left">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
                    <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1">
                      <p className="font-black text-blue-700 text-xs tracking-tight">Invoice To:</p>
                      <p className="font-extrabold text-slate-900 text-xs">Corporate Client Ltd, Adeola Johnson</p>
                      <p className="text-slate-600 text-[10px]">14 Marina Street, Victoria Island, Lagos</p>
                      <p className="text-slate-600 text-[10px] font-medium pt-0.5">
                        <strong>Email:</strong> procurement@client.example.ng
                      </p>
                    </div>

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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start pt-1">
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

                  <div className="pt-2 text-[10px] text-slate-600 space-y-1">
                    <p className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0" />
                      <strong>Payment Term:</strong> {invoiceTerms}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* QUOTE TAB PREVIEWS                                                       */}
          {/* ========================================================================= */}
          {activeTab === 'quote' && (
            <div className="space-y-3">
              <div className="flex items-center justify-end gap-1.5 bg-slate-100 p-1 rounded-xl w-fit ml-auto">
                <button
                  type="button"
                  onClick={() => setQuotePreviewMode('email')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
                    quotePreviewMode === 'email'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Mail className="w-3 h-3" /> Customer Email UI
                </button>
                <button
                  type="button"
                  onClick={() => setQuotePreviewMode('a4')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                    quotePreviewMode === 'a4'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  A4 Proposal PDF
                </button>
              </div>

              {quotePreviewMode === 'email' ? (
                /* Quote Customer Email Preview */
                <div className="rounded-2xl border border-slate-300 bg-slate-100 shadow-2xl overflow-hidden text-xs text-left">
                  <div className="bg-slate-900 text-white p-3.5 text-[11px] space-y-1.5 font-sans">
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-blue-400" /> Customer Email Delivery View
                      </span>
                      <span className="text-slate-300 font-mono">Today</span>
                    </div>
                    <div className="text-slate-200">
                      <span className="text-slate-400">Subject: </span>
                      <strong className="text-white">{quoteTitle} #QT-2026-0001 from {storeName || 'Store'}</strong>
                    </div>
                    <div className="flex justify-between text-slate-300 text-[10px]">
                      <div>
                        <span className="text-slate-400">From: </span>
                        <span>{storeName || 'Store'} &lt;{businessEmail || 'quotes@store.ng'}&gt;</span>
                      </div>
                      <div>
                        <span className="text-slate-400">To: </span>
                        <span>Prospective Client &lt;client@company.ng&gt;</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 font-sans">
                    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4 text-slate-800">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900 text-xs">Hello Valued Client,</p>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          Thank you for your inquiry. Please find attached your formal <strong>{quoteTitle} (#QT-2026-0001)</strong> from <strong>{storeName || 'Our Store'}</strong>.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1.5 font-medium">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Quotation Number:</span>
                          <span className="font-mono font-bold text-slate-900">QT-2026-0001</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Estimated Total:</span>
                          <span className="font-black text-xs" style={{ color: quoteAccentColor }}>₦4,790,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Validity Period:</span>
                          <span className="font-bold text-amber-600">{quoteValidityDays} Days (Valid until 07 Oct 2026)</span>
                        </div>
                      </div>

                      {quoteNotes && (
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-600 italic">
                          &ldquo;{quoteNotes}&rdquo;
                        </div>
                      )}

                      <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-[10px]">
                            PDF
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-blue-950 truncate text-[11px]">Quotation-QT-2026-0001.pdf</p>
                            <p className="text-[10px] text-blue-600">Commercial Proposal PDF • 148 KB</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-blue-700 hover:underline shrink-0 flex items-center gap-1 cursor-pointer">
                          <Download className="w-3.5 h-3.5" /> Download
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 space-y-0.5">
                        <p className="font-bold text-slate-800">{storeName || 'Your Store'}</p>
                        {storeAddress && <p>{storeAddress}</p>}
                        <p>{storePhone && `Tel: ${storePhone}`} {businessEmail && `• Email: ${businessEmail}`}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* A4 Proposal View */
                <div className="p-5 sm:p-7 rounded-2xl bg-white border border-slate-300 shadow-2xl space-y-5 text-[11px] font-sans text-slate-800 max-w-xl mx-auto overflow-hidden text-left">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-0.5">
                      <h3 className="font-black text-sm sm:text-base text-slate-950">{storeName || companyName || 'Your Store'}</h3>
                      <p className="text-slate-600">{storeAddress || 'Computer Village, Ikeja, Lagos'}</p>
                      <p className="text-slate-600">Tel: {storePhone || '+234 801 234 5678'} • Email: {businessEmail || 'quotes@store.ng'}</p>
                    </div>

                    <div className="text-right">
                      <div
                        className="inline-block px-3 py-1 rounded-lg text-white font-black text-xs tracking-wider"
                        style={{ backgroundColor: quoteAccentColor }}
                      >
                        {quoteTitle}
                      </div>
                      <p className="font-mono text-slate-500 text-[10px] mt-1 font-bold">QT-2026-0001</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
                    <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1">
                      <p className="font-black text-xs tracking-tight" style={{ color: quoteAccentColor }}>Quotation For:</p>
                      <p className="font-extrabold text-slate-900 text-xs">Prospective Client Enterprise</p>
                      <p className="text-slate-600 text-[10px]">Lekki Phase 1, Lagos</p>
                      <p className="text-slate-600 text-[10px] font-medium pt-0.5">
                        <strong>Contact:</strong> +234 809 999 8888 • client@company.ng
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                      <div className="text-white px-3 py-2 flex justify-between items-center font-extrabold text-xs" style={{ backgroundColor: quoteAccentColor }}>
                        <span>Estimate Summary</span>
                        <span className="font-mono tracking-wide text-[10px]">PENDING</span>
                      </div>
                      <div className="bg-white p-2 space-y-1 text-[10px]">
                        <div className="flex justify-between border-b border-slate-100 pb-1">
                          <span className="font-bold text-slate-600">Quote Date:</span>
                          <span className="font-mono text-slate-900">2026-09-23</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1">
                          <span className="font-bold text-slate-600">Validity Period:</span>
                          <span className="font-bold text-amber-600">{quoteValidityDays} Days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-600">Valid Until:</span>
                          <span className="font-mono text-slate-900">2026-10-07</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {quoteNotes && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-600 italic">
                      &ldquo;{quoteNotes}&rdquo;
                    </div>
                  )}

                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-[10px]">
                      <thead className="text-white font-black" style={{ backgroundColor: quoteAccentColor }}>
                        <tr>
                          <th className="py-2 px-2.5 w-8">#</th>
                          <th className="py-2 px-2.5">Item Description & Hardware Specs</th>
                          <th className="py-2 px-2.5 text-center w-14">Qty</th>
                          <th className="py-2 px-2.5 text-right w-24">Unit Price</th>
                          <th className="py-2 px-2.5 text-right w-24">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        <tr className="bg-white">
                          <td className="py-2 px-2.5 text-slate-400 font-bold">1</td>
                          <td className="py-2 px-2.5">
                            <p className="font-bold text-slate-900">Apple MacBook Pro 14&quot; M3 (18GB / 512GB Space Black)</p>
                            <p className="text-[9px] text-slate-500 leading-tight">Brand New Sealed • 1-Year Global Warranty</p>
                          </td>
                          <td className="py-2 px-2.5 text-center font-bold">2</td>
                          <td className="py-2 px-2.5 text-right font-mono">₦2,350,000</td>
                          <td className="py-2 px-2.5 text-right font-bold text-slate-900 font-mono">₦4,700,000</td>
                        </tr>
                        <tr className="bg-slate-50/70">
                          <td className="py-2 px-2.5 text-slate-400 font-bold">2</td>
                          <td className="py-2 px-2.5">
                            <p className="font-bold text-slate-900">USB-C Multiport Hub & Laptop Sleeve</p>
                          </td>
                          <td className="py-2 px-2.5 text-center font-bold">2</td>
                          <td className="py-2 px-2.5 text-right font-mono">₦45,000</td>
                          <td className="py-2 px-2.5 text-right font-bold text-slate-900 font-mono">₦90,000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start pt-1">
                    {quoteShowBankDetails && bankName && accountNumber ? (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[10px] space-y-1">
                        <p className="font-black text-slate-800 uppercase tracking-wide">
                          Remittance Details for Wire Transfer:
                        </p>
                        <p className="text-slate-900 font-bold">
                          Bank: <span className="font-normal">{bankName}</span>
                        </p>
                        <p className="text-slate-900 font-bold">
                          Account #: <span className="font-mono">{accountNumber}</span>
                        </p>
                        <p className="text-slate-900 font-bold">
                          Account Name: <span className="font-normal">{accountName || storeName}</span>
                        </p>
                      </div>
                    ) : (
                      <div />
                    )}

                    <div className="space-y-1 text-[11px] sm:ml-auto w-full sm:w-56">
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>SubTotal</span>
                        <span className="font-mono text-slate-900">₦4,790,000</span>
                      </div>
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>Discount</span>
                        <span className="font-mono text-slate-900">₦0.00</span>
                      </div>
                      <div className="p-2 rounded-xl text-white flex justify-between items-center font-black" style={{ backgroundColor: quoteAccentColor }}>
                        <span className="text-xs">ESTIMATED TOTAL</span>
                        <span className="font-mono text-sm">₦4,790,000</span>
                      </div>
                    </div>
                  </div>

                  {quoteTerms && (
                    <div className="pt-2 text-[10px] text-slate-600 space-y-1">
                      <p className="font-bold text-slate-800">Quotation Terms & Conditions:</p>
                      <p className="leading-relaxed">{quoteTerms}</p>
                    </div>
                  )}

                  {quoteShowSignature && (
                    <div className="pt-4 flex justify-end">
                      <div className="w-48 text-center border-t border-slate-300 pt-1 text-[9px] font-bold text-slate-600">
                        Authorized Representative Signature
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
