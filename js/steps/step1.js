// ACT 1 · STEP 1 — "Make silicon conduct".
// Rebuilt to the micro-learning contract in DESIGN_MAKEOVER.md §2 and the script in
// ACT1_MAKEOVER.md §3: one card at a time (guide.cards), every card focuses and names
// the one thing it is about, the chosen element gets a labelled specimen card before any
// doping happens, the carrier is named on its own card with it highlighted, and the
// conventional-current beat is split into cards instead of one paragraph.
// Physics per DESIGN.md §4: bond electrons in pairs, holes as vacancy rings, one dopant
// per crystal (the second element gets a fresh crystal), electron flow first and
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
import { makeLamp, makeBattery, slideInPanel } from '../engine/components.js';
import { circuitBasic } from '../engine/labcircuits.js';

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

/* ---------- how it looks in real life (HANDOFF_NEXT.md §1) ----------
   The doped silicon the player made, as it is bought and used: a polished 300 mm wafer, seen
   at a slant so its mirror finish reads, and a solar cell from above with its silver
   contact lines, beside the panel it comes from. The cell is drawn near-black rather than
   blue, because blue means electrons and N-type on this stage (DESIGN.md §1a). */
function realLifeHTML(){
  const W = { cx: 186, cy: 236, rx: 140, ry: 64 };
  const wafer = `<g data-k="wafer">
    <ellipse cx="${W.cx}" cy="${W.cy + 4}" rx="${W.rx}" ry="${W.ry}" fill="#9c9f99"/>
    <ellipse cx="${W.cx}" cy="${W.cy}" rx="${W.rx}" ry="${W.ry}" fill="url(#rlWafer)" stroke="#7d807a" stroke-width="1"/>
    <path d="M${W.cx - 90} ${W.cy - 30} Q${W.cx - 20} ${W.cy - 52} ${W.cx + 60} ${W.cy - 40}" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".35"/>
    <path d="M${W.cx - 40} ${W.cy + 34} Q${W.cx + 30} ${W.cy + 30} ${W.cx + 100} ${W.cy + 8}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".25"/>
    <path d="M${W.cx - 5} ${W.cy + W.ry - .5} l5 -5 l5 5" fill="#f2ecdc" stroke="#7d807a" stroke-width="1"/>
    <path d="M${W.cx - W.rx} ${W.cy - W.ry - 22} V${W.cy - W.ry - 14} M${W.cx + W.rx} ${W.cy - W.ry - 22} V${W.cy - W.ry - 14} M${W.cx - W.rx} ${W.cy - W.ry - 18} H${W.cx + W.rx}" fill="none" stroke="var(--ink-soft)" stroke-width="1"/>
    <text x="${W.cx}" y="${W.cy - W.ry - 26}" class="lbl" style="fill:var(--ink)">300 MM</text>
    <text x="${W.cx + 24}" y="${W.cy + W.ry + 24}" class="lbl-faint" font-size="8" text-anchor="start">NOTCH</text>
    <line x1="${W.cx + 2}" y1="${W.cy + W.ry + 2}" x2="${W.cx + 20}" y2="${W.cy + W.ry + 20}" stroke="var(--ink-soft)" stroke-width=".8"/>
    <text x="${W.cx}" y="${W.cy + W.ry + 64}" class="lbl-faint">A POLISHED SILICON WAFER, LESS THAN 1 MM THICK</text></g>`;
  /* the cell: a pseudo-square (a square with its corners clipped, because it is cut from a
     round ingot), thin vertical fingers, and five busbars across them */
  const C = { x: 384, y: 132, s: 196, cut: 26 };
  const cellPath = `M${C.x + C.cut} ${C.y} H${C.x + C.s - C.cut} L${C.x + C.s} ${C.y + C.cut} V${C.y + C.s - C.cut} L${C.x + C.s - C.cut} ${C.y + C.s} H${C.x + C.cut} L${C.x} ${C.y + C.s - C.cut} V${C.y + C.cut} Z`;
  let fingers = '';
  for (let x = C.x + 4; x < C.x + C.s - 2; x += 5) fingers += `M${x} ${C.y + 2} V${C.y + C.s - 2} `;
  let bus = '';
  for (let i = 0; i < 5; i++){ const y = C.y + C.s * (i + .5) / 5; bus += `<rect x="${C.x + 2}" y="${y - 1.4}" width="${C.s - 4}" height="2.8" fill="#d9dad4"/>`; }
  let panel = '';
  const P = { x: 618, y: 140, c: 11, cols: 6, rows: 10 };
  for (let i = 0; i < P.cols; i++) for (let j = 0; j < P.rows; j++)
    panel += `<rect x="${P.x + i * (P.c + 1)}" y="${P.y + j * (P.c + 1)}" width="${P.c}" height="${P.c}" rx="1" fill="#262c3a"/>`;
  const solar = `<g data-k="solar">
    <defs><clipPath id="rlCell"><path d="${cellPath}"/></clipPath></defs>
    <path d="${cellPath}" fill="#262c3a" stroke="#4a5060" stroke-width="1"/>
    <g clip-path="url(#rlCell)"><path d="${fingers}" stroke="#c9cbc6" stroke-width=".6" opacity=".55"/>${bus}</g>
    <rect x="${P.x - 4}" y="${P.y - 4}" width="${P.cols * (P.c + 1) + 7}" height="${P.rows * (P.c + 1) + 7}" rx="2" fill="none" stroke="#9c9f99" stroke-width="2"/>
    ${panel}
    <rect x="${P.x - 1}" y="${P.y - 1}" width="${P.c + 2}" height="${P.c + 2}" fill="none" stroke="var(--ink)" stroke-width="1.4"/>
    <path d="M${P.x - 2} ${P.y + 6} Q${P.x - 20} ${P.y + 10} ${C.x + C.s + 4} ${C.y + 30}" fill="none" stroke="var(--ink-soft)" stroke-width=".9" stroke-dasharray="3 3"/>
    <text x="${P.x + 36}" y="${P.y + P.rows * (P.c + 1) + 20}" class="lbl-faint" font-size="8">A PANEL</text>
    <text x="${C.x + C.s / 2}" y="${C.y + C.s + 26}" class="lbl-faint">ONE SOLAR CELL, ABOUT 18 CM ACROSS</text></g>`;
  return `
    <defs><linearGradient id="rlWafer" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#d9dcd8"/><stop offset=".35" stop-color="#aeb3b0"/>
      <stop offset=".55" stop-color="#e4e6e2"/><stop offset="1" stop-color="#8f9490"/>
    </linearGradient></defs>
    <text x="186" y="70" class="lbl" style="fill:var(--ink)">HOW A CHIPMAKER BUYS IT</text>
    <text x="520" y="70" class="lbl" style="fill:var(--ink)">IN A SOLAR PANEL</text>
    <line x1="360" y1="54" x2="360" y2="400" stroke="var(--hairline)" stroke-dasharray="3 4"/>
    ${wafer}${solar}
    <text x="360" y="448" class="lbl-faint">DOPED SILICON, AS IT LOOKS IN REAL LIFE</text>`;
}

