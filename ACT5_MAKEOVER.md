# ACT 5 MAKEOVER — micro-learning

Plan to port "The Data Centre" to the card contract. Diagnosis is in
`ACT5_WALKTHROUGH.md`. The binding rules are `DESIGN_MAKEOVER.md` §2, and the engine API
they run on is §4. Read `js/acts/act4/step1.js` before writing.

**Act 5 goes from 4 steps to 5.** Step 1 currently ends on a formula that belongs to a
different lesson than the one that precedes it.

## 1. What has to change

1. **Step 1 is three stages and ends on n(n−1)/2.** Building a node and filling a rack is
   one lesson. Discovering that all-to-all wiring cannot scale is another, and it is the
   one that sets up the whole rest of the act. Split them.
2. **The rack elevation is drawn flat.** A rack is a deep box with cabling front and back,
   and an elevation is a drafting convention the player has no reason to know. The landing
   frames already hold a hand-drawn 1U server that can be reused rather than generated.
3. **The globe finale depends on a landing that no longer exists.** The closing line says
   "this is the same globe you saw on the very first screen", but the landing is the
   hand-drawn frame scrub now, and the dot globe only survives in git history. The callback
   currently lands on nothing.
4. **The cost jump wants a beat of its own.** $2.43M to $1.10B in four steps, with $1B of
   it in the final step. Right now the number just appears.
5. Long paragraphs beside unlabelled diagrams, as everywhere pre-makeover.

## 2. Renames

| old | new |
|---|---|
| From one to a rack (part 1) | Eight GPUs to a rack |
| From one to a rack (part 2) | Why you cannot wire them all together |
| The megawatt problem | Cooling costs you megawatts |
| One machine, many rooms | Wire it so a failure does not stop it |
| Light it up | Build the site |

Node, rack, all-to-all, leaf-spine, design-for-failure and campus still get taught as
labelled reveals.

**Cost split:** step 1's $400,000 becomes $150,000 for the rack and $250,000 for the
interconnect. Every other delta is unchanged, so the act still ends at $1.10B.

## 3. Step scripts

### Step 1 — Eight GPUs to a rack

Preface: "One GPU trains a small model. This step starts stacking them."

1. Open on the GPU from Act 4, labelled THE GPU YOU BUILT. (Rule 4.)
2. Define the sled on its own card: the tray a box of GPUs is built on, which slides into a
   frame. Label SLED.
3. Define the interconnect spine before the player uses it: the copper backbone that lets
   the eight GPUs on one sled talk without leaving the box. Label.
4. Fill the eight slots. That is one node. Label NODE.
5. Power card: one node draws about 7 kW, roughly a small house, from a box you could carry.
6. Define the rack: the standing frame that holds a stack of nodes. Label.
7. Stamp eight nodes up the frame, watched.
8. Aha: about 58 kW. One filled rack draws more, continuously, than the street it sits on.

### Step 2 — Why you cannot wire them all together

Preface: "The GPUs have to talk to each other constantly. This step is about what that
wiring costs."

1. "Inside a node the GPUs are wired all-to-all, so no message needs a middleman." Label
   the existing links.
2. The wiring interaction, four GPUs, unchanged. Each new GPU has to link to everyone
   already there.
3. Count card: four GPUs, six links. Counted on screen, not asserted.
4. **The growth is shown as numbers side by side, not as a formula dropped in prose:**
   4 GPUs need 6 links, 40 need 780, 4,000 would need about 8 million. Then name the rule,
   n(n−1)/2, once the player has seen it behave.
5. Aha: links grow faster than machines, so all-to-all stops at one box. Everything above
   that box needs a different answer, which is step 4.

### Step 3 — Cooling costs you megawatts

Preface: "A GPU flips about a quadrillion times a second, and there are thousands of them
in this hall."

1. Call back to Act 1: your inverter only drew power at the instant it flipped, and that is
   still true. Show the meter twitch. (Rule 4.)
2. Define the power ladder with each rung labelled as it is named: IT load for computing,
   cooling to carry the heat back out, and losses.
3. Define bandwidth of the supply: the hall is fed by one fixed line.
4. The cooling choice, air against liquid, with the overhead of each shown on the ladder as
   the player switches.
5. The task, unchanged: hold 25 MW of IT load under the 30 MW limit at full tilt.
6. Aha: cooling is not bolted on afterwards, it is a fraction of the power budget. This is
   why data centres sit next to rivers, dams and cheap grid.

### Step 4 — Wire it so a failure does not stop it

Preface: "Ten thousand GPUs in different rooms have to behave like one machine. Step 2
showed you cannot wire them all to each other."

1. Open by pointing back at step 2's link count. (Rule 4, and it makes this step's answer
   feel earned.)
2. Define the switch on its own card: racks never connect to each other, they connect up to
   a switch. Label.
3. Name the shape once it is on screen: leaf-spine. Label.
4. The wiring interaction, unchanged. Every rack reaches every other in at most two hops.
5. Count card: compare the link count here against step 2's all-to-all number for the same
   machine count, on screen. This is where the trade is visible.
6. The failure case: a leaner hall, one uplink per rack. A switch dies, the training bar
   stalls, and the player repairs the fabric.
7. Aha: the job kept training, not because nothing broke, but because the fabric was built
   assuming something would. Name it: design for failure.

### Step 5 — Build the site

Preface: "Everything you have built comes together on one plot of land."

1. Each building is named as it lands, one card each: two halls of racks, a substation
   stepping grid power down, a cooling plant carrying heat back out, fibre to the backbone.
   Each labelled on the plan.
2. **The billion gets a card.** Show the ledger climbing from the atom in Act 1 to this
   site, so the number reads as an accumulation rather than an announcement.
3. The site choice, unchanged: power, climate for cooling, distance to the fibre backbone.
4. Zoom out to the globe.
5. **Fix the callback.** The line "the same globe you saw on the very first screen" is no
   longer true. Either restore a globe beat to the landing, or rewrite the line to stand on
   its own: every amber dot is a data centre, every blue thread a cable, and one of them is
   now yours. Decide this before the step is written, because the copy depends on it.
6. Closing aha, unchanged in substance: somewhere in that hall is a chip, in that chip a
   transistor, and in that transistor an atom you placed by hand in Act 1.

## 4. Write every card with the humanizer

**Invoke the `humanizer` skill before writing any player-facing copy**, and run every card,
label, button and note through it. Watch for: em dashes, rule-of-three lists, "not just X
but Y", manufactured punchlines, inflated significance, signposting like "let's look at".
Short sentences, concrete nouns, real numbers instead of adjectives.

This act closes the course, which is exactly when the writing wants to swell. It should not.
The final aha earns its weight from the fact that the player really did place that atom by
hand twenty-odd steps ago, so it needs no help. Say it once, plainly, and stop.

Ripu reviews the rendered cards, not the code.

## 5. What does not change

- The failure-repair beat in step 4. Watching a job stall and fixing it is the strongest
  interaction in the act.
- The closing line about the atom from Act 1.
- The `flow.ask` record-and-replay contract, determinism, Back and Restart.
- Colour semantics per DESIGN.md §4: amber for power, heat and cost.
- The act's total cost.

## 6. Build order

1. Settle the globe question first, because step 5's copy depends on it.
2. One agent per step, five agents, each owning one file, none touching the registry.
3. Registry pass afterwards: the 5-entry ACT5 array, the cost split, premises and CTAs, and
   the course summary, which is the last screen of the whole course.
4. **Do not renumber stage numerals in this pass.** One global renumbering pass runs last,
   once every act's final step count is known. See `RENUMBERING.md`.
