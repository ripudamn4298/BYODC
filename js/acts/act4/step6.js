// ACT 4 · STEP 6 — "Assemble the GPU".
// Built to the micro-learning contract in DESIGN_MAKEOVER.md §2 / §5 step 6: one card at a
// time (guide.cards), every card focuses and names the one thing it is about, and the
// interposer is defined on its own card before anything is placed on it. The act closes by
// pointing at the same sixteen lanes the player stamped in step 1.
// Determinism: every interaction goes through flow.ask, the power ramp and the loss values
// are fixed sequences, and every visual change rides Anim.tween or sleep, both replay-aware.
import { laneIcon, tensorCoreIcon } from '../../art/icons.js';
import { sleep, el, svgEl } from '../../engine/util.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeMeter, slideInPanel } from '../../engine/components.js';
import { labGraphicsCard, labServerAndKit, labHeadline } from './lab.js';
import { makeLaneGrid } from '../../engine/lanes.js';
import { CurrentFlow } from '../../engine/pathflow.js';

/* ---- fixed numbers: never generated, so replay lands where the live run landed ---- */
const WATTS = 700;
const LOSSES = [2.4, 1.1, 0.5, 0.2];

/* ---- package geometry (720 × 480 stage units) ---- */
const DIE = { w: 120, h: 112 };
const HBM = { w: 64, h: 96 };
const SLOTS = [
  { x: 196, y: 234, w: HBM.w, h: HBM.h, correct: 'HBM' },
  { x: 300, y: 218, w: DIE.w, h: DIE.h, correct: 'COMPUTE' },
  { x: 460, y: 234, w: HBM.w, h: HBM.h, correct: 'HBM' },
];
const SHELF = { x: 160, y: 330, w: 400, h: 20 };
const LID = { x: 176, y: 180, w: 368, h: 24 };

async function fadeOut(nodes, dur = 300){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(1 - p); }));
  list.forEach(n => { n.style.display = 'none'; });
}
async function fadeIn(nodes, dur = 300){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  list.forEach(n => { n.style.opacity = '0'; n.style.display = ''; });
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(p); }));
}

/* A memory stack, drawn as the tower of chips it is: four dies one on top of the other,
   with the vertical wires that run through them. Same drawing in both stages. */
function drawStack(parent, x, y){
  const g = svgEl('g');
  for (let i = 0; i < 4; i++){
    g.appendChild(svgEl('rect', { x: 0, y: i * 19, width: HBM.w, height: 16, rx: 2, class: 'tile-bg' }));
    // through-silicon vias: short ticks in the gaps, so the tower reads as four chips
    if (i < 3) [16, 32, 48].forEach(vx => {
      g.appendChild(svgEl('line', { x1: vx, y1: i * 19 + 16, x2: vx, y2: i * 19 + 19, class: 'wire' }));
    });
  }
  const cap = svgEl('text', { x: HBM.w / 2, y: 88, class: 'tile-cap' });
  cap.textContent = 'HBM STACK';
  g.appendChild(cap);
  if (x != null) g.setAttribute('transform', `translate(${x} ${y})`);
  parent.appendChild(g);
  return g;
}

/* The GPU die, drawn with what the act built on it: the sixteen lanes (each one MAC unit)
   and one Tensor Core, in the act's two pictures (js/art/icons.js). */
function drawDie(parent){
  const g = svgEl('g');
  g.appendChild(svgEl('rect', { x: 0, y: 0, width: DIE.w, height: DIE.h, rx: 5, class: 'tile-bg' }));
  const parts = svgEl('g');
  let html = '';
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) html += laneIcon(8 + c * 17, 10 + r * 17, 15);
  html += tensorCoreIcon(80, 22, 32, 3);
  parts.innerHTML = html;
  g.appendChild(parts);
  const cap = svgEl('text', { x: DIE.w / 2, y: 92, class: 'tile-cap' });
  cap.textContent = 'GPU DIE';
  const cap2 = svgEl('text', { x: DIE.w / 2, y: 104, class: 'tile-cap' });
  cap2.textContent = '16 LANES · 1 TENSOR CORE';
  cap2.style.fontSize = '5.6px';
  cap2.style.letterSpacing = '.04em';
  g.append(cap, cap2);
  parent.appendChild(g);
  return g;
}

