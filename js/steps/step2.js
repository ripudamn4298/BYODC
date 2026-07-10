// STEP 2 — Build your own transistor (NPN).
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

export async function step2(){
  const { svg, controls } = newStage('02', 'NPN transistor build');
  guide.title('STEP 2 / 4 · NANOVOLT SEMICONDUCTORS', 'Build your own <em>transistor</em>');

  guide.say(`Your doped wafer conducts — but honestly, it's just a very obedient wire. The trick that changed the century: arrange N and P so a <b>tiny signal controls a huge flow</b>. A switch with no moving parts.`);
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

  guide.say(`Fresh from your own fab: a small <b>emitter</b> block, a thin <b>base</b> block, and a wide <b>collector</b> block — three different sizes on purpose. Stack them left to right into the frame. <em>Drag them in — or tap a block, then tap a slot.</em>`);

  const placer = makePlacer({
    svg, tiles, slots,
    validate: v => v[0] === 'E' && v[1] === 'B' && v[2] === 'C',
    onWrong: () => guide.note(`Close — but the thin <b>P base</b> belongs in the middle, and the wide <b>collector</b> goes on the right. Size matters here: the collector is built bigger on purpose.`),
  });

  await flow.ask(async replay => {
    if (replay !== undefined){ placer.autoPlace(); return replay; }
    await placer.done;
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

  guide.say(`<b>N–P–N</b> — and look closely at the widths. The <span class="e-blue">emitter</span> is small: its only job is to emit. The <span class="e-red">base</span> is a sliver: a thin control wall. The <span class="e-blue">collector</span> is built <em>wide</em>, because it has to catch and carry away nearly everything the emitter sends. That thin P wall keeps the sandwich <b>OFF</b> — until you whisper at the middle.`);
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
  const slider = makeSlider(controls, { label: 'control signal', min: 0, max: 10, step: .1, value: 0, fmt: v => v.toFixed(1) + ' µA' });
  let firstOpen = false;
  function apply(v){
    chipBase.set(`control: <b>${v.toFixed(1)} µA</b>`);
    chipMain.set(`main flow: <b>${Math.round(v * 100)} µA</b>`);
    mainFlow.setSpeed(v * 24);       // positive speed = correct conventional direction along the route
    baseFlow.setSpeed(v * 9);        // positive speed = down into the base
    led.set(v / 10);
    mainWireL.classList.toggle('live', v > 0);
    mainWireR.classList.toggle('live', v > 0);
    if (v > 1 && !firstOpen){ firstOpen = true; if (!flow.instant) SFX.flow(); }
  }
  slider.on(apply);
  slider.set(4);
  apply(4);

  guide.say(`You're wired up. Follow the <b>arrows</b>, not the electrons: conventional current flows out of the battery's <b>+</b>, into the wide <b>collector</b>, through the device, and out of the <b>emitter</b> — back to <b>−</b>. Meanwhile a whisper of control current flows straight <em>down</em> into the base, filling the wall's holes so the main flow can cross. Right now it's half-open. Feel it out with the dial.`);
  await guide.next();

  /* ---------- the test ---------- */
  guide.say(`<b>Your test, chipmaker:</b> prove you're in command of the big current using only the tiny one.`);

  const t1 = guide.task('Take the LED to fully OFF');
  await flow.ask(async replay => {
    if (replay !== undefined){ slider.set(replay); apply(replay); return replay; }
    const cancel = flow.hintAfter(12000, 'Pull the control signal all the way down. No trickle into the base → the wall closes → no main flow.');
    await waitFor(() => slider.value <= 0.05, { hold: 650 });
    cancel();
    return slider.value;
  });
  t1.done();

  const t2 = guide.task('Now full brightness — max control signal');
  await flow.ask(async replay => {
    if (replay !== undefined){ slider.set(replay); apply(replay); return replay; }
    const cancel = flow.hintAfter(12000, 'Push the dial all the way up. The tiny trickle holds the gate wide open.');
    await waitFor(() => slider.value >= 9.8, { hold: 650 });
    cancel();
    return slider.value;
  });
  t2.done();

  guide.aha(`Look at the numbers: <b>10 µA in, 1,000 µA out.</b> The whisper is a hundred times smaller than the shout it commands. Snap it fast and it's a switch; ride it smoothly and it's an amplifier. You just built the invention that won a Nobel Prize and started Silicon Valley.`);
  await guide.next();

  guide.note(`One honest aside: inside the crystal, the physical carriers are doing the opposite of what the arrows show — electrons actually stream from <b>emitter to collector</b>, exactly against the current arrows, just as you saw back in Step 1.`);
  await guide.next();
}
