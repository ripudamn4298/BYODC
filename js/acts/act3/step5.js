// ACT 3 · STEP 5 — "Same chip, three prices" (speed binning).
// The second half of the old step 4 ("cut, bond & bin"): the cut-and-bond half is now
// step 4, and this step is the economics. Built to the micro-learning contract in
// DESIGN_MAKEOVER.md §2 / §4: one card at a time (guide.cards), every card focuses and
// names the one thing it is about, and "speed test", "rating" and "bin" are each defined
// before they are used in an instruction.
//
// Colour is semantic per DESIGN.md §1a: blue for a live signal (a passing answer, the
// pass lamp), red for something broken (the wrong answer, the fail lamp), amber for cost
// (the three price tags). The gate-width difference between the two magnified dies is
// carried by ink weight, not by a colour, because "slightly different" is not one of the
// meanings any colour is allowed to have.
//
// Determinism: the six speed readings come from mulberry32 seeded with a constant that is
// recorded through flow.ask (the answer of the "run the test" card), so a replay
// regenerates exactly the same six numbers. Every animation runs on Anim.tween or sleep,
// both replay-aware; no bare setTimeout loop, no Math.random, no Date.now.
import { el, svgEl, slug, sleep } from '../../engine/util.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { cornerTicks, slideInPanel } from '../../engine/components.js';
import { handlerHTML, harvestHTML, placeHead } from './lab.js';
import { mulberry32 } from '../../engine/fab.js';

/* ---------- geometry, in the stage's 720×480 user units ---------- */
const CHIP = { w: 64, h: 64, y: 372, x0: 60, step: 100 };
const chipHome = i => ({ x: CHIP.x0 + i * CHIP.step, y: CHIP.y });

const DIE_A = { x: 150, y: 104, w: 150, h: 150 };
const DIE_B = { x: 420, y: 104, w: 150, h: 150 };

const TEST = { x: 206, y: 84, w: 308, h: 176 };
const SOCKET = { x: 226, y: 124, w: 76, h: 76 };

const BIN_Y = 92, BIN_H = 130;
const BINS = [
  { id: 'FAST', label: 'FAST', x: 88, w: 148, range: '4.5 GHZ AND UP', price: '$600' },
  { id: 'TYPICAL', label: 'TYPICAL', x: 286, w: 148, range: '3.0 TO 4.5 GHZ', price: '$400' },
  { id: 'SLOW', label: 'SLOW', x: 484, w: 148, range: 'UNDER 3.0 GHZ', price: '$200' },
];

/* The clock climbs from here in 0.1 GHz notches until the chip drops an answer. */
const CLOCK_START = 2.0;
const NOTCH = 0.1;

/* One constant, recorded through flow.ask so a replay reproduces the same six chips.
   Never Math.random or Date.now: a live run and its replay must agree digit for digit. */
const SEED = 20260809;

const binFor = v => (v >= 4.5 ? 'FAST' : v >= 3.0 ? 'TYPICAL' : 'SLOW');

/* Six ratings between 2.4 and 5.2 GHz, two per bin, no ties and nothing sitting on a
   threshold. Deterministic in the seed: same seed, same six numbers, same order. */
function ratings(seed){
  const rng = mulberry32(seed);
  for (let attempt = 0; attempt < 400; attempt++){
    const v = [];
    for (let i = 0; i < 6; i++) v.push(Math.round((2.4 + rng() * 2.8) * 10) / 10);
    const counts = { FAST: 0, TYPICAL: 0, SLOW: 0 };
    v.forEach(x => counts[binFor(x)]++);
    const clean = v.every(x => Math.abs(x - 4.5) > 0.05 && Math.abs(x - 3.0) > 0.05);
    if (clean && new Set(v).size === 6 && counts.FAST === 2 && counts.TYPICAL === 2 && counts.SLOW === 2) return v;
  }
  return [5.1, 2.8, 3.5, 2.7, 4.6, 4.0];      // unreachable for the seed above
}

