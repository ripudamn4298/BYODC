// BYODC — the buddy: a small pixel computer-cat that keeps the learner company
// (Ripu, 2026-10-28; PREVIEW ONLY, not wired into the course yet).
//
// Four avatars, all the same shape, told apart by colour and one small accessory.
// Its head is a screen. The screen shows a face that blinks, and now and then shows the
// learner's initial instead (blink, blink, R, blink, ...). Six expressions, no progression:
// idle, thinking, writing, oops (wrong answer), cheer (step done), party (act done).
// Drawn on a 28 × 31 pixel grid; one SVG user unit is one pixel, so CSS moves are in pixels.

/* ---------- the four avatars ---------- */
export const AVATARS = [
  { id: 'byte', label: 'BYTE', pal: { P: '#7B6FD0', D: '#5A4FA8', L: '#9A90E0', S: '#A9D4F5', s: '#8CBBE6', H: '#3D4E9E', A: '#8FC3F2', E: '#F2A0B5', M: '#C98FE0', N: '#2E3A7A' } },
  { id: 'chip', label: 'CHIP', bowtie: true, pal: { P: '#4FA3A0', D: '#387C7A', L: '#79C2BE', S: '#C4ECDC', s: '#A2D6C4', H: '#2F5E6E', A: '#A6E3D6', E: '#F2B48C', M: '#F2C14E', N: '#234548' } },
  { id: 'pixel', label: 'PIXEL', bow: true, lashes: true, pal: { P: '#D98BB8', D: '#B0688F', L: '#EFB0D2', S: '#FAE1EE', s: '#EDC6DA', H: '#8A4E7E', A: '#F7C6DF', E: '#FBD3E4', M: '#9A90E0', N: '#6A2E58' } },
  { id: 'nova', label: 'NOVA', flower: true, lashes: true, pal: { P: '#E8A65C', D: '#C07F3A', L: '#F5C78C', S: '#FFF1D6', s: '#F2DDB4', H: '#8A5A2B', A: '#FBD9A8', E: '#F7B9A6', M: '#8DBF5E', N: '#6B3F1F' } },
];
const COMMON = { K: '#2A2340', W: '#FFF6DA', G: '#FFFFFF' };
export const avatarById = id => AVATARS.find(a => a.id === id) || AVATARS[0];

/* ---------- the initial, as a 5 × 7 pixel letter ---------- */
const FONT = {
  A: '.###.|#...#|#...#|#####|#...#|#...#|#...#', B: '####.|#...#|#...#|####.|#...#|#...#|####.',
  C: '.###.|#...#|#....|#....|#....|#...#|.###.', D: '####.|#...#|#...#|#...#|#...#|#...#|####.',
  E: '#####|#....|#....|####.|#....|#....|#####', F: '#####|#....|#....|####.|#....|#....|#....',
  G: '.###.|#...#|#....|#.###|#...#|#...#|.###.', H: '#...#|#...#|#...#|#####|#...#|#...#|#...#',
  I: '.###.|..#..|..#..|..#..|..#..|..#..|.###.', J: '..###|...#.|...#.|...#.|...#.|#..#.|.##..',
  K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#', L: '#....|#....|#....|#....|#....|#....|#####',
  M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#', N: '#...#|#...#|##..#|#.#.#|#..##|#...#|#...#',
  O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.', P: '####.|#...#|#...#|####.|#....|#....|#....',
  Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#', R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  S: '.####|#....|#....|.###.|....#|....#|####.', T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
  U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.', V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
  W: '#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.', X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
  Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..', Z: '#####|....#|...#.|..#..|.#...|#....|#####',
  0: '.###.|#..##|#.#.#|#.#.#|##..#|#...#|.###.', 1: '..#..|.##..|..#..|..#..|..#..|..#..|.###.',
  2: '.###.|#...#|....#|...#.|..#..|.#...|#####', 3: '####.|....#|....#|.###.|....#|....#|####.',
  4: '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.', 5: '#####|#....|####.|....#|....#|#...#|.###.',
  6: '.###.|#....|#....|####.|#...#|#...#|.###.', 7: '#####|....#|...#.|..#..|.#...|.#...|.#...',
  8: '.###.|#...#|#...#|.###.|#...#|#...#|.###.', 9: '.###.|#...#|#...#|.####|....#|....#|.###.',
};
export function initialOf(name){
  const ch = [...String(name || '').trim()].find(c => /[\p{L}\p{N}]/u.test(c)) || '?';
  return ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
}

