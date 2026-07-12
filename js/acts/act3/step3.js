// ACT 3 · STEP 3 — The yield game.
// Beat: dust is bigger than a transistor; every wafer catches a few invisible
// defects; a defect kills the die it lands in. Die-size control shows the
// quadratic feel: bigger dies -> far fewer dies AND worse survival. Two rounds:
// a clean-ish wafer, then a dirtier one with a tighter target — the player must
// re-verify their choice under worse odds rather than coast on the first answer.
import { waitFor } from '../../engine/util.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeSeg, makeChip, cornerTicks } from '../../engine/components.js';
import { makeWaferMap } from '../../engine/fab.js';

const WAFER_COST = 5500;      // fixed $ per wafer, for the $/good-die readout
const SIZES = [
  { id: 'sm', label: 'small', w: 26, h: 26 },
  { id: 'md', label: 'medium', w: 40, h: 40 },
  { id: 'lg', label: 'large', w: 60, h: 60 },
];

export async function step3(){
  guide.title('STEP 3 / 4 · NANOVOLT FAB 3', 'The <em>yield game</em>');

  guide.say(`First, two words you'll need. A <b>wafer</b> is the full disc of silicon you've been printing on. It gets carved into a grid of identical chips — each single chip is a <b>die</b>. Now the problem: even a clean room has some dust, and a speck of dust is <em>bigger</em> than your transistors. No wafer ever comes out perfect. Wherever a speck lands, it kills the whole <b>die</b> around it — and the fraction of dies that survive is the wafer's <b>yield</b>.`);
  await guide.next();

  const { svg, controls } = newStage('11', 'Wafer yield map');
  cornerTicks(svg, 40, 40, 400, 400, 8);

  const wafer = makeWaferMap(svg, { cx: 230, cy: 232, r: 165 });

  const chipDies = makeChip(controls, 'DIES/WAFER: —');
  const chipGood = makeChip(controls, 'SURVIVORS: —');
  const chipCost = makeChip(controls, '$/GOOD DIE: —', 'warm');

  let curSize = SIZES[1];
  function refresh(){
    const stats = wafer.tile(curSize.w, curSize.h);
    chipDies.set(`DIES/WAFER: <b>${stats.total}</b>`);
    chipGood.set(`SURVIVORS: <b>${stats.good}</b>`);
    const perGood = stats.good > 0 ? WAFER_COST / stats.good : Infinity;
    chipCost.set(`$/GOOD DIE: <b>${stats.good > 0 ? '$' + perGood.toFixed(0) : '—'}</b>`);
    return { stats, perGood };
  }

  const seg = makeSeg(controls, SIZES.map(s => ({ id: s.id, label: s.label.toUpperCase(), value: s.id })), id => {
    curSize = SIZES.find(s => s.id === id);
    SFX.blip();
    refresh();
  });
  seg.set('md');

  guide.say(`Generating a real defect map — every wafer's dust pattern is different. Sprinkling today's.`);

  const seed1 = await flow.ask(async replay => {
    if (replay !== undefined){ wafer.scatter(replay, 12); return replay; }
    const s = Math.floor(Math.random() * 1e9);
    wafer.scatter(s, 12);
    return s;
  });
  refresh();

  guide.say(`Here's how to read the stage: the <b>grid of squares</b> laid over the wafer is your dies, and the <span class="e-red">red dots</span> are the dust specks — twelve of them, where they happened to land. Any square a dot touches is a dead die. <b>Now the choice that decides everything: how big do you cut each die?</b> Pick a size below and watch three numbers — dies per wafer, survivors, and dollars per <em>good</em> die (the whole wafer costs $${WAFER_COST.toLocaleString()} to make, however you slice it).`);
  await guide.next();

  /* ---------- test (a): hit a cost target on the clean-ish wafer ---------- */
  const TARGET_A = 70;
  guide.say(`<b>Your target: get the cost under $${TARGET_A} per good die.</b> Feel the tradeoff as you try the sizes — a bigger die is worth more individually, but it's a bigger target for dust, and a wafer only holds so many to begin with. This single choice is the whole economics of a chip.`);

  const pick1 = await flow.ask(async replay => {
    if (replay !== undefined){ curSize = SIZES.find(s => s.id === replay); seg.set(replay); refresh(); return replay; }
    const cancel = flow.hintAfter(14000,
      `Go <b>small</b>. Small dies pack far more copies onto the wafer, and each one has less area to catch a stray defect — so more of them survive. That combination usually beats the cost target here.`);
    await waitFor(() => {
      const { stats, perGood } = refresh();
      return stats.good > 0 && perGood <= TARGET_A;
    });
    cancel();
    return curSize.id;
  });

  guide.say(`There it is: <b>${SIZES.find(s => s.id === pick1).label}</b> dies cleared the target — medium and large never even got close. Notice the shape of the tradeoff — double a die's edge and you don't lose half the dies, you lose <em>three quarters</em> of them, because area grows with the square. That's the quadratic squeezing your economics from both ends: far fewer dies to begin with, and each one is a bigger target for dust.`);
  await guide.next();

  /* ---------- test (b): a dirtier wafer, tighter target ---------- */
  guide.say(`Now a dirtier wafer rolls in — the cleanroom had a rough shift, nearly double the dust. Don't assume your last answer still holds. Check the number.`);

  const seed2 = await flow.ask(async replay => {
    if (replay !== undefined){ wafer.scatter(replay, 24); return replay; }
    const s = Math.floor(Math.random() * 1e9);
    wafer.scatter(s, 24);
    return s;
  });
  refresh();

  const TARGET_B = 75;
  guide.say(`<b>This wafer needs $${TARGET_B} or less per good die.</b> Nearly double the dust of last time — prove the same choice still holds.`);

  const pick2 = await flow.ask(async replay => {
    if (replay !== undefined){ curSize = SIZES.find(s => s.id === replay); seg.set(replay); refresh(); return replay; }
    const cancel = flow.hintAfter(14000,
      `Stay <b>small</b>. It's still the only size with enough survivors to hit $${TARGET_B} — but with this much dust it's closer to the line than last time.`);
    await waitFor(() => {
      const { stats, perGood } = refresh();
      return stats.good > 0 && perGood <= TARGET_B;
    });
    cancel();
    return curSize.id;
  });

  guide.aha(`This is why chips are small, why a huge die costs a fortune, and why one wafer's dies get sold as three different products at three different prices. <b>Yield is the entire economics of silicon.</b>`,
    `A single point of yield, across a year of production, is worth a corporate jet. You just felt why the board watches this number more than any other.`);
  await guide.next();
}