async function realLife(svg){
  const real = slideInPanel(svg, realLifeHTML(), { lab: true });
  real.focus('wafer');
  await real.show();
  guide.lab(`This is the silicon you have been doping, as a chipmaker buys it: a polished disc
    called a <b>wafer</b>, 300 mm across and less than 1 mm thick. It comes lightly doped,
    most often P-type, with boron.`, { intro: true });
  await guide.next();

  real.focus('solar');
  // Course restructure (2026-10-25): the pointer to step 2 is gone; step 2 never returns to solar
  guide.lab(`Solar panels are made of the same doped silicon. Each cell is a square about 18 cm
    across, doped one type all through, with a thin layer of the other type on top.`);
  await guide.next();

  /* the test circuit on a breadboard, where ground is named */
  const board = slideInPanel(svg, circuitBasic(), { lab: true });
  await real.swapTo(board);      // N-053: no flash of the stage between panels
  guide.lab(`In a lab, your battery-and-lamp test is built on a <b>breadboard</b>. The bench
    supply's + lead goes to the rail marked +, and its 0 V lead goes to the − rail, called
    <b>ground</b>.`);
  await guide.next();

  guide.lab(`Ground is the 0 V that every other voltage is measured from. Current leaves the +
    rail, passes through a resistor, which keeps it small, and a small light called an LED,
    then returns to ground.`);
  await guide.next();
  await board.hide();
}

