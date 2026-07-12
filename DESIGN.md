# BYODC — Design & Engineering Spec (v2)
**"Build your own Data Centre"** — an interactive course from a grain of sand to AI superclusters.
This document is the single source of truth for the v2 revamp. Read fully before writing any code.

---

## 1. VISUAL IDENTITY — "a living instrument on paper"

Inspiration: antimetal.com (palette, type, lines, organization) + spade.com (scroll-driven storytelling).
The entire product looks like an exquisite ink-on-ivory engineering document that is *alive*:
hairline rules, mono microlabels, editorial serif, restrained color used only for physics semantics.

### Palette (CSS custom properties in `css/tokens.css`)
NOTE (v2.4 — 2026-07-12, later; the user tested this on test.html, called it perfect,
and asked for it on index.html): the landing artifact is now a HAND-DRAWN FRAME SCRUB —
151 pencil sketches in `animation-frames-hd/` (2568×1432; one continuous camera move:
rack room → 1U server → GPU → die → single 7nm FinFET) drawn full-bleed on the #artifact
canvas with `mix-blend-mode:multiply` so their cream paper melts into the site's paper
and only the ink remains. A fixed `#scrim` paper gradient keeps the copy column legible
(vertical variant ≤880px, where the sketch also dims to 50% as background texture).
Scroll scrubs the frames with dwell timing (phase anchors 0/77/103/127/150 — each frame
rests while its journey text is readable, travel happens in the gap; exponential frame
smoothing; drawing eases right over frames 0→77 to fill the paper beside the copy).
The canvas + scrim fade out as the journey ends. Journey copy follows the frames:
DATA CENTRE → SERVER → GPU → CHIP → TRANSISTOR. This superseded the dotted globe
(v2.2/v2.3) — what finally made raster art blend, after the failed 2026-07-12
experiments, was the multiply blend + scrim + frame-anchored dwell sync; the earlier
dot-globe implementation survives in git history if ever needed. `test.html` is the
standalone test harness for this animation. Background music is the track in
`bg-music/` (looped, playbackRate 0.75, faint) via `js/engine/music.js`.

NOTE (v2.1): background warmed to a tan-cream and given a faint sepia graph-paper
texture (`body::before`, masked to soft corner/edge patches so it lifts blank space
without ever sitting under text). Landing artifact now morphs **data centre → chip →
MOSFET → transistor → wafer** (destination-first "zoom all the way in", ending where
Act 1 begins). Hero CTAs removed in favour of a scroll cue; a single "Start Act 1"
button lives down in the Acts section (plus the persistent nav button). Ambient
synthesized music (`js/engine/music.js`) plays during the game and is muted by the HUD
toggle; the old periodic hole-hop beep is removed.

| token | value | use |
|---|---|---|
| `--paper` | `#E8DFC9` | page background (warm tan-cream) |
| `--paper-high` | `#F2ECDC` | cards / stage panels (lift off the bg) |
| `--grid-fine` / `--grid-bold` | warm sepia | graph-paper texture lines |
| `--ink` | `#1D2117` | text, strokes, dark panels' bg is `--dark` |
| `--ink-soft` | `#565D4C` | secondary text |
| `--ink-faint` | `#989C8C` | tertiary, disabled |
| `--hairline` | `rgba(29,33,23,.16)` | 1px rules, borders |
| `--hairline-soft` | `rgba(29,33,23,.09)` | grids, dashed cells |
| `--dark` | `#181B12` | dark contrast blocks (business cards, aha) |
| `--blue` | `#2946CC` | **electrons / N-type** only |
| `--red` | `#D9481E` | **holes / P-type** only |
| `--amber` | `#A8741F` | **cost / heat / power** only |
| `--green` | `#5C6B45` | success ticks, olive accents |

Rules: color NEVER decorates — it always means something (blue=electron, red=hole, amber=money/power).
Everything else is ink on paper.

