// BYODC engine — the working breadboard behind "See more in the lab" (N-141, N-142, N-146).
//
// Everything here is drawn in code. proj() tilts the board away from the viewer and gives parts
// real height, so the board reads as a 3D object while every hole stays a plain x, y target.
//
// The electrical side is a small circuit solver, not a script: holes join into nets the way a
// real board's clips join them, and each part is a resistor, a one-way drop or a switch. An LED
// lights only when a real path gives it current, and it burns out when nothing limits that
// current. Goals read the same solution the student sees.
//
// The bench sits behind guide.labMore(), off the recorded path, and takes a single flow.ask, so
// it never moves the index, the seed or Resume. A student's build is kept in localStorage.
import { svgEl, svgPt, el, RM } from './util.js';
import { leadPath } from './reallife.js';
import { SFX } from './sfx.js';
import { guide } from './guide.js';
import { flow } from './flow.js';
import { slideInPanel, pointerDrag } from './components.js';

/* ---------- the board ---------- */
const P = 24, COLS = 27, W = (COLS + 1) * P, H = 17.7 * P;
const ROWV = { 'T+': .9, 'T-': 1.9, a: 3.6, b: 4.6, c: 5.6, d: 6.6, e: 7.6, f: 10.1, g: 11.1, h: 12.1, i: 13.1, j: 14.1, 'B-': 15.8, 'B+': 16.8 };
const COS = .93, SIN = .37, F = 1000, CX = 360, NEAR_Y = 440, ZK = .85;
const isRail = r => r.length === 2;
const hu = c => P * c, hv = r => P * ROWV[r];

function proj(u, v, z = 0){
  const d = (H - v) * SIN, s = F / (F + d);
  return [CX + (u - W / 2) * s, NEAR_Y - ((H - v) * COS + z * ZK) * s, s];
}
const pp = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;
const poly = pts => pts.map(p => pp(proj(...p))).join(' L');
const key = (c, r) => `${c}:${r}`;
const parse = k => { const [c, r] = k.split(':'); return { c: +c, r }; };
const holeXY = (k, z = 0) => { const { c, r } = parse(k); return proj(hu(c), hv(r), z); };

const HOLES = [];
for (const r of Object.keys(ROWV)) for (let c = 1; c <= COLS; c++){
  if (isRail(r) && c % 6 === 0) continue;   // rails come in groups of five
  const [x, y] = proj(hu(c), hv(r));
  HOLES.push({ k: key(c, r), c, r, x, y });
}
/* the supply's leads sit in the first hole of each rail */
const LEADS = new Set(['1:T+', '1:T-', '1:B+', '1:B-']);

function boardSVG(){
  const hs = P * .17;
  let dark = '', lip = '';
  for (const h of HOLES){
    const u = hu(h.c), v = hv(h.r);
    dark += `M${poly([[u - hs, v - hs], [u + hs, v - hs], [u + hs, v + hs], [u - hs, v + hs]])}Z`;
    lip += `M${poly([[u - hs, v + hs], [u + hs, v + hs], [u + hs, v + hs * 1.45], [u - hs, v + hs * 1.45]])}Z`;
  }
  const rail = (v, c) => `<path d="M${poly([[P * .6, v], [W - P * .6, v]])}" stroke="${c}" stroke-width="1.6" fill="none"/>`;
  const labels = [];
  const cap = (u, v, t, size = 8.5, style = '') => {
    const [x, y, s] = proj(u, v);
    labels.push(`<text x="${x.toFixed(1)}" y="${(y + 3).toFixed(1)}" class="lbl-faint" font-size="${(size * s).toFixed(1)}" style="${style}">${t}</text>`);
  };
  for (const r of 'abcdefghij') { cap(P * .42, hv(r), r); cap(W - P * .42, hv(r), r); }
  for (let c = 1; c <= COLS; c++) if (c === 1 || c % 5 === 0){ cap(hu(c), P * 2.8, c); cap(hu(c), P * 14.95, c); }
  const plus = 'fill:var(--amber);font-weight:700', minus = 'fill:var(--ink);font-weight:700';
  for (const [r, t, st] of [['T+', '+', plus], ['T-', '−', minus], ['B-', '−', minus], ['B+', '+', plus]]){
    cap(P * .42, hv(r), t, 11, st); cap(W - P * .42, hv(r), t, 11, st);
  }
  const cableEnd = (r, z = 4) => holeXY(key(1, r), z);
  const supply = { x: 128, y: 12, w: 116, h: 46 };
  const lead = (from, to, c, via) =>
    `<path d="M${from[0]} ${from[1]} C${via} ${pp(to)}" fill="none" stroke="rgba(29,33,23,.28)" stroke-width="3.6" stroke-linecap="round" transform="translate(1.5 2.5)"/>
     <path d="M${from[0]} ${from[1]} C${via} ${pp(to)}" fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round"/>
     <circle cx="${to[0].toFixed(1)}" cy="${to[1].toFixed(1)}" r="3" fill="#8e8f86"/>`;
  const [tpX, tpY] = cableEnd('T+'), [tmX, tmY] = cableEnd('T-'), [bpX, bpY] = cableEnd('B+'), [bmX, bmY] = cableEnd('B-');
  return `<defs>
      <linearGradient id="bbTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f3efe2"/><stop offset="1" stop-color="#fcfaf3"/></linearGradient>
      <linearGradient id="bbFront" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#d9d4c3"/><stop offset="1" stop-color="#b3ad9a"/></linearGradient>
      <linearGradient id="bbGroove" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#bdb8a6"/><stop offset="1" stop-color="#e4dfcf"/></linearGradient>
      <linearGradient id="bbBox" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3b3e36"/><stop offset="1" stop-color="#26281f"/></linearGradient>
      <radialGradient id="bbLit"><stop offset="0" stop-color="#fff3c4"/><stop offset=".55" stop-color="#f2b53c"/><stop offset="1" stop-color="#c47f1e"/></radialGradient>
      <radialGradient id="bbOff" cx=".38" cy=".3"><stop offset="0" stop-color="#f6dcc0"/><stop offset=".6" stop-color="#d9a06c"/><stop offset="1" stop-color="#a5642a"/></radialGradient>
      <radialGradient id="bbGlow"><stop offset="0" stop-color="rgba(242,181,60,.75)"/><stop offset="1" stop-color="rgba(242,181,60,0)"/></radialGradient>
      <filter id="bbBlur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>
    </defs>
    <path d="M${poly([[6, 8, -18], [W - 6, 8, -18], [W + 4, H + 8, -20], [-4, H + 8, -20]])}Z" fill="rgba(29,33,23,.3)" filter="url(#bbBlur)"/>
    <path d="M${poly([[0, H, 0], [W, H, 0], [W, H, -19], [0, H, -19]])}Z" fill="url(#bbFront)" stroke="#9b957f" stroke-width="1" stroke-linejoin="round"/>
    <path d="M${poly([[0, 0], [W, 0], [W, H], [0, H]])}Z" fill="url(#bbTop)" stroke="#c9c3ae" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M${poly([[P * .3, P * 8.4], [W - P * .3, P * 8.4], [W - P * .3, P * 9.3], [P * .3, P * 9.3]])}Z" fill="url(#bbGroove)"/>
    ${rail(P * .3, 'var(--amber)')}${rail(P * 2.45, 'var(--ink)')}${rail(P * 15.25, 'var(--ink)')}${rail(P * 17.35, 'var(--amber)')}
    <path d="${dark}" fill="#4b4d43"/><path d="${lip}" fill="#fff" opacity=".85"/>
    ${labels.join('')}
    <g>
      <rect x="${supply.x}" y="${supply.y + 6}" width="${supply.w}" height="${supply.h}" rx="5" fill="#191b15"/>
      <rect x="${supply.x}" y="${supply.y}" width="${supply.w}" height="${supply.h}" rx="5" fill="url(#bbBox)" stroke="#55594d"/>
      <text x="${supply.x + supply.w / 2}" y="${supply.y + 15}" class="lbl" font-size="8" style="fill:#d9d6c9;letter-spacing:.14em">BENCH SUPPLY</text>
      <text x="${supply.x + 34}" y="${supply.y + 34}" class="lbl" font-size="12" style="fill:var(--amber)">+5 V</text>
      <text x="${supply.x + 84}" y="${supply.y + 34}" class="lbl" font-size="12" style="fill:#d9d6c9">0 V</text>
    </g>
    ${lead([supply.x + 22, supply.y + 50], [tpX, tpY], 'var(--amber)', `${supply.x + 16} ${supply.y + 72} ${tpX + 6} ${tpY - 22}`)}
    ${lead([supply.x + 48, supply.y + 50], [tmX, tmY], 'var(--ink)', `${supply.x + 44} ${supply.y + 80} ${tmX + 26} ${tmY - 26}`)}
    ${lead([supply.x + 6, supply.y + 24], [bpX, bpY], 'var(--amber)', `${supply.x - 130} ${supply.y + 40} ${bpX - 46} ${bpY - 8}`)}
    ${lead([supply.x + 6, supply.y + 38], [bmX, bmY], 'var(--ink)', `${supply.x - 118} ${supply.y + 60} ${bmX - 42} ${bmY - 10}`)}`;
}

/* ---------- the parts ----------
   span: how many columns apart a part's legs can sit along a row. cross: how far straight across
   the board they can reach, to a rail or over the gap (N-148). A wire has no limit. */
const TYPES = {
  wire:  { name: 'Wire', pins: 2 },
  led:   { name: 'LED', pins: 2, span: [1, 3], cross: 3, turn: true, first: 'long leg (+)', second: 'short leg (−)' },
  r330:  { name: '330 Ω resistor', pins: 2, span: [3, 8], cross: 8, ohms: 330, turn: false },
  r100k: { name: '100 kΩ resistor', pins: 2, span: [3, 8], cross: 8, ohms: 100000, turn: false },
  r10k:  { name: '10 kΩ resistor', pins: 2, span: [3, 8], cross: 8, ohms: 10000, turn: false },
  btn:   { name: 'push button', pins: 2, span: [1, 4], cross: 3, turn: false },
  diode: { name: '1N4001 diode', pins: 2, span: [3, 8], cross: 8, turn: true, first: 'unbanded end', second: 'banded end' },
  bc547: { name: 'BC547 transistor', pins: 3, turn: true, legs: ['C', 'B', 'E'] },
  n7000: { name: '2N7000 transistor', pins: 3, turn: true, legs: ['S', 'G', 'D'] },
  hc04:  { name: '74HC04 chip', pins: 14 },
  hc00:  { name: '74HC00 chip', pins: 14 },
};
/* each gate on a chip: its input pins and its output pin. One input is an inverter, two a NAND */
const GATES = {
  hc04: [[[1], 2], [[3], 4], [[5], 6], [[9], 8], [[11], 10], [[13], 12]],
  hc00: [[[1, 2], 3], [[4, 5], 6], [[9, 10], 8], [[12, 13], 11]],
};
const isChip = type => !!GATES[type];
const chipPins = c => {
  const out = [];
  for (let i = 1; i <= 7; i++) out.push(key(c + i - 1, 'f'));      // pins 1 to 7, near side
  for (let i = 8; i <= 14; i++) out.push(key(c + 14 - i, 'e'));    // pins 8 to 14, far side
  return out;
};

const lead = (a, b, w = 1.9) => `<path d="M${pp(a)} L${pp(b)}" stroke="#7f8077" stroke-width="${w + 1}" stroke-linecap="round"/>
  <path d="M${pp(a)} L${pp(b)}" stroke="#d0d0c8" stroke-width="${w}" stroke-linecap="round"/>`;
