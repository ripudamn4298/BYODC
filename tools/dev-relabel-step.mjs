// Dev only. Re-records one step's INDEX card labels after its copy or card count changed.
//
//   node tools/dev-relabel-step.mjs <act> <stepIndex> <stepKey>
//   e.g. node tools/dev-relabel-step.mjs 3 1 3:litho
//
// Needs: the byodc-live server on http://localhost:4821, and Playwright. Playwright is not
// installed in BYODC; it is borrowed from ~/remotion_reel (override with PLAYWRIGHT_DIR).
// It replays the step's answers from js/dev/trail-seed.json in a headless browser, checks
// every answer replayed, then rewrites that step's labels in the seed. If you added or
// removed a card, splice the answers array (`a`) in the seed first: one `true` per Next card.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { withSeed } from './seed-io.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_DIR || '/Users/ripu/remotion_reel/node_modules/playwright');
const [act, si, key] = process.argv.slice(2);
const P = new URL('../js/dev/trail-seed.json', import.meta.url).pathname;
const seed = JSON.parse(fs.readFileSync(P, 'utf8'));
const t = seed[key];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
// a saved nickname and buddy, so the start is not held up by the nickname box (2026-10-29)
await p.addInitScript(() => localStorage.setItem('byodc.profile.v1', JSON.stringify({ nickname: 'Review', avatar: 'byte' })));
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:4821/');
await p.waitForFunction(() => document.getElementById('dev-index-tab'));
await p.evaluate(() => localStorage.removeItem('byodc.dev.trail.v1'));
await p.reload(); await p.waitForFunction(() => document.getElementById('dev-index-tab'));
await p.evaluate(a => document.querySelector(`[data-begin="${a}"]`)?.click() ?? document.querySelector('[data-begin]').click(), act);
await p.waitForTimeout(1200);
await p.evaluate(([a, s]) => window.__byodcStartAct(+a, +s), [act, si]);
await p.waitForTimeout(1500);
await p.evaluate(([s, q]) => __byodcFlow.start(+s, q), [si, t.a.slice(0, -1)]);
await p.waitForFunction(() => !__byodcFlow.instant, null, { timeout: 60000 });
await p.waitForTimeout(1500);
const n = await p.evaluate(() => __byodcFlow.answers.length);
const rec = await p.evaluate(k => JSON.parse(__byodcDevTrails())[k], key);
console.log('replayed', n, 'of', t.a.length - 1, 'errors', errs);
if (rec && n === t.a.length - 1) {
  // re-read under the lock and change only this step, so a parallel session's edits survive
  await withSeed(fresh => {
    const f = fresh[key];
    f.l = rec.l.slice(0, f.a.length - 1).concat(f.l.slice(-1));
    f.l.forEach((l, i) => console.log(i + 1, l.k, l.t.slice(0, 80)));
  });
}
await b.close();
