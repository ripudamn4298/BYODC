// BYODC — Act 5: "Build Your Own Data Centre".
// The ladder: fill a rack → count the links → power and cooling → a fabric that survives
// a failure → build the site. Scale becomes geography.
import { scaleArt } from '../../art/scale.js';
import { step1 } from './step1.js';
import { step2 } from './step2.js';
import { step3 } from './step3.js';
import { step4 } from './step4.js';
import { step5 } from './step5.js';

export const ACT5_BASE_COST = 23020.000001544;   // everything through Act 4 (COST_MODEL.md); Act 5's own costs are redone with its restructure

export const ACT5 = [
  {
    id: 'rack',
    title: 'What is a rack, and how much power does it draw?',
    costDelta: 2400000,
    inventory: 'a rack of 8 nodes, 64 GPUs',
    numbers: {
      text: [
        `You just filled a rack with eight nodes, which hold 64 GPUs between them. Suppose every GPU in it is NVIDIA's H100 (2022), one of the leading chips data centres use to train AI. An H100 draws at most 700 watts. A microwave cooks at about 1,000 watts, so one GPU draws a little less than a microwave.`,
        `A rack draws its power all day, every day, so the number that matters is the energy it uses. Energy is power × time (E = P × t). Energy is counted in kilowatt-hours (kWh), and 1 kWh is the energy used when 1,000 watts are drawn for one hour. A home uses about 29 kWh a day.`,
        { ladder: [
          `In one day, one GPU at 700 watts uses about 17 kWh, which is more than half of what a home uses in a day.`,
          `In one day, one node at 7,000 watts uses 168 kWh, which a home would take almost 6 days to use.`,
          `In one day, your rack at 56,000 watts uses 1,344 kWh, which a home would take about 47 days to use.`,
          `NVIDIA's GB200 NVL72 rack (2025), one of the newest racks for training AI, draws about 120,000 watts. In one day it uses about 2,900 kWh, which a home would take about 100 days to use.`,
        ] },
        `So every day your rack is switched on, it uses as much electricity as a home uses in about a month and a half.`,
      ],
      working: [
        `Energy is power multiplied by time. A kilowatt-hour is 1,000 watts drawn for one hour, so kilowatts × hours gives kilowatt-hours.`,
        `A home draws about 1.2 kW averaged over a year, which is about 10,500 kWh a year (the figure in this step). In one day it uses 1.2 kW × 24 hours = 28.8 kWh, which the box rounds to about 29 kWh.`,
        `One GPU uses 0.7 kW × 24 hours = 16.8 kWh in a day, and 16.8 ÷ 28.8 ≈ 0.58, which is more than half of a home's day.`,
        `One node uses 7 kW × 24 hours = 168 kWh in a day, and a home takes 168 ÷ 28.8 ≈ 5.8 days to use that much.`,
        `The node's 7 kW works out to 7,000 ÷ 8 = 875 watts per GPU, which is the 700-watt GPU plus its share of the processors, memory and fans in the node. A real node of eight H100s, NVIDIA's DGX H100, is rated at up to 10.2 kW, so the course's 7 kW is on the low side.`,
        `The rack draws 8 × 7 kW = 56 kW, so it uses 56 kW × 24 hours = 1,344 kWh in a day. A home takes 1,344 ÷ 28.8 ≈ 46.7 days to use that much, which is about 47 days, or about a month and a half.`,
        `This agrees with the step, which says the rack draws what about 47 homes draw, because 56 kW ÷ 1.2 kW ≈ 46.7.`,
        `The GB200 NVL72 draws about 120 kW, so it uses 120 kW × 24 hours = 2,880 kWh in a day, which is about 2,900 kWh. A home takes 2,880 ÷ 28.8 = 100 days to use that much.`,
        `The box assumes every part draws its full rating all day, as the step does. That is close to true while a model is being trained.`,
      ],
    },
    premise: `One rack is eight nodes and 64 GPUs. A frontier model (one of the largest models being trained today) needs <b>thousands</b> of GPUs working as one machine, and that only works if every GPU can reach every other. Can you simply wire every GPU to every other one?`,
    cta: 'Count the links ▸',
    run: step1,
  },
  {
    id: 'interconnect',
    title: 'Why you cannot wire them all together',
    costDelta: 0,
    inventory: 'a node wired all-to-all',
    numbers: {
      text: [
        `You wired GPUs all-to-all, so that every pair has a link of its own. The number of links is the number of GPUs × the number of other GPUs ÷ 2 (links = n × (n − 1) ÷ 2). Each GPU also needs a link of its own to each of the other n − 1 GPUs.`,
        { ladder: [
          `Four GPUs need 6 links, and each GPU needs 3 of them.`,
          `Eight GPUs, one node, need 28 links, and each GPU needs 7. AMD's MI300X servers (2023) wire their eight GPUs together exactly this way.`,
          `Your rack of 64 GPUs would need 2,016 links, and each GPU would need 63.`,
          `Four thousand GPUs would need 7,998,000 links, and each GPU would need 3,999.`,
        ] },
        `NVIDIA's H100 has room for 18 links of this kind, so it cannot be wired all-to-all even within one rack of 64. If every one of the 7,998,000 links were only one metre long, the cable would stretch about 8,000 km, which is twice the distance from New York to Los Angeles.`,
        `So all-to-all stops at one node of eight, because a GPU has room for far fewer links than all-to-all needs beyond that.`,
      ],
      working: [
        `The number of links for n GPUs is n × (n − 1) ÷ 2. Each GPU links to the other n − 1, and dividing by 2 stops every link being counted once from each end.`,
        `For 4 GPUs, 4 × 3 ÷ 2 = 6 links, and each GPU needs 4 − 1 = 3.`,
        `For 8 GPUs, 8 × 7 ÷ 2 = 28 links, and each GPU needs 8 − 1 = 7. AMD's documentation for the MI300X says each GPU has seven links that form a fully connected 8-GPU system.`,
        `For 64 GPUs, 64 × 63 ÷ 2 = 2,016 links, and each GPU needs 64 − 1 = 63.`,
        `For 4,000 GPUs, 4,000 × 3,999 ÷ 2 = 7,998,000 links, and each GPU needs 4,000 − 1 = 3,999.`,
        `NVIDIA lists 18 links of this kind (NVLink) on each H100. A rack of 64 needs 63 per GPU, and 63 ÷ 18 = 3.5, so the chip would need three and a half times as many links as it has.`,
        `At one metre a link, 7,998,000 links take 7,998,000 metres of cable, which is about 8,000 km. Links across a hall are tens of metres long, so one metre is the least each could be.`,
        `New York to Los Angeles is about 3,940 km in a straight line, and 8,000 ÷ 3,940 ≈ 2, so the cable would be about twice that distance.`,
        `A real H100 server does not wire its eight GPUs directly. It joins them through four NVSwitch chips instead, which are switches of the kind you will meet in step 3.`,
      ],
    },
    premise: `Your site needs hundreds of racks to work as one machine, and at that scale something breaks several times a day. How do you wire the racks so that one failure does not stop the job?`,
    cta: 'Wire the racks ▸',
    run: step2,
  },
  {
    id: 'network',
    title: 'How do you wire the racks so one failure does not stop the job?',
    costDelta: 190000000,
    inventory: 'a fabric that survives a switch failing',
    numbers: {
      text: [
        `Your fabric gives every rack a link to each switch, so the job carries on when one switch fails. The step said that in a hall this size, hardware fails several times a day. Each part fails rarely, but a hall holds tens of thousands of parts, and every one of them adds its own chance of failing.`,
        `The time between stops for the whole hall is the average time between stops for one GPU ÷ the number of GPUs (T = t ÷ n). In 2024, Meta reported training a model on 16,384 H100 GPUs for 54 days, and the job stopped unexpectedly 419 times. That works out to one stop for each GPU about every six years.`,
        { ladder: [
          `One GPU on its own would stop the job about once every six years.`,
          `A rack of 64 GPUs would stop it about once a month.`,
          `Meta's 16,384 GPUs stopped it about once every three hours.`,
          `Your hall has 25 MW of IT load, which at 56 kW a rack is about 445 racks holding 28,480 GPUs. It would stop about every two hours, which is about 13 times a day.`,
        ] },
        `So at this size, failures are part of every day, and the hall has to be built to carry on through them. Your fabric does that when a switch fails.`,
      ],
      working: [
        `Meta's 2024 paper on its Llama 3 models reports 419 unexpected stops in a 54-day period of training on 16,384 H100 GPUs.`,
        `If 16,384 GPUs each work for 54 days, that is 16,384 × 54 = 884,736 days of GPU work. There was one stop for every 884,736 ÷ 419 ≈ 2,112 of those days.`,
        `2,112 days ÷ 365 ≈ 5.8 years, which is about six years per GPU between stops. This spreads every stop evenly over the GPUs, so each GPU's share includes the servers, cables and switches around it.`,
        `For a rack of 64 GPUs, 2,112 ÷ 64 ≈ 33 days between stops, which is about once a month.`,
        `For Meta's 16,384 GPUs, 54 days × 24 hours = 1,296 hours, and 1,296 ÷ 419 ≈ 3.1 hours between stops.`,
        `Your hall has 25 MW of IT load, and 25,000 kW ÷ 56 kW ≈ 446 racks, which the course rounds to about 445. Those racks hold 445 × 64 = 28,480 GPUs.`,
        `For your hall, 2,112 ÷ 28,480 ≈ 0.074 days between stops, and 0.074 × 24 ≈ 1.8 hours. In a day that is 24 ÷ 1.8 ≈ 13 stops.`,
        `About 78 percent of Meta's stops were confirmed or suspected hardware faults, and the rest had software and other causes. Hardware alone would stop your hall about 13 × 0.78 ≈ 10 times a day.`,
        `This assumes that parts fail independently and at a steady rate, which is the usual first estimate.`,
      ],
    },
    premise: `The fabric holds through a bad night. But hundreds of racks need power, and the utility gives you one power line whose rating is fixed, no matter what you build. How much of that line do your computers actually get?`,
    cta: 'Work out the power ▸',
    run: step4,
  },
  {
    id: 'power',
    title: 'How much of the power line do the computers actually get?',
    costDelta: 440000000,
    inventory: 'a hall that can hold the line',
    numbers: {
      text: [
        `You switched your hall to liquid cooling and held 25 MW of IT load under the 30 MW line. The whole draw is 29.4 MW, and 4.4 MW of it goes to cooling and losses.`,
        `Engineers compare halls with the PUE from the step: the whole draw ÷ the IT load (PUE = whole draw ÷ IT load).`,
        { ladder: [
          `In the Uptime Institute's 2024 survey, the average data centre had a PUE of 1.56, so it drew 1.56 MW for every 1 MW of IT load.`,
          `With air cooling, your hall would draw 36.9 MW for 25 MW of IT load, which is a PUE of 1.48 and is over the line.`,
          `With liquid cooling, your hall draws 29.4 MW for the same 25 MW, which is a PUE of 1.18.`,
          `In 2024, Google's data centres averaged a PUE of 1.09.`,
        ] },
        `Switching from air to liquid saved 7.5 MW, which is as much power as about 6,250 homes draw. That saving is what brought 25 MW of computers under a 30 MW line.`,
        `Cooling can also use water, and that is where data centres have drawn the most public anger. Many sites cool by letting water evaporate in cooling towers, so that water is gone. Engineers count it as the water usage effectiveness (WUE): litres of water for every kWh of IT energy.`,
        { ladder: [
          `Equinix's data centres that cool by evaporation used about 1.4 litres for every kWh in 2025. At that rate, your hall's 25 MW of IT load would use about 307 million litres a year, enough to fill about 120 Olympic swimming pools.`,
          `Across all its data centres, Microsoft used 0.30 litres for every kWh in 2024, down from 0.49 in 2021.`,
          `Since August 2024, Microsoft's new designs keep their cooling water in a closed loop: it carries heat away from plates on the chips and is cooled by chillers instead of evaporating. Microsoft says each such site avoids more than 125 million litres a year, and the first come online in late 2027.`,
        ] },
        `The trade is power for water. Chillers use more electricity than evaporation does, so a site that saves water pays a little more on its bar.`,
      ],
      working: [
        `PUE = whole draw ÷ IT load. A PUE of 1.18 means that for every 1 MW the computers draw, the hall draws 1.18 MW from the line.`,
        `With liquid cooling, cooling is 13 percent of the IT load, so it is 25 × 0.13 = 3.25 MW, which the step shows as 3.3 MW.`,
        `Losses are 4 percent of the IT load and the cooling together, so they are (25 + 3.3) × 0.04 ≈ 1.1 MW.`,
        `The whole draw is 25 + 3.3 + 1.1 = 29.4 MW, and 29.4 ÷ 25 ≈ 1.18. Cooling and losses together are 3.3 + 1.1 = 4.4 MW.`,
        `With air cooling, cooling is 42 percent, so it is 25 × 0.42 = 10.5 MW. Losses are (25 + 10.5) × 0.04 ≈ 1.4 MW, and the whole draw is 25 + 10.5 + 1.4 = 36.9 MW, which is over the 30 MW line. With air cooling, 36.9 ÷ 25 gives a PUE of about 1.48.`,
        `Liquid saves 36.9 − 29.4 = 7.5 MW. A home draws about 1.2 kW, so 7,500 kW ÷ 1.2 kW = 6,250 homes.`,
        `The 2024 average of 1.56 comes from the Uptime Institute's Global Data Center Survey 2024. Google reports 1.09 for its whole fleet over 2024.`,
        `Strictly, PUE compares the energy used over a whole year, not the power at one moment. A hall that draws the same power all year gives the same ratio either way.`,
        `WUE = litres of water ÷ kWh of IT energy. Your hall's IT energy in a year is 25,000 kW × 8,760 hours = 219,000,000 kWh, and 219,000,000 × 1.4 ≈ 307 million litres. An Olympic pool holds about 2.5 million litres, so 307 ÷ 2.5 ≈ 120 pools.`,
        `The 1.4 is Equinix's reported 2025 WUE for its sites that use evaporative cooling (its whole fleet averaged about 0.9). Microsoft's figures are from its December 2024 post "Sustainable by design: next-generation datacenters consume zero water for cooling", which gives the 0.30 (2024) and 0.49 (2021) averages, the August 2024 start, the more than 125 million litres a year avoided per site, and that the zero-water design slightly raises yearly energy use.`,
        `WUE counts only the water used on the site. The water used to make the electricity, at a power station, is not included.`,
      ],
    },
    premise: `Power and cooling fit under the line. But everything you have built still has no address. It needs land, a power line, a way to get the heat out, and a way onto the internet. Where in the world do you put it, and what has the whole thing cost?`,
    cta: 'Build the site ▸',
    run: step3,
  },
  {
    id: 'site',
    title: 'Where does the data centre go, and what did it all cost?',
    costDelta: 1066000000,
    inventory: 'a data centre, your own supercluster',
    numbers: {
      text: [
        `You just built the site, with about 445 racks in two halls. With cooling and losses, it draws 29.4 MW from the grid, the same figure you held under the line in step 4, and it draws that every hour of the year.`,
        `In step 1 you measured one rack's energy over a day. The site is measured the same way over a year, because energy is power × time (E = P × t). A year has 8,760 hours, and a home uses about 10,500 kWh in a year.`,
        { ladder: [
          `In a year, one rack at 56 kW uses about 490,000 kWh, which is as much as about 47 homes use.`,
          `In a year, your site at 29.4 MW uses about 258 million kWh, which is as much as about 24,500 homes use. That is a town.`,
          `OpenAI's Stargate campus in Abilene, Texas, built with Oracle and Crusoe, is 1,200 MW, due to be finished at the end of 2026. In a year it uses as much electricity as about a million homes, a large city's worth.`,
          `Meta's Hyperion campus in Louisiana is planned to grow to 5,000 MW over several years, about 170 times your site.`,
        ] },
        `And the whole industry is still speeding up. Outside China, SemiAnalysis counted about 25,000 MW of new IT load added in 2026, and expects about 51,000 MW in 2027, which is about as much as the whole world had built up to 2024.`,
      ],
      working: [
        `A year has 365 × 24 = 8,760 hours. Energy = power × time, so kilowatts × hours gives kilowatt-hours.`,
        `A home draws about 1.2 kW on average, so it uses 1.2 kW × 8,760 hours = 10,512 kWh a year, which is about 10,500 kWh, the same figure as step 1.`,
        `One rack uses 56 kW × 8,760 hours = 490,560 kWh a year, and 490,560 ÷ 10,512 ≈ 47 homes.`,
        `Your site's IT load is 25 MW. At 56 kW a rack, 25,000 ÷ 56 ≈ 446, which the step rounds to about 445 racks.`,
        `With liquid cooling and losses, the site draws 29.4 MW (step 4), so it uses 29,400 kW × 8,760 hours = 257,544,000 kWh a year, which is about 258 million kWh. Dividing by 10,512 gives about 24,500 homes; the same comes from 29,400 kW ÷ 1.2 kW.`,
        `Abilene: 1,200,000 kW ÷ 1.2 kW = 1,000,000 homes. Hyperion: 5,000 ÷ 29.4 ≈ 170 times your site, and 5,000,000 kW ÷ 1.2 kW ≈ 4.2 million homes.`,
        `Abilene's 1,200 MW and its end-of-2026 completion are from Epoch AI's tracker of the Stargate sites (April 2026; about 300 MW was running then). Hyperion's 5,000 MW is from Meta's July 2025 announcement, which said it would scale to that over several years.`,
        `SemiAnalysis's figures are from its October 2026 report on 2027 (as reported by Yahoo Finance, 20 October 2026): about 25 GW of IT capacity added outside China in 2026, about 51 GW expected in 2027, and that 51 GW in one year roughly matches the world's whole build-out up to 2024. A gigawatt (GW) is 1,000 MW. These are forecasts of power capacity, not of computing.`,
        `At about 2.5 people per home, 24,500 homes is roughly 60,000 people, which is a town. A million homes is roughly 2.5 million people, which is a large city.`,
      ],
    },
    numbersArt: scaleArt,              // REVIEW_NOTES N-094: your site next to today's largest
    premise: null,
    cta: 'Finish the course ▸',
    run: step5,
  },
];

