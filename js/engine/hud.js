// BYODC engine — HUD: wordmark, step marker, running cost, inventory, mute
import { $, RM } from './util.js';

function animateNumber(from, to, ms, fn){
  if (RM){ fn(to); return; }
  const t0 = performance.now();
  const step = t => {
    const k = Math.min(1, (t - t0) / ms);
    fn(from + (to - from) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export const hud = {
  cost: 0,
  init(){
    this.moneyEl = $('#money'); this.invEl = $('#inv'); this.stepEl = $('#stepmark');
  },
  setStep(i, total = 4){
    this.stepEl.innerHTML = `ACT 1 · STEP <b>${i + 1} / ${total}</b>`;
  },
  setCost(v){ this.cost = v; this.moneyEl.textContent = `SPENT $${v.toFixed(4)}`; },
  addCost(d, inv, instant = false){
    const from = this.cost; this.cost += d;
    if (instant) this.moneyEl.textContent = `SPENT $${this.cost.toFixed(4)}`;
    else {
      animateNumber(from, this.cost, 1000, v => { this.moneyEl.textContent = `SPENT $${v.toFixed(4)}`; });
      this.moneyEl.classList.remove('pulse'); void this.moneyEl.offsetWidth; this.moneyEl.classList.add('pulse');
    }
    if (inv) this.invEl.innerHTML = `YOU HAVE: <b>${inv}</b>`;
  },
};
