// ACT 4 · STEP 5 / 5 — "Assemble the NV-1" (interposer placer, cooler, power meter, training loop).
// Placer on an interposer cross-section: COMPUTE die center, 2 HBM stacks flanking it, a decoy
// lone-CPU tile that fits nowhere. Then cooler drops on; the Act-1 heat callback returns at
// kilowatt scale. Final demo: a toy training loop (CurrentFlow + LaneGrid + loss meter ticking
// down). Per HANDOFF §5 ACT4 STEP4.
import { sleep, el, svgEl } from '../../engine/util.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makePlacer, makeMeter, makeChip } from '../../engine/components.js';
import { makeLaneGrid } from '../../engine/lanes.js';
import { CurrentFlow } from '../../engine/pathflow.js';

export async function step5(){
  guide.title('STEP 5 / 5 · NANOVOLT AI', 'Assemble <em>the NV-1</em>');

  guide.say(`The aim of this step: assemble everything you've built this act into one package, then watch it learn. Two terms. A <b>die</b> is one finished chip of silicon — here the <b>compute die</b> holds your sixteen lanes. An <b>interposer</b> is a silicon shelf underneath that carries the die and its memory side by side and wires them together over the shortest possible distance. This is an interposer cross-section, seen edge-on. <em>Place the tiles.</em>`);

  const { svg, controls } = newStage('17', 'Interposer assembly: compute die + HBM stacks');

  const SLOTS = [
    { x: 90,  y: 190, w: 110, h: 150, correct: 'HBM' },
    { x: 305, y: 170, w: 150, h: 190, correct: 'COMPUTE' },
    { x: 520, y: 190, w: 110, h: 150, correct: 'HBM' },
  ];
  const slots = SLOTS.map(s => {
    const rect = svgEl('rect', { x: s.x, y: s.y, width: s.w, height: s.h, rx: 8, class: 'slot' });
    const q = svgEl('text', { x: s.x + s.w / 2, y: s.y + s.h / 2 + 9, class: 'slot-q' }); q.textContent = '?';
    svg.append(rect, q);
    return { ...s, rect, q, value: null, tile: null };
  });

  // interposer base beneath the slots
  const base = svgEl('rect', { x: 60, y: 360, width: 600, height: 22, rx: 3, class: 'tile-bg' });
  svg.insertBefore(base, slots[0].rect);
  const baseLbl = svgEl('text', { x: 360, y: 400, class: 'lbl-faint' }); baseLbl.textContent = 'INTERPOSER — silicon shelf, package substrate below';
  svg.appendChild(baseLbl);

  function bigTile(value, label, cap, w, h, sub){
    const g = svgEl('g', { class: 'tile', 'data-part': value.toLowerCase(), 'aria-label': label });
    g.innerHTML = `
      <rect width="${w}" height="${h}" rx="8" class="tile-bg"/>
      <text x="${w / 2}" y="${h / 2 - 2}" class="gate-lbl" font-size="13">${label}</text>
      <text x="${w / 2}" y="${h / 2 + 16}" class="lbl-faint">${cap}</text>`
      + (sub ? `<text x="${w / 2}" y="${h / 2 + 30}" class="lbl-faint">${sub}</text>` : '');
    svg.appendChild(g);
    return { g, value, w, h, home: null, tx: 0, ty: 0, slot: null };
  }
  const tiles = [
    bigTile('HBM', 'HBM STACK', 'memory, stacked', 110, 150),
    bigTile('COMPUTE', 'COMPUTE DIE', '16 lanes', 150, 190, 'systolic tensor engines'),
    bigTile('HBM', 'HBM STACK', 'memory, stacked', 110, 150),
    bigTile('CPU', 'CPU HEARTBEAT', 'one lone worker', 100, 90),
  ];
  tiles[0].home = { x: 40, y: 300 };
  tiles[1].home = { x: 200, y: 300 };
  tiles[2].home = { x: 420, y: 300 };
  tiles[3].home = { x: 580, y: 320 };

  guide.say(`An <b>HBM stack</b> is a tower of memory chips stacked vertically to sit close to the die (the high-bandwidth memory from the last step). The tray holds two <b>HBM STACK</b> tiles, one <b>COMPUTE DIE</b>, and one leftover — a lone <b>CPU HEARTBEAT</b> tile that doesn't belong here. Place a stack on each side of the die so memory is close on <em>both</em> sides; the CPU already had its moment, back in Act 2.`);

  const placer = makePlacer({
    svg, tiles, slots,
    validate: v => v[0] === 'HBM' && v[1] === 'COMPUTE' && v[2] === 'HBM',
    onWrong: () => guide.note(`The compute die needs memory flanking it on both sides — two HBM stacks, one each side. The lone CPU tile had its moment back in Act 2; it doesn't fit here.`),
  });

  await flow.ask(async replay => {
    if (replay !== undefined){ placer.autoPlace(); return replay; }
    await placer.done;
    return true;
  });

  await sleep(400);
  tiles.forEach(t => { if (!t.slot) t.g.style.opacity = '0'; });
  slots.forEach(s => { s.rect.style.opacity = '0'; s.q.style.opacity = '0'; });

  guide.say(`Sealed: compute in the middle, memory close on both flanks, every via as short as it can be. Now the package lands on a board — and it needs a lid.`);
  await guide.next();

  /* ---------- cooler drop ---------- */
  const coolerBtn = el('button', { class: 'btn primary', 'data-label': 'drop-cooler' }, 'DROP THE COOLER ▸');
  controls.appendChild(coolerBtn);
  const meter = makeMeter(controls, 'POWER DRAW');

  guide.say(`A <b>cooler</b> is a metal lid — a heat spreader with fins — that pulls the chip's heat up and out; every switch that flips turns a little power into heat, so a chip this busy needs one. Recall Act 1: one CMOS switch, flipping once, drew a puff of power too small for the meter to even twitch. Now imagine <b>billions</b> of those switches, flipping billions of times a second, all at once. <em>Drop the cooler</em> and watch the meter wake up.`);

  await flow.ask(async replay => {
    if (replay !== undefined){
      renderCooler();
      meter.fill.style.width = '86%';
      meter.out.textContent = '≈ 700 W';
      return replay;
    }
    await new Promise(res => coolerBtn.addEventListener('click', () => { SFX.click(); res(); }, { once: true }));
    renderCooler();
    await sleep(500);
    meter.fill.style.transition = 'width 1.1s ease';
    meter.fill.style.width = '86%';
    let shown = 0;
    const target = 700;
    const iv = setInterval(() => {
      shown = Math.min(target, shown + 60);
      meter.out.textContent = `≈ ${shown} W`;
      if (shown >= target) clearInterval(iv);
    }, 90);
    await sleep(1100);
    coolerBtn.disabled = true;
    return true;
  });

  function renderCooler(){
    if (svg.querySelector('.nv1-cooler')) return;
    const cooler = svgEl('g', { class: 'nv1-cooler' });
    cooler.innerHTML = `<rect x="70" y="150" width="580" height="26" rx="4" class="tile-bg"/>
      <text x="360" y="168" class="lbl-strong">COOLER — heat spreader + fins</text>`;
    svg.appendChild(cooler);
  }

  guide.aha(`<b>≈700 watts.</b> One flip was too small to see. A few billion flips a second, across sixteen lanes times however many you stamp, adds up to a furnace on a five-inch square. That's not a bug in the design — it's the honest cost of doing this much math this fast.`);
  await guide.next();

  /* ---------- final demo: toy training loop ---------- */
  guide.say(`One last thing before this GPU ships: watch it actually <b>think</b>. A <b>training loop</b> is one repeated pass: data streams in from memory, the lanes chew on it, and the chip nudges its weights to do slightly better. The <b>loss</b> is a single score for how wrong the chip currently is — lower is better — so it should fall a little every pass. Run a few passes and watch it drop.`);

  const { svg: svg2, controls: controls2 } = newStage('17', 'Toy training loop: data streaming into the lane grid');

  const srcX = 70, srcY = 240;
  svg2.appendChild(svgEl('text', { x: srcX, y: srcY - 16, class: 'lbl-strong', 'text-anchor': 'middle' })).textContent = 'TRAINING DATA';
  svg2.appendChild(svgEl('circle', { cx: srcX, cy: srcY, r: 4.5, class: 'node-dot' }));
  const gridX = 220, gridY = 120;
  const wire = svgEl('path', { d: `M${srcX} ${srcY} H${gridX - 20}`, class: 'wire' });
  svg2.appendChild(wire);
  const path = svgEl('path', { d: `M${srcX} ${srcY} H${gridX - 20}`, fill: 'none', stroke: 'none' });
  svg2.appendChild(path);
  const flowLayer = svgEl('g'); svg2.appendChild(flowLayer);
  const dataFlow = new CurrentFlow(path, { n: 10, layer: flowLayer });

  const grid = makeLaneGrid(svg2, { x: gridX, y: gridY, cols: 4, rows: 4, cell: 60, gap: 7 });
  const lossChip = makeChip(controls2, 'LOSS: <b>2.4</b>');
  const runBtn = el('button', { class: 'btn primary', 'data-label': 'run-training-pass' }, 'RUN A TRAINING PASS ▸');
  controls2.appendChild(runBtn);

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
    lossChip.set(`LOSS: <b>${loss.toFixed(1)}</b>`);
  }

  await flow.ask(async replay => {
    const losses = [1.1, 0.5, 0.2];
    if (replay !== undefined){
      for (const l of losses) await runPass(l);
      runBtn.disabled = true; runBtn.classList.add('used');
      return replay;
    }
    for (const l of losses){
      await new Promise(res => runBtn.addEventListener('click', () => { SFX.click(); res(); }, { once: true }));
      await runPass(l);
    }
    runBtn.disabled = true;
    return true;
  });

  guide.aha(`<b>2.4 → 1.1 → 0.5 → 0.2.</b> Loss falling, pass after pass — that's learning, and underneath it is nothing mystical: the same lanes that raced a list of eight numbers in step one, and <b>your systolic squares eating the matrices</b>, now grinding through millions of numbers over and over. Graphics, physics, AI — <b>one machine</b>, because it's all the same move: multiply lists, add lists, repeat.`);
  await guide.next();
}
