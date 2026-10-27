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
        `You built a NAND gate from 4 transistors, and then you wired copies of it into a NOT gate and an AND gate. Copies of one universal gate can build any logic at all, so a whole computer can be built from a single kind of gate. Engineers have done exactly that.`,
        `The Apollo Guidance Computer, designed at MIT in the 1960s, steered the Apollo spacecraft to the Moon in 1969. Almost all of its logic was built from one kind of chip, and each chip held two NOR gates with three inputs each. NOR is NAND's mirror twin: its output is 1 only when every input is 0, and copies of it can build any other gate, just as copies of NAND can.`,
        { ladder: [
          `You built one NAND gate from 4 transistors.`,
          `The version of the Apollo computer used on the crewed flights had about 2,800 of those NOR chips, which is about 5,600 gates.`,
          `Apple's A17 Pro (2023), the phone chip from Act 1, has 19 billion transistors, which is enough for about 4.75 billion NAND gates.`,
        ] },
        `The gate you built also gave its name to the memory in your phone. Phones store photos and apps in NAND flash memory, which Toshiba introduced in 1987. Its memory cells are transistors connected one after another in a chain, like the two NMOS in your gate, and current gets through the chain only when every transistor in it is on.`,
      ],
      working: [
        `A two-input NAND gate has 2 PMOS and 2 NMOS transistors, which makes 4 transistors.`,
        `Wikipedia's article on the Apollo Guidance Computer says the Block II version, the one used on the crewed flights, had about 2,800 chips, mostly dual three-input NOR gates made by Fairchild Semiconductor. A Hackaday project that rebuilds the computer counts 2,826 of them.`,
        `2,800 chips × 2 gates = 5,600 gates. A few of the chips were other parts, such as amplifiers for the memory, so the true number of gates is a little lower.`,
        `The earlier Block I version used about 4,100 chips with one NOR gate each, according to both Wikipedia and EE Journal's history of the computer.`,
        `NOR is universal for the same reason NAND is. If you tie a NOR gate's inputs together, it works as a NOT gate, and if you put a NOT gate after a NOR gate, you get an OR gate.`,
        `The A17 Pro has 19,000,000,000 transistors, and 19,000,000,000 ÷ 4 = 4,750,000,000 NAND gates. This only counts how many NAND gates the transistors could make, because a large part of a real chip is memory and its logic uses many kinds of gate.`,
        `Wikipedia's article on flash memory and Nanowerk's glossary both say NAND flash is named after the NAND gate because its cells are connected in series, while NOR flash connects them in parallel. Wikipedia says Fujio Masuoka's team at Toshiba presented NAND flash in 1987.`,
      ],
    },
    premise: `Your NAND gate can decide, and copies of it can build any other gate. But a decision is only a yes or a no. Nearly everything a computer does for you, from totalling a bill to drawing a screen, comes down to adding numbers. Can gates that only answer yes or no add 5 and 3?`,
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
        `You built a ripple adder with 4 columns. A processor adds 32 or 64 columns at a time, and every sum it does costs a little energy.`,
        `In 2021, Google's chip team put the energy of one 32-bit addition on a modern chip at about 0.03 picojoules. A picojoule is a trillionth of a joule.`,
        `The power an adder draws is the energy of one sum × the number of sums it does each second (P = E × n).`,
        { ladder: [
          `If one adder did a billion sums a second, it would draw 0.00003 watts.`,
          `If a thousand adders each did a billion sums a second, they would draw 0.03 watts.`,
          `If 333,000 adders each did a billion sums a second, they would draw 10 watts, as much as one LED bulb.`,
        ] },
        `So the 10 watts that one LED bulb draws would be enough for about 333 trillion 32-bit sums every second. Adding two numbers is one of the cheapest things a chip does.`,
      ],
      working: [
        `A picojoule is 10⁻¹² joules, so 0.03 picojoules is 0.03 × 10⁻¹² = 3 × 10⁻¹⁴ joules.`,
        `One adder doing a billion sums a second draws 3 × 10⁻¹⁴ joules × 1,000,000,000 per second = 3 × 10⁻⁵ watts, which is 0.00003 watts, or 30 microwatts.`,
        `A thousand adders draw 1,000 × 0.00003 watts = 0.03 watts.`,
        `An LED bulb draws about 10 watts, and 10 ÷ 0.00003 ≈ 333,000, so about 333,000 adders would match it.`,
        `Together those adders do 333,000 × 1,000,000,000 ≈ 333,000,000,000,000 sums a second, which is 333 trillion. The same answer comes from 10 watts ÷ 3 × 10⁻¹⁴ joules per sum.`,
        `The 0.03 picojoules comes from a table of energy per operation that Google's chip team published in 2021 (Jouppi and others, ISCA 2021). In the same table, a multiplication or a read from memory costs many times more than an addition.`,
        `The figure covers the adder's own gates only. In a real processor, bringing the two numbers to the adder and taking the answer away costs more energy than the sum itself.`,
      ],
    },
    premise: `Your ripple adder adds, and the adder inside every processor is built from these same columns, only wider. But it answers only while you hold its inputs. If you let go, the answer is gone. Anything done in steps, from long division to a game of chess, needs to keep what it just worked out. How can a circuit made of switches remember anything?`,
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
        `Your SR latch holds one bit with two NAND gates, which is 8 transistors.`,
        `Real processors keep their fast memory, the cache, in a cell called SRAM. An SRAM cell does the same job as your latch: it holds one bit for as long as the power is on. A more efficient design lets it do that with 6 transistors instead of 8. How it is wired is beyond this course, so take the 6 as given.`,
        `To find how many transistors a memory needs, multiply the number of bits it holds by 6 (transistors = bits × 6, or T = b × 6).`,
        { ladder: [
          `Your register holds 4 bits. Built from SR latches, as you built it, it takes 32 transistors. Built from SRAM cells, it would take 24.`,
          `A three-minute song saved as an MP3 at 128,000 bits a second is about 23 million bits, so holding it would take about 138 million transistors.`,
          `AMD's Ryzen 7 9800X3D (2024), a desktop processor, has 96 megabytes of cache, which is about 805 million bits and takes about 4.8 billion transistors.`,
        ] },
        `So that processor spends about 4.8 billion transistors to hold about 35 songs, and it holds them only while the power is on.`,
      ],
      working: [
        `Your SR latch is 2 NAND gates of 4 transistors each, so it uses 2 × 4 = 8 transistors for one bit.`,
        `An SRAM cell uses 6 transistors for one bit. This course does not cover how those 6 are wired.`,
        `Your 4-bit register as SRAM cells takes 4 × 6 = 24 transistors. Built from SR latches, as you built it, it takes 4 × 8 = 32.`,
        `A song at 128,000 bits a second that lasts 3 minutes, which is 180 seconds, is 128,000 × 180 = 23,040,000 bits. Holding it takes 23,040,000 × 6 = 138,240,000 transistors.`,
        `A byte is 8 bits, and cache sizes count a megabyte as 1,048,576 bytes, so 96 megabytes is 96 × 1,048,576 × 8 = 805,306,368 bits.`,
        `Holding those bits takes 805,306,368 × 6 = 4,831,838,208 transistors, which is about 4.8 billion.`,
        `The cache holds 805,306,368 ÷ 23,040,000 ≈ 35 songs.`,
        `This counts the storage cells only. A real cache also needs circuits that find and read each bit, so its true transistor count is higher.`,
      ],
    },
    premise: `Your register holds a number for as long as the power is on, and your adder can add to it. But each part sits there until you press something. A computer runs on its own, billions of steps a second, with nobody pressing anything. What turns these parts into a machine that runs by itself?`,
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
        `Your machine adds the addend to its register once on every beat of its clock. Its clock beat once each time you pressed, so if you pressed about once a second, it beat at 1 hertz.`,
        `The time one beat lasts is called the clock period. It is 1 divided by the number of beats per second (period = 1 ÷ frequency, or T = 1 ÷ f).`,
        { ladder: [
          `At 1 hertz, each beat of your machine lasts 1 second.`,
          `The first IBM PC (1981) had a clock that beat 4.77 million times a second, so each beat lasted 210 nanoseconds (billionths of a second).`,
          `AMD's Ryzen 7 9800X3D (2024), the desktop processor from step 3, beats 4.7 billion times a second, so each beat lasts 0.21 nanoseconds.`,
        ] },
        `In one second that processor makes 4.7 billion beats. If you pressed your clock's button once a second without stopping, it would take you about 150 years to make as many.`,
      ],
      working: [
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
