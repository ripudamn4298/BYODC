// BYODC — Act 3 "In the Lab" drawings (DESIGN.md §6d rule 8, 2026-10-19).
// Act-local helpers in the manner of js/engine/reallife.js: every builder returns an SVG
// string for slideInPanel(svg, html, { lab: true }). Parts a card talks about are wrapped in
// <g data-k="…"> so panel.focus(key) can light one and dim the rest.
//
// Colour (DESIGN.md §1a): real objects keep their real colours (silver silicon, white gowns,
// black plastic trays, tan circuit board). Blue is a good die, red a failed die, amber is heat
// or cost. Labels are ink. The lab paper and slate tag come from the panel itself.
//
// Determinism: the one scattered picture (the wafer map) is drawn from mulberry32 with a
// constant seed, so a replay draws the same map.
import { mulberry32 } from '../../engine/fab.js';
import { iso, dip } from '../../engine/reallife.js';

const f1 = v => (+v).toFixed(1);
const INK = 'var(--ink)', SOFT = 'var(--ink-soft)';
const SKIN = '#e2c7aa';
const SUIT = '#f7f6f1', SUIT_LINE = '#7d8175';
const SILVER = 'url(#a3lSilver)';

/* a label: mono microcaps, ink unless told otherwise */
const T = (x, y, txt, { cls = 'lbl', size = null, anchor = null, fill = INK } = {}) =>
  `<text x="${f1(x)}" y="${f1(y)}" class="${cls}"${size ? ` font-size="${size}"` : ''}${anchor ? ` text-anchor="${anchor}"` : ''} style="fill:${fill}">${txt}</text>`;

/* a leader: a dot on the thing, a hairline out, the words at the end */
const leader = (x1, y1, x2, y2, txt, anchor = 'start', size = 8.5) =>
  `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="var(--ink-soft)" stroke-width=".8"/>
   <circle cx="${f1(x1)}" cy="${f1(y1)}" r="1.8" fill="var(--ink)"/>
   ${T(x2 + (anchor === 'start' ? 4 : anchor === 'end' ? -4 : 0), y2 + 3, txt, { size, anchor })}`;

export const LAB_DEFS = `<defs>
  <linearGradient id="a3lSilver" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#9da19c"/><stop offset=".3" stop-color="#e3e5e1"/>
    <stop offset=".55" stop-color="#c3c7c3"/><stop offset="1" stop-color="#8e928d"/>
  </linearGradient>
  <linearGradient id="a3lWafer" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#d9dcd8"/><stop offset=".4" stop-color="#aeb3b0"/>
    <stop offset=".6" stop-color="#e4e6e2"/><stop offset="1" stop-color="#8f9490"/>
  </linearGradient>
  <pattern id="a3lHatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="4" stroke="#8d917f" stroke-width="1"/>
  </pattern>
</defs>`;

/* ---------- a person, front on ----------
   Generic and plain on purpose. x is the centre line, base the soles, h the height in px.
   suit: a cleanroom gown (hood, goggles, mask, gloves, boots), all white. hold: the forearms
   come in to the chest, for a figure carrying something the caller draws on top. */
export function person({ x, base, h, suit = true, hold = false }){
  const u = h / 100;
  const headR = 6.4 * u, hy = base - h + 7.2 * u;
  const shY = base - 81 * u, hipY = base - 47 * u, ank = base - 6 * u;
  const cloth = suit ? SUIT : '#cfc9b6', legs = suit ? SUIT : '#8f9186', line = suit ? SUIT_LINE : '#6f7367';
  const body = `M${f1(x - 4 * u)} ${f1(hy + 5 * u)} L${f1(x - 12.5 * u)} ${f1(shY + 1.5 * u)}
    Q${f1(x - 13.5 * u)} ${f1(shY + 3 * u)} ${f1(x - 12 * u)} ${f1(shY + 8 * u)} L${f1(x - 10.5 * u)} ${f1(hipY)}
    L${f1(x - 9 * u)} ${f1(ank)} L${f1(x - 1.4 * u)} ${f1(ank)} L${f1(x)} ${f1(hipY + 4 * u)} L${f1(x + 1.4 * u)} ${f1(ank)}
    L${f1(x + 9 * u)} ${f1(ank)} L${f1(x + 10.5 * u)} ${f1(hipY)} L${f1(x + 12 * u)} ${f1(shY + 8 * u)}
    Q${f1(x + 13.5 * u)} ${f1(shY + 3 * u)} ${f1(x + 12.5 * u)} ${f1(shY + 1.5 * u)} L${f1(x + 4 * u)} ${f1(hy + 5 * u)} Z`;
  /* trousers (plain figure only): the body below the hips, drawn over the shirt */
  const trousers = suit ? '' : `<path d="M${f1(x - 10.5 * u)} ${f1(hipY - 2 * u)} L${f1(x - 9 * u)} ${f1(ank)} L${f1(x - 1.4 * u)} ${f1(ank)} L${f1(x)} ${f1(hipY + 4 * u)} L${f1(x + 1.4 * u)} ${f1(ank)} L${f1(x + 9 * u)} ${f1(ank)} L${f1(x + 10.5 * u)} ${f1(hipY - 2 * u)} Z" fill="${legs}" stroke="${line}" stroke-width="1"/>`;
  const armW = 4.6 * u;
  const arm = s => hold
    ? `<path d="M${f1(x + s * 12 * u)} ${f1(shY + 2 * u)} L${f1(x + s * 14.5 * u)} ${f1(shY + 22 * u)} L${f1(x + s * 5 * u)} ${f1(shY + 28 * u)}" fill="none" stroke="${line}" stroke-width="${f1(armW + 2)}" stroke-linecap="round" stroke-linejoin="round"/>
       <path d="M${f1(x + s * 12 * u)} ${f1(shY + 2 * u)} L${f1(x + s * 14.5 * u)} ${f1(shY + 22 * u)} L${f1(x + s * 5 * u)} ${f1(shY + 28 * u)}" fill="none" stroke="${cloth}" stroke-width="${f1(armW)}" stroke-linecap="round" stroke-linejoin="round"/>
       <circle cx="${f1(x + s * 5 * u)}" cy="${f1(shY + 28 * u)}" r="${f1(2.6 * u)}" fill="${suit ? '#e9e7df' : SKIN}" stroke="${line}" stroke-width=".9"/>`
    : `<path d="M${f1(x + s * 12 * u)} ${f1(shY + 2 * u)} L${f1(x + s * 15 * u)} ${f1(hipY + 1 * u)}" fill="none" stroke="${line}" stroke-width="${f1(armW + 2)}" stroke-linecap="round"/>
       <path d="M${f1(x + s * 12 * u)} ${f1(shY + 2 * u)} L${f1(x + s * 15 * u)} ${f1(hipY + 1 * u)}" fill="none" stroke="${cloth}" stroke-width="${f1(armW)}" stroke-linecap="round"/>
       <circle cx="${f1(x + s * 15.2 * u)}" cy="${f1(hipY + 3 * u)}" r="${f1(2.6 * u)}" fill="${suit ? '#e9e7df' : SKIN}" stroke="${line}" stroke-width=".9"/>`;
  const feet = [-1, 1].map(s => suit
    ? `<rect x="${f1(x + s * 5.2 * u - 4.4 * u)}" y="${f1(base - 9 * u)}" width="${f1(8.8 * u)}" height="${f1(9 * u)}" rx="${f1(2 * u)}" fill="${SUIT}" stroke="${line}" stroke-width="1"/>
       <rect x="${f1(x + s * 5.2 * u - 4.4 * u)}" y="${f1(base - 1.6 * u)}" width="${f1(8.8 * u)}" height="${f1(1.6 * u)}" fill="#9a9d94"/>`
    : `<rect x="${f1(x + s * 5.2 * u - 4.4 * u)}" y="${f1(base - 3 * u)}" width="${f1(8.8 * u)}" height="${f1(3 * u)}" rx="${f1(1.2 * u)}" fill="#3a3d35"/>`).join('');
  const head = suit
    ? `<path d="M${f1(x - 6.5 * u)} ${f1(hy + 4 * u)} L${f1(x - 11 * u)} ${f1(shY + 5 * u)} L${f1(x + 11 * u)} ${f1(shY + 5 * u)} L${f1(x + 6.5 * u)} ${f1(hy + 4 * u)} Z" fill="${SUIT}" stroke="${line}" stroke-width="1"/>
       <ellipse cx="${f1(x)}" cy="${f1(hy)}" rx="${f1(headR * 1.18)}" ry="${f1(headR * 1.3)}" fill="${SUIT}" stroke="${line}" stroke-width="1"/>
       <rect x="${f1(x - 4.8 * u)}" y="${f1(hy - 3.4 * u)}" width="${f1(9.6 * u)}" height="${f1(8 * u)}" rx="${f1(2.2 * u)}" fill="${SKIN}"/>
       <rect x="${f1(x - 5 * u)}" y="${f1(hy - 3 * u)}" width="${f1(10 * u)}" height="${f1(3.4 * u)}" rx="${f1(1.4 * u)}" fill="#bfc6c2" stroke="#6f7367" stroke-width=".9"/>
       <rect x="${f1(x - 4.8 * u)}" y="${f1(hy + .8 * u)}" width="${f1(9.6 * u)}" height="${f1(4 * u)}" rx="${f1(1.4 * u)}" fill="#ffffff" stroke="${line}" stroke-width=".8"/>`
    : `<circle cx="${f1(x)}" cy="${f1(hy)}" r="${f1(headR)}" fill="${SKIN}" stroke="#6f7367" stroke-width="1"/>
       <path d="M${f1(x - headR)} ${f1(hy - .5 * u)} A${f1(headR)} ${f1(headR)} 0 0 1 ${f1(x + headR)} ${f1(hy - .5 * u)} Q${f1(x)} ${f1(hy - 3 * u)} ${f1(x - headR)} ${f1(hy - .5 * u)} Z" fill="#5b5243"/>`;
  return `<g>
    <ellipse cx="${f1(x)}" cy="${f1(base + 1)}" rx="${f1(13 * u)}" ry="${f1(1.6 * u)}" fill="rgba(29,33,23,.14)"/>
    ${feet}
    <path d="${body}" fill="${cloth}" stroke="${line}" stroke-width="1" stroke-linejoin="round"/>
    ${trousers}
    ${suit ? `<line x1="${f1(x)}" y1="${f1(shY + 5 * u)}" x2="${f1(x)}" y2="${f1(hipY + 2 * u)}" stroke="${line}" stroke-width=".7" stroke-dasharray="2 2"/>` : ''}
    ${arm(-1)}${arm(1)}${head}
  </g>`;
}

