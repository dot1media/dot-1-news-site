import { sql } from '@/lib/db';
import NewsLogo from "@/app/components/NewsLogo";
import type { Metadata } from 'next';
import { clip, alaskaDate, APP_STORE, SITE_URL } from '@/lib/theme';
import { homeGraph } from '@/lib/seo';
import WeatherBar from '@/app/components/WeatherBar';
import { scoreFromRow, INDICATOR_COLUMNS, StoryScore } from '@/lib/scoreRow';
import Header from './components/Header';
import Footer from './components/Footer';
import { isImageUrl, isVideoUrl } from '@/lib/media';

// Always render fresh from the shared database so the site reflects what the
// app just published. Revalidate window keeps it fast without going stale.
export const dynamic = 'force-dynamic';

// Home-page metadata tuned for discovery: the query people actually search
// (Alaska news), the place, and what makes it distinct. The layout supplies the
// shared Open Graph/Twitter defaults; this sets the indexable title, the
// description, and the canonical.
export const metadata: Metadata = {
  title: 'Dot 1 News — Human-Edited Alaska News, Daily | Wasilla',
  description: 'A human-edited daily edition of Alaska and national news from Wasilla. Every story is chosen and approved by an editor, tells you why it ran, and is scored across four measures. Veteran-owned and faith-driven.',
  alternates: { canonical: SITE_URL + '/' },
  keywords: ['Alaska news', 'Wasilla news', 'Mat-Su news', 'Christian news', 'faith-based news', 'daily news digest', 'Dot 1 News'],
};

interface ReaderItem {
  id: string;
  kind: 'article' | 'photo' | 'video';
  title: string;
  summary?: string | null;
  image?: string | null;
  category?: string | null;
  editorNote?: string | null;
  credit?: string | null;
  creditUrl?: string | null;
  score?: StoryScore | null;
  videoUrl?: string | null;
  verificationStatus?: string | null;
}

// The verification dot, shared in meaning with the app: gold verified, orange
// pending, red unverified. A published story defaults to verified.
const VERIFY: Record<string, { label: string; color: string }> = {
  verified: { label: 'Verified', color: '#D4AF37' },
  pending: { label: 'Pending verification', color: '#E08A2B' },
  unverified: { label: 'Unverified', color: '#C8372A' },
};

function VerifyMark({ status, className = 'mark' }: { status?: string | null; className?: string }) {
  const v = VERIFY[status || 'verified'] || VERIFY.verified;
  return (
    <div className={className}>
      <span style={{ display: 'inline-block', width: '0.62em', height: '0.62em', borderRadius: '50%', background: v.color, verticalAlign: 'baseline' }} />
      &nbsp; {v.label}
    </div>
  );
}

function href(i: ReaderItem): string {
  const k = i.kind === 'photo' ? 'p' : i.kind === 'video' ? 'v' : 'n';
  return `/s/${k}/${encodeURIComponent(i.id)}`;
}

