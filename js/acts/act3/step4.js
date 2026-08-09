// ACT 3 · STEP 4 — "Package the die".
// The cut-and-bond half of the old "Cut, bond & bin" step; binning is its own step now.
// Built to the micro-learning contract in DESIGN_MAKEOVER.md §2 / §4: one card at a time
// (guide.cards), each card names and focuses the one thing it is about, and both scene
// changes are watched rather than cut to (the wafer packs into a tray, then one die leaves
// the tray and turns edge on).
//
// "Flip" is the whole word in this step, so the package is drawn as a cross-section: the
// die starts face up, and the turn-over is a real 180° flip about its long axis, animated
// through zero height with Anim.tween. The pads travel from the top edge to the bottom edge
// where the player can see them meet the bumps.
//
// Colour, per DESIGN.md §1a: red is a die a defect killed, blue is a good die and the live
// signal that leaves the finished package, amber is "not connected yet" (loose pads and
// unmelted bumps). Everything else is ink weight and dash pattern.
//
// Determinism: the defect map comes from makeWaferMap's seeded scatter (mulberry32), and
// the seed is recorded as the first card's answer through flow.ask, so a replay rebuilds
// the same wafer. Every visual change runs through Anim.tween or sleep, both replay-aware.
import { el, slug, sleep, svgEl } from '../../engine/util.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makePlacer } from '../../engine/components.js';
import { makeWaferMap } from '../../engine/fab.js';

/* ---------- geometry, in the stage's 720×480 user units ---------- */
const WAFER = { cx: 384, cy: 228, r: 146, die: 34 };
const TRAY = { x: 44, y: 136, w: 156, h: 188 };
const CX = 470;                                     // the package's centre line
const SUB = { x: 290, y: 316, w: 360, h: 40 };      // substrate
const PIN = { n: 9, gap: 38, w: 16, h: 12 };
const BUMP = { n: 8, gap: 36, cy: 308, rx: 6, ry: 6 };
const DIE = { w: 290, h: 54, x: CX - 145, home: 150, bond: 248, face: 9 };

const bumpX = i => CX - (BUMP.n - 1) * BUMP.gap / 2 + i * BUMP.gap;
const pinX = i => CX - ((PIN.n - 1) * PIN.gap + PIN.w) / 2 + i * PIN.gap;

/* the wafer's defect map. Recorded through flow.ask so replay reproduces it exactly. */
const SEED = 20260809;
const DEFECTS = 9;

async function fadeIn(nodes, dur = 320){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  list.forEach(n => { n.style.display = ''; n.style.opacity = '0'; });
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(p); }));
  list.forEach(n => { n.style.opacity = '1'; });
}
async function fadeOut(nodes, dur = 280){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(1 - p); }));
  list.forEach(n => { n.style.display = 'none'; });
}

/* guide.next(), but it records `value` as this card's answer instead of `true`.
   Keeps the one-answer-per-card rule intact while the wafer's seed goes on the tape. */
function nextRecording(label, value){
  const b = el('button', { class: 'btn primary', 'data-label': slug(label) }, label);
  const row = guide.beat(el('div', { class: 'btn-row' }), 'actions');
  row.appendChild(b);
  const spend = () => { b.disabled = true; b.classList.add('used'); };
  return flow.ask(replay => {
    if (replay !== undefined){ spend(); return replay; }
    return new Promise(res => b.addEventListener('click', () => { SFX.click(); spend(); res(value); }));
  });
}

