// ACT 1 · STEP 3 — "A small current controls a big one".
// The transistor half of the old step 2, rebuilt to the micro-learning contract in
// DESIGN_MAKEOVER.md §2 / §4: one card at a time (guide.cards), every card focuses and
// names the one thing it is about, and the step opens on the single junction the player
// finished the previous step with (rule 4) before a second junction ever appears.
//
// Physics per DESIGN.md §4: the collector is drawn wider than the emitter (182 vs 104),
// conventional current runs battery+ → COLLECTOR → device → EMITTER → battery−, the base
// current runs INTO the base, every wire carries CurrentFlow chevrons and never carrier
// dots, and the closing card reconciles the two directions.
//
// Determinism: the hundred-electron demonstration is a fixed distribution (every 100th
// electron leaves by the base lead), there is no Math.random anywhere, and every visual
// change rides Anim.tween or sleep, so a replay lands on the live end state exactly.
import { sleep, waitFor, svgEl, clamp } from '../engine/util.js';
import { Anim } from '../engine/anim.js';
import { SFX } from '../engine/sfx.js';
import { guide } from '../engine/guide.js';
import { flow } from '../engine/flow.js';
import { newStage } from '../engine/stage.js';
import { CurrentFlow } from '../engine/pathflow.js';
import { makeLamp, makeBattery, makeSlider, makePlacer } from '../engine/components.js';
import { makeDepletionBands, makeOvershootDemo } from '../engine/junction.js';

/* ---- geometry, in the stage's 720x480 user units ----
   Emitter 104 wide, base 84, collector 182: the collector is the wide one and the
   difference is visible without measuring (DESIGN.md §4.7). */
const TOP = 158, HGT = 118, MID = TOP + HGT / 2;          // device band: y 158…276, mid 217
const EMI = { x: 118, w: 104 };
const BAS = { x: 222, w: 84 };
const COL = { x: 306, w: 182 };
const cx = r => r.x + r.w / 2;                            // 170 · 264 · 397

async function fadeIn(nodes, dur = 320){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  list.forEach(n => { n.style.display = ''; n.style.opacity = '0'; });
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(p); }));
  list.forEach(n => { n.style.opacity = ''; });
}

/* a short arrow: a line plus a drawn head, so the stage needs no <defs> */
function arrow(parent, x1, y1, x2, y2, stroke){
  const g = svgEl('g');
  g.appendChild(svgEl('line', { x1, y1, x2, y2, stroke, 'stroke-width': 1.6 }));
  const a = Math.atan2(y2 - y1, x2 - x1), h = 8;
  g.appendChild(svgEl('path', {
    d: `M${x2} ${y2} L${x2 - h * Math.cos(a - .4)} ${y2 - h * Math.sin(a - .4)}` +
       ` L${x2 - h * Math.cos(a + .4)} ${y2 - h * Math.sin(a + .4)} Z`,
    fill: stroke,
  }));
  parent.appendChild(g);
  return g;
}

