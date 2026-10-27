// BYODC engine — the finishing moments (Ripu, 2026-10-25). When the player presses a step's
// own button, the button has already gone down and turned into a check (guide.button, cta).
// This adds the moment after it:
//   - end of a step: a short chime, a few pixel sparks off the button, and a cream band that
//     sweeps across the stage reading "STEP 1.1 COMPLETE", with one pip per step of the act;
//   - end of an act: a longer fanfare, the screen dims, "ACT 1 / COMPLETE" in large pixel type,
//     every pip lit, and a burst of pixel squares in the act's colours.
// Live clicks only (flow.js skips it on replay). Reduced motion gets the sound and a still frame.
import { SFX } from './sfx.js';
import { RM, sleep } from './util.js';

const COLS = ['#565D4C', '#2946CC', '#A8741F', '#5C6B45', '#2B2118'];

function pips(step, total, all = false){
  let s = '';
  for (let i = 1; i <= total; i++) s += `<i class="${all || i <= step ? 'on' : ''}${i === step && !all ? ' now' : ''}"></i>`;
  return `<span class="cel-pips">${s}</span>`;
}

/* small square sparks flying out from a point (page coordinates) */
function sparks(host, x, y, n, spread, size = 7){
  for (let i = 0; i < n; i++){
    const p = document.createElement('span');
    p.className = 'cel-spark';
    const a = (i / n) * Math.PI * 2 + (i % 3) * .21, d = spread * (.55 + ((i * 37) % 10) / 22);
    p.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${COLS[i % COLS.length]};`
      + `--dx:${(Math.cos(a) * d).toFixed(0)}px;--dy:${(Math.sin(a) * d - spread * .25).toFixed(0)}px;--r:${(i * 47) % 180}deg`;
    host.appendChild(p);
    setTimeout(() => p.remove(), 1400);
  }
}

export async function celebrate({ act, step, total, last }){
  const game = document.getElementById('game');
  if (!game) return;
  const btn = game.querySelector('.btn.cta-done');
  const gr = game.getBoundingClientRect();
  if (btn && !RM){
    const r = btn.getBoundingClientRect();
    sparks(game, r.left + r.width / 2 - gr.left, r.top + r.height / 2 - gr.top, last ? 22 : 12, last ? 120 : 70);
  }

  if (!last){
    SFX.stepDone();
    const stage = document.getElementById('stage');
    const sr = stage ? stage.getBoundingClientRect() : gr;
    const band = document.createElement('div');
    band.className = 'cel-band';
    band.style.cssText = `left:${sr.left - gr.left}px;width:${sr.width}px;top:${sr.top - gr.top + sr.height / 2 - 52}px`;
    band.innerHTML = `<span class="cel-check">✓</span><span class="cel-title">STEP ${act}.${step} COMPLETE</span>${pips(step, total)}`;
    game.appendChild(band);
    if (RM){ await sleep(700); band.remove(); return; }
    requestAnimationFrame(() => band.classList.add('in'));
    await sleep(1050);
    band.classList.add('out');
    await sleep(380);
    band.remove();
    return;
  }

  /* the end of an act */
  SFX.actDone();
  const over = document.createElement('div');
  over.className = 'cel-act';
  over.innerHTML = `<div class="cel-act-inner">
      <div class="cel-act-kicker">ACT ${act}</div>
      <div class="cel-act-title">COMPLETE</div>
      ${pips(total, total, true)}
    </div>`;
  game.appendChild(over);
  if (RM){ await sleep(1400); over.remove(); return; }
  requestAnimationFrame(() => over.classList.add('in'));
  await sleep(420);
  const cx = window.innerWidth / 2, cy = window.innerHeight / 2;   // the overlay is fixed to the viewport
  sparks(over, cx, cy, 48, Math.min(gr.width, 900) * .42, 10);
  await sleep(300);
  sparks(over, cx, cy, 28, Math.min(gr.width, 900) * .28, 7);
  await sleep(1700);
  over.classList.add('out');
  await sleep(520);
  over.remove();
}
