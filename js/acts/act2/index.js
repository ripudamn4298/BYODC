// BYODC — Act 2: "From Switches to Logic, Math & Memory".
// The ladder inside the act: NAND (decisions) → adder (arithmetic) →
// latch (remembering) → clocked datapath (a heartbeat). Each step's run()
// lives in its own module and follows the flow.ask replay contract.
import { step1 } from './step1.js';
import { step2 } from './step2.js';
import { step3 } from './step3.js';
import { step4 } from './step4.js';

export const ACT2_BASE_COST = 0.0015;   // everything Act 1 spent

export const ACT2 = [
  {
    id: 'nand-gate',
    title: 'Weigh two inputs at once',
    costDelta: 0.0008,
    inventory: 'a NAND gate, the one gate that builds all the others',
    businessCard: {
      company: 'Nanovolt Logic',
      location: 'NEW DESIGN OFFICE, AUSTIN, TEXAS',
      revenue: '$210M / YR',
      body: 'Your first logic family taped out. A minicomputer maker in Massachusetts ordered fifty thousand NANDs and asked how soon you could ship them.',
      cost: 'THIS NAND GATE: $0.0008',
    },
    premise: `A gate that decides is one thing. Most of what a computer does is count: invoices, pixels, trajectories. Wire enough of these gates into the right shape and they add.`,
    cta: 'Add two numbers ▸',
    run: step1,
  },
  {
    id: 'adder',
    title: 'Add the way you do on paper',
    costDelta: 0.0024,
    inventory: 'a four-bit ripple adder',
    businessCard: {
      company: 'Nanovolt Compute',
      location: 'YOKOHAMA, JAPAN',
      revenue: '$480M / YR',
      body: 'Your adder ships inside a desktop calculator. It does in one cycle what an accountant does with a pencil and a column of figures.',
      cost: 'THIS 4-BIT ADDER: $0.0024',
    },
    premise: `Your adder answers only while you hold its inputs. Let go and the answer is gone. Anything done in steps, from long division to a game of chess, needs a circuit that keeps what it just worked out.`,
    cta: 'Keep an answer after you let go ▸',
    run: step2,
  },
  {
    id: 'latch',
    title: 'A circuit that remembers',
    costDelta: 0.0018,
    inventory: 'a register, four held bits',
    businessCard: {
      company: 'Nanovolt Memory',
      location: 'BOISE, IDAHO',
      revenue: '$900M / YR',
      body: 'Your latches hold their bits through the night. A bank has asked for a million of them by spring.',
      cost: 'THIS LATCH: $0.0018',
    },
    premise: `Your bench now holds a gate that decides, an adder that counts and a register that holds. Wire those three into a loop, drive the loop with a clock, and the parts become a machine.`,
    cta: 'Wire them into a loop ▸',
    run: step3,
  },
  {
    id: 'datapath',
    title: 'Fetch, compute, store, repeat',
    costDelta: 0.0040,
    inventory: 'a machine that computes: register, adder, clock',
    businessCard: {
      company: 'Nanovolt Systems',
      location: 'SANTA CLARA, CALIFORNIA',
      revenue: '$2.1B / YR',
      body: 'Register, adder and clock, wired into one working loop. The people funding you have started saying microprocessor without irony.',
      cost: 'THIS MACHINE: $0.0040',
    },
    premise: null,
    cta: 'Finish Act 2 ▸',
    run: step4,
  },
];

const ico = inner => `<svg width="30" height="30" viewBox="0 0 34 34">${inner}</svg>`;
export const ACT2_SUMMARY = {
  eyebrow: 'ACT 2 COMPLETE',
  title: 'You built a <em>working computer core</em>',
  sub: `A gate that decides, an adder that counts, a register that holds and a clock that
    keeps the beat, all wired by hand from the switches you built in Act 1:`,
  items: [
    { nm: 'NAND gate, the one that builds the rest', amt: '$0.0008', icon: ico(`<rect x="5" y="9" width="18" height="16" rx="3" fill="var(--paper-high)" stroke="var(--ink-soft)" stroke-width="1.4"/><circle cx="5" cy="13.5" r="2.2" fill="var(--blue)" /><circle cx="5" cy="20.5" r="2.2" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.2"/><circle cx="26" cy="17" r="2.8" fill="var(--blue)"/>`) },
    { nm: 'Four-bit ripple adder', amt: '$0.0024', icon: ico(`<g fill="none" stroke="var(--ink-soft)" stroke-width="1.3"><rect x="3" y="12" width="8" height="10" rx="2"/><rect x="13" y="12" width="8" height="10" rx="2"/><rect x="23" y="12" width="8" height="10" rx="2"/></g><path d="M11 15h2M21 15h2" stroke="var(--amber)" stroke-width="1.8"/><text x="17" y="9" font-family="var(--font-mono)" font-size="8" fill="var(--ink-faint)" text-anchor="middle">+</text>`) },
    { nm: 'SR latch, one held bit', amt: '$0.0018', icon: ico(`<rect x="6" y="6" width="14" height="9" rx="2" fill="var(--paper-high)" stroke="var(--ink-soft)" stroke-width="1.3"/><rect x="14" y="19" width="14" height="9" rx="2" fill="var(--paper-high)" stroke="var(--ink-soft)" stroke-width="1.3"/><path d="M20 15 L20 17 L14 17 L14 19 M14 6 L14 4 L28 4 L28 19" fill="none" stroke="var(--blue)" stroke-width="1.5"/>`) },
    { nm: 'Register, adder and clock, in a loop', amt: '$0.0040', icon: ico(`<rect x="4" y="12" width="10" height="10" rx="2" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.3"/><rect x="20" y="12" width="10" height="10" rx="2" fill="var(--paper-high)" stroke="var(--ink-soft)" stroke-width="1.3"/><path d="M14 15 h6 M20 19 h-6" stroke="var(--ink-soft)" stroke-width="1.3"/><path d="M8 28 h4 v-3 h4 v3 h4" fill="none" stroke="var(--amber)" stroke-width="1.5"/>`) },
  ],
  totalNote: ', a working computer core for a hundredth of a cent',
  locked: { title: 'ACT 3 · From Cell to Chip: fabrication at scale', note: 'time to print your machine a billion times' },
  next: { label: 'Continue to Act 3 ▸' },
  debrief: {
    eyebrow: 'ACT 2 · DEBRIEF',
    title: 'Logic, math and memory, <em>cleared</em>',
    paras: [
      `The NAND made every other gate reachable. The adder turned gates into arithmetic. The
       register let an answer outlive its inputs. The clock stitched the three into a loop:
       fetch, compute, store, repeat. <b>A CPU is that loop, a few billion times a second.</b>`,
      `<em>Next: stop building one of anything, and start printing billions.</em>`,
    ],
  },
};
