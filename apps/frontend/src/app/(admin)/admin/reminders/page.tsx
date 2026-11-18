'use client';

import React, { useEffect, useState } from 'react';
import { BellRing, Clock, Loader2, Pencil, Plus, Send, Smartphone, Trash2, X as XIcon, FlaskConical } from 'lucide-react';
import { api, PushCampaign, PushCampaignInput } from '@/lib/api';
import { pushSupported, turnOnPush } from '@/lib/push';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const AUDIENCES: { value: PushCampaignInput['audience']; label: string }[] = [
  { value: 'OWNERS', label: 'Owners only' },
  { value: 'OWNERS_MANAGERS', label: 'Owners & managers' },
  { value: 'ALL_STAFF', label: 'Everyone in the store' },
];

const LINKS = [
  { value: '/dashboard', label: 'Dashboard' },
  { value: '/dashboard/checkout', label: 'Checkout' },
  { value: '/dashboard/checkout?mode=swap', label: 'Swap' },
  { value: '/dashboard/register', label: 'Register phone' },
  { value: '/dashboard/inventory', label: 'Inventory' },
  { value: '/dashboard/receipts', label: 'Receipts' },
  { value: '/dashboard/swaps', label: 'Swaps' },
  { value: '/dashboard/settings', label: 'Settings' },
  { value: '/dashboard/subscription', label: 'Subscription / renew' },
];

const EMPTY: PushCampaignInput = {
  name: '',
  kind: 'REMINDER',
  messages: [{ title: '', body: '', url: '/dashboard' }],
  targetPlans: [],
  audience: 'OWNERS',
  timesOfDay: ['08:00'],
  daysOfWeek: [],
  daysBeforeExpiry: [3, 1],
  isActive: true,
};

function scheduleText(c: PushCampaignInput) {
  const days = c.daysOfWeek.length === 0 || c.daysOfWeek.length === 7 ? 'Every day' : c.daysOfWeek.map((d) => DAY_NAMES[d]).join(', ');
  const times = c.timesOfDay.join(', ');
  if (c.kind === 'PLAN_EXPIRY') return `${c.daysBeforeExpiry.join(' and ')} day(s) before the plan ends · at ${times}`;
  return `${days} · ${c.timesOfDay.length}× a day (${times})`;
}