/* ================================ 3.1 ================================ */

/* The ingot drawn to scale beside a person, at 160 px per metre: 1.6 m of body (the length
   the step uses), a cone of about 0.15 m at the seed end and a tail of about 0.2 m, so close
   to 2 m in all. The person is 1.75 m. The wafer stands beside them at the same scale. */
export function ingotScaleHTML(){
  const PXM = 160, FLOOR = 424;
  const IX = 410, W = 0.3 * PXM;                     // ingot centre line, 48 px across
  const top = 104, neck = 10, cone = 0.15 * PXM, bodyL = 1.6 * PXM, tail = 0.2 * PXM;
  const y1 = top + neck, y2 = y1 + cone, y3 = y2 + bodyL, y4 = y3 + tail;
  const ingot = `M${IX - 3} ${top} H${IX + 3} V${y1} L${IX + W / 2} ${y2} V${y3} L${IX + 3} ${y4} H${IX - 3} L${IX - W / 2} ${y3} V${y2} L${IX - 3} ${y1} Z`;
  /* the scale bar: 0, 1 and 2 m up from the floor */
  const SB = 92;
  const bar = [0, 1, 2].map(m => `<line x1="${SB - 6}" y1="${FLOOR - m * PXM}" x2="${SB + 6}" y2="${FLOOR - m * PXM}" stroke="var(--ink)" stroke-width="1.2"/>
    ${T(SB - 10, FLOOR - m * PXM + 3, `${m} M`, { anchor: 'end', size: 8.5 })}`).join('');
  return `${LAB_DEFS}
    ${T(360, 66, 'THE INGOT YOU GREW, DRAWN TO SCALE BESIDE A PERSON')}
    <line x1="40" y1="${FLOOR}" x2="680" y2="${FLOOR}" stroke="var(--hairline-strong)" stroke-width="1.2"/>
    <line x1="${SB}" y1="${FLOOR}" x2="${SB}" y2="${FLOOR - 2 * PXM}" stroke="var(--ink-soft)" stroke-width="1"/>${bar}
    <g data-k="person">
      ${person({ x: 214, base: FLOOR, h: 1.75 * PXM, suit: false })}
      ${T(214, FLOOR + 18, 'A PERSON, 1.75 M', { size: 8.5 })}
    </g>
    <g data-k="ingot">
      <line x1="${IX}" y1="84" x2="${IX}" y2="${top}" stroke="var(--ink)" stroke-width="2"/>
      <path d="M${IX - 6} 84 H${IX + 6}" stroke="var(--ink)" stroke-width="3"/>
      <path d="${ingot}" fill="${SILVER}" stroke="#7d807a" stroke-width="1"/>
      <line x1="${IX - W / 2 + 8}" y1="${y2 + 6}" x2="${IX - W / 2 + 8}" y2="${y3 - 6}" stroke="#fff" stroke-width="2.4" opacity=".55"/>
      <path d="M${IX + W / 2 + 12} ${top} h6 V${y4} h-6" fill="none" stroke="var(--ink-soft)" stroke-width="1"/>
      ${T(IX + W / 2 + 26, (top + y4) / 2 - 6, 'CLOSE TO 2 M', { anchor: 'start' })}
      ${T(IX + W / 2 + 26, (top + y4) / 2 + 8, 'IN ALL', { anchor: 'start', cls: 'lbl-faint', size: 8.5, fill: 'var(--ink-faint)' })}
      ${leader(IX + 10, y1 + cone / 2, IX + 100, y1 - 4, 'CONE AT THE SEED END')}
      ${leader(IX + 16, y2 + 70, IX + 100, y2 + 46, 'BODY, 1.6 M')}
      ${leader(IX + 8, y3 + tail / 2, IX + 100, y3 + 10, 'TAIL')}
      ${T(IX, FLOOR + 18, '300 MM ACROSS, ABOUT 265 KG', { size: 8.5 })}
    </g>
    <g data-k="wafer">
      <circle cx="620" cy="${FLOOR - 25}" r="24" fill="url(#a3lWafer)" stroke="#7d807a" stroke-width="1"/>
      <path d="M617 ${FLOOR - 1.5} l3 -3 l3 3" fill="#f2ecdc" stroke="#7d807a" stroke-width=".8"/>
      ${T(620, FLOOR - 58, 'ONE WAFER', { size: 8.5 })}
      ${T(620, FLOOR + 18, 'SLICED FROM IT', { size: 8.5 })}
    </g>`;
}

/* a FOUP, drawn with iso(): a smoky see-through shell with its 25 wafers inside, a darker
   front door, and the flange on top that the overhead track grips */
function foup(ox, oy, k = 1){
  const F = iso(k, ox, oy);
  const shell = { top: 'rgba(160,156,146,.42)', x: 'rgba(140,136,126,.42)', y: 'rgba(120,116,106,.5)', stroke: '#6f7367' };
  const door = { top: '#a8a59b', x: '#9a978d', y: '#8c897f', stroke: '#5f625a' };
  const flange = { top: '#b9b6ac', x: '#a7a49a', y: '#97948a', stroke: '#5f625a' };
  let out = F.box(0, 0, 0, 100, 90, 84, shell, { sw: 1.1 });
  /* wafers seen through the +x face: 25 thin lines stacked up the box */
  for (let i = 0; i < 25; i++){
    const z = 8 + i * 2.8;
    const [ax, ay] = F.P(100, 8, z), [bx, by] = F.P(100, 82, z);
    out += `<line x1="${f1(ax)}" y1="${f1(ay)}" x2="${f1(bx)}" y2="${f1(by)}" stroke="#8a8f8b" stroke-width=".8" opacity=".9"/>`;
  }
  out += F.box(0, 90, 0, 100, 4, 84, door, { sw: 1.1 });            // the door, on the +y face
  out += F.box(30, 30, 84, 40, 30, 6, flange, { sw: 1 });            // the top flange
  out += F.box(38, 38, 90, 24, 14, 3, flange, { sw: 1 });
  return out;
}

