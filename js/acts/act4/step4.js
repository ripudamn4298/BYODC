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
  guide.title('STEP 4 / 6 · NANOVOLT GRAPHICS', 'Move the data, <em>not the weights</em>');
  guide.cards();

  const stage = newStage('16', 'Weights parked in four engines while data moves through them');
  const { svg } = stage;

  // everything inside the border lives in one group, so it can shrink as one thing
  const world = svgEl('g');
  svg.appendChild(world);

  /* ============ CARD 1 — the preface, on the machine from the last step ============ */

  const sys = makeSystolic(world, { x: AX, y: AY, rows: 2, cols: 2, cell: CELL });
  world.style.opacity = '0';
  await fadeIn([world], 340);

  guide.say(`Four copies of the multiply engine you built. Each one takes two numbers.
    In AI one of those two barely changes, so this step stops fetching it.`);
  stage.focus(sys.el, { label: 'four multiply engines', at: 'right' });
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

  guide.say(`The <b>weight</b> is the number the network learned. It stays the same for
    millions of cycles. The <b>data</b> is what keeps changing.`);
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

  guide.say(`So park each weight in a register beside its own engine, and load it once.
    Drag each number onto the box that is waiting for it.`);
  stage.focus([...sys.cells.map(c => c.wreg), ...ghosts, ...tiles.map(t => t.g)],
    { label: 'one register per engine', at: 'top', ring: false });

  const parkAll = () => {
    sys.cells.forEach(c => sys.setWeight(c.r, c.c, WEIGHTS[c.r][c.c]));
    ghosts.forEach(g => { g.style.display = 'none'; });
    tiles.forEach(t => { t.g.style.display = 'none'; });
  };

  await flow.ask(async replay => {
    if (replay !== undefined){ parkAll(); return replay; }

    const cancelHint = flow.hintAfter(15000,
      `Every empty register shows the number it wants. Drag the tile with that number onto it.`);
    let done = 0;

    const park = (cell, tile) => {
      sys.setWeight(cell.r, cell.c, tile.v);
      ghosts[sys.cells.indexOf(cell)].style.display = 'none';
      tile.g.style.display = 'none';
      SFX.dope();
      done++;
    };
    const homeFor = tile => sys.cells.find(c => c.weight == null && WEIGHTS[c.r][c.c] === tile.v);

    tiles.forEach(tile => {
      let drag = null;
      tile.g.addEventListener('pointerdown', e => {
        if (tile.g.style.display === 'none') return;
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
          guide.note(`That register is waiting for a different number. Each empty box shows
            the one it wants.`);
          return;
        }
        park(cell, tile);
      });
      tile.g.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        const cell = homeFor(tile);
        if (cell) park(cell, tile);
      });
    });

    await waitFor(() => done === 4, { hold: 260 });
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

  guide.say(`Now only the data moves. Send 3 and 7 down the columns and watch each engine
    multiply by the weight parked in it.`);
  stage.focus(feed, { label: 'data comes in here', at: 'top' });

  await guide.button('Send 3 and 7 down the columns ▸');
  stage.clearFocus();
  await sys.pulse(DATA);
  await fadeIn([stayNote], 240);

  /* ============ CARD 5 — the two answers ========================================== */

  const resultNodes = [...world.querySelectorAll('.sys-result, .sys-result-t')];
  guide.say(`Left column: 0×3 + 3×7 = <b>21</b>. Right column: 1×3 + 2×7 = <b>17</b>.
    You just did a matrix multiply.`);
  stage.focus(resultNodes, { label: 'the two answers', at: 'bottom' });
  await guide.next('Draw a line around the array ▸');

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

  guide.say(`Two numbers in, two out, and four multiplies done inside. The mux design
    would have re-fetched every weight, every cycle.`);
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

  guide.say(`At 128 by 128: 16,384 multiplies per cycle, for 256 numbers in and out.
    Multiplies grow with the <b>area</b> of the square. Border crossings grow only with
    its <b>edge</b>.`);
  stage.focus([world, scale], { label: '2 × 2 against 128 × 128', at: 'top', ring: false });
  await guide.next();

  /* ============ CARD 8 — the name ================================================= */

  stage.clearFocus();
  await fadeOut([scale], 280);
  await Anim.tween(560, p => world.setAttribute('transform', worldXf(1 - p)));
  world.setAttribute('transform', '');

  guide.aha(`The data moves through it in beats, so its inventors named it after the
    heartbeat: a <b>systolic array</b>.`,
    `This is the machine that runs the matrix math inside every Tensor Core and every TPU.`);
  stage.focus(world, { label: 'systolic array', at: 'right', ring: false });
  await guide.next();
}
