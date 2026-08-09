# HANDOFF: the micro-learning makeover

Written 2026-08-08, mid-project, so context can be cleared and picked up cold.
Everything here is committed and pushed to `main`. The live site is
`https://ripudamn4298.github.io/BYODC/`.

---

## 1. The aim, in one paragraph

Ripu played Act 4 and got lost, not because the ideas are hard but because of packaging:
long paragraphs beside diagrams that never point at anything, new words used before they
are defined, poetic step names that hide the content, and steps that are secretly two
lessons. The makeover replaces the scrolling guide panel with **one card at a time**, where
every card highlights and names the one thing it is about, every term is defined on its own
card before use, and every step opens by pointing back at what the player already built.

The binding rules are `DESIGN_MAKEOVER.md` §2. They are not yet in `DESIGN.md`; the last
step of this project is to move them there as §6d.

---

## 2. Where things stand

| act | steps | status |
|---|---|---|
| 1 · The Physics of a Switch | 4 → **5** | **done, live.** Reviewed by Ripu: granularity "very good, significantly better" |
| 2 · Logic, Math & Memory | 4 | **done, live** |
| 3 · From Cell to Chip | 4 → **5** | **done, live** |
| 4 · The GPU | 5 → **6** | **done, live.** The pilot |
| 5 · The Data Centre | 4 → **5** | plan written, agents not created |

23 commits, all pushed. Nothing is uncommitted or on a branch.

Ripu has reviewed Act 1 only. He has said he will give comprehensive feedback later, so do
not treat the absence of complaints about Acts 2 and 4 as approval.

---

## 3. The documents, and what each is for

**Read these before touching anything:**

- `DESIGN.md` is the original binding spec. §1 is the visual identity and the palette,
  **§1a (added 2026-08-08) lists every meaning each colour may carry**, §4 is the
  non-negotiable physics rules, §6 / §6b / §6c are the voice and teaching frameworks.
  Note: agent briefs that say "§4" for colour are wrong; colour lives in §1a.
- `DESIGN_MAKEOVER.md`: **§2 is the course-wide contract, §4 is the engine API.** Both are
  shared by every act. The rest of the file is Act 4's own plan, kept as the worked example.
  §5b is the running checklist of everything deferred.
- `VERIFY_HARNESS.md` is how to run and check a step in the preview, plus every trap fifteen
  agents have hit. Read it before verifying anything; it will save hours.
- `RENUMBERING.md` says why no act renumbers itself, and where every numeral lands at the end.

**Per act, a diagnosis and a plan:**

| act | what it currently does | how to fix it |
|---|---|---|
| 1 | `ACT1_WALKTHROUGH.md` | `ACT1_MAKEOVER.md` (built) |
| 2 | `ACT2_WALKTHROUGH.md` | `ACT2_MAKEOVER.md` (built) |
| 3 | `ACT3_WALKTHROUGH.md` | `ACT3_MAKEOVER.md` (built) |
| 4 | `ACT4_WALKTHROUGH.md` | `DESIGN_MAKEOVER.md` §5 (built) |
| 5 | `ACT5_WALKTHROUGH.md` | `ACT5_MAKEOVER.md` |

The walkthroughs describe the act **as it was before** the makeover and end with where it
loses people. The makeover docs hold the per-step card scripts an agent is handed.

**Asset work, prototyped and parked:**

- `ASSET_PROMPTS.md` holds the Higgsfield recipe for hand-drawn "plates". Working model is
  `nano_banana_pro`, media role is `image`, style-referenced against a live landing frame.
  Five plates exist in `plates-act1/` and are **wired into nothing**.
- `ASSET_3D_CANDIDATES.md` surveys all 21 steps for where a 3D image would aid
  comprehension. **Awaiting Ripu's pass**; he said he would pick the spots.

**Superseded, ignore:** `HANDOFF_ACTS_3-5.md`, `HANDOFF_V3_ACT1_PHYSICS_ACT4_MATH.md`,
`PLAYTEST_FINDINGS.md`, `PROGRESS.md`. All predate the makeover.

---

## 4. The engine that makes card mode work

Built in commit `6233fdb`, documented in `DESIGN_MAKEOVER.md` §4. All of it is opt-in per
step, so an un-ported step behaves exactly as it always did.