/* an open cassette from the side at a slant: two rails and the wafers standing in their slots */
function cassette(cx, cy, { n = 25, r = 28, gap = 4.2, scale = 1 } = {}){
  const w = (n - 1) * gap;
  let wafers = '';
  for (let i = 0; i < n; i++){
    const x = cx - w / 2 + i * gap;
    wafers += `<ellipse cx="${f1(x)}" cy="${f1(cy)}" rx="${f1(r * .3)}" ry="${f1(r)}" fill="url(#a3lWafer)" stroke="#7d807a" stroke-width=".6"/>`;
  }
  const frame = `
    <path d="M${f1(cx - w / 2 - 12)} ${f1(cy - r * .2)} V${f1(cy + r + 6)} H${f1(cx + w / 2 + 12)} V${f1(cy - r * .2)}" fill="none" stroke="#7a7466" stroke-width="3" stroke-linejoin="round"/>
    <path d="M${f1(cx - w / 2 - 12)} ${f1(cy + r * .55)} H${f1(cx + w / 2 + 12)}" stroke="#7a7466" stroke-width="2.4"/>
    ${Array.from({ length: n + 1 }, (_, i) => `<line x1="${f1(cx - w / 2 - gap / 2 + i * gap)}" y1="${f1(cy + r * .55 - 3)}" x2="${f1(cx - w / 2 - gap / 2 + i * gap)}" y2="${f1(cy + r * .55 + 3)}" stroke="#7a7466" stroke-width=".8"/>`).join('')}`;
  return `<g${scale !== 1 ? ` transform="translate(${f1(cx * (1 - scale))} ${f1(cy * (1 - scale))}) scale(${scale})"` : ''}>
    <path d="M${f1(cx - w / 2 - 12)} ${f1(cy + r + 6)} V${f1(cy - r * .2)}" stroke="#a49d8c" stroke-width="5" opacity=".5"/>
    ${wafers}${frame}</g>`;
}

/* A cleanroom as a student sees it: filtered air falling from the ceiling, two people in
   gowns, one carrying a cassette, a bench with a microscope; on the right, the two carriers. */
export function cleanroomHTML(){
  const FLOOR = 410, CEIL = 84;
  let filters = '', arrows = '', grate = '';
  for (let i = 0; i < 5; i++){
    const x = 40 + i * 82;
    filters += `<rect x="${x}" y="${CEIL}" width="76" height="12" fill="#e9e6dc" stroke="#8d917f" stroke-width="1"/>
      ${Array.from({ length: 9 }, (_, k) => `<line x1="${x + 6 + k * 8}" y1="${CEIL + 2}" x2="${x + 6 + k * 8}" y2="${CEIL + 10}" stroke="#b3b09f" stroke-width=".8"/>`).join('')}`;
  }
  for (let x = 56; x < 440; x += 54){
    arrows += `<line x1="${x}" y1="${CEIL + 22}" x2="${x}" y2="${FLOOR - 14}" stroke="var(--ink-faint)" stroke-width="1" stroke-dasharray="3 6"/>
      <path d="M${x - 4} ${FLOOR - 20} l4 6 l4 -6" fill="none" stroke="var(--ink-faint)" stroke-width="1.1"/>`;
  }
  for (let x = 36; x < 448; x += 12) grate += `<rect x="${x}" y="${FLOOR + 3}" width="7" height="4" fill="#b3b09f"/>`;
  /* the bench, drawn after the second person so it hides their legs */
  const bench = `
    <rect x="236" y="298" width="196" height="10" fill="#d8d4c6" stroke="#7d8175" stroke-width="1"/>
    <rect x="244" y="308" width="180" height="${FLOOR - 308}" fill="#e6e2d4" stroke="#7d8175" stroke-width="1"/>
    <line x1="244" y1="340" x2="424" y2="340" stroke="#b3b09f" stroke-width="1"/>
    <rect x="380" y="282" width="34" height="16" rx="2" fill="#5a5d55"/>
    <path d="M404 282 V238 Q404 230 396 230 H384" fill="none" stroke="#5a5d55" stroke-width="6" stroke-linecap="round"/>
    <rect x="372" y="222" width="16" height="30" rx="3" fill="#6f7268" transform="rotate(-18 380 237)"/>
    <rect x="388" y="262" width="12" height="6" fill="#8d917f"/>`;
  // Course restructure (2026-10-25): the FOUP card is cut from 3.1, so the "how wafers travel"
  // column is gone and the cleanroom sits in the middle of the panel
  return `${LAB_DEFS}<g transform="translate(120 0)">
    ${T(240, 66, 'A CLEANROOM')}
    <g data-k="air">
      ${filters}${arrows}
      <line x1="34" y1="${FLOOR}" x2="448" y2="${FLOOR}" stroke="var(--hairline-strong)" stroke-width="1.2"/>${grate}
      ${T(240, 124, 'FILTERED AIR FALLS FROM THE CEILING', { size: 8.5 })}
      ${T(240, FLOOR + 22, 'AND LEAVES THROUGH THE FLOOR', { size: 8.5 })}
    </g>
    <g data-k="suit">
      ${person({ x: 112, base: FLOOR, h: 236, hold: true })}
      ${person({ x: 312, base: FLOOR, h: 228 })}
      ${bench}
      ${leader(126, 180, 150, 154, 'GOWN, HOOD, GOGGLES, MASK, GLOVES, BOOTS')}
      ${cassette(112, 260, { n: 12, r: 13, gap: 2.6 })}
    </g></g>`;
}

/* ================================ 3.2 ================================ */

/* The lithography room of a university cleanroom, three stations left to right in the order
   of the loop: spin coater and hotplate (coat), mask aligner (expose), developer dish
   (develop). Yellow tubes light the room. The resist is drawn its real red-brown. */
