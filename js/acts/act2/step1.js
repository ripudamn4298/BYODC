// ACT 2 · STEP 1 — "Weigh two inputs at once" (the NAND gate).
// Ported to the micro-learning contract in DESIGN_MAKEOVER.md §2 / §4: one card at a time
// (guide.cards), every card focuses and names the one thing it is about, and the step opens
// on the CMOS inverter the player finished Act 1 with (rule 4) before anything new appears.
//
// CS-correctness per DESIGN.md §5b is unchanged: NAND is taught as THE universal gate,
// NOT = NAND with its inputs tied, AND = NAND + NOT. Signals speak in logic levels
// (cobalt when HIGH, hairline when LOW), never Act 1's conventional-current chevrons.
// Colour stays semantic per DESIGN.md §4: blue for a 1 and for the N-type switch, red for
// the P-type switch whose carriers are holes, amber only for the gate oxide.
//
// Layout note: A enters from the left and B from the right, so the four gate wires reach
// their switches with no crossings at all. That matters here because two cards highlight
// one input's path while the rest of the stage is dimmed.
//
// Determinism: every interaction records the value it left behind (the inverter's input,
// the A/B pair), so a replay lands on the same state as a live run. No Math.random, no
// Date.now, no bare setTimeout driving a visual.
import { svgEl, el, waitFor, sleep } from '../../engine/util.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeLamp, makeChip, makeSeg, makePlacer } from '../../engine/components.js';
import { makeGate, sigWire } from '../../engine/gates.js';

/* ---------- geometry, in the stage's 720×480 user units ---------- */
const RAIL = { top: 42, bot: 372, x1: 196, x2: 548 };
const SPINE = 370;                 // the column the output hangs off
const OUT_Y = 182;                 // the output node's rail
const LAMP = { x: 578, y: OUT_Y };

const PL = { x: 236, y: 84, w: 104, h: 62 };    // left PMOS  (gate on its left edge)
const PR = { x: 400, y: 84, w: 104, h: 62 };    // right PMOS (gate on its right edge)
const NT = { x: 318, y: 212, w: 104, h: 58 };   // top NMOS   (gate on its left edge)
const NB = { x: 318, y: 292, w: 104, h: 58 };   // bottom NMOS(gate on its right edge)
const INV_P = { x: 318, y: 84, w: 104, h: 62 }; // the Act 1 inverter's PMOS, on the spine

const mid = s => s.y + s.h / 2;
const ctr = s => s.x + s.w / 2;
const gateEnd = (s, side) => side === 'left' ? s.x - 14 : s.x + s.w + 14;

const TRAY = [40, 200, 360, 520].map(x => ({ x, y: 396 }));
const TILE = { w: 140, h: 56 };

/* focus() restores raised nodes back to front, so its list has to be in document order */
const inOrder = nodes => nodes.filter(Boolean).sort((a, b) =>
  (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);

async function fadeIn(nodes, dur = 320){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  list.forEach(n => { n.style.display = ''; n.style.opacity = '0'; });
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(p); }));
  list.forEach(n => { n.style.opacity = '1'; });
}
async function fadeOut(nodes, dur = 260){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(1 - p); }));
  list.forEach(n => { n.style.display = 'none'; });
}

