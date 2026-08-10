// ACT 4 · STEP 1 — "Eight adders at once".
// Rebuilt to the micro-learning contract in DESIGN_MAKEOVER.md §2 / §5: one card at a
// time (guide.cards), every card focuses and names the one thing it is about, "lane" is
// derived from the player's own Act 2 datapath before the word is ever used, and both
// structural jumps (one adder → eight, eight → one lane → sixteen) are watched, not cut to.
import { sleep, waitFor, el, svgEl } from '../../engine/util.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeLaneGrid } from '../../engine/lanes.js';

const A = [3, 7, 2, 8, 4, 6, 1, 5];
const B = [4, 1, 6, 3, 5, 2, 8, 2];
const SUM = A.map((a, i) => a + B[i]);

const COL_X = 96, COL_W = 58, COL_STEP = 66;      // eight columns, 96 → 616
const ROW = { a: 64, b: 102, add: 158, sum: 236 };
const colBox = i => ({ x: COL_X + i * COL_STEP, y: ROW.add, w: COL_W, h: 44 });

/* short arrow: a line plus a drawn head, so the stage needs no <defs> */
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

function box(parent, x, y, w, h, label, caption){
  const g = svgEl('g');
  g.appendChild(svgEl('rect', { x, y, width: w, height: h, rx: 5, class: 'tile-bg' }));
  const t = svgEl('text', { x: x + w / 2, y: y + h / 2 + (caption ? -2 : 5), class: 'gate-lbl' });
  t.textContent = label;
  g.appendChild(t);
  if (caption){
    const c = svgEl('text', { x: x + w / 2, y: y + h / 2 + 15, class: 'lbl-faint' });
    c.textContent = caption;
    g.appendChild(c);
  }
  parent.appendChild(g);
  return g;
}

async function fadeOut(nodes, dur = 300){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(1 - p); }));
  list.forEach(n => { n.style.display = 'none'; });
}
async function fadeIn(nodes, dur = 300){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  list.forEach(n => { n.style.opacity = '0'; });
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(p); }));
}

