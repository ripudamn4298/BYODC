// ACT 5 · STEP 3 — "Cooling costs you megawatts".
// Rebuilt to the micro-learning contract in DESIGN_MAKEOVER.md §2 and the card script in
// ACT5_MAKEOVER.md §3: one card at a time (guide.cards), the Act 1 inverter and its meter
// twitch opening the step (rule 4), each rung of the power ladder named on its own card
// with its label landing at that moment (rule 3), the supply line defined before the
// player is asked to fit anything under it, and the cooling choice shown on the ladder
// rather than asserted in prose. The task is unchanged: 25 MW of IT load under a 30 MW
// line, which only liquid cooling can do.
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
// Determinism: the needle twitch and every ladder move run on Anim.tween, which collapses
// to its end state while replaying, and the three recorded answers (final input level,
// cooling choice, {cooling, it}) restore the same state live or on replay. No Math.random,
// no Date.now, no setTimeout driving a visual.
import { waitFor, el, svgEl } from '../../engine/util.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makePowerLadder } from '../../engine/dc.js';
import { makeSlider, makeSeg } from '../../engine/components.js';

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
const MET = { x: 300, y: 74, w: 120, h: 96, cx: 360, cy: 156, r: 42 };
const A0 = 215 * Math.PI / 180, A1 = 325 * Math.PI / 180;
const INV = { x: 300, y: 214, w: 120, h: 58, mid: 243 };
const LAD = { x: 300, y: 70, w: 120, h: 300 };
const NAME_X = 206, VAL_X = 286;

