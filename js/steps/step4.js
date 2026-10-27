// ACT 1 · STEP 4 — "Switch it with voltage, not current".
// Ported to the micro-learning contract (DESIGN_MAKEOVER.md §2, script in
// ACT1_MAKEOVER.md §3): one card at a time, every layer of the stack named and
// labelled at the moment it is placed, and the channel formed over three cards,
// one per thing the field actually does.
//
// Physics per DESIGN.md §4 rule 8: gate metal + glass + p-silicon are a CAPACITOR.
// Charge the top plate, the field pushes the holes down, then pulls electrons up
// against the underside of the glass, and that pressed-up sheet IS the channel.
// Conventional current runs battery+ → drain → channel → source → battery−.
//
// Discrete carriers: every hole and every channel electron is a dot at a fixed
// grid position, and apply(v) is a pure function of the gate voltage, so a replay
// lands on exactly the layout a live run ends on. No Math.random, no Date.now.
//
// The cross-section is drawn flat. A real MOSFET is three-dimensional with the
// gate wrapping the fin; that is logged as a 3D plate candidate in
// ASSET_3D_CANDIDATES.md and is deliberately not addressed here.
import { svgEl, sleep, clamp, waitFor } from '../engine/util.js';
import { Anim } from '../engine/anim.js';
import { SFX } from '../engine/sfx.js';
import { guide } from '../engine/guide.js';
import { flow } from '../engine/flow.js';
import { newStage } from '../engine/stage.js';
import { CurrentFlow } from '../engine/pathflow.js';
import { makeLamp, makeBattery, makeSlider, makeChip, makePlacer, cornerTicks, slideInPanel } from '../engine/components.js';
import { iso, PAL, SHEEN, to92 } from '../engine/reallife.js';
import { circuitNMOS, setLabState } from '../engine/labcircuits.js';

/* ---------------- how it looks in real life (HANDOFF_NEXT.md §1, approved for 1.4) --------
   Three columns on one slide-in panel: the NMOS as a part you can buy (a 2N7000 in its
   small TO-92 case, drawn at 6 px per mm), the FinFET, and gate-all-around nanosheets.
   The two chip transistors are drawn in 3D with the gate see-through, plus a cut across
   the gate underneath, so three sides against four is plain.
   Leg order is from the datasheet, flat face towards you: 2N7000 S G D.
   Course restructure (2026-10-25): the IRF540N (TO-220) is cut. It is a motor part the
   learner never uses again; the 2N7000 now sits alone, centred in its column. */
