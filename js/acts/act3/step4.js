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
// Course restructure (2026-10-25): seven theory cards were cut or merged, a joining-dies
// scene (reticle limit, chiplets, interposer, CoWoS) now ends the theory, the aha moved
// before the lab, and the four package lab cards are two. Act 4 points back to the interposer.
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
import { makePlacer, makeRaisedTiles, slideInPanel } from '../../engine/components.js';
import { makeWaferMap } from '../../engine/fab.js';
import { packagesHTML } from './lab.js';

/* ---------- geometry, in the stage's 720×480 user units ---------- */
const WAFER = { cx: 384, cy: 228, r: 146, die: 34 };
const TRAY = { x: 44, y: 136, w: 156, h: 188 };
const CX = 360;                                     // the package's centre line
const SUB = { x: 150, y: 334, w: 420, h: 46 };      // the substrate (a small circuit board)
const BUMP = { n: 8, gap: 36, r: 6 };               // solder bumps, on the die's pads
const BALL = { n: 8, gap: 52, r: 9 };               // solder balls, under the substrate
const DIE = { w: 300, h: 44, x: CX - 150, home: 150, bond: 277, face: 9 };

const bumpX = i => CX - (BUMP.n - 1) * BUMP.gap / 2 + i * BUMP.gap;
const ballX = i => CX - (BALL.n - 1) * BALL.gap / 2 + i * BALL.gap;

/* the wafer's defect map. Recorded through flow.ask so replay reproduces it exactly. */
const SEED = 20260809;
const DEFECTS = 9;

/* ---------- REVIEW_NOTES N-051: six real packaged chips, side by side ----------
   Each is drawn from above at 2.1 px per mm, so the sizes compare. The RP2040 (7 mm QFN)
   and the Ryzen's AM5 package (40 mm) are published sizes; the others are estimates from
   photos, so the caption says "roughly to scale". Die sizes in the cards are published or
   widely measured figures (see the note in REVIEW_NOTES.md). Colours follow the package
   from above earlier in this step: green substrate, grey silicon, dark moulded memory. */
const MM = 2.1;
const SUBS = 'fill="rgba(92,107,69,.24)" stroke="var(--green)" stroke-width="1.2"';
const DARK = 'fill="#2f322b" stroke="#55594d" stroke-width="1"';
const DIE_FILL = 'fill="url(#dieSheen)" stroke="var(--ink-soft)" stroke-width=".8"';
const r = (x, y, w, h, attrs, rx = 1.5) => `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${rx}" ${attrs}/>`;
const CHIPS = [
  { key: 'rp2040', name: 'RP2040', use: 'MICROCONTROLLER', watts: 'UNDER 1 W', mm: [7, 7], draw(w, h){
    let pads = '';
    for (let i = 0; i < 5; i++){
      const t = 2.2 + i * (w - 4.4) / 4;
      pads += r(t - .6, -1, 1.2, 2, 'fill="#c9c3b1"', 0) + r(t - .6, h - 1, 1.2, 2, 'fill="#c9c3b1"', 0)
        + r(-1, t - .6, 2, 1.2, 'fill="#c9c3b1"', 0) + r(w - 1, t - .6, 2, 1.2, 'fill="#c9c3b1"', 0);
    }
    return pads + r(0, 0, w, h, DARK, 1.2) + `<circle cx="2.6" cy="2.6" r="1" fill="#8d917f"/>`;
  } },
  { key: 'a18', name: 'A18 PRO', use: 'PHONE', watts: 'A FEW W', mm: [15, 15], draw(w, h){
    return r(0, 0, w, h, SUBS, 2) + r(2.5, 2.5, w - 5, h - 5, DARK, 1.5)
      + `<circle cx="6" cy="6" r="1.2" fill="#8d917f"/>`;
  } },
  { key: 'm4', name: 'M4', use: 'LAPTOP, TABLET', watts: '5 TO 40 W', mm: [30, 24], draw(w, h){
    let caps = '';
    for (let i = 0; i < 4; i++) caps += r(4 + i * 6, h - 7, 3.4, 2, 'fill="var(--amber)"', .5);
    return r(0, 0, w, h, SUBS, 3) + r(4, 7, 28, 28, DIE_FILL, 1.2)
      + r(37, 4, 21, 19.5, DARK, 1.5) + r(37, 26.5, 21, 19.5, DARK, 1.5) + caps;
  } },
  { key: '9950x', name: 'RYZEN 9 9950X', use: 'DESKTOP PC', watts: '170 W', mm: [40, 40], draw(w, h){
    /* the AM5 lid, with notches down both sides where capacitors show through */
    const L = 4, R = w - 4, T = 4, B = h - 4, n1 = 26, n2 = 58, d = 9;
    const lid = `M${L} ${T} H${R} V${n1} H${R - d} V${n2} H${R} V${B} H${L} V${n2} H${L + d} V${n1} H${L} Z`;
    let caps = '';
    for (let i = 0; i < 5; i++){ caps += r(5, n1 + 3 + i * 6, 2, 3.4, 'fill="var(--amber)"', .5) + r(w - 7, n1 + 3 + i * 6, 2, 3.4, 'fill="var(--amber)"', .5); }
    return r(0, 0, w, h, SUBS, 3) + caps
      + `<path d="${lid}" fill="url(#lidSheen)" stroke="var(--ink-soft)" stroke-width="1"/>`
      + r(22, 14, 18, 26, 'fill="none" stroke="var(--ink-soft)" stroke-width=".9" stroke-dasharray="3 2"', 1)
      + r(44, 14, 18, 26, 'fill="none" stroke="var(--ink-soft)" stroke-width=".9" stroke-dasharray="3 2"', 1)
      + r(26, 48, 32, 22, 'fill="none" stroke="var(--ink-soft)" stroke-width=".9" stroke-dasharray="3 2"', 1);
  } },
  { key: 'h100', name: 'H100', use: 'AI DATA CENTRE', watts: 'UP TO 700 W', mm: [58, 58], draw(w, h){
    const die = [52, 68], hb = 21, ix = (w - (die[0] + 2 * (hb + 3))) / 2, iy = (h - die[1] - 8) / 2;
    let out = r(0, 0, w, h, SUBS, 3) + r(ix - 3, iy, die[0] + 2 * (hb + 3) + 6, die[1] + 8, 'fill="rgba(29,33,23,.12)" stroke="var(--ink-faint)" stroke-width=".8"', 2);
    const dx = ix + hb + 3, dy = iy + 4;
    out += r(dx, dy, die[0], die[1], DIE_FILL, 1.2);
    for (let i = 0; i < 3; i++){
      out += r(ix, dy + i * 23.5, hb, hb, DARK, 1.2) + r(dx + die[0] + 3, dy + i * 23.5, hb, hb, DARK, 1.2);
    }
    return out;
  } },
  { key: 'b200', name: 'B200', use: 'AI DATA CENTRE', watts: 'ABOUT 1,000 W', mm: [72, 70], draw(w, h){
    const die = [52, 66], hb = 21, iw = 2 * die[0] + 2 + 10, ih = die[1] + 2 * (hb + 3) + 8;
    const ix = (w - iw) / 2, iy = (h - ih) / 2;
    let out = r(0, 0, w, h, SUBS, 3) + r(ix, iy, iw, ih, 'fill="rgba(29,33,23,.12)" stroke="var(--ink-faint)" stroke-width=".8"', 2);
    const dy = iy + 4 + hb + 3;
    out += r(ix + 5, dy, die[0], die[1], DIE_FILL, 1.2) + r(ix + 7 + die[0], dy, die[0], die[1], DIE_FILL, 1.2);
    const step = (iw - 10 - hb) / 3;
    for (let i = 0; i < 4; i++){
      out += r(ix + 5 + i * step, iy + 4, hb, hb, DARK, 1.2) + r(ix + 5 + i * step, dy + die[1] + 3, hb, hb, DARK, 1.2);
    }
    return out;
  } },
];
const COL = [96, 80, 92, 100, 128, 158];            // column widths, wide enough for the labels

