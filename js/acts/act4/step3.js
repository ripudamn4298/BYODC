// ACT 4 · STEP 3 — "The stationary trick" (systolic: the data-movement tax + weight-stationary).
// Beat 1: the register-file mux, built the dumbest way — mask everything, then merge. It's
// bigger than the maths it feeds (~6 fetch-gates per compute-gate). Beat 2: park the weights
// once, pulse only the fresh data through — quadratic compute for linear communication.
// Closes with the leitmotif stamp (first of three). Per HANDOFF_V3 §4.4.
import { sleep, svgEl, svgPt, waitFor } from '../../engine/util.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeChip } from '../../engine/components.js';
import { makeMuxRig, makeSystolic, makeAreaBar, makeMotto } from '../../engine/mathengine.js';

export async function step3(){
  guide.title('STEP 3 / 5 · NANOVOLT GRAPHICS', 'The <em>stationary trick</em>');

  /* ===================== BEAT 1 — the mux, built the dumbest way possible ===================== */
  {
    const { svg, controls } = newStage('15', 'The register-file mux: mask everything, then merge');

    guide.say(`The aim of this step, in two halves: first feel the real cost of <em>moving</em> data to the engine, then find the trick that stops paying it. Two terms to start. A <b>register file</b> is a small block of storage right next to the engine — here, eight shelves of four bits each. A <b>mux</b> (multiplexer) is a selector: given a shelf number, it delivers that one shelf's contents and ignores the rest. Your engine needs three numbers every tick — two to multiply, one pile to add onto — so a mux has to pick each one. Build that mux out of nothing but AND and OR, the simplest way there is: <b>mask every shelf you don't want, then merge what's left</b>.`);
    await guide.next();

    const rig = makeMuxRig(svg, { x: 110, y: 90, n: 8, p: 4 });

    // the bill, printed as the read happens
    const chipAnd = makeChip(controls, `ANDs: <b>—</b>`);
    const chipOr = makeChip(controls, `ORs: <b>—</b>`);
    const chipPorts = makeChip(controls, `gate bill: <b>—</b>`);

    guide.say(`Tap the select tab beside a shelf and watch the machine work: every other row is AND-ed with 0 until it fades to nothing, your shelf survives, and the OR funnel collapses the eight rows into one. <b>Read shelf R3 to the engine.</b>`);

    const t = guide.task('Read shelf R3 to the engine');

    await flow.ask(async replay => {
      const finish = () => {
        chipAnd.set(`ANDs: <b>8 rows × 4 bits = 32</b>`);
        chipOr.set(`ORs: <b>7 × 4 = 28</b>`);
        chipPorts.set(`× 3 ports = <b>180 gates</b>`);
      };
      if (replay !== undefined){
        // replay: select is synchronous under flow.instant — apply the R3 read end-state
        rig.select(3);
        finish();
        return replay;
      }

      const cancelHint = flow.hintAfter(15000, `Tap the tab marked <b>R3</b> on the left of the shelf — third from the top (R0 is the first).`);
      let solved = false;

      const tap = async i => {
        if (solved) return;
        SFX.click();
        await rig.select(i);          // runs the mask/collapse to THIS row's value
        finish();                     // the bill is the same whichever row you read
        if (i === 3) solved = true;
        else guide.note(`That's a working read — of the wrong shelf. <b>R3.</b>`);
      };

      // arm each row's select tab (whole row group is the target)
      rig.el.querySelectorAll('.mux-row').forEach((rowG, i) => {
        rowG.style.cursor = 'pointer';
        rowG.setAttribute('tabindex', '0');
        rowG.setAttribute('role', 'button');
        rowG.addEventListener('click', () => tap(i));
        rowG.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); tap(i); }
        });
      });

      await waitFor(() => solved, { hold: 200 });
      cancelHint();
      return 3;
    });
    t.done();

    // the data-movement vs math split, printed as a stacked bar
    makeAreaBar(controls, { segs: [
      { label: 'moving the data', frac: .86, color: 'amber' },
      { label: 'doing the math', frac: .14, color: 'blue' },
    ] });
    makeChip(controls, `the engine it feeds: <b>your 16 ANDs + ~16 adders</b>`);

    guide.aha(`Compare the two numbers: about <b>180 gates to fetch</b> the operands, about <b>30–40 gates to actually compute</b> with them. Roughly five gates of delivery for every gate of math. "Select shelf 3" never looks like a machine from software — but it is one, and it's bigger than the arithmetic it serves. For decades every processor paid this tax on every single operation. The fix starts from one observation: what if the numbers didn't have to travel every tick?`);
    await guide.next();
  }

  /* ===================== BEAT 2 — the stationary trick ===================== */
  const { svg, controls } = newStage('15', 'The systolic array: park the weights, pulse the data');

  guide.say(`In AI there's a fact you can exploit: one of the two numbers in every multiply — the <b>weight</b> — stays the same for millions of ticks in a row. So don't fetch it every tick. <b>Park it.</b> Give each multiply-engine one small register of its own, load the weights into those registers once (slowly and cheaply, single-file), and after that only the fresh data moves. Parking the weights and moving only the data is called <b>weight-stationary</b>. That's the aim of this half: park the weights, then pulse data through.`);
  await guide.next();

  const sys = makeSystolic(svg, { x: 250, y: 120, rows: 2, cols: 2, cell: 92 });

  // register file redrawn small at far left, one thin wire per column crossing a dashed border
  const rfG = svgEl('g', { class: 'mini-rf' });
  rfG.appendChild(svgEl('rect', { x: 44, y: 120, width: 40, height: 92, rx: 5, class: 'sys-cell-bg' }));
  const rfLbl = svgEl('text', { x: 64, y: 228, class: 'lbl-faint' }); rfLbl.textContent = 'REGISTER FILE';
  rfG.appendChild(rfLbl);
  svg.appendChild(rfG);

  // the dashed "expensive border" the traffic must cross
  const borderX = 210;
  const border = svgEl('line', { x1: borderX, y1: 96, x2: borderX, y2: 380, class: 'junction' });
  const borderLbl = svgEl('text', { x: borderX, y: 90, class: 'lbl-faint' }); borderLbl.textContent = 'the expensive border';
  svg.append(border, borderLbl);

  /* ---------- Interaction 1 — park the weights (column-gated, trickle-feed) ---------- */
  // paper matrix key: [[0,1],[3,2]] → column 0 top→bottom [0,3], column 1 top→bottom [1,2].
  const keyG = svgEl('g', { class: 'matrix-key' });
  const keyLbl = svgEl('text', { x: 588, y: 130, class: 'lbl-faint' }); keyLbl.textContent = 'park them to match';
  const keyLbl2 = svgEl('text', { x: 588, y: 144, class: 'lbl-faint' }); keyLbl2.textContent = 'the paper matrix';
  keyG.append(keyLbl, keyLbl2);
  // serif matrix bracket + entries
  keyG.appendChild(svgEl('path', { d: 'M566 162 h-8 v52 h8 M632 162 h8 v52 h-8', class: 'wire' }));
  const M = [[0, 1], [3, 2]];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++){
    const t = svgEl('text', { x: 578 + c * 30, y: 182 + r * 26, class: 'bit-t hi' });
    t.textContent = String(M[r][c]); keyG.appendChild(t);
  }
  svg.appendChild(keyG);

  guide.say(`First, <b>park the weights</b>. Drag each tile onto the <em>top</em> of its column — it trickles down its shelf, single-file, one shelf per beat. That slow, cheap load happens <b>once</b>. Match the paper matrix on the right: left column holds <b>0 over 3</b>, right holds <b>1 over 2</b>.`);

  // four draggable weight tiles laid out in a tray at the bottom
  const TRAY = [
    { value: 0, x: 300, y: 400 },
    { value: 1, x: 356, y: 400 },
    { value: 3, x: 412, y: 400 },
    { value: 2, x: 468, y: 400 },
  ];
  const tileW = 34, tileH = 34;
  const cellPitch = 92 + 12;
  const colTopX = c => 250 + c * cellPitch + 46;   // x-centre of column c's top cell
  const colTopY = 120 + 46;                          // y-centre of the top cell
  // the correct column contents, top→bottom
  const COLS = [[0, 3], [1, 2]];

  await flow.ask(async replay => {
    if (replay !== undefined){
      // apply parked end-state instantly (loadColumn is synchronous under flow.instant)
      sys.loadColumn(0, COLS[0]);
      sys.loadColumn(1, COLS[1]);
      return replay;
    }

    function makeWeightTile(spec){
      const g = svgEl('g', { class: 'tile', 'aria-label': `weight ${spec.value}` });
      g.appendChild(svgEl('rect', { width: tileW, height: tileH, rx: 4, class: 'tile-bg' }));
      const t = svgEl('text', { x: tileW / 2, y: tileH / 2 + 8, class: 'tile-letter' });
      t.textContent = String(spec.value); g.appendChild(t);
      svg.appendChild(g);
      return { g, value: spec.value, w: tileW, h: tileH, home: { x: spec.x, y: spec.y }, tx: 0, ty: 0, dropped: false, col: -1 };
    }

    const tiles = TRAY.map(makeWeightTile);
    const setT = (tile, x, y, anim) => {
      tile.g.style.transition = anim ? 'transform .35s cubic-bezier(.22,.9,.24,1)' : 'none';
      tile.g.style.transform = `translate(${x}px,${y}px)`;
      tile.tx = x; tile.ty = y;
    };
    tiles.forEach(t => setT(t, t.home.x, t.home.y, false));

    const cancelHint = flow.hintAfter(15000, `Drag a tile onto the <em>top cell</em> of a column. Left column wants 0 then 3; right column wants 1 then 2.`);

    // per-column parking state: values collected top→bottom until 2 are parked, then commit
    const parked = [[], []];
    const committed = [false, false];
    let done = 0;

    async function commitColumn(c){
      // trickle the two values down the column, single-file (loadColumn expects top→bottom)
      await sys.loadColumn(c, parked[c]);
      // validate this column against the paper matrix; wrong → nudge + return its tiles
      if (parked[c][0] === COLS[c][0] && parked[c][1] === COLS[c][1]){
        committed[c] = true;
        done++;
      } else {
        guide.note(`Match the paper: left column holds <b>0 over 3</b>, right holds <b>1 over 2</b>.`);
        const its = tiles.filter(t => t.col === c);
        parked[c] = [];
        its.forEach(t => { t.dropped = false; t.col = -1; t.g.style.opacity = '1'; setT(t, t.home.x, t.home.y, true); });
      }
    }

    await new Promise(resolve => {
      tiles.forEach(tile => {
        const g = tile.g;
        g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button');
        let drag = null;
        g.addEventListener('pointerdown', e => {
          if (tile.dropped) return;
          e.preventDefault(); g.setPointerCapture(e.pointerId);
          const p = svgPt(svg, e.clientX, e.clientY);
          drag = { ox: p.x - tile.tx, oy: p.y - tile.ty, sx: e.clientX, sy: e.clientY, moved: false };
        });
        g.addEventListener('pointermove', e => {
          if (!drag) return;
          if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) drag.moved = true;
          if (!drag.moved) return;
          const p = svgPt(svg, e.clientX, e.clientY);
          setT(tile, p.x - drag.ox, p.y - drag.oy, false);
        });
        g.addEventListener('pointerup', async e => {
          if (!drag) return;
          const wasDrag = drag.moved; drag = null;
          if (!wasDrag){ setT(tile, tile.home.x, tile.home.y, true); return; }
          const cx = tile.tx + tile.w / 2, cy = tile.ty + tile.h / 2;
          // column-gated: only the TOP cell of an uncommitted, not-full column accepts a drop
          let hit = -1;
          for (let c = 0; c < 2; c++){
            if (committed[c] || parked[c].length >= 2) continue;
            if (Math.abs(cx - colTopX(c)) < 60 && Math.abs(cy - colTopY) < 50){ hit = c; break; }
          }
          if (hit < 0){ setT(tile, tile.home.x, tile.home.y, true); return; }
          // accept: this value joins the column top→bottom, tile vanishes into the feed
          tile.dropped = true; tile.col = hit;
          parked[hit].push(tile.value);
          setT(tile, colTopX(hit) - tile.w / 2, 76, false);
          tile.g.style.opacity = '0';
          SFX.dope();
          if (parked[hit].length === 2) await commitColumn(hit);
          if (done === 2) resolve();
        });
      });
    });

    cancelHint();
    return true;
  });

  guide.note(`Loaded. The weights sit in their shelves now — and they will not move again for a million ticks.`);
  await guide.next();

  /* ---------- Interaction 2 — pulse the data through ---------- */
  guide.say(`Now the payoff. The weights are still; only the data moves. A <b>dot product</b> is what one column computes: multiply each data value by the weight parked in its cell, and add the products into a running sum. Pulse a vector — a short list of numbers — down through the columns, and each cell multiplies by its parked weight and adds onto the sum that keeps falling. Watch how <em>little</em> crosses the border.`);

  const chipCross = makeChip(controls, `numbers that crossed the border: <b>0</b>`);
  const chipOld = makeChip(controls, `the old way: <b>0 fetches</b>`, 'warm');
  let crossed = 0, oldWay = 0;
  const bumpCounters = () => {
    crossed += 4;                 // 2 in + 2 out per pulse
    oldWay += 12;                 // the mux would refetch every weight every tick
    chipCross.set(`numbers that crossed the border: <b>${crossed}</b>`);
    chipOld.set(`the old way: <b>${oldWay} fetches</b>`);
  };

  // Pulse [3,7] → col0 = 0·3+3·7 = 21, col1 = 1·3+2·7 = 17
  await guide.button('Pulse the vector [3, 7] through ▸');
  await flow.ask(async replay => {
    if (replay !== undefined){ sys.pulse([3, 7]); bumpCounters(); return replay; }
    await sys.pulse([3, 7]);
    bumpCounters();
    return true;
  });

  guide.say(`<b>21 and 17.</b> Check them on paper: the left column held 0 over 3, and the falling sum picked up 0·3 + 3·7 = <b>21</b>. The right column held 1 over 2: 1·3 + 2·7 = <b>17</b>. Each column computed the dot product of your vector with one column of the parked matrix — the array just performed a <b>matrix-vector multiply</b>, and only <b>2 numbers in, 2 out</b> crossed the expensive border to do it. The mux would have re-fetched every weight, every tick. Run it again — the weights never move.`);

  // two more pulses back-to-back to prove reuse: [1,5] then [2,4]
  await guide.button('Pulse [1, 5] then [2, 4] ▸');
  await flow.ask(async replay => {
    if (replay !== undefined){ sys.pulse([2, 4]); bumpCounters(); bumpCounters(); return replay; }
    await sys.pulse([1, 5]);
    bumpCounters();
    await sleep(200);
    await sys.pulse([2, 4]);
    bumpCounters();
    return true;
  });

  guide.aha(`Four engines of compute for two values of traffic. The ratio is the point: grow the square to 128 × 128 and you get <b>16,384 multiplies per tick</b> for only <b>256 values</b> in and out — compute grows with the area, traffic only with the edge. The weights sit still while the data pulses through in beats, which is why its inventors named it after the heartbeat: a <b>systolic array</b>. Inside every Tensor Core and every TPU, this is the machine that runs the matrix math.`,
    `That's the real anatomy of an AI chip: systolic squares for the matrix work, plus a few flexible lanes for everything else.`);

  // the leitmotif stamp — first of three appearances (§4.6)
  makeMotto(svg);

  await guide.next();
}
