// BYODC — Act 5: "The Data Centre: your own supercluster".
// The ladder: fill a rack → count the links → power and cooling → a fabric that survives
// a failure → build the site. Scale becomes geography.
import { step1 } from './step1.js';
import { step2 } from './step2.js';
import { step3 } from './step3.js';
import { step4 } from './step4.js';
import { step5 } from './step5.js';

export const ACT5_BASE_COST = 2434000.0105;   // everything through Act 4

export const ACT5 = [
  {
    id: 'rack',
    title: 'Eight GPUs to a rack',
    costDelta: 150000,
    inventory: 'a rack of 8 nodes, 64 GPUs',
    businessCard: {
      company: 'Nanovolt Cloud',
      location: 'FIRST CAMPUS, ALTOONA, IOWA',
      revenue: '$80B / YR',
      body: 'You bought farmland next to a wind corridor and a fat fibre line. One filled rack draws 56 kW, and it never drops.',
      cost: 'THIS RACK: $150,000',
    },
    premise: `One rack is eight nodes and 64 GPUs. A frontier model needs <b>thousands</b> of those GPUs working as one machine, and that only works if every GPU can reach every other. Before you wire anything, count what that costs.`,
    cta: 'Count the links ▸',
    run: step1,
  },
  {
    id: 'interconnect',
    title: 'Why you cannot wire them all together',
    costDelta: 250000,
    inventory: 'a node wired all-to-all',
    businessCard: {
      company: 'Nanovolt Cloud',
      location: 'INTERCONNECT, ALTOONA, IOWA',
      revenue: '$95B / YR',
      body: 'Inside one box the GPUs are wired straight to each other, with nothing in between. Past that box the link count grows faster than the machines do.',
      cost: 'THIS INTERCONNECT: $250,000',
    },
    premise: `All-to-all stops at the edge of one box. Before you wire a hall full of them, work out what the hall <b>draws</b>, because the power line is fixed and cooling takes a share of it before the computers get any.`,
    cta: 'Work out the power ▸',
    run: step2,
  },
  {
    id: 'power',
    title: 'Cooling costs you megawatts',
    costDelta: 30000000,
    inventory: 'a hall that can hold the line',
    businessCard: {
      company: 'Nanovolt Cloud',
      location: 'SUBSTATION & THERMAL, ALTOONA, IOWA',
      revenue: '$110B / YR',
      body: 'The utility asked how much power you wanted, then asked you to say it again. You are now water-cooling the consequences of a decision boron made back in Act 1.',
      cost: 'THIS POWER & COOLING BUILD: $30,000,000',
    },
    premise: `Power and cooling fit under the line. Now wire thousands of racks so they behave like one machine, and so that a switch failing at three in the morning <b>does not stop the job</b>.`,
    cta: 'Wire the fabric ▸',
    run: step3,
  },
  {
    id: 'network',
    title: 'Wire it so a failure does not stop it',
    costDelta: 70000000,
    inventory: 'a fabric that survives a switch failing',
    businessCard: {
      company: 'Nanovolt Cloud',
      location: 'NETWORK FABRIC, ALTOONA · DUBLIN · JURONG',
      revenue: '$180B / YR',
      body: 'Any rack reaches any other in two hops, and every rack has two ways out. At this scale something is always broken, so the fabric is built expecting it.',
      cost: 'THIS NETWORK FABRIC: $70,000,000',
    },
    premise: `The fabric holds through a bad night. Everything you have built now goes on one plot of land: two halls of racks, a substation, a cooling plant, and fibre out to the backbone.`,
    cta: 'Build the site ▸',
    run: step4,
  },
  {
    id: 'site',
    title: 'Build the site',
    costDelta: 1000000000,
    inventory: 'a data centre, your own supercluster',
    businessCard: {
      company: 'Nanovolt Cloud',
      location: 'ONLINE, YOUR CAMPUS, ON THE MAP',
      revenue: '$260B / YR',
      body: 'It is on. Somewhere in that hall is a chip, and in that chip a transistor, and in that transistor an atom you placed by hand in Act 1.',
      cost: 'THIS DATA CENTRE: $1,000,000,000',
    },
    premise: null,
    cta: 'Finish the course ▸',
    run: step5,
  },
];

