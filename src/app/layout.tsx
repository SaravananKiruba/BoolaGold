import type { Metadata } from 'next';
import { ChakraProvider } from '@/components/providers/ChakraProvider';
import { ShopProvider } from '@/components/providers/ShopProvider';
import Navigation from '@/components/ui/Navigation';
import './globals.css';

export const metadata: Metadata = {
  title: 'BoolaGold - Jewelry Store Management System',
  description: 'Production-ready jewelry store management solution with automated pricing, inventory tracking, and compliance management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ChakraProvider>
          <ShopProvider>
            <Navigation />
            {children}
          </ShopProvider>
        </ChakraProvider>
      </body>
    </html>
  );
}
