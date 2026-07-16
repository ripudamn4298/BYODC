import { sleep } from '../../../engine/util.js';
import { guide } from '../../../engine/guide.js';
import { newStage } from '../../../engine/stage.js';
import { drawNetwork, makeBars, makeCurve, makePipeline, makeScatter } from '../engine/ai-visuals.js';
import { TRAINING_TRACES } from '../engine/ai-math.js';

const RANK = [{token:'GROUP A',percent:64},{token:'GROUP B',percent:36}];

export async function predictionStep(){
  const { svg } = newStage('05', 'A network making a prediction for a new point');
  const scatter = makeScatter(svg,[{x:.2,y:.25,group:0},{x:.3,y:.36,group:0},{x:.7,y:.68,group:1},{x:.82,y:.74,group:1},{x:.58,y:.54,group:1}]);
  scatter.reveal(); scatter.setBoundary('diagonal');
  guide.title('LAB 2 · EXPERIMENT 05', 'Make a prediction, then <em>check it</em>');
  guide.say(`Training begins with a guess. The network uses its current boundaries to place the new point into a group. Which side contains the new point near the centre?`);
  const answer = await guide.choose([{label:'Group A',value:'A'},{label:'Group B',value:'B'}]);
  if(answer==='B') guide.note(`Correct. With its current boundary, the network gives Group B the stronger vote.`); else guide.note(`The point sits just across the boundary. The current network predicts Group B.`);
  await guide.next('Reveal confidence ▸');
  const bars = makeBars(svg,RANK,{x:430,y:90,w:170,gap:65}); bars.set(RANK);
  guide.aha(`A prediction is not knowledge. It is a ranked guess. The network is <b>64% confident</b> — enough to choose, not enough to stop learning.`);
}

export async function errorStep(){
  const { svg } = newStage('06', 'Prediction and target separated by an error gap');
  const pipeline = makePipeline(svg,['PREDICT','COMPARE','ERROR','ADJUST']); pipeline.activate(0);
  guide.title('LAB 2 · EXPERIMENT 06', 'Measure how far the guess <em>missed</em>');
  guide.say(`The training example comes with the correct answer: Group A. The network predicted Group B. Error is the visible distance between what the model said and what the example says is true.`);
  await guide.button('Compare with the answer ▸'); pipeline.activate(1); await sleep(180); pipeline.activate(2);
  const action = await guide.choose([
    {label:'Ignore the miss and keep the network',value:'ignore'},
    {label:'Use the miss as a direction for change',value:'learn'},
  ]);
  if(action==='ignore') guide.note(`Then the same connections will make the same mistake. Error becomes useful only when it changes the model.`);
  guide.aha(`The error does not say which connection caused the miss yet. It gives learning a destination: <b>make this gap smaller next time.</b>`);
}

export async function blameStep(){
  const { svg } = newStage('07', 'Responsibility moving backward through a network');
  const network = drawNetwork(svg,[3,4,2]); network.setWeights([.9,.2,.7,.35,.6]); network.activate(9);
  guide.title('LAB 2 · EXPERIMENT 07', 'Send responsibility <em>backward</em>');
  guide.say(`The wrong answer came out on the right. To repair it, the network walks backward. Connections that strongly helped the wrong answer receive more responsibility; weak or irrelevant connections receive less.`);
  const answer = await guide.choose([
    {label:'Change every connection equally',value:'equal',hint:'simple, but destroys useful work'},
    {label:'Change connections by their responsibility',value:'blame',hint:'preserve what helped and repair what hurt'},
  ]);
  if(answer==='equal') guide.note(`Equal changes would damage connections that already helped. The useful signal is <b>how much each path contributed</b>.`);
  await guide.button('Trace the responsibility ▸');
  network.links.slice().reverse().forEach((link,index)=>setTimeout(()=>link.classList.add(index%3===0?'error':'active'),index*35));
  await sleep(450);
  guide.aha(`This backward pass assigns responsibility, then nudges each weight. <b>The model keeps the same structure; only the strengths change.</b>`);
}

export async function trainingStep(){
  const { svg } = newStage('08', 'Three deterministic training-rate traces');
  const curve = makeCurve(svg,TRAINING_TRACES); curve.setTrace('slow');
  guide.title('LAB 2 · EXPERIMENT 08', 'Repeat the repair until <em>error falls</em>');
  guide.say(`One example changes the weights once. Training repeats the loop across many examples: predict, compare, send responsibility backward, adjust. The size of each adjustment matters.`);
  const rate = await guide.choose([
    {label:'Tiny steps',value:'slow',hint:'stable, but still far from the answer'},
    {label:'Measured steps',value:'steady',hint:'large enough to learn, small enough to settle'},
    {label:'Huge steps',value:'wild',hint:'jumps across the useful settings'},
  ]);
  curve.setTrace(rate); await guide.next('Run eight training rounds ▸');
  if(rate!=='steady'){ guide.note(rate==='slow' ? `The line falls, but wastes many rounds. Compare it with measured steps.` : `The line thrashes because each repair overshoots. Compare it with measured steps.`); curve.setTrace('steady'); }
  guide.aha(`Error falls because each round keeps the changes that helped. <b>Learning is repeated, directed adjustment</b> — not the network becoming conscious.`);
}
