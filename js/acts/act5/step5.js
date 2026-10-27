// ACT 5 · STEP 5 — "Build the site". The last step of the course.
// Built to the micro-learning contract (DESIGN_MAKEOVER.md §2, ACT5_MAKEOVER.md §3):
// one card at a time, each building named and labelled as it lands, the running bill
// shown as an accumulation before the site's total arrives, then the globe. The globe is
// introduced from what is on screen; it makes no claim that the player has seen it
// before, because the landing is the hand-drawn frame scrub (ACT5_MAKEOVER.md §1.3).
import { svgEl, sleep } from '../../engine/util.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { EARTH_DOTS } from '../../earth-dots.js';
import { slideInPanel } from '../../engine/components.js';
import { siteLab } from './lab.js';
import { laneIcon } from '../../art/icons.js';

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

/* Course restructure (2026-10-25): the bill follows COST_MODEL.md. Acts 1 to 4 are one
   row (ACT5_BASE_COST in js/acts/act5/index.js, about $23,020); Act 5's rows are its
   costDeltas, the same five lines as ACT5_SUMMARY.items. The total is what SPENT shows at
   the end of the course: 23,020 + 2.4M + 0 + 190M + 440M + 1,066M ≈ $1.70B. */
const LEDGER = [
  ['ACTS 1 TO 4', '$23,020'],
  ['RACK OF 8 SERVERS', '$2.4M'],
  ['INTERCONNECT', '$0, IN THE SERVER PRICE'],
  ['LEAF-SPINE FABRIC', '$190M'],
  ['HALLS, POWER AND COOLING', '$440M'],
  ['THE OTHER 444 RACKS', '$1,066M'],
];
const TOTAL_COST = '$1.70B';

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

/* Course restructure (2026-10-25): the course's closing ladder, from the site down to one
   atom, each rung tagged with the act that built it. Modelled on the recap ladders that end
   Act 1 (js/steps/step5.js) and Act 4 (js/acts/act4/step6.js), but drawn as a small column
   beside the globe, so the globe stays on screen to the very end. */
