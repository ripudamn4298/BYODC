// BYODC engine — Act 4 "machines for mathematics" vocabulary, paper style.
// The visual kit for the multiply-accumulate and systolic-array steps: static bit
// rows, the dot-column compression board (Dadda 3→2 game), the full-adder token,
// the area bar, the register-file mux rig, the systolic MAC grid (trickle-feed +
// data pulse), and the compute-per-communication rubber stamp.
// Everything is a PURE function of index — NO randomness anywhere — so Back/Restart
// replays land on identical layouts. Every animation is guarded by flow.instant
// (end-state applied synchronously on replay) and skips decorative motion under RM.
import { svgEl, sleep, clamp, RM } from './util.js';
import { SFX } from './sfx.js';
import { flow } from './flow.js';

const still = () => flow.instant || RM;

/* ---------- makeBitRow: a static row of bit cells (reuse .bit-cell / .bit-t) ---------- */
export function makeBitRow(svg, { x, y, bits, pitch = 40, size = 28, label }){
  const g = svgEl('g', { class: 'bit-row' });
  const arr = String(bits).split('').map(Number);
  const cells = [];
  for (let i = 0; i < arr.length; i++){
    const cx = x + i * pitch;
    const r = svgEl('rect', { x: cx, y, width: size, height: size, rx: 3, class: 'bit-cell' });
    const t = svgEl('text', { x: cx + size / 2, y: y + size / 2 + 4.5, class: 'bit-t' });
    const bit = arr[i];
    if (bit){ r.classList.add('hi'); t.classList.add('hi'); }
    t.textContent = String(bit);
    g.append(r, t);
    cells.push({ r, tx: t });
  }
  if (label){
    const lb = svgEl('text', { x: x + ((arr.length - 1) * pitch + size) / 2, y: y + size + 16, class: 'lbl' });
    lb.textContent = label; g.appendChild(lb);
  }
  svg.appendChild(g);
  return {
    el: g, cells,
    set(newBits){
      const b = String(newBits).split('').map(Number);
      for (let i = 0; i < cells.length; i++){
        const v = b[i] || 0;
        cells[i].r.classList.toggle('hi', !!v);
        cells[i].tx.classList.toggle('hi', !!v);
        cells[i].tx.textContent = String(v);
      }
    },
  };
}

/* ---------- makeDotColumns: the compression game board -----------------------------
   One column per bit-weight, weight 0 (LSB) on the RIGHT (conventional place value).
   Each column is a vertical stack of ink dots (r=6, 15px apart), stacked bottom-up from
   the baseline. take3(c) plays the Dadda 3→2 compressor: the top three dots of column c
   fly into a full-adder token, which ejects the sum back onto c and the carry onto c+1
   (the next-higher weight = the LEFT neighbour, like a carry on paper). Carry flies in
   amber (Act-2 carry convention), lands ink. */
