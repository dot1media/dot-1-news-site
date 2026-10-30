import Script from 'next/script';

// Google Analytics 4. Renders only when NEXT_PUBLIC_GA_ID is set (e.g.
// G-XXXXXXXXXX), so the site is safe to run without it and the tag turns on the
// moment the measurement ID is added to the environment. GA4 is what the Reader
// Revenue Manager reads reader-survey and subscription events from.
export default function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  if (!id) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
