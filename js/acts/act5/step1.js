// ACT 5 · STEP 1 — "Eight GPUs to a rack".
// Rebuilt to the micro-learning contract in DESIGN_MAKEOVER.md §2 and the script in
// ACT5_MAKEOVER.md §3: one card at a time (guide.cards), each card focuses and names the
// one thing it is about, and the step opens on the GPU package the player assembled at the
// end of Act 4, so the first thing they see is their own hardware (rule 4).
//
// The old step's third stage (all-to-all wiring, n(n-1)/2) is now its own step, so this
// one ends on the filled rack.
//
// The rack is drawn in oblique projection rather than as a flat elevation: depth runs to
// the right and up by D, so the top and right faces are visible and each node reads as a
// slab that runs back into the frame. ACT5_MAKEOVER.md §1.2 asked for that.
//
// Numbers on screen, and where they come from:
//   7 kW per node   — an 8-GPU box sits between the 6.5 kW of an HGX A100 system and the
//                     10.2 kW of a DGX H100, so 7 kW is a plain figure in that band.
//   56 kW per rack  — 8 x 7, exactly. The script's "about 58" does not multiply, so the
//                     total the player watches accumulate is the one the copy states.
//   1.2 kW per home — the average US residential customer used about 10,500 kWh in a year,
//                     which is 1.2 kW held continuously.
//
// Determinism: every card boundary is a flow.ask, every visual change rides Anim.tween or
// sleep, and no value is generated, so a replay lands where the live run landed.
import { sleep, el, svgEl } from '../../engine/util.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makePlacer } from '../../engine/components.js';

/* ---------- fixed numbers ---------- */
const NODE_KW = 7;
const BAYS = 8;
const RACK_KW = NODE_KW * BAYS;          // 56

/* ---------- oblique projection: depth runs right and up ----------
   The rack is tall and seen from close to eye level, so it foreshortens hard. The sled is
   a shallow tray seen from above, so it gets a longer depth vector of its own. */
const D = { x: 40, y: -22 };
const DS = { x: 56, y: -34 };
const at = (x, y, d) => [x + D.x * d, y + D.y * d];      // a point at depth fraction d
const atS = (x, y, d) => [x + DS.x * d, y + DS.y * d];

function poly(parent, pts, attrs = {}){
  const p = svgEl('polygon', { points: pts.map(q => `${q[0]},${q[1]}`).join(' '), ...attrs });
  parent.appendChild(p);
  return p;
}

/* ---------- sled geometry (720 x 480 stage units) ---------- */
const SLED = { x0: 140, x1: 560, front: 316, wall: 17 };
const CARD = { w: 30, h: 48, depth: 0.8 };               // a GPU stands near the back wall
const SPINE_D = 0.24;
const slotX = i => 200 + i * 47;
const CARD_Y = SLED.front + DS.y * CARD.depth - CARD.h;  // top edge of a standing GPU

/* ---------- rack geometry ---------- */
const RACK = { x: 418, y: 78, w: 190, h: 302 };
const BAY = { x: 426, w: 174, h: 30, step: 35.75, top: 86 };
const bayBox = i => ({ x: BAY.x, y: BAY.top + i * BAY.step, w: BAY.w, h: BAY.h });

/* Where the finished node parks while the frame is drawn, and the size it lands at once
   it is inside a bay. Both are anchored on the sled's front-left corner. */
const PARK = { x: 96, y: 316, s: 0.38 };
const BAY_S = BAY.w / (SLED.x1 - SLED.x0);               // 0.414

async function fadeIn(nodes, dur = 300){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  list.forEach(n => { n.style.opacity = '0'; n.style.display = ''; });
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(p); }));
}
async function fadeOut(nodes, dur = 260){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(1 - p); }));
  list.forEach(n => { n.style.display = 'none'; });
}

/* The package from the end of Act 4: substrate, two memory towers, the compute die with
   its sixteen lanes, and the lid. Drawn in stage coordinates so nothing that measures it
   later has to reason about a parent transform. */
