# Hosting BYODC on Cloudflare

The site is static files plus a small backend: the route handlers in `functions/api/`, run by
`server/worker.js`. That backend handles Google sign-in, nicknames, progress saved to your account,
and the "people have started building" counter. It all runs on Cloudflare's free tier.

Locally, `tools/dev-server.mjs` has no backend, so the course behaves as it always has: no
counter and no sign-in step.

## How it runs

The site runs as a **Cloudflare Worker with static assets**, which is the project type the
Cloudflare dashboard creates when you import a GitHub repo:
- `wrangler.jsonc` is the config;
- `server/worker.js` answers `/api/*` and hands everything else to the static files;
- `.assetsignore` keeps non-site files (notes, tools, the backend source) from being served.

The build's deploy command is `npx wrangler deploy`. Every push to `main` redeploys.

Until the database is connected, `/api` answers "not connected yet", and the course runs as it
does locally, with no counter and no sign-in step.

## 1. Cloudflare: the project (done)

Workers & Pages → Create → Import a repository → **ripudamn4298/BYODC**. Keep the deploy
command as `npx wrangler deploy`. The site lives at `https://byodc.<your-subdomain>.workers.dev`,
shown on the Worker's overview page.

## 2. Cloudflare: the database

1. **Storage & Databases → D1 → Create database**, named **byodc**.
2. Copy its **Database ID** (it looks like `xxxxxxxx-xxxx-…`) and give it to Claude, or put it
   in `wrangler.jsonc` yourself:
   `"d1_databases": [{ "binding": "DB", "database_name": "byodc", "database_id": "<id>" }]`.
   You do not create any tables: the site creates them itself the first time it runs.
3. Push to `main`. The next deploy connects the database, and the counter appears.

## 3. Google: the sign-in key (about 10 minutes, once)

1. Go to https://console.cloud.google.com and create a project called **BYODC**.
2. **APIs & Services → OAuth consent screen**:
   - choose **External**;
   - fill in the app name, your support email and the developer email;
   - leave the scopes as they are (email, profile, openid);
   - press **Publish app**.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - application type **Web application**;
   - under **Authorized redirect URIs**, add `https://byodc.<your-subdomain>.workers.dev/api/auth/callback`, using the exact address from step 1.
4. In Cloudflare, open the **byodc** Worker → **Settings → Variables and Secrets**. Add
   `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, both with **type: Secret**. Secrets survive
   every deploy; plain-text variables would be wiped by the next push, because `wrangler.jsonc`
   is the source of truth for those.
5. The sign-in button appears on the next page load. No redeploy is needed for secrets.

## 4. Check it

- The landing page shows "**N** people have started building their own data centre".
- **Sign in** (top right) takes you to Google and back. You are asked for a nickname, and
  the nav says "HI, NICKNAME".
- Progress saves to your account: open the site on your phone, sign in, and **Resume** picks up
  where you left off.

## What is where

| Path | What it does |
|---|---|
| `functions/api/auth/login.js` | Sends the visitor to Google, with a one-time state cookie |
| `functions/api/auth/callback.js` | Google sends them back here; checks the state, exchanges the code for an ID token, saves the user and opens a 60-day session cookie |
| `functions/api/auth/logout.js` | Signs out |
| `functions/api/me.js` | Who is signed in: nickname, name, saved progress |
| `functions/api/nickname.js` | Sets the nickname, and counts the builder once |
| `functions/api/progress.js` | Saves act and step for a signed-in builder |
| `functions/api/guest.js` | A guest pressed start; counted once per browser |
| `functions/api/stats.js` | The counter |
| `server/lib.js` | Shared helpers, plus the table set-up |
| `server/worker.js` | The Worker: routes `/api/*` to the handlers above, serves everything else as static files |
| `wrangler.jsonc`, `.assetsignore` | Cloudflare config, and the files that are never served |
| `js/account.js` | The browser side: counter, sign-in, the nickname and buddy dialog, progress sync |
| `js/reach.js` | How far into each act the learner has got, card by card; decides what the index unlocks |
| `js/course-index.js` | The index drawer: every act, step and card, with the cards ahead locked |
| `js/companion/buddy.js`, `js/companion/floor.js` | The pixel buddy, and the strip at the bottom of the game where it walks beside the act progress bar |

## Data kept

Only the following is stored, in D1:
- for each user: their Google id, email, first name, nickname, buddy, last act and step, how far
  they have got in each act, and timestamps;
- session tokens;
- one row per builder, for the counter.

No passwords are ever stored, because Google handles sign-in.

## Later (optional)

- **Custom domain:** the Worker → **Settings → Domains & Routes**. Then add
  `https://yourdomain/api/auth/callback` to the Google redirect URIs.
- **GitHub Pages:** the old GitHub Pages site can be switched off once Cloudflare is live
  (repo → Settings → Pages).
