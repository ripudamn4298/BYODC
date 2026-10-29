// BYODC — accounts, nickname and the builders counter (Ripu, 2026-10-27).
//
// Talks to the Cloudflare Pages Functions in /functions/api. When those are not there
// (the local review server, or the API is down), `online` stays false and the course
// behaves exactly as before: no counter, no sign-in step, progress in this browser only.
//
// The flow on the live site:
//   press Start / Play / Resume → signed in with a nickname and a buddy? play.
//   signed in, no nickname or buddy yet → "What should we call you?" + "Choose your buddy" → play.
//   not signed in → "Sign in with Google" (progress follows you across devices), or
//   "Play as a guest" (progress stays in this browser). Either way you join the counter.
// Guests, and the local review server, are asked the same question once; the answer stays
// in this browser (Ripu, 2026-10-28).
import { el } from './engine/util.js';
import { AVATARS, mountBuddy } from './companion/buddy.js';
import { reachStore } from './reach.js';

const GUEST_KEY = 'byodc.guest.v1';
const PROFILE_KEY = 'byodc.profile.v1';      // { nickname, avatar } for guests and local play
const loadProfile = () => { try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) || null; } catch { return null; } };
const storeProfile = p => { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch { /* storage off */ } };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function api(path, opts = {}){
  const res = await fetch(path, {
    credentials: 'same-origin',
    ...opts,
    headers: { 'content-type': 'application/json', ...(opts.headers || {}) },
  });
  if (!(res.headers.get('content-type') || '').includes('application/json')) throw new Error('no api');
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error || 'request failed'), { data, status: res.status });
  return data;
}

