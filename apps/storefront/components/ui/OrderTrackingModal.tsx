'use client';

import React, { useState, useEffect } from "react";
import { Package, Truck, CheckCircle2, MapPin, X, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// ---- Sample data (swap with real order data) ----
const ORDER = {
  id: "SS-84213",
  placedOn: "Jul 29, 2026",
  eta: "Aug 7",
  total: "₹2,340",
  items: [
    { name: "Ceramic Pour-Over Set", qty: 1, thumb: "🫖" },
    { name: "Oat Milk Frother, Steel", qty: 2, thumb: "🥛" },
  ],
  address: "Kalwa, Thane, Maharashtra",
  courier: "Delhivery · DL48291330IN",
  steps: [
    { key: "placed", label: "Order placed", detail: "We've got it — confirmation sent to your email.", time: "Jul 29, 10:12 AM", icon: Package },
    { key: "packed", label: "Packed", detail: "Item checked, boxed, and labeled at the Bhiwandi facility.", time: "Jul 30, 4:48 PM", icon: Package },
    { key: "transit", label: "In transit", detail: "On its way to Thane via the Mumbai hub.", time: "Aug 2, 8:03 AM", icon: Truck },
    { key: "out", label: "Out for delivery", detail: "With your local courier, arriving today.", time: "Aug 5, 9:20 AM", icon: MapPin },
    { key: "delivered", label: "Delivered", detail: "Handed to you or someone at the address.", time: "Expected Aug 5", icon: CheckCircle2 },
  ],
  currentStepIndex: 3,
};

function useCountUp(target: number, active: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf: number;
    const start = performance.now();
    const dur = 900;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target]);
  return n;
}

export default function OrderTrackingModal({ open, onClose, orderId = ORDER.id }: { open: boolean, onClose: () => void, orderId?: string }) {
  const [copied, setCopied] = useState(false);
  const pct = Math.round((ORDER.currentStepIndex / (ORDER.steps.length - 1)) * 100);
  const animatedPct = useCountUp(pct, open);

  const copyId = () => {
    navigator.clipboard?.writeText(orderId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  // Prevent scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[460px] max-h-[88vh] overflow-y-auto bg-card rounded-[18px] border border-border shadow-2xl scrollbar-hide"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="p-[22px_24px_18px] border-b border-border relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                aria-label="Close tracking"
              >
                <X size={18} />
              </button>

              <div className="text-xs tracking-[0.08em] text-muted-foreground font-bold uppercase">
                Order tracking
              </div>
              <h2 className="font-serif font-bold text-[25px] m-[4px_0_10px] text-foreground tracking-tight">
                Arriving {ORDER.eta}
              </h2>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={copyId}
                  className="flex items-center gap-1.5 bg-foreground text-background border-none rounded-full px-3 py-1 font-mono text-xs cursor-pointer hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
                >
                  {orderId}
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                </button>
                <span className="text-xs text-muted-foreground font-medium">Placed {ORDER.placedOn}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground font-medium">{ORDER.total}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="p-[18px_24px_6px]">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-200 ease-linear"
                  style={{ width: `${animatedPct}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[11.5px] text-muted-foreground font-medium">{ORDER.courier}</span>
                <span className="text-[11.5px] text-muted-foreground font-mono font-medium">{animatedPct}%</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-[14px_24px_8px]">
              {ORDER.steps.map((step, i) => {
                const isDone = i < ORDER.currentStepIndex;
                const isCurrent = i === ORDER.currentStepIndex;
                const isLast = i === ORDER.steps.length - 1;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex gap-[14px]">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-[34px] h-[34px] rounded-full flex items-center justify-center border-2 shrink-0 transition-colors duration-300 ${
                          isDone 
                            ? "border-primary bg-primary text-primary-foreground" 
                            : isCurrent 
                              ? "border-primary bg-primary/10 text-primary shadow-[0_0_0_0_rgba(var(--primary),0.45)] animate-[otm-pulse_1.8s_ease-in-out_infinite]" 
                              : "border-border bg-card text-muted-foreground"
                        }`}
                      >
                        <Icon size={16} strokeWidth={2.2} />
                      </div>
                      {!isLast && (
                        <div
                          className={`w-0.5 flex-1 min-h-[34px] my-0.5 transition-colors duration-300 ${
                            isDone ? "bg-primary" : "bg-border"
                          }`}
                        />
                      )}
                    </div>
                    <div className={`pt-[3px] ${isLast ? 'pb-1' : 'pb-[22px]'}`}>
                      <div
                        className={`text-[14.5px] ${isCurrent ? 'font-bold text-foreground' : isDone ? 'font-semibold text-foreground/80' : 'font-semibold text-muted-foreground'}`}
                      >
                        {step.label}
                        {isCurrent && (
                          <span className="ml-2 text-[10.5px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-[5px] px-1.5 py-[1.5px] tracking-[0.04em] uppercase align-middle">
                            Now
                          </span>
                        )}
                      </div>
                      <div className={`text-[13px] mt-0.5 leading-[1.4] ${isDone || isCurrent ? 'text-foreground/70' : 'text-muted-foreground'}`}>
                        {step.detail}
                      </div>
                      <div className="text-[11.5px] text-muted-foreground mt-[3px] font-mono font-medium">
                        {step.time}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Items */}
            <div className="p-[6px_24px_20px]">
              <div className="border-t border-border pt-[14px]">
                <div className="text-xs tracking-[0.06em] text-muted-foreground font-bold uppercase mb-2.5">
                  In this order
                </div>
                {ORDER.items.map((item, i) => (
                  <div key={i} className={`flex items-center gap-2.5 ${i === ORDER.items.length - 1 ? '' : 'mb-2'}`}>
                    <div className="w-[34px] h-[34px] rounded-lg bg-muted flex items-center justify-center text-base shrink-0">
                      {item.thumb}
                    </div>
                    <div className="text-[13.5px] text-foreground/90 font-medium flex-1">{item.name}</div>
                    <div className="text-[12.5px] text-muted-foreground font-medium">×{item.qty}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-[0_24px_22px] flex gap-2.5">
              <button className="flex-1 bg-foreground text-background border-none rounded-[10px] p-[11px_16px] text-[13.5px] font-bold cursor-pointer hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background shadow-sm">
                Track on courier site
              </button>
              <button
                onClick={onClose}
                className="bg-transparent text-foreground/70 border border-border rounded-[10px] p-[11px_16px] text-[13.5px] font-bold cursor-pointer hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
              >
                Close
              </button>
            </div>
            
            <style jsx global>{`
              @keyframes otm-pulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(var(--primary), 0.45); }
                50% { box-shadow: 0 0 0 7px rgba(var(--primary), 0); }
              }
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