async function getEdition(): Promise<{ news: ReaderItem[]; photos: ReaderItem[]; videos: ReaderItem[] }> {
  try {
    const [newsRows, photoRows, videoRows] = await Promise.all([
      // verification_status is set by the editorial platform; query it defensively so
      // a not-yet-migrated column never breaks the edition. Missing reads as verified.
      (async () => {
        try {
          return await sql`SELECT id, title, summary, image, category, editor_note, score_confidence,
                 bai_scriptural_consistency, bai_doctrinal_integrity, bai_moral_framework, bai_anthropology, bai_teleology,
                 psi_textual_linkage, psi_eschatological_fit, psi_historical_continuity, psi_spiritual_impact, psi_theological_restraint,
                 sci_primary_source_access, sci_verification, sci_transparency, sci_track_record, sci_editorial_standards,
                 hii_human_dignity, hii_compassion_empathy, hii_societal_impact, hii_justice_responsibility, hii_christ_modeled_care,
                 COALESCE(verification_status, 'verified') AS verification_status
            FROM news_stories
            WHERE review_status = 'approved' ORDER BY COALESCE(reviewed_at, created_at) DESC LIMIT 6`;
        } catch {
          return await sql`SELECT id, title, summary, image, category, editor_note, score_confidence,
                 bai_scriptural_consistency, bai_doctrinal_integrity, bai_moral_framework, bai_anthropology, bai_teleology,
                 psi_textual_linkage, psi_eschatological_fit, psi_historical_continuity, psi_spiritual_impact, psi_theological_restraint,
                 sci_primary_source_access, sci_verification, sci_transparency, sci_track_record, sci_editorial_standards,
                 hii_human_dignity, hii_compassion_empathy, hii_societal_impact, hii_justice_responsibility, hii_christ_modeled_care
            FROM news_stories
            WHERE review_status = 'approved' ORDER BY COALESCE(reviewed_at, created_at) DESC LIMIT 6`;
        }
      })(),
      // credit_url is added by the editorial app on first sourced publish; query it
      // defensively so a not-yet-created column never breaks the edition.
      (async () => {
        try {
          return await sql`SELECT id, caption, full_description, image, photographer, credit_url FROM photos
            WHERE COALESCE(status, 'published') NOT IN ('archived', 'rejected', 'deleted') ORDER BY created_at DESC LIMIT 4`;
        } catch {
          return await sql`SELECT id, caption, full_description, image, photographer FROM photos
            WHERE COALESCE(status, 'published') NOT IN ('archived', 'rejected', 'deleted') ORDER BY created_at DESC LIMIT 4`;
        }
      })(),
      (async () => {
        try {
          return await sql`SELECT id, title, description, thumbnail, video_url, producer, credit_url FROM videos
            WHERE COALESCE(status, 'published') NOT IN ('archived', 'rejected', 'deleted') ORDER BY created_at DESC LIMIT 3`;
        } catch {
          return await sql`SELECT id, title, description, thumbnail, video_url FROM videos
            WHERE COALESCE(status, 'published') NOT IN ('archived', 'rejected', 'deleted') ORDER BY created_at DESC LIMIT 3`;
        }
      })(),
    ]);
    return {
      news: (newsRows as any[]).map((r) => ({
        id: r.id, kind: 'article', title: r.title, summary: r.summary,
        image: r.image, category: r.category, editorNote: r.editor_note,
        score: scoreFromRow(r), verificationStatus: r.verification_status || 'verified',
      })),
      photos: (photoRows as any[]).map((r) => ({
        id: r.id, kind: 'photo', title: r.caption || 'A photograph',
        summary: r.full_description, image: r.image, credit: r.photographer, creditUrl: r.credit_url || null,
      })),
      videos: (videoRows as any[]).map((r) => ({
        id: r.id, kind: 'video', title: r.title, summary: r.description,
        image: isImageUrl(r.thumbnail) ? r.thumbnail : null,
        videoUrl: r.video_url || (isVideoUrl(r.thumbnail) ? r.thumbnail : null),
        credit: r.producer || null, creditUrl: r.credit_url || null,
      })),
    };
  } catch (e: any) {
    console.error('reader home query failed:', e?.message);
    return { news: [], photos: [], videos: [] };
  }
}

function Why({ note, n = 190 }: { note?: string | null; n?: number }) {
  if (!note) return null;
  return (
    <div className="why">
      <div className="h">Why We Ran This</div>
      <div className="t">{clip(note, n)}</div>
    </div>
  );
}

