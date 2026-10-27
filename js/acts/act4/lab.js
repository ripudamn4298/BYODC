// ACT 4 — "In the Lab" pictures (DESIGN.md §6d rule 8). Each builder returns an SVG string
// for slideInPanel(svg, html, { lab: true }), with its parts grouped under data-k keys so a
// card can focus one of them. Act-local, adapted from js/engine/reallife.js.
//
// Facts drawn here (sources in each step's report, all checked 2026-10-19):
// - H100 SXM5: 144 SMs on the full GH100 die in 8 groups of 18, 132 switched on; 128 FP32
//   lanes per SM in four groups of 32; 256 KB register file and 256 KB L1/shared memory per
//   SM, up to 228 KB shared; 50 MB L2; 80 GB HBM3; 814 mm² (NVIDIA, "Hopper Architecture In
//   Depth"). nvidia-smi readout of an H100 80GB HBM3: ICC "HGX 8x H100 benchmarks".
// - V100 Tensor Core: D = A × B + C on 4 × 4 grids, 64 multiply-accumulates a clock
//   (NVIDIA Volta tuning guide; Cornell CVW; AnandTech).
// - HBM3 16 GB stack: eight 16 Gb DRAM dies, ground to about 30 µm, joined by TSVs (SK hynix
//   via ETNews, 2022); 1,024 data wires per stack (JEDEC HBM3).
// - Jetson Orin Nano Super developer kit: 1,024 CUDA cores, 32 Tensor Cores, 8 GB, 7/15/25 W,
//   $249 (NVIDIA technical blog, Dec 2024).
import { laneIcon, tensorCoreIcon } from '../../art/icons.js';
import { mulberry32 } from '../../engine/util.js';

const f = v => (+v).toFixed(1);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const MONO = 'font-family:var(--font-mono);letter-spacing:0;white-space:pre';
const INK = 'fill:var(--ink)';

/* a mono label: ink, never a semantic colour unless asked */
export function label(x, y, s, { anchor = 'middle', size = 8.5, fill = 'var(--ink)', cls = 'lbl', weight = '' } = {}){
  return `<text x="${f(x)}" y="${f(y)}" class="${cls}" font-size="${size}" text-anchor="${anchor}" style="fill:${fill}${weight ? `;font-weight:${weight}` : ''}">${esc(s)}</text>`;
}

/* a leader line from a point on a part to its label, with a dot on the part */
export function callout(x1, y1, x2, y2, s, { anchor = 'start', size = 8.5 } = {}){
  const dx = anchor === 'start' ? 3 : anchor === 'end' ? -3 : 0;
  const dy = anchor === 'middle' ? (y2 < y1 ? -4 : 10) : 3;
  return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="var(--ink-soft)" stroke-width=".8"/>
    <circle cx="${f(x1)}" cy="${f(y1)}" r="1.8" fill="var(--ink)"/>
    ${label(x2 + dx, y2 + dy, s, { anchor, size })}`;
}

/* a terminal window: dark, with a title bar. lines are strings, or arrays of
   [text, style] segments; a line starting '#' (after spaces) is drawn as a comment.
   col(c, row) gives the x of character c and the baseline y of a row, for annotations. */
export function terminal({ x, y, w, lines, fs = 11, title = '', pad = 12 }){
  const lh = fs * 1.42, cw = fs * 0.6, top = y + 20 + pad * .6 + fs;
  const h = 20 + pad * 1.2 + lines.length * lh;
  const row = (ln, i) => {
    const yy = f(top + i * lh);
    const segs = Array.isArray(ln) ? ln : [[ln, /^\s*#/.test(ln) ? 'fill:#9c9e8f' : 'fill:#e9e4d3']];
    return `<text x="${f(x + pad)}" y="${yy}" font-size="${fs}" style="${MONO}">`
      + segs.map(([t, st]) => `<tspan style="${st || 'fill:#e9e4d3'}">${esc(t)}</tspan>`).join('') + `</text>`;
  };
  const svg = `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="6" fill="#1f221b" stroke="#3d4136"/>
    <rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="20" rx="6" fill="#30342b"/>
    <rect x="${f(x)}" y="${f(y + 14)}" width="${f(w)}" height="6" fill="#30342b"/>
    ${[0, 1, 2].map(i => `<circle cx="${f(x + 12 + i * 11)}" cy="${f(y + 10)}" r="3.2" fill="#55594d"/>`).join('')}
    ${title ? `<text x="${f(x + w / 2)}" y="${f(y + 13.5)}" font-size="8.5" text-anchor="middle" style="font-family:var(--font-mono);letter-spacing:.1em;fill:#b9b6a7">${esc(title)}</text>` : ''}
    ${lines.map(row).join('')}`;
  return { svg, h, col: (c, r) => [x + pad + c * cw, top + r * lh] };
}

const dieGrad = id => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#cfd2cf"/><stop offset=".45" stop-color="#b7bbb8"/><stop offset="1" stop-color="#c6c9c5"/>
  </linearGradient>`;

/* ================================================================ 4.1 race
   Left: the H100 die, 8 groups of 18 SMs (from NVIDIA's GH100 block diagram), 12 of them
   switched off, chosen by a fixed seed so every replay draws the same chip. Right, top: one
   SM, four groups of 32 lanes, each under one scheduler. Right, bottom: asking PyTorch. */
export function labGpuDie(){
  const rnd = mulberry32(0x4a11);
  const idx = [...Array(144).keys()];
  for (let i = idx.length - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  const off = new Set(idx.slice(0, 12));
  const D = { x: 30, y: 80, w: 290, h: 330 };
  const GW = 57.5, GX0 = 54, rowsY = [86, 256], GH = 148;
  let sms = '', offs = '', groups = '', pick = null;
  for (let g = 0; g < 8; g++){
    const gx = GX0 + (g % 4) * (GW + 4), gy = rowsY[Math.floor(g / 4)];
    groups += `<rect x="${f(gx)}" y="${f(gy)}" width="${GW}" height="${GH}" rx="1.5" fill="rgba(29,33,23,.07)" stroke="rgba(29,33,23,.28)" stroke-width=".7"/>`;
    const sw = (GW - 6 - 5) / 3, sh = (GH - 6 - 12.5) / 6;
    for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++){
      const k = g * 18 + r * 3 + c;
      const x = gx + 3 + c * (sw + 2.5), y = gy + 3 + r * (sh + 2.5);
      if (!pick && !off.has(k)) pick = { x, y, w: sw, h: sh };
      if (off.has(k)){
        offs += `<rect x="${f(x)}" y="${f(y)}" width="${f(sw)}" height="${f(sh)}" rx="1" fill="#e9e6db" stroke="var(--ink)" stroke-width="1.1" stroke-dasharray="2.4 1.8"/>`;
      } else {
        sms += `<rect x="${f(x)}" y="${f(y)}" width="${f(sw)}" height="${f(sh)}" rx="1" fill="#a9ada9" stroke="#7d817c" stroke-width=".6"/>
          <path d="M${f(x + sw / 2)} ${f(y + 2)} V${f(y + sh - 2)} M${f(x + 2)} ${f(y + sh / 2)} H${f(x + sw - 2)}" stroke="#8f938e" stroke-width=".6"/>`;
      }
    }
  }
  const strips = [D.x, D.x + D.w - 20].map(sx => [0, 1, 2].map(i =>
    `<rect x="${sx + 2}" y="${f(D.y + 6 + i * 106)}" width="16" height="100" rx="1.5" fill="#bfc2bd" stroke="#8f938e" stroke-width=".6"/>`).join('')).join('');
  const die = `<rect x="${D.x}" y="${D.y}" width="${D.w}" height="${D.h}" rx="2" fill="url(#a4DieA)" stroke="var(--ink-soft)" stroke-width="1"/>
    ${strips}${groups}
    <rect x="54" y="238" width="242" height="14" rx="1.5" fill="#c3c6c1" stroke="#8f938e" stroke-width=".6"/>
    ${sms}`;

  /* one SM, enlarged: four groups, each a scheduler, 32 lanes, a register file */
  const S = { x: 345, y: 76, w: 355, h: 222 };
  const qw = (S.w - 24) / 2, qh = 88;
  let quarters = '';
  for (let q = 0; q < 4; q++){
    const qx = S.x + 8 + (q % 2) * (qw + 8), qy = S.y + 22 + Math.floor(q / 2) * (qh + 8);
    let lanes = '';
    const lw = (qw - 12 - 7 * 3) / 8;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++){
      lanes += `<rect x="${f(qx + 6 + c * (lw + 3))}" y="${f(qy + 20 + r * 12)}" width="${f(lw)}" height="9" rx="1.2" class="a4-lane"/>`;
    }
    quarters += `<g class="a4-q${q}">
      <rect x="${f(qx)}" y="${f(qy)}" width="${f(qw)}" height="${qh}" rx="3" fill="var(--paper-high)" stroke="var(--hairline-strong)" stroke-width="1"/>
      <rect x="${f(qx + 6)}" y="${f(qy + 5)}" width="${f(qw - 12)}" height="12" rx="2" fill="#dcd9cc" stroke="var(--ink-soft)" stroke-width=".7"/>
      ${label(qx + qw / 2, qy + 14, 'SCHEDULER', { size: 7.5 })}
      ${lanes}
      <rect x="${f(qx + 6)}" y="${f(qy + 70)}" width="${f(qw - 12)}" height="13" rx="2" fill="#efe9da" stroke="var(--ink-soft)" stroke-width=".7"/>
      ${label(qx + qw / 2, qy + 79.5, 'REGISTER FILE', { size: 7.5 })}
    </g>`;
  }
  const sm = `<rect x="${S.x}" y="${S.y}" width="${S.w}" height="${S.h}" rx="4" fill="#e7e3d6" stroke="var(--ink)" stroke-width="1.2"/>
    ${label(S.x + S.w / 2, S.y + 14, 'ONE SM: 4 GROUPS OF 32 LANES', { size: 8.5 })}
    ${quarters}
    ${label(S.x + S.w / 2, S.y + S.h + 13, 'EACH SMALL BOX IS ONE LANE', { size: 8, cls: 'lbl-faint', fill: 'var(--ink-soft)' })}
    <path d="M${f(pick.x + pick.w)} ${f(pick.y)} L${S.x} ${S.y} M${f(pick.x + pick.w)} ${f(pick.y + pick.h)} L${S.x} ${S.y + S.h}" stroke="var(--ink-soft)" stroke-width=".7" stroke-dasharray="3 3"/>
    <rect x="${f(pick.x - 1.5)}" y="${f(pick.y - 1.5)}" width="${f(pick.w + 3)}" height="${f(pick.h + 3)}" fill="none" stroke="var(--ink)" stroke-width="1.6"/>`;

  /* (the PyTorch terminal that used to sit here went with its card, Act 4 rework 2026-10-25) */

  return `<defs>${dieGrad('a4DieA')}</defs>
    <style>.a4-lane{fill:#fbf9f2;stroke:var(--ink-soft);stroke-width:.7;transition:fill .3s,stroke .3s}
      .a4-lit .a4-lane{fill:var(--blue-soft);stroke:var(--blue);stroke-width:1}</style>
    ${label(175, 66, 'THE H100 DIE, FROM NVIDIA’S BLOCK DIAGRAM', { size: 9 })}
    <g data-k="die">${die}
      ${label(175, 428, '144 SMs IN 8 GROUPS · 132 SWITCHED ON', { size: 8.5 })}</g>
    <g data-k="off">${offs}
      ${label(175, 443, 'DASHED: SWITCHED OFF', { size: 8, fill: 'var(--ink-soft)' })}
      ${label(175, 456, 'A DIFFERENT 12 ON EACH CHIP', { size: 8, fill: 'var(--ink-soft)' })}</g>
    <g data-k="sm">${sm}</g>`;
}

