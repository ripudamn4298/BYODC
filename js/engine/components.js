// BYODC engine — shared drawn components (paper style) + controls + placer
import { el, svgEl, svgPt, clamp, RM } from './util.js';
import { SFX } from './sfx.js';
import { Anim } from './anim.js';
import { guide } from './guide.js';

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
    // self-highlight on click so the pressed state always tracks the selection,
    // even if the caller's onPick forgets to call set()
    b.addEventListener('click', () => { api.set(o.value); onPick(o.value); });
    seg.appendChild(b); return { b, value: o.value };
  });
  controls.appendChild(seg);
  const api = { el: seg, set(v){ btns.forEach(x => x.b.setAttribute('aria-pressed', String(x.value === v))); } };
  return api;
}
export function makeMeter(controls, label = 'POWER DRAW'){
  const m = el('div', { class: 'meter' },
    `<label>${label}</label><div class="track"><div class="fill"></div></div><output>≈ 0 (holding)</output>`);
  controls.appendChild(m);
  return { el: m, fill: m.querySelector('.fill'), out: m.querySelector('output') };
}

/* ---------- one press-drag-release, however it ends (N-144, 2026-11-03) ----------
   A drag that only listens for pointerup can miss the release: a trackpad gesture, a browser
   drag or the window losing focus ends in pointercancel or in nothing at all. The tile then
   stays in its drag state and follows the pointer with no button held, which is the part
   "stuck to the cursor". Here every ending finishes the drag exactly once, and a move that
   arrives with no button held counts as the release it missed.
     start(e)  a press; return false to ignore it
     move(e)   the pointer moved with the press still held
     end(e)    the press is over */
export function pointerDrag(el, { start, move, end }){
  let id = null;
  const finish = e => {
    if (id === null) return;
    const was = id; id = null;
    window.removeEventListener('pointerup', onWinUp, true);
    window.removeEventListener('blur', onBlur);
    try { if (el.hasPointerCapture?.(was)) el.releasePointerCapture(was); } catch { /* already gone */ }
    end(e);
  };
  const onWinUp = e => { if (e.pointerId === id) finish(e); };
  const onBlur = () => finish({ clientX: last?.clientX ?? 0, clientY: last?.clientY ?? 0 });
  let last = null;
  el.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    if (id !== null) finish(e);
    if (start(e) === false) return;
    id = e.pointerId; last = e;
    try { el.setPointerCapture(id); } catch { /* the pointer already left */ }
    window.addEventListener('pointerup', onWinUp, true);
    window.addEventListener('blur', onBlur);
  });
  el.addEventListener('pointermove', e => {
    if (e.pointerId !== id) return;
    if (e.buttons === 0){ finish(e); return; }
    last = e; move(e);
  });
  el.addEventListener('pointerup', e => { if (e.pointerId === id) finish(e); });
  el.addEventListener('pointercancel', e => { if (e.pointerId === id) finish(e); });
  el.addEventListener('lostpointercapture', e => { if (e.pointerId === id) finish(e); });
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
  /* A filled slot is no longer a control, so it must stop being focusable: a
     hidden slot rect that keeps its tabindex still paints the :focus-visible
     ring after it is covered. Steps were dropping tabindex and blurring by hand. */
  function setSlotFocusable(slot, on){
    if (on) slot.rect.setAttribute('tabindex', '0');
    else {
      slot.rect.removeAttribute('tabindex');
      if (document.activeElement === slot.rect) slot.rect.blur();
    }
  }
  function place(tile, slot){
    slot.value = tile.value; slot.tile = tile; tile.slot = slot;
    setT(tile, slot.x + slot.w / 2 - tile.w / 2, slot.y + slot.h / 2 - tile.h / 2, true);
    SFX.dope(); arm(null);
    setSlotFocusable(slot, false);
    if (onPlace) onPlace();
  }
  function unplace(tile){
    if (tile.slot){
      setSlotFocusable(tile.slot, true);
      tile.slot.value = null; tile.slot.tile = null; tile.slot = null;
    }
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
    g.style.touchAction = 'none';     // a finger drags the tile instead of scrolling the page (mobile, 2026-11-02)
    let drag = null;
    pointerDrag(g, {
      start(e){
        e.preventDefault();
        g.blur();                     // pointer-driven: no focus ring (keyboard still gets one)
        const p = svgPt(svg, e.clientX, e.clientY);
        drag = { ox: p.x - tile.tx, oy: p.y - tile.ty, sx: e.clientX, sy: e.clientY, moved: false };
      },
      move(e){
        if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) drag.moved = true;
        if (!drag.moved) return;
        const p = svgPt(svg, e.clientX, e.clientY);
        unplace(tile);
        setT(tile, p.x - drag.ox, p.y - drag.oy, false);
      },
      end(e){
        const wasDrag = drag.moved, pt = svgPt(svg, e.clientX, e.clientY); drag = null;
        if (!wasDrag){
          if (tile.slot){ goHome(tile); arm(null); return; }
          arm(armed === tile ? null : tile);
          SFX.click();
          return;
        }
        // the slot under the pointer wins, then the nearest slot to the tile's centre
        const cx2 = tile.tx + tile.w / 2, cy2 = tile.ty + tile.h / 2, near = (s, x, y) =>
          x > s.x - 24 && x < s.x + s.w + 24 && y > s.y - 24 && y < s.y + s.h + 24;
        const open = slots.filter(s => !s.value), dist = s => Math.hypot(s.x + s.w / 2 - cx2, s.y + s.h / 2 - cy2);
        const s = open.find(s => near(s, pt.x, pt.y))
          || open.filter(s => near(s, cx2, cy2)).sort((a, b) => dist(a) - dist(b))[0];
        if (s){ place(tile, s); checkAll(); } else goHome(tile);
      },
    });
    g.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault();
        if (tile.slot){ goHome(tile); arm(null); } else arm(armed === tile ? null : tile); }
    });
  });
  slots.forEach(slot => {
    slot.rect.addEventListener('click', e => {
      // e.detail > 0 means a real pointer click; drop the ring the browser would
      // paint for it, while a keyboard Enter (detail 0) keeps its focus outline.
      if (e.detail) slot.rect.blur();
      if (armed && !slot.value){ place(armed, slot); checkAll(); }
    });
    slot.rect.setAttribute('tabindex', '0');
    slot.rect.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && armed && !slot.value){ e.preventDefault(); place(armed, slot); checkAll(); }
    });
  });
  return { done, autoPlace };
}

