'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import Grainient from '@/components/ui/Grainient';

const faqs = [
  {
    category: "Shipping & Returns",
    questions: [
      {
        q: "What is your return policy?",
        a: "We offer a 7-day hassle-free exchange policy. If you are not satisfied with your purchase, you can return it within 7 days of delivery. Please ensure the items are unused, with all tags intact."
      },
      {
        q: "How long does shipping take?",
        a: "Pan-India delivery typically takes 3-5 business days. Express shipping options are available at checkout for metropolitan areas."
      },
      {
        q: "Do you ship internationally?",
        a: "Currently, we only ship within India. We are working on expanding our reach globally soon!"
      }
    ]
  },
  {
    category: "Orders & Tracking",
    questions: [
      {
        q: "How can I track my order?",
        a: "Once your order is shipped, you will receive a tracking link via email and SMS. You can also track your order by logging into your Aura account."
      },
      {
        q: "Can I modify my order after placing it?",
        a: "Orders can only be modified within 2 hours of placement. Please contact our customer care team immediately if you need to make changes."
      }
    ]
  },
  {
    category: "Product & Care",
    questions: [
      {
        q: "How do I care for my Aura garments?",
        a: "We recommend dry cleaning for all our heritage and festive wear. For casual wear, gentle hand wash in cold water is advised. Always check the care label inside the garment."
      }
    ]
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

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

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 w-full flex-1 flex flex-col">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4 md:mb-6 tracking-[-0.44px] text-foreground">Frequently Asked Questions</h1>
          <p className="text-foreground/90 text-lg font-medium">Find answers to common queries about shipping, returns, and more.</p>
        </div>

        <div className="space-y-12">
        {faqs.map((section, sIdx) => (
          <div key={sIdx}>
            <h2 className="font-serif text-2xl font-bold mb-6 text-foreground drop-shadow-sm">{section.category}</h2>
            <div className="space-y-4">
              {section.questions.map((faq, qIdx) => {
                const id = `${sIdx}-${qIdx}`;
                const isOpen = openIndex === id;
                return (
                  <div key={qIdx} className="border border-border/50 rounded-[8px] bg-card/90 backdrop-blur-md overflow-hidden shadow-md transition-all duration-200 hover:shadow-lg">
                    <button 
                      onClick={() => toggle(id)}
                      className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none focus:bg-muted/50"
                    >
                      <span className="font-bold text-base pr-8">{faq.q}</span>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className={`w-5 h-5 text-primary shrink-0 transition-colors ${isOpen ? 'text-primary' : 'text-muted-foreground'}`} />
                      </motion.div>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div 
                          key="content"
                          initial="collapsed"
                          animate="open"
                          exit="collapsed"
                          variants={{
                            open: { opacity: 1, height: "auto" },
                            collapsed: { opacity: 0, height: 0 }
                          }}
                          transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                          className="bg-background/50"
                        >
                          <div className="px-6 pb-6 pt-2 text-muted-foreground font-medium">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}
