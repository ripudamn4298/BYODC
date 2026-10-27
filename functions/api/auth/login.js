// GET /api/auth/login?act=1&step=0 — send the visitor to Google's sign-in page.
// A random state value goes into a short-lived cookie and comes back from Google, so the
// callback only accepts a sign-in this browser started. act/step say what to start after.
import { json, cookie, token, OAUTH_COOKIE } from '../../../server/lib.js';

export async function onRequestGet({ request, env }){
  if (!env.GOOGLE_CLIENT_ID) return json({ error: 'sign-in is not configured yet' }, 503);
  const url = new URL(request.url);
  const act = Math.min(5, Math.max(1, parseInt(url.searchParams.get('act'), 10) || 1));
  const step = Math.max(0, parseInt(url.searchParams.get('step'), 10) || 0);
  const state = token(16);
  const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  auth.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${url.origin}/api/auth/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  }).toString();
  return new Response(null, {
    status: 302,
    headers: {
      location: auth.toString(),
      'set-cookie': cookie(OAUTH_COOKIE, `${state}.${act}.${step}`, { maxAge: 600, path: '/api/auth' }),
    },
  });
}
