// ACT 4 · STEP 2 — "How a chip multiplies".
// Rebuilt to the micro-learning contract in DESIGN_MAKEOVER.md §2 / §5: one card at a
// time (guide.cards), one focus target per card, every new word labelled on the stage at
// the moment it is defined. The mechanics are the ones that tested well and are unchanged:
// the AND-gate quiz, tapping the partial products, the place-value pile, the 3-into-2
// crush game and the precision square.
// It follows DESIGN.md §6c: start from an answer the player already trusts (7 × 7 = 49),
// let them build it, show the pile counts back to 49, and only then add the accumulator.
// 7 is 111, so every bit in the grid is a real 1 and the pile honestly counts.
// Worked example throughout: 7 × 7 + 15 = 49 + 15 = 64 = 1000000.
import { svgEl, sleep } from '../../engine/util.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeSeg, makeChip } from '../../engine/components.js';
import { makeBitRow, makeDotColumns, makeFAToken } from '../../engine/mathengine.js';

async function fadeIn(nodes, dur = 300){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  list.forEach(n => { n.style.display = ''; n.style.opacity = '0'; });
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(p); }));
  list.forEach(n => { n.style.opacity = '1'; });
}
async function fadeOut(nodes, dur = 260){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(1 - p); }));
  list.forEach(n => { n.style.display = 'none'; });
}

