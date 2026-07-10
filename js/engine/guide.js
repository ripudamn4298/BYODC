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
  card(c){
    this.beat(el('div', { class: 'biz-card' },
      `<div class="eyebrow">VENTURE UPDATE</div>
       <div class="co">${c.company}</div>
       <div class="loc">${c.location} · REVENUE ${c.revenue}</div>
       <p>${c.body}</p>
       <div class="cost-line">${c.cost}</div>`));
  },
};