export function makeDotColumns(svg, { x, y, heights, pitch = 46, dotR = 6, maxH = 8 }){
  const g = svgEl('g', { class: 'dot-board' });
  const gap = 15;                                        // vertical dot spacing
  const nCols = heights.length;
  // column index i = bit-weight i, drawn MIRRORED so weight 0 (LSB) is the RIGHTMOST column —
  // matching ordinary place-value notation. Carries in take3 go to cols[c+1] (the next-higher
  // weight), which therefore fly LEFT, exactly like a carry in long multiplication.
  const cols = [];
  for (let i = 0; i < nCols; i++){
    const cx = x + (nCols - 1 - i) * pitch;
    const colG = svgEl('g', { class: 'dotcol' });
    // a soft base tick under each column (the click target highlight rides this)
    const base = svgEl('line', { x1: cx - 11, y1: y + 6, x2: cx + 11, y2: y + 6, class: 'dotcol-base' });
    const wl = svgEl('text', { x: cx, y: y + 22, class: 'lbl-faint' });
    wl.textContent = String(2 ** i);
    // a generous transparent hit target covering the whole column (dots are
    // pointer-events:none so clicks anywhere in the column reach this rect)
    const hitTop = y - maxH * gap - 12, hitH = (y + 16) - hitTop;
    const hit = svgEl('rect', { x: cx - pitch / 2 + 3, y: hitTop, width: pitch - 6, height: hitH, fill: 'transparent', class: 'dotcol-hit' });
    colG.append(base, wl, hit);
    const dots = [];
    const col = { i, cx, colG, base, hit, dots };
    for (let k = 0; k < heights[i]; k++) addDot(col);
    g.appendChild(colG);
    cols.push(col);
  }
  svg.appendChild(g);

  function dotY(k){ return y - k * gap; }                // stack bottom-up from baseline
  function addDot(col, cy){
    const d = svgEl('circle', { cx: col.cx, cy: cy == null ? dotY(col.dots.length) : cy, r: dotR, class: 'dotbit' });
    d.style.pointerEvents = 'none';   // clicks pass through to the column's hit rect
    col.colG.appendChild(d);
    col.dots.push(d);
    return d;
  }
  function reflow(col){                                  // reseat every dot at its stack slot
    col.dots.forEach((d, k) => { d.setAttribute('cx', col.cx); d.setAttribute('cy', dotY(k)); });
  }

  async function fly(node, tx, ty, dur, color){
    if (color) node.style.stroke = color;                // amber carry in flight
    if (still()){ node.setAttribute('cx', tx); node.setAttribute('cy', ty); if (color) node.style.stroke = ''; return; }
    const x0 = +node.getAttribute('cx'), y0 = +node.getAttribute('cy');
    await new Promise(res => {
      const o = { t: 0 };
      gsap.to(o, {
        t: 1, duration: dur / 1000, ease: 'power2.inOut',
        onUpdate(){ node.setAttribute('cx', x0 + (tx - x0) * o.t); node.setAttribute('cy', y0 + (ty - y0) * o.t); },
        onComplete(){ if (color) node.style.stroke = ''; res(); },
      });
    });
  }

  return {
    el: g, cols,
    heightOf(c){ return cols[c] ? cols[c].dots.length : 0; },
    /* pop a dot straight onto a column (used to seed / re-print) */
    drop(c, kind){
      const col = cols[c]; if (!col) return;
      const d = addDot(col);
      if (kind === 'carry') d.classList.add('carry-land');
    },
    /* the 3→2 compression move on column c */
    async take3(c){
      const col = cols[c]; if (!col || col.dots.length < 3) return;
      const left = cols[c + 1];                            // next-higher weight (drawn to the LEFT)
      const tokX = col.cx - 26, tokY = dotY(col.dots.length - 1) - 4;   // token sits toward the carry's destination (left)
      // lift the top three dots
      const three = col.dots.splice(col.dots.length - 3, 3);
      if (still()){
        three.forEach(d => d.remove());
        addDot(col);                                       // the sum, back onto c
        if (left) addDot(left);                            // the carry, onto c+1
        return;
      }
      // pulse then fly the three into a full-adder token beside the column
      three.forEach((d, k) => d.style.transition = 'transform .12s var(--ease)');
      three.forEach(d => d.classList.add('pulse'));
      await sleep(120);
      const tok = makeFAToken(g, { x: tokX - 20, y: tokY - 16 });
      for (let k = 0; k < three.length; k++){
        fly(three[k], tokX, tokY, 180, null);
        await sleep(40);
      }
      await sleep(120);
      three.forEach(d => d.remove());
      SFX.click();
      // eject the sum back onto column c and the carry onto column c+1
      const sum = svgEl('circle', { cx: tokX, cy: tokY, r: dotR, class: 'dotbit' });
      g.appendChild(sum);
      col.dots.push(sum);
      await fly(sum, col.cx, dotY(col.dots.length - 1), 180, null);
      if (left){
        const carry = svgEl('circle', { cx: tokX, cy: tokY, r: dotR, class: 'dotbit' });
        g.appendChild(carry);
        left.dots.push(carry);
        await fly(carry, left.cx, dotY(left.dots.length - 1), 180, 'var(--amber)');
      }
      reflow(col); if (left) reflow(left);
      tok.remove();
    },
  };
}

/* ---------- makeFAToken: small rounded box, mono "3→2", pop-in/out ---------- */
export function makeFAToken(svg, { x, y }){
  const g = svgEl('g', { class: 'fa-token' });
  g.appendChild(svgEl('rect', { x, y, width: 40, height: 30, rx: 5 }));
  const t = svgEl('text', { x: x + 20, y: y + 19, class: 'fa-token-t' });
  t.textContent = '3→2';
  g.appendChild(t);
  svg.appendChild(g);
  if (!still()) g.classList.add('pop-in');
  return {
    el: g,
    remove(){
      if (still()){ g.remove(); return; }
      g.classList.remove('pop-in');
      gsap.to(g, { opacity: 0, scale: 0.4, transformOrigin: `${x + 20}px ${y + 15}px`, duration: 0.16, onComplete(){ g.remove(); } });
    },
  };
}