### Type (local files in `fonts/fonts.css`, already vendored — never hotlink)
- **Display:** `'Instrument Serif', serif` — headlines, step titles, big numerals. Often paired roman + `<em>` italic.
- **Body:** `'EB Garamond', serif` — 17–19px, line-height 1.55. All narrative text.
- **Mono:** `'IBM Plex Mono', monospace` — microlabels (10–11.5px, uppercase, letter-spacing .16em), numbers, chips, buttons.
- UI buttons and labels are MONO UPPERCASE, never serif.

### Graphic language
- 1px hairlines everywhere; dashed hairlines for secondary structure.
- **Corner ticks**: cards get small `+` crop marks at corners (use `.ticks` helper class — already in base.css).
- Section numbers: `01 — SAND` style mono eyebrows.
- SVG diagrams: ink strokes (1.5–2px) on paper, region fills at 6–9% opacity of the semantic color,
  labels in mono microcaps. No glows on paper — crispness IS the aesthetic. Motion carries the "alive" feel.
- Electrons: filled `--blue` dots. Bond electrons: smaller (r 2.3), 70% opacity, ink-blue, *paired* on bonds.
  Free electrons: r 4.3, full `--blue`. Holes: `--red` ring (r 5, stroke 2.2, no fill).
- Current (conventional): small ink chevrons `›` flowing along wires — NOT dots (dots = physical carriers).
- Dark blocks (`--dark` bg): cream text, used sparingly for business cards / aha moments / act summary.

### Motion
- GSAP is vendored in `vendor/` (gsap, ScrollTrigger, Draggable, InertiaPlugin) — loaded as globals via script tags.
- Eased, restrained, purposeful. `power3.out` entrances, no bouncy overshoot except the landing artifact physics.
- Respect `prefers-reduced-motion` (`RM` flag exported from engine/util.js): static fallbacks, no scrub-pins.

---

## 2. ARCHITECTURE

No build step. Native ES modules served statically. GSAP via classic `<script>` tags (globals).

```
index.html          — landing + game shell, loads css + vendor + js/main.js (module)
css/tokens.css      — palette/type tokens
css/base.css        — reset, shared components (buttons, chips, cards, ticks, tasks)
css/landing.css     — landing page
css/game.css        — HUD, stage, guide panel, SVG classes
js/main.js          — boot: landing init; "begin" → hide landing, start act
js/landing.js       — hero + morphing draggable artifact + scroll sections
js/engine/util.js   — $, el, svgEl, rand, clamp, sleep, waitFor, RM, slug, svgPt
js/engine/anim.js   — shared rAF ticker (Anim.add/remove/clear)
js/engine/sfx.js    — synthesized audio (paper-lab palette: soft ticks, felt taps, quiet swells)
js/engine/field.js  — wandering carriers (Field class; spawn {kind:'e'|'h'})
js/engine/pathflow.js — PathFlow (carrier dots) + CurrentFlow (chevron arrows, direction-aware)
js/engine/lattice.js  — buildLattice WITH bond electron pairs; dopeAtom; hole-hop animation
js/engine/components.js — makeLamp, makeBattery, makeSlider, makeChip, makeSeg, makeMeter, makePlacer, cornerTicks
js/engine/guide.js  — narrated panel: title/say/note/aha/button/choose/task/card + replay support
js/engine/hud.js    — top bar: wordmark, STEP n/4, SPENT $, mute
js/engine/stage.js  — newStage(): fresh 720×480 SVG + controls row + defs
js/engine/flow.js   — act runner + BACK/RESTART via record-and-replay (see §3)
js/steps/step1.js … step4.js, summary.js
js/steps/act.js     — ACT1 step configs (id/title/costDelta/inventory/businessCard/premise/cta/run)
legacy/act1_v1.html — archived v1
```

---

## 3. NAVIGATION — Back / Restart (record-and-replay)

Steps are deterministic async functions. Every user interaction resolves through `flow` so it can be
recorded and replayed:

```js
// engine/flow.js (already written — READ IT before writing steps)
flow.ask(liveFn)            // awaits liveFn() when live; auto-resolves recorded value on replay
flow.instant                // true while replaying — skip sleeps/animations (sleep() already honors it)
guide.button/choose/…       // already routed through flow.ask internally
```

