'use client';

import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { answerConfirm, dismissToast, getFeedbackState, subscribeFeedback } from '@/lib/feedback';

const TOAST_STYLES = {
  success: { box: 'bg-emerald-700 text-white', Icon: CheckCircle2 },
  error: { box: 'bg-rose-700 text-white', Icon: AlertTriangle },
  info: { box: 'bg-slate-900 text-white', Icon: Info },
} as const;

/** Renders toasts and the confirm dialog. Mounted once in app/providers.tsx. */
export function FeedbackHost() {
  const state = useSyncExternalStore(subscribeFeedback, getFeedbackState, getFeedbackState);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const pending = state.confirm;

  // Move focus into the dialog, and put it back where it was afterwards.
  useEffect(() => {
    if (pending) {
      previousFocus.current = document.activeElement as HTMLElement | null;
      cancelRef.current?.focus();
    } else if (previousFocus.current) {
      previousFocus.current.focus?.();
      previousFocus.current = null;
    }
  }, [pending]);

  const onDialogKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      answerConfirm(false);
    }
    // Keep Tab inside the two buttons.
    if (event.key === 'Tab') {
      event.preventDefault();
      const next = document.activeElement === cancelRef.current ? confirmRef.current : cancelRef.current;
      next?.focus();
    }
  };

  return (
    <>
      <div
        aria-live="polite"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-md pointer-events-none"
      >
        {state.toasts.map((toast) => {
          const { box, Icon } = TOAST_STYLES[toast.kind];
          return (
            <div
              key={toast.id}
              role={toast.kind === 'error' ? 'alert' : 'status'}
              className={`${box} pointer-events-auto rounded-xl shadow-lg px-4 py-3 flex items-start gap-3 text-sm font-semibold`}
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="flex-1 leading-snug break-words">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss message"
                className="shrink-0 rounded-md p-0.5 hover:bg-white/20"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>

      {pending && (
        <div
          className="fixed inset-0 z-[310] bg-slate-900/60 flex items-center justify-center p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) answerConfirm(false);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="feedback-confirm-title"
            aria-describedby="feedback-confirm-message"
            onKeyDown={onDialogKeyDown}
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-5 space-y-4"
          >
            <h2 id="feedback-confirm-title" className="text-base font-extrabold text-slate-900 dark:text-white">
              Please confirm
            </h2>
            <p id="feedback-confirm-message" className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">
              {pending.message}
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => answerConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                {pending.cancelLabel}
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={() => answerConfirm(true)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700"
              >
                {pending.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
