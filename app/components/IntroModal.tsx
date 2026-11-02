'use client';

import { useEffect, useState } from 'react';

// First-visit welcome. Explains what Dot 1 News is (a way to read the news,
// not another feed of it) once per browser, then stays out of the way. The
// flag is remembered in localStorage; reads and writes are guarded so a
// private window or blocked storage simply shows it again rather than breaking.
const KEY = 'd1-intro-seen';

export default function IntroModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* storage unavailable: skip the intro rather than error */
    }
  }, []);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
  }

  if (!show) return null;

  return (
    <div
      className="introwrap"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Dot 1 News"
      onClick={dismiss}
    >
      <div className="introcard" onClick={(e) => e.stopPropagation()}>
        <button className="introx" aria-label="Dismiss" onClick={dismiss}>
          &times;
        </button>
        <div className="introkick">A Declared Standpoint</div>
        <h2 className="introtitle">
          We don&rsquo;t break the news.
          <br />
          We help you read it.
        </h2>
        <p className="introbody">
          A few stories a day, each drawn from several outlets and weighed through
          four lenses, so you can discern the news for yourself.
        </p>
        <div className="introactions">
          <button className="introbtn" onClick={dismiss}>
            Read today&rsquo;s edition
          </button>
          <a className="introlink" href="/discernment" onClick={dismiss}>
            How to read the news &rsaquo;
          </a>
        </div>
      </div>
    </div>
  );
}
