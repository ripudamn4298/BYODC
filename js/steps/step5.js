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
import { makeLamp, makeChip, makeSeg, makePlacer, makeRaisedTiles, slideInPanel } from '../engine/components.js';
import { breadboard, dip, jumper } from '../engine/reallife.js';

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

/* ---------- how it looks in real life (HANDOFF_NEXT.md §1) ----------
   Left: a 74HC04 hex inverter on a breadboard, wired the way a first lab wires it: pin 14
   to +5 V, pin 7 to ground, input 1 (pin 1) tied to ground, so output 1 (pin 2) is high and
   lights an LED through a resistor. Right: what is inside, six inverters, with the
   datasheet's pin numbers (1A→1Y is pins 1→2 … 6A→6Y is 13→12, GND 7, VCC 14). The + rail
   and the supply wire are amber, the power colour; ground is ink. */
function realLifeHTML(){
  const bb = breadboard({ x: 30, y: 110, cols: 24, p: 13 });
  const h = bb.hole;
  const chip = dip({ x: h(8, 'f')[0] - 6.5, y: (h(8, 'e')[1] + h(8, 'f')[1]) / 2 - 16.25, n: 14, p: 13, text: '74HC04', sub: 'HEX INVERTER' });
  const [lx, ly] = [(h(21, 'g')[0] + h(23, 'g')[0]) / 2, h(21, 'g')[1]];
  const [r1, r2] = [h(17, 'j'), h(21, 'j')];
  const resistor = `<line x1="${r1[0]}" y1="${r1[1]}" x2="${r2[0]}" y2="${r2[1]}" stroke="#8e8f86" stroke-width="2"/>
    <rect x="${r1[0] + 12}" y="${r1[1] - 5}" width="${r2[0] - r1[0] - 24}" height="10" rx="4" fill="#e3d3b0" stroke="#a89668" stroke-width="1"/>
    ${[0, 1, 2].map(i => `<rect x="${r1[0] + 16 + i * 5}" y="${r1[1] - 5}" width="2.4" height="10" fill="#6b5a3a"/>`).join('')}
    <rect x="${r2[0] - 18}" y="${r1[1] - 5}" width="2.4" height="10" fill="#b39b5a"/>`;
  const ledTop = `<line x1="${h(21, 'g')[0]}" y1="${ly}" x2="${h(23, 'g')[0]}" y2="${ly}" stroke="#8e8f86" stroke-width="2"/>
    <circle cx="${lx}" cy="${ly}" r="14" fill="rgba(168,116,31,.5)" stroke="#a5642a" stroke-width="1.2"/>
    <circle cx="${lx}" cy="${ly}" r="9" fill="rgba(168,116,31,.75)"/>
    <circle cx="${lx}" cy="${ly}" r="21" fill="none" stroke="var(--amber)" stroke-width="1" stroke-dasharray="2 4"/>`;
  const board = `<g data-k="board">${bb.svg}${chip.svg}
    ${jumper(h(8, 'a'), h(6, 'T+'), 'var(--amber)', 6)}
    ${jumper(h(14, 'i'), h(14, 'B-'), 'var(--ink)', 0)}
    ${jumper(h(8, 'h'), h(5, 'B-'), 'var(--ink)', 6)}
    ${jumper(h(9, 'h'), h(17, 'h'), '#7a7d70', 12)}
    ${resistor}${ledTop}
    ${jumper(h(23, 'i'), h(23, 'B-'), 'var(--ink)', 0)}
    <text x="${bb.hole(1, 'T+')[0]}" y="${110 - 8}" class="lbl" font-size="8.5" text-anchor="start" style="fill:var(--amber)">+5 V</text>
    <text x="${lx}" y="${ly - 28}" class="lbl" font-size="8">LED</text>
    <text x="${(r1[0] + r2[0]) / 2}" y="${r1[1] + 20}" class="lbl" font-size="8">RESISTOR</text></g>`;
  /* pin 1: a ring round the notch and the dot, shown on its own card */
  const notch = `<g data-k="notch" class="rl-notch" style="display:none">
    <circle cx="${chip.dot[0] - 3}" cy="${chip.dot[1] - 6}" r="14" fill="none" stroke="var(--ink)" stroke-width="1.6"/>
    <rect x="${chip.dot[0] - 70}" y="${chip.dot[1] - 15}" width="50" height="18" rx="9" fill="var(--ink)"/>
    <text x="${chip.dot[0] - 45}" y="${chip.dot[1] - 3}" class="lbl" font-size="9" style="fill:var(--paper-high)">PIN 1</text></g>`;

  /* the pinout: the same chip drawn large, the six inverters inside it */
  const P = { x: 402, y: 176, p: 40, W: 112 };
  const px = i => i <= 7 ? P.x + (i - .5) * P.p : P.x + (14 - i + .5) * P.p;
  let pins = '', inv = '';
  for (let i = 1; i <= 14; i++){
    const bottom = i <= 7, x = px(i);
    pins += `<rect x="${x - 6}" y="${bottom ? P.y + P.W : P.y - 12}" width="12" height="12" fill="#c9c9c0" stroke="#8e8f86" stroke-width=".8"/>
      <text x="${x}" y="${bottom ? P.y + P.W + 27 : P.y - 18}" class="lbl" font-size="9" style="fill:var(--ink)">${i}</text>`;
  }
  const gate = (inPin, outPin, bottom) => {
    const xi = px(inPin), xo = px(outPin), y = bottom ? P.y + P.W - 30 : P.y + 30;
    const edge = bottom ? P.y + P.W : P.y;
    const tx = xi + 8, tw = xo - xi - 24;
    return `<path d="M${xi} ${edge} V${y} H${tx}" fill="none" stroke="var(--ink-soft)" stroke-width="1.2"/>
      <path d="M${tx} ${y - 9} L${tx + tw} ${y} L${tx} ${y + 9} Z" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.3"/>
      <circle cx="${tx + tw + 3.5}" cy="${y}" r="3.2" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.3"/>
      <path d="M${tx + tw + 6.7} ${y} H${xo} V${edge}" fill="none" stroke="var(--ink-soft)" stroke-width="1.2"/>`;
  };
  inv += gate(1, 2, true) + gate(3, 4, true) + gate(5, 6, true) + gate(13, 12, false) + gate(11, 10, false) + gate(9, 8, false);
  const pinout = `<g data-k="pinout">
    ${pins}
    <rect x="${P.x}" y="${P.y}" width="${7 * P.p}" height="${P.W}" rx="4" fill="#f7f3e8" stroke="var(--ink)" stroke-width="1.4"/>
    <path d="M${P.x} ${P.y + P.W / 2 - 12} A12 12 0 0 1 ${P.x} ${P.y + P.W / 2 + 12}" fill="none" stroke="var(--ink)" stroke-width="1.4"/>
    ${inv}
    <text x="${px(14)}" y="${P.y - 32}" class="lbl" font-size="8.5" style="fill:var(--amber)">+5 V</text>
    <text x="${px(7)}" y="${P.y + P.W + 41}" class="lbl" font-size="8.5">GROUND</text>
    <text x="${P.x + 3.5 * P.p}" y="${P.y + P.W / 2 + 4}" class="lbl-faint" font-size="8">SIX INVERTERS</text></g>`;
  return `
    <text x="186" y="66" class="lbl" style="fill:var(--ink)">ON A BREADBOARD</text>
    <text x="542" y="66" class="lbl" style="fill:var(--ink)">INSIDE THE 74HC04</text>
    <line x1="372" y1="54" x2="372" y2="410" stroke="var(--hairline)" stroke-dasharray="3 4"/>
    ${board}${notch}${pinout}
    <text x="360" y="448" class="lbl-faint">THE CMOS INVERTER, AS IT LOOKS IN REAL LIFE</text>`;
}

