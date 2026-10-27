// ACT 5 — drawings for the "In the Lab" sections (DESIGN.md §6d rule 8).
// Each builder returns an SVG string for slideInPanel(svg, html, { lab: true }). Parts that a
// card talks about are wrapped in <g data-k="…"> so panel.focus(key) can light one of them.
//
// Colours follow DESIGN.md §1a inside the lab panel too: real objects keep real colours (black
// steel, silver metal, aqua multimode fibre, copper cold plates), amber is power and heat (power
// cords, a PDU's readout, warm coolant, hot air, a lit port light), blue is a live signal on one
// path, red is only the failed link in 5.4. Nothing is random: the barcode in 5.3 comes from a
// seeded mulberry32, so a replay draws the same picture.
//
// Facts drawn here, and where they come from (checked 2026-10-19):
//   rack unit 1U = 44.45 mm, a 42U rack            EIA-310 (19-inch rack standard)
//   DGX H100: 8U, 8 GPUs, 6 x 3.3 kW supplies at   NVIDIA DGX H100 user guide, "Introduction"
//     200-240 V AC, 16 A, 50-60 Hz; 4 OSFP ports    (docs.nvidia.com/dgx/dgxh100-user-guide)
//     serving 8 single-port 400 Gb/s ConnectX-7
//   up to 4 DGX H100 per rack                      NVIDIA DGX SuperPOD H100 reference architecture
//   H100: 18 NVLink links, 900 GB/s                NVIDIA "Hopper architecture in depth" blog
//   4 NVSwitch chips on an 8-GPU H100 board        NADDOD on DGX H100; also NUMBERS_BOXES 5.2
//   passive copper DAC up to 3 m                   NVIDIA LinkX 400G cables user guide
//   multimode OSFP optics up to 50 m, MPO-12        NVIDIA MMA4Z00-NS datasheet
//   Quantum-2 QM9700: 1U, 32 OSFP, 64 x 400 Gb/s   NVIDIA QM97xx user manual, Dell-hosted datasheet
//   cold aisle 18-27 C (recommended inlet)          ASHRAE Thermal Guidelines, 5th ed. (via NREL)
//   DPU (5.1): DGX B200 networking = 8 single-port ConnectX-7 for the compute fabric plus
//     2 dual-port BlueField-3 DPUs for storage and in-band management (NVIDIA DGX B200
//     datasheet and user guide); BlueField-3 has up to 16 Arm A78 cores and up to
//     400 Gb/s (NVIDIA BlueField-3 datasheet). Checked 2026-10-25.
import { iso } from '../../engine/reallife.js';
import { mulberry32 } from '../../engine/fab.js';

/* ---------- shared bits ---------- */
const STEEL = '#2b2e27', STEEL2 = '#3b3e36', EDGE = '#55594d', SILVER = '#c9cbc4', SILVER2 = '#a9aca3';
const AQUA = '#4aa9a6';                     // multimode fibre jackets really are aqua
const f = v => (+v).toFixed(1);

