// ACT 4 · STEP 2 — "The multiply engine" (the multiply-accumulate, built from gates you own).
// Structured on DESIGN.md §6c THE INTUITION FRAMEWORK: start from a multiply the learner
// already knows (7 × 7 = 49), let them build it, show the pile counts back to 49 (checkpoint
// AHA), THEN introduce the accumulator (+15 → 64), THEN the 3-into-2 compressor.
// Every partial-product bit of 7 × 7 is a 1 (7 = 111), so every dot is a real 1 — the pile's
// value is honestly "count the dots × place value", and columns genuinely stack ≥3 (the
// compressor really earns its place). Worked example: 7 × 7 + 15 = 49 + 15 = 64 = 1000000.
import { svgEl, el, sleep } from '../../engine/util.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeSeg, makeChip } from '../../engine/components.js';
import { makeBitRow, makeDotColumns } from '../../engine/mathengine.js';

export async function step2(){
  guide.title('STEP 2 / 5 · NANOVOLT GRAPHICS', 'The <em>multiply</em> engine');

  const { svg, controls } = newStage('14', 'The multiply-accumulate engine');

  /* ===================== BEAT 1 — a known multiply, and the 1-bit multiply is an AND ===================== */
  guide.say(`The aim of this step: build the one operation an AI chip does most — <b>multiply two numbers and add the result onto a running total</b>. Start with a multiply you already know: <b>7 × 7</b>. You know that's <b>49</b> — so the point here isn't the answer, it's watching how a chip <em>reaches</em> it, with a method that also works for numbers far too big to know by heart.`);
  await guide.next();

  guide.say(`First, how does a chip multiply two single bits? Strip it right down: <em>1 × 1 = 1, and anything × 0 = 0.</em> You already built the gate that does exactly that in Act 2. Which one?`);

  const gate = await guide.choose([
    { label: 'AND', value: 'and', hint: 'output 1 only when BOTH inputs are 1' },
    { label: 'OR', value: 'or', hint: 'output 1 when EITHER input is 1' },
    { label: 'XOR', value: 'xor', hint: 'output 1 when the inputs DIFFER' },
  ]);
  if (gate !== 'and'){
    guide.note(`Not that one. Line up the four cases: <b>1 × 1 = 1</b>, <b>1 × 0 = 0</b>, <b>0 × 1 = 0</b>, <b>0 × 0 = 0</b>. That's an output of 1 only when <em>both</em> inputs are 1 — the <b>AND</b> gate, exactly.`);
  } else {
    guide.note(`Exactly — a one-bit multiplier is just an <b>AND</b> gate, which you've had since Act 2.`);
  }
  await guide.next();

  /* ===================== BEAT 2 — build the partial products (tap each bottom bit) ===================== */
  guide.say(`A full multiply is a grid of those ANDs — the same long multiplication you do on paper, but in base 2. Each row it makes is a <b>partial product</b>: one bit of the bottom number ANDed against the whole top number. Here's <b>111 × 111</b> — that's 7 × 7. <em>Tap each bit of the bottom number</em> to build its row. Every bit here is a 1, so every row lights fully; and each row sits one place further left, because that bit stands for the next power of two.`);

  const A = '111';                // 7
  const Bbits = [1, 1, 1];        // B = 111 (all bits set), value 7
  const pitch = 40, size = 28;
  const ax = 320, ay = 56;

  makeBitRow(svg, { x: ax, y: ay, bits: A, pitch, size, label: 'A = 7' });
  const rowB = makeBitRow(svg, { x: ax, y: ay + 44, bits: '111', pitch, size, label: 'B = 7' });
  const times = svgEl('text', { x: ax - 26, y: ay + 44 + size / 2 + 6, class: 'lbl-strong' });
  times.textContent = '×'; svg.appendChild(times);

  const ppTop = ay + 118, ppPitch = 42;

  const chipAnd = makeChip(controls, `AND gates: <b>0</b>`);
  let andCount = 0;

  // draw the partial-product row for B's displayed cell j (0 = leftmost/MSB of the 3 bits).
  // its bit-weight is 2^(2−j) → the row shifts (2−j) cells LEFT and draws at vertical
  // position (2−j), so the stack reads like paper long multiplication (top = the LSB's row).
  function lightRow(j){
    const g = svgEl('g', { class: 'pp-row', opacity: 0 });
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
    andCount += 3; chipAnd.set(`AND gates: <b>${andCount}</b>`);
    if (flow.instant){ g.setAttribute('opacity', 1); return; }
    gsap.fromTo(g, { opacity: 0, x: 26 }, { opacity: 1, x: 0, duration: 0.32, ease: 'power2.out' });
  }

  await flow.ask(async replay => {
    const lit = [false, false, false];
    const paint = j => { rowB.cells[j].r.classList.add('picked'); rowB.cells[j].r.style.cursor = 'default'; };
    if (replay !== undefined){
      for (let j = 0; j < 3; j++){ lightRow(j); paint(j); }   // end state identical for any order
      return replay;
    }
    const cancelHint = flow.hintAfter(15000, `Tap each of the three bottom-row cells — each lights a full row of ANDs. All three.`);
    await new Promise(resolve => {
      for (let j = 0; j < 3; j++){
        const cell = rowB.cells[j];
        cell.r.style.cursor = 'pointer'; cell.r.setAttribute('tabindex', '0'); cell.r.setAttribute('role', 'button');
        const fire = () => {
          if (lit[j]) return;
          lit[j] = true; SFX.click(); lightRow(j); paint(j); cell.r.style.cursor = 'default';
          if (lit.every(Boolean)){ cancelHint(); resolve(); }
        };
        cell.r.addEventListener('click', fire);
        cell.r.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fire(); } });
      }
    });
    return true;
  });

  guide.say(`<b>Nine ANDs</b> — three bits by three bits, one AND per pairing. There's your multiply, laid out. Now the only thing left is to <b>add these three rows together</b>.`);
  await guide.next();

  /* ===================== BEAT 3 — the multiply pile, count it → 49 (checkpoint AHA) ===================== */
  guide.say(`To add them, drop every bit into a column by its <b>place value</b>. The numbers under the columns — <b>1, 2, 4, 8, 16 …</b> — are the powers of two. <b>Each dot is a 1 that landed in that column</b>, so a column three dots tall means three 1s to add up in that place.`);

  // fade the partial-product rows into the dot board (they are the same bits, re-sorted)
  svg.querySelectorAll('.pp-row').forEach(g => { if (!flow.instant) gsap.to(g, { opacity: 0, duration: 0.25 }); else g.setAttribute('opacity', 0); });
  if (!flow.instant) await sleep(280);
  svg.querySelectorAll('.pp-row').forEach(g => g.remove());

  // 7 columns (w0..w6) so carries have room to land; 49 needs up to the 32s, 64 the 64s.
  // multiply-only heights = [1,2,3,2,1,0,0]  →  value 49  (every dot is a real 1).
  const board = makeDotColumns(svg, { x: 210, y: 400, heights: [1, 2, 3, 2, 1, 0, 0], pitch: 46 });
  const pileValue = () => board.cols.reduce((s, c) => s + board.heightOf(c.i) * (2 ** c.i), 0);
  const chipPile = makeChip(controls, `PILE VALUE: <b>—</b>`, 'warm');
  await sleep(flow.instant ? 0 : 220);
  chipPile.set(`PILE VALUE: <b>${pileValue()}</b>`);
  await guide.next();

  guide.aha(`Count the pile column by column: <b>one</b> 1 in the 1s, <b>two</b> in the 2s, <b>three</b> in the 4s, <b>two</b> in the 8s, <b>one</b> in the 16s. Add them: 1 + 4 + 12 + 16 + 16 = <b>49</b>.`,
    `That's exactly the 7 × 7 you already knew. The pile isn't a new kind of number — it <em>is</em> the multiply; you just have to add it up.`);
  await guide.next();

  /* ===================== BEAT 4 — introduce the accumulator ===================== */
  guide.say(`Now the twist. A chip almost never multiplies just once — it runs a long list of multiplies and keeps a <b>running total</b>, adding each new product onto it. That running total is the <b>accumulator</b>, and it's the "accumulate" in <b>multiply-accumulate</b>. Say the total so far is <b>15</b>. Adding it in just means dropping <em>its</em> bits into these same columns.`);
  await guide.next();

  /* ===================== BEAT 5 — drop the accumulator's bits → pile = 64 ===================== */
  // 15 = 1111 → one 1 in each of the 1s, 2s, 4s, 8s columns (weights 0..3).
  const accLbl = svgEl('text', { x: 210, y: 300, class: 'lbl-faint', 'text-anchor': 'start' });
  accLbl.textContent = '+ 15 (the running total) = 1111';
  svg.appendChild(accLbl);
  for (const c of [0, 1, 2, 3]){
    board.drop(c);
    chipPile.set(`PILE VALUE: <b>${pileValue()}</b>`);
    if (!flow.instant){ SFX.click(); await sleep(150); }
  }

  guide.say(`Fifteen is <b>1111</b> — a 1 in the 1s, 2s, 4s and 8s columns. Dropped on top, the pile now stands taller, and it adds to <b>64</b> (that's 49 + 15). <em>This</em> tall pile is what one multiply-accumulate leaves you to add — and a real chip does millions of these a second.`);
  await guide.next();

  /* ===================== BEAT 6 — the compressor (the hero interaction) ===================== */
  guide.say(`Adding a column that's several 1s tall, over and over, is slow. So chips crush it with one tool: the <b>full adder</b> from Act 2. It grabs <em>three</em> 1s from a column and hands back two — one stays here (the sum), one carries into the next column left (because three 1s = binary <b>11</b> = one here, one carried). Chip designers call it a <b>3-into-2 compressor</b>. <em>Tap any column with three or more dots.</em> Keep going until no column has three — and watch the pile value: crushing never changes it, only the shape.`);

  const chipComp = makeChip(controls, `compressors used: <b>0</b>`);

  function refreshHot(){
    board.cols.forEach(col => {
      const hot = board.heightOf(col.i) >= 3;
      col.colG.classList.toggle('hot', hot);
      col.hit.style.cursor = hot ? 'pointer' : 'default';
    });
  }
  const anyPlayable = () => board.cols.some(col => board.heightOf(col.i) >= 3);

  await flow.ask(async replay => {
    const taps = [];
    if (replay !== undefined){
      for (const c of replay){ await board.take3(c); }
      board.cols.forEach(col => col.colG.classList.remove('hot'));
      return replay;
    }
    const cancelHint = flow.hintAfter(15000, `Any column with three dots or more. Tap it — three become two, with one carried left.`);
    let compressors = 0, busy = false;
    refreshHot();
    await new Promise(resolve => {
      board.cols.forEach(col => {
        col.hit.setAttribute('tabindex', '0'); col.hit.setAttribute('role', 'button');
        const fire = async () => {
          if (busy || board.heightOf(col.i) < 3) return;
          busy = true;
          taps.push(col.i);
          await board.take3(col.i);
          compressors++; chipComp.set(`compressors used: <b>${compressors}</b>`);
          chipPile.set(`PILE VALUE: <b>${pileValue()}</b>`);   // stays 64 — the point
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

  /* ----- no column above two → hand the two rows to the Act-2 ripple adder → the answer prints ----- */
  guide.say(`No column above two now — and adding two rows is a solved problem: it's the <b>ripple adder</b> you built in Act 2. Hand the pile to it.`);

  await guide.button('Feed them to your Act-2 adder ▸');

  const boxX = 210, boxY = 150, boxW = 300, boxH = 150;
  const boxG = svgEl('g', { class: 'adder-box', opacity: 0 });
  boxG.appendChild(svgEl('rect', { x: boxX, y: boxY, width: boxW, height: boxH, rx: 8, class: 'sys-cell-bg' }));
  const s = 8;
  boxG.appendChild(svgEl('path', {
    d: `M${boxX} ${boxY + s} V${boxY} H${boxX + s} M${boxX + boxW - s} ${boxY} H${boxX + boxW} V${boxY + s} `
      + `M${boxX + boxW} ${boxY + boxH - s} V${boxY + boxH} H${boxX + boxW - s} M${boxX + s} ${boxY + boxH} H${boxX} V${boxY + boxH - s}`,
    class: 'sys-tick',
  }));
  const lbl = svgEl('text', { x: boxX + boxW / 2, y: boxY + 20, class: 'lbl-faint' }); lbl.textContent = 'RIPPLE ADDER';
  boxG.appendChild(lbl);
  const inLbl = svgEl('text', { x: boxX + boxW / 2, y: boxY + 54, class: 'lbl-faint' });
  inLbl.textContent = '← the last two rows feed in';
  inLbl.setAttribute('opacity', '0'); boxG.appendChild(inLbl);
  boxG.appendChild(svgEl('line', { x1: boxX + 24, y1: boxY + 82, x2: boxX + boxW - 24, y2: boxY + 82, class: 'wire' }));
  const outRow = makeBitRow(svg, { x: boxX + 30, y: boxY + 100, bits: '1000000', pitch: 30, size: 20, label: 'sixty-four' });
  outRow.el.setAttribute('opacity', '0');
  svg.appendChild(boxG); boxG.appendChild(outRow.el);

  if (flow.instant){
    boxG.setAttribute('opacity', 1); inLbl.setAttribute('opacity', 1); outRow.el.setAttribute('opacity', 1);
  } else {
    gsap.to(boxG, { opacity: 1, duration: 0.3 });
    await sleep(340);
    gsap.to(inLbl, { opacity: 1, duration: 0.24 });
    await sleep(300);
    gsap.to(outRow.el, { opacity: 1, duration: 0.3 });
    SFX.success();
  }

  guide.say(`<b>1000000 — sixty-four.</b> 7 × 7 + 15 = 64. ✓ You just did a full multiply-accumulate the way a chip does: AND the bits, pile them by place value, crush the pile, add the last two rows.`);
  await guide.next();

  guide.aha(`Count what the multiply cost: <b>9 ANDs</b> — 3 × 3, one for every pairing of bits. The <b>precision</b> of a number is how many bits wide it is; call the two widths <b>p</b> and <b>q</b>. The AND grid is p by q, so the gate count grows as the two widths <em>multiplied</em> together. <b>A multiplier's area grows as p × q — the square of the precision.</b> Every multiply-accumulate in every AI chip is this same circuit, at some p and q.`);
  await guide.next();

  /* ===================== BEAT 7 — the precision dial (the payoff) ===================== */
  const { svg: svg2, controls: controls2 } = newStage('14', 'Precision dial: area is p × q');

  guide.say(`A chip has a fixed budget of area. You can spend it on a few high-precision engines or many low-precision ones. Here's the question that decides modern AI hardware: halve the bit-width, and how much smaller does each engine get?`);

  const foot = { x: 250, y: 118, size: 224 };
  const footFrame = svgEl('rect', { x: foot.x, y: foot.y, width: foot.size, height: foot.size, rx: 8, class: 'slot' });
  const gridG = svgEl('g', { class: 'and-square' });
  svg2.append(footFrame, gridG);
  const footLbl = svgEl('text', { x: foot.x + foot.size / 2, y: foot.y - 12, class: 'lbl' });
  footLbl.textContent = 'ONE TILE OF SILICON'; svg2.appendChild(footLbl);

  const perTile = makeChip(controls2, `multipliers per tile: <b>1×</b>`);

  function drawSquare(p){
    const inset = 12;
    const span = foot.size - inset * 2;
    const step = span / (p - 1 || 1);
    const r = Math.max(1.6, Math.min(6, span / (p * 2.4)));
    const target = [];
    for (let row = 0; row < p; row++)
      for (let col = 0; col < p; col++)
        target.push({ cx: foot.x + inset + col * step, cy: foot.y + inset + row * step });
    const cur = Array.from(gridG.querySelectorAll('circle'));
    while (cur.length < target.length){ const d = svgEl('circle', { r, class: 'dotbit' }); gridG.appendChild(d); cur.push(d); }
    while (cur.length > target.length){ cur.pop().remove(); }
    cur.forEach((d, k) => {
      if (flow.instant){ d.setAttribute('cx', target[k].cx); d.setAttribute('cy', target[k].cy); d.setAttribute('r', r); }
      else gsap.to(d, { attr: { cx: target[k].cx, cy: target[k].cy, r }, duration: 0.25, ease: 'power2.inOut' });
    });
  }

  const perMap = { 16: '1×', 8: '4×', 4: '16×' };
  function setPrecision(p){ drawSquare(p); perTile.set(`multipliers per tile: <b>${perMap[p]}</b>`); seg.set(p); }

  const seg = makeSeg(controls2, [
    { id: 'p16', label: '16-bit', value: 16 },
    { id: 'p8', label: '8-bit', value: 8 },
    { id: 'p4', label: '4-bit', value: 4 },
  ], p => { SFX.click(); setPrecision(p); });

  setPrecision(16);

  const shrink = await guide.choose([
    { label: '2× smaller', value: '2x', hint: 'only one side shrank?' },
    { label: '4× smaller', value: '4x', hint: 'both sides of the parallelogram halve' },
    { label: 'no smaller', value: 'none', hint: 'fewer bits, fewer ANDs — surely something shrinks' },
  ]);
  if (shrink !== '4x'){
    guide.note(`Look at the square. Halve the precision and you halve <em>both</em> sides of the p × q grid — width AND height. Half times half is a <b>quarter</b>: <b>4× smaller</b>.`);
  } else {
    guide.note(`Right — both sides of the grid halve at once.`);
  }
  await guide.next();

  guide.aha(`<b>Quadratic.</b> Halve the precision and four times the multiply engines fit in the same area. Neural networks turn out to tolerate low-precision numbers well, so the industry moved to 8-bit and then 4-bit math — this square law is the reason. The NV-1 will use 4-bit engines.`,
    `One honest caveat: real chips also handle a floating-point exponent, which blunts the law a little. It stays close to quadratic, and it is still the deciding factor.`);
  await guide.next();
}
