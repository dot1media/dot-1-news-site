import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/theme';

// Let search and news crawlers read everything public, point them at both the
// full sitemap and the Google News sitemap, and keep them out of the OG-image
// and redirect-only endpoints that are not pages.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/og/', '/read', '/v/'],
      },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/news-sitemap.xml`],
    host: SITE_URL,
  };
}
