// Pure deterministic helpers for the guided AI course. UI copy never exposes
// formulas, but the visual states remain mechanically consistent.
export const TRAINING_TRACES = Object.freeze({
  slow: [92, 88, 84, 80, 76, 72, 69, 66],
  steady: [92, 74, 57, 42, 30, 22, 17, 13],
  wild: [92, 48, 81, 35, 69, 29, 58, 33],
});

export const DIGITS = Object.freeze({
  clean2: [1,1,1,1,0,0,0,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1],
  noisy2: [1,1,1,1,0,0,0,1,0,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,0],
  clean7: [1,1,1,1,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1],
});

export const EMBEDDINGS = Object.freeze([
  { token: 'cat', x: 120, y: 115, group: 'living' },
  { token: 'dog', x: 180, y: 145, group: 'living' },
  { token: 'puppy', x: 205, y: 96, group: 'living' },
  { token: 'river', x: 470, y: 305, group: 'place' },
  { token: 'shore', x: 525, y: 270, group: 'place' },
  { token: 'money', x: 485, y: 105, group: 'finance' },
  { token: 'loan', x: 550, y: 145, group: 'finance' },
  { token: 'bank', x: 430, y: 190, group: 'bridge' },
]);

export const ATTENTION_SCENARIOS = Object.freeze({
  battery: {
    tokens: ['The', 'robot', 'lifted', 'the', 'battery', 'because', 'it', 'was', 'empty'],
    focus: 6,
    weights: [1, 5, 3, 2, 72, 4, 2, 7, 4],
    answer: 'battery',
  },
  animal: {
    tokens: ['The', 'animal', 'missed', 'the', 'bus', 'because', 'it', 'was', 'tired'],
    focus: 6,
    weights: [1, 70, 4, 2, 8, 3, 2, 6, 4],
    answer: 'animal',
  },
});

export const TOKEN_PREDICTIONS = Object.freeze({
  'the cat sat on the': [
    { token: 'mat', score: 72 }, { token: 'roof', score: 15 }, { token: 'moon', score: 8 }, { token: 'engine', score: 5 },
  ],
  'the cat sat on the mat': [
    { token: 'and', score: 46 }, { token: '.', score: 32 }, { token: 'while', score: 14 }, { token: 'engine', score: 8 },
  ],
  'the cat sat on the mat and': [
    { token: 'purred', score: 64 }, { token: 'waited', score: 18 }, { token: 'computed', score: 10 }, { token: 'blue', score: 8 },
  ],
  'data moves through the': [
    { token: 'network', score: 61 }, { token: 'model', score: 21 }, { token: 'window', score: 11 }, { token: 'banana', score: 7 },
  ],
});

export function neuronScore(inputs, weights, bias = 0){
  const raw = inputs.reduce((sum, input, index) => sum + input * (weights[index] || 0), bias);
  const output = raw >= 0 ? 1 : 0;
  const confidence = Math.round(50 + Math.min(49, Math.abs(raw) * 18));
  return { raw, output, confidence };
}

export function confidenceRanking(entries){
  const safe = entries.map(entry => ({ token: entry.token, score: Math.max(0, Number(entry.score) || 0) }));
  const total = safe.reduce((sum, entry) => sum + entry.score, 0) || 1;
  return safe
    .map(entry => ({ ...entry, percent: Math.round(entry.score / total * 100) }))
    .sort((a, b) => b.score - a.score);
}

export function featureResponse(pixels, mask){
  const overlap = pixels.reduce((sum, pixel, index) => sum + (pixel ? (mask[index] || 0) : 0), 0);
  const possible = mask.reduce((sum, value) => sum + Math.max(0, value), 0) || 1;
  return Math.max(0, Math.min(100, Math.round(overlap / possible * 100)));
}

export function normalizeAttention(weights){
  const safe = weights.map(value => Math.max(0, Number(value) || 0));
  const total = safe.reduce((sum, value) => sum + value, 0) || 1;
  return safe.map(value => value / total);
}

export function getNextTokenRanking(context){
  return confidenceRanking(TOKEN_PREDICTIONS[context.toLowerCase()] || [
    { token: 'the', score: 35 }, { token: 'a', score: 28 }, { token: '.', score: 22 }, { token: 'and', score: 15 },
  ]);
}
