// ACT 5 · STEP 3 (file step4.js, seed key 5:network) — "How do you wire the racks so one failure does not stop the job?"
// (was "Wire it so a failure does not stop it").
// Rebuilt to the micro-learning contract in DESIGN_MAKEOVER.md §2 and the card script in
// ACT5_MAKEOVER.md §3 "Step 4". The old step ("One machine, many rooms") is the source:
// its leaf-spine wiring board and its failure-repair beat survive intact, re-carded so
// that switch, hop, leaf-spine and fabric each land as their own definition, and so the
// link count is compared against the all-to-all count the player met in the step before.
//
// Course restructure (2026-10-25): this is now step 3 of 5 (registry index 2), between the
// all-to-all step and the power step. It opens on Act 4's map of where numbers wait, grown by
// two rings (js/art/rings.js, `outer: true`), so the network reads as ring 6 of that map.
// The two cards that restated step 2's link counts are gone; the switch cards, the count and
// trade cards are merged, and the rack-1-to-rack-4 card (a repeat of the hop) is cut.
//
// The two link counts, both derived from the topology actually drawn here:
//   leaf-spine  = 2 cables per rack, so 2n. 4 racks → 8 (counted on the board),
//                 40 → 80, 4,000 → 8,000.
//   all-to-all  = n(n−1)/2, the rule the step before ended on. 4 → 6, 40 → 780,
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
import { slideInPanel } from '../../engine/components.js';
import { networkLab } from './lab.js';
import { ringsMap } from '../../art/rings.js';

