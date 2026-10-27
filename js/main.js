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
    onProgress: step => progress.save(n, step),
    onComplete: () => {
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

document.querySelectorAll('[data-begin]').forEach(b =>
  b.addEventListener('click', () => startGame(+b.getAttribute('data-begin') || 1)));

/* ---- pick up where you left off ----------------------------------------
   A saved run turns on the resume buttons (hero + acts ladder). They stay
   hidden for a first-time visitor, so nothing new appears until it's earned. */
(function initResume(){
  const saved = progress.load();
  if (!saved) return;
  const act = ACTS[saved.act];
  if (!act || saved.step >= act.steps.length){ progress.clear(); return; }   // stale record

  document.querySelectorAll('[data-resume]').forEach(el => {
    el.hidden = false;
    el.textContent = `Resume — ${act.label} · step ${saved.step + 1} / ${act.steps.length} ▸`;
    el.addEventListener('click', () => startGame(saved.act, saved.step));
  });
  document.querySelectorAll('[data-new-visitor]').forEach(el => { el.hidden = true; });   // N-136
  document.querySelectorAll('[data-forget]').forEach(el => {
    el.hidden = false;
    el.addEventListener('click', () => { progress.clear(); location.reload(); });
  });
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
