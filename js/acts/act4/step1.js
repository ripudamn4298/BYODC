// ACT 4 · STEP 1 — "The marching band" (race: one worker vs eight).
// Bridge from Act 2: the datapath adds one pair at a time — brilliant, but hand it a
// LIST and it plods. Test predicts cycle counts BEFORE the race runs (guide.choose).
// Per DESIGN.md §5b spirit + HANDOFF §5 ACT4 STEP1.
import { sleep, waitFor, el, svgEl } from '../../engine/util.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeRaceTrack, makeLaneGrid } from '../../engine/lanes.js';

/* the actual job, drawn: two lists of 8, and a SUM row that fills in as it's computed */
function drawSumLists(svg){
  const A = [3, 7, 2, 8, 4, 6, 1, 5], B = [4, 1, 6, 3, 5, 2, 8, 2];
  const SUM = A.map((a, i) => a + B[i]);
  const x0 = 118, cw = 52, gap = 8, step = cw + gap;
  const rowY = { a: 84, b: 128, sum: 186 };
  const cells = { sum: [] };
  const mk = (x, y, txt, cls) => {
    const r = svgEl('rect', { x, y, width: cw, height: 32, rx: 3, class: cls });
    const t = svgEl('text', { x: x + cw / 2, y: y + 21, class: 'bit-t' }); t.textContent = txt;
    svg.append(r, t); return { r, t };
  };
  const lbl = (y, s) => { const t = svgEl('text', { x: x0 - 14, y: y + 21, class: 'lbl-strong', 'text-anchor': 'end' }); t.textContent = s; svg.appendChild(t); };
  lbl(rowY.a, 'LIST A'); lbl(rowY.b, 'LIST B'); lbl(rowY.sum, 'A + B');
  for (let i = 0; i < 8; i++){
    const x = x0 + i * step;
    mk(x, rowY.a, A[i], 'bit-cell'); mk(x, rowY.b, B[i], 'bit-cell');
    cells.sum.push(mk(x, rowY.sum, '', 'slot'));
  }
  svg.appendChild(svgEl('line', { x1: x0 - 4, y1: rowY.sum - 9, x2: x0 + 8 * step - gap + 4, y2: rowY.sum - 9, class: 'wire' }));
  return {
    fillSum(i){ const c = cells.sum[i]; if (!c || c.t.textContent) return; c.t.textContent = SUM[i]; c.r.setAttribute('class', 'bit-cell hi'); c.t.classList.add('hi'); },
    fillAll(){ for (let i = 0; i < 8; i++) this.fillSum(i); },
    reset(){ cells.sum.forEach(c => { c.t.textContent = ''; c.t.classList.remove('hi'); c.r.setAttribute('class', 'slot'); }); },
  };
}

