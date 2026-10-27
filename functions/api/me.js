// GET /api/me — who is signed in on this browser: { user: { nickname, name, progress } | null },
// plus whether Google sign-in is switched on at all.
import { json, ensureSchema, currentUser, publicUser } from '../../server/lib.js';

export async function onRequestGet({ request, env }){
  await ensureSchema(env);
  const u = await currentUser(env, request);
  return json({ user: publicUser(u), signin: !!env.GOOGLE_CLIENT_ID });
}
