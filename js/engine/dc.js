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
export function makePowerLadder(svg, { x = 470, y = 90, w = 130, h = 300, capMW = 30 } = {}){
  const g = svgEl('g');
  g.appendChild(svgEl('rect', { x, y, width: w, height: h, rx: 3, class: 'ladder-frame' }));
  const segs = [
    { key: 'it', label: 'IT LOAD', cls: 'seg-it' },
    { key: 'cool', label: 'COOLING', cls: 'seg-cool' },
    { key: 'loss', label: 'LOSSES', cls: 'seg-loss' },
  ];
  const rects = {}, caption = svgEl('text', { x: x + w / 2, y: y - 10, class: 'lbl-strong' });
  caption.textContent = '';
  segs.forEach(s => { rects[s.key] = svgEl('rect', { x: x + 2, y, width: w - 4, height: 0, class: 'ladder-seg ' + s.cls }); g.appendChild(rects[s.key]); });
  const limit = svgEl('line', { x1: x - 6, y1: y, x2: x + w + 6, y2: y, class: 'ladder-limit' });
  const limitT = svgEl('text', { x: x + w + 10, y: y + 4, class: 'lbl-faint', 'text-anchor': 'start' });
  g.append(limit, limitT, caption);
  svg.appendChild(g);

  return {
    g,
    // values in MW; limitMW draws the red line the stack must stay under
    set({ it = 0, cool = 0, loss = 0 } = {}, limitMW = capMW){
      const total = it + cool + loss;
      const px = mw => (mw / capMW) * h;
      let yc = y + h;
      [['it', it], ['cool', cool], ['loss', loss]].forEach(([k, v]) => {
        const ph = px(v); yc -= ph;
        rects[k].setAttribute('y', String(yc)); rects[k].setAttribute('height', String(Math.max(0, ph)));
      });
      const ly = y + h - px(limitMW);
      limit.setAttribute('y1', String(ly)); limit.setAttribute('y2', String(ly));
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
    const shape = kind === 'switch'
      ? svgEl('rect', { x: x - 20, y: y - 14, width: 40, height: 28, rx: 3, class: 'node-box' })
      : svgEl('circle', { cx: x, cy: y, r: 15, class: 'node-box' });
    ng.appendChild(shape);
    if (label){ const t = svgEl('text', { x, y: y + (kind === 'switch' ? 4 : 30), class: 'lbl-faint' }); t.textContent = label; ng.appendChild(t); }
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
    const preview = svgEl('line', { class: 'topo-link preview', opacity: 0 });
    linkLayer.appendChild(preview);
    svg.addEventListener('pointermove', e => {
      if (armed == null) return;
      const p = svgPt(svg, e.clientX, e.clientY); const na = nodes.find(n => n.id === armed);
      preview.setAttribute('x1', na.x); preview.setAttribute('y1', na.y);
      preview.setAttribute('x2', p.x); preview.setAttribute('y2', p.y); preview.setAttribute('opacity', 1);
    });
    nodes.forEach(node => {
      node.el.style.cursor = 'pointer';
      node.el.addEventListener('click', () => {
        SFX.click();
        if (armed == null){ armed = node.id; node.el.classList.add('armed'); return; }
        if (armed === node.id){ node.el.classList.remove('armed'); armed = null; preview.setAttribute('opacity', 0); return; }
        const a = armed, b = node.id;
        nodes.find(n => n.id === a).el.classList.remove('armed');
        armed = null; preview.setAttribute('opacity', 0);
        if (linkExists(a, b)) return;
        if (validPair && !validPair(a, b)) return;
        drawLink(a, b); onLink && onLink(a, b);
      });
    });
  }

  return { g, nodes, links, addNode, drawLink, killNode, allReachable, enableWiring, linkExists };
}
