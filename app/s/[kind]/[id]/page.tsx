import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { clip, APP_STORE, SITE_URL } from '@/lib/theme';
import { scoreFromRow, breakdownFromRow, StoryScore, IndexBreakdown, compositeBand, sciNotice, profileBalance } from '@/lib/scoreRow';
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
  author?: string | null;
  tags?: string[] | null;
  sourceUrl?: string | null;
  sourceName?: string | null;
  sources?: { title?: string; url: string; source?: string }[] | null;
  imageCredit?: string | null;
  imageCreditUrl?: string | null;
  imageRightsRestricted?: boolean | null;
}

// Original-source links may be a JSON array (citations) or a single source_url.
function parseSources(row: Record<string, any>): { title?: string; url: string; source?: string }[] {
  const out: { title?: string; url: string; source?: string }[] = [];
  const seen = new Set<string>();
  const add = (url?: string | null, title?: string, source?: string) => {
    const u = String(url || '').trim();
    if (!u || !/^https?:\/\//i.test(u) || seen.has(u)) return;
    seen.add(u); out.push({ url: u, title: title?.trim() || undefined, source: source?.trim() || undefined });
  };
  let c = row['citations'];
  if (typeof c === 'string') { try { c = JSON.parse(c); } catch { c = null; } }
  if (Array.isArray(c)) for (const x of c) add(x?.url, x?.title, x?.source);
  add(row['source_url'], undefined, row['source_name']);
  return out;
}

// Tags for the foot of an article: the editor's stored tags when present,
// otherwise the category plus the proper nouns the piece actually names (people,
// places, organizations). Each links into the archive search. Heuristic but
// safe: it skips sentence-initial capitals so it picks up real entities, not
// the first word of every sentence.
const TAG_STOP = new Set(['The', 'A', 'An', 'This', 'That', 'These', 'Those', 'It', 'But', 'And', 'For', 'Because', 'When', 'While', 'After', 'Before', 'According', 'Readers', 'Here', 'There', 'They', 'We', 'He', 'She', 'His', 'Her', 'Their', 'Our', 'Its', 'As', 'If', 'So', 'Yet', 'Mr', 'Ms', 'Mrs', 'Dr']);

function deriveTags(item: ShareItem): string[] {
  const out = new Set<string>();
  if (item.category) out.add(item.category);
  if (Array.isArray(item.tags)) item.tags.forEach((t) => { if (t && String(t).trim()) out.add(String(t).trim()); });

  const text = `${item.summary || ''} ${(item.content || '').slice(0, 1800)}`;
  const sentences = text.split(/(?<=[.!?])\s+/);
  for (const sent of sentences) {
    const words = sent.trim().split(/\s+/);
    let i = 1; // skip the sentence-initial word
    const cap = (w: string) => /^[A-Z][A-Za-z.&'’-]+$/.test(w);
    while (i < words.length) {
      if (cap(words[i]) && !TAG_STOP.has(words[i])) {
        const seq: string[] = [];
        let j = i;
        while (j < words.length && cap(words[j])) { seq.push(words[j].replace(/[.,;:]$/, '')); j++; }
        const term = seq.join(' ').replace(/[^\w\s&'’-]/g, '').trim();
        if (term.length > 2 && !TAG_STOP.has(term)) out.add(term);
        i = j;
      } else i++;
    }
    if (out.size >= 9) break;
  }
  return Array.from(out).slice(0, 7);
}

// A published-date formatter in Alaska time, e.g. "October 27, 2026".
function fmtDate(d?: string | null): string {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-US', { timeZone: 'America/Anchorage', year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return ''; }
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
               d14ls_interpretation, d14ls_index_notes, d14ls_instrument_version,
               source_url, source_name, citations, image_credit, image_credit_url, image_rights_restricted,
               COALESCE(verification_status, 'verified') AS verification_status, reviewed_at, created_at, author, tags
          FROM news_stories WHERE id = ${id} AND review_status = 'approved' LIMIT 1`;
        x = r[0];
      } catch {
        try {
          const r = await sql`SELECT title, summary, content, image, category, editor_note, score_confidence,
                 bai_scriptural_consistency, bai_doctrinal_integrity, bai_moral_framework, bai_anthropology, bai_teleology,
                 psi_textual_linkage, psi_eschatological_fit, psi_historical_continuity, psi_spiritual_impact, psi_theological_restraint,
                 sci_primary_source_access, sci_verification, sci_transparency, sci_track_record, sci_editorial_standards,
                 hii_human_dignity, hii_compassion_empathy, hii_societal_impact, hii_justice_responsibility, hii_christ_modeled_care, reviewed_at, created_at, author, tags
            FROM news_stories WHERE id = ${id} AND review_status = 'approved' LIMIT 1`;
          x = r[0];
        } catch {
          const r = await sql`SELECT title, summary, content, image, category, editor_note, reviewed_at, created_at, author, tags FROM news_stories WHERE id = ${id} AND review_status = 'approved' LIMIT 1`;
          x = r[0];
        }
      }
      if (x) return { kind: 'article', title: x.title, summary: x.summary, content: x.content, image: x.image, category: x.category, editorNote: x.editor_note, verificationStatus: x.verification_status || 'verified', score: scoreFromRow(x), scoreBreakdown: breakdownFromRow(x), publishedAt: x.reviewed_at || x.created_at, updatedAt: x.reviewed_at || x.created_at, author: x.author, tags: x.tags, sources: parseSources(x), imageCredit: x.image_credit || null, imageCreditUrl: x.image_credit_url || null, imageRightsRestricted: !!x.image_rights_restricted };
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

const CSS = `.piece{max-width:700px;margin:0 auto;padding:44px 0 20px;}
.piece .kicker{margin-bottom:14px;}
.piece h1{margin:0 0 18px;font-size:44px;line-height:1.1;letter-spacing:-.7px;color:var(--ink);}
.piece .credit{margin:0 0 20px;font-size:13px;font-style:italic;color:var(--muted);}
.sourcefoot{margin:22px 0 2px;padding-top:18px;border-top:1px solid var(--imgbg);}
.sourcefoot .src-label{display:block;font-family:var(--font-mono),monospace;font-size:10.5px;letter-spacing:1.6px;text-transform:uppercase;color:var(--goldtext);margin-bottom:8px;}
.sourcefoot .src ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px;}
.sourcefoot .src a{font-size:14px;color:var(--crimson);text-decoration:underline;word-break:break-word;}
.sourcefoot .imgcredit{margin:14px 0 0;font-size:12.5px;color:var(--muted);}
.sourcefoot .imgcredit a{color:var(--muted);text-decoration:underline;}
.piece .hero{margin:26px 0 30px;background:var(--imgbg);}
.piece .hero img{width:100%;max-height:520px;object-fit:cover;}
.piece .player{margin:26px 0 30px;background:#14120F;}
.piece .player video{width:100%;aspect-ratio:16/9;display:block;background:#14120F;}
.piece .sum{margin:0 0 26px;font-size:21px;line-height:1.65;color:var(--body);font-weight:400;}
.piece .body p{margin:0 0 20px;font-size:18.5px;line-height:1.82;color:var(--body);}
.piece .body p:first-child{margin-top:4px;}
.piece .body p:first-child::first-letter{float:left;font-family:var(--font-display),Georgia,serif;
  font-size:66px;line-height:.78;font-weight:700;color:var(--crimson);padding:4px 10px 0 0;}
.piece .body a{color:var(--crimson);text-decoration:underline;text-underline-offset:2px;}
.piece .sum a{color:var(--crimson);text-decoration:underline;text-underline-offset:2px;}
.piece .why{margin:28px 0 30px;}
.piece .why .t{font-size:15.5px;}
.mark{display:flex;align-items:center;gap:9px;padding:18px 0 0;border-top:1px solid var(--imgbg);font-size:13px;color:var(--goldtext);font-weight:bold;}
.dot{width:9px;height:9px;border-radius:50%;background:#D4AF37;display:inline-block;}
.callout{max-width:760px;margin:36px auto 0;border:1px solid var(--rule);background:var(--bg);padding:34px 36px;text-align:center;}
.callout h3{margin:0 0 10px;font-size:25px;line-height:1.25;color:var(--ink);letter-spacing:-.3px;}
.callout p{margin:0 auto 22px;font-size:15.5px;line-height:1.7;color:var(--body);max-width:520px;}
.callout .btn{display:inline-block;background:var(--crimson);color:#fff;font-size:15.5px;font-weight:bold;padding:16px 30px;border-radius:8px;}
.callout .fine{margin:14px 0 0;font-size:12.5px;color:var(--muted);}
.scorecard{margin:20px 0 4px;}
.scorecard>summary{list-style:none;cursor:pointer;margin:0 !important;}
.scorecard>summary::-webkit-details-marker{display:none;}
.scorecard>summary{outline:none;}
.scorecard>summary:focus-visible{box-shadow:0 0 0 2px var(--crimson);}
.scorecard .ls-toggle{align-self:center;white-space:nowrap;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:bold;color:var(--crimson);display:inline-flex;align-items:center;gap:5px;}
.scorecard .ls-toggle:after{content:'\\203A';font-size:15px;transition:transform .2s ease;display:inline-block;}
.scorecard[open] .ls-toggle:after{transform:rotate(90deg);}
.scorebreak{border:1px solid var(--rule2);border-top:none;background:var(--raised);padding:6px 20px 18px;}
.sb-idx{padding:16px 0 4px;border-top:1px solid var(--rule);}
.sb-idx:first-child{border-top:none;}
.sb-head{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
.sb-tag{font-size:11px;font-weight:bold;letter-spacing:1px;color:#fff;padding:3px 8px;border-radius:4px;}
.sb-name{font-size:15px;font-weight:bold;color:var(--ink);flex:1;min-width:0;}
.sb-total{font-variant-numeric:tabular-nums;font-size:13px;color:var(--body);white-space:nowrap;}
.sb-inds{display:flex;flex-direction:column;gap:7px;}
.sb-ind{display:flex;align-items:center;justify-content:space-between;gap:14px;font-size:14px;color:var(--body);}
.sb-lab{min-width:0;}
.sb-pips{display:inline-flex;align-items:center;gap:4px;flex-shrink:0;}
.sb-pip{width:9px;height:9px;border-radius:50%;background:var(--rule2);display:inline-block;}
.sb-val{font-variant-numeric:tabular-nums;font-size:12.5px;color:var(--muted);margin-left:5px;min-width:9px;text-align:right;}
.sb-note{margin:16px 0 0;font-size:12.5px;line-height:1.6;color:var(--muted);font-style:italic;}
.ls-sub{font-size:12px;color:var(--muted);margin-top:4px;font-variant-numeric:tabular-nums;}
.ls-bars i{font-style:normal;opacity:.55;font-size:.82em;}
.sb-alert{margin:10px 0 2px;padding:10px 13px;border-radius:7px;font-size:13px;line-height:1.55;background:rgba(200,162,74,.14);border:1px solid rgba(138,106,23,.35);color:var(--ink);}
.sb-alert.warn{background:rgba(184,22,22,.1);border-color:rgba(184,22,22,.4);}
.sb-interp{margin:14px 0 4px;font-size:14.5px;line-height:1.7;color:var(--ink);}
.sb-lensnote{margin:0 0 10px;font-size:13px;line-height:1.55;color:var(--muted);}
.sb-meta{display:flex;flex-wrap:wrap;gap:6px 18px;margin:16px 0 0;padding-top:12px;border-top:1px solid var(--rule);font-family:var(--font-mono),monospace;font-size:11px;letter-spacing:.4px;color:var(--muted);}
.sb-ver{margin:12px 0 0;font-size:12px;color:var(--muted);}
.sb-ver .ln{color:var(--crimson);text-decoration:underline;}
.tags{display:flex;flex-wrap:wrap;align-items:center;gap:9px;margin:26px 0 2px;padding-top:20px;border-top:1px solid var(--imgbg);}
.tags .tags-label{font-family:var(--font-mono),monospace;font-size:10.5px;letter-spacing:1.6px;text-transform:uppercase;color:var(--goldtext);margin-right:3px;}
.tags .tag{font-family:var(--font-mono),monospace;font-size:12px;letter-spacing:.4px;color:var(--body);background:var(--raised);border:1px solid var(--rule2);padding:5px 11px;border-radius:999px;transition:all .15s;}
.tags .tag:hover{color:#fff;background:var(--crimson);border-color:var(--crimson);}
.backline{max-width:760px;margin:34px auto 0;padding-top:20px;border-top:1px solid var(--imgbg);font-size:13px;color:var(--crimson);font-weight:bold;}
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
            <p>A few stories, each with the reason it ran.</p>
            <a className="btn" href="/">Open today&rsquo;s edition &rsaquo;</a>
            <p className="fine">Or <a href={APP_STORE} style={{ color: 'var(--crimson)', fontWeight: 'bold' }}>get the app</a>.</p>
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
          {item.kind === 'article' && (
            <p className="byline">
              By {item.author || 'Dot 1 Newsroom'}
              {item.publishedAt ? <> &middot; <time dateTime={new Date(item.publishedAt).toISOString()}>{fmtDate(item.publishedAt)}</time></> : null}
            </p>
          )}
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
          {item.kind === 'article' && item.score?.hasScore && (() => {
            const s = item.score!;
            const band = compositeBand(s.overall);
            const notice = sciNotice(s.sci);
            const balance = profileBalance(s);
            const notes = s.indexNotes || {};
            const LENS: { key: 'BAI'|'PSI'|'SCI'|'HII'; name: string; val: number; note?: string }[] = [
              { key: 'BAI', name: 'Biblical Alignment', val: s.bai, note: notes.BAI },
              { key: 'PSI', name: 'Prophetic Significance', val: s.psi, note: notes.PSI },
              { key: 'SCI', name: 'Source Credibility', val: s.sci, note: notes.SCI },
              { key: 'HII', name: 'Humanities Impact', val: s.hii, note: notes.HII },
            ];
            return (
            <details className="scorecard">
              <summary className="leadscore">
                <div className="ls-detail">
                  <div className="ls-label">D1&#8209;4LS · Four&#8209;Lens Assessment</div>
                  <div className="ls-bars">
                    <span title="Biblical Alignment">BAI {s.bai}<i>/10</i></span>
                    <span title="Prophetic Significance">PSI {s.psi}<i>/10</i></span>
                    <span title="Source Credibility">SCI {s.sci}<i>/10</i></span>
                    <span title="Humanities Impact">HII {s.hii}<i>/10</i></span>
                  </div>
                  <div className="ls-sub">Composite {s.overall}/40 · {band.label}{s.confidence ? ` · ${s.confidence} confidence` : ''}</div>
                </div>
                <span className="ls-toggle" aria-hidden="true">Why this assessment</span>
              </summary>
              <div className="scorebreak">
                {notice.level !== 'none' && (
                  <p className={'sb-alert' + (notice.level === 'warning' ? ' warn' : '')}>{notice.text}</p>
                )}
                {s.interpretation && <p className="sb-interp">{s.interpretation}</p>}
                {item.scoreBreakdown && item.scoreBreakdown.map((idx) => {
                  const note = LENS.find((l) => l.key === idx.key)?.note;
                  return (
                    <div className="sb-idx" key={idx.key}>
                      <div className="sb-head">
                        <span className="sb-tag" style={{ background: idx.color }}>{idx.key}</span>
                        <span className="sb-name">{idx.name}</span>
                        <b className="sb-total">{idx.total} / 10</b>
                      </div>
                      {note ? <p className="sb-lensnote">{note}</p> : null}
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
                  );
                })}
                <div className="sb-meta">
                  <span>Composite {s.overall}/40 · {band.label}</span>
                  <span>Profile: {balance.label}</span>
                  {item.verificationStatus ? <span>Editorial verification is shown separately, above.</span> : null}
                </div>
                <p className="sb-note">Read the four lenses together, not the total. A high score does not mean a story is true, morally good, prophetically fulfilled, or endorsed by Dot 1 News; a low score does not mean it is false or unimportant. Source Credibility concerns evidence only and is separate from theological alignment.</p>
                <p className="sb-ver">D1&#8209;4LS {s.instrumentVersion ? `v${s.instrumentVersion}` : 'assessment'} · an experimental framework still being tested. <a className="ln" href="/d1-4ls">How the scoring works</a></p>
              </div>
            </details>
            );
          })()}
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
          {item.kind === 'article' && (() => {
            const tags = deriveTags(item);
            return tags.length ? (
              <div className="tags">
                <span className="tags-label">Related</span>
                {tags.map((t) => (
                  <a className="tag" key={t} href={`/archive?q=${encodeURIComponent(t)}`}>{t}</a>
                ))}
              </div>
            ) : null;
          })()}
          {item.kind === 'article' && (((item.sources && item.sources.length > 0) || item.imageCredit) ? (
            <div className="sourcefoot">
              {item.sources && item.sources.length > 0 && (
                <div className="src">
                  <span className="src-label">{item.sources.length > 1 ? 'Original sources' : 'Original source'}</span>
                  <ul>
                    {item.sources.map((sc, i) => (
                      <li key={i}><a href={sc.url} target="_blank" rel="noreferrer noopener">{sc.source || sc.title || sc.url}</a></li>
                    ))}
                  </ul>
                </div>
              )}
              {item.imageCredit && (
                <p className="imgcredit">Image: {item.imageCreditUrl ? <a href={item.imageCreditUrl} target="_blank" rel="noreferrer noopener">{item.imageCredit}</a> : item.imageCredit}</p>
              )}
            </div>
          ) : null)}
        </article>
        <section className="callout">
          <h3>{cta}.</h3>
          <p>This story is part of today&rsquo;s edition in Dot 1 News. A few stories, each with the reason it ran, and then it ends.</p>
          <a className="btn" href={APP_STORE}>Get Dot 1 News free &rsaquo;</a>
          <p className="fine">Free on the App Store.</p>
        </section>
        <div className="backline"><a href="/">&lsaquo; Today&rsquo;s edition</a></div>
      </main>
      <Footer />
    </>
  );
}
