// BYODC — landing page: the ARTIFACT (a draggable constellation of ink dots that
// morphs lattice → transistor → MOSFET → chip → rack as you scroll) + scroll story.
// Canvas 2D, ~430 points, spring physics; GSAP ScrollTrigger drives the morph.
import { $, el, RM, clamp, rand } from './engine/util.js';
import { EARTH_DOTS } from './earth-dots.js';

const N = 880;
const INK = '#1D2117', BLUE = '#2946CC', RED = '#D9481E', AMBER = '#A8741F', FAINT = '#989C8C';

/* ---------------- formation generators (normalized [0,1]² + color + radius) ---------------- */
function pad(pts){
  const out = pts.slice(0, N);
  let i = 0;
  while (out.length < N){
    const p = pts[i % pts.length];
    out.push({ x: p.x + rand(-.006, .006), y: p.y + rand(-.006, .006), c: p.c, r: p.r * .8 });
    i++;
  }
  return out;
}
const P = (x, y, c = INK, r = 2) => ({ x, y, c, r });
function rectPerim(x, y, w, h, n, c, r = 1.8){
  const pts = [], per = 2 * (w + h);
  for (let i = 0; i < n; i++){
    let d = (i / n) * per;
    if (d < w) pts.push(P(x + d, y, c, r));
    else if ((d -= w) < h) pts.push(P(x + w, y + d, c, r));
    else if ((d -= h) < w) pts.push(P(x + w - d, y + h, c, r));
    else pts.push(P(x, y + h - (d - w), c, r));
  }
  return pts;
}
function linePts(x1, y1, x2, y2, n, c, r = 1.8){
  const pts = [];
  for (let i = 0; i < n; i++){
    const t = n === 1 ? .5 : i / (n - 1);
    pts.push(P(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, c, r));
  }
  return pts;
}

function fLattice(){
  const pts = [], cols = 5, rows = 4;
  const x0 = .16, y0 = .14, gx = (1 - 2 * x0) / (cols - 1), gy = (1 - 2 * y0) / (rows - 1);
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++){
    const cx = x0 + j * gx, cy = y0 + i * gy;
    for (let k = 0; k < 6; k++){ // atom = ring of 6
      const a = k * Math.PI / 3 + (i + j);
      pts.push(P(cx + Math.cos(a) * .018, cy + Math.sin(a) * .026, INK, 2.1));
    }
    if (j < cols - 1){ pts.push(P(cx + gx * .44, cy, BLUE, 1.9)); pts.push(P(cx + gx * .56, cy, BLUE, 1.9)); }
    if (i < rows - 1){ pts.push(P(cx, cy + gy * .44, BLUE, 1.9)); pts.push(P(cx, cy + gy * .56, BLUE, 1.9)); }
  }
  return pad(pts);
}
function fTransistor(){
  const pts = [
    ...rectPerim(.08, .30, .20, .40, 64, BLUE),          // emitter (small)
    ...rectPerim(.31, .30, .10, .40, 40, RED),           // base (thin)
    ...rectPerim(.44, .30, .40, .40, 104, BLUE),         // collector (wide)
    ...linePts(.36, .06, .36, .30, 22, RED, 1.6),        // base stem
    ...linePts(.02, .50, .08, .50, 8, INK, 1.6),
    ...linePts(.84, .50, .96, .50, 10, INK, 1.6),
  ];
  return pad(pts);
}
function fMosfet(){
  const pts = [
    ...rectPerim(.06, .42, .88, .38, 130, RED, 1.6),     // p substrate
    ...rectPerim(.10, .42, .20, .16, 44, BLUE),          // source well
    ...rectPerim(.70, .42, .20, .16, 44, BLUE),          // drain well
    ...linePts(.32, .40, .68, .40, 30, AMBER, 2),        // oxide
    ...rectPerim(.32, .22, .36, .12, 56, INK),           // gate
    ...linePts(.50, .06, .50, .22, 14, INK, 1.6),        // gate stem
  ];
  return pad(pts);
}
function fChip(){
  const pts = [...rectPerim(.18, .16, .64, .64, 150, INK, 1.8)];
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++)
    pts.push(P(.25 + j * .07, .23 + i * .07, (i * 8 + j) % 9 === 0 ? BLUE : FAINT, 1.9));
  for (let k = 0; k < 12; k++){ // pins
    const t = .21 + k * .05;
    pts.push(...linePts(t, .16, t, .09, 3, INK, 1.4));
    pts.push(...linePts(t, .80, t, .87, 3, INK, 1.4));
  }
  return pad(pts);
}
/* ---------------- THE GLOBE — formation 0, alive ----------------
   A rotating dotted Earth: landmasses in ink, data-centre hubs in amber,
   great-circle connection arcs in blue. Draggable to spin. Its projected
   positions refresh every frame while it's on stage, then morph away.   */
