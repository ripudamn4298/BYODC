# Verifying a BYODC step in the preview

The preview tab reports `visibilityState: "hidden"`, which suspends `requestAnimationFrame`.
`Anim.tween` and the guide's `.in` reveal both ride rAF, so without the shim below a step
stalls at its first transition and every card renders at zero opacity. That is a preview
artifact, not a bug: do not "fix" it in the source.

## 1. Serve a copy

macOS TCC blocks serving `~/Documents`, so rsync the repo into the session scratchpad and
serve that. Re-run the rsync after every edit.

```
rsync -a /Users/ripu/Documents/BYODC/js/  <SCRATCH>/byodc/js/
rsync -a /Users/ripu/Documents/BYODC/css/ <SCRATCH>/byodc/css/
```

Add an entry to `youtube_assets_design/.claude/launch.json` pointing at `<SCRATCH>/byodc`
on a free port, then `preview_start` it by name. There is a cap of five preview servers; if
`preview_start` refuses because siblings hold them all, run the launch entry's command
yourself with Bash and attach the browser pane to the URL instead.

## 2. Open the game and install the shim

Drive the shim from a **Web Worker**, not `setTimeout`. After a tab has been hidden for a
few minutes Chrome's intensive wake-up throttling clamps main-thread timers to roughly one
per minute, so a `setTimeout` shim dies partway through a session: cards stick at opacity 0
and every probe times out, which looks exactly like a broken step. Worker timers are not
throttled that way.

```js
(async () => {
  if (!window.__rafShim){
    window.__rafShim = true;
    const q = new Map(); let id = 1;
    const w = new Worker(URL.createObjectURL(
      new Blob(['setInterval(()=>postMessage(0),12)'], { type: 'text/javascript' })));
    w.onmessage = () => {
      const now = performance.now();
      const due = [...q.values()]; q.clear();
      due.forEach(cb => { try { cb(now); } catch (e) { console.error(e); } });
      // gsap grabbed the real rAF at import time, before this shim existed, so anything
      // it drives (makeMuxRig.select, makeSystolic, the Act 3 and Act 5 loops) stays
      // frozen and the step never advances past it. Tick it from the same pulse.
      if (window.gsap) window.gsap.ticker.tick();
    };
    window.requestAnimationFrame = cb => { const i = id++; q.set(i, cb); return i; };
    window.cancelAnimationFrame = i => q.delete(i);
    if (window.gsap) window.gsap.ticker.lagSmoothing(0);
  }
  // (The old `.focus-scrim{animation:none}` line is gone: since the engine pass, focus
  // dims siblings by inline opacity and paints no scrim at all. Note that a hidden tab
  // does not advance the .dimmed opacity TRANSITION either, so read `node.style.opacity`
  // rather than getComputedStyle when you check that dimming happened.)
  document.querySelector('#landing').style.display = 'none';
  document.querySelector('#game').classList.add('active');
  window.scrollTo(0,0);
  window.__byodcStartAct(4);
  await new Promise(r=>setTimeout(r,600));
  return 'ready';
})()
```

## 3. Jump to any card with the replay queue

`flow.start(stepIndex, queue)` replays `queue.length` answers instantly, then runs live.
Build the queue from your step's answer sequence in order (`true` for every
`next`/`button`, the chosen `value` string for every `choose`).

```js
window.Q = [true, true, 'right', true, /* … your step's answers, in order … */];
window.goto = async (n, wait=2800) => {
  window.__byodcFlow.start(0, window.Q.slice(0,n));      // 0 = step index within the act
  await new Promise(r=>setTimeout(r,wait));
  return {
    card:  document.querySelector('.card-slot .guide-p:not(.out), .card-slot .guide-note:not(.out), .card-slot .aha:not(.out)')?.textContent.trim().replace(/\s+/g,' ').slice(0,110),
    label: document.querySelector('.focus-label')?.textContent || null,
    answers: window.__byodcFlow.answers.length,
    ctrls: [...document.querySelectorAll('.stage-controls button')].map(b=>b.textContent.trim()+(b.disabled?'(off)':'')),
  };
};
```

Wait long enough for the transitions between cards to finish, or you will read a
mid-animation state and think something is broken.

## 4. What to actually check

1. **Every card in order.** Walk `goto(0)`, `goto(1)`, … and confirm each card's text and
   its `focus-label` match what you intended. A card with a `null` label is only correct if
   you deliberately used `ring: true` with no label.
2. **The interactions, live.** Click the real buttons and read the DOM back. Verify the
   arithmetic on screen against the printed answers, digit by digit.
3. **Back.** From a late card, click `[data-label="back"]` three times and confirm you land
   on the three preceding cards with their labels restored.