```js
guide.cards();                                   // once, right after guide.title()
guide.say('…');                                  // replaces the card in the slot
stage.focus(node, { label: 'register file' });   // spotlight and name one thing
await stage.packInto(nodes, box);                // watch N things become one
await Anim.tween(dur, p => { … });               // replay-aware, collapses on replay
```

**There is no card history stack and none is needed.** Every card boundary is already a
`flow.ask()`, so the existing Back re-runs the step one answer short and lands on the
previous card. This only holds if **each card ends with an await**.

Reference implementation: `js/acts/act4/step1.js`. Read it before writing a step.

---

## 5. How an act gets ported (the loop Ripu specified)

1. Create one agent per step in `youtube_assets_design/.claude/agents/`, named
   `byodc-act<N>-step<M>.md`. Each owns **exactly one file** and is forbidden from touching the
   act's registry (`js/steps/act.js` for Act 1, `js/acts/act<N>/index.js` for the rest).
2. Fire them all in parallel. **Agent definitions only register at a turn boundary**, so a
   freshly written agent cannot be fired in the same turn it was created.
3. Each reports back; verify its claims rather than trusting them (see §7).
4. Do the registry pass yourself: the new `ACTN` array, the cost split, premises and CTAs
   rewritten to point at the step that actually follows, business cards cut to two plain
   sentences, and `ACTN_SUMMARY` rewritten.
5. Verify the whole act live, commit, push.
6. Delete that act's agents, create the next act's.

**Three collision rules that make parallel agents safe.** All three were learned the hard
way and every brief must carry them:

- Agents read source material with `git show HEAD:<path>`, never the working tree, because
  a split shifts files down a slot and a sibling may be mid-write on the path they need.
- Only the main agent touches the act registry, otherwise five agents contend over one file.
- Each agent gets its own scratchpad copy and its own port. `launch.json` already has
  `byodc-s2` … `byodc-s6` on ports 4812–4816. Agents must not edit `launch.json`.

---

## 6. Next steps, in order

1. **Act 5**: create five agents from `ACT5_MAKEOVER.md`, same loop. Step 1 splits, and the
   globe finale's "the same globe you saw on the very first screen" line is **cut**, decided
   already, because the landing shows the frame scrub now.
2. **The engine pass** (`DESIGN_MAKEOVER.md` §5b). Held deliberately until every act is
   ported, because it needs one re-verify of all steps rather than five. Act 3 added seven
   entries to that list, including two that every step now hand-rolls a workaround for.
3. **The global renumbering pass** (`RENUMBERING.md`). Course goes to **25 steps**; Act 4
   moves from 13–18 to 15–20 even though its content does not change.
4. Move `DESIGN_MAKEOVER.md` §2 into `DESIGN.md` as §6d, and delete the old guide behaviour.
5. **Repair the `byodc-s2`…`byodc-s6` entries in `launch.json`.** They point at scratchpad
   directories belonging to sessions that no longer exist, so every Act 3 agent had to fall
   back to serving its own copy by hand. A `byodc-live` entry now exists as the working
   pattern; macOS TCC blocks serving `~/Documents`, so it serves a scratchpad copy.

---

## 7. Hard-won lessons, do not relearn these

**Verify the agents, do not trust them.** Fifteen agents have run. Their work has been
consistently good, but two reported findings were **wrong** and would have been propagated:
a claimed broken keyboard path in `makePlacer` (the handler does call `checkAll()`), and one
agent invented physical quantities (60 µA through a hard short, which is off by orders of
magnitude and contradicted its own card). Both were caught by checking against `git show
HEAD` or arithmetic. Every numeric or physical claim gets checked.

**The copy was usually right and the picture was quietly wrong.** That is the shape of
almost every defect found. Check that the drawing does what the sentence says.

**Preview quirks that look exactly like broken steps** (all in `VERIFY_HARNESS.md`):
the backgrounded tab suspends rAF and throttles timers, so the shim must be Worker-driven;
gsap captures rAF at import and needs its own tick; CSS transitions do not advance, so
geometry measured mid-transition reads stale; `flow.start` consumes the array you hand it;
and synthetic `PointerEvent`s break `setPointerCapture`, so drags must be real.

---

## 8. Open decisions waiting on Ripu

