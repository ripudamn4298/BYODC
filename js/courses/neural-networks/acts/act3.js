import { guide } from '../../../engine/guide.js';
import { newStage } from '../../../engine/stage.js';
import { drawNetwork, makeBars, makePipeline, makePixelGrid } from '../engine/ai-visuals.js';
import { confidenceRanking, DIGITS, featureResponse } from '../engine/ai-math.js';

const HORIZONTAL = [1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1];
const VERTICAL = [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0];

export async function pixelsStep(){
  const { svg } = newStage('09','A five by five digit becoming neural inputs');
  const grid = makePixelGrid(svg,DIGITS.clean2); const network = drawNetwork(svg,[5,3,1],{x:440,y:100,w:220,h:260});
  guide.title('LAB 3 · EXPERIMENT 09', 'Turn pixels into <em>inputs</em>');
  guide.say(`A picture reaches a network as a grid of measurements. A dark square sends a strong signal; a blank square sends a quiet one. This tiny image uses only twenty-five inputs.`);
  await guide.button('Read the pixel grid ▸'); grid.cells.forEach((cell,index)=>setTimeout(()=>cell.classList.toggle('feature',index%4===0),index*18));
  await guide.next('Send all 25 signals ▸'); network.activate(9);
  guide.aha(`The network did not receive the symbol “2.” It received <b>twenty-five signal strengths</b>. Meaning has to be constructed in later layers.`);
}

export async function featuresStep(){
  const { svg } = newStage('10','Stroke detectors responding to a digit');
  const grid = makePixelGrid(svg,DIGITS.clean2); const scores = [
    {token:'horizontal',percent:featureResponse(DIGITS.clean2,HORIZONTAL)},
    {token:'vertical',percent:featureResponse(DIGITS.clean2,VERTICAL)},
  ];
  makeBars(svg,scores,{x:440,y:130,w:165,gap:90});
  guide.title('LAB 3 · EXPERIMENT 10', 'Discover reusable <em>features</em>');
  guide.say(`Hidden neurons do not need to recognise the whole digit at once. One can respond to horizontal strokes; another to diagonals. Which pattern is strongest in this image?`);
  const answer = await guide.choose([{label:'Horizontal strokes',value:'horizontal'},{label:'One vertical stroke',value:'vertical'}]);
  if(answer==='vertical') guide.note(`There are short vertical fragments, but the strongest repeated feature is horizontal: top, middle, and base.`);
  grid.highlight([0,1,2,3,4,10,11,12,13,14,20,21,22,23,24]);
  guide.aha(`A feature detector can be reused across many images. <b>Layers learn useful questions before they learn final answers.</b>`);
}

export async function representationsStep(){
  const { svg } = newStage('11','Pixels becoming strokes, shapes, and a digit');
  const pipeline = makePipeline(svg,['PIXELS','STROKES','SHAPE','DIGIT']);
  guide.title('LAB 3 · EXPERIMENT 11', 'Stack features into <em>meaning</em>');
  guide.say(`Early layers answer small questions: is there an edge here? Middle layers combine edges into strokes and corners. Later layers combine those features into a digit-shaped representation.`);
  for(let i=0;i<4;i++){ await guide.button(i===0?'Activate pixel signals ▸':i===1?'Combine into strokes ▸':i===2?'Combine into a shape ▸':'Name the digit ▸'); pipeline.activate(i); }
  guide.aha(`No single cell contains the idea of “two.” The representation is <b>distributed across many learned features</b>, each contributing part of the evidence.`);
}

export async function confidenceStep(){
  const { svg } = newStage('12','A noisy digit with ranked predictions');
  const grid = makePixelGrid(svg,DIGITS.noisy2,{x:110,y:100,cell:45});
  const ranking = confidenceRanking([{token:'2',score:58},{token:'7',score:27},{token:'3',score:15}]);
  makeBars(svg,ranking,{x:430,y:110,w:175,gap:70});
  guide.title('LAB 3 · EXPERIMENT 12', 'Inspect confidence and <em>failure</em>');
  guide.say(`Real inputs are messy. Several pixels are missing or misplaced. The model still ranks possible answers, but its confidence spreads out.`);
  const answer = await guide.choose([{label:'2',value:'2'},{label:'7',value:'7'},{label:'3',value:'3'}]);
  if(answer!=='2') guide.note(`The noise makes that plausible. The model still ranks 2 first, but only at 58% — much less certain than on the clean image.`);
  await guide.button('Compare with the clean digit ▸'); grid.set(DIGITS.clean2);
  guide.aha(`Confidence is useful precisely because models can be wrong. <b>A ranked answer should never be mistaken for certainty.</b> Noise exposes the boundary of what was learned.`);
}
