// ACT 3 · STEP 4 — Cut, bond & bin.
// Beat 1: dice the wafer (grid-cut animation). Beat 2: flip-chip bond a die onto
// a substrate, then drop a heat spreader. Beat 3: the bin — sort tested chips by
// speed into FAST / TYPICAL / SLOW.
import { svgEl, sleep } from '../../engine/util.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makePlacer, cornerTicks } from '../../engine/components.js';
import { makeWaferMap } from '../../engine/fab.js';

export async function step4(){
  guide.title('STEP 4 / 4 · NANOVOLT ASSEMBLY & TEST', 'Cut, bond <em>& bin</em>');

  /* ===================== BEAT 1 — dice the wafer ===================== */
  guide.say(`You have a wafer full of good dies — but a bare die can't do anything yet. It has to be cut out of the wafer, wired to the outside world, and sealed in a protective shell. That's <b>packaging</b>, the last stretch between sand and a chip you can hold. Three jobs, in order: <b>cut</b>, <b>bond</b>, <b>bin</b>. First, cutting the dies apart — the fab calls it <b>dicing</b>.`);

  {
    const { svg } = newStage('12', 'Wafer dicing');
    cornerTicks(svg, 40, 40, 400, 400, 8);
    const wafer = makeWaferMap(svg, { cx: 230, cy: 232, r: 165 });
    wafer.scatter(2026071, 10);
    wafer.tile(46, 46);

    guide.say(`A diamond saw sweeps the wafer in a grid, both directions — a fast, precise, deliberately violent cut.`);
    await guide.button('Dice the wafer ▸');

    const sawH = svgEl('line', { x1: 40, y1: wafer.cy - wafer.r, x2: 400, y2: wafer.cy - wafer.r, stroke: 'var(--red)', 'stroke-width': 2 });
    svg.appendChild(sawH);
    SFX.flow();
    for (let i = 0; i <= 10; i++){
      const y = (wafer.cy - wafer.r) + i * (wafer.r * 2 / 10);
      sawH.setAttribute('y1', y); sawH.setAttribute('y2', y);
      await sleep(45);
    }
    sawH.setAttribute('x1', wafer.cx); sawH.setAttribute('x2', wafer.cx);
    sawH.setAttribute('y1', wafer.cy - wafer.r); sawH.setAttribute('y2', wafer.cy + wafer.r);
    for (let i = 0; i <= 10; i++){
      const x = (wafer.cx - wafer.r) + i * (wafer.r * 2 / 10);
      sawH.setAttribute('x1', x); sawH.setAttribute('x2', x);
      await sleep(45);
    }
    sawH.style.transition = 'opacity .3s'; sawH.style.opacity = '0';
    await sleep(250);

    // dies separate slightly — a satisfying little "explode" outward
    wafer.dies.forEach(d => {
      if (d.state === 'good' || d.state === 'defect'){
        const dx = (d.x + d.w / 2 - wafer.cx) * 0.09;
        const dy = (d.y + d.h / 2 - wafer.cy) * 0.09;
        d.rect.style.transition = 'transform .5s cubic-bezier(.22,.9,.24,1)';
        d.rect.style.transform = `translate(${dx}px,${dy}px)`;
      }
    });
    SFX.success();
    await sleep(550);

    guide.say(`Diced. The good dies (cobalt) fall free into a tray; the defective ones (red) are swept out now, before another cent gets spent on them.`);
    await guide.next();
  }

  /* ===================== BEAT 2 — bond: flip-chip + lid ===================== */
  const { svg: svg2, controls: controls2 } = newStage('12', 'Flip-chip bonding');
  cornerTicks(svg2, 40, 40, 640, 400, 8);

  guide.say(`Now <b>bond</b> one die so it can talk to the outside world. It lands on a <b>substrate</b> — the little circuit board that carries the die and routes its signals out to pins. The substrate is studded with tiny <b>solder bumps</b>: metal balls that melt to join each pad on the die to a matching contact below. The method is called <b>flip-chip</b>: the die is flipped face-down so every one of its pads meets a bump in a single press — no wires strung by hand.`);

  const dieW = 90, dieH = 90;
  const dieTile = { g: svgEl('g', { class: 'tile', 'aria-label': 'die' }), value: 'DIE', w: dieW, h: dieH, home: { x: 90, y: 300 }, tx: 0, ty: 0, slot: null };
  dieTile.g.innerHTML = `
    <rect width="${dieW}" height="${dieH}" rx="4" class="tile-bg"/>
    <g stroke="var(--blue)" stroke-width=".7" opacity=".8">
      <path d="M8 22 H82 M8 44 H82 M8 66 H82 M22 8 V82 M44 8 V82 M66 8 V82"/>
    </g>
    <text x="${dieW / 2}" y="${dieH / 2 + 4}" class="gate-lbl" font-size="11">DIE</text>`;
  svg2.appendChild(dieTile.g);

  const slotW = 130, slotH = 130, slotX = 400, slotY = 190;
  const slotRect = svgEl('rect', { x: slotX, y: slotY, width: slotW, height: slotH, class: 'slot' });
  svg2.appendChild(slotRect);
  const slotQ = svgEl('text', { x: slotX + slotW / 2, y: slotY + slotH / 2 + 9, class: 'slot-q' });
  slotQ.textContent = '?';
  svg2.appendChild(slotQ);
  const substrateLbl = svgEl('text', { x: slotX + slotW / 2, y: slotY + slotH + 24, class: 'lbl-strong' });
  substrateLbl.textContent = 'SUBSTRATE — solder bumps';
  svg2.appendChild(substrateLbl);
  // solder bump dots inside the slot, hinting the bed the die lands on
  const bumpLayer = svgEl('g');
  for (let iy = 0; iy < 4; iy++) for (let ix = 0; ix < 4; ix++){
    bumpLayer.appendChild(svgEl('circle', {
      cx: slotX + 20 + ix * 30, cy: slotY + 20 + iy * 30, r: 2.4, fill: 'var(--amber)', opacity: 0.55,
    }));
  }
  svg2.appendChild(bumpLayer);

  const slot = { x: slotX, y: slotY, w: slotW, h: slotH, rect: slotRect, q: slotQ, value: null, tile: null, correct: 'DIE' };

  const placer = makePlacer({
    svg: svg2, tiles: [dieTile], slots: [slot],
    validate: v => v[0] === 'DIE',
    onWrong: () => guide.note(`Drag the die onto the substrate's marked slot.`),
    onPlace: () => { slotQ.style.opacity = '0'; },
  });

  await flow.ask(async replay => {
    if (replay !== undefined){ placer.autoPlace(); slotQ.style.opacity = '0'; return replay; }
    const cancel = flow.hintAfter(12000, `Click (or drag) the die tile, then click the dashed slot on the substrate — it'll snap face-down onto the solder bumps.`);
    await placer.done;
    cancel();
    return true;
  });

  guide.say(`Bonded. Last piece of the package: a metal lid called the <b>heat spreader</b> — it seals the die in and carries its heat up and out to a cooler. Drop it on.`);
  await guide.button('Drop the lid ▸');

  const lid = svgEl('rect', { x: slotX - 10, y: 30, width: slotW + 20, height: slotH + 20, rx: 6, fill: 'var(--paper-high)', stroke: 'var(--ink)', 'stroke-width': 1.6 });
  lid.style.transition = 'transform .55s cubic-bezier(.34,1.1,.4,1)';
  svg2.appendChild(lid);
  SFX.click();
  await sleep(30);
  lid.style.transform = `translateY(${slotY - 30 - 5}px)`;
  await sleep(600);
  SFX.success();

  guide.aha(`Sealed. What was sand a moment ago is now a <b>packaged chip</b> — legs bonded, lid on, ready for the one test that decides its price.`);
  await guide.next();

  /* ===================== BEAT 3 — the bin ===================== */
  const { svg: svg3, controls: controls3 } = newStage('12', 'Speed binning');
  cornerTicks(svg3, 40, 40, 640, 400, 8);

  guide.say(`Last job: <b>bin</b>. Every chip off the line — same design, same wafer even — comes out a little different, because tiny manufacturing variations make some switch faster than others. So each chip runs a speed test and gets sorted into a <b>bin</b> (a quality grade that sets its price): <b>FAST</b>, <b>TYPICAL</b>, or <b>SLOW-but-alive</b>. Your job: grade them. <em>Click a chip, then click its bin.</em>`);

  const READOUTS = [4.9, 4.2, 4.6, 3.1, 2.6, 3.8];
  function binFor(v){ return v >= 4.5 ? 'FAST' : v >= 3.0 ? 'TYPICAL' : 'SLOW'; }

  const binDefs = [
    { id: 'FAST', label: 'FAST', x: 90, w: 140 },
    { id: 'TYPICAL', label: 'TYPICAL', x: 290, w: 140 },
    { id: 'SLOW', label: 'SLOW-BUT-ALIVE', x: 490, w: 140 },
  ];
  const binY = 90, binH = 130;
  const bins = binDefs.map(b => {
    const rect = svgEl('rect', { x: b.x, y: binY, width: b.w, height: binH, class: 'slot' });
    svg3.appendChild(rect);
    const lbl = svgEl('text', { x: b.x + b.w / 2, y: binY - 14, class: 'lbl-strong' });
    lbl.textContent = b.label;
    svg3.appendChild(lbl);
    const thresholdLbl = svgEl('text', { x: b.x + b.w / 2, y: binY + binH + 20, class: 'lbl-faint' });
    thresholdLbl.textContent = b.id === 'FAST' ? '≥ 4.5 GHz' : b.id === 'TYPICAL' ? '3.0 – 4.5 GHz' : '< 3.0 GHz';
    svg3.appendChild(thresholdLbl);
    return { ...b, rect, count: 0 };
  });

  const trayY = 300;
  const chipW = 64, chipH = 64;
  const chips = READOUTS.map((v, i) => {
    const x = 60 + i * 100;
    const g = svgEl('g', { class: 'tile', 'aria-label': `chip ${v} GHz` });
    g.innerHTML = `
      <rect width="${chipW}" height="${chipH}" rx="4" class="tile-bg"/>
      <text x="${chipW / 2}" y="${chipH / 2 - 2}" class="gate-lbl" font-size="12">${v.toFixed(1)}</text>
      <text x="${chipW / 2}" y="${chipH - 10}" class="tile-cap" font-size="8">GHZ</text>`;
    svg3.appendChild(g);
    return { g, value: binFor(v), w: chipW, h: chipH, home: { x, y: trayY }, tx: 0, ty: 0, slot: null, readout: v };
  });

  // makePlacer expects one tile per slot (single-value slots) — we need many-to-one bins,
  // so drive a small custom click-chip-then-click-bin flow instead of reusing makePlacer directly.
  let armed = null;
  const placed = new Set();
  function setHome(tile, anim){
    tile.g.style.transition = anim ? 'transform .4s cubic-bezier(.22,.9,.24,1)' : 'none';
    tile.g.style.transform = `translate(${tile.tx}px,${tile.ty}px)`;
  }
  chips.forEach(t => { t.tx = t.home.x; t.ty = t.home.y; setHome(t, false); });

  function arm(t){
    chips.forEach(c => c.g.classList.remove('armed'));
    armed = t;
    if (t) t.g.classList.add('armed');
    bins.forEach(b => b.rect.classList.toggle('hot', !!t));
  }

  await flow.ask(async replay => {
    if (replay !== undefined){
      // every correct answer is deterministic from the readout — snap every chip
      // into its correct bin, stacked left to right.
      chips.forEach(t => {
        const bin = bins.find(b => b.id === t.value);
        bin.count++;
        t.tx = bin.x + 14 + (bin.count - 1) * 16;
        t.ty = binY + 20;
        setHome(t, false);
        t.g.style.pointerEvents = 'none';
        placed.add(t);
      });
      bins.forEach(b => b.rect.classList.remove('hot'));
      return replay;
    }

    let lastNote = '', lastNoteAt = 0;
    const say = msg => { const t = performance.now(); if (msg === lastNote && t - lastNoteAt < 1600) return; lastNote = msg; lastNoteAt = t; guide.note(msg); };
    const cancel = flow.hintAfter(14000,
      `Reading the thresholds: <b>≥ 4.5 GHz</b> is FAST, <b>3.0–4.5</b> is TYPICAL, <b>under 3.0</b> is SLOW-but-alive. Click a chip's number, then click the matching bin.`);

    await new Promise(resolve => {
      chips.forEach(t => {
        t.g.setAttribute('tabindex', '0'); t.g.setAttribute('role', 'button');
        const fire = () => {
          if (placed.has(t)) return;
          SFX.click();
          arm(armed === t ? null : t);
        };
        t.g.addEventListener('click', fire);
        t.g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fire(); } });
      });
      bins.forEach(b => {
        b.rect.setAttribute('tabindex', '0');
        const fire = () => {
          if (!armed) { say(`Click a chip first — its number is the speed reading.`); return; }
          if (armed.value === b.id){
            const t = armed;
            placed.add(t);
            b.count++;
            t.tx = b.x + 14 + (b.count - 1) * 16;
            t.ty = binY + 20;
            setHome(t, true);
            t.g.style.pointerEvents = 'none';
            SFX.dope();
            arm(null);
            if (placed.size === chips.length){ cancel(); resolve(); }
          } else {
            SFX.click();
            b.rect.classList.remove('shake'); void b.rect.getBoundingClientRect(); b.rect.classList.add('shake');
            say(`${armed.readout.toFixed(1)} GHz doesn't belong in <b>${b.label}</b> — check the thresholds under each bin.`);
          }
        };
        b.rect.addEventListener('click', fire);
        b.rect.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fire(); } });
      });
    });

    return chips.map(t => 1);
  });

  guide.aha(`Same wafer, same design — <b>three price tags</b>. The fast ones go to gamers and traders paying a premium for every clock cycle; the slow-but-alive ones still run a cash register just fine. Binning is why "the same" chip can cost $200 or $600.`,
    `Nothing on that wafer gets wasted — the accountants love this step more than any other in the fab.`);
  await guide.next();
}
