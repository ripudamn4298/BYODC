// BYODC art — AI chips year by year (REVIEW_NOTES N-054, the picture beside 4.2's numbers box).
// The box tells how AI chips moved to narrower numbers: Google's TPU (2015, 8-bit whole
// numbers), NVIDIA's V100 (2017, 16-bit Tensor Cores), the H100 (2022, 8-bit floating
// point) and Blackwell (2024, 4-bit). The A100 (2020) is added between them so the row has no
// gap. Each chip is drawn from above in the same style as Act 3's line-up, floats, and turns
// over when clicked to show its card; click again and it turns back. Under the row, bars show
// each chip's operations a second at its narrowest number, on one linear scale, so the jump
// from 92 to 9,000 trillion shows as it is.
//
// Facts (operations counted as NVIDIA counts them, a multiply-accumulate as two; no sparsity):
// TPU v1: 92 trillion 8-bit ops a second, 65,536 multiply-accumulate units, in Google's data
// centres from 2015 (Jouppi et al., 2017). V100: 125 trillion 16-bit (SXM2), 21.1 billion
// transistors, 815 mm², 4 HBM2 stacks (NVIDIA; Tom's Hardware spec table). A100: 312 trillion
// 16-bit, 54.2 billion, 826 mm², 6 stack sites with 5 in use (NVIDIA datasheet; ComputerBase).
// H100 SXM: 1,979 trillion 8-bit floating point, 80 billion, 814 mm², 6 sites with 5 in use
// (NVIDIA datasheet and Hopper article, as in this box). B200: 9,000 trillion 4-bit, 208
// billion transistors on two dies, 8 HBM3e stacks (NVIDIA DGX B200 datasheet, 72 petaFLOPS
// dense FP4 over 8 GPUs; IEEE Spectrum). Package outlines are drawn, not traced.
import { svgEl } from '../engine/util.js';
import { Anim } from '../engine/anim.js';
import { floatingPart, place } from '../engine/numbersart.js';

const SUBS = 'fill="rgba(92,107,69,.24)" stroke="var(--green)" stroke-width="1.2"';
const DARK = 'fill="#2f322b" stroke="#55594d" stroke-width="1"';
const DIE = 'fill="url(#ppSheen)" stroke="var(--ink-soft)" stroke-width=".8"';
const r = (x, y, w, h, a, rx = 1.5) => `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${rx}" ${a}/>`;

/* a GPU package from above: green substrate, a light interposer, the die(s) and memory
   stacks beside them. All drawn centred on (0, 0). */
function gpu({ w, h, dies = 1, stacks, rows = false }){
  const iw = w - 14, ih = h - 14;
  let s = r(-w / 2, -h / 2, w, h, SUBS, 4) + r(-iw / 2, -ih / 2, iw, ih, 'fill="rgba(29,33,23,.10)" stroke="var(--ink-faint)" stroke-width=".7"', 2);
  if (!rows){
    /* memory stacks in two columns beside one die */
    const per = stacks / 2, hb = 15, gap = 3, colH = per * hb + (per - 1) * gap;
    const dw = iw - 2 * (hb + 8), dh = Math.max(colH, ih - 18);
    s += r(-dw / 2, -dh / 2, dw, dh, DIE, 1.2);
    for (let i = 0; i < per; i++){
      const y = -colH / 2 + i * (hb + gap);
      s += r(-iw / 2 + 3, y, hb, hb, DARK, 1.2) + r(iw / 2 - 3 - hb, y, hb, hb, DARK, 1.2);
    }
  } else {
    /* two dies side by side, memory stacks in a row above and below (as Act 3 draws it) */
    const hb = 15, dh = ih - 2 * (hb + 6), dw = (iw - 8) / 2 - 1;
    s += r(-iw / 2 + 4, -dh / 2, dw, dh, DIE, 1.2) + r(2, -dh / 2, dw, dh, DIE, 1.2);
    const per = stacks / 2, step = (iw - 8 - hb) / (per - 1);
    for (let i = 0; i < per; i++){
      const x = -iw / 2 + 4 + i * step;
      s += r(x, -ih / 2 + 3, hb, hb, DARK, 1.2) + r(x, ih / 2 - 3 - hb, hb, hb, DARK, 1.2);
    }
  }
  return s;
}

