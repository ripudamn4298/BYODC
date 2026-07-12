// BYODC — Act 4: "The GPU: machines built for mathematics".
// The ladder: the marching band (race) → the multiply engine (mac) → the stationary trick
// (systolic) → feed the beast (feed) → assemble the NV-1 (nv1). One heartbeat is a CPU. AI's
// math needs ten thousand identical workers marching in step — and a machine built to multiply.
import { step1 } from './step1.js';
import { step2 } from './step2.js';
import { step3 } from './step3.js';
import { step4 } from './step4.js';
import { step5 } from './step5.js';

export const ACT4_BASE_COST = 14000.0105;   // everything through Act 3

export const ACT4 = [
  {
    id: 'race',
    title: 'The marching band',
    costDelta: 40000,
    inventory: 'a 16-lane compute block',
    businessCard: {
      company: 'Nanovolt Graphics',
      location: 'NEW DESIGN CENTRE — SANTA CLARA, CALIFORNIA',
      revenue: '$28B / YR',
      body: 'A games studio called first — pixels are just long lists of numbers, and long lists are exactly what a crowd of simple adders eats for breakfast. The word "accelerator" is on every whiteboard.',
      cost: 'THIS DESIGN STUDY: $40,000',
    },
    premise: `One clever worker doing sums one at a time is a CPU — and it's very good at it. But hand it a <em>list</em> of a million numbers and it's slow. The answer isn't a faster worker. It's <b>many simple workers</b>, all adding at once.`,
    cta: 'Stamp the lanes ▸',
    run: step1,
  },
  {
    id: 'mac',
    title: 'The multiply engine',
    costDelta: 120000,
    inventory: 'a multiply-accumulate engine',
    businessCard: {
      company: 'Nanovolt Graphics',
      location: 'TENSOR MATH GROUP — SANTA CLARA, CALIFORNIA',
      revenue: '$44B / YR',
      body: 'The maths team taped a memo to the fridge: "area is p times q — stop paying for bits nobody needs." Legal wanted it framed. Finance wanted it tattooed.',
      cost: 'THIS MULTIPLY ENGINE: $120,000',
    },
    premise: `Open any AI model and look at the arithmetic: it is one operation, repeated trillions of times — <b>multiply two numbers, add the result onto a pile</b>. Whole data centres exist to do that one move fast. Time to build the move itself.`,
    cta: 'Meet the data-movement bill ▸',
    run: step2,
  },
  {
    id: 'systolic',
    title: 'The stationary trick',
    costDelta: 260000,
    inventory: 'a systolic tensor engine',
    businessCard: {
      company: 'Nanovolt Graphics',
      location: 'ARCHITECTURE LAB — SANTA CLARA & TAIPEI',
      revenue: '$61B / YR',
      body: 'Patent filing 4,410: "compute cell with resident operand." The lawyers called it a modest claim. The competition will call it the worst thing that ever happened to them.',
      cost: 'THIS SYSTOLIC ENGINE: $260,000',
    },
    premise: `You've silenced the traffic <em>inside</em> the block. But zoom out one level and the same law is waiting: the whole chip is one engine, and its register file is a tower of memory chips sitting off-die. Same disease, bigger anatomy — and the cure is going to cost you.`,
    cta: 'Feed the beast ▸',
    run: step3,
  },
  {
    id: 'feed',
    title: 'Feed the beast',
    costDelta: 500000,
    inventory: 'compute and memory, balanced',
    businessCard: {
      company: 'Nanovolt Graphics',
      location: 'HBM PROGRAMME — HSINCHU & ICHEON',
      revenue: '$61B / YR',
      body: 'You stacked the memory right on top of the package, wired through thousands of vias drilled clean through silicon. Supply now (almost) keeps up with appetite. Almost.',
      cost: 'THIS MEMORY SUBSYSTEM: $500,000',
    },
    premise: `Compute and memory, finally in balance. Now bolt them together into one package and drop a cooler on top — because billions of switches flipping billions of times a second is no longer a tiny amount of heat. It's a <b>lot</b>. Time to assemble the whole machine.`,
    cta: 'Assemble the NV-1 ▸',
    run: step4,
  },
  {
    id: 'nv1',
    title: 'Assemble the NV-1',
    costDelta: 1500000,
    inventory: 'a GPU — your machine for mathematics',
    businessCard: {
      company: 'Nanovolt AI',
      location: 'SANTA CLARA, CALIFORNIA',
      revenue: '$92B / YR',
      body: 'The NV-1 Tensor taped out clean. Researchers who\'d never heard of you last year are now on a waiting list. Someone in the press keeps calling it "the engine of the AI boom." You let them.',
      cost: 'THIS GPU: $1,500,000',
    },
    premise: null,
    cta: 'Finish Act 4 ▸',
    run: step5,
  },
];

