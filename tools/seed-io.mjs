// Dev only. Safe read-modify-write of js/dev/trail-seed.json, for when several sessions edit
// different steps at once. withSeed(fn) takes a lock (an atomic mkdir), re-reads the file,
// lets fn change the parsed object in place, writes it back, and releases the lock, so two
// writers never overwrite each other's steps. Keep fn quick: no replays inside the lock.
import fs from 'node:fs';
export const SEED = new URL('../js/dev/trail-seed.json', import.meta.url).pathname;
const LOCK = SEED + '.lock';
const sleep = ms => new Promise(r => setTimeout(r, ms));
export const readSeed = () => JSON.parse(fs.readFileSync(SEED, 'utf8'));
export async function withSeed(fn){
  for (let i = 0; ; i++){
    try { fs.mkdirSync(LOCK); break; }
    catch (e){
      if (e.code !== 'EEXIST') throw e;
      // a lock older than 30 s was left by a crashed writer
      try { if (Date.now() - fs.statSync(LOCK).mtimeMs > 30000) fs.rmdirSync(LOCK); } catch { /* gone */ }
      await sleep(100 + Math.random() * 150);
    }
  }
  try {
    const seed = readSeed();
    await fn(seed);
    const lines = Object.keys(seed).map(k => `  ${JSON.stringify(k)}: ${JSON.stringify(seed[k])}`);
    fs.writeFileSync(SEED + '.tmp', '{\n' + lines.join(',\n') + '\n}\n');
    fs.renameSync(SEED + '.tmp', SEED);
  } finally { fs.rmdirSync(LOCK); }
}
