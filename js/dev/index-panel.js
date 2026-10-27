// BYODC dev — the review index. LOCALHOST ONLY: main.js imports this module only when
// the page is served from localhost, so the live site never loads it.
//
// A drawer on the left lists every act, every step, and every card inside a step.
// Click one to land there. Acts and steps always work. Cards work by riding the
// engine's own record-and-replay (flow.js): every card boundary is a flow.ask(), so
// "card k of a step" is just "replay the first k answers". This module records the
// answers as the step is played, with the text of the card each answer belonged to,
// and keeps them in this browser's localStorage. trail-seed.json, next to this file,
// pre-fills every step so the index is complete before anyone has played anything.
//
// Toggle with the INDEX tab, or the ` key. Esc closes.
//
// The ✎ NOTE tab (or the n key) opens a box for a review note on whatever is on screen.
// It is posted to tools/dev-server.mjs, which appends it to REVIEW_NOTES.md with the
// act, step, card number and card text, so the note can be mapped back to the exact
// card. Notes that cannot be posted wait in localStorage and go with the next save.
import { flow } from '../engine/flow.js';
import { guide } from '../engine/guide.js';

const KEY = 'byodc.dev.trail.v1';
const UI_KEY = 'byodc.dev.index-ui.v1';

const ACT_NAMES = {
  1: 'Build Your Own Transistor',
  2: 'Build Your Own Processor',
  3: 'Build Your Own Chip',
  4: 'Build Your Own GPU',
  5: 'Build Your Own Data Centre',
};

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clean = s => (s || '').replace(/\s+/g, ' ').trim();
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tagOf = html => clean(html.replace(/<[^>]+>/g, ''));

function load(k, fallback){
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; }
}
function store(k, v){
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage off: index still works this session */ }
}

/* ---------- the trail store ----------
   trails["2:latch"] = { a: [answers…], l: [{ t: card text, k: kind }…] }
   a[i] is the answer that closed card i; l[i] describes card i. kind is
   '' (a Next-style button), 'pick' (a multiple choice), 'do' (an interaction on the
   stage) or 'wrap' (the venture card and the button into the next step). */
let trails = {};
let seed = {};

/* A local trail wins, except where the seed simply knows more of the same path, or where
   the seed for that step has changed since this browser last saw it: then the step was
   edited (a split card shifts every answer after it), and the old recording would land
   on the wrong cards. */
const SIG_KEY = 'byodc.dev.trail.seedsig.v1';
function mergeSeed(){
  const sigs = load(SIG_KEY, {});
  for (const [k, s] of Object.entries(seed)){
    const sig = JSON.stringify(s.a);
    if (sigs[k] !== sig){ trails[k] = structuredClone(s); sigs[k] = sig; continue; }
    const t = trails[k];
    if (!t || !t.a.length){ trails[k] = structuredClone(s); continue; }
    const prefix = t.a.length < s.a.length && t.a.every((v, i) => same(v, s.a[i]));
    if (prefix){
      t.a = s.a.slice();
      t.l = t.l.concat(s.l.slice(t.l.length));
    }
  }
  store(SIG_KEY, sigs);
}

const trailKey = (act, stepId) => `${act}:${stepId}`;
const trailOf = (act, stepId) => trails[trailKey(act, stepId)] || { a: [], l: [] };
const isDone = t => t.l.length > 0 && t.l[t.l.length - 1].k === 'wrap';

/* ---------- recording ---------- */
let inWrap = false;    // true between the end of step.run() and the next step's clear()
let lastEnd = null;    // the card text on screen when the previous answer landed

