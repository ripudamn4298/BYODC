import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ATTENTION_SCENARIOS,
  DIGITS,
  EMBEDDINGS,
  TRAINING_TRACES,
  confidenceRanking,
  featureResponse,
  getNextTokenRanking,
  neuronScore,
  normalizeAttention,
} from '../js/courses/neural-networks/engine/ai-math.js';

test('neuron scoring changes output when evidence crosses the threshold', () => {
  assert.equal(neuronScore([.8,.3],[.8,.1],-.4).output, 1);
  assert.equal(neuronScore([.2,.1],[.8,.1],-.4).output, 0);
});

test('confidence ranking is descending and approximately normalized', () => {
  const ranked = confidenceRanking([{token:'b',score:20},{token:'a',score:70},{token:'c',score:10}]);
  assert.deepEqual(ranked.map(item=>item.token),['a','b','c']);
  assert.equal(ranked.reduce((sum,item)=>sum+item.percent,0),100);
});

test('guided training traces tell the intended honest story', () => {
  assert.ok(TRAINING_TRACES.steady.at(-1) < TRAINING_TRACES.slow.at(-1));
  assert.ok(TRAINING_TRACES.wild.some((value,index,list)=>index>0 && value>list[index-1]));
});

test('horizontal feature responds strongly to the clean digit two', () => {
  const horizontal=[1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1];
  const vertical=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0];
  assert.ok(featureResponse(DIGITS.clean2,horizontal)>featureResponse(DIGITS.clean2,vertical));
});

test('attention normalizes and preserves the intended referent', () => {
  const scenario=ATTENTION_SCENARIOS.battery;
  const normalized=normalizeAttention(scenario.weights);
  assert.ok(Math.abs(normalized.reduce((a,b)=>a+b,0)-1)<1e-9);
  assert.equal(scenario.tokens[normalized.indexOf(Math.max(...normalized))],'battery');
});

test('embedding fixture has stable unique token positions', () => {
  assert.equal(new Set(EMBEDDINGS.map(item=>item.token)).size,EMBEDDINGS.length);
  assert.equal(new Set(EMBEDDINGS.map(item=>`${item.x}:${item.y}`)).size,EMBEDDINGS.length);
});

test('tiny transformer ranks mat after the curated prompt', () => {
  const ranked=getNextTokenRanking('the cat sat on the');
  assert.equal(ranked[0].token,'mat');
  assert.ok(ranked[0].percent>ranked[1].percent);
});
