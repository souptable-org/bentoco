'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Search, Menu, User, Heart, Moon, Sun, X } from 'lucide-react';
import { useApp } from '@/lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from 'next-themes';

export function Header() {
  const { cartCount, setIsCartOpen } = useApp();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Mobile Menu & Search */}
        <div className="flex items-center gap-4 lg:hidden">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-foreground hover:bg-muted rounded-md transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button className="p-2 text-foreground hover:bg-muted rounded-md transition-colors">
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
          <Link href="/shop?category=women" className="text-foreground/80 hover:text-foreground transition-colors py-2">Women</Link>
          <Link href="/shop?category=men" className="text-foreground/80 hover:text-foreground transition-colors py-2">Men</Link>
          <Link href="/shop?category=jewelry" className="text-foreground/80 hover:text-foreground transition-colors py-2">Jewelry</Link>
          <Link href="/shop?category=festive" className="text-accent hover:text-accent/80 transition-colors py-2 font-bold">Festive Store</Link>
        </nav>

        {/* Logo */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
          <Image src="/logo.svg" alt="Aura Logo" width={120} height={60} className="dark:invert" />
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button className="hidden lg:block p-2 text-foreground hover:bg-muted rounded-md transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-foreground hover:bg-muted rounded-md transition-colors"
          >
            {mounted && theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Link href="/account" className="hidden sm:block p-2 text-foreground hover:bg-muted rounded-md transition-colors">
            <User className="w-5 h-5" />
          </Link>
          <Link href="/wishlist" className="hidden sm:block p-2 text-foreground hover:bg-muted rounded-md transition-colors">
            <Heart className="w-5 h-5" />
          </Link>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="p-2 text-foreground hover:bg-muted rounded-md transition-colors relative"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-[10px] font-bold flex items-center justify-center"
              >
                {cartCount}
              </motion.span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[80%] max-w-sm bg-background border-r border-border z-50 lg:hidden flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="font-serif font-bold text-xl">Menu</span>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4">
                <nav className="flex flex-col space-y-1 px-4">
                  <Link 
                    href="/shop?category=women" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 text-lg font-medium hover:bg-muted rounded-md transition-colors"
                  >
                    Women
                  </Link>
                  <Link 
                    href="/shop?category=men" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 text-lg font-medium hover:bg-muted rounded-md transition-colors"
                  >
                    Men
                  </Link>
                  <Link 
                    href="/shop?category=jewelry" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 text-lg font-medium hover:bg-muted rounded-md transition-colors"
                  >
                    Jewelry
                  </Link>
                  <Link 
                    href="/shop?category=festive" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 text-lg font-bold text-accent hover:bg-muted rounded-md transition-colors"
                  >
                    Festive Store
                  </Link>
                </nav>
                
                <div className="mt-8 px-8">
                  <div className="h-px bg-border w-full mb-8" />
                  <nav className="flex flex-col space-y-4">
                    <Link 
                      href="/account"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 text-foreground/80 hover:text-foreground font-medium"
                    >
                      <User className="w-5 h-5" /> My Account
                    </Link>
                    <Link 
                      href="/wishlist"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 text-foreground/80 hover:text-foreground font-medium"
                    >
                      <Heart className="w-5 h-5" /> Wishlist
                    </Link>
                  </nav>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
