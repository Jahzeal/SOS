'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  Smartphone,
  BatteryCharging,
  Headphones,
  Laptop,
  Package,
  Search,
  Upload,
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Info,
  Command,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  Edit3,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { ImeiCameraScanner } from '@/components/scanner/ImeiCameraScanner';

type ItemCategory = 'PHONE' | 'POWER_BANK' | 'AUDIO' | 'COMPUTING' | 'ACCESSORY';

interface CategoryConfig {
  id: ItemCategory;
  name: string;
  icon: React.ReactNode;
  badge: string;
  description: string;
  requiresImei: boolean;
  brandList: string[];
  specsLabel: string;
  specsPresets: string[];
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'PHONE',
    name: 'Phone / Smartphone',
    icon: <Smartphone className="w-4 h-4" />,
    badge: 'Mobile Devices',
    description: 'Smartphones, feature phones, and cellular tablets',
    requiresImei: true,
    brandList: [
      'Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Huawei',
      'Oppo', 'Vivo', 'Realme', 'Tecno', 'Infinix', 'Itel',
      'Nokia', 'Motorola', 'Sony', 'Honor',
    ],
    specsLabel: 'Internal Storage',
    specsPresets: ['32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB'],
  },
  {
    id: 'POWER_BANK',
    name: 'Power Bank / Battery',
    icon: <BatteryCharging className="w-4 h-4" />,
    badge: 'Charging & Power',
    description: 'Portable power banks, magsafe packs, fast chargers',
    requiresImei: false,
    brandList: [
      'Oraimo', 'Anker', 'Romoss', 'New-Age', 'Baseus', 'Xiaomi',
      'Itel', 'Joyroom', 'Remax', 'UGREEN', 'Apple', 'Samsung',
    ],
    specsLabel: 'Battery Capacity / Wattage',
    specsPresets: [
      '5,000 mAh', '10,000 mAh', '20,000 mAh', '27,000 mAh',
      '30,000 mAh', '40,000 mAh', '50,000 mAh', '20W MagSafe', '65W Fast Charge GaN'
    ],
  },
  {
    id: 'AUDIO',
    name: 'Earphones / Audio',
    icon: <Headphones className="w-4 h-4" />,
    badge: 'Audio & Wearables',
    description: 'AirPods, TWS earbuds, over-ear headphones, speakers',
    requiresImei: false,
    brandList: [
      'Apple', 'Oraimo', 'JBL', 'Sony', 'Soundcore', 'Samsung',
      'Beats', 'Bose', 'Zealot', 'Xiaomi', 'Lenovo', 'Havit',
    ],
    specsLabel: 'Audio Type / Format',
    specsPresets: [
      'TWS Wireless Earbuds (ANC)', 'TWS Wireless Earbuds', 'Over-Ear Headphones',
      'Sports Wireless Neckband', 'Wired Earphones (3.5mm)', 'Wired Earphones (Type-C / Lightning)',
      'Portable Bluetooth Speaker'
    ],
  },
  {
    id: 'COMPUTING',
    name: 'Laptop / Tablet / Watch',
    icon: <Laptop className="w-4 h-4" />,
    badge: 'Computers & Tablets',
    description: 'Laptops, MacBooks, iPads, Smartwatches, and Monitors',
    requiresImei: false,
    brandList: [
      'Apple', 'HP', 'Dell', 'Lenovo', 'Asus', 'Acer',
      'Samsung', 'Microsoft', 'Huawei', 'Toshiba',
    ],
    specsLabel: 'Storage & Memory Configuration',
    specsPresets: [
      '128 GB SSD / 8GB RAM', '256 GB SSD / 8GB RAM', '512 GB SSD / 16GB RAM',
      '1 TB SSD / 16GB RAM', '1 TB SSD / 32GB RAM', '64 GB WiFi', '128 GB WiFi + Cellular',
      '40mm / 44mm GPS'
    ],
  },
  {
    id: 'ACCESSORY',
    name: 'General Accessory / Gadget',
    icon: <Package className="w-4 h-4" />,
    badge: 'Peripherals & Accessories',
    description: 'Cables, screen guards, cases, adapters, car mounts',
    requiresImei: false,
    brandList: [
      'Oraimo', 'Anker', 'Baseus', 'UGREEN', 'Apple', 'Samsung',
      'Joyroom', 'LDNIO', 'Generic / OEM',
    ],
    specsLabel: 'Item Type / Specification',
    specsPresets: [
      'Fast Charging Cable (Type-C to Type-C)', 'Fast Charging Cable (Type-C to Lightning)',
      'USB-A to Type-C / Lightning Cable', '20W Fast Wall Adapter', '65W GaN Multi-Port Charger',
      '9D Tempered Screen Protector', 'Shockproof Silicone / Clear Case', 'MagSafe Car Mount / Charger'
    ],
  },
];

