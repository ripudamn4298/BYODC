// ACT 4 · STEP 3 — "Registers: where numbers are stored".
// Rebuilt to the micro-learning contract in DESIGN_MAKEOVER.md §2 / §5. Ripu's playtest
// complaint about the old version was a stack of R0..R7 with no explanation and no labels,
// so nothing here appears before the card that names it: one shelf, then the file, then the
// picker, then the read, then the bill. The payoff is drawn as two bars to scale instead of
// asserted in a paragraph. The systolic half of the old step 3 is now its own step.
import { sleep, waitFor, svgEl } from '../../engine/util.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeMuxRig } from '../../engine/mathengine.js';

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
  guide.title('STEP 3 / 6 · NANOVOLT GRAPHICS', 'Registers: <em>where numbers are stored</em>');
  guide.cards();

  const stage = newStage('15', 'One register, then a register file, then the mux that picks one of them');
  const { svg } = stage;

  /* ============ the engine from step 2, the thing everything is delivered to ======== */

  const engine = svgEl('g');
  engine.appendChild(svgEl('rect', {
    x: ENGINE.x, y: ENGINE.y, width: ENGINE.w, height: ENGINE.h, rx: 5, class: 'tile-bg',
  }));
  text(engine, ENGINE.x + ENGINE.w / 2, ENGINE.y + 24, 'MULTIPLY + ADD', 'gate-lbl', 'middle');
  text(engine, ENGINE.x + ENGINE.w / 2, ENGINE.y + 42, 'ABOUT 35 GATES', 'lbl-faint', 'middle');
  svg.appendChild(engine);

  guide.say(`The engine you built last step needs its numbers delivered every cycle. This
    step is about where they wait, and what the delivery costs.`);
  stage.focus(engine, { label: 'the engine you built', at: 'top' });
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

  guide.say(`A register is a small shelf that stores one number, right next to the engine.
    This one holds 0011.`);
  stage.focus(rows[0], { label: 'register R0', at: 'right' });
  await guide.next();

  /* ============ CARD 3 — seven more shelves make the file ========================== */

  stage.clearFocus();
  await fadeIn(rows.slice(1), 420);

  guide.say(`Eight of those shelves together are a register file. Your engine reads its
    numbers from here and nowhere else.`);
  stage.focus(rows, { label: 'register file', at: 'right' });
  await guide.next();

  /* ============ CARD 4 — the picker ================================================ */

  stage.clearFocus();
  await fadeIn([...merge, wire], 360);

  guide.say(`A mux picks one register and ignores the other seven. You will build it out of
    nothing but AND and OR.`);
  stage.focus([...tabs, ...merge], { label: 'mux', at: 'left', ring: false });
  await guide.next();

  /* ============ CARD 5 — read register R3 ========================================== */

  stage.clearFocus();

  guide.say(`Tap the tab marked <b>R3</b> on the left. Watch what happens to the seven rows
    you did not pick.`);

  await flow.ask(async replay => {
    if (replay !== undefined){ rig.select(3); return replay; }

    const cancelHint = flow.hintAfter(15000,
      `The tabs run R0 at the top to R7 at the bottom. <b>R3</b> is the fourth one down.`);
    let solved = false;

    const tap = async i => {
      if (solved) return;
      cancelHint();          // a pending hint must not overwrite the feedback for this tap
      SFX.click();
      await rig.select(i);
      if (i === 3){ solved = true; SFX.success(); }
      else guide.note(`That read register R${i}, and it worked. Now read <b>R3</b>.`);
    };

    rows.forEach((rowG, i) => {
      rowG.style.cursor = 'pointer';
      rowG.setAttribute('tabindex', '0');
      rowG.setAttribute('role', 'button');
      rowG.setAttribute('aria-label', `read register R${i}`);
      rowG.addEventListener('click', () => tap(i));
      rowG.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); tap(i); }
      });
    });

    await waitFor(() => solved, { hold: 200 });
    cancelHint();
    return 3;
  });

  /* ============ CARD 6 — what the mux just did ===================================== */

  guide.say(`The seven rows you did not pick were ANDed with 0 and faded to nothing. The OR
    funnel merged what was left into one row.`);
  stage.focus(merge, { label: 'or funnel', at: 'left' });
  await guide.next();

  /* ============ CARD 7 — the gate bill ============================================= */

  stage.clearFocus();
  const tally = svgEl('g');
  svg.appendChild(tally);
  text(tally, BAR.x, 128, 'MASK: 8 ROWS x 4 BITS = 32 ANDS');
  text(tally, BAR.x, 152, 'MERGE: 7 x 4 = 28 ORS');
  text(tally, BAR.x, 176, 'ONE MUX = 60 GATES');
  text(tally, BAR.x, 208, 'THREE MUXES = 180 GATES', 'lbl-strong');
  text(tally, BAR.x, 228, 'TWO NUMBERS TO MULTIPLY, ONE RUNNING TOTAL', 'lbl-faint');
  await fadeIn([tally], 340);

  guide.say(`Masking costs 32 AND gates and merging costs 28 OR gates. The engine reads
    three numbers a cycle, so it needs three muxes.`);
  stage.focus(tally, { label: 'the gate bill', at: 'top' });
  await guide.next();

  /* ============ CARD 8 — the same two numbers, drawn to scale ====================== */

  stage.clearFocus();
  await fadeOut([tally], 260);

  const bars = svgEl('g');
  svg.appendChild(bars);
  const px = g => BAR.w * g / FETCH_GATES;
  const mkBar = (y, label, amber) => {
    text(bars, BAR.x, y - 8, label);
    const r = svgEl('rect', {
      x: BAR.x, y, width: 0, height: 38, rx: 3,
      class: 'tile-bg',
      style: amber ? 'fill:var(--amber-soft);stroke:var(--amber)' : 'fill:var(--blue-soft);stroke:var(--blue)',
    });
    bars.appendChild(r);
    return r;
  };
  const fetchBar = mkBar(140, `FETCH · ${FETCH_GATES} GATES`, true);    // amber = cost
  const mathBar = mkBar(230, `MATH · ${MATH_GATES} GATES`, false);
  await Anim.tween(620, p => {
    fetchBar.setAttribute('width', String(px(FETCH_GATES) * p));
    mathBar.setAttribute('width', String(px(MATH_GATES) * p));
  });
  if (!flow.instant){ SFX.blip(); await sleep(120); }

  guide.say(`Here are both costs, drawn to scale. Delivering the numbers takes more gates
    than the arithmetic they feed.`);
  stage.focus(bars, { ring: true });
  await guide.next();

  /* ============ CARD 9 — the closing ============================================== */

  stage.clearFocus();
  guide.aha(`Five gates of delivery for every gate of math, paid on every operation, every
    cycle. The next step stops paying it.`);
  await guide.next();
}
