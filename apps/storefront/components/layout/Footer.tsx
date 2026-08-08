import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="relative z-20 bg-foreground text-background py-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand Info */}
          <div>
            <div className="mb-6">
              <Image src="/logo.svg" alt="Aura Logo" width={140} height={70} className="invert dark:invert-0" />
            </div>
            <p className="text-background/70 text-sm leading-relaxed mb-6">
              Curating premium Indian aesthetics for the modern connoisseur. Experience unparalleled craftsmanship and timeless elegance.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-medium text-sm tracking-wider uppercase mb-6 text-accent">Shop</h4>
            <ul className="space-y-4 text-sm text-background/70">
              <li><Link href="/shop" className="hover:text-background transition-colors">New Arrivals</Link></li>
              <li><Link href="/shop?category=women" className="hover:text-background transition-colors">Women&apos;s Wear</Link></li>
              <li><Link href="/shop?category=men" className="hover:text-background transition-colors">Men&apos;s Wear</Link></li>
              <li><Link href="/shop?category=jewelry" className="hover:text-background transition-colors">Jewelry</Link></li>
              <li><Link href="/shop?category=festive" className="hover:text-background transition-colors">Festive Collection</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-medium text-sm tracking-wider uppercase mb-6 text-accent">Customer Care</h4>
            <ul className="space-y-4 text-sm text-background/70">
              <li><Link href="/contact" className="hover:text-background transition-colors">Contact Us</Link></li>
              <li><Link href="/shipping-returns" className="hover:text-background transition-colors">Shipping & Returns</Link></li>
              <li><Link href="/faq" className="hover:text-background transition-colors">FAQ</Link></li>
              <li><Link href="/track-order" className="hover:text-background transition-colors">Track Order</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold text-sm tracking-wider uppercase mb-6 text-accent">Insider Privileges</h4>
            <p className="text-background/70 text-sm mb-4 font-medium">Subscribe to receive updates on new arrivals, special offers and other discount information.</p>
            <form className="flex flex-col sm:flex-row gap-2">
              <input 
                type="email" 
                placeholder="Email address" 
                className="bg-background/10 border border-transparent rounded-md px-4 py-3 sm:py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-colors text-background placeholder:text-background/50"
              />
              <button type="submit" className="bg-accent text-accent-foreground rounded-md px-4 py-3 sm:py-2 text-sm font-bold hover:bg-accent/90 transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </form>
          </div>

        </div>

        <div className="mt-16 pt-8 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-background/50 font-medium">
          <p>&copy; {new Date().getFullYear()} Aura Premium Ecommerce. All rights reserved.</p>
          <div className="flex gap-4">
            <span>GST: 27AABCU9603R1ZM</span>
            <span>Made in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
