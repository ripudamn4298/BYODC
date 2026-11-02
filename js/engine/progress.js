// BYODC engine — remembers where the player got to, so the course can be
// picked up later instead of restarted. Stored in localStorage on the player's
// own machine: nothing is sent anywhere, and clearing site data forgets it.
//
// Shape: { act: 1..5, step: 0..steps.length, card: 0.., at: <ms> }
// `step` is the step in progress and `card` the card inside it (2026-11-03), so
// { act:3, step:2, card:5 } means "act 3, step 3, sixth card". Resuming replays the recorded
// path through that step up to the card (main.js replayTo); the HUD's running cost is derived
// from baseCost + the costDeltas already passed.

const KEY = 'byodc.progress.v1';
const ACT_MIN = 1, ACT_MAX = 5;

export const progress = {
  /* Save quietly. Private browsing and full-storage both throw — in that case
     the course still plays, it just won't be remembered. Never break the game
     over a failed write. */
  save(act, step, card = 0){
    try {
      localStorage.setItem(KEY, JSON.stringify({ act, step, card, at: Date.now() }));
    } catch { /* storage unavailable — carry on without persistence */ }
  },

  /* Returns null unless a well-formed, in-range record is present. Anything
     unparseable or from a future/older shape is treated as "no progress". */
  load(){
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (!Number.isInteger(p?.act) || !Number.isInteger(p?.step)) return null;
      if (p.act < ACT_MIN || p.act > ACT_MAX || p.step < 0) return null;
      // a record from before cards were saved has none: the first card of that step
      return { act: p.act, step: p.step, card: Number.isInteger(p.card) && p.card > 0 ? p.card : 0, at: p.at || 0 };
    } catch { return null; }
  },

  clear(){
    try { localStorage.removeItem(KEY); } catch { /* nothing to do */ }
  },
};
