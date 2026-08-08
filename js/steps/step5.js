// ACT 1 · STEP 5 — "Why a billion switches do not melt" (the CMOS inverter).
// Rebuilt to the micro-learning contract in DESIGN_MAKEOVER.md §2 / §4: one card at a
// time (guide.cards), every card focuses and names the one thing it is about, and the
// leak is a thing the player switches on and reads off a meter before any twin appears.
//
// Physics per DESIGN.md §4.9: PMOS on top, NMOS below, one input into both gates, and the
// supply only draws current on a flip. Conventional current only (ink chevrons, never
// carrier dots): battery + → power rail → device column → ground rail → battery −, with
// charge = power→output and discharge = output→ground on each flip. Colour stays
// semantic: blue for the N-type switch, red for the P-type one, amber for the gate oxide.
//
// Determinism: the meter needle is driven by Anim.tween (replay-collapses to its end
// value), never by a bare rAF or setTimeout loop, and every interaction is recorded
// through flow.ask as the input value it left behind, so replay lands on the same state.
import { svgEl, waitFor } from '../engine/util.js';
import { Anim } from '../engine/anim.js';
import { SFX } from '../engine/sfx.js';
import { guide } from '../engine/guide.js';
import { flow } from '../engine/flow.js';
import { newStage } from '../engine/stage.js';
import { CurrentFlow } from '../engine/pathflow.js';
import { makeLamp, makeChip, makeSeg, makePlacer } from '../engine/components.js';

/* ---------- geometry, in the stage's 720×480 user units ---------- */
const RAIL = { top: 70, bot: 410, x1: 64, x2: 470 };
const COL = 360;                                  // the device column (the spine)
const DEV = { x: 318, w: 84, h: 72, top: 104, bot: 304 };
const NODE = 240;                                 // the output node on the spine
const MET = { x: 18, y: 98, w: 92, h: 76, cx: 64, cy: 166, r: 42 };
const BATT = { plus: 292, minus: 304, cx: 64 };
const A0 = 215 * Math.PI / 180, A1 = 325 * Math.PI / 180;
/* The meter is deliberately RELATIVE: no units, no numbers on the dial and none in the
   copy. The lesson is the contrast between a needle that climbs and stays and one that
   twitches and falls back, and the course has no sourced figure for either current. The
   two constants below are fractions of full deflection, chosen so both states are legible
   on the dial. They are not a claim about amperes. */
const LEAK_LEVEL = 0.62, BLIP_LEVEL = 0.55;

