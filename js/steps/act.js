// BYODC — Act 1 step configs. The extensible ladder: append configs for later acts.
import { step1 } from './step1.js';
import { step2 } from './step2.js';
import { step3 } from './step3.js';
import { step4 } from './step4.js';
import { step5 } from './step5.js';

// Five steps since the micro-learning makeover (ACT1_MAKEOVER.md): the old step 2 was
// two lessons under one number, a diode and then a transistor, and is now steps 2 and 3.
// Its $0.0002 splits into $0.0001 + $0.0001, so the act still ends at $0.0015.
export const ACT1 = [
  {
    id: 'pn-semiconductor',
    title: 'Make silicon conduct',
    costDelta: 0.0004,
    inventory: 'a doped silicon wafer',
    businessCard: {
      company: 'Nanovolt Semiconductors',
      location: 'PENANG, MALAYSIA',
      revenue: '$4M / YR',
      body: 'Your fab on the Penang strait doped its first wafer today. It sells discrete components on thin margins, which is where every chipmaker starts.',
      cost: 'THIS DOPING RUN: $0.0004',
    },
    premise: `You have both kinds of doped silicon. Nothing useful happens until they touch. Press them together and a barrier builds itself at the seam, one you can raise and lower with a voltage. That is where every switch starts.`,
    cta: 'Press N against P ▸',
    run: step1,
  },
  {
    id: 'pn-junction',
    title: 'Where N meets P',
    costDelta: 0.0001,
    inventory: 'a diode, current one way only',
    businessCard: {
      company: 'Nanovolt Semiconductors',
      location: 'DIODE LINE, KAOHSIUNG, TAIWAN',
      revenue: '$7M / YR',
      body: 'The diode line opened this quarter. A power supply maker needs parts that pass current one way and block it the other, and yours do.',
      cost: 'THIS DIODE: $0.0001',
    },
    premise: `A diode passes current one way and blocks the other. Put two of those junctions back to back and the block in the middle becomes a control: a small current there decides whether a much larger one flows.`,
    cta: 'Control a big current with a small one ▸',
    run: step2,
  },
  {
    id: 'npn-transistor',
    title: 'A small current controls a big one',
    costDelta: 0.0001,
    inventory: 'a working transistor',
    businessCard: {
      company: 'Nanovolt Semiconductors',
      location: 'NEW PACKAGING LINE, KAOHSIUNG, TAIWAN',
      revenue: '$11M / YR',
      body: 'Transistor number one works. You ship switches by the reel now, and a radio maker in Osaka has placed a standing order.',
      cost: 'THIS TRANSISTOR: $0.0001',
    },
    premise: `Your transistor drinks control current the whole time it is on. That is fine for hundreds of them and impossible for billions. The fix is a switch held on by a voltage instead of a current.`,
    cta: 'Switch it with voltage ▸',
    run: step3,
  },
  {
    id: 'mosfet',
    title: 'Switch it with voltage, not current',
    costDelta: 0.0003,
    inventory: 'a voltage-driven switch (MOSFET)',
    businessCard: {
      company: 'Nanovolt Micro',
      location: 'FAB 2, DRESDEN, GERMANY',
      revenue: '$38M / YR',
      body: 'Your field-effect line won a contract from a calculator company. The word microprocessor keeps coming up in meetings.',
      cost: 'THIS MOSFET: $0.0003',
    },
    premise: `A single MOSFET still leaks while it is on, because its path to ground stays open. Pair it with its mirror twin so exactly one of them is always off, and the leak nearly disappears.`,
    cta: 'Stop the leak ▸',
    run: step4,
  },
  {
    id: 'cmos-inverter',
    title: 'Why a billion switches do not melt',
    costDelta: 0.0006,
    inventory: 'a CMOS inverter, the cell every processor repeats',
    businessCard: {
      company: 'Nanovolt Logic',
      location: 'HSINCHU, TAIWAN',
      revenue: '$120M / YR',
      body: 'Your first logic cell. The investors have stopped asking whether it works and started asking what happens if you wire a few million together.',
      cost: 'THIS CMOS PAIR: $0.0006',
    },
    premise: null,
    cta: 'Finish Act 1 ▸',
    run: step5,
  },
];

