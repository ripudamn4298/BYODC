// GET /api/auth/callback — Google sends the visitor back here with a one-time code.
// We check the state cookie, swap the code for Google's ID token (server to server, with
// our client secret), check who issued it and for whom, then save the user and open a
// session. The visitor lands back on the course with ?signedin=1.
import { cookies, cookie, token, ensureSchema, OAUTH_COOKIE, SESSION_COOKIE, SESSION_DAYS } from '../../../server/lib.js';

const back = (origin, query) => new Response(null, { status: 302, headers: { location: `${origin}/?${query}` } });

function decodeJwtPayload(jwt){
  const part = jwt.split('.')[1];
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((part.length + 3) % 4);
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b64), c => c.charCodeAt(0))));
}

export async function onRequestGet({ request, env }){
  const url = new URL(request.url);
  const origin = url.origin;
  const [state, act, step] = (cookies(request)[OAUTH_COOKIE] || '').split('.');
  if (!state || url.searchParams.get('state') !== state || !url.searchParams.get('code')){
    return back(origin, 'signin=failed');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: url.searchParams.get('code'),
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${origin}/api/auth/callback`,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) return back(origin, 'signin=failed');
  const { id_token } = await res.json();
  if (!id_token) return back(origin, 'signin=failed');

  // The token came straight from Google over TLS, in exchange for our secret, so its
  // payload can be read directly; we still check issuer, audience and expiry.
  const p = decodeJwtPayload(id_token);
  const okIss = p.iss === 'https://accounts.google.com' || p.iss === 'accounts.google.com';
  if (!okIss || p.aud !== env.GOOGLE_CLIENT_ID || !p.sub || (p.exp * 1000) < Date.now()){
    return back(origin, 'signin=failed');
  }

  await ensureSchema(env);
  const now = Date.now(), id = `g:${p.sub}`;
  const session = token(32), expires = now + SESSION_DAYS * 86400 * 1000;
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO users (id, email, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET email = excluded.email, name = excluded.name, updated_at = excluded.updated_at`)
      .bind(id, p.email || null, p.given_name || p.name || null, now, now),
    env.DB.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').bind(session, id, expires),
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now),
  ]);

  const headers = new Headers({ location: `${origin}/?signedin=1&act=${parseInt(act, 10) || 1}&step=${parseInt(step, 10) || 0}` });
  headers.append('set-cookie', cookie(SESSION_COOKIE, session, { maxAge: SESSION_DAYS * 86400 }));
  headers.append('set-cookie', cookie(OAUTH_COOKIE, '', { maxAge: 0, path: '/api/auth' }));
  return new Response(null, { status: 302, headers });
}
