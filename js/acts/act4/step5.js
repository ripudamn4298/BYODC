// ACT 4 · STEP 5 — "Match memory to compute".
// Rebuilt to the micro-learning contract in DESIGN_MAKEOVER.md §2 / §5. The balance beam
// is gone (makeRoofline is no longer called by anything): the stage is the hardware. HBM
// stacks on the left, the step-1 lane grid on the right, and between them a bundle of
// wires whose DRAWN WIDTH is the delivery rate: one wire per number per cycle. Two
// counters, NEEDED PER CYCLE and DELIVERED PER CYCLE, sit under the side that drives them.
import { waitFor, svgEl } from '../../engine/util.js';
import { Anim } from '../../engine/anim.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeLaneGrid } from '../../engine/lanes.js';
import { makeSlider, slideInPanel } from '../../engine/components.js';
import { labHbm, labMemCompare } from './lab.js';
import { ringsMap } from '../../art/rings.js';

/* --- the arithmetic of the whole step ---
   one lane asks for 1 number per cycle; one HBM stack sends PER_STACK numbers per cycle. */
const PER_STACK = 4;
const MAX_LANES = 16, MAX_STACKS = 4;

/* --- geometry, in the stage's 720x480 user units ---
   The stack tower is the same drawing the player meets in step 6: four dies of 64x16 on a
   19px pitch with the vertical wires ticked in between. */
const STK = { colX: [50, 132], rowY: [130, 248], w: 64, h: 73, die: 16, pitch: 19 };
const GRID = { x: 412, y: 100, cell: 58, gap: 7 };
const GRID_W = 4 * GRID.cell + 3 * GRID.gap;                 // 253
const BUNDLE = { x1: 208, x2: GRID.x, cy: 226, pitch: 7 };
const STACKS_CX = (STK.colX[0] + STK.colX[1] + STK.w) / 2;   // 123
const GRID_CX = GRID.x + GRID_W / 2;                         // 538.5
const BUNDLE_CX = (BUNDLE.x1 + BUNDLE.x2) / 2;               // 310

async function fadeIn(nodes, dur = 320){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  list.forEach(n => { n.style.opacity = '0'; n.style.display = ''; });
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(p); }));
  list.forEach(n => { n.style.opacity = ''; });
}

