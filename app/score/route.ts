import { renderScorePage, renderSharedScorecard } from '@/lib/scorePage';
import { SITE_URL } from '@/lib/theme';

export const dynamic = 'force-dynamic';

// Served as a route handler (not a React page) because the score page is a
// complete, self-contained HTML document with its own <head> and inline JS.
// Returning it directly avoids nesting it inside the app layout's <html>.
//
// The shared-scorecard format matches the app exactly so links shared from
// either place render identically: four dot-separated groups of five digits
// (0..2), one group per index (BAI, PSI, SCI, HII).

function parseScoreParam(raw: string | null): Record<string, number[]> | null {
  if (!raw) return null;
  const keys = ['BAI', 'PSI', 'SCI', 'HII'];
  const groups = raw.split('.');
  if (groups.length !== 4) return null;
  const out: Record<string, number[]> = {};
  for (let i = 0; i < 4; i++) {
    const g = groups[i];
    if (!/^[0-2]{5}$/.test(g)) return null;
    out[keys[i]] = g.split('').map((d) => parseInt(d, 10));
  }
  return out;
}

function compositeOf(scores: Record<string, number[]>): number {
  const keys = ['BAI', 'PSI', 'SCI', 'HII'];
  let total = 0;
  for (const k of keys) total += (scores[k] || []).reduce((a, b) => a + b, 0);
  return total / keys.length;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const selfUrl = `${SITE_URL}/score`;
  const scores = parseScoreParam(searchParams.get('s'));
  const title = (searchParams.get('t') || '').slice(0, 180);

  const html = scores
    ? renderSharedScorecard({ url: selfUrl, title, scores, composite: compositeOf(scores) })
    : renderScorePage({ url: selfUrl, prefillTitle: title || undefined });

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
