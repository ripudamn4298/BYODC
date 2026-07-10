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
    premise: `One catch: to stay ON, your transistor drinks control current <b>the whole time</b>. Warm, thirsty — fine for hundreds, hopeless for billions. Modern chips use a switch that listens to <b>voltage, not current</b>: the MOSFET.`,
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
    premise: `A lone MOSFET still leaks a whisper while ON — its path to ground stays live. Pair it with its <b>mirror twin</b> so exactly one of them is always OFF, and the leak all but vanishes. That pairing is <b>CMOS</b> — the cell every processor on Earth is built from.`,
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