export function txt(x, y, s, { size = 8.5, anchor = 'middle', fill = 'var(--ink)', cls = 'lbl', extra = '' } = {}){
  return `<text x="${f(x)}" y="${f(y)}" class="${cls}" text-anchor="${anchor}" style="font-size:${size}px;fill:${fill};${extra}">${s}</text>`;
}
/* a leader line with a dot on the thing, and its label at the far end */
export function callout(x1, y1, x2, y2, s, { anchor, size = 8.5, fill = 'var(--ink)', dy = 3 } = {}){
  const a = anchor || (x2 < x1 ? 'end' : x2 > x1 ? 'start' : 'middle');
  const tx = a === 'end' ? x2 - 3 : a === 'start' ? x2 + 3 : x2;
  return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="var(--ink-soft)" stroke-width=".8"/>
    <circle cx="${f(x1)}" cy="${f(y1)}" r="1.8" fill="var(--ink)"/>` + txt(tx, y2 + dy, s, { anchor: a, size, fill });
}
const rect = (x, y, w, h, fill, stroke = 'none', sw = 1, rx = 0, extra = '') =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
const line = (x1, y1, x2, y2, stroke, sw = 1, extra = '') =>
  `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
const divider = x => line(x, 56, x, 452, 'var(--hairline)', 1, 'stroke-dasharray="3 4"');

/* a plain paper figure for scale: head, body, legs, no face */
export function person(x, base, h){
  const k = h / 100, head = 7 * k;
  return `<g stroke="var(--ink)" stroke-width="${Math.max(.8, 1.2 * k).toFixed(2)}" fill="var(--paper-high)" stroke-linejoin="round">
    <path d="M${f(x - 7 * k)} ${f(base)} L${f(x - 6 * k)} ${f(base - 46 * k)} L${f(x + 6 * k)} ${f(base - 46 * k)} L${f(x + 7 * k)} ${f(base)} Z"/>
    <path d="M${f(x - 11 * k)} ${f(base - 44 * k)} Q${f(x - 12 * k)} ${f(base - 82 * k)} ${f(x)} ${f(base - 82 * k)} Q${f(x + 12 * k)} ${f(base - 82 * k)} ${f(x + 11 * k)} ${f(base - 44 * k)} Z"/>
    <line x1="${f(x)}" y1="${f(base)}" x2="${f(x)}" y2="${f(base - 30 * k)}"/>
    <circle cx="${f(x)}" cy="${f(base - 82 * k - head - 1)}" r="${f(head)}"/>
  </g>`;
}

/* an OSFP plug seen from the side: a metal body with fins on top and a pull tab */
function osfpSide(x, y, w = 130, h = 16){
  let fins = '';
  for (let i = 0; i < 18; i++) fins += line(x + 8 + i * ((w - 30) / 17), y - 5, x + 8 + i * ((w - 30) / 17), y, SILVER2, 1.6);
  return fins + rect(x, y, w, h, SILVER, '#7d8078', 1, 2)
    + line(x + 4, y + 4, x + w - 18, y + 4, '#fff', 1, 'opacity=".55"')
    + `<path d="M${x - 2} ${y + 4} h-8 v${h - 8} h8" fill="none" stroke="#7d8078" stroke-width="1.4"/>`  // contacts end, into the socket
    + rect(x + w - 16, y + 2, 14, h - 4, STEEL2, EDGE, .8, 1);
}

/* ======================================================================================
   5.1 — a university cluster rack, front and back, drawn to scale (8 px per rack unit)
   ====================================================================================== */
const U = 8, BOT = 432;
const uTop = k => BOT - k * U;                          // top edge of unit k (1 = bottom)

function cabinet(x0){
  // an 800 mm cabinet (144 px), 19-inch rails 88 px apart inside it
  return rect(x0, uTop(42) - 10, 144, 42 * U + 10, STEEL, '#1d2019', 1.2, 2)
    + rect(x0 + 4, uTop(42) - 8, 136, 6, STEEL2)
    + rect(x0, BOT, 144, 8, '#1d2019')
    + rect(x0 + 6, BOT + 8, 10, 5, '#1d2019') + rect(x0 + 128, BOT + 8, 10, 5, '#1d2019')
    + rect(x0 + 24, uTop(42), 4, 42 * U, SILVER2) + rect(x0 + 116, uTop(42), 4, 42 * U, SILVER2);
}
const EQ = x0 => x0 + 28;                                // equipment spans 88 px from here

function oneU(x, k, kind){
  const y = uTop(k);
  let s = rect(x, y + .5, 88, U - 1, kind === 'blank' ? '#24261f' : STEEL2, EDGE, .6);
  if (kind === 'switch'){
    for (let i = 0; i < 16; i++) s += rect(x + 6 + i * 4.7, y + 2, 3.6, 3.2, SILVER2);
  } else if (kind === 'mgmt'){
    for (let i = 0; i < 12; i++) s += rect(x + 22 + i * 5, y + 2, 3.8, 3.4, '#15170f', '#6b6e64', .4);
  } else if (kind === 'brush'){
    s += rect(x + 8, y + 3, 72, 2, '#15170f');
  }
  return s;
}

function serverFront(x, y){
  let s = rect(x, y + .5, 88, 63, STEEL2, EDGE, .8, 1);
  for (let i = 0; i < 8; i++) s += rect(x + 6 + i * 9.6, y + 4, 7.6, 7, '#23251e', '#6b6e64', .5);
  for (let r = 0; r < 9; r++) for (let c = 0; c < 10; c++){
    s += rect(x + 7 + c * 7.6 + (r % 2) * 3.8, y + 16 + r * 5, 4.6, 2.2, '#20221b');
  }
  s += rect(x - 3, y + 2, 3, 59, SILVER2) + rect(x + 88, y + 2, 3, 59, SILVER2);   // rack ears
  return s;
}

function serverRear(x, y){
  let s = rect(x, y + .5, 88, 63, STEEL2, EDGE, .8, 1);
  for (let i = 0; i < 4; i++) s += rect(x + 6 + i * 13, y + 8, 10, 6, SILVER, '#7d8078', .5);   // OSFP sockets
  s += rect(x + 60, y + 8, 22, 6, '#23251e', '#6b6e64', .5);
  for (let i = 0; i < 6; i++){                                                             // six supplies
    const px = x + 3 + i * 14;
    s += rect(px, y + 34, 12, 26, '#30332b', '#6b6e64', .6, 1)
      + `<circle cx="${f(px + 6)}" cy="${f(y + 43)}" r="3.6" fill="none" stroke="#6b6e64" stroke-width=".6"/>`
      + rect(px + 3, y + 52, 6, 4, '#15170f');
  }
  return s;
}

function pdu(x, y0, y1){
  let s = rect(x, y0, 14, y1 - y0, '#22241d', '#4b4e45', .8, 2);
  s += rect(x + 2, y0 + 6, 10, 18, '#11130d') + rect(x + 3.5, y0 + 9, 7, 6, 'var(--amber)', 'none', 0, 0, 'opacity=".85"');
  for (let yy = y0 + 32; yy < y1 - 8; yy += 12) s += rect(x + 3, yy, 8, 7, '#11130d', '#5b5e55', .5, 1);
  return s;
}

export function rackLab(){
  const FX = 160, RX = 456;
  const fx = EQ(FX), rx = EQ(RX);

  /* ---- the front ---- */
  let front = cabinet(FX);
  front += oneU(fx, 42, 'switch') + oneU(fx, 41, 'brush') + oneU(fx, 40, 'mgmt');
  for (let k = 33; k <= 39; k++) front += oneU(fx, k, 'blank');
  for (let i = 0; i < 4; i++) front += serverFront(fx, uTop(8 * i + 8));
  const lx = 314;
  front += callout(278, uTop(42) + 4, lx - 4, 96, 'NETWORK SWITCH', { anchor: 'start' })
    + callout(278, uTop(41) + 4, lx - 4, 114, 'CABLE MANAGEMENT', { anchor: 'start' })
    + callout(278, uTop(40) + 4, lx - 4, 132, 'MANAGEMENT SWITCH', { anchor: 'start' })
    + callout(278, (uTop(39) + uTop(32)) / 2, lx - 4, 164, 'BLANK PANELS (EMPTY)', { anchor: 'start' })
    + `<path d="M284 ${uTop(32) + 2} h6 V${BOT - 2} h-6" fill="none" stroke="var(--ink-soft)" stroke-width=".9"/>`
    + line(290, 304, lx - 4, 304, 'var(--ink-soft)', .8)
    + txt(lx - 1, 307, 'FOUR 8-GPU SERVERS', { anchor: 'start' })
    + txt(lx - 1, 320, 'EACH ONE 8U TALL', { anchor: 'start', fill: 'var(--ink-soft)' });

  /* ---- the rack-unit ruler ---- */
  let ruler = line(148, uTop(42), 148, BOT, 'var(--ink)', 1);
  for (let k = 0; k <= 42; k++){
    const big = k % 8 === 0 || k === 42;
    ruler += line(big ? 141 : 144.5, BOT - k * U, 148, BOT - k * U, 'var(--ink)', big ? 1 : .6);
  }
  [8, 16, 24, 32, 42].forEach(k => { ruler += txt(138, BOT - k * U + 3, `${k}U`, { anchor: 'end', size: 8 }); });
  ruler += txt(66, 242, '1 RACK UNIT (1U)', { size: 8 })
    + txt(66, 255, 'IS 44.45 MM', { size: 8 })
    + txt(66, 280, '42U IS 1.87 M', { size: 8 })
    + txt(66, 293, 'OF MOUNTING SPACE', { size: 8, fill: 'var(--ink-soft)' });

  /* ---- the back ---- */
  let back = cabinet(RX);
  back += oneU(rx, 42, 'switch') + oneU(rx, 41, 'brush') + oneU(rx, 40, 'mgmt');
  for (let k = 33; k <= 39; k++) back += oneU(rx, k, 'blank');
  const PA = RX + 6, PB = RX + 124;                     // the two strips, in the side channels
  let cords = '', net = '';
  for (let i = 0; i < 4; i++){
    const y = uTop(8 * i + 8);
    back += serverRear(rx, y);
    for (let j = 0; j < 6; j++){                        // three cords to each strip
      const px = rx + 9 + j * 14, py = y + 58, toA = j < 3;
      const tx = toA ? PA + 14 : PB, ty = y + 30 + (toA ? j : 5 - j) * 5;
      cords += `<path d="M${f(px)} ${f(py)} C${f(px)} ${f(py + 6)}, ${f(tx + (toA ? 8 : -8))} ${f(ty + 4)}, ${f(tx)} ${f(ty)}" fill="none" stroke="var(--amber)" stroke-width="1.3" opacity=".9"/>`;
    }
    for (let j = 0; j < 4; j++){                        // network cables up to the switch
      const cx = rx + 11 + j * 13, cy = y + 11, gx = rx + 74 + j * 2.2;
      net += `<path d="M${f(cx)} ${f(cy)} C${f(cx)} ${f(cy - 7)}, ${f(gx)} ${f(cy - 3)}, ${f(gx)} ${f(cy - 9)} V${f(uTop(42) + 6)}" fill="none" stroke="#11130d" stroke-width="1.1"/>`;
    }
  }
  back += pdu(PA, uTop(42) + 2, BOT - 2) + pdu(PB, uTop(42) + 2, BOT - 2) + cords + net
    + `<path d="M${PA + 7} ${BOT - 2} V${BOT + 22}" stroke="var(--amber)" stroke-width="2.6" fill="none"/>`
    + `<path d="M${PB + 7} ${BOT - 2} V${BOT + 22}" stroke="var(--amber)" stroke-width="2.6" fill="none"/>`
    + txt(PA + 7, BOT + 34, 'PDU', { size: 8 }) + txt(PB + 7, BOT + 34, 'PDU', { size: 8 });
  const rl = 612;
  back += callout(rx + 80, uTop(38), rl - 4, 112, 'NETWORK CABLES', { anchor: 'start', size: 8 })
    + callout(PB + 7, uTop(42) + 15, rl - 4, 148, 'PDU DISPLAY', { anchor: 'start', size: 8 })
    + callout(PB + 12, uTop(30), rl - 4, 196, 'POWER STRIP', { anchor: 'start', size: 8 })
    + txt(rl - 1, 209, '(PDU)', { anchor: 'start', size: 8, fill: 'var(--ink-soft)' })
    + callout(rx + 84, uTop(24) + 46, rl - 4, 268, 'POWER SUPPLIES', { anchor: 'start', size: 8 })
    + callout(rx + 30, uTop(16) + 61, rl - 4, 340, 'POWER CORDS', { anchor: 'start', size: 8 });

  return `
    ${txt(232, 70, 'FROM THE FRONT', { size: 9.5 })}
    ${txt(528, 70, 'FROM THE BACK', { size: 9.5 })}
    <g data-k="front">${front}</g>
    <g data-k="units">${ruler}</g>
    <g data-k="rear">${back}</g>
    ${txt(20, 470, 'A 42U RACK, 800 MM WIDE, DRAWN TO SCALE', { anchor: 'start', size: 8, cls: 'lbl-faint', fill: 'var(--ink-faint)' })}`;
}

/* ---------- 5.1 — one 8-GPU server, lid off, from above (front on the left) ---------- */
export function serverTopLab(){
  const X0 = 92, X1 = 630, Y0 = 122, Y1 = 402;
  let s = rect(X0, Y0, X1 - X0, Y1 - Y0, '#d3d5ce', '#7d8078', 1.4, 3);
  s += rect(X0 - 8, Y0 + 6, 8, 30, SILVER2, '#7d8078', .8, 1) + rect(X0 - 8, Y1 - 36, 8, 30, SILVER2, '#7d8078', .8, 1);

  let fans = '';
  for (let i = 0; i < 6; i++){
    const cx = 127, cy = 150 + i * 45;
    fans += rect(cx - 21, cy - 21, 42, 42, '#2c2f28', '#15170f', .8, 3)
      + `<circle cx="${cx}" cy="${cy}" r="18" fill="#3a3d35"/>`;
    for (let b = 0; b < 7; b++){
      const a = b * Math.PI * 2 / 7;
      fans += `<path d="M${f(cx + Math.cos(a) * 5)} ${f(cy + Math.sin(a) * 5)} Q${f(cx + Math.cos(a + .5) * 14)} ${f(cy + Math.sin(a + .5) * 14)} ${f(cx + Math.cos(a + .9) * 17)} ${f(cy + Math.sin(a + .9) * 17)}" stroke="#8e9187" stroke-width="2" fill="none"/>`;
    }
    fans += `<circle cx="${cx}" cy="${cy}" r="5" fill="#55594d"/>`;
  }

  const sink = (x, y, w, h, gap = 5) => {
    let o = rect(x, y, w, h, '#bfc1ba', '#6f726a', 1, 2);
    for (let yy = y + gap; yy < y + h - 1; yy += gap) o += line(x + 2, yy, x + w - 2, yy, '#8e9187', 1);
    return o;
  };
  let gpus = '';
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) gpus += sink(168 + c * 64, 132 + r * 140, 58, 120);
  let link = '';
  for (let i = 0; i < 4; i++) link += sink(428, 145 + i * 62, 36, 50, 4);

  let cpu = '';
  [160, 300].forEach(cy => {
    cpu += sink(494, cy, 56, 56, 4);
    for (let i = 0; i < 4; i++){
      cpu += rect(484, cy - 22 + i * 5, 76, 3, '#3b3e36') + rect(484, cy + 62 + i * 5, 76, 3, '#3b3e36');
    }
  });
  let net = '', psu = '';
  for (let i = 0; i < 3; i++){
    net += rect(576, 132 + i * 40, 48, 34, '#2c2f28', '#15170f', .8, 2)
      + rect(618, 138 + i * 40, 8, 9, SILVER, '#7d8078', .5) + rect(618, 151 + i * 40, 8, 9, SILVER, '#7d8078', .5);
  }
  for (let i = 0; i < 6; i++) psu += rect(576, 268 + i * 22, 50, 19, '#30332b', '#15170f', .8, 2) + rect(616, 272 + i * 22, 6, 11, '#15170f');

  /* the air: in at the front, out at the back */
  let air = '';
  [110, 414].forEach(y => {
    air += line(160, y, 560, y, 'var(--ink-faint)', 1, 'stroke-dasharray="4 5"')
      + `<path d="M556 ${y - 4} l8 4 l-8 4" fill="none" stroke="var(--ink-faint)" stroke-width="1"/>`;
  });

  return `
    ${txt(360, 66, 'AN 8-GPU SERVER WITH ITS LID OFF, SEEN FROM ABOVE', { size: 9.5 })}
    <g data-k="chassis">${s}${fans}${psu}${air}
      ${callout(127, 128, 127, 92, 'FANS', { anchor: 'middle', dy: -3 })}
      ${callout(600, 398, 640, 446, 'POWER SUPPLIES', { anchor: 'end', dy: 9 })}
      ${txt(92, 470, 'AIR FLOWS FROM THE FRONT, ON THE LEFT, TO THE BACK, ON THE RIGHT', { anchor: 'start', size: 8, fill: 'var(--ink-faint)' })}</g>
    <g data-k="gpu">${gpus}${callout(293, 132, 293, 92, 'EIGHT GPUS UNDER HEAT SINKS', { anchor: 'middle', dy: -3 })}</g>
    <g data-k="link">${link}${callout(446, 381, 446, 430, 'CHIPS THAT LINK THE GPUS', { anchor: 'middle', dy: 9 })}</g>
    <g data-k="cpu">${cpu}${callout(522, 160, 522, 98, 'TWO CPUS AND MEMORY', { anchor: 'middle', dy: -3 })}</g>
    <g data-k="net">${net}${callout(600, 132, 640, 82, 'NETWORK CARDS', { anchor: 'end', dy: -1 })}</g>`;
}

