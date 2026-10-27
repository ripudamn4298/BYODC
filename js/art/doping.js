// BYODC art — the picture beside 1.1's real-numbers box (REVIEW_NOTES N-123). This is the first
// end-of-step page anyone sees, so the picture carries what the box used to say in words, and
// it points ahead to the rest of the course.
//
// Top: one cube of silicon, 1 cm on each side, and its resistance on a scale that falls ten
// times per tick. A marker drops onto the scale for each doping level, in the box's own
// numbers: pure silicon about 300,000 ohms; 1 phosphorus atom in 50 million about 5; 1 in
// 5 million about 0.5; 1 in 500,000 about 0.09; copper 0.0000017. A bracket marks the
// 500,000-times fall from pure silicon to 1 in 5 million.
//
// Bottom: where this crystal goes. Six stations along one path, one per thing the course
// builds: doped silicon (lit, "you are here"), a switch, a gate, a chip, a GPU, a data
// centre. The five ahead are faint pencil outlines with their act, and a blue spark (a live
// electron, DESIGN.md §1a) keeps running from the crystal to the data centre.
import { svgEl } from '../engine/util.js';
import { Anim } from '../engine/anim.js';

const f = v => (+v).toFixed(1);

/* the resistance scale: 10^6 ohms on the left down to 10^-6 on the right */
const SX0 = 110, SX1 = 650, SY = 168;
const sx = ohms => SX0 + (6 - Math.log10(ohms)) / 12 * (SX1 - SX0);
const LEVELS = [
  { ohms: 300000,  name: 'PURE SILICON',        val: '300,000 Ω', up: true },
  { ohms: 5,       name: '1 P ATOM IN 50 MILLION', val: '5 Ω',   up: false, dx: -26, anchor: 'end' },
  { ohms: 0.5,     name: '1 IN 5 MILLION',      val: '0.5 Ω',     up: true },
  { ohms: 0.09,    name: '1 IN 500,000',        val: '0.09 Ω',    up: false, dx: 26, anchor: 'start' },
  { ohms: 0.0000017, name: 'COPPER',            val: '0.0000017 Ω', up: true, copper: true },
];

/* the six stations of the course, each a small drawing centred on (0, 0) */
const ICON = {
  si: () => {
    let s = '';
    for (let r = -1; r <= 1; r++) for (let c = -1; c <= 1; c++){
      const on = r === 0 && c === 1;
      s += `<circle cx="${c * 11}" cy="${r * 11}" r="4" fill="${on ? 'var(--blue-soft)' : 'var(--paper-high)'}" stroke="${on ? 'var(--blue)' : 'var(--ink)'}" stroke-width="1.2"/>`;
    }
    return s + `<circle cx="17" cy="-6" r="1.8" fill="var(--blue)"/>`;
  },
  switch: () => `<rect x="-18" y="-8" width="12" height="16" rx="1.5"/><rect x="-6" y="-8" width="12" height="16" rx="1.5"/><rect x="6" y="-8" width="12" height="16" rx="1.5"/><path d="M0 -16 V-8"/>`,
  gate: () => `<path d="M-12 -10 H0 A10 10 0 0 1 0 10 H-12 Z"/><circle cx="13" cy="0" r="2.6"/><path d="M-18 -5 H-12 M-18 5 H-12 M16 0 H20"/>`,
  chip: () => `<rect x="-12" y="-12" width="24" height="24" rx="2"/><rect x="-6" y="-6" width="12" height="12"/>${[-8, 0, 8].map(p => `<path d="M${p} -12 V-17 M${p} 12 V17 M-12 ${p} H-17 M12 ${p} H17"/>`).join('')}`,
  gpu: () => `<rect x="-19" y="-12" width="38" height="24" rx="2"/><rect x="-7" y="-8" width="14" height="16"/><rect x="-16" y="-8" width="6" height="7"/><rect x="-16" y="1" width="6" height="7"/><rect x="10" y="-8" width="6" height="7"/><rect x="10" y="1" width="6" height="7"/>`,
  dc: () => `${[-14, 0, 14].map(x => `<rect x="${x - 5}" y="-14" width="10" height="28" rx="1"/><path d="M${x - 3} -8 H${x + 3} M${x - 3} -2 H${x + 3} M${x - 3} 4 H${x + 3}"/>`).join('')}`,
};
const STATIONS = [
  { k: 'si',     name: 'DOPED SILICON', act: 'YOU ARE HERE' },
  { k: 'switch', name: 'A SWITCH',      act: 'ACT 1' },
  { k: 'gate',   name: 'A GATE',        act: 'ACT 2' },
  { k: 'chip',   name: 'A CHIP',        act: 'ACT 3' },
  { k: 'gpu',    name: 'A GPU',         act: 'ACT 4' },
  { k: 'dc',     name: 'A DATA CENTRE', act: 'ACT 5' },
];
const PX0 = 100, PX1 = 640, PY = 372;
const px = i => PX0 + i * (PX1 - PX0) / (STATIONS.length - 1);

