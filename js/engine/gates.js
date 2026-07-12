// BYODC engine — Act 2 logic vocabulary, paper style.
// Gates are friendly labelled tiles (no textbook symbols): input pins on the left,
// an output pin with a mini-lamp on the right. HIGH = filled cobalt; LOW = hollow ink.
// Also: signal wires, bit lamps (with 8·4·2·1 weights) and HTML bit toggles.
import { el, svgEl } from './util.js';
import { SFX } from './sfx.js';

export const GATE_EVAL = {
  NAND: ins => !(ins[0] && ins[1]),
  AND:  ins => !!(ins[0] && ins[1]),
  OR:   ins => !!(ins[0] || ins[1]),
  XOR:  ins => !!(ins[0] ^ ins[1]),
  NOT:  ins => !ins[0],
};

export function makeGate(svg, { x, y, kind, label = kind, ins = kind === 'NOT' ? 1 : 2, w = 88, h = 56, cap = '' } = {}){
  const g = svgEl('g', { class: 'gate', 'data-gate': label });
  g.appendChild(svgEl('rect', { x, y, width: w, height: h, rx: 3, class: 'tile-bg' }));
  const t = svgEl('text', { x: x + w / 2, y: y + h / 2 + (cap ? -2 : 4), class: 'gate-lbl' });
  t.textContent = label; g.appendChild(t);
  if (cap){
    const c = svgEl('text', { x: x + w / 2, y: y + h - 9, class: 'lbl-faint' });
    c.textContent = cap; g.appendChild(c);
  }
  const pinIn = [];
  for (let i = 0; i < ins; i++){
    const py = y + h * (ins === 1 ? .5 : (i + 1) / (ins + 1));
    const p = svgEl('circle', { cx: x, cy: py, r: 4.2, class: 'pin' });
    g.appendChild(p);
    pinIn.push({ x, y: py, el: p });
  }
  const outY = y + h / 2;
  const pinOut = { x: x + w, y: outY, el: svgEl('circle', { cx: x + w, cy: outY, r: 5.2, class: 'pin out' }) };
  g.appendChild(pinOut.el);
  svg.appendChild(g);

  return {
    g, pinIn, pinOut, kind,
    /* evaluate from inputs, light the pins, return the output */
    set(insVals){
      const out = GATE_EVAL[kind] ? GATE_EVAL[kind](insVals) : false;
      insVals.forEach((v, i) => pinIn[i] && pinIn[i].el.classList.toggle('hi', !!v));
      pinOut.el.classList.toggle('hi', !!out);
      return out;
    },
    /* force pin states without evaluating (for compressed tiles like FA / REG) */
    setManual({ ins: iv = [], out } = {}){
      iv.forEach((v, i) => pinIn[i] && pinIn[i].el.classList.toggle('hi', !!v));
      if (out !== undefined) pinOut.el.classList.toggle('hi', !!out);
    },
  };
}

/* a wire that carries a logic level */
export function sigWire(svg, d, { layer } = {}){
  const p = svgEl('path', { d, class: 'wire sig' });
  (layer || svg).appendChild(p);
  return { el: p, set(hi){ p.classList.toggle('sig-hi', !!hi); } };
}

/* a row of n bit lamps, MSB first, with optional 8·4·2·1 weight labels */
export function makeBits(svg, { x, y, n = 4, gap = 46, size = 30, weights = true, label = '' } = {}){
  const g = svgEl('g');
  const cells = [];
  for (let i = 0; i < n; i++){
    const cx = x + i * gap;
    if (weights){
      const wl = svgEl('text', { x: cx + size / 2, y: y - 8, class: 'lbl-faint' });
      wl.textContent = String(2 ** (n - 1 - i)); g.appendChild(wl);
    }
    const r = svgEl('rect', { x: cx, y, width: size, height: size, rx: 3, class: 'bit-cell' });
    const tx = svgEl('text', { x: cx + size / 2, y: y + size / 2 + 4.5, class: 'bit-t' });
    tx.textContent = '0';
    g.append(r, tx);
    cells.push({ r, tx });
  }
  if (label){
    const lb = svgEl('text', { x: x + ((n - 1) * gap + size) / 2, y: y + size + 17, class: 'lbl' });
    lb.textContent = label; g.appendChild(lb);
  }
  svg.appendChild(g);
  return {
    g, cells,
    set(value){
      for (let i = 0; i < n; i++){
        const bit = (value >> (n - 1 - i)) & 1;
        cells[i].r.classList.toggle('hi', !!bit);
        cells[i].tx.classList.toggle('hi', !!bit);
        cells[i].tx.textContent = String(bit);
      }
    },
  };
}

/* HTML control: n tap-to-flip bit buttons (MSB first) + live decimal readout */
export function makeToggleBits(controls, { n = 4, label = 'INPUT', onChange } = {}){
  const wrap = el('div', { class: 'ctl bits-ctl' });
  wrap.appendChild(el('label', {}, label));
  let value = 0;
  const btns = [];
  const out = el('output');
  const update = silent => {
    btns.forEach((b, i) => {
      const bit = (value >> (n - 1 - i)) & 1;
      b.textContent = bit;
      b.setAttribute('aria-pressed', String(!!bit));
    });
    out.textContent = `= ${value}`;
    if (!silent && onChange) onChange(value);
  };
  for (let i = 0; i < n; i++){
    const b = el('button', { class: 'bit-btn', 'data-label': `${label.toLowerCase()}-bit-${n - 1 - i}`, 'aria-label': `bit worth ${2 ** (n - 1 - i)}` }, '0');
    b.addEventListener('click', () => { SFX.click(); value ^= 1 << (n - 1 - i); update(); });
    btns.push(b); wrap.appendChild(b);
  }
  wrap.appendChild(out);
  controls.appendChild(wrap);
  update(true);
  return {
    el: wrap,
    get value(){ return value; },
    set(v, silent){ value = v & ((1 << n) - 1); update(silent); },
  };
}
