// BYODC engine — shared utilities
export const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const $ = s => document.querySelector(s);
export const NS = 'http://www.w3.org/2000/svg';
/* ---------- deterministic randomness ----------
   Steps are held to "a replay must land where the live run landed", and the engine
   has to hold itself to it too. `rand` draws from a seeded stream that flow.start
   resets at the top of every run, so the same step always draws the same sequence.
   `noise` is for decorative motion: it is a pure function of (identity, time), so
   it reproduces no matter how many frames were actually rendered — which a per-frame
   random walk cannot, since a live run ticks hundreds of times and a replay collapses. */
export function mulberry32(seed){
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let _stream = mulberry32(0x9E3779B9);
export function reseed(seed = 0x9E3779B9){ _stream = mulberry32(seed); }
export const random = () => _stream();
export const rand = (a, b) => a + _stream() * (b - a);
/* smooth deterministic noise in [-1,1] from an integer id and a continuous time */
export function noise(id, t){
  const i = Math.floor(t), f = t - i;
  const h = (n, k) => {
    let x = Math.imul((n ^ 0x27d4eb2d) + Math.imul(k, 0x9E3779B1), 0x85ebca6b);
    x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16;
    return (x >>> 0) / 2147483648 - 1;
  };
  const s = f * f * (3 - 2 * f);          // smoothstep, so the value has no kinks
  return h(id, i) * (1 - s) + h(id, i + 1) * s;
}
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// sleep() collapses to ~0 while the flow is replaying (see flow.js setInstantCheck)
let instantCheck = () => false;
export function setInstantCheck(fn){ instantCheck = fn; }
export const sleep = ms => new Promise(r => setTimeout(r, instantCheck() ? 0 : ms));
export const isInstant = () => instantCheck();

export function el(tag, attrs = {}, html){
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)){
    if (k === 'class') n.className = v; else n.setAttribute(k, v);
  }
  if (html != null) n.innerHTML = html;
  return n;
}
export function svgEl(tag, attrs = {}){
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
}
export function svgPt(svg, cx, cy){
  const p = svg.createSVGPoint(); p.x = cx; p.y = cy;
  return p.matrixTransform(svg.getScreenCTM().inverse());
}
const activeWaits = new Set();
export function cancelAllWaits(){
  activeWaits.forEach(iv => clearInterval(iv));
  activeWaits.clear();
}
export function waitFor(cond, { hold = 600, poll = 90 } = {}){
  return new Promise(res => {
    if (instantCheck()) return res();
    let since = null;
    const iv = setInterval(() => {
      if (cond()){
        if (since == null) since = Date.now();
        if (Date.now() - since >= hold){ clearInterval(iv); activeWaits.delete(iv); res(); }
      } else since = null;
    }, poll);
    activeWaits.add(iv);
  });
}
