# Act 4 walkthrough: The GPU

**Reviewed by Ripu 2026-08-08. Superseded by `DESIGN_MAKEOVER.md`, which holds the
redesign. This file stays as the as-is record of what he reviewed.**

What the act currently does, beat by beat, so it can be reviewed and changed.
Steps 13 to 17 of 21. Cost runs $14K to $2.43M.

## The aim

Act 2 built one general machine that does any operation, one at a time. Act 4 rebuilds it
into a machine that does **one** arithmetic move, on long lists, thousands of copies at once.

The whole act turns on a single sentence: **multiply two numbers, add the result onto a
running total.** Every step is either building that move, copying it, or feeding it.

## What the player walks out knowing

1. For math on lists, many simple workers beat one fast worker.
2. A multiplier's area is the product of its two bit-widths, so precision is expensive.
3. Moving numbers costs more than computing with them.
4. Performance is capped by whichever is smaller, compute or memory bandwidth.

---

## Step 1 of 5: The marching band

**Starts from:** the Act 2 datapath. One worker, one operation per tick.

**Graphic:** two rows of eight numbers with an empty sum row underneath, and a race track
with two progress bars.

**What the player does:** predicts how many ticks each approach needs. Then clicks the clock
eight times to walk the single worker down the list, then fires all eight workers at once and
the whole row lands in one beat.

**Then:** the bench clears and sixteen lanes get stamped into a 4 by 4 grid. An ADD chip
slides along a rail above them and every lane fires together, each on its own pair of numbers.

**Understand what:** that the win comes from copies, not from speed. And the bargain behind
it: a lane gives up choosing what to do, and in exchange sixteen fit where one processor did.
Same instruction, same tick, different data.

**CHANGE (Ripu, 2026-08-08):** the step never says what a lane is. A lane is the Act 2
datapath, copied, with the instruction-choosing stripped out. The chain is: gates (Act 2) →
lane → 16 lanes = compute block → compute die (step 5) → GPU. The redesigned step must open
with the Act 2 machine's drawing and an arrow into the lane box before the word "lane"
appears. Full fix in `DESIGN_MAKEOVER.md` §5 step 1.

---

## Step 2 of 5: The multiply engine

**Starts from:** 7 x 7. The player already knows the answer is 49, so the step is about *how*
a chip gets there. (7 is 111 in binary, so every bit in the grid is a real 1 and the pile
honestly counts.)

**Graphic, in four stages:**

- A grid of AND gates. The player first picks which Act 2 gate multiplies one bit by one bit.
- A dot board where every 1 drops into a column by its place value. A column three dots tall
  means three 1s to add in that place.
- The same board again, with the accumulator 15 dropped in on top.
- A precision square, a p by q grid the player can resize.

**What the player does:** taps bits to build each partial product row. Counts the pile to 49,
adds 15 to reach 64. Then taps columns to crush three dots into two using the Act 2 full
adder, until no column has three left. Hands the last two rows to the Act 2 ripple adder,
which prints 1000000. Then answers what happens to area when precision halves.

**Understand what:** that multiply is not a primitive. It is ANDs, a pile sorted by place
value, a crush, and one addition. Then the fact the rest of the industry runs on: halve the
bit-width and both sides of the grid halve, so the engine gets four times smaller. That is
why AI chips moved to 8-bit and then 4-bit.

**Note:** this is the densest step in the course. Five mechanisms in one sitting.

---

## Step 3 of 5: The stationary trick

Two separate stages.

### 3a, the register file

**Graphic:** eight shelves of storage beside the engine, with a mux built only from AND and
OR gates.

**What the player does:** taps a select tab. Every shelf that was not picked gets ANDed with
0 and fades to nothing, the chosen shelf survives, and an OR funnel collapses eight rows into
one. Task is to read shelf R3.

**Understand what:** fetching the numbers takes roughly 180 gates. Computing with them takes
30 to 40. Five gates of delivery for every gate of math, paid on every operation.

### 3b, the systolic array

**Graphic:** a 2 by 2 grid of engines, each with a shelf for a parked weight.

**What the player does:** drags weight tiles onto the top of each column and they trickle
down one shelf per beat. Then pulses the vector [3, 7] down through them and reads 21 and 17
falling out the bottom.

**Understand what:** in AI, one of the two numbers stays the same for millions of ticks, so
stop fetching it. Park it. Then only fresh data crosses the expensive border. Four engines
running on two values of traffic. At 128 by 128 it is 16,384 multiplies per tick for 256
values in and out, because compute grows with the area and traffic only with the edge.

---

## Step 4 of 5: Feed the beast

**Starts from:** the same law, one level up. Register file to engine cost a mux. Memory to
chip costs wires and watts.

**Graphic:** a balance beam. Left pan is how many lanes are hungry, right pan is how many
HBM stacks feed them. Each lane has a lamp: blue when fed, amber when starving.

**What the player does:** two fixes with sliders. First a starved rig, too many lanes and too
little memory, pulled up to 90% utilization or better. Then the opposite problem, a rig
paying for memory the lanes will never ask for, brought back down without starving.

**Understand what:** performance is capped by the smaller side, no matter how good the other
one is. Half of GPU design is plumbing rather than computing. This is deliberately the same
shape as the power and network problems in Act 5.

---

## Step 5 of 5: Assemble the NV-1

Two stages.

### 5a, the package

**Graphic:** an interposer, the silicon shelf that carries the compute die and the memory
side by side over the shortest possible distance.

**What the player does:** places the compute die and one HBM stack on each side of it. A CPU
tile sits in the tray as the wrong answer. Then drops a cooler on top and reads about 700
watts.

**Understand what:** memory has to be physically close, on both flanks, and the heat is not a
design flaw. One switch flipping was too small to measure in Act 1. Billions of them per
second on a five-inch square is a furnace, and that is the honest price of this much math.

### 5b, the training loop

**Graphic:** data streaming into the lane grid, with a loss number falling on each pass.

**Understand what:** that learning is the same lanes from step 1, grinding. Data in, lanes
chew, weights nudge, loss drops.

---

## Where the act likely loses people

Five steps, but nine stages. Step 2 alone carries the AND grid, the place-value pile, the
compression game, the ripple adder handoff and the precision square. Step 3 is two full
lessons wearing one number. Step 5 is a build plus a training loop.

If Act 4 is not landing, splitting is probably the fix rather than rewording.
