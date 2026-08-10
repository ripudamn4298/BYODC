// ACT 2 · STEP 2 — "Add the way you do on paper".
// Rebuilt to the micro-learning contract in DESIGN_MAKEOVER.md §2 / §4: one card at a
// time (guide.cards), every card focuses and names the one thing it is about, and each
// structural jump (paper sum → one column of circuit → four stamped copies) is watched.
//
// The paper-sum beat is unchanged in structure and in numbers (ACT2_MAKEOVER.md §3, §5,
// DESIGN.md §6c): 5 + 3 is worked one column at a time before any gate is placed, and the
// four-bit machine is checked against the 8 the player already knew.
//
// Terminology is binding (ACT2_MAKEOVER.md §2b): the one-column circuit is a FULL ADDER
// and the four-bit chain is a RIPPLE ADDER, because Act 4 calls back to both by name.
//
// One stage for the whole step: scenes fade in and out of it, so the player never meets a
// diagram they did not watch arrive. Colour stays semantic (DESIGN.md §4): blue is a live
// 1 (bit lamps, pins, signal wires), amber is the carry, the spill a column cannot hold.
//
// Determinism: every visual change rides Anim.tween or sleep (both replay-aware), no
// Math.random, no bare setTimeout loop, and every interaction is recorded through
// flow.ask as the value it left behind, so a replay lands where the live run landed.
import { svgEl, sleep, waitFor } from '../../engine/util.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeSeg, makeChip, makePlacer, makeLamp } from '../../engine/components.js';
import { makeGate, makeBits, makeToggleBits, sigWire, makeColumnSum } from '../../engine/gates.js';

/* ---------- geometry, in the stage's 720×480 user units ---------- */
const BITS = { x: 276, y: 205 };                  // the four place-value lamps
const CSUM = { x: 310, y: 140, gap: 66, cols: 4 };
const csumX = i => CSUM.x + (CSUM.cols - 1 - i) * CSUM.gap;   // i = 0 is the rightmost column

const FA = { y: 190, w: 88, h: 56, arc: 150 };
const FA_X = [560, 420, 280, 140];                // indexed by bit: 0 = ones, rightmost
const OUT = { x: 29, y: 330, gap: 140 };          // five answer lamps: 16 8 4 2 1

async function fadeIn(nodes, dur = 320){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  list.forEach(n => { n.style.display = ''; n.style.opacity = '0'; });
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(p); }));
  list.forEach(n => { n.style.opacity = '1'; });
}
async function fadeOut(nodes, dur = 280){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(1 - p); }));
  list.forEach(n => { n.style.display = 'none'; });
}

