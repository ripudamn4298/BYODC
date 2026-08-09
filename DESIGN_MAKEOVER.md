# DESIGN MAKEOVER — micro-learning

From Ripu's Act 4 playtest, 2026-08-08. Act 4 was the pilot and is built. Once approved,
the contract in §2 goes into DESIGN.md as §6d and binds all copy.

**§2 is the course-wide contract and §4 is the engine every act runs on. Both are shared.**
The rest of this file is Act 4's own plan, kept as the worked example. Each remaining act
has its own plan in the same shape:

| act | diagnosis | plan |
|---|---|---|
| 1 · The Physics of a Switch | `ACT1_WALKTHROUGH.md` | `ACT1_MAKEOVER.md` |
| 2 · Logic, Math & Memory | `ACT2_WALKTHROUGH.md` | `ACT2_MAKEOVER.md` |
| 3 · From Cell to Chip | `ACT3_WALKTHROUGH.md` | `ACT3_MAKEOVER.md` |
| 4 · The GPU | `ACT4_WALKTHROUGH.md` | this file (built) |
| 5 · The Data Centre | `ACT5_WALKTHROUGH.md` | `ACT5_MAKEOVER.md` |

Acts 1, 3 and 5 each gain a step, so stage numerals move course-wide. No act renumbers
itself; one pass runs last, per `RENUMBERING.md`.

## 1. What the playtest found

Ripu played Act 4 and got lost. Not because the ideas are hard. The parallel idea in
step 1 is obvious to anyone: eight adders working at once beat one adder working alone.
He got lost anyway, and every reason was packaging:

1. **Long paragraphs beside the diagram.** The player reads a wall of text, then has to
   hunt the diagram for whatever the text meant. Reading and looking are never in sync.
2. **New words with no label.** "Lane" appears in text while the diagram shows unlabeled
   squares. Step 3 shows a stack of R0, R1, R2 with no explanation of what a register is.
   The text talks about "edge" and "traffic" and never points at either.
3. **The diagram and the text don't reference each other.** Nothing highlights, nothing
   points. The player reads about a mux while looking at eight rows and has to guess
   which part is the mux.
4. **No bridge from the previous act.** Step 1 never says a lane IS the Act 2 datapath
   with the instruction-choosing removed. It's the player's own machine and they aren't
   told.
5. **Poetic names hide the content.** "The marching band." "The stationary trick."
   "Feed the beast." "Pulse the vector." A player scanning the act list learns nothing
   from these.
6. **Too much per screen.** Step 2 teaches five mechanisms in one sitting. Step 3 is two
   full lessons. The player is expected to hold too much at once.
7. **Ambiguity in the numbers.** "9 ANDs" read as 9 gates when it meant 9 AND operations.
8. **The business cards are theatrical.** Fridge memos, lawyers, tattoos. Cute, but the
   player is here to learn.
9. **Step 4's balance beam is a metaphor, not hardware.** The player is balancing pans
   when the real thing is memory stacks feeding a grid of adders.

Root cause, in one line: **the course shows too much and says too much at once, and the
text and the picture don't point at each other.**

## 2. The micro-learning contract

These rules replace the current guide-panel behavior. They apply to every step after the
makeover.

### Rule 1 — one card at a time

The side panel holds ONE short block of text. Next replaces it with the following block,
in the same place. Back brings the previous one back. No transcript pile-up, no
scrolling column of prose.

- Budget: about 30 words per card. Two short sentences. One idea.
- If a card needs a third sentence, it is two cards.

### Rule 2 — every card points at something

When a card talks about a thing, that thing is highlighted on the stage and labeled at
that moment. Everything else dims. The player never has to search the diagram for what
the text means.

- Highlight: the element(s) the card is about at full opacity, the rest at ~25%.
- Label: a mono microlabel with a thin arrow or leader line, appearing with the card.
- One highlight target per card. If a card would need two, it is two cards.

### Rule 3 — define before use, one term per card

A new word gets its own card: the word, what it is in plain language, and its label
landing on the diagram at the same moment. Only then may later cards use the word.

Pattern for a cluster of new things (example: the register file):
- Card: highlight ONE shelf. "This is a register: a small shelf that stores one number
  next to the engine." Label: REGISTER R0.
