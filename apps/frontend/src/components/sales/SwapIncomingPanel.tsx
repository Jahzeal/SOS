'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Barcode, CheckCircle2, Laptop, Loader2, ShieldAlert, Smartphone } from 'lucide-react';
import { TextInput } from '@/components/ui/Input';
import { ImeiCameraScanner } from '@/components/scanner/ImeiCameraScanner';
import { validateLuhnIMEI } from '@/lib/imei-utils';
import { api, TradeInCheck } from '@/lib/api';
import { Combobox } from '@/components/ui/Combobox';
import { brandsFor, modelsFor } from '@/lib/device-catalog';

/** The device the customer is giving the store, as typed at the counter. */
export interface SwapIncoming {
  category: 'PHONE' | 'LAPTOP';
  imei1: string;
  imei2: string;
  serialNumber: string;
  brand: string;
  model: string;
  storageCapacity: string;
  color: string;
  condition: 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'FOR_PARTS';
  tradeInValue: string;
  idType: string;
  idNumber: string;
  ownershipConfirmed: boolean;
}

export const EMPTY_SWAP_INCOMING: SwapIncoming = {
  category: 'PHONE',
  imei1: '',
  imei2: '',
  serialNumber: '',
  brand: '',
  model: '',
  storageCapacity: '',
  color: '',
  condition: 'GOOD',
  tradeInValue: '',
  idType: '',
  idNumber: '',
  ownershipConfirmed: false,
};

export type SwapCheckStatus = 'idle' | 'checking' | 'clear' | 'warning' | 'stolen' | 'inStock' | 'invalid' | 'error';

export interface SwapCheckState {
  status: SwapCheckStatus;
  result?: TradeInCheck;
}

const CONDITIONS: { value: SwapIncoming['condition']; label: string }[] = [
  { value: 'LIKE_NEW', label: 'Like new' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'FOR_PARTS', label: 'For parts' },
];

const ID_TYPES = ['NIN', "Driver's licence", "Voter's card", 'International passport', 'Other'];

/** Reads a typed amount such as "150,000" or "₦150000". */
export function parseSwapValue(raw: string): number | null {
  const cleaned = raw.replace(/[,\s₦]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** "150000" → "150,000" while typing (whole naira only). */
export function withCommas(raw: string) {
  const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 12);
  return digits ? Number(digits).toLocaleString('en-NG') : '';
}

const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function underThousand(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h) parts.push(`${ONES[h]} hundred`);
  if (rest) {
    const words = rest < 20 ? ONES[rest] : `${TENS[Math.floor(rest / 10)]}${rest % 10 ? `-${ONES[rest % 10]}` : ''}`;
    parts.push(h ? `and ${words}` : words);
  }
  return parts.join(' ');
}

/** 150000 → "one hundred and fifty thousand naira", so a wrong number of zeros is easy to spot. */
export function nairaInWords(amount: number): string {
  let n = Math.floor(amount);
  if (n === 0) return 'zero naira';
  const scales = ['', 'thousand', 'million', 'billion'];
  const chunks: string[] = [];
  for (let i = 0; n > 0 && i < scales.length; i++) {
    const part = n % 1000;
    if (part) chunks.unshift(`${underThousand(part)}${scales[i] ? ` ${scales[i]}` : ''}`);
    n = Math.floor(n / 1000);
  }
  return `${chunks.join(', ')} naira`;
}