export async function step1(){
  guide.title('STEP 1 / 6 · NANOVOLT GRAPHICS', 'Eight adders <em>at once</em>');
  guide.cards();

  const stage = newStage('15', 'One adder, then eight, then sixteen lanes');
  const { svg, controls } = stage;

  /* ============ SCENE A — start from the machine the player already built ========== */

  const actTwo = svgEl('g');
  svg.appendChild(actTwo);
  box(actTwo, 60, 160, 104, 54, 'REGISTER', 'holds a number');
  box(actTwo, 214, 160, 104, 54, 'ADDER', 'adds');
  const loop = svgEl('g');
  loop.innerHTML = `
    <path d="M164 187 H214" class="wire"/>
    <path d="M318 187 H360 V330 H26 V187 H60" class="wire"/>
    <path d="M112 250 V214" class="wire dim" stroke-dasharray="4 4"/>`;
  actTwo.appendChild(loop);
  const clockBox = box(actTwo, 62, 250, 100, 34, 'CLOCK');

  guide.say(`This is the machine you built in Act 2. A <b>register</b> holds a number, an
    <b>adder</b> adds to it, and the answer goes back to the register.`);
  stage.focus(actTwo, { label: 'your act 2 machine', at: 'right' });
  await guide.next();

  guide.say(`The clock keeps time. <b>One cycle is one beat:</b> every part moves once,
    then waits for the next beat.`);
  stage.focus(clockBox, { label: 'clock', at: 'bottom' });
  await guide.next();

  stage.clearFocus();
  const arrowG = arrow(svg, 392, 245, 452, 245);
  const oneAdder = box(svg, 480, 215, 130, 60, 'ADDER', 'one sum per cycle');
  await fadeIn([arrowG, oneAdder], 340);

  guide.say(`Keep only the part that does the arithmetic. One adder, one sum per cycle.
    This is the piece we are going to copy.`);
  stage.focus(oneAdder, { label: 'one adder', at: 'top' });
  await guide.next();

  /* ============ SCENE B — the job, then one adder against eight ==================== */

  /* The Act 2 machine goes, and the surviving adder travels down into the first
     column — it has to leave 480,215 before the lists are drawn, because the
     answer row runs straight through that spot. */
  stage.clearFocus();
  await fadeOut([actTwo, arrowG]);

  const adders = [];
  const adderG = svgEl('g');
  svg.appendChild(adderG);
  const mkAdder = i => {
    const b = colBox(i);
    const g = svgEl('g');
    const r = svgEl('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 4, class: 'tile-bg' });
    const t = svgEl('text', { x: b.x + b.w / 2, y: b.y + 29, class: 'gate-lbl' });
    t.textContent = '+';
    g.append(r, t);
    adderG.appendChild(g);
    const a = { g, r, i };
    adders[i] = a;
    return a;
  };

  const a0 = mkAdder(0);
  a0.g.style.opacity = '0';
  await Promise.all([
    stage.packInto([oneAdder], colBox(0), { scale: 0.45, dur: 520 }),
    Anim.tween(520, p => { a0.g.style.opacity = String(Math.max(0, (p - .55) / .45)); }),
  ]);
  a0.g.style.opacity = '1';

  const job = svgEl('g');
  svg.appendChild(job);
  const rowLabel = (y, s) => {
    const t = svgEl('text', { x: COL_X - 12, y: y + 21, class: 'lbl-strong', 'text-anchor': 'end' });
    t.textContent = s;
    job.appendChild(t);
  };
  rowLabel(ROW.a, 'LIST A'); rowLabel(ROW.b, 'LIST B'); rowLabel(ROW.sum, 'A + B');
  const sumCells = [];
  for (let i = 0; i < 8; i++){
    const x = COL_X + i * COL_STEP;
    const cell = (y, txt, cls) => {
      const r = svgEl('rect', { x, y, width: COL_W, height: 30, rx: 3, class: cls });
      const t = svgEl('text', { x: x + COL_W / 2, y: y + 21, class: 'bit-t' });
      t.textContent = txt;
      job.append(r, t);
      return { r, t };
    };
    cell(ROW.a, A[i], 'bit-cell');
    cell(ROW.b, B[i], 'bit-cell');
    sumCells.push(cell(ROW.sum, '', 'slot'));
  }
  const fillSum = i => {
    const c = sumCells[i];
    if (!c) return;
    c.t.textContent = SUM[i];
    c.r.setAttribute('class', 'bit-cell hi');
    c.t.classList.add('hi');
  };
  const clearSums = () => sumCells.forEach(c => {
    c.t.textContent = ''; c.t.classList.remove('hi'); c.r.setAttribute('class', 'slot');
  });

  await fadeIn([job], 340);

  guide.say(`Here is the job. Two lists of eight numbers, added pair by pair.`);
  // no ring here: the adder already sits between the input rows and the answer
  // row, and a box drawn round the job would enclose it while it is dimmed
  stage.focus(job, { label: '8 pairs to add', at: 'bottom', ring: false });
  await guide.next();

  guide.say(`Predict before you run it. How many cycles does <b>one</b> adder need for all
    eight pairs, and how many do <b>eight</b> adders need?`);
  stage.clearFocus();
  const guess = await guide.choose([
    { label: '8 cycles, then 1 cycle', value: 'right', hint: 'one adder does one pair per cycle' },
    { label: '8 cycles, then 8 cycles', value: 'both8' },
    { label: '1 cycle, then 1 cycle', value: 'both1' },
  ]);
  guide.note(guess === 'right'
    ? `Right. Run it and watch.`
    : `One adder does one pair per cycle, so eight pairs take eight cycles. Eight adders
       each take one pair at the same moment, so the row lands in one cycle.`);
  await guide.next();

  const counter = svgEl('text', { x: 360, y: 300, class: 'lbl-strong' });
  counter.textContent = 'CYCLES USED: 0';
  svg.appendChild(counter);
  const tally = svgEl('g');
  svg.appendChild(tally);
  const tallyLine = (y, s) => {
    const t = svgEl('text', { x: 360, y, class: 'lbl' });
    t.textContent = s; t.style.opacity = '0';
    tally.appendChild(t);
    return t;
  };
  const tallySerial = tallyLine(348, 'ONE ADDER · 8 CYCLES');
  const tallyPar = tallyLine(372, 'EIGHT ADDERS · 1 CYCLE');

  guide.say(`You have one adder. Each press runs one cycle: it adds the pair above it,
    then moves to the next column.`);

  const oneBtn = el('button', { class: 'btn primary', 'data-label': 'add-next-pair' }, 'ADD NEXT PAIR');
  const allBtn = el('button', { class: 'btn primary', 'data-label': 'all-eight-at-once' }, 'ALL EIGHT AT ONCE');
  allBtn.disabled = true;
  controls.append(oneBtn, allBtn);

  const stampRest = () => {
    for (let i = 1; i < 8; i++) if (!adders[i]) mkAdder(i);
  };
  const settleRace = () => {
    stampRest();
    a0.g.setAttribute('transform', 'translate(0 0)');
    clearSums();
    for (let i = 0; i < 8; i++){ fillSum(i); adders[i].r.classList.add('on'); }
    counter.textContent = 'CYCLES USED: 1';
    tallySerial.style.opacity = '1'; tallyPar.style.opacity = '1';
    [oneBtn, allBtn].forEach(b => { b.disabled = true; b.classList.add('used'); });
  };

  await flow.ask(async replay => {
    if (replay !== undefined){ settleRace(); return replay; }
    let n = 0, serialDone = false, parallelDone = false, busy = false;

    oneBtn.addEventListener('click', async () => {
      if (n >= 8 || busy) return;
      busy = true;
      SFX.click();
      if (n > 0){
        await Anim.tween(180, p => {
          a0.g.setAttribute('transform', `translate(${((n - 1) + p) * COL_STEP} 0)`);
        });
      }
      a0.r.classList.add('on');
      fillSum(n);
      n++;
      counter.textContent = `CYCLES USED: ${n}`;
      busy = false;
      if (n >= 8){
        serialDone = true;
        tallySerial.style.opacity = '1';
        oneBtn.disabled = true; oneBtn.classList.add('used');
        allBtn.disabled = false;
        guide.say(`Eight cycles for eight pairs. Now stamp seven more copies of the same
          adder and give each one its own pair.`);
      }
    });

    allBtn.addEventListener('click', async () => {
      if (parallelDone || !serialDone) return;
      SFX.click();
      allBtn.disabled = true; allBtn.classList.add('used');
      clearSums();
      counter.textContent = 'CYCLES USED: 0';
      a0.r.classList.remove('on');
      // the one adder returns home, then six siblings print in beside it
      await Anim.tween(240, p => {
        a0.g.setAttribute('transform', `translate(${7 * (1 - p) * COL_STEP} 0)`);
      });
      stampRest();
      const fresh = adders.slice(1).map(a => a.g);
      await fadeIn(fresh, 320);
      await sleep(140);
      adders.forEach(a => a.r.classList.add('on'));
      for (let i = 0; i < 8; i++) fillSum(i);
      counter.textContent = 'CYCLES USED: 1';
      tallyPar.style.opacity = '1';
      SFX.success();
      parallelDone = true;
    });

    await waitFor(() => serialDone && parallelDone, { hold: 320 });
    return true;
  });

  guide.say(`Eight cycles, then one. The same work, done by copies instead of by one part
    working faster.`);
  stage.focus(tally, { ring: true });
  await guide.next();

  /* ============ SCENE C — eight adders become one lane, then sixteen =============== */

  stage.clearFocus();
  controls.innerHTML = '';        // the race buttons are spent; clear the bench
  await fadeOut([job, counter, tally], 260);
  await stage.packInto(adders.map(a => a.g), { x: 327, y: 207, w: 66, h: 66 });

  const laneTile = svgEl('g');
  laneTile.append(
    svgEl('rect', { x: 327, y: 207, width: 66, height: 66, rx: 4, class: 'lane' }),
    svgEl('circle', { cx: 382, cy: 218, r: 4, class: 'lane-lamp' }),
  );
  const lanePlus = svgEl('text', { x: 360, y: 246, class: 'gate-lbl' });
  lanePlus.textContent = '+';
  laneTile.appendChild(lanePlus);
  svg.appendChild(laneTile);
  await fadeIn([laneTile], 300);

  guide.say(`Pack one adder together with the numbers it works on and you get a
    <b>lane</b>. A lane is your adder, copied, holding its own pair.`);
  stage.focus(laneTile, { label: 'lane = one adder + its own numbers', at: 'bottom' });
  await guide.next();

  /* the lane travels to the first grid slot, the other fifteen print in behind it */
  stage.clearFocus();
  const GX = 216, GY = 120, CELL = 66, GAP = 8, GW = 4 * CELL + 3 * GAP;
  const grid = makeLaneGrid(svg, { x: GX, y: GY, cols: 4, rows: 4, cell: CELL, gap: GAP });
  grid.lanes.forEach(l => [l.rect, l.lamp, l.val].forEach(n => { n.style.opacity = '0'; }));

  await Anim.tween(420, p => {
    laneTile.setAttribute('transform', `translate(${(GX - 327) * p} ${(GY - 207) * p})`);
  });
  laneTile.style.display = 'none';
  const show = i => [grid.lanes[i].rect, grid.lanes[i].lamp, grid.lanes[i].val]
    .forEach(n => { n.style.opacity = '1'; });
  show(0);
  for (let i = 1; i < 16; i++){
    show(i);
    if (!flow.instant){ SFX.click(); await sleep(48); }
  }

  guide.say(`Sixteen lanes on one chip. They fit because a lane cannot choose its own job.
    It only ever does what it is told.`);
  stage.focus(grid.g, { label: '16 lanes', at: 'bottom' });
  await guide.next();

  stage.clearFocus();
  const rail = svgEl('g');
  const chip = svgEl('g');
  chip.appendChild(svgEl('rect', { x: GX, y: 74, width: 74, height: 26, rx: 4, class: 'tile-bg on' }));
  const chipT = svgEl('text', { x: GX + 37, y: 92, class: 'gate-lbl' });
  chipT.textContent = 'ADD';
  chip.appendChild(chipT);
  rail.appendChild(svgEl('path', { d: `M${GX} 108 H${GX + GW}`, class: 'wire dim' }));
  rail.appendChild(chip);
  svg.appendChild(rail);
  await fadeIn([rail], 300);

  guide.say(`One order travels along this rail and reaches every lane at the same moment.`);
  stage.focus(rail, { label: 'one instruction, sent to all 16', at: 'top' });

  const OPS_A = [3, 7, 2, 8, 4, 6, 1, 5, 9, 2, 7, 3, 6, 4, 8, 1];
  const OPS_B = [4, 1, 6, 3, 5, 2, 8, 2, 1, 7, 4, 9, 2, 6, 3, 5];
  const SUMS = OPS_A.map((a, i) => a + OPS_B[i]);

  await guide.button('Send ADD to all sixteen ▸');
  stage.clearFocus();

  if (flow.instant){
    grid.flashAll(true);
    SUMS.forEach((v, i) => grid.setValue(i, v));
    chip.setAttribute('transform', `translate(${GW - 74} 0)`);
  } else {
    for (let c = 0; c < 4; c++){
      chip.style.transition = 'transform 120ms';
      chip.setAttribute('transform', `translate(${c * (CELL + GAP)} 0)`);
      for (let r = 0; r < 4; r++){
        const i = r * 4 + c;
        grid.setActive(i, true);
        grid.setValue(i, SUMS[i]);
      }
      SFX.blip();
      await sleep(110);
    }
    chip.setAttribute('transform', `translate(${GW - 74} 0)`);
    SFX.success();
  }

  guide.aha(`Sixteen answers in one cycle. One order, sixteen lanes, sixteen different
    pairs of numbers.`,
    `That is the whole trick of a GPU. The rest of this act makes each lane better at the one sum it does.`);
  await guide.next();
}
