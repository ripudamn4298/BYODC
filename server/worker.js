// BYODC — the Cloudflare Worker entry (2026-10-27). The site is static files served from
// the assets directory; this Worker only answers /api/* and hands everything else to the
// static assets. The route handlers are the same files as in /functions/api (written in the
// Pages Functions style, so the project also runs as a Pages project unchanged).
//
// Until the D1 database is bound as DB (wrangler.jsonc), every /api call answers 503, and
// the course runs exactly as it does locally: no counter, no sign-in step.
import { json } from './lib.js';
import * as login from '../functions/api/auth/login.js';
import * as callback from '../functions/api/auth/callback.js';
import * as logout from '../functions/api/auth/logout.js';
import * as me from '../functions/api/me.js';
import * as nickname from '../functions/api/nickname.js';
import * as progress from '../functions/api/progress.js';
import * as guest from '../functions/api/guest.js';
import * as stats from '../functions/api/stats.js';

const ROUTES = {
  'GET /api/auth/login': login.onRequestGet,
  'GET /api/auth/callback': callback.onRequestGet,
  'POST /api/auth/logout': logout.onRequestPost,
  'GET /api/me': me.onRequestGet,
  'POST /api/nickname': nickname.onRequestPost,
  'POST /api/progress': progress.onRequestPost,
  'POST /api/guest': guest.onRequestPost,
  'GET /api/stats': stats.onRequestGet,
};

export default {
  async fetch(request, env, ctx){
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')){
      const handler = ROUTES[`${request.method} ${url.pathname.replace(/\/+$/, '')}`];
      if (!handler) return json({ error: 'not found' }, 404);
      if (!env.DB) return json({ error: 'the database is not connected yet' }, 503);
      try {
        return await handler({ request, env, ctx });
      } catch (err){
        console.error('[byodc api]', url.pathname, err);
        return json({ error: 'server error' }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
};