/* ================================================================ 4.2 mac
   Left: a matrix multiply in PyTorch, and what one number of the answer means as a loop.
   Right: one V100 Tensor Core step, D = A × B + C on 4 × 4 grids. */
export function labMatmul(){
  const code = terminal({ x: 30, y: 78, w: 360, fs: 10.5, title: 'PYTHON', lines: [
    'import torch',
    'a = torch.randn(4096, 4096, device="cuda",',
    '                dtype=torch.float16)',
    'b = torch.randn(4096, 4096, device="cuda",',
    '                dtype=torch.float16)',
    [['c = a @ b'], ['   # multiply the two matrices', 'fill:#9c9e8f']],
  ] });
  const loop = terminal({ x: 30, y: 262, w: 360, fs: 10.5, title: 'WHAT ONE NUMBER OF c MEANS', lines: [
    'total = 0.0',
    'for k in range(4096):',
    '    # multiply, then add onto the total',
    '    total += a[i, k] * b[k, j]',
    'c[i, j] = total',
  ] });
  const marks = '';

  /* the Tensor Core figure */
  const C = 14, GS = 4 * C, top = 168;
  const grid = (x, name, hi = null) => {
    let s = '';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++){
      const on = hi && hi(r, c);
      s += `<rect x="${f(x + c * C)}" y="${f(top + r * C)}" width="${C}" height="${C}" fill="${on ? '#e3ddca' : '#fbf9f2'}" stroke="${on ? 'var(--ink)' : 'var(--ink-soft)'}" stroke-width="${on ? 1.3 : .7}"/>`;
    }
    return s + label(x + GS / 2, top + GS + 16, name, { size: 10, cls: 'lbl-strong' });
  };
  const xs = [410, 488, 566, 644];
  const op = (x, s) => `<text x="${f(x)}" y="${f(top + GS / 2 + 6)}" font-size="17" text-anchor="middle" style="${INK};font-family:var(--font-mono)">${s}</text>`;
  const tc = `<rect x="400" y="96" width="304" height="250" rx="5" fill="#ebe7da" stroke="var(--ink)" stroke-width="1.2"/>
    ${label(554, 116, 'ONE TENSOR CORE, ONE CLOCK BEAT', { size: 9 })}
    ${label(554, 132, 'NVIDIA V100 (2017), 16-BIT NUMBERS', { size: 8, fill: 'var(--ink-soft)' })}
    ${grid(xs[0], 'A', (r) => r === 1)}${op(xs[0] + GS + 11, '×')}
    ${grid(xs[1], 'B', (r, c) => c === 2)}${op(xs[1] + GS + 11, '+')}
    ${grid(xs[2], 'C', (r, c) => r === 1 && c === 2)}${op(xs[2] + GS + 11, '=')}
    ${grid(xs[3] - 2, 'D', (r, c) => r === 1 && c === 2)}
    ${label(554, 270, 'EACH NUMBER OF D TAKES 4 MULTIPLIES,', { size: 8 })}
    ${label(554, 283, 'ADDED ONTO ITS NUMBER IN C', { size: 8 })}
    ${label(554, 304, '16 NUMBERS × 4 = 64 MULTIPLY-ACCUMULATES', { size: 8.5, weight: 500 })}
    ${label(554, 328, 'SHADED: WHAT ONE NUMBER OF D USES', { size: 7.5, fill: 'var(--ink-soft)' })}
    ${tensorCoreIcon(424, 362, 62)}
    ${label(500, 378, 'TENSOR CORE', { anchor: 'start', size: 9.5, cls: 'lbl-strong' })}
    ${label(500, 394, 'A BLOCK OF MAC UNITS', { anchor: 'start', size: 8 })}
    ${label(500, 407, 'THAT MULTIPLIES TWO SMALL', { anchor: 'start', size: 8 })}
    ${label(500, 420, 'MATRICES IN ONE GO', { anchor: 'start', size: 8 })}`;
  return `<g data-k="code">${code.svg}</g>
    <g data-k="loop">${loop.svg}${marks}</g>
    <g data-k="tc">${tc}</g>`;
}

/* ================================================================ 4.3 registers
   Left: the H100 package from above (die, L2 strip, HBM stacks) and one SM enlarged.
   Right: the four rungs, nearest the lanes first. */
