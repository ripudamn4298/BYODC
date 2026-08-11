// ACT 1 · STEP 1 — "Make silicon conduct".
// Rebuilt to the micro-learning contract in DESIGN_MAKEOVER.md §2 and the script in
// ACT1_MAKEOVER.md §3: one card at a time (guide.cards), every card focuses and names
// the one thing it is about, the chosen element gets a labelled specimen card before any
// doping happens, the carrier is named on its own card with it highlighted, and the
// conventional-current beat is split into cards instead of one paragraph.
// Physics per DESIGN.md §4: bond electrons in pairs, holes as vacancy rings, no
// cross-doping (melt it down and grow a fresh crystal instead), electron flow first and
// conventional-current chevrons from the end of this step onward.
import { svgEl, sleep } from '../engine/util.js';
import { Anim } from '../engine/anim.js';
import { SFX } from '../engine/sfx.js';
import { guide } from '../engine/guide.js';
import { flow } from '../engine/flow.js';
import { newStage } from '../engine/stage.js';
import { Field } from '../engine/field.js';
import { PathFlow, CurrentFlow } from '../engine/pathflow.js';
import { buildLattice, wiggleBonds, dopeN, dopeP, setHoleBias, destroyLattice } from '../engine/lattice.js';
import { makeLamp, makeBattery } from '../engine/components.js';

const HERO = 7;            // atom (row 1, col 2) — interior, so all four bonds are real

/* the dopant on its own, drawn with its outer electrons, so the card that names the
   element has something on the stage to point at (ACT1_MAKEOVER.md §3 step 1, card 5) */
function makeSpecimen(svg, choice){
  const cx = 630, cy = 122, n = choice === 'N' ? 5 : 3;
  const g = svgEl('g', { class: 'atom ' + (choice === 'N' ? 'doped-n' : 'doped-p') });
  for (let k = 0; k < n; k++){
    const a = -Math.PI / 2 + k * 2 * Math.PI / n;
    g.appendChild(svgEl('circle', {
      cx: cx + Math.cos(a) * 30, cy: cy + Math.sin(a) * 30, r: 2.8, class: 'bond-e',
    }));
  }
  g.appendChild(svgEl('circle', { cx, cy, r: 16, class: 'atom-c' }));
  const t = svgEl('text', { x: cx, y: cy + 4, class: 'atom-t' });
  t.textContent = choice === 'N' ? 'P' : 'B';
  g.appendChild(t);
  const cap = svgEl('text', { x: cx, y: cy + 50, class: 'lbl-faint' });
  cap.textContent = `${n} OUTER ELECTRONS`;
  g.appendChild(cap);
  svg.appendChild(g);
  return g;
}

async function fadeIn(nodes, dur = 320){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  list.forEach(n => { n.style.opacity = '0'; });
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(p); }));
  list.forEach(n => { n.style.opacity = ''; });
}