function describeCard(){
  if (inWrap){
    const rows = document.querySelectorAll('#guide-scroll > .btn-row');
    const cta = rows[rows.length - 1]?.querySelector('.btn');
    return { t: `End of step${cta ? ' → ' + clean(cta.textContent) : ''}`, k: 'wrap' };
  }
  const slot = document.querySelector('#guide-scroll .card-slot');
  let text = '';
  if (slot){
    const live = [...slot.children].filter(n => !n.classList.contains('out'));
    const last = live[live.length - 1];
    // a truth table takes the card's place; name it by the instruction it replaced
    text = last?.classList.contains('tt') ? `Truth table · ${lastEnd || ''}` : clean(last?.textContent);
  }
  if (!text){   // not in card mode: fall back to the last paragraph in the panel
    const ps = document.querySelectorAll('#guide-scroll .guide-p, #guide-scroll .aha');
    text = clean(ps[ps.length - 1]?.textContent);
  }
  const actions = document.querySelector('#guide-scroll .card-actions');
  const k = actions?.querySelector('.choice-wrap') ? 'pick'
          : actions?.querySelector('.btn') ? '' : 'do';
  return { t: text.slice(0, 160) || '(card)', k };
}

let api = null;

function record(entryText){
  const steps = flow.steps;
  const step = steps[flow.stepIndex];
  if (!step || !api) return;
  const i = flow.answers.length - 1;
  if (i < 0) return;
  const key = trailKey(api.currentAct(), step.id);
  const t = trails[key] || (trails[key] = { a: [], l: [] });
  const v = flow.answers[i];
  const card = describeCard();
  // Label a card by what is on screen when it starts waiting, which is where a jump
  // lands: an interaction card often rewrites itself once it is solved. askCard draws
  // its card inside the ask, so when nothing new was on screen at entry, the text at
  // the end is the right one.
  const end = card.t;
  if (entryText && !(i > 0 && entryText === lastEnd) && card.k !== 'wrap') card.t = entryText;
  lastEnd = end;
  // Same text as the card before: the new beat went to the hint slot (a guide.note in
  // card mode), or the step is waiting on something with no card of its own.
  if (i > 0 && card.t === t.l[i - 1]?.t){
    const hint = document.querySelector('#guide-scroll .card-hint:not([hidden])');
    const ht = clean(hint?.textContent);
    card.t = ht ? ht.slice(0, 160) : '↳ ' + card.t;
  }
  if (i < t.a.length && !same(v, t.a[i])){
    // a different answer here: the recorded path past this card is no longer valid
    t.a.length = i; t.l.length = i;
  }
  t.a[i] = v;
  t.l[i] = card;
  store(KEY, trails);
  dirty();
}

function hookEngine(){
  const ask = flow.ask;
  flow.ask = function(fn){
    const ep = this._epoch;
    const entry = inWrap ? null : describeCard().t;
    return ask.call(this, fn).then(v => { if (ep === this._epoch) record(entry); return v; });
  };
  const start = flow.start;
  flow.start = function(...args){ inWrap = false; const r = start.apply(this, args); dirty(); return r; };
  const clear = guide.clear;
  guide.clear = function(...args){ inWrap = false; return clear.apply(this, args); };
  const endCards = guide.endCards;
  guide.endCards = function(...args){ inWrap = true; return endCards.apply(this, args); };
}

/* ---------- jumping ---------- */
function jumpTo(act, s, k = 0){
  if (flow.instant){ toast('Still replaying, click again in a moment'); return; }
  const steps = api.acts[act].steps;
  const t = trailOf(act, steps[s].id);
  const queue = t.a.slice(0, k);
  // Back from the first card should land on the previous step's last card, which
  // needs that step's answers; only a complete recording is safe to hand over.
  const saved = steps.slice(0, s).map(st => { const p = trailOf(act, st.id); return isDone(p) ? p.a.slice() : []; });
  ui.open = ui.pinned;
  saveUI(); applyOpen();
  api.jump(act, s, { queue, saved });
}

/* ---------- UI ---------- */
let ui = load(UI_KEY, { open: false, pinned: false, acts: {}, steps: {} });
const saveUI = () => store(UI_KEY, ui);

let root, list, tab;