/* ======================================================================================
   5.2 — NVLink on the GPU board, then the cables between servers
   ====================================================================================== */
function gpuModule(x, y, n){
  // an SXM module seen from above, heat sink off: the H100 package, one die and six memory stacks
  let s = rect(x, y, 70, 56, '#efede3', '#8f8d7c', 1, 2);
  s += rect(x + 12, y + 8, 46, 40, '#e2dfd0', '#9a9b90', .7, 1);
  s += rect(x + 25, y + 13, 20, 30, '#cfd1cb', '#6f726a', .8, 1);
  for (let i = 0; i < 3; i++) s += rect(x + 15, y + 12 + i * 11, 8, 9, '#3a3d35') + rect(x + 47, y + 12 + i * 11, 8, 9, '#3a3d35');
  return s + txt(x + 5, y + 54, `${n}`, { anchor: 'start', size: 7.5, fill: 'var(--ink-soft)' });
}

export function interconnectLab(){
  const GX = i => 42 + i * 78, TOP = 112, BOTY = 324, SW = { y: 230, w: 40, h: 32 };
  const swX = j => GX(j) + 35;                          // switch centres line up with the columns
  let board = rect(30, 98, 328, 296, '#d9d7c7', '#8f8d7c', 1.2, 4);
  let traces = '';
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++){
    const sx = GX(i) + 35 - 15 + j * 10;
    traces += line(sx, TOP + 56, swX(j), SW.y, 'var(--ink)', .8, 'opacity=".5"')
      + line(sx, BOTY, swX(j), SW.y + SW.h, 'var(--ink)', .8, 'opacity=".5"');
  }
  let gpus = '';
  for (let i = 0; i < 4; i++) gpus += gpuModule(GX(i), TOP, i + 1) + gpuModule(GX(i), BOTY, i + 5);
  board += traces + gpus
    + txt(194, 412, 'EIGHT H100 GPUS ON ONE BOARD, HEAT SINKS OFF', { size: 8 })
    + txt(194, 426, 'EACH THIN LINE IS A BUNDLE OF NVLINK TRACES', { size: 8, fill: 'var(--ink-soft)' });

  let sw = '';
  for (let j = 0; j < 4; j++){
    sw += rect(swX(j) - SW.w / 2, SW.y, SW.w, SW.h, '#3a3d35', '#15170f', 1, 2)
      + rect(swX(j) - 10, SW.y + 8, 20, 16, '#cfd1cb', '#6f726a', .7, 1);
  }
  sw += txt(194, 445, 'FOUR NVSWITCH CHIPS · UP TO 900 GB/s PER GPU', { size: 8 });

  /* one message: GPU 1 to GPU 6, through the second NVSwitch */
  const path = `<path d="M${GX(0) + 30} ${TOP + 56} L${swX(1)} ${SW.y}" stroke="var(--blue)" stroke-width="2.4" fill="none"/>
    <path d="M${swX(1)} ${SW.y + SW.h} L${GX(1) + 30} ${BOTY}" stroke="var(--blue)" stroke-width="2.4" fill="none"/>
    ${rect(swX(1) - SW.w / 2 - 2, SW.y - 2, SW.w + 4, SW.h + 4, 'none', 'var(--blue)', 1.6, 3)}`;

  /* ---- right: the back panel, a copper cable, an optical module ---- */
  let ports = rect(398, 104, 296, 46, STEEL2, '#15170f', 1, 2);
  for (let i = 0; i < 4; i++) ports += rect(412 + i * 52, 118, 42, 18, '#1d2019', SILVER2, 1.4, 1) + rect(418 + i * 52, 124, 30, 6, '#3a3d35');
  ports += rect(626, 118, 22, 18, '#1d2019', '#6b6e64', .8) + rect(656, 118, 22, 18, '#1d2019', '#6b6e64', .8)
    + txt(398, 98, 'PART OF A DGX H100’S BACK PANEL', { anchor: 'start', size: 8, fill: 'var(--ink-soft)' })
    + txt(516, 166, 'FOUR OSFP SOCKETS: EIGHT 400 Gb/s LINKS', { size: 8 });

  const dac = txt(410, 206, 'COPPER CABLE (DAC)', { anchor: 'start', size: 9 })
    + osfpSide(420, 226)
    + `<path d="M550 234 C600 234, 610 262, 690 262" fill="none" stroke="#15170f" stroke-width="8" stroke-linecap="round"/>`
    + txt(410, 286, 'REACHES ABOUT 3 M: STAYS IN THE RACK', { anchor: 'start', size: 8, fill: 'var(--ink-soft)' });

  const optic = txt(410, 322, 'OPTICAL MODULE AND FIBRE', { anchor: 'start', size: 9 })
    + osfpSide(420, 342)
    + rect(552, 343, 12, 6, '#2c2f28') + rect(552, 351, 12, 6, '#2c2f28')
    + `<path d="M564 346 C610 346, 620 372, 690 374" fill="none" stroke="${AQUA}" stroke-width="3.4" stroke-linecap="round"/>
       <path d="M564 354 C606 354, 616 382, 690 386" fill="none" stroke="${AQUA}" stroke-width="3.4" stroke-linecap="round"/>`
    + txt(410, 404, 'TURNS THE SIGNAL INTO LIGHT', { anchor: 'start', size: 8, fill: 'var(--ink-soft)' })
    + txt(410, 418, 'REACHES UP TO 50 M ON THIS FIBRE', { anchor: 'start', size: 8, fill: 'var(--ink-soft)' });

  return `
    ${txt(194, 74, 'INSIDE THE SERVER: THE GPU BOARD', { size: 9.5 })}
    ${txt(546, 74, 'BETWEEN SERVERS: THE CABLES', { size: 9.5 })}
    ${divider(380)}
    <g data-k="board">${board}</g>
    <g data-k="nvswitch">${sw}</g>
    <g data-k="path">${path}</g>
    <g data-k="ports">${ports}</g>
    <g data-k="dac">${dac}</g>
    <g data-k="optic">${optic}</g>`;
}

