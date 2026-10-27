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
  // Course restructure (2026-10-25): Acts 1 and 2 cost billionths of a dollar (COST_MODEL.md),
  // so tiny figures show as many decimals as it takes to reach two significant digits
  if (v > 0 && v < 0.01) return `$${v.toFixed(Math.min(12, Math.ceil(-Math.log10(v)) + 1)).replace(/(\.\d*?[1-9])0+$/, '$1')}`;
  if (v < 1) return `$${v.toFixed(4)}`;
  if (v < 1000){ const c = Math.round(v * 100) / 100; return `$${Number.isInteger(c) ? c : c.toFixed(2)}`; }
  if (v < 1e6) return `$${Math.round(v).toLocaleString('en-US')}`;
  if (v < 1e9) return `$${(v / 1e6).toFixed(2)}M`;
  return `$${(v / 1e9).toFixed(2)}B`;
}

export const hud = {
  cost: 0,
  init(){
    this.moneyEl = $('#money'); this.invEl = $('#inv'); this.stepEl = $('#stepmark');
    // Course restructure (2026-10-25): the ⓘ beside SPENT opens a note on what the figure counts
    const info = $('#money-info'), tip = $('#money-tip');
    if (info && tip){
      const set = open => { tip.hidden = !open; info.setAttribute('aria-expanded', String(open)); };
      info.addEventListener('click', e => { e.stopPropagation(); set(tip.hidden); });
      document.addEventListener('click', () => set(false));
      document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
    }
  },
  setStep(i, total = 4, actLabel = 'ACT 1'){
    this.stepEl.innerHTML = `${actLabel} · STEP <b>${i + 1} / ${total}</b>`;
  },
  setCost(v){ this.cost = v; this.moneyEl.textContent = `SPENT ${formatMoney(v)}`; },
  setInv(inv){ if (inv) this.invEl.innerHTML = `YOU HAVE: <b>${inv}</b>`; },
  addCost(d, inv, instant = false){
    const from = this.cost; this.cost += d;
    if (instant) this.moneyEl.textContent = `SPENT ${formatMoney(this.cost)}`;
    else {
      animateNumber(from, this.cost, 1000, v => { this.moneyEl.textContent = `SPENT ${formatMoney(v)}`; });
      this.moneyEl.classList.remove('pulse'); void this.moneyEl.offsetWidth; this.moneyEl.classList.add('pulse');
    }
    if (inv) this.invEl.innerHTML = `YOU HAVE: <b>${inv}</b>`;
  },
};
