// ACT 1 · STEP 2 — "Where N meets P".
// The diode half of the old step 2, rebuilt to the micro-learning contract in
// DESIGN_MAKEOVER.md §2 and the script in ACT1_MAKEOVER.md §3: one card at a time
// (guide.cards), every card focuses and names the one thing it is about, the two
// blocks are pressed together by the player, and the barrier hill is a watched
// morph out of the depletion strip rather than a second diagram.
//
// Physics per DESIGN.md §4: holes are vacancy rings (makeCarrierGrid type 'P'),
// the fixed ions are circled dashed charges, colour is semantic (blue electrons
// and N, red holes and P), and every wire carries conventional-current chevrons,
// never carrier dots. Forward bias puts + on the P side, so conventional current
// runs P → N through the junction.
import { svgEl, sleep, waitFor, clamp } from '../engine/util.js';
import { Anim } from '../engine/anim.js';
import { SFX } from '../engine/sfx.js';
import { guide } from '../engine/guide.js';
import { flow } from '../engine/flow.js';
import { newStage } from '../engine/stage.js';
import { CurrentFlow } from '../engine/pathflow.js';
import { makeLamp, makeBattery, makeSlider, makeChip, makePlacer, slideInPanel } from '../engine/components.js';
import { axialDiode, led } from '../engine/reallife.js';
import { circuitDiode, setLabState } from '../engine/labcircuits.js';
import { makeCarrierGrid, makeDepletionBands, hopElectrons, makeBarrierHill } from '../engine/junction.js';

/* ---- geometry (720 x 480 stage user units) --------------------------------
   Two 180x160 blocks meeting at x = 310. Carrier columns sit 20, 48, 76 …
   either side of the seam, so the two nearest columns on each side (the ones
   that pair up in the hop) both fall inside the 64px depletion band and the
   third column on each side falls outside it. */
const SEAM = 310;
const BY = 170, BH = 160, BW = 180;          // block top / height / width
const PX = 130;                              // P block left edge
const DEPL = 64;                             // depletion half-width
const HILL_BASE = 150, HILL_H = 54, HILL_W = 128;
const HILL_TOP = HILL_BASE - HILL_H;
const HX0 = SEAM - HILL_W / 2, HX1 = SEAM + HILL_W / 2;
const V_ON = 0.7;                            // the barrier, in volts

async function fadeIn(nodes, dur = 320){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  list.forEach(n => { n.style.opacity = '0'; n.style.display = ''; });
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(p); }));
  list.forEach(n => { n.style.opacity = '1'; });
}
async function fadeOut(nodes, dur = 280){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(1 - p); }));
  list.forEach(n => { n.style.display = 'none'; });
}

/* the hill's curve, drawn from the same formula makeBarrierHill uses, so the
   ghost outline at the payoff sits exactly where the raised hill stood */
const hillPath = top =>
  `M${HX0} ${HILL_BASE} C${HX0 + HILL_W * 0.30} ${HILL_BASE} ${SEAM - HILL_W * 0.18} ${top} ${SEAM} ${top}` +
  ` C${SEAM + HILL_W * 0.18} ${top} ${HX1 - HILL_W * 0.30} ${HILL_BASE} ${HX1} ${HILL_BASE}`;

/* ---------- REVIEW_NOTES N-052: what happens inside the depletion layer ----------
   A zoom into the junction, after the player has found 0.7 V. Three beats, one per card:
   (A) the battery pushes carriers toward the junction from both ends: fresh electrons into
   the N side from its − end, fresh holes into the P side as its + end pulls electrons out;
   (B) the arrivals sit on the charged atoms at the layer's outer edges and cancel them, so
   the layer thins (the hill lowering, seen from inside); (C) a steady stream: electrons
   cross and fill holes on the P side, and each meeting gives up a little heat (amber, the
   heat colour). Electrons move faster than holes, which is true of silicon, so they meet on
   the P side. A and B ride Anim.tween (replay lands their end state); C is a ticker that is
   pure decoration, a function of the clock only, and is stopped before the panel leaves. */