const DEG = Math.PI / 180;
// landmasses come pre-baked from real Natural Earth coastlines (js/earth-dots.js)
// data-centre hubs (lat, lon): Ashburn, Oregon, São Paulo, London, Frankfurt,
// Stockholm, Mumbai, Singapore, Tokyo, Sydney, Dubai, Hsinchu, Dublin, Johannesburg
const HUBS = [[39,-77],[45,-122],[-23,-46],[51,0],[50,9],[59,18],[19,73],[1,104],[35,140],[-34,151],[25,55],[25,121],[53,-6],[-26,28]];
const ARC_PAIRS = [[0,3],[0,2],[3,6],[6,7],[7,8],[8,1],[7,9],[4,10]];

function ll2v(lat, lon){
  const la = lat * DEG, lo = lon * DEG;
  return [Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)];
}
function slerp(a, b, t){
  let dot = a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  dot = clamp(dot, -1, 1);
  const om = Math.acos(dot), so = Math.sin(om) || 1e-6;
  const ka = Math.sin((1 - t) * om) / so, kb = Math.sin(t * om) / so;
  return [a[0]*ka + b[0]*kb, a[1]*ka + b[1]*kb, a[2]*ka + b[2]*kb];
}
function buildGlobe3d(){
  const feats = [];
  // silhouette rim (screen-space circle, doesn't rotate)
  for (let k = 0; k < 60; k++) feats.push({ kind: 'rim', th: k / 60 * Math.PI * 2 });
  // hubs + arcs first so they never get truncated
  const hubV = HUBS.map(([la, lo]) => ll2v(la, lo));
  hubV.forEach(v => feats.push({ kind: 'hub', v, c: AMBER, r: 2.9 }));
  for (const [ia, ib] of ARC_PAIRS){
    for (let k = 1; k < 12; k++){
      const t = k / 12;
      const v = slerp(hubV[ia], hubV[ib], t);
      const lift = 1 + .07 * Math.sin(Math.PI * t);
      feats.push({ kind: 'arc', v: [v[0]*lift, v[1]*lift, v[2]*lift], c: BLUE, r: 1.4 });
    }
  }
  // real coastlines — tiny jitter keeps the dot texture organic
  for (const [lat, lon] of EARTH_DOTS)
    feats.push({ kind: 'land', v: ll2v(lat + rand(-.8, .8), lon + rand(-.8, .8)), c: INK, r: rand(1.5, 1.85) });
  // fit to N: truncate or duplicate with jitter
  const out = feats.slice(0, N);
  let i = 0;
  while (out.length < N){
    const f = feats[i % feats.length];
    out.push(f.v ? { ...f, v: [f.v[0] + rand(-.02,.02), f.v[1] + rand(-.02,.02), f.v[2] + rand(-.02,.02)] } : { ...f });
    i++;
  }
  return out;
}
const GLOBE3D = buildGlobe3d();
// yaw −1.05 opens on Europe · Africa · Asia (the fullest hemisphere); gentle tilt
const globe = { yaw: -1.05, pitch: .14, vyaw: .14, vpitch: 0, dragging: false, autoSpin: .14 };
const GLOBE_RAD = .46;

/* fills `out[i] = {x,y,c,r,a}` with the globe's current projection */
function projectGlobe(out){
  const cy = Math.cos(globe.yaw), sy = Math.sin(globe.yaw);
  const cp = Math.cos(globe.pitch), sp = Math.sin(globe.pitch);
  for (let i = 0; i < N; i++){
    const f = GLOBE3D[i], o = out[i];
    if (f.kind === 'rim'){
      o.x = .5 + Math.cos(f.th) * GLOBE_RAD;
      o.y = .5 + Math.sin(f.th) * GLOBE_RAD;
      o.c = FAINT; o.r = 1.1; o.a = .5;
      continue;
    }
    const [x0, y0, z0] = f.v;
    const x1 = x0 * cy + z0 * sy, z1 = -x0 * sy + z0 * cy;
    const y2 = y0 * cp - z1 * sp, z2 = y0 * sp + z1 * cp;
    o.x = .5 + x1 * GLOBE_RAD;
    o.y = .5 - y2 * GLOBE_RAD;
    o.c = f.c;
    const front = z2 > 0;
    o.r = front ? f.r : f.r * .45;
    o.a = front ? 1 : .08;
  }
}
function stepGlobe(dt){
  if (!globe.dragging){
    globe.vyaw += (globe.autoSpin - globe.vyaw) * .6 * dt;
    globe.vpitch *= Math.exp(-2.2 * dt);
  }
  globe.yaw += globe.vyaw * dt;
  globe.pitch = clamp(globe.pitch + globe.vpitch * dt, -.9, .9);
}

