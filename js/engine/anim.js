// BYODC engine — single shared rAF ticker
import { RM } from './util.js';

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
};
