// BYODC engine — "What you built in this act" (N-145, N-150). The same ladder as Act 1's and Act
// 4's endings: one drawn box per step, in order, each tagged with its step, named and captioned.
// A step shows it on the last card before its Lab, then swaps the panel for the Lab's first one.
import { slideInPanel } from './components.js';

const W = 118, H = 118, Y = 150, GAP = 22;

/* rungs: [{ tag: 'STEP 2.1', name, lines: [...], art: (x, y) => svg }], where (x, y) is the box's
   top-left corner and the box is 118 square */
export function recapPanel(svg, { title, sub, rungs }){
  const X0 = (720 - (rungs.length * W + (rungs.length - 1) * GAP)) / 2;
  let html = `<text x="360" y="104" class="lbl-strong" style="font-size:11px">${title}</text>
    <text x="360" y="120" class="lbl-faint" style="font-size:8px">${sub}</text>`;
  rungs.forEach((r, i) => {
    const x = X0 + i * (W + GAP), mid = x + W / 2;
    html += `<rect x="${x}" y="${Y}" width="${W}" height="${H}" rx="5" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.3"/>
      <text x="${mid}" y="${Y - 10}" class="lbl-faint" style="font-size:8px">${r.tag}</text>
      ${r.art(x, Y)}
      <text x="${mid}" y="${Y + H + 24}" class="lbl-strong" style="font-size:10px">${r.name}</text>
      ${r.lines.map((l, k) => `<text x="${mid}" y="${Y + H + 42 + k * 14}" class="lbl-faint" style="font-size:8px">${l}</text>`).join('')}`;
    if (i < rungs.length - 1){
      const x1 = x + W + 4, x2 = x + W + GAP - 4, y = Y + H / 2;
      html += `<path d="M${x1} ${y} H${x2} M${x2 - 5} ${y - 4} L${x2} ${y} L${x2 - 5} ${y + 4}" fill="none" stroke="var(--ink-soft)" stroke-width="1.2"/>`;
    }
  });
  return slideInPanel(svg, html);
}

/* the shapes the rungs share */
const INK = 'stroke="var(--ink)" stroke-width="1.3" fill="none"';
export const nandShape = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M0 0 H16 A14 14 0 0 1 16 28 H0 Z" fill="var(--paper)" stroke="var(--ink)" stroke-width="${(1.3 / s).toFixed(2)}"/>
    <circle cx="33.5" cy="14" r="3.2" fill="var(--paper)" stroke="var(--ink)" stroke-width="${(1.2 / s).toFixed(2)}"/>
  </g>`;
export const smallText = (x, y, s, fill = 'var(--ink)') => `<text x="${x}" y="${y}" class="lbl" style="font-size:8px;fill:${fill}">${s}</text>`;
export { INK };