/* ---------- a tiny pixel canvas ---------- */
function canvas(){
  const m = new Map();
  return {
    m,
    set(x, y, c){ m.set(`${x},${y}`, c); },
    del(x, y){ m.delete(`${x},${y}`); },
    rect(x, y, w, h, c){ for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); },
  };
}
/* one <rect> per horizontal run of the same colour */
function toRects(cv, pal){
  const rows = new Map();
  for (const [k, c] of cv.m){ const [x, y] = k.split(',').map(Number); if (!rows.has(y)) rows.set(y, []); rows.get(y).push([x, c]); }
  let s = '';
  for (const [y, cells] of rows){
    cells.sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < cells.length;){
      let j = i; while (j + 1 < cells.length && cells[j + 1][0] === cells[j][0] + 1 && cells[j + 1][1] === cells[i][1]) j++;
      const c = cells[i][1], fill = c[0] === '#' ? c : (pal[c] || COMMON[c]);
      s += `<rect x="${cells[i][0]}" y="${y}" width="${j - i + 1}" height="1" fill="${fill}"/>`;
      i = j + 1;
    }
  }
  return s;
}

/* ---------- the body ---------- */
function body(av){
  const b = canvas();
  // antenna (left), with a light tip
  b.rect(0, 0, 3, 3, 'K'); b.rect(1, 1, 1, 2, 'A'); b.rect(1, 3, 1, 6, 'H');
  // head: a rounded monitor
  b.rect(2, 5, 24, 15, 'K'); [[2, 5], [25, 5], [2, 19], [25, 19]].forEach(([x, y]) => b.del(x, y));
  b.rect(3, 6, 22, 13, 'P'); b.rect(3, 6, 22, 1, 'L'); b.rect(3, 6, 1, 12, 'L');
  b.rect(24, 7, 1, 12, 'D'); b.rect(3, 18, 22, 1, 'D');
  b.rect(12, 6, 4, 1, 'W'); b.rect(12, 18, 4, 1, 'W');               // the cream notch and chin
  // ears (mirrored)
  const ear = flip => {
    const X = x => flip ? 27 - x : x;
    [[6, 1, 'K'], [7, 1, 'K'], [5, 2, 'K'], [6, 2, 'P'], [7, 2, 'P'], [8, 2, 'K'],
     [4, 3, 'K'], [5, 3, 'P'], [6, 3, 'E'], [7, 3, 'E'], [8, 3, 'P'], [9, 3, 'K'],
     [3, 4, 'K'], [4, 4, 'P'], [5, 4, 'E'], [6, 4, 'E'], [7, 4, 'E'], [8, 4, 'E'], [9, 4, 'P'], [10, 4, 'K'],
     [3, 5, 'K'], [4, 5, 'L'], [5, 5, 'L'], [6, 5, 'L'], [7, 5, 'L'], [8, 5, 'L'], [9, 5, 'L'], [10, 5, 'K'],
    ].forEach(([x, y, c]) => b.set(X(x), y, c));
  };
  ear(false); ear(true);
  // the screen
  b.rect(5, 8, 18, 9, 'S'); b.rect(22, 8, 1, 9, 's'); b.rect(5, 16, 18, 1, 's'); b.rect(6, 9, 2, 1, 'G');
  // headphones
  b.rect(0, 9, 3, 7, 'K'); b.rect(1, 10, 2, 5, 'H'); b.set(1, 11, 'A');
  b.rect(25, 9, 3, 7, 'K'); b.rect(25, 10, 2, 5, 'H'); b.set(26, 11, 'A');
  // torso with a little heart
  b.rect(8, 20, 12, 7, 'K'); b.rect(9, 20, 10, 6, 'P'); b.rect(18, 20, 1, 6, 'D'); b.rect(9, 25, 10, 1, 'D');
  b.set(12, 22, 'M'); b.set(15, 22, 'M'); b.rect(12, 23, 4, 1, 'M'); b.rect(13, 24, 2, 1, 'M');
  // the one accessory
  if (av.bowtie){ b.rect(11, 20, 2, 2, '#F2C14E'); b.rect(15, 20, 2, 2, '#F2C14E'); b.rect(13, 20, 2, 1, '#C9962A'); }
  if (av.bow){ b.rect(20, 0, 2, 3, '#C2457E'); b.rect(23, 0, 2, 3, '#C2457E'); b.rect(22, 1, 1, 1, '#8E2D5B'); }
  if (av.flower){ b.rect(5, 1, 3, 1, '#FFFDF6'); b.rect(6, 0, 1, 3, '#FFFDF6'); b.set(6, 1, '#F2C14E'); }
  return b;
}
function limb(kind){
  const c = canvas();
  if (kind === 'armL'){ c.rect(5, 20, 4, 8, 'K'); c.rect(6, 21, 2, 4, 'P'); c.rect(6, 25, 2, 1, 'A'); c.rect(6, 26, 2, 1, 'M'); }
  if (kind === 'armR'){ c.rect(19, 20, 4, 8, 'K'); c.rect(20, 21, 2, 4, 'P'); c.rect(20, 25, 2, 1, 'A'); c.rect(20, 26, 2, 1, 'M'); }
  if (kind === 'legL'){ c.rect(9, 27, 5, 4, 'K'); c.rect(10, 27, 3, 2, 'D'); c.rect(10, 29, 3, 1, 'H'); }
  if (kind === 'legR'){ c.rect(14, 27, 5, 4, 'K'); c.rect(15, 27, 3, 2, 'D'); c.rect(15, 29, 3, 1, 'H'); }
  return c;
}

