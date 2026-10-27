// BYODC — the floor: a ground line under the guide card where the learner's buddy walks,
// above a progress bar of the five acts (Ripu, 2026-10-28). On narrow screens it is a strip
// fixed to the bottom of the screen instead (css/buddy.css).
//
// The buddy reacts to the course through small DOM events, so the engine never needs to know
// it exists:
//   byodc:card       a new card is on screen          → thinking, briefly
//   pointerdown on the stage                           → writing, while they work
//   a .shake on anything in the game (a wrong answer)  → oops
//   byodc:step-done  { act, step, last }               → cheer, or party at the end of an act
// Nothing reacts while the engine replays (Back, the index), only to live play.
import { mountBuddy, roam } from './buddy.js';
import { flow } from '../engine/flow.js';
import { reachStore } from '../reach.js';
import { account } from '../account.js';

const HIDE_KEY = 'byodc.buddy.hidden.v1';
const hiddenPref = () => { try { return localStorage.getItem(HIDE_KEY) === '1'; } catch { return false; } };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let root, lane, say, bar, buddy, stopRoam, sayT, quietT;
let opts = {};

const small = () => matchMedia('(max-width:920px)').matches;
const nameNow = () => account.nickname || 'Builder';

function speak(text){
  clearTimeout(sayT);
  say.textContent = text;
  // beside the buddy (right, or left when there is no room), so it never covers the card above
  const w = say.offsetWidth, el = buddy.el, gap = 2;
  const right = el.offsetLeft + el.offsetWidth * .78 + gap;
  const left = el.offsetLeft + el.offsetWidth * .22 - gap - w;
  say.style.left = `${right + w <= lane.clientWidth ? right : Math.max(0, left)}px`;
  say.classList.add('on');
  sayT = setTimeout(() => say.classList.remove('on'), 2400);
}

/* a short mood that drops back to idle, unless something bigger is playing */
function briefly(mood, ms){
  if (!buddy || flow.instant || ['cheer', 'party', 'oops'].includes(buddy.mood)) return;
  if (buddy.mood !== mood) buddy.play(mood);
  clearTimeout(quietT);
  quietT = setTimeout(() => { if (buddy.mood === mood) buddy.play('idle'); }, ms);
}

function renderBar(){
  const acts = Object.keys(opts.acts);
  const done = acts.filter(a => reachStore.get(a).done).length;
  bar.innerHTML = `<span class="fl-bar-h">ACTS <b>${done} / ${acts.length}</b></span><span class="fl-segs">${acts.map(a => {
    const f = reachStore.fraction(a), d = reachStore.get(a).done;
    return `<span class="fl-seg${d ? ' done' : ''}" title="Act ${a} · ${d ? 'complete' : Math.round(f * 100) + '% reached'}">
      <i style="width:${(f * 100).toFixed(1)}%"></i><em>${a}</em></span>`;
  }).join('')}</span>`;
}

function mount(){
  buddy?.destroy(); stopRoam?.();
  buddy = mountBuddy(lane, { avatar: account.avatar || 'byte', name: nameNow(), scale: small() ? 1.5 : 2 });
  stopRoam = roam(buddy, lane, { speed: small() ? 30 : 40 });
  buddy.onrest = () => buddy.play('idle');          // after a cheer or an oops, back to rest
}

function setHidden(h){
  try { localStorage.setItem(HIDE_KEY, h ? '1' : '0'); } catch { /* storage off */ }
  root.classList.toggle('no-buddy', h);
  root.querySelector('.fl-hide').textContent = h ? 'SHOW BUDDY' : 'HIDE BUDDY';
}

export const floor = {
  init(o){
    opts = o;
    root = document.createElement('div');
    root.id = 'floor';
    root.innerHTML = `<div class="fl-in">
      <div class="fl-lane"><div class="fl-say" aria-live="polite"></div></div>
      <div class="fl-row">
        <button class="fl-bar" type="button" aria-label="Your progress through the acts. Opens the index."></button>
        <button class="fl-hide" type="button"></button></div></div>`;
    document.getElementById('guide-col').appendChild(root);   // under the guide card
    lane = root.querySelector('.fl-lane');
    say = root.querySelector('.fl-say');
    bar = root.querySelector('.fl-bar');
    bar.addEventListener('click', () => opts.openIndex?.());
    root.querySelector('.fl-hide').addEventListener('click', () => setHidden(!root.classList.contains('no-buddy')));
    setHidden(hiddenPref());
    reachStore.onChange(renderBar);
    renderBar();

    document.addEventListener('byodc:card', () => briefly('thinking', 2600));
    document.addEventListener('byodc:step-done', e => {
      if (!buddy || flow.instant) return;
      const { act, last } = e.detail;
      clearTimeout(quietT);
      buddy.play(last ? 'party' : 'cheer');
      speak(last ? `Act ${act} done, ${nameNow()}!` : `Nice one, ${nameNow()}!`);
    });
    document.getElementById('stage').addEventListener('pointerdown', () => briefly('writing', 2800));
    // a wrong answer: anything in the game starts to shake
    new MutationObserver(list => {
      if (flow.instant || !buddy) return;
      if (list.some(m => m.target.classList?.contains('shake') && !(m.oldValue || '').includes('shake'))){
        clearTimeout(quietT);
        buddy.play('oops');
        speak('Hmm, try again');
      }
    }).observe(document.getElementById('game'), { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
  },

  /* the game has started, or the learner has changed their name or buddy */
  show(){ if (root){ mount(); renderBar(); } },
};