/* ---------- makeAreaBar: horizontal stacked bar chip (an HTML control) ---------- */
export function makeAreaBar(controls, { segs }){
  const wrap = document.createElement('div');
  wrap.className = 'chip area-bar';
  const track = document.createElement('div');
  track.className = 'area-track';
  segs.forEach(s => {
    const seg = document.createElement('div');
    seg.className = 'area-seg ' + (s.color === 'amber' ? 'amber' : s.color === 'blue' ? 'blue' : '');
    seg.style.flex = String(clamp(s.frac, 0, 1));
    const lab = document.createElement('span');
    lab.textContent = s.label;
    seg.appendChild(lab);
    track.appendChild(seg);
  });
  wrap.appendChild(track);
  controls.appendChild(wrap);
  return { el: wrap };
}

/* ---------- makeMuxRig: register file + AND mask + OR collapse funnel + output ------
   n rows × p bit cells with a select tab per row. select(i) one-hot highlights row i,
   dims the rest, fades masked rows' bits to 12%, and slides the survivor's bits down
   the funnel into the output row. gateCount reports the mux's gate bill. */
export function makeMuxRig(svg, { x, y, n = 8, p = 4 }){
  const g = svgEl('g', { class: 'mux-rig' });
  const cell = 30, gap = 8, rowH = cell + gap;
  // deterministic register contents: row 3 is 1011 (spec), the rest a fixed pattern.
  const contents = [];
  for (let r = 0; r < n; r++){
    // pure function of r — no randomness. R3 forced to 1011 per §4.4.
    const v = r === 3 ? 0b1011 : ((r * 5 + 3) & ((1 << p) - 1));
    contents.push(v);
  }
  const rows = [];
  const bitW = cell + gap;
  const fileW = p * bitW - gap;
  for (let r = 0; r < n; r++){
    const ry = y + r * rowH;
    const rowG = svgEl('g', { class: 'mux-row' });
    // select tab
    const tab = svgEl('rect', { x: x - 40, y: ry + 3, width: 32, height: cell - 6, rx: 3, class: 'mux-tab' });
    const tabT = svgEl('text', { x: x - 24, y: ry + cell / 2 + 4, class: 'lbl' });
    tabT.textContent = 'R' + r;
    rowG.append(tab, tabT);
    const cells = [];
    for (let b = 0; b < p; b++){
      const bit = (contents[r] >> (p - 1 - b)) & 1;
      const bx = x + b * bitW;
      const rect = svgEl('rect', { x: bx, y: ry, width: cell, height: cell, rx: 3, class: 'bit-cell' });
      const tx = svgEl('text', { x: bx + cell / 2, y: ry + cell / 2 + 4.5, class: 'bit-t' });
      if (bit){ rect.classList.add('hi'); tx.classList.add('hi'); }
      tx.textContent = String(bit);
      rowG.append(rect, tx);
      cells.push({ rect, tx });
    }
    g.appendChild(rowG);
    rows.push({ r, rowG, tab, tabT, cells, y: ry });
  }
  // OR collapse funnel → output row, printed beneath the file
  const outY = y + n * rowH + 24;
  // funnel drawn as a straight taper cue — the collapse is the OR merge
  const funnelLine = svgEl('path', {
    d: `M${x} ${y + n * rowH + 3} L${x + fileW / 2} ${outY - 5} L${x + fileW} ${y + n * rowH + 3}`,
    class: 'mux-funnel', fill: 'none',
  });
  g.appendChild(funnelLine);
  const out = [];
  for (let b = 0; b < p; b++){
    const bx = x + b * bitW;
    const rect = svgEl('rect', { x: bx, y: outY, width: cell, height: cell, rx: 3, class: 'bit-cell' });
    const tx = svgEl('text', { x: bx + cell / 2, y: outY + cell / 2 + 4.5, class: 'bit-t' });
    tx.textContent = '·';
    g.append(rect, tx);
    out.push({ rect, tx });
  }
  const outLbl = svgEl('text', { x: x + fileW / 2, y: outY + cell + 16, class: 'lbl' });
  outLbl.textContent = 'TO THE ENGINE';
  g.appendChild(outLbl);
  svg.appendChild(g);

  const setOut = v => {
    for (let b = 0; b < p; b++){
      const bit = (v >> (p - 1 - b)) & 1;
      out[b].rect.classList.toggle('hi', !!bit);
      out[b].tx.classList.toggle('hi', !!bit);
      out[b].tx.textContent = String(bit);
    }
  };

  return {
    el: g,
    // §4.4: ANDs 8×4=32, ORs 7×4=28, ×3 ports = 180 gate-equivalents.
    gateCount: (n * p) + ((n - 1) * p) * 3,               // reported; steps read the printed tally too
    contents,
    /* one-hot select of row i: mask the rest, funnel the survivor to the output */
    async select(i){
      rows.forEach(row => {
        const sel = row.r === i;
        row.rowG.classList.toggle('mux-sel', sel);
        row.tab.classList.toggle('on', sel);
        row.cells.forEach(c => c.rect.classList.toggle('mux-mask', !sel));   // masked rows fade to 12%
        row.cells.forEach(c => c.tx.classList.toggle('mux-mask', !sel));
      });
      const v = contents[i];
      if (still()){ setOut(v); return v; }
      // slide the survivor's bit values down the funnel into the output row
      const survivor = rows[i];
      const clones = survivor.cells.map((c, b) => {
        const src = c.rect;
        const cl = svgEl('rect', {
          x: +src.getAttribute('x'), y: +src.getAttribute('y'),
          width: cell, height: cell, rx: 3,
          class: 'bit-cell' + (src.classList.contains('hi') ? ' hi' : ''),
        });
        g.appendChild(cl);
        return { cl, tx: +out[b].rect.getAttribute('x'), ty: outY };
      });
      await new Promise(res => {
        const o = { t: 0 };
        gsap.to(o, {
          t: 1, duration: 0.4, ease: 'power2.inOut',
          onUpdate(){
            clones.forEach((k, b) => {
              const x0 = +survivor.cells[b].rect.getAttribute('x'), y0 = survivor.y;
              k.cl.setAttribute('x', x0 + (k.tx - x0) * o.t);
              k.cl.setAttribute('y', y0 + (k.ty - y0) * o.t);
            });
          },
          onComplete: res,
        });
      });
      clones.forEach(k => k.cl.remove());
      setOut(v);
      return v;
    },
  };
}