function courseLadder(){
  const g = svgEl('g');
  const X = 566, Y0 = 56, S = 28, PITCH = 40, TX = X + S + 10;
  const N = 'fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1"';
  const P = 'fill="var(--red-soft)" stroke="var(--red)" stroke-width="1"';
  const rungs = [
    ['THE SITE', 'ACT 5', (x, y) => `<rect x="${x + 3}" y="${y + 3}" width="${S - 6}" height="${S - 6}" rx="1.5" fill="none" stroke="var(--ink-soft)" stroke-width=".8" stroke-dasharray="2.5 2"/>
      <rect x="${x + 6}" y="${y + 7}" width="7" height="6" fill="var(--paper)" stroke="var(--ink)" stroke-width=".8"/>
      <rect x="${x + 15}" y="${y + 7}" width="7" height="6" fill="var(--paper)" stroke="var(--ink)" stroke-width=".8"/>
      <rect x="${x + 6}" y="${y + 16}" width="7" height="4" fill="var(--amber-soft)" stroke="var(--amber)" stroke-width=".8"/>
      <rect x="${x + 15}" y="${y + 16}" width="7" height="4" fill="var(--paper)" stroke="var(--ink)" stroke-width=".8"/>`],
    ['A HALL', 'ACT 5', (x, y) => [0, 1, 2, 3].map(k => `<line x1="${x + 6}" y1="${y + 8 + k * 4.5}" x2="${x + S - 6}" y2="${y + 8 + k * 4.5}" stroke="var(--ink-soft)" stroke-width="1" stroke-dasharray="3.5 1.5"/>`).join('')],
    ['A RACK', 'ACT 5', (x, y) => `<rect x="${x + 9}" y="${y + 4}" width="10" height="${S - 8}" rx="1" fill="var(--paper)" stroke="var(--ink)" stroke-width=".9"/>`
      + [0, 1, 2, 3].map(k => `<line x1="${x + 11}" y1="${y + 8 + k * 4.5}" x2="${x + 17}" y2="${y + 8 + k * 4.5}" stroke="var(--blue)" stroke-width=".9"/>`).join('')],
    ['A NODE', 'ACT 5 · 8 GPUs', (x, y) => `<rect x="${x + 4}" y="${y + 8}" width="${S - 8}" height="12" rx="1" fill="var(--paper)" stroke="var(--ink)" stroke-width=".9"/>`
      + [0, 1, 2, 3, 4, 5, 6, 7].map(k => `<rect x="${x + 6.5 + (k % 4) * 4.6}" y="${y + 10 + Math.floor(k / 4) * 4.4}" width="3" height="3" fill="var(--ink)"/>`).join('')],
    ['A GPU', 'ACT 4', (x, y) => `<rect x="${x + 4}" y="${y + 6}" width="${S - 8}" height="${S - 12}" rx="1" fill="var(--paper)" stroke="var(--ink-soft)" stroke-width=".8"/>
      <rect x="${x + 10}" y="${y + 9}" width="8" height="10" fill="#e3ddca" stroke="var(--ink)" stroke-width=".8"/>
      <rect x="${x + 6}" y="${y + 10}" width="3" height="8" fill="var(--paper-high)" stroke="var(--ink-soft)" stroke-width=".6"/>
      <rect x="${x + 19}" y="${y + 10}" width="3" height="8" fill="var(--paper-high)" stroke="var(--ink-soft)" stroke-width=".6"/>`],
    ['ONE LANE', 'ACT 4', (x, y) => laneIcon(x + 5, y + 5, S - 10)],
    ['A GATE', 'ACT 2', (x, y) => `<path d="M${x + 7} ${y + 8} H${x + 14} A6 6 0 0 1 ${x + 14} ${y + 20} H${x + 7} Z" fill="var(--paper)" stroke="var(--ink)" stroke-width=".9"/>
      <circle cx="${x + 22}" cy="${y + 14}" r="1.8" fill="var(--paper)" stroke="var(--ink)" stroke-width=".8"/>
      <path d="M${x + 3} ${y + 11} H${x + 7} M${x + 3} ${y + 17} H${x + 7} M${x + 24} ${y + 14} H${x + 26}" stroke="var(--ink)" stroke-width=".8"/>`],
    ['A TRANSISTOR', 'ACT 1', (x, y) => `<rect x="${x + 4}" y="${y + 13}" width="${S - 8}" height="10" ${P}/>
      <rect x="${x + 5}" y="${y + 13}" width="5" height="4" ${N}/>
      <rect x="${x + 18}" y="${y + 13}" width="5" height="4" ${N}/>
      <rect x="${x + 10}" y="${y + 10}" width="8" height="3" class="oxide"/>
      <rect x="${x + 10}" y="${y + 6}" width="8" height="4" class="gate-metal"/>`],
    ['ONE ATOM', 'ACT 1', (x, y) => `<circle cx="${x + S / 2}" cy="${y + S / 2}" r="6" ${N}/>
      <circle cx="${x + S / 2 + 6}" cy="${y + S / 2 - 6}" r="1.8" fill="var(--blue)"/>`],
  ];
  let html = `<text x="${X - 4}" y="22" class="lbl-strong" text-anchor="start" style="font-size:10px">THE WHOLE COURSE</text>
    <text x="${X - 4}" y="36" class="lbl-faint" text-anchor="start" style="font-size:7.5px">FROM THE SITE DOWN TO ONE ATOM</text>`;
  rungs.forEach(([name, act, draw], i) => {
    const y = Y0 + i * PITCH;
    html += `<rect x="${X}" y="${y}" width="${S}" height="${S}" rx="3" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.1"/>`
      + draw(X, y)
      + `<text x="${TX}" y="${y + 12}" class="lbl-strong" text-anchor="start" style="font-size:9px">${name}</text>
        <text x="${TX}" y="${y + 24}" class="lbl-faint" text-anchor="start" style="font-size:7.5px">${act}</text>`;
    if (i < rungs.length - 1){
      const ax = X + S / 2, a1 = y + S + 2, a2 = y + PITCH - 2;
      html += `<path d="M${ax} ${a1} V${a2} M${ax - 3} ${a2 - 4} L${ax} ${a2} L${ax + 3} ${a2 - 4}" fill="none" stroke="var(--ink-soft)" stroke-width="1"/>`;
    }
  });
  g.innerHTML = html;
  return g;
}