const CHIPS = [
  { name: 'GOOGLE TPU', year: '2015', bits: '8-BIT WHOLE NUMBERS', ops: 92, w: 74, h: 74,
    lines: ['92 TRILLION OPS/S', '65,536 MULTIPLIERS', 'RUNS TRAINED MODELS'],
    /* a square package under a metal lid */
    front: () => r(-37, -37, 74, 74, SUBS, 4) + r(-28, -28, 56, 56, 'fill="url(#ppLid)" stroke="#8e8f86" stroke-width="1"', 4)
      + `<text x="0" y="3" class="lbl" font-size="8" style="fill:#5f6156">TPU</text>` },
  { name: 'NVIDIA V100', year: '2017', bits: '16-BIT NUMBERS', ops: 125, w: 92, h: 92,
    lines: ['125 TRILLION OPS/S', '21.1 BN TRANSISTORS', '815 MM² DIE', '4 MEMORY STACKS'],
    front: () => gpu({ w: 92, h: 92, stacks: 4 }) },
  { name: 'NVIDIA A100', year: '2020', bits: '16-BIT NUMBERS', ops: 312, w: 98, h: 98,
    lines: ['312 TRILLION OPS/S', '54.2 BN TRANSISTORS', '826 MM² DIE', '6 STACKS, 5 IN USE'],
    front: () => gpu({ w: 98, h: 98, stacks: 6 }) },
  { name: 'NVIDIA H100', year: '2022', bits: '8-BIT FLOATING POINT', ops: 1979, w: 98, h: 98,
    lines: ['1,979 TRILLION OPS/S', '80 BN TRANSISTORS', '814 MM² DIE', '6 STACKS, 5 IN USE'],
    front: () => gpu({ w: 98, h: 98, stacks: 6 }) },
  { name: 'NVIDIA B200', year: '2024', bits: '4-BIT FLOATING POINT', ops: 9000, w: 118, h: 104,
    lines: ['9,000 TRILLION OPS/S', '208 BN TRANSISTORS', 'TWO DIES', '8 MEMORY STACKS'],
    front: () => gpu({ w: 118, h: 104, dies: 2, stacks: 8, rows: true }) },
];

const XS = [96, 228, 360, 492, 624], CY = 168;
const BASE = 384, BAR_MAX = 94, MAX = 9000;
const CARD = { w: 128, h: 116 };

/* the back of a chip: a dark card, like the numbers box beside it */
const back = c => `
  <rect x="${-CARD.w / 2}" y="${-CARD.h / 2}" width="${CARD.w}" height="${CARD.h}" rx="6" fill="var(--dark)"/>
  <text x="0" y="${-CARD.h / 2 + 18}" class="lbl" font-size="8.5" style="fill:var(--amber)">${c.name}</text>
  <text x="0" y="${-CARD.h / 2 + 31}" class="lbl" font-size="7.5" style="fill:rgba(239,236,224,.6)">${c.year}</text>
  <text x="0" y="${-CARD.h / 2 + 49}" class="lbl" font-size="7" style="fill:var(--cream);letter-spacing:.03em">${c.bits}</text>
  ${c.lines.map((l, i) => `<text x="0" y="${-CARD.h / 2 + 66 + i * 13}" class="lbl" font-size="6.8" style="fill:rgba(239,236,224,.82);letter-spacing:.03em">${l}</text>`).join('')}`;

