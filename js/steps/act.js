// BYODC — Act 1 step configs. The extensible ladder: append configs for later acts.
import { chargerArt } from '../art/charger.js';
import { dopingArt } from '../art/doping.js';
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
    costDelta: 0.000000004,
    inventory: 'a doped silicon wafer',
    numbers: {
      text: [
        `You just doped silicon. Here is what that does to a cube of silicon 1 cm on each side, measured from one face to the opposite face.`,
        { ladder: [
          `Pure silicon: about 300,000 ohms.`,
          `1 phosphorus atom in 50 million: about 5 ohms.`,
          `1 in 5 million: about 0.5 ohms.`,
          `1 in 500,000: about 0.09 ohms.`,
          `Copper, for comparison: 0.0000017 ohms.`,
        ] },
        `One atom in 5 million cuts the resistance more than 500,000 times. Every chip starts with this.`,
      ],
      working: [
        `Resistance falls as the number of free carriers rises: conductivity = carriers × charge on each × how easily they move (σ = n·q·μ). In pure silicon, heat frees only about 1 electron in every 5 trillion atoms.`,
        `For a 1 cm cube measured face to face, resistance = resistivity × length ÷ area = resistivity × 1 cm ÷ 1 cm², so the resistance in ohms equals the resistivity in ohm·cm.`,
        `Resistivity = 1 ÷ (n × q × μ), where n is the number of free carriers per cm³, q = 1.6 × 10⁻¹⁹ coulombs is the charge on each, and μ is how fast a carrier drifts, in cm²/V·s.`,
        `Silicon has 5 × 10²² atoms per cm³. When it is pure, heat frees about 10¹⁰ electrons per cm³, and 5 × 10²² ÷ 10¹⁰ = 5 × 10¹², which is 1 free electron for every 5 trillion atoms.`,
        `For pure silicon, 1 ÷ (10¹⁰ × 1.6 × 10⁻¹⁹ × (1,400 + 450)) ≈ 340,000. The 450 is for the holes, which heat frees in equal number. Reference tables give 230,000 to 320,000, so the box says about 300,000 ohms.`,
        `With 1 phosphorus atom per 50 million, n = 5 × 10²² ÷ 5 × 10⁷ = 10¹⁵, and 1 ÷ (10¹⁵ × 1.6 × 10⁻¹⁹ × 1,360) ≈ 4.6 ohms.`,
        `With 1 per 5 million, n = 10¹⁶ and μ ≈ 1,180, so 1 ÷ (10¹⁶ × 1.6 × 10⁻¹⁹ × 1,180) ≈ 0.53 ohms.`,
        `With 1 per 500,000, n = 10¹⁷ and μ ≈ 730, so 1 ÷ (10¹⁷ × 1.6 × 10⁻¹⁹ × 730) ≈ 0.086 ohms. The mobility μ falls as you add phosphorus, because the extra atoms get in the electrons' way.`,
        `Pure silicon against 1 per 5 million gives 300,000 ÷ 0.53 ≈ 570,000, which is more than 500,000 times.`,
        `Copper's resistivity is 0.0000017 ohm·cm, which is still about 50,000 times lower than the most heavily doped silicon here.`,
      ],
    },
    numbersArt: dopingArt,             // REVIEW_NOTES N-123: the scale, and where this crystal goes
    premise: `Silicon now conducts. But so does a copper wire, so what have we gained? The answer starts on the line where an N block meets a P block.`,
    cta: 'Press N against P ▸',
    run: step1,
  },
  {
    id: 'pn-junction',
    title: 'What happens where N meets P?',
    costDelta: 0.000000004,
    inventory: 'a diode, current one way only',
    numbers: {
      text: [
        `Your diode is a one-way street. A common silicon diode, the 1N4001, shows how one-way a real one is.`,
        { ladder: [
          `Forwards, it is built to carry 1 amp.`,
          `Backwards, even with 50 volts pushing, no more than 10 microamps leak through, which is a hundred-thousandth of the forward current.`,
        ] },
        `Going forwards still has a price. Every electron that crosses has to climb the 0.7-volt hill, and the energy it spends there turns into heat. Power is voltage × current (P = V × I), so when 1 amp flows forwards, the diode turns at least 0.7 watts into heat.`,
        `Your phone charger depends on this one-way behaviour. The current from a wall socket flows back and forth, and diodes inside the charger let it through in one direction only. That gives your phone the one-way current its battery needs.`,
      ],
      working: [
        `The 1N4001 datasheets rate it for an average forward current of 1 amp and a reverse voltage of 50 volts. They list the reverse leakage at 25 °C as at most 5 microamps, or 10 microamps in one manufacturer's table, so the box uses the larger figure.`,
        `10 microamps ÷ 1 amp = 0.00001, which is a hundred-thousandth.`,
        `Power is voltage × current, so 0.7 volts × 1 amp = 0.7 watts.`,
        `The box says "at least" because a real 1N4001 drops about 0.93 volts at 1 amp, so it actually turns about 0.93 watts into heat. 0.7 volts is the lowest the drop can be.`,
        `A charger usually has four diodes arranged in a bridge (a bridge rectifier), so that both halves of the back-and-forth current come out flowing the same way.`,
      ],
    },
    numbersArt: chargerArt,            // REVIEW_NOTES N-053: a phone charger, taken apart
    premise: `A diode lets current through one way only, and the current itself decides when it flows. A switch needs something more: a separate wire that turns a large current on and off. How do you build one?`,
    cta: 'Take control of the current ▸',
    run: step2,
  },
  {
    id: 'npn-transistor',
    title: 'How can a small current switch a large one?',
    costDelta: 0.000000004,
    inventory: 'a working transistor',
    numbers: {
      text: [
        `Your NPN transistor stays on only while 10 µA flows into its base. If that current stops, the transistor turns off.`,
        `Power is voltage × current. At 0.7 volts and 0.00001 amps, that is 7 microwatts, and the transistor needs it for as long as it stays on.`,
        `One transistor is cheap, but a chip is made of billions of them. The chip in a 2023 iPhone, Apple's A17 Pro, has 19 billion transistors. Suppose chips were built from your NPN and every transistor were held on.`,
        { ladder: [
          `A thousand of them would draw 7 milliwatts.`,
          `A million would draw 7 watts.`,
          `A billion would draw 7,000 watts, as much as seven microwaves running at once.`,
          `The 19 billion in one phone chip would draw 133,000 watts.`,
        ] },
        `That is more electricity than 100 homes use, and it would be inside your pocket. Your transistor works, but a chip cannot be built from it.`,
      ],
      working: [
        `One transistor draws 0.7 volts × 10 microamps = 0.7 × 0.00001 = 0.000007 watts, which is 7 microwatts.`,
        `A thousand transistors draw 1,000 × 7 microwatts = 7 milliwatts, and a million draw 1,000,000 × 7 microwatts = 7 watts.`,
        `A billion transistors draw 1,000,000,000 × 7 microwatts = 7,000 watts. A microwave cooks at about 1,000 watts, so that is 7,000 ÷ 1,000 = 7 microwaves.`,
        `Nineteen billion transistors draw 19,000,000,000 × 7 microwatts = 133,000 watts. Apple announced 19 billion transistors for the A17 Pro in September 2023.`,
        `An average home uses about 1.2 kilowatts, or about 10,500 kilowatt-hours a year, so 133,000 ÷ 1,200 ≈ 111 homes.`,
        `This counts only the current that keeps each transistor on. The larger current that each transistor controls would come on top.`,
      ],
    },
    premise: `Your transistor can now control a large current. The catch is that it consumes a small current the whole time it is on, just to stay on. That is acceptable for hundreds of transistors and impossible for billions. Wouldn't it be better if we could hold it on without any current at all?`,
    cta: 'Find a better transistor ▸',
    run: step3,
  },
  {
    id: 'mosfet',
    title: 'Can a transistor stay on without spending any current?',
    costDelta: 0.000000004,
    inventory: 'a voltage-driven transistor (MOSFET)',
    numbers: {
      text: [
        `You built an NMOS. Like the NPN from step 3, it lets a current run through it while it is on. The difference is what it takes to keep it on.`,
        { ladder: [
          `The NPN stays on only while a current keeps flowing into its base. That costs 7 microwatts for every moment it is on.`,
          `The NMOS stays on while its gate holds a voltage. The glass under the gate blocks current, so no current has to flow into the gate to keep it on.`,
        ] },
        `Setting the gate takes one small charge. The energy for that is the gate's capacitance × voltage² (E = C × V²), about a thousandth of a trillionth of a joule.`,
        `Take the 19 billion transistors in a phone chip. If they were NPNs, keeping them all on would need 133,000 watts flowing into their bases. As NMOS transistors, they need no current at their gates, only one charge of about 0.00002 joules to set them all.`,
      ],
      working: [
        `An NPN transistor needs 0.7 volts × 10 microamps = 7 microwatts at its base for as long as it is on (step 3).`,
        `Charging a gate takes energy E = C × V², where C, the capacitance, is how much charge the gate stores per volt. With a generous C of 1 femtofarad (10⁻¹⁵ farads) and V = 1 volt, E = 10⁻¹⁵ × 1² = 10⁻¹⁵ joules, which is a thousandth of a trillionth. Published estimates for real gates are about 25 times smaller still.`,
        `For 19 billion NPN transistors, the base current costs 19,000,000,000 × 7 microwatts = 133,000 watts.`,
        `For 19 billion NMOS gates, one charge costs 19,000,000,000 × 10⁻¹⁵ joules = 0.000019 joules, which is about 0.00002 joules.`,
        `In a modern chip the glass is only a few atoms thick, so a very small current does pass through it into the gate. This is one more kind of leakage, and it is tiny next to the NPN's base current.`,
      ],
    },
    premise: `Your NMOS needs no current at its gate. In a chip there is no lamp: each transistor's only job is to set the gate of the next one high or low, so any current it passes from the supply to ground is wasted. Can a circuit hold its output high or low and draw nothing?`,
    cta: 'Hold the output without current ▸',
    run: step4,
  },
  {
    id: 'cmos-inverter',
    title: 'Why don\'t a billion transistors melt?',
    costDelta: 0.000000008,
    inventory: 'a CMOS inverter, the cell every processor repeats',
    numbers: {
      text: [
        `Your CMOS pair draws current only during the instant it flips. Between flips, one of its two transistors is always off, so no current runs from power to ground.`,
        `That is what lets a chip hold billions of transistors. NVIDIA's H100 (2022), one of the leading chips that data centres use to train AI, is built from pairs like these.`,
        `To find the power per transistor, divide the total power by the number of transistors (p = P ÷ N). The H100 draws at most 700 watts for 80 billion transistors, which is under 9 billionths of a watt each.`,
        { ladder: [
          `If those 80 billion transistors were built the step 3 way and all were held on, they would draw 560,000 watts.`,
          `Built as CMOS pairs, they draw at most 700 watts, and that includes the chip's memory.`,
        ] },
        `So 80 billion transistors run on less power than one microwave.`,
      ],
      working: [
        `Each transistor gets 700 watts ÷ 80,000,000,000 = 0.00000000875 watts, which is under 9 billionths of a watt. This is an upper bound, because the 700 watts also feeds the memory on the same board.`,
        `Built the step 3 way, the transistors would draw 80,000,000,000 × 7 microwatts = 560,000 watts.`,
        `Dividing 7 microwatts by 0.00000000875 watts gives 800, so the real chip's whole budget, shared out, is 800 times less per transistor than a step 3 transistor needs just to stay on.`,
        `A microwave cooks at about 1,000 watts, and 700 watts is less than that.`,
        `Real CMOS also leaks a little while it is idle, but flipping is still most of the power.`,
      ],
    },
    premise: null,
    cta: 'Finish Act 1 ▸',
    run: step5,
  },
];