export function lithoLabHTML(){
  const FLOOR = 412;
  let tubes = '';
  for (let i = 0; i < 4; i++) tubes += `<rect x="${52 + i * 166}" y="84" width="120" height="7" rx="3.5" fill="#efdd7c" stroke="#b9a34a" stroke-width=".8"/>`;
  const room = `<rect x="30" y="80" width="660" height="${FLOOR - 80}" fill="rgba(239,221,124,.14)"/>
    <g data-k="room">
    ${tubes}
    ${T(360, 108, 'THE ROOM IS LIT YELLOW, SO THE RESIST IS NOT EXPOSED BY ACCIDENT', { size: 8.5 })}
  </g>`;

  /* spin coater: a cabinet, a catch bowl, the chuck and wafer, a pipette, a spin arrow */
  const SC = { x: 44, w: 132, top: 300, cx: 110 };
  const spin = `<g data-k="spin">
    <rect x="${SC.x}" y="${SC.top}" width="${SC.w}" height="${FLOOR - SC.top}" rx="4" fill="#dcd8ca" stroke="#7d8175" stroke-width="1"/>
    <rect x="${SC.x + 14}" y="${SC.top + 22}" width="58" height="22" rx="2" fill="#2f322b"/>
    ${T(SC.x + 43, SC.top + 37, '4000 RPM', { size: 8, fill: '#d9d6c9' })}
    <circle cx="${SC.x + 92}" cy="${SC.top + 33}" r="6" fill="#9a9d94" stroke="#5f625a"/>
    <circle cx="${SC.x + 112}" cy="${SC.top + 33}" r="6" fill="#9a9d94" stroke="#5f625a"/>
    <ellipse cx="${SC.cx}" cy="${SC.top}" rx="60" ry="16" fill="#bcb8aa" stroke="#6f7367" stroke-width="1.2"/>
    <ellipse cx="${SC.cx}" cy="${SC.top - 2}" rx="50" ry="12" fill="#8d8a7e"/>
    <ellipse cx="${SC.cx}" cy="${SC.top - 6}" rx="38" ry="8" fill="url(#a3lWafer)" stroke="#7d807a" stroke-width=".8"/>
    <ellipse cx="${SC.cx}" cy="${SC.top - 6}" rx="22" ry="4.6" fill="rgba(170,92,52,.55)"/>
    <path d="M${SC.cx - 46} ${SC.top - 22} A46 12 0 0 1 ${SC.cx + 46} ${SC.top - 22}" fill="none" stroke="var(--ink)" stroke-width="1.2"/>
    <path d="M${SC.cx + 46} ${SC.top - 22} l-8 -4 m8 4 l-7 5" fill="none" stroke="var(--ink)" stroke-width="1.2"/>
    <rect x="${SC.cx - 3}" y="${SC.top - 96}" width="6" height="44" rx="2" fill="rgba(255,255,255,.7)" stroke="#6f7367" stroke-width=".8"/>
    <rect x="${SC.cx - 7}" y="${SC.top - 118}" width="14" height="22" rx="4" fill="#cfc9b6" stroke="#6f7367" stroke-width=".8"/>
    <path d="M${SC.cx} ${SC.top - 46} q-3 5 0 7 q3 -2 0 -7 z" fill="rgba(170,92,52,.75)"/>
    ${leader(SC.cx + 4, SC.top - 76, SC.cx + 40, SC.top - 92, 'RESIST')}
    ${leader(SC.cx + 30, SC.top - 6, SC.cx + 56, SC.top - 40, 'WAFER')}
    <rect x="184" y="358" width="50" height="${FLOOR - 358}" rx="3" fill="#dcd8ca" stroke="#7d8175" stroke-width="1"/>
    <rect x="180" y="350" width="58" height="9" rx="2" fill="#c9c6bb" stroke="#6f7367" stroke-width="1"/>
    ${T(209, 384, '115 °C', { size: 8.5, fill: 'var(--amber)' })}
    ${T(209, 338, 'HOTPLATE', { size: 8 })}
  </g>`;

  /* mask aligner: cabinet, stage with knobs, wafer on its chuck, mask in its holder, the
   lamp house overhead on a column at the back, the microscope at the front */
  const A = { x: 262, w: 236, cx: 380 };
  const aligner = `<g data-k="aligner">
    <rect x="${A.x + 4}" y="128" width="20" height="214" fill="#b9b6ac" stroke="#6f7367" stroke-width="1"/>
    <rect x="${A.cx - 84}" y="128" width="164" height="64" rx="5" fill="#d9d5c7" stroke="#6f7367" stroke-width="1.1"/>
    ${T(A.cx - 2, 156, 'UV LAMP', { size: 8.5 })}
    ${T(A.cx - 2, 170, '365 NM', { size: 8, cls: 'lbl-faint', fill: 'var(--ink-soft)' })}
    <rect x="${A.cx - 44}" y="192" width="88" height="10" fill="#b9b6ac" stroke="#6f7367" stroke-width="1"/>
    ${[-30, -12, 6, 24].map(o => `<line x1="${A.cx + o}" y1="206" x2="${A.cx + o}" y2="262" stroke="#8a7fc0" stroke-width="1" stroke-dasharray="3 4" opacity=".8"/>`).join('')}
    <rect x="${A.x}" y="338" width="${A.w}" height="${FLOOR - 338}" rx="4" fill="#dcd8ca" stroke="#7d8175" stroke-width="1"/>
    <rect x="${A.cx - 86}" y="312" width="172" height="26" rx="3" fill="#c9c6bb" stroke="#6f7367" stroke-width="1"/>
    ${[['X', -60], ['Y', 0], ['θ', 60]].map(([n, o]) => `<circle cx="${A.cx + o}" cy="325" r="7" fill="#9a9d94" stroke="#5f625a"/>${T(A.cx + o, 352, n, { size: 8.5 })}`).join('')}
    <ellipse cx="${A.cx}" cy="306" rx="62" ry="9" fill="#a9a69c" stroke="#6f7367" stroke-width="1"/>
    <ellipse cx="${A.cx}" cy="302" rx="48" ry="7" fill="url(#a3lWafer)" stroke="#7d807a" stroke-width=".8"/>
    <rect x="${A.cx - 70}" y="270" width="140" height="10" rx="2" fill="#9a9d94" stroke="#5f625a" stroke-width="1"/>
    <rect x="${A.cx - 52}" y="271" width="104" height="8" fill="rgba(220,226,226,.85)"/>
    ${[-44, -30, -16, -2, 12, 26, 40].map(o => `<rect x="${A.cx + o}" y="272" width="7" height="6" fill="#3a3d35"/>`).join('')}
    <rect x="${A.cx + 58}" y="212" width="34" height="28" rx="4" fill="#6f7268"/>
    <rect x="${A.cx + 64}" y="240" width="10" height="26" fill="#5a5d55"/>
    <line x1="${A.cx + 82}" y1="214" x2="${A.cx + 96}" y2="198" stroke="#5a5d55" stroke-width="5" stroke-linecap="round"/>
    <line x1="${A.cx + 90}" y1="218" x2="${A.cx + 106}" y2="204" stroke="#5a5d55" stroke-width="5" stroke-linecap="round"/>
    ${leader(A.cx - 66, 275, A.cx - 92, 254, 'MASK', 'end')}
    ${leader(A.cx + 92, 230, A.cx + 140, 230, 'MICROSCOPE')}
    <circle cx="${A.cx + 200}" cy="170" r="26" fill="#f6f4ec" stroke="var(--ink)" stroke-width="1.2"/>
    <rect x="${A.cx + 190}" y="160" width="20" height="20" fill="none" stroke="var(--ink)" stroke-width="1.4"/>
    <path d="M${A.cx + 200} 163 V177 M${A.cx + 193} 170 H${A.cx + 207}" stroke="var(--ink)" stroke-width="2"/>
    <line x1="${A.cx + 176}" y1="178" x2="${A.cx + 106}" y2="202" stroke="var(--ink-soft)" stroke-width=".8" stroke-dasharray="2 3"/>
    ${T(A.cx + 200, 134, 'ALIGNMENT MARKS', { size: 8 })}
    ${T(A.cx, 376, 'MASK ALIGNER', { size: 9 })}
    ${T(A.cx, 390, 'PRINTS THE MASK AT FULL SIZE,', { size: 8, cls: 'lbl-faint', fill: 'var(--ink-soft)' })}
    ${T(A.cx, 402, 'LINES DOWN TO ABOUT 1 µM', { size: 8, cls: 'lbl-faint', fill: 'var(--ink-soft)' })}
  </g>`;

  /* develop: a bench, a glass dish of developer, the wafer in tweezers, a bottle, a timer */
  const D = { cx: 604, top: 338 };
  const develop = `<g data-k="develop">
    <rect x="524" y="${D.top}" width="166" height="${FLOOR - D.top}" fill="#e6e2d4" stroke="#7d8175" stroke-width="1"/>
    <path d="M${D.cx - 56} ${D.top - 22} V${D.top - 4} Q${D.cx - 56} ${D.top + 2} ${D.cx - 48} ${D.top + 2} H${D.cx + 48} Q${D.cx + 56} ${D.top + 2} ${D.cx + 56} ${D.top - 4} V${D.top - 22}" fill="rgba(214,230,232,.55)" stroke="#7d8a8c" stroke-width="1.1"/>
    <ellipse cx="${D.cx}" cy="${D.top - 22}" rx="56" ry="9" fill="rgba(214,230,232,.7)" stroke="#7d8a8c" stroke-width="1.1"/>
    <ellipse cx="${D.cx}" cy="${D.top - 14}" rx="50" ry="7" fill="rgba(190,214,218,.8)"/>
    <ellipse cx="${D.cx - 6}" cy="${D.top - 14}" rx="30" ry="5" fill="url(#a3lWafer)" stroke="#7d807a" stroke-width=".7"/>
    <path d="M${D.cx + 18} ${D.top - 15} L${D.cx + 64} ${D.top - 92} M${D.cx + 22} ${D.top - 13} L${D.cx + 70} ${D.top - 90}" stroke="#7d807a" stroke-width="2.2" stroke-linecap="round"/>
    <rect x="652" y="${D.top - 70}" width="26" height="48" rx="4" fill="rgba(240,238,230,.9)" stroke="#6f7367" stroke-width="1"/>
    <rect x="658" y="${D.top - 80}" width="14" height="10" fill="#5a5d55"/>
    ${T(665, D.top - 42, 'DEV', { size: 7 })}
    <rect x="534" y="${D.top - 66}" width="40" height="22" rx="3" fill="#2f322b"/>
    ${T(554, D.top - 51, '0:50', { size: 9, fill: '#d9d6c9' })}
    ${T(D.cx, D.top + 26, 'DEVELOPER DISH', { size: 9 })}
  </g>`;

  return `${LAB_DEFS}
    ${T(360, 66, 'THE LITHOGRAPHY ROOM OF A UNIVERSITY CLEANROOM')}
    ${room}
    <line x1="30" y1="${FLOOR}" x2="690" y2="${FLOOR}" stroke="var(--hairline-strong)" stroke-width="1.2"/>
    ${spin}${aligner}${develop}
    ${T(140, 436, '1  COAT', { size: 9 })}
    ${T(380, 436, '2  ALIGN AND EXPOSE', { size: 9 })}
    ${T(604, 436, '3  DEVELOP', { size: 9 })}`;
}

/* ================================ 3.3 ================================ */

/* An automatic wafer prober from the side, and a magnified view of one die with a needle on
   every pad. Pads are drawn silver (aluminium), needles grey (tungsten), the probe card tan. */
