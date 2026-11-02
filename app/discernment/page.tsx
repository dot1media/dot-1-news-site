import type { Metadata } from 'next';
import { SITE_URL, APP_STORE } from '@/lib/theme';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

export const metadata: Metadata = {
  title: 'How to Read the News · Dot 1 News',
  description: 'A reader’s guide to discernment. Four questions to ask of any news story, from any outlet, so you can weigh what you read and decide what it means for your life.',
  alternates: { canonical: SITE_URL + '/discernment' },
};

export default function DiscernmentPage() {
  return (
    <>
      <Header />
      <main className="shell">
        <article className="docpage">
          <div className="kicker">A Reader&rsquo;s Guide</div>
          <h1>How to Read the News</h1>
          <p className="lead">The hard part of the news is not finding it. It is reading it well. This is the method we use on every story, laid out so you can use it too, on anything you read, from any outlet, not only ours.</p>

          <h2>Before you believe it, share it, or let it move you</h2>
          <p>A story arrives already shaped. Someone chose what to report, what to leave out, which words to use, and whose voice to carry. None of that makes it false. It just means a headline is the beginning of the work, not the end of it. Discernment is the habit of slowing down long enough to ask a few honest questions before a story does its work on you. Here are the four we ask.</p>

          <h2>The four questions</h2>
          <p>We score each of these as a lens, but you do not need our scores to use them. Read them together, because a story can do well on one and poorly on another, and the shape of the answers tells you how to hold it.</p>
          <ul className="names">
            <li><span className="role">1. What worldview is framing this?</span><span className="person">Every story assumes something about truth, about people, and about what matters, whether it says so or not. Name the assumptions you can see. We read with a declared Christian standpoint and tell you so; the outlet you are reading has one too, even when it claims it does not. (This is the lens we call Biblical Alignment.)</span></li>
            <li><span className="role">2. Does this connect to a deeper pattern, or is it noise?</span><span className="person">Some news is momentary; some of it touches older and larger things. Ask which this is, and hold the answer with restraint. Significance is not the same as prediction, and a story being ordinary is not a flaw. (Prophetic Significance.)</span></li>
            <li><span className="role">3. How do they actually know this?</span><span className="person">The most important question and the easiest to skip. Is the claim firsthand or secondhand? Is it one anonymous source repeated everywhere, or several independent ones? Does the outlet show its work? Thin sourcing does not make a thing false, but it tells you how firmly to hold it. (Source Credibility.)</span></li>
            <li><span className="role">4. Who bears the weight, and are they treated as people?</span><span className="person">Follow the human cost of the story. Who is affected, whose voice is present, and are they treated as persons with dignity or as props in an argument? A story can be accurate and still fail here. (Humanities Impact.)</span></li>
          </ul>

          <h2>You do not have to share our standpoint to use this</h2>
          <p>We are Christ-centered, and we say so. But three of these four questions, how something is sourced, whether it connects to real patterns, and how it treats the people in it, are questions anyone can ask of anyone&rsquo;s reporting. The first question, about worldview, simply asks you to name the lens in play, including ours. Honest reading does not require agreement. It requires attention.</p>

          <h2>Read the shape, not the score</h2>
          <p>No single number settles a story. A report can be well-sourced but hard on the people in it, or morally serious but thin on evidence. The pattern across the four questions is the real signal. When the sourcing is weak, hold the facts loosely no matter how the rest reads. When the human cost is heavy, slow down no matter how it is framed.</p>

          <h2>How we try to help</h2>
          <p>On every story we run, we show our answers across the four lenses, link the outlets we drew from so you can check the reporting yourself, and keep the edition short so you have room to think. You can read how the scoring works on <a className="ln" href="/d1-4ls">The Four-Lens Score</a>, see the standards we hold ourselves to on our <a className="ln" href="/standards">Standards &amp; Ethics</a> page, and try the method yourself with our <a className="ln" href="/score">Score a Story</a> tool. The habit is portable: once it is yours, you can carry it to everything you read.</p>

          <div className="callout" style={{ marginTop: 32 }}>
            <h3>Carry the practice with you.</h3>
            <p>The Dot 1 News app brings a few chosen stories a day, each drawn from several outlets and weighed through the four lenses, with the reason it ran.</p>
            <a className="btn" href={APP_STORE}>Get Dot 1 News &rsaquo;</a>
          </div>

          <div className="updated">Dot One Media, Wasilla, Alaska. A declared standpoint. Interpreting the times.</div>
        </article>
      </main>
      <Footer />
    </>
  );
}
