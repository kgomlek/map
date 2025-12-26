/**
 * Layout principal Next.js avec configuration PWA
 */

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/presentation/components/theme/theme-provider';

export const metadata: Metadata = {
  title: 'EV Router - Elektrikli Araç Rota Planlayıcı',
  description: 'Elektrikli aracınız için şarj istasyonlarını bulun',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EV Router',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="light">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased">
        <ThemeProvider defaultTheme="light" storageKey="ev-router-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

