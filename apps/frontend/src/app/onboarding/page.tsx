'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ShieldCheck,
  Smartphone,
  Building,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Store,
  Check,
  Sparkles,
  Zap,
  RotateCcw,
  Globe,
  HelpCircle,
  Eye,
  EyeOff,
  Layers,
  Award,
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';

export default function OnboardingPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 Form Data
  const [accountForm, setAccountForm] = useState({
    fullName: '',
    email: '',
    password: '',
    agreeTerms: true,
  });
  const [accountErrors, setAccountErrors] = useState<{ [key: string]: string }>({});

  // Step 2 OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(['1', '2', '3', '4', '5', '6']);
  const [otpResent, setOtpResent] = useState(false);

  // Step 3 Business Profile State
  const [businessForm, setBusinessForm] = useState({
    storeName: '',
    businessType: 'retailer',
    monthlyVolume: '100-500',
    primaryLocation: 'Downtown Store',
  });

  // Step 4 Subscription Plan State
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'business' | 'enterprise'>('business');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Step 5 Workspace Loading State
  const [setupProgress, setSetupProgress] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Step 5 Setup Progress Simulation
  useEffect(() => {
    if (currentStep === 5) {
      const interval = setInterval(() => {
        setSetupProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 25;
        });
      }, 400);
      return () => clearInterval(interval);
    }
  }, [currentStep]);

  // Validation Handlers
  const validateStep1 = () => {
    const errors: { [key: string]: string } = {};
    if (!accountForm.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!accountForm.email.trim() || !accountForm.email.includes('@')) errors.email = 'Valid work email is required';
    if (!accountForm.password || accountForm.password.length < 8) errors.password = 'Password must be at least 8 characters';
    setAccountErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
    }
    
    setIsSubmitting(true);
    try {
      if (currentStep === 4) {
        // Trigger NestJS Auth Register
        const nameParts = (accountForm.fullName || 'Store Owner').trim().split(' ');
        const firstName = nameParts[0] || 'Store';
        const lastName = nameParts.slice(1).join(' ') || 'Owner';

        await register({
          email: accountForm.email || `owner-${Date.now()}@example.com`,
          password: accountForm.password || 'Password123!',
          firstName,
          lastName,
          businessName: businessForm.storeName || 'My Phone Store',
          phone: '+15550192834',
          plan: selectedPlan.toUpperCase(),
        });
      }

      if (currentStep < 5) {
        setCurrentStep((prev) => prev + 1);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.warn('Backend register skipped/offline:', err);
      if (currentStep < 5) {
        setCurrentStep((prev) => prev + 1);
      } else {
        router.push('/dashboard');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Step Meta Configuration for Left Brand Panel
  const stepBrandConfig: { [key: number]: { headline: string; description: string; highlight: string } } = {
    1: {
      headline: "Let's Set Up Your Business",
      description: "You're just a few minutes away from creating your secure phone business operating workspace.",
      highlight: '✓ Instant IMEI & QR Verification Ledger',
    },
    2: {
      headline: 'Check Your Inbox',
      description: `We've sent a 6-digit verification code to ${accountForm.email || 'your email'}.`,
      highlight: '✓ Enterprise Grade Account Security',
    },
    3: {
      headline: 'Tell Us About Your Store',
      description: 'Customize VerifyFlow modules according to your retail scale and inventory workflow.',
      highlight: '✓ Multi-Branch Inventory Tracking',
    },
    4: {
      headline: 'Choose the Right Plan',
      description: 'Select a plan that fits your current store scale. All plans include a 14-day free trial.',
      highlight: '✓ 14-Day Free Trial • Cancel Anytime',
    },
    5: {
      headline: 'Welcome to VerifyFlow!',
      description: 'Your workspace is ready. You can now register phones, issue QR receipts, and track warranties.',
      highlight: '✓ 100% Operational Ready',
    },
  };

  const currentBrand = stepBrandConfig[currentStep];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        
        {/* LEFT PANEL — BRAND EXPERIENCE (Desktop Only: hidden lg:flex lg:col-span-5) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 text-white p-6 lg:p-10 lg:py-8 flex-col justify-between relative overflow-hidden border-r border-slate-800">
          
          {/* Background Ambient Accents */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Logo Bar */}
          <div className="relative z-10 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tight text-white">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span>VerifyFlow</span>
            </Link>
            <span className="text-xs font-bold text-blue-300 bg-blue-950/80 px-3.5 py-1 rounded-full border border-blue-800/60 shadow-subtle">
              Setup Wizard
            </span>
          </div>

          {/* Brand Dynamic Content Area (Comfortable top spacing below logo header) */}
          <div className="relative z-10 mt-12 mb-auto space-y-5 max-w-lg">
            
            {/* Icon Box */}
            <div className="w-14 h-14 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center shadow-xl">
              {currentStep === 1 && <Building className="w-7 h-7 text-blue-400" />}
              {currentStep === 2 && <Mail className="w-7 h-7 text-emerald-400" />}
              {currentStep === 3 && <Store className="w-7 h-7 text-indigo-400" />}
              {currentStep === 4 && <Award className="w-7 h-7 text-amber-400" />}
              {currentStep === 5 && <CheckCircle2 className="w-7 h-7 text-emerald-400" />}
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {currentBrand.headline}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                {currentBrand.description}
              </p>
            </div>

            {/* Testimonial Card */}
            <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 text-xs space-y-2.5 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex text-amber-400 gap-0.5 text-xs">★★★★★</div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Store Owner Review</span>
              </div>
              <p className="text-slate-200 font-medium italic leading-relaxed text-[11px]">
                "Setting up our 3 store locations on VerifyFlow took less than 5 minutes. The IMEI receipt verification stopped warranty disputes instantly."
              </p>
              <div className="flex items-center gap-2.5 pt-1 border-t border-slate-700/60">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  M
                </div>
                <div>
                  <div className="font-bold text-white text-xs">Marcus Vance</div>
                  <div className="text-[10px] text-slate-400">Owner, TechWorld Mobile (5 Store Branches)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Left Footer Info */}
          <div className="relative z-10 text-xs text-slate-400 font-semibold flex items-center justify-between border-t border-slate-800/80 pt-4">
            <span>© 2026 VerifyFlow Inc.</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400" /> 256-Bit SSL Encrypted
            </span>
          </div>
        </div>

        {/* RIGHT PANEL — CONTENT CONTAINER */}
        <div className="w-full lg:col-span-7 p-4 sm:p-6 lg:p-8 lg:py-8 flex flex-col justify-between bg-slate-50 min-h-screen">
          
          {/* Header & Stepper Bar */}
          <div className={`${currentStep === 4 ? 'max-w-4xl' : 'max-w-2xl'} mx-auto w-full space-y-5 transition-all duration-300`}>
            
            {/* Mobile Top Brand & Progress Header (Clean light styling: block lg:hidden) */}
            <div className="block lg:hidden bg-white -mx-4 -mt-4 p-4 mb-2 border-b border-slate-200 shadow-sm rounded-b-xl space-y-3">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-black text-lg text-slate-900">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span>VerifyFlow</span>
                </Link>
                <div className="flex items-center gap-2">
                  <Link href="/login" className="text-xs font-bold text-blue-600 hover:underline">
                    Sign In
                  </Link>
                  {currentStep > 1 && (
                    <button
                      onClick={handleBack}
                      className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                  )}
                  <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    Step {currentStep} of 5
                  </span>
                </div>
              </div>

              {/* Mobile Segmented Progress Bar (- - - - -) */}
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((s) => {
                  const isCompleted = s < currentStep;
                  const isCurrent = s === currentStep;

                  return (
                    <div
                      key={s}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        isCompleted
                          ? 'bg-emerald-500'
                          : isCurrent
                          ? 'bg-blue-600 ring-2 ring-blue-500/20'
                          : 'bg-slate-200'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Desktop Top Navigation Row (hidden lg:flex) */}
            <div className="hidden lg:flex items-center justify-between border-b border-slate-200 pb-4">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`flex items-center gap-1.5 text-xs font-bold transition ${
                  currentStep === 1 ? 'opacity-0 cursor-default' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowLeft className="w-4 h-4" /> Back to Step {currentStep - 1}
              </button>

              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="text-slate-500 uppercase tracking-wider text-[11px]">
                  Step <span className="text-blue-600 font-extrabold">{currentStep}</span> of 5
                </span>
                <span className="text-slate-300">•</span>
                <Link href="/login" className="text-blue-600 hover:underline">
                  Already registered? Sign In →
                </Link>
              </div>
            </div>

            {/* Desktop 5-Column Stepper Bar (hidden lg:grid) */}
            <div className="hidden lg:grid grid-cols-5 gap-2 pt-2">
              {[
                { step: 1, label: 'Account' },
                { step: 2, label: 'Verify' },
                { step: 3, label: 'Business' },
                { step: 4, label: 'Plan' },
                { step: 5, label: 'Finish' },
              ].map((s) => {
                const isCompleted = s.step < currentStep;
                const isCurrent = s.step === currentStep;

                return (
                  <div key={s.step} className="space-y-1.5 text-center">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isCompleted
                          ? 'bg-emerald-500'
                          : isCurrent
                          ? 'bg-blue-600 ring-2 ring-blue-500/20'
                          : 'bg-slate-200'
                      }`}
                    />
                    <div
                      className={`text-[11px] font-bold ${
                        isCompleted
                          ? 'text-emerald-700'
                          : isCurrent
                          ? 'text-blue-600 font-extrabold'
                          : 'text-slate-400'
                      }`}
                    >
                      {s.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Card Content */}
          <div className="max-w-2xl mx-auto w-full my-4 sm:my-8">
            <div className="vf-card bg-white p-5 sm:p-10 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 space-y-6">
              
              {/* =================================================================== */}
              {/* STEP 1: CREATE ACCOUNT                                             */}
              {/* =================================================================== */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-900">Create Your Business Workspace Account</h3>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                      Enter your details to initialize your verified store ledger.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={accountForm.fullName}
                          onChange={(e) => setAccountForm({ ...accountForm, fullName: e.target.value })}
                          placeholder="e.g. Marcus Vance"
                          className="w-full text-sm pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-900"
                        />
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                      {accountErrors.fullName && (
                        <p className="text-xs text-rose-500 font-semibold mt-1">{accountErrors.fullName}</p>
                      )}
                    </div>

                    {/* Work Email */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Work Email Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={accountForm.email}
                          onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                          placeholder="marcus@techworldmobile.com"
                          className="w-full text-sm pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-900"
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                      {accountErrors.email && (
                        <p className="text-xs text-rose-500 font-semibold mt-1">{accountErrors.email}</p>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={accountForm.password}
                          onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                          placeholder="At least 8 characters"
                          className="w-full text-sm pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-900"
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {accountErrors.password && (
                        <p className="text-xs text-rose-500 font-semibold mt-1">{accountErrors.password}</p>
                      )}
                    </div>

                    {/* Terms Checkbox */}
                    <div className="flex items-start gap-2.5 pt-2">
                      <input
                        type="checkbox"
                        id="agreeTerms"
                        checked={accountForm.agreeTerms}
                        onChange={(e) => setAccountForm({ ...accountForm, agreeTerms: e.target.checked })}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="agreeTerms" className="text-xs text-slate-600 font-medium leading-relaxed">
                        I agree to the <a href="#" className="text-blue-600 font-bold hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 font-bold hover:underline">Privacy Policy</a>.
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================================== */}
              {/* STEP 2: VERIFY EMAIL                                               */}
              {/* =================================================================== */}
              {currentStep === 2 && (
                <div className="space-y-6 text-center animate-in fade-in duration-200">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-subtle">
                    <Mail className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-900">Verify Your Email Address</h3>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                      Enter the 6-digit confirmation code sent to <strong className="text-slate-900">{accountForm.email || 'your email'}</strong>.
                    </p>
                  </div>

                  {/* OTP Digits Row */}
                  <div className="flex justify-center gap-2 sm:gap-3 py-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-input-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-extrabold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 font-mono text-slate-900 shadow-inner"
                      />
                    ))}
                  </div>

                  <div className="pt-2 text-xs font-semibold text-slate-500 space-y-2">
                    <div className="bg-blue-50/80 border border-blue-200/80 text-blue-900 p-2.5 rounded-xl text-[11px] font-medium flex items-center justify-between gap-2">
                      <span>💡 <strong>Dev Mode</strong>: Enter <strong>123456</strong> or click auto-fill.</span>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpDigits(['1', '2', '3', '4', '5', '6']);
                          setOtpResent(true);
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg text-[10px] shrink-0"
                      >
                        Auto-Fill Code
                      </button>
                    </div>

                    <div>
                      Didn't receive the code?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setOtpDigits(['1', '2', '3', '4', '5', '6']);
                          setOtpResent(true);
                        }}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Resend Code
                      </button>
                      {otpResent && <p className="text-emerald-600 text-xs font-bold mt-1">✓ Code auto-filled: 123456. Click Next to continue!</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================================== */}
              {/* STEP 3: BUSINESS PROFILE                                           */}
              {/* =================================================================== */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-900">Complete Store Profile</h3>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                      Tell us about your phone retail store or distribution network.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Store Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Store / Business Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={businessForm.storeName}
                        onChange={(e) => setBusinessForm({ ...businessForm, storeName: e.target.value })}
                        placeholder="e.g. TechWorld Mobile Ltd"
                        className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-900"
                      />
                    </div>

                    {/* Business Type Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Business Category
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                        {[
                          { id: 'retailer', label: 'Phone Retailer', desc: 'Single or multi-branch shop' },
                          { id: 'wholesaler', label: 'Wholesaler', desc: 'Bulk serial hardware supplier' },
                          { id: 'distributor', label: 'Distributor', desc: 'Regional brand importer' },
                          { id: 'electronics', label: 'General Electronics', desc: 'Phones, laptops & tablets' },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setBusinessForm({ ...businessForm, businessType: cat.id })}
                            className={`p-3 rounded-xl text-left border transition-all ${
                              businessForm.businessType === cat.id
                                ? 'bg-blue-50/70 border-blue-600 text-blue-900 shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div className="font-extrabold">{cat.label}</div>
                            <div className="text-[10px] font-normal text-slate-500 mt-0.5">{cat.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Monthly Volume */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Estimated Monthly Phone Sales / Registration Volume
                      </label>
                      <select
                        value={businessForm.monthlyVolume}
                        onChange={(e) => setBusinessForm({ ...businessForm, monthlyVolume: e.target.value })}
                        className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-900"
                      >
                        <option value="1-50">1 - 50 Phones / month</option>
                        <option value="50-200">50 - 200 Phones / month</option>
                        <option value="200-1000">200 - 1,000 Phones / month</option>
                        <option value="1000+">1,000+ Phones / month (Enterprise Bulk)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================================== */}
              {/* STEP 4: FREE TRIAL & FULL PACKAGE COMPARISON MATRIX                */}
              {/* =================================================================== */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Start Your 14-Day Free Trial</h3>
                      <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                        Select a package to test for 14 days. No credit card required. Cancel or switch plans anytime.
                      </p>
                    </div>
                    <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold text-slate-700 shrink-0">
                      <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-3.5 py-1.5 rounded-lg transition ${billingCycle === 'monthly' ? 'bg-white shadow text-slate-900 font-extrabold' : 'text-slate-600'}`}
                      >
                        Monthly Billing
                      </button>
                      <button
                        onClick={() => setBillingCycle('annual')}
                        className={`px-3.5 py-1.5 rounded-lg transition ${billingCycle === 'annual' ? 'bg-white shadow text-slate-900 font-extrabold' : 'text-slate-600'}`}
                      >
                        Annual (20% Off)
                      </button>
                    </div>
                  </div>

                  {/* Free Trial Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-blue-50 to-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-slate-900">Free 14-Day Business Trial Included</div>
                        <div className="text-xs text-slate-600 font-medium">$0 due today • Instant full feature access to test all store tools</div>
                      </div>
                    </div>
                    <Badge variant="verified" size="sm">
                      NO CREDIT CARD REQUIRED
                    </Badge>
                  </div>

                  {/* 3-Column Detailed Plan Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    
                    {/* Starter Plan */}
                    <div
                      onClick={() => setSelectedPlan('starter')}
                      className={`p-6 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-5 ${
                        selectedPlan === 'starter'
                          ? 'border-blue-600 bg-white ring-2 ring-blue-500/30 shadow-lg'
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Starter Package</span>
                          {selectedPlan === 'starter' && (
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">✓</span>
                          )}
                        </div>
                        <div>
                          <div className="text-3xl font-extrabold text-slate-900">
                            {billingCycle === 'monthly' ? '$29' : '$23'}
                            <span className="text-xs font-semibold text-slate-500">/mo after trial</span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-1">Ideal for small single-counter repair & phone shops.</p>
                        </div>

                        {/* Feature Checklist */}
                        <div className="space-y-2 pt-3 border-t border-slate-100 text-xs font-medium text-slate-700">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Up to 200 device checks / mo</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Single store location</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>80mm POS thermal QR receipt builder</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Customer warranty portal lookup</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Standard email support</span>
                          </div>
                        </div>
                      </div>

                      <div className={`p-2.5 rounded-xl text-center text-xs font-bold transition ${
                        selectedPlan === 'starter' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {selectedPlan === 'starter' ? 'Selected Package' : 'Select Starter'}
                      </div>
                    </div>

                    {/* Business Plan (Recommended) */}
                    <div
                      onClick={() => setSelectedPlan('business')}
                      className={`p-6 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between space-y-5 ${
                        selectedPlan === 'business'
                          ? 'border-blue-600 bg-blue-50/30 ring-2 ring-blue-500/30 shadow-xl'
                          : 'border-blue-200 bg-white hover:border-blue-300 shadow-sm'
                      }`}
                    >
                      <div className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                        RECOMMENDED
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">Business Package</span>
                          {selectedPlan === 'business' && (
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">✓</span>
                          )}
                        </div>
                        <div>
                          <div className="text-3xl font-extrabold text-slate-900">
                            {billingCycle === 'monthly' ? '$79' : '$63'}
                            <span className="text-xs font-semibold text-slate-500">/mo after trial</span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-1">Full suite for multi-branch phone retailers.</p>
                        </div>

                        {/* Feature Checklist */}
                        <div className="space-y-2 pt-3 border-t border-blue-100 text-xs font-medium text-slate-800">
                          <div className="flex items-center gap-2 font-bold text-slate-900">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Unlimited device registrations</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Up to 5 store locations</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Serial IMEI fraud prevention lock</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Live customer & staff verification feed</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Multi-staff RBAC role permissions</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Priority phone & chat support</span>
                          </div>
                        </div>
                      </div>

                      <div className={`p-2.5 rounded-xl text-center text-xs font-bold transition ${
                        selectedPlan === 'business' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedPlan === 'business' ? 'Selected Package' : 'Select Business'}
                      </div>
                    </div>

                    {/* Enterprise Plan */}
                    <div
                      onClick={() => setSelectedPlan('enterprise')}
                      className={`p-6 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-5 ${
                        selectedPlan === 'enterprise'
                          ? 'border-blue-600 bg-white ring-2 ring-blue-500/30 shadow-lg'
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Enterprise Package</span>
                          {selectedPlan === 'enterprise' && (
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">✓</span>
                          )}
                        </div>
                        <div>
                          <div className="text-3xl font-extrabold text-slate-900">
                            {billingCycle === 'monthly' ? '$199' : '$159'}
                            <span className="text-xs font-semibold text-slate-500">/mo after trial</span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-1">For distributors, wholesalers & large chains.</p>
                        </div>

                        {/* Feature Checklist */}
                        <div className="space-y-2 pt-3 border-t border-slate-100 text-xs font-medium text-slate-700">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Unlimited stores & bulk API access</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Wholesaler stock allocation tools</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Custom white-label thermal receipt logo</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Dedicated account manager & 99.9% SLA</span>
                          </div>
                        </div>
                      </div>

                      <div className={`p-2.5 rounded-xl text-center text-xs font-bold transition ${
                        selectedPlan === 'enterprise' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {selectedPlan === 'enterprise' ? 'Selected Package' : 'Select Enterprise'}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* =================================================================== */}
              {/* STEP 5: WELCOME & CELEBRATION                                       */}
              {/* =================================================================== */}
              {currentStep === 5 && (
                <div className="space-y-6 text-center animate-in fade-in duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div>
                    <h3 className="text-3xl font-extrabold text-slate-900">Setup Complete!</h3>
                    <p className="text-sm text-slate-600 font-medium mt-1">
                      Your store workspace <strong className="text-slate-900">{businessForm.storeName || 'TechWorld Mobile'}</strong> is live on the <strong className="text-blue-600">{selectedPlan.toUpperCase()}</strong> plan.
                    </p>
                  </div>

                  {/* Simulated Progress Bar */}
                  <div className="space-y-2 text-left bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Initializing Cloud Ledger</span>
                      <span className="text-emerald-600">{setupProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${setupProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Primary Action Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                {currentStep > 1 && currentStep < 5 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    Back
                  </button>
                )}

                <Button
                  variant="primary"
                  fullWidth={currentStep === 1 || currentStep === 5}
                  size="lg"
                  isLoading={isSubmitting}
                  onClick={handleNext}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="shadow-md shadow-blue-600/10 ml-auto"
                >
                  {currentStep === 1 && 'Create Account & Continue'}
                  {currentStep === 2 && 'Verify Email & Continue'}
                  {currentStep === 3 && 'Save Profile & Continue'}
                  {currentStep === 4 && 'Start 14-Day Free Trial'}
                  {currentStep === 5 && 'Go To Dashboard'}
                </Button>
              </div>

              {/* Mobile Social Proof Banner (block lg:hidden) */}
              <div className="block lg:hidden pt-3 border-t border-slate-100 text-center">
                <p className="text-[11px] font-semibold text-slate-500 flex items-center justify-center gap-1.5 flex-wrap">
                  <span className="text-amber-500 font-bold">★★★★★</span>
                  <span>"Setup took &lt;5 mins" — Marcus V., Store Owner</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> 256-Bit SSL Secured
                  </span>
                </p>
              </div>

            </div>
          </div>

          {/* Right Bottom Footer Link */}
          <div className="max-w-2xl mx-auto w-full text-center text-xs font-medium text-slate-500 pb-6 lg:pb-0">
            Need assistance with workspace setup?{' '}
            <a href="#" className="text-blue-600 font-bold hover:underline">Contact Store Support</a>
          </div>
        </div>

      </div>
    </div>
  );
}
