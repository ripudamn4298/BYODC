// BYODC — how far into each act the learner has got, card by card (Ripu, 2026-10-28).
//
// Every act is open from its first card. Inside an act, each card unlocks the next: a card
// is open when the learner has reached it. reach[act] = { s, k, done } is the furthest card
// reached, step s and card k inside it (k counts from 0). The index uses this to lock and
// fade the cards ahead, and the progress bar on the floor uses it to fill each act.
//
// Kept in this browser, and for a signed-in builder in their account too (account.js merges
// the two, always keeping the further position).
//
// The cards of each step are known from js/dev/trail-seed.json, the recorded path through
// every step that the index replays to land on a card.

const KEY = 'byodc.reach.v1';

let reach = {};
let seed = {};
let acts = {};            // { 1: { steps }, … } from main.js
const listeners = new Set();

const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const store = () => { try { localStorage.setItem(KEY, JSON.stringify(reach)); } catch { /* storage off */ } };
const ahead = (a, b) => !b || a.s > b.s || (a.s === b.s && a.k > b.k);   // is position a past b?

export const reachStore = {
  async init(actsMap){
    acts = actsMap;
    reach = load();
    try {
      const r = await fetch(new URL('./dev/trail-seed.json', import.meta.url));
      if (r.ok) seed = await r.json();
    } catch { /* no seed: steps count as one card each */ }
  },

  get all(){ return reach; },
  get(act){ return reach[act] || { s: 0, k: 0, done: false }; },
  onChange(fn){ listeners.add(fn); },
  _changed(){ store(); listeners.forEach(fn => fn(reach)); },

  /* the recorded path through one step: answers to replay, and a label for each card */
  trail(act, s){
    const step = acts[act]?.steps[s];
    return (step && seed[`${act}:${step.id}`]) || { a: [], l: [] };
  },
  cardsIn(act, s){ return Math.max(1, this.trail(act, s).l.length); },
  cardsInAct(act){ return (acts[act]?.steps || []).reduce((n, _, s) => n + this.cardsIn(act, s), 0); },

  isOpen(act, s, k = 0){
    if (s === 0 && k === 0) return true;
    const r = this.get(act);
    return r.done || !ahead({ s, k }, r);
  },

  /* the learner is now looking at card k of step s */
  reached(act, s, k){
    const r = reach[act];
    if (!ahead({ s, k }, r)) return;
    reach[act] = { s, k, done: !!r?.done };
    this._changed();
  },
  finished(act){
    const n = acts[act]?.steps.length || 0;
    reach[act] = { s: n, k: 0, done: true };
    this._changed();
  },
  merge(other){
    let moved = false;
    for (const [act, r] of Object.entries(other || {})){
      const o = reach[act];
      if (ahead(r, o)){ reach[act] = { ...r, done: r.done || !!o?.done }; moved = true; }
      else if (r.done && !o.done){ o.done = true; moved = true; }
    }
    if (moved) this._changed();
  },

  /* 0..1, how much of the act has been reached */
  fraction(act){
    const r = this.get(act);
    if (r.done) return 1;
    const total = this.cardsInAct(act);
    let n = 0;
    for (let s = 0; s < r.s; s++) n += this.cardsIn(act, s);
    return total ? Math.min(1, (n + r.k) / total) : 0;
  },
};
