// BYODC art — the beat of a systolic array (REVIEW_NOTES N-062 / N-063, the picture beside 4.4's
// numbers box). Ripu: a clock beat, numbers moving in and out, beat, in and out; placed on the
// numbers page so it carries the box's point: the weights stay, only the data crosses the
// border, and the bigger the array the more multiplies each crossing buys.
//
// A 4 by 4 array, weight-stationary, as Google's TPU is: every engine holds a parked weight.
// On each beat of the clock, every data number steps one engine to the right (each row starts
// one beat after the row above, the skew that keeps the sums in step), each engine multiplies
// the number in front of it by its weight and adds the result to the total coming down from
// above, and finished totals drop out of the bottom. Counters under the clock count, beat by
// beat, the multiplies done and the numbers crossing the border; they settle at 16 and 8,
// which is 2 multiplies per crossing for N = 4, the box's N ÷ 2. The ladder repeats the box's
// sizes, and the two amber bars (power) are its 7,500 W against 40 W, on one scale.
//
// The motion is decoration, a function of the clock only (Anim.add), so nothing is recorded;
// with reduced motion the ticker never runs and the first frame shows the array mid-stream.
import { svgEl } from '../engine/util.js';
import { Anim } from '../engine/anim.js';

const N = 4, CELL = 50, PAD = 8, PITCH = CELL + PAD;
const GX = 196, GY = 98;                              // the array's top-left corner
const GW = N * PITCH - PAD;
const BEAT = 1.0;                                     // seconds per beat on screen
const CLK = { x: 88, y: 150, r: 40 };
const WEIGHTS = [[2, 0, 1, 3], [1, 3, 2, 0], [3, 1, 0, 2], [0, 2, 3, 1]];
const digit = (k, r) => ((k * 7 + r * 3 + 1) % 9) + 1;   // the data stream, fixed
const ease = f => (f < .5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2);