const polar = (cx, cy, r, a) => `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
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
  guide.title('STEP 3 / 5 · NANOVOLT CLOUD', 'Cooling costs you <em>megawatts</em>');
  guide.cards();

  const stage = newStage('23', 'A meter twitching as an inverter flips, then a power ladder splitting a 30 MW line between IT load, cooling and losses');
  const { svg, controls } = stage;

  /* ==================== SCENE A — the Act 1 inverter, still true ==================== */

  const sceneA = svgEl('g');
  svg.appendChild(sceneA);

  const meterG = svgEl('g');
  meterG.innerHTML = `
    <rect x="${MET.x}" y="${MET.y}" width="${MET.w}" height="${MET.h}" rx="5" class="tile-bg"/>
    <path d="M${polar(MET.cx, MET.cy, MET.r, A0)} A${MET.r} ${MET.r} 0 0 1 ${polar(MET.cx, MET.cy, MET.r, A1)}"
          fill="none" stroke="var(--hairline-strong)" stroke-width="1.2"/>
    ${[A0, (A0 + A1) / 2, A1].map(a =>
      `<path d="M${polar(MET.cx, MET.cy, MET.r - 7, a)} L${polar(MET.cx, MET.cy, MET.r, a)}" class="wire"/>`).join('')}`;
  const needle = svgEl('line', {
    x1: MET.cx, y1: MET.cy, x2: MET.cx, y2: MET.cy,
    stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round',
  });
  const pivot = svgEl('circle', { cx: MET.cx, cy: MET.cy, r: 3, fill: 'var(--ink)' });
  const readout = svgEl('text', { x: MET.cx, y: MET.y + MET.h + 16, class: 'lbl-strong' });
  readout.textContent = 'AT REST';
  meterG.append(needle, pivot, readout);
  sceneA.appendChild(meterG);

  /* the needle reads a fraction of full deflection. There is no sourced figure for the
     current of one flip, so the dial carries no units and the copy claims none. */
  function setNeedle(f){
    const a = A0 + (A1 - A0) * Math.max(0, Math.min(1, f));
    needle.setAttribute('x2', (MET.cx + 32 * Math.cos(a)).toFixed(1));
    needle.setAttribute('y2', (MET.cy + 32 * Math.sin(a)).toFixed(1));
  }
  setNeedle(0);

  const invG = svgEl('g');
  invG.innerHTML = `
    <line x1="${MET.cx}" y1="${MET.y + MET.h}" x2="${MET.cx}" y2="${INV.y}" class="wire"/>
    <rect x="${INV.x}" y="${INV.y}" width="${INV.w}" height="${INV.h}" rx="5" class="tile-bg"/>
    <line x1="270" y1="${INV.mid}" x2="${INV.x}" y2="${INV.mid}" class="wire"/>
    <line x1="${INV.x + INV.w}" y1="${INV.mid}" x2="450" y2="${INV.mid}" class="wire"/>
    <rect x="238" y="227" width="32" height="32" rx="3" class="bit-cell"/>
    <rect x="450" y="227" width="32" height="32" rx="3" class="bit-cell"/>`;
  const invT = svgEl('text', { x: INV.x + INV.w / 2, y: INV.mid + 4, class: 'gate-lbl' });
  invT.textContent = 'INVERTER';
  const inT = svgEl('text', { x: 254, y: INV.mid + 5, class: 'bit-t' });
  const outT = svgEl('text', { x: 466, y: INV.mid + 5, class: 'bit-t' });
  const inL = svgEl('text', { x: 254, y: 278, class: 'lbl-faint' });
  inL.textContent = 'IN';
  const outL = svgEl('text', { x: 466, y: 278, class: 'lbl-faint' });
  outL.textContent = 'OUT';
  invG.append(invT, inT, outT, inL, outL);
  sceneA.appendChild(invG);

  let IN = 0, flips = 0, twitching = false;
  function setIN(v){
    IN = v;
    inT.textContent = String(v);
    outT.textContent = String(v === 0 ? 1 : 0);
  }
  setIN(0);

  async function twitch(){
    twitching = true;
    readout.textContent = 'SWITCHING';
    // a fast rise and a slower fall, on a linear clock, so one flip is watchable
    await Anim.tween(760, p => {
      setNeedle(p >= 1 ? 0 : p < 0.16 ? 0.6 * (p / 0.16) : 0.6 * Math.exp(-4.6 * (p - 0.16)));
    }, p => p);
    setNeedle(0);
    readout.textContent = 'AT REST';
    twitching = false;
  }

  const scaleG = svgEl('g');
  const scale1 = svgEl('text', { x: 360, y: 336, class: 'lbl' });
  scale1.textContent = 'BILLIONS OF FLIPS PER SECOND';
  const scale2 = svgEl('text', { x: 360, y: 360, class: 'lbl' });
  scale2.textContent = '× THOUSANDS OF CHIPS IN THIS HALL';
  scaleG.append(scale1, scale2);
  scaleG.style.display = 'none';
  sceneA.appendChild(scaleG);

  /* ---- card 1: it is the player's own inverter ---- */
  guide.say(`This is the inverter you built in Act 1, wired to a meter that reads what it
    draws from the supply.`);
  stage.focus(invG, { label: 'your act 1 inverter', at: 'bottom' });
  await guide.next();

  /* ---- card 2: power only at the instant it flips ---- */
  guide.say(`It draws power only at the instant its output flips. Flip the input twice and
    watch the needle.`);
  stage.focus(meterG, { label: 'watch the meter', at: 'left' });

  const flipBtn = el('button', { class: 'btn primary', 'data-label': 'flip-the-input' }, 'FLIP THE INPUT');
  controls.appendChild(flipBtn);

  await flow.ask(async replay => {
    if (replay !== undefined){
      setIN(replay);
      flipBtn.disabled = true; flipBtn.classList.add('used');
      return replay;
    }
    flipBtn.addEventListener('click', async () => {
      if (twitching || flips >= 2) return;
      SFX.click();
      flips++;
      setIN(IN === 0 ? 1 : 0);
      if (flips >= 2){ flipBtn.disabled = true; flipBtn.classList.add('used'); }
      await twitch();
    });
    await waitFor(() => flips >= 2 && !twitching, { hold: 320 });
    return IN;
  });

  /* ---- card 3: what the meter did ---- */
  guide.say(`Two flips, two twitches. In between, the pair held its answer and drew almost
    nothing.`);
  stage.focus(meterG, { label: 'power only when it changes', at: 'left' });
  await guide.next();

  /* ---- card 4: the same twitch, multiplied ---- */
  stage.clearFocus();
  await fadeIn([scaleG], 340);

  guide.say(`One chip flips billions of times a second, and this hall holds thousands of
    chips. Every one of those twitches comes off the same power line.`);
  stage.focus(scaleG, { label: 'what the hall pays for', at: 'top' });
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

  /* ---- card 5: the bar is the hall's whole draw ---- */
  guide.say(`Every watt this hall pulls lands in one of three piles. The bar is the whole
    draw, split between them. <b>Your goal: keep it under the line you are given.</b>`);
  stage.focus(frameRect, { label: "the hall's draw", at: 'top' });
  await guide.next();

  /* ---- card 6: IT load ---- */
  stage.clearFocus();
  const slider = makeSlider(controls, {
    label: 'IT LOAD (MW)', min: 4, max: 30, step: 1, value: itLoad, fmt: v => `${v} MW`,
  });
  slider.input.disabled = true;
  await moveTo({ it: START_IT, cool: 0, loss: 0 }, 520);

  guide.say(`IT load is the power the computers themselves take. It is the only part of the
    bill that does any work.`);
  stage.focus([itRect, rungLab.it.g], { label: 'it load', at: 'top' });
  await guide.next();

  /* ---- card 7: cooling ---- */
  stage.clearFocus();
  const air12 = budget(START_IT, 'air');
  await moveTo({ it: air12.it, cool: air12.cool, loss: 0 }, 460);

  guide.say(`All of that power leaves the racks as heat. Cooling is what you spend carrying
    the heat back out of the building.`);
  stage.focus([coolRect, rungLab.cool.g], { label: 'cooling', at: 'top' });
  await guide.next();

  /* ---- card 8: losses ---- */
  stage.clearFocus();
  await moveTo({ it: air12.it, cool: air12.cool, loss: air12.loss }, 420);

  guide.say(`The rest warms the transformers and power supplies that feed the hall. About 4
    percent never reaches a rack.`);
  stage.focus([lossRect, rungLab.loss.g], { label: 'losses', at: 'top' });
  await guide.next();

  /* ---- card 9: the line ---- */
  stage.clearFocus();
  await fadeIn([limitLine, limitTxt, headT], 340);

  guide.say(`One line feeds the hall, and the utility rated it at ${LIMIT} MW. Nothing you
    build changes that number. Everything on the bar has to fit under it.`);
  stage.focus([limitLine, limitTxt], { label: 'the grid line', at: 'top' });
  await guide.next();

  /* ---- card 10: air cooling ---- */
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
    lot of fan power, which is why this rung is ${air12.cool.toFixed(1)} MW wide.`);
  stage.focus([coolRect, rungLab.cool.g], { label: 'air cooling', at: 'top' });
  await guide.next();

  /* ---- card 11: liquid cooling, and the switch ---- */
  stage.clearFocus();
  segEnabled(true);

  guide.say(`Liquid cooling pumps coolant through plates sitting on the chips. Water carries
    heat far better than air. Switch to it and watch the rung.`);

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

  /* ---- card 12: the two overheads, side by side ---- */
  const liq12 = budget(START_IT, 'liquid');
  guide.say(`Same ${START_IT} MW of computing. Air spent ${air12.cool.toFixed(1)} MW
    carrying the heat out. Liquid spends ${liq12.cool.toFixed(1)}.`);
  stage.focus([coolRect, rungLab.cool.g], { label: 'liquid cooling', at: 'top' });
  await guide.next();

  /* ---- card 13: the task ---- */
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
        ? `AIR CANNOT CARRY ${TASK_IT} MW UNDER THIS LINE`
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

  /* ---- card 14: read the four numbers back ---- */
  const held = budget(answer.it, answer.cooling);
  slider.input.disabled = true;
  segEnabled(false);

  guide.say(`Held. ${held.it.toFixed(1)} MW of computing, ${held.cool.toFixed(1)} MW of
    cooling and ${held.loss.toFixed(1)} MW lost on the way in. ${held.total.toFixed(1)} MW
    on a ${LIMIT} MW line.`);
  // the sum and the headroom ride along, or the scrim dims the two figures the card quotes
  stage.focus([itRect, coolRect, lossRect, totalTxt,
    rungLab.it.g, rungLab.cool.g, rungLab.loss.g, headT],
    { label: 'the three piles', at: 'top', ring: false });
  await guide.next();

  /* ---- card 15: what the budget really bought ---- */
  stage.clearFocus();
  guide.aha(`Cooling and losses took ${(held.cool + held.loss).toFixed(1)} MW of the
    ${LIMIT}. You paid for the whole line, and the computers got ${held.it.toFixed(1)} MW of it.`,
    `Cooling is part of the power budget from the day you size the line. It is why these
     halls get built where power is cheap and water is close.`);
  await guide.next();
}