export async function step2(){
  guide.title('STEP 2 / 4 · NANOVOLT COMPUTE', 'Add the way <em>you do on paper</em>');
  guide.cards();

  const stage = newStage('06', 'Place value, the same sum worked on paper, one column of circuit, then four of them chained');
  const { svg, controls } = stage;

  /* ================= SCENE A — the answer they already have, then place value ======= */

  const gA = svgEl('g');
  svg.appendChild(gA);

  // inline style, not a font-size attribute: the .colsum-d rule would win over the attribute
  const known = svgEl('text', { x: 360, y: 250, 'text-anchor': 'middle', class: 'colsum-d' });
  known.style.fontSize = '52px';
  known.textContent = '5 + 3 = 8';
  gA.appendChild(known);

  guide.say(`You already know this one: <b>5 + 3 = 8</b>. Here you build the circuit that
    gets there, and check it against the answer you started with.`);
  stage.focus(known, { label: 'the answer you already know', at: 'bottom' });
  await guide.next();

  stage.clearFocus();
  await fadeOut([known]);

  const bitsG = svgEl('g');
  gA.appendChild(bitsG);
  const bits = makeBits(bitsG, { x: BITS.x, y: BITS.y, n: 4, label: 'NUMBER' });
  let cancelHint = null;
  const toggle = makeToggleBits(controls, {
    n: 4, label: 'NUMBER',
    onChange: v => { bits.set(v); SFX.blip(); },
  });
  bits.set(13); toggle.set(13, true);
  bitsG.style.opacity = '0';
  await fadeIn([bitsG]);

  guide.say(`Four lamps in a row. Each lamp has a weight: <b>8, 4, 2, 1</b>. The row is a
    number: add the weights of the lit ones.`);
  stage.focus(bits.g, { label: 'place value', at: 'top' });
  await guide.next();

  guide.say(`This row reads <span class="e-blue">8 + 4 + 1 = 13</span>.
    <b>Your goal: make it say 9.</b>`);
  stage.focus(bits.g, { label: 'make this read 9', at: 'top' });
  await flow.ask(async replay => {
    if (replay !== undefined){ toggle.set(9, true); bits.set(9); return replay; }
    cancelHint = flow.hintAfter(11000,
      `<b>Your goal: make the row read 9.</b> 9 is 8 + 1, so light the 8 lamp and the 1
       lamp and leave 4 and 2 dark.`);
    await waitFor(() => toggle.value === 9, { hold: 400 });
    cancelHint(); cancelHint = null;
    return 9;
  });

  /* the spill: 1 + 1 in the ones lamp needs the lamp on its left */
  const spill = svgEl('g');
  const rightC = BITS.x + 3 * 46 + 15, nextC = BITS.x + 2 * 46 + 15;
  spill.innerHTML = `
    <path d="M${rightC} ${BITS.y - 16} C ${rightC} ${BITS.y - 52}, ${nextC} ${BITS.y - 52}, ${nextC} ${BITS.y - 20}"
          class="colsum-arrow" fill="none"/>
    <path d="M${nextC - 4} ${BITS.y - 28} L${nextC + 4} ${BITS.y - 28} L${nextC} ${BITS.y - 18} z" class="colsum-arrowhead"/>
    <text x="${rightC}" y="${BITS.y + 62}" class="colsum-carry">1 + 1</text>`;
  gA.appendChild(spill);
  spill.style.opacity = '0';
  await fadeIn([spill]);

  guide.say(`One lamp only holds so much. <b>1 + 1</b> does not fit in a single lamp, so the
    answer spills into the lamp on its left. That spill is the <b>carry</b>.`);
  stage.focus(spill, { label: 'carry', at: 'top' });
  await guide.next();

  /* ================= SCENE B — the same sum, worked on paper, column by column ====== */

  stage.clearFocus();
  controls.innerHTML = '';
  await fadeOut([gA]);

  const gB = svgEl('g');
  svg.appendChild(gB);
  const csum = makeColumnSum(gB, { x: CSUM.x, y: CSUM.y, a: 5, b: 3, bits: 3, gap: CSUM.gap });
  const colLbl = svgEl('text', { x: csumX(0), y: 106, class: 'lbl-strong' });
  gB.appendChild(colLbl);
  gB.style.opacity = '0';
  await fadeIn([gB]);

  guide.say(`The same sum on paper, in binary. <b>5 is 101</b> and <b>3 is 011</b>. Work it
    one column at a time, starting at the right.`);
  stage.focus(csum.el, { label: '5 + 3', at: 'top' });
  await guide.next();

  stage.clearFocus();

  const COLUMNS = [
    {
      name: 'ONES COLUMN',
      card: `<b>Ones column: 1 + 1 = 2.</b> Two does not fit here, so write 0 in this
             column and pass 1 to the column on the left.`,
      btn: 'Carry the 1 left ▸',
    },
    {
      name: 'TWOS COLUMN',
      card: `<b>Twos column: 0 + 1</b>, plus the 1 carried in from the right. That is 2
             again. Write 0, pass 1 left.`,
      btn: 'Carry the 1 left ▸',
    },
    {
      name: 'FOURS COLUMN',
      card: `<b>Fours column: 1 + 0</b>, plus the 1 carried in. Two again. Write 0, and pass
             1 left one more time.`,
      btn: 'Carry the 1 left ▸',
    },
    {
      name: 'EIGHTS COLUMN',
      card: `Nothing left to add in the <b>eights column</b>, but a carry is still coming in
             from the right. It lands here as a 1.`,
      btn: 'Read the answer ▸',
    },
  ];

  for (let i = 0; i < csum.columns; i++){
    csum.highlight(i);
    colLbl.setAttribute('x', String(csumX(i)));
    colLbl.textContent = COLUMNS[i].name;
    csum.reveal(i);
    guide.say(COLUMNS[i].card);
    await guide.button(COLUMNS[i].btn);
  }
  csum.clearHighlight();
  colLbl.textContent = '';

  guide.aha(`The sum row reads <b>1000</b>. Add the weights of the lit columns: <b>8</b>.
    The paper method lands on the answer you already had.`);
  await guide.next();

  guide.say(`Every column did the same job. Add the two digits, add anything carried in,
    write one digit, pass any spill left.`);
  stage.focus(csum.el, { label: 'one job, four times', at: 'bottom' });
  await guide.next();

  guide.say(`Build that job once as a circuit, then stamp out one copy per column.`);
  stage.clearFocus();
  await guide.next();

  /* ================= SCENE C — one column of circuit: the full adder ================ */

  await fadeOut([gB]);

  const gC = svgEl('g');
  svg.appendChild(gC);

  const wiresG = svgEl('g');
  wiresG.innerHTML = `
    <path d="M80 115 H170 M124 115 V349 H170" class="wire"/>
    <path d="M80 133 H170 M138 133 V367 H170" class="wire"/>
    <path d="M84 244 H304 M304 244 V133 H350 M304 244 V299 H350" class="wire"/>
    <path d="M258 124 H330 M330 124 V115 H350 M330 124 V281 H350" class="wire"/>
    <path d="M438 290 H500 V327 H520" class="wire"/>
    <path d="M258 358 H506 V345 H520" class="wire"/>
    <circle cx="124" cy="115" r="3.5" class="node-dot"/>
    <circle cx="138" cy="133" r="3.5" class="node-dot"/>
    <circle cx="304" cy="244" r="3.5" class="node-dot"/>
    <circle cx="330" cy="124" r="3.5" class="node-dot"/>`;
  gC.appendChild(wiresG);

  const inLblG = svgEl('g');
  inLblG.innerHTML = `
    <text x="74" y="119" class="lbl-strong" text-anchor="end">A</text>
    <text x="74" y="137" class="lbl-strong" text-anchor="end">B</text>
    <text x="74" y="236" class="lbl-strong" text-anchor="end">CARRY</text>
    <text x="74" y="252" class="lbl-strong" text-anchor="end">IN</text>`;
  gC.appendChild(inLblG);

  const SLOTS = [
    { x: 170, y: 96,  correct: 'XOR', lane: 'sum',   cap: 'do A and B differ?',           cx: 214, cy: 170 },
    { x: 350, y: 96,  correct: 'XOR', lane: 'sum',   cap: 'does that differ from carry in?', cx: 394, cy: 170 },
    { x: 170, y: 330, correct: 'AND', lane: 'carry', cap: 'were A and B both 1?',         cx: 214, cy: 404 },
    { x: 350, y: 262, correct: 'AND', lane: 'carry', cap: 'that answer and carry in, both 1?', cx: 394, cy: 336 },
    { x: 520, y: 308, correct: 'OR',  lane: 'or',    cap: 'did either one spill?',        cx: 516, cy: 392 },
  ];
  const W = 88, H = 56;
  const laneG = { sum: svgEl('g'), carry: svgEl('g'), or: svgEl('g') };
  gC.append(laneG.sum, laneG.carry, laneG.or);
  const slots = SLOTS.map(s => {
    const host = laneG[s.lane];
    const rect = svgEl('rect', { x: s.x, y: s.y, width: W, height: H, rx: 6, class: 'slot' });
    const q = svgEl('text', { x: s.x + W / 2, y: s.y + H / 2 + 9, class: 'slot-q' });
    q.textContent = '?';
    const cap = svgEl('text', { x: s.cx, y: s.cy, class: 'lbl-faint' });
    cap.textContent = s.cap;
    host.append(rect, q, cap);
    return { x: s.x, y: s.y, w: W, h: H, rect, q, value: null, tile: null, correct: s.correct };
  });

  const outG = svgEl('g');
  gC.appendChild(outG);
  const sumWire = sigWire(outG, 'M438 124 H586');
  const lampSum = makeLamp(outG, 600, 124, { label: 'SUM' });
  // the carry-out lamp drops below the OR box: at the OR's own height its label would
  // print across the box's bottom-right corner
  const coutWire = sigWire(outG, 'M608 336 H646 V352');
  const lampCout = makeLamp(outG, 646, 366, { label: 'CARRY OUT' });

  gC.style.opacity = '0';
  await fadeIn([gC]);

  guide.say(`The circuit that does one column is a <b>full adder</b>. Here is its frame:
    five empty boxes and the wires between them.`);
  stage.focus(gC, { label: 'full adder', at: 'top' });
  await guide.next();

  guide.say(`Three inputs. The two digits in this column, <b>A</b> and <b>B</b>, and the
    <b>carry in</b> from the column on its right.`);
  stage.focus(inLblG, { label: '3 inputs', at: 'left' });
  await guide.next();

  guide.say(`Two outputs. This column's <b>sum</b> digit, and the <b>carry out</b> going
    left. Three wires in, two out.`);
  stage.focus(outG, { label: '2 outputs', at: 'left' });
  await guide.next();

  guide.say(`The sum digit is 1 when the two digits <b>differ</b>. XOR is the gate for that
    question. Two of them here, because the carry in has to be compared as well.`);
  stage.focus(laneG.sum, { label: 'sum lane', at: 'top' });
  await guide.next();

  guide.say(`The carry asks a different question: were <b>both</b> digits 1? AND answers
    that. Two again: one for A and B, one for the carry in.`);
  stage.focus(laneG.carry, { label: 'carry lane', at: 'right' });
  await guide.next();

  guide.say(`Two ways to spill, and either one is enough. <b>OR</b> merges them into the
    single carry out.`);
  stage.focus(laneG.or, { label: 'either spill', at: 'top' });
  await guide.next();

  /* ---- placement runs with no focus: the scrim would hide the tray, and the tiles
     carry their own pointer handlers (VERIFY_HARNESS.md §4b) ---- */
  stage.clearFocus();

  function gateTile(kind, idx){
    const g = svgEl('g', { class: 'tile', 'aria-label': kind + ' tile ' + idx });
    g.innerHTML = `
      <rect width="${W}" height="${H}" rx="6" class="tile-bg"/>
      <text x="${W / 2}" y="${H / 2 + 5}" class="gate-lbl">${kind}</text>`;
    gC.appendChild(g);
    return { g, value: kind, w: W, h: H, home: null, tx: 0, ty: 0, slot: null };
  }
  const tiles = ['XOR', 'XOR', 'AND', 'AND', 'OR'].map((k, i) => gateTile(k, i));
  [90, 190, 290, 400, 520].forEach((x, i) => { tiles[i].home = { x, y: 420 }; });

  const placer = makePlacer({
    svg, tiles, slots,
    validate: v => v[0] === 'XOR' && v[1] === 'XOR' && v[2] === 'AND' && v[3] === 'AND' && v[4] === 'OR',
    onWrong: () => {
      if (cancelHint){ cancelHint(); cancelHint = null; }
      guide.note(`Match each tile to the caption under its box. A <b>differ</b> question
        takes XOR, a <b>both</b> question takes AND, and the box feeding CARRY OUT takes OR.`);
    },
  });

  guide.say(`<b>Your goal: place the five tiles.</b> The caption under each box says which
    question that box answers.`);
  await flow.ask(async replay => {
    if (replay !== undefined){ placer.autoPlace(); return replay; }
    cancelHint = flow.hintAfter(14000,
      `<b>Your goal: fill all five boxes.</b> The two boxes on the top lane take the XOR
       tiles. The two <b>both</b> boxes take the AND tiles. The box feeding CARRY OUT takes OR.`);
    await placer.done;
    if (cancelHint){ cancelHint(); cancelHint = null; }
    return true;
  });

  await sleep(400);
  // the empty boxes go, and with them their focus ring: a hidden slot that keeps
  // tabindex still paints the browser's focus outline over the gate that replaces it
  slots.forEach(s => {
    s.rect.style.opacity = '0'; s.q.style.opacity = '0';
    s.rect.removeAttribute('tabindex');
    if (document.activeElement === s.rect) s.rect.blur();
  });
  tiles.forEach(t => t.g.remove());

  /* the five tiles become five live gates in the same five places */
  const gatesG = svgEl('g');
  gC.appendChild(gatesG);
  const xor1 = makeGate(gatesG, { x: slots[0].x, y: slots[0].y, kind: 'XOR', label: 'XOR' });
  const xor2 = makeGate(gatesG, { x: slots[1].x, y: slots[1].y, kind: 'XOR', label: 'XOR' });
  const and1 = makeGate(gatesG, { x: slots[2].x, y: slots[2].y, kind: 'AND', label: 'AND' });
  const and2 = makeGate(gatesG, { x: slots[3].x, y: slots[3].y, kind: 'AND', label: 'AND' });
  const orG  = makeGate(gatesG, { x: slots[4].x, y: slots[4].y, kind: 'OR',  label: 'OR'  });
  if (!flow.instant) SFX.success();

  const chipSum = makeChip(controls, 'SUM: <b>·</b>');
  const chipCout = makeChip(controls, 'CARRY OUT: <b>·</b>');
  let A = 0, Bv = 0, Cin = 0;
  const segA = makeSeg(controls, [{ id: 'fa-a0', label: 'A = 0', value: 0 }, { id: 'fa-a1', label: 'A = 1', value: 1 }], v => setABC(v, Bv, Cin));
  const segB = makeSeg(controls, [{ id: 'fa-b0', label: 'B = 0', value: 0 }, { id: 'fa-b1', label: 'B = 1', value: 1 }], v => setABC(A, v, Cin));
  const segC = makeSeg(controls, [{ id: 'fa-c0', label: 'Cin = 0', value: 0 }, { id: 'fa-c1', label: 'Cin = 1', value: 1 }], v => setABC(A, Bv, v));

  function setABC(a, b, c, silent){
    const changed = a !== A || b !== Bv || c !== Cin;
    A = a; Bv = b; Cin = c;
    segA.set(a); segB.set(b); segC.set(c);
    const s1 = xor1.set([a, b]);
    const s2 = xor2.set([s1, c]);
    const c1 = and1.set([a, b]);
    const c2 = and2.set([s1, c]);
    const cout = orG.set([c1, c2]);
    sumWire.set(s2); lampSum.set(s2 ? 1 : 0);
    coutWire.set(cout); lampCout.set(cout ? 1 : 0);
    chipSum.set(`SUM: <b>${s2 ? 1 : 0}</b>`);
    chipSum.cls('state-on', !!s2);
    chipCout.set(`CARRY OUT: <b>${cout ? 1 : 0}</b>`);
    chipCout.cls('state-on', !!cout);
    if (changed && !silent) SFX.blip();
    return { sum: s2, cout };
  }
  setABC(0, 0, 0, true);

  guide.say(`Your five tiles are live gates now. <b>Your goal: make SUM read 0 while
    CARRY OUT reads 1.</b>`);
  await flow.ask(async replay => {
    if (replay !== undefined){ setABC(replay[0], replay[1], replay[2], true); return replay; }
    cancelHint = flow.hintAfter(13000,
      `<b>Your goal: SUM 0, CARRY OUT 1.</b> Try A = 1, B = 1, carry in = 0. Both digits are
       1, so the column cannot hold the answer.`);
    await waitFor(() => { const r = setABC(A, Bv, Cin, true); return r.sum === false && r.cout === true; });
    if (cancelHint){ cancelHint(); cancelHint = null; }
    return [A, Bv, Cin];
  });

  guide.say(`SUM reads 0 and CARRY OUT reads 1. The column kept 0 and handed the spill to
    the column on its left, the same move you made on paper.`);
  stage.focus(lampCout.g, { label: 'carry out = 1', at: 'left' });
  await guide.next();

  /* ================= SCENE D — box it, stamp it: the ripple adder ================== */

  stage.clearFocus();
  controls.innerHTML = '';
  await fadeOut([wiresG, inLblG, laneG.sum, laneG.carry, laneG.or, outG]);

  const gD = svgEl('g');
  svg.appendChild(gD);
  const chainG = svgEl('g');
  gD.appendChild(chainG);

  /* the five gates pack into the ones column's tile (rule 5: watched, not cut to) */
  await stage.packInto([xor1.g, xor2.g, and1.g, and2.g, orG.g],
    { x: FA_X[0], y: FA.y, w: FA.w, h: FA.h }, { dur: 620 });
  gC.style.display = 'none';

  const FAs = [];
  const mkFA = i => makeGate(chainG, { x: FA_X[i], y: FA.y, kind: null, label: 'FA', cap: 'full adder', ins: 3 });
  FAs[0] = mkFA(0);
  FAs[0].g.style.opacity = '0';
  await fadeIn([FAs[0].g]);

  guide.say(`Box it, stamp it, repeat. Five gates fold into one tile, and the tile is the
    part you copy.`);
  stage.focus(FAs[0].g, { label: 'full adder', at: 'top' });
  await guide.next();

  stage.clearFocus();
  const colCap = svgEl('g');
  gD.appendChild(colCap);
  ['1s', '2s', '4s', '8s'].forEach((s, i) => {
    const t = svgEl('text', { x: FA_X[i] + FA.w / 2, y: FA.y + FA.h + 20, class: 'lbl-faint' });
    t.textContent = s;
    colCap.appendChild(t);
  });
  colCap.style.opacity = '0';
  for (let i = 1; i < 4; i++){
    FAs[i] = mkFA(i);
    FAs[i].g.style.opacity = '0';
    await fadeIn([FAs[i].g], 220);
    if (!flow.instant) SFX.click();
  }
  await fadeIn([colCap], 220);

  guide.say(`Four tiles, one per column, laid out in place value order: eights, fours, twos,
    ones.`);
  stage.focus(chainG, { label: '4 columns', at: 'top' });
  await guide.next();

  /* carry links, drawn above the tiles the way carries are written above a paper sum */
  stage.clearFocus();
  const arcsG = svgEl('g');
  gD.appendChild(arcsG);
  const arcs = [];
  /* each hop rides at its own height, or the four of them merge into one long line */
  const arc = (x0, x1, yTop, yEnd) => {
    const g = svgEl('g');
    g.innerHTML = `
      <path d="M${x0} ${FA.y} V${yTop} H${x1} V${yEnd}" class="colsum-arrow" fill="none"/>
      <path d="M${x1 - 4} ${yEnd - 9} L${x1 + 4} ${yEnd - 9} L${x1} ${yEnd} z" class="colsum-arrowhead"/>`;
    g.style.opacity = '.28';
    arcsG.appendChild(g);
    arcs.push(g);
    return g;
  };
  for (let i = 0; i < 3; i++) arc(FA_X[i] + FA.w / 2, FA_X[i + 1] + FA.w / 2, FA.arc - i * 13, FA.y);
  arc(FA_X[3] + FA.w / 2, OUT.x + 15, FA.arc - 39, OUT.y);   // the last carry, out to the 16s lamp
  const setArc = (i, on) => { arcs[i].style.opacity = on ? '1' : '.28'; };
  arcsG.style.display = 'none';
  await fadeIn([arcsG]);
  arcs.forEach(a => { a.style.opacity = '.28'; });

  guide.say(`Each tile's <b>carry out</b> feeds the <b>carry in</b> of the tile on its left,
    the same way you wrote the carries above the paper sum.`);
  stage.focus(arcsG, { label: 'carry out to carry in', at: 'top' });
  await guide.next();

  guide.say(`Every carry has to wait for the column on its right, so the answer settles from
    right to left. Four full adders chained like this are a <b>ripple adder</b>.`);
  // chainG then colCap: focus restores back to front, so the list must be in document order
  stage.focus([chainG, colCap], { label: 'ripple adder', at: 'bottom' });
  await guide.next();

  /* the answer row: five lamps, one under each column plus the sixteens */
  stage.clearFocus();
  const outG2 = svgEl('g');
  gD.appendChild(outG2);
  const outBits = makeBits(outG2, { x: OUT.x, y: OUT.y, n: 5, gap: OUT.gap, weights: false, label: 'A + B' });
  [16, 8, 4, 2, 1].forEach((wv, i) => {
    const t = svgEl('text', { x: OUT.x + i * OUT.gap + 15, y: OUT.y - 8, class: 'lbl-faint' });
    t.textContent = String(wv);
    outG2.appendChild(t);
  });
  outG2.style.opacity = '0';
  await fadeIn([outG2]);

  const toggleA4 = makeToggleBits(controls, { n: 4, label: 'A', onChange: () => paintInputs() });
  const toggleB4 = makeToggleBits(controls, { n: 4, label: 'B', onChange: () => paintInputs() });

  /* Once a sum has run, the bit buttons lock. Left live they would repaint the columns
     and clear the answer row, so the card would claim a lamp that is no longer lit. */
  const lockBits = on => [toggleA4, toggleB4].forEach(t =>
    t.el.querySelectorAll('button').forEach(b => { b.disabled = on; }));

  /* while the player is still setting A and B, show their bits landing on the columns */
  function paintInputs(){
    const a = toggleA4.value, b = toggleB4.value;
    for (let i = 0; i < 4; i++){
      FAs[i].setManual({ ins: [(a >> i) & 1, (b >> i) & 1, 0], out: 0 });
    }
    arcs.forEach((_, i) => setArc(i, false));
    outBits.set(0);
    SFX.blip();
  }

  function computeSum(a, b){
    let carry = 0; const sumBits = [];
    for (let i = 0; i < 4; i++){
      const abit = (a >> i) & 1, bbit = (b >> i) & 1;
      const s1 = abit ^ bbit;
      sumBits.push(s1 ^ carry);
      carry = (abit & bbit) | (s1 & carry);
    }
    return { sumBits, finalCarry: carry };
  }

  /* one column per beat, right to left, so the carry is watched rather than described */
  async function ripple(a, b){
    const { sumBits, finalCarry } = computeSum(a, b);
    arcs.forEach((_, i) => setArc(i, false));
    FAs.forEach(g => g.setManual({ ins: [0, 0, 0], out: 0 }));
    const setLamp = (i, v) => {
      outBits.cells[i].r.classList.toggle('hi', !!v);
      outBits.cells[i].tx.classList.toggle('hi', !!v);
      outBits.cells[i].tx.textContent = String(v ? 1 : 0);
    };
    outBits.set(0);
    let carry = 0;
    for (let i = 0; i < 4; i++){
      const abit = (a >> i) & 1, bbit = (b >> i) & 1;
      FAs[i].setManual({ ins: [abit, bbit, carry], out: sumBits[i] });
      setLamp(4 - i, sumBits[i]);
      carry = (abit & bbit) | ((abit ^ bbit) & carry);
      setArc(i, !!carry);
      await sleep(220);
    }
    setLamp(0, finalCarry);
    return finalCarry;
  }

  guide.say(`The answer row has five lamps: <b>16, 8, 4, 2, 1</b>. Four columns hold up to
    15, so a bigger sum needs that fifth lamp.`);
  stage.focus(outG2, { label: 'answer', at: 'top' });
  await guide.next();

  stage.clearFocus();
  guide.say(`<b>Your goal: set A to 5 and B to 3</b>, with the bit buttons under the stage.`);
  await flow.ask(async replay => {
    if (replay !== undefined){
      toggleA4.set(replay[0], true); toggleB4.set(replay[1], true);
      await ripple(replay[0], replay[1]);
      return replay;
    }
    cancelHint = flow.hintAfter(13000,
      `<b>Your goal: A = 5, B = 3.</b> 5 is 4 + 1 and 3 is 2 + 1. Tap the bits until the
       readouts say 5 and 3.`);
    await waitFor(() => toggleA4.value === 5 && toggleB4.value === 3);
    if (cancelHint){ cancelHint(); cancelHint = null; }
    await ripple(5, 3);
    return [5, 3];
  });
  lockBits(true);

  guide.aha(`Eight. The carry moved right to left, one column at a time, the same walk you
    made on paper.`);
  await guide.next();

  lockBits(false);
  guide.say(`<b>Now break it. Your goal: find any A and B whose sum needs the 16 lamp.</b>`);
  const [a2, b2] = await flow.ask(async replay => {
    if (replay !== undefined){
      toggleA4.set(replay[0], true); toggleB4.set(replay[1], true);
      await ripple(replay[0], replay[1]);
      return replay;
    }
    cancelHint = flow.hintAfter(13000,
      `<b>Your goal: a sum that lights the 16 lamp.</b> Push both numbers high. 9 + 9 = 18,
       more than four columns can hold.`);
    // a long hold, so a player on their way to two big numbers is not cut off at the
    // first pair that happens to clear 15
    await waitFor(() => (toggleA4.value + toggleB4.value) > 15, { hold: 1100 });
    if (cancelHint){ cancelHint(); cancelHint = null; }
    const av = toggleA4.value, bv = toggleB4.value;
    await ripple(av, bv);
    return [av, bv];
  });
  lockBits(true);

  guide.say(`${a2} + ${b2} is ${a2 + b2}. Four columns could not hold it, so the last carry
    had nowhere to go but the 16 lamp. Chips call that lamp the <b>carry flag</b>.`);
  stage.focus(outBits.cells[0].r, { label: 'carry flag', at: 'top' });
  await guide.next();

  stage.clearFocus();
  guide.aha(`Every addition a computer does is this same ripple, right to left, column by
    column.`,
    `The adder in a 64-bit processor is the same circuit, 64 columns wide, running a few
     billion times a second.`);
  await guide.next();
}