export async function step1(){
  guide.title('STEP 1 / 5 · NANOVOLT SEMICONDUCTORS', 'Make silicon <em>conduct</em>');
  guide.cards();

  let pass = 0;               // 0 = first crystal, 1 = the retry with the other element
  let shownConvention = false;

  while (true){
    /* ---------- fresh bench ---------- */
    const stage = newStage('01', 'Silicon crystal lattice');
    const { svg } = stage;
    const lat = buildLattice(svg, { cy: 202 });
    const field = new Field(svg);

    const hero = lat.atoms[HERO];
    const heroBonds = hero.bonds.flatMap(b => [b.line, b.e[0].el, b.e[1].el]);
    const oneBond = hero.bonds.find(b => !b.edge && Math.abs(b.my - hero.y) < 1 && b.mx > hero.x)
      || hero.bonds[0];
    const oneBondNodes = [oneBond.line, oneBond.e[0].el, oneBond.e[1].el];

    let mode = 'off';
    let onTap = null, onDopeClick = null;
    lat.atoms.forEach(a => {
      const fire = () => {
        if (mode === 'tap'){ wiggleBonds(a); SFX.click(); if (onTap) onTap(); }
        else if (mode === 'dope' && a.type === 'Si' && onDopeClick) onDopeClick(a);
      };
      a.pos.addEventListener('click', fire);
      a.pos.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); fire(); }
      });
    });

    if (pass === 0){
      /* ---------- who you are, and why you are starting at sand ----------
         The act used to open on the silicon lattice with "NANOVOLT SEMICONDUCTORS" in the
         eyebrow and no explanation of who that was. These two cards introduce the company
         and the reason for building from the bottom, so the venture cards that follow every
         step land as your company rather than a name that arrived out of nowhere. They run
         on pass 0 only: the retry after melting the crystal down does not replay the story.
         No focus on either one, deliberately. Nothing on the stage has been named yet. */
      guide.story(`You run Nanovolt: nine people, a rented unit in Penang, and a plan to
        build your own data centre.`);
      await guide.next();

      guide.story(`You could buy the machines when the day comes. You would rather know what
        is inside them, so you are building every layer yourself, starting at sand.`);
      await guide.next();

      /* ---------- what silicon is ---------- */
      guide.say(`This is silicon, refined from sand. By the end of this step it will carry
        a current.`);
      stage.focus(lat.g, { label: 'silicon lattice', at: 'top' });
      await guide.next();

      guide.say(`Every silicon atom holds four bonds, one to each neighbour. The whole
        crystal is that one pattern, repeated.`);
      stage.focus([hero.pos, ...heroBonds], { label: 'four bonds', at: 'top' });
      await guide.next();

      guide.say(`Each bond is a pair of electrons, one given by each atom. Both sit in the
        bond and stay there.`);
      stage.focus(oneBondNodes, { label: 'one bond, two electrons', at: 'top' });
      await guide.next();

      /* ---------- tap it: the bonds strain and settle ---------- */
      guide.say(`<b>Tap this atom.</b> Watch what its bond electrons do.`);
      stage.focus(hero.pos, { label: 'silicon atom', at: 'left' });
      mode = 'tap';
      await flow.ask(async replay => {
        if (replay !== undefined) return true;
        await new Promise(res => { onTap = res; });
        return true;
      });
      mode = 'off'; onTap = null;

      guide.say(`The bond electrons strained and settled back where they started. Nothing
        came loose.`);
      stage.focus([hero.pos, ...heroBonds], { label: 'still four full bonds', at: 'top' });
      await guide.next();

      /* ---------- the aim (DESIGN_MAKEOVER.md §2 rule 7) ---------- */
      guide.say(`With every electron locked in a bond, nothing can move, so nothing can
        carry a current. <b>Your goal: make it conduct.</b>`);
      stage.focus(lat.g, { label: 'no free electrons', at: 'top' });
      await guide.next();

      guide.say(`To do that, swap a few of the silicon atoms for a different element.
        Pick one:`);
    } else {
      guide.say(`A fresh crystal, every bond full again. Same move, the other element:`);
    }

    /* ---------- choose the element ---------- */
    stage.focus(lat.g, { label: 'pure silicon', at: 'top' });
    const choice = await guide.choose([
      { label: 'Add phosphorus', value: 'N', hint: 'five outer electrons, one too many' },
      { label: 'Add boron', value: 'P', hint: 'three outer electrons, one bond short' },
    ]);

    /* ---------- the element, named and drawn, before any doping ---------- */
    const specimen = makeSpecimen(svg, choice);
    await fadeIn([specimen]);
    guide.say(choice === 'N'
      ? `Phosphorus brings five outer electrons. A silicon site has four bonds waiting, so
         one of those electrons has nowhere to go.`
      : `Boron brings three outer electrons. A silicon site has four bonds to fill, so one
         bond will be left short.`);
    stage.focus(specimen, { label: choice === 'N' ? 'phosphorus' : 'boron', at: 'left' });
    await guide.next();

    /* ---------- hands-on doping (recorded as the list of clicked atoms) ---------- */
    stage.clearFocus();
    guide.say(choice === 'N'
      ? `<b>Click any three dashed atoms.</b> Each click swaps a silicon for a phosphorus.
         Watch where the fifth electron goes.`
      : `<b>Click any three dashed atoms.</b> Each click swaps a silicon for a boron. Watch
         what the missing electron leaves behind.`);

    await flow.ask(async replay => {
      const dope = a => (choice === 'N' ? dopeN(lat, a, field) : dopeP(lat, a));
      if (replay !== undefined){
        for (const idx of replay) await dope(lat.atoms[idx]);
        return replay;
      }
      lat.atoms.forEach(a => {
        if (a.type === 'Si') a.pos.classList.add('dopable-hint', choice === 'P' ? 'p-hint' : 'n-hint');
      });
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
    mode = 'off'; onDopeClick = null;

    /* ---------- name the carrier, with it highlighted ----------
       Both carriers are in constant motion, and stage.focus measures its label box once,
       so the naming card holds the carrier still: the free electrons by lifting the
       Field off the shared ticker, the holes by taking the vacancies out of the lattice's
       hop loop. Both are put back the moment the card is done. */
    if (choice === 'N'){
      Anim.remove(field.ticker);
      // the arrival animation scales the circle about the SVG origin, so a box measured
      // while it is still running lands nowhere near the electron (VERIFY_HARNESS §4a)
      field.parts.forEach(p => p.c.classList.remove('pop-in'));
      guide.say(`Four of the five electrons took the four bonds. The fifth has no bond to
        sit in, so it roams. That loose electron is a <span class="e-blue"><b>free
        electron</b></span>.`);
      stage.focus(field.parts[0]?.c || field.layer, { label: 'free electron', at: 'top' });
      await guide.next();
      Anim.add(field.ticker);
    } else {
      const held = lat.vacancies.splice(0);
      held.forEach(v => v.ring.classList.remove('pop-in'));
      guide.say(`Three bonds filled, and the fourth came up one electron short. That empty
        seat is drawn as a red ring, and it is called a
        <span class="e-red"><b>hole</b></span>.`);
      stage.focus(held[0]?.ring, { label: 'hole', at: 'top' });
      await guide.next();
      lat.vacancies.push(...held);

      // no scrim here: the thing to watch is an ordinary bond electron sliding into the
      // ring, and dimming the lattice would hide it
      guide.say(`An electron from a neighbouring bond keeps hopping into the ring. The bond
        it came from is the empty seat now, so the hole itself moves.`);
      stage.focus(lat.g, { label: 'the hole drifts', at: 'top' });
      await guide.next();
    }

    guide.say(choice === 'N'
      ? `Three phosphorus atoms, three free electrons. Silicon carrying spare electrons is
         called <b>N-type</b>. The N is for negative.`
      : `Three boron atoms, three holes. Silicon carrying holes is called <b>P-type</b>. A
         hole moves the way a positive charge would.`);
    // the free electrons live outside the lattice group, so N keeps them lit as well
    stage.focus(choice === 'N' ? [lat.g, field.layer] : lat.g,
      { label: choice === 'N' ? 'n-type silicon' : 'p-type silicon', at: 'top' });
    await guide.next();

    /* ---------- wire it up: the crystal sits IN SERIES in the loop ----------
       The wire enters the crystal's LEFT edge and leaves its RIGHT edge, so the current
       has to pass THROUGH the silicon. The flow route stays continuous across the crystal
       so the carriers visibly cross it. */
    stage.clearFocus();
    const wirePath = 'M318 402 H76 V202 H644 V402 H402';   // full loop (invisible flow route)
    const wireL = svgEl('path', { d: 'M318 402 H76 V202 H184', class: 'wire' });
    const wireR = svgEl('path', { d: 'M536 202 H644 V402 H402', class: 'wire' });
    const contactL = svgEl('circle', { cx: 184, cy: 202, r: 3.4, class: 'node-dot' });
    const contactR = svgEl('circle', { cx: 536, cy: 202, r: 3.4, class: 'node-dot' });
    [wireL, wireR, contactL, contactR].forEach(n => svg.insertBefore(n, lat.g));
    const batt = makeBattery(svg, 360, 402);
    const lamp = makeLamp(svg, 644, 300, { label: 'indicator' });
    const eLayer = svgEl('g'), iLayer = svgEl('g');
    svg.append(eLayer, iLayer);
    const route = svgEl('path', { d: wirePath, fill: 'none', stroke: 'none' });
    svg.appendChild(route);
    const eFlow = new PathFlow(route, { n: 14, layer: eLayer });      // electrons (blue dots)
    const iFlow = new CurrentFlow(route, { n: 12, layer: iLayer });   // conventional current
    await fadeIn([wireL, wireR, contactL, contactR, batt, lamp.g], 340);

    guide.say(`A battery pushes electrons out of its <b>−</b> terminal and pulls them back
      in at <b>+</b>.`);
    stage.focus(batt, { label: 'battery', at: 'bottom' });
    await guide.next();

    guide.say(`The wires meet the crystal on its left and right faces. Any current has to
      pass through the silicon to reach the lamp.`);
    stage.focus([wireL, wireR, contactL, contactR], { label: 'contacts', at: 'bottom' });
    await guide.next();

    guide.say(pass === 0
      ? `Before you doped it, this circuit did nothing. Send current and watch the lamp.`
      : `Same test as before. Send current.`);
    stage.focus(lamp.g, { label: 'lamp', at: 'left' });
    await guide.button('Send current ⚡');

    stage.clearFocus();
    SFX.flow();
    if (choice === 'N') field.setDrift(65);
    else setHoleBias(lat, -1);
    eFlow.setSpeed(130);
    lamp.set(1);
    await sleep(1000);

    guide.aha(
      choice === 'N'
        ? `<b>It conducts.</b> The lamp is lit by the free electrons you put in the crystal,
           drifting across it toward <b>+</b>.`
        : `<b>It conducts.</b> Inside the crystal the holes drift, with electrons hopping
           from seat to seat. In the metal wires, ordinary electrons carry the current.`,
      `Silicon did not change. You gave it carriers. That is what doping means.`);
    await guide.next();

    /* ---------- electron flow, then the convention (DESIGN.md §4.5) ---------- */
    if (!shownConvention){
      shownConvention = true;
      guide.say(choice === 'N'
        ? `The blue dots are electrons. They are what actually moves, out of the battery's
           <b>−</b> terminal and round to <b>+</b>.`
        : `The blue dots are electrons in the wires. They are what actually moves, out of
           the battery's <b>−</b> terminal and round to <b>+</b>.`);
      stage.focus(eLayer, { label: 'electron flow', at: 'bottom', ring: false });
      await guide.button('Switch to conventional current ▸');

      eFlow.setSpeed(0);
      iFlow.setSpeed(-120);
      SFX.blip();
      guide.say(`Schematics draw the arrows the other way: out of <b>+</b> and back into
        <b>−</b>. The direction was guessed before anyone knew electrons existed, and it
        stuck.`);
      stage.focus(iLayer, { label: 'conventional current', at: 'bottom', ring: false });
      await guide.next();

      guide.say(`Every circuit after this one shows those arrows, like every real schematic.
        When it matters, we will remind you that the electrons run the other way.`);
      stage.focus(iLayer, { label: 'conventional current', at: 'bottom', ring: false });
      await guide.next();
    } else {
      eFlow.setSpeed(0);
      iFlow.setSpeed(-120);
      guide.say(`The arrows are conventional current, as agreed on the first crystal. The
        electrons underneath run the other way.`);
      stage.focus(iLayer, { label: 'conventional current', at: 'bottom', ring: false });
      await guide.next();
    }

    /* ---------- grow a fresh crystal and run the other element? ---------- */
    if (pass === 0){
      stage.clearFocus();
      guide.say(`You need both kinds of silicon later in this act. A doped crystal cannot be
        re-doped with the opposite element, so chipmakers grow a fresh one.`);
      const again = await guide.choose([
        { label: 'Melt it down, run the other element ↺', value: 'again', hint: 'fresh crystal, other dopant. Recommended.' },
        { label: 'Move on with this wafer ▸', value: 'continue', hint: 'you can always come back' },
      ]);
      if (again === 'again'){
        pass = 1;
        stage.clearFocus();
        destroyLattice(lat);
        continue;
      }
    }
    break;
  }
}