/* ---------- makeSystolic: the MAC grid — trickle-feed load + data pulse -------------
   rows×cols of MAC cells. Each = a paper-high rect (corner ticks), a 28×28 weight
   register (top-left, dashed until loaded), a mono "×+" glyph, and a down-arrow port.
   loadColumn trickles values in from the top, one beat per row (THE TRICKLE-FEED).
   pulse sends blue value-chips down each column; each cell flashes (multiply) and an
   amber-ringed running-sum chip grows as it falls, dropping out into result cells. */
export function makeSystolic(svg, { x, y, rows = 2, cols = 2, cell = 92 }){
  const g = svgEl('g', { class: 'systolic' });
  const pad = 12;
  const cellAt = (r, c) => ({ cx: x + c * (cell + pad), cy: y + r * (cell + pad) });
  const cells = [];
  // top feed wires (one thin wire per column) + trickle labels
  const wires = [];
  for (let c = 0; c < cols; c++){
    const { cx } = cellAt(0, c);
    const w = svgEl('line', { x1: cx + cell / 2, y1: y - 34, x2: cx + cell / 2, y2: y, class: 'sys-feed' });
    g.appendChild(w);
    wires.push(w);
  }
  for (let r = 0; r < rows; r++){
    for (let c = 0; c < cols; c++){
      const { cx, cy } = cellAt(r, c);
      const cellG = svgEl('g', { class: 'sys-cell' });
      cellG.appendChild(svgEl('rect', { x: cx, y: cy, width: cell, height: cell, rx: 5, class: 'sys-cell-bg' }));
      // corner ticks (paper instrument)
      const s = 7;
      cellG.appendChild(svgEl('path', {
        d: `M${cx} ${cy + s} V${cy} H${cx + s} M${cx + cell - s} ${cy} H${cx + cell} V${cy + s} `
          + `M${cx + cell} ${cy + cell - s} V${cy + cell} H${cx + cell - s} M${cx + s} ${cy + cell} H${cx} V${cy + cell - s}`,
        class: 'sys-tick',
      }));
      // weight register (dashed until loaded)
      const wreg = svgEl('rect', { x: cx + 8, y: cy + 8, width: 28, height: 28, rx: 3, class: 'sys-wreg' });
      const wregT = svgEl('text', { x: cx + 22, y: cy + 27, class: 'sys-wreg-t' });
      wregT.textContent = '';
      // "×+" glyph, centre
      const glyph = svgEl('text', { x: cx + cell / 2, y: cy + cell / 2 + 12, class: 'sys-glyph' });
      glyph.textContent = '×+';
      // down-arrow port
      const port = svgEl('path', { d: `M${cx + cell / 2} ${cy + cell - 16} v10 m-5 -5 l5 5 l5 -5`, class: 'sys-port' });
      cellG.append(wreg, wregT, glyph, port);
      g.appendChild(cellG);
      cells.push({ r, c, cx, cy, cellG, wreg, wregT, glyph, weight: null });
    }
  }
  // result cells below the bottom edge
  const results = [];
  for (let c = 0; c < cols; c++){
    const { cx } = cellAt(rows - 1, c);
    const ry = y + rows * (cell + pad);
    const rect = svgEl('rect', { x: cx + cell / 2 - 20, y: ry, width: 40, height: 30, rx: 4, class: 'sys-result' });
    const t = svgEl('text', { x: cx + cell / 2, y: ry + 20, class: 'sys-result-t' });
    t.textContent = '';
    g.append(rect, t);
    results.push({ rect, t, cx: cx + cell / 2, cy: ry + 15 });
  }
  // optional wire labels
  const wireLbls = [];
  svg.appendChild(g);

  const cellRC = (r, c) => cells[r * cols + c];
  const setWeight = (r, c, v) => {
    const cell0 = cellRC(r, c);
    cell0.weight = v;
    cell0.wreg.classList.add('loaded');
    cell0.wregT.textContent = String(v);
  };

  async function flash(cell0){
    if (still()) return;
    cell0.cellG.classList.add('flash');
    await sleep(120);
    cell0.cellG.classList.remove('flash');
  }

  async function chipTo(chip, tx, ty, dur){
    if (still()){ chip.setAttribute('transform', `translate(${tx},${ty})`); return; }
    const m = /translate\(([-\d.]+),([-\d.]+)\)/.exec(chip.getAttribute('transform') || 'translate(0,0)');
    const x0 = m ? +m[1] : 0, y0 = m ? +m[2] : 0;
    await new Promise(res => {
      const o = { t: 0 };
      gsap.to(o, {
        t: 1, duration: dur / 1000, ease: 'none',
        onUpdate(){ chip.setAttribute('transform', `translate(${x0 + (tx - x0) * o.t},${y0 + (ty - y0) * o.t})`); },
        onComplete: res,
      });
    });
  }

  return {
    el: g, cells,
    setWireLabels(on){
      if (!on){ wireLbls.forEach(l => l.remove()); wireLbls.length = 0; return; }
      if (wireLbls.length) return;
      wires.forEach((w, c) => {
        const l = svgEl('text', { x: cellAt(0, c).cx + cell / 2, y: y - 40, class: 'lbl-faint' });
        l.textContent = 'DATA';
        g.appendChild(l); wireLbls.push(l);
      });
    },
    /* THE TRICKLE-FEED: values enter row 0's register, then shift DOWN one row per
       beat until settled bottom-up. Visibly slow, one thin wire per column. */
    async loadColumn(c, values){
      // settled state: values[k] lands in row k (bottom-up ordering per spec — the
      // first value sinks furthest). values given top→bottom of final column.
      if (still()){
        values.forEach((v, r) => setWeight(r, c, v));
        return;
      }
      // feed values one per beat; each shifts down through the column.
      const nR = rows;
      for (let step = 0; step < values.length; step++){
        // the value that must settle at row (nR-1-step)
        const v = values[nR - 1 - step];
        const target = nR - 1 - step;
        // enter at row 0, then step down beat by beat to its resting row
        const chip = svgEl('g', { class: 'sys-chip loading' });
        chip.appendChild(svgEl('rect', { x: -13, y: -13, width: 26, height: 26, rx: 3 }));
        const ct = svgEl('text', { x: 0, y: 5, class: 'sys-chip-t' });
        ct.textContent = String(v);
        chip.appendChild(ct);
        const enter = cellAt(0, c);
        chip.setAttribute('transform', `translate(${enter.cx + 22},${y - 20})`);
        g.appendChild(chip);
        for (let r = 0; r <= target; r++){
          const dest = cellAt(r, c);
          await chipTo(chip, dest.cx + 22, dest.cy + 22, 350);
          SFX.click();
        }
        chip.remove();
        setWeight(target, c, v);
      }
    },
    /* pulse a vector through the columns: blue chip per column top, pause+flash at
       each cell (the multiply), amber-ringed running-sum grows downward, sums drop
       into result cells. ~1.6s for 2×2. */
    async pulse(vec, opts = {}){
      // Each column computes a full dot-product of the parked weights against the
      // pulsed vector: result[c] = Σ_r weight[r][c] · vec[r]. The vector component
      // that meets each row is vec[r] (data flows down; one component per beat), so
      // the running-sum printed at row r is Σ_{k≤r} weight[k][c]·vec[k].
      const outVals = [];
      for (let c = 0; c < cols; c++){
        let acc = 0;
        for (let r = 0; r < rows; r++) acc += (cellRC(r, c).weight || 0) * (vec[r] || 0);
        outVals.push(acc);
      }
      if (still()){
        outVals.forEach((v, c) => { results[c].t.textContent = String(v); });
        return outVals;
      }
      await Promise.all(outVals.map(async (final, c) => {
        // the blue data chip riding down this column (its value updates per row)
        const dataChip = svgEl('g', { class: 'sys-chip data' });
        dataChip.appendChild(svgEl('circle', { r: 13 }));
        const dt = svgEl('text', { x: 0, y: 5, class: 'sys-chip-t' });
        dt.textContent = String(vec[0] || 0);
        dataChip.appendChild(dt);
        const top = cellAt(0, c);
        dataChip.setAttribute('transform', `translate(${top.cx + cell / 2},${y - 20})`);
        g.appendChild(dataChip);
        // the amber-ringed running-sum chip
        const sumChip = svgEl('g', { class: 'sys-chip sum' });
        sumChip.appendChild(svgEl('circle', { r: 15 }));
        const st = svgEl('text', { x: 0, y: 5, class: 'sys-chip-t' });
        st.textContent = '0';
        sumChip.appendChild(st);
        sumChip.setAttribute('transform', `translate(${top.cx + cell / 2},${y - 20})`);
        sumChip.style.opacity = '0';
        g.appendChild(sumChip);
        let acc = 0;
        for (let r = 0; r < rows; r++){
          const cell0 = cellRC(r, c);
          const dest = cellAt(r, c);
          dt.textContent = String(vec[r] || 0);                 // fresh data component for this row
          await chipTo(dataChip, dest.cx + cell / 2, dest.cy + cell / 2, 200);
          await sleep(120);
          await flash(cell0);
          acc += (cell0.weight || 0) * (vec[r] || 0);           // the multiply-accumulate
          st.textContent = String(acc);
          sumChip.style.opacity = '1';
          await chipTo(sumChip, dest.cx + cell / 2, dest.cy + cell / 2 + 6, 1);
        }
        // drop the sum out the bottom into the result cell
        await chipTo(sumChip, results[c].cx, results[c].cy, 220);
        dataChip.remove();
        sumChip.remove();
        results[c].t.textContent = String(acc);
        SFX.click();
      }));
      return outVals;
    },
  };
}

