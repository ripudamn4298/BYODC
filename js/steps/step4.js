// STEP 4 — Build CMOS (inverter + power meter test).
// Physics per DESIGN.md §4.9: PMOS top / NMOS bottom, inverter logic unchanged,
// power blip only on flip (nothing leaks while holding a state).
// Current chevrons: charge = power→output, discharge = output→ground.
import { svgEl, sleep, waitFor, RM } from '../engine/util.js';
import { SFX } from '../engine/sfx.js';
import { guide } from '../engine/guide.js';
import { flow } from '../engine/flow.js';
import { newStage } from '../engine/stage.js';
import { CurrentFlow } from '../engine/pathflow.js';
import { makeLamp, makeSeg, makeChip, makeMeter, makePlacer } from '../engine/components.js';

export async function step4(){
  const { svg, controls } = newStage('04', 'CMOS inverter build');
  guide.title('STEP 4 / 4 · NANOVOLT LOGIC', 'Build <em>CMOS</em> — the switch that runs the world');

  guide.say(`Meet the twins. <b>NMOS</b> is your switch from last step — it opens when its gate is <em>HIGH</em>. <b>PMOS</b> is its mirror image: it opens when its gate is <em>LOW</em>. Feed one input wire to both gates at once, and exactly <b>one twin is always open, one always shut</b>.`);
  await guide.next();

  /* ---------- rails + skeleton ---------- */
  const sk = svgEl('g');
  sk.innerHTML = `
    <line x1="220" y1="70" x2="520" y2="70" class="wire"/>
    <text x="220" y="56" class="rail-t">POWER ▲</text>
    <line x1="220" y1="410" x2="520" y2="410" class="wire"/>
    ${[0, 1, 2, 3, 4, 5].map(i => `<line x1="${240 + i * 48}" y1="410" x2="${228 + i * 48}" y2="424" class="wire"/>`).join('')}
    <text x="220" y="444" class="rail-t">GROUND ▼</text>
    <path d="M360 70 V100" class="wire"/>
    <path d="M360 180 V300" class="wire"/>
    <path d="M360 380 V410" class="wire"/>
    <circle cx="360" cy="240" r="5" class="node-dot"/>
    <path d="M138 240 H230 M230 140 V340 M230 140 H310 M230 340 H310" class="wire"/>
    <rect x="84" y="221" width="54" height="38" rx="9" class="batt-body"/>
    <text x="111" y="245" class="batt-t" font-size="12">IN</text>`;
  svg.appendChild(sk);
  const outWire = svgEl('path', { d: 'M360 240 H580', class: 'wire' });
  svg.appendChild(outWire);
  const lamp = makeLamp(svg, 600, 240, { label: 'OUT' });

  /* ---------- slots ---------- */
  const SLOTS = [
    { x: 310, y: 100, w: 100, h: 80, correct: 'PMOS' },
    { x: 310, y: 300, w: 100, h: 80, correct: 'NMOS' },
  ];
  const slots = SLOTS.map(s => {
    const rect = svgEl('rect', { x: s.x, y: s.y, width: s.w, height: s.h, rx: 12, class: 'slot' });
    const q = svgEl('text', { x: s.x + s.w / 2, y: s.y + s.h / 2 + 9, class: 'slot-q' }); q.textContent = '?';
    svg.append(rect, q);
    return { ...s, rect, q, value: null, tile: null };
  });

  /* ---------- tray tiles: ink-on-paper, semantic color accents only ---------- */
  function mosTile(kind){
    const w = 164, h = 60, p = kind === 'PMOS';
    const col = p ? 'var(--red)' : 'var(--blue)';
    const g = svgEl('g', { class: 'tile', 'data-part': kind.toLowerCase(), 'aria-label': kind + ' switch' });
    g.innerHTML = `
      <rect width="${w}" height="${h}" rx="11" class="tile-bg" fill="var(--paper-high)"/>
      <rect x="12" y="14" width="8" height="32" rx="2" class="gate-metal"/>
      <path d="M30 30 H50 M58 30 H78" stroke="${col}" stroke-width="3" stroke-linecap="round" fill="none"/>
      <text x="96" y="27" class="tile-cap" text-anchor="start" font-size="12" fill="${col}" font-family="var(--font-display)">${kind}</text>
      <text x="96" y="44" class="tile-cap" text-anchor="start">opens when IN = ${p ? '0' : '1'}</text>`;
    svg.appendChild(g);
    return { g, value: kind, w, h, home: null, tx: 0, ty: 0, slot: null };
  }
  const tiles = [mosTile('PMOS'), mosTile('NMOS')];
  tiles[0].home = { x: 528, y: 312 }; tiles[1].home = { x: 528, y: 392 };

  guide.say(`Build the classic first cell of every chip — the <b>inverter</b>. Power rail on top, ground below, output tapped from the middle. <em>Place the twins.</em>`);

  const placer = makePlacer({
    svg, tiles, slots,
    validate: v => v[0] === 'PMOS' && v[1] === 'NMOS',
    onWrong: () => guide.note(`Think it through: when IN = 0, the output must connect <b>up to POWER</b>. Which twin opens when IN = 0? Put that one on top.`),
  });

  await flow.ask(async replay => {
    if (replay !== undefined){ placer.autoPlace(); return replay; }
    await placer.done;
    return true;
  });

  /* ---------- replace tiles with in-circuit devices ---------- */
  await sleep(450);
  tiles.forEach(t => t.g.style.opacity = '0');
  slots.forEach(s => { s.rect.style.opacity = '0'; s.q.style.opacity = '0'; });
  function placedMOS(y0, kind){
    const p = kind === 'PMOS', col = p ? 'var(--red)' : 'var(--blue)';
    const g = svgEl('g', { class: 'pop-in' });
    g.innerHTML = `
      <rect x="318" y="${y0}" width="84" height="72" rx="11" class="tile-bg" fill="var(--paper-high)"/>
      <rect x="304" y="${y0 + 22}" width="9" height="28" rx="2" class="gate-metal"/>
      <path d="M360 ${y0} V${y0 + 22} M360 ${y0 + 50} V${y0 + 72}" stroke="${col}" stroke-width="3" stroke-linecap="round" fill="none"/>
      <rect x="354" y="${y0 + 22}" width="12" height="28" rx="4" class="bridge ${p ? 'p' : ''}"/>
      <text x="412" y="${y0 + 30}" class="tile-cap" text-anchor="start" font-size="11" fill="${col}">${kind}</text>
      <text x="412" y="${y0 + 46}" class="tile-cap" text-anchor="start">open @ IN=${p ? '0' : '1'}</text>`;
    svg.appendChild(g);
    return { g, bridge: g.querySelector('.bridge') };
  }
  const pmos = placedMOS(104, 'PMOS');
  const nmos = placedMOS(304, 'NMOS');
  if (!flow.instant) SFX.success();

  guide.say(`Wired. The input on the left feeds <b>both gates at once</b>; the output taps the midpoint between the twins. Controls are live below the stage.`);
  await guide.next();

  /* ---------- controls: IN toggle + OUT chip + power meter ---------- */
  const chipOut = makeChip(controls, 'OUT: <b>—</b>');
  let IN = null, OUT = null, meterAnim = null;
  const seg = makeSeg(controls, [
    { id: 'in-0', label: 'IN = 0', value: 0 },
    { id: 'in-1', label: 'IN = 1', value: 1 },
  ], v => setIN(v));
  const meter = makeMeter(controls);

  const chargeP = svgEl('path', { d: 'M360 70 V240 H580', fill: 'none', stroke: 'none' });
  const dischgP = svgEl('path', { d: 'M580 240 H360 V410', fill: 'none', stroke: 'none' });
  svg.append(chargeP, dischgP);
  const flowLayer = svgEl('g'); svg.appendChild(flowLayer);
  const chargeF = new CurrentFlow(chargeP, { n: 8, layer: flowLayer });
  const dischgF = new CurrentFlow(dischgP, { n: 8, layer: flowLayer });

  function blipMeter(){
    if (meterAnim) cancelAnimationFrame(meterAnim);
    meter.out.textContent = 'switching!';
    if (RM){ meter.fill.style.width = '2%'; meter.out.textContent = '≈ 0 (holding)'; return; }
    let w = 72; meter.fill.style.width = w + '%';
    const t0 = performance.now();
    const dec = t => {
      w = 72 * Math.exp(-(t - t0) / 260);
      meter.fill.style.width = Math.max(2, w) + '%';
      if (w > 2.2) meterAnim = requestAnimationFrame(dec);
      else { meter.fill.style.width = '2%'; meter.out.textContent = '≈ 0 (holding)'; }
    };
    meterAnim = requestAnimationFrame(dec);
  }
  function setIN(v, silent){
    if (IN === v) return;
    IN = v; OUT = v === 0 ? 1 : 0;
    seg.set(v);
    pmos.bridge.style.opacity = v === 0 ? '1' : '0';
    nmos.bridge.style.opacity = v === 1 ? '1' : '0';
    lamp.set(OUT);
    chipOut.set(`OUT: <b>${OUT}</b>`);
    if (!silent){
      SFX.blip(); blipMeter();
      const f = OUT === 1 ? chargeF : dischgF;
      f.setSpeed(200); setTimeout(() => f.setSpeed(0), RM ? 60 : 500);
    }
  }
  setIN(1, true); meter.fill.style.width = '2%';

  guide.say(`<b>Your test, chipmaker:</b> flip the input and watch the output — and the meter.`);

  const t1 = guide.task('Set the input so OUT = 1');
  await flow.ask(async replay => {
    if (replay !== undefined){ setIN(replay, true); return replay; }
    const cancel = flow.hintAfter(11000, `The inverter always disagrees with its input. You want OUT = 1 — so feed it the opposite.`);
    await waitFor(() => OUT === 1, { hold: 400 });
    cancel();
    return IN;
  });
  t1.done();

  const t2 = guide.task('Now make OUT = 0');
  await flow.ask(async replay => {
    if (replay !== undefined){ setIN(replay, true); return replay; }
    const cancel = flow.hintAfter(11000, `The inverter always disagrees with its input. Flip it the other way.`);
    await waitFor(() => OUT === 0, { hold: 400 });
    cancel();
    return IN;
  });
  t2.done();

  guide.aha(`Now flip it a few times and <b>watch the power meter</b>. Holding a state, it sits at ≈ zero — whichever twin is switched OFF breaks the path from power to ground, so nothing leaks through. Energy is spent only in the instant of the flip. <b>That's the whole secret of CMOS</b> — and it's why a chip can hold <em>billions</em> of these without melting.`);
  await guide.next();
}
