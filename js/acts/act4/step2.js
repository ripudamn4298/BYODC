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
import { makeSeg, makeChip, slideInPanel } from '../../engine/components.js';
import { labMatmul } from './lab.js';
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
  guide.title('STEP 2 / 6', 'How do the lanes in a GPU <em>perform multiplication?</em>');
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
  guide.say(`Before we build a multiplier, look at how multiplication itself works. We will
    do <b>7 × 7</b>. You already know it is 49, so you can check the machine at every
    stage.`);
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
    : `Not that one. The four cases are 1 × 1 = 1, 1 × 0 = 0, 0 × 1 = 0, 0 × 0 = 0. The
       output is 1 only when both inputs are 1, which is the <b>AND</b> gate.`);
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
  guide.say(`Each row is a <b>partial product</b> (the top number times one bit of the
    bottom number). Each row sits one place further left than the row above, because the bit
    that made it is worth twice as much.`);
  stage.focus(ppRows, { label: 'partial products', at: 'right' });
  await guide.next();

  /* ============ the pile: sort every 1 into its place-value column ================= */

  /* REVIEW_NOTES N-081: the rows stay, and the dot board sits right under them, one dot
     column under each place-value column of 1s (row cells for weight 2^e are centred at
     x = 414 − 40e, so the board uses the same 40 pitch and x = 174). The 1s drop down,
     one column at a time, so the learner sees which 1s became which dots. */
  stage.clearFocus();

  // 7 columns (weights 1 to 64) so carries have room: 49 reaches the 16s, 64 the 64s.
  const board = makeDotColumns(svg, { x: 174, y: 400, heights: [0, 0, 0, 0, 0, 0, 0], pitch: 40 });
  const pileValue = () => board.cols.reduce((s, c) => s + board.heightOf(c.i) * (2 ** c.i), 0);
  board.el.style.opacity = '0';
  await fadeIn([board.el], 300);

  /* ---- CARD 6 · the 1s become dots, and the board is read, on one card ----
     Course restructure (2026-10-25): the old cards 6a ("drawn as dots") and 6 ("each column
     of 1s is now the column of dots") are merged into this one. The card goes up first and
     the dot-board animation plays under it; the focus lands once the dots have settled. */
  guide.say(`Next, the same 1s are drawn as dots, each in its place-value column. A column
    three dots tall means three 1s to add in that place.`);

  // every 1 in the rows, by place value e: row k's cell i has weight 2^(k + 2 − i)
  const onesAt = e => {
    const out = [];
    for (let k = 0; k < 3; k++) for (let i = 0; i < 3; i++){
      if (k + 2 - i === e) out.push({ x: 414 - 40 * e, y: ppTop + k * ppPitch + size / 2 });
    }
    return out;
  };
  for (let e = 0; e <= 4; e++){
    const ones = onesAt(e);
    const col = board.cols[e];
    const frame = svgEl('rect', { x: col.cx - 17, y: Math.min(...ones.map(o => o.y)) - 19, width: 34,
      height: 400 + 14 - (Math.min(...ones.map(o => o.y)) - 19), rx: 6,
      fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.2, 'stroke-dasharray': '4 3' });
    svg.appendChild(frame);
    const moving = ones.map(o => {
      board.drop(e);
      const d = col.dots[col.dots.length - 1];
      const to = { x: +d.getAttribute('cx'), y: +d.getAttribute('cy') };
      d.setAttribute('cx', o.x); d.setAttribute('cy', o.y);
      return { d, from: o, to };
    });
    await Anim.tween(520, q => moving.forEach(m => {
      m.d.setAttribute('cx', (m.from.x + (m.to.x - m.from.x) * q).toFixed(1));
      m.d.setAttribute('cy', (m.from.y + (m.to.y - m.from.y) * q).toFixed(1));
    }));
    if (!flow.instant){ SFX.blip(); await sleep(140); }
    frame.remove();
  }
  const chipPile = makeChip(controls, `PILE VALUE: <b>${pileValue()}</b>`, 'warm');

  stage.focus([...ppRows, board.el], { label: 'one column per place value', at: 'right', ring: false });
  await guide.next();
  ppRows.forEach(g => { g.style.transition = 'opacity .4s'; g.style.opacity = '.35'; });

  /* ---- CARD 7 · the checkpoint: the pile counts back to 49 ---- */
  guide.aha(`Count it: one 1 in the 1s, two in the 2s, three in the 4s, two in the 8s, one
    in the 16s. That is 1 + 4 + 12 + 16 + 16 = <b>49</b>.`,
    `That is the same 7 × 7 you started with. The pile holds the whole multiply, and all that is left is adding it up.`);
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
    It lands on the same board, in the same place-value columns.`);
  stage.focus(board.cols.slice(0, 4).map(c => c.colG), { label: 'the accumulator lands here' });

  await guide.button('Drop the 15 into the pile ▸');

  for (const c of [0, 1, 2, 3]){
    board.drop(c);
    chipPile.set(`PILE VALUE: <b>${pileValue()}</b>`);
    if (!flow.instant){ SFX.click(); await sleep(150); }
  }

  /* ---- CARD 11 · the pile reads 64 ---- */
  guide.say(`The pile now reads <b>64</b>, which is 49 + 15. That is one whole
    multiply-accumulate (a multiply, then an add onto the running total), waiting to be
    added up.`);
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
    const cancelHint = flow.hintAfter(15000, `Tap any column with three dots or more. Three dots become two, and one carries into the column on the left.`);
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
  await fadeOut([accRow.el, andGrid, ...ppRows], 240);

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
  guide.say(`No column holds more than two now, so the pile is just two rows. Adding two
    rows is the job of the <b>ripple adder</b> from Act 2, so hand the pile to it.`);
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

  /* ---- CARD 16b · name the whole machine, now that it is finished ----
     REVIEW_NOTES N-082: the three parts, drawn small, side by side in one outline, so the
     name lands on a picture of what it is made of: 7 and 7 into the AND grid, its 1s into
     the pile (where the accumulator's 15 joins them), the pile into the ripple adder, 64 out. */
  stage.clearFocus();
  const ticks = [...svg.querySelectorAll('text')].filter(t => t.textContent === '✓');
  await fadeOut([...numbers, ...ticks, board.el, boxG], 280);
  const mac = svgEl('g');
  const arrowR = (x1, y, x2) => `<line x1="${x1}" y1="${y}" x2="${x2 - 6}" y2="${y}" stroke="var(--ink)" stroke-width="1.6"/>
    <path d="M${x2 - 8} ${y - 5} L${x2} ${y} L${x2 - 8} ${y + 5}" fill="none" stroke="var(--ink)" stroke-width="1.6"/>`;
  const part = (cx, name, line1, line2) => `<text x="${cx}" y="286" class="lbl" style="fill:var(--ink)">${name}</text>
    <text x="${cx}" y="301" class="lbl-faint" font-size="8">${line1}</text>
    ${line2 ? `<text x="${cx}" y="313" class="lbl-faint" font-size="8">${line2}</text>` : ''}`;
  let grid = '';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++){
    grid += `<rect x="${137 + c * 28}" y="${180 + r * 28}" width="22" height="22" rx="3" class="bit-cell"/>
      <text x="${148 + c * 28}" y="${195 + r * 28}" class="lbl-faint">&amp;</text>`;
  }
  let pile = '';
  [1, 2, 3, 2, 1].forEach((h, i) => {
    const x = 396 - i * 18;
    for (let k = 0; k < h; k++) pile += `<circle cx="${x}" cy="${250 - k * 13}" r="4.5" class="dotbit"/>`;
    pile += `<line x1="${x - 6}" y1="257" x2="${x + 6}" y2="257" class="dotcol-base"/>`;
  });
  const parts = [
    `<text x="78" y="200" class="lbl-strong">7</text><text x="78" y="230" class="lbl-strong">7</text>${arrowR(90, 222, 132)}`,
    `${grid}${part(178, 'AND GRID', 'MULTIPLIES EVERY', 'PAIR OF BITS')}`,
    `${arrowR(232, 222, 318)}`,
    `${pile}${part(360, 'THE PILE', 'THE 1s, SORTED', 'BY PLACE VALUE')}
     <text x="360" y="352" class="lbl-faint" font-size="8">ACCUMULATOR: 15</text>
     <line x1="360" y1="340" x2="360" y2="322" stroke="var(--ink)" stroke-width="1.4"/>
     <path d="M355 327 L360 320 L365 327" fill="none" stroke="var(--ink)" stroke-width="1.4"/>`,
    `${arrowR(404, 222, 474)}`,
    `<rect x="480" y="196" width="112" height="52" rx="5" class="sys-cell-bg"/>
     <line x1="494" y1="222" x2="578" y2="222" class="wire"/>
     ${part(536, 'RIPPLE ADDER', 'ADDS THE LAST', 'TWO ROWS')}`,
    `${arrowR(592, 222, 640)}<text x="666" y="227" class="lbl-strong">64</text>`,
  ];
  mac.innerHTML = `<rect x="108" y="146" width="512" height="218" rx="10" fill="none" stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="6 4"/>
    <text x="364" y="136" class="lbl" style="fill:var(--ink)">ONE MAC UNIT (MULTIPLY-ACCUMULATE UNIT)</text>`;
  svg.appendChild(mac);
  const partGs = parts.map(html => { const g = svgEl('g'); g.innerHTML = html; g.style.opacity = '0'; mac.appendChild(g); return g; });
  mac.style.opacity = '0';
  await fadeIn([mac], 260);
  for (const g of partGs){ await fadeIn([g], 220); }

  guide.say(`The AND grid, the pile and the ripple adder together are one
    <b>multiply-accumulate unit</b>, called a <b>MAC unit</b> for short. It does the multiply
    and the add that every lane needs.`);
  stage.focus(mac, { ring: false });
  await guide.next();

  /* ---- CARD 16c · REVIEW_NOTES N-084: the MAC unit goes into every lane ----
     The sixteen lanes from step 1 come back, each showing its adder (+). One by one the +
     is swapped for MAC, so the learner sees where the MAC unit is used from here on. */
  stage.clearFocus();
  await fadeOut([mac], 260);
  const lanesG = svgEl('g');
  const LG = { x: 232, y: 106, cell: 58, gap: 8 };
  const laneCells = [];
  for (let i = 0; i < 16; i++){
    const x = LG.x + (i % 4) * (LG.cell + LG.gap), y = LG.y + Math.floor(i / 4) * (LG.cell + LG.gap);
    const g = svgEl('g');
    g.innerHTML = `<rect x="${x}" y="${y}" width="${LG.cell}" height="${LG.cell}" rx="4" class="lane"/>
      <text class="ln-add" x="${x + LG.cell / 2}" y="${y + LG.cell / 2 + 8}" style="font-family:var(--font-display);font-size:24px;text-anchor:middle;fill:var(--ink-soft)">+</text>
      <g class="ln-mac" opacity="0"><rect x="${x + 9}" y="${y + 17}" width="${LG.cell - 18}" height="24" rx="4" fill="var(--ink)"/>
      <text x="${x + LG.cell / 2}" y="${y + 33}" class="lbl" font-size="9" style="fill:var(--paper-high);letter-spacing:.08em">MAC</text></g>`;
    lanesG.appendChild(g);
    laneCells.push(g);
  }
  const lanesCap = svgEl('text', { x: LG.x + 2 * LG.cell + 1.5 * LG.gap, y: LG.y - 18, class: 'lbl-faint' });
  lanesCap.textContent = 'YOUR SIXTEEN LANES FROM STEP 1';
  lanesG.appendChild(lanesCap);
  svg.appendChild(lanesG);
  lanesG.style.opacity = '0';
  await fadeIn([lanesG], 300);
  await Anim.tween(1600, q => laneCells.forEach((g, i) => {
    const k = Math.min(1, Math.max(0, (q * 1600 - i * 70) / 300));
    g.querySelector('.ln-add').style.opacity = (1 - k).toFixed(2);
    g.querySelector('.ln-mac').setAttribute('opacity', k.toFixed(2));
  }), q => q);

  /* REVIEW_NOTES N-085 and the Act 4 restructure (2026-10-24): this square IS what "lane"
     means from here on; the same picture (js/art/icons.js laneIcon) comes back wherever
     lanes do.
     Course restructure (2026-10-25): the "each lane now holds a MAC unit" card and the lane
     definition card are merged into this one, and the definition now counts what a lane
     holds: two numbers to multiply and its running total. */
  guide.say(`Each of your sixteen lanes from step 1 now holds a MAC unit. From now on, a
    <b>lane</b> means one MAC unit with two numbers to multiply and its running total, doing
    one multiply-add every beat.`);
  stage.focus(laneCells[0], { label: 'one lane', at: 'left', ring: false });
  await guide.next();

  /* REVIEW_NOTES N-087: zoom from one lane into its MAC unit, and land on the AND grid, so
     the next scene (the grid at 16 bits) continues from what is on screen */
  stage.clearFocus();
  const z = laneCells[0];
  const zc = { x: LG.x + LG.cell / 2, y: LG.y + LG.cell / 2 };
  await Anim.tween(700, q => {
    laneCells.forEach((g, i) => { if (i) g.style.opacity = (1 - q).toFixed(2); });
    lanesCap.style.opacity = (1 - q).toFixed(2);
    const sc = 1 + 5 * q, tx = (360 - zc.x) * q, ty = (240 - zc.y) * q;
    z.setAttribute('transform', `translate(${(zc.x + tx).toFixed(1)} ${(zc.y + ty).toFixed(1)}) scale(${sc.toFixed(3)}) translate(${-zc.x} ${-zc.y})`);
  });
  const inside = svgEl('g');
  let g3 = '';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++){
    g3 += `<rect x="${212 + c * 28}" y="${190 + r * 28}" width="22" height="22" rx="3" class="bit-cell"/>
      <text x="${223 + c * 28}" y="${205 + r * 28}" class="lbl-faint">&amp;</text>`;
  }
  let pileDots = '';
  [1, 2, 3, 2, 1].forEach((h, i) => { for (let k = 0; k < h; k++) pileDots += `<circle cx="${404 - i * 14}" cy="${252 - k * 12}" r="3.8" class="dotbit"/>`; });
  inside.innerHTML = `<rect x="186" y="96" width="348" height="300" rx="12" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.4"/>
    <text x="360" y="126" class="lbl" style="fill:var(--ink)">ONE LANE, ZOOMED IN: ITS MAC UNIT</text>
    <g class="zm-and">${g3}<text x="254" y="300" class="lbl" style="fill:var(--ink)">AND GRID</text>
      <text x="254" y="315" class="lbl-faint" font-size="8">3 × 3, FOR 3-BIT NUMBERS</text></g>
    <g class="zm-rest" style="opacity:.3">
      <line x1="300" y1="232" x2="336" y2="232" stroke="var(--ink)" stroke-width="1.4"/>
      ${pileDots}<text x="376" y="300" class="lbl" style="fill:var(--ink)">PILE</text>
      <line x1="414" y1="232" x2="440" y2="232" stroke="var(--ink)" stroke-width="1.4"/>
      <rect x="444" y="208" width="76" height="48" rx="5" class="sys-cell-bg"/>
      <text x="482" y="300" class="lbl" style="fill:var(--ink)">ADDER</text></g>`;
  svg.appendChild(inside);
  inside.style.opacity = '0';
  await Anim.tween(380, q => { inside.style.opacity = q.toFixed(2); z.style.opacity = (1 - q).toFixed(2); });
  guide.say(`Zoom into one lane. Inside is its MAC unit, and the first part of that is the AND
    grid you built: 3 by 3, because 7 is a 3-bit number.`);
  stage.focus(inside.querySelector('.zm-and'), { label: 'the AND grid', at: 'left', ring: false });
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
  footLbl.textContent = 'ONE PATCH OF SILICON';   // Course restructure (2026-10-25): was ONE TILE OF SILICON
  svg2.appendChild(footLbl);

  // Course restructure (2026-10-25): the chip says "patch" too, to match the label above
  const perTile = makeChip(controls2, `multipliers per patch: <b>1×</b>`);

  // The grid is drawn at its true size: a p-bit multiplier is p AND gates across and p
  // down, so its side is proportional to p and a 16-bit grid fills the patch exactly.
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
  function setPrecision(p){ perTile.set(`multipliers per patch: <b>${perMap[p]}</b>`); seg.set(p); return drawSquare(p); }

  const seg = makeSeg(controls2, [
    { id: 'p16', label: '16-bit', value: 16 },
    { id: 'p8', label: '8-bit', value: 8 },
    { id: 'p4', label: '4-bit', value: 4 },
  ], p => { SFX.click(); setPrecision(p); });

  // N-087: start from the 3 by 3 grid the learner just zoomed into, then grow it to 16 bits
  await drawSquare(3);
  if (!flow.instant) await sleep(500);
  await setPrecision(16);

  /* ---- CARD 17 · read the square ----
     Course restructure (2026-10-25): "the tile (one fixed patch of silicon)" became "the
     patch of silicon", as step 1 says it, so it does not clash with step 4's matrix tiles. */
  guide.say(`Real chips multiply wider numbers. Two 16-bit numbers need 16 AND gates across
    and 16 down. That is 256 gates, and it fills the patch of silicon.`);
  stage2.focus([footFrame, gridG], { label: '16 × 16 and gates', at: 'right' });
  await guide.next();

  /* ---- CARD 18 · the payoff, watched (Act 4 restructure, 2026-10-25: the old predict-and-
     try quiz became this one watch card). The square halves to 8 bits, then to 4, on its own,
     and the step ends on the 4-bit square live and on replay; the segmented control stays
     for free exploration and records nothing. */
  stage2.clearFocus();
  await setPrecision(8);
  if (!flow.instant) await sleep(700);
  await setPrecision(4);

  guide.aha(`Halve the width (the number of bits in each number) and both sides of the grid
    halve, so the multiplier gets four times smaller. That is why AI chips moved to 8-bit
    and then 4-bit maths.`,
    `Real chips also carry a floating-point exponent (a scale factor stored beside each number), which blunts this rule a little. Area still grows close to the square of the width, and that is still the deciding factor.`);
  stage2.focus(gridG, { label: '4 × 4 and gates', at: 'right' });
  await guide.next();

  /* Course restructure (2026-10-25): a light-bulb card with the spec-sheet names for the
     three widths, so "50 petaflops of FP4" in the news reads as this square */
  guide.say(`Spec sheets write 16-bit, 8-bit and 4-bit numbers as <b>FP16</b>, <b>FP8</b> and
    <b>FP4</b>. FP stands for floating point, the format that keeps that scale factor beside
    each number.`);
  stage2.focus(gridG, { label: 'fp4: 4-bit numbers', at: 'right' });
  await guide.next();

  /* ============ IN THE LAB — the multiply-accumulate in real code and hardware ========
     A matrix multiply in PyTorch, what one number of its answer means, and one V100
     Tensor Core step (4 × 4 grids, 64 multiply-accumulates a clock). Sources in lab.js. */
  stage2.clearFocus();
  const lab = slideInPanel(svg2, labMatmul(), { lab: true });
  lab.focus('code');
  await lab.show();

  guide.lab(`The multiply-accumulate you built is the operation AI code runs most. In PyTorch,
    the line <b>c = a @ b</b> multiplies two <b>matrices</b> (grids of numbers), here each
    4,096 numbers on a side.`, { intro: true });
  await guide.next();

  lab.focus('loop');
  guide.lab(`Each number in c is a running total of 4,096 multiplies, each added onto the
    total, which is your accumulator. c holds about 16.8 million numbers, so that one line
    asks for about 69 billion multiply-accumulates.`);
  await guide.next();

  /* Course restructure (2026-10-25): the rate unit the news uses, on the same panel focus */
  guide.lab(`Spec sheets count one multiply-accumulate as two operations, and give the rate in
    <b>FLOPS</b> (floating-point operations a second). A teraflop is a trillion a second, and
    a petaflop is a thousand trillion.`);
  await guide.next();

  lab.focus('tc');
  guide.lab(`A <b>Tensor Core</b> is a block of MAC units that multiplies two small matrices
    in one go: in NVIDIA's V100 (2017), two 4 by 4 matrices, 64 multiply-accumulates every
    clock beat. Remember the name, because in step 4 you build a block like this yourself.`);
  await guide.next();
  await lab.hide();
}
