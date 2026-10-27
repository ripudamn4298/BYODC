// BYODC engine — drawing helpers for the "how it looks in real life" slide-ins
// (HANDOFF_NEXT.md §1). The pictures are SVG strings, dropped into slideInPanel().
//
// iso(k, ox, oy) projects a simple 3D scene onto the paper: x runs down-right, y runs
// down-left, z runs up. The faces you can see are the top (+z), the +x face and the +y
// face, so draw far boxes first (smaller x + y) and near ones last.
//
// Palettes are opaque paper tints of the semantic colours (DESIGN.md §1a): N-type is blue,
// P-type is red, metal and gates are ink. Each has a top, a +x face and a +y face, lightest
// on top, so a box reads as solid without any glow.

export const PAL = {
  n:    { top: '#e1e2ec', x: '#d0d3e6', y: '#c3c8e0', stroke: 'var(--blue)' },
  p:    { top: '#f4e4d6', x: '#eed6c5', y: '#e6c9b6', stroke: 'var(--red)' },
  gate: { top: '#dcd9cc', x: '#cbc8ba', y: '#bdbaab', stroke: 'var(--ink)' },
  glass:{ top: '#efe3c4', x: '#e6d6b0', y: '#dccb9f', stroke: 'var(--amber)' },
};

export function iso(k = 1, ox = 0, oy = 0){
  const C = Math.cos(Math.PI / 6), S = 0.5;
  const P = (x, y, z) => [ox + (x - y) * C * k, oy + ((x + y) * S - z) * k];
  const pts = arr => arr.map(([x, y, z]) => P(x, y, z).map(v => v.toFixed(1)).join(',')).join(' ');
  return {
    P,
    /* a solid box from (x, y, z) to (x + dx, y + dy, z + dz) */
    box(x, y, z, dx, dy, dz, pal, { opacity = 1, sw = 1 } = {}){
      const X = x + dx, Y = y + dy, Z = z + dz;
      const face = (p, fill) => `<polygon points="${pts(p)}" fill="${fill}" stroke="${pal.stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
      return `<g opacity="${opacity}">`
        + face([[X, y, z], [X, Y, z], [X, Y, Z], [X, y, Z]], pal.x)
        + face([[x, Y, z], [X, Y, z], [X, Y, Z], [x, Y, Z]], pal.y)
        + face([[x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z]], pal.top)
        + `</g>`;
    },
  };
}

/* ---------- through-hole parts, drawn from the front at a given scale ----------
   Every builder returns an SVG string; sizes are in mm, scaled by `mm` (px per mm). Body
   colours are the real ones (black epoxy, grey glass, silver leads); labels on the stage
   stay ink, so nothing here borrows a semantic colour except where the meaning matches. */
const LEAD_DARK = '#8e8f86', LEAD = '#c9c9c0';
const BODY = 'fill="#262822" stroke="#45483e" stroke-width="1"';
const PRINT = 'fill:#b9b9ae;letter-spacing:.04em';
export const SHEEN = `<linearGradient id="rlMetal" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#e3e4e0"/><stop offset=".5" stop-color="#bfc2bc"/><stop offset="1" stop-color="#d6d8d3"/>
  </linearGradient>`;

/* a lead: a two-tone stroke along a path */
export const leadPath = (d, w) =>
  `<path d="${d}" fill="none" stroke="${LEAD_DARK}" stroke-width="${w + 1.2}" stroke-linejoin="round" stroke-linecap="round"/>
   <path d="${d}" fill="none" stroke="${LEAD}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;

/* legs that leave a body at their real pitch, then (if spread > pitch) bend out to it, the
   way a TO-92's legs are bent to fit a breadboard's 2.54 mm holes; letters under each */
export function legs(cx, pitch, w, top, len, names, spread = pitch){
  const mid = (names.length - 1) / 2;
  return names.map((n, i) => {
    const x = cx + (i - mid) * pitch, xe = cx + (i - mid) * spread;
    return leadPath(`M${x.toFixed(1)} ${top} V${top + 10} L${xe.toFixed(1)} ${top + 22} V${top + len}`, w)
      + `<text x="${xe.toFixed(1)}" y="${top + len + 15}" class="lbl" style="fill:var(--ink)">${n}</text>`;
  }).join('');
}

/* TO-92: the small black half-cylinder, flat face towards you (4.8 mm wide, 1.27 mm pitch) */
export function to92({ cx, base, mm = 6, lines = [], pins, caption = '', spread = 15, len = 62 }){
  const w = 4.8 * mm, h = 5 * mm;
  return `<path d="M${cx - w / 2} ${base - h} A${w / 2} ${mm} 0 0 1 ${cx + w / 2} ${base - h} Z" fill="#3a3d35" stroke="#45483e" stroke-width="1"/>
    <rect x="${cx - w / 2}" y="${base - h}" width="${w}" height="${h}" rx="1.5" ${BODY}/>
    ${lines.map((t, i) => `<text x="${cx}" y="${base - h + 12 + i * 9}" class="lbl" font-size="6.5" style="${PRINT}">${t}</text>`).join('')}
    ${legs(cx, 1.27 * mm, 2.8, base, len, pins, spread)}
    <text x="${cx}" y="${base + len + 42}" class="lbl-faint" font-size="8.5">${caption}</text>`;
}

/* TO-220: black body under a metal tab with a hole (10 mm wide, 2.54 mm pitch) */
export function to220({ cx, base, mm = 6, text = '', pins, caption = '', len = 62 }){
  const w = 10 * mm, bh = 9 * mm, tab = 6.3 * mm;
  return `<rect x="${cx - w / 2}" y="${base - bh - tab}" width="${w}" height="${tab + 4}" rx="2" fill="url(#rlMetal)" stroke="${LEAD_DARK}" stroke-width="1"/>
    <circle cx="${cx}" cy="${base - bh - tab / 2}" r="${1.8 * mm}" fill="var(--paper-high)" stroke="${LEAD_DARK}" stroke-width="1"/>
    <rect x="${cx - w / 2}" y="${base - bh}" width="${w}" height="${bh}" rx="2" ${BODY}/>
    <text x="${cx}" y="${base - bh + 22}" class="lbl" font-size="7.5" style="${PRINT}">${text}</text>
    ${legs(cx, 2.54 * mm, 4.6, base, len, pins)}
    <text x="${cx}" y="${base + len + 42}" class="lbl-faint" font-size="8.5">${caption}</text>`;
}

/* TO-18 metal can (the original 2N2222): a short silver cylinder, a tab on its rim beside
   the emitter leg, seen slightly from above */
export function to18({ cx, base, mm = 6, pins, caption = '', len = 62, spread = 15 }){
  const d = 5.6 * mm, h = 5.3 * mm, ry = 1.4 * mm;
  return `<rect x="${cx - d / 2 - 3}" y="${base - 2 * mm}" width="${d + 6}" height="${2 * mm}" rx="1" fill="url(#rlMetal)" stroke="${LEAD_DARK}" stroke-width="1"/>
    <path d="M${cx - d / 2} ${base - 2 * mm} V${base - h} A${d / 2} ${ry} 0 0 1 ${cx + d / 2} ${base - h} V${base - 2 * mm} Z" fill="url(#rlMetal)" stroke="${LEAD_DARK}" stroke-width="1"/>
    <ellipse cx="${cx}" cy="${base - h}" rx="${d / 2}" ry="${ry}" fill="#e6e7e2" stroke="${LEAD_DARK}" stroke-width="1"/>
    <path d="M${cx - d / 2 - 3} ${base - 2 * mm + 2} l-9 3 v4 l9 -1 z" fill="url(#rlMetal)" stroke="${LEAD_DARK}" stroke-width="1"/>
    ${legs(cx, 2.54 * mm * .7, 2.6, base, len, pins, spread)}
    <text x="${cx}" y="${base + len + 42}" class="lbl-faint" font-size="8.5">${caption}</text>`;
}

/* an axial diode lying flat: leads out of both ends, a band at the cathode (right) end.
   glass: the 1N4148's see-through orange glass; epoxy: the 1N4001's black body */
export function axialDiode({ cx, cy, mm = 8, len, dia, glass = false, text = '', lead = 60 }){
  const L = len * mm, D = dia * mm, x0 = cx - L / 2, x1 = cx + L / 2, band = Math.max(4, L * .14);
  const body = glass
    ? `<rect x="${x0}" y="${cy - D / 2}" width="${L}" height="${D}" rx="${D / 2}" fill="rgba(214,130,58,.45)" stroke="#a5642a" stroke-width="1"/>
       <rect x="${x0 + L * .3}" y="${cy - 1.5}" width="${L * .4}" height="3" fill="#7d6a52"/>
       <line x1="${x0 + D / 2}" y1="${cy - D / 2 + 2}" x2="${x1 - D / 2}" y2="${cy - D / 2 + 2}" stroke="#fff" stroke-width="1.2" opacity=".6"/>`
    : `<rect x="${x0}" y="${cy - D / 2}" width="${L}" height="${D}" rx="${D * .3}" ${BODY}/>
       <text x="${cx - band / 2}" y="${cy + 3}" class="lbl" font-size="6.5" style="${PRINT}">${text}</text>`;
  const bandC = glass ? '#262822' : '#c9c9c0';
  return leadPath(`M${x0 - lead} ${cy} H${x1 + lead}`, 2.6) + body
    + `<rect class="rl-band" x="${x1 - band - 2}" y="${cy - D / 2}" width="${band}" height="${D}" fill="${bandC}" opacity="${glass ? .9 : 1}"/>`;
}

/* a 5 mm LED from the side: a domed clear-tinted body, a flat rim, two legs, the anode's
   longer; `lit` paints the glow amber, the course's lamp colour */
export function led({ cx, base, mm = 8, lit = false, len = 70 }){
  const w = 5 * mm, h = 8.6 * mm, rim = 5.8 * mm;
  const fill = lit ? 'rgba(168,116,31,.55)' : 'rgba(214,130,58,.32)';
  return leadPath(`M${cx - 1.27 * mm} ${base} V${base + len + 14}`, 2.6)
    + leadPath(`M${cx + 1.27 * mm} ${base} V${base + len}`, 2.6)
    + `<rect x="${cx - rim / 2}" y="${base - 1 * mm}" width="${rim}" height="${1 * mm}" rx="1" fill="${fill}" stroke="#a5642a" stroke-width="1"/>
    <path d="M${cx - w / 2} ${base - 1 * mm} V${base - h + w / 2} A${w / 2} ${w / 2} 0 0 1 ${cx + w / 2} ${base - h + w / 2} V${base - 1 * mm} Z" fill="${fill}" stroke="#a5642a" stroke-width="1"/>
    <path d="M${cx - .75 * mm} ${base - 1.5 * mm} v${-1.5 * mm} l${.75 * mm} ${-.75 * mm} h${.75 * mm} v${2.25 * mm}" fill="none" stroke="#7d6a52" stroke-width="${(.2 * mm).toFixed(1)}"/>
    <line x1="${cx - w / 2 + 4}" y1="${base - h + w / 2}" x2="${cx - w / 2 + 4}" y2="${base - 2 * mm}" stroke="#fff" stroke-width="1.4" opacity=".6"/>
    ${lit ? `<circle cx="${cx}" cy="${base - h + w / 2}" r="${w * .9}" fill="none" stroke="var(--amber)" stroke-width="1" stroke-dasharray="2 4"/>` : ''}`;
}

/* ---------- a DIP chip from above, and a breadboard ----------
   dip() lays the chip on its side, notch on the left. Pin 1 is bottom left and the pins
   count anticlockwise: 1 to n/2 along the bottom, then n/2 + 1 to n back along the top.
   pin(i) gives the tip of pin i, so wires can be drawn to it. */
export function dip({ x, y, n = 14, p = 13, text = '', sub = '' }){
  const half = n / 2, L = half * p, W = 2.5 * p;
  const px = i => i <= half ? x + (i - .5) * p : x + (n - i + .5) * p;
  const onBottom = i => i <= half;
  let pins = '';
  for (let i = 1; i <= n; i++){
    const bottom = onBottom(i);
    pins += `<rect x="${(px(i) - p * .2).toFixed(1)}" y="${bottom ? y + W : y - p * .3}" width="${(p * .4).toFixed(1)}" height="${(p * .3).toFixed(1)}" fill="${LEAD}" stroke="${LEAD_DARK}" stroke-width=".6"/>`;
  }
  const svg = pins
    + `<rect x="${x}" y="${y}" width="${L}" height="${W}" rx="2" ${BODY}/>
       <path d="M${x} ${y + W / 2 - p * .35} A${p * .35} ${p * .35} 0 0 1 ${x} ${y + W / 2 + p * .35}" fill="#3a3d35" stroke="#55594d" stroke-width="1"/>
       <circle cx="${x + p * .55}" cy="${y + W - p * .5}" r="${p * .17}" fill="#55594d"/>
       <text x="${x + L / 2 + p * .2}" y="${y + W / 2 - 1}" class="lbl" font-size="7.5" style="${PRINT}">${text}</text>
       <text x="${x + L / 2 + p * .2}" y="${y + W / 2 + 9}" class="lbl" font-size="5.5" style="${PRINT}">${sub}</text>`;
  return { svg, pin: i => [px(i), onBottom(i) ? y + W + p * .3 : y - p * .3], L, W,
    notch: [x, y + W / 2], dot: [x + p * .55, y + W - p * .5] };
}

/* a breadboard section: power rails along the top and bottom (+ marked in amber, the power
   colour, − in ink), rows a to e and f to j either side of the centre channel. Columns in
   a block are joined inside the board; a rail is joined along its length. hole(col, row)
   takes row as 'a'..'j', 'T+', 'T-', 'B-', 'B+'. */
export function breadboard({ x, y, cols = 22, p = 13 }){
  const rowsY = {};
  rowsY['T+'] = y + p * .9; rowsY['T-'] = y + p * 1.9;
  'abcde'.split('').forEach((r, i) => { rowsY[r] = y + p * (3.6 + i); });
  'fghij'.split('').forEach((r, i) => { rowsY[r] = y + p * (10.1 + i); });
  rowsY['B-'] = y + p * 15.8; rowsY['B+'] = y + p * 16.8;
  const H = p * 17.7, W = (cols + 1) * p;
  const hx = c => x + p * (c + .5);
  let holes = '';
  for (const [r, yy] of Object.entries(rowsY)){
    for (let c = 1; c <= cols; c++){
      if (r.length === 2 && c % 6 === 0) continue;         // rails come in groups of five
      const hs = Math.max(4, p * .3);
      holes += `<rect x="${(hx(c) - hs / 2).toFixed(1)}" y="${(yy - hs / 2).toFixed(1)}" width="${hs.toFixed(1)}" height="${hs.toFixed(1)}" rx=".6" fill="#5f6156"/>`;
    }
  }
  const rail = (yy, plus) => `<line x1="${x + p * .6}" y1="${yy}" x2="${x + W - p * .6}" y2="${yy}" stroke="${plus ? 'var(--amber)' : 'var(--ink)'}" stroke-width="1.4"/>`;
  const svg = `<rect x="${x}" y="${y}" width="${W}" height="${H}" rx="6" fill="#faf8f1" stroke="var(--hairline-strong)" stroke-width="1.2"/>
    <rect x="${x + 4}" y="${y + p * 8.35}" width="${W - 8}" height="${p * .8}" rx="2" fill="#e9e4d4"/>
    ${rail(y + p * .3, true)}${rail(y + p * 2.5, false)}${rail(y + p * 15.2, false)}${rail(y + p * 17.4, true)}
    <text x="${x - 8}" y="${rowsY['T+'] + 3}" class="lbl" font-size="9" text-anchor="end" style="fill:var(--amber)">+</text>
    <text x="${x - 8}" y="${rowsY['T-'] + 3}" class="lbl" font-size="9" text-anchor="end">−</text>
    <text x="${x - 8}" y="${rowsY['B-'] + 3}" class="lbl" font-size="9" text-anchor="end">−</text>
    <text x="${x - 8}" y="${rowsY['B+'] + 3}" class="lbl" font-size="9" text-anchor="end" style="fill:var(--amber)">+</text>
    ${holes}`;
  return { svg, hole: (c, r) => [hx(c), rowsY[r]], W, H };
}

/* a jumper wire between two points, bowed a little so it reads as a wire lying on the board */
export function jumper([x1, y1], [x2, y2], colour = 'var(--ink)', bow = 10){
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - bow;
  return `<path d="M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}" fill="none" stroke="${colour}" stroke-width="3.4" stroke-linecap="round" opacity=".9"/>
    <circle cx="${x1}" cy="${y1}" r="2.4" fill="#8e8f86"/><circle cx="${x2}" cy="${y2}" r="2.4" fill="#8e8f86"/>`;
}

/* ---------- parts seen from above, sitting in breadboard holes ----------
   Each takes hole positions ([x, y] from breadboard().hole) so a circuit is described the
   way you would build it: which holes each leg goes in. */
/* labels on a breadboard sit over the hole grid, so they get a halo of board colour */
export const HALO = 'fill:var(--ink);paint-order:stroke;stroke:#faf8f1;stroke-width:4px;stroke-linejoin:round';
const along = ([x1, y1], [x2, y2]) => ({ len: Math.hypot(x2 - x1, y2 - y1), ang: Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI });

/* a resistor: tan body, three value bands and a gold tolerance band, leads to both holes */
export function resistorTop(a, b, { label = '', p = 16 } = {}){
  const { len, ang } = along(a, b), bw = Math.min(len - 10, p * 2.6), bh = p * .62, x0 = (len - bw) / 2;
  const bands = [0, 1, 2].map(i => `<rect x="${(x0 + bw * (.14 + i * .16)).toFixed(1)}" y="${-bh / 2}" width="${(bw * .07).toFixed(1)}" height="${bh}" fill="#6b5a3a"/>`).join('')
    + `<rect x="${(x0 + bw * .8).toFixed(1)}" y="${-bh / 2}" width="${(bw * .07).toFixed(1)}" height="${bh}" fill="#b39b5a"/>`;
  return `<g transform="translate(${a[0]} ${a[1]}) rotate(${ang.toFixed(1)})">
      ${leadPath(`M0 0 H${len.toFixed(1)}`, 2)}
      <rect x="${x0}" y="${-bh / 2}" width="${bw}" height="${bh}" rx="${bh / 2}" fill="#e3d3b0" stroke="#a89668" stroke-width="1"/>${bands}
    </g>` + (label ? `<text x="${((a[0] + b[0]) / 2).toFixed(1)}" y="${((a[1] + b[1]) / 2 - bh - 4).toFixed(1)}" class="lbl" font-size="8.5" style="${HALO}">${label}</text>` : '');
}

/* an axial diode lying on the board: black body, grey band at the cathode end */
export function diodeTop(a, b, { cathodeAt = 'b', label = '', p = 16 } = {}){
  const { len, ang } = along(a, b), bw = Math.min(len - 10, p * 2.2), bh = p * .7, x0 = (len - bw) / 2;
  const bx = cathodeAt === 'b' ? x0 + bw - bw * .2 : x0 + bw * .06;
  return `<g transform="translate(${a[0]} ${a[1]}) rotate(${ang.toFixed(1)})">
      ${leadPath(`M0 0 H${len.toFixed(1)}`, 2)}
      <rect x="${x0}" y="${-bh / 2}" width="${bw}" height="${bh}" rx="${bh * .3}" ${BODY}/>
      <rect x="${bx.toFixed(1)}" y="${-bh / 2}" width="${(bw * .14).toFixed(1)}" height="${bh}" fill="#c9c9c0"/>
    </g>` + (label ? `<text x="${((a[0] + b[0]) / 2).toFixed(1)}" y="${((a[1] + b[1]) / 2 - bh - 4).toFixed(1)}" class="lbl" font-size="8.5" style="${HALO}">${label}</text>` : '');
}

/* a 5 mm LED from above, its legs in two holes, anode first; lit glows amber (the lamp
   colour); the flat on its rim marks the cathode side */
export function ledTop(an, ca, { lit = false, p = 16, label = 'LED' } = {}){
  const cx = (an[0] + ca[0]) / 2, cy = (an[1] + ca[1]) / 2, r = p * .95;
  return `<line x1="${an[0]}" y1="${an[1]}" x2="${ca[0]}" y2="${ca[1]}" stroke="#8e8f86" stroke-width="2"/>
    <circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="${lit ? 'rgba(168,116,31,.5)' : 'rgba(214,130,58,.22)'}" stroke="#a5642a" stroke-width="1.2"/>
    <line x1="${(cx + r * .62).toFixed(1)}" y1="${(cy - r * .78).toFixed(1)}" x2="${(cx + r * .62).toFixed(1)}" y2="${(cy + r * .78).toFixed(1)}" stroke="#a5642a" stroke-width="1.2"/>
    <circle cx="${cx}" cy="${cy}" r="${(r * .6).toFixed(1)}" fill="${lit ? 'rgba(168,116,31,.8)' : 'rgba(214,130,58,.18)'}"/>
    ${lit ? `<circle cx="${cx}" cy="${cy}" r="${(r * 1.5).toFixed(1)}" fill="none" stroke="var(--amber)" stroke-width="1" stroke-dasharray="2 4"/>` : ''}
    ${label ? `<text x="${cx}" y="${(cy - r * 1.5 - 5).toFixed(1)}" class="lbl" font-size="8.5" style="${HALO}">${label}</text>` : ''}`;
}

/* a TO-92 transistor from above: the D-shaped top, flat face towards you (down the page),
   its three legs in three holes of one row, the leg letters under the flat face */
export function to92Top(holes, { name = '', pins = [], p = 16 } = {}){
  const x0 = holes[0][0] - p * .55, x1 = holes[2][0] + p * .55, y = holes[0][1], back = p * 1.1, front = p * .45;
  return `<path d="M${x0} ${y + front} H${x1} V${y} A${(x1 - x0) / 2} ${back} 0 0 0 ${x0} ${y} Z" ${BODY}/>
    <text x="${(x0 + x1) / 2}" y="${(y - back * .25).toFixed(1)}" class="lbl" font-size="7" style="${PRINT}">${name}</text>
    ${holes.map((h, i) => `<text x="${h[0]}" y="${(y + front + 12).toFixed(1)}" class="lbl" font-size="8.5" style="${HALO}">${pins[i] || ''}</text>`).join('')}`;
}

/* the bench supply, drawn as a small box off the board's left edge, its + lead (amber) to
   the + rail and its 0 V lead (ink) to the − rail. Ground is the − rail. */
export function supplyTop(bb, { x, y, volts = '5 V', p = 16 } = {}){
  const [px1, py1] = bb.hole(1, 'T+'), [px2, py2] = bb.hole(1, 'T-');
  return `<rect x="${x}" y="${y}" width="64" height="58" rx="4" fill="#2f322b" stroke="#55594d"/>
    <text x="${x + 32}" y="${y + 15}" class="lbl" font-size="7.5" style="fill:#d9d6c9">SUPPLY</text>
    <text x="${x + 32}" y="${y + 30}" class="lbl" font-size="9" style="fill:var(--amber)">+${volts}</text>
    <text x="${x + 32}" y="${y + 46}" class="lbl" font-size="8" style="fill:#d9d6c9">0 V</text>
    <path d="M${x + 64} ${y + 27} C${x + 84} ${y + 27} ${px1 - 20} ${py1} ${px1} ${py1}" fill="none" stroke="var(--amber)" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M${x + 64} ${y + 43} C${x + 90} ${y + 43} ${px2 - 22} ${py2} ${px2} ${py2}" fill="none" stroke="var(--ink)" stroke-width="3.2" stroke-linecap="round"/>
    <circle cx="${px1}" cy="${py1}" r="2.6" fill="#8e8f86"/><circle cx="${px2}" cy="${py2}" r="2.6" fill="#8e8f86"/>`;
}

/* the standard lab board for Act 1's circuits: a 30-column breadboard at 16 px a hole, a
   5 V supply on its rails, and labels for the rails. Returns the board plus its hole() */
export function labBoard({ x = 116, y = 92, cols = 30, p = 16 } = {}){
  const bb = breadboard({ x, y, cols, p });
  const [, yp] = bb.hole(1, 'T+'), [, ym] = bb.hole(1, 'T-');
  const svg = bb.svg + supplyTop(bb, { x: x - 104, y: y - 4, p })
    + `<text x="${x + bb.W + 8}" y="${yp + 3}" class="lbl" font-size="8" text-anchor="start" style="fill:var(--amber)">+5 V RAIL</text>
       <text x="${x + bb.W + 8}" y="${ym + 3}" class="lbl" font-size="8" text-anchor="start">GROUND</text>`;
  return { ...bb, svg, p };
}