/* ---------- raised, floating tiles (REVIEW_NOTES N-043, N-044, N-046) ----------
   makeRaisedTiles(svg, tiles, opts) restyles placer tiles in place:
     style 'key'  — a mechanical keycap: the tile's own rect becomes a tall shaded base, a
                    smaller inset top face carries everything else, a highlight on its front edge
     style 'lift' — for tiles that are drawings of real parts: no keycap, just the float,
                    the ground shadow and the press
   Both float gently (out of step with each other), sit over a soft ground shadow, sink while
   held, and pause for reduced motion (css: .tile3d). The tile's own <g> stays the thing the
   placer moves; all of this happens on an inner group. */
export function makeRaisedTiles(svg, tiles, { style = 'key', capSize = null } = {}){
  if (style === 'key' && !svg.querySelector('#keySide')){
    const defs = svgEl('defs');
    defs.innerHTML = `
      <linearGradient id="keySide" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#efe7d2"/><stop offset=".55" stop-color="#d5cab0"/>
        <stop offset="1" stop-color="#a99d7f"/>
      </linearGradient>
      <linearGradient id="keyTop" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fffdf7"/><stop offset=".6" stop-color="#f3ecda"/>
        <stop offset="1" stop-color="#e6dcc4"/>
      </linearGradient>`;
    svg.appendChild(defs);
  }
  tiles.forEach((t, i) => {
    const inner = svgEl('g', { class: 'float-inner' });
    const kids = [...t.g.childNodes];
    if (style === 'key'){
      const base = kids.find(n => n.tagName === 'rect');
      base.setAttribute('height', t.h + 10);
      base.setAttribute('rx', 9);
      base.style.fill = 'url(#keySide)';
      base.style.stroke = 'rgba(29,33,23,.45)';
      inner.appendChild(base);
      inner.appendChild(svgEl('rect', { x: 7, y: 3, width: t.w - 14, height: t.h - 7, rx: 7,
        fill: 'url(#keyTop)', stroke: 'rgba(29,33,23,.22)', 'stroke-width': 1 }));
      inner.appendChild(svgEl('line', { x1: 13, y1: 4.4, x2: t.w - 13, y2: 4.4,
        stroke: '#fff', 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: .9 }));
      kids.filter(n => n !== base).forEach(n => inner.appendChild(n));
      if (capSize) inner.querySelectorAll('.tile-cap').forEach(c => { c.style.fontSize = capSize; c.style.letterSpacing = '0'; });
    } else {
      kids.forEach(n => inner.appendChild(n));
      t.g.appendChild(inner);
    }
    // a drawn part may carry a caption below its box, so a lifted tile's shadow goes under the
    // whole drawing; a keycap's goes under its base
    let ground = t.h + 22;
    if (style !== 'key'){
      ground = t.h + 14;
      try { const bb = inner.getBBox(); if (bb.height) ground = bb.y + bb.height + 10; } catch { /* not laid out yet */ }
    }
    const shadow = svgEl('ellipse', { class: 'float-shadow', cx: t.w / 2, cy: ground,
      rx: Math.max(10, t.w / 2 - 2), ry: 5.5, fill: 'rgba(29,33,23,.2)' });
    t.g.append(shadow, inner);
    t.g.classList.add('tile3d');
    t.g.addEventListener('pointerdown', () => t.g.classList.add('pressing'));
    const release = () => t.g.classList.remove('pressing');
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => t.g.addEventListener(ev, release));
    const delay = `${(-i * 0.55).toFixed(2)}s`;
    inner.style.animationDelay = delay;
    shadow.style.animationDelay = delay;
  });
}

