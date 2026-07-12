// ACT 5 · STEP 4 — "Light it up" — THE FINALE.
// The full campus assembles, the player picks a site, then the globe from the
// landing page returns on the stage SVG: baked coastline dots (ink), the
// existing amber hubs, blue arcs, plus ONE NEW pulsing amber dot — the
// player's own data centre — at the chosen site's lat/lon.
import { svgEl, el, sleep, RM } from '../../engine/util.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { Anim } from '../../engine/anim.js';
import { EARTH_DOTS } from '../../earth-dots.js';

/* ---------- site table: label/hint -> [lat, lon] ---------- */
const SITES = [
  { label: 'Altoona, Iowa', hint: 'wind corridor + fat fibre', value: 'altoona', ll: [41.6, -93.5] },
  { label: 'Dublin, Ireland', hint: 'cool climate, well connected', value: 'dublin', ll: [53.3, -6.3] },
  { label: 'Jurong, Singapore', hint: 'the crossroads of everything', value: 'jurong', ll: [1.3, 103.7] },
];

// same amber hubs as the landing globe (kept as a short local copy — no cross-import needed)
const HUBS = [[39, -77], [45, -122], [-23, -46], [51, 0], [50, 9], [59, 18], [19, 73], [1, 104], [35, 140], [-34, 151], [25, 55], [25, 121], [53, -6], [-26, 28]];

const DEG = Math.PI / 180;
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

