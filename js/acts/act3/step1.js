// ACT 3 · STEP 1 — "Grow one perfect crystal".
// Redesigned to the micro-learning contract in DESIGN_MAKEOVER.md §2 and the script in
// ACT3_MAKEOVER.md §3. The old moving-band chase is gone: chasing a drifting target with
// a slider was hand-eye work and taught nothing about crystal growth. In its place, three
// discrete pull speeds, each run as a short test pull with the lattice at the growth face
// drawn for it, then one commitment. A wrong commitment grows a whole bad ingot and hands
// the choice back with the evidence still on the stage.
//
// Physics, checked: electronic-grade silicon is refined to nine nines; silicon melts at
// 1,414 °C; a 300 mm Czochralski body is pulled at roughly 0.5 mm/min, and the pull rate
// over the temperature gradient decides which point defect wins. Pull too fast and the
// crystal comes out vacancy-rich (gaps, voids); too slow and it comes out interstitial-
// rich (extra silicon atoms wedged between sites), and the furnace runs for days longer.
// A 1.6 m body of 300 mm silicon is about 265 kg, and slices into over a thousand wafers
// at the SEMI thickness of 0.775 mm.
//
// Colour, per DESIGN.md §1a: red is only ever a break in the pattern (meaning 2, "something
// lost or broken" — this scene has no carriers, so there is no clash with Act 1's hole);
// amber is the melt's heat and the furnace hours, which are cost. Ink carries everything
// else, and the two kinds of defect are told apart by dash pattern, not by a new colour.
//
// Determinism: every defect map comes from mulberry32 with the seed recorded through
// flow.ask, so a replay draws exactly the crystal the player saw. No Math.random, no
// Date.now, no bare setTimeout loops.
import { svgEl, el, sleep, waitFor } from '../../engine/util.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeChip, cornerTicks } from '../../engine/components.js';
import { mulberry32 } from '../../engine/fab.js';

/* ---------- the puller, drawn down the left of the stage ---------- */
const CX = 190;                       // furnace centre line
const MELT_Y = 372;                   // the melt's surface: the growth front never leaves it
const CRU_BOT = 442, CRU_HW = 88;
const SEED_W = 12, SEED_H = 30;
const SEED_HIGH = 196;                // where the seed hangs before it is dipped
const BODY_W = 68, CONE = 26;
const PULL_MAX = 222;                 // full body length on screen = 1.6 m of crystal

/* ---------- the magnifier, drawn down the right ---------- */
const PX = 396, PY = 86, PW = 292, PH = 232;
const COLS = 8, ROWS = 5;
const AX = i => PX + 30 + i * 33;     // 426 … 657
const AY = r => PY + 44 + r * 32;     // 130 … 258, row 4 is the growth face
const MELT_LINE = 282;

/* three speeds, in mm per minute, against a 1.6 m body */
const SPEEDS = {
  fast:  { mm: '1.5', hours: 18,  ms: 900,  seed: 11 },
  right: { mm: '0.5', hours: 53,  ms: 1700, seed: 23 },
  slow:  { mm: '0.2', hours: 133, ms: 2500, seed: 37 },
};
const FACE = {
  fast:  'ATOMS MISSING FROM THE ROWS',
  right: 'EVERY SITE FILLED',
  slow:  'EXTRA ATOMS BETWEEN THE ROWS',
};

/* The seed is a constant rather than a sampled value, because there is no entropy source
   in this engine that survives a replay. It still goes through flow.ask, so the replay
   path reads the seed off the record instead of off this file. */
const BASE_SEED = 0x51C0;

