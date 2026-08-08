# DESIGN MAKEOVER — micro-learning

From Ripu's Act 4 playtest, 2026-08-08. Pilot on Act 4, then apply to every act.
Once approved and built, the contract in §2 goes into DESIGN.md as §6d and binds all copy.

## 1. What the playtest found

Ripu played Act 4 and got lost. Not because the ideas are hard. The parallel idea in
step 1 is obvious to anyone: eight adders working at once beat one adder working alone.
He got lost anyway, and every reason was packaging:

1. **Long paragraphs beside the diagram.** The player reads a wall of text, then has to
   hunt the diagram for whatever the text meant. Reading and looking are never in sync.
2. **New words with no label.** "Lane" appears in text while the diagram shows unlabeled
   squares. Step 3 shows a stack of R0, R1, R2 with no explanation of what a register is.
   The text talks about "edge" and "traffic" and never points at either.
3. **The diagram and the text don't reference each other.** Nothing highlights, nothing
   points. The player reads about a mux while looking at eight rows and has to guess
   which part is the mux.
4. **No bridge from the previous act.** Step 1 never says a lane IS the Act 2 datapath
   with the instruction-choosing removed. It's the player's own machine and they aren't
   told.
5. **Poetic names hide the content.** "The marching band." "The stationary trick."
   "Feed the beast." "Pulse the vector." A player scanning the act list learns nothing
   from these.
6. **Too much per screen.** Step 2 teaches five mechanisms in one sitting. Step 3 is two
   full lessons. The player is expected to hold too much at once.
7. **Ambiguity in the numbers.** "9 ANDs" read as 9 gates when it meant 9 AND operations.
8. **The business cards are theatrical.** Fridge memos, lawyers, tattoos. Cute, but the
   player is here to learn.
9. **Step 4's balance beam is a metaphor, not hardware.** The player is balancing pans
   when the real thing is memory stacks feeding a grid of adders.

Root cause, in one line: **the course shows too much and says too much at once, and the
text and the picture don't point at each other.**

## 2. The micro-learning contract

These rules replace the current guide-panel behavior. They apply to every step after the
makeover.

### Rule 1 — one card at a time

The side panel holds ONE short block of text. Next replaces it with the following block,
in the same place. Back brings the previous one back. No transcript pile-up, no
scrolling column of prose.

- Budget: about 30 words per card. Two short sentences. One idea.
- If a card needs a third sentence, it is two cards.

### Rule 2 — every card points at something

When a card talks about a thing, that thing is highlighted on the stage and labeled at
that moment. Everything else dims. The player never has to search the diagram for what
the text means.

- Highlight: the element(s) the card is about at full opacity, the rest at ~25%.
- Label: a mono microlabel with a thin arrow or leader line, appearing with the card.
- One highlight target per card. If a card would need two, it is two cards.

### Rule 3 — define before use, one term per card

A new word gets its own card: the word, what it is in plain language, and its label
landing on the diagram at the same moment. Only then may later cards use the word.

Pattern for a cluster of new things (example: the register file):
- Card: highlight ONE shelf. "This is a register: a small shelf that stores one number
  next to the engine." Label: REGISTER R0.
- Next. Highlight the stack. "Eight registers together are a register file." Label:
  REGISTER FILE.
- Next. Highlight the picker. "The mux picks one register and ignores the rest." Label: MUX.
- Only now does the interaction start.

### Rule 4 — connect to what the player already built

Every step opens by showing where we are and what we're reusing. If the step builds on an
Act 2 machine, the first card shows that machine's drawing, then an arrow or morph into
this step's version. The player should think "that's mine" before anything new appears.

### Rule 5 — transitions are shown, not told

When the stage reorganizes, the player watches the old thing become the new thing.
Example: the eight adders from the race visibly shrink and pack into one square, that
square gets labeled, then it stamps out into the 4x4 grid. No jump cuts to a new diagram.

### Rule 6 — plain names, plain verbs

Step titles say what you build or learn. Button labels say what the button does. The
real industry term is still taught, but as a label on the thing, or as the reveal at the
end, per DESIGN.md §6b. It is never the hook.

### Rule 7 — preface every step

First card of every step: what you will build here, in one sentence. If the step has a
test or a payoff number, say what it will be. No mystery.

## 3. Renames and vocabulary

### Step titles

| old | new |
|---|---|
| The marching band | Eight adders at once |
| The multiply engine | How a chip multiplies |
| The stationary trick (part 1) | Registers: where the numbers wait |
| The stationary trick (part 2) | Keep the weights in place |
| Feed the beast | Match memory to compute |
| Assemble the NV-1 | Assemble the GPU |

Step 3 splits into two steps. Act 4 becomes 6 steps (see §5 for numbering).

### Words