const halo = (x, y, t, size = 9, fill = 'var(--ink)') => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="lbl" font-size="${size}" style="fill:${fill};paint-order:stroke;stroke:#faf8f1;stroke-width:3px;stroke-linejoin:round">${t}</text>`;

/* A wire lifts off the board in an arc, with its shadow on the board under it */
function wireArt(p){
  const a = parse(p.pins[0]), b = parse(p.pins[1]);
  const ua = hu(a.c), va = hv(a.r), ub = hu(b.c), vb = hv(b.r), len = Math.hypot(ub - ua, vb - va);
  const peak = Math.min(26, 8 + len * .09), line = [], shade = [];
  for (let i = 0; i <= 18; i++){
    const t = i / 18, z = 4 + peak * Math.pow(Math.sin(Math.PI * t), .7);
    line.push(proj(ua + (ub - ua) * t, va + (vb - va) * t, z));
    shade.push(proj(ua + (ub - ua) * t + 2, va + (vb - va) * t + 4));
  }
  const d = line.map(pp).join(' L'), ds = shade.map(pp).join(' L');
  const colour = p.colour || 'var(--blue)';
  return { svg: `<path d="M${ds}" fill="none" stroke="rgba(29,33,23,.2)" stroke-width="3.2" stroke-linecap="round"/>
    ${lead(holeXY(p.pins[0]), line[0], 2)}${lead(holeXY(p.pins[1]), line[18], 2)}
    <path d="M${d}" fill="none" stroke="rgba(29,33,23,.55)" stroke-width="4.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${d}" fill="none" stroke="${colour}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${d}" fill="none" stroke="#fff" stroke-width=".9" opacity=".4" transform="translate(-.4 -.9)"/>`,
    hit: line.filter((_, i) => i % 2 === 0).map(q => [q[0], q[1], 7]) };
}

/* resistor and diode: leads rise from two holes to a capsule body lying above the board */
function axialArt(p, m){
  const a = parse(p.pins[0]), b = parse(p.pins[1]), Z = 10;
  const ua = hu(a.c), va = hv(a.r), ub = hu(b.c), vb = hv(b.r), len = Math.hypot(ub - ua, vb - va) || 1;
  const bodyLen = Math.min(len - 8, p.type === 'diode' ? 40 : 50), t0 = Math.max(.02, .5 - bodyLen / len / 2), t1 = 1 - t0;
  const at = (t, z = Z) => proj(ua + (ub - ua) * t, va + (vb - va) * t, z);
  const s = at(.5)[2], bw = (p.type === 'diode' ? 14 : 13) * s;
  const seg = (q0, q1, c, w = bw, cap = 'butt', dy = 0) => {
    const A = at(q0), B = at(q1);
    return `<line x1="${A[0].toFixed(1)}" y1="${(A[1] + dy).toFixed(1)}" x2="${B[0].toFixed(1)}" y2="${(B[1] + dy).toFixed(1)}" stroke="${c}" stroke-width="${w.toFixed(1)}" stroke-linecap="${cap}"/>`;
  };
  const shadow = `<path d="M${pp(proj(ua + (ub - ua) * t0 + 2, va + (vb - va) * t0 + 5))} L${pp(proj(ua + (ub - ua) * t1 + 2, va + (vb - va) * t1 + 5))}" stroke="rgba(29,33,23,.2)" stroke-width="${bw.toFixed(1)}" stroke-linecap="round"/>`;
  const legs = lead(holeXY(p.pins[0]), at(.001)) + lead(at(.001), at(t0)) + lead(holeXY(p.pins[1]), at(.999)) + lead(at(.999), at(t1));
  const tt = q => t0 + (t1 - t0) * q;
  let body;
  if (p.type === 'diode'){
    body = seg(t0, t1, '#1f2019', bw, 'round') + seg(tt(.78), tt(.92), '#d3d3cb') + seg(t0, t1, 'rgba(255,255,255,.2)', bw * .22, 'round', -bw * .24);
  } else {
    const bands = p.type === 'r330' ? ['#c2682c', '#c2682c', '#7a4a22'] : p.type === 'r10k' ? ['#7a4a22', '#23241e', '#c2682c'] : ['#7a4a22', '#23241e', '#d9b23b'];
    body = seg(t0, t1, '#d9c294', bw, 'round') + seg(tt(.18), tt(.28), bands[0]) + seg(tt(.34), tt(.44), bands[1]) + seg(tt(.5), tt(.6), bands[2]) + seg(tt(.8), tt(.88), '#b39b5a')
      + seg(t0, t1, 'rgba(255,255,255,.38)', bw * .22, 'round', -bw * .26) + seg(t0, t1, 'rgba(90,70,30,.26)', bw * .2, 'round', bw * .3);
  }
  const mid = at(.5, Z), label = p.type === 'r330' ? '330 Ω' : p.type === 'r100k' ? '100 kΩ' : p.type === 'r10k' ? '10 kΩ' : '1N4001';
  return { svg: shadow + legs + body + halo(mid[0], mid[1] - bw - 4, label, 8.5),
    hit: [.1, .3, .5, .7, .9].map(q => { const h = at(q); return [h[0], h[1], 9]; }) };
}

/* an LED stands up from the board on its two legs, the flat of its rim on the short-leg side */
function ledArt(p, m){
  const st = m?.ledOf?.(p.id), lit = st?.lit, burnt = p.burnt;
  const A = holeXY(p.pins[0]), B = holeXY(p.pins[1]);
  const a = parse(p.pins[0]), b = parse(p.pins[1]);
  const u = (hu(a.c) + hu(b.c)) / 2, v = (hv(a.r) + hv(b.r)) / 2;
  const [cx, base, s] = proj(u, v, 13), top = proj(u, v, 40)[1];
  const r = 12.5 * s, ry = r * .5, glow = lit ? Math.min(1, .35 + st.i / .009 * .65) : 0;
  const fill = burnt ? '#3f362c' : lit ? 'url(#bbLit)' : 'url(#bbOff)';
  const [gx, gy] = proj(u, v);
  const axis = Math.atan2(B[1] - A[1], B[0] - A[0]);
  const fx = Math.cos(axis) * r * .84, fy = Math.sin(axis) * ry * .84;
  const svg = `${lit ? `<ellipse cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" rx="${(r * 5).toFixed(1)}" ry="${(r * 3).toFixed(1)}" fill="url(#bbGlow)" opacity="${glow.toFixed(2)}"/>` : ''}
    <ellipse cx="${(gx + 2).toFixed(1)}" cy="${(gy + 4).toFixed(1)}" rx="${(r * 1.05).toFixed(1)}" ry="${(ry * 1.1).toFixed(1)}" fill="rgba(29,33,23,.24)"/>
    ${lead(A, [cx - fx, base], 2.1)}${lead(B, [cx + fx, base], 1.7)}
    <ellipse cx="${cx.toFixed(1)}" cy="${base.toFixed(1)}" rx="${(r * 1.12).toFixed(1)}" ry="${(ry * 1.12).toFixed(1)}" fill="${burnt ? '#2b241c' : lit ? '#d9921f' : '#b97a3f'}" stroke="#7d4c1e" stroke-width=".8"/>
    <path d="M${(cx - r).toFixed(1)} ${base.toFixed(1)} V${(top + r * .9).toFixed(1)} A${r.toFixed(1)} ${(r * .95).toFixed(1)} 0 0 1 ${(cx + r).toFixed(1)} ${(top + r * .9).toFixed(1)} V${base.toFixed(1)} A${r.toFixed(1)} ${ry.toFixed(1)} 0 0 1 ${(cx - r).toFixed(1)} ${base.toFixed(1)} Z" fill="${fill}" stroke="${burnt ? '#1c1712' : '#8f5a24'}" stroke-width="1"/>
    <path d="M${(cx - r * .55).toFixed(1)} ${(base - 3).toFixed(1)} V${(top + r * .9).toFixed(1)}" stroke="#fff" stroke-width="${(1.8 * s).toFixed(1)}" stroke-linecap="round" opacity="${burnt ? .12 : .55}" fill="none"/>
    ${burnt ? `<path d="M${(cx - r * .5).toFixed(1)} ${(top + r * .5).toFixed(1)} l${(r * .4).toFixed(1)} ${(r * .7).toFixed(1)} l${(-r * .1).toFixed(1)} ${(r * .4).toFixed(1)} l${(r * .5).toFixed(1)} ${(r * .7).toFixed(1)}" stroke="var(--red)" stroke-width="1.2" fill="none"/>` : ''}
    ${halo(A[0], A[1] + 14, '+', 11, 'var(--amber)')}${halo(B[0], B[1] + 14, '−', 11)}`;
  return { svg, hit: [[cx, (top + base) / 2, r + 7]] };
}

/* a push button: a square body on two legs and a round cap, which sinks while it is held. It
   joins its legs only while held (labbench's solver reads p.closed) */
function btnArt(p){
  const a = parse(p.pins[0]), b = parse(p.pins[1]);
  const u = (hu(a.c) + hu(b.c)) / 2, v = (hv(a.r) + hv(b.r)) / 2, R = 13;
  const body = extrude([[u - R, v - R], [u + R, v - R], [u + R, v + R], [u - R, v + R]], 2, 12, { top: '#2c2e27', side: '#1a1b15', side2: '#23241e' });
  const down = p.closed, [cx, cy, s] = proj(u, v, down ? 14 : 18), r = 8.5 * s;
  const [lx, ly] = proj(u, v, 24);
  return { svg: `${lead(holeXY(p.pins[0]), proj(hu(a.c) * .5 + u * .5, hv(a.r) * .5 + v * .5, 3), 1.7)}${lead(holeXY(p.pins[1]), proj(hu(b.c) * .5 + u * .5, hv(b.r) * .5 + v * .5, 3), 1.7)}
    ${body}
    ${down ? '' : `<ellipse cx="${cx.toFixed(1)}" cy="${(cy + 4).toFixed(1)}" rx="${r.toFixed(1)}" ry="${(r * .72).toFixed(1)}" fill="#7d2f1e"/>`}
    <ellipse class="bench-cap" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${r.toFixed(1)}" ry="${(r * .72).toFixed(1)}" fill="${down ? '#a8412a' : '#d05a3c'}" stroke="#6b2a1a" stroke-width=".8"/>
    ${p.label ? halo(lx + 18, ly + 2, p.label, 11.5) : ''}`,
    hit: [[cx, cy, 16]], cap: [cx, cy] };
}

/* a shape in the board's plane pushed up from z0 to z1: side walls facing the viewer, then the
   top. outline is a list of [u, v] going clockwise on the page */
function extrude(outline, z0, z1, { top, side, side2, stroke = '#55594d' }){
  let walls = '';
  outline.forEach((q, i) => {
    const n = outline[(i + 1) % outline.length];
    if (n[0] >= q[0]) return;           // only walls whose outside faces the viewer
    walls += `<path d="M${poly([[q[0], q[1], z0], [n[0], n[1], z0], [n[0], n[1], z1], [q[0], q[1], z1]])}Z" fill="${Math.abs(n[1] - q[1]) > Math.abs(n[0] - q[0]) ? side2 : side}" stroke="${stroke}" stroke-width=".6"/>`;
  });
  return walls + `<path d="M${poly(outline.map(q => [q[0], q[1], z1]))}Z" fill="${top}" stroke="${stroke}" stroke-width=".8" stroke-linejoin="round"/>`;
}

function to92Art(p){
  const t = TYPES[p.type], hs = p.pins.map(parse), flip = hs[0].c > hs[2].c;
  const u0 = hu(Math.min(hs[0].c, hs[2].c)), u1 = hu(Math.max(hs[0].c, hs[2].c)), v = hv(hs[0].r);
  const L = u0 - 3, R = u1 + 3, um = (L + R) / 2, rad = (R - L) / 2, flat = flip ? -6 : 6, bulge = flip ? 1 : -1;
  const arc = [];
  for (let i = 0; i <= 14; i++){ const a = Math.PI * i / 14; arc.push([um - Math.cos(a) * rad, v + flat + bulge * Math.sin(a) * rad * 1.05]); }
  const outline = flip ? arc.concat([]).reverse() : arc;    // arc then the flat closes it
  const Z = 30, Z0 = 8;
  const [sx, sy] = proj(um + 2, v + 6);
  let wall;
  if (!flip){
    wall = `<path d="M${poly([[R, v + flat, Z0], [L, v + flat, Z0], [L, v + flat, Z], [R, v + flat, Z]])}Z" fill="#23241e" stroke="#55594d" stroke-width=".7"/>`;
  } else {
    wall = '';
    for (let i = 0; i < 14; i++){
      const a = arc[i], b = arc[i + 1], shade = 26 + Math.round(16 * Math.sin(Math.PI * i / 14));
      wall += `<path d="M${poly([[a[0], a[1], Z0], [b[0], b[1], Z0], [b[0], b[1], Z], [a[0], a[1], Z]])}Z" fill="rgb(${shade},${shade + 1},${shade - 4})"/>`;
    }
  }
  const topFace = `<path d="M${poly(outline.map(q => [q[0], q[1], Z]))}Z" fill="#3b3e36" stroke="#55594d" stroke-width=".8"/>`;
  const legs = p.pins.map(k => { const [x, y] = holeXY(k); const q = parse(k); return lead([x, y], proj(hu(q.c) * .78 + um * .22, v + flat * .6, Z0), 1.6); }).join('');
  const face = proj(um, v + flat, (Z + Z0) / 2 - 2), letters = p.pins.map((k, i) => { const [x, y] = holeXY(k); return halo(x, y + 15, t.legs[i], 9.5); }).join('');
  const name = p.type === 'bc547' ? 'BC547' : '2N7000';
  return { svg: `<ellipse cx="${sx.toFixed(1)}" cy="${(sy + 3).toFixed(1)}" rx="${(rad + 5).toFixed(1)}" ry="9" fill="rgba(29,33,23,.24)"/>
    ${legs}${wall}${topFace}
    <text x="${face[0].toFixed(1)}" y="${(face[1] + 3).toFixed(1)}" class="lbl" font-size="7.5" style="fill:#c8c8bc">${flip ? '' : name}</text>
    ${flip ? halo(proj(um, v - rad - 6, Z)[0], proj(um, v - rad - 6, Z)[1] - 3, name, 8) : ''}${letters}`,
    hit: [[proj(um, v, 18)[0], proj(um, v, 18)[1], 24]] };
}

function chipArt(p){
  const c = parse(p.pins[0]).c, u0 = hu(c) - 8, u1 = hu(c + 6) + 8, v0 = hv('e') + 8, v1 = hv('f') - 8, Z = 15;
  const body = extrude([[u0, v0], [u1, v0], [u1, v1], [u0, v1]], 6, Z, { top: '#2c2e27', side: '#1a1b15', side2: '#23241e' });
  const pins = p.pins.map((k, i) => {
    const q = parse(k), near = i < 7, edge = near ? v1 : v0;
    const a = holeXY(k), b = proj(hu(q.c), edge, 8);
    const n = i + 1, [x, y] = a;
    return `<path d="M${pp(a)} L${pp(b)}" stroke="#a7a89e" stroke-width="5" stroke-linecap="butt"/>
      <path d="M${pp(a)} L${pp(b)}" stroke="#d6d6ce" stroke-width="3.2"/>
      ${halo(x, near ? y + 15 : y - 7, n, 8.5, n === 1 || n === 7 || n === 14 ? 'var(--ink)' : 'var(--ink-soft)')}`;
  }).join('');
  const [nx, ny, ns] = proj(u0, (v0 + v1) / 2, Z), [dx, dy] = proj(u0 + 11, v1 - 9, Z), [tx, ty] = proj((u0 + u1) / 2 + 6, (v0 + v1) / 2, Z);
  return { svg: `<path d="M${poly([[u0 + 2, v0 + 6], [u1 + 2, v0 + 6], [u1 + 2, v1 + 8], [u0 + 2, v1 + 8]])}Z" fill="rgba(29,33,23,.24)"/>
    ${pins}${body}
    <path d="M${nx.toFixed(1)} ${(ny - 9 * ns).toFixed(1)} A${(9 * ns).toFixed(1)} ${(9 * ns).toFixed(1)} 0 0 1 ${nx.toFixed(1)} ${(ny + 9 * ns).toFixed(1)} Z" fill="#101109"/>
    <circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="${(3 * ns).toFixed(1)}" fill="#66695c"/>
    <text x="${tx.toFixed(1)}" y="${(ty + 3).toFixed(1)}" class="lbl" font-size="10.5" style="fill:#c8c8bc;letter-spacing:.06em">${p.type === 'hc00' ? '74HC00' : '74HC04'}</text>`,
    hit: [0, 1, 2, 3, 4, 5, 6].map(i => { const q = proj(hu(c + i), (v0 + v1) / 2, Z); return [q[0], q[1], 24]; }) };
}

function partArt(p, m){
  if (p.type === 'wire') return wireArt(p);
  if (p.type === 'led') return ledArt(p, m);
  if (p.type === 'bc547' || p.type === 'n7000') return to92Art(p);
  if (p.type === 'btn') return btnArt(p);
  if (isChip(p.type)) return chipArt(p);
  return axialArt(p, m);
}

/* ---------- the circuit solver ---------- */
const VCC = 5, LED_VF = 2, LED_R = 10, LED_MAX = .03, D_VF = .7, D_R = .5;
const BETA = 200, RBE = 100, RCE = 5, VSAT = .2, RDS = 5, VTH = 2.1, ROUT = 50, TRIP = .5, GOFF = 1e-9;

function baseNet(k){
  const { c, r } = parse(k);
  if (r === 'T+' || r === 'B+') return 'V';
  if (r === 'T-' || r === 'B-') return 'G';
  return ('abcde'.includes(r) ? 't' : 'b') + c;
}

function linSolve(A, b){
  const n = b.length;
  for (let i = 0; i < n; i++){
    let piv = i;
    for (let j = i + 1; j < n; j++) if (Math.abs(A[j][i]) > Math.abs(A[piv][i])) piv = j;
    [A[i], A[piv]] = [A[piv], A[i]]; [b[i], b[piv]] = [b[piv], b[i]];
    const d = A[i][i] || 1e-30;
    for (let j = i + 1; j < n; j++){
      const f = A[j][i] / d;
      if (!f) continue;
      for (let k = i; k < n; k++) A[j][k] -= f * A[i][k];
      b[j] -= f * b[i];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--){
    let s = b[i];
    for (let k = i + 1; k < n; k++) s -= A[i][k] * x[k];
    x[i] = s / (A[i][i] || 1e-30);
  }
  return x;
}

/* One solution of the board. turned: the id of a part to solve as if it were the other way
   round, which is how the bench can say "that LED is in backwards" */
function solve(parts, turned = null){
  const uf = {}, find = a => { uf[a] ??= a; while (uf[a] !== a) a = uf[a] = uf[uf[a]]; return a; };
  const join = (a, b) => { uf[find(a)] = find(b); };
  find('V'); find('G');
  for (const p of parts) p.pins.forEach(k => find(baseNet(k)));
  for (const p of parts) if (p.type === 'wire' || (p.type === 'btn' && p.closed)) join(baseNet(p.pins[0]), baseNet(p.pins[1]));
  const netOf = k => find(baseNet(k));
  const short = find('V') === find('G');

  const roots = [...new Set(Object.keys(uf).map(find))];
  const idx = new Map(roots.map((r, i) => [r, i]));
  const n = roots.length, iV = idx.get(find('V')), iG = idx.get(find('G'));
  const at = k => idx.get(netOf(k));

  const els = [];
  for (const p of parts){
    const pins = p.id === turned ? [...p.pins].reverse() : p.pins;
    if (TYPES[p.type].ohms) els.push({ k: 'r', a: at(pins[0]), b: at(pins[1]), g: 1 / TYPES[p.type].ohms, p });
    else if (p.type === 'led'){ if (!p.burnt) els.push({ k: 'd', a: at(pins[0]), b: at(pins[1]), vf: LED_VF, ron: LED_R, on: false, p }); }
    else if (p.type === 'diode') els.push({ k: 'd', a: at(pins[0]), b: at(pins[1]), vf: D_VF, ron: D_R, on: false, p });
    else if (p.type === 'bc547') els.push({ k: 'q', c: at(pins[0]), b: at(pins[1]), e: at(pins[2]), be: false, bc: false, ce: 'none', p });
    else if (p.type === 'n7000') els.push({ k: 'm', s: at(pins[0]), g: at(pins[1]), d: at(pins[2]), on: false, body: false, p });
    else if (isChip(p.type)){
      const pin = i => at(pins[i - 1]);
      /* a gate starts from the state it was left in, which is how two gates feeding each other
         remember: at rest either state is stable, and the last one holds */
      for (const [ins, o] of GATES[p.type]) els.push({ k: 'i', ins: ins.map(i => ({ net: pin(i), pin: i })), out: pin(o), vcc: pin(14), gnd: pin(7),
        inPin: ins[0], outPin: o, drive: p.mem?.drive?.[o] ?? null, p });
    }
  }

  /* a net is driven when some conducting path reaches a rail; a gate or chip input alone does
     not drive its net, so a net with only those on it is floating and holds its last voltage */
  const dr = {}, dfind = a => { dr[a] ??= a; while (dr[a] !== a) a = dr[a] = dr[dr[a]]; return a; };
  const djoin = (a, b) => { dr[dfind(a)] = dfind(b); };
  for (const e of els){
    if (e.k === 'r' || e.k === 'd') djoin(e.a, e.b);
    if (e.k === 'q'){ djoin(e.c, e.e); djoin(e.b, e.e); }
    if (e.k === 'm') djoin(e.d, e.s);
    if (e.k === 'i'){ djoin(e.out, e.vcc); djoin(e.out, e.gnd); }
  }
  const driven = i => dfind(i) === dfind(iV) || dfind(i) === dfind(iG);

  let V = new Array(n).fill(0), osc = false;
  const seen = new Set();
  const gateMem = e => e.p.mem?.g ?? 0;
  const inV = (e, x) => (driven(x.net) ? V[x.net] : e.p.mem?.[x.pin] ?? 0);
  if (!short) for (let iter = 0; iter < 80; iter++){
    const A = Array.from({ length: n }, () => new Array(n).fill(0)), b = new Array(n).fill(0);
    const G = (a, c, g) => { A[a][a] += g; A[c][c] += g; A[a][c] -= g; A[c][a] -= g; };
    const drop = (a, c, g, v) => { G(a, c, g); b[a] += v * g; b[c] -= v * g; };
    for (let i = 0; i < n; i++) A[i][i] += GOFF;
    A[iV][iV] += 1e4; b[iV] += 1e4 * VCC; A[iG][iG] += 1e4;
    for (const e of els){
      if (e.k === 'r') G(e.a, e.b, e.g);
      if (e.k === 'd'){ if (e.on) drop(e.a, e.b, 1 / e.ron, e.vf); else G(e.a, e.b, GOFF); }
      if (e.k === 'q'){
        if (e.be) drop(e.b, e.e, 1 / RBE, D_VF); else G(e.b, e.e, GOFF);
        if (e.bc) drop(e.b, e.c, 1 / RBE, D_VF); else G(e.b, e.c, GOFF);
        if (e.ce === 'sat') drop(e.c, e.e, 1 / RCE, VSAT);
        else if (e.ce === 'act'){
          const gm = BETA / RBE;
          A[e.c][e.b] += gm; A[e.c][e.e] -= gm; A[e.e][e.b] -= gm; A[e.e][e.e] += gm;
          b[e.c] += gm * D_VF; b[e.e] -= gm * D_VF;
        } else G(e.c, e.e, GOFF);
      }
      if (e.k === 'm'){
        G(e.d, e.s, e.on ? 1 / RDS : GOFF);
        if (e.body) drop(e.s, e.d, 1 / D_R, D_VF);
      }
      if (e.k === 'i' && e.drive) G(e.out, e.drive === 'h' ? e.vcc : e.gnd, 1 / ROUT);
    }
    V = linSolve(A, b);
    let sig = '', gateMoved = false;
    for (const e of els){
      if (e.k === 'd'){
        const v = V[e.a] - V[e.b];
        e.on = e.on ? v - e.vf > 0 : v > e.vf + 1e-6;
        sig += e.on ? 1 : 0;
      }
      if (e.k === 'q'){
        const vbe = V[e.b] - V[e.e], vbc = V[e.b] - V[e.c], vce = V[e.c] - V[e.e];
        e.be = e.be ? vbe - D_VF > 0 : vbe > D_VF + 1e-6;
        e.bc = e.bc ? vbc - D_VF > 0 : vbc > D_VF + 1e-6;
        const ib = e.be ? (vbe - D_VF) / RBE : 0;
        if (!e.be) e.ce = 'none';
        else if (e.ce === 'none') e.ce = vce > VSAT ? 'act' : vce > 0 ? 'sat' : 'none';
        else if (e.ce === 'act') { if (vce < VSAT) e.ce = 'sat'; }
        else { const ice = (vce - VSAT) / RCE; if (ice > BETA * ib) e.ce = 'act'; else if (ice < 0) e.ce = 'none'; }
        sig += (e.be ? 1 : 0) + (e.bc ? 1 : 0) + e.ce[0];
      }
      if (e.k === 'm'){
        const vg = driven(e.g) ? V[e.g] : gateMem(e);
        e.on = vg - V[e.s] > VTH;
        const vb = V[e.s] - V[e.d];
        e.body = e.body ? vb - D_VF > 0 : vb > D_VF + 1e-6;
        sig += (e.on ? 1 : 0) + (e.body ? 1 : 0);
      }
      if (e.k === 'i'){
        const vcc = V[e.vcc], gnd = V[e.gnd];
        const want = vcc - gnd < 2 ? null : e.ins.every(x => inV(e, x) > (vcc + gnd) / 2) ? 'l' : 'h';
        /* one gate moves per pass, as real gates never switch in perfect step: two gates feeding
           each other then settle instead of chasing one another for ever */
        if (want !== e.drive && !gateMoved){ e.drive = want; gateMoved = true; }
        sig += e.drive || '0';
      }
    }
    if (seen.has(sig)){ osc = iter > 0 && [...seen].pop() !== sig; break; }
    seen.add(sig);
  }

  const supplyI = short ? Infinity : (VCC - V[iV]) * 1e4;
  const tripped = !short && supplyI > TRIP;
  if (short || tripped) V = V.map(() => 0);

  const dead = short || tripped;
  const leds = [], diodes = [], qs = [], mos = [], chips = new Map();
  for (const e of els){
    if (e.k === 'd'){
      const i = !dead && e.on ? (V[e.a] - V[e.b] - e.vf) / e.ron : 0;
      (e.p.type === 'led' ? leds : diodes).push({ p: e.p, i, a: e.a, b: e.b, lit: i > .0002 });
    }
    if (e.k === 'q'){
      const ib = !dead && e.be ? (V[e.b] - V[e.e] - D_VF) / RBE : 0;
      const vce = V[e.c] - V[e.e];
      const ic = dead ? 0 : e.ce === 'sat' ? (vce - VSAT) / RCE : e.ce === 'act' ? BETA * ib : 0;
      qs.push({ p: e.p, ib, ic, baseDriven: driven(e.b) });
    }
    if (e.k === 'm'){
      const fl = !driven(e.g), vg = dead ? 0 : fl ? gateMem(e) : V[e.g];
      mos.push({ p: e.p, vg, floating: fl, on: !dead && e.on, gateNet: e.g, id: !dead && e.on ? (V[e.d] - V[e.s]) * (1 / RDS) : 0 });
    }
    if (e.k === 'i'){
      let c = chips.get(e.p.id);
      if (!c) chips.set(e.p.id, c = { p: e.p, vcc: V[e.vcc], gnd: V[e.gnd], powered: !dead && V[e.vcc] - V[e.gnd] > 2, inv: [] });
      const ins = e.ins.map(x => ({ pin: x.pin, floating: !driven(x.net), v: dead ? 0 : inV(e, x) }));
      c.inv.push({ inPin: e.inPin, outPin: e.outPin, ins, vin: ins[0].v, vout: dead ? 0 : V[e.out], floating: ins.some(x => x.floating), drive: e.drive, outNet: e.out });
    }
  }
  const voltOf = k => { const i = at(k); return i === undefined ? 0 : V[i]; };
  const floatingNet = k => { const i = at(k); return i !== iV && i !== iG && !driven(i); };
  return { short, tripped, supplyI, osc, V, leds, diodes, qs, mos, chips: [...chips.values()], netOf, at, voltOf, floatingNet, iV, iG,
    /* can current get from net a to net b, leaving one part out? */
    reach(a, b, without){
      const seen = new Set([a]), todo = [a];
      while (todo.length){
        const n = todo.pop();
        if (n === b) return true;
        for (const e of els){
          if (e.p.id === without) continue;
          const links = e.k === 'r' || e.k === 'd' ? [[e.a, e.b]] : e.k === 'q' ? [[e.c, e.e], [e.b, e.e]] : e.k === 'm' ? [[e.d, e.s]] : [[e.out, e.vcc], [e.out, e.gnd]];
          for (const [x, y] of links){
            const to = x === n ? y : y === n ? x : null;
            if (to !== null && !seen.has(to)){ seen.add(to); todo.push(to); }
          }
        }
      }
      return false;
    } };
}

/* solve, let parts that took too much burn out, solve again; remember gate and input charge */
function analyse(parts){
  let M = solve(parts), burnt = null;
  for (let pass = 0; pass < 6; pass++){
    const over = M.leds.find(l => l.i > LED_MAX);
    if (!over) break;
    over.p.burnt = true; over.p.burntAt = over.i; burnt = over.p;
    M = solve(parts);
  }
  M.justBurnt = burnt;
  if (!M.short && !M.tripped){
    for (const m of M.mos) if (!m.floating) (m.p.mem ??= {}).g = m.vg;
    for (const c of M.chips) for (const v of c.inv){
      const mem = c.p.mem ??= {};
      (mem.drive ??= {})[v.outPin] = v.drive;
      for (const x of v.ins) if (!x.floating) mem[x.pin] = x.v;
    }
  }
  M.ledOf = id => M.leds.find(l => l.p.id === id);
  return M;
}

/* what to tell the student about the board as it stands, in plain sentences, naming the column
   that needs attention. marks are the same advice on the board: a red ring and a short arrow
   (N-148). Paths are checked with the LED itself left out, or a leg would "reach" a rail through
   its own other leg, which is how a half-connected LED used to get no useful answer. */
const mA = i => {
  const v = Math.abs(i) * 1000;
  return v >= 100 ? `about ${Math.round(v / 10) * 10} mA` : v >= 10 ? `about ${Math.round(v)} mA` : `about ${v.toFixed(v < 1 ? 2 : 1)} mA`;
};
const holeName = k => {
  const { c, r } = parse(k);
  return isRail(r) ? (r.endsWith('+') ? 'the + rail' : 'the − rail') : `column ${c}`;
};
function ledAdvice(parts, M, l){
  const [ka, kb] = l.p.pins, a = holeName(ka), b = holeName(kb);
  if (l.a === l.b) return { text: `Both legs of the LED are in holes that are joined, so current goes round it. Move one leg to another column.`, marks: [{ k: kb, label: 'move this leg' }] };
  const flip = solve(parts, l.p.id).leds.find(x => x.p.id === l.p.id);
  if (flip?.lit) return { text: `The LED is in backwards, so it blocks the current. Its long leg goes on the + side. Tap it and choose Turn round.`, marks: [{ k: ka, label: 'long leg is on the wrong side' }] };
  const rev = M.diodes.find(d => solve(parts, d.p.id).leds.find(x => x.p.id === l.p.id)?.lit);
  if (rev) return { text: `The diode is in backwards, so it blocks the current and the LED stays dark. Tap it and choose Turn round.`, marks: [{ k: rev.p.pins[0], label: 'diode is backwards' }] };
  const other = M.leds.find(o => o !== l && solve(parts, o.p.id).leds.find(x => x.p.id === l.p.id)?.lit);
  if (other) return { text: `The other LED in this path is in backwards, so it blocks the current.`, marks: [{ k: other.p.pins[0], label: 'this LED is backwards' }] };
  const inv = M.chips.flatMap(c => c.inv).find(v => v.drive === 'l' && M.reach(l.a, v.outNet, l.p.id));
  if (inv) return { text: `Pin ${inv.outPin} is low, so the LED has no voltage across it and stays dark.`, marks: [] };
  const fromV = M.reach(l.a, M.iV, l.p.id), toG = M.reach(l.b, M.iG, l.p.id);
  if (fromV && toG){
    const q = M.qs.find(x => x.ic < 1e-6), m = M.mos.find(x => !x.on);
    if (q && q.ib < 1e-7) return { text: `No current flows into the base, so the transistor is off and the LED stays dark.`, marks: [] };
    if (m) return { text: `The gate is below about 2 V, so the transistor is off and the LED stays dark.`, marks: [] };
    if (M.leds.length > 2) return { text: `Each LED in a row takes about 2 V, and the supply only has 5 V, so this row is too long to light.`, marks: [] };
    return { text: `The LED has a path both ways, but something in it is blocking the current.`, marks: [] };
  }
  if (!fromV){
    const onG = M.reach(l.a, M.iG, l.p.id);
    return { text: `The LED's long leg is in ${a}${onG ? ', which leads to the − rail. It' : ', and nothing joins that to the + rail. It'} needs a path from the + rail. Add a wire or a resistor from the + rail to ${a}.`,
      marks: [{ k: ka, label: 'needs a path from + rail' }] };
  }
  const onV = M.reach(l.b, M.iV, l.p.id);
  return { text: `The LED's short leg is in ${b}${onV ? ', which leads to the + rail. It' : ', and nothing joins that to the − rail. It'} needs a path to the − rail. Add a wire from ${b} to the − rail.`,
    marks: [{ k: kb, label: 'needs a path to − rail' }] };
}
function diagnose(parts, M){
  if (M.short){
    const w = parts.find(p => p.type === 'wire' && M.netOf(p.pins[0]) === M.netOf('2:T+'));
    return { bad: true, text: `The + rail and the − rail are joined by a bare wire, which is a short circuit. The supply has cut out. Tap that wire and choose Pull out.`, marks: w ? [{ k: w.pins[0], label: 'short circuit' }] : [] };
  }
  if (M.tripped) return { bad: true, text: `Far too much current is flowing, about ${M.supplyI.toFixed(1)} A, so the supply has cut out. Something needs a resistor in its path.`, marks: [] };
  const notes = [], marks = [];
  for (const c of M.chips){
    if (c.vcc < c.gnd - 1) return { bad: true, text: `This chip's power is the wrong way round. Pin 14 goes to the + rail and pin 7 goes to the − rail.`, marks: [] };
    if (!c.powered){
      notes.push(`The chip has no power yet. Wire pin 14 to the + rail and pin 7 to the − rail.`);
      marks.push({ k: c.p.pins[13], label: 'pin 14 to + rail' }, { k: c.p.pins[6], label: 'pin 7 to − rail' });
    }
  }
  const burnt = parts.find(p => p.type === 'led' && p.burnt);
  if (burnt){
    const n = burnt.burntAt ? mA(burnt.burntAt) : 'too much current';
    notes.push(`That LED took ${n} and burnt out. It can carry about 20 mA. Unplug it and take a new one, with a resistor in its path.`);
  }
  for (const l of M.leds){
    if (l.lit){ notes.push(`The LED is lit, carrying ${mA(l.i)}.`); continue; }
    const a = ledAdvice(parts, M, l);
    notes.push(a.text); marks.push(...a.marks);
  }
  if (!parts.some(p => p.type === 'led') && parts.length) notes.push(`Add an LED, so you can see when current flows.`);
  for (const q of M.qs) if (q.ic > 1e-4) notes.push(`A base current of ${mA(q.ib)} is switching ${mA(q.ic)} through the collector.`);
  for (const m of M.mos){
    if (m.floating) notes.push(`The gate is joined to nothing, so it still holds ${m.vg.toFixed(1)} V. On a real bench a stray charge can shift it, so you would not leave it like this.`);
    else if (m.on) notes.push(`The gate is at ${m.vg.toFixed(1)} V and no current flows into it.`);
  }
  for (const c of M.chips) if (c.powered){
    const used = v => parts.some(p => p.id !== c.p.id && p.pins.some(k => M.at(k) === v.outNet));
    const open = c.inv.find(v => v.floating && used(v));
    if (open) notes.push(`Input pin ${open.ins.find(x => x.floating).pin} is joined to nothing, and a floating input can settle on either value. Tie it to a rail.`);
  }
  if (M.osc) notes.push(`An output is feeding its own input, so it has no steady value.`);
  return { bad: !!burnt, text: notes.slice(0, 3).join(' '), marks: marks.slice(0, 2) };
}

