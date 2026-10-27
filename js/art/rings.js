// BYODC art — the map of where numbers wait (Act 4 restructure, 2026-10-25). The MAC unit sits
// in the corner; each memory is a quarter-ring around it, further out the further away it is,
// and thicker the more it holds: registers, L1 cache, L2 cache, then main memory beyond the
// chip's edge. Step 4.3 draws it as its main map; later steps can draw it again with their own
// ring lit (`lit`: a level's key), so each step reads as the next ring out.
//
// ringsMap() returns an SVG string. Every ring, badge and key row carries data-k = its level's
// key, so a stage can focus one level, and its dot ray (data-ray) for the travelling numbers.
// No measured numbers here: those live on 4.3's numbers page (js/art/memory.js).
//
// Course restructure (2026-10-25): Act 5 step 3 (the network step) grows the map by two rings,
// behind `outer: true`. Rings 1 to 4 shrink to fit inside a second dashed edge (the GPU), and
// outside it come ring 5, the other GPUs in the node over NVLink, and ring 6, every other node
// through the switches. `lit` may also be an array of keys. With `outer` left off, the map is
// drawn exactly as Act 4 draws it.

export const RING_LEVELS = [
  { k: 'reg',  n: 1, name: 'REGISTERS',   where: 'BESIDE THE MAC UNIT · SMALLEST',  r: [56, 74],   fill: 'rgba(29,33,23,.62)', ang: 18, trip: .45 },
  { k: 'l1',   n: 2, name: 'L1 CACHE',    where: 'ON THE CHIP · CLOSE BY',          r: [98, 124],  fill: 'rgba(29,33,23,.42)', ang: 33, trip: .9 },
  { k: 'l2',   n: 3, name: 'L2 CACHE',    where: 'ON THE CHIP · FURTHER OUT',       r: [148, 186], fill: 'rgba(29,33,23,.26)', ang: 48, trip: 1.5 },
  { k: 'mem',  n: 4, name: 'MAIN MEMORY', where: 'OFF THE CHIP · LARGEST',          r: [238, 318], fill: 'rgba(29,33,23,.10)', ang: 66, trip: 3 },
];
export const RING_C = { x: 70, y: 440 };
const EDGE = 212;

/* Course restructure (2026-10-25): the two outer rings and the smaller radii they need, so the
   whole map still fits the 720 x 480 stage. RING_LEVELS itself is untouched (Act 4 reads it). */
export const OUTER_LEVELS = [
  { k: 'node', n: 5, name: 'OTHER GPUS',  where: 'SAME NODE · OVER NVLINK',          r: [242, 284], fill: 'rgba(29,33,23,.06)', ang: 76 },
  { k: 'net',  n: 6, name: 'OTHER NODES', where: 'THROUGH SWITCHES · THE NETWORK',   r: [300, 362], fill: 'rgba(29,33,23,.03)', ang: 8 },
];
const OUTER_R = { reg: [44, 56], l1: [72, 90], l2: [106, 132], mem: [166, 214] };
const OUTER_WHERE = { mem: 'OFF THE CHIP · INSIDE THE GPU' };
const GEOM = {
  inner: { edge: EDGE, rayTo: 38, box: [34, 34, 68, 48, 6, 8.5], key: [128, 62], kx: 440 },
  outer: { edge: 150, gpu: 228, rayTo: 30, box: [33, 24, 66, 34, 4, 7.5], key: [104, 50], kx: 454 },
};

const P = (r, deg) => [RING_C.x + r * Math.cos(deg * Math.PI / 180), RING_C.y - r * Math.sin(deg * Math.PI / 180)];
export const ringPoint = P;
const f = v => v.toFixed(1);
const band = (r0, r1) => {
  const [a, b] = [P(r1, 0), P(r1, 90)], [c, d] = [P(r0, 90), P(r0, 0)];
  return `M${f(a[0])} ${f(a[1])} A${r1} ${r1} 0 0 0 ${f(b[0])} ${f(b[1])} L${f(c[0])} ${f(c[1])} A${r0} ${r0} 0 0 1 ${f(d[0])} ${f(d[1])} Z`;
};

