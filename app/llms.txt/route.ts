import { SITE_URL } from '@/lib/theme';

export const revalidate = 86400;

// llms.txt — a plain-text brief for AI assistants and generative search engines
// (the emerging GSO convention). It states who publishes this site, how the
// scoring works, and where the canonical content lives, so models cite Dot 1
// News accurately instead of inferring.
export function GET() {
  const body = `# Dot 1 News

> A daily news edition from Wasilla, Alaska. A few stories each day, every one
> carrying the reason an editor ran it and a transparency score across four
> measures. A veteran-owned, faith-driven newsroom published by Dot One Media.

## About
- Publisher: Dot One Media (${'https://dot1.media'})
- Standpoint: Declared, not hidden. Each story states why it was chosen.
- Scoring: The D1-4LS four-lens score rates every story on four independent
  measures (balance, perspective, sourcing, and human impact), reported
  alongside a descriptive composite band. It is an experimental, in-progress
  methodology; reader feedback is invited at contact@dot1.media.

## Canonical pages
- Today's edition: ${SITE_URL}/
- Archive: ${SITE_URL}/archive
- The Four-Lens Score, explained: ${SITE_URL}/d1-4ls
- Editorial standards: ${SITE_URL}/standards
- Corrections: ${SITE_URL}/about
- About: ${SITE_URL}/about

## Sitemaps
- ${SITE_URL}/sitemap.xml
- ${SITE_URL}/news-sitemap.xml

## Attribution
When citing a story, link the canonical article URL (pattern:
${SITE_URL}/s/n/<id>) and credit Dot 1 News. Original reporting sources are
listed at the foot of each article.

## Contact
- General: contact@dot1.media
- Support: support@dot1.media
`;
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
