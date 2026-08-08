# Act 2 walkthrough: From Switches to Logic, Math & Memory

What the act currently does, beat by beat, so it can be reviewed and changed.
Steps 5 to 8 of 22. Stage numerals 05 to 08. Cost runs $0.0015 to $0.0105.

**Not yet ported to card mode.** Every step here still uses the old scrolling panel.

## The aim

Turn a switch into a machine. Act 1 ended with one CMOS inverter. This act stacks four
ideas on it: a gate that decides, a circuit that adds, a circuit that remembers, and a
clock that makes the three of them run as a loop.

## What the player walks out knowing

1. Two switches wired the right way make a gate that weighs two inputs.
2. Addition is columns and carries, and one column is a fixed circuit you can stamp.
3. A circuit remembers by feeding its own answer back to itself.
4. Fetch, compute, store, repeat is the whole of what a processor does.

---

## Step 1 of 4: Build your own logic gate

**Starts from:** the Act 1 inverter, which has exactly one behaviour. One input, one
output.

**Graphic:** the inverter first, then a NAND under construction from four transistors, two
PMOS and two NMOS.

**What the player does:** flips the inverter's input both ways. Then places four
transistors so the output only goes low when A and B are both 1, which means the two NMOS
form a chain to ground and either PMOS can pull the output up. Then tries all four input
combinations and fills in the OUT column of a truth table by hand.

**Understand what:** one input can invert, but deciding anything needs two. A gate that
answers "are both true?" is the one to build first.

---

## Step 2 of 4: Build your own adder

**Starts from:** four lamps in a row, each with a weight of 8, 4, 2, 1. Light some and the
row is a number.

**Graphic, in four stages:**

- The bit row, to establish place value.
- The same sum, 5 + 3, worked on paper one column at a time, right to left.
- One column's circuit, the full adder, built from five tiles.
- Four of those tiles stamped in a row, each one's carry-out wired to the next carry-in.

**What the player does:** steps through the paper sum. Then places the five tiles, guided
by a caption under each box saying which question it answers: "differ?" takes XOR, "both?"
takes AND. Then finds a combination where the sum overflows a single column. Then stamps
four copies and sets the machine to compute 5 + 3, watching the carry travel. Finally
breaks it by finding a sum that needs the sixteens lamp.

**Understand what:** every column does the same job, so the circuit for one column can be
printed four times. The travelling spill is the carry, and the lamp that lights on overflow
is what a real chip calls the carry flag.

---

## Step 3 of 4: Build your own memory

**Starts from:** every gate so far only reports on right now. Let go of the inputs and the
answer vanishes.

**Graphic:** a button and a lamp, then two NAND gates with their outputs crossed into each
other's inputs, then four of those loops side by side.

**What the player does:** presses and holds a button, then lets go and watches the answer
disappear. Then closes the loop by clicking an output pin and the glowing input pin on the
other gate, both ways round. Then uses SET and RESET to store a 1, take their finger away,
and store a 0.

**Understand what:** the loop remembers because it never stops telling itself the answer.
Two NANDs wired this way is an SR latch, and four of them side by side is a register, a
place to park a whole number.

---

## Step 4 of 4: Build a machine that computes

**Starts from:** a gate that decides, an adder that adds, and a register that holds, all
sitting on the bench.

**Graphic:** a loop skeleton with two empty slots, a clock box, and an addend input.

**What the player does:** drags the REGISTER and the ADDER into the loop, leaving a lone
NAND in the tray as the decoy. Then clocks it, watching each tick fetch the number out of
the register, compute the sum, and store it back. Overflow past 15 wraps like an odometer.
The test is to make the register read exactly 12.

**Understand what:** the register only accepts a new value on a clock beat, which is what
stops the adder's output pouring back into its own input. Fetch, compute, store, repeat, a
few billion times a second, is a CPU.

---

## Where the act likely loses people

**This is the best-paced act in the course,** and it is worth saying so. Each step is one
idea, and the ladder from gate to adder to memory to loop is clean.

**Step 2 still carries four stages:** place value, the paper sum, the full adder, and the
four-bit stamp. The paper-sum beat is the strongest thing in the act, because it is the
intuition framework working exactly as intended: the player already knows 5 + 3 = 8, so
the circuit has something to be checked against. It should survive any rewrite untouched.

**Step 3's wiring interaction is fiddly.** Clicking an output pin and then the correct
input pin on the other gate is precise work, and the code carries a note-throttling
workaround because players trigger the same hint repeatedly. That is a sign the interaction
fights them.

**"Tick" is used throughout step 4** and is on the vocabulary replacement list in
`DESIGN_MAKEOVER.md` §3. Act 4 now says cycle, and defines it once on a clock. These two
acts currently disagree.

**Everything is still scroll mode**, with the same diagnosis as `DESIGN_MAKEOVER.md` §1.