export default async function Home() {
  const { news, photos, videos } = await getEdition();
  const [lead, ...rest] = news;
  const total = news.length + photos.length + videos.length;
  const countLabel = total === 0 ? 'The edition is being read'
    : total === 1 ? 'One story today' : `${total} stories today`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeGraph()) }} />
      <Header />

      <div className="masthead"><div className="in">
        <h1>DOT&nbsp;<NewsLogo h="1.15em" />&nbsp;NEWS</h1>
        <div className="tag">A declared standpoint, not a hidden one.</div>
      </div></div>
      <div className="dateline">
        <span>{alaskaDate()}</span>
        <WeatherBar />
        <span>{countLabel}</span>
      </div>

      <main className="shell">
        {lead && (
          <article className="lead">
            <a className="shot" href={href(lead)}>
              {lead.image && <img src={lead.image} alt="" />}
            </a>
            <div>
              {lead.category && <div className="kicker">{lead.category}</div>}
              <h2><a href={href(lead)}>{lead.title}</a></h2>
              {lead.summary && <p>{clip(lead.summary, 320)}</p>}
              {lead.score?.hasScore && (
                <div className="leadscore">
                  <div className="ls-num">{lead.score.composite.toFixed(1)}<span>/10</span></div>
                  <div className="ls-detail">
                    <div className="ls-label">D1&#8209;4LS Score{lead.score.confidence ? ` \u00b7 ${lead.score.confidence}` : ''}</div>
                    <div className="ls-bars">
                      <span title="Biblical Alignment">BAI {lead.score.bai}</span>
                      <span title="Prophetic Significance">PSI {lead.score.psi}</span>
                      <span title="Source Credibility">SCI {lead.score.sci}</span>
                      <span title="Humanities Impact">HII {lead.score.hii}</span>
                    </div>
                  </div>
                </div>
              )}
              <Why note={lead.editorNote} n={300} />
              <VerifyMark status={lead.verificationStatus} />
              <div className="lead-actions">
                <a className="more" href={href(lead)}>Read the full story &rsaquo;</a>
                <a className="scorelink" href={`/score?t=${encodeURIComponent(lead.title)}`}>Score this story yourself &rsaquo;</a>
              </div>
            </div>
          </article>
        )}

        {rest.length > 0 && (
          <>
            <div className="secHead"><h2>More in today&rsquo;s edition</h2><div className="line" /></div>
            <div className="rows">
              {rest.map((s) => (
                <a className="row" href={href(s)} key={s.id}>
                  <div className="rthumb">{s.image && <img src={s.image} alt="" />}</div>
                  <div className="rtext">
                    {s.category && <div className="kicker">{s.category}</div>}
                    <h3>{s.title}</h3>
                    {s.summary && <p>{clip(s.summary, 120)}</p>}
                  </div>
                </a>
              ))}
            </div>
          </>
        )}

        {photos.length > 0 && (
          <>
            <div className="secHead" id="lens"><h2>The Lens</h2><div className="line" /></div>
            <div className="lensband">
              {photos.slice(0, 4).map((p) => (
                <a href={href(p)} key={p.id}><figure>
                  {p.image && <img src={p.image} alt="" />}
                  <figcaption>{clip(p.title, 90)}
                    {p.credit && <span className="by">Photograph &middot; {p.credit}</span>}
                  </figcaption>
                </figure></a>
              ))}
            </div>
          </>
        )}

        {videos.length > 0 && (
          <>
            <div className="secHead" id="reel"><h2>The Reel</h2><div className="line" /></div>
            <div className="reel">
              {videos.slice(0, 3).map((v) => (
                <article key={v.id}>
                  <a className="shot" href={href(v)}>
                    {v.image ? <img src={v.image} alt="" />
                      : v.videoUrl ? <video src={`${v.videoUrl}#t=2`} muted playsInline preload="metadata" aria-hidden="true" />
                      : null}
                    <span className="play">&#9654;&nbsp; Watch</span>
                  </a>
                  <h3><a href={href(v)}>{v.title}</a></h3>
                  {v.summary && <p>{clip(v.summary, 120)}</p>}
                  {v.credit && <p className="by">Produced by {v.credit}</p>}
                </article>
              ))}
            </div>
          </>
        )}

        {total === 0 && (
          <>
            <div className="secHead"><h2>Today</h2><div className="line" /></div>
            <p style={{ fontSize: 17, lineHeight: 1.7 }}>Today&rsquo;s edition is still being read and approved. Nothing runs here until a person has chosen it, so please check back shortly.</p>
          </>
        )}

        <div className="diamond">&#9670;</div>
        <p className="quiet">That is today&rsquo;s edition. Reading the news should not cost you your whole morning, or your peace.</p>

        <section className="promo">
          <div>
            <h3>Carry the edition with you.</h3>
            <p>The app brings each day&rsquo;s chosen stories to your phone, with the reason every one of them ran, and an edition that ends on purpose. Free on the App Store.</p>
          </div>
          <a className="btn" href={APP_STORE}>Get Dot 1 News &rsaquo;</a>
        </section>
      </main>

      <Footer />
    </>
  );
}
