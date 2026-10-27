// BYODC — the course index (Ripu, 2026-10-28). A drawer listing every act, step and card.
//
//   - Every act is open from its first card.
//   - Inside an act, each card unlocks the next: cards ahead of the furthest one reached are
//     faded and locked (js/reach.js).
//   - Any open card can be opened from here. A card inside a step is reached by replaying the
//     recorded path through that step (the same record-and-replay the Back button uses).
//
// Opened from the INDEX button in the game's top bar, the Index link on the landing page, or
// the act progress bar on the floor. Esc closes it.
import { flow } from './engine/flow.js';
import { reachStore } from './reach.js';

const NAMES = {
  1: 'Build Your Own Transistor',
  2: 'Build Your Own Processor',
  3: 'Build Your Own Chip',
  4: 'Build Your Own GPU',
  5: 'Build Your Own Data Centre',
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const text = html => String(html).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const LOCK = `<svg class="ci-lock" viewBox="0 0 7 8" width="10" height="12" shape-rendering="crispEdges" aria-hidden="true">
  <path d="M2 0h3v1H2zM1 1h1v2H1zM5 1h1v2H5zM0 3h7v5H0z" fill="currentColor"/><path d="M3 5h1v1H3z" fill="var(--paper-high)"/></svg>`;

let api, root, list;
const openActs = {}, openSteps = {};

/* a card's label: the recorded card text, tidied */
function cardLabel(l){
  if (!l) return 'Card';
  if (l.k === 'wrap') return 'End of step';
  return text(l.t).replace(/^↳\s*/, '');
}

function render(){
  const here = api.where();
  const scroll = list.scrollTop;
  list.innerHTML = '';
  for (const n of Object.keys(api.acts).map(Number)){
    const act = api.acts[n];
    const r = reachStore.get(n);
    const f = reachStore.fraction(n);
    const isOpen = openActs[n] ?? (here ? here.act === n : n === 1);
    const sec = document.createElement('section');
    sec.className = 'ci-act' + (r.done ? ' done' : '');
    sec.innerHTML = `<button class="ci-act-h" aria-expanded="${isOpen}">
        <span class="ci-car">${isOpen ? '▾' : '▸'}</span>
        <span class="ci-act-t"><span class="n">ACT ${n}</span><span class="t">${NAMES[n]}</span></span>
        <span class="ci-meter" title="${Math.round(f * 100)}% reached"><i style="width:${(f * 100).toFixed(1)}%"></i></span>
        <span class="ci-pct">${r.done ? '✓ DONE' : Math.round(f * 100) + '%'}</span></button>`;
    sec.firstElementChild.addEventListener('click', () => { openActs[n] = !isOpen; render(); });
    list.appendChild(sec);
    if (!isOpen) continue;

    act.steps.forEach((step, s) => {
      const key = `${n}:${s}`;
      const trail = reachStore.trail(n, s);
      const total = reachStore.cardsIn(n, s);
      const stepOpen = reachStore.isOpen(n, s, 0);
      const hereStep = here && here.act === n && here.step === s;
      const showCards = openSteps[key] ?? hereStep;
      const reached = r.done || s < r.s ? total : s === r.s ? r.k + 1 : 0;
      const row = document.createElement('div');
      row.className = 'ci-step' + (stepOpen ? '' : ' locked') + (hereStep ? ' here' : '');
      row.innerHTML = `<button class="ci-car" aria-label="show cards" ${stepOpen ? '' : 'disabled'}>${showCards && stepOpen ? '▾' : '▸'}</button>
        <button class="ci-go" ${stepOpen ? '' : 'disabled'}><span class="n">${n}.${s + 1}</span><span class="t">${esc(text(step.title))}</span></button>
        <span class="ci-cnt">${stepOpen ? `${Math.min(reached, total)} / ${total}` : LOCK}</span>`;
      if (stepOpen){
        row.querySelector('.ci-car').addEventListener('click', () => { openSteps[key] = !showCards; render(); });
        row.querySelector('.ci-go').addEventListener('click', () => go(n, s, 0));
      }
      sec.appendChild(row);
      if (!showCards || !stepOpen) return;

      const ul = document.createElement('ul');
      ul.className = 'ci-cards';
      for (let k = 0; k < total; k++){
        const open = reachStore.isOpen(n, s, k);
        const li = document.createElement('li');
        li.innerHTML = `<button class="ci-card${open ? '' : ' locked'}${hereStep && here.card === k ? ' here' : ''}" ${open ? '' : 'disabled'}
          title="${open ? '' : 'Finish the cards before this one to open it.'}">
          <span class="n">${n}.${s + 1}.${k + 1}</span><span class="x">${esc(cardLabel(trail.l[k]))}</span>${open ? '' : LOCK}</button>`;
        if (open) li.firstElementChild.addEventListener('click', () => go(n, s, k));
        ul.appendChild(li);
      }
      sec.appendChild(ul);
    });
  }
  list.scrollTop = scroll;
}

function go(act, s, k){
  if (flow.instant) return;                     // still replaying the last jump
  if (!reachStore.isOpen(act, s, k)) return;
  const trail = reachStore.trail(act, s);
  const queue = trail.a.slice(0, k);
  // Back from the first card should land on the previous step's last card, so hand over
  // the recorded answers of every step before this one
  const saved = api.acts[act].steps.slice(0, s).map((_, i) => reachStore.trail(act, i).a.slice());
  courseIndex.close();
  api.jump(act, s, { queue, saved });
}

export const courseIndex = {
  init(o){
    api = o;
    root = document.createElement('aside');
    root.id = 'course-index';
    root.setAttribute('aria-label', 'Course index');
    root.innerHTML = `<div class="ci-scrim"></div><div class="ci-panel">
      <div class="ci-head"><h2>INDEX</h2><button class="ci-x" aria-label="close">✕</button></div>
      <p class="ci-sub">Every act opens from its first card. Inside an act, finishing a card opens the next one.</p>
      <div class="ci-list"></div></div>`;
    document.body.appendChild(root);
    list = root.querySelector('.ci-list');
    root.querySelector('.ci-x').addEventListener('click', () => this.close());
    root.querySelector('.ci-scrim').addEventListener('click', () => this.close());
    addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('open')) this.close(); });
    document.querySelectorAll('[data-open-index]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); this.open(); }));
    reachStore.onChange(() => { if (root.classList.contains('open')) render(); });
  },
  open(){
    render();
    root.classList.add('open');
    requestAnimationFrame(() => list.querySelector('.ci-card.here, .ci-step.here')?.scrollIntoView({ block: 'center' }));
  },
  close(){ root.classList.remove('open'); },
};
