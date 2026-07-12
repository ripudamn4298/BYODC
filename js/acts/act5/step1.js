// ACT 5 · STEP 1 — "From one to a rack".
// Beats: one GPU trains a toy; real models need thousands acting as ONE. First
// rung: a NODE — 8 GPU tiles into a sled + a fat interconnect spine. Then stamp
// sleds down a RackElevation while an amber power readout climbs. Test: node
// wiring — connect 4 GPUs all-to-all (6 links; the n(n-1)/2 aha).
import { svgEl, el, sleep, waitFor } from '../../engine/util.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeRackElevation, makeTopoBoard } from '../../engine/dc.js';
import { makePlacer, makeMeter } from '../../engine/components.js';

export async function step1(){
  guide.title('STEP 1 / 4 · NANOVOLT CLOUD', 'From one <em>to a rack</em>');

  /* ===================== BEAT 1 — one GPU isn't enough ===================== */
  guide.say(`A <b>GPU</b> is the processor that does the training — the chip you built in Act 4. One GPU can train a small model, but a real model needs <b>thousands</b> of GPUs working as if they were <em>one</em>: the same weights, updated together, thousands of times a second. Over the next four steps you'll build up to that, starting from a single box. In this step: you'll pack 8 GPUs into a <b>node</b>, stack nodes into a <b>rack</b>, and see why you can't simply wire every GPU to every other one.`);
  await guide.next();

  /* ===================== BEAT 2 — build the node ===================== */
  const { svg, controls } = newStage('18', 'Node assembly — GPUs into a sled');
  guide.say(`A <b>node</b> is one box of GPUs. It's built on a <b>sled</b> — a flat tray that holds the chips and slides into a rack. The sled carries <b>8 GPUs</b> plus an <b>interconnect spine</b>: a direct copper backbone that lets every GPU on the sled send data straight to any other, without routing through the CPU. Your first job: fill the sled. <em>Drag the 8 GPU tiles into the empty slots.</em>`);

  const sledX = 190, sledY = 220, sledW = 340, slotSize = 34;
  const sledRect = svgEl('rect', { x: sledX, y: sledY, width: sledW, height: 92, rx: 6, class: 'rack-frame' });
  const spine = svgEl('rect', { x: sledX + 10, y: sledY + 40, width: sledW - 20, height: 12, rx: 3, class: 'sled on' });
  const spineLbl = svgEl('text', { x: sledX + sledW / 2, y: sledY + 108, class: 'lbl-strong' });
  spineLbl.textContent = 'INTERCONNECT SPINE';
  svg.append(sledRect, spine, spineLbl);

  const slots = [];
  for (let i = 0; i < 8; i++){
    const sx = sledX + 18 + i * ((sledW - 36) / 7) - slotSize / 2;
    const sy = sledY + 12;
    const rect = svgEl('rect', { x: sx, y: sy, width: slotSize, height: slotSize, rx: 4, class: 'slot' });
    svg.appendChild(rect);
    slots.push({ x: sx, y: sy, w: slotSize, h: slotSize, rect, value: null, tile: null, correct: 'GPU' });
  }

  const tiles = [];
  for (let i = 0; i < 8; i++){
    const g = svgEl('g', { class: 'tile', 'aria-label': `GPU ${i + 1}` });
    g.innerHTML = `<rect width="30" height="30" rx="4" class="tile-bg"/><circle cx="15" cy="15" r="6" fill="var(--blue)"/>`;
    svg.appendChild(g);
    const home = { x: 60 + (i % 4) * 44, y: 350 + Math.floor(i / 4) * 46 };
    tiles.push({ g, value: 'GPU', w: 30, h: 30, home, tx: 0, ty: 0, slot: null });
  }

  const meter = makeMeter(controls, 'RACK POWER DRAW');
  function setMeter(frac, label){
    meter.fill.style.width = `${Math.round(frac * 100)}%`;
    meter.out.textContent = label;
  }
  setMeter(0, '≈ 0 kW (holding)');

  const placer = makePlacer({
    svg, tiles, slots,
    validate: v => v.every(x => x === 'GPU'),
    onWrong: () => guide.note(`Every slot on the sled wants a GPU — keep going.`),
    onPlace: () => {
      const n = slots.filter(s => s.value).length;
      setMeter(n / 8 * .12, `≈ ${(n * 0.9).toFixed(1)} kW (holding)`);
    },
  });

  await flow.ask(async replay => {
    if (replay !== undefined){ placer.autoPlace(); setMeter(.12, '≈ 7.2 kW (holding)'); return replay; }
    await placer.done;
    return true;
  });

  guide.say(`Eight GPUs, one spine: that's one node. It draws <b>≈7 kW</b> — about what a small house uses — from a box you could carry.`);
  await guide.next();

  /* ===================== BEAT 3 — stamp the rack ===================== */
  const { svg: svg2, controls: controls2 } = newStage('18', 'Rack elevation — stamping sleds');
  guide.say(`A <b>rack</b> is the standing frame that holds a stack of nodes — here, 8 of them. Fill it by copying that one node up the frame. <em>Press "Stamp a sled" eight times</em> and watch the power readout: each node adds its own ≈7 kW.`);

  const rack = makeRackElevation(svg2, { x: 260, y: 46, w: 170, slots: 8, slotH: 42 });
  const rackLbl = svgEl('text', { x: 345, y: 40, class: 'lbl-strong' });
  rackLbl.textContent = 'RACK — 8 NODES';
  svg2.appendChild(rackLbl);

  const meter2 = makeMeter(controls2, 'RACK POWER DRAW');
  const fillBtn = el('button', { class: 'btn primary', 'data-label': 'stamp-sled' }, 'Stamp a sled ▸');
  controls2.appendChild(fillBtn);

  function drawMeter2(n){
    const kw = n * 7.2;
    meter2.fill.style.width = `${Math.min(100, n / 8 * 100)}%`;
    meter2.out.textContent = `≈ ${kw.toFixed(1)} kW (holding)`;
  }
  drawMeter2(0);

  await flow.ask(async replay => {
    if (replay !== undefined){
      rack.fill(8); drawMeter2(8); fillBtn.disabled = true; fillBtn.classList.add('used');
      return replay;
    }
    let n = 0;
    await new Promise(res => {
      fillBtn.addEventListener('click', async () => {
        SFX.click();
        n++;
        rack.fill(n);
        drawMeter2(n);
        if (n >= 8){ fillBtn.disabled = true; fillBtn.classList.add('used'); await sleep(300); res(); }
      });
    });
    return true;
  });

  guide.aha(`<b>≈58 kW.</b> One filled rack draws more power, continuously, than the whole street it sits on.`,
    `That's a full rack: 8 nodes, 64 GPUs. Powering and cooling it is now its own problem — the subject of step 2.`);
  await guide.next();

  /* ===================== BEAT 4 — THE TEST: node wiring, n(n-1)/2 ===================== */
  const { svg: svg3, controls: controls3 } = newStage('18', 'All-to-all GPU wiring');
  guide.say(`Back to one sled. Inside a node the GPUs are wired <b>all-to-all</b>: every GPU has a direct link to every other one, so no message needs a middleman. Here that's shown with 4 GPUs instead of 8. Your job: wire every pair, and count the links it takes. <em>Click one GPU, then another, to draw a link between them.</em>`);

  const board = makeTopoBoard(svg3);
  const positions = [[280, 150], [440, 150], [280, 310], [440, 310]];
  positions.forEach((p, i) => board.addNode(`g${i}`, p[0], p[1], 'rack', `GPU ${i + 1}`));
  const linkChip = el('div', { class: 'chip' }, 'LINKS WIRED: <b>0 / 6</b>');
  controls3.appendChild(linkChip);

  let wired = 0;
  const cancelHint = flow.hintAfter(14000, `Six links make every pair reachable — GPU 1↔2, 1↔3, 1↔4, 2↔3, 2↔4, 3↔4. Keep clicking pairs.`);

  await flow.ask(async replay => {
    const allPairs = [];
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) allPairs.push([`g${i}`, `g${j}`]);
    if (replay !== undefined){
      allPairs.forEach(([a, b]) => board.drawLink(a, b));
      linkChip.innerHTML = 'LINKS WIRED: <b>6 / 6</b>';
      cancelHint();
      return replay;
    }
    board.enableWiring((a, b) => {
      wired++;
      linkChip.innerHTML = `LINKS WIRED: <b>${wired} / 6</b>`;
      SFX.hop();
      if (wired === 2) guide.note(`Two down. Notice each new GPU has to link to <em>everyone already wired</em>, not just one neighbour.`);
    });
    await waitFor(() => wired >= 6, { hold: 400 });
    cancelHint();
    return true;
  });

  guide.note(`Four GPUs, six links. Every new GPU has to connect to all the ones already there, so the link count climbs faster than the GPU count.`);
  await guide.next();

  guide.aha(`The number of all-to-all links is <b>n(n−1)/2</b> for n GPUs. Four GPUs need 6; forty would need 780; thousands would need millions. Links grow far faster than machines.`,
    `So all-to-all only works inside one node, on a short copper spine. Connecting racks and rooms needs a smarter kind of wiring — that's step 3. First: power.`);
  await guide.next();
}
