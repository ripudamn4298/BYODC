// ACT 5 · STEP 4 — "Wire it so a failure does not stop it".
// Rebuilt to the micro-learning contract in DESIGN_MAKEOVER.md §2 and the card script in
// ACT5_MAKEOVER.md §3 "Step 4". The old step ("One machine, many rooms") is the source:
// its leaf-spine wiring board and its failure-repair beat survive intact, re-carded so
// that switch, hop, leaf-spine and fabric each land as their own definition, and so the
// link count is compared against the all-to-all count the player met two steps ago.
//
// The two link counts, both derived from the topology actually drawn here:
//   leaf-spine  = 2 cables per rack, so 2n. 4 racks → 8 (counted on the board),
//                 40 → 80, 4,000 → 8,000.
//   all-to-all  = n(n−1)/2, the rule the earlier step ended on. 4 → 6, 40 → 780,
//                 4,000 → 7,998,000.
// Both are quoted for the same rack counts, and both are drawn on the stage.
//
// Determinism: which switch dies comes from mulberry32 seeded with a value recorded
// through flow.ask, and that ask renders its own Next so it is a visible card boundary
// (an ask with no button is an invisible Back stop). Math.random only picks the seed,
// only in the live branch. Progress is driven by Anim.tween and the shared Anim ticker,
// never a bare setTimeout loop.
import { svgEl, el, waitFor, slug, RM } from '../../engine/util.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeTopoBoard } from '../../engine/dc.js';
import { mulberry32 } from '../../engine/fab.js';

const RACK_POS = [[130, 340], [280, 340], [440, 340], [590, 340]];
const SWITCH_POS = [[240, 130], [480, 130]];
const MESH_POS = [[240, 170], [400, 170], [240, 270], [400, 270]];

/* the comparison table, drawn low on the stage so both counts are readable */
const T = { lab: 250, colA: 390, colB: 566, head: 400, sub: 413, r1: 437, r2: 460 };

function buildBoard(svg){
  const board = makeTopoBoard(svg);
  const racks = RACK_POS.map((p, i) => board.addNode(`r${i}`, p[0], p[1], 'rack', `RACK ${i + 1}`));
  const switches = SWITCH_POS.map((p, i) => board.addNode(`s${i}`, p[0], p[1], 'switch', `SWITCH ${i + 1}`));
  // dc.js drops a switch's label inside its 40-unit box, where it overflows. Lift it.
  switches.forEach(s => { const t = s.el.querySelector('text'); if (t) t.setAttribute('y', String(s.y - 24)); });
  return { board, racks, switches };
}

async function fadeIn(nodes, dur = 320){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  list.forEach(n => { n.style.opacity = '0'; n.style.display = ''; });
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(p); }));
  list.forEach(n => { n.style.opacity = '1'; });
}
async function fadeOut(nodes, dur = 280){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(1 - p); }));
  list.forEach(n => { n.style.display = 'none'; });
}

/* stage.focus restores its raised nodes back to front, so the list it is handed has to
   be in document order or clearFocus throws NotFoundError. */
