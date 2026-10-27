// POST /api/progress { act, step } — remember where a signed-in builder got to, so they can
// carry on from any device. (Guests keep progress in their own browser only.)
import { json, sameOrigin, ensureSchema, currentUser } from '../../server/lib.js';

export async function onRequestPost({ request, env }){
  if (!sameOrigin(request)) return json({ error: 'bad origin' }, 403);
  await ensureSchema(env);
  const u = await currentUser(env, request);
  if (!u) return json({ error: 'not signed in' }, 401);
  const { act, step } = await request.json().catch(() => ({}));
  if (!Number.isInteger(act) || act < 1 || act > 5 || !Number.isInteger(step) || step < 0 || step > 20){
    return json({ error: 'bad progress' }, 400);
  }
  const now = Date.now();
  await env.DB.prepare('UPDATE users SET act = ?, step = ?, progress_at = ?, updated_at = ? WHERE id = ?')
    .bind(act, step, now, now, u.id).run();
  return json({ ok: true });
}
