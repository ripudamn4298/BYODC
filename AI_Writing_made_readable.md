# AI Writing, Made Readable

A checklist for turning an AI-written explanation into one a beginner can actually
follow. Use it **after** the text exists, on the text itself. It is not a prompt you
give a model before it writes; it is a reading pass you run on what it wrote.

The problem it solves: AI explanations are usually *correct*, and usually not
*friendly*. The sentences are tight, the tone is confident, the facts are right, and
the reader still comes away without the concept, because the writing was optimised to
sound good rather than to be followed. This file names the specific habits that cause
that, so you can spot them line by line and fix them line by line.

Built while rewriting a from-scratch electronics course (BYODC) whose learners had no
background at all. The examples come from there. The habits are general.

---

## How to use it

1. **Read the text as the least-prepared person who will ever read it.** Not as the
   author. Every time you have to re-read a sentence, or supply a fact the text
   assumed, or guess what a picture shows, stop and mark the sentence.
2. **Tag each marked sentence** with one or more codes from the buckets below.
3. **Rewrite only the tagged sentences**, using the fix for that bucket. Leave the
   rest alone. Good sentences do not need improving.
4. **Read the result aloud, in order.** If a sentence needs a breath in the middle, it
   is usually a missing conjunction.
5. **Keep a change log**: old sentence, new sentence, tag. It makes review fast and it
   teaches you which habits the source keeps falling into.

Two things this is NOT for:
- Removing technical terms. A beginner will meet the real word eventually; give it to
  them with a definition rather than hiding it behind a cute one.
- Adding words for their own sake. Most fixes below are *reorderings*, not expansions.

---

## Part 1 — the writing habits (sentence level)

### DP · Dramatic Phrasing
**What it looks like.** A short, punchy line that *sounds* like it says something.
Fragments. Full stops for effect. "Your goal: make it conduct." "By the end of this
step it will carry a current."

**Why it hurts.** The drama replaces the content. The reader is told that something
will happen, not what they will learn or how. Fragments also read as commands, which
is tiring across a long explanation.

**The fix.** Say what will happen and what the reader will learn, as a complete
sentence. Full sentences, plain verbs.

| before | after |
|---|---|
| By the end of this step it will carry a current. | By the end of this step, you will learn how to drive a current through it. |
| Your goal: make it conduct. | Your goal is to make it conduct electricity. |
| Blocked, for the reason you already know. | The current is blocked, for the reason you already know: ... |

### AC · Absent Conjunction
**What it looks like.** Imperative + "and": "Turn the battery around and it pulls the
carriers away." "Put two of those back to back and the block in the middle becomes a
control." Cause and effect are jammed together with a bare *and*.

**Why it hurts.** The reader has to work out that the first half caused the second.
The sentence has no flow; it reads like two instructions.

**The fix.** Use *if*, *when*, *because*, *so that*, *so*. They make the causal link
explicit and they make the sentence breathe.

| before | after |
|---|---|
| Turn the battery around and it pulls carriers away from the seam. | If you turn the battery around, the carriers get pulled away from the depletion layer. |
| Put two of those junctions back to back and the block in the middle becomes a control. | If you put two of these junctions back to back, the block in the middle becomes a control. |
| The wires meet the crystal on its left and right faces. Any current has to pass through the silicon. | The wires connect to the left and right faces of the crystal, so any current has to pass through the silicon. |

### SD · Synonym Drift
**What it looks like.** A thing gets a proper name, then the text starts calling it
something else. "Depletion layer" is defined, and three sentences later it is "the
seam", then "the strip". Or an analogy ("empty seat") stands in for a term ("hole")
that the reader already owns.

**Why it hurts.** Every new word is a new thing to the beginner. They now wonder
whether the seam and the depletion layer are different objects. Variety that helps a
fluent reader actively harms a new one.

**The fix.** Once a term is defined, use it, every time. If you genuinely need a plain
word (the *junction* is the line where two blocks meet), define it, early and
quietly, before you rely on it. Analogies only when they carry something the term
cannot.

| before | after |
|---|---|
| ...the carriers next to the seam... | ...the carriers next to the junction (the line where N meets P)... |
| The strip got wider and the hill got taller. | The depletion layer got wider and the hill got taller. |

### MG · Missing Gloss
**What it looks like.** A technical term is used as though the reader knows it. "In
step 1 you doped silicon two ways." Doped was never defined.

**Why it hurts.** The reader either stops, or reads on with a hole in their
understanding that every later sentence widens.

**The fix.** First mention of any term gets a bracketed definition, right there in the
sentence. After that, use the term freely.

