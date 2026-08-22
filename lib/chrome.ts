/**
 * backend/lib/siteChrome.ts
 *
 * Shared furniture for the web edition, so the front page and every article
 * page feel like one publication rather than a stack of separate cards.
 *
 * The first version of this read like the app screenshotted onto a browser: one
 * narrow column, no navigation, nothing above or below the content. A website
 * needs a masthead you can click, a way to move between sections, room to
 * breathe at desktop widths, and a footer that says who publishes this.
 */

export const C = {
  paper: '#F8F5EF',
  page: '#EFEAE0',
  ink: '#1B1917',
  red: '#B81616',
  gold: '#D4AF37',
  goldText: '#8A6A17',
  muted: '#767065',
  body: '#33302B',
  dark: '#14120F',
  cream: '#F3EEE4',
  rule: '#D8CFC0',
  hair: '#E6DED1',
};

export const APP_STORE = 'https://apps.apple.com/us/app/dot-1-news/id6757212352';

export function esc(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
export function clip(s: string, n: number): string {
  const t = (s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1) + '\u2026' : t;
}

export const SITE_CSS = `
*,*::before,*::after{box-sizing:border-box;}
html{-webkit-text-size-adjust:100%;}
body{margin:0;background:${C.page};color:${C.body};
  font-family:Georgia,'Times New Roman',serif;line-height:1.5;}
a{color:inherit;text-decoration:none;}
img{max-width:100%;display:block;}

.bar{background:${C.paper};border-bottom:1px solid ${C.rule};position:sticky;top:0;z-index:20;}
.bar .in{max-width:1180px;margin:0 auto;padding:0 28px;height:60px;
  display:flex;align-items:center;justify-content:space-between;gap:20px;}
.bar .wm{font-size:19px;font-weight:bold;letter-spacing:.6px;color:${C.ink};white-space:nowrap;}
.bar .wm span{color:${C.red};}
.nav{display:flex;align-items:center;gap:26px;}
.nav a{font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${C.body};white-space:nowrap;}
.nav a:hover{color:${C.red};}
.getapp{background:${C.red};color:#fff !important;font-size:12px;letter-spacing:1.4px;
  text-transform:uppercase;font-weight:bold;padding:10px 16px;border-radius:6px;white-space:nowrap;}

.masthead{background:${C.paper};border-bottom:1px solid ${C.rule};}
.masthead .in{max-width:1180px;margin:0 auto;padding:44px 28px 30px;text-align:center;}
.masthead h1{margin:0 0 8px;font-size:60px;line-height:1;letter-spacing:1.5px;color:${C.ink};font-weight:bold;}
.masthead h1 span{color:${C.red};}
.masthead .tag{font-size:11px;letter-spacing:4.5px;text-transform:uppercase;color:${C.goldText};}
.dateline{max-width:1180px;margin:0 auto;padding:12px 28px;display:flex;
  align-items:center;justify-content:space-between;gap:14px;
  font-size:11.5px;letter-spacing:1.6px;text-transform:uppercase;color:${C.muted};
  border-top:3px double ${C.rule};border-bottom:3px double ${C.rule};background:${C.paper};}

.shell{max-width:1180px;margin:0 auto;padding:0 28px 56px;background:${C.paper};}
.secHead{display:flex;align-items:baseline;gap:16px;margin:52px 0 26px;}
.secHead h2{margin:0;font-size:13px;letter-spacing:3.4px;text-transform:uppercase;
  color:${C.goldText};font-weight:bold;white-space:nowrap;}
.secHead .line{flex:1;height:1px;background:${C.rule};}
.kicker{font-size:10.5px;letter-spacing:2.6px;text-transform:uppercase;color:${C.red};font-weight:bold;}
.why{border-left:3px solid ${C.red};padding:1px 0 1px 15px;margin:14px 0 0;}
.why .h{font-size:9.5px;letter-spacing:2px;text-transform:uppercase;color:${C.red};font-weight:bold;padding-bottom:5px;}
.why .t{font-size:14px;line-height:1.65;font-style:italic;color:${C.body};}
.more{display:inline-block;margin-top:14px;font-size:13px;font-weight:bold;color:${C.red};}
.more:hover{text-decoration:underline;}

.foot{background:${C.dark};color:#8A8175;margin-top:0;}
.foot .in{max-width:1180px;margin:0 auto;padding:52px 28px 34px;
  display:grid;grid-template-columns:2.2fr 1fr 1fr 1fr;gap:40px;}
.foot h4{margin:0 0 14px;font-size:10.5px;letter-spacing:2.4px;text-transform:uppercase;color:${C.cream};font-weight:bold;}
.foot a{display:block;font-size:13.5px;line-height:2;color:#8A8175;}
.foot a:hover{color:${C.cream};}
.foot .wm{font-size:23px;font-weight:bold;color:${C.cream};letter-spacing:.6px;margin-bottom:8px;}
.foot .wm span{color:${C.red};}
.foot .motto{font-size:10.5px;letter-spacing:2px;text-transform:uppercase;line-height:1.8;margin-bottom:16px;}
.foot .blurb{font-size:13.5px;line-height:1.75;max-width:330px;}
.legal{border-top:1px solid #2A2621;}
.legal .in{max-width:1180px;margin:0 auto;padding:20px 28px 34px;
  display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap;font-size:12px;color:#6B655C;}

@media(max-width:1000px){
  .foot .in{grid-template-columns:1fr 1fr;gap:32px;}
  .masthead h1{font-size:46px;}
}
@media(max-width:760px){
  .bar .in{height:56px;padding:0 18px;}
  .nav a:not(.getapp){display:none;}
  .masthead .in{padding:30px 18px 22px;}
  .masthead h1{font-size:34px;}
  .masthead .tag{font-size:9.5px;letter-spacing:3px;}
  .dateline{padding:10px 18px;font-size:10px;letter-spacing:1.1px;}
  .dateline .mid{display:none;}
  .shell{padding:0 18px 40px;}
  .secHead{margin:38px 0 20px;}
  .foot .in{grid-template-columns:1fr;gap:26px;padding:38px 18px 24px;}
  .legal .in{padding:18px 18px 30px;flex-direction:column;gap:8px;}
}`;

export function header(): string {
  return `<header class="bar"><div class="in">
    <a class="wm" href="/">DOT&nbsp;<span>1</span>&nbsp;NEWS</a>
    <nav class="nav">
      <a href="/">Today</a>
      <a href="/#lens">The Lens</a>
      <a href="/#reel">The Reel</a>
      <a href="/score">Score a Story</a>
      <a href="/archive">Archive</a>
      <a href="https://www.dot1.media">Dot One Media</a>
      <a class="getapp" href="${APP_STORE}">Get the app</a>
    </nav>
  </div></header>`;
}

export function masthead(dateLabel: string, countLabel: string): string {
  return `<div class="masthead"><div class="in">
      <h1>DOT&nbsp;<span>1</span>&nbsp;NEWS</h1>
      <div class="tag">A Declared Standpoint</div>
    </div></div>
    <div class="dateline">
      <span>${esc(dateLabel)}</span>
      <span class="mid">The dot is the point of light &middot; The one is the singular truth</span>
      <span>${esc(countLabel)}</span>
    </div>`;
}

export function footer(): string {
  const year = new Date().getFullYear();
  return `<footer class="foot"><div class="in">
      <div>
        <div class="wm">DOT&nbsp;<span>1</span>&nbsp;NEWS</div>
        <div class="motto">A Declared Standpoint</div>
        <p class="blurb">A small, human-edited daily paper. Every story is read and approved by a person before it reaches you, and every story tells you why it ran. A veteran-owned, faith-driven newsroom in Wasilla, Alaska.</p>
      </div>
      <div>
        <h4>Read</h4>
        <a href="/">Today&rsquo;s edition</a>
        <a href="/#lens">The Lens</a>
        <a href="/#reel">The Reel</a>
        <a href="/score">Score a Story</a>
        <a href="/archive">Archive</a>
        <a href="${APP_STORE}">Get the app</a>
      </div>
      <div>
        <h4>The Standpoint</h4>
        <a href="https://www.dot1.media/#news">How we score the news</a>
        <a href="https://www.dot1.media/#theopoetecology">Theopoetecology</a>
        <a href="https://www.dot1.media/#work">Selected work</a>
      </div>
      <div>
        <h4>Dot One Media</h4>
        <a href="https://www.dot1.media">dot1.media</a>
        <a href="https://instagram.com/dot1media">Instagram</a>
        <a href="mailto:contact@dot1.media">contact@dot1.media</a>
        <a href="https://www.dot1.media/privacy-policy">Privacy policy</a>
      </div>
    </div>
    <div class="legal"><div class="in">
      <span>&copy; ${year} DOT ONE LLC. All rights reserved.</span>
      <span>Wasilla, Alaska &middot; Create with purpose.</span>
    </div></div>
  </footer>`;
}

export function page(opts: {
  title: string;
  desc: string;
  url: string;
  image?: string | null;
  ogType?: string;
  extraCss?: string;
  inner: string;
}): string {
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.desc)}">
<link rel="canonical" href="${esc(opts.url)}">
<meta property="og:site_name" content="Dot 1 News">
<meta property="og:type" content="${opts.ogType || 'website'}">
<meta property="og:title" content="${esc(opts.title)}">
<meta property="og:description" content="${esc(opts.desc)}">
<meta property="og:url" content="${esc(opts.url)}">
${opts.image ? `<meta property="og:image" content="${esc(opts.image)}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">` : ''}
<meta name="twitter:card" content="${opts.image ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${esc(opts.title)}">
<meta name="twitter:description" content="${esc(opts.desc)}">
${opts.image ? `<meta name="twitter:image" content="${esc(opts.image)}">` : ''}
<meta name="apple-itunes-app" content="app-id=6757212352">
<meta name="theme-color" content="${C.paper}">
<style>${SITE_CSS}${opts.extraCss || ''}</style></head>
<body>${opts.inner}</body></html>`;
}
