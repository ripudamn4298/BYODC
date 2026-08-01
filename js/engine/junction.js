// BYODC engine — discrete-carrier semiconductor vocabulary, paper style.
// A small reusable kit for PN-junction / MOSFET steps: lattices of countable
// carriers (filled blue electrons, hollow red holes), the fixed ions a carrier
// leaves behind, the hatched depletion bands, the electron-hop ceremony, and a
// serif-italic measurement bracket. Everything is a PURE function of grid index —
// NO randomness anywhere — so Back/Restart replays land on identical layouts.
import { svgEl, sleep, clamp, RM } from './util.js';
import { Anim } from './anim.js';
import { SFX } from './sfx.js';
import { flow } from './flow.js';

/* ---- carrier grid ------------------------------------------------------------
   A lattice of discrete carriers filling a region box (the region rect itself is
   drawn by the caller). type 'N' = filled blue electron; type 'P' = hollow red
   hole (an absence reads as a ring). Dot i,j sits at a fixed grid position. */
export function makeCarrierGrid(svg, { x, y, w, h, type, cols, rows, pitchX = 28, pitchY = 30, inset = 14 }){
  const g = svgEl('g', { class: 'carrier-grid' });
  const dots = [];
  const isN = type === 'N';
  for (let r = 0; r < rows; r++){
    for (let c = 0; c < cols; c++){
      const cx = x + inset + c * pitchX;
      const cy = y + inset + r * pitchY;
      const node = svgEl('circle', {
        cx, cy, r: 4.5,
        class: isN ? 'carrier-e' : 'carrier-h',
      });
      g.appendChild(node);
      dots.push({ c, r, cx, cy, node, state: 'carrier' });
    }
  }
  svg.appendChild(g);
  const idx = (c, r) => r * cols + c;
  return {
    dots, el: g,
    at(c, r){ return dots[idx(c, r)]; },
    hide(c, r){ const d = dots[idx(c, r)]; if (d){ d.node.setAttribute('opacity', 0); d.state = 'gone'; } },
    show(c, r){ const d = dots[idx(c, r)]; if (d){ d.node.setAttribute('opacity', 1); d.state = 'carrier'; } },
  };
}

/* ---- fixed ions (what a carrier leaves behind / becomes) ---------------------
   Swaps a dot's node for a dashed circled sign glyph — circled-and-dashed reads
   as "locked in the crystal, cannot move", distinct from the mobile carriers.
   Charge colour follows the palette: negative ↔ blue, positive ↔ red. */
export function ionise(dot, sign){
  if (!dot) return;
  const neg = sign === '-' || sign === '−';
  const glyph = svgEl('g', { class: 'ion-fixed' });
  glyph.appendChild(svgEl('circle', {
    cx: dot.cx, cy: dot.cy, r: 5.5,
    fill: 'none',
    stroke: neg ? 'var(--blue)' : 'var(--red)',
    'stroke-width': 1.3,
    'stroke-dasharray': '2 2',
  }));
  const t = svgEl('text', {
    x: dot.cx, y: dot.cy + 3.2,
    fill: neg ? 'var(--blue)' : 'var(--red)',
    class: 'ion-sign',
  });
  t.textContent = neg ? '−' : '+';
  glyph.appendChild(t);
  dot.node.replaceWith(glyph);
  dot.node = glyph;
  dot.state = 'ion';
}

/* ---- the depletion visual ----------------------------------------------------
   Two hatched bands meeting at cx: bandNeg on the P side [cx−wNeg, cx] (blue-8%),
   bandPos on the N side [cx, cx+wPos] (red-8%). The hatch says "no free carriers
   live here". setWidth scales both bands about cx; quiver nudges the outer edges
   when a too-small forward voltage leans on the wall. */
/* `labels` draws the SLIGHTLY −/+ CHARGED captions. They read outward from the
   seam, so a single junction can never collide with itself — but two walls sitting
   84px apart (the NPN) put four 130px captions in the same 230px of stage. Pass
   labels:false for the multi-junction views and caption them once, outside. */