const ico = inner => `<svg width="30" height="30" viewBox="0 0 34 34">${inner}</svg>`;
export const ACT1_SUMMARY = {
  eyebrow: 'ACT 1 COMPLETE',
  title: 'You built the <em>CMOS inverter</em>',
  sub: `From doped sand to the cell every processor repeats billions of times, and you did
    it on pocket change:`,
  items: [
    { nm: 'Doped silicon, with carriers', amt: '$0.0004', icon: ico(`<g fill="none" stroke="var(--ink-soft)" stroke-width="1.4"><circle cx="11" cy="11" r="4"/><circle cx="23" cy="11" r="4"/><circle cx="11" cy="23" r="4"/><circle cx="23" cy="23" r="4"/><path d="M15 11h4M15 23h4M11 15v4M23 15v4"/></g><circle cx="23" cy="11" r="4" fill="var(--blue-soft)" stroke="var(--blue)"/>`) },
    { nm: 'A diode, current one way only', amt: '$0.0001', icon: ico(`<path d="M11 8 L24 17 L11 26 Z" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.3"/><path d="M24 8 V26" stroke="var(--blue)" stroke-width="2"/><path d="M4 17 h7 M24 17 h6" stroke="var(--ink-soft)" stroke-width="1.3"/>`) },
    { nm: 'NPN transistor', amt: '$0.0001', icon: ico(`<rect x="3" y="10" width="10" height="14" rx="2" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.3"/><rect x="13" y="10" width="8" height="14" rx="1.5" fill="var(--red-soft)" stroke="var(--red)" stroke-width="1.3"/><rect x="21" y="10" width="10" height="14" rx="2" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.3"/><path d="M17 3v7" stroke="var(--ink-soft)" stroke-width="1.4"/>`) },
    { nm: 'MOSFET, switched by voltage', amt: '$0.0003', icon: ico(`<rect x="4" y="18" width="26" height="11" rx="2" fill="var(--red-soft)" stroke="var(--red)" stroke-width="1.3"/><rect x="10" y="14" width="14" height="3" fill="var(--amber)"/><rect x="10" y="6" width="14" height="7" rx="1.5" class="gate-metal"/><path d="M11 20h12" stroke="var(--blue)" stroke-width="1.8" stroke-linecap="round"/>`) },
    { nm: 'CMOS inverter', amt: '$0.0006', icon: ico(`<path d="M17 3v6M17 25v6M17 13v8" stroke="var(--ink-soft)" stroke-width="1.4"/><rect x="11" y="7" width="12" height="8" rx="2" fill="var(--red-soft)" stroke="var(--red)" stroke-width="1.3"/><rect x="11" y="19" width="12" height="8" rx="2" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.3"/><circle cx="27" cy="17" r="2.6" fill="var(--ink)"/>`) },
  ],
  totalNote: ', still less than a grain of rice',
  locked: { title: 'ACT 2 · From Switches to Logic, Math and Memory', note: 'now teach your switches to think' },
  next: { label: 'Continue to Act 2 ▸' },
  debrief: {
    eyebrow: 'ACT 1 · DEBRIEF',
    title: 'The physics of a switch, <em>cleared</em>',
    paras: [
      `Doping gave silicon carriers. Pressing N against P built a barrier you could raise
       and lower. Two of those junctions back to back let a small current control a large
       one. The gate made that control free, and the twin pair made it cheap enough to
       repeat. <b>Everything after this act is this switch, repeated.</b>`,
      `<em>Next: teach your switches to think.</em>`,
    ],
  },
};
