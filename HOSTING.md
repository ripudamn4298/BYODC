# Hosting BYODC on Cloudflare Pages

The site is static files plus a small backend in `functions/api/` (Cloudflare Pages
Functions). That backend handles Google sign-in, nicknames, progress saved to your account,
and the "people have started building" counter. It all runs on Cloudflare's free tier.

Every push to `main` on GitHub redeploys the site automatically once step 2 is done.
Locally, `tools/dev-server.mjs` has no backend, so the course behaves as it always has: no
counter and no sign-in step.

## 1. Google: get a sign-in key (about 10 minutes, once)

1. Go to https://console.cloud.google.com and create a project called **BYODC**.
2. **APIs & Services → OAuth consent screen**:
   - choose **External**;
   - fill in the app name (*Build Your Own Data Centre*), your support email and the developer email;
   - leave the scopes as they are (email, profile, openid);
   - press **Publish app** so anyone can sign in. These basic scopes need no Google review.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - application type **Web application**;
   - under **Authorized redirect URIs**, add `https://byodc.pages.dev/api/auth/callback`. Use your real Pages address from step 2; if `byodc` is taken, Cloudflare gives you something like `byodc-abc.pages.dev`.
4. Copy the **Client ID** and the **Client secret**.

## 2. Cloudflare: put the site online

1. Sign up at https://dash.cloudflare.com (free).
2. **Workers & Pages → Create → Pages → Connect to Git**. Allow GitHub access, then pick
   **ripudamn4298/BYODC**.
3. Build settings:
   - production branch **main**;
   - framework preset **None**;
   - build command **empty**;
   - build output directory **/**.
4. Press **Save and Deploy**. The site goes live at `https://<project>.pages.dev`.

## 3. Cloudflare: the database and the keys

1. **Storage & Databases → D1 → Create** a database called **byodc**. You do not need to
   create any tables: the site creates them itself the first time it runs.
2. Open your Pages project → **Settings → Bindings → Add → D1 database**:
   - variable name **DB**;
   - database **byodc**.
3. **Settings → Variables and Secrets** (Production):
   - add `GOOGLE_CLIENT_ID` as text;
   - add `GOOGLE_CLIENT_SECRET` and press **Encrypt**.
4. **Deployments → Retry deployment** on the latest one, so the binding and the keys take effect.

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
| `js/account.js` | The browser side: counter, sign-in and nickname dialogs, progress sync |

## Data kept

Only the following is stored, in D1:
- for each user: their Google id, email, first name, nickname, last act and step, and timestamps;
- session tokens;
- one row per builder, for the counter.

No passwords are ever stored, because Google handles sign-in.

## Later (optional)

- **Custom domain:** Pages project → **Custom domains**. Then add
  `https://yourdomain/api/auth/callback` to the Google redirect URIs.
- **GitHub Pages:** the old GitHub Pages site can be switched off once Cloudflare is live
  (repo → Settings → Pages).
