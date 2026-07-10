// BYODC engine — shared utilities
export const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const $ = s => document.querySelector(s);
export const NS = 'http://www.w3.org/2000/svg';
export const rand = (a, b) => a + Math.random() * (b - a);
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
