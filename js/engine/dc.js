// BYODC engine — Act 5 data-centre vocabulary, paper style.
// RackElevation (a rack that fills with node sleds), TopoBoard (nodes + switches
// with click-to-wire links + reachability check — generalises Act 2 step 3's pin
// wirer), PowerLadder (stacked budget bar: IT load / cooling / losses).
import { el, svgEl, clamp, svgPt } from './util.js';
import { SFX } from './sfx.js';

/* ---------- RackElevation: a tall rack; add sleds to fill it, watch power climb ---------- */
export function makeRackElevation(svg, { x = 120, y = 70, w = 150, slots = 8, slotH = 40 } = {}){
  const g = svgEl('g');
  const h = slots * slotH + 20;
  g.appendChild(svgEl('rect', { x, y, width: w, height: h, rx: 4, class: 'rack-frame' }));
  const sleds = [];
  for (let i = 0; i < slots; i++){
    const sy = y + 10 + i * slotH;
    const sled = svgEl('rect', { x: x + 8, y: sy, width: w - 16, height: slotH - 6, rx: 2, class: 'sled' });
    const dots = svgEl('g');
    for (let k = 0; k < 8; k++) dots.appendChild(svgEl('circle', { cx: x + 22 + k * 14, cy: sy + (slotH - 6) / 2, r: 2.4, class: 'sled-gpu' }));
    g.append(sled, dots);
    sleds.push({ sled, dots, on: false });
  }
  svg.appendChild(g);
  return {
    g, sleds,
    fill(n){ sleds.forEach((s, i) => { s.on = i < n; s.sled.classList.toggle('on', s.on); s.dots.classList.toggle('on', s.on); }); },
  };
}

/* ---------- PowerLadder: budget a feed across IT load / cooling / losses ---------- */
/* opts.labels draws the rung names (IT LOAD / COOLING / LOSSES) down the left of the bar.
   It is OPT-IN and off by default on purpose: `segs[].label` went years unrendered, so
   every existing caller already draws its own, and switching the component on for them
   would double every label and shift `g.children` under any caller reading it positionally.
   Prefer the named handles this returns over `g.children` — that is what broke. */
export function makePowerLadder(svg, { x = 470, y = 90, w = 130, h = 300, capMW = 30, labels = false } = {}){
  const g = svgEl('g');
  const frame = svgEl('rect', { x, y, width: w, height: h, rx: 3, class: 'ladder-frame' });
  g.appendChild(frame);
  const segs = [
    { key: 'it', label: 'IT LOAD', cls: 'seg-it' },
    { key: 'cool', label: 'COOLING', cls: 'seg-cool' },
    { key: 'loss', label: 'LOSSES', cls: 'seg-loss' },
  ];
  const rects = {}, segT = {};
  /* The caption sits BELOW the bar. Above it, an over-limit stack grows straight
     over the text: at 30 MW of IT load on air the stack reaches 44.3 MW and painted
     right across "44.3 MW DRAWN". */
  const caption = svgEl('text', { x: x + w / 2, y: y + h + 20, class: 'lbl-strong' });
  caption.textContent = '';
  segs.forEach(s => {
    rects[s.key] = svgEl('rect', { x: x + 2, y, width: w - 4, height: 0, class: 'ladder-seg ' + s.cls });
    g.appendChild(rects[s.key]);
  });
  const limit = svgEl('line', { x1: x - 6, y1: y, x2: x + w + 6, y2: y, class: 'ladder-limit' });
  const limitT = svgEl('text', { x: x + w + 10, y: y + 4, class: 'lbl-faint' });
  limitT.style.textAnchor = 'start';
  g.append(limit, limitT, caption);
  if (labels) segs.forEach(s => {
    segT[s.key] = svgEl('text', { x: x - 10, y, class: 'lbl-faint' });
    segT[s.key].style.textAnchor = 'end';
    segT[s.key].textContent = s.label;
    segT[s.key].setAttribute('opacity', '0');
    g.appendChild(segT[s.key]);      // appended last, so earlier children keep their order
  });
  svg.appendChild(g);

  return {
    g, frame, rects, limit, limitLabel: limitT, segLabels: segT, caption,
    // values in MW; limitMW draws the red line the stack must stay under
    set({ it = 0, cool = 0, loss = 0 } = {}, limitMW = capMW){
      const total = it + cool + loss;
      const px = mw => (mw / capMW) * h;
      let yc = y + h;
      [['it', it], ['cool', cool], ['loss', loss]].forEach(([k, v]) => {
        const ph = px(v); yc -= ph;
        rects[k].setAttribute('y', String(yc)); rects[k].setAttribute('height', String(Math.max(0, ph)));
        if (segT[k]){        // a rung shorter than ~13px cannot hold its own label legibly
          segT[k].setAttribute('y', String(yc + ph / 2 + 3.5));
          segT[k].setAttribute('opacity', ph >= 13 ? '1' : '0');
        }
      });
      const ly = y + h - px(limitMW);
      limit.setAttribute('y1', String(ly)); limit.setAttribute('y2', String(ly));
      // the label used to keep its construction-time y, so it only ever sat on the
      // line when limitMW happened to equal capMW
      limitT.setAttribute('y', String(ly + 4));
      limitT.textContent = `${limitMW} MW LIMIT`;
      const over = total > limitMW + 0.01;
      caption.textContent = `${total.toFixed(1)} MW DRAWN`;
      caption.classList.toggle('over', over);
      return { total, over };
    },
  };
}

