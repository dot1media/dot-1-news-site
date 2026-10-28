import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/theme';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

export const metadata: Metadata = {
  title: 'Editorial Standards & Ethics · Dot 1 News',
  description: 'How a story earns its place in Dot 1 News: a declared standpoint, AI drafts built only from cited sources, human approval, a visible verification status, and the D1-4LS score, shown openly.',
  alternates: { canonical: SITE_URL + '/standards' },
};

export default function StandardsPage() {
  return (
    <>
      <Header />
      <main className="shell">
        <article className="docpage">
          <div className="kicker">Standards</div>
          <h1>Editorial Standards &amp; Ethics</h1>
          <p className="lead">How a story earns its place in the edition, and how we hold ourselves to it. We ask the news to declare its method, so we declare ours.</p>

          <h2>A declared standpoint</h2>
          <p>We are Christ-centered, and we say so. A standpoint you can see is one you can weigh. We do not pretend to a view from nowhere, and we do not hide the lens through which we choose and read the news.</p>

          <h2>How our stories are made</h2>
          <p>Our newsroom AI drafts briefs strictly from cited, linked sources, never from its own memory. It is a research and drafting tool, not a decision-maker. A person decides whether you ever see a story, and every article states plainly how it was made.</p>

          <h2>A human approves everything</h2>
          <p>Nothing reaches you because a machine decided it should. An editor reviews and approves every story before it publishes. Not everything true is worth your attention today, and deciding what is remains our whole work.</p>

          <h2>Verification status</h2>
          <p>Every story carries a reader-facing status, set by an editor, so you know how firm the ground is:</p>
          <ul>
            <li><strong>Verified</strong> (gold): confirmed and stood behind by an editor.</li>
            <li><strong>Pending verification</strong> (orange): developing, with details still being confirmed.</li>
            <li><strong>Unverified</strong> (red): running ahead of full confirmation, and labeled so.</li>
          </ul>

          <h2>The D1-4LS score</h2>
          <p>Every story is measured against one standard, the Dot One Four-Lens Scoring Model, across four lenses: Biblical Alignment, Prophetic Significance, Source Credibility, and Humanities Impact. Each lens is built from five indicators. The scores sit open behind every story, and you can see the full breakdown. A high score does not mean a story is true, and a low one does not mean it is false; the number is a starting point for thinking, not a substitute for it. Scores are dual-rated, so no single rater decides a story alone. You can <a className="ln" href="/score">score a story yourself</a> with the same lens.</p>

          <h2>Sourcing and corrections</h2>
          <p>We link to the sources a story rests on so you can check our work. When we get something wrong, we fix it openly and say what changed. See our <a className="ln" href="/corrections">Corrections</a> policy.</p>

          <h2>Independence</h2>
          <p>Dot 1 News is veteran-owned and independently run from Wasilla, Alaska, as a publication of Dot One Media. We do not chase the eye. We turn it toward the light.</p>

          <div className="updated">Published by Dot One Media. Questions: contact@dot1.media</div>
        </article>
      </main>
      <Footer />
    </>
  );
}
