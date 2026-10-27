// ACT 4 · STEP 3 — "Registers: where numbers are stored".
// Rebuilt to the micro-learning contract in DESIGN_MAKEOVER.md §2 / §5. Ripu's playtest
// complaint about the old version was a stack of R0..R7 with no explanation and no labels,
// so nothing here appears before the card that names it: one shelf, then the file, then the
// picker, then the bill. The payoff is drawn as two bars to scale instead of asserted in a
// paragraph. Then the map of where numbers wait further out (js/art/rings.js), which the
// lab fills in with a real GPU's sizes. The systolic half of the old step 3 is now its own step.
import { sleep, svgEl } from '../../engine/util.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeMuxRig } from '../../engine/mathengine.js';
import { slideInPanel } from '../../engine/components.js';
import { labMemoryLadder } from './lab.js';
import { ringsMap, RING_LEVELS, ringPoint } from '../../art/rings.js';

/* rig geometry — kept here so the scene around it (wire, engine, bars) stays in step */
const RIG = { x: 150, y: 54, n: 8, p: 4 };
const CELL = 30, GAP = 8, ROW_H = CELL + GAP;
const FILE_W = RIG.p * (CELL + GAP) - GAP;                 // 144
const FILE_R = RIG.x + FILE_W;                             // 294
const OUT_Y = RIG.y + RIG.n * ROW_H + 24;                  // 382
const OUT_MID = OUT_Y + CELL / 2;                          // 397

const ENGINE = { x: 400, y: 370, w: 210, h: 54 };

/* the two gate counts, from the old step's copy: ~180 to fetch, ~35 to compute */
const FETCH_GATES = 180, MATH_GATES = 35;
const BAR = { x: 380, w: 300 };                            // 300px = 180 gates

async function fadeOut(nodes, dur = 300){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(1 - p); }));
  list.forEach(n => { n.style.display = 'none'; });
}
async function fadeIn(nodes, dur = 320){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  list.forEach(n => { n.style.display = ''; n.style.opacity = '0'; });
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(p); }));
  list.forEach(n => { n.style.opacity = '1'; });
}
const hide = nodes => nodes.forEach(n => { n.style.opacity = '0'; n.style.display = 'none'; });

function text(parent, x, y, s, cls = 'lbl', anchor = 'start'){
  const t = svgEl('text', { x, y, class: cls, style: `text-anchor:${anchor}` });
  t.textContent = s;
  parent.appendChild(t);
  return t;
}

