'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { Product } from '@/lib/types';
import { useApp } from '@/lib/store';
import { PriceLabel } from '@/components/product/PriceLabel';
import { withGstInclusive } from '@/lib/pricing';

export function ProductCard({ product }: { product: Product }) {
  const { toggleWishlist, isInWishlist } = useApp();
  const isWishlisted = isInWishlist(product.id);

  const inclusive = withGstInclusive(product.price);
  const inclusiveOriginal =
    product.originalPrice != null
      ? withGstInclusive(product.originalPrice)
      : undefined;

  return (
    <div className="group relative flex flex-col bg-card rounded-[8px] overflow-hidden p-3 transition-transform hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/product/${product.slug}`} className="relative aspect-[4/5] w-full overflow-hidden bg-muted rounded-[6px] mb-4 block">
        <Image 
          src={product.images[0]} 
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {product.images[1] && (
          <Image 
            src={product.images[1]} 
            alt={product.name}
            fill
            className="object-cover transition-opacity duration-500 opacity-0 group-hover:opacity-100 absolute inset-0"
            referrerPolicy="no-referrer"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isNew && (
            <span className="bg-primary text-primary-foreground rounded-full text-[10px] uppercase font-bold px-3 py-1 tracking-wider">New</span>
          )}
          {inclusiveOriginal != null && inclusiveOriginal > inclusive && (
            <span className="bg-destructive text-destructive-foreground rounded-full text-[10px] uppercase font-bold px-3 py-1 tracking-wider">
              {Math.round(((inclusiveOriginal - inclusive) / inclusiveOriginal) * 100)}% OFF
            </span>
          )}
        </div>
      </Link>
      
      <button 
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist(product.id);
        }}
        className="absolute top-6 right-6 p-2 bg-background/90 backdrop-blur-sm rounded-full text-foreground hover:bg-accent hover:text-accent-foreground transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100 z-10 shadow-sm"
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
      </button>

      <div className="flex flex-col flex-1 px-1 pb-1">
        <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">{product.category}</div>
        <Link href={`/product/${product.slug}`} className="font-bold text-base leading-snug mb-2 group-hover:text-accent transition-colors line-clamp-1">
          {product.name}
        </Link>
        <div className="mt-auto">
          <PriceLabel
            price={product.price}
            originalPrice={product.originalPrice}
            size="md"
          />
        </div>
      </div>
    </div>
  );
}
