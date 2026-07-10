// BYODC — boot: landing ⇄ game
import { $, RM } from './engine/util.js';
import { SFX } from './engine/sfx.js';
import { guide } from './engine/guide.js';
import { hud } from './engine/hud.js';
import { flow } from './engine/flow.js';
import { Music } from './engine/music.js';
import { ACT1 } from './steps/act.js';
import { showSummary } from './steps/summary.js';
import { initLanding, teardownLanding } from './landing.js';

guide.init();
hud.init();
initLanding();

let started = false;
function startGame(){
  if (started) return;
  started = true;
  SFX.init(); SFX.click();
  teardownLanding();
  $('#landing').style.display = 'none';
  $('#game').classList.add('active');
  window.scrollTo(0, 0);
  Music.start();
  flow.run(ACT1, () => showSummary());
}

document.querySelectorAll('[data-begin]').forEach(b =>
  b.addEventListener('click', startGame));

$('#mute').addEventListener('click', e => {
  SFX.init();
  const muted = SFX.toggleMute();
  Music.setMuted(muted);
  e.currentTarget.textContent = muted ? '∅' : '♪';
});
