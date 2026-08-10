// ACT 2 · STEP 3 — "A circuit that remembers" (the SR latch, then a register).
// Rebuilt to the micro-learning contract in DESIGN_MAKEOVER.md §2 / §4: one card at a
// time (guide.cards), every card focuses and names the one thing it is about, and the
// step opens on the ripple adder the player built last step so the felt need is theirs.
//
// Terminology is fixed by ACT2_MAKEOVER.md §2b, because Act 4 points back at it by name:
// the four-bit adder is a "ripple adder", the parked number lives in a "register", and
// the word "tick" never appears (Act 2 step 4 owns "cycle").
//
// The wiring interaction is rebuilt, not ported. The shipped version relied on a repeated
// hint plus a note-throttling hack because the click targets were 4-pixel pins and the
// rule lived only in the guide panel. Here exactly one pin is live at a time, it carries a
// 15-unit target ring over a 20-unit hit area, the pin the player must click next is
// labelled on the stage, and the pending wire follows the cursor. Nothing else on the
// stage is clickable, so there is no wrong click to report and no hint to throttle.
//
// Determinism: every visual change rides Anim.tween or a class flip, never a bare
// setTimeout loop, and each flow.ask replay branch lands on the same end state as the
// live run (both feedback wires drawn, the latch settled with MEMORY dark, then lit).
import { svgEl, el, waitFor, svgPt } from '../../engine/util.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeGate, sigWire, makeBits } from '../../engine/gates.js';
import { makeLamp } from '../../engine/components.js';

/* gate geometry, in the stage's 720×480 user units. h = 110 puts the two input pins
   36.7 units apart, which is what makes a 15-unit target ring unambiguous. */
const G = { x: 250, w: 130, h: 110 };
const G1Y = 96, G2Y = 274;

/* the four loop boxes of the register */
const BOX = { y: 176, w: 108, h: 96 };
const BX = [96, 246, 396, 546];
const REG_BITS = [1, 0, 1, 1];                 // 1011 = 11

async function fadeIn(nodes, dur = 320){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  list.forEach(n => { n.style.display = ''; n.style.opacity = '0'; });
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(p); }));
  list.forEach(n => { n.style.opacity = '1'; });
}
async function fadeOut(nodes, dur = 260){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(1 - p); }));
  list.forEach(n => { n.style.display = 'none'; });
}

/* a momentary control: pressed only while the pointer is down (touch + mouse safe) */
function makeMomentary(controls, label, onDown, onUp){
  const b = el('button', { class: 'btn', 'data-label': label.toLowerCase().replace(/[^a-z0-9]+/g, '-') }, label);
  b.addEventListener('pointerdown', e => { e.preventDefault(); if (b.disabled) return; b.classList.add('used'); onDown(); });
  b.addEventListener('pointerup', () => { if (b.classList.contains('used')){ b.classList.remove('used'); onUp(); } });
  b.addEventListener('pointerleave', () => { if (b.classList.contains('used')){ b.classList.remove('used'); onUp(); } });
  controls.appendChild(b);
  return b;
}

