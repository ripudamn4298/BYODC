// ACT 2 · STEP 4 — "Fetch, compute, store, repeat" (the clocked loop).
// Ported to the micro-learning contract in DESIGN_MAKEOVER.md §2 / §4: one card at a
// time (guide.cards), every card focuses and names the one thing it is about, and the
// loop is assembled in front of the player rather than handed over finished.
//
// This step owns the course's definition of a CYCLE (ACT2_MAKEOVER.md §2b). It holds the
// first clock anyone meets, so the words used here are the words Act 4 points back at:
// cycle (never "tick"), register, ripple adder, and "your Act 2 machine" for the whole
// loop. Act 4 step 1 opens on this exact drawing: a register, an adder and a clock.
//
// Determinism: every cycle is driven by Anim.tween, which collapses to its end state while
// replaying, and each interaction records the register value, the addend, the cycle count
// and whether the register has wrapped, so a replay lands where the live run landed.
import { svgEl, el, sleep, waitFor } from '../../engine/util.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { CurrentFlow } from '../../engine/pathflow.js';
import { makeBits, makeToggleBits } from '../../engine/gates.js';
import { makePlacer, makeChip } from '../../engine/components.js';

/* ---------- geometry, in the stage's 720×480 user units ----------
   REG and ADD sit side by side at the top. The number leaves the register on the
   upper wire, the sum comes back along the wire that runs round the bottom, the
   addend climbs into the adder from below, and the clock hangs off the register. */
const REG_SLOT = { x: 90, y: 60, w: 170, h: 100 };
const ADD_SLOT = { x: 440, y: 60, w: 170, h: 100 };
const TILE = { w: 130, h: 74 };
const TILE_Y = REG_SLOT.y + (REG_SLOT.h - TILE.h) / 2;          // 73
const REG_X = REG_SLOT.x + (REG_SLOT.w - TILE.w) / 2;           // 110
const ADD_X = ADD_SLOT.x + (ADD_SLOT.w - TILE.w) / 2;           // 460

const FWD_D = `M${REG_X + TILE.w} 90 H${ADD_X}`;                        // 240 → 460
const RET_D = `M${ADD_X + TILE.w} 110 H650 V300 H40 V110 H${REG_X}`;    // 590 → 110
const ADDEND_D = `M370 250 V130 H${ADD_X}`;

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

