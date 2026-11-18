'use client';

import React, { useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface ComboboxProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  /** Shown at the bottom of the list when what was typed is not in it. */
  allowCustomHint?: string;
}

/**
 * A text box with a dropdown of suggestions. Tap the arrow (or the box) to see the
 * list, type to narrow it, or type something that is not in the list.
 */
export function Combobox({ label, value, onChange, options, placeholder, allowCustomHint = 'Not listed? Just type it.' }: ComboboxProps) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q || options.some((o) => o.toLowerCase() === q)) return options;
    const starts = options.filter((o) => o.toLowerCase().startsWith(q));
    const contains = options.filter((o) => !o.toLowerCase().startsWith(q) && o.toLowerCase().includes(q));
    return [...starts, ...contains];
  }, [options, value]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && open && active >= 0 && filtered[active]) {
      e.preventDefault();
      pick(filtered[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="space-y-1.5 relative">
      <label htmlFor={id} className="text-xs font-bold text-slate-700 block">{label}</label>
      <div className="relative">
        <input
          id={id}
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          className="w-full text-sm pl-3 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-accent-600"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={`Show ${label.toLowerCase()} list`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setOpen((o) => !o);
            inputRef.current?.focus();
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {open && (filtered.length > 0 || value.trim()) && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1 text-sm"
        >
          {filtered.map((o, i) => (
            <li
              key={o}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={o === value}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(o)}
              className={`px-3 py-2 cursor-pointer ${i === active ? 'bg-accent-50 text-accent-700' : 'text-slate-800 hover:bg-slate-50'} ${o === value ? 'font-bold' : ''}`}
            >
              {o}
            </li>
          ))}
          {value.trim() && !options.some((o) => o.toLowerCase() === value.trim().toLowerCase()) && (
            <li className="px-3 py-2 text-xs text-slate-500 border-t border-slate-100">
              {filtered.length === 0 ? `"${value.trim()}" will be saved as typed.` : allowCustomHint}
            </li>
          )}
          {!value.trim() && filtered.length === 0 && <li className="px-3 py-2 text-xs text-slate-500">{allowCustomHint}</li>}
        </ul>
      )}
    </div>
  );
}
