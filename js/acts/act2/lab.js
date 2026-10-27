// ACT 2 — drawings for the "In the Lab" sections (DESIGN.md §6d rule 8).
// Each builder returns an SVG string for slideInPanel(svg, html, { lab: true }). Parts a card
// talks about are wrapped in <g data-k="…"> so panel.focus(key) lights one of them; parts that
// change between two cards sit in <g class="st-on"> / <g class="st-off">, switched by
// setLabState() from js/engine/labcircuits.js.
//
// The breadboards are built the way a student builds them: a 5 V bench supply on the top rails
// (the − rail is ground), two long wires at the right-hand end carrying + and ground down to
// the bottom rails, chips straddling the centre channel, input wires to + (amber) or ground
// (ink), and every LED in series with a resistor to ground. Signal wires are flat pre-cut
// jumpers, drawn as grey polylines, routed so that no two cross.
//
// Facts drawn here, and where they come from (checked 2026-10-19):
//   74HC00 pins: 1A 1, 1B 2, 1Y 3, 2A 4, 2B 5, 2Y 6, GND 7,      TI SN74HC00 / CD74HC00 data
//     3Y 8, 3A 9, 3B 10, 4Y 11, 4A 12, 4B 13, VCC 14;            sheets; PDIP-14 body 19.30 mm
//     outputs buffered (extra stages after the NAND)            onsemi MM74HC00, ST M74HC00
//   74HC283 pins: S2 1, B2 2, A2 3, S1 4, A1 5, B1 6, CIN 7,     Philips/NXP 74HC283 (pin table),
//     GND 8, COUT 9, S4 10, B4 11, A4 12, S3 13, A3 14, B3 15,   ST M74HC283 (COUT = C4 pin 9);
//     VCC 16; "full internal lookahead"; PDIP-16 19.31 mm       TI CD74HC283 (SCHS176E)
//   74HC279 pins: 1R 1, 1S1 2, 1S2 3, 1Q 4, 2R 5, 2S 6, 2Q 7,    Renesas HD74HC279 pin
//     GND 8, 3Q 9, 3R 10, 3S1 11, 3S2 12, 4Q 13, 4R 14, 4S 15,   arrangement; S, R active low:
//     VCC 16; S low sets Q high, R low clears Q low              Toshiba TC74HC279A
//   74HC173 pins: OE1 1, OE2 2, Q0-Q3 3-6, CP 7, GND 8,          TI CD74HC173 (SCHS158F) truth
//     E1 9, E2 10, D3-D0 11-14, MR 15, VCC 16; loads on the      table: data loads on the rising
//     rising clock edge when E1 = E2 = low                       edge of CP; ST M74HC173 pins
//   NE555 pins: GND 1, TRIG 2, OUT 3, RESET 4, CONT 5, THRES 6,   TI NE555 (SLFS022K): astable
//     DISCH 7, VCC 8; tH = 0.693 (RA + RB) C, tL = 0.693 RB C    equations (1) to (4); PDIP-8
//     -> 1 kΩ, 68 kΩ, 10 µF give tH 0.48 s, tL 0.47 s, T 0.95 s  9.81 mm
//   Raspberry Pi Pico: RP2040, two Arm Cortex-M0+ CPUs up to     raspberrypi.com Pico-series
//     133 MHz, 264 kB SRAM, 2 MB flash, 40 edge pins, LED on      documentation; board 51 × 21 mm
//     GP25, micro-USB; launched January 2021 at 4 US dollars     (Pico datasheet)
import { dip, labBoard, jumper, resistorTop, ledTop, HALO } from '../../engine/reallife.js';

const P = 16;                                    // breadboard pitch on the stage, px per hole
const SIG = '#7a7d70', SIG2 = '#9a9686';         // signal jumpers: two greys, never a meaning
const BODY = 'fill="#262822" stroke="#45483e" stroke-width="1"';
const PRINT = 'fill:#b9b9ae;letter-spacing:.04em';
const LEAD = '#c9c9c0', LEAD_DARK = '#8e8f86';
const f = v => (+v).toFixed(1);

/* ---------- text ---------- */
/* a name with an overbar on each character written after "!", e.g. "2!S" → 2S̄. The bar is
   drawn with text-decoration, which Chrome renders on SVG tspans. */
export const nm = s => s.replace(/!(\w)/g, '<tspan style="text-decoration:overline">$1</tspan>');

export function txt(x, y, s, { size = 8, anchor = 'middle', fill = 'var(--ink)', halo = false, cls = 'lbl', extra = '' } = {}){
  const style = (halo ? HALO : `fill:${fill}`) + `;font-size:${size}px;${extra}`;
  return `<text x="${f(x)}" y="${f(y)}" class="${cls}" text-anchor="${anchor}" style="${style}">${s}</text>`;
}
const caption = s => `<text x="360" y="452" class="lbl-faint">${s}</text>`;

/* ---------- breadboard pieces ---------- */

/* the standard board, plus the two long wires at the right that carry + and ground to the
   bottom rails, so parts in the lower half can reach them too */
function board(){
  const b = labBoard({ x: 116, y: 92, cols: 30, p: P });
  const h = b.hole;
  b.svg += jumper(h(28, 'T+'), h(28, 'B+'), 'var(--amber)', 0) + jumper(h(29, 'T-'), h(29, 'B-'), 'var(--ink)', 0);
  return b;
}

/* a DIP chip pushed into the board across the centre channel, its pin 1 in column c0. col(i)
   is the column pin i sits in; pins 1 to n/2 sit in row f, the rest in row e. */
function chipOn(b, c0, n, text){
  const h = b.hole;
  const mid = (h(c0, 'e')[1] + h(c0, 'f')[1]) / 2;
  const chip = dip({ x: h(c0, 'f')[0] - P / 2, y: mid - 1.25 * P, n, p: P, text });
  const col = i => i <= n / 2 ? c0 + i - 1 : c0 + n - i;
  return { svg: chip.svg, col };
}