function chipLineup(svg){
  const panel = slideInPanel(svg, `
    <text x="360" y="76" class="lbl" style="fill:var(--ink)">SIX PACKAGED CHIPS, SEEN FROM ABOVE, DRAWN ROUGHLY TO SCALE</text>`, { lab: true });
  const defs = svgEl('defs');
  defs.innerHTML = `<linearGradient id="lidSheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e3e4e0"/><stop offset=".5" stop-color="#c5c8c3"/><stop offset="1" stop-color="#d9dbd6"/>
    </linearGradient>`;
  panel.g.appendChild(defs);
  const total = COL.reduce((a, b) => a + b, 0) + 4 * (COL.length - 1);
  let x = 360 - total / 2;
  const CY = 218, LY = 338;
  const items = CHIPS.map((c, i) => {
    const w = c.mm[0] * MM, h = c.mm[1] * MM, cx = x + COL[i] / 2;
    x += COL[i] + 4;
    const g = svgEl('g');
    g.innerHTML = c.draw(w, h);
    g.style.transform = `translate(${(cx - w / 2).toFixed(1)}px,${(CY - h / 2).toFixed(1)}px)`;
    panel.g.appendChild(g);
    const lab = svgEl('g');
    lab.innerHTML = `
      <text x="${cx.toFixed(1)}" y="${LY}" class="lbl" style="fill:var(--ink)">${c.name}</text>
      <text x="${cx.toFixed(1)}" y="${LY + 15}" class="lbl-faint" font-size="8">${c.use}</text>
      <text x="${cx.toFixed(1)}" y="${LY + 30}" class="lbl" font-size="8.5" style="fill:var(--amber)">${c.watts}</text>`;
    panel.g.appendChild(lab);
    return { g, w, h, lab, key: c.key };
  });
  makeRaisedTiles(svg, items, { style: 'lift' });
  /* one chip at a time: the rest dim, as stage.focus would do on the stage itself */
  const focus = key => items.forEach(t => {
    const on = !key || [].concat(key).includes(t.key);
    t.g.style.transition = t.lab.style.transition = 'opacity .3s';
    t.g.style.opacity = t.lab.style.opacity = on ? '1' : '.2';
  });
  return { ...panel, focus };
}

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
  guide.title('STEP 4 / 5', 'How do you <em>package a chip?</em>');
  guide.cards();

  const stage = newStage('13', 'A wafer diced into loose dies, then one die bonded face down onto a substrate and sealed under a lid');
  const { svg } = stage;

  /* ================= SCENE A — dice the wafer ================= */

  const wafer = makeWaferMap(svg, { cx: WAFER.cx, cy: WAFER.cy, r: WAFER.r });
  wafer.tile(WAFER.die, WAFER.die);

  guide.say(`The wafer is printed and every die on it has been tested. A die on its own
    still cannot do anything until it is cut free, connected to the outside and sealed.`);
  stage.focus(wafer.g, { label: 'tested wafer', at: 'bottom' });
  const seed = await nextRecording('Next ▸', SEED);

  // Course restructure (2026-10-25): the "one die" card and the "failed their test" card
  // were merged, because both repeated step 3's wafer map. The map lands straight away.
  /* the defect map lands now, seeded from the answer above */
  stage.clearFocus();
  wafer.scatter(seed, DEFECTS);
  const stats = wafer.stats();
  const scrap = wafer.dies.filter(d => d.state === 'defect' || d.state === 'edge');

  const tally = svgEl('text', { x: WAFER.cx, y: WAFER.cy + WAFER.r + 30, class: 'lbl-strong' });
  tally.textContent = `GOOD ${stats.good} · DEAD ${stats.defect}`;
  svg.appendChild(tally);
  await fadeIn([tally], 260);

  guide.say(`This is the wafer map from step 3. Each square is one die, and the
    ${stats.defect} red ones failed their test.`);
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

  guide.say(`A diamond blade cuts along the gaps between the dies. It makes one pass
    across the wafer, then a second pass at right angles to the first.`);
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

  guide.say(`The wafer is diced (cut apart), and every die is loose. Nothing was ever
    printed in the gaps, because the blade was always going to come through them.`);
  stage.focus(wafer.g, { label: 'diced', at: 'top' });   // 'bottom' collides with the tally
  await guide.next();

  stage.clearFocus();
  guide.say(`Every stage from here on costs money for each die that goes through it, so
    the red dies and the part dies at the edge stop here.`);
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

  guide.say(`${stats.good} good dies are in the tray. Each one now gets its own package,
    the case that connects it to the outside and seals it, built one die at a time.`);
  stage.focus(trayG, { label: 'good dies', at: 'top' });
  await guide.next();

  /* ================= SCENE B — what a die is, then flip-chip, step by step =========
     Rebuilt 2026-10-17 from Ripu's review: first a cut-away of one die so the player knows
     what the die, its active side and its pads are; then the substrate as an adapter; then
     the standard flip-chip sequence (flux, flip and place, reflow, remove flux, underfill,
     cure), each with its own picture; then the signal path and the lid. */

  stage.clearFocus();
  await fadeOut([wafer.g, kerf, tally, trayG], 300);

  /* ---------- the cut-away: one die, layers drawn far taller than real ---------- */
  const Z = { x: 150, w: 420, padTop: 118, wireTop: 128, trTop: 184, bodyTop: 200, bot: 352 };
  const zoomG = svgEl('g');
  svg.appendChild(zoomG);
  let wires = '';
  for (let k = 0; k < 6; k++){                     // six wiring levels, thicker going up
    const y = Z.trTop - 8 - k * 9, h = 2 + k * 0.6, seg = 26 + k * 10;
    for (let x = Z.x + 8 + (k % 2) * 12; x + seg < Z.x + Z.w - 6; x += seg + 14){
      wires += `<rect x="${x}" y="${(y - h / 2).toFixed(1)}" width="${seg}" height="${h.toFixed(1)}" fill="var(--amber)" opacity="${(0.55 + k * 0.07).toFixed(2)}"/>`;
      wires += `<line x1="${x + 4}" y1="${(y + h / 2).toFixed(1)}" x2="${x + 4}" y2="${(y + 9 - h / 2).toFixed(1)}" stroke="var(--amber)" stroke-width="1.4" opacity=".6"/>`;
    }
  }
  let trs = '';
  for (let i = 0; i < 14; i++){                    // a row of transistors: N and P patches, gates
    const x = Z.x + 12 + i * 29;
    trs += `<rect x="${x}" y="${Z.trTop + 7}" width="11" height="8" rx="1.5" class="${i % 2 ? 'p-region' : 'n-region'}"/>`;
    trs += `<rect x="${x + 13}" y="${Z.trTop + 2}" width="9" height="5" rx="1" class="gate-metal"/>`;
  }
  let pads = '';
  for (let i = 0; i < 6; i++){
    pads += `<rect class="z-pad" x="${Z.x + 30 + i * 68}" y="${Z.padTop}" width="30" height="9" rx="1.5" fill="var(--amber)"/>`;
  }
  zoomG.innerHTML = `
    <text x="${Z.x + Z.w / 2}" y="66" class="lbl-faint">ONE DIE, CUT THROUGH AND SEEN FROM THE SIDE</text>
    <rect class="z-body" x="${Z.x}" y="${Z.bodyTop}" width="${Z.w}" height="${Z.bot - Z.bodyTop}" rx="3"
      fill="rgba(29,33,23,.05)" stroke="var(--hairline-strong)" stroke-width="1.2"/>
    <text x="${Z.x + Z.w / 2}" y="${(Z.bodyTop + Z.bot) / 2 + 4}" class="lbl-faint">PLAIN SILICON</text>
    <g class="z-tr"><rect x="${Z.x}" y="${Z.trTop}" width="${Z.w}" height="${Z.bodyTop - Z.trTop}" fill="rgba(29,33,23,.03)" stroke="var(--hairline)" stroke-width="1"/>${trs}</g>
    <g class="z-wire"><rect x="${Z.x}" y="${Z.wireTop}" width="${Z.w}" height="${Z.trTop - Z.wireTop}" fill="rgba(168,116,31,.05)" stroke="var(--hairline)" stroke-width="1"/>${wires}</g>
    <g class="z-pads">${pads}</g>
    <text x="${Z.x + Z.w / 2}" y="378" class="lbl-faint">NOT TO SCALE: THE TOP LAYERS ARE DRAWN FAR THICKER THAN THEY ARE</text>`;
  zoomG.style.display = 'none';
  await fadeIn([zoomG], 360);
  const zq = c => zoomG.querySelector(c);

  guide.say(`Here is one die, cut through and seen from the side. It is drawn much taller than
    it really is, so that you can see its layers.`);
  stage.focus(zoomG, { label: 'one die', at: 'right', ring: false });
  await guide.next();

  // Course restructure (2026-10-25): three cards (plain silicon, transistors, wiring) were
  // the act's third cross-section after step 2's, so they are now one card that points back.
  guide.say(`It has the same layers as the slice from step 2. Plain silicon at the bottom only
    holds the die up, a thin layer of transistors sits on top of it, and the wiring layers above
    join the transistors.`);
  stage.focus([zq('.z-body'), zq('.z-tr'), zq('.z-wire')], { label: 'same as step 2', at: 'left' });
  await guide.next();

  guide.say(`On the very top surface are the <b>pads</b>: small, flat squares of metal. Every
    signal that enters or leaves the die goes through a pad.`);
  stage.focus(zq('.z-pads'), { label: 'pads', at: 'top' });
  await guide.next();

  guide.say(`So the die is the whole block. Its working side, the thin band of transistors,
    wiring and pads, is only about a hundredth of a millimetre thick, on a die about three
    quarters of a millimetre thick. That working side is called the <b>active side</b>.`);
  stage.focus([zq('.z-tr'), zq('.z-wire'), zq('.z-pads')], { label: 'active side', at: 'right' });
  await guide.next();

  // Course restructure (2026-10-25): trimmed from 63 words to 36.
  guide.say(`The pads are about a tenth of a millimetre apart. A circuit board cannot be made
    that fine: its connections are a third of a millimetre to a millimetre apart. So the die
    needs an adapter in between.`);
  stage.focus(zq('.z-pads'), { label: 'too small for a board', at: 'top' });
  await guide.next();

  /* ---------- the package scene, at real proportions ---------- */
  stage.clearFocus();
  await fadeOut([zoomG], 300);
  const pkg = svgEl('g');
  svg.appendChild(pkg);

  /* the die, drawn at the origin with its active side up; bumps sit on its pads */
  const dieG = svgEl('g', { class: 'tile', 'aria-label': 'die' });
  const dieInner = svgEl('g');
  dieInner.innerHTML = `
    <rect x="0" y="0" width="${DIE.w}" height="${DIE.h}" rx="3" class="tile-bg"/>
    <rect x="0" y="0" width="${DIE.w}" height="${DIE.face}" fill="rgba(168,116,31,.16)"/>
    <line x1="0" y1="${DIE.face}" x2="${DIE.w}" y2="${DIE.face}" stroke="var(--amber)" stroke-width="1.2"/>
    ${Array.from({ length: BUMP.n }, (_, i) => {
      const x = bumpX(i) - DIE.x;
      return `<rect class="pad" x="${(x - 7).toFixed(1)}" y="-1.5" width="14" height="3" rx="1" fill="var(--amber)"/>
        <ellipse class="bump" cx="${x.toFixed(1)}" cy="${-BUMP.r - 1}" rx="${BUMP.r}" ry="${BUMP.r}" fill="var(--amber)" stroke="var(--ink)" stroke-width=".8"/>`;
    }).join('')}`;
  dieG.appendChild(dieInner);
  // outside the flipping group, so the word never turns upside down
  const dieWord = svgEl('text', { x: DIE.w / 2, y: DIE.h / 2 + 4, class: 'lbl-faint', 'font-size': 10 });
  dieWord.textContent = 'DIE';
  dieG.appendChild(dieWord);
  pkg.appendChild(dieG);
  const bumps = [...dieInner.querySelectorAll('.bump')];
  const dieTile = { g: dieG, value: 'DIE', w: DIE.w, h: DIE.h, home: { x: DIE.x, y: DIE.home }, tx: 0, ty: 0, slot: null };
  dieG.style.transform = `translate(${DIE.x}px,${DIE.home}px)`;
  dieG.style.display = 'none';
  await fadeIn([dieG], 300);

  guide.say(`Here is the same die at its real proportions, active side up. Before it was cut
    from the wafer, each of its pads was given a tiny ball of solder, called a <b>bump</b>.
    Solder is a metal that melts at about 220 °C and sets hard as it cools.`);
  stage.focus(dieG, { label: 'die, with bumps on its pads', at: 'top' });
  await guide.next();

  /* the substrate: a small fine circuit board that fans the connections out */
  stage.clearFocus();
  const subG = svgEl('g');
  const subBody = svgEl('rect', { x: SUB.x, y: SUB.y, width: SUB.w, height: SUB.h, rx: 3,
    fill: 'rgba(92,107,69,.18)', stroke: 'var(--green)', 'stroke-width': 1.4 });
  const subPads = svgEl('g');
  for (let i = 0; i < BUMP.n; i++){
    subPads.appendChild(svgEl('rect', { x: bumpX(i) - 7, y: SUB.y - 2, width: 14, height: 3, rx: 1, fill: 'var(--amber)' }));
  }
  const traces = svgEl('g');
  for (let i = 0; i < BUMP.n; i++){
    const from = bumpX(i), to = ballX(i), mid = SUB.y + 11 + (i % 3) * 9;
    traces.appendChild(svgEl('path', {
      d: `M${from} ${SUB.y + 1} V${mid} H${to} V${SUB.y + SUB.h - 1}`,
      fill: 'none', stroke: 'var(--amber)', 'stroke-width': 1.6, 'stroke-linejoin': 'round', opacity: .85,
    }));
  }
  const balls = svgEl('g');
  for (let i = 0; i < BALL.n; i++){
    balls.appendChild(svgEl('circle', { cx: ballX(i), cy: SUB.y + SUB.h + BALL.r - 1, r: BALL.r,
      fill: 'rgba(168,116,31,.22)', stroke: 'var(--amber)', 'stroke-width': 1.3 }));
  }
  subG.append(subBody, traces, subPads, balls);
  pkg.insertBefore(subG, dieG);
  subG.style.display = 'none';
  await fadeIn([subG], 320);

  guide.say(`This is the adapter, called a <b>substrate</b>: a small, very fine circuit board.
    On top it has pads that line up exactly under the die's bumps.`);
  stage.focus([subBody, subPads], { label: 'substrate', at: 'left' });
  await guide.next();

  // Course restructure (2026-10-25): the solder-ball card was cut (it repeated the board
  // spacings), so the balls are named here, at the end of the wiring they lead to.
  guide.say(`Inside the substrate, copper wiring carries every connection outward to larger
    <b>solder balls</b> underneath. They are spaced as widely as the board needs, and later they
    connect the finished chip to it.`);
  stage.focus([traces, balls], { label: 'wiring out to solder balls', at: 'left' });
  await guide.next();

  /* 1 — flux */
  stage.clearFocus();
  const flux = svgEl('rect', { x: DIE.x - 10, y: SUB.y - 7, width: DIE.w + 20, height: 7, rx: 3,
    fill: 'rgba(168,116,31,.16)', stroke: 'var(--amber)', 'stroke-width': 1, 'stroke-dasharray': '3 2' });
  pkg.insertBefore(flux, dieG);
  flux.style.display = 'none';
  await fadeIn([flux], 320);
  guide.say(`Now the flip-chip steps, in order. First, a sticky liquid called <b>flux</b> is
    spread over the substrate's pads. It cleans the metal so the solder will bond, and it holds
    the die in place.`);
  stage.focus(flux, { label: 'flux', at: 'left' });
  await guide.next();

  /* 2 — flip */
  stage.clearFocus();
  guide.say(`The bumps are on top of the die, but they have to face down onto the substrate.
    So the die is turned upside down. This flip is why the method is called
    <b>flip-chip</b>.`);
  stage.focus(dieG, { label: 'active side is on top', at: 'top' });
  await guide.button('Turn the die over ▸');

  stage.clearFocus();
  SFX.click();
  await Anim.tween(700, p => {
    const k = Math.cos(Math.PI * p);
    dieInner.setAttribute('transform', `translate(0 ${DIE.h / 2}) scale(1 ${k.toFixed(4)}) translate(0 ${-DIE.h / 2})`);
  });
  dieInner.setAttribute('transform', `translate(0 ${DIE.h / 2}) scale(1 -1) translate(0 ${-DIE.h / 2})`);

  /* 3 — place */
  const slotRect = svgEl('rect', { x: DIE.x, y: DIE.bond, width: DIE.w, height: DIE.h, class: 'slot' });
  pkg.insertBefore(slotRect, dieG);
  const slot = { x: DIE.x, y: DIE.bond, w: DIE.w, h: DIE.h, rect: slotRect, value: null, tile: null, correct: 'DIE' };
  const placer = makePlacer({
    svg, tiles: [dieTile], slots: [slot],
    validate: v => v[0] === 'DIE',
    onPlace: () => { slotRect.style.opacity = '0'; },
  });

  guide.say(`The die is upside down, with every bump directly above its pad. <b>Your goal is
    to place the die on the substrate.</b> Drag it onto the dashed outline, or click the die
    and then the outline.`);

  await flow.ask(async replay => {
    if (replay !== undefined){ placer.autoPlace(); slotRect.style.opacity = '0'; return replay; }
    const cancel = flow.hintAfter(15000,
      `The die still has to go onto the substrate. Drag it down onto the dashed outline, or
       click the die once and then click the outline.`);
    dieG.addEventListener('pointerdown', cancel, { once: true });
    await placer.done;
    cancel();
    return true;
  });
  await sleep(460);                 // let the placer's slide finish before anything measures
  dieG.style.transition = 'none';
  slotRect.remove();

  /* a flame, for the two heating steps */
  const flame = svgEl('path', {
    d: `M${SUB.x + SUB.w + 34} ${SUB.y + 8} c -12 -10 -6 -24 2 -36 c 2 10 10 12 10 22 c 4 -4 4 -10 2 -14 c 10 8 8 24 -2 28 c -4 2 -9 2 -12 0 z`,
    fill: 'var(--red-soft)', stroke: 'var(--red)', 'stroke-width': 1.4,
  });
  pkg.appendChild(flame);
  flame.style.display = 'none';

  /* 4 — reflow. Course restructure (2026-10-25): the "flux is washed out" card was cut; the
     flux now fades as the bumps melt, so the gap is clear for the underfill. */
  await fadeIn([flame], 240);
  SFX.flow();
  await Anim.tween(620, p => {
    bumps.forEach(b => {
      b.setAttribute('ry', (BUMP.r - p * 1.5).toFixed(2));
      b.setAttribute('rx', (BUMP.r + p * 1.6).toFixed(2));
    });
    dieG.style.transform = `translate(${DIE.x}px,${(DIE.bond + p * 1.5).toFixed(2)}px)`;
    flux.style.opacity = String(1 - p);
  });
  flux.style.display = 'none';
  bumps.forEach(b => { b.style.fill = 'var(--ink)'; });
  SFX.success();
  guide.say(`Next the assembly goes through an oven. Every bump melts at the same moment,
    joins the pad below it, and sets as it cools. This step is called <b>reflow</b>.`);
  stage.focus(dieG, { label: 'every joint made at once', at: 'top' });
  await guide.next();

  /* 5 — underfill, then cure. Course restructure (2026-10-25): the underfill card and the
     curing card are now one card, shown after both happen on the stage. */
  stage.clearFocus();
  await fadeOut([flame], 200);
  const dieBottom = DIE.bond + 1.5 + DIE.h;
  const x0 = DIE.x, x1 = DIE.x + DIE.w;
  const underfill = svgEl('path', {
    d: `M${x0 - 18} ${SUB.y} Q${x0 - 2} ${SUB.y - 1} ${x0} ${dieBottom} H${x1} Q${x1 + 2} ${SUB.y - 1} ${x1 + 18} ${SUB.y} Z`,
    fill: 'rgba(29,33,23,.32)', stroke: 'none',
  });
  pkg.insertBefore(underfill, dieG);
  underfill.style.display = 'none';
  await fadeIn([underfill], 520);
  await fadeIn([flame], 220);
  await Anim.tween(520, p => { underfill.setAttribute('fill', `rgba(29,33,23,${(0.32 + p * 0.26).toFixed(3)})`); });
  await fadeOut([flame], 200);
  guide.say(`A liquid glue called <b>underfill</b> soaks into the gap around every bump, and a
    second, gentler heating hardens it. The die and the substrate grow by different amounts when
    warm, and the hardened underfill stops the joints cracking.`);
  stage.focus(underfill, { label: 'underfill', at: 'left' });
  await guide.next();

  /* one signal, out through the whole package */
  stage.clearFocus();
  const routeI = 5;
  const route = svgEl('path', {
    d: `M${bumpX(routeI)} ${dieBottom} V${SUB.y + 11 + (routeI % 3) * 9} H${ballX(routeI)} V${SUB.y + SUB.h + 2 * BALL.r}`,
    fill: 'none', stroke: 'var(--blue)', 'stroke-width': 2.6, 'stroke-linecap': 'round', opacity: 0,
  });
  pkg.appendChild(route);
  guide.say(`A signal leaving the die now has a complete path: from a pad, through a bump,
    along the substrate's copper wiring, out to a solder ball.`);
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

  /* the lid */
  stage.clearFocus();
  const LID = { x: SUB.x + 14, w: SUB.w - 28, top: DIE.bond - 26, wall: 12, lift: 150 };
  const lid = svgEl('path', {
    d: `M${LID.x} ${SUB.y} V${LID.top} H${LID.x + LID.w} V${SUB.y} H${LID.x + LID.w - LID.wall} V${LID.top + LID.wall} H${LID.x + LID.wall} V${SUB.y} Z`,
    fill: 'var(--paper-high)', stroke: 'var(--ink)', 'stroke-width': 1.6, 'stroke-linejoin': 'round',
  });
  lid.setAttribute('transform', `translate(0 ${-LID.lift})`);
  pkg.appendChild(lid);
  await fadeIn([lid], 260);

  guide.say(`Last comes a metal lid called the <b>heat spreader</b>. It sits on the back of
    the die, on a thin layer of heat-conducting paste, and carries the die's heat out to a
    cooler.`);
  stage.focus(lid, { label: 'heat spreader', at: 'top' });
  await guide.button('Drop the lid ▸');

  stage.clearFocus();
  await Anim.tween(620, p => { lid.setAttribute('transform', `translate(0 ${(-LID.lift * (1 - p)).toFixed(1)})`); });
  lid.setAttribute('transform', 'translate(0 0)');
  SFX.dope();

  /* ---------- REVIEW_NOTES N-036: the package from above ---------- */
  stage.clearFocus();
  await fadeOut([pkg], 320);

  /* the bird's-eye view: substrate, die back, underfill rim, capacitors, lid outline */
  const T = { x: 250, y: 92, s: 236 };              // substrate square
  const D = { w: 110, h: 132 };                     // die, centred on the substrate
  const dx = T.x + (T.s - D.w) / 2, dy = T.y + (T.s - D.h) / 2;
  let caps = '';
  const capAt = (x, y, vertical) => {
    const w = vertical ? 7 : 14, h = vertical ? 14 : 7;
    caps += `<g class="cap"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1" fill="var(--paper-high)" stroke="var(--ink-soft)" stroke-width=".8"/>`
      + (vertical
        ? `<rect x="${x}" y="${y}" width="${w}" height="3.5" fill="var(--amber)"/><rect x="${x}" y="${y + h - 3.5}" width="${w}" height="3.5" fill="var(--amber)"/>`
        : `<rect x="${x}" y="${y}" width="3.5" height="${h}" fill="var(--amber)"/><rect x="${x + w - 3.5}" y="${y}" width="3.5" height="${h}" fill="var(--amber)"/>`)
      + `</g>`;
  };
  for (let i = 0; i < 6; i++){
    capAt(dx + 6 + i * 17, dy - 26, false);
    capAt(dx + 6 + i * 17, dy + D.h + 19, false);
  }
  for (let i = 0; i < 6; i++){
    capAt(dx - 22, dy + 12 + i * 19, true);
    capAt(dx + D.w + 15, dy + 12 + i * 19, true);
  }
  // the die's sheen lives in its own always-visible <defs>, because a gradient inside a
  // hidden group may not paint
  const sheen = svgEl('defs');
  sheen.innerHTML = `<linearGradient id="dieSheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#cfd2cf"/><stop offset=".45" stop-color="#b7bbb8"/>
      <stop offset=".55" stop-color="#d6d9d6"/><stop offset="1" stop-color="#a9adaa"/>
    </linearGradient>`;
  svg.appendChild(sheen);
  const topG = svgEl('g');
  topG.innerHTML = `
    <text x="${T.x + T.s / 2}" y="${T.y - 18}" class="lbl-faint">THE PACKAGE FROM ABOVE, LID LIFTED OFF</text>
    <rect class="t-sub" x="${T.x}" y="${T.y}" width="${T.s}" height="${T.s}" rx="6"
      fill="rgba(92,107,69,.24)" stroke="var(--green)" stroke-width="1.6"/>
    <path d="M${T.x + 8} ${T.y + 8} h16 l-16 16 z" fill="var(--ink-soft)" opacity=".6"/>
    <rect x="${T.x + 14}" y="${T.y + 14}" width="${T.s - 28}" height="${T.s - 28}" rx="4" fill="none"
      stroke="var(--ink-faint)" stroke-width="1" stroke-dasharray="5 4"/>
    <text x="${T.x + T.s - 18}" y="${T.y + T.s - 20}" class="lbl-faint" font-size="9" text-anchor="end">WHERE THE LID SITS</text>
    <g class="t-caps">${caps}</g>
    <rect class="t-fill" x="${dx - 5}" y="${dy - 5}" width="${D.w + 10}" height="${D.h + 10}" rx="4" fill="rgba(29,33,23,.5)"/>
    <rect class="t-die" x="${dx}" y="${dy}" width="${D.w}" height="${D.h}" rx="2" fill="url(#dieSheen)" stroke="var(--ink-soft)" stroke-width="1"/>
    <line x1="${dx + 12}" y1="${dy + D.h - 10}" x2="${dx + D.w - 10}" y2="${dy + 12}" stroke="#fff" stroke-width="1.2" opacity=".35"/>
    <text x="${dx + D.w / 2}" y="${dy + D.h / 2 + 4}" class="lbl" font-size="10">BACK OF THE DIE</text>`;
  svg.appendChild(topG);
  topG.style.display = 'none';
  await fadeIn([topG], 380);
  const tq = c => topG.querySelector(c);

  guide.say(`Now look down on the package from above, with the lid lifted off. The green
    square is the substrate, and the grey rectangle in the middle is the die. You are looking
    at the back of the die, which is plain silicon, because its active side faces down onto the
    bumps.`);
  stage.focus([tq('.t-sub'), tq('.t-die')], { label: 'die on its substrate', at: 'right', ring: false });
  await guide.next();

  // Course restructure (2026-10-25): the capacitor card was cut; nothing later uses it.

  /* REVIEW_NOTES N-051: the lid goes on, and the chip is finished */
  stage.clearFocus();
  const L = { x: T.x + 14, y: T.y + 14, s: T.s - 28 };
  const lidTop = svgEl('g');
  lidTop.innerHTML = `
    <defs><linearGradient id="lidTopSheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e3e4e0"/><stop offset=".5" stop-color="#c5c8c3"/><stop offset="1" stop-color="#d9dbd6"/>
    </linearGradient></defs>
    <rect x="${L.x}" y="${L.y}" width="${L.s}" height="${L.s}" rx="5" fill="url(#lidTopSheen)" stroke="var(--ink-soft)" stroke-width="1.2"/>
    <line x1="${L.x + 16}" y1="${L.y + L.s - 14}" x2="${L.x + L.s - 14}" y2="${L.y + 16}" stroke="#fff" stroke-width="1.4" opacity=".4"/>
    <text x="${L.x + L.s / 2}" y="${L.y + L.s / 2 - 8}" class="lbl" style="fill:var(--ink);font-size:15px;letter-spacing:.16em">BYODC-1</text>
    <text x="${L.x + L.s / 2}" y="${L.y + L.s / 2 + 14}" class="lbl" font-size="9">MADE FROM SAND</text>
    <text x="${L.x + L.s / 2}" y="${L.y + L.s / 2 + 30}" class="lbl-faint" font-size="8.5">BATCH 2610 · 0419</text>
    <circle cx="${L.x + 14}" cy="${L.y + 14}" r="3.2" fill="var(--ink-soft)"/>`;
  topG.appendChild(lidTop);
  lidTop.style.opacity = '0';
  topG.querySelector('text').textContent = 'THE FINISHED PACKAGE FROM ABOVE, LID ON';
  await Anim.tween(560, p => {
    lidTop.style.opacity = String(Math.min(1, p * 1.6));
    lidTop.setAttribute('transform', `translate(0 ${(-40 * (1 - p)).toFixed(1)})`);
  });
  lidTop.removeAttribute('transform');
  SFX.dope();

  guide.say(`Last, the lid goes back on, printed with the chip's name and a batch number. This is
    the finished chip, in the form every chip is sold in.`);
  stage.focus(lidTop, { label: 'the finished chip', at: 'right', ring: false });
  await guide.next();

  /* ================= SCENE C — joining dies =================
     Course restructure (2026-10-25): Ripu's decision 2 in COURSE_RESTRUCTURE_PROPOSAL.md §6.
     Four cards at the end of the theory name the reticle limit, chiplets, the interposer and
     CoWoS, on one drawing that builds up card by card: a field against a die too big for it
     (from above, 4 px per mm), the die split into two chiplets, then memory stacks, the
     interposer and the substrate, with a side view below. Act 4 steps 5 and 6 point back
     here for "the interposer from Act 3 step 4". */
  stage.clearFocus();
  await fadeOut([topG], 320);
  const J = joinDiesScene(svg);
  const jq = c => J.querySelector(c);
  J.style.display = 'none';
  await fadeIn([J], 380);

  guide.say(`A die cannot be bigger than one field from step 3, because one flash prints one
    field. A field is at most 26 by 33 mm, about 858 mm². This is the <b>reticle limit</b>
    (reticle is another name for the mask).`);
  stage.focus([jq('.jd-field1'), jq('.jd-big'), jq('.jd-over')], { label: 'one field: 858 mm²', at: 'left', ring: false });
  await guide.next();

  /* the big die becomes two chiplets, each inside a field of its own */
  stage.clearFocus();
  await fadeOut([jq('.jd-over')], 260);
  const halfL = jq('.jd-half-l'), halfR = jq('.jd-half-r'), field1 = jq('.jd-field1');
  halfL.style.display = halfR.style.display = '';
  jq('.jd-big').style.display = 'none';
  SFX.click();
  await Anim.tween(560, p => {
    const d = (JD.part * p).toFixed(2);
    halfL.setAttribute('transform', `translate(-${d} 0)`);
    field1.setAttribute('transform', `translate(-${d} 0)`);
    halfR.setAttribute('transform', `translate(${d} 0)`);
  });
  await fadeIn([jq('.jd-field2'), ...J.querySelectorAll('.jd-words')], 300);

  guide.say(`So a chip that needs more than one field is built from several dies joined in one
    package. These dies are called <b>chiplets</b>. Each is smaller, so, as in step 3, fewer are
    lost to dust.`);
  stage.focus([halfL, halfR], { label: 'two chiplets', at: 'bottom' });
  await guide.next();

  /* memory beside them, then the interposer under them and the substrate under that */
  stage.clearFocus();
  await fadeOut([field1, jq('.jd-field2')], 260);
  await fadeIn([jq('.jd-stacks')], 320);
  await fadeIn([jq('.jd-sub-top'), jq('.jd-inter-top')], 360);
  jq('.jd-cap').textContent = 'TWO CHIPLETS AND MEMORY ON AN INTERPOSER, FROM ABOVE AND FROM THE SIDE';
  await fadeIn([jq('.jd-side')], 380);
  SFX.dope();

  guide.say(`Those dies, and the memory beside them, need thousands of wires between them, too
    fine for a substrate. So they sit on an <b>interposer</b>: a slice of silicon wired like the
    top of a die, which sits on the substrate.`);
  stage.focus([jq('.jd-inter-top'), jq('.jd-inter-side')], { label: 'interposer', at: 'right', ring: false });
  await guide.next();

  stage.clearFocus();
  await fadeIn([jq('.jd-layers')], 320);
  guide.say(`TSMC calls this <b>CoWoS</b> (chip on wafer on substrate). This is why you read that
    advanced packaging is the bottleneck for AI chips: in 2023 TSMC could print H100 dies faster
    than it could package them.`);
  stage.focus(jq('.jd-side'), { label: 'CoWoS', at: 'top', ring: false });
  await guide.next();

  /* Course restructure (2026-10-25): the aha closes the theory, before the lab (DESIGN.md
     §6d rule 8). It used to come after the six chips. Its second line now covers chiplets. */
  stage.clearFocus();
  guide.aha(`That is a packaged chip. It started this act as sand, and it can now be soldered
    onto a board and switched on.`,
    `A chip bigger than one field is several chiplets on one interposer, sealed in one package.`);
  await guide.next();

  /* In the Lab (DESIGN.md §6d rule 8): the three package shapes a student handles, each
     from above and from the side, before the six real chips. The flip-chip package just
     built is a BGA, so the section starts from it.
     Course restructure (2026-10-25): four package cards (intro, DIP, QFP, BGA) are now two. */
  stage.clearFocus();
  const shapes = slideInPanel(svg, packagesHTML(), { lab: true });
  shapes.focus('bga');
  await shapes.show();
  guide.lab(`You will meet three package shapes in a lab. The one you built is on the right: a
    <b>BGA</b> (ball grid array), with solder balls in a grid underneath. The chip on a Basys 3
    board has 236 balls under a 10 mm square.`, { intro: true });
  await guide.next();

  shapes.focus(['dip', 'qfp']);
  guide.lab(`On the left is a <b>DIP</b> (dual in-line package), whose two rows of legs fit a
    breadboard. In the middle is a <b>QFP</b> (quad flat package), with legs on all four sides
    soldered onto the board. Both hold the ATmega328P, the chip on an Arduino.`);
  await guide.next();

  /* REVIEW_NOTES N-051: real chips, side by side, and how their packages differ */
  stage.clearFocus();
  const lineup = chipLineup(svg);
  await shapes.swapTo(lineup);      // N-053: no flash of the stage between panels

  guide.lab(`Every chip you can buy is packaged in this way, but the package changes with the
    device the chip goes into. Here are six real ones, drawn roughly to scale.`);
  await guide.next();

  lineup.focus('rp2040');
  guide.lab(`The smallest is the RP2040, a microcontroller from Raspberry Pi. It controls small
    gadgets, such as a thermostat, on well under a watt. Its die is about 2 mm², in a plastic
    package 7 mm square, and it costs about a dollar.`);
  await guide.next();

  lineup.focus('a18');
  guide.lab(`The A18 Pro is the main chip in the iPhone 16 Pro. Its memory chip is stacked right
    on top of it to save space, and it works on a few watts, because a phone has no fan.`);
  await guide.next();

  lineup.focus('m4');
  guide.lab(`The M4, used in the MacBook Air and iPad Pro, has 28 billion transistors on one
    grey die. Its two dark memory chips sit beside the die on the same package. It uses about
    5 W in an iPad and up to about 40 W in a Mac mini.`);
  await guide.next();

  /* Course restructure (2026-10-25): the last three chips are now named with the terms from
     the joining-dies cards. The Ryzen's chiplets are joined through its substrate (no
     interposer); the H100 uses CoWoS-S and the B200 CoWoS-L, both with an interposer. */
  lineup.focus('9950x');
  guide.lab(`The Ryzen 9 9950X is a desktop processor. Under its metal lid are three chiplets,
    shown dashed: two holding eight cores each, and one linking them to the rest of the PC. The
    substrate wires them together, with no interposer.`);
  await guide.next();

  lineup.focus('h100');
  guide.lab(`The H100 is a GPU for AI data centres. Its one die is 814 mm², just under the
    reticle limit. Six memory stacks sit beside it on an interposer, packaged with CoWoS. It
    draws up to 700 W.`);
  await guide.next();

  lineup.focus('b200');
  guide.lab(`The B200 that followed it joins two chiplets of about 800 mm² each on one
    interposer, also with CoWoS, with eight memory stacks around them. It draws about 1,000 W,
    more than the other five chips here put together.`);
  await guide.next();

  lineup.focus(null);
  guide.lab(`So the device decides the package. A phone needs a chip that is small and stays
    cool. A desktop has room for a lid and a big cooler. An AI chip needs its memory as close to
    its dies as possible.`);
  await guide.next();
  await lineup.hide();
}

