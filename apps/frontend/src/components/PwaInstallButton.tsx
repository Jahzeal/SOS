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

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already installed / standalone mode
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) {
      setIsInstalled(true);
    }

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log('[PWA] VerifyFlow App installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (): Promise<boolean> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          return true;
        }
      } catch (err) {
        console.error('Install prompt error:', err);
      }
    }
    return false;
  };

  return {
    deferredPrompt,
    isInstalled,
    isIOS,
    isStandalone,
    triggerInstall,
  };
}

export function PwaInstallModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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
            <p className="text-[10px] sm:text-xs text-emerald-600 font-bold uppercase tracking-wider">Fast • Offline POS • Instant Barcode</p>
          </div>
        </div>

        <div className="space-y-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 text-xs text-slate-700">
          <div className="font-bold text-slate-900 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Mobile & Tablet Installation:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-600 text-[11px] sm:text-xs leading-relaxed">
            <li>Open this website in Safari or Chrome.</li>
            <li>
              Tap the <span className="font-bold text-slate-900 inline-flex items-center gap-1"><Share className="w-3 h-3 text-blue-600 inline shrink-0" /> Share / Menu</span> icon.
            </li>
            <li>
              Select <span className="font-bold text-slate-900">"Add to Home Screen"</span> or <span className="font-bold text-slate-900">"Install App"</span>.
            </li>
          </ol>
        </div>

        <div className="space-y-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 text-xs text-slate-700">
          <div className="font-bold text-slate-900 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Desktop (Chrome, Edge & Brave):</span>
          </div>
          <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed">
            Click the <span className="font-bold text-slate-900">Install App</span> icon directly in your browser's address bar to run NoxGuarda in fullscreen POS kiosk mode.
          </p>
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
  const { deferredPrompt, isStandalone, triggerInstall } = usePwaInstall();
  const [showModal, setShowModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vf_pwa_sidebar_dismissed') === 'true';
    }
    return false;
  });

  const handleClick = async () => {
    if (deferredPrompt) {
      const accepted = await triggerInstall();
      if (!accepted) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vf_pwa_sidebar_dismissed', 'true');
    }
  };

  if (isStandalone || (variant === 'sidebar' && isDismissed)) {
    return null; // Hide completely if already running in standalone PWA window or dismissed
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
          <p className="text-[11px] text-slate-300 leading-snug">
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
        <PwaInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
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
              <div className="text-[10px] text-teal-700 font-medium">Add NoxGuarda to your home screen</div>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-teal-600 text-white px-2 py-1 rounded-lg">Install</span>
        </button>
        <PwaInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  if (variant === 'header') {
    return (
      <>
        <button
          onClick={handleClick}
          title="Install NoxGuarda as Desktop/Mobile PWA"
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 font-bold text-xs transition shadow-xs shrink-0 ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span className="hidden sm:inline">Download App</span>
          <span className="sm:hidden text-[11px]">App</span>
        </button>
        <PwaInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
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
      <PwaInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
