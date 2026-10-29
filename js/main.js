// BYODC — boot: landing ⇄ game
import { $, RM } from './engine/util.js';
import { SFX } from './engine/sfx.js';
import { guide } from './engine/guide.js';
import { hud } from './engine/hud.js';
import { flow } from './engine/flow.js';
import { Music } from './engine/music.js';
import { ACT1, ACT1_SUMMARY } from './steps/act.js';
import { ACT2, ACT2_SUMMARY, ACT2_BASE_COST } from './acts/act2/index.js';
import { ACT3, ACT3_SUMMARY, ACT3_BASE_COST } from './acts/act3/index.js';
import { ACT4, ACT4_SUMMARY, ACT4_BASE_COST } from './acts/act4/index.js';
import { ACT5, ACT5_SUMMARY, ACT5_BASE_COST } from './acts/act5/index.js';
import { showSummary } from './steps/summary.js';
import { progress } from './engine/progress.js';
import { initLanding, teardownLanding } from './landing.js';
import { account } from './account.js';
import { reachStore } from './reach.js';
import { courseIndex } from './course-index.js';
import { floor } from './companion/floor.js';

guide.init();
hud.init();
initLanding();
Music.start();   // ambient bed runs from the landing page onward
                 // (browsers gate autoplay — it begins on the first tap/click)

const ACTS = {
  1: { steps: ACT1, summary: ACT1_SUMMARY, label: 'ACT 1', baseCost: 0, nextAct: 2 },
  2: { steps: ACT2, summary: ACT2_SUMMARY, label: 'ACT 2', baseCost: ACT2_BASE_COST, nextAct: 3 },
  3: { steps: ACT3, summary: ACT3_SUMMARY, label: 'ACT 3', baseCost: ACT3_BASE_COST, nextAct: 4 },
  4: { steps: ACT4, summary: ACT4_SUMMARY, label: 'ACT 4', baseCost: ACT4_BASE_COST, nextAct: 5 },
  5: { steps: ACT5, summary: ACT5_SUMMARY, label: 'ACT 5', baseCost: ACT5_BASE_COST, nextAct: null },
};

let currentAct = 1;
function startAct(n, startAt = 0, replay = {}){
  const act = ACTS[n];
  if (!act) return;
  currentAct = n;
  $('#game').dataset.act = String(n);   // Ripu (2026-10-25): per-act styling, retro buttons in Act 1 first
  flow.run(act.steps, {
    actLabel: act.label,
    baseCost: act.baseCost,
    startAt,
    queue: replay.queue,     // dev index only: land on a card mid-step
    saved: replay.saved,
    // Ripu (2026-10-28): every live answer reaches the next card; the index unlocks up to it
    onAnswer: (s, k) => { reachStore.reached(n, s, k); account.notePlace(n, s); },
    onProgress: step => {
      if (step < act.steps.length) reachStore.reached(n, step, 0);
      progress.save(n, step); account.saveProgress(n, step);
    },
    onComplete: () => {
      reachStore.finished(n);
      account.saveProgress(act.nextAct || n, act.nextAct ? 0 : act.steps.length - 1);
      // park the player at the top of the next act — or forget the run
      // entirely once the whole course is finished
      if (act.nextAct) progress.save(act.nextAct, 0); else progress.clear();
      showSummary(act.summary, act.nextAct ? () => startAct(act.nextAct) : null);
    },
  });
}
window.__byodcStartAct = startAct;   // debug/verification hook (harmless)

let started = false;
function startGame(actId = 1, startAt = 0, replay = {}){
  if (started) return;
  started = true;
  SFX.init(); SFX.click();
  teardownLanding();
  $('#landing').style.display = 'none';
  $('#game').classList.add('active');
  window.scrollTo(0, 0);
  Music.start();   // idempotent — already playing if the landing kicked it off
  floor.show();
  startAct(actId, startAt, replay);
}

/* ---- dev index (localhost only) ----------------------------------------
   A review drawer that jumps to any act, step or card. It is never loaded on
   the live site: the import only happens when the page is served locally. */
