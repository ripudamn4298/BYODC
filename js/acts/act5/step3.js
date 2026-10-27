// ACT 5 · STEP 4 — "How much of the power line do the computers actually get?"
// (file step3.js, seed key 5:power). Course restructure (2026-10-25): the steps were
// reordered, so the network step (step4.js) now comes just before this one and this is
// step 4 of 5. The Act 1 inverter opening is cut; the step opens on the hall's 445 racks,
// names each part of the power ladder on its own card, defines the supply line before the
// player is asked to fit anything under it, and shows the cooling choice on the ladder.
// The task is unchanged: 25 MW of IT load under a 30 MW line, which only liquid cooling
// can do.
//
// THE ARITHMETIC. Every megawatt on screen is computed in tenths of a megawatt as
// integers, and the total is the sum of the three rung figures that are actually printed.
// So the ladder always adds up exactly as drawn, for either cooling choice, at every point
// the player can stop, and the pass condition is the same number the readout shows.
//   cooling overhead: 42% of IT load on air, 13% on liquid  (PUE ≈ 1.48 and ≈ 1.18)
//   losses: 4% of everything upstream of the racks (transformers, UPS, distribution)
// At 12 MW of IT load: air = 12.0 + 5.0 + 0.7 = 17.7;  liquid = 12.0 + 1.6 + 0.5 = 14.1.
// At 25 MW: air = 25.0 + 10.5 + 1.4 = 36.9 (over);  liquid = 25.0 + 3.3 + 1.1 = 29.4.
// Air runs out at 20 MW of IT load (29.5), liquid at 25 MW (29.4), so the task has exactly
// one solution and the closing figures are the ones the player is looking at.
//
// Determinism: every ladder move runs on Anim.tween, which collapses to its end state
// while replaying, and the two recorded answers (cooling choice, {cooling, it}) restore
// the same state live or on replay. No Math.random,
// no Date.now, no setTimeout driving a visual.
import { waitFor, svgEl } from '../../engine/util.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makePowerLadder } from '../../engine/dc.js';
import { makeSlider, makeSeg, slideInPanel } from '../../engine/components.js';
import { powerLab } from './lab.js';

/* ---------- the power model, in tenths of a megawatt so nothing rounds twice ---------- */
const LIMIT = 30;                 // the hall's grid line, MW
const CAP = 40;                   // the bar's full-scale, MW (the line sits inside it)
const COOL_RATE = { air: 0.42, liquid: 0.13 };
const LOSS_RATE = 0.04;
const START_IT = 12, TASK_IT = 25;

function budget(it, cooling){
  const itT = Math.round(it * 10);
  const coolT = Math.round(it * COOL_RATE[cooling] * 10);
  const lossT = Math.round((itT + coolT) * LOSS_RATE);
  const totT = itT + coolT + lossT;
  return {
    it: itT / 10, cool: coolT / 10, loss: lossT / 10,
    total: totT / 10, over: totT > LIMIT * 10, head: (LIMIT * 10 - totT) / 10,
  };
}

/* ---------- stage geometry, in the stage's 720×480 user units ---------- */
// Course restructure (2026-10-25): the hall plan replaces the meter and the inverter.
// 445 racks (25,000 kW ÷ 56 kW ≈ 446, which the course rounds to 445) on a 30 × 15 grid.
const HALL = { racks: 445, kw: 56, cols: 30, rows: 15, x: 122, y: 130, dx: 16, dy: 14 };
const LAD = { x: 300, y: 70, w: 120, h: 300 };
const NAME_X = 206, VAL_X = 286;

const lerp = (a, b, p) => a + (b - a) * p;

