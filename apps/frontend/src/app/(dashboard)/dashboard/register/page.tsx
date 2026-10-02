'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  Smartphone,
  Package,
  BatteryCharging,
  Headphones,
  Zap,
  Laptop,
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
  Tag,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { ImeiCameraScanner } from '@/components/scanner/ImeiCameraScanner';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';

type RegistrationMode = 'PHONE' | 'ITEM';
type DeviceSubCategory = 'PHONE_TABLET' | 'LAPTOP';

const POPULAR_ITEM_TYPES = [
  'Power Bank',
  'Earphones / AirPods / Audio',
  'Fast Charger & Adapter',
  'Charging Cable & Hub',
  'Case & Screen Guard',
  'Smartwatch & Wearable',
  'Speaker & Audio Gadget',
  'General Accessory / Other',
];

const PHONE_BRANDS = [
  'Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Huawei',
  'Oppo', 'Vivo', 'Realme', 'Tecno', 'Infinix', 'Itel',
  'Nokia', 'Motorola', 'Sony', 'Honor',
];

const LAPTOP_BRANDS = [
  'Apple', 'HP', 'Dell', 'Lenovo', 'Asus', 'Acer',
  'Microsoft', 'Toshiba', 'MSI', 'Samsung', 'Huawei', 'Razer',
];

const ACCESSORY_BRANDS = [
  'Oraimo', 'Anker', 'Apple', 'Samsung', 'Baseus', 'New-Age',
  'Romoss', 'JBL', 'Sony', 'UGREEN', 'Zealot', 'Joyroom',
  'Remax', 'LDNIO', 'Xiaomi', 'Generic / OEM',
];

const PHONE_SPECS_PRESETS = ['32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB'];

const LAPTOP_SPECS_PRESETS = [
  '8GB RAM / 256GB SSD',
  '8GB RAM / 512GB SSD',
  '16GB RAM / 256GB SSD',
  '16GB RAM / 512GB SSD',
  '16GB RAM / 1TB SSD',
  '32GB RAM / 512GB SSD',
  '32GB RAM / 1TB SSD',
  '64GB RAM / 2TB SSD',
];