- Next. Highlight the stack. "Eight registers together are a register file." Label:
  REGISTER FILE.
- Next. Highlight the picker. "The mux picks one register and ignores the rest." Label: MUX.
- Only now does the interaction start.

### Rule 4 — connect to what the player already built

Every step opens by showing where we are and what we're reusing. If the step builds on an
Act 2 machine, the first card shows that machine's drawing, then an arrow or morph into
this step's version. The player should think "that's mine" before anything new appears.

### Rule 5 — transitions are shown, not told

When the stage reorganizes, the player watches the old thing become the new thing.
Example: the eight adders from the race visibly shrink and pack into one square, that
square gets labeled, then it stamps out into the 4x4 grid. No jump cuts to a new diagram.

### Rule 6 — plain names, plain verbs

Step titles say what you build or learn. Button labels say what the button does. The
real industry term is still taught, but as a label on the thing, or as the reveal at the
end, per DESIGN.md §6b. It is never the hook.

### Rule 7 — preface every step

First card of every step: what you will build here, in one sentence. If the step has a
test or a payoff number, say what it will be. No mystery.

## 3. Renames and vocabulary

### Step titles

| old | new |
|---|---|
| The marching band | Eight adders at once |
| The multiply engine | How a chip multiplies |
| The stationary trick (part 1) | Registers: where numbers are stored |
| The stationary trick (part 2) | Move the data, not the weights |
| Feed the beast | Match memory to compute |
| Assemble the NV-1 | Assemble the GPU |

Step 3 splits into two steps. Act 4 becomes 6 steps (see §5 for numbering).

### Words

| old | new |
|---|---|
| tick / tick the clock | clock cycle, defined once on first use ("one cycle: the clock strikes, every part moves once"), then "cycle" |
| broadcast ADD | send ADD to all sixteen |
| lockstep | dropped; say "all at once, on the same order" (the label ONE INSTRUCTION, SIXTEEN LANES can stay on the diagram) |
| pulse the vector [3, 7] | send 3 and 7 down the columns |
| weight-stationary | the weights stay put (label: WEIGHTS STAY / DATA MOVES) |
| edge / traffic | numbers crossing the border, counted on screen (see step 4 redesign) |
| starving lane | lane waiting for data (amber lamp keeps its meaning) |
| "9 ANDs" | "9 AND operations", and where the hardware is meant: "a 3-by-3 grid of AND gates" |
| systolic array | taught at the END of the weights step as the real name, with its heartbeat origin, one card |
| roofline | same treatment: the real name arrives after the player has balanced the machine |

### Business cards

Keep the ledger structure (company, location, revenue, cost). Rewrite each body to two
plain sentences: who ordered, and why this component matters to them. Example, step 1:

> A games studio placed the first order. Images are long lists of numbers, and this
> block adds long lists fast.

## 4. Engine API (BUILT, commit 6233fdb)

Three additions. The flow.ask record-and-replay contract is untouched: cards are output
only, recorded answers are unchanged, Back/Restart work as before. All three are opt-in
per step, so an un-ported step behaves exactly as it always did.

### guide card mode

```js
guide.title('STEP 2 / 6 · NANOVOLT GRAPHICS', 'How a chip <em>multiplies</em>');
guide.cards();          // call once, right after title()
guide.say('…');         // replaces the card in the slot
await guide.next();     // button lands in the pinned action row below the card
```

`say`, `note`, `aha` and `task` all render into the one card slot. `button`, `next` and
`choose` render into the action row. A new card automatically clears the previous card's
buttons. `flow` calls `guide.endCards()` after the step returns, so the venture card,
premise and CTA append normally.

**There is no card history stack and none is needed.** Every card boundary is already a
`flow.ask()`, so the existing Back re-runs the step one answer short and lands on the
previous card with its focus restored. This only holds if each card ends with an await on
a `guide.next()` / `guide.button()` / `guide.choose()`. A card with no await is a card the
player cannot go back to.

### stage focus

```js
const stage = newStage('14', 'aria label');
const { svg, controls } = stage;
stage.focus(node | [nodes], { label: 'register file', at: 'top', ring: true });
stage.clearFocus();
stage.bbox(node);       // {x,y,w,h} in the stage's 720×480 user units
```

