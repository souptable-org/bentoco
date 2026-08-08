'use client';

import React, { useState } from 'react';
import { PackageSearch, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import Grainient from '@/components/ui/Grainient';
import OrderTrackingModal from '@/components/ui/OrderTrackingModal';

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [status, setStatus] = useState<'idle' | 'tracking' | 'found'>('idle');

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;
    setStatus('tracking');
    setTimeout(() => {
      setStatus('found');
    }, 1500);
  };

  return (
    <div className="relative flex flex-col min-h-screen">
      <div className="fixed inset-0 z-0">
        <Grainient 
          color1="#FF9FFC" 
          color2="#5227FF" 
          color3="#B497CF" 
          timeSpeed={0.2}
          warpStrength={1.5}
          blendSoftness={0.5}
          contrast={1.5}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 w-full flex-1 flex flex-col">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4 md:mb-6 tracking-[-0.44px] text-foreground">Track Your Order</h1>
          <p className="text-foreground/90 text-lg font-medium">Enter your order ID or tracking number to see the latest status of your delivery.</p>
        </div>

        <div className="max-w-2xl w-full mx-auto bg-card/90 backdrop-blur-md p-6 md:p-10 rounded-[12px] border border-border/50 shadow-md mb-12">
        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <PackageSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. AURA-12345678" 
              className="w-full bg-background border border-transparent rounded-[6px] pl-12 pr-4 py-4 font-bold focus:outline-none focus:ring-2 focus:ring-accent shadow-inner"
            />
          </div>
          <button 
            type="submit" 
            disabled={status === 'tracking' || !orderId}
            className="bg-primary text-primary-foreground px-8 py-4 rounded-[6px] font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-70 shadow-md hover:shadow-lg active:shadow-sm"
          >
            {status === 'tracking' ? 'Tracking...' : (
              <>Track Order <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      </div>

      <OrderTrackingModal 
        open={status === 'found'} 
        onClose={() => setStatus('idle')} 
        orderId={orderId} 
      />
    </div>
    </div>
  );
}