export function proberHTML(){
  const WY = 312, WX = 190;
  let needles = '';
  for (let k = 0; k < 9; k++){
    const x0 = 150 + k * 10, xt = WX - 6 + k * 1.5;
    needles += `<line x1="${x0}" y1="274" x2="${f1(xt)}" y2="${WY - 6}" stroke="#7d7f78" stroke-width=".9"/>`;
  }
  const machine = `<g data-k="prober">
    <rect x="52" y="342" width="280" height="76" rx="4" fill="#dcd8ca" stroke="#7d8175" stroke-width="1"/>
    <rect x="108" y="${WY + 6}" width="164" height="24" rx="2" fill="#c9c6bb" stroke="#6f7367" stroke-width="1"/>
    <path d="M118 ${WY + 18} H262" stroke="#8d917f" stroke-width="1" stroke-dasharray="6 4"/>
    <ellipse cx="${WX}" cy="${WY + 2}" rx="84" ry="10" fill="#a9a69c" stroke="#6f7367" stroke-width="1"/>
    <ellipse cx="${WX}" cy="${WY - 2}" rx="76" ry="8" fill="url(#a3lWafer)" stroke="#7d807a" stroke-width=".8"/>
    <rect x="78" y="262" width="224" height="12" rx="2" fill="#c7b48a" stroke="#8a7650" stroke-width="1"/>
    <rect x="${WX - 22}" y="262" width="44" height="12" fill="#efe9d8" stroke="#8a7650" stroke-width=".8"/>
    ${needles}
    <rect x="92" y="164" width="196" height="80" rx="5" fill="#5a5d55" stroke="#3a3d35" stroke-width="1"/>
    ${T(190, 200, 'TEST HEAD', { size: 9, fill: '#e6e2d4' })}
    ${T(190, 216, 'SENDS THE TEST', { size: 8, fill: '#c9c6bb' })}
    ${[110, 140, 240, 270].map(x => `<rect x="${x}" y="244" width="8" height="18" fill="#8d917f"/>`).join('')}
    <path d="M288 190 C320 190 320 140 350 120" fill="none" stroke="#3a3d35" stroke-width="5" stroke-linecap="round"/>
    ${leader(298, 268, 330, 282, 'PROBE CARD')}
    ${leader(124, WY - 2, 104, 292, 'WAFER', 'end')}
    ${T(190, 384, 'THE CHUCK MOVES THE WAFER', { size: 8.5 })}
    ${T(190, 398, 'ONE DIE AT A TIME', { size: 8.5 })}
  </g>`;

  /* the magnified die: neighbours' edges, pads round the edge, needles coming in from outside */
  const C = { x: 532, y: 236, r: 140 }, S = 150, d0x = C.x - S / 2, d0y = C.y - S / 2;
  let pads = '', pins = '';
  const n = 8, pad = 10, step = (S - 24) / (n - 1);
  for (let i = 0; i < n; i++){
    const t = 12 + i * step;
    const P = [[d0x + t, d0y + 9, 0, -1], [d0x + t, d0y + S - 9, 0, 1], [d0x + 9, d0y + t, -1, 0], [d0x + S - 9, d0y + t, 1, 0]];
    for (const [px, py, dx, dy] of P){
      pads += `<rect x="${f1(px - pad / 2)}" y="${f1(py - pad / 2)}" width="${pad}" height="${pad}" fill="#d6d8d4" stroke="#8a8d87" stroke-width=".8"/>`;
      /* a needle: long and thin from beyond the circle, angled a little, its tip on the pad */
      const ex = px + dx * 170 + (dy ? (i - 3.5) * 9 : 0), ey = py + dy * 170 + (dx ? (i - 3.5) * 9 : 0);
      pins += `<path d="M${f1(ex)} ${f1(ey)} L${f1(px)} ${f1(py)}" stroke="#7d7f78" stroke-width="1.6" stroke-linecap="round"/>
        <circle cx="${f1(px)}" cy="${f1(py)}" r="1.6" fill="#55594d"/>`;
    }
  }
  const zoom = `<g data-k="needles">
    <defs><clipPath id="a3lProbeClip"><circle cx="${C.x}" cy="${C.y}" r="${C.r - 3}"/></clipPath></defs>
    <line x1="${WX}" y1="${WY - 6}" x2="${C.x - C.r * .94}" y2="${C.y - C.r * .34}" stroke="var(--ink-soft)" stroke-width=".8" stroke-dasharray="3 4"/>
    <line x1="${WX}" y1="${WY - 6}" x2="${C.x - C.r * .9}" y2="${C.y + C.r * .44}" stroke="var(--ink-soft)" stroke-width=".8" stroke-dasharray="3 4"/>
    <circle cx="${WX}" cy="${WY - 6}" r="5" fill="none" stroke="var(--ink)" stroke-width="1.2"/>
    <g clip-path="url(#a3lProbeClip)">
      <rect x="${C.x - C.r}" y="${C.y - C.r}" width="${2 * C.r}" height="${2 * C.r}" fill="#c3c7c3"/>
      ${[-1, 0, 1].map(i => [-1, 0, 1].map(j => `<rect x="${d0x + i * (S + 10)}" y="${d0y + j * (S + 10)}" width="${S}" height="${S}" fill="#b5bab6" stroke="#9a9f9b" stroke-width="1"/>`).join('')).join('')}
      <rect x="${d0x}" y="${d0y}" width="${S}" height="${S}" fill="#cdd1cd" stroke="#6f7367" stroke-width="1.2"/>
      <rect x="${d0x + 22}" y="${d0y + 22}" width="${S - 44}" height="${S - 44}" fill="url(#a3lHatch)" opacity=".35"/>
      ${pads}${pins}
    </g>
    <circle cx="${C.x}" cy="${C.y}" r="${C.r}" fill="none" stroke="var(--ink)" stroke-width="4"/>
    ${T(C.x, C.y + C.r + 24, 'ONE DIE, MAGNIFIED: A NEEDLE ON EVERY PAD', { size: 8.5 })}
  </g>`;
  return `${LAB_DEFS}
    ${T(190, 66, 'A WAFER PROBER, FROM THE SIDE')}
    ${machine}${zoom}`;
}

/* The wafer map (good dies blue, failed dies red, the part dies at the edge grey) beside a
   manual probe station of the kind a university device lab has. Returns the html and the
   list of dies in scan order, so the step can fill the map in as the prober would. */