`at` is `'top' | 'bottom' | 'left' | 'right'`, default `'top'`. `label` is optional and is
rendered uppercase in mono with a leader line. `ring: false` drops the dashed box, which is
what you want when the ring would enclose something that is being dimmed.

Focus works by covering the stage with a paper scrim and re-appending the focused nodes
above it, then restoring their original sibling positions on clear. Do not delete or
re-parent a focused node while it is focused; call `clearFocus()` first.

### watched transitions

```js
await Anim.tween(dur, p => { /* p runs 0 → 1, eased */ });
await stage.packInto(nodes, { x, y, w, h }, { dur, fade, scale });
```

`Anim.tween` collapses to a single `onUpdate(1)` while replaying or under reduced motion,
so a step's end state is identical whether it was played or replayed. Never drive a visual
change with a bare `setTimeout` loop; use `tween` or the existing `sleep`, both of which
are replay-aware. `packInto` slides and shrinks nodes into a box; pass `fade: false` to
leave them visible at the destination, and `scale` to control the final size.

### CSS already in place

`.card-slot`, `.card-actions`, `.focus-scrim`, `.focus-ring`, `.focus-leader`,
`.focus-label`, `.tile-bg.on`. Reuse the existing SVG vocabulary (`.tile-bg`, `.gate-lbl`,
`.lbl`, `.lbl-faint`, `.lbl-strong`, `.wire`, `.wire.dim`, `.bit-cell`, `.bit-t`, `.slot`,
`.lane`, `.lane-lamp`, `.lane-val`) before inventing a new class.

**Reference implementation: `js/acts/act4/step1.js`.** Read it before writing a step.

## 5. Act 4, step by step

Six steps. Stage numerals become 13-18; Act 5 shifts to 19-22; the course becomes 22
steps. Cost ladder: the old step 3's $260K splits into $60K (registers) + $200K
(weights); every other delta is unchanged, so the act still ends at $2.43M.

### Step 1 — Eight adders at once  ·  BUILT (commit 6233fdb)

Preface card: "You will turn your Act 2 machine into the first piece of a GPU."

1. Card: the Act 2 datapath drawing, small, labeled YOUR ACT 2 MACHINE. "This is what
   you built: one adder, one operation per cycle."
2. Card: it morphs (Rule 5) into a plain box labeled 1 ADDER. Arrow between the two.
   "Same machine, drawn small. We're about to need many of them."
3. The job appears: two lists of eight numbers, sum row empty. Card: "Add these two
   lists. Predict: how many cycles for one adder? For eight?"
4. Predict (existing choose), then run. Buttons: ADD NEXT PAIR, then ALL EIGHT AT ONCE.
   Result card: "Eight cycles, then one."
5. Rule 5 transition: the eight adders pack into one square, label LANE = ONE ADDER
   WITH ITS OWN NUMBERS. Card: "A lane is your adder, copied. It gives up choosing its
   own instruction; that's why sixteen fit."
6. Stamp the 4x4 grid (watched, not jumped). Card: "Sixteen lanes. One order reaches
   all of them." Button: SEND ADD TO ALL SIXTEEN.
7. Payoff card: "Sixteen answers in one cycle. Same operation, same moment, different
   numbers. That is the whole trick of a GPU."

### Step 2 — How a chip multiplies

Preface card: "Step back. Before how chips multiply: how does multiplication itself
work? We'll do 7 x 7. You already know it's 49, so you can check the machine."

Same mechanics as today (they tested well), re-carded:

1. One card per idea: 1-bit multiply is AND (the existing gate quiz); build partial
   product rows by tapping bits; each row shifts left one place.
2. Card before the dot board, with the board highlighted: "Every 1 drops into a column
   by its place value. Three dots in a column means three 1s to add there."
3. Count to 49. Card: "9 AND operations so far: a 3-by-3 grid of AND gates, one per
   pairing of bits."
4. Accumulator card: "A chip keeps a running total. Ours is 15. Drop its bits in too."
   Pile reads 64.
5. Crush game unchanged, but the instruction is one card: "Three 1s in a column is
   binary 11: one stays, one carries left. Tap columns until none holds three."
6. Hand to the Act 2 ripple adder (highlight it, label FROM ACT 2). Result 1000000 = 64.
7. Precision square unchanged. Payoff card: "Halve the bits and both sides of the grid
   halve. The engine gets 4x smaller. That's why AI chips use 8-bit and 4-bit math."

