'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Check, Share, X, Monitor } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

type InstallPlatform = 'ios' | 'android' | 'desktop';

type InstallWindow = Window & {
  __ngInstallPrompt?: BeforeInstallPromptEvent | null;
  __ngInstalled?: boolean;
};

function detectPlatform(): InstallPlatform {
  if (typeof window === 'undefined') return 'desktop';
  const ua = window.navigator.userAgent.toLowerCase();
  // iPadOS reports itself as a Mac, so also look for a touch screen.
  const isIpadOs = ua.includes('macintosh') && (window.navigator.maxTouchPoints || 0) > 1;
  if (/iphone|ipad|ipod/.test(ua) || isIpadOs) return 'ios';
  if (ua.includes('android')) return 'android';
  return 'desktop';
}

/**
 * The browser's install offer is captured once in app/layout.tsx (it fires early,
 * often before any button exists) and shared by every Download App button.
 */
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform>('desktop');
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as InstallWindow;

    // Already running as the installed app
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isStandaloneMode);
    setPlatform(detectPlatform());

    const sync = () => {
      setDeferredPrompt(w.__ngInstallPrompt || null);
      setIsInstalled(isStandaloneMode || w.__ngInstalled === true);
    };
    sync();

    window.addEventListener('ng-install-change', sync);
    return () => window.removeEventListener('ng-install-change', sync);
  }, []);

  const triggerInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    const w = window as InstallWindow;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      // An offer can only be shown once; the browser sends a new one if it was declined.
      w.__ngInstallPrompt = null;
      if (choice.outcome === 'accepted') w.__ngInstalled = true;
      window.dispatchEvent(new Event('ng-install-change'));
      return choice.outcome === 'accepted';
    } catch (err) {
      console.error('Install prompt error:', err);
      return false;
    }
  };

  return {
    deferredPrompt,
    isInstalled,
    platform,
    isIOS: platform === 'ios',
    isStandalone,
    triggerInstall,
  };
}

