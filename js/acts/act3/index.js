// BYODC — Act 3: "Build Your Own Chip".
// The ladder: grow one crystal → print with light → choose a die size → package a die → sort by speed.
// You have one perfect cell; the miracle is printing billions at once, with light.
import { step1 } from './step1.js';
import { step2 } from './step2.js';
import { step3 } from './step3.js';
import { step4 } from './step4.js';
import { step5 } from './step5.js';

export const ACT3_BASE_COST = 0.000001544;   // everything through Act 2 (COST_MODEL.md)

export const ACT3 = [
  {
    id: 'ingot',
    title: 'How do you grow an ultra-pure silicon crystal with atom-level precision?',
    costDelta: 120,
    inventory: 'a polished 300 mm wafer',
    numbers: {
      text: [
        `You just grew a single crystal by touching a seed to the melt and pulling it up slowly. The method is named after Jan Czochralski, a Polish chemist, and it began with an accident.`,
        `In 1916, Czochralski was working in a laboratory of the AEG electrical company in Berlin, studying how fast metals crystallise. The story goes that while he was writing up his notes, he dipped his pen into a crucible (a heat-proof pot) of molten tin instead of his inkwell. When he lifted the pen out, a thin thread of tin hung from the nib. He examined the thread and found that it was a single crystal. He then replaced the pen with a fine glass tube, so that he could grow crystals like it on purpose.`,
        { ladder: [
          `In 1916, Czochralski's first crystals were thin threads of tin.`,
          `In 1948, Gordon Teal at Bell Labs used the same pulling method to grow crystals of germanium, the material the first transistors were made from.`,
          `Today the same method grows silicon crystals like the one you just grew, 300 mm across and more than 250 kg.`,
        ] },
        `The melt you started from was nine nines pure (99.9999999% silicon), which means that only about one atom in every billion is something other than silicon. The silicon made for chips is often purer still, up to eleven nines, which is about one stray atom in every 100 billion.`,
      ],
      working: [
        `Wikipedia's article on Czochralski, IEEE Spectrum and the Jan Czochralski website all tell the story of the pen dipped into molten tin in 1916. It is told as an anecdote, so its details are traditional rather than recorded at the time. He published the method in 1918.`,
        `Wikipedia says he replaced the nib with a capillary (a very fine tube). The Jan Czochralski website says he used a glass tube, and a clockwork motor in place of his hand, so that he could control how fast the crystal was pulled.`,
        `Wikipedia's article on Czochralski and the Electrochemical Society's history of Teal's work both give 1948 for Teal's first germanium crystal at Bell Labs. Teal published the results in 1950.`,
        `The ingot in this step is 300 mm across and 1.6 m long. Its volume is π × 0.15 m × 0.15 m × 1.6 m ≈ 0.113 m³, and silicon weighs about 2,330 kg per m³, so the ingot weighs about 0.113 × 2,330 ≈ 263 kg, close to the 265 kg in the step. The Jan Czochralski website gives over 250 kg for modern silicon crystals, and a US patent gives 200 to 300 kg for crystals 300 to 400 mm across.`,
        `Each nine is a factor of ten. Nine nines (99.9999999%) leaves 0.0000001% for other atoms, which is 1 part in 1,000,000,000. Eleven nines (99.999999999%) leaves 1 part in 100,000,000,000.`,
        `SFA Oxford gives 9 to 11 nines for silicon made for chips, and Engineer Fix gives 10 to 11 nines. Silicon for solar panels is usually less pure, at about 6 to 9 nines.`,
      ],
    },
    premise: `You have an ingot with every atom in place, sliced into more than a thousand blank wafers. A wafer is worth nothing until it carries trillions of transistors: hundreds of chips with billions each. In Act 1 it took you a whole step to build one. How do you put trillions onto a wafer when you cannot place even one by hand?`,
    cta: 'Fill the wafer ▸',
    run: step1,
  },
  {
    id: 'litho',
    title: 'How do you print billions of transistors at once?',
    costDelta: 19880,
    inventory: 'a wafer patterned, layer by layer',
    numbers: {
      text: [
        `What you just stepped through is called photolithography. Its newest form is extreme ultraviolet (EUV) lithography, and every leading chip today, including the H100 and the A17 Pro from earlier acts, is printed with it. The five steps are the simple version. Making them work at this scale took decades of engineering.`,
        `The finest detail a machine can print depends on the wavelength of its light: shorter light prints finer patterns. So the industry kept moving to shorter light.`,
        { ladder: [
          `Through the 1980s and into the 1990s, machines printed with light from mercury lamps, at 436 and then 365 nanometres.`,
          `Lasers then brought it down to 248 nanometres in the 1990s, and to 193 nanometres in the 2000s.`,
          `Since 2019, chips have been printed in volume with extreme ultraviolet light, at 13.5 nanometres.`,
        ] },
        `Each step down was hard, and 13.5 nanometres was the hardest. At that wavelength, air, glass and almost everything else absorb the light. So the light travels through a vacuum, lenses are replaced by mirrors, and the mask is a mirror with the pattern on it instead of a clear plate.`,
        `Even making the light is extreme. The machine fires about 50,000 drops of molten tin every second, each smaller than the width of a hair, and hits every drop twice with a laser. The first pulse flattens the drop, and the second turns it into a plasma of about 500,000 degrees, nearly 90 times hotter than the surface of the Sun. That plasma gives off the 13.5 nanometre light.`,
        `Only one company in the world, ASML in the Netherlands, makes these machines. A standard EUV machine costs roughly $180 million or more, and ASML put the newest version at about $380 million in 2024.`,
      ],
      working: [
        `The finest printable detail is roughly a constant × the wavelength ÷ the numerical aperture of the optics (the Rayleigh rule). Shorter wavelength and wider optics both give finer detail, which is why the wavelength fell from 436 nm to 13.5 nm.`,
        `436 ÷ 13.5 ≈ 32, so today's EUV light is about 32 times shorter than the mercury-lamp light of the 1980s.`,
        `The mirrors are made of dozens of alternating layers of molybdenum and silicon, and each one reflects only about 70% of the EUV light, so very little of the light that is made reaches the wafer.`,
        `ASML's own page on its light source gives the 50,000 droplets a second, the two laser pulses and the plasma temperature of about 500,000 kelvin. The surface of the Sun is about 5,800 kelvin, and 500,000 ÷ 5,800 ≈ 86, so it is nearly 90 times hotter.`,
        `A tin drop is about 25 to 30 micrometres across, and a human hair is about 50 to 100 micrometres thick.`,
        `Reports in 2024 put a standard EUV machine (ASML's NXE series) at about €170 million, roughly $183 million, with prices varying by model. ASML told Reuters its High-NA EUV machine costs about $380 million.`,
        `TSMC began volume production with EUV in 2019, on its N7+ process.`,
      ],
    },
    premise: `You can now print billions of transistors in one flash. But dust still lands on the wafer while it is printed, as the cleanroom in step 1 tried to stop, and a speck in the wrong place kills a chip. When you cut the wafer into the pieces that become chips, how big should each piece be?`,
    cta: 'Choose how big to cut ▸',
    run: step2,
  },
  {
    id: 'yield',
    title: 'Cost, Size and Yield',
    costDelta: 0,
    inventory: 'a wafer of tested dies',
    numbers: {
      text: [
        `You cut a wafer into dies and found that small dies gave the lowest cost for each good die. You used the formula cost per good die = wafer cost ÷ number of good dies (c = W ÷ G).`,
        `A real fab whose process is mature gets about one die-killing speck for every 10 cm² of wafer. A wafer on the newest process cost about $20,000 in 2024. Here are two real die sizes on that wafer.`,
        { ladder: [
          `A die of about 1 cm² is roughly the size of the A17 Pro, the chip in a 2023 iPhone. About 640 of them fit on the wafer and about 90% of them work, so the 580 good dies cost about $35 each.`,
          `A die of about 8 cm² is roughly the size of NVIDIA's H100 (2022), one of the leading chips data centres use to train AI. Only about 65 fit and only about 45% of them work, so the 29 good dies cost about $690 each.`,
        ] },
        `The large die uses 8 times the silicon of the small one, and each good one costs 20 times as much. That is why chips are cut as small as their design allows.`,
      ],
      working: [
        `A common estimate of the dies on a wafer is π × d² ÷ (4 × A) − π × d ÷ √(2 × A), where d is the wafer's diameter and A is the die's area. The second part takes away the dies that hang over the round edge.`,
        `For d = 300 mm and A = 100 mm², that gives 706.9 − 66.6 ≈ 640 dies. For A = 800 mm², it gives 88.4 − 23.6 ≈ 65 dies.`,
        `The share of dies that work, the yield, is estimated as Y = e<sup>−D × A</sup>, where D is the number of die-killing specks per cm² and e ≈ 2.718. With D = 0.1, a 1 cm² die gives e<sup>−0.1</sup> ≈ 0.90, and an 8 cm² die gives e<sup>−0.8</sup> ≈ 0.45.`,
        `That leaves 640 × 0.905 ≈ 580 good small dies and 65 × 0.449 ≈ 29 good large dies.`,
        `The cost per good die is $20,000 ÷ 580 ≈ $35 for the small die and $20,000 ÷ 29 ≈ $690 for the large one. The ratio is 690 ÷ 35 ≈ 20, while the ratio of areas is 8 ÷ 1 = 8.`,
        `TSMC reported about 0.1 die-killing defects per cm² for its mature processes around 2020.`,
        `Reports of the 2024 price for a newest-process wafer range from $18,000 to $20,000. At $18,000, the two costs become about $31 and $620, and the large die still costs 20 times as much. The step's own wafer costs $5,500, which is an older-process price from around 2020.`,
        `Two published measurements put the A17 Pro at 103 mm² and 114 mm², and NVIDIA gives the H100 as 814 mm². The H100 is printed on an older and cheaper process than the A17 Pro, so the box uses its size only, not its real cost.`,
        `Real specks tend to cluster, so fabs use models that give large dies a somewhat better yield than 45%. Large chips such as the H100 also switch off a faulty block instead of throwing the die away.`,
      ],
    },
    premise: `You picked a die size and counted the good dies. Every one of them is still part of the wafer, and a die on a wafer is connected to nothing: no wire in, no wire out, nowhere to plug it. How does a bare square of silicon become something you can plug into a board?`,
    cta: 'Package the die ▸',
    run: step3,
  },
  {
    id: 'package',
    title: 'How do you package a chip?',
    costDelta: 750,
    inventory: 'a packaged chip',
    numbers: {
      text: [
        `You just packaged one die by turning it over onto a substrate. For decades, packaging was the cheap, simple last step of making a chip. For AI chips it has become one of the hardest.`,
        `NVIDIA's H100 is not a single die in its package. Its main die sits beside stacks of memory on a thin slice of silicon, all sealed in one package, so that numbers can move between them quickly. TSMC builds it with an advanced packaging method called CoWoS.`,
        { ladder: [
          `In 2023, buyers wanted roughly 1 to 2 million data-centre GPUs like the H100.`,
          `NVIDIA could make only about 500,000 H100s that year, according to one industry analysis, and printing the dies was not what held it back.`,
          `Packaging was: TSMC could package only about 11,000 wafers of these chips a month, and it raced to reach about 25,000 a month by the end of 2024.`,
        ] },
        `Packaging can also join several dies into one chip. Apple's M1 Ultra (2022) is two dies joined inside one package by more than 10,000 connections, enough that software treats the pair as a single chip.`,
        `So the step you just did by hand, with eight bumps, has become one of the most valuable steps in making an AI chip.`,
      ],
      working: [
        `The Next Platform (October 2023) estimated that NVIDIA could make about 500,000 H100s in 2023 against demand for roughly 1 to 2 million data-centre GPUs, and named CoWoS packaging capacity as the limit.`,
        `TrendForce, citing Morgan Stanley in 2023, put TSMC's CoWoS capacity at about 11,000 wafers a month, rising to about 25,000 a month by the end of 2024. TrendForce also reported that TSMC raised CoWoS prices for rush orders.`,
        `SemiAnalysis described the H100 package as its GPU die plus high-bandwidth memory stacks on TSMC's CoWoS, and said the GPU die itself was not what limited production.`,
        `Apple's March 2022 announcement says the M1 Ultra's UltraFusion connects two M1 Max dies across more than 10,000 signals, at 2.5 terabytes a second, so that software sees one chip. TechInsights judged the 10,000 figure to be conservative.`,
      ],
    },
    premise: `One chip is packaged and ready to plug in, and the rest of the tray is going down the same line. They came off the same wafer and were printed from the same mask, so they should all be identical. Are they?`,
    cta: 'Test them ▸',
    run: step4,
  },
  {
    id: 'bin',
    title: 'Why does the same chip sell at three prices?',
    costDelta: 920,
    inventory: 'chips graded and priced',
    numbers: {
      text: [
        `You tested six chips from one wafer and sorted them into three bins by the clock speed each one passed. Chipmakers sort real chips in the same way. In 2022, Intel sold the Core i9-13900K, rated up to 5.8 GHz, for $589. In January 2023, it added the Core i9-13900KS, which is the same chip picked from the ones that tested fastest. The KS was rated up to 6.0 GHz and sold for $699, so buyers paid $110 more for a chip that had passed a faster test.`,
        `Chipmakers also sort chips in a second way: by how many of their blocks work. In step 3 you found that a large die is likely to have a speck on it somewhere. NVIDIA's H100 (2022) is a large die, and its design lets a die with a speck still be sold. The full design, called GH100, has 144 streaming multiprocessors, the blocks that do the processing. The versions of the H100 that NVIDIA sells switch on fewer of them.`,
        { ladder: [
          `The full GH100 design has 144 streaming multiprocessors.`,
          `The H100 SXM5, the version mounted directly on NVIDIA's server boards, switches on 132 of them.`,
          `The H100 PCIe, the version sold as a plug-in card, switches on 114 of them.`,
        ] },
        `If a speck lands in one or a few of the blocks, the die can still be sold with those blocks switched off. So binning rescues dies that the yield step would otherwise have thrown away.`,
      ],
      working: [
        `Intel's recommended prices were $589 for the i9-13900K when it went on sale in October 2022 and $699 for the i9-13900KS when it went on sale on 12 January 2023. PC Perspective reported the $699 and the launch date, and reviews by Kowatek and Club386 give both prices. $699 − $589 = $110.`,
        `The 6.0 GHz of the KS is a short burst on one or two of its cores, not every core all the time. TechSpot and Club386 both report that the KS is also rated for more power (150 watts against 125 watts), so real binning sorts chips by power as well as by speed.`,
        `NVIDIA's own article on the Hopper design gives 144 streaming multiprocessors for the full GH100, 132 for the H100 SXM5 and 114 for the H100 PCIe. Hardware Cooling's report on the launch gives the same three numbers.`,
        `144 − 132 = 12 blocks are switched off on the SXM5, and 144 − 114 = 30 on the PCIe card.`,
        `NVIDIA does not say why the blocks are switched off. Hardware Cooling's report says it is for yield: so few dies of this size come out with no defect at all that a few blocks are left off from the start.`,
      ],
    },
    premise: null,
    cta: 'Finish Act 3 ▸',
    run: step5,
  },
];

