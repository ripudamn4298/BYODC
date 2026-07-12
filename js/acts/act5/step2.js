// ACT 5 · STEP 2 — "The megawatt problem".
// Act 1's aha returns AT SCALE: CMOS uses a tiny bit of power per flip, but 10^15 flips/sec
// across many chips adds up to a power station. PowerLadder: budget a 30 MW feed across
// IT load / cooling / losses; air caps out, liquid unlocks density. Test:
// configure a hall holding 25 MW of IT load under the 30 MW thermal limit.
import { svgEl, waitFor } from '../../engine/util.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makePowerLadder } from '../../engine/dc.js';
import { makeSlider, makeSeg, makeChip } from '../../engine/components.js';

const CAP_MW = 30;

// cooling model: liquid unlocks far higher IT density per MW of overhead.
// at 25 MW IT load: air = 25 + 10.5 + 1.42 = 36.9 MW (well over 30 — throttles);
// liquid = 25 + 3.75 + 1.15 = 29.9 MW (just under the 30 MW line — the test's solution).
function coolFor(it, cooling){
  return cooling === 'liquid' ? it * 0.15 : it * 0.42;
}

export async function step2(){
  guide.title('STEP 2 / 4 · NANOVOLT CLOUD', 'The <em>megawatt</em> problem');

  /* ===================== BEAT 1 — the aha returns at scale ===================== */
  guide.say(`First the terms. <b>Power draw</b> is how much electrical power a chip uses, measured in watts; at this scale we count in <b>megawatts (MW)</b> — millions of watts. Remember the CMOS inverter from Act 1: it only draws real power at the instant it <em>flips</em>. That's still true. But a modern GPU flips transistors roughly a <b>quadrillion</b> times a second, and there are tens of thousands of GPUs in this room. Multiply that tiny bit of power per flip by that many flips and that many chips, and the total draw reaches the scale of a power station. This step: split a hall's power budget between computing and cooling, and keep the total under the line the grid can supply.`);
  await guide.next();

  /* ===================== BEAT 2 — the ladder ===================== */
  const { svg, controls } = newStage('19', 'Power ladder — IT load, cooling, losses');
  guide.say(`This hall is fed by a <b>${CAP_MW} MW</b> line — that's the total power budget, the most the grid delivers here. The ladder on the right splits that budget three ways: <b>IT load</b> (the power the GPUs use to compute), <b>cooling</b> (the extra power spent carrying their heat back out — the cooling overhead), and a small slice lost to conversion. All three must fit under the ${CAP_MW} MW line. Push the IT load slider up and watch cooling climb <em>with</em> it — more computing means more heat to remove.`);

  const ladder = makePowerLadder(svg, { x: 470, y: 80, w: 140, h: 300, capMW: CAP_MW });
  const capLbl = svgEl('text', { x: 540, y: 400, class: 'lbl-faint' });
  capLbl.textContent = 'IT LOAD / COOLING / LOSSES';
  svg.appendChild(capLbl);

  let itLoad = 12, cooling = 'air';

  function render(){
    const cool = coolFor(itLoad, cooling);
    const loss = (itLoad + cool) * 0.04;
    return ladder.set({ it: itLoad, cool, loss }, CAP_MW);
  }

  const slider = makeSlider(controls, {
    label: 'IT LOAD (MW)', min: 4, max: 30, step: 1, value: itLoad,
    fmt: v => `${v} MW`,
  });
  const seg = makeSeg(controls, [
    { id: 'air', label: 'AIR COOLING', value: 'air' },
    { id: 'liquid', label: 'LIQUID COOLING', value: 'liquid' },
  ], v => { cooling = v; seg.set(v); refresh(); });
  seg.set('air');
  const statusChip = makeChip(controls, '');

  function refresh(){
    const { total, over } = render();
    statusChip.set(over
      ? `<b style="color:var(--red)">OVER LIMIT</b> — racks throttle, halls overheat`
      : `<b>${(CAP_MW - total).toFixed(1)} MW</b> of headroom left`);
    statusChip.cls('warm', !over);
  }
  slider.on(v => { itLoad = v; refresh(); });
  refresh();

  guide.say(`There are two ways to cool. <b>Air cooling</b> blows chilled air across the chips; it's simple but weak, so its overhead is large. <b>Liquid cooling</b> pumps coolant right up against them; liquid carries heat away far better than air, so it needs much less overhead for the same GPUs. Push the IT load past what air can carry and the caption turns red — the total has crossed the ${CAP_MW} MW line. Switch to liquid and watch that same load fit.`);
  await guide.next();

  /* ===================== BEAT 3 — THE TEST ===================== */
  const task = guide.task('Hold 25 MW of IT load under the 30 MW limit, at full tilt');
  const cancelHint = flow.hintAfter(14000, `Air cooling alone can't carry 25 MW of GPUs without going over the line — switch to <b>LIQUID COOLING</b>, then push the IT load slider up to 25.`);

  await flow.ask(async replay => {
    if (replay !== undefined){
      cooling = replay.cooling; itLoad = replay.it;
      seg.set(cooling); slider.set(itLoad);
      refresh(); cancelHint();
      return replay;
    }
    await waitFor(() => {
      const cool = coolFor(itLoad, cooling);
      const loss = (itLoad + cool) * 0.04;
      const total = itLoad + cool + loss;
      return itLoad >= 25 && total <= CAP_MW + 0.01;
    }, { hold: 500 });
    cancelHint();
    return { cooling, it: itLoad };
  });
  task.done();

  guide.aha(`<b>Held.</b> 25 MW of GPUs, cooled by liquid, fits under the 30 MW line with headroom to spare.`,
    `Air cooling caps how much compute a hall can hold. Liquid cooling raises that cap — it's what lets a supercluster fit into acres instead of miles.`);
  await guide.next();

  /* ===================== BEAT 4 — the map is part of the machine ===================== */
  guide.say(`This is why data centres cluster next to <b>rivers, dams, and cheap grid</b> — cooling water and megawatts are as much a part of the machine as any transistor. <b>Training one frontier model can draw about as much power, over its run, as a small town uses in a year.</b> The map isn't background scenery anymore. It's a component.`);
  await guide.next();
}
