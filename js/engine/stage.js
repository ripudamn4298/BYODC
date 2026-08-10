// BYODC engine — fresh stage per step: 720×480 SVG + controls row, plus the
// micro-learning helpers from DESIGN_MAKEOVER.md §4: focus/label (rule 2) and
// packInto (rule 5, "transitions are shown, not told").
import { $, el, svgEl, svgPt } from './util.js';
import { Anim } from './anim.js';

const W = 720, H = 480;

/* Bounding box of a node in the stage's own user units. getBoundingClientRect
   respects every enclosing transform, which getBBox does not; fall back to
   getBBox when layout hasn't happened yet (hidden tab, detached node). */
function bboxIn(svg, node){
  try {
    const r = node.getBoundingClientRect();
    if ((r.width || r.height) && svg.getScreenCTM()){
      const a = svgPt(svg, r.left, r.top), b = svgPt(svg, r.right, r.bottom);
      return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
    }
  } catch { /* not laid out yet — fall through to the untransformed box */ }
  try {
    const b = node.getBBox();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  } catch { return { x: 0, y: 0, w: 0, h: 0 }; }
}

function unionBox(boxes){
  const x = Math.min(...boxes.map(b => b.x)), y = Math.min(...boxes.map(b => b.y));
  const r = Math.max(...boxes.map(b => b.x + b.w)), bt = Math.max(...boxes.map(b => b.y + b.h));
  return { x, y, w: r - x, h: bt - y };
}