export async function step5(){
  guide.title('STEP 5 / 6', 'Crazy multiplication speeds also need <em>crazy data delivery speeds</em>');
  guide.cards();

  const stage = newStage('19', 'HBM stacks feeding a grid of sixteen lanes over a bundle of wires');
  const { svg, controls } = stage;

  /* live state: the sliders write into these, render() reads them */
  let laneCount = MAX_LANES, stackCount = 2, lampsLive = false;

  /* ---------- right: the lane grid from step 1 ---------- */
  const gridCap = svgEl('text', { x: GRID_CX, y: 88, class: 'lbl-faint' });
  gridCap.textContent = 'LANES';
  svg.appendChild(gridCap);
  const grid = makeLaneGrid(svg, {
    x: GRID.x, y: GRID.y, cols: 4, rows: 4, cell: GRID.cell, gap: GRID.gap,
  });

  /* ---------- left: HBM stacks, drawn as towers of memory dies ---------- */
  const stacksG = svgEl('g');
  const stackCap = svgEl('text', { x: STACKS_CX, y: 118, class: 'lbl-faint' });
  stackCap.textContent = 'MEMORY';
  stacksG.appendChild(stackCap);
  const towers = [];
  for (let i = 0; i < MAX_STACKS; i++){
    const x = STK.colX[i % 2], y = STK.rowY[Math.floor(i / 2)];
    const slot = svgEl('rect', { x, y, width: STK.w, height: STK.h, rx: 4, class: 'slot' });
    const g = svgEl('g');
    for (let d = 0; d < 4; d++){
      const dy = y + d * STK.pitch;
      g.appendChild(svgEl('rect', {
        x, y: dy, width: STK.w, height: STK.die, rx: 2, class: 'tile-bg',
      }));
      // through-silicon vias: short ticks in the gaps, so the tower reads as four chips
      if (d < 3) [16, 32, 48].forEach(vx => g.appendChild(svgEl('line', {
        x1: x + vx, y1: dy + STK.die, x2: x + vx, y2: dy + STK.pitch, class: 'wire',
      })));
    }
    stacksG.append(slot, g);
    towers.push({ g, slot });
  }
  svg.appendChild(stacksG);
  stacksG.style.display = 'none';

  /* ---------- between: the wire bundle. Drawn width IS the delivery rate. ---------- */
  const bundleG = svgEl('g');
  svg.appendChild(bundleG);
  const wires = [];
  for (let i = 0; i < MAX_STACKS * PER_STACK; i++){
    const w = svgEl('line', { x1: BUNDLE.x1, x2: BUNDLE.x2, y1: BUNDLE.cy, y2: BUNDLE.cy, class: 'wire' });
    bundleG.appendChild(w);
    wires.push(w);
  }
  bundleG.style.display = 'none';

  /* ---------- readouts ---------- */
  function counter(cx, label){
    const g = svgEl('g');
    const l = svgEl('text', { x: cx, y: 392, class: 'lbl-faint' });
    l.textContent = label;
    const v = svgEl('text', { x: cx, y: 424, class: 'gate-lbl', 'font-size': '24' });
    v.textContent = '0';
    g.append(l, v);
    svg.appendChild(g);
    g.style.display = 'none';
    return { g, v };
  }
  const deliveredC = counter(STACKS_CX, 'DELIVERED PER CYCLE');
  const neededC = counter(GRID_CX, 'NEEDED PER CYCLE');

  const utilG = svgEl('g');
  const utilL = svgEl('text', { x: BUNDLE_CX, y: 126, class: 'lbl-faint' });
  utilL.textContent = 'UTILIZATION';
  const utilV = svgEl('text', { x: BUNDLE_CX, y: 154, class: 'gate-lbl', 'font-size': '24' });
  utilV.textContent = '0%';
  utilG.append(utilL, utilV);
  svg.appendChild(utilG);
  utilG.style.display = 'none';

  /* ---------- render: one pure function of (laneCount, stackCount, lampsLive) ---------- */
  function render(){
    const needed = laneCount;
    const delivered = stackCount * PER_STACK;
    const fed = Math.min(needed, delivered);
    const util = fed / needed;

    towers.forEach((t, i) => {
      const built = i < stackCount;
      t.g.style.display = built ? '' : 'none';
      t.slot.style.display = built ? 'none' : '';
    });

    wires.forEach((w, i) => {
      if (i >= delivered){ w.style.display = 'none'; return; }
      const y = BUNDLE.cy + (i - (delivered - 1) / 2) * BUNDLE.pitch;
      w.style.display = '';
      w.setAttribute('y1', String(y));
      w.setAttribute('y2', String(y));
      // wires past what the lanes ask for carry nothing, so they are drawn faint
      w.setAttribute('class', i < needed ? 'wire' : 'wire dim');
    });

    grid.lanes.forEach((l, i) => {
      const built = i < laneCount;
      l.rect.style.opacity = built ? '' : '.28';
      l.rect.style.strokeDasharray = built ? '' : '4 4';
      l.lamp.style.display = built ? '' : 'none';
      const isFed = built && i < fed;
      l.lamp.classList.toggle('on', lampsLive && isFed);
      const waiting = lampsLive && built && !isFed;
      l.lamp.style.fill = waiting ? 'var(--amber)' : '';
      l.lamp.style.stroke = waiting ? 'var(--amber)' : '';
    });

    neededC.v.textContent = String(needed);
    deliveredC.v.textContent = String(delivered);
    const pct = Math.round(util * 100);
    utilV.textContent = `${pct}%`;
    utilV.style.fill = pct >= 90 ? '' : 'var(--amber)';

    return { lanes: laneCount, stacks: stackCount, needed, delivered, fed, util };
  }
  render();

  /* ================= CARD 1 — preface, on the machine they already built ============= */

  guide.say(`These are your sixteen lanes. Since step 2, each lane has its own MAC unit, and
    it does one multiply-add every cycle.`);
  stage.focus(grid.g, { label: 'sixteen lanes', at: 'bottom' });
  await guide.next();

  /* REVIEW_NOTES N-066 / N-067: say what the step is about before anything new appears.
     Act 4 restructure (2026-10-25): on step 3's map of where numbers wait, with main memory
     lit, so this step reads as the next ring out. */
  stage.clearFocus();
  const map = slideInPanel(svg, ringsMap({ lit: 'mem', title: "WHERE THE LANES' NUMBERS WAIT" }));
  await map.show();
  guide.say(`A lane can only work when its numbers arrive, and most of them start far out, in
    main memory (ring 4 on the map from step 3). In this step you make main memory deliver as
    many numbers as the lanes need.`);
  await guide.next();
  await map.hide();

  /* ================= CARD 2 — the stacks ============================================ */

  // Course restructure (2026-10-25): the stacks card and the "called HBM" card are one card.
  // HBM is first named in step 3's lab, so this card points back to it.
  await fadeIn([stacksG]);
  guide.say(`A GPU's main memory sits in stacks of memory chips, the HBM (high bandwidth
    memory) from step 3. The rate a stack delivers numbers at is its <b>bandwidth</b>.`);
  stage.focus(stacksG, { label: 'hbm stack', at: 'right' });
  await guide.next();

  /* ================= CARD 3 — the bundle, the load-bearing picture ================== */

  stage.clearFocus();
  await fadeIn([bundleG]);
  guide.say(`These wires connect the memory to the lanes. Numbers travel along them, from
    the HBM stacks on the left to the lanes on the right. Every wire carries one number per
    cycle.`);
  stage.focus(bundleG, { label: 'one wire, one number per cycle', at: 'top' });
  await guide.next();

  /* REVIEW_NOTES N-067: show that a stack brings four wires, rather than only saying it.
     A third stack is added for one card, its four wires drawn amber (still in flight),
     then taken away again. Pure: the same three render() calls live and on replay. */
  stage.clearFocus();
  stackCount = 3;
  render();
  const newWires = wires.slice(8, 12);
  newWires.forEach(w => { w.style.stroke = 'var(--amber)'; });
  await fadeIn([towers[2].g, ...newWires], 360);
  // Course restructure (2026-10-25): the "third stack is taken away" card is folded into
  // this one as its closing clause. The render calls keep their order, so replay is the same.
  guide.say(`Each stack drives four wires. Here a third stack has been added, and its four
    wires, shown in amber, have joined the bundle. Two stacks sent 8 numbers a cycle, and
    three send 12. For now, the third stack goes back.`);
  stage.focus([towers[2].g, ...newWires], { label: 'a third stack, four more wires', at: 'top', ring: false });
  await guide.next();

  stage.clearFocus();
  newWires.forEach(w => { w.style.stroke = ''; });
  stackCount = 2;
  render();

  /* ================= CARDS 4 and 5 — the two counters =============================== */

  stage.clearFocus();
  await fadeIn([neededC.g]);
  // Course restructure (2026-10-25): "one new number", so it does not contradict step 4's reuse
  guide.say(`Each lane asks for one new number every cycle. This counter totals what the
    lanes need.`);
  stage.focus(neededC.g, { label: 'needed per cycle', at: 'left' });
  await guide.next();

  stage.clearFocus();
  await fadeIn([deliveredC.g]);
  guide.say(`Each stack sends four numbers every cycle. This counter totals what memory
    delivers.`);
  stage.focus(deliveredC.g, { label: 'delivered per cycle', at: 'right' });
  await guide.next();

  /* ================= CARD 6 — the lamps ============================================= */

  stage.clearFocus();
  lampsLive = true;
  render();
  guide.say(`Each lane has a small lamp. Blue means the lane has its numbers, and amber
    means it is waiting for data.`);
  stage.focus(grid.lanes.map(l => l.lamp), { label: 'lane lamp', at: 'left', ring: false });
  await guide.next();

  /* ================= CARD 7 — utilization =========================================== */

  stage.clearFocus();
  await fadeIn([utilG]);
  guide.say(`Utilization is the share of lanes that have their numbers. Half of these
    lanes are waiting, so it reads 50%.`);
  stage.focus(utilG, { label: 'utilization', at: 'left' });
  await guide.next();

  /* ================= CARD 8 — first fix: too many lanes for the memory ============== */

  stage.clearFocus();
  const laneSlider = makeSlider(controls, {
    label: 'lanes on the die', min: 4, max: MAX_LANES, step: 1, value: laneCount,
    fmt: v => `${v} lanes`,
  });
  const stackSlider = makeSlider(controls, {
    label: 'HBM stacks', min: 1, max: MAX_STACKS, step: 1, value: stackCount,
    fmt: v => `${v} stack${v === 1 ? '' : 's'}`,
  });
  laneSlider.on(v => { laneCount = v; render(); });
  stackSlider.on(v => { stackCount = v; render(); });
  const setRig = (lanes, stacks) => {
    laneSlider.set(lanes); stackSlider.set(stacks);
    laneCount = lanes; stackCount = stacks;
    return render();
  };

  /* REVIEW_NOTES N-066: announce the new design before asking anything of it */
  setRig(MAX_LANES, 1);
  guide.say(`Now take a design with all sixteen lanes but only one stack. One stack sends 4
    numbers a cycle and the lanes ask for 16, so twelve lanes sit waiting, shown amber.`);
  stage.focus([towers[0].g, ...grid.lanes.map(l => l.lamp)], { label: 'one stack, sixteen lanes', at: 'top', ring: false });
  await guide.next();
  stage.clearFocus();

  /* Act 4 restructure (2026-10-25): the two slider tasks became this one. Reach 90% and
     fit no memory the lanes do not use. */
  guide.say(`The two sliders under the stage build or remove lanes and add or remove stacks.
    <b>Reach 90% utilization or better without fitting memory the lanes do not use</b>, because
    spare memory still costs money and power.`);

  await flow.ask(async replay => {
    if (replay !== undefined){ setRig(replay.lanes, replay.stacks); return replay; }
    const cancel = flow.hintAfter(14000, `Sixteen lanes ask for sixteen numbers a cycle, and
      one stack sends four. Add stacks, or build fewer lanes, until utilization reads <b>90% or
      better</b> and no wire is drawn faint.`);
    await waitFor(() => {
      const st = render();
      return st.util >= 0.9 && st.delivered - st.needed <= 2;
    }, { hold: 500 });
    cancel();
    return { lanes: laneCount, stacks: stackCount };
  });

  guide.note(`Utilization is now 90% or better, and memory delivers about what the lanes ask
    for, so little of it sits unused.`);
  await guide.next();

  /* ================= CARD 10 — payoff ============================================== */

  // Course restructure (2026-10-25): the unsupported "half of GPU design" figure and the
  // unpictured roofline are replaced by the memory-bound name and the memory wall.
  guide.aha(`Whichever of the two counters is smaller sets the speed of the whole chip. When
    memory is the smaller counter, the chip is called <b>memory-bound</b>. News calls this
    limit the memory wall.`,
    `The same problem comes back one level up, in Act 5, where the lane is a whole machine.`);
  stage.focus([deliveredC.g, neededC.g], { label: 'the smaller number wins', at: 'top', ring: false });
  await guide.next();
  stage.clearFocus();

  /* Course restructure (2026-10-25): closes the joint with step 4. Adding stacks works for
     sixteen lanes; a real chip reuses numbers instead. Figures from this step's numbers box
     in index.js (16,896 lanes, five stacks, a 40-times gap, about 200 stacks). */
  guide.say(`A real H100 has 16,896 lanes and five stacks. Fed one new number per lane per
    cycle, it would need about 200 stacks. So it reuses each number many times, as your array
    did in step 4.`);
  await guide.next();

  /* ============ IN THE LAB — inside an HBM stack, and the spec sheet (§6d rule 8) =====
     A cut through the package: GPU die and one HBM stack on a silicon interposer. Facts
     (8 dies, about 30 µm, 1,024 data wires, 3.35 TB/s) and sources are in lab.js. */
  const lab = slideInPanel(svg, labHbm(), { lab: true });
  lab.focus('stack');
  await lab.show();

  guide.lab(`The stacks you matched to your lanes look like this inside. Each HBM stack on the
    H100 is eight <b>DRAM dies</b> (memory chips), each ground to about 30 micrometres thick
    and piled one on another.`, { intro: true });
  await guide.next();

  lab.focus(['tsv', 'stack']);
  guide.lab(`Wires run straight down through the dies, in copper-filled holes called
    <b>through-silicon vias</b>, vias like those in Act 3 step 2 but through a whole die. They end in the base die at the bottom, which sends 1,024
    data wires out of the stack.`);
  await guide.next();

  lab.focus(['interposer', 'base']);
  // Course restructure (2026-10-25): the interposer is now taught in Act 3 step 4
  guide.lab(`A circuit board cannot carry 1,024 wires that fine. So the stack and the GPU die
    both sit on an <b>interposer</b>, the slice of finely wired silicon from Act 3 step 4,
    which joins them side by side.`);
  await guide.next();

  lab.focus('spec');
  guide.lab(`On the H100's spec sheet, the stacks become one line: a memory bandwidth of 3.35
    TB/s, which is 3.35 trillion bytes a second. That is the delivery rate to compare with
    the lanes, as you did in this step.`);
  await guide.next();

  /* REVIEW_NOTES N-108: why a GPU needs HBM, against a desktop CPU's memory, and the newest
     memory. Facts and sources in lab.js (labMemCompare). */
  const cmp = slideInPanel(svg, labMemCompare(), { lab: true });
  cmp.focus(['cpu', 'b-cpu']);
  await lab.swapTo(cmp);
  guide.lab(`A desktop CPU keeps its main memory on separate sticks on the circuit board, called
    <b>DDR5</b>. Two sticks reach the CPU over 128 data wires and deliver about 90 GB a
    second.`);
  await guide.next();

  cmp.focus(['gpu', 'b-h100', 'b-cpu']);
  guide.lab(`The H100's lanes need far more. Its HBM stacks sit beside the die on the
    interposer, so they can use 5,120 data wires in all. They deliver 3.35 TB a second, about
    37 times the desktop's memory.`);
  await guide.next();

  cmp.focus(['b-cpu', 'b-h100', 'b-next']);
  guide.lab(`Much of the newest progress in AI chips is here. NVIDIA's B200 (2024) reaches 8 TB
    a second. The next kind, <b>HBM4</b>, doubles each stack to 2,048 wires, and NVIDIA has
    announced its Rubin GPUs (2026) with about 22 TB a second.`);
  await guide.next();
  await cmp.hide();
}
