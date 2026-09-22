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
    title: 'How do you make sand conduct electricity?',
    costDelta: 0.0004,
    inventory: 'a doped silicon wafer',
    businessCard: {
      company: 'Nanovolt Semiconductors',
      location: 'PENANG, MALAYSIA',
      revenue: '$4M / YR',
      body: 'First doped wafer out of the Penang fab this morning. Thin margins, and a shelf of orders for parts that do exactly one thing.',
      cost: 'THIS DOPING RUN: $0.0004',
    },
    premise: `Silicon now conducts. But so does a copper wire, so what have we gained? The answer starts on the line where an N block meets a P block.`,
    cta: 'Press N against P ▸',
    run: step1,
  },
  {
    id: 'pn-junction',
    title: 'What happens where N meets P?',
    costDelta: 0.0001,
    inventory: 'a diode, current one way only',
    businessCard: {
      company: 'Nanovolt Semiconductors',
      location: 'DIODE LINE, KAOHSIUNG, TAIWAN',
      revenue: '$7M / YR',
      body: 'A power supply maker two streets over needs a part that passes current one way and blocks it the other. Yours does, at a hundredth of a cent, and the diode line is on three shifts to keep up.',
      cost: 'THIS DIODE: $0.0001',
    },
    premise: `A diode is a one-way street, and that is still just a passive pipe. The next device is the one that put a microphone, a motor and a radio in every pocket: a single part that lets a tiny signal command a massive current.`,
    cta: 'Take control of the current ▸',
    run: step2,
  },
  {
    id: 'npn-transistor',
    title: 'What is wrong with using copper wires?',
    costDelta: 0.0001,
    inventory: 'a working transistor',
    businessCard: {
      company: 'Nanovolt Semiconductors',
      location: 'NEW PACKAGING LINE, KAOHSIUNG, TAIWAN',
      revenue: '$11M / YR',
      body: 'The part number is NV-2N, and a radio maker in Osaka has a standing order for it. Transistor number one works.',
      cost: 'THIS TRANSISTOR: $0.0001',
    },
    premise: `Your transistor can now control a large current. The catch is that it consumes a small current the whole time it is on, just to stay on. That is acceptable for hundreds of transistors and impossible for billions. Wouldn't it be better if we could hold it on without any current at all?`,
    cta: 'Find a better switch ▸',
    run: step3,
  },
  {
    id: 'mosfet',
    title: 'Can a switch stay on without spending any current?',
    costDelta: 0.0003,
    inventory: 'a voltage-driven switch (MOSFET)',
    businessCard: {
      company: 'Nanovolt Micro',
      location: 'FAB 2, DRESDEN, GERMANY',
      revenue: '$38M / YR',
      body: 'Fab 2 in Dresden cost more than Nanovolt made last year, and the field-effect line inside it is still learning to yield. The calculator contract covers it. Just.',
      cost: 'THIS MOSFET: $0.0003',
    },
    premise: `Your new switch costs nothing to hold on. But watch the meter: while it is on, current still runs straight from the supply to ground, and keeps running. One switch is nothing. A billion would cook the chip. Can a switch hold a value and draw nothing?`,
    cta: 'Stop the leak ▸',
    run: step4,
  },
  {
    id: 'cmos-inverter',
    title: 'Why don\'t a billion switches melt?',
    costDelta: 0.0006,
    inventory: 'a CMOS inverter, the cell every processor repeats',
    businessCard: {
      company: 'Nanovolt Logic',
      location: 'HSINCHU, TAIWAN',
      revenue: '$120M / YR',
      body: 'The investors have stopped asking whether the cell works. Now they ask what happens if you wire four million of them together, and nobody in the room has an answer yet.',
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
