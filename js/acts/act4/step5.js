// ACT 4 · STEP 5 — "Match memory to compute".
// Rebuilt to the micro-learning contract in DESIGN_MAKEOVER.md §2 / §5. The balance beam
// is gone (makeRoofline is no longer called by anything): the stage is the hardware. HBM
// stacks on the left, the step-1 lane grid on the right, and between them a bundle of
// wires whose DRAWN WIDTH is the delivery rate: one wire per number per cycle. Two
// counters, NEEDED PER CYCLE and DELIVERED PER CYCLE, sit under the side that drives them.
import { waitFor, sleep, svgEl } from '../../engine/util.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeLaneGrid } from '../../engine/lanes.js';
import { makeSlider, slideInPanel, labExplore } from '../../engine/components.js';
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

  /* REVIEW_NOTES N-066 / N-067: say what the step is about before anything new appears.
     Act 4 restructure (2026-10-25): on step 3's map of where numbers wait, with main memory
     lit, so this step reads as the next ring out. */
  stage.clearFocus();
  const map = slideInPanel(svg, ringsMap({ lit: 'mem', title: "WHERE THE LANES' NUMBERS WAIT" }));
  await map.show();
  // critic pass (2026-11-04): the lanes and the job are one card
  guide.say(`Your sixteen lanes each do one multiply-add every cycle, but only when their numbers arrive.
    Most of those numbers start far out, in main memory (ring 4 on the map from step 3). In this step you
    make main memory deliver as many as the lanes need.`);
  await guide.next();
  await map.hide();

  /* ================= CARD 2 — the stacks ============================================ */

  // critic pass (2026-11-04): the stacks and their wires are one card
  await fadeIn([stacksG, bundleG]);
  guide.say(`A GPU's main memory sits in stacks of memory chips, the <b>HBM</b> (high bandwidth memory).
    These wires connect them to the lanes, and each wire carries one number per cycle. The rate a stack
    delivers at is its <b>bandwidth</b>.`);
  stage.focus([stacksG, bundleG], { label: 'one wire, one number per cycle', at: 'top', ring: false });
  await guide.next();

  /* REVIEW_NOTES N-067: show that a stack brings four wires, rather than only saying it.
     A third stack is added for one card, its four wires drawn amber (still in flight),
     then taken away again. Pure: the same three render() calls live and on replay. */
  /* critic pass (2026-11-04): the student adds the stack, then it goes back with the counters */
  stage.clearFocus();
  guide.say(`Each stack drives four wires. Two stacks send 8 numbers a cycle. Add a third and watch the
    bundle.`);
  await guide.button('Add a third stack ▸');
  stackCount = 3;
  render();
  const newWires = wires.slice(8, 12);
  newWires.forEach(w => { w.style.stroke = 'var(--amber)'; });
  await fadeIn([towers[2].g, ...newWires], 360);
  SFX.dope();
  if (!flow.instant) await sleep(900);
  newWires.forEach(w => { w.style.stroke = ''; });
  stackCount = 2;
  render();

  /* ================= the two counters, then the lamps and utilization ================ */

  await fadeIn([neededC.g, deliveredC.g]);
  // Course restructure (2026-10-25): "one new number", so it does not contradict step 4's reuse
  guide.say(`That third stack sent 12, and it now goes back. Each lane asks for one new number every cycle
    and each stack sends four, and these two counters total what the lanes need and what memory
    delivers.`);
  stage.focus([deliveredC.g, neededC.g], { label: 'needed and delivered', at: 'top', ring: false });
  await guide.next();

  stage.clearFocus();
  lampsLive = true;
  render();
  await fadeIn([utilG]);
  guide.say(`Each lane has a small lamp: blue when it has its numbers, and amber when it is waiting.
    <b>Utilization</b> is the share of lanes that have their numbers. Half of these are waiting, so it
    reads 50%.`);
  stage.focus([utilG, ...grid.lanes.map(l => l.lamp)], { label: 'utilization', at: 'top', ring: false });
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

  /* REVIEW_NOTES N-066: announce the new design before asking anything of it. Act 4 restructure
     (2026-10-25): reach 90% and fit no memory the lanes do not use. Critic pass (2026-11-04): the
     design and the goal are one card. */
  setRig(MAX_LANES, 1);
  guide.say(`Here is a design with sixteen lanes and only one stack, so twelve lanes sit waiting. With the
    two sliders under the stage, <b>reach 90% utilization or better without fitting memory the lanes do
    not use</b>, because spare memory still costs money and power.`);

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
  await lab.show();
  // critic pass (2026-11-04): one card to explore, instead of four to read
  labExplore(lab, {
    text: `The stacks you matched to your lanes look like this inside.`,
    prompt: 'Tap a part to read about it.',
    items: [
      { k: 'stack', label: 'The dies', html: `Each HBM stack on the H100 is eight <b>DRAM dies</b> (memory chips), each ground to about 30 micrometres thick and piled one on another.` },
      { k: ['tsv', 'stack'], hit: 'tsv', label: 'The vias', html: `Wires run straight down through the dies, in copper-filled holes called <b>through-silicon vias</b>, like the vias in Act 3 step 2 but through a whole die. They end in the base die, which sends 1,024 data wires out of the stack.` },
      { k: ['interposer', 'base'], hit: 'interposer', label: 'The interposer', html: `A circuit board cannot carry 1,024 wires that fine. So the stack and the GPU die both sit on the interposer from Act 3 step 4, which joins them side by side.` },
      { k: 'spec', label: 'The spec sheet', html: `On the H100's spec sheet, the stacks become one line: a memory bandwidth of 3.35 TB/s, which is 3.35 trillion bytes a second.` },
    ],
  });
  await guide.next();

  /* REVIEW_NOTES N-108: why a GPU needs HBM, against a desktop CPU's memory, and the newest
     memory. Facts and sources in lab.js (labMemCompare). */
  const cmp = slideInPanel(svg, labMemCompare(), { lab: true });
  await lab.swapTo(cmp);
  labExplore(cmp, {
    text: `Here is how far apart a GPU's memory and a desktop's memory have grown.`,
    prompt: 'Tap one to compare.',
    items: [
      { k: ['cpu', 'b-cpu'], hit: 'cpu', label: 'Desktop CPU', html: `It keeps its main memory on separate sticks on the circuit board, called <b>DDR5</b>. Two sticks reach the CPU over 128 data wires and deliver about 90 GB a second.` },
      { k: ['gpu', 'b-h100', 'b-cpu'], hit: 'gpu', label: 'H100', html: `Its HBM stacks sit beside the die on the interposer, so they can use 5,120 data wires in all. They deliver 3.35 TB a second, about 37 times the desktop's memory.` },
      { k: ['b-cpu', 'b-h100', 'b-next'], hit: 'b-next', label: 'The newest', html: `NVIDIA's B200 (2024) reaches 8 TB a second. The next kind, <b>HBM4</b>, doubles each stack to 2,048 wires, and NVIDIA has announced its Rubin GPUs (2026) with about 22 TB a second.` },
    ],
  });
  await guide.next();
  await cmp.hide();
}
