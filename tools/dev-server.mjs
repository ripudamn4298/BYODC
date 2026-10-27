// BYODC dev server — static files plus the review-notes endpoint. LOCAL USE ONLY.
//
//   node tools/dev-server.mjs <root> <port> [notes.md]
//
// Serves <root> with no caching. POST /__dev/notes appends one note to notes.md
// (default: REVIEW_NOTES.md next to this repo), which is what the ✎ NOTE box in the
// dev index (js/dev/index-panel.js) writes to. GET /__dev/notes returns the notes
// already in the file as JSON, so the index can mark the cards that have one.
//
// macOS may refuse a server started by an app without Files & Folders access to read
// ~/Documents; that is why the course is usually served from a copy. If the notes file
// cannot be written, the note goes to <root>/REVIEW_NOTES.md instead and the reply says
// where it landed.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(process.argv[2] || path.join(here, '..'));
const port = +(process.argv[3] || 4821);
const notesPath = path.resolve(process.argv[4] || path.join(here, '..', 'REVIEW_NOTES.md'));

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.mp4': 'video/mp4', '.md': 'text/markdown',
};

const HEADER = `# Review notes

Left from the ✎ NOTE box in the localhost dev index. One note per entry, newest last.
Each entry says where it was written: act, step and card, with the card's text, so the
note can be mapped to the exact point. "Jump" is the index number (act.step.card): open
the INDEX drawer on localhost and click it to land on the same card.
Status is \`open\` until it is dealt with; change it to \`done\` or \`dropped\` then.
`;

const quote = s => String(s || '').replace(/\r/g, '').split('\n').map(l => '> ' + l).join('\n');

function formatNote(n, id){
  const w = n.where || {};
  const lines = [`\n## ${id} · ${w.title || 'Somewhere'} · open\n`];
  if (w.stepTitle) lines.push(`- **Step:** ${w.stepTitle} (\`${w.key}\`)`);
  if (w.card) lines.push(`- **Card ${w.card}:** "${w.cardText || ''}"`);
  if (w.hint) lines.push(`- **Also on screen (hint):** "${w.hint}"`);
  if (w.stage) lines.push(`- **Stage labels:** ${w.stage}`);
  if (w.jump) lines.push(`- **Jump:** ${w.jump}`);
  lines.push(`- **Written:** ${n.at || new Date().toISOString()}`);
  lines.push('', quote(n.text), '');
  return lines.join('\n');
}

function readNotes(file){
  try { return fs.readFileSync(file, 'utf8'); } catch { return null; }
}
/* one entry per note: its id, status, the card it was written on, and (for a done note) every
   card it changed, from its "Changed at" line, so the INDEX can mark them for review */
function listNotes(file){
  const md = readNotes(file) || '';
  return md.split(/^(?=## N-\d+ · )/m).map(block => {
    const h = block.match(/^## (N-\d+) · .*?· (\w+)\s*$/m);
    const j = block.match(/^- \*\*Jump:\*\* ([\d.]+)/m);
    if (!h || !j) return null;
    const c = block.match(/^- \*\*Changed at:\*\* (.+)$/m);
    const changed = c ? c[1].split(/[,\s]+/).filter(x => /^\d+\.\d+\.\d+$/.test(x)) : [];
    return { id: h[1], status: h[2], jump: j[1], changed };
  }).filter(Boolean);
}

function appendNote(note){
  const tryWrite = file => {
    const md = readNotes(file);
    // the next number is one past the highest N-xxx mentioned anywhere in the file, not a
    // count of headings: done notes are archived out of the file (REVIEW_NOTES_ARCHIVE.md),
    // and the header keeps the last archived number so numbers are never reused
    const nums = md ? [...md.matchAll(/\bN-(\d+)\b/g)].map(m => +m[1]) : [];
    const id = `N-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0')}`;
    fs.appendFileSync(file, (md == null ? HEADER : '') + formatNote(note, id));
    return { id, file };
  };
  try { return tryWrite(notesPath); }
  catch (err){
    const fallback = path.join(root, 'REVIEW_NOTES.md');
    const r = tryWrite(fallback);
    return { ...r, fallback: true, reason: err.code || String(err) };
  }
}

const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/__dev/notes'){
    if (req.method === 'GET'){
      const notes = listNotes(notesPath);
      return send(res, 200, notes.length ? notes : listNotes(path.join(root, 'REVIEW_NOTES.md')));
    }
    if (req.method === 'POST'){
      let body = '';
      req.on('data', c => { body += c; if (body.length > 1e6) req.destroy(); });
      req.on('end', () => {
        try {
          const note = JSON.parse(body);
          if (!String(note.text || '').trim()) return send(res, 400, { error: 'empty note' });
          const r = appendNote(note);
          console.log(`note ${r.id} → ${r.file}`);
          send(res, 200, r);
        } catch (err){ send(res, 500, { error: String(err) }); }
      });
      return;
    }
    return send(res, 405, { error: 'method' });
  }
  let p = decodeURIComponent(url.pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  if (!f.startsWith(root)) return send(res, 403, '');
  fs.readFile(f, (e, d) => {
    if (e) return send(res, 404, '404', 'text/plain');
    send(res, 200, d, TYPES[path.extname(f)] || 'application/octet-stream');
  });
}).listen(port, () => console.log(`BYODC dev: serving ${root} on http://localhost:${port}, notes → ${notesPath}`));