/** What is still missing before the swap can be completed, or null when it is ready. */
export function swapIncomingProblem(v: SwapIncoming, check: SwapCheckState): string | null {
  if (v.category === 'PHONE' && v.imei1.replace(/\D/g, '').length !== 15) return 'Enter the 15-digit IMEI of the phone coming in.';
  if (v.category === 'LAPTOP' && v.serialNumber.trim().length < 4) return 'Enter the serial number of the laptop coming in.';
  if (check.status === 'stolen') return 'This device is reported stolen. Do not accept it.';
  if (check.status === 'inStock') return 'This device is already in your stock.';
  if (check.status === 'invalid') return 'The IMEI looks mistyped. Check it again.';
  if (check.status === 'checking') return 'Checking the device…';
  if (!v.brand.trim() || !v.model.trim()) return 'Enter the brand and model of the device coming in.';
  if (parseSwapValue(v.tradeInValue) === null) return 'Enter the trade-in value.';
  if (!v.ownershipConfirmed) return 'Tick the box to confirm the customer owns the device.';
  return null;
}

function formatDate(iso?: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface Props {
  value: SwapIncoming;
  onChange: React.Dispatch<React.SetStateAction<SwapIncoming>>;
  check: SwapCheckState;
  onCheckChange: (next: SwapCheckState) => void;
}

export function SwapIncomingPanel({ value, onChange, check, onCheckChange }: Props) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const checkSeq = useRef(0);
  const isPhone = value.category === 'PHONE';
  const identifier = isPhone ? value.imei1.replace(/\D/g, '') : value.serialNumber.trim();

  const set = <K extends keyof SwapIncoming>(key: K, v: SwapIncoming[K]) => onChange((prev) => ({ ...prev, [key]: v }));

  // Check the device as soon as a full IMEI or a serial number is in.
  useEffect(() => {
    const seq = ++checkSeq.current;
    if (isPhone ? identifier.length !== 15 : identifier.length < 4) {
      onCheckChange({ status: 'idle' });
      return;
    }
    if (isPhone && !validateLuhnIMEI(identifier)) {
      onCheckChange({ status: 'invalid' });
      return;
    }
    onCheckChange({ status: 'checking' });
    const t = setTimeout(async () => {
      try {
        const result = await api.checkTradeInDevice(identifier, value.category);
        if (seq !== checkSeq.current) return;
        const status: SwapCheckStatus = result.stolen
          ? 'stolen'
          : result.alreadyInStock
            ? 'inStock'
            : result.otherStore
              ? 'warning'
              : 'clear';
        onCheckChange({ status, result });

        // Fill in brand and model when we already know the device.
        // Only fills empty boxes, so nothing staff typed meanwhile is overwritten.
        if (!result.stolen) {
          const own = result.ownDevice;
          if (own) {
            onChange((prev) => ({
              ...prev,
              brand: prev.brand || own.brand || '',
              model: prev.model || own.model || '',
              storageCapacity: prev.storageCapacity || own.storageCapacity || '',
              color: prev.color || own.color || '',
            }));
          } else if (!value.brand.trim() || !value.model.trim()) {
            const found = await api
              .identifyDevice({ identifier, deviceType: isPhone ? 'phone' : 'laptop', identifierType: isPhone ? 'imei' : 'serial' })
              .catch(() => null);
            const device = found?.status === 'identified' ? found.device : null;
            if (seq === checkSeq.current && device) {
              onChange((prev) => ({
                ...prev,
                brand: prev.brand || device.manufacturer || '',
                model: prev.model || device.productName || '',
              }));
            }
          }
        }
      } catch {
        if (seq === checkSeq.current) onCheckChange({ status: 'error' });
      }
    }, 400);
    return () => clearTimeout(t);
    // Only re-check when the identifier or device type changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identifier, value.category]);

  const stolen = check.status === 'stolen';

  return (
    <div
      className={`p-6 rounded-2xl border shadow-sm space-y-4 transition-colors ${
        stolen ? 'bg-danger-50 border-danger-300' : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-3">
        <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-accent-600" /> Device the customer is dropping
        </h2>
        <div role="group" aria-label="Device type" className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 shrink-0">
          {(['PHONE', 'LAPTOP'] as const).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={value.category === c}
              onClick={() =>
                onChange((prev) =>
                  prev.category === c ? prev : { ...EMPTY_SWAP_INCOMING, category: c, tradeInValue: prev.tradeInValue },
                )
              }
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition-colors ${
                value.category === c ? 'bg-white text-accent-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {c === 'PHONE' ? <Smartphone className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
              {c === 'PHONE' ? 'Phone' : 'Laptop'}
            </button>
          ))}
        </div>
      </div>

      {/* Identifier */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {isPhone ? (
          <>
            <TextInput
              label="IMEI 1"
              inputMode="numeric"
              value={value.imei1}
              onChange={(e) => set('imei1', e.target.value.replace(/\D/g, '').slice(0, 15))}
              placeholder="15 digits, dial *#06#"
              leftIcon={<Barcode className="w-4 h-4" />}
              labelAction={
                <button type="button" onClick={() => setScannerOpen(true)} className="text-xs font-bold text-accent-600 hover:underline">
                  Scan
                </button>
              }
            />
            <TextInput
              label="IMEI 2 (optional)"
              inputMode="numeric"
              value={value.imei2}
              onChange={(e) => set('imei2', e.target.value.replace(/\D/g, '').slice(0, 15))}
              placeholder="Dual-SIM phones only"
            />
          </>
        ) : (
          <div className="sm:col-span-2">
            <TextInput
              label="Serial number"
              value={value.serialNumber}
              onChange={(e) => set('serialNumber', e.target.value.toUpperCase().slice(0, 60))}
              placeholder="On the sticker under the laptop"
              leftIcon={<Barcode className="w-4 h-4" />}
              labelAction={
                <button type="button" onClick={() => setScannerOpen(true)} className="text-xs font-bold text-accent-600 hover:underline">
                  Scan
                </button>
              }
            />
          </div>
        )}
      </div>

      {/* Check result */}
      <div aria-live="polite">
        {check.status === 'checking' && (
          <p className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking stolen reports…
          </p>
        )}
        {check.status === 'invalid' && (
          <p className="flex items-center gap-2 text-xs font-bold text-warning-800">
            <AlertTriangle className="w-4 h-4" /> This IMEI looks mistyped. Check it again (dial *#06# on the phone).
          </p>
        )}
        {check.status === 'error' && (
          <p className="flex items-center gap-2 text-xs font-bold text-warning-800">
            <AlertTriangle className="w-4 h-4" /> Could not check the device right now. It will be checked again when you complete the swap.
          </p>
        )}
        {check.status === 'clear' && (
          <p className="flex items-center gap-2 text-xs font-bold text-success-700">
            <CheckCircle2 className="w-4 h-4" />
            No stolen reports.{check.result?.soldByUsBefore ? ' Your store sold this device before.' : ' Not in any other store.'}
          </p>
        )}
        {check.status === 'warning' && check.result?.otherStore && (
          <p className="flex items-start gap-2 text-xs font-bold text-warning-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              No stolen reports, but {check.result.otherStore.name} registered this device on {formatDate(check.result.otherStore.since)}.
              Ask the customer for the receipt.
            </span>
          </p>
        )}
        {check.status === 'inStock' && (
          <p className="flex items-center gap-2 text-xs font-bold text-danger-700">
            <AlertTriangle className="w-4 h-4" /> This device is already in your stock, so it cannot be taken in again.
          </p>
        )}
        {stolen && (
          <div role="alert" className="p-3 rounded-xl bg-danger-600 text-white flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <div className="text-xs">
              <p className="font-extrabold text-sm">REPORTED STOLEN{check.result?.stolenSince ? ` on ${formatDate(check.result.stolenSince)}` : ''}</p>
              <p className="font-semibold">Do not accept this device. This attempt has been saved for the store owner.</p>
            </div>
          </div>
        )}
      </div>

      {!stolen && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Combobox
              label="Brand"
              value={value.brand}
              options={brandsFor(value.category)}
              placeholder={isPhone ? 'Pick or type, e.g. Apple' : 'Pick or type, e.g. HP'}
              onChange={(brand) =>
                onChange((prev) => {
                  // A model from the old brand's list does not belong to the new brand.
                  const oldList = modelsFor(prev.category, prev.brand);
                  const keepModel = !oldList.includes(prev.model) || modelsFor(prev.category, brand).includes(prev.model);
                  return { ...prev, brand, model: keepModel ? prev.model : '' };
                })
              }
            />
            <Combobox
              label="Model"
              value={value.model}
              options={modelsFor(value.category, value.brand)}
              placeholder={value.brand ? 'Pick or type the model' : isPhone ? 'e.g. iPhone 11' : 'e.g. EliteBook 840'}
              allowCustomHint={value.brand ? 'Not listed? Just type it.' : 'Pick a brand to see its models, or just type.'}
              onChange={(model) => set('model', model)}
            />
            <TextInput
              label={isPhone ? 'Storage (optional)' : 'Specs (optional)'}
              value={value.storageCapacity}
              onChange={(e) => set('storageCapacity', e.target.value)}
              placeholder={isPhone ? 'e.g. 64GB' : 'e.g. i5, 8GB RAM, 256GB'}
            />
            <TextInput label="Colour (optional)" value={value.color} onChange={(e) => set('color', e.target.value)} placeholder="e.g. Black" />
          </div>

          <div>
            <p className="text-xs font-bold text-slate-700 mb-1.5">Condition</p>
            <div role="group" aria-label="Condition" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CONDITIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  aria-pressed={value.condition === c.value}
                  onClick={() => set('condition', c.value)}
                  className={`px-3 py-2 rounded-xl border text-xs font-extrabold transition-colors ${
                    value.condition === c.value
                      ? 'border-accent-600 bg-accent-50 text-accent-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <TextInput
            label="Trade-in value (₦)"
            inputMode="numeric"
            value={value.tradeInValue}
            onChange={(e) => set('tradeInValue', withCommas(e.target.value))}
            placeholder="What you are giving the customer for it, e.g. 150,000"
          />
          {parseSwapValue(value.tradeInValue) ? (
            <p className="-mt-2 text-xs font-semibold text-slate-600" aria-live="polite">
              ₦{withCommas(value.tradeInValue)}: {nairaInWords(parseSwapValue(value.tradeInValue) || 0)}
            </p>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="swap-id-type" className="text-xs font-bold text-slate-700">Customer ID (optional)</label>
              <select
                id="swap-id-type"
                value={value.idType}
                onChange={(e) => set('idType', e.target.value)}
                className="w-full text-sm px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-accent-600"
              >
                <option value="">No ID taken</option>
                {ID_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            {value.idType && (
              <TextInput label="ID number" value={value.idNumber} onChange={(e) => set('idNumber', e.target.value.slice(0, 60))} />
            )}
          </div>

          <label htmlFor="swap-ownership" className="flex items-start gap-3 p-3 rounded-xl bg-warning-50 border border-warning-200 cursor-pointer select-none">
            <input
              id="swap-ownership"
              type="checkbox"
              checked={value.ownershipConfirmed}
              onChange={(e) => set('ownershipConfirmed', e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-accent-600 cursor-pointer"
            />
            <span className="text-xs font-bold text-warning-950">
              The customer confirms this device is theirs and they have the right to give it to the store.
            </span>
          </label>
        </>
      )}

      <ImeiCameraScanner
        mode="modal"
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(result) => {
          if (isPhone && result.imei) set('imei1', result.imei.replace(/\D/g, '').slice(0, 15));
          else if (!isPhone && (result.serial || result.imei)) set('serialNumber', (result.serial || result.imei || '').toUpperCase());
          setScannerOpen(false);
        }}
        title={isPhone ? 'Scan the phone IMEI' : 'Scan the laptop serial number'}
        subtitle={isPhone ? 'Point the camera at the IMEI on the box or the *#06# screen.' : 'Point the camera at the serial number sticker.'}
      />
    </div>
  );
}
