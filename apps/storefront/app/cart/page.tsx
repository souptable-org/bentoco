'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '@/lib/store';
import { X, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { TenantChrome } from '@/components/tenant-chrome';

export default function CartPage() {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
    cartTax,
    cartShipping,
    cartTotal,
    cartSource,
    isCartLoading,
    cartId,
  } = useApp();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(price);
  };

  if (cart.length === 0) {
    return (
      <TenantChrome tenant={{ store_name: "Storefront" }}>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <ShoppingBag className="w-16 h-16 opacity-20 mb-6" />
          <h1 className="font-serif text-3xl font-semibold mb-4">Your Shopping Bag is Empty</h1>
          <p className="text-muted-foreground mb-8 max-w-md">Looks like you haven&apos;t added anything yet. Discover our premium collection and find something you love.</p>
          <Link 
            href="/shop"
            className="bg-primary text-primary-foreground px-8 py-4 font-medium uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors"
          >
            Explore Collection
          </Link>
        </div>
      </TenantChrome>
    );
  }

  return (
    <TenantChrome tenant={{ store_name: "Storefront" }}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
      <h1 className="font-serif text-4xl md:text-5xl font-semibold mb-2">Shopping Bag</h1>
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-12">
        {cartSource === 'medusa'
          ? `Synced with Medusa${cartId ? ` · ${cartId.slice(0, 16)}…` : ''}`
          : 'Local cart'}
        {isCartLoading ? ' · updating…' : ''}
      </p>
      
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
        <div className="w-full lg:w-2/3 flex flex-col gap-8">
          
          <div className="hidden sm:grid grid-cols-12 gap-4 pb-4 border-b border-border text-sm font-medium uppercase tracking-widest text-muted-foreground">
            <div className="col-span-6">Product</div>
            <div className="col-span-3 text-center">Quantity</div>
            <div className="col-span-3 text-right">Total</div>
          </div>

          {cart.map(item => (
            <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center py-6 border-b border-border">
              <div className="col-span-1 sm:col-span-6 flex gap-6">
                <div className="relative w-24 sm:w-32 aspect-[3/4] bg-muted shrink-0">
                  <Image src={item.image} alt={item.name} fill className="object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex flex-col justify-center">
                  <Link href={`/product/${item.productId}`} className="font-medium hover:text-accent transition-colors line-clamp-2 mb-2">{item.name}</Link>
                  <div className="text-sm text-muted-foreground space-y-1 mb-4">
                    <p>{formatPrice(item.price)}</p>
                    {item.size && <p>Size: {item.size}</p>}
                    {item.color && <p>Color: {item.color}</p>}
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-sm text-muted-foreground hover:text-destructive underline underline-offset-4 w-max">
                    Remove
                  </button>
                </div>
              </div>

              <div className="col-span-1 sm:col-span-3 flex justify-start sm:justify-center">
                <div className="flex items-center border border-border w-max">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-3 hover:bg-muted transition-colors"><Minus className="w-4 h-4" /></button>
                  <span className="w-10 text-center font-medium">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-3 hover:bg-muted transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="col-span-1 sm:col-span-3 text-left sm:text-right font-semibold text-lg">
                {formatPrice(item.price * item.quantity)}
              </div>
            </div>
          ))}

        </div>

        <div className="w-full lg:w-1/3">
          <div className="bg-secondary/30 p-8">
            <h2 className="font-serif text-2xl font-semibold mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-8 text-sm">
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
                  {cartTax > 0 ? formatPrice(cartTax) : 'At checkout'}
                </span>
              </div>
            </div>

            <div className="border-t border-border pt-4 mb-8 flex justify-between items-center">
              <span className="font-semibold uppercase tracking-wide">Total</span>
              <span className="font-serif text-2xl font-semibold">{formatPrice(cartTotal)}</span>
            </div>

            <Link 
              href="/checkout"
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 font-medium uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="mt-6 flex flex-col gap-2 text-xs text-muted-foreground items-center text-center">
              <p>Secure checkout provided. We accept all major credit cards, UPI, and Cash on Delivery.</p>
              <div className="flex gap-4 mt-2">
                <span>✓ UPI</span>
                <span>✓ Net Banking</span>
                <span>✓ COD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </TenantChrome>
  );
}