/* ---------- what the screen can show ---------- */
const EYE_L = 9, EYE_R = 17, EYE_Y = 10;          // each eye is 2 wide and 3 tall
function face(kind, av){
  const f = canvas();
  const smile = () => { f.set(12, 14, 'N'); f.set(15, 14, 'N'); f.rect(13, 15, 2, 1, 'N'); };
  const small = () => f.rect(13, 14, 2, 1, 'N');
  const blush = () => { f.rect(6, 13, 2, 1, 'E'); f.rect(20, 13, 2, 1, 'E'); };
  const lashes = y => { if (av.lashes){ f.set(EYE_L - 1, y, 'N'); f.set(EYE_R + 2, y, 'N'); } };
  if (kind === 'open'){
    [EYE_L, EYE_R].forEach(x => { f.rect(x, EYE_Y, 2, 3, 'N'); f.set(x, EYE_Y, 'G'); });
    lashes(EYE_Y - 1); smile(); blush();
  }
  if (kind === 'blink'){ [EYE_L, EYE_R].forEach(x => f.rect(x - 1, EYE_Y + 2, 4, 1, 'N')); lashes(EYE_Y + 1); smile(); blush(); }
  if (kind === 'happy'){
    [EYE_L, EYE_R].forEach(x => { f.rect(x, EYE_Y, 2, 1, 'N'); f.set(x - 1, EYE_Y + 1, 'N'); f.set(x + 2, EYE_Y + 1, 'N'); });
    f.set(12, 13, 'N'); f.set(15, 13, 'N'); f.rect(13, 14, 2, 1, 'N'); f.rect(13, 15, 2, 1, 'E'); blush();
  }
  if (kind === 'up'){       // thinking: looking up
    [EYE_L, EYE_R].forEach(x => f.rect(x, EYE_Y - 1, 2, 2, 'N'));
    lashes(EYE_Y - 2); small(); blush();
  }
  if (kind === 'down'){     // writing: looking down at the notepad
    [EYE_L, EYE_R].forEach(x => f.rect(x + 1, EYE_Y + 1, 2, 2, 'N'));
    lashes(EYE_Y); small(); blush();
  }
  if (kind === 'worried'){  // oops: > <
    f.set(EYE_L - 1, EYE_Y, 'N'); f.set(EYE_L, EYE_Y + 1, 'N'); f.set(EYE_L - 1, EYE_Y + 2, 'N');
    f.set(EYE_R + 2, EYE_Y, 'N'); f.set(EYE_R + 1, EYE_Y + 1, 'N'); f.set(EYE_R + 2, EYE_Y + 2, 'N');
    f.set(12, 14, 'N'); f.set(13, 13, 'N'); f.set(14, 14, 'N'); f.set(15, 13, 'N');
  }
  return f;
}
function letterFace(initial, pal){
  const rows = FONT[initial] && FONT[initial].split('|');
  if (!rows)   // another script: the character itself, in the pixel font
    return `<text x="14" y="15.6" text-anchor="middle" font-family="VT323, monospace" font-size="9" fill="${pal.N}">${initial.replace(/[<&>]/g, '')}</text>`;
  const f = canvas();
  rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === '#') f.set(11 + x, 9 + y, 'N'); }));
  return toRects(f, pal);
}

