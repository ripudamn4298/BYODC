// BYODC — landing page: the ARTIFACT (a hand-drawn camera move through the
// machine — rack room → one server → the GPU → the die → a single transistor —
// scrubbed by scroll from 151 sketch frames) + scroll story.
// Canvas 2D; GSAP ScrollTrigger drives the scrub. The frames live in
// animation-frames-hd/ (2568×1432, multiply-blended into the paper).
import { $, el, RM, clamp } from './engine/util.js';

/* ---------------- the frames ---------------- */
const FRAME_COUNT = 151;
const framePath = i => `animation-frames-hd/ezgif-frame-${String(i + 1).padStart(3, '0')}.jpg`;

// where the camera RESTS for each phase (0-indexed frames):
//   0   — the rack in its room, cables overhead          (01 · THE DATA CENTRE)
//   77  — the 1U tray pulled from the stack              (02 · THE SERVER)
//   103 — the GPU laid open under the tray               (03 · THE GPU)
//   127 — the bare die, micro-architecture labelled      (04 · THE CHIP)
//   150 — the single 7nm FinFET, fully drawn             (05 · THE TRANSISTOR)
const ANCHORS = [0, 77, 103, 127, 150];

const PHASES = [
  { idx: '01', label: 'THE DATA CENTRE', title: 'This is where it <em>ends up.</em>', body: `A rack in a data centre — servers, switches, and the cabling that ties them into one machine. <b>Data centres are what make today's internet possible</b> — every search, stream and sentence you've ever typed lives in a room like this. You're going to build one from nothing. So let's go <b>all the way in.</b>` },
  { idx: '02', label: 'THE SERVER', title: 'Pull out <em>one server.</em>', body: `Slide a single tray from the stack: fans, CPUs, memory and storage packed into a box <b>one rack-unit tall</b>. Everything a data centre does happens inside thousands of these. Keep going.` },
  { idx: '03', label: 'THE GPU', title: 'Inside it — <em>the GPU.</em>', body: `The card doing the real work. Under the shroud: a heatsink, stacks of high-bandwidth memory, and <b>thousands of small cores</b> built for one job — multiplying numbers, all at once, without rest. Closer.` },
  { idx: '04', label: 'THE CHIP', title: 'At its heart — <em>the die.</em>', body: `Lift the package open and you reach a sliver of silicon smaller than a fingernail — cache, logic gates, and the metal wiring that stitches <b>tens of billions</b> of switches together. Closer still.` },
  { idx: '05', label: 'THE TRANSISTOR', title: 'All the way down — <em>one transistor.</em>', body: `A single 7nm FinFET: a source, a drain, and a gate that creates a channel where there was none. No moving parts — just doped silicon, switching billions of times a second. <b>That's where you begin.</b> One switch — then we climb every rung back up to the machine.` },
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
  let W = 0, H = 0, DPR = 1;
  let drawn = -1;      // frame index currently on the canvas

  function fit(){
    DPR = Math.min(2, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    drawn = -1; // force redraw at the new size
  }

  // progressive preload — a small worker pool walks the sequence in order;
  // until a frame arrives we draw the nearest loaded one below it
  const imgs = new Array(FRAME_COUNT).fill(null);
  const loaded = new Array(FRAME_COUNT).fill(false);
  let next = 0;
  function pump(){
    if (next >= FRAME_COUNT) return;
    const i = next++;
    const im = new Image();
    im.onload = () => { imgs[i] = im; loaded[i] = true; if (i === nearest(target)) drawn = -1; pump(); };
    im.onerror = () => pump();
    im.src = framePath(i);
  }
  for (let k = 0; k < 8; k++) pump();

  function nearest(i){
    i = Math.round(clamp(i, 0, FRAME_COUNT - 1));
    for (let d = 0; d < FRAME_COUNT; d++){
      if (loaded[i - d] && i - d >= 0) return i - d;
      if (loaded[i + d] && i + d < FRAME_COUNT) return i + d;
    }
    return -1;
  }

  // dwell: hold while the copy is readable, travel in the gap between phases
  const dwell = t => {
    const a = .24, b = .76;
    if (t <= a) return 0;
    if (t >= b) return 1;
    const u = (t - a) / (b - a);
    return u * u * (3 - 2 * u);
  };

  let target = 0;      // fractional frame the scroll asks for
  let current = 0;     // smoothed frame we actually show
  let progress = 0;    // 0..PHASES.length-1, for the gentle push-in
  function setMorph(p){
    progress = clamp(p, 0, ANCHORS.length - 1);
    const seg = Math.min(ANCHORS.length - 2, Math.floor(progress));
    const t = progress - seg;
    target = ANCHORS[seg] + (ANCHORS[seg + 1] - ANCHORS[seg]) * dwell(t);
  }

  function draw(){
    const idx = nearest(current);
    if (idx < 0 || idx === drawn) return;
    drawn = idx;
    const im = imgs[idx];
    ctx.clearRect(0, 0, W, H);
    // on phones the sketch is a background texture, same as the dot artifact was
    ctx.globalAlpha = W <= 880 ? .5 : 1;
    // cover-fit with a slow push-in as we go deeper. The rack scene fills its
    // frame edge to edge; the later diagrams sit centre-left with blank paper
    // on the right — so as the zoom leaves the rack (frames 0→77) the whole
    // drawing eases right to live beside the copy column, not under it.
    const zoom = 1.02 + progress * .02;
    const s = Math.max(W / im.naturalWidth, H / im.naturalHeight) * zoom;
    const dw = im.naturalWidth * s, dh = im.naturalHeight * s;
    const t01 = clamp(current / ANCHORS[1], 0, 1);
    const lean = W > 880 ? W * (.06 + .14 * t01) : 0;
    ctx.drawImage(im, (W - dw) / 2 + lean, (H - dh) / 2, dw, dh);
    ctx.globalAlpha = 1;
  }

  let last = performance.now();
  function frame(t){
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (t - last) / 1000); last = t;
    // exponential follow — scrubbing feels like film being pulled, not stepped
    current += (target - current) * Math.min(1, dt * 9);
    if (Math.abs(target - current) < .02) current = target;
    draw();
  }

  fit();
  addEventListener('resize', fit);
  cleanup.push(() => removeEventListener('resize', fit));

  if (RM){
    // reduced motion: a single still of the completed drawing
    const im = new Image();
    im.onload = () => { imgs[FRAME_COUNT - 1] = im; loaded[FRAME_COUNT - 1] = true; current = target = FRAME_COUNT - 1; draw(); };
    im.src = framePath(FRAME_COUNT - 1);
  } else {
    raf = requestAnimationFrame(frame);
  }

  const api = {
    setMorph,
    settle(){ current = target; drawn = -1; draw(); },   // debug/verification: snap + repaint now
    get frame(){ return drawn; }, get target(){ return target; },
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

  // the journey: pin (CSS sticky) + scrubbed frames + phase copy swaps
  const phaseEls = [...document.querySelectorAll('.jphase')];
  gsap.set(phaseEls[0], { opacity: 1 });
  ScrollTrigger.create({
    trigger: '#journey', start: 'top top', end: 'bottom bottom',
    scrub: 1.25,                                        // let scroll momentum settle into each transition
    snap: {                                             // always settle on a phase
      snapTo: 1 / (PHASES.length - 1),
      duration: { min: .3, max: .9 },
      delay: .08,
      ease: 'power2.out',
    },
    onUpdate(self){
      const P = self.progress * (PHASES.length - 1);   // 0..4
      art.setMorph(P);
      phaseEls.forEach((elp, k) => {
        const d = Math.abs(P - k);
        // tight window: each copy is gone before its neighbour is halfway in,
        // so adjacent phases never sit on each other
        const o = clamp((.62 - d) / .28, 0, 1);
        elp.style.opacity = o.toFixed(3);
        elp.style.transform = `translateY(calc(-50% + ${(P - k) * -56}px))`;
      });
    },
  });

  // the artifact belongs to the hero + journey only — fade sketch and scrim
  // together as the journey hands over to the dark section
  const artCv = $('#artifact'), scrim = $('#scrim');
  ScrollTrigger.create({
    trigger: '#journey', start: 'bottom 96%', end: 'bottom 45%', scrub: true,
    onUpdate(self){
      const o = (1 - self.progress).toFixed(3);
      artCv.style.opacity = o;
      if (scrim) scrim.style.opacity = o;
    },
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
