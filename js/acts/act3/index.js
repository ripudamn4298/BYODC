// BYODC — Act 3: "From Cell to Chip: fabrication at scale".
// The ladder: grow the ingot → print with light → the yield game → cut/bond/bin.
// You have one perfect cell; the miracle is printing billions at once, with light.
import { step1 } from './step1.js';
import { step2 } from './step2.js';
import { step3 } from './step3.js';
import { step4 } from './step4.js';

export const ACT3_BASE_COST = 0.0105;   // everything through Act 2

export const ACT3 = [
  {
    id: 'ingot',
    title: 'Grow the crystal',
    costDelta: 2000,
    inventory: 'a 300 mm single-crystal ingot',
    businessCard: {
      company: 'Nanovolt Materials',
      location: 'KUMAMOTO, JAPAN',
      revenue: '$4B / YR',
      body: 'The ledger just saw its first whole dollar. Growing flawless crystal is slow, hot, patient work — and every fab on Earth needs it before they need anything else.',
      cost: 'THIS INGOT: $2,000 — the numbers have legs now',
    },
    premise: `An ingot is a mirror-perfect log of silicon — but a log builds nothing. Slice it into wafers, and each wafer is a blank page. Now you have to write <b>ten billion transistors</b> onto that page at once. Not with your hands. <b>With light.</b>`,
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
      body: 'The lithography machine arrived in forty freight containers and cost more than the building around it. It prints a feature smaller than a virus, and it does it flawlessly, ten thousand times a day.',
      cost: 'THIS PATTERNED LAYER: $6,000',
    },
    premise: `You can print a perfect pattern — but the world is full of dust, and dust is bigger than your transistors. Some of the dies on every wafer are already dead before they're finished. The whole economics of silicon comes down to one cold question: <b>how many survive?</b>`,
    cta: 'Play the yield game ▸',
    run: step2,
  },
  {
    id: 'yield',
    title: 'The yield game',
    costDelta: 5500,
    inventory: 'a wafer of tested dies',
    businessCard: {
      company: 'Nanovolt Fab 3',
      location: 'YIELD ENGINEERING — PHOENIX, ARIZONA',
      revenue: '$16B / YR',
      body: 'Yield is the only number the board truly cares about. A single point of yield, across a year, is a new corporate jet. You are now the person who decides how big the dies get.',
      cost: 'THIS TESTED WAFER: $5,500',
    },
    premise: `The surviving dies are still stuck to the wafer, still nameless. Cut them free, wire each one to the outside world, seal it — and then give every chip the same speed test. Because not all survivors are equal, and that difference is worth a fortune.`,
    cta: 'Cut, bond & bin ▸',
    run: step3,
  },
  {
    id: 'package',
    title: 'Cut, bond & bin',
    costDelta: 500,
    inventory: 'a tray of packaged, binned chips',
    businessCard: {
      company: 'Nanovolt Assembly & Test',
      location: 'TAICHUNG, TAIWAN',
      revenue: '$21B / YR',
      body: 'Same wafer, same design, three price tags. The fast ones go to gamers and traders; the slow-but-alive ones run cash registers. Nothing is wasted, and the accountants are delighted.',
      cost: 'THIS PACKAGING RUN: $500',
    },
    premise: null,
    cta: 'Finish Act 3 ▸',
    run: step4,
  },
];

const ico = inner => `<svg width="30" height="30" viewBox="0 0 34 34">${inner}</svg>`;
export const ACT3_SUMMARY = {
  eyebrow: 'ACT 3 COMPLETE',
  title: 'You printed the chip <em>a billion times over</em>',
  sub: `A crystal grown, a pattern printed in light, the survivors counted and sorted. This is
    how one perfect cell becomes ten billion — and why a chip fab costs more than a moon shot:`,
  items: [
    { nm: '300 mm single-crystal ingot', amt: '$2,000', icon: ico(`<rect x="14" y="4" width="6" height="26" rx="3" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.3"/><path d="M12 8 h10 M12 15 h10 M12 22 h10" stroke="var(--ink-soft)" stroke-width="1"/>`) },
    { nm: 'Patterned wafer (lithography)', amt: '$6,000', icon: ico(`<circle cx="17" cy="17" r="13" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.3"/><path d="M9 11 h16 M9 17 h16 M9 23 h16 M11 9 v16 M17 9 v16 M23 9 v16" stroke="var(--blue)" stroke-width=".7"/>`) },
    { nm: 'Wafer of tested dies (yield)', amt: '$5,500', icon: ico(`<circle cx="17" cy="17" r="13" fill="none" stroke="var(--ink)" stroke-width="1.3"/><rect x="10" y="10" width="6" height="6" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width=".8"/><rect x="18" y="10" width="6" height="6" fill="var(--red-soft)" stroke="var(--red)" stroke-width=".8"/><rect x="10" y="18" width="6" height="6" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width=".8"/><rect x="18" y="18" width="6" height="6" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width=".8"/>`) },
    { nm: 'Packaged, binned chips', amt: '$500', icon: ico(`<rect x="7" y="11" width="20" height="14" rx="2" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.3"/><path d="M11 11 v-4 M17 11 v-4 M23 11 v-4 M11 25 v4 M17 25 v4 M23 25 v4" stroke="var(--ink-soft)" stroke-width="1.2"/>`) },
  ],
  totalNote: ' — a real fab, a real product line',
  locked: { title: 'ACT 4 — The GPU: machines built for mathematics', note: 'now make it do math ten thousand ways at once' },
  next: { label: 'Continue to Act 4 ▸' },
  debrief: {
    eyebrow: 'ACT 3 · DEBRIEF',
    title: 'From Cell to Chip — <em>cleared</em>',
    paras: [
      `You grew a flawless crystal, printed billions of features in a single flash of light, counted the survivors, and sorted them by speed. <b>Fabrication is photography at the scale of atoms</b> — and it's the hardest, most expensive thing our species knows how to do.`,
      `Nanovolt walked into this act as a design shop and walks out owning a fab in the Arizona desert. <em>Next: stop building one kind of machine. Build the one that does mathematics ten thousand ways at once.</em>`,
    ],
  },
};
