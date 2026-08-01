// BYODC engine — remembers where the player got to, so the course can be
// picked up later instead of restarted. Stored in localStorage on the player's
// own machine: nothing is sent anywhere, and clearing site data forgets it.
//
// Shape: { act: 1..5, step: 0..steps.length, at: <ms> }
// `step` is the NEXT step to run — so { act:3, step:2 } means "act 3, about to
// do step 3 of 4". Resuming replays nothing: steps are self-contained, and the
// HUD's running cost is derived from baseCost + the costDeltas already passed.

const KEY = 'byodc.progress.v1';
const ACT_MIN = 1, ACT_MAX = 5;

export const progress = {
  /* Save quietly. Private browsing and full-storage both throw — in that case
     the course still plays, it just won't be remembered. Never break the game
     over a failed write. */
  save(act, step){
    try {
      localStorage.setItem(KEY, JSON.stringify({ act, step, at: Date.now() }));
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
      return { act: p.act, step: p.step, at: p.at || 0 };
    } catch { return null; }
  },

  clear(){
    try { localStorage.removeItem(KEY); } catch { /* nothing to do */ }
  },
};