/* ======================================================================================
   5.3 — a rack PDU, a server power supply's label, a cold plate and a CDU
   ====================================================================================== */
function c13(x, y){
  return `<path d="M${x} ${y} h18 v8 l-3 3 h-12 l-3 -3 z" fill="#0f110c" stroke="#5b5e55" stroke-width=".6"/>`
    + rect(x + 4, y + 3, 2, 5, '#5b5e55') + rect(x + 12, y + 3, 2, 5, '#5b5e55') + rect(x + 8, y + 1.5, 2, 3.5, '#5b5e55');
}
function c19(x, y){
  return rect(x - 1, y, 20, 13, '#0f110c', '#5b5e55', .6, 1.5)
    + rect(x + 2, y + 3, 5, 2, '#5b5e55') + rect(x + 11, y + 3, 5, 2, '#5b5e55') + rect(x + 6.5, y + 8, 5, 2, '#5b5e55');
}

export function powerLab(){
  /* ---- the PDU ---- */
  const PX = 52;
  let p = rect(PX, 96, 40, 340, '#22241d', '#4b4e45', 1, 3);
  p += rect(PX + 4, 104, 32, 48, '#11130d', '#4b4e45', .6, 2)
    + txt(PX + 20, 124, '12.4', { size: 11, fill: 'var(--amber)', cls: 'lbl-strong', extra: 'letter-spacing:.05em' })
    + txt(PX + 20, 138, 'A', { size: 8, fill: 'var(--amber)' })
    + `<circle cx="${PX + 13}" cy="146" r="2" fill="#5b5e55"/><circle cx="${PX + 27}" cy="146" r="2" fill="#5b5e55"/>`;
  let y = 164, firstC13 = 0, firstC19 = 0;
  for (let g = 0; g < 4; g++){
    for (let i = 0; i < 3; i++){ p += c13(PX + 11, y); if (!firstC13) firstC13 = y + 5; y += 18; }
    p += c19(PX + 11, y); if (!firstC19) firstC19 = y + 6; y += 22;
  }
  p += `<path d="M${PX + 20} 436 V462" stroke="var(--amber)" stroke-width="4" fill="none"/>`
    + callout(PX + 37, 124, 106, 124, 'CURRENT, IN AMPS', { anchor: 'start', size: 8 })
    + callout(PX + 29, firstC13, 106, firstC13, 'SMALL SOCKET (C13)', { anchor: 'start', size: 8 })
    + callout(PX + 30, firstC19, 106, firstC19, 'LARGE SOCKET (C19)', { anchor: 'start', size: 8 })
    + callout(PX + 20, 452, 106, 452, 'POWER IN', { anchor: 'start', size: 8 });

  /* ---- the power supply and its label ---- */
  let s = rect(230, 98, 166, 56, STEEL2, '#15170f', 1, 3);
  s += `<circle cx="258" cy="126" r="20" fill="#2c2f28" stroke="#15170f"/>`;
  for (let i = 0; i < 6; i++){ const a = i * Math.PI / 3; s += line(258, 126, 258 + Math.cos(a) * 19, 126 + Math.sin(a) * 19, '#6b6e64', 1); }
  s += `<circle cx="258" cy="126" r="5" fill="#55594d"/>`
    + rect(300, 116, 30, 20, '#0f110c', '#6b6e64', .8, 2)
    + rect(306, 121, 6, 2.4, '#6b6e64') + rect(318, 121, 6, 2.4, '#6b6e64') + rect(312, 129, 6, 2.4, '#6b6e64')
    + `<circle cx="346" cy="114" r="2.4" fill="var(--amber)"/>`
    + `<path d="M366 106 h22 v40 h-22" fill="none" stroke="${SILVER2}" stroke-width="3"/>`
    + txt(313, 172, 'THE BACK END OF ONE SUPPLY', { size: 8, fill: 'var(--ink-soft)' });
  const rng = mulberry32(53);
  let bars = '', bx = 238;
  while (bx < 330){ const w = 1 + Math.floor(rng() * 3); bars += rect(bx, 316, w, 24, '#1d2019'); bx += w + 1 + Math.floor(rng() * 2); }
  const L = (yy, t, o = {}) => txt(236, yy, t, { anchor: 'start', size: 8, ...o });
  s += rect(224, 192, 178, 160, '#f8f7f1', '#9a9b90', 1, 2)
    + L(212, 'POWER SUPPLY UNIT', { cls: 'lbl-strong' })
    + line(236, 220, 390, 220, '#9a9b90', .8)
    + L(238, 'AC INPUT') + L(252, '200–240 V ~  16 A') + L(266, '50–60 Hz')
    + L(288, 'OUTPUT') + L(302, '3,300 W MAX')
    + bars
    + `<path d="M372 340 l12 -22 l12 22 z" fill="none" stroke="#1d2019" stroke-width="1.4"/>
       <path d="M385 323 l-4 8 h5 l-4 8" fill="none" stroke="#1d2019" stroke-width="1.2"/>`
    + txt(313, 372, 'THE LABEL ON ONE OF THE SIX', { size: 8, fill: 'var(--ink-soft)' })
    + txt(313, 385, 'SUPPLIES IN A DGX H100', { size: 8, fill: 'var(--ink-soft)' });

  /* ---- the cold plate on a GPU, in 3D ---- */
  const CU = { top: '#e6bb93', x: '#d7a67b', y: '#c79367', stroke: '#8a5a33' };
  const SUB = { top: '#e2dfd0', x: '#cfccbc', y: '#c1beae', stroke: '#8f8d7c' };
  const PCB = { top: '#d9d7c7', x: '#c6c4b3', y: '#b9b7a6', stroke: '#8f8d7c' };
  const I = iso(1.45, 540, 128);
  let plate = I.box(-10, -10, -4, 90, 90, 4, PCB) + I.box(8, 8, 0, 54, 54, 4, SUB) + I.box(14, 14, 4, 42, 42, 10, CU);
  const fit = (x, y) => {
    const [a, b] = I.P(x, y, 14), [, c] = I.P(x, y, 22);
    return rect(a - 4, c, 8, b - c, SILVER2, '#6f726a', .8) + `<ellipse cx="${f(a)}" cy="${f(c)}" rx="4" ry="2" fill="${SILVER}" stroke="#6f726a" stroke-width=".8"/>`;
  };
  const [ix, iy] = I.P(24, 44, 22), [ox, oy] = I.P(24, 26, 22);   // cool in on the left, warm out on the right
  plate += fit(24, 26) + fit(24, 44);
  /* the hoses: cool coolant in (ink), warm coolant out (amber), both down to the CDU */
  const hoses = `<path d="M${f(ix)} ${f(iy)} C${f(ix)} 78, 694 74, 694 150 V262" fill="none" stroke="#2c2f28" stroke-width="5" stroke-linecap="round"/>
    <path d="M${f(ox)} ${f(oy)} C${f(ox)} 92, 676 88, 676 160 V262" fill="none" stroke="var(--amber)" stroke-width="5" stroke-linecap="round"/>`;
  const [cpx, cpy] = I.P(14, 56, 9), [gpx, gpy] = I.P(8, 62, 2);
  plate += hoses
    + callout(cpx, cpy, 446, 214, 'COLD PLATE (COPPER)', { anchor: 'start', size: 8 })
    + callout(gpx, gpy, 446, 240, 'GPU UNDERNEATH', { anchor: 'start', size: 8 })
    + txt(668, 78, 'COOL IN', { anchor: 'start', size: 8 })
    + txt(626, 132, 'WARM OUT', { size: 8, fill: 'var(--amber)' });

  /* ---- the CDU, door open ---- */
  let cdu = rect(586, 262, 116, 180, '#d9dbd5', '#6f726a', 1.2, 3);
  cdu += txt(644, 280, 'CDU', { size: 9, cls: 'lbl-strong' });
  for (let i = 0; i < 9; i++) cdu += rect(636, 300 + i * 6, 40, 4, i % 2 ? '#a9aca3' : '#c9cbc4', '#6f726a', .5);
  cdu += `<circle cx="618" cy="390" r="15" fill="${SILVER}" stroke="#6f726a" stroke-width="1"/>`;
  for (let i = 0; i < 5; i++){ const a = i * Math.PI * 2 / 5; cdu += `<path d="M618 390 Q${f(618 + Math.cos(a) * 10)} ${f(390 + Math.sin(a) * 4)} ${f(618 + Math.cos(a + .6) * 12)} ${f(390 + Math.sin(a + .6) * 12)}" stroke="#6f726a" stroke-width="1.4" fill="none"/>`; }
  cdu += `<path d="M676 262 V300 M694 262 V280 H684 V300" stroke="#55594d" stroke-width="2" fill="none"/>
    <path d="M656 354 V372 H633 M618 375 V340 H636" stroke="#55594d" stroke-width="2" fill="none"/>
    <path d="M646 354 V420 M666 354 V420" stroke="#55594d" stroke-width="2" fill="none"/>
    <path d="M646 442 V464 M666 442 V464" stroke="var(--ink)" stroke-width="3" fill="none"/>`
    + callout(618, 390, 572, 390, 'PUMP', { anchor: 'end', size: 8 })
    + callout(636, 318, 572, 318, 'HEAT EXCHANGER', { anchor: 'end', size: 8 })
    + txt(640, 476, 'TO THE BUILDING’S WATER', { size: 8, fill: 'var(--ink-soft)' });

  return `
    ${txt(112, 74, 'A RACK PDU (ONE PART)', { size: 9.5 })}
    ${txt(313, 74, 'A SERVER POWER SUPPLY', { size: 9.5 })}
    ${txt(540, 64, 'LIQUID COOLING', { size: 9.5 })}
    ${divider(206)}${divider(420)}
    <g data-k="pdu">${p}</g>
    <g data-k="psu">${s}</g>
    <g data-k="plate">${plate}</g>
    <g data-k="cdu">${cdu}</g>`;
}

