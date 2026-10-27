// ACT 4 · STEP 4 — "Move the data, not the weights".
// Rebuilt to the micro-learning contract in DESIGN_MAKEOVER.md §2 / §5. Playtest note
// that shaped this file: the player did not know what a weight was, what "the vector"
// meant, or what "edge" and "traffic" referred to. So: WEIGHT and DATA are drawn and
// named on a single enlarged engine before either word is used in an instruction; the
// send button says which numbers it sends; and the border is a line the player watches
// numbers cross, with IN, OUT and MULTIPLIES INSIDE counted on screen. The words "area"
// and "edge" arrive only after those counts exist, and only as 2 × 2 = 4 next to
// 128 × 128 = 16,384.
import { sleep, waitFor, svgEl, svgPt } from '../../engine/util.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeSystolic } from '../../engine/mathengine.js';
import { slideInPanel } from '../../engine/components.js';
import { labTiling, labSM, labChips } from './lab.js';
import { tensorCoreIcon } from '../../art/icons.js';

/* ---- geometry, all in the stage's 720 × 480 user units ---- */
const AX = 250, AY = 140, CELL = 86, PAD = 12;
const colX = c => AX + c * (CELL + PAD) + CELL / 2;        // 293, 391
const RES_Y = AY + 2 * (CELL + PAD);                        // 336 — result cells
const BUS_Y = 118, STEM_X = 342, STEM_TOP = 80;             // the one way in
const EXIT_Y = 398;                                          // the two ways out
const BX = 206, BY = 104, BW = 272, BH = 284;               // the drawn border
const CTR_X = 524;                                           // counter column

/* the parked matrix: left column 0 over 3, right column 1 over 2 */
const WEIGHTS = [[0, 1], [3, 2]];       // [row][col]
const DATA = [3, 7];                    // one number per row, sent down both columns
// 21 and 17, derived from the two constants above rather than typed in
const ANSWERS = [0, 1].map(c => WEIGHTS[0][c] * DATA[0] + WEIGHTS[1][c] * DATA[1]);

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

function txt(parent, x, y, s, cls = 'lbl-strong'){
  const t = svgEl('text', { x, y, class: cls });
  t.textContent = s;
  parent.appendChild(t);
  return t;
}

/* a short arrow: line plus drawn head, so the stage needs no <defs> */
function arrow(parent, x1, y1, x2, y2){
  const g = svgEl('g');
  g.appendChild(svgEl('line', { x1, y1, x2, y2, class: 'wire' }));
  const a = Math.atan2(y2 - y1, x2 - x1), h = 7;
  g.appendChild(svgEl('path', {
    d: `M${x2} ${y2} L${x2 - h * Math.cos(a - .42)} ${y2 - h * Math.sin(a - .42)} L${x2 - h * Math.cos(a + .42)} ${y2 - h * Math.sin(a + .42)} Z`,
    fill: 'var(--ink)',
  }));
  parent.appendChild(g);
  return g;
}

/* a boxed tally: mono name over a big number, so a count is read, not asserted */
function makeCounter(parent, x, y, label){
  const g = svgEl('g');
  g.appendChild(svgEl('rect', { x, y, width: 152, height: 52, rx: 4, class: 'tile-bg' }));
  txt(g, x + 76, y + 19, label, 'lbl-strong');
  const v = txt(g, x + 76, y + 43, '0', 'tile-letter');
  parent.appendChild(g);
  return { g, set(n){ v.textContent = String(n); } };
}

