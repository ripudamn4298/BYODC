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
    title: 'Build your own logic gate',
    costDelta: 0.0008,
    inventory: 'a NAND gate — the universal decision',
    businessCard: {
      company: 'Nanovolt Logic',
      location: 'NEW DESIGN OFFICE — AUSTIN, TEXAS',
      revenue: '$210M / YR',
      body: 'Your first logic family tapes out. A minicomputer maker in Massachusetts just ordered fifty thousand NANDs and asked, very politely, if you could hurry.',
      cost: 'THIS NAND GATE: $0.0008',
    },
    premise: `A gate that decides is lovely. But commerce runs on <b>counting</b> — invoices, ledgers, trajectories, pixels. Wire enough decisions together in just the right shape and something startling happens: <b>the sand starts doing arithmetic</b>.`,
    cta: 'Build an adder ▸',
    run: step1,
  },
  {
    id: 'adder',
    title: 'Build your own adder',
    costDelta: 0.0024,
    inventory: 'a four-bit adder — sand that counts',
    businessCard: {
      company: 'Nanovolt Compute',
      location: 'YOKOHAMA, JAPAN',
      revenue: '$480M / YR',
      body: 'Your adder ships inside a desktop calculator. Accountants weep with joy. Somewhere, a slide-rule salesman quietly updates his résumé.',
      cost: 'THIS 4-BIT ADDER: $0.0024',
    },
    premise: `One flaw: your adder is a goldfish. The instant you let go of the inputs, the answer evaporates. To do anything in <em>steps</em> — long division, a payroll, a game of chess — the machine must be able to <b>remember what it just worked out</b>.`,
    cta: 'Build a memory ▸',
    run: step2,
  },
  {
    id: 'latch',
    title: 'Build your own memory',
    costDelta: 0.0018,
    inventory: 'a latch — a circuit that remembers',
    businessCard: {
      company: 'Nanovolt Memory',
      location: 'BOISE, IDAHO',
      revenue: '$900M / YR',
      body: 'Your latches hold their bits through the night. A bank wants a million of them by spring. The word “core” is starting to sound old-fashioned.',
      cost: 'THIS LATCH: $0.0018',
    },
    premise: `Now look at your bench: logic that <b>decides</b>, an adder that <b>counts</b>, a latch that <b>holds</b>. Three dead-simple parts. Snap them into a loop, give the loop a pulse — and it stops being parts. <b>It becomes a machine with a heartbeat.</b>`,
    cta: 'Give it a heartbeat ▸',
    run: step3,
  },
  {
    id: 'datapath',
    title: 'Build a machine that computes',
    costDelta: 0.0040,
    inventory: 'a datapath — fetch, compute, store, repeat',
    businessCard: {
      company: 'Nanovolt Systems',
      location: 'SANTA CLARA, CALIFORNIA',
      revenue: '$2.1B / YR',
      body: 'Register, adder, clock — the loop works. The venture people have started using the word “microprocessor” unironically, and your badge photo is in a magazine.',
      cost: 'THIS DATAPATH: $0.0040',
    },
    premise: null,
    cta: 'Finish Act 2 ▸',
    run: step4,
  },
];

const ico = inner => `<svg width="30" height="30" viewBox="0 0 34 34">${inner}</svg>`;
export const ACT2_SUMMARY = {
  eyebrow: 'ACT 2 COMPLETE',
  title: 'You taught the sand <em>to think</em>',
  sub: `A universal gate, an adder, a memory, and a pulse — wired by hand from the switches
    you built in Act 1. Every computer ever made is this loop, wider and faster:`,
  items: [
    { nm: 'NAND gate — the universal decision', amt: '$0.0008', icon: ico(`<rect x="5" y="9" width="18" height="16" rx="3" fill="var(--paper-high)" stroke="var(--ink-soft)" stroke-width="1.4"/><circle cx="5" cy="13.5" r="2.2" fill="var(--blue)" /><circle cx="5" cy="20.5" r="2.2" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.2"/><circle cx="26" cy="17" r="2.8" fill="var(--blue)"/>`) },
    { nm: 'Four-bit ripple adder', amt: '$0.0024', icon: ico(`<g fill="none" stroke="var(--ink-soft)" stroke-width="1.3"><rect x="3" y="12" width="8" height="10" rx="2"/><rect x="13" y="12" width="8" height="10" rx="2"/><rect x="23" y="12" width="8" height="10" rx="2"/></g><path d="M11 15h2M21 15h2" stroke="var(--amber)" stroke-width="1.8"/><text x="17" y="9" font-family="var(--font-mono)" font-size="8" fill="var(--ink-faint)" text-anchor="middle">+</text>`) },
    { nm: 'SR latch — a held bit', amt: '$0.0018', icon: ico(`<rect x="6" y="6" width="14" height="9" rx="2" fill="var(--paper-high)" stroke="var(--ink-soft)" stroke-width="1.3"/><rect x="14" y="19" width="14" height="9" rx="2" fill="var(--paper-high)" stroke="var(--ink-soft)" stroke-width="1.3"/><path d="M20 15 L20 17 L14 17 L14 19 M14 6 L14 4 L28 4 L28 19" fill="none" stroke="var(--blue)" stroke-width="1.5"/>`) },
    { nm: 'Clocked datapath — a heartbeat', amt: '$0.0040', icon: ico(`<rect x="4" y="12" width="10" height="10" rx="2" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.3"/><rect x="20" y="12" width="10" height="10" rx="2" fill="var(--paper-high)" stroke="var(--ink-soft)" stroke-width="1.3"/><path d="M14 15 h6 M20 19 h-6" stroke="var(--ink-soft)" stroke-width="1.3"/><path d="M8 28 h4 v-3 h4 v3 h4" fill="none" stroke="var(--amber)" stroke-width="1.5"/>`) },
  ],
  totalNote: ' — a working computer core, for a hundredth of a cent',
  locked: { title: 'ACT 3 — From Cell to Chip: fabrication at scale', note: 'time to print your machine a billion times' },
  next: { label: 'Continue to Act 3 ▸' },
  debrief: {
    eyebrow: 'ACT 2 · DEBRIEF',
    title: 'Logic, Math & Memory — <em>cleared</em>',
    paras: [
      `The NAND made decisions universal. The adder turned decisions into arithmetic. The latch let arithmetic <b>persist</b>. And the clock stitched them into a loop: fetch, compute, store, repeat. <b>A CPU is exactly this — your bench, three billion times a second.</b>`,
      `Nanovolt entered this act as a parts company in Austin. It leaves as a systems company in Santa Clara, and the magazine folks keep calling. <em>Next: stop building one of anything. Start printing billions.</em>`,
    ],
  },
};