export default function AdminRemindersPage() {
  const [data, setData] = useState<{ campaigns: PushCampaign[]; devices: { total: number; byPlan: Record<string, number> }; enabled: boolean } | null>(null);
  const [plans, setPlans] = useState<{ code: string; name: string }[]>([]);
  const [editing, setEditing] = useState<{ id?: string; form: PushCampaignInput } | null>(null);
  const [newTime, setNewTime] = useState('12:00');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deviceOn, setDeviceOn] = useState(false);

  const load = () =>
    api
      .adminGetPushCampaigns()
      .then(setData)
      .catch((e) => setMessage({ ok: false, text: e?.message || 'Could not load reminders.' }));

  useEffect(() => {
    load();
    api
      .adminGetPlans()
      .then((r) => setPlans((r?.plans || []).map((p: any) => ({ code: String(p.code).toUpperCase(), name: p.name }))))
      .catch(() => setPlans([]));
    setDeviceOn(pushSupported() && Notification.permission === 'granted');
  }, []);

  const flash = (ok: boolean, text: string) => setMessage({ ok, text });

  const run = async (id: string, fn: () => Promise<any>, success: (r: any) => string) => {
    setBusyId(id);
    setMessage(null);
    try {
      const r = await fn();
      flash(true, success(r));
      await load();
    } catch (e: any) {
      flash(false, e?.message || 'Something went wrong.');
    } finally {
      setBusyId(null);
    }
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setFormError(null);
    try {
      await api.adminSavePushCampaign(editing.form, editing.id);
      setEditing(null);
      flash(true, 'Reminder saved.');
      await load();
    } catch (e: any) {
      setFormError(e?.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const f = editing?.form;
  const setF = (patch: Partial<PushCampaignInput>) => setEditing((e) => (e ? { ...e, form: { ...e.form, ...patch } } : e));
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <BellRing className="w-6 h-6 text-blue-600" /> Reminders
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Notifications that go to stores' phones and computers: daily nudges, tips, and plan-ending reminders.
            Choose how often each one goes out and which plans get it.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setEditing({ form: { ...EMPTY, messages: [{ ...EMPTY.messages[0] }] } });
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"
        >
          <Plus className="w-4 h-4" /> New reminder
        </button>
      </div>

      {data && !data.enabled && (
        <div role="alert" className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-semibold">
          Notifications are switched off on the server: add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Vercel (backend project), then redeploy.
        </div>
      )}

      {/* Devices */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">Devices with notifications on</p>
          <p className="text-2xl font-extrabold text-slate-900">{data?.devices.total ?? '—'}</p>
          {data && (
            <p className="text-xs text-slate-500 mt-1">
              {Object.entries(data.devices.byPlan)
                .filter(([k]) => k !== 'ADMIN')
                .map(([k, v]) => `${k}: ${v}`)
                .join(' · ') || 'No stores yet'}
            </p>
          )}
        </div>
        <div className="md:col-span-2 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-sm">
            <p className="font-bold text-slate-900 flex items-center gap-2"><Smartphone className="w-4 h-4 text-blue-600" /> This device</p>
            <p className="text-xs text-slate-500">Turn notifications on here to receive "Send test to me".</p>
          </div>
          {deviceOn ? (
            <span className="text-xs font-bold text-emerald-700">✓ Notifications on</span>
          ) : (
            <button
              type="button"
              onClick={async () => {
                const r = await turnOnPush().catch(() => 'unavailable' as const);
                if (r === 'on') {
                  setDeviceOn(true);
                  flash(true, 'Notifications are on for this device.');
                  load();
                } else flash(false, r === 'denied' ? 'Notifications are blocked in this browser.' : 'Notifications are not available here.');
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-bold text-slate-800"
            >
              Turn on notifications on this device
            </button>
          )}
        </div>
      </div>

      {message && (
        <p role="status" className={`p-3 rounded-xl text-sm font-bold ${message.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </p>
      )}

      {/* List */}
      {!data ? (
        <div className="py-16 flex justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : data.campaigns.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-3">
          <p className="font-bold text-slate-900">No reminders yet</p>
          <p className="text-sm text-slate-500">Start with three suggested ones (Good morning, Did you know?, Plan ending) and edit them, or create your own.</p>
          <button
            type="button"
            onClick={() => run('starter', () => api.adminAddStarterPushCampaigns(), () => 'Suggested reminders added. Edit them as you like.')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"
          >
            Add suggested reminders
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {data.campaigns.map((c) => (
            <div key={c.id} className={`p-4 rounded-2xl border shadow-sm bg-white ${c.isActive ? 'border-slate-200' : 'border-slate-200 opacity-70'}`}>
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-slate-900">{c.name}</h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {c.kind === 'PLAN_EXPIRY' ? 'Plan ending' : `${c.messages.length} message${c.messages.length === 1 ? '' : 's'}, in turn`}
                    </span>
                    {!c.isActive && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Paused</span>}
                  </div>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {scheduleText(c)}</p>
                  <p className="text-xs text-slate-500">
                    {c.targetPlans.length ? c.targetPlans.join(', ') : 'All plans'} · {AUDIENCES.find((a) => a.value === c.audience)?.label}
                    {c.lastSentAt ? ` · last sent ${new Date(c.lastSentAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ' · not sent yet'}
                  </p>
                  <p className="text-sm text-slate-800 pt-1 truncate">
                    <strong>{c.messages[0]?.title}</strong> — {c.messages[0]?.body}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer mr-1">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-blue-600"
                      checked={c.isActive}
                      disabled={busyId === c.id}
                      onChange={(e) => run(c.id, () => api.adminSetPushCampaignActive(c.id, e.target.checked), () => (e.target.checked ? 'Reminder switched on.' : 'Reminder paused.'))}
                    />
                    On
                  </label>
                  <button type="button" disabled={busyId === c.id} onClick={() => run(c.id, () => api.adminTestPushCampaign(c.id), () => 'Test sent to your device(s).')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50">
                    <FlaskConical className="w-3.5 h-3.5" /> Test to me
                  </button>
                  <button
                    type="button"
                    disabled={busyId === c.id}
                    onClick={() => {
                      if (!window.confirm(`Send "${c.name}" to all matching stores now?`)) return;
                      run(c.id, () => api.adminSendPushCampaignNow(c.id), (r) => `Sent to ${r.delivered} of ${r.recipients} device(s).`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Send className="w-3.5 h-3.5" /> Send now
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormError(null);
                      setEditing({
                        id: c.id,
                        form: {
                          name: c.name, kind: c.kind, messages: c.messages.map((m) => ({ ...m })), targetPlans: c.targetPlans,
                          audience: c.audience, timesOfDay: c.timesOfDay, daysOfWeek: c.daysOfWeek, daysBeforeExpiry: c.daysBeforeExpiry, isActive: c.isActive,
                        },
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${c.name}`}
                    disabled={busyId === c.id}
                    onClick={() => {
                      if (!window.confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
                      run(c.id, () => api.adminDeletePushCampaign(c.id), () => 'Reminder deleted.');
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500">
        Words in braces are filled in for each person: <code>{'{firstName}'}</code>, <code>{'{store}'}</code>, and for plan-ending reminders
        also <code>{'{plan}'}</code>, <code>{'{date}'}</code>, <code>{'{days}'}</code>. Times are Lagos time.
      </p>

      {/* Editor */}
      {editing && f && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-start sm:items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Edit reminder">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-5 space-y-5 my-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">{editing.id ? 'Edit reminder' : 'New reminder'}</h2>
              <button type="button" aria-label="Close" onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><XIcon className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="space-y-1 text-sm">
                <span className="font-bold text-slate-700">Name (only you see this)</span>
                <input value={f.name} onChange={(e) => setF({ name: e.target.value })} placeholder="e.g. Good morning" className="w-full px-3 py-2 border border-slate-200 rounded-xl" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-bold text-slate-700">Type</span>
                <select value={f.kind} onChange={(e) => setF({ kind: e.target.value as any })} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white">
                  <option value="REMINDER">Reminder / tip (messages take turns)</option>
                  <option value="PLAN_EXPIRY">Plan ending (sent before each store's plan ends)</option>
                </select>
              </label>
            </div>

            {/* Messages */}
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-700">
                {f.kind === 'PLAN_EXPIRY' ? 'Message' : 'Messages (one goes out each time, in turn)'}
              </p>
              {f.messages.map((m, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex gap-2">
                    <input value={m.title} maxLength={80} onChange={(e) => setF({ messages: f.messages.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} placeholder="Title, e.g. Good morning, {firstName} ☀️" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold" />
                    {f.messages.length > 1 && (
                      <button type="button" aria-label="Remove message" onClick={() => setF({ messages: f.messages.filter((_, j) => j !== i) })} className="p-2 rounded-lg text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                  <textarea value={m.body} maxLength={240} rows={2} onChange={(e) => setF({ messages: f.messages.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)) })} placeholder="Text, e.g. Did you know you can swap phones at Checkout?" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    Opens:
                    <select value={m.url || '/dashboard'} onChange={(e) => setF({ messages: f.messages.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} className="px-2 py-1 border border-slate-200 rounded-lg bg-white">
                      {LINKS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </label>
                </div>
              ))}
              {f.kind === 'REMINDER' && f.messages.length < 20 && (
                <button type="button" onClick={() => setF({ messages: [...f.messages, { title: '', body: '', url: '/dashboard' }] })} className="text-sm font-bold text-blue-600 hover:underline">
                  + Add another message
                </button>
              )}
            </div>

            {/* How often */}
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-700">How often</p>
              {f.kind === 'PLAN_EXPIRY' ? (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-slate-600">Days before the plan ends:</span>
                  {[14, 7, 5, 3, 2, 1, 0].map((d) => (
                    <button key={d} type="button" aria-pressed={f.daysBeforeExpiry.includes(d)} onClick={() => setF({ daysBeforeExpiry: toggle(f.daysBeforeExpiry, d) })}
                      className={`px-3 py-1 rounded-lg border text-xs font-bold ${f.daysBeforeExpiry.includes(d) ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}>
                      {d === 0 ? 'On the day' : d}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-slate-600">Days:</span>
                  <button type="button" aria-pressed={f.daysOfWeek.length === 0} onClick={() => setF({ daysOfWeek: [] })}
                    className={`px-3 py-1 rounded-lg border text-xs font-bold ${f.daysOfWeek.length === 0 ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}>Every day</button>
                  {DAY_NAMES.map((n, d) => (
                    <button key={n} type="button" aria-pressed={f.daysOfWeek.includes(d)} onClick={() => setF({ daysOfWeek: toggle(f.daysOfWeek, d).sort() })}
                      className={`px-3 py-1 rounded-lg border text-xs font-bold ${f.daysOfWeek.includes(d) ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}>{n}</button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-slate-600">{f.kind === 'PLAN_EXPIRY' ? 'Send at:' : `Times a day (${f.timesOfDay.length}):`}</span>
                {f.timesOfDay.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-bold">
                    {t}
                    {f.timesOfDay.length > 1 && (
                      <button type="button" aria-label={`Remove ${t}`} onClick={() => setF({ timesOfDay: f.timesOfDay.filter((x) => x !== t) })}><XIcon className="w-3 h-3" /></button>
                    )}
                  </span>
                ))}
                {(f.kind === 'REMINDER' || f.timesOfDay.length === 0) && (
                  <span className="inline-flex items-center gap-1">
                    <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} aria-label="Time to add" className="px-2 py-1 border border-slate-200 rounded-lg text-xs" />
                    <button type="button" onClick={() => newTime && !f.timesOfDay.includes(newTime) && setF({ timesOfDay: [...f.timesOfDay, newTime].sort() })} className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold">Add time</button>
                  </span>
                )}
              </div>
            </div>

            {/* Who */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-700">Which plans</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" aria-pressed={f.targetPlans.length === 0} onClick={() => setF({ targetPlans: [] })}
                    className={`px-3 py-1 rounded-lg border text-xs font-bold ${f.targetPlans.length === 0 ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}>All plans</button>
                  {plans.map((p) => (
                    <button key={p.code} type="button" aria-pressed={f.targetPlans.includes(p.code)} onClick={() => setF({ targetPlans: toggle(f.targetPlans, p.code) })}
                      className={`px-3 py-1 rounded-lg border text-xs font-bold ${f.targetPlans.includes(p.code) ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}>{p.name}</button>
                  ))}
                </div>
              </div>
              <label className="space-y-2 text-sm">
                <span className="font-bold text-slate-700 block">Who in the store</span>
                <select value={f.audience} onChange={(e) => setF({ audience: e.target.value as any })} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white">
                  {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </label>
            </div>

            {formError && <p role="alert" className="text-sm font-bold text-red-700">{formError}</p>}

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                <input type="checkbox" className="w-4 h-4 accent-blue-600" checked={f.isActive} onChange={(e) => setF({ isActive: e.target.checked })} />
                Switched on
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold">Cancel</button>
                <button type="button" disabled={saving} onClick={save} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save reminder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
