// ACT 3 · STEP 2 — Print with light (photolithography).
// Beat: you can't place a billion transistors by hand — you PHOTOGRAPH them in.
// Interaction 1: order the process (coat -> expose -> develop -> etch -> dope).
// Interaction 2: align the second mask onto the first printed layer (MaskAlign).
import { svgEl, el, waitFor, rand } from '../../engine/util.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makePlacer, cornerTicks } from '../../engine/components.js';
import { makeMaskAlign, processTile } from '../../engine/fab.js';

// fixed scramble (not "in order") — no live randomness needed for a tray shuffle,
// so this stays deterministic across live play and replay without recording anything.
const TRAY_ORDER = ['DEVELOP', 'COAT', 'DOPE', 'EXPOSE', 'ETCH'];

export async function step2(){
  guide.title('STEP 2 / 4 · NANOVOLT FAB 3', 'Print <em>with light</em>');

  guide.say(`You can't place a billion transistors by hand — even a lifetime of tweezers wouldn't finish one wafer. So a fab doesn't place them. It <b>photographs</b> them into place, all at once, layer after layer.`);
  await guide.next();

  /* ---------- interaction 1: order the process ---------- */
  const { svg, controls } = newStage('10', 'Photolithography process order');
  cornerTicks(svg, 40, 40, 640, 200, 8);

  guide.say(`That printing process is called <b>photolithography</b> — literally "drawing with light." Every layer of the chip is built by the same five steps, and they only work in one order. <b>Your job: figure out that order.</b> Here are the five, scrambled in the tray below — each with what it does: <b>Coat</b> (spread a light-sensitive film over the wafer), <b>Expose</b> (shine light through a patterned mask onto the film), <b>Develop</b> (wash away the film the light changed), <b>Etch</b> (cut into the bare silicon that's now uncovered), <b>Dope</b> (implant atoms through the openings — the doping you did in Act 1). <em>Drag them left-to-right into the order they actually run</em> — think about what has to happen before what.`);

  const KINDS = [
    { kind: 'COAT', cap: 'photoresist' },
    { kind: 'EXPOSE', cap: 'mask + UV' },
    { kind: 'DEVELOP', cap: 'wash' },
    { kind: 'ETCH', cap: 'cut' },
    { kind: 'DOPE', cap: 'implant' },
  ];
  const order = ['COAT', 'EXPOSE', 'DEVELOP', 'ETCH', 'DOPE'];

  const slotW = 96, slotH = 60, gap = 30;
  const totalW = KINDS.length * slotW + (KINDS.length - 1) * gap;
  const startX = 360 - totalW / 2;
  const slotY = 96;
  const slots = KINDS.map((_, i) => {
    const x = startX + i * (slotW + gap);
    const rect = svgEl('rect', { x, y: slotY, width: slotW, height: slotH, class: 'slot' });
    svg.appendChild(rect);
    const q = svgEl('text', { x: x + slotW / 2, y: slotY + slotH / 2 + 9, class: 'slot-q' });
    q.textContent = String(i + 1);
    svg.appendChild(q);
    const capLbl = svgEl('text', { x: x + slotW / 2, y: slotY + slotH + 22, class: 'lbl-faint' });
    svg.appendChild(capLbl);
    return { x, y: slotY, w: slotW, h: slotH, rect, q, value: null, tile: null, correct: order[i], capLbl };
  });

  // fixed scramble so the tray isn't trivially left-to-right (see TRAY_ORDER above)
  const shuffled = TRAY_ORDER.map(kind => KINDS.find(k => k.kind === kind));
  const tiles = shuffled.map(k => processTile(svg, k.kind, k.cap));
  const trayY = 300;
  const trayX = startX;
  tiles.forEach((t, i) => t.home = { x: trayX + i * (slotW + gap), y: trayY });

  const placer = makePlacer({
    svg, tiles, slots,
    validate: v => v.every((val, i) => val === order[i]),
    onWrong: () => guide.note(`Sunscreen goes on before the sun — <b>coat</b> comes first, then <b>expose</b>. Work through the loop in order: coat → expose → develop → etch → dope.`),
    onPlace: () => {
      slots.forEach(s => { if (s.value) s.capLbl.textContent = KINDS.find(k => k.kind === s.value)?.cap.toUpperCase() || ''; });
    },
  });

  await flow.ask(async replay => {
    if (replay !== undefined){
      placer.autoPlace();
      slots.forEach(s => { s.capLbl.textContent = KINDS.find(k => k.kind === s.correct)?.cap.toUpperCase() || ''; });
      return replay;
    }
    const cancel = flow.hintAfter(14000,
      `The order is: <b>COAT</b> (photoresist) → <b>EXPOSE</b> (mask + UV) → <b>DEVELOP</b> (wash away what light hit) → <b>ETCH</b> (cut the pattern in) → <b>DOPE</b> (implant). Drag the tiles left to right in that order.`);
    await placer.done;
    cancel();
    return true;
  });

  guide.say(`<b>Coat</b> the wafer in light-sensitive resist. <b>Expose</b> it through a mask patterned with the layer's design — UV hardens or softens the resist wherever light lands. <b>Develop</b> washes away the part the light changed. <b>Etch</b> cuts the newly bare silicon. <b>Dope</b> implants ions through the openings. Then the resist strips off and the whole loop repeats for the <em>next</em> layer, dozens of times, each one thinner than the last.`);
  await guide.next();

  /* ---------- interaction 2: align the mask ---------- */
  const { svg: svg2, controls: controls2 } = newStage('10', 'Mask alignment');
  cornerTicks(svg2, 40, 40, 640, 400, 8);

  guide.say(`Layer two has to land <em>exactly</em> on layer one — off by even a few nanometres and the transistor never connects. Nudge the new mask (dashed cobalt) until its five vias sit on the fixed targets (solid ink).`);

  const align = makeMaskAlign(svg2, { cx: 262, cy: 232, tol: 4 });

  const [sx, sy] = await flow.ask(async replay => {
    if (replay !== undefined){ align.set(replay[0], replay[1]); return replay; }
    const x = Math.round(rand(-40, 40)), y = Math.round(rand(-40, 40));
    align.set(x, y);
    return [x, y];
  });

  const nudgeWrap = el('div', { class: 'ctl' });
  controls2.appendChild(nudgeWrap);
  const nudgeBtn = (label, dx, dy) => {
    const b = el('button', { class: 'btn micro', 'data-label': label.toLowerCase().replace(/[^a-z]+/g, '-') }, label);
    b.addEventListener('click', () => align.nudge(dx, dy));
    nudgeWrap.appendChild(b);
    return b;
  };
  nudgeBtn('▲ up', 0, -3);
  nudgeBtn('▼ down', 0, 3);
  nudgeBtn('◀ left', -3, 0);
  nudgeBtn('▶ right', 3, 0);

  guide.say(`The light doing this is <b>13.5 nanometres</b> — EUV, struck from droplets of exploded tin <b>50,000 times a second</b>. One exposure prints <em>every die on the wafer</em>, all at once.`);

  await flow.ask(async replay => {
    if (replay !== undefined){ align.set(0, 0); align.lock(); return replay; }
    const cancel = flow.hintAfter(14000,
      `Watch the offset shrink as you nudge — get both numbers close to zero. Try ▲/▼ first to zero the vertical gap, then ◀/▶ for the horizontal one.`);
    await waitFor(() => align.aligned(), { hold: 500 });
    cancel();
    align.lock();
    SFX.success();
    return true;
  });

  guide.aha(`Locked. The vias light up because contact is exact, layer to layer — and you just placed <b>ten billion features</b> in a single flash of light.`,
    `That's the whole trick of a fab: never place one transistor. Photograph all of them, everywhere, at once.`);
  await guide.next();
}