Custom stage interactions in steps MUST use the pattern:
```js
const result = await flow.ask(async (replayValue) => {
  if (replayValue !== undefined) { applyStateInstantly(replayValue); return replayValue; }
  const v = await manualInteraction();   // clicks, drags, slider targets…
  return v;                               // recorded automatically
});
```
The guide renders instantly (no transitions) while `flow.instant` is true.
UI: guide header shows `← BACK` and `↺ RESTART STEP` microbuttons (flow.js renders them).
Back pops the last recorded answer and re-runs the step to that point; Back at a step's start
returns to the end of the previous step. Steps therefore must be **pure**: same answers ⇒ same state.

---

## 4. PHYSICS CORRECTIONS (non-negotiable — these fix real errors from v1)

1. **Bonds are electron pairs.** Every Si atom shows 4 bond stubs; every bond renders TWO small
   bond-electrons (one contributed by each atom) sitting midway. Edge atoms' outward bonds fade out
   (the crystal continues). Tapping an atom wiggles its bond electrons — they're *locked*, they return.
2. **Free vs bond electrons are visually distinct** (size / saturation / motion — see §1).
3. **No cross-doping.** NEVER add boron to a phosphorus-doped crystal or vice versa. To teach the
   other flavor, the player uses "↺ Reset the crystal & try the other dopant" (full lattice reset,
   loops back to the choice). Both flavors teachable; one crystal, one dopant at a time.
4. **Doping animations:** Phosphorus arrives with 5 valence dots → 4 snap into the bonds, the 5th
   visibly ejects and becomes a free electron. Boron arrives with 3 → one bond is left with a single
   electron + a **vacancy ring** (`--red`). Hole motion = an adjacent bond electron *hops into* the
   vacancy and the ring relocates (animate the hop, ~1.1s cadence, few holes at a time).
5. **Electron flow vs conventional current.** In step 1, first conduction shows ELECTRON flow
   (blue dots toward battery +) and the guide SAYS we're showing electron flow, not current. Then a
   dedicated beat flips to **conventional current** (ink chevrons, opposite direction) and states:
   current direction is the convention, it's opposite to electron flow, and **from now on every
   circuit shows conventional current** (CurrentFlow chevrons, never blue dots, on all wires in
   steps 2–4).
6. **NPN transistor (step 2):** conventional current flows INTO the collector, INTO the base, and
   OUT of the emitter. On screen: main loop battery+ → COLLECTOR (right) → device → EMITTER (left)
   → battery−; base chevrons flow INTO the base (downward). A small aside reminds: inside, electrons
   actually stream emitter→collector, opposite the arrows.
7. **Collector is physically larger than the emitter.** Regions and tray tiles sized accordingly
   (emitter N small, base P thin, collector N wide) and labeled with mono microlabels
   EMITTER (N) / BASE (P) / COLLECTOR (N). Assembly validated as [emitter, base, collector].
8. **MOSFET (step 3): capacitor framing.** The gate metal + glass + p-silicon form a CAPACITOR:
   charge the top plate, and the field pulls electrons to the underside of the glass — that pulled-up
   sheet IS the channel. Include this beat verbatim in spirit. Current chevrons run drain→source
   (battery+ → drain → channel → source → −); optional aside: electrons drift the other way.
9. **CMOS (step 4):** unchanged logic (PMOS top / NMOS bottom, inverter, power blip on flip only),
   restyled; current pulse chevrons: charge = power→output, discharge = output→ground.

---

## 5. GAME SHELL (css/game.css — already written; reuse classes)

- HUD: hairline-bottom paper bar — serif wordmark "BYODC·", mono `STEP 1 / 4`,
  mono amber `SPENT $0.0004`, mute `♪`.
- Stage: `--paper-high` card, hairline border, corner ticks, giant Instrument-Serif step numeral
  watermark at 5% ink. Controls row beneath the SVG (chips, sliders, toggles, meter).
