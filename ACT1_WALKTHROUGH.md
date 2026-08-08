# Act 1 walkthrough: The Physics of a Switch

What the act currently does, beat by beat, so it can be reviewed and changed.
Steps 1 to 4 of 22. Stage numerals 01 to 04. Cost runs $0 to $0.0015.

**Not yet ported to card mode.** Every step here still uses the old scrolling panel, so
the long paragraphs and the unlabelled diagrams that broke Act 4 are all still present.

## The aim

Start from sand and end with the switch every chip is made of. Nothing in this act is
electronics yet. It is four moves on one material: give silicon carriers, press two kinds
together, control the boundary with a voltage, then pair two switches so the pair costs
nothing at rest.

## What the player walks out knowing

1. Pure silicon cannot conduct. Doping gives it carriers, and that is the whole trick.
2. Where N meets P, a barrier builds itself, and about 0.7 V flattens it.
3. A voltage on a gate can pull a conducting path into existence without touching the silicon.
4. A transistor drinks current the whole time it is on. CMOS only pays when it flips.

---

## Step 1 of 4: Build your own P/N semiconductor

**Starts from:** pure silicon, refined from sand.

**Graphic:** a silicon crystal lattice, every atom holding four bonds and every bond
holding a pair of electrons.

**What the player does:** taps an atom and watches the bonds strain and settle, so nothing
comes loose. Then picks a dopant, phosphorus or boron, and clicks three atoms to swap them
in. The spare electron roams, or the missing one leaves a hole that drifts. Then the
crystal gets wired between a battery and a lamp, and the lamp lights.

**Then:** a separate beat swaps the moving blue dots for conventional-current chevrons and
explains that every circuit from here draws current the wrong way round on purpose.

**Understand what:** silicon did not change. You added carriers. The player can also melt
the crystal down and run the other dopant, because both kinds are needed later.

---

## Step 2 of 4: Build your own transistor

**Starts from:** the doped wafer, which conducts. A wire that always conducts is not a
switch.

This step is really two lessons.

### 2a, the diode

**Graphic:** an N block and a P block that the player presses together, then the seam
between them.

**What the player does:** pushes the blocks flush. Electrons cross the seam and drop into
holes, leaving fixed charges that cannot move, and the process stops on its own. The same
barrier is then redrawn as a hill, and the player raises the voltage until an electron can
get over it. Then flips the battery and confirms no voltage helps.

**Understand what:** 0.7 V is the height of that hill. It passes current one way, blocks
the other, and a voltage raises or lowers the barrier. That is a diode.

### 2b, the transistor

**Graphic:** three blocks, N then a thin P then a wide N, dragged into place.

**What the player does:** arranges them at the right sizes, sees the device sit off because
one of the two barriers always faces the wrong way, then predicts where electrons injected
into the base actually go. A hundred are released and watched. Finally a base dial takes an
LED from off to full brightness.

**Understand what:** the base is thin, so almost every electron overshoots into the
collector. 10 µA in controls 1,000 µA out. Flick it and it is a switch; vary it and it is
an amplifier.

---

## Step 3 of 4: Build your own MOSFET

**Starts from:** the transistor drinks base current the entire time it is on. A billion of
those would melt the chip.

**Graphic:** a cross-section. Two N regions in a block of P with a gap between them, a thin
layer of glass over the gap, and a metal gate on top that never touches the silicon.

**What the player does:** places the layers, including getting the glass between the metal
and the silicon. Pushes current through and watches it get blocked by the two junctions.
Then raises the gate voltage slowly: the field pushes holes down, then pulls electrons up
against the glass until a sheet bridges both N regions. Two tests, fully on and fully off.
Then answers which device is cheaper to hold on.

**Understand what:** metal, glass, silicon is a capacitor. Holding a voltage costs no
ongoing current, and that one difference is why billions fit on a chip. What was built is
an NMOS.

---

## Step 4 of 4: Build CMOS, the switch that runs the world

**Starts from:** the NMOS leaks. Whenever it is on, current runs from supply to ground and
keeps running.

**Graphic:** an inverter under construction. Power rail on top, ground at the bottom,
output tapped between them.

**What the player does:** places the NMOS and its mirror twin PMOS in the right order, so
that when the input is 0 the output connects up to power. Both gates are fed by the same
input. Then flips the input and watches the output and, more importantly, the current
meter.

**Understand what:** the battery is connected the whole time, yet the needle only twitches
on each flip. At rest one twin is always off, so there is no path from power to ground.

---

## Where the act likely loses people

**Step 2 is two steps wearing one number.** The diode is a complete lesson with its own
build, its own barrier, its own 0.7 V payoff and its own name reveal. The transistor is
another complete lesson with a different build, a prediction, a hundred-electron
demonstration and a dial test. This is the same structural problem that made Act 4's
"stationary trick" unreadable, and it splits the same way.

**The MOSFET is drawn flat.** A real one is three-dimensional, with the gate wrapping the
fin, and the cross-section quietly teaches the wrong shape. This is already logged as the
strongest candidate for a generated 3D plate in `ASSET_3D_CANDIDATES.md`.

**The lattice is drawn flat too.** Silicon is diamond cubic, and the 2D grid is a
convenience the copy never admits to.

**Everything is still scroll mode.** No card has a highlight, nothing on the stage is
labelled at the moment the copy names it, and the panel accumulates paragraphs. Every
diagnosis in `DESIGN_MAKEOVER.md` §1 applies here unchanged.
