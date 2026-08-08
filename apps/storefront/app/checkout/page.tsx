'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '@/lib/store';
import {
  ensureShippingMethod,
  INDIA_REGION_ID,
  isValidIndianPhone,
  isValidIndianPincode,
  lookupPincode,
  normalizeIndianPhone,
  placeCodOrder,
  placeRazorpayOrder,
  updateCart,
} from '@/lib/medusa-cart';
import { ShieldCheck, ChevronLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { medusaFetch } from '@/lib/medusa';

type ShippingForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  pincode: string;
  city: string;
  province: string;
};

const emptyForm: ShippingForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address1: '',
  address2: '',
  pincode: '',
  city: '',
  province: '',
};

export default function CheckoutPage() {
  const {
    cart,
    cartSubtotal,
    cartTax,
    cartShipping,
    cartTotal,
    cartId,
    cartSource,
    refreshCart,
    clearCart,
  } = useApp();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi' | 'card'>('upi');
  const [orderId, setOrderId] = useState('');
  const [orderDisplayId, setOrderDisplayId] = useState<string | number>('');
  const [paymentNote, setPaymentNote] = useState<string | null>(null);
  const [form, setForm] = useState<ShippingForm>(emptyForm);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [pinLookup, setPinLookup] = useState<'idle' | 'loading' | 'ok' | 'miss'>('idle');
  const [savedShipping, setSavedShipping] = useState<ShippingForm | null>(null);

  const [otpStep, setOtpStep] = useState<'none' | 'pending'>('none');
  const [otpCode, setOtpCode] = useState('');
  const [tempOrderId, setTempOrderId] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);

  const handleDigitChange = (index: number, val: string) => {
    const newVal = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = newVal;
    setOtpDigits(newDigits);
    setOtpCode(newDigits.join(''));
    if (newVal && index < 3) {
      document.getElementById(`otp-digit-${index + 1}`)?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        document.getElementById(`otp-digit-${index - 1}`)?.focus();
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        setOtpCode(newDigits.join(''));
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(price);
  };

  const setField = <K extends keyof ShippingForm>(key: K, value: ShippingForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldError(null);
  };

  const onPincodeChange = useCallback(async (raw: string) => {
    const pincode = raw.replace(/\D/g, '').slice(0, 6);
    setForm((prev) => ({ ...prev, pincode }));
    setFieldError(null);
    if (pincode.length !== 6) {
      setPinLookup('idle');
      return;
    }
    if (!isValidIndianPincode(pincode)) {
      setPinLookup('miss');
      return;
    }
    setPinLookup('loading');
    const hit = await lookupPincode(pincode);
    if (hit) {
      setForm((prev) => ({
        ...prev,
        pincode,
        city: prev.city || hit.city,
        province: prev.province || hit.province,
      }));
      setPinLookup('ok');
    } else {
      setPinLookup('miss');
    }
  }, []);

  const validateShipping = (): string | null => {
    if (!form.firstName.trim()) return 'First name is required';
    if (!form.lastName.trim()) return 'Last name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return 'Enter a valid email for order updates';
    }
    if (!isValidIndianPhone(form.phone)) {
      return 'Enter a valid 10-digit Indian mobile number';
    }
    if (!form.address1.trim()) return 'Address is required';
    if (!isValidIndianPincode(form.pincode)) {
      return 'Enter a valid 6-digit pincode';
    }
    if (!form.city.trim()) return 'City is required';
    if (!form.province.trim()) return 'State is required';
    return null;
  };

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateShipping();
    if (err) {
      setFieldError(err);
      return;
    }

    if (!cartId || cartSource !== 'medusa') {
      setFieldError('Cart is not connected to Medusa. Add products again from the shop.');
      return;
    }

    setSaving(true);
    setFieldError(null);
    try {
      const phone = normalizeIndianPhone(form.phone);
      const address = {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        phone,
        address_1: form.address1.trim(),
        address_2: form.address2.trim() || undefined,
        city: form.city.trim(),
        province: form.province.trim(),
        postal_code: form.pincode.trim(),
        country_code: 'in',
      };
      await updateCart(cartId, {
        email: form.email.trim().toLowerCase(),
        region_id: INDIA_REGION_ID,
        shipping_address: address,
        billing_address: address,
      });
      // Attach free Standard Delivery so complete cart can succeed
      await ensureShippingMethod(cartId);
      await refreshCart();
      setSavedShipping({ ...form, phone });
      setStep(2);
    } catch (e: any) {
      setFieldError(e?.message || 'Could not save shipping address. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const method = paymentMethod; // capture at submit — never fall through

    if (method === 'card') {
      setFieldError(
        'Use “UPI / Razorpay” — cards open inside the Razorpay Checkout window.'
      );
      return;
    }
    if (!cartId || cartSource !== 'medusa') {
      setFieldError('Cart is not connected to Medusa.');
      return;
    }

    setPlacing(true);
    setFieldError(null);
    setPaymentNote(null);

    try {
      if (method === 'upi') {
        // Prepaid only — never call placeCodOrder here
        setPaymentNote('Opening Razorpay…');
        const result = await placeRazorpayOrder(cartId, {
          name: savedShipping
            ? `${savedShipping.firstName} ${savedShipping.lastName}`
            : undefined,
          email: savedShipping?.email,
          phone: savedShipping
            ? normalizeIndianPhone(savedShipping.phone)
            : undefined,
        });
        setOrderId(result.order.id);
        setOrderDisplayId(result.order.display_id ?? result.order.id);
        setPaymentNote(
          `PREPAID · Razorpay ${result.payment.status} · ${result.payment.razorpay_payment_id}`
        );
        clearCart();
        setStep(3);
        return;
      }

      if (method === 'cod') {
        setPaymentNote('Requesting OTP…');
        const phone = savedShipping ? normalizeIndianPhone(savedShipping.phone) : '';
        const data = await medusaFetch<{ order_id: string; otp?: string }>('/store/cod/request-otp', {
          method: 'POST',
          body: JSON.stringify({
            cart_id: cartId,
            phone,
          }),
        });
        setTempOrderId(data.order_id);
        if (data.otp) {
          setDevOtp(data.otp);
        }
        setOtpStep('pending');
        setPaymentNote(null);
        return;
      }

      setFieldError(`Unknown payment method: ${method}`);
    } catch (err: any) {
      const msg =
        err?.message ||
        (typeof err === 'string' ? err : null) ||
        'Could not place order. Try again.';
      // Surface Razorpay/API failures clearly — do not silently COD
      setFieldError(msg);
      setPaymentNote(null);
    } finally {
      setPlacing(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlacing(true);
    setFieldError(null);
    try {
      const phone = savedShipping ? normalizeIndianPhone(savedShipping.phone) : '';
      const data = await medusaFetch<{ order: { id: string; display_id?: number | string } }>('/store/cod/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          order_id: tempOrderId,
          phone,
          otp: otpCode,
        }),
      });
      setOrderId(data.order.id);
      setOrderDisplayId(data.order.display_id ?? data.order.id);
      setPaymentNote('Cash on Delivery — pay when the package arrives.');
      clearCart();
      setOtpStep('none');
      setStep(3);
    } catch (err: any) {
      setFieldError(err.message || 'OTP verification failed.');
    } finally {
      setPlacing(false);
    }
  };

  if (cart.length === 0 && step !== 3) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
        <h1 className="font-serif text-2xl font-semibold mb-4">No items to checkout</h1>
        <Link href="/shop" className="text-accent underline underline-offset-4">Return to shop</Link>
      </div>
    );
  }

  const inputClass =
    'w-full border border-border bg-neutral-100/50 dark:bg-neutral-900/40 px-4 py-3 text-sm focus:outline-none focus:border-accent shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-colors';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
        
        {/* Left Column: Form */}
        <div className="w-full lg:w-3/5">
          {step < 3 && (
            <Link href={step === 1 ? "/cart" : "#"} onClick={(e) => { if (step === 2) { e.preventDefault(); setStep(1); } }} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
              <ChevronLeft className="w-4 h-4" /> {step === 1 ? 'Back to Cart' : 'Back to Shipping'}
            </Link>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <h1 className="font-serif text-3xl font-semibold mb-2">Shipping Information</h1>
                <p className="text-sm text-muted-foreground mb-8">
                  Guest checkout — no account required. Address is saved to your cart.
                </p>
                <form id="checkout-form" onSubmit={handleShippingSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="firstName">First Name</label>
                      <input
                        id="firstName"
                        required
                        type="text"
                        autoComplete="given-name"
                        value={form.firstName}
                        onChange={(e) => setField('firstName', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="lastName">Last Name</label>
                      <input
                        id="lastName"
                        required
                        type="text"
                        autoComplete="family-name"
                        value={form.lastName}
                        onChange={(e) => setField('lastName', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="email">Email Address (for order updates)</label>
                    <input
                      id="email"
                      required
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => setField('email', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="phone">Phone Number</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-4 border border-r-0 border-border bg-muted text-sm text-muted-foreground">+91</span>
                      <input
                        id="phone"
                        required
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        maxLength={10}
                        pattern="[6-9][0-9]{9}"
                        placeholder="10-digit mobile number"
                        value={form.phone}
                        onChange={(e) => setField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="address1">Address</label>
                    <input
                      id="address1"
                      required
                      type="text"
                      autoComplete="address-line1"
                      placeholder="House/Flat No., Building Name, Street"
                      value={form.address1}
                      onChange={(e) => setField('address1', e.target.value)}
                      className={`${inputClass} mb-2`}
                    />
                    <input
                      id="address2"
                      type="text"
                      autoComplete="address-line2"
                      placeholder="Locality / Landmark (Optional)"
                      value={form.address2}
                      onChange={(e) => setField('address2', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="pincode">Pincode</label>
                      <input
                        id="pincode"
                        required
                        type="text"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        maxLength={6}
                        pattern="[1-9][0-9]{5}"
                        placeholder="6 digits"
                        value={form.pincode}
                        onChange={(e) => void onPincodeChange(e.target.value)}
                        className={inputClass}
                      />
                      {pinLookup === 'loading' && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Looking up city…
                        </p>
                      )}
                      {pinLookup === 'ok' && (
                        <p className="text-xs text-success">Pincode found — city/state filled if empty</p>
                      )}
                      {pinLookup === 'miss' && form.pincode.length === 6 && (
                        <p className="text-xs text-muted-foreground">Enter city &amp; state manually</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="city">City</label>
                      <input
                        id="city"
                        required
                        type="text"
                        autoComplete="address-level2"
                        value={form.city}
                        onChange={(e) => setField('city', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="province">State</label>
                    <input
                      id="province"
                      required
                      type="text"
                      autoComplete="address-level1"
                      placeholder="e.g. Maharashtra"
                      value={form.province}
                      onChange={(e) => setField('province', e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  {fieldError && (
                    <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-4 py-3">
                      {fieldError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-primary text-primary-foreground py-4 mt-4 font-medium uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? 'Saving address…' : 'Continue to Payment'}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <h1 className="font-serif text-3xl font-semibold mb-4">
                  {otpStep === 'pending' ? 'Verify Mobile Number' : 'Payment Method'}
                </h1>
                {savedShipping && (
                  <div className="mb-8 p-4 border border-border bg-secondary/20 text-sm space-y-1">
                    <p className="font-medium">
                      {savedShipping.firstName} {savedShipping.lastName}
                    </p>
                    <p className="text-muted-foreground">
                      {savedShipping.address1}
                      {savedShipping.address2 ? `, ${savedShipping.address2}` : ''}
                    </p>
                    <p className="text-muted-foreground">
                      {savedShipping.city}, {savedShipping.province} — {savedShipping.pincode}
                    </p>
                    <p className="text-muted-foreground">
                      +91 {normalizeIndianPhone(savedShipping.phone)} · {savedShipping.email}
                    </p>
                    <p className="text-xs text-success pt-1">Saved on Medusa cart · free Standard Delivery</p>
                  </div>
                )}

                {otpStep === 'pending' ? (
                  <form onSubmit={handleVerifyOtpSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-center block">
                        Enter 4-Digit OTP sent to +91 {savedShipping?.phone}
                      </label>
                      <div className="flex justify-center gap-4 py-2">
                        {[0, 1, 2, 3].map((idx) => (
                          <input
                            key={idx}
                            id={`otp-digit-${idx}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            pattern="\d"
                            required
                            value={otpDigits[idx]}
                            onChange={(e) => handleDigitChange(idx, e.target.value)}
                            onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                            className="w-14 h-14 border border-border bg-neutral-100/50 dark:bg-neutral-900/40 text-center text-2xl font-bold rounded-md focus:outline-none focus:border-accent transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
                          />
                        ))}
                      </div>
                      {devOtp && (
                        <p className="text-xs text-amber-500 font-mono text-center">
                          Development Mode Auto-detected: Use OTP code <span className="font-bold underline">{devOtp}</span>
                        </p>
                      )}
                    </div>

                    {fieldError && (
                      <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-4 py-3">
                        {fieldError}
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep('none');
                          setOtpCode('');
                          setOtpDigits(['', '', '', '']);
                          setFieldError(null);
                        }}
                        className="w-1/3 border border-border py-4 font-medium uppercase tracking-widest text-xs hover:bg-muted transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={placing}
                        className="w-2/3 bg-primary text-primary-foreground py-4 font-medium uppercase tracking-widest text-xs hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {placing && <Loader2 className="w-4 h-4 animate-spin" />}
                        Verify &amp; Confirm Order
                      </button>
                    </div>
                  </form>
                ) : (
                  <form id="payment-form" onSubmit={handlePaymentSubmit} className="space-y-6">
                    
                    <div className="border border-border divide-y divide-border rounded-sm overflow-hidden">
                      
                      {/* UPI / Razorpay (BYOK) — must open Checkout modal; never auto-COD */}
                      <label className={`flex items-center gap-4 p-4 cursor-pointer transition-colors ${paymentMethod === 'upi' ? 'bg-secondary/30 ring-1 ring-accent/40' : 'hover:bg-muted/50'}`}>
                        <input
                          type="radio"
                          name="checkout_payment_method"
                          value="upi"
                          checked={paymentMethod === 'upi'}
                          onChange={() => { setPaymentMethod('upi'); setFieldError(null); }}
                          className="w-4 h-4 text-accent accent-accent"
                        />
                        <div className="flex-1">
                          <span className="font-medium block">UPI / Razorpay (GPay, PhonePe, Cards)</span>
                          <span className="text-xs text-muted-foreground">Pay now — Razorpay window must open; order only after payment verified</span>
                        </div>
                        <div className="flex gap-2 opacity-50 grayscale">
                          <div className="w-8 h-5 bg-background border border-border rounded flex items-center justify-center text-[8px] font-bold">UPI</div>
                        </div>
                      </label>

                      {/* COD */}
                      <label className={`flex items-center gap-4 p-4 cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'bg-secondary/30 ring-1 ring-accent/40' : 'hover:bg-muted/50'}`}>
                        <input
                          type="radio"
                          name="checkout_payment_method"
                          value="cod"
                          checked={paymentMethod === 'cod'}
                          onChange={() => { setPaymentMethod('cod'); setFieldError(null); }}
                          className="w-4 h-4 text-accent accent-accent"
                        />
                        <div className="flex-1">
                          <span className="font-medium block">Cash on Delivery</span>
                          <span className="text-xs text-muted-foreground">Pay when you receive · no Razorpay charge</span>
                        </div>
                      </label>

                      {/* Card — via Razorpay checkout if enabled */}
                      <label className={`flex items-center gap-4 p-4 cursor-pointer transition-colors opacity-70 ${paymentMethod === 'card' ? 'bg-secondary/30' : 'hover:bg-muted/50'}`}>
                        <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => { setPaymentMethod('card'); setFieldError(null); }} className="w-4 h-4 text-accent accent-accent" />
                        <div className="flex-1">
                          <span className="font-medium block">Credit / Debit Card</span>
                          <span className="text-xs text-muted-foreground">Use UPI / Razorpay option (cards open inside Checkout)</span>
                        </div>
                      </label>

                    </div>

                    {fieldError && (
                      <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-4 py-3">
                        {fieldError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={placing || paymentMethod === 'card'}
                      className="w-full bg-primary text-primary-foreground py-4 mt-4 font-medium uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {placing && <Loader2 className="w-4 h-4 animate-spin" />}
                      {placing
                        ? paymentMethod === 'upi'
                          ? 'Waiting for payment…'
                          : 'Placing order…'
                        : paymentMethod === 'upi'
                          ? `Pay with Razorpay — ${formatPrice(cartTotal)}`
                          : `Place COD Order — ${formatPrice(cartTotal)}`}
                    </button>
                  </form>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
                <h1 className="font-serif text-4xl font-semibold mb-4">Order Confirmed</h1>
                <p className="text-muted-foreground max-w-md mb-2">
                  Thank you! Your COD order{' '}
                  <span className="font-medium text-foreground">#{orderDisplayId}</span>
                  {' '}has been placed.
                </p>
                <p className="text-xs text-muted-foreground max-w-md mb-2 font-mono break-all">
                  {orderId}
                </p>
                {paymentNote && (
                  <p className="text-sm text-success max-w-md mb-4 font-medium">{paymentNote}</p>
                )}
                <p className="text-muted-foreground max-w-md mb-8">
                  This order is live in Medusa Admin → Orders. Prepaid payments store Razorpay ids on order metadata.
                </p>
                <Link href="/shop" className="bg-primary text-primary-foreground px-8 py-4 font-medium uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors">
                  Continue Shopping
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Order Summary */}
        {step < 3 && (
          <div className="w-full lg:w-2/5">
            <div className="bg-secondary/30 p-8 sticky top-24">
              <h2 className="font-serif text-2xl font-semibold mb-2">In Your Bag</h2>
              <p className="text-xs text-muted-foreground mb-6">
                {cartSource === 'medusa'
                  ? `Medusa cart${cartId ? ` · ${cartId.slice(0, 16)}…` : ''}`
                  : cartSource === 'loading'
                    ? 'Loading cart…'
                    : 'Local cart (offline)'}
              </p>
              
              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto hide-scrollbar border-b border-border pb-6">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-16 h-20 bg-muted shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover" referrerPolicy="no-referrer" />
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-foreground text-background rounded-full text-[10px] font-bold flex items-center justify-center">{item.quantity}</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <span className="text-sm font-medium line-clamp-1">{item.name}</span>
                      <span className="text-xs text-muted-foreground">{item.size && `Size: ${item.size}`}</span>
                    </div>
                    <span className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium text-success">
                    {cartShipping > 0 ? formatPrice(cartShipping) : 'Free'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST (18%)</span>
                  <span className="font-medium">
                    {cartTax > 0
                      ? formatPrice(cartTax)
                      : step === 1
                        ? 'After address'
                        : formatPrice(0)}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4 mb-8 flex justify-between items-center">
                <span className="font-semibold uppercase tracking-wide">Total</span>
                <span className="font-serif text-2xl font-semibold">{formatPrice(cartTotal)}</span>
              </div>

              <div className="flex items-start gap-3 text-xs text-muted-foreground p-4 bg-background border border-border">
                <ShieldCheck className="w-5 h-5 text-success shrink-0" />
                <p><strong>Cash on Delivery</strong> — Order is created in Medusa; payment is collected when delivered.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
