'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, AlertTriangle, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.forgotPassword(email.trim());
      setSubmitted(true);
      if (res.resetUrl) {
        setDevResetUrl(res.resetUrl);
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Failed to request password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-teal-600 selection:text-white">
      
      {/* Header / Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-lg shadow-md">
            VF
          </div>
          <span className="font-extrabold text-slate-900 text-xl tracking-tight">VerifyFlow</span>
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Forgot Password?
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Enter your registered store account email to receive a password reset link.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-200/90 sm:px-10 space-y-6">
          
          {submitted ? (
            <div className="text-center space-y-4 animate-in fade-in zoom-in duration-200">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">Check Your Inbox</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">
                  If an account exists for <span className="font-bold text-slate-900">{email}</span>, password reset instructions have been dispatched.
                </p>
              </div>

              {devResetUrl && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl text-left space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">Development Link Preview</span>
                  <p className="text-[11px] text-slate-600">Click below to test the reset flow locally:</p>
                  <a
                    href={devResetUrl}
                    className="text-xs text-teal-600 font-mono font-bold break-all hover:underline block"
                  >
                    {devResetUrl}
                  </a>
                </div>
              )}

              <div className="pt-2">
                <Link href="/login">
                  <Button variant="secondary" size="md" fullWidth className="font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="font-bold text-slate-700 block">
                  Account Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@store.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-teal-600 text-xs"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                disabled={loading || !email.trim()}
                leftIcon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                className="bg-teal-600 hover:bg-teal-700 font-bold text-xs py-3 shadow-md shadow-teal-600/20 mt-2"
              >
                {loading ? 'Sending Reset Instructions...' : 'Send Password Reset Link'}
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}

        </div>
      </div>

    </div>
  );
}