export async function step3(){
  guide.title('STEP 3 / 6', 'Moving numbers is more expensive than <em>performing operations on them</em>');
  guide.cards();

  const stage = newStage('17', 'One register, then a register file, then the mux that picks one of them');
  const { svg } = stage;

  /* ============ the engine from step 2, the thing everything is delivered to ======== */

  const engine = svgEl('g');
  engine.appendChild(svgEl('rect', {
    x: ENGINE.x, y: ENGINE.y, width: ENGINE.w, height: ENGINE.h, rx: 5, class: 'tile-bg',
  }));
  text(engine, ENGINE.x + ENGINE.w / 2, ENGINE.y + 24, 'MULTIPLY + ADD', 'gate-lbl', 'middle');
  text(engine, ENGINE.x + ENGINE.w / 2, ENGINE.y + 42, 'ABOUT 35 GATES', 'lbl-faint', 'middle');
  svg.appendChild(engine);

  guide.say(`The MAC unit you built last step needs its numbers delivered every cycle. This
    step is about where they wait, and what the delivery costs.`);
  stage.focus(engine, { label: 'the MAC unit you built', at: 'top' });
  await guide.next();

  /* ============ CARD 2 — one register, alone on the stage ========================== */

  const rig = makeMuxRig(svg, RIG);
  const rows = [...rig.el.querySelectorAll('.mux-row')];
  // the funnel, the four output cells and their caption are the only direct
  // rect/text/path children of the rig group; the eight rows are <g>s.
  const merge = [...rig.el.querySelectorAll(':scope > rect, :scope > text, :scope > path')];
  const tabs = rows.flatMap(r => [r.children[0], r.children[1]]);   // tab rect + its R-number

  const wire = svgEl('path', { d: `M${FILE_R} ${OUT_MID} H${ENGINE.x}`, class: 'wire' });
  svg.appendChild(wire);

  hide(rows.slice(1));
  hide(merge);
  hide([wire]);

  stage.clearFocus();
  await fadeIn([rows[0]], 340);

  guide.say(`A register stores one number, and it sits right next to the MAC unit. This one
    holds 0011.`);
  stage.focus(rows[0], { label: 'register R0', at: 'right' });
  await guide.next();

  /* ============ CARD 3 — seven more shelves make the file ========================== */

  stage.clearFocus();
  await fadeIn(rows.slice(1), 420);

  guide.say(`Eight registers together are a register file. Your MAC unit reads its numbers
    from here and nowhere else.`);
  stage.focus(rows, { label: 'register file', at: 'right' });
  await guide.next();

  /* ============ CARD 4 — the mux, watched (Act 4 restructure, 2026-10-25) ===========
     The old four cards (name the mux, tap R3, what it did, the gate bill) became this one
     watch card and the picture on the next. The mux picks R3 on its own. */

  stage.clearFocus();
  await fadeIn([...merge, wire], 360);
  if (!flow.instant) await sleep(500);
  await rig.select(3);

  guide.say(`To read one register, the chip uses a <b>mux</b> (short for multiplexer), made of
    AND and OR gates. Here it passes R3 down to the MAC unit and blocks the other seven.`);
  stage.focus([...tabs, ...merge], { label: 'mux', at: 'left', ring: false });
  await guide.next();

  /* ============ CARD 5 — the bill, drawn to scale ================================== */

  stage.clearFocus();
  const bars = svgEl('g');
  svg.appendChild(bars);
  const px = g => BAR.w * g / FETCH_GATES;
  const mkBar = (y, label, sub, amber) => {
    text(bars, BAR.x, y - 22, label, 'lbl-strong');
    text(bars, BAR.x, y - 8, sub, 'lbl-faint');
    const r = svgEl('rect', {
      x: BAR.x, y, width: 0, height: 38, rx: 3,
      class: 'tile-bg',
      style: amber ? 'fill:var(--amber-soft);stroke:var(--amber)' : 'fill:var(--blue-soft);stroke:var(--blue)',
    });
    bars.appendChild(r);
    return r;
  };
  const fetchBar = mkBar(132, `DELIVERY · ${FETCH_GATES} GATES`, '3 MUXES × 60 GATES (32 AND + 28 OR)', true);    // amber = cost
  const mathBar = mkBar(240, `MATHS · ${MATH_GATES} GATES`, 'THE MAC UNIT', false);
  await Anim.tween(620, p => {
    fetchBar.setAttribute('width', String(px(FETCH_GATES) * p));
    mathBar.setAttribute('width', String(px(MATH_GATES) * p));
  });
  if (!flow.instant){ SFX.blip(); await sleep(120); }

  guide.aha(`The MAC unit reads three numbers every cycle, so it needs three muxes: 180 gates
    to deliver the numbers, against about 35 gates for the maths. That is five gates of
    delivery for every gate of maths, on every cycle.`,
    `Measured in energy on a real chip, the gap is far wider: fetching a number from even a
     small on-chip memory costs 100 to 250 times more than adding it.`);
  stage.focus(bars, { ring: true });
  await guide.next();

  /* ============ CARD 6 — the map: where numbers wait beyond the register file ========
     The near-to-far rings (js/art/rings.js), the step's main map. A number keeps travelling
     in from each ring to the MAC unit, slower the further out it starts. */

  stage.clearFocus();
  const stage2 = newStage('17', 'Rings around the MAC unit: registers, L1 cache, L2 cache, main memory');
  const svg2 = stage2.svg;
  const map = svgEl('g');
  map.innerHTML = ringsMap();
  svg2.appendChild(map);
  const dots = RING_LEVELS.map(L => {
    const d = svgEl('circle', { r: 4.6, fill: 'var(--blue)' });
    svg2.appendChild(d);
    return { L, d };
  });
  let t0 = null;
  Anim.add((dt, t) => {
    if (t0 === null) t0 = t;
    dots.forEach(({ L, d }) => {
      const k = ((t - t0) % (L.trip + .5)) / L.trip, q = Math.min(1, k), mid = (L.r[0] + L.r[1]) / 2;
      const [x, y] = ringPoint(mid + (38 - mid) * q, L.ang);
      d.setAttribute('cx', x.toFixed(1)); d.setAttribute('cy', y.toFixed(1));
      d.style.opacity = k > 1 ? '0' : '1';
    });
  });

  // Course restructure (2026-10-25): the rings point back to Act 2's SRAM loop and RAM stick
  guide.say(`Your register file is small. Numbers that do not fit wait further out: first in the
    caches, which are SRAM loops like the one in Act 2, then in main memory, which is DRAM.
    Each ring out holds more, and its numbers take longer to reach the MAC unit.`);
  await guide.next();

  /* ============ IN THE LAB — the memory ladder on a real GPU (§6d rule 8) ============
     The H100's registers, L1 and shared memory, L2 and HBM, nearest the lanes first.
     Sizes from NVIDIA's Hopper architecture article; sources in lab.js. */
  stage2.clearFocus();
  const lab = slideInPanel(svg2, labMemoryLadder(), { lab: true });
  lab.focus(['reg', 'sm']);
  await lab.show();

  // Course restructure (2026-10-25): the SM is defined in step 1's lab; each rung names its ring
  guide.lab(`You built a register file beside your MAC unit. On a real GPU, every <b>SM</b>
    (from step 1) has its own, and it is ring 1 of the map. On NVIDIA's H100, each one holds
    256 KB, enough for 65,536 numbers of 32 bits.`, { intro: true });
  await guide.next();

  lab.focus(['l1', 'sm']);
  // Course restructure (2026-10-25): "cache" is defined on the rings card, so it is not defined again
  guide.lab(`Ring 2 is the L1 cache, 256 KB in each SM. The program can set up to 228 KB of it
    aside as <b>shared memory</b>, which it fills itself, so shared memory is part of ring 2.`);
  await guide.next();

  lab.focus(['l2', 'pkg']);
  guide.lab(`Ring 3 is the L2 cache, 50 MB in the middle of the die. All 132 SMs share
    it, so a number that one SM has fetched can be read by the others from here.`);
  await guide.next();

  lab.focus(['hbm', 'pkg']);
  // Course restructure (2026-10-25): HBM is ring 4; no hyphen, to match the step 5 title
  guide.lab(`Ring 4, the main memory, is <b>HBM</b> (high bandwidth memory): stacks of memory
    chips beside the die, 80 GB on the H100. It holds the model's weights and data, and every
    number the lanes use is copied in from here, through the caches, to a register.`);
  await guide.next();
  await lab.hide();
}
