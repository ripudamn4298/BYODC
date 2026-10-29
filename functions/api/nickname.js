// POST /api/nickname { nickname, avatar } — set what the course calls you, and which of the
// four buddies keeps you company. The first time a signed-in user picks a nickname, they join
// the builders count.
import { json, sameOrigin, ensureSchema, currentUser, cleanNickname, cleanAvatar, addBuilder } from '../../server/lib.js';

export async function onRequestPost({ request, env }){
  if (!sameOrigin(request)) return json({ error: 'bad origin' }, 403);
  await ensureSchema(env);
  const u = await currentUser(env, request);
  if (!u) return json({ error: 'not signed in' }, 401);
  const body = await request.json().catch(() => ({}));
  const nickname = cleanNickname(body.nickname);
  if (!nickname) return json({ error: 'Use 1 to 24 letters, numbers or spaces.' }, 400);
  const avatar = cleanAvatar(body.avatar) || u.avatar || 'byte';
  const now = Date.now();
  await env.DB.prepare('UPDATE users SET nickname = ?, avatar = ?, updated_at = ? WHERE id = ?').bind(nickname, avatar, now, u.id).run();
  await addBuilder(env, `u:${u.id}`);
  return json({ ok: true, nickname, avatar });
}
