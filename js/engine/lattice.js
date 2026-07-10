// BYODC engine — the silicon lattice, physically honest edition.
// Every bond renders as a hairline with a PAIR of bond-electrons (one per atom).
// Edge atoms get fading outward stubs (the crystal continues off-canvas).
// N-doping: phosphorus's 5th electron visibly ejects → free carrier (Field).
// P-doping: a bond is left one electron short → a red VACANCY ring; hole motion
// is an adjacent bond-electron hopping INTO the vacancy (the ring relocates).
import { svgEl, rand, RM, isInstant } from './util.js';
import { Anim } from './anim.js';
import { SFX } from './sfx.js';

function tween(dur, fn){
  return new Promise(res => {
    if (RM || isInstant()){ fn(1); return res(); }
    const t0 = performance.now();
    const tick = () => {
      const k = Math.min(1, (performance.now() - t0) / dur);
      fn(1 - Math.pow(1 - k, 3));
      if (k < 1) requestAnimationFrame(tick); else res();
    };
    requestAnimationFrame(tick);
  });
}

const E_OFF = 4.6;   // bond-electron offset from bond midpoint, along the bond
const E_R = 2.3;

export function buildLattice(svg, { cx = 360, cy = 200, rows = 4, cols = 5, gap = 80, r = 13 } = {}){
  const g = svgEl('g', { class: 'lattice' });
  const x0 = cx - (cols - 1) * gap / 2, y0 = cy - (rows - 1) * gap / 2;
  const atoms = [], bonds = [];
  const at = (i, j) => atoms[i * cols + j];

  // --- atoms ---
  let idx = 0;
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++){
    const ax = x0 + j * gap, ay = y0 + i * gap;
    atoms.push({ x: ax, y: ay, i, j, idx: idx++, type: 'Si', bonds: [] });
  }

  const bondLayer = svgEl('g'), eLayer = svgEl('g'), atomLayer = svgEl('g');
  g.append(bondLayer, eLayer, atomLayer);

  function makeBond(a, b, edge){
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
    const line = svgEl('line', {
      x1: a.x + ux * r, y1: a.y + uy * r,
      x2: b.x ? b.x - ux * r : 0, y2: b.y - uy * r,
      class: 'bond' + (edge ? ' fade' : ''),
    });
    if (edge) line.setAttribute('opacity', '.5');
    bondLayer.appendChild(line);
    const bond = { a, b, mx, my, ux, uy, edge, e: [null, null], line };
    // two bond-electrons, one contributed by each atom, sitting together in the bond
    for (const s of [0, 1]){
      const ex = mx + (s ? E_OFF : -E_OFF) * ux, ey = my + (s ? E_OFF : -E_OFF) * uy;
      const c = svgEl('circle', { cx: ex, cy: ey, r: E_R, class: 'bond-e' });
      if (edge) c.setAttribute('opacity', '.3');
      eLayer.appendChild(c);
      bond.e[s] = { el: c, hx: ex, hy: ey, present: true };
    }
    a.bonds.push(bond); if (b.idx !== undefined) b.bonds.push(bond);
    bonds.push(bond);
    return bond;
  }

  // internal bonds
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++){
    if (j < cols - 1) makeBond(at(i, j), at(i, j + 1), false);
    if (i < rows - 1) makeBond(at(i, j), at(i + 1, j), false);
  }
  // edge stubs — the crystal continues
  const stub = gap * .34;
  for (const a of atoms){
    if (a.i === 0)        makeBond(a, { x: a.x, y: a.y - stub }, true);
    if (a.i === rows - 1) makeBond(a, { x: a.x, y: a.y + stub }, true);
    if (a.j === 0)        makeBond(a, { x: a.x - stub, y: a.y }, true);
    if (a.j === cols - 1) makeBond(a, { x: a.x + stub, y: a.y }, true);
  }

  // atom circles + labels (drawn above bonds)
  for (const a of atoms){
    const pos = svgEl('g', {
      transform: `translate(${a.x},${a.y})`, class: 'atom si',
      'data-atom': a.idx, tabindex: '0', role: 'button', 'aria-label': 'silicon atom',
    });
    const inner = svgEl('g', { style: 'transform-box:fill-box;transform-origin:center' });
    const c = svgEl('circle', { r, class: 'atom-c' });
    const t = svgEl('text', { y: 3.5, class: 'atom-t' }); t.textContent = 'Si';
    inner.append(c, t); pos.appendChild(inner);
    atomLayer.appendChild(pos);
    Object.assign(a, { pos, inner, c, t });
  }

  svg.appendChild(g);
  const bounds = { x: x0 - r - 10, y: y0 - r - 10, w: (cols - 1) * gap + 2 * r + 20, h: (rows - 1) * gap + 2 * r + 20 };
  return { g, atoms, bonds, bounds, rows, cols, cy, vacancies: [], hopper: null };
}

/* wiggle an atom's bond electrons — they strain but stay locked */
export function wiggleBonds(atom){
  const els = [];
  for (const b of atom.bonds) for (const s of b.e) if (s.present) els.push(s);
  const t0 = performance.now();
  const tick = () => {
    const k = (performance.now() - t0) / 480;
    if (k >= 1){ els.forEach(s => { s.el.setAttribute('cx', s.hx); s.el.setAttribute('cy', s.hy); }); return; }
    const amp = 2.4 * (1 - k);
    els.forEach((s, i) => {
      s.el.setAttribute('cx', s.hx + Math.sin(k * 26 + i) * amp);
      s.el.setAttribute('cy', s.hy + Math.cos(k * 22 + i * 2) * amp);
    });
    requestAnimationFrame(tick);
  };
  if (!RM) requestAnimationFrame(tick);
}

