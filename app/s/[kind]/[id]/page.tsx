import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { clip, APP_STORE, SITE_URL } from '@/lib/theme';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { isImageUrl, isVideoUrl, videoMime } from '@/lib/media';

export const dynamic = 'force-dynamic';

interface ShareItem {
  kind: 'article' | 'photo' | 'video';
  title: string;
  summary?: string | null;
  image?: string | null;
  category?: string | null;
  editorNote?: string | null;
  credit?: string | null;
  videoUrl?: string | null;
}

async function getItem(kind: string, id: string): Promise<ShareItem | null> {
  try {
    if (kind === 'n' || kind === 'article') {
      const r = await sql`SELECT title, summary, image, category, editor_note FROM news_stories WHERE id = ${id} AND review_status = 'approved' LIMIT 1`;
      const x = r[0] as any;
      if (x) return { kind: 'article', title: x.title, summary: x.summary, image: x.image, category: x.category, editorNote: x.editor_note };
    } else if (kind === 'p' || kind === 'photo') {
      const r = await sql`SELECT caption, full_description, image, photographer FROM photos WHERE id = ${id} AND COALESCE(status, 'published') NOT IN ('archived', 'rejected', 'deleted') LIMIT 1`;
      const x = r[0] as any;
      if (x) return { kind: 'photo', title: x.caption || 'A photograph', summary: x.full_description, image: x.image, credit: x.photographer };
    } else if (kind === 'v' || kind === 'video') {
      const r = await sql`SELECT title, description, thumbnail, video_url FROM videos WHERE id = ${id} AND COALESCE(status, 'published') NOT IN ('archived', 'rejected', 'deleted') LIMIT 1`;
      const x = r[0] as any;
      if (x) return {
        kind: 'video', title: x.title, summary: x.description,
        image: isImageUrl(x.thumbnail) ? x.thumbnail : null,
        videoUrl: x.video_url || (isVideoUrl(x.thumbnail) ? x.thumbnail : null),
      };
    }
  } catch (e: any) {
    console.error('share page query failed:', e?.message);
  }
  return null;
}

// Per-article OG tags — this is why the article page exists as its own route:
// a link shared to iMessage or social must preview with the story's own title
// and image, not the generic site card.
export async function generateMetadata({ params }: { params: { kind: string; id: string } }): Promise<Metadata> {
  const item = await getItem(params.kind, params.id);
  if (!item) {
    return { title: 'Not found \u00b7 Dot 1 News', description: 'That story is no longer available.' };
  }
  const desc = clip(item.summary || item.editorNote || 'A story chosen by an editor, with the reason it ran.', 180);
  const url = `${SITE_URL}/s/${params.kind}/${encodeURIComponent(params.id)}`;
  const title = `${clip(item.title, 70)} \u00b7 Dot 1 News`;
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      // Plain article card on purpose: Facebook drops the preview image when a link advertises a
      // raw video file from another host (og:video), so videos share as an image card that opens
      // the page, where the player is.
      title, description: desc, url, type: 'article', siteName: 'Dot 1 News',
      images: item.image ? [{ url: item.image, alt: item.title }] : undefined,
    },
    twitter: {
      card: item.image ? 'summary_large_image' : 'summary',
      title, description: desc,
      images: item.image ? [item.image] : undefined,
    },
  };
}

