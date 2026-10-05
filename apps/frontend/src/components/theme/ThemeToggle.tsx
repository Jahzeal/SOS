'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '@/lib/theme-context';

interface ThemeToggleProps {
  variant?: 'simple' | 'dropdown' | 'compact';
  className?: string;
}

export function ThemeToggle({ variant = 'simple', className = '' }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-pulse ${className}`} />
    );
  }

  // Simple 1-click toggle between light & dark
  if (variant === 'simple') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all duration-200 shadow-subtle hover:shadow-md cursor-pointer group ${className}`}
        title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        aria-label="Toggle theme"
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
        ) : (
          <Moon className="w-4 h-4 text-slate-600 group-hover:-rotate-12 transition-transform duration-300" />
        )}
      </button>
    );
  }

  // Compact badge selector for settings / mobile menu
  if (variant === 'compact') {
    const options: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
      { mode: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> },
      { mode: 'dark', label: 'Dark', icon: <Moon className="w-3.5 h-3.5 text-blue-400" /> },
      { mode: 'system', label: 'Auto', icon: <Laptop className="w-3.5 h-3.5 text-slate-400" /> },
    ];

    return (
      <div className={`inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs ${className}`}>
        {options.map((opt) => (
          <button
            key={opt.mode}
            type="button"
            onClick={() => setTheme(opt.mode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              theme === opt.mode
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    );
  }

  // Full Dropdown with options
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-subtle cursor-pointer"
        title="Theme Settings"
        aria-label="Theme menu"
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-4 h-4 text-blue-400" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
          <div className="px-2.5 py-1 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Appearance
          </div>

          <button
            type="button"
            onClick={() => {
              setTheme('light');
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl font-bold transition text-left cursor-pointer ${
              theme === 'light'
                ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Light Mode</span>
            </div>
            {theme === 'light' && <Check className="w-3.5 h-3.5 text-teal-600" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme('dark');
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl font-bold transition text-left cursor-pointer ${
              theme === 'dark'
                ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-blue-400" />
              <span>Dark Mode</span>
            </div>
            {theme === 'dark' && <Check className="w-3.5 h-3.5 text-teal-600" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme('system');
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl font-bold transition text-left cursor-pointer ${
              theme === 'system'
                ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-slate-400" />
              <span>System Auto</span>
            </div>
            {theme === 'system' && <Check className="w-3.5 h-3.5 text-teal-600" />}
          </button>
        </div>
      )}
    </div>
  );
}
