// BYODC engine — shared drawn components (paper style) + controls + placer
import { el, svgEl, svgPt, clamp } from './util.js';
import { SFX } from './sfx.js';

/* lamp: ink circle, amber core + rays when lit (no glow — crisp) */
export function makeLamp(svg, x, y, { r = 13, label = '' } = {}){
  const g = svgEl('g');
  const rays = svgEl('g', { class: 'lamp-rays' });
  for (let k = 0; k < 8; k++){
    const a = k * Math.PI / 4;
    rays.appendChild(svgEl('line', {
      x1: x + Math.cos(a) * (r + 4), y1: y + Math.sin(a) * (r + 4),
      x2: x + Math.cos(a) * (r + 10), y2: y + Math.sin(a) * (r + 10),
    }));
  }
  const body = svgEl('circle', { cx: x, cy: y, r, class: 'lamp-body' });
  const core = svgEl('circle', { cx: x, cy: y, r: r * .58, class: 'lamp-core' });
  g.append(rays, body, core);
  if (label){ const t = svgEl('text', { x, y: y + r + 16, class: 'lbl' }); t.textContent = label; g.appendChild(t); }
  svg.appendChild(g);
  return {
    g,
    set(b){ b = clamp(b, 0, 1);
      core.style.opacity = b.toFixed(3);
      rays.style.opacity = (b * b).toFixed(3);
    },
  };
}

export function makeBattery(svg, cx, cy, { label = 'battery' } = {}){
  const g = svgEl('g');
  g.innerHTML = `
    <rect x="${cx - 40}" y="${cy - 17}" width="80" height="34" class="batt-body"/>
    <rect x="${cx + 40}" y="${cy - 6}" width="6" height="12" fill="var(--ink)"/>
    <text x="${cx - 21}" y="${cy + 4.5}" class="batt-t">−</text>
    <text x="${cx + 21}" y="${cy + 4.5}" class="batt-t">+</text>
    <text x="${cx}" y="${cy - 25}" class="lbl-faint">${label}</text>`;
  svg.appendChild(g);
  return g;
}

/* SVG corner ticks for panels drawn inside the stage */
export function cornerTicks(svg, x, y, w, h, s = 7){
  const g = svgEl('g', { stroke: 'var(--hairline-strong)', 'stroke-width': 1.4, fill: 'none' });
  g.innerHTML = `
    <path d="M${x} ${y + s} V${y} H${x + s}"/><path d="M${x + w - s} ${y} H${x + w} V${y + s}"/>
    <path d="M${x + w} ${y + h - s} V${y + h} H${x + w - s}"/><path d="M${x + s} ${y + h} H${x} V${y + h - s}"/>`;
  svg.appendChild(g);
  return g;
}

/* ---------- HTML controls (stage controls row) ---------- */
export function makeSlider(controls, { label, min, max, step, value, fmt }){
  const wrap = el('div', { class: 'ctl' });
  const lab = el('label', {}, label);
  const inp = el('input', { type: 'range', min, max, step, value, 'aria-label': label });
  const out = el('output');
  wrap.append(lab, inp, out); controls.appendChild(wrap);
  const update = () => { out.textContent = fmt(+inp.value); };
  inp.addEventListener('input', update); update();
  return {
    input: inp,
    get value(){ return +inp.value; },
    set(v){ inp.value = v; inp.dispatchEvent(new Event('input')); },
    on(fn){ inp.addEventListener('input', () => fn(+inp.value)); },
  };
}
export function makeChip(controls, html, cls = ''){
  const c = el('div', { class: 'chip ' + cls }, html);
  controls.appendChild(c);
  return { el: c, set(h){ c.innerHTML = h; }, cls(x, on){ c.classList.toggle(x, on); } };
}
export function makeSeg(controls, opts, onPick){
  const seg = el('div', { class: 'seg', role: 'group' });
  const btns = opts.map(o => {
    const b = el('button', { 'aria-pressed': 'false', 'data-label': o.id }, o.label);
    b.addEventListener('click', () => onPick(o.value));
    seg.appendChild(b); return { b, value: o.value };
  });
  controls.appendChild(seg);
  return { el: seg, set(v){ btns.forEach(x => x.b.setAttribute('aria-pressed', String(x.value === v))); } };
}
export function makeMeter(controls, label = 'POWER DRAW'){
  const m = el('div', { class: 'meter' },
    `<label>${label}</label><div class="track"><div class="fill"></div></div><output>≈ 0 (holding)</output>`);
  controls.appendChild(m);
  return { el: m, fill: m.querySelector('.fill'), out: m.querySelector('output') };
}