export async function step4(){
  guide.title('STEP 4 / 4 · NANOVOLT SYSTEMS', 'Fetch, compute, <em>store, repeat</em>');
  guide.cards();

  const stage = newStage('09', 'A register and an adder wired into a loop, driven by a clock');
  const { svg, controls } = stage;

  /* ---------- everything that is drawn, in document order ----------
     focus() re-parents what it raises and restores it back to front, so any list
     handed to it later has to be in this same order (VERIFY_HARNESS.md §4b). */

  const wiresG = svgEl('g');
  wiresG.innerHTML = `
    <path d="${FWD_D}" class="wire"/>
    <path d="${RET_D}" class="wire"/>`;
  wiresG.style.display = 'none';
  svg.appendChild(wiresG);
  const fwdWire = wiresG.children[0], retWire = wiresG.children[1];

  const addendG = svgEl('g');
  addendG.innerHTML = `
    <path d="${ADDEND_D}" class="wire"/>
    <circle cx="370" cy="250" r="3.2" class="node-dot"/>
    <text x="370" y="268" class="lbl-faint">ADDEND</text>`;
  addendG.style.display = 'none';
  svg.appendChild(addendG);

  const clockG = svgEl('g');
  clockG.innerHTML = `
    <rect x="110" y="235" width="130" height="44" rx="6" class="tile-bg"/>
    <text x="175" y="262" class="gate-lbl">CLOCK</text>`;
  clockG.style.display = 'none';
  svg.appendChild(clockG);

  const clockWire = svgEl('path', { d: 'M175 235 V198', class: 'wire dim', 'stroke-dasharray': '4 4' });
  clockWire.style.display = 'none';
  svg.appendChild(clockWire);

  const slotsG = svgEl('g');
  slotsG.style.display = 'none';
  svg.appendChild(slotsG);
  const SLOTS = [{ ...REG_SLOT, correct: 'REG' }, { ...ADD_SLOT, correct: 'ADD' }];
  const slots = SLOTS.map(s => {
    const rect = svgEl('rect', { x: s.x, y: s.y, width: s.w, height: s.h, rx: 8, class: 'slot' });
    const q = svgEl('text', { x: s.x + s.w / 2, y: s.y + s.h / 2 + 9, class: 'slot-q' });
    q.textContent = '?';
    slotsG.append(rect, q);
    return { ...s, rect, q, value: null, tile: null };
  });

  const phaseG = svgEl('g');
  const phaseT = {};
  phaseG.style.display = 'none';
  svg.appendChild(phaseG);

  /* ---------- the three parts on the bench ---------- */

  function bigTile(value, label, cap){
    const g = svgEl('g', { class: 'tile', 'data-part': value.toLowerCase(), 'aria-label': label });
    g.innerHTML = `
      <rect width="${TILE.w}" height="${TILE.h}" rx="8" class="tile-bg"/>
      <text x="${TILE.w / 2}" y="${TILE.h / 2 - 2}" class="gate-lbl" font-size="14">${label}</text>
      <text x="${TILE.w / 2}" y="${TILE.h / 2 + 17}" class="lbl-faint">${cap}</text>`;
    svg.appendChild(g);
    return { g, value, w: TILE.w, h: TILE.h, home: null, tx: 0, ty: 0, slot: null };
  }
  const tiles = [
    bigTile('REG', 'REGISTER', 'holds a number'),
    bigTile('ADD', 'ADDER', 'adds'),
    bigTile('NAND', 'NAND', 'one gate'),
  ];
  tiles[0].home = { x: 55, y: 350 };
  tiles[1].home = { x: 295, y: 350 };
  tiles[2].home = { x: 535, y: 350 };
  tiles.forEach(t => {
    t.g.style.transition = 'none';
    t.g.style.transform = `translate(${t.home.x}px,${t.home.y}px)`;
    t.tx = t.home.x; t.ty = t.home.y;
  });
  const [regTile, addTile, nandTile] = tiles;

  /* ================= CARD 1 — the bench ================= */

  guide.say(`Everything you built in this act is on the bench. Three parts, one from each
    step.`);
  stage.focus(tiles.map(t => t.g), { label: 'the bench', at: 'top' });
  await guide.next();

  /* ================= CARD 2 — the register ================= */

  guide.say(`The register from step 3. Four loops side by side. They hold a four-bit number
    until something tells them to change.`);
  stage.focus(regTile.g, { label: 'register · step 3', at: 'top' });
  await guide.next();

  /* ================= CARD 3 — the ripple adder ================= */

  guide.say(`The ripple adder from step 2. Two four-bit numbers go in, the sum comes out,
    and the carries run right to left.`);
  stage.focus(addTile.g, { label: 'ripple adder · step 2', at: 'top' });
  await guide.next();

  /* ================= CARD 4 — the NAND ================= */

  guide.say(`The NAND from step 1. Two inputs, one answer, and no memory of it once the
    inputs move.`);
  stage.focus(nandTile.g, { label: 'nand · step 1', at: 'top' });
  await guide.next();

  /* ================= CARD 5 — place them in the loop =================
     No focus on this card: focus re-parents what it raises, which breaks the
     placer's pointer handling (VERIFY_HARNESS.md §4b). */

  stage.clearFocus();
  await fadeIn([wiresG, slotsG], 340);

  guide.say(`The wires are already run. One slot needs the part that holds a number, the
    other needs the part that adds to it. <b>Your goal: fill both.</b> One tile stays on the
    bench.`);

  const placer = makePlacer({
    svg, tiles, slots,
    validate: v => v[0] === 'REG' && v[1] === 'ADD',
    onWrong: () => guide.note(`Fill the left slot with the part that holds a number and the
      right slot with the part that adds. Both tiles are back on the bench.`),
  });
  await flow.ask(async replay => {
    if (replay !== undefined){ placer.autoPlace(); return replay; }
    await placer.done;
    return true;
  });

  await sleep(560);
  tiles.forEach(t => { t.g.style.transition = 'none'; });
  await fadeOut([nandTile.g, slotsG], 300);

  /* ================= CARD 6 — the forward wire ================= */

  guide.say(`This wire carries the number out of the register and into the adder.`);
  stage.focus(fwdWire, { label: 'register out to adder in', at: 'top' });
  await guide.next();

  /* ================= CARD 7 — the return wire ================= */

  guide.say(`The adder's output feeds straight back into the register's input. One loop,
    closed.`);
  stage.focus(retWire, { label: 'adder out to register in', at: 'bottom', ring: false });
  await guide.next();

  /* ================= CARD 8 — the addend ================= */

  stage.clearFocus();
  await fadeIn([addendG], 300);
  const addBits = makeToggleBits(controls, { n: 4, label: 'ADDEND' });

  guide.say(`The adder needs a second number. This line brings it up from the switches
    under the stage.`);
  stage.focus(addendG, { label: 'addend', at: 'left' });
  await guide.next();

  /* ================= CARD 9 — the clock, and what a cycle is ================= */

  stage.clearFocus();
  await fadeIn([clockG, clockWire], 300);

  guide.say(`The clock keeps the beat. <b>One cycle is one beat:</b> every part moves once,
    then waits for the next one.`);
  stage.focus(clockG, { label: 'one cycle = one beat', at: 'bottom' });
  await guide.next();

  /* ================= CARD 10 — why the clock is there ================= */

  guide.say(`The register only takes a new value on a beat. Without that rule the adder's
    output would pour back into its own input and never settle.`);
  stage.focus([clockWire, regTile.g], { label: 'changes only on a beat', at: 'right' });
  await guide.next();

  /* ================= the live loop ================= */

  const regBits = makeBits(svg, { x: 115, y: 170, n: 4, size: 24, gap: 32 });
  regBits.set(0);

  const eq = svgEl('text', { x: 525, y: 172, class: 'lbl-strong' });
  eq.style.opacity = '0';
  svg.appendChild(eq);

  const lost = svgEl('text', { x: 175, y: 56, class: 'lbl' });
  lost.textContent = 'SIXTEENS BIT DROPPED';
  lost.style.fill = 'var(--red)';       // the class sets a fill, so this has to be inline
  lost.style.opacity = '0';
  svg.appendChild(lost);

  const flowLayer = svgEl('g');
  svg.appendChild(flowLayer);
  const fwdFlow = new CurrentFlow(fwdWire, { n: 5, layer: flowLayer });
  const retFlow = new CurrentFlow(retWire, { n: 12, layer: flowLayer });

  let regValue = 0, cycles = 0, busy = false, wrapped = false, onTouch = null;

  function setPhase(k){
    Object.keys(phaseT).forEach(name => {
      const t = phaseT[name];
      t.style.fill = name === k ? 'var(--blue)' : 'var(--ink-faint)';
      t.style.fontWeight = name === k ? '600' : '400';
    });
  }

  function setWrapMark(on){
    wrapped = on;
    lost.style.opacity = on ? '1' : '0';
  }

  async function runCycle(){
    busy = true;
    runBtn.disabled = true;
    const a = addBits.value, sum = regValue + a;

    setPhase('fetch');
    fwdFlow.setSpeed(200);
    await Anim.tween(460, () => {});
    fwdFlow.setSpeed(0);

    setPhase('compute');
    eq.textContent = `${regValue} + ${a} = ${sum}`;
    eq.style.opacity = '1';
    await Anim.tween(420, () => {});

    setPhase('store');
    retFlow.setSpeed(200);
    await Anim.tween(520, () => {});
    retFlow.setSpeed(0);

    regValue = sum & 15;
    regBits.set(regValue);
    if (sum > 15){
      setWrapMark(true);
      regBits.cells.forEach(c => { c.r.style.stroke = 'var(--red)'; });
      await Anim.tween(620, () => {});
      regBits.cells.forEach(c => { c.r.style.stroke = ''; });
    }
    cycles++;
    cycleChip.set(`CYCLES: <b>${cycles}</b>`);
    setPhase(null);
    SFX.blip();
    busy = false;
    runBtn.disabled = false;
  }

  const runBtn = el('button', { class: 'btn primary', 'data-label': 'run-one-cycle' }, 'RUN ONE CYCLE ▸');
  const cycleChip = makeChip(controls, 'CYCLES: <b>0</b>');
  controls.insertBefore(runBtn, cycleChip.el);
  runBtn.addEventListener('click', () => {
    if (busy) return;
    if (onTouch){ onTouch(); onTouch = null; }
    SFX.click();
    runCycle();
  });
  addBits.el.addEventListener('click', () => { if (onTouch){ onTouch(); onTouch = null; } });

  /* ================= CARD 11 — the three phases ================= */

  stage.clearFocus();
  phaseT.fetch = svgEl('text', { x: 350, y: 78, class: 'lbl' });
  phaseT.compute = svgEl('text', { x: 525, y: 60, class: 'lbl' });
  phaseT.store = svgEl('text', { x: 450, y: 292, class: 'lbl' });
  phaseT.fetch.textContent = 'FETCH';
  phaseT.compute.textContent = 'COMPUTE';
  phaseT.store.textContent = 'STORE';
  Object.keys(phaseT).forEach(k => phaseG.appendChild(phaseT[k]));
  setPhase(null);
  await fadeIn([phaseG], 300);

  guide.say(`Each cycle runs three phases. Fetch the number out of the register, compute the
    sum, store it back.`);
  stage.focus(phaseG, { label: 'one cycle, three phases', at: 'bottom', ring: false });
  await guide.next();

  /* ================= CARD 12 — run it ================= */

  stage.clearFocus();
  guide.say(`Set an addend on the switches, then run three cycles. The register climbs by
    the addend every beat.`);

  await flow.ask(async replay => {
    if (replay !== undefined){
      addBits.set(replay.a, true);
      regValue = replay.r; regBits.set(regValue);
      cycles = replay.t; cycleChip.set(`CYCLES: <b>${cycles}</b>`);
      setWrapMark(replay.w);
      return replay;
    }
    const cancel = flow.hintAfter(16000, `Tap a switch under the stage to set the addend,
      then press RUN ONE CYCLE three times.`);
    onTouch = cancel;
    // the addend check keeps a player who never touched the switches from finishing on
    // three cycles of 0 + 0; the OR covers a register that wrapped back onto 0
    await waitFor(() => cycles >= 3 && (regValue > 0 || addBits.value > 0), { hold: 400 });
    cancel();
    onTouch = null;
    return { r: regValue, a: addBits.value, t: cycles, w: wrapped };
  });

  /* ================= CARD 13 — push it past 15 ================= */

  regValue = 14; regBits.set(14);
  addBits.set(5, true);
  setWrapMark(false);
  eq.style.opacity = '0';           // the last cycle's sum no longer matches the register
  await sleep(260);

  guide.say(`Four bits only reach 15. The register is set to 14 now, with 5 on the addend.`);
  stage.focus(regBits.g, { label: 'register reads 14', at: 'bottom' });
  runBtn.disabled = true;
  await guide.button('Run one cycle ▸');
  stage.clearFocus();
  runBtn.disabled = false;
  await runCycle();

  /* ================= CARD 14 — what wrapping is ================= */

  guide.say(`14 plus 5 is 19. Nineteen needs a sixteens bit and four bits have none, so the
    register kept 3 and dropped it. It wrapped like an odometer.`);
  stage.focus([regBits.g, lost], { label: 'wrapped past 15', at: 'right' });
  await guide.next();

  /* ================= CARD 15 — the test ================= */

  stage.clearFocus();
  const t1 = guide.task('Make the register read exactly 12');
  await flow.ask(async replay => {
    if (replay !== undefined){
      addBits.set(replay.a, true);
      regValue = replay.r; regBits.set(regValue);
      cycles = replay.t; cycleChip.set(`CYCLES: <b>${cycles}</b>`);
      setWrapMark(replay.w);
      return replay;
    }
    const cancel = flow.hintAfter(15000, `Make the register read 12. It reads 3 now, so an
      addend of 9 gets there in one cycle.`);
    onTouch = cancel;
    await waitFor(() => regValue === 12, { hold: 500 });
    cancel();
    onTouch = null;
    return { r: regValue, a: addBits.value, t: cycles, w: wrapped };
  });
  t1.done();
  await sleep(700);                 // let the task's box mark itself before the card goes
  // the loop is drawn clean for the last two cards, and clearing the sum here keeps a
  // replayed run identical to a played one (the replay branch never ran a cycle)
  setWrapMark(false);
  eq.style.opacity = '0';
  eq.textContent = '';

  /* ================= CARD 16 — the payoff ================= */

  guide.aha(`Fetch, compute, store, repeat. Run that loop a few billion times a second and
    you have a CPU.`,
    `A program is a list of orders for the same loop to work through, one at a time.`);
  await guide.next();

  /* ================= CARD 17 — name the machine =================
     Act 4 step 1 opens on this drawing and calls it "your Act 2 machine". */

  guide.say(`A register that holds, an adder that adds, and a clock that keeps the beat,
    wired into one loop.`);
  stage.focus([clockG, clockWire, regTile.g, addTile.g, regBits.g],
    { label: 'your act 2 machine', at: 'top' });
  await guide.next();

  /* ================= CARD 18 — the whole act ================= */

  stage.clearFocus();
  guide.say(`Sand, switch, gate, adder, memory, clock. Each step was one idea, wired into
    the next.`);
  await guide.next();
}