const ico = inner => `<svg width="30" height="30" viewBox="0 0 34 34">${inner}</svg>`;
export const ACT3_SUMMARY = {
  eyebrow: 'ACT 3 COMPLETE',
  title: 'You made <em>a real chip</em>',
  sub: `A crystal grown from a seed, a pattern printed in light, the good dies counted,
    packaged and graded:`,
  items: [
    { nm: 'Polished 300 mm wafer', amt: '$120', icon: ico(`<rect x="14" y="4" width="6" height="26" rx="3" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.3"/><path d="M12 8 h10 M12 15 h10 M12 22 h10" stroke="var(--ink-soft)" stroke-width="1"/>`) },
    { nm: 'Printed on the newest process', amt: '$19,880', icon: ico(`<circle cx="17" cy="17" r="13" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.3"/><path d="M9 11 h16 M9 17 h16 M9 23 h16 M11 9 v16 M17 9 v16 M23 9 v16" stroke="var(--blue)" stroke-width=".7"/>`) },
    { nm: 'Dies tested (yield), no extra cost', amt: '$0', icon: ico(`<circle cx="17" cy="17" r="13" fill="none" stroke="var(--ink)" stroke-width="1.3"/><rect x="10" y="10" width="6" height="6" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width=".8"/><rect x="18" y="10" width="6" height="6" fill="var(--red-soft)" stroke="var(--red)" stroke-width=".8"/><rect x="10" y="18" width="6" height="6" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width=".8"/><rect x="18" y="18" width="6" height="6" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width=".8"/>`) },
    { nm: 'Packaged chip (CoWoS)', amt: '$750', icon: ico(`<rect x="7" y="11" width="20" height="14" rx="2" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.3"/><path d="M11 11 v-4 M17 11 v-4 M23 11 v-4 M11 25 v4 M17 25 v4 M23 25 v4" stroke="var(--ink-soft)" stroke-width="1.2"/>`) },
    { nm: 'Final test and grading', amt: '$920', icon: ico(`<rect x="5" y="14" width="7" height="12" rx="1.5" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.2"/><rect x="14" y="14" width="7" height="12" rx="1.5" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.2"/><rect x="23" y="14" width="7" height="12" rx="1.5" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.2"/><path d="M8.5 11 v-3 M17.5 11 v-3 M26.5 11 v-3" stroke="var(--ink-soft)" stroke-width="1.2"/><rect x="6.5" y="17" width="4" height="4" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width=".8"/>`) },
  ],
  totalNote: ', one wafer on the newest process, and one chip from it packaged and tested',
  locked: { title: 'ACT 4 · Build Your Own GPU', note: 'now decide what an AI chip should be made of' },
  next: { label: 'Continue to Act 4 ▸' },
  debrief: {
    eyebrow: 'ACT 3 · DEBRIEF',
    title: 'Your own chip, <em>cleared</em>',
    paras: [
      `You grew a crystal from a seed, printed billions of transistors in flashes of light, chose a die size and counted the good dies, packaged a die face down onto its bumps, and sorted the chips by the speed each one tested at. <b>Every chip in a data centre is made this way.</b>`,
      `<em>Next: you can now make any design in silicon, and every square millimetre of die costs money. What should an AI chip fill it with?</em>`,
    ],
  },
};
