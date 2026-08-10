// ACT 3 · STEP 3 — "How big to cut each chip".
// Rebuilt to the micro-learning contract in DESIGN_MAKEOVER.md §2 and the card script in
// ACT3_MAKEOVER.md §3: one card at a time (guide.cards), wafer and die each defined on
// their own card with the label landing at that moment, dust shown killing one die before
// the whole map is coloured, and the area trade-off drawn at the same scale as the wafer
// rather than asserted in prose. The two-wafer structure and its $70 / $75 targets are
// unchanged: the player has to re-read the number under twice the dust.
//
// Determinism: both defect maps come from mulberry32 seeded with a value recorded through
// flow.ask, so a replay draws exactly the wafer the player saw. Math.random is used only
// to pick that seed, inside the live branch, and never to place anything.
import { waitFor, svgEl, el, slug } from '../../engine/util.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeSeg, cornerTicks } from '../../engine/components.js';
import { makeWaferMap } from '../../engine/fab.js';

const WAFER_COST = 5500;      // fixed $ per wafer, for the $/good-die readout
const TARGET_A = 70;          // clean wafer, 12 specks
const TARGET_B = 75;          // dirty wafer, 24 specks

// Edges of 25 / 35 / 50 stage units on a 165-unit-radius wafer. 25 and 50 are an exact
// 2x, so "twice the edge, four times the area" is literally what is drawn. Whole dies per
// wafer: 113 / 49 / 24 (checked against the tiling in fab.js, not asserted).
const SIZES = [
  { id: 'sm', label: 'small', s: 25 },
  { id: 'md', label: 'medium', s: 35 },
  { id: 'lg', label: 'large', s: 50 },
];

const WX = 200, WY = 240, WR = 165;    // wafer centre and radius
const PX = 424, PR = 690;              // readout panel: left edge, right edge

async function fadeIn(nodes, dur = 320){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  list.forEach(n => { n.style.opacity = '0'; });
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(p); }));
  list.forEach(n => { n.style.opacity = '1'; });
}

