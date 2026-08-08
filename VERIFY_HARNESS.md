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
on a free port, then `preview_start` it by name.

## 2. Open the game and install the shim

```js
(async () => {
  if (!window.__rafShim){
    window.__rafShim = true;
    let id = 1; const map = new Map();
    window.requestAnimationFrame = cb => { const i = id++; map.set(i, setTimeout(()=>cb(performance.now()), 16)); return i; };
    window.cancelAnimationFrame = i => { clearTimeout(map.get(i)); map.delete(i); };
    // gsap grabs the real rAF at import time, before this shim exists, so anything it
    // drives (makeMuxRig.select, makeSystolic, the Act 3 and Act 5 loops) stays frozen
    // and the step never advances past it. Drive gsap's ticker by hand as well.
    if (window.gsap){
      window.gsap.ticker.lagSmoothing(0);
      setInterval(() => window.gsap.ticker.tick(), 16);
    }
  }
  const s = document.createElement('style');
  s.textContent = '.focus-scrim{animation:none !important}';   // paused first keyframe in a hidden tab
  document.head.appendChild(s);
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

## 4a. Measuring geometry mid-transition

In the backgrounded tab a CSS transition does not advance until something forces a paint,
so a `getBoundingClientRect` taken while one is running reads the *start* position. Focus
rings measured during a tile slide therefore box the tiles' old spots, and the ring lands
in a different place live than on replay.

This one is worth fixing in the source rather than working around: wait out the transition
and clear it before you measure anything. The bug it hides is real even in a live tab,
where the ring would simply be measured a few frames too early.

## 4b. Two engine constraints you will hit

Both were found building step 3. Neither is fixed yet; work around them for now and the
engine pass will address them once every step has landed.

**`stage.focus` re-parents the nodes it raises.** They move onto the SVG root, so a click
listener sitting on an ancestor group no longer receives events from a focused child. If a
card needs the player to click something, either put the listener on the element itself or
run that card with no focus at all.

**`flow.hintAfter` replaces the current card.** It calls `guide.note`, which in card mode
writes into the one card slot, so a pending hint can wipe interaction feedback mid-task.
Cancel the hint on the player's first interaction (`hintAfter` returns a cancel function).

## 5. Busting the module cache

A lingering server can serve stale modules. After an edit:

```js
(async () => {
  for (const m of ['js/acts/act4/step2.js','css/game.css']) await fetch(m, {cache:'reload'});
  location.reload();
})()
```

Then re-install the shim (step 2), since the reload clears it.
