// ACT 5 · STEP 5 — "Build the site". The last step of the course.
// Built to the micro-learning contract (DESIGN_MAKEOVER.md §2, ACT5_MAKEOVER.md §3):
// one card at a time, each building named and labelled as it lands, the running bill
// shown as an accumulation before the billion arrives, then the globe. The globe is
// introduced from what is on screen; it makes no claim that the player has seen it
// before, because the landing is the hand-drawn frame scrub (ACT5_MAKEOVER.md §1.3).
import { svgEl, sleep } from '../../engine/util.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { EARTH_DOTS } from '../../earth-dots.js';

/* ---------- the three sites ---------- */
const SITES = [
  {
    value: 'altoona', label: 'Altoona, Iowa', hint: 'wind power next door, fibre already there',
    ll: [41.6, -93.5],
    spec: ['POWER · WIND, AND CHEAP', 'COOLING · FREEZING WINTERS', 'FIBRE · BACKBONE RUNS PAST'],
    line: `Wind power next door, and winters cold enough to cool the halls with outside air. The backbone already runs past the plot.`,
  },
  {
    value: 'dublin', label: 'Dublin, Ireland', hint: 'cool air all year, Atlantic cables land here',
    ll: [53.3, -6.3],
    spec: ['POWER · LOCAL GRID IS FULL', 'COOLING · COOL AIR ALL YEAR', 'FIBRE · ATLANTIC CABLES LAND'],
    line: `Cool air all year, and the Atlantic cables come ashore nearby. The local grid is already full, so power is the hard part.`,
  },
  {
    value: 'jurong', label: 'Jurong, Singapore', hint: 'every regional cable lands here, cooling costs more',
    ll: [1.3, 103.7],
    spec: ['POWER · IMPORTED, EXPENSIVE', 'COOLING · HOT AND HUMID ALL YEAR', 'FIBRE · MOST ASIAN CABLES LAND'],
    line: `Most cables in the region land here, so the site is close to its users. It is hot and humid all year, so you cool the halls every day.`,
  },
];

/* Existing data centres, as amber dots. Same short list the course has always used. */
const HUBS = [[39, -77], [45, -122], [-23, -46], [51, 0], [50, 9], [59, 18], [19, 73], [1, 104],
  [35, 140], [-34, 151], [25, 55], [25, 121], [53, -6], [-26, 28]];
/* Cables between them, as pairs of HUBS indices. Routes that really exist:
   transatlantic, transpacific, South Atlantic, and the short regional hops. */
const CABLES = [[0, 3], [3, 4], [10, 6], [7, 8], [1, 8], [2, 13], [9, 7], [11, 8]];

/* The bill, read off the act registries: js/steps/act.js (Act 1) and
   js/acts/act{2,3,4,5}/index.js. Per-act sums of costDelta, and the total. */
const LEDGER = [
  ['ACT 1 · DOPED SILICON', '$0.0015'],
  ['ACT 2 · LOGIC, MEMORY', '$0.0090'],
  ['ACT 3 · CHIPS PRINTED', '$14,000'],
  ['ACT 4 · ONE GPU', '$2,420,000'],
  ['ACT 5 · RACKS AND POWER', '$100,400,000'],
];
const SITE_COST = '$1,000,000,000';
const TOTAL_COST = '$1,102,834,000';

const DEG = Math.PI / 180;
const SEED = 22;                       // fixed: the land scatter is identical every run

function mulberry32(a){
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function ll2v(lat, lon){
  const la = lat * DEG, lo = lon * DEG;
  return [Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)];
}
function slerp(a, b, t){
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  dot = Math.max(-1, Math.min(1, dot));
  const om = Math.acos(dot), so = Math.sin(om) || 1e-6;
  const ka = Math.sin((1 - t) * om) / so, kb = Math.sin(t * om) / so;
  return [a[0] * ka + b[0] * kb, a[1] * ka + b[1] * kb, a[2] * ka + b[2] * kb];
}

/* stage.focus restores raised nodes back to front, so an unordered list throws
   NotFoundError. Every multi-node focus goes through this. */