const ico = inner => `<svg width="30" height="30" viewBox="0 0 34 34">${inner}</svg>`;
export const ACT4_SUMMARY = {
  eyebrow: 'ACT 4 COMPLETE',
  title: 'You built the engine <em>of the AI boom</em>',
  sub: `A race won by the crowd, a multiply engine whose area is the square of its precision,
    weights parked so the data can pulse through, memory stacked to feed it, and the whole
    furnace sealed into a package. Graphics, physics, AI — one machine, one move:`,
  items: [
    { nm: 'The parallel insight (race)', amt: '$40,000', icon: ico(`<path d="M5 11 h24 M5 17 h24 M5 23 h24" stroke="var(--hairline-strong)" stroke-width="1"/><rect x="5" y="8" width="10" height="5" fill="var(--hairline-strong)"/><rect x="5" y="20" width="24" height="5" fill="var(--blue)"/>`) },
    { nm: 'Multiply engine — area is p×q', amt: '$120,000', icon: ico(`<g fill="var(--blue)">${[0,1,2,3].map(r=>[0,1,2,3].map(c=>`<circle cx="${8+c*6}" cy="${8+r*6}" r="2"/>`).join('')).join('')}</g>`) },
    { nm: 'Systolic array — weights sit still', amt: '$260,000', icon: ico(`<g fill="var(--blue-soft)" stroke="var(--blue)" stroke-width=".9">${[0,1].map(r=>[0,1].map(c=>`<rect x="${8+c*10}" y="${5+r*10}" width="8" height="8" rx="1"/>`).join('')).join('')}</g><path d="M17 26 v5 M14 28 l3 3 3-3" stroke="var(--amber)" stroke-width="1.3" fill="none"/>`) },
    { nm: 'Balanced memory (HBM)', amt: '$500,000', icon: ico(`<rect x="13" y="6" width="8" height="22" rx="1.5" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.2"/><rect x="5" y="9" width="6" height="16" rx="1.5" fill="var(--amber-soft)" stroke="var(--amber)" stroke-width="1"/><rect x="23" y="9" width="6" height="16" rx="1.5" fill="var(--amber-soft)" stroke="var(--amber)" stroke-width="1"/>`) },
    { nm: 'NV-1 Tensor GPU', amt: '$1,500,000', icon: ico(`<rect x="6" y="6" width="22" height="22" rx="2" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.3"/><rect x="11" y="11" width="12" height="12" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1"/><path d="M6 12 h-3 M6 17 h-3 M6 22 h-3 M28 12 h3 M28 17 h3 M28 22 h3" stroke="var(--ink-soft)" stroke-width="1"/>`) },
  ],
  totalNote: ' — one chip family worth more than most companies',
  locked: { title: 'ACT 5 — The Data Centre: your own supercluster', note: 'now buy ten thousand of them and make them think as one' },
  next: { label: 'Continue to Act 5 ▸' },
  debrief: {
    eyebrow: 'ACT 4 · DEBRIEF',
    title: 'The GPU — <em>cleared</em>',
    paras: [
      `You learned the one idea that runs all of modern AI: for math on <em>lists</em> — pixels, weights, tokens — many simple lanes running at once beat one fast processor. You built the multiply-accumulate they all run, learned why its area is the <b>square</b> of the precision, parked the weights so the data could pulse through, then fed it, cooled it, and sealed it into a package. <b>Graphics, physics, and AI are the same arithmetic, done in parallel.</b>`,
      `Nanovolt is now a name the whole industry watches. <em>Next: one of these is powerful. Ten thousand of them, wired to work as a single machine, is a data centre — and a purchase the size of a small nation's budget.</em>`,
    ],
  },
};
