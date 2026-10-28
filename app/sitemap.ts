import type { MetadataRoute } from 'next';
import { sql } from '@/lib/db';
import { SITE_URL } from '@/lib/theme';

// Dynamic sitemap: the static hubs plus every published article, photo, and
// video, read live from the shared database. Cached for 30 minutes so crawlers
// get a fresh list without hammering the DB. If the DB is unreachable at build
// time it degrades to the static hubs rather than failing the route.
export const revalidate = 1800;

type Row = { id: string; ts: string | Date | null };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const hubs: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/archive`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/score`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/standards`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/corrections`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const items: MetadataRoute.Sitemap = [];
  try {
    const [articles, photos, videos] = await Promise.all([
      sql`SELECT id, COALESCE(reviewed_at, created_at) AS ts FROM news_stories WHERE review_status = 'approved' ORDER BY COALESCE(reviewed_at, created_at) DESC LIMIT 10000` as unknown as Promise<Row[]>,
      sql`SELECT id, created_at AS ts FROM photos WHERE COALESCE(status, 'published') NOT IN ('archived', 'rejected', 'deleted') ORDER BY created_at DESC LIMIT 5000` as unknown as Promise<Row[]>,
      sql`SELECT id, created_at AS ts FROM videos WHERE COALESCE(status, 'published') NOT IN ('archived', 'rejected', 'deleted') ORDER BY created_at DESC LIMIT 5000` as unknown as Promise<Row[]>,
    ]);
    const add = (rows: Row[], kind: 'n' | 'p' | 'v', priority: number) => {
      for (const r of rows) {
        if (!r?.id) continue;
        items.push({
          url: `${SITE_URL}/s/${kind}/${encodeURIComponent(r.id)}`,
          lastModified: r.ts ? new Date(r.ts) : now,
          changeFrequency: 'weekly',
          priority,
        });
      }
    };
    add(articles, 'n', 0.8);
    add(photos, 'p', 0.6);
    add(videos, 'v', 0.6);
  } catch (e: any) {
    console.error('sitemap query failed:', e?.message);
  }

  return [...hubs, ...items];
}
