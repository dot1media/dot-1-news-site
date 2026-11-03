'use client';

import { useEffect, useState } from 'react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import AuthPanel from '@/app/components/AuthPanel';
import {
  type AppUser, getCachedUser, refreshUser, logout,
  updateName, changePassword, emailStatus, emailOptIn, emailOptOut,
  exportData, deleteAccount,
} from '@/lib/appApi';

const PW_RULES: { test: (s: string) => boolean; label: string }[] = [
  { test: (s) => s.length >= 8, label: '8+ characters' },
  { test: (s) => /[a-z]/.test(s), label: 'lowercase' },
  { test: (s) => /[A-Z]/.test(s), label: 'uppercase' },
  { test: (s) => /[0-9]/.test(s), label: 'number' },
  { test: (s) => /[^a-zA-Z0-9]/.test(s), label: 'symbol' },
];

export default function AccountPage() {
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<AppUser | null>(null);

  useEffect(() => {
    const cached = getCachedUser();
    setMe(cached);
    setReady(true);
    if (cached) refreshUser().then((u) => { if (u) setMe(u); }).catch(() => {});
  }, []);

  return (
    <>
      <Header />
      <main className="shell">
        <div className="acct">
          <div className="kicker">Your account</div>
          <h1>Account</h1>
          {!ready ? (
            <p className="muted">Loading…</p>
          ) : !me ? (
            <div className="acct-signin">
              <p className="muted lead">Sign in to manage your profile, your daily edition, and your data.</p>
              <AuthPanel
                onSignedIn={(u) => setMe(u)}
                title="Sign in to Dot 1 News"
                subtitle="The same account as the app."
              />
            </div>
          ) : (
            <Manage me={me} setMe={setMe} />
          )}
        </div>
      </main>
      <Footer />
      <StyleTag />
    </>
  );
}

function Manage({ me, setMe }: { me: AppUser; setMe: (u: AppUser | null) => void }) {
  return (
    <div className="acct-stack">
      <ProfileCard me={me} setMe={setMe} />
      <DailyEditionCard />
      {me.hasPassword !== false && <PasswordCard />}
      <DataCard me={me} setMe={setMe} />
      <div className="acct-foot">
        <span className="muted tiny">Signed in as {me.email}</span>
        <button className="ln" onClick={async () => { await logout(); setMe(null); }}>Sign out</button>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function ProfileCard({ me, setMe }: { me: AppUser; setMe: (u: AppUser) => void }) {
  const [name, setName] = useState(me.name);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const dirty = name.trim() !== me.name && name.trim().length > 0;

  async function save() {
    setBusy(true); setMsg('');
    try { const u = await updateName(name.trim()); setMe(u); setMsg('Saved.'); }
    catch (e: any) { setMsg(e?.message || 'Could not save.'); }
    finally { setBusy(false); }
  }

  return (
    <Card title="Profile">
      <label className="f">Name</label>
      <input className="in" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      <label className="f">Username</label>
      <input className="in" value={me.username} disabled />
      <label className="f">Email</label>
      <input className="in" value={me.email} disabled />
      <div className="row">
        <button className="btn" onClick={save} disabled={!dirty || busy}>{busy ? 'Saving…' : 'Save name'}</button>
        {msg && <span className="tiny muted">{msg}</span>}
      </div>
    </Card>
  );
}

function DailyEditionCard() {
  const [status, setStatus] = useState<string>('loading');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    emailStatus().then((s) => setStatus(s.status)).catch(() => setStatus('never_asked'));
  }, []);

  const subscribed = status === 'subscribed';

  async function toggle() {
    setBusy(true);
    try {
      if (subscribed) { await emailOptOut(); setStatus('unsubscribed'); }
      else { await emailOptIn(); setStatus('subscribed'); }
    } catch { /* leave status as-is */ }
    finally { setBusy(false); }
  }

  return (
    <Card title="Daily edition">
      <p className="muted">{subscribed
        ? 'You are subscribed. A few stories worth your time, no noise.'
        : 'Get the daily edition by email. A few stories worth your time, no noise.'}</p>
      <div className="row">
        <button className={subscribed ? 'btn ghost' : 'btn'} onClick={toggle} disabled={busy || status === 'loading'}>
          {busy ? 'Working…' : subscribed ? 'Unsubscribe' : 'Subscribe'}
        </button>
      </div>
    </Card>
  );
}

function PasswordCard() {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const pwOk = PW_RULES.every((r) => r.test(next));

  async function save() {
    setMsg('');
    if (!pwOk) { setMsg('New password must meet all requirements.'); return; }
    setBusy(true);
    try { await changePassword(cur, next); setCur(''); setNext(''); setMsg('Password changed.'); }
    catch (e: any) { setMsg(e?.message || 'Could not change password.'); }
    finally { setBusy(false); }
  }

  return (
    <Card title="Password">
      <label className="f">Current password</label>
      <input className="in" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} />
      <label className="f">New password</label>
      <input className="in" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
      {next.length > 0 && (
        <ul className="pw">{PW_RULES.map((r) => <li key={r.label} className={r.test(next) ? 'ok' : ''}>{r.label}</li>)}</ul>
      )}
      <div className="row">
        <button className="btn" onClick={save} disabled={busy || !cur || !next}>{busy ? 'Saving…' : 'Change password'}</button>
        {msg && <span className="tiny muted">{msg}</span>}
      </div>
    </Card>
  );
}

