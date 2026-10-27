// BYODC art — a phone charger, taken apart (REVIEW_NOTES N-053, the picture beside 1.2's
// real-numbers box). The box says diodes inside a charger turn the socket's back-and-forth
// current one way; this shows where they are.
//
// A small charger is a flyback power supply, and the parts drawn are the ones every teardown
// shows: a fuse; four diodes in a bridge (the bridge rectifier, the box's diodes); a large
// input capacitor; the switching chip; the transformer; an optocoupler (a light and a light
// sensor, which carries feedback across the safety gap without a wire); the output diode; the
// output capacitor; the USB socket; and the board, cut by a slot that keeps the mains side
// apart from the USB side. Every part is drawn centred on (0, 0) in its real colours. The two
// groups of diodes get the dark labels, because they are what the box is about.
//
// Sequence: the closed charger sits in the middle; its two shell halves pull apart; then each
// part lifts off the board, grows to full size and flies to its place, and its label fades
// in; then everything floats. All motion is Anim.tween, so a replay lands the end state.
import { svgEl } from '../engine/util.js';
import { Anim } from '../engine/anim.js';
import { floatingPart, place, flyApart } from '../engine/numbersart.js';

const BODY = 'fill="#262822" stroke="#45483e" stroke-width="1"';
const LEAD = 'stroke="#a9aaa2" stroke-width="2" stroke-linecap="round"';
const PRINT = 'font-family="var(--font-mono)" font-size="5.5" fill="#b9b9ae" text-anchor="middle"';

/* one small axial diode, drawn along +x from -l/2 to l/2, band at +x (its cathode) */
const diode = (l = 30, d = 8) => `<line x1="${-l / 2 - 6}" y1="0" x2="${l / 2 + 6}" y2="0" ${LEAD}/>
  <rect x="${-l / 2}" y="${-d / 2}" width="${l}" height="${d}" rx="2" ${BODY}/>
  <rect x="${l / 2 - 6}" y="${-d / 2}" width="4" height="${d}" fill="#c9c9c0"/>`;

