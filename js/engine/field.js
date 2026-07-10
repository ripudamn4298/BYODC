// BYODC engine — wandering free carriers (electrons / holes) inside a bounded region
import { svgEl, rand, RM } from './util.js';
import { Anim } from './anim.js';

export class Field {
  constructor(svg, layer){
    this.layer = layer || svgEl('g', { class: 'field-layer', 'pointer-events': 'none' });
    if (!layer) svg.appendChild(this.layer);
    this.parts = []; this.drift = 0;
    this.ticker = Anim.add(dt => this.tick(dt));
  }
  spawn({ x, y, kind = 'e', bounds }){
    const isE = kind === 'e';
    const c = svgEl('circle', { cx: x, cy: y, r: isE ? 4.3 : 5, class: isE ? 'electron' : 'hole' });
    c.classList.add('pop-in');
    this.layer.appendChild(c);
    const p = { x, y, vx: rand(-22, 22), vy: rand(-22, 22), c, bounds };
    this.parts.push(p);
    return p;
  }
  removeOne(){ const p = this.parts.pop(); if (p) p.c.remove(); }
  clear(){ this.parts.forEach(p => p.c.remove()); this.parts = []; }
  setDrift(v){ this.drift = v; }
  tick(dt){
    for (const p of this.parts){
      p.vx += (Math.random() - .5) * 150 * dt + (this.drift - p.vx) * 1.1 * dt;
      p.vy += (Math.random() - .5) * 150 * dt + (0 - p.vy) * .9 * dt;
      const sp = Math.hypot(p.vx, p.vy), mx = this.drift ? 100 : 52;
      if (sp > mx){ p.vx *= mx / sp; p.vy *= mx / sp; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      const b = p.bounds;
      if (b){
        if (this.drift){
          if (p.x > b.x + b.w) p.x = b.x;
          if (p.x < b.x) p.x = b.x + b.w;
        } else {
          if (p.x < b.x){ p.x = b.x; p.vx *= -1; }
          if (p.x > b.x + b.w){ p.x = b.x + b.w; p.vx *= -1; }
        }
        if (p.y < b.y){ p.y = b.y; p.vy *= -1; }
        if (p.y > b.y + b.h){ p.y = b.y + b.h; p.vy *= -1; }
      }
      p.c.setAttribute('cx', p.x); p.c.setAttribute('cy', p.y);
    }
  }
  destroy(){ Anim.remove(this.ticker); this.layer.remove(); }
}