const CSS = `
#dev-tabs{position:fixed;left:0;top:50%;transform:translateY(-50%);z-index:300;display:flex;flex-direction:column;gap:8px}
#dev-tabs[hidden]{display:none}
#dev-index-tab{writing-mode:vertical-rl;rotate:180deg;padding:14px 7px;border:1px solid var(--ink);border-left:0;
  background:var(--ink);color:var(--paper-high);font:500 10.5px/1 var(--font-mono);letter-spacing:.2em;
  cursor:pointer;border-radius:0 2px 2px 0}
#dev-index-tab:hover,#dev-note-tab:hover{background:var(--dark-soft)}
#dev-note-tab{writing-mode:vertical-rl;rotate:180deg;
  padding:12px 7px;border:1px solid var(--ink);border-left:0;background:var(--red);color:var(--paper-high);
  font:500 10.5px/1 var(--font-mono);letter-spacing:.2em;cursor:pointer;border-radius:0 2px 2px 0}
#dev-note{position:fixed;left:16px;bottom:16px;z-index:303;width:min(440px,calc(100vw - 32px));display:none;
  background:var(--paper-high);color:var(--ink);border:1px solid var(--ink);border-radius:2px;
  box-shadow:0 12px 40px rgba(29,33,23,.25);padding:14px 16px 14px}
#dev-note.open{display:block}
#dev-note .dn-h{font:500 10.5px/1.4 var(--font-mono);letter-spacing:.14em;color:var(--red);margin-bottom:6px}
#dev-note .dn-ctx{font:13px/1.35 var(--font-body);font-style:italic;color:var(--ink-soft);margin-bottom:10px;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
#dev-note textarea{width:100%;box-sizing:border-box;min-height:120px;resize:vertical;padding:10px;
  font:15px/1.4 var(--font-body);color:var(--ink);background:var(--paper);border:1px solid var(--hairline-strong);border-radius:2px}
#dev-note textarea:focus{outline:2px solid var(--ink);outline-offset:-1px}
#dev-note .dn-row{display:flex;align-items:center;gap:8px;margin-top:10px}
#dev-note .dn-row .grow{flex:1;font:10px/1.3 var(--font-mono);color:var(--ink-faint)}
#dev-note button{font:500 10.5px/1 var(--font-mono);letter-spacing:.12em;padding:9px 12px;border-radius:2px;cursor:pointer;
  border:1px solid var(--ink);background:none;color:var(--ink)}
#dev-note button.save{background:var(--ink);color:var(--paper-high)}
#dev-index .di-card .nt{font:10px/1.6 var(--font-mono);color:var(--red);flex:none}
#dev-index .di-step-h .nt{font:10px/1 var(--font-mono);color:var(--red)}
#dev-index .rv{font:600 9.5px/1 var(--font-mono);color:var(--green);background:rgba(92,107,69,.14);
  border-radius:8px;padding:3px 6px;flex:none;white-space:nowrap}
#dev-index .di-card .rv{align-self:flex-start;margin-top:2px}
#dev-index .di-act-h .rv{margin-left:auto}
#dev-index{position:fixed;left:0;top:0;bottom:0;width:min(420px,92vw);z-index:301;display:flex;flex-direction:column;
  background:var(--paper-high);color:var(--ink);border-right:1px solid var(--ink);
  box-shadow:8px 0 30px rgba(29,33,23,.18);transform:translateX(-102%);transition:transform .22s var(--ease)}
#dev-index.open{transform:none}
#dev-index .di-head{display:flex;align-items:center;gap:10px;padding:14px 16px 12px;border-bottom:1px solid var(--hairline-strong)}
#dev-index .di-head b{font:500 11px/1 var(--font-mono);letter-spacing:.18em}
#dev-index .di-head span{font:11px/1 var(--font-mono);color:var(--ink-faint);letter-spacing:.06em}
#dev-index .di-head .grow{flex:1}
#dev-index button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;text-align:left}
#dev-index .di-x,#dev-index .di-pin{font:11px/1 var(--font-mono);padding:6px 8px;border:1px solid var(--hairline-strong);border-radius:2px}
#dev-index .di-pin.on{background:var(--ink);color:var(--paper-high)}
#dev-index .di-list{flex:1;overflow:auto;padding:6px 0 20px}
#dev-index .di-act{border-bottom:1px solid var(--hairline-soft)}
#dev-index .di-act-h{display:flex;width:100%;gap:10px;align-items:center;padding:12px 16px}
#dev-index .di-act-h:hover{background:var(--hairline-soft)}
#dev-index .di-act-h .n{font:500 10.5px/1 var(--font-mono);letter-spacing:.16em;color:var(--amber);white-space:nowrap}
#dev-index .di-act-h .t{font:19px/1.15 var(--font-display);flex:1}
#dev-index .di-car{font:10px/1 var(--font-mono);color:var(--ink-faint);width:16px;flex:none;align-self:stretch;display:flex;align-items:center}
#dev-index .di-step-h{display:flex;align-items:center;gap:6px;padding:4px 16px 4px 22px}
#dev-index .di-step-h:hover{background:var(--hairline-soft)}
#dev-index .di-step-h .go{flex:1;font:15.5px/1.25 var(--font-body);padding:2px 0}
#dev-index .di-step-h .go .n{font:10.5px/1 var(--font-mono);color:var(--ink-soft);margin-right:7px;letter-spacing:.06em}
#dev-index .di-step-h .cnt{font:10px/1 var(--font-mono);color:var(--ink-faint);white-space:nowrap}
#dev-index .di-step-h.here .go{font-weight:600}
#dev-index .di-cards{list-style:none;margin:0 0 6px;padding:0 12px 0 46px}
#dev-index .di-card{display:flex;gap:8px;width:100%;padding:5px 6px;border-left:2px solid var(--hairline);font:13.5px/1.3 var(--font-body);color:var(--ink-soft)}
#dev-index .di-card:hover{background:var(--hairline-soft);color:var(--ink)}
#dev-index .di-card .n{font:10px/1.6 var(--font-mono);color:var(--ink-faint);flex:none;min-width:44px}
#dev-index .di-card .x{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;flex:1}
#dev-index .di-card .k{font:9.5px/1.7 var(--font-mono);letter-spacing:.08em;color:var(--blue);flex:none}
#dev-index .di-card.wrap .x{font-style:italic}
#dev-index .di-card.here{border-left-color:var(--red);background:var(--red-soft);color:var(--ink)}
#dev-index .di-empty{font:12.5px/1.4 var(--font-body);font-style:italic;color:var(--ink-faint);padding:2px 6px 8px}
#dev-index .di-foot{border-top:1px solid var(--hairline-strong);padding:10px 16px;font:10.5px/1.5 var(--font-mono);color:var(--ink-faint)}
#dev-index .di-foot button{text-decoration:underline;color:var(--ink-soft)}
#dev-index-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:302;background:var(--ink);
  color:var(--paper-high);font:11px/1 var(--font-mono);padding:10px 14px;border-radius:2px;opacity:0;transition:opacity .2s;pointer-events:none}
#dev-index-toast.on{opacity:1}
`;