/* The closing recap (Act 4 restructure, 2026-10-25): five rungs from the package down to one
   lane, joined by zoom lines, each named with the step that built it. */
function recapLadder(){
  const g = svgEl('g');
  const W = 118, H = 118, Y = 150, X0 = 22, GAP = 22;
  const xs = [0, 1, 2, 3, 4].map(i => X0 + i * (W + GAP));
  const box = x => `<rect x="${x}" y="${Y}" width="${W}" height="${H}" rx="5" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.3"/>`;
  const zoom = (x, sx, sy, s) => `<rect x="${sx}" y="${sy}" width="${s}" height="${s}" fill="none" stroke="var(--ink)" stroke-width="1.4"/>
    <line x1="${sx + s}" y1="${sy}" x2="${x + W + GAP}" y2="${Y}" stroke="var(--ink-soft)" stroke-width=".7" stroke-dasharray="3 3"/>
    <line x1="${sx + s}" y1="${sy + s}" x2="${x + W + GAP}" y2="${Y + H}" stroke="var(--ink-soft)" stroke-width=".7" stroke-dasharray="3 3"/>`;
  const cap = (i, name, lines) => `<text x="${xs[i] + W / 2}" y="${Y + H + 24}" class="lbl-strong" style="font-size:10px">${name}</text>`
    + lines.map((l, k) => `<text x="${xs[i] + W / 2}" y="${Y + H + 42 + k * 14}" class="lbl-faint" style="font-size:8px">${l}</text>`).join('');
  const stackMini = (x, y) => [0, 1, 2, 3].map(k => `<rect x="${x}" y="${y + k * 9}" width="18" height="7" rx="1" fill="var(--paper)" stroke="var(--ink-soft)" stroke-width=".7"/>`).join('');
  let html = `<text x="360" y="104" class="lbl-strong" style="font-size:11px">WHAT YOU BUILT IN ACT 4</text>
    <text x="360" y="120" class="lbl-faint" style="font-size:8px">FROM THE PACKAGE DOWN TO ONE LANE</text>`;

  /* 1 · the package */
  let x = xs[0];
  // Course restructure (2026-10-25): the package rung sits in its own group, so the hand-off
  // card after the recap can light it alone.
  html += `<g data-rung="package">` + box(x) + `<rect x="${x + 8}" y="${Y + 14}" width="${W - 16}" height="9" rx="2" fill="var(--amber-soft)" stroke="var(--amber)" stroke-width="1"/>
    ${stackMini(x + 12, Y + 46)}${stackMini(x + W - 30, Y + 46)}
    <rect x="${x + 36}" y="${Y + 36}" width="46" height="56" rx="2" fill="#e3ddca" stroke="var(--ink)" stroke-width="1"/>
    <rect x="${x + 8}" y="${Y + 98}" width="${W - 16}" height="7" rx="1.5" fill="var(--paper)" stroke="var(--ink-soft)" stroke-width=".8"/>`
    + zoom(x, x + 36, Y + 36, 46) + cap(0, 'THE PACKAGE', ['DIE + HBM (4.5)', 'COOLER (4.6)']) + `</g>`;

  /* 2 · the die, full of SMs */
  x = xs[1];
  html += box(x);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) html += `<rect x="${x + 11 + c * 19.6}" y="${Y + 11 + r * 19.6}" width="16" height="16" rx="1.5" fill="var(--paper)" stroke="var(--ink-soft)" stroke-width=".7"/>`;
  html += zoom(x, x + 11 + 19.6, Y + 11 + 19.6, 16) + cap(1, 'THE GPU DIE', ['MANY SMs (4.1)']);

  /* 3 · one SM: four groups and shared memory */
  x = xs[2];
  html += box(x);
  for (let k = 0; k < 4; k++){
    const gx = x + 10 + (k % 2) * 51, gy = Y + 10 + Math.floor(k / 2) * 42;
    html += `<rect x="${gx}" y="${gy}" width="47" height="38" rx="2" fill="var(--paper)" stroke="var(--ink-soft)" stroke-width=".8"/>
      <rect x="${gx + 3}" y="${gy + 3}" width="41" height="4" fill="var(--ink)"/>`;
  }
  html += `<rect x="${x + 10}" y="${Y + 96}" width="${W - 20}" height="12" rx="1.5" fill="#e6dcc0" stroke="var(--ink-soft)" stroke-width=".8"/>
    <text x="${x + W / 2}" y="${Y + 105}" class="lbl" style="font-size:6px">SHARED MEMORY</text>`
    + zoom(x, x + 10, Y + 10, 47) + cap(2, 'ONE SM', ['4 GROUPS (4.1)', 'SHARED MEMORY (4.4)']);

  /* 4 · one group: scheduler, registers, lanes, a Tensor Core */
  x = xs[3];
  html += box(x) + `<rect x="${x + 8}" y="${Y + 8}" width="${W - 16}" height="11" rx="1.5" fill="var(--ink)"/>
    <text x="${x + W / 2}" y="${Y + 16.5}" class="lbl" style="font-size:6px;fill:var(--paper-high)">SCHEDULER</text>
    <rect x="${x + 8}" y="${Y + 23}" width="${W - 16}" height="11" rx="1.5" fill="#efe9da" stroke="var(--ink)" stroke-width=".8"/>
    <text x="${x + W / 2}" y="${Y + 31.5}" class="lbl" style="font-size:6px">REGISTERS</text>`;
  for (let i = 0; i < 12; i++) html += laneIcon(x + 9 + (i % 4) * 17, Y + 42 + Math.floor(i / 4) * 17, 14);
  html += tensorCoreIcon(x + 80, Y + 50, 30, 3)
    + zoom(x, x + 9, Y + 42, 14) + cap(3, 'ONE GROUP', ['SCHEDULER (4.1)', 'REGISTERS (4.3)', 'TENSOR CORE (4.4)']);

  /* 5 · one lane: one MAC unit */
  x = xs[4];
  html += box(x) + laneIcon(x + 24, Y + 24, 70) + cap(4, 'ONE LANE', ['ONE MAC UNIT (4.2)']);

  g.innerHTML = html;
  return g;
}

