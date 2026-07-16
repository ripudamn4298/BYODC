import { COURSES, getAvailableCourses, getCourseLaunchUrl } from './course-registry.js';
import {
  createProfile,
  getActiveProfile,
  getCourseProgress,
  getProfiles,
  onProfileChange,
  setActiveProfile,
} from './profile-store.js';
import { initThemeToggle } from './theme.js';

const FEEDBACK_KEY = 'techarium-feedback';
const $ = selector => document.querySelector(selector);
const courseGrid = $('#course-grid');
const dashboard = $('#dashboard-content');
const dialog = $('#profile-dialog');
const createView = $('#profile-create-view');
const switchView = $('#profile-switch-view');
const nameInput = $('#profile-name');
const profileError = $('#profile-error');
let activeFilter = 'all';

function initials(name){
  return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

function renderHeader(){
  const profile = getActiveProfile();
  const label = $('#profile-label');
  const avatar = $('#profile-avatar');
  const trigger = $('#profile-trigger');
  if (label) label.textContent = profile ? profile.name : 'Create profile';
  if (avatar) avatar.textContent = profile ? initials(profile.name) : '+';
  if (trigger) trigger.setAttribute('aria-label', profile ? `Manage local profile for ${profile.name}` : 'Create local profile');
  const availableCount = getAvailableCourses().length;
  const count = $('#available-course-count');
  const labelCount = $('#available-course-label');
  if (count) count.textContent = String(availableCount);
  if (labelCount) labelCount.textContent = `${availableCount === 1 ? 'course' : 'courses'} available`;
}

function courseCard(course){
  const profile = getActiveProfile();
  const progress = getCourseProgress(course.id, profile);
  const launchUrl = getCourseLaunchUrl(course, progress);
  const card = document.createElement('article');
  card.className = `course-card${course.featured ? ' featured' : ''}`;
  card.dataset.domain = course.domain;
  card.dataset.status = course.status;
  if (launchUrl) card.dataset.launch = launchUrl;
  card.hidden = activeFilter !== 'all' && activeFilter !== course.domain;

  const status = course.status === 'available' ? 'Available now' : 'In development';
  const statusClass = course.status === 'available' ? '' : ' soon';
  const action = launchUrl
    ? `<a href="${launchUrl}">${progress?.percent ? 'Continue course' : 'Explore course'} <span aria-hidden="true">→</span></a>`
    : '<span class="microlabel">JOINING THE CURRICULUM</span>';
  const progressBar = progress
    ? `<div class="progress-track" role="progressbar" aria-label="Course progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.percent}"><div class="progress-fill" style="width:${progress.percent}%"></div></div>`
    : '';

  card.innerHTML = `
    <div class="course-card-top">
      <span class="course-domain">${course.domainLabel}</span>
      <span class="course-status${statusClass}">${status}</span>
    </div>
    <h3>${course.displayTitle}</h3>
    <p class="course-description">${course.description}</p>
    <div class="course-meta">
      <span>${course.level}</span><span>${course.moduleCount} modules</span><span>${course.lessonCount} builds</span><span>${course.duration}</span>
    </div>
    <div class="course-action">${action}${progressBar}</div>`;
  if (launchUrl){
    card.tabIndex = 0;
    card.setAttribute('role', 'link');
    const openCourse = event => {
      if (event.target.closest('a,button,input,select,textarea')) return;
      location.assign(launchUrl);
    };
    card.addEventListener('click', openCourse);
    card.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      location.assign(launchUrl);
    });
  }
  return card;
}

function renderCatalog(){
  if (!courseGrid) return;
  courseGrid.replaceChildren(...COURSES.map(courseCard));
}

function emptyDashboard(title, body, buttonLabel){
  const wrap = document.createElement('div');
  wrap.className = 'dashboard-empty';
  const copy = document.createElement('div');
  const heading = document.createElement('h3');
  const text = document.createElement('p');
  heading.textContent = title;
  text.textContent = body;
  copy.append(heading, text);
  const button = document.createElement('button');
  button.className = 'btn primary';
  button.type = 'button';
  button.textContent = buttonLabel;
  button.addEventListener('click', () => buttonLabel.includes('profile') ? openProfileDialog(true) : location.assign('catalog.html'));
  wrap.append(copy, button);
  return wrap;
}

function renderDashboard(){
  if (!dashboard) return;
  const profile = getActiveProfile();
  if (!profile){
    dashboard.replaceChildren(emptyDashboard('Your progress needs a home.', 'Create a browser-local profile to save completed steps and resume a course later.', 'Create local profile'));
    return;
  }

  const learning = COURSES.filter(course => getCourseProgress(course.id, profile));
  if (!learning.length){
    dashboard.replaceChildren(emptyDashboard(`Welcome, ${profile.name}.`, 'Choose your first course. Your progress will appear here as soon as you begin.', 'Browse courses'));
    return;
  }

  const fragment = document.createDocumentFragment();
  const welcome = document.createElement('div');
  welcome.className = 'dashboard-welcome';
  const copy = document.createElement('div');
  const heading = document.createElement('h3');
  const text = document.createElement('p');
  heading.textContent = `Welcome back, ${profile.name}.`;
  text.textContent = `${learning.length} active learning path${learning.length === 1 ? '' : 's'} on this browser.`;
  copy.append(heading, text);
  const updated = document.createElement('span');
  updated.className = 'microlabel';
  updated.textContent = 'PROGRESS SAVED LOCALLY';
  welcome.append(copy, updated);
  fragment.appendChild(welcome);

  const list = document.createElement('div');
  list.className = 'learning-list';
  learning.forEach(course => {
    const progress = getCourseProgress(course.id, profile);
    const card = document.createElement('article');
    card.className = 'learning-card';
    const top = document.createElement('div');
    top.className = 'learning-top';
    const title = document.createElement('h3');
    title.textContent = course.title;
    const percent = document.createElement('span');
    percent.className = 'learning-percent';
    percent.textContent = `${progress.percent}%`;
    top.append(title, percent);
    const track = document.createElement('div');
    track.className = 'progress-track';
    track.setAttribute('role', 'progressbar');
    track.setAttribute('aria-label', 'Course progress');
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', '100');
    track.setAttribute('aria-valuenow', String(progress.percent));
    const fill = document.createElement('div');
    fill.className = 'progress-fill'; fill.style.width = `${progress.percent}%`; track.appendChild(fill);
    const detail = document.createElement('p');
    detail.textContent = progress.completed ? 'Course complete.' : `Continue from Act ${progress.lastAct}. Progress is saved after each completed step.`;
    const link = document.createElement('a');
    link.href = getCourseLaunchUrl(course, progress);
    link.textContent = progress.completed ? 'Revisit course →' : 'Resume course →';
    card.append(top, track, detail, link);
    list.appendChild(card);
  });
  fragment.appendChild(list);
  dashboard.replaceChildren(fragment);
}

