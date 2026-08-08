# Act 5 walkthrough: The Data Centre

What the act currently does, beat by beat, so it can be reviewed and changed.
Steps 19 to 22 of 22. Stage numerals 19 to 22. Cost runs $2.43M to $1.10B.

**Not yet ported to card mode.** Every step here still uses the old scrolling panel.

## The aim

One GPU trains a small model. This act buys ten thousand of them and makes them behave as a
single machine, which turns out to be three problems that have nothing to do with
arithmetic: power, cooling and wiring. It closes the course by returning to the globe from
the landing page.

## What the player walks out knowing

1. All-to-all wiring grows as the square of the machine count, so it cannot scale.
2. A hall's real limit is megawatts, and cooling is a tax on every one of them.
3. At ten thousand machines something is always broken, so the network is built assuming it.

---

## Step 1 of 4: From one to a rack

**Starts from:** one GPU. A real training run needs thousands sharing weights thousands of
times a second.

**Graphic, in three stages:** a sled with eight GPU slots and an interconnect spine, then a
rack elevation being filled by stamping that sled, then four GPUs being wired all-to-all.

**What the player does:** fills every slot on the sled to make one node, which draws about
7 kW, roughly a small house, from a box you could carry. Stamps eight nodes up the rack.
Then wires every pair of GPUs directly, discovering that each new GPU has to link to
everyone already there.

**Understand what:** one filled rack draws about 58 kW continuously, more than the street it
sits on. And all-to-all links go as n(n−1)/2, so four GPUs need 6, forty need 780, and
thousands would need millions. Links grow faster than machines.

---

## Step 2 of 4: The megawatt problem

**Starts from:** the Act 1 inverter only drew power at the instant it flipped. Still true,
but a GPU flips about a quadrillion times a second.

**Graphic:** a power ladder splitting a fixed supply three ways, IT load for computing,
cooling to carry the heat back out, and losses.

**What the player does:** chooses between air and liquid cooling and balances the ladder.
Air is simple but weak, so its overhead is large; liquid pumps coolant against the chips and
carries heat far better. The task is to hold 25 MW of IT load under a 30 MW limit at full
tilt.

**Understand what:** cooling is not a detail bolted on afterwards, it is a fraction of the
power budget. This is why data centres cluster next to rivers, dams and cheap grid.

---

## Step 3 of 4: One machine, many rooms

**Starts from:** ten thousand GPUs in different rooms have to behave like one machine.

**Graphic, in two stages:** a leaf-spine fabric with four racks below and two switches
above, then the same hall running leaner during a switch failure.

**What the player does:** wires each rack up to a switch rather than to other racks, so
every rack reaches every other in at most two hops. Then a switch dies mid-job, the training
bar stalls, and the player has to repair the fabric so every rack still reaches every other
through the survivor.

**Understand what:** the job kept training, not because nothing broke, but because the
fabric was built assuming something would. That principle is design for failure.

---

## Step 4 of 4: Light it up

**Starts from:** everything built so far, assembling into one site.

**Graphic, in two stages:** a campus with two halls of racks, a substation stepping grid
power down, a cooling plant carrying heat out, and fibre to the backbone. Then the rotating
globe from the landing page.

**What the player does:** watches the campus assemble, then picks a site, which decides its
power, its climate for cooling and its distance to the fibre backbone. Then zooms out to the
globe, where every amber dot is a data centre and every blue thread a cable, and finds the
one that is pulsing.

**Understand what:** the closing line ties the whole course into one sentence. Somewhere in
that hall is a chip, in that chip a transistor, and in that transistor an atom the player
placed by hand in Act 1.

---

## Where the act likely loses people

**Step 1 is three stages and ends on a formula.** Node, then rack, then all-to-all wiring
with n(n−1)/2 arriving at the end. The wiring lesson is a different idea from the assembly
lesson and probably wants to be its own step, the same split Act 4 just went through.

**The rack elevation is drawn flat.** A rack is a deep box with cabling front and back, and
an elevation is a convention the player has no reason to know. The landing frames already
contain a hand-drawn 1U server that could be reused rather than generated.

**Step 2 is the cleanest step in the act.** One idea, one control, one task.

**The globe finale depends on the landing.** The payoff line assumes the player saw the
globe on the first screen, but the landing now opens on the hand-drawn frame scrub instead,
and the globe only survives in git history. Worth checking that the callback still lands
for someone who never saw it.

**The cost jump is the largest in the course**, from $2.43M to $1.10B in four steps, and
$1B of that is the final step alone. Whether that reads as a payoff or as an arbitrary
number is worth a look.

**Everything is still scroll mode**, with the same diagnosis as `DESIGN_MAKEOVER.md` §1.