export function labMemoryLadder(){
  /* package */
  const P = { x: 40, y: 78, w: 340, h: 172 };
  const die = { x: 150, y: 96, w: 120, h: 136 };
  let smg = '';
  const sw = 8.4, sh = 7.6;
  let pick = null;
  for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++){
    const x = die.x + 6 + c * 9.1, y = die.y + 6 + r * 9.1 + (r >= 6 ? 14 : 0);
    if (r === 1 && c === 1) pick = { x, y };
    smg += `<rect x="${f(x)}" y="${f(y)}" width="${sw}" height="${sh}" rx=".8" fill="#a9ada9" stroke="#7d817c" stroke-width=".4"/>`;
  }
  const l2 = `<rect x="${die.x + 5}" y="${f(die.y + 6 + 6 * 9.1 + 1)}" width="${die.w - 10}" height="11" rx="1" fill="#e6dcc0" stroke="var(--ink)" stroke-width=".9"/>`;
  const stacks = [0, 1, 2].map(i => [100, 280].map(sx =>
    `<rect x="${sx}" y="${f(die.y + 2 + i * 45)}" width="40" height="40" rx="2" fill="#3a3d35" stroke="#55594d" stroke-width="1"/>
     <rect x="${sx + 4}" y="${f(die.y + 6 + i * 45)}" width="32" height="32" rx="1" fill="none" stroke="#55594d" stroke-width=".6"/>`).join('')).join('');
  const pkg = `<rect x="${P.x}" y="${P.y}" width="${P.w}" height="${P.h}" rx="5" fill="rgba(92,107,69,.22)" stroke="var(--green)" stroke-width="1.1"/>
    <rect x="92" y="90" width="236" height="142" rx="2" fill="rgba(29,33,23,.06)" stroke="var(--ink-faint)" stroke-width=".7"/>
    <rect x="${die.x}" y="${die.y}" width="${die.w}" height="${die.h}" rx="1.5" fill="url(#a4DieB)" stroke="var(--ink-soft)" stroke-width="1"/>
    ${smg}`;

  /* one SM enlarged */
  const S = { x: 50, y: 292, w: 320, h: 148 };
  let regs = '', lanes = '', sched = '';
  for (let q = 0; q < 4; q++){
    const qx = S.x + 10 + q * 76;
    // N-102: each quarter of the SM has its own scheduler above its registers, as in 4.1.11
    sched += `<rect x="${qx}" y="${S.y + 21}" width="72" height="10" rx="1.5" fill="var(--ink)"/>
      ${label(qx + 36, S.y + 28.6, 'SCHEDULER', { size: 6, fill: 'var(--paper-high)' })}`;
    regs += `<rect x="${qx}" y="${S.y + 34}" width="72" height="25" rx="2" fill="#efe9da" stroke="var(--ink)" stroke-width="1"/>
      ${label(qx + 36, S.y + 44, 'REGISTERS', { size: 7 })}${label(qx + 36, S.y + 55, '64 KB', { size: 8, weight: 500 })}`;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++){
      lanes += `<rect x="${f(qx + 7 + c * 10)}" y="${f(S.y + 64 + r * 10)}" width="8" height="7" rx="1" fill="#fbf9f2" stroke="var(--ink-faint)" stroke-width=".6"/>`;
    }
  }
  const smBox = `<rect x="${S.x}" y="${S.y}" width="${S.w}" height="${S.h}" rx="4" fill="#ebe7da" stroke="var(--ink)" stroke-width="1.2"/>
    ${label(S.x + S.w / 2, S.y + 15, 'ONE SM, ENLARGED', { size: 8.5 })}
    ${sched}${lanes}${label(S.x + S.w / 2, S.y + 103, 'LANES', { size: 7.5, fill: 'var(--ink-soft)' })}
    <path d="M${f(pick.x)} ${f(pick.y + sh)} L${S.x} ${S.y} M${f(pick.x + sw)} ${f(pick.y + sh)} L${S.x + S.w} ${S.y}" stroke="var(--ink-soft)" stroke-width=".7" stroke-dasharray="3 3"/>
    <rect x="${f(pick.x - 1.5)}" y="${f(pick.y - 1.5)}" width="${f(sw + 3)}" height="${f(sh + 3)}" fill="none" stroke="var(--ink)" stroke-width="1.5"/>`;
  const l1 = `<rect x="${S.x + 10}" y="${S.y + 112}" width="${S.w - 20}" height="26" rx="2" fill="#e6dcc0" stroke="var(--ink)" stroke-width="1"/>
    ${label(S.x + S.w / 2, S.y + 129, 'L1 CACHE + SHARED MEMORY · 256 KB', { size: 8 })}`;

  /* the ladder */
  // Course restructure (2026-10-25): each rung's number is a black badge like the rings map's
  // (4.3 card 6), so the learner reads HBM as ring 4 and shared memory as part of ring 2.
  const L = { x: 410, w: 290, y: 84, h: 80, gap: 8 };
  const rung = (i, k, name, size, where) => {
    const y = L.y + i * (L.h + L.gap);
    return `<g data-k="${k}"><rect x="${L.x}" y="${y}" width="${L.w}" height="${L.h}" rx="4" fill="var(--paper-high)" stroke="var(--hairline-strong)" stroke-width="1.1"/>
      <circle cx="${L.x + 19}" cy="${y + 18.5}" r="9" fill="var(--ink)"/>
      <text x="${L.x + 19}" y="${y + 22}" class="lbl" font-size="9" style="fill:var(--paper-high);letter-spacing:0">${i + 1}</text>
      ${label(L.x + 34, y + 22, name, { anchor: 'start', size: 9.5, cls: 'lbl-strong' })}
      <text x="${L.x + 34}" y="${y + 54}" class="gate-lbl" font-size="22" text-anchor="start" style="font-size:22px;text-anchor:start">${size}</text>
      ${label(L.x + 34, y + 70, where, { anchor: 'start', size: 8, fill: 'var(--ink-soft)' })}</g>`;
  };
  const ladder = rung(0, 'reg', 'REGISTERS', '256 KB', 'IN EACH SM, BESIDE THE LANES')
    + rung(1, 'l1', 'L1 CACHE + SHARED MEMORY', '256 KB', 'IN EACH SM')
    + rung(2, 'l2', 'L2 CACHE', '50 MB', 'MIDDLE OF THE DIE, SHARED BY ALL SMs')
    + rung(3, 'hbm', 'HBM3 MEMORY', '80 GB', 'IN STACKS BESIDE THE DIE');

  return `<defs>${dieGrad('a4DieB')}</defs>
    ${label(210, 66, 'THE H100 PACKAGE, FROM ABOVE', { size: 9 })}
    ${label(555, 66, 'RINGS 1 TO 4, NEAREST THE LANES FIRST', { size: 9 })}
    <g data-k="pkg">${pkg}</g>
    <g data-k="hbm">${stacks}${label(300, 243, 'HBM3 STACKS', { size: 7.5 })}${label(120, 243, 'HBM3 STACKS', { size: 7.5 })}</g>
    <g data-k="l2">${l2}${label(die.x + die.w / 2, die.y + 6 + 6 * 9.1 + 9.6, 'L2 CACHE', { size: 7.5 })}</g>
    <g data-k="sm">${smBox}</g>
    <g data-k="reg">${regs}</g>
    <g data-k="l1">${l1}</g>
    ${ladder}`;
}

/* ================================================================ 4.4 weights
   Top: a matrix of weights cut into tiles, two tiles copied into shared memory, used by
   the lanes. Bottom: the tiled loop, and a batch. */
