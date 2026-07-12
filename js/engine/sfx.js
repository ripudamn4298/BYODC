// BYODC engine — synthesized audio. Paper-lab palette: felt taps, soft ticks, quiet swells.
export const SFX = {
  ctx: null, master: null, muted: false,
  init(){
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = .24;   // task SFX always sit above the music bed
      this.master.connect(this.ctx.destination);
    } catch (e){ this.ctx = null; }
  },
  tone(f0, dur, { type = 'sine', f1, g = 1, lp } = {}){
    if (!this.ctx || this.muted) return;
    try {
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator(), gn = this.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t);
      if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      gn.gain.setValueAtTime(0, t);
      gn.gain.linearRampToValueAtTime(.5 * g, t + .012);
      gn.gain.exponentialRampToValueAtTime(.001, t + dur);
      let out = gn;
      if (lp){ const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; gn.connect(f); out = f; }
      o.connect(gn); out.connect(this.master);
      o.start(t); o.stop(t + dur + .05);
    } catch (e){}
  },
  click(){ this.tone(620, .05, { f1: 470, g: .45 }); },
  dope(){ this.tone(260, .16, { type: 'triangle', f1: 170, g: .7 }); },
  flow(){ this.tone(150, .85, { type: 'sawtooth', f1: 560, g: .28, lp: 1000 }); },
  success(){ this.tone(590, .12, { g: .6 }); setTimeout(() => this.tone(885, .22, { g: .5 }), 110); },
  blip(){ this.tone(1050, .045, { type: 'square', g: .2 }); },
  hop(){ this.tone(430, .07, { type: 'triangle', f1: 340, g: .35 }); },
  toggleMute(){ this.muted = !this.muted; return this.muted; },
};
document.addEventListener('pointerdown', () => SFX.init(), { once: true, capture: true });
