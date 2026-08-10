// ACT 4 · STEP 6 — "Assemble the GPU".
// Built to the micro-learning contract in DESIGN_MAKEOVER.md §2 / §5 step 6: one card at a
// time (guide.cards), every card focuses and names the one thing it is about, and the
// interposer is defined on its own card before anything is placed on it. The act closes by
// pointing at the same sixteen lanes the player stamped in step 1.
// Determinism: every interaction goes through flow.ask, the power ramp and the loss values
// are fixed sequences, and every visual change rides Anim.tween or sleep, both replay-aware.
import { sleep, el, svgEl } from '../../engine/util.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makePlacer, makeMeter } from '../../engine/components.js';
import { makeLaneGrid } from '../../engine/lanes.js';
import { CurrentFlow } from '../../engine/pathflow.js';

/* ---- fixed numbers: never generated, so replay lands where the live run landed ---- */
const WATTS = 700;
const LOSSES = [2.4, 1.1, 0.5, 0.2];

/* ---- package geometry (720 × 480 stage units) ---- */
const DIE = { w: 120, h: 112 };
const HBM = { w: 64, h: 96 };
const CPU = { w: 76, h: 52 };
const SLOTS = [
  { x: 196, y: 234, w: HBM.w, h: HBM.h, correct: 'HBM' },
  { x: 300, y: 218, w: DIE.w, h: DIE.h, correct: 'COMPUTE' },
  { x: 460, y: 234, w: HBM.w, h: HBM.h, correct: 'HBM' },
];
const SHELF = { x: 160, y: 330, w: 400, h: 20 };
const LID = { x: 176, y: 180, w: 368, h: 24 };

async function fadeOut(nodes, dur = 300){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(1 - p); }));
  list.forEach(n => { n.style.display = 'none'; });
}
async function fadeIn(nodes, dur = 300){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  list.forEach(n => { n.style.opacity = '0'; n.style.display = ''; });
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(p); }));
}

/* A memory stack, drawn as the tower of chips it is: four dies one on top of the other,
   with the vertical wires that run through them. Same drawing in both stages. */
function drawStack(parent, x, y){
  const g = svgEl('g');
  for (let i = 0; i < 4; i++){
    g.appendChild(svgEl('rect', { x: 0, y: i * 19, width: HBM.w, height: 16, rx: 2, class: 'tile-bg' }));
    // through-silicon vias: short ticks in the gaps, so the tower reads as four chips
    if (i < 3) [16, 32, 48].forEach(vx => {
      g.appendChild(svgEl('line', { x1: vx, y1: i * 19 + 16, x2: vx, y2: i * 19 + 19, class: 'wire' }));
    });
  }
  const cap = svgEl('text', { x: HBM.w / 2, y: 88, class: 'tile-cap' });
  cap.textContent = 'HBM STACK';
  g.appendChild(cap);
  if (x != null) g.setAttribute('transform', `translate(${x} ${y})`);
  parent.appendChild(g);
  return g;
}

/* The compute die, drawn with the sixteen lanes from step 1 inside it. */
function drawDie(parent){
  const g = svgEl('g');
  g.appendChild(svgEl('rect', { x: 0, y: 0, width: DIE.w, height: DIE.h, rx: 5, class: 'tile-bg' }));
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++){
    g.appendChild(svgEl('rect', {
      x: 18 + c * 22, y: 10 + r * 22, width: 18, height: 18, rx: 2, class: 'lane',
    }));
  }
  const cap = svgEl('text', { x: DIE.w / 2, y: 105, class: 'tile-cap' });
  cap.textContent = 'COMPUTE DIE · 16 LANES';
  g.appendChild(cap);
  parent.appendChild(g);
  return g;
}