/* ---------- reading the board for goals ---------- */
const lit = M => M.leds.some(l => l.lit);
const dark = (parts, M) => parts.some(p => p.type === 'led' && !p.burnt) && !lit(M);
const anyBurnt = parts => parts.some(p => p.type === 'led' && p.burnt);
const has = (parts, type) => parts.some(p => p.type === type);

export const BENCHES = {
  led: {
    id: 'led', parts: ['led', 'r330'],
    goals: [
      { text: `Light the LED. Run a path from the + rail, through the resistor and the LED, and back to the − rail.`,
        done: (parts, M) => lit(M) && has(parts, 'r330'),
        said: `Current leaves the + rail, passes through the resistor and the LED, and returns to ground. That is your battery-and-lamp test on a real board.`,
        build: [['wire', '4:a', '4:T+'], ['r330', '4:c', '9:c'], ['led', '9:e', '11:e'], ['wire', '11:a', '11:T-']] },
      { text: `Tap the LED and choose Turn round. It goes dark, and the next step shows you why.`,
        done: (parts, M) => dark(parts, M) && M.leds.some(l => solve(parts, l.p.id).leds.find(x => x.p.id === l.p.id)?.lit),
        said: `The LED only passes current one way. Its long leg has to be on the + side.`,
        build: [['wire', '4:a', '4:T+'], ['r330', '4:c', '9:c'], ['led', '11:e', '9:e'], ['wire', '11:a', '11:T-']] },
      { text: `Turn it back, then run a wire past the resistor, so that nothing limits the current. Watch the LED.`,
        done: parts => anyBurnt(parts),
        said: `With no resistor, the LED took far more than the 20 mA it can carry. This is why every LED on a board has a resistor beside it.`,
        build: [['wire', '4:a', '4:T+'], ['r330', '4:c', '9:c'], ['led', '9:e', '11:e'], ['wire', '11:a', '11:T-'], ['wire', '4:d', '9:d']] },
    ],
    free: `That is the whole list, and the bench is yours for as long as you like. Try two LEDs in a row, or two side by side.`,
  },
  diode: {
    id: 'diode', parts: ['led', 'r330', 'diode'],
    goals: [
      { text: `Here is your diode test. Build a path from the + rail, through the diode with its band towards the LED, the resistor and the LED, to the − rail.`,
        done: (parts, M) => lit(M) && M.diodes.some(d => d.i > .0005),
        said: `The LED lights, with a little less current than before: the diode takes about 0.7 V of the 5 V.`,
        build: [['wire', '4:a', '4:T+'], ['diode', '4:c', '9:c'], ['r330', '9:e', '14:e'], ['led', '14:c', '16:c'], ['wire', '16:a', '16:T-']] },
      { text: `Tap the diode and choose Turn round, band towards the supply.`,
        done: (parts, M) => dark(parts, M) && M.diodes.some(d => d.i < 1e-5),
        said: `The LED goes out, just as your lamp did when you flipped the battery.`,
        build: [['wire', '4:a', '4:T+'], ['diode', '9:c', '4:c'], ['r330', '9:e', '14:e'], ['led', '14:c', '16:c'], ['wire', '16:a', '16:T-']] },
    ],
    free: `That is the whole list, and the bench is yours for as long as you like. Try a second diode in the path and see how the current changes.`,
  },
  npn: {
    id: 'npn', parts: ['led', 'r330', 'r100k', 'bc547'],
    goals: [
      { text: `Build your transistor test. Run the 330 Ω resistor and the LED from the + rail to the collector, C. Wire the emitter, E, to ground. Feed the base, B, from the + rail through 100 kΩ.`,
        done: (parts, M) => lit(M) && M.qs.some(q => q.ib > 1e-6 && q.ic > .001),
        said: `A tiny current flows into the base, about 0.04 mA, and it switches on several milliamps through the LED.`,
        build: [['wire', '4:a', '4:T+'], ['r330', '4:c', '9:c'], ['led', '9:e', '11:e'], ['wire', '11:b', '15:b'], ['bc547', '15:d', '16:d', '17:d'], ['wire', '17:a', '17:T-'], ['r100k', '16:b', '21:b'], ['wire', '21:a', '21:T+']] },
      { text: `Move the base wire to the − rail. Press on the end of the wire and drag it across.`,
        done: (parts, M) => dark(parts, M) && M.qs.some(q => q.ib < 1e-7),
        said: `With no base current, the transistor stops the much larger current through the LED.`,
        build: [['wire', '4:a', '4:T+'], ['r330', '4:c', '9:c'], ['led', '9:e', '11:e'], ['wire', '11:b', '15:b'], ['bc547', '15:d', '16:d', '17:d'], ['wire', '17:a', '17:T-'], ['r100k', '16:b', '21:b'], ['wire', '21:a', '21:T-']] },
    ],
    free: `That is the whole list, and the bench is yours for as long as you like. Try feeding the base with the 330 Ω resistor and compare the base current.`,
  },
  nmos: {
    id: 'nmos', parts: ['led', 'r330', 'n7000'],
    goals: [
      { text: `Build your NMOS test. Run the resistor and the LED from the + rail to the drain, D. Wire the source, S, to ground and the gate, G, to the + rail.`,
        done: (parts, M) => lit(M) && M.mos.some(m => m.on && !m.floating),
        said: `The LED lights, and no current flows into the gate: it only holds a voltage.`,
        build: [['wire', '4:a', '4:T+'], ['r330', '4:c', '9:c'], ['led', '9:e', '11:e'], ['wire', '11:b', '17:b'], ['n7000', '15:d', '16:d', '17:d'], ['wire', '15:a', '15:T-'], ['wire', '16:a', '16:T+']] },
      { text: `Move the gate wire to the − rail. Press on the end of the wire and drag it across.`,
        done: (parts, M) => dark(parts, M) && M.mos.some(m => !m.on && !m.floating),
        said: `The LED goes out. In both positions the gate takes no current.`,
        build: [['wire', '4:a', '4:T+'], ['r330', '4:c', '9:c'], ['led', '9:e', '11:e'], ['wire', '11:b', '17:b'], ['n7000', '15:d', '16:d', '17:d'], ['wire', '15:a', '15:T-'], ['wire', '16:a', '16:T-']] },
      { text: `Put the gate wire back on the + rail so the LED lights. Then tap that wire and choose Pull out, so the gate is joined to nothing.`,
        done: (parts, M) => lit(M) && M.mos.some(m => m.on && m.floating),
        said: `The LED stays lit, because the gate holds its voltage with no wire on it, as the gate you built did.`,
        build: [['wire', '4:a', '4:T+'], ['r330', '4:c', '9:c'], ['led', '9:e', '11:e'], ['wire', '11:b', '17:b'], ['n7000', '15:d', '16:d', '17:d'], ['wire', '15:a', '15:T-']],
        after: parts => { parts.find(p => p.type === 'n7000').mem = { g: VCC }; } },
    ],
    free: `That is the whole list, and the bench is yours for as long as you like. Touch the empty gate to a rail with a new wire and see it change.`,
  },
  inverter: {
    id: 'inverter', parts: ['led', 'r330', 'hc04'],
    goals: [
      { text: `Pick the chip and tap a column to plug it in across the channel. The notch and the dot mark pin 1. Wire pin 14 to the + rail and pin 7 to the − rail.`,
        done: (parts, M) => M.chips.some(c => c.powered),
        said: `The chip has power. Inside it are six inverters, and each one takes an input pin and drives an output pin.`,
        build: [['hc04', 8], ['wire', '8:a', '8:T+'], ['wire', '14:j', '14:B-']] },
      { text: `Wire pin 1, an input, to the − rail. Pin 2 is its output, so it goes high. Light the LED from pin 2, through the resistor, to the − rail.`,
        done: (parts, M) => lit(M) && M.chips.some(c => c.inv[0].drive === 'h' && !c.inv[0].floating && c.inv[0].vin < 1),
        said: `Input low, output high. That is your CMOS inverter, lighting an LED.`,
        build: [['hc04', 8], ['wire', '8:a', '8:T+'], ['wire', '14:j', '14:B-'], ['wire', '8:j', '8:B-'], ['r330', '9:i', '15:i'], ['led', '15:h', '17:h'], ['wire', '17:j', '17:B-']] },
      { text: `Move the input wire from the − rail to the + rail. Press on the end of the wire and drag it across.`,
        done: (parts, M) => dark(parts, M) && M.chips.some(c => c.inv[0].drive === 'l' && !c.inv[0].floating),
        said: `Input high, output low, so the LED goes out. It is the same inverter you built, and it draws almost no current between flips.`,
        build: [['hc04', 8], ['wire', '8:a', '8:T+'], ['wire', '14:j', '14:B-'], ['wire', '8:j', '8:B+'], ['r330', '9:i', '15:i'], ['led', '15:h', '17:h'], ['wire', '17:j', '17:B-']] },
    ],
    free: `That is the whole list, and the bench is yours for as long as you like. Feed pin 2 into pin 3 and take the LED from pin 4: two inverters in a row give back the input.`,
  },
};
const NAND_BASE = [['hc00', 8], ['wire', '8:a', '8:T+'], ['wire', '14:j', '14:B-']];
const NAND_LED = [['r330', '10:i', '16:i'], ['led', '16:h', '18:h'], ['wire', '18:j', '18:B-']];
BENCHES.nand = {
  id: 'nand', parts: ['led', 'r330', 'hc00'],
  goals: [
    { text: `Pick the 74HC00 and tap a column to plug it in across the gap. Wire pin 14 to the + rail and pin 7 to the − rail.`,
      done: (parts, M) => M.chips.some(c => c.powered),
      said: `The chip has power, and its four NAND gates are ready. Gate 1 takes pins 1 and 2 and drives pin 3.`,
      build: NAND_BASE },
    { text: `Wire pins 1 and 2 to the + rail, so both inputs are 1. Then run pin 3 through the resistor and the LED to the − rail.`,
      done: (parts, M) => M.chips.some(c => { const g = c.inv[0]; return c.powered && !g.floating && g.drive === 'l' && M.leds.some(l => M.reach(l.a, g.outNet, l.p.id)); }),
      said: `Both inputs are 1, so the output is 0 and the LED stays dark. That is your gate, on a real chip.`,
      build: [...NAND_BASE, ['wire', '8:j', '8:B+'], ['wire', '9:j', '9:B+'], ...NAND_LED] },
    { text: `Move the wire on pin 2 to the − rail. Press on the end of the wire and drag it across.`,
      done: (parts, M) => lit(M) && M.chips.some(c => { const g = c.inv[0]; return !g.floating && g.drive === 'h' && g.ins.some(x => x.v < 1); }),
      said: `One input is now 0, so the output goes to 1 and the LED lights.`,
      build: [...NAND_BASE, ['wire', '8:j', '8:B+'], ['wire', '9:j', '9:B-'], ...NAND_LED] },
  ],
  free: `That is the whole list, and the bench is yours for as long as you like. Join pins 1 and 2 with one wire and you have a NOT gate.`,
};
/* the latch you built, on one chip: gate 1 is pins 1 and 2 to 3, gate 2 is pins 4 and 5 to 6.
   Pin 6 feeds pin 2 and pin 3 feeds pin 4. A 10 kΩ holds each free input at 5 V, and a button
   pulls it to ground. It starts holding a 0. */