const fGlobeStatic = (() => {   // static slot; refreshed live each frame while on stage
  const arr = Array.from({ length: N }, () => ({ x: .5, y: .5, c: INK, r: 1.8, a: 1 }));
  projectGlobe(arr);
  return arr;
})();

// hero → scroll: the internet's machinery dissolves all the way down to a single crystal
const FORMATIONS = [fGlobeStatic, fChip(), fMosfet(), fTransistor(), fLattice()];

const PHASES = [
  { idx: '01', label: 'THE INTERNET', title: 'This is where it <em>ends up.</em>', body: `Every amber dot is a data centre; every blue thread, a cable carrying the internet between them. <b>Data centres are what make today's internet possible</b> — every search, stream and sentence you've ever typed lives inside one. You're going to build one from nothing. So let's go <b>all the way in.</b>` },
  { idx: '02', label: 'THE CHIP', title: 'Zoom in — <em>a single chip.</em>', body: `Pull one board from one rack and you reach a sliver of silicon smaller than a fingernail, carrying <b>tens of billions</b> of switches. Keep going.` },
  { idx: '03', label: 'THE FIELD', title: 'Closer — <em>one switch.</em>', body: `Each switch is a MOSFET: a metal gate hovering over silicon on a whisker of glass. A breath of voltage conjures a channel out of nothing — no moving parts. Closer still.` },
  { idx: '04', label: 'THE SWITCH', title: 'Before the gate, <em>the transistor.</em>', body: `Strip it back to the first idea — three layers of doped silicon where a tiny current commands a vast one. The invention that lit the whole world up.` },
  { idx: '05', label: 'THE BEGINNING', title: 'All the way down — <em>a grain of sand.</em>', body: `And beneath all of it: a crystal of purified sand with a few atoms swapped by hand to make it conduct. <b>That's where you begin.</b> One atom — then we climb every rung back up to the machine.` },
];

/* ---------------- the real world — statements + flying fact cards ---------------- */
const RW_STATEMENTS = [
  `A modern GPU carries <span class="hl">208 billion</span> of the switches you're about to build — <em>each one smaller than a virus.</em>`,
  `They're printed with light that <span class="hl">doesn't occur naturally on Earth</span> — struck from droplets of molten tin, <em>50,000 times a second.</em>`,
  `Sand to superclusters is the most precise thing <span class="hl">humans have ever manufactured.</span> <em>Time to climb it.</em>`,
];
// seg: which statement window the card belongs to · x,y in % of viewport · spd: parallax factor (±)
const RW_FACTS = [
  { seg: 0, x: 4,  y: 14, spd: 1.0,  label: 'SCALE',                body: `A human hair is ~<b>90,000 nm</b> across. A transistor gate: ~<b>5 nm</b>. Eighteen thousand of them, side by side, in one hair.` },
  { seg: 0, x: 72, y: 10, spd: .55,  label: 'PURITY',               body: `Chip-grade silicon is <b>99.9999999%</b> pure. Nine nines — one stray atom per billion.` },
  { seg: 0, x: 66, y: 72, spd: 1.35, label: 'RELIABILITY',          body: `A switch you build today will flip <b>3 billion times a second</b>, for twenty years, without failing once.` },
  { seg: 1, x: 6,  y: 64, spd: .8,   label: 'ASML · VELDHOVEN, NL', body: `Exactly <b>one company on Earth</b> can build an EUV lithography machine — the printer of modern chips.` },
  { seg: 1, x: 70, y: 18, spd: 1.25, label: 'PRICE TAG',            body: `A single High-NA EUV machine: ~<b>$380,000,000</b>. It ships in <b>40 freight containers</b>.` },
  { seg: 1, x: 10, y: 12, spd: .5,   label: 'THE MIRRORS',          body: `Its mirrors are the <b>flattest objects ever made</b> — scaled to the size of Germany, the tallest bump would be 1 mm.` },
  { seg: 2, x: 68, y: 62, spd: 1.1,  label: 'TSMC · HSINCHU, TW',   body: `~<b>90%</b> of the world's most advanced chips are printed by <b>one company</b> in Taiwan.` },
  { seg: 2, x: 5,  y: 20, spd: .65,  label: 'CLEANROOM',            body: `The air in a chip fab is ~<b>1,000× cleaner</b> than a hospital operating theatre.` },
  { seg: 2, x: 8,  y: 70, spd: 1.4,  label: 'OUTPUT',               body: `Humanity now makes <b>more transistors every year</b> than there are grains of sand on Earth.` },
];

