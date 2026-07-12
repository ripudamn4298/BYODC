// BYODC engine — background music: user-supplied track from bg-music/,
// played faint, looped, slowed to 0.75× (pitch follows — the "slowed" feel).
const TRACK = 'bg-music/' + encodeURIComponent('ES_283919_77 Cycles - Lennon Hutton.mp3');
const BASE_VOL = 0.09;   // faint bed — always beneath the task SFX

export const Music = {
  el: null, playing: false, muted: false, _fadeTimer: null,

  start(){
    if (this.playing) return;
    this.playing = true;
    const a = this.el = new Audio(TRACK);
    a.loop = true;
    a.volume = 0;
    a.playbackRate = 0.75;
    try { a.preservesPitch = false; a.mozPreservesPitch = false; a.webkitPreservesPitch = false; } catch (e){}
    const go = () => a.play().then(() => { this._fadeTo(this.muted ? 0 : BASE_VOL, 4000); return true; }).catch(() => false);
    go().then(ok => {
      if (ok) return;
      // autoplay blocked — keep retrying on user gestures until one sticks
      const retry = () => go().then(ok2 => { if (ok2){ document.removeEventListener('pointerdown', retry); document.removeEventListener('keydown', retry); } });
      document.addEventListener('pointerdown', retry);
      document.addEventListener('keydown', retry);
    });
  },

  _fadeTo(target, ms){
    if (!this.el) return;
    clearInterval(this._fadeTimer);
    const from = this.el.volume, t0 = performance.now();
    this._fadeTimer = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      this.el.volume = from + (target - from) * k;
      if (k >= 1) clearInterval(this._fadeTimer);
    }, 60);
  },

  setMuted(m){
    this.muted = m;
    if (this.el) this._fadeTo(m ? 0 : BASE_VOL, 500);
  },
  setIntensity(){ /* the track carries itself — no per-step change */ },
};
window.__byodcMusic = Music;   // debug/verification hook (harmless)
