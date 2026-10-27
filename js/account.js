// BYODC — accounts, nickname and the builders counter (Ripu, 2026-10-27).
//
// Talks to the Cloudflare Pages Functions in /functions/api. When those are not there
// (the local review server, or the API is down), `online` stays false and the course
// behaves exactly as before: no counter, no sign-in step, progress in this browser only.
//
// The flow on the live site:
//   press Start / Play / Resume → signed in with a nickname? play.
//   signed in, no nickname yet → "What should we call you?" → play.
//   not signed in → "Sign in with Google" (progress follows you across devices), or
//   "Play as a guest" (progress stays in this browser). Either way you join the counter.
import { el } from './engine/util.js';

const GUEST_KEY = 'byodc.guest.v1';
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
      try { this.guest = !!localStorage.getItem(GUEST_KEY); } catch { /* no storage */ }
      api('/api/stats').then(s => { this.builders = s.builders; this.renderCounter(); }).catch(() => {});
    } catch { this.online = false; }
    this.renderNav();
    return this;
  },

  get nickname(){ return this.user?.nickname || null; },

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
      const inn = el('button', { class: 'acct-link', type: 'button' }, 'SIGN IN');
      inn.addEventListener('click', () => this.goGoogle(1, 0));
      slot.append(inn);
    }
  },

  /* ---------- the gate in front of every start button ---------- */
  async gate(start, { act = 1, step = 0 } = {}){
    if (!this.online) return start();
    if (this.user){
      if (!this.nickname) await this.askNickname();
      return start();
    }
    if (this.guest || !this.signin){ await this.joinAsGuest(); return start(); }
    const choice = await this.askSignIn();
    if (choice === 'google') return this.goGoogle(act, step);
    await this.joinAsGuest();
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
    if (!this.nickname) await this.askNickname();
    else await this.modal(`<div class="acct-kicker">WELCOME BACK</div>
      <h3 class="acct-title">HI, ${esc(this.nickname.toUpperCase())}</h3>
      <p class="acct-copy">Your progress is saved to your account.</p>`, [{ label: 'Keep building ▸', value: 'go', primary: true }]);
    start();
  },

  saveProgress(act, step){
    if (!this.online || !this.user) return;
    api('/api/progress', { method: 'POST', body: JSON.stringify({ act, step }) }).catch(() => {});
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
      const box = this._open(`<div class="acct-kicker">ONE LAST THING</div>
        <h3 class="acct-title">WHAT SHOULD WE CALL YOU?</h3>
        <form class="acct-form" novalidate>
          <input class="acct-input" name="nick" maxlength="24" autocomplete="nickname" placeholder="Your nickname"
            value="${esc(this.user?.name || '')}" aria-label="nickname">
          <p class="acct-err" hidden></p>
          <div class="acct-actions"><button class="btn primary" type="submit">Start building ▸</button></div>
        </form>`);
      const form = box.querySelector('form'), input = form.nick, err = form.querySelector('.acct-err');
      input.focus(); input.select();
      form.addEventListener('submit', async e => {
        e.preventDefault();
        err.hidden = true;
        try {
          const r = await api('/api/nickname', { method: 'POST', body: JSON.stringify({ nickname: input.value }) });
          this.user.nickname = r.nickname;
          if (this.builders != null && !this._counted){ this.builders++; this._counted = true; }
          this.renderNav(); this.renderCounter();
          this._close(box); resolve(r.nickname);
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
