import { APP_STORE } from '@/lib/theme';
import NewsLogo from "@/app/components/NewsLogo";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="foot">
      <div className="in">
        <div>
          <div className="wm">DOT&nbsp;<NewsLogo h="1.3em" />&nbsp;NEWS</div>
          <div className="motto">A declared standpoint, not a hidden one.</div>
          <p className="blurb">A small, human-edited daily paper. Every story is read and approved by a person before it reaches you, and every story tells you why it ran. A veteran-owned, faith-driven newsroom in Wasilla, Alaska.</p>
        </div>
        <div>
          <h4>Read</h4>
          <a href="/">Today&rsquo;s edition</a>
          <a href="/#lens">The Lens</a>
          <a href="/#reel">The Reel</a>
          <a href="/score">Score a Story</a>
          <a href="/archive">Archive</a>
          <a href={APP_STORE}>Get the app</a>
        </div>
        <div>
          <h4>The Standpoint</h4>
          <a href="/about">About &amp; Masthead</a>
          <a href="/standards">Standards &amp; Ethics</a>
          <a href="/corrections">Corrections</a>
          <a href="https://www.dot1.media/#news">How we score the news</a>
        </div>
        <div>
          <h4>Dot One Media</h4>
          <a href="https://www.dot1.media">dot1.media</a>
          <a href="https://instagram.com/dot1media">Instagram</a>
          <a href="mailto:contact@dot1.media">contact@dot1.media</a>
          <a href="https://www.dot1.media/privacy-policy">Privacy policy</a>
        </div>
      </div>
      <div className="legal"><div className="in">
        <span>&copy; {year} DOT ONE LLC. All rights reserved.</span>
        <span>Wasilla, Alaska &middot; Create with purpose.</span>
      </div></div>
    </footer>
  );
}
