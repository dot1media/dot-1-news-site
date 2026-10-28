import { sql } from '@/lib/db';
import { SITE_URL } from '@/lib/theme';

// Google News sitemap: only articles from the last 48 hours, with the
// <news:news> block Google News requires. Short cache so a fresh edition
// shows up quickly. Referenced from robots.ts.
export const revalidate = 900;

type Row = { id: string; title: string; ts: string | Date | null };

function xmlEscape(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  let rows: Row[] = [];
  try {
    rows = (await sql`
      SELECT id, title, COALESCE(reviewed_at, created_at) AS ts
      FROM news_stories
      WHERE review_status = 'approved'
        AND COALESCE(reviewed_at, created_at) > now() - interval '2 days'
      ORDER BY COALESCE(reviewed_at, created_at) DESC
      LIMIT 1000`) as unknown as Row[];
  } catch (e: any) {
    console.error('news sitemap query failed:', e?.message);
  }

  const urls = rows
    .filter((r) => r?.id && r?.title)
    .map((r) => {
      const loc = `${SITE_URL}/s/n/${encodeURIComponent(r.id)}`;
      const pub = (r.ts ? new Date(r.ts) : new Date()).toISOString();
      return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>Dot 1 News</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pub}</news:publication_date>
      <news:title>${xmlEscape(r.title)}</news:title>
    </news:news>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=900, stale-while-revalidate=1800',
    },
  });
}
