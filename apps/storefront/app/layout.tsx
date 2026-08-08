import type {Metadata} from 'next';
import { Bricolage_Grotesque, Nunito_Sans } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/lib/store';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { ThemeProvider } from '@/components/theme-provider';

const displayFont = Bricolage_Grotesque({ 
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const bodyFont = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aura | Premium Indian Ecommerce',
  description: 'Curating premium Indian aesthetics for the modern connoisseur.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AppProvider>
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <CartDrawer />
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

