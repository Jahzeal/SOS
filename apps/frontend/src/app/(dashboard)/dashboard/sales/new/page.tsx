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
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

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
  isDevice: boolean;
}

function CheckoutPOSContent() {
  const searchParams = useSearchParams();
  const initialDeviceId = searchParams.get('device');

  // Step Workflow: 1 = ORDER_BUILDER, 2 = PAYMENT_METHOD, 3 = RECEIPT_PREVIEW
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);

  // Customer Info State
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

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

  // Finalized Receipt Data
  const [finalReceipt, setFinalReceipt] = useState<any>(null);

  // Load initial device if ?device=<id> passed in URL
  useEffect(() => {
    if (initialDeviceId) {
      api.getPhoneById(initialDeviceId)
        .then((phone) => {
          if (phone && phone.status === 'IN_STOCK') {
            const item: CartDeviceItem = {
              id: phone.id,
              brand: phone.brand,
              model: phone.model,
              imei: phone.imei1,
              condition: phone.condition || 'NEW',
              storage: phone.storageCapacity || 'N/A',
              color: phone.color || 'Standard',
              price: phone.sellingPrice ?? phone.purchasePrice ?? 0,
              quantity: 1,
              isDevice: true,
            };
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

  const tax = useMemo(() => subtotal * 0.08, [subtotal]);
  const grandTotal = useMemo(() => subtotal + tax, [subtotal, tax]);

  const changeDue = useMemo(() => {
    const tendered = parseFloat(cashTendered) || 0;
    return Math.max(0, tendered - grandTotal);
  }, [cashTendered, grandTotal]);

  // Add In-Stock Device to Cart
  const handleAddDeviceToCart = (phone: any) => {
    const item: CartDeviceItem = {
      id: phone.id,
      brand: phone.brand,
      model: phone.model,
      imei: phone.imei1,
      condition: phone.condition || 'NEW',
      storage: phone.storageCapacity || 'N/A',
      color: phone.color || 'Standard',
      price: phone.sellingPrice ?? phone.purchasePrice ?? 0,
      quantity: 1,
      isDevice: true,
    };

    setCart((prev) => {
      if (prev.some((p) => p.id === item.id)) return prev;
      return [item, ...prev];
    });
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
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      if (cart.length === 0) {
        throw new Error('At least one item or appliance is required to checkout.');
      }

      const payloadItems = cart.map((item) => ({
        phoneRecordId: item.isDevice ? item.id : undefined,
        description: item.isDevice ? `${item.brand} ${item.model}` : item.model,
        price: item.price,
        quantity: item.quantity || 1,
      }));

      const sale = await api.checkoutSale({
        customerName: customerName.trim() || 'Retail Buyer',
        customerPhone: customerPhone.trim() || undefined,
        paymentMethod: paymentMethod,
        items: payloadItems,
      });

      setFinalReceipt({
        id: sale.receiptNumber || sale.invoiceNumber || sale.id,
        invoiceNumber: sale.invoiceNumber,
        receiptNumber: sale.receiptNumber,
        customerName: sale.customer?.name || customerName || 'Retail Buyer',
        customerPhone: sale.customer?.phone || customerPhone || 'N/A',
        items: cart,
        subtotal,
        tax,
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
    const receiptNum = finalReceipt?.receiptNumber || finalReceipt?.id || 'Receipt';
    const subject = encodeURIComponent(`Sales Receipt #${receiptNum}`);
    const body = encodeURIComponent(
      `Hello ${finalReceipt?.customerName || 'Valued Customer'},\n\nThank you for your purchase! Your sales receipt #${receiptNum} for ₦${finalReceipt?.total?.toLocaleString() || '0'} is confirmed.\n\nThank you for shopping with us!`
    );
    window.location.href = `mailto:${finalReceipt?.customerPhone?.includes('@') ? finalReceipt.customerPhone : ''}?subject=${subject}&body=${body}`;
  };

  const resetForm = () => {
    setCart([]);
    setCheckoutStep(1);
    setFinalReceipt(null);
    setCashTendered('');
    setErrorMessage(null);
    setCustomerName('');
    setCustomerPhone('');
  };

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8">

      {/* Top Header & Multi-Step Progress Tracker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {checkoutStep === 1 && 'Checkout POS Terminal'}
            {checkoutStep === 2 && 'Select Payment Method'}
            {checkoutStep === 3 && 'Transaction Receipt'}
          </h1>
          <p className="hidden sm:block text-xs sm:text-sm text-slate-500 font-medium max-w-xl mt-1 leading-relaxed">
            {checkoutStep === 1 && 'Select in-stock devices, add customer details, and build your order.'}
            {checkoutStep === 2 && 'Choose customer payment method (Cash, Card, Transfer) and confirm settlement.'}
            {checkoutStep === 3 && 'Review thermal receipt, print or email customer statement, and view record.'}
          </p>
        </div>

        {/* Step Indicator Badges */}
        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-extrabold shrink-0">
          <span className={`transition-colors duration-200 ${checkoutStep === 1 ? 'text-blue-600 font-extrabold font-sans' : 'text-slate-400'}`}>
            1. Items & Customer
          </span>
          <ChevronRight className="w-3 h-3 text-slate-300 animate-in fade-in" />
          <span className={`transition-colors duration-200 ${checkoutStep === 2 ? 'text-blue-600 font-extrabold font-sans' : 'text-slate-400'}`}>
            2. Payment Method
          </span>
          <ChevronRight className="w-3 h-3 text-slate-300 animate-in fade-in" />
          <span className={`transition-colors duration-200 ${checkoutStep === 3 ? 'text-emerald-600 font-extrabold font-sans' : 'text-slate-400'}`}>
            3. Receipt & Archive
          </span>
        </div>
      </div>

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-bold animate-in fade-in duration-200">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">{errorMessage}</div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800 font-bold text-sm">✕</button>
        </div>
      )}

      {/* STEP 1: ORDER BUILDER & CART */}
      {checkoutStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT 7 COLUMNS: CUSTOMER INFO & IN-STOCK INVENTORY SEARCH */}
          <div className="lg:col-span-7 space-y-6">

            {/* Customer Info Card Section */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" /> Customer Information
                </h2>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Buyer Profile</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Customer Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Johnathan Doe or Retail Buyer..."
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Phone Number / Email</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. +1 (555) 234-5678"
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* In-Stock Device Inventory Selector */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span className="hidden sm:inline">Select In-Stock Device from Inventory</span>
                  <span className="inline sm:hidden">Select In-Stock Device</span>
                </h2>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Available Inventory</span>
              </div>

              {/* Device Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={deviceSearch}
                  onChange={(e) => setDeviceSearch(e.target.value)}
                  placeholder="Search in-stock devices by IMEI, Model, or Brand..."
                  className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

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
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition cursor-pointer ${
                          inCart
                            ? 'bg-emerald-50/60 border-emerald-300 opacity-80 cursor-default'
                            : 'bg-slate-50 border-slate-200/90 hover:border-blue-500 hover:bg-blue-50/30'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold ${inCart ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-600'}`}>
                            <Smartphone className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 truncate">{phone.brand} {phone.model}</p>
                            <p className="text-[10px] font-mono text-slate-500 truncate">IMEI: {phone.imei1}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">{phone.condition} • {phone.storageCapacity || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                            ₦{(phone.sellingPrice ?? phone.purchasePrice ?? 0).toLocaleString()}
                          </span>
                          <button
                            type="button"
                            disabled={inCart}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              inCart
                                ? 'bg-emerald-600 text-white'
                                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm'
                            }`}
                          >
                            {inCart ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Added
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" /> Add
                              </>
                            )}
                          </button>
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
                <Package className="w-4 h-4 text-indigo-600" /> Custom Accessory / Service Entry
              </h3>

              <form onSubmit={handleAddCustomItem} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-7">
                    <input
                      type="text"
                      required
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      placeholder="Item / Service Name (e.g. Screen Protector)..."
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={customItemPrice}
                      onChange={(e) => setCustomItemPrice(e.target.value)}
                      placeholder="Price (₦)..."
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit" variant="secondary" fullWidth size="sm" className="h-full text-xs font-bold">
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
                <h2 className="text-lg font-extrabold text-slate-900">Current Order</h2>
                <Badge variant="starter" size="sm">{cart.length} ITEMS</Badge>
              </div>

              {/* Customer Profile Summary */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-subtle">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Customer Profile</p>
                    <p className="text-xs font-extrabold text-slate-900">{customerName.trim() || 'Retail Buyer'}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{customerPhone.trim() || 'No Phone Specified'}</p>
                  </div>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium">
                    Your cart is empty. Select an in-stock device above.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-blue-600">
                          {item.isDevice ? <Smartphone className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-900 truncate">{item.model}</p>
                          <p className="text-[10px] font-mono text-slate-500 truncate">
                            {item.isDevice ? `IMEI: ${item.imei}` : item.color}
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold">{item.condition} • {item.storage}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!item.isDevice && (
                          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-subtle">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900 font-bold"
                            >
                              -
                            </button>
                            <span className="px-2 font-extrabold text-slate-900">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900 font-bold"
                            >
                              +
                            </button>
                          </div>
                        )}

                        <div className="flex items-center gap-0.5">
                          <span className="text-slate-400 font-bold">₦</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price}
                            onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                            className="w-16 font-extrabold text-slate-900 text-right bg-white border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:border-blue-600"
                          />
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Payment Summary */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs font-medium text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8%)</span>
                  <span className="font-bold text-slate-900">₦{tax.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-baseline pt-3 border-t border-slate-200 text-slate-900 font-extrabold">
                  <span className="text-sm">Grand Total</span>
                  <span className="text-2xl text-blue-600 font-extrabold">₦{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Proceed to Payment Method Button */}
              <Button
                variant="primary"
                size="lg"
                disabled={cart.length === 0}
                onClick={() => setCheckoutStep(2)}
                className="w-full bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 font-bold h-14"
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
                <p className="text-[10px] text-slate-400 font-extrabold uppercase">Total Amount Due</p>
                <p className="text-lg sm:text-2xl font-extrabold text-blue-600">₦{grandTotal.toLocaleString()}</p>
              </div>
            </div>

            {/* Payment Options Grid */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-4 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 ${
                  paymentMethod === 'CARD'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-600 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-6 h-6" />
                <span className="text-xs font-extrabold">Card Payment</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-4 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 ${
                  paymentMethod === 'CASH'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-600 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-6 h-6" />
                <span className="text-xs font-extrabold">Cash Payment</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`p-4 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-600 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-6 h-6" />
                <span className="text-xs font-extrabold">Bank Transfer</span>
              </button>
            </div>

            {/* Cash Tendered Calculator (If Cash Selected) */}
            {paymentMethod === 'CASH' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-700">Cash Tendered (₦)</label>
                  <button
                    type="button"
                    onClick={() => setCashTendered(grandTotal.toString())}
                    className="text-[10px] text-blue-600 font-bold hover:underline"
                  >
                    Exact: ₦{grandTotal.toLocaleString()}
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  placeholder={`Enter amount (e.g. ${Math.ceil(grandTotal)})`}
                  className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />

                <div className="flex justify-between items-center border-t border-slate-200 pt-2 font-bold text-slate-900">
                  <span>Change Due to Customer</span>
                  <span className="text-emerald-700 text-sm font-extrabold">₦{changeDue.toLocaleString()}</span>
                </div>
              </div>
            )}

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
                isLoading={isProcessing}
                onClick={handleConfirmPayment}
                className="bg-emerald-600 hover:bg-emerald-500 font-bold px-6 shadow-md shadow-emerald-600/20"
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirm Payment & Process Sale
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* STEP 3: THERMAL RECEIPT PREVIEW & ARCHIVE SAVED */}
      {checkoutStep === 3 && finalReceipt && (
        <div className="max-w-md mx-auto space-y-6 animate-in zoom-in duration-200">

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xl text-center space-y-4">

            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-subtle">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Transaction Complete!</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Receipt saved to <strong className="text-slate-800">Receipts Archive</strong>
              </p>
            </div>

            {/* Realistic Thermal Receipt Display */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-dashed border-slate-300 font-mono text-xs text-slate-800 space-y-3 text-left">
              <div className="text-center space-y-0.5 border-b border-slate-200 pb-3">
                <p className="font-extrabold text-sm text-slate-900">VERIFYFLOW POS RECEIPT</p>
                <p className="text-[10px] text-slate-500 font-sans">Official Sales Record</p>
              </div>

              <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                <span>Receipt #: <strong>{finalReceipt.receiptNumber || finalReceipt.id}</strong></span>
                <span>{finalReceipt.date}</span>
              </div>
              {finalReceipt.invoiceNumber && (
                <p className="text-[10px] text-slate-500">Invoice #: <strong>{finalReceipt.invoiceNumber}</strong></p>
              )}
              <p className="text-[10px] text-slate-500">Customer: <strong>{finalReceipt.customerName}</strong> ({finalReceipt.customerPhone})</p>

              <div className="border-y border-slate-200 py-2 space-y-1.5">
                {finalReceipt.items.map((item: CartDeviceItem) => (
                  <div key={item.id} className="flex justify-between text-[11px]">
                    <div>
                      <p className="font-bold text-slate-900">{item.model}</p>
                      <p className="text-[9px] text-slate-500">{item.isDevice ? `IMEI: ${item.imei}` : item.color}</p>
                    </div>
                    <span className="font-bold text-slate-900">₦{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>₦{finalReceipt.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax (8%)</span>
                  <span>₦{finalReceipt.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm border-t border-slate-200 pt-2 text-slate-900">
                  <span>TOTAL PAID</span>
                  <span className="text-blue-600">₦{finalReceipt.total.toLocaleString()}</span>
                </div>
                {finalReceipt.paymentMethod === 'CASH' && (
                  <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                    <span>Change Due:</span>
                    <span className="font-bold text-emerald-700">₦{finalReceipt.changeDue.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Receipt Actions */}
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="primary" size="md" onClick={handlePrintReceipt} leftIcon={<Printer className="w-4 h-4" />}>
                  Print Receipt
                </Button>
                <Button variant="secondary" size="md" onClick={handleEmailReceipt} leftIcon={<Mail className="w-4 h-4" />}>
                  Email Receipt
                </Button>
              </div>

              <Link href="/dashboard/sales/receipts" className="block w-full">
                <Button variant="secondary" fullWidth size="md" leftIcon={<ReceiptIcon className="w-4 h-4" />}>
                  View in Receipts Archive
                </Button>
              </Link>

              <Button
                variant="primary"
                fullWidth
                size="md"
                onClick={resetForm}
                className="bg-blue-600 hover:bg-blue-500 font-bold shadow-md mt-2"
              >
                + Start New Sale
              </Button>
            </div>

          </div>
        </div>
      )}

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