export async function step3(){
  guide.title('STEP 3 / 4 · NANOVOLT MEMORY', 'A circuit <em>that remembers</em>');
  guide.cards();

  const stage = newStage('08', 'An adder that forgets, then two NANDs wired into a loop that holds one bit');
  const { svg, controls } = stage;

  /* ============ SCENE A — the adder they just built, and what it forgets ========== */

  const sceneA = svgEl('g');
  svg.appendChild(sceneA);

  const rowA = makeBits(sceneA, { x: 70, y: 188, n: 4, gap: 32, size: 26, weights: false });
  const rowB = makeBits(sceneA, { x: 70, y: 262, n: 4, gap: 32, size: 26, weights: false });
  const rowLbl = (y, s) => {
    const t = svgEl('text', { x: 58, y, class: 'lbl-strong', 'text-anchor': 'end' });
    t.textContent = s; sceneA.appendChild(t);
  };
  rowLbl(206, 'A'); rowLbl(280, 'B');

  const wA = sigWire(sceneA, 'M198 201 H248');
  const wB = sigWire(sceneA, 'M198 275 H248');

  const adderBox = svgEl('g');
  adderBox.innerHTML = `
    <rect x="248" y="174" width="150" height="140" rx="5" class="tile-bg"/>
    <text x="323" y="240" class="gate-lbl">RIPPLE ADDER</text>
    <text x="323" y="260" class="lbl-faint">from step 2</text>`;
  sceneA.appendChild(adderBox);

  const wOut = sigWire(sceneA, 'M398 244 H458');
  const sumHead = svgEl('text', { x: 531, y: 202, class: 'lbl' });
  sumHead.textContent = 'SUM'; sceneA.appendChild(sumHead);
  const rowS = makeBits(sceneA, { x: 470, y: 231, n: 4, gap: 32, size: 26, weights: true });
  const sumRead = svgEl('text', { x: 531, y: 290, class: 'lbl-strong' });
  sumRead.textContent = '= 0'; sceneA.appendChild(sumRead);

  const setHold = on => {
    rowA.set(on ? 5 : 0); rowB.set(on ? 3 : 0); rowS.set(on ? 8 : 0);
    [wA, wB, wOut].forEach(w => w.set(on));
    sumRead.textContent = on ? '= 8' : '= 0';
  };
  setHold(false);

  /* ---- CARD 1 — preface, on the machine they already own ---- */
  guide.say(`Your ripple adder answers while you hold its inputs. This step builds a
    circuit that keeps an answer after you let go.`);
  stage.focus(adderBox, { label: 'your ripple adder', at: 'top' });
  await guide.next();

  /* ---- CARD 2 — press and hold, then let go ---- */
  stage.clearFocus();
  guide.say(`Press and hold the button below. The rows read 5 and 3, and the sum reads 8.
    Then let go.`);

  let held = false, pressedOnce = false;
  const holdBtn = makeMomentary(controls, 'HOLD THE INPUTS',
    () => { SFX.click(); held = true; pressedOnce = true; setHold(true); },
    () => { held = false; setHold(false); });

  await flow.ask(async replay => {
    if (replay !== undefined){ setHold(false); holdBtn.disabled = true; return replay; }
    await waitFor(() => pressedOnce && !held, { hold: 420 });
    holdBtn.disabled = true;
    return true;
  });

  /* ---- CARD 3 — what the release did ---- */
  guide.say(`The inputs went to 0 and the sum went with them. The adder only reports what
    is on its wires right now.`);
  stage.focus(rowS.g, { label: 'sum', at: 'bottom' });
  await guide.next();

  /* ---- CARD 4 — the aim ---- */
  stage.clearFocus();
  guide.say(`To hold an answer, a circuit has to keep telling itself what it just said.
    <b>Your goal: build that loop.</b>`);
  await guide.next();

  /* ============ SCENE B — two NANDs, wired into a loop by the player ============== */

  controls.innerHTML = '';
  await fadeOut([sceneA]);

  const sceneB = svgEl('g');
  svg.appendChild(sceneB);
  const wires = svgEl('g');                    // every wire lives under the gate boxes
  sceneB.appendChild(wires);

  const gate1 = makeGate(sceneB, { x: G.x, y: G1Y, kind: 'NAND', label: 'NAND', w: G.w, h: G.h, cap: 'gate 1' });
  const gate2 = makeGate(sceneB, { x: G.x, y: G2Y, kind: 'NAND', label: 'NAND', w: G.w, h: G.h, cap: 'gate 2' });
  [gate1, gate2].forEach(g => {
    const t = svgEl('text', { x: g.pinOut.x + 11, y: g.pinOut.y + 19, class: 'lbl-faint', 'text-anchor': 'start' });
    t.textContent = 'OUT'; sceneB.appendChild(t);
  });
  sceneB.style.opacity = '0';
  await fadeIn([sceneB], 340);

  /* ---- CARD 5 — define feedback before the player wires it ---- */
  guide.say(`This is <b>feedback</b>: each gate's output goes into the other one's input.
    The pair listens only to itself.`);
  stage.focus([gate1.g, gate2.g], { label: 'two nands', at: 'top' });
  await guide.next();

  /* ---- CARD 6 — close the loop ----
     No stage.focus on this card: focus re-parents the nodes it raises, which breaks
     listeners on anything inside a group, and the on-stage target label does the
     pointing that focus would otherwise do. */
  stage.clearFocus();
  guide.say(`<b>Your goal: close the loop.</b> Click the pin the stage marks, then the one
    it marks next. Two wires in all.`);

  const FB = {
    A: `M${gate1.pinOut.x} ${gate1.pinOut.y} H432 V240 H196 V${gate2.pinIn[0].y} H${G.x}`,
    B: `M${gate2.pinOut.x} ${gate2.pinOut.y} H456 V222 H170 V${gate1.pinIn[1].y} H${G.x}`,
  };
  const fb = {};
  const drawFB = async (k, animate) => {
    const w = sigWire(wires, FB[k]);
    fb[k] = w;
    if (animate){
      const len = w.el.getTotalLength() || 0;
      if (len){
        w.el.style.strokeDasharray = String(len);
        w.el.style.strokeDashoffset = String(len);
        await Anim.tween(420, p => { w.el.style.strokeDashoffset = String(len * (1 - p)); });
        w.el.style.strokeDasharray = ''; w.el.style.strokeDashoffset = '';
      }
    }
    return w;
  };

  /* one live target at a time: a ring, a label naming the pin, and a fat hit area */
  const STEPS = [
    { pin: gate1.pinOut,   side: 'right', text: 'click: gate 1 out' },
    { pin: gate2.pinIn[0], side: 'left',  text: 'click: gate 2 input' },
    { pin: gate2.pinOut,   side: 'right', text: 'click: gate 2 out' },
    { pin: gate1.pinIn[1], side: 'left',  text: 'click: gate 1 input' },
  ];

  await flow.ask(async replay => {
    if (replay !== undefined){
      await drawFB('A', false);
      await drawFB('B', false);
      return replay;
    }

    const marks = svgEl('g');
    const preview = svgEl('path', { class: 'wire sig preview', opacity: '0' });
    const ring = svgEl('circle', { r: 15, fill: 'none', stroke: 'var(--amber)', 'stroke-width': 1.6, 'stroke-dasharray': '4 4' });
    const tip = svgEl('text', { class: 'lbl-strong' });
    const hit = svgEl('circle', { r: 20, fill: 'transparent', cursor: 'pointer', tabindex: '0', role: 'button' });
    marks.append(preview, ring, tip, hit);
    svg.appendChild(marks);

    let i = 0, busy = false, done = false, armed = null, hot = null;

    const setTarget = k => {
      if (hot) hot.el.classList.remove('free');
      const s = STEPS[k];
      hot = s.pin;
      s.pin.el.classList.add('free');
      const right = s.side === 'right';
      ring.setAttribute('cx', s.pin.x); ring.setAttribute('cy', s.pin.y);
      hit.setAttribute('cx', s.pin.x);  hit.setAttribute('cy', s.pin.y);
      tip.setAttribute('x', s.pin.x + (right ? 26 : -26));
      tip.setAttribute('y', s.pin.y + 4);
      tip.setAttribute('text-anchor', right ? 'start' : 'end');
      tip.textContent = s.text.toUpperCase();
      hit.setAttribute('aria-label', s.text);
    };

    const move = e => {
      if (!armed) return;
      const p = svgPt(svg, e.clientX, e.clientY);
      preview.setAttribute('d', `M${armed.x} ${armed.y} L${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
      preview.setAttribute('opacity', '1');
    };
    svg.addEventListener('pointermove', move);

    const advance = async () => {
      if (busy || done) return;
      const s = STEPS[i];
      if (s.side === 'right'){                 // arm an output pin
        SFX.click();
        s.pin.el.classList.add('armed');
        armed = s.pin;
        i++; setTarget(i);
        return;
      }
      busy = true;                             // land the wire on the input pin
      SFX.hop();
      preview.setAttribute('opacity', '0');
      if (armed) armed.el.classList.remove('armed');
      armed = null;
      s.pin.el.classList.remove('free');
      hot = null;
      hit.style.pointerEvents = 'none';
      await drawFB(i === 1 ? 'A' : 'B', true);
      i++;
      busy = false;
      if (i >= STEPS.length) done = true;
      else { hit.style.pointerEvents = ''; setTarget(i); }
    };
    hit.addEventListener('click', advance);
    hit.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); advance(); }
    });

    setTarget(0);
    await waitFor(() => done, { hold: 200 });
    svg.removeEventListener('pointermove', move);
    marks.remove();
    SFX.success();
    return true;
  });

  /* ---- CARD 7 — the loop is closed ---- */
  guide.say(`Both wires are in. Each gate's input is now the other gate's output, so the
    pair keeps repeating itself.`);
  stage.focus([fb.A.el, fb.B.el], { label: 'the loop', at: 'right', ring: false });
  await guide.next();

  /* ---- CARD 8 — the two ways in ---- */
  stage.clearFocus();
  const setW = sigWire(wires, `M112 ${gate1.pinIn[0].y} H${G.x}`);
  const rstW = sigWire(wires, `M112 ${gate2.pinIn[1].y} H${G.x}`);
  setW.set(true); rstW.set(true);              // both lines idle at 1
  const inLbl = (y, big, small) => {
    const a = svgEl('text', { x: 100, y, class: 'lbl-strong', 'text-anchor': 'end' });
    a.textContent = big;
    const b = svgEl('text', { x: 100, y: y + 15, class: 'lbl-faint', 'text-anchor': 'end' });
    b.textContent = small;
    sceneB.append(a, b);
    return [a, b];
  };
  const sTxt = inLbl(gate1.pinIn[0].y - 4, 'S', 'SET');
  const rTxt = inLbl(gate2.pinIn[1].y - 4, 'R', 'RESET');
  await fadeIn([setW.el, rstW.el, ...sTxt, ...rTxt], 300);

  guide.say(`Two lines reach in from the left. S goes into the top gate, R into the
    bottom one.`);
  stage.focus([setW.el, rstW.el], { label: 's and r', at: 'left', ring: false });
  await guide.next();

  /* ---- CARD 9 — where you read the bit ---- */
  stage.clearFocus();
  const stub1 = sigWire(wires, `M${gate1.pinOut.x} ${gate1.pinOut.y} H553`);
  const lampQ = makeLamp(sceneB, 568, gate1.pinOut.y, { label: 'MEMORY' });
  await fadeIn([stub1.el, lampQ.g], 300);

  guide.say(`This lamp reads the top gate's output. That output is the bit you are
    storing: lit for 1, dark for 0.`);
  stage.focus(lampQ.g, { label: 'the stored bit', at: 'bottom' });
  await guide.next();

  /* ---- CARD 10 — the name ---- */
  stage.clearFocus();
  guide.say(`Two NANDs wired like this are an <b>SR latch</b>. S sets the bit to 1, R
    resets it to 0.`);
  stage.focus(sceneB, { label: 'sr latch', at: 'top' });
  await guide.next();

  /* ============ the latch, live ================================================== */

  let setHeld = false, resetHeld = false;
  let g1out = false, g2out = true;             // at rest holding 0
  let pressedS = false, pressedR = false;

  function recompute(){
    const setLine = setHeld ? 0 : 1;
    const resetLine = resetHeld ? 0 : 1;
    let a = g1out, b = g2out;                  // settle the loop (4 passes is plenty)
    for (let k = 0; k < 4; k++){
      const na = !(setLine && b);
      const nb = !(a && resetLine);
      a = na; b = nb;
    }
    g1out = a; g2out = b;
    gate1.set([setLine, g2out ? 1 : 0]);
    gate2.set([g1out ? 1 : 0, resetLine]);
    setW.set(!!setLine);
    rstW.set(!!resetLine);
    fb.A.set(g1out); fb.B.set(g2out);
    stub1.set(g1out);
    lampQ.set(g1out ? 1 : 0);
  }
  recompute();

  /* ---- CARD 11 — what a press does ---- */
  stage.clearFocus();
  makeMomentary(controls, 'HOLD S',
    () => { SFX.click(); setHeld = true; pressedS = true; recompute(); },
    () => { setHeld = false; recompute(); });
  makeMomentary(controls, 'HOLD R',
    () => { SFX.click(); resetHeld = true; pressedR = true; recompute(); },
    () => { resetHeld = false; recompute(); });

  guide.say(`Each button pulls its line down to 0 while you hold it, then lets it back up
    to 1 when you let go.`);
  stage.focus([setW.el, rstW.el], { label: 'pulled low while held', at: 'top', ring: false });
  await guide.next('Try it ▸');

  stage.clearFocus();

  /* ---- CARD 12 — store a 1 ---- */
  const t1 = guide.task('Store a 1. Hold S, then take your finger off.');
  await flow.ask(async replay => {
    if (replay !== undefined){
      setHeld = false; resetHeld = false; g1out = true; g2out = false; recompute();
      return replay;
    }
    await waitFor(() => pressedS && g1out && !setHeld && !resetHeld, { hold: 700 });
    return 1;
  });
  t1.done();

  /* ---- CARD 13 — store a 0 ---- */
  const t2 = guide.task('Store a 0. Hold R, then let go. MEMORY goes dark and stays dark.');
  await flow.ask(async replay => {
    if (replay !== undefined){
      setHeld = false; resetHeld = false; g1out = false; g2out = true; recompute();
      return replay;
    }
    await waitFor(() => pressedR && !g1out && !setHeld && !resetHeld, { hold: 700 });
    return 0;
  });
  t2.done();

  /* ---- CARD 14 — the aha ---- */
  guide.aha(`The loop remembers because it never stops telling itself the answer.`,
    `Swap the two NANDs for two inverters and add two access switches. Six transistors,
     and that is one cell of SRAM. A processor's cache is millions of them.`);
  await guide.next();

  /* ============ SCENE C — four loops, watched, then named ======================== */

  stage.clearFocus();
  controls.innerHTML = '';
  await stage.packInto([sceneB], { x: BX[0], y: BOX.y, w: BOX.w, h: BOX.h }, { dur: 560 });

  const sceneC = svgEl('g');
  svg.appendChild(sceneC);
  const loopsG = svgEl('g');
  sceneC.appendChild(loopsG);

  const boxes = BX.map((x, i) => {
    const g = svgEl('g');
    g.innerHTML = `
      <rect x="${x}" y="${BOX.y}" width="${BOX.w}" height="${BOX.h}" rx="5" class="tile-bg"/>
      <text x="${x + BOX.w / 2}" y="${BOX.y + 26}" class="lbl-faint">SR LATCH</text>
      <text x="${x + BOX.w / 2}" y="${BOX.y + 70}" class="gate-lbl"
        style="font-size:26px${REG_BITS[i] ? ';fill:var(--blue)' : ''}">${REG_BITS[i]}</text>`;
    g.style.opacity = '0';
    loopsG.appendChild(g);
    return g;
  });

  await fadeIn([boxes[0]], 300);
  for (let i = 1; i < 4; i++){
    if (!flow.instant) SFX.click();
    await fadeIn([boxes[i]], 200);
  }

  /* ---- CARD 15 — four of them ---- */
  guide.say(`One loop holds one bit. Four of them side by side hold four bits.`);
  stage.focus(loopsG, { label: 'four loops', at: 'top' });
  await guide.next();

  /* ---- CARD 16 — the name ---- */
  stage.clearFocus();
  const regBits = makeBits(sceneC, { x: 135, y: 310, n: 4, gap: 150, size: 30, weights: true });
  regBits.set(0b1011);
  const read = svgEl('text', { x: 360, y: 374, class: 'lbl-strong' });
  read.textContent = 'HOLDING 11';
  sceneC.appendChild(read);
  await fadeIn([regBits.g, read], 300);

  guide.say(`Four loops side by side are a <b>register</b>: a place to park a whole
    number. These four are holding 11.`);
  stage.focus(sceneC, { label: 'register', at: 'bottom' });
  await guide.next();
}