/* ---------- makeMotto: the compute-per-communication rubber stamp (§4.6) ----------
   A rounded-rect rotated −4°, double hairline border in --amber, mono letter-spaced
   text, stamped at the stage corner (~x470 y420) with a quick scale 1.15→1 + one
   SFX.click. 340×34px, opacity .85. */
export function makeMotto(stageEl){
  const svg = stageEl.tagName && stageEl.tagName.toLowerCase() === 'svg' ? stageEl : stageEl.ownerSVGElement || stageEl;
  const W = 340, H = 34, cx = 470, cy = 420;
  const x = cx - W / 2, y = cy - H / 2;
  const g = svgEl('g', { class: 'motto' });
  g.style.transformOrigin = `${cx}px ${cy}px`;
  g.style.transform = 'rotate(-4deg)';
  g.appendChild(svgEl('rect', { x, y, width: W, height: H, rx: 5, class: 'motto-border' }));
  g.appendChild(svgEl('rect', { x: x + 3, y: y + 3, width: W - 6, height: H - 6, rx: 3, class: 'motto-border inner' }));
  const t = svgEl('text', { x: cx, y: cy + 4, class: 'motto-t' });
  t.textContent = 'MAXIMISE COMPUTE PER UNIT OF COMMUNICATION';
  g.appendChild(t);
  (svg.querySelector ? svg : stageEl).appendChild(g);
  if (still()){ g.style.opacity = '.85'; return { el: g }; }
  SFX.click();
  gsap.fromTo(g,
    { opacity: 0, scale: 1.15, rotation: -4, transformOrigin: `${cx}px ${cy}px` },
    { opacity: 0.85, scale: 1, rotation: -4, duration: 0.34, ease: 'back.out(2)' });
  return { el: g };
}