const ZROWS = [170, 206, 242, 278, 314];
const ZSEAM = 360, ZX0 = 60, ZX1 = 660;
function junctionZoom(svg, panelFn){
  const ion = (x, y, neg) => `<g class="ion-fixed"><circle cx="${x}" cy="${y}" r="7" fill="none"
      stroke="${neg ? 'var(--blue)' : 'var(--red)'}" stroke-width="1.4" stroke-dasharray="2 2"/>
    <text x="${x}" y="${y + 3.6}" class="ion-sign" style="font-size:11px" fill="${neg ? 'var(--blue)' : 'var(--red)'}">${neg ? '−' : '+'}</text></g>`;
  const ionsIn = ZROWS.map(y => ion(345, y, true) + ion(375, y, false)).join('');
  const ionsOut = ZROWS.map(y => ion(315, y, true) + ion(405, y, false)).join('');
  const holeAt = (x, y) => `<circle cx="${x}" cy="${y}" r="6" class="carrier-h"/>`;
  const eAt = (x, y) => `<circle cx="${x}" cy="${y}" r="5.4" class="carrier-e"/>`;
  const holes = ZROWS.map(y => [285, 245, 205, 165, 125].map(x => holeAt(x, y)).join('')).join('');
  const elecs = ZROWS.map(y => [435, 475, 515, 555, 595].map(x => eAt(x, y)).join('')).join('');
  const holesNew = ZROWS.map(y => holeAt(85, y)).join('');
  const elecsNew = ZROWS.map(y => eAt(635, y)).join('');
  const panel = panelFn(svg, `
    <text x="360" y="84" class="lbl" style="fill:var(--ink)">ZOOMED IN ON THE JUNCTION, WITH THE BATTERY CONNECTED</text>
    <rect x="${ZX0}" y="150" width="${ZSEAM - ZX0}" height="184" class="p-region"/>
    <rect x="${ZSEAM}" y="150" width="${ZX1 - ZSEAM}" height="184" class="n-region"/>
    <text x="${(ZX0 + ZSEAM) / 2}" y="140" class="lbl">P SIDE</text>
    <text x="${(ZSEAM + ZX1) / 2}" y="140" class="lbl">N SIDE</text>
    <g class="z-band">
      <rect class="z-neg" x="300" y="150" width="60" height="184" style="fill:var(--blue);opacity:.08"/>
      <rect class="z-pos" x="360" y="150" width="60" height="184" style="fill:var(--red);opacity:.08"/>
      <rect class="z-hatch" x="300" y="150" width="120" height="184" fill="url(#depl-hatch)"/>
      <line class="z-edgeL" x1="300" y1="150" x2="300" y2="334" stroke="var(--ink-soft)" stroke-dasharray="4 3"/>
      <line class="z-edgeR" x1="420" y1="150" x2="420" y2="334" stroke="var(--ink-soft)" stroke-dasharray="4 3"/>
    </g>
    <line x1="${ZSEAM}" y1="150" x2="${ZSEAM}" y2="334" stroke="var(--ink)" stroke-width="1.2"/>
    <g class="z-bracket">
      <path class="z-brk" d="M300 344 v6 H420 v-6" fill="none" stroke="var(--ink-soft)" stroke-width="1"/>
      <text x="360" y="366" class="lbl" font-size="9">DEPLETION LAYER</text>
    </g>
    <g class="z-ions-in">${ionsIn}</g>
    <g class="z-ions-out">${ionsOut}</g>
    <g class="z-holes">${holes}</g>
    <g class="z-holes-new" opacity="0">${holesNew}</g>
    <g class="z-elecs">${elecs}</g>
    <g class="z-elecs-new" opacity="0">${elecsNew}</g>
    <g class="z-stream"></g>
    <path d="M14 242 H${ZX0}" stroke="var(--ink)" stroke-width="2"/>
    <path d="M${ZX1} 242 H706" stroke="var(--ink)" stroke-width="2"/>
    <text x="30" y="226" class="lbl" font-size="11" style="fill:var(--ink)">+</text>
    <text x="690" y="226" class="lbl" font-size="11" style="fill:var(--ink)">−</text>
    <text x="${ZX0}" y="404" class="lbl-faint" font-size="8.5" text-anchor="start">FROM THE BATTERY'S + END</text>
    <text x="${ZX1}" y="404" class="lbl-faint" font-size="8.5" text-anchor="end">FROM THE BATTERY'S − END</text>
    <g transform="translate(160 436)">
      <circle cx="0" cy="-4" r="5.4" class="carrier-e"/><text x="10" y="0" class="lbl-faint" font-size="8.5" text-anchor="start">FREE ELECTRON</text>
      <circle cx="140" cy="-4" r="6" class="carrier-h"/><text x="150" y="0" class="lbl-faint" font-size="8.5" text-anchor="start">HOLE</text>
      <circle cx="226" cy="-4" r="7" fill="none" stroke="var(--ink-soft)" stroke-width="1.3" stroke-dasharray="2 2"/>
      <text x="238" y="0" class="lbl-faint" font-size="8.5" text-anchor="start">CHARGED ATOM, FIXED IN PLACE</text>
    </g>`);
  const q = c => panel.g.querySelector(c);
  // the hatch pattern lives in the stage's defs, made by makeDepletionBands earlier in the step
  const setBand = f => {           // f = 1: two columns each side; 0.5: one column
    const half = 60 * f;
    q('.z-neg').setAttribute('x', ZSEAM - half); q('.z-neg').setAttribute('width', half);
    q('.z-pos').setAttribute('width', half);
    q('.z-hatch').setAttribute('x', ZSEAM - half); q('.z-hatch').setAttribute('width', 2 * half);
    ['x1', 'x2'].forEach(a => { q('.z-edgeL').setAttribute(a, ZSEAM - half); q('.z-edgeR').setAttribute(a, ZSEAM + half); });
    q('.z-brk').setAttribute('d', `M${ZSEAM - half} 344 v6 H${ZSEAM + half} v-6`);
  };
  let tick = null;
  return {
    ...panel,
    /* A: both crowds move 30 units toward the junction, and new carriers enter at the ends */
    async pushIn(){
      await Anim.tween(1300, p => {
        q('.z-holes').setAttribute('transform', `translate(${(30 * p).toFixed(1)} 0)`);
        q('.z-elecs').setAttribute('transform', `translate(${(-30 * p).toFixed(1)} 0)`);
        q('.z-holes-new').setAttribute('opacity', p.toFixed(2));
        q('.z-elecs-new').setAttribute('opacity', p.toFixed(2));
      });
    },
    /* B: the carriers that now sit on the outer ions cancel them, and the layer thins */
    async thin(){
      const firstH = [...q('.z-holes').children].filter((_, i) => i % 5 === 0);
      const firstE = [...q('.z-elecs').children].filter((_, i) => i % 5 === 0);
      await Anim.tween(1100, p => {
        q('.z-ions-out').style.opacity = String(1 - p);
        [...firstH, ...firstE].forEach(n => { n.style.opacity = String(1 - p); });
        setBand(1 - .5 * p);
      });
    },
    /* C: the steady stream. Each lane sends an electron in from the right every 1.6 s and
       a hole in from the left at the same moment; where they meet, both go and a small
       amber ring marks the heat given up. */
    stream(){
      ['.z-holes', '.z-elecs', '.z-holes-new', '.z-elecs-new'].forEach(c => { q(c).style.transition = 'opacity .4s'; q(c).style.opacity = '0'; });
      const layer = q('.z-stream');
      const VE = 120, VH = 48, PERIOD = 1.6, LIFE = (ZX1 - ZX0) / (VE + VH);
      const xMeet = ZX1 - VE * LIFE;
      const lanes = ZROWS.map((y, i) => {
        const e = svgEl('g'), h = svgEl('g'), f = svgEl('circle', { cx: xMeet, cy: y, r: 6, fill: 'none', stroke: 'var(--amber)', 'stroke-width': 1.6 });
        layer.append(e, h, f);
        return { y, e, h, f, off: i * 0.53 };
      });
      let t0 = null;
      tick = Anim.add((dt, t) => {
        if (t0 === null) t0 = t;
        const T = t - t0;
        lanes.forEach(L => {
          let eh = '', hh = '', flash = 0;
          for (let k = 0; k < 4; k++){
            const age = ((T + L.off) % PERIOD) + k * PERIOD;      // carriers launched k periods ago
            if (age < LIFE){
              eh += `<circle cx="${(ZX1 - VE * age).toFixed(1)}" cy="${L.y}" r="5.4" class="carrier-e"/>`;
              hh += `<circle cx="${(ZX0 + VH * age).toFixed(1)}" cy="${L.y}" r="6" class="carrier-h"/>`;
            } else if (age < LIFE + .45) flash = 1 - (age - LIFE) / .45;
          }
          L.e.innerHTML = eh; L.h.innerHTML = hh;
          L.f.setAttribute('r', (6 + (1 - flash) * 10).toFixed(1));
          L.f.style.opacity = flash.toFixed(2);
        });
      });
    },
    stop(){ if (tick){ Anim.remove(tick); tick = null; } },
  };
}