| before | after |
|---|---|
| swap a few of the silicon atoms for a different element. | dope the crystal (swap a few silicon atoms for a different element, such as phosphorus or boron, which bring extra electrons or holes). |
| It is called a MOSFET. | It is called a MOSFET (metal-oxide-semiconductor field-effect transistor). |

### CA · Colloquial Ambiguity
**What it looks like.** A casual word chosen for tone that either has a second meaning
or dodges the precise word. "That is *fine* for hundreds of them" (reads as *good*,
meant as *acceptable*). "The transistor *drinks* current." "It *leans on* the barrier."

**Why it hurts.** The reader has to disambiguate, and cute verbs hide the actual
operation. A beginner cannot tell that "drinks" means *consumes continuously*.

**The fix.** Use the plain technical word. Do not be afraid of it; the reader needs it.

| before | after |
|---|---|
| Your transistor drinks control current. That is fine for hundreds and impossible for billions. | Your transistor consumes control current. That is acceptable for hundreds and impossible for billions. |
| It leans on the left barrier only. | This voltage acts on the left barrier only. |

### MC · Mechanism Compression
**What it looks like.** A whole mechanism, or a whole backstory, squeezed into one
sentence. "Press them together and a barrier builds itself at the seam, one you can
raise and lower with a voltage." "The direction was guessed before anyone knew
electrons existed, and it stuck."

**Why it hurts.** It is correct and it is unfollowable. There is nothing on screen to
support it, and the reader has no way to unpack three ideas from one clause. The
clever one-liner assumes context the beginner does not have.

**The fix.** One idea per sentence. If the mechanism is what the next section
teaches, do not pre-teach it; leave the reader curious. If a backstory is needed,
tell the small story plainly in two or three sentences instead of one clever one.

| before | after |
|---|---|
| The direction was guessed before anyone knew electrons existed, and it stuck. | Electric current was discovered before electrons were. At the time, people drew current flowing from + to −. We now know current is electrons flowing from − to +. The convention never changed, and honestly it does not matter. |
| Press them together and a barrier builds itself at the seam, one you can raise and lower with a voltage. | Something interesting happens where the two blocks touch. *(the step itself teaches the barrier)* |

### LF · Literal Framing
**What it looks like.** The text names the concept but not what is actually on screen.
"This is silicon." The picture is a zoomed-in crystal lattice; the reader has no
sense of scale or of what the circles are.

**Why it hurts.** The reader is looking at a picture and reading about an idea, and
has to bridge them alone.

**The fix.** Say what the picture literally shows, at what scale, before saying what
it means.

| before | after |
|---|---|
| This is silicon, refined from sand. | This is a zoomed-in silicon crystal lattice, refined from sand. |

---

## Part 2 — the flow habits (across a sequence of explanations)

These apply when the text is a course, a tutorial series, or anything with a *next
step*. They are about what a transition is for.

### F1 · Sell the significance, not the mechanism
An AI hook previews *how the next thing works*. A good hook says *what it made
possible*. "A small current controls a large one" undersells a device that put a
microphone, a motor and a radio in every pocket. Say that. Let the step teach the
mechanism.

### F2 · End on the drawback
Each step should end by naming the limitation the next step fixes, as a question the
reader now wants answered. "We can control a large current, but we have to spend a
small one the whole time to do it. Wouldn't it be better to do that with no current
at all?"

### F3 · Titles that say what you will learn
Prefer an elongated title or a question over a clever noun phrase. "What's wrong with
using copper wires?" tells the reader what the next twenty minutes are about. "A
small current controls a big one" tells them the answer.

### F4 · Do not pre-teach in the transition
The transition is one simple idea and a reason to care. The mechanism belongs to the
step, where there are pictures to carry it.

### F5 · Name the thing
Where the reader will meet the real term anyway, use it: NPN transistor, electricity,
consumes. Vague-but-friendly is worse than precise-with-a-gloss.

---

## The output

A change log, one row per edited sentence:

```
STEP / location | OLD | NEW | tags
```

Plus a short section of flow changes (titles, transitions, hooks) kept separate from
the sentence edits, because they are decided differently: sentence edits are
mechanical once tagged; flow changes are editorial and want a human's approval.

---

## Guardrails

- Never remove a correct number or a correct technical term. Gloss it instead.
- Never introduce a new analogy to "help". Analogies are new terms in disguise.
- Rewrite the tagged sentences only. Untagged sentences are already doing their job.
- One idea per sentence. If a rewrite needs a third clause, it is two sentences.
- Keep the author's facts. This pass changes how things are said, not what is said.

MIT licensed. From the BYODC ("Build Your Own Data Centre") project.
