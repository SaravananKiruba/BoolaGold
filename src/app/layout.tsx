import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jewelry Store Management System',
  description: 'Production-ready jewelry store management solution',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
