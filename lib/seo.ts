import { SITE_URL, clip } from './theme';

// JSON-LD builders. One Organization and one WebSite node, referenced by @id
// from every article so search engines resolve a single publisher identity.

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

export function organizationNode() {
  return {
    '@type': 'NewsMediaOrganization',
    '@id': ORG_ID,
    name: 'Dot 1 News',
    url: SITE_URL + '/',
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/news-logo.png`, width: 249, height: 560 },
    image: `${SITE_URL}/news-logo.png`,
    slogan: 'A declared standpoint, not a hidden one.',
    foundingDate: '2025',
    sameAs: ['https://instagram.com/dot1news', 'https://facebook.com/dot1news', 'https://dot1.media'],
    areaServed: { '@type': 'State', name: 'Alaska' },
    parentOrganization: { '@type': 'Organization', name: 'Dot One Media', url: 'https://dot1.media' },
  };
}

export function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL + '/',
    name: 'Dot 1 News',
    description: 'A daily edition from Wasilla, Alaska. A few stories, each with the reason it ran, scored across four measures.',
    inLanguage: 'en-US',
    publisher: { '@id': ORG_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/archive?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** The home page graph: who the publisher is and that this is their site. */
export function homeGraph() {
  return { '@context': 'https://schema.org', '@graph': [organizationNode(), websiteNode()] };
}

interface ArticleSeo {
  id: string;
  title: string;
  summary?: string | null;
  image?: string | null;
  category?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
}

export function newsArticleGraph(a: ArticleSeo) {
  const url = `${SITE_URL}/s/n/${encodeURIComponent(a.id)}`;
  const img = a.image || `${SITE_URL}/og/n/${encodeURIComponent(a.id)}`;
  const published = a.publishedAt ? new Date(a.publishedAt).toISOString() : undefined;
  const modified = a.updatedAt ? new Date(a.updatedAt).toISOString() : published;
  const article: Record<string, any> = {
    '@type': 'NewsArticle',
    '@id': url + '#article',
    headline: clip(a.title, 110),
    description: a.summary ? clip(a.summary, 250) : undefined,
    image: [img],
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    articleSection: a.category || 'News',
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    url,
    datePublished: published,
    dateModified: modified,
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [article, organizationNode(), breadcrumbNode(a.category || 'News', url, a.title)],
  };
}

export function photoGraph(a: ArticleSeo) {
  const url = `${SITE_URL}/s/p/${encodeURIComponent(a.id)}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ImageObject',
        '@id': url + '#image',
        name: clip(a.title, 110),
        description: a.summary ? clip(a.summary, 250) : undefined,
        contentUrl: a.image || undefined,
        uploadDate: a.publishedAt ? new Date(a.publishedAt).toISOString() : undefined,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        creditText: 'Dot 1 News',
        copyrightNotice: 'Dot 1 News',
        isAccessibleForFree: true,
      },
      organizationNode(),
      breadcrumbNode('The Lens', url, a.title),
    ],
  };
}

export function videoGraph(a: ArticleSeo & { videoUrl?: string | null }) {
  const url = `${SITE_URL}/s/v/${encodeURIComponent(a.id)}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'VideoObject',
        '@id': url + '#video',
        name: clip(a.title, 110),
        description: a.summary ? clip(a.summary, 250) : clip(a.title, 200),
        thumbnailUrl: a.image ? [a.image] : undefined,
        contentUrl: a.videoUrl || undefined,
        uploadDate: a.publishedAt ? new Date(a.publishedAt).toISOString() : undefined,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        publisher: { '@id': ORG_ID },
      },
      organizationNode(),
      breadcrumbNode('The Reel', url, a.title),
    ],
  };
}

function breadcrumbNode(section: string, url: string, title: string) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Dot 1 News', item: SITE_URL + '/' },
      { '@type': 'ListItem', position: 2, name: section },
      { '@type': 'ListItem', position: 3, name: clip(title, 70), item: url },
    ],
  };
}