async function fadeIn(nodes, dur = 320){
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

/* guide.button, but the recorded answer is a value of our choosing instead of `true`.
   The seed rides on the card the player presses to start the test, so the step keeps
   exactly one recorded answer per card and Back still lands on card boundaries. */
function askButton(label, value){
  const b = el('button', { class: 'btn primary', 'data-label': slug(label) }, label);
  const row = guide.beat(el('div', { class: 'btn-row' }), 'actions');
  row.appendChild(b);
  return flow.ask(replay => {
    if (replay !== undefined){ b.disabled = true; b.classList.add('used'); return replay; }
    return new Promise(res => b.addEventListener('click', () => {
      SFX.click(); b.disabled = true; b.classList.add('used'); res(value);
    }));
  });
}

export async function step5(){
  guide.title('STEP 5 / 5', 'Why does the same chip <em>sell at three prices?</em>');
  guide.cards();

  const stage = newStage('14', 'Six packaged chips, a speed tester, and three bins');
  const { svg } = stage;
  cornerTicks(svg, 40, 40, 640, 400, 8);

  /* ======================= the tray of six packaged chips ======================= */

  const chipLayer = svgEl('g');
  svg.appendChild(chipLayer);
  const trayLine = svgEl('path', { d: 'M44 452 H648', class: 'wire dim' });
  svg.appendChild(trayLine);

  const chips = [0, 1, 2, 3, 4, 5].map(i => {
    const g = svgEl('g', { class: 'tile', 'aria-label': `chip ${i + 1}, not yet tested` });
    g.innerHTML = `
      <rect width="${CHIP.w}" height="${CHIP.h}" rx="4" class="tile-bg"/>
      <g stroke="var(--hairline-strong)" stroke-width="1">
        <path d="M0 18 H-7 M0 32 H-7 M0 46 H-7 M${CHIP.w} 18 H${CHIP.w + 7}
                 M${CHIP.w} 32 H${CHIP.w + 7} M${CHIP.w} 46 H${CHIP.w + 7}"/>
      </g>
      <text x="${CHIP.w / 2}" y="36" class="gate-lbl" font-size="14">?</text>
      <text x="${CHIP.w / 2}" y="51" class="tile-cap"></text>`;
    chipLayer.appendChild(g);
    const home = chipHome(i);
    const c = {
      g, i, home, x: home.x, y: home.y, rating: null, bin: null,
      val: g.querySelectorAll('text')[0], cap: g.querySelectorAll('text')[1],
    };
    g.setAttribute('transform', `translate(${home.x} ${home.y})`);
    return c;
  });
  const setChipXY = (c, x, y) => { c.x = x; c.y = y; c.g.setAttribute('transform', `translate(${x} ${y})`); };
  /* Anything drawn later paints over the chips, so the tray moves back to the top of the
     stage each time a new layer arrives. Only ever called with nothing focused. */
  const raiseChips = () => svg.appendChild(chipLayer);
  async function moveChip(c, x, y, dur = 420){
    const x0 = c.x, y0 = c.y;
    await Anim.tween(dur, p => setChipXY(c, x0 + (x - x0) * p, y0 + (y - y0) * p));
    setChipXY(c, x, y);
  }
  const stamp = (c, v) => {
    c.rating = v;
    c.val.textContent = v.toFixed(1);
    c.cap.textContent = 'GHZ';
    c.g.setAttribute('aria-label', `chip ${c.i + 1}, rated ${v.toFixed(1)} gigahertz`);
  };

  /* ======================= CARD 1 — where we are ======================= */

  guide.say(`These six packaged chips came off one wafer, printed from the same mask, and
    they do not all run at the same speed. This step measures each one and sorts them.`);
  stage.focus(chipLayer, { label: 'six packaged chips', at: 'top' });
  await guide.next();

  /* ======================= the two magnified dies ======================= */

  const zoomG = svgEl('g');
  svg.appendChild(zoomG);
  const frustum = (die, i) => {
    const h = chipHome(i);
    zoomG.appendChild(svgEl('path', {
      d: `M${die.x} ${die.y + die.h} L${h.x} ${h.y} M${die.x + die.w} ${die.y + die.h} L${h.x + CHIP.w} ${h.y}`,
      class: 'wire dim', 'stroke-dasharray': '3 5',
    }));
  };
  frustum(DIE_A, 0);
  frustum(DIE_B, 5);

  /* REVIEW_NOTES N-037: each panel is ONE transistor from that chip, seen from the side,
     drawn the way Act 1 and Act 3 step 2 drew the NMOS: P-type body, N-type source and
     drain, and the gate (metal on glass) between them. The gate's length, source side to
     drain side, carries a dimension line, and an arrow under it is the electrons' path. */
  const dieBars = [], dims = [], paths = [];
  const dieBox = (die, L) => {
    const g = svgEl('g');
    const cx = die.x + die.w / 2;
    const gx = cx - L / 2;
    g.innerHTML = `
      <rect x="${die.x}" y="${die.y}" width="${die.w}" height="${die.h}" rx="3" class="tile-bg"/>
      <text x="${cx}" y="${die.y - 8}" class="lbl-faint" font-size="9">ONE TRANSISTOR, FROM THE SIDE</text>
      <rect x="${die.x + 10}" y="${die.y + 72}" width="${die.w - 20}" height="66" rx="4" class="p-region"/>
      <rect x="${die.x + 14}" y="${die.y + 72}" width="${gx - die.x - 16}" height="24" rx="3" class="n-region"/>
      <rect x="${gx + L + 2}" y="${die.y + 72}" width="${die.x + die.w - 14 - gx - L - 2}" height="24" rx="3" class="n-region"/>
      <text x="${(die.x + 14 + gx) / 2}" y="${die.y + 88}" class="lbl" font-size="9">SOURCE</text>
      <text x="${(gx + L + die.x + die.w - 14) / 2}" y="${die.y + 88}" class="lbl" font-size="9">DRAIN</text>
      <g class="g-gate">
        <rect x="${gx}" y="${die.y + 50}" width="${L}" height="15" rx="1.5" class="gate-metal"/>
        <rect x="${gx}" y="${die.y + 65}" width="${L}" height="7" class="oxide"/>
      </g>
      <g class="g-dim" stroke="var(--ink)" stroke-width="1">
        <line x1="${gx}" y1="${die.y + 40}" x2="${gx + L}" y2="${die.y + 40}"/>
        <line x1="${gx}" y1="${die.y + 35}" x2="${gx}" y2="${die.y + 46}"/>
        <line x1="${gx + L}" y1="${die.y + 35}" x2="${gx + L}" y2="${die.y + 46}"/>
        <text x="${cx}" y="${die.y + 30}" class="lbl" font-size="9" stroke="none">GATE LENGTH</text>
      </g>
      <g class="g-path">
        <line x1="${gx - 8}" y1="${die.y + 100}" x2="${gx + L + 4}" y2="${die.y + 100}" stroke="var(--blue)" stroke-width="2"/>
        <path d="M${gx + L + 4} ${die.y + 96} l7 4 l-7 4 z" fill="var(--blue)"/>
      </g>`;
    zoomG.appendChild(g);
    dieBars.push(g.querySelector('.g-gate'));
    dims.push(g.querySelector('.g-dim'));
    paths.push(g.querySelector('.g-path'));
    return g;
  };
  const dieA = dieBox(DIE_A, 30);
  const dieB = dieBox(DIE_B, 62);
  zoomG.style.display = 'none';

  stage.clearFocus();
  await fadeIn([zoomG], 380);

  /* ======================= CARD 2 — the same design, twice ======================= */

  guide.say(`Here is one transistor from each of two of these chips, magnified and seen from
    the side. Both were printed from the same part of the same mask.`);
  stage.focus([dieA, dieB], { label: 'the same design, twice', at: 'top' });
  await guide.next();

  /* Course restructure (2026-10-25): the two meanings of "gate" and the gate-length
     definition moved up to step 2 (next to 3.2.7, where the word is first used). This step
     points back to it. The two scale cards (REVIEW_NOTES N-040: make the scale felt, then
     say why it varies) are merged into one. */

  /* ======================= CARD 3 — the narrow one ======================= */

  guide.say(`The gate length from step 2 is only about 15 to 20 nm, fewer than a hundred
    silicon atoms. Even a polished wafer rises and dips by tens of nanometres, which puts some
    fields slightly out of focus. This chip's gates printed a few atoms short, and a short gate
    switches faster.`);
  stage.focus(dieA, { label: 'short gates', at: 'left' });
  await guide.next();

  /* ======================= CARD 5 — the wide one ======================= */

  guide.say(`This one's gates came out long. It is from the same wafer and the same mask,
    but its transistors take longer to switch.`);
  stage.focus(dieB, { label: 'long gates', at: 'right' });
  await guide.next();

  /* why a longer gate is slower: the Act 1 picture of a transistor filling the next plate */
  guide.say(`Why is a longer gate slower? Each transistor's job is to charge or empty the next
    gate's plate, as you saw in Act 1. In a longer gate, electrons have a longer path from
    source to drain, so less current flows and the next plate fills more slowly. A longer gate
    is also a bigger plate, so the transistor before it has more charge to fill. Both make
    each switch take longer.`);
  stage.focus([paths[1], dieBars[1]], { label: 'longer path, bigger plate', at: 'right' });
  await guide.next();

  /* Course restructure (2026-10-25): the process-node card ("3 nm" is a name, not a size)
     moved to step 2, where it is split into two node cards and a Moore's-law card. */

  /* ======================= CARD 6 — the aim ======================= */

  guide.say(`Sealed in their packages, all six look identical. <b>Your goal is to measure
    how fast each chip runs, then sort the six by what you measured.</b>`);
  stage.focus(chipLayer, { label: 'six sealed chips', at: 'top' });
  await guide.next();

  /* ======================= the tester ======================= */

  const testG = svgEl('g');
  svg.appendChild(testG);
  testG.innerHTML = `
    <rect x="${TEST.x}" y="${TEST.y}" width="${TEST.w}" height="${TEST.h}" rx="5" class="tile-bg"/>
    <rect x="${SOCKET.x}" y="${SOCKET.y}" width="${SOCKET.w}" height="${SOCKET.h}" rx="4" class="slot"/>
    <text x="${SOCKET.x + SOCKET.w / 2}" y="${SOCKET.y + SOCKET.h + 18}" class="lbl-faint">CHIP UNDER TEST</text>`;

  const clockG = svgEl('g');
  const clockCap = svgEl('text', { x: 408, y: 140, class: 'lbl-faint' });
  clockCap.textContent = 'CLOCK';
  const clockVal = svgEl('text', { x: 408, y: 168, class: 'gate-lbl', 'font-size': 22 });
  clockG.append(clockCap, clockVal);
  testG.appendChild(clockG);

  const resultG = svgEl('g');
  const sumT = svgEl('text', { x: 408, y: 198, class: 'gate-lbl', 'font-size': 13 });
  sumT.textContent = '7 + 5 = ?';
  const lamp = svgEl('circle', { cx: 372, cy: 220, r: 6, fill: 'none', stroke: 'var(--ink-faint)', 'stroke-width': 1.6 });
  const lampT = svgEl('text', { x: 386, y: 225, class: 'tile-cap' });
  lampT.style.textAnchor = 'start';        // .tile-cap's CSS text-anchor beats the attribute
  lampT.textContent = 'READY';
  resultG.append(sumT, lamp, lampT);
  testG.appendChild(resultG);
  testG.style.display = 'none';

  const setClock = f => { clockVal.textContent = `${f.toFixed(1)} GHZ`; };
  function setResult(state){        // 'pass' | 'fail' | 'idle'
    if (state === 'pass'){
      sumT.textContent = '7 + 5 = 12';
      sumT.style.fill = 'var(--blue)';
      lamp.style.fill = 'var(--blue)'; lamp.style.stroke = 'var(--blue)';
      lampT.textContent = 'PASS'; lampT.style.fill = 'var(--blue)';
    } else if (state === 'fail'){
      sumT.textContent = '7 + 5 = 4';
      sumT.style.fill = 'var(--red)';
      lamp.style.fill = 'var(--red)'; lamp.style.stroke = 'var(--red)';
      lampT.textContent = 'FAIL'; lampT.style.fill = 'var(--red)';
    } else {
      sumT.textContent = '7 + 5 = ?';
      sumT.style.fill = '';
      lamp.style.fill = 'none'; lamp.style.stroke = 'var(--ink-faint)';
      lampT.textContent = 'READY'; lampT.style.fill = '';
    }
  }

  setClock(CLOCK_START);
  setResult('idle');

  stage.clearFocus();
  raiseChips();          // the socketed chip has to sit on top of the tester's panel
  await fadeOut([zoomG], 260);
  await fadeIn([testG], 340);

  /* ======================= CARD 7 — define the tester ======================= */

  guide.say(`The tester holds one chip and feeds it sums it already knows the answers to.
    This one is 7 + 5.`);
  stage.focus(testG, { label: 'speed tester', at: 'bottom' });
  await guide.next();

  /* ======================= CARD 8 — define the clock climb ======================= */

  /* Course restructure (2026-10-25): trimmed from 61 words. The last sentence repeats Act 2
     step 4's own words for the clock, so the failure the tester finds is one already met. */
  guide.say(`The tester starts the clock slowly and raises it one notch, a small fixed step, at
    a time. Each notch shortens every beat, and as in Act 2, if a beat arrives before the sum
    is finished, the register stores a wrong one.`);
  stage.focus(clockG, { label: 'clock speed', at: 'right' });
  await guide.next();

  /* ======================= CARD 9 — define pass and fail ======================= */

  guide.say(`While the answer comes back as 12, the chip passes that notch. If one answer
    comes back wrong, the chip fails that notch.`);
  stage.focus(resultG, { label: 'pass or fail', at: 'right' });
  await guide.next();

  /* ======================= CARD 10 — run the first chip =======================
     The button's recorded answer is the seed, so the six readings a replay generates are
     the six the live run generated. */

  stage.clearFocus();
  await moveChip(chips[0], SOCKET.x + 6, SOCKET.y + 6, 480);
  setClock(CLOCK_START);
  setResult('idle');

  guide.say(`The first chip is in the socket. Raise the clock until the chip can no longer
    finish the sum in time.`);
  stage.focus(chips[0].g, { label: 'chip 1', at: 'left' });
  const seed = await askButton('Run the test ▸', SEED);
  const READ = ratings(seed);

  stage.clearFocus();
  const top = READ[0];
  const span = top + NOTCH - CLOCK_START;
  if (!flow.instant) SFX.flow();
  await Anim.tween(2600, p => {
    const f = CLOCK_START + Math.round((span * p) / NOTCH) * NOTCH;
    setClock(f);
    setResult(f <= top + NOTCH / 2 ? 'pass' : 'fail');
  }, p => p);
  setClock(top + NOTCH);
  setResult('fail');
  if (!flow.instant) SFX.click();
  await sleep(420);

  /* ======================= CARD 11 — read the failure ======================= */

  guide.say(`At ${(top + NOTCH).toFixed(1)} GHz the answer came back 4 instead of 12. The
    carry ran out of time before it reached the top bit.`);
  stage.focus(resultG, { label: 'wrong answer', at: 'right' });
  await guide.next();

  /* ======================= CARD 12 — define the rating ======================= */

  setClock(top);
  setResult('pass');
  stamp(chips[0], top);
  if (!flow.instant) SFX.success();

  guide.say(`So the tester backs off one notch and writes that speed on the chip. Chip 1
    is rated ${top.toFixed(1)} GHz, the last clock speed at which it got the sum right.`);
  stage.focus(clockG, { label: 'rating', at: 'right' });
  await guide.next();

  /* ======================= CARD 13 — the other five ======================= */

  stage.clearFocus();
  await moveChip(chips[0], chips[0].home.x, chips[0].home.y, 420);
  setClock(CLOCK_START);
  setResult('idle');

  guide.say(`Now the other five go through the same test: the same sum, the same climb up
    the clock, and one rating each.`);
  stage.focus(chipLayer, { label: 'five left to test', at: 'top' });
  await guide.button('Test the other five ▸');

  stage.clearFocus();
  for (let i = 1; i < 6; i++){
    const c = chips[i];
    await moveChip(c, SOCKET.x + 6, SOCKET.y + 6, 260);
    const t = READ[i], sp = t + NOTCH - CLOCK_START;
    await Anim.tween(620, p => {
      const f = CLOCK_START + Math.round((sp * p) / NOTCH) * NOTCH;
      setClock(f);
      setResult(f <= t + NOTCH / 2 ? 'pass' : 'fail');
    }, p => p);
    setClock(t);
    setResult('pass');
    stamp(c, t);
    if (!flow.instant) SFX.blip();
    await moveChip(c, c.home.x, c.home.y, 260);
  }
  setClock(CLOCK_START);
  setResult('idle');

  /* ======================= CARD 14 — six numbers ======================= */

  const lo = Math.min(...READ), hi = Math.max(...READ);
  guide.say(`Six chips, six ratings. The slowest is rated ${lo.toFixed(1)} GHz and the
    fastest ${hi.toFixed(1)}. Nothing differs between them except where they sat on the
    wafer.`);
  stage.focus(chipLayer, { label: 'six ratings', at: 'top' });
  await guide.next();

  /* ======================= the bins ======================= */

  const binG = svgEl('g');
  svg.appendChild(binG);
  const priceG = svgEl('g');
  const bins = BINS.map(b => {
    const rect = svgEl('rect', { x: b.x, y: BIN_Y, width: b.w, height: BIN_H, rx: 4, class: 'slot' });
    const name = svgEl('text', { x: b.x + b.w / 2, y: BIN_Y - 14, class: 'lbl-strong' });
    name.textContent = b.label;
    const range = svgEl('text', { x: b.x + b.w / 2, y: BIN_Y + BIN_H + 22, class: 'lbl-faint' });
    range.textContent = b.range;
    binG.append(rect, name, range);
    const price = svgEl('text', { x: b.x + b.w / 2, y: BIN_Y + BIN_H + 58, class: 'gate-lbl', 'font-size': 16 });
    price.textContent = b.price;
    price.style.fill = 'var(--amber)';        // a fill attribute loses to the class's CSS fill
    priceG.appendChild(price);
    return { ...b, rect };
  });
  svg.appendChild(priceG);
  binG.style.display = 'none';
  priceG.style.display = 'none';

  stage.clearFocus();
  raiseChips();
  await fadeOut([testG], 260);
  await fadeIn([binG], 340);

  /* ======================= CARD 15 — define a bin ======================= */

  guide.say(`A bin is a grade. This chip sells in three grades, and the lines between them
    sit at 3.0 and 4.5 GHz.`);
  stage.focus(binG, { label: 'three bins', at: 'bottom', ring: false });
  await guide.next();

  /* ======================= CARD 16 — file the six ======================= */

  stage.clearFocus();      // focus re-parents what it raises; this card needs live clicks

  const card = guide.say(`<b>Your goal is to put every chip in the bin its rating falls
    in.</b> Click a chip, then click the bin.
    <span class="bin-fb" style="display:block;margin-top:10px;color:var(--ink-soft)"></span>`);
  const fb = card.querySelector('.bin-fb');
  const feedback = html => { if (fb) fb.innerHTML = html; };

  /* Where a chip lands inside its bin is fixed by the chip's own index, not by the order
     the player happened to click, so a live run and a replay end identically. */
  const slotFor = c => {
    const b = bins.find(x => x.id === binFor(c.rating));
    const n = chips.filter(o => o.i < c.i && binFor(o.rating) === b.id).length;
    return { b, x: b.x + 8 + n * 68, y: BIN_Y + 33 };
  };
  const placed = new Set();
  let armed = null;
  const arm = c => {
    chips.forEach(x => x.g.classList.remove('armed'));
    armed = c;
    if (c) c.g.classList.add('armed');
    bins.forEach(b => b.rect.classList.toggle('hot', !!c));
  };
  const fileChip = c => {
    const s = slotFor(c);
    c.bin = s.b.id;
    placed.add(c);
    c.g.style.pointerEvents = 'none';
    c.g.removeAttribute('tabindex');
    return moveChip(c, s.x, s.y, 360);
  };

  await flow.ask(async replay => {
    if (replay !== undefined){
      chips.forEach(c => {
        const s = slotFor(c);
        c.bin = s.b.id;
        setChipXY(c, s.x, s.y);
        c.g.style.pointerEvents = 'none';
        placed.add(c);
      });
      bins.forEach(b => b.rect.classList.remove('hot'));
      return replay;
    }

    await new Promise(resolve => {
      chips.forEach(c => {
        c.g.setAttribute('tabindex', '0');
        c.g.setAttribute('role', 'button');
        const fire = () => {
          if (placed.has(c)) return;
          SFX.click();
          arm(armed === c ? null : c);
          feedback(armed ? `Chip ${c.i + 1} reads ${c.rating.toFixed(1)} GHz. Now click its bin.` : '');
        };
        // a mouse click leaves the UA's amber :focus-visible ring on the node, which
        // reads as a second meaning for amber; drop it for the mouse, keep it for Tab
        c.g.addEventListener('click', e => { if (e.detail) c.g.blur(); fire(); });
        c.g.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fire(); }
        });
      });
      bins.forEach(b => {
        b.rect.setAttribute('tabindex', '0');
        const fire = async () => {
          if (!armed){ feedback(`Click a chip first. The number on it is its rating.`); return; }
          const c = armed;
          if (binFor(c.rating) === b.id){
            arm(null);
            feedback(`${c.rating.toFixed(1)} GHz. Filed.`);
            SFX.dope();
            await fileChip(c);
            if (placed.size === chips.length) resolve();
          } else {
            SFX.click();
            b.rect.classList.remove('shake');
            void b.rect.getBoundingClientRect();
            b.rect.classList.add('shake');
            feedback(`${c.rating.toFixed(1)} GHz does not fall in ${b.label}. The range under each bin says what goes there.`);
          }
        };
        b.rect.addEventListener('click', e => { if (e.detail) b.rect.blur(); fire(); });
        b.rect.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fire(); }
        });
      });
    });

    bins.forEach(b => b.rect.classList.remove('hot'));
    return chips.map(c => c.bin);
  });

  /* ======================= CARD 17 — three prices ======================= */

  await fadeIn([priceG], 340);

  guide.aha(`One wafer and one design give three price tags. The fast ones go to buyers
    who pay extra for speed, and the slow ones still sell.`,
    `Sorting chips by the speed they tested at is called <b>binning</b>.`);
  stage.focus(priceG, { label: 'three prices', at: 'bottom' });
  await guide.next();
  stage.clearFocus();

  /* ================= cut-down chips =================
     Course restructure (2026-10-25): switched-off cores used to be taught only in the lab
     (the Ryzen 5950X / 5900X cards). They are theory now, two cards after the binning aha,
     and the lab keeps the Ryzen only as the real example. The second card sets up Act 4
     step 1's lab, which points back here for the H100's switched-off blocks.
     Colour per DESIGN.md §1a: the speck is red (a defect), and a switched-off part is shown
     by opacity and a dashed outline, not by a colour. */
  const CUT = { x: 220, y: 116, w: 280, h: 196, cw: 56, ch: 70, gap: 8 };
  const cutG = svgEl('g');
  const coreTiles = [];
  cutG.innerHTML = `
    <text x="${CUT.x + CUT.w / 2}" y="${CUT.y - 14}" class="lbl-faint">ONE DIE WITH EIGHT CORES</text>
    <rect x="${CUT.x}" y="${CUT.y}" width="${CUT.w}" height="${CUT.h}" rx="4" class="tile-bg"/>`;
  for (let k = 0; k < 8; k++){
    const cx = CUT.x + 16 + (k % 4) * (CUT.cw + CUT.gap);
    const cy = CUT.y + 22 + Math.floor(k / 4) * (CUT.ch + 12);
    const g = svgEl('g');
    const r = svgEl('rect', { x: cx, y: cy, width: CUT.cw, height: CUT.ch, rx: 3, class: 'tile-bg' });
    const t = svgEl('text', { x: cx + CUT.cw / 2, y: cy + CUT.ch / 2 + 3, class: 'tile-cap' });
    t.textContent = 'CORE';
    g.append(r, t);
    cutG.appendChild(g);
    coreTiles.push({ g, r, t, cx, cy });
  }
  const hit = coreTiles[5];
  const speck = svgEl('circle', { cx: hit.cx + 40, cy: hit.cy + 18, r: 4.5, fill: 'var(--red)' });
  speck.style.opacity = '0';
  cutG.appendChild(speck);
  const cutCap = svgEl('text', { x: CUT.x + CUT.w / 2, y: CUT.y + CUT.h + 26, class: 'lbl-strong' });
  cutCap.textContent = 'SOLD AS A CHEAPER MODEL';
  cutCap.style.opacity = '0';
  cutG.appendChild(cutCap);
  svg.appendChild(cutG);
  cutG.style.display = 'none';

  await fadeOut([binG, priceG, chipLayer, trayLine], 260);
  await fadeIn([cutG], 340);

  guide.say(`A speck does not always kill a die. If it lands inside one core, that core is
    switched off and the die sells as a cheaper model with fewer cores. This is what people
    mean when they say a chip is cut down.`);
  await Anim.tween(380, p => { speck.style.opacity = String(p); });
  await sleep(240);
  hit.t.textContent = 'OFF';
  hit.r.setAttribute('stroke-dasharray', '4 4');
  await Anim.tween(420, p => {
    hit.g.style.opacity = String(1 - 0.65 * p);
    cutCap.style.opacity = String(p);
  });
  stage.focus(cutG, { label: 'a cut-down chip', at: 'bottom' });
  await guide.next();

  /* the H100: 144 blocks, 12 of them switched off. The 12 places are fixed (not drawn from
     a random generator), so a replay draws the same die. */
  stage.clearFocus();
  const H = { x: 252, y: 118, cell: 18, n: 12 };
  const OFF = new Set([3, 21, 29, 36, 59, 66, 74, 92, 100, 118, 121, 139]);   // row * 12 + col
  const h100G = svgEl('g');
  let blocks = `
    <text x="${H.x + H.n * H.cell / 2}" y="${H.y - 16}" class="lbl-faint">THE H100'S DIE: 144 BLOCKS</text>
    <rect x="${H.x - 10}" y="${H.y - 8}" width="${H.n * H.cell + 17}" height="${H.n * H.cell + 17}" rx="4" class="tile-bg"/>`;
  for (let k = 0; k < H.n * H.n; k++){
    const x = H.x + (k % H.n) * H.cell, y = H.y + Math.floor(k / H.n) * H.cell;
    blocks += OFF.has(k)
      ? `<rect x="${x}" y="${y}" width="15" height="15" rx="1.5" class="tile-bg" stroke-dasharray="2.5 2.5" opacity=".5"/>`
      : `<rect x="${x}" y="${y}" width="15" height="15" rx="1.5" class="tile-bg"/>`;
  }
  blocks += `<text x="${H.x + H.n * H.cell / 2}" y="${H.y + H.n * H.cell + 34}" class="lbl-strong">132 SWITCHED ON, 12 OFF</text>`;
  h100G.innerHTML = blocks;
  svg.appendChild(h100G);
  h100G.style.display = 'none';
  await fadeOut([cutG], 260);
  await fadeIn([h100G], 340);

  guide.say(`The GPU you build in Act 4 is sold this way. The H100's die has 144 blocks that do
    its processing, and at most 132 of them are switched on.`);
  stage.focus(h100G, { label: 'H100 die', at: 'bottom' });
  await guide.next();
  stage.clearFocus();

  /* ================= In the Lab (DESIGN.md §6d rule 8) =================
     Binning as it is done for real: a test handler moving one chip from tray to socket to
     the FAST tray, then one die design (AMD's Zen 3 core die) sold as four Ryzen 5000
     products with cores switched off.
     Course restructure (2026-10-25): the handler and socket cards are merged into one, and
     the Ryzen cards point back to the cut-down theory card instead of teaching it again. */
  const hd = handlerHTML();
  const lab = slideInPanel(svg, hd.html, { lab: true });
  lab.focus(['handler', 'socket']);
  /* the head and the chip it carries belong to the handler, so they dim with it */
  const mover = svgEl('g', { 'data-k': 'handler' });
  const headG = svgEl('g');
  headG.innerHTML = hd.head;
  const carried = svgEl('g');
  carried.innerHTML = `<rect x="-8" y="-8" width="16" height="16" rx="1.5" fill="#262822" stroke="#45483e" stroke-width=".8"/>
    <circle cx="-4.6" cy="-4.6" r="1.3" fill="#55594d"/>`;
  mover.append(carried, headG);
  lab.g.appendChild(mover);
  const place = (x, y) => {
    carried.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    placeHead(headG, x, y);
  };
  place(...hd.route[0]);
  await lab.show();
  guide.lab(`In a factory, the testing you just did is done by a machine called a
    <b>handler</b>. It presses each chip into a test socket, down onto a spring-loaded pin under
    each solder ball, then drops it into the tray for its grade.`, { intro: true });
  /* one chip along the route: up, across, into the socket, then on to the FAST tray */
  const R = hd.route, legs = R.slice(1).map((p, i) => Math.hypot(p[0] - R[i][0], p[1] - R[i][1]));
  const total = legs.reduce((a, b) => a + b, 0);
  await Anim.tween(2600, q => {
    let d = q * total, i = 0;
    while (i < legs.length - 1 && d > legs[i]){ d -= legs[i]; i++; }
    const t = Math.min(1, d / legs[i]);
    place(R[i][0] + (R[i + 1][0] - R[i][0]) * t, R[i][1] + (R[i + 1][1] - R[i][1]) * t);
  });
  place(...R[R.length - 1]);
  await guide.next();

  const dies = slideInPanel(svg, harvestHTML(), { lab: true });
  dies.focus('die');
  await lab.swapTo(dies);      // N-053: no flash of the stage between panels
  guide.lab(`AMD's Ryzen 5000 desktop processors are a real example of the cut-down chips
    from earlier in this step. All four are built from one design of die that holds eight
    cores.`);
  await guide.next();

  dies.focus(['p5950', 'p5900', 'p5800', 'p5600', 'legend']);
  guide.lab(`Two full dies make the 16-core Ryzen 9 5950X, launched at $799. Two cut-down
    dies, each with two cores switched off, make the 12-core 5900X, at $549.`);
  await guide.next();
  await dies.hide();
}