export function waferMapHTML(){
  const C = { x: 196, y: 238, r: 148 }, S = 21, G = 1.5;
  const rng = mulberry32(3303);
  const dies = [];
  let rects = '';
  for (let j = -7; j <= 6; j++) for (let i = -7; i <= 6; i++){
    const x = C.x + i * (S + G) + G / 2, y = C.y + j * (S + G) + G / 2;
    const far = Math.max(...[[x, y], [x + S, y], [x, y + S], [x + S, y + S]].map(([a, b]) => Math.hypot(a - C.x, b - C.y)));
    const near = Math.min(...[[x, y], [x + S, y], [x, y + S], [x + S, y + S]].map(([a, b]) => Math.hypot(a - C.x, b - C.y)));
    if (near > C.r - 4) continue;
    const whole = far < C.r - 6;
    const rad = Math.hypot(x + S / 2 - C.x, y + S / 2 - C.y) / C.r;
    const bad = whole && rng() < 0.05 + 0.22 * rad * rad;     // more failures towards the edge
    const id = dies.length;
    dies.push({ id, state: whole ? (bad ? 'defect' : 'good') : 'edge' });
    rects += `<rect class="die${whole ? '' : ' edge'}" data-die="${id}" x="${f1(x)}" y="${f1(y)}" width="${S}" height="${S}" rx="1.5"/>`;
  }
  const good = dies.filter(d => d.state === 'good').length, bad = dies.filter(d => d.state === 'defect').length;
  const map = `<g data-k="map">
    <defs><clipPath id="a3lMapClip"><circle cx="${C.x}" cy="${C.y}" r="${C.r}"/></clipPath></defs>
    <circle cx="${C.x}" cy="${C.y}" r="${C.r}" fill="#eceee9" stroke="var(--ink)" stroke-width="1.4"/>
    <g clip-path="url(#a3lMapClip)">${rects}</g>
    <path d="M${C.x - 5} ${C.y + C.r} l5 -6 l5 6" fill="var(--lab-paper)" stroke="var(--ink)" stroke-width="1"/>
    <rect x="${C.x - 112}" y="${C.y + C.r + 18}" width="12" height="12" class="die good"/>
    ${T(C.x - 94, C.y + C.r + 28, `GOOD: ${good}`, { anchor: 'start', size: 8.5 })}
    <rect x="${C.x + 10}" y="${C.y + C.r + 18}" width="12" height="12" class="die defect"/>
    ${T(C.x + 28, C.y + C.r + 28, `FAILED: ${bad}`, { anchor: 'start', size: 8.5 })}
  </g>`;

  /* manual probe station: a base, a round chuck, three positioners with arms and needles,
     a microscope on a column at the back */
  const M = { cx: 556, chuckY: 336 };
  const positioner = (bx, by, tx, ty, name, flip = false) => `
    <rect x="${bx - 20}" y="${by - 16}" width="40" height="30" rx="3" fill="#b9b6ac" stroke="#6f7367" stroke-width="1"/>
    <circle cx="${bx + (flip ? -26 : 26)}" cy="${by - 6}" r="6" fill="#9a9d94" stroke="#5f625a"/>
    <circle cx="${bx}" cy="${by - 24}" r="6" fill="#9a9d94" stroke="#5f625a"/>
    <path d="M${bx} ${by - 8} L${f1(tx + (bx < tx ? -10 : 10))} ${f1(ty - 12)}" stroke="#7d8175" stroke-width="4" stroke-linecap="round"/>
    <path d="M${f1(tx + (bx < tx ? -10 : 10))} ${f1(ty - 12)} L${tx} ${ty}" stroke="#55594d" stroke-width="1.3"/>
    ${T(tx + (bx < tx ? -12 : 12), ty + 22, name, { size: 9 })}`;
  const manual = `<g data-k="manual">
    <rect x="410" y="372" width="292" height="26" rx="3" fill="#c9c6bb" stroke="#6f7367" stroke-width="1"/>
    <rect x="664" y="132" width="18" height="240" fill="#b9b6ac" stroke="#6f7367" stroke-width="1"/>
    <path d="M664 150 H${M.cx + 30}" stroke="#9a9d94" stroke-width="12"/>
    <rect x="${M.cx - 26}" y="140" width="52" height="56" rx="5" fill="#6f7268"/>
    <rect x="${M.cx - 8}" y="196" width="16" height="42" fill="#5a5d55"/>
    <path d="M${M.cx - 20} 140 L${M.cx - 34} 118 M${M.cx - 6} 140 L${M.cx - 14} 116" stroke="#5a5d55" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="${M.cx}" cy="${M.chuckY + 6}" rx="74" ry="14" fill="#a9a69c" stroke="#6f7367" stroke-width="1"/>
    <ellipse cx="${M.cx}" cy="${M.chuckY}" rx="66" ry="11" fill="#c9cbc7" stroke="#6f7367" stroke-width="1"/>
    <path d="M${M.cx - 30} ${M.chuckY - 2} L${M.cx + 10} ${M.chuckY - 7} L${M.cx + 34} ${M.chuckY + 1} L${M.cx - 6} ${M.chuckY + 7} Z" fill="url(#a3lWafer)" stroke="#7d807a" stroke-width=".7"/>
    ${positioner(450, 312, M.cx - 14, M.chuckY, 'S')}
    ${positioner(M.cx + 4, 262, M.cx + 2, M.chuckY - 4, 'G')}
    ${positioner(640, 312, M.cx + 18, M.chuckY + 1, 'D', true)}
    ${leader(M.cx + 26, 166, 600, 116, 'MICROSCOPE')}
    ${T(M.cx, 420, 'A PROBE STATION IN A UNIVERSITY LAB', { size: 8.5 })}
    ${T(M.cx, 434, 'THREE NEEDLES ON SCREW-DRIVEN ARMS', { size: 8, cls: 'lbl-faint', fill: 'var(--ink-soft)' })}
  </g>`;
  return {
    html: `${LAB_DEFS}
      ${T(196, 66, 'A WAFER MAP')}
      ${T(556, 66, 'TESTING ONE TRANSISTOR BY HAND')}
      <line x1="372" y1="54" x2="372" y2="440" stroke="var(--hairline)" stroke-dasharray="3 4"/>
      ${map}${manual}`,
    dies,
  };
}

/* ================================ 3.4 ================================ */

/* DIP, QFP and BGA side by side, each from above and from the side. The two ATmega328P
   packages are the same chip; the BGA is the Artix-7 FPGA's 10 mm package on a Basys 3.
   Not drawn to one scale: the sizes are written under each. */
