// SUMMARY — generic act debrief, driven by a spec object (see act.js / acts/act2/index.js).
// Not part of the flow.ask replay contract: the act is over, nothing here is recorded.
// spec: { eyebrow, title, sub, items:[{icon?, nm, amt}], totalNote, locked:{title, note},
//         next?:{label}, debrief:{eyebrow, title, paras:[…]} }
import { $, el } from '../engine/util.js';
import { SFX } from '../engine/sfx.js';
import { guide } from '../engine/guide.js';
import { hud, formatMoney } from '../engine/hud.js';
import { Anim } from '../engine/anim.js';

export function showSummary(spec, onNext){
  Anim.clear();
  guide.clear();
  $('#guide-nav').innerHTML = '';

  const stageEl = $('#stage');
  stageEl.innerHTML = '<span class="tk"></span>';

  const rows = spec.items.map((it, i) => `
    <div class="row">${it.icon || ''}<span class="microlabel idx">0${i + 1}</span>
      <span class="nm">${it.nm}</span><span class="amt">${it.amt}</span></div>`).join('');

  const wrap = el('div', { class: 'summary' });
  wrap.innerHTML = `
    <div class="eyebrow">${spec.eyebrow}</div>
    <h2>${spec.title}</h2>
    <p class="sub">${spec.sub}</p>
    <div class="ledger">
      ${rows}
      <div class="total"><span>TOTAL SPENT</span><span>${formatMoney(hud.cost)}${spec.totalNote || ''}</span></div>
    </div>
    <div class="locked">
      <span>🔒</span>
      <span>${spec.locked.title}
        <div class="microlabel">${spec.locked.note}</div>
      </span>
    </div>`;
  const btnRow = el('div', { style: 'margin-top:30px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap' });
  if (spec.next && onNext){
    const next = el('button', { class: 'btn primary', 'data-label': 'continue-next-act' }, spec.next.label);
    next.addEventListener('click', () => { SFX.click(); onNext(); });
    btnRow.appendChild(next);
  }
  const replay = el('button', { class: 'btn ' + (spec.next ? 'ghost' : 'primary'), 'data-label': 'replay' }, 'Start over ↺');
  replay.addEventListener('click', () => location.reload());
  btnRow.appendChild(replay);
  wrap.appendChild(btnRow);
  stageEl.appendChild(wrap);

  guide.title(spec.debrief.eyebrow, spec.debrief.title);
  spec.debrief.paras.forEach(p => guide.say(p));
  SFX.success();
}
