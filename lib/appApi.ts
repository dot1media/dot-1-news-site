'use client';

/**
 * Browser-side client for the Dot 1 News app backend.
 *
 * The website reads content straight from the shared database (lib/db.ts), but
 * anything a reader DOES — signing in, commenting, reacting, managing their
 * profile — is a write, and all writes belong to the app's tRPC backend. This
 * module is the site's one door to that backend: it signs in, stores the
 * returned session token, and sends it as x-session-token on every write, so a
 * reader on the web is exactly as authenticated as one in the app.
 *
 * It talks to tRPC over plain fetch (no @trpc/client dependency) using the
 * single-call HTTP form the fetch adapter accepts:
 *   query    GET  {base}/api/trpc/{path}?input={json}
 *   mutation POST {base}/api/trpc/{path}  body={json}
 * The backend's response transformer only sanitizes output (and tags the first
 * object with a harmless "__nc" marker), so result.data is read as-is.
 */

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || 'https://dot-1-news-final.vercel.app'
).replace(/\/+$/, '');

const TOKEN_KEY = 'dot1_session';
const USER_KEY = 'dot1_user';

export interface AppUser {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar: string;
  profile_image?: string | null;
  region?: string | null;
  bible_version?: string;
  notifications_enabled?: boolean;
  new_content_alerts?: boolean;
  comment_alerts?: boolean;
  reaction_alerts?: boolean;
  hasPassword?: boolean;
  created_at?: string | null;
}

export interface WebComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: string;
  reactions: { type: 'like' | 'love' | 'pray' | 'amen'; count: number; userReacted: boolean }[];
}

// ── token + cached user (localStorage, best-effort) ───────────────────────────
export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
function setToken(t: string | null) {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch {}
}
export function getCachedUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AppUser) : null;
  } catch { return null; }
}
function setCachedUser(u: AppUser | null) {
  try { u ? localStorage.setItem(USER_KEY, JSON.stringify(u)) : localStorage.removeItem(USER_KEY); } catch {}
}
export function isSignedIn(): boolean {
  return !!getToken() && !!getCachedUser();
}

// ── transport ────────────────────────────────────────────────────────────────
function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
  const t = getToken();
  if (t) h['x-session-token'] = t;
  return h;
}

// tRPC's fetch adapter answers a single call as { result | error } and a
// batched call as an array of those. We send single calls, but tolerate both
// shapes so a change in batching never breaks the site.
function unwrap(body: any): { data?: any; error?: any } {
  const node = Array.isArray(body) ? body[0] : body;
  return { data: node?.result?.data, error: node?.error };
}
function errorMessage(err: any, fallback: string): string {
  const msg = err?.json?.message || err?.message;
  return (typeof msg === 'string' && msg) || fallback;
}

async function query<T = any>(path: string, input?: unknown): Promise<T> {
  const qs = input !== undefined ? `?input=${encodeURIComponent(JSON.stringify(input))}` : '';
  const res = await fetch(`${API_BASE}/api/trpc/${path}${qs}`, { method: 'GET', headers: headers(), mode: 'cors', credentials: 'omit' });
  const body = await res.json().catch(() => ({}));
  const { data, error } = unwrap(body);
  if (!res.ok || error) throw new Error(errorMessage(error, 'Something went wrong. Please try again.'));
  return data as T;
}

