// BYODC engine — background music: user-supplied track from bg-music/,
// played faint, looped, slowed to 0.75× (pitch follows — the "slowed" feel).
//
// Level and mute (2026-11-02): iPhones ignore an audio element's .volume — it is always 1 —
// so on a phone the bed played at full volume and the mute button did nothing. The element
// is now routed through Web Audio and its level set with a GainNode, which iOS respects;
// muting also sets the element's own .muted flag, which iOS honours too. Where Web Audio is
// unavailable it falls back to .volume as before.
const TRACK = 'bg-music/' + encodeURIComponent('ES_283919_77 Cycles - Lennon Hutton.mp3');
const BASE_VOL = 0.09;   // faint bed — always beneath the task SFX

export const Music = {
  el: null, playing: false, muted: false, _fadeTimer: null,
  ctx: null, gain: null,

  start(){
    if (this.playing) return;
    this.playing = true;
    const a = this.el = new Audio(TRACK);
    a.loop = true;
    a.playbackRate = 0.75;
    try { a.preservesPitch = false; a.mozPreservesPitch = false; a.webkitPreservesPitch = false; } catch (e){}
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.gain = this.ctx.createGain();
      this.gain.gain.value = 0;
      this.ctx.createMediaElementSource(a).connect(this.gain);
      this.gain.connect(this.ctx.destination);   // separate calls: older Safari's connect() returns nothing
    } catch (e){ this.ctx = this.gain = null; a.volume = 0; }
    a.muted = this.muted;
    // the audio context starts suspended until the visitor touches the page; wake it then
    const wake = () => { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); };
    document.addEventListener('pointerdown', wake, { capture: true });
    document.addEventListener('keydown', wake, { capture: true });
    const go = () => { wake(); return a.play().then(() => { this._fadeTo(this.muted ? 0 : BASE_VOL, 4000); return true; }).catch(() => false); };
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
    if (this.gain){
      const g = this.gain.gain, now = this.ctx.currentTime;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(target, now + ms / 1000);
      return;
    }
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
    if (!this.el) return;
    clearTimeout(this._muteTimer);
    if (m){
      this._fadeTo(0, 400);
      // after the fade, mute the element itself (honoured on iPhones, where .volume is not)
      this._muteTimer = setTimeout(() => { if (this.muted) this.el.muted = true; }, 420);
    } else {
      this.el.muted = false;
      this._fadeTo(BASE_VOL, 500);
    }
  },
  setIntensity(){ /* the track carries itself — no per-step change */ },
};
window.__byodcMusic = Music;   // debug/verification hook (harmless)