4. **Replay.** Run the step with a full queue and confirm the end state is identical to the
   live run. Any difference means a `settle`/replay path is wrong and Back is broken.
5. **A clean live run,** start to finish, with no console errors.
6. **The other acts.** `__byodcStartAct(1|2|3|5)` must still render.

## 3a. Do not fire two `flow.start()` calls back to back

Restarting a run while a previous one is still unwinding leaves the old runner alive long
enough to drain the new replay queue, and the step then sits on the wrong card. The epoch
guard stops the zombie writing to the stage but not before it has eaten the queue. Only
reachable from the console, since Back and Restart are one click at a time. Let one call
settle before making the next.

## 3b. `flow.start` consumes the array you hand it

`flow.start(i, queue)` shifts entries off `queue` as it replays them, so the array you
passed comes back empty. Pass a copy (`Q.slice(0, n)`) or your second call replays nothing
and you will think the step is broken.

## 4a. Measuring geometry mid-transition

In the backgrounded tab a CSS transition does not advance until something forces a paint,
so a `getBoundingClientRect` taken while one is running reads the *start* position. Focus
rings measured during a tile slide therefore box the tiles' old spots, and the ring lands
in a different place live than on replay.

This one is worth fixing in the source rather than working around: wait out the transition
and clear it before you measure anything. The bug it hides is real even in a live tab,
where the ring would simply be measured a few frames too early.

## 4a-2. Never focus a node that is moving or mid-keyframe

`stage.focus` measures its target once and draws the ring and label where it was at that
instant. Two ways that bites, both found building Act 1 step 1:

- **A CSS keyframe that scales**, such as `.pop-in`, has no `transform-box`, so it scales
  about the SVG origin rather than the element. A box measured while it runs lands hundreds
  of user units away, which put a label in the corner of the stage. Strip the class, or
  fade the node in with `Anim.tween` instead, before focusing it.
- **A node driven by the shared ticker** (a drifting carrier, a hopping vacancy) walks out
  from under its own label within a second. Hold it still for the card and restore it
  afterwards: remove its ticker with `Anim.remove(...)`, or take it out of the loop's list
  and put it back when the card is done.

## 4b. Two engine constraints you will hit

**FIXED in the engine pass (2026-08-10). Kept here as history, because three acts were
written around these and their workarounds are still in the step files.**

~~**`stage.focus` re-parents the nodes it raises.**~~ It no longer does. Focus now walks
from each target up to the SVG root and dims only the siblings along that path, so nothing
moves in the DOM. All three symptoms are gone:

- ~~A click listener on an ancestor group stops receiving events from a focused child.~~
  Ancestor listeners keep firing; you no longer need to run interaction cards unfocused.
- ~~A node raised out of a **transformed** parent loses that transform.~~ Transforms are
  untouched, so focusing a child inside a transformed group is safe.
- ~~`clearFocus` throws `NotFoundError` if the focus list was not in document order.~~
  There is nothing to restore, so order does not matter.

The workarounds in existing steps (focusing a parent and labelling the child, sorting by
`compareDocumentPosition`, running interaction cards with no focus) are all still correct
and were left in place; they are simply no longer required for new work.

Two more label traps, neither in `focus` itself:

- **`at:'right'` clips a long label off the stage** when the target's bbox already reaches
  the right edge. `focus` clamps the label's anchor point into the 720-unit box but cannot
  know how wide the text will be. Put long labels on `top` or `bottom`, and look at the
  render rather than trusting the call.
- **A `fill` presentation attribute loses to a class's CSS `fill`.** Recolouring a
  classed node needs `style.fill`, not `setAttribute('fill', …)`.
- **`text-anchor` had the same problem and is now FIXED**: `.lbl`, `.lbl-faint`,
  `.lbl-strong` and `.tile-cap` scope their default to `:not([text-anchor])`, so an
  explicit `text-anchor="start|end"` attribute wins again. `style.textAnchor` still works
  and is what the engine itself uses.

~~**`flow.hintAfter` replaces the current card.**~~ **FIXED in the engine pass.** Hints
render into `guide.hint()`, a slot of their own below the card, and the next card clears
it. `guide.truthTable`'s built-in messages route there too. Cancelling on the player's
first interaction is still good manners (`hintAfter` returns a cancel function, which now
also clears the slot).

## 5. Busting the module cache

A lingering server can serve stale modules. After an edit:

```js
(async () => {
  for (const m of ['js/acts/act4/step2.js','css/game.css']) await fetch(m, {cache:'reload'});
  location.reload();
})()
```

Then re-install the shim (step 2), since the reload clears it.
