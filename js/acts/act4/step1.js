// ACT 4 · STEP 1 — "CPU vs GPU"
// Reworked 2026-10-25 (Ripu's Act 4 plan, after the Branch Education GPU video). The step
// starts from the CPU the player built in Act 2 and lets the GPU appear out of a real job,
// so the two are told apart by what they are built from, never by a card that compares
// them:
//   0. (course restructure 2026-10-25) the hand-in from Act 3: your packaged chip, its die
//      empty; by the end of the act it is a GPU
//   A. your Act 2 machine is a CPU; a real CPU core adds one big part, the control unit
//   B. a game job: move all 16 corners of a shape 3 steps right; the CPU does it one corner
//      per beat (16 cycles), and the shape bends while it works
//   C. one patch of silicon filled two ways: two CPU cores, or one scheduler and 16
//      lanes; the lane is defined on its own card
//   D. one instruction, +3, to all sixteen lanes: every corner moves in one beat; GPU named
//   In the Lab: the H100 die (switched-off SMs point back to Act 3 step 5), then one SM,
//   whose groups each have a scheduler like the learner's, then (course restructure
//   2026-10-25) the CUDA core: a lane, and the spec-sheet count 132 × 128 = 16,896.
// Determinism: every move rides Anim.tween or sleep and every interaction goes through
// guide.next / guide.button, so a replay lands on the same end state.
import { sleep, svgEl } from '../../engine/util.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { slideInPanel } from '../../engine/components.js';
import { labGpuDie } from './lab.js';

/* ---- the game picture: a 16-cornered star, every corner moved 3 steps (30 units) right ---- */
const SHAPE = { cx: 170, cy: 186, r1: 74, r2: 38 };
const STEP_PX = 10, MOVE = 3;                       // one step = 10 units
const CORNERS = Array.from({ length: 16 }, (_, i) => {
  const a = -Math.PI / 2 + i * Math.PI / 8, r = i % 2 ? SHAPE.r2 : SHAPE.r1;
  return { x: SHAPE.cx + r * Math.cos(a), y: SHAPE.cy + r * Math.sin(a) };
});