/* the extras around it: thought bubble, notepad, sweat, sparkles, confetti */
function props(pal){
  const p = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
  const K = COMMON.K, WH = '#FFFDF6';
  const bubble = `<g class="bb-bubble">${p(25, -10, 12, 6, K)}${p(26, -9, 10, 4, WH)}
    <g class="bb-dot d1">${p(27, -8, 2, 2, pal.N)}</g><g class="bb-dot d2">${p(30, -8, 2, 2, pal.N)}</g><g class="bb-dot d3">${p(33, -8, 2, 2, pal.N)}</g>
    ${p(24, -3, 2, 2, K)}${p(22, -1, 1, 1, K)}</g>`;
  const pad = `<g class="bb-pad">${p(23, 20, 8, 9, K)}${p(24, 21, 6, 7, WH)}${p(24, 21, 6, 1, pal.A)}
    <g class="bb-scrib s1">${p(25, 23, 4, 1, '#989C8C')}</g><g class="bb-scrib s2">${p(25, 25, 3, 1, '#989C8C')}</g>
    ${p(22, 23, 1, 4, '#F2C14E')}${p(22, 27, 1, 1, K)}</g>`;
  const sweat = `<g class="bb-sweat">${p(27, 4, 1, 1, '#8FC9F2')}${p(26, 5, 3, 2, '#8FC9F2')}${p(27, 7, 1, 1, '#8FC9F2')}</g>`;
  const star = (x, y, i) => `<g class="bb-sp sp${i}">${p(x - 1, y, 3, 1, '#F2C14E')}${p(x, y - 1, 1, 3, '#F2C14E')}</g>`;
  const sparks = `<g class="bb-sparks">${star(-4, 6, 0)}${star(31, 8, 1)}${star(-3, 20, 2)}${star(31, 21, 3)}</g>`;
  const cols = ['#F2C14E', '#2946CC', '#8DBF5E', '#E2725B', pal.P, '#5C6B45'];
  const confetti = `<g class="bb-confetti">${Array.from({ length: 18 }, (_, i) =>
    `<g class="cf cf${i % 6}">${p((i * 13) % 40 - 6, -10 - (i % 4) * 2, 1, 1, cols[i % 6])}</g>`).join('')}</g>`;
  return bubble + pad + sweat + sparks + confetti;
}

/* ---------- the SVG ---------- */
export const FACES = ['open', 'blink', 'happy', 'up', 'down', 'worried'];
export function buddySVG(avatarId, name, { scale = 4 } = {}){
  const av = avatarById(avatarId), pal = av.pal;
  const vb = { x: -8, y: -11, w: 44, h: 43 };
  const g = (cls, cv) => `<g class="${cls}">${toRects(cv, pal)}</g>`;
  const faces = FACES.map(k => `<g data-f="${k}">${toRects(face(k, av), pal)}</g>`).join('')
    + `<g data-f="letter">${letterFace(initialOf(name), pal)}</g>`;
  return `<svg class="bb" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" width="${vb.w * scale}" height="${vb.h * scale}"
    shape-rendering="crispEdges" role="img" aria-label="${av.label.toLowerCase()} buddy">
    <rect class="bb-shadow" x="5" y="30" width="18" height="1" fill="rgba(43,33,24,.14)"/>
    <g class="bb-all">
      ${g('bb-leg l', limb('legL'))}${g('bb-leg r', limb('legR'))}
      ${g('bb-body', body(av))}
      <g class="bb-face">${faces}</g>
      ${g('bb-arm l', limb('armL'))}${g('bb-arm r', limb('armR'))}
      ${props(pal)}
    </g></svg>`;
}

