// BYODC — Act 4: "Build Your Own GPU".
// The ladder: eight adders at once (race) → how a chip multiplies (mac) → registers
// (registers) → move the data, not the weights (weights) → match memory to compute (feed)
// → assemble the GPU (gpu). One general machine doing one sum at a time becomes thousands
// of copies of one sum, and most of the work turns out to be delivering the numbers.
import { precisionArt } from '../../art/precision.js';
import { cpuGpuArt } from '../../art/cpugpu.js';
import { memoryArt } from '../../art/memory.js';
import { systolicArt } from '../../art/systolic.js';
import { heatArt } from '../../art/heat.js';
import { step1 } from './step1.js';
import { step2 } from './step2.js';
import { step3 } from './step3.js';
import { step4 } from './step4.js';
import { step5 } from './step5.js';
import { step6 } from './step6.js';

export const ACT4_BASE_COST = 21670.000001544;   // everything through Act 3 (COST_MODEL.md)

// Six steps since the micro-learning makeover (DESIGN_MAKEOVER.md §5): the old
// "stationary trick" was two lessons under one number and is now steps 3 and 4.
// Costs (2026-10-25, COST_MODEL.md): designing the die adds no factory cost, so only the
// HBM (step 5) adds to SPENT. One H100 costs about $3,300 to make.
export const ACT4 = [
  {
    id: 'race',
    title: 'CPU vs GPU',
    costDelta: 0,
    inventory: 'a 16-lane compute block',
    numbers: {
      text: [
        `You built a block of sixteen lanes. Each lane does one sum per cycle, and all sixteen take the same instruction from one scheduler at the same moment.`,
        `Saying that a GPU is more powerful than a CPU is an oversimplification. Think of a CPU as a small team of head chefs: each one can cook any dish and decides every step as they go. Think of a GPU as a huge kitchen of helpers who all chop at the same moment when they are told to. They cannot plan a meal, but they get through a mountain of onions in seconds.`,
        `A computer uses them the same way. The CPU runs everything, including the operating system, whether or not the computer has a GPU at all. When a job needs the same sum done on a mountain of numbers, like drawing a game's picture or running an AI model, the CPU hands that job to the GPU.`,
        { ladder: [
          `A desktop CPU such as AMD's Ryzen 9 9950X (2024) has 16 cores, and each core's clock beats up to 5.7 billion times a second.`,
          `NVIDIA's H100 GPU (2022) has 16,896 lanes. Each one beats more slowly, up to 1.98 billion times a second, but there are about a thousand times as many.`,
          `Counting lanes × beats, the H100's lanes do up to about 33 trillion sums a second. If you did one sum every second, day and night, that one second of work would take you about a million years.`,
        ] },
        `Neither is simply stronger. Each CPU core is fast and can follow any list of instructions on its own. Each GPU lane is simple, but thousands of them work through one job together.`,
      ],
      working: [
        `To count sums a second, multiply the number of lanes by the clock speed, the number of beats in a second (sums per second = lanes × clock speed, S = L × f). A clock that beats 1.98 billion times a second is written 1.98 GHz.`,
        `The H100's lanes do 16,896 × 1.98 billion ≈ 33,500 billion sums a second, which is about 33 trillion. 1.98 GHz is its top (boost) clock, so this is an upper limit.`,
        `A year has 365.25 × 24 × 60 × 60 = 31,557,600 seconds. At one sum a second, 33,500,000,000,000 sums take 33,500,000,000,000 ÷ 31,557,600 ≈ 1,060,000 years, which is about a million years.`,
        `16,896 ÷ 16 = 1,056, so the H100 has about a thousand times as many lanes as the Ryzen 9 9950X has cores. 5.7 ÷ 1.98 ≈ 2.9, so each CPU core beats about three times as fast.`,
        `The Ryzen 9 9950X figures (16 cores, up to 5.7 GHz) are AMD's published specification. The H100 figures (16,896 lanes, up to 1.98 GHz) are NVIDIA's, for the H100 SXM.`,
        `This compares how the two are built, not how fast they finish a job. A CPU core can also do several sums in one beat with its own wide units, and each H100 lane can do a multiply and an add in one beat, which NVIDIA counts as two operations (2 × 33.5 trillion = 67 trillion, NVIDIA's published figure for these lanes).`,
        `NVIDIA calls the part that hands one instruction to a group of 32 lanes a warp scheduler. On a CPU, the part that reads instructions and decides what to do next is called the control unit.`,
      ],
    },
    numbersArt: cpuGpuArt,             // REVIEW_NOTES N-098: the head chefs and the kitchen
    premise: `Sixteen lanes adding at once is enough to draw a game on a screen. It is not enough for AI. Almost all of the arithmetic in an AI model starts with a multiply, and your lane cannot multiply at all. How does a chip multiply?`,
    cta: 'See how a chip multiplies ▸',
    run: step1,
  },
  {
    id: 'mac',
    title: 'How do the lanes in a GPU perform multiplication?',
    costDelta: 0,
    inventory: 'a MAC unit (multiply-accumulate unit)',
    numbers: {
      text: [
        `You built a multiplier as a square grid of AND gates, and you found that if you halve the width of the numbers, both sides of the grid halve, so the multiplier gets four times smaller. Since about 2015, the makers of AI chips have used that rule again and again, by moving to narrower and narrower numbers.`,
        { ladder: [
          `For years, chips trained AI models with 32-bit numbers.`,
          `NVIDIA's V100 (2017) added Tensor Cores, blocks built to multiply 16-bit numbers, and 16-bit numbers became the usual choice for training.`,
          `Google's first TPU, in use in Google's data centres from 2015, already ran trained models with 8-bit whole numbers. NVIDIA's H100 (2022) added 8-bit floating-point numbers, which carry the scale factor this step mentioned.`,
          `NVIDIA's Blackwell chips (2024) went down to 4-bit numbers.`,
        ] },
        `Each step down pays off on a real chip. With 16-bit numbers, the H100 can do about 500 trillion multiply-accumulates a second. With 8-bit numbers, it can do about 1,000 trillion, which is twice as many. NVIDIA counts each multiply-accumulate as two operations, so it gives these figures as about 1,000 and 2,000 trillion operations a second.`,
        `Energy follows the same rule. A widely used table of measured costs, published in 2014, lists a 32-bit multiply at 15.5 times the energy of an 8-bit one, which is close to the 4 × 4 = 16 that the square rule predicts.`,
        `Spec sheets often print a figure twice as large, marked "with sparsity". That figure assumes half of the numbers are zero and skipped, so the dense figure is the one to compare.`,
      ],
      working: [
        `Google's 2017 paper on its first TPU (Jouppi and others) says the chip had been in use in Google's data centres since 2015, and that its main unit was a grid of 65,536 8-bit multiply-accumulate units. Cadence's write-up of the paper says the same. That TPU ran trained models but did not train them.`,
        `NVIDIA's description of the V100 says each Tensor Core multiplies 16-bit numbers and adds the results at 32 bits. AnandTech's review of the Titan V, which uses the same chip, describes the same thing.`,
        `NVIDIA's article on the Hopper design says the H100 adds 8-bit floating-point Tensor Cores. Network World's report on Blackwell says Blackwell added 4-bit numbers, while Hopper only went down to 8 bits. NVIDIA unveiled Blackwell in March 2024.`,
        `NVIDIA's datasheet for the H100 SXM lists 3,958 trillion 8-bit operations a second and 1,979 trillion 16-bit ones, but both figures assume that half of the numbers are zero and skipped. Without that, the rates are half as large: 1,979 and 989 trillion operations a second. NVIDIA's Hopper article gives the same rates, rounded to 2,000 and 1,000.`,
        `A multiply-accumulate is counted as two operations, so 1,979 ÷ 2 ≈ 990 trillion and 989 ÷ 2 ≈ 495 trillion multiply-accumulates a second, which are about 1,000 trillion and 500 trillion. 990 ÷ 495 = 2.`,
        `The square rule would allow 4 times as many 8-bit multipliers as 16-bit ones in the same area, but the H100 gets 2 times the work. One reason is the scale factor that floating-point numbers carry, which this step mentioned. Another is that the multipliers share the chip with parts that do not shrink when the numbers do.`,
        `The 2014 table (Horowitz) lists 0.2 picojoules for an 8-bit multiply and 3.1 picojoules for a 32-bit one, measured on chips made at 45 nanometres, and 3.1 ÷ 0.2 = 15.5. A newer version of the table (Google, 2021, 7 nanometres) lists 0.07 and 1.48 picojoules, which is a gap of about 21 times.`,
      ],
    },
    numbersArt: precisionArt,          // REVIEW_NOTES N-054: AI chips year by year, click to turn over
    premise: `Your MAC unit can multiply. But a MAC unit with nothing in front of it does nothing: every cycle, three numbers have to be handed to it. Where do they wait, and what does the handover cost?`,
    cta: 'See where the numbers are stored ▸',
    run: step2,
  },
  {
    id: 'registers',
    title: 'Moving numbers is more expensive than performing operations on them',
    costDelta: 0,
    inventory: 'a register file and the mux that reads it',
    numbers: {
      text: [
        `You built a register file: eight registers beside the MAC unit, and a mux that picks one of them. A register is the fastest memory a chip has. When a number is not in a register, the chip has to fetch it from memory further away, and the further away the number is, the longer the chip waits for it.`,
        `Here are the waits measured on a desktop processor, Intel's Skylake design (2015), with its clock at 4 GHz. That clock beats 4 billion times a second, so one beat lasts a quarter of a nanosecond (a nanosecond is a billionth of a second). Each wait below is counted in beats.`,
        { ladder: [
          `A register answers within 1 beat, a quarter of a nanosecond.`,
          `The nearest cache (a small memory on the chip that keeps copies of recently used numbers) answers in about 4 beats, which is 1 nanosecond.`,
          `The largest cache on the chip answers in about 40 to 55 beats, which is 10 to 14 nanoseconds.`,
          `Main memory, on separate chips on the board, answers in about 240 to 400 beats, which is 60 to 100 nanoseconds.`,
        ] },
        `So a number from main memory takes hundreds of times longer to arrive than a number from a register. A core that does one add a beat could have done 240 to 400 adds while it waited.`,
        `Waiting is not the only cost, because fetching a number also uses energy. A table of measured costs that Google published in 2021 lists one 32-bit add at 0.03 picojoules (a picojoule is a millionth of a millionth of a joule). Reading 64 bits from a separate memory chip, the kind a laptop uses for its main memory, costs about 1,300 picojoules, which is over 40,000 times the energy of the add.`,
      ],
      working: [
        `At 4 GHz, the clock beats 4 billion times a second, so one beat lasts 1 ÷ 4,000,000,000 seconds, which is 0.25 nanoseconds.`,
        `The 7-cpu.com measurements of Intel's Core i7-6700 (Skylake) at 4.0 GHz give 4 beats for the nearest (L1) cache, 12 beats for the next (L2) cache, 42 beats for the largest (L3) cache, and 42 beats plus 51 nanoseconds for main memory. Cornell's guide to the Skylake server chips in the Stampede supercomputers gives 4, 14 and 55 beats for the same three caches.`,
        `On the 7-cpu figures, main memory takes 42 × 0.25 + 51 = 61.5 nanoseconds, and 61.5 ÷ 0.25 = 246 beats. The widely shared table of waits attributed to Jeff Dean of Google gives about 100 nanoseconds for main memory, and 100 ÷ 0.25 = 400 beats.`,
        `At a quarter of a nanosecond a beat, 4 beats take 1 nanosecond, 40 to 55 beats take 10 to 13.75 nanoseconds (about 10 to 14), and 240 to 400 beats take 60 to 100 nanoseconds.`,
        `These are figures for a desktop processor. A GPU such as the H100 has different waits, but its memory sits in the same order: registers first, then caches, then main memory.`,
        `The energy figures come from Google's 2021 table for chips made at 7 nanometres (Jouppi and others, 2021), which gives each memory cost for a 64-bit read. 1,300 ÷ 0.03 ≈ 43,000, which is over 40,000.`,
        `The same table lists 7.5 picojoules for a 64-bit read from a small memory on the same chip, which is 7.5 ÷ 0.03 = 250 times an add. That is where the step's "100 to 250 times" comes from, because each 64-bit read brings two 32-bit numbers, and 250 ÷ 2 = 125.`,
        `The 1,300 picojoules counts only the energy of sending the bits between the two chips, so the real cost of reading the separate memory chip is higher.`,
      ],
    },
    numbersArt: memoryArt,             // REVIEW_NOTES N-060: where the numbers wait, near to far
    premise: `Your MAC unit now gets its numbers, and delivery costs more gates than the maths it feeds, on every cycle. Is there a number the MAC unit could keep, instead of fetching it again every cycle?`,
    cta: 'Cut the delivery cost ▸',
    run: step3,
  },
  {
    id: 'weights',
    title: 'All of AI is just matrix multiplication',
    costDelta: 0,
    inventory: 'a systolic array',
    numbers: {
      text: [
        `You built a systolic array. Each weight is parked beside its own MAC unit, and only the data crosses the border of the square.`,
        `To see what parking saves, count the multiplies done for each number that crosses the border. An N by N array does N × N multiplies each cycle while 2 × N numbers cross its border (multiplies per crossing = N × N ÷ (2 × N) = N ÷ 2).`,
        { ladder: [
          `Your 2 by 2 array did 4 multiplies for 4 crossings, which is 1 multiply per crossing.`,
          `At 128 by 128, the array does 16,384 multiplies for 256 crossings, which is 64 per crossing.`,
          `Google's first TPU (in use from 2015) had a 256 by 256 array, which does 128 multiplies per crossing.`,
        ] },
        `The TPU's 65,536 multipliers did about 46 trillion multiplies a second, but its weight memory could deliver only 34 billion weights a second. To keep every multiplier busy, it had to use each weight it fetched about 1,350 times.`,
        `If it had fetched a fresh weight from its separate memory chips for every multiply, at the cost given in step 3's real numbers, the fetching alone would have drawn about 7,500 watts, as much as three kettles. The whole chip drew about 40 watts while working, which is possible only because each weight it fetched was used many times.`,
      ],
      working: [
        `An N by N array has N × N MAC units, so it does N × N multiplies each cycle. N data numbers enter along one edge and N answers leave along another, so 2 × N numbers cross the border.`,
        `A 2 by 2 array gives 4 ÷ 4 = 1 multiply per crossing. A 128 by 128 array gives 16,384 ÷ 256 = 64 multiplies per crossing. A 256 by 256 array gives 65,536 ÷ 512 = 128 multiplies per crossing.`,
        `The TPU had 256 × 256 = 65,536 multipliers and a clock of 700 million cycles a second, so it did 65,536 × 700,000,000 ≈ 46 trillion multiplies a second (Jouppi and others, 2017).`,
        `Its weight memory delivered 34 billion bytes a second, and each 8-bit weight is one byte. 46,000,000,000,000 ÷ 34,000,000,000 ≈ 1,350 multiplies for every weight fetched, which is the figure the 2017 paper gives.`,
        `The 128 counts one cycle of the array. The 1,350 counts every cycle a weight stays parked, which is why it is larger.`,
        `In step 3's numbers, a separate memory chip costs about 1,300 picojoules for every 64 bits, so each 8-bit weight costs 1,300 ÷ 8 ≈ 162 picojoules.`,
        `Fetching a fresh weight for every multiply would cost 46 trillion × 162 picojoules a second ≈ 7,460 watts, which is about 7,500 watts. A kettle draws about 2,500 watts, and 7,500 ÷ 2,500 = 3.`,
        `The 7,500 watts is a lower limit, because the 1,300 picojoules counts only the energy of sending the bits between chips. The TPU's real memory could not have delivered that many weights at any power.`,
        `Google measured the TPU at about 40 watts while busy, against a rated limit of 75 watts.`,
      ],
    },
    numbersArt: systolicArt,           // REVIEW_NOTES N-062 / N-063: the clock beat, data in, answers out
    premise: `Inside the array, the weights stay put and only the data moves. Tensor Cores and TPUs are built this way. But the data still comes from memory, and memory sits off to the side of the chip. Can memory keep up with sixteen lanes?`,
    cta: 'Feed the lanes ▸',
    run: step4,
  },
  {
    id: 'feed',
    title: 'Crazy multiplication speeds also need crazy data delivery speeds',
    costDelta: 1350,
    inventory: 'compute and memory, matched',
    numbers: {
      text: [
        `You matched compute and memory, so the stacks deliver about as many numbers each cycle as the lanes ask for. A real chip has to make the same match, at a far larger scale.`,
        `A memory's bandwidth is the number of wires × the bits each wire carries per second ÷ 8, because 8 bits make one byte (bandwidth = wires × bit rate ÷ 8, B = w × r ÷ 8).`,
        `The H100 from step 1 has five HBM stacks with 1,024 wires each, and each wire carries about 5.2 billion bits a second.`,
        { ladder: [
          `One stack delivers about 670 billion bytes a second.`,
          `All five stacks deliver about 3.35 trillion bytes a second, which is enough to move an hour of high-definition (HD) video in under a thousandth of a second.`,
          `Under your rule of one number per lane per cycle, with each number 32 bits (4 bytes), the H100's 16,896 lanes would ask for about 134 trillion bytes a second, which is 40 times more.`,
        ] },
        `So the H100 cannot match its lanes by adding stacks, because it would need about 200 of them. Instead, it uses each number it loads many times, the way your systolic array used each parked weight.`,
      ],
      working: [
        `The H100 has 5 stacks × 1,024 wires = 5,120 wires to its memory.`,
        `NVIDIA lists 3.35 trillion bytes a second. 3,350,000,000,000 × 8 ÷ 5,120 ≈ 5.23 billion bits a second on each wire, which is about 5.2 billion.`,
        `One stack delivers 1,024 × 5.23 billion ÷ 8 ≈ 670 billion bytes a second, and five stacks deliver 5 × 670 billion ≈ 3.35 trillion bytes a second.`,
        `An hour of HD video is about 3 billion bytes (Netflix lists up to 3 GB an hour for HD). 3,000,000,000 ÷ 3,350,000,000,000 ≈ 0.0009 seconds, which is under a thousandth of a second.`,
        `Using the clock from step 1, the lanes ask for 16,896 lanes × 4 bytes × 1.98 billion cycles a second, which is about 134 trillion bytes a second.`,
        `Dividing 134 by 3.35 gives about 40, so the lanes ask for 40 times what the memory delivers. Closing a 40-times gap by adding stacks would take 40 × 5 = 200 stacks.`,
        `With 16-bit numbers (2 bytes), the lanes would ask for about 67 trillion bytes a second, and the gap would be 20 times. The point is the same either way.`,
      ],
    },
    premise: `Compute and memory now match, and every lamp is blue. But everything in this act is still loose parts on a bench, and a chip you can sell has to be one sealed unit that does not overheat. What goes into the package?`,
    cta: 'Assemble the GPU ▸',
    run: step5,
  },
  {
    id: 'gpu',
    title: 'Assemble the GPU',
    costDelta: 0,
    inventory: 'a GPU, your machine for mathematics',
    numbers: {
      text: [
        `You assembled the GPU, with the GPU die in the middle, memory on both sides and a cooler on top. Its meter read about 700 watts, which is the real power limit of the H100 from step 1.`,
        `A watt is one joule of energy every second (power = energy ÷ time, P = E ÷ t).`,
        { ladder: [
          `Every second, 700 joules of heat have to leave through the lid, from a die about 2.9 cm on a side.`,
          `That is 70% of what a microwave uses to cook (1,000 watts), and more than half of what an average home draws (1.2 kilowatts).`,
          `At its top rated speed, the H100 does about 495 trillion 16-bit multiply-adds a second, so each one costs about 1.4 picojoules, including the delivery of its numbers.`,
        ] },
        `In step 3's numbers, a single 64-bit read from a small memory on the chip cost 7.5 picojoules. The whole H100 spends less than that on each multiply-add, because it uses each number it fetches many times.`,
      ],
      working: [
        `The H100's die is 814 mm², and √814 ≈ 28.5 mm, which is about 2.9 cm on a side.`,
        `700 watts is 700 joules every second. 700 ÷ 1,000 = 0.7, which is 70% of a microwave, and 700 ÷ 1,200 ≈ 0.58, which is more than half of a home.`,
        `NVIDIA's headline figure for 16-bit numbers is 1,979 trillion operations a second, but that figure assumes half of the numbers are zero and skipped. The full rate is half of that, about 990 trillion operations a second.`,
        `NVIDIA counts a multiply and its add as two operations, so 990 ÷ 2 ≈ 495 trillion multiply-adds a second.`,
        `The formula rearranges to energy = power × time, so in one second the H100 uses 700 joules. Shared across 495 trillion multiply-adds, that is 700 ÷ 495,000,000,000,000 ≈ 0.0000000000014 joules, which is 1.4 picojoules each.`,
        `The 7.5 picojoules comes from Google's 2021 table for chips made at 7 nanometres. The H100 is made at a slightly finer scale, so this is a rough comparison, but 1.4 is about five times less than 7.5.`,
        `The 1.4 picojoules is at the chip's top rated speed. Real work rarely reaches that speed, so the real energy for each useful multiply-add is higher.`,
      ],
    },
    numbersArt: heatArt,               // REVIEW_NOTES N-071: where the 700 watts go
    premise: null,
    cta: 'Finish Act 4 ▸',
    run: step6,
  },
];

