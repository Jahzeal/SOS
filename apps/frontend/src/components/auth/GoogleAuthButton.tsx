'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface GoogleAuthButtonProps {
  mode?: 'signin' | 'signup';
  className?: string;
  disabled?: boolean;
  onSuccess: (result: {
    credential: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    picture?: string;
  }) => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
        };
      };
    };
  }
}

export function GoogleAuthButton({
  mode = 'signin',
  className = '',
  disabled = false,
  onSuccess,
  onError,
}: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleGoogleCredentialResponse = (response: any) => {
    setLoading(true);
    try {
      if (!response.credential) {
        throw new Error('No Google authorization token received.');
      }

      // Decode JWT token payload
      const parts = response.credential.split('.');
      let profile: any = {};
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          profile = {
            email: payload.email,
            firstName: payload.given_name || (payload.name ? payload.name.split(' ')[0] : 'Store'),
            lastName: payload.family_name || (payload.name ? payload.name.split(' ').slice(1).join(' ') : 'Owner'),
            fullName: payload.name || `${payload.given_name || 'Store'} ${payload.family_name || 'Owner'}`,
            picture: payload.picture,
          };
        } catch (e) {
          console.warn('Could not decode Google token claims on client:', e);
        }
      }

      onSuccess({
        credential: response.credential,
        ...profile,
      });
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      onError?.(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!clientId) return;

    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          context: mode === 'signup' ? 'signup' : 'signin',
        });
        setScriptLoaded(true);
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
      return;
    }

    const existingScript = document.getElementById('google-gis-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-gis-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGoogle();
      };
      script.onerror = () => {
        onError?.('Failed to load Google Sign-In SDK. Please check your internet connection.');
      };
      document.body.appendChild(script);
    } else {
      existingScript.addEventListener('load', initGoogle);
    }
  }, [clientId, mode]);

  const handleClick = () => {
    if (disabled || loading) return;

    if (window.google?.accounts?.id) {
      setLoading(true);
      try {
        // Trigger Google One-Tap or Google Account Selection prompt
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setLoading(false);
            // If prompt was suppressed by browser, click Google button in container if present
            const renderedBtn = googleBtnContainerRef.current?.querySelector('div[role="button"]') as HTMLElement;
            if (renderedBtn) {
              renderedBtn.click();
            } else if (notification.getNotDisplayedReason) {
              console.warn('Google prompt reason:', notification.getNotDisplayedReason());
            }
          }
        });
      } catch (err: any) {
        setLoading(false);
        onError?.(err.message || 'Unable to open Google prompt.');
      }
    } else {
      onError?.('Google Sign-In is initializing. Please try again in a few seconds.');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className={`w-full h-11 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-3 transition shadow-xs hover:border-slate-400 disabled:opacity-60 cursor-pointer ${className}`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
        ) : (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>
          {loading
            ? 'Connecting to Google...'
            : mode === 'signup'
            ? 'Sign up with Google'
            : 'Sign in with Google'}
        </span>
      </button>

      {/* Hidden GIS container */}
      <div ref={googleBtnContainerRef} className="hidden" />
    </>
  );
}