export function PwaInstallModal({
  isOpen,
  onClose,
  platform = 'desktop',
}: {
  isOpen: boolean;
  onClose: () => void;
  platform?: InstallPlatform;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 sm:space-y-5 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pr-6">
          <div className="w-11 h-11 rounded-2xl bg-[#121417] text-white flex items-center justify-center font-extrabold text-base shadow-md shrink-0 border border-[#2E6F5E]/40 p-1">
            <BrandLogo size="sm" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Install NoxGuarda App</h3>
            <p className="text-xs sm:text-xs text-emerald-600 font-bold uppercase tracking-wider">Fast • Offline POS • Instant Barcode</p>
          </div>
        </div>

        <div className="space-y-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 text-xs text-slate-700">
          <div className="font-bold text-slate-900 flex items-center gap-2">
            {platform === 'desktop' ? (
              <Monitor className="w-4 h-4 text-teal-600 shrink-0" />
            ) : (
              <Smartphone className="w-4 h-4 text-teal-600 shrink-0" />
            )}
            <span>
              {platform === 'ios' && 'On iPhone or iPad:'}
              {platform === 'android' && 'On Android:'}
              {platform === 'desktop' && 'On a computer (Chrome or Edge):'}
            </span>
          </div>

          {platform === 'ios' && (
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-600 text-[11px] sm:text-xs leading-relaxed">
              <li>
                Tap the <span className="font-bold text-slate-900 inline-flex items-center gap-1"><Share className="w-3 h-3 text-blue-600 inline shrink-0" /> Share</span> button in your browser.
              </li>
              <li>
                Scroll down and tap <span className="font-bold text-slate-900">"Add to Home Screen"</span>.
              </li>
              <li>
                Tap <span className="font-bold text-slate-900">"Add"</span>. NoxGuarda now opens from your home screen like any other app.
              </li>
            </ol>
          )}

          {platform === 'android' && (
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-600 text-[11px] sm:text-xs leading-relaxed">
              <li>
                Tap the <span className="font-bold text-slate-900">menu (⋮)</span> at the top right of your browser.
              </li>
              <li>
                Tap <span className="font-bold text-slate-900">"Install app"</span> or <span className="font-bold text-slate-900">"Add to Home screen"</span>.
              </li>
              <li>
                Tap <span className="font-bold text-slate-900">"Install"</span>. NoxGuarda now opens from your home screen like any other app.
              </li>
            </ol>
          )}

          {platform === 'desktop' && (
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-600 text-[11px] sm:text-xs leading-relaxed">
              <li>
                Look for the <span className="font-bold text-slate-900">Install</span> icon at the right end of the address bar, or open the browser <span className="font-bold text-slate-900">menu (⋮)</span>.
              </li>
              <li>
                Click <span className="font-bold text-slate-900">"Install NoxGuarda"</span>.
              </li>
              <li>
                NoxGuarda opens in its own window and is added to your apps. If you do not see the option, the app may already be installed, or your browser does not support it (try Chrome or Edge).
              </li>
            </ol>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-1.5"
        >
          <span>Got It</span>
        </button>
      </div>
    </div>
  );
}

export function PwaInstallButton({
  variant = 'button',
  className = '',
}: {
  variant?: 'button' | 'header' | 'sidebar' | 'drawer';
  className?: string;
}) {
  const { deferredPrompt, isStandalone, isInstalled, platform, triggerInstall } = usePwaInstall();
  const [showModal, setShowModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vf_pwa_sidebar_dismissed') === 'true';
    }
    return false;
  });

  const handleClick = async () => {
    if (deferredPrompt) {
      // The browser shows its own install box. If the person says no, leave it at that.
      await triggerInstall();
      return;
    }
    // No install offer from this browser (iPhone, or already declined): show the steps.
    setShowModal(true);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vf_pwa_sidebar_dismissed', 'true');
    }
  };

  if (isStandalone || isInstalled || (variant === 'sidebar' && isDismissed)) {
    return null; // Nothing to offer once the app is installed, running as an app, or dismissed
  }

  if (variant === 'sidebar') {
    return (
      <>
        <div className={`relative p-3 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl text-white space-y-2.5 shadow-md border border-slate-700/50 ${className}`}>
          <div className="flex items-center justify-between gap-2 text-xs font-bold text-teal-300">
            <span>Install Native Kiosk App</span>
            <button
              onClick={handleDismiss}
              className="p-1 -mr-1 -mt-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition cursor-pointer"
              title="Dismiss banner"
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-snug">
            Run NoxGuarda with offline thermal receipts and instant camera scanning.
          </p>
          <button
            onClick={handleClick}
            className="w-full py-2 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download / Install App</span>
          </button>
        </div>
        <PwaInstallModal isOpen={showModal} onClose={() => setShowModal(false)} platform={platform} />
      </>
    );
  }

  if (variant === 'drawer') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`w-full flex items-center justify-between p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 font-bold text-xs transition hover:bg-teal-100 ${className}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-extrabold text-slate-900">Install Native App</div>
              <div className="text-xs text-teal-700 font-medium">Add NoxGuarda to your home screen</div>
            </div>
          </div>
          <span className="text-xs font-bold bg-teal-600 text-white px-2 py-1 rounded-lg">Install</span>
        </button>
        <PwaInstallModal isOpen={showModal} onClose={() => setShowModal(false)} platform={platform} />
      </>
    );
  }

  if (variant === 'header') {
    return (
      <>
        <button
          onClick={handleClick}
          title="Install NoxGuarda as an app on this device"
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 font-bold text-xs transition shadow-xs shrink-0 ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span className="hidden sm:inline">Download App</span>
          <span className="sm:hidden text-xs">App</span>
        </button>
        <PwaInstallModal isOpen={showModal} onClose={() => setShowModal(false)} platform={platform} />
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition ${className}`}
      >
        <Download className="w-4 h-4 text-white" />
        <span>Install / Download PWA</span>
      </button>
      <PwaInstallModal isOpen={showModal} onClose={() => setShowModal(false)} platform={platform} />
    </>
  );
}