if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)){
  import('./dev/index-panel.js').then(m => m.initDevIndex({
    acts: ACTS,
    currentAct: () => currentAct,
    jump(n, step, replay){
      if (started) startAct(n, step, replay); else startGame(n, step, replay);
    },
  })).catch(err => console.warn('[BYODC dev index] not loaded:', err));
}

/* ---- accounts (Ripu, 2026-10-27) ----------------------------------------
   On the live site every start goes through account.gate: sign in with Google or play as
   a guest, and pick a nickname. Locally there is no backend, so the gate lets you straight in. */
await reachStore.init(ACTS);
await account.init();

/* ---- the course index, and the buddy's floor (Ripu, 2026-10-28) ------------
   The index opens any card the learner has reached; a jump from the landing page goes
   through the same gate as every other start. */
courseIndex.init({
  acts: ACTS,
  where: () => (started && flow.steps.length && !document.querySelector('#guide-scroll .summary'))
    ? { act: currentAct, step: flow.stepIndex, card: flow.answers.length } : null,
  jump(n, step, replay){
    if (started) startAct(n, step, replay);
    else account.gate(() => startGame(n, step, replay), { act: n, step });
  },
});
floor.init({ acts: ACTS, openIndex: () => courseIndex.open() });

document.querySelectorAll('[data-begin]').forEach(b =>
  b.addEventListener('click', () => {
    const n = +b.getAttribute('data-begin') || 1;
    account.gate(() => startGame(n), { act: n, step: 0 });
  }));

/* ---- pick up where you left off ----------------------------------------
   A saved run turns on the resume buttons (hero + acts ladder). They stay
   hidden for a first-time visitor, so nothing new appears until it's earned. */
(function initResume(){
  // a signed-in builder's saved place wins when it is newer than this browser's
  const local = progress.load(), remote = account.user?.progress;
  if (remote && (!local || (remote.at || 0) > (local.at || 0))) progress.save(remote.act, remote.step);
  const saved = progress.load();
  if (!saved) return;
  const act = ACTS[saved.act];
  if (!act || saved.step >= act.steps.length){ progress.clear(); return; }   // stale record

  document.querySelectorAll('[data-resume]').forEach(el => {
    el.hidden = false;
    el.textContent = `Resume — ${act.label} · step ${saved.step + 1} / ${act.steps.length} ▸`;
    el.addEventListener('click', () => account.gate(() => startGame(saved.act, saved.step), { act: saved.act, step: saved.step }));
  });
  document.querySelectorAll('[data-new-visitor]').forEach(el => { el.hidden = true; });   // N-136
  document.querySelectorAll('[data-forget]').forEach(el => {
    el.hidden = false;
    el.addEventListener('click', () => { progress.clear(); location.reload(); });
  });
})();

/* back from Google: name the builder if needed, then one click starts where they asked */
(function afterGoogle(){
  const q = new URLSearchParams(location.search);
  if (!q.has('signedin') && !q.has('signin')) return;
  history.replaceState(null, '', location.pathname + location.hash);
  if (q.get('signin') === 'failed'){
    account.modal(`<div class="acct-kicker">SIGN-IN</div><h3 class="acct-title">THAT DID NOT WORK</h3>
      <p class="acct-copy">Google did not finish signing you in. Try again, or play as a guest.</p>`,
      [{ label: 'OK', value: 'ok', primary: true }]);
    return;
  }
  const act = Math.min(5, Math.max(1, +q.get('act') || 1)), step = Math.max(0, +q.get('step') || 0);
  account.afterSignIn(() => startGame(act, step));
})();

// one mute, two buttons (landing nav + game HUD): silences music AND effects together
const muteBtns = [...document.querySelectorAll('#mute, #lmute')];
function setMuted(m){
  SFX.init();
  SFX.muted = m;
  Music.setMuted(m);
  muteBtns.forEach(b => { b.textContent = m ? '∅' : '♪'; b.setAttribute('aria-label', m ? 'unmute' : 'mute'); });
}
muteBtns.forEach(b => b.addEventListener('click', () => {
  Music.start();               // the click is a user gesture — lets autoplay through
  setMuted(!SFX.muted);
}));
