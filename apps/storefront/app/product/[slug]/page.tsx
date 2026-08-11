'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, notFound, useRouter } from 'next/navigation';
import { getProductBySlug, getRelatedProducts } from '@/lib/data';
import type { Product } from '@/lib/types';
import { useApp } from '@/lib/store';
import { ProductCard } from '@/components/product/ProductCard';
import { PriceLabel } from '@/components/product/PriceLabel';
import { withGstInclusive } from '@/lib/pricing';
import { Check, Truck, ShieldCheck, MapPin, Star, Plus, Minus, Heart, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';

import { TenantChrome } from '@/components/tenant-chrome';

export default function ProductPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';
  const router = useRouter();
  const { addToCart, toggleWishlist, isInWishlist } = useApp();
  
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [pincode, setPincode] = useState('');
  const [pinStatus, setPinStatus] = useState<'idle'|'checking'|'success'|'error'>('idle');

  useEffect(() => {
    let cancelled = false;
    setProduct(undefined);
    getProductBySlug(slug)
      .then(async (p) => {
        if (cancelled) return;
        setProduct(p ?? null);
        if (p) {
          try {
            const related = await getRelatedProducts(p.id);
            if (!cancelled) setRelatedProducts(related);
          } catch {
            if (!cancelled) setRelatedProducts([]);
          }
        }
      })
      .catch((e) => {
        console.warn("[product page] load failed", e);
        if (!cancelled) setProduct(null);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (product === undefined) {
    return (
      <TenantChrome tenant={{ store_name: "Storefront" }}>
        <div className="w-full max-w-7xl mx-auto px-4 py-24 text-center text-muted-foreground">
          Loading product…
        </div>
      </TenantChrome>
    );
  }
  if (!product) return notFound();

  const isWishlisted = isInWishlist(product.id);

  const inclusive = withGstInclusive(product.price);
  const inclusiveOriginal =
    product.originalPrice != null
      ? withGstInclusive(product.originalPrice)
      : undefined;

  const handleAddToCart = async () => {
    if (product.sizes?.length && !selectedSize) return alert('Please select a size');
    if (product.colors?.length && !selectedColor) return alert('Please select a color');
    try {
      await addToCart(product, quantity, selectedSize || undefined, selectedColor || undefined);
    } catch (e: any) {
      alert(e?.message || 'Could not add to cart');
    }
  };

  const handleBuyNow = async () => {
    if (product.sizes?.length && !selectedSize) return alert('Please select a size');
    if (product.colors?.length && !selectedColor) return alert('Please select a color');
    try {
      await addToCart(product, quantity, selectedSize || undefined, selectedColor || undefined);
      router.push('/checkout');
    } catch (e: any) {
      alert(e?.message || 'Could not add to cart');
    }
  };

  const checkPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length !== 6) return;
    setPinStatus('checking');
    setTimeout(() => {
      setPinStatus(Math.random() > 0.2 ? 'success' : 'error');
    }, 1000);
  };

  // Theme editor fonts: Display → headings, Text → body copy
  const fontDisplay = {
    fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif",
  } as const
  const fontText = {
    fontFamily: "var(--font-text), var(--font-sans), system-ui, sans-serif",
  } as const

  return (
    <TenantChrome tenant={{ store_name: product.name || "Storefront" }}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12" style={fontText}>
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          <span>/</span>
          <Link href="/shop" className="hover:text-foreground transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-foreground line-clamp-1">{product.name}</span>
        </div>
        <Link href="/shop" className="hidden sm:inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Shop
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 mb-24">
        
        {/* Gallery */}
        <div className="w-full lg:w-1/2 flex flex-col-reverse md:flex-row gap-4 lg:sticky lg:top-24 h-max">
          <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto hide-scrollbar w-full md:w-24 shrink-0">
            {product.images.map((img, idx) => (
              <button 
                key={idx} 
                onClick={() => setActiveImage(idx)}
                className={`relative aspect-[3/4] w-20 md:w-full shrink-0 rounded-[6px] overflow-hidden border-2 transition-colors ${activeImage === idx ? 'border-accent' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <Image src={img} alt={`${product.name} ${idx + 1}`} fill className="object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
          <div className="relative aspect-[3/4] w-full bg-muted rounded-[8px] overflow-hidden">
            <Image src={product.images[activeImage]} alt={product.name} fill className="object-cover" referrerPolicy="no-referrer" priority />
            <button 
              onClick={() => toggleWishlist(product.id)}
              className="absolute top-4 right-4 p-3 bg-background/90 backdrop-blur-sm rounded-full text-foreground hover:bg-accent hover:text-accent-foreground transition-colors z-10"
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <div
            className="mb-2 text-sm text-accent font-bold tracking-wider uppercase"
            style={fontText}
          >
            {product.category}
          </div>
          <h1
            className="text-3xl md:text-5xl font-bold mb-4 text-balance"
            style={fontDisplay}
          >
            {product.name}
          </h1>
          
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <PriceLabel
              price={product.price}
              originalPrice={product.originalPrice}
              size="lg"
            />
            {inclusiveOriginal != null && inclusiveOriginal > inclusive && (
              <span className="bg-destructive/20 text-destructive text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {Math.round(((inclusiveOriginal - inclusive) / inclusiveOriginal) * 100)}% OFF
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-8 text-sm">
            <div className="flex text-accent">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`} />
              ))}
            </div>
            <span className="font-bold">{product.rating}</span>
            <span className="text-muted-foreground">({product.reviews} reviews)</span>
          </div>

          <p
            className="text-muted-foreground leading-relaxed mb-8 text-lg"
            style={fontText}
          >
            {product.description}
          </p>

          {/* Variants */}
          {product.colors && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-sm tracking-wide uppercase">Color: {selectedColor || 'Select'}</span>
              </div>
              <div className="flex gap-3">
                {product.colors.map(color => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === color.name ? 'border-accent scale-110 shadow-md' : 'border-transparent hover:scale-105 shadow-sm'}`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}

          {product.sizes && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-sm tracking-wide uppercase">Size</span>
                <button className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-14 h-12 flex items-center justify-center rounded-md border-2 text-sm font-bold transition-all ${selectedSize === size ? 'border-accent bg-accent text-accent-foreground' : 'border-border hover:border-accent/50'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center bg-card rounded-md overflow-hidden">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-4 hover:bg-muted transition-colors"><Minus className="w-4 h-4" /></button>
              <span className="w-8 text-center font-bold">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-4 hover:bg-muted transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
            <button 
              onClick={handleAddToCart}
              className="flex-1 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-sm rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              Add to Bag
            </button>
          </div>
          <button 
            onClick={handleBuyNow}
            className="w-full bg-accent text-accent-foreground py-4 mb-10 font-bold uppercase tracking-widest text-sm rounded-md hover:bg-accent/90 transition-colors flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            Buy Now
          </button>

          {/* Trust/Offers */}
          <div className="grid grid-cols-2 gap-4 mb-10 p-4 bg-card rounded-md border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm">
                <Check className="w-4 h-4 text-accent" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wide text-card-foreground">UPI Available</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm">
                <Truck className="w-4 h-4 text-accent" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wide text-card-foreground">Cash on Delivery</span>
            </div>
          </div>

          {/* Pincode Checker */}
          <div className="mb-10 bg-card rounded-md p-6 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-accent" />
              <h3 className="font-bold">Check Delivery Availability</h3>
            </div>
            <form onSubmit={checkPincode} className="flex gap-2">
              <input 
                type="text" 
                maxLength={6}
                placeholder="Enter 6-digit Pincode" 
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                className="flex-1 bg-background rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent border border-transparent"
              />
              <button type="submit" disabled={pincode.length !== 6 || pinStatus === 'checking'} className="bg-primary text-primary-foreground rounded-md px-6 text-sm font-bold uppercase tracking-wide disabled:opacity-50 hover:bg-primary/90 transition-colors">
                {pinStatus === 'checking' ? 'Checking...' : 'Check'}
              </button>
            </form>
            {pinStatus === 'success' && (
              <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-accent font-medium text-sm mt-3 flex items-center gap-2">
                <Check className="w-4 h-4" /> Delivery available within 3-5 business days.
              </motion.p>
            )}
            {pinStatus === 'error' && (
              <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-destructive font-medium text-sm mt-3">
                Sorry, delivery is not available to this pincode.
              </motion.p>
            )}
          </div>

          {/* Details Accordion (Mocked static for brevity) */}
          <div className="bg-card rounded-md p-6 border border-border/50">
            <h3 className="text-xl font-bold mb-6" style={fontDisplay}>
              Product Details
            </h3>
            <ul className="space-y-4 mb-8">
              {product.features.map((f, i) => (
                <li key={i} className="flex gap-3 text-muted-foreground text-sm font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-2 gap-y-4 text-sm bg-background p-4 rounded-md">
              {Object.entries(product.details).map(([k, v]) => (
                <React.Fragment key={k}>
                  <div className="text-muted-foreground font-bold">{k}</div>
                  <div className="text-foreground font-medium">{v}</div>
                </React.Fragment>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-12 border-t border-border">
          <h2
            className="text-3xl font-semibold mb-10 text-center"
            style={fontDisplay}
          >
            You May Also Like
          </h2>
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar">
            {relatedProducts.map(p => (
              <div key={p.id} className="min-w-[260px] sm:min-w-0 snap-start">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
    </TenantChrome>
  );
}
