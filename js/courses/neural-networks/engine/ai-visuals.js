import { el, svgEl, clamp } from '../../../engine/util.js';

export function label(svg, x, y, text, cls = 'ai-label', anchor = 'middle'){
  const node = svgEl('text', { x, y, class: cls, 'text-anchor': anchor });
  node.textContent = text; svg.appendChild(node); return node;
}

export function drawNetwork(svg, layers, { x = 90, y = 70, w = 540, h = 320 } = {}){
  const root = svgEl('g', { class: 'ai-network' });
  const nodes = [], links = [];
  const cols = layers.length;
  const positions = layers.map((count, col) => Array.from({ length: count }, (_, row) => ({
    x: x + (cols === 1 ? 0 : col * w / (cols - 1)),
    y: y + (row + 1) * h / (count + 1), col, row,
  })));
  for (let col = 0; col < positions.length - 1; col++){
    positions[col].forEach(from => positions[col + 1].forEach(to => {
      const line = svgEl('line', { x1: from.x, y1: from.y, x2: to.x, y2: to.y, class: 'ai-link' });
      root.appendChild(line); links.push(line);
    }));
  }
  positions.flat().forEach(pos => {
    const circle = svgEl('circle', { cx: pos.x, cy: pos.y, r: 18, class: 'ai-node' });
    root.appendChild(circle); nodes.push(circle);
  });
  svg.appendChild(root);
  return {
    root, nodes, links, positions,
    activate(count = nodes.length){
      nodes.forEach((node, index) => node.classList.toggle('active', index < count));
      links.forEach((link, index) => link.classList.toggle('active', index % Math.max(1, Math.floor(links.length / Math.max(1, count))) === 0));
    },
    setWeights(values){ links.forEach((link, index) => link.style.setProperty('--weight', clamp(values[index % values.length] || .2, .1, 1))); },
  };
}

export function makeSignalBoard(svg, { values = [0.8, 0.3], weights = [0.6, -0.2], threshold = 0 } = {}){
  label(svg, 150, 75, 'INPUT SIGNALS'); label(svg, 360, 75, 'NEURON'); label(svg, 575, 75, 'PREDICTION');
  const root = svgEl('g');
  const inputNodes = [150, 255].map((cy, index) => {
    const c = svgEl('circle', { cx: 150, cy, r: 31, class: 'ai-input' });
    const t = svgEl('text', { x: 150, y: cy + 5, class: 'ai-value', 'text-anchor': 'middle' });
    t.textContent = values[index].toFixed(1); root.append(c, t); return { c, t };
  });
  const links = [150, 255].map((cy, index) => {
    const line = svgEl('line', { x1: 183, y1: cy, x2: 326, y2: 203, class: 'ai-link active' });
    line.style.setProperty('--weight', Math.abs(weights[index])); root.appendChild(line); return line;
  });
  const neuron = svgEl('circle', { cx: 360, cy: 203, r: 42, class: 'ai-node active' });
  const ntext = svgEl('text', { x: 360, y: 208, class: 'ai-value', 'text-anchor': 'middle' }); ntext.textContent = 'DECIDE';
  const outLine = svgEl('line', { x1: 403, y1: 203, x2: 534, y2: 203, class: 'ai-link active' });
  const output = svgEl('rect', { x: 535, y: 166, width: 85, height: 74, rx: 4, class: 'ai-output' });
  const outText = svgEl('text', { x: 577, y: 198, class: 'ai-output-main', 'text-anchor': 'middle' });
  const outSub = svgEl('text', { x: 577, y: 219, class: 'ai-label', 'text-anchor': 'middle' });
  root.append(neuron, ntext, outLine, output, outText, outSub); svg.appendChild(root);
  return {
    set({ values: nextValues = values, weights: nextWeights = weights, result = 1, confidence = 50 }){
      inputNodes.forEach((node, index) => node.t.textContent = Number(nextValues[index]).toFixed(1));
      links.forEach((line, index) => line.style.setProperty('--weight', Math.max(.1, Math.abs(nextWeights[index] || 0))));
      output.classList.toggle('positive', !!result); outText.textContent = result ? 'YES' : 'NO'; outSub.textContent = `${confidence}% sure`;
    },
    setThreshold(value){ ntext.textContent = value > 0 ? 'STRICT' : value < 0 ? 'EASY' : 'DECIDE'; },
  };
}

