'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';

export default function AccountPage() {
  const [view, setView] = useState<'login' | 'register'>('login');

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-24 min-h-[70vh]">
      <div className="flex gap-8 mb-12 border-b border-border">
        <button 
          onClick={() => setView('login')}
          className={`pb-4 text-sm font-medium uppercase tracking-widest transition-colors ${view === 'login' ? 'text-foreground border-b-2 border-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Sign In
        </button>
        <button 
          onClick={() => setView('register')}
          className={`pb-4 text-sm font-medium uppercase tracking-widest transition-colors ${view === 'register' ? 'text-foreground border-b-2 border-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Create Account
        </button>
      </div>

      <AnimatePresence mode="wait">
        {view === 'login' ? (
          <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <input type="email" required className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Password</label>
                <button type="button" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4">Forgot Password?</button>
              </div>
              <input type="password" required className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent" />
            </div>
            <button type="button" onClick={() => alert('Frontend-only demo: Authentication is disabled.')} className="w-full bg-primary text-primary-foreground py-4 font-medium uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors">
              Sign In
            </button>
          </motion.form>
        ) : (
          <motion.form key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <input type="text" required className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <input type="text" required className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <input type="email" required className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <input type="password" required className="w-full border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent" />
            </div>
            <button type="button" onClick={() => alert('Frontend-only demo: Authentication is disabled.')} className="w-full bg-primary text-primary-foreground py-4 font-medium uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors">
              Create Account
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