/* a flat pre-cut jumper: a polyline through hole positions, with a dot at each end */
function flat(pts, colour = SIG){
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${f(p[0])} ${f(p[1])}`).join(' ');
  const [a, z] = [pts[0], pts[pts.length - 1]];
  return `<path d="${d}" fill="none" stroke="${colour}" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round" opacity=".9"/>
    <circle cx="${f(a[0])}" cy="${f(a[1])}" r="2.4" fill="#8e8f86"/><circle cx="${f(z[0])}" cy="${f(z[1])}" r="2.4" fill="#8e8f86"/>`;
}
/* a straight wire to a rail: amber to +, ink to ground */
const toRail = (a, b, plus) => jumper(a, b, plus ? 'var(--amber)' : 'var(--ink)', 0);

/* a 3 mm LED lying across two holes (anode first), lit glows amber */
const led3 = (an, ca, lit) => ledTop(an, ca, { lit, p: 10, label: '' });

/* a 6 mm push button straddling the centre channel: its left legs sit in column c (rows e
   and f), its right legs in column c + 2; pressing it joins the two columns */
function buttonOn(b, c){
  const h = b.hole;
  const [x1, ye] = h(c, 'e'), [x2, yf] = [h(c + 2, 'f')[0], h(c, 'f')[1]];
  const cx = (x1 + x2) / 2, cy = (ye + yf) / 2, s = 6 / 2.54 * P;
  const legs = [[x1, ye], [x2, ye], [x1, yf], [x2, yf]].map(([x, y]) =>
    `<line x1="${f(x)}" y1="${f(y)}" x2="${f(x + (x < cx ? 3 : -3))}" y2="${f(y + (y < cy ? 4 : -4))}" stroke="${LEAD_DARK}" stroke-width="2.2"/>
     <circle cx="${f(x)}" cy="${f(y)}" r="2.2" fill="${LEAD_DARK}"/>`).join('');
  return legs + `<rect x="${f(cx - s / 2)}" y="${f(cy - s / 2)}" width="${f(s)}" height="${f(s)}" rx="2" fill="#2f322b" stroke="#55594d"/>
    <rect x="${f(cx - s / 2 + 3)}" y="${f(cy - s / 2 + 3)}" width="${f(s - 6)}" height="${f(s - 6)}" rx="1.5" fill="${LEAD}" stroke="${LEAD_DARK}" stroke-width=".8"/>
    <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(s * .3)}" fill="#1f211c" stroke="#45483e"/>`;
}

/* an electrolytic capacitor from above: a black can with a silver top, a grey stripe on its
   negative side, standing in two holes */