/* ---------- how it looks in real life (HANDOFF_NEXT.md §1) ----------
   The diode as a part: a 1N4001 (black DO-41 case, grey band) at 15 px per mm, lying with
   the cathode band on the right, then a 5 mm LED standing up with its longer anode leg on the left. Ends are labelled with the
   P and N sides the player built, so anode and cathode land on something already known. */
function realLifeHTML(){
  const ends = (cx, cy, half) => `
    <text x="${cx - half}" y="${cy + 34}" class="lbl" font-size="8.5" style="fill:var(--ink)">ANODE</text>
    <text x="${cx - half}" y="${cy + 46}" class="lbl-faint" font-size="8">P SIDE</text>
    <text x="${cx + half}" y="${cy + 34}" class="lbl" font-size="8.5" style="fill:var(--ink)">CATHODE</text>
    <text x="${cx + half}" y="${cy + 46}" class="lbl-faint" font-size="8">N SIDE</text>`;
  // Course restructure (2026-10-25): the 1N4148 is gone from the drawing, and the 1N4001
  // moves to the middle of the left column, level with the LED.
  const d2 = { cx: 214, cy: 236 };
  return `
    <g data-k="1n4001">${axialDiode({ cx: d2.cx, cy: d2.cy, mm: 15, len: 5.2, dia: 2.7, text: '4001', lead: 88 })}
      ${ends(d2.cx, d2.cy, 130)}
      <text x="${d2.cx}" y="${d2.cy - 36}" class="lbl" style="fill:var(--ink)">1N4001</text></g>
    <line x1="430" y1="70" x2="430" y2="400" stroke="var(--hairline)" stroke-dasharray="3 4"/>
    <g data-k="led">${led({ cx: 570, base: 262, mm: 15, lit: true, len: 90 })}
      <text x="${570 - 30}" y="${262 + 116}" class="lbl" font-size="8.5" text-anchor="end" style="fill:var(--ink)">ANODE</text>
      <text x="${570 - 30}" y="${262 + 128}" class="lbl-faint" font-size="8" text-anchor="end">LONGER LEG</text>
      <text x="${570 + 30}" y="${262 + 96}" class="lbl" font-size="8.5" text-anchor="start" style="fill:var(--ink)">CATHODE</text>
      <text x="${570}" y="${262 - 160}" class="lbl" style="fill:var(--ink)">A 5 MM LED</text></g>
    <text x="360" y="448" class="lbl-faint">THE DIODE, AS IT LOOKS IN REAL LIFE (PARTS DRAWN AT 15 TIMES LIFE SIZE)</text>`;
}

