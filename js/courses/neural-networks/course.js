import { inputsStep, weightsStep, thresholdStep, layersStep } from './acts/act1.js';
import { predictionStep, errorStep, blameStep, trainingStep } from './acts/act2.js';
import { pixelsStep, featuresStep, representationsStep, confidenceStep } from './acts/act3.js';
import { tokensStep, embeddingsStep, attentionStep, transformerStep } from './acts/act4.js';

const note = (title, meta, body, footer) => ({ eyebrow:'LAB NOTE', title, meta, body, footer, className:'lab-note' });

export const LAB1 = [
  { id:'inputs', title:'Turn observations into signals', model:'INPUTS · 2', capability:'reads two measured signals', labNote:note('Signals connected','EXPERIMENT 01 · INPUT LAYER','The model now receives brightness and edge strength as separate evidence.','CAPABILITY ADDED · READ INPUTS'), premise:'Signals alone do not decide anything. Next, choose which ones deserve influence.', cta:'Set the connection weights ▸', run:inputsStep },
  { id:'weights', title:'Give signals influence', model:'NEURON · 2 WEIGHTS', capability:'prioritises useful evidence', labNote:note('Influence calibrated','EXPERIMENT 02 · WEIGHTS','Useful evidence now travels through a stronger connection; distraction travels through a weak one.','CAPABILITY ADDED · WEIGH EVIDENCE'), premise:'Influence is ready. The neuron still needs a rule for when the combined evidence is enough.', cta:'Add a decision threshold ▸', run:weightsStep },
  { id:'threshold', title:'Decide when evidence is enough', model:'NEURON · COMPLETE', capability:'turns evidence into a decision', labNote:note('First neuron online','EXPERIMENT 03 · ACTIVATION','Inputs, weights, and a threshold now produce one stable output.','CAPABILITY ADDED · MAKE A DECISION'), premise:'One neuron makes one boundary. Some patterns need several boundaries working together.', cta:'Build a layer ▸', run:thresholdStep },
  { id:'layers', title:'Combine decisions into a layer', model:'NETWORK · 2–3–1', capability:'combines several boundaries', labNote:note('Hidden layer assembled','EXPERIMENT 04 · COMPOSITION','Three small decisions combine into a pattern one straight boundary cannot capture.','LAB 1 CLEARED · A NETWORK EXISTS'), premise:null, cta:'Finish Lab 1 ▸', run:layersStep },
];

export const LAB2 = [
  { id:'prediction', title:'Make and inspect a prediction', model:'NETWORK · UNTRAINED', capability:'ranks possible answers', labNote:note('Prediction exposed','EXPERIMENT 05 · FORWARD PASS','The model produces a ranked guess and reports how strongly it prefers that answer.','CAPABILITY ADDED · PREDICT'), premise:'A guess becomes useful for learning only when it is compared with the known answer.', cta:'Measure the miss ▸', run:predictionStep },
  { id:'error', title:'Measure the miss', model:'NETWORK · ERROR VISIBLE', capability:'measures distance from the answer', labNote:note('Error made useful','EXPERIMENT 06 · COMPARISON','The gap between prediction and target now gives the model a direction for repair.','CAPABILITY ADDED · MEASURE ERROR'), premise:'The error belongs to the whole network. Next, distribute responsibility across the paths that produced it.', cta:'Send responsibility backward ▸', run:errorStep },
  { id:'blame', title:'Send responsibility backward', model:'NETWORK · BACKWARD PASS', capability:'assigns responsibility to connections', labNote:note('Responsibility traced','EXPERIMENT 07 · BACKWARD PASS','Strong contributors to the wrong answer receive larger changes; useful paths are preserved.','CAPABILITY ADDED · ADJUST WEIGHTS'), premise:'One repair is not training. Repeat the loop and the useful changes accumulate.', cta:'Run the training loop ▸', run:blameStep },
  { id:'training', title:'Repeat until error falls', model:'NETWORK · TRAINED', capability:'learns through repeated correction', labNote:note('Training stabilised','EXPERIMENT 08 · LEARNING RATE','Measured steps reduce error reliably without crawling or overshooting.','LAB 2 CLEARED · THE NETWORK LEARNS'), premise:null, cta:'Finish Lab 2 ▸', run:trainingStep },
];