/* ---------- a picture that slides in over the stage (REVIEW_NOTES N-045, N-049) ----------
   slideInPanel(svg, html) adds a paper panel the size of the stage, hidden off to the right.
   show() slides it in over whatever the stage is showing; hide() slides it out to the left
   and removes it, so the stage underneath carries on as it was. Both ride Anim.tween, so a
   replay lands them instantly. The card text goes in guide.say between the two; focus(key)
   dims every part tagged data-k except the one the card is about. */
export function slideInPanel(svg, html, { w = 720, h = 480, lab = false, numbers = false } = {}){
  const g = svgEl('g', { class: 'slide-panel' });
  /* lab: an "In the Lab" panel, on the lab paper with its tag in the top-left corner.
     numbers: the art beside a step's real-numbers box (N-053), tagged like that dark box */
  const tag = lab ? `<rect x="16" y="14" width="92" height="22" rx="11" fill="var(--lab-ink)"/>
    <text x="62" y="29" class="lbl" style="fill:var(--lab-paper);font-size:9.5px;letter-spacing:.2em">IN THE LAB</text>`
    : numbers ? `<rect x="16" y="14" width="146" height="22" rx="11" fill="var(--dark)"/>
    <text x="89" y="29" class="lbl" style="fill:var(--amber);font-size:9.5px;letter-spacing:.2em">THE REAL NUMBERS</text>` : '';
  g.innerHTML = `<rect x="-20" y="-20" width="${w + 40}" height="${h + 40}" fill="${lab ? 'var(--lab-paper)' : 'var(--paper-high)'}"/>${tag}${html}`;
  g.setAttribute('transform', `translate(${w} 0)`);
  svg.appendChild(g);
  return {
    g,
    async show(){
      svg.__camHome?.();                // a panel covers the whole stage: the camera backs out first
      await Anim.tween(650, q => g.setAttribute('transform', `translate(${(w * (1 - q) * (1 - q)).toFixed(1)} 0)`));
      g.setAttribute('transform', 'translate(0 0)');
    },
    async hide(){
      await Anim.tween(520, q => g.setAttribute('transform', `translate(${(-w * q * q).toFixed(1)} 0)`));
      g.remove();
    },
    /* REVIEW_NOTES N-053: from this panel straight to another one. The next panel slides in
       over this one and only then is this one removed, so the stage underneath never shows
       between the two. Create `next` after this panel, so it is drawn on top. */
    async swapTo(next){
      await next.show();
      g.remove();
    },
    /* the panel's own version of stage.focus: parts tagged data-k="…" stay bright when their
       key is named (one key or a list), the other tagged parts dim; focus(null) lights all */
    focus(key){
      const keys = [].concat(key ?? []);
      g.querySelectorAll('[data-k]').forEach(n => {
        n.style.transition = 'opacity .3s';
        n.style.opacity = (!keys.length || keys.includes(n.dataset.k)) ? '1' : '.2';
      });
    },
  };
}

/* ---------- a Lab panel you explore by tapping (critic pass, 2026-11-04) ----------
   One card instead of a run of reading cards. items are the parts of the panel tagged data-k:
   tapping one, on the picture or in the list under the card, lights it and opens its words. k is
   the key or keys to light, and hit the part to tap when that is narrower than what lights up.
   on and off, if given, run as an item opens and closes.
   Nothing here is an answer, so it costs no flow.ask, and the step's own Next follows it. */
export function labExplore(panel, { text, intro = false, prompt = 'Tap one to read about it.', items }){
  const card = guide.lab(text, { intro });
  const box = el('div', { class: 'explore' });
  const row = el('div', { class: 'explore-list' });
  const detail = el('p', { class: 'explore-detail' }, prompt);
  let current = null;
  const open = it => {
    SFX.click();
    if (current === it) return;
    current?.off?.();
    current = it;
    it.on?.();
    panel.focus(it.k);
    detail.innerHTML = it.html;
    if (!RM) detail.scrollIntoView({ behavior: 'smooth', block: 'center' });
    items.forEach(x => {
      x.btn.classList.toggle('on', x === it);
      if (x === it) x.btn.classList.add('seen');
    });
  };
  items.forEach(it => {
    it.btn = el('button', { class: 'explore-btn', 'data-label': `explore-${it.k}` }, it.label);
    it.btn.addEventListener('click', () => open(it));
    row.appendChild(it.btn);
    [].concat(it.hit ?? it.k).forEach(k => panel.g.querySelectorAll(`[data-k="${k}"]`).forEach(n => {
      n.classList.add('explore-hot');
      n.addEventListener('click', () => open(it));
    }));
  });
  box.append(row, detail);
  card.appendChild(box);
  panel.focus(null);
  return card;
}
