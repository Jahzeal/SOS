'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Barcode,
  Smartphone,
  Headphones,
  Package,
  Plus,
  Minus,
  Trash2,
  UserPlus,
  ChevronRight,
  ChevronLeft,
  Tag,
  CreditCard,
  FileText,
  CheckCircle2,
  X,
  Printer,
  Mail,
  DollarSign,
  Banknote,
  Building2,
  ArrowRight,
  Receipt as ReceiptIcon,
  User,
  Phone,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface CartDeviceItem {
  id: string;
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

const presetModels = [
  { brand: 'Apple', model: 'iPhone 15 Pro', defaultPrice: 1099.0, storage: '256GB', color: 'Natural Titanium' },
  { brand: 'Apple', model: 'iPhone 15 Pro Max', defaultPrice: 1199.0, storage: '256GB', color: 'Space Black' },
  { brand: 'Apple', model: 'iPhone 14', defaultPrice: 649.0, storage: '128GB', color: 'Blue' },
  { brand: 'Samsung', model: 'Galaxy S24 Ultra', defaultPrice: 1299.0, storage: '512GB', color: 'Titanium Gray' },
  { brand: 'Samsung', model: 'Galaxy Z Fold 5', defaultPrice: 1399.0, storage: '512GB', color: 'Phantom Black' },
  { brand: 'Google', model: 'Pixel 8 Pro', defaultPrice: 999.0, storage: '128GB', color: 'Obsidian' },
];

const accessoryPresets = [
  { id: 'ACC-1', name: 'WH-1000XM5 Headphones', brand: 'Sony', price: 348.0, specs: 'Midnight Blue' },
  { id: 'ACC-2', name: 'AirPods Pro (2nd Gen)', brand: 'Apple', price: 249.0, specs: 'USB-C Case' },
  { id: 'ACC-3', name: 'MagSafe Silicone Case', brand: 'Apple', price: 49.0, specs: 'Navy' },
  { id: 'ACC-4', name: '20W USB-C Power Adapter', brand: 'Apple', price: 19.0, specs: 'Fast Charger' },
];

export default function CheckoutPOSPage() {
  // Step Workflow: 1 = ORDER_BUILDER, 2 = PAYMENT_METHOD, 3 = RECEIPT_PREVIEW
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);

  // Customer Info State
  const [customerName, setCustomerName] = useState<string>('Johnathan Doe');
  const [customerPhone, setCustomerPhone] = useState<string>('+1 (555) 234-5678');

  // Device Input State
  const [inputModelName, setInputModelName] = useState<string>('iPhone 15 Pro');
  const [inputImei, setInputImei] = useState<string>('358291048291048');
  const [inputCondition, setInputCondition] = useState<string>('Brand New');
  const [inputStorage, setInputStorage] = useState<string>('256GB');
  const [inputPrice, setInputPrice] = useState<string>('1099.00');

  // Custom Accessory Input State
  const [customAccessoryName, setCustomAccessoryName] = useState<string>('');
  const [customAccessoryPrice, setCustomAccessoryPrice] = useState<string>('');

  // Cart State
  const [cart, setCart] = useState<CartDeviceItem[]>([
    {
      id: 'POS-DEV-1',
      brand: 'Apple',
      model: 'iPhone 15 Pro',
      imei: '358291048291048',
      condition: 'Brand New',
      storage: '256GB',
      color: 'Natural Titanium',
      price: 1099.0,
      quantity: 1,
      isDevice: true,
    },
    {
      id: 'POS-ACC-1',
      brand: 'Apple',
      model: 'AirPods Pro (2nd Gen)',
      imei: 'N/A (Accessory)',
      condition: 'New',
      storage: 'Standard',
      color: 'White',
      price: 249.0,
      quantity: 1,
      isDevice: false,
    },
  ]);

  // Payment Selection State
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CARD');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Finalized Receipt Data
  const [finalReceipt, setFinalReceipt] = useState<any>(null);

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

  // Model Selection Change Handler
  const handleModelSelect = (val: string) => {
    setInputModelName(val);
    const matched = presetModels.find((m) => m.model.toLowerCase() === val.toLowerCase());
    if (matched) {
      setInputPrice(matched.defaultPrice.toFixed(2));
      setInputStorage(matched.storage);
    }
  };

  // Add Device to Cart
  const handleAddDeviceToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputImei || !inputModelName) return;

    const matched = presetModels.find((m) => m.model.toLowerCase() === inputModelName.toLowerCase());
    const newDevice: CartDeviceItem = {
      id: `DEV-${Date.now()}`,
      brand: matched ? matched.brand : 'Device',
      model: inputModelName,
      imei: inputImei,
      condition: inputCondition,
      storage: inputStorage,
      color: matched ? matched.color : 'Standard',
      price: parseFloat(inputPrice) || (matched ? matched.defaultPrice : 0),
      quantity: 1,
      isDevice: true,
    };

    setCart((prev) => [newDevice, ...prev]);
    setInputImei('');
  };

  // Add Preset Accessory
  const handleAddAccessory = (acc: typeof accessoryPresets[0]) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === acc.id);
      if (existing) {
        return prev.map((item) =>
          item.id === acc.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: acc.id,
          brand: acc.brand,
          model: acc.name,
          imei: 'N/A (Accessory)',
          condition: 'New',
          storage: 'Standard',
          color: acc.specs,
          price: acc.price,
          quantity: 1,
          isDevice: false,
        },
      ];
    });
  };

  // Add Custom Accessory
  const handleAddCustomAccessory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAccessoryName || !customAccessoryPrice) return;

    const newAcc: CartDeviceItem = {
      id: `ACC-CUST-${Date.now()}`,
      brand: 'Accessory',
      model: customAccessoryName,
      imei: 'N/A (Accessory)',
      condition: 'New',
      storage: 'Standard',
      color: 'Custom',
      price: parseFloat(customAccessoryPrice) || 0,
      quantity: 1,
      isDevice: false,
    };

    setCart((prev) => [newAcc, ...prev]);
    setCustomAccessoryName('');
    setCustomAccessoryPrice('');
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

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Step 2: Confirm Payment & Finalize Receipt
  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setFinalReceipt({
        id: `#RCP-${Math.floor(90000 + Math.random() * 9000)}`,
        customerName: customerName || 'Walking Customer',
        customerPhone: customerPhone || 'N/A',
        items: cart,
        subtotal,
        tax,
        total: grandTotal,
        paymentMethod,
        cashTendered: parseFloat(cashTendered) || grandTotal,
        changeDue,
        date: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
      setCheckoutStep(3); // Advance to Receipt Preview & Archive
    }, 700);
  };

  const resetForm = () => {
    setCart([]);
    setCheckoutStep(1);
    setFinalReceipt(null);
    setCashTendered('');
  };

  return (
    <div className="space-y-6 font-sans pb-24 md:pb-8">
      
      {/* Top Header & Multi-Step Progress Tracker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <nav className="flex items-center text-xs font-semibold text-slate-500 gap-1 mb-1">
            <Link href="/dashboard" className="hover:text-slate-900 transition">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900 font-bold">Sales & Invoices</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-blue-600 font-bold">Checkout POS</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {checkoutStep === 1 && 'Checkout POS Terminal'}
            {checkoutStep === 2 && 'Select Payment Method'}
            {checkoutStep === 3 && 'Transaction Receipt & Archive'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mt-1 leading-relaxed">
            {checkoutStep === 1 && 'Enter customer details, select phone models, scan IMEI barcodes, add accessories, and proceed.'}
            {checkoutStep === 2 && 'Select customer payment method (Cash, Card, Transfer) and confirm settlement.'}
            {checkoutStep === 3 && 'Review thermal receipt, print or email customer statement, and save to Receipts Archive.'}
          </p>
        </div>

        {/* Step Indicator Badges */}
        <div className="flex items-center gap-2 text-xs font-extrabold shrink-0">
          <span className={`px-3 py-1.5 rounded-full border transition ${checkoutStep === 1 ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
            1. Items & Customer
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className={`px-3 py-1.5 rounded-full border transition ${checkoutStep === 2 ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
            2. Payment Method
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className={`px-3 py-1.5 rounded-full border transition ${checkoutStep === 3 ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
            3. Receipt & Archive
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: ORDER BUILDER & CART (2-COLUMN POS LAYOUT)                        */}
      {/* ========================================================================= */}
      {checkoutStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT 7 COLUMNS: CUSTOMER INFO, PHONE ENTRY & IMEI SCANNER */}
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
                  <label className="text-xs font-bold text-slate-700">Customer Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Johnathan Doe or Walking Customer..."
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
                      placeholder="+1 (555) 234-5678"
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Device Entry Form & IMEI Scanner */}
            <form onSubmit={handleAddDeviceToCart} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600" /> Phone Entry & IMEI Scanner
                </h2>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Device Details</span>
              </div>

              {/* Type or Select Phone Model */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Phone Model (Type or Select) *</label>
                <input
                  type="text"
                  required
                  list="phone-model-options"
                  value={inputModelName}
                  onChange={(e) => handleModelSelect(e.target.value)}
                  placeholder="Type model name (e.g. iPhone 15 Pro, Galaxy S24...)"
                  className="w-full text-xs px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <datalist id="phone-model-options">
                  {presetModels.map((m, idx) => (
                    <option key={idx} value={m.model} />
                  ))}
                </datalist>
              </div>

              {/* IMEI / Serial Number Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">IMEI 1 / Serial Number *</label>
                <div className="relative">
                  <Barcode className="w-5 h-5 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={inputImei}
                    onChange={(e) => setInputImei(e.target.value)}
                    placeholder="Scan barcode or type 15-digit IMEI..."
                    className="w-full font-mono text-xs pl-11 pr-24 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setInputImei(`3582${Math.floor(1000000000 + Math.random() * 9000000000)}`)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-100 transition"
                  >
                    Generate Test
                  </button>
                </div>
              </div>

              {/* Condition, Storage, and Selling Price Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Condition</label>
                  <select
                    value={inputCondition}
                    onChange={(e) => setInputCondition(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Brand New">Brand New</option>
                    <option value="Mint Condition">Mint Condition</option>
                    <option value="Used / Fair">Used / Fair</option>
                    <option value="Refurbished">Refurbished</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Storage Capacity</label>
                  <input
                    type="text"
                    list="storage-options"
                    value={inputStorage}
                    onChange={(e) => setInputStorage(e.target.value)}
                    placeholder="Type or select storage..."
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  <datalist id="storage-options">
                    <option value="128GB" />
                    <option value="256GB" />
                    <option value="512GB" />
                    <option value="1TB" />
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Selling Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={inputPrice}
                    onChange={(e) => setInputPrice(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="md"
                  leftIcon={<Plus className="w-4 h-4" />}
                  className="bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 font-bold"
                >
                  Add Device to Order
                </Button>
              </div>
            </form>

            {/* Quick Add & Custom Accessory Input Section */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Headphones className="w-4 h-4 text-indigo-600" /> Add Accessories & Custom Items
              </h3>

              <form onSubmit={handleAddCustomAccessory} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <p className="text-[11px] font-bold text-slate-700">Custom Accessory Entry</p>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-7">
                    <input
                      type="text"
                      required
                      value={customAccessoryName}
                      onChange={(e) => setCustomAccessoryName(e.target.value)}
                      placeholder="Item Name (e.g. Clear Phone Case)..."
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={customAccessoryPrice}
                      onChange={(e) => setCustomAccessoryPrice(e.target.value)}
                      placeholder="Price ($)..."
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {accessoryPresets.map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => handleAddAccessory(acc)}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 hover:border-blue-500/60 hover:bg-blue-50/40 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-extrabold text-slate-900 text-xs">{acc.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{acc.brand} • {acc.specs}</p>
                      <p className="text-xs font-bold text-blue-600 mt-0.5">${acc.price.toFixed(2)}</p>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-white text-blue-600 border border-slate-200 group-hover:bg-blue-600 group-hover:text-white transition flex items-center justify-center font-bold">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT 5 COLUMNS: CURRENT ORDER POS CART & PROCEED TO PAYMENT */}
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
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Assigned Customer</p>
                    <p className="text-xs font-extrabold text-slate-900">{customerName || 'Walking Customer'}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{customerPhone}</p>
                  </div>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium">
                    Your cart is empty. Add a device or accessory above.
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

                        <span className="font-extrabold text-slate-900 w-16 text-right">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>

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
                  <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8%)</span>
                  <span className="font-bold text-slate-900">${tax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-baseline pt-3 border-t border-slate-200 text-slate-900 font-extrabold">
                  <span className="text-sm">Grand Total</span>
                  <span className="text-2xl text-blue-600 font-extrabold">${grandTotal.toFixed(2)}</span>
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

      {/* ========================================================================= */}
      {/* STEP 2: PAYMENT METHOD SELECTION PAGE VIEW                                */}
      {/* ========================================================================= */}
      {checkoutStep === 2 && (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Select Payment Method</h2>
                <p className="text-xs text-slate-500 font-medium">Customer: <strong>{customerName}</strong> ({customerPhone})</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-extrabold uppercase">Total Amount Due</p>
                <p className="text-2xl font-extrabold text-blue-600">${grandTotal.toFixed(2)}</p>
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
                <span className="text-xs font-extrabold">Credit / Debit Card</span>
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
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`p-4 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 ${
                  paymentMethod === 'TRANSFER'
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
                  <label className="font-bold text-slate-700">Cash Tendered ($)</label>
                  <span className="text-[10px] text-slate-400 font-bold">Quick Exact: ${grandTotal.toFixed(2)}</span>
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
                  <span className="text-emerald-700 text-sm font-extrabold">${changeDue.toFixed(2)}</span>
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
                Confirm Payment & Generate Receipt
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: THERMAL RECEIPT PREVIEW & ARCHIVE SAVED                           */}
      {/* ========================================================================= */}
      {checkoutStep === 3 && finalReceipt && (
        <div className="max-w-md mx-auto space-y-6 animate-in zoom-in duration-200">
          
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xl text-center space-y-4">
            
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-subtle">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Transaction Complete!</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Receipt saved to <strong className="text-slate-800">Receipts Archive</strong>
              </p>
            </div>

            {/* Realistic Thermal Receipt Display */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-dashed border-slate-300 font-mono text-xs text-slate-800 space-y-3 text-left">
              <div className="text-center space-y-0.5 border-b border-slate-200 pb-3">
                <p className="font-extrabold text-sm text-slate-900">VERIFYFLOW RETAIL POS</p>
                <p className="text-[10px] text-slate-500 font-sans">Store #402 - Main Branch<br />5th Ave, Manhattan, NY</p>
              </div>

              <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                <span>Receipt: <strong>{finalReceipt.id}</strong></span>
                <span>{finalReceipt.date}</span>
              </div>
              <p className="text-[10px] text-slate-500">Customer: <strong>{finalReceipt.customerName}</strong> ({finalReceipt.customerPhone})</p>

              <div className="border-y border-slate-200 py-2 space-y-1.5">
                {finalReceipt.items.map((item: CartDeviceItem) => (
                  <div key={item.id} className="flex justify-between text-[11px]">
                    <div>
                      <p className="font-bold text-slate-900">{item.model}</p>
                      <p className="text-[9px] text-slate-500">{item.isDevice ? `IMEI: ${item.imei}` : item.color}</p>
                    </div>
                    <span className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>${finalReceipt.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax (8%)</span>
                  <span>${finalReceipt.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm border-t border-slate-200 pt-2 text-slate-900">
                  <span>TOTAL PAID</span>
                  <span className="text-blue-600">${finalReceipt.total.toFixed(2)}</span>
                </div>
                {finalReceipt.paymentMethod === 'CASH' && (
                  <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                    <span>Change Due:</span>
                    <span className="font-bold text-emerald-700">${finalReceipt.changeDue.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Receipt Actions: Print / Email / Archive / Reset */}
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="primary" size="md" leftIcon={<Printer className="w-4 h-4" />}>
                  Print Receipt
                </Button>
                <Button variant="secondary" size="md" leftIcon={<Mail className="w-4 h-4" />}>
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
                size="lg"
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
