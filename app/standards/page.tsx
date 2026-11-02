import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/theme';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

export const metadata: Metadata = {
  title: 'Editorial Standards & Ethics · Dot 1 News',
  description: 'Dot 1 News is a tool for discerning the news. Our editorial standards, ownership, independence, sourcing, ethics, and AI-use policy: a declared standpoint, cited sourcing, human approval, and openly published scoring.',
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
          <p className="lead">How a story earns its place in the edition, who stands behind it, and how we hold ourselves to it. We ask the news to declare its method, so we declare ours, in full.</p>

          <h2>Our purpose</h2>
          <p>Dot 1 News exists to help you discern the news, not to break it. The events we cover are reported first by other outlets. Our work is to read that coverage, write it up plainly, and weigh it through one consistent method, so you can interpret the news for yourself and decide what it means for your life. We are a layer of discernment over the news, not a competitor to the newsrooms that gather it. We build on their reporting, credit it, and link to it on every story.</p>

          <h2>A declared standpoint</h2>
          <p>Because our work is interpretation, we owe you the lens we interpret through. We are Christ-centered, and we say so. A standpoint you can see is one you can weigh, and a tool for discernment that hid its own would be the very thing it warns against. We do not pretend to a view from nowhere. Declaring our lens is a commitment to fairness, not a license to abandon it: a story is reported accurately and its subjects treated justly whether or not they share our convictions.</p>

          <h2>Ownership and funding</h2>
          <p>Dot 1 News is owned and published by DOT ONE LLC, doing business as Dot One Media, a veteran-owned company based in Wasilla, Alaska. The newsroom is funded entirely by its parent company. It is free to read, carries no advertising, no sponsored content, and no paywall.</p>
          <p>We accept no money, gifts, trips, or favors from the people, companies, campaigns, or institutions we cover, and no outside investor, advertiser, or donor has any stake in or influence over our reporting. If that ever changes, we will disclose it here before it affects a single story.</p>

          <h2>Editorial independence</h2>
          <p>Editorial decisions are made by the newsroom alone. The business interests of our parent company do not shape what we cover, how we cover it, or what we conclude. Coverage, corrections, and placement are never for sale, and no story is ever withheld, softened, or run as a favor. The people who decide what publishes answer to our readers and to the standards on this page, not to any commercial relationship.</p>

          <h2>How our stories are made, and our use of AI</h2>
          <p>Every story is written by a person, built on the reporting other outlets have already published about an event, which we credit and link. Our newsroom uses AI as a research and drafting assistant: it gathers that source reporting, lays out what each source says, and assembles an initial brief with a link to every original. It drafts only from those cited, linked sources, never from its own memory, and it never invents a fact, a quote, a name, a number, or a source.</p>
          <p>A journalist then reviews those sources and writes the story. The AI is a tool, never a decision-maker: it does not choose what runs, and it does not have the final word on anything you read. Every article states plainly how it was made, and the original sources are linked at the foot of each one. We tell you this openly because a newsroom that hides its method has no business asking you to trust it.</p>

          <h2>A human approves everything</h2>
          <p>Nothing reaches you because a machine decided it should. An editor reviews and approves every story before it publishes. Not everything true is worth your attention today, and deciding what is remains our whole work.</p>

          <h2>Sourcing and attribution</h2>
          <p>We attribute what we report and link to the sources a story rests on, so you can check our work. We corroborate claims where we can and say plainly when something is unconfirmed. We do not fabricate, and we do not pass off anyone else&rsquo;s work as our own. Anonymous sources are a last resort, used only when the information is important and cannot be had another way, and only with an editor&rsquo;s approval; when we grant anonymity, we say why.</p>

          <h2>Accuracy, verification, and the D1-4LS score</h2>
          <p>Before a story publishes, an editor assigns it a verification status, and most stories run only once they are verified. When a story runs ahead of full confirmation, we label it so rather than let it pass as settled. In the Dot 1 News app, a colored marker shows each story&rsquo;s status at a glance.</p>
          <p>Every story is also measured against one standard, the Dot One Four-Lens Scoring Model (D1-4LS), across four lenses: Biblical Alignment, Prophetic Significance, Source Credibility, and Humanities Impact. Each lens is built from five indicators and the full breakdown sits open behind every story. The score describes a story&rsquo;s profile; it is a starting point for thinking, not a verdict. A high score does not mean a story is true, good, or endorsed by us, and a low score does not mean it is false or unimportant. Scores are reviewed by more than one rater so no single person decides a story alone. The method is explained on <a className="ln" href="/d1-4ls">The Four-Lens Score</a>, and you can <a className="ln" href="/score">score a story yourself</a> with the same lens. The D1-4LS is an experimental framework we are still testing, and we welcome feedback at <a className="ln" href="mailto:contact@dot1.media">contact@dot1.media</a>.</p>

          <h2>Conflicts of interest</h2>
          <p>We disclose, and where needed step back from, any personal, financial, family, or political connection that could compromise a story or how it looks. Our journalists do not report on matters in which they have a stake, do not accept gifts or payment that could be read as buying coverage, and keep their public political activity separate from their work for the newsroom. Our declared faith commitment is stated openly for the same reason: so you can account for it rather than be surprised by it.</p>

          <h2>Corrections</h2>
          <p>When we get a fact wrong, we fix it openly and say what changed, so the record and the fix travel together. Getting it right matters more than looking like we were right. See our <a className="ln" href="/corrections">Corrections</a> policy for how to flag an error and how corrections appear.</p>

          <h2>Independence, in one line</h2>
          <p>Dot 1 News is veteran-owned and independently run from Wasilla, Alaska, as a publication of Dot One Media. We do not chase the eye. We turn it toward the light.</p>

          <div className="updated">Published by Dot One Media (DOT ONE LLC). Questions: contact@dot1.media. Last reviewed November 2026.</div>
        </article>
      </main>
      <Footer />
    </>
  );
}