/* ---------- Course restructure (2026-10-25): the joining-dies drawing ----------
   From above at JD.k px per mm, so the field and the dies compare: one field is 26 × 33 mm,
   the die that does not fit is 50 × 32 mm (1,600 mm²), and each chiplet is half of it,
   25 × 32 mm (800 mm², about a B200 die). The memory stacks, interposer and substrate are
   drawn roughly to scale; the side view below keeps the same widths but exaggerates height.
   Colours follow this step: grey sheen for silicon, dark for moulded memory, green for the
   substrate, ink for solder that has set, blue for live signal wires in the interposer.
   Everything the cards bring in later starts hidden (display none) and is faded in by them. */
const JD = { k: 4, cx: 290, part: 12 };
function joinDiesScene(svg){
  const k = JD.k;
  const big = { x: JD.cx - 25 * k, y: 124, w: 50 * k, h: 32 * k };          // 1,600 mm²
  const fld = { x: big.x - 2, y: big.y - 2, w: 26 * k, h: 33 * k };          // one field
  const halfW = 25 * k;
  const hb = { w: 11 * k, h: 10 * k, gap: 4 };                               // memory stack
  const xL = big.x - JD.part - 6 - hb.w, xR = big.x + big.w + JD.part + 6;  // stack columns
  const inter = { x: xL - 8, y: big.y - 8, w: (xR + hb.w + 8) - (xL - 8), h: big.h + 16 };
  const sub = { x: inter.x - 30, y: 88, w: inter.w + 60, h: 200 };
  const S = { stackTop: 346, dieTop: 352, dieBot: 370, intTop: 374, intBot: 386, subTop: 392, subBot: 410 };

  const defs = svgEl('defs');      // always visible, so the pattern paints (see dieSheen)
  defs.innerHTML = `<pattern id="jdHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="6" stroke="var(--ink-soft)" stroke-width="1" opacity=".55"/>
    </pattern>`;
  svg.appendChild(defs);

  const rect = (x, y, w, h, attrs, rx = 2) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ${attrs}/>`;
  const DIE_SHEEN = 'fill="url(#dieSheen)" stroke="var(--ink-soft)" stroke-width="1"';
  const DARKM = 'fill="#2f322b" stroke="#55594d" stroke-width="1"';
  const hidden = 'style="display:none"';

  /* from above */
  let stacks = '';
  for (let i = 0; i < 3; i++){
    const y = big.y + i * (hb.h + hb.gap);
    stacks += rect(xL, y, hb.w, hb.h, DARKM, 1.5) + rect(xR, y, hb.w, hb.h, DARKM, 1.5);
  }
  const memY = inter.y + inter.h + 16;
  stacks += `<text x="${xL + hb.w / 2}" y="${memY}" class="lbl-faint" font-size="8">MEMORY</text>
    <text x="${xR + hb.w / 2}" y="${memY}" class="lbl-faint" font-size="8">MEMORY</text>`;

  const words = (x) => `<text x="${x + halfW / 2}" y="${big.y + big.h / 2 - 2}" class="lbl" font-size="9" style="fill:var(--ink)">CHIPLET</text>
    <text x="${x + halfW / 2}" y="${big.y + big.h / 2 + 12}" class="lbl" font-size="8" style="fill:var(--ink-soft)">800 MM²</text>`;
  /* each half carries its own words (hidden until the split), so focusing a half keeps them lit */
  const half = (cls, x) => `<g class="${cls}" ${hidden}>${rect(x, big.y, halfW, big.h, DIE_SHEEN)}<g class="jd-words" ${hidden}>${words(x)}</g></g>`;

  /* from the side: the same widths, heights exaggerated */
  const dL = big.x - JD.part, dR = big.x + halfW + JD.part;
  let wires = '';
  for (let i = 0; i < 3; i++){
    const y = S.intTop + 3 + i * 3;
    wires += `<path d="M${dL + 8 + i * 8} ${S.intTop} V${y} H${xL + hb.w - 8 - i * 8} V${S.intTop}"/>`
      + `<path d="M${dR + halfW - 8 - i * 8} ${S.intTop} V${y} H${xR + 8 + i * 8} V${S.intTop}"/>`
      + `<path d="M${dL + halfW - 6 - i * 6} ${S.intTop} V${y} H${dR + 6 + i * 6} V${S.intTop}"/>`;
  }
  let micro = '';
  for (let x = xL + 3; x < xR + hb.w - 2; x += 6){
    const onPart = (x > xL && x < xL + hb.w) || (x > dL && x < dL + halfW) || (x > dR && x < dR + halfW) || (x > xR && x < xR + hb.w);
    if (onPart) micro += `<circle cx="${x}" cy="${S.dieBot + 2}" r="1.6" fill="var(--ink)"/>`;
  }
  let c4 = '', balls = '';
  for (let x = inter.x + 8; x < inter.x + inter.w - 4; x += 14) c4 += `<circle cx="${x}" cy="${S.intBot + 3}" r="2.6" fill="var(--ink)"/>`;
  for (let x = sub.x + 14; x < sub.x + sub.w - 6; x += 24) balls += `<circle cx="${x}" cy="${S.subBot + 5}" r="5" fill="rgba(168,116,31,.22)" stroke="var(--amber)" stroke-width="1.2"/>`;
  let stackSide = '';
  for (const x of [xL, xR]){
    stackSide += rect(x, S.stackTop, hb.w, S.dieBot - S.stackTop, DARKM, 1);
    for (let j = 1; j < 4; j++) stackSide += `<line x1="${x + 1}" y1="${S.stackTop + j * 6}" x2="${x + hb.w - 1}" y2="${S.stackTop + j * 6}" stroke="#6b7062" stroke-width=".8"/>`;
  }
  const lx = 500;
  /* a leader to a label on the right; elbow: straight up first, then across */
  const lead = (x1, y1, y2, txt, elbow = false) => `<path d="M${x1} ${y1} ${elbow ? `V${y2} H${lx - 4}` : `L${lx - 4} ${y2}`}" fill="none" stroke="var(--ink-soft)" stroke-width=".8"/>
    <circle cx="${x1}" cy="${y1}" r="1.8" fill="var(--ink)"/>
    <text x="${lx}" y="${y2 + 3}" class="lbl" font-size="8.5" text-anchor="start" style="fill:var(--ink)">${txt}</text>`;

  const g = svgEl('g');
  g.innerHTML = `
    <text class="jd-cap lbl-faint" x="360" y="62">ONE FIELD AND A DIE TOO BIG FOR IT, FROM ABOVE, TO SCALE</text>
    <g class="jd-sub-top" ${hidden}>${rect(sub.x, sub.y, sub.w, sub.h, 'fill="rgba(92,107,69,.24)" stroke="var(--green)" stroke-width="1.4"', 5)}
      <text x="${sub.x + sub.w - 10}" y="${sub.y + 16}" class="lbl-faint" font-size="8" text-anchor="end">SUBSTRATE</text></g>
    <g class="jd-inter-top" ${hidden}>${rect(inter.x, inter.y, inter.w, inter.h, 'fill="rgba(29,33,23,.12)" stroke="var(--ink-soft)" stroke-width="1"', 3)}</g>
    <g class="jd-stacks" ${hidden}>${stacks}</g>
    <g class="jd-big">${rect(big.x, big.y, big.w, big.h, DIE_SHEEN)}</g>
    ${half('jd-half-l', big.x)}${half('jd-half-r', big.x + halfW)}
    <g class="jd-over">
      ${rect(fld.x + fld.w, big.y, big.x + big.w - fld.x - fld.w, big.h, 'fill="url(#jdHatch)"', 0)}
      <text x="${(fld.x + fld.w + big.x + big.w) / 2}" y="${big.y + big.h / 2 - 3}" class="lbl" font-size="8.5" style="fill:var(--ink)">OUTSIDE</text>
      <text x="${(fld.x + fld.w + big.x + big.w) / 2}" y="${big.y + big.h / 2 + 10}" class="lbl" font-size="8.5" style="fill:var(--ink)">THE FIELD</text>
      <text x="${JD.cx}" y="${big.y + big.h + 22}" class="lbl-faint" font-size="9">A DIE OF 50 × 32 MM = 1,600 MM²</text>
    </g>
    <g class="jd-field1">${rect(fld.x, fld.y, fld.w, fld.h, 'fill="none" stroke="var(--ink)" stroke-width="1.8" stroke-dasharray="6 4"', 2)}</g>
    <g class="jd-field2" ${hidden}>${rect(big.x + halfW + JD.part - 2, fld.y, fld.w, fld.h, 'fill="none" stroke="var(--ink)" stroke-width="1.8" stroke-dasharray="6 4"', 2)}</g>
    <g class="jd-side" ${hidden}>
      <text x="${sub.x}" y="${S.stackTop - 12}" class="lbl-faint" font-size="8" text-anchor="start">FROM THE SIDE, HEIGHTS NOT TO SCALE</text>
      ${rect(sub.x, S.subTop, sub.w, S.subBot - S.subTop, 'fill="rgba(92,107,69,.24)" stroke="var(--green)" stroke-width="1.2"', 2)}
      ${balls}${c4}
      <g class="jd-inter-side">${rect(inter.x, S.intTop, inter.w, S.intBot - S.intTop, 'fill="rgba(29,33,23,.12)" stroke="var(--ink-soft)" stroke-width="1"', 1)}
        <g fill="none" stroke="var(--blue)" stroke-width="1.1">${wires}</g></g>
      ${micro}
      ${rect(dL, S.dieTop, halfW, S.dieBot - S.dieTop, DIE_SHEEN, 1)}${rect(dR, S.dieTop, halfW, S.dieBot - S.dieTop, DIE_SHEEN, 1)}
      ${stackSide}
      <g class="jd-layers" ${hidden}>
        ${lead(dR + halfW / 2, (S.dieTop + S.dieBot) / 2, S.stackTop - 12, 'CHIP: THE CHIPLETS', true)}
        ${lead(inter.x + inter.w - 2, (S.intTop + S.intBot) / 2, 378, 'ON WAFER: THE INTERPOSER')}
        ${lead(sub.x + sub.w - 2, (S.subTop + S.subBot) / 2, 404, 'ON SUBSTRATE')}
      </g>
    </g>`;
  svg.appendChild(g);
  return g;
}
