// BYODC — Act 2: "Build Your Own Processor".
// The ladder inside the act: NAND (decisions) → adder (arithmetic) →
// latch (remembering) → clocked datapath (a heartbeat). Each step's run()
// lives in its own module and follows the flow.ask replay contract.
import { step1 } from './step1.js';
import { step2 } from './step2.js';
import { step3 } from './step3.js';
import { step4 } from './step4.js';

export const ACT2_BASE_COST = 0.000000024;   // everything Act 1 spent (COST_MODEL.md)

export const ACT2 = [
  {
    id: 'nand-gate',
    title: 'How do four transistors perform logic?',
    costDelta: 0.000000016,
    inventory: 'a NAND gate, the one gate that builds all the others',
    numbers: {
      text: [
        `You can build a whole computer from one kind of gate. The Apollo Guidance Computer, which steered the Moon flights of 1969, was built almost entirely from one chip holding two NOR gates, NAND's mirror twin.`,
        { ladder: [
          `You built one NAND gate from 4 transistors.`,
          `The Apollo computer on the crewed flights had about 2,800 of those chips, about 5,600 gates.`,
          `Apple's A17 Pro (2023) has 19 billion transistors, enough for about 4.75 billion NAND gates.`,
        ] },
        `Your gate also named the memory in your phone: NAND flash, whose cells sit in a chain like your two NMOS.`,
      ],
      working: [
        `A NOR gate's output is 1 only when every input is 0. Each Apollo chip held two NOR gates with three inputs each.`,
        `Phones store photos and apps in NAND flash memory, which Toshiba introduced in 1987. Current gets through a chain of its cells only when every transistor in the chain is on.`,
        `A two-input NAND gate has 2 PMOS and 2 NMOS transistors, which makes 4 transistors.`,
        `Wikipedia's article on the Apollo Guidance Computer says the Block II version, the one used on the crewed flights, had about 2,800 chips, mostly dual three-input NOR gates made by Fairchild Semiconductor. A Hackaday project that rebuilds the computer counts 2,826 of them.`,
        `2,800 chips × 2 gates = 5,600 gates. A few of the chips were other parts, such as amplifiers for the memory, so the true number of gates is a little lower.`,
        `The earlier Block I version used about 4,100 chips with one NOR gate each, according to both Wikipedia and EE Journal's history of the computer.`,
        `NOR is universal for the same reason NAND is. If you tie a NOR gate's inputs together, it works as a NOT gate, and if you put a NOT gate after a NOR gate, you get an OR gate.`,
        `The A17 Pro has 19,000,000,000 transistors, and 19,000,000,000 ÷ 4 = 4,750,000,000 NAND gates. This only counts how many NAND gates the transistors could make, because a large part of a real chip is memory and its logic uses many kinds of gate.`,
        `Wikipedia's article on flash memory and Nanowerk's glossary both say NAND flash is named after the NAND gate because its cells are connected in series, while NOR flash connects them in parallel. Wikipedia says Fujio Masuoka's team at Toshiba presented NAND flash in 1987.`,
      ],
    },
    premise: `Your gate only answers yes or no, but nearly everything a computer does comes down to adding. Can such gates add 5 and 3?`,
    cta: 'Add two numbers ▸',
    run: step1,
  },
  {
    id: 'adder',
    title: 'How does a circuit add 5 + 3?',
    costDelta: 0.00000058,
    inventory: 'a four-bit ripple adder',
    numbers: {
      text: [
        `A processor adds 32 or 64 columns at a time. By Google's 2021 figures, one 32-bit sum on a modern chip costs about 0.03 picojoules, trillionths of a joule.`,
        { ladder: [
          `One adder doing a billion sums a second would draw 0.00003 watts.`,
          `333,000 of them would draw 10 watts, as much as one LED bulb.`,
        ] },
        `So one bulb's power buys about 333 trillion sums a second. Adding is one of the cheapest things a chip does.`,
      ],
      working: [
        `The power an adder draws is the energy of one sum × the number of sums it does each second (P = E × n).`,
        `A picojoule is 10⁻¹² joules, so 0.03 picojoules is 0.03 × 10⁻¹² = 3 × 10⁻¹⁴ joules.`,
        `One adder doing a billion sums a second draws 3 × 10⁻¹⁴ joules × 1,000,000,000 per second = 3 × 10⁻⁵ watts, which is 0.00003 watts, or 30 microwatts.`,
        `A thousand adders draw 1,000 × 0.00003 watts = 0.03 watts.`,
        `An LED bulb draws about 10 watts, and 10 ÷ 0.00003 ≈ 333,000, so about 333,000 adders would match it.`,
        `Together those adders do 333,000 × 1,000,000,000 ≈ 333,000,000,000,000 sums a second, which is 333 trillion. The same answer comes from 10 watts ÷ 3 × 10⁻¹⁴ joules per sum.`,
        `The 0.03 picojoules comes from a table of energy per operation that Google's chip team published in 2021 (Jouppi and others, ISCA 2021). In the same table, a multiplication or a read from memory costs many times more than an addition.`,
        `The figure covers the adder's own gates only. In a real processor, bringing the two numbers to the adder and taking the answer away costs more energy than the sum itself.`,
      ],
    },
    premise: `Your adder answers only while you hold its inputs. If you let go, the answer is gone. How can a circuit made of switches remember anything?`,
    cta: 'Keep an answer after you let go ▸',
    run: step2,
  },
  {
    id: 'latch',
    title: 'How can a circuit remember an answer?',
    costDelta: 0.00000013,
    inventory: 'a register, four held bits',
    numbers: {
      text: [
        `Your latch holds one bit with 8 transistors. A processor's fast memory, the cache, uses SRAM cells, which do the same job with 6.`,
        { ladder: [
          `Your 4-bit register takes 32 transistors as latches, or 24 as SRAM.`,
          `A three-minute MP3 is about 23 million bits, so about 138 million transistors.`,
          `AMD's Ryzen 7 9800X3D (2024) has 96 megabytes of cache: about 805 million bits and 4.8 billion transistors.`,
        ] },
        `So that processor spends about 4.8 billion transistors to hold about 35 songs, and only while the power is on.`,
      ],
      working: [
        `Your SR latch is 2 NAND gates of 4 transistors each, so it uses 2 × 4 = 8 transistors for one bit.`,
        `An SRAM cell uses 6 transistors for one bit, so the transistors a memory needs = bits × 6 (T = b × 6).`,
        `Your 4-bit register as SRAM cells takes 4 × 6 = 24 transistors. Built from SR latches, as you built it, it takes 4 × 8 = 32.`,
        `A song at 128,000 bits a second that lasts 3 minutes, which is 180 seconds, is 128,000 × 180 = 23,040,000 bits. Holding it takes 23,040,000 × 6 = 138,240,000 transistors.`,
        `A byte is 8 bits, and cache sizes count a megabyte as 1,048,576 bytes, so 96 megabytes is 96 × 1,048,576 × 8 = 805,306,368 bits.`,
        `Holding those bits takes 805,306,368 × 6 = 4,831,838,208 transistors, which is about 4.8 billion.`,
        `The cache holds 805,306,368 ÷ 23,040,000 ≈ 35 songs.`,
        `This counts the storage cells only. A real cache also needs circuits that find and read each bit, so its true transistor count is higher.`,
      ],
    },
    premise: `Your register and your adder each sit there until you press something. A computer runs on its own, billions of steps a second. What makes these parts run by themselves?`,
    cta: 'Make them run on their own ▸',
    run: step3,
  },
  {
    id: 'datapath',
    title: 'How do a register, an adder and a clock become a CPU?',
    costDelta: 0.0000008,
    inventory: 'a machine that computes: register, adder, clock',
    numbers: {
      text: [
        `Your machine adds once on every beat. If you pressed about once a second, its clock ran at about 1 hertz.`,
        { ladder: [
          `At 1 hertz, each beat lasts 1 second.`,
          `The first IBM PC (1981) beat 4.77 million times a second, so each beat lasted 210 nanoseconds.`,
          `AMD's Ryzen 7 9800X3D (2024) beats 4.7 billion times a second, so each beat lasts 0.21 nanoseconds.`,
        ] },
        `Pressing your button once a second without stopping, you would need about 150 years to match one second of that chip.`,
      ],
      working: [
        `The time one beat lasts is the clock period: period = 1 ÷ frequency (T = 1 ÷ f). A nanosecond is a billionth of a second.`,
        `At 1 hertz, the period is 1 ÷ 1 = 1 second.`,
        `The IBM PC's clock beat at 4.77 megahertz, so its period is 1 ÷ 4,770,000 ≈ 0.00000021 seconds, which is 210 nanoseconds.`,
        `The Ryzen 7 9800X3D's base clock is 4.7 gigahertz, so its period is 1 ÷ 4,700,000,000 ≈ 0.00000000021 seconds, which is 0.21 nanoseconds.`,
        `At one press a second, 4,700,000,000 beats take 4,700,000,000 seconds.`,
        `A year is 365.25 days × 86,400 seconds = 31,557,600 seconds, so 4,700,000,000 ÷ 31,557,600 ≈ 149 years, which is about 150 years.`,
        `The box uses the chip's base clock, which it can keep up all the time. For short bursts it can beat faster, up to 5.2 gigahertz.`,
        `A real processor works on several instructions at once, each at a different phase, so one beat is not always one whole fetch, compute and store. The box only counts beats.`,
      ],
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
    keeps the beat, all wired by hand from the transistors you built in Act 1:`,
  items: [
    { nm: 'NAND gate, the one that builds the rest', amt: '$0.000000016', icon: ico(`<rect x="5" y="9" width="18" height="16" rx="3" fill="var(--paper-high)" stroke="var(--ink-soft)" stroke-width="1.4"/><circle cx="5" cy="13.5" r="2.2" fill="var(--blue)" /><circle cx="5" cy="20.5" r="2.2" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.2"/><circle cx="26" cy="17" r="2.8" fill="var(--blue)"/>`) },
    { nm: 'Four-bit ripple adder', amt: '$0.00000058', icon: ico(`<g fill="none" stroke="var(--ink-soft)" stroke-width="1.3"><rect x="3" y="12" width="8" height="10" rx="2"/><rect x="13" y="12" width="8" height="10" rx="2"/><rect x="23" y="12" width="8" height="10" rx="2"/></g><path d="M11 15h2M21 15h2" stroke="var(--amber)" stroke-width="1.8"/><text x="17" y="9" font-family="var(--font-mono)" font-size="8" fill="var(--ink-faint)" text-anchor="middle">+</text>`) },
    { nm: 'Register, four held bits', amt: '$0.00000013', icon: ico(`<rect x="6" y="6" width="14" height="9" rx="2" fill="var(--paper-high)" stroke="var(--ink-soft)" stroke-width="1.3"/><rect x="14" y="19" width="14" height="9" rx="2" fill="var(--paper-high)" stroke="var(--ink-soft)" stroke-width="1.3"/><path d="M20 15 L20 17 L14 17 L14 19 M14 6 L14 4 L28 4 L28 19" fill="none" stroke="var(--blue)" stroke-width="1.5"/>`) },
    { nm: 'Register, adder and clock, in a loop', amt: '$0.0000008', icon: ico(`<rect x="4" y="12" width="10" height="10" rx="2" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.3"/><rect x="20" y="12" width="10" height="10" rx="2" fill="var(--paper-high)" stroke="var(--ink-soft)" stroke-width="1.3"/><path d="M14 15 h6 M20 19 h-6" stroke="var(--ink-soft)" stroke-width="1.3"/><path d="M8 28 h4 v-3 h4 v3 h4" fill="none" stroke="var(--amber)" stroke-width="1.5"/>`) },
  ],
  totalNote: ', a working computer core for less than a thousandth of a cent, on a modern chip',
  locked: { title: 'ACT 3 · Build Your Own Chip', note: 'time to print your machine a billion times' },
  next: { label: 'Continue to Act 3 ▸' },
  debrief: {
    eyebrow: 'ACT 2 · DEBRIEF',
    title: 'Your own processor, <em>cleared</em>',
    paras: [
      `The NAND could build every other gate. The adder turned gates into arithmetic. The
       register let an answer outlive its inputs. The clock joined the three into a loop:
       fetch, compute, store, repeat. <b>A CPU is that loop, a few billion times a
       second.</b>`,
      `<em>Next: stop building one of anything, and start printing billions.</em>`,
    ],
  },
};
