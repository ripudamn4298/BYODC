// BYODC — Act 4: "The GPU: machines built for mathematics".
// The ladder: eight adders at once (race) → how a chip multiplies (mac) → registers
// (registers) → move the data, not the weights (weights) → match memory to compute (feed)
// → assemble the GPU (gpu). One general machine doing one sum at a time becomes thousands
// of copies of one sum, and most of the work turns out to be delivering the numbers.
import { step1 } from './step1.js';
import { step2 } from './step2.js';
import { step3 } from './step3.js';
import { step4 } from './step4.js';
import { step5 } from './step5.js';
import { step6 } from './step6.js';

export const ACT4_BASE_COST = 14000.0105;   // everything through Act 3

// Six steps since the micro-learning makeover (DESIGN_MAKEOVER.md §5): the old
// "stationary trick" was two lessons under one number and is now steps 3 and 4.
// Its $260,000 splits into $60,000 + $200,000, so the act still ends at $2.43M.
export const ACT4 = [
  {
    id: 'race',
    title: 'Eight adders at once',
    costDelta: 40000,
    inventory: 'a 16-lane compute block',
    businessCard: {
      company: 'Nanovolt Graphics',
      location: 'NEW DESIGN CENTRE, SANTA CLARA, CALIFORNIA',
      revenue: '$28B / YR',
      body: 'A games studio placed the first order. An image is a long list of numbers, and this block adds long lists fast.',
      cost: 'THIS DESIGN STUDY: $40,000',
    },
    premise: `Your lanes can add. Almost all of the arithmetic in an AI model is one other move: <b>multiply two numbers, then add the result onto a running total</b>. Next you build that move, starting from a multiplication you already know the answer to.`,
    cta: 'See how a chip multiplies ▸',
    run: step1,
  },
  {
    id: 'mac',
    title: 'How a chip multiplies',
    costDelta: 120000,
    inventory: 'a multiply-accumulate engine',
    businessCard: {
      company: 'Nanovolt Graphics',
      location: 'TENSOR MATH GROUP, SANTA CLARA, CALIFORNIA',
      revenue: '$44B / YR',
      body: 'The maths team settled the precision question. A multiplier\'s area is its bit-width times its bit-width, so halving the width buys four times as many engines in the same space.',
      cost: 'THIS MULTIPLY ENGINE: $120,000',
    },
    premise: `Your engine can multiply. It still has to be handed its numbers every cycle, and those numbers have to wait somewhere in the meantime. Next: where they wait, and what fetching them costs.`,
    cta: 'See where the numbers are stored ▸',
    run: step2,
  },
  {
    id: 'registers',
    title: 'Registers: where numbers are stored',
    costDelta: 60000,
    inventory: 'a register file and the mux that reads it',
    businessCard: {
      company: 'Nanovolt Graphics',
      location: 'ARCHITECTURE LAB, SANTA CLARA',
      revenue: '$52B / YR',
      body: 'The lab measured the delivery bill: about 180 gates to fetch the numbers against 35 to compute with them. Every processor built so far has paid that on every operation.',
      cost: 'THIS REGISTER FILE: $60,000',
    },
    premise: `Five gates of delivery for every gate of maths, paid on every cycle. In AI one of the two numbers barely changes from cycle to cycle, so the next step stops fetching it at all.`,
    cta: 'Stop re-fetching the weights ▸',
    run: step3,
  },
  {
    id: 'weights',
    title: 'Move the data, not the weights',
    costDelta: 200000,
    inventory: 'a systolic tensor engine',
    businessCard: {
      company: 'Nanovolt Graphics',
      location: 'ARCHITECTURE LAB, SANTA CLARA AND TAIPEI',
      revenue: '$61B / YR',
      body: 'Patent filing 4,410 covers a compute cell that keeps its weight in place. Only the data crosses the array now, so the same silicon does far more arithmetic per number fetched.',
      cost: 'THIS SYSTOLIC ENGINE: $200,000',
    },
    premise: `Inside the array the numbers barely move. One level up, the same problem is waiting: the whole chip is one engine, and its memory sits off to the side. Next you make delivery match what the lanes ask for.`,
    cta: 'Match memory to compute ▸',
    run: step4,
  },
  {
    id: 'feed',
    title: 'Match memory to compute',
    costDelta: 500000,
    inventory: 'compute and memory, matched',
    businessCard: {
      company: 'Nanovolt Graphics',
      location: 'HBM PROGRAMME, HSINCHU AND ICHEON',
      revenue: '$61B / YR',
      body: 'The memory now sits in stacks on the package, wired through thousands of vias drilled straight through the silicon. Delivery finally matches what the lanes ask for.',
      cost: 'THIS MEMORY SUBSYSTEM: $500,000',
    },
    premise: `Compute and memory match. Put them in one package, run every connection as short as it will go, and drop a lid on top, because billions of switches flipping billions of times a second makes a lot of heat.`,
    cta: 'Assemble the GPU ▸',
    run: step5,
  },
  {
    id: 'gpu',
    title: 'Assemble the GPU',
    costDelta: 1500000,
    inventory: 'a GPU, your machine for mathematics',
    businessCard: {
      company: 'Nanovolt AI',
      location: 'SANTA CLARA, CALIFORNIA',
      revenue: '$92B / YR',
      body: 'The first GPU shipped this quarter. Researchers are ordering it to train models that were too slow to attempt a year ago.',
      cost: 'THIS GPU: $1,500,000',
    },
    premise: null,
    cta: 'Finish Act 4 ▸',
    run: step6,
  },
];

