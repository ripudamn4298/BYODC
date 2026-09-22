# Act 1 — rephrasing and flow changes (PROPOSAL, nothing applied)

Written 2026-09-22 against the live Act 1 copy. Tags are the buckets in
`AI_Writing_made_readable.md`: **DP** dramatic phrasing · **AC** absent conjunction ·
**SD** synonym drift · **MG** missing gloss · **CA** colloquial ambiguity · **MC**
mechanism compression · **LF** literal framing. Flow tags **F1–F5** are in Part 2.

Only changed lines are listed. Everything not listed stays as it is. Venture cards are
out of scope (different register, rewritten separately in the structural pass).

Two findings that run across the whole act, worth reading first:

- **"Dope" is never defined.** It is used in step 1 ("a doped crystal cannot be
  re-doped"), step 2 ("you doped silicon two ways"), step 4 ("dope a patch at each end")
  and it never gets its bracket. The first real chance is step 1's element choice.
- **The N–P join has three names.** "Seam" (six times across steps 2 and 3), "junction"
  (defined nowhere, used in step 3's opener) and "depletion layer" (defined in step 2).
  Proposal: define **junction** once as "the line where N meets P", use **depletion
  layer** for the carrier-free strip once it is named, and retire "seam" and "strip".

---

# PART 1 — writing changes (sentence level)

## Step 1 · Make silicon conduct

| OLD | NEW | tags |
|---|---|---|
| This is silicon, refined from sand. By the end of this step it will carry a current. | This is a zoomed-in silicon crystal lattice, refined from sand. By the end of this step, you will learn how to drive a current through it. | LF, DP |
| Each bond is a pair of electrons, one given by each atom. Both sit in the bond and stay there. | Each bond is a pair of electrons, one contributed by each atom. Both electrons stay locked in the bond. | CA |
| The bond electrons strained and settled back where they started. Nothing came loose. | When you tapped it, the bond electrons wobbled and settled back where they were. None of them came loose. | AC |
| With every electron locked in a bond, nothing can move, so nothing can carry a current. **Your goal: make it conduct.** | Because every electron is locked in a bond, nothing can move, so nothing can carry a current. **Your goal is to make it conduct electricity.** | AC, DP |
| To do that, swap a few of the silicon atoms for a different element. Pick one: | To do that, we dope the crystal (swap a few silicon atoms for a different element, such as phosphorus or boron, which bring extra electrons or holes). Pick one: | MG |
| A fresh crystal, every bond full again. Same move, the other element: | Here is a fresh crystal, with every bond full again. Now dope it with the other element: | DP |
| Four of the five electrons took the four bonds. The fifth has no bond to sit in, so it roams. That loose electron is a free electron. | Phosphorus has five outer electrons. Four of them fill the four bonds, but the fifth has no bond to sit in, so it is free to move. This loose electron is called a free electron. | MG, AC |
| Three bonds filled, and the fourth came up one electron short. That empty seat is drawn as a red ring, and it is called a hole. | Boron has only three outer electrons, so three bonds are filled and the fourth is one electron short. This missing electron is drawn as a red ring and is called a hole. | MG, AC |
| An electron from a neighbouring bond keeps hopping into the ring. The bond it came from is the empty seat now, so the hole itself moves. | When an electron from a neighbouring bond hops into the hole, the bond it came from becomes the new hole. So the hole itself appears to move. | AC, SD |
| The wires meet the crystal on its left and right faces. Any current has to pass through the silicon to reach the lamp. | The wires connect to the left and right faces of the crystal, so any current has to pass through the silicon to reach the lamp. | AC |
| Schematics draw the arrows the other way: out of + and back into −. The direction was guessed before anyone knew electrons existed, and it stuck. | **Card A:** Electric current was discovered before electrons were. At the time, people drew current flowing from + to −. **Card B:** We now know current is electrons flowing from − to +. The drawing convention never changed, and honestly it does not matter, as long as we are consistent. | MC (split into two cards to stay inside the 30-word budget) |
| Every circuit after this one shows those arrows, like every real schematic. When it matters, we will remind you that the electrons run the other way. | Every circuit from here on uses those + to − arrows, because that is how every real schematic is drawn. When it matters, we will remind you that the electrons actually run the other way. | AC |
| The arrows are conventional current, as agreed on the first crystal. The electrons underneath run the other way. | These arrows show conventional current, from + to −, the convention we agreed on with the first crystal. The electrons underneath still run the other way. | MG |
| You need both kinds of silicon later in this act. A doped crystal cannot be re-doped with the opposite element, so chipmakers grow a fresh one. | You will need both kinds of silicon later in this act. Because a doped crystal cannot be re-doped with the opposite element, chipmakers grow a fresh crystal instead. | AC |
| *(button)* Melt it down, run the other element ↺ | Melt it down and dope with the other element ↺ | DP |

## Step 2 · Where N meets P

| OLD | NEW | tags |
|---|---|---|
| In step 1 you doped silicon two ways. Here is a block of each. **Your goal: press them together and find the voltage that pushes current across.** | In step 1 you doped silicon two ways. Here is one block of each. **Your goal is to press them together and find the voltage that pushes a current across the join.** | DP |
| This block got phosphorus. Each phosphorus atom left one spare electron that no bond holds, so it drifts freely. | This block was doped with phosphorus, so each phosphorus atom contributed one spare electron that no bond holds. These free electrons drift around the block. | AC |
| This one got boron. Each boron atom left a bond one electron short. That empty seat is a hole, drawn as a ring, and it drifts too. | This one was doped with boron, so each boron atom left one bond an electron short. Each of those is a hole, drawn as a ring, and the holes drift too. | AC, SD |
| Press them flush. Drag the N block onto the dashed outline, or tap the block and then the outline. | Press the two blocks together: drag the N block onto the dashed outline, or tap the block and then the outline. | CA |
| No battery yet. Watch what the carriers next to the seam do on their own. *(label: the seam)* | There is no battery yet. Watch what the carriers (the free electrons and holes) next to the junction do on their own. *(label: the junction, where N meets P)* | MG, SD |
| The nearest electrons crossed and filled the nearest holes. Each one left a charged atom behind, locked in the crystal, unable to move. | The electrons nearest the junction crossed over and filled the nearest holes. Each one left behind a charged atom that is locked in the crystal and cannot move. | AC |
| The strip they left has no free electrons and no free holes in it. That strip is the depletion layer. | The region around the junction now has no free electrons and no free holes. This region is called the depletion layer (a layer depleted of carriers). | MG |
| It stopped on its own. The P side is now slightly negative and the N side slightly positive, and that pushes the next electron back. | The crossing stopped on its own, because the P side is now slightly negative and the N side slightly positive, and that pushes the next electron back. | AC, DP |
| Same push, drawn as height. An electron has to climb this hill to get across the seam. Watch it slide back. | Here is that same push, drawn as a hill. An electron has to climb this hill to get across the depletion layer. Watch it slide back down. | DP, SD |
| A battery now sits across the junction, wired to push carriers toward the seam. The lamp shows whether anything gets through. | Now a battery is wired across the junction so that it pushes the carriers toward the depletion layer. The lamp shows whether any current gets through. | AC, SD |
| **Your goal: raise the voltage until current flows.** Every step up takes height off the hill. | **Your goal is to raise the voltage until current flows.** Each step up in voltage lowers the hill. | DP |
| 0.7 V is the height of that hill, measured in volts. Below it the electron slid back every time. | The hill is 0.7 V tall. Below that voltage the electron slid back every time; above it, current flows. | DP |
| Turn the battery around and it pulls carriers away from the seam instead of pushing them toward it. | If you turn the battery around, the carriers (electrons and holes) get pulled away from the depletion layer instead of being pushed toward it. | AC, SD, MG |
| **Your goal: turn the voltage all the way up and confirm nothing flows.** Watch the strip and the hill as you go. | **Your goal is to turn the voltage all the way up and confirm that nothing flows.** Watch the depletion layer and the hill as you go. | DP, SD |
| The strip got wider and the hill got taller. No voltage in this direction gets an electron across. | The depletion layer got wider and the hill got taller. In this direction, no voltage gets an electron across. | SD |
| *(aha)* You built a diode. It passes current one way and blocks the other. | You have built a diode: a one-way street for current. It passes current in one direction and blocks it in the other. | F5 |

## Step 3 · A small current controls a big one

| OLD | NEW | tags |
|---|---|---|
| This is the junction you built last step: N against P, with a depletion layer at the seam. Current only crosses it above about 0.7 V. | This is the junction you built last step: N against P, with a depletion layer between them. Current only crosses it above about 0.7 V. | SD |
| Two of those junctions back to back give you a switch you can control. That takes three blocks: N, then a thin P, then N. | If you put two of these junctions back to back, you get a switch you can control. That takes three blocks: N, then a thin P, then N. | AC |
| The emitter is where the electrons come from. It is the small block, because all it does is push them into the one next door. | The emitter is the block that emits (sends out) the electrons. It is small because its only job is to push electrons into the block next to it. | MG |
| The base is the thin P block that goes in the middle. Every electron the emitter sends has to cross it. | The base is the thin P block in the middle. Every electron the emitter sends out has to cross it. | DP |
| The collector catches the electrons that make it across. It is wide because it carries the whole current, and current makes heat. | The collector collects the electrons that make it across. It is wide because it carries the whole current, and a large current produces heat. | MG |
| Each seam builds its own barrier, the same way the single junction did. Two junctions, so two barriers, facing opposite ways. | Each junction builds its own depletion layer, just like the single junction did. Because there are two junctions, there are two barriers, facing opposite ways. | SD, AC |
| Now a battery across the device, collector to emitter. One of the two barriers always faces the wrong way, so the LED stays dark. | Now we connect a battery across the device, from collector to emitter. Because one of the two barriers always faces the wrong way, the LED stays dark. | DP, AC |
| It leans on the left barrier only. That barrier narrows, and electrons start crossing from the emitter into the base. | This voltage acts on the left barrier only. When that barrier narrows, electrons start crossing from the emitter into the base. | CA, AC |
| Swap the fixed battery for a dial. It sets how much current you push into the base. | Now we swap the fixed battery for a dial, which sets how much current you push into the base. | AC |
| **Your goal: switch the big current with the small one.** Turn the dial to zero and take the LED fully off. | **Your goal is to switch the large current using the small one.** First, turn the dial to zero and switch the LED fully off. | DP |
| *(aha)* 10 µA in, 1,000 µA out. The base current holds the emitter-side barrier down, and the device passes a hundred times what you spend on it. | 10 µA in, 1,000 µA out. The small base current keeps the emitter-side barrier lowered, so the device passes a hundred times more current than you put in. | CA, AC |
| Inside the crystal the electrons run from emitter to collector. The chevrons on the wires point the other way: they show conventional current, as agreed in step 1. | Inside the crystal the electrons run from emitter to collector. The arrows on the wires point the other way, because they show conventional current, as agreed in step 1. | MG, AC |

## Step 4 · Switch it with voltage, not current

| OLD | NEW | tags |
|---|---|---|
| Here is last step's transistor, switched on. Holding it on is not free. | Here is last step's transistor, switched on. Keeping it on costs a constant current. | DP |
| About 10 µA keeps running into the base for as long as the switch stays on. Put a billion of these on one chip and the heat melts it. | About 10 µA keeps flowing into the base for as long as the switch stays on. If you put a billion of these on one chip, the heat would melt it. | AC |
| So control the switch with a voltage instead. Nothing has to keep flowing. **Your goal: build it one layer at a time, then find the voltage that turns it on.** | So instead, we will control the switch with a voltage, so that nothing has to keep flowing. **Your goal is to build this new switch one layer at a time, then find the voltage that turns it on.** | DP, AC |
| Start with a block of P-type silicon. It is full of holes, and there is not one spare electron anywhere in it. | Start with a block of P-type silicon. It is full of holes and has no spare electrons anywhere. | DP |
| Now dope a patch at each end into N silicon. Each one is packed with spare electrons. Drag them in. | Now dope a patch at each end into N-type silicon, so that each patch is packed with spare electrons. Drag them in. | AC |
| Between them sits a strip of P silicon with no spare electrons in it. Nothing crosses this gap. Closing it on demand is the whole job. | Between the two patches is a strip of P silicon with no spare electrons, so nothing can cross this gap. Our whole job is to close this gap on demand. | AC, DP |
| Now the metal pad, on top of the glass this time. It sits directly over the gap and never touches the silicon. This pad is the gate. | Now place the metal pad on top of the glass. It sits directly over the gap and never touches the silicon. This pad is called the gate. | DP, MG |
| The hatched bands are depletion layers, the same barrier you built in step 2. There are two junctions in here, so there are two of them. | The hatched bands are depletion layers, the same barriers you built in step 2. Because there are two junctions here, there are two of them. | AC |
| Wire a battery across them, plus at the drain and minus at the source. Then push current through. | Now wire a battery across them, with plus at the drain and minus at the source, and try to push a current through. | AC |
| Blocked, for the reason you already know. Two junctions, and one of them always faces the wrong way. | The current is blocked, for the reason you already know: there are two junctions, and one of them always faces the wrong way. | DP, AC |
| Metal, then glass, then silicon. Those three layers are a capacitor: two plates with an insulator between them. | Metal, then glass, then silicon: these three layers form a capacitor (two conducting plates with an insulator between them). | MG |
| Charging the top plate costs no current, because the glass is in the way. What reaches the silicon below is the plate's electric field. | Charging the top plate costs no steady current, because the glass blocks any flow. What does reach the silicon below is the plate's electric field. | CA |
| Put a small voltage on the gate. A positive plate pushes the holes underneath it straight down, away from the glass. | If you put a small positive voltage on the gate, the positive plate pushes the holes underneath it downward, away from the glass. | AC |
| Keep going. The same field pulls electrons up out of the silicon and holds them against the underside of the glass. | If you keep going, the same field pulls electrons up out of the silicon and holds them against the underside of the glass. | AC |
| A little more, and that sheet of electrons reaches both N regions. Source to drain becomes one unbroken path. | With a little more voltage, that sheet of electrons reaches both N regions, and the source and drain become one unbroken path. | AC |
| *(aha)* The lamp is lit. Current runs from drain to source through a sheet of electrons that only exists while the gate is held up. | The lamp is lit. Current runs from drain to source through a sheet of electrons that only exists while the gate voltage is held high. | CA |
| The slider is yours now. Push the gate higher and the sheet gets denser, so more current flows. **Your goal: take it fully on, above 2.6 V.** | The slider is yours now. If you push the gate voltage higher, the sheet gets denser and more current flows. **Your goal is to switch it fully on, above 2.6 V.** | AC, DP |
| Now bring it back down. The sheet breaks the moment the gate drops below 1.2 V. **Your goal: take it fully off, below 0.3 V.** | Now bring it back down. The sheet breaks the moment the gate voltage drops below 1.2 V. **Your goal is to switch it fully off, below 0.3 V.** | DP |
| *(aha)* ...The transistor has to keep drinking base current the entire time it is on. | ...The NPN transistor has to keep consuming base current the entire time it is on. | CA |
| *(wrong-answer note)* Other way around. The transistor keeps drinking base current while it is on. ... | Other way around. The NPN transistor keeps consuming base current while it is on. ... | CA |
| The three layers you stacked give the device its name: metal, oxide, semiconductor. Oxide is the glass. It is called a MOSFET. | The three layers you stacked give the device its name: metal, oxide, semiconductor. Oxide is the glass. It is called a MOSFET (metal-oxide-semiconductor field-effect transistor). | MG |
| Yours is an NMOS. A high gate fills the channel with electrons, and electrons are the N. Drop the gate and the channel empties. | Yours is an NMOS. A high gate voltage fills the channel with electrons (the N in NMOS). If you drop the gate voltage, the channel empties. | AC, MG |

## Step 5 · Why a billion switches do not melt

| OLD | NEW | tags |
|---|---|---|
| One NMOS leaks. While its gate is high, current runs from the supply straight to ground and keeps running. Watch it happen, then fix it. | One NMOS on its own leaks. While its gate is high, current runs from the supply straight to ground and keeps running. First watch it happen, then fix it. | DP |
| This meter sits in the supply wire, so everything the battery pushes out passes through it. Nothing is moving yet, and the needle sits at rest. | This meter sits in the supply wire, so everything the battery pushes out passes through it. Nothing is moving yet, so the needle sits at rest. | AC |
| One wire feeds the gate. Set it high and the switch conducts. | One wire feeds the gate. If you set it high, the switch conducts. | AC |
| One switch drawing this much is nothing. A billion of them holding at once would cook the chip. **Your goal: hold a value and draw nothing.** | One switch drawing this much is nothing. But a billion of them holding at once would cook the chip. **Your goal is to hold a value (a 0 or a 1) while drawing no current.** | DP, MG |
| Here is a PMOS. Same switch built the other way round: a low gate turns it on, a high gate turns it off. | Here is a PMOS: the same switch built the other way round, so a low gate turns it on and a high gate turns it off. | AC, DP |
| Two slots now. The top one joins the output to power, the bottom one joins it to ground. One twin goes in each. | There are two slots now. The top one joins the output to power, and the bottom one joins it to ground. One of the two switches goes in each. | DP, SD |
| **Your goal: fill both slots** so that an input of 0 leaves the output connected up to power. | **Your goal is to fill both slots** so that an input of 0 connects the output up to power. | DP |
| Wired. The input on the left runs to both gates at once, so both twins always read the same signal. | It is wired. The input on the left runs to both gates at once, so both switches always read the same signal. | DP, SD |
| Input 0 gave output 1. Input 1 gave output 0. The output is always the opposite of the input, so this pair is an inverter. | Input 0 gave output 1. Input 1 gave output 0. The output is always the opposite of the input, so this pair is called an inverter (it inverts the input). | MG |
| *(aha)* ...Between flips one twin is off, so there is no path from power to ground. | ...Between flips, one of the two switches is always off, so there is no path from power to ground. | SD |
| *(note)* Your transistor in step 3 drank current the whole time it was on. This pair pays only when it changes. | Your NPN transistor from step 3 consumed current the whole time it was on. This pair only consumes current at the moment it changes. | CA, F5 |

*"Twin" is used in step 5 (and in the step 4 premise) for the PMOS without ever being
introduced as a term. Either define it once when the PMOS appears ("its twin, built
the other way round") or say "the two switches", as above.*

---

# PART 2 — flow changes (editorial, for approval)

These change what a transition is *for*. Each is tagged with the flow bucket.

## Step titles (F3)

| now | proposed |
|---|---|
| Make silicon conduct | How do you make sand conduct electricity? |
| Where N meets P | What happens where N meets P? |
| A small current controls a big one | **What's wrong with using copper wires?** *(your title)* |
| Switch it with voltage, not current | Can a switch stay on without spending any current? |
| Why a billion switches do not melt | Why don't a billion switches melt? |

## Transition 1 → 2 (F4, MC)

Now: *"You have both kinds of doped silicon. Nothing useful happens until they touch.
Press them together and a barrier builds itself at the seam, one you can raise and
lower with a voltage."* — the whole diode mechanism in one line, before the step that
teaches it.

Proposed: **"Silicon now conducts. But so does a copper wire, so what have we gained?
The answer starts on the line where an N block meets a P block."** CTA stays *Press N
against P ▸*.

## Transition 2 → 3 (F1, F4) — the one you flagged as criminal underselling

Now: *"A diode passes current one way and blocks the other. Put two of those junctions
back to back and the block in the middle becomes a control: a small current there
decides whether a much larger one flows."*

Proposed premise (significance, not mechanism): **"A diode is a one-way street, and
that is still just a passive pipe. The next device is the one that put a microphone,
a motor and a radio in every pocket: a single part that lets a tiny signal command a
massive current."** CTA: *Take control of the current ▸*.

Then step 3 **opens on three story boxes** (the dark box, `guide.story`), which are
your copper-wire paragraph split to the card budget:

1. "A copper wire is great: it conducts. But it is dumb. It lets electricity flow
   anywhere, any time."
2. "Your diode was the first step toward control: a one-way street. Impressive, but
   still a passive pipe."
3. "Semiconductors changed the world because they let us command electricity on the
   fly. Today you will build an NPN transistor and use a tiny signal to switch a
   massive current on, off, or up. A wire could never do that."

The existing recap card ("This is the junction you built last step...") follows.

## Transition 3 → 4 (F2, CA, MC)

Now: *"Your transistor drinks control current the whole time it is on. That is fine for
hundreds of them and impossible for billions. The fix is a switch held on by a voltage
instead of a current."* — reveals the answer.

Proposed: **"Your transistor can now control a large current. The catch is that it
consumes a small current the whole time it is on, just to stay on. That is acceptable
for hundreds of transistors and impossible for billions. Wouldn't it be better if we
could hold it on without any current at all?"** CTA: *Find a better switch ▸* (the
current CTA, *Switch it with voltage ▸*, gives away the answer).

## Transition 4 → 5 (F2, MC)

Now: *"A single MOSFET still leaks while it is on, because its path to ground stays
open. Pair it with its mirror twin so exactly one of them is always off, and the leak
nearly disappears."* — again the mechanism and the fix, before the step.

Proposed: **"Your new switch costs nothing to hold on. But watch the meter: while it is
on, current still runs straight from the supply to ground, and keeps running. One
switch is nothing. A billion would cook the chip. Can a switch hold a value and draw
nothing?"** CTA stays *Stop the leak ▸*.

## Act 1 debrief (light touch)

The debrief recaps every mechanism in two lines ("Doping gave silicon carriers.
Pressing N against P built a barrier you could raise..."). Recap is the one place
compression is acceptable, so no rewrite proposed, only the same word fixes as above
(consumes, not drinks; depletion layer, not seam) if any of those words appear.

---

# What is NOT changed, and why

- **Venture cards, revenue lines, CTAs other than the two above.** Different register
  (the Nanovolt fiction), rewritten in the structural pass; not teaching copy.
- **Focus labels** except *the seam → the junction*. They are two-word pointers and
  the drift rule is the only one that applies to them.
- **Numbers and physics.** Nothing above changes a value or a mechanism. This is a
  reading pass.

# If approved, the order of work

1. Apply Part 1 by hand, step by step, re-verifying each step live (Back, replay, no
   console errors) since a few cards split into two and each new card is a new
   `flow.ask` boundary.
2. Apply Part 2: retitle in `js/steps/act.js`, rewrite the four premises and two CTAs,
   add the three story boxes at the top of step 3.
3. Run both scanners from `humanizer-stack` over the new copy, then you review on
   localhost, then commit.
