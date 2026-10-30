import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/theme';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

export const metadata: Metadata = {
  title: 'The Four-Lens Assessment (D1-4LS) · Dot 1 News',
  description: 'How Dot 1 News assesses stories across four lenses: biblical alignment, prophetic relevance, source credibility, and human impact. An experimental framework still being tested, and your feedback is welcome.',
  alternates: { canonical: SITE_URL + '/d1-4ls' },
};

export default function D14LSPage() {
  return (
    <>
      <Header />
      <main className="shell">
        <article className="docpage">
          <div className="kicker">Methodology</div>
          <h1>The Four-Lens Assessment</h1>
          <p className="lead">Every news story has more than one dimension. We look at each story through four lenses and show you what we see, so you can weigh it for yourself.</p>

          <div className="pilotcard">
            <strong>This is a work in progress.</strong> D1-4LS is an experimental assessment framework we are actively testing and refining. The scores are meant to support discernment, not replace your own judgment, and the method will keep changing as we learn. We would genuinely value your input: tell us what helps, what confuses, and what you would do differently at <a className="ln" href="mailto:contact@dot1.media?subject=D1-4LS%20feedback">contact@dot1.media</a>.
          </div>

          <h2>The four lenses</h2>
          <p>Each lens is scored from 0 to 10, built from five smaller indicators. The four lens scores are the real result and are meant to be read together. They measure very different things, so a high score on one says nothing about the others.</p>
          <ul className="names">
            <li><span className="role">Biblical Alignment (BAI)</span><span className="person">Whether the article&rsquo;s framing is coherent with our declared biblical reference standard. A high BAI does not mean the facts are verified or that every Christian tradition would agree.</span></li>
            <li><span className="role">Prophetic Significance (PSI)</span><span className="person">Whether the subject relates to defined biblical prophetic themes, held with restraint. This is thematic relevance only. It is never a prediction, a claim of fulfillment, or date-setting. A low PSI is normal for ordinary news and does not mean weak journalism.</span></li>
            <li><span className="role">Source Credibility (SCI)</span><span className="person">How well the story&rsquo;s factual claims are sourced and checked. This is about evidence only, and it is separate from theological alignment. When sourcing is thin, we say so plainly.</span></li>
            <li><span className="role">Humanities Impact (HII)</span><span className="person">How the story recognizes human dignity, consequences, and responsibility. A low score can simply mean the consequences are local in scope, not that the reporting lacks compassion.</span></li>
          </ul>

          <h2>How to read a score</h2>
          <ul>
            <li>Read the four lenses together, not the total. The composite out of 40 is only a rough summary, shown second.</li>
            <li>Two stories can share the same total while being very different. The pattern across the four lenses matters more than the sum.</li>
            <li>A high score does not mean a story is true, morally good, prophetically fulfilled, or endorsed by Dot 1 News. A low score does not mean it is false or unimportant.</li>
            <li>When Source Credibility is low, we show a sourcing notice. Please weigh the factual claims accordingly.</li>
            <li>Our editorial verification status is shown separately from the score. The two are not the same thing.</li>
          </ul>

          <h2>How it is assessed</h2>
          <p>A first-pass assessment is drafted with the help of our newsroom tools, then reviewed by a person before publication. Scores are recorded with the version of the method used to produce them. We do not quietly re-score old articles under a new version; a reassessment is a new, dated round with its own record.</p>

          <h2>Help us improve it</h2>
          <p>D1-4LS is a pilot, and honest outside input is exactly what it needs. If a score seems off, if the labels are unclear, or if you think a lens is measuring the wrong thing, write to us at <a className="ln" href="mailto:contact@dot1.media?subject=D1-4LS%20feedback">contact@dot1.media</a>. We read every note.</p>

          <div className="updated">An experimental framework undergoing review. Dot One Media, Wasilla, Alaska.</div>
        </article>
      </main>
      <Footer />
    </>
  );
}
