# ACT 1 MAKEOVER — micro-learning

Plan to port "The Physics of a Switch" to the card contract. Diagnosis is in
`ACT1_WALKTHROUGH.md`. The binding rules are `DESIGN_MAKEOVER.md` §2, and the engine API
they run on is §4. Act 4 is the worked example: read `js/acts/act4/step1.js` before writing.

**Act 1 goes from 4 steps to 5.** The current step 2 is two complete lessons under one
number, exactly like Act 4's old "stationary trick".

## 1. What has to change

1. **Step 2 is the diode and the transistor in one sitting.** Two builds, two payoffs, two
   name reveals. Split it.
2. **Nothing on the stage is labelled when the copy names it.** The lattice, the depletion
   layer, the emitter and base and collector, the gate stack: all named in prose beside a
   diagram that never points at them.
3. **The panel accumulates paragraphs.** Same as everywhere else pre-makeover.
4. **The MOSFET is drawn flat**, so the cross-section quietly teaches the wrong shape. See
   `ASSET_3D_CANDIDATES.md`; this is the strongest 3D candidate in the course.
5. **The lattice is drawn flat too.** Silicon is diamond cubic and the copy never says the
   grid is a convenience.

## 2. Renames

| old | new |
|---|---|
| Build your own P/N semiconductor | Make silicon conduct |
| Build your own transistor (part 1) | Where N meets P |
| Build your own transistor (part 2) | A small current controls a big one |
| Build your own MOSFET | Switch it with voltage, not current |
| Build CMOS, the switch that runs the world | Why a billion switches do not melt |

The real names still get taught. Diode, NPN transistor, MOSFET, NMOS, PMOS and CMOS each
arrive as a labelled end-of-step reveal per DESIGN.md §6b, never as the hook.

**Cost split:** step 2's $0.0002 becomes $0.0001 for the diode and $0.0001 for the
transistor. Every other delta is unchanged, so the act still ends at $0.0015.

## 3. Step scripts

### Step 1 — Make silicon conduct

Preface: "You will turn refined sand into something that can carry a signal."

1. Focus the lattice. "This is silicon. Every atom holds four bonds, and every bond holds
   two electrons." Label SILICON LATTICE.
2. Focus one atom. "Tap it." The bonds strain and settle. "Nothing came loose."
3. "With no electron free to move, nothing can carry a current. Your goal is to make it
   conduct." (This is the aim card, Rule 7.)
4. The dopant choice, unchanged.
5. **The chosen element gets its own card before any doping happens.** Phosphorus brings
   five outer electrons to four waiting bonds; boron brings three. Label on the specimen.
6. Dope three atoms, as today.
7. Name the carrier on its own card, with it highlighted: FREE ELECTRON, or HOLE drawn as a
   ring. Watch a neighbouring electron hop into the hole so the empty seat itself drifts.
8. Wire the crystal between battery and lamp. Send current.
9. Aha: silicon did not change, you gave it carriers. That is doping.
10. **Conventional current gets two cards, not one paragraph.** First: these blue dots are
    the electrons, the thing physically moving. Second: schematics draw the arrows the
    other way, from + back to −, from a guess made before anyone knew electrons existed.
    Label the chevrons when they appear.
11. The melt-it-down-and-try-the-other-flavour choice, unchanged.

### Step 2 — Where N meets P

Preface: "You have two kinds of silicon. Press them together and something forms at the
seam on its own."

1. Focus the N block. "Spare electrons, free to move." Label N-TYPE.
2. Focus the P block. "Spare holes, also free to move." Label P-TYPE.
3. The player presses them flush. Watched, not cut to.
4. "Electrons near the seam cross and drop into holes. What they leave behind are fixed
   charges that cannot move." Label FIXED IONS on the circled ones.
5. Only now name the region: label DEPLETION LAYER. "No free carriers left in this strip."
6. "It stops on its own. The fixed charges now push back on anything else trying to cross."
7. **The hill is a watched morph from the strip, not a new diagram.** Label BARRIER.
8. Raise the voltage until an electron gets over. Task ends at 0.7 V.
9. "0.7 V is the height of that hill, in volts." Payoff card.
10. Flip the battery. The strip widens and the hill grows. Confirm no voltage helps.
11. Name reveal: a diode. One card.

