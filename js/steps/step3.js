// STEP 3 — Build your own MOSFET.
// Physics per DESIGN.md §4/§8: gate + oxide + p-silicon form a CAPACITOR — charging the
// top plate pulls electrons up against the underside of the glass, and that pulled-up sheet
// IS the channel. Conventional current: battery+ → drain → channel → source → battery−.
import { svgEl, sleep, clamp, rand, waitFor } from '../engine/util.js';
import { SFX } from '../engine/sfx.js';
import { guide } from '../engine/guide.js';
import { flow } from '../engine/flow.js';
import { newStage } from '../engine/stage.js';
import { Field } from '../engine/field.js';
import { CurrentFlow } from '../engine/pathflow.js';
import { makeLamp, makeBattery, makeSlider, makeChip, cornerTicks } from '../engine/components.js';

export async function step3(){
  const { svg, controls } = newStage('03', 'MOSFET cross-section');
  guide.title('STEP 3 / 4 · NANOVOLT MICRO', 'Build your own <em>MOSFET</em>');

  guide.say(`Same ingredients, smarter shape. Two <b>N islands</b> sit in a <b>P base</b> — and floating just above the gap between them, a metal pad called the <b>gate</b>, resting on a razor-thin layer of glass. The gate <em>never touches</em> the silicon.`);

  /* ---------- cross-section geometry (reused from v1) ---------- */
  const g = svgEl('g');
  g.innerHTML = `
    <rect x="150" y="240" width="420" height="130" rx="10" class="p-region"/>
    <rect x="168" y="240" width="92" height="58" rx="8" class="n-region"/>
    <rect x="460" y="240" width="92" height="58" rx="8" class="n-region"/>
    <rect x="268" y="226" width="184" height="14" class="oxide"/>
    <rect x="268" y="184" width="184" height="36" class="gate-metal"/>
    <text x="214" y="274" class="tile-letter">N</text>
    <text x="506" y="274" class="tile-letter">N</text>
    <text x="360" y="207" class="lbl-strong">GATE</text>
    <text x="360" y="350" class="lbl">p-type base (your boron recipe)</text>
    <text x="214" y="330" class="lbl">source</text>
    <text x="506" y="330" class="lbl">drain</text>
    <text x="360" y="221" class="lbl-faint" fill="var(--amber)">thin glass — nothing gets through</text>`;
  svg.appendChild(g);

  const gateStem = svgEl('path', { d: 'M360 184 V120', class: 'wire' });
  svg.appendChild(gateStem);
  const gateBadge = svgEl('g');
  gateBadge.innerHTML = `
    <rect x="300" y="86" width="120" height="26" rx="4" fill="none" stroke="var(--hairline-strong)"/>
    <text x="360" y="103" class="lbl">into gate: 0 A — always</text>`;
  svg.appendChild(gateBadge);

  cornerTicks(svg, 150, 184, 420, 186);

  await guide.next();

  /* ---------- NEW: the capacitor analogy — intuition anchor ---------- */
  guide.say(`Look again at that little stack: <b>gate metal → thin glass → p-silicon</b>. Strip away the labels and it's an ordinary <b>capacitor</b> — two conductive plates separated by an insulator. Put a voltage on the top plate and it charges up. The field it creates reaches straight through the glass and pulls the opposite charge — <span class="e-blue">electrons</span> — up against the underside, forming a thin sheet pressed to the glass. <b>That pulled-up sheet of electrons is the channel.</b> No current ever crosses the glass; the gate just <em>persuades</em> carriers to gather beneath it.`);
  await guide.next();

  /* ---------- field lines + channel electrons ---------- */
  const fl = svgEl('g');
  for (let i = 0; i < 5; i++) fl.appendChild(svgEl('line', { x1: 292 + i * 34, y1: 222, x2: 292 + i * 34, y2: 250, class: 'field-line' }));
  svg.appendChild(fl);

  const chField = new Field(svg);
  const chBounds = { x: 268, y: 244, w: 184, h: 12 };

  /* ---------- wiring: conventional current battery+ → drain → channel → source → battery− ---------- */
  const wL = svgEl('path', { d: 'M168 269 H80 V420 H318', class: 'wire' });
  const wR = svgEl('path', { d: 'M552 269 H640 V420 H402', class: 'wire' });
  svg.append(wL, wR);
  makeBattery(svg, 360, 420);
  const lamp = makeLamp(svg, 640, 345, { label: 'lamp' });

  const flowLayer = svgEl('g'); svg.appendChild(flowLayer);
  // continuous route: battery+ → right → up → drain side → through channel (right→left) → down source side → battery−
  const route = svgEl('path', { d: 'M402 420 H640 V269 H506 L458 252 H262 L214 269 H80 V420 H318', fill: 'none', stroke: 'none' });
  svg.appendChild(route);
  const cFlow = new CurrentFlow(route, { n: 15, layer: flowLayer });

  const chipV = makeChip(controls, 'gate: <b>0.00 V</b>');
  const chipI = makeChip(controls, 'into gate: <b>0 A</b> — always');
  const chipS = makeChip(controls, 'switch: <b>OFF</b>', 'state-off');
  const slider = makeSlider(controls, { label: 'gate voltage', min: 0, max: 3, step: .05, value: 0, fmt: v => v.toFixed(2) + ' V' });
  const VTH = 1.2;
  let wasOn = false;
  function apply(v){
    const od = clamp((v - VTH) / (3 - VTH), 0, 1);
    chipV.set(`gate: <b>${v.toFixed(2)} V</b>`);
    const target = Math.round(od * 14);
    while (chField.parts.length < target) chField.spawn({ x: rand(chBounds.x, chBounds.x + chBounds.w), y: rand(chBounds.y, chBounds.y + chBounds.h), kind: 'e', bounds: chBounds });
    while (chField.parts.length > target) chField.removeOne();
    fl.querySelectorAll('.field-line').forEach(l => l.style.opacity = (v / 3 * .9).toFixed(2));
    cFlow.setSpeed(od * 170);
    lamp.set(od);
    wL.classList.toggle('live', od > 0); wR.classList.toggle('live', od > 0);
    const on = od > 0;
    chipS.set(`switch: <b>${!on ? 'OFF' : od > .55 ? 'ON' : 'ON (weak)'}</b>`);
    chipS.cls('state-on', on); chipS.cls('state-off', !on);
    if (on && !wasOn && !flow.instant) SFX.flow();
    wasOn = on;
  }
  slider.on(apply);
  slider.set(0);
  apply(0);

  guide.say(`Because of that glass, current <b>cannot flow into the gate</b> — ever. The gate works by field alone: raise the gate voltage <em>slowly</em> and watch the gap between the two N islands.`);

  /* ---------- free exploration until first threshold crossing ---------- */
  await flow.ask(async replay => {
    if (replay !== undefined){ slider.set(replay); apply(replay); return replay; }
    const cancel = flow.hintAfter(14000, 'Drag the gate-voltage slider up past ~1.2 V and keep your eye on the gap between the two N islands.');
    await waitFor(() => slider.value >= VTH, { hold: 100 });
    cancel();
    return slider.value;
  });

  guide.aha(`There it is. Past ~1.2 V the field pulls electrons up under the glass and they form a <b>bridge</b> — a channel from source to drain. Current flows; the lamp lights. Drop the voltage and the bridge dissolves. A switch driven by <em>pure voltage</em> — nothing ever flows into the gate.`,
    `Underneath, electrons drift the ordinary way — source toward drain — while the current arrows above run the other way, exactly as convention demands.`);
  await guide.next();

  /* ---------- certification tasks ---------- */
  guide.say(`<b>Certification time.</b> Show me you own this switch:`);

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

  /* ---------- quiz beat ---------- */
  guide.say(`One more thing. Your Step-2 transistor and this MOSFET can both hold a switch ON all day. <b>Which one is cheaper to hold ON?</b>`);
  const ans = await guide.choose([
    { label: 'The MOSFET (voltage-driven)', value: 'mosfet', hint: 'just hold a voltage on the gate' },
    { label: 'The transistor (current-driven)', value: 'bjt', hint: 'keep the base trickle flowing' },
  ]);
  if (ans === 'mosfet'){
    guide.aha(`Exactly. Holding a voltage is like keeping a magnet stuck to the fridge — it takes <b>no ongoing flow</b>, so almost no energy. The transistor must drink base current every microsecond it's ON. That one difference is why <em>billions</em> of these fit on a chip.`);
  } else {
    guide.note(`Almost — it's the other way around. The transistor drinks base current the whole time it's ON. The MOSFET just <b>holds a voltage</b> across glass: no flow, ~no energy. That's why chips are built from MOSFETs.`);
  }
  await guide.next();
}
