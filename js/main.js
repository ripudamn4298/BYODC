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
import { initLanding, teardownLanding } from './landing.js';
import {
  markCourseStarted,
  recordCourseActCompleted,
  recordCourseCompleted,
  recordCoursePosition,
  recordCourseStep,
} from './platform/profile-store.js';

guide.init();
hud.init();
initLanding();
Music.start();   // ambient bed runs from the landing page onward
                 // (browsers gate autoplay — it begins on the first tap/click)

const ACTS = {
  1: { steps: ACT1, summary: ACT1_SUMMARY, label: 'ACT 1', baseCost: 0, nextAct: 2, offset: 0, startingInventory: 'a pile of very pure sand' },
  2: { steps: ACT2, summary: ACT2_SUMMARY, label: 'ACT 2', baseCost: ACT2_BASE_COST, nextAct: 3, offset: 4, startingInventory: 'a CMOS inverter — the atom of computing' },
  3: { steps: ACT3, summary: ACT3_SUMMARY, label: 'ACT 3', baseCost: ACT3_BASE_COST, nextAct: 4, offset: 8, startingInventory: 'a datapath — fetch, compute, store, repeat' },
  4: { steps: ACT4, summary: ACT4_SUMMARY, label: 'ACT 4', baseCost: ACT4_BASE_COST, nextAct: 5, offset: 12, startingInventory: 'a tray of packaged, binned chips' },
  5: { steps: ACT5, summary: ACT5_SUMMARY, label: 'ACT 5', baseCost: ACT5_BASE_COST, nextAct: null, offset: 17, startingInventory: 'a GPU — your machine for mathematics' },
};
const COURSE_ID = 'byodc';
const COURSE_TOTAL_STEPS = Object.values(ACTS).reduce((sum, act) => sum + act.steps.length, 0);

function startAct(n){
  const act = ACTS[n];
  if (!act) return;
  hud.setInventory(act.startingInventory);
  markCourseStarted(COURSE_ID, { act: n, step: 1, totalSteps: COURSE_TOTAL_STEPS });
  flow.run(act.steps, {
    actLabel: act.label,
    baseCost: act.baseCost,
    onStepStart: ({ stepIndex }) => recordCoursePosition(COURSE_ID, { act: n, step: stepIndex + 1, totalSteps: COURSE_TOTAL_STEPS }),
    onStepComplete: ({ stepIndex }) => recordCourseStep(COURSE_ID, {
      act: n,
      step: stepIndex + 1,
      globalStep: act.offset + stepIndex + 1,
      totalSteps: COURSE_TOTAL_STEPS,
    }),
    onComplete: () => {
      recordCourseActCompleted(COURSE_ID, n);
      if (!act.nextAct) recordCourseCompleted(COURSE_ID);
      showSummary(act.summary, act.nextAct ? () => startAct(act.nextAct) : null);
    },
  });
}
window.__byodcStartAct = startAct;   // debug/verification hook (harmless)

let started = false;
function startGame(actId = 1){
  if (started) return;
  started = true;
  SFX.init(); SFX.click();
  teardownLanding();
  $('#landing').style.display = 'none';
  $('#game').classList.add('active');
  window.scrollTo(0, 0);
  Music.start();   // idempotent — already playing if the landing kicked it off
  startAct(actId);
}

document.querySelectorAll('[data-begin]').forEach(b =>
  b.addEventListener('click', () => startGame(+b.getAttribute('data-begin') || 1)));

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

const launchParams = new URLSearchParams(location.search);
if (launchParams.get('start') === '1'){
  const requestedAct = Math.min(5, Math.max(1, Number(launchParams.get('act')) || 1));
  startGame(requestedAct);
}
