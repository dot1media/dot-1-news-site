import { renderArchive, renderSearchResults, ArchiveStory } from '@/lib/archivePage';
import { sql } from '@/lib/db';
import { SITE_URL } from '@/lib/theme';

export const dynamic = 'force-dynamic';

// Route handler (not a React page): renderArchive returns a full HTML document.
// Reads the same shared database the app writes to, so the archive shows every
// story the app has ever published, grouped by Alaska date, with search.

function akDateParts(d: Date): { key: string; label: string } {
  return {
    key: d.toLocaleDateString('en-CA', { timeZone: 'America/Anchorage' }),
    label: d.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/Anchorage',
    }),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim().slice(0, 100);

  // Search path.
  if (q) {
    try {
      const like = `%${q}%`;
      const rows = await sql`
        SELECT id, title, summary, image, category,
               COALESCE(reviewed_at, created_at) AS ts
        FROM news_stories
        WHERE review_status = 'approved'
          AND (title ILIKE ${like} OR summary ILIKE ${like} OR category ILIKE ${like})
        ORDER BY COALESCE(reviewed_at, created_at) DESC
        LIMIT 60
      `;
      const results: ArchiveStory[] = (rows as any[]).map((r) => {
        const parts = akDateParts(new Date(r.ts));
        return { id: r.id, title: r.title, summary: r.summary, image: r.image, category: r.category, dateKey: parts.key, dateLabel: parts.label };
      });
      const html = renderSearchResults({ query: q, results, url: `${SITE_URL}/archive?q=${encodeURIComponent(q)}` });
      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    } catch (e: any) {
      console.error('archive search failed:', e?.message);
      const html = renderSearchResults({ query: q, results: [], url: `${SITE_URL}/archive` });
      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    }
  }

  // Archive landing: group published stories by Alaska date, newest first.
  try {
    const rows = await sql`
      SELECT id, title, summary, image, category,
             COALESCE(reviewed_at, created_at) AS ts
      FROM news_stories
      WHERE review_status = 'approved'
      ORDER BY COALESCE(reviewed_at, created_at) DESC
      LIMIT 400
    `;
    const byDate = new Map<string, { dateKey: string; dateLabel: string; stories: ArchiveStory[] }>();
    for (const r of rows as any[]) {
      const parts = akDateParts(new Date(r.ts));
      if (!byDate.has(parts.key)) byDate.set(parts.key, { dateKey: parts.key, dateLabel: parts.label, stories: [] });
      byDate.get(parts.key)!.stories.push({
        id: r.id, title: r.title, summary: r.summary, image: r.image, category: r.category, dateKey: parts.key, dateLabel: parts.label,
      });
    }
    const editions = Array.from(byDate.values());
    const html = renderArchive({ editions, url: `${SITE_URL}/archive` });
    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  } catch (e: any) {
    console.error('archive failed:', e?.message);
    const html = renderArchive({ editions: [], url: `${SITE_URL}/archive` });
    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  }
}