export function packagesHTML(){
  const BODY = '#262822', LEADC = '#c9c9c0', LEADD = '#8e8f86', PRINT = 'fill:#b9b9ae';
  /* --- DIP-28, using the engine's dip(): notch on the left, pin 1 bottom left --- */
  const d = dip({ x: 46, y: 132, n: 28, p: 11, text: 'ATMEGA328P', sub: '-PU' });
  let dipLegs = '';
  for (let i = 0; i < 14; i++){
    const x = 46 + (i + .5) * 11;
    dipLegs += `<path d="M${f1(x - 2)} 310 h4 v6 h-1.2 v14 h-1.6 v-14 h-1.2 z" fill="${LEADC}" stroke="${LEADD}" stroke-width=".6"/>`;
  }
  const dipG = `<g data-k="dip">
    ${d.svg}
    <circle cx="${f1(d.dot[0])}" cy="${f1(d.dot[1])}" r="2.4" fill="#8d917f"/>
    ${leader(d.dot[0], d.dot[1], 60, 196, 'PIN 1: NOTCH AND DOT')}
    ${dipLegs}
    <rect x="44" y="292" width="158" height="18" rx="2" fill="${BODY}"/>
    <line x1="30" y1="332" x2="216" y2="332" stroke="var(--hairline-strong)" stroke-width="1" stroke-dasharray="4 3"/>
    ${T(123, 348, 'LEGS GO THROUGH THE BOARD', { size: 8, cls: 'lbl-faint', fill: 'var(--ink-soft)' })}
    ${T(123, 376, 'DIP, 28 LEGS', { size: 9.5 })}
    ${T(123, 391, 'LEGS 2.54 MM APART', { size: 8 })}
    ${T(123, 404, 'BODY ABOUT 35 MM LONG', { size: 8 })}
    ${T(123, 417, 'ATMEGA328P (ARDUINO UNO)', { size: 8 })}
  </g>`;

  /* --- TQFP-32: 7 mm body, 0.8 mm pitch, 8 leads a side, pin 1 at top left --- */
  const q = { cx: 360, cy: 166, mm: 11 };
  const qb = 7 * q.mm, qx = q.cx - qb / 2, qy = q.cy - qb / 2, lp = 0.8 * q.mm, ll = 1 * q.mm;
  let ql = '';
  for (let i = 0; i < 8; i++){
    const t = (i - 3.5) * lp;
    ql += `<rect x="${f1(qx - ll)}" y="${f1(q.cy + t - 1.8)}" width="${ll}" height="3.6" fill="${LEADC}" stroke="${LEADD}" stroke-width=".5"/>
      <rect x="${f1(qx + qb)}" y="${f1(q.cy + t - 1.8)}" width="${ll}" height="3.6" fill="${LEADC}" stroke="${LEADD}" stroke-width=".5"/>
      <rect x="${f1(q.cx + t - 1.8)}" y="${f1(qy - ll)}" width="3.6" height="${ll}" fill="${LEADC}" stroke="${LEADD}" stroke-width=".5"/>
      <rect x="${f1(q.cx + t - 1.8)}" y="${f1(qy + qb)}" width="3.6" height="${ll}" fill="${LEADC}" stroke="${LEADD}" stroke-width=".5"/>`;
  }
  /* side view: thin body, gull-wing legs out and down to the board */
  const side = `<path d="M${qx - 2} 302 h-6 l-4 26 h-8" fill="none" stroke="${LEADD}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M${qx + qb + 2} 302 h6 l4 26 h8" fill="none" stroke="${LEADD}" stroke-width="2.6" stroke-linejoin="round"/>
    <rect x="${qx}" y="292" width="${qb}" height="16" rx="2" fill="${BODY}"/>`;
  const qfpG = `<g data-k="qfp">
    ${ql}
    <rect x="${qx}" y="${qy}" width="${qb}" height="${qb}" rx="2" fill="${BODY}" stroke="#45483e"/>
    <circle cx="${qx + 9}" cy="${qy + 9}" r="3" fill="#8d917f"/>
    <text x="${q.cx}" y="${q.cy + 2}" class="lbl" font-size="6.5" style="${PRINT}">ATMEGA</text>
    <text x="${q.cx}" y="${q.cy + 11}" class="lbl" font-size="6.5" style="${PRINT}">328P-AU</text>
    ${leader(qx + 9, qy + 9, 300, 104, 'PIN 1: DOT', 'end')}
    ${side}
    <line x1="${qx - 30}" y1="332" x2="${qx + qb + 30}" y2="332" stroke="var(--hairline-strong)" stroke-width="1" stroke-dasharray="4 3"/>
    ${T(q.cx, 348, 'LEGS SIT ON THE BOARD', { size: 8, cls: 'lbl-faint', fill: 'var(--ink-soft)' })}
    ${T(q.cx, 376, 'QFP, 32 LEGS', { size: 9.5 })}
    ${T(q.cx, 391, 'LEGS 0.8 MM APART', { size: 8 })}
    ${T(q.cx, 404, 'BODY 7 MM SQUARE', { size: 8 })}
    ${T(q.cx, 417, 'SAME CHIP (ARDUINO NANO)', { size: 8 })}
  </g>`;

  /* --- BGA: a small top view with the A1 mark, the underside with its grid of balls, and
     a side view: moulded body on a substrate, balls under it. The grid is a 19 by 19 array
     with the middle and three corners left empty, which gives 236 balls (the real
     pattern differs; the count matches the package's name, CPG236). --- */
  const b = { tx: 486, ty: 112, ts: 56, bx: 566, by: 104, bs: 120 };
  const pitch = b.bs / 20;
  let balls = '';
  for (let r = 0; r < 19; r++) for (let c = 0; c < 19; c++){
    const inner = r >= 4 && r <= 14 && c >= 4 && c <= 14;
    /* the three corners other than A1 are empty, and so is the ball beside A1 */
    const gap = (r === 0 && c === 18) || (r === 18 && c === 18) || (r === 18 && c === 0) || (r === 0 && c === 1);
    if (inner || gap) continue;
    balls += `<circle cx="${f1(b.bx + pitch * (c + 1))}" cy="${f1(b.by + pitch * (r + 1))}" r="${f1(pitch * .34)}" fill="#c9c9c0" stroke="#8e8f86" stroke-width=".4"/>`;
  }
  let sideBalls = '';
  for (let i = 0; i < 19; i++) sideBalls += `<circle cx="${f1(b.bx + pitch * (i + 1))}" cy="314" r="${f1(pitch * .36)}" fill="#c9c9c0" stroke="#8e8f86" stroke-width=".5"/>`;
  const bgaG = `<g data-k="bga">
    <rect x="${b.tx}" y="${b.ty}" width="${b.ts}" height="${b.ts}" rx="2" fill="${BODY}" stroke="#45483e"/>
    <path d="M${b.tx + 3} ${b.ty + 3} h9 l-9 9 z" fill="#8d917f"/>
    <text x="${b.tx + b.ts / 2}" y="${b.ty + 32}" class="lbl" font-size="5.6" style="${PRINT}">XC7A35T</text>
    ${T(b.tx + b.ts / 2, b.ty + b.ts + 16, 'TOP', { size: 8, cls: 'lbl-faint', fill: 'var(--ink-soft)' })}
    ${leader(b.tx + 5, b.ty + 6, b.tx - 8, b.ty - 14, 'A1 CORNER', 'end', 8)}
    <rect x="${b.bx}" y="${b.by}" width="${b.bs}" height="${b.bs}" rx="2" fill="#5e6a55" stroke="#45483e"/>
    ${balls}
    ${T(b.bx + b.bs / 2, b.by + b.bs + 16, 'UNDERNEATH', { size: 8, cls: 'lbl-faint', fill: 'var(--ink-soft)' })}
    <rect x="${b.bx}" y="290" width="${b.bs}" height="12" rx="2" fill="${BODY}"/>
    <rect x="${b.bx}" y="302" width="${b.bs}" height="7" fill="#5e6a55"/>
    ${sideBalls}
    <line x1="${b.bx - 30}" y1="332" x2="${b.bx + b.bs + 30}" y2="332" stroke="var(--hairline-strong)" stroke-width="1" stroke-dasharray="4 3"/>
    ${leader(b.bx - 2, 306, b.bx - 14, 280, 'SUBSTRATE', 'end', 8)}
    ${T(b.bx + b.bs / 2, 348, 'BALLS SIT ON THE BOARD', { size: 8, cls: 'lbl-faint', fill: 'var(--ink-soft)' })}
    ${T(600, 376, 'BGA, 236 BALLS', { size: 9.5 })}
    ${T(600, 391, 'BODY 10 MM SQUARE', { size: 8 })}
    ${T(600, 404, 'THE CHIP ON A BASYS 3 BOARD', { size: 8 })}
  </g>`;
  return `
    ${T(360, 66, 'THREE PACKAGE SHAPES, FROM ABOVE AND FROM THE SIDE')}
    <line x1="246" y1="84" x2="246" y2="410" stroke="var(--hairline)" stroke-dasharray="3 4"/>
    <line x1="462" y1="84" x2="462" y2="410" stroke="var(--hairline)" stroke-dasharray="3 4"/>
    ${dipG}${qfpG}${bgaG}
    <text x="360" y="448" class="lbl-faint">NOT TO ONE SCALE: EACH SIZE IS WRITTEN UNDER ITS PACKAGE</text>`;
}

/* ================================ 3.5 ================================ */

/* a packaged chip seen from above, small: black body, a pin-1 dot */
const chipTop = (x, y, s = 16) => `<rect x="${f1(x)}" y="${f1(y)}" width="${s}" height="${s}" rx="1.5" fill="#262822" stroke="#45483e" stroke-width=".8"/>
  <circle cx="${f1(x + 3.4)}" cy="${f1(y + 3.4)}" r="1.3" fill="#55594d"/>`;

/* a JEDEC-style tray: black plastic, a grid of pockets, chips in some of them */
function tray(x, y, cols, rows, filled){
  let pockets = '';
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++){
    const px = x + 8 + i * 24, py = y + 8 + j * 24;
    pockets += `<rect x="${px}" y="${py}" width="20" height="20" rx="2" fill="#3a3d35" stroke="#55594d" stroke-width=".8"/>`;
    if (filled(i, j)) pockets += chipTop(px + 2, py + 2);
  }
  return `<rect x="${x}" y="${y}" width="${cols * 24 + 12}" height="${rows * 24 + 12}" rx="3" fill="#2f322b" stroke="#1d2117" stroke-width="1"/>${pockets}`;
}

/* A test handler from the front: the input tray, the gantry and its pick-up head, the test
   socket wired to the tester, and three output trays by grade. Below the input tray, a cut
   through the socket: spring pins under each solder ball, a lid pressing down. Returns the
   html and the path a chip follows, so the step can move one along it. */