/* Course restructure (2026-10-25): the closing recap ladder, modelled on Act 4's ending
   (recapLadder in js/acts/act4/step6.js). Five rungs, one per step of this act, each drawn
   in this act's own notation: blue for N-type, red for P-type, amber for the gate oxide. */
function recapLadder(){
  const g = svgEl('g');
  const W = 118, H = 118, Y = 150, X0 = 22, GAP = 22;
  const xs = [0, 1, 2, 3, 4].map(i => X0 + i * (W + GAP));
  const N = 'fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.2"';
  const P = 'fill="var(--red-soft)" stroke="var(--red)" stroke-width="1.2"';
  const box = x => `<rect x="${x}" y="${Y}" width="${W}" height="${H}" rx="5" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.3"/>`;
  const tag = i => `<text x="${xs[i] + W / 2}" y="${Y - 10}" class="lbl-faint" style="font-size:8px">STEP 1.${i + 1}</text>`;
  const cap = (i, name, lines) => `<text x="${xs[i] + W / 2}" y="${Y + H + 24}" class="lbl-strong" style="font-size:10px">${name}</text>`
    + lines.map((l, k) => `<text x="${xs[i] + W / 2}" y="${Y + H + 42 + k * 14}" class="lbl-faint" style="font-size:8px">${l}</text>`).join('');
  const arrow = i => {
    const x1 = xs[i] + W + 4, x2 = xs[i] + W + GAP - 4, y = Y + H / 2;
    return `<path d="M${x1} ${y} H${x2} M${x2 - 5} ${y - 4} L${x2} ${y} L${x2 - 5} ${y + 4}" fill="none" stroke="var(--ink-soft)" stroke-width="1.2"/>`;
  };
  const t = (x, y, s, fill = 'var(--ink)') => `<text x="${x}" y="${y}" class="lbl" style="font-size:8px;fill:${fill}">${s}</text>`;
  let html = `<text x="360" y="104" class="lbl-strong" style="font-size:11px">WHAT YOU BUILT IN ACT 1</text>
    <text x="360" y="120" class="lbl-faint" style="font-size:8px">FROM A DOPED CRYSTAL TO THE CMOS PAIR</text>`;

  /* 1.1 · doped silicon: a patch of the lattice with one donor atom and its spare electron */
  let x = xs[0];
  html += box(x);
  const cx = x + W / 2, cy = Y + H / 2 - 4, pitch = 32;
  for (let r = -1; r <= 1; r++) for (let c = -1; c <= 1; c++){
    if (c < 1) html += `<line x1="${cx + c * pitch}" y1="${cy + r * pitch}" x2="${cx + (c + 1) * pitch}" y2="${cy + r * pitch}" stroke="var(--ink-soft)" stroke-width="1"/>`;
    if (r < 1) html += `<line x1="${cx + c * pitch}" y1="${cy + r * pitch}" x2="${cx + c * pitch}" y2="${cy + (r + 1) * pitch}" stroke="var(--ink-soft)" stroke-width="1"/>`;
  }
  for (let r = -1; r <= 1; r++) for (let c = -1; c <= 1; c++){
    const mid = r === 0 && c === 0;
    html += `<circle cx="${cx + c * pitch}" cy="${cy + r * pitch}" r="9" ${mid ? N : 'fill="var(--paper)" stroke="var(--ink)" stroke-width="1.1"'}/>`;
  }
  html += `<circle cx="${cx + 14}" cy="${cy - 13}" r="2.8" fill="var(--blue)"/>`
    + tag(0) + cap(0, 'DOPED SILICON', ['ATOMS SWAPPED IN', 'TO ADD CARRIERS']);

  /* 1.2 · the barrier: P meets N, with the empty layer between them, and the diode symbol */
  x = xs[1];
  html += box(x) + `<rect x="${x + 12}" y="${Y + 22}" width="47" height="46" ${P}/>
    <rect x="${x + 59}" y="${Y + 22}" width="47" height="46" ${N}/>
    <rect x="${x + 50}" y="${Y + 22}" width="18" height="46" fill="var(--paper)" stroke="var(--ink-soft)" stroke-width=".8" stroke-dasharray="2 2"/>`
    + t(x + 30, Y + 49, 'P', 'var(--red)') + t(x + 88, Y + 49, 'N', 'var(--blue)')
    + `<path d="M${x + 22} ${Y + 92} H${x + 49} M${x + 69} ${Y + 92} H${x + 96}" stroke="var(--ink)" stroke-width="1.4"/>
    <path d="M${x + 49} ${Y + 82} L${x + 67} ${Y + 92} L${x + 49} ${Y + 102} Z" fill="var(--ink)"/>
    <path d="M${x + 69} ${Y + 82} V${Y + 102}" stroke="var(--ink)" stroke-width="2"/>`
    + tag(1) + cap(1, 'A DIODE', ['THE BARRIER', 'PASSES ONE WAY']);

  /* 1.3 · NPN: three layers, with the small base current that opens it */
  x = xs[2];
  html += box(x) + `<rect x="${x + 12}" y="${Y + 34}" width="36" height="46" ${N}/>
    <rect x="${x + 48}" y="${Y + 34}" width="22" height="46" ${P}/>
    <rect x="${x + 70}" y="${Y + 34}" width="36" height="46" ${N}/>`
    + t(x + 30, Y + 61, 'N', 'var(--blue)') + t(x + 59, Y + 61, 'P', 'var(--red)') + t(x + 88, Y + 61, 'N', 'var(--blue)')
    + `<path d="M${x + 59} ${Y + 14} V${Y + 34}" stroke="var(--ink)" stroke-width="1.4"/>
    <path d="M${x + 55} ${Y + 24} L${x + 59} ${Y + 30} L${x + 63} ${Y + 24}" fill="none" stroke="var(--ink)" stroke-width="1.2"/>
    <path d="M${x + 12} ${Y + 57} H${x + 4} M${x + 106} ${Y + 57} H${x + 114}" stroke="var(--ink)" stroke-width="1.4"/>`
    + t(x + 70, Y + 22, 'B') + t(x + 30, Y + 98, 'E') + t(x + 88, Y + 98, 'C')
    + tag(2) + cap(2, 'NPN', ['A SWITCH RUN', 'BY A CURRENT']);

  /* 1.4 · NMOS: gate metal on glass over a P body with two N patches */
  x = xs[3];
  html += box(x) + `<rect x="${x + 10}" y="${Y + 54}" width="98" height="46" ${P}/>
    <rect x="${x + 14}" y="${Y + 54}" width="28" height="18" ${N}/>
    <rect x="${x + 76}" y="${Y + 54}" width="28" height="18" ${N}/>
    <rect x="${x + 38}" y="${Y + 47}" width="42" height="7" class="oxide"/>
    <rect x="${x + 38}" y="${Y + 31}" width="42" height="16" rx="2" class="gate-metal"/>
    <path d="M${x + 59} ${Y + 14} V${Y + 31} M${x + 28} ${Y + 20} V${Y + 54} M${x + 90} ${Y + 20} V${Y + 54}" stroke="var(--ink)" stroke-width="1.4"/>`
    + t(x + 68, Y + 20, 'G') + t(x + 21, Y + 18, 'S') + t(x + 97, Y + 18, 'D')
    + t(x + 59, Y + 90, 'P', 'var(--red)')
    + tag(3) + cap(3, 'NMOS', ['A SWITCH RUN', 'BY A VOLTAGE']);

  /* 1.5 · the CMOS pair: PMOS above NMOS, one input to both gates, the output between */
  x = xs[4];
  const sx = x + 70;
  html += box(x) + `<path d="M${x + 30} ${Y + 14} H${x + 104} M${x + 30} ${Y + 104} H${x + 104}" stroke="var(--ink)" stroke-width="1.4"/>
    <path d="M${sx} ${Y + 14} V${Y + 26} M${sx} ${Y + 50} V${Y + 68} M${sx} ${Y + 92} V${Y + 104}" stroke="var(--ink)" stroke-width="1.4"/>
    <rect x="${sx - 14}" y="${Y + 26}" width="28" height="24" rx="4" fill="var(--paper)" stroke="var(--red)" stroke-width="1.4"/>
    <rect x="${sx - 14}" y="${Y + 68}" width="28" height="24" rx="4" fill="var(--paper)" stroke="var(--blue)" stroke-width="1.4"/>
    <path d="M${x + 12} ${Y + 59} H${x + 40} M${x + 40} ${Y + 38} V${Y + 80} M${x + 40} ${Y + 38} H${sx - 14} M${x + 40} ${Y + 80} H${sx - 14}" fill="none" stroke="var(--ink)" stroke-width="1.2"/>
    <path d="M${sx} ${Y + 59} H${x + 106}" stroke="var(--ink)" stroke-width="1.4"/>
    <circle cx="${sx}" cy="${Y + 59}" r="2.6" fill="var(--ink)"/>`
    + t(sx, Y + 41, 'P', 'var(--red)') + t(sx, Y + 83, 'N', 'var(--blue)')
    + t(x + 18, Y + 54, 'IN') + t(x + 96, Y + 54, 'OUT')
    + tag(4) + cap(4, 'A CMOS PAIR', ['DRAWS CURRENT ONLY', 'WHEN IT FLIPS']);

  html += [0, 1, 2, 3].map(arrow).join('');
  g.innerHTML = html;
  return g;
}