function realLifeHTML(){
  const parts = `<g data-k="to92">${to92({ cx: 120, base: 290, lines: ['2N', '7000'], pins: ['S', 'G', 'D'], caption: '2N7000' })}</g>`;

  /* the FinFET: two fins, the gate across them */
  const F = iso(1.5, 337, 168);
  const fin = (y, x0, x1, pal) => F.box(x0, y, 0, x1 - x0, 6, 26, pal);
  let ff = F.box(0, 0, -12, 100, 64, 12, PAL.p);
  ff += fin(14, 0, 38, PAL.n) + fin(40, 0, 38, PAL.n);
  ff += fin(14, 38, 62, PAL.p) + fin(40, 38, 62, PAL.p);
  ff += F.box(38, -4, 0, 24, 72, 36, PAL.gate, { opacity: .62 });
  ff += fin(14, 62, 100, PAL.n) + fin(40, 62, 100, PAL.n);
  const ffLab = (pt, dx, dy, txt) => {
    const [x, y] = F.P(...pt);
    return `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + dx).toFixed(1)}" y2="${(y + dy).toFixed(1)}" stroke="var(--ink-soft)" stroke-width=".8"/>
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.8" fill="var(--ink)"/>
      <text x="${(x + dx + (dx < 0 ? -3 : 3)).toFixed(1)}" y="${(y + dy + 3).toFixed(1)}" class="lbl" font-size="8.5" text-anchor="${dx < 0 ? 'end' : 'start'}" style="fill:var(--ink)">${txt}</text>`;
  };
  ff += ffLab([10, 43, 26], -26, -18, 'SOURCE') + ffLab([92, 17, 26], 16, -16, 'DRAIN')
    + ffLab([50, -4, 36], 0, -22, 'GATE').replace('text-anchor="start"', 'text-anchor="middle"')
    + ffLab([80, 46, 14], 14, 22, 'FIN');
  /* cut across the gate: fins standing on the silicon, gate over three sides */
  const fx = 360, fy = 372;
  const ffCut = `
    <rect x="${fx - 52}" y="${fy}" width="104" height="12" class="p-region"/>
    <rect x="${fx - 46}" y="${fy - 40}" width="92" height="40" rx="2" class="gate-metal"/>
    ${[-17, 17].map(o => `<rect x="${fx + o - 7}" y="${fy - 29}" width="14" height="29" fill="none" stroke="var(--amber)" stroke-width="2.2"/>
      <rect x="${fx + o - 5}" y="${fy - 27}" width="10" height="27" fill="#f4e4d6" stroke="var(--red)" stroke-width="1"/>`).join('')}
    <text x="${fx}" y="${fy + 28}" class="lbl-faint" font-size="8">CUT ACROSS THE GATE: THREE SIDES</text>`;

  /* gate-all-around: three flat sheets between a source and a drain, the gate around them */
  const G = iso(1.5, 563, 170);
  let ga = G.box(0, 0, -12, 100, 44, 12, PAL.p);
  ga += G.box(0, 6, 0, 34, 32, 34, PAL.n);
  [5, 14, 23].forEach(z => { ga += G.box(34, 8, z, 32, 28, 5, PAL.p, { sw: 1.3 }); });
  ga += G.box(34, 2, 0, 32, 40, 36, PAL.gate, { opacity: .34 });
  ga += G.box(66, 6, 0, 34, 32, 34, PAL.n);
  const gaLab = (pt, dx, dy, txt, anchor) => {
    const [x, y] = G.P(...pt);
    return `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + dx).toFixed(1)}" y2="${(y + dy).toFixed(1)}" stroke="var(--ink-soft)" stroke-width=".8"/>
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.8" fill="var(--ink)"/>
      <text x="${(x + dx + (anchor === 'end' ? -3 : anchor === 'start' ? 3 : 0)).toFixed(1)}" y="${(y + dy + (dy < 0 ? -4 : 10)).toFixed(1)}" class="lbl" font-size="8.5" text-anchor="${anchor}" style="fill:var(--ink)">${txt}</text>`;
  };
  ga += gaLab([6, 38, 30], -22, -14, 'SOURCE', 'end') + gaLab([94, 6, 34], 0, -20, 'DRAIN', 'middle')
    + gaLab([50, 2, 36], 0, -26, 'GATE', 'middle') + gaLab([66, 36, 16], 18, 18, 'SHEETS', 'start');
  const gx = 600, gy = 372;
  const gaCut = `
    <rect x="${gx - 52}" y="${gy}" width="104" height="12" class="p-region"/>
    <rect x="${gx - 40}" y="${gy - 42}" width="80" height="42" rx="2" class="gate-metal"/>
    ${[0, 1, 2].map(i => `<rect x="${gx - 25}" y="${gy - 13 - i * 12}" width="50" height="7" fill="#f4e4d6" stroke="var(--amber)" stroke-width="2"/>`).join('')}
    <text x="${gx}" y="${gy + 28}" class="lbl-faint" font-size="8">CUT ACROSS THE GATE: ALL FOUR SIDES</text>`;

  return `
    <defs>${SHEEN}</defs>
    <text x="120" y="66" class="lbl" style="fill:var(--ink)">A PART YOU CAN BUY</text>
    <text x="360" y="66" class="lbl" style="fill:var(--ink)">IN A CHIP: FINFET</text>
    <text x="600" y="66" class="lbl" style="fill:var(--ink)">NEWEST CHIPS: GATE-ALL-AROUND</text>
    <line x1="240" y1="54" x2="240" y2="410" stroke="var(--hairline)" stroke-dasharray="3 4"/>
    <line x1="480" y1="54" x2="480" y2="410" stroke="var(--hairline)" stroke-dasharray="3 4"/>
    ${parts}
    <g data-k="finfet">${ff}${ffCut}</g>
    <g data-k="gaa">${ga}${gaCut}</g>
    <text x="360" y="448" class="lbl-faint">THE NMOS, AS IT LOOKS IN REAL LIFE (THE CHIP TRANSISTORS ARE FAR SMALLER THAN THE PARTS)</text>`;
}

/* ---------------- geometry (720 × 480 stage user units) ---------------- */
const SUB      = { x: 140, y: 230, w: 440, h: 150 };   // p-type block
const WELL_SRC = { x: 158, y: 230, w: 96,  h: 54  };   // source, left
const WELL_DRN = { x: 466, y: 230, w: 96,  h: 54  };   // drain, right
const OXIDE    = { x: 262, y: 216, w: 196, h: 14  };   // the thin glass
const GATE     = { x: 262, y: 174, w: 196, h: 36  };   // the metal pad
const GAP      = { x: 254, y: 230, w: 212, h: 30  };   // bare P between the wells

const HOLE_ROWS = [258, 282, 306, 330];
const CH_X = [256, 282, 308, 334, 360, 386, 412, 438, 464];   // 9 channel slots
const ROW_A = 240, ROW_B = 252;
const ORDER_IN = [4, 3, 5, 2, 6, 1, 7];        // centre-out, inner seven
const ORDER_B  = [4, 3, 5, 2, 6, 1, 7, 0, 8];  // second layer, centre-out

const V_HOLES = 0.5;    // holes fully pushed down by here
const V_FULL  = 1.0;    // inner sheet complete
const VTH     = 1.2;    // sheet reaches both N regions

/* ---------------- small helpers ---------------- */
async function fadeIn(nodes, dur = 320){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  list.forEach(n => { n.style.opacity = '0'; n.style.display = ''; });
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(p); }));
  list.forEach(n => { n.style.opacity = '1'; });
}
async function fadeOut(nodes, dur = 280){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(1 - p); }));
  list.forEach(n => { n.style.display = 'none'; });
}

