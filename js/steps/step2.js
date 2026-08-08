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
import { makeLamp, makeBattery, makeSlider, makeChip, makePlacer } from '../engine/components.js';
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

export async function step2(){
  guide.title('STEP 2 / 5 · NANOVOLT SEMICONDUCTORS', 'Where <em>N meets P</em>');
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

  guide.say(`In step 1 you doped silicon two ways. Here is a block of each.
    <b>Your goal: press them together and find the voltage that pushes current across.</b>`);
  stage.focus([pBlock, nTile], { label: 'both from step 1', at: 'bottom' });
  await guide.next();

  await fadeIn([nGrid.el], 340);
  guide.say(`This block got phosphorus. Each phosphorus atom left one
    <span class="e-blue">spare electron</span> that no bond holds, so it drifts freely.`);
  stage.focus(nTile, { label: 'n-type', at: 'top' });
  await guide.next();

  await fadeIn([pGrid.el], 340);
  guide.say(`This one got boron. Each boron atom left a bond one electron short. That empty
    seat is a <span class="e-red">hole</span>, drawn as a ring, and it drifts too.`);
  stage.focus(pBlock, { label: 'p-type', at: 'top' });
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

  guide.say(`Press them flush. Drag the N block onto the dashed outline, or tap the block
    and then the outline.`);
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

  guide.say(`No battery yet. Watch what the carriers next to the seam do on their own.`);
  stage.focus(seam, { label: 'the seam', at: 'top' });
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

  guide.say(`The nearest electrons crossed and filled the nearest holes. Each one left a
    charged atom behind, locked in the crystal, unable to move.`);
  stage.focus(ionNodes, { label: 'fixed ions', at: 'top' });
  await guide.next();

  stage.clearFocus();
  const bands = makeDepletionBands(svg, { cx: SEAM, y: BY, h: BH, wNeg: DEPL, wPos: DEPL });
  await fadeIn([bands.el], 420);

  guide.say(`The strip they left has no free electrons and no free holes in it. That strip
    is the <b>depletion layer</b>.`);
  stage.focus(bands.el, { label: 'depletion layer', at: 'top' });
  await guide.next();

  guide.say(`It stopped on its own. The P side is now slightly negative and the N side
    slightly positive, and that pushes the next electron back.`);
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

  guide.say(`Same push, drawn as height. An electron has to climb this hill to get across
    the seam. Watch it slide back.`);
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

  guide.say(`A battery now sits across the junction, wired to push carriers toward the seam.
    The lamp shows whether anything gets through.`);
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
    } else {
      bands.quiver(false);
      bands.collapse();
      const mA = 1 + Math.round((v - V_ON) * 45);
      const spd = 60 + (v - V_ON) * 220;
      chevIn.setSpeed(spd); chevOut.setSpeed(spd);
      lamp.set(clamp(0.3 + (v - V_ON) / 0.8, 0, 1));
      chipBarrier.set('barrier: <b>flat</b>'); chipBarrier.cls('state-on', true);
      chipCurrent.set(`current: <b>${mA} mA</b>`);
      if (!didFlow){ didFlow = true; if (!flow.instant) SFX.flow(); }
    }
  }
  slider.on(apply);
  apply(0);

  guide.say(`<b>Your goal: raise the voltage until current flows.</b> Every step up takes
    height off the hill.`);
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

  guide.say(`0.7 V is the height of that hill, measured in volts. Below it the electron slid
    back every time.`);
  stage.focus([ghost, measure], { label: 'hill height', at: 'right' });
  await guide.next();

  guide.say(`The arrows on the wire run from + to −. That is conventional current. The
    electrons inside the silicon go the other way, as in step 1.`);
  stage.focus([wireIn, wireOut, flowLayer], { label: 'conventional current', at: 'bottom' });
  await guide.next();

  /* ============ SCENE F — flip it, and nothing helps ====================== */

  stage.clearFocus();
  guide.say(`Turn the battery around and it pulls carriers away from the seam instead of
    pushing them toward it.`);
  stage.focus(battG, { label: 'battery', at: 'top' });
  await guide.button('Flip the battery ↺');

  stage.clearFocus();
  reversed = true;
  setPolarity(false);
  slider.set(0);
  apply(0);

  guide.say(`<b>Your goal: turn the voltage all the way up and confirm nothing flows.</b>
    Watch the strip and the hill as you go.`);
  await flow.ask(async replay => {
    if (replay !== undefined){ slider.set(replay); apply(replay); return replay; }
    const cancel = flow.hintAfter(16000, `Drag the dial to the top of its range and look at the lamp.`);
    const off = () => { cancel(); slider.input.removeEventListener('input', off); };
    slider.input.addEventListener('input', off);
    await waitFor(() => slider.value >= 1.45, { hold: 600 });
    off();
    return slider.value;
  });

  guide.say(`The strip got wider and the hill got taller. No voltage in this direction gets
    an electron across.`);
  stage.focus(hill.el, { label: 'taller barrier', at: 'top' });
  await guide.next();

  stage.clearFocus();
  guide.aha(`You built a <b>diode</b>. It passes current one way and blocks the other.`,
    `A voltage raises or lowers the barrier. That control is the basis of every switch in a chip.`);
  await guide.next();
}