const ico = inner => `<svg width="30" height="30" viewBox="0 0 34 34">${inner}</svg>`;
export const ACT5_SUMMARY = {
  eyebrow: 'THE COURSE IS COMPLETE',
  title: 'From <em>a grain of sand</em> to your own supercluster',
  sub: `A rack, a substation, a fabric that survives a switch failing, and a campus on the map
    of the world. You built every layer of it by hand:`,
  items: [
    { nm: 'Rack of 8 nodes, 64 GPUs', amt: '$150,000', icon: ico(`<rect x="11" y="4" width="12" height="26" rx="2" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.3"/><path d="M13 8 h8 M13 13 h8 M13 18 h8 M13 23 h8" stroke="var(--blue)" stroke-width="1.2"/>`) },
    { nm: 'Interconnect inside the node', amt: '$250,000', icon: ico(`<circle cx="9" cy="9" r="2.6" fill="none" stroke="var(--ink)" stroke-width="1.1"/><circle cx="25" cy="9" r="2.6" fill="none" stroke="var(--ink)" stroke-width="1.1"/><circle cx="9" cy="25" r="2.6" fill="none" stroke="var(--ink)" stroke-width="1.1"/><circle cx="25" cy="25" r="2.6" fill="none" stroke="var(--ink)" stroke-width="1.1"/><path d="M9 11.6 v10.8 M25 11.6 v10.8 M11.6 9 h10.8 M11.6 25 h10.8 M11 11 l12 12 M23 11 l-12 12" stroke="var(--blue)" stroke-width=".8"/>`) },
    { nm: 'Power and cooling (30 MW)', amt: '$30,000,000', icon: ico(`<rect x="5" y="18" width="7" height="11" fill="var(--blue)"/><rect x="14" y="12" width="7" height="17" fill="var(--amber)"/><rect x="23" y="24" width="6" height="5" fill="var(--hairline-strong)"/><path d="M17 5 l-4 7 h8 l-4 6" fill="none" stroke="var(--amber)" stroke-width="1.4"/>`) },
    { nm: 'Leaf-spine network fabric', amt: '$70,000,000', icon: ico(`<circle cx="10" cy="8" r="3" fill="none" stroke="var(--ink)" stroke-width="1.2"/><circle cx="24" cy="8" r="3" fill="none" stroke="var(--ink)" stroke-width="1.2"/><rect x="14" y="21" width="6" height="5" fill="rgba(29,33,23,.08)" stroke="var(--ink)" stroke-width="1.1"/><path d="M10 11 l7 10 M24 11 l-7 10" stroke="var(--ink)" stroke-width="1"/>`) },
    { nm: 'Data centre, online', amt: '$1,000,000,000', icon: ico(`<circle cx="17" cy="17" r="13" fill="none" stroke="var(--ink)" stroke-width="1.2"/><path d="M4 17 h26 M17 4 a19 13 0 0 1 0 26 a19 13 0 0 1 0 -26" fill="none" stroke="var(--hairline-strong)" stroke-width=".8"/><circle cx="22" cy="12" r="2.4" fill="var(--amber)"/>`) },
  ],
  totalNote: ', from a fraction of a cent to a site on the map',
  locked: { title: 'YOU BUILT ALL OF IT', note: 'sand · switch · gate · chip · GPU · supercluster' },
  next: null,
  debrief: {
    eyebrow: 'THE COURSE · DEBRIEF',
    title: 'Sand to Superclusters, <em>cleared</em>',
    paras: [
      `You doped a crystal and made a switch. You taught it to decide, to count and to remember. You printed it a billion times over, wired thousands of copies into one machine, and gave that machine a city's worth of power and a place on the map. <b>Every machine that thinks is this, and you now know it from the atom up.</b>`,
      `Nanovolt started this course doping one wafer in Penang for a fraction of a cent. It ends owning a supercluster in an Iowa cornfield. Every step was one idea wired to the next, and you did all of them by hand.`,
    ],
  },
};
