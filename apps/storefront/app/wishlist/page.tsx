'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { mockProducts } from '@/lib/data';
import { ProductCard } from '@/components/product/ProductCard';
import { Heart } from 'lucide-react';

export default function WishlistPage() {
  const { wishlist } = useApp();
  
  const wishlistedProducts = mockProducts.filter(p => wishlist.includes(p.id));

  if (wishlistedProducts.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <Heart className="w-16 h-16 opacity-20 mb-6" />
        <h1 className="font-serif text-3xl font-semibold mb-4">Your Wishlist is Empty</h1>
        <p className="text-muted-foreground mb-8 max-w-md">Save your favorite items here to review them later or share with friends.</p>
        <Link 
          href="/shop"
          className="bg-primary text-primary-foreground px-8 py-4 font-medium uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors"
        >
          Discover Pieces
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
      <div className="flex items-center justify-between mb-12">
        <h1 className="font-serif text-4xl md:text-5xl font-semibold">Wishlist</h1>
        <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">{wishlistedProducts.length} Items</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
        {wishlistedProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
