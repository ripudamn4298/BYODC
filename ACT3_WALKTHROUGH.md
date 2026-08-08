# Act 3 walkthrough: From Cell to Chip

What the act currently does, beat by beat, so it can be reviewed and changed.
Steps 9 to 12 of 22. Stage numerals 09 to 12. Cost runs $0.0105 to $14,000.

**Not yet ported to card mode.** Every step here still uses the old scrolling panel.

## The aim

Acts 1 and 2 built one cell by hand. This act is about making a billion of them at once,
which turns out to be a manufacturing problem rather than a physics one. It is also where
the course first spends real money.

## What the player walks out knowing

1. A chip is not assembled. It is grown, then photographed, layer on layer.
2. Dust decides economics. Die size is a bet against it.
3. The same wafer sells as three different products at three different prices.

---

## Step 1 of 4: Grow the crystal

**Starts from:** sand refined to 99.9999999% pure molten silicon at 1,414°C. Pure is not
enough, because every atom has to land in the right place.

**Graphic:** a Czochralski pull. A seed crystal dipped into the melt and drawn upward while
spinning, with the ingot forming beneath the rod.

**What the player does:** controls one thing, pull speed, and has to keep it inside a sweet
band that shifts as the melt changes temperature. The target is to pull the whole ingot
with three defects or fewer. Then slices the ingot into wafers.

**Understand what:** atoms freeze onto the seed one layer at a time, so the crystal is
grown rather than made. One ingot yields hundreds of wafers, each of which will hold
thousands of the cells built by hand in Act 2.

---

## Step 2 of 4: Print with light

**Starts from:** you cannot place a billion transistors by hand. A fab does not place them,
it photographs them.

**Graphic, in two stages:** the five-step photolithography loop, then a mask alignment rig.

**What the player does:** puts the five steps in the only order that works, coat, expose,
develop, etch, dope. Then nudges a dashed mask until layer two lands exactly on layer one,
and the vias light up when contact is exact.

**Understand what:** the resist strips off and the loop repeats for the next layer, dozens
of times over. The light is 13.5 nm EUV, struck from droplets of exploded tin 50,000 times
a second, and one exposure prints ten billion features.

---

## Step 3 of 4: The yield game

**Starts from:** the wafer is the full disc. Carved into a grid, each single chip is a die.
Even a clean room has dust.

**Graphic:** a wafer yield map. Squares are dies, red dots are dust, and any square a dot
touches is dead.

**What the player does:** chooses how big to cut each die, then reads the cost per good die.
The target is to get under a set figure. Then a dirtier wafer arrives with nearly double the
dust, and the same choice has to be re-checked against new numbers rather than assumed.

**Understand what:** double a die's edge and you lose three quarters of it to a single
speck. This is why chips are small and why a huge die costs a fortune.

---

## Step 4 of 4: Cut, bond & bin

**Starts from:** a bare die cannot do anything. It has to be cut free, wired to the
outside, and sealed.

**Graphic, in three stages:** a diamond saw dicing the wafer, a flip-chip bonding rig with
solder bumps and a substrate, then a speed-binning test bench.

**What the player does:** dices the wafer and watches good dies fall into a tray while
defective ones are swept out. Drags a die onto the substrate's marked slot and drops the
heat-spreader lid on top. Then runs each packaged chip through a speed test and sorts it
into a bin.

**Understand what:** tiny variations make some chips switch faster than others, so the same
wafer and the same design produce three price tags. The fast ones go to buyers paying a
premium for every clock cycle.

---

## Where the act likely loses people

**Step 1 is a skill game, and it is the only one in the course.** Chasing a sweet band that
moves under you is a hand-eye test, not a comprehension test, and failing it teaches
nothing about crystal growth. The physics being taught, that atoms freeze onto a seed one
layer at a time, is not what the interaction actually exercises.

**Step 4 is three jobs in one step,** cut, bond and bin, each with its own stage and its
own payoff. It is the same shape as Act 1 step 2 and the old Act 4 step 3.

**"Flip-chip" is a spatial word the flat drawing cannot show.** The die is flipped over
onto its bumps, and a 2D bonding diagram simply cannot say that. This is logged as a 3D
plate candidate in `ASSET_3D_CANDIDATES.md`.

**This act has the most real hardware in the course** and currently the least of it on
screen: a furnace, a mask, a wafer cassette, a diamond saw. It is the strongest candidate
for the atmosphere plates prototyped in `ASSET_PROMPTS.md`.

**Everything is still scroll mode**, with the same diagnosis as `DESIGN_MAKEOVER.md` §1.
