// BYODC backend — shared helpers for the Cloudflare Pages Functions in /functions/api.
//
// Bindings and settings (set in the Cloudflare Pages dashboard, never in the repo):
//   DB                    a D1 database (SQLite). Tables are created here on first use.
//   GOOGLE_CLIENT_ID      from Google Cloud → APIs & Services → Credentials (OAuth client)
//   GOOGLE_CLIENT_SECRET  the same client's secret (store it as an encrypted secret)
//
// Sessions: a random 256-bit token in an HttpOnly, Secure, SameSite=Lax cookie, looked up
// in the sessions table. Nothing about the user is trusted from the browser.

export const SESSION_COOKIE = 'byodc_session';
export const OAUTH_COOKIE = 'byodc_oauth';
export const SESSION_DAYS = 60;

export function json(data, status = 200, headers = {}){
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export function cookies(request){
  const out = {};
  (request.headers.get('cookie') || '').split(';').forEach(part => {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

export function cookie(name, value, { maxAge, path = '/' } = {}){
  return `${name}=${encodeURIComponent(value)}; Path=${path}; HttpOnly; Secure; SameSite=Lax`
    + (maxAge !== undefined ? `; Max-Age=${maxAge}` : '');
}

export function token(bytes = 32){
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return [...a].map(b => b.toString(16).padStart(2, '0')).join('');
}

/* Writes must come from our own pages: the browser always sends Origin on a POST. */
export function sameOrigin(request){
  const origin = request.headers.get('origin');
  return !!origin && origin === new URL(request.url).origin;
}

/* Tables are created on first use, so a fresh D1 database needs no manual setup. */
let schemaReady = false;
export async function ensureSchema(env){
  if (schemaReady) return;
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT, name TEXT, nickname TEXT,
      act INTEGER, step INTEGER, progress_at INTEGER,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS builders (
      id TEXT PRIMARY KEY, created_at INTEGER NOT NULL)`),
  ]);
  // Ripu (2026-10-28): the buddy avatar, and how far into each act the builder has reached.
  // Added to tables that already exist, so each ALTER fails harmlessly once the column is there.
  for (const col of ['avatar TEXT', 'reach TEXT']){
    try { await env.DB.prepare(`ALTER TABLE users ADD COLUMN ${col}`).run(); } catch { /* already there */ }
  }
  schemaReady = true;
}

export async function currentUser(env, request){
  const t = cookies(request)[SESSION_COOKIE];
  if (!t || !/^[a-f0-9]{64}$/.test(t)) return null;
  return await env.DB.prepare(
    `SELECT u.id, u.name, u.nickname, u.avatar, u.reach, u.act, u.step, u.progress_at FROM sessions s
     JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?`
  ).bind(t, Date.now()).first();
}

export function publicUser(u){
  if (!u) return null;
  return { nickname: u.nickname || null, name: u.name || null, avatar: cleanAvatar(u.avatar),
    reach: parseReach(u.reach),
    progress: Number.isInteger(u.act) ? { act: u.act, step: u.step, at: u.progress_at || 0 } : null };
}

/* the four buddies (js/companion/buddy.js) */
export const AVATAR_IDS = ['byte', 'chip', 'pixel', 'nova'];
export const cleanAvatar = v => AVATAR_IDS.includes(v) ? v : null;

/* How far into each act a builder has reached: { "1": { s, k, done }, … }, where s is the
   step and k the card inside it. Anything malformed is dropped, never trusted. */
export function cleanReach(raw){
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const a of ['1', '2', '3', '4', '5']){
    const r = raw[a];
    if (!r || !Number.isInteger(r.s) || !Number.isInteger(r.k)) continue;
    if (r.s < 0 || r.s > 30 || r.k < 0 || r.k > 300) continue;
    out[a] = { s: r.s, k: r.k, done: r.done === true };
  }
  return out;
}
export function parseReach(text){
  try { return cleanReach(JSON.parse(text || '{}')); } catch { return {}; }
}
/* keep the further of two positions in every act, so two devices never undo each other */
export function mergeReach(a, b){
  const out = { ...a };
  for (const [act, r] of Object.entries(b)){
    const o = out[act];
    if (!o || r.s > o.s || (r.s === o.s && r.k > o.k)) out[act] = { ...r, done: r.done || !!o?.done };
    else if (r.done) out[act] = { ...o, done: true };
  }
  return out;
}

/* A nickname is 1–24 letters, digits, spaces and . _ ' - (any language). */
export function cleanNickname(raw){
  const s = String(raw ?? '').replace(/\s+/g, ' ').trim();
  return /^[\p{L}\p{N} ._'-]{1,24}$/u.test(s) ? s : null;
}
