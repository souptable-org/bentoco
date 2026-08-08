import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import Grainient from '@/components/ui/Grainient';

export const metadata = {
  title: 'Contact Us | Aura',
  description: 'Get in touch with the Aura customer care team.',
};

export default function ContactPage() {
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 w-full flex-1 flex flex-col">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4 md:mb-6 tracking-[-0.44px] text-foreground">Get in Touch</h1>
          <p className="text-foreground/90 text-lg font-medium max-w-xl mx-auto">We are here to assist you. Reach out to our customer care team for queries about your order, shipping, or our products.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
        <div className="bg-card/90 backdrop-blur-md p-6 md:p-8 rounded-[8px] border border-border/50 text-center flex flex-col items-center shadow-sm">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-bold text-lg mb-2">Email</h3>
          <p className="text-muted-foreground mb-4">Our friendly team is here to help.</p>
          <a href="mailto:care@aura.com" className="font-bold text-primary hover:underline">care@aura.com</a>
        </div>
        <div className="bg-card/90 backdrop-blur-md p-6 md:p-8 rounded-[8px] border border-border/50 text-center flex flex-col items-center shadow-sm">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-bold text-lg mb-2">Office</h3>
          <p className="text-muted-foreground mb-4">Come say hello at our HQ.</p>
          <address className="font-bold not-italic">
            123 Heritage Lane, <br />
            Mumbai, MH 400001 IN
          </address>
        </div>
        <div className="bg-card/90 backdrop-blur-md p-6 md:p-8 rounded-[8px] border border-border/50 text-center flex flex-col items-center shadow-sm">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Phone className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-bold text-lg mb-2">Phone</h3>
          <p className="text-muted-foreground mb-4">Mon-Fri from 9am to 6pm.</p>
          <a href="tel:+919876543210" className="font-bold text-primary hover:underline">+91 98765 43210</a>
        </div>
      </div>

      <div className="max-w-2xl w-full mx-auto bg-card/90 backdrop-blur-md p-8 md:p-12 rounded-[12px] border border-border/50 shadow-md">
        <form className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="first-name" className="text-sm font-bold">First Name</label>
              <input id="first-name" type="text" className="w-full bg-background border border-transparent rounded-[6px] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent" placeholder="First name" />
            </div>
            <div className="space-y-2">
              <label htmlFor="last-name" className="text-sm font-bold">Last Name</label>
              <input id="last-name" type="text" className="w-full bg-background border border-transparent rounded-[6px] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Last name" />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-bold">Email</label>
            <input id="email" type="email" className="w-full bg-background border border-transparent rounded-[6px] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent" placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-bold">Message</label>
            <textarea id="message" rows={5} className="w-full bg-background border border-transparent rounded-[6px] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent" placeholder="How can we help?"></textarea>
          </div>
          <button type="button" className="w-full bg-primary text-primary-foreground font-bold rounded-[6px] py-4 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all">Send Message</button>
        </form>
      </div>
      </div>
    </div>
  );
}