export function labTiling(){
  /* REVIEW_NOTES N-107: both matrices on the left, each cut into 8 × 8 tiles of 128 × 128
     numbers; one tile of each is copied into the shared memory of one SM, and that SM's
     Tensor Cores multiply them. No code, no batch. */
  const T = 15, N = 8, MX = 40;
  const mat = (y, name, sub, hi) => {
    let g = '';
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++){
      const on = r === hi[0] && c === hi[1];
      g += `<rect x="${MX + c * T}" y="${y + r * T}" width="${T}" height="${T}" fill="${on ? '#e3ddca' : '#fbf9f2'}" stroke="${on ? 'var(--ink)' : 'var(--ink-faint)'}" stroke-width="${on ? 1.6 : .6}"/>`;
    }
    return `${label(MX + 60, y - 10, name, { size: 8.5 })}${g}
      <rect x="${MX}" y="${y}" width="${N * T}" height="${N * T}" fill="none" stroke="var(--ink)" stroke-width="1.2"/>
      ${label(MX + 60, y + N * T + 14, sub, { size: 7.5, fill: 'var(--ink-soft)' })}`;
  };
  const DY = 108, WY = 302;
  const DH = [2, 5], WH = [5, 1];                      // the copied tile of each
  const matrix = `${mat(DY, 'DATA · 1,024 × 1,024', 'ONE ROW PER INPUT', DH)}
    ${mat(WY, 'WEIGHTS · 1,024 × 1,024', 'ABOUT A MILLION WEIGHTS', WH)}
    ${label(MX + 60, 263, 'EACH SQUARE IS A TILE', { size: 7, fill: 'var(--ink)' })}`;

  const fine = (x, y, s, name, kb) => {
    let g = '';
    for (let i = 1; i < 8; i++){
      g += `<line x1="${f(x + i * s / 8)}" y1="${y}" x2="${f(x + i * s / 8)}" y2="${y + s}" stroke="var(--ink-faint)" stroke-width=".5"/>
        <line x1="${x}" y1="${f(y + i * s / 8)}" x2="${x + s}" y2="${f(y + i * s / 8)}" stroke="var(--ink-faint)" stroke-width=".5"/>`;
    }
    return `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="#e3ddca" stroke="var(--ink)" stroke-width="1.2"/>${g}
      ${label(x + s / 2, y + s + 14, name, { size: 8 })}${label(x + s / 2, y + s + 26, kb, { size: 8, fill: 'var(--ink-soft)' })}`;
  };
  const arrow = (x1, y1, x2, y2) => {
    const a = Math.atan2(y2 - y1, x2 - x1), hx = x2 - 8 * Math.cos(a), hy = y2 - 8 * Math.sin(a);
    const px = 4.5 * Math.sin(a), py = -4.5 * Math.cos(a);
    return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(hx)}" y2="${f(hy)}" stroke="var(--ink)" stroke-width="1.3"/>
      <path d="M${f(x2)} ${f(y2)} L${f(hx + px)} ${f(hy + py)} L${f(hx - px)} ${f(hy - py)} Z" fill="var(--ink)"/>`;
  };
  const S = { x: 248, y: 84, w: 176, h: 372 }, TS = 70, TX = S.x + 53;
  const smem = `<rect x="${S.x}" y="${S.y}" width="${S.w}" height="${S.h}" rx="5" fill="#ebe7da" stroke="var(--ink)" stroke-width="1.2"/>
    ${label(S.x + S.w / 2, S.y + 18, 'SHARED MEMORY, IN ONE SM', { size: 8 })}
    ${fine(TX, DY + 18, TS, 'DATA TILE', '32 KB')}${fine(TX, WY + 18, TS, 'WEIGHT TILE', '32 KB')}
    ${arrow(MX + DH[1] * T + T, DY + DH[0] * T + T / 2, TX - 3, DY + 18 + TS / 2)}
    ${arrow(MX + WH[1] * T + T, WY + WH[0] * T + T / 2, TX - 3, WY + 18 + TS / 2)}`;

  const MY = S.y + S.h / 2;
  const work = `${arrow(S.x + S.w + 6, MY, 500, MY)}
    ${tensorCoreIcon(512, MY - 64, 58)}${tensorCoreIcon(580, MY - 64, 58)}${tensorCoreIcon(512, MY + 6, 58)}${tensorCoreIcon(580, MY + 6, 58)}
    ${label(575, MY - 78, 'THE SAME SM\'S TENSOR CORES', { size: 8 })}`;
  const reuse = `${label(575, MY + 92, 'EACH NUMBER COPIED IN', { size: 8, weight: 500 })}
    ${label(575, MY + 106, 'IS USED 128 TIMES', { size: 8, weight: 500 })}`;

  return `<g data-k="matrix">${matrix}</g>
    <g data-k="smem">${smem}</g>
    <g data-k="work">${work}</g>
    <g data-k="reuse">${reuse}</g>`;
}

/* ================================================================ 4.5 feed
   Left: a cut through the package, heights stretched: the GPU die and one HBM stack (a base
   die under eight DRAM dies, copper through-silicon vias) on a silicon interposer, on the
   package substrate. Right: the memory lines of the H100 SXM spec sheet. */
export function labHbm(){
  const CU = '#b4703a';
  const sub = `<rect x="30" y="372" width="410" height="24" rx="2" fill="#5d6a4c" stroke="#3f4934" stroke-width="1"/>
    ${label(235, 388, 'PACKAGE SUBSTRATE', { size: 8, fill: '#e9e4d3' })}
    ${Array.from({ length: 20 }, (_, i) => `<circle cx="${42 + i * 20.5}" cy="402" r="5" fill="#c9c9c0" stroke="#8e8f86" stroke-width=".8"/>`).join('')}`;
  const bumps = (x1, x2, y, step, r) => Array.from({ length: Math.floor((x2 - x1) / step) + 1 },
    (_, i) => `<circle cx="${f(x1 + i * step)}" cy="${y}" r="${r}" fill="#c9c9c0" stroke="#8e8f86" stroke-width=".5"/>`).join('');
  const inter = `${bumps(56, 414, 368, 9, 2.2)}
    <rect x="48" y="344" width="374" height="20" rx="1.5" fill="url(#a4DieC)" stroke="var(--ink-soft)" stroke-width="1"/>
    ${[0, 1, 2, 3].map(i => `<path d="M${200 + i * 6} 342 V${348 + i * 3.2} H${262 + i * 8} V342" fill="none" stroke="${CU}" stroke-width="1.2"/>`).join('')}
    ${label(110, 357, 'INTERPOSER', { size: 8 })}`;
  const gpu = `${bumps(66, 232, 341, 6, 1.6)}
    <rect x="60" y="204" width="176" height="134" rx="1.5" fill="url(#a4DieC)" stroke="var(--ink-soft)" stroke-width="1"/>
    ${label(148, 275, 'GPU DIE', { size: 10, cls: 'lbl-strong' })}`;
  let dram = '';
  for (let i = 0; i < 8; i++){
    const y = 309 - i * 15;
    dram += `<rect x="262" y="${y}" width="132" height="12" rx="1" fill="#c3c6c1" stroke="#7d817c" stroke-width=".7"/>`;
    dram += bumps(270, 386, y + 13.5, 9.6, 1.1);
  }
  const base = `<rect x="258" y="324" width="140" height="14" rx="1" fill="#a9ada9" stroke="#6f736e" stroke-width=".8"/>${bumps(264, 392, 341, 6, 1.6)}`;
  let tsv = '';
  for (let i = 0; i < 9; i++){
    const x = 274 + i * 13.5;
    tsv += `<line x1="${f(x)}" y1="204" x2="${f(x)}" y2="330" stroke="${CU}" stroke-width="1.6"/>`;
  }
  const stackLabels = `${label(328, 194, '8 DRAM DIES', { size: 8.5 })}
    ${callout(396, 331, 410, 300, 'BASE DIE', { anchor: 'start', size: 8 })}`;
  const tsvLabel = callout(287.5, 234, 236, 166, 'THROUGH-SILICON VIAS', { anchor: 'middle', size: 8 });

  /* the spec sheet */
  const SX = 470, SY = 96, SW = 230;
  const row = (y, k, v, bold = false) => `<line x1="${SX + 12}" y1="${y - 14}" x2="${SX + SW - 12}" y2="${y - 14}" stroke="var(--hairline)" stroke-width="1"/>
    <text x="${SX + 12}" y="${y}" font-size="9" style="font-family:var(--font-mono);letter-spacing:0;${INK}${bold ? ';font-weight:600' : ''}">${esc(k)}</text>
    <text x="${SX + SW - 12}" y="${y}" font-size="9.5" text-anchor="end" style="font-family:var(--font-mono);letter-spacing:0;${INK}${bold ? ';font-weight:600' : ''}">${esc(v)}</text>`;
  const spec = `<rect x="${SX}" y="${SY}" width="${SW}" height="190" rx="2" fill="#fdfcf7" stroke="var(--hairline-strong)" stroke-width="1"/>
    <text x="${SX + 12}" y="${SY + 24}" font-size="12" style="font-family:var(--font-mono);letter-spacing:0;${INK};font-weight:600">H100 SXM</text>
    <text x="${SX + 12}" y="${SY + 40}" font-size="8.5" style="font-family:var(--font-mono);letter-spacing:0;fill:var(--ink-soft)">Technical specifications (excerpt)</text>
    ${row(SY + 72, 'GPU memory', '80GB')}
    ${row(SY + 100, 'GPU memory bandwidth', '3.35TB/s', true)}
    <rect x="${SX + 6}" y="${SY + 84}" width="${SW - 12}" height="24" rx="2" fill="none" stroke="var(--ink)" stroke-width="1.3"/>
    ${row(SY + 132, 'Max thermal design', '')}
    <text x="${SX + 12}" y="${SY + 144}" font-size="9" style="font-family:var(--font-mono);letter-spacing:0;${INK}">power (TDP)</text>
    <text x="${SX + SW - 12}" y="${SY + 132}" font-size="9.5" text-anchor="end" style="font-family:var(--font-mono);letter-spacing:0;${INK}">Up to 700W</text>
    ${row(SY + 172, 'Form factor', 'SXM')}`;

  return `<defs>${dieGrad('a4DieC')}</defs>
    ${label(235, 66, 'ONE HBM STACK BESIDE THE GPU DIE, CUT THROUGH', { size: 9 })}
    ${label(585, 66, 'FROM THE SPEC SHEET', { size: 9 })}
    <g data-k="base">${sub}${gpu}</g>
    <g data-k="interposer">${inter}</g>
    <g data-k="stack">${base}${dram}${stackLabels}</g>
    <g data-k="tsv">${tsv}${tsvLabel}</g>
    ${label(235, 430, 'HEIGHTS STRETCHED, NOT TO SCALE', { size: 8, fill: 'var(--ink-soft)' })}
    <g data-k="spec">${spec}</g>`;
}

/* ================================================================ 4.6 gpu (panel A)
   A graphics card from above with its cooler lifted off: the GPU in the middle, 12 memory
   chips round it, power stages to the right, the slot connector along the bottom. Drawn
   generically, no maker's marks. */
export function labGraphicsCard(){
  const fan = (cx, cy, r) => {
    let blades = '';
    for (let i = 0; i < 9; i++){
      const a = i * 40;
      blades += `<path d="M0 ${-r * .26} C ${r * .35} ${-r * .45}, ${r * .55} ${-r * .7}, ${r * .32} ${-r * .93} C ${r * .05} ${-r * .8}, ${-r * .08} ${-r * .55}, 0 ${-r * .26} Z" fill="#4a4d45" stroke="#2a2c27" stroke-width=".6" transform="rotate(${a})"/>`;
    }
    return `<g transform="translate(${cx} ${cy})"><circle r="${r}" fill="#26282300" stroke="#55594d" stroke-width="1.4"/>
      <circle r="${r - 3}" fill="#2b2d28"/>${blades}<circle r="${r * .26}" fill="#3a3d35" stroke="#55594d" stroke-width="1"/></g>`;
  };
  let fins = '';
  for (let x = 226; x <= 356; x += 6) fins += `<line x1="${x}" y1="84" x2="${x}" y2="164" stroke="#9fa198" stroke-width="2.2"/>`;
  const cooler = `<rect x="60" y="78" width="460" height="92" rx="10" fill="#3b3e37" stroke="#25271f" stroke-width="1.2"/>
    <rect x="220" y="82" width="142" height="84" rx="2" fill="#6c6f66"/>${fins}
    ${fan(146, 124, 40)}${fan(434, 124, 40)}
    ${label(536, 120, 'COOLER, LIFTED OFF', { anchor: 'start', size: 8.5 })}
    ${label(536, 134, 'FINS AND TWO FANS', { anchor: 'start', size: 8, fill: 'var(--ink-soft)' })}
    ${[150, 430].map(x => `<path d="M${x} 174 V194" stroke="var(--ink-soft)" stroke-width="1" stroke-dasharray="3 3"/><path d="M${x} 197 l-4 -7 h8 z" fill="var(--ink-soft)"/>`).join('')}`;

  const pcb = `<rect x="42" y="196" width="18" height="222" rx="1" fill="url(#a4Metal)" stroke="#8e8f86" stroke-width="1"/>
    ${[0, 1, 2, 3].map(i => `<rect x="46" y="${224 + i * 44}" width="10" height="26" rx="1.5" fill="#2f322b"/>`).join('')}
    <rect x="60" y="200" width="460" height="200" rx="4" fill="#2f4a3a" stroke="#1f3328" stroke-width="1.2"/>
    ${Array.from({ length: 22 }, (_, i) => `<rect x="${152 + i * 12}" y="400" width="8" height="15" rx="1" fill="#c9a54a" stroke="#9c7f35" stroke-width=".5"/>`).join('')}
    ${label(286, 432, 'SLOT CONNECTOR, TO THE COMPUTER', { size: 8 })}
    ${label(51, 432, 'DISPLAY', { size: 8 })}`;
  const gpu = `<rect x="200" y="244" width="120" height="120" rx="3" fill="#1e3226" stroke="#0f1d15" stroke-width="1"/>
    <rect x="216" y="260" width="88" height="88" rx="2" fill="none" stroke="#9fa198" stroke-width="3"/>
    <rect x="228" y="272" width="64" height="64" rx="1.5" fill="url(#a4DieD)" stroke="#6f736e" stroke-width="1"/>
    ${label(260, 308, 'GPU', { size: 10, cls: 'lbl-strong' })}`;
  let mem = '';
  [0, 1, 2, 3].forEach(i => {
    mem += `<rect x="${f(201 + i * 30)}" y="214" width="26" height="20" rx="1.5" fill="#1b1d18" stroke="#55594d" stroke-width=".8"/>`;
    mem += `<rect x="${f(201 + i * 30)}" y="374" width="26" height="20" rx="1.5" fill="#1b1d18" stroke="#55594d" stroke-width=".8"/>`;
  });
  [262, 314].forEach(y => {
    mem += `<rect x="172" y="${y}" width="20" height="26" rx="1.5" fill="#1b1d18" stroke="#55594d" stroke-width=".8"/>`;
    mem += `<rect x="328" y="${y}" width="20" height="26" rx="1.5" fill="#1b1d18" stroke="#55594d" stroke-width=".8"/>`;
  });
  mem += label(260, 192, '12 MEMORY CHIPS', { size: 8.5 });
  let power = '';
  for (let r = 0; r < 6; r++){
    const y = 222 + r * 26;
    power += `<rect x="394" y="${y}" width="16" height="16" rx="1.5" fill="#1b1d18" stroke="#55594d" stroke-width=".8"/>
      <rect x="418" y="${y - 2}" width="20" height="20" rx="2" fill="#7c7f77" stroke="#4a4d45" stroke-width=".8"/>
      <rect x="448" y="${y}" width="16" height="16" rx="1.5" fill="#1b1d18" stroke="#55594d" stroke-width=".8"/>
      <rect x="472" y="${y - 2}" width="20" height="20" rx="2" fill="#7c7f77" stroke="#4a4d45" stroke-width=".8"/>`;
  }
  power += `<rect x="470" y="190" width="40" height="12" rx="1.5" fill="#1b1d18" stroke="#55594d" stroke-width=".8"/>
    ${label(516, 199, 'POWER IN, 12 V', { anchor: 'start', size: 8 })}
    ${callout(492, 360, 536, 380, 'POWER STAGES', { anchor: 'start', size: 8.5 })}`;
  return `<defs>${dieGrad('a4DieD')}<linearGradient id="a4Metal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e3e4e0"/><stop offset=".5" stop-color="#bfc2bc"/><stop offset="1" stop-color="#d6d8d3"/></linearGradient></defs>
    ${label(290, 62, 'A GRAPHICS CARD, OPENED UP', { size: 9 })}
    <g data-k="cooler">${cooler}</g>
    <g data-k="board">${pcb}</g>
    <g data-k="power">${power}</g>
    <g data-k="mem">${mem}</g>
    <g data-k="gpu">${gpu}</g>`;
}

/* ================================================================ 4.6 gpu (panel B)
   Top: nvidia-smi on an H100 server (a real readout, ICC's HGX H100 benchmarks). Bottom: a
   Jetson-style developer kit, drawn generically. */
export function labServerAndKit(){
  const A = 'fill:var(--amber)';
  const t = terminal({ x: 30, y: 74, w: 660, fs: 9.4, title: 'A DATA-CENTRE SERVER', lines: [
    [['$ ', 'fill:#9c9e8f'], ['nvidia-smi']],
    '+---------------------------------------------------------------------------------------+',
    '| NVIDIA-SMI 530.30.02              Driver Version: 530.30.02        CUDA Version: 12.1 |',
    '| GPU  Name                  Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |',
    '| Fan  Temp  Perf            Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |',
    '|=========================================+======================+======================|',
    '|   0  NVIDIA H100 80GB HBM3           On | 00000000:1B:00.0 Off |                    0 |',
    [['| N/A   64C    P0              '], ['511W / 700W', A], ['|  18420MiB / 81559MiB |     90%      Default |']],
    '+-----------------------------------------+----------------------+----------------------+',
  ] });
  const [px, py] = t.col(30, 7);
  // Course restructure (2026-10-25): the limit is named TDP on the step 6 card, so here too
  const smi = `${t.svg}${callout(px + 33, py + 5, px + 33, 234, 'POWER BEING USED / THE LIMIT (TDP)', { anchor: 'middle', size: 8 })}`;

  /* the developer kit, from above */
  const B = { x: 70, y: 278, w: 236, h: 186 };
  let header = '';
  for (let i = 0; i < 20; i++) for (let j = 0; j < 2; j++){
    header += `<rect x="${B.x + 22 + i * 9}" y="${B.y + 8 + j * 8}" width="5" height="5" fill="#c9a54a" stroke="#9c7f35" stroke-width=".4"/>`;
  }
  let fins = '';
  for (let x = B.x + 34; x <= B.x + 150; x += 6) fins += `<line x1="${x}" y1="${B.y + 36}" x2="${x}" y2="${B.y + 130}" stroke="#4a4d45" stroke-width="2"/>`;
  const fanR = 34, fcx = B.x + 92, fcy = B.y + 83;
  let blades = '';
  for (let i = 0; i < 7; i++) blades += `<path d="M0 -8 C 12 -14, 20 -24, 12 -${fanR - 3} C 2 -28, -4 -20, 0 -8 Z" fill="#3a3d35" transform="rotate(${i * 51.4})"/>`;
  const ports = `<rect x="${B.x + 10}" y="${B.y + B.h - 26}" width="34" height="30" rx="1.5" fill="url(#a4MetalB)" stroke="#8e8f86"/>
    <rect x="${B.x + 50}" y="${B.y + B.h - 26}" width="34" height="30" rx="1.5" fill="url(#a4MetalB)" stroke="#8e8f86"/>
    <rect x="${B.x + 92}" y="${B.y + B.h - 28}" width="34" height="32" rx="1.5" fill="url(#a4MetalB)" stroke="#8e8f86"/>
    <rect x="${B.x + 134}" y="${B.y + B.h - 18}" width="26" height="22" rx="1.5" fill="url(#a4MetalB)" stroke="#8e8f86"/>
    <rect x="${B.x + 168}" y="${B.y + B.h - 14}" width="16" height="18" rx="3" fill="url(#a4MetalB)" stroke="#8e8f86"/>
    <rect x="${B.x + 196}" y="${B.y + B.h - 22}" width="26" height="26" rx="2" fill="#1b1d18" stroke="#55594d"/>`;
  const kit = `<rect x="${B.x}" y="${B.y}" width="${B.w}" height="${B.h}" rx="6" fill="#26302a" stroke="#141b16" stroke-width="1.2"/>
    ${[[8, 8], [B.w - 8, 8], [8, B.h - 40], [B.w - 8, B.h - 40]].map(([x, y]) => `<circle cx="${B.x + x}" cy="${B.y + y}" r="3.2" fill="#c9c9c0"/>`).join('')}
    ${header}
    <rect x="${B.x + 28}" y="${B.y + 32}" width="130" height="102" rx="3" fill="#2b2d28" stroke="#141511" stroke-width="1"/>${fins}
    <g transform="translate(${fcx} ${fcy})"><circle r="${fanR}" fill="#1f211c" stroke="#55594d" stroke-width="1.2"/>${blades}<circle r="8" fill="#3a3d35" stroke="#55594d"/></g>
    ${ports}
    ${callout(B.x + 110, B.y + 12, 360, B.y + 12, '40-PIN HEADER, FOR SENSORS', { anchor: 'start', size: 8 })}
    ${callout(B.x + 158, B.y + 70, 360, B.y + 64, 'GPU MODULE, UNDER THE FAN', { anchor: 'start', size: 8 })}
    ${callout(B.x + 222, B.y + B.h - 10, 360, B.y + B.h - 22, 'USB, NETWORK, DISPLAY, POWER', { anchor: 'start', size: 8 })}
    ${label(360, B.y + 102, '1,024 LANES · 32 TENSOR CORES', { anchor: 'start', size: 9, weight: 500 })}
    ${label(360, B.y + 118, '8 GB MEMORY · 7 TO 25 WATTS', { anchor: 'start', size: 9, weight: 500 })}
    ${label(360, B.y + 134, 'ABOUT 10 CM ACROSS', { anchor: 'start', size: 8, fill: 'var(--ink-soft)' })}`;
  return `<defs><linearGradient id="a4MetalB" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e3e4e0"/><stop offset=".5" stop-color="#bfc2bc"/><stop offset="1" stop-color="#d6d8d3"/></linearGradient></defs>
    <g data-k="smi">${smi}</g>
    <g data-k="kit">${label(188, 270, 'ON A DESK: AN AI DEVELOPER KIT', { size: 9 })}${kit}</g>`;
}

/* ================================================================ 4.4 one SM, all named
   Act 4 restructure (Ripu, 2026-10-24): one H100 SM drawn with the act's two pictures, so the
   learner sees lanes and Tensor Cores side by side where they really sit. Four groups (NVIDIA's
   "processing blocks"), each: a scheduler, a register file, 32 lanes, one Tensor Core
   (NVIDIA, "Hopper Architecture In-Depth": 4 fourth-generation Tensor Cores and 128 FP32
   lanes per SM). Lanes are drawn small, so their chips carry no text; the legend shows both
   pictures at full size. */
export function labSM(){
  const G = { w: 268, h: 150 }, X0 = 40, Y0 = 92, GX = 288, GY = 168;
  let groups = '';
  for (let k = 0; k < 4; k++){
    const x = X0 + (k % 2) * GX, y = Y0 + Math.floor(k / 2) * GY;
    let lanes = '';
    for (let i = 0; i < 32; i++) lanes += laneIcon(x + 12 + (i % 8) * 20, y + 44 + Math.floor(i / 8) * 20, 16);
    groups += `<rect x="${x}" y="${y}" width="${G.w}" height="${G.h}" rx="6" fill="#f7f3e8" stroke="var(--ink-soft)" stroke-width="1"/>
      <rect x="${x + 10}" y="${y + 10}" width="${G.w - 20}" height="12" rx="2" fill="#e6e1d2"/>
      ${label(x + G.w / 2, y + 19.5, 'SCHEDULER', { size: 7 })}
      <rect x="${x + 10}" y="${y + 26}" width="${G.w - 20}" height="12" rx="2" fill="#e6e1d2"/>
      ${label(x + G.w / 2, y + 35.5, 'REGISTER FILE', { size: 7 })}
      ${lanes}
      ${label(x + 92, y + 136, '32 LANES', { size: 7.5 })}
      ${tensorCoreIcon(x + 186, y + 50, 70)}
      ${label(x + 221, y + 136, '1 TENSOR CORE', { size: 7.5 })}`;
  }
  return `${label(360, 70, "ONE SM OF NVIDIA'S H100: FOUR GROUPS", { size: 9 })}
    ${groups}
    ${laneIcon(150, 432, 34)}${label(192, 446, 'LANE = ONE MAC UNIT', { anchor: 'start', size: 8 })}
    ${tensorCoreIcon(392, 430, 38)}${label(438, 446, 'TENSOR CORE = A BLOCK OF MAC UNITS', { anchor: 'start', size: 8 })}
    ${/* Course restructure (2026-10-25): each part's rate on the whole H100, hidden until the
         card that names it calls focus(). NVIDIA H100 SXM datasheet: FP32 67 TFLOPS on the
         lanes; FP16/BF16 Tensor Core 989 TFLOPS dense (1,979 is the figure with sparsity). */ ''}
    <g data-k="rates" style="opacity:0">
      ${label(192, 460, 'WHOLE H100: ABOUT 67 TFLOPS', { anchor: 'start', size: 7.5 })}
      ${label(192, 471, 'WITH 32-BIT NUMBERS', { anchor: 'start', size: 7, fill: 'var(--ink-soft)' })}
      ${label(438, 460, 'WHOLE H100: ABOUT 990 TFLOPS', { anchor: 'start', size: 7.5 })}
      ${label(438, 471, 'WITH 16-BIT NUMBERS', { anchor: 'start', size: 7, fill: 'var(--ink-soft)' })}
    </g>`;
}

/* ================================================================ 4.4 three chips
   Act 4 restructure (2026-10-25): a CPU, a GPU and a TPU side by side, each drawn by what
   fills it, so how specialised each one is shows from the picture. Simplified floor plans,
   not to scale.
   - CPU: AMD Ryzen 9 9950X, 16 cores (AMD). Each core drawn as a control unit and an adder.
   - GPU: NVIDIA H100 SXM, 132 SMs, 16,896 lanes, 4 Tensor Cores per SM = 528 (NVIDIA,
     "Hopper Architecture In Depth"). 49 SM tiles are drawn.
   - TPU: Google's first TPU (in use from 2015): one 256 × 256 systolic array of 8-bit MAC
     units (65,536), a 24 MiB unified buffer, accumulators; control is 2% of the die (Jouppi
     et al., "In-Datacenter Performance Analysis of a Tensor Processing Unit", 2017). */
export function labChips(){
  const Y = 100, S = 196;
  const die = x => `<rect x="${x}" y="${Y}" width="${S}" height="${S}" rx="4" fill="#f7f3e8" stroke="var(--ink)" stroke-width="1.4"/>`;
  const foot = (cx, name, a, b, c = '') => `${label(cx, Y + S + 24, name, { cls: 'lbl-strong', size: 9.5 })}
    ${label(cx, Y + S + 42, a, { size: 8 })}${label(cx, Y + S + 56, b, { size: 7.5, fill: 'var(--ink-soft)' })}
    ${c ? label(cx, Y + S + 70, c, { size: 7.5, fill: 'var(--ink-soft)' }) : ''}`;

  /* CPU: 16 cores, each mostly control unit */
  const CX = 32;
  let cores = '';
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++){
    const x = CX + 8 + c * 46, y = Y + 8 + r * 46;
    cores += `<rect x="${x}" y="${y}" width="42" height="42" rx="2" fill="var(--paper)" stroke="var(--ink-soft)" stroke-width=".8"/>
      <rect x="${x + 4}" y="${y + 4}" width="34" height="22" rx="1.5" fill="var(--ink)"/>
      <rect x="${x + 4}" y="${y + 29}" width="11" height="9" rx="1" fill="var(--paper-high)" stroke="var(--ink-soft)" stroke-width=".7"/>`;
  }
  const cpu = `<g data-k="cpu">${die(CX)}${cores}
    ${foot(CX + S / 2, 'CPU · AMD RYZEN 9 9950X', '16 CORES', 'EACH WITH ITS OWN CONTROL UNIT')}</g>`;

  /* GPU: SMs, each a scheduler strip, a few lanes and a Tensor Core */
  const GX = 262;
  let sms = '';
  for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++){
    const x = GX + 7 + c * 26.4, y = Y + 7 + r * 26.4;
    let ln = '';
    for (let i = 0; i < 8; i++) ln += `<rect x="${f(x + 2.5 + (i % 4) * 3.6)}" y="${f(y + 6 + Math.floor(i / 4) * 4.4)}" width="2.6" height="2.6" fill="var(--ink-faint)"/>`;
    sms += `<rect x="${f(x)}" y="${f(y)}" width="23" height="23" rx="1.5" fill="var(--paper)" stroke="var(--ink-soft)" stroke-width=".6"/>
      <rect x="${f(x + 2)}" y="${f(y + 2)}" width="19" height="2.4" fill="var(--ink)"/>${ln}
      <rect x="${f(x + 2.5)}" y="${f(y + 15)}" width="18" height="6" rx=".8" fill="#e3ddca" stroke="var(--ink)" stroke-width=".5"/>`;
  }
  const gpu = `<g data-k="gpu">${die(GX)}${sms}
    ${foot(GX + S / 2, 'GPU · NVIDIA H100', '132 SMs · 16,896 LANES', '528 TENSOR CORES')}</g>`;

  /* TPU: one big systolic array, the memory that feeds it, and a sliver of control */
  const TX = 492;
  let dots = '';
  for (let r = 0; r < 14; r++) for (let c = 0; c < 14; c++) dots += `<circle cx="${f(TX + 13 + c * 7.6)}" cy="${f(Y + 64 + r * 7.6)}" r="2.2" fill="var(--ink)"/>`;
  const tpu = `<g data-k="tpu">${die(TX)}
    <rect x="${TX + 6}" y="${Y + 6}" width="${S - 12}" height="46" rx="2" fill="#e6dcc0" stroke="var(--ink)" stroke-width=".9"/>
    ${label(TX + S / 2, Y + 27, 'UNIFIED BUFFER', { size: 7.5 })}${label(TX + S / 2, Y + 40, '24 MB OF DATA', { size: 7, fill: 'var(--ink-soft)' })}
    <rect x="${TX + 6}" y="${Y + 57}" width="112" height="112" rx="2" fill="#e3ddca" stroke="var(--ink)" stroke-width="1.2"/>${dots}
    <rect x="${TX + 124}" y="${Y + 57}" width="66" height="80" rx="2" fill="var(--paper)" stroke="var(--ink-soft)" stroke-width=".8"/>
    ${label(TX + 157, Y + 94, 'ACCUMU-', { size: 6.5 })}${label(TX + 157, Y + 104, 'LATORS', { size: 6.5 })}
    <rect x="${TX + 124}" y="${Y + 143}" width="66" height="6" rx="1" fill="var(--ink)"/>
    ${label(TX + 157, Y + 161, 'CONTROL', { size: 6.5 })}
    <rect x="${TX + 6}" y="${Y + 175}" width="${S - 12}" height="15" rx="2" fill="none" stroke="var(--ink-faint)" stroke-width=".8" stroke-dasharray="3 2"/>
    ${label(TX + S / 2, Y + 186, 'MEMORY AND I/O PORTS', { size: 6.5, fill: 'var(--ink-soft)' })}
    ${foot(TX + S / 2, 'TPU · GOOGLE, 2015', 'ONE 256 × 256 SYSTOLIC ARRAY', '65,536 MAC UNITS', 'CONTROL: 2% OF THE DIE')}</g>`;

  return `${label(360, 70, 'THREE CHIPS, EACH DRAWN BY WHAT FILLS IT', { size: 9 })}
    ${cpu}${gpu}${tpu}
    ${label(360, 466, 'SIMPLIFIED FLOOR PLANS, NOT TO SCALE', { size: 7.5, fill: 'var(--ink-faint)' })}`;
}

/* ================================================================ 4.5 memory compared
   REVIEW_NOTES N-108: why a GPU needs HBM, against a desktop CPU's main memory, and where
   memory is heading. Top: a desktop board (CPU and two DDR5 sticks, 128 data wires across
   the board) beside the H100 package (die and HBM stacks side by side on the interposer,
   5 × 1,024 = 5,120 data wires). Bottom: memory bandwidth on one scale.
   - Desktop: dual-channel DDR5-5600, 2 × 64 bits × 5,600 million transfers/s ÷ 8 = 89.6 GB/s.
   - H100 SXM: 5 HBM3 stacks in use, 5,120-bit bus, 3.35 TB/s (NVIDIA datasheet).
   - B200: HBM3e, 8 TB/s (NVIDIA DGX B200 datasheet).
   - Rubin: HBM4 (2,048 data wires a stack, JEDEC JESD270-4, 2025), 288 GB and about
     22 TB/s a GPU as announced by NVIDIA for 2026; secondary sources, checked 2026-10-25. */
export function labMemCompare(){
  /* the desktop board */
  let pins = '';
  for (let i = 0; i < 9; i++) pins += `<line x1="160" y1="${f(140 + i * 7.5)}" x2="222" y2="${f(122 + i * 3)}" stroke="#b4703a" stroke-width=".8"/>
    <line x1="160" y1="${f(140 + i * 7.5)}" x2="262" y2="${f(184 + i * 3)}" stroke="#b4703a" stroke-width=".8"/>`;
  const stick = (x, y) => {
    let chips = '';
    for (let i = 0; i < 4; i++) chips += `<rect x="${x + 4}" y="${y + 6 + i * 15}" width="12" height="11" rx="1" fill="#2f322b"/>`;
    return `<rect x="${x}" y="${y}" width="20" height="70" rx="2" fill="#5d6a4c" stroke="#3f4934" stroke-width="1"/>${chips}`;
  };
  const cpu = `<g data-k="cpu">
    <rect x="40" y="92" width="290" height="160" rx="4" fill="rgba(92,107,69,.22)" stroke="var(--green)" stroke-width="1.1"/>
    ${label(185, 84, 'A DESKTOP: CPU AND MEMORY STICKS', { size: 8.5 })}
    <rect x="72" y="126" width="88" height="88" rx="3" fill="url(#ppLidM)" stroke="#8e8f86" stroke-width="1"/>
    ${label(116, 174, 'CPU', { size: 10, cls: 'lbl-strong' })}
    ${pins}${stick(222, 108)}${stick(262, 170)}
    ${label(292, 104, 'DDR5', { size: 7.5, anchor: 'start' })}
    ${label(185, 272, '2 STICKS · 128 DATA WIRES', { size: 8 })}
    ${label(185, 287, 'ACROSS THE CIRCUIT BOARD', { size: 7.5, fill: 'var(--ink-soft)' })}</g>`;

  /* the H100 package */
  let fine = '';
  for (let i = 0; i < 6; i++){
    const y = 122 + (i % 3) * 40;
    for (let k = 0; k < 6; k++){
      const yy = y + 6 + k * 4;
      fine += i < 3 ? `<line x1="478" y1="${yy}" x2="492" y2="${yy}" stroke="#b4703a" stroke-width=".6"/>`
        : `<line x1="586" y1="${yy}" x2="600" y2="${yy}" stroke="#b4703a" stroke-width=".6"/>`;
    }
  }
  const hbm = (x, y, on) => `<rect x="${x}" y="${y}" width="36" height="34" rx="2" fill="${on ? '#2f322b' : 'none'}" stroke="${on ? '#55594d' : 'var(--ink-faint)'}" stroke-width="1" ${on ? '' : 'stroke-dasharray="3 2"'}/>`;
  const gpu = `<g data-k="gpu">
    <rect x="390" y="92" width="290" height="160" rx="4" fill="rgba(92,107,69,.22)" stroke="var(--green)" stroke-width="1.1"/>
    ${label(535, 84, 'THE H100: DIE AND HBM IN ONE PACKAGE', { size: 8.5 })}
    <rect x="432" y="112" width="206" height="124" rx="2" fill="rgba(29,33,23,.07)" stroke="var(--ink-faint)" stroke-width=".7"/>
    <rect x="492" y="120" width="94" height="108" rx="1.5" fill="url(#a4DieM)" stroke="var(--ink-soft)" stroke-width="1"/>
    ${label(539, 178, 'GPU DIE', { size: 8.5, cls: 'lbl-strong' })}
    ${hbm(440, 122, true)}${hbm(440, 162, true)}${hbm(440, 202, true)}
    ${hbm(600, 122, true)}${hbm(600, 162, true)}${hbm(600, 202, false)}
    ${fine}
    ${label(535, 272, '5 HBM STACKS · 5,120 DATA WIRES', { size: 8 })}
    ${label(535, 287, 'ON THE INTERPOSER, BESIDE THE DIE', { size: 7.5, fill: 'var(--ink-soft)' })}</g>`;

  /* bandwidth, one scale */
  const BX = 250, BWID = 380, MAX = 22;
  const row = (y, name, sub, tb, txt, k) => `<g data-k="${k}">
    ${label(BX - 12, y + 9, name, { size: 8, anchor: 'end' })}${label(BX - 12, y + 21, sub, { size: 7, anchor: 'end', fill: 'var(--ink-soft)' })}
    <rect x="${BX}" y="${y}" width="${f(Math.max(1.5, BWID * tb / MAX))}" height="14" rx="2" fill="var(--ink)" opacity=".78"/>
    ${label(BX + Math.max(1.5, BWID * tb / MAX) + 8, y + 11, txt, { size: 8.5, anchor: 'start', weight: 500 })}</g>`;
  const bars = `${label(360, 318, 'MEMORY BANDWIDTH, ON ONE SCALE', { size: 8.5 })}
    ${row(332, 'DESKTOP CPU', 'DDR5, 2 STICKS', 0.0896, '0.09 TB/S', 'b-cpu')}
    ${row(364, 'H100 (2022)', 'HBM3', 3.35, '3.35 TB/S', 'b-h100')}
    ${row(396, 'B200 (2024)', 'HBM3E', 8, '8 TB/S', 'b-next')}
    ${row(428, 'RUBIN (2026)', 'HBM4, ANNOUNCED', 22, '22 TB/S', 'b-next')}`;

  return `<defs>${dieGrad('a4DieM')}<linearGradient id="ppLidM" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e4e3dc"/><stop offset="1" stop-color="#b9b8ae"/></linearGradient></defs>
    ${cpu}${gpu}${bars}`;
}

/* ================================================================ 4.6 gpu (panel C)
   Course restructure (2026-10-25): the last lab card of the act. A news headline in a plain
   box, with an arrow from each figure to the part of a simple GPU package that makes it:
   the FP4 petaflops to the Tensor Cores on the die, the HBM4 gigabytes to the memory stacks
   beside it. Drawn with the act's two pictures and its stack style (four dies with vias).
   - NVIDIA announced Rubin (GTC 2025) with 50 petaflops of FP4 and 288 GB of HBM4 a GPU.
   The headline is mono (IBM Plex Mono, 0.6 em a character, as terminal() assumes), so each
   figure's x span is computed from its character position. */
export function labHeadline(){
  const HEAD = 'NVIDIA ANNOUNCES RUBIN: 50 PETAFLOPS OF FP4, 288 GB OF HBM4';
  const FS = 14, CW = FS * 0.6, X0 = 360 - HEAD.length * CW / 2, BASE = 111;
  const span = s => { const i = HEAD.indexOf(s); return [X0 + i * CW, X0 + (i + s.length) * CW]; };
  const [f1, f2] = span('50 PETAFLOPS OF FP4'), [m1, m2] = span('288 GB OF HBM4');
  const arrow = (x1, y1, x2, y2) => {
    const a = Math.atan2(y2 - y1, x2 - x1), L = 8, W = 4;
    const bx = x2 - L * Math.cos(a), by = y2 - L * Math.sin(a);
    const px = -Math.sin(a) * W, py = Math.cos(a) * W;
    return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(bx)}" y2="${f(by)}" stroke="var(--ink)" stroke-width="1.3"/>
      <path d="M${f(x2)} ${f(y2)} L${f(bx + px)} ${f(by + py)} L${f(bx - px)} ${f(by - py)} Z" fill="var(--ink)"/>`;
  };
  const under = (a, b) => `<line x1="${f(a)}" y1="${BASE + 6}" x2="${f(b)}" y2="${BASE + 6}" stroke="var(--ink)" stroke-width="1.6"/>`;

  const head = `<rect x="70" y="80" width="580" height="50" rx="2" fill="#fdfcf7" stroke="var(--hairline-strong)" stroke-width="1.2"/>
    <text x="${f(X0)}" y="${BASE}" font-size="${FS}" style="font-family:var(--font-mono);letter-spacing:0;${INK};font-weight:600;white-space:pre">${esc(HEAD)}</text>`;

  /* the package: an interposer, the GPU die in the middle, an HBM4 stack on each side */
  const DX = 285, DY = 236, DW = 150, DH = 144, IY = 384;
  let die = `<rect x="${DX}" y="${DY}" width="${DW}" height="${DH}" rx="4" class="tile-bg"/>`;
  for (let i = 0; i < 4; i++) die += tensorCoreIcon(DX + 12 + i * 34, DY + 18, 30, 3);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) die += laneIcon(DX + 8 + c * 17, DY + 60 + r * 17, 14);
  die += label(DX + DW / 2, DY + 132, 'GPU DIE', { size: 9, cls: 'lbl-strong' });
  const stack = x => {
    let s = '';
    for (let i = 0; i < 4; i++){
      s += `<rect x="${x}" y="${302 + i * 19}" width="64" height="16" rx="2" class="tile-bg"/>`;
      if (i < 3) [16, 32, 48].forEach(vx => { s += `<line x1="${x + vx}" y1="${318 + i * 19}" x2="${x + vx}" y2="${321 + i * 19}" class="wire"/>`; });
    }
    return s + label(x + 32, 418, 'HBM4 STACK', { size: 8 });
  };
  const inter = `<rect x="150" y="${IY}" width="420" height="16" rx="3" class="tile-bg"/>${label(360, 418, 'INTERPOSER', { size: 8, fill: 'var(--ink-soft)' })}`;

  const flops = `${under(f1, f2)}${arrow((f1 + f2) / 2, BASE + 12, 380, DY + 15)}
    ${label((f1 + f2) / 2 + 10, 190, 'THE TENSOR CORES', { anchor: 'start', size: 8.5 })}`;
  const mem = `${under(m1, m2)}${arrow((m1 + m2) / 2, BASE + 12, 491, 298)}
    ${label(548, 214, 'THE HBM4 STACKS', { anchor: 'start', size: 8.5 })}`;

  return `${label(360, 62, 'A NEWS HEADLINE, READ WITH THE PARTS YOU BUILT', { size: 9 })}
    <g data-k="head">${head}</g>
    <g data-k="pkg">${inter}${stack(205)}${stack(451)}<g>${die}</g></g>
    <g data-k="flops">${flops}</g>
    <g data-k="mem">${mem}</g>
    ${label(360, 452, 'RUBIN, AS ANNOUNCED BY NVIDIA · DRAWN SIMPLY, NOT TO SCALE', { size: 7.5, fill: 'var(--ink-soft)' })}`;
}
