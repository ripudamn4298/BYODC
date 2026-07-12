// BYODC — Act 1 step configs. The extensible ladder: append configs for later acts.
import { step1 } from './step1.js';
import { step2 } from './step2.js';
import { step3 } from './step3.js';
import { step4 } from './step4.js';

export const ACT1 = [
  {
    id: 'pn-semiconductor',
    title: 'Build your own P/N semiconductor',
    costDelta: 0.0004,
    inventory: 'a doped silicon wafer',
    businessCard: {
      company: 'Nanovolt Semiconductors',
      location: 'Penang, Malaysia',
      revenue: '$4M / YR',
      body: 'Your little fab on the Penang strait doped its first wafer today. Discrete components, thin margins, big dreams.',
      cost: 'THIS DOPING RUN: $0.0004 — a fraction of a fraction of a cent',
    },
    premise: `One flavor of doped silicon is, in the end, just a very obedient wire. But press <b>N against P</b> and take control of where the carriers pile up… and you get the most important invention of the 20th century: <b>a switch with no moving parts</b>.`,
    cta: 'Build a transistor ▸',
    run: step1,
  },
  {
    id: 'npn-transistor',
    title: 'Build your own transistor',
    costDelta: 0.0002,
    inventory: 'a working transistor',
    businessCard: {
      company: 'Nanovolt Semiconductors',
      location: 'NEW PACKAGING LINE — KAOHSIUNG, TAIWAN',
      revenue: '$11M / YR',
      body: 'Transistor #1 works. You are officially shipping switches by the reel, and a radio maker in Osaka just placed a standing order.',
      cost: 'THIS TRANSISTOR: $0.0002',
    },
    premise: `One catch: to stay ON, your transistor keeps pulling control current <b>the whole time</b>. That wastes power and heat — fine for hundreds of them, impossible for billions. Modern chips use a switch controlled by <b>voltage, not current</b>: the MOSFET.`,
    cta: 'Build a MOSFET ▸',
    run: step2,
  },
  {
    id: 'mosfet',
    title: 'Build your own MOSFET',
    costDelta: 0.0003,
    inventory: 'a voltage-driven switch (MOSFET)',
    businessCard: {
      company: 'Nanovolt Micro',
      location: 'FAB 2 — DRESDEN, GERMANY',
      revenue: '$38M / YR',
      body: 'Your field-effect line just won a contract from a calculator company. The word “microprocessor” keeps coming up in meetings.',
      cost: 'THIS MOSFET: $0.0003',
    },
    premise: `A single MOSFET still leaks a small current while it's ON, because its path to ground stays open. Pair it with its <b>mirror twin</b> so exactly one of them is always OFF, and the leak nearly disappears. That pairing is <b>CMOS</b> — the cell every processor on Earth is built from.`,
    cta: 'Build CMOS ▸',
    run: step3,
  },
  {
    id: 'cmos-inverter',
    title: 'Build CMOS',
    costDelta: 0.0006,
    inventory: 'a CMOS inverter — the atom of computing',
    businessCard: {
      company: 'Nanovolt Logic',
      location: 'HSINCHU, TAIWAN',
      revenue: '$120M / YR',
      body: 'Your first logic cell. The investors have stopped asking whether it works and started asking what happens if you wire a few million together.',
      cost: 'THIS CMOS PAIR: $0.0006',
    },
    premise: null,
    cta: 'Finish Act 1 ▸',
    run: step4,
  },
];

const ico = inner => `<svg width="30" height="30" viewBox="0 0 34 34">${inner}</svg>`;
export const ACT1_SUMMARY = {
  eyebrow: 'ACT 1 COMPLETE',
  title: 'You built the switch <em>that runs the world</em>',
  sub: `From a pinch of doped sand to a CMOS inverter — the exact cell every processor
    ever made repeats billions of times. And you did it on pocket change:`,
  items: [
    { nm: 'Doped P/N wafer', amt: '$0.0004', icon: ico(`<g fill="none" stroke="var(--ink-soft)" stroke-width="1.4"><circle cx="11" cy="11" r="4"/><circle cx="23" cy="11" r="4"/><circle cx="11" cy="23" r="4"/><circle cx="23" cy="23" r="4"/><path d="M15 11h4M15 23h4M11 15v4M23 15v4"/></g><circle cx="23" cy="11" r="4" fill="var(--blue-soft)" stroke="var(--blue)"/>`) },
    { nm: 'NPN transistor', amt: '$0.0002', icon: ico(`<rect x="3" y="10" width="10" height="14" rx="2" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.3"/><rect x="13" y="10" width="8" height="14" rx="1.5" fill="var(--red-soft)" stroke="var(--red)" stroke-width="1.3"/><rect x="21" y="10" width="10" height="14" rx="2" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.3"/><path d="M17 3v7" stroke="var(--ink-soft)" stroke-width="1.4"/>`) },
    { nm: 'MOSFET', amt: '$0.0003', icon: ico(`<rect x="4" y="18" width="26" height="11" rx="2" fill="var(--red-soft)" stroke="var(--red)" stroke-width="1.3"/><rect x="10" y="14" width="14" height="3" fill="var(--amber)"/><rect x="10" y="6" width="14" height="7" rx="1.5" class="gate-metal"/><path d="M11 20h12" stroke="var(--blue)" stroke-width="1.8" stroke-linecap="round"/>`) },
    { nm: 'CMOS inverter', amt: '$0.0006', icon: ico(`<path d="M17 3v6M17 25v6M17 13v8" stroke="var(--ink-soft)" stroke-width="1.4"/><rect x="11" y="7" width="12" height="8" rx="2" fill="var(--red-soft)" stroke="var(--red)" stroke-width="1.3"/><rect x="11" y="19" width="12" height="8" rx="2" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.3"/><circle cx="27" cy="17" r="2.6" fill="var(--ink)"/>`) },
  ],
  totalNote: ' — still less than a grain of rice',
  locked: { title: 'ACT 3 — From Cell to Chip: fabrication at scale', note: 'first, teach your switches to think — act 2 awaits' },
  next: { label: 'Continue to Act 2 ▸' },
  debrief: {
    eyebrow: 'ACT 1 · DEBRIEF',
    title: 'Physics of a Switch — <em>cleared</em>',
    paras: [
      `Doping gave silicon its carriers. The junction sandwich gave you control. The gate made control free. And the twin pair made it scale. <b>Everything from here — logic, math, memory, GPUs, data centers — is just this switch, repeated.</b>`,
      `Nanovolt Semiconductors started the act doping one wafer in Penang. It ends the act shipping logic cells from Hsinchu. <em>Next: teach your switches to think.</em>`,
    ],
  },
};
