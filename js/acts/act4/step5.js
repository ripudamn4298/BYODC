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
import { makeSlider } from '../../engine/components.js';

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
  guide.title('STEP 5 / 6 · NANOVOLT GRAPHICS', 'Match memory <em>to compute</em>');
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

  guide.say(`These are your sixteen lanes from step 1. A lane computes only when its
    numbers arrive, so here you make delivery match what the lanes need.`);
  stage.focus(grid.g, { label: 'sixteen lanes', at: 'bottom' });
  await guide.next();

  /* ================= CARD 2 — the stacks ============================================ */

  stage.clearFocus();
  await fadeIn([stacksG]);
  guide.say(`Memory sits in stacks of chips, and each stack delivers numbers at a fixed
    rate called its <b>bandwidth</b>. More stacks, more numbers per cycle.`);
  stage.focus(stacksG, { label: 'hbm stack', at: 'right' });
  await guide.next();

  /* ================= CARD 3 — the bundle, the load-bearing picture ================== */

  stage.clearFocus();
  await fadeIn([bundleG]);
  guide.say(`Every wire carries one number per cycle. Add a stack and the bundle gets
    wider, because four more wires run across to the lanes.`);
  stage.focus(bundleG, { label: 'one wire, one number per cycle', at: 'top' });
  await guide.next();

  /* ================= CARDS 4 and 5 — the two counters =============================== */

  stage.clearFocus();
  await fadeIn([neededC.g]);
  guide.say(`Each lane asks for one number every cycle. This counter totals what the
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
  guide.say(`Blue means the lane has its numbers. Amber means the lane is waiting for
    data.`);
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

  guide.say(`This rig has too many lanes for its memory. Pull the sliders until
    utilization reaches <b>90% or better</b>.`);

  await flow.ask(async replay => {
    if (replay !== undefined){ setRig(replay.lanes, replay.stacks); return replay; }
    setRig(MAX_LANES, 1);
    const cancel = flow.hintAfter(14000, `Sixteen lanes ask for sixteen numbers a cycle,
      and one stack sends four. Add stacks, or build fewer lanes, until utilization reads
      <b>90% or better</b>.`);
    await waitFor(() => render().util >= 0.9, { hold: 500 });
    cancel();
    return { lanes: laneCount, stacks: stackCount };
  });

  guide.note(`Every lamp is blue and the two counters agree. Nothing on this die is
    waiting for data.`);
  await guide.next();

  /* ================= CARD 9 — second fix: memory nobody asks for ==================== */

  guide.say(`The faint wires carry nothing, because this rig pays for memory its lanes
    never ask for. Bring memory down and hold utilization at <b>90% or better</b>.`);

  await flow.ask(async replay => {
    if (replay !== undefined){ setRig(replay.lanes, replay.stacks); return replay; }
    setRig(4, MAX_STACKS);
    const cancel = flow.hintAfter(14000, `Drop stacks until delivery meets the lane count,
      or raise the lane count until it uses the memory you already bought. Keep utilization
      at <b>90% or better</b>.`);
    await waitFor(() => {
      const s = render();
      return s.util >= 0.9 && s.delivered - s.needed <= 2;
    }, { hold: 500 });
    cancel();
    return { lanes: laneCount, stacks: stackCount };
  });

  guide.note(`Delivery now matches demand, and every wire you paid for carries a number.`);
  await guide.next();

  /* ================= CARD 10 — payoff ============================================== */

  guide.aha(`Whichever of the two numbers is smaller caps the machine. Half of GPU design
    is delivery, not math.`,
    `The chart of that trade-off is called the <b>roofline</b>. The same problem comes back
     one floor up in Act 5, where a lane becomes a whole machine.`);
  stage.focus([deliveredC.g, neededC.g], { label: 'the smaller number wins', at: 'top', ring: false });
  await guide.next();
  stage.clearFocus();
}