function drawPackage(parent, ox, oy){
  const g = svgEl('g');
  const R = (x, y, w, h, rx, cls) => g.appendChild(
    svgEl('rect', { x: ox + x, y: oy + y, width: w, height: h, rx, class: cls }));
  R(12, 0, 276, 12, 2, 'tile-bg');                                   // lid
  const stack = x => {
    for (let i = 0; i < 4; i++){
      R(x, 34 + i * 15, 48, 12, 2, 'tile-bg');
      if (i < 3) [12, 24, 36].forEach(vx => g.appendChild(svgEl('line', {
        x1: ox + x + vx, y1: oy + 46 + i * 15, x2: ox + x + vx, y2: oy + 49 + i * 15, class: 'wire',
      })));
    }
  };
  stack(24); stack(228);
  R(96, 22, 108, 74, 4, 'tile-bg');                                  // the compute die
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++){
    g.appendChild(svgEl('rect', {
      x: ox + 104 + c * 24, y: oy + 30 + r * 16, width: 18, height: 11, rx: 1.5,
      fill: 'var(--blue-soft)', stroke: 'var(--blue)', 'stroke-width': 1,
    }));
  }
  R(0, 96, 300, 14, 2, 'tile-bg');                                   // substrate
  parent.appendChild(g);
  return g;
}

/* One GPU, drawn as the card it is: it stands upright in the tray. */
function drawGpuCard(parent){
  const g = svgEl('g', { class: 'tile', 'aria-label': 'GPU' });
  g.appendChild(svgEl('rect', { width: CARD.w, height: CARD.h, rx: 3, class: 'tile-bg' }));
  g.appendChild(svgEl('rect', {
    x: 6, y: 9, width: 18, height: 18, rx: 2,
    fill: 'var(--blue-soft)', stroke: 'var(--blue)', 'stroke-width': 1.2,
  }));
  const t = svgEl('text', { x: CARD.w / 2, y: 42, class: 'tile-cap' });
  t.textContent = 'GPU';
  g.appendChild(t);
  parent.appendChild(g);
  return g;
}