const ico = inner => `<svg width="30" height="30" viewBox="0 0 34 34">${inner}</svg>`;
export const ACT5_SUMMARY = {
  eyebrow: 'THE COURSE IS COMPLETE',
  title: 'From <em>a grain of sand</em> to your own supercluster',
  sub: `A rack, a fabric that survives a switch failing, a substation, and a site on the map
    of the world. Together they are a supercluster (thousands of GPUs working as one
    machine). You built every layer of it by hand:`,
  items: [
    { nm: 'Rack of 8 nodes, 64 GPUs', amt: '$2,400,000', icon: ico(`<rect x="11" y="4" width="12" height="26" rx="2" fill="var(--paper-high)" stroke="var(--ink)" stroke-width="1.3"/><path d="M13 8 h8 M13 13 h8 M13 18 h8 M13 23 h8" stroke="var(--blue)" stroke-width="1.2"/>`) },
    { nm: 'Interconnect inside the node', amt: '$0, in the server price', icon: ico(`<circle cx="9" cy="9" r="2.6" fill="none" stroke="var(--ink)" stroke-width="1.1"/><circle cx="25" cy="9" r="2.6" fill="none" stroke="var(--ink)" stroke-width="1.1"/><circle cx="9" cy="25" r="2.6" fill="none" stroke="var(--ink)" stroke-width="1.1"/><circle cx="25" cy="25" r="2.6" fill="none" stroke="var(--ink)" stroke-width="1.1"/><path d="M9 11.6 v10.8 M25 11.6 v10.8 M11.6 9 h10.8 M11.6 25 h10.8 M11 11 l12 12 M23 11 l-12 12" stroke="var(--blue)" stroke-width=".8"/>`) },
    { nm: 'Leaf-spine network fabric', amt: '$190,000,000', icon: ico(`<circle cx="10" cy="8" r="3" fill="none" stroke="var(--ink)" stroke-width="1.2"/><circle cx="24" cy="8" r="3" fill="none" stroke="var(--ink)" stroke-width="1.2"/><rect x="14" y="21" width="6" height="5" fill="rgba(29,33,23,.08)" stroke="var(--ink)" stroke-width="1.1"/><path d="M10 11 l7 10 M24 11 l-7 10" stroke="var(--ink)" stroke-width="1"/>`) },
    { nm: 'Halls, power and cooling (30 MW)', amt: '$440,000,000', icon: ico(`<rect x="5" y="18" width="7" height="11" fill="var(--blue)"/><rect x="14" y="12" width="7" height="17" fill="var(--amber)"/><rect x="23" y="24" width="6" height="5" fill="var(--hairline-strong)"/><path d="M17 5 l-4 7 h8 l-4 6" fill="none" stroke="var(--amber)" stroke-width="1.4"/>`) },
    { nm: 'The other 444 racks of servers', amt: '$1,066,000,000', icon: ico(`<circle cx="17" cy="17" r="13" fill="none" stroke="var(--ink)" stroke-width="1.2"/><path d="M4 17 h26 M17 4 a19 13 0 0 1 0 26 a19 13 0 0 1 0 -26" fill="none" stroke="var(--hairline-strong)" stroke-width=".8"/><circle cx="22" cy="12" r="2.4" fill="var(--amber)"/>`) },
  ],
  totalNote: ', from a few billionths of a dollar to a site on the map. Most of it is GPUs',
  locked: { title: 'YOU BUILT ALL OF IT', note: 'sand · transistor · gate · chip · GPU · supercluster' },
  next: null,
  debrief: {
    eyebrow: 'THE COURSE · DEBRIEF',
    title: 'Sand to Superclusters, <em>cleared</em>',
    paras: [
      `You doped a crystal and made a transistor. You wired transistors into gates that decide, add and remember, printed billions of them onto one chip, designed that chip into a GPU, and wired thousands of GPUs into one machine with its own power line and a place on the map.`,
      `When you read news about chips, GPUs or data centres, it is about one of the layers you built.`,
    ],
  },
};
