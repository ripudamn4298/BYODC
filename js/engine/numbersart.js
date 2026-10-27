// BYODC engine — the picture beside a step's real-numbers box (REVIEW_NOTES N-053).
// Ripu: at the end of a step the numbers box should not sit next to the same diagram the
// theory just used. Instead a panel slides over the stage with a real-world graphic tied to
// what the box says (1.2: a phone charger taken apart to show its diodes), and its parts
// float. A step opts in with `numbersArt: build` in its registry entry; build(g, panel) draws
// into the panel's group and may animate (Anim.tween, so a replay lands the end state).
import { slideInPanel } from './components.js';
import { svgEl } from './util.js';
import { Anim } from './anim.js';

export async function showNumbersArt(build){
  const svg = document.querySelector('#stage .stage-svg');
  if (!svg) return;
  const controls = document.querySelector('#stage .stage-controls');
  if (controls) controls.style.visibility = 'hidden';      // the step's sliders are done with
  const panel = slideInPanel(svg, '', { numbers: true });
  await panel.show();
  await build(panel.g, panel);
}

/* ---------- shared pieces for the art ---------- */

/* a part that floats: its drawing sits on an inner group (the CSS float in .tile3d) above a
   soft ground shadow. Drawn centred on (0, 0); w and h are its size, for the shadow. */
export function floatingPart(parent, html, { w, h }){
  const g = svgEl('g');
  g.innerHTML = `<ellipse class="float-shadow" cx="0" cy="${(h / 2 + 12).toFixed(1)}" rx="${(w / 2).toFixed(1)}" ry="4.5" fill="rgba(29,33,23,.16)"/>
    <g class="float-inner">${html}</g>`;
  parent.appendChild(g);
  return g;
}
export const place = (g, x, y, s = 1) => { g.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${s.toFixed(3)})`; };

/* move parts from `from` to `to` ({x, y, s}), each starting `stagger` ms after the last */
export async function flyApart(parts, { dur = 700, stagger = 80 } = {}){
  const total = dur + stagger * (parts.length - 1);
  await Anim.tween(total, q => {
    const t = q * total;
    parts.forEach((p, i) => {
      const k = Math.min(1, Math.max(0, (t - i * stagger) / dur));
      const e = 1 - (1 - k) ** 3;
      place(p.g, p.from.x + (p.to.x - p.from.x) * e, p.from.y + (p.to.y - p.from.y) * e,
        p.from.s + (p.to.s - p.from.s) * e);
    });
  }, q => q);
}