export default function RegisterPhonePage() {
  const router = useRouter();

  // Active Category
  const [category, setCategory] = useState<ItemCategory>('PHONE');

  // Page Step State: 1 = Identify, 2 = Details, 3 = Summary
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Data
  const [imei, setImei] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [storage, setStorage] = useState('128 GB');
  const [customStorage, setCustomStorage] = useState('');
  const [condition, setCondition] = useState<'New' | 'Used' | 'Refurb'>('New');
  const [carrierStatus, setCarrierStatus] = useState<'UNLOCKED' | 'CARRIER_LOCKED'>('UNLOCKED');
  const [lockedCarrier, setLockedCarrier] = useState('');
  const [activationStatus, setActivationStatus] = useState<'READY_FOR_SETUP' | 'ACTIVATED' | 'NOT_ACTIVATED'>('READY_FOR_SETUP');
  const [warrantyMonths, setWarrantyMonths] = useState<number>(12);
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // UI States
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateDetails, setDuplicateDetails] = useState<any>(null);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredItem, setRegisteredItem] = useState<any>(null);
  const [brandOpen, setBrandOpen] = useState(false);

  const activeCategoryConfig = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];

  // Update default specs when category changes
  useEffect(() => {
    if (activeCategoryConfig.specsPresets.length > 0) {
      setStorage(activeCategoryConfig.specsPresets[0]);
    }
    setCustomStorage('');
  }, [category]);

  const filteredBrands = activeCategoryConfig.brandList.filter((b) =>
    b.toLowerCase().includes(brand.toLowerCase())
  );

  const generateSku = () => {
    const prefixMap: Record<ItemCategory, string> = {
      PHONE: 'PH',
      POWER_BANK: 'PB',
      AUDIO: 'EAR',
      COMPUTING: 'PC',
      ACCESSORY: 'ACC',
    };
    const prefix = prefixMap[category] || 'SKU';
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const sku = `${prefix}-${randomCode}`;
    setSerialNumber(sku);
    if (!imei && category !== 'PHONE') {
      setImei(sku);
    }
  };

  const handleNextToStep2 = async () => {
    setErrorMessage(null);
    if (activeCategoryConfig.requiresImei && !imei.trim()) {
      setErrorMessage('Please enter or scan a valid 15-digit IMEI for phones.');
      return;
    }

    if (imei.trim()) {
      try {
        const checkResult = await api.checkImei(imei.trim());
        if (checkResult.exists) {
          setShowDuplicateWarning(true);
          setDuplicateDetails(checkResult.record);
          return;
        }
      } catch (err: any) {
        console.warn('Backend check skipped/offline:', err);
      }
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextToStep3 = () => {
    setErrorMessage(null);
    if (!brand.trim()) {
      setErrorMessage('Please specify the brand.');
      return;
    }
    if (!model.trim()) {
      setErrorMessage('Please specify the model name or item description.');
      return;
    }
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCompleteRegistration = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const conditionMap: Record<string, 'NEW' | 'EXCELLENT' | 'REFURBISHED'> = {
      New: 'NEW',
      Used: 'EXCELLENT',
      Refurb: 'REFURBISHED',
    };

    const finalStorage = customStorage.trim() || storage;

    try {
      const registered = await api.registerPhone({
        imei1: imei.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        brand: brand.trim(),
        model: model.trim(),
        storageCapacity: finalStorage,
        condition: conditionMap[condition] || 'NEW',
        carrierStatus: category === 'PHONE' ? (carrierStatus as any) : 'UNLOCKED',
        lockedCarrier: category === 'PHONE' && carrierStatus === 'CARRIER_LOCKED' ? lockedCarrier.trim() : undefined,
        activationStatus: category === 'PHONE' ? (activationStatus as any) : 'READY_FOR_SETUP',
        warrantyDurationMonths: warrantyMonths,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : undefined,
      });

      setRegisteredItem({
        id: registered.id,
        imei: registered.imei1 || registered.serialNumber || 'N/A',
        model: registered.model,
        brand: registered.brand,
        categoryName: activeCategoryConfig.name,
        storage: registered.storageCapacity || finalStorage,
        condition: registered.condition || condition,
        sellingPrice: registered.sellingPrice || sellingPrice,
        qrCodeUrl: registered.qrCodeUrl,
        date: new Date(registered.createdAt || Date.now()).toISOString().split('T')[0],
      });
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Registration failed:', err);
      setErrorMessage(err.message || 'Failed to register item. Please check inputs and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8">
      
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Register Phone or Item
            </h1>
            <Badge variant="new" size="sm" className="hidden sm:inline-flex">
              Multi-Category Stock
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl mt-1 leading-relaxed">
            Catalog phones, power banks, audio gadgets, laptops, and accessories into inventory with instant barcode & QR traceability.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" leftIcon={<Upload className="w-4 h-4 text-slate-600" />}>
            Bulk Registration
          </Button>
        </div>
      </div>

      {/* Category Switcher Tabs */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategory(cat.id);
                  setBrand('');
                  setModel('');
                  setErrorMessage(null);
                }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-extrabold ring-1 ring-teal-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-teal-50 text-teal-700' : 'bg-slate-200/70 text-slate-500'
                }`}>
                  {cat.icon}
                </div>
                <span className="truncate text-left">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stepper Navigation Indicator Bar */}
      <div className="flex items-center justify-start sm:justify-between border-b border-slate-200 pb-3 gap-2">
        <div className="flex items-center gap-1 sm:gap-4 overflow-x-auto pb-1 scrollbar-none justify-start">
          {/* Step 1 Indicator */}
          <button
            onClick={() => setStep(1)}
            className={`flex items-center gap-1 sm:gap-1.5 text-xs font-extrabold transition shrink-0 ${
              step === 1 ? 'text-teal-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center text-[10px] sm:text-xs shrink-0 ${
              step === 1 ? 'border-teal-600 bg-teal-50 text-teal-700 shadow-sm' : 'border-slate-300 bg-white text-slate-500'
            }`}>
              1
            </span>
            <span className="text-[9px] sm:text-xs font-bold whitespace-nowrap">1. Identification</span>
          </button>

          <div className="w-2 sm:w-12 h-px bg-slate-200 shrink-0" />

          {/* Step 2 Indicator */}
          <button
            onClick={() => setStep(2)}
            className={`flex items-center gap-1 sm:gap-1.5 text-xs font-extrabold transition shrink-0 ${
              step === 2 ? 'text-teal-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center text-[10px] sm:text-xs shrink-0 ${
              step === 2 ? 'border-teal-600 bg-teal-50 text-teal-700 shadow-sm' : 'border-slate-300 bg-white text-slate-500'
            }`}>
              2
            </span>
            <span className="text-[9px] sm:text-xs font-bold whitespace-nowrap">2. Specs & Pricing</span>
          </button>

          <div className="w-2 sm:w-12 h-px bg-slate-200 shrink-0" />

          {/* Step 3 Indicator */}
          <button
            onClick={() => setStep(3)}
            className={`flex items-center gap-1 sm:gap-1.5 text-xs font-extrabold transition shrink-0 ${
              step === 3 ? 'text-teal-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center text-[10px] sm:text-xs shrink-0 ${
              step === 3 ? 'border-teal-600 bg-teal-50 text-teal-700 shadow-sm' : 'border-slate-300 bg-white text-slate-500'
            }`}>
              3
            </span>
            <span className="text-[9px] sm:text-xs font-bold whitespace-nowrap">3. Review & Save</span>
          </button>
        </div>

        {step > 1 && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-[10px] sm:text-xs font-extrabold text-slate-600 hover:text-slate-900 transition shrink-0 ml-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Back to Step {step - 1}</span><span className="inline sm:hidden">Back</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main 12-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT 8 COLUMNS: FOCUSED STEP PAGE VIEWS                                   */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-6">

          {/* PAGE VIEW 1 — STEP 1: IDENTIFY ITEM */}
          {step === 1 && (
            <section className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center font-bold shadow-sm shrink-0">
                    {activeCategoryConfig.icon}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-xl font-extrabold text-slate-900 leading-tight">
                      Step 1: Identify {activeCategoryConfig.name}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                      {activeCategoryConfig.requiresImei
                        ? 'Scan phone box barcode or enter 15-digit IMEI'
                        : 'Scan box barcode, enter serial number, or auto-generate a stock SKU'}
                    </p>
                  </div>
                </div>
                <Badge variant="new" size="sm">
                  {activeCategoryConfig.badge}
                </Badge>
              </div>

              {/* Duplicate Warning Alert */}
              {showDuplicateWarning && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/90 flex gap-4 text-xs">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-extrabold text-rose-950 text-sm">Potential Duplicate Detected</p>
                      <button onClick={() => setShowDuplicateWarning(false)} className="text-rose-500 hover:text-rose-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-rose-800 font-medium mt-1">
                      Identifier: <strong>{imei}</strong> is already registered: <strong>{duplicateDetails?.brand} {duplicateDetails?.model}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Camera Scanner Trigger Box */}
              <div
                onClick={() => setShowCameraScanner(true)}
                className="p-4 sm:p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-all cursor-pointer flex flex-row items-center justify-center gap-4 sm:gap-6 group"
              >
                <div className="w-10 h-10 sm:w-16 sm:h-16 bg-white rounded-xl shadow-md border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <QrCode className="w-5 h-5 sm:w-8 sm:h-8 text-teal-600" />
                </div>
                <div className="text-left">
                  <p className="font-extrabold text-sm sm:text-base text-teal-700">Scan Product Barcode / QR</p>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 leading-tight">
                    Use device camera or physical handheld barcode scanner
                  </p>
                </div>
              </div>

              {/* Inputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {activeCategoryConfig.requiresImei ? 'IMEI Number *' : 'IMEI / Unique Barcode (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={imei}
                    onChange={(e) => setImei(e.target.value)}
                    placeholder={activeCategoryConfig.requiresImei ? "Enter 15-digit IMEI" : "e.g. 693420849102"}
                    className="w-full text-sm px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 font-mono font-semibold text-slate-900 shadow-subtle"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Serial Number / SKU
                    </label>
                    <button
                      type="button"
                      onClick={generateSku}
                      className="text-[11px] text-teal-600 hover:text-teal-800 font-bold flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Auto-Generate SKU
                    </button>
                  </div>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="Enter S/N or click Auto-Generate"
                    className="w-full text-sm px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 font-mono font-semibold text-slate-900 shadow-subtle"
                  />
                </div>
              </div>

              {!activeCategoryConfig.requiresImei && !imei && !serialNumber && (
                <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-teal-800 font-medium">
                    <Info className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>No barcode on box? Generate a unique SKU code with 1 click.</span>
                  </div>
                  <button
                    type="button"
                    onClick={generateSku}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shrink-0 text-xs shadow-xs"
                  >
                    Generate SKU
                  </button>
                </div>
              )}

              {/* Step 1 Action Bar */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleNextToStep2}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="shadow-md bg-teal-600 hover:bg-teal-500 border-none font-bold w-full sm:w-auto"
                >
                  <span>Proceed to Step 2: Specifications & Pricing</span>
                </Button>
              </div>
            </section>
          )}

          {/* PAGE VIEW 2 — STEP 2: ITEM SPECIFICATIONS & PRICING */}
          {step === 2 && (
            <section className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 gap-2">
                <div className="flex items-center gap-2.5 sm:gap-3 justify-start text-left">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center font-bold shadow-sm shrink-0">
                    {activeCategoryConfig.icon}
                  </div>
                  <div className="text-left">
                    <h2 className="text-base sm:text-xl font-extrabold text-slate-900 leading-tight">
                      Step 2: {activeCategoryConfig.name} Details
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                      Configure brand, model, hardware specifications, and inventory pricing
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-[11px] sm:text-xs font-extrabold text-teal-600 hover:underline flex items-center gap-1 shrink-0 ml-auto"
                >
                  <Edit3 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Edit Step 1</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Brand Combobox */}
                <div className="space-y-1.5 relative">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">Brand *</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => { setBrand(e.target.value); setBrandOpen(true); }}
                    onFocus={() => setBrandOpen(true)}
                    onBlur={() => setTimeout(() => setBrandOpen(false), 200)}
                    placeholder={`e.g. ${activeCategoryConfig.brandList.slice(0, 3).join(', ')}…`}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:border-teal-600"
                  />
                  {brandOpen && filteredBrands.length > 0 && (
                    <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto text-xs">
                      {filteredBrands.map((b) => (
                        <li
                          key={b}
                          onMouseDown={() => { setBrand(b); setBrandOpen(false); }}
                          className="px-4 py-2.5 font-bold text-slate-800 hover:bg-teal-50 hover:text-teal-700 cursor-pointer transition"
                        >
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Model Input */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">
                    Model Name / Item Title *
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={
                      category === 'PHONE'
                        ? 'e.g. iPhone 15 Pro Max, Galaxy S24 Ultra'
                        : category === 'POWER_BANK'
                        ? 'e.g. Toast 10 Byte 20000mAh, 65W PowerBank'
                        : category === 'AUDIO'
                        ? 'e.g. FreePods 4 ANC, AirPods Pro 2, WH-1000XM5'
                        : category === 'COMPUTING'
                        ? 'e.g. MacBook Air M2 13", ThinkPad X1 Carbon'
                        : 'e.g. 20W USB-C Fast Charger, Type-C Braided Cable'
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:border-teal-600"
                  />
                </div>

                {/* Specs / Storage / Capacity Selector */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">
                    {activeCategoryConfig.specsLabel}
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {activeCategoryConfig.specsPresets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setStorage(preset);
                          setCustomStorage('');
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                          storage === preset && !customStorage
                            ? 'bg-teal-50 text-teal-700 border-2 border-teal-600 shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={customStorage}
                    onChange={(e) => {
                      setCustomStorage(e.target.value);
                      if (e.target.value) setStorage(e.target.value);
                    }}
                    placeholder="Or enter custom capacity / specification (e.g. 256GB / 12GB RAM, 45W GaN, etc.)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 text-xs"
                  />
                </div>

                {/* Condition Selector */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">Condition</label>
                  <div className="flex gap-2">
                    {(['New', 'Used', 'Refurb'] as const).map((cond) => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => setCondition(cond)}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition ${
                          condition === cond
                            ? 'bg-teal-50 text-teal-700 border-2 border-teal-600 shadow-sm'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {cond === 'New' ? 'Brand New' : cond === 'Used' ? 'Pre-Owned' : 'Refurbished'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Warranty Duration */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">Warranty Guarantee</label>
                  <select
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:border-teal-600"
                  >
                    <option value={0}>No Warranty</option>
                    <option value={1}>1 Month Warranty</option>
                    <option value={3}>3 Months Warranty</option>
                    <option value={6}>6 Months Warranty</option>
                    <option value={12}>12 Months (1 Year Standard)</option>
                    <option value={24}>24 Months (2 Years Extended)</option>
                  </select>
                </div>

                {/* Phone-Specific Fields */}
                {category === 'PHONE' && (
                  <>
                    {/* Carrier Compatibility */}
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-700 uppercase tracking-wider">Carrier Lock Status</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setCarrierStatus('UNLOCKED')}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                            carrierStatus === 'UNLOCKED'
                              ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Factory Unlocked
                        </button>
                        <button
                          type="button"
                          onClick={() => setCarrierStatus('CARRIER_LOCKED')}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                            carrierStatus === 'CARRIER_LOCKED'
                              ? 'bg-amber-50 text-amber-800 border-2 border-amber-600 shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Carrier Locked
                        </button>
                      </div>
                      {carrierStatus === 'CARRIER_LOCKED' && (
                        <input
                          type="text"
                          value={lockedCarrier}
                          onChange={(e) => setLockedCarrier(e.target.value)}
                          placeholder="e.g. AT&T, Verizon, T-Mobile"
                          className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50/50 font-bold text-slate-900 focus:outline-none text-xs"
                        />
                      )}
                    </div>

                    {/* Activation Status */}
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-700 uppercase tracking-wider">Cloud / FRP Activation</label>
                      <select
                        value={activationStatus}
                        onChange={(e) => setActivationStatus(e.target.value as any)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:border-teal-600"
                      >
                        <option value="READY_FOR_SETUP">Ready for Setup (iCloud/Google FRP Removed)</option>
                        <option value="ACTIVATED">Activated (Account Linked / In-Use)</option>
                        <option value="NOT_ACTIVATED">Not Activated (Brand New Sealed)</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Pricing Inputs: Purchase & Selling Price */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">Purchase Cost Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">Retail Selling Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:border-teal-600"
                  />
                </div>

                {/* Optional Notes */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">Inventory Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add details about packaging, cable color, battery health, or accessories included..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:border-teal-600 resize-none"
                  />
                </div>
              </div>

              {/* Step 2 Action Bar */}
              <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100 flex-col-reverse sm:flex-row">
                <Button variant="secondary" size="sm" onClick={handleBack} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />} className="text-xs font-bold w-full sm:w-auto">
                  Back to Step 1
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleNextToStep3}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="shadow-md bg-teal-600 hover:bg-teal-500 border-none font-bold text-xs w-full sm:w-auto py-2"
                >
                  <span>Proceed to Step 3: Review & Summary</span>
                </Button>
              </div>
            </section>
          )}

          {/* PAGE VIEW 3 — STEP 3: REGISTRATION SUMMARY */}
          {step === 3 && (
            <section className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 justify-start text-left min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold shadow-sm shrink-0">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="text-left min-w-0">
                    <h2 className="text-sm sm:text-xl font-extrabold text-slate-900 leading-tight truncate">
                      Step 3: Registration Summary
                    </h2>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
                      Review {activeCategoryConfig.name.toLowerCase()} metadata before committing to inventory
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  <button onClick={() => setStep(1)} className="text-xs font-bold text-slate-500 hover:text-slate-900">Step 1</button>
                  <span className="text-slate-300">•</span>
                  <button onClick={() => setStep(2)} className="text-xs font-bold text-slate-500 hover:text-slate-900">Step 2</button>
                </div>
              </div>

              {/* Summary Card Grid */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[10px]">Category</span>
                    <span className="font-extrabold text-teal-700 text-sm flex items-center gap-1.5 mt-0.5">
                      {activeCategoryConfig.icon} {activeCategoryConfig.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[10px]">Brand & Model</span>
                    <span className="font-extrabold text-slate-900 text-sm mt-0.5 block truncate">{brand} {model}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[10px]">Identifier / IMEI</span>
                    <span className="font-mono font-bold text-teal-700 text-sm mt-0.5 block truncate">
                      {imei || serialNumber || 'Auto SKU Assigned'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[10px]">Specifications</span>
                    <span className="font-bold text-slate-900 mt-0.5 block truncate">
                      {customStorage || storage} • {condition}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200">
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[10px]">Cost Price</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                      {purchasePrice ? `$${parseFloat(purchasePrice).toLocaleString()}` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[10px]">Selling Price</span>
                    <span className="font-extrabold text-emerald-700 text-sm mt-0.5 block">
                      {sellingPrice ? `$${parseFloat(sellingPrice).toLocaleString()}` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[10px]">Warranty</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                      {warrantyMonths > 0 ? `${warrantyMonths} Months Active` : 'No Warranty'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3 Action Bar */}
              <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100 flex-col-reverse sm:flex-row">
                <Button variant="secondary" size="sm" onClick={handleBack} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />} className="text-xs font-bold w-full sm:w-auto">
                  Back to Step 2
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  onClick={handleCompleteRegistration}
                  leftIcon={<Check className="w-4 h-4" />}
                  className="shadow-md bg-emerald-600 hover:bg-emerald-500 border-none font-bold text-xs w-full sm:w-auto py-2"
                >
                  <span>Complete Registration & Add to Inventory</span>
                </Button>
              </div>
            </section>
          )}

        </div>

        {/* ========================================================================= */}
        {/* RIGHT 4 COLUMNS: SUMMARY STICKY SIDEBAR & GUIDANCE                        */}
        {/* ========================================================================= */}
        <aside className="lg:col-span-4 space-y-5">
          
          {/* DURING STEP 3: SHOW SUMMARY CARD */}
          {step === 3 ? (
            <section className="p-6 rounded-2xl bg-white border border-teal-600 ring-2 ring-teal-500/10 shadow-sm space-y-5 sticky top-20 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-teal-600/20">
                  3
                </span>
                <h2 className="text-lg font-extrabold text-slate-900">Registration Summary</h2>
              </div>

              <div className="space-y-3 text-xs border-b border-slate-100 pb-4 font-medium">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Category</span>
                  <span className="font-bold text-teal-700">{activeCategoryConfig.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Identifier/SKU</span>
                  <span className="font-mono font-bold text-slate-900">{imei || serialNumber || 'Auto SKU'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Brand</span>
                  <span className="font-bold text-slate-900">{brand}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Model</span>
                  <span className="font-bold text-slate-900">{model}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Specifications</span>
                  <span className="font-bold text-slate-900">{customStorage || storage}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Condition</span>
                  <span className="font-extrabold text-emerald-700">{condition}</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  isLoading={isSubmitting}
                  onClick={handleCompleteRegistration}
                  className="shadow-md font-bold bg-emerald-600 hover:bg-emerald-500 border-none"
                >
                  Complete Registration
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  size="md"
                  onClick={() => {
                    setImei('');
                    setSerialNumber('');
                    setStep(1);
                  }}
                >
                  Cancel & Clear Form
                </Button>
              </div>
            </section>
          ) : (
            /* DURING STEP 1 & 2: SHOW GUIDANCE & TIPS PANEL */
            <div className="space-y-5 sticky top-20 animate-in fade-in duration-200">
              {/* Category-Specific Guidance */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
                  <HelpCircle className="w-4 h-4 text-teal-600" />
                  <span>{activeCategoryConfig.name} Registration Tips</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                  {category === 'PHONE' ? (
                    <>
                      <li className="flex gap-2">
                        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span>Ensure 15-digit IMEI is captured for warranty & blacklist verification.</span>
                      </li>
                      <li className="flex gap-2">
                        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span>Dial *#06# on the device or scan the retail box sticker barcode.</span>
                      </li>
                    </>
                  ) : category === 'POWER_BANK' ? (
                    <>
                      <li className="flex gap-2">
                        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span>Scan the retail box barcode (EAN-13/UPC) or click Auto-Generate SKU.</span>
                      </li>
                      <li className="flex gap-2">
                        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span>Specify rated capacity (e.g. 20,000 mAh) and fast-charge output wattage.</span>
                      </li>
                    </>
                  ) : category === 'AUDIO' ? (
                    <>
                      <li className="flex gap-2">
                        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span>For AirPods / TWS, check serial number inside charging case lid or box.</span>
                      </li>
                      <li className="flex gap-2">
                        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span>Select audio format (TWS ANC, wireless neckband, or over-ear).</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex gap-2">
                        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span>Scan product barcode or click Auto-Generate SKU for instant inventory code.</span>
                      </li>
                      <li className="flex gap-2">
                        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span>Set accurate purchase and retail pricing for instant POS sale & quotes.</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Supported Multi-Category Stock Info */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-900 to-slate-900 text-white shadow-md space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-teal-400" />
                  <h4 className="font-extrabold text-xs tracking-wider uppercase text-teal-300">Unified POS & Quotes</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  All registered items can be immediately added to Quotations & Estimates, sold via POS Terminal, and tracked with QR codes.
                </p>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
                <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                  <Command className="w-4 h-4 text-teal-600" /> Quick Actions
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span>Scan Barcode</span>
                    <kbd className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md font-mono text-[10px] font-bold text-slate-800 shadow-subtle">Camera</kbd>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span>Generate SKU</span>
                    <kbd className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md font-mono text-[10px] font-bold text-slate-800 shadow-subtle">1-Click</kbd>
                  </div>
                </div>
              </div>
            </div>
          )}

        </aside>
      </div>

      {/* Success Modal Overlay */}
      {showSuccessModal && registeredItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 animate-in fade-in zoom-in duration-200 border border-slate-200">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Item Registered!</h3>
              <p className="text-xs text-slate-600 font-medium mt-1">
                <strong>{registeredItem.brand} {registeredItem.model}</strong> ({registeredItem.imei}) has been added to your inventory catalog.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <Link href="/dashboard/records">
                <Button variant="primary" fullWidth size="lg" className="bg-teal-600 hover:bg-teal-500 border-none font-bold">
                  View in Inventory Records
                </Button>
              </Link>
              <Button
                variant="secondary"
                fullWidth
                size="md"
                onClick={() => {
                  setShowSuccessModal(false);
                  setImei('');
                  setSerialNumber('');
                  setModel('');
                  setBrand('');
                  setPurchasePrice('');
                  setSellingPrice('');
                  setNotes('');
                  setStep(1);
                }}
              >
                Register Another Item
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Camera Scanner Modal */}
      <ImeiCameraScanner
        mode="modal"
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onDetected={(result) => {
          if (result.imei) setImei(result.imei);
          if (result.serial) setSerialNumber(result.serial);
        }}
        title={`Scan ${activeCategoryConfig.name} Barcode / QR`}
        subtitle="Align product box barcode, IMEI, or serial number inside the scanner frame."
      />

    </div>
  );
}
