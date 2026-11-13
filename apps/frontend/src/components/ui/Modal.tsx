'use client';

import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Heading shown at the top and announced to screen readers. */
  title?: React.ReactNode;
  /** Smaller line under the title. */
  description?: React.ReactNode;
  /** Icon or badge shown to the left of the title. */
  icon?: React.ReactNode;
  children: React.ReactNode;
  /** Buttons row pinned to the bottom. */
  footer?: React.ReactNode;
  size?: ModalSize;
  /** Set false while saving so a stray click or Escape cannot close the dialog. */
  dismissible?: boolean;
  /** Needed only when there is no `title`. */
  ariaLabel?: string;
  /** Extra classes for the scrolling body. */
  className?: string;
}

const SIZES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The one dialog shell for the app. Handles the backdrop, Escape, keeping Tab inside the
 * dialog, and putting focus back where it was on close (same approach as FeedbackHost).
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = 'md',
  dismissible = true,
  ariaLabel,
  className = '',
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  // Move focus into the dialog, and put it back where it was afterwards.
  useEffect(() => {
    if (!isOpen) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) {
      const first = panel.querySelector<HTMLElement>('[data-autofocus]') ?? panel;
      first.focus();
    }
    return () => {
      previousFocus.current?.focus?.();
      previousFocus.current = null;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && dismissible) {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !panelRef.current) return;
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null
    );
    if (items.length === 0) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panelRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onMouseDown={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ? undefined : ariaLabel}
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={`w-full ${SIZES[size]} max-h-[92vh] flex flex-col bg-white border border-slate-200 shadow-2xl rounded-t-modal sm:rounded-modal outline-none animate-pop-in`}
      >
        {(title || dismissible) && (
          <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
            <div className="flex items-start gap-3 min-w-0">
              {icon && <div className="shrink-0">{icon}</div>}
              <div className="min-w-0">
                {title && (
                  <h2 id={titleId} className="text-base font-bold text-slate-900 leading-snug">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id={descId} className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            </div>
            {dismissible && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 p-1.5 -mr-1.5 -mt-1 rounded-control text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        <div className={`px-5 pb-5 overflow-y-auto custom-scrollbar ${title || dismissible ? '' : 'pt-5'} ${className}`}>
          {children}
        </div>

        {footer && (
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 rounded-b-none sm:rounded-b-modal flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
