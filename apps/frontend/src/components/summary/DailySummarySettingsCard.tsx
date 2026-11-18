'use client';

import React, { useEffect, useState } from 'react';
import { Mail, Plus, X as XIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Input';
import { api, DailySummarySettings } from '@/lib/api';

/** Settings → Business profile: the evening summary email. */
export function DailySummarySettingsCard() {
  const [settings, setSettings] = useState<DailySummarySettings | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api.getDailySummarySettings().then(setSettings).catch(() => setSettings(null));
  }, []);

  const save = async (patch: { enabled?: boolean; extraEmails?: string[] }) => {
    setSaving(true);
    setMessage(null);
    try {
      const next = await api.updateDailySummarySettings(patch);
      setSettings(next);
      setMessage({ ok: true, text: 'Saved.' });
      return true;
    } catch (err: any) {
      setMessage({ ok: false, text: err?.message || 'Could not save. Try again.' });
      return false;
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return null;

  const addEmail = async () => {
    const e = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setMessage({ ok: false, text: 'Enter a valid email address.' });
      return;
    }
    if (await save({ extraEmails: [...settings.extraEmails, e] })) setNewEmail('');
  };

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-accent-600" /> Daily summary email
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Every evening at {settings.sendTime}: today&apos;s sales, profit, devices sold, swaps and money owed. Owners get the whole
            store; managers get their branch without profit.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
          <input
            type="checkbox"
            className="w-4 h-4 accent-accent-600"
            checked={settings.enabled}
            disabled={saving || !settings.includedInPlan}
            onChange={(e) => save({ enabled: e.target.checked })}
          />
          <span className="text-xs font-bold text-slate-700">{settings.enabled ? 'On' : 'Off'}</span>
        </label>
      </div>

      {!settings.includedInPlan && (
        <p className="p-3 rounded-xl bg-warning-50 border border-warning-200 text-xs font-semibold text-warning-900">
          The daily summary comes with the Starter plan and above.
        </p>
      )}

      {settings.includedInPlan && settings.enabled && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-700">Also send it to (optional, up to 5)</p>
          {settings.extraEmails.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {settings.extraEmails.map((e) => (
                <li key={e} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold">
                  {e}
                  <button
                    type="button"
                    aria-label={`Remove ${e}`}
                    disabled={saving}
                    onClick={() => save({ extraEmails: settings.extraEmails.filter((x) => x !== e) })}
                    className="text-slate-500 hover:text-danger-600"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {settings.extraEmails.length < 5 && (
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <TextInput
                  aria-label="Email address to add"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. partner@gmail.com"
                />
              </div>
              <Button type="button" variant="secondary" size="md" disabled={saving || !newEmail.trim()} onClick={addEmail} leftIcon={<Plus className="w-4 h-4" />}>
                Add
              </Button>
            </div>
          )}
        </div>
      )}

      {message && (
        <p role="status" className={`text-xs font-bold ${message.ok ? 'text-success-700' : 'text-danger-700'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