async function fadeIn(nodes, dur = 320){
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

export async function step3(){
  // Course restructure (2026-10-25): now step 4; the network step comes before it.
  guide.title('STEP 4 / 5', 'How much of the power line <em>do the computers actually get?</em>');
  guide.cards();

  const stage = newStage('24', 'A hall of 445 racks, then a bar splitting a 30 MW line between IT load, cooling and losses');
  const { svg, controls } = stage;

  /* ==================== SCENE A — the hall, as racks ==================== */
  // Course restructure (2026-10-25): the Act 1 inverter, its meter and the flip task are
  // cut (Act 4's last step has just made the billions-of-flips point). The step now opens
  // on the hall from step 1: a top-down plan of 445 racks at 56 kW each, about 25 MW.

  const sceneA = svgEl('g');
  svg.appendChild(sceneA);

  const hallG = svgEl('g');
  let cells = `<rect x="${HALL.x - 14}" y="${HALL.y - 14}" width="${HALL.cols * HALL.dx + 24}" height="${HALL.rows * HALL.dy + 24}" rx="5" class="tile-bg"/>`;
  for (let i = 0; i < HALL.racks; i++){
    const c = i % HALL.cols, r = Math.floor(i / HALL.cols);
    cells += `<rect x="${HALL.x + c * HALL.dx}" y="${HALL.y + r * HALL.dy}" width="${HALL.dx - 4}" height="${HALL.dy - 5}" rx="1" fill="var(--hairline-strong)"/>`;
  }
  hallG.innerHTML = cells;
  const hallT = svgEl('text', { x: 360, y: HALL.y - 26, class: 'lbl-strong' });
  hallT.textContent = `${HALL.racks} RACKS, SEEN FROM ABOVE`;
  const hallSum = svgEl('text', { x: 360, y: HALL.y + HALL.rows * HALL.dy + 36, class: 'lbl' });
  hallSum.textContent = `${HALL.racks} × ${HALL.kw} kW ≈ ${TASK_IT} MW`;
  hallG.append(hallT, hallSum);
  sceneA.appendChild(hallG);

  /* ---- card 1: the hall from step 1 ---- */
  guide.say(`Your hall will hold about ${HALL.racks} racks, each drawing ${HALL.kw} kW all day.
    Together they will draw about ${TASK_IT} MW.`);
  stage.focus(hallG, { label: 'your hall', at: 'top' });
  await guide.next();

  /* ==================== SCENE B — the power ladder ==================== */

  stage.clearFocus();
  controls.innerHTML = '';
  await fadeOut([sceneA]);

  const ladder = makePowerLadder(svg, { x: LAD.x, y: LAD.y, w: LAD.w, h: LAD.h, capMW: CAP });
  /* Named handles, never `g.children`: the engine appends to that group, and reading it
     positionally silently rebinds every name the moment it does. This step draws its own
     NAME + value pair per rung, so the component's own labels stay off (the default). */
  const frameRect = ladder.frame;
  const itRect = ladder.rects.it, coolRect = ladder.rects.cool, lossRect = ladder.rects.loss;
  const limitLine = ladder.limit, limitTxt = ladder.limitLabel, totalTxt = ladder.caption;
  // The engine now puts the total below the bar and tracks the limit label to its line,
  // and .ladder-seg no longer carries a CSS transition, so all three workarounds are gone.
  [limitLine, limitTxt].forEach(n => { n.style.opacity = '0'; });

  const RUNGS = [
    { key: 'it', name: 'IT LOAD' },
    { key: 'cool', name: 'COOLING' },
    { key: 'loss', name: 'LOSSES' },
  ];
  const labG = svgEl('g');
  svg.appendChild(labG);
  const rungLab = {};
  RUNGS.forEach(r => {
    const g = svgEl('g');
    const lead = svgEl('path', { d: '', fill: 'none', stroke: 'var(--hairline-strong)', 'stroke-width': 1 });
    const n = svgEl('text', { x: NAME_X, class: 'lbl' });
    n.style.textAnchor = 'end';
    n.textContent = r.name;
    const v = svgEl('text', { x: VAL_X, class: 'lbl-strong' });
    v.style.textAnchor = 'end';
    g.append(lead, n, v);
    g.style.opacity = '0';
    labG.appendChild(g);
    rungLab[r.key] = { g, n, v, lead };
  });

  const headT = svgEl('text', { x: 360, y: 424, class: 'lbl-strong' });
  headT.style.opacity = '0';
  svg.appendChild(headT);
  const noteT = svgEl('text', { x: 360, y: 452, class: 'lbl' });
  noteT.style.fill = 'var(--ink-faint)';
  svg.appendChild(noteT);

  let shown = { it: 0, cool: 0, loss: 0 };
  let tok = 0;

  function paint(v){
    ladder.set({ it: v.it, cool: v.cool, loss: v.loss }, LIMIT);
    const px = mw => (mw / CAP) * LAD.h;
    const bot = LAD.y + LAD.h;
    const mid = {
      it: bot - px(v.it) / 2,
      cool: bot - px(v.it) - px(v.cool) / 2,
      loss: bot - px(v.it) - px(v.cool) - px(v.loss) / 2,
    };
    // the big rung keeps its own middle; the thin ones stack up above it
    const ys = { it: mid.it };
    ys.cool = Math.min(mid.cool, ys.it - 18);
    ys.loss = Math.max(16, Math.min(mid.loss, ys.cool - 18));
    RUNGS.forEach(r => {
      const L = rungLab[r.key], y = ys[r.key];
      L.v.textContent = `${v[r.key].toFixed(1)} MW`;
      L.n.setAttribute('y', y.toFixed(1));
      L.v.setAttribute('y', y.toFixed(1));
      L.lead.setAttribute('d', `M${VAL_X + 5} ${(y - 3.5).toFixed(1)} H${VAL_X + 9} V${mid[r.key].toFixed(1)} H${LAD.x - 3}`);
      L.g.style.opacity = v[r.key] > 0 ? '1' : '0';
    });
    const total = v.it + v.cool + v.loss;
    const head = LIMIT - total;
    if (head >= -0.049){
      headT.textContent = `${head.toFixed(1)} MW HEADROOM`;
      headT.style.fill = 'var(--ink-soft)';
    } else {
      headT.textContent = `${(-head).toFixed(1)} MW OVER THE LINE`;
      headT.style.fill = 'var(--red)';
    }
  }

  /* every ladder move is watched, and collapses to its end state on replay */
  async function moveTo(target, dur = 460){
    const mine = ++tok, from = { ...shown };
    shown = { ...target };
    await Anim.tween(dur, p => {
      if (mine !== tok) return;
      paint({
        it: lerp(from.it, target.it, p),
        cool: lerp(from.cool, target.cool, p),
        loss: lerp(from.loss, target.loss, p),
      });
    });
    if (mine === tok) paint(target);
  }

  let itLoad = START_IT, cooling = 'air';
  const rungs = () => { const b = budget(itLoad, cooling); return { it: b.it, cool: b.cool, loss: b.loss }; };

  await fadeIn([ladder.g], 360);

  /* ---- card 2: the bar is the hall's whole draw ---- */
  guide.say(`Every watt this hall draws goes into one of three parts. The bar is the whole
    draw, split between them. <b>Your goal is to keep the bar under the line you are
    given.</b>`);
  stage.focus(frameRect, { label: "the hall's draw", at: 'top' });
  await guide.next();

  /* ---- card 3: IT load ---- */
  stage.clearFocus();
  const slider = makeSlider(controls, {
    label: 'IT LOAD (MW)', min: 4, max: 30, step: 1, value: itLoad, fmt: v => `${v} MW`,
  });
  slider.input.disabled = true;
  await moveTo({ it: START_IT, cool: 0, loss: 0 }, 520);

  guide.say(`IT load is the power the computers themselves draw: the servers in the racks,
    the machines that hold the GPUs. It is the only part of the draw that does any computing.`);
  stage.focus([itRect, rungLab.it.g], { label: 'it load', at: 'top' });
  await guide.next();

  /* ---- card 4: cooling ---- */
  stage.clearFocus();
  const air12 = budget(START_IT, 'air');
  await moveTo({ it: air12.it, cool: air12.cool, loss: 0 }, 460);

  guide.say(`All of that power leaves the racks as heat. Cooling is the power you spend
    carrying that heat back out of the building.`);
  stage.focus([coolRect, rungLab.cool.g], { label: 'cooling', at: 'top' });
  await guide.next();

  /* ---- card 5: losses ---- */
  stage.clearFocus();
  await moveTo({ it: air12.it, cool: air12.cool, loss: air12.loss }, 420);

  guide.say(`Losses are the power that warms the transformers and power supplies feeding the
    hall. About 4 percent never reaches a rack.`);
  stage.focus([lossRect, rungLab.loss.g], { label: 'losses', at: 'top' });
  await guide.next();

  /* ---- card 6: the line ---- */
  stage.clearFocus();
  await fadeIn([limitLine, limitTxt, headT], 340);

  guide.say(`One power line feeds the hall from the grid, and the utility rated it at
    ${LIMIT} MW. Nothing you build changes that number. Everything on the bar has to fit
    under it.`);
  stage.focus([limitLine, limitTxt], { label: 'the grid line', at: 'top' });
  await guide.next();

  /* ---- card 7: the line in the news ---- */
  // Course restructure (2026-10-25): a light-bulb card tying the fixed line to the news.
  // Well reported: Microsoft's 2024 deal with Constellation to restart a Three Mile Island
  // reactor, and Amazon's 2024 deal with Talen for power from the Susquehanna nuclear plant.
  guide.say(`When the news says power is the bottleneck, it means this line. A large new
    line can take years to get from the grid, so AI companies now sign deals with power
    plants, nuclear ones included.`);
  stage.focus([limitLine, limitTxt], { label: 'the grid line', at: 'top' });
  await guide.next();

  /* ---- card 8: air cooling ---- */
  stage.clearFocus();
  let segLive = false, onCoolPick = null;
  const seg = makeSeg(controls, [
    { id: 'air', label: 'AIR COOLING', value: 'air' },
    { id: 'liquid', label: 'LIQUID COOLING', value: 'liquid' },
  ], v => {
    if (v === cooling || !segLive) return;
    cooling = v;
    SFX.blip();
    if (onCoolPick) onCoolPick();
    moveTo(rungs(), 380);
  });
  seg.set('air');
  const segBtns = [...seg.el.querySelectorAll('button')];
  const segEnabled = on => { segLive = on; segBtns.forEach(b => { b.disabled = !on; }); };
  segEnabled(false);

  guide.say(`Air cooling blows cold air through the racks. Shifting heat that way takes a
    lot of fan power, which is why the cooling part of the bar is
    ${air12.cool.toFixed(1)} MW.`);
  stage.focus([coolRect, rungLab.cool.g], { label: 'air cooling', at: 'top' });
  await guide.next();

  /* ---- card 9: liquid cooling, and the switch ---- */
  stage.clearFocus();
  segEnabled(true);

  guide.say(`Liquid cooling pumps water through plates sitting on the chips. Water carries
    heat far better than air. Switch to it and watch the cooling part of the bar.`);

  await flow.ask(async replay => {
    if (replay !== undefined){
      cooling = replay;
      seg.set(cooling);
      await moveTo(rungs(), 380);
      return replay;
    }
    await waitFor(() => cooling === 'liquid', { hold: 400 });
    return cooling;
  });

  /* ---- card 10: the two overheads, side by side ---- */
  const liq12 = budget(START_IT, 'liquid');
  guide.say(`Same ${START_IT} MW of IT load. Air spent ${air12.cool.toFixed(1)} MW carrying
    the heat out. Liquid spends ${liq12.cool.toFixed(1)} MW.`);
  stage.focus([coolRect, rungLab.cool.g], { label: 'liquid cooling', at: 'top' });
  await guide.next();

  /* ---- card 11: where the water goes ---- */
  // Course restructure (2026-10-25): the step never shows evaporation, so the water card
  // rides on the liquid rung and names the cooling tower in words.
  guide.say(`The water in those plates goes round a closed loop and is not used up. The water
    use you read about in the news is water evaporated in cooling towers.`);
  stage.focus([coolRect, rungLab.cool.g], { label: 'a closed loop', at: 'right' });
  await guide.next();

  /* ---- card 12: the task ---- */
  // no focus while the player works: the slider and the buttons sit outside the SVG, and a
  // scrim would dim the four figures they have to read
  stage.clearFocus();
  slider.input.disabled = false;
  const task = guide.task(`Run ${TASK_IT} MW of IT load and keep the hall under the ${LIMIT} MW line`);

  slider.on(v => {
    itLoad = v;
    if (onCoolPick) onCoolPick();
    tok++;                     // a drag beats any tween still running
    shown = rungs();
    paint(shown);
  });

  const answer = await flow.ask(async replay => {
    if (replay !== undefined){
      cooling = replay.cooling;
      itLoad = replay.it;
      seg.set(cooling);
      slider.set(itLoad);
      shown = rungs();
      paint(shown);
      return replay;
    }
    let hintId = null;
    const ep = flow._epoch;
    onCoolPick = () => { noteT.textContent = ''; if (hintId) clearTimeout(hintId); hintId = null; };
    hintId = setTimeout(() => {
      if (ep !== flow._epoch) return;
      noteT.textContent = cooling === 'air'
        ? `WITH AIR COOLING, ${TASK_IT} MW WILL NOT FIT UNDER THE LINE`
        : `PUSH THE IT LOAD SLIDER UP TO ${TASK_IT} MW`;
    }, 14000);
    await waitFor(() => {
      const b = budget(itLoad, cooling);
      return b.it >= TASK_IT && !b.over;
    }, { hold: 500 });
    if (hintId) clearTimeout(hintId);
    onCoolPick = null;
    noteT.textContent = '';
    return { cooling, it: itLoad };
  });
  noteT.textContent = '';
  task.done();

  /* ---- card 13: read the numbers back ---- */
  // Course restructure (2026-10-25): the read-back and the old aha both stated 25.0 MW and
  // 4.4 MW, so they are merged here; a PUE card follows, and the aha hands on to the site.
  const held = budget(answer.it, answer.cooling);
  slider.input.disabled = true;
  segEnabled(false);

  guide.say(`It holds: ${held.total.toFixed(1)} MW on a ${LIMIT} MW line. The computers get
    ${held.it.toFixed(1)} MW of it, and cooling and losses take the other
    ${(held.cool + held.loss).toFixed(1)} MW.`);
  // the sum and the headroom ride along, or the scrim dims the two figures the card quotes
  stage.focus([itRect, coolRect, lossRect, totalTxt,
    rungLab.it.g, rungLab.cool.g, rungLab.loss.g, headT],
    { label: 'the three parts', at: 'top', ring: false });
  await guide.next();

  /* ---- card 14: PUE ---- */
  // Course restructure (2026-10-25): PUE is now defined on a card. 29.4 ÷ 25 = 1.176.
  guide.say(`The whole draw divided by the IT load is called the PUE (power usage
    effectiveness). Your hall's is ${held.total.toFixed(1)} ÷ ${held.it.toFixed(0)} =
    ${(held.total / held.it).toFixed(2)}. At 1.0, every watt would reach the computers.`);
  stage.focus([itRect, rungLab.it.g, totalTxt], { label: 'whole draw ÷ it load', at: 'right', ring: false });
  await guide.next();

  /* ---- card 15: the aha, handing on to the site ---- */
  stage.clearFocus();
  guide.aha(`Cooling and losses come out of the same line as the computers.`,
    `Halls like yours are built where power is cheap and water is close. Choosing that place
     for yours comes next.`);
  await guide.next();

  /* ==================== IN THE LAB — the power and the cooling, as installed ========== */

  stage.clearFocus();
  const lab = slideInPanel(svg, powerLab(), { lab: true });
  lab.focus('pdu');
  await lab.show();

  // Course restructure (2026-10-25): step 1 no longer defines PDUs, so the clause here does.
  guide.lab(`The IT load on your bar reaches each rack through its power distribution units
    (PDUs), the upright strips of sockets at the back that feed each server. The amber display shows the current
    the strip is carrying, in amps.`, { intro: true });
  await guide.next();

  lab.focus('psu');
  guide.lab(`Power supplies inside each server turn that AC into the DC the chips use. This
    label is from one in a DGX H100. A good supply delivers over 90 percent as DC, and the
    rest becomes heat in the server.`);
  await guide.next();

  lab.focus('plate');
  guide.lab(`Here are the plates from the step, as installed. A copper cold plate sits on the
    GPU in place of a heat sink, and coolant, mostly water with some glycol, flows through
    fine channels inside it.`);
  await guide.next();

  lab.focus(['plate', 'cdu']);
  guide.lab(`The hoses run to a coolant distribution unit (CDU). Its pump pushes the coolant
    round the racks, and a heat exchanger passes the heat to the building's water without the
    two mixing. This is part of the cooling on your bar.`);
  await guide.next();
  await lab.hide();
}