export async function step6(){
  guide.title('STEP 6 / 6 · NANOVOLT AI', 'Assemble <em>the GPU</em>');
  guide.cards();

  const stage = newStage('20', 'One package: a compute die and two memory stacks on an interposer, under a cooler');
  const { svg, controls } = stage;

  /* ============ CARD 1 — what this step builds ==================================== */

  const outline = svgEl('rect', { x: 150, y: 150, width: 420, height: 212, rx: 6, class: 'slot' });
  svg.appendChild(outline);
  await fadeIn([outline], 300);

  guide.say(`Put the whole act into one package: your lanes, your memory, and a lid.`);
  stage.focus(outline, { label: 'one package', at: 'top', ring: false });
  await guide.next();

  /* ============ CARD 2 — the interposer, defined before anything sits on it ======== */

  stage.clearFocus();
  const shelf = svgEl('g');
  shelf.appendChild(svgEl('rect', { x: SHELF.x, y: SHELF.y, width: SHELF.w, height: SHELF.h, rx: 3, class: 'tile-bg' }));
  svg.appendChild(shelf);
  await fadeIn([shelf], 340);

  guide.say(`The interposer is a silicon shelf. It carries the compute die and the memory side
    by side, over the shortest distance possible.`);
  stage.focus(shelf, { label: 'interposer', at: 'bottom' });
  await guide.next();

  /* ============ CARD 3 — the parts in the tray ==================================== */

  stage.clearFocus();
  const tray = svgEl('g');
  svg.appendChild(tray);

  function makeTile(value, home, draw){
    const g = svgEl('g', { class: 'tile', 'data-part': value.toLowerCase() });
    tray.appendChild(g);
    const size = draw(g);
    g.setAttribute('aria-label', size.name);
    // sit the tile in the tray now: makePlacer only arrives a card later, and until
    // then an untransformed tile would pile up at the origin
    g.style.transform = `translate(${home.x}px,${home.y}px)`;
    return { g, value, w: size.w, h: size.h, home, tx: home.x, ty: home.y, slot: null };
  }

  const tiles = [
    makeTile('HBM', { x: 40, y: 364 }, g => { drawStack(g); return { ...HBM, name: 'HBM stack' }; }),
    makeTile('COMPUTE', { x: 160, y: 356 }, g => { drawDie(g); return { ...DIE, name: 'compute die' }; }),
    makeTile('HBM', { x: 330, y: 364 }, g => { drawStack(g); return { ...HBM, name: 'HBM stack' }; }),
    makeTile('CPU', { x: 470, y: 386 }, g => {
      g.appendChild(svgEl('rect', { x: 0, y: 0, width: CPU.w, height: CPU.h, rx: 4, class: 'tile-bg' }));
      const t = svgEl('text', { x: CPU.w / 2, y: 28, class: 'gate-lbl' });
      t.textContent = 'CPU';
      const c = svgEl('text', { x: CPU.w / 2, y: 43, class: 'tile-cap' });
      c.textContent = 'ONE WORKER';
      g.append(t, c);
      return { ...CPU, name: 'CPU tile' };
    }),
  ];
  await fadeIn([tray], 340);

  guide.say(`The tray holds the compute die that carries your sixteen lanes, and the two HBM
    stacks from the last step. One tile does not belong.`);
  stage.focus(tray, { label: 'the tray', at: 'top' });
  await guide.next();

  /* ============ CARD 4 — place them =============================================== */

  stage.clearFocus();
  const slotG = svgEl('g');
  svg.insertBefore(slotG, tray);
  const slots = SLOTS.map(s => {
    const rect = svgEl('rect', { x: s.x, y: s.y, width: s.w, height: s.h, rx: 5, class: 'slot' });
    const q = svgEl('text', { x: s.x + s.w / 2, y: s.y + s.h / 2 + 9, class: 'slot-q' });
    q.textContent = '?';
    slotG.append(rect, q);
    return { ...s, rect, q, value: null, tile: null };
  });
  await fadeIn([slotG], 300);

  guide.say(`Drag the die into the middle slot. Put one memory stack in each side slot.`);

  const placer = makePlacer({
    svg, tiles, slots,
    validate: v => v[0] === 'HBM' && v[1] === 'COMPUTE' && v[2] === 'HBM',
    onWrong: () => guide.note(`The compute die needs memory on both sides: two HBM stacks, one
      each side. The CPU tile belongs back in Act 2, not in this package.`),
  });

  await flow.ask(async replay => {
    if (replay !== undefined){ placer.autoPlace(); return replay; }
    await placer.done;
    return true;
  });

  /* ============ CARD 5 — sealed =================================================== */

  // let the last tile finish its slide, then drop the transition so every box we
  // measure from here on is the final one, live and on replay alike
  await sleep(460);
  tiles.forEach(t => { t.g.style.transition = 'none'; });
  const spare = tiles.filter(t => !t.slot).map(t => t.g);
  await fadeOut([...spare, slotG], 260);

  const links = svgEl('g');
  [[260, 300], [420, 460]].forEach(([x1, x2]) => {
    links.appendChild(svgEl('line', { x1, y1: 290, x2, y2: 290, class: 'wire' }));
  });
  svg.appendChild(links);
  await fadeIn([links], 260);

  const pkg = tiles.filter(t => t.slot).map(t => t.g).concat([shelf, links]);
  guide.say(`Compute in the middle, memory close on both flanks, every connection as short as
    it can be.`);
  stage.focus(pkg, { label: 'die and memory on one shelf', at: 'top' });
  await guide.next();

  /* ============ CARD 6 — where the heat comes from ================================ */

  stage.clearFocus();
  const die = tiles.find(t => t.value === 'COMPUTE').g;

  guide.say(`Every switch that flips turns a little power into heat. In Act 1 one flip was too
    small to measure. Billions of them per second on a five-inch square is about 700 watts.`);
  stage.focus(die, { label: 'compute die', at: 'left' });
  await guide.next();

  /* ============ CARD 7 — the cooler =============================================== */

  stage.clearFocus();
  const lidGhost = svgEl('rect', { x: LID.x, y: LID.y, width: LID.w, height: LID.h, rx: 4, class: 'slot' });
  svg.appendChild(lidGhost);
  await fadeIn([lidGhost], 260);

  guide.say(`A cooler is a metal lid with fins. It takes heat off the die and passes it into
    the air.`);
  stage.focus(lidGhost, { label: 'the lid goes here', at: 'top' });

  const coolerBtn = el('button', { class: 'btn primary', 'data-label': 'drop-cooler' }, 'DROP THE COOLER ▸');
  controls.appendChild(coolerBtn);
  const meter = makeMeter(controls, 'POWER DRAW');

  let cooler = null;
  function renderCooler(){
    if (cooler) return;
    lidGhost.style.display = 'none';
    cooler = svgEl('g');
    const body = svgEl('rect', { x: LID.x, y: LID.y, width: LID.w, height: LID.h, rx: 4, class: 'tile-bg' });
    body.style.fill = 'var(--amber-soft)';
    body.style.stroke = 'var(--amber)';
    cooler.appendChild(body);
    for (let fx = LID.x + 14; fx < LID.x + LID.w - 6; fx += 16){
      const fin = svgEl('line', { x1: fx, y1: LID.y - 14, x2: fx, y2: LID.y });
      fin.style.stroke = 'var(--amber)';
      fin.style.strokeWidth = '1.2';
      cooler.appendChild(fin);
    }
    const cap = svgEl('text', { x: 360, y: LID.y + 16, class: 'tile-cap' });
    cap.textContent = 'COOLER';
    cooler.appendChild(cap);
    svg.appendChild(cooler);
  }
  const setPower = p => {
    meter.fill.style.width = `${(86 * p).toFixed(1)}%`;
    meter.out.textContent = `≈ ${Math.round(p * WATTS / 10) * 10} W`;
  };

  await flow.ask(async replay => {
    if (replay !== undefined){
      stage.clearFocus();
      renderCooler();
      setPower(1);
      coolerBtn.disabled = true; coolerBtn.classList.add('used');
      return replay;
    }
    await new Promise(res => coolerBtn.addEventListener('click', () => { SFX.click(); res(); }, { once: true }));
    stage.clearFocus();
    coolerBtn.disabled = true; coolerBtn.classList.add('used');
    renderCooler();
    await sleep(300);
    await Anim.tween(1200, setPower);
    setPower(1);
    SFX.flow();
    return true;
  });

  /* ============ CARD 8 — read the meter =========================================== */

  guide.say(`The meter reads about 700 watts. All of that has to leave through the lid, or the
    chip overheats.`);
  stage.focus(cooler, { label: 'heat leaves here', at: 'top' });
  await guide.next();

  /* ============ CARDS 9-12 — the training loop ==================================== */

  stage.clearFocus();
  const stage2 = newStage('20', 'A training pass: data streaming from memory into the sixteen lanes');
  const svg2 = stage2.svg, controls2 = stage2.controls;

  const src = svgEl('g');
  svg2.appendChild(src);
  drawStack(src, 60, 209);
  const srcLbl = svgEl('text', { x: 92, y: 196, class: 'lbl-strong' });
  srcLbl.textContent = 'TRAINING DATA';
  src.appendChild(srcLbl);

  const wire = svgEl('path', { d: 'M124 257 H250', class: 'wire' });
  svg2.appendChild(wire);
  const flowLayer = svgEl('g');
  svg2.appendChild(flowLayer);
  const dataFlow = new CurrentFlow(wire, { n: 9, layer: flowLayer });

  const grid = makeLaneGrid(svg2, { x: 250, y: 140, cols: 4, rows: 4, cell: 54, gap: 6 });

  const lossG = svgEl('g');
  lossG.appendChild(svgEl('rect', { x: 528, y: 220, width: 140, height: 74, rx: 5, class: 'tile-bg' }));
  const lossCap = svgEl('text', { x: 598, y: 243, class: 'tile-cap' });
  lossCap.textContent = 'LOSS';
  const lossVal = svgEl('text', { x: 598, y: 275, class: 'gate-lbl' });
  lossVal.style.fontSize = '22px';
  lossVal.textContent = LOSSES[0].toFixed(1);
  lossG.append(lossCap, lossVal);
  svg2.appendChild(lossG);

  guide.say(`A pass is one trip through the machine. Data streams in from memory, the lanes
    work on it, and the chip nudges its weights.`);
  stage2.focus([src, wire, grid.g], { label: 'one pass', at: 'bottom' });
  await guide.next();

  stage2.clearFocus();
  guide.say(`The loss is one number for how wrong the chip is right now. It should fall on
    every pass.`);
  stage2.focus(lossG, { label: 'loss', at: 'top' });

  const runBtn = el('button', { class: 'btn primary', 'data-label': 'run-a-training-pass' }, 'RUN A TRAINING PASS ▸');
  controls2.appendChild(runBtn);

  async function runPass(loss){
    dataFlow.setSpeed(200);
    for (let r = 0; r < 4; r++){
      for (let c = 0; c < 4; c++) grid.setActive(r * 4 + c, true);
      SFX.blip();
      await sleep(80);
    }
    await sleep(150);
    dataFlow.setSpeed(0);
    grid.flashAll(false);
    lossVal.textContent = loss.toFixed(1);
  }

  await flow.ask(async replay => {
    const passes = LOSSES.slice(1);
    if (replay !== undefined){
      stage2.clearFocus();
      for (const l of passes) await runPass(l);
      runBtn.disabled = true; runBtn.classList.add('used');
      return replay;
    }
    for (let i = 0; i < passes.length; i++){
      await new Promise(res => runBtn.addEventListener('click', () => { SFX.click(); res(); }, { once: true }));
      if (i === 0) stage2.clearFocus();     // the loss stays lit until the first pass runs
      await runPass(passes[i]);
    }
    runBtn.disabled = true; runBtn.classList.add('used');
    return true;
  });

  guide.say(`2.4, then 1.1, then 0.5, then 0.2. Each pass left the chip a little less wrong
    than the pass before.`);
  stage2.focus(lossG, { label: 'loss', at: 'top' });
  await guide.next();

  stage2.clearFocus();
  stage2.focus(grid.g, { label: '16 lanes, from step 1', at: 'bottom' });
  guide.aha(`These are the same lanes you stamped in step 1, grinding through millions of
    numbers.`,
    `Graphics, physics and AI run on one machine because it is all the same move.`);
  await guide.next();
}