const LATCH = [['hc00', 10], ['wire', '10:a', '10:T+'], ['wire', '16:j', '16:B-'],
  ['wire', '15:g', '11:g'], ['wire', '12:g', '13:g'],
  ['wire', '10:g', '6:g'], ['r10k', '6:h', '2:h'], ['wire', '2:j', '2:B+'], ['btn', '6:j', '6:B-', { label: 'S' }],
  ['wire', '14:g', '20:g'], ['r10k', '20:h', '24:h'], ['wire', '24:j', '24:B+'], ['btn', '20:j', '20:B-', { label: 'R' }],
  ['r330', '12:h', '17:h'], ['led', '17:i', '19:i'], ['wire', '19:j', '19:B-']];
const holdingZero = parts => { parts.find(p => p.type === 'hc00').mem = { drive: { 3: 'l', 6: 'h' } }; };
const noneHeld = parts => parts.every(p => !p.closed);
BENCHES.latch = {
  id: 'latch', parts: ['led', 'r330', 'r10k', 'btn', 'hc00'],
  start: LATCH, startAfter: holdingZero,
  goals: [
    { text: `This is your SR latch, built on one 74HC00 with two buttons. Press the round cap of button S, then let go.`,
      done: (parts, M) => noneHeld(parts) && lit(M) && M.chips.some(c => c.inv[0].drive === 'h'),
      said: `The LED lit, and it stayed lit after you let go. The latch holds the bit, not the button.`,
      build: LATCH, after: parts => { parts.find(p => p.type === 'hc00').mem = { drive: { 3: 'h', 6: 'l' } }; } },
    { text: `Now press button R, then let go.`,
      done: (parts, M) => noneHeld(parts) && dark(parts, M) && M.chips.some(c => c.inv[0].drive === 'l'),
      said: `The LED went out and stayed out. Two wires hold it there: pin 3 to pin 4, and pin 6 to pin 2.`,
      build: LATCH, after: holdingZero },
  ],
  free: `That is the whole list, and the bench is yours for as long as you like. Pull out one of the two feedback wires and see what the latch can no longer do.`,
};

