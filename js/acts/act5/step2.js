// ACT 5 · STEP 2 — "Why you cannot wire them all together".
// The second half of the old step 1: the all-to-all wiring test, pulled out into its own
// step so the link-count lesson stops riding on the back of the rack-building lesson.
//
// Built to the micro-learning contract in DESIGN_MAKEOVER.md §2 / §4: one card at a time
// (guide.cards), each card names and focuses the one thing it is about, and the jump from
// the node the player filled last step to the four-GPU board is watched, not cut to.
//
// The order here is load-bearing. The player wires four GPUs by hand, counts the six links
// off the drawing (each one carries its own numeral), predicts the count for 40, and only
// then is told the rule n(n−1)/2. The formula is the last thing on screen, not the first.
//
// Numbers, all n(n−1)/2:  4 → 6,  40 → 780,  4000 → 7,998,000.
//
// Colour, per DESIGN.md §1a: the GPUs and links are ink, since a link count is neither
// power nor cost. Blue is the live GPU die, which is how Act 4 and step 1 draw it. The
// engine's own wiring preview is blue ("a signal in flight") and is left as it is.
//
// Determinism: no randomness anywhere. Each link's numeral comes from a fixed pair table,
// not from the order the player happened to click, so a replay lands on exactly the same
// drawing as a live run. Every visual change runs through Anim.tween, which is replay-aware.
import { el, svgEl, waitFor } from '../../engine/util.js';
import { Anim } from '../../engine/anim.js';
import { SFX } from '../../engine/sfx.js';
import { guide } from '../../engine/guide.js';
import { flow } from '../../engine/flow.js';
import { newStage } from '../../engine/stage.js';
import { makeTopoBoard } from '../../engine/dc.js';

/* ---------- geometry, in the stage's 720×480 user units ---------- */
const SLED = { x: 190, y: 90, w: 340, h: 92 };
const GPU = { size: 30, x0: 205, y: 104, step: 38 };
const gpuX = i => GPU.x0 + i * GPU.step;

const BOARD = [[170, 160], [330, 160], [170, 320], [330, 320]];

/* every pair, in a fixed order, with a hand-placed spot for its numeral. The numeral is a
   property of the PAIR, not of the click order, so the finished drawing is identical
   however the player got there — which is what makes replay match a live run. */
const PAIRS = [
  { a: 0, b: 1, n: 1, x: 250, y: 146 },
  { a: 0, b: 2, n: 2, x: 152, y: 244 },
  { a: 0, b: 3, n: 3, x: 204, y: 218 },
  { a: 1, b: 2, n: 4, x: 296, y: 218 },
  { a: 1, b: 3, n: 5, x: 348, y: 244 },
  { a: 2, b: 3, n: 6, x: 250, y: 348 },
];

/* the growth table on the right of the stage */
const TABLE = { colA: 524, colB: 694, head: 152, row: [196, 242, 288] };
const ROWS = [
  { gpus: '4', links: '6' },
  { gpus: '40', links: '780' },
  { gpus: '4,000', links: '7,998,000' },
];

async function fadeIn(nodes, dur = 320){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  list.forEach(n => { n.style.display = ''; n.style.opacity = '0'; });
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(p); }));
  list.forEach(n => { n.style.opacity = '1'; });
}
async function fadeOut(nodes, dur = 280){
  const list = nodes.filter(Boolean);
  if (!list.length) return;
  await Anim.tween(dur, p => list.forEach(n => { n.style.opacity = String(1 - p); }));
  list.forEach(n => { n.style.display = 'none'; });
}