export async function precisionArt(root){
  const defs = svgEl('defs');
  defs.innerHTML = `<linearGradient id="ppSheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#cfd2cf"/><stop offset=".45" stop-color="#b7bbb8"/>
      <stop offset=".55" stop-color="#d6d9d6"/><stop offset="1" stop-color="#a9adaa"/></linearGradient>
    <linearGradient id="ppLid" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e3e4e0"/><stop offset=".5" stop-color="#c5c8c3"/><stop offset="1" stop-color="#d9dbd6"/></linearGradient>`;
  root.appendChild(defs);
  const txt = (x, y, t, cls = 'lbl', style = 'fill:var(--ink)', fs) => {
    const n = svgEl('text', { x, y, class: cls, style, ...(fs ? { 'font-size': fs } : {}) });
    n.textContent = t; root.appendChild(n); return n;
  };
  txt(360, 44, 'AI CHIPS, YEAR BY YEAR: NARROWER NUMBERS, MORE WORK');
  /* REVIEW_NOTES N-064: say plainly that the chips open. A dark pill with a pointer, pulsing
     gently until the first click, then gone. */
  const hint = svgEl('g');
  hint.innerHTML = `<rect x="222" y="58" width="276" height="24" rx="12" fill="var(--ink)"/>
    <path d="M236 63 L236 77 L240 73.5 L243 80 L245.5 79 L242.5 72.5 L248 72.5 Z" fill="var(--paper-high)"/>
    <text x="374" y="74" class="lbl" font-size="9" style="fill:var(--paper-high)">CLICK ANY CHIP TO SEE ITS DETAILS</text>`;
  root.appendChild(hint);
  const hintPulse = Anim.add((dt, t) => { hint.style.opacity = (.72 + .28 * Math.cos(t * 3)).toFixed(2); });

  /* the bars and the years */
  const axis = svgEl('line', { x1: 40, y1: BASE, x2: 680, y2: BASE, stroke: 'var(--ink)', 'stroke-width': 1 });
  root.appendChild(axis);
  const bars = CHIPS.map((c, i) => {
    const hgt = Math.max(2, BAR_MAX * c.ops / MAX);
    const bar = svgEl('rect', { x: XS[i] - 18, y: BASE, width: 36, height: 0, fill: 'var(--ink)', opacity: .78 });
    const val = svgEl('text', { x: XS[i], y: BASE - hgt - 7, class: 'lbl', style: 'fill:var(--ink);opacity:0', 'font-size': 9 });
    val.textContent = c.ops.toLocaleString('en-GB');
    root.append(bar, val);
    txt(XS[i], BASE + 18, c.year, 'lbl', 'fill:var(--ink)', 10);
    txt(XS[i], BASE + 31, c.bits.replace(' NUMBERS', '').replace('FLOATING POINT', 'FLOAT'), 'lbl-faint', '', 7.5);
    return { bar, val, hgt };
  });
  txt(360, 452, 'TRILLION OPERATIONS A SECOND, AT EACH CHIP\'S NARROWEST NUMBER (NO SPARSITY)', 'lbl-faint', '', 8);

  /* the chips: a front and a back on a group that is squeezed to turn it over */
  const chips = CHIPS.map((c, i) => {
    const spin = `<g class="pp-spin"><g class="pp-front">${c.front()}</g><g class="pp-back" style="display:none">${back(c)}</g></g>`;
    const g = floatingPart(root, spin, { w: c.w, h: Math.max(c.h, CARD.h) });
    place(g, XS[i], CY + 60);
    g.style.opacity = '0';
    g.style.cursor = 'pointer';
    const name = txt(XS[i], CY + 88, c.name.replace('NVIDIA ', '').replace('GOOGLE ', ''), 'lbl', 'fill:var(--ink);opacity:0', 9);
    return { c, g, name, open: false, busy: false };
  });

  /* arrive: each chip rises into place in year order, and its bar grows */
  await Anim.tween(1600, q => {
    chips.forEach((ch, i) => {
      const k = Math.min(1, Math.max(0, (q * 1600 - i * 180) / 700)), e = 1 - (1 - k) ** 3;
      place(ch.g, XS[i], CY + 60 * (1 - e));
      ch.g.style.opacity = e.toFixed(2);
      ch.name.style.opacity = e.toFixed(2);
      const b = bars[i];
      b.bar.setAttribute('y', (BASE - b.hgt * e).toFixed(1));
      b.bar.setAttribute('height', (b.hgt * e).toFixed(1));
      b.val.style.opacity = e.toFixed(2);
    });
  }, q => q);
  chips.forEach((ch, i) => {
    ch.g.classList.add('tile3d');
    ch.g.querySelectorAll('.float-inner, .float-shadow').forEach(n => { n.style.animationDelay = `${(-i * .6).toFixed(1)}s`; });
  });

  /* turn over: squeeze to nothing, swap faces, open out again (a turn about the upright axis) */
  const flip = async ch => {
    if (ch.busy) return;
    ch.busy = true;
    Anim.remove(hintPulse);
    hint.style.display = 'none';
    const spin = ch.g.querySelector('.pp-spin');
    await Anim.tween(220, q => spin.setAttribute('transform', `scale(${(1 - q).toFixed(3)} 1)`), q => q * q);
    ch.open = !ch.open;
    ch.g.querySelector('.pp-front').style.display = ch.open ? 'none' : '';
    ch.g.querySelector('.pp-back').style.display = ch.open ? '' : 'none';
    ch.name.style.opacity = ch.open ? '0' : '1';
    await Anim.tween(260, q => spin.setAttribute('transform', `scale(${q.toFixed(3)} 1)`), q => 1 - (1 - q) * (1 - q));
    spin.removeAttribute('transform');
    ch.busy = false;
  };
  chips.forEach(ch => ch.g.addEventListener('click', () => flip(ch)));
}
