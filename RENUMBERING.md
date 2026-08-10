# The global renumbering pass

> **DONE, 2026-08-10.** Ran after all five acts were ported and the engine pass landed.
> Numerals are 01-25, unique and sequential; every `STEP n / N` eyebrow matches its act's
> count; every act boundary's HUD figure is unchanged ($0.0015 / $0.0105 / $14,000 /
> $2.43M) and the course still totals $1,102,834,000. Kept as the record of why it ran
> once rather than five times.

Three acts are splitting steps, so stage numerals and step counts move. If each act
renumbers itself as it lands, the numbers churn four times and every act after the one
being worked on is briefly wrong.

**So no act renumbers itself. One pass runs last, once every act's final step count is
known and reviewed.** Each act makeover doc carries this rule in its build order.

## Where it ends up

| act | steps now | steps after | numerals after |
|---|---|---|---|
| 1 · The Physics of a Switch | 4 | **5** | 01 to 05 |
| 2 · Logic, Math & Memory | 4 | 4 | 06 to 09 |
| 3 · From Cell to Chip | 4 | **5** | 10 to 14 |
| 4 · The GPU | 6 | 6 | **15 to 20** |
| 5 · The Data Centre | 4 | **5** | 21 to 25 |

The course goes from 22 steps to **25**.

Act 4 is already ported and currently numbered 13 to 18. It still moves, to 15 to 20, once
Act 1 and Act 3 each gain a step. Nothing about Act 4's content changes; only its numerals
and its `STEP n / 6` eyebrows stay as they are, since its own step count is unchanged.

## What the pass has to touch

1. **`newStage('nn', …)` in every step file.** Renumber from the highest act down, so no
   two steps ever hold the same numeral mid-edit.
2. **The `STEP n / N` eyebrow in every `guide.title()` call.** There is no API that derives
   a step's position, so every one of these is hardcoded. Grep `STEP [0-9] / [0-9]` across
   `js/` and fix all of them. The count N changes for acts 1, 3 and 5.
3. **`progress.js` stores `{act, step}`**, so the shape is fine, but a run saved mid-act in
   an act that gained a step resumes one step off. That is acceptable and it is the reason
   this happens once rather than four times. Consider clearing saved progress on the deploy
   that ships the finished makeover.
4. **Any copy that names a step by number.** Grep for "step 1", "step 2" and so on in
   player-facing strings; several acts point backwards by name rather than number, which is
   safer and should be preferred when rewriting.

## Cost ladder

Every split divides its step's cost between the two halves, so **no act total changes and
the course still ends at about $1.10B**. Recorded in each act's makeover doc:

| act | split | becomes |
|---|---|---|
| 1 | $0.0002 | $0.0001 + $0.0001 |
| 3 | $500 | $300 + $200 |
| 4 | $260,000 | $60,000 + $200,000 (already done) |
| 5 | $400,000 | $150,000 + $250,000 |

Base costs chain, so after the pass re-derive each act's `ACTn_BASE_COST` from the sum of
everything before it and check the HUD reads the same figures it does today at each act
boundary.

## Order

Run it after every act has been ported and reviewed, not before. Then re-verify the whole
course end to end in one sitting: every step loads, every eyebrow matches its position,
every numeral is unique and in sequence, and the cost at each act boundary is unchanged.
