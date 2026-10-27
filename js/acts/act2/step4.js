// ACT 2 · STEP 4 — "How do a register, an adder and a clock become a CPU?" (the clocked loop).
// Course restructure (2026-10-25): retitled from "How do a register and an adder become a
// computer?". The step now ends on the CPU, a core, 64-bit, a free-running clock and the
// hand-off to Act 3 (COURSE_RESTRUCTURE_PROPOSAL.md, Act 2). Overflow is taught only here.
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
import { makePlacer, makeChip, makeRaisedTiles, slideInPanel } from '../../engine/components.js';
import { lab24Clock, lab24Computers } from './lab.js';

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
  // Course restructure (2026-10-25): retitled to name the CPU.
  guide.title('STEP 4 / 4', 'How do a register, an adder and a clock <em>become a CPU?</em>');
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
  makeRaisedTiles(svg, tiles);
  tiles[0].home = { x: 55, y: 350 };
  tiles[1].home = { x: 295, y: 350 };
  tiles[2].home = { x: 535, y: 350 };
  tiles.forEach(t => {
    t.g.style.transition = 'none';
    t.g.style.transform = `translate(${t.home.x}px,${t.home.y}px)`;
    t.tx = t.home.x; t.ty = t.home.y;
  });
  const [regTile, addTile, nandTile] = tiles;

  /* ================= CARD 1 — the bench, and the register =================
     Course restructure (2026-10-25): the bench recap (old card 1) folds in here. */

  guide.say(`Three parts are on the bench, one from each step so far. This is the register
    from step 3: four SR latches that hold a four-bit number until something tells them to
    change.`);
  stage.focus(regTile.g, { label: 'register · step 3', at: 'top' });
  await guide.next();

  /* ================= CARD 2 — the ripple adder, and the NAND =================
     Course restructure (2026-10-25): the NAND card (old card 4) folds in here. */

  guide.say(`This is the ripple adder from step 2: two four-bit numbers go in, and their sum
    comes out. Beside it is the NAND gate from step 1, which forgets its answer when its
    inputs change.`);
  stage.focus([addTile.g, nandTile.g], { label: 'adder (step 2) · nand (step 1)', at: 'top' });
  await guide.next();

  /* ================= CARD 3 — place them in the loop =================
     No focus on this card: focus re-parents what it raises, which breaks the
     placer's pointer handling (VERIFY_HARNESS.md §4b). */

  stage.clearFocus();
  await fadeIn([wiresG, slotsG], 340);

  guide.say(`The wires are already in place. One slot needs the part that holds a number,
    and the other needs the part that adds to it. <b>Your goal is to fill both slots.</b>
    One part stays on the bench.`);

  const placer = makePlacer({
    svg, tiles, slots,
    validate: v => v[0] === 'REG' && v[1] === 'ADD',
    onWrong: () => guide.note(`Fill the left slot with the part that holds a number and the
      right slot with the part that adds. Both parts are back on the bench.`),
  });
  await flow.ask(async replay => {
    if (replay !== undefined){ placer.autoPlace(); return replay; }
    await placer.done;
    return true;
  });

  await sleep(560);
  tiles.forEach(t => { t.g.style.transition = 'none'; });
  await fadeOut([nandTile.g, slotsG], 300);

  /* ================= CARD 4 — the loop wires =================
     Course restructure (2026-10-25): the forward and return wire cards merged into one. */

  guide.say(`The top wire carries the number out of the register and into the adder. The
    adder's output comes back along the lower wire into the register's input, so the two parts
    form one closed loop.`);
  stage.focus(wiresG, { label: 'one closed loop', at: 'bottom', ring: false });
  await guide.next();

  /* ================= CARD 5 — the addend ================= */

  stage.clearFocus();
  await fadeIn([addendG], 300);
  const addBits = makeToggleBits(controls, { n: 4, label: 'ADDEND' });

  guide.say(`The adder needs a second number, the <b>addend</b> (the number being added on).
    This wire brings it up from the switches under the stage.`);
  stage.focus(addendG, { label: 'addend', at: 'left' });
  await guide.next();

  /* ================= CARD 6 — the clock, and what a cycle is ================= */

  stage.clearFocus();
  await fadeIn([clockG, clockWire], 300);

  guide.say(`The <b>clock</b> is a signal that pulses at a steady rate. <b>One cycle is one
    pulse, or beat:</b> every part does its job once, then waits for the next beat.`);
  stage.focus(clockG, { label: 'one cycle = one beat', at: 'bottom' });
  await guide.next();

  /* ================= CARD 7 — why the clock is there ================= */

  guide.say(`The register only takes a new value on a beat. Without that rule, the adder's
    output would flow straight back into its own input and never settle.`);
  stage.focus([clockWire, regTile.g], { label: 'changes only on a beat', at: 'right' });
  await guide.next();

  /* the clock is its own circuit; its beat is chosen to fit the slowest path */
  // Course restructure (2026-10-25): trimmed from 65 words. Act 3 step 5 leans on the last
  // sentence (a beat that arrives before the sum is finished stores a wrong one).
  guide.say(`The clock is a separate circuit, like a metronome: it beats at a fixed rate and
    does not wait for the adder. If a beat arrives before the sum is finished, the register
    stores a wrong one.`);
  stage.focus(clockG, { label: 'a separate circuit', at: 'bottom' });
  await guide.next();

  /* REVIEW_NOTES N-023: the clock is the right place to say how fast real clocks beat. */
  // Course restructure (2026-10-25): reworded in spec-sheet words.
  guide.say(`A clock's speed is counted in <b>hertz</b> (Hz), one beat per second. For now,
    your clock beats once each time you press its button. When a laptop chip is sold as
    4.7 <b>GHz</b> (gigahertz), its clock beats 4.7 billion times a second.`);
  stage.focus(clockG, { label: 'beats per second', at: 'bottom' });
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

  let regValue = 0, cycles = 0, busy = false, wrapped = false, onTouch = null, autoRun = false;

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

  /* k scales every phase: 1 for a pressed beat, smaller for the free-running clock
     (Course restructure, 2026-10-25), so its beats land about once a second */
  async function runCycle(k = 1){
    busy = true;
    runBtn.disabled = true;
    const a = addBits.value, sum = regValue + a;

    setPhase('fetch');
    fwdFlow.setSpeed(200 / k);
    await Anim.tween(460 * k, () => {});
    fwdFlow.setSpeed(0);

    setPhase('compute');
    eq.textContent = `${regValue} + ${a} = ${sum}`;
    eq.style.opacity = '1';
    await Anim.tween(420 * k, () => {});

    setPhase('store');
    retFlow.setSpeed(200 / k);
    await Anim.tween(520 * k, () => {});
    retFlow.setSpeed(0);

    regValue = sum & 15;
    regBits.set(regValue);
    if (sum > 15){
      setWrapMark(true);
      regBits.cells.forEach(c => { c.r.style.stroke = 'var(--red)'; });
      await Anim.tween(620 * k, () => {});
      regBits.cells.forEach(c => { c.r.style.stroke = ''; });
    }
    cycles++;
    cycleChip.set(`CYCLES: <b>${cycles}</b>`);
    setPhase(null);
    SFX.blip();
    busy = false;
    runBtn.disabled = autoRun;
  }

  const runBtn = el('button', { class: 'btn primary', 'data-label': 'run-one-cycle' }, 'RUN ONE CYCLE ▸');
  const cycleChip = makeChip(controls, 'CYCLES: <b>0</b>');
  controls.insertBefore(runBtn, cycleChip.el);
  runBtn.addEventListener('click', () => {
    if (busy || autoRun) return;
    if (onTouch){ onTouch(); onTouch = null; }
    SFX.click();
    runCycle();
  });
  addBits.el.addEventListener('click', () => { if (onTouch){ onTouch(); onTouch = null; } });

  /* ================= CARD 10 — the three phases ================= */

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

  guide.say(`Each cycle has three phases: fetch the number out of the register, compute the
    sum, and store it back.`);
  stage.focus(phaseG, { label: 'one cycle, three phases', at: 'bottom', ring: false });
  await guide.next();

  /* ================= CARD 11 — run it ================= */

  stage.clearFocus();
  guide.say(`Set an addend on the switches, then run three cycles. The register goes up by
    the addend on every beat.`);

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

  /* ================= CARD 12 — push it past 15 ================= */

  regValue = 14; regBits.set(14);
  addBits.set(5, true);
  setWrapMark(false);
  eq.style.opacity = '0';           // the last cycle's sum no longer matches the register
  await sleep(260);

  guide.say(`Four bits can only count up to 15. The register is now set to 14, with 5 on the
    addend.`);
  stage.focus(regBits.g, { label: 'register reads 14', at: 'bottom' });
  runBtn.disabled = true;
  await guide.button('Run one cycle ▸');
  stage.clearFocus();
  runBtn.disabled = false;
  await runCycle();

  /* ================= CARD 13 — what wrapping is ================= */

  guide.say(`14 plus 5 is 19. Nineteen needs a sixteens bit, and four bits have none, so the
    register dropped the sixteens bit and kept the 3. It wrapped round, like an odometer.`);
  stage.focus([regBits.g, lost], { label: 'wrapped past 15', at: 'right' });
  await guide.next();

  /* ================= CARD 14 — 4-bit against 64-bit =================
     Course restructure (2026-10-25): new. 2^64 − 1 is about 1.8 × 10^19. */

  guide.say(`Your register holds 4 bits, so this is a 4-bit machine. A 64-bit chip has 64-bit
    registers and a 64-column adder, so it counts past 18 quintillion before it wraps.`);
  stage.focus(regBits.g, { label: '4 bits', at: 'bottom' });
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

  /* ================= CARD 16 — the clock runs by itself =================
     Course restructure (2026-10-25): new. The premise promises a machine that runs with
     nobody pressing anything, so the clock is switched to RUN and beats on its own for a
     fixed five beats, then stops: the loop cannot outlive the card. Each beat is
     runCycle, built on Anim.tween, so a Back or Restart (Anim.clear) freezes it, and a
     replay skips it and lands the recorded end state. Afterwards every control is locked,
     so the cards that follow show the same machine live and on replay. */

  const RUN_BEATS = 5;
  const clockLbl = clockG.querySelector('text'), clockRect = clockG.querySelector('rect');
  const runClockBtn = el('button', { class: 'btn primary', 'data-label': 'clock-run' }, 'CLOCK: RUN ▸');
  controls.insertBefore(runClockBtn, cycleChip.el);
  // a disabled .btn looks the same as a live one (base.css), so the locked controls are
  // dimmed as well, and the clock button says it is off
  const lockControls = () => {
    runBtn.disabled = true;
    runClockBtn.disabled = true;
    addBits.el.querySelectorAll('button').forEach(b => { b.disabled = true; });
    runBtn.style.opacity = '0.45';
    addBits.el.style.opacity = '0.45';
  };
  const stopClock = () => {
    runClockBtn.textContent = 'CLOCK: OFF';
    runClockBtn.style.opacity = '0.45';
  };

  stage.clearFocus();
  regValue = 0; regBits.set(0);
  addBits.set(1, true);
  setWrapMark(false);
  eq.style.opacity = '0';
  eq.textContent = '';

  guide.say(`So far you pressed a button for every beat. The register is back at 0, with 1 on
    the addend. <b>Switch the clock to RUN</b>, and it beats by itself, about once a second.`);

  await flow.ask(async replay => {
    if (replay !== undefined){
      lockControls();
      stopClock();
      addBits.set(replay.a, true);
      regValue = replay.r; regBits.set(regValue);
      cycles = replay.t; cycleChip.set(`CYCLES: <b>${cycles}</b>`);
      setWrapMark(replay.w);
      return replay;
    }
    const cancel = flow.hintAfter(12000, `Press CLOCK: RUN under the stage.`);
    await new Promise(res => runClockBtn.addEventListener('click', () => {
      if (busy) return;
      SFX.click(); res();
    }));
    cancel();
    autoRun = true;
    lockControls();
    runClockBtn.textContent = 'CLOCK: ON';
    clockLbl.textContent = 'CLOCK · RUN';
    for (let i = 0; i < RUN_BEATS; i++){
      clockRect.style.stroke = 'var(--blue)';
      await runCycle(0.6);          // about 840 ms of phases
      clockRect.style.stroke = '';
      await Anim.tween(160, () => {});
    }
    clockLbl.textContent = 'CLOCK';
    stopClock();
    return { r: regValue, a: addBits.value, t: cycles, w: wrapped };
  });
  // the loop is drawn clean for the cards that follow, and clearing the sum here keeps a
  // replayed run identical to a played one (the replay branch never ran a cycle)
  setPhase(null);
  setWrapMark(false);
  eq.style.opacity = '0';
  eq.textContent = '';

  /* ================= CARD 17 — the payoff: a CPU =================
     Act 4 step 1 opens on this drawing and calls it "your Act 2 machine".
     Course restructure (2026-10-25): it now follows the free-running clock, and its second
     line is the instruction line. */

  const machine = [clockG, clockWire, regTile.g, addTile.g, regBits.g];
  guide.aha(`Your loop just ran by itself: fetch, compute, store, and repeat. If it runs a few
    billion times a second, you have a <b>CPU</b> (central processing unit, the chip that runs
    programs).`,
    `Here you chose each addend by hand. A program is a list of such steps that the chip reads
     for itself, one instruction at a time.`);
  stage.focus(machine, { label: 'your act 2 machine', at: 'top' });
  await guide.next();

  /* ================= CARD 18 — a core =================
     Course restructure (2026-10-25): new. Act 4 step 1 talks about "a real CPU core". */

  guide.say(`One copy of this loop, with the parts that steer it, is called a <b>core</b>. A
    laptop chip with 8 cores runs 8 of these loops side by side.`);
  stage.focus(machine, { label: 'one loop = one core', at: 'top' });
  await guide.next();

  /* ================= CARD 19 — the hand-off to Act 3 =================
     Course restructure (2026-10-25): replaces the old "your Act 2 machine" and whole-act
     recap cards, which repeated the CPU card and the act debrief. 19 billion is Apple's
     A17 Pro, the phone chip used in Acts 1 and 2. */

  guide.say(`Your machine has a few hundred transistors, placed by hand. A phone chip has 19
    billion. Nobody places those by hand: they are printed.`);
  stage.focus(machine, { label: 'a few hundred transistors', at: 'top' });
  await guide.next();
  stage.clearFocus();

  /* ================= IN THE LAB (DESIGN.md §6d rule 8) =============================
     A 555 timer wired as a one-hertz clock (RA 1 kΩ, RB 68 kΩ, C 10 µF: TI NE555 data
     sheet equations give 0.48 s high, 0.47 s low), then a breadboard 8-bit computer and a
     Raspberry Pi Pico. Sources are listed in js/acts/act2/lab.js. */

  const clock = slideInPanel(svg, lab24Clock(), { lab: true });
  await clock.show();
  /* the LED blinks at the circuit's own timing for 40 s, then rests lit; Anim.tween makes a
     replay land straight on the lit end state */
  const ledOn = clock.g.querySelector('.blink-on'), ledOff = clock.g.querySelector('.blink-off');
  Anim.tween(40000, p => {
    const lit = (p * 40000) % 949 < 479;
    ledOn.style.display = lit ? '' : 'none';
    ledOff.style.display = lit ? 'none' : '';
  }, p => p);
  // Course restructure (2026-10-25): the clock now also ran by itself on RUN, so the first
  // line changed; the 555 thresholds card (3.3 V and 1.7 V) that followed is cut.
  guide.lab(`On RUN, your clock beat by itself. On a breadboard, a 555 timer chip makes such a
    beat: the LED on its output, pin 3, turns on and off about once a second.`,
    { intro: true });
  await guide.next();

  const real = slideInPanel(svg, lab24Computers(), { lab: true });
  real.focus('computer');
  await clock.swapTo(real);      // N-053: no flash of the stage between panels
  guide.lab(`Students and hobbyists build whole computers from chips like these. Each
    breadboard holds one part, such as the 555 clock, a register or the adder. LEDs on each
    part show every bit, so you can watch a program run one cycle at a time.`);
  await guide.next();

  real.focus('pico');
  // Course restructure (2026-10-25): "two CPUs" is now "two cores", the word defined above.
  guide.lab(`Today a whole computer fits on a board 51 mm long. On this Raspberry Pi Pico, the
    square RP2040 chip holds two cores, and each runs at up to 133 million cycles a second.
    Your clock ran about one cycle a second.`);
  await guide.next();
  await real.hide();
}