function renderProfileList(){
  if (!dialog) return;
  const profiles = getProfiles();
  const active = getActiveProfile();
  const list = $('#profile-list');
  if (!list) return;
  list.replaceChildren();
  profiles.forEach(profile => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `profile-option${profile.id === active?.id ? ' active' : ''}`;
    const avatar = document.createElement('span'); avatar.className = 'profile-avatar'; avatar.textContent = initials(profile.name);
    const copy = document.createElement('span');
    const name = document.createElement('strong'); name.textContent = profile.name;
    const detail = document.createElement('small'); detail.textContent = `${Object.keys(profile.progress || {}).length} active course${Object.keys(profile.progress || {}).length === 1 ? '' : 's'}`;
    copy.append(name, document.createElement('br'), detail);
    const state = document.createElement('small'); state.textContent = profile.id === active?.id ? 'Current' : 'Use profile';
    button.append(avatar, copy, state);
    button.addEventListener('click', () => { setActiveProfile(profile.id); dialog.close(); });
    list.appendChild(button);
  });
}

function showCreateView(){
  if (!createView || !switchView || !nameInput || !profileError) return;
  createView.hidden = false; switchView.hidden = true; profileError.textContent = ''; nameInput.value = '';
  requestAnimationFrame(() => nameInput.focus());
}

function openProfileDialog(forceCreate = false){
  if (!dialog) return;
  const profiles = getProfiles();
  if (forceCreate || profiles.length === 0) showCreateView();
  else { createView.hidden = true; switchView.hidden = false; renderProfileList(); }
  dialog.showModal();
}

function render(){
  renderHeader(); renderCatalog(); renderDashboard();
}

function initHomeInteractions(){
  if (!document.body.classList.contains('home-body')) return;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const cursor = $('#home-cursor');
  if (cursor && finePointer && !reduceMotion){
    const label = cursor.querySelector('span');
    window.addEventListener('pointermove', event => {
      cursor.classList.add('active');
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
    }, { passive: true });
    document.querySelectorAll('a,button,[data-cursor-text]').forEach(item => {
      item.addEventListener('pointerenter', () => {
        label.textContent = item.dataset.cursorText || 'GO';
        cursor.classList.add('hot');
      });
      item.addEventListener('pointerleave', () => cursor.classList.remove('hot'));
    });
  }

  if (reduceMotion || !finePointer) return;
  document.querySelectorAll('[data-tilt]').forEach(panel => {
    panel.addEventListener('pointermove', event => {
      const rect = panel.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - .5) * 5;
      const y = ((event.clientY - rect.top) / rect.height - .5) * -5;
      panel.style.setProperty('--tilt-x', `${x.toFixed(2)}deg`);
      panel.style.setProperty('--tilt-y', `${y.toFixed(2)}deg`);
    });
    panel.addEventListener('pointerleave', () => {
      panel.style.setProperty('--tilt-x', '0deg');
      panel.style.setProperty('--tilt-y', '0deg');
    });
  });
}

function initFeedbackForm(){
  const form = $('#feedback-form');
  if (!form) return;
  const status = $('#feedback-status');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const message = String(data.get('feedback') || '').trim();
    if (!message) return;
    const entry = {
      message,
      email: String(data.get('email') || '').trim(),
      createdAt: new Date().toISOString(),
      page: location.pathname.split('/').pop() || 'index.html',
    };
    try {
      const existing = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]');
      existing.push(entry);
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify(existing.slice(-25)));
      form.reset();
      if (status) status.textContent = 'Saved locally. Add real email delivery when backend is ready.';
    } catch {
      if (status) status.textContent = 'Could not save feedback in this browser.';
    }
  });
}

$('#profile-form')?.addEventListener('submit', event => {
  event.preventDefault();
  try {
    createProfile(nameInput.value);
    profileError.textContent = '';
    dialog.close();
  } catch (error){
    profileError.textContent = error.message;
    nameInput.focus();
  }
});

$('#new-profile')?.addEventListener('click', showCreateView);
$('#profile-dialog-close')?.addEventListener('click', () => dialog.close());
[$('#profile-trigger'), $('#dashboard-profile')].filter(Boolean).forEach(button => button.addEventListener('click', () => openProfileDialog(false)));

document.querySelectorAll('.filter-chip').forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  document.querySelectorAll('.filter-chip').forEach(item => item.classList.toggle('active', item === button));
  renderCatalog();
}));

onProfileChange(render);
initThemeToggle();
render();
initHomeInteractions();
initFeedbackForm();