- Guide: paper panel, step eyebrow (mono) + Instrument Serif h2 + hairline, EB Garamond beats,
  primary buttons = ink pill with mono uppercase label `BEGIN ▸`, ghost = hairline outline.
- Business card: `--dark` block, cream text, mono amber cost line, eyebrow `VENTURE UPDATE`.
- Aha: `--dark` block with Instrument Serif italic lead — the dramatic moments are dark-on-paper.
- Tasks: hairline cells with square tick boxes (green `--green` when done).

## 5b. ACT 2 — "From Switches to Logic, Math & Memory"
Ladder: **NAND → adder → latch → clocked datapath.** Steps live in `js/acts/act2/step1–4.js`
(configs + all venture copy in `js/acts/act2/index.js`; do not duplicate copy in steps).
Multi-act plumbing: `flow.run(steps, {actLabel, baseCost, onComplete})`; summaries are
data-driven via `showSummary(spec, onNext)`.

Logic vocabulary (engine/gates.js + game.css — USE THESE, do not invent):
- `makeGate(svg,{x,y,kind:'NAND'|'AND'|'OR'|'XOR'|'NOT',label,cap})` — friendly labelled
  paper tiles with pins; `.set([a,b])` evaluates and lights pins, returns out.
  `setManual({ins,out})` for compressed tiles (FA, REG). NO textbook gate symbols, ever.
- `sigWire(svg,d)` — logic-level wire; `.set(hi)` → cobalt when HIGH, hairline when LOW.
- `makeBits(svg,{x,y,n})` — bit lamps with 8·4·2·1 weight labels; `makeToggleBits(controls,…)`
  — HTML tap-to-flip bit buttons with live decimal readout.
- `guide.truthTable({heads,rows,expected,hint})` — the player fills OUT by tapping cells;
  already replay-safe. This is step 1's test.
- Signals are ALWAYS cobalt-when-HIGH / hollow-when-LOW; conventional-current chevrons are
  Act 1's language — Act 2 speaks in logic levels (CurrentFlow only for the step-4 clock pulse).