function box(parent, x, y, w, h, label, caption, cls = 'tile-bg'){
  const g = svgEl('g');
  g.appendChild(svgEl('rect', { x, y, width: w, height: h, rx: 5, class: cls }));
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
async function fade(nodes, to, dur = 300){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  const from = list.map(n => +(n.style.opacity || (to ? 0 : 1)));
  if (to) list.forEach(n => { n.style.display = ''; });
  await Anim.tween(dur, p => list.forEach((n, i) => { n.style.opacity = String(from[i] + (to - from[i]) * p); }));
  if (!to) list.forEach(n => { n.style.display = 'none'; });
}

export async function step1(){
  guide.title('STEP 1 / 6', '<em>CPU</em> vs <em>GPU</em>');
  guide.cards();

  // Course restructure (2026-10-25): "one beat" -> "one cycle", the word this step now uses.
  const stage = newStage('15', 'Your CPU moves a shape one corner at a time; sixteen lanes move it in one cycle');
  const { svg } = stage;

  /* ============ 0 — the hand-in from Act 3: your packaged chip, its die still empty ====== */
  // Course restructure (2026-10-25): a new opening card. Act 3 ends on "what should an AI
  // chip fill it with?", so the act opens on that chip, its die drawn empty.
  const chip = svgEl('g');
  let pins = '';
  for (let i = 0; i < 9; i++){
    const o = 266 + i * 23;
    pins += `<rect x="${o}" y="88" width="10" height="12" rx="1" class="tile-bg"/>
      <rect x="${o}" y="380" width="10" height="12" rx="1" class="tile-bg"/>
      <rect x="232" y="${o - 106}" width="12" height="10" rx="1" class="tile-bg"/>
      <rect x="476" y="${o - 106}" width="12" height="10" rx="1" class="tile-bg"/>`;
  }
  chip.innerHTML = `${pins}
    <rect x="244" y="100" width="232" height="280" rx="8" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.4"/>
    <rect x="290" y="150" width="140" height="170" rx="3" fill="none" stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="5 4"/>
    <text x="360" y="232" class="lbl" style="fill:var(--ink)">THE DIE</text>
    <text x="360" y="248" class="lbl-faint">empty</text>
    <text x="360" y="72" class="lbl" style="fill:var(--ink)">YOUR CHIP FROM ACT 3</text>`;
  svg.appendChild(chip);
  guide.say(`In Act 3 you printed and packaged a chip. In this act you decide what to build on
    its die, and by the end of the act it is a GPU.`);
  stage.focus(chip, { label: 'what goes on the die?', at: 'right', ring: false });
  await guide.next();
  stage.clearFocus();
  await fade([chip], 0, 280);

  /* ============ A — your Act 2 machine is a CPU, and a real CPU core has a control ===== */

  const cpu = svgEl('g');
  svg.appendChild(cpu);
  cpu.style.opacity = '0';
  box(cpu, 70, 236, 104, 54, 'REGISTER', 'holds a number');
  const add = box(cpu, 224, 236, 104, 54, 'ADDER', 'adds');
  const loop = svgEl('g');
  loop.innerHTML = `<path d="M174 263 H224" class="wire"/>
    <path d="M328 263 H364 V318 H36 V263 H70" class="wire"/>`;
  cpu.appendChild(loop);
  box(cpu, 136, 326, 126, 32, 'CLOCK');
  await fade([cpu], 1, 320);

  guide.say(`This is the machine you built in Act 2: a register, an adder and a clock in one
    loop. Running that loop billions of times a second makes it a <b>CPU</b>.`);
  stage.focus(cpu, { label: 'your act 2 machine', at: 'right' });
  await guide.next();

  stage.clearFocus();
  const control = box(cpu, 70, 96, 258, 112, 'CONTROL UNIT', 'decides what to do next');
  const ctlWire = svgEl('path', { d: 'M199 208 V236', class: 'wire' });
  cpu.appendChild(ctlWire);
  control.style.opacity = '0'; ctlWire.style.opacity = '0';
  await fade([control, ctlWire], 1, 340);
  guide.say(`A real CPU core has one more part, the biggest of all: the <b>control unit</b>. It
    reads each instruction of a program and decides what to do next, which is why one CPU can
    run any program.`);
  stage.focus(control, { label: 'control unit', at: 'right' });
  await guide.next();

  /* ============ B — a game job, done by the CPU one corner per beat ==================== */

  stage.clearFocus();
  // the CPU core moves to the right half, small, and the game's picture opens on the left
  await Anim.tween(560, p => {
    const s = 1 - .42 * p, tx = 404 * p, ty = -36 * p;
    cpu.setAttribute('transform', `translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${s.toFixed(3)})`);
  });
  const cpuCap = svgEl('text', { x: 520, y: 192, class: 'lbl' });
  cpuCap.textContent = 'ONE CPU CORE';
  svg.appendChild(cpuCap);

  const screen = svgEl('g');
  screen.innerHTML = `<rect x="36" y="78" width="300" height="214" rx="6" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.2"/>
    <text x="186" y="70" class="lbl">THE GAME'S PICTURE</text>`;
  svg.appendChild(screen);
  const outline = svgEl('polygon', { fill: 'rgba(29,33,23,.06)', stroke: 'var(--ink)', 'stroke-width': 1.4, 'stroke-linejoin': 'round' });
  const ghost = svgEl('polygon', { fill: 'none', stroke: 'var(--ink-faint)', 'stroke-width': 1, 'stroke-dasharray': '3 3' });
  screen.append(ghost, outline);
  const pos = CORNERS.map(c => ({ ...c }));
  const dots = CORNERS.map(() => { const d = svgEl('circle', { r: 4, fill: 'var(--ink)' }); screen.appendChild(d); return d; });
  const draw = () => {
    outline.setAttribute('points', pos.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
    dots.forEach((d, i) => { d.setAttribute('cx', pos[i].x.toFixed(1)); d.setAttribute('cy', pos[i].y.toFixed(1)); });
  };
  ghost.setAttribute('points', CORNERS.map(p => `${(p.x + MOVE * STEP_PX).toFixed(1)},${p.y.toFixed(1)}`).join(' '));
  draw();
  ghost.style.opacity = '0';
  screen.style.opacity = '0';
  await fade([screen], 1, 360);
  await fade([ghost], 1, 260);

  guide.say(`Here is a job from a game. This shape has 16 corners, and every corner has to
    move 3 steps to the right, to the dashed outline. That is the same sum, <b>+3</b>, done
    sixteen times.`);
  stage.focus(screen, { label: '16 corners, each +3', at: 'bottom', ring: false });
  await guide.next();

  /* the CPU run: one corner per beat, a counter, and the shape bent while it works */
  stage.clearFocus();
  const counter = svgEl('text', { x: 186, y: 322, class: 'lbl-strong' });
  counter.textContent = 'CPU: 0 CYCLES';
  svg.appendChild(counter);
  // Course restructure (2026-10-25): the step used "beat" and "cycle" for the same thing;
  // this card ties them once (as Act 2 step 4 did), and the step says "cycle" from here.
  guide.say(`Give the job to your CPU. Its control unit sends <b>+3</b> to the adder once per
    cycle, one corner at a time. As in Act 2, one cycle is one beat of the clock.`);
  stage.focus([cpu, screen], { label: 'one corner per cycle', at: 'top', ring: false });
  await guide.button('Run it on the CPU ▸');
  stage.clearFocus();
  const addRect = add.querySelector('rect');
  for (let i = 0; i < 16; i++){
    addRect.classList.add('on');
    const x0 = pos[i].x;
    await Anim.tween(150, p => { pos[i].x = x0 + MOVE * STEP_PX * p; draw(); });
    counter.textContent = `CPU: ${i + 1} CYCLE${i ? 'S' : ''}`;
    if (!flow.instant){ SFX.blip(); await sleep(40); }
    addRect.classList.remove('on');
  }

  guide.say(`Sixteen corners took the CPU sixteen cycles, one for each corner. A whole game
    picture has millions of corners.`);
  stage.focus(counter, { label: '16 cycles', at: 'bottom' });
  await guide.next();

  /* ============ C — the same patch of silicon, filled two ways ========================= */

  stage.clearFocus();
  await fade([cpu, cpuCap], 0, 260);
  // the shape goes back, ready for the second run
  CORNERS.forEach((c, i) => { pos[i].x = c.x; });
  draw();
  counter.textContent = '';

  const PA = { x: 372, y: 104, w: 146, h: 176 }, PB = { x: 540, y: 104, w: 146, h: 176 };
  const patches = svgEl('g');
  const coreBlock = y => `<rect x="${PA.x + 8}" y="${y}" width="${PA.w - 16}" height="54" rx="4" class="tile-bg"/>
    <text x="${PA.x + PA.w / 2}" y="${y + 31}" class="lbl" font-size="8.5" style="fill:var(--ink)">CONTROL UNIT</text>
    <rect x="${PA.x + PA.w / 2 - 17}" y="${y + 58}" width="34" height="18" rx="3" class="tile-bg"/>
    <text x="${PA.x + PA.w / 2}" y="${y + 71}" class="lbl" font-size="10" style="fill:var(--ink)">+</text>`;
  let lanes = '';
  for (let i = 0; i < 16; i++){
    const x = PB.x + 9 + (i % 4) * 33, y = PB.y + 52 + Math.floor(i / 4) * 30;
    lanes += `<g class="ln"><rect x="${x}" y="${y}" width="28" height="25" rx="3" class="lane"/>
      <text x="${x + 14}" y="${y + 17}" class="lbl" font-size="11" style="fill:var(--ink-soft)">+</text></g>`;
  }
  patches.innerHTML = `<text x="529" y="90" class="lbl" style="fill:var(--ink)">ONE PATCH OF SILICON, FILLED TWO WAYS</text>
    <g class="pa"><rect x="${PA.x}" y="${PA.y}" width="${PA.w}" height="${PA.h}" rx="6" fill="none" stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="5 4"/>
      ${coreBlock(PA.y + 8)}${coreBlock(PA.y + 92)}
      <text x="${PA.x + PA.w / 2}" y="${PA.y + PA.h + 18}" class="lbl" style="fill:var(--ink)">2 CPU CORES</text></g>
    <g class="pb"><rect x="${PB.x}" y="${PB.y}" width="${PB.w}" height="${PB.h}" rx="6" fill="none" stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="5 4"/>
      <rect x="${PB.x + 8}" y="${PB.y + 8}" width="${PB.w - 16}" height="26" rx="4" class="tile-bg"/>
      <text x="${PB.x + PB.w / 2}" y="${PB.y + 25}" class="lbl" font-size="8" style="fill:var(--ink)">ONE SCHEDULER</text>
      <path d="M${PB.x + PB.w / 2} ${PB.y + 34} V${PB.y + 44} M${PB.x + 10} ${PB.y + 44} H${PB.x + PB.w - 10}" class="wire"/>
      ${lanes}
      <text x="${PB.x + PB.w / 2}" y="${PB.y + PB.h + 18}" class="lbl" style="fill:var(--ink)">16 LANES</text></g>`;
  svg.appendChild(patches);
  patches.style.opacity = '0';
  await fade([patches], 1, 380);

  guide.say(`Here is one patch of silicon, filled two ways. On the left are two whole CPU
    cores, each with its own control unit. On the right are sixteen small adders and one
    <b>scheduler</b>: a simpler control that sends the same instruction to all of them.`);
  stage.focus(patches, { label: 'same area', at: 'bottom', ring: false });
  await guide.next();

  // Course restructure (2026-10-25): the card above already says the scheduler sends one
  // instruction to all of them, so this card no longer repeats it.
  guide.say(`Each of those small adders, holding its own number, is a <b>lane</b>. A lane has
    no control unit of its own.`);
  stage.focus(patches.querySelector('.pb'), { label: 'lane = one adder + its own number', at: 'bottom', ring: false });
  await guide.next();

  /* ============ D — one instruction, sixteen lanes, one cycle ========================= */

  stage.clearFocus();
  guide.say(`Now give the same job to the sixteen lanes. Each lane holds one corner, and the
    scheduler sends <b>+3</b> to all of them at once.`);
  stage.focus([patches.querySelector('.pb'), screen], { label: 'one corner per lane', at: 'top', ring: false });
  await guide.button('Send +3 to all sixteen lanes ▸');
  stage.clearFocus();
  patches.querySelectorAll('.pb .ln rect').forEach(r => r.classList.add('on'));
  await Anim.tween(420, p => { CORNERS.forEach((c, i) => { pos[i].x = c.x + MOVE * STEP_PX * p; }); draw(); });
  counter.textContent = 'LANES: 1 CYCLE  ·  CPU: 16 CYCLES';
  if (!flow.instant) SFX.success();

  guide.aha(`All sixteen corners moved in one cycle, where the CPU needed sixteen.`,
    `A chip built this way, from many lanes that share one scheduler, is a <b>GPU</b> (graphics
     processing unit). It was first built for exactly this job: moving and colouring the
     points of a game's picture.`);
  stage.focus([counter, screen], { ring: false });
  await guide.next();

  /* ============ IN THE LAB — a real GPU, and where its schedulers sit ============ */
  stage.clearFocus();
  const lab = slideInPanel(svg, labGpuDie(), { lab: true });
  lab.focus(['die', 'off']);
  await lab.show();

  guide.lab(`This is the die of NVIDIA's H100 GPU. Each small square on it is an <b>SM</b>
    (streaming multiprocessor): a group of 128 lanes like yours. Of its 144 SMs, the 12
    dashed ones are switched off, like the faulty cores in Act 3 step 5.`, { intro: true });
  await guide.next();

  lab.focus('sm');
  lab.g.querySelector('.a4-q0').classList.add('a4-lit');
  guide.lab(`Inside one SM are four groups of 32 lanes. Each group has its own scheduler, like
    the one you just used: it sends one instruction to all 32 lanes at once. Ignore the boxes
    marked REGISTER FILE for now: you will learn what they are in step 3.`);
  await guide.next();

  // Course restructure (2026-10-25): a new lab card, on the same panel, that names the lane
  // as NVIDIA's CUDA core and ties the H100's spec-sheet count to the die and the SM above
  // (132 SMs switched on × 128 lanes = 16,896). The card above's "4.3.3" became "step 3".
  lab.focus(['die', 'sm']);
  lab.g.querySelectorAll('.a4-q1, .a4-q2, .a4-q3').forEach(q => q.classList.add('a4-lit'));
  guide.lab(`NVIDIA calls each lane a <b>CUDA core</b>. When a spec sheet lists the H100's
    16,896 CUDA cores, it means 132 SMs of 128 lanes, like the ones you just saw.`);
  await guide.next();
  await lab.hide();
}