export function makeDepletionBands(svg, { cx, y, h, wNeg = 64, wPos = 64, labels = true }){
  // one shared hatch pattern per module — define once, reuse by id
  ensureHatch(svg);
  const g = svgEl('g', { class: 'depl-bands' });

  const mk = (bx, bw, fillCls) => {
    const gg = svgEl('g');
    gg.appendChild(svgEl('rect', { x: bx, y, width: bw, height: h, class: fillCls }));
    gg.appendChild(svgEl('rect', { x: bx, y, width: bw, height: h, fill: 'url(#depl-hatch)' }));
    return gg;
  };
  const bandNeg = mk(cx - wNeg, wNeg, 'depl-band-neg');   // P side, slightly negative
  const bandPos = mk(cx, wPos, 'depl-band-pos');          // N side, slightly positive

  // dashed outer edges (the empty-zone boundaries)
  const edgeL = svgEl('line', { x1: cx - wNeg, y1: y, x2: cx - wNeg, y2: y + h, class: 'junction' });
  const edgeR = svgEl('line', { x1: cx + wPos, y1: y, x2: cx + wPos, y2: y + h, class: 'junction' });

  // labels read OUTWARD from the seam, so one junction never collides with itself
  const lblNeg = svgEl('text', { x: cx - 8, y: y + h + 14, class: 'depl-lbl', 'text-anchor': 'end' });
  lblNeg.textContent = 'SLIGHTLY − CHARGED';
  const lblPos = svgEl('text', { x: cx + 8, y: y + h + 14, class: 'depl-lbl', 'text-anchor': 'start' });
  lblPos.textContent = 'SLIGHTLY + CHARGED';

  g.append(bandNeg, bandPos, edgeL, edgeR);
  if (labels) g.append(lblNeg, lblPos);
  svg.appendChild(g);

  let quiverFn = null;
  const stop = () => { if (quiverFn){ Anim.remove(quiverFn); quiverFn = null; edgeL.setAttribute('transform', ''); edgeR.setAttribute('transform', ''); } };

  return {
    el: g, bandNeg, bandPos, lblNeg, lblPos,
    /* resize both bands about cx (f=1 default, .12 collapsed, 1.6 reverse).
       Widths are set as x/width ATTRIBUTES, never transforms — GSAP's transformOrigin
       is bbox-relative for SVG and flings the bands off the silicon (playtest 1.4). */
    setWidth(f){
      const negRects = bandNeg.querySelectorAll('rect');
      const posRects = bandPos.querySelectorAll('rect');
      const nx = cx - wNeg * f, nw = wNeg * f, pw = wPos * f;
      if (flow.instant || RM){
        negRects.forEach(r => { r.setAttribute('x', nx); r.setAttribute('width', nw); });
        posRects.forEach(r => { r.setAttribute('width', pw); });
        edgeL.setAttribute('x1', nx); edgeL.setAttribute('x2', nx);
        edgeR.setAttribute('x1', cx + pw); edgeR.setAttribute('x2', cx + pw);
        return;
      }
      negRects.forEach(r => gsap.to(r, { attr: { x: nx, width: nw }, duration: 0.45, ease: 'power2.out' }));
      posRects.forEach(r => gsap.to(r, { attr: { width: pw }, duration: 0.45, ease: 'power2.out' }));
      gsap.to(edgeL, { attr: { x1: nx, x2: nx }, duration: 0.45, ease: 'power2.out' });
      gsap.to(edgeR, { attr: { x1: cx + pw, x2: cx + pw }, duration: 0.45, ease: 'power2.out' });
    },
    /* ±1.5px x-jitter loop on the outer edges — the wall being leaned on */
    quiver(on){
      if (RM) return;
      if (on){
        if (quiverFn) return;
        quiverFn = Anim.add((dt, t) => {
          const dx = Math.sin(t * 9) * 1.5;
          edgeL.setAttribute('transform', `translate(${dx},0)`);
          edgeR.setAttribute('transform', `translate(${-dx},0)`);
        });
      } else stop();
    },
    /* squeeze the wall to nothing and dim the charge labels */
    collapse(){
      this.setWidth(0.12);
      const dim = () => { lblNeg.setAttribute('opacity', 0.25); lblPos.setAttribute('opacity', 0.25); };
      if (flow.instant || RM) dim();
      else gsap.to([lblNeg, lblPos], { opacity: 0.25, duration: 0.45, ease: 'power2.out' });
    },
  };
}

/* one 45° hatch pattern shared by every depletion band in the module */
function ensureHatch(svg){
  const root = svg.ownerSVGElement || svg;
  if (root.querySelector('#depl-hatch')) return;
  let defs = root.querySelector('defs');
  if (!defs){ defs = svgEl('defs'); root.insertBefore(defs, root.firstChild); }
  const pat = svgEl('pattern', {
    id: 'depl-hatch', patternUnits: 'userSpaceOnUse',
    width: 7, height: 7, patternTransform: 'rotate(45)',
  });
  pat.appendChild(svgEl('line', { x1: 0, y1: 0, x2: 0, y2: 7, class: 'depl-hatch-line' }));
  defs.appendChild(pat);
}