function toast(msg){
  let t = document.getElementById('dev-index-toast');
  if (!t){ t = document.createElement('div'); t.id = 'dev-index-toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('on');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 1800);
}

function applyOpen(){
  root.classList.toggle('open', !!ui.open);
  tab.parentElement.hidden = !!ui.open;
  if (ui.open){ render(); scrollToHere(); refreshNotes(); }
}
function toggle(force){ ui.open = force ?? !ui.open; saveUI(); applyOpen(); }

let _dirty = false;
function dirty(){
  if (!root || !ui.open || _dirty) return;
  _dirty = true;
  setTimeout(() => { _dirty = false; if (ui.open) render(); }, 120);
}

function where(){
  if (!document.querySelector('#game.active') || !flow.steps.length) return null;
  return { act: api.currentAct(), step: flow.stepIndex, card: flow.answers.length };
}

function render(){
  const here = where();
  const scroll = list.scrollTop;
  list.innerHTML = '';
  for (const [nStr, act] of Object.entries(api.acts)){
    const n = +nStr;
    const hereAct = here && here.act === n;
    const openAct = ui.acts[n] ?? hereAct;
    const sec = document.createElement('section');
    sec.className = 'di-act';
    sec.innerHTML = `<button class="di-act-h"><span class="di-car">${openAct ? '▾' : '▸'}</span>
      <span class="n">ACT ${n}</span><span class="t">${esc(ACT_NAMES[n] || '')}</span>${reviewIn(`${n}.`) ? `<span class="rv" title="cards changed by done notes, to review">✓${reviewIn(`${n}.`)}</span>` : ''}</button>`;
    sec.firstElementChild.addEventListener('click', () => { ui.acts[n] = !openAct; saveUI(); render(); });
    list.appendChild(sec);
    if (!openAct) continue;

    act.steps.forEach((step, s) => {
      const t = trailOf(n, step.id);
      const sk = trailKey(n, step.id);
      const hereStep = hereAct && here.step === s;
      const openStep = ui.steps[sk] ?? hereStep;
      const head = document.createElement('div');
      head.className = 'di-step-h' + (hereStep ? ' here' : '');
      head.innerHTML = `<button class="di-car" title="show cards">${openStep ? '▾' : '▸'}</button>
        <button class="go" title="jump to the start of this step"><span class="n">${n}.${s + 1}</span>${esc(tagOf(step.title))}</button>
        <span class="cnt">${reviewIn(`${n}.${s + 1}.`) ? `<span class="rv" title="cards changed by done notes, to review">✓${reviewIn(`${n}.${s + 1}.`)}</span> ` : ''}${openNotesIn(`${n}.${s + 1}.`) ? `<span class="nt">✎${openNotesIn(`${n}.${s + 1}.`)}</span> ` : ''}${t.l.length ? t.l.length + (isDone(t) ? '' : '+') : '–'}</span>`;
      head.querySelector('.di-car').addEventListener('click', () => { ui.steps[sk] = !openStep; saveUI(); render(); });
      head.querySelector('.go').addEventListener('click', () => jumpTo(n, s, 0));
      sec.appendChild(head);
      if (!openStep) return;

      const ul = document.createElement('ul');
      ul.className = 'di-cards';
      if (!t.l.length){
        ul.innerHTML = `<li class="di-empty">No cards recorded yet. Play this step once and each card shows up here.</li>`;
      }
      t.l.forEach((c, k) => {
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.className = 'di-card' + (c.k === 'wrap' ? ' wrap' : '') + (hereStep && here.card === k ? ' here' : '');
        b.title = c.t;
        const nn = openNotesAt(`${n}.${s + 1}.${k + 1}`);
        const rv = reviewAt(`${n}.${s + 1}.${k + 1}`);
        b.innerHTML = `<span class="n">${n}.${s + 1}.${k + 1}</span><span class="x">${esc(c.t)}</span>`
          + (nn ? `<span class="nt" title="open review notes">✎${nn > 1 ? nn : ''}</span>` : '')
          + (rv.length ? `<span class="rv" title="changed by ${rv.join(', ')}: review">✓ ${rv.join(' ')}</span>` : '')
          + (c.k === 'pick' ? '<span class="k">PICK</span>' : c.k === 'do' ? '<span class="k">DO</span>' : '');
        b.addEventListener('click', () => jumpTo(n, s, k));
        li.appendChild(b); ul.appendChild(li);
      });
      if (t.l.length && !isDone(t)){
        ul.insertAdjacentHTML('beforeend', `<li class="di-empty">Recorded up to here. Play on and the rest is added.</li>`);
      }
      sec.appendChild(ul);
    });
  }
  list.scrollTop = scroll;
}

function scrollToHere(){
  const h = list.querySelector('.di-card.here') || list.querySelector('.di-step-h.here');
  if (h) h.scrollIntoView({ block: 'center' });
}

/* ---------- review notes ---------- */
const PENDING_KEY = 'byodc.dev.notes.pending.v1';
let notesIndex = [];          // [{ id, status, jump }] from REVIEW_NOTES.md
let noteBox, noteTab, noteWhere = null;

async function refreshNotes(){
  try {
    const r = await fetch('/__dev/notes', { cache: 'no-store' });
    if (r.ok){ notesIndex = await r.json(); dirty(); }
  } catch { /* server without the notes endpoint: no marks, saving still queues */ }
}
const openNotesAt = jump => notesIndex.filter(n => n.status === 'open' && n.jump === jump).length;
const openNotesIn = prefix => notesIndex.filter(n => n.status === 'open' && n.jump?.startsWith(prefix)).length;
/* done notes waiting for Ripu's look: every card a note changed (its "Changed at" line, or its
   own card if it has none) gets a green ✓, and the step heading counts them */
const reviewPoints = () => notesIndex.filter(n => n.status === 'done')
  .flatMap(n => (n.changed && n.changed.length ? n.changed : [n.jump]).map(j => ({ j, id: n.id })));
const reviewAt = jump => reviewPoints().filter(p => p.j === jump).map(p => p.id);
const reviewIn = prefix => new Set(reviewPoints().filter(p => p.j.startsWith(prefix)).map(p => p.j)).size;

/* Everything needed to map a note back to the exact point: taken when the box opens,
   so what was on screen is what gets saved, even if the step moves on underneath. */
function snapshot(){
  const at = new Date();
  const pad = v => String(v).padStart(2, '0');
  const base = { at: `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())} ${pad(at.getHours())}:${pad(at.getMinutes())}` };
  if (!document.querySelector('#game.active')) return { ...base, where: { title: 'Landing page' } };
  const act = api.currentAct();
  if (document.querySelector('#guide-scroll .summary')){
    const h = clean(document.querySelector('#guide-scroll .summary h2, #guide-scroll .summary h1')?.textContent);
    return { ...base, where: { title: `Act ${act} · end-of-act summary`, cardText: h } };
  }
  const s = flow.stepIndex, step = flow.steps[s];
  const k = flow.answers.length;
  const slot = document.querySelector('#guide-scroll .card-slot');
  const live = slot ? [...slot.children].filter(n => !n.classList.contains('out')) : [];
  let cardText = clean(live[live.length - 1]?.textContent);
  if (inWrap || !cardText){
    const ps = document.querySelectorAll('#guide-scroll > .guide-p');
    cardText = clean(ps[ps.length - 1]?.textContent);
  }
  const hint = clean(document.querySelector('#guide-scroll .card-hint:not([hidden])')?.textContent);
  const stage = [...new Set([...document.querySelectorAll('.focus-label, .stage-controls button')]
    .map(n => clean(n.textContent)).filter(Boolean))].slice(0, 8).join(' · ');
  return { ...base, where: {
    title: `Act ${act} · Step ${s + 1} · Card ${k + 1}${inWrap ? ' (end of step)' : ''}`,
    key: trailKey(act, step.id), stepTitle: tagOf(step.title),
    card: k + 1, cardText: cardText.slice(0, 400), hint: hint.slice(0, 300) || undefined,
    stage: stage || undefined, jump: `${act}.${s + 1}.${k + 1}`,
  } };
}

function openNote(){
  if (noteBox.classList.contains('open')){ noteBox.querySelector('textarea').focus(); return; }
  noteWhere = snapshot();
  const w = noteWhere.where;
  noteBox.querySelector('.dn-h').textContent = `NOTE · ${w.title.toUpperCase()}`;
  noteBox.querySelector('.dn-ctx').textContent = w.cardText ? `“${w.cardText}”` : (w.stepTitle || '');
  noteBox.classList.add('open');
  const ta = noteBox.querySelector('textarea');
  ta.value = load('byodc.dev.notes.draft', '') || '';
  ta.focus();
}
function closeNote(){ noteBox.classList.remove('open'); noteWhere = null; }

async function postNote(note){
  const r = await fetch('/__dev/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}
async function flushPending(){
  const q = load(PENDING_KEY, []);
  if (!q.length) return 0;
  const left = [];
  for (const n of q){ try { await postNote(n); } catch { left.push(n); } }
  store(PENDING_KEY, left);
  return q.length - left.length;
}

async function saveNote(){
  const ta = noteBox.querySelector('textarea');
  const text = ta.value.trim();
  if (!text || !noteWhere) return;
  const note = { ...noteWhere, text };
  closeNote();
  store('byodc.dev.notes.draft', '');
  try {
    const r = await postNote(note);
    const sent = await flushPending();
    const file = r.file.split('/').pop();
    toast(`Saved ${r.id} to ${file}${r.fallback ? ' (fallback copy: ' + r.file + ')' : ''}${sent ? ` + ${sent} queued` : ''}`);
    if (r.fallback) console.warn('[BYODC notes] could not write the repo file, wrote', r.file, r.reason);
    refreshNotes();
  } catch {
    const q = load(PENDING_KEY, []); q.push(note); store(PENDING_KEY, q);
    toast(`Server did not take it: kept in this browser (${q.length} waiting)`);
  }
}

function buildNotes(){
  noteTab = document.createElement('button');
  noteTab.id = 'dev-note-tab';
  noteTab.textContent = '✎ NOTE';
  noteTab.title = 'Leave a review note on this card — press n';
  noteTab.addEventListener('click', openNote);

  noteBox = document.createElement('div');
  noteBox.id = 'dev-note';
  noteBox.innerHTML = `<div class="dn-h"></div><div class="dn-ctx"></div>
    <textarea placeholder="What should change here?"></textarea>
    <div class="dn-row"><span class="grow">⌘↵ save · Esc close (draft is kept)</span>
      <button class="cancel">CLOSE</button><button class="save">SAVE NOTE</button></div>`;
  const ta = noteBox.querySelector('textarea');
  ta.addEventListener('input', () => store('byodc.dev.notes.draft', ta.value));
  ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)){ e.preventDefault(); saveNote(); }
    else if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); closeNote(); }
  });
  noteBox.querySelector('.save').addEventListener('click', saveNote);
  noteBox.querySelector('.cancel').addEventListener('click', closeNote);
  // keep the game from reacting to clicks and keys inside the box
  ['keydown', 'keyup', 'pointerdown', 'click'].forEach(t => noteBox.addEventListener(t, e => e.stopPropagation()));
  document.getElementById('dev-tabs').appendChild(noteTab);
  document.body.appendChild(noteBox);
}

