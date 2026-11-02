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
  description: 'Dot 1 News is a tool for discerning the news, not another outlet racing to break it. A veteran-owned, faith-driven publication of Dot One Media in Wasilla, Alaska. Who we are and who runs it.',
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
          <p className="lead">Dot 1 News is a tool for discerning the news, not another outlet racing to break it. We take the events other outlets report, write them up plainly, and weigh them through a method you can see, so you can interpret the news for yourself and decide what it means for your life.</p>

          <h2>Why we exist</h2>
          <p>The world is not short on news. It is drowning in it. The same event is reported by a dozen outlets, each through its own lens, and you are left to sort truth from spin and noise from significance on your own, usually with no time and no tools. That is the work we exist to help with. We are not here to add one more voice to the pile. We are here to help you read the pile.</p>
          <p>We are a veteran-owned, faith-driven publication of Dot One Media (DOT ONE LLC), based in Wasilla, Alaska.</p>

          <h2>What we are, and what we are not</h2>
          <ul>
            <li>We are a layer of discernment over the news. We read widely, write each story up plainly, and weigh it through the Dot One Four-Lens Score so you can see a story&rsquo;s shape, not just its claims.</li>
            <li>We are not a wire service or a breaking-news outlet, and we are not trying to replace the newsrooms that do original reporting. We build on their work, credit it, and link to it, and we help you read it well.</li>
            <li>The edition ends. It is not an endless feed, and nothing here is engineered to hold your attention longer than a story deserves.</li>
          </ul>

          <h2>Why we declare our standpoint</h2>
          <p>Because our work is interpretation, we owe you the lens we interpret through. We are Christ-centered, and we say so, on purpose. A tool for discernment that hid its own standpoint would be the very thing it warns against. Naming our lens is what lets you weigh our reading honestly, rather than guessing at a view we tried to hide.</p>
          <p>Beneath that lens is common ground we hold with every reader: every person carries inviolable dignity, truth is worth the discipline it costs, and your attention is a finite and sacred thing that should never be stolen. How we read, score, and correct the news is set out in full on our <a className="ln" href="/standards">Standards &amp; Ethics</a> page, and the scoring method is explained on <a className="ln" href="/d1-4ls">The Four-Lens Score</a>.</p>

          <h2>Masthead</h2>
          <ul className="names">
            <li><span className="role">Founder &amp; Editor</span><span className="person">Dennis Matthews Jr.</span></li>
            <li><span className="role">Staff Photojournalist, The Lens</span><span className="person">Brittany Matthews</span></li>
            <li><span className="role">Published by</span><span className="person">Dot One Media (DOT ONE LLC)</span></li>
            <li><span className="role">Based in</span><span className="person">Wasilla, Alaska</span></li>
            <li><span className="role">Founded</span><span className="person">2025</span></li>
          </ul>

          <h2>Ownership &amp; funding</h2>
          <p>Dot 1 News is owned and published by DOT ONE LLC, doing business as Dot One Media, a veteran-owned company based in Wasilla, Alaska. The newsroom is funded by its parent company. It is free to read, carries no advertising, no sponsored content, and no paywall, and it takes no money from any person or interest it covers. No outside investor, advertiser, or donor has any say in what we publish.</p>

          <h2>Contact</h2>
          <p>General inquiries and story tips: <a className="ln" href="mailto:contact@dot1.media">contact@dot1.media</a>. For help with the app or the site: <a className="ln" href="mailto:support@dot1.media">support@dot1.media</a>. To request a correction, see our <a className="ln" href="/corrections">Corrections</a> page.</p>
          <p>Mailing address: Dot One Media, PO Box 870935, Wasilla, AK 99687.</p>

          <div className="updated">Published by Dot One Media (DOT ONE LLC), Wasilla, Alaska. Create with purpose. Last reviewed November 2026.</div>
        </article>
      </main>
      <Footer />
    </>
  );
}
