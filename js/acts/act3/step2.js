// ACT 3 · STEP 2: "How do you print billions of transistors at once?" (photolithography).
// Course restructure (2026-10-25): retitled from "Print with light"; the story boxes, the
// "why use resist" card and two wiring-stack cards are cut; the gate definitions (moved up
// from step 5), a foundry card, the process node and Moore's law are added.
// Re-carded to the micro-learning contract in DESIGN_MAKEOVER.md §2 / §4 and the card
// script in ACT3_MAKEOVER.md §3: one card at a time (guide.cards), every card focuses and
// names the one thing it is about, and every term (photoresist, mask, expose, develop,
// etch, dope, via) is defined on its own card before the player is asked to use it.
//
// One stage for the whole step. Three scenes fade in and out of it, so the player never
// meets a diagram they did not watch arrive: a cross-section of wafer + resist + mask +
// light, then the five-step loop as tiles and slots, then the same wafer from above with
// two layers to line up.
//
// Colour is semantic (DESIGN.md §1a). Nothing here is a die or a live signal, so nothing
// here is blue: the mask being nudged is amber (meaning 2, in flight and not settled yet)
// and turns green when it lands (a completed check). Everything else is ink, and the
// exposed resist is told apart from unexposed resist by ink weight, not by colour.
//
// Determinism: no Math.random and no Date.now. The mask's starting offset comes from
// mulberry32 with a constant seed, so a live run and a replay start it in the same place
// without recording anything; every visual change rides Anim.tween or sleep, both
// replay-aware; every interaction resolves through flow.ask.
import { svgEl, el, waitFor, sleep } from '../../engine/util.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makePlacer, makeChip, makeRaisedTiles, slideInPanel } from '../../engine/components.js';
import { makeMaskAlign, processTile, mulberry32 } from '../../engine/fab.js';
import { lithoLabHTML } from './lab.js';

/* ---------- scene A: the cross-section, in the stage's 720×480 user units ---------- */
const PLATE = { x: 150, w: 420 };
const OPEN = [[230, 40], [350, 40], [470, 40]];   // mask openings: [x, width]
const MASK_Y = 176, MASK_H = 20;
const RESIST_Y = 300, RESIST_H = 18;
const WAFER_Y = 318, WAFER_H = 54;
const SRC = { x: 300, y: 62, w: 120, h: 30 };

/* ---------- scene B: the five steps ---------- */
const SLOT = { w: 96, h: 60, gap: 30, y: 128 };
const ROW_X = 360 - (5 * SLOT.w + 4 * SLOT.gap) / 2;
const TRAY_Y = 306;
const ORDER = ['COAT', 'EXPOSE', 'DEVELOP', 'ETCH', 'DOPE'];
const CAPS = {
  COAT: 'spread the resist',
  EXPOSE: 'flash through mask',
  DEVELOP: 'wash it off',
  ETCH: 'cut in',
  DOPE: 'fire atoms in',
};
// fixed scramble, so the tray is neither in order nor random
const TRAY_ORDER = ['DEVELOP', 'COAT', 'DOPE', 'EXPOSE', 'ETCH'];

/* ---------- scene C: the two layers ---------- */
const MASK_SEED = 9;          // constant seed => same start offset live and on replay
const ALIGN = { cx: 360, cy: 238 };
const NUDGE = 3;              // user units per press; the start offset is a multiple of it

/* ---------- REVIEW_NOTES N-049: the wiring stack of a finished chip, from the side ----------
   Transistors at the bottom, then 15 copper wiring layers in glass: six fine, four middle,
   three thick, two thickest. Alternate layers run at right angles, so in a slice one layer
   shows wire ends (small squares) and the next shows wires running along the cut. Vias are
   the short plugs between layers. Drawn from a fixed seed, so a replay draws the same slice.
   Not to scale: real top wires are far thicker than the bottom ones than this shows. */