export const account = {
  online: false,          // is the backend reachable?
  signin: false,          // is Google sign-in configured on the server?
  user: null,             // { nickname, name, progress } when signed in
  builders: null,
  guest: false,

  async init(){
    try {
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3000));
      const me = await Promise.race([api('/api/me'), timeout]);
      this.online = true;
      this.signin = !!me.signin;
      this.user = me.user;
      if (this.user?.reach) reachStore.merge(this.user.reach);
      try { this.guest = !!localStorage.getItem(GUEST_KEY); } catch { /* no storage */ }
      api('/api/stats').then(s => { this.builders = s.builders; this.renderCounter(); }).catch(() => {});
    } catch { this.online = false; }
    this.renderNav();
    addEventListener('pagehide', () => this.flush());
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') this.flush(); });
    return this;
  },

  get nickname(){ return this.user ? this.user.nickname || null : loadProfile()?.nickname || null; },
  get avatar(){ return this.user ? this.user.avatar || null : loadProfile()?.avatar || null; },
  get ready(){ return !!(this.nickname && this.avatar); },

  /* ---------- the counter and the nav chip ---------- */
  renderCounter(){
    document.querySelectorAll('[data-builders]').forEach(node => {
      if (!this.online || this.builders == null){ node.hidden = true; return; }
      node.hidden = false;
      const n = this.builders.toLocaleString('en-GB');
      node.innerHTML = `<span class="pulse" aria-hidden="true"></span><b>${n}</b> ${this.builders === 1 ? 'person has' : 'people have'} started building their own data centre`;
    });
  },
  renderNav(){
    const slot = document.querySelector('[data-account]');
    if (!slot) return;
    if (!this.online || !this.signin){ slot.hidden = true; return; }
    slot.hidden = false;
    slot.innerHTML = '';
    if (this.user){
      const who = el('span', { class: 'acct-hi' }, `HI, ${esc((this.nickname || this.user.name || 'BUILDER').toUpperCase())}`);
      const out = el('button', { class: 'acct-link', type: 'button' }, 'SIGN OUT');
      out.addEventListener('click', () => this.signOut());
      slot.append(who, out);
    } else {
      const inn = el('button', { class: 'acct-signin', type: 'button' }, 'SIGN IN');   // the accent 3D button
      inn.addEventListener('click', () => this.goGoogle(1, 0));
      slot.append(inn);
    }
  },

  /* ---------- the gate in front of every start button ---------- */
  async gate(start, { act = 1, step = 0 } = {}){
    if (!this.online || this.user || this.guest || !this.signin){
      if (this.online && !this.user) await this.joinAsGuest();
      if (!this.ready) await this.askNickname();
      return start();
    }
    const choice = await this.askSignIn();
    if (choice === 'google') return this.goGoogle(act, step);
    await this.joinAsGuest();
    if (!this.ready) await this.askNickname();
    return start();
  },

  goGoogle(act, step){ location.href = `/api/auth/login?act=${act}&step=${step}`; },

  async signOut(){
    try { await api('/api/auth/logout', { method: 'POST', body: '{}' }); } catch { /* gone anyway */ }
    location.href = '/';
  },

  async joinAsGuest(){
    let id = null;
    try {
      id = localStorage.getItem(GUEST_KEY);
      if (!id){ id = crypto.randomUUID(); localStorage.setItem(GUEST_KEY, id); }
    } catch { id = crypto.randomUUID(); }
    this.guest = true;
    try { await api('/api/guest', { method: 'POST', body: JSON.stringify({ id }) }); } catch { /* counter only */ }
  },

  /* after Google sends the visitor back: name them if needed, then one click to begin */
  async afterSignIn(start){
    if (!this.user) return;
    if (!this.ready) await this.askNickname();
    else await this.modal(`<div class="acct-kicker">WELCOME BACK</div>
      <h3 class="acct-title">HI, ${esc(this.nickname.toUpperCase())}</h3>
      <p class="acct-copy">Your progress is saved to your account.</p>`, [{ label: 'Keep building ▸', value: 'go', primary: true }]);
    start();
  },

  /* The Resume place plus the per-act reach, saved to the account at the end of every step,
     and when the learner leaves or hides the page with unsaved card progress (2026-10-29: one
     write per step, not one per card, to stay well inside the database's daily write limit).
     This browser always has the exact place; the account catches up at those moments. */
  saveProgress(act, step, { leaving = false } = {}){
    this._place = { act, step };
    if (!this.online || !this.user) return;
    const reach = JSON.stringify(reachStore.all);
    this._sent = reach;
    const body = JSON.stringify({ act, step, reach: reachStore.all });
    if (leaving){   // keepalive lets the request finish after the page has gone
      fetch('/api/progress', { method: 'POST', body, keepalive: true, credentials: 'same-origin',
        headers: { 'content-type': 'application/json' } }).catch(() => {});
      return;
    }
    api('/api/progress', { method: 'POST', body }).catch(() => {});
  },
  notePlace(act, step){ this._place = { act, step }; },
  flush(){
    if (!this.online || !this.user || !this._place) return;
    if (JSON.stringify(reachStore.all) === this._sent) return;    // nothing new since the last save
    this.saveProgress(this._place.act, this._place.step, { leaving: true });
  },

  /* ---------- the two dialogs ---------- */
  askSignIn(){
    return this.modal(`<div class="acct-kicker">BEFORE YOU START</div>
      <h3 class="acct-title">SIGN IN TO START BUILDING</h3>
      <p class="acct-copy">Sign in and your progress follows you to any device. Or play as a guest, and it stays in this browser.</p>`,
      [{ label: 'Sign in with Google', value: 'google', primary: true, google: true },
       { label: 'Play as a guest', value: 'guest' }]);
  },

  askNickname(){
    return new Promise(resolve => {
      let avatar = this.avatar || 'byte';
      const startName = this.nickname || this.user?.name || '';
      const box = this._open(`<div class="acct-kicker">ONE LAST THING</div>
        <h3 class="acct-title">WHAT SHOULD WE CALL YOU?</h3>
        <form class="acct-form" novalidate>
          <input class="acct-input" name="nick" maxlength="24" autocomplete="nickname" placeholder="Your nickname"
            value="${esc(startName)}" aria-label="nickname">
          <div class="acct-kicker acct-pick-h">CHOOSE YOUR BUDDY</div>
          <div class="acct-pick" role="radiogroup" aria-label="buddy"></div>
          <p class="acct-err" hidden></p>
          <div class="acct-actions"><button class="btn primary" type="submit">Start building ▸</button></div>
        </form>`);
      const form = box.querySelector('form'), input = form.nick, err = form.querySelector('.acct-err');
      const pick = form.querySelector('.acct-pick');
      const buddies = AVATARS.map(a => {
        const b = el('button', { type: 'button', class: 'acct-buddy', role: 'radio', 'data-id': a.id, 'aria-checked': String(a.id === avatar) });
        pick.appendChild(b);
        const m = mountBuddy(b, { avatar: a.id, name: startName, scale: 1.7 });
        b.insertAdjacentHTML('beforeend', `<span>${a.label}</span>`);
        b.addEventListener('click', () => {
          avatar = a.id;
          pick.querySelectorAll('.acct-buddy').forEach(x => x.setAttribute('aria-checked', String(x.dataset.id === avatar)));
          m.play('cheer');
        });
        return { a, m };
      });
      // the initial on every buddy's screen follows the name as it is typed
      input.addEventListener('input', () => buddies.forEach(({ a, m }) => m.set({ avatar: a.id, name: input.value })));
      input.focus(); input.select();
      form.addEventListener('submit', async e => {
        e.preventDefault();
        err.hidden = true;
        const finish = nickname => { buddies.forEach(({ m }) => m.destroy()); this._close(box); resolve(nickname); };
        if (!this.user){      // a guest, or the local review server: kept in this browser
          const nickname = input.value.replace(/\s+/g, ' ').trim();
          if (!/^[\p{L}\p{N} ._'-]{1,24}$/u.test(nickname)){ err.textContent = 'Use 1 to 24 letters, numbers or spaces.'; err.hidden = false; return; }
          storeProfile({ nickname, avatar });
          this.renderNav();
          return finish(nickname);
        }
        try {
          const r = await api('/api/nickname', { method: 'POST', body: JSON.stringify({ nickname: input.value, avatar }) });
          this.user.nickname = r.nickname; this.user.avatar = r.avatar;
          if (this.builders != null && !this._counted){ this.builders++; this._counted = true; }
          this.renderNav(); this.renderCounter();
          finish(r.nickname);
        } catch (ex){ err.textContent = ex.message; err.hidden = false; }
      });
    });
  },

  modal(html, buttons){
    return new Promise(resolve => {
      const box = this._open(`${html}<div class="acct-actions"></div>`);
      const row = box.querySelector('.acct-actions');
      buttons.forEach(b => {
        const btn = el('button', { class: `btn ${b.primary ? 'primary' : ''} ${b.google ? 'acct-google' : ''}`, type: 'button' },
          `${b.google ? '<span class="g" aria-hidden="true">G</span>' : ''}${b.label}`);
        btn.addEventListener('click', () => { this._close(box); resolve(b.value); });
        row.appendChild(btn);
      });
      row.querySelector('button')?.focus();
    });
  },
  _open(inner){
    const wrap = el('div', { class: 'acct-modal', role: 'dialog', 'aria-modal': 'true' }, `<div class="acct-card">${inner}</div>`);
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('in'));
    return wrap;
  },
  _close(box){ box.classList.remove('in'); setTimeout(() => box.remove(), 250); },
};
