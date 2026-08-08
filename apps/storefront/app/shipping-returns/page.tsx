import React from 'react';
import Grainient from '@/components/ui/Grainient';

export const metadata = {
  title: 'Shipping & Returns | Aura',
};

export default function ShippingReturnsPage() {
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

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 w-full flex-1 flex flex-col">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4 md:mb-6 tracking-[-0.44px] text-foreground">Shipping & Returns</h1>
        </div>

        <div className="space-y-8 bg-card/90 backdrop-blur-md p-6 md:p-12 rounded-[12px] border border-border/50 shadow-md">
        <section>
          <h2 className="font-serif text-2xl font-bold mb-4 text-primary">Shipping Policy</h2>
          <p className="text-muted-foreground leading-relaxed font-medium">
            We are pleased to offer free standard shipping on all orders above ₹2999 across India. 
            For orders below this amount, a flat shipping rate applies.
          </p>
          <ul className="list-disc pl-5 mt-4 space-y-2 text-muted-foreground font-medium">
            <li><strong className="text-foreground">Standard Delivery:</strong> 3-5 business days.</li>
            <li><strong className="text-foreground">Express Delivery:</strong> 1-2 business days (available in select metropolitan areas).</li>
            <li>All orders are dispatched within 24 hours of successful payment processing.</li>
          </ul>
        </section>

        <hr className="border-border/60" />

        <section>
          <h2 className="font-serif text-2xl font-bold mb-4 text-primary">Returns & Exchanges</h2>
          <p className="text-muted-foreground leading-relaxed font-medium">
            Your satisfaction is our priority. If you are not completely satisfied with your purchase, 
            you can return or exchange the item within 7 days of delivery.
          </p>
          <ul className="list-disc pl-5 mt-4 space-y-2 text-muted-foreground font-medium">
            <li>Items must be unworn, unwashed, and in their original condition with all tags attached.</li>
            <li>To initiate a return, please visit our Returns Center or contact customer support.</li>
            <li>Refunds will be processed to the original method of payment within 5-7 business days after we receive the returned item.</li>
          </ul>
        </section>
      </div>
    </div>
    </div>
  );
}
