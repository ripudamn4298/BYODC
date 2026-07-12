// STEP 2 — Build your own transistor (NPN), now with a PN-junction prologue.
// JOB A: before the NPN, the player presses an N block and a P block together and
// watches the depletion layer build ITSELF — then tests it as a diode (forward
// bias breaks the wall, reverse bias widens it). The transistor that follows is
// two of these walls back-to-back.
//
// Physics per DESIGN.md §4/§6: collector is physically larger than the emitter;
// conventional current flows battery+ → COLLECTOR → device → EMITTER → battery−;
// base current flows INTO the base (down, from a small control source at top);
// every wire uses CurrentFlow chevrons (conventional current), never PathFlow dots.
import { svgEl, sleep, waitFor } from '../engine/util.js';
import { SFX } from '../engine/sfx.js';
import { guide } from '../engine/guide.js';
import { flow } from '../engine/flow.js';
import { newStage } from '../engine/stage.js';
import { CurrentFlow } from '../engine/pathflow.js';
import { makeLamp, makeBattery, makeSlider, makeChip, makePlacer, cornerTicks } from '../engine/components.js';
import { makeCarrierGrid, makeDepletionBands, hopElectrons, makeBracket } from '../engine/junction.js';

export async function step2(){
  const { svg, controls } = newStage('02', 'PN junction: the depletion layer builds itself');
  guide.title('STEP 2 / 4 · NANOVOLT SEMICONDUCTORS', 'Build your own <em>transistor</em>');

  guide.say(`Your doped wafer conducts, but right now it's just a wire. A <b>transistor</b> is a switch with no moving parts: a small signal controls a large current. To build one, you first need the piece it's made of — the boundary where N-type silicon meets P-type. That boundary is called a <b>PN junction</b>, and this step is about what happens there.`);
  await guide.next();
  guide.say(`Aim: press an N block and a P block together, watch the junction form on its own, and test what it does to current. Take an <b>N</b> block (spare <span class="e-blue">electrons</span>) and a <b>P</b> block (spare <span class="e-red">holes</span>) and push them together.`);
  await guide.next();

  /* ==================================================================
     PART ONE — THE PN JUNCTION (the depletion layer + the diode)
     ================================================================== */
  const jg = svgEl('g');   // the whole junction apparatus lives in one group we fade+remove later
  svg.appendChild(jg);

  /* ---------- P block (static, pre-placed on the left) ---------- */
  jg.appendChild(svgEl('rect', { x: 150, y: 170, width: 210, height: 160, class: 'p-region' }));
  const pLetter = svgEl('text', { x: 168, y: 196, class: 'tile-letter', 'text-anchor': 'start' }); pLetter.textContent = 'P';
  jg.appendChild(pLetter);

  /* ---------- dock slot (where the N block belongs) ---------- */
  const dockRect = svgEl('rect', { x: 360, y: 170, width: 210, height: 160, class: 'slot' });
  const dockQ = svgEl('text', { x: 465, y: 259, class: 'slot-q' }); dockQ.textContent = '?';
  jg.append(dockRect, dockQ);

  /* ---------- N block (draggable tile) ---------- */
  const nTile = svgEl('g', { class: 'tile', 'aria-label': 'N block' });
  nTile.appendChild(svgEl('rect', { width: 210, height: 160, rx: 8, class: 'tile-bg' }));
  const nLetter = svgEl('text', { x: 105, y: 88, class: 'tile-letter' }); nLetter.textContent = 'N';
  nTile.appendChild(nLetter);
  const nCap = svgEl('text', { x: 105, y: 148, class: 'tile-cap' }); nCap.textContent = 'your phosphorus recipe';
  nTile.appendChild(nCap);
  svg.appendChild(nTile);   // tile lives outside jg while dragging; folded in after dock

  /* P carriers (holes) — 7×5 grid inside the P block, dots x=164…332, y=184…304 */
  const pGrid = makeCarrierGrid(jg, { x: 150, y: 170, w: 210, h: 160, type: 'P', cols: 7, rows: 5, pitchX: 28, pitchY: 30, inset: 14 });
  /* N carriers (electrons) — same grid inside the docked position, dots x=374…542 */
  const nGrid = makeCarrierGrid(jg, { x: 360, y: 170, w: 210, h: 160, type: 'N', cols: 7, rows: 5, pitchX: 28, pitchY: 30, inset: 14 });
  nGrid.el.setAttribute('opacity', 0);   // hidden until the N block docks

  /* ---------- ASK #1: dock the N block ---------- */
  const nTileHandle = { g: nTile, value: 'N', w: 210, h: 160, home: { x: 430, y: 330 }, tx: 0, ty: 0, slot: null };
  const dockSlot = { key: 'DOCK', x: 360, y: 170, w: 210, h: 160, correct: 'N', rect: dockRect, q: dockQ, value: null, tile: null };
  const placer = makePlacer({
    svg, tiles: [nTileHandle], slots: [dockSlot],
    validate: v => v[0] === 'N',
    onWrong: () => guide.note(`That's the N block — press it flush against the P block on the left.`),
  });

  await flow.ask(async replay => {
    if (replay !== undefined){ placer.autoPlace(); return replay; }
    await placer.done;
    return true;
  });

  /* on dock: snap flush, draw the seam hairline, reveal the N lattice */
  dockRect.style.opacity = '0'; dockQ.style.opacity = '0';
  nTile.style.opacity = '0';
  nGrid.el.setAttribute('opacity', 1);
  const seam = svgEl('line', { x1: 360, y1: 170, x2: 360, y2: 330, class: 'junction' });
  jg.appendChild(seam);
  const nLabel = svgEl('text', { x: 465, y: 259, class: 'tile-letter' }); nLabel.textContent = 'N';
  jg.appendChild(nLabel);
  if (!flow.instant) SFX.success();
  await sleep(400);

  /* ---------- the hop ceremony (auto, no interaction — let it breathe) ---------- */
  guide.say(`Watch the boundary. With no battery and no voltage, the spare electrons next to it cross over and fill the nearest holes. Each electron that leaves the N side turns its atom into a <b>fixed positive charge</b>; where it lands on the P side, it creates a <b>fixed negative charge</b>. These charges can't move.`);
  await sleep(600);

  // two N columns nearest the seam (c=0 at x=374, c=1 at x=402) map to the two
  // nearest P columns (c=6 at x=332, c=5 at x=304), same row, nearest-column-first:
  // all of x=374→x=332 top-to-bottom, then x=402→x=304 top-to-bottom.
  const pairs = [];
  for (let r = 0; r < 5; r++) pairs.push({ from: nGrid.at(0, r), to: pGrid.at(6, r) });
  for (let r = 0; r < 5; r++) pairs.push({ from: nGrid.at(1, r), to: pGrid.at(5, r) });
  await hopElectrons(svg, { pairs });

  /* depletion bands fade in around the ions */
  const bands = makeDepletionBands(jg, { cx: 360, y: 170, h: 160, wNeg: 64, wPos: 64 });
  bands.el.setAttribute('opacity', 0);
  if (flow.instant){
    bands.el.setAttribute('opacity', 1);
  } else {
    gsap.to(bands.el, { opacity: 1, duration: 0.5, ease: 'power2.out' });
    await sleep(500);
  }

  guide.say(`It stops quickly. The P side of the boundary is now <span class="e-blue">slightly negative</span> and the N side is <span class="e-red">slightly positive</span>. That charge difference creates a voltage that pushes any further electrons back, so the crossing halts on its own. This thin region, now empty of free carriers, is the <b>depletion layer</b>. It acts as a barrier to current.`);
  await sleep(500);

  /* the measurement bracket — the ~0.7 V barrier, earned not stated */
  const bracket = makeBracket(jg, { x1: 296, x2: 424, y: 372, label: 'barrier ≈ 0.7 V' });
  if (!flow.instant){
    bracket.style.opacity = '0';
    gsap.to(bracket, { opacity: 1, duration: 0.4, ease: 'power2.out' });
  }
  await guide.next();

  /* ---------- wiring: battery + lamp for the bias tests ----------
     conventional current: battery+ → right riser → N side → seam → P side →
     left riser → battery−. */
  const jWireR = svgEl('path', { d: 'M402 430 H620 V259 H570', class: 'wire' });
  const jWireL = svgEl('path', { d: 'M150 259 H100 V430 H318', class: 'wire' });
  jg.append(jWireL, jWireR);
  const battG = makeBattery(svg, 360, 430);   // returns its group; we manage polarity below
  const jLampH = makeLamp(svg, 620, 300, { label: 'lamp' });
  // fold the battery + lamp into jg so they clear with the whole apparatus later
  jg.append(battG, jLampH.g);
  const jLamp = jLampH;

  const jFlowLayer = svgEl('g'); jg.appendChild(jFlowLayer);
  const jRoute = svgEl('path', { d: 'M402 430 H620 V259 H150 V430 H318', fill: 'none', stroke: 'none' });
  jg.appendChild(jRoute);
  const jFlow = new CurrentFlow(jRoute, { n: 14, layer: jFlowLayer });

  /* ---------- forward-bias controls ---------- */
  const chipWall = makeChip(controls, 'wall: <b>standing</b>');
  const chipFlow = makeChip(controls, 'flow: <b>0</b>');
  const slider = makeSlider(controls, { label: 'push voltage', min: 0, max: 1.5, step: 0.05, value: 0, fmt: v => v.toFixed(2) + ' V' });

  let reversed = false;      // set true once the battery is flipped (§2.5)
  let didFlow = false;       // one-shot SFX.flow() guard for forward break
  /* PURE, idempotent function of v — replay calls it once with the recorded value. */
  function apply(v){
    if (reversed){
      // reverse bias: any voltage only widens the empty zone further; never any flow.
      bands.quiver(false);
      bands.setWidth(1.6 + v * 0.4);
      jFlow.setSpeed(0);
      jLamp.set(0);
      chipWall.set('wall: <b>wider</b>');
      chipFlow.set('flow: <b>0</b>'); chipFlow.cls('state-on', false);
      return;
    }
    if (v < 0.7){
      bands.setWidth(1 - v * 0.35);       // wall thins as carriers lean on it (~0.75 at 0.65 V)
      bands.quiver(v > 0.45);
      jFlow.setSpeed(0);
      jLamp.set(0);
      chipWall.set('wall: <b>standing</b>'); chipWall.cls('state-on', false);
      chipFlow.set('flow: <b>0</b>');
    } else {
      bands.quiver(false);
      bands.collapse();                   // setWidth(0.12) + labels fade to 0.25
      const spd = (v - 0.65) * 220;
      jFlow.setSpeed(spd);
      jLamp.set(Math.max(0, Math.min(1, (v - 0.65) / 0.6)));
      chipWall.set('wall: <b>down</b>'); chipWall.cls('state-on', true);
      chipFlow.set(`flow: <b>${Math.round(spd)}</b>`);
      if (!didFlow){ didFlow = true; if (!flow.instant) SFX.flow(); }
    }
  }
  slider.on(apply);
  apply(0);

  guide.say(`Now connect a battery to push electrons toward the boundary. To cross, an electron needs enough energy to get over the barrier. Raise the voltage slowly and find the point where current starts to flow.`);

  /* ---------- ASK #2: forward-bias test ---------- */
  const tFwd = guide.task('Find the voltage where current starts to flow');
  await flow.ask(async replay => {
    if (replay !== undefined){ slider.set(replay); apply(replay); return replay; }
    const cancel = flow.hintAfter(14000, 'Keep raising the voltage. Current starts at about 0.7 V.');
    await waitFor(() => slider.value >= 0.7, { hold: 600 });
    cancel();
    return slider.value;
  });
  tFwd.done();

  guide.note(`About 0.7 V is the height of the barrier. Below it, electrons don't have enough energy to cross, so no current flows. Above it, they cross freely and the lamp lights.`);
  await guide.next();

  /* ---------- ASK #3: flip the battery (reverse bias) ---------- */
  guide.say(`Now reverse the battery and try again.`);
  await guide.button('Flip the battery ↺');

  // swap the battery's polarity marks (the −/+ texts inside the battery glyph)
  reversed = true;
  const battTexts = battG.querySelectorAll('.batt-t');
  if (battTexts.length >= 2){ battTexts[0].textContent = '+'; battTexts[1].textContent = '−'; }
  // route chevrons reverse direction but speed stays 0 (nothing flows); the wall widens
  apply(slider.value);   // recompute in reverse mode from the current slider value

  guide.say(`Same blocks, opposite direction, and no current at any voltage. Reversing the battery pulls carriers <b>away</b> from the boundary instead of toward it, so the depletion layer gets wider. It won't conduct this way no matter how high you go.`);

  /* ---------- ASK #4: reverse-bias test ---------- */
  const tRev = guide.task('Confirm: no current at any voltage');
  await flow.ask(async replay => {
    if (replay !== undefined){ slider.set(replay); apply(replay); return replay; }
    const cancel = flow.hintAfter(12000, 'Turn the voltage all the way up. The barrier only gets wider — still no current.');
    await waitFor(() => slider.value >= 1.2, { hold: 500 });
    cancel();
    return slider.value;
  });
  tRev.done();

  /* ---------- the aha ---------- */
  guide.aha(`You built a <b>diode</b>: it passes current in one direction and blocks it in the other. The useful part is the barrier — voltage can raise or lower it. That control is the basis of every switch in a chip.`,
    `The transistor you'll build next is two of these junctions back-to-back.`);
  await guide.next();

  /* ---------- clear the junction apparatus (reuse the same svg — no newStage) ---------- */
  if (flow.instant){
    jg.remove();
  } else {
    await new Promise(res => gsap.to(jg, { opacity: 0, duration: 0.5, ease: 'power2.out', onComplete: res }));
    jg.remove();
  }
  jFlow.destroy();
  controls.innerHTML = '';

  /* ==================================================================
     PART TWO — THE NPN TRANSISTOR (two walls back-to-back)
     ================================================================== */
  guide.say(`Now build the transistor itself. It's two of these junctions back-to-back: N, then a thin layer of P, then N. The three parts have names — the <b>emitter</b> sends electrons, the thin <b>base</b> in the middle is the control, and the <b>collector</b> gathers them. Aim: arrange the blocks so a tiny current into the base can switch a much larger current through the device.`);
  await guide.next();

  /* ---------- slots (collector is physically larger) ---------- */
  const SLOTS = [
    { key: 'E', x: 118, y: 158, w: 104, h: 118, correct: 'E' },
    { key: 'B', x: 232, y: 158, w: 64, h: 118, correct: 'B' },
    { key: 'C', x: 306, y: 158, w: 182, h: 118, correct: 'C' },
  ];
  const slotG = svgEl('g');
  const slots = SLOTS.map(s => {
    const rect = svgEl('rect', { x: s.x, y: s.y, width: s.w, height: s.h, class: 'slot' });
    const q = svgEl('text', { x: s.x + s.w / 2, y: s.y + s.h / 2 + 9, class: 'slot-q' }); q.textContent = '?';
    slotG.append(rect, q);
    return { ...s, rect, q, value: null, tile: null };
  });
  svg.appendChild(slotG);

  /* ---------- tray tiles: distinct sizes so the size difference is felt ---------- */
  function makeTile(value, w, h, cap){
    const g = svgEl('g', { class: 'tile', 'aria-label': `${value} block` });
    const bg = svgEl('rect', { width: w, height: h, rx: 8, class: 'tile-bg' });
    g.appendChild(bg);
    const letter = svgEl('text', { x: w / 2, y: h / 2 + 8, class: 'tile-letter' });
    letter.textContent = value === 'B' ? 'P' : 'N';
    g.appendChild(letter);
    const capEl = svgEl('text', { x: w / 2, y: h - 8, class: 'tile-cap' });
    capEl.textContent = cap;
    g.appendChild(capEl);
    svg.appendChild(g);
    return { g, value, w, h, home: null, tx: 0, ty: 0, slot: null };
  }
  const tray = [
    ['E', 96, 66, 'emitter — small', 148],
    ['B', 60, 92, 'base — thin', 300],
    ['C', 150, 78, 'collector — wide', 470],
  ];
  const tiles = tray.map(([v, w, h, cap, x]) => { const t = makeTile(v, w, h, cap); t.home = { x, y: 340 }; return t; });

  guide.say(`Three blocks, three sizes, on purpose: a small <b>emitter</b>, a thin <b>base</b>, and a wide <b>collector</b>. Place them left to right. Drag them in, or tap a block then tap a slot.`);

  const placer2 = makePlacer({
    svg, tiles, slots,
    validate: v => v[0] === 'E' && v[1] === 'B' && v[2] === 'C',
    onWrong: () => guide.note(`Not quite — the thin <b>P base</b> goes in the middle, and the wide <b>collector</b> goes on the right.`),
  });

  await flow.ask(async replay => {
    if (replay !== undefined){ placer2.autoPlace(); return replay; }
    await placer2.done;
    return true;
  });

  /* ---------- merge into a device ---------- */
  await sleep(500);
  tiles.forEach(t => t.g.style.opacity = '0');
  slots.forEach(s => { s.rect.style.opacity = '0'; s.q.style.opacity = '0'; });
  const dev = svgEl('g');
  dev.innerHTML = `
    <rect x="118" y="158" width="104" height="118" class="n-region"/>
    <rect x="222" y="158" width="84" height="118" class="p-region"/>
    <rect x="306" y="158" width="182" height="118" class="n-region"/>
    <line x1="222" y1="158" x2="222" y2="276" class="junction"/>
    <line x1="306" y1="158" x2="306" y2="276" class="junction"/>
    <text x="170" y="222" class="tile-letter">N</text>
    <text x="264" y="222" class="tile-letter">P</text>
    <text x="397" y="222" class="tile-letter">N</text>
    <text x="170" y="292" class="lbl">EMITTER (N)</text>
    <text x="264" y="292" class="lbl">BASE (P)</text>
    <text x="397" y="292" class="lbl">COLLECTOR (N)</text>`;
  dev.classList.add('pop-in');
  svg.appendChild(dev);
  if (!flow.instant) SFX.success();

  /* ---------- the two self-built depletion walls (narrow, at each seam) ---------- */
  const wallL = makeDepletionBands(svg, { cx: 222, y: 158, h: 118, wNeg: 14, wPos: 14 });   // emitter–base
  const wallR = makeDepletionBands(svg, { cx: 306, y: 158, h: 118, wNeg: 14, wPos: 14 });   // base–collector
  // too tight for microlabels here — suppress them (and the dashed outer edges, which would
  // double up with the device's own junction lines); tooltip titles instead
  [wallL, wallR].forEach(w => {
    w.lblNeg.setAttribute('opacity', 0); w.lblPos.setAttribute('opacity', 0);
    w.el.querySelectorAll('line').forEach(l => l.setAttribute('opacity', 0));
    const tt = svgEl('title'); tt.textContent = 'depletion wall'; w.el.appendChild(tt);
  });
  if (flow.instant){
    wallL.el.setAttribute('opacity', 1); wallR.el.setAttribute('opacity', 1);
  } else {
    wallL.el.setAttribute('opacity', 0); wallR.el.setAttribute('opacity', 0);
    gsap.to([wallL.el, wallR.el], { opacity: 1, duration: 0.5, ease: 'power2.out' });
  }

  guide.say(`<b>N–P–N</b>. The <span class="e-blue">emitter</span> is small — its job is to send electrons. The <span class="e-red">base</span> is thin, and it's the control. The <span class="e-blue">collector</span> is wide because it has to collect nearly all of them. Notice the <b>two depletion barriers</b>, one at each junction. For current flowing straight through, one barrier always blocks it — so the device stays <b>OFF</b> until you inject a small current into the base.`);
  await guide.next();

  /* ---------- wiring: conventional current battery+ → collector → device → emitter → battery− ---------- */
  const mainWireR = svgEl('path', { d: 'M402 420 H644 V217 H488', class: 'wire' });
  const mainWireL = svgEl('path', { d: 'M118 217 H76 V420 H318', class: 'wire' });
  svg.insertBefore(mainWireL, dev);
  svg.insertBefore(mainWireR, dev);
  const baseWire = svgEl('path', { d: 'M264 66 V158', class: 'wire' });
  svg.insertBefore(baseWire, dev);

  const ctlBox = svgEl('g');
  ctlBox.innerHTML = `
    <rect x="222" y="28" width="84" height="38" rx="9" class="batt-body"/>
    <text x="264" y="52" class="batt-t" font-size="11">control</text>`;
  svg.appendChild(ctlBox);
  makeBattery(svg, 360, 420);
  const led = makeLamp(svg, 644, 310, { label: 'LED' });

  const flowLayer = svgEl('g'); svg.appendChild(flowLayer);
  // one continuous route running in the CONVENTIONAL CURRENT direction:
  // battery+ (right) → up → left through the device → down the left side → back to battery−
  const route = svgEl('path', { d: 'M402 420 H644 V217 H118 V420 H318', fill: 'none', stroke: 'none' });
  svg.appendChild(route);
  const mainFlow = new CurrentFlow(route, { n: 16, layer: flowLayer });
  const baseRoute = svgEl('path', { d: 'M264 66 V158', fill: 'none', stroke: 'none' });
  svg.appendChild(baseRoute);
  const baseFlow = new CurrentFlow(baseRoute, { n: 4, size: 3.6, layer: flowLayer });

  const chipBase = makeChip(controls, 'control: <b>0.0 µA</b>');
  const chipMain = makeChip(controls, 'main flow: <b>0 µA</b>');
  const slider2 = makeSlider(controls, { label: 'control signal', min: 0, max: 10, step: .1, value: 0, fmt: v => v.toFixed(1) + ' µA' });
  let firstOpen = false;
  function apply2(v){
    chipBase.set(`control: <b>${v.toFixed(1)} µA</b>`);
    chipMain.set(`main flow: <b>${Math.round(v * 100)} µA</b>`);
    mainFlow.setSpeed(v * 24);       // positive speed = correct conventional direction along the route
    baseFlow.setSpeed(v * 9);        // positive speed = down into the base
    led.set(v / 10);
    // the base trickle floods the emitter-side wall with carriers and holds it collapsed
    wallL.setWidth(1 - v / 10 * 0.88);   // left (base–emitter) wall collapses as control rises
    // right (base–collector) wall stays put
    mainWireL.classList.toggle('live', v > 0);
    mainWireR.classList.toggle('live', v > 0);
    if (v > 1 && !firstOpen){ firstOpen = true; if (!flow.instant) SFX.flow(); }
  }
  slider2.on(apply2);
  slider2.set(4);
  apply2(4);

  guide.say(`Now it's wired up. The <b>arrows</b> show conventional current: out of the battery's <b>+</b>, into the <b>collector</b>, through the device, out of the <b>emitter</b>, back to <b>−</b>. A small current into the <b>base</b> lowers the emitter-side barrier so the main current can cross. It's half-open right now. Try the dial.`);
  await guide.next();

  /* ---------- the test ---------- */
  guide.say(`<b>Your test:</b> control the large current using only the small one.`);

  const t1 = guide.task('Take the LED to fully OFF');
  await flow.ask(async replay => {
    if (replay !== undefined){ slider2.set(replay); apply2(replay); return replay; }
    const cancel = flow.hintAfter(12000, 'Turn the control signal to zero. With no base current, the barrier blocks the main current.');
    await waitFor(() => slider2.value <= 0.05, { hold: 650 });
    cancel();
    return slider2.value;
  });
  t1.done();

  const t2 = guide.task('Now full brightness — max control signal');
  await flow.ask(async replay => {
    if (replay !== undefined){ slider2.set(replay); apply2(replay); return replay; }
    const cancel = flow.hintAfter(12000, 'Turn the control signal to maximum. The small base current holds the device fully on.');
    await waitFor(() => slider2.value >= 9.8, { hold: 650 });
    cancel();
    return slider2.value;
  });
  t2.done();

  guide.aha(`<b>10 µA in, 1,000 µA out.</b> The control current is a hundred times smaller than the current it switches. Switch it on and off and you have a digital switch; vary it smoothly and you have an amplifier. This is the transistor.`,
    `The base current lowers the emitter-side barrier and holds it down — that's the mechanism.`);
  await guide.next();

  guide.note(`Note: inside the crystal the electrons move opposite to the arrows — from emitter to collector. Conventional current points the other way, as you saw in Step 1.`);
  await guide.next();
}
