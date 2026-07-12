// BYODC engine — Act 3 fabrication vocabulary, paper style.
// WaferMap (round wafer + die grid + yield sim), MaskAlign (two nudgeable layers),
// process-step tiles, and a seeded PRNG so defect scatter is replay-deterministic.
import { el, svgEl, clamp } from './util.js';
import { SFX } from './sfx.js';

/* deterministic RNG — seed it, record the seed via flow.ask, reproduce on replay */
export function mulberry32(seed){
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- WaferMap: a round wafer tiled into dies, with a yield sim ---------- */
export function makeWaferMap(svg, { cx = 262, cy = 232, r = 168 } = {}){
  const g = svgEl('g');
  const disc = svgEl('circle', { cx, cy, r, class: 'wafer-disc' });
  const flat = svgEl('line', { x1: cx - r * 0.55, y1: cy + r * 0.86, x2: cx + r * 0.55, y2: cy + r * 0.86, class: 'wafer-flat' });
  const dieLayer = svgEl('g');
  const defectLayer = svgEl('g', { 'pointer-events': 'none' });
  g.append(disc, dieLayer, flat, defectLayer);
  svg.appendChild(g);

  let dies = [], defects = [];   // defects: [{x,y}] in svg coords

  function inCircle(px, py){ return Math.hypot(px - cx, py - cy) <= r; }

  function tile(dieW, dieH){
    dieLayer.innerHTML = ''; dies = [];
    const nx = Math.floor((2 * r) / dieW), ny = Math.floor((2 * r) / dieH);
    const x0 = cx - nx * dieW / 2, y0 = cy - ny * dieH / 2;
    for (let iy = 0; iy < ny; iy++) for (let ix = 0; ix < nx; ix++){
      const dx = x0 + ix * dieW, dy = y0 + iy * dieH;
      const corners = [[dx, dy], [dx + dieW, dy], [dx, dy + dieH], [dx + dieW, dy + dieH]];
      const inside = corners.every(([px, py]) => inCircle(px, py));
      const partial = !inside && corners.some(([px, py]) => inCircle(px, py));
      if (!inside && !partial) continue;
      const rect = svgEl('rect', { x: dx + 1, y: dy + 1, width: dieW - 2, height: dieH - 2, class: 'die' });
      dieLayer.appendChild(rect);
      dies.push({ x: dx, y: dy, w: dieW, h: dieH, rect, state: inside ? 'good' : 'edge' });
    }
    applyDefects();
    return stats();
  }

  function applyDefects(){
    for (const d of dies) if (d.state === 'defect') d.state = 'good';
    for (const d of dies){
      if (d.state !== 'good') continue;
      for (const p of defects)
        if (p.x >= d.x && p.x < d.x + d.w && p.y >= d.y && p.y < d.y + d.h){ d.state = 'defect'; break; }
    }
    render();
  }
  function render(){
    for (const d of dies) d.rect.setAttribute('class', 'die ' + d.state);
  }
  function stats(){
    const c = { total: dies.length, good: 0, edge: 0, defect: 0 };
    for (const d of dies) c[d.state]++;
    return c;
  }

  /* scatter `count` defects uniformly in the wafer disc using a seeded rng */
  function scatter(seed, count){
    const rng = mulberry32(seed);
    defects = [];
    let guard = 0;
    while (defects.length < count && guard++ < count * 40){
      const a = rng() * Math.PI * 2, rad = Math.sqrt(rng()) * r * 0.94;
      defects.push({ x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad });
    }
    defectLayer.innerHTML = '';
    for (const p of defects) defectLayer.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: 2.4, class: 'defect-dot' }));
    applyDefects();
  }

  return { g, tile, scatter, stats, get dies(){ return dies; }, get cx(){ return cx; }, get cy(){ return cy; }, get r(){ return r; } };
}

/* ---------- MaskAlign: overlay a second layer, nudge it onto the first ---------- */
export function makeMaskAlign(svg, { cx = 262, cy = 232, tol = 4 } = {}){
  const g = svgEl('g');
  // fixed base layer (already-printed pattern): a few via targets
  const base = svgEl('g', { class: 'mask-base' });
  const vias = [[-70, -50], [70, -50], [-70, 50], [70, 50], [0, 0]];
  vias.forEach(([dx, dy]) => base.appendChild(svgEl('circle', { cx: cx + dx, cy: cy + dy, r: 7, class: 'via-base' })));
  base.appendChild(svgEl('rect', { x: cx - 100, y: cy - 78, width: 200, height: 156, class: 'mask-frame' }));
  // moving layer (the new mask): matching via ring, offset initially
  const move = svgEl('g', { class: 'mask-move' });
  vias.forEach(([dx, dy]) => move.appendChild(svgEl('circle', { cx: cx + dx, cy: cy + dy, r: 7, class: 'via-move' })));
  move.appendChild(svgEl('rect', { x: cx - 100, y: cy - 78, width: 200, height: 156, class: 'mask-frame move' }));
  g.append(base, move);
  svg.appendChild(g);

  let ox = 0, oy = 0;
  const apply = () => move.setAttribute('transform', `translate(${ox},${oy})`);
  function nudge(dx, dy){ ox = clamp(ox + dx, -60, 60); oy = clamp(oy + dy, -60, 60); apply(); SFX.click(); }
  function set(x, y){ ox = x; oy = y; apply(); }
  function aligned(){ return Math.hypot(ox, oy) <= tol; }
  function lock(){ move.classList.add('locked'); base.classList.add('locked'); }

  return { g, nudge, set, aligned, lock, get offset(){ return { x: ox, y: oy }; } };
}

/* ---------- a labelled process-step tile (for the ordering placer) ---------- */
export function processTile(svg, kind, cap){
  const w = 96, h = 60;
  const g = svgEl('g', { class: 'tile', 'aria-label': kind });
  g.innerHTML = `
    <rect width="${w}" height="${h}" rx="4" class="tile-bg"/>
    <text x="${w / 2}" y="${h / 2 - 2}" class="gate-lbl" font-size="11">${kind}</text>
    <text x="${w / 2}" y="${h - 10}" class="tile-cap" font-size="8">${cap || ''}</text>`;
  svg.appendChild(g);
  return { g, value: kind, w, h, home: null, tx: 0, ty: 0, slot: null };
}