const formatNumberWithCommas = (val: string | number | null | undefined): string => {
  if (val === null || val === undefined || val === '') return '';
  const str = val.toString().replace(/,/g, '');
  const parts = str.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

export default function RegisterPhonePage({ defaultDeviceCategory = 'PHONE_TABLET', defaultMode = 'PHONE' }: { defaultDeviceCategory?: 'PHONE_TABLET' | 'LAPTOP'; defaultMode?: 'PHONE' | 'ITEM' } = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { checkCanPerformAction } = useSubscriptionGuard();

  // Registration Mode: 'PHONE' or 'ITEM'
  const [mode, setMode] = useState<RegistrationMode>(defaultMode);

  // Device Sub-Category (when Mode is PHONE/SERIALIZED): 'PHONE_TABLET' or 'LAPTOP'
  const [deviceCategory, setDeviceCategory] = useState<DeviceSubCategory>(defaultDeviceCategory);

  // Page Step State: 1 = Identify, 2 = Specs & Details, 3 = Summary
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Data
  const [imei, setImei] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [itemType, setItemType] = useState('Power Bank');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [specs, setSpecs] = useState('');
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

  // 1:1 Business Price Memory State
  const [priceSuggestion, setPriceSuggestion] = useState<{
    found: boolean;
    sellingPrice: number | null;
    purchasePrice: number | null;
    brand: string;
    model: string;
    storageCapacity?: string;
  } | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

  // Live Cloud / Manufacturer Device Auto-Detection State
  const [autoDetectedInfo, setAutoDetectedInfo] = useState<{
    found: boolean;
    brand?: string;
    model?: string;
    specs?: string;
    deviceCategory?: 'PHONE_TABLET' | 'LAPTOP' | 'ACCESSORY';
    confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
    source?: string;
  } | null>(null);
  const [isLookingUpDevice, setIsLookingUpDevice] = useState(false);

  // Auto-lookup device information from serial number / service tag / barcode
  React.useEffect(() => {
    const rawIdentifier = (imei || serialNumber || '').trim();
    if (
      rawIdentifier.length < 4 ||
      rawIdentifier.startsWith('PH-') ||
      rawIdentifier.startsWith('PC-') ||
      rawIdentifier.startsWith('SKU-')
    ) {
      setAutoDetectedInfo(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLookingUpDevice(true);
        const cat = mode === 'PHONE' ? (deviceCategory === 'LAPTOP' ? 'LAPTOP' : 'PHONE') : 'ITEM';
        const res = await api.lookupDevice(rawIdentifier, cat);

        if (res && res.found) {
          setAutoDetectedInfo(res);
          if (res.brand) {
            setBrand(res.brand);
          }
          if (res.model) {
            setModel(res.model);
          }
          if (res.specs) {
            setSpecs(res.specs);
          }
          if (res.deviceCategory === 'LAPTOP' && mode === 'PHONE') {
            setDeviceCategory('LAPTOP');
          }
        } else {
          setAutoDetectedInfo(null);
        }
      } catch (err) {
        console.warn('Live device lookup skipped/offline:', err);
      } finally {
        setIsLookingUpDevice(false);
      }
    }, 380);

    return () => clearTimeout(timer);
  }, [imei, serialNumber, mode, deviceCategory]);

  // Auto-query 1:1 store price memory when model/specs change
  React.useEffect(() => {
    if (!brand.trim() || !model.trim()) {
      setPriceSuggestion(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoadingSuggestion(true);
        const res = await api.getPriceSuggestion({
          brand: brand.trim(),
          model: model.trim(),
          storageCapacity: specs.trim() || undefined,
        });

        if (res.found && (res.sellingPrice != null || res.purchasePrice != null)) {
          setPriceSuggestion(res);
          // Auto-fill prices if fields are currently empty
          setSellingPrice((prev) => (!prev && res.sellingPrice != null ? res.sellingPrice.toString() : prev));
          setPurchasePrice((prev) => (!prev && res.purchasePrice != null ? res.purchasePrice.toString() : prev));
        } else {
          setPriceSuggestion(null);
        }
      } catch (err) {
        console.warn('Price suggestion lookup failed:', err);
      } finally {
        setIsLoadingSuggestion(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [brand, model, specs]);

  const activeBrands = mode === 'PHONE'
    ? (deviceCategory === 'PHONE_TABLET' ? PHONE_BRANDS : LAPTOP_BRANDS)
    : ACCESSORY_BRANDS;

  const generateSku = () => {
    const prefix = mode === 'PHONE' ? (deviceCategory === 'LAPTOP' ? 'PC' : 'PH') : 'SKU';
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const sku = `${prefix}-${randomCode}`;
    setSerialNumber(sku);
    if (!imei && mode === 'ITEM') {
      setImei(sku);
    }
  };

  const handleNextToStep2 = async () => {
    setErrorMessage(null);
    if (mode === 'PHONE') {
      if (deviceCategory === 'PHONE_TABLET') {
        const cleanImei = imei.trim();
        if (!cleanImei) {
          setErrorMessage('Please enter or scan a 15-digit IMEI.');
          return;
        }
        if (cleanImei.length !== 15 || !/^\d{15}$/.test(cleanImei)) {
          setErrorMessage(`IMEI must be exactly 15 numeric digits (currently ${cleanImei.length} digits).`);
          return;
        }
      } else {
        if (!imei.trim() && !serialNumber.trim()) {
          setErrorMessage('Please enter or scan a Serial Number or Device ID.');
          return;
        }
      }
    } else {
      if (!imei.trim() && !serialNumber.trim()) {
        setErrorMessage('Please enter a barcode, SKU, or click "Generate SKU".');
        return;
      }
    }

    const checkId = imei.trim() || serialNumber.trim();
    if (checkId) {
      try {
        const checkResult = await api.checkImei(checkId);
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
      setErrorMessage('Please specify the brand (or type a custom brand).');
      return;
    }
    if (!model.trim()) {
      setErrorMessage('Please specify the product / model name.');
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
    if (!checkCanPerformAction('register_device')) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const conditionMap: Record<string, 'NEW' | 'EXCELLENT' | 'REFURBISHED'> = {
      New: 'NEW',
      Used: 'EXCELLENT',
      Refurb: 'REFURBISHED',
    };

    // For general items, combine itemType and specs in storageCapacity for seamless POS & invoice display
    const finalSpecs = mode === 'PHONE'
      ? (specs || (deviceCategory === 'LAPTOP' ? '16GB RAM / 512GB SSD' : '128 GB'))
      : [itemType, specs].filter(Boolean).join(' • ');

    try {
      const registered = await api.registerPhone({
        imei1: imei.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        brand: brand.trim(),
        model: model.trim(),
        storageCapacity: finalSpecs,
        condition: conditionMap[condition] || 'NEW',
        carrierStatus: mode === 'PHONE' && deviceCategory === 'PHONE_TABLET' ? (carrierStatus as any) : 'UNLOCKED',
        lockedCarrier: mode === 'PHONE' && deviceCategory === 'PHONE_TABLET' && carrierStatus === 'CARRIER_LOCKED' ? lockedCarrier.trim() : undefined,
        activationStatus: mode === 'PHONE' && deviceCategory === 'PHONE_TABLET' ? (activationStatus as any) : 'READY_FOR_SETUP',
        warrantyDurationMonths: warrantyMonths,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice.toString().replace(/,/g, '')) : undefined,
        sellingPrice: sellingPrice ? parseFloat(sellingPrice.toString().replace(/,/g, '')) : undefined,
      });

      setRegisteredItem({
        id: registered.id,
        imei: registered.imei1 || registered.serialNumber || 'N/A',
        model: registered.model,
        brand: registered.brand,
        modeName: mode === 'PHONE'
          ? (deviceCategory === 'LAPTOP' ? 'Laptop / Computer' : 'Phone / Tablet')
          : itemType || 'General Item',
        specs: registered.storageCapacity || finalSpecs,
        condition: registered.condition || condition,
        sellingPrice: registered.sellingPrice || sellingPrice,
        qrCodeUrl: registered.qrCodeUrl,
        date: new Date(registered.createdAt || Date.now()).toISOString().split('T')[0],
      });

      // Invalidate records & inventory caches for instant UI reflection across tabs
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });

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
              Register Phones & Laptops or Item
            </h1>
            <Badge variant="new" size="sm" className="hidden sm:inline-flex">
              Add New Stock
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl mt-1 leading-relaxed">
            Product Intake: Add phones, laptops, and accessories into inventory with instant barcode & QR traceability.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" leftIcon={<Upload className="w-4 h-4 text-slate-600" />}>
            Bulk Upload
          </Button>
        </div>
      </div>

      {/* Primary 2-Mode Switcher */}
      <div className="bg-slate-100 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-200 max-w-2xl">
        <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => {
              setMode('PHONE');
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-1.5 sm:gap-2.5 py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold transition-all ${
              mode === 'PHONE'
                ? 'bg-white text-slate-950 shadow-xs sm:shadow-sm border border-slate-200 ring-2 ring-teal-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <div className={`w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg flex items-center justify-center shrink-0 ${
              mode === 'PHONE' ? 'bg-teal-50 text-teal-700' : 'bg-slate-200 text-slate-500'
            }`}>
              <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="text-left min-w-0">
              <span className="block font-black truncate">
                <span className="sm:hidden">Phones & Laptops</span>
                <span className="hidden sm:inline">Phone, Laptop & Serialized Device</span>
              </span>
              <span className="block text-[10px] text-slate-400 font-medium hidden sm:block">Phones, Laptops, Tablets (IMEI & S/N Tracked)</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('ITEM');
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-1.5 sm:gap-2.5 py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold transition-all ${
              mode === 'ITEM'
                ? 'bg-white text-slate-950 shadow-xs sm:shadow-sm border border-slate-200 ring-2 ring-teal-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <div className={`w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg flex items-center justify-center shrink-0 ${
              mode === 'ITEM' ? 'bg-teal-50 text-teal-700' : 'bg-slate-200 text-slate-500'
            }`}>
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="text-left min-w-0">
              <span className="block font-black truncate">
                <span className="sm:hidden">General Item</span>
                <span className="hidden sm:inline">General Item / Accessory</span>
              </span>
              <span className="block text-[10px] text-slate-400 font-medium hidden sm:block">Power banks, ear pieces, chargers, cables, cases...</span>
            </div>
          </button>
        </div>
      </div>

      {/* Stepper Navigation Indicator Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 sm:pb-3 gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1 sm:gap-3 md:gap-4 overflow-x-auto pb-0.5 scrollbar-none justify-start min-w-0">
          {/* Step 1 Indicator */}
          <button
            onClick={() => setStep(1)}
            className={`flex items-center gap-1 sm:gap-1.5 text-xs font-extrabold transition shrink-0 ${
              step === 1 ? 'text-teal-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center text-[10px] sm:text-xs shrink-0 ${
              step === 1 ? 'border-teal-600 bg-teal-50 text-teal-700 shadow-xs sm:shadow-sm' : 'border-slate-300 bg-white text-slate-500'
            }`}>
              1
            </span>
            <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">
              <span className="hidden sm:inline">1. Identification</span>
              <span className="sm:hidden">1. Identify</span>
            </span>
          </button>

          <div className="w-1.5 sm:w-6 md:w-10 h-px bg-slate-200 shrink-0" />

          {/* Step 2 Indicator */}
          <button
            onClick={() => setStep(2)}
            className={`flex items-center gap-1 sm:gap-1.5 text-xs font-extrabold transition shrink-0 ${
              step === 2 ? 'text-teal-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center text-[10px] sm:text-xs shrink-0 ${
              step === 2 ? 'border-teal-600 bg-teal-50 text-teal-700 shadow-xs sm:shadow-sm' : 'border-slate-300 bg-white text-slate-500'
            }`}>
              2
            </span>
            <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">
              <span className="hidden sm:inline">2. Specs & Pricing</span>
              <span className="sm:hidden">2. Specs</span>
            </span>
          </button>

          <div className="w-1.5 sm:w-6 md:w-10 h-px bg-slate-200 shrink-0" />

          {/* Step 3 Indicator */}
          <button
            onClick={() => setStep(3)}
            className={`flex items-center gap-1 sm:gap-1.5 text-xs font-extrabold transition shrink-0 ${
              step === 3 ? 'text-teal-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center text-[10px] sm:text-xs shrink-0 ${
              step === 3 ? 'border-teal-600 bg-teal-50 text-teal-700 shadow-xs sm:shadow-sm' : 'border-slate-300 bg-white text-slate-500'
            }`}>
              3
            </span>
            <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">
              <span className="hidden sm:inline">3. Review & Save</span>
              <span className="sm:hidden">3. Review</span>
            </span>
          </button>
        </div>

        {step > 1 && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-[10px] sm:text-xs font-extrabold text-slate-600 hover:text-slate-900 transition shrink-0 ml-auto pl-1"
          >
            <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Back to Step {step - 1}</span><span className="inline sm:hidden">Back</span>
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
                    {mode === 'PHONE' ? <Smartphone className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-xl font-extrabold text-slate-900 leading-tight">
                      Step 1: Identify {mode === 'PHONE' ? 'Phone / Device' : 'Product / Accessory'}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                      {mode === 'PHONE'
                        ? 'Scan retail box barcode or enter 15-digit IMEI number'
                        : 'Scan box barcode, enter serial number, or auto-generate a unique inventory SKU'}
                    </p>
                  </div>
                </div>
                <Badge variant="new" size="sm">
                  {mode === 'PHONE' ? 'IMEI Tracked' : 'General Item'}
                </Badge>
              </div>

              {/* Duplicate Warning Alert */}
              {showDuplicateWarning && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/90 flex gap-4 text-xs">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-extrabold text-rose-950 text-sm">Duplicate Identifier Detected</p>
                      <button onClick={() => setShowDuplicateWarning(false)} className="text-rose-500 hover:text-rose-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-rose-800 font-medium mt-1">
                      Identifier <strong>{imei}</strong> is already registered: <strong>{duplicateDetails?.brand} {duplicateDetails?.model}</strong>.
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
                  <p className="font-extrabold text-sm sm:text-base text-teal-700">
                    Scan Product Barcode / QR
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 leading-tight">
                    Use device camera or handheld USB/Bluetooth barcode scanner
                  </p>
                </div>
              </div>

              {/* Inputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {mode === 'PHONE' ? 'IMEI Number *' : 'Barcode / EAN / S/N (Optional)'}
                    </label>
                    {mode === 'PHONE' && deviceCategory === 'PHONE_TABLET' && (
                      <span className={`text-[11px] font-bold ${
                        imei.length === 15 
                          ? 'text-emerald-600 flex items-center gap-1' 
                          : imei.length > 0 
                            ? 'text-amber-600' 
                            : 'text-slate-400'
                      }`}>
                        {imei.length === 15 ? '✓ 15 / 15 digits (Valid)' : `(${imei.length}/15 digits)`}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={imei}
                    maxLength={mode === 'PHONE' && deviceCategory === 'PHONE_TABLET' ? 15 : undefined}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (mode === 'PHONE' && deviceCategory === 'PHONE_TABLET') {
                        val = val.replace(/\D/g, '').slice(0, 15);
                      }
                      setImei(val);
                    }}
                    placeholder={mode === 'PHONE' ? "Enter 15-digit IMEI" : "e.g. 693420849102 or scan box"}
                    className={`w-full text-xs sm:text-sm px-3.5 py-2.5 sm:px-4 sm:py-3 bg-white border rounded-xl focus:outline-none font-mono font-semibold text-slate-900 placeholder:text-[10px] sm:placeholder:text-xs shadow-xs transition-colors ${
                      mode === 'PHONE' && deviceCategory === 'PHONE_TABLET' && imei.length === 15
                        ? 'border-emerald-500 focus:border-emerald-600 bg-emerald-50/20'
                        : mode === 'PHONE' && deviceCategory === 'PHONE_TABLET' && imei.length > 0 && imei.length < 15
                        ? 'border-amber-400 focus:border-amber-500'
                        : 'border-slate-200 focus:border-teal-600'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Inventory SKU / Serial Number
                  </label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="Enter SKU or barcode number"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 sm:px-4 sm:py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 font-mono font-semibold text-slate-900 placeholder:text-[10px] sm:placeholder:text-xs shadow-xs"
                  />
                </div>
              </div>

              {/* Live Device Auto-Detection Status (No sparkle icons) */}
              {isLookingUpDevice && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium flex items-center gap-2 animate-pulse">
                  <div className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Looking up device specifications from manufacturer & retail registry...</span>
                </div>
              )}

              {autoDetectedInfo?.found && !isLookingUpDevice && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/90 text-emerald-950 text-xs flex items-center justify-between animate-in fade-in duration-200 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-extrabold text-emerald-950">Auto-detected: </span>
                      <span className="font-bold text-slate-900">{autoDetectedInfo.brand} {autoDetectedInfo.model}</span>
                      {autoDetectedInfo.specs && (
                        <span className="text-emerald-800 font-semibold"> • {autoDetectedInfo.specs}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                    {autoDetectedInfo.source || 'Auto-Resolved'}
                  </span>
                </div>
              )}

              {mode === 'ITEM' && !imei && !serialNumber && (
                <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-teal-800 font-medium">
                    <Info className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>No barcode on product packaging? Generate a unique stock SKU code in 1 click.</span>
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
                  <span>Proceed to Step 2: Item Details & Pricing</span>
                </Button>
              </div>
            </section>
          )}

          {/* PAGE VIEW 2 — STEP 2: ITEM SPECIFICATIONS & PRICING */}
          {step === 2 && (
            <section className="p-4 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 sm:space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 sm:pb-4 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 justify-start text-left min-w-0">
                  <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center font-bold shadow-xs sm:shadow-sm shrink-0">
                    {mode === 'PHONE' ? (deviceCategory === 'LAPTOP' ? <Laptop className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />) : <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </div>
                  <div className="text-left min-w-0">
                    <h2 className="text-sm sm:text-xl font-extrabold text-slate-900 leading-tight truncate">
                      <span className="sm:hidden">Step 2: Specifications & Pricing</span>
                      <span className="hidden sm:inline">
                        Step 2: {mode === 'PHONE'
                          ? (deviceCategory === 'LAPTOP' ? 'Laptop & Computer Specifications' : 'Phone & Tablet Specifications')
                          : 'Product Information & Pricing'}
                      </span>
                    </h2>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate sm:whitespace-normal">
                      {mode === 'PHONE'
                        ? (deviceCategory === 'LAPTOP'
                            ? 'Configure laptop brand, model, RAM/SSD specs & retail pricing'
                            : 'Configure brand, model, storage capacity & retail pricing')
                        : 'Configure category, brand, model, specs & retail pricing'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-[10px] sm:text-xs font-extrabold text-teal-600 hover:underline flex items-center gap-1 shrink-0 ml-auto"
                >
                  <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Edit Step 1</span><span className="inline sm:hidden">Edit</span>
                </button>
              </div>

              {/* Sub-Category Toggle for Serialized Mode: Phone/Tablet vs Laptop */}
              {mode === 'PHONE' && (
                <div className="bg-slate-100 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setDeviceCategory('PHONE_TABLET');
                        if (LAPTOP_SPECS_PRESETS.includes(specs)) {
                          setSpecs('128 GB');
                        }
                      }}
                      className={`flex items-center justify-center gap-1.5 sm:gap-2.5 py-1.5 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold transition-all ${
                        deviceCategory === 'PHONE_TABLET'
                          ? 'bg-white text-slate-950 shadow-xs sm:shadow-sm border border-slate-200 ring-2 ring-teal-500/20'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center shrink-0 ${
                        deviceCategory === 'PHONE_TABLET' ? 'bg-teal-50 text-teal-700' : 'bg-slate-200 text-slate-500'
                      }`}>
                        <Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </div>
                      <div className="text-left">
                        <span className="block font-black truncate">Phone / Tablet</span>
                        <span className="text-[10px] text-slate-400 font-medium hidden sm:block">iPhones, Android, iPads, Tabs</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDeviceCategory('LAPTOP');
                        if (PHONE_SPECS_PRESETS.includes(specs) || !specs) {
                          setSpecs('16GB RAM / 512GB SSD');
                        }
                      }}
                      className={`flex items-center justify-center gap-1.5 sm:gap-2.5 py-1.5 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold transition-all ${
                        deviceCategory === 'LAPTOP'
                          ? 'bg-white text-slate-950 shadow-xs sm:shadow-sm border border-slate-200 ring-2 ring-teal-500/20'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center shrink-0 ${
                        deviceCategory === 'LAPTOP' ? 'bg-teal-50 text-teal-700' : 'bg-slate-200 text-slate-500'
                      }`}>
                        <Laptop className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </div>
                      <div className="text-left">
                        <span className="block font-black truncate">Laptop / PC</span>
                        <span className="text-[10px] text-slate-400 font-medium hidden sm:block">MacBooks, HP, Dell, ThinkPads</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* General Item Type Quick Selector */}
              {mode === 'ITEM' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider text-xs">
                      Item Category / Type *
                    </label>
                  </div>

                  {/* Mobile Select Dropdown */}
                  <div className="block sm:hidden">
                    <select
                      value={POPULAR_ITEM_TYPES.includes(itemType) ? itemType : 'CUSTOM'}
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                          setItemType('');
                        } else {
                          setItemType(e.target.value);
                        }
                      }}
                      className="w-full h-8 px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-bold text-slate-800 text-[10px] focus:outline-none focus:border-teal-600 shadow-xs"
                    >
                      {POPULAR_ITEM_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                      <option value="CUSTOM">Custom / Other Category...</option>
                    </select>
                  </div>

                  {/* Desktop Quick Chips */}
                  <div className="hidden sm:flex flex-wrap gap-1.5">
                    {POPULAR_ITEM_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setItemType(type)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          itemType === type
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {/* Custom / Specific Category Text Input */}
                  {(!POPULAR_ITEM_TYPES.includes(itemType) || itemType === 'General Accessory / Other') && (
                    <input
                      type="text"
                      value={itemType}
                      onChange={(e) => setItemType(e.target.value)}
                      placeholder="Specify custom category (e.g. Ring Light, Drone, Wireless Mic...)"
                      className="w-full mt-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white font-bold text-slate-900 text-xs placeholder:text-[10px] sm:placeholder:text-xs focus:outline-none focus:border-teal-600 animate-in fade-in duration-150"
                      autoFocus={!POPULAR_ITEM_TYPES.includes(itemType)}
                    />
                  )}
                </div>
              )}

              {/* Step 2 Auto-Detection Banner (No sparkle icons) */}
              {autoDetectedInfo?.found && (
                <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/90 flex items-center justify-between text-xs text-emerald-950 shadow-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-extrabold text-emerald-950">Auto-filled: </span>
                      <span className="font-semibold text-slate-800">
                        {autoDetectedInfo.brand} {autoDetectedInfo.model}
                        {autoDetectedInfo.specs ? ` (${autoDetectedInfo.specs})` : ''}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                    {autoDetectedInfo.source || 'Auto-Detected'}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Brand Input (Freely Type Any Brand + Quick Suggestions) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider">Brand *</label>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Type custom brand or pick below</span>
                  </div>
                  <input
                    type="text"
                    list="brand-suggestions"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder={
                      mode === 'PHONE'
                        ? (deviceCategory === 'LAPTOP' ? "e.g. Apple, HP, Dell, Lenovo, Asus, Custom..." : "e.g. Apple, Samsung, Google, Xiaomi, Custom...")
                        : "e.g. Oraimo, Anker, Baseus, Sony, Generic..."
                    }
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 placeholder:text-[10px] sm:placeholder:text-xs placeholder:font-normal focus:outline-none focus:border-teal-600 shadow-xs text-xs"
                  />
                  <datalist id="brand-suggestions">
                    {activeBrands.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {activeBrands.slice(0, 8).map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBrand(b)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                          brand.toLowerCase() === b.toLowerCase()
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Model / Title Input (Allows Any Custom Name) */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">
                    {mode === 'PHONE' ? 'Model Name *' : 'Product Title / Model Name *'}
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={
                      mode === 'PHONE'
                        ? (deviceCategory === 'LAPTOP'
                            ? 'e.g. MacBook Pro M3 14", HP EliteBook 840 G8, ThinkPad X1'
                            : 'e.g. iPhone 15 Pro Max, Galaxy S24 Ultra, iPad Pro 11"')
                        : 'e.g. Toast 10 Byte 20000mAh, FreePods 4 ANC, 65W GaN Charger'
                    }
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 placeholder:text-[10px] sm:placeholder:text-xs placeholder:font-normal focus:outline-none focus:border-teal-600 shadow-xs text-xs"
                  />
                </div>

                {/* Specifications / Storage / Capacity */}
                <div className="space-y-1.5 sm:space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] sm:text-xs">
                      {mode === 'PHONE'
                        ? (deviceCategory === 'LAPTOP' ? 'RAM, Storage & Hardware Specs *' : 'Internal Storage Capacity *')
                        : 'Specifications / Capacity / Variant'}
                    </label>
                    {mode === 'PHONE' && (
                      <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Pick preset or type custom</span>
                    )}
                  </div>

                  {/* Phone / Tablet Storage Selector */}
                  {mode === 'PHONE' && deviceCategory === 'PHONE_TABLET' && (
                    <div className="space-y-2">
                      {/* Mobile Dropdown */}
                      <div className="block sm:hidden">
                        <select
                          value={PHONE_SPECS_PRESETS.includes(specs || '128 GB') ? (specs || '128 GB') : 'CUSTOM'}
                          onChange={(e) => {
                            if (e.target.value === 'CUSTOM') {
                              setSpecs('');
                            } else {
                              setSpecs(e.target.value);
                            }
                          }}
                          className="w-full h-8 px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-bold text-slate-800 text-[10px] focus:outline-none focus:border-teal-600 shadow-xs"
                        >
                          {PHONE_SPECS_PRESETS.map((st) => (
                            <option key={st} value={st}>
                              {st} Storage
                            </option>
                          ))}
                          <option value="CUSTOM">Custom Storage / Specs...</option>
                        </select>
                      </div>

                      {/* Desktop Chips */}
                      <div className="hidden sm:flex flex-wrap gap-2">
                        {PHONE_SPECS_PRESETS.map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setSpecs(st)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                              (specs || '128 GB') === st
                                ? 'bg-teal-50 text-teal-700 border-2 border-teal-600 shadow-xs'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>

                      {/* Custom Input for Phone */}
                      {(!PHONE_SPECS_PRESETS.includes(specs) && specs !== '') && (
                        <input
                          type="text"
                          value={specs}
                          onChange={(e) => setSpecs(e.target.value)}
                          placeholder="Specify custom storage/RAM (e.g. 128GB + 8GB RAM...)"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 text-xs placeholder:text-[10px] sm:placeholder:text-xs focus:outline-none focus:border-teal-600 animate-in fade-in duration-150"
                          autoFocus
                        />
                      )}
                      {specs === '' && (
                        <input
                          type="text"
                          value={specs}
                          onChange={(e) => setSpecs(e.target.value)}
                          placeholder="Type custom storage/specs (e.g. 128GB + 8GB RAM...)"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 text-xs placeholder:text-[10px] sm:placeholder:text-xs focus:outline-none focus:border-teal-600 animate-in fade-in duration-150"
                          autoFocus
                        />
                      )}
                    </div>
                  )}

                  {/* Laptop RAM & Storage Specs Selector */}
                  {mode === 'PHONE' && deviceCategory === 'LAPTOP' && (
                    <div className="space-y-2">
                      {/* Mobile Dropdown */}
                      <div className="block sm:hidden">
                        <select
                          value={LAPTOP_SPECS_PRESETS.includes(specs) ? specs : 'CUSTOM'}
                          onChange={(e) => {
                            if (e.target.value === 'CUSTOM') {
                              setSpecs('');
                            } else {
                              setSpecs(e.target.value);
                            }
                          }}
                          className="w-full h-8 px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-bold text-slate-800 text-[10px] focus:outline-none focus:border-teal-600 shadow-xs"
                        >
                          {LAPTOP_SPECS_PRESETS.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                          <option value="CUSTOM">Custom Specs / Processor...</option>
                        </select>
                      </div>

                      {/* Desktop Chips */}
                      <div className="hidden sm:flex flex-wrap gap-2">
                        {LAPTOP_SPECS_PRESETS.map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setSpecs(st)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              specs === st
                                ? 'bg-teal-50 text-teal-700 border-2 border-teal-600 shadow-xs'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>

                      {/* Custom Input for Laptop */}
                      {(!LAPTOP_SPECS_PRESETS.includes(specs) && specs !== '') && (
                        <input
                          type="text"
                          value={specs}
                          onChange={(e) => setSpecs(e.target.value)}
                          placeholder="Specify custom laptop specs (e.g. Core i7 / 16GB / 512GB SSD...)"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 text-xs placeholder:text-[10px] sm:placeholder:text-xs focus:outline-none focus:border-teal-600 animate-in fade-in duration-150"
                          autoFocus
                        />
                      )}
                      {specs === '' && (
                        <input
                          type="text"
                          value={specs}
                          onChange={(e) => setSpecs(e.target.value)}
                          placeholder="Type custom specs (e.g. Core i7 / 16GB RAM / 512GB SSD...)"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 text-xs placeholder:text-[10px] sm:placeholder:text-xs focus:outline-none focus:border-teal-600 animate-in fade-in duration-150"
                          autoFocus
                        />
                      )}
                    </div>
                  )}

                  {mode === 'ITEM' && (
                    <input
                      type="text"
                      value={specs}
                      onChange={(e) => setSpecs(e.target.value)}
                      placeholder="e.g. 20,000mAh (22.5W Fast Charge), TWS Wireless ANC, 1.5m Black..."
                      className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 placeholder:text-[10px] sm:placeholder:text-xs focus:outline-none focus:border-teal-600 text-xs"
                    />
                  )}
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
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-[11px] sm:text-xs focus:outline-none focus:border-teal-600 shadow-xs"
                  >
                    <option value={0}>No Warranty</option>
                    <option value={1}>1 Month Warranty</option>
                    <option value={3}>3 Months Warranty</option>
                    <option value={6}>6 Months Warranty</option>
                    <option value={12}>12 Months (1 Year Standard)</option>
                    <option value={24}>24 Months (2 Years Extended)</option>
                  </select>
                </div>

                {/* Phone-Specific Carrier & Activation Fields */}
                {mode === 'PHONE' && deviceCategory === 'PHONE_TABLET' && (
                  <>
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
                          className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50/50 font-bold text-slate-900 placeholder:text-[10px] sm:placeholder:text-xs focus:outline-none text-xs"
                        />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-700 uppercase tracking-wider">Cloud / FRP Activation</label>
                      <select
                        value={activationStatus}
                        onChange={(e) => setActivationStatus(e.target.value as any)}
                        className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-[11px] sm:text-xs focus:outline-none focus:border-teal-600 shadow-xs"
                      >
                        <option value="READY_FOR_SETUP">Ready for Setup (iCloud/Google FRP Removed)</option>
                        <option value="ACTIVATED">Activated (Account Linked / In-Use)</option>
                        <option value="NOT_ACTIVATED">Not Activated (Brand New Sealed)</option>
                      </select>
                    </div>
                  </>
                )}

                {/* 1:1 Store Price Memory Active Banner */}
                {priceSuggestion?.found && (
                  <div className="md:col-span-2 p-3.5 rounded-2xl bg-teal-50 border border-teal-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-teal-950">Store Price Memory Active</span>
                          <span className="px-1.5 py-0.5 rounded bg-teal-200/80 text-[10px] font-extrabold text-teal-800 uppercase">
                            1:1 Store Preset
                          </span>
                        </div>
                        <p className="text-teal-700 font-medium text-[11px] truncate">
                          Matched previous <strong>{priceSuggestion.brand} {priceSuggestion.model} {priceSuggestion.storageCapacity || ''}</strong> prices
                          {priceSuggestion.sellingPrice != null ? ` • Selling: ₦${priceSuggestion.sellingPrice.toLocaleString()}` : ''}
                          {priceSuggestion.purchasePrice != null ? ` • Cost: ₦${priceSuggestion.purchasePrice.toLocaleString()}` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (priceSuggestion.sellingPrice != null) setSellingPrice(priceSuggestion.sellingPrice.toString());
                        if (priceSuggestion.purchasePrice != null) setPurchasePrice(priceSuggestion.purchasePrice.toString());
                      }}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shrink-0 transition shadow-xs"
                    >
                      Re-apply Preset
                    </button>
                  </div>
                )}

                {/* Pricing Inputs: Purchase & Selling Price */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider">Purchase Cost Price</label>
                    {purchasePrice && (
                      <span className="text-[11px] font-bold text-slate-400">
                        ₦{Number(purchasePrice.replace(/,/g, '') || 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 sm:top-3 text-slate-400 font-extrabold text-sm">₦</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formatNumberWithCommas(purchasePrice)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, '').replace(/[^\d.]/g, '');
                        setPurchasePrice(raw);
                      }}
                      placeholder="e.g. 150,000"
                      className="w-full pl-8 pr-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs sm:text-sm placeholder:text-[10px] sm:placeholder:text-xs focus:outline-none focus:border-teal-600 shadow-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider">Retail Selling Price</label>
                    {sellingPrice && (
                      <span className="text-[11px] font-bold text-teal-600">
                        ₦{Number(sellingPrice.replace(/,/g, '') || 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 sm:top-3 text-slate-400 font-extrabold text-sm">₦</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formatNumberWithCommas(sellingPrice)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, '').replace(/[^\d.]/g, '');
                        setSellingPrice(raw);
                      }}
                      placeholder="e.g. 250,000"
                      className="w-full pl-8 pr-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs sm:text-sm placeholder:text-[10px] sm:placeholder:text-xs focus:outline-none focus:border-teal-600 shadow-xs"
                    />
                  </div>
                </div>

                {/* Optional Notes */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">Inventory Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add details about packaging, color, battery health, or included cables..."
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 placeholder:text-[10px] sm:placeholder:text-xs focus:outline-none focus:border-teal-600 resize-none"
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
            <section className="p-4 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 sm:space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 sm:pb-4 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 justify-start text-left min-w-0">
                  <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold shadow-xs sm:shadow-sm shrink-0">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="text-left min-w-0">
                    <h2 className="text-sm sm:text-xl font-extrabold text-slate-900 leading-tight truncate">
                      Step 3: Registration Summary
                    </h2>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
                      Review {mode === 'PHONE' ? 'device' : itemType.toLowerCase()} metadata before adding to inventory
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
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3 sm:space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[9px] sm:text-[10px]">Type</span>
                    <span className="font-extrabold text-teal-700 text-xs sm:text-sm flex items-center gap-1.5 mt-0.5 truncate">
                      {mode === 'PHONE' ? (deviceCategory === 'LAPTOP' ? <Laptop className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />) : <Package className="w-3.5 h-3.5" />}
                      {mode === 'PHONE' ? (deviceCategory === 'LAPTOP' ? 'Laptop / PC' : 'Phone / Tablet') : itemType}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[9px] sm:text-[10px]">Brand & Product</span>
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm mt-0.5 block truncate">{brand} {model}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[9px] sm:text-[10px]">Identifier / SKU</span>
                    <span className="font-mono font-bold text-teal-700 text-xs sm:text-sm mt-0.5 block truncate">
                      {imei || serialNumber || 'Auto SKU Assigned'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[9px] sm:text-[10px]">Specifications</span>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5 block truncate">
                      {mode === 'PHONE' ? (specs || (deviceCategory === 'LAPTOP' ? '16GB RAM / 512GB SSD' : '128 GB')) : (specs || 'Standard')} • {condition}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 pt-3 border-t border-slate-200">
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[9px] sm:text-[10px]">Cost Price</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                      {purchasePrice ? `₦${parseFloat(purchasePrice.toString().replace(/,/g, '')).toLocaleString()}` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[9px] sm:text-[10px]">Selling Price</span>
                    <span className="font-extrabold text-emerald-700 text-xs sm:text-sm mt-0.5 block">
                      {sellingPrice ? `₦${parseFloat(sellingPrice.toString().replace(/,/g, '')).toLocaleString()}` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[9px] sm:text-[10px]">Warranty</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                      {warrantyMonths > 0 ? `${warrantyMonths} Months Active` : 'No Warranty'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3 Action Bar */}
              <div className="flex items-center justify-between gap-2 pt-3 sm:pt-4 border-t border-slate-100 flex-col-reverse sm:flex-row">
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
                  <span>Complete Registration & Add to Stock</span>
                </Button>
              </div>
            </section>
          )}

        </div>

        {/* ========================================================================= */}
        {/* RIGHT 4 COLUMNS: SUMMARY STICKY SIDEBAR & GUIDANCE (DESKTOP ONLY)          */}
        {/* ========================================================================= */}
        <aside className="hidden lg:block lg:col-span-4 space-y-5">
          
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
                  <span className="text-slate-500">Item Type</span>
                  <span className="font-bold text-teal-700">{mode === 'PHONE' ? (deviceCategory === 'LAPTOP' ? 'Laptop / PC' : 'Phone / Tablet') : itemType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Identifier / SKU</span>
                  <span className="font-mono font-bold text-slate-900">{imei || serialNumber || 'Auto SKU'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Brand & Title</span>
                  <span className="font-bold text-slate-900">{brand} {model}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Specifications</span>
                  <span className="font-bold text-slate-900">{mode === 'PHONE' ? (specs || '128 GB') : (specs || 'Standard')}</span>
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
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
                  <HelpCircle className="w-4 h-4 text-teal-600" />
                  <span>{mode === 'PHONE' ? 'Phone' : 'Accessory'} Registration Tips</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                  {mode === 'PHONE' ? (
                    <>
                      <li className="flex gap-2">
                        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span>Ensure 15-digit IMEI is captured for blacklist & warranty tracking.</span>
                      </li>
                      <li className="flex gap-2">
                        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span>Dial *#06# on the phone keypad or scan the box sticker.</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex gap-2">
                        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span>Scan the barcode from the packaging or click Auto-Generate SKU.</span>
                      </li>
                      <li className="flex gap-2">
                        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span>Set accurate purchase cost and retail price for instant POS sales and quote proposals.</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Supported Multi-Category Stock Info */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-900 to-slate-900 text-white shadow-md space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-teal-400" />
                  <h4 className="font-extrabold text-xs tracking-wider uppercase text-teal-300">Universal Catalog</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  All registered phones and items are automatically available across your POS checkout terminal, Quotations & Estimates, and Inventory Ledger.
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
              <h3 className="text-xl font-extrabold text-slate-900">Product Intake Complete!</h3>
              <p className="text-xs text-slate-600 font-medium mt-1">
                <strong>{registeredItem.brand} {registeredItem.model}</strong> ({registeredItem.imei}) has been added to your inventory.
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
                  setSpecs('');
                  setPurchasePrice('');
                  setSellingPrice('');
                  setNotes('');
                  setAutoDetectedInfo(null);
                  setIsLookingUpDevice(false);
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
          if (result.imei) {
            let clean = result.imei.trim();
            if (mode === 'PHONE' && deviceCategory === 'PHONE_TABLET') {
              clean = clean.replace(/\D/g, '').slice(0, 15);
            }
            setImei(clean);
          }
          if (result.serial) setSerialNumber(result.serial);
        }}
        title={`Scan ${mode === 'PHONE' ? 'Phone Box / IMEI' : 'Product Barcode / SKU'}`}
        subtitle="Align product box barcode, IMEI, or serial number inside the scanner frame."
      />

    </div>
  );
}
