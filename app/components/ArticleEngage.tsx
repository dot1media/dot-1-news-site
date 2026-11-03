'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  type AppUser, type WebComment,
  getCachedUser, login, register, logout,
  getComments, addComment, reactToComment, toggleReaction,
} from '@/lib/appApi';

const APP_STORE = 'https://apps.apple.com/us/app/dot-1-news/id6757212352';

type ReactionKey = 'like' | 'love' | 'pray' | 'amen';
const REACTIONS: { key: ReactionKey; label: string }[] = [
  { key: 'like', label: 'Like' },
  { key: 'love', label: 'Love' },
  { key: 'pray', label: 'Pray' },
  { key: 'amen', label: 'Amen' },
];

interface Props {
  articleId: string;
  initialReactions: { like: number; love: number; pray: number; amen: number };
  initialCommentCount: number;
}

// Mirror of the backend password policy, so we can guide before submitting.
const PW_RULES: { test: (s: string) => boolean; label: string }[] = [
  { test: (s) => s.length >= 8, label: 'At least 8 characters' },
  { test: (s) => /[a-z]/.test(s), label: 'A lowercase letter' },
  { test: (s) => /[A-Z]/.test(s), label: 'An uppercase letter' },
  { test: (s) => /[0-9]/.test(s), label: 'A number' },
  { test: (s) => /[^a-zA-Z0-9]/.test(s), label: 'A special character' },
];

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!then) return '';
  const s = Math.max(1, Math.floor((Date.now() - then) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ArticleEngage({ articleId, initialReactions, initialCommentCount }: Props) {
  const [me, setMe] = useState<AppUser | null>(null);
  const [ready, setReady] = useState(false);

  // reactions (global totals, with an optimistic "mine" set)
  const [counts, setCounts] = useState(initialReactions);
  const [mine, setMine] = useState<Record<ReactionKey, boolean>>({ like: false, love: false, pray: false, amen: false });

  // comments
  const [comments, setComments] = useState<WebComment[] | null>(null);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    setMe(getCachedUser());
    setReady(true);
  }, []);

  const loadComments = useCallback(async () => {
    try {
      const list = await getComments(articleId);
      setComments(list);
      setCommentCount(list.length);
    } catch {
      setComments([]);
    }
  }, [articleId]);

  useEffect(() => {
    if (ready && me) loadComments();
  }, [ready, me, loadComments]);

  async function onReact(key: ReactionKey) {
    if (!me) return;
    const wasMine = mine[key];
    // Optimistic toggle; revert if the server rejects it.
    setMine((m) => ({ ...m, [key]: !wasMine }));
    setCounts((c) => ({ ...c, [key]: Math.max(0, c[key] + (wasMine ? -1 : 1)) }));
    try {
      const res = await toggleReaction(articleId, key);
      // Align with the server's truth in case our optimistic guess was off.
      setMine((m) => (m[key] === res.added ? m : { ...m, [key]: res.added }));
    } catch {
      setMine((m) => ({ ...m, [key]: wasMine }));
      setCounts((c) => ({ ...c, [key]: Math.max(0, c[key] + (wasMine ? 1 : -1)) }));
    }
  }

  async function onPost(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || posting) return;
    setPosting(true);
    try {
      const created = await addComment(articleId, text);
      setComments((prev) => [...(prev || []), created]);
      setCommentCount((n) => n + 1);
      setDraft('');
    } catch (err: any) {
      alert(err?.message || 'Could not post your comment. Please try again.');
    } finally {
      setPosting(false);
    }
  }

  async function onCommentReact(commentId: string, key: ReactionKey) {
    if (!me) return;
    setComments((prev) => prev?.map((c) => {
      if (c.id !== commentId) return c;
      return {
        ...c,
        reactions: c.reactions.map((r) =>
          r.type === key
            ? { ...r, userReacted: !r.userReacted, count: Math.max(0, r.count + (r.userReacted ? -1 : 1)) }
            : r),
      };
    }) || prev);
    try { await reactToComment(commentId, key); } catch { loadComments(); }
  }

  async function onSignedIn(u: AppUser) {
    setMe(u);
  }
  async function onLogout() {
    await logout();
    setMe(null);
    setComments(null);
  }

  return (
    <div className="aeg">
      <StyleTag />

      {/* Reactions — always visible; acting requires sign-in */}
      <div className="aeg-reacts">
        <span className="aeg-label">Reader reactions</span>
        <div className="aeg-chips">
          {REACTIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`aeg-chip${mine[key] ? ' on' : ''}`}
              onClick={() => (me ? onReact(key) : undefined)}
              disabled={!me}
              title={me ? `React ${label}` : 'Sign in to react'}
            >
              <b>{counts[key]}</b> {label}
            </button>
          ))}
        </div>
        {ready && !me && <p className="aeg-hint">Sign in below to add your reaction.</p>}
      </div>

      {/* Comments */}
      <div className="aeg-comments">
        <span className="aeg-label">Comments{commentCount ? ` (${commentCount})` : ''}</span>

        {!ready ? (
          <p className="aeg-hint">Loading…</p>
        ) : !me ? (
          <AuthPanel commentCount={commentCount} onSignedIn={onSignedIn} />
        ) : (
          <>
            <form className="aeg-compose" onSubmit={onPost}>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add your comment…"
                maxLength={2000}
                rows={3}
              />
              <div className="aeg-composebar">
                <span className="aeg-who">Commenting as <b>{me.name}</b> · <button type="button" className="aeg-link" onClick={onLogout}>Sign out</button></span>
                <button type="submit" className="aeg-btn" disabled={posting || !draft.trim()}>
                  {posting ? 'Posting…' : 'Post comment'}
                </button>
              </div>
            </form>

            <div className="aeg-list">
              {comments === null ? (
                <p className="aeg-hint">Loading comments…</p>
              ) : comments.length === 0 ? (
                <p className="aeg-hint">No comments yet. Be the first to share a thought.</p>
              ) : (
                comments.map((c) => (
                  <div className="aeg-item" key={c.id}>
                    <img className="aeg-av" src={c.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.userName)}&background=random&size=96`} alt="" />
                    <div className="aeg-body">
                      <div className="aeg-meta"><b>{c.userName}</b> <span>{timeAgo(c.timestamp)}</span></div>
                      <p className="aeg-text">{c.text}</p>
                      <div className="aeg-creacts">
                        {c.reactions.map((r) => (
                          <button
                            key={r.type}
                            type="button"
                            className={`aeg-creact${r.userReacted ? ' on' : ''}`}
                            onClick={() => onCommentReact(c.id, r.type)}
                          >
                            {r.type[0].toUpperCase() + r.type.slice(1)}{r.count ? ` ${r.count}` : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── sign in / create account, shown in place of the old download wall ─────── */
function AuthPanel({ commentCount, onSignedIn }: { commentCount: number; onSignedIn: (u: AppUser) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // shared fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  // register-only
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
        const u = await login(identifier.trim(), password);
        onSignedIn(u);
      } else {
        if (!pwOk) { setError('Please meet all the password requirements.'); setBusy(false); return; }
        const u = await register(
          { username: username.trim(), name: name.trim(), email: email.trim(), password },
          subscribe,
        );
        onSignedIn(u);
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="aeg-auth">
      <div className="aeg-authhead">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        <div>
          <div className="aeg-authtitle">
            {commentCount > 0 ? `Join the conversation (${commentCount})` : 'Join the conversation'}
          </div>
          <p className="aeg-authsub">Sign in or create a free account to read and add comments. It is the same account as the app.</p>
        </div>
      </div>

      <div className="aeg-tabs">
        <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => { setMode('login'); setError(''); }}>Sign in</button>
        <button type="button" className={mode === 'register' ? 'on' : ''} onClick={() => { setMode('register'); setError(''); }}>Create account</button>
      </div>

      <form className="aeg-form" onSubmit={submit}>
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
              <ul className="aeg-pw">
                {PW_RULES.map((r) => (
                  <li key={r.label} className={r.test(password) ? 'ok' : ''}>{r.label}</li>
                ))}
              </ul>
            )}
            <label className="aeg-sub">
              <input type="checkbox" checked={subscribe} onChange={(e) => setSubscribe(e.target.checked)} />
              <span>Email me the daily edition. A few stories worth your time, no noise. Unsubscribe anytime.</span>
            </label>
          </>
        )}

        {error && <p className="aeg-err">{error}</p>}

        <button type="submit" className="aeg-btn wide" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <p className="aeg-getapp">Prefer the app? <a href={APP_STORE}>Get Dot 1 News free</a>.</p>
    </div>
  );
}

function StyleTag() {
  return (
    <style>{`
.aeg{margin:28px 0 2px;padding:18px 18px 16px;border:1px solid var(--rule2);border-radius:14px;background:var(--raised);}
.aeg-label{display:block;font-family:var(--font-mono),monospace;font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:var(--goldtext);margin-bottom:11px;}
.aeg-reacts{padding-bottom:16px;border-bottom:1px solid var(--rule);margin-bottom:16px;}
.aeg-chips{display:flex;flex-wrap:wrap;gap:8px;}
.aeg-chip{font-family:var(--font-mono),monospace;font-size:11.5px;letter-spacing:.3px;text-transform:uppercase;color:var(--muted);background:var(--bg);border:1px solid var(--rule);border-radius:999px;padding:6px 13px;cursor:pointer;transition:border-color .15s,color .15s,background .15s;}
.aeg-chip:disabled{cursor:default;opacity:.85;}
.aeg-chip.on{border-color:var(--crimson);color:var(--crimson);background:rgba(184,22,22,.06);}
.aeg-chip b{font-family:var(--font-display),Georgia,serif;font-size:15px;color:var(--ink);margin-right:5px;}
.aeg-chip.on b{color:var(--crimson);}
.aeg-hint{font-size:12.5px;line-height:1.5;color:var(--muted);margin:10px 0 0;}

.aeg-compose textarea{width:100%;box-sizing:border-box;resize:vertical;min-height:72px;font-family:inherit;font-size:15px;line-height:1.5;color:var(--ink);background:var(--bg);border:1px solid var(--rule2);border-radius:10px;padding:11px 13px;}
.aeg-compose textarea:focus{outline:none;border-color:var(--crimson);}
.aeg-composebar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:9px;flex-wrap:wrap;}
.aeg-who{font-size:12px;color:var(--muted);}
.aeg-who b{color:var(--ink);}
.aeg-link{background:none;border:none;padding:0;cursor:pointer;color:var(--crimson);font-size:12px;text-decoration:underline;}
.aeg-btn{background:var(--crimson);color:#fff;font-family:var(--font-mono),monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-weight:bold;padding:11px 20px;border-radius:8px;border:none;cursor:pointer;}
.aeg-btn:disabled{opacity:.55;cursor:default;}
.aeg-btn.wide{width:100%;padding:13px;font-size:12px;}

.aeg-list{margin-top:18px;display:flex;flex-direction:column;gap:18px;}
.aeg-item{display:flex;gap:11px;}
.aeg-av{width:32px;height:32px;flex:none;border-radius:50%;object-fit:cover;background:var(--rule2);}
.aeg-body{flex:1;min-width:0;}
.aeg-meta{font-size:13px;color:var(--muted);margin-bottom:3px;}
.aeg-meta b{color:var(--ink);font-family:var(--font-display),Georgia,serif;margin-right:7px;}
.aeg-text{margin:0 0 7px;font-size:15px;line-height:1.55;color:var(--body);white-space:pre-wrap;word-break:break-word;}
.aeg-creacts{display:flex;gap:6px;flex-wrap:wrap;}
.aeg-creact{font-family:var(--font-mono),monospace;font-size:10.5px;letter-spacing:.3px;text-transform:uppercase;color:var(--muted);background:var(--bg);border:1px solid var(--rule);border-radius:999px;padding:4px 10px;cursor:pointer;}
.aeg-creact.on{border-color:var(--crimson);color:var(--crimson);}

.aeg-auth{border:1px solid var(--rule2);border-radius:12px;background:var(--bg);padding:18px;}
.aeg-authhead{display:flex;gap:12px;align-items:flex-start;margin-bottom:14px;}
.aeg-authhead svg{color:var(--crimson);flex:none;margin-top:2px;}
.aeg-authtitle{font-family:var(--font-display),Georgia,serif;font-size:18px;color:var(--ink);margin-bottom:4px;}
.aeg-authsub{font-size:12.5px;line-height:1.5;color:var(--muted);margin:0;}
.aeg-tabs{display:flex;gap:6px;margin-bottom:14px;}
.aeg-tabs button{flex:1;font-family:var(--font-mono),monospace;font-size:11px;letter-spacing:.06em;text-transform:uppercase;font-weight:bold;color:var(--muted);background:var(--raised);border:1px solid var(--rule2);border-radius:8px;padding:9px;cursor:pointer;}
.aeg-tabs button.on{color:#fff;background:var(--crimson);border-color:var(--crimson);}
.aeg-form{display:flex;flex-direction:column;gap:9px;}
.aeg-form input[type=text],.aeg-form input[type=email],.aeg-form input[type=password],.aeg-form input:not([type]){width:100%;box-sizing:border-box;font-family:inherit;font-size:15px;color:var(--ink);background:var(--raised);border:1px solid var(--rule2);border-radius:9px;padding:11px 13px;}
.aeg-form input:focus{outline:none;border-color:var(--crimson);}
.aeg-pw{list-style:none;margin:2px 0 2px;padding:0;display:flex;flex-wrap:wrap;gap:6px 14px;}
.aeg-pw li{font-size:11.5px;color:var(--muted);position:relative;padding-left:15px;}
.aeg-pw li:before{content:'○';position:absolute;left:0;}
.aeg-pw li.ok{color:#2e7d32;}
.aeg-pw li.ok:before{content:'●';}
.aeg-sub{display:flex;gap:9px;align-items:flex-start;font-size:12.5px;line-height:1.5;color:var(--body);cursor:pointer;margin-top:2px;}
.aeg-sub input{margin-top:2px;flex:none;}
.aeg-err{margin:2px 0 0;font-size:12.5px;color:var(--crimson);}
.aeg-getapp{margin:12px 0 0;font-size:12px;color:var(--muted);text-align:center;}
.aeg-getapp a{color:var(--crimson);text-decoration:underline;}
`}</style>
  );
}