/* ---------- the controller: screen loop and expressions ---------- */
// The screen shows the mood's face and, now and then, a blink or the initial.
const SCREEN = {
  idle:     { base: 'open',    gap: [900, 2200], extra: [['blink', 150, .62], ['letter', 950, .38]] },
  thinking: { base: 'up',      gap: [1100, 2400], extra: [['blink', 150, .75], ['letter', 800, .25]] },
  writing:  { base: 'down',    gap: [1200, 2600], extra: [['blink', 150, 1]] },
  oops:     { base: 'worried', gap: [99999, 99999], extra: [] },
  cheer:    { flip: ['happy', 'letter'], every: 380 },
  party:    { flip: ['happy', 'letter'], every: 230 },
};
const ONE_SHOT = { cheer: 2400, party: 3800, oops: 1900 };   // these play, then return to the resting mood
const rnd = ([a, b]) => a + Math.random() * (b - a);

export function mountBuddy(host, { avatar = 'byte', name = '', scale = 4, mood = 'idle' } = {}){
  const wrap = document.createElement('div');
  wrap.className = 'bb-wrap';
  host.appendChild(wrap);
  let timer = null, back = null, resting = mood, current = mood;
  const state = { avatar, name, scale };

  const show = f => { wrap.dataset.face = f; };
  function loop(){
    clearTimeout(timer);
    const s = SCREEN[current];
    if (s.flip){
      let i = 0;
      const tick = () => { show(s.flip[i++ % 2]); timer = setTimeout(tick, s.every); };
      return tick();
    }
    show(s.base);
    const next = () => {
      timer = setTimeout(() => {
        let r = Math.random(), pick = s.extra[0];
        for (const e of s.extra){ if ((r -= e[2]) <= 0){ pick = e; break; } }
        if (!pick) return next();
        show(pick[0]);
        const twice = pick[0] === 'blink' && Math.random() < .3;
        timer = setTimeout(() => {
          show(s.base);
          if (twice) timer = setTimeout(() => { show('blink'); timer = setTimeout(() => { show(s.base); next(); }, pick[1]); }, 160);
          else next();
        }, pick[1]);
      }, rnd(s.gap));
    };
    next();
  }
  function draw(){
    wrap.innerHTML = buddySVG(state.avatar, state.name, { scale: state.scale });
    wrap.dataset.mood = current;
    loop();
  }
  const api = {
    el: wrap,
    get mood(){ return current; },
    set(opts){ Object.assign(state, opts); draw(); },
    play(m){
      clearTimeout(back);
      if (!ONE_SHOT[m]) resting = m;
      current = m; wrap.dataset.mood = m;
      // restart the CSS animations so a repeated cheer jumps again
      wrap.classList.remove('bb-go'); void wrap.offsetWidth; wrap.classList.add('bb-go');
      loop();
      if (ONE_SHOT[m]) back = setTimeout(() => { current = resting; wrap.dataset.mood = resting; loop(); api.onrest?.(); }, ONE_SHOT[m]);
    },
    destroy(){ clearTimeout(timer); clearTimeout(back); wrap.remove(); },
  };
  draw();
  return api;
}

/* ---------- roaming along the floor of the learning area ---------- */
// Walks to a random spot, rests, walks again. Stands still while it shows any expression.
export function roam(buddy, floor, { speed = 46 } = {}){
  const el = buddy.el;
  el.style.position = 'absolute'; el.style.bottom = '0';
  let x = 20, target = x, pauseUntil = 0, raf = 0, last = performance.now();
  const width = () => floor.clientWidth - el.offsetWidth;
  function frame(now){
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const busy = buddy.mood !== 'idle';             // it stops to think, write or celebrate
    if (busy || now < pauseUntil){ el.dataset.walk = ''; }
    else if (Math.abs(target - x) < 2){
      el.dataset.walk = ''; el.dataset.look = '';
      pauseUntil = now + 1400 + Math.random() * 3200;
      target = Math.max(0, Math.min(width(), x + (Math.random() < .5 ? -1 : 1) * (80 + Math.random() * 260)));
    } else {
      const dir = Math.sign(target - x);
      x += dir * speed * dt;
      el.dataset.walk = '1'; el.dataset.look = dir < 0 ? 'l' : 'r';
    }
    el.style.left = `${Math.round(Math.max(0, Math.min(width(), x)))}px`;
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
