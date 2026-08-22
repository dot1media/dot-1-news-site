/**
 * Design tokens for the web edition, ported verbatim from the app's
 * siteChrome so the standalone site is visually identical to what readers
 * already know. One palette, one voice.
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
export const SITE_URL = (process.env.PUBLIC_WEB_URL || 'https://news.dot1.media').replace(/\/$/, '');

export function clip(s: string, n: number): string {
  const t = (s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1) + '\u2026' : t;
}

export function alaskaDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/Anchorage',
  });
}