function build(){
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  tab = document.createElement('button');
  tab.id = 'dev-index-tab';
  tab.textContent = 'INDEX';
  tab.title = 'Dev index (localhost only) — press `';
  tab.addEventListener('click', () => toggle(true));

  root = document.createElement('aside');
  root.id = 'dev-index';
  root.setAttribute('aria-label', 'Dev index');
  root.innerHTML = `
    <div class="di-head"><b>INDEX</b><span>localhost only · \` to toggle</span><span class="grow"></span>
      <button class="di-pin" title="keep the drawer open after a jump">PIN</button>
      <button class="di-x" title="close (Esc)">✕</button></div>
    <div class="di-list"></div>
    <div class="di-foot">Cards are recorded as you play, in this browser.
      DO = an interaction on the stage, PICK = a choice. A count with + is a partial recording.
      <br><button class="di-reset">Reset recordings to the seed</button></div>`;
  list = root.querySelector('.di-list');
  const pin = root.querySelector('.di-pin');
  pin.classList.toggle('on', !!ui.pinned);
  pin.addEventListener('click', () => { ui.pinned = !ui.pinned; pin.classList.toggle('on', ui.pinned); saveUI(); });
  root.querySelector('.di-x').addEventListener('click', () => toggle(false));
  root.querySelector('.di-reset').addEventListener('click', () => {
    trails = {}; mergeSeed(); store(KEY, trails); render(); toast('Recordings reset');
  });
  const tabs = document.createElement('div');
  tabs.id = 'dev-tabs';
  tabs.appendChild(tab);
  document.body.append(tabs, root);

  addEventListener('keydown', e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if (e.key === '`' && !typing){ e.preventDefault(); toggle(); }
    else if (e.key === 'n' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey){ e.preventDefault(); openNote(); }
    else if (e.key === 'Escape' && ui.open) toggle(false);
  });
}

/* Dumps every recorded trail as JSON — paste into trail-seed.json to refresh the seed. */
window.__byodcDevTrails = () => JSON.stringify(trails);

export async function initDevIndex(opts){
  api = opts;
  hookEngine();
  trails = load(KEY, {});
  try {
    const r = await fetch(new URL('./trail-seed.json', import.meta.url), { cache: 'no-store' });
    if (r.ok) seed = await r.json();
  } catch { /* no seed: the index fills in as you play */ }
  mergeSeed();
  store(KEY, trails);
  build();
  buildNotes();
  applyOpen();
  refreshNotes();
  flushPending();
}
