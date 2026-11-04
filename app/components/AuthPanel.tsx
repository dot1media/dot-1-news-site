'use client';

import { useState, useEffect } from 'react';
import { type AppUser, login, register, signInWithApple } from '@/lib/appApi';

const APP_STORE = 'https://apps.apple.com/us/app/dot-1-news/id6757212352';

// Sign in with Apple (web) is enabled only once these are configured, so the
// button never appears broken before the Apple Developer setup is done.
const APPLE_CLIENT_ID = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || '';
const APPLE_REDIRECT_URI = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI || '';
const APPLE_ENABLED = !!(APPLE_CLIENT_ID && APPLE_REDIRECT_URI);
const APPLE_SDK = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

// Mirror of the backend password policy, so we can guide before submitting.
const PW_RULES: { test: (s: string) => boolean; label: string }[] = [
  { test: (s) => s.length >= 8, label: 'At least 8 characters' },
  { test: (s) => /[a-z]/.test(s), label: 'A lowercase letter' },
  { test: (s) => /[A-Z]/.test(s), label: 'An uppercase letter' },
  { test: (s) => /[0-9]/.test(s), label: 'A number' },
  { test: (s) => /[^a-zA-Z0-9]/.test(s), label: 'A special character' },
];

/**
 * The shared sign-in / create-account panel. Used in the article comments box
 * and on the /account page. The create form carries the daily-edition opt-in
 * and live password-rule hints. On success it hands back the signed-in user.
 */
export default function AuthPanel({
  onSignedIn,
  title = 'Sign in to Dot 1 News',
  subtitle = 'Use the same account as the app.',
  showGetApp = true,
}: {
  onSignedIn: (u: AppUser) => void;
  title?: string;
  subtitle?: string;
  showGetApp?: boolean;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [subscribe, setSubscribe] = useState(true);

  const [appleReady, setAppleReady] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);

  // Load Apple's JS SDK once and initialize it, only when configured.
  useEffect(() => {
    if (!APPLE_ENABLED) return;
    function init() {
      const AppleID = (window as any).AppleID;
      if (!AppleID) return;
      try {
        AppleID.auth.init({ clientId: APPLE_CLIENT_ID, scope: 'name email', redirectURI: APPLE_REDIRECT_URI, usePopup: true });
        setAppleReady(true);
      } catch { /* leave the button hidden if init fails */ }
    }
    if ((window as any).AppleID) { init(); return; }
    let s = document.querySelector<HTMLScriptElement>('script[data-appleid]');
    if (!s) {
      s = document.createElement('script');
      s.src = APPLE_SDK; s.async = true; s.defer = true; s.setAttribute('data-appleid', '1');
      document.head.appendChild(s);
    }
    s.addEventListener('load', init);
    return () => { s?.removeEventListener('load', init); };
  }, []);

  const pwOk = PW_RULES.every((r) => r.test(password));

  async function doApple() {
    if (appleBusy) return;
    setError(''); setAppleBusy(true);
    try {
      const data = await (window as any).AppleID.auth.signIn();
      const idToken: string | undefined = data?.authorization?.id_token;
      if (!idToken) throw new Error('Apple did not return a token. Please try again.');
      const nm = data?.user?.name;
      const fullName = nm ? [nm.firstName, nm.lastName].filter(Boolean).join(' ').trim() || undefined : undefined;
      onSignedIn(await signInWithApple(idToken, fullName, data?.user?.email));
    } catch (err: any) {
      // The user closing the Apple popup is not an error worth showing.
      const code = err?.error;
      if (code === 'popup_closed_by_user' || code === 'user_cancelled_authorize') return;
      // Surface the real reason (Apple's error code, or the backend's message)
      // so configuration problems are diagnosable instead of a generic failure.
      console.error('Apple web sign-in failed:', err);
      const detail = code || err?.message;
      setError(detail ? `Apple sign-in failed (${detail}).` : 'Apple sign-in did not complete. Please try again.');
    } finally {
      setAppleBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        onSignedIn(await login(identifier.trim(), password));
      } else {
        if (!pwOk) { setError('Please meet all the password requirements.'); setBusy(false); return; }
        onSignedIn(await register(
          { username: username.trim(), name: name.trim(), email: email.trim(), password },
          subscribe,
        ));
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="apn">
      <StyleTag />
      <div className="apn-head">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        <div>
          <div className="apn-title">{title}</div>
          <p className="apn-sub">{subtitle}</p>
        </div>
      </div>

      {APPLE_ENABLED && appleReady && (
        <>
          <button type="button" className="apn-apple" onClick={doApple} disabled={appleBusy}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M11.18 8.47c-.02-1.77 1.45-2.62 1.51-2.66-.82-1.2-2.1-1.37-2.56-1.39-1.09-.11-2.13.64-2.68.64-.55 0-1.41-.62-2.32-.61-1.19.02-2.29.69-2.9 1.76-1.24 2.15-.32 5.33.89 7.07.59.85 1.29 1.81 2.21 1.77.89-.04 1.22-.57 2.3-.57 1.07 0 1.37.57 2.31.55.95-.02 1.56-.87 2.14-1.72.67-.99.95-1.94.96-1.99-.02-.01-1.84-.71-1.86-2.8zM9.43 3.3c.49-.6.82-1.42.73-2.25-.71.03-1.56.47-2.07 1.06-.45.53-.85 1.37-.74 2.18.79.06 1.59-.4 2.08-.99z"/></svg>
            {appleBusy ? 'Connecting…' : 'Continue with Apple'}
          </button>
          <div className="apn-or"><span>or</span></div>
        </>
      )}

      <div className="apn-tabs">
        <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => { setMode('login'); setError(''); }}>Sign in</button>
        <button type="button" className={mode === 'register' ? 'on' : ''} onClick={() => { setMode('register'); setError(''); }}>Create account</button>
      </div>

      <form className="apn-form" onSubmit={submit}>
        {mode === 'login' ? (
          <>
            <input autoComplete="username" placeholder="Email or username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
            <input type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </>
        ) : (
          <>
            <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
            <input placeholder="Username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} required />
            <input type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" autoComplete="new-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {password.length > 0 && (
              <ul className="apn-pw">
                {PW_RULES.map((r) => <li key={r.label} className={r.test(password) ? 'ok' : ''}>{r.label}</li>)}
              </ul>
            )}
            <label className="apn-check">
              <input type="checkbox" checked={subscribe} onChange={(e) => setSubscribe(e.target.checked)} />
              <span>Email me the daily edition. A few stories worth your time, no noise. Unsubscribe anytime.</span>
            </label>
          </>
        )}

        {error && <p className="apn-err">{error}</p>}

        <button type="submit" className="apn-btn" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      {showGetApp && <p className="apn-getapp">Prefer the app? <a href={APP_STORE}>Get Dot 1 News free</a>.</p>}
    </div>
  );
}

