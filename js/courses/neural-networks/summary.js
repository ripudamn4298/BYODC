import { $, el } from '../../engine/util.js';
import { guide } from '../../engine/guide.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';

export function showAiSummary(spec, onNext){
  Anim.clear(); guide.clear(); $('#guide-nav').innerHTML = '';
  const stage = $('#stage'); stage.innerHTML = '<span class="tk"></span>';
  const wrap = el('div',{class:'ai-summary'});
  wrap.innerHTML = `<p class="microlabel">LAB ${spec.lab} COMPLETE · EXPERIMENT LEDGER</p><h2>${spec.title}</h2><p>${spec.sub}</p><div class="ai-summary-list">${spec.items.map(item=>`<div class="ai-summary-row"><span>${item[0]}</span><b>${item[1]}</b><span>${item[2]}</span></div>`).join('')}</div>`;
  const row = el('div',{style:'display:flex;gap:12px;flex-wrap:wrap;margin-top:28px'});
  if(onNext){ const next=el('button',{class:'btn primary'},spec.next); next.addEventListener('click',()=>{SFX.click();onNext();}); row.appendChild(next); }
  const home=el('a',{class:'btn ghost',href:onNext?'index.html':'index.html#dashboard'},onNext?'Leave the lab':'Return to Techarium'); row.appendChild(home); wrap.appendChild(row); stage.appendChild(wrap);
  guide.title(`LAB ${spec.lab} · DEBRIEF`,spec.title);
  guide.say(spec.lab===4 ? `A transformer is still a neural network: signals move forward, errors shaped the weights during training, and attention decides which context to carry. <b>The final output is a ranked guess, not understanding or certainty.</b>` : `The lab ledger records a capability, not a metaphor. Every mechanism you used here becomes an input to the next lab.`);
  SFX.success();
}
