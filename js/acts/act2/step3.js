// STEP 3 — Build your own memory (SR latch from two cross-coupled NANDs).
// Physics/CS per DESIGN.md §5b.4: the SR latch is two cross-coupled NANDs; the
// PLAYER draws the two feedback wires. SET/RESET pulse the (active-low) inputs —
// copy says "press = tug the line low", never bare jargon. Held state must
// visibly persist after release.
import { svgEl, el, waitFor, svgPt } from '../../engine/util.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeGate, sigWire, makeBits } from '../../engine/gates.js';
import { makeLamp } from '../../engine/components.js';

/* small local helper: an elbow path between two points (M/H/V), paper-style routing */
function elbow(x1, y1, x2, y2){
  const midX = x1 + (x2 - x1) / 2;
  return `M${x1} ${y1} H${midX} V${y2} H${x2}`;
}

/* a momentary control: pressed only while pointer is down (touch + mouse safe) */
function makeMomentary(controls, label, onDown, onUp){
  const b = el('button', { class: 'btn', 'data-label': label.toLowerCase().replace(/[^a-z0-9]+/g, '-') }, label);
  const down = e => { e.preventDefault(); b.classList.add('used'); onDown(); };
  const up = () => { b.classList.remove('used'); onUp(); };
  b.addEventListener('pointerdown', down);
  b.addEventListener('pointerup', up);
  b.addEventListener('pointerleave', () => { if (b.classList.contains('used')){ up(); } });
  controls.appendChild(b);
  return b;
}