/* ---------- click-or-drag placement ---------- */
export function makePlacer({ svg, tiles, slots, validate, onWrong, onPlace }){
  let armed = null;
  const setT = (tile, x, y, anim) => {
    tile.g.style.transition = anim ? 'transform .4s cubic-bezier(.22,.9,.24,1)' : 'none';
    tile.g.style.transform = `translate(${x}px,${y}px)`;
    tile.tx = x; tile.ty = y;
  };
  tiles.forEach(t => setT(t, t.home.x, t.home.y, false));
  const arm = t => {
    tiles.forEach(x => x.g.classList.remove('armed'));
    armed = t; if (t) t.g.classList.add('armed');
    slots.forEach(s => s.rect.classList.toggle('hot', !!t && !s.value));
  };
  function place(tile, slot){
    slot.value = tile.value; slot.tile = tile; tile.slot = slot;
    setT(tile, slot.x + slot.w / 2 - tile.w / 2, slot.y + slot.h / 2 - tile.h / 2, true);
    SFX.dope(); arm(null);
    if (onPlace) onPlace();
  }
  function unplace(tile){
    if (tile.slot){ tile.slot.value = null; tile.slot.tile = null; tile.slot = null; }
  }
  function goHome(tile, anim = true){ unplace(tile); setT(tile, tile.home.x, tile.home.y, anim); }
  let resolveDone;
  const done = new Promise(r => resolveDone = r);
  function autoPlace(){ // used by flow replay: snap everything into the correct slots instantly
    slots.forEach(slot => {
      const tile = tiles.find(x => !x.slot && x.value === slot.correct) || tiles.find(x => !x.slot);
      if (tile){ slot.value = tile.value; slot.tile = tile; tile.slot = slot;
        setT(tile, slot.x + slot.w / 2 - tile.w / 2, slot.y + slot.h / 2 - tile.h / 2, false); }
    });
    tiles.forEach(t => { t.g.style.pointerEvents = 'none'; });
    slots.forEach(s => s.rect.classList.remove('hot'));
    resolveDone(slots.map(s => s.value));
  }
  function checkAll(){
    if (!slots.every(s => s.value)) return;
    const vals = slots.map(s => s.value);
    if (validate(vals)){
      tiles.forEach(t => { t.g.style.pointerEvents = 'none'; t.g.classList.remove('armed'); });
      slots.forEach(s => s.rect.classList.remove('hot'));
      resolveDone(vals);
    } else {
      slots.forEach(s => { s.rect.classList.remove('shake'); void s.rect.getBoundingClientRect(); s.rect.classList.add('shake'); });
      if (onWrong) onWrong();
      setTimeout(() => { tiles.forEach(t => goHome(t)); }, 620);
    }
  }
  tiles.forEach(tile => {
    const g = tile.g;
    g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button');
    let drag = null;
    g.addEventListener('pointerdown', e => {
      e.preventDefault();
      g.setPointerCapture(e.pointerId);
      const p = svgPt(svg, e.clientX, e.clientY);
      drag = { ox: p.x - tile.tx, oy: p.y - tile.ty, sx: e.clientX, sy: e.clientY, moved: false };
    });
    g.addEventListener('pointermove', e => {
      if (!drag) return;
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) drag.moved = true;
      if (!drag.moved) return;
      const p = svgPt(svg, e.clientX, e.clientY);
      unplace(tile);
      setT(tile, p.x - drag.ox, p.y - drag.oy, false);
    });
    g.addEventListener('pointerup', e => {
      if (!drag) return;
      const wasDrag = drag.moved; drag = null;
      if (!wasDrag){
        if (tile.slot){ goHome(tile); arm(null); return; }
        arm(armed === tile ? null : tile);
        SFX.click();
        return;
      }
      const cx2 = tile.tx + tile.w / 2, cy2 = tile.ty + tile.h / 2;
      const s = slots.find(s => !s.value && cx2 > s.x - 24 && cx2 < s.x + s.w + 24 && cy2 > s.y - 24 && cy2 < s.y + s.h + 24);
      if (s){ place(tile, s); checkAll(); } else goHome(tile);
    });
    g.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault();
        if (tile.slot){ goHome(tile); arm(null); } else arm(armed === tile ? null : tile); }
    });
  });
  slots.forEach(slot => {
    slot.rect.addEventListener('click', () => {
      if (armed && !slot.value){ place(armed, slot); checkAll(); }
    });
    slot.rect.setAttribute('tabindex', '0');
    slot.rect.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && armed && !slot.value){ e.preventDefault(); place(armed, slot); checkAll(); }
    });
  });
  return { done, autoPlace };
}
