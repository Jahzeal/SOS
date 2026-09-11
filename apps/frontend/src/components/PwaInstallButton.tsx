'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Check, Share, X, Sparkles, Monitor } from 'lucide-react';

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
    // Check if already installed / standalone
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-base shadow-md">
            VF
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Install VerifyFlow App</h3>
            <p className="text-xs text-teal-600 font-bold uppercase tracking-wider">Fast • Offline POS • Instant Barcode</p>
          </div>
        </div>

        <div className="space-y-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-700">
          <div className="font-bold text-slate-900 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-teal-600" />
            <span>Mobile & Tablet Installation:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-600">
            <li>Open this page in Safari or Chrome.</li>
            <li>
              Tap the <span className="font-bold text-slate-900 inline-flex items-center gap-1"><Share className="w-3 h-3 text-blue-600 inline" /> Share / Menu</span> button.
            </li>
            <li>
              Select <span className="font-bold text-slate-900">"Add to Home Screen"</span> or <span className="font-bold text-slate-900">"Install App"</span>.
            </li>
          </ol>
        </div>

        <div className="space-y-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-700">
          <div className="font-bold text-slate-900 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-teal-600" />
            <span>Desktop (Chrome, Edge & Brave):</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Click the <span className="font-bold text-slate-900">Install App</span> icon (computer or plus symbol) directly in your browser's address bar to run VerifyFlow in fullscreen POS kiosk mode.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition"
        >
          Got It
        </button>
      </div>
    </div>
  );
}

export function PwaInstallButton({
  variant = 'button',
  className = '',
}: {
  variant?: 'button' | 'header' | 'sidebar' | 'banner';
  className?: string;
}) {
  const { deferredPrompt, isInstalled, isStandalone, triggerInstall } = usePwaInstall();
  const [showModal, setShowModal] = useState(false);

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

  if (isStandalone) {
    return null; // App already runs as standalone PWA
  }

  if (variant === 'sidebar') {
    return (
      <>
        <div className={`p-3 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl text-white space-y-2.5 shadow-md border border-slate-700/50 ${className}`}>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Install Native Kiosk App</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            Run VerifyFlow with offline thermal receipts and instant camera scanning.
          </p>
          <button
            onClick={handleClick}
            className="w-full py-2 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download / Install App</span>
          </button>
        </div>
        <PwaInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  if (variant === 'header') {
    return (
      <>
        <button
          onClick={handleClick}
          title="Install VerifyFlow as Desktop/Mobile PWA"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 font-bold text-xs transition shadow-xs ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-teal-600" />
          <span>Download App</span>
        </button>
        <PwaInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition ${className}`}
      >
        <Download className="w-4 h-4 text-teal-400" />
        <span>Install / Download PWA</span>
      </button>
      <PwaInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