### Step 3 — Registers: where numbers are stored (new step, from old 3a)

Preface card: "Your engine needs numbers delivered every cycle. This step: where they
wait, and what delivery costs."

1. Card: highlight ONE shelf. "A register: a small shelf storing one number, right next
   to the engine." Label REGISTER R0.
2. Card: highlight the stack. "Eight of them: a register file." Label REGISTER FILE.
3. Card: highlight the picker. "A mux picks one register and ignores the rest. You'll
   build it from AND and OR."
4. Interaction as today: select a shelf, wrong rows AND-ed with 0 fade, OR funnel merges.
   Task: read R3.
5. Payoff, shown as a bar not a paragraph: FETCH ~180 GATES vs MATH ~35 GATES. Card:
   "Five gates of delivery for every gate of math, paid every cycle. Next step: stop
   paying it."

### Step 4 — Move the data, not the weights (from old 3b)

Preface card: "In AI, one of the two numbers barely changes. We'll stop fetching it."

1. Card: "The weight: the number the network learned. It stays the same for millions of
   cycles. The data is what keeps changing." Labels WEIGHT / DATA on the two tile kinds.
2. Card: "So park each weight in a register beside its engine. Load it once." Drag the
   weight tiles into the columns (as today).
3. Card: "Now only data moves. Send 3 and 7 down the columns." Button: SEND 3 AND 7
   DOWN.
4. Result card: "Left column: 0x3 + 3x7 = 21. Right: 1x3 + 2x7 = 17. You just did a
   matrix multiply."
5. The border, made visible: draw the array's boundary as a marked line with two
   counters, labeled IN and OUT. Card: "Count what crossed the border: 2 numbers in,
   2 out. Inside: 4 multiplies. The mux design fetched every weight, every cycle."
6. Scale card, numbers only: "At 128 x 128: 16,384 multiplies per cycle, 256 numbers
   in and out. Compute grows with the area of the square. Border crossings grow with
   its edge."
7. Name reveal, one card: "Data moves through it in beats, so its inventors named it
   after the heartbeat: a systolic array."

### Step 5 — Match memory to compute (rebuilt)

The balance beam goes. The stage becomes the hardware itself:

- Right: the 4x4 lane grid from step 1, each lane with its lamp.
- Left: HBM stacks (drawn as the tile towers the player will meet again in step 6).
- Between: a bundle of wires. Its drawn width = numbers delivered per cycle.
- Two counters, labeled: NEEDED PER CYCLE (from lane count) and DELIVERED PER CYCLE
  (from stack count). A utilization meter stays.

Preface card: "A lane only computes when its numbers arrive. This step: make delivery
match demand."

1. Card: highlight the stacks. "Memory delivers numbers at a fixed rate: its bandwidth.
   More stacks, more numbers per cycle." Label HBM STACK.
2. Card: highlight lamps. "Blue: fed. Amber: waiting for data."
3. Fix 1 as today (starved rig, add stacks until utilization >= 90%), but the player
   watches wires thicken and lamps flip blue as counters converge.
4. Fix 2 as today (overbuilt rig, remove idle stacks without starving).
5. Payoff card: "Whichever number is smaller caps the machine. Half of GPU design is
   delivery, not math. The chart of this trade-off is called the roofline."

### Step 6 — Assemble the GPU

As today, re-carded:

1. Preface: "Put the act in one package: your lanes, your memory, one lid."
2. Interposer defined on its own card with its label, then place die + two HBM stacks
   (CPU tile stays as the wrong option).
3. Cooler card: "Every flip makes heat. In Act 1 one flip was too small to measure.
   Billions per second on five inches is about 700 watts. Drop the cooler."
4. Training loop kept, two cards: what a pass is; loss falling means learning.
5. Final card ties back: "These are the lanes from step 1, grinding. Graphics, physics,
   AI: same machine, same move."

## 5b. The registry pass — checklist

Everything the per-step agents were forbidden to touch, collected as they reported it.
One pass, one commit, after every step has landed.

**The registry (`js/acts/act4/index.js`)**  ·  DONE

- [x] Six-entry `ACT4` array in the new order, with the new titles from §3.
- [x] Split the old `systolic` $260,000 into $60,000 (registers) + $200,000 (weights).
      Every other delta unchanged, so the act still ends at $2.43M.