const CSS = `.piece{max-width:760px;margin:0 auto;padding:44px 0 20px;}
.piece .kicker{margin-bottom:14px;}
.piece h1{margin:0 0 18px;font-size:44px;line-height:1.1;letter-spacing:-.7px;color:#1B1917;}
.piece .credit{margin:0 0 20px;font-size:13px;font-style:italic;color:#767065;}
.piece .hero{margin:26px 0 30px;background:#E6DED1;}
.piece .hero img{width:100%;max-height:520px;object-fit:cover;}
.piece .player{margin:26px 0 30px;background:#14120F;}
.piece .player video{width:100%;aspect-ratio:16/9;display:block;background:#14120F;}
.piece .sum{margin:0 0 24px;font-size:19px;line-height:1.75;color:#33302B;}
.piece .why{margin:28px 0 30px;}
.piece .why .t{font-size:15.5px;}
.mark{display:flex;align-items:center;gap:9px;padding:18px 0 0;border-top:1px solid #E6DED1;font-size:13px;color:#8A6A17;font-weight:bold;}
.dot{width:9px;height:9px;border-radius:50%;background:#D4AF37;display:inline-block;}
.callout{max-width:760px;margin:36px auto 0;border:1px solid #D8CFC0;background:#EFEAE0;padding:34px 36px;text-align:center;}
.callout h3{margin:0 0 10px;font-size:25px;line-height:1.25;color:#1B1917;letter-spacing:-.3px;}
.callout p{margin:0 auto 22px;font-size:15.5px;line-height:1.7;color:#33302B;max-width:520px;}
.callout .btn{display:inline-block;background:#B81616;color:#fff;font-size:15.5px;font-weight:bold;padding:16px 30px;border-radius:8px;}
.callout .fine{margin:14px 0 0;font-size:12.5px;color:#767065;}
.backline{max-width:760px;margin:34px auto 0;padding-top:20px;border-top:1px solid #E6DED1;font-size:13px;color:#B81616;font-weight:bold;}
@media(max-width:640px){.piece{padding:28px 0 12px;}.piece h1{font-size:29px;}.piece .sum{font-size:17px;}.callout{padding:26px 20px;}.callout h3{font-size:21px;}}`;

export default async function SharePage({ params }: { params: { kind: string; id: string } }) {
  const item = await getItem(params.kind, params.id);

  if (!item) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <Header />
        <main className="shell">
          <article className="piece">
            <div className="kicker">Not Found</div>
            <h1>That story is no longer available.</h1>
            <p className="sum">It may have been removed, or the link may be incomplete. Today&rsquo;s edition is still here, and so is the app.</p>
          </article>
          <section className="callout">
            <h3>Read today&rsquo;s edition.</h3>
            <p>A few stories, chosen by a person, each with the reason it ran.</p>
            <a className="btn" href="/">Open today&rsquo;s edition &rsaquo;</a>
            <p className="fine">Or <a href={APP_STORE} style={{ color: '#B81616', fontWeight: 'bold' }}>get the app</a>.</p>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const label = item.kind === 'photo' ? 'The Lens'
    : item.kind === 'video' ? 'The Reel'
    : (item.category || 'Dot 1 News');
  const cta = item.kind === 'photo' ? 'See the full frame in the app'
    : item.kind === 'video' ? 'Keep watching in the app'
    : 'Read it in the app';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Header />
      <main className="shell">
        <article className="piece">
          <div className="kicker">{label}</div>
          <h1>{item.title}</h1>
          {item.credit && <p className="credit">Photograph &middot; {item.credit}</p>}
          {item.kind === 'video' && item.videoUrl ? (
            <div className="player">
              <video controls playsInline preload="metadata" poster={item.image || undefined}>
                <source src={item.videoUrl} type={videoMime(item.videoUrl) === 'video/quicktime' ? 'video/mp4' : videoMime(item.videoUrl)} />
                Your browser cannot play this video here. It is also in the Dot 1 News app.
              </video>
            </div>
          ) : item.image ? <div className="hero"><img src={item.image} alt="" /></div> : null}
          {item.summary && <p className="sum">{item.summary}</p>}
          {item.editorNote && (
            <div className="why">
              <div className="h">Why We Ran This</div>
              <div className="t">{item.editorNote}</div>
            </div>
          )}
          <div className="mark"><span className="dot" /> Approved by an editor</div>
        </article>
        <section className="callout">
          <h3>{cta}.</h3>
          <p>The full story lives in Dot 1 News, alongside the rest of today&rsquo;s edition. A few stories, chosen by a person, each with the reason it ran, and then it ends.</p>
          <a className="btn" href={APP_STORE}>Get Dot 1 News free &rsaquo;</a>
          <p className="fine">Free on the App Store.</p>
        </section>
        <div className="backline"><a href="/">&lsaquo; Today&rsquo;s edition</a></div>
      </main>
      <Footer />
    </>
  );
}