const RACK_POS = [[130, 340], [280, 340], [440, 340], [590, 340]];
const SWITCH_POS = [[240, 130], [480, 130]];

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
  // Course restructure (2026-10-25): the steps were reordered, so this one is step 3
  guide.title('STEP 3 / 5', 'How do you wire the racks so <em>one failure does not stop the job?</em>');
  guide.cards();

  const stage = newStage('23', 'Act 4\'s map of where numbers wait, grown by two rings, then racks wired up to switches');
  const { svg, controls } = stage;

  /* ============ CARDS 1–4 — the rings map, grown by two rings =====================
     Course restructure (2026-10-25): replaces the two cards that restated step 2's link
     counts. Act 4 drew this map around one lane; here the lane is a whole GPU, and the
     numbers it needs from other GPUs wait in rings 5 and 6. Each card lights its ring.
     Speeds (H100): NVLink 900 GB/s in total, 450 GB/s each way; one 400 Gb/s network port
     carries 50 GB/s each way; 450 ÷ 50 = 9, so ring 6 is about a ninth of NVLink's speed. */

  const TITLE = "WHERE A GPU'S NUMBERS WAIT";
  const ringsG = svgEl('g');
  const drawRings = lit => { ringsG.innerHTML = ringsMap({ outer: true, lit, title: TITLE }); };
  drawRings(['node', 'net']);
  svg.appendChild(ringsG);
  await fadeIn([ringsG], 360);

  guide.say(`Here is the map of where numbers wait, from Act 4. Rings 1 to 4 are all inside
    one GPU. Now each GPU is the lane, and the numbers it needs from other GPUs wait in two
    new rings.`);
  await guide.next();

  drawRings('node');
  guide.say(`Ring 5 is the other GPUs in the same node, reached over NVLink. Adding GPUs to
    this ring is called <b>scale-up</b>. NVIDIA's GB200 NVL72 makes ring 5 a whole rack: 72
    GPUs on one NVLink.`);
  await guide.next();

  drawRings('net');
  guide.say(`Ring 6 is every other node, in your rack and in every other rack, reached through
    switches at about a ninth of NVLink's speed. Adding racks here is called
    <b>scale-out</b>, and it runs on InfiniBand or Ethernet.`);
  await guide.next();

  guide.say(`As in Act 4, the slower of the maths and the delivery sets the speed. Across your
    site, the slowest delivery is ring 6, the network you wire in this step.`);
  await guide.next();

  /* ============ CARD 5 — the switch (racks and switches arrive together) ==========
     Course restructure (2026-10-25): the switch card and the "racks never connect directly"
     card are one card. The map fades out and the leaf-spine board fades in. */

  await fadeOut([ringsG], 280);
  ringsG.remove();
  const { board, racks } = buildBoard(svg);
  const switchNodes = board.nodes.filter(n => n.kind === 'switch');
  await fadeIn([board.g], 360);

  guide.say(`Racks never connect directly to each other. Each rack connects up to a switch,
    a device that passes data between whatever plugs into it. This is a network switch, not
    the transistor switch from Act 1.`);
  stage.focus(switchNodes.map(n => n.el), { label: 'switch', at: 'top' });
  await guide.next();

  /* ============ CARD 6 — a hop ==================================================== */

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

  guide.say(`One trip through a switch is called a hop. Going up from a rack to a switch,
    then down to another rack, is two hops.`);
  stage.focus(demo, { label: 'two hops', at: 'left' });
  await guide.next();

  /* ============ CARD 7 — leaf-spine =============================================== */

  stage.clearFocus();
  await fadeOut([demo], 240);
  demo.remove();

  // Course restructure (2026-10-25): the "(not the interconnect spine…)" note is dropped,
  // because step 1 now calls that part simply the interconnect
  guide.say(`Racks along the bottom, switches across the top. This shape is called
    leaf-spine: the racks are the leaves and the switches are the spine.`);
  stage.focus(board.g, { label: 'leaf-spine', at: 'top', ring: false });
  await guide.next();

  /* ============ CARD 8 — wire it (no focus: the player clicks the nodes) ========== */

  stage.clearFocus();
  const uplinks = id => board.links.filter(l => l.a === id || l.b === id).length;
  const wiredOk = () => board.allReachable(2) && racks.every(r => uplinks(r.id) >= 2);

  const cableChip = chip(controls, 'LINKS: <b>0 of 8</b>');
  const hintLine = text(svg, 360, 462, '', 'lbl');
  function refreshCables(){
    const n = board.links.length;
    cableChip.set(wiredOk() ? 'LINKS: <b>8 of 8</b>' : `LINKS: <b>${n} of 8</b>`, wiredOk() ? 'ok' : 'warn');
  }
  refreshCables();

  guide.say(`<b>Your goal is for every rack to reach every other in at most two hops.</b>
    Click a rack, then a switch, to run a link. Every rack needs one link to each switch.`);

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

  /* Course restructure (2026-10-25): the "rack 1 reaches rack 4" card is cut, because it
     repeated the two-hop path the hop card already shows. */

  /* ============ CARD 9 — the fabric =============================================== */

  const cables = board.links.map(l => l.el);

  guide.say(`All this wiring together is called the fabric. The racks do the computing, and
    the fabric carries the data between them.`);
  stage.focus(cables, { label: 'fabric', at: 'top' });
  await guide.next();

  /* ============ CARD 10 — count the links, and the trade, both counts on the stage ===
     Course restructure (2026-10-25): the "count the links" card and the trade card are one
     card. The table fades in with it, and the focus holds the links and the table. */

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

  guide.say(`Count the links: there are eight, one from every rack to each switch. That stays
    two per rack, however many racks there are. Forty racks need 80 links, against 780
    all-to-all, and 4,000 racks need 8,000, against 7,998,000.`);
  stage.focus(docOrder([...cables, table]), { label: 'links needed', at: 'left' });
  await guide.next();

  /* ============ CARD 11 — a leaner hall =========================================== */

  const stage2 = newStage('23', 'A cheaper hall: one link per rack, and a switch fails');
  const { svg: svg2, controls: controls2 } = stage2;
  const { board: board2, racks: racks2 } = buildBoard(svg2);
  // One cable up per rack, split across the two switches, and the switches cabled to
  // each other so every rack can still reach every other. Lose a switch and the racks
  // behind it have nothing left.
  const LEAN = [['r0', 's0'], ['r1', 's0'], ['r2', 's1'], ['r3', 's1'], ['s0', 's1']];
  LEAN.forEach(([a, b]) => board2.drawLink(a, b));

  guide.say(`Here is a second hall, built cheaper: one link up per rack, and the two
    switches linked to each other. Every rack still reaches every other.`);
  stage2.focus(board2.links.map(l => l.el), { label: 'one link per rack', at: 'top' });
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

  guide.say(`A training job (one model being trained across all these racks) is running. The
    bar shows its progress, and it moves only while every rack can reach every other.`);
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
    guide.say(`In a hall this size, hardware fails several times a day. Start the job.`);
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

  guide.say(`SWITCH ${deadIdx + 1} is down. The racks linked to it have no way out, and the
    bar has stopped. Link them to the switch that is still up.`);

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
  guide.aha(`The cheaper hall stalled because each rack had only one way out. The fabric you
    wired first gives every rack two, so either switch can fail and the job keeps running.`,
    `The name for that is design for failure.`);
  await guide.next();

  /* ============ IN THE LAB — real switches, a patch panel, a failed link ============ */

  stage2.clearFocus();
  const lab = slideInPanel(svg2, networkLab(), { lab: true });
  const failG = lab.g.querySelector('[data-k="fail"]');
  lab.focus('leaf');
  await lab.show();

  guide.lab(`Each of your racks linked up to the switches above it. Here is a real leaf
    switch, one rack unit tall. Its 32 sockets carry 64 links, each running at 400 gigabits a
    second.`, { intro: true });
  await guide.next();

  lab.focus(['leaf', 'down', 'up']);
  guide.lab(`The bottom row of cables runs down to the servers in this rack, on short copper
    cables. The top row runs up to the spine switches on fibre, because the spine can stand
    tens of metres away.`);
  await guide.next();

  lab.focus(['up', 'patch', 'spine']);
  guide.lab(`Each long fibre ends at a patch panel, a board of sockets. Short cords join each
    socket to a spine switch, often the same model as the leaf, so staff can move a link
    without touching the long fibres.`);
  await guide.next();

  failG.style.display = '';
  lab.g.querySelector('[data-cord="fail"]').style.display = 'none';   // the red dashed cord replaces it
  lab.focus(['patch', 'spine', 'fail']);
  guide.lab(`When a link fails, its port light goes out and the data goes over the other
    links, as it did in your two-link fabric. A technician then swaps the faulty module or
    cable while the switch keeps running.`);
  await guide.next();
  await lab.hide();
}