/* The walkthrough (N-147). It happens on the board: Next changes what the stage shows, arrows
   point at the holes, and the words sit on the board beside them. Where a step asks the student
   to build, only the holes it names are live, so the first circuit cannot go wrong. It runs on
   whichever bench a student opens first. */
const WALK_BUILD = [['wire', '4:T+', '4:a'], ['r330', '4:c', '9:c'], ['led', '9:e', '11:e'], ['wire', '11:a', '11:T-']];
const strip = (c, r0, r1, fill) => `<path d="M${poly([[hu(c) - 7, hv(r0) - 8], [hu(c) + 7, hv(r0) - 8], [hu(c) + 7, hv(r1) + 8], [hu(c) - 7, hv(r1) + 8]])}Z" fill="${fill}"/>`;
const railStrip = (r, fill) => `<path d="M${poly([[P * .6, hv(r) - 7], [W - P * .6, hv(r) - 7], [W - P * .6, hv(r) + 7], [P * .6, hv(r) + 7]])}Z" fill="${fill}"/>`;
const METAL = 'rgba(95,105,115,.2)', LIVE = 'rgba(58,84,180,.42)', LIVE2 = 'rgba(58,84,180,.2)';
const allStrips = () => { let s = ''; for (let c = 1; c <= COLS; c++) s += strip(c, 'a', 'e', METAL) + strip(c, 'f', 'j', METAL); return s; };
const AT_LOW = { x: 214, y: 322, w: 470 };
const WALK = [
  { text: `These are the holes. A leg of a part, or the end of a wire, pushes into a hole and is gripped there.`,
    arrows: [{ to: '8:c', dx: 54, dy: -62, label: 'a hole' }] },
  { text: `Under the plastic, a metal strip joins the five holes of each column. Two legs in the same column are connected, with no wire.`,
    under: () => allStrips() + strip(8, 'a', 'e', LIVE), arrows: [{ to: '8:c', dx: 66, dy: -60, label: 'these five are joined' }] },
  { text: `The gap in the middle cuts each column in two. Holes a to e are not joined to holes f to j.`,
    at: { x: 330, y: 322, w: 354 },
    under: () => allStrips() + strip(8, 'a', 'e', LIVE) + strip(8, 'f', 'j', 'rgba(150,70,50,.34)'),
    arrows: [{ xy: proj(hu(8), P * 8.85), dx: 74, dy: -6, label: 'not joined across here' }] },
  { text: `The rails run along the board instead. The supply holds every hole in the + row at 5 V, and every hole in the − row at 0 V, called ground. The bottom pair do the same.`,
    under: () => railStrip('T+', 'rgba(168,116,31,.32)') + railStrip('T-', 'rgba(29,33,23,.22)') + railStrip('B+', 'rgba(168,116,31,.32)') + railStrip('B-', 'rgba(29,33,23,.22)'),
    arrows: [{ to: '9:T+', dx: 30, dy: 62, label: '+ rail, 5 V' }, { to: '20:T-', dx: 50, dy: 42, label: '− rail, 0 V' }] },
  { text: `Current only flows round a complete loop. Yours will leave the + rail, pass through a resistor and an LED, and return to the − rail. This is the plan.`,
    plan: true, arrows: [{ to: '4:a', dx: -34, dy: 30, label: '1' }, { xy: proj(hu(6.5), hv('c'), 12), dx: 0, dy: 44, label: '2' }, { to: '10:e', dx: 26, dy: 40, label: '3' }, { to: '11:a', dx: 40, dy: 22, label: '4' }] },
  { text: `Your parts are in this tray. Pick a part, then tap the holes for its legs. A wire needs no picking: tap one hole, then another.`,
    tray: true },
  { text: `Start with a wire from the + rail to column 4. Tap the hole on the rail, then the hole in column 4.`,
    build: ['wire', '4:T+', '4:a'], labels: ['tap here first', 'then here'] },
  { text: `All five holes of column 4 are now at 5 V, because the strip joins them. Anything plugged into this column gets that voltage.`,
    glow: '4:b', arrows: [{ to: '4:d', dx: -44, dy: 44, label: 'all at 5 V' }] },
  { text: `Pick the 330 Ω resistor. It lies flat along a row: one leg in column 4, the other in column 9. It works either way round.`,
    build: ['r330', '4:c', '9:c'], labels: ['one leg', 'other leg'] },
  { text: `Its legs are in different columns, so current has to pass through it. With both legs in column 4, the strip would carry the current straight past it.`,
    arrows: [{ xy: proj(hu(6.5), hv('c'), 12), dx: 44, dy: 58, label: 'current passes through here' }] },
  { text: `An LED only works one way round. Its long leg, marked +, goes on the side nearer the + rail. Its short leg, marked −, goes on the side nearer ground.`,
    ledCard: true, at: { x: 170, y: 322, w: 340 } },
  { text: `Pick the LED. The long leg goes in column 9, where the resistor ends. The short leg goes in column 11.`,
    build: ['led', '9:e', '11:e'], labels: ['long leg (+)', 'short leg (−)'] },
  { text: `The loop has one gap left. Run a wire from column 11 to the − rail.`,
    build: ['wire', '11:a', '11:T-'], labels: ['tap here first', 'then here'] },
  { text: `It lights. Current runs from the + rail through the wire, the resistor and the LED, and back along the second wire to the − rail.`,
    arrows: [{ to: '10:e', dx: 60, dy: 44, label: 'about 9 mA' }] },
  { text: `Tap any part to turn it round or unplug it, and drag a leg to move it. When a part's leg is in, the holes it can reach are marked. The board is yours.`,
    arrows: [{ to: '10:d', dx: 62, dy: -40, label: 'tap a part' }] },
];

/* the rule for each part, shown on the board while that part is picked */
const TIP = {
  wire: `A wire needs no picking. Tap any hole, then another, and it joins the two.`,
  led: `Tap the hole for the long leg (+), on the side nearer the + rail. The holes the short leg can reach are then marked.`,
  r330: `It works either way round. Tap one hole, then a marked hole: 3 to 8 columns along the row, or straight across to a rail or over the gap.`,
  r100k: `It works either way round. Tap one hole, then a marked hole: 3 to 8 columns along the row, or straight across to a rail or over the gap.`,
  r10k: `It works either way round. Tap one hole, then a marked hole: 3 to 8 columns along the row, or straight across to a rail or over the gap.`,
  btn: `It joins its two legs only while you hold its round cap down. Tap one hole, then a marked hole.`,
  hc00: `Tap a column. The chip sits across the gap in the middle, with its notch on the left. Pin 1 is at the bottom left.`,
  diode: `Current flows towards the band. Tap the hole for the end with no band, nearer the + rail, then a marked hole for the banded end.`,
  bc547: `Tap a hole in the middle of the board. Its three legs go side by side in one row, flat face towards you: C, B, E.`,
  n7000: `Tap a hole in the middle of the board. Its three legs go side by side in one row, flat face towards you: S, G, D.`,
  hc04: `Tap a column. The chip sits across the gap in the middle, with its notch on the left. Pin 1 is at the bottom left.`,
};