export function makeScatter(svg, points){
  const x = 105, y = 70, w = 500, h = 330;
  const root = svgEl('g', { class: 'ai-scatter' });
  root.append(svgEl('line', { x1: x, y1: y + h, x2: x + w, y2: y + h, class: 'ai-axis' }), svgEl('line', { x1: x, y1: y, x2: x, y2: y + h, class: 'ai-axis' }));
  label(root, x + w / 2, y + h + 36, 'SIGNAL A');
  label(root, x - 45, y + h / 2, 'SIGNAL B');
  const dots = points.map(point => {
    const dot = svgEl('circle', { cx: x + point.x * w, cy: y + h - point.y * h, r: 8, class: `ai-point group-${point.group}` });
    root.appendChild(dot); return dot;
  });
  const boundary = svgEl('line', { x1: x + 70, y1: y + h - 30, x2: x + w - 70, y2: y + 30, class: 'ai-boundary' });
  root.appendChild(boundary); svg.appendChild(root);
  return {
    root,
    setBoundary(kind){
      if (kind === 'flat') Object.assign(boundary.dataset, { kind });
      boundary.setAttribute('x1', kind === 'flat' ? x + 20 : x + 70); boundary.setAttribute('y1', kind === 'flat' ? y + h / 2 : y + h - 30);
      boundary.setAttribute('x2', kind === 'flat' ? x + w - 20 : x + w - 70); boundary.setAttribute('y2', kind === 'flat' ? y + h / 2 : y + 30);
    },
    reveal(){ dots.forEach(dot => dot.classList.add('revealed')); boundary.classList.add('active'); },
  };
}

export function makeCurve(svg, traces){
  const x = 90, y = 75, w = 540, h = 315;
  const root = svgEl('g', { class: 'ai-curve' });
  root.append(svgEl('line', { x1: x, y1: y + h, x2: x + w, y2: y + h, class: 'ai-axis' }), svgEl('line', { x1: x, y1: y, x2: x, y2: y + h, class: 'ai-axis' }));
  label(root, x + w / 2, y + h + 37, 'TRAINING ROUNDS'); label(root, x - 42, y + h / 2, 'ERROR');
  const path = svgEl('path', { class: 'ai-training-line', fill: 'none' }); root.appendChild(path); svg.appendChild(root);
  return {
    setTrace(name){
      const values = traces[name];
      const d = values.map((value, index) => `${index ? 'L' : 'M'}${x + index * w / (values.length - 1)} ${y + value / 100 * h}`).join(' ');
      path.setAttribute('d', d); path.setAttribute('data-trace', name);
    },
  };
}

export function makePixelGrid(svg, pixels, { x = 155, y = 90, cell = 46 } = {}){
  const root = svgEl('g', { class: 'ai-pixel-grid' });
  const cells = pixels.map((on, index) => {
    const col = index % 5, row = Math.floor(index / 5);
    const rect = svgEl('rect', { x: x + col * cell, y: y + row * cell, width: cell - 4, height: cell - 4, rx: 2, class: `ai-pixel${on ? ' on' : ''}` });
    root.appendChild(rect); return rect;
  });
  svg.appendChild(root);
  return {
    cells,
    set(next){ cells.forEach((cellNode, index) => cellNode.classList.toggle('on', !!next[index])); },
    highlight(indices){ cells.forEach((cellNode, index) => cellNode.classList.toggle('feature', indices.includes(index))); },
  };
}