| old | new |
|---|---|
| tick / tick the clock | clock cycle, defined once on first use ("one cycle: the clock strikes, every part moves once"), then "cycle" |
| broadcast ADD | send ADD to all sixteen |
| lockstep | dropped; say "all at once, on the same order" (the label ONE INSTRUCTION, SIXTEEN LANES can stay on the diagram) |
| pulse the vector [3, 7] | send 3 and 7 down the columns |
| weight-stationary | the weights stay put (label: WEIGHTS STAY / DATA MOVES) |
| edge / traffic | numbers crossing the border, counted on screen (see step 4 redesign) |
| starving lane | lane waiting for data (amber lamp keeps its meaning) |
| "9 ANDs" | "9 AND operations", and where the hardware is meant: "a 3-by-3 grid of AND gates" |
| systolic array | taught at the END of the weights step as the real name, with its heartbeat origin, one card |
| roofline | same treatment: the real name arrives after the player has balanced the machine |

### Business cards

Keep the ledger structure (company, location, revenue, cost). Rewrite each body to two
plain sentences: who ordered, and why this component matters to them. Example, step 1:

> A games studio placed the first order. Images are long lists of numbers, and this
> block adds long lists fast.

## 4. Engine work

Three additions, no changes to the flow.ask replay contract. Cards are output only;
recorded answers stay exactly as they are, so Back/Restart keep working.

1. **guide.js card mode.** `guide.say` renders into a single card slot instead of
   appending. Internal history stack; Back re-shows the previous card. `guide.note`,
   `guide.aha`, `guide.task` render in the same slot with their existing styles.
2. **stage.js focus helpers.** `stage.focus(el | [els], {label, at})` dims everything
   else and draws the label with a leader line. `stage.clearFocus()`. Labels are SVG
   text in the existing microlabel style.
3. **anim.js pack/morph helper.** A reusable "elements shrink and slide into a target
   box" transition for Rule 5 moments. Respects `flow.instant` (skip to end state) and
   reduced motion.

## 5. Act 4, step by step

Six steps. Stage numerals become 13-18; Act 5 shifts to 19-22; the course becomes 22
steps. Cost ladder: the old step 3's $260K splits into $60K (registers) + $200K
(weights); every other delta is unchanged, so the act still ends at $2.43M.

### Step 1 — Eight adders at once

Preface card: "You will turn your Act 2 machine into the first piece of a GPU."

1. Card: the Act 2 datapath drawing, small, labeled YOUR ACT 2 MACHINE. "This is what
   you built: one adder, one operation per cycle."
2. Card: it morphs (Rule 5) into a plain box labeled 1 ADDER. Arrow between the two.
   "Same machine, drawn small. We're about to need many of them."
3. The job appears: two lists of eight numbers, sum row empty. Card: "Add these two
   lists. Predict: how many cycles for one adder? For eight?"
4. Predict (existing choose), then run. Buttons: ADD NEXT PAIR, then ALL EIGHT AT ONCE.
   Result card: "Eight cycles, then one."
5. Rule 5 transition: the eight adders pack into one square, label LANE = ONE ADDER
   WITH ITS OWN NUMBERS. Card: "A lane is your adder, copied. It gives up choosing its
   own instruction; that's why sixteen fit."
6. Stamp the 4x4 grid (watched, not jumped). Card: "Sixteen lanes. One order reaches
   all of them." Button: SEND ADD TO ALL SIXTEEN.
7. Payoff card: "Sixteen answers in one cycle. Same operation, same moment, different
   numbers. That is the whole trick of a GPU."

### Step 2 — How a chip multiplies

Preface card: "Step back. Before how chips multiply: how does multiplication itself
work? We'll do 7 x 7. You already know it's 49, so you can check the machine."

Same mechanics as today (they tested well), re-carded:

1. One card per idea: 1-bit multiply is AND (the existing gate quiz); build partial
   product rows by tapping bits; each row shifts left one place.
2. Card before the dot board, with the board highlighted: "Every 1 drops into a column
   by its place value. Three dots in a column means three 1s to add there."
3. Count to 49. Card: "9 AND operations so far: a 3-by-3 grid of AND gates, one per
   pairing of bits."
4. Accumulator card: "A chip keeps a running total. Ours is 15. Drop its bits in too."
   Pile reads 64.
5. Crush game unchanged, but the instruction is one card: "Three 1s in a column is
   binary 11: one stays, one carries left. Tap columns until none holds three."
6. Hand to the Act 2 ripple adder (highlight it, label FROM ACT 2). Result 1000000 = 64.
7. Precision square unchanged. Payoff card: "Halve the bits and both sides of the grid
   halve. The engine gets 4x smaller. That's why AI chips use 8-bit and 4-bit math."

### Step 3 — Registers: where the numbers wait (new step, from old 3a)

Preface card: "Your engine needs numbers delivered every cycle. This step: where they
wait, and what delivery costs."

