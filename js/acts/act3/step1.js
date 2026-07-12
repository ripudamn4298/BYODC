// ACT 3 · STEP 1 — Grow the crystal (Czochralski pull).
// Beat: sand → 99.9999999% pure melt (callback to Act 1's nine-nines fact) → pull a
// seed crystal slowly while rotating, atoms freeze on in perfect order. A pull-speed
// slider drives growth; a sweet band (drifting twice) keeps the ingot defect-free.
// Then slice the ingot into wafers.
import { svgEl, sleep, clamp, rand } from '../../engine/util.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { Anim } from '../../engine/anim.js';
import { makeSlider, makeChip, cornerTicks } from '../../engine/components.js';

export async function step1(){
  guide.title('STEP 1 / 4 · NANOVOLT MATERIALS', 'Grow the <em>crystal</em>');

  guide.say(`Sand is mostly silicon dioxide — common, cheap, everywhere. Refine it hard enough and you get the number from Act 1's fact cards again: <b>99.9999999% pure</b> molten silicon, nine nines, sitting in a crucible at 1,414°C. Pure isn't enough, though. For a transistor to behave, every atom in the crystal has to sit exactly where a perfect lattice says it should.`);
  await guide.next();

  guide.say(`The trick is a hundred years old and still unbeaten: dip a tiny <b>seed crystal</b> into the melt, then pull it up <em>slowly</em> while spinning it. Atoms freeze onto the seed one layer at a time, copying its perfect order as they go. Pull too fast and the crystal can't keep up — flaws freeze in. This is the <b>Czochralski process</b>, and it's how almost every wafer on Earth begins.`);
  await guide.next();

  /* ---------- the pull rig ---------- */
  const { svg, controls } = newStage('09', 'Czochralski crystal pull');

  const cx = 360;
  const crucibleTop = 372, crucibleBot = 440, crucibleHalfW = 118;
  const seedY0 = 96;          // rod tip / seed starting y
  const maxIngotLen = 232;    // full pulled length

  // crucible (molten silicon, amber-tinted)
  const melt = svgEl('path', {
    d: `M${cx - crucibleHalfW} ${crucibleTop} Q${cx - crucibleHalfW} ${crucibleBot} ${cx} ${crucibleBot} Q${cx + crucibleHalfW} ${crucibleBot} ${cx + crucibleHalfW} ${crucibleTop} Z`,
    fill: 'var(--amber-soft)', stroke: 'var(--amber)', 'stroke-width': 1.5,
  });
  const crucibleWall = svgEl('path', {
    d: `M${cx - crucibleHalfW - 8} ${crucibleTop - 6} Q${cx - crucibleHalfW - 8} ${crucibleBot + 10} ${cx} ${crucibleBot + 10} Q${cx + crucibleHalfW + 8} ${crucibleBot + 10} ${cx + crucibleHalfW + 8} ${crucibleTop - 6}`,
    fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.6,
  });
  svg.append(crucibleWall, melt);
  const meltLbl = svgEl('text', { x: cx, y: crucibleBot - 14, class: 'lbl-faint' });
  meltLbl.textContent = 'MOLTEN SILICON · 1,414°C';
  svg.appendChild(meltLbl);

  // pull rod + seed, at top
  const rod = svgEl('line', { x1: cx, y1: 20, x2: cx, y2: seedY0, stroke: 'var(--ink)', 'stroke-width': 3 });
  svg.appendChild(rod);
  const rodLbl = svgEl('text', { x: cx + 46, y: 40, class: 'lbl-faint' });
  rodLbl.textContent = 'SEED ROD — rotating';
  svg.appendChild(rodLbl);

  // the ingot: grows DOWNWARD from the seed toward the melt as it's "pulled" (frozen on)
  const ingotLayer = svgEl('g');
  svg.appendChild(ingotLayer);
  const ingotW0 = 20;
  const ingotBody = svgEl('rect', { x: cx - ingotW0 / 2, y: seedY0, width: ingotW0, height: 0, rx: 4, fill: 'var(--paper-high)', stroke: 'var(--ink)', 'stroke-width': 1.5 });
  ingotLayer.appendChild(ingotBody);
  const neckMark = svgEl('rect', { x: cx - 5, y: seedY0, width: 10, height: 12, fill: 'var(--paper-high)', stroke: 'var(--ink)', 'stroke-width': 1.2 });
  ingotLayer.appendChild(neckMark); // the thin seed neck, always present
  const defectLayer = svgEl('g');
  svg.appendChild(defectLayer);

  cornerTicks(svg, 40, 40, 640, 400, 8);

  const chipLen = makeChip(controls, 'GROWN: <b>0%</b>');
  const chipDefect = makeChip(controls, 'DEFECTS: <b>0</b>');
  const bandChip = makeChip(controls, 'PULL SPEED: aim for the band', 'warm');

  const slider = makeSlider(controls, { label: 'PULL SPEED', min: 0, max: 100, step: 1, value: 50, fmt: v => `${v}` });

  guide.say(`The rod is rising, and the growing crystal — a single cylinder called an <b>ingot</b> — hangs beneath it, lengthening as atoms freeze onto its tip at the melt surface. <b>Your job: pull the whole ingot without freezing in flaws.</b> The one control is <b>pull speed</b>, on the slider below. There's a narrow speed band that keeps the crystal perfect — too fast tears in defects, too slow just crawls. Hold the speed in that band until the ingot is fully grown, keeping defects to 3 or fewer. Watch closely: the band <b>drifts</b> as the melt cools, so don't set it and walk away.`);

  /* ---------- live pull interaction ---------- */
  const result = await flow.ask(async replay => {
    if (replay !== undefined){
      // instantly render the finished, clean ingot
      ingotBody.setAttribute('height', maxIngotLen);
      chipLen.set('GROWN: <b>100%</b>');
      chipDefect.set(`DEFECTS: <b>${replay}</b>`);
      bandChip.set('PULL SPEED: locked in');
      slider.set(50);
      return replay;
    }

    let band = [40, 60];
    let grown = 0;           // 0..maxIngotLen
    let defects = 0;
    let driftsLeft = 2;
    let nextDriftAt = rand(0.28, 0.4);   // fraction of growth
    let done = false;
    let lastFleckAt = -999;

    const cancel = flow.hintAfter(14000,
      `Straight answer: keep the slider between roughly <b>${band[0]}</b> and <b>${band[1]}</b> — that's today's sweet band. It will drift once or twice; just follow it back into range.`);

    function driftBand(){
      const width = band[1] - band[0];
      const center = clamp(rand(20, 80), width / 2 + 5, 95 - width / 2);
      band = [Math.round(center - width / 2), Math.round(center + width / 2)];
      SFX.blip();
      guide.note(`The melt just shifted temperature — the sweet band moved to roughly <b>${band[0]}–${band[1]}</b>. Follow it.`);
    }

    await new Promise(resolve => {
      const ticker = dt => {
        if (done) return;
        const speed = slider.value;
        const inBand = speed >= band[0] && speed <= band[1];
        bandChip.set(inBand ? 'PULL SPEED: <b>in the band</b>' : 'PULL SPEED: <span style="color:var(--red)">out of band</span>');

        // growth rate: fastest near band center, crawls far outside it, but ALWAYS some progress
        const center = (band[0] + band[1]) / 2;
        const dist = Math.abs(speed - center);
        const rate = inBand ? 46 : Math.max(8, 46 - dist * 0.7);
        grown = clamp(grown + rate * dt, 0, maxIngotLen);
        ingotBody.setAttribute('height', grown);
        chipLen.set(`GROWN: <b>${Math.round(grown / maxIngotLen * 100)}%</b>`);

        // out-of-band: occasionally freeze in a red defect fleck
        if (!inBand && grown > 6 && (grown - lastFleckAt) > 20){
          lastFleckAt = grown;
          defects++;
          chipDefect.set(`DEFECTS: <b>${defects}</b>`);
          const fx = cx + rand(-ingotW0 / 2 + 3, ingotW0 / 2 - 3);
          const fy = seedY0 + grown - rand(2, 10);
          defectLayer.appendChild(svgEl('circle', { cx: fx, cy: fy, r: 2.2, class: 'defect-dot' }));
          SFX.click();
        }

        // drift the band twice mid-pull
        if (driftsLeft > 0 && grown / maxIngotLen >= nextDriftAt){
          driftsLeft--;
          nextDriftAt = driftsLeft > 0 ? rand(0.62, 0.78) : 2;
          driftBand();
        }

        if (grown >= maxIngotLen && !done){
          done = true;
          Anim.remove(ticker);
          resolve();
        }
      };
      Anim.add(ticker);
    });

    cancel();
    return defects;
  });

  const defectCount = result;
  guide.say(defectCount <= 1
    ? `A near-perfect pull — <b>${defectCount}</b> flaw${defectCount === 1 ? '' : 's'} frozen in, out of a crystal a foot long. That's the kind of number a fab operator frames.`
    : `The ingot's grown, carrying <b>${defectCount}</b> small flaws — a real, usable pull. Real fabs live with numbers like this; the defects just have to land somewhere a die can't use.`);
  await guide.next();

  /* ---------- slice into wafers ---------- */
  guide.say(`An ingot is a mirror-perfect log — but a log builds nothing. Time to slice it into wafers, each one thinner than a credit card.`);
  await guide.button('Slice into wafers ▸');

  SFX.flow();
  const sliceCount = 6;
  const waferR = 26;
  const fanY = 320;
  const spacing = 96;
  const startX = cx - (sliceCount - 1) * spacing / 2;

  // sweep a cut line down the ingot, then fan wafers out below it
  const cutLine = svgEl('line', { x1: cx - 30, y1: seedY0, x2: cx + 30, y2: seedY0, stroke: 'var(--red)', 'stroke-width': 2 });
  svg.appendChild(cutLine);
  for (let i = 0; i < sliceCount; i++){
    await sleep(140);
    const y = seedY0 + (i + 1) * (maxIngotLen / sliceCount);
    cutLine.setAttribute('y1', y); cutLine.setAttribute('x1', cx - 30);
    cutLine.setAttribute('y2', y); cutLine.setAttribute('x2', cx + 30);
    SFX.blip();
  }
  cutLine.style.transition = 'opacity .4s';
  cutLine.style.opacity = '0';
  await sleep(300);
  ingotLayer.style.transition = 'opacity .5s';
  ingotLayer.style.opacity = '0.15';
  defectLayer.style.transition = 'opacity .5s';
  defectLayer.style.opacity = '0.15';

  const waferLayer = svgEl('g');
  svg.appendChild(waferLayer);
  for (let i = 0; i < sliceCount; i++){
    const x = startX + i * spacing;
    const disc = svgEl('circle', { cx: cx, cy: seedY0 + 40, r: waferR, class: 'wafer-disc' });
    disc.style.transition = 'transform .6s cubic-bezier(.22,.9,.24,1), opacity .5s';
    disc.style.opacity = '0';
    waferLayer.appendChild(disc);
    await sleep(90);
    disc.style.opacity = '1';
    requestAnimationFrame(() => {
      disc.style.transform = `translate(${x - cx}px, ${fanY - (seedY0 + 40)}px)`;
    });
    SFX.hop();
  }
  await sleep(650);
  const waferCountLbl = svgEl('text', { x: cx, y: fanY + 56, class: 'lbl-strong' });
  waferCountLbl.textContent = `${sliceCount} OF ~400 WAFERS FROM ONE INGOT`;
  svg.appendChild(waferCountLbl);

  guide.aha(`One ingot → hundreds of wafers. Each wafer will hold <b>thousands</b> of the CMOS cells you built by hand back in Act 2 — printed, not placed.`,
    `You spent an entire act wiring one transistor. A fab spends one pull growing the raw material for a quarter-million chips.`);
  await guide.next();
}
