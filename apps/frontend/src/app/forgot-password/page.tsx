'use client';
import { TextInput } from '@/components/ui/Input';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, AlertTriangle, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { Logo } from '@/components/ui/Logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await api.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Failed to request password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-accent-600 selection:text-white">
      
      {/* Header / Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Forgot Password?
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Enter your registered store account email to receive a password reset link.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200/90 sm:px-10 space-y-6">
          
          {submitted ? (
            <div className="text-center space-y-4 animate-in fade-in zoom-in duration-200">
              <div className="w-12 h-12 rounded-2xl bg-success-50 text-success-600 border border-success-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">Check Your Inbox</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">
                  If an account exists for <span className="font-bold text-slate-900">{email}</span>, password reset instructions have been dispatched.
                </p>
              </div>

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
                <div className="p-3 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <TextInput label="Account Email Address"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@store.com" leftIcon={<Mail className="w-4 h-4" />} />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                disabled={loading || !email.trim()}
                leftIcon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                className="bg-accent-600 hover:bg-accent-700 font-bold text-xs py-3 shadow-md shadow-accent-600/20 mt-2"
              >
                {loading ? 'Sending...' : 'Send Password Reset Link'}
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