async function mutate<T = any>(path: string, input?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}/api/trpc/${path}`, {
    method: 'POST', headers: headers(), mode: 'cors', credentials: 'omit',
    body: JSON.stringify(input ?? {}),
  });
  const body = await res.json().catch(() => ({}));
  const { data, error } = unwrap(body);
  if (!res.ok || error) throw new Error(errorMessage(error, 'Something went wrong. Please try again.'));
  return data as T;
}

// ── auth ─────────────────────────────────────────────────────────────────────
function store(user: AppUser & { sessionToken?: string }): AppUser {
  if (user.sessionToken) setToken(user.sessionToken);
  const { sessionToken, ...clean } = user as any;
  setCachedUser(clean);
  return clean;
}

export async function login(emailOrUsername: string, password: string): Promise<AppUser> {
  const res = await mutate<any>('auth.login', { emailOrUsername, password });
  if (res?.requires2FA) {
    // Two-factor accounts are newsroom/admin accounts; they sign in through the
    // editorial portal, not the public site.
    throw new Error('This account manages the newsroom. Please sign in at editorial.dot1.media.');
  }
  if (!res?.sessionToken) throw new Error('Sign-in did not complete. Please try again.');
  return store(res);
}

export interface RegisterInput {
  username: string;
  name: string;
  email: string;
  password: string;
  region?: string;
}
export async function register(input: RegisterInput, subscribeDaily: boolean): Promise<AppUser> {
  const res = await mutate<any>('auth.register', input);
  const user = store(res);
  if (subscribeDaily) {
    // Opt the new reader into the daily edition. Keyed on their id + email, the
    // same consent the app records. Best-effort: a failure here must not fail
    // the sign-up the reader just completed.
    try { await mutate('email.optIn', { userId: user.id, email: user.email }); } catch {}
  }
  return user;
}

/** Complete a Sign in with Apple (web) by sending Apple's identity token to the
 *  backend, which verifies it and returns the same user + session token as a
 *  password login. `fullName`/`email` are only present on the first authorization. */
export async function signInWithApple(identityToken: string, fullName?: string, email?: string): Promise<AppUser> {
  const res = await mutate<any>('auth.signInWithApple', { identityToken, fullName, email });
  if (!res?.sessionToken) {
    // The backend answered but gave us no session token. Surface what it did
    // return so the cause is visible instead of a generic failure.
    console.error('Apple sign-in: backend returned no session token. Response:', res);
    throw new Error(
      res?.message
        ? `Apple sign-in failed: ${res.message}`
        : 'Apple sign-in did not complete (no session token returned). Please try again.',
    );
  }
  return store(res);
}

export async function logout(): Promise<void> {
  try { await mutate('auth.logout'); } catch {}
  setToken(null);
  setCachedUser(null);
}

export async function refreshUser(): Promise<AppUser | null> {
  const cached = getCachedUser();
  if (!cached) return null;
  try {
    const fresh = await query<AppUser>('auth.getUser', { userId: cached.id });
    setCachedUser(fresh);
    return fresh;
  } catch {
    return cached;
  }
}

// ── comments + reactions ──────────────────────────────────────────────────────
export function getComments(contentId: string, contentType: 'news' | 'photo' | 'video' = 'news'): Promise<WebComment[]> {
  const user = getCachedUser();
  return query<WebComment[]>('comments.getComments', { contentType, contentId, userId: user?.id });
}

export function addComment(contentId: string, text: string, contentType: 'news' | 'photo' | 'video' = 'news'): Promise<WebComment> {
  const user = getCachedUser();
  if (!user) throw new Error('Please sign in to comment.');
  return mutate<WebComment>('comments.addComment', {
    contentType, contentId, userId: user.id, userName: user.name,
    userAvatar: user.profile_image || user.avatar, text,
  });
}

export function reactToComment(commentId: string, reactionType: 'like' | 'love' | 'pray' | 'amen') {
  const user = getCachedUser();
  if (!user) throw new Error('Please sign in to react.');
  return mutate('comments.reactToComment', { commentId, reactionType, userId: user.id });
}

export function toggleReaction(contentId: string, reactionType: 'like' | 'love' | 'pray' | 'amen', contentType: 'news' | 'photo' | 'video' = 'news') {
  const user = getCachedUser();
  if (!user) throw new Error('Please sign in to react.');
  return mutate<{ added: boolean }>('content.toggleReaction', { contentType, contentId, userId: user.id, reactionType });
}

// ── account management (/account) ─────────────────────────────────────────────
export async function updateName(name: string): Promise<AppUser> {
  const user = getCachedUser();
  if (!user) throw new Error('Please sign in.');
  const res = await mutate<AppUser>('auth.updateName', { userId: user.id, name });
  const merged = { ...user, name: res.name };
  setCachedUser(merged);
  return merged;
}

export function changePassword(currentPassword: string, newPassword: string) {
  const user = getCachedUser();
  if (!user) throw new Error('Please sign in.');
  return mutate('auth.changePassword', { userId: user.id, currentPassword, newPassword });
}

export function emailStatus(): Promise<{ status: string }> {
  const user = getCachedUser();
  if (!user) throw new Error('Please sign in.');
  return query<{ status: string }>('email.status', { userId: user.id });
}
export function emailOptIn() {
  const user = getCachedUser();
  if (!user) throw new Error('Please sign in.');
  return mutate('email.optIn', { userId: user.id, email: user.email });
}
export function emailOptOut() {
  const user = getCachedUser();
  if (!user) throw new Error('Please sign in.');
  return mutate('email.decline', { userId: user.id, email: user.email });
}

export function exportData() {
  const user = getCachedUser();
  if (!user) throw new Error('Please sign in.');
  return query('auth.exportData', { userId: user.id });
}

export async function deleteAccount(password: string): Promise<void> {
  const user = getCachedUser();
  if (!user) throw new Error('Please sign in.');
  await mutate('auth.deleteAccount', { userId: user.id, password });
  setToken(null);
  setCachedUser(null);
}

export { API_BASE };
