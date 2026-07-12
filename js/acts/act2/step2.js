// ACT 2 · STEP 2 — Build your own adder.
// CS-correctness per DESIGN.md §5b: binary taught by weights, never notation-first;
// full adder built from gates once, then COMPRESSED into a tile and stamped 4x
// ("box it, stamp it, repeat"); carry ripples visibly LSB→MSB with a per-stage delay.
import { svgEl, sleep, waitFor } from '../../engine/util.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeSeg, makeChip, makePlacer, makeLamp } from '../../engine/components.js';
import { makeGate, makeBits, makeToggleBits, sigWire } from '../../engine/gates.js';

export async function step2(){
  const { svg, controls } = newStage('06', 'Four-bit adder build');
  guide.title('STEP 2 / 4 · NANOVOLT COMPUTE', 'Build your own <em>adder</em>');

  /* ---------- binary by weights, zero dread ---------- */
  const bits = makeBits(svg, { x: 300, y: 200, n: 4, label: 'NUMBER' });
  const toggle = makeToggleBits(controls, { n: 4, label: 'NUMBER', onChange: v => { bits.set(v); SFX.blip(); } });
  bits.set(13); toggle.set(13, true);

  guide.say(`A <b>bit</b> is one lamp: on means 1, off means 0. Line four up and each lamp is worth a fixed amount — <b>8, 4, 2, 1</b> from left to right — so a row of lamps <em>is</em> a number: add up the weights of the lit ones. This row reads <span class="e-blue">8 + 4 + 1 = 13</span>. Your aim across this step: build a machine that <b>adds two of these numbers</b>. First, get a feel for the lamps — <em>tap the bits</em> below the stage to make the row say <b>9</b>.`);

  await flow.ask(async replay => {
    if (replay !== undefined){ toggle.set(9, true); bits.set(9); return replay; }
    const cancel = flow.hintAfter(11000, `9 = 8 + 1. Light the 8's lamp and the 1's lamp; leave the 4 and 2 dark.`);
    await waitFor(() => toggle.value === 9, { hold: 400 });
    cancel();
    return 9;
  });

  guide.note(`Notice: one column can only hold so much. Add two bits and sometimes the answer <b>overflows</b> into the next column over — that spill is called the <b>carry</b>, and all machine arithmetic is built around handling it.`);
  await guide.next();

  /* ---------- build a full adder from gates ---------- */
  const { svg: svg2, controls: controls2 } = newStage('06', 'Four-bit adder build');
  guide.say(`Start with one column. The circuit that adds a single column is a <b>full adder</b>: it takes three inputs — the two digits <b>A</b> and <b>B</b>, plus the <b>carry in</b> (any spill arriving from the column to its right) — and produces two outputs: the <b>sum</b> digit for this column and the <b>carry out</b> to the next. Your aim here: build one full adder out of gates. Adding one column is just <b>two questions, asked side by side</b>. Top lane — <em>what's the sum digit?</em> The sum lamp is 1 when the digits <b>differ</b>. XOR is the differ-detector: ask it about A and B, then ask <em>again</em> about that answer versus the CARRY IN. Bottom lane — <em>do we spill a carry?</em> You carry a 1 when A and B are <b>both</b> 1 (AND), or when the first difference and the carry-in are both 1 (AND again). Either spill counts — <b>OR</b> merges them.`);
  guide.say(`So: <b>two differ-detectors along the top, two both-detectors below, one OR at the end.</b> The captions under each empty box tell you the question that box must answer. <em>Place the five tiles</em> — each one is a handful of your NANDs, pre-folded: you saw AND folded in step 1; XOR and OR fold the same way.`);

  // two clean lanes, every wire ending on a pin or a labelled terminal; junction dots at branches
  const wireLayer = svgEl('g');
  wireLayer.innerHTML = `
    <text x="74" y="119" class="lbl-strong" text-anchor="end">A</text>
    <text x="74" y="137" class="lbl-strong" text-anchor="end">B</text>
    <text x="74" y="236" class="lbl-strong" text-anchor="end">CARRY</text>
    <text x="74" y="252" class="lbl-strong" text-anchor="end">IN</text>
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
  svg2.appendChild(wireLayer);

  // output terminals visible from the start — the lanes end in labelled lamps, never thin air
  const sumWire = sigWire(svg2, 'M438 124 H586');
  const lampSum = makeLamp(svg2, 600, 124, { label: 'SUM' });
  const coutWire = sigWire(svg2, 'M608 336 H618');
  const lampCout = makeLamp(svg2, 632, 336, { label: 'CARRY OUT' });

  const mono = (x, y, txt) => { const t = svgEl('text', { x, y, class: 'lbl-faint' }); t.textContent = txt; svg2.appendChild(t); };
  mono(214, 170, 'do A and B differ?');
  mono(394, 170, 'differ again, vs CARRY IN?');
  mono(394, 336, 'first-differ AND carry-in both 1?');
  mono(214, 404, 'A and B both 1?');
  mono(564, 382, 'either spill → CARRY OUT');

  const SLOTS = [
    { x: 170, y: 96,  correct: 'XOR' },   // sum lane, first differ
    { x: 350, y: 96,  correct: 'XOR' },   // sum lane, differ vs carry-in
    { x: 170, y: 330, correct: 'AND' },   // carry lane, A·B
    { x: 350, y: 262, correct: 'AND' },   // carry lane, (A⊕B)·Cin
    { x: 520, y: 308, correct: 'OR'  },   // carry merge
  ];
  const W = 88, H = 56;
  const slots = SLOTS.map(s => {
    const rect = svgEl('rect', { x: s.x, y: s.y, width: W, height: H, rx: 6, class: 'slot' });
    const q = svgEl('text', { x: s.x + W / 2, y: s.y + H / 2 + 9, class: 'slot-q' }); q.textContent = '?';
    svg2.append(rect, q);
    return { x: s.x, y: s.y, w: W, h: H, rect, q, value: null, tile: null, correct: s.correct };
  });

  function gateTile(kind, idx){
    const g = svgEl('g', { class: 'tile', 'aria-label': kind + ' tile ' + idx });
    g.innerHTML = `
      <rect width="${W}" height="${H}" rx="6" class="tile-bg"/>
      <text x="${W / 2}" y="${H / 2 + 5}" class="gate-lbl">${kind}</text>`;
    svg2.appendChild(g);
    return { g, value: kind, w: W, h: H, home: null, tx: 0, ty: 0, slot: null };
  }
  const trayKinds = ['XOR', 'XOR', 'AND', 'AND', 'OR'];
  const tiles = trayKinds.map((k, i) => gateTile(k, i));
  const homesX = [90, 190, 290, 400, 520];
  tiles.forEach((t, i) => t.home = { x: homesX[i], y: 420 });

  const placer = makePlacer({
    svg: svg2, tiles, slots,
    validate: v => v[0] === 'XOR' && v[1] === 'XOR' && v[2] === 'AND' && v[3] === 'AND' && v[4] === 'OR',
    onWrong: () => guide.note(`Match the tile to the caption under the box: “differ?” boxes take <b>XOR</b>, “both?” boxes take <b>AND</b>, and the last box before CARRY OUT — “either spill?” — takes <b>OR</b>.`),
  });

  await flow.ask(async replay => {
    if (replay !== undefined){ placer.autoPlace(); return replay; }
    const cancel = flow.hintAfter(14000,
      `Straight answer: the two boxes on the TOP lane get the two <b>XOR</b> tiles. The two “both?” boxes below get the two <b>AND</b> tiles. The box feeding CARRY OUT gets <b>OR</b>.`);
    await placer.done;
    cancel();
    return true;
  });

  await sleep(400);
  slots.forEach(s => { s.rect.style.opacity = '0'; s.q.style.opacity = '0'; });
  tiles.forEach(t => t.g.remove());

  // rebuild as live gates in the same slot positions
  const xor1 = makeGate(svg2, { x: slots[0].x, y: slots[0].y, kind: 'XOR', label: 'XOR' });
  const xor2 = makeGate(svg2, { x: slots[1].x, y: slots[1].y, kind: 'XOR', label: 'XOR' });
  const and1 = makeGate(svg2, { x: slots[2].x, y: slots[2].y, kind: 'AND', label: 'AND' });
  const and2 = makeGate(svg2, { x: slots[3].x, y: slots[3].y, kind: 'AND', label: 'AND' });
  const orG  = makeGate(svg2, { x: slots[4].x, y: slots[4].y, kind: 'OR', label: 'OR' });
  if (!flow.instant) SFX.success();

  guide.say(`Wired: <b>SUM</b> falls out of the second XOR, <b>CARRY OUT</b> falls out of the OR. Controls are live below — A, B, and CARRY IN.`);
  await guide.next();

  const chipSum = makeChip(controls2, 'SUM: <b>—</b>');
  const chipCout = makeChip(controls2, 'CARRY OUT: <b>—</b>');
  let A = 0, Bv = 0, Cin = 0;
  const segA = makeSeg(controls2, [{ id: 'fa-a0', label: 'A = 0', value: 0 }, { id: 'fa-a1', label: 'A = 1', value: 1 }], v => setABC(v, Bv, Cin));
  const segB = makeSeg(controls2, [{ id: 'fa-b0', label: 'B = 0', value: 0 }, { id: 'fa-b1', label: 'B = 1', value: 1 }], v => setABC(A, v, Cin));
  const segC = makeSeg(controls2, [{ id: 'fa-c0', label: 'Cin = 0', value: 0 }, { id: 'fa-c1', label: 'Cin = 1', value: 1 }], v => setABC(A, Bv, v));

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
    chipCout.set(`CARRY OUT: <b>${cout ? 1 : 0}</b>`);
    if (changed && !silent) SFX.blip();
    return { sum: s2, cout };
  }
  setABC(0, 0, 0, true);

  guide.say(`<em>Find a combination where the sum overflows</em> — make SUM read 0 while CARRY OUT reads 1.`);
  await flow.ask(async replay => {
    if (replay !== undefined){ setABC(1, 1, 0, true); return replay; }
    const cancel = flow.hintAfter(13000, `Try A = 1, B = 1, Cin = 0 — both inputs true, no carry coming in. The sum column overflows into the carry.`);
    await waitFor(() => { const r = setABC(A, Bv, Cin, true); return r.sum === false && r.cout === true; });
    cancel();
    return [A, Bv, Cin];
  });

  /* ---------- compress: box it, stamp it, repeat ---------- */
  guide.say(`The chipmaker's real superpower isn't the gates — it's this: <b>box it, stamp it, repeat.</b> To <em>stamp</em> is to take one finished block and copy it many times over, the way a fab prints the same design across a wafer. Box up the full adder you just built, stamp four copies, and you can add two 4-bit numbers.`);
  await guide.next();

  const { svg: svg3, controls: controls3 } = newStage('06', 'Four-bit adder build');
  const fadeGroup = [xor1, xor2, and1, and2, orG];
  fadeGroup.forEach(g => svg2.contains(g.g) && (g.g.style.transition = 'opacity .5s', g.g.style.opacity = '0'));
  await sleep(500);

  guide.say(`Five gates fold into one tile — <b>FA</b>, a full adder. Then we stamp four of them in a row, carry wires linking each stage's carry-out to the next stage's carry-in.`);

  const chainX = [90, 230, 370, 510];
  const FAs = chainX.map((x, i) => makeGate(svg3, { x, y: 220, kind: null, label: 'FA', cap: 'full adder', ins: 3 }));
  const carryWires = [];
  // straight carry links between adjacent FA tiles, amber tint
  for (let i = 0; i < FAs.length - 1; i++){
    const x0 = chainX[i] + 88, x1 = chainX[i + 1];
    const y = 220 + 56 * (1 / 4);
    const link = svgEl('path', { d: `M${x0} ${y} H${x1}`, class: 'wire', stroke: 'var(--amber)' });
    svg3.insertBefore(link, FAs[i].g);
    carryWires.push(link);
  }

  const toggleA4 = makeToggleBits(controls3, { n: 4, label: 'A' });
  const toggleB4 = makeToggleBits(controls3, { n: 4, label: 'B' });
  const outBits = makeBits(svg3, { x: 90, y: 340, n: 5, gap: 46, weights: false, label: 'A + B' });
  // custom weight labels: 16·8·4·2·1 (5 lamps; MSB is the overflow/carry lamp)
  const weightVals = [16, 8, 4, 2, 1];
  outBits.cells.forEach((c, i) => {
    const wl = svgEl('text', { x: +c.r.getAttribute('x') + 15, y: +c.r.getAttribute('y') - 8, class: 'lbl-faint' });
    wl.textContent = String(weightVals[i]);
    outBits.g.appendChild(wl);
  });

  function computeSum(a, b){
    let carry = 0; const sumBits = [];
    for (let i = 0; i < 4; i++){
      const abit = (a >> i) & 1, bbit = (b >> i) & 1;
      const s1 = abit ^ bbit;
      const sum = s1 ^ carry;
      const c1 = abit & bbit;
      const c2 = s1 & carry;
      const cout = c1 | c2;
      sumBits.push(sum);
      carry = cout;
    }
    return { sumBits, finalCarry: carry };
  }

  async function ripple(a, b){
    const { sumBits, finalCarry } = computeSum(a, b);
    carryWires.forEach(w => w.classList.remove('sig-hi'));
    FAs.forEach(g => g.setManual({ ins: [0, 0, 0], out: 0 }));
    let carry = 0;
    // render MSB-first lamp array: index 0 = 16s (final carry), 1..4 = 8,4,2,1 (MSB..LSB of sum)
    const setLamp = (i, v) => {
      outBits.cells[i].r.classList.toggle('hi', !!v);
      outBits.cells[i].tx.classList.toggle('hi', !!v);
      outBits.cells[i].tx.textContent = String(v ? 1 : 0);
    };
    for (let i = 0; i < 4; i++){
      const abit = (a >> i) & 1, bbit = (b >> i) & 1;
      FAs[i].setManual({ ins: [abit, bbit, carry], out: sumBits[i] });
      setLamp(4 - i, sumBits[i]);
      carry = (abit & bbit) | ((abit ^ bbit) & carry);
      if (i < 3){ carryWires[i].classList.toggle('sig-hi', !!carry); }
      await sleep(180);
    }
    setLamp(0, finalCarry);
    return finalCarry;
  }

  guide.say(`Above: A and B, four bits each. Below: the answer, five lamps wide — the extra lamp on the left is the <b>16's</b> place, for when the true sum needs it.`);
  await guide.next();

  /* ---------- test (a): compute 5 + 3 ---------- */
  guide.say(`<b>Set the machine to compute 5 + 3.</b>`);
  const [a1, b1] = await flow.ask(async replay => {
    if (replay !== undefined){
      toggleA4.set(replay[0], true); toggleB4.set(replay[1], true);
      await ripple(replay[0], replay[1]);
      return replay;
    }
    const cancel = flow.hintAfter(13000, `5 = 4 + 1. 3 = 2 + 1. Tap the bits until A reads 5 and B reads 3.`);
    await waitFor(() => toggleA4.value === 5 && toggleB4.value === 3);
    cancel();
    await ripple(5, 3);
    return [5, 3];
  });

  guide.aha(`Eight. You just <em>watched</em> the carry travel — column by column, right to left, exactly like adding on paper.`, `That traveling spill is called the ripple. Every adder chip on Earth does this, just wider and faster.`);
  await guide.next();

  /* ---------- test (b): overflow past 15 ---------- */
  guide.say(`<b>Now break it</b> — find any A and B whose true sum needs the 16's lamp.`);
  const [a2, b2] = await flow.ask(async replay => {
    if (replay !== undefined){
      toggleA4.set(replay[0], true); toggleB4.set(replay[1], true);
      await ripple(replay[0], replay[1]);
      return replay;
    }
    const cancel = flow.hintAfter(13000, `Push both numbers high — say 9 and 9. 9 + 9 = 18, past what four bits alone can hold.`);
    await waitFor(() => (toggleA4.value + toggleB4.value) > 15);
    cancel();
    const av = toggleA4.value, bv = toggleB4.value;
    await ripple(av, bv);
    return [av, bv];
  });

  guide.note(`The 16's lamp lit. Real chips call that signal the <b>carry flag</b> — the machine keeps going, flag raised, and the next instruction decides what to do about it.`);
  await guide.next();

  guide.aha(`Sand is now doing arithmetic. Every addition a computer performs is this same ripple — just wider, and billions of times a second.`);
  await guide.next();
}