export async function step1(){
  guide.title('STEP 1 / 5 · NANOVOLT GRAPHICS', 'The <em>marching band</em>');

  guide.say(`Two terms first. A <b>datapath</b> is one worker that does one operation — the register-plus-adder-plus-clock you built in Act 2 is a datapath that adds one pair of numbers per clock tick. A <b>list</b> is just many numbers to run that operation on. The aim of this step: see why one fast datapath is the wrong shape for a list, and what to build instead. Start with the problem. Hand your Act-2 machine two lists of eight numbers to add, pair by pair, and it does the only thing it can: <em>one pair per tick, eight ticks in a row.</em>`);
  await guide.next();

  const { svg, controls } = newStage('13', 'Serial vs parallel race: adding two lists of 8');
  const lists = drawSumLists(svg);

  guide.say(`Here's the job on the bench: <b>List A</b> plus <b>List B</b>, eight pairs, eight sums to drop into the bottom row. A <b>clock tick</b> is one beat of the machine, and one datapath finishes one pair per tick. Before we run it, predict: if a single adder does one pair per tick, and a crowd of eight adders each takes one pair, how many ticks does each need?`);

  const guess = await guide.choose([
    { label: '8 ticks, then 1 tick (recommended)', value: 'right', hint: 'one worker plods through the list; eight workers each grab one item and go' },
    { label: '8 ticks, then 8 ticks', value: 'both8', hint: 'would the crowd really need to repeat itself?' },
    { label: '1 tick, then 1 tick', value: 'both1', hint: 'can one adder really finish eight sums in a single tick?' },
  ]);

  if (guess !== 'right'){
    guide.note(`Not quite — but a fair guess. One worker really does need <b>one tick per item</b>: 8 items, 8 ticks. A crowd of <b>eight</b> workers can each grab one item <em>at the same time</em> — so the whole list finishes in <b>one</b> tick. Watch it happen.`);
  } else {
    guide.note(`Exactly right. Watch it happen.`);
  }
  await guide.next();

  /* ---------- the race ---------- */
  guide.say(`Now race two ways of filling that <b>A + B</b> row. <em>Tick the clock</em> means advance the single worker one tick: it computes one sum per press — watch a cell fill each time, left to right. After a few, hit <b>auto-finish</b> to run the rest. Then <b>fire all eight</b>: eight workers, one per column, and the whole row lands in a single beat.`);

  const track = makeRaceTrack(svg, { x: 118, y: 288, w: 484, gap: 70 });

  const tickBtn = el('button', { class: 'btn primary', 'data-label': 'tick-serial' }, 'TICK THE CLOCK ▸');
  const autoBtn = el('button', { class: 'btn ghost', 'data-label': 'auto-finish' }, 'AUTO-FINISH ▸');
  const paraBtn = el('button', { class: 'btn primary', 'data-label': 'fire-all-eight' }, 'FIRE ALL EIGHT ▸');
  paraBtn.disabled = true;
  controls.append(tickBtn, autoBtn, paraBtn);

  await flow.ask(async replay => {
    if (replay !== undefined){
      lists.fillAll();
      track.set('serial', 1, 'cycle 8/8');
      track.set('parallel', 1, '1 cycle');
      tickBtn.disabled = true; autoBtn.disabled = true; paraBtn.disabled = true;
      tickBtn.classList.add('used'); autoBtn.classList.add('used'); paraBtn.classList.add('used');
      return replay;
    }

    let serialTicks = 0;
    let serialDone = false, parallelDone = false;

    function stepSerial(){
      if (serialTicks >= 8) return;
      serialTicks++;
      track.set('serial', serialTicks / 8, `cycle ${serialTicks}/8`);
      lists.fillSum(serialTicks - 1);
      SFX.blip();
      if (serialTicks >= 8){
        serialDone = true;
        tickBtn.disabled = true; autoBtn.disabled = true;
        paraBtn.disabled = false;
      }
    }
    tickBtn.addEventListener('click', () => { SFX.click(); stepSerial(); });
    autoBtn.addEventListener('click', async () => {
      SFX.click(); autoBtn.disabled = true; tickBtn.disabled = true;
      while (serialTicks < 8){ stepSerial(); await sleep(160); }
    });
    paraBtn.addEventListener('click', async () => {
      if (parallelDone) return;
      SFX.click(); paraBtn.disabled = true;
      lists.reset();          // wipe the slow serial result…
      lists.fillAll();        // …and land all eight sums in one beat
      track.set('parallel', 1, '1 cycle');
      SFX.success();
      parallelDone = true;
    });

    await waitFor(() => serialDone && parallelDone, { hold: 300 });
    return true;
  });

  guide.note(`<b>Eight ticks. Then one.</b> Same job, same total work — but the eight workers finished while the single worker was still on the first item. Many simple workers running at once beat one fast worker every time.`);
  await guide.next();

  /* ---------- stamp the lane: eight workers become sixteen permanent lanes ---------- */
  guide.say(`Two more terms. A <b>lane</b> is one simple worker — a single datapath that does one operation. To <b>stamp</b> means to copy one finished block many times, side by side, the way a fab prints the same design across a wafer (Act 3). The aim now: stamp sixteen permanent lanes into silicon, all wired to one shared instruction, so a single order runs on every lane at once. Press to lay them down.`);

  await guide.button('Stamp 16 lanes ▸');

  // clear the bench: fade out the race visuals so the lane grid gets a clean stage.
  const prior = Array.from(svg.childNodes);
  if (flow.instant){
    prior.forEach(n => n.style && (n.style.display = 'none'));
  } else {
    prior.forEach(n => { if (n.style){ n.style.transition = 'opacity 220ms'; n.style.opacity = '0'; } });
    await sleep(240);
    prior.forEach(n => n.style && (n.style.display = 'none'));
  }

  const grid = makeLaneGrid(svg, { x: 194, y: 96, cols: 4, rows: 4, cell: 66, gap: 8 });
  grid.g.querySelectorAll('rect, circle, text').forEach(n => n.style.opacity = '0');

  async function stampRow(r){
    for (let c = 0; c < 4; c++){
      const l = grid.lanes[r * 4 + c];
      [l.rect, l.lamp, l.val].forEach(n => { n.style.transition = 'opacity 140ms'; n.style.opacity = '1'; });
    }
  }
  if (flow.instant){
    grid.g.querySelectorAll('rect, circle, text').forEach(n => n.style.opacity = '1');
  } else {
    for (let r = 0; r < 4; r++){ await stampRow(r); SFX.click(); await sleep(70); }
  }

  /* ---------- one broadcast: an ADD instruction sweeps the top, all 16 lanes fire in lockstep ---------- */
  // fixed, deterministic operands — every lane adds a DIFFERENT pair, but the SAME operation.
  const OPS_A = [3, 7, 2, 8, 4, 6, 1, 5, 9, 2, 7, 3, 6, 4, 8, 1];
  const OPS_B = [4, 1, 6, 3, 5, 2, 8, 2, 1, 7, 4, 9, 2, 6, 3, 5];
  const SUMS = OPS_A.map((a, i) => a + OPS_B[i]);

  const gx = 194, gy = 96, cell = 66, gap = 8, gw = 4 * cell + 3 * gap;
  const chipG = svgEl('g');
  const chipY = gy - 34;
  const chipBox = svgEl('rect', { x: gx, y: chipY - 16, width: 74, height: 26, rx: 4, class: 'lane hi' });
  const chipTxt = svgEl('text', { x: gx + 37, y: chipY + 2, class: 'lane-val' }); chipTxt.textContent = 'ADD';
  chipG.append(chipBox, chipTxt);
  svg.appendChild(chipG);

  guide.say(`How to read the grid: it is sixteen lanes, and <b>each lane holds a different pair of numbers</b> from the list. <b>The number printed on each tile is that lane's result — the sum of its own pair.</b> So the tiles all read differently, and that difference is the whole point: every lane runs the <em>same</em> operation (ADD) at the <em>same</em> time on <em>different</em> data. An <b>instruction</b> is the shared order telling every lane what operation to do. To <b>sweep the rail</b> means that one instruction reaches every lane at once, along the wire across the top. Set the instruction to <b>ADD</b> and broadcast it: every lane hears the same order at the same moment and fires on its own pair.`);

  await guide.button('Broadcast ADD ▸');

  function landAll(){
    grid.flashAll(true);
    for (let i = 0; i < 16; i++) grid.setValue(i, SUMS[i]);
    chipG.setAttribute('transform', `translate(${gw - 74}, 0)`);
  }
  if (flow.instant){
    landAll();
  } else {
    // instruction chip glides across the rail; every lane flashes the SAME op on DIFFERENT numbers
    for (let c = 0; c < 4; c++){
      const dx = c * (cell + gap);
      chipG.style.transition = 'transform 120ms'; chipG.setAttribute('transform', `translate(${dx}, 0)`);
      for (let r = 0; r < 4; r++){
        const i = r * 4 + c;
        grid.setActive(i, true);
        grid.setValue(i, SUMS[i]);
      }
      SFX.blip();
      await sleep(110);
    }
    chipG.setAttribute('transform', `translate(${gw - 74}, 0)`);
    SFX.success();
  }

  guide.note(`All sixteen sums landed together, on one order. Running every lane off one shared instruction, in the same tick, is called <b>lockstep</b>. <span class="mono">one instruction · sixteen lanes · lockstep</span>`);

  guide.aha(`This is the trade a GPU makes: each lane gives up deciding what to do — one shared instruction decides for all of them — and in exchange, sixteen lanes fit where independent processors never could. One thing left to check: what operation do these lanes actually run all day? Not list-adding. In AI, almost all of the work is one specific move — <b>multiply two numbers, add the result onto a running total</b>. The next step builds it.`,
    `A games studio called Nanovolt first: pixels are lists too.`);
  await guide.next();
}