function docOrder(nodes){
  return nodes.filter(Boolean).sort((a, b) =>
    (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);
}

async function fadeIn(nodes, dur = 300){
  const list = (Array.isArray(nodes) ? nodes : [nodes]).filter(Boolean);
  if (!list.length) return;
  list.forEach(n => { n.style.opacity = '0'; n.style.display = ''; });
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(p); }));
  list.forEach(n => { n.style.opacity = '1'; });
}
async function fadeOut(nodes, dur = 280){
  const list = (Array.isArray(nodes) ? nodes : [nodes]).filter(Boolean);
  if (!list.length) return;
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(1 - p); }));
  list.forEach(n => { n.style.display = 'none'; });
}

const PLOT = { x: 44, y: 96, w: 300, h: 300 };
const BUILDINGS = {
  hallA: { x: 62, y: 116, w: 124, h: 88, label: 'HALL A' },
  hallB: { x: 202, y: 116, w: 124, h: 88, label: 'HALL B' },
  sub: { x: 62, y: 224, w: 124, h: 62, label: 'SUBSTATION' },
  cool: { x: 202, y: 224, w: 124, h: 62, label: 'COOLING PLANT' },
  fibre: { x: 132, y: 308, w: 124, h: 56, label: 'FIBRE HUB' },
};