export async function step4(){
  guide.title('STEP 4 / 5 · NANOVOLT ASSEMBLY', 'Package <em>the die</em>');
  guide.cards();

  const stage = newStage('12', 'A wafer diced into loose dies, then one die bonded face down onto a substrate and sealed under a lid');
  const { svg } = stage;

  /* ================= SCENE A — dice the wafer ================= */

  const wafer = makeWaferMap(svg, { cx: WAFER.cx, cy: WAFER.cy, r: WAFER.r });
  wafer.tile(WAFER.die, WAFER.die);

  guide.say(`The wafer is printed and every die on it has been tested. A bare die still cannot
    do anything. It has to be cut free, connected to the outside, and sealed.`);
  stage.focus(wafer.g, { label: 'tested wafer', at: 'bottom' });
  const seed = await nextRecording('Next ▸', SEED);

  /* one die near the middle, named before anything is said about the rest */
  const centreDie = wafer.dies.reduce((best, d) => {
    const dist = Math.hypot(d.x + d.w / 2 - WAFER.cx, d.y + d.h / 2 - WAFER.cy);
    return (d.state === 'good' && (!best || dist < best.dist)) ? { d, dist } : best;
  }, null).d;

  stage.clearFocus();
  guide.say(`Each square is one die: a single finished chip, still joined to its neighbours.`);
  stage.focus(centreDie.rect, { label: 'one die', at: 'top' });
  await guide.next();

  /* the defect map lands now, seeded from the answer above */
  stage.clearFocus();
  wafer.scatter(seed, DEFECTS);
  const stats = wafer.stats();
  const scrap = wafer.dies.filter(d => d.state === 'defect' || d.state === 'edge');

  const tally = svgEl('text', { x: WAFER.cx, y: WAFER.cy + WAFER.r + 30, class: 'lbl-strong' });
  tally.textContent = `GOOD ${stats.good} · DEAD ${stats.defect}`;
  svg.appendChild(tally);
  await fadeIn([tally], 260);

  guide.say(`${stats.defect} of these ${stats.good + stats.defect} came back red. They failed
    their test, usually because a speck of dust landed where a wire had to go.`);
  stage.focus(wafer.dies.filter(d => d.state === 'defect').map(d => d.rect),
    { label: 'failed the test', at: 'top', ring: false });
  await guide.next();

  /* the saw, parked above the wafer and named before it moves */
  stage.clearFocus();
  const sawG = svgEl('g');
  const sawTop = WAFER.cy - WAFER.r - 16;
  const blade = svgEl('line', {
    x1: WAFER.cx - WAFER.r - 24, y1: sawTop, x2: WAFER.cx + WAFER.r + 24, y2: sawTop,
    stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round',
  });
  sawG.appendChild(blade);
  svg.appendChild(sawG);
  await fadeIn([sawG], 240);

  guide.say(`A diamond blade cuts down the gaps between the dies. One pass across the wafer,
    then a second pass at right angles to the first.`);
  stage.focus(sawG, { label: 'diamond saw', at: 'top' });
  await guide.button('Cut the wafer ▸');

  stage.clearFocus();
  const kerf = svgEl('g', { 'pointer-events': 'none' });
  svg.appendChild(kerf);
  const cutLine = (x1, y1, x2, y2) => kerf.appendChild(svgEl('line', {
    x1, y1, x2, y2, stroke: 'var(--paper)', 'stroke-width': 2.4,
  }));

  const gridX = [], gridY = [];
  for (const d of wafer.dies){
    if (!gridX.includes(d.x)) gridX.push(d.x);
    if (!gridY.includes(d.y)) gridY.push(d.y);
  }
  gridX.sort((a, b) => a - b); gridY.sort((a, b) => a - b);

  SFX.flow();
  let cutY = -1;
  await Anim.tween(760, p => {
    const y = WAFER.cy - WAFER.r - 16 + p * (2 * WAFER.r + 32);
    blade.setAttribute('y1', y); blade.setAttribute('y2', y);
    while (cutY + 1 < gridY.length && gridY[cutY + 1] <= y){
      cutY++;
      cutLine(WAFER.cx - WAFER.r, gridY[cutY], WAFER.cx + WAFER.r, gridY[cutY]);
    }
  });
  blade.setAttribute('x1', WAFER.cx - WAFER.r - 24); blade.setAttribute('y1', WAFER.cy - WAFER.r - 24);
  blade.setAttribute('x2', WAFER.cx - WAFER.r - 24); blade.setAttribute('y2', WAFER.cy + WAFER.r + 24);
  SFX.flow();
  let cutX = -1;
  await Anim.tween(760, p => {
    const x = WAFER.cx - WAFER.r - 24 + p * (2 * WAFER.r + 48);
    blade.setAttribute('x1', x); blade.setAttribute('x2', x);
    while (cutX + 1 < gridX.length && gridX[cutX + 1] <= x){
      cutX++;
      cutLine(gridX[cutX], WAFER.cy - WAFER.r, gridX[cutX], WAFER.cy + WAFER.r);
    }
  });
  await fadeOut([sawG], 200);

  /* the dies drift apart a little, so "loose" is something the player sees */
  await Anim.tween(420, p => {
    for (const d of wafer.dies){
      const dx = (d.x + d.w / 2 - WAFER.cx) * 0.085 * p;
      const dy = (d.y + d.h / 2 - WAFER.cy) * 0.085 * p;
      // the attribute, not style.transform: packInto composes with the attribute later,
      // and a CSS transform would win over it and pin every die where it stands
      d.rect.setAttribute('transform', `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`);
    }
  });
  SFX.success();

  guide.say(`Cut. Every die is loose. Nothing was ever printed in those gaps, because the
    blade was always going to come through them.`);
  stage.focus(wafer.g, { label: 'diced', at: 'top' });   // 'bottom' collides with the tally
  await guide.next();

  stage.clearFocus();
  guide.say(`Everything from here costs money on every chip that goes through it. The red
    dies and the part-dies at the rim stop here.`);
  stage.focus(scrap.map(d => d.rect), { label: 'scrap', at: 'top', ring: false });
  await guide.button('Sweep out the scrap ▸');

  stage.clearFocus();
  const trayG = svgEl('g');
  trayG.appendChild(svgEl('rect', { x: TRAY.x, y: TRAY.y, width: TRAY.w, height: TRAY.h, rx: 4, class: 'slot' }));
  const trayCount = svgEl('text', { x: TRAY.x + TRAY.w / 2, y: TRAY.y + TRAY.h / 2 + 6, class: 'lbl-strong' });
  const trayCap = svgEl('text', { x: TRAY.x + TRAY.w / 2, y: TRAY.y + TRAY.h / 2 + 26, class: 'lbl-faint' });
  trayCount.textContent = '0'; trayCap.textContent = 'GOOD DIES';
  trayG.append(trayCount, trayCap);
  svg.appendChild(trayG);
  await fadeIn([trayG], 260);

  await fadeOut(scrap.map(d => d.rect), 340);
  tally.textContent = `GOOD ${stats.good} · SCRAP ${stats.defect + stats.edge}`;

  const keepers = wafer.dies.filter(d => d.state === 'good');
  await Promise.all([
    stage.packInto(keepers.map(d => d.rect), TRAY, { dur: 700 }),
    Anim.tween(700, p => { trayCount.textContent = String(Math.round(p * stats.good)); }),
  ]);
  trayCount.textContent = String(stats.good);
  SFX.dope();

  guide.say(`${stats.good} good dies in the tray. Each one gets its own package now, one die
    at a time.`);
  stage.focus(trayG, { label: 'good dies', at: 'top' });
  await guide.next();

  /* ================= SCENE B — package one die ================= */

  stage.clearFocus();
  await fadeOut([wafer.g, tally], 300);

  const pkg = svgEl('g');
  svg.appendChild(pkg);

  /* one die leaves the tray and turns edge on: the square grows into a wide thin bar */
  const travel = svgEl('rect', {
    x: TRAY.x + TRAY.w / 2 - 12, y: TRAY.y + TRAY.h / 2 - 12, width: 24, height: 24,
    rx: 3, class: 'tile-bg',
  });
  pkg.appendChild(travel);
  trayCount.textContent = String(stats.good - 1);   // this one has left the tray
  const lerp = (a, b, p) => a + (b - a) * p;
  await Anim.tween(620, p => {
    travel.setAttribute('x', lerp(TRAY.x + TRAY.w / 2 - 12, DIE.x, p).toFixed(1));
    travel.setAttribute('y', lerp(TRAY.y + TRAY.h / 2 - 12, DIE.home, p).toFixed(1));
    travel.setAttribute('width', lerp(24, DIE.w, p).toFixed(1));
    travel.setAttribute('height', lerp(24, DIE.h, p).toFixed(1));
  });

  /* the real die tile, drawn at the origin and positioned by the placer's transform */
  const dieG = svgEl('g', { class: 'tile', 'aria-label': 'die' });
  const dieInner = svgEl('g');
  dieInner.innerHTML = `
    <rect x="0" y="0" width="${DIE.w}" height="${DIE.h}" rx="3" class="tile-bg"/>
    <rect x="0" y="0" width="${DIE.w}" height="${DIE.face}" fill="rgba(29,33,23,.07)"/>
    <line x1="0" y1="${DIE.face}" x2="${DIE.w}" y2="${DIE.face}" stroke="var(--hairline-strong)" stroke-width="1"/>
    ${Array.from({ length: BUMP.n }, (_, i) =>
      `<rect class="pad" x="${(bumpX(i) - DIE.x - 7).toFixed(1)}" y="1.6" width="14" height="6" rx="1" fill="var(--amber)"/>`).join('')}`;
  dieG.appendChild(dieInner);
  pkg.appendChild(dieG);
  const pads = [...dieInner.querySelectorAll('.pad')];
  const dieTile = { g: dieG, value: 'DIE', w: DIE.w, h: DIE.h, home: { x: DIE.x, y: DIE.home }, tx: 0, ty: 0, slot: null };
  dieG.style.transform = `translate(${DIE.x}px,${DIE.home}px)`;
  dieG.style.opacity = '0';
  await fadeIn([dieG], 220);
  travel.remove();

  guide.say(`Take one die out of the tray and look at it from the side. All of its circuits
    sit in a thin layer on one face.`);
  stage.focus(dieG, { label: 'one die, edge on', at: 'top' });
  await guide.next();

  stage.clearFocus();
  guide.say(`The metal squares on that face are pads. Every signal into or out of the die
    goes through one of them, and none of them is connected yet.`);
  // focus the die, not the pads: raising a pad out of the tile's CSS transform would drop
  // that transform and land it in the stage corner. 'top' puts the leader on the pad row.
  pads.forEach(p => { p.style.stroke = 'var(--amber)'; p.style.strokeWidth = '2.4'; });
  stage.focus(dieG, { label: 'pads', at: 'top', ring: false });
  await guide.next();
  pads.forEach(p => { p.style.stroke = 'none'; });

  /* the substrate, its buried wiring, and its pins */
  stage.clearFocus();
  const subG = svgEl('g');
  subG.appendChild(svgEl('rect', { x: SUB.x, y: SUB.y, width: SUB.w, height: SUB.h, rx: 3, class: 'tile-bg' }));
  const traces = svgEl('g', { 'pointer-events': 'none' });
  for (let i = 0; i < BUMP.n; i++){
    const from = bumpX(i), to = pinX(i < 4 ? i : i + 1) + PIN.w / 2;
    const mid = SUB.y + 12 + (i % 3) * 8;
    traces.appendChild(svgEl('path', {
      d: `M${from} ${SUB.y} V${mid} H${to} V${SUB.y + SUB.h}`,
      fill: 'none', stroke: 'var(--hairline-strong)', 'stroke-width': 1, 'stroke-dasharray': '3 3',
    }));
  }
  subG.appendChild(traces);
  pkg.insertBefore(subG, dieG);
  await fadeIn([subG], 260);

  guide.say(`The substrate is a small board that sits under the die. Wiring printed inside it
    carries each signal sideways, away from the die.`);
  stage.focus(subG, { label: 'substrate', at: 'left' });
  await guide.next();

  stage.clearFocus();
  const pinG = svgEl('g');
  for (let i = 0; i < PIN.n; i++){
    pinG.appendChild(svgEl('rect', {
      x: pinX(i), y: SUB.y + SUB.h, width: PIN.w, height: PIN.h, rx: 1.5,
      fill: 'var(--ink)', opacity: 0.72,
    }));
  }
  pkg.insertBefore(pinG, dieG);
  await fadeIn([pinG], 240);

  guide.say(`Underneath are the pins. Each one carries a signal out to the circuit board the
    finished chip plugs into.`);
  stage.focus(pinG, { label: 'pins', at: 'bottom' });
  await guide.next();

  stage.clearFocus();
  const bumpG = svgEl('g');
  const bumps = Array.from({ length: BUMP.n }, (_, i) => {
    const e = svgEl('ellipse', { cx: bumpX(i), cy: BUMP.cy, rx: BUMP.rx, ry: BUMP.ry, fill: 'var(--amber)' });
    bumpG.appendChild(e);
    return e;
  });
  pkg.insertBefore(bumpG, dieG);
  await fadeIn([bumpG], 240);

  guide.say(`On top of the substrate sit solder bumps, one for every pad. Solder melts at a
    low temperature and sets hard as it cools.`);
  stage.focus(bumpG, { label: 'solder bumps', at: 'bottom' });
  await guide.next();

  /* the flip: pads are on top, bumps are below, so the die has to turn over */
  stage.clearFocus();
  guide.say(`The pads are on top of the die and the bumps are underneath it. So the die goes
    on face down, turned over onto its own contacts.`);
  stage.focus(dieG, { label: 'face is on top', at: 'top' });
  await guide.button('Turn the die over ▸');

  stage.clearFocus();
  SFX.click();
  await Anim.tween(700, p => {
    const s = Math.cos(Math.PI * p);
    dieInner.setAttribute('transform',
      `translate(0 ${DIE.h / 2}) scale(1 ${s.toFixed(4)}) translate(0 ${-DIE.h / 2})`);
  });
  dieInner.setAttribute('transform', `translate(0 ${DIE.h / 2}) scale(1 -1) translate(0 ${-DIE.h / 2})`);

  guide.say(`Turned over. Every pad now sits directly above its own bump, and nothing is
    joined yet.`);
  stage.focus(dieG, { label: 'face down', at: 'top' });
  await guide.next();

  /* ---- the bond: drag the die onto the bumps ---- */
  stage.clearFocus();
  const slotRect = svgEl('rect', { x: DIE.x, y: DIE.bond, width: DIE.w, height: DIE.h, class: 'slot' });
  pkg.insertBefore(slotRect, dieG);
  const slot = { x: DIE.x, y: DIE.bond, w: DIE.w, h: DIE.h, rect: slotRect, value: null, tile: null, correct: 'DIE' };

  const placer = makePlacer({
    svg, tiles: [dieTile], slots: [slot],
    validate: v => v[0] === 'DIE',
    onPlace: () => { slotRect.style.opacity = '0'; },
  });

  guide.say(`<b>Your goal: press the die down onto the bumps.</b> Drag it onto the dashed
    outline, or click the die and then the outline.`);

  await flow.ask(async replay => {
    if (replay !== undefined){ placer.autoPlace(); slotRect.style.opacity = '0'; return replay; }
    const cancel = flow.hintAfter(15000,
      `Still to do: put the die on the bumps. Drag it down onto the dashed outline, or click
       the die once and then click the outline.`);
    dieG.addEventListener('pointerdown', cancel, { once: true });
    await placer.done;
    cancel();
    return true;
  });

  await sleep(460);                 // let the placer's slide finish before anything measures
  dieG.style.transition = 'none';
  slotRect.remove();

  /* reflow: every bump melts onto the pad above it and sets. Joined, so no longer amber. */
  SFX.flow();
  await Anim.tween(560, p => {
    bumps.forEach(b => {
      b.setAttribute('ry', (BUMP.ry - p * 2.2).toFixed(2));
      b.setAttribute('rx', (BUMP.rx + p * 2.4).toFixed(2));
      b.setAttribute('cy', (BUMP.cy + p * 1.2).toFixed(2));
    });
  });
  bumps.forEach(b => { b.style.fill = 'var(--ink)'; });
  pads.forEach(p => { p.style.fill = 'var(--ink)'; });
  SFX.success();

  guide.say(`Pressed. The whole thing goes through an oven, every bump melts onto the pad
    above it, and all of them set at the same moment.`);
  stage.focus(bumpG, { label: 'joints', at: 'left' });   // below would land on the substrate
  await guide.next();

  /* one signal, drawn as a route out of the package */
  stage.clearFocus();
  const routeI = 5;
  const route = svgEl('path', {
    d: `M${bumpX(routeI)} ${DIE.bond + DIE.h} V${SUB.y + 12 + (routeI % 3) * 8} H${pinX(routeI + 1) + PIN.w / 2} V${SUB.y + SUB.h + PIN.h}`,
    fill: 'none', stroke: 'var(--blue)', 'stroke-width': 2.6, 'stroke-linecap': 'round', opacity: 0,
  });
  pkg.insertBefore(route, dieG);

  guide.say(`A signal leaving the die now has a path out: through a pad, into a bump, along
    the wiring, down to a pin.`);
  await guide.button('Send a signal out ▸');

  const len = route.getTotalLength ? route.getTotalLength() : 200;
  route.setAttribute('stroke-dasharray', `${(len * 0.2).toFixed(1)} ${(len * 2).toFixed(1)}`);
  route.setAttribute('opacity', '1');
  SFX.blip();
  await Anim.tween(900, p => {
    route.setAttribute('stroke-dashoffset', (len * 0.2 - p * (len + len * 0.2)).toFixed(1));
  });
  route.removeAttribute('stroke-dasharray');
  route.removeAttribute('stroke-dashoffset');
  route.setAttribute('opacity', '0.85');

  guide.say(`The die was turned over onto its bumps to make those joints, so the method is
    called <b>flip-chip</b>.`);
  stage.focus(dieG, { label: 'flip-chip', at: 'top' });
  await guide.next();

  /* the lid */
  stage.clearFocus();
  const LID = { x: SUB.x, w: SUB.w, top: DIE.bond - 22, wall: 14, lift: 170 };
  const lid = svgEl('path', {
    d: `M${LID.x} ${SUB.y} V${LID.top} H${LID.x + LID.w} V${SUB.y} H${LID.x + LID.w - LID.wall} V${LID.top + LID.wall} H${LID.x + LID.wall} V${SUB.y} Z`,
    fill: 'var(--paper-high)', stroke: 'var(--ink)', 'stroke-width': 1.6, 'stroke-linejoin': 'round',
  });
  lid.setAttribute('transform', `translate(0 ${-LID.lift})`);
  pkg.appendChild(lid);
  await fadeIn([lid], 260);

  guide.say(`One piece left. A metal lid called the heat spreader sits on the back of the die
    and carries its heat out to a cooler.`);
  stage.focus(lid, { label: 'heat spreader', at: 'top' });
  await guide.button('Drop the lid ▸');

  stage.clearFocus();
  await Anim.tween(620, p => { lid.setAttribute('transform', `translate(0 ${(-LID.lift * (1 - p)).toFixed(1)})`); });
  lid.setAttribute('transform', 'translate(0 0)');
  SFX.dope();

  guide.aha(`That is a packaged chip. It started this act as sand, and it can now be plugged
    into a board and switched on.`,
    `The rest of the tray goes down the same line, one die at a time.`);
  stage.focus(pkg, { label: 'packaged chip', at: 'left' });
  await guide.next();
}
