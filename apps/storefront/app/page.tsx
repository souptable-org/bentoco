'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Truck, RefreshCcw } from 'lucide-react';
import { getProducts } from '@/lib/data';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/product/ProductCard';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  useEffect(() => {
    getProducts().then(({ products }) => {
      setFeaturedProducts(products.slice(0, 4));
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Hero Section */}
      <section className="relative h-[85vh] w-full flex items-center justify-center overflow-hidden">
        <Image 
          src="https://picsum.photos/seed/heroind1/1920/1080"
          alt="Premium Indian Fashion"
          fill
          className="object-cover"
          priority
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center text-white px-4 flex flex-col items-center max-w-4xl mx-auto">
          <span className="uppercase tracking-[0.3em] text-sm mb-6 font-bold text-white/90">Festive Edit &apos;26</span>
          <h1 className="font-serif text-5xl md:text-8xl font-bold mb-6 leading-[0.86] tracking-[-0.44px]">
            The Art of Elegance
          </h1>
          <p className="text-lg md:text-2xl text-white/90 mb-10 max-w-2xl font-medium">
            Discover our curated collection of handcrafted timeless pieces, designed for the modern connoisseur.
          </p>
          <Link 
            href="/shop"
            className="group flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-8 py-4 font-bold uppercase tracking-widest text-sm shadow-xl hover:-translate-y-1 hover:shadow-2xl hover:bg-primary/90 transition-all duration-300"
          >
            Explore Collection
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
          </Link>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-b border-border bg-card py-6 md:py-8 shadow-sm relative z-20">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-2 md:gap-8 text-center divide-x divide-border">
            <div className="flex flex-col items-center justify-center">
              <Truck className="w-6 h-6 md:w-8 md:h-8 mb-2 md:mb-3 text-accent" />
              <h3 className="font-bold text-[10px] md:text-base tracking-wide uppercase mb-1 text-card-foreground">Pan India Delivery</h3>
              <p className="text-muted-foreground text-[10px] md:text-sm font-medium hidden sm:block">Free shipping on orders above ₹2999</p>
            </div>
            <div className="flex flex-col items-center justify-center">
              <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 mb-2 md:mb-3 text-accent" />
              <h3 className="font-bold text-[10px] md:text-base tracking-wide uppercase mb-1 text-card-foreground">Secure Checkout</h3>
              <p className="text-muted-foreground text-[10px] md:text-sm font-medium hidden sm:block">UPI & Cash on Delivery Available</p>
            </div>
            <div className="flex flex-col items-center justify-center">
              <RefreshCcw className="w-6 h-6 md:w-8 md:h-8 mb-2 md:mb-3 text-accent" />
              <h3 className="font-bold text-[10px] md:text-base tracking-wide uppercase mb-1 text-card-foreground">Easy Returns</h3>
              <p className="text-muted-foreground text-[10px] md:text-sm font-medium hidden sm:block">7-day hassle-free exchange policy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-8 md:mb-12">
          <div>
            <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4 tracking-[-0.44px]">Shop by Category</h2>
            <p className="text-muted-foreground max-w-xl text-lg font-medium">Explore our curated selection of heritage crafts and modern silhouettes.</p>
          </div>
        </div>
        
        <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar">
          <Link href="/shop?category=women" className="min-w-[280px] sm:min-w-0 snap-start group relative aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-muted rounded-[6px] shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl">
            <Image src="https://picsum.photos/seed/catwomen/800/1000" alt="Women" fill className="object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-8 left-8">
              <h3 className="text-white font-serif text-3xl font-bold mb-2">Women&apos;s Wear</h3>
              <span className="text-white/90 text-sm tracking-widest font-bold uppercase flex items-center gap-2 group-hover:text-white transition-colors">
                Discover <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
              </span>
            </div>
          </Link>
          <Link href="/shop?category=men" className="min-w-[280px] sm:min-w-0 snap-start group relative aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-muted rounded-[6px] shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl">
            <Image src="https://picsum.photos/seed/catmen/800/1000" alt="Men" fill className="object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-8 left-8">
              <h3 className="text-white font-serif text-3xl font-bold mb-2">Men&apos;s Wear</h3>
              <span className="text-white/90 text-sm tracking-widest font-bold uppercase flex items-center gap-2 group-hover:text-white transition-colors">
                Discover <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
              </span>
            </div>
          </Link>
          <Link href="/shop?category=jewelry" className="min-w-[280px] sm:min-w-0 snap-start group relative aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-muted rounded-[6px] shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl">
            <Image src="https://picsum.photos/seed/catjewel/800/1000" alt="Jewelry" fill className="object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-8 left-8">
              <h3 className="text-white font-serif text-3xl font-bold mb-2">Fine Jewelry</h3>
              <span className="text-white/90 text-sm tracking-widest font-bold uppercase flex items-center gap-2 group-hover:text-white transition-colors">
                Discover <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-8 md:mb-12">
          <div>
            <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4 tracking-[-0.44px]">Curated Selection</h2>
            <p className="text-muted-foreground max-w-xl text-lg font-medium">Handpicked essentials for your sophisticated wardrobe.</p>
          </div>
          <Link href="/shop" className="hidden md:flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-accent hover:text-accent/80 transition-colors">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-x-6 sm:gap-y-12 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar">
          {featuredProducts.map(product => (
            <div key={product.id} className="min-w-[260px] sm:min-w-0 snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center md:hidden">
          <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-accent hover:text-accent/80 transition-colors">
            View All Collection <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Editorial Section */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center bg-card rounded-[24px] md:rounded-[32px] p-6 md:p-12 shadow-lg border border-border/50">
          <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden shadow-2xl">
             <Image src="https://picsum.photos/seed/heritage/1000/1200" alt="Heritage Craftsmanship" fill className="object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="max-w-lg lg:pl-12">
            <span className="text-accent text-sm tracking-widest uppercase font-bold mb-4 block">The Heritage</span>
            <h2 className="font-serif text-4xl lg:text-6xl font-bold mb-6 leading-tight tracking-[-0.44px]">Preserving Indian Craftsmanship</h2>
            <p className="text-muted-foreground leading-relaxed mb-10 text-lg font-medium">
              We work directly with artisan clusters across India to bring you authentic weaves and handcrafted pieces. Every garment tells a story of generations of skill, reimagined for the contemporary aesthetic.
            </p>
            <Link 
              href="/about"
              className="inline-block bg-primary text-primary-foreground rounded-full px-10 py-4 font-bold uppercase tracking-widest text-sm hover:bg-primary/90 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              Our Story
            </Link>
          </div>
        </div>
      </section>
      
    </div>
  );
}
