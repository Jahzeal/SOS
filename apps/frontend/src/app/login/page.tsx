'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PwaInstallButton } from '@/components/PwaInstallButton';
import { Logo } from '@/components/ui/Logo';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

function SessionExpiredAlert() {
  const searchParams = useSearchParams();
  const isExpired = searchParams ? searchParams.get('expired') === 'true' : false;

  if (!isExpired) return null;

  return (
    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shadow-sm">
      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <div className="font-medium">Your session has expired or is invalid. Please sign in again to access your workspace.</div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.login(email, password);
      
      // Cache token & user in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('vf_access_token', data.accessToken);
        localStorage.setItem('vf_user', JSON.stringify(data.user));
      }

      setAuth(data.user, data.accessToken);
      const targetRoute = data.user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';

      if (typeof window !== 'undefined') {
        window.location.href = targetRoute;
      } else {
        router.push(targetRoute);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (result: {
    credential: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.googleAuth({
        credential: result.credential,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('vf_access_token', data.accessToken);
        localStorage.setItem('vf_user', JSON.stringify(data.user));
      }

      setAuth(data.user, data.accessToken);
      const targetRoute = data.user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';

      if (typeof window !== 'undefined') {
        window.location.href = targetRoute;
      } else {
        router.push(targetRoute);
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-teal-600 selection:text-white relative font-sans">


      {/* Header Navigation */}
      <header className="px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-slate-200 bg-white shadow-subtle z-10 gap-2">
        <Logo size="md" />

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <PwaInstallButton variant="header" />
          
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-500">No store account?</span>
            <Link href="/onboarding">
              <Button variant="secondary" size="sm" className="bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800 font-bold">
                Register Business →
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 z-10">
        <div className="w-full max-w-md space-y-6">
          
          {/* Card Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign In to Your Workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto font-medium">
              Access your inventory, phone IMEI registry, thermal receipts, and real-time sales ledger.
            </p>
          </div>

          {/* White Form Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
            <Suspense fallback={null}>
              <SessionExpiredAlert />
            </Suspense>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="font-medium">{error}</div>
              </div>
            )}

            {/* Google Sign In Button */}
            <GoogleAuthButton
              mode="signin"
              disabled={loading}
              onSuccess={handleGoogleSuccess}
              onError={(err) => setError(err)}
            />

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                or sign in with email
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Store Email */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@store.com"
                    required
                    disabled={loading}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs pl-9 focus:outline-none focus:border-teal-600 focus:bg-white font-medium placeholder:text-slate-400 transition disabled:opacity-75"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Password with Eye Toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800">Password</label>
                  <Link href="/forgot-password" className="text-[11px] text-teal-600 font-bold hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    disabled={loading}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 text-xs pl-9 pr-10 focus:outline-none focus:border-teal-600 focus:bg-white font-medium placeholder:text-slate-400 transition disabled:opacity-75"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    disabled={loading}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition p-0.5 rounded focus:outline-none"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button with Clean Animated Spinner */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={loading}
                className="w-full py-2.5 font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white border-none shadow-md mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                    <span>Signing In...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>

              {/* Mobile & Card Registration Link */}
              <div className="pt-3 border-t border-slate-100 text-center text-xs">
                <span className="text-slate-500 font-medium">Don't have a store account? </span>
                <Link href="/onboarding" className="text-teal-600 font-bold hover:underline block sm:inline mt-1 sm:mt-0">
                  Create a business account →
                </Link>
              </div>
            </form>
          </div>

        </div>
      </main>

      {/* Page Footer */}
      <footer className="py-4 text-center text-[11px] text-slate-500 border-t border-slate-200 bg-white">
        © {new Date().getFullYear()} VerifyFlow Enterprise Inc. All rights reserved.
      </footer>
    </div>
  );
}