None of these block Act 3 or Act 5.

- **The motto.** "MAXIMISE COMPUTE PER UNIT OF COMMUNICATION" (`makeMotto`) now has no
  caller anywhere. It was the first of three planned appearances of that leitmotif; Act 4's
  weights step makes the same point with counted numbers instead. Restore or drop.
- **Dead code.** `makeRoofline` in `js/engine/lanes.js`, plus `.beam-*` and `.starving` in
  `css/game.css`, orphaned when the balance beam was replaced.
- **The five generated plates** in `plates-act1/`, built and verified against the paper,
  referenced by nothing.
- **The 3D survey** in `ASSET_3D_CANDIDATES.md`, awaiting his pick of which steps get one.

---

## 9. What the makeover has actually found

Eighteen defects in shipped code, across four acts, none of them looked for. Recorded here
because they are the argument for doing the remaining two acts properly rather than quickly.

- **The diode was wired backwards** (Act 1 step 2). P on the left, N on the right, and the
  code routed battery + into the N side while calling it forward bias. It had been lighting
  its lamp at 0.7 V under reverse bias since it shipped.
- **The four-bit adder was drawn backwards** (Act 2 step 2). Tiles ran LSB-leftmost so the
  carry travelled left to right while the copy said "right to left, exactly like adding on
  paper", and the tile row contradicted the answer row.
- **A demo that demonstrated nothing** (Act 2 step 3). "Let go and watch the answer vanish"
  drove a NAND with one input tied to 0, and `NAND(x,0)` is 1 either way.
- **A task that completed itself** (Act 2 step 3). The latch rested at Q=1 and the task
  waited for Q=1 with no button held.
- **Back was broken** (Act 2 step 2). Four buttons sat inside an outer `flow.ask` while each
  recorded its own answer, so replay consumed the queue misaligned by four.
- **The answer shown before the question** (Act 1 step 2). A bracket labelled "0.7 V" sat on
  screen while the player was asked to find the voltage where current starts.
- **A confirmation task that was theatre** (Act 1 step 2). Flipping the battery jumped the
  depletion strip to 1.6× instantly at 0 V.
- **Terms used before definition** (Act 1 step 1). Dopant buttons said N-type and P-type
  eight cards before either was defined, which is the reveal.
- **A summary teasing the wrong act** (Act 1). It advertised ACT 3 as next, with a note
  apologising that Act 2 came first.
- **The precision square never shrank** (Act 4 step 2). The grid always filled its tile
  while the card claimed a 4× smaller engine.
- **A hidden rule** (Act 4 step 4). The systolic drag inferred a weight's row from drop
  order, which the player had no way to know.
- **An unnamed object** (Act 4 step 2). The 3-into-2 compressor token appeared mid-animation
  with nothing naming it.
- **A stale CTA** (Act 4 step 1). It still said "Stamp the lanes" after that step had been
  folded into step 1.
- **A landing row advertising a renamed step** (Act 4). It promised the NV-1.
- **A fab that printed the whole wafer in one flash** (Act 3 step 2). The copy said "one
  exposure prints every die on the wafer, all at once". A scanner exposes one field at a
  time and steps across the wafer; only the per-field count was defensible.
- **An alignment task that accepted a wrong answer** (Act 3 step 2). The rig shipped with
  `tol: 4`, so a player could stop at an offset of 3 while the card said "bring both
  offsets to 0" and the payoff claimed they had.
- **A second test that tested nothing** (Act 3 step 3). The second wafer kept the player's
  die size from the first, which already cleared the new target, so the re-check resolved
  with no player action. The whole point of the beat was the re-check.
- **Two landing rows advertising renamed steps** (Act 3, `index.html` and `test.html`).
  Both still promised "play the yield game".

Plus engine defects, all logged in `DESIGN_MAKEOVER.md` §5b and all deferred to the engine
pass: `guide._swap` leaks a card when two arrive within 260 ms; `stage.focus` re-parenting
breaks click listeners, drops parent transforms and throws on an unordered list;
`flow.hintAfter` and `guide.truthTable`'s built-in notes overwrite the card they sit on; and
`js/engine/field.js` and `js/engine/lattice.js` use `Math.random`, so carrier positions differ between a live
run and a replay.