- [x] Rewrite each entry's `premise` and `cta` to point at the step that actually follows.
      The old `feed` and `systolic` entries describe steps that no longer exist.
- [x] Business-card bodies to two plain sentences each, per §3.
- [x] `ACT4_SUMMARY` carried the banned voice: "You built the engine of the AI boom",
      "The NV-1 Tensor taped out clean", "NV-1 Tensor GPU". Rewrite with the humanizer,
      and rename the line items to match the new step titles.

**Numbering**

- [x] Stage numerals 13-18 for Act 4; Act 5 shifts to 19-22; course becomes 22 steps.
- [x] Every ported Act 4 step hardcode their eyebrow. Act 4
      step 1 still reads `STEP 1 / 5` and must become `1 / 6`. Grep for `STEP \d / \d`
      across all acts and fix every one.
- [x] `progress.js` stores `{act, step}`, so a run saved mid-Act-4 resumes one step off
      after the split. Acceptable, and the reason renumbering happens in one pass.

**Engine fixes deferred so the agents could verify against stable behaviour**

- [ ] `flow.hintAfter` routes through `guide.note`, which in card mode overwrites the
      current card. Give hints their own non-destructive slot.
- [ ] `stage.focus` re-parents raised nodes onto the SVG root, so a click listener on an
      ancestor group stops receiving events from a focused child. Dim the non-ancestor
      siblings by opacity instead of raising, which needs no re-parenting at all. Two more
      symptoms of the same root cause, both hit building Act 1: raising a node out of a
      transformed parent **drops that parent's transform**, flinging it across the stage;
      and `clearFocus` throws `NotFoundError` when the focus list was not in document
      order, because it restores back to front and ends up inserting before a node that is
      itself still raised. Switching to opacity dimming removes all three at once.
- [ ] Never measure geometry while a CSS transition is running (see `VERIFY_HARNESS.md`
      §4a). Wait it out and clear it first.
- [ ] `.pop-in` and any other scaling keyframe needs `transform-box: fill-box`. Without it
      the scale is about the SVG origin, so a box measured mid-keyframe lands off-stage.
      Every step currently strips the class by hand to work around this.
- [ ] **Engine determinism holes, pre-existing.** `field.spawn` uses `rand()`, `Field.tick`
      uses `Math.random`, and `lattice.js` `ensureHopper` uses `Math.random` plus a bare
      `setTimeout`. Carrier *positions* therefore differ between a live run and a replay.
      Counts, types and every recorded end state still match, so Back and Restart are
      sound, but this violates the determinism rule the steps are held to and should be
      seeded or driven off `Anim.tween`.
- [ ] **`guide._swap` leaks a card when two arrive within 260 ms.** It takes
      `host.firstElementChild` as the outgoing card and removes it on a timer; a second
      swap inside that window picks the *same* element again, so the card appended by the
      first swap is never marked `.out` and never removed. The slot grows by one each
      time. Only reachable at machine speed, so human play and replay are unaffected, but
      it is in every ported step. Fix: treat **all** current children as outgoing and skip
      any already carrying `.out`, rather than just the first child.
- [ ] A hidden slot rect that keeps its `tabindex` still paints the `:focus-visible` ring
      after it is placed. Steps currently drop `tabindex` and blur by hand; `makePlacer`
      should do it when a slot is filled.
- [ ] Re-verify steps 1 to 6 after those three land.

**Found porting Act 3 (2026-08-09)**

- [ ] **A `flow.ask` with no button of its own is an invisible Back stop.** Any step that
      records a generated value (a seed, a die size) must make that value's ask *be* a card
      boundary, with the ask rendering its own Next. Otherwise one Back press appears to do
      nothing and silently rerolls the value. Act 3 steps 3, 4 and 5 each hand-rolled a
      local wrapper for this; the engine should offer one.
- [ ] **CSS `text-anchor` on `.lbl` / `.lbl-strong` beats the presentation attribute**, so a
      label set with `setAttribute('text-anchor', …)` silently does nothing. Same failure
      mode as the known `fill` trap. Steps must use `style.textAnchor`. Worth fixing in CSS
      rather than in every step.
