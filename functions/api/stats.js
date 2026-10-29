// GET /api/stats — { builders }: how many people have started building (signed-in builders
// who chose a nickname, plus guests who pressed start, each counted once).
import { json, ensureSchema } from '../../server/lib.js';

export async function onRequestGet({ env }){
  await ensureSchema(env);
  const row = await env.DB.prepare(`SELECT n FROM counters WHERE name = 'builders'`).first();
  return json({ builders: row?.n || 0 }, 200, { 'cache-control': 'public, max-age=30' });
}
