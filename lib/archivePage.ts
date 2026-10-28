/**
 * backend/lib/archivePage.ts
 *
 * The archive turns a daily that vanishes at midnight into a body of work.
 * Two views, both server-rendered with the site chrome:
 *
 *   /archive          - past editions grouped by date, newest first
 *   /archive?q=...     - full-text search across every published story
 *
 * This is the single biggest thing the site can do for search engines: a page
 * that only ever shows "today" gives Google almost nothing to index, while an
 * archive accumulates a findable page for every story ever run.
 */

import { C, esc, clip, page, header, footer, APP_STORE } from './chrome';

export interface ArchiveStory {
  id: string;
  title: string;
  summary?: string | null;
  image?: string | null;
  category?: string | null;
  dateKey: string;   // YYYY-MM-DD in Alaska time, for grouping
  dateLabel: string; // "Friday, July 24"
}

function href(id: string): string {
  return `/s/n/${encodeURIComponent(id)}`;
}

const CSS = `
.archive-hero{max-width:820px;margin:0 auto;padding:40px 0 8px;}
.archive-hero .kicker{margin-bottom:14px;}
.archive-hero h1{margin:0 0 16px;font-size:38px;line-height:1.13;letter-spacing:-.5px;color:${C.ink};}
.archive-hero p{margin:0;font-size:16.5px;line-height:1.66;color:${C.body};}

.searchbar{max-width:820px;margin:26px auto 8px;display:flex;gap:10px;}
.searchbar input{flex:1;font-family:var(--font-body),Georgia,serif;font-size:16px;color:${C.ink};
  background:${C.paper};border:1px solid ${C.rule};padding:14px 15px;border-radius:8px;}
.searchbar input:focus{outline:none;border-color:${C.red};}
.searchbar button{font-family:var(--font-body),Georgia,serif;font-size:15px;font-weight:bold;color:#fff;
  background:${C.red};border:none;padding:0 22px;border-radius:8px;cursor:pointer;}
.searchnote{max-width:820px;margin:0 auto 8px;font-size:13.5px;color:${C.muted};font-style:italic;}
.searchnote a{color:${C.red};font-weight:bold;font-style:normal;}

.edition{max-width:820px;margin:0 auto;border-top:1px solid ${C.hair};padding:30px 0 6px;}
.edition .date{display:flex;align-items:baseline;gap:14px;margin-bottom:20px;}
.edition .date h2{margin:0;font-size:21px;color:${C.ink};letter-spacing:-.2px;white-space:nowrap;}
.edition .date .line{flex:1;height:1px;background:${C.rule};}
.edition .date .count{font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:${C.muted};white-space:nowrap;}

.arch-list{display:grid;grid-template-columns:1fr 1fr;gap:22px 30px;}
.arch-item{display:flex;gap:14px;align-items:flex-start;padding-bottom:20px;border-bottom:1px solid ${C.hair};}
.arch-item:last-child{border-bottom:none;}
.arch-item .thumb{width:78px;height:78px;object-fit:cover;flex:0 0 auto;background:${C.hair};}
.arch-item .body{min-width:0;}
.arch-item .kicker{font-size:9.5px;letter-spacing:2px;margin-bottom:6px;}
.arch-item h3{margin:0 0 6px;font-size:17px;line-height:1.28;letter-spacing:-.1px;color:${C.ink};}
.arch-item p{margin:0;font-size:13.5px;line-height:1.55;color:${C.muted};}

.empty{max-width:820px;margin:0 auto;padding:34px 0;font-size:17px;line-height:1.7;color:${C.body};}

@media(max-width:720px){
  .archive-hero h1{font-size:29px;}
  .arch-list{grid-template-columns:1fr;gap:18px;}
  .arch-item .thumb{width:64px;height:64px;}
}`;

function itemRow(s: ArchiveStory): string {
  return `<a class="arch-item" href="${href(s.id)}">
    ${s.image ? `<img class="thumb" src="${esc(s.image)}" alt="">` : ''}
    <div class="body">
      ${s.category ? `<div class="kicker">${esc(s.category)}</div>` : ''}
      <h3>${esc(s.title)}</h3>
      ${s.summary ? `<p>${esc(clip(s.summary, 120))}</p>` : ''}
    </div>
  </a>`;
}

function searchForm(q: string): string {
  return `<form class="searchbar" method="get" action="/archive">
    <input type="text" name="q" value="${esc(q)}" placeholder="Search past stories" aria-label="Search the archive">
    <button type="submit">Search</button>
  </form>`;
}

/** The archive landing page: editions grouped by date, newest first. */
export function renderArchive(opts: {
  editions: { dateKey: string; dateLabel: string; stories: ArchiveStory[] }[];
  url: string;
}): string {
  const totalStories = opts.editions.reduce((n, e) => n + e.stories.length, 0);

  const body = opts.editions.length === 0
    ? `<div class="empty">The archive is just getting started. Once a few editions have run, every past day will live here.</div>`
    : opts.editions.map((e) => `<section class="edition">
        <div class="date">
          <h2>${esc(e.dateLabel)}</h2>
          <div class="line"></div>
          <div class="count">${e.stories.length === 1 ? 'One story' : e.stories.length + ' stories'}</div>
        </div>
        <div class="arch-list">${e.stories.map(itemRow).join('')}</div>
      </section>`).join('');

  const inner = `${header()}
    <main class="shell">
      <section class="archive-hero">
        <div class="kicker">The Archive</div>
        <h1>Every edition, kept.</h1>
        <p>Dot 1 News is a daily, but nothing here disappears. Every story we have ever run stays on the record, ${totalStories > 0 ? `${totalStories} and counting, ` : ''}searchable and readable for as long as the paper exists.</p>
      </section>
      ${searchForm('')}
      ${body}
    </main>
    ${footer()}`;

  return page({
    title: 'The Archive \u00b7 Dot 1 News',
    desc: 'Every edition of Dot 1 News, kept on the record. Search and read every story we have run.',
    url: opts.url,
    extraCss: CSS,
    inner,
  });
}

/** Search results across all published stories. */
export function renderSearchResults(opts: {
  query: string;
  results: ArchiveStory[];
  url: string;
}): string {
  const n = opts.results.length;
  const note = n === 0
    ? `No stories match &ldquo;${esc(opts.query)}.&rdquo; <a href="/archive">Back to the full archive</a>`
    : `${n === 1 ? 'One story' : n + ' stories'} matching &ldquo;${esc(opts.query)}.&rdquo; <a href="/archive">Clear search</a>`;

  const body = n === 0
    ? `<div class="empty">Try a broader term, or browse the <a href="/archive" style="color:${C.red};font-weight:bold;">full archive</a>.</div>`
    : `<section class="edition" style="border-top:none;padding-top:8px;">
        <div class="arch-list">${opts.results.map(itemRow).join('')}</div>
      </section>`;

  const inner = `${header()}
    <main class="shell">
      <section class="archive-hero">
        <div class="kicker">Search</div>
        <h1>Search the archive.</h1>
      </section>
      ${searchForm(opts.query)}
      <p class="searchnote">${note}</p>
      ${body}
    </main>
    ${footer()}`;

  return page({
    title: `Search: ${clip(opts.query, 40)} \u00b7 Dot 1 News`,
    desc: `Search results for "${clip(opts.query, 60)}" in the Dot 1 News archive.`,
    url: opts.url,
    extraCss: CSS,
    inner,
  });
}
