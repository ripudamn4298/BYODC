// STEP 4 — Build a machine that computes (clocked datapath: REGISTER + ADDER + CLOCK).
// Physics/CS per DESIGN.md §5b.5: REG → ADDER → back to REG, clocked. Each press is one
// fetch-compute-store beat (CurrentFlow pulse around the loop, then bits update). Overflow
// wraps at 15 with an amber blip. Test = reach a target value by choosing the addend and clocking.
import { svgEl, el, sleep, waitFor } from '../../engine/util.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { CurrentFlow } from '../../engine/pathflow.js';
import { makeBits, makeToggleBits } from '../../engine/gates.js';
import { makePlacer, makeChip } from '../../engine/components.js';

export async function step4(){
  guide.title('STEP 4 / 4 · NANOVOLT SYSTEMS', 'Build a machine <em>that computes</em>');

  /* ===================== BEAT 1 — the three parts on the bench ===================== */
  guide.say(`On your bench after three steps: a gate that <b>decides</b>, an adder that <b>adds</b>, a <b>register</b> that <b>holds</b> a number. Wired together so data flows from one to the next, they form a <b>datapath</b> — the part of a computer that actually moves and works on numbers. Your aim this step: wire the register and the adder into a loop, and drive it with a <b>clock</b> — a steady pulse where each beat, or <b>tick</b>, advances the machine one step. The result is a machine that computes on a heartbeat, one step per tick.`);
  await guide.next();

  /* ===================== BEAT 2 — ASSEMBLY ===================== */
  const { svg, controls } = newStage('08', 'Datapath build');
  guide.say(`Two big tiles left to place: a <b>REGISTER</b> — the thing that holds a number — and an <b>ADDER</b> — the thing that adds. The loop wires are already run. <em>Drag the tiles into the loop.</em>`);

  /* pre-drawn loop skeleton: REG.out -> ADDER.in (top path), ADDER.out -> REG.in (return path),
     an ADDEND branch into the adder, and a CLOCK box at bottom-center */
  const sk = svgEl('g');
  sk.innerHTML = `
    <path d="M290 190 H430" class="wire"/>
    <path d="M580 216 H620 V330 H210 V216 H140" class="wire"/>
    <path d="M120 300 H140 V244" class="wire"/>
    <text x="90" y="304" class="lbl-faint">ADDEND</text>
    <circle cx="140" cy="190" r="3.2" class="node-dot"/>`;
  svg.appendChild(sk);
  const clockBox = svgEl('g');
  clockBox.innerHTML = `
    <rect x="310" y="380" width="100" height="46" rx="9" class="tile-bg"/>
    <text x="360" y="408" class="gate-lbl">CLOCK</text>`;
  svg.appendChild(clockBox);

  const SLOTS = [
    { x: 140, y: 160, w: 150, h: 110, correct: 'REG' },
    { x: 430, y: 160, w: 150, h: 110, correct: 'ADD' },
  ];
  const slots = SLOTS.map(s => {
    const rect = svgEl('rect', { x: s.x, y: s.y, width: s.w, height: s.h, rx: 10, class: 'slot' });
    const q = svgEl('text', { x: s.x + s.w / 2, y: s.y + s.h / 2 + 9, class: 'slot-q' }); q.textContent = '?';
    svg.append(rect, q);
    return { ...s, rect, q, value: null, tile: null };
  });

  function bigTile(value, label, cap){
    const w = 118, h = 74;
    const g = svgEl('g', { class: 'tile', 'data-part': value.toLowerCase(), 'aria-label': label });
    g.innerHTML = `
      <rect width="${w}" height="${h}" rx="10" class="tile-bg"/>
      <text x="${w / 2}" y="${h / 2 - 2}" class="gate-lbl" font-size="14">${label}</text>
      <text x="${w / 2}" y="${h / 2 + 16}" class="lbl-faint">${cap}</text>`;
    svg.appendChild(g);
    return { g, value, w, h, home: null, tx: 0, ty: 0, slot: null };
  }
  const tiles = [
    bigTile('REG', 'REGISTER', 'holds a number'),
    bigTile('ADD', 'ADDER', 'adds'),
    bigTile('NAND', 'NAND', 'one lone gate'),
  ];
  tiles[0].home = { x: 40, y: 300 };
  tiles[1].home = { x: 250, y: 300 };
  tiles[2].home = { x: 460, y: 300 };

  guide.say(`One tile in the tray won't fit anywhere — the lone gate already had its moment back in step 1.`);

  const placer = makePlacer({
    svg, tiles, slots,
    validate: v => v[0] === 'REG' && v[1] === 'ADD',
    onWrong: () => guide.note(`The loop needs a thing that holds and a thing that adds — the lone gate had its moment in step 1.`),
  });

  await flow.ask(async replay => {
    if (replay !== undefined){ placer.autoPlace(); return replay; }
    await placer.done;
    return true;
  });

  /* remove the decoy + fade the placement chrome */
  await sleep(450);
  tiles.forEach(t => { if (!t.slot) t.g.style.opacity = '0'; });
  slots.forEach(s => { s.rect.style.opacity = '0'; s.q.style.opacity = '0'; });

  guide.say(`Wired. The register's output feeds the adder; the adder's output feeds straight back into the register. One loop, closed.`);
  await guide.next();

  guide.note(`One rule makes a closed loop safe: the register only accepts a new value at the instant the clock <b>ticks</b>. Without that rule, the adder's output would pour straight back into its own input and the number would never hold still. The clock is what turns a runaway loop into one clean step at a time.`);
  await guide.next();

  /* ===================== BEAT 3 — the heartbeat ===================== */
  const regTile = tiles.find(t => t.value === 'REG');
  const addTile = tiles.find(t => t.value === 'ADD');
  const regBits = makeBits(svg, { x: regTile.slot.x + 17, y: regTile.slot.y + 60, n: 4, size: 24, gap: 34, label: '' });
  regBits.set(0);

  const addBits = makeToggleBits(controls, { n: 4, label: 'ADDEND' });
  const tickBtn = el('button', { class: 'btn primary', 'data-label': 'tick-clock' }, 'TICK THE CLOCK ▸');
  controls.appendChild(tickBtn);
  const tickChip = makeChip(controls, 'LOOPS: <b>0</b>');

  const fwdPath = svgEl('path', { d: `M${regTile.slot.x + regTile.slot.w} ${regTile.slot.y + regTile.slot.h / 2} H${addTile.slot.x}`, fill: 'none', stroke: 'none' });
  const retPath = svgEl('path', { d: `M${addTile.slot.x + addTile.slot.w} ${addTile.slot.y + addTile.slot.h / 2 + 26} H620 V330 H210 V${regTile.slot.y + regTile.slot.h / 2 + 26} H${regTile.slot.x}`, fill: 'none', stroke: 'none' });
  svg.append(fwdPath, retPath);
  const flowLayer = svgEl('g'); svg.appendChild(flowLayer);
  const fwdFlow = new CurrentFlow(fwdPath, { n: 6, layer: flowLayer });
  const retFlow = new CurrentFlow(retPath, { n: 10, layer: flowLayer });

  let regValue = 0, ticks = 0;
  let warnedWrap = false;

  async function tick(){
    tickBtn.disabled = true;
    fwdFlow.setSpeed(220);
    await sleep(450);
    fwdFlow.setSpeed(0);

    const sum = regValue + addBits.value;
    const wrapped = sum > 15;
    const next = sum & 15;
    if (wrapped){
      regBits.cells.forEach(c => { c.r.style.transition = 'fill .15s'; c.r.style.fill = 'var(--amber)'; });
      setTimeout(() => regBits.cells.forEach(c => { c.r.style.fill = ''; }), 480);
      if (!warnedWrap){
        warnedWrap = true;
        guide.note(`That rolled past 15 and wrapped back around — like an odometer turning over. Four bits can only count to 15 before it happens again.`);
      }
    }

    retFlow.setSpeed(220);
    await sleep(450);
    retFlow.setSpeed(0);

    regValue = next;
    regBits.set(regValue);
    ticks++;
    tickChip.set(`LOOPS: <b>${ticks}</b>`);
    SFX.blip();
    tickBtn.disabled = false;
  }
  tickBtn.addEventListener('click', () => { SFX.click(); tick(); });

  guide.say(`Each tick runs three phases: <b>fetch</b> — read the number out of the register; <b>compute</b> — the adder adds your addend to it; <b>store</b> — the result drops back into the register. Set an addend below, then press <b>TICK THE CLOCK</b> a few times and feel the rhythm: fetch, compute, store.`);

  await flow.ask(async replay => {
    if (replay !== undefined){
      addBits.set(replay.a, true);
      regBits.set(replay.r);
      regValue = replay.r;
      ticks = replay.t;
      tickChip.set(`LOOPS: <b>${ticks}</b>`);
      if (replay.r === 0 && replay.t > 0) warnedWrap = true;
      return replay;
    }
    await waitFor(() => ticks >= 2, { hold: 200 });
    return { r: regValue, a: addBits.value, t: ticks };
  });

  /* ===================== BEAT 4 — THE TEST ===================== */
  const t1 = guide.task('Make the register read exactly 12');
  await flow.ask(async replay => {
    if (replay !== undefined){
      addBits.set(replay.a, true);
      regBits.set(replay.r);
      regValue = replay.r;
      ticks = replay.t;
      tickChip.set(`LOOPS: <b>${ticks}</b>`);
      return replay;
    }
    const cancel = flow.hintAfter(15000, `Twelve is 4+4+4 — or 6+6. Pick an addend that divides your target, or steer mid-flight.`);
    await waitFor(() => regValue === 12, { hold: 500 });
    cancel();
    return { r: regValue, a: addBits.value, t: ticks };
  });
  t1.done();

  guide.aha(`<b>This is a computer.</b> Fetch, compute, store, repeat: a CPU's whole life is this loop — your loop — run three billion times a second while you did one press a second.`,
    `Every program ever written is a longer to-do list for exactly this heartbeat.`);
  await guide.next();

  /* ===================== BEAT 5 — closing ===================== */
  guide.say(`Glance back at the bench: <b>sand → switch → gate → adder → memory → clock.</b> Each step was one idea, wired to the next.`);
  await guide.next();
}
