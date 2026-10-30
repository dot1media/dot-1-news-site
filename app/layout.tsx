import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Bodoni_Moda, Fraunces, IBM_Plex_Mono } from 'next/font/google';
import { SITE_URL } from '@/lib/theme';
import Analytics from './components/Analytics';
import './globals.css';

// Brand faces: Bodoni Moda for the nameplate and headlines, Fraunces for
// reading, IBM Plex Mono for the tracked labels. Loaded via next/font so they
// are self-hosted, preloaded, and shift-free, and exposed as CSS variables that
// globals.css drives everything from.
const display = Bodoni_Moda({ subsets: ['latin'], display: 'swap', variable: '--font-display' });
const body = Fraunces({ subsets: ['latin'], style: ['normal', 'italic'], display: 'swap', variable: '--font-body' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], display: 'swap', variable: '--font-mono' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Dot 1 News \u2014 A Declared Standpoint',
  description: 'A daily edition of Alaska and national news: a few stories, each with the reason it ran, scored across four measures. A veteran-owned, faith-driven newsroom in Wasilla, Alaska.',
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
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        {/* Apply the saved theme before paint so there is no flash of the wrong mode. */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('d1-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();` }} />
        {children}

        {/* Google Analytics 4 — active once NEXT_PUBLIC_GA_ID is set. */}
        <Analytics />

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
