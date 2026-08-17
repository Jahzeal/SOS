'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Eye, EyeOff, Search, ChevronDown } from 'lucide-react';

// Common Input Container Wrapper for Label, Helper, Error
interface FieldWrapperProps {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  isSuccess?: boolean;
  required?: boolean;
  children: React.ReactNode;
  id?: string;
}

export function FieldWrapper({
  label,
  helperText,
  errorMessage,
  isSuccess,
  required,
  children,
  id,
}: FieldWrapperProps) {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700 tracking-tight">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {errorMessage ? (
        <p className="flex items-center gap-1 text-xs text-rose-600 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </p>
      ) : isSuccess ? (
        <p className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Validated successfully</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

// 1. Text / Email / Phone / Password / General Input
export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  isSuccess?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      isSuccess,
      leftIcon,
      rightIcon,
      type = 'text',
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const generatedId = React.useId();
    const fieldId = id || generatedId;

    const isPasswordType = type === 'password';
    const activeType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

    // Border states
    let borderClass = 'border-slate-200 focus:border-teal-600 focus:ring-teal-500/20';
    if (errorMessage) {
      borderClass = 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20';
    } else if (isSuccess) {
      borderClass = 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20 bg-emerald-50/20';
    }

    return (
      <FieldWrapper
        label={label}
        helperText={helperText}
        errorMessage={errorMessage}
        isSuccess={isSuccess}
        required={props.required}
        id={fieldId}
      >
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={fieldId}
            type={activeType}
            disabled={disabled}
            className={`w-full text-xs sm:text-sm px-3 py-2 bg-white text-slate-900 placeholder-slate-400 rounded-input border shadow-subtle transition-all duration-150 focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-9' : ''
            } ${rightIcon || isPasswordType ? 'pr-9' : ''} ${borderClass} ${className}`}
            {...props}
          />
          {isPasswordType ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-slate-400 hover:text-slate-600 text-xs focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          ) : (
            rightIcon && (
              <div className="absolute right-3 text-slate-400 pointer-events-none flex items-center justify-center">
                {rightIcon}
              </div>
            )
          )}
        </div>
      </FieldWrapper>
    );
  }
);
TextInput.displayName = 'TextInput';

// 2. Search Input Component
export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  shortcutHint?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className = '', shortcutHint = 'Ctrl+K', ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          ref={ref}
          type="text"
          className={`w-full text-xs sm:text-sm pl-9 pr-14 py-2 bg-white text-slate-900 placeholder-slate-400 rounded-input border border-slate-200 shadow-subtle focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all ${className}`}
          {...props}
        />
        {shortcutHint && (
          <kbd className="absolute right-3 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded">
            {shortcutHint}
          </kbd>
        )}
      </div>
    );
  }
);
SearchInput.displayName = 'SearchInput';

// 3. Dropdown / Select Component
export interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  options: { value: string; label: string }[];
}

export const SelectInput = React.forwardRef<HTMLSelectElement, SelectInputProps>(
  ({ label, helperText, errorMessage, options, className = '', id, ...props }, ref) => {
    const generatedId = React.useId();
    const fieldId = id || generatedId;

    return (
      <FieldWrapper label={label} helperText={helperText} errorMessage={errorMessage} id={fieldId}>
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={fieldId}
            className={`w-full text-xs sm:text-sm px-3 py-2 pr-9 bg-white text-slate-900 rounded-input border border-slate-200 shadow-subtle focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 appearance-none cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed ${
              errorMessage ? 'border-rose-300 bg-rose-50/20' : ''
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
        </div>
      </FieldWrapper>
    );
  }
);
SelectInput.displayName = 'SelectInput';

// 4. Textarea Component
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, errorMessage, className = '', id, ...props }, ref) => {
    const generatedId = React.useId();
    const fieldId = id || generatedId;

    return (
      <FieldWrapper label={label} helperText={helperText} errorMessage={errorMessage} id={fieldId}>
        <textarea
          ref={ref}
          id={fieldId}
          className={`w-full text-xs sm:text-sm p-3 bg-white text-slate-900 placeholder-slate-400 rounded-input border border-slate-200 shadow-subtle focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 min-h-[90px] resize-y ${
            errorMessage ? 'border-rose-300 bg-rose-50/20' : ''
          } ${className}`}
          {...props}
        />
      </FieldWrapper>
    );
  }
);
Textarea.displayName = 'Textarea';

// 5. Checkbox Component
export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className = '', id, ...props }, ref) => {
    const generatedId = React.useId();
    const fieldId = id || generatedId;

    return (
      <div className="flex items-start gap-2.5 select-none">
        <input
          ref={ref}
          id={fieldId}
          type="checkbox"
          className={`mt-0.5 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 focus:ring-2 cursor-pointer ${className}`}
          {...props}
        />
        <div>
          <label htmlFor={fieldId} className="text-xs sm:text-sm font-medium text-slate-800 cursor-pointer">
            {label}
          </label>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

// 6. Radio Component
export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, className = '', id, ...props }, ref) => {
    const generatedId = React.useId();
    const fieldId = id || generatedId;

    return (
      <div className="flex items-start gap-2.5 select-none">
        <input
          ref={ref}
          id={fieldId}
          type="radio"
          className={`mt-0.5 w-4 h-4 text-teal-600 border-slate-300 focus:ring-teal-500 focus:ring-2 cursor-pointer ${className}`}
          {...props}
        />
        <div>
          <label htmlFor={fieldId} className="text-xs sm:text-sm font-medium text-slate-800 cursor-pointer">
            {label}
          </label>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
    );
  }
);
Radio.displayName = 'Radio';
