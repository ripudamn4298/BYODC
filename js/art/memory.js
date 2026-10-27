// BYODC art — where the numbers wait (REVIEW_NOTES N-060, the picture beside 4.3's numbers box).
// Ripu: "L1 cache is closer, so it's faster. L2 cache is more distant. It has more capacity to
// hold numbers, but it is distant." So the picture is a map of distance. The engine sits in
// the corner; each memory is a quarter-ring around it, further out the further away it is, and
// thicker the more it holds: registers, L1, L2, L3 on the processor chip, then main memory
// beyond the chip's edge, on the board, in the lightest tint. A number (a blue dot, a live value in Act 4's colours)
// keeps travelling in from each ring to the engine, and the further ring's number takes
// longer. The key gives each level's size and its wait, in the box's own terms: clock beats,
// stated once (1 beat = 0.25 ns at 4 GHz) and then counted, in beats and nanoseconds, with a bar
// per level on one scale (N-065: real time, not "if one beat took a second").
//
// Facts are the box's: Intel Skylake (Core i7-6700) at 4 GHz, waits from 7-cpu.com (L1 4
// beats, L2 12, L3 42, main memory 42 beats + 51 ns ≈ 246 beats, which the box rounds into
// "240 to 400"). Sizes for the same chip: 32 KB of L1 data cache and 256 KB of L2 per core,
// 8 MB of L3 shared by its four cores (Intel). The dots' travel times are squeezed (the
// real gap is 250 to 1), so the slowest still arrives while you watch; the key holds the
// real numbers.
import { svgEl } from '../engine/util.js';
import { Anim } from '../engine/anim.js';

const C = { x: 64, y: 432 };                     // the engine, in the bottom-left corner
const LEVELS = [
  { n: 1, name: 'REGISTERS',   where: 'BESIDE THE CORE',     size: 'A FEW HUNDRED BYTES', wait: '1 BEAT',      sec: '0.25 NS',   beats: 1,        r: [44, 54],   fill: 'rgba(29,33,23,.62)', trip: .45, ang: 18 },
  { n: 2, name: 'L1 CACHE',    where: 'NEAREST CACHE',         size: '32 KB',               wait: '4 BEATS',     sec: '1 NS',      beats: 4,       r: [76, 92],   fill: 'rgba(29,33,23,.44)', trip: .9,  ang: 31 },
  { n: 3, name: 'L2 CACHE',    where: 'NEXT CACHE OUT',        size: '256 KB',              wait: '12 BEATS',    sec: '3 NS',      beats: 12,      r: [116, 142], fill: 'rgba(29,33,23,.30)', trip: 1.5, ang: 44 },
  { n: 4, name: 'L3 CACHE',    where: 'LARGEST CACHE ON CHIP', size: '8 MB',                wait: '42 BEATS',    sec: '10.5 NS',   beats: 42,      r: [168, 214], fill: 'rgba(29,33,23,.18)', trip: 2.6, ang: 57 },
  { n: 5, name: 'MAIN MEMORY', where: 'SEPARATE CHIPS, ON THE BOARD', size: 'GIGABYTES',     wait: 'ABOUT 250 BEATS', sec: 'ABOUT 60 NS', beats: 250, r: [282, 352], fill: 'rgba(29,33,23,.08)', trip: 5.2, ang: 72 },
];
const CHIP_EDGE = 246;

const P = (r, deg) => [C.x + r * Math.cos(deg * Math.PI / 180), C.y - r * Math.sin(deg * Math.PI / 180)];
/* a quarter-ring band from radius r0 to r1 */
const band = (r0, r1) => {
  const [a, b] = [P(r1, 0), P(r1, 90)], [c, d] = [P(r0, 90), P(r0, 0)];
  return `M${a[0]} ${a[1]} A${r1} ${r1} 0 0 0 ${b[0]} ${b[1]} L${c[0]} ${c[1]} A${r0} ${r0} 0 0 1 ${d[0]} ${d[1]} Z`;
};

