'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, Mail, ShieldAlert } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { SiteFooter, whatsappChatUrl } from '@/components/marketing/SiteFooter';
import { WhatsAppIcon } from '@/components/marketing/SocialIcons';
import { api } from '@/lib/api';

const TOPICS = [
  { value: 'general', label: 'General question' },
  { value: 'sales', label: 'Plans and pricing' },
  { value: 'support', label: 'Help with my account' },
  { value: 'billing', label: 'Billing and payments' },
  { value: 'stolen-device', label: 'Stolen or lost device' },
  { value: 'partnership', label: 'Partnership' },
];

const fieldClass =
  'w-full text-sm px-3 py-2.5 bg-white text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 shadow-sm transition focus:outline-none focus:ring-2 focus:border-teal-600 focus:ring-teal-500/20';
const labelClass = 'block text-xs font-bold text-slate-700 mb-1';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', storeName: '', topic: 'general', message: '', website: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const chatUrl = whatsappChatUrl();

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: '' }));
  };

  const validate = () => {
    const er: Record<string, string> = {};
    if (!form.name.trim()) er.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) er.email = 'Please enter a valid email address.';
    if (form.message.trim().length < 10) er.message = 'Please write a little more (at least 10 characters).';
    setErrors(er);
    return !Object.values(er).some(Boolean);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);
    if (!validate()) return;
    setSending(true);
    try {
      await api.sendContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        storeName: form.storeName.trim() || undefined,
        topic: form.topic,
        message: form.message.trim(),
        website: form.website || undefined,
      });
      setSent(true);
    } catch (err: any) {
      setSendError(err?.message || 'We could not send your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        <Logo size="md" />
        <nav className="flex items-center gap-4 text-xs font-bold text-slate-600">
          <Link href="/pricing" className="hover:text-slate-900 transition">Pricing</Link>
          <Link href="/login" className="hover:text-slate-900 transition">Sign In</Link>
        </nav>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Contact us</h1>
          <p className="text-sm text-slate-600">
            Questions about plans, your store account or a payment? Send us a message and we will reply by email.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7">
            {sent ? (
              <div role="status" className="py-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-extrabold">Message sent</h2>
                <p className="text-sm text-slate-600 max-w-sm mx-auto">
                  Thank you, {form.name.trim().split(' ')[0]}. We will reply to <strong>{form.email.trim()}</strong>.
                </p>
                <Link href="/" className="inline-block pt-2 text-sm font-bold text-teal-700 hover:underline">
                  Back to the home page
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" className={labelClass}>Your name *</label>
                    <input id="contact-name" className={fieldClass} value={form.name} onChange={set('name')} maxLength={100} autoComplete="name" placeholder="e.g. Chinedu Okafor" />
                    {errors.name && <p role="alert" className="text-xs text-rose-600 font-semibold mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="contact-email" className={labelClass}>Email address *</label>
                    <input id="contact-email" type="email" className={fieldClass} value={form.email} onChange={set('email')} maxLength={160} autoComplete="email" placeholder="you@example.com" />
                    {errors.email && <p role="alert" className="text-xs text-rose-600 font-semibold mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="contact-phone" className={labelClass}>Phone number (optional)</label>
                    <input id="contact-phone" type="tel" className={fieldClass} value={form.phone} onChange={set('phone')} maxLength={30} autoComplete="tel" placeholder="e.g. 0803 000 0000" />
                  </div>
                  <div>
                    <label htmlFor="contact-store" className={labelClass}>Store name (optional)</label>
                    <input id="contact-store" className={fieldClass} value={form.storeName} onChange={set('storeName')} maxLength={120} placeholder="e.g. Zenith Gadgets" />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-topic" className={labelClass}>What is it about?</label>
                  <select id="contact-topic" className={fieldClass} value={form.topic} onChange={set('topic')}>
                    {TOPICS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="contact-message" className={labelClass}>Message *</label>
                  <textarea id="contact-message" rows={6} className={fieldClass} value={form.message} onChange={set('message')} maxLength={3000} placeholder="How can we help?" />
                  <div className="flex justify-between mt-1">
                    {errors.message ? <p role="alert" className="text-xs text-rose-600 font-semibold">{errors.message}</p> : <span />}
                    <span className="text-xs text-slate-400">{form.message.length}/3000</span>
                  </div>
                </div>

                {/* Hidden from people; only bots fill it in. */}
                <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
                  <label htmlFor="contact-website">Website</label>
                  <input id="contact-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
                </div>

                {sendError && (
                  <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                    {sendError}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <p className="text-xs text-slate-500">
                    We use your details only to reply. See our <Link href="/privacy" className="font-semibold text-teal-700 underline">Privacy Policy</Link>.
                  </p>
                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold text-sm shadow-sm transition cursor-pointer"
                  >
                    <Mail className="w-4 h-4" /> {sending ? 'Sending...' : 'Send message'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <aside className="space-y-4">
            {chatUrl && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                <h2 className="font-extrabold text-sm">Prefer WhatsApp?</h2>
                <p className="text-xs text-slate-600">Chat with the NoxGuarda team directly.</p>
                <a
                  href={chatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5b] text-white font-bold text-sm transition"
                >
                  <WhatsAppIcon className="w-4 h-4" /> Chat with us on WhatsApp
                </a>
              </div>
            )}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-2">
              <h2 className="font-extrabold text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-teal-600" /> When we reply</h2>
              <p className="text-xs text-slate-600">We read every message and reply by email immediately.</p>
            </div>
            <div className="bg-rose-50 rounded-2xl border border-rose-200 p-5 space-y-2">
              <h2 className="font-extrabold text-sm text-rose-800 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Phone stolen?</h2>
              <p className="text-xs text-rose-800">Report it straight away so stores and buyers are warned.</p>
              <Link href="/report-stolen" className="inline-block text-xs font-bold text-rose-700 underline">Report a stolen device</Link>
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
