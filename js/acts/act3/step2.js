// ACT 3 · STEP 2 — "Print with light" (photolithography).
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
import { makePlacer, makeChip } from '../../engine/components.js';
import { makeMaskAlign, processTile, mulberry32 } from '../../engine/fab.js';

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
  guide.title('STEP 2 / 5 · NANOVOLT FAB 3', 'Print <em>with light</em>');
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
  const waferT = put('text', { x: 360, y: WAFER_Y + 33, class: 'lbl-faint' });
  waferT.textContent = 'SILICON';

  guide.say(`You cannot place a billion transistors by hand. A fab does not place them. It
    photographs them onto a wafer like this one.`);
  stage.focus([wafer, waferT], { label: 'the wafer you sliced', at: 'bottom' });
  await guide.next();

  stage.clearFocus();
  const resist = put('rect', { x: PLATE.x, y: RESIST_Y, width: PLATE.w, height: RESIST_H },
    { fill: 'rgba(29,33,23,.07)', stroke: 'var(--hairline-strong)', strokeWidth: '1' });
  resist.style.display = 'none';
  await fadeIn([resist], 320);

  guide.say(`First the wafer gets a coat of <b>photoresist</b>: a thin film that changes
    wherever light lands on it.`);
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

  guide.say(`Above it sits the <b>mask</b>, a clear plate carrying this layer's pattern in
    metal. Light goes through the gaps and stops at the metal.`);
  stage.focus(maskG, { label: 'mask', at: 'top' });
  await guide.next();

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

  guide.say(`The pattern now sits in the film: the resist under each gap has changed. That
    flash is the <b>expose</b> step.`);
  stage.focus(exposed, { label: 'exposed resist', at: 'bottom' });
  await guide.next();

  /* ================= SCENE B — the five steps, in the only order that works ========= */

  stage.clearFocus();
  await fadeOut([...sceneA]);

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
  tiles.forEach((t, i) => {
    t.home = { x: ROW_X + i * (SLOT.w + SLOT.gap), y: TRAY_Y };
    t.tx = t.home.x; t.ty = t.home.y;
    t.g.style.transform = `translate(${t.home.x}px,${t.home.y}px)`;
    t.g.style.display = 'none';
  });
  const tileOf = kind => tiles.find(t => t.value === kind);

  await fadeIn([slotsG, ...tiles.map(t => t.g)], 340);

  guide.say(`<b>Develop</b> washes the changed resist away. Bare silicon is left wherever
    the light got through.`);
  stage.focus(tileOf('DEVELOP').g, { label: 'wash it off', at: 'top' });
  await guide.next();

  guide.say(`<b>Etch</b> cuts down into the silicon the resist no longer covers. The resist
    still standing protects everything under it.`);
  stage.focus(tileOf('ETCH').g, { label: 'cut the pattern in', at: 'top' });
  await guide.next();

  guide.say(`<b>Dope</b> fires in the phosphorus or boron atoms from Act 1. They only reach
    the silicon through the openings.`);
  stage.focus(tileOf('DOPE').g, { label: 'fire atoms in', at: 'top' });
  await guide.next();

  guide.say(`Five steps build every layer, and they only work in one order.
    <b>Your goal: find that order.</b>`);
  stage.focus(slotsG, { label: 'the order they run', at: 'top' });
  await guide.next();

  /* no focus for the interaction: stage.focus re-parents what it raises, which the
     placer's pointer handling has to survive */
  stage.clearFocus();
  guide.say(`Drag each tile into a slot, or tap a tile and then a slot.
    <b>Your goal: slot 1 to slot 5, in the order they run.</b>`);

  let wrongs = 0;
  const placer = makePlacer({
    svg, tiles, slots,
    validate: v => v.every((val, i) => val === ORDER[i]),
    onWrong: () => {
      wrongs++;
      guide.say(wrongs === 1
        ? `Not that order. All five tiles are back on the bench. <b>Your goal stands: the
           five steps, in the order they run.</b> Ask what has to be on the wafer before
           the light arrives.`
        : `Still not it. <b>Your goal: the five steps, in the order they run.</b> The film
           goes on first, then the flash, then the wash. Cutting and doping come last,
           because they need the openings the wash leaves behind.`);
    },
  });

  await flow.ask(async replay => {
    if (replay !== undefined){ placer.autoPlace(); return replay; }
    await placer.done;
    return true;
  });

  await sleep(560);           // let the last tile finish its slide before measuring it
  guide.say(`Coat, expose, develop, etch, dope. The resist then strips off and the loop
    runs again for the next layer, dozens of times over.`);
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

  guide.say(`Now look down on the wafer instead of through it. This is the layer those
    five steps just printed.`);
  stage.focus(baseG, { label: 'layer one, printed', at: 'left' });
  await guide.next();

  guide.say(`The five rings are <b>vias</b>: holes left open in this layer so the next
    layer's metal can drop through and touch it.`);
  stage.focus(baseVias, { label: 'via', at: 'top' });
  await guide.next();

  stage.clearFocus();
  await fadeIn([moveG], 300);

  guide.say(`Layer two's mask is out of place. A couple of nanometres of error on a real
    wafer and the metal misses the via, so the transistor never connects.`);
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

  guide.say(`<b>Your goal: bring both offsets to 0.</b> The four buttons under the stage
    move the mask three units a press, and the chip beside them reads the gap.`);

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

  guide.say(`Zero on both. Each via in the new mask sits on the one printed below it, so
    the metal that goes in next will touch.`);
  stage.focus(moveG, { label: 'layer two, landed', at: 'right' });
  await guide.next();

  stage.clearFocus();
  guide.aha(`The light doing this has a wavelength of <b>13.5 nanometres</b>. It comes off
    droplets of tin, vaporised by a laser <b>50,000 times a second</b>, and one flash
    prints about <b>ten billion</b> features.`,
    `You never place a transistor. You print the whole layer, then do it again.`);
  await guide.next();
}