export async function step6(){
  guide.title('STEP 6 / 6', 'Assemble <em>the GPU</em>');
  guide.cards();

  const stage = newStage('20', 'One package: a GPU die and two memory stacks on an interposer, under a cooler');
  const { svg, controls } = stage;

  /* ============ CARD 1 — the package, assembled while you watch (Act 4 restructure,
     2026-10-25). Act 3 already taught packaging, so the old drag task became one animated
     card: the interposer, then the die drops into the middle, then a stack slides in on
     each side and the short links appear. Anim.tween lands the end state on replay. */

  const shelf = svgEl('g');
  shelf.appendChild(svgEl('rect', { x: SHELF.x, y: SHELF.y, width: SHELF.w, height: SHELF.h, rx: 3, class: 'tile-bg' }));
  const shelfCap = svgEl('text', { x: SHELF.x + SHELF.w / 2, y: SHELF.y + 36, class: 'tile-cap' });
  shelfCap.textContent = 'INTERPOSER';
  shelf.appendChild(shelfCap);
  svg.appendChild(shelf);

  const part = (draw, x, y) => {
    const outer = svgEl('g');
    const inner = svgEl('g', { transform: `translate(${x} ${y})` });
    draw(inner);
    outer.appendChild(inner);
    svg.appendChild(outer);
    outer.style.opacity = '0';
    return outer;
  };
  const dieG = part(drawDie, SLOTS[1].x, SLOTS[1].y);
  const leftG = part(g => drawStack(g), SLOTS[0].x, SLOTS[0].y);
  const rightG = part(g => drawStack(g), SLOTS[2].x, SLOTS[2].y);
  const links = svgEl('g');
  [[260, 300], [420, 460]].forEach(([x1, x2]) => {
    links.appendChild(svgEl('line', { x1, y1: 290, x2, y2: 290, class: 'wire' }));
  });
  svg.appendChild(links);
  links.style.opacity = '0';
  shelf.style.opacity = '0';

  const ease = k => 1 - (1 - Math.min(1, Math.max(0, k))) ** 3;
  await Anim.tween(1700, q => {
    const t = q * 1700;
    shelf.style.opacity = ease(t / 300).toFixed(2);
    const d = ease((t - 300) / 450);
    dieG.style.opacity = Math.min(1, d * 2).toFixed(2);
    dieG.setAttribute('transform', `translate(0 ${(-70 * (1 - d)).toFixed(1)})`);
    const l = ease((t - 750) / 450), r = ease((t - 900) / 450);
    leftG.style.opacity = Math.min(1, l * 2).toFixed(2);
    leftG.setAttribute('transform', `translate(${(-90 * (1 - l)).toFixed(1)} 0)`);
    rightG.style.opacity = Math.min(1, r * 2).toFixed(2);
    rightG.setAttribute('transform', `translate(${(90 * (1 - r)).toFixed(1)} 0)`);
    links.style.opacity = ease((t - 1400) / 300).toFixed(2);
  }, q => q);

  guide.say(`Here the whole act goes into one package. Your <b>GPU die</b>, with its lanes and
    Tensor Core, sits in the middle of the <b>interposer</b> (the silicon shelf from Act 3 step 4),
    with an HBM stack on each side, so the wires between them are short.`);
  stage.focus([shelf, dieG, leftG, rightG, links], { label: 'one package', at: 'top', ring: false });
  await guide.next();

  /* ============ CARD 2 — the heat, read off a meter ================================ */

  stage.clearFocus();
  const meter = makeMeter(controls, 'POWER DRAW');
  const setPower = p => {
    meter.fill.style.width = `${(86 * p).toFixed(1)}%`;
    meter.out.textContent = `≈ ${Math.round(p * WATTS / 10) * 10} W`;
  };
  await Anim.tween(1200, setPower);
  setPower(1);

  guide.say(`Every transistor that flips turns a little power into heat. Billions of flips a
    second on this die add up to about 700 watts, which the meter under the stage shows.`);
  stage.focus(dieG, { label: 'GPU die', at: 'left' });
  await guide.next();

  /* ============ CARD 3 — the cooler, dropped on ==================================== */

  stage.clearFocus();
  const cooler = svgEl('g');
  const body = svgEl('rect', { x: LID.x, y: LID.y, width: LID.w, height: LID.h, rx: 4, class: 'tile-bg' });
  body.style.fill = 'var(--amber-soft)';
  body.style.stroke = 'var(--amber)';
  cooler.appendChild(body);
  for (let fx = LID.x + 14; fx < LID.x + LID.w - 6; fx += 16){
    const fin = svgEl('line', { x1: fx, y1: LID.y - 14, x2: fx, y2: LID.y });
    fin.style.stroke = 'var(--amber)';
    fin.style.strokeWidth = '1.2';
    cooler.appendChild(fin);
  }
  const coolCap = svgEl('text', { x: 360, y: LID.y + 16, class: 'tile-cap' });
  coolCap.textContent = 'COOLER';
  cooler.appendChild(coolCap);
  svg.appendChild(cooler);
  cooler.style.opacity = '0';
  await Anim.tween(520, q => {
    const e = ease(q);
    cooler.style.opacity = Math.min(1, e * 2).toFixed(2);
    cooler.setAttribute('transform', `translate(0 ${(-60 * (1 - e)).toFixed(1)})`);
  });
  if (!flow.instant) SFX.flow();

  guide.say(`A <b>cooler</b> is a metal lid with fins that takes heat off the die and passes it
    into the air. All 700 watts have to leave through it, or the chip overheats.`);
  stage.focus(cooler, { label: 'heat leaves here', at: 'top' });
  await guide.next();

  /* ============ CARDS 9-12 — the training loop ==================================== */

  stage.clearFocus();
  const stage2 = newStage('20', 'A training pass: data streaming from memory into the sixteen lanes');
  const svg2 = stage2.svg, controls2 = stage2.controls;

  const src = svgEl('g');
  svg2.appendChild(src);
  drawStack(src, 60, 209);
  const srcLbl = svgEl('text', { x: 92, y: 196, class: 'lbl-strong' });
  srcLbl.textContent = 'TRAINING DATA';
  src.appendChild(srcLbl);

  const wire = svgEl('path', { d: 'M124 257 H250', class: 'wire' });
  svg2.appendChild(wire);
  const flowLayer = svgEl('g');
  svg2.appendChild(flowLayer);
  const dataFlow = new CurrentFlow(wire, { n: 9, layer: flowLayer });

  const grid = makeLaneGrid(svg2, { x: 250, y: 140, cols: 4, rows: 4, cell: 54, gap: 6 });

  const lossG = svgEl('g');
  lossG.appendChild(svgEl('rect', { x: 528, y: 220, width: 140, height: 74, rx: 5, class: 'tile-bg' }));
  const lossCap = svgEl('text', { x: 598, y: 243, class: 'tile-cap' });
  lossCap.textContent = 'LOSS';
  const lossVal = svgEl('text', { x: 598, y: 275, class: 'gate-lbl' });
  lossVal.style.fontSize = '22px';
  lossVal.textContent = LOSSES[0].toFixed(1);
  lossG.append(lossCap, lossVal);
  svg2.appendChild(lossG);

  // Course restructure (2026-10-25): the two training-intro cards merged into one, and
  // inference named against it.
  guide.say(`<b>Training</b> is how an AI model learns its weights. On each pass, data streams
    in from memory, and the lanes adjust the weights a little. Using the trained weights
    afterwards is inference, as in step&nbsp;4.`);
  stage2.focus([src, wire, grid.g], { label: 'one pass', at: 'bottom' });
  await guide.next();

  stage2.clearFocus();
  guide.say(`The loss is one number that says how wrong the model's answers are right now.
    It should fall on every pass.`);
  stage2.focus(lossG, { label: 'loss', at: 'top' });
  await guide.next();

  /* REVIEW_NOTES N-069: the task gets its own card, says which button and how many times,
     and reports after every pass */
  const runBtn = el('button', { class: 'btn primary', 'data-label': 'run-a-training-pass' }, 'RUN A TRAINING PASS ▸');
  controls2.appendChild(runBtn);
  guide.say(`<b>Your goal is to train the model: click RUN A TRAINING PASS, under the stage,
    three times.</b> Watch the loss after each pass.`);

  async function runPass(loss){
    dataFlow.setSpeed(200);
    for (let r = 0; r < 4; r++){
      for (let c = 0; c < 4; c++) grid.setActive(r * 4 + c, true);
      SFX.blip();
      await sleep(80);
    }
    await sleep(150);
    dataFlow.setSpeed(0);
    grid.flashAll(false);
    lossVal.textContent = loss.toFixed(1);
  }

  await flow.ask(async replay => {
    const passes = LOSSES.slice(1);
    if (replay !== undefined){
      stage2.clearFocus();
      for (const l of passes) await runPass(l);
      runBtn.disabled = true; runBtn.classList.add('used');
      return replay;
    }
    const cancel = flow.hintAfter(12000, `The button is under the stage: RUN A TRAINING PASS. Click it
      three times.`);
    for (let i = 0; i < passes.length; i++){
      await new Promise(res => runBtn.addEventListener('click', () => { SFX.click(); res(); }, { once: true }));
      if (i === 0){ stage2.clearFocus(); cancel(); }     // the loss stays lit until the first pass runs
      await runPass(passes[i]);
      if (i < passes.length - 1){
        guide.say(`Pass ${i + 1} of ${passes.length}: the loss fell from ${LOSSES[i].toFixed(1)} to
          ${passes[i].toFixed(1)}. <b>Click RUN A TRAINING PASS again.</b>`);
      }
    }
    runBtn.disabled = true; runBtn.classList.add('used');
    return true;
  });

  guide.say(`The loss went 2.4, then 1.1, then 0.5, then 0.2. Each pass left the model a
    little less wrong than the pass before.`);
  stage2.focus(lossG, { label: 'loss', at: 'top' });
  await guide.next();

  stage2.clearFocus();
  stage2.focus(grid.g, { label: '16 lanes, from step 1', at: 'bottom' });
  // Course restructure (2026-10-25): the aha points back at the game job in step 1; the
  // lanes are no longer stamped there, and physics is taught nowhere in the course.
  guide.aha(`Training ran on the same sixteen lanes that moved the game's corners in step 1.`,
    `Both jobs send one instruction to many numbers at once.`);
  await guide.next();

  /* ============ CARD — the closing recap: everything built, package down to one lane ===
     Act 4 restructure (2026-10-25): one zoom ladder, each rung marked with the step that
     built it. Drawn with the act's own pictures (laneIcon, tensorCoreIcon, drawStack). */
  stage2.clearFocus();
  const stage3 = newStage('20', 'Everything built in Act 4, from the package down to one lane');
  const svg3 = stage3.svg;
  svg3.appendChild(recapLadder());
  guide.say(`Here is everything you built in this act, from the whole package down to one lane.
    A real GPU is this same ladder, with many more SMs on the die and many more lanes in each
    group.`);
  await guide.next();

  /* Course restructure (2026-10-25): the hand-off to Act 5. One model's weights do not fit
     in one GPU's HBM: GPT-3, 175 billion weights × 2 bytes (16 bits) = 350 GB; an H100
     holds 80 GB; 350 ÷ 80 = 4.4, so five GPUs (Brown et al. 2020; NVIDIA H100 datasheet). */
  const pkgRung = svg3.querySelector('[data-rung="package"]');
  guide.say(`An H100 holds 80 GB in its HBM. GPT-3 (2020) has 175 billion weights, and at 16
    bits each they fill 350 GB, so just holding it takes five GPUs.`);
  stage3.focus(pkgRung, { label: '80 GB of HBM', at: 'top' });
  await guide.next();
  stage3.clearFocus();

  /* ============ IN THE LAB — an opened graphics card, a server, a dev kit (§6d rule 8)
     Sources in lab.js: RTX 4090 (24 GB on a 384-bit bus, so 12 chips; 450 W), the
     nvidia-smi readout of an H100 server, the Jetson Orin Nano developer kit. */
  const card = slideInPanel(svg3, labGraphicsCard(), { lab: true });
  card.focus(['gpu', 'board', 'cooler']);
  await card.show();

  guide.lab(`Your package of die, memory and cooler is what sits on every graphics card. This
    one is opened, with its cooler lifted off, and the GPU is the square in the middle of the
    board.`, { intro: true });
  await guide.next();

  card.focus(['mem', 'board']);
  guide.lab(`The black chips around the GPU are its memory. A gaming card such as the RTX 4090
    has 12 of them, holding 24 GB, and together they deliver about 1 TB/s, under a third of
    the H100's HBM.`);
  await guide.next();

  const desk = slideInPanel(svg3, labServerAndKit(), { lab: true });
  desk.focus('smi');
  await card.swapTo(desk);      // N-053: no flash of the stage between panels
  guide.lab(`In a data centre, an H100 has no fans of its own, because the server cools it. The
    command <b>nvidia-smi</b> shows it at work, drawing 511 watts of its 700-watt limit, the
    figure your meter showed. Spec sheets call that limit the <b>TDP</b> (thermal design
    power).`);   // Course restructure (2026-10-25): TDP named
  await guide.next();

  desk.focus('kit');
  guide.lab(`You do not need a data centre to try this. NVIDIA's Jetson Orin Nano developer
    kit is a small board whose GPU has 1,024 lanes and 32 Tensor Cores. It costs $249 and
    runs on 7 to 25 watts.`);
  await guide.next();

  /* Course restructure (2026-10-25): the last lab card reads a real headline with the act's
     parts. NVIDIA announced Rubin with 50 petaflops of FP4 and 288 GB of HBM4 (GTC 2025);
     FP4 maths runs on the Tensor Cores. 50 PF = 50 × 10^15 = 50,000 trillion a second. */
  const news = slideInPanel(svg3, labHeadline(), { lab: true });
  news.focus(null);
  await desk.swapTo(news);
  guide.lab(`Now you can read a headline like this. 50 petaflops of FP4 is 50,000 trillion
    operations a second on 4-bit numbers, from the Tensor Cores. 288 GB is what the HBM stacks
    beside the die hold.`);
  await guide.next();
  await news.hide();
}
