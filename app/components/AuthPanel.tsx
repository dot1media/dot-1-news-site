'use client';

import { useState } from 'react';
import { type AppUser, login, register } from '@/lib/appApi';

const APP_STORE = 'https://apps.apple.com/us/app/dot-1-news/id6757212352';

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

  const pwOk = PW_RULES.every((r) => r.test(password));

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
