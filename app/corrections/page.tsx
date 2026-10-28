import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/theme';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

export const metadata: Metadata = {
  title: 'Corrections · Dot 1 News',
  description: 'How Dot 1 News corrects the record: our commitment to fixing errors openly and promptly, and how to request a correction.',
  alternates: { canonical: SITE_URL + '/corrections' },
};

export default function CorrectionsPage() {
  return (
    <>
      <Header />
      <main className="shell">
        <article className="docpage">
          <div className="kicker">Corrections</div>
          <h1>Corrections</h1>
          <p className="lead">We correct the record openly and promptly. Getting it right matters more than looking like we were right.</p>

          <h2>Our commitment</h2>
          <p>When we get a fact wrong, we fix it and say what changed. A newsroom that asks for your trust owes you a clear account of its mistakes, not a quiet edit. Corrections are part of how we earn the standpoint we declare.</p>

          <h2>How to request a correction</h2>
          <p>If you believe a story contains an error, email <a className="ln" href="mailto:contact@dot1.media">contact@dot1.media</a> with the headline or link and what you believe is wrong. Please include a source where you can. A person reads and reviews every request.</p>

          <h2>How corrections appear</h2>
          <p>When a correction is warranted, we update the story and note what was changed, so the record and the fix travel together. Significant corrections are made visible on the story itself, not hidden.</p>

          <h2>A note on method</h2>
          <p>Because our stories are built only from cited, linked sources and approved by an editor, many questions can be checked against the sources a story already carries. Where a source itself was wrong, we say so. How our stories are made and scored is described on our <a className="ln" href="/standards">Standards &amp; Ethics</a> page.</p>

          <div className="updated">Published by Dot One Media, Wasilla, Alaska.</div>
        </article>
      </main>
      <Footer />
    </>
  );
}