function building(parent, b){
  const g = svgEl('g');
  g.appendChild(svgEl('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 4, class: 'rack-frame' }));
  const t = svgEl('text', { x: b.x + b.w / 2, y: b.y + 20, class: 'lbl-strong' });
  t.textContent = b.label;
  g.appendChild(t);
  parent.appendChild(g);
  return g;
}
function ledgerRow(parent, y, label, amount, { strong = false } = {}){
  const g = svgEl('g');
  const l = svgEl('text', { x: 390, y, class: strong ? 'lbl-strong' : 'lbl' });
  l.style.textAnchor = 'start';
  l.textContent = label;
  const a = svgEl('text', { x: 690, y, class: 'lbl-strong' });
  a.style.textAnchor = 'end';
  a.style.fill = 'var(--amber)';          // cost is amber (DESIGN.md §1a)
  if (strong) a.style.fontSize = '14px';
  a.textContent = amount;
  g.append(l, a);
  parent.appendChild(g);
  return g;
}

export async function step5(){
  guide.title('STEP 5 / 5 · NANOVOLT CLOUD', 'Build <em>the site</em>');
  guide.cards();

  /* ============ SCENE A — the plan, one building per card ============ */

  const stage = newStage('25', 'The site plan, the bill, and then the globe');
  const { svg } = stage;

  const planG = svgEl('g');
  svg.appendChild(planG);
  const plotRect = svgEl('rect', {
    x: PLOT.x, y: PLOT.y, width: PLOT.w, height: PLOT.h, rx: 3,
    fill: 'none', stroke: 'var(--hairline-strong)', 'stroke-width': 1, 'stroke-dasharray': '6 5',
  });
  planG.appendChild(plotRect);
  const planHead = svgEl('text', { x: PLOT.x, y: 82, class: 'lbl' });
  planHead.style.textAnchor = 'start';
  planHead.textContent = 'SITE PLAN';
  planG.appendChild(planHead);

  await fadeIn([plotRect, planHead], 320);
  guide.say(`Everything from the last four steps goes on one plot of land. Four kinds of
    building, then you choose where the plot sits.`);
  stage.focus(plotRect, { label: 'one plot', at: 'bottom' });
  await guide.next();

  /* --- the two halls --- */
  stage.clearFocus();
  const hallA = building(planG, BUILDINGS.hallA);
  const hallB = building(planG, BUILDINGS.hallB);
  [BUILDINGS.hallA, BUILDINGS.hallB].forEach((b, i) => {
    const g = i === 0 ? hallA : hallB;
    for (let r = 0; r < 4; r++){
      g.appendChild(svgEl('line', {
        x1: b.x + 14, y1: b.y + 38 + r * 12, x2: b.x + b.w - 14, y2: b.y + 38 + r * 12,
        stroke: 'var(--hairline-strong)', 'stroke-width': 1, 'stroke-dasharray': '7 4',
      }));
    }
  });
  await fadeIn([hallA, hallB], 340);
  guide.say(`Two halls hold the racks. You budgeted 25 MW for computing, and at 56 kW a
    rack that is about 445 racks.`);
  stage.focus(docOrder([hallA, hallB]), { label: 'halls a and b', at: 'top' });
  await guide.next();

  /* --- the substation --- */
  stage.clearFocus();
  const sub = building(planG, BUILDINGS.sub);
  sub.append(
    svgEl('circle', { cx: 117, cy: 264, r: 10, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.2 }),
    svgEl('circle', { cx: 131, cy: 264, r: 10, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.2 }),
  );
  const grid = svgEl('g');
  const feed = svgEl('path', {
    d: 'M28 255 H62', fill: 'none', 'stroke-width': 1.6, 'stroke-linecap': 'square',
  });
  feed.style.stroke = 'var(--amber)';       // power is amber
  const bus = svgEl('path', { d: 'M124 224 V212 H264 V204 M124 212 V204', fill: 'none', 'stroke-width': 1.4 });
  bus.style.stroke = 'var(--amber)';
  const feedLbl = svgEl('text', { x: 28, y: 244, class: 'lbl-faint' });
  feedLbl.style.textAnchor = 'start';
  feedLbl.textContent = 'GRID';
  grid.append(feed, bus, feedLbl);
  planG.appendChild(grid);
  await fadeIn([sub, grid], 340);
  guide.say(`Grid power arrives at 138,000 volts. The substation steps it down to the few
    hundred volts a rack can take.`);
  stage.focus(docOrder([sub, grid]), { label: 'substation', at: 'bottom' });
  await guide.next();

  /* --- the cooling plant --- */
  stage.clearFocus();
  const cool = building(planG, BUILDINGS.cool);
  cool.append(
    svgEl('circle', { cx: 264, cy: 262, r: 11, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.2 }),
    svgEl('path', { d: 'M256 254 L272 270 M272 254 L256 270', fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.1 }),
  );
  const heat = svgEl('g');
  [244, 280].forEach(y => {
    const p = svgEl('path', {
      d: `M330 ${y} q9 -6 18 0 t18 0`, fill: 'none', 'stroke-width': 1.4, 'stroke-linecap': 'round',
    });
    p.style.stroke = 'var(--amber)';        // heat is amber
    heat.appendChild(p);
  });
  planG.appendChild(heat);
  await fadeIn([cool, heat], 340);
  guide.say(`Everything the racks draw leaves as heat. The cooling plant carries 25 MW of
    it out of the buildings.`);
  stage.focus(docOrder([cool, heat]), { label: 'cooling plant', at: 'bottom' });
  await guide.next();

  /* --- fibre to the backbone --- */
  stage.clearFocus();
  const fibre = building(planG, BUILDINGS.fibre);
  const fibreDot = svgEl('circle', { cx: 194, cy: 344, r: 4 });
  fibreDot.style.fill = 'var(--blue)';      // a live signal path
  fibre.appendChild(fibreDot);
  const trunk = svgEl('g');
  const trunkLine = svgEl('path', { d: 'M194 364 V430', fill: 'none', 'stroke-width': 1.8 });
  trunkLine.style.stroke = 'var(--blue)';
  const trunkLbl = svgEl('text', { x: 194, y: 448, class: 'lbl-faint' });
  trunkLbl.textContent = 'TO THE BACKBONE';
  trunk.append(trunkLine, trunkLbl);
  planG.appendChild(trunk);
  await fadeIn([fibre, trunk], 340);
  guide.say(`Fibre leaves the site here and runs to the backbone, the long cables that
    carry the internet between cities.`);
  stage.focus(docOrder([fibre, trunk]), { label: 'fibre hub', at: 'right' });
  await guide.next();

  /* ============ SCENE B — the bill, act by act ============ */

  stage.clearFocus();
  const ledgerG = svgEl('g');
  svg.appendChild(ledgerG);
  const ledHeadL = svgEl('text', { x: 390, y: 104, class: 'lbl-faint' });
  ledHeadL.style.textAnchor = 'start';
  ledHeadL.textContent = 'THE BILL';
  const ledHeadR = svgEl('text', { x: 690, y: 104, class: 'lbl-faint' });
  ledHeadR.style.textAnchor = 'end';
  ledHeadR.textContent = 'SPENT';
  ledgerG.append(ledHeadL, ledHeadR);
  await fadeIn([ledHeadL, ledHeadR], 220);

  const actRows = [];
  for (let i = 0; i < LEDGER.length; i++){
    const row = ledgerRow(ledgerG, 136 + i * 36, LEDGER[i][0], LEDGER[i][1]);
    actRows.push(row);
    await fadeIn([row], 200);
    if (!flow.instant) await sleep(90);
  }
  guide.say(`Every act added a line to this bill. It starts at $0.0015, the doped crystal
    you made in Act 1.`);
  stage.focus(docOrder(actRows), { label: 'spent so far', at: 'top' });
  await guide.next();

  stage.clearFocus();
  const rule1 = svgEl('line', { x1: 390, y1: 304, x2: 690, y2: 304, stroke: 'var(--hairline-strong)', 'stroke-width': 1 });
  ledgerG.appendChild(rule1);
  const siteRow = ledgerRow(ledgerG, 330, 'THIS SITE', SITE_COST);
  await fadeIn([rule1, siteRow], 300);
  const rule2 = svgEl('line', { x1: 390, y1: 352, x2: 690, y2: 352, stroke: 'var(--ink)', 'stroke-width': 1 });
  ledgerG.appendChild(rule2);
  const totalRow = ledgerRow(ledgerG, 380, 'TOTAL', TOTAL_COST, { strong: true });
  await fadeIn([rule2, totalRow], 300);
  guide.say(`The site itself is ${SITE_COST}. Add the four acts before it and the whole
    run comes to ${TOTAL_COST}.`);
  stage.focus(totalRow, { label: 'the whole run', at: 'bottom' });
  await guide.next();

  /* ============ SCENE C — where the plot goes ============ */

  stage.clearFocus();
  await fadeOut([ledgerG], 260);
  guide.say(`Where the plot sits decides what power costs, how hard the halls are to cool,
    and how far the fibre has to run.`);
  stage.focus(planG, { label: 'your plot', at: 'right' });
  const pick = await guide.choose(SITES.map(s => ({ label: s.label, hint: s.hint, value: s.value })));
  const site = SITES.find(s => s.value === pick) || SITES[0];

  stage.clearFocus();
  const specG = svgEl('g');
  svg.appendChild(specG);
  const specName = svgEl('text', { x: 390, y: 140, class: 'lbl-strong' });
  specName.style.textAnchor = 'start';
  specName.style.fontSize = '14px';
  specName.textContent = site.label.toUpperCase();
  specG.appendChild(specName);
  site.spec.forEach((s, i) => {
    const t = svgEl('text', { x: 390, y: 180 + i * 30, class: 'lbl' });
    t.style.textAnchor = 'start';
    t.textContent = s;
    specG.appendChild(t);
  });
  await fadeIn([specG], 320);
  guide.say(site.line);
  stage.focus(specG, { label: 'your site', at: 'bottom' });
  await guide.next();

  /* ============ SCENE D — zoom out to the globe ============ */

  stage.clearFocus();
  await fadeOut([specG], 220);
  await stage.packInto([planG], { x: 191, y: 243, w: 8, h: 8 }, { dur: 620 });

  const gstage = newStage('25', 'The globe: data centres in amber, cables in blue, and yours');
  const gsvg = gstage.svg;

  const cx = 360, cy = 238, R = 178;
  const yourV = ll2v(site.ll[0], site.ll[1]);
  const hubV = HUBS.map(([la, lo]) => ll2v(la, lo));
  // the two nearest hubs, skipping any that sits almost on top of the site
  const nearest = hubV
    .map((v, i) => ({ i, d: (v[0] - yourV[0]) ** 2 + (v[1] - yourV[1]) ** 2 + (v[2] - yourV[2]) ** 2 }))
    .filter(x => x.d > 0.02)
    .sort((a, b) => a.d - b.d)
    .slice(0, 2)
    .map(x => x.i);

  /* The globe is held still, turned so the chosen site faces the viewer: FWD points
     out of the screen at the site, RIGHT is east there, UP is north. Building the
     frame this way keeps east on the right, which a yaw/pitch pair does not. */
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = v => { const m = Math.hypot(...v) || 1; return [v[0] / m, v[1] / m, v[2] / m]; };
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const FWD = yourV;
  const RIGHT = norm(cross(FWD, [0, 1, 0]));
  const UP = cross(RIGHT, FWD);
  function project(v){
    return { x: cx + dot3(v, RIGHT) * R, y: cy - dot3(v, UP) * R, front: dot3(v, FWD) > 0 };
  }
  function place(v, node, baseR){
    const p = project(v);
    node.setAttribute('cx', p.x.toFixed(2));
    node.setAttribute('cy', p.y.toFixed(2));
    node.setAttribute('r', (p.front ? baseR : baseR * 0.5).toFixed(2));
    node.setAttribute('opacity', p.front ? 1 : 0.12);
    return p;
  }

  const rim = svgEl('circle', { cx, cy, r: R, fill: 'none', stroke: 'var(--hairline-strong)', 'stroke-width': 1 });
  const landLayer = svgEl('g');
  const arcLayer = svgEl('g', { opacity: 0 });
  const hubLayer = svgEl('g', { opacity: 0 });
  const yourLayer = svgEl('g');
  gsvg.append(rim, landLayer, arcLayer, hubLayer, yourLayer);

  const rnd = mulberry32(SEED);          // fixed seed: same scatter live and on replay
  EARTH_DOTS.forEach(([lat, lon]) => {
    const v = ll2v(lat + (rnd() - 0.5) * 1.2, lon + (rnd() - 0.5) * 1.2);
    const c = svgEl('circle', { fill: 'var(--ink)' });
    landLayer.appendChild(c);
    place(v, c, 1.5);
  });

  const arcNodes = [];
  const drawArc = (a, b) => {
    for (let k = 1; k < 12; k++){
      const t = k / 12;
      const v = slerp(a, b, t);
      const lift = 1 + 0.07 * Math.sin(Math.PI * t);
      const c = svgEl('circle', {});
      c.style.fill = 'var(--blue)';       // a cable carrying signal
      arcLayer.appendChild(c);
      const p = place([v[0] * lift, v[1] * lift, v[2] * lift], c, 1.4);
      if (p.front) arcNodes.push(c);
    }
  };
  // cables between the sites that are already there, then two from the new one
  CABLES.forEach(([a, b]) => drawArc(hubV[a], hubV[b]));
  nearest.forEach(hi => drawArc(yourV, hubV[hi]));

  const hubNodes = [];
  hubV.forEach(v => {
    const c = svgEl('circle', {});
    c.style.fill = 'var(--amber)';        // a data centre: cost, power, heat
    hubLayer.appendChild(c);
    const p = place(v, c, 2.8);
    if (p.front) hubNodes.push(c);
  });

  const yourDot = svgEl('circle', {});
  yourDot.style.fill = 'var(--ink)';
  yourLayer.appendChild(yourDot);
  place(yourV, yourDot, 3.2);

  await fadeIn([rim, landLayer, yourLayer], 420);
  guide.say(`Zoom out until the whole plot is one dot. The ink dots are land.`);
  gstage.focus(yourDot, { label: 'your plot', at: 'top' });
  await guide.next();

  gstage.clearFocus();
  await fadeIn([hubLayer], 380);
  guide.say(`Every amber dot is a data centre that already exists. These are roughly where
    the largest ones sit.`);
  // no ring: a box round the hubs would enclose most of the dimmed globe
  gstage.focus(docOrder(hubNodes), { label: 'data centres', at: 'top', ring: false });
  await guide.next();

  gstage.clearFocus();
  await fadeIn([arcLayer], 380);
  guide.say(`The blue threads are cables running between them. They carry the internet
    from one site to the next.`);
  gstage.focus(docOrder(arcNodes), { label: 'cables', at: 'bottom', ring: false });
  await guide.next();

  gstage.clearFocus();
  await Anim.tween(420, p => {
    yourDot.setAttribute('r', (3.2 + p * 1.6).toFixed(2));
    yourDot.style.fill = p > 0.5 ? 'var(--amber)' : 'var(--ink)';
  });
  yourDot.style.fill = 'var(--amber)';
  if (!flow.instant) SFX.blip();
  guide.say(`Your site switches on. It is one more amber dot on the same map.`);
  gstage.focus(yourDot, { label: 'yours', at: 'top' });
  await guide.next();

  /* ============ SCENE E — the close ============ */

  gstage.clearFocus();
  const ring = svgEl('circle', { fill: 'none', 'stroke-width': 1.4, r: 4.8 });
  ring.style.stroke = 'var(--amber)';
  const pt = project(yourV);
  ring.setAttribute('cx', pt.x.toFixed(2));
  ring.setAttribute('cy', pt.y.toFixed(2));
  yourLayer.appendChild(ring);
  let pulse = 0;
  Anim.add(dt => {                        // the ring breathes; nothing moves
    pulse += dt;
    const k = Math.sin(pulse * 2.1) * 0.5 + 0.5;
    ring.setAttribute('r', (4.8 + k * 5.5).toFixed(2));
    ring.setAttribute('opacity', (1 - k).toFixed(2));
  });

  guide.aha(`Somewhere in that hall is a chip, and in that chip a transistor, and in that
    transistor an atom you placed by hand in Act 1.`);
  await guide.next();
}
