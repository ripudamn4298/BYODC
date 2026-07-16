// BYODC engine — the narrated guide panel. All awaitable interactions route
// through flow.ask() so BACK / RESTART can replay them (see flow.js).
import { $, el, slug, RM } from './util.js';
import { SFX } from './sfx.js';
import { flow } from './flow.js';

export const guide = {
  root: null,
  init(){ this.root = $('#guide-scroll'); },
  clear(){ this.root.innerHTML = ''; },
  beat(node){
    node.classList.add('beat');
    if (flow.instant) node.classList.add('instant', 'in');
    this.root.appendChild(node);
    if (!flow.instant){
      requestAnimationFrame(() => requestAnimationFrame(() => node.classList.add('in')));
      setTimeout(() => node.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'nearest' }), 60);
    }
    return node;
  },
  title(eyebrow, html){
    this.beat(el('div', { class: 'step-head' },
      `<div class="eyebrow">${eyebrow}</div><h2>${html}</h2>`));
  },
  say(html){ return this.beat(el('p', { class: 'guide-p' }, html)); },
  note(html){ return this.beat(el('p', { class: 'guide-note' }, html)); },
  aha(html, sub){
    if (!flow.instant) SFX.success();
    return this.beat(el('div', { class: 'aha' }, html + (sub ? `<span class="sub">${sub}</span>` : '')));
  },
  async button(label, variant = 'primary'){
    const b = el('button', { class: 'btn ' + variant, 'data-label': slug(label) }, label);
    const row = this.beat(el('div', { class: 'btn-row' }));
    row.appendChild(b);
    await flow.ask(replay => {
      if (replay !== undefined){ b.disabled = true; b.classList.add('used'); return true; }
      return new Promise(res => b.addEventListener('click', () => {
        SFX.click(); b.disabled = true; b.classList.add('used'); res(true);
      }));
    });
  },
  next(label = 'Next ▸'){ return this.button(label, 'primary'); },
  choose(options){
    const row = this.beat(el('div', { class: 'choice-wrap' }));
    const btns = options.map(o => {
      const b = el('button', { class: 'btn choice', 'data-label': slug(o.label) },
        `<span>${o.label}</span>${o.hint ? `<small>${o.hint}</small>` : ''}`);
      row.appendChild(b); return { b, o };
    });
    const settle = v => btns.forEach(({ b, o }) => { b.disabled = true; b.classList.add(o.value === v ? 'picked' : 'used'); });
    return flow.ask(replay => {
      if (replay !== undefined){ settle(replay); return replay; }
      return new Promise(res => btns.forEach(({ b, o }) => b.addEventListener('click', () => {
        SFX.click(); settle(o.value); res(o.value);
      })));
    });
  },
  task(text){
    const t = this.beat(el('div', { class: 'task' }, `<span class="box"></span><span>${text}</span>`));
    return { done(){ t.classList.add('done'); if (!flow.instant) SFX.success(); } };
  },
  /* interactive truth table: player fills the OUT column by tapping cells (blank→0→1),
     then checks. Wrong answers shake + hint; resolves (and records) once all correct.
     spec: { heads:['A','B','OUT'], rows:[[0,0],[0,1],[1,0],[1,1]], expected:[1,1,1,0], hint } */
  truthTable(spec){
    const t = el('div', { class: 'tt' });
    t.innerHTML = `<div class="tt-row tt-head">${spec.heads.map(h => `<span>${h}</span>`).join('')}</div>`;
    const cells = spec.rows.map((row, ri) => {
      const r = el('div', { class: 'tt-row' });
      row.forEach(v => r.appendChild(el('span', {}, String(v))));
      const c = el('button', { class: 'tt-cell', 'data-label': `tt-row-${ri}` }, '·');
      c.state = null;
      c.addEventListener('click', () => {
        SFX.click();
        c.state = c.state === null ? 0 : c.state === 0 ? 1 : 0;
        c.textContent = String(c.state);
        c.classList.add('filled');
      });
      r.appendChild(c);
      t.appendChild(r);
      return c;
    });
    const rowBtn = el('div', { class: 'btn-row', style: 'margin-top:12px' });
    const check = el('button', { class: 'btn ghost', 'data-label': 'check-table' }, 'Check my table');
    rowBtn.appendChild(check);
    t.appendChild(rowBtn);
    this.beat(t);

    return flow.ask(replay => {
      const applyCorrect = () => {
        cells.forEach((c, i) => { c.textContent = String(spec.expected[i]); c.classList.add('filled', 'good'); c.disabled = true; });
        check.disabled = true; check.classList.add('used');
      };
      if (replay !== undefined){ applyCorrect(); return true; }
      return new Promise(res => {
        check.addEventListener('click', () => {
          SFX.click();
          if (cells.some(c => c.state === null)){
            guide.note(`Fill every row first — tap a cell to cycle it.`);
            return;
          }
          const wrong = cells.filter((c, i) => c.state !== spec.expected[i]);
          if (!wrong.length){
            applyCorrect();
            if (!flow.instant) SFX.success();
            res(true);
          } else {
            wrong.forEach(c => { c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); c.classList.add('bad'); setTimeout(() => c.classList.remove('bad'), 900); });
            if (spec.hint) guide.note(spec.hint);
          }
        });
      });
    });
  },
  milestone({ eyebrow = 'MILESTONE', title, meta = '', body = '', footer = '', className = '' }){
    return this.beat(el('div', { class: `biz-card milestone-card ${className}`.trim() },
      `<div class="eyebrow">${eyebrow}</div>
       <div class="co">${title}</div>
       ${meta ? `<div class="loc">${meta}</div>` : ''}
       ${body ? `<p>${body}</p>` : ''}
       ${footer ? `<div class="cost-line">${footer}</div>` : ''}`));
  },
  card(c){
    return this.milestone({
      eyebrow: 'VENTURE UPDATE', title: c.company,
      meta: `${c.location} · REVENUE ${c.revenue}`,
      body: c.body, footer: c.cost,
    });
  },
};
