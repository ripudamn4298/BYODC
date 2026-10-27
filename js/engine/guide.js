// BYODC engine — the narrated guide panel. All awaitable interactions route
// through flow.ask() so BACK / RESTART can replay them (see flow.js).
import { $, el, slug, RM } from './util.js';
import { SFX } from './sfx.js';
import { flow } from './flow.js';

export const guide = {
  root: null,
  _cards: null,          // { slot, actions } while a step is in card mode
  init(){ this.root = $('#guide-scroll'); },
  clear(){ this.root.innerHTML = ''; this._cards = null; },

  /* ---------- card mode (DESIGN_MAKEOVER.md §2 rule 1) ----------
     The panel holds ONE block of text. Next replaces it in the same place.
     No history stack is needed: every card boundary is already a flow.ask(),
     so BACK re-runs the step one answer short and lands on the previous card.
     Call after title(), so the step head stays pinned above the card. */
  cards(){
    const slot = el('div', { class: 'card-slot' });
    const hint = el('div', { class: 'card-hint', hidden: '' });
    const actions = el('div', { class: 'card-actions' });
    this.root.append(slot, hint, actions);
    this._cards = { slot, hint, actions };
    return this;
  },
  endCards(){ this._cards = null; },
  /* Ripu (2026-10-25): when a step's cards are done, the last card (usually an In the Lab
     card) no longer stays above the real-numbers box. The card slot becomes one label,
     "END OF STEP 1.1", which marks the place in the journey and points down to the button. */
  stepEnd(label){
    if (!this._cards) return;
    const { slot, hint, actions } = this._cards;
    slot.innerHTML = '';
    slot.classList.add('ended');
    hint.innerHTML = ''; hint.hidden = true;
    actions.innerHTML = ''; actions.hidden = true;
    slot.appendChild(el('div', { class: 'step-end' }, `<span>${label}</span>`));
  },

  /* A hint must never replace the card it is helping with. In card mode it gets
     its own slot below the card; outside card mode it is an ordinary note. */
  hint(html){
    if (!this._cards) return this.note(html);
    const h = this._cards.hint;
    h.innerHTML = `<p class="guide-note">${html}</p>`;
    h.hidden = false;
    return h;
  },
  clearHint(){
    if (this._cards){ this._cards.hint.innerHTML = ''; this._cards.hint.hidden = true; }
  },

  /* replace whatever is in `host` with `node`; the outgoing card is taken out of
     flow while it fades so the incoming one does not get pushed down the panel. In the card
     slot the swap is sequential (N-053): out in 140 ms, then the new card fades in.
     Every current child is retired, not just the first: taking firstElementChild
     twice inside the 260 ms fade picked the SAME node both times and orphaned the
     card appended in between, so the slot grew by one on every fast swap. */
  _swap(host, node){
    if (flow.instant){
      host.innerHTML = '';
      node.classList.add('instant', 'in');
      host.appendChild(node);
      return node;
    }
    for (const old of Array.from(host.children)){
      if (old.classList.contains('out')) continue;    // already retiring
      old.style.position = 'absolute';
      old.style.insetInlineStart = '0';
      old.style.top = '0';
      old.style.width = '100%';
      old.classList.add('out');
      setTimeout(() => old.remove(), 150);     // matches .card-slot .beat.out in game.css (N-053)
    }
    host.appendChild(node);
    requestAnimationFrame(() => requestAnimationFrame(() => node.classList.add('in')));
    return node;
  },

  beat(node, where){
    node.classList.add('beat');
    if (this._cards){
      // a fresh card retires the buttons and the hint that belonged to the previous one
      if (where !== 'actions'){
        this._cards.actions.innerHTML = ''; this.clearHint();
        // Ripu (2026-10-28): the buddy on the floor (js/companion/floor.js) thinks about a new card
        if (!flow.instant) document.dispatchEvent(new CustomEvent('byodc:card'));
      }
      return this._swap(where === 'actions' ? this._cards.actions : this._cards.slot, node);
    }
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
  /* In card mode a note is a correction or an aside, never the card itself — it used to
     _swap into the one card slot and destroy the instruction the player was still reading
     (every makePlacer onWrong does this). It now lands in the hint slot below the card,
     which the next card clears. Outside card mode it appends as it always did. */
  note(html){
    if (this._cards) return this.hint(html);
    return this.beat(el('p', { class: 'guide-note' }, html));
  },
  aha(html, sub){
    if (!flow.instant) SFX.success();
    return this.beat(el('div', { class: 'aha' }, html + (sub ? `<span class="sub">${sub}</span>` : '')));
  },
  /* The same dark block as an aha, for narration rather than a payoff: who you are, why
     you are here. Deliberately not `aha`, which plays the success chime and would ring
     before the player has done anything. Same class, so the two boxes look identical. */
  story(html, sub){
    return this.beat(el('div', { class: 'aha' }, html + (sub ? `<span class="sub">${sub}</span>` : '')));
  },
  /* An "In the Lab" card (2026-10-19): the parts and circuits a student meets in a lab and
     in real life, after the theory and before the real-numbers box. The same one-card text,
     on the lab paper with its own eyebrow. `intro` adds the one-line framing, used on the
     first lab card of a step. */
  lab(html, { intro = false } = {}){
    return this.beat(el('div', { class: 'lab-card' },
      `<div class="lab-eyebrow">IN THE LAB</div>`
      + (intro ? `<p class="lab-sub">What you will meet in a lab, and in the things around you.</p>` : '')
      + `<p class="guide-p">${html}</p>`));
  },
  /* The real-numbers box at the end of a step (REVIEW_NOTES N-005, NUMBERS_BOXES.md): the
     same dark block, with the arithmetic folded away behind a toggle so the box reads as
     text first. Opening the toggle is not an answer: nothing here goes through flow.ask. */
  /* spec.text is a list of blocks, each its own line (N-007): a string is a paragraph, and
     { ladder: [...] } is a scale ladder, one rung per line. */
  numbers(spec){
    const blocks = (Array.isArray(spec.text) ? spec.text : [spec.text]).map(b =>
      typeof b === 'string' ? `<p>${b}</p>`
        : `<ul class="ladder">${b.ladder.map(r => `<li>${r}</li>`).join('')}</ul>`).join('');
    const working = (spec.working || []).map(w => `<li>${w}</li>`).join('');
    return this.beat(el('div', { class: 'aha numbers' },
      `<div class="numbers-eyebrow">THE REAL NUMBERS</div>${blocks}`
      + (working ? `<details class="working"><summary><span class="i" aria-hidden="true">i</span>
          Click to see the arithmetic, with formulae</summary><ol>${working}</ol></details>` : '')));
  },
  async button(label, variant = 'primary', { cta = false } = {}){
    const b = el('button', { class: 'btn ' + variant, 'data-label': slug(label) }, label);
    const row = this.beat(el('div', { class: 'btn-row' }), 'actions');
    row.appendChild(b);
    await flow.ask(replay => {
      if (replay !== undefined){ b.disabled = true; b.classList.add(cta ? 'cta-done' : 'used'); return true; }
      return new Promise(res => b.addEventListener('click', () => {
        b.disabled = true;
        /* Ripu (2026-10-25): the step's own button stays pressed and turns into a check;
           flow.js then plays the step-finish moment */
        if (cta){ b.classList.add('cta-done'); b.innerHTML = `✓ ${label.replace(/\s*▸\s*$/, '')}`; }
        else { SFX.click(); b.classList.add('used'); }
        res(true);
      }));
    });
  },
  next(label = 'Next ▸'){ return this.button(label, 'primary'); },
  choose(options){
    const row = this.beat(el('div', { class: 'choice-wrap' }), 'actions');
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
            guide.hint(`Fill every row first — tap a cell to cycle it.`);
            return;
          }
          const wrong = cells.filter((c, i) => c.state !== spec.expected[i]);
          if (!wrong.length){
            applyCorrect();
            if (!flow.instant) SFX.success();
            res(true);
          } else {
            wrong.forEach(c => { c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); c.classList.add('bad'); setTimeout(() => c.classList.remove('bad'), 900); });
            if (spec.hint) guide.hint(spec.hint);
          }
        });
      });
    });
  },
};