### Step 3 — A small current controls a big one

Preface: "Two of those junctions back to back give you a switch you can control."

1. Open on the single junction from step 2, labelled FROM LAST STEP. (Rule 4.)
2. Place the three blocks. **Each name lands on its own card as the block goes in:**
   small EMITTER, thin BASE, wide COLLECTOR. The sizes are the lesson, so say why.
3. "Two junctions now, so two barriers. Whichever way you push, one faces the wrong way."
   Device sits OFF.
4. "You already know how to flatten one: about 0.7 V, base to emitter."
5. Predict where the electrons go: out of the base wire, or on to the collector.
6. Release a hundred and watch.
7. "The base is thin next to the other two blocks, so almost every electron overshoots."
8. The base dial: take the LED fully off, then to full brightness.
9. Aha: 10 µA in, 1,000 µA out. Flick it and it is a switch; vary it and it is an amplifier.
10. Reminder card: inside the crystal electrons run opposite to the arrows, as agreed in
    step 1.

### Step 4 — Switch it with voltage, not current

Preface: "Your transistor drinks current the whole time it is on. A billion of them would
melt the chip."

1. **Each layer is named as it is placed**, one card each: two N regions in a block of P,
   the gap between them, the thin glass over the gap, the metal gate that never touches
   the silicon.
2. Push current through. Blocked. "Two junctions, one always facing the wrong way."
3. "Metal, glass, silicon. That is a capacitor." Label the three layers together.
4. **The channel forms over three cards, one per thing that happens:** the field pushes
   holes down, then it pulls electrons up against the glass, then the sheet touches both
   N regions and the path is unbroken.
5. Two tests: fully on, fully off.
6. The question: which device is cheaper to hold on.
7. Name reveal: NMOS, N-channel, switched on by a high gate.

**3D plate:** this is the step where a generated plate earns its place, showing the gate
wrapping the fin. Prompt recipe in `ASSET_PROMPTS.md`, accuracy variant required.

### Step 5 — Why a billion switches do not melt

Preface: "One NMOS leaks. Whenever it is on, current runs from the supply straight to
ground and keeps running."

1. Show the leak on the meter, with the NMOS highlighted.
2. Define the twin on its own card: PMOS is the mirror, switched on by a low gate. Label.
3. Place the pair, as today.
4. "One input feeds both gates, so exactly one twin is ever on."
5. Flip the input. Watch the output, then watch the meter.
6. Aha: the battery is connected the whole time, yet the needle only twitches on each flip.
7. Closing card back to step 3: your transistor drank current the whole time it was on.
   This one pays only when it changes.

## 4. Write every card with the humanizer

**Invoke the `humanizer` skill before writing any player-facing copy**, and run every card,
label, button and note through it. Watch for: em dashes, rule-of-three lists, "not just X
but Y", manufactured punchlines, inflated significance, signposting like "let's look at".
Short sentences, concrete nouns, real numbers instead of adjectives.

This act has form here. The V3 depletion copy once read "watch the wall itself, find the
exact push where it gives way", and the note back was "just explain that the electrons need
energy to cross this barrier". That is the bar. Read each card back; if it sounds like a
narrator rather than someone explaining a machine, write the plain version.

Ripu reviews the rendered cards, not the code.

## 5. What does not change

- The physics rules in DESIGN.md §4 are non-negotiable and this act is where they bite
  hardest: bond electrons in pairs, holes as vacancy rings, conventional-current chevrons
  on every wire after step 1, collector wider than emitter, gate framed as a capacitor.
- Colour stays semantic: blue is electrons and N, red is holes and P, amber is cost.
- The `flow.ask` record-and-replay contract, determinism, Back and Restart.
- The act's total cost.

## 6. Build order

1. One agent per step, five agents, each owning one file, none touching the registry.
2. Registry pass afterwards: the 5-entry ACT1 array, the cost split, premises and CTAs
   rewritten to point at the step that actually follows, and the act summary rewritten.
3. **Do not renumber stage numerals in this pass.** Every act is splitting, so numerals
   move repeatedly if each act renumbers itself. One global renumbering pass runs last,
   once every act's final step count is known. See `RENUMBERING.md`.
