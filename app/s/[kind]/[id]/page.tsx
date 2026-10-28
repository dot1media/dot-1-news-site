import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { clip, APP_STORE, SITE_URL } from '@/lib/theme';
import { scoreFromRow, breakdownFromRow, StoryScore, IndexBreakdown } from '@/lib/scoreRow';
import { newsArticleGraph, photoGraph, videoGraph } from '@/lib/seo';
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
  creditUrl?: string | null;
  videoUrl?: string | null;
  verificationStatus?: string | null;
  content?: string | null;
  score?: StoryScore | null;
  scoreBreakdown?: IndexBreakdown[] | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
}

async function getItem(kind: string, id: string): Promise<ShareItem | null> {
  try {
    if (kind === 'n' || kind === 'article') {
      // verification_status and the 20 D1-4LS indicator columns are set by the
      // editorial platform; queried defensively so a not-yet-migrated column never
      // breaks the page. Missing verification reads as verified; missing indicators
      // read as unscored and the badge simply does not render.
      let x: any;
      try {
        const r = await sql`SELECT title, summary, content, image, category, editor_note, score_confidence,
               bai_scriptural_consistency, bai_doctrinal_integrity, bai_moral_framework, bai_anthropology, bai_teleology,
               psi_textual_linkage, psi_eschatological_fit, psi_historical_continuity, psi_spiritual_impact, psi_theological_restraint,
               sci_primary_source_access, sci_verification, sci_transparency, sci_track_record, sci_editorial_standards,
               hii_human_dignity, hii_compassion_empathy, hii_societal_impact, hii_justice_responsibility, hii_christ_modeled_care,
               COALESCE(verification_status, 'verified') AS verification_status, reviewed_at, created_at
          FROM news_stories WHERE id = ${id} AND review_status = 'approved' LIMIT 1`;
        x = r[0];
      } catch {
        try {
          const r = await sql`SELECT title, summary, content, image, category, editor_note, score_confidence,
                 bai_scriptural_consistency, bai_doctrinal_integrity, bai_moral_framework, bai_anthropology, bai_teleology,
                 psi_textual_linkage, psi_eschatological_fit, psi_historical_continuity, psi_spiritual_impact, psi_theological_restraint,
                 sci_primary_source_access, sci_verification, sci_transparency, sci_track_record, sci_editorial_standards,
                 hii_human_dignity, hii_compassion_empathy, hii_societal_impact, hii_justice_responsibility, hii_christ_modeled_care, reviewed_at, created_at
            FROM news_stories WHERE id = ${id} AND review_status = 'approved' LIMIT 1`;
          x = r[0];
        } catch {
          const r = await sql`SELECT title, summary, content, image, category, editor_note, reviewed_at, created_at FROM news_stories WHERE id = ${id} AND review_status = 'approved' LIMIT 1`;
          x = r[0];
        }
      }
      if (x) return { kind: 'article', title: x.title, summary: x.summary, content: x.content, image: x.image, category: x.category, editorNote: x.editor_note, verificationStatus: x.verification_status || 'verified', score: scoreFromRow(x), scoreBreakdown: breakdownFromRow(x), publishedAt: x.reviewed_at || x.created_at, updatedAt: x.reviewed_at || x.created_at };
    } else if (kind === 'p' || kind === 'photo') {
      // credit_url is added by the editorial app on first sourced publish; query defensively.
      let x: any;
      try {
        const r = await sql`SELECT caption, full_description, image, photographer, credit_url, created_at FROM photos WHERE id = ${id} AND COALESCE(status, 'published') NOT IN ('archived', 'rejected', 'deleted') LIMIT 1`;
        x = r[0];
      } catch {
        const r = await sql`SELECT caption, full_description, image, photographer, created_at FROM photos WHERE id = ${id} AND COALESCE(status, 'published') NOT IN ('archived', 'rejected', 'deleted') LIMIT 1`;
        x = r[0];
      }
      if (x) return { kind: 'photo', title: x.caption || 'A photograph', summary: x.full_description, image: x.image, credit: x.photographer, creditUrl: x.credit_url || null, publishedAt: x.created_at };
    } else if (kind === 'v' || kind === 'video') {
      let x: any;
      try {
        const r = await sql`SELECT title, description, thumbnail, video_url, producer, credit_url, created_at FROM videos WHERE id = ${id} AND COALESCE(status, 'published') NOT IN ('archived', 'rejected', 'deleted') LIMIT 1`;
        x = r[0];
      } catch {
        const r = await sql`SELECT title, description, thumbnail, video_url, created_at FROM videos WHERE id = ${id} AND COALESCE(status, 'published') NOT IN ('archived', 'rejected', 'deleted') LIMIT 1`;
        x = r[0];
      }
      if (x) return {
        kind: 'video', title: x.title, summary: x.description,
        image: isImageUrl(x.thumbnail) ? x.thumbnail : null,
        videoUrl: x.video_url || (isVideoUrl(x.thumbnail) ? x.thumbnail : null),
        credit: x.producer || null, creditUrl: x.credit_url || null, publishedAt: x.created_at,
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
      images: item.image ? [{ url: `${SITE_URL}/og/${params.kind}/${encodeURIComponent(params.id)}`, width: 1200, height: 630, type: 'image/png', alt: item.title }] : undefined,
    },
    twitter: {
      card: item.image ? 'summary_large_image' : 'summary',
      title, description: desc,
      images: item.image ? [`${SITE_URL}/og/${params.kind}/${encodeURIComponent(params.id)}`] : undefined,
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
.piece .sum{margin:0 0 24px;font-size:20px;line-height:1.7;color:#33302B;font-weight:500;}
.piece .body p{margin:0 0 20px;font-size:18px;line-height:1.8;color:#2A2721;}
.piece .body p:first-child{margin-top:4px;}
.piece .why{margin:28px 0 30px;}
.piece .why .t{font-size:15.5px;}
.mark{display:flex;align-items:center;gap:9px;padding:18px 0 0;border-top:1px solid #E6DED1;font-size:13px;color:#8A6A17;font-weight:bold;}
.dot{width:9px;height:9px;border-radius:50%;background:#D4AF37;display:inline-block;}
.callout{max-width:760px;margin:36px auto 0;border:1px solid #D8CFC0;background:#EFEAE0;padding:34px 36px;text-align:center;}
.callout h3{margin:0 0 10px;font-size:25px;line-height:1.25;color:#1B1917;letter-spacing:-.3px;}
.callout p{margin:0 auto 22px;font-size:15.5px;line-height:1.7;color:#33302B;max-width:520px;}
.callout .btn{display:inline-block;background:#B81616;color:#fff;font-size:15.5px;font-weight:bold;padding:16px 30px;border-radius:8px;}
.callout .fine{margin:14px 0 0;font-size:12.5px;color:#767065;}
.scorecard{margin:20px 0 4px;}
.scorecard>summary{list-style:none;cursor:pointer;margin:0 !important;}
.scorecard>summary::-webkit-details-marker{display:none;}
.scorecard>summary{outline:none;}
.scorecard>summary:focus-visible{box-shadow:0 0 0 2px #B81616;}
.scorecard .ls-toggle{align-self:center;white-space:nowrap;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:bold;color:#B81616;display:inline-flex;align-items:center;gap:5px;}
.scorecard .ls-toggle:after{content:'\\203A';font-size:15px;transition:transform .2s ease;display:inline-block;}
.scorecard[open] .ls-toggle:after{transform:rotate(90deg);}
.scorebreak{border:1px solid #E0D7C8;border-top:none;background:#FBF8F2;padding:6px 20px 18px;}
.sb-idx{padding:16px 0 4px;border-top:1px solid #EDE6D8;}
.sb-idx:first-child{border-top:none;}
.sb-head{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
.sb-tag{font-size:11px;font-weight:bold;letter-spacing:1px;color:#fff;padding:3px 8px;border-radius:4px;}
.sb-name{font-size:15px;font-weight:bold;color:#1B1917;flex:1;min-width:0;}
.sb-total{font-variant-numeric:tabular-nums;font-size:13px;color:#33302B;white-space:nowrap;}
.sb-inds{display:flex;flex-direction:column;gap:7px;}
.sb-ind{display:flex;align-items:center;justify-content:space-between;gap:14px;font-size:14px;color:#33302B;}
.sb-lab{min-width:0;}
.sb-pips{display:inline-flex;align-items:center;gap:4px;flex-shrink:0;}
.sb-pip{width:9px;height:9px;border-radius:50%;background:#E0D7C8;display:inline-block;}
.sb-val{font-variant-numeric:tabular-nums;font-size:12.5px;color:#767065;margin-left:5px;min-width:9px;text-align:right;}
.sb-note{margin:16px 0 0;font-size:12.5px;line-height:1.6;color:#767065;font-style:italic;}
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
  const cta = 'Carry the edition with you';

  const seo = { id: params.id, title: item.title, summary: item.summary, image: item.image, category: item.category, publishedAt: item.publishedAt, updatedAt: item.updatedAt };
  const graph = item.kind === 'photo' ? photoGraph(seo)
    : item.kind === 'video' ? videoGraph({ ...seo, videoUrl: item.videoUrl })
    : newsArticleGraph(seo);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Header />
      <main className="shell">
        <article className="piece">
          <div className="kicker">{label}</div>
          <h1>{item.title}</h1>
          {item.credit && (
            <p className="credit">
              {item.kind === 'video' ? 'Produced by' : 'Photograph'} &middot;{' '}
              {item.creditUrl ? <a href={item.creditUrl} target="_blank" rel="noreferrer noopener" style={{ color: 'inherit', textDecoration: 'underline' }}>{item.credit}</a> : item.credit}
            </p>
          )}
          {item.kind === 'video' && item.videoUrl ? (
            <div className="player">
              <video controls playsInline preload="metadata" poster={item.image || undefined}>
                <source src={item.videoUrl} type={videoMime(item.videoUrl) === 'video/quicktime' ? 'video/mp4' : videoMime(item.videoUrl)} />
                Your browser cannot play this video here. It is also in the Dot 1 News app.
              </video>
            </div>
          ) : item.image ? <div className="hero"><img src={item.image} alt="" /></div> : null}
          {item.summary && <p className="sum">{item.summary}</p>}
          {item.kind === 'article' && item.content && (
            <div className="body">
              {item.content.split(/\n{2,}/).map((para, i) => {
                const t = para.trim();
                return t ? <p key={i}>{t}</p> : null;
              })}
            </div>
          )}
          {item.editorNote && (
            <div className="why">
              <div className="h">Why We Ran This</div>
              <div className="t">{item.editorNote}</div>
            </div>
          )}
          {item.kind === 'article' && item.score?.hasScore && (
            <details className="scorecard">
              <summary className="leadscore">
                <div className="ls-num">{item.score.composite.toFixed(1)}<span>/10</span></div>
                <div className="ls-detail">
                  <div className="ls-label">D1&#8209;4LS Score{item.score.confidence ? ` · ${item.score.confidence}` : ''}</div>
                  <div className="ls-bars">
                    <span title="Biblical Alignment">BAI {item.score.bai}</span>
                    <span title="Prophetic Significance">PSI {item.score.psi}</span>
                    <span title="Source Credibility">SCI {item.score.sci}</span>
                    <span title="Humanities Impact">HII {item.score.hii}</span>
                  </div>
                </div>
                <span className="ls-toggle" aria-hidden="true">Why this score</span>
              </summary>
              {item.scoreBreakdown && (
                <div className="scorebreak">
                  {item.scoreBreakdown.map((idx) => (
                    <div className="sb-idx" key={idx.key}>
                      <div className="sb-head">
                        <span className="sb-tag" style={{ background: idx.color }}>{idx.key}</span>
                        <span className="sb-name">{idx.name}</span>
                        <b className="sb-total">{idx.total} / 10</b>
                      </div>
                      <div className="sb-inds">
                        {idx.indicators.map((ind) => (
                          <div className="sb-ind" key={ind.label}>
                            <span className="sb-lab">{ind.label}</span>
                            <span className="sb-pips" aria-label={`${ind.value} of 2`}>
                              {[0, 1, 2].map((n) => (
                                <span key={n} className={'sb-pip' + (n < ind.value ? ' on' : '')} style={n < ind.value ? { background: idx.color } : undefined} />
                              ))}
                              <b className="sb-val">{ind.value}</b>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <p className="sb-note">Each measure is built from five indicators, each scored 0, 1, or 2. A high composite does not mean a story is true, and a low one does not mean it is false. The number is a starting point for thinking, not a substitute for it.</p>
                </div>
              )}
            </details>
          )}
          {item.kind === 'article' ? (() => {
            const V: Record<string, { label: string; color: string }> = {
              verified: { label: 'Verified', color: '#D4AF37' },
              pending: { label: 'Pending verification', color: '#E08A2B' },
              unverified: { label: 'Unverified', color: '#C8372A' },
            };
            const v = V[item.verificationStatus || 'verified'] || V.verified;
            return (
              <div className="mark">
                <span className="dot" style={{ background: v.color }} /> {v.label}
              </div>
            );
          })() : (
            <div className="mark"><span className="dot" /> Approved by an editor</div>
          )}
        </article>
        <section className="callout">
          <h3>{cta}.</h3>
          <p>This story is part of today&rsquo;s edition in Dot 1 News. A few stories, chosen by a person, each with the reason it ran, and then it ends.</p>
          <a className="btn" href={APP_STORE}>Get Dot 1 News free &rsaquo;</a>
          <p className="fine">Free on the App Store.</p>
        </section>
        <div className="backline"><a href="/">&lsaquo; Today&rsquo;s edition</a></div>
      </main>
      <Footer />
    </>
  );
}
