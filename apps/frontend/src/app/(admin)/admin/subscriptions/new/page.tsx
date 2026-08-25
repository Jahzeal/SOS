'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Info,
  CreditCard,
  Layers,
  Eye,
  ShieldCheck,
  Smartphone,
  Users,
  Store,
  Verified,
  Save,
  CheckCircle,
  X,
  Gauge,
  HelpCircle,
  Clock,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function CreateSubscriptionPlanPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isPublished, setIsPublished] = useState<boolean>(false);

  // Form State
  const [planName, setPlanName] = useState('Gold');
  const [description, setDescription] = useState('For growing phone retailers expanding their operations.');
  const [monthlyPrice, setMonthlyPrice] = useState<number>(50000);
  const [annualPrice, setAnnualPrice] = useState<number>(540000);

  // Limits
  const [unlimitedDevices, setUnlimitedDevices] = useState(false);
  const [deviceLimit, setDeviceLimit] = useState<number>(2500);
  const [unlimitedUsers, setUnlimitedUsers] = useState(false);
  const [userLimit, setUserLimit] = useState<number>(10);
  const [unlimitedBranches, setUnlimitedBranches] = useState(false);
  const [branchLimit, setBranchLimit] = useState<number>(5);
  const [unlimitedVerifications, setUnlimitedVerifications] = useState(false);
  const [verificationLimit, setVerificationLimit] = useState<number>(5000);

  // Features
  const [features, setFeatures] = useState({
    imeiVerification: {
      enabled: true,
      name: 'IMEI Verification',
      desc: 'Real-time verification of device IMEI against national databases.',
    },
    deviceInventory: {
      enabled: true,
      name: 'Device Inventory',
      desc: 'Manage and track your entire device catalog securely.',
    },
    multipleBranches: {
      enabled: false,
      name: 'Multiple Branches',
      desc: 'Support hierarchical location structures for enterprise clients.',
    },
    staffAccounts: {
      enabled: true,
      name: 'Staff Accounts',
      desc: 'Assign roles and permissions to your store team members.',
    },
    apiAccess: {
      enabled: true,
      name: 'API Access',
      desc: 'Programmatic lookup access for internal POS and inventory systems.',
    },
    emailSupport: {
      enabled: true,
      name: 'Email Support',
      desc: 'Direct email support assistance for all business operations.',
    },
  });

  // Visibility & Settings
  const [status, setStatus] = useState<'active' | 'draft' | 'archived'>('active');
  const [displayOrder, setDisplayOrder] = useState<number>(2);
  const [badgeText, setBadgeText] = useState('Most Popular');
  const [isRecommended, setIsRecommended] = useState(true);

  // Savings calculation
  const expectedAnnual = monthlyPrice * 12;
  const savingsAmount = expectedAnnual > annualPrice ? expectedAnnual - annualPrice : 0;
  const savingsPercent = expectedAnnual > 0 && savingsAmount > 0
    ? ((savingsAmount / expectedAnnual) * 100).toFixed(1)
    : '0';

  const steps = [
    { num: 1, label: 'Basic Info' },
    { num: 2, label: 'Pricing' },
    { num: 3, label: 'Limits' },
    { num: 4, label: 'Features' },
    { num: 5, label: 'Visibility' },
    { num: 6, label: 'Review' },
  ];

  const handlePublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setIsPublished(true);
    }, 1000);
  };

  const handleReset = () => {
    setIsPublished(false);
    setCurrentStep(1);
    setPlanName('Platinum Plus');
  };

  // SUCCESS SCREEN (Step Published Screen)
  if (isPublished) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 font-sans max-w-md mx-auto w-full">
        {/* Header / Success Message */}
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center shadow-md shadow-blue-600/10">
            <CheckCircle2 className="w-9 h-9 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Plan published</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              <strong>{planName}</strong> is now available to businesses for immediate subscription and renewal.
            </p>
          </div>
        </div>

        {/* Plan Overview Card */}
        <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle mb-4">
          <h2 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-3">
            Plan Overview
          </h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Plan Name</span>
              <span className="font-extrabold text-slate-900 text-sm">{planName}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] uppercase border border-blue-200">
                {status}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Monthly Rate</span>
              <span className="font-mono font-bold text-slate-900 text-sm">₦ {monthlyPrice.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Annual Rate</span>
              <span className="font-mono font-bold text-slate-900 text-sm">₦ {annualPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Audit Log Generated Section */}
        <div className="w-full mb-6">
          <h2 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
            Audit Log Generated
          </h2>
          <div className="bg-slate-100/90 border border-slate-200 rounded-2xl p-4 font-mono text-[11px] text-slate-700 leading-relaxed shadow-sm">
            &gt; Admin created plan<br />
            • Plan: {planName}<br />
            • Pricing: ₦ {monthlyPrice.toLocaleString()}/month, ₦ {annualPrice.toLocaleString()}/year<br />
            • Created by: System Admin<br />
            • Timestamp: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={handleReset}
            className="w-full h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
          >
            Create Another Plan
          </button>
          <Link
            href="/admin/subscriptions"
            className="w-full h-[44px] bg-white text-blue-600 hover:bg-slate-50 border border-slate-200 font-bold text-xs rounded-xl flex items-center justify-center transition-colors shadow-subtle"
          >
            View Subscriptions List
          </Link>
        </div>
      </div>
    );
  }

  // MULTI-STEP CREATION FLOW
  return (
    <div className="flex flex-col flex-1 pb-24 font-sans w-full max-w-[1400px] mx-auto">
      {/* Top Mobile Bar */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 -mx-3.5 px-4 py-3 flex items-center justify-between mb-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/subscriptions"
            className="p-1 rounded-full text-slate-500 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </Link>
          <span className="font-extrabold text-slate-900 text-sm">Create Plan</span>
        </div>
        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
          Step {currentStep} of 6
        </span>
      </div>

      {/* Mobile Connected Stepper (1------2------3------4------5------6) */}
      <div className="md:hidden mb-6 px-1">
        <div className="flex items-center justify-between w-full">
          {steps.map((s, idx) => (
            <React.Fragment key={s.num}>
              {/* Step Circle Node */}
              <button
                type="button"
                onClick={() => setCurrentStep(s.num)}
                className="flex flex-col items-center relative z-10"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                    currentStep === s.num
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-105'
                      : currentStep > s.num
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                  }`}
                >
                  {currentStep > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                </div>
              </button>

              {/* Connecting Line (1-----2) */}
              {idx < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-1 transition-colors duration-200">
                  <div
                    className={`h-full rounded-full ${
                      currentStep > s.num ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-2 text-center">
          <span className="text-xs font-extrabold text-slate-800">
            Step {currentStep}: {steps[currentStep - 1].label}
          </span>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2 text-slate-500 mb-1.5 text-xs font-semibold">
            <Link href="/admin/subscriptions" className="hover:text-blue-600 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Subscriptions</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800">Create Plan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create New Subscription Plan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Configure pricing tiers, usage thresholds, and feature entitlements for retail stores.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="px-4 h-[38px] border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-subtle"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      {/* Desktop 6-Step Progress Indicator */}
      <div className="hidden md:block mb-8 w-full overflow-x-auto no-scrollbar pb-2">
        <div className="flex items-center min-w-max bg-white border border-slate-200 rounded-2xl p-3 shadow-subtle">
          {steps.map((s, idx) => (
            <React.Fragment key={s.num}>
              <button
                type="button"
                onClick={() => setCurrentStep(s.num)}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all ${
                  currentStep === s.num
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : currentStep > s.num
                    ? 'text-slate-700 font-semibold hover:bg-slate-50'
                    : 'text-slate-400 font-medium'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep === s.num
                      ? 'bg-blue-600 text-white'
                      : currentStep > s.num
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {currentStep > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                </div>
                <span className="text-xs">{s.label}</span>
              </button>

              {idx < steps.length - 1 && <div className="w-6 h-[1px] bg-slate-200 mx-1" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Form Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-subtle space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  <span>Basic Information</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Define the plan name and public display summary for retail stores.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Plan Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="e.g. Gold, Premium Enterprise"
                    className="w-full h-[40px] px-3.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">Must be unique across all active subscription tiers.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief note on target audience..."
                    className="w-full p-3.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors resize-none"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">Concise description displayed on the pricing tier card.</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Pricing Details */}
          {currentStep === 2 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-subtle space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span>Pricing Details</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Set recurring monthly and annual subscription rates in Naira.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Currency</label>
                  <input
                    type="text"
                    disabled
                    value="Nigerian Naira (₦)"
                    className="w-full h-[40px] px-3.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 cursor-not-allowed"
                  />
                  <p className="font-body-sm text-[11px] text-slate-500 mt-1">Currency is fixed to NGN for local verifications.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Monthly Price (₦)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">₦</span>
                      <input
                        type="number"
                        value={monthlyPrice}
                        onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                        className="w-full h-[40px] pl-8 pr-3 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Annual Price (₦)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">₦</span>
                      <input
                        type="number"
                        value={annualPrice}
                        onChange={(e) => setAnnualPrice(Number(e.target.value))}
                        className="w-full h-[40px] pl-8 pr-3 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {savingsAmount > 0 && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 font-bold">
                    <span>Annual Discount Savings</span>
                    <span className="font-mono">Saves ₦{savingsAmount.toLocaleString()} / year ({savingsPercent}%)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Usage Limits */}
          {currentStep === 3 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-subtle space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-blue-600" />
                  <span>Usage Limits</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Define operational boundaries and thresholds for this subscription tier.
                </p>
              </div>

              <div className="space-y-4">
                {/* Device Limit */}
                <div className={`p-4 border rounded-xl transition ${unlimitedDevices ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <label className="text-xs font-bold text-slate-800">Device Limit</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-500">Unlimited</span>
                      <input
                        type="checkbox"
                        checked={unlimitedDevices}
                        onChange={(e) => setUnlimitedDevices(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 w-4 h-4 cursor-pointer"
                      />
                    </div>
                  </div>
                  <input
                    type="number"
                    disabled={unlimitedDevices}
                    value={unlimitedDevices ? '' : deviceLimit}
                    onChange={(e) => setDeviceLimit(Number(e.target.value))}
                    placeholder={unlimitedDevices ? 'Unlimited Devices' : '2500'}
                    className="w-full bg-transparent border-none p-0 text-sm font-mono font-bold text-slate-900 focus:ring-0 placeholder:text-slate-400 disabled:text-slate-400"
                  />
                </div>

                {/* User Limit */}
                <div className={`p-4 border rounded-xl transition ${unlimitedUsers ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <label className="text-xs font-bold text-slate-800">User Limit</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-500">Unlimited</span>
                      <input
                        type="checkbox"
                        checked={unlimitedUsers}
                        onChange={(e) => setUnlimitedUsers(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 w-4 h-4 cursor-pointer"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    disabled={unlimitedUsers}
                    value={unlimitedUsers ? 'Unlimited' : userLimit}
                    onChange={(e) => setUserLimit(Number(e.target.value))}
                    className="w-full bg-transparent border-none p-0 text-sm font-mono font-bold text-slate-900 focus:ring-0 disabled:text-blue-700"
                  />
                </div>

                {/* Branch Limit */}
                <div className={`p-4 border rounded-xl transition ${unlimitedBranches ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <label className="text-xs font-bold text-slate-800">Branch Limit</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-500">Unlimited</span>
                      <input
                        type="checkbox"
                        checked={unlimitedBranches}
                        onChange={(e) => setUnlimitedBranches(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 w-4 h-4 cursor-pointer"
                      />
                    </div>
                  </div>
                  <input
                    type="number"
                    disabled={unlimitedBranches}
                    value={unlimitedBranches ? '' : branchLimit}
                    onChange={(e) => setBranchLimit(Number(e.target.value))}
                    placeholder={unlimitedBranches ? 'Unlimited Branches' : '5'}
                    className="w-full bg-transparent border-none p-0 text-sm font-mono font-bold text-slate-900 focus:ring-0 placeholder:text-slate-400 disabled:text-slate-400"
                  />
                </div>

                {/* Verification Limit */}
                <div className={`p-4 border rounded-xl transition ${unlimitedVerifications ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <label className="text-xs font-bold text-slate-800">Verification Limit (Monthly)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-500">Unlimited</span>
                      <input
                        type="checkbox"
                        checked={unlimitedVerifications}
                        onChange={(e) => setUnlimitedVerifications(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 w-4 h-4 cursor-pointer"
                      />
                    </div>
                  </div>
                  <input
                    type="number"
                    disabled={unlimitedVerifications}
                    value={unlimitedVerifications ? '' : verificationLimit}
                    onChange={(e) => setVerificationLimit(Number(e.target.value))}
                    placeholder={unlimitedVerifications ? 'Unlimited Monthly Lookups' : '5000'}
                    className="w-full bg-transparent border-none p-0 text-sm font-mono font-bold text-slate-900 focus:ring-0 placeholder:text-slate-400 disabled:text-slate-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Features */}
          {currentStep === 4 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-subtle space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span>Features</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Enable functional capabilities and tools included in this plan tier.
                </p>
              </div>

              <div className="space-y-3">
                {Object.entries(features).map(([key, feat]) => (
                  <div
                    key={key}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-xs font-bold text-slate-900">{feat.name}</h4>
                      <input
                        type="checkbox"
                        checked={feat.enabled}
                        onChange={(e) =>
                          setFeatures({
                            ...features,
                            [key]: { ...feat, enabled: e.target.checked },
                          })
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">{feat.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Visibility Settings (Matching Mobile Step 5 & 6 Screen) */}
          {currentStep === 5 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-subtle space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <span>Visibility Settings</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Configure storefront visibility, recommendation tags, and sorting precedence.
                </p>
              </div>

              {/* Status Section */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4">
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Status
                </p>
                <div className="space-y-2.5">
                  {(['draft', 'active', 'archived'] as const).map((st) => (
                    <label key={st} className="flex items-center cursor-pointer group">
                      <input
                        type="radio"
                        name="planStatusRadio"
                        value={st}
                        checked={status === st}
                        onChange={() => setStatus(st)}
                        className="rounded-full border-slate-300 text-blue-600 focus:ring-blue-600 w-4 h-4 mr-3 cursor-pointer"
                      />
                      <span className={`text-xs capitalize ${status === st ? 'font-bold text-slate-900' : 'text-slate-600 font-medium'}`}>
                        {st}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4 bg-slate-50/70 border border-slate-200 rounded-xl p-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="displayOrder">
                    Display Order
                  </label>
                  <input
                    id="displayOrder"
                    type="number"
                    min={1}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-full h-[40px] px-3.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="badgeText">
                    Badge Text (Optional)
                  </label>
                  <input
                    id="badgeText"
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="e.g. Most Popular"
                    className="w-full h-[40px] px-3.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Mark as Recommended</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Visually highlights this plan above others.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isRecommended}
                    onChange={(e) => setIsRecommended(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 w-5 h-5 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Review Plan (Matching Step 5 & 6 Screen) */}
          {currentStep === 6 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-subtle space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span>Review Plan</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Confirm all operational parameters before publishing to active businesses.
                </p>
              </div>

              {/* Summary Card Container */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm text-xs">
                {/* Summary Header */}
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-base font-extrabold text-slate-900">{planName}</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold uppercase tracking-wider text-[10px] border border-blue-200">
                    {status}
                  </span>
                </div>

                {/* Pricing Block */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">Pricing</p>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="font-mono font-bold text-blue-600 text-base">₦{monthlyPrice.toLocaleString()}</span>
                    <span className="text-slate-500">/ month</span>
                  </div>
                  <div className="flex items-baseline space-x-1.5 mt-0.5">
                    <span className="font-mono font-semibold text-slate-800">₦{annualPrice.toLocaleString()}</span>
                    <span className="text-slate-500">/ year</span>
                  </div>
                </div>

                {/* Limits Block */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">Limits</p>
                  <ul className="space-y-1.5 text-slate-700 font-medium">
                    <li className="flex items-center">
                      <Smartphone className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                      <span>{unlimitedDevices ? 'Unlimited devices' : `${deviceLimit.toLocaleString()} devices`}</span>
                    </li>
                    <li className="flex items-center">
                      <Users className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                      <span>{unlimitedUsers ? 'Unlimited users' : `${userLimit.toLocaleString()} users`}</span>
                    </li>
                    <li className="flex items-center">
                      <Store className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                      <span>{unlimitedBranches ? 'Unlimited branches' : `${branchLimit.toLocaleString()} branches`}</span>
                    </li>
                    <li className="flex items-center">
                      <Verified className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                      <span>{unlimitedVerifications ? 'Unlimited verifications/mo' : `${verificationLimit.toLocaleString()} verifications/mo`}</span>
                    </li>
                  </ul>
                </div>

                {/* Features Block */}
                <div className="px-4 py-3 bg-slate-50/50">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">Features</p>
                  <ul className="space-y-1.5">
                    {Object.values(features)
                      .filter((f) => f.enabled)
                      .map((f) => (
                        <li key={f.name} className="flex items-center text-slate-800 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 mr-2 shrink-0" />
                          <span>{f.name}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Stepper Navigation Buttons */}
          <div className="hidden md:flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              className="px-5 h-[38px] border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center gap-2 disabled:opacity-40 disabled:hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
                className="px-6 h-[38px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing}
                className="px-6 h-[38px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-60"
              >
                {isPublishing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Publishing Plan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Publish Plan</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Live Sticky Plan Summary (Desktop Preview) */}
        <div className="hidden lg:block lg:col-span-1 sticky top-24">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-subtle flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Live Plan Summary</h3>
                <p className="text-[11px] text-slate-400 font-medium">Real-time catalog preview</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                {status}
              </span>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-base font-extrabold text-slate-900">{planName || 'Untitled Plan'}</h4>
                  {badgeText && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                      {badgeText}
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-[11px] font-medium leading-relaxed">{description}</p>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Pricing</span>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-medium">Monthly</span>
                    <div className="font-mono font-bold text-slate-900">₦{monthlyPrice.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-medium">Annually</span>
                    <div className="font-mono font-bold text-slate-900">₦{annualPrice.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Limits</span>
                <div className="space-y-1.5 mt-1.5 text-slate-700 font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Devices:</span>
                    <span className="font-mono font-bold text-slate-900">{unlimitedDevices ? 'Unlimited' : deviceLimit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Users:</span>
                    <span className="font-mono font-bold text-slate-900">{unlimitedUsers ? 'Unlimited' : userLimit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Branches:</span>
                    <span className="font-mono font-bold text-slate-900">{unlimitedBranches ? 'Unlimited' : branchLimit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Verifications/mo:</span>
                    <span className="font-mono font-bold text-slate-900">{unlimitedVerifications ? 'Unlimited' : verificationLimit.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Enabled Features</span>
                <div className="space-y-1 mt-1.5">
                  {Object.values(features)
                    .filter((f) => f.enabled)
                    .map((f) => (
                      <div key={f.name} className="flex items-center gap-1.5 text-slate-800 font-medium text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{f.name}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/70">
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing}
                className="w-full h-[40px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-60"
              >
                {isPublishing ? (
                  <span>Publishing...</span>
                ) : (
                  <span>Publish Plan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Bottom Action Bar on Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 px-4 py-3 z-50 flex items-center justify-between shadow-lg">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            className="flex items-center justify-center text-slate-700 border border-slate-200 rounded-xl px-5 py-2.5 text-xs font-bold active:scale-95 transition bg-transparent"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span>Previous</span>
          </button>
        ) : (
          <div />
        )}

        {currentStep < 6 ? (
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
            className="flex items-center justify-center bg-blue-600 text-white rounded-xl px-6 py-2.5 text-xs font-bold active:scale-95 transition shadow-sm"
          >
            <span>Next Step</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2.5 text-xs font-bold active:scale-95 transition shadow-sm disabled:opacity-60"
          >
            {isPublishing ? (
              <span>Publishing...</span>
            ) : (
              <>
                <span>Publish Plan</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
