// SUMMARY — Act 1 debrief. Called after step4's CTA. Not part of the flow.ask
// replay contract: the act is over, nothing here needs to be recorded/replayed.
import { $, el } from '../engine/util.js';
import { SFX } from '../engine/sfx.js';
import { guide } from '../engine/guide.js';
import { hud } from '../engine/hud.js';
import { Anim } from '../engine/anim.js';

function icon(kind){
  const map = {
    wafer: `<svg width="30" height="30" viewBox="0 0 34 34"><g fill="none" stroke="var(--ink-soft)" stroke-width="1.4">
      <circle cx="11" cy="11" r="4"/><circle cx="23" cy="11" r="4"/><circle cx="11" cy="23" r="4"/><circle cx="23" cy="23" r="4"/>
      <path d="M15 11h4M15 23h4M11 15v4M23 15v4"/></g>
      <circle cx="23" cy="11" r="4" fill="var(--blue-soft)" stroke="var(--blue)"/></svg>`,
    bjt: `<svg width="30" height="30" viewBox="0 0 34 34">
      <rect x="3" y="10" width="10" height="14" rx="2" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.3"/>
      <rect x="13" y="10" width="8" height="14" rx="1.5" fill="var(--red-soft)" stroke="var(--red)" stroke-width="1.3"/>
      <rect x="21" y="10" width="10" height="14" rx="2" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.3"/>
      <path d="M17 3v7" stroke="var(--ink-soft)" stroke-width="1.4"/></svg>`,
    mosfet: `<svg width="30" height="30" viewBox="0 0 34 34">
      <rect x="4" y="18" width="26" height="11" rx="2" fill="var(--red-soft)" stroke="var(--red)" stroke-width="1.3"/>
      <rect x="10" y="14" width="14" height="3" fill="var(--amber)"/>
      <rect x="10" y="6" width="14" height="7" rx="1.5" class="gate-metal"/>
      <path d="M11 20h12" stroke="var(--blue)" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    cmos: `<svg width="30" height="30" viewBox="0 0 34 34">
      <path d="M17 3v6M17 25v6M17 13v8" stroke="var(--ink-soft)" stroke-width="1.4"/>
      <rect x="11" y="7" width="12" height="8" rx="2" fill="var(--red-soft)" stroke="var(--red)" stroke-width="1.3"/>
      <rect x="11" y="19" width="12" height="8" rx="2" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.3"/>
      <circle cx="27" cy="17" r="2.6" fill="var(--ink)"/></svg>`,
  };
  return map[kind] || '';
}

export function showSummary(){
  Anim.clear();
  guide.clear();
  $('#guide-nav').innerHTML = '';

  const stageEl = $('#stage');
  stageEl.innerHTML = '<span class="tk"></span>';

  const wrap = el('div', { class: 'summary' });
  wrap.innerHTML = `
    <div class="eyebrow">ACT 1 COMPLETE</div>
    <h2>You built the switch <em>that runs the world</em></h2>
    <p class="sub">From a pinch of doped sand to a CMOS inverter — the exact cell every processor
    ever made repeats billions of times. And you did it on pocket change:</p>
    <div class="ledger">
      <div class="row">${icon('wafer')}<span class="microlabel idx">01</span><span class="nm">Doped P/N wafer</span><span class="amt">$0.0004</span></div>
      <div class="row">${icon('bjt')}<span class="microlabel idx">02</span><span class="nm">NPN transistor</span><span class="amt">$0.0002</span></div>
      <div class="row">${icon('mosfet')}<span class="microlabel idx">03</span><span class="nm">MOSFET</span><span class="amt">$0.0003</span></div>
      <div class="row">${icon('cmos')}<span class="microlabel idx">04</span><span class="nm">CMOS inverter</span><span class="amt">$0.0006</span></div>
      <div class="total"><span>TOTAL SPENT</span><span>$${hud.cost.toFixed(4)} — still less than a grain of rice</span></div>
    </div>
    <div class="locked">
      <span>🔒</span>
      <span>ACT 2 — From Switches to Logic, Math &amp; Memory
        <div class="microlabel">your inverter is about to learn to think</div>
      </span>
    </div>`;
  const replay = el('button', { class: 'btn primary', 'data-label': 'replay', style: 'margin-top:30px' }, 'Replay Act 1 ↺');
  replay.addEventListener('click', () => location.reload());
  wrap.appendChild(replay);
  stageEl.appendChild(wrap);

  guide.title('ACT 1 · DEBRIEF', 'Physics of a Switch — <em>cleared</em>');
  guide.say(`Doping gave silicon its carriers. The junction sandwich gave you control. The gate made control free. And the twin pair made it scale. <b>Everything from here — logic, math, memory, GPUs, data centers — is just this switch, repeated.</b>`);
  guide.say(`Nanovolt Semiconductors started the act doping one wafer in Penang. It ends the act shipping logic cells from Hsinchu. <em>Next: teach your switches to think.</em>`);
  SFX.success();
}