export async function step2(){
  guide.title('STEP 2 / 5 · NANOVOLT CLOUD', 'Why you cannot wire them <em>all together</em>');
  guide.cards();

  const stage = newStage('22', 'Four GPUs wired to each other, and a table of how the link count grows');
  const { svg, controls } = stage;

  /* ================= SCENE A — the node the player filled last step ================= */

  const sled = svgEl('g');
  svg.appendChild(sled);
  sled.appendChild(svgEl('rect', {
    x: SLED.x, y: SLED.y, width: SLED.w, height: SLED.h, rx: 6, class: 'rack-frame',
  }));
  sled.appendChild(svgEl('rect', {
    x: SLED.x + 10, y: SLED.y + 60, width: SLED.w - 20, height: 12, rx: 3, class: 'sled on',
  }));

  const dies = [];
  for (let i = 0; i < 8; i++){
    const g = svgEl('g');
    g.appendChild(svgEl('rect', {
      x: gpuX(i), y: GPU.y, width: GPU.size, height: GPU.size, rx: 4, class: 'tile-bg',
    }));
    g.appendChild(svgEl('circle', {
      cx: gpuX(i) + GPU.size / 2, cy: GPU.y + GPU.size / 2, r: 6, fill: 'var(--blue)',
    }));
    sled.appendChild(g);
    dies.push(g);
  }

  guide.say(`This is the node you filled last step: eight GPUs on one sled. They only work
    as one machine if every GPU can reach every other one.`);
  stage.focus(sled, { label: 'your node', at: 'bottom' });
  await guide.next();

  /* four of the eight walk out to the corners of a square, and the sled goes */
  stage.clearFocus();
  const movers = dies.slice(0, 4);
  const rest = [sled.firstElementChild, sled.children[1], ...dies.slice(4)];
  await Promise.all([
    fadeOut(rest, 320),
    Anim.tween(560, p => movers.forEach((g, i) => {
      const dx = (BOARD[i][0] - GPU.size / 2 - gpuX(i)) * p;
      const dy = (BOARD[i][1] - GPU.size / 2 - GPU.y) * p;
      g.setAttribute('transform', `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`);
    })),
  ]);

  const board = makeTopoBoard(svg);
  BOARD.forEach((p, i) => board.addNode(`g${i}`, p[0], p[1], 'rack', `GPU ${i + 1}`));
  board.g.style.opacity = '0';
  await Promise.all([fadeIn([board.g], 300), fadeOut(movers, 300)]);

  /* the numerals live in their own layer, above the board, so the count is readable */
  const nums = svgEl('g');
  svg.appendChild(nums);

  const chip = el('div', { class: 'chip' }, 'LINKS DRAWN: <b>0</b>');
  const chipVal = () => chip.querySelector('b');
  chipVal().style.color = 'var(--ink)';          // .chip b is hard-coded blue in base.css
  controls.appendChild(chip);

  const hint = svgEl('text', { x: 250, y: 404, class: 'lbl' });
  svg.appendChild(hint);

  /* focus targets, in document order. Never focus the board group itself: enableWiring
     parks an invisible preview line in it whose default endpoints are 0,0, which drags
     the measured bbox out to the corner of the stage and takes the ring with it. */
  const boardParts = () => [...board.links.map(l => l.el), ...board.nodes.map(n => n.el), nums];

  let wired = 0;
  const drawn = new Map();                        // pair number → { line, numeral }
  function addLink(ai, bi){
    const pair = PAIRS.find(p => (p.a === ai && p.b === bi) || (p.a === bi && p.b === ai));
    if (!pair || drawn.has(pair.n)) return;
    const line = board.linkExists(`g${ai}`, `g${bi}`)
      ? board.links.find(l => (l.a === `g${ai}` && l.b === `g${bi}`) || (l.a === `g${bi}` && l.b === `g${ai}`)).el
      : board.drawLink(`g${ai}`, `g${bi}`).el;
    const t = svgEl('text', { x: pair.x, y: pair.y, class: 'lbl-strong' });
    t.textContent = String(pair.n);
    nums.appendChild(t);
    drawn.set(pair.n, { line, numeral: t });
    wired = drawn.size;
    chipVal().textContent = String(wired);
  }

  /* one link, drawn for them, so "link" is a thing on the stage before it is a word */
  addLink(0, 1);
  const first = drawn.get(1);

  guide.say(`Four of them, spread out so you can see the wiring. This line is one
    <b>link</b>: a wire from GPU 1 to GPU 2, with nothing in between.`);
  // document order: the link layer sits below the node layer inside board.g, and nums
  // was appended after board.g. clearFocus restores back to front and needs that order.
  stage.focus([first.line, board.nodes[0].el, board.nodes[1].el, first.numeral],
    { label: 'one link', at: 'top' });
  await guide.next();

  guide.say(`Now every pair gets a link of its own. That is called <b>all-to-all</b>. No
    message passes through a middleman.`);
  stage.focus(boardParts(), { label: 'all-to-all', at: 'bottom' });
  await guide.next();

  /* ================= SCENE B — wire it, and count what it took ================= */

  /* no focus during the interaction: stage.focus re-parents what it raises, and the
     wiring listeners live on the node groups it would move (VERIFY_HARNESS.md §4b) */
  stage.clearFocus();

  guide.say(`Click a GPU, then click a second one, to link them.
    <b>Your goal: leave no pair without a link.</b>`);

  const settle = () => {
    PAIRS.forEach(p => addLink(p.a, p.b));
    hint.textContent = '';
  };

  await flow.ask(async replay => {
    if (replay !== undefined){ settle(); return replay; }
    board.enableWiring((a, b) => {
      addLink(Number(a.slice(1)), Number(b.slice(1)));
      SFX.hop();
      if (wired === 3) hint.textContent = 'TWO GPUS WITH NO LINE BETWEEN THEM';
    });
    await waitFor(() => wired >= 6, { hold: 400 });
    hint.textContent = '';
    return true;
  });

  guide.say(`Every link is numbered. Count them on the drawing: four GPUs took
    <b>six</b> links.`);
  stage.focus(boardParts(), { label: 'six links', at: 'bottom' });
  await guide.next();

  /* ================= SCENE C — the same count for 40, then 4,000 ================= */

  stage.clearFocus();
  const table = svgEl('g');
  svg.appendChild(table);
  const cell = (x, y, txt, cls, size) => {
    const t = svgEl('text', { x, y, class: cls });
    t.style.textAnchor = 'end';                  // CSS .lbl* beats the presentation attr
    if (size) t.style.fontSize = size;
    t.textContent = txt;
    table.appendChild(t);
    return t;
  };
  cell(TABLE.colA, TABLE.head, 'GPUs', 'lbl-faint');
  cell(TABLE.colB, TABLE.head, 'LINKS', 'lbl-faint');
  table.appendChild(svgEl('line', {
    x1: 455, y1: TABLE.head + 12, x2: TABLE.colB, y2: TABLE.head + 12, class: 'wire dim',
  }));

  const rowG = ROWS.map((r, i) => {
    const g = svgEl('g');
    table.appendChild(g);
    const mk = (x, txt) => {
      const t = svgEl('text', { x, y: TABLE.row[i], class: 'lbl-strong' });
      t.style.textAnchor = 'end';
      t.style.fontSize = '16px';
      t.textContent = txt;
      g.appendChild(t);
    };
    mk(TABLE.colA, r.gpus);
    mk(TABLE.colB, r.links);
    g.style.display = 'none';
    return g;
  });

  await fadeIn([rowG[0]], 300);

  guide.say(`Write that down. Four GPUs, six links. Now take five of those nodes, which is
    forty GPUs, and wire them the same way.`);
  stage.focus(rowG[0], { label: '4 gpus', at: 'left' });
  const guess = await guide.choose([
    { label: '60 links', value: 'sixty', hint: 'ten times the GPUs' },
    { label: '780 links', value: 'right' },
    { label: '1,600 links', value: 'square' },
  ]);

  stage.clearFocus();
  await fadeIn([rowG[1]], 300);
  guide.say(guess === 'right'
    ? `780, yes. Ten times the GPUs, and 130 times the links.`
    : `780. Ten times the GPUs, and 130 times the links.`);
  stage.focus(rowG[1], { label: '40 gpus', at: 'left' });
  await guide.next();

  stage.clearFocus();
  await fadeIn([rowG[2]], 300);
  guide.say(`Four thousand GPUs is a little over sixty of the racks you built. All-to-all
    would need <b>7,998,000</b> links.`);
  stage.focus(rowG[2], { label: '4,000 gpus', at: 'left' });
  await guide.next();

  /* ================= SCENE D — only now, the rule ================= */

  stage.clearFocus();
  const rule = svgEl('g');
  svg.appendChild(rule);
  const ruleT = svgEl('text', { x: 559, y: 348, class: 'lbl-strong' });
  ruleT.style.fontSize = '20px';
  ruleT.textContent = 'n(n−1)/2';
  const checkT = svgEl('text', { x: 559, y: 374, class: 'lbl' });
  checkT.textContent = '4 × 3 / 2 = 6';
  rule.append(ruleT, checkT);
  await fadeIn([rule], 300);

  guide.say(`Now the rule. Each GPU needs a link to the other n−1. Every link gets counted
    from both ends, so halve it.`);
  stage.focus(rule, { label: 'the rule', at: 'top' });
  await guide.next();

  stage.clearFocus();
  guide.aha(`Links grow faster than machines. Four GPUs need 6 links. Four thousand need
    <b>7,998,000</b>.`,
    `All-to-all stops at the edge of one box. Connecting racks and rooms to each other
     needs a different shape of wiring.`);
  stage.focus([table, rule], { label: 'all-to-all links', at: 'bottom' });
  await guide.next();
}
