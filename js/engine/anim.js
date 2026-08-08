// BYODC engine — single shared rAF ticker + a promise-returning tween
import { RM, isInstant } from './util.js';

const tickers = new Set();
let raf = null, last = 0;

function loop(t){
  raf = requestAnimationFrame(loop);
  const dt = Math.min(.05, (t - last) / 1000); last = t;
  tickers.forEach(fn => fn(dt, t / 1000));
}

export const Anim = {
  add(fn){
    tickers.add(fn);
    if (!raf && !RM){ last = performance.now(); raf = requestAnimationFrame(loop); }
    return fn;
  },
  remove(fn){
    tickers.delete(fn);
    if (!tickers.size && raf){ cancelAnimationFrame(raf); raf = null; }
  },
  clear(){
    tickers.clear();
    if (raf){ cancelAnimationFrame(raf); raf = null; }
  },

  /* tween(dur, onUpdate) — drives onUpdate(p) with p from 0 to 1 on the shared
     ticker and resolves when it lands on 1. While the flow is replaying (or
     reduced motion is on) it calls onUpdate(1) once and resolves immediately,
     so a step's end state is identical whether it was played or replayed. */
  tween(dur, onUpdate, ease = easeOut){
    if (isInstant() || RM || dur <= 0){ onUpdate(1); return Promise.resolve(); }
    return new Promise(res => {
      let t = 0;
      const fn = dt => {
        t += dt * 1000;
        const p = Math.min(1, t / dur);
        onUpdate(ease(p));
        if (p >= 1){ Anim.remove(fn); res(); }
      };
      Anim.add(fn);
    });
  },
};

export const easeOut = p => 1 - Math.pow(1 - p, 3);
export const easeInOut = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