function DataCard({ me, setMe }: { me: AppUser; setMe: (u: AppUser | null) => void }) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');

  async function doExport() {
    setBusy(true); setMsg('');
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'dot1-news-my-data.json'; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) { setMsg(e?.message || 'Could not export.'); }
    finally { setBusy(false); }
  }

  async function doDelete() {
    setBusy(true); setMsg('');
    try {
      await deleteAccount(pw);
      setMe(null);
      window.location.href = '/';
    } catch (e: any) { setMsg(e?.message || 'Could not delete the account.'); setBusy(false); }
  }

  return (
    <Card title="Your data">
      <p className="muted">Download everything on your account, or close it for good.</p>
      <div className="row">
        <button className="btn ghost" onClick={doExport} disabled={busy}>Export my data</button>
        {!confirming && <button className="btn danger" onClick={() => { setConfirming(true); setMsg(''); }} disabled={busy}>Delete account</button>}
      </div>
      {confirming && (
        <div className="danger-box">
          <p className="tiny">This permanently deletes your account, comments, and reactions. This cannot be undone.</p>
          {me.hasPassword !== false && (
            <input className="in" type="password" placeholder="Confirm your password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
          )}
          <div className="row">
            <button className="btn danger" onClick={doDelete} disabled={busy || (me.hasPassword !== false && !pw)}>{busy ? 'Deleting…' : 'Permanently delete'}</button>
            <button className="ln" onClick={() => { setConfirming(false); setPw(''); }}>Cancel</button>
          </div>
        </div>
      )}
      {msg && <p className="tiny muted" style={{ marginTop: 8 }}>{msg}</p>}
    </Card>
  );
}

function StyleTag() {
  return (
    <style>{`
.acct{max-width:560px;margin:0 auto;padding:40px 0 20px;}
.acct h1{font-family:var(--font-display),Georgia,serif;font-size:40px;color:var(--ink);margin:6px 0 24px;letter-spacing:-.4px;}
.acct .kicker{font-family:var(--font-mono),monospace;font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:var(--goldtext);}
.acct .lead{margin-bottom:16px;}
.acct .muted{color:var(--muted);font-size:14px;line-height:1.6;}
.acct .tiny{font-size:12px;}
.acct-signin{max-width:420px;}
.acct-stack{display:flex;flex-direction:column;gap:16px;}
.acct .card{border:1px solid var(--rule2);border-radius:14px;background:var(--raised);padding:20px 20px 22px;}
.acct .card h2{font-family:var(--font-display),Georgia,serif;font-size:19px;color:var(--ink);margin:0 0 14px;}
.acct .f{display:block;font-family:var(--font-mono),monospace;font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:var(--goldtext);margin:12px 0 6px;}
.acct .in{width:100%;box-sizing:border-box;font-family:inherit;font-size:15px;color:var(--ink);background:var(--bg);border:1px solid var(--rule2);border-radius:9px;padding:11px 13px;}
.acct .in:focus{outline:none;border-color:var(--crimson);}
.acct .in:disabled{opacity:.6;}
.acct .pw{list-style:none;margin:8px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:6px 12px;}
.acct .pw li{font-size:11px;color:var(--muted);position:relative;padding-left:14px;text-transform:uppercase;letter-spacing:.04em;}
.acct .pw li:before{content:'○';position:absolute;left:0;}
.acct .pw li.ok{color:#2e7d32;}
.acct .pw li.ok:before{content:'●';}
.acct .row{display:flex;align-items:center;gap:12px;margin-top:14px;flex-wrap:wrap;}
.acct .btn{background:var(--crimson);color:#fff;font-family:var(--font-mono),monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-weight:bold;padding:11px 18px;border-radius:8px;border:none;cursor:pointer;}
.acct .btn:disabled{opacity:.5;cursor:default;}
.acct .btn.ghost{background:transparent;color:var(--ink);border:1px solid var(--rule2);}
.acct .btn.danger{background:transparent;color:var(--crimson);border:1px solid rgba(184,22,22,.5);}
.acct .ln{background:none;border:none;color:var(--crimson);font-size:13px;text-decoration:underline;cursor:pointer;padding:0;}
.acct .danger-box{margin-top:14px;padding:14px;border:1px solid rgba(184,22,22,.35);border-radius:10px;background:rgba(184,22,22,.05);display:flex;flex-direction:column;gap:10px;}
.acct .danger-box .in{background:var(--raised);}
.acct-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:8px;padding-top:4px;flex-wrap:wrap;}
`}</style>
  );
}