export async function step3(){
  guide.title('STEP 3 / 5 · NANOVOLT SEMICONDUCTORS', 'A small current controls <em>a big one</em>');
  guide.cards();

  const stage = newStage('03', 'Two junctions back to back: emitter, base and collector, with a base dial');
  const { svg, controls } = stage;

  /* ================= CARD 1 — the junction they finished last step (rule 4) ========= */

  const jg = svgEl('g');
  svg.appendChild(jg);
  jg.append(
    svgEl('rect', { x: 210, y: 170, width: 150, height: 130, class: 'p-region' }),
    svgEl('rect', { x: 360, y: 170, width: 150, height: 130, class: 'n-region' }),
  );
  const jLetter = (x, s) => {
    const t = svgEl('text', { x, y: 245, class: 'tile-letter' });
    t.textContent = s;
    jg.appendChild(t);
  };
  jLetter(272, 'P'); jLetter(448, 'N');
  makeDepletionBands(jg, { cx: 360, y: 170, h: 130, wNeg: 32, wPos: 32, labels: false });
  jg.appendChild(svgEl('line', { x1: 360, y1: 170, x2: 360, y2: 300, class: 'junction' }));

  guide.say(`This is the junction you built last step: N against P, with a depletion layer
    at the seam. Current only crosses it above about <b>0.7 V</b>.`);
  stage.focus(jg, { label: 'from last step', at: 'bottom' });
  await guide.next();

  /* ================= CARD 2 — one junction becomes three blocks (rule 5) =========== */

  stage.clearFocus();
  await stage.packInto([jg], { x: BAS.x, y: TOP, w: BAS.w, h: HGT });
  jg.remove();

  const SLOTS = [
    { key: 'E', x: EMI.x, y: TOP, w: EMI.w, h: HGT, correct: 'E' },
    { key: 'B', x: 232, y: TOP, w: 64, h: HGT, correct: 'B' },
    { key: 'C', x: COL.x, y: TOP, w: COL.w, h: HGT, correct: 'C' },
  ];
  const slotG = svgEl('g');
  const slots = SLOTS.map(s => {
    const rect = svgEl('rect', { x: s.x, y: s.y, width: s.w, height: s.h, class: 'slot' });
    const q = svgEl('text', { x: s.x + s.w / 2, y: s.y + s.h / 2 + 9, class: 'slot-q' });
    q.textContent = '?';
    slotG.append(rect, q);
    return { ...s, rect, q, value: null, tile: null };
  });
  svg.appendChild(slotG);
  await fadeIn([slotG]);

  guide.say(`Two of those junctions back to back give you a switch you can control. That
    takes three blocks: N, then a thin P, then N.`);
  stage.focus(slotG, { label: 'three slots', at: 'bottom' });
  await guide.next();

  /* ================= CARDS 3-5 — one name per card, each on its own block ========== */

  function makeTile(value, w, h, cap, homeX, homeY){
    const g = svgEl('g', { class: 'tile', 'aria-label': `${value} block` });
    g.appendChild(svgEl('rect', { width: w, height: h, rx: 8, class: 'tile-bg' }));
    const letter = svgEl('text', { x: w / 2, y: h / 2 + 8, class: 'tile-letter' });
    letter.textContent = value === 'B' ? 'P' : 'N';
    const capEl = svgEl('text', { x: w / 2, y: h - 13, class: 'tile-cap' });
    capEl.textContent = cap;
    g.append(letter, capEl);
    g.style.transform = `translate(${homeX}px,${homeY}px)`;
    g.style.display = 'none';
    svg.appendChild(g);
    return { g, value, w, h, home: { x: homeX, y: homeY }, tx: homeX, ty: homeY, slot: null };
  }
  const tileE = makeTile('E', 96, 66, 'EMITTER', 150, 352);
  const tileB = makeTile('B', 60, 92, 'BASE', 302, 340);
  const tileC = makeTile('C', 150, 78, 'COLLECTOR', 452, 346);
  const tiles = [tileE, tileB, tileC];

  await fadeIn([tileE.g]);
  guide.say(`The <b>emitter</b> is where the electrons come from. It is the small block,
    because all it does is push them into the one next door.`);
  stage.focus(tileE.g, { label: 'emitter (n)', at: 'top' });
  await guide.next();

  stage.clearFocus();
  await fadeIn([tileB.g]);
  guide.say(`The <b>base</b> is the thin P block that goes in the middle. Every electron the
    emitter sends has to cross it.`);
  stage.focus(tileB.g, { label: 'base (p)', at: 'top' });
  await guide.next();

  stage.clearFocus();
  await fadeIn([tileC.g]);
  guide.say(`The <b>collector</b> catches the electrons that make it across. It is wide
    because it carries the whole current, and current makes heat.`);
  stage.focus(tileC.g, { label: 'collector (n)', at: 'top' });
  await guide.next();

  /* ================= CARD 6 — place them, name landing as each block goes in ======= */

  stage.clearFocus();

  /* each microlabel sits under its slot and stays there for the rest of the step */
  const nameG = svgEl('g');
  svg.appendChild(nameG);
  const nameFor = {};
  [['E', cx(EMI), 'EMITTER (N)'], ['B', cx(BAS), 'BASE (P)'], ['C', cx(COL), 'COLLECTOR (N)']]
    .forEach(([key, x, text]) => {
      const t = svgEl('text', { x, y: TOP + HGT + 16, class: 'lbl' });
      t.textContent = text;
      t.style.display = 'none';
      nameG.appendChild(t);
      nameFor[key] = t;
    });
  const showNames = () => slots.forEach(s => {
    if (s.value && nameFor[s.key].style.display === 'none') fadeIn([nameFor[s.key]], 240);
  });

  guide.say(`Left to right: emitter, base, collector. Drag each block into a slot, or tap a
    block and then a slot.`);

  const placer = makePlacer({
    svg, tiles, slots,
    validate: v => v[0] === 'E' && v[1] === 'B' && v[2] === 'C',
    onPlace: showNames,
    onWrong: () => guide.note(`Not quite. The emitter goes on the left, the thin base in the
      middle, and the wide collector on the right.`),
  });

  await flow.ask(async replay => {
    if (replay !== undefined){ placer.autoPlace(); return replay; }
    await placer.done;
    return true;
  });
  slots.forEach(s => { nameFor[s.key].style.display = ''; nameFor[s.key].style.opacity = ''; });

  /* ---- the three blocks merge into one device ---- */
  await sleep(420);
  tiles.forEach(t => { t.g.style.display = 'none'; });
  slotG.style.display = 'none';

  const dev = svgEl('g');
  const eRect = svgEl('rect', { x: EMI.x, y: TOP, width: EMI.w, height: HGT, class: 'n-region' });
  const bRect = svgEl('rect', { x: BAS.x, y: TOP, width: BAS.w, height: HGT, class: 'p-region' });
  const cRect = svgEl('rect', { x: COL.x, y: TOP, width: COL.w, height: HGT, class: 'n-region' });
  dev.append(eRect, bRect, cRect);
  [BAS.x, COL.x].forEach(x => dev.appendChild(
    svgEl('line', { x1: x, y1: TOP, x2: x, y2: TOP + HGT, class: 'junction' })));
  // the letters sit above the mid-line, because the main current's chevrons run along it
  [[cx(EMI), 'N'], [cx(BAS), 'P'], [cx(COL), 'N']].forEach(([x, s]) => {
    const t = svgEl('text', { x, y: TOP + 40, class: 'tile-letter' });
    t.textContent = s;
    dev.appendChild(t);
  });
  // no `.pop-in` here: that CSS keyframe scales from the SVG origin, and a focus ring
  // measured while it is still running boxes the device's shrunken corner position
  // (VERIFY_HARNESS.md §4a). Anim.tween collapses to the end state on replay instead.
  svg.insertBefore(dev, nameG);
  dev.style.display = 'none';
  if (!flow.instant) SFX.success();
  await fadeIn([dev], 380);

  /* ================= CARD 7 — a barrier at each seam =============================== */

  const wallL = makeDepletionBands(svg, { cx: BAS.x, y: TOP, h: HGT, wNeg: 14, wPos: 14, labels: false });
  const wallR = makeDepletionBands(svg, { cx: COL.x, y: TOP, h: HGT, wNeg: 14, wPos: 14, labels: false });
  // the two seams sit 84px apart, too tight for the bands' own dashed edges and captions:
  // the device already draws a junction line at each seam, so suppress theirs
  [wallL, wallR].forEach(w => {
    w.el.querySelectorAll('line').forEach(l => l.setAttribute('opacity', 0));
    w.el.style.display = 'none';
  });
  await fadeIn([wallL.el, wallR.el]);

  guide.say(`Each seam builds its own barrier, the same way the single junction did. Two
    junctions, so two barriers, facing opposite ways.`);
  stage.focus([wallL.el, wallR.el], { label: 'two barriers', at: 'top' });
  await guide.next();

  /* ================= CARD 8 — a battery across it, and nothing happens ============= */

  stage.clearFocus();
  const mainWireR = svgEl('path', { d: `M402 420 H644 V${MID} H488`, class: 'wire' });
  const mainWireL = svgEl('path', { d: `M118 ${MID} H76 V420 H318`, class: 'wire' });
  svg.insertBefore(mainWireL, dev);
  svg.insertBefore(mainWireR, dev);
  const mainBatt = makeBattery(svg, 360, 420);
  const led = makeLamp(svg, 644, 310, { label: 'LED' });
  const flowLayer = svgEl('g');
  svg.appendChild(flowLayer);
  // one continuous route in the CONVENTIONAL CURRENT direction:
  // battery + → up the right side → collector → device → emitter → down the left → battery −
  const mainRoute = svgEl('path', { d: `M402 420 H644 V${MID} H118 V420 H318`, fill: 'none', stroke: 'none' });
  svg.appendChild(mainRoute);
  const mainFlow = new CurrentFlow(mainRoute, { n: 16, layer: flowLayer });
  const mainRig = [mainWireL, mainWireR, mainBatt, led.g];
  mainRig.forEach(n => { n.style.display = 'none'; });
  await fadeIn(mainRig);

  guide.say(`Now a battery across the device, collector to emitter. One of the two barriers
    always faces the wrong way, so the LED stays dark.`);
  stage.focus(led.g, { label: 'led stays dark', at: 'left' });
  await guide.next();

  /* ================= CARD 9 — the 0.7 V they already know ========================== */

  stage.clearFocus();
  const ctlRig = svgEl('g');
  const baseWire = svgEl('path', { d: 'M230 70 H264 V158', class: 'wire' });
  ctlRig.append(
    baseWire,
    svgEl('path', { d: 'M150 70 V158', class: 'wire' }),
    svgEl('rect', { x: 150, y: 53, width: 80, height: 34, rx: 8, class: 'batt-body' }),
    svgEl('circle', { cx: 264, cy: 158, r: 3.4, class: 'node-dot' }),
    svgEl('circle', { cx: 150, cy: 158, r: 3.4, class: 'node-dot' }),
  );
  const battMinus = svgEl('text', { x: 169, y: 74.5, class: 'batt-t' }); battMinus.textContent = '−';
  const battPlus = svgEl('text', { x: 211, y: 74.5, class: 'batt-t' }); battPlus.textContent = '+';
  const battCap = svgEl('text', { x: 190, y: 43, class: 'lbl-faint' }); battCap.textContent = '0.7 V';
  const wireCap = svgEl('text', { x: 322, y: 100, class: 'lbl' }); wireCap.textContent = 'BASE WIRE';
  ctlRig.append(battMinus, battPlus, battCap, wireCap);
  svg.insertBefore(ctlRig, dev);          // leads run behind the silicon, like every other wire
  const baseRoute = svgEl('path', { d: 'M264 86 V158', fill: 'none', stroke: 'none' });
  svg.appendChild(baseRoute);
  const baseFlow = new CurrentFlow(baseRoute, { n: 4, size: 3.6, layer: flowLayer });
  ctlRig.style.display = 'none';
  await fadeIn([ctlRig]);

  guide.say(`You already know how to lower a barrier: push about <b>0.7 V</b> across it.
    This second battery does that, from the base down to the emitter.`);
  stage.focus(ctlRig, { label: '0.7 v, base to emitter', at: 'right' });
  await guide.next();

  /* ---- the electrical state of the whole rig, as one pure function of the base current.
     Called with a fixed 4 µA for the 0.7 V beat, then driven by the dial. ---- */
  const readout = (rcx, caption) => {
    const g = svgEl('g');
    const l = svgEl('text', { x: rcx, y: 344, class: 'lbl-faint' });
    l.textContent = caption;
    // inline style, not a font-size attribute: .gate-lbl's own rule would win over one
    const v = svgEl('text', { x: rcx, y: 376, class: 'gate-lbl', style: 'font-size:21px' });
    v.textContent = '0';
    g.append(l, v);
    svg.appendChild(g);
    g.style.display = 'none';
    return { g, v };
  };
  const baseC = readout(250, 'INTO THE BASE');
  const mainC = readout(480, 'THROUGH THE DEVICE');

  // thousands separator by hand: toLocaleString would follow the browser's locale
  const grouped = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  let sounded = false;
  function applyBias(v){
    baseC.v.textContent = `${v.toFixed(1)} µA`;
    mainC.v.textContent = `${grouped(Math.round(v * 100))} µA`;
    mainFlow.setSpeed(v * 24);            // positive = the drawn conventional direction
    baseFlow.setSpeed(v * 9);             // positive = down, into the base
    led.set(v / 10);
    // base current floods the emitter-side junction with carriers and holds it narrow
    wallL.setWidth(clamp(1 - v / 10 * 0.88, 0.12, 1));
    if (v > 1 && !sounded){ sounded = true; if (!flow.instant) SFX.flow(); }
  }

  /* ================= CARD 10 — the left barrier narrows ============================ */

  stage.clearFocus();
  applyBias(4);
  await sleep(360);

  guide.say(`It leans on the left barrier only. That barrier narrows, and electrons start
    crossing from the emitter into the base.`);
  stage.focus(wallL.el, { label: 'left barrier narrows', at: 'top' });
  await guide.next();

  /* ================= CARD 11 — predict, before anything is counted ================= */

  stage.clearFocus();
  guide.say(`Those electrons are now in the base, and the base wire is a way out.
    <b>Where do they go?</b>`);
  stage.focus([baseWire, wireCap], { label: 'a way out', at: 'right' });
  const guess = await guide.choose([
    { label: 'Out through the base wire', value: 'base', hint: 'the wire is right there' },
    { label: 'On into the collector', value: 'coll', hint: 'they are already moving that way' },
  ]);

  /* ================= CARD 12 — release a hundred and count them =================== */

  stage.clearFocus();
  const tallyG = svgEl('g');
  const tallyLine = (y, s) => {
    const t = svgEl('text', { x: 600, y, class: 'depl-lbl', 'text-anchor': 'middle' });
    t.textContent = s;
    tallyG.appendChild(t);
    return t;
  };
  tallyLine(96, 'RELEASED  100');
  const tallyColl = tallyLine(120, 'REACHED COLLECTOR  0');
  const tallyBase = tallyLine(144, 'OUT VIA BASE WIRE  0');
  svg.appendChild(tallyG);
  tallyG.style.display = 'none';
  await fadeIn([tallyG]);

  // fixed distribution, no randomness: electron 100 of 100 takes the base lead, the rest
  // overshoot. They run below the mid-line so they never sit on top of the current chevrons,
  // and yBaseTop stops 6px above the silicon, so a departing electron leaves by the base
  // contact without being drawn as a carrier travelling along a wire (DESIGN.md §4.5).
  const demo = makeOvershootDemo(svg, {
    xStart: 132, xBase: cx(BAS), xEnd: 452, y: 244, yBaseTop: 152, total: 100, perBase: 100,
  });
  demo.onTally((b, c) => {
    tallyColl.textContent = `REACHED COLLECTOR  ${c}`;
    tallyBase.textContent = `OUT VIA BASE WIRE  ${b}`;
  });

  guide.say(`A hundred electrons leave the emitter, one after another. This tally counts
    where each one ends up.`);
  stage.focus(tallyG, { label: 'where they went', at: 'left' });
  await guide.button('Release 100 electrons ▸');

  stage.clearFocus();
  await flow.ask(async replay => {
    if (replay !== undefined){ demo.settle(); return replay; }
    demo.start();
    await waitFor(() => {
      const c = demo.counts;
      return c.viaBase + c.viaCollector >= 100;
    }, { hold: 400 });
    return true;
  });
  demo.stop();

  /* ================= CARD 13 — why the base is thin =============================== */

  guide.say(`${guess === 'coll' ? 'Right.' : 'Not what you picked.'} 99 of the 100 reached
    the collector. The base is so thin that an electron is barely inside it before the
    collector pulls it across.`);
  stage.focus(bRect, { label: 'thin base', at: 'top' });
  await guide.next();

  /* ================= CARD 14 — swap the fixed battery for a dial ================== */

  stage.clearFocus();
  battCap.textContent = 'BASE DIAL';
  const dial = makeSlider(controls, {
    label: 'base current', min: 0, max: 10, step: 0.1, value: 4,
    fmt: v => v.toFixed(1) + ' µA',
  });
  dial.on(applyBias);

  guide.say(`Swap the fixed battery for a dial. It sets how much current you push into the
    base.`);
  stage.focus(ctlRig, { label: 'base dial', at: 'right' });
  await guide.next();

  /* ================= CARD 15 — the two numbers to compare ========================= */

  stage.clearFocus();
  await fadeIn([baseC.g, mainC.g]);
  guide.say(`Two readouts now: the current you put into the base, and the current running
    through the device from collector to emitter.`);
  stage.focus([baseC.g, mainC.g], { label: 'in and out', at: 'top' });
  await guide.next();

  /* ================= CARDS 16-17 — take it fully off, then fully on ================ */
  /* No focus on these two: the player is working a control and needs the LED, the readouts
     and the emitter-side barrier all readable at once. */

  stage.clearFocus();
  guide.say(`<b>Your goal: switch the big current with the small one.</b> Turn the dial to
    zero and take the LED fully off.`);

  await flow.ask(async replay => {
    if (replay !== undefined){ dial.set(replay); applyBias(replay); return replay; }
    const cancel = flow.hintAfter(13000, `Turn the dial down to 0 µA. With no base current
      the emitter-side barrier goes back to full width and nothing crosses it.`);
    dial.input.addEventListener('input', cancel, { once: true });
    await waitFor(() => dial.value <= 0.05, { hold: 600 });
    cancel();
    return dial.value;
  });

  guide.say(`With no base current, nothing gets through the device. Now turn the dial up to
    10 µA and take the LED to full brightness.`);

  await flow.ask(async replay => {
    if (replay !== undefined){ dial.set(replay); applyBias(replay); return replay; }
    const cancel = flow.hintAfter(13000, `Push the dial all the way to 10 µA.`);
    dial.input.addEventListener('input', cancel, { once: true });
    await waitFor(() => dial.value >= 9.8, { hold: 600 });
    cancel();
    return dial.value;
  });

  /* ================= CARD 18 — the ratio ========================================== */

  guide.aha(`<b>10 µA in, 1,000 µA out.</b> The base current holds the emitter-side barrier
    down, and the device passes a hundred times what you spend on it.`,
    `Flick the dial and it is a switch. Move it smoothly and it is an amplifier.`);
  stage.focus([baseC.g, mainC.g], { label: '1 in, 100 out', at: 'top' });
  await guide.next();

  /* ================= CARD 19 — the name, once the thing exists ==================== */

  stage.clearFocus();
  guide.say(`N, a thin P, then N. That is what the name says: this is an
    <b>NPN transistor</b>.`);
  stage.focus(dev, { label: 'npn transistor', at: 'bottom' });
  await guide.next();

  /* ================= CARD 20 — the two directions, reconciled ===================== */

  stage.clearFocus();
  const eArrow = arrow(svg, 148, 244, 404, 244, 'var(--blue)');   // the path the demo ran on
  eArrow.style.display = 'none';
  await fadeIn([eArrow]);

  guide.say(`Inside the crystal the electrons run from emitter to collector. The chevrons on
    the wires point the other way: they show conventional current, as agreed in step 1.`);
  stage.focus(eArrow, { label: 'electrons', at: 'right' });
  await guide.next();
  stage.clearFocus();
}