export async function step1(){
  guide.title('STEP 1 / 5 · NANOVOLT MATERIALS', 'Grow <em>one perfect crystal</em>');
  guide.cards();

  const stage = newStage('09', 'Czochralski crystal pull, with the lattice at the growth face');
  const { svg, controls } = stage;

  /* ================= the puller ================= */
  const rigG = svgEl('g');
  svg.appendChild(rigG);

  const crucible = svgEl('path', {
    d: `M${CX - CRU_HW - 9} ${MELT_Y - 8} Q${CX - CRU_HW - 9} ${CRU_BOT + 8} ${CX} ${CRU_BOT + 8} Q${CX + CRU_HW + 9} ${CRU_BOT + 8} ${CX + CRU_HW + 9} ${MELT_Y - 8}`,
    fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.6,
  });
  const melt = svgEl('path', {
    d: `M${CX - CRU_HW} ${MELT_Y} Q${CX - CRU_HW} ${CRU_BOT} ${CX} ${CRU_BOT} Q${CX + CRU_HW} ${CRU_BOT} ${CX + CRU_HW} ${MELT_Y} Z`,
    fill: 'var(--amber-soft)', stroke: 'var(--amber)', 'stroke-width': 1.5,
  });
  const meltT = svgEl('text', { x: CX, y: CRU_BOT - 12, class: 'lbl-faint' });
  meltT.textContent = '1,414 °C';
  rigG.append(crucible, melt, meltT);

  const rod = svgEl('line', { x1: CX, y1: 14, x2: CX, y2: SEED_HIGH, stroke: 'var(--ink)', 'stroke-width': 3 });
  const seed = svgEl('rect', {
    x: CX - SEED_W / 2, y: SEED_HIGH, width: SEED_W, height: SEED_H, rx: 2,
    fill: 'var(--paper-high)', stroke: 'var(--ink)', 'stroke-width': 1.5,
  });
  const ingot = svgEl('path', { d: '', fill: 'var(--paper-high)', stroke: 'var(--ink)', 'stroke-width': 1.5 });
  const ingotDefects = svgEl('g');
  rigG.append(ingot, ingotDefects, rod, seed);

  const pullCap = svgEl('text', { x: 250, y: 296, class: 'lbl' });
  pullCap.style.opacity = '0';
  rigG.appendChild(pullCap);

  function setPull(h){
    const yTop = MELT_Y - h;
    seed.setAttribute('y', yTop - SEED_H);
    rod.setAttribute('y2', yTop - SEED_H);
    if (h <= 0.5){ ingot.setAttribute('d', ''); return; }
    const cone = Math.min(h, CONE);
    const w = SEED_W + (BODY_W - SEED_W) * (cone / CONE);
    ingot.setAttribute('d',
      `M${CX - SEED_W / 2} ${yTop} L${CX - w / 2} ${yTop + cone} L${CX - w / 2} ${MELT_Y} ` +
      `L${CX + w / 2} ${MELT_Y} L${CX + w / 2} ${yTop + cone} L${CX + SEED_W / 2} ${yTop} Z`);
  }
  function setSeedHeight(y){
    seed.setAttribute('y', y);
    rod.setAttribute('y2', y);
  }

  /* the detail box on the growth front, and its leaders out to the magnifier */
  const detailG = svgEl('g');
  detailG.append(
    svgEl('rect', { x: CX - 24, y: MELT_Y - 22, width: 48, height: 24, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1, 'stroke-dasharray': '3 3' }),
    svgEl('line', { x1: CX + 24, y1: MELT_Y - 22, x2: PX, y2: PY, class: 'focus-leader', 'stroke-dasharray': '3 4' }),
    svgEl('line', { x1: CX + 24, y1: MELT_Y + 2, x2: PX, y2: PY + PH, class: 'focus-leader', 'stroke-dasharray': '3 4' }),
  );
  detailG.style.opacity = '0';
  svg.appendChild(detailG);

  /* ================= the magnifier ================= */
  const panelG = svgEl('g');
  panelG.style.opacity = '0';
  svg.appendChild(panelG);
  panelG.appendChild(svgEl('rect', { x: PX, y: PY, width: PW, height: PH, rx: 3, fill: 'none', stroke: 'var(--hairline-strong)', 'stroke-width': 1 }));
  cornerTicks(panelG, PX, PY, PW, PH, 7);
  const capCrystal = svgEl('text', { x: PX + 12, y: PY + 20, class: 'lbl-faint', 'text-anchor': 'start' });
  capCrystal.textContent = 'CRYSTAL';
  const capMelt = svgEl('text', { x: PX + 12, y: MELT_LINE + 20, class: 'lbl-faint', 'text-anchor': 'start' });
  capMelt.textContent = 'MELT';
  panelG.appendChild(svgEl('line', { x1: PX + 10, y1: MELT_LINE, x2: PX + PW - 10, y2: MELT_LINE, stroke: 'var(--amber)', 'stroke-width': 1.2, 'stroke-dasharray': '6 4' }));
  const latG = svgEl('g');
  const meltG = svgEl('g');
  panelG.append(latG, meltG, capCrystal, capMelt);

  const faceCap = svgEl('text', { x: PX + PW / 2, y: PY + PH + 26, class: 'lbl-strong' });
  faceCap.textContent = '';
  svg.appendChild(faceCap);

  /* loose atoms below the line: same size as the bonded ones, no order, half opacity */
  function drawMelt(seedNum){
    meltG.innerHTML = '';
    const rng = mulberry32(seedNum + 91);
    for (let k = 0; k < 22; k++){
      const c = svgEl('circle', {
        cx: (PX + 62 + rng() * (PW - 84)).toFixed(1),      // clear of the MELT caption
        cy: (MELT_LINE + 12 + rng() * 26).toFixed(1),
        r: 5, class: 'atom-c',
      });
      c.style.opacity = '.45';
      meltG.appendChild(c);
    }
  }

  /* The lattice at the growth face. `rows` lets the first layer land on an empty site.
     Every mode draws from its own stream off the recorded seed, so live and replay match. */
  let rowNodes = [];
  function drawLattice(mode, seedNum, rows = ROWS){
    latG.innerHTML = '';
    rowNodes = [];
    const rng = mulberry32(seedNum + SPEEDS[mode].seed);
    const first = ROWS - rows;                       // rows fill from the bottom up
    const gaps = new Set();
    const extras = [];
    if (mode === 'fast'){
      let guard = 0;
      while (gaps.size < 6 && guard++ < 400){
        const r = first + Math.floor(rng() * rows);
        const c = Math.floor(rng() * COLS);
        if (r > first || rows === 1) gaps.add(r * COLS + c);
      }
    }
    if (mode === 'slow'){
      for (let k = 0; k < 7; k++){
        const r = first + Math.floor(rng() * Math.max(1, rows - 1));
        const c = Math.floor(rng() * (COLS - 1));
        extras.push({ x: AX(c) + 16.5, y: AY(r) + 16 });
      }
    }
    const jit = mode === 'fast' ? 2.6 : 0;
    const pos = [];
    for (let r = 0; r < ROWS; r++){
      pos[r] = [];
      for (let c = 0; c < COLS; c++){
        pos[r][c] = r < first ? null : {
          x: AX(c) + (rng() - 0.5) * 2 * jit,
          y: AY(r) + (rng() - 0.5) * 2 * jit,
          gap: gaps.has(r * COLS + c),
        };
      }
    }
    const bonds = svgEl('g');
    latG.appendChild(bonds);
    for (let r = first; r < ROWS; r++) for (let c = 0; c < COLS; c++){
      const a = pos[r][c];
      if (!a || a.gap) continue;
      const right = pos[r][c + 1], down = r + 1 < ROWS ? pos[r + 1][c] : null;
      if (right && !right.gap) bonds.appendChild(svgEl('line', { x1: a.x, y1: a.y, x2: right.x, y2: right.y, class: 'bond' }));
      if (down && !down.gap) bonds.appendChild(svgEl('line', { x1: a.x, y1: a.y, x2: down.x, y2: down.y, class: 'bond' }));
    }
    for (let r = first; r < ROWS; r++){
      const row = [];
      for (let c = 0; c < COLS; c++){
        const a = pos[r][c];
        let n;
        if (a.gap){
          n = svgEl('circle', { cx: a.x, cy: a.y, r: 5.5, fill: 'none', stroke: 'var(--red)', 'stroke-width': 1.4, 'stroke-dasharray': '2.5 2.5' });
        } else {
          n = svgEl('circle', { cx: a.x, cy: a.y, r: 5.5, class: 'atom-c' });
        }
        latG.appendChild(n);
        row.push(n);
      }
      rowNodes[r] = row;
    }
    for (const e of extras) latG.appendChild(svgEl('circle', { cx: e.x, cy: e.y, r: 3.6, class: 'defect-dot' }));
    return mode === 'fast' ? gaps.size : mode === 'slow' ? extras.length : 0;
  }

  /* ================= readouts ================= */
  /* `.chip b` is blue, which is a live signal in this course's palette and would be wrong
     on a speed or a defect count. Only the furnace hours take a colour (amber, cost) and
     the break count (red, broken) once there is something broken to count. */
  const chipSpeed = makeChip(controls, 'PULL SPEED: —');
  const chipTime = makeChip(controls, 'FURNACE TIME: <b>—</b>', 'warm');
  const chipBreak = makeChip(controls, 'BREAKS IN THIS PATCH: —');
  const setReadout = (mode, breaks) => {
    chipSpeed.set(`PULL SPEED: ${SPEEDS[mode].mm} mm/min`);
    chipTime.set(`FURNACE TIME: <b>${SPEEDS[mode].hours} h</b>`);
    chipBreak.set(breaks
      ? `BREAKS IN THIS PATCH: <b style="color:var(--red)">${breaks}</b>`
      : 'BREAKS IN THIS PATCH: 0');
    faceCap.textContent = FACE[mode];
    faceCap.style.fill = mode === 'right' ? 'var(--ink)' : 'var(--red)';
  };

  /* ================= cards ================= */

  guide.say(`A transistor only works if the silicon under it is one unbroken pattern of
    atoms. Here you grow that crystal, then slice it into wafers.`);
  stage.focus(rigG, { label: 'crystal puller', at: 'right' });
  await guide.next();

  guide.say(`This is refined sand: 99.9999999% silicon, nine nines, held molten at 1,414 °C.
    Pure is not enough on its own. Every atom still has to land in the right place.`);
  stage.focus(melt, { label: 'the melt', at: 'left' });
  await guide.next();

  guide.say(`The rod holds a seed crystal, a small bar of silicon whose atoms already sit in
    perfect order. Everything grown below it copies that order.`);
  stage.focus(seed, { label: 'seed crystal', at: 'right' });
  await guide.next();

  guide.say(`Touch the seed to the melt, then pull it back up. Silicon freezes onto its
    underside as it rises.`);
  stage.clearFocus();
  await guide.button('Dip the seed ▸');

  await Anim.tween(700, p => setSeedHeight(SEED_HIGH + (MELT_Y - SEED_H - SEED_HIGH) * p));
  if (!flow.instant) SFX.dope();
  setPull(0);

  /* The seed is fixed, so the cards before the test pulls draw the same lattice live and
     on replay. It is still recorded, below, as part of the test-pull answer, and the
     replay path reads it back off that record rather than off this file. */
  let seedNum = BASE_SEED;
  drawMelt(seedNum);
  drawLattice('right', seedNum, 4);
  await Anim.tween(420, p => { panelG.style.opacity = String(p); detailG.style.opacity = String(p * 0.9); });
  panelG.style.opacity = '1';

  guide.say(`The panel magnifies the boundary where the crystal meets the melt. Each ink
    circle is one silicon atom. The ones below the dashed line are still liquid.`);
  stage.focus(panelG, { label: 'growth face', at: 'top' });
  await guide.next();

  guide.say(`An atom in the melt attaches to the row above it and takes that row's spacing.
    Watch one layer land.`);
  stage.clearFocus();
  await guide.button('Freeze one layer ▸');

  {
    const rng = mulberry32(seedNum + 5);
    const movers = [];
    for (let c = 0; c < COLS; c++){
      const sx = PX + 26 + rng() * (PW - 52), sy = MELT_LINE + 12 + rng() * 28;
      const n = svgEl('circle', { cx: sx, cy: sy, r: 5.5, class: 'atom-c' });
      latG.appendChild(n);
      movers.push({ n, sx, sy, tx: AX(c), ty: AY(4) });
    }
    await Anim.tween(900, p => movers.forEach(m => {
      m.n.setAttribute('cx', (m.sx + (m.tx - m.sx) * p).toFixed(2));
      m.n.setAttribute('cy', (m.sy + (m.ty - m.sy) * p).toFixed(2));
    }));
    if (!flow.instant) SFX.blip();
    drawLattice('right', seedNum, ROWS);
    drawMelt(seedNum);
  }

  guide.say(`That layer is about 0.24 nm thick. A finished ingot is 1.6 m of them, every
    atom sitting where the row below it says.`);
  stage.focus(rowNodes[ROWS - 1], { label: 'one layer of atoms', at: 'bottom' });
  await guide.next();

  /* ================= the three test pulls ================= */

  async function testPull(mode){
    pullCap.textContent = 'TEST PULL';
    pullCap.style.opacity = '1';
    ingotDefects.innerHTML = '';
    setPull(0);
    await Anim.tween(SPEEDS[mode].ms, p => setPull(30 * p));
    const breaks = drawLattice(mode, seedNum, ROWS);
    setReadout(mode, breaks);
    if (!flow.instant) SFX.blip();
  }

  guide.say(`Pull speed decides how well each layer lands. Run a short test at all three
    speeds and watch the growth face. <b>Your goal: a full ingot with no breaks in it.</b>`);
  stage.clearFocus();

  const testBtns = {};
  ['fast', 'right', 'slow'].forEach(mode => {
    const b = el('button', { class: 'btn primary', 'data-label': `test-${SPEEDS[mode].mm.replace('.', '-')}` },
      `TEST ${SPEEDS[mode].mm} mm/min`);
    testBtns[mode] = b;
    controls.appendChild(b);
  });

  await flow.ask(async replay => {
    const spend = mode => { testBtns[mode].disabled = true; testBtns[mode].classList.add('used'); };
    if (replay !== undefined){
      seedNum = replay.seed;
      ['fast', 'right', 'slow'].forEach(spend);
      setPull(30);
      pullCap.textContent = 'TEST PULL';
      pullCap.style.opacity = '1';
      const last = replay.order[replay.order.length - 1];
      setReadout(last, drawLattice(last, seedNum, ROWS));
      return replay;
    }
    const order = [];
    let busy = false;
    for (const mode of ['fast', 'right', 'slow']){
      testBtns[mode].addEventListener('click', async () => {
        if (busy || order.includes(mode)) return;
        busy = true;
        SFX.click();
        spend(mode);
        order.push(mode);
        await testPull(mode);
        busy = false;
      });
    }
    await waitFor(() => order.length === 3 && !busy, { hold: 320 });
    return { seed: seedNum, order };
  });

  Object.values(testBtns).forEach(b => b.remove());
  pullCap.style.opacity = '0';
  setPull(0);

  setReadout('fast', drawLattice('fast', seedNum, ROWS));
  guide.say(`At 1.5 mm/min the row closes before every atom has arrived. Each gap left
    behind is a permanent break in the pattern.`);
  // faceCap sits outside panelG, so it has to be raised with it or the scrim dims the
  // one line that says what the card is talking about. Document order: panelG, faceCap.
  stage.focus([panelG, faceCap], { label: 'pulled at 1.5 mm/min', at: 'top' });
  await guide.next();

  stage.clearFocus();
  setReadout('slow', drawLattice('slow', seedNum, ROWS));
  guide.say(`At 0.2 mm/min extra silicon atoms have time to squeeze between the rows and
    clump. The furnace also runs for five days instead of two.`);
  stage.focus([panelG, faceCap], { label: 'pulled at 0.2 mm/min', at: 'top' });
  await guide.next();

  /* ================= commit to one speed ================= */

  async function fullPull(mode){
    ingotDefects.innerHTML = '';
    setPull(0);
    await Anim.tween(SPEEDS[mode].ms + 600, p => setPull(PULL_MAX * p));
    const breaks = drawLattice(mode, seedNum, ROWS);
    setReadout(mode, breaks);
    if (mode !== 'right'){
      const rng = mulberry32(seedNum + SPEEDS[mode].seed + 3);
      for (let k = 0; k < 26; k++){
        ingotDefects.appendChild(svgEl('circle', {
          cx: (CX - BODY_W / 2 + 7 + rng() * (BODY_W - 14)).toFixed(1),
          cy: (MELT_Y - PULL_MAX + CONE + 6 + rng() * (PULL_MAX - CONE - 12)).toFixed(1),
          r: 2.4, class: 'defect-dot',
        }));
      }
    }
    if (!flow.instant) (mode === 'right' ? SFX.success() : SFX.hop());
  }

  const wrongCard = {
    fast: `Pulled at 1.5 mm/min, the whole body came out like the test patch. Every red mark
      is a break in the pattern, and a chip printed over one is scrap.`,
    slow: `0.2 mm/min held the furnace for 133 hours and still left clumps of extra atoms
      through the body, marked in red.`,
  };

  let attempt = 0, choice;
  for (;;){
    stage.clearFocus();
    guide.say(attempt === 0
      ? `One speed filled every site. Pick the speed for the full 1.6 m pull.`
      : `The last ingot is beside you and the growth face is on the right. Pick again.`);
    choice = await guide.choose([
      { label: '1.5 mm/min', value: 'fast', hint: '18 hours in the furnace' },
      { label: '0.5 mm/min', value: 'right', hint: '53 hours in the furnace' },
      { label: '0.2 mm/min', value: 'slow', hint: '133 hours in the furnace' },
    ]);
    await fullPull(choice);
    if (choice === 'right') break;
    guide.say(wrongCard[choice]);
    stage.focus(ingotDefects, { label: 'breaks', at: 'left' });
    await guide.button('Grow another ingot ▸');
    stage.clearFocus();
    attempt++;
  }

  guide.say(`One crystal, 300 mm across and 1.6 m long, about 265 kg. The pattern runs
    unbroken from the seed to the bottom.`);
  stage.focus(ingot, { label: 'the ingot', at: 'left' });
  await guide.next();

  guide.say(`The method is called Czochralski, after the chemist who worked it out in 1916.
    Nearly all the silicon in chips is still grown this way.`);
  stage.focus([melt, ingot], { label: 'czochralski pull', at: 'bottom' });
  await guide.next();

  /* ================= slice ================= */

  guide.say(`A fab prints on flat discs, not on logs. A wire saw cuts the ingot into wafers
    0.775 mm thick.`);
  stage.clearFocus();
  await guide.button('Slice into wafers ▸');

  await Anim.tween(360, p => { panelG.style.opacity = String(1 - p); detailG.style.opacity = String(0.9 * (1 - p)); });
  panelG.style.display = 'none'; detailG.style.display = 'none';
  faceCap.textContent = '';

  const cuts = svgEl('g');
  rigG.appendChild(cuts);
  const CUT_N = 6;
  for (let i = 1; i <= CUT_N; i++){
    const y = MELT_Y - PULL_MAX + CONE + i * ((PULL_MAX - CONE) / (CUT_N + 1));
    cuts.appendChild(svgEl('line', { x1: CX - BODY_W / 2 - 5, y1: y, x2: CX + BODY_W / 2 + 5, y2: y, stroke: 'var(--ink)', 'stroke-width': 1.2 }));
    if (!flow.instant){ SFX.blip(); await sleep(130); }
  }

  const waferG = svgEl('g');
  svg.appendChild(waferG);
  const WR = 27, WY = 208;
  const discs = [];
  for (let i = 0; i < CUT_N; i++){
    const d = svgEl('circle', { cx: CX, cy: MELT_Y - PULL_MAX / 2, r: WR, class: 'wafer-disc' });
    d.style.opacity = '0';
    waferG.appendChild(d);
    discs.push(d);
  }
  const tx = i => 392 + i * 59;
  await Anim.tween(760, p => discs.forEach((d, i) => {
    const q = Math.max(0, Math.min(1, (p - i * 0.06) / 0.7));
    d.style.opacity = String(q);
    d.setAttribute('cx', (CX + (tx(i) - CX) * q).toFixed(1));
    d.setAttribute('cy', (MELT_Y - PULL_MAX / 2 + (WY - (MELT_Y - PULL_MAX / 2)) * q).toFixed(1));
  }));
  if (!flow.instant) SFX.flow();
  const waferCap = svgEl('text', { x: 392 + 5 * 59 / 2, y: WY + 58, class: 'lbl-strong' });
  waferCap.textContent = '6 OF MORE THAN 1,000 WAFERS';
  waferG.appendChild(waferCap);

  stage.focus(waferG, { label: 'wafers', at: 'top' });
  guide.aha(`One pull, more than a thousand wafers. Each one will carry billions of the
    switches you built by hand in Act 1.`,
    `A single wafer holds more transistors than there are people alive. They get printed onto it, not placed one at a time.`);
  await guide.next();
}
