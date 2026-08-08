# ACT 2 MAKEOVER — micro-learning

Plan to port "From Switches to Logic, Math & Memory" to the card contract. Diagnosis is in
`ACT2_WALKTHROUGH.md`. The binding rules are `DESIGN_MAKEOVER.md` §2, and the engine API
they run on is §4. Read `js/acts/act4/step1.js` before writing.

**Act 2 stays at 4 steps.** It is the best-paced act in the course and needs porting rather
than restructuring. Resist the urge to split anything just because the other acts are.

## 1. What has to change

1. **Long paragraphs beside unlabelled diagrams**, the same as everywhere pre-makeover.
2. **"Tick" is used throughout step 4.** Act 4 now says cycle and defines it once on a
   clock. A player goes straight from this act to that one, so they currently disagree.
3. **Step 3's wiring interaction fights the player.** The code carries a note-throttling
   workaround because the same hint fires repeatedly, which is a sign the click target is
   too precise or the rule is not visible.
4. **Step 2 carries four stages** (place value, the paper sum, the full adder, the four-bit
   stamp). They build properly, so this is a carding job, not a split.

## 2. Renames

| old | new |
|---|---|
| Build your own logic gate | Weigh two inputs at once |
| Build your own adder | Add the way you do on paper |
| Build your own memory | A circuit that remembers |
| Build a machine that computes | Fetch, compute, store, repeat |

NAND, full adder, ripple carry, SR latch, register and datapath still get taught, each as a
labelled reveal at the end of its beat.

**Vocabulary:** "tick" and "tick the clock" become "cycle", defined once on first use with
the clock highlighted, in the same words Act 4 uses: one cycle is one beat, every part moves
once, then waits.

**Costs are unchanged.** No step splits, so the ladder is untouched.

## 3. Step scripts

### Step 1 — Weigh two inputs at once

Preface: "Your Act 1 inverter has one behaviour. This step builds a gate that weighs two
things at once."

1. Open on the inverter from Act 1, labelled YOUR ACT 1 INVERTER. Flip it both ways.
   (Rule 4.)
2. "One input can only invert. To decide anything you need two." State the aim.
3. Define the goal before the build: output 0 only when A and B are both 1.
4. **The wiring rule gets its own card before the tiles are placed:** both inputs must be 1
   to pull the output down, so the two NMOS go in a chain to ground; either input can push
   it up, so the two PMOS go in parallel.
5. Place the four transistors.
6. Card naming the input paths: A feeds the left PMOS and the top NMOS, B feeds the right
   PMOS and the bottom NMOS. Highlight each path as it is named.
7. Try all four combinations. One card, the bench live.
8. The truth table, unchanged, with its click-to-toggle instruction on the card.
9. Name reveal: NAND.
10. The universality folds, one card each rather than one paragraph.

### Step 2 — Add the way you do on paper

Preface: "You already know 5 + 3 = 8. This step builds the circuit and checks it against
the answer you started with."

**This is the intuition framework working exactly as designed (DESIGN.md §6c). The paper
sum beat is the strongest thing in the act. Port it, do not redesign it.**

1. The bit row. "Four lamps, weights 8, 4, 2, 1. The row is a number: add the weights of
   the lit ones." Label PLACE VALUE.
2. "One column can only hold so much. The spill into the next column is the carry." Label
   CARRY on the spill.
3. The paper sum, 5 + 3, stepped through one column at a time. One card per column.
4. Payoff card: every column did the same job. Add the two digits, add anything carried in,
   write one digit, pass any spill left.
5. Define the full adder on its own card: three inputs, A and B and the carry in; two
   outputs, the sum digit and the carry out.
6. **The two questions get one card each**, because they are the whole design: the sum
   digit is 1 when the digits differ, which is XOR; the carry is about whether both were 1,
   which is AND.
7. Place the five tiles, with the caption under each box saying which question it answers.
8. Find a combination where the sum overflows one column.
9. "Box it, stamp it, repeat." The four-tile stamp, watched, with each carry-out wired into
   the next carry-in.
10. Compute 5 + 3 on the four-bit adder and watch the carry travel right to left.
11. Break it: find a sum that needs the sixteens lamp. Name it the carry flag.
12. Aha: every addition a computer does is this same ripple, wider and faster.

### Step 3 — A circuit that remembers

Preface: "Every gate so far only reports on right now. This step builds one that holds an
answer after you let go."

1. Press and hold the button, then let go. The answer vanishes. One card.
2. "To hold an answer, a circuit has to keep telling itself what it just said." State the
   aim.
3. Define feedback on its own card, with the two NANDs highlighted: each one's output goes
   into the other's input, so the pair only listens to itself.
4. Close the loop. **Fix the interaction**: make the click targets larger, show the pending
   wire as a preview line following the cursor, and label the pin the player must click
   next rather than relying on a repeated hint. The note-throttling hack should become
   unnecessary; if it is still needed, the interaction is still wrong.
5. Name it: SR latch, S sets, R resets. Label both buttons.
6. Store a 1 and let go. Store a 0 and let go. Two tasks, two cards.
7. Aha: the loop remembers because it never stops telling itself the answer.
8. Four loops side by side, watched. Label REGISTER.

### Step 4 — Fetch, compute, store, repeat

Preface: "You have a gate that decides, an adder that adds, and a register that holds. Wire
them into a loop and you have a machine."

1. Open on the three parts on the bench, each labelled, each pointing back to the step that
   built it. (Rule 4.)
2. Drag REGISTER and ADDER into the loop. The lone NAND stays in the tray as the decoy.
3. "The register's output feeds the adder; the adder's output feeds straight back in. One
   loop, closed."
4. **Define the cycle here, once, with the clock highlighted:** one cycle is one beat, the
   register accepts a new value, and nothing moves in between. This is the definition Act 4
   then reuses.
5. "Without that rule the adder's output would pour back into its own input." Say why the
   clock exists, not just that it does.
6. The three phases, one card: fetch the number out, compute the sum, store it back.
7. Run it. Overflow past 15 wraps like an odometer, one card.
8. Task: make the register read exactly 12.
9. Aha: fetch, compute, store, repeat, a few billion times a second, is a CPU.
10. Closing card: sand, switch, gate, adder, memory, clock. Each step one idea wired to the
    next.

## 4. Write every card with the humanizer

**Invoke the `humanizer` skill before writing any player-facing copy**, and run every card,
label, button and note through it. Watch for: em dashes, rule-of-three lists, "not just X
but Y", manufactured punchlines, inflated significance, signposting like "let's look at".
Short sentences, concrete nouns, real numbers instead of adjectives.

This act already has some of the best copy in the course, so the humanizer pass here is
mostly about cutting length rather than fixing voice. Where a paragraph already says the
mechanism plainly, split it into cards and keep the words.

Ripu reviews the rendered cards, not the code.

## 5. What does not change

- The paper-sum beat in step 2, in structure and in numbers.
- The `flow.ask` record-and-replay contract, determinism, Back and Restart.
- Colour semantics per DESIGN.md §4.
- Every cost delta and the act total.

## 6. Build order

1. One agent per step, four agents, each owning one file, none touching the registry.
2. Registry pass afterwards: titles, premises, CTAs, business cards, act summary.
3. **Do not renumber stage numerals in this pass.** One global renumbering pass runs last,
   once every act's final step count is known. See `RENUMBERING.md`.