function StyleTag() {
  return (
    <style>{`
.apn{border:1px solid var(--rule2);border-radius:12px;background:var(--bg);padding:18px;}
.apn-head{display:flex;gap:12px;align-items:flex-start;margin-bottom:14px;}
.apn-head svg{color:var(--crimson);flex:none;margin-top:2px;}
.apn-title{font-family:var(--font-display),Georgia,serif;font-size:18px;color:var(--ink);margin-bottom:4px;}
.apn-sub{font-size:12.5px;line-height:1.5;color:var(--muted);margin:0;}
.apn-apple{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;background:#000;color:#fff;border:none;border-radius:8px;padding:12px;font-family:var(--font-body),system-ui,sans-serif;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:14px;}
.apn-apple:disabled{opacity:.6;cursor:default;}
.apn-apple svg{margin-top:-1px;}
.apn-or{display:flex;align-items:center;gap:12px;margin:0 0 14px;color:var(--muted);font-family:var(--font-mono),monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;}
.apn-or:before,.apn-or:after{content:'';flex:1;height:1px;background:var(--rule2);}
.apn-tabs{display:flex;gap:6px;margin-bottom:14px;}
.apn-tabs button{flex:1;font-family:var(--font-mono),monospace;font-size:11px;letter-spacing:.06em;text-transform:uppercase;font-weight:bold;color:var(--muted);background:var(--raised);border:1px solid var(--rule2);border-radius:8px;padding:9px;cursor:pointer;}
.apn-tabs button.on{color:#fff;background:var(--crimson);border-color:var(--crimson);}
.apn-form{display:flex;flex-direction:column;gap:9px;}
.apn-form input[type=text],.apn-form input[type=email],.apn-form input[type=password],.apn-form input:not([type]){width:100%;box-sizing:border-box;font-family:inherit;font-size:15px;color:var(--ink);background:var(--raised);border:1px solid var(--rule2);border-radius:9px;padding:11px 13px;}
.apn-form input:focus{outline:none;border-color:var(--crimson);}
.apn-pw{list-style:none;margin:2px 0;padding:0;display:flex;flex-wrap:wrap;gap:6px 14px;}
.apn-pw li{font-size:11.5px;color:var(--muted);position:relative;padding-left:15px;}
.apn-pw li:before{content:'○';position:absolute;left:0;}
.apn-pw li.ok{color:#2e7d32;}
.apn-pw li.ok:before{content:'●';}
.apn-check{display:flex;gap:9px;align-items:flex-start;font-size:12.5px;line-height:1.5;color:var(--body);cursor:pointer;margin-top:2px;}
.apn-check input{margin-top:2px;flex:none;}
.apn-err{margin:2px 0 0;font-size:12.5px;color:var(--crimson);}
.apn-btn{background:var(--crimson);color:#fff;font-family:var(--font-mono),monospace;font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:bold;padding:13px;border-radius:8px;border:none;cursor:pointer;width:100%;}
.apn-btn:disabled{opacity:.55;cursor:default;}
.apn-getapp{margin:12px 0 0;font-size:12px;color:var(--muted);text-align:center;}
.apn-getapp a{color:var(--crimson);text-decoration:underline;}
`}</style>
  );
}
