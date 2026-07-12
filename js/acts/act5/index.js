// BYODC — Act 5: "The Data Centre: your own supercluster".
// The ladder: rack → megawatts → network survival → light it up (the globe returns).
// The course comes full circle to the landing page's globe. Scale becomes geography.
import { step1 } from './step1.js';
import { step2 } from './step2.js';
import { step3 } from './step3.js';
import { step4 } from './step4.js';

export const ACT5_BASE_COST = 2434000.0105;   // everything through Act 4

export const ACT5 = [
  {
    id: 'rack',
    title: 'From one to a rack',
    costDelta: 400000,
    inventory: 'a rack — 8 nodes, 64 GPUs',
    businessCard: {
      company: 'Nanovolt Cloud',
      location: 'FIRST CAMPUS — ALTOONA, IOWA',
      revenue: '$80B / YR',
      body: 'You bought farmland next to a wind corridor and a fat fibre line. One rack draws more power than the street it sits on. This is no longer engineering — it is infrastructure, and infrastructure is geography.',
      cost: 'THIS RACK: $400,000',
    },
    premise: `A rack hums along nicely — until you realise a frontier model needs <b>thousands</b> of these GPUs acting as one brain. And the moment you connect that many machines, a new enemy appears — not heat, not defects, but the simple, brutal arithmetic of <b>power</b>.`,
    cta: 'Solve the megawatt problem ▸',
    run: step1,
  },
  {
    id: 'power',
    title: 'The megawatt problem',
    costDelta: 30000000,
    inventory: 'a hall that can hold the line',
    businessCard: {
      company: 'Nanovolt Cloud',
      location: 'SUBSTATION & THERMAL — ALTOONA, IOWA',
      revenue: '$110B / YR',
      body: 'The utility asked how much power you wanted and then asked you to say it again, slowly. You are now water-cooling the consequences of a decision boron made back in Act 1 — at the scale of a small city.',
      cost: 'THIS POWER & COOLING BUILD: $30,000,000',
    },
    premise: `Power and cooling: handled. But ten thousand GPUs in separate rooms aren't a supercluster — they're ten thousand lonely machines. To think as one, they have to <b>talk</b> — all of them, to all of them, faster than seems possible, and without ever dropping the conversation when something breaks.`,
    cta: 'Wire the network ▸',
    run: step2,
  },
  {
    id: 'network',
    title: 'One machine, many rooms',
    costDelta: 70000000,
    inventory: 'a network that survives a bad night',
    businessCard: {
      company: 'Nanovolt Cloud',
      location: 'NETWORK FABRIC — ALTOONA · DUBLIN · JURONG',
      revenue: '$180B / YR',
      body: 'You wired the halls into a fabric where any machine can reach any other in two hops — and then you wired the spares, because at this scale something is always broken. The network, it turns out, is the computer.',
      cost: 'THIS NETWORK FABRIC: $70,000,000',
    },
    premise: `Power, cooling, network — every hard problem solved in miniature. Now pour the concrete, string the fibre, and light it up. What you're about to switch on is the machine that finishes humanity's sentences. And it began, five acts ago, with a single grain of sand.`,
    cta: 'Light it up ▸',
    run: step3,
  },
  {
    id: 'lightup',
    title: 'Light it up',
    costDelta: 1000000000,
    inventory: 'a data centre — your own supercluster',
    businessCard: {
      company: 'Nanovolt Cloud',
      location: 'ONLINE — YOUR CAMPUS, ON THE MAP',
      revenue: '$260B / YR',
      body: 'It is on. Somewhere in that hall is a chip, and in that chip a transistor, and in that transistor an atom you swapped by hand in Act 1. There is a new amber dot on the map of the world tonight. It is yours.',
      cost: 'THIS DATA CENTRE: $1,000,000,000',
    },
    premise: null,
    cta: 'Finish the course ▸',
    run: step4,
  },
];

const ico = inner => `<svg width="30" height="30" viewBox="0 0 34 34">${inner}</svg>`;
export const ACT5_SUMMARY = {
  eyebrow: 'THE COURSE IS COMPLETE',
  title: 'From <em>a grain of sand</em> to your own supercluster',
  sub: `A rack, a substation, a network that survives the night, and a campus lit up on the map of
    the world. You built the machine that thinks — every layer of it, by hand:`,
  items: [
    { nm: 'Rack — 8 nodes, 64 GPUs', amt: '$400,000', icon: ico(`<rect x="11" y="4" width="12" height="26" rx="2" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.3"/><path d="M13 8 h8 M13 13 h8 M13 18 h8 M13 23 h8" stroke="var(--blue)" stroke-width="1.2"/>`) },
    { nm: 'Power & cooling (30 MW)', amt: '$30,000,000', icon: ico(`<rect x="5" y="18" width="7" height="11" fill="var(--blue)"/><rect x="14" y="12" width="7" height="17" fill="var(--amber)"/><rect x="23" y="24" width="6" height="5" fill="var(--hairline-strong)"/><path d="M17 5 l-4 7 h8 l-4 6" fill="none" stroke="var(--amber)" stroke-width="1.4"/>`) },
    { nm: 'Fat-tree network fabric', amt: '$70,000,000', icon: ico(`<circle cx="10" cy="8" r="3" fill="none" stroke="var(--ink)" stroke-width="1.2"/><circle cx="24" cy="8" r="3" fill="none" stroke="var(--ink)" stroke-width="1.2"/><rect x="14" y="21" width="6" height="5" fill="rgba(29,33,23,.08)" stroke="var(--ink)" stroke-width="1.1"/><path d="M10 11 l7 10 M24 11 l-7 10" stroke="var(--ink)" stroke-width="1"/>`) },
    { nm: 'Data centre — online', amt: '$1,000,000,000', icon: ico(`<circle cx="17" cy="17" r="13" fill="none" stroke="var(--ink)" stroke-width="1.2"/><path d="M4 17 h26 M17 4 a19 13 0 0 1 0 26 a19 13 0 0 1 0 -26" fill="none" stroke="var(--hairline-strong)" stroke-width=".8"/><circle cx="22" cy="12" r="2.4" fill="var(--amber)"/>`) },
  ],
  totalNote: ' — from a fraction of a cent to a civilization-scale machine',
  locked: { title: 'YOU BUILT ALL OF IT', note: 'sand · switch · gate · chip · GPU · supercluster' },
  next: null,
  debrief: {
    eyebrow: 'THE COURSE · DEBRIEF',
    title: 'Sand to Superclusters — <em>cleared</em>',
    paras: [
      `Look at what your hands did. You doped a crystal, built a switch, taught it to decide, to count, to remember. You printed it a billion times, wired ten thousand copies into a single mind, and gave that mind a city's worth of power and a place on the map. <b>Every machine that thinks is exactly this — and now you know it from the atom up.</b>`,
      `Nanovolt began the course doping one wafer in Penang for a fraction of a cent. It ends owning a supercluster in an Iowa cornfield. The whole climb was one honest idea, wired to the next. <em>The sand you started with is finishing your sentences now. You built that.</em>`,
    ],
  },
};
