// STEP 1 — Build your own P/N semiconductor.
// Reference implementation of the flow.ask() replay contract — read before writing steps 2–4.
// Physics per DESIGN.md §4: bond electron pairs, distinct free carriers, no cross-doping
// (reset & retry the other flavor instead), electron-flow → conventional-current beat.
import { svgEl, sleep, rand, RM } from '../engine/util.js';
import { SFX } from '../engine/sfx.js';
import { guide } from '../engine/guide.js';
import { flow } from '../engine/flow.js';
import { newStage } from '../engine/stage.js';
import { Field } from '../engine/field.js';
import { PathFlow, CurrentFlow } from '../engine/pathflow.js';
import { buildLattice, wiggleBonds, dopeN, dopeP, setHoleBias, destroyLattice } from '../engine/lattice.js';
import { makeLamp, makeBattery, cornerTicks } from '../engine/components.js';

export async function step1(){
  guide.title('STEP 1 / 4 · NANOVOLT SEMICONDUCTORS', 'Build your own <em>P/N semiconductor</em>');

  let pass = 0;           // 0 = first crystal, 1 = retry with the other flavor
  let shownConvention = false;

  while (true){
    /* ---------- fresh bench ---------- */
    const { svg } = newStage('01', 'Silicon crystal lattice');
    const lat = buildLattice(svg, { cy: 202 });
    const field = new Field(svg);
    svg.appendChild(field.layer);

    let mode = 'wiggle';
    let onDopeClick = null;
    lat.atoms.forEach(a => {
      const fire = () => {
        if (mode === 'wiggle'){ wiggleBonds(a); SFX.click(); }
        else if (mode === 'dope' && a.type === 'Si' && onDopeClick) onDopeClick(a);
      };
      a.pos.addEventListener('click', fire);
      a.pos.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fire(); } });
    });

    if (pass === 0){
      guide.say(`Pure silicon, refined from sand. Every atom holds four bonds, every bond holds two electrons. <em>Tap an atom.</em> The bonds strain and settle back.`);
      await guide.next();
      guide.say(`Nothing came loose. With no electron free to move, this crystal cannot carry current, which makes it useless as a switch.
        <b>Your goal: make it conduct.</b> You'll do it by swapping a few silicon atoms for a different element. Pick which:`);
    } else {
      guide.say(`Fresh crystal, every bond full again. Same move, other element:`);
    }

    /* ---------- choose dopant ---------- */
    const choice = await guide.choose([
      { label: 'Make N-type, add phosphorus', value: 'N', hint: 'five outer electrons, one too many' },
      { label: 'Make P-type, add boron', value: 'P', hint: 'three outer electrons, one bond short' },
    ]);

    /* ---------- hands-on doping (recorded as the list of clicked atoms) ---------- */
    guide.say(choice === 'N'
      ? `<span class="e-blue"><b>Phosphorus.</b></span> It brings five outer electrons, and there are only four bonds waiting. <em>Click any 3 dashed atoms</em> and watch where the spare goes.`
      : `<span class="e-red"><b>Boron.</b></span> It brings three outer electrons, and there are four bonds to fill. <em>Click any 3 dashed atoms</em> and watch what the missing one leaves behind.`);

    await flow.ask(async replay => {
      const dope = a => (choice === 'N' ? dopeN(lat, a, field) : dopeP(lat, a));
      if (replay !== undefined){
        for (const idx of replay) await dope(lat.atoms[idx]);
        return replay;
      }
      lat.atoms.forEach(a => { if (a.type === 'Si') a.pos.classList.add('dopable-hint', choice === 'P' ? 'p-hint' : 'n-hint'); });
      mode = 'dope';
      const picked = [];
      await new Promise(res => {
        onDopeClick = async a => {
          a.pos.classList.remove('dopable-hint', 'p-hint', 'n-hint');
          picked.push(a.idx);
          await dope(a);
          if (picked.length >= 3){
            mode = 'off';
            lat.atoms.forEach(x => x.pos.classList.remove('dopable-hint', 'p-hint', 'n-hint'));
            res();
          }
        };
      });
      return picked;
    });

    guide.say(choice === 'N'
      ? `Four of the five electrons took the four bonds. The fifth had nowhere to go, so it roams. That loose <span class="e-blue"><b>free electron</b></span> is a carrier, and you now have <b>N-type silicon</b>.`
      : `Three bonds filled, and the fourth came up one electron short. That empty seat is a <span class="e-red"><b>hole</b></span>. Keep watching it: an electron from a neighbouring bond keeps hopping in, so the empty seat itself drifts across the crystal. A moving hole carries charge just like a moving electron, and you now have <b>P-type silicon</b>.`);
    await guide.next();

    /* ---------- wire it up: the crystal sits IN SERIES in the loop ----------
       The wire enters the crystal's LEFT edge and leaves its RIGHT edge, so the
       current has to pass THROUGH the silicon — the crystal is a component, not
       something the wire runs behind. The flow route below stays continuous across
       the crystal so the carriers visibly cross it. */
    const wirePath = 'M318 402 H76 V202 H644 V402 H402';   // full loop (invisible flow route)
    const wireL = svgEl('path', { d: 'M318 402 H76 V202 H184', class: 'wire' });
    const wireR = svgEl('path', { d: 'M536 202 H644 V402 H402', class: 'wire' });
    svg.insertBefore(wireL, lat.g);
    svg.insertBefore(wireR, lat.g);
    // contact terminals where the wire meets the two faces of the crystal
    svg.insertBefore(svgEl('circle', { cx: 184, cy: 202, r: 3.4, class: 'node-dot' }), lat.g);
    svg.insertBefore(svgEl('circle', { cx: 536, cy: 202, r: 3.4, class: 'node-dot' }), lat.g);
    makeBattery(svg, 360, 402);
    const lamp = makeLamp(svg, 644, 300, { label: 'indicator' });
    const flowLayer = svgEl('g'); svg.appendChild(flowLayer);
    const route = svgEl('path', { d: wirePath, fill: 'none', stroke: 'none' });
    svg.appendChild(route);
    const eFlow = new PathFlow(route, { n: 14, layer: flowLayer });        // physical electrons (blue dots)
    const iFlow = new CurrentFlow(route, { n: 12, layer: flowLayer });     // conventional current (chevrons)

    guide.say(pass === 0
      ? `Battery, lamp, your crystal wired in between. Before you doped it, this exact circuit did <b>nothing</b>.`
      : `Same bench test. Battery, lamp, your freshly doped crystal.`);
    await guide.button('Send current ⚡');

    SFX.flow();
    if (choice === 'N') field.setDrift(65);
    else setHoleBias(lat, -1);
    eFlow.setSpeed(130);
    lamp.set(1);
    await sleep(1000);

    guide.aha(
      choice === 'N'
        ? `<b>It conducts.</b> The lamp is lit by the free electrons you placed, drifting through the crystal.`
        : `<b>It conducts.</b> Inside the crystal the holes wander, electrons hopping seat to seat. In the metal wire, ordinary electrons carry the current.`,
      `Silicon did not change. You gave it carriers. That is doping, the first tool of every chipmaker.`);

    /* ---------- electron flow vs conventional current (once) ---------- */
    if (!shownConvention){
      shownConvention = true;
      await guide.next();
      guide.say(`Those blue dots are the electrons, the thing physically moving. Schematics are drawn the other way round, using <b>conventional current</b>: out of the battery's <b>+</b> and back into <b>−</b>. It comes from a guess made before anyone knew electrons existed, and it stuck.`);
      await guide.button('Switch to conventional current ▸');
      eFlow.setSpeed(0);
      iFlow.setSpeed(-120);
      SFX.blip();
      guide.say(`Same physics, opposite arrows. Every circuit from here shows conventional current, like every real schematic. When it matters, we'll remind you the electrons run the other way.`);
    } else {
      await guide.next();
      eFlow.setSpeed(0);
      iFlow.setSpeed(-120);
      guide.note(`Arrows show conventional current, as agreed — the electrons underneath run the other way.`);
    }
    await guide.next();

    /* ---------- try the other flavor? ---------- */
    if (pass === 0){
      guide.say(`You'll need <b>both kinds</b> of silicon before this act is over. A doped crystal can't be re-doped with the opposite element and behave the same way, so chipmakers grow a fresh one.`);
      const again = await guide.choose([
        { label: 'Melt it down, try the other flavor ↺', value: 'again', hint: 'fresh crystal, other dopant. Recommended.' },
        { label: 'Move on with this wafer ▸', value: 'continue', hint: 'you can always come back' },
      ]);
      if (again === 'again'){
        pass = 1;
        destroyLattice(lat);
        continue;
      }
    }
    break;
  }
}