export function ringsMap({ lit = null, title = 'WHERE NUMBERS WAIT', outer = false } = {}){
  const G = outer ? GEOM.outer : GEOM.inner;
  const levels = outer
    ? RING_LEVELS.map(L => ({ ...L, r: OUTER_R[L.k], where: OUTER_WHERE[L.k] || L.where })).concat(OUTER_LEVELS)
    : RING_LEVELS;
  const isLit = k => Array.isArray(lit) ? lit.includes(k) : lit === k;
  const edgeArc = (r, label, dy) => {
    const [e0, e1] = [P(r, 0), P(r, 90)];
    return `
    <path d="M${f(e0[0])} ${f(e0[1])} A${r} ${r} 0 0 0 ${f(e1[0])} ${f(e1[1])}" fill="none" stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="6 4"/>
    <text x="${f(e0[0])}" y="${RING_C.y + dy}" class="lbl-faint" font-size="7.5">${label}</text>`;
  };
  let s = `<text x="360" y="58" class="lbl" style="fill:var(--ink)">${title}</text>${edgeArc(G.edge, 'EDGE OF THE CHIP', 16)}`;
  if (outer) s += edgeArc(G.gpu, 'EDGE OF THE GPU', 30);

  levels.forEach(L => {
    const on = isLit(L.k), dim = lit && !on;
    const mid = (L.r[0] + L.r[1]) / 2, [bx, by] = P(mid, 84);
    const [rx, ry] = P(L.r[0] - 2, L.ang), [ex, ey] = P(G.rayTo, L.ang);
    s += `<g data-k="${L.k}" style="opacity:${dim ? .35 : 1}">
      <path d="${band(L.r[0], L.r[1])}" fill="${on ? 'rgba(29,33,23,.16)' : L.fill}" stroke="${on ? 'var(--ink)' : 'var(--ink-soft)'}" stroke-width="${on ? 2.2 : .8}"/>
      <line data-ray x1="${f(rx)}" y1="${f(ry)}" x2="${f(ex)}" y2="${f(ey)}" stroke="var(--ink)" stroke-width=".8" stroke-dasharray="2 3" opacity=".55"/>
      <circle cx="${f(bx)}" cy="${f(by)}" r="8.5" fill="var(--ink)"/>
      <text x="${f(bx)}" y="${f(by + 3.2)}" class="lbl" font-size="9" style="fill:var(--paper-high);letter-spacing:0">${L.n}</text></g>`;
  });

  /* the MAC unit in the corner */
  const [bl, bt, bw, bh, ty, fs] = G.box;
  s += `<g data-k="mac"><rect x="${RING_C.x - bl}" y="${RING_C.y - bt}" width="${bw}" height="${bh}" rx="4" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.4"/>
    <text x="${RING_C.x}" y="${RING_C.y - ty}" class="lbl" font-size="${fs}" style="fill:var(--ink)">MAC UNIT</text></g>`;

  /* the key */
  const KX = G.kx, [k0, kStep] = G.key;
  levels.forEach((L, i) => {
    const y = k0 + i * kStep, on = isLit(L.k), dim = lit && !on;
    s += `<g data-k="${L.k}" style="opacity:${dim ? .35 : 1}">
      <circle cx="${KX + 9}" cy="${y - 3.5}" r="9" fill="var(--ink)"/>
      <text x="${KX + 9}" y="${y}" class="lbl" font-size="9" style="fill:var(--paper-high);letter-spacing:0">${L.n}</text>
      <text x="${KX + 28}" y="${y}" class="lbl-strong" font-size="10.5" text-anchor="start">${L.name}</text>
      <text x="${KX + 28}" y="${y + 16}" class="lbl-faint" font-size="8" text-anchor="start">${L.where}</text></g>`;
  });
  s += `<text x="${KX}" y="392" class="lbl" font-size="8.5" text-anchor="start" style="fill:var(--ink)">FURTHER OUT: HOLDS MORE,</text>
    <text x="${KX}" y="406" class="lbl" font-size="8.5" text-anchor="start" style="fill:var(--ink)">AND TAKES LONGER TO ARRIVE</text>
    <text x="${KX}" y="424" class="lbl-faint" font-size="7.5" text-anchor="start">NOT TO SCALE</text>`;
  return s;
}