/* ---- the electron hop ceremony -----------------------------------------------
   For each {from,to} pair, in order: clone a carrier-e at `from`, turn `from`
   into a fixed + ion, arc the clone (control point 10px above the midpoint) to
   `to`, then turn `to` into a fixed − ion and drop the clone. SFX.click() every
   third hop — not every one, too chatty. Instant/RM: apply end states, no motion. */
export async function hopElectrons(svg, { pairs, stagger = 90, dur = 260 }){
  if (flow.instant || RM){
    pairs.forEach(({ from, to }) => { ionise(from, '+'); ionise(to, '-'); });
    return;
  }
  for (let i = 0; i < pairs.length; i++){
    const { from, to } = pairs[i];
    const clone = svgEl('circle', { cx: from.cx, cy: from.cy, r: 4.5, class: 'carrier-e' });
    svg.appendChild(clone);
    ionise(from, '+');
    if (i % 3 === 2) SFX.click();
    const mx = (from.cx + to.cx) / 2, my = Math.min(from.cy, to.cy) - 10;   // arc apex
    await new Promise(res => {
      const obj = { t: 0 };
      gsap.to(obj, {
        t: 1, duration: dur / 1000, ease: 'power1.inOut',
        onUpdate(){
          const t = obj.t, u = 1 - t;                                       // quadratic Bézier
          clone.setAttribute('cx', u * u * from.cx + 2 * u * t * mx + t * t * to.cx);
          clone.setAttribute('cy', u * u * from.cy + 2 * u * t * my + t * t * to.cy);
        },
        onComplete: res,
      });
    });
    ionise(to, '-');
    clone.remove();
    if (i < pairs.length - 1) await sleep(stagger);
  }
}

/* ---- barrier bracket ---------------------------------------------------------
   |——————| with 8px end ticks, 1px ink, and a serif-italic value in the label. */
export function makeBracket(svg, { x1, x2, y, label }){
  const g = svgEl('g', { class: 'bracket' });
  g.appendChild(svgEl('path', {
    d: `M${x1} ${y - 8} V${y} H${x2} V${y - 8}`,
    fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1,
  }));
  const t = svgEl('text', { x: x2 + 10, y: y + 3.5, class: 'lbl', 'text-anchor': 'start' });
  // wrap the value (after an em-dash if present) in italic; else italicise the whole thing
  const dash = label.indexOf('—');
  if (dash >= 0){
    const head = svgEl('tspan'); head.textContent = label.slice(0, dash + 1) + ' ';
    const val = svgEl('tspan', { 'font-style': 'italic' }); val.textContent = label.slice(dash + 1).trim();
    t.append(head, val);
  } else {
    const val = svgEl('tspan', { 'font-style': 'italic' }); val.textContent = label;
    t.appendChild(val);
  }
  g.appendChild(t);
  svg.appendChild(g);
  return g;
}

/* ---- the barrier as a hill ---------------------------------------------------
   The bands show WHERE the barrier is. They don't show WHY 0.7 V is the number.
   This draws the barrier as a slope an electron has to climb: raise the push
   voltage and the hill shrinks, so the same electron gets further up it. Below
   threshold it slides back every time; at threshold it crests and rolls away.
   Reverse bias makes the hill taller instead. The height IS the argument, so
   the curve is redrawn from `barrierV`, never merely scaled.                    */
