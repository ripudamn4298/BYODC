# BYODC — Design & Engineering Spec (v2)
**"Build your own Data Centre"** — an interactive course from a grain of sand to AI superclusters.
This document is the single source of truth for the v2 revamp. Read fully before writing any code.

---

## 1. VISUAL IDENTITY — "a living instrument on paper"

Inspiration: antimetal.com (palette, type, lines, organization) + spade.com (scroll-driven storytelling).
The entire product looks like an exquisite ink-on-ivory engineering document that is *alive*:
hairline rules, mono microlabels, editorial serif, restrained color used only for physics semantics.

### Palette (CSS custom properties in `css/tokens.css`)
NOTE (v2.2): landing formation 0 is a rotating dotted GLOBE (landmasses + amber
data-centre hubs + blue connection arcs; draggable to spin) that dissolves into the
chip → MOSFET → transistor → wafer as you scroll. Morphs use dwell timing — each
formation holds while its journey text is readable and the morph happens entirely in
the gap between texts. The artifact canvas fades out as the journey ends so dots never
sit under later sections. Background music is the track in `bg-music/` (looped,
playbackRate 0.75, faint) via `js/engine/music.js`.

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

## 6. CONTENT VOICE
Same narrative + Nanovolt venture storyline as v1 (read `legacy/act1_v1.html` for the copy base),
edited where §4 demands. Landing headline: **"Build your own Data Centre."** — subline
"From a grain of sand to the machines that think. An interactive course you play, not read."

## 7. QUALITY FLOOR
Responsive ≥360px. Keyboard: all interactive SVG elements tabbable (`tabindex`, Enter/Space).
`prefers-reduced-motion` honored everywhere. No runtime network. No localStorage.