export async function step1(){
  guide.title('STEP 1 / 5 · NANOVOLT CLOUD', 'Eight GPUs <em>to a rack</em>');
  guide.cards();

  const stage = newStage('21', 'One GPU into a sled, eight sleds into a rack');
  const { svg, controls } = stage;

  /* ================= CARD 1 — the GPU the player already built ==================== */

  const PKG = { x: 210, y: 60, w: 300, h: 110 };
  const gpuG = svgEl('g');
  svg.appendChild(gpuG);
  drawPackage(gpuG, PKG.x, PKG.y);

  guide.say(`This is the GPU you finished in Act 4. One of them trains a small model.
    Here you stack them: eight GPUs to a box, eight boxes to a frame.`);
  stage.focus(gpuG, { label: 'the gpu you built', at: 'bottom' });
  await guide.next();

  /* ================= CARD 2 — the sled ============================================ */

  /* nodeG holds everything that will later travel into the rack as one piece. It carries
     no transform until the whole node is built, so focusing its children is safe. */
  const nodeG = svgEl('g');
  svg.appendChild(nodeG);

  const trayG = svgEl('g');
  nodeG.appendChild(trayG);
  const fL = [SLED.x0, SLED.front], fR = [SLED.x1, SLED.front];
  const bL = atS(SLED.x0, SLED.front, 1), bR = atS(SLED.x1, SLED.front, 1);
  poly(trayG, [bL, bR, [bR[0], bR[1] - 14], [bL[0], bL[1] - 14]],
    { fill: 'var(--paper-high)', stroke: 'var(--hairline-strong)', 'stroke-width': 1 });   // back wall
  poly(trayG, [fL, fR, bR, bL],
    { fill: 'var(--paper-high)', stroke: 'var(--hairline-strong)', 'stroke-width': 1 });   // floor
  poly(trayG, [[fR[0], fR[1] + SLED.wall], fR, bR, [bR[0], bR[1] + SLED.wall]],
    { fill: 'rgba(29,33,23,.05)', stroke: 'var(--ink)', 'stroke-width': 1.4 });            // right end
  trayG.appendChild(svgEl('rect', {
    x: SLED.x0, y: SLED.front, width: SLED.x1 - SLED.x0, height: SLED.wall, rx: 2, class: 'rack-frame',
  }));                                                                                     // front wall
  trayG.style.opacity = '0';
  await fadeIn([trayG], 320);

  guide.say(`A sled is the tray the box is built on. The GPUs bolt to it, and the whole
    thing slides into a frame like a drawer.`);
  stage.focus(trayG, { label: 'sled', at: 'bottom' });
  await guide.next();

  /* ================= CARD 3 — the interconnect spine ============================== */

  stage.clearFocus();
  const spineG = svgEl('g');
  nodeG.appendChild(spineG);
  const sfL = atS(SLED.x0 + 16, SLED.front, SPINE_D), sfR = atS(SLED.x1 - 16, SLED.front, SPINE_D);
  poly(spineG, [sfL, sfR, atS(SLED.x1 - 16, SLED.front, SPINE_D + 0.14), atS(SLED.x0 + 16, SLED.front, SPINE_D + 0.14)],
    { fill: 'rgba(29,33,23,.16)', stroke: 'var(--ink)', 'stroke-width': 1.6 });
  spineG.style.opacity = '0';
  await fadeIn([spineG], 300);

  guide.say(`Down the middle runs the interconnect spine, a copper backbone. The eight
    GPUs talk over it, and their messages never leave the box.`);
  stage.focus(spineG, { label: 'interconnect spine', at: 'bottom' });
  await guide.next();

  /* ================= CARD 4 — fill the eight slots ================================ */

  stage.clearFocus();

  /* the stub each GPU taps the spine with. Drawn only once its slot is filled, so the
     empty tray stays clean and the player watches each card connect. */
  const stubs = [];
  const stubG = svgEl('g');
  nodeG.appendChild(stubG);
  for (let i = 0; i < BAYS; i++){
    const planX = slotX(i) + CARD.w / 2 - DS.x * CARD.depth;
    const a = atS(planX, SLED.front, CARD.depth);
    const b = atS(planX, SLED.front, SPINE_D + 0.07);
    const l = svgEl('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'wire' });
    l.style.opacity = '0';
    stubG.appendChild(l);
    stubs.push(l);
  }

  const slots = [];
  const slotG = svgEl('g');
  nodeG.appendChild(slotG);
  for (let i = 0; i < BAYS; i++){
    const rect = svgEl('rect', { x: slotX(i), y: CARD_Y, width: CARD.w, height: CARD.h, rx: 3, class: 'slot' });
    slotG.appendChild(rect);
    slots.push({ x: slotX(i), y: CARD_Y, w: CARD.w, h: CARD.h, rect, value: null, tile: null, correct: 'GPU' });
  }

  const HOME = i => ({ x: 62 + (i % 4) * 46, y: 366 + Math.floor(i / 4) * 56 });
  const tiles = [];
  for (let i = 0; i < BAYS; i++){
    const g = drawGpuCard(svg);
    const home = HOME(i);
    /* parked at home before makePlacer exists, so the print-in below shows them in place */
    g.style.transform = `translate(${home.x}px,${home.y}px)`;
    g.style.opacity = '0';
    tiles.push({ g, value: 'GPU', w: CARD.w, h: CARD.h, home, tx: home.x, ty: home.y, slot: null });
  }

  const tally = svgEl('text', { x: 470, y: 402, class: 'lbl-strong' });
  tally.textContent = 'GPUS ON THE SLED: 0 / 8';
  tally.style.opacity = '0';
  svg.appendChild(tally);

  /* rule 5: the package the player built shrinks into the first of the eight cards, then
     the other seven print in beside it. Driven by tween rather than packInto so nothing
     has to measure a node that is already carrying a transform. */
  const h0 = HOME(0);
  await Anim.tween(560, p => {
    const s = 1 + (0.14 - 1) * p;
    const cx = (PKG.x + PKG.w / 2) + ((h0.x + CARD.w / 2) - (PKG.x + PKG.w / 2)) * p;
    const cy = (PKG.y + PKG.h / 2) + ((h0.y + CARD.h / 2) - (PKG.y + PKG.h / 2)) * p;
    const ax = PKG.x + PKG.w / 2, ay = PKG.y + PKG.h / 2;
    gpuG.setAttribute('transform',
      `translate(${(cx - s * ax).toFixed(2)} ${(cy - s * ay).toFixed(2)}) scale(${s.toFixed(4)})`);
    gpuG.style.opacity = String(1 - p * 0.9);
  });
  gpuG.style.display = 'none';

  await fadeIn([tiles[0].g], 220);
  for (let i = 1; i < BAYS; i++){
    await fadeIn([tiles[i].g], 130);
    if (!flow.instant) SFX.click();
  }
  await fadeIn([slotG, tally], 240);

  const placer = makePlacer({
    svg, tiles, slots,
    validate: v => v.every(x => x === 'GPU'),
    onPlace: () => {
      const n = slots.filter(s => s.value).length;
      tally.textContent = `GPUS ON THE SLED: ${n} / 8`;
      slots.forEach((s, i) => { stubs[i].style.opacity = s.value ? '1' : '0'; });
    },
  });

  /* Chrome paints an amber :focus-visible ring on a clicked SVG target, which reads as a
     sixth meaning for amber. Drop it on pointer-driven clicks; keyboard focus still shows. */
  const focusables = [...tiles.map(t => t.g), ...slots.map(s => s.rect)];
  focusables.forEach(n => n.addEventListener('click', e => { if (e.detail) n.blur(); }));
  const dropTabstops = () => focusables.forEach(n => { n.removeAttribute('tabindex'); n.blur(); });

  guide.say(`Eight copies of that GPU, and eight slots waiting for them.
    <b>Drag a GPU into every slot on the sled.</b>`);

  await flow.ask(async replay => {
    if (replay !== undefined){
      placer.autoPlace();
      tally.textContent = 'GPUS ON THE SLED: 8 / 8';
      stubs.forEach(s => { s.style.opacity = '1'; });
      dropTabstops();
      return replay;
    }
    await placer.done;
    dropTabstops();
    if (!flow.instant) SFX.success();
    return true;
  });

  /* ================= CARD 5 — that box is a node ================================== */

  await fadeOut([tally], 220);
  /* the cards join the tray so the finished node can travel as one piece. nodeG carries no
     transform yet, so re-parenting them changes nothing on screen. */
  tiles.forEach(t => nodeG.appendChild(t.g));

  guide.say(`Eight GPUs on one sled, all on one spine. The finished box is a node, and
    racks are counted in nodes.`);
  stage.focus(nodeG, { label: 'node', at: 'top' });
  await guide.next();

  /* ================= CARD 6 — what a node draws =================================== */

  stage.clearFocus();

  const powerG = svgEl('g');
  svg.appendChild(powerG);
  powerG.appendChild(svgEl('rect', {
    x: 48, y: 84, width: 210, height: 96, rx: 6,
    fill: 'var(--paper-high)', stroke: 'var(--amber)', 'stroke-width': 1.4,
  }));
  const pTitle = svgEl('text', { x: 153, y: 108, class: 'lbl' });
  pTitle.textContent = 'NODE POWER';
  const pValue = svgEl('text', { x: 153, y: 138 });
  pValue.style.fontFamily = 'var(--font-mono)';
  pValue.style.fontSize = '21px';
  pValue.style.fill = 'var(--amber)';
  pValue.style.textAnchor = 'middle';
  const pTrack = svgEl('rect', {
    x: 64, y: 148, width: 178, height: 10, rx: 2,
    fill: 'none', stroke: 'var(--hairline-strong)', 'stroke-width': 1,
  });
  const pFill = svgEl('rect', { x: 64, y: 148, width: 0, height: 10, rx: 2, fill: 'var(--amber)', opacity: '.55' });
  const pSub = svgEl('text', { x: 153, y: 172, class: 'lbl-faint' });
  pSub.textContent = 'HELD CONTINUOUSLY';
  powerG.append(pTitle, pValue, pTrack, pFill, pSub);
  const setPower = kw => {
    pValue.textContent = `${kw} kW`;
    pFill.setAttribute('width', String((178 * Math.min(1, kw / RACK_KW)).toFixed(1)));
  };
  setPower(NODE_KW);
  powerG.style.opacity = '0';
  await fadeIn([powerG], 300);

  guide.say(`One node draws about 7 kW, and it draws it all day. The average American home
    draws 1.2 kW across a year, so one box draws what six homes do.`);
  stage.focus(powerG, { label: 'power draw', at: 'bottom' });
  await guide.next();

  /* ================= CARD 7 — the rack ============================================ */

  stage.clearFocus();

  /* nodeG is anchored on the sled's front-left corner: at scale s that corner sits at
     (ax, ay), so the translate is (ax - s*SLED.x0, ay - s*SLED.front). */
  const placeNode = (ax, ay, s) => nodeG.setAttribute('transform',
    `translate(${(ax - s * SLED.x0).toFixed(2)} ${(ay - s * SLED.front).toFixed(2)}) scale(${s.toFixed(4)})`);

  await Anim.tween(560, p => placeNode(
    SLED.x0 + (PARK.x - SLED.x0) * p,
    SLED.front + (PARK.y - SLED.front) * p,
    1 + (PARK.s - 1) * p,
  ));

  const rackG = svgEl('g');
  svg.appendChild(rackG);
  const rFR = [RACK.x + RACK.w, RACK.y];
  const rBL = at(RACK.x, RACK.y, 1), rBR = at(RACK.x + RACK.w, RACK.y, 1);
  poly(rackG, [rFR, rBR, [rBR[0], rBR[1] + RACK.h], [rFR[0], rFR[1] + RACK.h]],
    { fill: 'rgba(29,33,23,.05)', stroke: 'var(--ink)', 'stroke-width': 1.4 });            // right face
  poly(rackG, [[RACK.x, RACK.y], rFR, rBR, rBL],
    { fill: 'var(--paper-high)', stroke: 'var(--ink)', 'stroke-width': 1.4 });             // top face
  rackG.appendChild(svgEl('rect', {
    x: RACK.x, y: RACK.y, width: RACK.w, height: RACK.h, rx: 3, class: 'rack-frame',
  }));
  /* the cables that leave each sled at the back, drawn on the side we can see */
  for (let i = 0; i < 3; i++){
    const y = RACK.y + 96 + i * 78;
    rackG.appendChild(svgEl('path', {
      d: `M${RACK.x + RACK.w + 5} ${y} C${RACK.x + RACK.w + 26} ${y}, ${rBR[0] - 6} ${y - 24}, ${rBR[0] - 3} ${y - 46}`,
      class: 'wire dim', fill: 'none',
    }));
  }
  const bays = [];
  for (let i = 0; i < BAYS; i++){
    const b = bayBox(i);
    const g = svgEl('g');
    g.appendChild(svgEl('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 2, class: 'sled' }));
    poly(g, [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w + 12, b.y - 7], [b.x + 12, b.y - 7]],
      { fill: 'none', stroke: 'var(--hairline-strong)', 'stroke-width': 1 });
    rackG.appendChild(g);
    bays.push({ box: b, empty: g, slab: null });
  }
  rackG.style.opacity = '0';
  await fadeIn([rackG], 340);

  guide.say(`A rack is the standing frame the sleds slide into. Each sled runs about a
    metre back into it, and the cables come out behind.`);
  stage.focus(rackG, { label: 'rack', at: 'left' });
  await guide.next();

  /* ================= CARD 8 — fill the frame ====================================== */

  stage.clearFocus();

  /* a filled bay: the slab, its top face, and the eight GPUs along its front */
  function makeSlab(i){
    const b = bays[i].box;
    const g = svgEl('g');
    g.appendChild(svgEl('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 2, class: 'sled on' }));
    poly(g, [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w + 12, b.y - 7], [b.x + 12, b.y - 7]],
      { fill: 'var(--blue-soft)', stroke: 'var(--blue)', 'stroke-width': 1 });
    for (let k = 0; k < 8; k++){
      g.appendChild(svgEl('circle', { cx: b.x + 16 + k * 19, cy: b.y + b.h / 2, r: 2.8, class: 'sled-gpu on' }));
    }
    rackG.appendChild(g);
    bays[i].slab = g;
    bays[i].empty.style.display = 'none';
    return g;
  }

  const setRack = n => {
    pTitle.textContent = 'RACK POWER';
    setPower(n * NODE_KW);
    pSub.textContent = `${n} NODE${n === 1 ? '' : 'S'} × ${NODE_KW} kW`;
  };

  /* rule 5: the node the player built travels into the bottom bay. It has to ride above
     the frame's front panel, which is opaque paper, or it vanishes on the way in. */
  svg.appendChild(nodeG);
  const bottom = bays[BAYS - 1].box;
  await Anim.tween(620, p => placeNode(
    PARK.x + (bottom.x - PARK.x) * p,
    PARK.y + ((bottom.y + bottom.h) - PARK.y) * p,
    PARK.s + (BAY_S - PARK.s) * p,
  ));
  nodeG.style.display = 'none';
  makeSlab(BAYS - 1);
  setRack(1);

  guide.say(`Your node is in the bottom bay.
    <b>Copy it up the frame until all eight bays are full.</b>`);

  const addBtn = el('button', { class: 'btn primary', 'data-label': 'add-a-node' }, 'Add a node ▸');
  controls.appendChild(addBtn);

  const settleRack = () => {
    for (let i = 0; i < BAYS - 1; i++) if (!bays[i].slab) makeSlab(i);
    setRack(BAYS);
    addBtn.disabled = true;
    addBtn.classList.add('used');
  };

  await flow.ask(async replay => {
    if (replay !== undefined){ settleRack(); return replay; }
    let filled = 1, busy = false;
    await new Promise(res => {
      addBtn.addEventListener('click', async () => {
        if (busy || filled >= BAYS) return;
        busy = true;
        SFX.click();
        const g = makeSlab(BAYS - 1 - filled);
        g.style.opacity = '0';
        await Anim.tween(200, p => { g.style.opacity = String(p); });
        filled++;
        setRack(filled);
        busy = false;
        if (filled >= BAYS){
          addBtn.disabled = true;
          addBtn.classList.add('used');
          SFX.success();
          await sleep(320);
          res();
        }
      });
    });
    return true;
  });

  /* ================= CARD 9 — what the frame draws ================================ */

  guide.aha(`Eight nodes at 7 kW each. One filled rack draws 56 kW and it never drops.
    That is about forty-seven homes, from one frame.`,
    `That is one rack: 8 nodes, 64 GPUs.`);
  stage.focus(powerG, { label: 'rack power', at: 'bottom' });
  await guide.next();
}