export async function step3(){
  guide.title('STEP 3 / 4 · NANOVOLT MEMORY', 'Build your own <em>memory</em>');

  /* ===================== BEAT 1 — the problem: everything is an echo ===================== */
  {
    const { svg, controls } = newStage('07', 'Latch build');
    guide.say(`<b>Memory</b> is a circuit that holds a value after you stop supplying it — so a machine can keep a number around and come back to it. Your aim this step: build one, a circuit that <b>remembers a single bit after you let go</b>. First, see why the gates you have can't do it. Every gate you've wired so far has the same flaw: it only ever tells you about <em>right now</em>. Feed it inputs, read the answer, let go — and the answer is gone. Try it.`);

    const gate = makeGate(svg, { x: 305, y: 190, kind: 'NAND', label: 'NAND' });
    const lamp = makeLamp(svg, 480, 218, { label: 'OUT' });
    const wireA = sigWire(svg, elbow(150, 160, 305, 208));
    svg.insertBefore(wireA.el, gate.g);

    function update(aHeld){
      const ins = [aHeld ? 1 : 0, 0];
      const out = gate.set(ins);
      wireA.set(!!ins[0]);
      lamp.set(out ? 1 : 0);
    }
    update(false);

    guide.say(`<em>Press and hold</em> the button — then let go and watch the lamp.`);

    await flow.ask(async replay => {
      if (replay !== undefined){ update(false); return replay; }
      let pressedOnce = false;
      await new Promise(res => {
        makeMomentary(controls, 'HOLD A HIGH',
          () => { SFX.click(); pressedOnce = true; update(true); },
          () => { update(false); if (pressedOnce) res(); });
      });
      return true;
    });

    guide.say(`The instant your finger left the button, the input snapped back to LOW and the answer followed it down. A single gate has <b>no memory</b> — remove the input and the answer is gone. To hold onto an answer, a circuit has to keep feeding its own output back to itself.`);
    await guide.next();
  }

  /* ===================== BEAT 2 — the trick: feedback ===================== */
  const { svg, controls } = newStage('07', 'Latch build');
  guide.say(`The trick is <b>feedback</b>: wiring a circuit's output back into its own input, so it keeps hearing what it just said. Take <b>two</b> NAND gates, and instead of wiring their outputs onward, wire each one's output back into the <em>other's</em> input. Each gate starts listening to what the other just said — a loop that talks to itself.`);

  // gate geometry (h=64 → input pins are well separated: top = y+21.3, bottom = y+42.7)
  const G = { x: 230, w: 120, h: 64 };
  const gate1 = makeGate(svg, { x: G.x, y: 110, kind: 'NAND', label: 'NAND', w: G.w, h: G.h });
  const gate2 = makeGate(svg, { x: G.x, y: 300, kind: 'NAND', label: 'NAND', w: G.w, h: G.h });
  const g1lbl = svgEl('text', { x: G.x + G.w / 2, y: 96, class: 'lbl-faint' }); g1lbl.textContent = 'GATE 1';
  const g2lbl = svgEl('text', { x: G.x + G.w / 2, y: 392, class: 'lbl-faint' }); g2lbl.textContent = 'GATE 2';
  svg.append(g1lbl, g2lbl);

  const lampMem = makeLamp(svg, 592, gate1.pinOut.y, { label: 'MEMORY' });
  const lampShadow = makeLamp(svg, 592, gate2.pinOut.y, { label: 'ITS SHADOW' });
  const memCap = svgEl('text', { x: 592, y: gate1.pinOut.y + 26, class: 'lbl-faint' }); memCap.textContent = 'the bit';
  const shadowCap = svgEl('text', { x: 592, y: gate2.pinOut.y + 26, class: 'lbl-faint' }); shadowCap.textContent = 'its opposite';
  svg.append(memCap, shadowCap);

  // pre-drawn input wires land EXACTLY on the correct pins:
  //   SET → gate1 TOP input,  RESET → gate2 BOTTOM input
  const setInWire   = sigWire(svg, `M96 ${gate1.pinIn[0].y} H${G.x}`);
  const resetInWire = sigWire(svg, `M96 ${gate2.pinIn[1].y} H${G.x}`);
  const setLbl = svgEl('text', { x: 88, y: gate1.pinIn[0].y - 10, class: 'lbl-strong', 'text-anchor': 'end' }); setLbl.textContent = 'SET';
  const resetLbl = svgEl('text', { x: 88, y: gate2.pinIn[1].y + 18, class: 'lbl-strong', 'text-anchor': 'end' }); resetLbl.textContent = 'RESET';
  svg.append(setLbl, resetLbl);

  // output stubs toward the lamps (always live)
  const outStub1 = sigWire(svg, `M${gate1.pinOut.x} ${gate1.pinOut.y} H579`);
  const outStub2 = sigWire(svg, `M${gate2.pinOut.x} ${gate2.pinOut.y} H579`);
  const out1lbl = svgEl('text', { x: gate1.pinOut.x + 8, y: gate1.pinOut.y - 9, class: 'lbl-faint', 'text-anchor': 'start' }); out1lbl.textContent = 'OUT';
  const out2lbl = svgEl('text', { x: gate2.pinOut.x + 8, y: gate2.pinOut.y - 9, class: 'lbl-faint', 'text-anchor': 'start' }); out2lbl.textContent = 'OUT';
  svg.append(out1lbl, out2lbl);

  // the two feedback loops, hand-routed to nest cleanly around the gate pair
  //   A: gate1.OUT → gate2 TOP input    B: gate2.OUT → gate1 BOTTOM input
  const fbA = o => `M${gate1.pinOut.x} ${gate1.pinOut.y} H400 V284 H190 V${gate2.pinIn[0].y} H${G.x}`;
  const fbB = o => `M${gate2.pinOut.x} ${gate2.pinOut.y} H424 V196 H166 V${gate1.pinIn[1].y} H${G.x}`;

  // the two pins the player must fill (glow amber until wired)
  const freeTop = gate2.pinIn[0].el;     // gate2 top input ← gate1 out
  const freeBot = gate1.pinIn[1].el;     // gate1 bottom input ← gate2 out
  freeTop.classList.add('free');
  freeBot.classList.add('free');

  guide.say(`The <span class="e-red">two amber pins glowing in the middle</span> are the empty ones — that's your job. <b>Click an <em>OUT</em> pin</b> (round, on the right of a gate), then <b>click the glowing input pin on the OTHER gate</b>. Do it both ways, so each gate hears the other.`);

  await flow.ask(async replay => {
    const drawFB = which => {
      const w = sigWire(svg, which === 'A' ? fbA() : fbB());
      svg.insertBefore(w.el, gate1.g);
      return w;
    };
    if (replay !== undefined){
      drawFB('A'); drawFB('B');
      freeTop.classList.remove('free'); freeBot.classList.remove('free');
      gate1.pinOut.el.classList.remove('armed'); gate2.pinOut.el.classList.remove('armed');
      return true;
    }

    const cancelHint = flow.hintAfter(15000, `Click GATE 1's <em>OUT</em> pin, then the glowing pin on GATE 2. Then GATE 2's <em>OUT</em>, then the glowing pin on GATE 1.`);

    // dedupe the guidance notes so repeated wrong clicks don't stack
    let lastNote = '', lastNoteAt = 0;
    const say = msg => { const t = performance.now(); if (msg === lastNote && t - lastNoteAt < 1600) return; lastNote = msg; lastNoteAt = t; guide.note(msg); };

    let armed = null;                     // 1 or 2 (which gate's OUT is armed)
    let doneA = false, doneB = false;
    const preview = svgEl('path', { class: 'wire sig preview', opacity: 0 });
    svg.insertBefore(preview, gate1.g);

    await new Promise(resolve => {
      function disarm(){
        [gate1.pinOut.el, gate2.pinOut.el].forEach(p => p.classList.remove('armed'));
        armed = null; preview.setAttribute('opacity', 0);
      }
      function armGate(n, pinEl, ox, oy){
        disarm();
        armed = { n, ox, oy };
        pinEl.classList.add('armed');
      }
      function tryFinish(){ if (doneA && doneB){ disarm(); preview.remove(); cancelHint(); resolve(); } }
      function clickable(pinEl, fn){
        pinEl.style.cursor = 'pointer'; pinEl.setAttribute('tabindex', '0'); pinEl.setAttribute('role', 'button');
        pinEl.addEventListener('click', fn);
        pinEl.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fn(); } });
      }

      // rubber-band preview from the armed OUT pin to the cursor
      svg.addEventListener('pointermove', e => {
        if (!armed) return;
        const p = svgPt(svg, e.clientX, e.clientY);
        preview.setAttribute('d', `M${armed.ox} ${armed.oy} L${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
        preview.setAttribute('opacity', 1);
      });

      clickable(gate1.pinOut.el, () => { SFX.click();
        if (doneA){ say(`Gate 1's loop is already wired.`); return; }
        armGate(1, gate1.pinOut.el, gate1.pinOut.x, gate1.pinOut.y); });
      clickable(gate2.pinOut.el, () => { SFX.click();
        if (doneB){ say(`Gate 2's loop is already wired.`); return; }
        armGate(2, gate2.pinOut.el, gate2.pinOut.x, gate2.pinOut.y); });

      // free input on GATE 2 (top) — expects GATE 1's output
      clickable(freeTop, () => { SFX.click();
        if (!armed){ say(`Start from an <em>OUT</em> pin — the round pin on the right of a gate.`); return; }
        if (armed.n === 2){ say(`A gate can't feed its own input — arm the OTHER gate's OUT pin.`); return; }
        drawFB('A'); doneA = true; freeTop.classList.remove('free'); SFX.hop(); disarm(); tryFinish(); });
      // free input on GATE 1 (bottom) — expects GATE 2's output
      clickable(freeBot, () => { SFX.click();
        if (!armed){ say(`Start from an <em>OUT</em> pin — the round pin on the right of a gate.`); return; }
        if (armed.n === 1){ say(`A gate can't feed its own input — arm the OTHER gate's OUT pin.`); return; }
        drawFB('B'); doneB = true; freeBot.classList.remove('free'); SFX.hop(); disarm(); tryFinish(); });

      // the SET/RESET-fed pins: explain gently (deduped)
      clickable(gate1.pinIn[0].el, () => say(`That pin already carries <b>SET</b> — wire the glowing pin just below it instead.`));
      clickable(gate2.pinIn[1].el, () => say(`That pin already carries <b>RESET</b> — wire the glowing pin just above it instead.`));
    });

    return true;
  });

  guide.say(`Wired. Look at what you built: gate 1's answer feeds gate 2, and gate 2's answer feeds gate 1 — <b>MEMORY</b> and <b>ITS SHADOW</b>, each one the other's proof. Two cross-coupled NANDs holding a bit like this is an <b>SR latch</b> — <b>S</b> for the SET input, <b>R</b> for RESET, the two controls you're about to use.`);
  await guide.next();

  /* ===================== BEAT 3 — it's alive ===================== */
  guide.say(`Now the controls come alive. Released, SET and RESET both sit HIGH and do nothing. <b>Press = tug the line low.</b> Press <b>SET</b> and the loop locks onto 1. Press <b>RESET</b> and it locks onto 0. Let go of either — watch it hold anyway.`);

  let setHeld = false, resetHeld = false;
  let g1out = true, g2out = false;   // initial rest state: MEMORY (Q) = 1, SHADOW = 0

  function recompute(){
    // gate1 inputs: [SET line, feedback from gate2]; gate2 inputs: [feedback from gate1, RESET line]
    const setLine = setHeld ? 0 : 1;
    const resetLine = resetHeld ? 0 : 1;
    // settle the loop iteratively (a couple of passes is enough for a NAND latch)
    let a = g1out, b = g2out;
    for (let i = 0; i < 4; i++){
      const na = !(setLine && b);
      const nb = !(a && resetLine);
      a = na; b = nb;
    }
    g1out = a; g2out = b;
    gate1.set([setLine, g2out ? 1 : 0]);
    gate2.set([g1out ? 1 : 0, resetLine]);
    setInWire.set(!!setLine);
    resetInWire.set(!!resetLine);
    outStub1.set(g1out);
    outStub2.set(g2out);
    lampMem.set(g1out ? 1 : 0);
    lampShadow.set(g2out ? 1 : 0);
  }
  recompute();

  makeMomentary(controls, 'SET (press = tug the line low)',
    () => { setHeld = true; recompute(); },
    () => { setHeld = false; recompute(); });
  makeMomentary(controls, 'RESET (press = tug the line low)',
    () => { resetHeld = true; recompute(); },
    () => { resetHeld = false; recompute(); });

  await guide.next('Try it ▸');

  /* ===================== BEAT 4 — THE TEST ===================== */
  const t1 = guide.task('Store a 1 — then take your finger away');
  await flow.ask(async replay => {
    if (replay !== undefined){
      setHeld = false; resetHeld = false; g1out = true; g2out = false; recompute();
      return replay;
    }
    const cancel = flow.hintAfter(14000, `Press SET — that tugs its line low and locks the loop onto 1. Then let go; it should stay lit.`);
    await waitFor(() => g1out === true && !setHeld && !resetHeld, { hold: 900 });
    cancel();
    return 1;
  });
  t1.done();

  const t2 = guide.task('Now store a 0 — and let go');
  await flow.ask(async replay => {
    if (replay !== undefined){
      setHeld = false; resetHeld = false; g1out = false; g2out = true; recompute();
      return replay;
    }
    const cancel = flow.hintAfter(14000, `Press RESET this time — then release, and watch MEMORY go dark and stay dark.`);
    await waitFor(() => g1out === false && !setHeld && !resetHeld, { hold: 900 });
    cancel();
    return 0;
  });
  t2.done();

  guide.aha(`The loop remembers because it never stops telling itself the answer.`,
    `A tightened version of this loop — two cross-coupled inverters plus two access switches, six transistors in all — is <b>one cell of SRAM</b>. The megabytes in your pocket are this same feedback loop, repeated billions of times.`);
  await guide.next();

  /* ---------- four loops = a register ---------- */
  guide.say(`One loop parks a single bit. Line up <b>four</b> of them and you've got somewhere to park a whole number.`);

  const { svg: svg2 } = newStage('07', 'A register of bits');
  const bitX = [70, 210, 350, 490];
  bitX.forEach((x, i) => {
    makeGate(svg2, { x, y: 190, kind: 'NAND', label: 'BIT', w: 100, cap: `cell ${i + 1}` });
  });
  const regBits = makeBits(svg2, { x: 210, y: 340, n: 4, label: 'REGISTER — a place to park a whole number' });
  regBits.set(0);

  guide.say(`Four loops = a <b>register</b>: a place to park a whole number, held steady until something asks it to change.`);
  await guide.next();
}
