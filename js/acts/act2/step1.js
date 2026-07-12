// ACT 2 · STEP 1 — Build your own logic gate (NAND).
// CS-correctness per DESIGN.md §5b: NAND is taught as THE universal gate;
// NOT = NAND with tied inputs; AND = NAND + NOT. Logic levels are cobalt-when-HIGH,
// never conventional-current chevrons (that's Act 1's language).
import { svgEl, sleep, waitFor } from '../../engine/util.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeLamp, makeSeg, makeChip, makePlacer } from '../../engine/components.js';
import { makeGate, sigWire } from '../../engine/gates.js';

export async function step1(){
  const { svg, controls } = newStage('05', 'NAND gate build');
  guide.title('STEP 1 / 4 · NANOVOLT LOGIC', 'Build your own <em>logic gate</em>');

  guide.say(`Your CMOS inverter from Act 1 has one behaviour: feed it a <b>1</b>, it outputs <b>0</b>; feed it a <b>0</b>, it outputs <b>1</b>. One input, one output. Try it:`);

  /* ---------- bridge: the inverter, one input, flip it both ways ---------- */
  const invGate = makeGate(svg, { x: 316, y: 90, kind: 'NOT', label: 'NOT', cap: 'your inverter' });
  const seen = new Set();
  function setInv(v){
    invSeg.set(v);
    invGate.set([v]);
    seen.add(v);
    SFX.blip();
  }
  const invSeg = makeSeg(controls, [
    { id: 'inv-0', label: 'IN = 0', value: 0 },
    { id: 'inv-1', label: 'IN = 1', value: 1 },
  ], v => setInv(v));

  guide.say(`<em>Flip the input both ways</em> and watch the output invert.`);
  await flow.ask(async replay => {
    if (replay !== undefined){ setInv(0); setInv(1); return replay; }
    setInv(0);
    await waitFor(() => seen.has(0) && seen.has(1));
    return true;
  });

  guide.say(`One input only goes so far. To <b>decide</b> anything — is the tank full <em>and</em> the pressure right? should the alarm fire <em>unless</em> someone's silenced it? — you need a gate that weighs <b>two</b> inputs at once.`);
  await guide.next();

  /* ---------- build the NAND from CMOS twins ---------- */
  const { svg: svg2, controls: controls2 } = newStage('05', 'NAND gate build');
  guide.say(`Here's what you're building: a gate whose output drops to <b>0 only when A <em>and</em> B are both 1</b> — and reads <b>1</b> the rest of the time. Same twins as before (<b>PMOS</b> opens on 0, <b>NMOS</b> opens on 1), two of each now. Power rail on top, ground below. <em>Place the four tiles so the circuit behaves that way.</em>`);

  // every wire terminates on a rail, a slot edge, or a labelled terminal — no dangling ends
  const sk = svgEl('g');
  sk.innerHTML = `
    <line x1="240" y1="56" x2="520" y2="56" class="wire"/>
    <text x="240" y="42" class="rail-t">POWER ▲</text>
    <line x1="240" y1="404" x2="520" y2="404" class="wire"/>
    <text x="240" y="396" class="rail-t">GROUND ▼</text>
    <path d="M300 56 V84 M430 56 V84" class="wire"/>
    <path d="M300 156 V196 M430 156 V196" class="wire"/>
    <path d="M300 196 H430" class="wire"/>
    <path d="M365 196 V240" class="wire"/>
    <path d="M365 304 V312" class="wire"/>
    <path d="M365 376 V404" class="wire"/>
    <circle cx="365" cy="196" r="4.5" class="node-dot"/>
    <text x="74" y="124" class="lbl-strong" text-anchor="end">A</text>
    <text x="74" y="190" class="lbl-strong" text-anchor="end">B</text>
    <circle cx="170" cy="120" r="3.5" class="node-dot"/>
    <circle cx="140" cy="186" r="3.5" class="node-dot"/>`;
  svg2.appendChild(sk);

  const outWire = sigWire(svg2, 'M365 196 H586');
  const lamp = makeLamp(svg2, 600, 196, { label: 'OUT' });
  // A feeds the left PMOS gate + the top NMOS gate; B the right PMOS + bottom NMOS
  const aWire = sigWire(svg2, 'M80 120 H250 M170 120 V272 H315');
  const bWire = sigWire(svg2, 'M80 186 H140 M140 186 V344 H315 M140 186 H360 V120 H380');

  const SLOTS = [
    { x: 250, y: 84, w: 100, h: 72, correct: 'PMOS' },
    { x: 380, y: 84, w: 100, h: 72, correct: 'PMOS' },
    { x: 315, y: 240, w: 100, h: 64, correct: 'NMOS' },
    { x: 315, y: 312, w: 100, h: 64, correct: 'NMOS' },
  ];
  const slots = SLOTS.map(s => {
    const rect = svgEl('rect', { x: s.x, y: s.y, width: s.w, height: s.h, rx: 12, class: 'slot' });
    const q = svgEl('text', { x: s.x + s.w / 2, y: s.y + s.h / 2 + 9, class: 'slot-q' }); q.textContent = '?';
    svg2.append(rect, q);
    return { ...s, rect, q, value: null, tile: null };
  });

  function mosTile(kind, idx){
    const w = 140, h = 56, p = kind === 'PMOS';
    const col = p ? 'var(--red)' : 'var(--blue)';
    const g = svgEl('g', { class: 'tile', 'data-part': kind.toLowerCase(), 'aria-label': kind + ' switch ' + idx });
    g.innerHTML = `
      <rect width="${w}" height="${h}" rx="11" class="tile-bg" fill="var(--paper-high)"/>
      <rect x="10" y="12" width="7" height="32" rx="2" class="gate-metal"/>
      <path d="M26 28 H44 M50 28 H68" stroke="${col}" stroke-width="3" stroke-linecap="round" fill="none"/>
      <text x="82" y="24" class="tile-cap" text-anchor="start" font-size="11" fill="${col}" font-family="var(--font-display)">${kind}</text>
      <text x="82" y="39" class="tile-cap" text-anchor="start" font-size="8">opens @ IN=${p ? '0' : '1'}</text>`;
    svg2.appendChild(g);
    return { g, value: kind, w, h, home: null, tx: 0, ty: 0, slot: null };
  }
  const tiles = [mosTile('PMOS', 1), mosTile('PMOS', 2), mosTile('NMOS', 1), mosTile('NMOS', 2)];
  tiles[0].home = { x: 60, y: 415 }; tiles[1].home = { x: 215, y: 415 };
  tiles[2].home = { x: 380, y: 415 }; tiles[3].home = { x: 535, y: 415 };

  const placer = makePlacer({
    svg: svg2, tiles, slots,
    validate: v => v[0] === 'PMOS' && v[1] === 'PMOS' && v[2] === 'NMOS' && v[3] === 'NMOS',
    onWrong: () => guide.note(`Work back from the goal — output <b>0 only when both inputs are 1</b>. So the two switches that turn on at 1 (the NMOS) go in a <b>chain to ground</b>: both must close before the output can be pulled down. The two that turn on at 0 (the PMOS) sit <b>side by side</b> on the power rail — if either input is 0, one of them holds the output up.`),
  });

  await flow.ask(async replay => {
    if (replay !== undefined){ placer.autoPlace(); return replay; }
    await placer.done;
    return true;
  });

  await sleep(450);
  tiles.forEach(t => t.g.style.opacity = '0');
  slots.forEach(s => { s.rect.style.opacity = '0'; s.q.style.opacity = '0'; });

  function placedMOS(x0, y0, w, kind, col){
    const g = svgEl('g', { class: 'pop-in' });
    g.innerHTML = `
      <rect x="${x0}" y="${y0}" width="${w}" height="56" rx="10" class="tile-bg" fill="var(--paper-high)"/>
      <rect x="${x0 - 12}" y="${y0 + 16}" width="8" height="24" rx="2" class="gate-metal"/>
      <rect x="${x0 + w / 2 - 6}" y="${y0 + 12}" width="12" height="32" rx="4" class="bridge ${col === 'var(--red)' ? 'p' : ''}"/>
      <text x="${x0 + w / 2}" y="${y0 + 68}" class="tile-cap" font-size="8">${kind}</text>`;
    svg2.appendChild(g);
    return { g, bridge: g.querySelector('.bridge') };
  }
  const pmosA = placedMOS(250, 84, 100, 'PMOS·A', 'var(--red)');
  const pmosB = placedMOS(380, 84, 100, 'PMOS·B', 'var(--red)');
  const nmosA = placedMOS(315, 240, 100, 'NMOS·A', 'var(--blue)');
  const nmosB = placedMOS(315, 312, 100, 'NMOS·B', 'var(--blue)');
  if (!flow.instant) SFX.success();

  guide.say(`Wired. <b>A</b> feeds the left PMOS and the top NMOS. <b>B</b> feeds the right PMOS and the bottom NMOS. Controls are live below.`);
  await guide.next();

  /* ---------- controls: A, B toggles + OUT chip ---------- */
  const chipOut = makeChip(controls2, 'OUT: <b>—</b>');
  let A = null, B = null;
  const visited = new Set();
  const segA = makeSeg(controls2, [
    { id: 'a-0', label: 'A = 0', value: 0 },
    { id: 'a-1', label: 'A = 1', value: 1 },
  ], v => setAB(v, B ?? 0));
  const segB = makeSeg(controls2, [
    { id: 'b-0', label: 'B = 0', value: 0 },
    { id: 'b-1', label: 'B = 1', value: 1 },
  ], v => setAB(A ?? 0, v));

  function setAB(a, b, silent){
    const changed = a !== A || b !== B;
    A = a; B = b;
    segA.set(a); segB.set(b);
    const out = !(a && b);
    pmosA.bridge.style.opacity = a === 0 ? '1' : '0';
    nmosA.bridge.style.opacity = a === 1 ? '1' : '0';
    pmosB.bridge.style.opacity = b === 0 ? '1' : '0';
    nmosB.bridge.style.opacity = b === 1 ? '1' : '0';
    aWire.set(!!a); bWire.set(!!b); outWire.set(out);
    lamp.set(out ? 1 : 0);
    chipOut.set(`OUT: <b>${out ? 1 : 0}</b>`);
    visited.add(a * 2 + b);
    if (changed && !silent) SFX.blip();
    return out;
  }
  setAB(0, 0, true);

  guide.say(`<em>Try all four combinations</em> of A and B — watch which single one turns the lamp off.`);
  await flow.ask(async replay => {
    if (replay !== undefined){ setAB(1, 1, true); [0, 1, 2, 3].forEach(v => visited.add(v)); return replay; }
    const cancel = flow.hintAfter(12000, `Four combinations in all: 0-0, 0-1, 1-0, 1-1. Toggle A and B to visit each.`);
    await waitFor(() => visited.size >= 4);
    cancel();
    return true;
  });

  /* ---------- the test ---------- */
  guide.say(`<b>The test.</b> Fill in the <b>OUT</b> column yourself — <b>click a cell to set it to 0, click again to flip it to 1</b> (each click toggles). Read each row off your own bench first: set A and B on the stage, watch the lamp (<b>1</b> = lit, <b>0</b> = dark), then click the cell to match. Hit <b>Check my table</b> once all four rows are filled.`);
  await guide.truthTable({
    heads: ['A', 'B', 'OUT (LAMP)'],
    rows: [[0, 0], [0, 1], [1, 0], [1, 1]],
    expected: [1, 1, 1, 0],
    hint: `Set A and B on the stage and watch the lamp, then click each OUT cell to match (click toggles 0 ⇄ 1). Only one row turns the lamp off.`,
  });

  /* ---------- the universality aha ---------- */
  guide.aha(
    `This shape is called <b>NAND</b> — short for "not both." It is the only shape you will ever truly need. Tie its two inputs together and it becomes <b>NOT</b>. Feed its output through another NOT and you have <b>AND</b>. OR, XOR, everything left in this act, every chip on Earth — all foldable out of this one tile, stamped a billion times over.`,
    `One gate. Every decision a computer has ever made.`
  );
  await guide.next();

  /* ---------- static diagram: NOT and AND folded from NAND ---------- */
  const { svg: svg3 } = newStage('05', 'NAND gate build');
  guide.say(`Two folds, so you can see it happen:`);

  const notG = makeGate(svg3, { x: 90, y: 210, kind: 'NAND', ins: 2, label: 'NAND', cap: 'NOT = NAND folded' });
  const tieWire = svgEl('path', { d: `M60 224 V${210 + 56 * (2 / 3)} H90`, class: 'wire sig' });
  svg3.insertBefore(tieWire, notG.g);
  const tieIn = svgEl('path', { d: `M60 224 V${210 + 56 / 3} H90`, class: 'wire sig' });
  svg3.insertBefore(tieIn, notG.g);
  notG.set([1, 1]);
  tieWire.classList.add('sig-hi'); tieIn.classList.add('sig-hi');

  const andNand = makeGate(svg3, { x: 350, y: 170, kind: 'NAND', label: 'NAND', cap: 'A · B' });
  const andNot = makeGate(svg3, { x: 500, y: 170, kind: 'NAND', ins: 2, label: 'NAND', cap: 'AND = NAND + NOT' });
  const link1 = svgEl('path', { d: 'M438 198 H470 V184 H500', class: 'wire sig' });
  const link2 = svgEl('path', { d: 'M438 198 H470 V212 H500', class: 'wire sig' });
  svg3.insertBefore(link1, andNot.g); svg3.insertBefore(link2, andNot.g);
  andNand.set([1, 0]);
  andNot.set([1, 1]);
  link1.classList.add('sig-hi'); link2.classList.add('sig-hi');

  await guide.next();
}