export async function memoryArt(root){
  const add = html => { const g = svgEl('g'); g.innerHTML = html; root.appendChild(g); return g; };
  add(`<text x="360" y="44" class="lbl" style="fill:var(--ink)">WHERE THE NUMBERS WAIT: NEARER IS FASTER, FURTHER OUT HOLDS MORE</text>`);

  /* the chip's edge, then the rings, then the engine */
  const [e0, e1] = [P(CHIP_EDGE, 0), P(CHIP_EDGE, 90)];
  add(`<path d="M${e0[0]} ${e0[1]} A${CHIP_EDGE} ${CHIP_EDGE} 0 0 0 ${e1[0]} ${e1[1]}" fill="none" stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="6 4"/>
    <text x="${P(CHIP_EDGE + 10, 8)[0]}" y="${P(CHIP_EDGE + 10, 8)[1]}" class="lbl-faint" font-size="7.5" text-anchor="start" transform="rotate(-82 ${P(CHIP_EDGE + 10, 8).join(' ')})">EDGE OF THE PROCESSOR CHIP</text>`);
  const rings = LEVELS.map(L => add(`<path d="${band(L.r[0], L.r[1])}" fill="${L.fill}" stroke="${L.stroke || 'var(--ink-soft)'}" stroke-width=".8"/>`));
  add(`<rect x="${C.x - 30}" y="${C.y - 30}" width="60" height="44" rx="4" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.4"/>
    <text x="${C.x}" y="${C.y - 4}" class="lbl" font-size="8.5" style="fill:var(--ink)">CORE</text>`);

  /* number badges on the rings, and the rays the numbers travel down */
  LEVELS.forEach(L => {
    const mid = (L.r[0] + L.r[1]) / 2, [bx, by] = P(mid, 84), [rx, ry] = P(L.r[0] - 2, L.ang), [ex, ey] = P(34, L.ang);
    add(`<line x1="${rx.toFixed(1)}" y1="${ry.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="var(--ink)" stroke-width=".8" stroke-dasharray="2 3" opacity=".55"/>
      <circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="8" fill="var(--ink)"/>
      <text x="${bx.toFixed(1)}" y="${(by + 3.2).toFixed(1)}" class="lbl" font-size="8.5" style="fill:var(--paper-high);letter-spacing:0">${L.n}</text>`);
  });

  /* the key */
  const KX = 452;
  add(`<text x="${KX}" y="86" class="lbl" font-size="8.5" text-anchor="start" style="fill:var(--ink)">1 CLOCK BEAT = 0.25 NS</text>
    <text x="${KX}" y="99" class="lbl-faint" font-size="7.5" text-anchor="start">NS = NANOSECOND, A BILLIONTH OF A SECOND</text>`);
  LEVELS.forEach((L, i) => {
    const y = 122 + i * 58;
    add(`<circle cx="${KX + 8}" cy="${y - 3}" r="8" fill="var(--ink)"/>
      <text x="${KX + 8}" y="${y + .5}" class="lbl" font-size="8.5" style="fill:var(--paper-high);letter-spacing:0">${L.n}</text>
      <text x="${KX + 24}" y="${y}" class="lbl" font-size="9" text-anchor="start" style="fill:var(--ink)">${L.name} <tspan style="fill:var(--ink-soft)">· ${L.size}</tspan></text>
      <text x="${KX + 24}" y="${y + 13}" class="lbl-faint" font-size="7.5" text-anchor="start">${L.where}</text>
      <text x="${KX + 24}" y="${y + 27}" class="lbl" font-size="8" text-anchor="start" style="fill:var(--ink)">${L.wait} <tspan style="fill:var(--ink-soft)">· ${L.sec}</tspan></text>
      <rect x="${KX + 24}" y="${y + 32}" width="${Math.max(1.5, 220 * L.beats / 250).toFixed(1)}" height="5" rx="1" fill="var(--ink)" opacity=".7"/>`);
  });
  add(`<text x="360" y="466" class="lbl-faint" font-size="8">A DESKTOP PROCESSOR (INTEL SKYLAKE, 4 GHZ). THE RINGS ARE NOT TO SCALE; THE WAITS IN THE KEY ARE MEASURED</text>`);

  /* fade the rings in from the engine outwards */
  rings.forEach(g => { g.style.opacity = '0'; });
  await Anim.tween(1200, q => rings.forEach((g, i) => {
    g.style.opacity = Math.min(1, Math.max(0, q * 1200 / 220 - i)).toFixed(2);
  }), q => q);

  /* then the numbers keep arriving: one dot per ray, in from its ring to the engine */
  const dots = LEVELS.map(L => {
    const d = svgEl('circle', { r: 4.6, fill: 'var(--blue)' });
    root.appendChild(d);
    return { L, d };
  });
  let t0 = null;
  Anim.add((dt, t) => {
    if (t0 === null) t0 = t;
    dots.forEach(({ L, d }) => {
      const k = ((t - t0) % (L.trip + .5)) / L.trip;           // half a second's rest at the engine
      const q = Math.min(1, k);
      const [x, y] = P((L.r[0] + L.r[1]) / 2 + (34 - (L.r[0] + L.r[1]) / 2) * q, L.ang);
      d.setAttribute('cx', x.toFixed(1)); d.setAttribute('cy', y.toFixed(1));
      d.style.opacity = k > 1 ? '0' : '1';
    });
  });
}