const store = {
  get(k){ try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private window */ } },
};
const SEEN = 'byodc_bench_walk';
const benchKey = id => `byodc_bench_${id}`;

/* a small drawing of each part for the tray */
const ICON = {
  wire: `<path d="M3 17C7 5 17 5 21 17" stroke="#3a54b4" stroke-width="2.4" fill="none"/><path d="M3 17v4M21 17v4" stroke="#8e8f86" stroke-width="1.6"/>`,
  led: `<path d="M8 17V9a4 4 0 0 1 8 0v8z" fill="#d9a06c" stroke="#8f5a24"/><path d="M6.5 17h11" stroke="#8f5a24" stroke-width="1.6"/><path d="M10 17v7M14 17v4" stroke="#8e8f86" stroke-width="1.5"/>`,
  r330: `<path d="M0 12h24" stroke="#8e8f86" stroke-width="1.6"/><rect x="5" y="8" width="14" height="8" rx="4" fill="#d9c294" stroke="#a89668"/><path d="M8.5 8v8M11 8v8" stroke="#c2682c" stroke-width="1.6"/><path d="M13.5 8v8" stroke="#7a4a22" stroke-width="1.6"/>`,
  r100k: `<path d="M0 12h24" stroke="#8e8f86" stroke-width="1.6"/><rect x="5" y="8" width="14" height="8" rx="4" fill="#d9c294" stroke="#a89668"/><path d="M8.5 8v8" stroke="#7a4a22" stroke-width="1.6"/><path d="M11 8v8" stroke="#23241e" stroke-width="1.6"/><path d="M13.5 8v8" stroke="#d9b23b" stroke-width="1.6"/>`,
  r10k: `<path d="M0 12h24" stroke="#8e8f86" stroke-width="1.6"/><rect x="5" y="8" width="14" height="8" rx="4" fill="#d9c294" stroke="#a89668"/><path d="M8.5 8v8" stroke="#7a4a22" stroke-width="1.6"/><path d="M11 8v8" stroke="#23241e" stroke-width="1.6"/><path d="M13.5 8v8" stroke="#c2682c" stroke-width="1.6"/>`,
  btn: `<rect x="5" y="8" width="14" height="12" rx="2" fill="#26281f"/><ellipse cx="12" cy="10" rx="5" ry="3.6" fill="#d05a3c"/><path d="M8 20v4M16 20v4" stroke="#8e8f86" stroke-width="1.5"/>`,
  hc00: `<rect x="3" y="7" width="18" height="10" rx="1" fill="#26281f"/><path d="M3 10a2 2 0 0 1 0 4" fill="#666"/><path d="M6 7V4M12 7V4M18 7V4M6 17v3M12 17v3M18 17v3" stroke="#8e8f86" stroke-width="1.5"/>`,
  diode: `<path d="M0 12h24" stroke="#8e8f86" stroke-width="1.6"/><rect x="5" y="7.5" width="14" height="9" rx="2" fill="#1f2019"/><rect x="14.5" y="7.5" width="2.6" height="9" fill="#d3d3cb"/>`,
  bc547: `<path d="M6 13V9a6 6 0 0 1 12 0v4z" fill="#26281f"/><path d="M8 13v9M12 13v9M16 13v9" stroke="#8e8f86" stroke-width="1.5"/>`,
  n7000: `<path d="M6 13V9a6 6 0 0 1 12 0v4z" fill="#26281f"/><path d="M8 13v9M12 13v9M16 13v9" stroke="#8e8f86" stroke-width="1.5"/>`,
  hc04: `<rect x="3" y="7" width="18" height="10" rx="1" fill="#26281f"/><path d="M3 10a2 2 0 0 1 0 4" fill="#666"/><path d="M6 7V4M12 7V4M18 7V4M6 17v3M12 17v3M18 17v3" stroke="#8e8f86" stroke-width="1.5"/>`,
};
const SHORT = { wire: 'Wire', led: 'LED', r330: '330 Ω', r100k: '100 kΩ', r10k: '10 kΩ', btn: 'Button', diode: 'Diode', bc547: 'BC547', n7000: '2N7000', hc04: '74HC04', hc00: '74HC00' };
/* a build list is [type, ...holes, {extras}], or [chip type, column] */
const fromBuild = (list, id) => list.map(([type, ...rest]) => {
  const extra = typeof rest[rest.length - 1] === 'object' ? rest.pop() : {};
  return { id: id(), type, pins: isChip(type) ? chipPins(rest[0]) : rest, ...extra };
});

/* an arrow on the board, from a label at its tail to the thing it points at */
function arrowArt(tx, ty, dx, dy, label){
  const sx = tx + dx, sy = ty + dy, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
  const ex = tx + ux * 11, ey = ty + uy * 11;
  const mx = (sx + ex) / 2 - uy * 12, my = (sy + ey) / 2 + ux * 12;
  const ang = Math.atan2(ey - my, ex - mx), hs = 8;
  const head = `${ex.toFixed(1)},${ey.toFixed(1)} ${(ex - Math.cos(ang - .5) * hs).toFixed(1)},${(ey - Math.sin(ang - .5) * hs).toFixed(1)} ${(ex - Math.cos(ang + .5) * hs).toFixed(1)},${(ey - Math.sin(ang + .5) * hs).toFixed(1)}`;
  const d = `M${sx.toFixed(1)} ${sy.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  const round = label.length <= 2, tw = round ? 22 : label.length * 7 + 16;
  const lx = Math.max(tw / 2 + 4, Math.min(716 - tw / 2, sx)), ly = sy + (uy >= 0 ? 10 : -10);
  return `<g class="bench-arrow"><path d="${d}" fill="none" stroke="#faf8f1" stroke-width="5" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round"/>
    <polygon points="${head}" fill="var(--ink)" stroke="#faf8f1" stroke-width=".8"/>
    <rect x="${(lx - tw / 2).toFixed(1)}" y="${(ly - 11).toFixed(1)}" width="${tw}" height="22" rx="11" fill="var(--ink)"/>
    <text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" class="lbl" font-size="11.5" style="fill:var(--paper-high)">${label}</text></g>`;
}