1. Card: highlight ONE shelf. "A register: a small shelf storing one number, right next
   to the engine." Label REGISTER R0.
2. Card: highlight the stack. "Eight of them: a register file." Label REGISTER FILE.
3. Card: highlight the picker. "A mux picks one register and ignores the rest. You'll
   build it from AND and OR."
4. Interaction as today: select a shelf, wrong rows AND-ed with 0 fade, OR funnel merges.
   Task: read R3.
5. Payoff, shown as a bar not a paragraph: FETCH ~180 GATES vs MATH ~35 GATES. Card:
   "Five gates of delivery for every gate of math, paid every cycle. Next step: stop
   paying it."

### Step 4 — Keep the weights in place (from old 3b)

Preface card: "In AI, one of the two numbers barely changes. We'll stop fetching it."

1. Card: "The weight: the number the network learned. It stays the same for millions of
   cycles. The data is what keeps changing." Labels WEIGHT / DATA on the two tile kinds.
2. Card: "So park each weight in a register beside its engine. Load it once." Drag the
   weight tiles into the columns (as today).
3. Card: "Now only data moves. Send 3 and 7 down the columns." Button: SEND 3 AND 7
   DOWN.
4. Result card: "Left column: 0x3 + 3x7 = 21. Right: 1x3 + 2x7 = 17. You just did a
   matrix multiply."
5. The border, made visible: draw the array's boundary as a marked line with two
   counters, labeled IN and OUT. Card: "Count what crossed the border: 2 numbers in,
   2 out. Inside: 4 multiplies. The mux design fetched every weight, every cycle."
6. Scale card, numbers only: "At 128 x 128: 16,384 multiplies per cycle, 256 numbers
   in and out. Compute grows with the area of the square. Border crossings grow with
   its edge."
7. Name reveal, one card: "Data moves through it in beats, so its inventors named it
   after the heartbeat: a systolic array."

### Step 5 — Match memory to compute (rebuilt)

The balance beam goes. The stage becomes the hardware itself:

- Right: the 4x4 lane grid from step 1, each lane with its lamp.
- Left: HBM stacks (drawn as the tile towers the player will meet again in step 6).
- Between: a bundle of wires. Its drawn width = numbers delivered per cycle.
- Two counters, labeled: NEEDED PER CYCLE (from lane count) and DELIVERED PER CYCLE
  (from stack count). A utilization meter stays.

Preface card: "A lane only computes when its numbers arrive. This step: make delivery
match demand."

1. Card: highlight the stacks. "Memory delivers numbers at a fixed rate: its bandwidth.
   More stacks, more numbers per cycle." Label HBM STACK.
2. Card: highlight lamps. "Blue: fed. Amber: waiting for data."
3. Fix 1 as today (starved rig, add stacks until utilization >= 90%), but the player
   watches wires thicken and lamps flip blue as counters converge.
4. Fix 2 as today (overbuilt rig, remove idle stacks without starving).
5. Payoff card: "Whichever number is smaller caps the machine. Half of GPU design is
   delivery, not math. The chart of this trade-off is called the roofline."

### Step 6 — Assemble the GPU

As today, re-carded:

1. Preface: "Put the act in one package: your lanes, your memory, one lid."
2. Interposer defined on its own card with its label, then place die + two HBM stacks
   (CPU tile stays as the wrong option).
3. Cooler card: "Every flip makes heat. In Act 1 one flip was too small to measure.
   Billions per second on five inches is about 700 watts. Drop the cooler."
4. Training loop kept, two cards: what a pass is; loss falling means learning.
5. Final card ties back: "These are the lanes from step 1, grinding. Graphics, physics,
   AI: same machine, same move."

## 6. What does not change

- The flow.ask record-and-replay contract, determinism, Back/Restart.
- Physics rules and color semantics (DESIGN.md §4): blue electrons, red holes, amber cost.
- The paper design language, fonts, hairlines, microlabels.
- The act's total cost and the course cost ladder's endpoint.
- §6 plain voice, §6b define-aim-interact, §6c intuition framework. This makeover
  tightens them; it contradicts none of them.

## 7. Build order

1. Engine: guide card mode, stage focus/label helpers, pack/morph transition. Act 4
   opts in first; other acts keep the old panel until they're ported.
2. Rewrite Act 4 as card scripts per §5, including the step split and renumbering
   (Act 5 numerals 19-22, progress.js keys unaffected since they store {act, step}).
3. Playtest-for-confusion pass on Act 4, same method as PLAYTEST_FINDINGS.md: play it
   as a confusion-prone undergrad, check every card against what's actually highlighted.
4. Ripu reviews Act 4 live. Only after sign-off, port Acts 1, 2, 3, 5.
5. Then DESIGN.md gains §6d (this contract) and the old guide behavior is removed.
