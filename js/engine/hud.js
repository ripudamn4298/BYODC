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

// the whole point of the tiny early numbers is the escalation — format so the HUD
// grows from fractions of a cent to billions without ever changing its shape.
export function formatMoney(v){
  if (v < 1) return `$${v.toFixed(4)}`;
  if (v < 1000) return `$${v.toFixed(2)}`;
  if (v < 1e6) return `$${Math.round(v).toLocaleString('en-US')}`;
  if (v < 1e9) return `$${(v / 1e6).toFixed(2)}M`;
  return `$${(v / 1e9).toFixed(2)}B`;
}

export const hud = {
  cost: 0,
  init(){
    this.moneyEl = $('#money'); this.invEl = $('#inv'); this.stepEl = $('#stepmark');
  },
  setStep(i, total = 4, actLabel = 'ACT 1'){
    this.stepEl.innerHTML = `${actLabel} · STEP <b>${i + 1} / ${total}</b>`;
  },
  setCost(v){ this.cost = v; this.moneyEl.textContent = `SPENT ${formatMoney(v)}`; },
  setInventory(inv){ if (inv) this.invEl.innerHTML = `YOU HAVE: <b>${inv}</b>`; },
  addCost(d, inv, instant = false){
    const from = this.cost; this.cost += d;
    if (instant) this.moneyEl.textContent = `SPENT ${formatMoney(this.cost)}`;
    else {
      animateNumber(from, this.cost, 1000, v => { this.moneyEl.textContent = `SPENT ${formatMoney(v)}`; });
      this.moneyEl.classList.remove('pulse'); void this.moneyEl.offsetWidth; this.moneyEl.classList.add('pulse');
    }
    this.setInventory(inv);
  },
};