const polar = (cx, cy, r, a) => `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;

async function fadeIn(nodes, dur = 320){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  list.forEach(n => { n.style.display = ''; n.style.opacity = '0'; });
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(p); }));
  list.forEach(n => { n.style.opacity = '1'; });
}
async function fadeOut(nodes, dur = 260){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(1 - p); }));
  list.forEach(n => { n.style.display = 'none'; });
}

export async function step5(){
  guide.title('STEP 5 / 5 · NANOVOLT LOGIC', 'Why a billion switches <em>do not melt</em>');
  guide.cards();

  const stage = newStage('05', 'An NMOS switch on the supply rails, then the same switch paired with its PMOS twin as an inverter');
  const { svg, controls } = stage;

  /* ================= skeleton: rails, supply column, gate wiring ================= */

  const railsG = svgEl('g');
  railsG.innerHTML = `
    <path d="M${RAIL.x1} ${RAIL.top} H${RAIL.x2}" class="wire"/>
    <text x="200" y="${RAIL.top - 12}" class="rail-t">POWER</text>
    <path d="M${RAIL.x1} ${RAIL.bot} H${RAIL.x2}" class="wire"/>
    ${[0, 1, 2, 3, 4].map(i => `<line x1="${150 + i * 40}" y1="${RAIL.bot}" x2="${138 + i * 40}" y2="${RAIL.bot + 14}" class="wire"/>`).join('')}
    <text x="200" y="${RAIL.bot + 32}" class="rail-t">GROUND</text>`;
  svg.appendChild(railsG);

  /* the left column: power rail → meter → battery → ground rail */
  const supplyG = svgEl('g');
  supplyG.innerHTML = `
    <path d="M${MET.cx} ${RAIL.top} V${MET.y}" class="wire"/>
    <path d="M${MET.cx} ${MET.y + MET.h + 20} V${BATT.plus}" class="wire"/>
    <path d="M${MET.cx} ${BATT.minus} V${RAIL.bot}" class="wire"/>`;
  svg.appendChild(supplyG);

  /* the device column. sTop is a plain wire in the first scene and becomes the
     PMOS slot later, so the player watches the top of the column open up. */
  const spineG = svgEl('g');
  const sTop = svgEl('path', { d: `M${COL} ${DEV.top} V${DEV.top + DEV.h}`, class: 'wire' });
  spineG.innerHTML = `
    <path d="M${COL} ${RAIL.top} V${DEV.top}" class="wire"/>
    <path d="M${COL} ${DEV.top + DEV.h} V${DEV.bot}" class="wire"/>
    <path d="M${COL} ${DEV.bot + DEV.h} V${RAIL.bot}" class="wire"/>`;
  spineG.appendChild(sTop);
  svg.appendChild(spineG);

  /* the input terminal and the wire from it to the gates */
  const gateG = svgEl('g');
  const gateTop = svgEl('path', { d: 'M230 240 V140 H304', class: 'wire' });
  gateTop.style.display = 'none';
  gateG.innerHTML = `
    <rect x="118" y="222" width="54" height="36" rx="9" class="batt-body"/>
    <text x="145" y="245" class="batt-t" font-size="12">IN</text>
    <path d="M172 240 H230" class="wire"/>
    <path d="M230 240 V340 H304" class="wire"/>`;
  gateG.appendChild(gateTop);
  svg.appendChild(gateG);

  /* the output: node, wire and lamp. Drawn under the chevron layer so the current
     pulses read as travelling along this wire rather than beside it. */
  const outG = svgEl('g');
  outG.innerHTML = `
    <path d="M${COL} ${NODE} H556" class="wire"/>
    <circle cx="${COL}" cy="${NODE}" r="5" class="node-dot"/>`;
  svg.appendChild(outG);
  const lamp = makeLamp(outG, 580, NODE, { label: 'OUT' });
  outG.style.display = 'none';

  /* ================= conventional current: three paths, one chevron layer ========= */

  const geo = svgEl('g', { fill: 'none', stroke: 'none' });
  const leakP = svgEl('path', { d: `M${BATT.cx} ${BATT.plus} V${RAIL.top} H${COL} V${RAIL.bot} H${BATT.cx} V${BATT.minus}` });
  const chargeP = svgEl('path', { d: `M${BATT.cx} ${BATT.plus} V${RAIL.top} H${COL} V${NODE} H556` });
  const dischgP = svgEl('path', { d: `M556 ${NODE} H${COL} V${RAIL.bot} H${BATT.cx} V${BATT.minus}` });
  geo.append(leakP, chargeP, dischgP);
  svg.appendChild(geo);

  const flowLayer = svgEl('g');
  svg.appendChild(flowLayer);
  const leakF = new CurrentFlow(leakP, { n: 16, layer: flowLayer });
  const chargeF = new CurrentFlow(chargeP, { n: 9, layer: flowLayer });
  const dischgF = new CurrentFlow(dischgP, { n: 9, layer: flowLayer });

  /* ================= the meter: a drawn instrument, in the supply wire =========== */

  const meterG = svgEl('g');
  meterG.innerHTML = `
    <rect x="${MET.x}" y="${MET.y}" width="${MET.w}" height="${MET.h}" rx="5" class="tile-bg"/>
    <path d="M${polar(MET.cx, MET.cy, MET.r, A0)} A${MET.r} ${MET.r} 0 0 1 ${polar(MET.cx, MET.cy, MET.r, A1)}"
          fill="none" stroke="var(--hairline-strong)" stroke-width="1.2"/>
    ${[A0, (A0 + A1) / 2, A1].map(a =>
      `<path d="M${polar(MET.cx, MET.cy, MET.r - 7, a)} L${polar(MET.cx, MET.cy, MET.r, a)}" class="wire"/>`).join('')}
    <rect x="${MET.cx - 44}" y="${MET.y + MET.h}" width="88" height="20" rx="3" class="tile-bg"/>`;
  const needle = svgEl('line', { x1: MET.cx, y1: MET.cy, x2: MET.cx, y2: MET.cy, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' });
  const pivot = svgEl('circle', { cx: MET.cx, cy: MET.cy, r: 3, class: 'node-dot' });
  const readout = svgEl('text', { x: MET.cx, y: MET.y + MET.h + 14, class: 'lbl-strong' });
  meterG.append(needle, pivot, readout);
  svg.appendChild(meterG);

  /* f is a fraction of full deflection, not a measurement (see the note at the top) */
  function setNeedle(f){
    const a = A0 + (A1 - A0) * Math.max(0, Math.min(1, f));
    needle.setAttribute('x2', (MET.cx + 34 * Math.cos(a)).toFixed(1));
    needle.setAttribute('y2', (MET.cy + 34 * Math.sin(a)).toFixed(1));
  }
  const setRead = w => { readout.textContent = w; };
  setNeedle(0);
  setRead('AT REST');

  /* the battery, drawn so the player can see it never leaves the circuit */
  const battG = svgEl('g');
  battG.innerHTML = `
    <line x1="${BATT.cx - 22}" y1="${BATT.plus}" x2="${BATT.cx + 22}" y2="${BATT.plus}" stroke="var(--ink)" stroke-width="1.8"/>
    <line x1="${BATT.cx - 12}" y1="${BATT.minus}" x2="${BATT.cx + 12}" y2="${BATT.minus}" stroke="var(--ink)" stroke-width="4"/>
    <text x="${BATT.cx + 30}" y="${BATT.plus + 4}" class="batt-t" text-anchor="start">+</text>
    <text x="${BATT.cx + 30}" y="${BATT.minus + 12}" class="batt-t" text-anchor="start">−</text>`;
  svg.appendChild(battG);

  /* ================= the switch drawings ========================================= */

  // gate metal, a sliver of glass, then the silicon body: the capacitor stack from
  // the last step, kept visible so the gate never looks like it touches the channel.
  function placedMOS(y0, kind){
    const p = kind === 'PMOS', col = p ? 'var(--red)' : 'var(--blue)';
    const g = svgEl('g');
    g.innerHTML = `
      <rect x="${DEV.x}" y="${y0}" width="${DEV.w}" height="${DEV.h}" rx="11" class="tile-bg" fill="var(--paper-high)"/>
      <rect x="304" y="${y0 + 22}" width="9" height="28" rx="2" class="gate-metal"/>
      <rect x="313" y="${y0 + 22}" width="4" height="28" class="oxide"/>
      <path d="M${COL} ${y0} V${y0 + 22} M${COL} ${y0 + 50} V${y0 + 72}" stroke="${col}" stroke-width="3" stroke-linecap="round" fill="none"/>
      <rect x="354" y="${y0 + 22}" width="12" height="28" rx="4" class="bridge ${p ? 'p' : ''}"/>
      <text x="412" y="${y0 + 30}" class="tile-cap" text-anchor="start" font-size="11" fill="${col}">${kind}</text>
      <text x="412" y="${y0 + 46}" class="tile-cap" text-anchor="start">ON WHEN IN = ${p ? '0' : '1'}</text>`;
    svg.appendChild(g);
    return { g, bridge: g.querySelector('.bridge') };
  }

  function mosTile(kind){
    const w = 164, h = 60, p = kind === 'PMOS';
    const col = p ? 'var(--red)' : 'var(--blue)';
    const g = svgEl('g', { class: 'tile', 'data-part': kind.toLowerCase(), 'aria-label': kind + ' switch' });
    g.innerHTML = `
      <rect width="${w}" height="${h}" rx="11" class="tile-bg" fill="var(--paper-high)"/>
      <rect x="12" y="14" width="8" height="32" rx="2" class="gate-metal"/>
      <rect x="21" y="14" width="4" height="32" class="oxide"/>
      <path d="M30 30 H50 M58 30 H78" stroke="${col}" stroke-width="3" stroke-linecap="round" fill="none"/>
      <text x="96" y="27" class="tile-cap" text-anchor="start" font-size="12" fill="${col}" font-family="var(--font-display)">${kind}</text>
      <text x="96" y="44" class="tile-cap" text-anchor="start">ON WHEN IN = ${p ? '0' : '1'}</text>`;
    svg.appendChild(g);
    return { g, value: kind, w, h, home: null, tx: 0, ty: 0, slot: null };
  }

  /* ================= CARD 1 — the switch they already built ====================== */

  const nmosA = placedMOS(DEV.bot, 'NMOS');

  guide.say(`One NMOS leaks. While its gate is high, current runs from the supply straight
    to ground and keeps running. Watch it happen, then fix it.`);
  stage.focus(nmosA.g, { label: 'one nmos', at: 'right' });
  await guide.next();

  /* ================= CARD 2 — the rails ========================================== */

  guide.say(`The top rail carries the supply voltage. The bottom rail is ground, at 0 V.
    Your switch sits between the two.`);
  stage.focus(railsG, { label: 'power and ground', at: 'right', ring: false });
  await guide.next();

  /* ================= CARD 3 — the meter ========================================== */

  guide.say(`This meter sits in the supply wire, so everything the battery pushes out
    passes through it. Nothing is moving yet, and the needle sits at rest.`);
  stage.focus(meterG, { label: 'supply current', at: 'right' });
  await guide.next();

  /* ================= CARD 4 — switch it on ======================================= */

  guide.say(`One wire feeds the gate. Set it high and the switch conducts.`);
  stage.focus(gateG, { label: 'gate input', at: 'bottom' });
  await guide.button('Set the gate high ▸');

  nmosA.bridge.style.opacity = '1';
  leakF.setSpeed(150);
  if (!flow.instant) SFX.flow();
  setRead('DRAWING');
  await Anim.tween(700, p => setNeedle(LEAK_LEVEL * p));

  /* ================= CARD 5 — the leak, read off the meter ======================= */

  guide.say(`The needle swung across and stayed there. Power and ground are joined through
    the switch, so the current keeps running.`);
  stage.focus([spineG, nmosA.g], { label: 'power to ground', at: 'top' });
  await guide.next();

  /* ================= CARD 6 — the aim ============================================ */

  guide.say(`One switch drawing this much is nothing. A billion of them holding at once
    would cook the chip. <b>Your goal: hold a value and draw nothing.</b>`);
  stage.focus(meterG, { label: 'still drawing', at: 'right' });
  await guide.next();

  /* ================= the twin arrives ============================================
     Gate low, meter back to zero, and the switch itself travels out to the bench so
     the player watches their NMOS become one of the two tiles they are about to place. */

  stage.clearFocus();
  nmosA.bridge.style.opacity = '0';
  leakF.setSpeed(0);
  await Anim.tween(380, p => setNeedle(LEAK_LEVEL * (1 - p)));
  setRead('AT REST');

  const tiles = [mosTile('PMOS'), mosTile('NMOS')];
  tiles[0].home = { x: 500, y: 300 };
  tiles[1].home = { x: 500, y: 380 };
  // park each tile on its bench spot now; makePlacer re-applies the same transform later
  tiles.forEach(t => {
    t.g.style.display = 'none';
    t.g.style.transform = `translate(${t.home.x}px,${t.home.y}px)`;
    t.tx = t.home.x; t.ty = t.home.y;
  });

  await stage.packInto([nmosA.g], { x: 500, y: 380, w: 164, h: 60 }, { dur: 520, scale: 0.6 });
  nmosA.g.remove();
  await fadeIn([tiles[1].g], 240);
  await fadeIn([tiles[0].g], 300);

  /* ================= CARD 7 — define the PMOS ==================================== */

  guide.say(`Here is a PMOS. Same switch built the other way round: a low gate turns it
    on, a high gate turns it off.`);
  stage.focus(tiles[0].g, { label: 'pmos', at: 'left' });
  await guide.next();

  /* ================= CARD 8 — the output ========================================= */

  stage.clearFocus();
  const SLOTS = [
    { x: 310, y: 100, w: 100, h: 80, correct: 'PMOS' },
    { x: 310, y: 300, w: 100, h: 80, correct: 'NMOS' },
  ];
  const slotsG = svgEl('g');
  svg.appendChild(slotsG);
  const slots = SLOTS.map(s => {
    const rect = svgEl('rect', { x: s.x, y: s.y, width: s.w, height: s.h, rx: 12, class: 'slot' });
    const q = svgEl('text', { x: s.x + s.w / 2, y: s.y + s.h / 2 + 9, class: 'slot-q' });
    q.textContent = '?';
    slotsG.append(rect, q);
    return { ...s, rect, q, value: null, tile: null };
  });
  slotsG.style.display = 'none';

  await fadeIn([outG], 300);
  guide.say(`The wire tapped from the middle of the column is the output. The lamp reads
    it: lit for 1, dark for 0.`);
  stage.focus(outG, { label: 'output', at: 'bottom' });
  await guide.next();

  /* ================= CARD 9 — the two slots ====================================== */

  stage.clearFocus();
  await fadeOut([sTop], 200);
  await fadeIn([slotsG], 300);
  guide.say(`Two slots now. The top one joins the output to power, the bottom one joins it
    to ground. One twin goes in each.`);
  stage.focus(slotsG, { label: 'two slots', at: 'left' });
  await guide.next();

  /* ================= CARD 10 — place the pair ====================================
     No focus on this card: stage.focus re-parents what it raises, which breaks the
     placer's pointer handling on anything it lifts. */

  stage.clearFocus();
  guide.say(`<b>Your goal: fill both slots</b> so that an input of 0 leaves the output
    connected up to power. Drag a twin into each slot.`);

  const placer = makePlacer({
    svg, tiles, slots,
    validate: v => v[0] === 'PMOS' && v[1] === 'NMOS',
    onWrong: () => guide.note(`When IN = 0 the output has to reach power, so the twin that
      turns on at 0 belongs on top. Both tiles are back on the bench.`),
  });
  await flow.ask(async replay => {
    if (replay !== undefined){ placer.autoPlace(); return replay; }
    await placer.done;
    return true;
  });

  /* the tiles become the wired devices */
  await fadeOut([...tiles.map(t => t.g), slotsG], 260);
  const pmos = placedMOS(DEV.top, 'PMOS');
  const nmos = placedMOS(DEV.bot, 'NMOS');
  [pmos.g, nmos.g].forEach(g => { g.style.display = 'none'; });
  await fadeIn([pmos.g, nmos.g], 320);
  await fadeIn([gateTop], 260);
  if (!flow.instant) SFX.success();

  /* ================= CARD 11 — one input, both gates ============================= */

  guide.say(`Wired. The input on the left runs to both gates at once, so both twins always
    read the same signal.`);
  stage.focus(gateG, { label: 'one input, both gates', at: 'bottom' });
  await guide.next();

  /* ================= the live inverter =========================================== */

  // seeded with the value setIN(1) writes a moment later, so no placeholder is ever shown
  const chipOut = makeChip(controls, 'OUT: <b>0</b>');
  let IN = null, OUT = null, flips = 0, blipToken = 0, cancelHint = null;

  async function blip(out){
    const mine = ++blipToken;
    chargeF.setSpeed(0); dischgF.setSpeed(0);
    const f = out === 1 ? chargeF : dischgF;
    f.setSpeed(240);
    setRead('SWITCHING');
    // a quick rise and a slower fall, on a linear clock, so the twitch is watchable
    await Anim.tween(900, p => {
      if (mine !== blipToken) return;
      setNeedle(p >= 1 ? 0 : p < 0.18 ? BLIP_LEVEL * (p / 0.18) : BLIP_LEVEL * Math.exp(-4.6 * (p - 0.18)));
    }, p => p);
    if (mine !== blipToken) return;
    f.setSpeed(0);
    setNeedle(0);
    setRead('AT REST');
  }

  function setIN(v, silent){
    if (IN === v) return;
    IN = v; OUT = v === 0 ? 1 : 0;
    seg.set(v);
    pmos.bridge.style.opacity = v === 0 ? '1' : '0';
    nmos.bridge.style.opacity = v === 1 ? '1' : '0';
    lamp.set(OUT);
    chipOut.set(`OUT: <b>${OUT}</b>`);
    flips++;
    if (cancelHint){ cancelHint(); cancelHint = null; }
    if (!silent){ SFX.blip(); blip(OUT); }
  }

  const seg = makeSeg(controls, [
    { id: 'in-0', label: 'IN = 0', value: 0 },
    { id: 'in-1', label: 'IN = 1', value: 1 },
  ], v => setIN(v));
  setIN(1, true);
  flips = 0;

  /* ================= CARD 12 — exactly one conducts ============================== */

  guide.say(`The input is high right now, so the bottom switch conducts and the top one is
    off. Exactly one of them is ever on.`);
  stage.focus([pmos.g, nmos.g], { label: 'exactly one conducts', at: 'right' });
  await guide.next();

  /* ================= CARD 13 — flip it one way =================================== */

  stage.clearFocus();

  const t1 = guide.task('Set the input to 0 and watch the output lamp.');
  await flow.ask(async replay => {
    if (replay !== undefined){ setIN(replay, true); return replay; }
    cancelHint = flow.hintAfter(12000, `The two buttons under the stage set the input.
      Press <b>IN = 0</b>.`);
    await waitFor(() => OUT === 1, { hold: 400 });
    if (cancelHint){ cancelHint(); cancelHint = null; }
    return IN;
  });
  t1.done();

  /* ================= CARD 14 — flip it back ====================================== */

  const t2 = guide.task('Now set the input to 1.');
  await flow.ask(async replay => {
    if (replay !== undefined){ setIN(replay, true); return replay; }
    cancelHint = flow.hintAfter(12000, `Press <b>IN = 1</b>. The output should go dark.`);
    await waitFor(() => OUT === 0, { hold: 400 });
    if (cancelHint){ cancelHint(); cancelHint = null; }
    return IN;
  });
  t2.done();

  /* ================= CARD 15 — name the inverter ================================= */

  guide.say(`Input 0 gave output 1. Input 1 gave output 0. The output is always the
    opposite of the input, so this pair is an <b>inverter</b>.`);
  stage.focus([pmos.g, nmos.g, outG], { label: 'inverter', at: 'top' });
  await guide.next();

  /* ================= CARD 16 — now watch the meter =============================== */

  guide.say(`Now watch the meter instead of the lamp. Flip the input twice more.`);
  stage.focus(meterG, { label: 'watch the meter', at: 'right' });

  flips = 0;
  await flow.ask(async replay => {
    if (replay !== undefined){ setIN(replay, true); return replay; }
    await waitFor(() => flips >= 2, { hold: 400 });
    return IN;
  });

  /* ================= CARD 17 — the payoff ======================================== */

  guide.aha(`The battery stayed connected the whole time, and the needle only twitched on
    each flip. Between flips one twin is off, so there is no path from power to ground.`,
    `The only current is the pulse that fills or empties the output wire while it changes.`);
  stage.focus(battG, { label: 'connected the whole time', at: 'right' });
  await guide.next();

  /* ================= CARD 18 — the name ========================================== */

  guide.say(`One N-type switch, one P-type switch, wired against each other. The pair is
    called complementary MOS, or <b>CMOS</b>.`);
  stage.focus([pmos.g, nmos.g], { label: 'cmos', at: 'right' });
  await guide.next();

  /* ================= CARD 19 — back to step 3 ==================================== */

  guide.note(`Your transistor in step 3 drank current the whole time it was on. This pair
    pays only when it changes.`);
  stage.focus(meterG, { label: 'pays only on a change', at: 'right' });
  await guide.next();
  stage.clearFocus();
}