function wiringStackHTML(){
  const rng = mulberry32(49);
  const X0 = 96, X1 = 456;                              // the slice, left to right
  const SI = 404, CU = 'rgba(168,116,31,.55)';
  const groups = [
    { n: 6, h: 6, gap: 6, w: 5, pitch: 12, name: ['FINEST WIRES', 'JOIN NEIGHBOURS'] },
    { n: 4, h: 10, gap: 8, w: 10, pitch: 24, name: ['MIDDLE WIRES', 'CROSS A BLOCK'] },
    { n: 3, h: 16, gap: 12, w: 22, pitch: 45, name: ['THICK WIRES', 'CROSS THE CHIP'] },
    { n: 2, h: 24, gap: 16, w: 44, pitch: 90, name: ['THICKEST WIRES', 'CARRY POWER'] },
  ];
  let out = '', vias = '', y = SI - 16, k = 0, prevGap = 16;
  const brackets = [];
  for (const G of groups){
    const gBot = y;
    for (let i = 0; i < G.n; i++, k++){
      const gap = k === 0 ? 16 : G.gap;
      const bot = y - (k === 0 ? 0 : gap), top = bot - G.h;
      const cols = [];
      for (let x = X0 + G.pitch / 2; x < X1 - G.w / 2; x += G.pitch) cols.push(x);
      if (k % 2 === 0){                                  // wire ends: the wires run into the page
        cols.forEach(x => { out += `<rect x="${(x - G.w / 2).toFixed(1)}" y="${top}" width="${G.w}" height="${G.h}" rx="1" fill="${CU}" stroke="var(--amber)" stroke-width=".8"/>`; });
      } else {                                           // wires running along the cut, with breaks
        let x = X0 + 4;
        while (x < X1 - 12){
          const len = G.pitch * (1 + Math.floor(rng() * 4));
          const x2 = Math.min(X1 - 4, x + len);
          out += `<rect x="${x.toFixed(1)}" y="${top}" width="${(x2 - x - 4).toFixed(1)}" height="${G.h}" rx="1" fill="${CU}" stroke="var(--amber)" stroke-width=".8"/>`;
          x = x2 + 4;
        }
      }
      /* vias down into the gap below this layer (into the transistor contacts for layer 1) */
      if (k > 0){
        const vw = Math.max(3, Math.round(G.w * .55));
        cols.forEach(x => { if (rng() < .3) vias += `<rect x="${(x - vw / 2).toFixed(1)}" y="${bot}" width="${vw}" height="${gap}" fill="${CU}" stroke="var(--amber)" stroke-width=".6"/>`; });
      }
      y = top;
    }
    brackets.push({ top: y, bot: gBot, name: G.name });
  }
  const STACK_TOP = y;
  /* the transistors: N-type sources and drains in the silicon, gates on glass, contacts up */
  let tr = '';
  for (let x = X0 + 14; x + 34 < X1; x += 40){
    tr += `<rect x="${x}" y="${SI}" width="11" height="7" rx="1.5" class="n-region"/>
      <rect x="${x + 23}" y="${SI}" width="11" height="7" rx="1.5" class="n-region"/>
      <rect x="${x + 13}" y="${SI - 9}" width="8" height="7" rx="1" class="gate-metal"/>
      <rect x="${x + 13}" y="${SI - 2}" width="8" height="2" class="oxide"/>
      <rect x="${x + 4}" y="${SI - 16}" width="3" height="16" fill="${CU}"/>
      <rect x="${x + 27}" y="${SI - 16}" width="3" height="16" fill="${CU}"/>`;
  }
  const lab = (b, i) => {
    const mid = (b.top + b.bot) / 2;
    return `<path d="M${X1 + 10} ${b.top + 2} h6 V${b.bot - (i === 0 ? 4 : 2)} h-6" fill="none" stroke="var(--ink-soft)" stroke-width="1"/>
      <text x="${X1 + 26}" y="${mid - 2}" class="lbl" text-anchor="start" style="fill:var(--ink)">${b.name[0]}</text>
      <text x="${X1 + 26}" y="${mid + 11}" class="lbl-faint" text-anchor="start">${b.name[1]}</text>`;
  };
  return `
    <rect x="${X0}" y="${STACK_TOP - 6}" width="${X1 - X0}" height="${SI - STACK_TOP + 6}" fill="rgba(29,33,23,.06)" stroke="var(--hairline-strong)" stroke-width="1"/>
    <rect x="${X0}" y="${SI}" width="${X1 - X0}" height="34" rx="2" class="p-region"/>
    ${tr}${vias}${out}
    ${brackets.map(lab).join('')}
    <path d="M${X1 + 10} ${SI - 10} h6 V${SI + 32} h-6" fill="none" stroke="var(--ink-soft)" stroke-width="1"/>
    <text x="${X1 + 26}" y="${SI + 9}" class="lbl" text-anchor="start" style="fill:var(--ink)">TRANSISTORS</text>
    <text x="${X1 + 26}" y="${SI + 22}" class="lbl-faint" text-anchor="start">IN THE SILICON</text>
    <text x="${(X0 + X1) / 2}" y="${STACK_TOP - 18}" class="lbl" style="fill:var(--ink)">15 WIRING LAYERS ABOVE THE TRANSISTORS</text>
    <text x="360" y="${SI + 62}" class="lbl-faint">A SLICE THROUGH A FINISHED CHIP, SEEN FROM THE SIDE (NOT TO SCALE)</text>`;
}

async function fadeIn(nodes, dur = 300){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  list.forEach(n => { n.style.display = ''; n.style.opacity = '0'; });
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(p); }));
  list.forEach(n => { n.style.opacity = '1'; });
}
async function fadeOut(nodes, dur = 280){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(1 - p); }));
  list.forEach(n => { n.style.display = 'none'; });
}

