// BYODC engine — the "In the Lab" breadboard builds for Act 1 (2026-10-19).
// Each step's theory circuit, built the way a student builds it: a 5 V bench supply on the
// rails (the − rail is ground), a 330 Ω resistor to limit the current, and an LED as the
// lamp. Every builder returns panel HTML in which the parts that change between the two
// cards sit in <g class="st-on"> and <g class="st-off">; setLabState(panel, on) shows one.
//
// Hole plan, top block only (rows a to e), columns 1 to 30: the supply feeds column 4 from
// the + rail, the series parts run left to right along the rows, and the last part returns
// to the − rail. Leg orders are the datasheets': BC547 C B E, 2N7000 S G D, flat face to you.
import { labBoard, jumper, resistorTop, diodeTop, ledTop, to92Top, HALO } from './reallife.js';

const P = 16;
const wrap = (board, body, caption) => `
  ${board.svg}${body}
  <text x="360" y="432" class="lbl-faint">${caption}</text>`;
const both = (on, off) => `<g class="st-on">${on}</g><g class="st-off" style="display:none">${off}</g>`;

export function setLabState(panel, on){
  panel.g.querySelectorAll('.st-on').forEach(n => { n.style.display = on ? '' : 'none'; });
  panel.g.querySelectorAll('.st-off').forEach(n => { n.style.display = on ? 'none' : ''; });
}

/* the shared front end: + rail → column 4 → 330 Ω → column 9 */
function feed(h){
  return jumper(h(4, 'a'), h(4, 'T+'), 'var(--amber)', 0)
    + resistorTop(h(4, 'c'), h(9, 'c'), { label: '330 Ω', p: P });
}

/* 1.1: the simplest circuit, + rail → resistor → LED → ground */
export function circuitBasic(){
  const b = labBoard(), h = b.hole;
  const body = feed(h)
    + ledTop(h(9, 'e'), h(11, 'e'), { lit: true, p: P })
    + jumper(h(11, 'a'), h(12, 'T-'), 'var(--ink)', 0);
  return wrap(b, body, 'A BATTERY-AND-LAMP TEST, BUILT ON A BREADBOARD');
}

/* 1.2: + rail → 1N4001 → resistor → LED → ground; flipped, the band faces the supply */
export function circuitDiode(){
  const b = labBoard(), h = b.hole;
  const body = jumper(h(4, 'a'), h(4, 'T+'), 'var(--amber)', 0)
    + both(diodeTop(h(4, 'c'), h(9, 'c'), { label: '1N4001', cathodeAt: 'b', p: P }),
           diodeTop(h(4, 'c'), h(9, 'c'), { label: '1N4001', cathodeAt: 'a', p: P }))
    + resistorTop(h(9, 'e'), h(14, 'e'), { label: '330 Ω', p: P })
    + both(ledTop(h(14, 'c'), h(16, 'c'), { lit: true, p: P }), ledTop(h(14, 'c'), h(16, 'c'), { lit: false, p: P }))
    + jumper(h(16, 'a'), h(17, 'T-'), 'var(--ink)', 0);
  return wrap(b, body, 'YOUR DIODE TEST, BUILT ON A BREADBOARD');
}

/* 1.3: LED in the collector, emitter to ground, base through 100 kΩ to a wire that goes to
   ground (off) or to the + rail (on) */
export function circuitNPN(){
  const b = labBoard(), h = b.hole;
  const body = feed(h)
    + both(ledTop(h(9, 'e'), h(11, 'e'), { lit: true, p: P }), ledTop(h(9, 'e'), h(11, 'e'), { lit: false, p: P }))
    + jumper(h(11, 'b'), h(15, 'b'), '#7a7d70', 10)
    + to92Top([h(15, 'd'), h(16, 'd'), h(17, 'd')], { name: 'BC547', pins: ['C', 'B', 'E'], p: P })
    + jumper(h(17, 'a'), h(18, 'T-'), 'var(--ink)', 0)
    + resistorTop(h(16, 'b'), h(21, 'b'), { label: '100 kΩ', p: P })
    + both(jumper(h(21, 'a'), h(23, 'T+'), 'var(--amber)', 0), jumper(h(21, 'a'), h(23, 'T-'), 'var(--ink)', 0))
    + `<text x="${h(23, 'a')[0] + 14}" y="${h(23, 'a')[1] + 4}" class="lbl" font-size="8" text-anchor="start" style="${HALO}">BASE WIRE</text>`;
  return wrap(b, body, 'YOUR TRANSISTOR TEST, BUILT ON A BREADBOARD');
}

/* 1.4: LED in the drain, source to ground, the gate wired straight to the + rail (on) or to
   ground (off) */
export function circuitNMOS(){
  const b = labBoard(), h = b.hole;
  const body = feed(h)
    + both(ledTop(h(9, 'e'), h(11, 'e'), { lit: true, p: P }), ledTop(h(9, 'e'), h(11, 'e'), { lit: false, p: P }))
    + jumper(h(11, 'b'), h(17, 'b'), '#7a7d70', 12)
    + to92Top([h(15, 'd'), h(16, 'd'), h(17, 'd')], { name: '2N7000', pins: ['S', 'G', 'D'], p: P })
    + jumper(h(15, 'a'), h(14, 'T-'), 'var(--ink)', 0)
    + both(jumper(h(16, 'a'), h(20, 'T+'), 'var(--amber)', 8), jumper(h(16, 'a'), h(20, 'T-'), 'var(--ink)', 8))
    + `<text x="${h(20, 'a')[0] + 10}" y="${h(20, 'a')[1] + 4}" class="lbl" font-size="8" text-anchor="start" style="${HALO}">GATE WIRE</text>`;
  return wrap(b, body, 'YOUR NMOS TEST, BUILT ON A BREADBOARD');
}
