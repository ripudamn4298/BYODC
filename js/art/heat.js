// BYODC art — where the 700 watts go (REVIEW_NOTES N-071, the picture beside 4.6's numbers box).
// Ripu: a picture of what the box says, with figures, numbers and arrows, kept simple; heat
// shown as heat. Three panels, each one line of the box:
//   1. the die, 2.9 cm across, with heat (amber) rising off it: 700 joules every second;
//   2. 700 W against things the reader knows: a microwave (1,000 W) and a home (1,200 W);
//   3. the energy of one multiply-add (1.4 pJ) against one read from a small on-chip memory
//      (7.5 pJ, step 3's number), on one scale.
// Amber is power and heat (DESIGN.md §1a), so every bar and the heat are amber. The heat
// rises on a ticker that is decoration only; the bars grow once on arrival (Anim.tween).
import { svgEl } from '../engine/util.js';
import { Anim } from '../engine/anim.js';

const DIE = { x: 82, y: 196, s: 120 };          // the die, drawn square
const BX = 330, BW = 300;                       // bar column start and full width

export async function heatArt(root){
  const add = html => { const g = svgEl('g'); g.innerHTML = html; root.appendChild(g); return g; };
  add(`<text x="360" y="44" class="lbl" style="fill:var(--ink)">WHERE THE 700 WATTS GO</text>
    <defs><linearGradient id="htSheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#cfd2cf"/><stop offset=".45" stop-color="#b7bbb8"/>
      <stop offset=".55" stop-color="#d6d9d6"/><stop offset="1" stop-color="#a9adaa"/></linearGradient></defs>`);

  /* ---------- 1. the die and its heat ---------- */
  add(`<text x="${DIE.x + DIE.s / 2}" y="92" class="lbl" font-size="8.5" style="fill:var(--ink-soft)">1 · HEAT</text>
    <rect x="${DIE.x}" y="${DIE.y}" width="${DIE.s}" height="${DIE.s}" rx="3" fill="url(#htSheen)" stroke="var(--ink-soft)"/>
    <text x="${DIE.x + DIE.s / 2}" y="${DIE.y + DIE.s / 2 + 4}" class="lbl" font-size="9" style="fill:var(--ink)">GPU DIE</text>
    <path d="M${DIE.x} ${DIE.y + DIE.s + 12} v6 M${DIE.x + DIE.s} ${DIE.y + DIE.s + 12} v6 M${DIE.x} ${DIE.y + DIE.s + 15} H${DIE.x + DIE.s}" stroke="var(--ink-soft)" stroke-width="1"/>
    <text x="${DIE.x + DIE.s / 2}" y="${DIE.y + DIE.s + 32}" class="lbl" font-size="8.5" style="fill:var(--ink)">2.9 CM ACROSS</text>
    <text x="${DIE.x + DIE.s / 2}" y="${DIE.y + DIE.s + 56}" class="lbl" font-size="9" style="fill:var(--amber)">700 JOULES OF HEAT</text>
    <text x="${DIE.x + DIE.s / 2}" y="${DIE.y + DIE.s + 70}" class="lbl" font-size="9" style="fill:var(--amber)">EVERY SECOND</text>
    <text x="${DIE.x + DIE.s / 2}" y="${DIE.y + DIE.s + 90}" class="lbl-faint" font-size="7.5">1 WATT = 1 JOULE EVERY SECOND</text>`);
  const heat = add('');
  const wave = (x, y0, h, ph) => {
    let d = `M${x} ${y0}`;
    for (let k = 1; k <= 12; k++){ const y = y0 - h * k / 12; d += ` L${(x + 5 * Math.sin(k * .9 + ph)).toFixed(1)} ${y.toFixed(1)}`; }
    return d;
  };

  /* ---------- 2. 700 W, compared ---------- */
  const MAXW = 1200;
  const rows = [
    { y: 128, name: 'THE H100', w: 700, icon: `<rect x="-11" y="-11" width="22" height="22" rx="2" fill="url(#htSheen)" stroke="var(--ink-soft)"/>`, ink: true },
    { y: 172, name: 'A MICROWAVE, COOKING', w: 1000, icon: `<rect x="-15" y="-10" width="30" height="20" rx="2" fill="none" stroke="var(--ink)" stroke-width="1.3"/><rect x="-12" y="-7" width="17" height="14" rx="1" fill="none" stroke="var(--ink)"/><circle cx="10" cy="-2" r="2" fill="var(--ink)"/>` },
    { y: 216, name: 'AN AVERAGE HOME', w: 1200, icon: `<path d="M-13 -1 L0 -13 L13 -1 M-10 -3 V11 H10 V-3" fill="none" stroke="var(--ink)" stroke-width="1.3" stroke-linejoin="round"/><rect x="-3" y="3" width="6" height="8" fill="none" stroke="var(--ink)"/>` },
  ];
  add(`<text x="${BX - 30}" y="92" class="lbl" font-size="8.5" text-anchor="start" style="fill:var(--ink-soft)">2 · 700 WATTS, COMPARED</text>`);
  const bars1 = rows.map(r => {
    const g = add(`<g transform="translate(${BX - 14} ${r.y})">${r.icon}</g>
      <text x="${BX + 6}" y="${r.y - 9}" class="lbl" font-size="8" text-anchor="start" style="fill:${r.ink ? 'var(--ink)' : 'var(--ink-soft)'}">${r.name}</text>
      <rect class="bar" x="${BX + 6}" y="${r.y - 2}" width="0" height="10" rx="2" fill="var(--amber)" opacity="${r.ink ? 1 : .55}"/>
      <text class="val" x="${BX + 6}" y="${r.y + 7}" font-size="8.5" text-anchor="start" style="font-family:var(--font-mono);fill:var(--ink);opacity:0">${r.w.toLocaleString('en-GB')} W</text>`);
    return { g, w: BW * r.w / MAXW };
  });

  /* ---------- 3. one operation's energy ---------- */
  const MAXE = 7.5;
  const ops = [
    { y: 314, name: 'ONE MULTIPLY-ADD ON THE H100', e: 1.4, ink: true },
    { y: 356, name: 'ONE READ FROM A SMALL ON-CHIP MEMORY (STEP 3)', e: 7.5 },
  ];
  add(`<text x="${BX - 30}" y="282" class="lbl" font-size="8.5" text-anchor="start" style="fill:var(--ink-soft)">3 · ENERGY FOR ONE OPERATION</text>
    <text x="${BX - 30}" y="388" class="lbl-faint" font-size="7.5" text-anchor="start">700 J ÷ 495 TRILLION MULTIPLY-ADDS = 1.4 PJ EACH</text>`);
  const bars2 = ops.map(o => {
    const g = add(`<text x="${BX + 6}" y="${o.y - 9}" class="lbl" font-size="8" text-anchor="start" style="fill:${o.ink ? 'var(--ink)' : 'var(--ink-soft)'}">${o.name}</text>
      <rect class="bar" x="${BX + 6}" y="${o.y - 2}" width="0" height="10" rx="2" fill="var(--amber)" opacity="${o.ink ? 1 : .55}"/>
      <text class="val" x="${BX + 6}" y="${o.y + 7}" font-size="8.5" text-anchor="start" style="font-family:var(--font-mono);fill:var(--ink);opacity:0">${o.e} PJ</text>`);
    return { g, w: BW * o.e / MAXE };
  });
  add(`<text x="${BX - 30}" y="414" class="lbl" font-size="8" text-anchor="start" style="fill:var(--ink)">A WHOLE MULTIPLY-ADD COSTS LESS THAN ONE FETCH,</text>
    <text x="${BX - 30}" y="428" class="lbl" font-size="8" text-anchor="start" style="fill:var(--ink)">BECAUSE THE H100 USES EACH NUMBER IT FETCHES MANY TIMES</text>
    <text x="360" y="462" class="lbl-faint" font-size="7.5">PJ = PICOJOULE, A MILLIONTH OF A MILLIONTH OF A JOULE · THE H100 AT ITS TOP RATED SPEED</text>`);

  /* heat rises off the die, always */
  let t0 = null;
  Anim.add((dt, t) => {
    if (t0 === null) t0 = t;
    const T = t - t0;
    let html = '';
    for (let i = 0; i < 5; i++){
      const x = DIE.x + 14 + i * (DIE.s - 28) / 4;
      const k = ((T * .6 + i * .37) % 1);
      const y0 = DIE.y - 8 - k * 26;
      html += `<path d="${wave(x, y0, 48, T * 3 + i)}" fill="none" stroke="var(--amber)" stroke-width="2" stroke-linecap="round" opacity="${(1 - k).toFixed(2)}"/>`;
    }
    heat.innerHTML = html;
  });

  /* the bars grow in, top to bottom */
  const all = [...bars1, ...bars2];
  await Anim.tween(1400, q => all.forEach((b, i) => {
    const k = Math.min(1, Math.max(0, (q * 1400 - i * 160) / 600)), e = 1 - (1 - k) ** 3;
    const bar = b.g.querySelector('.bar'), val = b.g.querySelector('.val');
    bar.setAttribute('width', (b.w * e).toFixed(1));
    val.setAttribute('x', (BX + 12 + b.w * e).toFixed(1));
    val.style.opacity = e.toFixed(2);
  }), q => q);
}