export function newStage(numeral, label){
  Anim.clear();
  const stageEl = $('#stage');
  stageEl.innerHTML = '<span class="tk"></span>';
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'stage-svg', role: 'img', 'aria-label': label || '' });
  if (numeral){
    const wm = svgEl('text', { x: 702, y: 452, 'text-anchor': 'end', class: 'wm' });
    wm.textContent = numeral; svg.appendChild(wm);
  }
  stageEl.appendChild(svg);
  /* Any focusable stage element (steps give atoms, slots and tiles a tabindex for keyboard
     play) keeps its :focus-visible ring after a real click, leaving a bright box on
     something no card is talking about. Drop it for pointer-driven interaction only —
     e.detail is 0 for a keyboard-generated activation, so keyboard focus still shows. */
  svg.addEventListener('pointerdown', e => {
    const a = document.activeElement;
    if (e.isTrusted && a && a !== document.body && svg.contains(a)) a.blur();
  }, true);
  const controls = el('div', { class: 'stage-controls' });
  stageEl.appendChild(controls);

  /* ---------- focus: spotlight one thing and name it ----------
     Nothing is re-parented. We walk from each target up to the SVG root and dim
     only the SIBLINGS along that path, so no ancestor of a target is ever dimmed
     and the dimming cannot multiply down onto it. That leaves every node exactly
     where it was, which is what the old raise-above-a-scrim approach could not
     do: raising broke click listeners on ancestor groups, dropped the parent's
     transform (flinging the node into a corner), and made clearFocus throw
     NotFoundError when the focus list was not in document order. */
  let dimmed = [], marks = null;

  function clearFocus(){
    for (const { node, prev } of dimmed){
      node.classList.remove('dimmed');
      if (prev) node.style.opacity = prev; else node.style.removeProperty('opacity');
    }
    dimmed = [];
    if (marks){ marks.remove(); marks = null; }
  }

  /* focus(target|[targets], { label, at, ring }) — at is the side the label sits
     on: 'top' (default), 'bottom', 'left', 'right'. */
  function focus(target, opts = {}){
    clearFocus();
    const list = (Array.isArray(target) ? target : [target]).filter(Boolean);
    if (!list.length) return;

    const box = unionBox(list.map(n => bboxIn(svg, n)));

    // every node on an ancestor path from a target up to the root stays lit
    const keep = new Set(), targets = new Set(list);
    for (const n of list){
      let p = n;
      while (p && p !== svg){ keep.add(p); p = p.parentNode; }
    }
    /* Dimming may only ever REDUCE. A step that pre-hides a node with opacity 0 (a
       caption it reveals later) would otherwise have it raised to .25 and spoiled the
       moment: the old raise-above-a-scrim focus left such nodes invisible, so this is
       a trap the new approach introduces if you write .25 unconditionally. */
    const dim = node => {
      const inline = node.style.opacity;
      let cur = inline !== '' ? parseFloat(inline) : NaN;
      if (Number.isNaN(cur)){
        const c = getComputedStyle(node).opacity;
        cur = c === '' ? 1 : parseFloat(c);
      }
      if (!(cur > 0.25)) return;      // already at or under the dim level, or hidden
      dimmed.push({ node, prev: inline || '' });
      node.classList.add('dimmed');
      node.style.opacity = '.25';     // inline, so a class on the node cannot beat it
    };
    (function walk(parent){
      for (const child of Array.from(parent.children)){
        if (targets.has(child)) continue;          // a target: leave its subtree alone
        if (keep.has(child)) walk(child);          // on the path: recurse, never dim
        else dim(child);
      }
    })(svg);

    marks = svgEl('g', { class: 'focus-marks' });
    svg.appendChild(marks);

    if (opts.ring !== false){
      const p = 9;
      marks.appendChild(svgEl('rect', {
        x: box.x - p, y: box.y - p, width: box.w + p * 2, height: box.h + p * 2,
        rx: 4, class: 'focus-ring',
      }));
    }

    if (opts.label){
      const gap = 26, pad = 9;
      const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
      /* Flip to the opposite side when the requested one has no room, rather than
         clamping — clamping used to slide the text back on top of the very thing
         it is naming. Only if BOTH sides are tight do we clamp, and then the
         label sits outside the box because the flip already picked the roomier one. */
      const room = { top: box.y, bottom: H - (box.y + box.h), left: box.x, right: W - (box.x + box.w) };
      const need = { top: gap + 6, bottom: gap + 14, left: gap + 10, right: gap + 10 };
      const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
      let at = opts.at || 'top';
      if (room[at] < need[at] && room[opposite[at]] >= need[opposite[at]]) at = opposite[at];

      let tx, ty, anchor = 'middle', x1, y1, x2, y2;
      if (at === 'top'){
        tx = cx; ty = box.y - gap; x1 = cx; y1 = ty + 5; x2 = cx; y2 = box.y - pad;
      } else if (at === 'bottom'){
        tx = cx; ty = box.y + box.h + gap + 4; x1 = cx; y1 = ty - 12; x2 = cx; y2 = box.y + box.h + pad;
      } else if (at === 'left'){
        tx = box.x - gap; ty = cy + 4; anchor = 'end'; x1 = tx + 6; y1 = cy; x2 = box.x - pad; y2 = cy;
      } else {
        tx = box.x + box.w + gap; ty = cy + 4; anchor = 'start'; x1 = tx - 6; y1 = cy; x2 = box.x + box.w + pad; y2 = cy;
      }
      // final safety clamp, kept off the box itself on the axis the label sits on
      if (at === 'top' || at === 'bottom'){
        tx = Math.max(14, Math.min(W - 14, tx));
        ty = at === 'top' ? Math.max(12, ty) : Math.min(H - 6, ty);
      } else {
        ty = Math.max(16, Math.min(H - 10, ty));
        tx = at === 'left' ? Math.max(14, tx) : Math.min(W - 14, tx);
      }
      marks.appendChild(svgEl('line', { x1, y1, x2, y2, class: 'focus-leader' }));
      const t = svgEl('text', { x: tx, y: ty, class: 'focus-label' });
      t.style.textAnchor = anchor;      // CSS wins over the presentation attribute
      t.textContent = opts.label;
      marks.appendChild(t);

      /* Clamping the anchor is not enough: a middle-anchored label still hangs half its
         width past the edge, which is how "COST PER GOOD DIE" rendered as "…GOOD DI".
         Measure the drawn text and slide the whole box back inside the stage. */
      let tw = 0;
      try { tw = t.getComputedTextLength(); } catch { /* not laid out yet */ }
      if (tw > 0){
        const edge = 6;
        const left = anchor === 'middle' ? tx - tw / 2 : anchor === 'end' ? tx - tw : tx;
        const right = left + tw;
        let shift = 0;
        if (right > W - edge) shift = (W - edge) - right;
        if (left + shift < edge) shift = edge - left;
        if (shift) t.setAttribute('x', String(tx + shift));
      }
    }
  }

  /* ---------- packInto: watch N things become one thing ----------
     Every node slides and shrinks into `box`, fading as it goes. Used for the
     "eight adders become one lane" beat so the player never meets a diagram
     they did not see arrive. */
  async function packInto(nodes, box, { dur = 620, fade = true, scale } = {}){
    const list = nodes.filter(Boolean);
    if (!list.length) return;
    const tcx = box.x + box.w / 2, tcy = box.y + box.h / 2;
    const items = list.map(node => {
      const b = bboxIn(svg, node);
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      const s = scale != null ? scale : (b.w > 0 ? Math.min(1, (box.w * 0.5) / b.w) : 0.4);
      /* A CSS `style.transform` beats the transform attribute outright, so a node
         positioned that way would sit still while we animated the attribute. Fold
         the computed matrix into the attribute and drop the style, so the base we
         compose against is whatever the node is actually showing right now. */
      let orig = node.getAttribute('transform') || '';
      if (node.style && node.style.transform){
        let m = '';
        try { m = getComputedStyle(node).transform; } catch { /* detached */ }
        node.style.removeProperty('transform');
        if (m && m !== 'none'){ orig = m; node.setAttribute('transform', m); }
      }
      return { node, cx, cy, s, orig };
    });
    await Anim.tween(dur, p => {
      items.forEach(({ node, cx, cy, s, orig }) => {
        const dx = (tcx - cx) * p, dy = (tcy - cy) * p;
        const sc = 1 + (s - 1) * p;
        node.setAttribute('transform',
          `translate(${dx.toFixed(2)} ${dy.toFixed(2)}) translate(${cx} ${cy}) scale(${sc.toFixed(4)}) translate(${-cx} ${-cy}) ${orig}`);
        if (fade) node.style.opacity = String(1 - p * 0.92);
      });
    });
    if (fade) list.forEach(n => { n.style.display = 'none'; });
  }

  return { svg, controls, stageEl, focus, clearFocus, packInto, bbox: n => bboxIn(svg, n) };
}