export async function step4(){
  guide.title('STEP 4 / 4 · NANOVOLT CLOUD', 'Light <em>it up</em>');

  /* ===================== BEAT 1 — the campus assembles ===================== */
  const { svg, controls } = newStage('21', 'The campus — halls, substation, cooling plant, fibre');
  guide.say(`A <b>campus</b> is the whole site: the buildings and infrastructure on one plot of land. Everything you built across this course comes together here. In this final step you'll assemble the campus, then place it on a map of the world. <em>Watch the campus assemble.</em>`);

  const blocks = [
    { x: 90, y: 90, w: 130, h: 90, label: 'HALL A' },
    { x: 240, y: 90, w: 130, h: 90, label: 'HALL B' },
    { x: 90, y: 210, w: 130, h: 70, label: 'SUBSTATION' },
    { x: 240, y: 210, w: 130, h: 70, label: 'COOLING PLANT' },
    { x: 165, y: 300, w: 130, h: 50, label: 'FIBRE HUB' },
  ];
  const blockEls = blocks.map(b => {
    const g = svgEl('g', { opacity: 0 });
    g.innerHTML = `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="4" class="rack-frame"/>
      <text x="${b.x + b.w / 2}" y="${b.y + b.h / 2 + 4}" class="lbl-strong">${b.label}</text>`;
    svg.appendChild(g);
    return g;
  });

  await flow.ask(async replay => {
    if (replay !== undefined){ blockEls.forEach(g => g.setAttribute('opacity', 1)); return replay; }
    for (const g of blockEls){ g.setAttribute('opacity', 1); await sleep(220); }
    return true;
  });

  guide.say(`Two <b>halls</b> full of racks; a <b>substation</b> that takes high-voltage grid power and steps it down to feed them; a <b>cooling plant</b> that carries the racks' heat back out; and a <b>fibre hub</b>, the optical-cable junction that ties the whole campus to the rest of the internet. All of it — from a single doped grain of sand.`);
  await guide.next();

  /* ===================== BEAT 2 — choose the site ===================== */
  guide.say(`One choice left: where does it go? The site decides its power, its climate for cooling, and its distance to the fibre backbone. <em>Pick a site for your data centre.</em>`);
  const siteValue = await guide.choose(SITES.map(s => ({ label: s.label, hint: s.hint, value: s.value })));
  const site = SITES.find(s => s.value === siteValue) || SITES[0];
  guide.say(`<b>${site.label}</b> it is. Somewhere on the map of the world, a new amber dot is about to switch on.`);
  await guide.next();

  /* ===================== BEAT 3 — THE PAYOFF: the globe returns ===================== */
  const { svg: gsvg } = newStage('21', 'The globe — your data centre, on the map of the world');
  guide.say(`Zoom all the way back out. This is the same globe you saw on the very first screen of this course.`);

  const cx = 360, cy = 240, R = 190;
  const yourV = ll2v(site.ll[0], site.ll[1]);
  const hubV = HUBS.map(([la, lo]) => ll2v(la, lo));
  // arcs from the new site to its two nearest hubs (by chord distance)
  const nearest = hubV
    .map((v, i) => ({ i, d: (v[0] - yourV[0]) ** 2 + (v[1] - yourV[1]) ** 2 + (v[2] - yourV[2]) ** 2 }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 2)
    .map(x => x.i);

  const rim = svgEl('circle', { cx, cy, r: R, fill: 'none', stroke: 'var(--hairline-strong)', 'stroke-width': 1 });
  const landLayer = svgEl('g');
  const arcLayer = svgEl('g');
  const hubLayer = svgEl('g');
  const yourLayer = svgEl('g');
  gsvg.append(rim, landLayer, arcLayer, hubLayer, yourLayer);

  const state = { yaw: -1.05, pitch: .16 };

  // pre-build land dots (with fixed per-dot jitter so they don't crawl frame to frame)
  const landDots = EARTH_DOTS.map(([lat, lon]) => {
    const jlat = lat + (Math.random() - .5) * 1.2, jlon = lon + (Math.random() - .5) * 1.2;
    const v = ll2v(jlat, jlon);
    const c = svgEl('circle', { r: 1.5, fill: 'var(--ink)' });
    landLayer.appendChild(c);
    return { v, c };
  });
  const arcDots = [];
  nearest.forEach(hi => {
    for (let k = 1; k < 12; k++){
      const t = k / 12;
      const v = slerp(yourV, hubV[hi], t);
      const lift = 1 + .07 * Math.sin(Math.PI * t);
      const c = svgEl('circle', { r: 1.3, fill: 'var(--blue)' });
      arcLayer.appendChild(c);
      arcDots.push({ v: [v[0] * lift, v[1] * lift, v[2] * lift], c });
    }
  });
  const hubDots = hubV.map(v => {
    const c = svgEl('circle', { r: 2.6, fill: 'var(--amber)' });
    hubLayer.appendChild(c);
    return { v, c };
  });
  const yourDot = svgEl('circle', { r: 4.2, fill: 'var(--amber)' });
  const yourRing = svgEl('circle', { r: 4.2, fill: 'none', stroke: 'var(--amber)', 'stroke-width': 1.4 });
  yourLayer.append(yourRing, yourDot);
  const yourLbl = svgEl('text', { class: 'lbl-strong' });
  yourLbl.textContent = 'YOURS';
  yourLayer.appendChild(yourLbl);

  function project(v){
    const cyw = Math.cos(state.yaw), syw = Math.sin(state.yaw);
    const cp = Math.cos(state.pitch), sp = Math.sin(state.pitch);
    const [x0, y0, z0] = v;
    const x1 = x0 * cyw + z0 * syw, z1 = -x0 * syw + z0 * cyw;
    const y2 = y0 * cp - z1 * sp, z2 = y0 * sp + z1 * cp;
    return { x: cx + x1 * R, y: cy - y2 * R, front: z2 > 0 };
  }
  function place(dot, baseR){
    const p = project(dot.v);
    dot.c.setAttribute('cx', p.x); dot.c.setAttribute('cy', p.y);
    dot.c.setAttribute('r', p.front ? baseR : baseR * .5);
    dot.c.setAttribute('opacity', p.front ? 1 : .1);
    return p;
  }
  function render(){
    landDots.forEach(d => place(d, 1.5));
    arcDots.forEach(d => place(d, 1.3));
    hubDots.forEach(d => place(d, 2.6));
    const p = place({ v: yourV, c: yourDot }, 4.2);
    yourRing.setAttribute('cx', p.x); yourRing.setAttribute('cy', p.y);
    yourLbl.setAttribute('x', p.x); yourLbl.setAttribute('y', p.y - 12);
    yourLbl.setAttribute('opacity', p.front ? 1 : 0);
  }
  render();

  // gentle rotation (respects prefers-reduced-motion; static otherwise) + a pulsing ring on the new dot
  let pulseT = 0;
  const ticker = (dt) => {
    if (!RM) state.yaw += dt * 0.12;
    pulseT += dt;
    const pr = 4.2 + (Math.sin(pulseT * 2.1) * .5 + .5) * 5.5;
    yourRing.setAttribute('r', pr.toFixed(2));
    yourRing.setAttribute('opacity', (1 - (Math.sin(pulseT * 2.1) * .5 + .5)).toFixed(2));
    render();
  };
  Anim.add(ticker);

  guide.say(`Every amber dot is a data centre; every blue thread, a cable carrying the internet between them. Now look for the one that's <b>pulsing</b>. That one is yours.`);
  await sleep(600);
  await guide.next();

  /* ===================== BEAT 4 — land it ===================== */
  guide.aha(`Somewhere in that hall is a chip, and in that chip a transistor, and in that transistor an atom you placed by hand in Act 1.`,
    `Sand to superclusters. You built it.`);
  await guide.next();
}