export async function step2(){
  guide.title('STEP 2 / 6 · NANOVOLT GRAPHICS', 'How a chip <em>multiplies</em>');
  guide.cards();

  const stage = newStage('16', 'Multiplying 7 by 7 with AND gates and a pile of place-value columns');
  const { svg, controls } = stage;

  /* ============ the two numbers, in binary, on paper ============================== */

  const A = '111';                 // 7
  const Bbits = [1, 1, 1];         // B = 111, also 7
  const pitch = 40, size = 28;
  const ax = 320, ay = 56, by = ay + 44;

  const rowA = makeBitRow(svg, { x: ax, y: ay, bits: A, pitch, size });
  const rowB = makeBitRow(svg, { x: ax, y: by, bits: '111', pitch, size });
  const times = svgEl('text', { x: ax - 26, y: by + size / 2 + 6, class: 'lbl-strong' });
  times.textContent = '×';
  svg.appendChild(times);
  const decimal = (y, s) => {
    const t = svgEl('text', {
      x: ax + 2 * pitch + size + 14, y: y + size / 2 + 5,
      class: 'lbl-strong', 'text-anchor': 'start',
    });
    t.textContent = s;
    svg.appendChild(t);
    return t;
  };
  const eqA = decimal(ay, '= 7'), eqB = decimal(by, '= 7');
  const numbers = [rowA.el, rowB.el, times, eqA, eqB];

  /* ---- CARD 1 · the preface: a multiply whose answer the player already owns ---- */
  guide.say(`Step back. Before we build a multiplier, look at how multiplication itself
    works. We will do <b>7 × 7</b>. You already know it is 49, so you can check the machine
    at every stage.`);
  stage.focus(numbers, { label: '7 × 7, in binary', at: 'left' });
  await guide.next();

  /* ---- CARD 2 · one bit times one bit ---- */
  guide.say(`Start with one bit times one bit. <b>1 × 1 = 1</b>, and anything × 0 = 0.
    You built the gate that does exactly that in Act 2. Which one?`);
  stage.focus([rowA.cells[2].r, rowB.cells[2].r], { label: 'one bit × one bit', at: 'right' });

  const gate = await guide.choose([
    { label: 'AND', value: 'and', hint: 'output 1 only when BOTH inputs are 1' },
    { label: 'OR', value: 'or', hint: 'output 1 when EITHER input is 1' },
    { label: 'XOR', value: 'xor', hint: 'output 1 when the inputs DIFFER' },
  ]);

  /* ---- CARD 3 · the answer ---- */
  guide.note(gate === 'and'
    ? `Right. A one-bit multiplier is an <b>AND</b> gate, which you have had since Act 2.`
    : `Not that one. The four cases are 1 × 1 = 1, 1 × 0 = 0, 0 × 1 = 0, 0 × 0 = 0. Output 1
       only when both inputs are 1, which is the <b>AND</b> gate.`);
  stage.focus([rowA.cells[2].r, rowB.cells[2].r], { label: 'and gate', at: 'right' });
  await guide.next();

  /* ============ the partial products ============================================== */

  const ppTop = ay + 118, ppPitch = 42;
  const ppRows = [];
  const chipAnd = makeChip(controls, `AND operations: <b>0</b>`);
  let andCount = 0;

  // draw the partial-product row for B's displayed cell j (0 = leftmost / most significant
  // of the three bits). Its bit-weight is 2^(2−j), so the row shifts (2−j) cells LEFT and
  // prints (2−j) rows further down: the stack reads like paper long multiplication.
  function lightRow(j){
    const g = svgEl('g', { class: 'pp-row' });
    const k = 2 - j;
    const rowY = ppTop + k * ppPitch;
    const shiftX = ax - k * pitch;
    const bits = Bbits[j] ? A : '000';
    for (let i = 0; i < 3; i++){
      const cx = shiftX + i * pitch;
      const on = bits[i] === '1';
      const r = svgEl('rect', { x: cx, y: rowY, width: size, height: size, rx: 3, class: 'bit-cell' + (on ? ' hi' : '') });
      const t = svgEl('text', { x: cx + size / 2, y: rowY + size / 2 + 4.5, class: 'bit-t' + (on ? ' hi' : '') });
      t.textContent = bits[i];
      const badge = svgEl('text', { x: cx + size / 2, y: rowY - 5, class: 'lbl-faint' });
      badge.textContent = '&';
      g.append(r, t, badge);
    }
    svg.appendChild(g);
    ppRows.push(g);
    andCount += 3;
    chipAnd.set(`AND operations: <b>${andCount}</b>`);
    if (flow.instant){ g.style.opacity = '1'; return; }
    g.style.opacity = '0';
    Anim.tween(320, p => { g.style.opacity = String(p); });
  }

  /* ---- CARD 4 · tap the three bits ---- */
  guide.say(`Tap each bit of the bottom number. Each tap ANDs that bit against all three
    bits on top and prints a row.`);
  stage.focus(rowB.el, { label: 'tap all three', at: 'right' });

  await flow.ask(async replay => {
    const tick = j => {
      const cell = rowB.cells[j];
      const t = svgEl('text', {
        x: ax + j * pitch + size / 2, y: by + size + 15, class: 'lbl-strong',
      });
      t.textContent = '✓';
      svg.appendChild(t);
      cell.r.style.cursor = 'default';
    };
    if (replay !== undefined){
      for (let j = 0; j < 3; j++){ lightRow(j); tick(j); }   // same end state for any tap order
      return replay;
    }
    const lit = [false, false, false];
    const cancelHint = flow.hintAfter(15000, `Tap each of the three bottom cells. Each one prints a full row of ANDs.`);
    await new Promise(resolve => {
      for (let j = 0; j < 3; j++){
        const cell = rowB.cells[j];
        cell.r.style.cursor = 'pointer';
        cell.r.setAttribute('tabindex', '0');
        cell.r.setAttribute('role', 'button');
        const fire = () => {
          if (lit[j]) return;
          lit[j] = true; SFX.click(); lightRow(j); tick(j);
          if (lit.every(Boolean)){ cancelHint(); resolve(); }
        };
        cell.r.addEventListener('click', fire);
        cell.r.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fire(); } });
      }
    });
    return true;
  });

  /* ---- CARD 5 · why each row is shifted ---- */
  guide.say(`Each row is a <b>partial product</b>. Each one sits a place further left than
    the row above, because that bit is worth twice as much.`);
  stage.focus(ppRows, { label: 'partial products', at: 'right' });
  await guide.next();

  /* ============ the pile: sort every 1 into its place-value column ================= */

  stage.clearFocus();
  await fadeOut(ppRows, 260);
  ppRows.forEach(g => g.remove());

  // 7 columns (weights 1 to 64) so carries have room: 49 reaches the 16s, 64 the 64s.
  // multiply-only heights [1,2,3,2,1,0,0] → 1 + 4 + 12 + 16 + 16 = 49. Every dot is a real 1.
  const board = makeDotColumns(svg, { x: 210, y: 400, heights: [1, 2, 3, 2, 1, 0, 0], pitch: 46 });
  const pileValue = () => board.cols.reduce((s, c) => s + board.heightOf(c.i) * (2 ** c.i), 0);
  board.el.style.opacity = '0';
  await fadeIn([board.el], 300);
  const chipPile = makeChip(controls, `PILE VALUE: <b>${pileValue()}</b>`, 'warm');

  /* ---- CARD 6 · read the board before using it ---- */
  guide.say(`Every 1 drops into a column by its place value. A column three dots tall
    means three 1s to add in that place.`);
  stage.focus(board.el, { label: 'one column per place value' });
  await guide.next();

  /* ---- CARD 7 · the checkpoint: the pile counts back to 49 ---- */
  guide.aha(`Count it: one 1 in the 1s, two in the 2s, three in the 4s, two in the 8s, one
    in the 16s. That is 1 + 4 + 12 + 16 + 16 = <b>49</b>.`,
    `The same 7 × 7 you started with. The pile is the multiply. All that is left is adding it up.`);
  stage.focus(board.el, { label: 'pile value 49' });
  await guide.next();

  /* ---- CARD 8 · what the multiply cost, in gates (not "9 ANDs") ---- */
  const andGrid = svgEl('g');
  const gx = 68, gy = 186, gp = 30, gs = 22;
  for (let r = 0; r < 3; r++){
    for (let c = 0; c < 3; c++){
      andGrid.appendChild(svgEl('rect', {
        x: gx + c * gp, y: gy + r * gp, width: gs, height: gs, rx: 3, class: 'bit-cell',
      }));
      const t = svgEl('text', { x: gx + c * gp + gs / 2, y: gy + r * gp + gs / 2 + 4, class: 'lbl-faint' });
      t.textContent = '&';
      andGrid.appendChild(t);
    }
  }
  svg.appendChild(andGrid);
  await fadeIn([andGrid], 300);

  guide.say(`That took <b>9 AND operations</b>. The hardware is a 3 by 3 grid of AND gates,
    one gate for every pairing of bits.`);
  stage.focus(andGrid, { label: '3 × 3 and gates', at: 'top' });
  await guide.next();

  /* ============ the accumulator ==================================================== */

  const accRow = makeBitRow(svg, { x: 56, y: 348, bits: '1111', pitch: 30, size: 20, label: 'accumulator' });
  accRow.el.style.opacity = '0';
  await fadeIn([accRow.el], 300);

  /* ---- CARD 9 · define the accumulator ---- */
  guide.say(`A chip almost never multiplies just once. It keeps a running total called the
    <b>accumulator</b> and adds each product onto it. Ours holds 15.`);
  stage.focus(accRow.el, { label: '15 = 1111', at: 'top' });
  await guide.next();

  /* ---- CARD 10 · drop its bits into the same columns ---- */
  guide.say(`Fifteen is <b>1111</b>, so it puts one 1 into each of the first four columns.
    Same board, same place values.`);
  stage.focus(board.cols.slice(0, 4).map(c => c.colG), { label: 'the accumulator lands here' });

  await guide.button('Drop the 15 into the pile ▸');

  for (const c of [0, 1, 2, 3]){
    board.drop(c);
    chipPile.set(`PILE VALUE: <b>${pileValue()}</b>`);
    if (!flow.instant){ SFX.click(); await sleep(150); }
  }

  /* ---- CARD 11 · the pile reads 64 ---- */
  guide.say(`The pile now reads <b>64</b>, which is 49 + 15. That is one whole
    multiply-accumulate, waiting to be added up.`);
  stage.focus(board.el, { label: 'pile value 64' });
  await guide.next();

  /* ============ the crush: three 1s in a column become two ======================== */

  /* ---- CARD 12 · the crush rule, on its own card ---- */
  guide.say(`Three 1s in a column add up to binary <b>11</b>. One stays in the column, one
    carries into the column on its left.`);
  stage.focus(board.cols[1].colG, { label: 'three 1s = binary 11', at: 'left' });
  await guide.next();

  /* ---- CARD 13 · name the part that does it, before it shows up mid-animation ---- */
  const tok = makeFAToken(svg, { x: 92, y: 288 });
  // drop the token's own pop-in: its scale keyframe is still running when focus() measures
  // the bounding box, which would pin the ring to the shrunken position.
  tok.el.classList.remove('pop-in');
  tok.el.style.opacity = '0';
  await fadeIn([tok.el], 260);

  guide.say(`The part that does that is the <b>full adder</b> from Act 2. Three 1s go in
    and two come out, so chip designers call it a 3-into-2 compressor.`);
  stage.focus(tok.el, { label: '3 into 2', at: 'right' });
  await guide.next();

  /* ---- CARD 14 · the crush game ---- */
  stage.clearFocus();
  await fadeOut([tok.el], 220);
  tok.el.remove();

  guide.say(`Tap any column holding three or more dots, until no column holds three. The
    pile value stays at 64 the whole way through.`);
  stage.focus(board.el, { label: 'tap the tall columns' });

  const chipComp = makeChip(controls, `columns crushed: <b>0</b>`);

  function refreshHot(){
    board.cols.forEach(col => {
      const hot = board.heightOf(col.i) >= 3;
      col.colG.classList.toggle('hot', hot);
      col.hit.style.cursor = hot ? 'pointer' : 'default';
    });
  }
  const anyPlayable = () => board.cols.some(col => board.heightOf(col.i) >= 3);

  await flow.ask(async replay => {
    if (replay !== undefined){
      for (const c of replay){ await board.take3(c); }
      chipComp.set(`columns crushed: <b>${replay.length}</b>`);
      chipPile.set(`PILE VALUE: <b>${pileValue()}</b>`);
      board.cols.forEach(col => col.colG.classList.remove('hot'));
      return replay;
    }
    const taps = [];
    const cancelHint = flow.hintAfter(15000, `Any column with three dots or more. Tap it, and three become two with one carried left.`);
    let crushed = 0, busy = false;
    refreshHot();
    await new Promise(resolve => {
      board.cols.forEach(col => {
        col.hit.setAttribute('tabindex', '0');
        col.hit.setAttribute('role', 'button');
        const fire = async () => {
          if (busy || board.heightOf(col.i) < 3) return;
          busy = true;
          taps.push(col.i);
          await board.take3(col.i);
          crushed++; chipComp.set(`columns crushed: <b>${crushed}</b>`);
          chipPile.set(`PILE VALUE: <b>${pileValue()}</b>`);      // stays 64, which is the point
          refreshHot();
          busy = false;
          if (!anyPlayable()){ cancelHint(); board.cols.forEach(c => c.colG.classList.remove('hot')); resolve(); }
        };
        col.hit.addEventListener('click', fire);
        col.hit.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fire(); } });
      });
    });
    return taps;
  });

  /* ============ hand the last two rows to the Act 2 ripple adder ================== */

  stage.clearFocus();
  await fadeOut([accRow.el, andGrid], 240);

  const boxX = 200, boxY = 172, boxW = 300, boxH = 148;
  const boxG = svgEl('g');
  boxG.appendChild(svgEl('rect', { x: boxX, y: boxY, width: boxW, height: boxH, rx: 8, class: 'sys-cell-bg' }));
  const s = 8;
  boxG.appendChild(svgEl('path', {
    d: `M${boxX} ${boxY + s} V${boxY} H${boxX + s} M${boxX + boxW - s} ${boxY} H${boxX + boxW} V${boxY + s} `
      + `M${boxX + boxW} ${boxY + boxH - s} V${boxY + boxH} H${boxX + boxW - s} M${boxX + s} ${boxY + boxH} H${boxX} V${boxY + boxH - s}`,
    class: 'sys-tick',
  }));
  const lbl = svgEl('text', { x: boxX + boxW / 2, y: boxY + 20, class: 'lbl-faint' });
  lbl.textContent = 'RIPPLE ADDER';
  boxG.appendChild(lbl);
  const inLbl = svgEl('text', { x: boxX + boxW / 2, y: boxY + 54, class: 'lbl-faint' });
  inLbl.textContent = 'the last two rows feed in';
  inLbl.style.opacity = '0';
  boxG.appendChild(inLbl);
  boxG.appendChild(svgEl('line', { x1: boxX + 24, y1: boxY + 82, x2: boxX + boxW - 24, y2: boxY + 82, class: 'wire' }));
  const outRow = makeBitRow(svg, { x: boxX + 30, y: boxY + 100, bits: '1000000', pitch: 30, size: 20 });
  outRow.el.style.opacity = '0';
  svg.appendChild(boxG);
  boxG.appendChild(outRow.el);
  boxG.style.opacity = '0';
  await fadeIn([boxG], 300);

  /* ---- CARD 15 · the handoff ---- */
  guide.say(`No column holds more than two now, and adding two rows is the <b>ripple
    adder</b> you built in Act 2. Hand the pile to it.`);
  stage.focus(boxG, { label: 'from act 2', at: 'right' });

  await guide.button('Add the last two rows ▸');

  stage.clearFocus();
  await fadeIn([inLbl], 240);
  await sleep(flow.instant ? 0 : 160);
  await fadeIn([outRow.el], 300);
  if (!flow.instant) SFX.success();

  /* ---- CARD 16 · the answer, checked against the one they already knew ---- */
  guide.say(`The adder prints <b>1000000</b>, which is 64. And 7 × 7 + 15 = 64, the answer
    you could check from the start.`);
  stage.focus(outRow.el, { label: '1000000 = 64', at: 'bottom' });
  await guide.next();

  /* ============ the precision square ============================================== */

  stage.clearFocus();
  const stage2 = newStage('16', 'The AND grid shrinks on both sides as the bit width falls');
  const { svg: svg2, controls: controls2 } = stage2;

  const foot = { x: 250, y: 118, size: 224 };
  const footFrame = svgEl('rect', { x: foot.x, y: foot.y, width: foot.size, height: foot.size, rx: 8, class: 'slot' });
  const gridG = svgEl('g');
  svg2.append(footFrame, gridG);
  const footLbl = svgEl('text', { x: foot.x + foot.size / 2, y: foot.y - 12, class: 'lbl' });
  footLbl.textContent = 'ONE TILE OF SILICON';
  svg2.appendChild(footLbl);

  const perTile = makeChip(controls2, `multipliers per tile: <b>1×</b>`);

  // The grid is drawn at its true size: a p-bit multiplier is p AND gates across and p
  // down, so its side is proportional to p and a 16-bit grid fills the tile exactly.
  // Halving p therefore quarters the drawn area, which is the claim the card makes.
  // The dots walk to their new spots (DESIGN_MAKEOVER.md §2 rule 5) and Anim.tween
  // collapses to the end state on replay.
  let squareRun = 0;
  async function drawSquare(p){
    const inset = 12;
    const span = (foot.size - inset * 2) * (p / 16);
    const step = span / (p - 1 || 1);
    const r = Math.max(1.6, Math.min(6, (foot.size - inset * 2) / (16 * 2.4)));
    const target = [];
    for (let row = 0; row < p; row++)
      for (let col = 0; col < p; col++)
        target.push({ cx: foot.x + inset + col * step, cy: foot.y + inset + row * step });
    const cur = Array.from(gridG.querySelectorAll('circle'));
    while (cur.length > target.length) cur.pop().remove();
    while (cur.length < target.length){
      const d = svgEl('circle', { cx: foot.x + inset, cy: foot.y + inset, r, class: 'dotbit' });
      gridG.appendChild(d); cur.push(d);
    }
    const from = cur.map(d => ({ cx: +d.getAttribute('cx'), cy: +d.getAttribute('cy'), r: +d.getAttribute('r') }));
    const token = ++squareRun;
    await Anim.tween(280, t => {
      if (token !== squareRun) return;
      cur.forEach((d, k) => {
        d.setAttribute('cx', from[k].cx + (target[k].cx - from[k].cx) * t);
        d.setAttribute('cy', from[k].cy + (target[k].cy - from[k].cy) * t);
        d.setAttribute('r', from[k].r + (r - from[k].r) * t);
      });
    });
  }

  const perMap = { 16: '1×', 8: '4×', 4: '16×' };
  function setPrecision(p){ perTile.set(`multipliers per tile: <b>${perMap[p]}</b>`); seg.set(p); return drawSquare(p); }

  const seg = makeSeg(controls2, [
    { id: 'p16', label: '16-bit', value: 16 },
    { id: 'p8', label: '8-bit', value: 8 },
    { id: 'p4', label: '4-bit', value: 4 },
  ], p => { SFX.click(); setPrecision(p); });

  await setPrecision(16);

  /* ---- CARD 17 · read the square ---- */
  guide.say(`Same grid, wider numbers. Two 16-bit numbers need 16 AND gates across and 16
    down. That is 256 gates, and it fills the tile.`);
  stage2.focus([footFrame, gridG], { label: '16 × 16 and gates', at: 'right' });
  await guide.next();

  /* ---- CARD 18 · predict before you switch ---- */
  guide.say(`A chip has a fixed area to spend. Halve the width to 8 bits: how much smaller
    does one multiplier get?`);
  stage2.focus([footFrame, gridG], { label: 'one 16-bit multiplier', at: 'right' });

  const shrink = await guide.choose([
    { label: '2× smaller', value: '2x', hint: 'only one side shrank?' },
    { label: '4× smaller', value: '4x', hint: 'both sides of the grid halve' },
    { label: 'no smaller', value: 'none', hint: 'fewer bits means fewer ANDs' },
  ]);

  /* ---- CARD 19 · the answer, with the square to try ---- */
  guide.note(shrink === '4x'
    ? `Right. Both sides of the grid halve at once. Switch to 8-bit and then 4-bit and
       watch the square.`
    : `Halving the width halves <em>both</em> sides of the grid, and half times half is a
       quarter. Switch to 8-bit and watch the square.`);
  stage2.focus([footFrame, gridG], { label: 'try 8-bit and 4-bit', at: 'right' });
  await guide.next();

  /* ---- CARD 20 · the payoff, on the 4-bit square ----
     Settling on 4-bit here also pins the end state: whatever the player clicked on the
     segmented control (which is free exploration, not a recorded answer), the step
     finishes on the same square live and on replay. */
  stage2.clearFocus();
  await setPrecision(4);

  guide.aha(`Halve the bits and both sides of the grid halve, so the engine gets four times
    smaller. That is why AI chips moved to 8-bit and then 4-bit maths.`,
    `Real chips also carry a floating-point exponent, which blunts the law a little. It stays close to a square law, and it is still the deciding factor.`);
  stage2.focus(gridG, { label: '4 × 4 and gates', at: 'right' });
  await guide.next();
}
