'use client';

import React from 'react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useApp } from '@/lib/store';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';

export function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    cartTotal,
    cartSource,
    isCartLoading,
    cartError,
    cartId,
  } = useApp();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-background z-50 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-lg font-serif font-semibold">Shopping Bag ({cart.length})</h2>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                  {cartSource === 'medusa'
                    ? `Medusa cart${cartId ? ` · ${cartId.slice(0, 12)}…` : ''}`
                    : cartSource === 'loading'
                      ? 'Loading cart…'
                      : 'Local cart (offline fallback)'}
                  {isCartLoading ? ' · syncing…' : ''}
                </p>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {cartError && (
              <div className="px-6 py-2 text-xs text-red-600 bg-red-50 border-b border-red-100">
                {cartError}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 hide-scrollbar">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-4">
                  <ShoppingBag className="w-12 h-12 opacity-20" />
                  <p>Your shopping bag is empty</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="mt-4 px-6 py-2 bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-24 h-32 flex-shrink-0 bg-muted rounded-[6px] overflow-hidden">
                      <Image 
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex flex-col flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="font-bold text-sm line-clamp-2">{item.name}</h3>
                          <div className="text-xs text-muted-foreground mt-1 space-x-2 font-medium">
                            {item.size && <span>Size: {item.size}</span>}
                            {item.color && <span>Color: {item.color}</span>}
                          </div>
                        </div>
                        <button 
                          onClick={() => void removeFromCart(item.id)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors p-1"
                          disabled={isCartLoading}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center bg-card rounded-md border border-border/50 overflow-hidden">
                          <button 
                            onClick={() => void updateQuantity(item.id, item.quantity - 1)}
                            className="p-2 hover:bg-muted transition-colors"
                            disabled={isCartLoading}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                          <button 
                            onClick={() => void updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 hover:bg-muted transition-colors"
                            disabled={isCartLoading}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="font-bold text-sm text-accent">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-border bg-background">
                <div className="flex justify-between mb-4 text-sm">
                  <span className="text-muted-foreground font-medium">Subtotal</span>
                  <span className="font-bold text-lg">{formatPrice(cartTotal)}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-6">Shipping & taxes calculated at checkout.</p>
                <Link 
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full block text-center bg-primary text-primary-foreground py-4 rounded-md font-bold hover:bg-primary/90 transition-colors uppercase tracking-wider text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  Checkout - {formatPrice(cartTotal)}
                </Link>
                
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">✅ UPI</span>
                  <span className="flex items-center gap-1">✅ Cash on Delivery</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
