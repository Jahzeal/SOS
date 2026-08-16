'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  Smartphone,
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
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function RegisterPhonePage() {
  const router = useRouter();

  // Page Step State: 1 = Identify, 2 = Details, 3 = Summary
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Data
  const [imei, setImei] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [brand, setBrand] = useState('Apple');
  const [model, setModel] = useState('iPhone 16 Pro Max');
  const [storage, setStorage] = useState('256 GB');
  const [condition, setCondition] = useState<'New' | 'Used' | 'Refurb'>('New');
  const [warrantyMonths, setWarrantyMonths] = useState<number>(0);
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
  const [registerCameraGuidance, setRegisterCameraGuidance] = useState<{
    message: string;
    type: 'success' | 'warning' | 'dark' | 'info';
  }>({
    message: 'Align box barcode inside green box',
    type: 'info',
  });

  const lastRegisterDetectionRef = React.useRef(Date.now());

  React.useEffect(() => {
    let controls: any = null;
    let isMounted = true;
    let frameCheckInterval: any = null;

    if (showCameraScanner) {
      setRegisterCameraGuidance({ message: 'Align box barcode inside green box', type: 'info' });

      import('@zxing/browser').then(({ BrowserMultiFormatReader }) => {
        if (!isMounted) return;
        setTimeout(async () => {
          const videoElement = document.getElementById('zxing-register-video') as HTMLVideoElement;
          if (!videoElement) return;

          // Low-light canvas analyzer
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          canvas.width = 160;
          canvas.height = 120;

          frameCheckInterval = setInterval(() => {
            if (
              !videoElement ||
              videoElement.paused ||
              videoElement.ended ||
              videoElement.readyState < 2 ||
              !videoElement.videoWidth
            ) {
              return;
            }
            try {
              ctx?.drawImage(videoElement, 0, 0, 160, 120);
              const imgData = ctx?.getImageData(0, 0, 160, 120);
              if (imgData) {
                let totalLuminance = 0;
                const pixels = imgData.data;
                for (let i = 0; i < pixels.length; i += 16) {
                  const r = pixels[i];
                  const g = pixels[i + 1];
                  const b = pixels[i + 2];
                  totalLuminance += 0.2126 * r + 0.7152 * g + 0.0722 * b;
                }
                const avgLuminance = totalLuminance / (pixels.length / 16);
                if (avgLuminance < 25) {
                  setRegisterCameraGuidance({
                    message: '🌙 Environment Too Dark — Turn on lighting',
                    type: 'dark',
                  });
                } else if (Date.now() - lastRegisterDetectionRef.current > 2500) {
                  setRegisterCameraGuidance({
                    message: '⚠️ No IMEI or Barcode Detected — Align phone box inside reticle',
                    type: 'warning',
                  });
                }
              }
            } catch (e) {}
          }, 500);

          try {
            const codeReader = new BrowserMultiFormatReader();
            controls = await codeReader.decodeFromVideoDevice(
              undefined,
              videoElement,
              (result: any) => {
                if (result) {
                  const points = result.getResultPoints();
                  if (points && points.length > 0) {
                    const videoWidth = videoElement.videoWidth || 640;
                    const videoHeight = videoElement.videoHeight || 480;

                    let sumX = 0;
                    let sumY = 0;
                    points.forEach((p: any) => {
                      sumX += p.getX();
                      sumY += p.getY();
                    });
                    const barcodeCenterX = sumX / points.length;
                    const barcodeCenterY = sumY / points.length;

                    const deltaX = barcodeCenterX - (videoWidth / 2);
                    const deltaY = barcodeCenterY - (videoHeight / 2);

                    if (deltaX < -60) {
                      setRegisterCameraGuidance({ message: 'Move Camera Right ➡️', type: 'warning' });
                    } else if (deltaX > 60) {
                      setRegisterCameraGuidance({ message: 'Move Camera Left ⬅️', type: 'warning' });
                    } else if (deltaY < -50) {
                      setRegisterCameraGuidance({ message: 'Move Camera Down ⬇️', type: 'warning' });
                    } else if (deltaY > 50) {
                      setRegisterCameraGuidance({ message: 'Move Camera Up ⬆️', type: 'warning' });
                    } else {
                      setRegisterCameraGuidance({ message: 'Perfect Alignment — Hold Still 🟢', type: 'success' });
                    }
                  }

                  const rawText = result.getText();
                  const clean = rawText.replace(/^(\(1P\)|\(S\)|EID|IMEI\s*\/MEID|IMEI\d?|S\/N|SN|EAN):?\s*/i, '').trim();

                  if (/^\d{15}$/.test(clean)) {
                    setImei(clean);
                  } else {
                    setSerialNumber(clean);
                  }
                  setShowCameraScanner(false);
                  setStep(2);
                }
              }
            );
          } catch (e) {
            console.warn('Register camera start error:', e);
          }
        }, 150);
      });
    }

    return () => {
      isMounted = false;
      if (frameCheckInterval) clearInterval(frameCheckInterval);
      if (controls) {
        try { controls.stop(); } catch (e) {}
      }
    };
  }, [showCameraScanner]);

  const BRANDS = [
    'Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Huawei',
    'Oppo', 'Vivo', 'Realme', 'Tecno', 'Infinix', 'Itel',
    'Nokia', 'Motorola', 'Sony', 'LG', 'HTC',
  ];

  const filteredBrands = BRANDS.filter((b) =>
    b.toLowerCase().includes(brand.toLowerCase())
  );

  const handleNextToStep2 = async () => {
    setErrorMessage(null);
    if (!imei.trim()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

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

    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextToStep3 = () => {
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

    try {
      const registered = await api.registerPhone({
        imei1: imei.trim(),
        serialNumber: serialNumber.trim() || undefined,
        brand: brand.trim(),
        model: model.trim(),
        storageCapacity: storage,
        condition: conditionMap[condition] || 'NEW',
        warrantyDurationMonths: warrantyMonths,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : undefined,
      });

      setRegisteredItem({
        id: registered.id,
        imei: registered.imei1,
        model: registered.model,
        brand: registered.brand,
        storage: registered.storageCapacity || storage,
        condition: registered.condition || condition,
        qrCodeUrl: registered.qrCodeUrl,
        date: new Date(registered.createdAt || Date.now()).toISOString().split('T')[0],
      });
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Registration failed:', err);
      setErrorMessage(err.message || 'Failed to register phone. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8">
      
      {/* Top Header Row with Breadcrumbs & Action Buttons */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Register Phone
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 font-medium max-w-2xl mt-1 leading-relaxed">
            Register new devices into your inventory using the manufacturer's QR code, IMEI, or Serial Number. Ensure all metadata is captured for full traceability.
          </p>
        </div>

        <div className="shrink-0">
          <Button variant="secondary" size="sm" leftIcon={<Upload className="w-4 h-4 text-slate-600" />}>
            Bulk Registration
          </Button>
        </div>
      </div>

      {/* Stepper Navigation Indicator Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-1.5 sm:gap-4 overflow-x-auto pb-1 scrollbar-none">
          {/* Step 1 Indicator */}
          <button
            onClick={() => setStep(1)}
            className={`flex items-center gap-1.5 text-xs font-extrabold transition shrink-0 ${
              step === 1 ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center text-xs shrink-0 ${
              step === 1 ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-300 bg-white text-slate-500'
            }`}>
              1
            </span>
            <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">Identify</span>
          </button>

          <div className="w-4 sm:w-12 h-px bg-slate-200 shrink-0" />

          {/* Step 2 Indicator */}
          <button
            onClick={() => setStep(2)}
            className={`flex items-center gap-1.5 text-xs font-extrabold transition shrink-0 ${
              step === 2 ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center text-xs shrink-0 ${
              step === 2 ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-300 bg-white text-slate-500'
            }`}>
              2
            </span>
            <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">Details</span>
          </button>

          <div className="w-4 sm:w-12 h-px bg-slate-200 shrink-0" />

          {/* Step 3 Indicator */}
          <button
            onClick={() => setStep(3)}
            className={`flex items-center gap-1.5 text-xs font-extrabold transition shrink-0 ${
              step === 3 ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center text-xs shrink-0 ${
              step === 3 ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-300 bg-white text-slate-500'
            }`}>
              3
            </span>
            <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">Summary</span>
          </button>
        </div>

        {step > 1 && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 hover:text-slate-900 transition shrink-0 ml-2"
          >
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Back to Step {step - 1}</span><span className="inline sm:hidden">Back</span>
          </button>
        )}
      </div>

      {/* Main 12-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT 8 COLUMNS: FOCUSED STEP PAGE VIEWS                                   */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-6">

          {/* PAGE VIEW 1 — STEP 1: IDENTIFY DEVICE */}
          {step === 1 && (
            <section className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold shadow-sm">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Step 1: Identify Device</h2>
                  <p className="text-xs text-slate-500 font-medium">Scan box QR code or enter 15-digit IMEI number</p>
                </div>
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
                      IMEI: <strong>3582...450</strong> is already registered: <strong>Apple iPhone 15 Pro</strong> (Reg. 2026-07-12).
                    </p>
                  </div>
                </div>
              )}

              {/* Camera Scanner Trigger Box */}
              <div
                onClick={() => setShowCameraScanner(true)}
                className="p-4 sm:p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-all cursor-pointer flex flex-row items-center justify-center gap-4 sm:gap-6 group"
              >
                <div className="w-12 h-12 sm:w-20 sm:h-20 bg-white rounded-xl sm:rounded-2xl shadow-md border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <QrCode className="w-6 h-6 sm:w-10 sm:h-10 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-extrabold text-sm sm:text-lg text-blue-700">Scan Manufacturer QR</p>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 leading-tight">Camera will open automatically to scan barcode</p>
                </div>
              </div>

              {/* Inputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">IMEI Number *</label>
                  <input
                    type="text"
                    value={imei}
                    onChange={(e) => setImei(e.target.value)}
                    placeholder="Enter 15-digit IMEI"
                    className="w-full text-sm px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-mono font-semibold text-slate-900 shadow-subtle"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Serial Number</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="Enter S/N"
                    className="w-full text-sm px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 font-mono font-semibold text-slate-900 shadow-subtle"
                  />
                </div>
              </div>

              {/* Step 1 Action Bar */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleNextToStep2}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="shadow-md shadow-blue-600/10 font-bold w-full sm:w-auto"
                >
                  <span className="hidden sm:inline">Proceed to Step 2: Device Details</span>
                  <span className="inline sm:hidden">Proceed to Step 2</span>
                </Button>
              </div>
            </section>
          )}

          {/* PAGE VIEW 2 — STEP 2: DEVICE INFORMATION */}
          {step === 2 && (
            <section className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold shadow-sm">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Step 2: Device Information</h2>
                    <p className="text-xs text-slate-500 font-medium">Verify hardware specifications, storage, and condition</p>
                  </div>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-extrabold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Step 1
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
                    onBlur={() => setTimeout(() => setBrandOpen(false), 150)}
                    placeholder="e.g. Apple, Samsung…"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  {brandOpen && filteredBrands.length > 0 && (
                    <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden text-xs">
                      {filteredBrands.map((b) => (
                        <li
                          key={b}
                          onMouseDown={() => { setBrand(b); setBrandOpen(false); }}
                          className="px-4 py-2.5 font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition"
                        >
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Model Input */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">Model Name / Number *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g. iPhone 15 Pro Max"
                      className="w-full px-4 py-3 rounded-xl border border-blue-500 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Model Match
                    </span>
                  </div>
                </div>

                {/* Storage Capacity */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">Storage</label>
                  <select
                    value={storage}
                    onChange={(e) => setStorage(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="128 GB">128 GB</option>
                    <option value="256 GB">256 GB</option>
                    <option value="512 GB">512 GB</option>
                    <option value="1 TB">1 TB</option>
                  </select>
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
                            ? 'bg-blue-50 text-blue-700 border-2 border-blue-600 shadow-sm'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Warranty Duration */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">Warranty Duration</label>
                  <select
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value={0}>No Warranty</option>
                    <option value={1}>1 Month</option>
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months</option>
                    <option value={18}>18 Months</option>
                    <option value={24}>24 Months</option>
                  </select>
                </div>

                {/* Pricing Inputs: Purchase & Selling Price */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">Purchase Price / Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="e.g. 450.00"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">Selling Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="e.g. 699.00"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Optional Notes */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">Optional Notes</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add details about packaging, screen state, or battery health..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 resize-none"
                  />
                </div>
              </div>

              {/* Step 2 Action Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button variant="secondary" size="md" onClick={handleBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back to Step 1
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleNextToStep3}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="shadow-md shadow-blue-600/10 font-bold w-full sm:w-auto"
                >
                  <span className="hidden sm:inline">Proceed to Step 3: Summary Details</span>
                  <span className="inline sm:hidden">Proceed to Step 3</span>
                </Button>
              </div>
            </section>
          )}

          {/* PAGE VIEW 3 — STEP 3: REGISTRATION SUMMARY */}
          {step === 3 && (
            <section className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold shadow-sm">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Step 3: Registration Summary</h2>
                    <p className="text-xs text-slate-500 font-medium">Review device metadata before completing hardware log</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setStep(1)} className="text-xs font-bold text-slate-500 hover:text-slate-900">Step 1</button>
                  <span className="text-slate-300">•</span>
                  <button onClick={() => setStep(2)} className="text-xs font-bold text-slate-500 hover:text-slate-900">Step 2</button>
                </div>
              </div>

              {/* Summary Card Grid */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[10px]">Brand & Model</span>
                    <span className="font-extrabold text-slate-900 text-sm">{brand} {model}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[10px]">IMEI Number</span>
                    <span className="font-mono font-bold text-blue-700 text-sm">{imei || '358291049281910'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[10px]">Specifications</span>
                    <span className="font-bold text-slate-900">{storage} • {condition}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[10px]">Warranty Guarantee</span>
                    <span className="font-bold text-emerald-700">12 Months Active</span>
                  </div>
                </div>
              </div>

              {/* Step 3 Action Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button variant="secondary" size="md" onClick={handleBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back to Step 2
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  onClick={handleCompleteRegistration}
                  leftIcon={<Check className="w-5 h-5" />}
                  className="shadow-xl bg-emerald-600 hover:bg-emerald-500 border-none font-bold"
                >
                  Complete Registration & Log Device
                </Button>
              </div>
            </section>
          )}



        </div>

        {/* ========================================================================= */}
        {/* RIGHT 4 COLUMNS: SUMMARY STICKY SIDEBAR & GUIDANCE                        */}
        {/* RIGHT 4 COLUMNS: STEP-SPECIFIC SIDEBAR PANEL */}
        <aside className="lg:col-span-4 space-y-5">
          
          {/* DURING STEP 3: SHOW SUMMARY CARD */}
          {step === 3 ? (
            <section className="p-6 rounded-2xl bg-white border border-blue-600 ring-2 ring-blue-500/10 shadow-sm space-y-5 sticky top-20 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-blue-600/20">
                  3
                </span>
                <h2 className="text-lg font-extrabold text-slate-900">Registration Summary</h2>
              </div>

              <div className="space-y-3 text-xs border-b border-slate-100 pb-4 font-medium">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">IMEI/SN</span>
                  <span className="font-mono font-bold text-blue-700">{imei || '—'}</span>
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
                  <span className="text-slate-500">Storage</span>
                  <span className="font-bold text-slate-900">{storage}</span>
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
                  className="shadow-md shadow-blue-600/20 font-bold bg-emerald-600 hover:bg-emerald-500 border-none"
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
            /* DURING STEP 1 & 2: SHOW GUIDANCE & IMEI TIPS PANEL */
            <div className="space-y-5 sticky top-20 animate-in fade-in duration-200">
              {/* Registration Tips */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <span>Registration Guidance</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                  <li className="flex gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Ensure adequate lighting when scanning box QR codes.</span>
                  </li>
                  <li className="flex gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>IMEIs are always 15-digit numeric strings.</span>
                  </li>
                  <li className="flex gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Storage capacity affects device valuation in receipts.</span>
                  </li>
                </ul>
              </div>

              {/* Where to find IMEI */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Where to find IMEI</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 font-bold flex items-center justify-center text-[10px] text-blue-700 shadow-subtle">#1</span>
                    <span>Dial *#06# on phone dialer</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 font-bold flex items-center justify-center text-[10px] text-blue-700 shadow-subtle">#2</span>
                    <span>Back barcode label on retail box</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800">
                    <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 font-bold flex items-center justify-center text-[10px] text-blue-700 shadow-subtle">#3</span>
                    <span>SIM tray edge engraving</span>
                  </div>
                </div>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
                <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                  <Command className="w-4 h-4 text-blue-600" /> Keyboard Shortcuts
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span>Scan Barcode</span>
                    <kbd className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md font-mono text-[10px] font-bold text-slate-800 shadow-subtle">⌘ S</kbd>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span>Next Step</span>
                    <kbd className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md font-mono text-[10px] font-bold text-slate-800 shadow-subtle">Enter</kbd>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 font-medium">
                    <span>Clear Form</span>
                    <kbd className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md font-mono text-[10px] font-bold text-slate-800 shadow-subtle">Esc</kbd>
                  </div>
                </div>
              </div>
            </div>
          )}

        </aside>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40">
        <Button
          variant="primary"
          fullWidth
          size="lg"
          isLoading={isSubmitting}
          onClick={handleCompleteRegistration}
          className="shadow-xl"
        >
          Register Device
        </Button>
      </div>

      {/* Success Modal Overlay */}
      {showSuccessModal && registeredItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 animate-in fade-in zoom-in duration-200 border border-slate-200">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Device Registered!</h3>
              <p className="text-xs text-slate-600 font-medium mt-1">
                {registeredItem.model} (IMEI: {registeredItem.imei}) has been added to your inventory successfully.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <Link href="/dashboard/records">
                <Button variant="primary" fullWidth size="lg">
                  View in Inventory
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
                  setStep(1);
                }}
              >
                Register Another Phone
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ZXing Camera Scanner Modal */}
      {showCameraScanner && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Scan Box Barcode</h3>
              </div>
              <button
                onClick={() => setShowCameraScanner(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 min-h-[260px] flex items-center justify-center">
              <video id="zxing-register-video" className="w-full h-full min-h-[260px] object-cover" muted playsInline />
              
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none w-max max-w-[90%]">
                <div
                  className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold shadow-lg backdrop-blur-md transition-all flex items-center justify-center gap-1.5 ${
                    registerCameraGuidance.type === 'dark'
                      ? 'bg-amber-500 text-slate-950 animate-pulse border border-amber-300'
                      : registerCameraGuidance.type === 'warning'
                      ? 'bg-slate-900/90 text-amber-400 border border-amber-500/40'
                      : registerCameraGuidance.type === 'success'
                      ? 'bg-emerald-600 text-white border border-emerald-300'
                      : 'bg-slate-900/80 text-white border border-slate-700'
                  }`}
                >
                  {registerCameraGuidance.message}
                </div>
              </div>

              <div className="scanner-overlay-reticle">
                <div className="scanner-overlay-laser" />
              </div>
            </div>

            <p className="text-xs text-slate-500 text-center font-medium">
              Align phone box IMEI or Serial Number barcode inside green box to auto-populate form.
            </p>

            <Button
              variant="secondary"
              fullWidth
              size="md"
              onClick={() => setShowCameraScanner(false)}
            >
              Cancel Scan
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