CS-correctness rules (non-negotiable):
1. NAND is taught as THE universal gate; NOT = NAND with tied inputs; AND = NAND + NOT.
2. Binary is taught by weights (8·4·2·1 lamps), never notation-first. Zero equations.
3. The full adder is built from gates once, then COMPRESSED into a tile and stamped 4×
   ("box it, stamp it, repeat" — abstraction is the chipmaker's superpower). Carry ripples
   visibly, LSB→MSB, with a per-stage delay so the cascade is felt.
4. The SR latch is two cross-coupled NANDs; the PLAYER draws the two feedback wires.
   SET/RESET buttons pulse the (active-low) inputs — copy says "press = tug the line low",
   never bare S̄/R̄ jargon. Held state must visibly persist after release.
5. The datapath is REG → ADDER → back to REG, clocked. Each clock press: one fetch-compute-
   store beat (CurrentFlow pulse around the loop, then bits update). Overflow wraps at 15
   with an amber blip. Test = reach a target value by choosing the addend and clocking.

## 5c. ACTS 3–5 (fabrication · GPU · data centre)
Built from `HANDOFF_ACTS_3-5.md` (the binding per-act pedagogy spec — read it for these acts).
Engine modules, mirroring gates.js: `js/engine/fab.js` (makeWaferMap, makeMaskAlign, mulberry32,
processTile), `js/engine/lanes.js` (makeLaneGrid, makeRaceTrack, makeRoofline), `js/engine/dc.js`
(makeRackElevation, makePowerLadder, makeTopoBoard — the last generalises Act 2 step 3's pin-wirer).
Configs + copy + summaries in `js/acts/act{3,4,5}/index.js`; steps in `step{1..4}.js`. Stage
numerals continue 09–12 / 13–16 / 17–20. The cost HUD now escalates (hud.formatMoney: $0.0004 →
$2,000 → $2.43M → $1.1B); base costs chain through `ACT{N}_BASE_COST`. Act 5 step 4 reuses the
landing globe (earth-dots.js + ll2v projection) for the finale — the course closes where it opened.
CS-correctness for these acts is specified in HANDOFF §4/§5/§6 (yield is quadratic in die size;
SIMT lanes are lockstep; roofline = compute vs memory feed; fat-tree = ≤2 switch hops, design for
failure). Determinism trap: Act 3's defect scatter and any random lane/site pick MUST record their
seed/choice via flow.ask and reproduce on replay.

## 6. CONTENT VOICE — PLAIN, DIRECT, NON-POETIC (binding, non-negotiable)

**The rule:** explain the mechanism in the simplest true words. State what happens and why. Do
not dress it up. The reader is smart — write for an intelligent adult who wants to understand,
not for a child who needs to be dazzled. Clarity beats flourish every time.

**Do:**
- Lead with the mechanism: what moves, what it does, what results. Concrete nouns and verbs.
- Use plain physical language: "electrons need energy to cross the barrier", "the depletion
  layer is a region with no free carriers", "a small base current lowers the barrier".
- Keep second person and short sentences. Define a term in plain words the first time it appears.
- Use real numbers (0.7 V, 10 µA, p × q) instead of adjectives.
- If a comparison genuinely makes something clearer, use ONE, state it plainly, and move on.

**Do NOT:**
- No theatrics or drama: "the strangest thing in this whole course", "the century-changer",
  "the junction locked the gate", "somebody pushing that wall around", "watch it give way".
- No metaphor-chains or personification standing in for the explanation. A wall that "appears,
  thins, breaks, and regrows on command" is poetry, not physics — say what actually happens.
- No suspense-building or hype ("here's the trick worth a chip company", "file that away").
- No talking down, no cutesy asides, no exclamation-driven excitement.
- Don't say the same thing three different ways for effect. Say it once, correctly.

**Before → after (the standard):**
- ✗ "Now push. Raise the voltage slowly and watch the wall itself — find the exact push where
  it gives way." → ✓ "Connect a battery to push electrons toward the boundary. To cross, an
  electron needs enough energy to get over the barrier. Raise the voltage and find where
  current starts to flow."
- ✗ "You just built a one-way valve for electricity — the diode, the first useful thing anyone
  ever made from a junction. But the real prize is the wall itself…" → ✓ "You built a diode: it
  passes current in one direction and blocks it in the other. Voltage can raise or lower the
  barrier — that control is the basis of every switch in a chip."

The "aha" payoff block still exists, but it states the insight directly (the numbers, the
consequence) — it is not an excuse for purple prose. Same Nanovolt venture storyline for the
business cards; that flavour lives in the cards, never in the teaching copy. Landing headline:
**"Build your own Data Centre."** — subline "From a grain of sand to the machines that think.
An interactive course you play, not read."

**This supersedes any "warm / lyrical / designed aha moment" phrasing elsewhere in the specs
or handoffs.** When in doubt, cut the adjective and state the fact.

## 6b. THE TEACHING FRAMEWORK — every step, in order (binding)

A step must not throw the player into an interaction they don't understand. Real learner
feedback: *"what exactly are we doing here? not clear"*, *"what do you mean by die?"*, *"what is
stamp the lane?"*, *"talk like an expert — first introduce the terms and what they mean, then say
what we're going to learn, then do it."* So every step opens in this exact order:

1. **DEFINE the terms.** Name and define each key term *before* you use it in an instruction.
   Never use a piece of jargon the player hasn't been given yet. If a step says "place the die on
   the substrate", the words *die* and *substrate* must already be defined in that step (or a
   prior one). One plain clause per term: "a **die** — one finished chip, still in the grid of
   its neighbours on the wafer."
2. **STATE the aim.** In one sentence, say what the player is about to build or figure out, and
   why it matters. The player should always be able to answer "what am I doing and what's the
   point?" *before* they touch a control. e.g. "Your job: find the die size that makes each good
   chip cheapest — because that single choice is the whole economics of a chip."
3. **THEN interact.** Only now give the do-this instruction, and make the control's purpose
   explicit ("drag the five steps into the order they run", "click a size and read the cost").

Rules that keep this honest:
- **Diagrams get a sentence.** If the stage shows a diagram (a wafer of dies, a grid of lanes,
  an exploded package), one line must say what the player is looking at and how to read it —
  including why elements differ ("each lane holds a different pair of numbers from the list, so
  each shows a different sum — same operation, different data").
- **Interaction terms are terms too.** "Stamp the lane", "sweep the rail", "tick the clock" are
  jargon — define them the first time ("*stamp* = copy one finished block many times, the way a
  fab prints the same design across a wafer").
- **This does NOT force spoilers.** The *aim* is the concrete goal ("build a gate whose output is
  0 only when both inputs are 1"), not the punchline name. A step may still reveal "…this shape
  is called NAND" as its payoff after the test. Define what you *use*; save the name if the name
  is the reward.
- Everything still obeys §6 (plain, direct, non-poetic). The framework is about *order and
  completeness*, §6 is about *tone*. Both bind.

Before → after:
- ✗ (jumps in) "Every layer goes through the same five-step loop. Drag them into order." → ✓
  "A **photolithography** cycle prints one layer of the chip using light. It has five steps, and
  they only work in one order. Your job: put them in that order. (Coat = spread light-sensitive
  film; expose = shine the patterned light; …) Drag the five tiles left-to-right into the order
  they run."

## 6c. THE INTUITION FRAMEWORK — build a new idea on an answer they already trust (binding)

Use this whenever a step teaches a *method* (an algorithm, a machine, a process) rather than a
single fact. It is a specialisation of §6b, ordered to build genuine intuition instead of just
walking through steps. The five moves, in order:

1. **Start from a case the learner already knows the answer to.** Pose a small, concrete instance
   whose answer they can get in their head — "we're going to multiply **9 × 5**." Now they're
   sitting on a fact they're *certain* of (45). Their question flips from "what's the answer?" to
   the far more useful "let me watch how the machine reaches the answer I already know."
2. **Let them do the mechanical steps themselves.** Hands-on, so the method becomes theirs, not a
   demo they watched (tap each bit, place each tile).
3. **Reveal the intermediate result equals the answer they already knew — the checkpoint AHA.**
   Show, explicitly, that what they just built comes out to the known answer: "count the columns —
   **it comes to 45**, exactly what you started with." This is the load-bearing moment: the method
   just reproduced something they were already sure of, so now they *trust the method*.
4. **Only now introduce the twist / the harder concept** — and never before the checkpoint. Because
   the base case is trusted, the new idea lands as "oh, that makes sense" instead of "wait, what?"
   ("But a chip rarely multiplies just once — it keeps a running total, the accumulator…").
5. **Layer further concepts on the now-trusted base** (add the accumulator into the pile; *then*
   introduce the compressor). Each new layer sits on ground the learner has already verified.

Iron rule: **never introduce a new concept while the learner is still unsure the basic thing
works.** Get to the known-answer checkpoint first; extend only from there. If a step currently
dumps several new ideas at once before any checkpoint, split it: known case → do it → "it matches!"
→ twist → extend.

**Worked reference — Act 4 · Step 2 (the multiply engine):**
- "We'll multiply **9 × 5**." (learner: *45, easy — show me the method*)
- They tap each bit of the bottom number → the partial products appear (they build it).
- The bits drop into place-value columns; **count them → 45.** (checkpoint AHA: the method works)
- "But a chip keeps a **running total** — the accumulator. Here it's 19." (the twist, now trusted)
- Add 19's bits into the pile → **64.**
- *Then* introduce the compressor as the tool that adds a tall column. (the final layer)

## 7. QUALITY FLOOR
Responsive ≥360px. Keyboard: all interactive SVG elements tabbable (`tabindex`, Enter/Space).
`prefers-reduced-motion` honored everywhere. No runtime network. No localStorage.
