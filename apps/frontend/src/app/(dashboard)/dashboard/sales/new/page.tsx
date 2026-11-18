'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Barcode,
  Smartphone,
  Package,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  CheckCircle2,
  Printer,
  Mail,
  Banknote,
  Building2,
  ArrowRight,
  Receipt as ReceiptIcon,
  User,
  Phone,
  AlertTriangle,
  Loader2,
  Check,
  Copy,
  QrCode,
  ShieldCheck,
  ExternalLink,
  X as XIcon,
  Pencil,
  RotateCcw,
  ArrowLeftRight,
  ShoppingCart,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SearchInput, TextInput } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAuthStore } from '@/store/useAuthStore';
import { can } from '@/lib/permissions';
import { EmailReceiptModal } from '@/components/sales/EmailReceiptModal';
import { A4SalesReceipt } from '@/components/receipt/A4SalesReceipt';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { api } from '@/lib/api';
import {
  SwapIncomingPanel,
  SwapIncoming,
  SwapCheckState,
  EMPTY_SWAP_INCOMING,
  parseSwapValue,
  swapIncomingProblem,
} from '@/components/sales/SwapIncomingPanel';

interface CartDeviceItem {
  id: string; // phoneRecord.id (UUID) or custom item ID
  brand: string;
  model: string;
  imei: string;
  condition: string;
  storage: string;
  color: string;
  price: number;
  quantity: number;
  isDevice?: boolean;
  /** The device's saved selling price, so an agreed (negotiated) price can be shown against it. */
  listPrice?: number;
  /** Cost price, only present for people allowed to see costs. Used for the below-cost warning. */
  costPrice?: number;
}

/** The device's saved selling price, or null when none has been set. Never falls back to cost. */
function sellingPriceOf(phone: any): number | null {
  const p = Number(phone?.sellingPrice);
  return Number.isFinite(p) && p > 0 ? p : null;
}

function costPriceOf(phone: any): number | undefined {
  const c = Number(phone?.purchasePrice);
  return Number.isFinite(c) && c > 0 ? c : undefined;
}

