---
name: 3blue1brown-explanation-style
description: >
  A field guide to how 3Blue1Brown (Grant Sanderson) explains hard ideas, and how to
  reproduce that style. Use when writing tutorials, explainers, video scripts, docs, or
  when answering "how does X actually work?" Optimizes for intuition, motivation and
  memorability over coverage and formalism.
version: 1.0
derived_from: >
  Direct analysis of the 3Blue1Brown YouTube catalog, Grant Sanderson's near-verbatim
  written lesson adaptations on 3blue1brown.com (Neural Networks ch.1, Essence of
  Calculus ch.1, Vectors ch.1, Fourier Transforms, Eigenvectors and Eigenvalues,
  Bayes' Theorem), and his published criteria for good math exposition.
---

# The 3Blue1Brown Method

A documentation of how the channel teaches, and a reusable playbook for doing the same.

---

## 0. How this was derived

This is not a summary of opinions about the channel. It comes from reading the actual
lesson texts Grant publishes alongside his videos (which track the narration closely),
plus the criteria he wrote down publicly when he ran the Summer of Math Exposition
contest and had to define what "good explainer" even means.

Everything below is phrased in my own words rather than lifted, so it can be pasted into
tooling and instruction files freely.

---

## PART I — Channel profile (observed facts)

**Who:** Grant Sanderson. ~8.5M subscribers, ~241 videos. Self-described mission is
covering math and adjacent fields (physics, CS) with an emphasis on visualizing the core
idea, using animation to motivate topics that are otherwise tricky, and making hard
problems simple through a change of perspective.

**How the catalog is organized.** The channel is not a stream of one-off uploads. It is
organized into deliberate structures:

- **Ordered courses**, meant to be consumed in sequence: Essence of Linear Algebra
  (16 lessons), Essence of Calculus (12), Neural Networks (10), Differential Equations (8).
- **"Explainers"** — a playlist explicitly defined as videos answering a "what is ___?"
  question. Neural networks, Fourier series, Fourier transform, holograms, quantum
  computing.
- **"Puzzles with beautiful solutions"** — videos built around one puzzle with a clever
  resolution. Colliding blocks computing pi, the Basel problem, the IMO windmill question.
- **Thematic clusters** like "Why pi?", where the same surprising constant is chased
  across unrelated settings.
- **Guest videos and collaborations**, plus a deliberate practice of pointing viewers at
  other creators.

**The naming convention is itself pedagogy.** Titles are questions, and often naive-sounding
ones. "But what is a neural network?" "Vectors, what even are they?" "Why is pi here? And
why is it squared?" "What was Euclid really doing?" The word *but* is load-bearing — it
signals: you have already seen the definition, that is not what this is.

**He publishes corrections.** There is a video titled around where his own explanation of
Grover's algorithm failed. Public self-correction is part of the brand's credibility.

**His four stated criteria for good exposition** (from the SoME contest rules, and the
cleanest statement of his own values):

1. **Clarity** — jargon gets explained, goals are understandable with minimal background,
   and the piece shows empathy for someone unfamiliar with the topic.
2. **Motivation** — within the first 30 seconds it is clear why the viewer should care.
3. **Novelty** — it gives an experience they would not get by searching around; covering a
   common topic in a *better* way counts.
4. **Memorable** — something makes it stick months later: beauty of presentation, the
   enthusiasm, or the size of the aha moment.

Everything in the rest of this document is in service of those four.

---

## PART II — The core thesis

Most explanations transmit **conclusions**. This method transmits **the path that makes the
conclusion feel inevitable**.

The target end-state is not "the learner now knows X." It is "the learner feels they could
have invented X." Grant states this outright at the top of the calculus series: the goal is
for you to come away feeling like you could have invented calculus, covering the core ideas
in a way that makes clear where they actually came from. He then keeps auditing himself
against it — repeatedly asking whether, if you were an early mathematician doodling the
right diagram, it feels plausible you would have stumbled onto this yourself.

He is also honest that this is an aspiration, not a guarantee: he notes plainly that there
is a real difference between being told why something makes sense and generating it from
scratch. That honesty is itself part of the method.

**Three practical consequences:**

1. **The learner is the protagonist.** Second person, constantly. Sentences like "being the
   mathematician that you are, you don't just want the answer, you want the technique."
   The reader is addressed as a competent peer already doing the work.
2. **"We" for the shared journey, "you" for the discovery, "I" for choices and opinions.**
   The first person is reserved almost entirely for admissions and preferences — e.g.
   explaining that he picked two hidden layers because of how he wanted to motivate the
   structure, and picked sixteen neurons because it fit nicely on screen. Owning the
   arbitrary choices is what makes the non-arbitrary ones credible.
3. **Nothing may descend from authority.** If a definition appears from nowhere, the piece
   has failed, even if the definition is correct.

---

## PART III — The structural arc

Use this as the default skeleton. Nearly every piece follows it.

### A. Title as a naive question
Titles that name a topic ("Introduction to Vectors") promise coverage. Titles that ask a
question promise resolution. Prefer the second.

### B. Epigraph (optional, one line)
He often opens with a quote that sets the intellectual register in three seconds: Hilbert on
the art of mathematics being to find the special case that contains the germs of generality;
Weyl on the introduction of coordinates as an act of violence; Serge Lang on whether you
would define music as the manipulation of notes. Cheap, and it frames the whole piece.

### C. Destination stated as a change in the learner, not a syllabus
Not "this covers integrals, derivatives, and the fundamental theorem." Instead: my goal is
for you to come away feeling you could have invented this.

A stronger variant from the Bayes lesson: he enumerates the *levels* of understanding
available — being able to plug numbers into the formula, understanding why it is true, and
recognizing when you need it at all — and then announces he will tackle them in reverse
order. Naming the ladder tells the reader which rung they are on.

### D. Motivation inside the first 30 seconds
Stakes before machinery. Bayes' theorem opens with a treasure hunt: a Bayesian search
strategy used to locate a ship that sank a century and a half earlier carrying a fortune in
gold. Neural networks opens with the fact that you read a handwritten 3 instantly and yet
could not possibly write the if-statements to do it.

### E. One hyper-specific concrete anchor, chosen because it secretly contains the general structure
**This is the single highest-leverage decision in the entire piece.**

- Area of a circle, chopped into rings → integrals, derivatives, and the fact that they are inverses.
- 28x28 handwritten digits → the entire vocabulary of deep learning.
- "Steve," a meek and tidy soul who might be a librarian or a farmer → priors, updating, base rates.
- One sine wave at three beats per second → the Fourier transform.
- One 2x2 matrix and the vectors that refuse to leave their own line → eigenvectors.

Spend real time choosing this. A weak central example cannot be rescued by good prose.
Note also his stated heuristic for *which* decomposition to pick: math tends to reward you
for respecting symmetry, so among several ways of slicing a problem, favor the symmetric one.

### F. Manufacture the felt need
Make the difficulty visible and personal *before* offering the tool.

- Digits: trivially easy for your visual cortex, near-impossible to specify procedurally.
  He explicitly says the task goes from comically trivial to dauntingly difficult the moment
  you have to write it as code.
- Fourier: he asks the deliberately dumb-sounding question — given this graph, what operation
  spits out the number 3? — lets you answer "just count the humps," **concedes that is fair
  and that it works**, and then breaks it by mixing signals together. Now you *want* the machine.

### G. Build the object, then name it
Concept first, vocabulary second, always. He describes vectors that stubbornly stay on their
own span while everything else gets knocked off its line — *then* says these are called
eigenvectors, and the stretch factor is the eigenvalue. By the time the word arrives it is a
label for something you already own.

Corollary: **tell people what to picture when they hear a word.** For now, when I say neuron,
all I want you to think is: a thing that holds a number.

### H. Notation arrives last, as compression of something already understood
Write the ugly indexed weighted sum first; introduce matrix-vector notation as *relief* from
the tedium. Build the "area so far" function until the reader actively wants a symbol for it;
only then hand them the integral sign. The Fourier lesson is explicit about this: the whole
point of the picture is that the intimidating formula becomes digestible and rich with meaning
once the diagram has done its work.

The formula should read like a receipt for work already done.

### I. Generalize explicitly, and name the transferable move
After the payoff, stop and do meta-commentary — take a moment to think about what just
happened and why it worked. Then state the reusable heuristic. The calculus lesson does this
beautifully: the purpose of approximating by subdivision is *not* that we don't care about
precision, it is that the approximation gives us the flexibility to reframe a hard question
into an easier one.

This is where memorability is manufactured.

### J. Close on the shift in perspective, then hook forward
End with what the reader can now *see* that they could not before, plus what is next.
Caveats, controversies and pedantic footnotes go **at the end**, never mid-argument — the
Bayes lesson quarantines the academic controversy about the original study into a section
after the main line is complete.

---

## PART IV — Signature techniques

### 1. Layered definitions with an announced upgrade
Start deliberately crude, and flag it as crude. A neuron is "a thing that holds a number."
Much later: it is actually more accurate to think of each neuron as a *function*, and really
the whole network is one absurdly complicated function taking 784 numbers in and 10 out.

Two rules: the first version must be **usable**, and the upgrade must **actually happen**.

### 2. Debt acknowledgment
When you hand-wave, say so out loud and post collateral. He admits the hopeful story about
hidden layers detecting edges and loops just kicks the problem down the road, and admits he
still has not explained how one layer influences the next — then asks you to run with it for
a moment. Naming the gap buys enormous trust. Silently stepping over it burns it.

He also flags where the story might be *false*: whether the trained network really works this
way is another question, one he promises to revisit. It is presented as a hope, not a fact.

### 3. Voice the objection, and honor it
Write the skeptic's line in their own words, concede what is right about it, then find the
case where it breaks. Never strawman.

Also pre-answer the questions the reader is actually holding. Why *this* definition of vector
addition and not some other? Why is it even reasonable to expect a layered structure to
behave intelligently? Those questions get their own sections.

### 4. Load-bearing visual metaphor
The metaphor is the argument, not decoration.

- Unroll a thin ring into a near-rectangle.
- Wind a signal around a circle and watch its center of mass lurch sideways when the winding
  frequency matches the signal's frequency.
- Weights drawn as a 28x28 grid of blue and red pixels, so you can literally look at it and
  say "that is an edge detector."
- Sigmoid as "squishification."
- 13,002 parameters as knobs and dials you could in principle turn by hand.

**Test:** delete the picture. If the explanation still works, the picture was decoration. If
it collapses, it was load-bearing. You want load-bearing.

### 5. Approximation → shrink the error → reframe
A recurring engine. Build something crudely wrong; show the error becomes negligible relative
to the quantity of interest; then notice the aggregate is secretly a different and easier
object (an area under a graph). He says it plainly: the approximation is wrong, but it gets
less and less wrong as the pieces get finer.

Wrong-but-shrinking is a legitimate and powerful narrative rhythm.

### 6. Zoom all the way in, then pull back
Do one neuron in loving detail — one weight, one bias, one squishing function. Then: and that
is just one neuron; all told this network has 13,002 knobs. Scale revealed *after* intuition
lands as awe rather than despair.

### 7. Multiple named perspectives, with explicit translation
Vectors as arrows in space (physics), as ordered lists of numbers (CS), as anything you can
add and scale (mathematician). He names all three, tells you which to hold in your head by
default (arrow with its tail at the origin), and tells you plainly which to postpone — the
abstract view is healthy to ignore for now. Then he keeps translating between them, because
the back-and-forth *is* the subject.

### 8. Diagnose upstream confusion
When a topic is famously unintuitive, ask why. His answer for eigenvectors: it is not that
the topic is complicated or badly explained — most books do fine — it is that it only makes
sense once matrices already feel like transformations to you. Confusion is usually a symptom
of a shaky foundation two steps back. Say that, and point at the real culprit.

### 9. Pause and ponder
Hand control back explicitly. Rank these four images by how much they would activate this
neuron. Take a moment to think about how you would generalize this into a formula. Really
think about why this graph has a peak there.

Predict-then-reveal beats read-then-nod. A guess, even a wrong one, creates the slot the
answer falls into. The written lessons formalize this as inline multiple-choice with a
"reveal" — the same instinct as the video's pause-and-ponder beat.

### 10. Concrete numbers over symbols wherever possible
440 beats per second. About 20 farmers for every librarian. 28 x 28 = 784. A ring thickness
of 0.1. A sample of 200 farmers and 10 librarians rather than percentages. Symbols come after
the number has done its work.

### 11. Credit generously, point outward
Michael Nielsen's book for going deeper on neural nets. Kalid Azad for the line about the
Fourier transform finding the recipe given a smoothie. Kahneman and Tversky for Steve.
Generosity signals confidence and raises the ceiling for the motivated reader.

### 12. Teach the strategy, not just the result
He narrates problem-solving heuristics as first-class content: when you hit a genuinely hard
question, do not attack it head on, because you just end up banging your head against a wall
— instead play with it and build familiarity until a better question appears. Respect
symmetry. Suspect that pushing a process to its extreme may make things *easier* rather than
harder. These are the parts that transfer to topics he never covered.

---

## PART V — Voice and sentence craft

**Register:** a smart friend at a whiteboard who is genuinely delighted by the thing. Not a
lecturer, not a hype man.

- **Rhythm:** short declarative → long winding build → short punch. "That's a lot to think
  about." "That right there is beautiful."
- **Rhetorical question, immediately answered.** Never leave one hanging unless you are
  explicitly inviting a pause.
- **Conversational connectives as beats:** Now. Well. So. Of course. But here's the thing.
  Notice how. In other words. Run with me for a moment. It's worth noting.
- **Playful, deflationary coinages** to defuse intimidating machinery: squishification,
  eigen-things, knobs and dials, pizza slices, unwrapping the ring, a royal pain. The humor
  targets the *formality*, never the learner.
- **Present tense, active voice, physical verbs:** knocked off, stretched, squished, lit up,
  wound up, unraveled, nudged, sneakier.
- **Sincere awe, rationed.** One or two moments per piece where the pedagogy drops and he
  just says this is beautiful. Rationed, it lands. Unrationed, it is noise.
- **Empathetic asides that lower the stakes:** admitting a choice was arbitrary; admitting
  that some people, maybe most people, would object to his notation, and that he is doing it
  anyway for reasons he will explain later; admitting that adding all these areas by hand
  would be miserable.
- **Permission to not fully get it yet:** we will see this in more detail later, so do not
  worry if it is not 100% clear right now.

### Sentence-starter library

- "My goal is for you to come away from this feeling like you could have invented ___."
- "For now, all I want you to think when I say ___ is ___."
- "Before jumping into the math for how ___, let's talk about why it's even reasonable to expect ___."
- "This is wrong — but notice that it becomes less and less wrong as ___."
- "This just kicks the problem down the road. But run with me for a moment."
- "You might say, 'that's a dumb question, just ___.' Fair enough. That works — until ___."
- "Take a moment to meditate on what just happened, and why it worked."
- "Whether or not that's actually what's going on is another question. But it's a hope we might have."
- "Being the ___ that you are, you don't just want the answer, you want the technique."
- "So take a moment to really think about why ___."
- "There's nothing special about ___ here; the important part is that ___."
- "A pattern that shows up a lot in ___ is this: ___."

---

## PART VI — Anti-patterns

- Do **not** open with a formal definition.
- Do **not** open with notation.
- Do **not** present machinery before the reader wants it.
- Do **not** write "it can be shown that." Either show it, or say honestly that you are
  skipping it and why.
- Do **not** aim for coverage. Aim for one idea that actually lands.
- Do **not** use visuals that merely illustrate words already spoken.
- Do **not** sand away the exploratory mess. The false starts, the hunches, the "if you're
  lucky, here's something you might notice" — that *is* the pedagogy.
- Do **not** say "this is easy." If they are stuck, "easy" is an insult.
- Do **not** stack jargon. Each new term needs a picture attached before it may appear again.
- Do **not** let caveats interrupt the main argument. Quarantine them at the end.
- Do **not** fake enthusiasm. Pick things you actually find beautiful; delight is the hardest
  thing to counterfeit and the most memorable when real.

---

## PART VII — Checklists

### Pre-publication rubric

1. Can the reader state in one sentence, in their own words, **why they should care** — by
   the end of the opening?
2. Is there exactly **one** concrete anchor example, and does it secretly contain the general
   structure?
3. Did every piece of terminology arrive **after** the thing it names?
4. Does every formula appear only **after** the picture that makes it obvious?
5. Did you voice at least one objection the reader was actually forming?
6. Did you flag every hand-wave, and repay the ones you promised to repay?
7. Is there at least one moment where the reader must **predict before being told**?
8. Is there one image or metaphor they will still have in six months?
9. Did you name the **transferable move**, not just the local result?
10. Would a knowledgeable reader still learn a new *angle*, or is this a competent restatement
    of what is already easy to find?

### The four-criterion self-audit

| Criterion | Question to ask | Failure smell |
|---|---|---|
| Clarity | Is every term unpacked at first use, with a picture? | Jargon chains |
| Motivation | Does the reader know the stakes in 30 seconds? | "First, some definitions" |
| Novelty | Is there an angle unavailable elsewhere? | Reads like a textbook summary |
| Memorable | What is the one thing surviving 6 months? | Nothing sticks out |

---

## PART VIII — Worked example

Applying the arc to **"But what is a hash function?"**

- **Destination:** by the end, you should feel you could have designed one.
- **Motivation (30s):** you type a password, the server checks it, and yet the server
  genuinely does not know your password. That should sound impossible.
- **Anchor:** a library with a million books and no catalogue. You want the one about
  lighthouses. Now.
- **Felt need:** try the obvious thing — shelve alphabetically. It works. Until books get
  added and everything after them has to shift.
- **Build:** what if the *title itself* told you which shelf it lived on? Chop the title into
  numbers, mash them together, take the remainder mod one million. Now you jump straight there.
- **Break it deliberately:** two books land on the same shelf. Do not hide the collision —
  make it the next chapter.
- **Name it last:** the mashing procedure is the hash function, the shelf number is the hash,
  the clash is a collision.
- **Generalize:** name the transferable move — we converted a *search* problem into an
  *arithmetic* problem. That same trick is underneath caching, deduplication, and blockchains.
- **Close:** and now the password thing is not magic, because the mashing is easy forward and
  hopeless backward. Next: what makes it hopeless backward.

---

## PART IX — One-page cheat sheet

1. Title is a question.
2. State the destination as a change in the reader.
3. Stakes in 30 seconds.
4. One concrete anchor that secretly holds the general case.
5. Make them feel the difficulty before you sell the tool.
6. Build first, name second.
7. Picture first, formula second.
8. Crude version first, announced upgrade later.
9. Say where you are hand-waving; pay it back.
10. Voice the objection and honor it.
11. Make them predict before you reveal.
12. Zoom to one instance, then pull back to scale.
13. Name the transferable move at the end.
14. Caveats last, never mid-argument.
15. Ration the awe, but mean it.

---

## Appendix — Sources consulted

- 3Blue1Brown YouTube channel: catalog, series structure, playlist taxonomy, titling patterns.
- 3blue1brown.com written lesson adaptations: Neural Networks ch.1; Essence of Calculus ch.1;
  Vectors (Essence of Linear Algebra ch.1); But what is the Fourier Transform; Eigenvectors
  and Eigenvalues; Bayes' Theorem.
- 3blue1brown.com blog: the Summer of Math Exposition announcement (the four judging
  criteria) and the SoME1 results retrospective (what he actually valued in 1,200+ entries).

*Compiled as an original synthesis; phrasing is my own rather than quoted, so this file can be
reused freely in tooling.*
