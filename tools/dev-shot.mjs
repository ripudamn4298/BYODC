// Dev only. Screenshots one card of one step, after replaying the seed's answers up to it.
//
//   node tools/dev-shot.mjs <act> <stepIndex> <stepKey> <card> [out.png] [--stage] [--wait=ms]
//   e.g. node tools/dev-shot.mjs 3 1 3:litho 16 /tmp/litho16.png
//
// <card> is 1-based, as the INDEX numbers it. --stage crops to the stage. Same needs as
// dev-relabel-step.mjs: the byodc-live server on :4821, and Playwright from ~/remotion_reel.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_DIR || '/Users/ripu/remotion_reel/node_modules/playwright');
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const stageOnly = process.argv.includes('--stage');
const waitArg = process.argv.find(a => a.startsWith('--wait='));
const settle = waitArg ? +waitArg.slice(7) : 2200;      // --wait=ms for long animations
const [act, si, key, card, out = `shot-${key.replace(':', '-')}-${card}.png`] = args;
const seed = JSON.parse(fs.readFileSync(new URL('../js/dev/trail-seed.json', import.meta.url), 'utf8'));
const t = seed[key];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
// a saved nickname and buddy, so the start is not held up by the nickname box (2026-10-29)
await p.addInitScript(() => localStorage.setItem('byodc.profile.v1', JSON.stringify({ nickname: 'Review', avatar: 'byte' })));
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:4821/');
await p.waitForFunction(() => document.getElementById('dev-index-tab'));
await p.evaluate(a => document.querySelector(`[data-begin="${a}"]`)?.click() ?? document.querySelector('[data-begin]').click(), act);
await p.waitForTimeout(1200);
await p.evaluate(([a, s]) => window.__byodcStartAct(+a, +s), [act, si]);
await p.waitForTimeout(1500);
await p.evaluate(([s, q]) => __byodcFlow.start(+s, q), [si, t.a.slice(0, +card - 1)]);
await p.waitForFunction(() => !__byodcFlow.instant, null, { timeout: 60000 });
await p.waitForTimeout(settle);
const target = stageOnly ? await p.$('.stage-svg') : p;
await target.screenshot({ path: out });
console.log('saved', out, 'errors', errs);
await b.close();
