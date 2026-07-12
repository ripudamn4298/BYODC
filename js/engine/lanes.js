// BYODC engine — Act 4 GPU vocabulary, paper style.
// LaneGrid (stamped mini-ALU tiles with activity lamps), RaceTrack (serial vs
// parallel progress), Roofline (a balance beam: compute demand vs memory supply).
import { el, svgEl, clamp } from './util.js';
import { SFX } from './sfx.js';

/* ---------- LaneGrid: rows×cols of identical lanes, each with an activity lamp ---------- */
export function makeLaneGrid(svg, { x = 150, y = 120, cols = 4, rows = 4, cell = 66, gap = 8 } = {}){
  const g = svgEl('g');
  const lanes = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++){
    const lx = x + c * (cell + gap), ly = y + r * (cell + gap);
    const rect = svgEl('rect', { x: lx, y: ly, width: cell, height: cell, rx: 4, class: 'lane' });
    const lamp = svgEl('circle', { cx: lx + cell - 11, cy: ly + 11, r: 4, class: 'lane-lamp' });
    const val = svgEl('text', { x: lx + cell / 2, y: ly + cell / 2 + 5, class: 'lane-val' }); val.textContent = '';
    g.append(rect, lamp, val);
    lanes.push({ i: r * cols + c, rect, lamp, val, x: lx, y: ly });
  }
  svg.appendChild(g);
  return {
    g, lanes,
    setActive(i, on){ lanes[i] && lanes[i].lamp.classList.toggle('on', !!on); },
    setValue(i, v){ if (lanes[i]) lanes[i].val.textContent = v == null ? '' : String(v); },
    flashAll(on = true){ lanes.forEach(l => l.lamp.classList.toggle('on', on)); },
    setOdd(i, on){ lanes[i] && lanes[i].rect.classList.toggle('odd', !!on); },
  };
}

/* ---------- RaceTrack: two horizontal progress bars, serial vs parallel ---------- */
export function makeRaceTrack(svg, { x = 120, y = 150, w = 480, gap = 90 } = {}){
  const g = svgEl('g');
  function lane(ly, label){
    g.appendChild(svgEl('text', { x, y: ly - 12, class: 'rail-t' })).textContent = label;
    g.appendChild(svgEl('rect', { x, y: ly, width: w, height: 20, rx: 3, class: 'race-track' }));
    const fill = svgEl('rect', { x, y: ly, width: 0, height: 20, rx: 3, class: 'race-fill' });
    const tick = svgEl('text', { x: x + w + 10, y: ly + 15, class: 'lbl-faint', 'text-anchor': 'start' }); tick.textContent = '';
    g.append(fill, tick);
    return { fill, tick };
  }
  svg.appendChild(g);
  const serial = lane(y, 'ONE WORKER — SERIAL');
  const parallel = lane(y + gap, 'MANY WORKERS — PARALLEL');
  return {
    g,
    set(which, frac, cyclesLabel){
      const L = which === 'serial' ? serial : parallel;
      L.fill.setAttribute('width', String(clamp(frac, 0, 1) * w));
      if (cyclesLabel != null) L.tick.textContent = cyclesLabel;
    },
    reset(){ serial.fill.setAttribute('width', '0'); parallel.fill.setAttribute('width', '0'); serial.tick.textContent = ''; parallel.tick.textContent = ''; },
  };
}

/* ---------- Roofline: a balance beam — compute demand (left) vs memory supply (right) ---------- */
export function makeRoofline(svg, { cx = 360, cy = 230, beam = 240 } = {}){
  const g = svgEl('g');
  const pivotY = cy + 70;
  g.appendChild(svgEl('path', { d: `M${cx - 26} ${pivotY + 44} H${cx + 26} L${cx} ${pivotY} Z`, class: 'beam-pivot' }));
  const beamG = svgEl('g', { class: 'beam' });
  beamG.appendChild(svgEl('line', { x1: cx - beam / 2, y1: pivotY, x2: cx + beam / 2, y2: pivotY, class: 'beam-bar' }));
  const leftPan = svgEl('g'), rightPan = svgEl('g');
  const mkPan = (pan, px, label) => {
    pan.appendChild(svgEl('line', { x1: px, y1: pivotY, x2: px, y2: pivotY + 30, class: 'beam-cord' }));
    const bar = svgEl('rect', { x: px - 30, y: pivotY + 30, width: 60, height: 8, class: 'beam-pan' });
    const t = svgEl('text', { x: px, y: pivotY + 58, class: 'lbl-faint' }); t.textContent = label;
    pan.append(bar, t);
    return bar;
  };
  const leftBar = mkPan(leftPan, cx - beam / 2, 'COMPUTE');
  const rightBar = mkPan(rightPan, cx + beam / 2, 'MEMORY');
  beamG.append(leftPan, rightPan);
  g.appendChild(beamG);
  const util = svgEl('text', { x: cx, y: pivotY - 46, class: 'lbl-strong' }); util.textContent = '';
  g.appendChild(util);
  svg.appendChild(g);

  return {
    g,
    // demand = compute need, supply = memory feed (both 0..1 scale)
    set(demand, supply){
      const u = clamp(supply / Math.max(demand, 0.001), 0, 1);
      const tilt = clamp((demand - supply) * 14, -12, 12);   // heavier compute → tilts left-down
      beamG.setAttribute('transform', `rotate(${tilt} ${cx} ${pivotY})`);
      leftBar.setAttribute('width', String(20 + demand * 60));
      leftBar.setAttribute('x', String(cx - beam / 2 - (20 + demand * 60) / 2));
      rightBar.setAttribute('width', String(20 + supply * 60));
      rightBar.setAttribute('x', String(cx + beam / 2 - (20 + supply * 60) / 2));
      const starving = u < 0.88;
      util.textContent = `${Math.round(u * 100)}% FED`;
      util.classList.toggle('starving', starving);
      return { util: u, starving };
    },
  };
}