export async function step2(){
  guide.title('STEP 2 / 5', 'What happens where <em>N meets P?</em>');
  guide.cards();

  const stage = newStage('02', 'A PN junction: the depletion layer builds itself, then a voltage flattens it');
  const { svg, controls } = stage;

  /* ============ SCENE A — two blocks, one carrier each ====================== */

  const pBlock = svgEl('g');
  pBlock.appendChild(svgEl('rect', { x: PX, y: BY, width: BW, height: BH, class: 'p-region' }));
  const pLetter = svgEl('text', { x: PX + 24, y: BY + 88, class: 'tile-letter', fill: 'var(--red)' });
  pLetter.textContent = 'P';
  pBlock.appendChild(pLetter);
  svg.appendChild(pBlock);

  const slotRect = svgEl('rect', { x: SEAM, y: BY, width: BW, height: BH, class: 'slot' });
  const slotQ = svgEl('text', { x: SEAM + BW / 2, y: BY + 88, class: 'slot-q' });
  svg.append(slotRect, slotQ);

  const nTile = svgEl('g', { class: 'tile', 'aria-label': 'N block' });
  nTile.style.transform = `translate(520px,${BY}px)`;      // its bench position
  const nRect = svgEl('rect', { width: BW, height: BH, rx: 4, class: 'tile-bg on' });
  const nLetter = svgEl('text', { x: BW - 24, y: 88, class: 'tile-letter', fill: 'var(--blue)' });
  nLetter.textContent = 'N';
  nTile.append(nRect, nLetter);
  svg.appendChild(nTile);

  /* Carrier lattices. Columns land 20, 48 and 76 units from the seam on each
     side, so the two inner columns fall inside the 64-unit depletion band and
     the third stays outside it. The N grid lives INSIDE the tile, in tile-local
     units, so it travels with the block when the player presses it home. */
  const pGrid = makeCarrierGrid(pBlock, { x: 164, y: BY + 6, w: BW, h: BH, type: 'P', cols: 5, rows: 5 });
  const nGrid = makeCarrierGrid(nTile, { x: 6, y: 6, w: BW, h: BH, type: 'N', cols: 5, rows: 5 });
  pGrid.el.style.opacity = '0';
  nGrid.el.style.opacity = '0';

  guide.say(`In step 1 you doped silicon two ways. Here is one block of each. <b>Your goal
    is to press them together and find the voltage that pushes a current across the
    join.</b>`);
  stage.focus([pBlock, nTile], { label: 'both from step 1', at: 'bottom' });
  await guide.next();

  // Course restructure (2026-10-25): the N card and the P card are one card now. Step 1
  // has just taught both, so this only recalls which block carries which.
  await fadeIn([nGrid.el, pGrid.el], 340);
  guide.say(`The N block, doped with phosphorus, has <span class="e-blue">free
    electrons</span>. The P block, doped with boron, has <span class="e-red">holes</span>,
    drawn as rings. Both drift around their block.`);
  stage.focus([pBlock, nTile], { label: 'holes and free electrons', at: 'top' });
  await guide.next();

  /* ============ SCENE B — the player presses them flush ==================== */

  /* no focus on this card: stage.focus re-parents raised nodes, and the placer
     needs the tile and the slot answering pointer events where they sit */
  stage.clearFocus();
  const nHandle = { g: nTile, value: 'N', w: BW, h: BH, home: { x: 520, y: BY }, tx: 0, ty: 0, slot: null };
  const nSlot = { key: 'DOCK', x: SEAM, y: BY, w: BW, h: BH, correct: 'N', rect: slotRect, q: slotQ, value: null, tile: null };
  const placer = makePlacer({
    svg, tiles: [nHandle], slots: [nSlot],
    validate: v => v[0] === 'N',
    onWrong: () => {},
  });

  guide.say(`Press the two blocks together: drag the N block onto the dashed outline, or tap
    the block and then the outline.`);
  await flow.ask(async replay => {
    if (replay !== undefined){ placer.autoPlace(); return replay; }
    await placer.done;
    return true;
  });
  await sleep(460);                       // the placer's own snap transition

  /* Bake the tile's translate into its children's own coordinates. Two things
     depend on it: hopElectrons arcs its clones in stage coordinates, and
     stage.focus re-parents whatever it raises onto the SVG root, which would
     otherwise drop the ancestor transform and fling the N-side ions into the
     corner. Kill the placer's transition first, or clearing the transform
     animates the block back to the origin. */
  nTile.style.transition = 'none';
  nTile.style.transform = 'none';
  nRect.setAttribute('x', SEAM);
  nRect.setAttribute('y', BY);
  nLetter.setAttribute('x', +nLetter.getAttribute('x') + SEAM);
  nLetter.setAttribute('y', +nLetter.getAttribute('y') + BY);
  nGrid.dots.forEach(d => {
    d.cx += SEAM; d.cy += BY;
    d.node.setAttribute('cx', d.cx);
    d.node.setAttribute('cy', d.cy);
  });

  slotRect.style.display = 'none';
  slotQ.style.display = 'none';
  nRect.setAttribute('class', 'n-region');
  nRect.setAttribute('rx', '0');
  const seam = svgEl('line', { x1: SEAM, y1: BY, x2: SEAM, y2: BY + BH, class: 'junction' });
  svg.appendChild(seam);
  if (!flow.instant) SFX.success();

  guide.say(`There is no battery yet. Watch what the carriers (the free electrons and holes)
    next to the junction do on their own.`);
  stage.focus(seam, { label: 'the junction, where N meets P', at: 'top' });
  await guide.next();

  /* ============ SCENE C — the layer builds itself ========================== */

  stage.clearFocus();
  await sleep(320);

  // the two N columns nearest the seam pair with the two nearest P columns,
  // same row, nearest column first — a pure function of grid index, no randomness
  const pairs = [];
  for (let r = 0; r < 5; r++) pairs.push({ from: nGrid.at(0, r), to: pGrid.at(4, r) });
  for (let r = 0; r < 5; r++) pairs.push({ from: nGrid.at(1, r), to: pGrid.at(3, r) });
  await hopElectrons(svg, { pairs });
  /* Collected in DOCUMENT order, not hop order. stage.clearFocus restores raised
     nodes back to front and each one is put back before the sibling it recorded,
     so a list that jumps around the tree asks it to insert before a node that is
     itself still raised, and the restore throws. */
  const ionNodes = [...pGrid.dots, ...nGrid.dots].filter(d => d.state === 'ion').map(d => d.node);

  // REVIEW_NOTES N-001: say WHY they crossed. Not a voltage (both blocks start neutral):
  // diffusion, many to few. The voltage is the result, and card "stopped on its own" says so.
  guide.say(`The electrons nearest the junction crossed over and filled the nearest holes.
    No battery pushed them. The N side is crowded with free electrons and the P side has
    almost none, so electrons spread from where there are many to where there are few. This
    spreading is called <b>diffusion</b>.`);
  stage.focus(seam, { label: 'electrons crossed here', at: 'top' });
  await guide.next();

  stage.clearFocus();
  guide.say(`Each electron that crossed left behind a charged atom that is locked in the
    crystal and cannot move.`);
  stage.focus(ionNodes, { label: 'fixed ions', at: 'top' });
  await guide.next();

  stage.clearFocus();
  const bands = makeDepletionBands(svg, { cx: SEAM, y: BY, h: BH, wNeg: DEPL, wPos: DEPL });
  await fadeIn([bands.el], 420);

  guide.say(`The region around the junction now has no free electrons and no free holes.
    This region is called the <b>depletion layer</b> (a layer depleted of carriers).`);
  stage.focus(bands.el, { label: 'depletion layer', at: 'top' });
  await guide.next();

  guide.say(`The crossing stopped on its own, because the P side is now slightly negative
    and the N side slightly positive, and that pushes the next electron back.`);
  stage.focus(bands.el, { label: 'built-in push', at: 'top' });
  await guide.next();

  /* ============ SCENE D — the strip stands up into a hill ================== */

  stage.clearFocus();
  const hill = makeBarrierHill(svg, { cx: SEAM, base: HILL_BASE, w: HILL_W, hMax: HILL_H, label: false });
  hill.setBias(V_ON);                     // flat: the hill has not been raised yet
  const ties = svgEl('g');
  ties.append(
    svgEl('line', { x1: HX0, y1: BY, x2: HX0, y2: HILL_BASE, class: 'wire dim', 'stroke-dasharray': '3 3' }),
    svgEl('line', { x1: HX1, y1: BY, x2: HX1, y2: HILL_BASE, class: 'wire dim', 'stroke-dasharray': '3 3' }),
  );
  svg.appendChild(ties);
  await fadeIn([hill.el, ties], 340);
  await Anim.tween(760, p => hill.setBias(V_ON * (1 - p)));
  hill.setBias(0);
  hill.start();

  guide.say(`Here is that same push, drawn as a hill. An electron has to climb this hill to
    get across the depletion layer. Watch it slide back down.`);
  stage.focus(hill.el, { label: 'barrier', at: 'top' });
  await guide.next();

  /* ============ SCENE E — wire it up and find 0.7 V ======================= */

  stage.clearFocus();
  const wireIn = svgEl('path', { d: `M270 430 H80 V250 H${PX}`, class: 'wire' });
  const wireOut = svgEl('path', { d: `M${SEAM + BW} 250 H640 V430 H350`, class: 'wire' });
  svg.insertBefore(wireIn, pBlock);
  svg.insertBefore(wireOut, pBlock);
  const battG = makeBattery(svg, SEAM, 430);
  const battNub = battG.querySelectorAll('rect')[1];
  const battTexts = battG.querySelectorAll('.batt-t');
  const lamp = makeLamp(svg, 640, 330, { label: 'lamp' });
  lamp.set(0);

  /* forward bias puts + on the P side, so conventional current runs
     battery + → P → seam → N → battery −. Flipping moves the sign marks AND
     the terminal nub, so the polarity is legible, not just asserted. */
  function setPolarity(plusLeft){
    battTexts[0].textContent = plusLeft ? '+' : '−';
    battTexts[1].textContent = plusLeft ? '−' : '+';
    battNub.setAttribute('x', plusLeft ? SEAM - 46 : SEAM + 40);
  }
  setPolarity(true);

  const flowLayer = svgEl('g');
  svg.appendChild(flowLayer);
  const routeIn = svgEl('path', { d: wireIn.getAttribute('d'), fill: 'none', stroke: 'none' });
  const routeOut = svgEl('path', { d: wireOut.getAttribute('d'), fill: 'none', stroke: 'none' });
  svg.append(routeIn, routeOut);
  const chevIn = new CurrentFlow(routeIn, { n: 7, layer: flowLayer });
  const chevOut = new CurrentFlow(routeOut, { n: 8, layer: flowLayer });

  await fadeIn([wireIn, wireOut, battG, lamp.g], 360);

  guide.say(`Now a battery is wired across the junction so that it pushes the carriers
    toward the depletion layer. The lamp shows whether any current gets through.`);
  stage.focus([wireIn, wireOut, battG, lamp.g], { label: 'battery and lamp', at: 'bottom' });
  await guide.next();

  stage.clearFocus();
  const chipBarrier = makeChip(controls, 'barrier: <b>standing</b>');
  const chipCurrent = makeChip(controls, 'current: <b>0 mA</b>');
  const slider = makeSlider(controls, { label: 'voltage', min: 0, max: 1.5, step: 0.05, value: 0, fmt: v => v.toFixed(2) + ' V' });

  let reversed = false;
  let didFlow = false;

  /* PURE, idempotent function of (v, reversed) — replay calls it once with the
     recorded slider value and lands on exactly the live end state */
  function apply(v){
    if (reversed){
      bands.quiver(false);
      bands.setWidth(1 + v * 0.6);        // pulled apart: the empty strip grows
      hill.setBias(v, { reverse: true });
      chevIn.setSpeed(0); chevOut.setSpeed(0);
      lamp.set(0);
      // at zero the flipped battery has not pulled on anything yet, so the
      // chip must not claim a taller hill than the stage is drawing
      chipBarrier.set(v < 0.025 ? 'barrier: <b>standing</b>' : 'barrier: <b>taller</b>');
      chipBarrier.cls('state-on', false);
      chipCurrent.set('current: <b>0 mA</b>');
      chipCurrent.el.classList.remove('live');
      return;
    }
    hill.setBias(v);
    if (v < V_ON - 0.001){
      bands.setWidth(1 - v * 0.35);
      bands.quiver(!flow.instant && v > 0.45);
      chevIn.setSpeed(0); chevOut.setSpeed(0);
      lamp.set(0);
      chipBarrier.set('barrier: <b>standing</b>'); chipBarrier.cls('state-on', false);
      chipCurrent.set('current: <b>0 mA</b>');
      chipCurrent.el.classList.remove('live');
    } else {
      bands.quiver(false);
      bands.collapse();
      const mA = 1 + Math.round((v - V_ON) * 45);
      const spd = 60 + (v - V_ON) * 220;
      chevIn.setSpeed(spd); chevOut.setSpeed(spd);
      lamp.set(clamp(0.3 + (v - V_ON) / 0.8, 0, 1));
      chipBarrier.set('barrier: <b>flat</b>'); chipBarrier.cls('state-on', true);
      chipCurrent.set(`current: <b>${mA} mA</b>`);
      chipCurrent.el.classList.toggle('live', +mA > 0);
      if (!didFlow){ didFlow = true; if (!flow.instant) SFX.flow(); }
    }
  }
  slider.on(apply);
  apply(0);

  guide.say(`<b>Your goal is to raise the voltage until current flows.</b> Each step up in
    voltage lowers the hill.`);
  await flow.ask(async replay => {
    if (replay !== undefined){ slider.set(replay); apply(replay); return replay; }
    const cancel = flow.hintAfter(16000, `Keep raising the voltage. The hill gets shorter with every step up.`);
    // hintAfter writes through guide.note, which in card mode overwrites the
    // card, so it is cancelled the moment the player touches the dial
    const off = () => { cancel(); slider.input.removeEventListener('input', off); };
    slider.input.addEventListener('input', off);
    await waitFor(() => slider.value >= V_ON - 0.001, { hold: 600 });
    off();
    return slider.value;
  });

  const ghost = svgEl('path', {
    class: 'hill-curve', fill: 'none', d: hillPath(HILL_TOP),
    'stroke-dasharray': '4 4', style: 'opacity:.5',
  });
  /* dimension line clear of the curve, with a dashed extension off the peak */
  const MX = HX1 + 22;
  const measure = svgEl('g');
  measure.appendChild(svgEl('path', {
    d: `M${SEAM} ${HILL_TOP} H${MX + 8}`,
    fill: 'none', stroke: 'var(--hairline-strong)', 'stroke-width': 1, 'stroke-dasharray': '3 3',
  }));
  measure.appendChild(svgEl('path', {
    d: `M${MX - 8} ${HILL_BASE} H${MX + 8} M${MX - 8} ${HILL_TOP} H${MX + 8} M${MX} ${HILL_BASE} V${HILL_TOP}`,
    fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1,
  }));
  const measureT = svgEl('text', {
    x: MX + 14, y: (HILL_BASE + HILL_TOP) / 2 + 4, class: 'lbl',
    style: 'text-anchor:start;font-style:italic',
  });
  measureT.textContent = '0.7 V';
  measure.appendChild(measureT);
  svg.append(ghost, measure);
  await fadeIn([ghost, measure], 340);

  guide.say(`The hill is 0.7 V tall. Below that voltage the electron slid back every time;
    above it, current flows.`);
  stage.focus([ghost, measure], { label: 'hill height', at: 'right' });
  await guide.next();

  /* REVIEW_NOTES N-052: the same thing seen from inside the depletion layer */
  stage.clearFocus();
  const zoom = junctionZoom(svg, slideInPanel);
  await zoom.show();
  // Course restructure (2026-10-25): the push-in card and the thinning card are one card.
  // The text lands first, then both animations play under it in order.
  guide.say(`Inside, the battery's − end pushes electrons into the N side, and its + end
    pulls electrons out of the P side, leaving holes. These new carriers cancel the charged
    atoms at the depletion layer's edges, so the layer thins and the hill drops.`);
  await zoom.pushIn();
  await zoom.thin();
  await guide.next();

  zoom.stream();
  guide.say(`At 0.7 V the layer is too thin to hold them back. Electrons cross the junction and
    fill holes on the P side, giving off a little heat, while the battery keeps sending more.
    That steady stream is the current.`);
  await guide.next();
  zoom.stop();
  await zoom.hide();
  // Course restructure (2026-10-25): the conventional-current reminder card is cut. Step 1
  // teaches it and step 3 recalls it; the chevrons on the wire still run + to −.

  /* ============ SCENE F — flip it, and nothing helps ====================== */

  stage.clearFocus();
  guide.say(`If you turn the battery around, the carriers (electrons and holes) get pulled
    away from the depletion layer instead of being pushed toward it.`);
  stage.focus(battG, { label: 'battery', at: 'top' });
  await guide.button('Flip the battery ↺');

  stage.clearFocus();
  reversed = true;
  setPolarity(false);
  slider.set(0);
  apply(0);

  guide.say(`<b>Your goal is to turn the voltage all the way up and confirm that nothing
    flows.</b> Watch the depletion layer and the hill as you go.`);
  await flow.ask(async replay => {
    if (replay !== undefined){ slider.set(replay); apply(replay); return replay; }
    const cancel = flow.hintAfter(16000, `Drag the dial to the top of its range and look at the lamp.`);
    const off = () => { cancel(); slider.input.removeEventListener('input', off); };
    slider.input.addEventListener('input', off);
    await waitFor(() => slider.value >= 1.45, { hold: 600 });
    off();
    return slider.value;
  });

  guide.say(`The depletion layer got wider and the hill got taller. In this direction, no
    voltage gets an electron across.`);
  stage.focus(hill.el, { label: 'taller barrier', at: 'top' });
  await guide.next();

  stage.clearFocus();
  // Course restructure (2026-10-25): the payoff now answers the step's premise, which asked
  // what silicon gives us that a copper wire does not.
  guide.aha(`You have built a <b>diode</b>: a one-way street for current. It passes current
    in one direction and blocks it in the other.`,
    `A voltage raises or lowers the barrier. That control is the basis of every switch in a chip. Copper cannot do this.`);
  await guide.next();

  /* how it looks in real life (HANDOFF_NEXT.md §1) */
  // Course restructure (2026-10-25): the 1N4148 card is cut. The 1N4001 card opens the lab
  // and carries the band, cathode and anode the 1N4148 card used to introduce.
  stage.clearFocus();
  const real = slideInPanel(svg, realLifeHTML(), { lab: true });
  real.focus('1n4001');
  await real.show();
  guide.lab(`Here is the diode you built, sold as a part: the 1N4001. The grey band marks the
    N side, called the <b>cathode</b>. The P side is the <b>anode</b>. Like yours, it lets
    current through from P to N once about 0.7 V is applied, up to 1 amp.`, { intro: true });
  await guide.next();

  real.focus('led');
  guide.lab(`An LED is a diode too, made from other materials, such as gallium nitride. When an
    electron crosses its junction and fills a hole, it gives off light. Its longer leg is the
    anode.`);
  await guide.next();

  const board = slideInPanel(svg, circuitDiode(), { lab: true });
  setLabState(board, true);
  await real.swapTo(board);      // N-053: no flash of the stage between panels
  guide.lab(`Here is your diode test on a breadboard. Current leaves the + rail, passes through
    the 1N4001 with its band towards the LED, then through a resistor and the LED to ground.
    The LED lights.`);
  await guide.next();

  setLabState(board, false);
  guide.lab(`Turn the diode round, band towards the supply, and the LED goes out, just as your
    lamp did when you flipped the battery.`);
  await guide.next();
  await board.hide();
}
