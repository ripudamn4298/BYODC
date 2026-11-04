// BYODC engine — the guided tour (Ripu, 2026-11-04). The first time someone starts, after they
// sign in or choose to play as a guest, three stops on the landing page: the index, the music and
// the acts. It ends on the page, so they scroll it or click an act themselves. Two more stops
// wait until the thing they explain is on screen: SPENT on the first card, and the i button the
// first time one appears in a card.
//
// A stop is a spotlight on a real control, a note with an arrow to it, and always a way out. It
// follows the control every frame, so scrolling or resizing cannot leave it behind. Nothing here
// touches flow.ask, so the recorded path, Back and Resume do not know it exists.
import { el, RM } from './util.js';
import { flow } from './flow.js';
import { SFX } from './sfx.js';

const KEY = 'byodc.tour.v1';
const seen = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const mark = what => { try { localStorage.setItem(KEY, JSON.stringify({ ...seen(), [what]: 1 })); } catch { /* storage off */ } };
const done = what => !!seen()[what];

// localhost:4821/?tour shows it all again, for reviewing it
if (new URLSearchParams(location.search).has('tour')){
  try { localStorage.removeItem(KEY); } catch { /* storage off */ }
}

/* One stop. blocking: the page waits behind it. Otherwise a click anywhere closes the note and still
   lands on what was clicked, so tapping the i button both closes the note and opens the i.
   Resolves 'next' or 'skip'. */
function stop({ target, html, count = '', next = 'Next ▸', skip = false, blocking = true, closeOnScroll = false }){
  return new Promise(resolve => {
    const root = el('div', { class: `tour ${blocking ? 'blocking' : ''}`, role: 'dialog', 'aria-modal': String(blocking) });
    const spot = el('div', { class: 'tour-spot' });
    const arrow = el('div', { class: 'tour-arrow', 'aria-hidden': 'true' });
    const note = el('div', { class: 'tour-note' }, `${count ? `<div class="tour-count">${count}</div>` : ''}
      <p class="tour-text">${html}</p>
      <div class="tour-actions">
        ${next ? `<button class="btn primary" type="button" data-label="tour-next">${next}</button>` : ''}
        ${skip ? `<button class="tour-skip" type="button" data-label="tour-skip">Skip the tour</button>` : ''}
      </div>`);
    root.append(spot, arrow, note);
    document.body.appendChild(root);
    requestAnimationFrame(() => root.classList.add('in'));
    note.querySelector('[data-label="tour-next"]')?.focus({ preventScroll: true });

    let raf = 0, open = true;
    const place = () => {
      if (!open) return;
      if (!target.isConnected){ close('next'); return; }
      const r = target.getBoundingClientRect(), pad = 6;
      spot.style.cssText = `left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px`;
      const n = note.getBoundingClientRect(), vw = innerWidth, vh = innerHeight, gap = 34;
      const below = r.bottom + gap + n.height < vh - 8 || r.top - gap - n.height < 8;
      const cx = r.left + r.width / 2;
      const x = Math.max(12, Math.min(vw - n.width - 12, cx - n.width / 2));
      const y = below ? r.bottom + gap : r.top - gap - n.height;
      note.style.left = `${x}px`;
      note.style.top = `${y}px`;
      arrow.className = `tour-arrow ${below ? 'up' : 'down'}`;
      arrow.style.left = `${cx - 11}px`;
      arrow.style.top = `${below ? r.bottom + 9 : r.top - 29}px`;
      raf = requestAnimationFrame(place);
    };
    const close = how => {
      if (!open) return;
      open = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onOutside, true);
      window.removeEventListener('scroll', onScroll);
      root.classList.remove('in');
      setTimeout(() => root.remove(), 180);
      resolve(how);
    };
    const onKey = e => { if (e.key === 'Escape'){ e.preventDefault(); close(skip ? 'skip' : 'next'); } };
    const onOutside = e => { if (!note.contains(e.target)) close('next'); };
    const scrollFrom = scrollY;
    const onScroll = () => { if (closeOnScroll && Math.abs(scrollY - scrollFrom) > 40) close('next'); };
    document.addEventListener('keydown', onKey);
    if (!blocking) document.addEventListener('click', onOutside, true);
    window.addEventListener('scroll', onScroll, { passive: true });
    note.querySelector('[data-label="tour-next"]')?.addEventListener('click', () => { SFX.click(); close('next'); });
    note.querySelector('[data-label="tour-skip"]')?.addEventListener('click', () => { SFX.click(); close('skip'); });
    place();
  });
}

