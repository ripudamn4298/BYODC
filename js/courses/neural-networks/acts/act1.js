import { sleep, waitFor } from '../../../engine/util.js';
import { guide } from '../../../engine/guide.js';
import { flow } from '../../../engine/flow.js';
import { newStage } from '../../../engine/stage.js';
import { makeSlider } from '../../../engine/components.js';
import { drawNetwork, makeScatter, makeSignalBoard } from '../engine/ai-visuals.js';
import { neuronScore } from '../engine/ai-math.js';

const POINTS = [
  { x:.15,y:.18,group:0 },{ x:.25,y:.34,group:0 },{ x:.38,y:.22,group:0 },{ x:.34,y:.43,group:0 },
  { x:.68,y:.62,group:1 },{ x:.78,y:.72,group:1 },{ x:.61,y:.82,group:1 },{ x:.84,y:.51,group:1 },
];

export async function inputsStep(){
  const { svg } = newStage('01', 'Two observations becoming input signals');
  const board = makeSignalBoard(svg, { values:[.8,.3], weights:[.5,.5] });
  board.set({ values:[.8,.3], weights:[.5,.5], result:1, confidence:70 });
  guide.title('LAB 1 · EXPERIMENT 01', 'Turn observations into <em>signals</em>');
  guide.say(`A model cannot see an object the way you do. It receives measurements. In this first bench test, two sensors report <b>brightness</b> and <b>edge strength</b>. Each becomes a signal between quiet and strong.`);
  await guide.next('Inspect the sensors ▸');
  const choice = await guide.choose([
    { label:'Brightness = 0.8, edge = 0.3', value:'signals', hint:'two measured properties, kept separate' },
    { label:'The object is probably useful', value:'answer', hint:'already a conclusion, not an input' },
  ]);
  if (choice !== 'signals') guide.note(`That is a conclusion. The network must earn it. Inputs are only the measurements: <b>0.8 and 0.3</b>.`);
  else guide.note(`Exactly. Inputs describe what arrived; they do not contain the answer.`);
  await guide.button('Send both signals ▸');
  board.set({ values:[.8,.3], weights:[.5,.5], result:1, confidence:70 });
  guide.aha(`The neuron now has something it can compare. <b>Data is not meaning yet</b> — it is the raw material meaning will be built from.`);
}

export async function weightsStep(){
  const { svg, controls } = newStage('02', 'Adjusting the influence of two neural connections');
  const board = makeSignalBoard(svg, { values:[.8,.3], weights:[.2,.8] });
  const important = makeSlider(controls, { label:'brightness influence', min:0, max:1, step:.05, value:.2, fmt:v=>`${Math.round(v*100)}%` });
  const distractor = makeSlider(controls, { label:'edge influence', min:0, max:1, step:.05, value:.8, fmt:v=>`${Math.round(v*100)}%` });
  const update = () => { const result = neuronScore([.8,.3],[important.value,distractor.value],-.45); board.set({ values:[.8,.3], weights:[important.value,distractor.value], result:result.output, confidence:result.confidence }); };
  important.on(update); distractor.on(update); update();
  guide.title('LAB 1 · EXPERIMENT 02', 'Give each signal <em>influence</em>');
  guide.say(`A connection's <b>weight</b> is simply how much the neuron listens to it. This task needs brightness; edge strength is mostly distraction. Make the brightness connection strong and the edge connection weak.`);
  await flow.ask(async replay => {
    if (replay !== undefined){ important.set(.85); distractor.set(.15); update(); return true; }
    const cancel = flow.hintAfter(9000, `Raise brightness above 75%. Lower edge strength below 25%.`);
    await waitFor(() => important.value >= .75 && distractor.value <= .25, { hold:350 }); cancel(); return true;
  });
  guide.aha(`The same inputs now lead to a better decision. Learning will eventually do this automatically: <b>strengthen useful connections, weaken noisy ones.</b>`);
}

export async function thresholdStep(){
  const { svg, controls } = newStage('03', "Moving a neuron's decision threshold");
  const board = makeSignalBoard(svg, { values:[.55,.35], weights:[.75,.2] });
  const threshold = makeSlider(controls, { label:'decision strictness', min:-1, max:1, step:.05, value:-.5, fmt:v=>v < -.1 ? 'too easy' : v > .25 ? 'selective' : 'balanced' });
  const update = () => { const result = neuronScore([.55,.35],[.75,.2],-threshold.value-.25); board.set({ values:[.55,.35], weights:[.75,.2], result:result.output, confidence:result.confidence }); board.setThreshold(threshold.value); };
  threshold.on(update); update();
  guide.title('LAB 1 · EXPERIMENT 03', 'Decide when evidence is <em>enough</em>');
  guide.say(`Even weighted signals need a finishing rule. The threshold controls how much combined evidence is enough for the neuron to say yes. Right now it says yes too easily. Make it selective.`);
  await flow.ask(async replay => {
    if (replay !== undefined){ threshold.set(.45); update(); return true; }
    await waitFor(() => threshold.value >= .3, { hold:350 }); return true;
  });
  guide.aha(`Inputs arrived, weights set their influence, and a threshold produced an output. <b>You have built one artificial neuron.</b>`);
}

export async function layersStep(){
  const { svg } = newStage('04', 'Several neurons forming a hidden layer');
  const scatter = makeScatter(svg, [
    {x:.22,y:.22,group:0},{x:.78,y:.22,group:1},{x:.22,y:.78,group:1},{x:.78,y:.78,group:0},
  ]);
  scatter.reveal(); scatter.setBoundary('diagonal');
  guide.title('LAB 1 · EXPERIMENT 04', 'Combine decisions into <em>a layer</em>');
  guide.say(`One neuron draws one straight boundary. This pattern puts matching groups in opposite corners. No single straight line can separate them. Try the honest answer.`);
  const answer = await guide.choose([
    { label:'Keep tuning one neuron', value:'one', hint:'one boundary, no matter how carefully tuned' },
    { label:'Add neurons and combine their decisions', value:'layer', hint:'several boundaries can enclose a region' },
  ]);
  if (answer === 'one') guide.note(`One neuron can rotate or move its line, but it still has only one line. The shape of the problem demands more boundaries.`);
  await guide.button('Build a hidden layer ▸');
  const { svg: networkSvg } = newStage('04', 'Two inputs, a hidden layer, and one output');
  const network = drawNetwork(networkSvg, [2,3,1]); network.setWeights([.9,.4,.7,.5]);
  for (let i=1;i<=6;i++){ network.activate(i); await sleep(90); }
  guide.aha(`The middle neurons each notice a different boundary. The output combines their votes. <b>A layer turns several small decisions into one richer shape.</b>`);
}
