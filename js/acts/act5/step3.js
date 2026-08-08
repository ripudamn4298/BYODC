// ACT 5 · STEP 3 — "One machine, many rooms".
// Ten thousand GPUs must act like ONE machine — the network IS the computer.
// TopoBoard: 4 racks (bottom) + 2 switches (top), leaf-spine. Player wires
// rack<->switch links until any rack reaches any other in <=2 hops. Then a
// switch dies mid-test; a "training job" bar stalls and resumes on repair.
import { svgEl, el, sleep, waitFor } from '../../engine/util.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeTopoBoard } from '../../engine/dc.js';

const RACK_POS = [[130, 340], [280, 340], [440, 340], [590, 340]];
const SWITCH_POS = [[240, 130], [480, 130]];

function buildBoard(svg){
  const board = makeTopoBoard(svg);
  const racks = RACK_POS.map((p, i) => board.addNode(`r${i}`, p[0], p[1], 'rack', `RACK ${i + 1}`));
  const switches = SWITCH_POS.map((p, i) => board.addNode(`s${i}`, p[0], p[1], 'switch', `SWITCH ${i + 1}`));
  return { board, racks, switches };
}

export async function step3(){
  guide.title('STEP 3 / 4 · NANOVOLT CLOUD', 'One machine, <em>many rooms</em>');

  /* ===================== BEAT 1 — the network is the computer ===================== */
  guide.say(`Ten thousand GPUs in different rooms have to behave like <b>one machine</b>. The wiring between racks is the <b>network fabric</b>, and it matters as much as anything inside them. <b>Your goal: wire it so every rack reaches every other, then keep a job alive when it breaks.</b>`);
  await guide.next();

  /* ===================== BEAT 2 — wire the leaf-spine ===================== */
  const { svg, controls } = newStage('21', 'Leaf-spine fabric — wire the racks to the switches');
  guide.say(`Four <b>racks</b> below, two <b>switches</b> above. Racks never connect directly: each goes <em>up</em> to a switch, and switches pass traffic along. Racks are the leaves, switches the spine, so the layout is <b>leaf-spine</b>. One step through a switch is a <b>hop</b>. <b>Your goal: every rack reaches every other in at most 2 hops.</b>`);

  const { board } = buildBoard(svg);
  const statusChip = el('div', { class: 'chip' }, 'FABRIC: <b>not yet reachable</b>');
  controls.appendChild(statusChip);

  function refreshStatus(){
    const ok = board.allReachable(2);
    statusChip.innerHTML = ok ? 'FABRIC: <b>every rack reachable</b>' : 'FABRIC: <b>not yet reachable</b>';
    statusChip.classList.toggle('warm', ok);
    return ok;
  }
  refreshStatus();

  const cancelHint1 = flow.hintAfter(14000, `Connect each rack UP to <b>both</b> switches — then any rack reaches any other through a switch.`);

  await flow.ask(async replay => {
    if (replay !== undefined){
      replay.links.forEach(([a, b]) => board.drawLink(a, b));
      refreshStatus(); cancelHint1();
      return replay;
    }
    board.enableWiring((a, b) => { SFX.hop(); refreshStatus(); },
      { validPair: (a, b) => (a[0] === 'r' && b[0] === 's') || (a[0] === 's' && b[0] === 'r') });
    await waitFor(() => refreshStatus(), { hold: 500 });
    cancelHint1();
    return { links: board.links.map(l => [l.a, l.b]) };
  });

  guide.say(`Wired. Every rack now reaches every other in at most two hops, up to a switch, then down to the target rack.`);
  await guide.next();

  /* ===================== BEAT 3 — the bad night ===================== */
  guide.say(`Now the failure case. At ten thousand machines something is always broken, so the fabric has to survive it. That principle is <b>design for failure</b>.`);
  await guide.next();

  const { svg: svg2, controls: controls2 } = newStage('21', 'The bad night — a switch fails mid-job');
  guide.say(`This hall runs leaner: <b>one uplink</b> per rack instead of two. When a switch dies, every rack behind it is cut off and the job stalls. <b>Your goal: wire each stranded rack to the surviving switch.</b>`);

  const { board: board2 } = buildBoard(svg2);
  // pre-wire a THINNER topology than the player just built: each rack gets only
  // ONE uplink (split across both switches) — reachable now, but with no spare
  // capacity, so killing a switch actually strands some racks and gives the
  // repair beat something real to fix.
  const singleUplink = [['r0', 's0'], ['r1', 's0'], ['r2', 's1'], ['r3', 's1']];
  singleUplink.forEach(([r, s]) => board2.drawLink(r, s));

  const barWrap = svgEl('g');
  barWrap.innerHTML = `
    <text x="360" y="410" class="lbl-strong">TRAINING JOB PROGRESS</text>
    <rect x="230" y="420" width="260" height="14" rx="3" class="slot"/>`;
  const barFill = svgEl('rect', { x: 232, y: 422, width: 0, height: 10, rx: 2, fill: 'var(--blue)' });
  svg2.append(barWrap, barFill);
  const stallLbl = svgEl('text', { x: 360, y: 452, class: 'lbl-faint' });
  stallLbl.textContent = '';
  svg2.appendChild(stallLbl);

  let progress = 0;
  const progressTicker = () => {
    const ok = board2.allReachable(2);
    stallLbl.textContent = ok ? '' : 'STALLED — fabric partition detected';
    if (ok && progress < 100) progress += 1.6;
    barFill.setAttribute('width', String((progress / 100) * 256));
  };
  const iv = setInterval(progressTicker, 60);

  await sleep(1200);
  const deadId = 's0';
  board2.killNode(deadId);
  SFX.blip();
  guide.note(`<b>SWITCH 1 just went down.</b> Watch the bar stall, repair the fabric so every rack still reaches every other in 2 hops through SWITCH 2 (or new links).`);

  const repairChip = el('div', { class: 'chip' }, 'REPAIR: <b>fabric partitioned</b>');
  controls2.appendChild(repairChip);

  const cancelHint2 = flow.hintAfter(14000, `SWITCH 1 is dead — every rack still needs a path to SWITCH 2. If a rack was only ever wired to SWITCH 1, wire it to SWITCH 2 as well.`);

  await flow.ask(async replay => {
    if (replay !== undefined){
      replay.extraLinks.forEach(([a, b]) => { if (!board2.linkExists(a, b)) board2.drawLink(a, b); });
      progress = 100; barFill.setAttribute('width', '256'); stallLbl.textContent = '';
      repairChip.innerHTML = 'REPAIR: <b>fabric restored</b>'; repairChip.classList.add('warm');
      cancelHint2(); clearInterval(iv);
      return replay;
    }
    board2.enableWiring((a, b) => { SFX.hop();
      const ok = board2.allReachable(2);
      repairChip.innerHTML = ok ? 'REPAIR: <b>fabric restored</b>' : 'REPAIR: <b>fabric partitioned</b>';
      repairChip.classList.toggle('warm', ok);
    }, { validPair: (a, b) => ((a[0] === 'r' && b[0] === 's') || (a[0] === 's' && b[0] === 'r')) });
    await waitFor(() => board2.allReachable(2) && progress >= 100, { hold: 400 });
    cancelHint2();
    clearInterval(iv);
    const extraLinks = board2.links.map(l => [l.a, l.b]).filter(([a, b]) => !(a === deadId || b === deadId));
    return { extraLinks };
  });

  guide.aha(`The job kept training. Not because nothing broke, something always breaks at this scale, but because the fabric was built assuming it would.`,
    `Redundancy isn't caution. At ten thousand machines and counting, it's arithmetic: something is <em>always</em> down, so the design has to survive that as its normal state, not its exception.`);
  await guide.next();
}
