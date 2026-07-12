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
      guide.say(`This is <b>pure silicon</b> — refined from ordinary sand, frozen into a perfect crystal. Look closely at the bonds: each one holds a <b>pair of electrons</b>, one contributed by each neighbour. Four bonds per atom, every electron accounted for. <em>Tap an atom</em> — its bond electrons strain and settle back. They are locked. Nothing is free to move, so nothing can carry a current.`);
      await guide.next();
      guide.say(`Your aim in this step: turn this dead crystal into something that carries current, by swapping a few silicon atoms for a different element — deliberately, atom by atom. Adding foreign atoms on purpose is called <b>doping</b>, and the foreign atom is a <b>dopant</b>. It comes in two flavors. Choose one:`);
    } else {
      guide.say(`A fresh crystal on the bench — every bond full, every electron locked, exactly where we started. Same trick, other flavor:`);
    }

    /* ---------- choose dopant ---------- */
    const choice = await guide.choose([
      { label: 'Make N-type — add phosphorus', value: 'N', hint: 'phosphorus brings five outer electrons — one too many' },
      { label: 'Make P-type — add boron', value: 'P', hint: 'boron brings three — one bond will come up short' },
    ]);

    /* ---------- hands-on doping (recorded as the list of clicked atoms) ---------- */
    guide.say(choice === 'N'
      ? `<span class="e-blue"><b>Phosphorus</b></span> it is. The dashed atoms are up for replacement — <em>click any 3</em>. Watch what each newcomer does with its five electrons.`
      : `<span class="e-red"><b>Boron</b></span> it is. The dashed atoms are up for replacement — <em>click any 3</em>. Watch what happens when an atom shows up one electron short.`);

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
      ? `Count with me: phosphorus arrived carrying <b>five</b> outer electrons. Four snapped into the four bonds — and the fifth had <em>no bond left to join</em>. There it goes: a <span class="e-blue"><b>free electron</b></span>, roaming the crystal. Compare it with the little pairs sleeping in the bonds — yours is bigger, bluer, and it moves. You've made <b>N-type silicon</b>.`
      : `Count with me: boron arrived carrying only <b>three</b> outer electrons. Three bonds filled — and the fourth was left with a single electron and an empty seat: a <span class="e-red"><b>hole</b></span> (the red ring). Keep watching it. Every second or so, an electron from a <em>neighbouring</em> bond hops into the empty seat — so the hole itself wanders through the crystal like a positive charge. You've made <b>P-type silicon</b>.`);
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
      ? `Talk is cheap — let's push on those carriers. Your crystal is wired to a battery and an indicator lamp. Yesterday, this exact circuit would have done <b>nothing</b>.`
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
        ? `<b>It conducts.</b> The lamp is lit because the free electrons <em>you</em> placed are drifting through the crystal.`
        : `<b>It conducts.</b> Inside the crystal it's the <em>holes</em> that wander — electrons hopping seat to seat — while ordinary electrons carry the current through the metal wire.`,
      `Silicon didn't change its mind — you gave it carriers. That's doping: the first tool of every chipmaker.`);

    /* ---------- electron flow vs conventional current (once) ---------- */
    if (!shownConvention){
      shownConvention = true;
      await guide.next();
      guide.say(`One note before we go further. Those blue dots are <b>electron flow</b> — the thing that's physically moving. But circuits are traditionally described by <b>conventional current</b>, which — thanks to a guess made centuries before anyone saw an electron — points the <em>opposite</em> way: out of the battery's <b>+</b>, around, and into <b>−</b>.`);
      await guide.button('Switch to conventional current ▸');
      eFlow.setSpeed(0);
      iFlow.setSpeed(-120);
      SFX.blip();
      guide.say(`Same physics, opposite arrows — the ink chevrons now show <b>current</b>. <em>From here on, every circuit in this course shows conventional current</em>, exactly like every real schematic you'll ever meet. When it matters, we'll remind you the electrons are secretly going the other way.`);
    } else {
      await guide.next();
      eFlow.setSpeed(0);
      iFlow.setSpeed(-120);
      guide.note(`Arrows show conventional current, as agreed — the electrons underneath run the other way.`);
    }
    await guide.next();

    /* ---------- try the other flavor? ---------- */
    if (pass === 0){
      guide.say(`You'll need <b>both flavors</b> of silicon before this act is over — and a doped crystal can't simply be re-doped with the opposite element and behave the same. Chipmakers grow it fresh.`);
      const again = await guide.choose([
        { label: 'Melt it down — try the other flavor ↺', value: 'again', hint: 'fresh crystal, other dopant. Recommended.' },
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
