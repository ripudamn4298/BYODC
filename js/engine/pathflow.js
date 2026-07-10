// BYODC engine — things that travel along an SVG path.
// PathFlow: physical carriers (dots, e.g. electron flow in step 1).
// CurrentFlow: CONVENTIONAL CURRENT — ink chevrons '›' oriented along the path.
// Both accept speed<0 to travel against the path's drawn direction.
import { svgEl, RM } from './util.js';
import { Anim } from './anim.js';

class BaseFlow {
  constructor(path, n, layer){
    this.path = path; this.len = path.getTotalLength();
    this.speed = 0; this.off = 0; this.n = n;
    this.parent = layer || path.parentNode;
    this.items = [];
    this.ticker = Anim.add(dt => this.tick(dt));
  }
  setSpeed(v){
    this.speed = v;
    if (v === 0) this.items.forEach(d => d.setAttribute('opacity', 0));
    else this.renderAt(this.off);   // position immediately — no blank first frame
  }
  place(item, L){ /* override */ }
  renderAt(off){
    this.items.forEach((d, i) => {
      if (this.speed === 0){ d.setAttribute('opacity', 0); return; }
      const L = ((off + i * this.len / this.n) % this.len + this.len) % this.len;
      this.place(item => item, L, d);
      d.setAttribute('opacity', .95);
    });
  }
  tick(dt){
    if (this.speed === 0) return;
    this.off = (this.off + this.speed * dt) % this.len;
    this.renderAt(this.off);
  }
  destroy(){ Anim.remove(this.ticker); this.items.forEach(d => d.remove()); }
}

export class PathFlow extends BaseFlow {
  constructor(path, { n = 13, r = 3, layer, cls = 'flow-dot' } = {}){
    super(path, n, layer);
    for (let i = 0; i < n; i++){
      const d = svgEl('circle', { r, class: cls, opacity: 0 });
      this.parent.appendChild(d); this.items.push(d);
    }
  }
  place(_, L, d){
    const pt = this.path.getPointAtLength(L);
    d.setAttribute('cx', pt.x); d.setAttribute('cy', pt.y);
  }
}

export class CurrentFlow extends BaseFlow {
  constructor(path, { n = 12, size = 4.6, layer, cls = 'chev' } = {}){
    super(path, n, layer);
    this.size = size;
    for (let i = 0; i < n; i++){
      const d = svgEl('path', { class: cls, opacity: 0, d: `M${-size} ${-size} L0 0 L${-size} ${size}` });
      this.parent.appendChild(d); this.items.push(d);
    }
  }
  place(_, L, d){
    const pt = this.path.getPointAtLength(L);
    const ahead = this.path.getPointAtLength(Math.min(this.len, L + 1.5));
    const behind = this.path.getPointAtLength(Math.max(0, L - 1.5));
    let ang = Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180 / Math.PI;
    if (this.speed < 0) ang += 180;
    d.setAttribute('transform', `translate(${pt.x},${pt.y}) rotate(${ang})`);
  }
}
