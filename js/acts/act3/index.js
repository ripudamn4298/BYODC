// BYODC — Act 3: "From Cell to Chip: fabrication at scale".
// The ladder: grow one crystal → print with light → choose a die size → package a die → sort by speed.
// You have one perfect cell; the miracle is printing billions at once, with light.
import { step1 } from './step1.js';
import { step2 } from './step2.js';
import { step3 } from './step3.js';
import { step4 } from './step4.js';
import { step5 } from './step5.js';

export const ACT3_BASE_COST = 0.0105;   // everything through Act 2

export const ACT3 = [
  {
    id: 'ingot',
    title: 'Grow one perfect crystal',
    costDelta: 2000,
    inventory: 'a 300 mm single-crystal ingot',
    businessCard: {
      company: 'Nanovolt Materials',
      location: 'KUMAMOTO, JAPAN',
      revenue: '$4B / YR',
      body: 'Growing flawless crystal is slow, hot, patient work, and every fab on Earth needs it before it needs anything else. The ledger has been counting fractions of a cent until now.',
      cost: 'THIS INGOT: $2,000',
    },
    premise: `You have a log of silicon with every atom in place, sliced into blank wafers. Now you have to put <b>ten billion transistors</b> onto one of them. Not with your hands. <b>With light.</b>`,
    cta: 'Print with light ▸',
    run: step1,
  },
  {
    id: 'litho',
    title: 'Print with light',
    costDelta: 6000,
    inventory: 'a wafer patterned, layer by layer',
    businessCard: {
      company: 'Nanovolt Fab 3',
      location: 'PHOENIX, ARIZONA',
      revenue: '$9B / YR',
      body: 'The lithography machine arrived in forty freight containers and cost more than the building around it. It prints a feature smaller than a virus, ten thousand times a day.',
      cost: 'THIS PATTERNED LAYER: $6,000',
    },
    premise: `The pattern prints perfectly. The trouble is dust, and a speck of dust is bigger than a transistor. Some dies on every wafer are dead before they are finished, and <b>how big you cut them</b> decides how many survive.`,
    cta: 'Choose how big to cut ▸',
    run: step2,
  },
  {
    id: 'yield',
    title: 'How big to cut each chip',
    costDelta: 5500,
    inventory: 'a wafer of tested dies',
    businessCard: {
      company: 'Nanovolt Fab 3',
      location: 'YIELD ENGINEERING, PHOENIX, ARIZONA',
      revenue: '$16B / YR',
      body: 'Yield is the number the board watches, because one point of it across a year pays for the test floor. You are now the person who decides how big the dies get.',
      cost: 'THIS TESTED WAFER: $5,500',
    },
    premise: `You picked a die size and counted the survivors. They are still stuck to the wafer, and a die on a wafer connects to nothing. Cut one free, wire it to the outside world, and seal it.`,
    cta: 'Package the die ▸',
    run: step3,
  },
  {
    id: 'package',
    title: 'Package the die',
    costDelta: 300,
    inventory: 'a packaged chip',
    businessCard: {
      company: 'Nanovolt Assembly',
      location: 'TAICHUNG, TAIWAN',
      revenue: '$21B / YR',
      body: 'A bare die cannot be plugged into anything, however good it is. This line gives every one of them pins, a lid, and a way out.',
      cost: 'THIS PACKAGING RUN: $300',
    },
    premise: `One chip is packaged and ready to plug in. The rest of the tray came off the same wafer, printed from the same mask, and <b>they do not all run at the same speed.</b> Measure each one and sort them.`,
    cta: 'Test and sort them ▸',
    run: step4,
  },
  {
    id: 'bin',
    title: 'Same chip, three prices',
    costDelta: 200,
    inventory: 'chips graded and priced',
    businessCard: {
      company: 'Nanovolt Test',
      location: 'TAICHUNG, TAIWAN',
      revenue: '$26B / YR',
      body: 'Same wafer, same design, three price tags. The test floor is what decides which chip is which.',
      cost: 'THIS TEST RUN: $200',
    },
    premise: null,
    cta: 'Finish Act 3 ▸',
    run: step5,
  },
];

const ico = inner => `<svg width="30" height="30" viewBox="0 0 34 34">${inner}</svg>`;
export const ACT3_SUMMARY = {
  eyebrow: 'ACT 3 COMPLETE',
  title: 'You printed the chip <em>a billion times over</em>',
  sub: `A crystal grown from a seed, a pattern printed in light, the survivors counted, packaged
    and graded. This is how one cell becomes ten billion, and why a fab costs more than a moon shot:`,
  items: [
    { nm: '300 mm single-crystal ingot', amt: '$2,000', icon: ico(`<rect x="14" y="4" width="6" height="26" rx="3" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.3"/><path d="M12 8 h10 M12 15 h10 M12 22 h10" stroke="var(--ink-soft)" stroke-width="1"/>`) },
    { nm: 'Patterned wafer (lithography)', amt: '$6,000', icon: ico(`<circle cx="17" cy="17" r="13" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.3"/><path d="M9 11 h16 M9 17 h16 M9 23 h16 M11 9 v16 M17 9 v16 M23 9 v16" stroke="var(--blue)" stroke-width=".7"/>`) },
    { nm: 'Wafer of tested dies (yield)', amt: '$5,500', icon: ico(`<circle cx="17" cy="17" r="13" fill="none" stroke="var(--ink)" stroke-width="1.3"/><rect x="10" y="10" width="6" height="6" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width=".8"/><rect x="18" y="10" width="6" height="6" fill="var(--red-soft)" stroke="var(--red)" stroke-width=".8"/><rect x="10" y="18" width="6" height="6" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width=".8"/><rect x="18" y="18" width="6" height="6" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width=".8"/>`) },
    { nm: 'Packaged chip (flip-chip)', amt: '$300', icon: ico(`<rect x="7" y="11" width="20" height="14" rx="2" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.3"/><path d="M11 11 v-4 M17 11 v-4 M23 11 v-4 M11 25 v4 M17 25 v4 M23 25 v4" stroke="var(--ink-soft)" stroke-width="1.2"/>`) },
    { nm: 'Graded and priced (binning)', amt: '$200', icon: ico(`<rect x="5" y="14" width="7" height="12" rx="1.5" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.2"/><rect x="14" y="14" width="7" height="12" rx="1.5" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.2"/><rect x="23" y="14" width="7" height="12" rx="1.5" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.2"/><path d="M8.5 11 v-3 M17.5 11 v-3 M26.5 11 v-3" stroke="var(--ink-soft)" stroke-width="1.2"/><rect x="6.5" y="17" width="4" height="4" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width=".8"/>`) },
  ],
  totalNote: ', a real fab and a real product line',
  locked: { title: 'ACT 4 · The GPU: machines built for mathematics', note: 'now make it do math ten thousand ways at once' },
  next: { label: 'Continue to Act 4 ▸' },
  debrief: {
    eyebrow: 'ACT 3 · DEBRIEF',
    title: 'From Cell to Chip, <em>cleared</em>',
    paras: [
      `You grew a crystal from a seed, printed billions of features in a flash of light, chose a die size and counted what survived, packaged one die face down onto its bumps, and sorted the tray by the speed each chip tested at. <b>Fabrication is photography at the scale of atoms</b>, and it is the hardest thing our species knows how to build.`,
      `Nanovolt walked into this act as a design shop and walks out owning a fab in the Arizona desert. <em>Next: stop building one kind of machine. Build the one that does mathematics ten thousand ways at once.</em>`,
    ],
  },
};