function elecCap(plus, minus, text){
  const cx = (plus[0] + minus[0]) / 2, cy = (plus[1] + minus[1]) / 2, r = P * .98;
  return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="#262822" stroke="#45483e"/>
    <path d="M${f(cx - r * .55)} ${f(cy - r * .83)} A${f(r)} ${f(r)} 0 0 1 ${f(cx + r * .55)} ${f(cy - r * .83)}" fill="none" stroke="#9a9b92" stroke-width="4"/>
    <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * .62)}" fill="${LEAD}" stroke="${LEAD_DARK}" stroke-width=".8"/>
    <path d="M${f(cx - r * .4)} ${f(cy)} H${f(cx + r * .4)} M${f(cx)} ${f(cy - r * .4)} V${f(cy + r * .4)}" stroke="${LEAD_DARK}" stroke-width=".9"/>`
    + (text ? txt(cx, cy + r + 9, text, { size: 7, halo: true }) : '');
}
/* a small ceramic disc capacitor, seen edge-on from above, printed with its value code */
function discCap(a, b, code){
  const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2;
  return `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${LEAD_DARK}" stroke-width="2"/>
    <rect x="${f(cx - 9)}" y="${f(cy - 5)}" width="18" height="10" rx="5" fill="#c9a45c" stroke="#8f7134"/>
    <text x="${f(cx)}" y="${f(cy + 2.5)}" class="lbl" style="font-size:6px;fill:#4a3a18;letter-spacing:0">${code}</text>`;
}

/* ---------- the part, and its datasheet pinout ---------- */

/* left half: the real chip, about 2.3 times life size, with its length, notch and pin 1 dot.
   right half: the datasheet's top view, every pin numbered, names inside the outline. */
function partAndPinout({ n, text, mm, names = null, inner = '', title, pinTitle, pp }){
  const half = n / 2, pr = 20;
  const L = half * pr, x = 186 - L / 2, y = 196;
  const chip = dip({ x, y, n, p: pr, text });
  const W = 2.5 * pr, dimY = y + W + pr * .3 + 26;
  const part = `<g data-k="part">${chip.svg}
    <path d="M${x} ${dimY - 5} V${dimY + 5} M${x + L} ${dimY - 5} V${dimY + 5} M${x} ${dimY} H${x + L}" stroke="var(--ink-soft)" stroke-width=".9"/>
    ${txt(x + L / 2, dimY + 16, `${mm} LONG`, { size: 8.5 })}
    ${txt(x - 8, y + W / 2 + 3, 'NOTCH', { anchor: 'end', size: 8 })}
    <line x1="${f(chip.dot[0])}" y1="${f(chip.dot[1])}" x2="${f(x - 6)}" y2="${f(y + W + 18)}" stroke="var(--ink-soft)" stroke-width=".8"/>
    ${txt(x - 9, y + W + 21, 'PIN 1 DOT', { anchor: 'end', size: 8 })}</g>`;

  /* the pinout: pp px per pin, box height BW */
  const BW = 108, L2 = half * pp, X = 548 - L2 / 2, Y = 188;
  const px = i => i <= half ? X + (i - .5) * pp : X + (n - i + .5) * pp;
  let pins = '', labels = '';
  for (let i = 1; i <= n; i++){
    const bottom = i <= half, xx = px(i);
    pins += `<rect x="${f(xx - 6)}" y="${bottom ? Y + BW : Y - 12}" width="12" height="12" fill="${LEAD}" stroke="${LEAD_DARK}" stroke-width=".8"/>`
      + txt(xx, bottom ? Y + BW + 26 : Y - 18, String(i), { size: 9 });
    if (names) labels += txt(xx, bottom ? Y + BW - 9 : Y + 18, nm(names[i]), { size: 8.5, extra: 'letter-spacing:0' });
  }
  const pinout = `<g data-k="pinout">${pins}
    <rect x="${f(X)}" y="${Y}" width="${f(L2)}" height="${BW}" rx="4" fill="#f7f3e8" stroke="var(--ink)" stroke-width="1.4"/>
    <path d="M${f(X)} ${Y + BW / 2 - 11} A11 11 0 0 1 ${f(X)} ${Y + BW / 2 + 11}" fill="none" stroke="var(--ink)" stroke-width="1.4"/>
    ${labels}${inner ? inner({ px, X, Y, BW, pp }) : ''}
    ${txt(px(n), Y - 34, '+5 V', { size: 8.5, fill: 'var(--amber)' })}
    ${txt(px(half), Y + BW + 41, 'GROUND', { size: 8.5 })}</g>`;
  return `${txt(186, 66, title, { size: 9.5 })}${txt(548, 66, pinTitle, { size: 9.5 })}
    <line x1="352" y1="54" x2="352" y2="420" stroke="var(--hairline)" stroke-dasharray="3 4"/>
    ${part}${pinout}`;
}

/* ================= 2.1 — the 74HC00 ================= */

/* four NAND symbols inside the 74HC00 outline, wired to their pins the datasheet's way */
function nandInner({ px, Y, BW }){
  const gate = (a, b, o, bottom, k) => {
    const xa = px(a), xb = px(b), xo = px(o), edge = bottom ? Y + BW : Y;
    const yG = bottom ? edge - 36 : edge + 36, gl = xb + 8;
    const ya = bottom ? yG - 6 : yG + 6, yb = bottom ? yG + 6 : yG - 6;
    return `<g data-k="${k}">
      <path d="M${f(xa)} ${edge} V${ya} H${f(gl)} M${f(xb)} ${edge} V${yb} H${f(gl)}" fill="none" stroke="var(--ink-soft)" stroke-width="1.2"/>
      <path d="M${f(gl)} ${yG - 11} H${f(gl + 11)} A11 11 0 0 1 ${f(gl + 11)} ${yG + 11} H${f(gl)} Z" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.3"/>
      <circle cx="${f(gl + 25.2)}" cy="${yG}" r="3.2" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.3"/>
      <path d="M${f(gl + 28.4)} ${yG} H${f(xo)} V${edge}" fill="none" stroke="var(--ink-soft)" stroke-width="1.2"/></g>`;
  };
  return gate(1, 2, 3, true, 'g1') + gate(4, 5, 6, true, 'g2') + gate(13, 12, 11, false, 'g3') + gate(10, 9, 8, false, 'g4')
    + txt(px(4) - 22, Y + BW / 2 + 4, 'FOUR NAND GATES', { cls: 'lbl-faint', size: 8 });
}

export function lab21Part(){
  return partAndPinout({ n: 14, text: '74HC00N', mm: '19.3 MM', inner: nandInner, pp: 44,
    title: 'THE PART', pinTitle: 'INSIDE THE 74HC00' })
    + caption('THE NAND GATE, SOLD AS A PART');
}

/* gate 1 on a breadboard: 74HC00 in columns 9 to 15. Pin 14 to +, pin 7 to ground, inputs
   1A (pin 1) and 1B (pin 2) by wire to + or ground, output 1Y (pin 3) along row g to a 3 mm
   LED and a 1 kΩ resistor to ground. On: both inputs on +, output 0, LED dark. Off: 1B moved
   to ground, output 1, LED lit. */
export function lab21Board(){
  const b = board(), h = b.hole, c = chipOn(b, 9, 14, '74HC00');
  const both = (on, off) => `<g class="st-on">${on}</g><g class="st-off" style="display:none">${off}</g>`;
  const [ax, bx] = [h(9, 'j')[0], h(10, 'j')[0]];
  return `${b.svg}
    ${toRail(h(9, 'a'), h(9, 'T+'), true)}
    ${toRail(h(15, 'j'), h(15, 'B-'), false)}
    ${c.svg}
    ${toRail(h(9, 'j'), h(9, 'B+'), true)}
    ${both(toRail(h(10, 'j'), h(10, 'B+'), true), toRail(h(10, 'j'), h(10, 'B-'), false))}
    ${flat([h(11, 'g'), h(18, 'g')])}
    ${both(led3(h(18, 'i'), h(19, 'i'), false), led3(h(18, 'i'), h(19, 'i'), true))}
    ${resistorTop(h(19, 'j'), h(19, 'B-'), { p: P })}
    ${txt(ax, 392, 'A', { size: 9 })}${txt(bx, 392, 'B', { size: 9 })}
    ${txt((ax + bx) / 2, 406, 'INPUT WIRES', { size: 7.5 })}
    ${txt(h(14.5, 'g')[0], h(14.5, 'g')[1] - 8, 'FROM PIN 3', { size: 7.5, halo: true })}
    ${txt(h(19, 'i')[0] + 18, h(19, 'i')[1] + 3, 'LED', { anchor: 'start', size: 8, halo: true })}
    ${txt(h(19, 'j')[0] + 10, h(19, 'B-')[1] - 8, '1 kΩ', { anchor: 'start', size: 8, halo: true })}
    ${caption('GATE 1 OF THE 74HC00, ON A BREADBOARD')}`;
}

/* ================= 2.2 — the 74HC283 ================= */

const N283 = [null, 'S2', 'B2', 'A2', 'S1', 'A1', 'B1', 'CIN', 'GND', 'COUT', 'S4', 'B4', 'A4', 'S3', 'A3', 'B3', 'VCC'];

export function lab22Part(){
  return partAndPinout({ n: 16, text: '74HC283N', mm: '19.3 MM', names: N283, pp: 38,
    inner: ({ X, Y, BW, pp }) => txt(X + 4 * pp, Y + BW / 2 + 4, '4-BIT ADDER', { cls: 'lbl-faint', size: 8.5 }),
    title: 'THE PART', pinTitle: 'ITS PINS' })
    + caption('THE FOUR-BIT ADDER, SOLD AS A PART');
}

/* 5 + 3 on a breadboard: 74HC283 in columns 9 to 16. Inputs are wires to + (1) or ground (0):
   A = 0101 (A1 and A3 on +), B = 0011 (B1 and B2 on +), carry in on ground. The five outputs
   run to five 3 mm LEDs in the lower half, in place-value order 16 8 4 2 1 (COUT, S4, S3, S2,
   S1), each with a 1 kΩ resistor to ground. The top outputs come round the end of the chip
   and drop across the channel; the bottom outputs run along rows g and h. Nothing crosses. */
export function lab22Board(){
  const b = board(), h = b.hole, c = chipOn(b, 9, 16, '74HC283');
  const col = c.col;
  const top = (pin, plus) => toRail(h(col(pin), 'a'), h(col(pin), plus ? 'T+' : 'T-'), plus);
  const bot = (pin, plus) => toRail(h(col(pin), 'j'), h(col(pin), plus ? 'B+' : 'B-'), plus);
  /* LED units: anode column X (rows f to j), cathode X + 1, resistor X + 1 → − rail */
  const UNITS = [{ X: 18, pin: 9, w: 16 }, { X: 20, pin: 10, w: 8 }, { X: 22, pin: 13, w: 4 }, { X: 24, pin: 1, w: 2 }, { X: 26, pin: 4, w: 1 }];
  const SUM = 8;
  const units = UNITS.map(u => led3(h(u.X, 'i'), h(u.X + 1, 'i'), !!(SUM & u.w))
    + resistorTop(h(u.X + 1, 'j'), h(u.X + 1, 'B-'), { p: P })
    + txt(h(u.X, 'i')[0] + P / 2, 392, String(u.w), { size: 9 })).join('');
  /* routes: top outputs along rows d, c, b, round the chip's end, down to row f */
  const dropTo = (pin, row, X) => flat([h(col(pin), row), h(X, row), h(X, 'f')], SIG);
  const wires = dropTo(9, 'd', 18) + dropTo(10, 'c', 20) + dropTo(13, 'b', 22)
    + flat([h(col(1), 'g'), h(24, 'g')], SIG2) + flat([h(col(4), 'h'), h(26, 'h')], SIG2);
  const inputs = top(15, false) + top(14, true) + top(12, false) + top(11, false)
    + bot(2, true) + bot(3, false) + bot(5, true) + bot(6, true) + bot(7, false);
  const name = (pin, y) => txt(h(col(pin), 'a')[0], y, N283[pin], { size: 7, extra: 'letter-spacing:0' });
  const names = [15, 14, 12, 11].map(p => name(p, 87)).join('') + [2, 3, 5, 6, 7].map(p => name(p, 388)).join('');
  return `${b.svg}
    ${top(16, true)}${bot(8, false)}
    <g data-k="inputs">${inputs}${names}</g>
    ${c.svg}
    <g data-k="outputs">${wires}${units}
      ${txt(h(22, 'i')[0] + P / 2, 406, 'COUT, THEN S4 S3 S2 S1', { size: 7.5 })}</g>
    ${txt(300, 62, 'A = 0101 (5), B = 0011 (3), CARRY IN = 0', { size: 8 })}
    ${caption('5 + 3 ON A 74HC283')}`;
}

/* ================= 2.3 — the 74HC279 and the 74HC173 ================= */

const N279 = [null, '1!R', '1!S1', '1!S2', '1Q', '2!R', '2!S', '2Q', 'GND', '3Q', '3!R', '3!S1', '3!S2', '4Q', '4!R', '4!S', 'VCC'];
const N173 = [null, '!O!E1', '!O!E2', 'Q0', 'Q1', 'Q2', 'Q3', 'CP', 'GND', '!E1', '!E2', 'D3', 'D2', 'D1', 'D0', 'MR', 'VCC'];

export function lab23Part(){
  return partAndPinout({ n: 16, text: '74HC279N', mm: '19.3 MM', names: N279, pp: 38,
    inner: ({ X, Y, BW, pp }) => txt(X + 4 * pp, Y + BW / 2 + 4, 'FOUR SR LATCHES', { cls: 'lbl-faint', size: 8.5 }),
    title: 'THE PART', pinTitle: 'ITS PINS' })
    + caption('THE SR LATCH, SOLD AS A PART');
}

export function lab23Register(){
  return partAndPinout({ n: 16, text: '74HC173N', mm: '19.3 MM', names: N173, pp: 38,
    inner: ({ X, Y, BW, pp }) => txt(X + 4 * pp, Y + BW / 2 + 4, '4-BIT REGISTER', { cls: 'lbl-faint', size: 8.5 }),
    title: 'THE PART', pinTitle: 'ITS PINS' })
    + caption('A FOUR-BIT REGISTER, SOLD AS A PART');
}

/* latch 2 of a 74HC279 on a breadboard, chip in columns 10 to 17: R̄ pin 5 (col 14), S̄ pin 6
   (col 15), Q pin 7 (col 16), GND pin 8 (col 17), VCC pin 16 (col 10). A 10 kΩ resistor from
   each input to the + rail holds it at 5 V. Each button straddles the channel: one side is
   wired to its input, the other to ground, so a press pulls that input to 0 V. Q runs along
   row i to a 3 mm LED and a 1 kΩ resistor to ground. On: a 1 is stored, LED lit. Off: a 0. */
export function lab23Board(){
  const b = board(), h = b.hole, c = chipOn(b, 10, 16, '74HC279');
  const both = (on, off) => `<g class="st-on">${on}</g><g class="st-off" style="display:none">${off}</g>`;
  const pull = cc => resistorTop(h(cc, 'j'), h(cc, 'B+'), { p: P });
  return `${b.svg}
    ${toRail(h(10, 'a'), h(10, 'T+'), true)}
    ${toRail(h(17, 'j'), h(17, 'B-'), false)}
    ${c.svg}
    ${pull(14)}${pull(15)}
    ${flat([h(14, 'h'), h(3, 'h')])}
    ${buttonOn(b, 3)}${toRail(h(5, 'j'), h(5, 'B-'), false)}
    ${flat([h(15, 'g'), h(20, 'g')])}
    ${buttonOn(b, 20)}${toRail(h(22, 'j'), h(22, 'B-'), false)}
    ${flat([h(16, 'i'), h(25, 'i')], SIG2)}
    ${both(led3(h(25, 'g'), h(26, 'g'), true), led3(h(25, 'g'), h(26, 'g'), false))}
    ${resistorTop(h(26, 'i'), h(26, 'B-'), { p: P })}
    ${txt(h(4, 'd')[0], h(4, 'd')[1] + 2, 'R BUTTON, PIN 5', { size: 8, halo: true })}
    ${txt(h(21, 'd')[0], h(21, 'd')[1] + 2, 'S BUTTON, PIN 6', { size: 8, halo: true })}
    ${txt(h(14.5, 'j')[0], 392, '10 kΩ TO +5 V', { size: 7.5 })}
    ${txt(h(25.5, 'g')[0], h(25, 'g')[1] - 16, 'LED (Q)', { size: 8, halo: true })}
    ${txt(h(26, 'i')[0] + 10, h(26, 'B-')[1] - 12, '1 kΩ', { anchor: 'start', size: 8, halo: true })}
    ${caption('LATCH 2 OF THE 74HC279, ON A BREADBOARD')}`;
}

/* ================= 2.4 — a 555 clock, a breadboard computer, a Pico ================= */

/* an NE555 astable on a breadboard, chip in columns 10 to 13. RA = 1 kΩ from + to DISCH (pin 7),
   RB = 68 kΩ from DISCH to column 16, where THRES (pin 6) and TRIG (pin 2) meet the 10 µF
   capacitor to ground. CONT (pin 5) has 10 nF to ground, RESET (pin 4) is tied to +. OUT
   (pin 3) runs along row i to a 3 mm LED and 1 kΩ to ground. The LED group carries class
   "blink-on" / "blink-off" so the step can blink it. */
export function lab24Clock(){
  const b = board(), h = b.hole, c = chipOn(b, 10, 8, 'NE555');
  return `${b.svg}
    ${toRail(h(10, 'a'), h(10, 'T+'), true)}
    ${resistorTop(h(11, 'a'), h(11, 'T+'), { p: P })}
    ${discCap(h(13, 'a'), h(13, 'T-'), '103')}
    ${resistorTop(h(11, 'c'), h(16, 'c'), { p: P })}
    ${flat([h(12, 'd'), h(16, 'd')])}
    ${elecCap(h(16, 'a'), h(16, 'T-'))}
    ${flat([h(16, 'e'), h(16, 'f')])}
    ${c.svg}
    ${flat([h(11, 'g'), h(16, 'g')])}
    ${toRail(h(10, 'j'), h(10, 'B-'), false)}
    ${toRail(h(13, 'j'), h(13, 'B+'), true)}
    ${flat([h(12, 'i'), h(20, 'i')], SIG2)}
    <g class="blink-on">${led3(h(20, 'g'), h(21, 'g'), true)}</g>
    <g class="blink-off" style="display:none">${led3(h(20, 'g'), h(21, 'g'), false)}</g>
    ${resistorTop(h(21, 'i'), h(21, 'B-'), { p: P })}
    ${txt(h(11, 'T+')[0] - 4, 80, 'RA 1 kΩ', { anchor: 'end', size: 8 })}
    <line x1="${h(11, 'T+')[0] - 2}" y1="83" x2="${h(11, 'T+')[0]}" y2="${h(11, 'T+')[1] + 4}" stroke="var(--ink-soft)" stroke-width=".8"/>
    ${txt(h(13, 'T-')[0] + 2, 80, '10 nF', { anchor: 'start', size: 8 })}
    <line x1="${h(13, 'T-')[0] + 4}" y1="83" x2="${h(13, 'T-')[0]}" y2="${h(13, 'T-')[1] - 4}" stroke="var(--ink-soft)" stroke-width=".8"/>
    ${txt(h(17, 'T-')[0] + 4, 80, '10 µF CAPACITOR', { anchor: 'start', size: 8 })}
    <line x1="${h(17, 'T-')[0] + 6}" y1="83" x2="${h(16.6, 'T-')[0]}" y2="${h(16, 'T-')[1] - 2}" stroke="var(--ink-soft)" stroke-width=".8"/>
    ${txt(h(13.5, 'c')[0], h(13.5, 'c')[1] - 9, 'RB 68 kΩ', { size: 7.5, halo: true })}
    ${txt(h(20.5, 'g')[0], h(20, 'g')[1] - 14, 'LED', { size: 8, halo: true })}
    ${txt(h(21, 'i')[0] + 10, h(21, 'B-')[1] - 12, '1 kΩ', { anchor: 'start', size: 8, halo: true })}
    ${txt(h(16.5, 'j')[0], h(16.5, 'j')[1] + 3, 'FROM PIN 3', { size: 7.5, halo: true })}
    ${caption('A 555 TIMER WIRED AS A ONE-HERTZ CLOCK')}`;
}

/* a hobbyist's breadboard 8-bit computer, drawn generically: two rows of four boards, each
   one module with its chips and a row of eight LEDs; then a Raspberry Pi Pico, drawn plainly
   with no logo, 51 × 21 mm at 5 px per mm */
export function lab24Computers(){
  const LIT = [[1,0,1,1,0,0,1,0],[0,0,0,0,1,1,0,1],[1,1,0,0,0,1,0,0],[0,1,1,0,1,0,0,1],
               [0,0,1,0,1,1,1,0],[1,0,0,1,0,0,1,1],[0,1,0,0,1,0,1,0],[1,0,0,0,0,0,0,0]];
  const NAMES = ['CLOCK', 'PROGRAM COUNTER', 'MEMORY', 'INSTRUCTIONS', 'REGISTER A', 'ADDER', 'REGISTER B', 'OUTPUT'];
  const BW = 152, BH = 74, X0 = 50, Y0 = 82, GX = 4, GY = 26;
  let boards = '';
  NAMES.forEach((name, k) => {
    const x = X0 + (k % 4) * (BW + GX), y = Y0 + Math.floor(k / 4) * (BH + GY);
    let holes = '';
    for (let r = 0; r < 2; r++) for (let i = 0; i < 18; i++)
      holes += `<rect x="${f(x + 8 + i * 8)}" y="${f(y + 6 + r * 5)}" width="2" height="2" fill="#8d8e84"/>`;
    const chips = (k === 0 ? [40] : k === 2 ? [30, 66] : k === 5 ? [24, 60] : [36, 72]).map((cx, j) =>
      `<rect x="${x + cx}" y="${y + 24}" width="${k === 2 && j === 1 ? 46 : 34}" height="13" rx="1.5" ${BODY}/>`).join('');
    const leds = LIT[k].map((on, i) => `<circle cx="${f(x + 22 + i * 15)}" cy="${y + 54}" r="4.2"
        fill="${on ? 'rgba(168,116,31,.8)' : 'rgba(214,130,58,.18)'}" stroke="#a5642a" stroke-width=".8"/>`).join('');
    const wires = `<path d="M${x + 12} ${y + 10} q 10 14 22 18 M${x + BW - 14} ${y + 10} q -8 16 -18 20" fill="none" stroke="${SIG}" stroke-width="1.6"/>
      <path d="M${x + 6} ${y + 8} V${y + 64}" stroke="var(--amber)" stroke-width="1.2"/>`;
    boards += `<rect x="${x}" y="${y}" width="${BW}" height="${BH}" rx="3" fill="#faf8f1" stroke="var(--hairline-strong)"/>
      ${holes}${wires}${chips}${leds}
      ${txt(x + BW / 2, y + BH + 12, name, { size: 7.5 })}`;
  });
  const computer = `<g data-k="computer">${txt(360, 66, 'A BREADBOARD 8-BIT COMPUTER', { size: 9.5 })}${boards}</g>`;

  /* the Pico: green board, 20 edge holes a side, micro-USB on the left, the RP2040 in the middle */
  const k = 5, PX = 232, PY = 300, PW = 51 * k, PH = 21 * k;
  let pads = '';
  for (let i = 0; i < 20; i++){
    const x = PX + (1.37 + i * 2.54) * k;
    pads += `<circle cx="${f(x)}" cy="${f(PY + 1.6 * k)}" r="3.6" fill="#1c2b20" stroke="${LEAD}" stroke-width="1.6"/>
      <circle cx="${f(x)}" cy="${f(PY + PH - 1.6 * k)}" r="3.6" fill="#1c2b20" stroke="${LEAD}" stroke-width="1.6"/>`;
  }
  const pico = `<g data-k="pico">
    ${txt(360, 284, 'A RASPBERRY PI PICO BOARD', { size: 9.5 })}
    <rect x="${PX}" y="${PY}" width="${PW}" height="${PH}" rx="4" fill="#2f5a3c" stroke="#203e29" stroke-width="1.2"/>
    <rect x="${PX - 6}" y="${PY + PH / 2 - 4 * k}" width="${7 * k}" height="${8 * k}" rx="1.5" fill="${LEAD}" stroke="${LEAD_DARK}"/>
    <rect x="${PX - 4}" y="${PY + PH / 2 - 1.6 * k}" width="${3 * k}" height="${3.2 * k}" fill="#3a3d35"/>
    ${pads}
    <rect x="${PX + 12 * k}" y="${PY + 5.2 * k}" width="${4 * k}" height="${3.4 * k}" rx="1" fill="#f1efe6" stroke="#9a9b92"/>
    <circle cx="${PX + 14 * k}" cy="${PY + 6.9 * k}" r="${1.1 * k}" fill="#d9d6c9" stroke="#9a9b92"/>
    <rect x="${PX + 9.5 * k}" y="${PY + 13.5 * k}" width="${1.6 * k}" height="${0.9 * k}" fill="#e8e3cf" stroke="#9a9b92" stroke-width=".6"/>
    <rect x="${PX + 16 * k}" y="${PY + 11.5 * k}" width="${5 * k}" height="${4 * k}" rx=".8" ${BODY}/>
    <rect x="${PX + 22.5 * k}" y="${PY + 7 * k}" width="${7 * k}" height="${7 * k}" rx="1" ${BODY}/>
    <text x="${PX + 26 * k}" y="${PY + 11 * k}" class="lbl" style="font-size:7px;${PRINT}">RP2040</text>
    <rect x="${PX + 31.5 * k}" y="${PY + 12.5 * k}" width="${3.2 * k}" height="${2.5 * k}" rx=".6" fill="${LEAD}" stroke="${LEAD_DARK}" stroke-width=".7"/>
    ${[0, 1, 2].map(i => `<circle cx="${PX + PW - 2.4 * k}" cy="${f(PY + (8 + i * 2.54) * k)}" r="2.6" fill="#1c2b20" stroke="${LEAD}" stroke-width="1.2"/>`).join('')}
    <path d="M${PX} ${PY + PH + 14} V${PY + PH + 24} M${PX + PW} ${PY + PH + 14} V${PY + PH + 24} M${PX} ${PY + PH + 19} H${PX + PW}" stroke="var(--ink-soft)" stroke-width=".9"/>
    ${txt(PX + PW / 2, PY + PH + 34, '51 MM LONG', { size: 8.5 })}
    <line x1="${PX + 26 * k}" y1="${PY + 7 * k}" x2="${PX + PW + 34}" y2="${PY + 18}" stroke="var(--ink-soft)" stroke-width=".8"/>
    ${txt(PX + PW + 38, PY + 21, 'RP2040 CHIP', { anchor: 'start', size: 8.5 })}
    <line x1="${PX - 8}" y1="${PY + PH / 2}" x2="${PX - 40}" y2="${PY + PH / 2}" stroke="var(--ink-soft)" stroke-width=".8"/>
    ${txt(PX - 44, PY + PH / 2 + 3, 'USB', { anchor: 'end', size: 8.5 })}
    <line x1="${PX + 10.3 * k}" y1="${PY + 14.4 * k}" x2="${PX + 10.3 * k}" y2="${PY + PH + 8}" stroke="var(--ink-soft)" stroke-width=".8"/>
    ${txt(PX + 10.3 * k - 4, PY + PH + 11, 'LED', { anchor: 'end', size: 8 })}</g>`;
  return `${computer}${pico}`;
}

/* ================= 2.3 — a laptop RAM stick =================
   Course restructure (2026-10-25): new lab card. A DDR4 SO-DIMM, the stick in a laptop, drawn
   generically with no maker's marks, 69.6 × 30 mm at 5 px per mm. Facts (JEDEC DDR4 SO-DIMM,
   MO-310; JESD79-4 DDR4): 260 gold contacts at 0.5 mm pitch, 130 a side, with the key notch off
   centre; a 16 GB single-rank stick carries eight 16 Gb (2 GB) x8 DRAM chips; a DRAM cell is one
   transistor and one capacitor; every row is refreshed within 64 ms (tREFW, up to 85 °C; DDR5
   halves it to 32 ms, which is why this is drawn as DDR4). Right: one DRAM cell, the word line
   on the transistor's gate, the bit line on one side, the capacitor to ground on the other. */
export function lab23Ram(){
  const k = 5, X = 40, Y = 172, W = 69.6 * k, H = 30 * k;
  const mx = mm => X + mm * k, my = mm => Y + mm * k;
  const PCB = '#2f5a3c', PCB_EDGE = '#203e29', GOLD = '#c9a24a', GOLD_EDGE = '#9a7a2e';
  /* the board outline: a side notch in each end for the laptop's clips, the key notch in
     the bottom edge at 39.5 mm (off centre, so the stick only goes in one way round) */
  const sn = 1.4 * k, sy = my(17), kx = mx(39.5), kw = .9 * k, kd = 2.6 * k;
  const outline = `M${f(X + 3)} ${Y} H${f(X + W - 3)} Q${f(X + W)} ${Y} ${f(X + W)} ${Y + 3}
    V${f(sy - sn)} A${f(sn)} ${f(sn)} 0 0 0 ${f(X + W)} ${f(sy + sn)} V${f(Y + H)}
    H${f(kx + kw)} V${f(Y + H - kd)} A${f(kw)} ${f(kw)} 0 0 0 ${f(kx - kw)} ${f(Y + H - kd)} V${f(Y + H)}
    H${f(X)} V${f(sy + sn)} A${f(sn)} ${f(sn)} 0 0 0 ${f(X)} ${f(sy - sn)} V${Y + 3} Q${X} ${Y} ${f(X + 3)} ${Y} Z`;
  let fingers = '';
  for (let i = 0; i < 130; i++){
    const x = mx(2.2 + i * .5);
    if (Math.abs(x - kx) < kw + 1.5) continue;           // no contact where the notch is
    fingers += `<rect x="${f(x - .8)}" y="${f(Y + H - 3.6 * k)}" width="1.6" height="${f(3.6 * k - 1)}" fill="${GOLD}"/>`;
  }
  /* eight chips in two rows of four, 12 × 8.5 mm, each with a pin-1 dot */
  const CX = [4, 18, 41.5, 55.5], CY = [3.5, 14];
  let chips = '';
  CY.forEach(cy => CX.forEach(cx => {
    chips += `<rect x="${f(mx(cx))}" y="${f(my(cy))}" width="${12 * k}" height="${f(8.5 * k)}" rx="1.5" ${BODY}/>
      <circle cx="${f(mx(cx) + 4)}" cy="${f(my(cy) + 4)}" r="1.4" fill="#45483e"/>`;
  }));
  /* the small parts: the SPD chip (it tells the laptop what the stick is) and a row of
     decoupling capacitors above the contacts */
  let small = `<rect x="${f(mx(32))}" y="${f(my(8))}" width="${3 * k}" height="${3 * k}" rx="1" ${BODY}/>`;
  for (let i = 0; i < 24; i++){
    const x = mx(4 + i * 2.6);
    if (Math.abs(x - kx) < 6) continue;
    small += `<rect x="${f(x)}" y="${f(my(23.6))}" width="4" height="2.4" fill="#b59a6a" stroke="#7d6a45" stroke-width=".4"/>`;
  }
  const stick = `<g data-k="stick">
    <path d="${outline}" fill="${PCB}" stroke="${PCB_EDGE}" stroke-width="1.2"/>
    <rect x="${f(X + 1)}" y="${f(Y + H - 3.9 * k)}" width="${f(W - 2)}" height=".8" fill="${GOLD_EDGE}" opacity=".5"/>
    ${fingers}${chips}${small}
    <path d="M${X} ${Y - 18} V${Y - 8} M${f(X + W)} ${Y - 18} V${Y - 8} M${X} ${Y - 13} H${f(X + W)}" stroke="var(--ink-soft)" stroke-width=".9"/>
    ${txt(X + W / 2, Y - 19, '69.6 MM LONG', { size: 8.5 })}
    <line x1="${f(mx(10))}" y1="${f(Y + H - 2)}" x2="${f(mx(10))}" y2="${f(Y + H + 26)}" stroke="var(--ink-soft)" stroke-width=".8"/>
    ${txt(mx(10) - 4, Y + H + 36, '260 GOLD CONTACTS', { anchor: 'start', size: 8 })}
    <line x1="${f(mx(47.5))}" y1="${f(my(22.5))}" x2="${f(mx(47.5))}" y2="${f(Y + H + 26)}" stroke="var(--ink-soft)" stroke-width=".8"/>
    ${txt(mx(47.5) - 4, Y + H + 36, '8 DRAM CHIPS, 2 GB EACH', { anchor: 'start', size: 8 })}</g>`;

  /* one DRAM cell, in a box joined to the top-right chip by two leader lines */
  const BXL = 452, BXR = 704, BYT = 150, BYB = 362;
  const bl = 486, cy = 262, t0 = 530, t1 = 572, gx = (t0 + t1) / 2, wl = 206, cx = 626;
  const cell = `<g data-k="cell">
    <rect x="${f(mx(55.5) - 3)}" y="${f(my(3.5) - 3)}" width="${12 * k + 6}" height="${f(8.5 * k + 6)}" rx="3" fill="none" stroke="var(--amber)" stroke-width="1.6"/>
    <path d="M${f(mx(67.5) + 3)} ${f(my(3.5) - 3)} L${BXL} ${BYT} M${f(mx(67.5) + 3)} ${f(my(12) + 3)} L${BXL} ${BYB}" stroke="var(--ink-soft)" stroke-width=".8" stroke-dasharray="3 3"/>
    <rect x="${BXL}" y="${BYT}" width="${BXR - BXL}" height="${BYB - BYT}" rx="6" fill="#f7f3e8" stroke="var(--ink)" stroke-width="1.2"/>
    ${txt((BXL + BXR) / 2, BYT + 20, 'ONE BIT INSIDE A CHIP', { size: 8.5 })}
    <path d="M${bl} ${BYT + 34} V${BYB - 30}" stroke="var(--ink)" stroke-width="2"/>
    ${txt(bl, BYB - 16, 'BIT LINE', { size: 7.5 })}
    <path d="M${t0 - 12} ${wl} H${BXR - 14}" stroke="var(--ink)" stroke-width="2"/>
    ${txt(BXR - 16, wl - 7, 'WORD LINE', { anchor: 'end', size: 7.5 })}
    <path d="M${bl} ${cy} H${t0} M${t1} ${cy} H${cx} V${cy + 14}" fill="none" stroke="var(--ink)" stroke-width="1.6"/>
    <circle cx="${bl}" cy="${cy}" r="3" fill="var(--ink)"/>
    <path d="M${t0} ${cy} H${t1}" stroke="var(--ink)" stroke-width="3"/>
    <path d="M${t0 + 2} ${cy - 9} H${t1 - 2} M${gx} ${cy - 9} V${wl}" stroke="var(--ink)" stroke-width="1.6"/>
    <circle cx="${gx}" cy="${wl}" r="3" fill="var(--ink)"/>
    ${txt(gx, cy + 18, 'TRANSISTOR', { size: 7.5 })}
    <path d="M${cx - 16} ${cy + 14} H${cx + 16}" stroke="var(--ink)" stroke-width="2.4"/>
    <path d="M${cx - 16} ${cy + 22} H${cx + 16}" stroke="var(--ink)" stroke-width="2.4"/>
    <path d="M${cx} ${cy + 22} V${cy + 40} M${cx - 11} ${cy + 40} H${cx + 11} M${cx - 7} ${cy + 44} H${cx + 7} M${cx - 3} ${cy + 48} H${cx + 3}" stroke="var(--ink)" stroke-width="1.4"/>
    ${txt(cx - 8, cy + 7, '+ + +', { size: 9, fill: 'var(--amber)', extra: 'font-weight:700' })}
    ${txt(cx + 22, cy + 21, 'CAPACITOR', { anchor: 'start', size: 7.5 })}
    ${txt(cx, cy + 64, 'CHARGE = 1, NO CHARGE = 0', { size: 7.5 })}</g>`;

  return `${txt(X + W / 2, Y - 46, 'A LAPTOP MEMORY STICK (DDR4 SO-DIMM, 16 GB)', { size: 9.5 })}
    ${stick}${cell}
    ${caption('MAIN MEMORY: EIGHT DRAM CHIPS ON A STICK')}`;
}