/* the LED drawn large, with its two legs named */
function ledCardArt(){
  const x = 520, y = 214, w = 170, h = 214, cx = x + w / 2, base = y + 92;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#faf8f1" stroke="var(--ink)" stroke-width="1.4"/>
    ${leadPath(`M${cx - 9} ${base} V${base + 92}`, 3)}${leadPath(`M${cx + 9} ${base} V${base + 62}`, 3)}
    <path d="M${cx - 24} ${base} V${base - 42} A24 24 0 0 1 ${cx + 24} ${base - 42} V${base} Z" fill="url(#bbOff)" stroke="#8f5a24" stroke-width="1.2"/>
    <rect x="${cx - 29}" y="${base - 3}" width="58" height="8" rx="2" fill="#b97a3f" stroke="#7d4c1e"/>
    <text x="${cx - 16}" y="${base + 108}" class="lbl" font-size="11.5" style="fill:var(--amber);font-weight:700">long leg, +</text>
    <text x="${cx + 42}" y="${base + 62}" class="lbl" font-size="11.5" style="fill:var(--ink);font-weight:700">short, −</text>`;
}

/* ---------- the bench ---------- */
function makeBench(svg, panelG, spec){
  const saved = store.get(benchKey(spec.id));
  let parts = Array.isArray(saved?.parts) ? saved.parts : [];
  parts.forEach(p => { delete p.closed; });        // nothing is still being held down
  let goal = saved?.goal ?? 0, nextId = parts.reduce((m, p) => Math.max(m, p.id), 0) + 1;
  if (!saved && spec.start){
    parts = fromBuild(spec.start, () => nextId++);
    spec.startAfter?.(parts);
  }
  const history = [];
  let tool = null, tipFor = null, first = null, selected = null, hover = null, press = null, grab = null, M = null, lastDone = '', flash = null;
  let walk = -1, walkPrev = null, nextBtn = null;
  const phone = matchMedia('(max-width:920px)');
  const stageEl = svg.parentElement;

  const board = svgEl('g'); board.innerHTML = boardSVG();
  const under = svgEl('g', { 'pointer-events': 'none' }), hot = svgEl('g', { 'pointer-events': 'none' }), layer = svgEl('g');
  const ghost = svgEl('g', { 'pointer-events': 'none' }), read = svgEl('g', { 'pointer-events': 'none' }), over = svgEl('g', { 'pointer-events': 'none' });
  const surface = svgEl('rect', { x: 0, y: 0, width: 720, height: 480, fill: 'transparent', class: 'bench-surface', 'data-label': 'bench-surface' });
  const tray = svgEl('g', { class: 'bench-tray' }), popup = svgEl('g');
  surface.style.touchAction = 'none';
  panelG.append(board, under, hot, layer, ghost, read, surface, over, tray, popup);

  const coach = el('div', { class: 'bench-coach', hidden: '' });
  const card = el('div', { class: 'lab-card bench-card' }, `<div class="lab-eyebrow">IN THE LAB</div>
    <div class="bench-said" hidden></div>
    <p class="guide-p bench-goal"></p>
    <p class="bench-status" role="status" aria-live="polite"></p>
    <div class="bench-tools"></div>`);
  const $c = s => card.querySelector(s);
  const hits = new Map();

  const wireColour = p => {
    if (p.type !== 'wire') return;
    const nets = p.pins.map(baseNet);
    p.colour = nets.includes('V') ? 'var(--amber)' : nets.includes('G') ? 'var(--ink)' : 'var(--blue)';
  };
  const taken = k => LEADS.has(k) || parts.some(p => p.pins.includes(k));
  const whoHas = k => parts.find(p => p.pins.includes(k));
  const snapshot = () => { history.push(JSON.stringify({ parts, goal })); if (history.length > 40) history.shift(); };
  const walkStep = () => (walk >= 0 ? WALK[walk] : null);
  const building = () => walkStep()?.build || null;

  /* ---------- which holes are live right now (N-148) ----------
     A part's legs only reach so far and lie straight, so once one leg is in, only the holes the
     other can truly reach are live, and the pointer snaps to them. */
  const reachOf = (type, a, h) => {
    if (h.k === a || baseNet(h.k) === baseNet(a)) return false;
    const t = TYPES[type];
    if (!t.span) return true;
    const A = parse(a), dc = Math.abs(A.c - h.c), dv = Math.abs(ROWV[A.r] - ROWV[h.r]);
    if (A.r === h.r) return dc >= t.span[0] && dc <= t.span[1];
    return A.c === h.c && dv >= 1.7 && dv <= t.cross;
  };
  function liveHoles(){
    const b = building();
    if (b){
      if (b[0] !== 'wire' && tool !== b[0]) return [];
      const k = first ? b[2] : b[1];
      return HOLES.filter(h => h.k === k);
    }
    if (walk >= 0) return [];
    if (grab){
      const type = parts.find(p => p.id === grab.id)?.type;
      return HOLES.filter(h => h.k === grab.from || (!taken(h.k) && reachOf(type, grab.other, h)));
    }
    if (first) return HOLES.filter(h => h.k === first || (!taken(h.k) && reachOf(tool || 'wire', first, h)));
    if (isChip(tool)) return HOLES.filter(h => !isRail(h.r) && h.c + 6 <= COLS && chipPins(h.c).every(k => !taken(k)));
    if (tool && TYPES[tool].pins === 3) return HOLES.filter(h => !isRail(h.r) && h.c + 2 <= COLS && [0, 1, 2].every(i => !taken(key(h.c + i, h.r))));
    return HOLES.filter(h => !LEADS.has(h.k));
  }
  const nearest = (x, y, reach, list) => {
    let best = null, d = reach;
    for (const h of list){ const q = Math.hypot(h.x - x, h.y - y); if (q < d){ d = q; best = h; } }
    return best;
  };
  /* the first leg's own hole only counts when it is tapped squarely: that is the way to take the
     leg back out. A tap merely near it means the student was aiming for somewhere else. */
  const holeAt = (x, y, touch) => {
    const list = liveHoles(), h = nearest(x, y, snapReach(touch), list);
    if (h && h.k === first && Math.hypot(h.x - x, h.y - y) > (touch ? 12 : 9))
      return nearest(x, y, snapReach(touch), list.filter(q => q.k !== first));
    return h;
  };
  const snapReach = touch => (building() ? 70 : first || grab ? (touch ? 46 : 38) : touch ? 30 : 22);

  /* ---------- the words on the board ---------- */
  function placeCoach(at){
    const m = svg.getScreenCTM(), s = stageEl.getBoundingClientRect();
    coach.style.left = `${at.x * m.a + m.e - s.left}px`;
    coach.style.top = `${at.y * m.d + m.f - s.top}px`;
    coach.style.width = `${at.w * m.a}px`;
  }
  let coachAt = null;
  const onResize = () => { if (!panelG.isConnected){ window.removeEventListener('resize', onResize); return; } if (coachAt && !coach.hidden) placeCoach(coachAt); };
  function showCoach(text, at){
    /* on a phone the board is too small for words on it: they sit directly under it, in the card */
    if (phone.matches || !text){ coach.hidden = true; coachAt = null; return; }
    coach.innerHTML = text; coach.hidden = false; coachAt = at;
    placeCoach(at);
  }

  /* ---------- drawing ---------- */
  const say = (html, bad = false) => { const s = $c('.bench-status'); s.innerHTML = html; s.classList.toggle('bad', bad); };
  function statusLine(){
    if (first){
      const t = TYPES[tool || 'wire'];
      return tool && t.second ? `The ${t.first} is in. Now tap a marked hole for the ${t.second}.`
        : t.span ? `One leg is in. Now tap a marked hole for the other.` : `Now tap a hole for the other end.`;
    }
    return null;
  }
  function refreshStatus(){
    if (walk >= 0) return say('');
    const line = statusLine();
    if (flash) return say(flash, true);
    if (line) return say(line);
    const d = diagnose(parts, M);
    say(d.text || `Tap two holes to run a wire, or pick a part from the tray.`, d.bad);
  }
  function render(){
    parts.forEach(wireColour);
    hits.clear();
    const order = [...parts].sort((a, b) => {
      const v = p => Math.max(...p.pins.map(k => hv(parse(k).r)));
      if ((a.type === 'wire') !== (b.type === 'wire')) return a.type === 'wire' ? 1 : -1;
      return v(a) - v(b);
    });
    layer.innerHTML = order.map(p => {
      const art = partArt(p, M);
      hits.set(p.id, art.hit);
      const on = p.id === selected;
      return `<g data-part="${p.id}" class="bench-part ${on ? 'on' : ''}">${on ? p.pins.map(k => { const [x, y] = holeXY(k); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="none" stroke="var(--blue)" stroke-width="2"/>`; }).join('') : ''}${art.svg}</g>`;
    }).join('');
    renderHot(); renderOver(); renderPopup(); renderTray();
  }
  function renderHot(){
    let html = '';
    const focusKey = first || hover?.k;
    const placing = grab ? parts.find(p => p.id === grab.id)?.type : tool || 'wire';
    if (focusKey && M && !grab && !(first && TYPES[placing]?.span && !building())){
      const net = M.netOf(focusKey), root = baseNet(focusKey);
      const colour = root === 'V' || net === M.netOf('2:T+') ? 'var(--amber)' : root === 'G' || net === M.netOf('2:T-') ? 'var(--ink)' : 'var(--blue)';
      let d = '';
      for (const h of HOLES) if (M.netOf(h.k) === net) d += `M${(h.x - 6).toFixed(1)} ${h.y.toFixed(1)}a6 6 0 1 0 12 0a6 6 0 1 0 -12 0`;
      html += `<path d="${d}" fill="none" stroke="${colour}" stroke-width="1.6" opacity=".75"/>`;
    }
    /* the holes a part's other leg can reach */
    const type = grab ? parts.find(p => p.id === grab.id)?.type : tool || 'wire';
    if ((first || grab) && TYPES[type]?.span && !building()){
      html += liveHoles().filter(h => h.k !== first && h.k !== grab?.from)
        .map(h => `<circle class="bench-reach" cx="${h.x.toFixed(1)}" cy="${h.y.toFixed(1)}" r="7"/>`).join('');
    }
    hot.innerHTML = html;
    /* the part being placed, drawn where it would land */
    let g = '';
    if (hover){
      if (isChip(tool)) g = partArt({ type: tool, pins: chipPins(hover.c), id: -1 }, null).svg;
      else if (tool && TYPES[tool].pins === 3) g = partArt({ type: tool, pins: [0, 1, 2].map(i => key(hover.c + i, hover.r)), id: -1 }, null).svg;
      const anchor = grab ? grab.other : first;
      if (anchor && hover.k !== anchor && hover.k !== grab?.from){
        const pins = grab && grab.k === 0 ? [hover.k, anchor] : [anchor, hover.k], gt = grab ? type : tool || 'wire';
        g = partArt({ type: gt, pins, id: -1, colour: 'var(--blue)' }, null).svg;
      }
    }
    ghost.innerHTML = `<g opacity=".62">${g}</g>`;
    let r = '';
    if (hover && walk < 0 && selected == null){
      r += `<circle cx="${hover.x.toFixed(1)}" cy="${hover.y.toFixed(1)}" r="7.5" fill="none" stroke="var(--ink)" stroke-width="1.6"/>`;
      const float = M?.floatingNet?.(hover.k);
      const where = isRail(hover.r) ? (hover.r.endsWith('+') ? '+ rail' : '− rail') : `column ${hover.c}`;
      const v = !M || M.short || M.tripped ? '0 V' : float ? 'joined to nothing' : `${M.voltOf(hover.k).toFixed(1)} V`;
      const text = `${where}: ${v}`, lift = press?.touch ? 46 : 20, tw = text.length * 6.6 + 18;
      const x = Math.max(tw / 2 + 4, Math.min(716 - tw / 2, hover.x)), y = Math.max(110, hover.y - lift);
      r += `<rect x="${(x - tw / 2).toFixed(1)}" y="${(y - 12).toFixed(1)}" width="${tw.toFixed(1)}" height="19" rx="9" fill="var(--ink)" opacity=".92"/>
        <text x="${x.toFixed(1)}" y="${(y + 1.5).toFixed(1)}" class="lbl" font-size="10.5" style="fill:var(--paper-high)">${text}</text>`;
    }
    read.innerHTML = r;
    if (walk < 0 && tipFor) placeTip();
  }
  /* everything drawn over the board that is not a part: arrows, the plan, what is wrong */
  function renderOver(){
    let top = '', low = '';
    const s = walkStep();
    if (s){
      if (s.under) low += s.under();
      if (s.glow){ const net = M.netOf(s.glow); low += HOLES.filter(h => M.netOf(h.k) === net && !isRail(h.r)).map(h => `<circle cx="${h.x.toFixed(1)}" cy="${h.y.toFixed(1)}" r="8" fill="rgba(168,116,31,.35)" stroke="var(--amber)" stroke-width="1.6"/>`).join(''); }
      if (s.plan) low += `<g opacity=".5">${WALK_BUILD.map(([type, ...pins], i) => { const q = { type, pins, id: -2 - i }; wireColour(q); return partArt(q, null).svg; }).join('')}</g>`;
      if (s.ledCard) top += ledCardArt();
      for (const a of s.arrows || []){
        const [x, y] = a.xy || holeXY(a.to);
        top += arrowArt(x, y, a.dx, a.dy, a.label);
      }
      const b = s.build;
      if (b){
        if (b[0] !== 'wire' && tool !== b[0]){
          const t = tileAt(b[0]);
          top += arrowArt(t.x + t.w / 2, t.y + t.h + 2, 26, 44, 'pick this');
        } else {
          const k = first ? b[2] : b[1], [x, y] = holeXY(k), [dx, dy] = armFor(k);
          top += `<circle class="bench-mark" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9"/>`;
          top += arrowArt(x, y, dx, dy, s.labels[first ? 1 : 0]);
        }
      }
      if (s.tray) top += arrowArt(trayMid(), 92, 40, 66, 'your parts');
    } else if (M && !tool && !first && !grab && selected == null){
      const d = diagnose(parts, M);
      for (const m of d.marks || []){
        const [x, y] = holeXY(m.k), [dx, dy] = armFor(m.k);
        top += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="none" stroke="var(--red)" stroke-width="2"/>`;
        top += arrowArt(x, y, dx, dy, m.label);
      }
      for (const l of M.leds) if (l.lit){
        const a = parse(l.p.pins[0]), b = parse(l.p.pins[1]);
        const [x, y] = proj((hu(a.c) + hu(b.c)) / 2, (hv(a.r) + hv(b.r)) / 2, 46);
        top += halo(x, y - 4, `${(l.i * 1000).toFixed(1)} mA`, 11.5, 'var(--amber)');
      }
    }
    under.innerHTML = low;
    over.innerHTML = top;
  }
  /* an arrow's tail goes towards open board, away from the nearest edge */
  const armFor = k => {
    const [x, y] = holeXY(k);
    return [x > 560 ? -62 : 62, y < 190 ? 54 : -50];
  };

  /* ---------- the tray, on the stage (N-147) ---------- */
  const trayTypes = () => ['wire', ...spec.parts];
  const TX = 254, TY = 12, TG = 5, TH = 66, TW = Math.min(66, Math.floor(398 / trayTypes().length) - TG);
  const tileAt = type => ({ x: TX + trayTypes().indexOf(type) * (TW + TG), y: TY, w: TW, h: TH });
  const trayMid = () => TX + (trayTypes().length * (TW + TG)) / 2;
  let trayBuilt = false;
  function buildTray(){
    if (trayBuilt) return;
    trayBuilt = true;
    trayTypes().forEach(type => {
      const { x, y } = tileAt(type);
      const g = svgEl('g', { class: 'bench-tile', 'data-type': type, 'data-label': `bench-pick-${type}`, tabindex: '0', role: 'button', 'aria-label': `Pick ${TYPES[type].name}` });
      g.innerHTML = `<rect x="${x}" y="${y + 4}" width="${TW}" height="${TH}" rx="8" fill="#a99d7f"/>
        <rect class="bench-tile-top" x="${x}" y="${y}" width="${TW}" height="${TH}" rx="8"/>
        <svg x="${x + (TW - 32) / 2}" y="${y + 6}" width="32" height="32" viewBox="0 0 24 24" fill="none" overflow="visible">${ICON[type]}</svg>
        <text x="${x + TW / 2}" y="${y + 55}" class="lbl bench-tile-name" font-size="11.5">${SHORT[type]}</text>`;
      g.style.touchAction = 'none';
      const allowed = () => {
        const b = building();
        return walk < 0 || (b && b[0] === type && type !== 'wire');
      };
      const pick = () => {
        if (!allowed()) return;
        tool = type === 'wire' || tool === type ? null : type;
        tipFor = type === 'wire' ? (tipFor === 'wire' ? null : 'wire') : tool;
        first = null; selected = null; hover = null; flash = null;
        SFX.click(); check({ quiet: true });
      };
      let drag = null;
      pointerDrag(g, {
        start(e){ e.preventDefault(); drag = { x: e.clientX, y: e.clientY, moved: false }; },
        move(e){
          if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8 && type !== 'wire' && allowed()){
            drag.moved = true; tool = type; tipFor = type; first = null; selected = null; flash = null; check({ quiet: true });
          }
          if (drag.moved){ const p = svgPt(svg, e.clientX, e.clientY); hover = nearest(p.x, p.y, 34, liveHoles()); renderHot(); }
        },
        end(e){
          const was = drag?.moved; drag = null;
          if (!was){ pick(); return; }
          const p = svgPt(svg, e.clientX, e.clientY), h = nearest(p.x, p.y, 34, liveHoles());
          hover = null;
          if (h) commit(h); else { if (walk < 0) tool = null; tipFor = tool; check({ quiet: true }); }
        },
      });
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); pick(); } });
      tray.appendChild(g);
    });
    const toolX = TX + trayTypes().length * (TW + TG) + 2;
    const pill = (label, name, y, fn) => {
      const g = svgEl('g', { class: 'bench-pill', 'data-label': name, tabindex: '0', role: 'button' });
      g.innerHTML = `<rect x="${toolX}" y="${y}" width="56" height="30" rx="7"/><text x="${toolX + 28}" y="${y + 19.5}" class="lbl" font-size="11">${label}</text>`;
      let down = false;
      g.addEventListener('pointerdown', () => { down = true; });
      g.addEventListener('pointerup', () => { if (down) fn(); down = false; });
      g.addEventListener('pointerleave', () => { down = false; });
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fn(); } });
      tray.appendChild(g);
    };
    /* while a first leg is in, this button takes it back out. It sits up here because a button
       beside the hole would cover the holes the student is aiming for */
    pill('Undo', 'bench-undo', TY, () => {
      if (walk >= 0) return;
      if (first){ first = null; tool = null; tipFor = null; flash = null; SFX.click(); check({ quiet: true }); return; }
      const prev = history.pop(); if (!prev) return;
      SFX.click();
      const s = JSON.parse(prev); parts = s.parts; goal = s.goal; tool = null; tipFor = null; first = null; selected = null; flash = null;
      check({ quiet: true });
    });
    pill('Clear', 'bench-clear', TY + 36, () => {
      if (walk >= 0 || !parts.length) return;
      SFX.click(); snapshot(); parts = []; tool = null; tipFor = null; first = null; selected = null; flash = null; check({ quiet: true });
    });
  }
  function renderTray(){
    const b = building();
    tray.querySelectorAll('.bench-tile').forEach(g => {
      const type = g.dataset.type;
      g.classList.toggle('picked', type === tool);
      g.classList.toggle('faded', walk >= 0 && !walkStep().tray && !(b && b[0] === type && type !== 'wire'));
    });
    tray.querySelectorAll('.bench-pill').forEach(g => g.classList.toggle('faded', walk >= 0));
    const undo = tray.querySelector('[data-label="bench-undo"] text');
    if (undo) undo.textContent = first ? 'Cancel' : 'Undo';
  }

  /* ---------- tap a part, and its controls appear beside it (N-148) ---------- */
  function renderPopup(){
    popup.innerHTML = '';
    const buttons = [];
    let ax, ay;
    if (selected != null){
      const p = parts.find(x => x.id === selected);
      if (!p){ selected = null; return; }
      const spots = hits.get(p.id) || [];
      ax = spots.reduce((s, q) => s + q[0], 0) / (spots.length || 1);
      ay = Math.min(...spots.map(q => q[1] - q[2]));
      if (TYPES[p.type].turn) buttons.push(['Turn round', 'bench-turn', () => {
        SFX.click(); snapshot(); p.pins = [...p.pins].reverse(); delete p.burntAt; check();
      }]);
      buttons.push([p.type === 'wire' ? 'Pull out' : 'Unplug', 'bench-remove', removeSelected]);
    } else return;
    const bw = 88, bh = 32, gap = 6, total = buttons.length * bw + (buttons.length - 1) * gap;
    const x0 = Math.max(6, Math.min(714 - total, ax - total / 2));
    const y0 = ay - bh - 12 < 92 ? ay + 24 : ay - bh - 12;
    buttons.forEach(([label, name, fn], i) => {
      const x = x0 + i * (bw + gap);
      const g = svgEl('g', { class: 'bench-pop', 'data-label': name, role: 'button', tabindex: '0' });
      g.innerHTML = `<rect x="${x}" y="${y0 + 3}" width="${bw}" height="${bh}" rx="8" fill="#14160f"/><rect class="bench-pop-top" x="${x}" y="${y0}" width="${bw}" height="${bh}" rx="8"/>
        <text x="${x + bw / 2}" y="${y0 + 20.5}" class="lbl" font-size="12" style="fill:var(--paper-high)">${label}</text>`;
      /* press and release on the button itself: a phone moves a tap that lands near a click
         target onto it, which would fire this for a tap aimed at a hole */
      let down = false;
      g.addEventListener('pointerdown', () => { down = true; });
      g.addEventListener('pointerup', () => { if (down) fn(); down = false; });
      g.addEventListener('pointerleave', () => { down = false; });
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fn(); } });
      popup.appendChild(g);
    });
  }
  function removeSelected(){
    if (selected == null) return;
    SFX.click(); snapshot();
    parts = parts.filter(p => p.id !== selected);
    selected = null;
    check();
  }

  /* ---------- the card ---------- */
  function renderGoal(){
    const said = $c('.bench-said'), g = $c('.bench-goal');
    card.classList.toggle('walking', walk >= 0);
    if (walk >= 0){
      said.hidden = true;
      const s = WALK[walk];
      g.innerHTML = `<span class="bench-count">Walkthrough, ${walk + 1} of ${WALK.length}</span>
        <span class="bench-walk-text">${phone.matches ? s.text : 'Follow the steps on the board.'}</span>
        <button class="bench-skip" data-label="bench-walk-skip">Skip the walkthrough</button>`;
      g.querySelector('[data-label="bench-walk-skip"]').addEventListener('click', () => { SFX.click(); endWalk(); });
      showCoach(s.text, s.at || AT_LOW);
    } else {
      said.hidden = !lastDone;
      said.innerHTML = lastDone ? `<span class="bench-tick" aria-hidden="true">✓</span> ${lastDone}` : '';
      const list = spec.goals, cur = list[goal];
      g.innerHTML = cur ? `<span class="bench-count">${goal + 1} of ${list.length}</span> ${cur.text}` : spec.free;
      placeTip();
    }
    const show = $c('[data-label="bench-show"]');
    if (show) show.hidden = walk >= 0 || !spec.goals[goal];
    if (nextBtn) nextBtn.style.display = building() ? 'none' : '';    // a build step moves on by itself
  }
  function placeTip(){
    if (phone.matches){ if (tipFor && !first && !flash && walk < 0) say(TIP[tipFor]); coach.hidden = true; return; }
    if (!tipFor || first){ showCoach(''); return; }
    /* the tip keeps out of the way of the half of the board being worked on */
    showCoach(TIP[tipFor], hover && hover.y > 270 ? { x: 214, y: 112, w: 470 } : AT_LOW);
  }

  /* solve, then move the walkthrough or the goals on if the board has met them */
  function check({ quiet = false } = {}){
    M = analyse(parts);
    if (M.justBurnt && !quiet) burnEffect(M.justBurnt);
    if (walk < 0 && !quiet){
      let moved = false;
      while (spec.goals[goal]?.done(parts, M)){ lastDone = spec.goals[goal].said; goal++; moved = true; }
      if (moved) SFX.success();
    }
    const b = building();
    if (b && parts.some(p => p.type === b[0] && p.pins[0] === b[1] && p.pins[1] === b[2])){
      tool = null; first = null; hover = null; walk++;
      SFX.success();
    }
    render(); refreshStatus(); renderGoal();
    if (walk < 0) store.set(benchKey(spec.id), { parts, goal });
  }
  function startWalk(replay){
    walkPrev = { parts, goal, replay };
    parts = []; tool = null; tipFor = null; first = null; selected = null; hover = null; flash = null; lastDone = '';
    walk = 0;
    check({ quiet: true });
  }
  function endWalk(finished = false){
    const prev = walkPrev;
    walk = -1; walkPrev = null; tool = null; tipFor = null; first = null; hover = null; coach.hidden = true;
    store.set(SEEN, 1);
    /* the first time on the LED bench, the circuit just built stays as the first goal done */
    if (!(finished && spec.id === 'led' && !prev?.replay) && prev){ parts = prev.parts; goal = prev.goal; }
    check();
  }
  function burnEffect(p){
    SFX.tone?.(120, .35, { type: 'sawtooth', f1: 50, g: .5 });
    if (RM) return;
    const a = parse(p.pins[0]), b = parse(p.pins[1]);
    const [x, y] = proj((hu(a.c) + hu(b.c)) / 2, (hv(a.r) + hv(b.r)) / 2, 42);
    const puff = svgEl('g', { class: 'bench-puff', 'pointer-events': 'none' });
    puff.innerHTML = [0, 1, 2].map(i => `<circle cx="${(x + (i - 1) * 6).toFixed(1)}" cy="${y.toFixed(1)}" r="${5 + i * 2}" style="animation-delay:${i * 90}ms"/>`).join('');
    panelG.insertBefore(puff, surface);
    setTimeout(() => puff.remove(), 1300);
  }

  /* ---------- building ---------- */
  function commit(h){
    flash = null;
    const type = tool || 'wire', t = TYPES[type];
    if (isChip(type)) return add({ type, pins: chipPins(h.c) });
    if (t.pins === 3) return add({ type, pins: [0, 1, 2].map(i => key(h.c + i, h.r)) });
    if (first === h.k){ first = null; SFX.click(); check({ quiet: true }); return; }
    if (!first){ first = h.k; SFX.click(); check({ quiet: true }); return; }
    const pins = [first, h.k];
    first = null;
    add({ type, pins });
  }
  function add({ type, pins }){
    snapshot();
    parts.push({ id: nextId++, type, pins });
    tool = null; tipFor = null; first = null; selected = null;
    SFX.dope();
    check();
  }

  /* ---------- the pointer ---------- */
  const toPt = e => svgPt(svg, e.clientX, e.clientY);
  function hitPart(x, y){
    let best = null, bd = Infinity;
    for (const p of parts){
      for (const [hx, hy, r] of hits.get(p.id) || []){
        const d = Math.hypot(hx - x, hy - y) - r;
        if (d < 0 && d < bd){ bd = d; best = p; }
      }
    }
    return best;
  }
  const hoverAt = (e, touch) => {
    const p = toPt(e);
    hover = holeAt(p.x, p.y, touch);
    renderHot();
    return p;
  };
  surface.addEventListener('pointermove', e => { if (!press && e.pointerType === 'mouse') hoverAt(e); });
  surface.addEventListener('pointerleave', () => { if (!press){ hover = null; renderHot(); } });
  pointerDrag(surface, {
    start(e){
      e.preventDefault();
      const touch = e.pointerType !== 'mouse';
      press = { x: e.clientX, y: e.clientY, moved: false, touch };
      const p = hoverAt(e, touch);
      if (walk >= 0 || tool || first) return;        // holes first while something is being placed
      const cap = parts.find(q => q.type === 'btn' && (() => { const c = btnArt(q).cap; return Math.hypot(c[0] - p.x, c[1] - p.y) < 15; })());
      if (cap){
        press.held = cap; cap.closed = true; selected = null; SFX.click();
        check();
        return;
      }
      const all = HOLES.filter(h => !LEADS.has(h.k)), h = nearest(p.x, p.y, touch ? 18 : 14, all);
      if (h && taken(h.k)){
        const owner = whoHas(h.k);
        press.part = owner.id;
        if (owner.pins.length === 2){
          const k = owner.pins.indexOf(h.k);
          press.grabbing = { id: owner.id, k, other: owner.pins[1 - k], from: h.k };
        }
        return;
      }
      const onHole = h && Math.hypot(h.x - p.x, h.y - p.y) < 7;
      const part = !onHole && hitPart(p.x, p.y);
      if (part) press.part = part.id;
      else if (h) press.start = h.k;
    },
    move(e){
      if (!press) return;
      if (press.held) return;
      if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > 6) press.moved = true;
      if (press.moved && press.grabbing && !grab){ grab = press.grabbing; selected = null; renderPopup(); }
      if (press.moved && press.start && !first){ first = press.start; press.dragWire = true; renderPopup(); }
      hoverAt(e, press.touch);
    },
    end(e){
      if (!press) return;
      const was = press; press = null;
      if (was.held){ was.held.closed = false; hover = null; check(); return; }
      const pt = toPt(e), h = holeAt(pt.x, pt.y, was.touch), g = grab;
      grab = null;
      if (e.pointerType !== 'mouse') hover = null;
      if (g){
        const p = parts.find(x => x.id === g.id);
        if (h && h.k !== g.from && p){ snapshot(); p.pins[g.k] = h.k; SFX.dope(); check(); return; }
        if (!h) flash = `It cannot reach that far, so it stays where it was.`;
        check({ quiet: true }); return;
      }
      if (walk >= 0){
        if (h) commit(h); else renderHot();
        return;
      }
      if (was.part != null){ if (!was.moved) select(was.part); else renderHot(); return; }
      if (selected != null){ selected = null; if (!h){ check({ quiet: true }); return; } }
      if (was.dragWire && h && h.k === first){ first = null; check({ quiet: true }); return; }
      if (h){ commit(h); return; }
      if (first){
        const name = TYPES[tool || 'wire'];
        flash = name.span ? `Its legs only reach the marked holes. Tap one of those, or press Cancel at the top.` : `Tap a hole for the other end, or press Cancel at the top.`;
        check({ quiet: true });
      } else if (tool){ tool = null; tipFor = null; check({ quiet: true }); }
      else renderHot();
    },
  });
  function select(id){ selected = selected === id ? null : id; tipFor = null; flash = null; hover = null; SFX.click(); render(); refreshStatus(); placeTip(); }

  function loadBuild({ build, after }){
    snapshot();
    parts = fromBuild(build, () => nextId++);
    after?.(parts);
    tool = null; tipFor = null; first = null; selected = null; flash = null;
    SFX.dope();
    check();
  }

  const onKey = e => {
    if (!panelG.isConnected){ document.removeEventListener('keydown', onKey); return; }
    if (e.key === 'Escape' && walk < 0){ tool = null; tipFor = null; first = null; selected = null; flash = null; check({ quiet: true }); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selected != null && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName)){ e.preventDefault(); removeSelected(); }
  };

  return {
    card,
    /* the live session: resolves when the student presses Next past the walkthrough */
    run(){
      guide.beat(card);
      buildTray();
      stageEl.appendChild(coach);
      document.addEventListener('keydown', onKey);
      window.addEventListener('resize', onResize);
      const prevTouch = svg.style.touchAction, ctrl = stageEl.querySelector('.stage-controls'), prevCtrl = ctrl?.style.display;
      svg.style.touchAction = 'none';
      if (ctrl) ctrl.style.display = 'none';
      const row = guide.beat(el('div', { class: 'btn-row' }), 'actions');
      const next = nextBtn = el('button', { class: 'btn primary', 'data-label': 'next' }, 'Next ▸');
      row.appendChild(next);
      const tools = $c('.bench-tools');
      const btn = (label, name) => { const b = el('button', { class: 'bench-tool', 'data-label': name }, label); tools.appendChild(b); return b; };
      const show = btn('Show me', 'bench-show'), how = btn('Walk me through it', 'bench-how');
      show.addEventListener('click', () => { const g = spec.goals[goal]; if (g) loadBuild(g); });
      how.addEventListener('click', () => { SFX.click(); startWalk(true); });
      if (store.get(SEEN)) check({ quiet: true }); else startWalk(false);
      return new Promise(res => next.addEventListener('click', () => {
        SFX.click();
        if (walk >= 0){
          if (building()) return;
          if (walk + 1 >= WALK.length) endWalk(true); else { walk++; check({ quiet: true }); }
          return;
        }
        next.disabled = true; next.classList.add('used');
        document.removeEventListener('keydown', onKey);
        window.removeEventListener('resize', onResize);
        svg.style.touchAction = prevTouch;
        if (ctrl) ctrl.style.display = prevCtrl;
        coach.remove();
        surface.style.pointerEvents = 'none'; tray.style.pointerEvents = 'none'; popup.innerHTML = '';
        res(true);
      }));
    },
    /* on a replay the board is drawn as it was left, with no controls */
    still(){
      buildTray();
      M = analyse(parts);
      render(); hover = null; surface.style.pointerEvents = 'none'; tray.style.pointerEvents = 'none';
      guide.beat(card); renderGoal(); say(''); coach.hidden = true;
    },
  };
}

/* The one call a step makes behind guide.labMore(). `from` is the panel on the stage now. */
export async function labBench(svg, from, spec){
  const panel = slideInPanel(svg, '', { lab: true });
  if (from) await from.swapTo(panel); else await panel.show();
  const bench = makeBench(svg, panel.g, spec);
  await flow.ask(replay => {
    if (replay !== undefined){ bench.still(); return replay; }
    return bench.run();
  });
  await panel.hide();
}