/* ======================================================================================
   5.4 — a leaf switch, a fibre patch panel, a spine switch, and one failed link
   ====================================================================================== */
function switchFront(x, y, w = 300){
  // NVIDIA Quantum-2 style: 1U, 32 OSFP cages in two rows of sixteen, a small management end
  let s = rect(x, y, w, 30, '#26281f', '#15170f', 1, 2) + rect(x - 5, y + 2, 5, 26, SILVER2) + rect(x + w, y + 2, 5, 26, SILVER2);
  const cx = i => x + 10 + i * 16.6;
  for (let r = 0; r < 2; r++) for (let i = 0; i < 16; i++){
    s += rect(cx(i), y + 3 + r * 13, 14, 10, '#3c3f37', SILVER2, .8, 1);
  }
  s += rect(x + w - 26, y + 6, 8, 6, '#0f110c') + rect(x + w - 14, y + 6, 8, 6, '#0f110c') + rect(x + w - 26, y + 17, 20, 6, '#0f110c');
  return { s, cx: i => cx(i) + 7, top: y + 3, bot: y + 26 };
}

export function networkLab(){
  /* ---- the leaf switch and its cables ---- */
  const LEAF = switchFront(40, 160);
  let leaf = LEAF.s;
  for (let i = 0; i < 16; i++) leaf += `<circle cx="${f(LEAF.cx(i) + 4)}" cy="${f(LEAF.top + 1)}" r="1.1" fill="var(--amber)"/>`;
  const leafLbl = txt(190, 210, 'LEAF SWITCH: 1U, 32 SOCKETS, 64 LINKS AT 400 Gb/s',
    { size: 8, extra: 'paint-order:stroke;stroke:var(--lab-paper);stroke-width:5px;stroke-linejoin:round' });

  let down = '';
  for (let i = 0; i < 16; i += 2){
    const x = LEAF.cx(i), ex = 70 + i * 13;
    down += `<path d="M${f(x)} ${LEAF.bot} C${f(x)} 236, ${f(ex)} 240, ${f(ex)} 270 V300" fill="none" stroke="#15170f" stroke-width="3" stroke-linecap="round"/>`;
  }
  down += `<rect x="40" y="290" width="300" height="20" fill="var(--lab-paper)" opacity=".75"/>`
    + txt(190, 324, 'COPPER CABLES DOWN TO THE', { size: 8 })
    + txt(190, 337, 'SERVERS IN THIS RACK', { size: 8 });

  let up = '';
  for (let i = 1; i < 16; i += 2){
    const x = LEAF.cx(i), k = (i - 1) / 2, by = 100 + k * 3;
    up += `<path d="M${f(x)} ${LEAF.top} C${f(x)} ${f(by + 20)}, ${f(x + 14)} ${f(by)}, ${f(x + 30)} ${f(by)} H${f(372 + k * 2)} V${f(134 + k * 2.2)} H400" fill="none" stroke="${AQUA}" stroke-width="1.8"/>`;
  }
  up += txt(190, 90, 'FIBRE UP TO THE SPINE', { size: 8 });

  /* ---- right column: the patch panel, the cords, the spine switch ---- */
  const SP = switchFront(400, 300, 290);
  let patch = rect(400, 126, 290, 28, '#2b2e27', '#15170f', 1, 2) + rect(395, 128, 5, 24, SILVER2) + rect(690, 128, 5, 24, SILVER2);
  const ad = (i, r) => [412 + i * 23, 130 + r * 11];
  for (let r = 0; r < 2; r++) for (let i = 0; i < 12; i++){ const [ax, ay] = ad(i, r); patch += rect(ax, ay, 12, 7, AQUA, '#2d6f6d', .6, 1); }
  patch += txt(545, 116, 'FIBRE PATCH PANEL', { size: 8 });
  let cords = '';
  const FAIL = 5;                                          // the cord that will fail, drawn whole for now
  for (let i = 0; i < 12; i++){
    const [ax, ay] = ad(i, 1), tx = SP.cx(i + 2);
    cords += `<path ${i === FAIL ? 'data-cord="fail" ' : ''}d="M${f(ax + 6)} ${f(ay + 7)} C${f(ax + 6)} 220, ${f(tx)} 250, ${f(tx)} ${SP.top}" fill="none" stroke="${AQUA}" stroke-width="1.8"/>`;
  }
  patch += cords + callout(424, 236, 404, 236, 'SHORT', { anchor: 'end', size: 8, dy: -3 })
    + txt(401, 245, 'PATCH CORDS', { anchor: 'end', size: 8 });
  let spine = SP.s;
  for (let i = 0; i < 16; i++) if (i !== FAIL + 2) spine += `<circle cx="${f(SP.cx(i) + 4)}" cy="${f(SP.top + 1)}" r="1.1" fill="var(--amber)"/>`;
  spine += `<circle cx="${f(SP.cx(FAIL + 2) + 4)}" cy="${f(SP.top + 1)}" r="1.4" fill="#0f110c" stroke="#6b6e64" stroke-width=".5"/>`
    + txt(545, 348, 'SPINE SWITCH, OFTEN THE SAME MODEL', { size: 8 });

  /* ---- the failure: one cord dead, the spare module on its way in ---- */
  const [fx, fy] = ad(FAIL, 1), ftx = SP.cx(FAIL + 2);
  const fail = `<path d="M${f(fx + 6)} ${f(fy + 7)} C${f(fx + 6)} 220, ${f(ftx)} 250, ${f(ftx)} ${SP.top}" fill="none" stroke="var(--red)" stroke-width="2.2" stroke-dasharray="5 4"/>
    <path d="M${f(ftx - 6)} 226 l12 12 m0 -12 l-12 12" stroke="var(--red)" stroke-width="2.2"/>
    ${txt(ftx - 14, 236, 'LINK DOWN', { anchor: 'end', size: 8, fill: 'var(--red)', extra: 'paint-order:stroke;stroke:var(--lab-paper);stroke-width:4px' })}
    ${osfpSide(470, 392, 110, 14)}
    ${txt(545, 426, 'A SPARE OPTICAL MODULE, SWAPPED IN', { size: 8 })}
    ${txt(545, 439, 'WHILE THE SWITCH KEEPS RUNNING', { size: 8, fill: 'var(--ink-soft)' })}`;

  return `
    ${txt(190, 66, 'A LEAF SWITCH AT THE TOP OF A RACK', { size: 9.5 })}
    ${txt(545, 66, 'IN THE SPINE RACK', { size: 9.5 })}
    <g data-k="up">${up}</g>
    <g data-k="leaf">${leaf}</g>
    <g data-k="down">${down}</g>
    <g data-k="leaf">${leafLbl}</g>
    <g data-k="patch">${patch}</g>
    <g data-k="spine">${spine}</g>
    <g data-k="fail" style="display:none">${fail}</g>`;
}