export async function step2(){
  // Course restructure (2026-10-25): retitled to match the act index.
  guide.title('STEP 2 / 5', 'How do you print <em>billions of transistors at once?</em>');
  guide.cards();

  const stage = newStage('11', 'A wafer coated in resist under a mask, the five printing steps, then two layers lined up');
  const { svg, controls } = stage;

  /* ================= SCENE A — resist, mask, light ================================= */

  const sceneA = [];
  const put = (tag, attrs, style) => {
    const n = svgEl(tag, attrs);
    if (style) Object.assign(n.style, style);
    svg.appendChild(n);
    sceneA.push(n);
    return n;
  };

  /* the wafer, and the film on top of it */
  const wafer = put('rect', { x: PLATE.x, y: WAFER_Y, width: PLATE.w, height: WAFER_H, rx: 3, class: 'tile-bg' });
  // left of the pattern, so the doped patches drawn later never cover it
  const waferT = put('text', { x: PLATE.x + 40, y: WAFER_Y + 33, class: 'lbl-faint' });
  waferT.textContent = 'SILICON';

  /* Course restructure (2026-10-25): the two story boxes that opened the step are cut. The
     premise and this card already say that a fab prints transistors instead of placing them.
     "A billion" became "billions" to match the title. */
  guide.say(`You cannot place billions of transistors by hand, and a fab does not place them
    either. It prints them onto a wafer like this one, with light, one layer at a time (a
    chip is a stack of printed layers).`);
  stage.focus([wafer, waferT], { label: 'the wafer you sliced', at: 'bottom' });
  await guide.next();

  stage.clearFocus();
  const resist = put('rect', { x: PLATE.x, y: RESIST_Y, width: PLATE.w, height: RESIST_H },
    { fill: 'rgba(29,33,23,.07)', stroke: 'var(--hairline-strong)', strokeWidth: '1' });
  resist.style.display = 'none';
  await fadeIn([resist], 320);

  guide.say(`First the wafer is coated with <b>photoresist</b> (resist for short), a thin
    film whose chemistry changes wherever light lands on it. This is the coat step.`);
  stage.focus(resist, { label: 'photoresist', at: 'left' });
  await guide.next();

  /* the mask: a clear plate carrying the layer's pattern in opaque metal */
  stage.clearFocus();
  const maskG = put('g');
  maskG.appendChild(svgEl('rect', {
    x: PLATE.x, y: MASK_Y, width: PLATE.w, height: MASK_H, rx: 2,
    fill: 'none', stroke: 'var(--hairline-strong)', 'stroke-width': 1,
  }));
  let cursor = PLATE.x;
  for (const [ox, ow] of OPEN){
    if (ox > cursor) maskG.appendChild(svgEl('rect', {
      x: cursor, y: MASK_Y + 3, width: ox - cursor, height: MASK_H - 6, fill: 'var(--ink)', opacity: '.82',
    }));
    cursor = ox + ow;
  }
  if (cursor < PLATE.x + PLATE.w) maskG.appendChild(svgEl('rect', {
    x: cursor, y: MASK_Y + 3, width: PLATE.x + PLATE.w - cursor, height: MASK_H - 6, fill: 'var(--ink)', opacity: '.82',
  }));
  maskG.style.display = 'none';
  await fadeIn([maskG], 320);

  guide.say(`Above it sits the <b>mask</b>. A mask works like a stencil: it is a clear plate
    with this layer's pattern drawn on it in metal. Light passes through the gaps and is
    stopped by the metal.`);
  stage.focus(maskG, { label: 'mask', at: 'top' });
  await guide.next();

  /* REVIEW_NOTES N-045: what a mask looks like from above. A panel slides in over the
     cross-section, shows the plate over the wafer it prints, and slides out again. */
  stage.clearFocus();
  const ovG = svgEl('g');
  svg.appendChild(ovG);
  {
    const P = { x: 282, y: 140, s: 156 };          // the mask plate, centred over the wafer
    const W = { cx: 360, cy: 218, r: 182 };        // the wafer underneath it
    const tint = ['rgba(41,70,204,.18)', 'rgba(92,107,69,.24)', 'rgba(168,116,31,.22)', 'rgba(217,72,30,.15)'];
    let dies = '';
    for (let gx = -7; gx <= 7; gx++) for (let gy = -7; gy <= 7; gy++){
      const cx = W.cx + gx * 26, cy = W.cy + gy * 26;
      if (Math.hypot(cx - W.cx, cy - W.cy) > W.r - 16) continue;
      if (cx > P.x - 12 && cx < P.x + P.s + 12 && cy > P.y - 12 && cy < P.y + P.s + 12) continue;
      dies += `<rect x="${cx - 11}" y="${cy - 11}" width="22" height="22" rx="2" fill="${tint[(gx + gy + 14) % 4]}"/>`;
    }
    /* the pattern: a 9 × 9 maze of wires (each cell joins one neighbour), with contact
       dots, drawn from a fixed seed so a replay draws the same plate */
    const rng = mulberry32(45);
    const N = 8, pad = 12, cell = (P.s - 2 * pad) / N;
    const at = (i, j) => [P.x + pad + cell * (i + .5), P.y + pad + cell * (j + .5)];
    let d = '', dots = '';
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++){
      const [x, y] = at(i, j);
      if (rng() < .5 && i < N - 1){ const [x2] = at(i + 1, j); d += `M${x.toFixed(1)} ${y.toFixed(1)} H${x2.toFixed(1)} `; }
      else if (j < N - 1){ const [, y2] = at(i, j + 1); d += `M${x.toFixed(1)} ${y.toFixed(1)} V${y2.toFixed(1)} `; }
      if (rng() < .16) dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.4" fill="#f2ecdc"/>`;
    }
    ovG.innerHTML = `
      <rect x="-20" y="-20" width="760" height="520" fill="var(--paper-high)"/>
      <circle cx="${W.cx}" cy="${W.cy}" r="${W.r}" fill="rgba(41,70,204,.05)" stroke="var(--hairline-strong)" stroke-width="1.4"/>
      ${dies}
      <rect class="ov-plate" x="${P.x}" y="${P.y}" width="${P.s}" height="${P.s}" rx="4" fill="#262a20" stroke="#4d5343" stroke-width="7"/>
      <path d="${d}" fill="none" stroke="#e9e1cb" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round" opacity=".92"/>
      ${dots}
      <rect x="${360 - 54}" y="${P.y - 22}" width="108" height="30" rx="15" fill="var(--ink)"/>
      <text x="360" y="${P.y - 2}" class="lbl" style="fill:var(--paper-high);font-size:13px;letter-spacing:.2em">MASK</text>
      <text x="360" y="${W.cy + W.r + 26}" class="lbl-faint">A MASK OVER THE WAFER IT PRINTS, SEEN FROM ABOVE</text>`;
  }
  ovG.setAttribute('transform', 'translate(720 0)');
  await Anim.tween(650, q => ovG.setAttribute('transform', `translate(${(720 * (1 - q) * (1 - q)).toFixed(1)} 0)`));
  ovG.setAttribute('transform', 'translate(0 0)');

  // Course restructure (2026-10-25): trimmed from 72 words; the card before already says
  // the pattern is drawn in metal.
  guide.say(`Here is a mask from above: a square plate of quartz glass about 15 cm across. The
    machine shrinks its pattern four times as it prints it onto one patch of the wafer.`);
  await guide.next();

  // Course restructure (2026-10-25): the foundry, a light-bulb card (no eyebrow).
  guide.say(`NVIDIA and Apple own no fab. They send their designs, the patterns for every
    mask, to a <b>foundry</b>: a company whose fabs print other companies' chips. This is what
    people mean when they say TSMC makes NVIDIA's chips.`);
  await guide.next();

  /* REVIEW_NOTES N-048: a lens grows out of one spot on the plate and shows an NMOS, drawn
     the way the player built it in Act 1 */
  const spot = { x: 318, y: 178 };
  const lensC = { x: 612, y: 200, r: 82 };
  const lensG = svgEl('g');
  lensG.innerHTML = `
    <defs><clipPath id="lensClip"><circle cx="0" cy="0" r="${lensC.r - 3}"/></clipPath></defs>
    <g clip-path="url(#lensClip)">
      <rect x="-90" y="-90" width="180" height="180" fill="var(--paper-high)"/>
      <rect x="-70" y="-6" width="140" height="58" rx="5" class="p-region"/>
      <rect x="-64" y="-6" width="42" height="22" rx="3" class="n-region"/>
      <rect x="22" y="-6" width="42" height="22" rx="3" class="n-region"/>
      <g class="lens-gate">
        <rect x="-20" y="-28" width="40" height="15" rx="2" class="gate-metal"/>
        <rect x="-20" y="-13" width="40" height="7" class="oxide"/>
      </g>
      <text x="-43" y="9" class="lbl" font-size="9">SOURCE</text>
      <text x="43" y="9" class="lbl" font-size="9">DRAIN</text>
      <text x="0" y="-34" class="lbl" font-size="9">GATE</text>
      <text x="0" y="47" class="lbl-faint" font-size="8">P-TYPE SILICON</text>
      <!-- Course restructure (2026-10-25): the gate-length dimension, shown on its card -->
      <g class="lens-len" stroke="var(--ink)" stroke-width="1" style="display:none">
        <line x1="-20" y1="-6" x2="-20" y2="27"/>
        <line x1="20" y1="-6" x2="20" y2="27"/>
        <line x1="-20" y1="22" x2="20" y2="22"/>
        <text x="0" y="37" class="lbl" font-size="7" stroke="none">GATE LENGTH</text>
      </g>
    </g>
    <circle cx="0" cy="0" r="${lensC.r}" fill="none" stroke="var(--ink)" stroke-width="5"/>
    <circle cx="0" cy="0" r="${lensC.r - 6}" fill="none" stroke="#fff" stroke-width="1.5" opacity=".7"/>
    <line x1="${(lensC.r * .72).toFixed(1)}" y1="${(lensC.r * .72).toFixed(1)}" x2="${(lensC.r * 1.15).toFixed(1)}" y2="${(lensC.r * 1.15).toFixed(1)}"
      stroke="var(--ink)" stroke-width="9" stroke-linecap="round"/>
    <text x="0" y="${lensC.r + 34}" class="lbl" font-size="9">ONE NMOS, LIKE YOURS FROM ACT 1</text>`;
  const ring = svgEl('circle', { cx: spot.x, cy: spot.y, r: 7, fill: 'none', stroke: 'var(--amber)', 'stroke-width': 2.4 });
  const tie = svgEl('line', { x1: spot.x, y1: spot.y, x2: spot.x, y2: spot.y, stroke: 'var(--amber)', 'stroke-width': 1.4, 'stroke-dasharray': '4 3' });
  ovG.append(tie, ring, lensG);
  await Anim.tween(700, q => {
    const e = 1 - (1 - q) * (1 - q);
    const x = spot.x + (lensC.x - spot.x) * e, y = spot.y + (lensC.y - spot.y) * e;
    lensG.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(0.08 + 0.92 * e).toFixed(3)})`);
    tie.setAttribute('x2', x.toFixed(1)); tie.setAttribute('y2', y.toFixed(1));
  });
  lensG.setAttribute('transform', `translate(${lensC.x} ${lensC.y})`);

  guide.say(`Zoom into one tiny spot of that pattern, and its shapes are the parts of
    transistors like the NMOS you built in Act 1: a source and a drain, with a gate sitting on
    glass between them. The masks for a modern chip hold these shapes for billions of
    transistors.`);
  await guide.next();

  /* Course restructure (2026-10-25): the two meanings of "gate" and the gate's length, moved
     up from step 5 (its old cards 3 and 4) to sit beside the first card that says "gate".
     Step 5 now points back here. No stage.focus on these two: dimming the slide-in panel
     lets the cross-section behind it show through, so the lens labels the gate itself. */
  const lensLen = lensG.querySelector('.lens-len');
  guide.say(`The word <b>gate</b> has two meanings in chip writing. Here it is the transistor's
    gate from Act 1, the metal pad whose voltage switches it on and off. Your NAND gate from
    Act 2 was a logic gate, built from several transistors.`);
  await guide.next();

  await fadeIn([lensLen], 280);
  guide.say(`A gate's <b>length</b> is how far it stretches from the source side to the drain
    side, the distance electrons cross under it. The mask sets this length for every gate it
    prints.`);
  await guide.next();

  await Anim.tween(520, q => ovG.setAttribute('transform', `translate(${(-720 * q * q).toFixed(1)} 0)`));
  ovG.remove();

  /* the light source, then the flash */
  stage.clearFocus();
  const srcG = put('g');
  srcG.appendChild(svgEl('rect', { x: SRC.x, y: SRC.y, width: SRC.w, height: SRC.h, rx: 3, class: 'tile-bg' }));
  const srcT = svgEl('text', { x: SRC.x + SRC.w / 2, y: SRC.y + 20, class: 'gate-lbl' });
  srcT.textContent = 'LIGHT';
  srcG.appendChild(srcT);
  srcG.style.display = 'none';
  await fadeIn([srcG], 300);

  guide.say(`The machine flashes light down at the mask. Whatever gets through carries the
    pattern to the resist below.`);
  stage.focus(srcG, { label: 'light source', at: 'top' });
  await guide.next();

  stage.clearFocus();

  const rayStyle = { stroke: 'var(--ink)', strokeWidth: '1', opacity: '.34' };
  const raysTop = put('g');
  for (let x = PLATE.x + 12; x < PLATE.x + PLATE.w; x += 22){
    const l = svgEl('line', { x1: x, y1: SRC.y + SRC.h + 8, x2: x, y2: MASK_Y - 6 });
    Object.assign(l.style, rayStyle);
    raysTop.appendChild(l);
  }
  const raysThrough = put('g');
  for (const [ox, ow] of OPEN){
    for (let k = 1; k <= 3; k++){
      const x = ox + (ow * k) / 4;
      const l = svgEl('line', { x1: x, y1: MASK_Y + MASK_H + 4, x2: x, y2: RESIST_Y - 3 });
      Object.assign(l.style, rayStyle);
      raysThrough.appendChild(l);
    }
  }
  const exposed = OPEN.map(([ox, ow]) => {
    const r = put('rect', { x: ox, y: RESIST_Y, width: ow, height: RESIST_H });
    Object.assign(r.style, {
      fill: 'rgba(29,33,23,.3)', stroke: 'var(--ink)', strokeWidth: '1.1', strokeDasharray: '3 2',
    });
    return r;
  });
  [raysTop, raysThrough, ...exposed].forEach(n => { n.style.display = 'none'; });

  await fadeIn([raysTop], 260);
  SFX.blip();
  await fadeIn([raysThrough], 220);
  await fadeIn(exposed, 300);

  // REVIEW_NOTES N-031: say what "changed" means. This is positive resist.
  guide.say(`This is a <b>positive</b> resist: light breaks it down. Every patch the light
    reached is now soluble, which means it will dissolve in the developer liquid used next.
    The rest of the resist is still solid. That flash is the <b>expose</b> step.`);
  stage.focus(exposed, { label: 'exposed resist', at: 'bottom' });
  await guide.next();

  /* ---------- REVIEW_NOTES N-028 / N-029: finish the layer on the same drawing ----------
     The player watches all five steps happen to this one wafer, in order, and sees the
     finished layer, before being asked to put the steps in order. */

  // Course restructure (2026-10-25): the "Why use resist at all?" card is cut (an unasked why).

  /* develop: the changed resist washes away, leaving openings */
  stage.clearFocus();
  await fadeOut([raysTop, raysThrough], 220);
  await fadeOut(exposed, 300);
  const openings = OPEN.map(([ox, ow]) => put('rect',
    { x: ox, y: RESIST_Y, width: ow, height: RESIST_H },
    { fill: 'var(--paper-high)', stroke: 'none' }));
  guide.say(`Next comes <b>develop</b>: the wafer is rinsed in an alkaline (basic) liquid,
    and the soluble patches dissolve away. The solid resist stays. The resist now has
    openings in exactly the mask's pattern, with silicon showing through them.`);
  stage.focus(openings, { label: 'uncovered silicon', at: 'bottom' });
  await guide.next();

  /* etch: cut down into the uncovered silicon */
  stage.clearFocus();
  const trenches = OPEN.map(([ox, ow]) => put('rect',
    { x: ox, y: WAFER_Y, width: ow, height: 14 },
    { fill: 'var(--paper-high)', stroke: 'var(--ink)', strokeWidth: '1.1', display: 'none' }));
  await fadeIn(trenches, 320);
  // REVIEW_NOTES N-032: develop only patterns the resist; etch is what shapes the silicon.
  // Course restructure (2026-10-25): trimmed from about 70 words.
  guide.say(`Developing removed only resist, so the silicon under each opening has not changed
    yet. Next comes <b>etch</b>: a gas or liquid eats away the silicon through each opening,
    while the resist protects the rest.`);
  stage.focus(trenches, { label: 'etched', at: 'bottom' });
  await guide.next();

  /* dope: atoms reach the silicon only through the openings */
  stage.clearFocus();
  const atoms = put('g');
  for (const [ox, ow] of OPEN){
    for (let k = 0; k < 3; k++){
      atoms.appendChild(svgEl('circle',
        { cx: ox + ow * (k + 1) / 4, cy: RESIST_Y - 24 - (k % 2) * 16, r: 3.4, class: 'carrier-e' }));
    }
  }
  atoms.style.display = 'none';
  const doped = OPEN.map(([ox, ow]) => put('rect',
    { x: ox - 6, y: WAFER_Y + 14, width: ow + 12, height: 22, rx: 3, class: 'n-region' },
    { display: 'none' }));
  await fadeIn([atoms], 240);
  await Anim.tween(520, q => atoms.setAttribute('transform', `translate(0 ${q * 58})`));
  await fadeOut([atoms], 160);
  await fadeIn(doped, 300);
  // Course restructure (2026-10-25): trimmed from 65 words.
  guide.say(`Then <b>dope</b>: phosphorus atoms, a doping element from Act 1, are fired at the
    wafer. They reach the silicon only through the openings, so only the pattern turns N-type.
    A real pass usually etches or dopes, not both.`);
  stage.focus(doped, { label: 'n-type patches', at: 'bottom' });
  await guide.next();

  /* strip: the leftover resist comes off, and the layer is finished */
  stage.clearFocus();
  await fadeOut([resist, ...openings, maskG, srcG], 320);
  guide.say(`Last, the leftover resist is stripped off. What is left is the silicon with
    this layer's pattern cut and doped into it. That is one finished layer.`);
  stage.focus([wafer, ...trenches, ...doped], { label: 'one finished layer', at: 'bottom' });
  await guide.next();

  /* the NMOS-to-mask cards that used to sit here were removed (REVIEW_NOTES N-045); the mask's
     look from above is now shown right after the mask is introduced */
  stage.clearFocus();
  await fadeOut([...sceneA], 260);

  guide.say(`This layer has no wires yet. The metal wires that join transistors into gates,
    like the wires in your NAND gate from Act 2, are printed later, in layers stacked on top,
    using this same loop.`);
  stage.clearFocus();
  await guide.next();

  /* REVIEW_NOTES N-049: what those wiring layers look like on a finished chip */
  const wiring = slideInPanel(svg, wiringStackHTML());
  await wiring.show();
  guide.say(`Here is a slice through a finished chip, seen from the side. The transistors are
    the thin band at the bottom. Above them are 15 layers of copper wires, kept apart by
    glass.`);
  await guide.next();
  /* Course restructure (2026-10-25): the two cards that followed are cut (finer and thicker
     wires, never used again; 15 to 18 layers). "70 to 90 masks" moved to the side-view card. */
  await wiring.hide();

  /* ================= SCENE B — the five steps, in the only order that works ========= */

  stage.clearFocus();

  const slotsG = svgEl('g');
  svg.appendChild(slotsG);
  const slots = ORDER.map((correct, i) => {
    const x = ROW_X + i * (SLOT.w + SLOT.gap);
    const rect = svgEl('rect', { x, y: SLOT.y, width: SLOT.w, height: SLOT.h, class: 'slot' });
    const q = svgEl('text', { x: x + SLOT.w / 2, y: SLOT.y + SLOT.h / 2 + 9, class: 'slot-q' });
    q.textContent = String(i + 1);
    slotsG.append(rect, q);
    return { x, y: SLOT.y, w: SLOT.w, h: SLOT.h, rect, q, value: null, tile: null, correct };
  });

  const tiles = TRAY_ORDER.map(kind => processTile(svg, kind, CAPS[kind]));

  // keycaps that float and press down (REVIEW_NOTES N-043, N-044, N-046); shared helper
  makeRaisedTiles(svg, tiles, { capSize: '6.4px' });
  tiles.forEach(t => { const c = t.g.querySelector('.tile-cap'); if (c) c.setAttribute('y', t.h - 12); });
  tiles.forEach((t, i) => {
    t.home = { x: ROW_X + i * (SLOT.w + SLOT.gap), y: TRAY_Y };
    t.tx = t.home.x; t.ty = t.home.y;
    t.g.style.transform = `translate(${t.home.x}px,${t.home.y}px)`;
    t.g.style.display = 'none';
  });
  const tileOf = kind => tiles.find(t => t.value === kind);

  await fadeIn([slotsG, ...tiles.map(t => t.g)], 340);

  guide.say(`You have now watched all five steps print one layer. They only work in one
    order. <b>Your goal is to put them back in that order.</b>`);
  stage.focus(slotsG, { label: 'the order they run', at: 'top' });
  await guide.next();

  /* no focus for the interaction: stage.focus re-parents what it raises, which the
     placer's pointer handling has to survive */
  stage.clearFocus();
  guide.say(`Drag each tile into a slot, or tap a tile and then a slot. <b>Your goal is to
    fill slots 1 to 5 in the order the steps run.</b>`);

  let wrongs = 0;
  const placer = makePlacer({
    svg, tiles, slots,
    validate: v => v.every((val, i) => val === ORDER[i]),
    onWrong: () => {
      wrongs++;
      guide.say(wrongs === 1
        ? `Not that order, so all five tiles are back in the tray. <b>Your goal is still
           the five steps in the order they run.</b> Ask yourself what has to be on the
           wafer before the light arrives.`
        : `Still not it. <b>Coat comes first, then expose, then develop.</b> Etch and dope
           come last, because they need the openings that develop leaves behind.`);
    },
  });

  await flow.ask(async replay => {
    if (replay !== undefined){ placer.autoPlace(); return replay; }
    await placer.done;
    return true;
  });

  await sleep(560);           // let the last tile finish its slide before measuring it
  guide.say(`Coat, expose, develop, etch, dope: this loop is called
    <b>photolithography</b> (printing a pattern with light). The resist is then stripped
    off and the loop runs again for the next layer, dozens of times over.`);
  stage.focus(tiles.map(t => t.g), { label: 'one layer printed', at: 'bottom' });
  await guide.next();

  /* ================= SCENE C — layer two lands on layer one ======================== */

  stage.clearFocus();
  await fadeOut([slotsG, ...tiles.map(t => t.g)]);

  // tol goes unused: this step waits for an exact zero on both axes, which the start
  // offset can always reach because it is a whole number of nudges away
  const align = makeMaskAlign(svg, { cx: ALIGN.cx, cy: ALIGN.cy, tol: 0.5 });
  const baseG = align.g.querySelector('.mask-base');
  const moveG = align.g.querySelector('.mask-move');
  const baseVias = [...baseG.querySelectorAll('.via-base')];
  /* the moving mask ships blue, which in this act means a good die or a live signal.
     It is neither, so paint it amber while it is in flight (DESIGN.md §1a, amber 2) and
     green once it lands. Inline styles beat the .locked CSS rule, so both states are set
     here rather than left to the stylesheet. */
  const paintMove = colour => moveG.querySelectorAll('.via-move, .mask-frame.move')
    .forEach(n => { n.style.stroke = colour; });
  paintMove('var(--amber)');

  /* the start offset is seeded from a constant, so it is identical live and on replay and
     there is nothing to record. Layer two stays hidden until the card that introduces it,
     otherwise it sits perfectly on layer one and then jumps away for no visible reason. */
  const rng = mulberry32(MASK_SEED);
  const start = {
    x: (Math.round(rng() * 20) - 10) * NUDGE,
    y: (Math.round(rng() * 20) - 10) * NUDGE,
  };
  align.set(start.x, start.y);
  moveG.style.display = 'none';

  align.g.style.display = 'none';
  await fadeIn([align.g], 320);

  guide.say(`Now look down from above at a later layer, printed by the same five steps. This
    one sits on top of the transistors.`);
  stage.focus(baseG, { label: 'a printed layer', at: 'left' });
  await guide.next();

  guide.say(`The five rings are <b>vias</b>: holes left open in this layer so that the metal
    of the wiring layer printed above it can reach down through them and make contact.`);
  stage.focus(baseVias, { label: 'via', at: 'top' });
  await guide.next();

  /* ---------- the same layers from the side, built up one at a time ----------
     Ripu, 2026-10-18: a side view gives the idea of layer-by-layer printing. The top view
     fades out, the stack builds bottom to top, then the top view returns for the task. */
  stage.clearFocus();
  await fadeOut([align.g], 260);
  const SV = { x: 170, w: 380, si: 330, siH: 58 };          // silicon top edge and depth
  const stackG = svgEl('g');
  svg.appendChild(stackG);
  const layer = html => { const g = svgEl('g'); g.innerHTML = html; stackG.appendChild(g); g.style.display = 'none'; return g; };
  const T1 = [[200, 240], [280, 320]], T2 = [[400, 440], [480, 520]];   // source, drain
  const viaX = [220, 300, 420, 500];
  const sideCap = layer(`<text x="${SV.x + SV.w / 2}" y="${SV.si + SV.siH + 26}" class="lbl-faint">THE SAME LAYERS, CUT THROUGH AND SEEN FROM THE SIDE</text>`);
  const sil = layer(`
    <rect x="${SV.x}" y="${SV.si}" width="${SV.w}" height="${SV.siH}" rx="3" class="p-region"/>
    ${[...T1, ...T2].map(([x0, x1]) => `<rect x="${x0}" y="${SV.si}" width="${x1 - x0}" height="16" rx="2" class="n-region"/>`).join('')}
    ${[250, 450].map(x => `<rect x="${x}" y="${SV.si - 16}" width="20" height="10" rx="1.5" class="gate-metal"/>
      <rect x="${x}" y="${SV.si - 6}" width="20" height="6" class="oxide"/>`).join('')}
    <text x="${SV.x + 34}" y="${SV.si + 44}" class="lbl" font-size="9">SILICON</text>`);
  const G1 = { top: SV.si - 50, bot: SV.si };
  const glass1 = layer(`
    <rect x="${SV.x}" y="${G1.top}" width="${SV.w}" height="${G1.bot - G1.top}" fill="rgba(29,33,23,.06)" stroke="var(--hairline-strong)" stroke-width="1"/>
    ${viaX.map(x => `<rect x="${x - 6}" y="${G1.top}" width="12" height="${G1.bot - G1.top}" fill="var(--paper-high)" stroke="var(--ink-faint)" stroke-width="1"/>`).join('')}
    <text x="${SV.x + 26}" y="${G1.top + 30}" class="lbl" font-size="9">GLASS</text>`);
  const M1 = { top: G1.top - 14 };
  const metal1 = layer(`
    ${viaX.map(x => `<rect x="${x - 6}" y="${G1.top}" width="12" height="${G1.bot - G1.top}" fill="rgba(168,116,31,.55)" stroke="var(--amber)" stroke-width="1"/>`).join('')}
    <rect x="${viaX[0] - 14}" y="${M1.top}" width="28" height="14" rx="2" fill="rgba(168,116,31,.55)" stroke="var(--amber)" stroke-width="1"/>
    <rect x="${viaX[1] - 14}" y="${M1.top}" width="${viaX[2] - viaX[1] + 28}" height="14" rx="2" fill="rgba(168,116,31,.55)" stroke="var(--amber)" stroke-width="1"/>
    <rect x="${viaX[3] - 14}" y="${M1.top}" width="28" height="14" rx="2" fill="rgba(168,116,31,.55)" stroke="var(--amber)" stroke-width="1"/>
    <text x="${SV.x + SV.w - 8}" y="${M1.top + 11}" class="lbl" font-size="9" text-anchor="end">WIRING LAYER 1</text>`);
  const G2 = { top: M1.top - 44, bot: M1.top };
  const stack2 = layer(`
    <rect x="${SV.x}" y="${G2.top}" width="${SV.w}" height="${G2.bot - G2.top}" fill="rgba(29,33,23,.06)" stroke="var(--hairline-strong)" stroke-width="1"/>
    <rect x="${360 - 6}" y="${G2.top}" width="12" height="${G2.bot - G2.top}" fill="rgba(168,116,31,.55)" stroke="var(--amber)" stroke-width="1"/>
    <rect x="${SV.x + 30}" y="${G2.top - 14}" width="${SV.w - 60}" height="14" rx="2" fill="rgba(168,116,31,.55)" stroke="var(--amber)" stroke-width="1"/>
    <text x="${SV.x + SV.w - 8}" y="${G2.top - 3}" class="lbl" font-size="9" text-anchor="end">WIRING LAYER 2</text>`);

  /* Course restructure (2026-10-25): four side-view cards became two. The stack still builds
     one layer at a time, but two layers arrive under each card. */
  await fadeIn([sideCap, sil], 320);
  await sleep(240);
  await fadeIn([glass1], 320);
  guide.say(`Here are the same layers, seen from the side. Glass is laid over the transistors
    in the silicon. Then a printing pass etches a via down through it above each source and
    drain.`);
  stage.focus(glass1, { label: 'glass, with vias', at: 'right', ring: false });
  await guide.next();

  stage.clearFocus();
  await fadeIn([metal1], 360);
  await sleep(240);
  await fadeIn([stack2], 360);
  guide.say(`Metal fills the vias, and another printing pass etches it into wires that touch
    the transistors. Then glass, vias and wires repeat, layer on layer. A whole chip takes
    roughly 70 to 90 masks, one for each pass.`);
  stage.focus([metal1, stack2], { label: 'wires, layer on layer', at: 'left', ring: false });
  await guide.next();

  stage.clearFocus();
  await fadeOut([stackG], 260);
  await fadeIn([align.g], 300);

  stage.clearFocus();
  await fadeIn([moveG], 300);

  guide.say(`Layer two's mask is out of place. On a real wafer, an error of a couple of
    nanometres means the metal misses the via, so the transistor never connects.`);
  stage.focus(moveG, { label: 'layer two mask', at: 'right' });
  await guide.next();

  stage.clearFocus();
  const readout = makeChip(controls, '', 'warm');
  const nudgeWrap = el('div', { class: 'ctl' });
  controls.appendChild(nudgeWrap);
  const showOffset = () => {
    const o = align.offset;
    readout.set(`OFFSET&nbsp; X <b>${o.x}</b> &nbsp; Y <b>${o.y}</b>`);
    if (o.x === 0 && o.y === 0)
      readout.el.querySelectorAll('b').forEach(b => { b.style.color = 'var(--green)'; });
  };
  showOffset();

  /* Course restructure (2026-10-25): the offset card is merged into the task card below. */

  const nudgeBtn = (label, name, dx, dy) => {
    const b = el('button', { class: 'btn micro', 'data-label': `nudge-${name}` }, label);
    b.addEventListener('click', () => { align.nudge(dx, dy); showOffset(); });
    nudgeWrap.appendChild(b);
    return b;
  };
  nudgeBtn('▲ up', 'up', 0, -NUDGE);
  nudgeBtn('▼ down', 'down', 0, NUDGE);
  nudgeBtn('◀ left', 'left', -NUDGE, 0);
  nudgeBtn('▶ right', 'right', NUDGE, 0);

  guide.say(`The <b>offset</b> is how far the mask sits from where it should be, X across and Y
    down, shown under the stage. <b>Your goal is to bring both offsets to 0.</b> Each button
    press moves the mask three units.`);

  await flow.ask(async replay => {
    if (replay !== undefined){
      align.set(0, 0); showOffset();
      paintMove('var(--green)'); align.lock();
      nudgeWrap.querySelectorAll('button').forEach(b => { b.disabled = true; });
      return replay;
    }
    await waitFor(() => align.offset.x === 0 && align.offset.y === 0, { hold: 400 });
    paintMove('var(--green)');
    align.lock();
    nudgeWrap.querySelectorAll('button').forEach(b => { b.disabled = true; });
    SFX.success();
    return true;
  });

  guide.say(`Both offsets are zero. Each via in the new mask sits on the one printed below
    it, so the metal that goes in next will touch.`);
  stage.focus(moveG, { label: 'layer two, landed', at: 'right' });
  await guide.next();

  stage.clearFocus();
  // Course restructure (2026-10-25): ASML named (the numbers box gives the same fact).
  guide.aha(`The newest machines do this with extreme ultraviolet light, <b>13.5 nanometres</b>
    long. Only one company, ASML in the Netherlands, makes these machines. At that wavelength
    the mask is a mirror rather than a clear plate, but it works the same way. One flash can
    print <b>tens of billions</b> of features.`,
    `You never place a transistor. You print the whole layer, then do it again.`);
  await guide.next();

  /* Course restructure (2026-10-25): the process node and Moore's law, moved here from the
     107-word node card in step 5 (its old card 9). Facts kept from that card: the name began
     as the gate length, and no part of a "3 nm" chip is 3 nm long. Plain light-bulb cards,
     on a chart of real chips: transistor count against year, each tenfold step one row,
     each chip tagged with the process node it was made on. */
  stage.clearFocus();
  const stage2 = newStage('11', 'Transistor counts of real chips from 1971 to 2023, with the process node each was made on');
  const svg2 = stage2.svg;
  const moore = svgEl('g');
  svg2.appendChild(moore);
  {
    const X0 = 96, X1 = 664, Y0 = 400, Y1 = 92;              // plot box
    const yr = y => X0 + (y - 1970) / (2025 - 1970) * (X1 - X0);
    const lg = n => Y0 - (Math.log10(n) - 3) / 8 * (Y0 - Y1);  // 1,000 to 100 billion
    const CHIPS = [
      { y: 1971, n: 2300,  name: 'INTEL 4004',   node: '10 µm' },
      { y: 1978, n: 29000, name: 'INTEL 8086',   node: '3 µm' },
      { y: 1989, n: 1.2e6, name: 'INTEL 486',    node: '1 µm' },
      { y: 2000, n: 4.2e7, name: 'PENTIUM 4',    node: '180 nm' },
      { y: 2013, n: 1e9,   name: 'APPLE A7',     node: '28 nm' },
      { y: 2022, n: 8e10,  name: 'NVIDIA H100',  node: '4 nm CLASS', k: 'h100' },
      { y: 2023, n: 1.9e10, name: 'APPLE A17 PRO', node: '3 nm', k: 'a17' },
    ];
    let grid = '';
    ['1 THOUSAND', '', '', '1 MILLION', '', '', '1 BILLION', '', '100 BILLION'].forEach((t, i) => {
      const y = lg(10 ** (3 + i));
      grid += `<line x1="${X0}" y1="${y}" x2="${X1}" y2="${y}" stroke="var(--hairline)" stroke-width="1"/>`;
      if (t) grid += `<text x="${X0 - 8}" y="${y + 3}" class="lbl-faint" font-size="7.5" text-anchor="end">${t}</text>`;
    });
    [1970, 1980, 1990, 2000, 2010, 2020].forEach(y => {
      grid += `<text x="${yr(y)}" y="${Y0 + 18}" class="lbl-faint" font-size="7.5">${y}</text>`;
    });
    const trend = `<line x1="${yr(1971)}" y1="${lg(2300)}" x2="${yr(2023)}" y2="${lg(2300 * 2 ** 26)}" stroke="var(--ink-faint)" stroke-width="1.2" stroke-dasharray="5 5"/>`;
    const dots = CHIPS.map(c => `<g data-chip="${c.k || ''}"><circle cx="${yr(c.y)}" cy="${lg(c.n)}" r="5" fill="var(--ink)"/>
      <text x="${yr(c.y) - 9}" y="${lg(c.n) - 8}" class="lbl" font-size="7.5" text-anchor="end" style="fill:var(--ink)">${c.name}</text>
      <text class="node" x="${yr(c.y) - 9}" y="${lg(c.n) + 4}" class="lbl-faint" font-size="7.5" text-anchor="end" style="fill:var(--ink-soft);font-family:var(--font-mono);letter-spacing:.1em">${c.node}</text></g>`).join('');
    moore.innerHTML = `<text x="380" y="70" class="lbl" style="fill:var(--ink)">TRANSISTORS ON ONE CHIP</text>
      ${grid}<g class="trend">${trend}<text x="${yr(1993) + 14}" y="${lg(2300 * 2 ** 11) + 26}" class="lbl-faint" font-size="7.5" text-anchor="start">DOUBLING ABOUT EVERY TWO YEARS</text></g>${dots}`;
  }
  moore.style.opacity = '0';
  await Anim.tween(420, p => { moore.style.opacity = p.toFixed(2); });

  guide.say(`Shorter light prints smaller shapes, so more transistors fit in the same area.
    Each new generation of chip-making is called a <b>process node</b>, and it gets a name such
    as 5 nm or 3 nm.`);
  stage2.focus([...moore.querySelectorAll('[data-chip]')], { label: 'each chip, with its node', at: 'bottom', ring: false });
  await guide.next();

  stage2.clearFocus();
  guide.say(`This is what people mean when they say a chip is made on a 3 nm process. The name
    started as the gate's length, but today no part of a 3 nm chip is 3 nm long.`);
  stage2.focus(moore.querySelector('[data-chip="a17"]'), { label: 'a 3 nm chip', at: 'left' });
  await guide.next();

  stage2.clearFocus();
  guide.say(`Each node has fitted roughly twice as many transistors in the same area, about
    every two years since the 1970s. This is <b>Moore's law</b>. When you read that it is
    slowing, it means each node takes longer and costs more.`);
  stage2.focus([moore.querySelector('.trend'), ...moore.querySelectorAll('[data-chip]')], { label: "moore's law", at: 'bottom', ring: false });
  await guide.next();

  /* ================= In the Lab (DESIGN.md §6d rule 8) =================
     A university lithography room: the same loop on lab-sized tools. Spin coater and
     hotplate (coat), mask aligner (align and expose, tied to the via task above), developer
     dish (develop). Etch and dope are named as other machines in the same cleanroom. */
  stage2.clearFocus();
  const lab = slideInPanel(svg2, lithoLabHTML(), { lab: true });
  lab.focus('room');
  await lab.show();
  guide.lab(`This is the lithography room of a university cleanroom, where students run the loop
    you just put in order. It is lit yellow, because resist reacts to blue and ultraviolet
    light but not to yellow.`, { intro: true });
  await guide.next();

  lab.focus('spin');
  guide.lab(`Coat happens on a <b>spin coater</b>. A few drops of resist go on the wafer, which
    spins at about 4,000 turns a minute and spreads them into a film about 1 µm thick. A
    hotplate then dries the film.`);
  await guide.next();

  lab.focus('aligner');
  guide.lab(`Expose happens on a <b>mask aligner</b>, the lab version of the lithography machine.
    Under its microscope you line up the mask's marks with the last layer's, as you did with
    the vias. Then its lamp shines ultraviolet light through the mask.`);
  await guide.next();

  lab.focus('develop');
  guide.lab(`Develop is a dish of alkaline developer. In under a minute the exposed resist
    dissolves, and the pattern appears. Etching and doping are done by other machines in the
    same cleanroom, and then the loop starts again.`);
  await guide.next();
  await lab.hide();
}