export async function step5(){
  guide.title('STEP 5 / 5', 'Why don\'t a billion transistors <em>melt?</em>');
  guide.cards();

  const stage = newStage('05', 'An NMOS transistor on the supply rails, then the same transistor paired with its PMOS twin as an inverter');
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
    const g = svgEl('g', { class: 'tile', 'data-part': kind.toLowerCase(), 'aria-label': kind + ' transistor' });
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

  /* ================= CARD 1 — the bridge from step 4 =============================
     Course restructure (2026-10-25): new first card. In steps 3 and 4 the current through
     the transistor lit the lamp; here the same current is waste. This card says why before
     the player sees the meter, so the change of sides is not a surprise. */

  const nmosA = placedMOS(DEV.bot, 'NMOS');

  guide.say(`In step 4, the current through your NMOS lit a lamp. In a chip there is no lamp.
    Each transistor's job is to set the gate of the next one high or low.`);
  stage.focus(nmosA.g, { label: 'your nmos', at: 'right' });
  await guide.next();

  /* ================= CARD 2 — the transistor on its rails ========================
     Course restructure (2026-10-25): the old "one NMOS" and "the rails" cards, merged. */

  guide.say(`Here is that NMOS, placed between two rails. The top rail carries the supply
    voltage, and the bottom rail is ground, at 0 V. A high gate joins the two rails through
    the transistor.`);
  stage.focus([railsG, nmosA.g], { label: 'power and ground', at: 'right', ring: false });
  await guide.next();

  /* ================= CARD 3 — the meter, then switch it on =======================
     Course restructure (2026-10-25): the old "meter" and "gate wire" cards, merged. */

  guide.say(`The meter in the supply wire reads all the current the battery pushes out, and
    its needle is at rest. The wire from IN sets the gate. Set it high and watch the
    needle.`);
  stage.focus([meterG, gateG], { label: 'meter and gate', at: 'bottom' });
  await guide.button('Set the gate high ▸');

  nmosA.bridge.style.opacity = '1';
  leakF.setSpeed(150);
  if (!flow.instant) SFX.flow();
  setRead('DRAWING');
  await Anim.tween(700, p => setNeedle(LEAK_LEVEL * p));

  /* ================= CARD 4 — the leak, read off the meter, and the aim ==========
     Course restructure (2026-10-25): the old "needle" and "aim" cards, merged. The aim now
     says "hold its output high or low", in line with the new premise, instead of "hold a
     value (a 0 or a 1)" before a value was defined. */

  guide.say(`The needle swung across and stayed there, because current flows the whole time
    the gate is high. In a chip, that current is wasted. <b>Your goal is to build a circuit that holds
    its output high or low and draws no current.</b>`);
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
  makeRaisedTiles(svg, tiles);
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

  /* ================= CARD 5 — define the PMOS ==================================== */

  guide.say(`Here is a PMOS: the same transistor built the other way round, so a low gate turns
    it on and a high gate turns it off.`);
  stage.focus(tiles[0].g, { label: 'pmos', at: 'left' });
  await guide.next();

  /* ================= CARD 6 — the output ========================================= */

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
  // REVIEW_NOTES N-017: point, then name, then explain (SB in AI_Writing_made_readable.md)
  // Course restructure (2026-10-25): "CMOS pair" became "pair" (CMOS is named at card 18),
  // and the 0/1 notation shrank to the bare labels. What 0s and 1s are gets its own card
  // after the inverter is named. The labels stay here because the tiles, the slot task and
  // the IN buttons use 0 and 1 from this card on.
  guide.say(`A wire comes out of the middle of the column and ends at the circle marked OUT.
    This is the output of the pair you are building. The circle lights up when the output is
    high, marked 1, and goes dark when it is low, marked 0.`);
  stage.focus(outG, { label: 'output', at: 'bottom' });
  await guide.next();

  /* REVIEW_NOTES (Ripu, 2026-10-11): the lamp is notation only. A real lamp needs current the
     whole time it is lit, which is exactly what CMOS avoids, so say plainly what the output
     really drives: the next pair's gate, the step 4 capacitor, which stores charge. */
  // REVIEW_NOTES N-111: the same point, crisper
  // Course restructure (2026-10-25): card 1 now says the output's job is the next gate, so
  // this card points back to it instead of saying it again.
  guide.say(`The lamp only stands in for the gate of the next pair, which is the capacitor
    from step 4. A high output charges that gate to the supply voltage, and a low output
    empties it to ground.`);
  stage.focus(lamp.g, { label: 'really: the next gate', at: 'left' });
  await guide.next();

  /* ================= CARD 8 — the two slots ====================================== */

  stage.clearFocus();
  await fadeOut([sTop], 200);
  // REVIEW_NOTES N-010: the input reaches BOTH slots from the moment they appear. It used to
  // show only the bottom wire until the pair was placed, which read as "the input feeds only
  // the bottom gate" and then changed under the player.
  await fadeIn([slotsG, gateTop], 300);
  guide.say(`There are two slots now, and the input wire reaches both. The top one joins the
    output to power, and the bottom one joins it to ground. One of the two transistors goes in
    each.`);
  stage.focus(slotsG, { label: 'two slots', at: 'left' });
  await guide.next();

  /* ================= CARD 9 — place the pair ====================================
     No focus on this card: stage.focus re-parents what it raises, which breaks the
     placer's pointer handling on anything it lifts. */

  stage.clearFocus();
  guide.say(`<b>Your goal is to fill both slots</b> so that an input of 0 connects the
    output up to power. Drag a twin into each slot.`);

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
  if (!flow.instant) SFX.success();

  /* ================= CARD 10 — one input, both gates ============================= */

  guide.say(`It is wired. The input on the left connects to both gates at once, so both transistors
    always read the same signal.`);
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

  /* ================= CARD 11 — exactly one conducts ============================== */

  guide.say(`The input is high right now, so the bottom transistor conducts and the top one is
    off. Exactly one of them is ever on.`);
  stage.focus([pmos.g, nmos.g], { label: 'exactly one conducts', at: 'right' });
  await guide.next();

  /* ================= CARD 12 — flip it one way =================================== */

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

  /* ================= CARD 13 — flip it back ====================================== */

  const t2 = guide.task('Now set the input to 1.');
  await flow.ask(async replay => {
    if (replay !== undefined){ setIN(replay, true); return replay; }
    cancelHint = flow.hintAfter(12000, `Press <b>IN = 1</b>. The output should go dark.`);
    await waitFor(() => OUT === 0, { hold: 400 });
    if (cancelHint){ cancelHint(); cancelHint = null; }
    return IN;
  });
  t2.done();

  /* ================= CARD 14 — name the inverter ================================= */

  guide.say(`Input 0 gave output 1. Input 1 gave output 0. The output is always the opposite
    of the input, so this pair is called an <b>inverter</b> (it inverts the input).`);
  stage.focus([pmos.g, nmos.g, outG], { label: 'inverter', at: 'top' });
  await guide.next();

  /* ================= CARD 15 — 0s and 1s (light-bulb card) =======================
     Course restructure (2026-10-25): new. It names the everyday phrase for the 1 and 0 the
     player has just set and read, and points back to the input and output wires rather than
     defining the marks a second time (card 6 gives them). */

  guide.say(`This is what people mean when they say a computer works in 0s and 1s. Each 1 or
    0 is a wire held high or low, like your input and your output. Your inverter sets one
    from the other.`);
  stage.focus([gateG, outG], { label: 'a 1 or a 0 on each wire', at: 'bottom' });
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
    each flip. Between flips, one of the two transistors is always off, so there is no path
      from power to ground.`,
    `The only current is the moment it takes to charge or empty the next gate's plate. Once
     the plate is full, the glass stops any more current.`);
  stage.focus(battG, { label: 'connected the whole time', at: 'right' });
  await guide.next();

  /* ================= CARD 18 — the name ========================================== */

  guide.say(`This pair is one N-type transistor and one P-type transistor, wired against each
    other. It is called complementary MOS, or <b>CMOS</b>.`);
  stage.focus([pmos.g, nmos.g], { label: 'cmos', at: 'right' });
  await guide.next();

  /* ================= CARD 19 — where the heat comes from ========================
     Course restructure (2026-10-25): replaces the old "back to step 3" note, which said
     again what the aha (card 17) had just said. The aha already says each flip charges or
     empties the next gate, so this card points at the needle's twitch instead of
     restating it. Most, not all, of the 700 W: some is leakage. */

  guide.say(`This is where a chip's heat comes from. Each twitch of the needle is a little
    energy drawn from the supply, and it ends up as heat in the pair. Billions of pairs flipping over and over make
    most of an AI chip's 700 watts.`);
  stage.focus(meterG, { label: 'energy per flip', at: 'right' });
  await guide.next();
  stage.clearFocus();

  /* ================= CARD 20 — the closing recap ================================
     Course restructure (2026-10-25): one ladder of everything built in Act 1, each rung
     marked with its step, on a fresh stage as in Act 4's ending. */
  const stage2 = newStage('05', 'Everything built in Act 1, from doped silicon to the CMOS pair');
  const svg2 = stage2.svg;
  svg2.appendChild(recapLadder());
  guide.say(`Here is everything you built in this act, from a doped crystal to the CMOS pair
    that every chip repeats billions of times.`);
  await guide.next();

  /* how it looks in real life (HANDOFF_NEXT.md §1) */
  const real = slideInPanel(svg2, realLifeHTML(), { lab: true });
  real.focus('board');
  await real.show();
  guide.lab(`Here is your CMOS inverter, sold as a part. The black chip is a 74HC04, pushed into
    a breadboard. Metal clips under the holes join each short row, so you can build a circuit
    without soldering.`, { intro: true });
  await guide.next();

  guide.lab(`Its input, pin 1, is wired to ground, so its output, pin 2, is high and lights
    the LED through a resistor. Move that input wire to the + rail, and the LED goes out.`);
  await guide.next();

  real.focus('pinout');
  guide.lab(`Inside are six inverters, each built from PMOS and NMOS transistors like yours. Pin
    14 takes the supply, pin 7 goes to ground, and the other twelve pins are six inputs and six
    outputs.`);
  await guide.next();

  real.g.querySelector('.rl-notch').style.display = '';
  real.focus(['board', 'notch']);
  guide.lab(`The notch at one end, and the dot beside it, mark pin 1, so you can tell which way
    round the chip goes. The pins are numbered anticlockwise from there.`);
  await guide.next();
  await real.hide();
}