export function makeBars(svg, entries, { x = 410, y = 105, w = 220, gap = 58 } = {}){
  const root = svgEl('g', { class: 'ai-bars' });
  const rows = entries.map((entry, index) => {
    const name = label(root, x - 12, y + index * gap + 17, entry.token, 'ai-label', 'end');
    const track = svgEl('rect', { x, y: y + index * gap, width: w, height: 26, rx: 2, class: 'ai-bar-track' });
    const fill = svgEl('rect', { x, y: y + index * gap, width: w * entry.percent / 100, height: 26, rx: 2, class: 'ai-bar-fill' });
    const value = label(root, x + w + 10, y + index * gap + 18, `${entry.percent}%`, 'ai-value', 'start');
    root.append(track, fill); return { name, fill, value };
  });
  svg.appendChild(root);
  return { set(next){ rows.forEach((row, index) => { row.name.textContent = next[index].token; row.fill.setAttribute('width', w * next[index].percent / 100); row.value.textContent = `${next[index].percent}%`; }); } };
}

export function makeTokenStrip(svg, tokens, { x = 55, y = 215, width = 610 } = {}){
  const gap = width / tokens.length;
  const root = svgEl('g', { class: 'ai-token-strip' });
  const items = tokens.map((token, index) => {
    const rect = svgEl('rect', { x: x + index * gap + 3, y: y - 25, width: gap - 7, height: 50, rx: 3, class: 'ai-token' });
    const text = label(root, x + index * gap + gap / 2, y + 5, token, 'ai-token-text');
    root.insertBefore(rect, text); return { rect, text };
  });
  svg.appendChild(root);
  return { items, highlight(indices){ items.forEach((item, index) => item.rect.classList.toggle('active', indices.includes(index))); } };
}

export function makeAttentionMap(svg, tokens){
  const strip = makeTokenStrip(svg, tokens, { y: 330 });
  const root = svgEl('g', { class: 'ai-attention-lines' }); svg.insertBefore(root, strip.items[0].rect.parentNode);
  return {
    focus(index, weights){
      root.innerHTML = '';
      const gap = 610 / tokens.length, x0 = 55 + index * gap + gap / 2;
      weights.forEach((weight, target) => {
        if (target === index) return;
        const x1 = 55 + target * gap + gap / 2;
        const curve = svgEl('path', { d: `M${x0} 305 Q${(x0 + x1) / 2} ${110 + Math.abs(x1 - x0) * .16} ${x1} 305`, class: 'ai-attention-line', fill: 'none' });
        curve.style.setProperty('--attention', Math.max(.04, weight)); root.appendChild(curve);
      });
      strip.highlight([index]);
    },
  };
}

export function makeEmbeddingMap(svg, points){
  const root = svgEl('g', { class: 'ai-embedding-map' });
  root.append(svgEl('rect', { x: 70, y: 55, width: 580, height: 355, class: 'ai-map-frame' }));
  const items = points.map(point => {
    const node = svgEl('g', { class: `ai-embedding group-${point.group}` });
    node.append(svgEl('circle', { cx: point.x, cy: point.y, r: 22 }), label(node, point.x, point.y + 4, point.token, 'ai-token-text'));
    root.appendChild(node); return node;
  });
  svg.appendChild(root);
  return { items, reveal(){ items.forEach(item => item.classList.add('active')); } };
}

export function makePipeline(svg, stages){
  const x = 65, y = 175, gap = 145;
  const root = svgEl('g', { class: 'ai-pipeline' });
  const blocks = stages.map((stage, index) => {
    if (index) root.appendChild(svgEl('path', { d: `M${x + (index - 1) * gap + 105} ${y + 40} H${x + index * gap - 12}`, class: 'ai-link' }));
    const rect = svgEl('rect', { x: x + index * gap, y, width: 105, height: 80, rx: 4, class: 'ai-pipeline-block' });
    const text = label(root, x + index * gap + 52, y + 45, stage, 'ai-label'); root.insertBefore(rect, text); return rect;
  });
  svg.appendChild(root);
  return { activate(index){ blocks.forEach((block, i) => block.classList.toggle('active', i <= index)); } };
}

export function makeControlButton(controls, labelText){
  const button = el('button', { class: 'btn ghost', type: 'button' }, labelText);
  controls.appendChild(button); return button;
}
