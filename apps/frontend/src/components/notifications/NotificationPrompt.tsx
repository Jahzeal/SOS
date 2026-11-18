'use client';

import React, { useEffect, useState } from 'react';
import { BellRing, X as XIcon } from 'lucide-react';
import { needsInstallForPush, pushSupported, refreshPushSubscription, turnOnPush } from '@/lib/push';

const DISMISS_KEY = 'ng-push-prompt-dismissed';

/**
 * Dashboard card asking the store to turn on notifications. Shown only while the
 * browser has not been asked yet; if notifications are already allowed it quietly
 * makes sure this device is saved.
 */
export function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const iphoneHint = needsInstallForPush();

  useEffect(() => {
    if (!pushSupported()) {
      // iPhone in Safari: explain how to get notifications, unless dismissed.
      if (iphoneHint) {
        try {
          setShow(localStorage.getItem(DISMISS_KEY) !== '1');
        } catch {
          setShow(true);
        }
      }
      return;
    }
    if (Notification.permission === 'granted') {
      refreshPushSubscription();
      return;
    }
    if (Notification.permission === 'default') {
      try {
        setShow(localStorage.getItem(DISMISS_KEY) !== '1');
      } catch {
        setShow(true);
      }
    }
  }, [iphoneHint]);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {}
  };

  const turnOn = async () => {
    setBusy(true);
    setNote(null);
    try {
      const result = await turnOnPush();
      if (result === 'on') setShow(false);
      else if (result === 'denied') setNote('Notifications are blocked. You can allow them later in your browser settings.');
      else setNote('Notifications are not available right now. Please try again later.');
    } catch {
      setNote('Could not turn on notifications. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!show) return null;

  return (
    <div className="p-4 rounded-2xl bg-accent-50 dark:bg-accent-950/40 border border-accent-200 dark:border-accent-900 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-start gap-3 flex-1">
        <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-accent-200 dark:border-accent-800 text-accent-600 flex items-center justify-center shrink-0">
          <BellRing className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <p className="font-extrabold text-slate-900 dark:text-white text-sm">Turn on notifications</p>
          <p className="text-slate-600 dark:text-slate-300 font-medium">
            {iphoneHint
              ? 'On iPhone, tap Share then "Add to Home Screen", open NoxGuarda from there, and turn notifications on.'
              : 'Get reminders, tips, and a heads-up before your plan ends.'}
          </p>
          {note && <p role="status" className="mt-1 font-bold text-warning-800 dark:text-warning-300">{note}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!iphoneHint && (
          <button
            type="button"
            disabled={busy}
            onClick={turnOn}
            className="px-4 py-2 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-xs font-extrabold disabled:opacity-60"
          >
            {busy ? 'Turning on…' : 'Turn on'}
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Not now"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white/70 dark:hover:bg-slate-800"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