export async function systolicArt(root){
  const add = html => { const g = svgEl('g'); g.innerHTML = html; root.appendChild(g); return g; };
  add(`<text x="360" y="44" class="lbl" style="fill:var(--ink)">THE BEAT OF A SYSTOLIC ARRAY: THE WEIGHTS STAY, THE DATA MOVES</text>`);

  /* the clock: a face, twelve ticks, one hand that steps once a beat */
  let ticks = '';
  for (let i = 0; i < 12; i++){
    const a = i * Math.PI / 6, r0 = i % 3 ? CLK.r - 6 : CLK.r - 10;
    ticks += `<line x1="${(CLK.x + r0 * Math.sin(a)).toFixed(1)}" y1="${(CLK.y - r0 * Math.cos(a)).toFixed(1)}" x2="${(CLK.x + (CLK.r - 2) * Math.sin(a)).toFixed(1)}" y2="${(CLK.y - (CLK.r - 2) * Math.cos(a)).toFixed(1)}" stroke="var(--ink)" stroke-width="${i % 3 ? 1 : 2}"/>`;
  }
  add(`<circle cx="${CLK.x}" cy="${CLK.y}" r="${CLK.r}" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="2"/>${ticks}
    <text x="${CLK.x}" y="${CLK.y + CLK.r + 18}" class="lbl" font-size="9" style="fill:var(--ink)">CLOCK</text>`);
  const pulse = add(`<circle cx="${CLK.x}" cy="${CLK.y}" r="${CLK.r}" fill="none" stroke="var(--ink)" stroke-width="1.5"/>`);
  const hand = add(`<line x1="${CLK.x}" y1="${CLK.y + 6}" x2="${CLK.x}" y2="${CLK.y - CLK.r + 9}" stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="${CLK.x}" cy="${CLK.y}" r="3.4" fill="var(--ink)"/>`);
  const beatT = add(`<text x="${CLK.x}" y="${CLK.y + CLK.r + 32}" class="lbl-faint" font-size="8">BEAT 0</text>`).firstChild;

  /* the counters, under the clock */
  const cnt = add(`<text x="${CLK.x}" y="252" class="lbl-faint" font-size="7.5">THIS BEAT</text>
    <text class="c-mul" x="${CLK.x}" y="274" style="font-family:var(--font-display);font-size:22px;text-anchor:middle;fill:var(--blue)">0</text>
    <text x="${CLK.x}" y="288" class="lbl-faint" font-size="7.5">MULTIPLIES</text>
    <text class="c-cross" x="${CLK.x}" y="314" style="font-family:var(--font-display);font-size:22px;text-anchor:middle;fill:var(--ink)">0</text>
    <text x="${CLK.x}" y="328" class="lbl-faint" font-size="7.5">NUMBERS CROSS</text>
    <text x="${CLK.x}" y="339" class="lbl-faint" font-size="7.5">THE BORDER</text>`);
  const cMul = cnt.querySelector('.c-mul'), cCross = cnt.querySelector('.c-cross');

  /* the array: engines with parked weights; a dashed border, which only the data crosses */
  let cells = '';
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++){
    const x = GX + c * PITCH, y = GY + r * PITCH;
    cells += `<g class="sa-cell" data-rc="${r}${c}">
      <rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="5" fill="var(--paper-high)" stroke="var(--hairline-strong)"/>
      <rect x="${x + 5}" y="${y + 5}" width="17" height="17" rx="2" fill="none" stroke="var(--ink)" stroke-width="1.2"/>
      <text x="${x + 13.5}" y="${y + 17.5}" class="lbl" font-size="10" style="fill:var(--ink);letter-spacing:0">${WEIGHTS[r][c]}</text>
      <text class="sa-glyph" x="${x + CELL - 13}" y="${y + 18}" font-size="10" style="font-family:var(--font-mono);text-anchor:middle;fill:var(--ink-faint)">×+</text></g>`;
  }
  add(`<rect x="${GX - 8}" y="${GY - 8}" width="${GW + 16}" height="${GW + 16}" rx="8" fill="none" stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="5 4"/>
    ${cells}
    <text x="${GX + GW / 2}" y="${GY - 16}" class="lbl-faint" font-size="7.5">EVERY MAC UNIT KEEPS ITS WEIGHT (THE SMALL BOX)</text>
    <text x="${GX - 14}" y="${GY + GW + 50}" class="lbl-faint" font-size="7.5" text-anchor="start">DATA STEPS IN FROM THE LEFT · ANSWERS DROP OUT OF THE BOTTOM</text>`);
  const glyphs = [...root.querySelectorAll('.sa-glyph')];
  const moving = add('');

  /* the box's point, on the right */
  const RX = 456;
  add(`<text x="${RX}" y="108" class="lbl" font-size="8.5" text-anchor="start" style="fill:var(--ink)">EVERY BEAT, ONCE IT IS FULL:</text>
    <text x="${RX}" y="126" class="lbl" font-size="8" text-anchor="start" style="fill:var(--ink-soft)">16 MULTIPLIES ÷ 8 CROSSINGS</text>
    <text x="${RX}" y="140" class="lbl" font-size="8" text-anchor="start" style="fill:var(--ink)">= 2 MULTIPLIES PER CROSSING</text>
    <text x="${RX}" y="170" class="lbl" font-size="8.5" text-anchor="start" style="fill:var(--ink)">BIGGER ARRAYS BUY MORE:</text>
    ${[['2 × 2 (YOURS)', '1'], ['4 × 4 (THIS ONE)', '2'], ['128 × 128', '64'], ['256 × 256 (GOOGLE TPU)', '128']].map(([a, b], i) =>
      `<text x="${RX}" y="${188 + i * 15}" class="lbl" font-size="8" text-anchor="start" style="fill:var(--ink-soft)">${a}</text>
       <text x="${RX + 240}" y="${188 + i * 15}" class="lbl" font-size="8" text-anchor="end" style="fill:var(--ink)">${b}</text>`).join('')}
    <text x="${RX + 240}" y="254" class="lbl-faint" font-size="7" text-anchor="end">MULTIPLIES PER CROSSING</text>`);

  /* the power, on one scale: amber is power */
  const PX = 196, PW = 500, BIG = 7500;
  add(`<text x="${PX}" y="400" class="lbl" font-size="8" text-anchor="start" style="fill:var(--ink)">GOOGLE'S TPU, FETCHING A FRESH WEIGHT FOR EVERY MULTIPLY: ABOUT 7,500 W</text>
    <rect x="${PX}" y="406" width="${PW}" height="12" rx="2" fill="var(--amber)" opacity=".85"/>
    <text x="${PX}" y="436" class="lbl" font-size="8" text-anchor="start" style="fill:var(--ink)">THE SAME TPU, WEIGHTS PARKED: ABOUT 40 W</text>
    <rect x="${PX}" y="442" width="${(PW * 40 / BIG).toFixed(1)}" height="12" rx="1" fill="var(--amber)"/>
    <line x1="${PX}" y1="402" x2="${PX}" y2="458" stroke="var(--ink)" stroke-width="1"/>`);

  /* one frame at time T, in beats */
  const render = T => {
    const b = Math.floor(T), f = T - b, e = ease(Math.min(1, f / .55));
    let html = '';
    const busy = new Set();
    for (let r = 0; r < N; r++){
      // data item k of row r sits at column b - k - r, moving in from column - 1 during the beat
      for (let k = Math.max(0, b - r - N - 1); k <= b - r + 1; k++){
        const pos = (b - k - r - 1) + e;
        if (pos < -1 || pos > N) continue;
        // the data never leaves through the border: past the last engine it stops and fades
        const x = GX + Math.min(pos, N - 1) * PITCH + CELL / 2, y = GY + r * PITCH + CELL - 13;
        const op = pos < 0 ? Math.max(0, pos + 1) : pos > N - 1 ? Math.max(0, 1 - (pos - (N - 1)) * 2.5) : 1;
        if (pos > -.2 && pos < N - .1) busy.add(`${r}${Math.round(pos)}`);
        html += `<g opacity="${op.toFixed(2)}"><rect x="${(x - 11).toFixed(1)}" y="${(y - 9).toFixed(1)}" width="22" height="18" rx="4" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.2"/>
          <text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" style="font-family:var(--font-mono);font-size:10px;text-anchor:middle;fill:var(--blue)">${digit(k, r)}</text></g>`;
      }
    }
    // answers: the total for item k in column c leaves the bottom at beat k + N + c
    for (let c = 0; c < N; c++) for (let k = Math.max(0, b - N - c - 1); k <= b - N - c; k++){
      const pos = (b - k - N - c) + e;
      if (pos < 0 || pos > 1) continue;
      const x = GX + c * PITCH + CELL / 2, y = GY + GW + 6 + 20 * pos;
      html += `<g opacity="${(1 - pos).toFixed(2)}"><rect x="${x - 12}" y="${y.toFixed(1)}" width="24" height="16" rx="4" fill="var(--ink)"/>
        <text x="${x}" y="${(y + 11.5).toFixed(1)}" style="font-family:var(--font-mono);font-size:9px;text-anchor:middle;fill:var(--paper-high)">Σ</text></g>`;
    }
    moving.innerHTML = html;
    glyphs.forEach(g => {
      const on = busy.has(g.parentNode.dataset.rc);
      g.style.fill = on ? 'var(--blue)' : 'var(--ink-faint)';
      g.style.fontWeight = on ? '600' : '400';
    });
    // the clock: the hand steps at the start of each beat, and the rim pulses
    const snap = Math.min(1, f / .15);
    hand.setAttribute('transform', `rotate(${((b - 1 + snap) * 30).toFixed(1)} ${CLK.x} ${CLK.y})`);
    pulse.setAttribute('transform', `translate(${CLK.x} ${CLK.y}) scale(${(1 + .25 * f).toFixed(3)}) translate(${-CLK.x} ${-CLK.y})`);
    pulse.style.opacity = Math.max(0, 1 - f * 2.2).toFixed(2);
    beatT.textContent = `BEAT ${b}`;
    // the counters, counted from the stream itself
    let mul = 0, cross = 0;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (b - r - c >= 0) mul++;
    for (let r = 0; r < N; r++) if (b - r >= 0) cross++;               // data in at the left edge
    for (let c = 0; c < N; c++) if (b - N - c >= 0) cross++;           // answers out at the bottom
    cMul.textContent = String(mul);
    cCross.textContent = String(cross);
  };

  render(12);                                        // a full array, for reduced motion
  let t0 = null;
  Anim.add((dt, t) => {
    if (t0 === null) t0 = t;
    render((t - t0) / BEAT);
  });
}
