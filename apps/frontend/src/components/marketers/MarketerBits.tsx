'use client';

import React, { useState } from 'react';
import { Check, Copy, X } from 'lucide-react';

/** The marketer's account status, in plain words. */
export const MARKETER_STATUS: Record<string, { label: string; tone: string }> = {
  INVITED: { label: 'Invited', tone: 'bg-amber-50 text-amber-800 border-amber-200' },
  INVITE_EXPIRED: { label: 'Link expired', tone: 'bg-red-50 text-red-700 border-red-200' },
  ACTIVE: { label: 'Active', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  DISABLED: { label: 'Switched off', tone: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export function MarketerStatusBadge({ status }: { status: string }) {
  const s = MARKETER_STATUS[status] || MARKETER_STATUS.INVITED;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-bold ${s.tone}`}>{s.label}</span>;
}

/** Shows the invite link once it is made, so it can also be sent on WhatsApp. */
export function InviteLinkNotice({
  invite,
  onClose,
}: {
  invite: { email: string; inviteLink: string; emailSent: boolean };
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(invite.inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the link is visible to copy by hand */
    }
  };
  return (
    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-emerald-900">
          {invite.emailSent ? (
            <>Invite sent to <strong>{invite.email}</strong>. You can also send them this link on WhatsApp:</>
          ) : (
            <>The email could not be sent to <strong>{invite.email}</strong>. Send them this link on WhatsApp instead:</>
          )}
        </p>
        <button onClick={onClose} aria-label="Close" className="p-1 text-emerald-700 hover:text-emerald-900 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input readOnly value={invite.inviteLink} className="flex-1 min-w-0 text-xs font-mono px-3 py-2 bg-white border border-emerald-200 rounded-lg" />
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="text-xs text-emerald-800">The link works for 7 days.</p>
    </div>
  );
}
