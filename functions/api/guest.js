// POST /api/guest { id } — a guest pressed start. Their browser keeps a random id, so each
// guest browser joins the builders count once.
import { json, sameOrigin, ensureSchema, addBuilder } from '../../server/lib.js';

export async function onRequestPost({ request, env }){
  if (!sameOrigin(request)) return json({ error: 'bad origin' }, 403);
  await ensureSchema(env);
  const { id } = await request.json().catch(() => ({}));
  if (typeof id !== 'string' || !/^[a-f0-9-]{36}$/.test(id)) return json({ error: 'bad id' }, 400);
  await addBuilder(env, `v:${id}`);
  return json({ ok: true });
}