const ico = inner => `<svg width="30" height="30" viewBox="0 0 34 34">${inner}</svg>`;
export const ACT4_SUMMARY = {
  eyebrow: 'ACT 4 COMPLETE',
  title: 'You built the <em>GPU</em>',
  sub: `Sixteen copies of one adder running off one instruction, a multiplier whose area is
    its bit-width squared, weights parked so only data moves, memory matched to what the
    lanes ask for, and the whole thing sealed under a lid:`,
  items: [
    { nm: 'Sixteen lanes, one instruction', amt: '$0', icon: ico(`<path d="M5 11 h24 M5 17 h24 M5 23 h24" stroke="var(--hairline-strong)" stroke-width="1"/><rect x="5" y="8" width="10" height="5" fill="var(--hairline-strong)"/><rect x="5" y="20" width="24" height="5" fill="var(--blue)"/>`) },
    { nm: 'Multiplier, area is bit-width squared', amt: '$0', icon: ico(`<g fill="var(--blue)">${[0,1,2,3].map(r=>[0,1,2,3].map(c=>`<circle cx="${8+c*6}" cy="${8+r*6}" r="2"/>`).join('')).join('')}</g>`) },
    { nm: 'Register file, and its delivery cost', amt: '$0', icon: ico(`<g fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.1">${[0,1,2,3].map(r=>`<rect x="6" y="${6+r*7}" width="16" height="5" rx="1"/>`).join('')}</g><path d="M24 9 v16 M24 17 h5" stroke="var(--blue)" stroke-width="1.3" fill="none"/>`) },
    { nm: 'Systolic array, weights parked', amt: '$0', icon: ico(`<g fill="var(--blue-soft)" stroke="var(--blue)" stroke-width=".9">${[0,1].map(r=>[0,1].map(c=>`<rect x="${8+c*10}" y="${5+r*10}" width="8" height="8" rx="1"/>`).join('')).join('')}</g><path d="M17 26 v5 M14 28 l3 3 3-3" stroke="var(--amber)" stroke-width="1.3" fill="none"/>`) },
    { nm: 'HBM, five stacks matched to the lanes', amt: '$1,350', icon: ico(`<rect x="13" y="6" width="8" height="22" rx="1.5" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1.2"/><rect x="5" y="9" width="6" height="16" rx="1.5" fill="var(--amber-soft)" stroke="var(--amber)" stroke-width="1"/><rect x="23" y="9" width="6" height="16" rx="1.5" fill="var(--amber-soft)" stroke="var(--amber)" stroke-width="1"/>`) },
    { nm: 'The GPU, assembled', amt: '$0', icon: ico(`<rect x="6" y="6" width="22" height="22" rx="2" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.3"/><rect x="11" y="11" width="12" height="12" fill="var(--blue-soft)" stroke="var(--blue)" stroke-width="1"/><path d="M6 12 h-3 M6 17 h-3 M6 22 h-3 M28 12 h3 M28 17 h3 M28 22 h3" stroke="var(--ink-soft)" stroke-width="1"/>`) },
  ],
  totalNote: '. The parts on the die cost nothing extra to print. Designing them costs engineers hundreds of millions of dollars, which SPENT does not count',
  locked: { title: 'ACT 5 · Build Your Own Data Centre', note: 'now buy ten thousand of them and make them think as one' },
  next: { label: 'Continue to Act 5 ▸' },
  debrief: {
    eyebrow: 'ACT 4 · DEBRIEF',
    title: 'Your own GPU, <em>cleared</em>',
    paras: [
      `For maths on lists, many simple lanes beat one fast processor. You built the multiply
       and add that every lane runs, found that a multiplier's area is the <b>square</b> of
       its bit-width, parked the weights so only data had to move, matched memory to what
       the lanes ask for, and sealed the result under a cooler. The surprise of this act is
       how much of it was delivery rather than arithmetic.`,
      `<em>Next: one of these is fast. Ten thousand of them, wired to work as a single
       machine, is a data centre, and a purchase the size of a small nation's budget.</em>`,
    ],
  },
};
