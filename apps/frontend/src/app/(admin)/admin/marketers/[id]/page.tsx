'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, MessageCircle, Phone, Power, Send, Store, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { InviteLinkNotice, MarketerStatusBadge } from '@/components/marketers/MarketerBits';
import { ReferralCounts, ReferralStatusBadge } from '@/components/marketers/ReferralStatus';

const whatsappNumber = (phone: string) => {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.startsWith('0') ? `234${digits.slice(1)}` : digits;
};

export default function AdminMarketerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String((params as any)?.id || '');
  const [m, setM] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ email: string; inviteLink: string; emailSent: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      setM(await api.adminGetMarketer(id));
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Could not load this marketer.');
    }
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  const run = async (fn: () => Promise<any>) => {
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (err: any) {
      alert(err?.message || 'That did not work. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/admin/marketers" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Marketers
        </Link>
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      </div>
    );
  }
  if (!m) return <div className="py-16 text-center text-sm text-slate-400">Loading...</div>;

  const invited = m.status === 'INVITED' || m.status === 'INVITE_EXPIRED';

  return (
    <div className="space-y-6 pb-12 w-full min-w-0 max-w-full">
      <Link href="/admin/marketers" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" /> Marketers
      </Link>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{m.firstName} {m.lastName}</h1>
              <MarketerStatusBadge status={m.status} />
            </div>
            <div className="text-sm text-slate-500 break-all">{m.email}{m.phone ? ` · ${m.phone}` : ''}</div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" />
              {m.store ? <>Store: <strong className="text-slate-600">{m.store.name}</strong> (Gold, free)</> : 'No store yet. They have not set their password.'}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <a href={`mailto:${m.email}`} aria-label="Email" className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100">
              <Mail className="w-4 h-4" />
            </a>
            {m.phone && (
              <>
                <a href={`tel:${m.phone}`} aria-label="Call" className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100">
                  <Phone className="w-4 h-4" />
                </a>
                <a
                  href={`https://wa.me/${whatsappNumber(m.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
          {invited && (
            <>
              <button
                disabled={busy}
                onClick={() => run(async () => setNotice(await api.adminResendMarketerInvite(m.id)))}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-600 text-white text-xs font-bold hover:bg-accent-700 disabled:opacity-60 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Send a new link
              </button>
              <button
                disabled={busy}
                onClick={() => {
                  if (!confirm(`Cancel the invite for ${m.firstName}? Their link will stop working.`)) return;
                  run(async () => {
                    await api.adminCancelMarketerInvite(m.id);
                    router.push('/admin/marketers');
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-700 text-xs font-bold hover:bg-red-50 disabled:opacity-60 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Cancel invite
              </button>
            </>
          )}
          {!invited && (
            <button
              disabled={busy}
              onClick={() => {
                const off = m.status !== 'DISABLED';
                if (off && !confirm(`Switch off ${m.firstName}? They will be signed out and cannot use their store until you switch them back on.`)) return;
                run(() => api.adminSetMarketerActive(m.id, !off));
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-60 cursor-pointer ${
                m.status === 'DISABLED'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'border border-red-200 text-red-700 hover:bg-red-50'
              }`}
            >
              <Power className="w-3.5 h-3.5" /> {m.status === 'DISABLED' ? 'Switch back on' : 'Switch off'}
            </button>
          )}
        </div>
      </div>

      {notice && <InviteLinkNotice invite={notice} onClose={() => setNotice(null)} />}

      <ReferralCounts counts={m.counts} />

      <div className="space-y-3">
        <h2 className="font-extrabold text-slate-900">Businesses they onboarded</h2>
        {m.referrals.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400 bg-white border border-slate-200 rounded-2xl">No businesses added yet.</div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
            {m.referrals.map((r: any) => (
              <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 truncate">{r.storeName || r.shopName || r.email}</div>
                  <div className="text-xs text-slate-500 break-all">{r.email}{r.phone ? ` · ${r.phone}` : ''}</div>
                  <div className="text-[11px] text-slate-400">
                    Added {new Date(r.addedAt).toLocaleDateString()}
                    {r.signedUpAt ? ` · Signed up ${new Date(r.signedUpAt).toLocaleDateString()}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ReferralStatusBadge status={r.status} planName={r.planName} />
                  <button
                    disabled={busy}
                    onClick={() => {
                      if (!confirm(`Remove ${r.email} from ${m.firstName}'s list?`)) return;
                      run(() => api.adminRemoveMarketerReferral(m.id, r.id));
                    }}
                    aria-label={`Remove ${r.email}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