/* show valence dots briefly around an arriving dopant */
async function arrivalRing(lattice, atom, count, color){
  if (RM || isInstant()) return;
  const ring = [];
  for (let k = 0; k < count; k++){
    const a = -Math.PI / 2 + k * 2 * Math.PI / count;
    const c = svgEl('circle', { cx: atom.x + Math.cos(a) * 22, cy: atom.y + Math.sin(a) * 22, r: 2.6, fill: color, class: 'pop-in' });
    lattice.g.appendChild(c); ring.push(c);
  }
  await tween(620, k => ring.forEach((c, i) => {
    // dots get absorbed toward the atom (into its bonds)
    const a = -Math.PI / 2 + i * 2 * Math.PI / count;
    const rr = 22 * (1 - k) + 9 * k;
    c.setAttribute('cx', atom.x + Math.cos(a) * rr);
    c.setAttribute('cy', atom.y + Math.sin(a) * rr);
    c.setAttribute('opacity', 1 - k * .9);
  }));
  ring.forEach(c => c.remove());
}

/* N-type: phosphorus replaces silicon; its 5th electron breaks free */
export async function dopeN(lattice, atom, field){
  atom.type = 'N';
  atom.pos.classList.remove('si'); atom.pos.classList.add('doped-n');
  atom.t.textContent = 'P';
  atom.inner.classList.remove('pop-in'); void atom.inner.getBoundingClientRect();
  atom.inner.classList.add('pop-in');
  SFX.dope();
  await arrivalRing(lattice, atom, 5, 'var(--blue)');
  // the 5th electron ejects and roams
  field.spawn({ x: atom.x + rand(-6, 6), y: atom.y - 16, kind: 'e', bounds: lattice.bounds });
}

/* P-type: boron replaces silicon; one adjacent bond is left an electron short */
export async function dopeP(lattice, atom){
  atom.type = 'P';
  atom.pos.classList.remove('si'); atom.pos.classList.add('doped-p');
  atom.t.textContent = 'B';
  atom.inner.classList.remove('pop-in'); void atom.inner.getBoundingClientRect();
  atom.inner.classList.add('pop-in');
  SFX.dope();
  await arrivalRing(lattice, atom, 3, 'var(--red)');
  // choose an internal bond of this atom that still has both electrons
  const bond = atom.bonds.find(b => !b.edge && b.e[0].present && b.e[1].present) || atom.bonds.find(b => !b.edge);
  if (!bond) return;
  const slot = bond.e[0].present ? 0 : 1;
  makeVacancy(lattice, bond, slot);
}

function makeVacancy(lattice, bond, slot){
  const s = bond.e[slot];
  s.present = false;
  s.el.style.opacity = '0';
  const ring = svgEl('circle', { cx: s.hx, cy: s.hy, r: 5, class: 'vacancy pop-in' });
  bond.line.parentNode.parentNode.appendChild(ring); // lattice group root
  lattice.vacancies.push({ ring, bond, slot });
  ensureHopper(lattice);
}

/* hole motion: a neighbouring bond-electron hops into the vacancy */
function ensureHopper(lattice){
  if (lattice.hopper) return;
  lattice.hopper = { bias: 0, stop: false };
  const cadence = () => (RM ? 2100 : 1050) + rand(0, 500);
  async function hopOne(v){
    // candidate bonds share an atom with the vacancy's bond and have an electron to give
    const shared = [v.bond.a, v.bond.b];
    const cands = [];
    for (const a of shared){
      if (!a.bonds) continue;
      for (const b of a.bonds){
        if (b === v.bond || b.edge) continue;
        for (const s of [0, 1]) if (b.e[s].present) cands.push({ bond: b, slot: s });
      }
    }
    if (!cands.length) return;
    let pick;
    if (lattice.hopper.bias){
      // vacancy should MOVE along bias ⇒ take the electron whose position is furthest along bias
      cands.sort((p, q) => (q.bond.e[q.slot].hx - p.bond.e[p.slot].hx) * lattice.hopper.bias);
      pick = cands[0];
    } else pick = cands[(Math.random() * cands.length) | 0];

    const from = pick.bond.e[pick.slot], to = v.bond.e[v.slot];
    // silent — the periodic hop no longer beeps; the ambient music carries the moment
    // electron slides into the vacancy
    if (!RM && !isInstant()){
      await tween(420, k => {
        from.el.setAttribute('cx', from.hx + (to.hx - from.hx) * k);
        from.el.setAttribute('cy', from.hy + (to.hy - from.hy) * k);
      });
    }
    // bookkeeping: electron now fills the old vacancy; vacancy relocates
    from.present = false; from.el.setAttribute('cx', from.hx); from.el.setAttribute('cy', from.hy); from.el.style.opacity = '0';
    to.present = true; to.el.style.opacity = '';
    v.ring.setAttribute('cx', from.hx); v.ring.setAttribute('cy', from.hy);
    v.bond = pick.bond; v.slot = pick.slot;
  }
  (async function loop(){
    while (!lattice.hopper.stop){
      await new Promise(r => setTimeout(r, cadence()));
      if (lattice.hopper.stop) break;
      for (const v of lattice.vacancies) await hopOne(v);
    }
  })();
}

export function setHoleBias(lattice, bias){ if (lattice.hopper) lattice.hopper.bias = bias; }
export function destroyLattice(lattice){
  if (lattice.hopper) lattice.hopper.stop = true;
  lattice.g.remove();
}
