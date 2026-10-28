import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/theme';
import { organizationNode } from '@/lib/seo';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

// About is the E-E-A-T anchor: declare the publisher entity here too, with an
// AboutPage pointing at it, so search engines tie the masthead to the org.
const aboutGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    organizationNode(),
    {
      '@type': 'AboutPage',
      '@id': `${SITE_URL}/about#page`,
      url: `${SITE_URL}/about`,
      name: 'About Dot 1 News',
      about: { '@id': `${SITE_URL}/#organization` },
      isPartOf: { '@id': `${SITE_URL}/#website` },
    },
  ],
};

export const metadata: Metadata = {
  title: 'About & Masthead · Dot 1 News',
  description: 'Dot 1 News is a small daily edition from Wasilla, Alaska, a veteran-owned, faith-driven publication of Dot One Media. Who we are and who runs it.',
  alternates: { canonical: SITE_URL + '/about' },
};

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutGraph) }} />
      <Header />
      <main className="shell">
        <article className="docpage">
          <div className="kicker">About</div>
          <h1>About Dot 1 News</h1>
          <p className="lead">A small daily edition from Wasilla, Alaska. A few stories, each carrying the reason it ran, and then the edition ends.</p>

          <h2>Who we are</h2>
          <p>Dot 1 News is a veteran-owned, faith-driven newsroom and a publication of Dot One Media (DOT ONE LLC). We are unapologetically Christ-centered, and we tell you so on purpose. Naming our lens is what lets you weigh our reporting honestly, rather than guessing at a standpoint we tried to hide.</p>
          <p>Beneath that lens is common ground we hold with every reader: every person carries inviolable dignity, truth is worth the discipline it costs, and your attention is a finite and sacred thing that should never be stolen.</p>

          <h2>What makes us different</h2>
          <ul>
            <li>The edition ends. It is not an endless feed, and nothing here is engineered to hold your attention longer than a story deserves.</li>
            <li>Every story carries the reason it ran, in plain language.</li>
            <li>Every story is scored and carries a verification status you can see, and every story states how it was made. The full detail is on our <a className="ln" href="/standards">Standards &amp; Ethics</a> page.</li>
          </ul>

          <h2>Masthead</h2>
          <ul className="names">
            <li><span className="role">Founder &amp; Editor</span><span className="person">Dennis Matthews Jr.</span></li>
            <li><span className="role">Photography, The Lens</span><span className="person">Dot One Photography</span></li>
            <li><span className="role">Published by</span><span className="person">Dot One Media (DOT ONE LLC), Wasilla, Alaska</span></li>
          </ul>

          <h2>Contact</h2>
          <p>General inquiries and story tips: <a className="ln" href="mailto:contact@dot1.media">contact@dot1.media</a>. For help with the app or the site: <a className="ln" href="mailto:support@dot1.media">support@dot1.media</a>. To request a correction, see our <a className="ln" href="/corrections">Corrections</a> page.</p>

          <div className="updated">Dot One Media, Wasilla, Alaska. Create with purpose.</div>
        </article>
      </main>
      <Footer />
    </>
  );
}
