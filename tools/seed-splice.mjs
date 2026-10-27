// Dev only. Inserts plain Next cards into one step's recorded INDEX trail.
//
//   node tools/seed-splice.mjs <stepKey> <index> <count>
//   e.g. node tools/seed-splice.mjs 2:nand-gate 23 4
//
// <index> is the 0-based card index where the new cards start (cards after it move down);
// use "end" to insert just before the step's last (wrap) card. Each new card records `true`.
// Run dev-relabel-step.mjs afterwards to fill in the labels. Safe to run alongside other
// sessions (tools/seed-io.mjs locks the file).
import { withSeed } from './seed-io.mjs';
const [key, at, n] = process.argv.slice(2);
await withSeed(seed => {
  const t = seed[key];
  if (!t) throw new Error(`no step ${key} in the seed`);
  const i = at === 'end' ? t.a.length - 1 : +at;
  t.a.splice(i, 0, ...Array(+n).fill(true));
  t.l.splice(i, 0, ...Array(+n).fill(0).map(() => ({ t: '', k: '' })));
  console.log(key, 'now', t.a.length, 'cards');
});