/* ---------- TopoBoard: nodes + switches, click-to-wire links, reachability ---------- */
export function makeTopoBoard(svg){
  const g = svgEl('g');
  const linkLayer = svgEl('g'), nodeLayer = svgEl('g');
  g.append(linkLayer, nodeLayer);
  svg.appendChild(g);
  const nodes = [];       // {id, x, y, kind, el, dead}
  const links = [];       // {a, b, el}

  function addNode(id, x, y, kind = 'rack', label = ''){
    const ng = svgEl('g', { class: 'topo-node ' + kind, 'data-node': id });
    // The switch box was 40 units wide, so a label like "SWITCH 1" overflowed the very box
    // it named. Widen the box to hold it rather than moving the label out: above the box is
    // where focus labels land, and putting it there had them printing over each other.
    const shape = kind === 'switch'
      ? svgEl('rect', { x: x - 31, y: y - 14, width: 62, height: 28, rx: 3, class: 'node-box' })
      : svgEl('circle', { cx: x, cy: y, r: 15, class: 'node-box' });
    ng.appendChild(shape);
    if (label){
      const t = svgEl('text', { x, y: y + (kind === 'switch' ? 4 : 30), class: 'lbl-faint' });
      t.textContent = label; ng.appendChild(t);
    }
    nodeLayer.appendChild(ng);
    const node = { id, x, y, kind, el: ng, shape, dead: false };
    nodes.push(node);
    return node;
  }
  function linkExists(a, b){ return links.some(l => (l.a === a && l.b === b) || (l.a === b && l.b === a)); }
  function drawLink(a, b, cls = ''){
    const na = nodes.find(n => n.id === a), nb = nodes.find(n => n.id === b);
    const line = svgEl('line', { x1: na.x, y1: na.y, x2: nb.x, y2: nb.y, class: 'topo-link ' + cls });
    linkLayer.appendChild(line);
    const link = { a, b, el: line };
    links.push(link);
    return link;
  }
  function killNode(id){ const n = nodes.find(x => x.id === id); if (n){ n.dead = true; n.el.classList.add('dead'); links.forEach(l => { if ((l.a === id || l.b === id)) l.el.classList.add('dead'); }); } }

  /* reachability: can every non-dead RACK reach every other in ≤ maxHops switch hops? */
  function allReachable(maxHops = 2){
    const racks = nodes.filter(n => n.kind === 'rack' && !n.dead).map(n => n.id);
    const adj = {};
    nodes.forEach(n => { if (!n.dead) adj[n.id] = []; });
    links.forEach(l => { const na = nodes.find(n => n.id === l.a), nb = nodes.find(n => n.id === l.b); if (na.dead || nb.dead) return; adj[l.a]?.push(l.b); adj[l.b]?.push(l.a); });
    // BFS hop count in the graph; "switch hops" ≈ path length through switches
    for (const s of racks){
      const dist = { [s]: 0 }; const q = [s];
      while (q.length){ const u = q.shift(); for (const v of (adj[u] || [])) if (dist[v] === undefined){ dist[v] = dist[u] + 1; q.push(v); } }
      for (const t of racks) if (t !== s){ if (dist[t] === undefined || dist[t] > maxHops + 1) return false; }
    }
    return true;
  }

  /* interactive wiring: click node A then node B to draw a link. onLink(a,b) callback. */
  let armed = null;
  function enableWiring(onLink, { validPair } = {}){
    /* display:none while idle. With no x1/y1/x2/y2 the line defaults to 0,0, which
       is inside the board group's bbox — so focusing the group measured a box that
       reached the stage origin and the ring landed in the corner. Invisible in the
       DOM, obvious on a render. */
    const preview = svgEl('line', { class: 'topo-link preview', opacity: 0, x1: 0, y1: 0, x2: 0, y2: 0 });
    preview.style.display = 'none';
    linkLayer.appendChild(preview);
    svg.addEventListener('pointermove', e => {
      if (armed == null) return;
      const p = svgPt(svg, e.clientX, e.clientY); const na = nodes.find(n => n.id === armed);
      preview.setAttribute('x1', na.x); preview.setAttribute('y1', na.y);
      preview.setAttribute('x2', p.x); preview.setAttribute('y2', p.y);
      preview.setAttribute('opacity', 1); preview.style.display = '';
    });
    const hidePreview = () => { preview.setAttribute('opacity', 0); preview.style.display = 'none'; };
    nodes.forEach(node => {
      node.el.style.cursor = 'pointer';
      node.el.addEventListener('click', () => {
        SFX.click();
        if (armed == null){ armed = node.id; node.el.classList.add('armed'); return; }
        if (armed === node.id){ node.el.classList.remove('armed'); armed = null; hidePreview(); return; }
        const a = armed, b = node.id;
        nodes.find(n => n.id === a).el.classList.remove('armed');
        armed = null; hidePreview();
        if (linkExists(a, b)) return;
        if (validPair && !validPair(a, b)) return;
        drawLink(a, b); onLink && onLink(a, b);
      });
    });
  }

  return { g, nodes, links, addNode, drawLink, killNode, allReachable, enableWiring, linkExists };
}
