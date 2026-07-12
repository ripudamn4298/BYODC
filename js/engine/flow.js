// BYODC engine — act runner with BACK / RESTART via record-and-replay.
// Steps are deterministic async fns; every interaction resolves through flow.ask()
// and is recorded. Back = re-run the step, auto-answering all but the last answer.
import { $, el, setInstantCheck, cancelAllWaits } from './util.js';
import { Anim } from './anim.js';
import { SFX } from './sfx.js';
import { guide } from './guide.js';
import { hud } from './hud.js';
import { Music } from './music.js';

export const flow = {
  steps: [],
  stepIndex: 0,
  answers: [],
  queue: [],
  saved: [],            // answers of completed steps
  instant: false,
  _epoch: 0,
  _hints: new Set(),
  onComplete: null,

  get stale(){ return false; },

  /* the one gate every interaction passes through */
  async ask(fn){
    const ep = this._epoch;
    let v;
    if (this.queue.length){
      const r = this.queue.shift();
      v = await fn(r);
      this.answers.push(r);
      if (!this.queue.length) this._exitInstant();
    } else {
      v = await fn(undefined);
      if (ep !== this._epoch) return new Promise(() => {});   // abandoned run: freeze
      this.answers.push(v);
    }
    if (ep !== this._epoch) return new Promise(() => {});
    this.updateNav();
    return v;
  },

  /* guarded hint: fires only if the run is still current */
  hintAfter(ms, text){
    const ep = this._epoch;
    const id = setTimeout(() => { if (ep === this._epoch) guide.note(text); }, ms);
    this._hints.add(id);
    return () => { clearTimeout(id); this._hints.delete(id); };
  },

  _enterInstant(){ this.instant = true; this._sfxWas = SFX.muted; SFX.muted = true; },
  _exitInstant(){
    if (!this.instant) return;
    this.instant = false;
    SFX.muted = this._sfxWas || false;
    // reveal all instantly-rendered beats
    document.querySelectorAll('#guide-scroll .beat').forEach(b => b.classList.add('in'));
  },

  start(stepIndex, queue = []){
    this._epoch++;
    this.stepIndex = stepIndex;
    this.queue = queue;
    this.answers = [];
    cancelAllWaits();
    this._hints.forEach(id => clearTimeout(id));
    this._hints.clear();
    Anim.clear();
    if (queue.length) this._enterInstant(); else this._exitInstant();
    this._runner();
  },

  async _runner(){
    const ep = this._epoch;
    const guard = () => ep === this._epoch;
    while (this.stepIndex < this.steps.length){
      const step = this.steps[this.stepIndex];
      hud.setStep(this.stepIndex, this.steps.length, this.actLabel);
      Music.setIntensity(this.steps.length > 1 ? this.stepIndex / (this.steps.length - 1) : 0);
      hud.setCost(this.baseCost + this.steps.slice(0, this.stepIndex).reduce((s, x) => s + x.costDelta, 0));
      guide.clear();
      this.updateNav();
      try {
        await step.run();
      } catch (err){
        if (!guard()) return;
        console.error('[BYODC] step crashed:', err);
        this._exitInstant();
        guide.note(`Something glitched on the bench — hit <b>↺ Restart step</b> above to reset it. (The fault is ours, not yours.)`);
        return;   // halt this runner; Restart/Back still work
      }
      if (!guard()) return;
      // post-step: venture card, cost tick, premise, CTA
      guide.card(step.businessCard);
      hud.addCost(step.costDelta, step.inventory, this.instant);
      if (step.premise) guide.say(step.premise);
      await guide.button(step.cta);
      if (!guard()) return;
      this.saved[this.stepIndex] = this.answers.slice();
      this.stepIndex++;
      this.answers = [];
      if (this.queue.length){ /* continuing a multi-step replay — not used, clear */ this.queue = []; }
      this._exitInstant();
    }
    if (guard() && this.onComplete) this.onComplete();
  },

  back(){
    if (this.instant) return;                       // ignore while replaying
    if (this.answers.length > 0){
      this.start(this.stepIndex, this.answers.slice(0, -1));
    } else if (this.stepIndex > 0){
      const prev = this.saved[this.stepIndex - 1] || [];
      this.start(this.stepIndex - 1, prev.slice(0, -1));
    }
  },
  restart(){
    if (this.instant) return;
    this.start(this.stepIndex, []);
  },

  initNav(){
    const nav = $('#guide-nav');
    nav.innerHTML = '';
    this._backBtn = el('button', { class: 'btn micro', 'data-label': 'back' }, '← Back');
    this._restartBtn = el('button', { class: 'btn micro', 'data-label': 'restart-step' }, '↺ Restart step');
    this._backBtn.addEventListener('click', () => { SFX.click(); this.back(); });
    this._restartBtn.addEventListener('click', () => { SFX.click(); this.restart(); });
    nav.append(this._backBtn, this._restartBtn);
  },
  updateNav(){
    if (!this._backBtn) return;
    this._backBtn.disabled = this.stepIndex === 0 && this.answers.length === 0;
    this._restartBtn.disabled = this.answers.length === 0;
  },

  /* opts: { onComplete, actLabel='ACT 1', baseCost=0 } — baseCost carries the
     cumulative spend from earlier acts into the HUD. */
  run(steps, opts = {}){
    if (typeof opts === 'function') opts = { onComplete: opts };
    this.steps = steps;
    this.onComplete = opts.onComplete || null;
    this.actLabel = opts.actLabel || 'ACT 1';
    this.baseCost = opts.baseCost || 0;
    this.saved = [];
    this.initNav();
    window.__byodcFlow = this;   // debug/verification hook (harmless)
    this.start(0, []);
  },
};

setInstantCheck(() => flow.instant);
