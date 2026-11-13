'use client';
import { TextInput } from '@/components/ui/Input';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Zap,
  RotateCcw,
  Globe,
  HelpCircle,
  Eye,
  EyeOff,
  Layers,
  Award,
  Info,
  CreditCard,
  Printer,
  QrCode,
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Logo } from '@/components/ui/Logo';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { WatermarkBackground } from '@/components/brand/WatermarkBackground';
import { PaystackCheckoutModal } from '@/components/billing/PaystackCheckoutModal';

// Comprehensive Plan Specifications & Fallback Data
const FALLBACK_PLANS = [
  {
    code: 'FREE',
    name: 'Free Forever',
    description: 'Free forever for up to 10 devices. IMEI records and receipts for small shops.',
    monthlyPriceNgn: 0,
    annualPriceNgn: 0,
    maxDevices: 10,
    customBranding: false,
    prioritySupport: false,
    features: [
      'Up to 10 Devices, Free Forever',
      'IMEI & Serial Number Hardware Ledger',
      'Standard POS Thermal Receipts (80mm & 58mm)',
      'Anti-Theft Stolen Device Blacklist Check',
      'Single Technician Store Workspace',
      'Cryptographic QR Receipt Verification',
    ],
  },
  {
    code: 'STARTER',
    name: 'Starter',
    description: 'For growing phone shops requiring custom receipt branding and automated warranty receipts.',
    monthlyPriceNgn: 5000,
    annualPriceNgn: 50000,
    maxDevices: 500,
    customBranding: true,
    prioritySupport: false,
    isRecommended: false,
    features: [
      'Up to 500 Registered Devices',
      'Custom Store Logo on Thermal Receipts',
      'IMEI & Serial Lifecycle History Ledger',
      'Automated Warranty Terms & Thermal Receipts',
      'Anti-Theft Stolen Device Cross-Check',
      'Daily Sales & Revenue Summaries',
    ],
  },
  {
    code: 'GOLD',
    name: 'Gold',
    description: 'High-volume phone retailers needing multi-staff accounts, cashiers, and margin tracking.',
    monthlyPriceNgn: 10000,
    annualPriceNgn: 100000,
    maxDevices: 1000,
    customBranding: true,
    prioritySupport: true,
    isRecommended: true,
    features: [
      'Up to 1,000 Registered Devices',
      'Custom Receipt Logo & Store Watermark',
      'Multi-Staff Accounts with Role Permissions',
      'Instant Anti-Theft IMEI Blacklist Verification',
      'Live Store Profit & Gross Margin Analytics',
      'Warranty Claim Resolution Tracking',
      'Priority WhatsApp & Email Support',
    ],
  },
  {
    code: 'ENTERPRISE',
    name: 'Enterprise Chain',
    description: 'For phone distributors, wholesalers, and multi-branch retail chains.',
    monthlyPriceNgn: 25000,
    annualPriceNgn: 250000,
    maxDevices: null,
    customBranding: true,
    prioritySupport: true,
    isRecommended: false,
    features: [
      'Unlimited Registered Devices & Inventory',
      'Multi-Branch Store Workspaces & Stock Transfers',
      'Wholesaler Bulk Serial Upload & Batch Tagging',
      'Unlimited Staff & Cashier User Accounts',
      'White-label Receipt Branding & Custom Domains',
      'Advanced Multi-Store Valuation & Reports',
      'Dedicated Account Manager & 24/7 SLA Support',
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [googleCredential, setGoogleCredential] = useState<string | null>(null);
  const [isGoogleAuth, setIsGoogleAuth] = useState<boolean>(false);

  // Step 1 Form Data
  const [accountForm, setAccountForm] = useState({
    fullName: '',
    email: '',
    password: '',
    agreeTerms: true,
  });
  const [accountErrors, setAccountErrors] = useState<{ [key: string]: string }>({});

  // Step 2 OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpResent, setOtpResent] = useState(false);
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Step 3 Business Profile State
  const [businessForm, setBusinessForm] = useState({
    storeName: '',
    businessType: 'retailer',
    phone: '',
    primaryLocation: 'Main Store Branch',
  });

  // Step 4 Subscription Plan State
  const [selectedPlan, setSelectedPlan] = useState<string>('GOLD');
  const [dynamicPlans, setDynamicPlans] = useState<any[]>(FALLBACK_PLANS);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [viewingPlanDetails, setViewingPlanDetails] = useState<any | null>(null);

  // Every new store starts on the Free plan. A paid plan only starts once it is paid for.
  const [accountCreated, setAccountCreated] = useState(false);
  const [pendingPlanCode, setPendingPlanCode] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paidPlanActive, setPaidPlanActive] = useState(false);

  useEffect(() => {
    setMounted(true);
    const urlPlan = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('plan') : null;
    if (urlPlan) {
      setSelectedPlan(urlPlan.toUpperCase());
    }

    // Fetch dynamic database plans
    api.getPlans().then((res) => {
      if (res?.success && Array.isArray(res.plans) && res.plans.length > 0) {
        const merged = res.plans.map((p: any) => {
          const fallback = FALLBACK_PLANS.find((fb) => fb.code.toUpperCase() === p.code?.toUpperCase());
          return {
            ...fallback,
            ...p,
            features: (Array.isArray(p.features) && p.features.length > 0) ? p.features : fallback?.features || [],
          };
        });
        setDynamicPlans(merged);
        if (!urlPlan) {
          const defaultChoice = merged.find((p: any) => p.code === 'GOLD' || p.code === 'BUSINESS' || p.isRecommended) || merged[1] || merged[0];
          setSelectedPlan(defaultChoice.code);
        }
      }
    }).catch((err) => {
      console.error('Failed to load database plans:', err);
      setDynamicPlans(FALLBACK_PLANS);
    });
  }, []);

  // Validation Handlers
  const validateStep1 = () => {
    const errors: { [key: string]: string } = {};
    if (!accountForm.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!accountForm.email.trim() || !accountForm.email.includes('@')) errors.email = 'Valid work email is required';
    if (!accountForm.password || accountForm.password.length < 8) errors.password = 'Password must be at least 8 characters';
    setAccountErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGoogleSignUpSuccess = (result: {
    credential: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
  }) => {
    setGoogleCredential(result.credential);
    setIsGoogleAuth(true);
    const fullName = result.fullName || `${result.firstName || ''} ${result.lastName || ''}`.trim() || 'Store Owner';
    const email = result.email || accountForm.email;

    setAccountForm((prev) => ({
      ...prev,
      fullName,
      email,
      password: 'GoogleOAuth2VerifiedSecurePassword123!',
    }));

    // Pre-populate store name with owner name if empty
    if (!businessForm.storeName) {
      setBusinessForm((prev) => ({
        ...prev,
        storeName: `${result.firstName || 'My'} Mobile Hub`,
      }));
    }

    // Google verified the email address — advance directly to Step 3 (Store Profile)
    setCurrentStep(3);
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setIsSubmitting(true);
      try {
        await api.sendOtp(accountForm.email, accountForm.fullName);
        setOtpError(null);
        setAccountErrors({});
        setCurrentStep(2);
      } catch (err: any) {
        console.error('Failed to send OTP:', err);
        // The code is required to create the account, so do not move on without it.
        setAccountErrors({ email: err?.message || 'We could not send your verification code. Please try again.' });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (currentStep === 2) {
      const code = otpDigits.join('');
      if (code.length < 6) {
        setOtpError('Please enter all 6 digits of the verification code.');
        return;
      }

      setIsSubmitting(true);
      setOtpError(null);
      try {
        const verified = await api.verifyOtp(accountForm.email, code);
        setEmailVerificationToken(verified.emailVerificationToken || null);
        setCurrentStep(3);
      } catch (err: any) {
        setOtpError(err.message || 'Invalid or expired verification code.');
        return;
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (currentStep === 4 && accountCreated) {
        // The account already exists (they came back to this step): only payment is left.
        if (pendingPlanCode && !paidPlanActive) {
          setIsCheckoutOpen(true);
          return;
        }
      } else if (currentStep === 4) {
        let pendingPlan: string | null = null;
        const nameParts = (accountForm.fullName || 'Store Owner').trim().split(' ');
        const firstName = nameParts[0] || 'Store';
        const lastName = nameParts.slice(1).join(' ') || 'Owner';

        if (isGoogleAuth && googleCredential) {
          // Trigger Google Business Workspace Registration
          const res = await api.googleAuth({
            credential: googleCredential,
            firstName,
            lastName,
            businessName: businessForm.storeName.trim() || `${firstName}'s Store`,
            phone: businessForm.phone?.trim() || undefined,
            plan: selectedPlan.toUpperCase(),
          });

          if (typeof window !== 'undefined') {
            localStorage.setItem('vf_access_token', res.accessToken);
            localStorage.setItem('vf_user', JSON.stringify(res.user));
          }
          pendingPlan = res.pendingPlan || null;
        } else {
          // Standard Email/Password Auth Registration
          const res = await register({
            email: accountForm.email,
            password: accountForm.password,
            emailVerificationToken: emailVerificationToken || undefined,
            firstName,
            lastName,
            businessName: businessForm.storeName.trim() || `${firstName}'s Mobile Store`,
            phone: businessForm.phone?.trim() || undefined,
            plan: selectedPlan.toUpperCase(),
          });
          pendingPlan = res.pendingPlan || null;
        }

        setAccountCreated(true);
        if (pendingPlan) {
          // Paid plan chosen: the store is on Free until this payment goes through.
          setPendingPlanCode(pendingPlan);
          setIsCheckoutOpen(true);
          return;
        }
      }

      if (currentStep < 5) {
        setCurrentStep((prev) => prev + 1);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.warn('Backend register error:', err);
      // Stay on this step: moving on would leave the person in a dashboard with no account.
      setSubmitError(err?.message || 'We could not create your account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      if (currentStep === 3 && isGoogleAuth) {
        setCurrentStep(1);
      } else {
        setCurrentStep((prev) => prev - 1);
      }
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
      highlight: 'Instant IMEI & QR Verification Ledger',
    },
    2: {
      headline: 'Check Your Inbox',
      description: `We've sent a 6-digit verification code to ${accountForm.email || 'your email'}.`,
      highlight: 'Enterprise Grade Account Security',
    },
    3: {
      headline: 'Tell Us About Your Store',
      description: 'Customize NoxGuarda modules according to your retail scale and inventory workflow.',
      highlight: 'Multi-Branch Inventory Tracking',
    },
    4: {
      headline: 'Choose the Right Plan',
      description: 'Start on the Free plan, free forever for up to 10 devices, or pick a paid plan and pay to start it.',
      highlight: 'Free Forever • Up to 10 Devices',
    },
    5: {
      headline: 'Welcome to NoxGuarda!',
      description: 'Your workspace is ready. You can now register phones, issue QR receipts, and track warranties.',
      highlight: '100% Operational Ready',
    },
  };

  const currentBrand = stepBrandConfig[currentStep];

  const findPlan = (code: string | null) =>
    code ? dynamicPlans.find((p: any) => String(p.code || '').toUpperCase() === code.toUpperCase()) || null : null;
  const checkoutPlan = findPlan(pendingPlanCode);
  const selectedPlanItem = findPlan(selectedPlan);
  const selectedIsFree =
    selectedPlan.toUpperCase() === 'FREE' ||
    (!!selectedPlanItem && !selectedPlanItem.monthlyPriceNgn && !selectedPlanItem.annualPriceNgn);
  const paymentPending = accountCreated && !!pendingPlanCode && !paidPlanActive;
  const activePlanName = paidPlanActive && checkoutPlan ? checkoutPlan.name : 'Free';

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans lg:overflow-hidden">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen lg:min-h-0 lg:h-full">
        
        {/* LEFT PANEL — BRAND EXPERIENCE (Hardware Glass Image with Instant Priority Preload) */}
        <div className="hidden lg:flex lg:col-span-5 text-white p-6 lg:p-7 xl:p-8 flex-col justify-between relative overflow-hidden border-r border-slate-800/80 bg-slate-950 h-full">
          {/* Next.js Optimized & Preloaded High-Performance Background Image */}
          <Image
            src="/images/onboarding_bg.png"
            alt="NoxGuarda Electronics Retail OS"
            fill
            priority
            quality={85}
            sizes="(max-width: 1024px) 100vw, 42vw"
            className="object-cover object-center pointer-events-none select-none z-0"
          />

          {/* Light Overlay Tint for Maximum Background Image Visibility */}
          <div className="absolute inset-0 bg-slate-950/40 z-1 pointer-events-none" />
          
          {/* Background Ambient Hardware Lighting Accents */}
          <div className="absolute -top-40 -left-40 w-[450px] xl:w-[600px] h-[450px] xl:h-[600px] bg-accent-500/20 rounded-full blur-[120px] pointer-events-none z-1" />
          <div className="absolute -bottom-40 -right-40 w-[400px] xl:w-[550px] h-[400px] xl:h-[550px] bg-accent-600/20 rounded-full blur-[100px] pointer-events-none z-1" />

          {/* Top Logo Bar */}
          <div className="relative z-10 flex items-center justify-between">
            <Logo size="md" variant="white" />
          </div>

          {/* Brand Dynamic Content Area (Vertically centered) */}
          <div className="relative z-10 my-auto py-2 space-y-4 xl:space-y-5 max-w-lg">

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl xl:text-3xl 2xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {currentBrand.headline}
              </h2>
              <p className="text-xs sm:text-sm xl:text-base text-slate-300 font-medium leading-relaxed">
                {currentBrand.description}
              </p>
            </div>

            {/* Testimonial Card */}
            <div className="p-3.5 xl:p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 text-xs space-y-2.5 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex text-warning-400 gap-0.5 text-xs">★★★★★</div>
                <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">Store Owner Review</span>
              </div>
              <p className="text-slate-200 font-medium italic leading-relaxed text-xs xl:text-xs">
                "Setting up our 3 store locations on NoxGuarda took less than 5 minutes. The IMEI receipt verification stopped warranty disputes instantly."
              </p>
              <div className="flex items-center gap-2.5 pt-1.5 border-t border-slate-800">
                <div className="w-7 h-7 rounded-full bg-accent-600 text-white font-bold flex items-center justify-center text-xs shadow-md shadow-accent-600/30">
                  M
                </div>
                <div>
                  <div className="font-bold text-white text-xs">Marcus Vance</div>
                  <div className="text-xs text-slate-400">Owner, TechWorld Mobile (5 Store Branches)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Left Footer Info */}
          <div className="relative z-10 text-xs xl:text-xs text-slate-400 font-semibold flex items-center justify-between border-t border-slate-800/80 pt-3">
            <span>© 2026 NoxGuarda Inc.</span>
          </div>
        </div>

        {/* RIGHT PANEL — CONTENT CONTAINER */}
        <div className="w-full lg:col-span-7 p-3 sm:p-4 lg:p-5 xl:p-6 flex flex-col justify-between bg-slate-50 min-h-screen lg:min-h-0 lg:h-full relative lg:overflow-y-auto">
          <WatermarkBackground size="hero" opacity="opacity-[0.03]" />
          
          {/* Header & Stepper Bar */}
          <div className={`${currentStep === 4 ? 'max-w-5xl xl:max-w-6xl' : 'max-w-md lg:max-w-lg'} mx-auto w-full space-y-2 transition-all duration-300 shrink-0`}>
            
            {/* Mobile Top Brand & Progress Header (Clean light styling: block lg:hidden) */}
            <div className="block lg:hidden bg-white -mx-3 -mt-3 p-3.5 mb-2 border-b border-slate-200 shadow-sm rounded-b-xl space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <Logo size="sm" showSubtitle={false} />
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <Link href="/login" className="text-xs font-bold text-accent-600 hover:underline">
                    Sign In
                  </Link>
                  {currentStep > 1 && (
                    <Button variant="secondary" size="sm"
                      onClick={handleBack}>
                      <ArrowLeft className="w-3 h-3" /> Back
                    </Button>
                  )}
                  <span className="text-xs sm:text-xs font-extrabold text-accent-700 bg-accent-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-accent-200">
                    Step {currentStep}/5
                  </span>
                </div>
              </div>

              {/* Mobile Segmented Progress Bar (- - - - -) */}
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((s) => {
                  const isCompleted = s < currentStep;
                  const isCurrent = s === currentStep;

                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setCurrentStep(s)}
                      className="group py-0.5 cursor-pointer w-full focus:outline-none"
                      title={`Jump to Step ${s}`}
                    >
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          isCompleted
                            ? 'bg-success-500 group-hover:bg-success-600'
                            : isCurrent
                            ? 'bg-accent-600 ring-2 ring-accent-500/20'
                            : 'bg-slate-200 group-hover:bg-slate-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop Top Navigation Row (hidden lg:flex) */}
            <div className="hidden lg:flex items-center justify-between border-b border-slate-200 pb-2">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`flex items-center gap-1 text-xs font-bold transition ${
                  currentStep === 1 ? 'opacity-0 cursor-default' : 'text-slate-600 hover:text-slate-900 cursor-pointer'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Step {currentStep - 1}
              </button>

              <div className="flex items-center gap-2.5 text-xs font-bold">
                <span className="text-slate-500 uppercase tracking-wider text-xs xl:text-xs">
                  Step <span className="text-accent-600 font-extrabold">{currentStep}</span> of 5
                </span>
                <span className="text-slate-300">•</span>
                <Link href="/login" className="text-accent-600 hover:underline">
                  Already registered? Sign In →
                </Link>
              </div>
            </div>

            {/* Desktop 5-Column Stepper Bar (hidden lg:grid) */}
            <div className="hidden lg:grid grid-cols-5 gap-2 pt-0.5">
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
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setCurrentStep(s.step)}
                    className="space-y-1 text-center group cursor-pointer w-full focus:outline-none transition-transform active:scale-95"
                    title={`Click to preview Step ${s.step}: ${s.label}`}
                  >
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        isCompleted
                          ? 'bg-success-500 group-hover:bg-success-600'
                          : isCurrent
                          ? 'bg-accent-600 ring-2 ring-accent-500/20'
                          : 'bg-slate-200 group-hover:bg-slate-300'
                      }`}
                    />
                    <div
                      className={`text-xs font-bold transition-colors ${
                        isCompleted
                          ? 'text-success-700 group-hover:text-success-800'
                          : isCurrent
                          ? 'text-accent-600 font-extrabold'
                          : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      {s.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Card Content (Vertically Centered to Fit Screen) */}
          <div className={`${currentStep === 4 ? 'max-w-5xl xl:max-w-6xl' : 'max-w-md lg:max-w-lg'} mx-auto w-full my-auto py-1 sm:py-2`}>
            <div className="vf-card bg-white p-4 sm:p-5 lg:p-5 xl:p-6 rounded-2xl xl:rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50 space-y-3 sm:space-y-3.5">
              
              {/* =================================================================== */}
              {/* STEP 1: CREATE ACCOUNT                                             */}
              {/* =================================================================== */}
              {currentStep === 1 && (
                <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-200">
                  <div>
                    <h3 className="text-lg sm:text-xl xl:text-2xl font-extrabold text-slate-900">Create Your Workspace</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Enter your details to initialize your verified store ledger.
                    </p>
                  </div>

                  {/* Sign up with Google Button */}
                  <GoogleAuthButton
                    mode="signup"
                    disabled={isSubmitting}
                    onSuccess={handleGoogleSignUpSuccess}
                    onError={(err) => setAccountErrors((prev) => ({ ...prev, email: err }))}
                  />

                  {/* Divider */}
                  <div className="relative flex items-center justify-center my-2">
                    <div className="border-t border-slate-200 w-full" />
                    <span className="bg-white px-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      or register with work email
                    </span>
                    <div className="border-t border-slate-200 w-full" />
                  </div>

                  <div className="space-y-2.5 sm:space-y-3">
                    {/* Full Name */}
                    <div>
                      <TextInput label="Full Name"
                          type="text"
                          value={accountForm.fullName}
                          onChange={(e) => setAccountForm({ ...accountForm, fullName: e.target.value })}
                          placeholder="e.g. Chinedu Okafor" leftIcon={<User className="w-4 h-4" />} />
                      {accountErrors.fullName && (
                        <p className="text-xs text-danger-500 font-semibold mt-0.5">{accountErrors.fullName}</p>
                      )}
                    </div>

                    {/* Work Email */}
                    <div>
                      <TextInput label="Work Email Address"
                          type="email"
                          value={accountForm.email}
                          onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                          placeholder="chinedu@zenithgadgets.ng" leftIcon={<Mail className="w-4 h-4" />} />
                      {accountErrors.email && (
                        <p className="text-xs text-danger-500 font-semibold mt-0.5">{accountErrors.email}</p>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <label htmlFor="onboarding-f1" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Password <span className="text-danger-500">*</span>
                      </label>
                      <div className="relative">
                        <input id="onboarding-f1"
                          type={showPassword ? 'text' : 'password'}
                          value={accountForm.password}
                          onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                          placeholder="At least 8 characters"
                          className="w-full text-xs sm:text-sm pl-9 pr-9 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-accent-600 focus:ring-2 focus:ring-accent-500/20 font-medium text-slate-900"
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 sm:top-3" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 sm:top-3 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {accountErrors.password && (
                        <p className="text-xs text-danger-500 font-semibold mt-0.5">{accountErrors.password}</p>
                      )}
                    </div>

                    {/* Terms Checkbox */}
                    <div className="flex items-start gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="agreeTerms"
                        checked={accountForm.agreeTerms}
                        onChange={(e) => setAccountForm({ ...accountForm, agreeTerms: e.target.checked })}
                        className="mt-0.5 w-3.5 h-3.5 rounded text-accent-600 focus:ring-accent-500"
                      />
                      <label htmlFor="agreeTerms" className="text-xs text-slate-600 font-medium leading-tight">
                        I agree to the <a href="#" className="text-accent-600 font-bold hover:underline">Terms of Service</a> and <a href="#" className="text-accent-600 font-bold hover:underline">Privacy Policy</a>.
                      </label>
                    </div>

                    {/* Or Login CTA */}
                    <div className="pt-2 border-t border-slate-100 text-center text-xs">
                      <span className="text-slate-500 font-medium">Already have an account? </span>
                      <Link href="/login" className="text-accent-600 font-bold hover:underline">
                        Log In to your workspace →
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================================== */}
              {/* STEP 2: VERIFY EMAIL                                               */}
              {/* =================================================================== */}
              {currentStep === 2 && (
                <div className="space-y-4 text-center animate-in fade-in duration-200">
                  <div className="w-12 h-12 rounded-2xl bg-success-50 border border-success-200 text-success-600 flex items-center justify-center mx-auto shadow-subtle">
                    <Mail className="w-6 h-6" />
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">Verify Your Email</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Enter the 6-digit confirmation code sent to <strong className="text-slate-900">{accountForm.email || 'your email'}</strong>.
                    </p>
                  </div>

                  {otpError && (
                    <div className="p-2.5 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-xs flex items-start justify-center gap-2 max-w-md mx-auto">
                      <span className="font-semibold">{otpError}</span>
                    </div>
                  )}

                  {/* OTP Digits Row */}
                  <div className="flex justify-center gap-1.5 sm:gap-2.5 py-1">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-input-${idx}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        className="w-8 h-10 sm:w-10 sm:h-12 text-center text-base sm:text-xl font-extrabold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-accent-600 focus:ring-2 focus:ring-accent-500/20 font-mono text-slate-900 shadow-inner"
                      />
                    ))}
                  </div>

                  <div className="pt-2 text-xs font-semibold text-slate-500 space-y-1">
                    <div>
                      Didn't receive the code?{' '}
                      <Button variant="link"
                        type="button"
                        onClick={async () => {
                          try {
                            setIsSubmitting(true);
                            await api.sendOtp(accountForm.email, accountForm.fullName);
                            setOtpResent(true);
                            setOtpError(null);
                          } catch (e: any) {
                            setOtpError(e.message || 'Failed to resend code. Please try again.');
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}>
                        Resend Code
                      </Button>
                      {otpResent && (
                        <p className="text-success-600 text-xs font-bold mt-1 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>A fresh 6-digit verification code has been sent to your email.</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================================== */}
              {/* STEP 3: BUSINESS PROFILE                                           */}
              {/* =================================================================== */}
              {currentStep === 3 && (
                <div className="space-y-3 sm:space-y-3.5 animate-in fade-in duration-200">
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-accent-700">Complete Store Profile</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Tell us about your phone retail store or distribution network.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Store Name & Store Phone (Side-by-Side 2-Column Grid) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      {/* Store Name */}
                      <div>
                        <TextInput label="Store Name"
                            type="text"
                            value={businessForm.storeName}
                            onChange={(e) => setBusinessForm({ ...businessForm, storeName: e.target.value })}
                            placeholder="e.g. Zenith Gadgets Ltd" leftIcon={<Store className="w-4 h-4" />} />
                      </div>

                      {/* Store Phone */}
                      <div>
                        <TextInput label="Contact Phone"
                            type="tel"
                            value={businessForm.phone}
                            onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                            placeholder="e.g. +234 800 000 0000" leftIcon={<Smartphone className="w-4 h-4" />} />
                      </div>
                    </div>

                    {/* Business Type Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Business Category
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'retailer', label: 'Phone Retailer', desc: 'Single/multi shop' },
                          { id: 'wholesaler', label: 'Wholesaler', desc: 'Bulk serial supplier' },
                          { id: 'laptop', label: 'Laptop Retailer', desc: 'Dedicated laptop shop' },
                          { id: 'electronics', label: 'General Electronics', desc: 'Gadgets & phones' },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setBusinessForm({ ...businessForm, businessType: cat.id })}
                            className={`p-2.5 rounded-xl text-left border transition-all ${
                              businessForm.businessType === cat.id
                                ? 'bg-accent-50/70 border-accent-600 text-accent-900 shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div className="font-extrabold text-xs">{cat.label}</div>
                            <div className="text-xs text-slate-500">{cat.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================================== */}
              {/* STEP 4: PLAN CHOICE & FULL PACKAGE COMPARISON MATRIX              */}
              {/* =================================================================== */}
              {currentStep === 4 && (
                <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-200">
                  {/* Compact Header & Cycle Switcher */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Select Store Plan</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-success-50 text-success-700 border border-success-200 text-xs font-extrabold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-success-600" />
                          Free plan is free forever
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        The Free plan needs no card. A paid plan starts as soon as you pay, and you can switch anytime.
                      </p>
                    </div>
                    
                    <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700 shrink-0 self-start sm:self-auto border border-slate-200/70">
                      <button
                        type="button"
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-3 py-1 rounded-lg transition ${billingCycle === 'monthly' ? 'bg-white shadow-sm text-slate-900 font-extrabold' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingCycle('annual')}
                        className={`px-3 py-1 rounded-lg transition ${billingCycle === 'annual' ? 'bg-white shadow-sm text-slate-900 font-extrabold' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        Annual (20% Off)
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Database Plan Cards OR Full About Plan Details View */}
                  {viewingPlanDetails ? (
                    /* DEDICATED ABOUT PLAN DETAIL VIEW */
                    <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 animate-in zoom-in duration-200">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <Button variant="secondary" size="sm"
                          type="button"
                          onClick={() => setViewingPlanDetails(null)}>
                          <ArrowLeft className="w-4 h-4" />
                          <span>Back to All Plans</span>
                        </Button>

                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-accent-50 text-accent-700 border border-accent-200">
                            {viewingPlanDetails.code} Tier Specifications
                          </span>
                        </div>
                      </div>

                      {/* Plan Header & Pricing Banner */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white shadow-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-accent-400 text-xs font-bold uppercase tracking-wider">
                            <Layers className="w-4 h-4" />
                            <span>Detailed Plan Capabilities</span>
                          </div>
                          <h2 className="text-xl sm:text-2xl font-black text-white">{viewingPlanDetails.name}</h2>
                          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl">
                            {viewingPlanDetails.description || 'Verified device intelligence suite for store operations.'}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 text-left sm:text-right shrink-0">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {billingCycle === 'monthly' ? 'Monthly Billing' : 'Annual Billing (20% Off)'}
                          </div>
                          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                            ₦{billingCycle === 'monthly'
                              ? (viewingPlanDetails.monthlyPriceNgn || 0).toLocaleString()
                              : (viewingPlanDetails.annualPriceNgn || (viewingPlanDetails.monthlyPriceNgn || 0) * 10).toLocaleString()}
                            <span className="text-xs text-slate-400 font-sans font-normal ml-1">
                              /{viewingPlanDetails.monthlyPriceNgn === 0 ? 'forever' : billingCycle === 'monthly' ? 'mo' : 'yr'}
                            </span>
                          </div>
                          <div className="text-xs text-success-400 font-extrabold mt-0.5 flex items-center sm:justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{viewingPlanDetails.monthlyPriceNgn === 0 ? 'Free forever • No card needed' : 'Starts as soon as you pay'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Key Capabilities Highlights */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-700">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                          <div className="p-2 rounded-lg bg-accent-100 text-accent-700 shrink-0">
                            <Smartphone className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                              {viewingPlanDetails.maxDevices
                                ? `Up to ${viewingPlanDetails.maxDevices.toLocaleString()} Devices`
                                : 'Unlimited Device Inventory'}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Track IMEI, serial numbers, battery health, and test status.
                            </p>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                          <div className="p-2 rounded-lg bg-accent-100 text-accent-700 shrink-0">
                            <Printer className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                              {viewingPlanDetails.customBranding ? 'Custom Branded Receipts' : 'Standard Thermal POS'}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              80mm/58mm instant thermal receipts with QR verification codes.
                            </p>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                          <div className="p-2 rounded-lg bg-success-100 text-success-700 shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs sm:text-sm">Anti-Theft Protection</div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Cross-checks devices against police and blacklisted registry.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Complete Features Checklist */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-accent-600" />
                          <span>Everything Included In {viewingPlanDetails.name}</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70">
                          {Array.isArray(viewingPlanDetails.features) && viewingPlanDetails.features.length > 0 ? (
                            viewingPlanDetails.features.map((feat: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-slate-800">
                                <Check className="w-4 h-4 text-success-600 shrink-0 mt-0.5" />
                                <span className="font-medium">{feat}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-500 italic col-span-2">
                              Device records, receipts and verification are included.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Detail Footer CTA */}
                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <Button variant="secondary" size="sm" fullWidth className="sm:w-auto"
                          type="button"
                          onClick={() => setViewingPlanDetails(null)}>
                          ← Back to All Plans
                        </Button>

                        <Button variant="primary" size="sm" fullWidth className="sm:w-auto"
                          type="button"
                          onClick={() => {
                            setSelectedPlan(viewingPlanDetails.code.toUpperCase());
                            setViewingPlanDetails(null);
                          }}>
                          <span>Select {viewingPlanDetails.name} & Continue</span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* DYNAMIC DATABASE PLAN CARDS GRID (4 RESPONSIVE TALL COLUMNS) */
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-3.5">
                      {dynamicPlans.length > 0 ? (
                        dynamicPlans.map((planItem) => {
                          const isSelected = selectedPlan.toUpperCase() === planItem.code.toUpperCase();
                          const isFree = planItem.code === 'FREE' || (!planItem.monthlyPriceNgn && !planItem.annualPriceNgn);
                          const price = isFree
                            ? 0
                            : billingCycle === 'monthly'
                            ? planItem.monthlyPriceNgn
                            : Math.round((planItem.annualPriceNgn || planItem.monthlyPriceNgn * 10) / 12);
                          const isRecommended = planItem.isRecommended || planItem.code.toUpperCase() === 'BUSINESS';

                          return (
                            <div
                              key={planItem.code}
                              onClick={() => setSelectedPlan(planItem.code.toUpperCase())}
                              className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all duration-200 relative flex flex-col justify-between space-y-3 ${
                                isSelected
                                  ? 'border-2 border-accent-600 bg-accent-50/40 ring-4 ring-accent-500/15 shadow-md shadow-accent-600/10'
                                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                              }`}
                            >
                              {isRecommended && (
                                <div className="absolute -top-2.5 right-3 bg-accent-600 text-white text-xs font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                  RECOMMENDED
                                </div>
                              )}

                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                                      {planItem.name}
                                    </span>
                                    {isFree && (
                                      <span className="text-xs font-extrabold px-1.5 py-0.5 rounded bg-success-100 text-success-800">
                                        FREE
                                      </span>
                                    )}
                                  </div>
                                  {isSelected && (
                                    <span className="w-4 h-4 rounded-full bg-accent-600 text-white flex items-center justify-center text-xs font-bold">✓</span>
                                  )}
                                </div>

                                <div>
                                  <div className="text-lg sm:text-xl font-black text-slate-900 font-mono tracking-tight leading-tight">
                                    ₦{price?.toLocaleString()}
                                    <span className="text-xs font-semibold text-slate-500 font-sans ml-1">
                                      {isFree ? '/forever' : '/mo'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-0.5 min-h-[32px]">
                                    {planItem.description || 'Verified device intelligence suite for store operations.'}
                                  </p>
                                </div>

                                {/* Rich Features List on Card */}
                                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs font-medium text-slate-700">
                                  {Array.isArray(planItem.features) && planItem.features.length > 0 ? (
                                    planItem.features.slice(0, 4).map((feat: string, fIdx: number) => (
                                      <div key={fIdx} className="flex items-start gap-1.5 leading-snug">
                                        <Check className="w-3.5 h-3.5 text-success-600 shrink-0 mt-0.5" />
                                        <span className="line-clamp-1">{feat}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <>
                                      <div className="flex items-center gap-1.5">
                                        <Check className="w-3.5 h-3.5 text-success-600 shrink-0" />
                                        <span>Devices: <strong>{planItem.maxDevices ? `${planItem.maxDevices.toLocaleString()}` : 'Unlimited'}</strong></span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Check className="w-3.5 h-3.5 text-success-600 shrink-0" />
                                        <span>{planItem.customBranding ? 'Custom Receipt Logo' : 'Standard Thermal POS'}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Check className="w-3.5 h-3.5 text-success-600 shrink-0" />
                                        <span>IMEI Ledger & QR Origin</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                <Button variant="secondary" size="sm" fullWidth
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingPlanDetails(planItem);
                                  }}>
                                  <Info className="w-3.5 h-3.5" />
                                  <span>About Plan Specs ({planItem.features?.length || 6} Features) →</span>
                                </Button>

                                <div
                                  className={`py-1.5 px-3 rounded-xl text-center text-xs font-bold transition-all ${
                                    isSelected
                                      ? 'bg-accent-600 text-white shadow-sm'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                                  }`}
                                >
                                  {isSelected ? 'Selected Plan' : `Select ${planItem.name}`}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-full p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-1">
                          <p className="text-xs font-bold text-slate-700">Plans could not be loaded</p>
                          <p className="text-xs text-slate-500">
                            Please refresh the page to choose a plan.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* =================================================================== */}
              {/* STEP 5: WELCOME & CELEBRATION                                       */}
              {/* =================================================================== */}
              {currentStep === 5 && (
                <div className="space-y-3.5 text-center animate-in fade-in duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-success-100 text-success-600 flex items-center justify-center mx-auto shadow-md shadow-success-600/20">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">Setup Complete!</h3>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto">
                      Your store workspace <strong className="text-slate-900">{businessForm.storeName || 'Store Workspace'}</strong> is ready on the <strong className="text-accent-600">{activePlanName}</strong> plan.
                    </p>
                    {paymentPending && (
                      <p className="text-xs text-warning-700 font-semibold max-w-md mx-auto pt-1">
                        Payment for the {checkoutPlan?.name || pendingPlanCode} plan was not completed, so your store is on the Free plan (free forever, up to 10 devices). You can upgrade anytime from{' '}
                        <Link href="/dashboard/settings?tab=subscription" className="underline font-bold">Settings → Subscription</Link>.
                      </p>
                    )}
                  </div>

                  {/* Ready Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="text-xs font-bold text-slate-500 uppercase">Inventory & POS</div>
                      <div className="text-xs font-extrabold text-slate-900 mt-0.5">Ready to Add Phones</div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="text-xs font-bold text-slate-500 uppercase">Verification</div>
                      <div className="text-xs font-extrabold text-slate-900 mt-0.5">IMEI Registry Active</div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="text-xs font-bold text-slate-500 uppercase">Billing</div>
                      <div className="text-xs font-extrabold text-slate-900 mt-0.5">
                        {paidPlanActive ? `${activePlanName} Plan Active` : 'Free Forever • 10 Devices'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Primary Action Button */}
              <div className="pt-2 sm:pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3">
                {currentStep > 1 && currentStep < 5 && (
                  <Button variant="ghost" size="sm"
                    type="button"
                    onClick={handleBack}>
                    Back
                  </Button>
                )}

                {currentStep === 4 ? (
                  /* STEP 4: SHIMMER STRIPE SWEEPER BUTTON */
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleNext}
                    className="relative group overflow-hidden border-2 border-accent-600 bg-white hover:bg-accent-600 text-accent-700 hover:text-white font-extrabold text-xs sm:text-sm py-2.5 px-6 sm:px-8 rounded-xl sm:rounded-2xl transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-accent-600/25 active:scale-[0.98] ml-auto flex items-center gap-2 cursor-pointer"
                  >
                    {/* Shimmer Light Stripe that sweeps across on hover */}
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-accent-100/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />
                    
                    <span className="relative z-10">
                      {isSubmitting ? 'Please wait...' : selectedIsFree ? 'Get started' : paymentPending ? 'Continue to payment' : 'Create account & pay'}
                    </span>
                    <ArrowRight className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1" />
                  </button>
                ) : (
                  <Button
                    variant="primary"
                    fullWidth={currentStep === 1 || currentStep === 5}
                    size="md"
                    isLoading={isSubmitting}
                    onClick={handleNext}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    className="shadow-sm bg-accent-600 hover:bg-accent-500 font-bold text-xs sm:text-sm py-2 sm:py-2.5 px-4 sm:px-6 rounded-xl ml-auto"
                  >
                    {currentStep === 1 && 'Create Account & Continue'}
                    {currentStep === 2 && 'Verify Email & Continue'}
                    {currentStep === 3 && 'Save Profile & Continue'}
                    {currentStep === 5 && 'Go To Dashboard'}
                  </Button>
                )}
              </div>

              {submitError && (
                <div role="alert" className="p-3 rounded-xl bg-danger-50 border border-danger-200 text-xs font-semibold text-danger-700">
                  {submitError}
                </div>
              )}

              {/* Mobile Social Proof Banner (block lg:hidden) */}
              <div className="block lg:hidden pt-2 border-t border-slate-100 text-center">
                <p className="text-xs font-semibold text-slate-500 flex items-center justify-center gap-1 flex-wrap">
                  <span className="text-warning-500 font-bold">★★★★★</span>
                  <span>"Setup took &lt;5 mins" — Marcus V.</span>
                </p>
              </div>

            </div>
          </div>

          {/* Paid plan chosen at signup: pay now through the normal checkout */}
          {isCheckoutOpen && checkoutPlan && (
            <PaystackCheckoutModal
              isOpen
              plan={checkoutPlan}
              onSuccess={() => setPaidPlanActive(true)}
              onClose={() => {
                setIsCheckoutOpen(false);
                setCurrentStep(5);
              }}
            />
          )}

          {/* Right Bottom Footer Link */}
          <div className={`${currentStep === 4 ? 'max-w-5xl xl:max-w-6xl' : 'max-w-md lg:max-w-lg'} mx-auto w-full text-center text-xs font-medium text-slate-500 py-1 shrink-0`}>
            Need assistance with workspace setup?{' '}
            <a href="#" className="text-accent-600 font-bold hover:underline">Contact Store Support</a>
          </div>
        </div>

      </div>
    </div>
  );
}
