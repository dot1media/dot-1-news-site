'use client';

import { useEffect, useState } from 'react';

// Light / Ink toggle. Defaults to the reader's system preference; a manual
// choice is remembered in localStorage and applied as data-theme on <html>.
export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    const attr = document.documentElement.getAttribute('data-theme') as 'light' | 'dark' | null;
    const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(attr || sys);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('d1-theme', next); } catch { /* private mode */ }
  };

  // Render nothing until mounted so server and client markup match.
  if (!theme) return null;

  return (
    <button onClick={toggle} className="themetoggle" aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to Ink (dark) mode'} title={theme === 'dark' ? 'Light' : 'Ink'}>
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