const ico = inner => `<svg width="30" height="30" viewBox="0 0 34 34">${inner}</svg>`;
// Course restructure (2026-10-25): costs follow COST_MODEL.md, at about $0.000000004 a
// transistor on a modern chip (an H100 die costs about $300 for 80 billion transistors).
export const ACT1_SUMMARY = {
  eyebrow: 'ACT 1 COMPLETE',
  title: 'You built the <em>CMOS inverter</em>',
  sub: `From doped sand to the cell every processor repeats billions of times. On a modern
    chip, each of these costs less than a millionth of a cent:`,
  items: [
    { nm: 'Doped silicon, with carriers', amt: '$0.000000004', icon: ico(`<g fill="none" stroke="var(--ink-soft)" stroke-width="1.4"><circle cx="11" cy="11" r="4"/><circle cx="23" cy="11" r="4"/><circle cx="11" cy="23" r="4"/><circle cx="23" cy="23" r="4"/><path d="M15 11h4M15 23h4M11 15v4M23 15v4"/></g><circle cx="23" cy="11" r="4" fill="var(--blue-soft)" stroke="var(--blue)"/>`) },
    { nm: 'A diode, current one way only', amt: '$0.000000004', icon: ico(`<path d="M11 8 L24 17 L11 26 Z" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.3"/><path d="M24 8 V26" stroke="var(--blue)" stroke-width="2"/><path d="M4 17 h7 M24 17 h6" stroke="var(--ink-soft)" stroke-width="1.3"/>`) },
    { nm: 'NPN transistor', amt: '$0.000000004', icon: ico(`<rect x="3" y="10" width="10" height="14" rx="2" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.3"/><rect x="13" y="10" width="8" height="14" rx="1.5" fill="var(--red-soft)" stroke="var(--red)" stroke-width="1.3"/><rect x="21" y="10" width="10" height="14" rx="2" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.3"/><path d="M17 3v7" stroke="var(--ink-soft)" stroke-width="1.4"/>`) },
    { nm: 'MOSFET, switched by voltage', amt: '$0.000000004', icon: ico(`<rect x="4" y="18" width="26" height="11" rx="2" fill="var(--red-soft)" stroke="var(--red)" stroke-width="1.3"/><rect x="10" y="14" width="14" height="3" fill="var(--amber)"/><rect x="10" y="6" width="14" height="7" rx="1.5" class="gate-metal"/><path d="M11 20h12" stroke="var(--blue)" stroke-width="1.8" stroke-linecap="round"/>`) },
    { nm: 'CMOS inverter', amt: '$0.000000008', icon: ico(`<path d="M17 3v6M17 25v6M17 13v8" stroke="var(--ink-soft)" stroke-width="1.4"/><rect x="11" y="7" width="12" height="8" rx="2" fill="var(--red-soft)" stroke="var(--red)" stroke-width="1.3"/><rect x="11" y="19" width="12" height="8" rx="2" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.3"/><circle cx="27" cy="17" r="2.6" fill="var(--ink)"/>`) },
  ],
  totalNote: ', less than a millionth of a cent, because a chip holds billions of these',
  locked: { title: 'ACT 2 · Build Your Own Processor', note: 'now wire your transistors into gates that decide, add and remember' },
  next: { label: 'Continue to Act 2 ▸' },
  debrief: {
    eyebrow: 'ACT 1 · DEBRIEF',
    title: 'Your own transistor, <em>cleared</em>',
    paras: [
      `Doping gave silicon carriers. Pressing N against P built a barrier you could raise
       and lower. Two of those junctions back to back let a small current control a large
       one. The gate made that control free, and the twin pair made it cheap enough to
       repeat. <b>Everything after this act is this transistor, repeated.</b>`,
      `<em>Next: wire your transistors into gates that decide, add and remember.</em>`,
    ],
  },
};
