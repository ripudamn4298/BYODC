// BYODC art — the two pictures Act 4 teaches by (Ripu, 2026-10-24): whenever the course says
// "lane", it shows a lane square; whenever it says "Tensor Core", it shows a Tensor Core block.
//   lane        = one MAC unit with its own two numbers: a light square holding one dark MAC chip
//   Tensor Core = a block of MAC units that multiplies two small matrices in one go: a tinted
//                 block holding a grid of the same dark chips
// Both return SVG strings placed by their top-left corner, so any panel or stage can use them.

/* one lane; at small sizes the chip carries no text */
export function laneIcon(x, y, s = 40){
  const cw = s * .7, ch = s * .38, cx = x + (s - cw) / 2, cy = y + (s - ch) / 2;
  return `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${Math.max(2, s * .1).toFixed(1)}" class="lane"/>
    <rect x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" width="${cw.toFixed(1)}" height="${ch.toFixed(1)}" rx="${Math.max(1, s * .08).toFixed(1)}" fill="var(--ink)"/>`
    + (s >= 34 ? `<text x="${x + s / 2}" y="${(cy + ch / 2 + s * .07).toFixed(1)}" class="lbl" style="fill:var(--paper-high);font-size:${(s * .2).toFixed(1)}px;letter-spacing:.06em">MAC</text>` : '');
}

/* one Tensor Core: an n by n grid of MAC chips inside one block */
export function tensorCoreIcon(x, y, s = 64, n = 4){
  const pad = s * .12, step = (s - 2 * pad) / n, chip = step * .72;
  let chips = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++){
    chips += `<rect x="${(x + pad + c * step + (step - chip) / 2).toFixed(1)}" y="${(y + pad + r * step + (step - chip) / 2).toFixed(1)}" width="${chip.toFixed(1)}" height="${chip.toFixed(1)}" rx="1" fill="var(--ink)"/>`;
  }
  return `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${(s * .1).toFixed(1)}" fill="#e3ddca" stroke="var(--ink)" stroke-width="1.4"/>${chips}`;
}
