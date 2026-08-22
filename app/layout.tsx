import type { Metadata, Viewport } from 'next';
import { SITE_URL } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Dot 1 News \u2014 A Declared Standpoint',
  description: 'A small, human-edited daily paper. Every story is read and approved by a person before it reaches you, and every story tells you why it ran. A veteran-owned, faith-driven newsroom in Wasilla, Alaska.',
  applicationName: 'Dot 1 News',
  appleWebApp: { capable: true, title: 'Dot 1 News' },
  openGraph: {
    siteName: 'Dot 1 News',
    type: 'website',
    url: SITE_URL,
  },
  twitter: { card: 'summary_large_image' },
  other: { 'apple-itunes-app': 'app-id=6757212352' },
};

export const viewport: Viewport = {
  themeColor: '#F8F5EF',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
