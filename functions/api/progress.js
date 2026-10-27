// POST /api/progress { act, step, reach } — remember where a signed-in builder got to, so they
// can carry on from any device. act/step is the place Resume returns to; reach is how far into
// each act they have got, card by card, which decides what the index unlocks (Ripu, 2026-10-28).
// The stored reach only ever moves forward. (Guests keep progress in their own browser only.)
import { json, sameOrigin, ensureSchema, currentUser, cleanReach, parseReach, mergeReach } from '../../server/lib.js';

export async function onRequestPost({ request, env }){
  if (!sameOrigin(request)) return json({ error: 'bad origin' }, 403);
  await ensureSchema(env);
  const u = await currentUser(env, request);
  if (!u) return json({ error: 'not signed in' }, 401);
  const { act, step, reach } = await request.json().catch(() => ({}));
  if (!Number.isInteger(act) || act < 1 || act > 5 || !Number.isInteger(step) || step < 0 || step > 20){
    return json({ error: 'bad progress' }, 400);
  }
  const merged = mergeReach(parseReach(u.reach), cleanReach(reach));
  const now = Date.now();
  await env.DB.prepare('UPDATE users SET act = ?, step = ?, reach = ?, progress_at = ?, updated_at = ? WHERE id = ?')
    .bind(act, step, JSON.stringify(merged), now, now, u.id).run();
  return json({ ok: true, reach: merged });
}
