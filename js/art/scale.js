// BYODC art — your site next to today's largest (REVIEW_NOTES N-094 / N-096, the picture beside
// 5.5's numbers box). Three campuses drawn as circles whose AREA is their power, so the eye
// compares them fairly: your site (29.4 MW), OpenAI's Stargate in Abilene (1,200 MW) and Meta's
// Hyperion in Louisiana (5,000 MW planned), each with the homes it equals. Under them, amber bars
// (power, DESIGN.md §1a) for the whole industry's new IT load outside China: about 25,000 MW in
// 2026 and about 51,000 MW expected in 2027 (SemiAnalysis, October 2026). Company names are plain
// name badges, not logos.
//
// The course ends on a globe the learner can turn (N-093), and this picture sits over it, so a
// pill slides the picture away to the globe and another brings it back.
import { svgEl } from '../engine/util.js';
import { Anim } from '../engine/anim.js';

const K = 110 / Math.sqrt(5000);                 // px of radius per √MW: Hyperion gets r = 110
const BASE = 316;                                // circles sit on this line
const SITES = [
  { x: 92,  mw: 29.4, name: 'YOUR SITE', who: '', homes: '≈ 24,500 HOMES', mine: true },
  { x: 226, mw: 1200, name: 'STARGATE, ABILENE', who: 'OPENAI · ORACLE · CRUSOE', homes: '≈ 1 MILLION HOMES' },
  { x: 470, mw: 5000, name: 'HYPERION, LOUISIANA', who: 'META · PLANNED', homes: '≈ 4 MILLION HOMES' },
];

const badge = (x, y, s) => {
  const w = s.length * 6.4 + 16;
  return `<rect x="${(x - w / 2).toFixed(1)}" y="${y - 11}" width="${w.toFixed(1)}" height="16" rx="8" fill="var(--ink)"/>
    <text x="${x}" y="${y + 1}" class="lbl" style="fill:var(--paper-high);font-size:8px">${s}</text>`;
};

export async function scaleArt(root, panel){
  const add = html => { const g = svgEl('g'); g.innerHTML = html; root.appendChild(g); return g; };
  add(`<text x="360" y="54" class="lbl" style="fill:var(--ink)">YOUR SITE, NEXT TO TODAY'S LARGEST CAMPUSES</text>
    <text x="360" y="68" class="lbl-faint" font-size="7.5">EACH CIRCLE'S AREA IS ITS POWER</text>`);

  const circles = SITES.map(s => {
    const r = K * Math.sqrt(s.mw);
    const g = add(`<circle class="c" cx="${s.x}" cy="${BASE - r}" r="0" fill="${s.mine ? 'rgba(168,116,31,.55)' : 'rgba(168,116,31,.16)'}" stroke="var(--amber)" stroke-width="1.4"/>
      <text x="${s.x}" y="${BASE - r - (s.mine ? 12 : 8)}" class="lbl" font-size="9" style="font-family:var(--font-mono);fill:var(--ink)">${s.mw.toLocaleString('en-GB')} MW</text>
      ${s.mine ? `<text x="${s.x}" y="${BASE + 22}" class="lbl" style="fill:var(--ink)">YOUR SITE</text>`
        : `${badge(s.x, BASE + 22, s.who)}<text x="${s.x}" y="${BASE + 38}" class="lbl" font-size="8.5" style="fill:var(--ink)">${s.name}</text>`}
      <text x="${s.x}" y="${BASE + (s.mine ? 38 : 52)}" class="lbl-faint" font-size="8">${s.homes}</text>`);
    g.style.opacity = '0';
    return { g, r };
  });

  /* the industry, per year */
  const BX = 196, BW = 440, MAX = 51000;
  const bars = [
    { y: 410, label: '2026', mw: 25000, op: .55 },
    { y: 436, label: '2027 (FORECAST)', mw: 51000, op: .85 },
  ];
  add(`<text x="${BX}" y="392" class="lbl" font-size="8" text-anchor="start" style="fill:var(--ink)">NEW IT LOAD ADDED IN ONE YEAR, OUTSIDE CHINA</text>
    ${badge(BX + 372, 389, 'SEMIANALYSIS')}`);
  const barGs = bars.map(b => add(`<text x="${BX - 8}" y="${b.y + 9}" class="lbl-faint" font-size="8" text-anchor="end">${b.label}</text>
      <rect class="bar" x="${BX}" y="${b.y}" width="0" height="12" rx="2" fill="var(--amber)" opacity="${b.op}"/>
      <text class="val" x="${BX + 6}" y="${b.y + 10}" font-size="9" text-anchor="start" style="font-family:var(--font-mono);fill:var(--ink);opacity:0">${b.mw.toLocaleString('en-GB')} MW</text>`));

  /* the pills: away to the globe, and back again */
  const svg = root.ownerSVGElement;
  const pill = (x, y, text) => {
    const g = svgEl('g');
    const w = text.length * 6.6 + 24;
    g.innerHTML = `<rect x="${x - w}" y="${y}" width="${w}" height="22" rx="11" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.2"/>
      <text x="${x - w / 2}" y="${y + 15}" class="lbl" font-size="9" style="fill:var(--ink);pointer-events:none">${text}</text>`;
    g.style.cursor = 'pointer';
    return g;
  };
  const toGlobe = pill(704, 14, 'SEE THE GLOBE ▸');
  root.appendChild(toGlobe);
  const toNumbers = pill(704, 14, '◂ SEE THE NUMBERS');
  toNumbers.style.display = 'none';
  svg.appendChild(toNumbers);
  const slide = async (from, to) => {
    await Anim.tween(520, q => panel.g.setAttribute('transform', `translate(${(from + (to - from) * q).toFixed(1)} 0)`));
  };
  toGlobe.addEventListener('click', async () => { await slide(0, 760); toNumbers.style.display = ''; });
  toNumbers.addEventListener('click', async () => { toNumbers.style.display = 'none'; await slide(760, 0); });

  /* grow in: the circles from small to large, then the two bars */
  await Anim.tween(1500, q => {
    circles.forEach((c, i) => {
      const k = Math.min(1, Math.max(0, (q * 1500 - i * 350) / 600)), e = 1 - (1 - k) ** 3;
      c.g.style.opacity = Math.min(1, k * 3).toFixed(2);
      c.g.querySelector('.c').setAttribute('r', (c.r * e).toFixed(1));
    });
  }, q => q);
  await Anim.tween(900, q => barGs.forEach((g, i) => {
    const b = bars[i], w = BW * b.mw / MAX * Math.min(1, Math.max(0, q * 1.4 - i * .4));
    g.querySelector('.bar').setAttribute('width', w.toFixed(1));
    const v = g.querySelector('.val');
    v.setAttribute('x', (BX + w + 8).toFixed(1));
    v.style.opacity = w > 4 ? '1' : '0';
  }), q => q);
}