/* ======================================================================================
   5.5 — a slice across two rows of racks, and the yard outside
   ====================================================================================== */
export function siteLab(){
  /* ---- the hall: 0.085 px per mm, so a 2 m rack is 170 px and a 1.75 m visitor 149 px ---- */
  const FLOOR = 360, RT = 190, A = [60, 162], B = [264, 366];
  const rackSide = (x0, x1, frontRight) => {
    let s = rect(x0, RT, x1 - x0, FLOOR - RT, STEEL, '#15170f', 1, 1);
    for (let y = RT + 10; y < FLOOR - 4; y += 10) s += line(x0 + 4, y, x1 - 4, y, '#4b4e45', .8);
    const dx = frontRight ? x1 - 3 : x0;
    return s + rect(dx, RT, 3, FLOOR - RT, '#55594d');   // the perforated front door
  };
  let hall = rect(20, FLOOR, 386, 32, 'none', 'var(--ink)', 1.2)
    + line(20, FLOOR + 32, 406, FLOOR + 32, 'var(--ink)', 2);
  for (let x = 30; x < 400; x += 24) hall += line(x, FLOOR, x, FLOOR + 32, 'var(--hairline-strong)', .8);
  hall += rackSide(A[0], A[1], true) + rackSide(B[0], B[1], false);
  for (let x = 172; x < 256; x += 6) hall += rect(x, FLOOR - 1, 3, 2, 'var(--paper-high)');   // floor-tile holes
  hall += person(213, FLOOR, 149)
    + txt(213, 422, 'COOL AIR COMES UP THROUGH THE FLOOR TILES', { size: 8 })
    + txt(213, 440, 'DRAWN TO SCALE, WITH A 1.75 M VISITOR', { size: 8, fill: 'var(--ink-faint)' });

  let aisles = rect(A[1], RT - 6, B[0] - A[1], 6, 'rgba(255,255,255,.55)', 'var(--ink-soft)', .8)
    + txt(213, 166, 'COLD AISLE', { size: 9, cls: 'lbl-strong' })
    + txt(213, 180, '18 TO 27 °C', { size: 8 })
    + txt(44, 140, 'HOT AISLE', { size: 8, fill: 'var(--amber)' })
    + txt(382, 140, 'HOT AISLE', { size: 8, fill: 'var(--amber)' })
    + callout(250, RT - 3, 290, 112, 'CONTAINMENT ROOF', { anchor: 'start', size: 8, dy: 3 });
  const coolArrow = (x, y, dir) => `<path d="M${x} ${y} h${dir * 22}" stroke="var(--ink-soft)" stroke-width="1.2" fill="none"/>
    <path d="M${x + dir * 22} ${y - 4} l${dir * 6} 4 l${-dir * 6} 4" fill="none" stroke="var(--ink-soft)" stroke-width="1.2"/>`;
  aisles += `<path d="M196 ${FLOOR + 22} V${FLOOR + 4} M230 ${FLOOR + 22} V${FLOOR + 4}" stroke="var(--ink-soft)" stroke-width="1.2" fill="none"/>
    <path d="M192 ${FLOOR + 8} l4 -6 l4 6 M226 ${FLOOR + 8} l4 -6 l4 6" stroke="var(--ink-soft)" stroke-width="1.2" fill="none"/>`
    + coolArrow(194, 250, -1) + coolArrow(194, 300, -1) + coolArrow(232, 250, 1) + coolArrow(232, 300, 1);
  const hot = (x, dir) => `<path d="M${x} 300 q${dir * 8} -10 0 -20 t0 -20 t0 -20 t0 -20 t0 -20 t0 -20 t0 -20" fill="none" stroke="var(--amber)" stroke-width="1.4"/>
    <path d="M${x - 4} 164 l4 -6 l4 6" fill="none" stroke="var(--amber)" stroke-width="1.4"/>`;
  aisles += hot(40, 1) + hot(386, -1);

  /* ---- the yard, not to scale: grid line in, transformers, generators, cooling towers ---- */
  const pylon = `<path d="M690 96 L680 156 M690 96 L700 156 M682 110 h16 M684 124 h12 M679 104 h22" stroke="var(--ink)" stroke-width="1" fill="none"/>`;
  let power = pylon
    + `<path d="M680 104 C640 98, 620 108, 604 116" stroke="var(--amber)" stroke-width="1.6" fill="none"/>`;
  const xfmr = x => {
    let s = rect(x, 120, 62, 40, '#8e9187', '#55594d', 1, 2);
    for (let i = 0; i < 8; i++) s += line(x + 6 + i * 7, 124, x + 6 + i * 7, 156, '#6f726a', 2);
    s += rect(x + 10, 108, 42, 9, '#a9aca3', '#55594d', .8, 4);
    [16, 31, 46].forEach(dx => { for (let k = 0; k < 4; k++) s += rect(x + dx - 3, 111 - k * 4 - 4, 6, 3.2, '#d9d7c7', '#6f726a', .6, 1.5); });
    return s;
  };
  power += xfmr(470) + xfmr(546)
    + `<path d="M470 140 H444" stroke="var(--amber)" stroke-width="1.6" fill="none"/>`
    + txt(572, 180, 'SUBSTATION TRANSFORMERS', { size: 8 });
  const gen = x => {
    let s = rect(x, 232, 62, 34, '#5f6258', '#2c2f28', 1, 2);
    for (let i = 0; i < 6; i++) s += line(x + 8 + i * 4, 238, x + 8 + i * 4, 260, '#2c2f28', 1.4);
    s += rect(x + 40, 222, 6, 10, '#3b3e36') + rect(x + 38, 220, 10, 3, '#3b3e36');
    return s + rect(x - 2, 266, 66, 6, '#3b3e36');
  };
  power += gen(448) + gen(520) + gen(592) + person(672, 272, 22)
    + txt(560, 290, 'DIESEL GENERATORS (FIGURE FOR SCALE)', { size: 8 });

  const tower = x => {
    let s = rect(x, 346, 74, 56, '#b9bcb3', '#55594d', 1, 2);
    for (let i = 0; i < 6; i++) s += line(x + 4, 352 + i * 8, x + 70, 352 + i * 8, '#8e9187', 1.6);
    s += rect(x + 15, 334, 44, 12, '#a9aca3', '#55594d', 1, 2)
      + `<ellipse cx="${x + 37}" cy="334" rx="22" ry="4" fill="#8e9187" stroke="#55594d"/>`;
    return s + `<path d="M${x + 30} 326 q-5 -7 0 -14 t0 -14 M${x + 44} 326 q5 -7 0 -14 t0 -14" stroke="var(--amber)" stroke-width="1.2" fill="none"/>`;
  };
  const cooling = tower(470) + tower(570) + txt(572, 424, 'COOLING TOWERS', { size: 8 })
    + txt(572, 438, 'WARM WATER IN, SOME OF IT EVAPORATES', { size: 8, fill: 'var(--ink-soft)' });

  return `
    ${txt(213, 74, 'INSIDE A HALL: A SLICE ACROSS TWO ROWS', { size: 9.5 })}
    ${txt(572, 74, 'OUTSIDE, IN THE YARD', { size: 9.5 })}
    ${divider(424)}
    <g data-k="hall">${hall}</g>
    <g data-k="aisles">${aisles}</g>
    <g data-k="power">${power}</g>
    <g data-k="cooling">${cooling}</g>`;
}