function docOrder(nodes){
  return nodes.filter(Boolean).slice().sort((a, b) =>
    (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);
}

function text(parent, x, y, s, cls = 'lbl', anchor = 'middle'){
  const t = svgEl('text', { x, y, class: cls });
  t.style.textAnchor = anchor;          // CSS on .lbl beats the presentation attribute
  t.textContent = s;
  parent.appendChild(t);
  return t;
}

/* a chip whose <b> is coloured by the step, since .chip b is hard-coded blue */
function chip(controls, html){
  const c = el('div', { class: 'chip' }, html);
  controls.appendChild(c);
  return {
    el: c,
    set(inner, tone){
      c.innerHTML = inner;
      const b = c.querySelector('b');
      if (b) b.style.color = tone === 'warn' ? 'var(--amber)' : tone === 'bad' ? 'var(--red)' : 'var(--blue)';
    },
  };
}

/* a nudge that writes into the stage's own line instead of the card slot, because
   guide.note and flow.hintAfter both overwrite the current card in card mode */
function hintLater(ms, node, s){
  if (flow.instant) return () => {};
  let dead = false;
  const id = setTimeout(() => { if (!dead) node.textContent = s; }, ms);
  return () => { dead = true; clearTimeout(id); if (node.textContent === s) node.textContent = ''; };
}

export async function step4(){
  guide.title('STEP 4 / 5 · NANOVOLT CLOUD', 'Wire it so a failure <em>does not stop it</em>');
  guide.cards();

  const stage = newStage('24', 'Racks wired up to switches, then a switch fails mid-job');
  const { svg, controls } = stage;

  /* ============ CARD 1 — the count the player already paid ======================== */

  const mesh = svgEl('g');
  svg.appendChild(mesh);
  const meshLinks = svgEl('g'), meshNodes = svgEl('g');
  mesh.append(meshLinks, meshNodes);
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++){
    meshLinks.appendChild(svgEl('line', {
      x1: MESH_POS[i][0], y1: MESH_POS[i][1], x2: MESH_POS[j][0], y2: MESH_POS[j][1], class: 'topo-link',
    }));
  }
  const meshDots = MESH_POS.map(p => {
    const g = svgEl('g', { class: 'topo-node rack' });
    g.appendChild(svgEl('circle', { cx: p[0], cy: p[1], r: 15, class: 'node-box' }));
    meshNodes.appendChild(g);
    return g;
  });
  const meshCap = svgEl('g');
  svg.appendChild(meshCap);
  text(meshCap, 320, 312, '4 MACHINES · 6 LINKS', 'lbl-strong');
  text(meshCap, 320, 330, '40 MACHINES · 780 LINKS', 'lbl');

  guide.say(`You wired four GPUs to each other earlier. Six links. Forty of them would
    need 780. This hall holds thousands of racks.`);
  stage.focus([meshLinks, meshNodes, meshCap], { label: 'all-to-all', at: 'left' });
  await guide.next();

  /* ============ CARD 2 — the machines are racks now =============================== */

  stage.clearFocus();
  const { board, racks } = buildBoard(svg);
  board.g.style.opacity = '0';
  await Promise.all([
    fadeOut([meshCap, meshLinks], 260),
    Anim.tween(560, p => meshDots.forEach((g, i) => {
      const dx = (RACK_POS[i][0] - MESH_POS[i][0]) * p, dy = (RACK_POS[i][1] - MESH_POS[i][1]) * p;
      g.setAttribute('transform', `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`);
    })),
  ]);
  board.g.style.opacity = '1';
  mesh.remove(); meshCap.remove();
  // only the racks so far; the switches arrive on their own card
  const switchNodes = board.nodes.filter(n => n.kind === 'switch');
  switchNodes.forEach(n => { n.el.style.display = 'none'; });

  guide.say(`Now the machines are whole racks. They still have to reach each other, and
    you already know you cannot wire them all together.`);
  stage.focus(racks.map(r => r.el), { label: 'four racks', at: 'top' });
  await guide.next();

  /* ============ CARD 3 — the switch =============================================== */

  stage.clearFocus();
  await fadeIn(switchNodes.map(n => n.el), 340);

  guide.say(`A switch is a box that passes traffic between whatever plugs into it. Racks
    never connect to each other. Each rack connects up to a switch.`);
  stage.focus(switchNodes.map(n => n.el), { label: 'switch', at: 'top' });
  await guide.next();

  /* ============ CARD 4 — a hop ==================================================== */

  stage.clearFocus();
  const demo = svgEl('g');
  svg.appendChild(demo);
  const seg = (x1, y1, x2, y2) => {
    const l = svgEl('line', { x1, y1, x2, y2, class: 'topo-link' });
    l.style.strokeDasharray = '5 5';
    l.style.opacity = '.55';
    demo.appendChild(l);
  };
  seg(280, 340, 240, 130);
  seg(240, 130, 440, 340);
  text(demo, 244, 238, '1', 'lbl-strong');
  text(demo, 356, 238, '2', 'lbl-strong');
  await fadeIn([demo], 300);

  guide.say(`One trip through a switch is a hop. Up from a rack, then down to another
    rack: two hops.`);
  stage.focus(demo, { label: 'two hops', at: 'left' });
  await guide.next();

  /* ============ CARD 5 — leaf-spine =============================================== */

  stage.clearFocus();
  await fadeOut([demo], 240);
  demo.remove();

  guide.say(`Racks along the bottom, switches across the top. The racks are the leaves and
    the switches the spine, so the shape is called leaf-spine.`);
  stage.focus(board.g, { label: 'leaf-spine', at: 'top', ring: false });
  await guide.next();

  /* ============ CARD 6 — wire it (no focus: the player clicks the nodes) ========== */

  stage.clearFocus();
  const uplinks = id => board.links.filter(l => l.a === id || l.b === id).length;
  const wiredOk = () => board.allReachable(2) && racks.every(r => uplinks(r.id) >= 2);

  const cableChip = chip(controls, 'CABLES: <b>0 of 8</b>');
  const hintLine = text(svg, 360, 462, '', 'lbl');
  function refreshCables(){
    const n = board.links.length;
    cableChip.set(wiredOk() ? 'CABLES: <b>8 of 8</b>' : `CABLES: <b>${n} of 8</b>`, wiredOk() ? 'ok' : 'warn');
  }
  refreshCables();

  guide.say(`<b>Your goal: every rack reaches every other in at most two hops.</b> Click a
    rack, then a switch, to run a cable. Every rack needs one cable to each switch.`);

  const cancelHint1 = hintLater(15000, hintLine, 'CLICK A RACK, THEN A SWITCH');

  await flow.ask(async replay => {
    if (replay !== undefined){
      replay.links.forEach(([a, b]) => { if (!board.linkExists(a, b)) board.drawLink(a, b); });
      refreshCables(); cancelHint1();
      return replay;
    }
    board.enableWiring(() => { SFX.hop(); cancelHint1(); refreshCables(); }, {
      validPair: (a, b) => (a[0] === 'r' && b[0] === 's') || (a[0] === 's' && b[0] === 'r'),
    });
    await waitFor(wiredOk, { hold: 500 });
    cancelHint1();
    SFX.success();
    return { links: board.links.map(l => [l.a, l.b]) };
  });
  hintLine.textContent = '';

  /* ============ CARD 7 — the two-hop path, proved on one pair ===================== */

  const linkEl = (a, b) => board.links.find(l =>
    (l.a === a && l.b === b) || (l.a === b && l.b === a))?.el;
  const path = docOrder([linkEl('r0', 's0'), linkEl('r3', 's0')]);

  guide.say(`Rack 1 reaches rack 4 by going up to a switch and straight back down. Every
    other pair works the same way.`);
  stage.focus(path, { label: 'rack 1 to rack 4 · two hops', at: 'top' });
  await guide.next();

  /* ============ CARD 8 — the fabric =============================================== */

  const cables = board.links.map(l => l.el);

  guide.say(`All this wiring together is the fabric. The racks do the computing. The
    fabric carries what they say to each other.`);
  stage.focus(cables, { label: 'fabric', at: 'top' });
  await guide.next();

  /* ============ CARD 9 — count what is on the board =============================== */

  guide.say(`Count the cables: eight. Two for every rack, one to each switch.`);
  stage.focus(cables, { label: 'eight cables', at: 'top' });
  await guide.next();

  /* ============ CARD 10 — the trade, both counts on the stage ===================== */

  stage.clearFocus();
  const table = svgEl('g');
  svg.appendChild(table);
  text(table, T.colA, T.head, 'ALL-TO-ALL', 'lbl-strong');
  text(table, T.colA, T.sub, 'n(n−1)/2', 'lbl-faint');
  text(table, T.colB, T.head, 'THIS FABRIC', 'lbl-strong');
  text(table, T.colB, T.sub, '2n', 'lbl-faint');
  text(table, T.lab, T.r1, '40 RACKS', 'lbl', 'end');
  text(table, T.colA, T.r1, '780', 'lbl-strong');
  text(table, T.colB, T.r1, '80', 'lbl-strong');
  text(table, T.lab, T.r2, '4,000 RACKS', 'lbl', 'end');
  text(table, T.colA, T.r2, '7,998,000', 'lbl-strong');
  text(table, T.colB, T.r2, '8,000', 'lbl-strong');
  await fadeIn([table], 340);

  guide.say(`Two cables per rack, however many racks there are. Forty racks: 80 cables
    here, 780 all-to-all. Four thousand: 8,000 against 7,998,000.`);
  stage.focus(table, { label: 'cables needed', at: 'left' });
  await guide.next();

  /* ============ CARD 11 — a leaner hall =========================================== */

  const stage2 = newStage('24', 'A leaner hall: one cable per rack, and a switch fails');
  const { svg: svg2, controls: controls2 } = stage2;
  const { board: board2, racks: racks2 } = buildBoard(svg2);
  // One cable up per rack, split across the two switches, and the switches cabled to
  // each other so every rack can still reach every other. Lose a switch and the racks
  // behind it have nothing left.
  const LEAN = [['r0', 's0'], ['r1', 's0'], ['r2', 's1'], ['r3', 's1'], ['s0', 's1']];
  LEAN.forEach(([a, b]) => board2.drawLink(a, b));

  guide.say(`A second hall, built cheaper. One cable up per rack, and the two switches
    cabled to each other. Every rack still reaches every other.`);
  stage2.focus(board2.links.map(l => l.el), { label: 'one cable per rack', at: 'top' });
  await guide.next();

  /* ============ CARD 12 — the training job ======================================== */

  stage2.clearFocus();
  const BAR = { x: 230, y: 414, w: 260, h: 14 };
  const barWrap = svgEl('g');
  svg2.appendChild(barWrap);
  text(barWrap, 360, 404, 'TRAINING JOB', 'lbl-strong');
  barWrap.appendChild(svgEl('rect', {
    x: BAR.x, y: BAR.y, width: BAR.w, height: BAR.h, rx: 3, class: 'slot',
  }));
  const barFill = svgEl('rect', {
    x: BAR.x + 2, y: BAR.y + 2, width: 0, height: BAR.h - 4, rx: 2, fill: 'var(--blue)',
  });
  barFill.style.fill = 'var(--blue)';       // a class's CSS fill would beat the attribute
  svg2.appendChild(barFill);
  const statusLine = text(svg2, 360, 450, '', 'lbl');
  const hintLine2 = text(svg2, 360, 470, '', 'lbl-faint');

  let progress = 0;
  const setProgress = v => {
    progress = Math.max(0, Math.min(100, v));
    barFill.setAttribute('width', String((progress / 100) * (BAR.w - 4)));
  };
  setProgress(0);
  await fadeIn([barWrap, barFill], 300);

  guide.say(`A training job runs across these racks. The bar moves only while every rack
    can reach every other.`);
  // no focus label here: the bar's own TRAINING JOB caption fades in with this card, so a
  // second copy of the same words on a leader line would just be noise
  stage2.focus(docOrder([barWrap, barFill]), { ring: true });
  await guide.next();

  /* ============ CARD 13 — the seed, on a card boundary of its own ================= */

  stage2.clearFocus();

  /* The recorded answer is the seed for the failure, not a click, so the card renders
     its own Next and the ask is a visible Back stop. */
  const seed = await flow.ask(async replay => {
    const s = replay !== undefined ? replay : Math.floor(Math.random() * 1e9);
    guide.say(`In a hall this size, hardware fails most days. Start the job.`);
    const b = el('button', { class: 'btn primary', 'data-label': slug('Start the job ▸') }, 'Start the job ▸');
    guide.beat(el('div', { class: 'btn-row' }), 'actions').appendChild(b);
    if (replay !== undefined){ b.disabled = true; b.classList.add('used'); return s; }
    await new Promise(res => b.addEventListener('click', () => {
      SFX.click(); b.disabled = true; b.classList.add('used'); res();
    }));
    return s;
  });

  const deadIdx = mulberry32(seed)() < 0.5 ? 0 : 1;
  const deadId = `s${deadIdx}`;
  const liveId = `s${1 - deadIdx}`;

  /* the job gets going, then the switch goes */
  await Anim.tween(1700, p => setProgress(38 * p));
  board2.killNode(deadId);
  SFX.blip();

  /* ============ CARD 14 — the repair ============================================== */

  const stranded = () => racks2.filter(r =>
    !board2.links.some(l => {
      const other = l.a === r.id ? l.b : l.b === r.id ? l.a : null;
      return other && !board2.nodes.find(n => n.id === other).dead;
    }));

  const repairChip = chip(controls2, '');
  function refreshRepair(){
    const ok = board2.allReachable(2);
    statusLine.textContent = ok ? '' : 'STALLED';
    statusLine.style.fill = ok ? '' : 'var(--red)';
    const n = stranded().length;
    repairChip.set(ok ? 'FABRIC: <b>whole again</b>'
      : `FABRIC: <b>${n} rack${n === 1 ? '' : 's'} cut off</b>`, ok ? 'ok' : 'bad');
    return ok;
  }
  refreshRepair();

  const added = [];
  const tick = dt => { if (board2.allReachable(2) && progress < 100) setProgress(progress + 26 * dt); };

  guide.say(`SWITCH ${deadIdx + 1} is down. The racks behind it have no way out and the
    bar has stopped. Wire them to the switch that is still up.`);

  const cancelHint2 = hintLater(15000, hintLine2,
    `CLICK A CUT-OFF RACK, THEN SWITCH ${2 - deadIdx}`);

  await flow.ask(async replay => {
    if (replay !== undefined){
      replay.forEach(([a, b]) => { if (!board2.linkExists(a, b)) board2.drawLink(a, b); });
      setProgress(100); refreshRepair(); cancelHint2();
      return replay;
    }
    if (!RM) Anim.add(tick);
    board2.enableWiring((a, b) => {
      SFX.hop(); cancelHint2(); added.push([a, b]); refreshRepair();
    }, {
      validPair: (a, b) => {
        const kinds = (a[0] === 'r' && b[0] === 's') || (a[0] === 's' && b[0] === 'r');
        const alive = !board2.nodes.find(n => n.id === a).dead && !board2.nodes.find(n => n.id === b).dead;
        return kinds && alive;
      },
    });
    await waitFor(() => {
      const ok = refreshRepair();
      if (ok && RM) setProgress(100);          // the shared ticker does not run under RM
      return ok && progress >= 100;
    }, { hold: 400 });
    Anim.remove(tick);
    cancelHint2();
    SFX.success();
    return added;
  });
  Anim.remove(tick);
  statusLine.textContent = '';

  /* ============ CARD 15 — it finished ============================================= */

  guide.say(`The bar filled. The job paused while you rewired, then carried on from where
    it stopped.`);
  stage2.focus(docOrder([barWrap, barFill]), { label: 'job complete', at: 'left' });
  await guide.next();

  /* ============ CARD 16 — design for failure ====================================== */

  stage2.clearFocus();
  guide.aha(`The lean hall stalled because each rack had one way out. The fabric you wired
    first gives every rack two, so either switch can die and the job keeps running.`,
    `The name for that is design for failure.`);
  await guide.next();
}