export async function step3(){
  guide.title('STEP 3 / 5 · NANOVOLT FAB 3', 'How big to cut <em>each chip</em>');
  guide.cards();

  const stage = newStage('12', 'A wafer cut into dies, with dust killing some of them');
  const { svg, controls } = stage;
  cornerTicks(svg, 30, 68, 348, 348, 8);

  const wafer = makeWaferMap(svg, { cx: WX, cy: WY, r: WR });
  // fab.js builds the wafer as [disc, dieLayer, flat, defectLayer]
  const disc = wafer.g.children[0];
  const dieLayer = wafer.g.children[1];
  const defectLayer = wafer.g.children[3];
  dieLayer.style.opacity = '0';
  defectLayer.style.opacity = '0';

  /* ---------------- counts, read off the dies that are actually drawn -------------- */

  let curSize = SIZES[1];       // the wafer arrives cut at medium
  let revealed = false;         // has the dust been shown killing dies yet

  function counts(){
    let whole = 0, dead = 0, good = 0;
    for (const d of wafer.dies){
      if (d.state === 'edge') continue;
      whole++;
      if (d.state === 'defect') dead++; else good++;
    }
    return { whole, dead, good, cost: good > 0 ? WAFER_COST / good : Infinity };
  }
  const money = c => (Number.isFinite(c) ? '$' + Math.round(c) : '—');
  const named = id => { const l = SIZES.find(s => s.id === id).label; return l[0].toUpperCase() + l.slice(1); };

  /* paint the map: neutral squares until the dust has been introduced */
  function paint(){
    for (const d of wafer.dies){
      if (d.state === 'edge'){ d.rect.setAttribute('class', 'die edge'); continue; }
      d.rect.setAttribute('class', revealed ? 'die ' + d.state : 'die');
    }
  }

  /* ---------------- the readout panel, drawn in the stage so it can be labelled ---- */

  const panel = svgEl('g');
  svg.appendChild(panel);
  function row(y, label){
    const l = svgEl('text', { x: PX, y, class: 'lbl' });
    l.style.textAnchor = 'start';
    l.textContent = label;
    const v = svgEl('text', { x: PR, y, class: 'lbl-strong' });
    v.style.textAnchor = 'end';
    v.textContent = '—';
    const g = svgEl('g');
    g.append(l, v);
    panel.appendChild(g);
    g.style.opacity = '0';
    return { g, v };
  }
  const rWhole = row(118, 'WHOLE DIES');
  const rDead = row(150, 'KILLED BY DUST');
  const rGood = row(182, 'GOOD DIES');
  rDead.v.style.fill = 'var(--red)';
  rGood.v.style.fill = 'var(--blue)';

  const costG = svgEl('g');
  const rule = svgEl('line', { x1: PX, y1: 206, x2: PR, y2: 206, stroke: 'var(--hairline)', 'stroke-width': 1 });
  const costL = svgEl('text', { x: PX, y: 238, class: 'lbl' });
  costL.style.textAnchor = 'start';
  costL.textContent = '$ PER GOOD DIE';
  const costV = svgEl('text', { x: PR, y: 240, class: 'lbl-strong' });
  costV.style.textAnchor = 'end';
  costV.style.fontSize = '18px';
  costV.style.fill = 'var(--amber)';
  costV.textContent = '—';
  const targetL = svgEl('text', { x: PX, y: 266, class: 'lbl-faint' });
  targetL.style.textAnchor = 'start';
  targetL.textContent = '';
  const targetTick = svgEl('text', { x: PR, y: 266, class: 'lbl' });
  targetTick.style.textAnchor = 'end';
  targetTick.style.fill = 'var(--green)';
  targetTick.textContent = '';
  costG.append(rule, costL, costV, targetL, targetTick);
  panel.appendChild(costG);
  costG.style.opacity = '0';

  let target = null;
  function refresh(){
    const c = counts();
    rWhole.v.textContent = String(c.whole);
    rDead.v.textContent = revealed ? String(c.dead) : '—';
    rGood.v.textContent = revealed ? String(c.good) : '—';
    costV.textContent = revealed ? money(c.cost) : '—';
    if (target != null){
      targetL.textContent = `TARGET  $${target} OR LESS`;
      targetTick.textContent = revealed && c.cost <= target ? '✓ UNDER TARGET' : '';
    }
    return c;
  }

  /* ---------------- die size control ---------------- */

  let onSegPick = null;
  const seg = makeSeg(controls, SIZES.map(s => ({ id: s.id, label: s.label.toUpperCase(), value: s.id })), id => {
    setSize(id);
    SFX.blip();
    if (onSegPick) onSegPick();
  });
  seg.set('md');
  const segBtns = [...seg.el.querySelectorAll('button')];
  const segEnabled = on => segBtns.forEach(b => { b.disabled = !on; });
  segEnabled(false);

  function setSize(id){
    const s = SIZES.find(x => x.id === id);
    if (!s) return;
    curSize = s;
    stage.clearFocus();          // tile() rebuilds the die rects; never do that under a focus
    wafer.tile(s.s, s.s);
    paint();
    refresh();
  }

  /* counts for every size against the current defect map. tile() runs synchronously, so
     the intermediate cuts never reach the screen; the player's size is restored before
     the browser paints. */
  function measureAll(){
    const out = {};
    for (const s of SIZES){ wafer.tile(s.s, s.s); out[s.id] = counts(); }
    wafer.tile(curSize.s, curSize.s);
    paint();
    refresh();
    return out;
  }

  /* A card whose recorded answer is the defect-map seed rather than a click. The seed is
     picked, the wafer is drawn, the card is written, and the card's own Next resolves the
     same flow.ask. Recording the seed on a card boundary is what keeps Back honest: one
     press, one card back. An ask with no button of its own would be a Back stop the player
     cannot see. Math.random only picks the seed, and only when not replaying. */
  async function seedCard(draw, makeSeed){
    return flow.ask(async replay => {
      const s = replay !== undefined ? replay : makeSeed();
      await draw(s, replay !== undefined);
      const b = el('button', { class: 'btn primary', 'data-label': slug('Next ▸') }, 'Next ▸');
      guide.beat(el('div', { class: 'btn-row' }), 'actions').appendChild(b);
      if (replay !== undefined){ b.disabled = true; b.classList.add('used'); return s; }
      await new Promise(res => b.addEventListener('click', () => {
        SFX.click(); b.disabled = true; b.classList.add('used'); res();
      }));
      return s;
    });
  }

  /* Pick a seed whose specks kill at least one whole die, so the card that points at a
     dead die always has one to point at. Only the seed that survives the check is
     recorded, so the replay redraws that same map without repeating the search. */
  function killingSeed(count){
    let s = 0;
    for (let i = 0; i < 40; i++){
      s = Math.floor(Math.random() * 1e9);
      wafer.scatter(s, count);
      if (wafer.dies.some(d => d.state === 'defect')) break;
    }
    return s;
  }

  /* a hint that restates the task rather than replacing it with something else, and
     cancels the moment the player touches a size button */
  function hintLater(ms, html){
    if (flow.instant) return () => {};
    let dead = false;
    const ep = flow._epoch;
    const id = setTimeout(() => { if (!dead && ep === flow._epoch) guide.say(html); }, ms);
    return () => { dead = true; clearTimeout(id); };
  }

  /* ============================== CARDS ============================== */

  guide.say(`Now the printed disc gets cut into chips, and you choose how big to cut them.
    Dust landed on it while it printed, and dust kills chips.`);
  stage.focus(disc, { ring: true });
  await guide.next();

  guide.say(`The disc is a <b>wafer</b>, 300 mm across. The pattern you printed with light
    covers all of it.`);
  stage.focus(disc, { label: 'wafer', at: 'top' });
  await guide.next();

  /* --- the grid, then one die --- */
  stage.clearFocus();
  wafer.tile(curSize.s, curSize.s);
  paint();
  await fadeIn([dieLayer], 420);

  const centreDie = () => wafer.dies
    .filter(d => d.state !== 'edge')
    .sort((a, b) => Math.hypot(a.x - WX, a.y - WY) - Math.hypot(b.x - WX, b.y - WY))[0];

  guide.say(`Cut the wafer into a grid. Each square is one chip, and one chip is called a
    <b>die</b>.`);
  stage.focus(centreDie().rect, { label: 'one die', at: 'top' });
  await guide.next();

  const edgeDies = wafer.dies.filter(d => d.state === 'edge');
  const topEdge = edgeDies
    .filter(d => d.y < WY)
    .sort((a, b) => (a.y - b.y) || (Math.abs(a.x - WX) - Math.abs(b.x - WX)))[0] || edgeDies[0];
  const cut0 = counts();

  guide.say(`The wafer is round and the grid is not. ${wafer.dies.length - cut0.whole} of
    these ${wafer.dies.length} squares hang over the edge, so they are scrap.`);
  stage.focus(topEdge.rect, { label: 'edge scrap', at: 'top' });
  await guide.next();

  stage.clearFocus();
  refresh();
  await fadeIn([rWhole.g], 300);

  guide.say(`That leaves ${cut0.whole} whole dies at this size. The count follows whatever
    size you cut.`);
  // the row carries its own mono label, so the ring goes round the number alone
  stage.focus(rWhole.v, { label: 'whole dies', at: 'top' });
  await guide.next();

  /* --- dust --- */
  stage.clearFocus();
  await seedCard(async (s, replaying) => {
    wafer.scatter(s, 12);
    paint();
    refresh();
    if (!replaying) await fadeIn([defectLayer], 380);
    defectLayer.style.opacity = '1';
    guide.say(`The air in a fab is filtered and dust still gets through. Twelve specks
      landed on this wafer, and each one is bigger than the transistors under it.`);
    stage.focus(defectLayer, { label: 'dust', at: 'top', ring: false });
  }, () => killingSeed(12));

  const deadDie = wafer.dies
    .filter(d => d.state === 'defect')
    .sort((a, b) => Math.hypot(a.x - WX, a.y - WY) - Math.hypot(b.x - WX, b.y - WY))[0];
  const dotFor = d => [...defectLayer.querySelectorAll('.defect-dot')].find(c => {
    const x = +c.getAttribute('cx'), y = +c.getAttribute('cy');
    return x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h;
  });

  stage.clearFocus();
  if (deadDie) deadDie.rect.setAttribute('class', 'die defect');

  guide.say(`A speck blocks the light or breaks a wire, so the pattern under it comes out
    wrong. The die it landed in will not work.`);
  // killingSeed guarantees deadDie exists; the fallback only stops a crash if it somehow
  // ran out of attempts and every speck landed on the round edge
  stage.focus(deadDie ? [deadDie.rect, dotFor(deadDie)] : defectLayer,
    { label: 'dead die', at: 'top', ring: !!deadDie });
  await guide.next();

  stage.clearFocus();
  revealed = true;
  paint();
  const cut1 = refresh();
  await fadeIn([rDead.g, rGood.g], 320);

  guide.say(`Every other speck does the same. This wafer lost ${cut1.dead} dies, and
    ${cut1.good} came through.`);
  stage.focus(dieLayer, { label: 'dead in red, good in blue', at: 'top', ring: false });
  await guide.next();

  stage.clearFocus();
  await fadeIn([costG], 320);

  guide.say(`One wafer costs $${WAFER_COST.toLocaleString()} however you cut it. Divide
    that by the dies that work and you get the price of each good one.`);
  stage.focus(costV, { label: 'cost per good die', at: 'top' });
  await guide.next();

  /* --- test A. No focus while the player works: the size buttons live outside the SVG,
     so a scrim would only dim the numbers they need to read. --- */
  stage.clearFocus();
  segEnabled(true);
  target = TARGET_A;
  refresh();

  guide.say(`The three buttons under the stage recut the wafer. <b>Your goal: get the cost
    under $${TARGET_A} per good die.</b> Try each size and read the number.`);

  const pick1 = await flow.ask(async replay => {
    if (replay !== undefined){ setSize(replay); seg.set(replay); return replay; }
    const cancel = hintLater(15000,
      `<b>Still after $${TARGET_A} per good die.</b> Small dies pack more copies onto the
       wafer, and each one is a smaller target for a speck.`);
    onSegPick = cancel;
    await waitFor(() => { const c = refresh(); return c.good > 0 && c.cost <= TARGET_A; });
    cancel();
    onSegPick = null;
    return curSize.id;
  });
  segEnabled(false);
  SFX.success();

  const after1 = refresh();
  guide.say(`${named(pick1)} dies came to ${money(after1.cost)} each. The wafer holds
    ${after1.whole} of them and dust killed ${after1.dead}.`);
  stage.focus(costV, { label: 'under target', at: 'top' });
  await guide.next();

  /* --- the trade-off, drawn at wafer scale --- */
  stage.clearFocus();
  const geo = svgEl('g');
  svg.appendChild(geo);
  const SM = SIZES[0].s, LG = SIZES[2].s;          // 25 and 50 user units, exactly as cut
  const SMX = 440, LGX = 560, BASE = 380;          // far enough apart for both captions
  const smSq = svgEl('rect', { x: SMX, y: BASE - SM, width: SM, height: SM, class: 'die' });
  const lgSq = svgEl('rect', { x: LGX, y: BASE - LG, width: LG, height: LG, class: 'die' });
  const vLine = svgEl('line', { x1: LGX + LG / 2, y1: BASE - LG, x2: LGX + LG / 2, y2: BASE, stroke: 'var(--hairline)', 'stroke-width': 1 });
  const hLine = svgEl('line', { x1: LGX, y1: BASE - LG / 2, x2: LGX + LG, y2: BASE - LG / 2, stroke: 'var(--hairline)', 'stroke-width': 1 });
  const label = (x, y, txt, cls) => {
    const t = svgEl('text', { x, y, class: cls });
    t.textContent = txt;
    geo.appendChild(t);
    return t;
  };
  geo.append(smSq, lgSq, vLine, hLine);
  const smLbl = label(SMX + SM / 2, 398, 'SMALL DIE', 'lbl-faint');
  const lgLbl = label(LGX + LG / 2, 398, 'LARGE DIE', 'lbl-faint');
  const smCnt = label(SMX + SM / 2, 414, '', 'lbl');
  const lgCnt = label(LGX + LG / 2, 414, '', 'lbl');
  const speck = svgEl('circle', { cx: LGX + LG * 0.62, cy: BASE - LG * 0.55, r: 2.4, class: 'defect-dot' });
  geo.appendChild(speck);
  [vLine, hLine, smCnt, lgCnt, speck].forEach(n => { n.style.opacity = '0'; });
  await fadeIn([smSq, lgSq, smLbl, lgLbl], 340);

  guide.say(`Here are the small and the large die, drawn at the size the wafer cuts them.
    The large one's edge is twice as long.`);
  // the captions ride along in every geo focus, or the scrim hides the names
  stage.focus([smSq, lgSq, smLbl, lgLbl], { label: 'twice the edge', at: 'top' });
  await guide.next();

  stage.clearFocus();
  await fadeIn([vLine, hLine], 300);

  guide.say(`Twice the edge is four times the area. Four small dies fit inside one large
    one.`);
  stage.focus([lgSq, vLine, hLine, lgLbl], { label: 'four times the area', at: 'top' });
  await guide.next();

  stage.clearFocus();
  lgSq.setAttribute('class', 'die defect');
  await fadeIn([speck], 300);

  guide.say(`A speck kills the die it lands in whatever that die's size. In the large one
    it takes four small dies' worth of silicon with it.`);
  stage.focus([lgSq, lgLbl, speck], { label: 'same speck, four times the loss', at: 'top' });
  await guide.next();

  stage.clearFocus();
  const all1 = measureAll();
  smCnt.textContent = `${all1.sm.whole} PER WAFER`;
  lgCnt.textContent = `${all1.lg.whole} PER WAFER`;
  await fadeIn([smCnt, lgCnt], 300);

  guide.say(`Fewer of them fit, too. This wafer holds ${all1.sm.whole} whole small dies and
    ${all1.lg.whole} large ones, because a big square wastes more of the round edge.`);
  stage.focus([smLbl, lgLbl, smCnt, lgCnt], { label: 'whole dies per wafer', at: 'bottom' });
  await guide.next();

  /* --- test B: a dirtier wafer, and the size resets so the answer has to be re-earned --- */
  stage.clearFocus();
  await Anim.tween(260, p => { geo.style.opacity = String(1 - p); });
  geo.style.display = 'none';

  await seedCard(async s => {
    wafer.scatter(s, 24);
    curSize = SIZES[1];
    seg.set('md');
    wafer.tile(curSize.s, curSize.s);
    paint();
    refresh();
    guide.say(`A second wafer, cut back to medium so you start level. This one caught 24
      specks, twice the dust of the first.`);
    stage.focus(defectLayer, { label: '24 specks', at: 'top', ring: false });
  }, () => killingSeed(24));

  stage.clearFocus();
  guide.say(`Twice the dust on the same design. Before you touch the sizes: does small
    still come out cheapest?`);
  const predict = await guide.choose([
    { label: 'Yes, small still wins', value: 'sm' },
    { label: 'No, medium wins now', value: 'md' },
  ]);

  target = TARGET_B;
  refresh();
  segEnabled(true);
  guide.say(predict === 'sm'
    ? `Same answer, and the number settles it. <b>Get this wafer under $${TARGET_B} per
       good die.</b>`
    : `Worth checking. <b>Get this wafer under $${TARGET_B} per good die.</b>`);

  const pick2 = await flow.ask(async replay => {
    if (replay !== undefined){ setSize(replay); seg.set(replay); return replay; }
    const cancel = hintLater(15000,
      `<b>Still after $${TARGET_B} per good die.</b> With this much dust the large cut
       loses about half its dies. Small is the only one with enough survivors.`);
    onSegPick = cancel;
    await waitFor(() => { const c = refresh(); return c.good > 0 && c.cost <= TARGET_B; });
    cancel();
    onSegPick = null;
    return curSize.id;
  });
  segEnabled(false);
  SFX.success();

  /* all three cuts of this one wafer, priced on screen, so the card quotes nothing the
     player cannot read off the stage */
  const all2 = measureAll();
  const compare = svgEl('g');
  SIZES.forEach((s, i) => {
    const y = 318 + i * 28;
    const l = svgEl('text', { x: PX, y, class: 'lbl' });
    l.style.textAnchor = 'start';
    l.textContent = s.label.toUpperCase();
    const v = svgEl('text', { x: PR, y, class: 'lbl-strong' });
    v.style.textAnchor = 'end';
    v.style.fill = 'var(--amber)';
    v.textContent = money(all2[s.id].cost);
    compare.append(l, v);
  });
  panel.appendChild(compare);
  await fadeIn([compare], 320);

  guide.say(`${named(pick2)} again, at ${money(all2[pick2].cost)}. The other two cuts of
    this same wafer are on the right.`);
  stage.focus(compare, { label: 'this wafer, cut three ways', at: 'top' });
  await guide.next();

  stage.clearFocus();
  guide.aha(`This is why chips are small. A speck kills one die whatever its size, so the
    bigger you cut, the more silicon each speck takes with it.`,
    `A large die costs many times more than its area suggests: fewer fit on the wafer, and
     fewer of those live. The ones that do live are not identical either, and they will not
     all sell for the same price.`);
  await guide.next();
}