export function makeBarrierHill(svg, { cx, base, w = 250, hMax = 74, label = true }){
  const g = svgEl('g', { class: 'barrier-hill' });
  const x0 = cx - w / 2, x1 = cx + w / 2;

  const ground = svgEl('line', { x1: x0 - 26, y1: base, x2: x1 + 26, y2: base, class: 'hill-ground' });
  const hill = svgEl('path', { class: 'hill-curve', fill: 'none' });
  const dot = svgEl('circle', { r: 4.6, class: 'carrier-e hill-e' });
  g.append(ground, hill, dot);

  let cap = null;
  if (label){
    cap = svgEl('text', { x: cx, y: base - hMax - 12, class: 'depl-lbl', 'text-anchor': 'middle' });
    cap.textContent = 'BARRIER';
    g.appendChild(cap);
  }
  svg.appendChild(g);

  const BARRIER_V = 0.7;              // the hill's full height with no battery
  let hV = BARRIER_V, t = 0, anim = null;

  /* redraw the hill for a given barrier height in volts */
  function shape(volts){
    const h = clamp(volts / BARRIER_V, 0, 2.2) * hMax;
    const top = base - h;
    hill.setAttribute('d',
      `M${x0} ${base} C${x0 + w * 0.30} ${base} ${cx - w * 0.18} ${top} ${cx} ${top}` +
      ` C${cx + w * 0.18} ${top} ${x1 - w * 0.30} ${base} ${x1} ${base}`);
    if (cap) cap.setAttribute('y', top - 12);
  }
  shape(hV);

  /* place the electron a fraction along the curve (0 = far left, 1 = far right) */
  function place(f){
    const L = hill.getTotalLength();
    const p = hill.getPointAtLength(clamp(f, 0, 1) * L);
    dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y - 5);
  }
  place(0);

  function frame(dt){
    const clears = hV <= 0.02;
    // the lower the remaining hill, the further up it gets before sliding back
    const reach = clamp(1 - hV / BARRIER_V, 0.12, 0.94) * 0.5;
    t += dt * (clears ? 0.55 : 0.75);
    if (clears){
      if (t > 1) t = 0;
      place(t);
    } else {
      // climb to `reach`, slide back, repeat — the failed attempt is the point
      const u = t % 2;
      place(u <= 1 ? u * reach : (2 - u) * reach);
      if (t > 2) t = 0;
    }
  }

  return {
    el: g,
    /* forward bias eats into the hill; reverse piles more on top of it */
    setBias(v, { reverse = false } = {}){
      hV = reverse ? BARRIER_V + v * 0.55 : Math.max(0, BARRIER_V - v);
      shape(hV);
      if (cap) cap.textContent = reverse ? 'BARRIER, TALLER' : (hV <= 0.02 ? 'BARRIER GONE' : 'BARRIER');
    },
    start(){ if (!anim && !RM) anim = Anim.add(frame); if (RM) place(0); },
    stop(){ if (anim){ Anim.remove(anim); anim = null; } },
  };
}

/* ---- why a tiny base current unlocks a large one -----------------------------
   The step used to assert that base current opens the device without ever saying
   why the ratio is ~100:1. The reason is geometry: the base is only a sliver
   wide, so an electron injected into it is already inside the collector's reach.
   Nearly all of them overshoot; a trickle leaves by the base lead.
   Releases `total` electrons and tallies where each one ends up, so the ratio is
   counted on screen rather than claimed. Deterministic: every `perBase`-th
   electron takes the base lead, no randomness (DESIGN.md replay rule).          */
export function makeOvershootDemo(svg, { xStart, xBase, xEnd, y, yBaseTop, total = 100, perBase = 100 }){
  const g = svgEl('g', { class: 'overshoot-demo' });
  const thru = svgEl('path', { d: `M${xStart} ${y} H${xEnd}`, fill: 'none', stroke: 'none' });
  const out  = svgEl('path', { d: `M${xStart} ${y} H${xBase} V${yBaseTop}`, fill: 'none', stroke: 'none' });
  g.append(thru, out);
  svg.appendChild(g);

  const live = [];
  let released = 0, viaBase = 0, viaCollector = 0, anim = null, onTally = null;

  function spawn(){
    const takesBase = released % perBase === perBase - 1;
    const route = takesBase ? out : thru;
    const dot = svgEl('circle', { r: 4, class: 'carrier-e' });
    g.appendChild(dot);
    live.push({ dot, route, len: route.getTotalLength(), t: 0, takesBase });
    released++;
  }

  function frame(dt){
    if (released < total && live.length < 26) spawn();
    for (let i = live.length - 1; i >= 0; i--){
      const e = live[i];
      e.t += dt * 0.55;
      if (e.t >= 1){
        e.dot.remove(); live.splice(i, 1);
        if (e.takesBase) viaBase++; else viaCollector++;
        if (onTally) onTally(viaBase, viaCollector);
        continue;
      }
      const p = e.route.getPointAtLength(e.t * e.len);
      e.dot.setAttribute('cx', p.x); e.dot.setAttribute('cy', p.y);
    }
  }

  return {
    el: g,
    onTally(fn){ onTally = fn; },
    step: frame,          // drive one frame by hand (verification, and rAF-less hosts)
    start(){ if (!anim) anim = Anim.add(frame); },
    stop(){ if (anim){ Anim.remove(anim); anim = null; } live.forEach(e => e.dot.remove()); live.length = 0; },
    /* replay/reduced-motion: jump straight to the finished tally */
    settle(){
      viaBase = Math.floor(total / perBase); viaCollector = total - viaBase;
      released = total;
      if (onTally) onTally(viaBase, viaCollector);
    },
    get counts(){ return { viaBase, viaCollector }; },
  };
}