/** Reads a typed amount such as "450,000" or "₦450000". Returns null when it is not a valid amount. */
function parseNaira(raw: string): number | null {
  const cleaned = raw.replace(/[,\s₦]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function toDeviceItem(phone: any, price: number): CartDeviceItem {
  return {
    id: phone.id,
    brand: phone.brand,
    model: phone.model,
    imei: phone.imei1,
    condition: phone.condition || 'NEW',
    storage: phone.storageCapacity || 'N/A',
    color: phone.color || 'Standard',
    price,
    quantity: 1,
    isDevice: true,
    listPrice: sellingPriceOf(phone) ?? undefined,
    costPrice: costPriceOf(phone),
  };
}

function CheckoutPOSContent() {
  const searchParams = useSearchParams();
  const initialDeviceId = searchParams.get('device');
  const { checkCanPerformAction } = useSubscriptionGuard();
  const storeUser = useAuthStore((st) => st.user);
  const showCosts = can(storeUser, 'seeCosts');
  const canEditDevices = can(storeUser, 'editDevices');

  // Sale or Swap. A swap adds "Device the customer is dropping" and takes its value off the total.
  const [mode, setMode] = useState<'SALE' | 'SWAP'>(searchParams.get('mode') === 'swap' ? 'SWAP' : 'SALE');
  const isSwap = mode === 'SWAP';
  const [swapIncoming, setSwapIncoming] = useState<SwapIncoming>(EMPTY_SWAP_INCOMING);
  const [swapCheck, setSwapCheck] = useState<SwapCheckState>({ status: 'idle' });

  // Editing the selling price of a cart line (agreed / negotiated price)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);

  // "Please add a price" popup for devices that have no selling price saved
  const [pricePromptPhone, setPricePromptPhone] = useState<any | null>(null);
  const [promptValue, setPromptValue] = useState<string>('');
  const [promptError, setPromptError] = useState<string | null>(null);

  // Step Workflow: 1 = ORDER_BUILDER, 2 = PAYMENT_METHOD, 3 = RECEIPT_PREVIEW
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);

  // Customer Info State
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');

  // Cart State (empty by default)
  const [cart, setCart] = useState<CartDeviceItem[]>([]);

  // Device Search & Selection State
  const [deviceSearch, setDeviceSearch] = useState<string>('');
  const [inStockDevices, setInStockDevices] = useState<any[]>([]);
  const [isSearchingDevices, setIsSearchingDevices] = useState<boolean>(false);

  // Custom Item Input State
  const [customItemName, setCustomItemName] = useState<string>('');
  const [customItemPrice, setCustomItemPrice] = useState<string>('');

  // Payment Selection State
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER'>('CARD');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Store Settlement Bank Account & Payment Verification State
  const [storeBankDetails, setStoreBankDetails] = useState<{
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  }>({});
  const [storeSettings, setStoreSettings] = useState<{
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
    receiptFooter?: string;
    storeBranch?: string;
    showQrCode?: boolean;
    showImei?: boolean;
  }>({});
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [seenPaymentConfirmed, setSeenPaymentConfirmed] = useState(false);

  // Finalized Receipt Data
  const [finalReceipt, setFinalReceipt] = useState<any>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [copiedReceiptText, setCopiedReceiptText] = useState(false);

  // Load store profile & business receipt templates
  useEffect(() => {
    Promise.all([
      api.getBusinessProfile().catch(() => null),
      api.getBusinessTemplates().catch(() => null),
    ]).then(([profile, templates]) => {
      const merged = { ...profile, ...templates };
      if (merged) {
        setStoreBankDetails({
          bankName: merged.bankName,
          accountNumber: merged.accountNumber,
          accountName: merged.accountName,
        });
        setStoreSettings({
          name: merged.name || profile?.name,
          address: merged.address || profile?.address,
          phone: merged.phone || profile?.phone,
          email: merged.email || profile?.email,
          logoUrl: merged.logoUrl || profile?.logoUrl,
          receiptFooter: merged.receiptFooter,
          storeBranch: merged.storeBranch || 'Main Branch',
          showQrCode: merged.showQrCode ?? true,
          showImei: merged.showImei ?? true,
        });
      }
    }).catch((err) => console.warn('Could not load store details:', err));
  }, []);

  // Load initial device if ?device=<id> passed in URL
  useEffect(() => {
    if (initialDeviceId) {
      api.getPhoneById(initialDeviceId)
        .then((phone) => {
          if (phone && phone.status === 'IN_STOCK') {
            const price = sellingPriceOf(phone);
            if (price === null) {
              // No selling price saved: ask for one instead of guessing.
              setPromptValue('');
              setPromptError(null);
              setPricePromptPhone(phone);
              return;
            }
            const item = toDeviceItem(phone, price);
            setCart((prev) => (prev.some((p) => p.id === item.id) ? prev : [item, ...prev]));
          }
        })
        .catch((err) => console.error('Failed to load initial device:', err));
    }
  }, [initialDeviceId]);

  // Search available in-stock devices
  useEffect(() => {
    const t = setTimeout(async () => {
      setIsSearchingDevices(true);
      try {
        const devices = await api.getInventory({
          status: 'IN_STOCK',
          search: deviceSearch.trim() || undefined,
        });
        setInStockDevices(devices || []);
      } catch (err) {
        console.error('Failed to load in-stock devices:', err);
        setInStockDevices([]);
      } finally {
        setIsSearchingDevices(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [deviceSearch]);

  // Totals
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  // In a swap, the value of the device coming in is taken off what the customer pays.
  // If it is worth more than what they receive, the store pays them the difference.
  const tradeInCredit = isSwap ? parseSwapValue(swapIncoming.tradeInValue) || 0 : 0;
  const grandTotal = useMemo(() => Math.max(0, subtotal - tradeInCredit), [subtotal, tradeInCredit]);
  const storePays = Math.max(0, tradeInCredit - subtotal);
  const swapProblem = isSwap
    ? swapIncomingProblem(swapIncoming, swapCheck) ||
      (customerName.trim().length < 2 ? "Enter the customer's name." : null) ||
      (customerPhone.trim().length < 5 ? "Enter the customer's phone number." : null) ||
      (cart.length === 0 && tradeInCredit <= 0 ? 'Enter how much you are paying the customer.' : null)
    : null;
  const tradeInLabel = `Trade-in: ${[swapIncoming.brand, swapIncoming.model].filter(Boolean).join(' ') || 'device'}`;

  // Devices in the list that have no selling price saved yet (for the reminder)
  const unpricedInList = useMemo(
    () => inStockDevices.filter((p) => sellingPriceOf(p) === null).length,
    [inStockDevices]
  );

  // Devices in the order still without a price: payment is blocked until they get one
  const unpricedInCart = useMemo(() => cart.filter((i) => i.isDevice && i.price <= 0), [cart]);

  const changeDue = useMemo(() => {
    const tendered = parseFloat(cashTendered) || 0;
    return Math.max(0, tendered - grandTotal);
  }, [cashTendered, grandTotal]);

  // Add In-Stock Device to Cart
  const handleAddDeviceToCart = (phone: any) => {
    const price = sellingPriceOf(phone);
    if (price === null) {
      setPromptValue('');
      setPromptError(null);
      setPricePromptPhone(phone);
      return;
    }
    const item = toDeviceItem(phone, price);
    setCart((prev) => {
      if (prev.some((p) => p.id === item.id)) return prev;
      return [item, ...prev];
    });
  };

  // Confirm the price typed in the "Please add a price" popup and add the device
  const confirmPricePrompt = () => {
    if (!pricePromptPhone) return;
    const n = parseNaira(promptValue);
    if (n === null || n <= 0) {
      setPromptError('Enter a selling price above ₦0.');
      return;
    }
    const item = toDeviceItem(pricePromptPhone, n);
    setCart((prev) => (prev.some((p) => p.id === item.id) ? prev : [item, ...prev]));
    setPricePromptPhone(null);
  };

  const startEditPrice = (item: CartDeviceItem) => {
    setEditingId(item.id);
    setEditValue(item.price > 0 ? String(item.price) : '');
    setEditError(null);
  };

  const saveEditPrice = () => {
    if (!editingId) return;
    const n = parseNaira(editValue);
    const editingItem = cart.find((i) => i.id === editingId);
    if (n === null || (editingItem?.isDevice && n <= 0)) {
      setEditError('Enter a selling price above ₦0.');
      return;
    }
    updateItemPrice(editingId, n);
    setEditingId(null);
  };

  // Add Custom Item / Accessory
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim() || !customItemPrice) return;

    const newAcc: CartDeviceItem = {
      id: `CUSTOM-${Date.now()}`,
      brand: 'Accessory',
      model: customItemName.trim(),
      imei: 'N/A (Accessory)',
      condition: 'New',
      storage: 'Standard',
      color: 'Custom',
      price: parseFloat(customItemPrice) || 0,
      quantity: 1,
      isDevice: false,
    };

    setCart((prev) => [newAcc, ...prev]);
    setCustomItemName('');
    setCustomItemPrice('');
  };

  // Cart Operations
  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartDeviceItem[]
    );
  };

  const updateItemPrice = (id: string, newPrice: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, price: Math.max(0, newPrice) } : item))
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Step 2: Confirm Payment & Finalize Receipt
  const handleConfirmPayment = async () => {
    if (!checkCanPerformAction('create_sale')) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    try {
      if (cart.length === 0 && !isSwap) {
        throw new Error('At least one item or appliance is required to checkout.');
      }

      const payloadItems = cart.map((item) => ({
        phoneRecordId: item.isDevice ? item.id : undefined,
        description: item.isDevice ? `${item.brand} ${item.model}` : item.model,
        price: item.price,
        quantity: item.quantity || 1,
      }));

      if (isSwap) {
        const incomingId = swapIncoming.category === 'PHONE' ? swapIncoming.imei1 : swapIncoming.serialNumber;
        const res = await api.createTradeIn({
          incoming: {
            category: swapIncoming.category,
            imei1: swapIncoming.category === 'PHONE' ? swapIncoming.imei1 : undefined,
            imei2: swapIncoming.category === 'PHONE' ? swapIncoming.imei2 || undefined : undefined,
            serialNumber: swapIncoming.category === 'LAPTOP' ? swapIncoming.serialNumber : undefined,
            brand: swapIncoming.brand.trim(),
            model: swapIncoming.model.trim(),
            storageCapacity: swapIncoming.storageCapacity.trim() || undefined,
            color: swapIncoming.color.trim() || undefined,
            condition: swapIncoming.condition,
            tradeInValue: tradeInCredit,
          },
          items: payloadItems,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || undefined,
          idType: swapIncoming.idType || undefined,
          idNumber: swapIncoming.idType ? swapIncoming.idNumber.trim() || undefined : undefined,
          ownershipConfirmed: swapIncoming.ownershipConfirmed,
          paymentMethod,
        });
        const swapSale = res.sale;
        setFinalReceipt({
          rawId: swapSale?.id,
          id: swapSale?.receiptNumber || swapSale?.invoiceNumber || res.tradeIn?.id,
          invoiceNumber: swapSale?.invoiceNumber,
          receiptNumber: swapSale?.receiptNumber,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim(),
          items: cart,
          subtotal,
          total: subtotal,
          tradeIn: { label: `${tradeInLabel}${incomingId ? ` (${incomingId})` : ''}`, value: tradeInCredit },
          netPaid: grandTotal,
          storePays,
          isBuyOnly: !swapSale,
          tradeInId: res.tradeIn?.id,
          paymentMethod,
          cashTendered: parseFloat(cashTendered) || grandTotal,
          changeDue,
          date: new Date(swapSale?.createdAt || Date.now()).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
        setCheckoutStep(3);
        return;
      }

      const sale = await api.checkoutSale({
        customerName: customerName.trim() || 'Retail Buyer',
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        paymentMethod: paymentMethod,
        paymentStatus: 'PAID',
        type: 'RECEIPT',
        items: payloadItems,
      });

      setFinalReceipt({
        rawId: sale.id,
        id: sale.receiptNumber || sale.invoiceNumber || sale.id,
        invoiceNumber: sale.invoiceNumber,
        receiptNumber: sale.receiptNumber,
        customerName: sale.customer?.name || customerName || 'Retail Buyer',
        customerPhone: sale.customer?.phone || customerPhone || 'N/A',
        customerEmail: sale.customer?.email || customerEmail || (customerPhone.includes('@') ? customerPhone : ''),
        items: cart,
        subtotal,
        total: sale.totalAmount || grandTotal,
        paymentMethod: sale.paymentMethod || paymentMethod,
        cashTendered: parseFloat(cashTendered) || grandTotal,
        changeDue,
        date: new Date(sale.createdAt || Date.now()).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });

      setCheckoutStep(3); // Advance to Receipt View
    } catch (err: any) {
      console.error('POS Checkout failed:', err);
      setErrorMessage(err.message || 'Checkout failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleEmailReceipt = () => {
    if (!finalReceipt) return;
    setIsEmailModalOpen(true);
  };

  const handleCopyReceiptText = () => {
    if (!finalReceipt) return;
    const storeName = storeSettings?.name || 'NoxGuarda Retail Store';
    const lines = [
      `========================================`,
      `*${storeName.toUpperCase()}*`,
      storeSettings?.storeBranch ? `${storeSettings.storeBranch}` : '',
      storeSettings?.address ? `${storeSettings.address}` : '',
      storeSettings?.phone ? `Tel: ${storeSettings.phone}` : '',
      `========================================`,
      `*OFFICIAL SALES RECEIPT*`,
      `Receipt #: ${finalReceipt.receiptNumber || finalReceipt.id}`,
      `Date: ${finalReceipt.date}`,
      `Customer: ${finalReceipt.customerName} (${finalReceipt.customerPhone})`,
      `Payment Method: ${finalReceipt.paymentMethod}`,
      `----------------------------------------`,
      `*PURCHASED ITEMS:*`,
      ...finalReceipt.items.map((it: CartDeviceItem) => 
        `• ${it.brand} ${it.model}${it.isDevice && it.imei ? `\n  IMEI: ${it.imei}` : ''}\n  Qty: ${it.quantity} x ₦${it.price.toLocaleString()} = ₦${(it.price * it.quantity).toLocaleString()}`
      ),
      `----------------------------------------`,
      ...(finalReceipt.tradeIn
        ? [
            `${finalReceipt.tradeIn.label}: -₦${finalReceipt.tradeIn.value.toLocaleString()}`,
            finalReceipt.storePays > 0
              ? `*STORE PAID CUSTOMER: ₦${finalReceipt.storePays.toLocaleString()}*`
              : `*TOTAL PAID: ₦${finalReceipt.netPaid.toLocaleString()}*`,
          ]
        : [`*TOTAL PAID: ₦${finalReceipt.total.toLocaleString()}*`]),
      `========================================`,
      `${storeSettings?.receiptFooter || 'Thank you for your purchase! 30-Day Store Warranty included. Official IMEI verified on NoxGuarda Registry.'}`,
      `Official Registry: https://noxguarda.com`,
    ].filter(Boolean).join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(lines).then(() => {
        setCopiedReceiptText(true);
        setTimeout(() => setCopiedReceiptText(false), 3000);
      });
    }
  };

  const resetForm = () => {
    setCart([]);
    setCheckoutStep(1);
    setFinalReceipt(null);
    setCashTendered('');
    setErrorMessage(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setSwapIncoming(EMPTY_SWAP_INCOMING);
    setSwapCheck({ status: 'idle' });
    setSeenPaymentConfirmed(false);
  };

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8">

      {/* Top Header & Multi-Step Progress Tracker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5 sm:gap-4 border-b border-slate-200/80 pb-3 sm:pb-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {checkoutStep === 1 && (isSwap ? 'Swap / Trade-in' : 'Checkout POS Terminal')}
            {checkoutStep === 2 && 'Select Payment Method'}
            {checkoutStep === 3 && 'Transaction Receipt'}
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 font-medium max-w-xl mt-1 leading-relaxed">
            {checkoutStep === 1 && (isSwap
              ? 'Record the device the customer is dropping, then pick what they are receiving.'
              : 'Select in-stock devices, add customer details, and build your order.')}
            {checkoutStep === 2 && 'Choose customer payment method (Cash, Card, Transfer) and confirm settlement.'}
            {checkoutStep === 3 && 'Review thermal receipt, print or email customer statement, and view record.'}
          </p>
        </div>

        {/* Step indicator: short on phones, full on bigger screens */}
        <p className="sm:hidden text-xs font-extrabold text-accent-600">
          Step {checkoutStep} of 3 · {checkoutStep === 1 ? (isSwap ? 'Devices & customer' : 'Items & customer') : checkoutStep === 2 ? 'Payment' : 'Receipt'}
        </p>
        <div className="hidden sm:flex items-center gap-1.5 text-xs sm:text-xs font-extrabold shrink-0">
          <span className={`transition-colors duration-200 ${checkoutStep === 1 ? 'text-accent-600 font-extrabold font-sans' : 'text-slate-400'}`}>
            1. Items & Customer
          </span>
          <ChevronRight className="w-3 h-3 text-slate-300 animate-in fade-in" />
          <span className={`transition-colors duration-200 ${checkoutStep === 2 ? 'text-accent-600 font-extrabold font-sans' : 'text-slate-400'}`}>
            2. Payment Method
          </span>
          <ChevronRight className="w-3 h-3 text-slate-300 animate-in fade-in" />
          <span className={`transition-colors duration-200 ${checkoutStep === 3 ? 'text-success-600 font-extrabold font-sans' : 'text-slate-400'}`}>
            3. Receipt & Archive
          </span>
        </div>
      </div>

      {/* Sale / Swap switch */}
      {checkoutStep === 1 && (
        <div role="group" aria-label="Checkout type" className="grid grid-cols-2 w-full sm:inline-flex sm:w-auto rounded-2xl border border-slate-200 bg-slate-100 p-1">
          {(['SALE', 'SWAP'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`px-4 sm:px-5 py-2 text-sm font-extrabold rounded-xl flex items-center justify-center gap-2 transition-colors ${
                mode === m ? 'bg-white text-accent-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {m === 'SALE' ? <ShoppingCart className="w-4 h-4" /> : <ArrowLeftRight className="w-4 h-4" />}
              {m === 'SALE' ? 'Sale' : 'Swap'}
            </button>
          ))}
        </div>
      )}

      {/* Error Message Banner */}
      {errorMessage && (
        <div role="alert" className="p-4 bg-danger-50 border border-danger-200 rounded-control flex items-center gap-3 text-danger-800 text-xs font-bold animate-in fade-in duration-200">
          <AlertTriangle className="w-5 h-5 text-danger-600 shrink-0" />
          <div className="flex-1">{errorMessage}</div>
          <Button variant="ghostDanger" size="icon" onClick={() => setErrorMessage(null)} aria-label="Dismiss message" leftIcon={<XIcon className="w-4 h-4" />} />
        </div>
      )}

      {/* STEP 1: ORDER BUILDER & CART */}
      {checkoutStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT 7 COLUMNS: CUSTOMER INFO & IN-STOCK INVENTORY SEARCH */}
          <div className="lg:col-span-7 space-y-6">

            {isSwap && (
              <SwapIncomingPanel
                value={swapIncoming}
                onChange={setSwapIncoming}
                check={swapCheck}
                onCheckChange={setSwapCheck}
              />
            )}

            {/* Customer Info Card Section */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-accent-600" /> Customer Information
                </h2>
                <span className="text-xs text-slate-400 font-bold uppercase">Buyer Profile</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                <TextInput
                  label={isSwap ? 'Customer Name (required)' : 'Customer Name'}
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Emeka Obi"
                  leftIcon={<User className="w-4 h-4" />}
                />
                <TextInput
                  label={isSwap ? 'Phone Number (required)' : 'Phone Number'}
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +234 801 234 5678"
                  leftIcon={<Phone className="w-4 h-4" />}
                />
                <TextInput
                  label="Customer Email (Optional)"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. buyer@gmail.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* In-Stock Device Inventory Selector */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-accent-600" />
                  <span className="hidden sm:inline">Select In-Stock Device from Inventory</span>
                  <span className="inline sm:hidden">Select In-Stock Device</span>
                </h2>
                <span className="text-xs text-slate-400 font-bold uppercase">Available Inventory</span>
              </div>

              {/* Device Search Box */}
              <SearchInput
                value={deviceSearch}
                onChange={(e) => setDeviceSearch(e.target.value)}
                placeholder="Search in-stock devices by IMEI, Model, or Brand..."
                shortcutHint=""
                className="py-2.5"
              />

              {/* Reminder: some devices have no selling price yet */}
              {!isSearchingDevices && unpricedInList > 0 && (
                <div role="status" className="p-3 rounded-xl bg-warning-50 border border-warning-200 text-xs text-warning-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="leading-relaxed">
                    <span className="font-bold">
                      {unpricedInList} {unpricedInList === 1 ? 'device here has' : 'devices here have'} no selling price yet.
                    </span>{' '}
                    You&apos;ll be asked for a price when you add {unpricedInList === 1 ? 'it' : 'one'}.
                    {canEditDevices && (
                      <>
                        {' '}
                        <Link href="/dashboard/inventory" className="font-bold underline hover:text-warning-900">
                          Set prices in Inventory
                        </Link>
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* In-Stock Devices List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {isSearchingDevices ? (
                  <div className="py-8 text-center text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching inventory...
                  </div>
                ) : inStockDevices.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs font-medium">
                    No in-stock devices found matching search criteria.
                  </div>
                ) : (
                  inStockDevices.map((phone) => {
                    const inCart = cart.some((c) => c.id === phone.id);
                    return (
                      <div
                        key={phone.id}
                        onClick={() => !inCart && handleAddDeviceToCart(phone)}
                        className={`p-3 rounded-control border flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer ${
                          inCart
                            ? 'bg-success-50/60 border-success-300 opacity-80 cursor-default'
                            : 'bg-slate-50 border-slate-200/90 hover:border-accent-500 hover:bg-accent-50/30'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold ${inCart ? 'bg-success-100 text-success-700' : 'bg-accent-50 text-accent-600'}`}>
                            <Smartphone className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 truncate">{phone.brand} {phone.model}</p>
                            <p className="text-xs font-mono text-slate-500 truncate">IMEI: {phone.imei1}</p>
                            <p className="text-xs text-slate-400 font-semibold">{phone.condition} • {phone.storageCapacity || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {sellingPriceOf(phone) !== null ? (
                            <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                              ₦{(sellingPriceOf(phone) as number).toLocaleString()}
                            </span>
                          ) : (
                            <Badge variant="pending" size="sm">No price</Badge>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant={inCart ? 'secondary' : 'primary'}
                            disabled={inCart}
                            leftIcon={inCart ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          >
                            {inCart ? 'Added' : 'Add'}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Custom Item / Accessory Entry Section */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-accent-600" /> Custom Accessory / Service Entry
              </h3>

              <form onSubmit={handleAddCustomItem} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-7">
                    <TextInput
                      type="text"
                      required
                      aria-label="Item / Service Name"
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      placeholder="Item / Service Name (e.g. Screen Protector)..."
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <TextInput
                      type="number"
                      step="0.01"
                      required
                      aria-label="Price in naira"
                      value={customItemPrice}
                      onChange={(e) => setCustomItemPrice(e.target.value)}
                      placeholder="Price (₦)..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit" variant="secondary" fullWidth size="md" className="whitespace-nowrap px-2">
                      + Add
                    </Button>
                  </div>
                </div>
              </form>
            </div>

          </div>

          {/* RIGHT 5 COLUMNS: CURRENT ORDER POS CART */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-lg font-extrabold text-slate-900">{isSwap ? 'Customer is receiving' : 'Current Order'}</h2>
                <Badge variant="starter" size="sm">{cart.length} ITEMS</Badge>
              </div>

              {/* Customer Profile Summary */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-subtle">
                    <User className="w-4 h-4 text-accent-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-accent-600 uppercase tracking-wider">Customer Profile</p>
                    <p className="text-xs font-extrabold text-slate-900">{customerName.trim() || 'Retail Buyer'}</p>
                    <p className="text-xs text-slate-500 font-medium">{customerPhone.trim() || 'No Phone Specified'}</p>
                  </div>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium">
                    {isSwap
                      ? 'Pick the device the customer is receiving. Leave this empty if you are only buying their device.'
                      : 'Your cart is empty. Select an in-stock device above.'}
                  </div>
                ) : (
                  cart.map((item) => {
                    const isEditing = editingId === item.id;
                    const isEdited = item.listPrice != null && item.price > 0 && item.price !== item.listPrice;
                    const noPrice = !!item.isDevice && item.price <= 0;
                    const draftPrice = isEditing ? parseNaira(editValue) : item.price;
                    const belowCost =
                      showCosts && item.costPrice != null && draftPrice != null && draftPrice > 0 && draftPrice < item.costPrice;
                    return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border text-xs space-y-3 ${
                        noPrice ? 'bg-warning-50/60 border-warning-300' : 'bg-slate-50/90 border-slate-200/80'
                      }`}
                    >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-accent-600">
                          {item.isDevice ? <Smartphone className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-900 truncate">{item.model}</p>
                          <p className="text-xs font-mono text-slate-500 truncate">
                            {item.isDevice ? `IMEI: ${item.imei}` : item.color}
                          </p>
                          <p className="text-xs text-slate-400 font-semibold">{item.condition} • {item.storage}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!item.isDevice && (
                          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-subtle">
                            <button
                              type="button"
                              aria-label={`Decrease quantity of ${item.model}`}
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-slate-900 font-bold cursor-pointer rounded"
                            >
                              -
                            </button>
                            <span className="px-2 font-extrabold text-slate-900">{item.quantity}</span>
                            <button
                              type="button"
                              aria-label={`Increase quantity of ${item.model}`}
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-slate-900 font-bold cursor-pointer rounded"
                            >
                              +
                            </button>
                          </div>
                        )}

                        <div className="text-right">
                          {noPrice ? (
                            <p className="font-bold text-warning-800">No price</p>
                          ) : (
                            <p className="font-extrabold text-slate-900 text-sm whitespace-nowrap">₦{item.price.toLocaleString()}</p>
                          )}
                          {isEdited && (
                            <p className="text-[11px] text-slate-400 line-through whitespace-nowrap">
                              ₦{(item.listPrice as number).toLocaleString()}
                            </p>
                          )}
                        </div>

                        {!isEditing && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditPrice(item)}
                            aria-label={`Edit selling price of ${item.model}`}
                            title="Edit selling price"
                            leftIcon={<Pencil className="w-3.5 h-3.5" />}
                          />
                        )}

                        <Button
                          variant="ghostDanger"
                          size="icon"
                          onClick={() => {
                            if (isEditing) setEditingId(null);
                            removeFromCart(item.id);
                          }}
                          aria-label={`Remove ${item.model} from order`}
                          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        />
                      </div>
                    </div>

                    {/* Price editor: type the agreed price */}
                    {isEditing && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <TextInput
                              type="text"
                              inputMode="decimal"
                              autoFocus
                              value={editValue}
                              onChange={(e) => {
                                setEditValue(e.target.value);
                                setEditError(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  saveEditPrice();
                                } else if (e.key === 'Escape') {
                                  setEditingId(null);
                                }
                              }}
                              placeholder="Agreed price (₦)"
                              aria-label={`Agreed selling price of ${item.model} in naira`}
                            />
                          </div>
                          <Button
                            variant="primary"
                            size="icon"
                            onClick={saveEditPrice}
                            aria-label="Save price"
                            leftIcon={<Check className="w-4 h-4" />}
                          />
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={() => setEditingId(null)}
                            aria-label="Cancel price change"
                            leftIcon={<XIcon className="w-4 h-4" />}
                          />
                        </div>
                        {editError && <p className="text-danger-600 font-semibold">{editError}</p>}
                        {item.listPrice != null && (
                          <p className="text-slate-500">Listed price: ₦{item.listPrice.toLocaleString()}</p>
                        )}
                      </div>
                    )}

                    {/* After an edit: tag, reset, and below-cost warning */}
                    {!isEditing && isEdited && (
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="pending" size="sm">Edited price</Badge>
                        <button
                          type="button"
                          onClick={() => updateItemPrice(item.id, item.listPrice as number)}
                          className="inline-flex items-center gap-1 font-bold text-accent-600 hover:text-accent-700"
                        >
                          <RotateCcw className="w-3 h-3" aria-hidden="true" /> Reset to ₦{(item.listPrice as number).toLocaleString()}
                        </button>
                      </div>
                    )}
                    {belowCost && (
                      <p className="flex items-center gap-1.5 text-warning-800 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        This price is below the cost price (₦{(item.costPrice as number).toLocaleString()}).
                      </p>
                    )}
                    </div>
                    );
                  })
                )}
              </div>

              {/* Payment Summary */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs font-medium text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">₦{subtotal.toLocaleString()}</span>
                </div>

                {isSwap && (
                  <div className="flex justify-between gap-3">
                    <span>{tradeInLabel}</span>
                    <span className="font-bold text-slate-900 shrink-0">−₦{tradeInCredit.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-3 border-t border-slate-200 text-slate-900 font-extrabold">
                  <span className="text-sm">{storePays > 0 ? 'Store pays customer' : isSwap ? 'Customer pays' : 'Grand Total'}</span>
                  <span className={`text-2xl font-extrabold ${storePays > 0 ? 'text-warning-700' : 'text-accent-600'}`}>
                    ₦{(storePays > 0 ? storePays : grandTotal).toLocaleString()}
                  </span>
                </div>
              </div>

              {unpricedInCart.length > 0 && (
                <p role="alert" className="flex items-start gap-1.5 text-xs font-semibold text-warning-800">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                  Please add a price for {unpricedInCart.map((i) => i.model).join(', ')} to continue (tap the pencil).
                </p>
              )}
              {isSwap && swapProblem && (
                <p role="status" className="flex items-start gap-1.5 text-xs font-semibold text-slate-600">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-warning-600" aria-hidden="true" />
                  {swapProblem}
                </p>
              )}
              {editingId && unpricedInCart.length === 0 && (
                <p className="text-xs font-semibold text-slate-500">Save or cancel the price you&apos;re editing to continue.</p>
              )}

              {/* Proceed to Payment Method Button */}
              <Button
                variant="primary"
                size="lg"
                disabled={(isSwap ? !!swapProblem : cart.length === 0) || unpricedInCart.length > 0 || !!editingId}
                onClick={() => {
                  setSeenPaymentConfirmed(false);
                  setCheckoutStep(2);
                }}
                fullWidth
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Proceed to Payment Method
              </Button>
            </div>
          </div>

        </div>
      )}

      {/* STEP 2: PAYMENT METHOD SELECTION */}
      {checkoutStep === 2 && (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">

            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm sm:text-lg font-extrabold text-slate-900">Select Payment Method</h2>
                <p className="text-xs text-slate-500 font-medium">Customer: <strong>{customerName.trim() || 'Retail Buyer'}</strong> ({customerPhone || 'No Phone'})</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-extrabold uppercase">{storePays > 0 ? 'Store pays customer' : 'Total Amount Due'}</p>
                <p className={`text-lg sm:text-2xl font-extrabold ${storePays > 0 ? 'text-warning-700' : 'text-accent-600'}`}>
                  ₦{(storePays > 0 ? storePays : grandTotal).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Payment Options Grid */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                aria-pressed={paymentMethod === 'CARD'}
                onClick={() => setPaymentMethod('CARD')}
                className={`p-4 rounded-card border text-center transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer ${
                  paymentMethod === 'CARD'
                    ? 'border-accent-600 bg-accent-50 text-accent-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-6 h-6" />
                <span className="text-xs font-extrabold">Card Payment</span>
              </button>

              <button
                type="button"
                aria-pressed={paymentMethod === 'CASH'}
                onClick={() => setPaymentMethod('CASH')}
                className={`p-4 rounded-card border text-center transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer ${
                  paymentMethod === 'CASH'
                    ? 'border-accent-600 bg-accent-50 text-accent-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-6 h-6" />
                <span className="text-xs font-extrabold">Cash Payment</span>
              </button>

              <button
                type="button"
                aria-pressed={paymentMethod === 'BANK_TRANSFER'}
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`p-4 rounded-card border text-center transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-accent-600 bg-accent-50 text-accent-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-6 h-6" />
                <span className="text-xs font-extrabold">Bank Transfer</span>
              </button>
            </div>

            {isSwap && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between"><span>Customer is receiving</span><span className="font-bold">₦{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between gap-3"><span>{tradeInLabel}</span><span className="font-bold shrink-0">−₦{tradeInCredit.toLocaleString()}</span></div>
                {storePays > 0 && (
                  <p className="pt-1 font-bold text-warning-800">Choose how you are paying the customer ₦{storePays.toLocaleString()}.</p>
                )}
              </div>
            )}

            {/* Cash Tendered Calculator (If Cash Selected) */}
            {paymentMethod === 'CASH' && grandTotal > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <TextInput
                  label="Cash Tendered (₦)"
                  type="number"
                  step="0.01"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  placeholder={`Enter amount (e.g. ${Math.ceil(grandTotal)})`}
                  labelAction={
                    <Button type="button" variant="link" onClick={() => setCashTendered(grandTotal.toString())}>
                      Exact: ₦{grandTotal.toLocaleString()}
                    </Button>
                  }
                />

                <div className="flex justify-between items-center border-t border-slate-200 pt-2 font-bold text-slate-900">
                  <span>Change Due to Customer</span>
                  <span className="text-success-700 text-sm font-extrabold">₦{changeDue.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Store Bank Settlement Details (If Bank Transfer or Card Selected) */}
            {(paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'CARD') && grandTotal > 0 && (
              <div className="p-4 rounded-card bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-800 text-white space-y-3 text-xs shadow-md">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-accent-400" />
                    <span className="font-extrabold text-white">Store Settlement Bank Account</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {paymentMethod === 'BANK_TRANSFER' ? 'Direct Transfer' : 'POS Settlement'}
                  </span>
                </div>

                {storeBankDetails.accountNumber ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase block">Bank Name</span>
                        <span className="font-extrabold text-white text-sm">{storeBankDetails.bankName || 'Store Bank'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 font-bold uppercase block">Transfer Amount</span>
                        <span className="font-mono font-black text-success-400 text-base">₦{grandTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white/10 rounded-xl flex items-center justify-between border border-white/10">
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase block">Account Number</span>
                        <span className="font-mono font-black text-white text-lg tracking-wider">
                          {storeBankDetails.accountNumber}
                        </span>
                        {storeBankDetails.accountName && (
                          <span className="text-xs text-slate-300 font-medium block mt-0.5">
                            {storeBankDetails.accountName}
                          </span>
                        )}
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (storeBankDetails.accountNumber) {
                            navigator.clipboard.writeText(storeBankDetails.accountNumber);
                            setCopiedAccount(true);
                            setTimeout(() => setCopiedAccount(false), 2000);
                          }
                        }}
                        leftIcon={copiedAccount ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      >
                        {copiedAccount ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-xs flex items-center justify-between">
                    <span>No store bank account configured in Settings yet.</span>
                    <Link
                      href="/dashboard/settings"
                      target="_blank"
                      className="text-accent-400 hover:underline font-bold"
                    >
                      Set Up Account →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Mandatory "I Have Confirmed / Seen Payment" Checkbox */}
            <div className="p-4 rounded-2xl bg-warning-50/80 border border-warning-200/90 space-y-2">
              <label htmlFor="confirm-payment-seen" className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  id="confirm-payment-seen"
                  type="checkbox"
                  checked={seenPaymentConfirmed}
                  onChange={(e) => setSeenPaymentConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-accent-600 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-extrabold text-warning-950 block">
                    {storePays > 0 ? 'Confirm You Paid the Customer' : 'Confirm Receipt of Payment'}
                  </span>
                  <span className="text-warning-900 font-medium leading-relaxed">
                    {storePays > 0 ? (
                      <>I have paid the customer <strong>₦{storePays.toLocaleString()}</strong> for their device.</>
                    ) : grandTotal === 0 ? (
                      <>The device coming in covers the full price. Nothing more is owed.</>
                    ) : (
                      <>I have verified and confirmed receipt of <strong>₦{grandTotal.toLocaleString()}</strong> in store account / cash in hand before issuing this receipt.</>
                    )}
                  </span>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setCheckoutStep(1)}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Back to Cart
              </Button>

              <Button
                variant="primary"
                size="md"
                disabled={!seenPaymentConfirmed || isProcessing || (paymentMethod === 'CASH' && (Number(cashTendered) || 0) < grandTotal)}
                isLoading={isProcessing}
                onClick={handleConfirmPayment}
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                {isSwap ? 'Complete Swap' : 'Confirm Payment & Process Sale'}
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* STEP 3: HIGH-END 80MM THERMAL RECEIPT & AUDIT ARCHIVE SAVED */}
      {checkoutStep === 3 && finalReceipt && (
        <div className="max-w-lg mx-auto space-y-6 animate-in zoom-in-95 duration-200">

          {/* Success Banner Card */}
          <div className="p-4 rounded-2xl bg-success-50 border border-success-200 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success-600 text-white rounded-xl flex items-center justify-center shadow-xs shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-success-950">
                  {finalReceipt.isBuyOnly ? 'Device Bought & Added to Stock' : finalReceipt.tradeIn ? 'Swap Completed!' : 'Sale Processed & Archived!'}
                </h2>
                <p className="text-xs text-success-800 font-medium">
                  {finalReceipt.tradeIn
                    ? 'The device the customer dropped is now in your inventory as a trade-in.'
                    : 'Transaction logged to verified store ledger & anti-theft database.'}
                </p>
              </div>
            </div>
            <Badge variant="verified" size="sm" className="hidden sm:inline-flex">
              Live Verified
            </Badge>
          </div>

          {finalReceipt.isBuyOnly && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2 text-xs">
              <p className="font-extrabold text-slate-900 text-sm">{finalReceipt.tradeIn?.label}</p>
              <p className="text-slate-600">Bought from <strong>{finalReceipt.customerName}</strong> ({finalReceipt.customerPhone})</p>
              <p className="text-slate-600">Store paid customer: <strong>₦{(finalReceipt.storePays || 0).toLocaleString()}</strong></p>
              <Link href="/dashboard/swaps" className="inline-block pt-1 font-bold text-accent-600 hover:underline">
                View in Swaps →
              </Link>
            </div>
          )}

          {/* A4 Sales Receipt Document Display */}
          {!finalReceipt.isBuyOnly && (
          <div className="space-y-4">
            <A4SalesReceipt
              id="printable-a4-receipt"
              data={{
                receiptNumber: finalReceipt.receiptNumber || finalReceipt.id,
                invoiceNumber: finalReceipt.invoiceNumber,
                createdAt: finalReceipt.date || new Date().toISOString(),
                paymentStatus: 'PAID',
                paymentMethod: finalReceipt.paymentMethod,
                totalAmount: finalReceipt.total,
                tradeIn: finalReceipt.tradeIn || null,
                customerName: finalReceipt.customerName,
                customerPhone: finalReceipt.customerPhone,
                customerEmail: finalReceipt.customerEmail,
                customerAddress: 'Retail Customer Store Visit',
                business: {
                  name: storeSettings?.name || storeBankDetails?.accountName,
                  address: storeSettings?.address,
                  phone: storeSettings?.phone,
                  email: storeSettings?.email,
                  logoUrl: storeSettings?.logoUrl,
                  receiptFooter: storeSettings?.receiptFooter,
                },
                items: finalReceipt.items.map((it: CartDeviceItem) => ({
                  description: `${it.brand ? `${it.brand} ` : ''}${it.model}`,
                  phoneRecord: it.isDevice ? {
                    brand: it.brand,
                    model: it.model,
                    imei1: it.imei,
                    storageCapacity: it.storage,
                    condition: it.condition,
                  } : null,
                  imei: it.imei,
                  quantity: it.quantity,
                  unitPrice: it.price,
                  totalPrice: it.price * it.quantity,
                })),
              }}
            />
          </div>
          )}

          {/* Action Toolbar */}
          <div className="space-y-2.5 pt-1">
            {!finalReceipt.isBuyOnly && (<>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                variant="primary"
                size="md"
                onClick={handlePrintReceipt}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Sales Receipt
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={handleEmailReceipt}
                leftIcon={<Mail className="w-4 h-4" />}
              >
                Email to Customer
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={handleCopyReceiptText}
                leftIcon={copiedReceiptText ? <Check className="w-4 h-4 text-success-600" /> : <Copy className="w-4 h-4" />}
              >
                {copiedReceiptText ? 'Copied to Clipboard!' : 'Copy for WhatsApp / SMS'}
              </Button>

              <Link href="/dashboard/sales/receipts" className="w-full">
                <Button variant="secondary" fullWidth size="md" leftIcon={<ReceiptIcon className="w-4 h-4 text-slate-600" />}>
                  Receipts Archive
                </Button>
              </Link>
            </div>
            </>)}

            <Button
              variant="secondary"
              fullWidth
              size="lg"
              onClick={resetForm}
              className="mt-2"
            >
              + Start Next Walk-in Sale
            </Button>
          </div>

          {/* Global Print Styling for Clean A4 Page Output */}
          <style jsx global>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 10mm 12mm;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                height: auto !important;
                overflow: visible !important;
              }
              body * {
                visibility: hidden !important;
              }
              #printable-a4-receipt, #printable-a4-receipt * {
                visibility: visible !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              #printable-a4-receipt {
                display: block !important;
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                border: none !important;
                background: #ffffff !important;
                z-index: 999999 !important;
              }
            }
          `}</style>

        </div>
      )}

      {/* Email Receipt Dialog Modal */}
      <EmailReceiptModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        receipt={finalReceipt ? {
          ...finalReceipt,
          storeName: storeSettings?.name || storeBankDetails?.accountName,
          business: {
            name: storeSettings?.name,
            address: storeSettings?.address,
            phone: storeSettings?.phone,
            email: storeSettings?.email,
            logoUrl: storeSettings?.logoUrl,
            receiptFooter: storeSettings?.receiptFooter,
          },
        } : null}
      />

      {/* "Please add a price" popup for a device with no selling price saved */}
      <Modal
        isOpen={!!pricePromptPhone}
        onClose={() => setPricePromptPhone(null)}
        size="sm"
        icon={<AlertTriangle className="w-5 h-5 text-warning-600" aria-hidden="true" />}
        title="Please add a price"
        description={
          pricePromptPhone
            ? `${pricePromptPhone.brand} ${pricePromptPhone.model} has no selling price saved. Enter the price for this sale.`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setPricePromptPhone(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmPricePrompt} leftIcon={<Plus className="w-4 h-4" />}>
              Add to order
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            confirmPricePrompt();
          }}
          className="space-y-2"
        >
          <TextInput
            type="text"
            inputMode="decimal"
            data-autofocus
            value={promptValue}
            onChange={(e) => {
              setPromptValue(e.target.value);
              setPromptError(null);
            }}
            placeholder="Selling price (₦)"
            aria-label="Selling price in naira"
          />
          {promptError && <p className="text-xs font-semibold text-danger-600">{promptError}</p>}
          {(() => {
            const cost = showCosts ? costPriceOf(pricePromptPhone) : undefined;
            const typed = parseNaira(promptValue);
            return cost != null && typed != null && typed > 0 && typed < cost ? (
              <p className="text-xs font-semibold text-warning-800">
                This price is below the cost price (₦{cost.toLocaleString()}).
              </p>
            ) : null;
          })()}
          {canEditDevices && (
            <p className="text-xs text-slate-500">
              This price is for this sale only. To save a price on the device, set it in{' '}
              <Link href="/dashboard/inventory" className="font-bold text-accent-600 hover:underline">
                Inventory
              </Link>
              .
            </p>
          )}
        </form>
      </Modal>

    </div>
  );
}

export default function CheckoutPOSPage() {
  return (
    <Suspense fallback={
      <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin" />
        Loading POS Checkout...
      </div>
    }>
      <CheckoutPOSContent />
    </Suspense>
  );
}