- [ ] **`stage.focus` on a child inside a CSS-transformed tile flings it to the stage
      corner** — the same re-parenting root cause as above, reached a new way. Act 3 step 4
      had to focus the parent and label the child instead.
- [ ] **`packInto` composes with the `transform` *attribute*, and a CSS `style.transform`
      silently beats it.** A step that positions nodes by style then packs them sees them
      not move.
- [ ] **`stage.focus` clamps a label back onto the element it labels** when the lift
      distance is large, putting the text on top of the thing it is naming.
- [ ] **`.chip b` is hard-coded blue in `css/base.css`**, which fights `DESIGN.md §1a` for
      any readout chip not showing a live signal. Act 3 steps 1 and 2 both overrode it
      inline. The colour belongs to the step, not the chip.
- [ ] **Chrome's `:focus-visible` paints an amber ring** on clicked SVG targets, which reads
      as a sixth meaning for amber. Act 3 step 5 blurs on pointer-driven clicks only
      (`if (e.detail) node.blur()`) so keyboard focus still shows. Related to the `tabindex`
      item above, but reached without `makePlacer`.

**Still open after the registry pass (2026-08-08)**

- [ ] Acts 1, 2 and 5 still use em dashes in their summary titles and locked banners
      (`... — cleared`). Acts 3 and 4 are now plain, so the house pattern is split until
      those acts are ported.

- [ ] `makeOvershootDemo` spawns one carrier per frame with up to 26 alive, so the stream
      renders as a solid bar rather than separable dots. Legible either way; a spacing knob
      would improve it. Same behaviour in the old step, so this is polish, not a regression.

**Cleanup and open questions**

- [x] **The semantic palette's second meanings are now recorded.** Ripu's call, 2026-08-08:
      keep them and write them down. `DESIGN.md §1a` now lists every meaning each colour is
      allowed to carry (blue: carrier and logic 1; red: hole and something lost or broken;
      amber: cost/heat/power and not-yet-connected), with the rule that a sixth meaning is
      a spec change rather than a step decision. Note the colour rules live in §1, not §4;
      agent briefs that say "§4" mean the physics rules.

- [ ] `makeRoofline` in `js/engine/lanes.js` is now uncalled (grep-confirmed), and with it
      the `.beam-pivot` / `.beam-bar` / `.beam-cord` / `.beam-pan` / `.beam` / `.starving`
      rules in `css/game.css`. Delete or keep, but decide together.
- [ ] **Decision for Ripu:** the "MAXIMISE COMPUTE PER UNIT OF COMMUNICATION" motto stamp
      (`makeMotto`) was the first of three planned appearances of that leitmotif and has
      dropped out of the rewritten act, because card 7 of the weights step now makes the
      same point with counted numbers. Restore it somewhere, or let it go.

## 6. What does not change

- The flow.ask record-and-replay contract, determinism, Back/Restart.
- Physics rules and color semantics (DESIGN.md §4): blue electrons, red holes, amber cost.
- The paper design language, fonts, hairlines, microlabels.
- The act's total cost and the course cost ladder's endpoint.
- §6 plain voice, §6b define-aim-interact, §6c intuition framework. This makeover
  tightens them; it contradicts none of them.

## 7. Build order

1. ~~Engine: guide card mode, stage focus/label helpers, pack/morph transition.~~ DONE.
2. ~~Step 1.~~ DONE.
3. Steps 2 to 6, one agent per step (`.claude/agents/byodc-act4-step*.md`). Each agent
   owns exactly one file and must not touch `js/acts/act4/index.js`.
4. Registry pass, done by the main agent once the steps land: the step-3 split, the new
   6-entry `ACT4` array, stage numerals 13-18, Act 5 shifted to 19-22, and the $260K
   cost split into $60K + $200K. `progress.js` stores `{act, step}` so saved runs are
   unaffected in shape, but a run saved mid-Act-4 will resume one step off; that is
   acceptable and is the reason renumbering happens in one pass rather than per step.
5. Playtest-for-confusion pass on Act 4, same method as PLAYTEST_FINDINGS.md: play it
   as a confusion-prone undergrad, check every card against what's actually highlighted.
6. Ripu reviews Act 4 live. Only after sign-off, port Acts 1, 2, 3, 5.
7. Then DESIGN.md gains §6d (this contract) and the old guide behavior is removed.
