# ACT 3 MAKEOVER — micro-learning

Plan to port "From Cell to Chip" to the card contract. Diagnosis is in
`ACT3_WALKTHROUGH.md`. The binding rules are `DESIGN_MAKEOVER.md` §2, and the engine API
they run on is §4. Read `js/acts/act4/step1.js` before writing.

**Act 3 goes from 4 steps to 5**, and step 1 needs a redesign rather than a re-card.

## 1. What has to change

1. **Step 1 is a dexterity test, not a comprehension test.** Chasing a sweet band that
   moves under you is hand-eye work. Failing it teaches nothing about crystal growth, and
   the physics on offer, that atoms freeze onto a seed one layer at a time, is not what the
   interaction exercises.
2. **Step 4 is three jobs in one step:** cut, bond and bin. The first two are physical
   assembly, the third is economics. Split after bonding.
3. **"Flip-chip" is a spatial word a flat drawing cannot show.** The die is turned over onto
   its bumps and the 2D diagram simply cannot say that.
4. **This act has the most real hardware in the course and the least of it on screen.**
   A furnace, a mask, a wafer cassette, a diamond saw. Best candidate in the course for the
   atmosphere plates in `ASSET_PROMPTS.md`.
5. Long paragraphs beside unlabelled diagrams, as everywhere pre-makeover.

## 2. Renames

| old | new |
|---|---|
| Grow the crystal | Grow one perfect crystal |
| Print with light | Print with light |
| The yield game | How big to cut each chip |
| Cut, bond & bin (part 1) | Package the die |
| Cut, bond & bin (part 2) | Same chip, three prices |

"Print with light" already says what it is, so it stays. Czochralski, photolithography,
yield, flip-chip and binning still get taught as labelled reveals.

**Cost split:** step 4's $500 becomes $300 for packaging and $200 for binning. Every other
delta is unchanged, so the act still ends at $14,000.

## 3. Step scripts

### Step 1 — Grow one perfect crystal  (REDESIGN)

Preface: "A chip needs silicon where every atom sits in the right place. This step grows
one crystal from a seed."

**Replace the moving-band chase.** The current game asks the player to track a shifting
target with one continuous control. Make it a small number of decisions with visible
consequences instead:

1. Focus the melt. "Silicon refined to nine nines of purity, molten at 1,414°C. Pure is not
   enough, because every atom still has to land in the right place." Label THE MELT.
2. Focus the seed. "A single perfect crystal, dipped in on a rod." Label SEED CRYSTAL.
3. "Atoms freeze onto the seed one layer at a time, so the crystal is grown rather than
   made." Show one layer landing, watched.
4. **The choice, three discrete pull speeds, each pulled a short way so the player sees the
   result before committing:** too fast leaves the lattice ragged, too slow wastes the melt
   and lets defects nucleate, and one is right. Show the lattice at the ingot's edge for
   each, so the defect is a picture rather than a counter.
5. Pull the full ingot at the chosen speed. If it was wrong, the ingot shows it and the
   player picks again with the evidence in front of them.
6. Slice into wafers, watched.
7. Aha: one ingot yields hundreds of wafers, each holding thousands of the cells built by
   hand in Act 2. Printed, not placed.

The point of the step is that the crystal is grown atom by atom and that speed decides
quality. Neither needs a moving target.

### Step 2 — Print with light

Preface: "You cannot place a billion transistors by hand. A fab does not place them, it
photographs them."

1. Define the resist layer, then the mask, then the light, one card each with each labelled
   as it is named.
2. "Five steps build every layer, and they only work in one order." State the aim.
3. The ordering interaction, unchanged.
4. Payoff card: coat, expose, develop, etch, dope. Then the resist strips and the loop runs
   again for the next layer, dozens of times over.
5. Mask alignment. Define the via on its own card before the player is asked to line
   anything up.
6. The nudge interaction, unchanged. The vias light when contact is exact.
7. Scale card, numbers only: 13.5 nm light, struck from droplets of exploded tin 50,000
   times a second, ten billion features in one flash.

### Step 3 — How big to cut each chip

Preface: "Every wafer picks up dust. This step decides how big to cut each chip, knowing
that."

1. Define the wafer: the full disc you have been printing on. Label.
2. Define the die: one single chip, once the disc is carved into a grid. Label.
3. "Any die a speck of dust touches is dead." Show one, highlighted.
4. The first wafer and the size choice, unchanged. Target cost per good die.
5. **The trade-off gets its own card with the geometry on screen:** double a die's edge and
   its area quadruples, so a single speck kills four times as much silicon.
6. The dirtier wafer, unchanged. The player has to re-check rather than assume.
7. Aha: this is why chips are small, why a huge die costs a fortune, and why one wafer's
   dies sell as three different products.

### Step 4 — Package the die

Preface: "A bare die cannot do anything yet. It has to be cut free, wired out, and sealed."

1. Dice the wafer with the diamond saw, watched. Good dies fall into a tray, dead ones are
   swept out before another cent is spent on them.
2. Define the substrate on its own card: the little board that routes signals out to pins.
   Label.
3. Define the solder bumps, and say the die goes on face down. Label BUMPS.
4. The bonding interaction, unchanged.
5. Define the heat spreader before it drops: a metal lid that seals the die in and carries
   its heat out to a cooler. Label.
6. Closing card: what was sand is now a packaged chip.

**3D plate:** "flip" is the whole word here and the flat view cannot carry it. Logged in
`ASSET_3D_CANDIDATES.md`.

### Step 5 — Same chip, three prices

Preface: "Same wafer, same design, but the chips are not identical. This step sorts them."

1. "Tiny variations make some chips switch faster than others." One card, with two dies
   highlighted side by side.
2. Define the speed test and what it measures. Label.
3. Run chips through the test and sort them into bins, unchanged.
4. Aha: three price tags off one wafer. The fast ones go to buyers paying a premium for
   every clock cycle; the slow ones still sell.

## 4. Write every card with the humanizer

**Invoke the `humanizer` skill before writing any player-facing copy**, and run every card,
label, button and note through it. Watch for: em dashes, rule-of-three lists, "not just X
but Y", manufactured punchlines, inflated significance, signposting like "let's look at".
Short sentences, concrete nouns, real numbers instead of adjectives.

This act's copy leans on drama more than the others, with lines like "a fast, precise,
deliberately violent cut" and "the cleanroom had a rough shift". The facts underneath are
good and the adjectives are doing nothing. Keep the numbers, cut the theatre.

Ripu reviews the rendered cards, not the code.

## 5. What does not change

- The two-wafer structure of the yield step, including its targets. Being made to re-check
  an answer against new numbers is the point.
- The `flow.ask` record-and-replay contract, determinism, Back and Restart.
- Colour semantics per DESIGN.md §4, including red for a dead die.
- The act's total cost.

## 6. Build order

1. Step 1 first and on its own, because it is a redesign. Get it reviewed before the rest.
2. Then one agent per remaining step, four agents, each owning one file.
3. Registry pass afterwards: the 5-entry ACT3 array, the cost split, premises and CTAs,
   and the act summary.
4. **Do not renumber stage numerals in this pass.** One global renumbering pass runs last,
   once every act's final step count is known. See `RENUMBERING.md`.