function initRealWorld(){
  const center = document.querySelector('.rw-center');
  const cardsWrap = document.querySelector('.rw-cards');
  const states = RW_STATEMENTS.map(html => {
    const p = el('div', { class: 'rw-state' }, html);
    center.appendChild(p); return p;
  });
  const cards = RW_FACTS.map(f => {
    const c = el('div', { class: 'fact-card', style: `left:${f.x}%;top:${f.y}%` },
      `<div class="fc-label">${f.label}</div><div class="fc-body">${f.body}</div>`);
    cardsWrap.appendChild(c); return { el: c, f };
  });
  if (RM || typeof gsap === 'undefined'){
    states.forEach(s => s.style.opacity = 1);
    return;
  }
  gsap.set(states[0], { opacity: 1 });
  ScrollTrigger.create({
    trigger: '#realworld', start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate(self){
      const P = self.progress * 3;   // 0..3, one unit per statement window
      states.forEach((s, k) => {
        const local = P - k;         // statement k owns [k, k+1)
        const o = local <= 0 || local >= 1 ? 0 : Math.sin(Math.PI * clamp(local, 0, 1));
        s.style.opacity = Math.min(1, o * 1.5).toFixed(3);
        s.style.transform = `translateY(calc(-50% + ${(0.5 - clamp(local, 0, 1)) * 40}px))`;
      });
      cards.forEach(({ el: c, f }) => {
        const local = clamp(P - f.seg, 0, 1);
        const o = local <= 0 || local >= 1 ? 0 : Math.min(1, Math.sin(Math.PI * local) * 1.7);
        c.style.opacity = o.toFixed(3);
        c.style.transform = `translateY(${(0.5 - local) * 130 * f.spd}px)`;
      });
    },
  });
}

/* ---------------- artifact engine ---------------- */
let raf = null, cleanup = [];