/* one 45° hatch for the depletion collars (own id, junction.js has its own) */
function ensureCollarHatch(svg){
  const root = svg.ownerSVGElement || svg;
  if (root.querySelector('#collar-hatch4')) return;
  let defs = root.querySelector('defs');
  if (!defs){ defs = svgEl('defs'); root.insertBefore(defs, root.firstChild); }
  const pat = svgEl('pattern', { id: 'collar-hatch4', patternUnits: 'userSpaceOnUse', width: 7, height: 7, patternTransform: 'rotate(45)' });
  pat.appendChild(svgEl('line', { x1: 0, y1: 0, x2: 0, y2: 7, class: 'depl-hatch-line' }));
  defs.appendChild(pat);
}

export async function step4(){
  guide.title('STEP 4 / 5', 'Can a transistor stay on <em>without spending any current?</em>');
  guide.cards();

  const stage = newStage('04', 'A MOSFET cross-section: two N regions in P, glass over the gap, metal gate on top');
  const { svg, controls } = stage;

  /* ============ SCENE A — what the last device costs to hold on ============ */

  // emitter N small, base P thin, collector N wide (DESIGN.md §4 rule 7)
  const bjt = svgEl('g');
  bjt.innerHTML = `
    <rect x="250" y="214" width="52" height="64" rx="6" class="n-region"/>
    <rect x="302" y="214" width="30" height="64" rx="3" class="p-region"/>
    <rect x="332" y="214" width="78" height="64" rx="6" class="n-region"/>
    <text x="276" y="296" class="lbl">emitter</text>
    <text x="317" y="312" class="lbl">base</text>
    <text x="371" y="296" class="lbl">collector</text>`;
  svg.appendChild(bjt);
  // the base lead, with a conventional-current chevron pointing INTO the base (§4 rule 6)
  const bjtCost = svgEl('g');
  bjtCost.innerHTML = `
    <path d="M317 214 V162" class="wire"/>
    <path d="M311 184 L317 190 L323 184" class="chev" opacity="0.95"/>
    <text x="317" y="150" class="lbl-strong" style="fill:var(--amber)">10 µA IN, ALWAYS</text>`;
  svg.appendChild(bjtCost);

  // Course restructure (2026-10-25): the old cards 1.4.1 and 1.4.2 are merged. Both
  // restated the 1.3 premise and its numbers box; one card is enough to recall them.
  guide.say(`Here is last step's transistor, switched on. To stay on, it needs about 10 µA
    flowing into its base the whole time, and a chip holds billions of transistors.`);
  stage.focus([bjt, bjtCost], { label: 'base current', at: 'bottom' });
  await guide.next();

  /* the bench: the frame the device gets built inside */
  stage.clearFocus();
  await fadeOut([bjt, bjtCost]);
  const frame = cornerTicks(svg, 128, 162, 464, 230);
  frame.style.opacity = '0';
  await fadeIn([frame], 300);

  guide.say(`So instead, we will control the transistor with a voltage, so that nothing has to
    keep flowing. <b>Your goal is to build this new transistor one layer at a time, then find
    the voltage that turns it on.</b>`);
  stage.focus(frame, { ring: true });
  await guide.next();

  /* ============ SCENE B — the stack, one layer per card ============ */

  const dev = svgEl('g');            // the real silicon, built up piece by piece
  svg.appendChild(dev);
  const holeLayer = svgEl('g');
  svg.appendChild(holeLayer);
  const wellLayer = svgEl('g');
  svg.appendChild(wellLayer);

  /* --- B1. the P block, with its holes --- */
  stage.clearFocus();
  const subRect = svgEl('rect', { x: SUB.x, y: SUB.y, width: SUB.w, height: SUB.h, rx: 10, class: 'p-region' });
  dev.appendChild(subRect);

  const inWell = (x, y) =>
    (x >= WELL_SRC.x && x <= WELL_SRC.x + WELL_SRC.w && y <= WELL_SRC.y + WELL_SRC.h) ||
    (x >= WELL_DRN.x && x <= WELL_DRN.x + WELL_DRN.w && y <= WELL_DRN.y + WELL_DRN.h);
  const holes = [];
  HOLE_ROWS.forEach((hy, row) => {
    for (let c = 0; c < 18; c++){
      const hx = 154 + c * 24;
      if (inWell(hx, hy)) continue;
      const node = svgEl('circle', { cx: hx, cy: hy, r: 4.5, class: 'carrier-h' });
      holeLayer.appendChild(node);
      holes.push({ node, x: hx, baseY: hy, row });
    }
  });
  await fadeIn([subRect, holeLayer], 380);

  guide.say(`Start with a block of P-type silicon. It is full of holes and has no spare
    electrons anywhere.`);
  stage.focus([subRect, holeLayer], { label: 'p-type silicon', at: 'bottom' });
  await guide.next();

  /* --- B2. two N regions, placed --- */
  stage.clearFocus();
  const wellSlots = [
    { key: 'WS', ...WELL_SRC, correct: 'N' },
    { key: 'WD', ...WELL_DRN, correct: 'N' },
  ];
  const slotG = svgEl('g');
  svg.appendChild(slotG);
  wellSlots.forEach(s => {
    s.rect = svgEl('rect', { x: s.x, y: s.y, width: s.w, height: s.h, rx: 8, class: 'slot' });
    s.q = svgEl('text', { x: s.x + s.w / 2, y: s.y + s.h / 2 + 8, class: 'slot-q' });
    s.q.textContent = '?';
    slotG.append(s.rect, s.q);
    s.value = null; s.tile = null;
  });

  const tileLayer = svgEl('g');
  svg.appendChild(tileLayer);
  function makeTile(value, w, h, cap, glyph, home){
    const g = svgEl('g', { class: 'tile', 'aria-label': `${cap} tile` });
    g.appendChild(svgEl('rect', { width: w, height: h, rx: 6, class: 'tile-bg' }));
    const t = svgEl('text', { x: w / 2, y: h / 2 + (h > 26 ? 4 : 3), class: 'tile-letter', 'font-size': Math.min(20, h - 6) });
    t.textContent = glyph;
    g.appendChild(t);
    if (h > 26){
      const c = svgEl('text', { x: w / 2, y: h - 7, class: 'tile-cap' });
      c.textContent = cap;
      g.appendChild(c);
    }
    tileLayer.appendChild(g);
    return { g, value, w, h, home, tx: 0, ty: 0, slot: null };
  }

  const nTiles = [
    makeTile('N', 96, 54, 'n silicon', 'N', { x: 180, y: 406 }),
    makeTile('N', 96, 54, 'n silicon', 'N', { x: 444, y: 406 }),
  ];
  const wellPlacer = makePlacer({
    svg, tiles: nTiles, slots: wellSlots,
    validate: v => v.every(x => x === 'N'),
  });

  guide.say(`Now dope a patch at each end into N-type silicon, so that each patch is packed
    with spare electrons. Drag them in.`);
  stage.focus([...nTiles.map(t => t.g), ...wellSlots.map(s => s.rect)], { label: 'two n regions', at: 'top', ring: false });

  await flow.ask(async replay => {
    if (replay !== undefined){ wellPlacer.autoPlace(); return replay; }
    await wellPlacer.done;
    return true;
  });
  await sleep(460);           // let the placer's CSS slide finish before measuring

  const wells = [WELL_SRC, WELL_DRN].map(w =>
    dev.appendChild(svgEl('rect', { x: w.x, y: w.y, width: w.w, height: w.h, rx: 8, class: 'n-region' })));
  [WELL_SRC, WELL_DRN].forEach(w => {
    [242, 258].forEach(ey => {
      for (let c = 0; c < 4; c++){
        wellLayer.appendChild(svgEl('circle', { cx: w.x + 12 + c * 22, cy: ey, r: 4.5, class: 'carrier-e' }));
      }
    });
  });
  stage.clearFocus();
  wells.forEach(w => { w.style.opacity = '0'; });
  wellLayer.style.opacity = '0';
  await fadeOut(nTiles.map(t => t.g), 220);
  wellSlots.forEach(s => { s.rect.style.display = 'none'; s.q.style.display = 'none'; });
  await fadeIn([...wells, wellLayer], 320);
  if (!flow.instant) SFX.dope();

  /* --- B3. the gap --- */
  const gapMark = svgEl('rect', { x: GAP.x, y: GAP.y, width: GAP.w, height: GAP.h, fill: 'none' });
  svg.appendChild(gapMark);

  guide.say(`Between the two patches is a strip of P silicon with no spare electrons, so
    nothing can cross this gap. Our whole job is to close this gap on demand.`);
  stage.focus(gapMark, { label: 'the gap', at: 'bottom' });
  await guide.next();

  /* --- B4. the thin glass, placed --- */
  stage.clearFocus();
  const oxSlot = [{ key: 'OX', ...OXIDE, correct: 'G' }];
  oxSlot[0].rect = svgEl('rect', { x: OXIDE.x, y: OXIDE.y, width: OXIDE.w, height: OXIDE.h, class: 'slot' });
  oxSlot[0].q = svgEl('text', { x: OXIDE.x + OXIDE.w / 2, y: OXIDE.y + 12, class: 'slot-q', 'font-size': 13 });
  oxSlot[0].q.textContent = '?';
  slotG.append(oxSlot[0].rect, oxSlot[0].q);
  oxSlot[0].value = null; oxSlot[0].tile = null;

  /* Two tiles, one hole. The decoy is the point: putting metal straight onto the silicon
     is the mistake this step exists to correct, and it was the one real decision in the
     old four-tile placer. Keeping one tile per card would have thrown it away. */
  const glassTile = makeTile('G', 150, 22, 'glass', '▭', { x: 176, y: 410 });
  const decoyMetal = makeTile('M', 150, 30, 'metal', '▬', { x: 396, y: 404 });
  const oxPlacer = makePlacer({
    svg, tiles: [glassTile, decoyMetal], slots: oxSlot, validate: v => v[0] === 'G',
    onWrong: () => guide.note(`The metal must not touch the silicon. Glass goes down
      first, and the metal sits on top of it.`),
  });

  guide.say(`Two tiles are left: a thin sheet of glass and a metal pad. One of them goes
    straight onto the silicon, over the gap. Drag it in.`);
  // no focus: this card is a decision, and both tiles have to stay bright and draggable
  await flow.ask(async replay => {
    if (replay !== undefined){ oxPlacer.autoPlace(); return replay; }
    await oxPlacer.done;
    return true;
  });
  await sleep(460);

  const oxide = dev.appendChild(svgEl('rect', { x: OXIDE.x, y: OXIDE.y, width: OXIDE.w, height: OXIDE.h, class: 'oxide' }));
  stage.clearFocus();
  oxide.style.opacity = '0';
  await fadeOut([glassTile.g, decoyMetal.g], 200);
  oxSlot[0].rect.style.display = 'none'; oxSlot[0].q.style.display = 'none';
  await fadeIn([oxide], 300);

  /* --- B5. the metal gate, placed --- */
  const gtSlot = [{ key: 'GT', ...GATE, correct: 'M' }];
  gtSlot[0].rect = svgEl('rect', { x: GATE.x, y: GATE.y, width: GATE.w, height: GATE.h, rx: 3, class: 'slot' });
  gtSlot[0].q = svgEl('text', { x: GATE.x + GATE.w / 2, y: GATE.y + 25, class: 'slot-q' });
  gtSlot[0].q.textContent = '?';
  slotG.append(gtSlot[0].rect, gtSlot[0].q);
  gtSlot[0].value = null; gtSlot[0].tile = null;

  const gateTile = makeTile('M', 150, 30, 'metal', '▬', { x: 285, y: 404 });
  const gtPlacer = makePlacer({ svg, tiles: [gateTile], slots: gtSlot, validate: v => v[0] === 'M' });

  guide.say(`Now place the metal pad on top of the glass. It sits directly over the gap and
    never touches the silicon. This pad is called the gate.`);
  stage.focus([gateTile.g, gtSlot[0].rect], { label: 'metal gate', at: 'top', ring: false });

  await flow.ask(async replay => {
    if (replay !== undefined){ gtPlacer.autoPlace(); return replay; }
    await gtPlacer.done;
    return true;
  });
  await sleep(460);

  const gateRect = dev.appendChild(svgEl('rect', { x: GATE.x, y: GATE.y, width: GATE.w, height: GATE.h, class: 'gate-metal' }));
  const gateStem = svgEl('g');
  gateStem.innerHTML = `
    <path d="M360 174 V126" class="wire"/>
    <text x="360" y="116" class="lbl-strong">GATE</text>`;
  dev.appendChild(gateStem);
  stage.clearFocus();
  [gateRect, gateStem].forEach(n => { n.style.opacity = '0'; });
  await fadeOut([gateTile.g], 200);
  gtSlot[0].rect.style.display = 'none'; gtSlot[0].q.style.display = 'none';
  await fadeIn([gateRect, gateStem], 320);
  if (!flow.instant) SFX.success();

  /* ============ SCENE C — the device is off, and here is why ============ */

  ensureCollarHatch(svg);
  function makeCollar(w, innerSide){
    const t = 10;
    const innerX = innerSide === 'right' ? w.x + w.w : w.x;
    const bands = [
      { x: w.x, y: w.y + w.h, w: w.w, h: t },
      { x: innerSide === 'right' ? innerX : innerX - t, y: w.y, w: t, h: w.h + t },
    ];
    const g = svgEl('g');
    bands.forEach(r => {
      g.appendChild(svgEl('rect', { x: r.x, y: r.y, width: r.w, height: r.h, class: 'depl-band-neg' }));
      g.appendChild(svgEl('rect', { x: r.x, y: r.y, width: r.w, height: r.h, fill: 'url(#collar-hatch4)' }));
    });
    const edge = svgEl('path', {
      d: `M${innerX} ${w.y} V${w.y + w.h} H${innerSide === 'right' ? w.x : w.x + w.w}`,
      class: 'junction', fill: 'none',
    });
    g.appendChild(edge);
    svg.appendChild(g);
    return { g, edge };
  }
  // Course restructure (2026-10-25): the old card 1.4.9 (the two depletion layers) is
  // folded into the "blocked" card below. The collars are built here, so they keep their
  // place under the labels and wires, but stay hidden until the current is blocked.
  const collarSrc = makeCollar(WELL_SRC, 'right');
  const collarDrn = makeCollar(WELL_DRN, 'left');
  [collarSrc.g, collarDrn.g].forEach(g => { g.style.opacity = '0'; });

  /* --- C2. source and drain get their names --- */
  const names = svgEl('g');
  const nmS = svgEl('text', { x: 206, y: 302, class: 'lbl-strong' }); nmS.textContent = 'SOURCE';
  const nmD = svgEl('text', { x: 514, y: 302, class: 'lbl-strong' }); nmD.textContent = 'DRAIN';
  names.append(nmS, nmD);
  svg.appendChild(names);
  await fadeIn([names], 280);

  guide.say(`The two N regions have names. Electrons enter at the source and leave at the
    drain.`);
  stage.focus([...wells, names], { label: 'source and drain', at: 'bottom', ring: false });
  await guide.next();

  /* --- C3. wire it up and push --- */
  stage.clearFocus();
  const rig = svgEl('g');
  svg.appendChild(rig);
  const wL = svgEl('path', { d: 'M206 284 H80 V420 H318', class: 'wire' });
  const wR = svgEl('path', { d: 'M514 284 H640 V420 H402', class: 'wire' });
  rig.append(wL, wR);
  makeBattery(rig, 360, 420);
  const lamp = makeLamp(rig, 640, 348, { label: 'lamp' });
  await fadeIn([rig], 320);

  const flowLayer = svgEl('g');
  svg.appendChild(flowLayer);
  const blockedRoute = svgEl('path', { d: 'M402 420 H640 V284 H510', fill: 'none', stroke: 'none' });
  svg.appendChild(blockedRoute);
  const chipFlow = makeChip(controls, 'current: <b>?</b>');

  guide.say(`Now wire a battery across them, with plus at the drain and minus at the source,
    and try to push a current through.`);
  // 'left' would run the label off the stage: the rig's box starts at x=80
  stage.focus(rig, { label: 'battery and lamp', at: 'bottom', ring: false });
  await guide.button('Push current through ▸');

  stage.clearFocus();
  const cBlocked = new CurrentFlow(blockedRoute, { n: 8, layer: flowLayer });
  if (!flow.instant){
    cBlocked.setSpeed(40);
    await sleep(950);
    SFX.click();
  }
  cBlocked.setSpeed(0);
  const stop = blockedRoute.getPointAtLength(blockedRoute.getTotalLength());
  const stuck = cBlocked.items[0];
  stuck.setAttribute('opacity', 0.95);
  stuck.setAttribute('transform', `translate(${stop.x},${stop.y}) rotate(180) scale(.6,1)`);
  chipFlow.set('current: <b>blocked</b>');
  chipFlow.cls('state-off', true);
  await fadeIn([collarSrc.g, collarDrn.g], 380);

  // Course restructure (2026-10-25): this card now also carries the old 1.4.9.
  guide.say(`The current is blocked. The hatched bands are depletion layers, the same
    barriers you built in step 2. There are two junctions, and one of them always faces
    the wrong way.`);
  stage.focus([collarSrc.g, collarDrn.g, stuck], { label: 'two junctions', at: 'bottom', ring: false });
  await guide.next();

  /* ============ SCENE D — metal, glass, silicon is a capacitor ============ */

  stage.clearFocus();
  guide.say(`Metal, then glass, then silicon: these three layers form a capacitor (two
    conducting plates with an insulator between them).`);
  stage.focus([subRect, oxide, gateRect], { label: 'capacitor', at: 'left' });
  await guide.next();

  const chipI = makeChip(controls, 'into gate: <b>0 A</b>');

  guide.say(`Charging the top plate costs no steady current, because the glass blocks any
    flow. What does reach the silicon below is the plate's electric field.`);
  stage.focus([gateRect, gateStem], { label: 'into gate: 0 A', at: 'top' });
  await guide.next();

  /* ============ SCENE E — the channel, one card per thing that happens ====== */

  stage.clearFocus();

  /* field marks between the gate and the glass */
  const fieldG = svgEl('g');
  for (let i = 0; i < 5; i++){
    fieldG.appendChild(svgEl('line', { x1: 280 + i * 42, y1: 210, x2: 280 + i * 42, y2: 236, class: 'field-line' }));
  }
  svg.appendChild(fieldG);

  /* the channel: 9 slots per row, both rows pre-built so focus can box them */
  const chLayer = svgEl('g');
  svg.appendChild(chLayer);
  const mkRow = y => CH_X.map(x => {
    const n = svgEl('circle', { cx: x, cy: y, r: 4.5, class: 'carrier-e' });
    n.style.opacity = '0';
    chLayer.appendChild(n);
    return n;
  });
  const rowA = mkRow(ROW_A), rowB = mkRow(ROW_B);
  const chLine = svgEl('line', { x1: 250, y1: ROW_A, x2: 470, y2: ROW_A, stroke: 'var(--blue)', 'stroke-width': 1.5, opacity: 0 });
  chLayer.appendChild(chLine);

  const route = svgEl('path', { d: 'M402 420 H640 V284 H510 L466 244 H254 L214 284 H80 V420 H318', fill: 'none', stroke: 'none' });
  svg.appendChild(route);
  const cFlow = new CurrentFlow(route, { n: 16, layer: flowLayer });

  const chipV  = makeChip(controls, 'gate: <b>0.00 V</b>');
  const chipCh = makeChip(controls, 'channel: <b>none</b>');
  const chipS  = makeChip(controls, 'transistor: <b>OFF</b>', 'state-off');
  const slider = makeSlider(controls, { label: 'gate voltage', min: 0, max: 3, step: .05, value: 0, fmt: v => v.toFixed(2) + ' V' });
  slider.input.disabled = true;      // the three build cards drive it; then it is the player's

  let prevBridged = false;
  function apply(v){
    const push = clamp(v / V_HOLES, 0, 1);
    const inv  = clamp((v - V_HOLES) / (V_FULL - V_HOLES), 0, 1);
    const od   = clamp((v - VTH) / (3 - VTH), 0, 1);
    const bridged = v >= VTH;

    chipV.set(`gate: <b>${v.toFixed(2)} V</b>`);
    fieldG.querySelectorAll('.field-line').forEach(l => { l.style.opacity = (clamp(v / 1.4, 0, 1) * .9).toFixed(2); });

    // 1. the field pushes the holes down and away from the glass
    holes.forEach(h => {
      const under = h.x >= OXIDE.x && h.x <= OXIDE.x + OXIDE.w;
      const dy = under ? (h.row === 0 ? push * 20 : h.row === 1 ? push * 10 : 0) : 0;
      h.node.setAttribute('cy', (h.baseY + dy).toFixed(1));
      h.node.style.opacity = under && h.row === 0 ? String(1 - push * .55) : '1';
    });

    // 2. the field pulls electrons up against the underside of the glass
    const nIn = Math.round(inv * ORDER_IN.length);
    rowA.forEach(n => { n.style.opacity = '0'; });
    for (let i = 0; i < nIn; i++) rowA[ORDER_IN[i]].style.opacity = '1';
    // 3. at threshold the two end slots fill and the sheet reaches both N regions
    if (bridged) rowA.forEach(n => { n.style.opacity = '1'; });
    const nB = Math.round(od * ORDER_B.length);
    rowB.forEach(n => { n.style.opacity = '0'; });
    for (let i = 0; i < nB; i++) rowB[ORDER_B[i]].style.opacity = '1';

    chLine.setAttribute('opacity', bridged ? 0.3 : 0);
    collarSrc.edge.setAttribute('opacity', bridged ? 0.18 : 1);
    collarDrn.edge.setAttribute('opacity', bridged ? 0.18 : 1);

    cFlow.setSpeed(bridged ? 40 + od * 150 : 0);
    lamp.set(bridged ? 0.4 + od * 0.6 : 0);
    if (bridged) stuck.setAttribute('opacity', 0);

    // the chip reports what is actually drawn: no dots is "none", not "forming"
    chipCh.set(`channel: <b>${bridged ? (od < .5 ? 'thin' : 'thick') : nIn === 0 ? 'none' : 'forming'}</b>`);
    chipS.set(`transistor: <b>${!bridged ? 'OFF' : od > .5 ? 'ON' : 'ON (weak)'}</b>`);
    chipS.cls('state-on', bridged); chipS.cls('state-off', !bridged);
    chipFlow.set(`current: <b>${bridged ? 'flowing' : 'blocked'}</b>`);
    chipFlow.cls('state-on', bridged); chipFlow.cls('state-off', !bridged);

    if (!prevBridged && bridged && !flow.instant) SFX.flow();
    prevBridged = bridged;
  }
  slider.on(apply);
  apply(0);

  const rampTo = async to => {
    const from = slider.value;
    await Anim.tween(680, p => slider.set(from + (to - from) * p));
    slider.set(to);
  };

  const underHoles = holes
    .filter(h => h.row < 2 && h.x >= OXIDE.x && h.x <= OXIDE.x + OXIDE.w)
    .map(h => h.node);

  guide.say(`If you put a small positive voltage on the gate, the positive plate pushes the
    holes underneath it downward, away from the glass.`);
  stage.focus(underHoles, { label: 'holes pushed down', at: 'bottom', ring: false });
  await guide.button('Raise the gate to 0.5 V ▸');
  await rampTo(0.5);

  guide.say(`If you keep going, the same field pulls electrons up out of the silicon and
    holds them against the underside of the glass.`);
  stage.focus(chLayer, { label: 'electrons pulled up', at: 'bottom', ring: false });
  await guide.button('Raise it to 1.0 V ▸');
  await rampTo(1.0);

  guide.say(`With a little more voltage, that sheet of electrons reaches both N regions, and
    the source and drain become one unbroken path.`);
  stage.focus(chLayer, { label: 'channel', at: 'bottom', ring: false });
  await guide.button('Raise it to 1.2 V ▸');
  await rampTo(1.2);
  stage.clearFocus();

  guide.aha(`The lamp is lit. Current runs from drain to source through a sheet of electrons
    that only exists while the gate voltage is held high.`,
    `Nothing went into the gate to make it. The glass never let any charge through.`);
  await guide.next();

  /* ============ SCENE F — two tests ============ */

  slider.input.disabled = false;

  guide.say(`The slider is yours now. If you push the gate voltage higher, the sheet gets
    denser and more current flows. <b>Your goal is to switch it fully on, above 2.6 V.</b>`);
  await flow.ask(async replay => {
    if (replay !== undefined){ slider.set(replay); apply(replay); return replay; }
    const cancel = flow.hintAfter(14000, 'Drag the gate voltage slider under the stage up to 2.6 V or more.');
    slider.input.addEventListener('input', cancel, { once: true });
    await waitFor(() => slider.value >= 2.6, { hold: 500 });
    cancel();
    return slider.value;
  });
  if (!flow.instant) SFX.success();

  guide.say(`Now bring it back down. The sheet breaks the moment the gate voltage drops
    below 1.2 V. <b>Your goal is to switch it fully off, below 0.3 V.</b>`);
  await flow.ask(async replay => {
    if (replay !== undefined){ slider.set(replay); apply(replay); return replay; }
    const cancel = flow.hintAfter(14000, 'Drag the gate voltage slider back down to 0.3 V or less.');
    slider.input.addEventListener('input', cancel, { once: true });
    await waitFor(() => slider.value <= 0.3, { hold: 500 });
    cancel();
    return slider.value;
  });
  if (!flow.instant) SFX.success();

  /* ============ SCENE G — which one is cheaper to hold on ============ */

  guide.say(`Your transistor from last step and this new transistor can both stay on all day.
    Which one is cheaper to hold on?`);
  const ans = await guide.choose([
    { label: 'The new one, held on by a gate voltage', value: 'gate', hint: 'you hold a voltage on the metal pad' },
    { label: 'The transistor, held on by base current', value: 'bjt', hint: 'you keep a current running into the base' },
  ]);
  if (ans === 'gate'){
    // Course restructure (2026-10-25): the aha's second line ("why a billion of these fit
    // on a chip") is deleted. Step 1.5 reopens that problem straight away, so it was false here.
    guide.aha(`You were right. Holding a voltage on the gate costs no ongoing current, because the
      glass never lets charge through. The NPN transistor has to keep consuming base current
        the entire time it is on.`);
  } else {
    guide.note(`It is the other way around. The NPN transistor keeps consuming base current while it
      is on.
      This one only holds a voltage on the gate, and the glass stops any current getting in.`);
  }
  await guide.next();

  /* ============ SCENE H — the names ============ */

  guide.say(`The three layers you stacked give the device its name: metal, oxide,
    semiconductor. Oxide is the glass. It is called a MOSFET (metal-oxide-semiconductor
      field-effect transistor).`);
  // 'left' would push this long label off the stage: the box starts at x=140
  stage.focus([subRect, oxide, gateRect], { label: 'metal · oxide · semiconductor', at: 'top' });
  await guide.next();

  stage.clearFocus();
  await rampTo(2.4);            // put it back on, so the channel is there to point at

  guide.say(`Yours is an <b>NMOS</b>. A high gate voltage fills the channel with electrons
    (the N in NMOS). If you drop the gate voltage, the channel empties.`);
  stage.focus(chLayer, { label: 'n-channel', at: 'bottom', ring: false });
  await guide.next();
  stage.clearFocus();

  /* ============ SCENE I — how it looks in real life (HANDOFF_NEXT.md §1) ============ */

  const real = slideInPanel(svg, realLifeHTML(), { lab: true });
  real.focus('to92');
  await real.show();

  guide.lab(`Here is the same kind of NMOS you just built, sold as a part you can buy. This one
    is a 2N7000, about 5 mm across. Its three legs are the source, the gate and the drain.`, { intro: true });
  await guide.next();

  // Course restructure (2026-10-25): the IRF540N card is cut, and the part is gone from
  // the drawing.

  real.focus('finfet');
  guide.lab(`Inside a processor, the transistors are far smaller and shaped differently. The
    channel is a thin upright wall of silicon called a <b>fin</b>, and the gate wraps over its
    top and both sides.`);
  await guide.next();

  // Course restructure (2026-10-25): rewritten to name leakage properly.
  guide.lab(`A transistor that is off still lets a tiny current through. This is called
    <b>leakage</b>. With the gate on three sides, its field closes the whole channel, so a fin
    leaks less.`);
  await guide.next();

  real.focus('gaa');
  guide.lab(`The newest chips go one step further. The channel is a stack of thin flat sheets,
    and the gate surrounds each sheet on all four sides. This is called
    <b>gate-all-around</b>.`);
  await guide.next();

  guide.lab(`Samsung first made chips this way in 2022, and TSMC and Intel followed in 2025.
    Each sheet is a few nanometres thick, but it is still your NMOS: a source, a drain and a
    gate.`);
  real.focus(null);
  await guide.next();

  // Course restructure (2026-10-25): the transistor count, with the same chip and number as
  // the 1.3 numbers box. The A17 Pro is built with fins, not sheets, so the focus goes back
  // to the FinFET.
  real.focus('finfet');
  guide.lab(`Apple's A17 Pro, the chip in a 2023 iPhone, holds 19 billion transistors. Each
    one is a fin like this, with a source, a drain and a gate, as in your NMOS.`);
  await guide.next();

  const board = slideInPanel(svg, circuitNMOS(), { lab: true });
  setLabState(board, true);
  await real.swapTo(board);      // N-053: no flash of the stage between panels
  guide.lab(`Here is your NMOS test on a breadboard. The LED and its resistor sit between the +
    rail and the drain, and the source goes to ground. The gate wire is on the + rail, so the
    LED is on.`);
  await guide.next();

  setLabState(board, false);
  guide.lab(`Move the gate wire to ground, and the LED goes out. In both positions no current
    flows into the gate: it only holds a voltage, as yours did.`);
  await guide.next();
  await board.hide();
}
