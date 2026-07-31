'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Receipt,
  Store,
  Palette,
  Check,
  Save,
  Printer,
  Sparkles,
  QrCode,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function ReceiptInvoiceTemplatesPage() {
  const [activeTab, setActiveTab] = useState<'receipt' | 'invoice'>('receipt');

  // Receipt Customization Settings
  const [storeName, setStoreName] = useState('VerifyFlow Retail POS');
  const [storeBranch, setStoreBranch] = useState('Store #402 - Main Branch');
  const [storeAddress, setStoreAddress] = useState('5th Ave, Manhattan, NY 10001');
  const [storePhone, setStorePhone] = useState('+1 (800) 555-0199');
  const [receiptFooter, setReceiptFooter] = useState('Thank you for shopping! 30-Day Store Warranty included. No refunds without receipt.');
  const [showQrCode, setShowQrCode] = useState(true);
  const [showImei, setShowImei] = useState(true);

  // Invoice Customization Settings
  const [companyName, setCompanyAddress] = useState('VerifyFlow Wireless Systems LLC');
  const [taxId, setTaxId] = useState('TAX-84920194-US');
  const [invoiceHeaderNote, setInvoiceHeaderNote] = useState('Official Commercial Invoice & Device Ownership Guarantee Statement.');
  const [bankWireInfo, setBankWireInfo] = useState('Bank of America • Account: 4892-0192-8401 • ABA: 026009593');
  const [invoiceTerms, setInvoiceTerms] = useState('Payment is due within the selected term days. Late payments subject to a 1.5% monthly fee.');

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
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
            Customize your store branding, return policies, tax IDs, and warranty disclaimers printed on receipts and invoices.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            leftIcon={isSaved ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-500 font-bold shadow-md shadow-blue-600/20"
          >
            {isSaved ? 'Templates Saved!' : 'Save Template Settings'}
          </Button>
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

                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
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
                  <Building className="w-4 h-4 text-blue-600" /> Commercial Invoice Company Details
                </h2>
                <p className="text-xs text-slate-500">Configure legal information printed on formal invoice PDFs.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Legal Company Name *</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyAddress(e.target.value)}
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

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Invoice Header Statement</label>
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
                <label className="text-xs font-bold text-slate-700">Payment Terms & Legal Notes</label>
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
                <div className="text-center space-y-0.5 border-b border-slate-200 pb-3">
                  <p className="font-extrabold text-sm text-slate-900">{storeName || 'Store Name'}</p>
                  <p className="text-[10px] text-slate-500 font-sans">{storeBranch}</p>
                  <p className="text-[10px] text-slate-500 font-sans">{storeAddress}</p>
                  <p className="text-[10px] text-slate-500 font-sans">Tel: {storePhone}</p>
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                  <span>Receipt: <strong>#RCP-84920</strong></span>
                  <span>Jul 31, 2026</span>
                </div>

                <div className="border-y border-slate-200 py-2 space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <div>
                      <p className="font-bold text-slate-900">iPhone 15 Pro (256GB)</p>
                      {showImei && <p className="text-[9px] text-slate-500">IMEI: 358291048291048</p>}
                    </div>
                    <span className="font-bold text-slate-900">$1,099.00</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <div>
                      <p className="font-bold text-slate-900">MagSafe Case Navy</p>
                    </div>
                    <span className="font-bold text-slate-900">$49.00</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span>$1,148.00</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-xs border-t border-slate-200 pt-1 text-slate-900">
                    <span>TOTAL PAID</span>
                    <span className="text-blue-600">$1,239.84</span>
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
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-4 text-xs font-sans text-slate-800">
              <div className="border-b border-slate-200 pb-3 flex justify-between items-start">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">{companyName}</h4>
                  <p className="text-[10px] text-slate-500">Tax ID: {taxId}</p>
                </div>
                <Badge variant="verified" size="sm">COMMERCIAL INVOICE</Badge>
              </div>

              <p className="text-[11px] text-slate-600 font-medium italic">{invoiceHeaderNote}</p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                <p className="font-bold text-slate-900">Bank Wire Transfer Instructions:</p>
                <p className="text-slate-600 font-mono text-[10px]">{bankWireInfo}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                <p className="font-bold text-slate-900">Payment & Warranty Terms:</p>
                <p className="text-slate-600 text-[10px]">{invoiceTerms}</p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