export function handlerHTML(){
  const RAIL = 116;
  /* the pick-up head: a carriage riding the rail and a rod that reaches down to the chip.
     The step moves it with placeHead(g, x, y), where (x, y) is the centre of the chip held. */
  const head = `<rect class="h-rod" x="-3" y="${RAIL + 14}" width="6" height="60" fill="#a9a69c" stroke="#5f625a" stroke-width=".8"/>
    <rect class="h-cup" x="-8" y="0" width="16" height="4" rx="1" fill="#5f625a"/>
    <rect x="-18" y="${RAIL - 10}" width="36" height="26" rx="3" fill="#8d917f" stroke="#5f625a"/>`;
  const outTrays = [['FAST', 486], ['TYPICAL', 560], ['SLOW', 634]].map(([n, x]) =>
    `${tray(x, 250, 2, 3, (i, j) => (n === 'FAST' ? j > 0 : n === 'TYPICAL' ? j > 1 || i === 0 : j === 2 && i === 0))}
     ${T(x + 30, 344, n, { size: 9 })}`).join('');
  const handler = `<g data-k="handler">
    <rect x="40" y="${RAIL}" width="650" height="8" rx="2" fill="#b9b6ac" stroke="#6f7367" stroke-width="1"/>
    ${tray(48, 250, 6, 3, (i, j) => !(j === 0 && i < 2))}
    ${T(122, 238, 'UNTESTED CHIPS', { size: 8.5 })}
    ${outTrays}
    ${T(587, 238, 'SORTED BY GRADE', { size: 8.5 })}
    <path d="M66 260 V200 H352 V280 M352 200 H504 V260" fill="none" stroke="var(--ink-faint)" stroke-width="1.2" stroke-dasharray="4 4"/>
    ${T(212, 192, 'PICK, TEST, SORT', { size: 8, cls: 'lbl-faint', fill: 'var(--ink-soft)' })}
  </g>`;
  /* the socket, under the gantry's middle, wired down to the tester */
  const socket = `<g data-k="socket">
    <rect x="318" y="270" width="68" height="40" rx="3" fill="#3a3d35" stroke="#1d2117"/>
    <rect x="336" y="276" width="32" height="26" rx="2" fill="#55594d"/>
    ${Array.from({ length: 16 }, (_, k) => `<circle cx="${341 + (k % 4) * 7.4}" cy="${281 + Math.floor(k / 4) * 5.6}" r="1.3" fill="#c9a24a"/>`).join('')}
    <path d="M352 310 V350" stroke="#3a3d35" stroke-width="4"/>
    <rect x="312" y="350" width="80" height="34" rx="3" fill="#5a5d55"/>
    ${T(352, 371, 'TESTER', { size: 8.5, fill: '#e6e2d4' })}
    ${T(352, 262, 'TEST SOCKET', { size: 8.5 })}
    <g transform="translate(40 384)">
      <rect x="0" y="0" width="240" height="70" rx="3" fill="#efece2" stroke="var(--hairline-strong)"/>
      <rect x="60" y="6" width="120" height="10" rx="2" fill="#8d917f"/>
      ${T(186, 14, 'LID', { size: 7.5, anchor: 'start' })}
      <rect x="70" y="16" width="100" height="10" rx="1" fill="#262822"/>
      <rect x="70" y="26" width="100" height="4" fill="#5e6a55"/>
      ${Array.from({ length: 8 }, (_, i) => {
        const x = 78 + i * 12;
        return `<circle cx="${x}" cy="33" r="3.2" fill="#c9c9c0" stroke="#8e8f86" stroke-width=".5"/>
          <rect x="${x - 1.4}" y="36" width="2.8" height="6" fill="#c9a24a"/>
          <path d="M${x} 42 l-2.4 2 l4.8 2 l-4.8 2 l4.8 2 l-2.4 2" fill="none" stroke="#8a7650" stroke-width=".9"/>
          <rect x="${x - 2.4}" y="52" width="4.8" height="10" fill="#c9a24a" opacity=".7"/>`;
      }).join('')}
      <rect x="60" y="36" width="120" height="28" fill="none" stroke="#55594d" stroke-width="1"/>
      ${T(14, 46, 'SPRING', { size: 7.5, anchor: 'start' })}
      ${T(14, 57, 'PINS', { size: 7.5, anchor: 'start' })}
    </g>
  </g>`;
  return {
    html: `${LAB_DEFS}
      ${T(360, 66, 'A TEST HANDLER, FROM THE FRONT')}
      ${handler}${socket}`,
    head,
    /* waypoints for a chip: from the first empty input pocket, up, across, into the socket,
       up, across, down into the FAST tray's top-left pocket */
    route: [[66, 268], [66, 200], [352, 200], [352, 289], [352, 200], [504, 200], [504, 268]],
  };
}

/* move the head built from handlerHTML().head so that it holds a chip centred at (x, y) */
export function placeHead(g, x, y){
  const top = y - 8, rodTop = 116 + 14;
  g.setAttribute('transform', `translate(${f1(x)} 0)`);
  const rod = g.querySelector('.h-rod'), cup = g.querySelector('.h-cup');
  rod.setAttribute('height', f1(Math.max(4, top - 4 - rodTop)));
  cup.setAttribute('y', f1(top - 4));
}

/* One die design sold as four products: AMD's Zen 3 core die (8 cores) and the four Ryzen
   5000 desktop chips built from it, with switched-off cores hatched. Launch prices in amber
   (cost). Core layout drawn as two rows of four either side of the cache, as on the die. */
function ccd(x, y, w, h, on){
  const cw = w / 4 - 3, ch = h * .34;
  let out = `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="1.5" fill="url(#a3lWafer)" stroke="#6f7367" stroke-width=".8"/>
    <rect x="${f1(x + 2)}" y="${f1(y + h * .38)}" width="${f1(w - 4)}" height="${f1(h * .24)}" fill="#b5bab6"/>`;
  for (let k = 0; k < 8; k++){
    const i = k % 4, top = k < 4;
    const cx = x + 2 + i * (cw + 3) - .5, cy = top ? y + 2 : y + h - ch - 2;
    out += on[k]
      ? `<rect x="${f1(cx)}" y="${f1(cy)}" width="${f1(cw)}" height="${f1(ch)}" fill="#f4f4f0" stroke="#6f7367" stroke-width=".7"/>`
      : `<rect x="${f1(cx)}" y="${f1(cy)}" width="${f1(cw)}" height="${f1(ch)}" fill="#9fa39b"/><rect x="${f1(cx)}" y="${f1(cy)}" width="${f1(cw)}" height="${f1(ch)}" fill="url(#a3lHatch)" stroke="#3a3d35" stroke-width=".7" stroke-dasharray="1.5 1.5"/>`;
  }
  return out;
}
export function harvestHTML(){
  const ALL = [1, 1, 1, 1, 1, 1, 1, 1], SIX = [1, 1, 1, 0, 1, 1, 1, 0];
  /* the big die on the left */
  const D = { x: 52, y: 150, w: 210, h: 160 };
  let big = ccd(D.x, D.y, D.w, D.h, ALL);
  big += T(D.x + D.w / 2, D.y + D.h / 2 + 4, 'CACHE', { size: 8.5 });
  big += T(D.x + D.w / 2, D.y - 40, 'ONE DIE DESIGN, CALLED A CCD', { size: 9 });
  big += T(D.x + D.w / 2, D.y - 24, 'EIGHT CORES', { size: 8.5 });
  big += leader(D.x + 26, D.y + D.h - 24, D.x + 26, D.y + D.h + 26, 'ONE CORE', 'start');
  /* four products on the right: a green substrate (Act 3's package colour), an I/O die,
     and one or two core dies */
  const P = [
    { k: 'p5950', name: 'RYZEN 9 5950X', cores: '16 CORES', price: '$799', dies: [ALL, ALL] },
    { k: 'p5900', name: 'RYZEN 9 5900X', cores: '12 CORES', price: '$549', dies: [SIX, SIX] },
    { k: 'p5800', name: 'RYZEN 7 5800X', cores: '8 CORES', price: '$449', dies: [ALL] },
    { k: 'p5600', name: 'RYZEN 5 5600X', cores: '6 CORES', price: '$299', dies: [SIX] },
  ];
  const prods = P.map((p, i) => {
    const cx = 344 + i * 104, s = 94, x = cx - s / 2, y = 146;
    let g = `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="3" fill="rgba(92,107,69,.24)" stroke="var(--green)" stroke-width="1"/>
      <rect x="${x + 10}" y="${y + 58}" width="${s - 20}" height="24" rx="1.5" fill="none" stroke="var(--ink-soft)" stroke-width=".8" stroke-dasharray="3 2"/>
      ${T(cx, y + 74, 'I/O DIE', { size: 7, fill: 'var(--ink-soft)' })}`;
    p.dies.forEach((on, j) => {
      const n = p.dies.length, dw = 38, dx = n === 1 ? cx - dw / 2 : cx - dw - 2 + j * (dw + 4);
      g += ccd(dx, y + 10, dw, 38, on);
    });
    return `<g data-k="${p.k}">${g}
      ${T(cx, y + s + 22, p.name, { size: 8.5 })}
      ${T(cx, y + s + 37, p.cores, { size: 8 })}
      ${T(cx, y + s + 56, p.price, { size: 11, cls: 'lbl-strong', fill: 'var(--amber)' })}
    </g>`;
  }).join('');
  return `${LAB_DEFS}
    ${T(360, 66, 'ONE DIE, SOLD AS FOUR PRODUCTS (AMD RYZEN 5000, 2020)')}
    <line x1="288" y1="90" x2="288" y2="400" stroke="var(--hairline)" stroke-dasharray="3 4"/>
    <g data-k="die">${big}</g>
    ${prods}
    <g data-k="legend">
      <rect x="356" y="350" width="14" height="10" fill="#f4f4f0" stroke="#6f7367" stroke-width=".7"/>
      ${T(376, 359, 'CORE SWITCHED ON', { anchor: 'start', size: 8 })}
      <rect x="512" y="350" width="14" height="10" fill="#9fa39b"/><rect x="512" y="350" width="14" height="10" fill="url(#a3lHatch)" stroke="#3a3d35" stroke-width=".7" stroke-dasharray="1.5 1.5"/>
      ${T(532, 359, 'CORE SWITCHED OFF', { anchor: 'start', size: 8 })}
      ${T(498, 386, 'LAUNCH PRICES, NOVEMBER 2020', { size: 8, cls: 'lbl-faint', fill: 'var(--ink-soft)' })}
    </g>`;
}
