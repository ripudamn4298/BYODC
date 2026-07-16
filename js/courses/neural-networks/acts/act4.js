import { guide } from '../../../engine/guide.js';
import { newStage } from '../../../engine/stage.js';
import { makeAttentionMap, makeBars, makeEmbeddingMap, makePipeline, makeTokenStrip } from '../engine/ai-visuals.js';
import { ATTENTION_SCENARIOS, EMBEDDINGS, getNextTokenRanking, normalizeAttention } from '../engine/ai-math.js';

export async function tokensStep(){
  const { svg } = newStage('13','A sentence split into ordered tokens');
  const tokens = ['The','cat','sat','on','the','mat','.']; const strip = makeTokenStrip(svg,tokens);
  guide.title('LAB 4 · EXPERIMENT 13', 'Split language into <em>tokens</em>');
  guide.say(`A transformer does not receive a sentence as one thought. It receives an ordered row of tokens — words, word pieces, and punctuation — each with its own position.`);
  const answer = await guide.choose([
    {label:'Keep the tokens in order',value:'order',hint:'position changes meaning'},
    {label:'Shuffle them; the words are enough',value:'shuffle',hint:'same words, different statement'},
  ]);
  if(answer==='shuffle') guide.note(`“Cat the on mat sat” contains the same pieces but loses the relationship. A transformer adds position so order survives.`);
  await guide.button('Attach positions ▸'); strip.highlight([0,1,2,3,4,5,6]);
  guide.aha(`Tokens provide the pieces. Positions preserve their arrangement. <b>The transformer now has a sequence it can reason over.</b>`);
}

export async function embeddingsStep(){
  const { svg } = newStage('14','Tokens arranged in a semantic embedding map');
  const map = makeEmbeddingMap(svg,EMBEDDINGS);
  guide.title('LAB 4 · EXPERIMENT 14', 'Place tokens near <em>related ideas</em>');
  guide.say(`A token begins as an ID. An embedding turns it into a location in a learned meaning-space. Related uses tend to land near one another.`);
  await guide.button('Reveal the learned map ▸'); map.reveal();
  const answer = await guide.choose([
    {label:'“bank” has only one permanent meaning',value:'one'},
    {label:'context must pull “bank” toward money or river',value:'context'},
  ]);
  if(answer==='one') guide.note(`The starting embedding blends the token's uses. Context must decide which neighbourhood matters in this sentence.`);
  guide.aha(`Embeddings give tokens useful starting locations. <b>Attention will reshape that meaning using the surrounding words.</b>`);
}

export async function attentionStep(){
  const { svg } = newStage('15','Attention links resolving what a pronoun refers to');
  const scenario = ATTENTION_SCENARIOS.battery; const map = makeAttentionMap(svg,scenario.tokens);
  guide.title('LAB 4 · EXPERIMENT 15', 'Let each token find <em>relevant context</em>');
  guide.say(`In “The robot lifted the battery because it was empty,” the token “it” needs context. Attention lets it look back at every token and gather more from the useful ones.`);
  const answer = await guide.choose([{label:'“it” refers to the robot',value:'robot'},{label:'“it” refers to the battery',value:'battery'}]);
  if(answer!=='battery') guide.note(`The clue is “empty”: batteries can be empty in this context. The strongest useful link should point there.`);
  await guide.button('Route attention ▸'); map.focus(scenario.focus,normalizeAttention(scenario.weights));
  guide.aha(`The battery receives most of the attention, so its information flows into “it.” <b>Attention is selective context gathering</b>, not a database lookup or a conscious gaze.`);
}

export async function transformerStep(){
  const { svg } = newStage('16','A transformer ranking the next token');
  const pipeline = makePipeline(svg,['TOKENS','ATTEND','REFINE','PREDICT']);
  let context = 'the cat sat on the'; let ranking = getNextTokenRanking(context);
  const bars = makeBars(svg,ranking,{x:430,y:85,w:170,gap:58});
  guide.title('LAB 4 · EXPERIMENT 16', 'Build the next-token <em>predictor</em>');
  guide.say(`A transformer repeats one job: use the context so far to rank what could come next. This tiny model has a small curated vocabulary, but the mechanism is honest.`);
  await guide.button('Tokenise the prompt ▸'); pipeline.activate(0);
  await guide.button('Gather context with attention ▸'); pipeline.activate(1);
  await guide.button('Refine the combined meaning ▸'); pipeline.activate(2);
  await guide.button('Rank the next token ▸'); pipeline.activate(3); bars.set(ranking);
  const choice = await guide.choose(ranking.map(item=>({label:`${item.token} — ${item.percent}%`,value:item.token})));
  if(choice!==ranking[0].token) guide.note(`That token is possible, but the model's highest-ranked continuation is <b>${ranking[0].token}</b>. Generation usually selects from this ranking.`);
  context += ` ${ranking[0].token}`; ranking = getNextTokenRanking(context); bars.set(ranking);
  await guide.button(`Generate “${ranking[0].token}” next ▸`); context += ` ${ranking[0].token}`; ranking = getNextTokenRanking(context); bars.set(ranking);
  await guide.button(`Generate “${ranking[0].token}” next ▸`);
  guide.aha(`“The cat sat on the mat and purred.” Each token came from a fresh ranking built from all earlier context. <b>You assembled the path from raw signals to a transformer prediction.</b>`, `This is a constrained teaching model, not a chatbot — small vocabulary, curated traces, real mechanism.`);
}
