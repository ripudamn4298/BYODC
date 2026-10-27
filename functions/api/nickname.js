// POST /api/nickname { nickname } — set what the course calls you. The first time a
// signed-in user picks a nickname, they join the builders count.
import { json, sameOrigin, ensureSchema, currentUser, cleanNickname } from '../../server/lib.js';

export async function onRequestPost({ request, env }){
  if (!sameOrigin(request)) return json({ error: 'bad origin' }, 403);
  await ensureSchema(env);
  const u = await currentUser(env, request);
  if (!u) return json({ error: 'not signed in' }, 401);
  const body = await request.json().catch(() => ({}));
  const nickname = cleanNickname(body.nickname);
  if (!nickname) return json({ error: 'Use 1 to 24 letters, numbers or spaces.' }, 400);
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET nickname = ?, updated_at = ? WHERE id = ?').bind(nickname, now, u.id),
    env.DB.prepare('INSERT OR IGNORE INTO builders (id, created_at) VALUES (?, ?)').bind(`u:${u.id}`, now),
  ]);
  return json({ ok: true, nickname });
}
