import { ImageResponse } from 'next/og';
import { sql } from '@/lib/db';
import { isImageUrl } from '@/lib/media';

// Social share image, served from news.dot1.media at exactly 1200x630 (Facebook's link-card size).
// Facebook often refuses to show an image on first share unless it is a known size on a domain it
// can fetch quickly, so instead of pointing at the raw upload we re-frame it here.
export const runtime = 'nodejs';

async function imageFor(kind: string, id: string): Promise<string | null> {
  try {
    if (kind === 'v' || kind === 'video') {
      const r = await sql`SELECT thumbnail FROM videos WHERE id = ${id} LIMIT 1`;
      const t = (r[0] as any)?.thumbnail;
      return isImageUrl(t) ? t : null;
    }
    if (kind === 'p' || kind === 'photo') {
      const r = await sql`SELECT image FROM photos WHERE id = ${id} LIMIT 1`;
      return (r[0] as any)?.image || null;
    }
    const r = await sql`SELECT image FROM news_stories WHERE id = ${id} LIMIT 1`;
    return (r[0] as any)?.image || null;
  } catch {
    return null;
  }
}

export async function GET(_req: Request, { params }: { params: { kind: string; id: string } }) {
  const src = await imageFor(params.kind, params.id);
  return new ImageResponse(
    src ? (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#141210' }}>
        <img src={src} width={1200} height={630} style={{ width: 1200, height: 630, objectFit: 'cover' }} />
      </div>
    ) : (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#141210', color: '#f4f0e7', fontSize: 84, fontFamily: 'serif', letterSpacing: 6 }}>
        DOT 1 NEWS
      </div>
    ),
    { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } },
  );
}
