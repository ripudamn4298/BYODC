// BYODC engine — fresh stage per step: 720×480 SVG + controls row
import { $, el, svgEl } from './util.js';
import { Anim } from './anim.js';

export function newStage(numeral, label){
  Anim.clear();
  const stageEl = $('#stage');
  stageEl.innerHTML = '<span class="tk"></span>';
  const svg = svgEl('svg', { viewBox: '0 0 720 480', class: 'stage-svg', role: 'img', 'aria-label': label || '' });
  if (numeral){
    const wm = svgEl('text', { x: 702, y: 452, 'text-anchor': 'end', class: 'wm' });
    wm.textContent = numeral; svg.appendChild(wm);
  }
  stageEl.appendChild(svg);
  const controls = el('div', { class: 'stage-controls' });
  stageEl.appendChild(controls);
  return { svg, controls, stageEl };
}