const ico = inner => `<svg width="30" height="30" viewBox="0 0 34 34">${inner}</svg>`;
export const ACT4_SUMMARY = {
  eyebrow: 'ACT 4 COMPLETE',
  title: 'You built the <em>GPU</em>',
  sub: `Sixteen copies of one adder running off one instruction, a multiplier whose area is
    its precision squared, weights parked so only data moves, memory matched to what the
    lanes ask for, and the whole thing sealed under a lid:`,
  items: [
    { nm: 'Sixteen lanes, one instruction', amt: '$40,000', icon: ico(`<path d="M5 11 h24 M5 17 h24 M5 23 h24" stroke="var(--hairline-strong)" stroke-width="1"/><rect x="5" y="8" width="10" height="5" fill="var(--hairline-strong)"/><rect x="5" y="20" width="24" height="5" fill="var(--blue)"/>`) },
    { nm: 'Multiply engine, area is p × q', amt: '$120,000', icon: ico(`<g fill="var(--blue)">${[0,1,2,3].map(r=>[0,1,2,3].map(c=>`<circle cx="${8+c*6}" cy="${8+r*6}" r="2"/>`).join('')).join('')}</g>`) },
    { nm: 'Register file, and its delivery bill', amt: '$60,000', icon: ico(`<g fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.1">${[0,1,2,3].map(r=>`<rect x="6" y="${6+r*7}" width="16" height="5" rx="1"/>`).join('')}</g><path d="M24 9 v16 M24 17 h5" stroke="var(--blue)" stroke-width="1.3" fill="none"/>`) },
    { nm: 'Systolic array, weights parked', amt: '$200,000', icon: ico(`<g fill="var(--blue-soft)" stroke="var(--blue)" stroke-width=".9">${[0,1].map(r=>[0,1].map(c=>`<rect x="${8+c*10}" y="${5+r*10}" width="8" height="8" rx="1"/>`).join('')).join('')}</g><path d="M17 26 v5 M14 28 l3 3 3-3" stroke="var(--amber)" stroke-width="1.3" fill="none"/>`) },
    { nm: 'Memory matched to compute', amt: '$500,000', icon: ico(`<rect x="13" y="6" width="8" height="22" rx="1.5" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.2"/><rect x="5" y="9" width="6" height="16" rx="1.5" fill="var(--amber-soft)" stroke="var(--amber)" stroke-width="1"/><rect x="23" y="9" width="6" height="16" rx="1.5" fill="var(--amber-soft)" stroke="var(--amber)" stroke-width="1"/>`) },
    { nm: 'The GPU', amt: '$1,500,000', icon: ico(`<rect x="6" y="6" width="22" height="22" rx="2" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.3"/><rect x="11" y="11" width="12" height="12" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1"/><path d="M6 12 h-3 M6 17 h-3 M6 22 h-3 M28 12 h3 M28 17 h3 M28 22 h3" stroke="var(--ink-soft)" stroke-width="1"/>`) },
  ],
  totalNote: ', one chip family worth more than most companies',
  locked: { title: 'ACT 5 · The Data Centre: your own supercluster', note: 'now buy ten thousand of them and make them think as one' },
  next: { label: 'Continue to Act 5 ▸' },
  debrief: {
    eyebrow: 'ACT 4 · DEBRIEF',
    title: 'The GPU, <em>cleared</em>',
    paras: [
      `For maths on lists, many simple lanes beat one fast processor. You built the multiply
       and add that every lane runs, found that a multiplier's area is the <b>square</b> of
       its precision, parked the weights so only data had to move, matched memory to what
       the lanes could eat, and sealed the result under a cooler. The surprise of this act
       is how much of it was delivery rather than arithmetic.`,
      `<em>Next: one of these is fast. Ten thousand of them, wired to work as a single
       machine, is a data centre, and a purchase the size of a small nation's budget.</em>`,
    ],
  },
};
