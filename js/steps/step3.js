// STEP 3 — Build your own MOSFET.
// Physics per DESIGN.md §4/§8 + HANDOFF_V3 §3: gate metal + thin glass + p-silicon form a
// CAPACITOR. Charge the top plate and the field pushes the holes down, then pulls electrons up
// against the underside of the glass — that pressed-up sheet of electrons IS the channel.
// Conventional current: battery+ → drain → channel → source → battery−.
//
// This is a DISCRETE-CARRIER cross-section: every hole and every channel electron is an
// individually-watchable dot at a fixed grid position. NO rand() anywhere — every dot is a pure
// function of its index, so Back/Restart replays land on identical layouts. apply(v) is pure.
import { svgEl, sleep, clamp, waitFor } from '../engine/util.js';
import { SFX } from '../engine/sfx.js';
import { guide } from '../engine/guide.js';
import { flow } from '../engine/flow.js';
import { newStage } from '../engine/stage.js';
import { CurrentFlow } from '../engine/pathflow.js';
import { makeLamp, makeBattery, makeSlider, makeChip, makePlacer, cornerTicks } from '../engine/components.js';

export async function step3(){
  const { svg, controls } = newStage('03', 'MOSFET cross-section');
  guide.title('STEP 3 / 4 · NANOVOLT MICRO', 'Build your own <em>MOSFET</em>');

  cornerTicks(svg, 140, 168, 440, 224);

  /* ================= geometry constants (HANDOFF_V3 §3.1) ================= */
  const SUB = { x: 140, y: 230, w: 440, h: 150 };
  const WELL_SRC = { x: 158, y: 230, w: 96, h: 54 };
  const WELL_DRN = { x: 466, y: 230, w: 96, h: 54 };
  const OXIDE = { x: 262, y: 216, w: 196, h: 14 };
  const GATE = { x: 262, y: 174, w: 196, h: 36 };
  // channel anchor slots: row A y=240, row B y=252, 8 cols x=274..442 pitch 24
  const SLOT_X = Array.from({ length: 8 }, (_, i) => 274 + i * 24);
  const ROW_A = 240, ROW_B = 252;

  guide.say(`Now the switch that actually runs every chip: the <b>MOSFET</b>. It's built from the same N and P silicon, arranged so that a voltage — not a current — opens and closes it. Aim: build one and find the voltage that switches it on.`);
  await guide.next();
  guide.say(`Same ingredients, new arrangement. Two <b>N regions</b> sit in a block of P silicon, with a gap of P between them. Above the gap: a thin layer of <b>glass</b> (an insulator — nothing electrical crosses it), and on the glass a metal pad called the <b>gate</b>. The metal never touches the silicon. Build it: the two wells, the glass, then the gate on top. <em>Drag a tile in, or tap a tile then tap a slot.</em>`);

  /* ================= 1. the player PLACES the parts ================= */
  const SLOTS = [
    { key: 'WS', x: 158, y: 230, w: 96, h: 54, correct: 'N' },
    { key: 'WD', x: 466, y: 230, w: 96, h: 54, correct: 'N' },
    { key: 'OX', x: 262, y: 216, w: 196, h: 14, correct: 'G' },
    { key: 'GT', x: 262, y: 174, w: 196, h: 36, correct: 'M' },
  ];
  const slotG = svgEl('g');
  const slots = SLOTS.map(s => {
    const rect = svgEl('rect', { x: s.x, y: s.y, width: s.w, height: s.h, class: 'slot' });
    const q = svgEl('text', { x: s.x + s.w / 2, y: s.y + s.h / 2 + 8, class: 'slot-q' }); q.textContent = '?';
    slotG.append(rect, q);
    return { ...s, rect, q, value: null, tile: null };
  });
  // faint outline of the P substrate so the player sees where the sea will pool
  const subGhost = svgEl('rect', { x: SUB.x, y: SUB.y, width: SUB.w, height: SUB.h, rx: 10, class: 'slot' });
  svg.append(subGhost, slotG);

  function makeTile(value, w, h, cap){
    const g = svgEl('g', { class: 'tile', 'aria-label': `${cap} tile` });
    g.appendChild(svgEl('rect', { width: w, height: h, rx: 7, class: 'tile-bg' }));
    const letter = svgEl('text', { x: w / 2, y: h / 2 + 6, class: 'tile-letter', 'font-size': Math.min(20, h - 8) });
    letter.textContent = value === 'N' ? 'N' : value === 'G' ? '▭' : '▬';
    g.appendChild(letter);
    const capEl = svgEl('text', { x: w / 2, y: h - 6, class: 'tile-cap' }); capEl.textContent = cap;
    g.appendChild(capEl);
    svg.appendChild(g);
    return { g, value, w, h, home: null, tx: 0, ty: 0, slot: null };
  }
  const tray = [
    ['N', 96, 54, 'N well', 150],
    ['N', 96, 54, 'N well', 258],
    ['G', 150, 24, 'glass — the insulator', 366],
    ['M', 150, 30, 'gate — the metal pad', 512],
  ];
  const tiles = tray.map(([v, w, h, cap, x]) => { const t = makeTile(v, w, h, cap); t.home = { x, y: 408 }; return t; });

  const placer = makePlacer({
    svg, tiles, slots,
    // wells in the two well slots, glass in the oxide slot, gate on top
    validate: v => v[0] === 'N' && v[1] === 'N' && v[2] === 'G' && v[3] === 'M',
    onWrong: () => guide.note(`The glass goes <b>between</b> the silicon and the gate — the metal must not touch the silicon.`),
  });

  await flow.ask(async replay => {
    if (replay !== undefined){ placer.autoPlace(); return replay; }
    await placer.done;
    return true;
  });

  /* ================= 2. regions merge to the final cross-section ================= */
  await sleep(flow.instant ? 0 : 420);
  tiles.forEach(t => t.g.style.opacity = '0');
  slots.forEach(s => { s.rect.style.opacity = '0'; s.q.style.opacity = '0'; });
  subGhost.style.opacity = '0';

  const dev = svgEl('g');
  dev.innerHTML = `
    <rect x="${SUB.x}" y="${SUB.y}" width="${SUB.w}" height="${SUB.h}" rx="10" class="p-region"/>
    <rect x="${WELL_SRC.x}" y="${WELL_SRC.y}" width="${WELL_SRC.w}" height="${WELL_SRC.h}" rx="8" class="n-region"/>
    <rect x="${WELL_DRN.x}" y="${WELL_DRN.y}" width="${WELL_DRN.w}" height="${WELL_DRN.h}" rx="8" class="n-region"/>
    <rect x="${OXIDE.x}" y="${OXIDE.y}" width="${OXIDE.w}" height="${OXIDE.h}" class="oxide"/>
    <rect x="${GATE.x}" y="${GATE.y}" width="${GATE.w}" height="${GATE.h}" class="gate-metal"/>
    <text x="360" y="197" class="lbl-strong">GATE</text>
    <text x="206" y="300" class="lbl">source</text>
    <text x="514" y="300" class="lbl">drain</text>
    <text x="360" y="360" class="lbl">p-type base (your boron recipe)</text>
    <text x="360" y="211" class="lbl-faint" fill="var(--amber)">thin glass — nothing gets through</text>`;
  dev.classList.add('pop-in');
  svg.appendChild(dev);
  if (!flow.instant) SFX.success();

  const gateStem = svgEl('path', { d: 'M360 174 V120', class: 'wire' });
  svg.appendChild(gateStem);
  // the gate's voltage source: a labelled terminal so the slider visibly HAS a place to act
  const gateTerm = svgEl('text', { x: 370, y: 142, class: 'lbl-faint', 'text-anchor': 'start' });
  gateTerm.textContent = 'gate terminal — voltage set below';
  svg.appendChild(gateTerm);

  /* ================= carrier layer (built after regions so it sits on top) ================= */
  // substrate holes: 18 cols x=154..562 pitch 24, rows y=258,282,306,330 — omit dots inside a well
  const holeLayer = svgEl('g');
  svg.appendChild(holeLayer);
  const inWell = (x, y) =>
    (x >= WELL_SRC.x && x <= WELL_SRC.x + WELL_SRC.w && y <= WELL_SRC.y + WELL_SRC.h) ||
    (x >= WELL_DRN.x && x <= WELL_DRN.x + WELL_DRN.w && y <= WELL_DRN.y + WELL_DRN.h);
  const HOLE_ROWS = [258, 282, 306, 330];
  const holes = [];   // { node, x, baseY, row }
  HOLE_ROWS.forEach((hy, row) => {
    for (let c = 0; c < 18; c++){
      const hx = 154 + c * 24;
      if (inWell(hx, hy)) continue;
      const node = svgEl('circle', { cx: hx, cy: hy, r: 4.5, class: 'carrier-h', opacity: 0 });
      holeLayer.appendChild(node);
      holes.push({ node, x: hx, baseY: hy, row });
    }
  });

  // well electrons: per well 2 rows y=242,258 × 4 cols pitch 22 inset 12
  const wellLayer = svgEl('g');
  svg.appendChild(wellLayer);
  [WELL_SRC, WELL_DRN].forEach(w => {
    [242, 258].forEach(ey => {
      for (let c = 0; c < 4; c++){
        wellLayer.appendChild(svgEl('circle', { cx: w.x + 12 + c * 22, cy: ey, r: 4.5, class: 'carrier-e', opacity: 0 }));
      }
    });
  });

  /* ---- depletion collars: an L-shaped hatched band hugging each well's bottom + inner side ---- */
  ensureCollarHatch(svg);
  function makeCollar(w, innerSide){
    // innerSide: 'right' for the source well (collar on its right edge), 'left' for the drain well
    const t = 10;                                   // band thickness
    const bx = w.x, by = w.y, bw = w.w, bh = w.h;
    const innerX = innerSide === 'right' ? bx + bw : bx;
    // bottom band + inner-side band, drawn just outside the well boundary inside the P region
    const bottom = { x: bx, y: by + bh, w: bw, h: t };
    const side = { x: innerSide === 'right' ? innerX : innerX - t, y: by, w: t, h: bh + t };
    const g = svgEl('g', { class: 'collar' });
    // reuse existing junction vocabulary: depl-band-neg (blue 8%, the negatively-charged P edge)
    // for the fill, plus the shared hatch to say "no free carriers live here".
    const fill = (r) => {
      g.appendChild(svgEl('rect', { x: r.x, y: r.y, width: r.w, height: r.h, class: 'depl-band-neg' }));
      g.appendChild(svgEl('rect', { x: r.x, y: r.y, width: r.w, height: r.h, fill: 'url(#collar-hatch)' }));
    };
    fill(bottom); fill(side);
    // dashed inner edge (the empty-zone boundary that the channel later punches through)
    const edge = svgEl('path', {
      d: `M${innerX} ${by} V${by + bh} H${innerSide === 'right' ? bx : bx + bw}`,
      class: 'junction', fill: 'none',
    });
    g.appendChild(edge);
    g.style.opacity = '0';
    svg.appendChild(g);
    return { g, edge };
  }
  const collarSrc = makeCollar(WELL_SRC, 'right');
  const collarDrn = makeCollar(WELL_DRN, 'left');

  /* ---- populate carriers row-by-row (holes), then wells, then collars self-draw ---- */
  if (flow.instant){
    holes.forEach(h => h.node.setAttribute('opacity', 1));
    wellLayer.querySelectorAll('circle').forEach(n => n.setAttribute('opacity', 1));
    collarSrc.g.style.opacity = '1'; collarDrn.g.style.opacity = '1';
  } else {
    for (let row = 0; row < HOLE_ROWS.length; row++){
      holes.filter(h => h.row === row).forEach(h => gsap.to(h.node, { attr: { opacity: 1 }, duration: .28, ease: 'power2.out' }));
      SFX.click();
      await sleep(60);
    }
    gsap.to(wellLayer.querySelectorAll('circle'), { attr: { opacity: 1 }, duration: .3, stagger: .015, ease: 'back.out(1.6)' });
    await sleep(260);
    gsap.to([collarSrc.g, collarDrn.g], { opacity: 1, duration: .5, ease: 'power2.out' });
    await sleep(260);
  }

  guide.note(`Note the hatched bands: wherever N touches P, a depletion layer forms — the same barrier you built in the last step. There are two junctions here, so there are two barriers.`);
  await guide.next();

  /* ================= 3. prove it's OFF — the missing motivation (HANDOFF_V3 §3.2) ================= */
  // drain-side battery + lamp — NO gate wiring yet
  const wL = svgEl('path', { d: 'M206 284 H80 V420 H318', class: 'wire' });
  const wR = svgEl('path', { d: 'M514 284 H640 V420 H402', class: 'wire' });
  svg.append(wL, wR);
  makeBattery(svg, 360, 420);
  const lamp = makeLamp(svg, 640, 345, { label: 'lamp' });

  const flowLayer = svgEl('g'); svg.appendChild(flowLayer);
  // TRUNCATED route: battery+ → right riser → up to the drain well, ending at the collar (x=506)
  const blockedRoute = svgEl('path', { d: 'M402 420 H640 V284 H506', fill: 'none', stroke: 'none' });
  svg.appendChild(blockedRoute);
  const chipFlow = makeChip(controls, 'flow: <b>—</b>');

  guide.say(`The two N regions have names: the <b>source</b> (where electrons will enter) and the <b>drain</b> (where they leave). A battery is wired to push current from drain to source. Try it.`);
  await guide.button('Push current through ▸');

  // chevrons run up to the drain well and FREEZE at the collar
  const cBlocked = new CurrentFlow(blockedRoute, { n: 8, layer: flowLayer });
  if (flow.instant){
    cBlocked.setSpeed(0);
  } else {
    cBlocked.setSpeed(40);
    wR.classList.add('live');
    await sleep(900);
    cBlocked.setSpeed(0);
    // lead chevron squashed against the hatched band
    const lead = cBlocked.items[0];
    const pt = blockedRoute.getPointAtLength(blockedRoute.getTotalLength());
    lead.setAttribute('opacity', .95);
    lead.setAttribute('transform', `translate(${pt.x},${pt.y}) rotate(180) scale(.6,1)`);
    SFX.click();
  }
  chipFlow.set('flow: <b>blocked</b>'); chipFlow.cls('state-off', true);

  guide.say(`Blocked. To get from drain to source, current would have to cross an N–P junction and then a P–N junction — and whichever direction you push, <b>one of the two is the reverse direction you saw fail in the last step</b>. With no gate voltage, this device cannot conduct. The gate exists to create a path — that's next.`);
  await guide.next();

  /* ================= 4. the capacitor reveal (keep near-verbatim, §3.3) ================= */
  const gateBadge = svgEl('g');
  gateBadge.innerHTML = `
    <rect x="300" y="86" width="120" height="26" rx="4" fill="none" stroke="var(--hairline-strong)"/>
    <text x="360" y="103" class="lbl">into gate: 0 A — always</text>`;
  svg.appendChild(gateBadge);

  // ghost capacitor diagram in the right margin (x=612 y=176)
  const cap = svgEl('g', { class: 'cap-ghost', opacity: 0 });
  cap.innerHTML = `
    <line x1="612" y1="176" x2="672" y2="176" stroke="var(--ink)" stroke-width="1.4"/>
    <line x1="612" y1="186" x2="672" y2="186" stroke="var(--hairline-strong)" stroke-width="1" stroke-dasharray="3 3"/>
    <line x1="612" y1="196" x2="672" y2="196" stroke="var(--ink)" stroke-width="1.4"/>
    <line x1="642" y1="166" x2="642" y2="176" stroke="var(--ink)" stroke-width="1.4"/>
    <line x1="642" y1="196" x2="642" y2="206" stroke="var(--ink)" stroke-width="1.4"/>
    <text x="642" y="222" class="lbl-faint">a capacitor</text>`;
  svg.appendChild(cap);
  if (flow.instant) cap.setAttribute('opacity', 1);
  else gsap.to(cap, { attr: { opacity: 1 }, duration: .4 });

  guide.say(`Look at the stack: <b>gate metal → thin glass → p-silicon</b>. Strip away the labels and it's an ordinary <b>capacitor</b> — two conductive plates separated by an insulator. Put a voltage on the top plate and it charges. Its electric field reaches through the glass and attracts the opposite charge — <span class="e-blue">electrons</span> — up against the underside, forming a thin sheet pressed to the glass. <b>That sheet of electrons is the channel.</b> No current ever crosses the glass; the gate works only through its field.`);
  await guide.next();
  if (flow.instant) cap.setAttribute('opacity', 0);
  else gsap.to(cap, { attr: { opacity: 0 }, duration: .4 });

  /* ================= 5. the field does two things — the core animation (§3.4) ================= */
  const VTH = 1.2;

  // field lines: 5 verticals from oxide underside (y=230) down to y=254
  const fl = svgEl('g');
  for (let i = 0; i < 5; i++) fl.appendChild(svgEl('line', { x1: 292 + i * 34, y1: 230, x2: 292 + i * 34, y2: 254, class: 'field-line' }));
  svg.appendChild(fl);

  // channel underline (faint blue, drawn only when bridged)
  const chLine = svgEl('line', { x1: 262, y1: 246, x2: 458, y2: 246, stroke: 'var(--blue)', 'stroke-width': 1.5, opacity: 0 });
  svg.appendChild(chLine);

  // channel electron slots — fixed centre-out fill order, row A then row B
  const CENTRE_OUT = [4, 3, 5, 2, 6, 1, 7, 0];
  const chSlots = [];   // 16 slots, index 0..15 = fill order (row A 0..7, then row B 8..15)
  CENTRE_OUT.forEach(col => chSlots.push({ x: SLOT_X[col], y: ROW_A, node: null }));
  CENTRE_OUT.forEach(col => chSlots.push({ x: SLOT_X[col], y: ROW_B, node: null }));
  const chLayer = svgEl('g');
  svg.appendChild(chLayer);

  // conventional-current route (full, used once bridged): battery+ → drain → channel → source → battery−
  const route = svgEl('path', { d: 'M402 420 H640 V284 H506 L458 246 H262 L214 284 H80 V420 H318', fill: 'none', stroke: 'none' });
  svg.appendChild(route);
  const cFlow = new CurrentFlow(route, { n: 16, layer: flowLayer });

  // gate wiring current (into the gate — but it never actually flows; visual stem only)
  const chipV = makeChip(controls, 'gate: <b>0.00 V</b>');
  const chipI = makeChip(controls, 'into gate: <b>0 A</b> — always');
  const chipCh = makeChip(controls, 'channel: <b>none</b>');
  const chipS = makeChip(controls, 'switch: <b>OFF</b>', 'state-off');
  const slider = makeSlider(controls, { label: 'gate voltage', min: 0, max: 3, step: .05, value: 0, fmt: v => v.toFixed(2) + ' V' });

  let prevK = 0;   // previous filled-count, for the one-shot bridge SFX (recomputed each apply)

  function apply(v){
    const od = clamp((v - VTH) / (3 - VTH), 0, 1);       // overdrive
    const pre = clamp(v / VTH, 0, 1);                     // pre-threshold build-up
    const inst = flow.instant;

    chipV.set(`gate: <b>${v.toFixed(2)} V</b>`);
    fl.querySelectorAll('.field-line').forEach(l => l.style.opacity = (v / 3 * .9).toFixed(2));

    // (1) holes SINK under the gate (repelled by the positive plate)
    const dropR1 = pre * 20, dropR2 = pre * 10, fadeR1 = 1 - pre * 0.45;
    holes.forEach(h => {
      const under = h.x >= 262 && h.x <= 458;
      let dy = 0, op = 1;
      if (under){
        if (h.row === 0){ dy = dropR1; op = fadeR1; }
        else if (h.row === 1){ dy = dropR2; }
        // rows 2,3 never move
      }
      if (inst) gsap.set(h.node, { y: dy, opacity: op });
      else gsap.to(h.node, { y: dy, opacity: op, duration: .12, ease: 'power1.out' });
    });

    // (2) electrons FILL the channel slots — fixed centre-out order, count k
    const k = clamp(Math.round(pre * 6) + Math.round(od * 10), 0, 16);
    for (let i = 0; i < 16; i++){
      const slot = chSlots[i];
      if (i < k && !slot.node){
        const n = svgEl('circle', { cx: slot.x, cy: slot.y, r: 4.5, class: 'carrier-e' });
        chLayer.appendChild(n); slot.node = n;
        if (inst) n.setAttribute('opacity', 1);
        else { gsap.set(n, { transformOrigin: `${slot.x}px ${slot.y}px`, scale: .3, opacity: 0 }); gsap.to(n, { scale: 1, opacity: 1, duration: .12, ease: 'back.out(2)' }); }
      } else if (i >= k && slot.node){
        slot.node.remove(); slot.node = null;
      }
    }

    // the bridge: row A complete (k>=8) → collars' inner edges fade, channel underline draws
    const bridged = k >= 8;
    const edgeOp = bridged ? 0.2 : 1;
    if (inst){
      collarSrc.edge.setAttribute('opacity', edgeOp); collarDrn.edge.setAttribute('opacity', edgeOp);
      chLine.setAttribute('opacity', bridged ? 0.25 : 0);
    } else {
      gsap.to([collarSrc.edge, collarDrn.edge], { attr: { opacity: edgeOp }, duration: .25 });
      gsap.to(chLine, { attr: { opacity: bridged ? 0.25 : 0 }, duration: .25 });
    }
    // one-shot SFX.flow() on upward k=8 crossing (guarded: replay uses flow.instant)
    if (prevK < 8 && k >= 8 && !inst) SFX.flow();
    prevK = k;

    // (3) current flows only when bridged
    cFlow.setSpeed(bridged ? od * 170 : 0);
    lamp.set(bridged ? od : 0);
    wL.classList.toggle('live', bridged); wR.classList.toggle('live', bridged);

    chipCh.set(`channel: <b>${k < 6 ? 'none' : k < 8 ? 'forming…' : k < 12 ? 'thin' : 'wide'}</b>`);
    const on = bridged;
    chipS.set(`switch: <b>${!on ? 'OFF' : od > .55 ? 'ON' : 'ON (weak)'}</b>`);
    chipS.cls('state-on', on); chipS.cls('state-off', !on);
  }
  slider.on(apply);
  slider.set(0);
  apply(0);

  guide.say(`Because of that glass, current <b>cannot flow into the gate</b> — ever. The gate works by field alone. Raise the voltage <em>slowly</em> and watch two things happen in order: first the field <b>shoves the holes down</b>, clearing the ground under the glass — then it <b>pulls electrons up</b> out of the islands and the sea, pinning them against the underside. Watch the gap.`);

  /* ---- free exploration until first threshold crossing ---- */
  await flow.ask(async replay => {
    if (replay !== undefined){ slider.set(replay); apply(replay); return replay; }
    const cancel = flow.hintAfter(14000, 'Drag the gate voltage past ~1.2 V and keep your eye on the strip just under the glass.');
    await waitFor(() => slider.value >= VTH, { hold: 100 });
    cancel();
    return slider.value;
  });

  guide.aha(`There — the moment the electron sheet touches both N regions, there is a <b>continuous N-type path from source to drain</b>, and the two barriers no longer stand in the way. Current flows. Drop the gate voltage and the sheet disperses; the path is gone. A switch with no moving parts, controlled by voltage alone.`,
    `Push past 2 V and watch the channel thicken — more voltage pulls up more electrons, a wider path, more current. It's a switch that can also act as a valve.`);
  await guide.next();

  /* ================= 6. certification tasks (keep verbatim) ================= */
  guide.say(`Two tests:`);

  const t1 = guide.task('Turn the switch fully ON');
  await flow.ask(async replay => {
    if (replay !== undefined){ slider.set(replay); apply(replay); return replay; }
    const cancel = flow.hintAfter(12000, 'Push the gate voltage well above the threshold — 2.6 V or more.');
    await waitFor(() => slider.value >= 2.6, { hold: 600 });
    cancel();
    return slider.value;
  });
  t1.done();

  const t2 = guide.task('Now turn it fully OFF');
  await flow.ask(async replay => {
    if (replay !== undefined){ slider.set(replay); apply(replay); return replay; }
    const cancel = flow.hintAfter(12000, 'Bring the gate voltage down near zero — below ~0.3 V the channel is gone.');
    await waitFor(() => slider.value <= 0.3, { hold: 600 });
    cancel();
    return slider.value;
  });
  t2.done();

  /* ================= 7. quiz beat (keep verbatim) ================= */
  guide.say(`One more thing. Your Step-2 transistor and this MOSFET can both hold a switch ON all day. <b>Which one is cheaper to hold ON?</b>`);
  const ans = await guide.choose([
    { label: 'The MOSFET (voltage-driven)', value: 'mosfet', hint: 'just hold a voltage on the gate' },
    { label: 'The transistor (current-driven)', value: 'bjt', hint: 'keep the base trickle flowing' },
  ]);
  if (ans === 'mosfet'){
    guide.aha(`Exactly. Holding a voltage is like keeping a magnet stuck to the fridge — it takes <b>no ongoing current</b>, so almost no energy. The transistor has to keep pulling base current the whole time it's ON. That one difference is why <em>billions</em> of these fit on a chip.`);
  } else {
    guide.note(`Almost — it's the other way around. The transistor keeps pulling base current the whole time it's ON. The MOSFET just <b>holds a voltage</b> across the glass: no current, almost no energy. That's why chips are built from MOSFETs.`);
  }
  await guide.next();

  guide.note(`What you built is an <b>N-channel enhancement MOSFET</b> — the exact type that fills every processor die. From Act 2 on, you'll use them by the billion.`);
  await guide.next();
}

/* one 45° hatch pattern for the depletion collars (distinct id from junction.js's) */
function ensureCollarHatch(svg){
  const root = svg.ownerSVGElement || svg;
  if (root.querySelector('#collar-hatch')) return;
  let defs = root.querySelector('defs');
  if (!defs){ defs = svgEl('defs'); root.insertBefore(defs, root.firstChild); }
  const pat = svgEl('pattern', { id: 'collar-hatch', patternUnits: 'userSpaceOnUse', width: 7, height: 7, patternTransform: 'rotate(45)' });
  pat.appendChild(svgEl('line', { x1: 0, y1: 0, x2: 0, y2: 7, class: 'depl-hatch-line' }));
  defs.appendChild(pat);
}
