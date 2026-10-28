import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
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
      <body>
        {children}

        {/* Google Reader Revenue Manager (Subscribe with Google) — reader
            sign-up survey. Site-wide; the library queues on self.SWG_BASIC so
            load order with the init below does not matter. */}
        <Script
          id="swg-basic-lib"
          src="https://news.google.com/swg/js/v1/swg-basic.js"
          strategy="afterInteractive"
          type="application/javascript"
          async
        />
        <Script id="swg-basic-init" strategy="afterInteractive">
          {`(self.SWG_BASIC = self.SWG_BASIC || []).push( basicSubscriptions => {
  basicSubscriptions.init({
    type: "NewsArticle",
    isPartOfType: ["Product"],
    isPartOfProductId: "CAowqpTiCw:openaccess",
    clientOptions: { theme: "light", lang: "en" },
  });
});`}
        </Script>
      </body>
    </html>
  );
}
