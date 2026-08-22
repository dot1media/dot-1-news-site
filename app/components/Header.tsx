import { APP_STORE } from '@/lib/theme';

export default function Header() {
  return (
    <header className="bar"><div className="in">
      <a className="wm" href="/">DOT&nbsp;<span>1</span>&nbsp;NEWS</a>
      <nav className="nav">
        <a href="/">Today</a>
        <a href="/#lens">The Lens</a>
        <a href="/#reel">The Reel</a>
        <a href="/score">Score a Story</a>
        <a href="/archive">Archive</a>
        <a href="https://www.dot1.media">Dot One Media</a>
        <a className="getapp" href={APP_STORE}>Get the app</a>
      </nav>
    </div></header>
  );
}