export async function step4(){
  guide.title('STEP 4 / 6', 'All of AI is just <em>matrix multiplication</em>');
  guide.cards();

  const stage = newStage('18', 'Weights parked in four MAC units while data moves through them');
  const { svg } = stage;

  // everything inside the border lives in one group, so it can shrink as one thing
  const world = svgEl('g');
  svg.appendChild(world);

  /* ============ CARD 1 — the preface, on the machine from the last step ============ */

  const sys = makeSystolic(world, { x: AX, y: AY, rows: 2, cols: 2, cell: CELL });
  world.style.opacity = '0';
  await fadeIn([world], 340);

  guide.say(`Here are four copies of the MAC unit you built in step 2. Each one takes two
    numbers. In AI, one of those two barely changes, so this step stops fetching it.`);
  stage.focus(sys.el, { label: 'four MAC units', at: 'right' });
  await guide.next();

  /* ============ CARD 2 — name the two numbers, both labelled on the drawing ======== */

  stage.clearFocus();
  const legend = svgEl('g');
  const LX = 96, LY = 196, LC = 92;
  legend.appendChild(svgEl('rect', { x: LX, y: LY, width: LC, height: LC, rx: 5, class: 'sys-cell-bg' }));
  legend.appendChild(svgEl('rect', { x: LX + 9, y: LY + 9, width: 30, height: 30, rx: 3, class: 'sys-wreg' }));
  txt(legend, LX + LC / 2, LY + LC / 2 + 14, '×+', 'sys-glyph');
  arrow(legend, LX - 66, LY + 24, LX + 4, LY + 24);          // into the register
  txt(legend, LX - 36, LY + 14, 'WEIGHT');
  arrow(legend, LX + LC / 2, LY - 38, LX + LC / 2, LY - 4);  // into the top of the cell
  txt(legend, LX + LC / 2, LY - 46, 'DATA');
  svg.appendChild(legend);
  await fadeIn([legend], 320);

  // REVIEW_NOTES N-110: what a weight is for, in Ripu's words: inference, and weights that stay put
  guide.say(`The <b>weight</b> is a number the AI model has learned. When you talk to ChatGPT,
    what you type goes through many matrix multiplications with these weights. This is called
    <b>inference</b>, and during it the weights never change.`);
  stage.focus(legend, { label: 'weight × data', at: 'right' });
  await guide.next();

  /* ============ CARD 2b — the other number ========================================= */

  guide.say(`The <b>data</b> is the other number. It is what keeps changing, cycle after
    cycle.`);
  stage.focus(legend, { label: 'weight × data', at: 'right' });
  await guide.next();

  /* ============ CARD 3 — park one weight in each engine's register ================= */

  stage.clearFocus();

  // each empty register shows, faintly, the number that belongs in it
  const ghosts = sys.cells.map(c => {
    const t = txt(world, c.cx + 22, c.cy + 27, String(WEIGHTS[c.r][c.c]), 'lbl-faint');
    t.style.fontSize = '13px';
    return t;
  });

  const TRAY = [{ v: 0, x: 250 }, { v: 1, x: 306 }, { v: 3, x: 362 }, { v: 2, x: 418 }];
  const TW = 38, TRAY_Y = 412;
  const tiles = TRAY.map(spec => {
    const g = svgEl('g', { class: 'tile', tabindex: '0', role: 'button', 'aria-label': `weight ${spec.v}` });
    g.appendChild(svgEl('rect', { width: TW, height: TW, rx: 4, class: 'tile-bg' }));
    const t = svgEl('text', { x: TW / 2, y: TW / 2 + 9, class: 'tile-letter' });
    t.textContent = String(spec.v);
    g.appendChild(t);
    svg.appendChild(g);
    return { g, v: spec.v, tx: spec.x, ty: TRAY_Y, home: { x: spec.x, y: TRAY_Y } };
  });
  const place = (tile, x, y, anim) => {
    tile.g.style.transition = anim ? 'transform .3s cubic-bezier(.22,.9,.24,1)' : 'none';
    tile.g.style.transform = `translate(${x}px,${y}px)`;
    tile.tx = x; tile.ty = y;
  };
  tiles.forEach(t => place(t, t.home.x, t.home.y, false));
  await fadeIn(tiles.map(t => t.g), 300);

  // Course restructure (2026-10-25): the register is ring 1 on step 3's map
  guide.say(`So park each weight in a register (ring 1 on step 3's map) beside its own MAC
    unit, and load it only once. Then the chip does not spend energy moving it again every
    cycle. Drag each number onto the register that is waiting for it.`);
  stage.focus([...sys.cells.map(c => c.wreg), ...ghosts, ...tiles.map(t => t.g)],
    { label: 'one register per MAC unit', at: 'top', ring: false });

  const parkAll = () => {
    sys.cells.forEach(c => sys.setWeight(c.r, c.c, WEIGHTS[c.r][c.c]));
    ghosts.forEach(g => { g.style.display = 'none'; });
    tiles.forEach(t => { t.g.style.display = 'none'; });
  };

  await flow.ask(async replay => {
    if (replay !== undefined){ parkAll(); return replay; }

    const cancelHint = flow.hintAfter(15000,
      `Every empty register shows the number it wants. Drag that number onto it.`);
    let done = 0;

    const park = (cell, tile) => {
      sys.setWeight(cell.r, cell.c, tile.v);
      ghosts[sys.cells.indexOf(cell)].style.display = 'none';
      tile.g.style.display = 'none';
      SFX.dope();
      done++;
    };
    const homeFor = tile => sys.cells.find(c => c.weight == null && WEIGHTS[c.r][c.c] === tile.v);

    /* REVIEW_NOTES N-061: show the move before asking for it. An amber dashed arrow (amber is
       "in flight, not landed yet", DESIGN.md §1a) runs from the first number to the register
       that wants it, and a faint copy of the number, with a pointer, keeps gliding along it.
       It goes the moment the player touches any number. Live play only: replay never builds it. */
    const demo = (() => {
      const tile = tiles[0], cell = homeFor(tile);
      if (!cell) return { stop(){} };
      const r = cell.wreg.getBoundingClientRect();
      const end = svgPt(svg, r.left + r.width / 2, r.top + r.height / 2);
      const sx = tile.home.x + TW / 2, sy = tile.home.y - 4;
      const g = svgEl('g', { 'pointer-events': 'none' });
      const path = svgEl('path', { d: `M${sx} ${sy} Q${sx - 70} ${(sy + end.y) / 2} ${end.x} ${end.y + 22}`,
        fill: 'none', stroke: 'var(--amber)', 'stroke-width': 2, 'stroke-dasharray': '6 5', 'stroke-linecap': 'round' });
      const tip = svgEl('path', { d: 'M-7 -9 L0 0 L7 -9', fill: 'none', stroke: 'var(--amber)', 'stroke-width': 2, 'stroke-linecap': 'round' });
      const ghost = svgEl('g', { opacity: .6 });
      ghost.innerHTML = `<rect x="${-TW / 2}" y="${-TW / 2}" width="${TW}" height="${TW}" rx="4" fill="var(--paper-high)" stroke="var(--amber)" stroke-width="1.6" stroke-dasharray="4 3"/>
        <text x="0" y="9" class="tile-letter">${tile.v}</text>
        <path d="M6 8 L6 26 L11 21 L15 30 L18 28.5 L14 20 L21 20 Z" fill="var(--ink)" stroke="var(--paper-high)" stroke-width="1.2"/>`;
      const lbl = svgEl('text', { x: sx - 26, y: sy - 10, class: 'lbl', 'text-anchor': 'end', style: 'fill:var(--amber)' });
      lbl.textContent = 'DRAG IT UP TO ITS REGISTER';
      g.append(path, tip, ghost, lbl);
      svg.appendChild(g);
      const L = path.getTotalLength(), a = path.getPointAtLength(L - 1), b = path.getPointAtLength(L);
      tip.setAttribute('transform', `translate(${b.x} ${b.y}) rotate(${(Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI - 90).toFixed(1)})`);
      let t0 = null;
      const tick = Anim.add((dt, t) => {
        if (t0 === null) t0 = t;
        const k = ((t - t0) % 2.4) / 1.5, q = Math.min(1, k), e = q < .5 ? 2 * q * q : 1 - (-2 * q + 2) ** 2 / 2;
        const pt = path.getPointAtLength(L * e);
        ghost.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
        ghost.setAttribute('opacity', k > 1 ? (0.6 * Math.max(0, 1 - (k - 1) * 2)).toFixed(2) : '.6');
      });
      let gone = false;
      return { stop(){ if (gone) return; gone = true; Anim.remove(tick); g.remove(); } };
    })();

    tiles.forEach(tile => {
      let drag = null;
      tile.g.addEventListener('pointerdown', e => {
        if (tile.g.style.display === 'none') return;
        demo.stop();
        e.preventDefault();
        tile.g.setPointerCapture(e.pointerId);
        const p = svgPt(svg, e.clientX, e.clientY);
        drag = { ox: p.x - tile.tx, oy: p.y - tile.ty, sx: e.clientX, sy: e.clientY, moved: false };
      });
      tile.g.addEventListener('pointermove', e => {
        if (!drag) return;
        if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) drag.moved = true;
        if (!drag.moved) return;
        const p = svgPt(svg, e.clientX, e.clientY);
        place(tile, p.x - drag.ox, p.y - drag.oy, false);
      });
      tile.g.addEventListener('pointerup', () => {
        if (!drag) return;
        const moved = drag.moved; drag = null;
        if (!moved){ place(tile, tile.home.x, tile.home.y, true); return; }
        const cx = tile.tx + TW / 2, cy = tile.ty + TW / 2;
        const cell = sys.cells.find(c => c.weight == null
          && Math.abs(cx - (c.cx + CELL / 2)) < 56 && Math.abs(cy - (c.cy + CELL / 2)) < 56);
        if (!cell){ place(tile, tile.home.x, tile.home.y, true); return; }
        if (WEIGHTS[cell.r][cell.c] !== tile.v){
          place(tile, tile.home.x, tile.home.y, true);
          guide.note(`That register is waiting for a different number. Each empty register
            shows the one it wants.`);
          return;
        }
        park(cell, tile);
      });
      tile.g.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        demo.stop();
        const cell = homeFor(tile);
        if (cell) park(cell, tile);
      });
    });

    await waitFor(() => done === 4, { hold: 260 });
    demo.stop();
    cancelHint();
    return true;
  });

  stage.clearFocus();

  /* ============ CARD 4 — only the data moves ====================================== */

  // the one way in: a stem down to a bus that feeds both columns
  const feed = svgEl('g');
  feed.appendChild(svgEl('line', { x1: STEM_X, y1: STEM_TOP, x2: STEM_X, y2: BUS_Y, class: 'wire' }));
  feed.appendChild(svgEl('line', { x1: colX(0), y1: BUS_Y, x2: colX(1), y2: BUS_Y, class: 'wire' }));
  world.appendChild(feed);
  world.querySelectorAll('.sys-feed').forEach(w => w.setAttribute('y1', BUS_Y));
  const exits = svgEl('g');
  for (let c = 0; c < 2; c++){
    exits.appendChild(svgEl('line', { x1: colX(c), y1: RES_Y + 30, x2: colX(c), y2: EXIT_Y, class: 'wire' }));
  }
  world.appendChild(exits);
  const feedNote = txt(feed, STEM_X, 58, 'THE SAME TWO NUMBERS FEED BOTH COLUMNS', 'lbl-faint');
  const stayNote = txt(world, STEM_X, 436, 'WEIGHTS STAY · DATA MOVES', 'lbl-strong');
  stayNote.style.opacity = '0';
  await fadeIn([feed, exits], 320);

  guide.say(`Now only the data moves. Send 3 and 7 down the columns, then watch each MAC unit
    multiply them by the weight parked in it.`);
  stage.focus(feed, { label: 'data comes in here', at: 'top' });

  await guide.button('Send 3 and 7 down the columns ▸');
  stage.clearFocus();
  await sys.pulse(DATA);
  await fadeIn([stayNote], 240);

  /* ============ CARD 5 — the two answers ========================================== */

  const resultNodes = [...world.querySelectorAll('.sys-result, .sys-result-t')];
  guide.say(`Left column: 0×3 + 3×7 = <b>21</b>. Right column: 1×3 + 2×7 = <b>17</b>. You
    just did a matrix multiply (a matrix of weights times a list of data, all in one go).`);
  stage.focus(resultNodes, { label: 'the two answers', at: 'bottom' });
  await guide.next('Draw a border around the four MAC units ▸');

  /* ============ CARD 6 — the border, drawn, and the crossings counted ============= */

  stage.clearFocus();
  await fadeOut([legend, feedNote], 260);

  const borderG = svgEl('g');
  borderG.appendChild(svgEl('rect', { x: BX, y: BY, width: BW, height: BH, rx: 3, class: 'junction', fill: 'none' }));
  txt(borderG, BX + 44, BY - 8, 'BORDER');
  const CROSS = [[STEM_X, BY], [colX(0), BY + BH], [colX(1), BY + BH]];
  // the three points where a number can cross: one in at the top, two out at the bottom
  CROSS.forEach(([cx, cy]) => borderG.appendChild(svgEl('circle', { cx, cy, r: 5.5, class: 'sys-result' })));
  world.appendChild(borderG);
  await fadeIn([borderG], 380);

  const meters = svgEl('g');
  svg.appendChild(meters);
  const leader = (x1, y1, x2, y2) => meters.appendChild(svgEl('line', { x1, y1, x2, y2, class: 'wire dim' }));
  leader(CTR_X, 152, STEM_X + 14, BY + 6);
  leader(CTR_X, 240, AX + 2 * CELL + PAD + 10, 236);
  leader(CTR_X, 328, colX(1) + 10, BY + BH - 4);
  const inC = makeCounter(meters, CTR_X, 126, 'IN');
  const mulC = makeCounter(meters, CTR_X, 214, 'MULTIPLIES INSIDE');
  const outC = makeCounter(meters, CTR_X, 302, 'OUT');
  await fadeIn([meters], 320);

  // watch each number cross the line and each engine tick over, one at a time
  const chip = (kind, value, x, y) => {
    const g = svgEl('g', { class: `sys-chip ${kind}` });
    g.appendChild(svgEl('circle', { r: 14 }));
    const t = svgEl('text', { x: 0, y: 5, class: 'sys-chip-t' });
    t.textContent = String(value);
    g.appendChild(t);
    g.setAttribute('transform', `translate(${x},${y})`);
    world.appendChild(g);
    return g;
  };
  const marks = [];

  let nIn = 0;
  for (const v of DATA){
    const c = chip('data', v, STEM_X, STEM_TOP + 4);
    let ticked = false;
    await Anim.tween(460, p => {
      const y = (STEM_TOP + 4) + p * (BUS_Y - STEM_TOP - 4);
      c.setAttribute('transform', `translate(${STEM_X},${y})`);
      if (!ticked && y >= BY){ ticked = true; nIn++; inC.set(nIn); SFX.blip(); }
    });
    c.remove();
  }

  let nMul = 0;
  for (const cell of sys.cells){
    cell.cellG.classList.add('flash');
    const dot = svgEl('circle', { cx: cell.cx + CELL - 13, cy: cell.cy + 14, r: 4.5, class: 'dotbit' });
    world.appendChild(dot);
    marks.push(dot);
    nMul++; mulC.set(nMul); SFX.click();
    await sleep(200);
    cell.cellG.classList.remove('flash');
  }

  let nOut = 0;
  for (let c = 0; c < 2; c++){
    const g = chip('sum', ANSWERS[c], colX(c), RES_Y + 15);
    let ticked = false;
    await Anim.tween(460, p => {
      const y = (RES_Y + 15) + p * (EXIT_Y + 14 - RES_Y - 15);
      g.setAttribute('transform', `translate(${colX(c)},${y})`);
      if (!ticked && y >= BY + BH){ ticked = true; nOut++; outC.set(nOut); SFX.blip(); }
    });
    g.remove();
  }

  guide.say(`Two numbers came in, two went out, and four multiplies were done inside. The
    register file and mux from step 3 would have re-fetched every weight, every cycle.`);
  // the counters, the three points on the line and the four marks inside all stay at
  // full ink: they are the evidence for every number in this card
  stage.focus([meters, borderG, ...marks], { label: 'what crossed the border', at: 'top', ring: false });
  await guide.next('Try it at 128 by 128 ▸');

  /* ============ CARD 7 — the same two counts on a bigger square =================== */

  stage.clearFocus();
  await fadeOut([meters], 240);

  const SHRINK = { s: 0.42, cx: 342, cy: 248, tx: 154, ty: 258 };
  const worldXf = p => {
    const s = 1 + (SHRINK.s - 1) * p;
    const dx = (SHRINK.tx - SHRINK.cx) * p, dy = (SHRINK.ty - SHRINK.cy) * p;
    return `translate(${dx.toFixed(2)} ${dy.toFixed(2)}) translate(${SHRINK.cx} ${SHRINK.cy}) `
      + `scale(${s.toFixed(4)}) translate(${-SHRINK.cx} ${-SHRINK.cy})`;
  };
  await Anim.tween(600, p => world.setAttribute('transform', worldXf(p)));

  const scale = svgEl('g');
  const SQ = { x: 322, y: 152, w: 224 };
  scale.appendChild(svgEl('rect', { x: SQ.x, y: SQ.y, width: SQ.w, height: SQ.w, rx: 3, class: 'junction', fill: 'none' }));
  for (let i = 1; i < 8; i++){
    const d = SQ.x + i * (SQ.w / 8), e = SQ.y + i * (SQ.w / 8);
    scale.appendChild(svgEl('line', { x1: d, y1: SQ.y, x2: d, y2: SQ.y + SQ.w, class: 'sys-feed' }));
    scale.appendChild(svgEl('line', { x1: SQ.x, y1: e, x2: SQ.x + SQ.w, y2: e, class: 'sys-feed' }));
  }
  txt(scale, 154, 396, 'YOUR ARRAY · 2 × 2');
  txt(scale, SQ.x + SQ.w / 2, 396, 'ONE REAL ARRAY · 128 × 128');
  const stats = svgEl('g');
  txt(stats, 154, 424, 'MULTIPLIES  2 × 2 = 4');
  txt(stats, 154, 446, 'IN AND OUT  2 + 2 = 4');
  txt(stats, SQ.x + SQ.w / 2, 424, 'MULTIPLIES  128 × 128 = 16,384');
  txt(stats, SQ.x + SQ.w / 2, 446, 'IN AND OUT  128 + 128 = 256');
  scale.appendChild(stats);
  svg.appendChild(scale);
  await fadeIn([scale], 380);

  guide.say(`At 128 by 128, that is 16,384 multiplies per cycle for only 256 numbers in and
    out.`);
  stage.focus([world, scale], { label: '2 × 2 against 128 × 128', at: 'top', ring: false });
  await guide.next();

  /* ============ CARD 7b — area against edge ======================================== */

  guide.say(`Multiplies grow with the <b>area</b> of the square. Border crossings grow only
    with its <b>edge</b> (the length of one side).`);
  stage.focus([world, scale], { label: '2 × 2 against 128 × 128', at: 'top', ring: false });
  await guide.next();

  /* ============ CARD 8 — the name ================================================= */

  stage.clearFocus();
  await fadeOut([scale], 280);
  await Anim.tween(560, p => world.setAttribute('transform', worldXf(1 - p)));
  world.setAttribute('transform', '');

  // Course restructure (2026-10-25): the TPU line is dropped here; the TPU lab card says it properly
  guide.aha(`The data moves through it in beats, so its inventors named it after the
    heartbeat: a <b>systolic array</b>.`);
  stage.focus(world, { label: 'systolic array', at: 'right', ring: false });
  await guide.next();

  /* the Tensor Core, by definition, with the picture (js/art/icons.js) the act reuses */
  stage.clearFocus();
  const tcG = svgEl('g');
  tcG.innerHTML = `${tensorCoreIcon(560, 168, 96)}
    <text x="608" y="290" class="lbl-strong">TENSOR CORE</text>
    <text x="608" y="306" class="lbl-faint" font-size="8">A BLOCK OF MAC UNITS</text>`;
  svg.appendChild(tcG);
  tcG.style.opacity = '0';
  await Anim.tween(320, p => { tcG.style.opacity = String(p); });
  // Course restructure (2026-10-25): one definition, tied to the array; no card-number reference
  guide.say(`A block of MAC units that multiplies two small matrices in one go, as your array
    just did, is what NVIDIA calls a <b>Tensor Core</b> (the name from step 2's lab).`);
  stage.focus([world, tcG], { label: 'a block of MAC units', at: 'top', ring: false });
  await guide.next();
  stage.clearFocus();
  await Anim.tween(240, p => { tcG.style.opacity = String(1 - p); });
  tcG.remove();

  /* ============ REVIEW_NOTES N-109: a whole matrix times a matrix, on the same array =====
     The data becomes a 2 × 2 matrix, one row per input. Row 1 (3, 7) already went through
     and gave 21, 17. Row 2 (2, 1) goes through now and gives 3, 4. The answers stack into
     the answer matrix. Blue marks the row in flight (live data, DESIGN.md §1a). */
  const DATA2 = [2, 1];
  const ANSWERS2 = [0, 1].map(c => WEIGHTS[0][c] * DATA2[0] + WEIGHTS[1][c] * DATA2[1]);   // 3, 4
  const MW = 44, MH = 36;
  const matG = (x, y, title, sub, rows) => {
    const g = svgEl('g');
    txt(g, x + MW, y - 26, title, 'lbl-strong');
    txt(g, x + MW, y - 12, sub, 'lbl-faint');
    const cellsOut = rows.map((row, r) => row.map((v, c) => {
      const rect = svgEl('rect', { x: x + c * MW, y: y + r * MH, width: MW, height: MH, class: 'tile-bg' });
      const t = svgEl('text', { x: x + c * MW + MW / 2, y: y + r * MH + MH / 2 + 7, class: 'tile-letter' });
      t.style.fontSize = '18px';
      t.textContent = v === null ? '' : String(v);
      g.append(rect, t);
      return { rect, t };
    }));
    svg.appendChild(g);
    return { g, cells: cellsOut };
  };
  const dataM = matG(56, 196, 'DATA MATRIX', 'ONE ROW PER INPUT', [DATA, DATA2]);
  const ansM = matG(560, 196, 'ANSWER MATRIX', 'ONE ROW PER INPUT', [ANSWERS, [null, null]]);
  const wLbl = txt(svg, 440, BY - 8, 'WEIGHT MATRIX, PARKED', 'lbl-faint');
  dataM.cells[0].forEach(c => { c.rect.style.opacity = '.45'; c.t.style.opacity = '.45'; });
  dataM.cells[1].forEach(c => { c.rect.style.stroke = 'var(--blue)'; c.rect.style.strokeWidth = '2'; });
  await fadeIn([dataM.g, ansM.g, wLbl], 320);

  guide.say(`Here is how it multiplies two whole matrices. The data is a matrix too, with one
    input on each row. Row 1 (3 and 7) already went through and gave 21 and 17. Now send
    row 2.`);
  stage.focus([dataM.g, ansM.g], { ring: false });

  await guide.button('Send row 2: 2 and 1 ▸');
  stage.clearFocus();
  await sys.pulse(DATA2);
  ANSWERS2.forEach((v, c) => { ansM.cells[1][c].t.textContent = String(v); });
  dataM.cells[1].forEach(c => { c.rect.style.stroke = ''; c.rect.style.strokeWidth = ''; });
  if (!flow.instant) SFX.success();

  guide.say(`Left: 0×2 + 3×1 = <b>3</b>. Right: 1×2 + 2×1 = <b>4</b>. Each row of data in gives
    one row of answers out, and the rows stack into the answer matrix. That is a whole matrix
    multiply: the data matrix times the weight matrix.`);
  stage.focus(ansM.g, { label: 'the answer matrix', at: 'top' });
  await guide.next();
  stage.clearFocus();

  /* ============ IN THE LAB — reuse in practice: tiles and batches (§6d rule 8) ========
     A big matrix cut into tiles, two tiles copied into an SM's shared memory, the tiled
     loop, and a batch. Sizes from NVIDIA's Hopper article; sources in lab.js. */
  stage.clearFocus();
  const smPanel = slideInPanel(svg, labSM(), { lab: true });
  await smPanel.show();
  // Course restructure (2026-10-25): "from step 1's lab", not a card number
  guide.lab(`Here is one SM of NVIDIA's H100 again (from step 1's lab), with everything in it
    named. Each of its four groups has 32 lanes, one Tensor Core, a scheduler and a register
    file.`, { intro: true });
  await guide.next();

  /* Course restructure (2026-10-25): lanes against Tensor Cores, in FLOPS (step 2's lab).
     NVIDIA H100 SXM datasheet: FP32 67 TFLOPS; FP16/BF16 Tensor Core 989 TFLOPS dense. */
  smPanel.focus('rates');
  guide.lab(`The lanes and the Tensor Cores are separate parts. The whole H100's lanes do about
    67 teraflops with 32-bit numbers, and its Tensor Cores about 990 with
    16-bit numbers. Headline AI figures come from the Tensor Cores.`);
  await guide.next();

  const lab = slideInPanel(svg, labTiling(), { lab: true });
  lab.focus('matrix');
  await smPanel.swapTo(lab);

  guide.lab(`One layer of a real AI model is far bigger than a Tensor Core: here, 1,024 by 1,024
    weights, and the data to multiply them by. So the GPU cuts both matrices into
    <b>tiles</b>, square blocks 128 numbers on a side.`);
  await guide.next();

  lab.focus(['matrix', 'smem']);
  // Course restructure (2026-10-25): shared memory is part of ring 2 on step 3's map
  guide.lab(`It copies one data tile and one weight tile into the shared memory (part of ring 2)
    of one SM. The two tiles take 64 KB, which fits in the 228 KB an SM can set aside.`);
  await guide.next();

  lab.focus(['smem', 'work', 'reuse']);
  // Course restructure (2026-10-25): HBM is ring 4
  guide.lab(`That SM's Tensor Cores multiply the two tiles. Every number copied in is used 128
    times before the next tiles replace it, so the HBM (ring 4) is read 128 times less often.`);
  await guide.next();

  /* Act 4 restructure (2026-10-25): three chips, each drawn by what fills it */
  const chips = slideInPanel(svg, labChips(), { lab: true });
  chips.focus(['cpu', 'gpu']);
  await lab.swapTo(chips);
  guide.lab(`Here are three kinds of chip, each drawn by what fills it. A CPU has a few big
    cores, each with its own control unit. A GPU has thousands of lanes and hundreds of
    Tensor Cores, grouped into SMs.`);
  await guide.next();

  chips.focus('tpu');
  guide.lab(`Google's first <b>TPU</b> (tensor processing unit, 2015) is mostly one systolic
    array: 256 by 256, which is 65,536 MAC units, beside the memory that feeds it. Its
    control takes about 2% of the chip.`);
  await guide.next();

  // Course restructure (2026-10-25): ASIC, named on the TPU it describes
  guide.lab(`A chip built for one kind of job, like this TPU, is called an <b>ASIC</b>
    (application-specific integrated circuit). Custom AI chips such as Amazon's Trainium are of
    this kind.`);
  await guide.next();
  await chips.hide();
}
