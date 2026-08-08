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
  const controls = el('div', { class: 'stage-controls' });
  stageEl.appendChild(controls);

  /* ---------- focus: spotlight one thing and name it ----------
     A translucent paper scrim covers the stage, then the focused nodes are
     re-appended above it. Dimming by opacity instead would multiply down
     through nested groups; raising the real nodes keeps them at full strength
     however deeply they sit, and their event handlers survive the move. */
  let scrim = null, raised = [], marks = null;

  function clearFocus(){
    // restore in reverse so each insertBefore sees a sibling that is already home
    for (let i = raised.length - 1; i >= 0; i--){
      const { node, parent, next } = raised[i];
      parent.insertBefore(node, next);
    }
    raised = [];
    if (marks){ marks.remove(); marks = null; }
    if (scrim){ scrim.remove(); scrim = null; }
  }

  /* focus(target|[targets], { label, at, ring }) — at is the side the label sits
     on: 'top' (default), 'bottom', 'left', 'right'. */
  function focus(target, opts = {}){
    clearFocus();
    const list = (Array.isArray(target) ? target : [target]).filter(Boolean);
    if (!list.length) return;

    scrim = svgEl('rect', { x: 0, y: 0, width: W, height: H, class: 'focus-scrim' });
    svg.appendChild(scrim);

    const box = unionBox(list.map(n => bboxIn(svg, n)));
    // record every original position BEFORE moving any of them
    list.forEach(node => raised.push({ node, parent: node.parentNode, next: node.nextSibling }));
    raised.forEach(({ node }) => svg.appendChild(node));

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
      const at = opts.at || 'top';
      const gap = 26, pad = 9;
      const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
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
      // keep the label inside the stage
      tx = Math.max(14, Math.min(W - 14, tx));
      ty = Math.max(16, Math.min(H - 10, ty));
      marks.appendChild(svgEl('line', { x1, y1, x2, y2, class: 'focus-leader' }));
      const t = svgEl('text', { x: tx, y: ty, 'text-anchor': anchor, class: 'focus-label' });
      t.textContent = opts.label;
      marks.appendChild(t);
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
      return { node, cx, cy, s, orig: node.getAttribute('transform') || '' };
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