export const LAB3 = [
  { id:'pixels', title:'Turn pixels into inputs', model:'VISION · 25 INPUTS', capability:'reads a small image as signals', labNote:note('Image connected','EXPERIMENT 09 · PIXEL INPUT','Twenty-five pixel strengths now enter the network in a stable position.','CAPABILITY ADDED · READ PIXELS'), premise:'Raw pixels vary too much to memorise directly. The network needs reusable features.', cta:'Discover feature detectors ▸', run:pixelsStep },
  { id:'features', title:'Discover reusable features', model:'VISION · FEATURES', capability:'detects strokes and edges', labNote:note('Features discovered','EXPERIMENT 10 · HIDDEN UNITS','Hidden neurons respond to horizontal strokes, diagonals, and corners wherever they appear.','CAPABILITY ADDED · DETECT FEATURES'), premise:'Features become powerful when later layers combine them into larger representations.', cta:'Stack the representations ▸', run:featuresStep },
  { id:'representations', title:'Stack features into meaning', model:'VISION · 4 LAYERS', capability:'builds shapes from simple features', labNote:note('Representation stack complete','EXPERIMENT 11 · DEPTH','Pixels combine into strokes, strokes into shape, and shape into a digit-level representation.','CAPABILITY ADDED · BUILD MEANING'), premise:'A model can rank an answer even when the input is damaged. That confidence must be inspected, not trusted blindly.', cta:'Test a noisy image ▸', run:representationsStep },
  { id:'confidence', title:'Inspect confidence and failure', model:'VISION · TESTED', capability:'reports uncertainty on noisy inputs', labNote:note('Limits documented','EXPERIMENT 12 · ROBUSTNESS','The model keeps a ranked prediction under noise, while confidence reveals that the evidence weakened.','LAB 3 CLEARED · THE NETWORK CAN SEE'), premise:null, cta:'Finish Lab 3 ▸', run:confidenceStep },
];

export const LAB4 = [
  { id:'tokens', title:'Split language into tokens', model:'TRANSFORMER · TOKENS', capability:'turns ordered text into model inputs', labNote:note('Sequence prepared','EXPERIMENT 13 · TOKENISATION','Words and punctuation are now separate tokens with positions that preserve their order.','CAPABILITY ADDED · READ A SEQUENCE'), premise:'Token IDs do not carry useful similarity. Embeddings give each token a learned starting place.', cta:'Build the embedding map ▸', run:tokensStep },
  { id:'embeddings', title:'Place tokens near related ideas', model:'TRANSFORMER · EMBEDDINGS', capability:'represents tokens by learned similarity', labNote:note('Meaning-space mapped','EXPERIMENT 14 · EMBEDDINGS','Related token uses occupy nearby regions; ambiguous tokens wait for context to resolve them.','CAPABILITY ADDED · REPRESENT MEANING'), premise:'Embeddings are only a starting point. Each token must gather the context relevant to this sentence.', cta:'Route attention ▸', run:embeddingsStep },
  { id:'attention', title:'Gather relevant context', model:'TRANSFORMER · ATTENTION', capability:'routes context between tokens', labNote:note('Context routed','EXPERIMENT 15 · SELF-ATTENTION','The pronoun gathers most of its context from the noun that makes the sentence coherent.','CAPABILITY ADDED · USE CONTEXT'), premise:'The pieces are ready: tokens, positions, embeddings, and attention. Assemble the prediction loop.', cta:'Build the predictor ▸', run:attentionStep },
  { id:'transformer', title:'Predict the next token', model:'TINY TRANSFORMER · ONLINE', capability:'ranks and generates next tokens', labNote:note('Transformer online','EXPERIMENT 16 · GENERATION','The model repeatedly ranks a small vocabulary from context and selects a coherent continuation.','COURSE CLEARED · SIGNAL TO LANGUAGE'), premise:null, cta:'Finish the course ▸', run:transformerStep },
];

const summary = (lab, title, sub, items, next) => ({ lab, title, sub, items, next });
export const LAB_SUMMARIES = {
  1: summary(1,'You built the first <em>decision machine.</em>','Signals entered, useful paths gained influence, a threshold created an output, and several neurons formed a layer.',[
    ['01','Inputs','measurements became signals'],['02','Weights','evidence gained influence'],['03','Threshold','evidence became a decision'],['04','Layer','decisions formed a richer boundary'],
  ],'Continue to Lab 2 ▸'),
  2: summary(2,'You taught the network <em>to improve.</em>','Prediction, comparison, backward responsibility, and measured adjustment now form a complete learning loop.',[
    ['05','Prediction','ranked guesses'],['06','Error','distance from the target'],['07','Backward pass','responsibility by contribution'],['08','Training','repeated directed repair'],
  ],'Continue to Lab 3 ▸'),
  3: summary(3,'You turned pixels <em>into meaning.</em>','Raw measurements became reusable features, stacked representations, ranked answers, and honest uncertainty.',[
    ['09','Pixels','25 positioned signals'],['10','Features','strokes and corners'],['11','Depth','features composed into shape'],['12','Confidence','limits stayed visible'],
  ],'Continue to Lab 4 ▸'),
  4: summary(4,'You built a tiny <em>transformer.</em>','Tokens kept their order, embeddings supplied learned similarity, attention gathered context, and the model predicted what came next.',[
    ['13','Tokens','ordered language pieces'],['14','Embeddings','learned meaning-space'],['15','Attention','selective context gathering'],['16','Prediction','ranked next tokens'],
  ],null),
};