export async function dopingArt(root){
  const add = html => { const g = svgEl('g'); g.innerHTML = html; root.appendChild(g); return g; };

  /* ---------- top: the cube and the scale ---------- */
  add(`<text x="360" y="64" class="lbl" style="fill:var(--ink)">ONE CUBE OF SILICON, 1 CM ON EACH SIDE: ITS RESISTANCE</text>
    <text x="360" y="78" class="lbl-faint" font-size="7.5">EACH TICK ON THE SCALE IS TEN TIMES LOWER</text>`);
  let ticks = '';
  for (let e = 6; e >= -6; e--){
    const x = sx(10 ** e);
    ticks += `<line x1="${f(x)}" y1="${SY - 4}" x2="${f(x)}" y2="${SY + 4}" stroke="var(--ink-soft)" stroke-width="1"/>`;
  }
  add(`<line x1="${SX0}" y1="${SY}" x2="${SX1}" y2="${SY}" stroke="var(--ink)" stroke-width="1.4"/>${ticks}
    <text x="${SX0}" y="${SY - 52}" class="lbl-faint" font-size="7.5" text-anchor="start">← RESISTS MORE</text>
    <text x="${SX1}" y="${SY - 52}" class="lbl-faint" font-size="7.5" text-anchor="end">CONDUCTS MORE →</text>`);
  const marks = LEVELS.map(L => {
    const x = sx(L.ohms), ny = L.up ? SY - 30 : SY + 30, vy = L.up ? SY - 17 : SY + 43;
    const col = L.copper ? 'var(--amber)' : 'var(--blue)';
    const tx = x + (L.dx || 0), anchor = L.anchor || 'middle';
    /* a leader from the dot to its label; side labels bend out so close values do not collide */
    const leader = L.dx ? `<path d="M${f(x)} ${SY} V${SY + 14} H${f(tx)}" fill="none" stroke="${col}" stroke-width="1"/>`
      : `<line x1="${f(x)}" y1="${SY}" x2="${f(x)}" y2="${L.up ? SY - 12 : SY + 14}" stroke="${col}" stroke-width="1"/>`;
    const g = add(`${leader}
      <circle cx="${f(x)}" cy="${SY}" r="5.5" fill="${L.copper ? 'var(--amber-soft)' : 'var(--blue-soft)'}" stroke="${col}" stroke-width="1.6"/>
      <text x="${f(tx)}" y="${ny}" class="lbl" font-size="7.5" text-anchor="${anchor}" style="fill:var(--ink)">${L.name}</text>
      <text x="${f(tx)}" y="${vy}" class="lbl" font-size="8.5" text-anchor="${anchor}" style="font-family:var(--font-mono);fill:${L.copper ? 'var(--ink-soft)' : 'var(--ink)'};font-weight:500">${L.val}</text>`);
    g.style.opacity = '0';
    return g;
  });
  /* the 500,000-times bracket, from pure silicon to 1 in 5 million */
  const bx0 = sx(300000), bx1 = sx(0.5), by = SY + 70;
  const bracket = add(`<path d="M${f(bx0)} ${by - 6} V${by} H${f(bx1)} V${by - 6}" fill="none" stroke="var(--ink)" stroke-width="1.2"/>
    <text x="${f((bx0 + bx1) / 2)}" y="${by + 15}" class="lbl" font-size="8.5" style="fill:var(--ink)">ONE ATOM IN 5 MILLION: OVER 500,000 TIMES LOWER</text>`);
  bracket.style.opacity = '0';

  /* ---------- bottom: where this crystal goes ---------- */
  const head = add(`<text x="360" y="${PY - 62}" class="lbl" style="fill:var(--ink)">WHERE THIS CRYSTAL GOES</text>`);
  head.style.opacity = '0';
  const path = add(`<line x1="${PX0}" y1="${PY}" x2="${PX1}" y2="${PY}" stroke="var(--ink-faint)" stroke-width="1.2" stroke-dasharray="4 5"/>`);
  path.style.opacity = '0';
  const stations = STATIONS.map((S, i) => {
    const here = i === 0;
    const g = add(`<g transform="translate(${f(px(i))} ${PY})">
        <circle r="27" fill="${here ? 'var(--paper-high)' : 'var(--paper)'}" stroke="${here ? 'var(--ink)' : 'var(--ink-faint)'}" stroke-width="${here ? 1.6 : 1}" ${here ? '' : 'stroke-dasharray="3 3"'}/>
        <g fill="none" stroke="${here ? 'var(--ink)' : 'var(--ink-faint)'}" stroke-width="1.2">${ICON[S.k]()}</g>
      </g>
      <text x="${f(px(i))}" y="${PY + 46}" class="lbl" font-size="8" style="fill:${here ? 'var(--ink)' : 'var(--ink-soft)'}">${S.name}</text>
      <text x="${f(px(i))}" y="${PY + 60}" class="${here ? 'lbl' : 'lbl-faint'}" font-size="7.5" style="${here ? 'fill:var(--blue);font-weight:500' : ''}">${S.act}</text>`);
    g.style.opacity = '0';
    return g;
  });
  const ring = svgEl('circle', { cx: px(0), cy: PY, r: 31, fill: 'none', stroke: 'var(--blue)', 'stroke-width': 1.4 });
  const spark = svgEl('circle', { cx: px(0), cy: PY, r: 4, fill: 'var(--blue)' });
  ring.style.opacity = '0'; spark.style.opacity = '0';
  root.append(ring, spark);

  /* build: the markers drop in one by one, then the bracket, then the path ahead */
  await Anim.tween(2600, q => {
    const t = q * 2600;
    marks.forEach((g, i) => {
      const k = Math.min(1, Math.max(0, (t - i * 380) / 320));
      g.style.opacity = k.toFixed(2);
      g.setAttribute('transform', `translate(0 ${(-10 * (1 - k)).toFixed(1)})`);
    });
    bracket.style.opacity = Math.min(1, Math.max(0, (t - 2000) / 400)).toFixed(2);
  }, q => q);
  await Anim.tween(1800, q => {
    const t = q * 1800;
    head.style.opacity = path.style.opacity = Math.min(1, t / 300).toFixed(2);
    stations.forEach((g, i) => { g.style.opacity = Math.min(1, Math.max(0, (t - 150 - i * 220) / 300)).toFixed(2); });
    ring.style.opacity = Math.min(1, Math.max(0, (t - 1500) / 300)).toFixed(2);
  }, q => q);

  /* then it keeps moving: the ring breathes, and a spark runs from the crystal onwards */
  let t0 = null;
  Anim.add((dt, t) => {
    if (t0 === null) t0 = t;
    const e = t - t0;
    ring.setAttribute('r', (31 + 2.5 * Math.sin(e * 3)).toFixed(1));
    const k = (e % 4.2) / 3.4, q = Math.min(1, k);
    spark.setAttribute('cx', f(px(0) + (px(STATIONS.length - 1) - px(0)) * q));
    spark.style.opacity = k > 1 ? '0' : (q < .05 ? q * 20 : 1).toFixed(2);
  });
}