const PARTS = {
  /* the front half of the shell, with its two round pins */
  shellA: { w: 104, h: 150, html: `
    <defs><linearGradient id="chPin" x1="0" x2="1"><stop offset="0" stop-color="#d9dad4"/><stop offset=".5" stop-color="#f4f4f0"/><stop offset="1" stop-color="#a9aaa2"/></linearGradient></defs>
    <rect x="-23" y="-96" width="9" height="44" rx="4.5" fill="url(#chPin)" stroke="#8e8f86"/>
    <rect x="14" y="-96" width="9" height="44" rx="4.5" fill="url(#chPin)" stroke="#8e8f86"/>
    <rect x="-52" y="-56" width="104" height="118" rx="16" fill="#f5f3ec" stroke="#b8b4a6" stroke-width="1.2"/>
    <rect x="-44" y="-48" width="88" height="102" rx="11" fill="none" stroke="#dcd8cb" stroke-width="1"/>
    <path d="M-40 -46 Q-44 -10 -40 30" stroke="#fff" stroke-width="4" fill="none" opacity=".8" stroke-linecap="round"/>
    <text x="0" y="14" font-family="var(--font-mono)" font-size="7" fill="#b8b4a6" text-anchor="middle">5V ⎓ 2A</text>` },
  /* the back half, hollow, with the USB opening at its foot */
  shellB: { w: 104, h: 118, html: `
    <rect x="-52" y="-56" width="104" height="118" rx="16" fill="#ece9df" stroke="#b8b4a6" stroke-width="1.2"/>
    <rect x="-44" y="-48" width="88" height="102" rx="11" fill="#e1ddd0" stroke="#d2cdbd" stroke-width="1"/>
    <rect x="-40" y="-44" width="80" height="6" rx="3" fill="#d6d1c2"/>
    <rect x="-17" y="46" width="34" height="9" rx="2" fill="#3a3d35"/>` },
  /* the board: green, copper tracks, solder pads, and the isolation slot down the middle */
  board: { w: 210, h: 110, html: `
    <rect x="-105" y="-55" width="210" height="110" rx="6" fill="#2f4a3a" stroke="#20352a" stroke-width="1.2"/>
    <path d="M-90 -40 H-40 V-10 H10 M-90 30 H-50 V5 M30 -35 H85 V10 M40 35 H95" fill="none" stroke="#5d7a55" stroke-width="3" stroke-linecap="round" opacity=".9"/>
    ${[[-90, -40], [-40, -10], [10, -10], [-90, 30], [-50, 5], [30, -35], [85, 10], [40, 35], [95, 35]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#c9c9c0"/>`).join('')}
    <path d="M18 -55 V-20 L24 -14 V55" fill="none" stroke="#14231b" stroke-width="5"/>
    <text x="-60" y="-46" font-family="var(--font-mono)" font-size="6" fill="#d9e2d0" text-anchor="middle">MAINS SIDE</text>
    <text x="64" y="-46" font-family="var(--font-mono)" font-size="6" fill="#d9e2d0" text-anchor="middle">USB SIDE</text>` },
  /* a glass fuse: metal caps, a thin wire inside */
  fuse: { w: 76, h: 18, html: `
    <line x1="-38" y1="0" x2="38" y2="0" ${LEAD}/>
    <rect x="-24" y="-8" width="48" height="16" rx="8" fill="rgba(214,226,224,.55)" stroke="#9c9f99"/>
    <path d="M-16 0 l4 -3 l4 6 l4 -6 l4 6 l4 -6 l4 6 l4 -3" fill="none" stroke="#7d807a" stroke-width="1"/>
    <rect x="-28" y="-9" width="10" height="18" rx="2" fill="#cfd1cc" stroke="#8e8f86"/>
    <rect x="18" y="-9" width="10" height="18" rx="2" fill="#cfd1cc" stroke="#8e8f86"/>` },
  /* the bridge: four diodes on the sides of a diamond. The socket's two wires join the left
     and right corners (~). The two upper diodes point from those corners to + at the top, and
     the two lower ones point from − at the bottom to those corners, so whichever way the
     socket's current is flowing, it leaves at + and comes back in at −. */
  bridge: { w: 96, h: 96, html: `
    <path d="M-44 0 L0 -44 L44 0 L0 44 Z" fill="none" stroke="#7d807a" stroke-width="1.2"/>
    <g transform="translate(-22 -22) rotate(-45)">${diode()}</g>
    <g transform="translate(22 -22) rotate(-135)">${diode()}</g>
    <g transform="translate(-22 22) rotate(-135)">${diode()}</g>
    <g transform="translate(22 22) rotate(-45)">${diode()}</g>
    ${[[-44, 0, '~'], [44, 0, '~'], [0, -44, '+'], [0, 44, '−']].map(([x, y, t]) => `<circle cx="${x}" cy="${y}" r="3" fill="#8e8f86"/>
      <text x="${x + (x < 0 ? -9 : x > 0 ? 9 : 0)}" y="${y + (y < 0 ? -7 : y > 0 ? 14 : 3)}" font-family="var(--font-mono)" font-size="10" fill="var(--ink)" text-anchor="middle">${t}</text>`).join('')}` },
  /* the input capacitor: an aluminium can in a dark sleeve, a stripe marking its − leg,
     scored top so it vents rather than bursts */
  capIn: { w: 40, h: 72, html: `
    <line x1="-7" y1="30" x2="-7" y2="40" ${LEAD}/><line x1="7" y1="30" x2="7" y2="40" ${LEAD}/>
    <rect x="-18" y="-30" width="36" height="62" rx="4" fill="#2c2e2a" stroke="#45483e"/>
    <rect x="8" y="-30" width="7" height="62" fill="#8e9089"/>
    ${[-18, -6, 6, 18].map(y => `<text x="11.5" y="${y + 2}" font-family="var(--font-mono)" font-size="7" fill="#2c2e2a" text-anchor="middle">−</text>`).join('')}
    <ellipse cx="0" cy="-30" rx="18" ry="4.5" fill="#c9cbc6" stroke="#8e8f86"/>
    <path d="M-7 -30 H7 M0 -33.5 V-26.5" stroke="#8e8f86" stroke-width="1"/>
    <text x="-5" y="-6" ${PRINT} transform="rotate(-90 -5 -6)">400V 6.8µF</text>` },
  /* the switching chip: a small surface-mount package, gull-wing legs on two sides */
  chip: { w: 40, h: 34, html: `
    ${[-12, -4, 4, 12].map(x => `<path d="M${x} -10 v-5 h-0" stroke="#a9aaa2" stroke-width="3"/><path d="M${x} 10 v5" stroke="#a9aaa2" stroke-width="3"/>`).join('')}
    <rect x="-18" y="-11" width="36" height="22" rx="2" ${BODY}/>
    <circle cx="-12" cy="5" r="1.8" fill="#55594d"/>
    <text x="2" y="2" ${PRINT}>PWM</text>` },
  /* the transformer: two E-shaped ferrite halves around a bobbin wound under yellow tape */
  xfmr: { w: 70, h: 70, html: `
    ${[-20, -10, 0, 10, 20].map(x => `<line x1="${x}" y1="28" x2="${x}" y2="38" ${LEAD}/>`).join('')}
    <rect x="-30" y="-24" width="60" height="52" rx="3" fill="#e2d6b8" stroke="#a89668"/>
    <rect x="-22" y="-10" width="44" height="24" fill="#dcc068" stroke="#b39b5a"/>
    <path d="M-22 -2 H22 M-22 6 H22" stroke="#c7a94a" stroke-width="1"/>
    <rect x="-34" y="-34" width="68" height="12" rx="1.5" fill="#3a3d35" stroke="#55594d"/>
    <rect x="-34" y="-34" width="10" height="56" rx="1.5" fill="#3a3d35" stroke="#55594d"/>
    <rect x="24" y="-34" width="10" height="56" rx="1.5" fill="#3a3d35" stroke="#55594d"/>
    <rect x="-34" y="18" width="68" height="10" rx="1.5" fill="#3a3d35" stroke="#55594d"/>` },
  /* the optocoupler: a 4-leg DIP, a light on one side of the gap and a sensor on the other */
  opto: { w: 40, h: 36, html: `
    ${[-6, 6].map(x => `<line x1="${x}" y1="-10" x2="${x}" y2="-18" ${LEAD}/><line x1="${x}" y1="10" x2="${x}" y2="18" ${LEAD}/>`).join('')}
    <rect x="-17" y="-11" width="34" height="22" rx="2" fill="#efeee8" stroke="#a9aaa2"/>
    <circle cx="-11" cy="5" r="1.8" fill="#a9aaa2"/>
    <text x="2" y="2" font-family="var(--font-mono)" font-size="6" fill="#7d807a" text-anchor="middle">817</text>` },
  /* the output diode: a bigger axial diode, band at its cathode */
  dOut: { w: 76, h: 20, html: `
    <line x1="-38" y1="0" x2="38" y2="0" ${LEAD}/>
    <rect x="-18" y="-8" width="36" height="16" rx="3" ${BODY}/>
    <rect x="10" y="-8" width="5" height="16" fill="#c9c9c0"/>` },
  /* the output capacitor: a smaller can, same make-up as the input one */
  capOut: { w: 30, h: 50, html: `
    <line x1="-5" y1="20" x2="-5" y2="28" ${LEAD}/><line x1="5" y1="20" x2="5" y2="28" ${LEAD}/>
    <rect x="-13" y="-20" width="26" height="42" rx="3" fill="#2c2e2a" stroke="#45483e"/>
    <rect x="5" y="-20" width="5" height="42" fill="#8e9089"/>
    <ellipse cx="0" cy="-20" rx="13" ry="3.4" fill="#c9cbc6" stroke="#8e8f86"/>
    <text x="-3" y="2" ${PRINT} transform="rotate(-90 -3 2)">10V 470µF</text>` },
  /* the USB-A socket from the front: a metal shell, a plastic tongue, four gold contacts */
  usb: { w: 48, h: 30, html: `
    <defs><linearGradient id="chUsb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3e4e0"/><stop offset=".5" stop-color="#bfc2bc"/><stop offset="1" stop-color="#d6d8d3"/></linearGradient></defs>
    <rect x="-24" y="-13" width="48" height="26" rx="2" fill="url(#chUsb)" stroke="#8e8f86"/>
    <rect x="-20" y="-9" width="40" height="18" rx="1" fill="#2c2e2a"/>
    <rect x="-17" y="-6" width="34" height="6" fill="#efeee8"/>
    ${[-11, -4, 4, 11].map(x => `<rect x="${x - 2}" y="-1" width="4" height="3" fill="#c9a24a"/>`).join('')}` },
};

/* where each part rests once it is out (centres), its spot on the board (scale 0.5), and its
   label; `diodes` labels are the dark ones */
const LAYOUT = [
  { k: 'fuse',   to: [240, 118], on: [-70, -32], lab: ['FUSE'] },
  { k: 'bridge', to: [360, 118], on: [-38, -20], lab: ['FOUR DIODES', 'THE BRIDGE RECTIFIER'], diodes: true },
  { k: 'capIn',  to: [484, 118], on: [-4, -26], lab: ['INPUT CAPACITOR'] },
  { k: 'chip',   to: [108, 275], on: [-74, 22], lab: ['SWITCHING CHIP'] },
  { k: 'usb',    to: [614, 275], on: [86, 2], lab: ['USB SOCKET'] },
  { k: 'xfmr',   to: [214, 384], on: [-6, 18], lab: ['TRANSFORMER'] },
  { k: 'opto',   to: [330, 384], on: [30, 30], lab: ['OPTOCOUPLER'] },
  { k: 'dOut',   to: [450, 384], on: [56, -30], lab: ['OUTPUT DIODE'], diodes: true },
  { k: 'capOut', to: [566, 384], on: [62, 26], lab: ['OUTPUT CAPACITOR'] },
];
const CX = 360, CY = 275;

function label(parent, x, y, [a, b], dark){
  const g = svgEl('g');
  const w = Math.max(a.length, (b || '').length) * 6.6 + 18;
  g.innerHTML = dark
    ? `<rect x="${x - w / 2}" y="${y - 11}" width="${w}" height="${b ? 30 : 17}" rx="8.5" fill="var(--ink)"/>
       <text x="${x}" y="${y + 1}" class="lbl" font-size="8.5" style="fill:var(--paper-high)">${a}</text>
       ${b ? `<text x="${x}" y="${y + 13}" class="lbl" font-size="7.5" style="fill:var(--paper-high);opacity:.75">${b}</text>` : ''}`
    : `<text x="${x}" y="${y + 1}" class="lbl" font-size="8.5" style="fill:var(--ink)">${a}</text>`;
  g.style.opacity = '0';
  parent.appendChild(g);
  return g;
}

export async function chargerArt(root){
  const title = svgEl('text', { x: 360, y: 44, class: 'lbl', style: 'fill:var(--ink)' });
  title.textContent = 'INSIDE A PHONE CHARGER, TAKEN APART';
  const cap = svgEl('text', { x: 360, y: 472, class: 'lbl-faint' });
  cap.textContent = 'THE FOUR DIODES TURN THE SOCKET\'S BACK-AND-FORTH CURRENT INTO ONE-WAY CURRENT';
  root.append(title, cap);

  const make = k => floatingPart(root, PARTS[k].html, PARTS[k]);
  const board = make('board');
  place(board, CX, CY);
  const parts = LAYOUT.map(L => {
    const g = make(L.k);
    const from = { x: CX + L.on[0], y: CY + L.on[1], s: .5 };
    place(g, from.x, from.y, from.s);
    return { ...L, g, from, to: { x: L.to[0], y: L.to[1], s: 1 } };
  });
  // the shell goes on last, so the closed charger covers the board
  const shellB = make('shellB'), shellA = make('shellA');
  place(shellB, CX, CY); place(shellA, CX, CY);
  const labels = parts.map(p => label(root, p.to.x, p.to.y + PARTS[p.k].h / 2 + 26, p.lab, p.diodes));

  await Anim.tween(500, () => {});                       // a beat on the closed charger
  await flyApart([
    { g: shellA, from: { x: CX, y: CY, s: 1 }, to: { x: 96, y: 146, s: .82 } },
    { g: shellB, from: { x: CX, y: CY, s: 1 }, to: { x: 624, y: 130, s: .82 } },
  ], { dur: 750, stagger: 0 });
  await flyApart(parts, { dur: 720, stagger: 90 });
  await Anim.tween(400, q => labels.forEach(l => { l.style.opacity = q.toFixed(2); }));
  /* now float, each part out of step with the next */
  [board, shellA, shellB, ...parts.map(p => p.g)].forEach((g, i) => {
    g.classList.add('tile3d');
    g.querySelectorAll('.float-inner, .float-shadow').forEach(n => { n.style.animationDelay = `${(-i * 0.47).toFixed(2)}s`; });
  });
}