export async function step1(){
  guide.title('STEP 1 / 5', 'How do you make sand <em>conduct electricity?</em>');
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
      /* ---------- what you are building, and why you are starting at sand ----------
         The Nanovolt company story is gone (REVIEW_NOTES N-005): these two cards now say
         only what the course builds and why it starts at the bottom. They run on pass 0
         only: the retry after melting the crystal down does not replay them. No focus on
         either one, deliberately. Nothing on the stage has been named yet. */
      guide.story(`Your goal is to build your own data centre: a building full of computers,
        the kind that trains AI models.`);
      await guide.next();

      guide.story(`You could buy the machines when the day comes. You would rather know what
        is inside them, so you are building every layer yourself, starting at sand.`);
      await guide.next();

      // Course restructure (2026-10-25): the scale this act works at, before the lattice
      guide.story(`Every computer in that building runs on chips, and one AI chip, such as
        NVIDIA's H100, holds about 80 billion tiny switches. This act builds one of those
        switches, starting from silicon.`);
      await guide.next();

      /* ---------- what silicon is ---------- */
      guide.say(`This is a zoomed-in silicon crystal lattice, refined from sand. By the end
        of this step, you will learn how to drive a current through it.`);
      stage.focus(lat.g, { label: 'silicon lattice', at: 'top' });
      await guide.next();

      guide.say(`Every silicon atom holds four bonds, one to each neighbour. The whole
        crystal is that one pattern, repeated.`);
      stage.focus([hero.pos, ...heroBonds], { label: 'four bonds', at: 'top' });
      await guide.next();

      guide.say(`Each bond is a pair of electrons, one contributed by each atom. Both
        electrons stay locked in the bond.`);
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

      guide.say(`When you tapped it, the bond electrons wobbled and settled back where they
        were. None of them came loose.`);
      stage.focus([hero.pos, ...heroBonds], { label: 'still four full bonds', at: 'top' });
      await guide.next();

      /* ---------- the aim (DESIGN_MAKEOVER.md §2 rule 7) ---------- */
      guide.say(`Because every electron is locked in a bond, nothing can move, so nothing
        can carry a current. <b>Your goal is to make it conduct electricity.</b>`);
      stage.focus(lat.g, { label: 'no free electrons', at: 'top' });
      await guide.next();

      guide.say(`To do that, we dope the crystal (swap a few silicon atoms for a different
        element, such as phosphorus or boron, which bring extra electrons or holes). Pick
        one:`);
    } else {
      guide.say(`Here is a fresh crystal, with every bond full again. Now dope it with the
        other element:`);
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
      guide.say(`Phosphorus has five outer electrons. Four of them fill the four bonds, but
        the fifth has no bond to sit in, so it is free to move. This loose electron is
        called a <span class="e-blue"><b>free electron</b></span>.`);
      stage.focus(field.parts[0]?.c || field.layer, { label: 'free electron', at: 'top' });
      await guide.next();
      Anim.add(field.ticker);
    } else {
      const held = lat.vacancies.splice(0);
      held.forEach(v => v.ring.classList.remove('pop-in'));
      guide.say(`Boron has only three outer electrons, so three bonds are filled and the
        fourth is one electron short. This missing electron is drawn as a red ring and is
        called a <span class="e-red"><b>hole</b></span>.`);
      stage.focus(held[0]?.ring, { label: 'hole', at: 'top' });
      await guide.next();
      lat.vacancies.push(...held);

      // no scrim here: the thing to watch is an ordinary bond electron sliding into the
      // ring, and dimming the lattice would hide it
      guide.say(`When an electron from a neighbouring bond hops into the hole, the bond it
        came from becomes the new hole. So the hole itself appears to move.`);
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

    // Course restructure (2026-10-25): the battery and contacts are explained on the first
    // crystal only; the second pass goes straight to the test
    if (pass === 0){
      guide.say(`A battery pushes electrons out of its <b>−</b> terminal and pulls them back
        in at <b>+</b>.`);
      stage.focus(batt, { label: 'battery', at: 'bottom' });
      await guide.next();

      guide.say(`The wires connect to the left and right faces of the crystal, so any current
        has to pass through the silicon to reach the lamp.`);
      stage.focus([wireL, wireR, contactL, contactR], { label: 'contacts', at: 'bottom' });
      await guide.next();
    }

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

    // Course restructure (2026-10-25): "semiconductor" named once, on the first crystal
    // that conducts (whichever element was picked first)
    if (pass === 0){
      guide.say(`Pure silicon barely conducts, and a few atoms of the right element make it
        conduct. A material like this is called a <b>semiconductor</b>. This is what people
        mean when they say chips are made of semiconductors.`);
      stage.focus(choice === 'N' ? [lat.g, field.layer] : lat.g,
        { label: 'semiconductor', at: 'top' });
      await guide.next();
    }

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
      // Course restructure (2026-10-25): three convention cards merged into two
      guide.say(`Electric current was described before electrons were discovered, and people
        drew it flowing from <b>+</b> to <b>−</b>. These arrows show that direction, called
        <b>conventional current</b>.`);
      stage.focus(iLayer, { label: 'conventional current', at: 'bottom', ring: false });
      await guide.next();

      guide.say(`The electrons really flow from <b>−</b> to <b>+</b>, but the drawing
        convention never changed. Every circuit from here on uses these <b>+</b> to <b>−</b>
        arrows, as real schematics do.`);
      stage.focus(iLayer, { label: 'conventional current', at: 'bottom', ring: false });
      await guide.next();
    } else {
      // Course restructure (2026-10-25): the reminder card is cut; the arrows still switch
      eFlow.setSpeed(0);
      iFlow.setSpeed(-120);
    }

    /* ---------- grow a fresh crystal and run the other element? ---------- */
    if (pass === 0){
      stage.clearFocus();
      // Course restructure (2026-10-25): the old "cannot be re-doped" claim was wrong (step 4
      // dopes N patches into P); the fresh crystal is only so each element is seen alone
      guide.say(`You will need both kinds of silicon later in this act. The next crystal is
        a fresh one, so you can see the other element on its own.`);
      const again = await guide.choose([
        { label: 'Start a fresh crystal with the other element ↺', value: 'again', hint: 'fresh crystal, other dopant. Recommended.' },
        { label: 'Move on with this wafer ▸', value: 'continue', hint: 'you can always come back' },
      ]);
      if (again === 'again'){
        pass = 1;
        stage.clearFocus();
        destroyLattice(lat);
        continue;
      }
    }
    stage.clearFocus();
    await realLife(svg);
    break;
  }
}