function artifact(){
  const cv = $('#artifact'), ctx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1, region = { x: 0, y: 0, s: 1 };

  function fit(){
    DPR = Math.min(2, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (W > 880){
      const s = Math.min(W * .40, H * .74);
      region = { x: W * .58 + (W * .40 - s) / 2, y: (H - s) / 2 + H * .02, s };
    } else {
      const s = Math.min(W * .82, H * .36);
      region = { x: (W - s) / 2, y: H * .62, s };
    }
  }
  fit();
  addEventListener('resize', fit);
  cleanup.push(() => removeEventListener('resize', fit));

  // points
  const pts = [];
  const order = [...Array(N).keys()].sort(() => Math.random() - .5); // stagger order
  for (let i = 0; i < N; i++){
    const f = FORMATIONS[0][i];
    pts.push({
      x: Math.random(), y: Math.random(),
      vx: 0, vy: 0,
      tx: f.x, ty: f.y, c: f.c, r: f.r, a: f.a ?? 1,
      stag: order[i] / N,
    });
  }

  let morphP = 0; // 0..FORMATIONS.length-1
  // dwell timing: each formation HOLDS while its text is readable, and the whole
  // morph happens in the gap between text phases — no drift while you read.
  const dwell = t => {
    const a = .42, b = .64;
    if (t <= a) return 0;
    if (t >= b) return 1;
    const u = (t - a) / (b - a);
    return u * u * (3 - 2 * u);
  };
  function setMorph(p){
    morphP = clamp(p, 0, FORMATIONS.length - 1);
    const seg = Math.min(FORMATIONS.length - 2, Math.floor(morphP));
    const t = morphP - seg;
    if (seg === 0) projectGlobe(FORMATIONS[0]);   // the globe is alive while on stage
    const mT = dwell(t);
    const A = FORMATIONS[seg], B = FORMATIONS[seg + 1];
    for (let i = 0; i < N; i++){
      const p0 = pts[i];
      // per-point stagger inside the morph window for an organic wave
      const tt = clamp((mT - p0.stag * .25) / .75, 0, 1);
      const e = tt * tt * (3 - 2 * tt);
      const aA = A[i].a ?? 1, aB = B[i].a ?? 1;
      p0.tx = A[i].x + (B[i].x - A[i].x) * e;
      p0.ty = A[i].y + (B[i].y - A[i].y) * e;
      p0.c = e > .5 ? B[i].c : A[i].c;
      p0.r = A[i].r + (B[i].r - A[i].r) * e;
      p0.a = aA + (aB - aA) * e;
    }
  }
  setMorph(0);

  // drag interaction — while the globe is on stage, dragging SPINS it;
  // after it has morphed away, dragging grabs nearby dots (fling + spring back)
  const ptr = { x: 0, y: 0, px: 0, py: 0, down: false, has: false };
  function toWorld(px, py){ return { x: (px - region.x) / region.s, y: (py - region.y) / region.s }; }
  const globeMode = () => morphP < .5;
  const overGlobe = w => Math.hypot(w.x - .5, w.y - .5) < GLOBE_RAD + .06;
  function onDown(e){
    if (e.target.closest('a,button,input')) return;
    const w = toWorld(e.clientX, e.clientY);
    if (globeMode()){
      if (!overGlobe(w)) return;
      globe.dragging = true;
    } else {
      if (!pts.some(p => Math.hypot(p.x - w.x, p.y - w.y) < .12)) return;
    }
    ptr.down = true; ptr.has = true;
    ptr.x = ptr.px = w.x; ptr.y = ptr.py = w.y;
    document.body.style.cursor = 'grabbing';
  }
  function onMove(e){
    const w = toWorld(e.clientX, e.clientY);
    if (globe.dragging){
      const dx = w.x - ptr.x, dy = w.y - ptr.y;
      globe.yaw += dx * 3.0;
      globe.pitch = clamp(globe.pitch + dy * 3.0, -.9, .9);
      globe.vyaw = dx * 90;   // release inertia
    }
    ptr.px = ptr.x; ptr.py = ptr.y; ptr.x = w.x; ptr.y = w.y;
    if (!ptr.down){
      const near = globeMode() ? overGlobe(w)
        : pts.some(p => Math.hypot(p.x - w.x, p.y - w.y) < .1);
      document.body.style.cursor = near ? 'grab' : '';
      ptr.has = near;
    }
  }
  function onUp(){ ptr.down = false; globe.dragging = false; document.body.style.cursor = ''; }
  if (!RM){
    addEventListener('pointerdown', onDown);
    addEventListener('pointermove', onMove);
    addEventListener('pointerup', onUp);
    cleanup.push(() => { removeEventListener('pointerdown', onDown); removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp); });
  }

  let last = performance.now();
  function step(dt, time){
    stepGlobe(dt);
    if (morphP < 1) setMorph(morphP);   // keep the live globe's projection flowing into targets
    ctx.clearRect(0, 0, W, H);

    // faint frame around the region (corner ticks)
    ctx.strokeStyle = 'rgba(29,33,23,.22)'; ctx.lineWidth = 1;
    const { x: rx, y: ry, s } = region, tk = 10;
    ctx.beginPath();
    ctx.moveTo(rx, ry + tk); ctx.lineTo(rx, ry); ctx.lineTo(rx + tk, ry);
    ctx.moveTo(rx + s - tk, ry); ctx.lineTo(rx + s, ry); ctx.lineTo(rx + s, ry + tk);
    ctx.moveTo(rx + s, ry + s - tk); ctx.lineTo(rx + s, ry + s); ctx.lineTo(rx + s - tk, ry + s);
    ctx.moveTo(rx + tk, ry + s); ctx.lineTo(rx, ry + s); ctx.lineTo(rx, ry + s - tk);
    ctx.stroke();

    const baseAlpha = W <= 880 ? .5 : 1;   // on phones the artifact is a background texture
    const spring = morphP < 1 ? 120 : 46;  // crisp tracking while the globe rotates
    const dragVX = (ptr.x - ptr.px) / Math.max(dt, .001), dragVY = (ptr.y - ptr.py) / Math.max(dt, .001);
    for (const p of pts){
      // spring to target
      let ax = (p.tx - p.x) * spring, ay = (p.ty - p.y) * spring;
      // gentle idle breath
      ax += Math.sin(time * .8 + p.stag * 12) * .12;
      ay += Math.cos(time * .7 + p.stag * 9) * .12;
      if (ptr.down && !globe.dragging){
        const d = Math.hypot(p.x - ptr.x, p.y - ptr.y);
        if (d < .14){
          const k = 1 - d / .14;
          ax += (ptr.x - p.x) * 140 * k + dragVX * 3.2 * k;
          ay += (ptr.y - p.y) * 140 * k + dragVY * 3.2 * k;
        }
      }
      p.vx = (p.vx + ax * dt) * .88;
      p.vy = (p.vy + ay * dt) * .88;
      p.x += p.vx * dt; p.y += p.vy * dt;

      ctx.globalAlpha = baseAlpha * (p.a ?? 1);
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(region.x + p.x * region.s, region.y + p.y * region.s, p.r, 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function frame(t){
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (t - last) / 1000); last = t;
    step(dt, t / 1000);
  }

  if (RM){
    // one static frame of the lattice
    ctx.clearRect(0, 0, W, H);
    for (const p of pts){
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(region.x + p.tx * region.s, region.y + p.ty * region.s, p.r, 0, 7);
      ctx.fill();
    }
  } else {
    raf = requestAnimationFrame(frame);
  }

  const api = {
    setMorph,
    settle(){ for (const p of pts){ p.x = p.tx; p.y = p.ty; p.vx = 0; p.vy = 0; } step(.016, performance.now() / 1000); },
  };
  window.__byodcArt = api;   // debug/verification hook (harmless)
  return api;
}

/* ---------------- scroll choreography ---------------- */
export function initLanding(){
  const landing = $('#landing');
  if (RM) landing.classList.add('rm');

  // inject journey phases
  const jc = $('.journey-copy');
  PHASES.forEach((ph, i) => {
    jc.appendChild(el('div', { class: 'jphase', 'data-phase': i },
      `<div class="microlabel"><span class="idx">${ph.idx}</span> — ${ph.label}</div>
       <h3>${ph.title}</h3><p>${ph.body}</p>`));
  });

  const art = artifact();

  if (RM || typeof gsap === 'undefined'){
    initRealWorld();
    document.querySelectorAll('.reveal').forEach(r => r.classList.add('shown'));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  initRealWorld();

  // hero entrance
  gsap.to('#hero .reveal', {
    opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
    stagger: .12, delay: .15,
    onComplete(){ document.querySelectorAll('#hero .reveal').forEach(r => r.classList.add('shown')); },
  });

  // nav background on scroll
  ScrollTrigger.create({
    start: 40, onUpdate(self){ $('#lnav').classList.toggle('scrolled', self.scroll() > 40); },
  });

  // the journey: pin (CSS sticky) + scrubbed morph + phase copy swaps
  const phaseEls = [...document.querySelectorAll('.jphase')];
  gsap.set(phaseEls[0], { opacity: 1 });
  ScrollTrigger.create({
    trigger: '#journey', start: 'top top', end: 'bottom bottom',
    scrub: .6,                                          // soften hard scrolls
    snap: {                                             // always settle on a phase
      snapTo: 1 / (PHASES.length - 1),
      duration: { min: .3, max: .9 },
      delay: .08,
      ease: 'power2.out',
    },
    onUpdate(self){
      const P = self.progress * (PHASES.length - 1);   // 0..4
      art.setMorph(P);
      // generous reading windows: text holds until d≈.40 and eases out by .52,
      // while the formation morphs inside [.42,.64] — nothing feels clipped
      phaseEls.forEach((elp, k) => {
        const d = Math.abs(P - k);
        const o = clamp((.52 - d) / .12, 0, 1);
        elp.style.opacity = o.toFixed(3);
        elp.style.transform = `translateY(calc(-50% + ${(P - k) * -26}px))`;
      });
    },
  });

  // the artifact belongs to the hero + journey only — fade it out as the
  // journey hands over to the dark section, so dots never sit under later content
  const artCv = $('#artifact');
  ScrollTrigger.create({
    trigger: '#journey', start: 'bottom 96%', end: 'bottom 45%', scrub: true,
    onUpdate(self){ artCv.style.opacity = (1 - self.progress).toFixed(3); },
  });

  // acts rows
  gsap.fromTo('.act-row', { opacity: 0, y: 18 }, {
    opacity: 1, y: 0, duration: .7, ease: 'power3.out', stagger: .08,
    scrollTrigger: { trigger: '#acts', start: 'top 72%' },
  });
}

export function teardownLanding(){
  if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.getAll().forEach(st => st.kill());
  if (raf) cancelAnimationFrame(raf);
  cleanup.forEach(fn => fn());
  cleanup = [];
  document.body.style.cursor = '';
}