export async function step5(){
  guide.title('STEP 5 / 5', 'Where does the data centre go, <em>and what did it all cost?</em>');
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
  guide.say(`Everything from the last four steps goes on one plot of land. You will watch
    four kinds of building appear on it, then choose where the plot sits.`);
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
  guide.say(`Two halls hold the racks. You budgeted 25 MW of IT load, and at 56 kW a rack
    that comes to about 445 racks.`);
  stage.focus(docOrder([hallA, hallB]), { label: 'halls a and b', at: 'top' });
  await guide.next();

  /* Course restructure (2026-10-25): the site's GPU count, and the word "cluster".
     445 racks × 8 nodes × 8 GPUs = 445 × 64 = 28,480 GPUs (COST_MODEL.md). Inference is
     defined in Act 4, step 4. */
  stage.clearFocus();
  guide.say(`Your halls hold 445 racks × 64 = 28,480 GPUs, wired to work as one machine. This
    is what people mean when they say a cluster. Once a model is trained, much of a cluster's
    time goes to inference.`);
  stage.focus(docOrder([hallA, hallB]), { label: '28,480 GPUs', at: 'top' });
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
  guide.say(`Grid power arrives at 138,000 volts. The substation steps it down (lowers the
    voltage) to the few hundred volts a rack can take.`);
  stage.focus(docOrder([sub, grid]), { label: 'substation', at: 'bottom' });
  await guide.next();

  /* Course restructure (2026-10-25): the gigawatt light-bulb card. The site draws 29.4 MW
     (the power step's whole draw). 1,000 ÷ 29.4 ≈ 34 sites, and 34 × 28,480 ≈ 970,000 GPUs. */
  stage.clearFocus();
  guide.say(`Your site draws 29.4 MW from the grid. A 1 GW campus in the news draws 1,000 MW.
    That is about 34 sites like yours, holding roughly a million GPUs like yours.`);
  stage.focus(docOrder([sub, grid]), { label: '29.4 MW from the grid', at: 'bottom' });
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
  guide.say(`Fibre (glass cable that carries data as light) leaves the site here and runs to
    the backbone, the long-distance cables that carry the internet between cities.`);
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

  // Course restructure (2026-10-25): one row for Acts 1 to 4, then Act 5's five lines
  // (COST_MODEL.md), and a total that matches SPENT.
  const actRows = [];
  for (let i = 0; i < LEDGER.length; i++){
    const row = ledgerRow(ledgerG, 136 + i * 30, LEDGER[i][0], LEDGER[i][1]);
    actRows.push(row);
    await fadeIn([row], 200);
    if (!flow.instant) await sleep(90);
  }
  guide.say(`Every act added a line to this bill. Acts 1 to 4 come to about $23,020. The
    halls, power and cooling cost about $440 million, and the network about $190 million.`);
  stage.focus(docOrder(actRows), { label: 'spent so far', at: 'top' });
  await guide.next();

  stage.clearFocus();
  const rule2 = svgEl('line', { x1: 390, y1: 306, x2: 690, y2: 306, stroke: 'var(--ink)', 'stroke-width': 1 });
  ledgerG.appendChild(rule2);
  const totalRow = ledgerRow(ledgerG, 334, 'TOTAL', TOTAL_COST, { strong: true });
  await fadeIn([rule2, totalRow], 300);
  guide.say(`The whole site costs about $1.7 billion. Most of it pays for the servers, about
    $1.07 billion for the GPUs and the boxes around them. Company capex (money spent on
    buildings and machines) is mostly this.`);
  // the two server rows (the first rack, the other 444) and the total
  stage.focus(docOrder([actRows[1], actRows[5], totalRow]), { label: 'mostly servers', at: 'bottom' });
  await guide.next();

  /* ============ SCENE C — where the plot goes ============ */

  stage.clearFocus();
  await fadeOut([ledgerG], 260);
  guide.say(`Where the plot sits decides what power costs, how hard the halls are to cool,
    and how far the fibre has to run. Pick one:`);
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

  /* ============ IN THE LAB — what a visitor sees on a data-centre tour ============ */

  stage.clearFocus();
  const lab = slideInPanel(svg, siteLab(), { lab: true });
  lab.focus('hall');
  await lab.show();

  guide.lab(`On a tour, you would walk into one of the halls you placed on your plot. The
    racks stand in long rows, and each pair of rows faces the same aisle.`, { intro: true });
  await guide.next();

  lab.focus(['hall', 'aisles']);
  guide.lab(`The rack fronts face the cold aisle, kept at about 18 to 27 °C. The servers pull
    that air through and blow it out of their backs into the hot aisle. A roof over the cold
    aisle stops the two mixing.`);
  await guide.next();

  lab.focus('power');
  guide.lab(`Outside, the substation's transformers step the grid's voltage down, as on your
    plan. Beside them stand diesel generators. If the grid fails, they start within about 15
    seconds, and batteries inside carry the racks until then.`);
  await guide.next();

  lab.focus('cooling');
  guide.lab(`The cooling plant you placed is out here too. Water warmed by the racks' heat is
    pumped to cooling towers, which cool it by letting some of it evaporate into the air.`);
  await guide.next();
  await lab.hide();

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
  // `let`, not `const`: from the close on, the learner can turn the globe (REVIEW_NOTES N-093)
  let FWD = yourV;
  let RIGHT = norm(cross(FWD, [0, 1, 0]));
  let UP = cross(RIGHT, FWD);
  function project(v){
    return { x: cx + dot3(v, RIGHT) * R, y: cy - dot3(v, UP) * R, front: dot3(v, FWD) > 0 };
  }
  const placed = [];                     // every dot and the point it sits on, for re-drawing
  function draw(v, node, baseR){
    const p = project(v);
    node.setAttribute('cx', p.x.toFixed(2));
    node.setAttribute('cy', p.y.toFixed(2));
    node.setAttribute('r', (p.front ? baseR : baseR * 0.5).toFixed(2));
    node.setAttribute('opacity', p.front ? 1 : 0.12);
    return p;
  }
  function place(v, node, baseR){
    placed.push({ v, node, baseR });
    return draw(v, node, baseR);
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

  /* Course restructure (2026-10-25): the globe's card pairs merged. Land and the existing
     data centres arrive on one card; the cables and your site switching on on the next. */
  await fadeIn([rim, landLayer, yourLayer], 420);
  await fadeIn([hubLayer], 380);
  guide.say(`We have zoomed out until the whole plot is one dot. The small dark dots are land.
    Every amber dot is a data centre that already exists, roughly where the largest ones sit.`);
  // no ring: a box round the hubs would enclose most of the dimmed globe
  gstage.focus(docOrder([...hubNodes, yourDot]), { label: 'data centres', at: 'top', ring: false });
  await guide.next();

  gstage.clearFocus();
  await fadeIn([arcLayer], 380);
  await Anim.tween(420, p => {
    yourDot.setAttribute('r', (3.2 + p * 1.6).toFixed(2));
    yourDot.style.fill = p > 0.5 ? 'var(--amber)' : 'var(--ink)';
  });
  yourDot.style.fill = 'var(--amber)';
  if (!flow.instant) SFX.blip();
  guide.say(`The blue arcs are cables that carry the internet between data centres. Your site
    switches on, and it is one more amber dot on the same map.`);
  gstage.focus(docOrder([...arcNodes, yourDot]), { label: 'cables, and yours', at: 'top', ring: false });
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

  /* REVIEW_NOTES N-093: the globe turns under the cursor. Dragging sideways spins it about
     its up axis, dragging up or down tilts it; every dot is re-drawn from its point on the
     sphere. Decoration only: nothing is recorded, so replay is untouched. */
  placed.find(o => o.node === yourDot).baseR = 4.8;
  const turn = (a, b) => {
    const f1 = FWD.map((x, i) => x * Math.cos(a) + RIGHT[i] * Math.sin(a));
    const r1 = RIGHT.map((x, i) => x * Math.cos(a) - FWD[i] * Math.sin(a));
    const f2 = f1.map((x, i) => x * Math.cos(b) + UP[i] * Math.sin(b));
    const u2 = UP.map((x, i) => x * Math.cos(b) - f1[i] * Math.sin(b));
    FWD = norm(f2); RIGHT = norm(r1); UP = norm(cross(RIGHT, FWD));
    placed.forEach(o => draw(o.v, o.node, o.baseR));
    const q = project(yourV);
    ring.setAttribute('cx', q.x.toFixed(2)); ring.setAttribute('cy', q.y.toFixed(2));
    ring.style.display = q.front ? '' : 'none';
  };
  const hint = svgEl('text', { x: cx, y: cy + R + 30, class: 'lbl-faint' });
  hint.textContent = 'DRAG TO TURN THE GLOBE';
  gsvg.appendChild(hint);
  [rim, landLayer, arcLayer, hubLayer, yourLayer].forEach(n => { n.style.pointerEvents = 'none'; });
  const grab = svgEl('circle', { cx, cy, r: R, fill: 'transparent' });
  grab.style.cursor = 'grab';
  gsvg.insertBefore(grab, rim);
  let drag = null;
  grab.addEventListener('pointerdown', e => {
    grab.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY };
    grab.style.cursor = 'grabbing';
  });
  grab.addEventListener('pointermove', e => {
    if (!drag) return;
    const k = 0.006;                     // radians per screen pixel
    turn(-(e.clientX - drag.x) * k, (e.clientY - drag.y) * k);
    drag = { x: e.clientX, y: e.clientY };
  });
  const letGo = () => { drag = null; grab.style.cursor = 'grab'; };
  grab.addEventListener('pointerup', letGo);
  grab.addEventListener('pointercancel', letGo);

  /* Course restructure (2026-10-25): the full ladder of the course sits beside the globe
     for the last card, so the globe stays on screen to the very end. */
  const ladder = courseLadder();
  gsvg.appendChild(ladder);
  await fadeIn([ladder], 360);

  guide.aha(`Somewhere in that hall is a chip, and in that chip a transistor, and in that
    transistor an atom you placed by hand in Act 1.`);
  await guide.next();
}
