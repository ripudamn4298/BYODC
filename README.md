# BYODC — Build your own Data Centre
### From a grain of sand to the machines that think · an interactive course you play, not read

**v2 — "a living instrument on paper."** Ink-on-ivory editorial design (Antimetal-inspired palette/type/lines,
Spade-inspired scroll storytelling), draggable morphing landing artifact, scroll-driven journey, and
Act 1 fully playable with physically honest visualizations.

## Run it
Serve the folder statically and open it — no build step:
```
cd BYODC && python3 -m http.server 4173   # then http://localhost:4173
```
(Native ES modules require a server; opening index.html via file:// won't work.)
No runtime network: GSAP is vendored in `vendor/`, fonts (Instrument Serif, EB Garamond, IBM Plex Mono) in `fonts/`.

## What's inside
- **Landing** — hero with a draggable 430-dot constellation that morphs lattice → transistor → MOSFET →
  chip → rack as you scroll the pinned Journey; a dark "Meanwhile, in the real world" interlude with
  flying fact cards (ASML, TSMC, nm-vs-hair…); acts ladder; colophon.
- **Act 1 — The Physics of a Switch** (4 steps, each hands-on):
  1. Dope a silicon crystal (bond electron *pairs* drawn honestly; holes = vacancy rings that hop
     between bonds; electron-flow vs conventional-current beat, then chevrons everywhere after).
  2. NPN transistor (emitter small / base thin / collector wide; current INTO base; LED ×100 test).
  3. MOSFET (gate+glass+silicon = a capacitor; channel forms past threshold; 0 A into the gate, always).
  4. CMOS inverter (place the twins; power blips only at the flip).
- **Back / Restart everywhere** — record-and-replay navigation (`js/engine/flow.js`): every interaction
  is recorded; Back re-runs the step instantly to one answer earlier (works across steps).
- Running cost HUD ($0.0015 total), Nanovolt venture storyline, summary ledger, locked Act 2 tease.
- Synthesized audio only (Web Audio), `prefers-reduced-motion` honored, keyboard accessible.

## Architecture (see DESIGN.md for the binding spec)
```
css/tokens|base|landing|game.css      design system
js/landing.js                          hero artifact + scroll choreography (GSAP ScrollTrigger)
js/engine/…                            util, anim, sfx, field, pathflow (dots + current chevrons),
                                       lattice (bond pairs, dopants, hole-hopping), components,
                                       guide, hud, stage, flow (back/replay)
js/steps/act.js + step1–4 + summary    Act 1 content — extend later acts by appending configs
legacy/act1_v1.html                    archived v1 (dark theme, single file)
```
Debug hooks: `window.__byodcArt` (landing artifact), `window.__byodcFlow` (act runner — e.g. `.start(2)`
jumps to step 3).
