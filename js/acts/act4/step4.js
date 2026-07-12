// ACT 4 · STEP 4 / 5 — "Feed the beast" (Roofline seesaw: compute demand vs memory supply).
// 16 lanes starve if numbers can't arrive fast enough. Two tests: fix a starved config,
// then fix a wasteful one. Closes with the leitmotif stamp (second of three). Per HANDOFF §5
// ACT4 STEP3 + HANDOFF_V3 §4.5.
import { waitFor, el } from '../../engine/util.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeRoofline, makeLaneGrid } from '../../engine/lanes.js';
import { makeSlider, makeChip } from '../../engine/components.js';
import { makeMotto } from '../../engine/mathengine.js';

export async function step4(){
  guide.title('STEP 4 / 5 · NANOVOLT GRAPHICS', 'Feed <em>the beast</em>');

  guide.note(`Register file → engine, you paid a mux. Memory → chip, you'll pay in wires and watts. Same law, one level up.`);

  // stage first, so the beam is on the bench while we explain it (no stale scene lingering)
  const { svg, controls } = newStage('16', 'Roofline: compute demand vs memory supply');
  const roof = makeRoofline(svg, { cx: 360, cy: 190, beam: 250 });

  /* a small row of lamps standing in for "fed" lanes — amber when starving */
  const feedLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  feedLabel.setAttribute('x', '360'); feedLabel.setAttribute('y', '330'); feedLabel.setAttribute('class', 'rail-t');
  feedLabel.setAttribute('text-anchor', 'middle');
  feedLabel.textContent = 'LANE FEED — BLUE FED, AMBER STARVING';
  svg.appendChild(feedLabel);
  const feedRow = makeLaneGrid(svg, { x: 210, y: 340, cols: 8, rows: 1, cell: 34, gap: 6 });

  guide.say(`The aim of this step: balance how fast the lanes can compute against how fast numbers arrive from memory. A lane can only add numbers if numbers keep <em>arriving</em>. Those numbers — the pixels, the weights, the data your lanes chew through — live in <b>memory</b>, and every tick each lane needs a fresh one. The rate at which memory can deliver numbers is its <b>bandwidth</b>. That steady stream of numbers is the lanes' <em>food</em>; when a lane runs out and sits idle waiting for the next number, it's <b>starving</b>.`);
  await guide.next();
  guide.say(`Modern GPUs feed the lanes with <b>HBM</b> — "high-bandwidth memory": towers of memory chips stacked right on top of the package and wired in through thousands of tiny vertical wires, so numbers pour in fast. <b>More stacks = more food per tick.</b> Too few, for too many hungry lanes, and the army stands around <b>starving</b>.`);
  await guide.next();

  const utilChip = makeChip(controls, 'UTILIZATION: <b>—</b>');

  guide.say(`This balance has a name: the <b>roofline</b> — compute demand weighed against memory supply, with performance capped by whichever is smaller. Here it's drawn as a beam. Left pan, <b>compute demand</b>: how many lanes are hungry. Right pan, <b>memory supply</b>: how many HBM stacks are feeding them. The lamps below show each lane — blue when fed, amber when starving. Tip the beam level and every lane eats.`);

  const lanesSlider = makeSlider(controls, { label: 'lanes (mouths to feed)', min: 4, max: 64, step: 1, value: 16, fmt: v => `${v} lanes` });
  const memSlider = makeSlider(controls, { label: 'HBM stacks (food supply)', min: 1, max: 8, step: 1, value: 2, fmt: v => `${v} stack${v === 1 ? '' : 's'}` });

  function updateFeedRow(starving){
    for (let i = 0; i < 8; i++){
      feedRow.setActive(i, !starving);
      feedRow.lanes[i].lamp.style.fill = starving ? 'var(--amber)' : '';
      feedRow.lanes[i].lamp.style.stroke = starving ? 'var(--amber)' : '';
    }
  }

  function apply(){
    const demand = lanesSlider.value / 64;
    const supply = memSlider.value / 8;
    const { util, starving } = roof.set(demand, supply);
    utilChip.set(`UTILIZATION: <b>${Math.round(util * 100)}%</b>`);
    utilChip.cls('warm', starving);
    updateFeedRow(starving);
    return { util, starving, demand, supply };
  }
  apply();
  lanesSlider.on(apply);
  memSlider.on(apply);

  await guide.next();

  /* ---------- test (a): fix a starved config ---------- */
  guide.say(`<b>First fix.</b> This rig is starved — too many lanes, too little memory. Pull the sliders until utilization reaches <b>90% or better</b>.`);

  await flow.ask(async replay => {
    if (replay !== undefined){
      lanesSlider.set(replay.lanes);
      memSlider.set(replay.mem);
      apply();
      return replay;
    }
    lanesSlider.set(56);
    memSlider.set(1);
    apply();
    const cancel = flow.hintAfter(14000, `Either pull LANES down or push MEMORY STACKS up — you need supply to catch up with demand. Try lanes around 16 and memory around 4.`);
    await waitFor(() => apply().util >= 0.9, { hold: 500 });
    cancel();
    return { lanes: lanesSlider.value, mem: memSlider.value };
  });

  guide.note(`Fed. The beam sits nearly level and every lamp in that row is lit — no lane waiting on data.`);
  await guide.next();

  /* ---------- test (b): fix a wasteful config ---------- */
  guide.say(`<b>Second fix.</b> This rig isn't starving — it's <b>wasting money</b>. Way more memory than these lanes could ever ask for. Bring it back down: keep utilization at <b>90% or better</b>, without paying for idle memory.`);

  await flow.ask(async replay => {
    if (replay !== undefined){
      lanesSlider.set(replay.lanes);
      memSlider.set(replay.mem);
      apply();
      return replay;
    }
    lanesSlider.set(8);
    memSlider.set(8);
    apply();
    const cancel = flow.hintAfter(14000, `Memory is maxed out for a tiny handful of lanes. Either raise LANES to use that supply, or lower MEMORY STACKS to match the demand — aim for both bars looking similar in size.`);
    await waitFor(() => {
      const r = apply();
      const idle = r.supply - r.demand;
      return r.util >= 0.9 && idle <= 0.15;
    }, { hold: 500 });
    cancel();
    return { lanes: lanesSlider.value, mem: memSlider.value };
  });

  guide.aha(`The fastest math in the world is worthless if the numbers arrive late. <b>Half of GPU design is plumbing</b> — moving numbers, not computing them. Keep that thought: half of data-centre design, one floor up, is the exact same problem.`);

  // the leitmotif stamp — second of three appearances (§4.6)
  makeMotto(svg);

  await guide.next();
}