const STOPS = () => [
  { target: document.querySelector('#lnav [data-open-index]'),
    html: `This is the <b>index</b>. It lists every act and step in the course. Open it to see where you are and jump to anything you have reached.` },
  { target: document.querySelector('#lmute'),
    html: `This turns the <b>music</b> and sound effects on and off. You will find the same button inside the course.` },
  lastStop(),
];

/* Ripu (2026-11-04): the tour never opens the course, because he wants people to scroll the page.
   The last stop has no button. Clicking the acts, clicking anywhere else or scrolling closes it. */
function lastStop(){
  const acts = document.querySelector('#acts');
  const atActs = acts && acts.getBoundingClientRect().top < innerHeight * .6;   // they started from the acts list
  const row = atActs && [...acts.querySelectorAll('.act-row')].find(r => {
    const q = r.getBoundingClientRect();
    return q.top >= 70 && q.bottom <= innerHeight;
  });
  return row
    ? { target: row, html: `These are the <b>acts</b>. Click one to start.` }
    : { target: document.querySelector('#lnav a[href="#acts"]'),
        html: `Click here to see all the <b>acts</b>, or scroll down to see what this website is all about.` };
}

export const tour = {
  landingDue(){ return !done('landing'); },

  /* runs on the landing page and ends there: their next click on an act opens the course */
  async landing(){
    mark('landing');
    const stops = STOPS().filter(s => s.target);
    const nav = document.querySelector('#lnav');
    // the bar sits on the drawing at the top of the page, so it takes its paper for the tour
    nav?.classList.add('scrolled');
    // the sign-in box needs a moment to leave
    await new Promise(r => setTimeout(r, RM ? 0 : 280));
    for (let i = 0; i < stops.length; i++){
      const last = i === stops.length - 1;
      const how = await stop({ ...stops[i], count: `${i + 1} of ${stops.length}`, skip: true,
        ...(last ? { next: null, blocking: false, closeOnScroll: true } : {}) });
      if (how === 'skip') break;
    }
    if (scrollY <= 40) nav?.classList.remove('scrolled');
  },

  /* in the course: SPENT once the first card is up, and the first i button when it appears */
  watchCourse(){
    if (!done('spend')) this._spend();
    if (!done('info')) this._info();
  },
  async _spend(){
    const target = document.querySelector('.money-wrap');
    if (!target) return;
    while (flow.instant) await new Promise(r => setTimeout(r, 200));
    await new Promise(r => setTimeout(r, RM ? 0 : 900));
    mark('spend');
    await stop({ target, next: 'Got it',
      html: `This is your <b>spend counter</b>. It adds up what each part of your build costs when factories make it in huge numbers. It starts at almost nothing, and by the end of the course it reaches about $1.7 billion.` });
  },
  _info(){
    const box = document.querySelector('#guide-scroll');
    if (!box) return;
    const look = () => {
      if (flow.instant || done('info') || document.querySelector('.tour')) return;
      const target = box.querySelector('.info-i');
      if (!target) return;
      mark('info');
      watcher.disconnect();
      /* let the card finish fading in, then bring the button into view */
      setTimeout(() => {
        if (!target.isConnected) return;
        target.scrollIntoView({ block: 'nearest', behavior: RM ? 'auto' : 'smooth' });
        stop({ target, blocking: false, next: 'Got it',
          html: `Whenever you see this <b>i</b> button, tap it for extra information about that sentence.` });
      }, RM ? 0 : 600);
    };
    const watcher = new MutationObserver(look);
    watcher.observe(box, { childList: true, subtree: true });
  },
};
