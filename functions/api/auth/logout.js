// POST /api/auth/logout — end this browser's session.
import { json, cookies, cookie, sameOrigin, ensureSchema, SESSION_COOKIE } from '../../../server/lib.js';

export async function onRequestPost({ request, env }){
  if (!sameOrigin(request)) return json({ error: 'bad origin' }, 403);
  await ensureSchema(env);
  const t = cookies(request)[SESSION_COOKIE];
  if (t) await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(t).run();
  return json({ ok: true }, 200, { 'set-cookie': cookie(SESSION_COOKIE, '', { maxAge: 0 }) });
}