export async function step1(){
  guide.title('STEP 1 / 4 · NANOVOLT LOGIC', 'Weigh <em>two inputs at once</em>');
  guide.cards();

  const stage = newStage('05', 'The Act 1 inverter, then four switches wired into a two-input gate');
  const { svg, controls } = stage;
  const focusOn = (nodes, opts) => stage.focus(inOrder(Array.isArray(nodes) ? nodes : [nodes]), opts);

  /* ---------- pieces both scenes share: the supply rails and the output ---------- */

  const railsG = svgEl('g');
  railsG.innerHTML = `
    <path d="M${RAIL.x1} ${RAIL.top} H${RAIL.x2}" class="wire"/>
    <text x="${RAIL.x1}" y="${RAIL.top - 11}" class="rail-t">POWER ▲</text>
    <path d="M${RAIL.x1} ${RAIL.bot} H${RAIL.x2}" class="wire"/>
    <text x="${RAIL.x1}" y="${RAIL.bot - 8}" class="rail-t">GROUND ▼</text>`;
  svg.appendChild(railsG);

  const outG = svgEl('g');
  svg.appendChild(outG);
  const outWire = sigWire(svg, `M${SPINE} ${OUT_Y} H${LAMP.x - 22}`, { layer: outG });
  outG.appendChild(svgEl('circle', { cx: SPINE, cy: OUT_Y, r: 5, class: 'node-dot' }));
  const lamp = makeLamp(outG, LAMP.x, LAMP.y, { label: 'OUT' });

  /* ================= SCENE A — the inverter the player already owns ================= */

  const invG = svgEl('g');
  svg.appendChild(invG);
  invG.innerHTML = `
    <path d="M${SPINE} ${RAIL.top} V${INV_P.y}" class="wire"/>
    <path d="M${SPINE} ${NB.y + NB.h} V${RAIL.bot}" class="wire"/>
    <rect x="56" y="240" width="48" height="34" rx="9" class="batt-body"/>
    <text x="80" y="262" class="batt-t" font-size="12">IN</text>
    ${gatePlate(INV_P, 'left')}
    ${gatePlate(NB, 'left')}`;
  const invSpine = sigWire(svg, `M${SPINE} ${INV_P.y + INV_P.h} V${NB.y}`, { layer: invG });
  const invIn = sigWire(svg,
    `M104 257 H170 M170 ${mid(INV_P)} V${mid(NB)} M170 ${mid(INV_P)} H${gateEnd(INV_P, 'left')} M170 ${mid(NB)} H${gateEnd(NB, 'left')}`,
    { layer: invG });
  invG.appendChild(svgEl('circle', { cx: 170, cy: 257, r: 4, class: 'node-dot' }));

  const invP = device('PMOS', INV_P);
  const invN = device('NMOS', NB);

  const invChip = makeChip(controls, 'OUT: <b>1</b>');
  const seen = new Set();
  let IN = null, cancelInvHint = null;
  function setInv(v, silent){
    if (IN === v) return;
    IN = v;
    if (cancelInvHint){ cancelInvHint(); cancelInvHint = null; }
    const out = v === 0 ? 1 : 0;
    invSeg.set(v);
    invP.bridge.style.opacity = v === 0 ? '1' : '0';
    invN.bridge.style.opacity = v === 1 ? '1' : '0';
    invIn.set(!!v);
    invSpine.set(!!out); outWire.set(!!out);
    lamp.set(out);
    invChip.set(`OUT: <b>${out}</b>`);
    seen.add(v);
    if (!silent) SFX.blip();
  }
  const invSeg = makeSeg(controls, [
    { id: 'inv-0', label: 'IN = 0', value: 0 },
    { id: 'inv-1', label: 'IN = 1', value: 1 },
  ], v => setInv(v));
  setInv(0, true);
  seen.clear();

  /* ---- CARD 1 — where we are and what this step builds ---- */

  guide.say(`Here is the inverter from the end of Act 1. One input, one output. This step
    builds a gate that reads two inputs at once.`);
  focusOn([outG, invG, invP.g, invN.g], { label: 'your act 1 inverter', at: 'bottom', ring: false });
  await guide.next();

  /* ---- CARD 2 — flip it both ways ---- */

  stage.clearFocus();
  const t1 = guide.task('Flip the input both ways and watch the output.');
  await flow.ask(async replay => {
    if (replay !== undefined){ setInv(replay, true); return replay; }
    cancelInvHint = flow.hintAfter(14000, `The two buttons under the bench set the input.
      Press <b>IN = 1</b>, then <b>IN = 0</b>.`);
    await waitFor(() => seen.has(0) && seen.has(1), { hold: 400 });
    if (cancelInvHint){ cancelInvHint(); cancelInvHint = null; }
    return IN;
  });
  t1.done();

  /* ---- CARD 3 — the aim ---- */

  guide.say(`One input can only invert. To decide anything, a gate has to weigh two inputs
    at once.`);
  focusOn(invG.querySelector('rect'), { label: 'one input', at: 'bottom' });
  await guide.next();

  /* ================= the twins multiply: one inverter becomes four switches ========= */

  stage.clearFocus();
  await fadeOut([invG]);
  controls.innerHTML = '';

  const tiles = [mosTile('PMOS'), mosTile('PMOS'), mosTile('NMOS'), mosTile('NMOS')];
  tiles.forEach((t, i) => {
    t.home = TRAY[i];
    t.g.style.display = 'none';
    t.g.style.transform = `translate(${t.home.x}px,${t.home.y}px)`;
    t.tx = t.home.x; t.ty = t.home.y;
  });

  // the player's own two switches travel out to the bench, then a copy of each joins them
  await Promise.all([
    stage.packInto([invP.g], { ...TRAY[0], ...TILE }, { dur: 560, scale: 0.62 }),
    stage.packInto([invN.g], { ...TRAY[2], ...TILE }, { dur: 560, scale: 0.62 }),
  ]);
  invP.g.remove(); invN.g.remove();
  await fadeIn([tiles[0].g, tiles[2].g], 260);
  await fadeIn([tiles[1].g, tiles[3].g], 300);

  /* ---- the two-input skeleton, drawn behind the tray ---- */

  const skelG = svgEl('g');
  svg.appendChild(skelG);
  skelG.innerHTML = `
    <path d="M${ctr(PL)} ${RAIL.top} V${PL.y}" class="wire"/>
    <path d="M${ctr(PR)} ${RAIL.top} V${PR.y}" class="wire"/>
    <path d="M${SPINE} ${NB.y + NB.h} V${RAIL.bot}" class="wire"/>
    ${gatePlate(PL, 'left')}${gatePlate(PR, 'right')}
    ${gatePlate(NT, 'left')}${gatePlate(NB, 'right')}
    <rect x="56" y="98" width="48" height="34" rx="9" class="batt-body"/>
    <text x="80" y="120" class="batt-t" font-size="12">A</text>
    <rect x="616" y="240" width="48" height="34" rx="9" class="batt-body"/>
    <text x="640" y="262" class="batt-t" font-size="12">B</text>`;
  const outWireB = sigWire(svg,
    `M${ctr(PL)} ${PL.y + PL.h} V${OUT_Y} M${ctr(PR)} ${PR.y + PR.h} V${OUT_Y}
     M${ctr(PL)} ${OUT_Y} H${SPINE} M${SPINE} ${OUT_Y} V${NT.y}`, { layer: skelG });
  const linkWire = sigWire(svg, `M${SPINE} ${NT.y + NT.h} V${NB.y}`, { layer: skelG });
  const aWire = sigWire(svg,
    `M104 ${mid(PL)} H${gateEnd(PL, 'left')} M170 ${mid(PL)} V${mid(NT)} H${gateEnd(NT, 'left')}`,
    { layer: skelG });
  const bWire = sigWire(svg,
    `M640 240 V${mid(PR)} H${gateEnd(PR, 'right')} M640 274 V${mid(NB)} H${gateEnd(NB, 'right')}`,
    { layer: skelG });
  skelG.append(
    svgEl('circle', { cx: 170, cy: mid(PL), r: 4, class: 'node-dot' }),
    svgEl('circle', { cx: SPINE, cy: OUT_Y, r: 5, class: 'node-dot' }),
  );

  const slotsG = svgEl('g');
  svg.appendChild(slotsG);
  const slots = [
    { ...PL, correct: 'PMOS' }, { ...PR, correct: 'PMOS' },
    { ...NT, correct: 'NMOS' }, { ...NB, correct: 'NMOS' },
  ].map(s => {
    const g = svgEl('g');
    const rect = svgEl('rect', { x: s.x, y: s.y, width: s.w, height: s.h, rx: 12, class: 'slot' });
    const q = svgEl('text', { x: ctr(s), y: mid(s) + 9, class: 'slot-q' });
    q.textContent = '?';
    g.append(rect, q);
    slotsG.appendChild(g);
    return { ...s, g, rect, q, value: null, tile: null };
  });

  skelG.style.display = 'none';
  slotsG.style.display = 'none';
  await fadeIn([skelG, slotsG], 340);

  /* ---- CARD 4 — two of each switch ---- */

  guide.say(`Your two switches from Act 1, copied. Two PMOS and two NMOS.`);
  focusOn(tiles.map(t => t.g), { label: 'two of each', at: 'bottom' });
  await guide.next();

  /* ---- CARD 5 — name the two inputs ----
     The two terminals sit on opposite sides of the stage, so their union box is almost the
     whole bench: no ring, and the label goes in the clear strip under the power rail. */

  guide.say(`Two inputs now. A comes in on the left, B on the right.`);
  focusOn([...skelG.querySelectorAll('rect.batt-body')],
    { label: 'inputs a and b', at: 'top', ring: false });
  await guide.next();

  /* ---- CARD 6 — the goal ---- */

  guide.say(`<b>Your goal: a gate whose output is 0 only when A and B are both 1.</b> Every
    other pair leaves it at 1.`);
  focusOn(lamp.g, { label: 'output', at: 'top' });
  await guide.next();

  /* ---- CARD 7 — why the NMOS go in a chain ---- */

  guide.say(`The output only drops to 0 when both inputs are 1. Two switches in a chain do
    that: current gets through only if both are on.`);
  focusOn([slots[2].g, slots[3].g], { label: 'nmos chain to ground', at: 'left' });
  await guide.next();

  /* ---- CARD 8 — why the PMOS go side by side ---- */

  guide.say(`Either input at 0 has to leave the output at 1. Two switches side by side do
    that: one open path to power is enough.`);
  focusOn([slots[0].g, slots[1].g], { label: 'pmos pair to power', at: 'top' });
  await guide.next();

  /* ---- CARD 9 — place the four switches ----
     No focus on this card: stage.focus re-parents what it raises, which breaks the
     placer's pointer handling on anything it lifts. */

  stage.clearFocus();
  const t2 = guide.task('<b>Your goal: fill all four slots.</b> Drag each tile into the pair where it belongs.');

  const placer = makePlacer({
    svg, tiles, slots,
    validate: v => v[0] === 'PMOS' && v[1] === 'PMOS' && v[2] === 'NMOS' && v[3] === 'NMOS',
    onWrong: () => guide.note(`Not that arrangement. The chain below the output takes the two
      NMOS, the pair above it takes the two PMOS. All four tiles are back on the bench.`),
  });
  await flow.ask(async replay => {
    if (replay !== undefined){ placer.autoPlace(); return replay; }
    await placer.done;
    return true;
  });
  t2.done();

  await sleep(380);
  await fadeOut([...tiles.map(t => t.g), slotsG], 240);
  const pmosA = device('PMOS', PL);
  const pmosB = device('PMOS', PR);
  const nmosA = device('NMOS', NT);
  const nmosB = device('NMOS', NB);
  const devs = [pmosA, pmosB, nmosA, nmosB];
  devs.forEach(d => { d.g.style.display = 'none'; });
  await fadeIn(devs.map(d => d.g), 340);
  if (!flow.instant) SFX.success();

  /* ---- the live bench ---- */

  const chipOut = makeChip(controls, 'OUT: <b>1</b>');
  let A = null, B = null;
  const visited = new Set();
  let cancelHint = null;

  function setAB(a, b, silent){
    if (a === A && b === B) return;
    A = a; B = b;
    const out = (a && b) ? 0 : 1;
    segA.set(a); segB.set(b);
    pmosA.bridge.style.opacity = a === 0 ? '1' : '0';
    nmosA.bridge.style.opacity = a === 1 ? '1' : '0';
    pmosB.bridge.style.opacity = b === 0 ? '1' : '0';
    nmosB.bridge.style.opacity = b === 1 ? '1' : '0';
    aWire.set(!!a); bWire.set(!!b);
    linkWire.set(!!(a && !b));            // the node between the NMOS follows the top one
    outWire.set(!!out); outWireB.set(!!out);
    lamp.set(out);
    chipOut.set(`OUT: <b>${out}</b>`);
    visited.add(a * 2 + b);
    if (cancelHint){ cancelHint(); cancelHint = null; }
    if (!silent) SFX.blip();
  }
  const segA = makeSeg(controls, [
    { id: 'a-0', label: 'A = 0', value: 0 },
    { id: 'a-1', label: 'A = 1', value: 1 },
  ], v => setAB(v, B ?? 0));
  const segB = makeSeg(controls, [
    { id: 'b-0', label: 'B = 0', value: 0 },
    { id: 'b-1', label: 'B = 1', value: 1 },
  ], v => setAB(A ?? 0, v));
  setAB(0, 0, true);
  visited.clear();

  /* ---- CARD 10 — where A goes ---- */

  guide.say(`A runs to the left PMOS and to the top NMOS. One input, two switches.`);
  focusOn([aWire.el, pmosA.g, nmosA.g], { label: 'input a', at: 'left', ring: false });
  await guide.next();

  /* ---- CARD 11 — where B goes ---- */

  guide.say(`B does the same on the other side: the right PMOS and the bottom NMOS.`);
  focusOn([bWire.el, pmosB.g, nmosB.g], { label: 'input b', at: 'bottom', ring: false });
  await guide.next();

  /* ---- CARD 12 — try all four combinations ---- */

  stage.clearFocus();
  const t3 = guide.task('Try all four combinations of A and B. Watch which one turns the lamp off.');
  await flow.ask(async replay => {
    if (replay !== undefined){
      [0, 1, 2, 3].forEach(v => visited.add(v));
      setAB(replay >> 1, replay & 1, true);
      return replay;
    }
    cancelHint = flow.hintAfter(15000, `Four combinations in all: 0 and 0, 0 and 1, 1 and 0,
      1 and 1. Use the A and B buttons under the bench.`);
    await waitFor(() => visited.size >= 4, { hold: 400 });
    if (cancelHint){ cancelHint(); cancelHint = null; }
    return A * 2 + B;
  });
  t3.done();

  /* ---- CARD 13 — the truth table ----
     guide.truthTable and its hints both render through beat(), which in card mode swaps
     the one card slot: a hint would delete the table the player is filling in. So the
     instruction is prepended inside the table's own card and note() is pointed at a hint
     line inside it for as long as the table is live. */

  const ttPromise = guide.truthTable({
    heads: ['A', 'B', 'OUT (LAMP)'],
    rows: [[0, 0], [0, 1], [1, 0], [1, 1]],
    expected: [1, 1, 1, 0],
    hint: `Set A and B on the bench and read the lamp, then click that row's cell until it
      matches. Only one row turns the lamp off.`,
  });
  const ttEl = document.querySelector('#guide-scroll .card-slot .tt:not(.out)');
  const origNote = guide.note;
  if (ttEl){
    ttEl.insertBefore(el('p', { class: 'guide-p', style: 'margin:0 0 14px' },
      `<b>Your goal: fill in the OUT column.</b> Set A and B on the bench, read the lamp,
       then click a cell to match. Each click toggles it.`), ttEl.firstChild);
    guide.note = html => {
      let n = ttEl.querySelector('.tt-hint');
      if (!n){ n = el('p', { class: 'guide-note tt-hint', style: 'margin:14px 0 0' }); ttEl.appendChild(n); }
      n.innerHTML = html;
      return n;
    };
  }
  try { await ttPromise; } finally { guide.note = origNote; }

  /* ================= the four switches become one tile ============================= */

  stage.clearFocus();
  controls.innerHTML = '';
  await fadeOut([skelG, outG, railsG], 300);
  const TILE_BOX = { x: 312, y: 96, w: 96, h: 60 };
  await stage.packInto(devs.map(d => d.g), TILE_BOX, { dur: 620 });
  devs.forEach(d => d.g.remove());

  const nandTile = makeGate(svg, { ...TILE_BOX, kind: 'NAND', label: 'NAND', cap: 'not both' });
  nandTile.g.style.display = 'none';
  await fadeIn([nandTile.g], 340);

  /* ---- CARD 14 — the name ---- */

  guide.say(`Four switches, one answer: 0 only when both inputs are 1. The name for that
    shape is <b>NAND</b>, short for not both.`);
  focusOn(nandTile.g, { label: 'nand', at: 'bottom' });
  await guide.next();

  /* ---- CARD 15 — fold one: NOT ---- */

  stage.clearFocus();
  const notG = svgEl('g');
  svg.appendChild(notG);
  const notIn = sigWire(svg, `M226 126 H262 M262 116 V136 M262 116 H312 M262 136 H312`, { layer: notG });
  const notOut = sigWire(svg, `M408 126 H448`, { layer: notG });
  notG.appendChild(svgEl('circle', { cx: 262, cy: 126, r: 4, class: 'node-dot' }));
  addText(notG, 214, 130, 'IN', 'lbl-strong', 'end');
  addText(notG, 456, 130, '0', 'lbl-strong', 'start');
  addText(notG, 244, 112, '1', 'lbl');
  notIn.set(true); notOut.set(false);
  nandTile.set([1, 1]);
  notG.style.display = 'none';
  await fadeIn([notG], 300);

  guide.say(`Tie both inputs to one wire and they are always equal. Feed it 1 and the
    output is 0. The NAND is now an inverter.`);
  focusOn([nandTile.g, notG], { label: 'not', at: 'top' });
  await guide.next();

  /* ---- CARD 16 — fold two: AND ---- */

  stage.clearFocus();
  const andRow = svgEl('g');
  svg.appendChild(andRow);
  const andNand = makeGate(svg, { x: 230, y: 300, w: 96, h: 60, kind: 'NAND', label: 'NAND', cap: 'not both' });
  const andNot = makeGate(svg, { x: 430, y: 300, w: 96, h: 60, kind: 'NAND', label: 'NAND', cap: 'inputs tied' });
  const andIn = sigWire(svg, `M180 320 H230 M180 340 H230`, { layer: andRow });
  const andLink = sigWire(svg, `M326 330 H378 M378 320 V340 M378 320 H430 M378 340 H430`, { layer: andRow });
  const andOut = sigWire(svg, `M526 330 H580`, { layer: andRow });
  andRow.appendChild(svgEl('circle', { cx: 378, cy: 330, r: 4, class: 'node-dot' }));
  addText(andRow, 168, 324, 'A', 'lbl-strong', 'end');
  addText(andRow, 168, 344, 'B', 'lbl-strong', 'end');
  addText(andRow, 352, 316, '0', 'lbl');
  addText(andRow, 588, 334, '1', 'lbl-strong', 'start');
  andIn.set(true); andLink.set(false); andOut.set(true);
  andNand.set([1, 1]);
  andNot.set([0, 0]);
  [andRow, andNand.g, andNot.g].forEach(n => { n.style.display = 'none'; });
  await fadeIn([andRow, andNand.g, andNot.g], 320);

  guide.say(`Put a NAND in front of that inverter and the 0 flips back to 1. The pair
    reads 1 only when both inputs are 1, which is <b>AND</b>.`);
  focusOn([andRow, andNand.g, andNot.g], { label: 'and', at: 'bottom' });
  await guide.next();

  /* ---- CARD 17 — universality ---- */

  stage.clearFocus();
  guide.aha(`NOT and AND both came out of the same tile, wired two different ways.`,
    `Universal means exactly that. Any logic you can describe, built from copies of this one gate.`);
  await guide.next();

  /* ---------- drawing helpers ---------- */

  function addText(parent, x, y, s, cls, anchor){
    const t = svgEl('text', { x, y, class: cls });
    if (anchor) t.setAttribute('text-anchor', anchor);
    t.textContent = s;
    parent.appendChild(t);
    return t;
  }

  /* the gate stack from Act 1 step 5: metal plate, a sliver of oxide, then the body.
     It belongs to the wiring rather than the switch, so the input wires terminate on a
     drawn plate even while the slot is still empty. */
  function gatePlate(s, side){
    const y = mid(s) - 14;
    const mx = side === 'left' ? s.x - 14 : s.x + s.w + 5;
    const ox = side === 'left' ? s.x - 5 : s.x + s.w + 1;
    return `<rect x="${mx}" y="${y}" width="9" height="28" rx="2" class="gate-metal"/>
            <rect x="${ox}" y="${y}" width="4" height="28" class="oxide"/>`;
  }

  /* a switch sitting in the circuit: body, the two channel stubs, and the bridge that
     closes across the gap when it conducts. The stubs stay ink, because in this act a blue
     wire means a logic 1; the switch's own colour lives in the bridge and the caption,
     blue for the N-type and red for the P-type whose carriers are holes (DESIGN.md §4). */
  function device(kind, s){
    const p = kind === 'PMOS', col = p ? 'var(--red)' : 'var(--blue)';
    const cx = ctr(s), my = mid(s);
    const g = svgEl('g');
    g.innerHTML = `
      <rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="11" class="tile-bg" fill="var(--paper-high)"/>
      <path d="M${cx} ${s.y} V${my - 14} M${cx} ${my + 14} V${s.y + s.h}" class="wire"/>
      <rect x="${cx - 6}" y="${my - 14}" width="12" height="28" rx="4" class="bridge ${p ? 'p' : ''}"/>
      <text x="${s.x + 26}" y="${s.y + s.h + 14}" class="tile-cap" fill="${col}">${kind}</text>`;
    svg.appendChild(g);
    return { g, bridge: g.querySelector('.bridge') };
  }

  /* a switch on the bench, waiting to be placed */
  function mosTile(kind){
    const p = kind === 'PMOS', col = p ? 'var(--red)' : 'var(--blue)';
    const g = svgEl('g', { class: 'tile', 'data-part': kind.toLowerCase(), 'aria-label': kind + ' switch' });
    g.innerHTML = `
      <rect width="${TILE.w}" height="${TILE.h}" rx="11" class="tile-bg" fill="var(--paper-high)"/>
      <rect x="10" y="14" width="8" height="28" rx="2" class="gate-metal"/>
      <rect x="19" y="14" width="4" height="28" class="oxide"/>
      <path d="M28 28 H46 M54 28 H72" stroke="${col}" stroke-width="3" stroke-linecap="round" fill="none"/>
      <text x="76" y="25" class="tile-cap" text-anchor="start" font-size="11" fill="${col}" font-family="var(--font-display)">${kind}</text>
      <text x="76" y="41" class="tile-cap" text-anchor="start" font-size="7.5" style="letter-spacing:.03em">ON AT IN=${p ? '0' : '1'}</text>`;
    svg.appendChild(g);
    return { g, value: kind, w: TILE.w, h: TILE.h, home: null, tx: 0, ty: 0, slot: null };
  }
}
