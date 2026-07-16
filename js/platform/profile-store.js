// Browser-local MVP persistence. The exported API is intentionally backend-shaped:
// a future authenticated adapter can replace this file without changing platform UI.
const STORAGE_KEY = 'techarium:mvp:v1';
const CHANGE_EVENT = 'techarium:profile-change';
const SCHEMA_VERSION = 1;

function emptyState(){
  return { version: SCHEMA_VERSION, activeProfileId: null, profiles: [] };
}

function readState(){
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || parsed.version !== SCHEMA_VERSION || !Array.isArray(parsed.profiles)) return emptyState();
    return parsed;
  } catch {
    return emptyState();
  }
}

function writeState(state){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (error){ console.warn('[Techarium] Local profile could not be saved:', error); }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: state }));
  return state;
}

function makeId(){
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cleanName(name){
  return String(name || '').trim().replace(/\s+/g, ' ').slice(0, 40);
}

export function getProfiles(){
  return readState().profiles.slice();
}

export function getActiveProfile(){
  const state = readState();
  return state.profiles.find(profile => profile.id === state.activeProfileId) || null;
}

export function createProfile(name){
  const value = cleanName(name);
  if (value.length < 2) throw new Error('Enter at least two characters.');
  const state = readState();
  const now = new Date().toISOString();
  const profile = { id: makeId(), name: value, createdAt: now, updatedAt: now, progress: {} };
  state.profiles.push(profile);
  state.activeProfileId = profile.id;
  writeState(state);
  return profile;
}

export function setActiveProfile(profileId){
  const state = readState();
  if (!state.profiles.some(profile => profile.id === profileId)) return null;
  state.activeProfileId = profileId;
  writeState(state);
  return getActiveProfile();
}

export function getCourseProgress(courseId, profile = getActiveProfile()){
  return profile?.progress?.[courseId] || null;
}

function updateActiveProfile(mutator){
  const state = readState();
  const index = state.profiles.findIndex(profile => profile.id === state.activeProfileId);
  if (index < 0) return null;
  const profile = structuredClone(state.profiles[index]);
  mutator(profile);
  profile.updatedAt = new Date().toISOString();
  state.profiles[index] = profile;
  writeState(state);
  return profile;
}

function defaultProgress(totalSteps){
  return {
    enrolledAt: new Date().toISOString(),
    lastVisitedAt: new Date().toISOString(),
    lastAct: 1,
    lastStep: 1,
    completedStepIds: [],
    completedActs: [],
    totalSteps,
    percent: 0,
    completed: false,
  };
}

export function markCourseStarted(courseId, { act = 1, step = 1, totalSteps = 1 } = {}){
  return updateActiveProfile(profile => {
    const current = profile.progress[courseId] || defaultProgress(totalSteps);
    current.lastAct = act;
    current.lastStep = step;
    current.totalSteps = totalSteps;
    current.lastVisitedAt = new Date().toISOString();
    profile.progress[courseId] = current;
  });
}

export function recordCoursePosition(courseId, { act, step, totalSteps }){
  return markCourseStarted(courseId, { act, step, totalSteps });
}

export function recordCourseStep(courseId, { act, step, globalStep, totalSteps }){
  return updateActiveProfile(profile => {
    const current = profile.progress[courseId] || defaultProgress(totalSteps);
    const stepId = `${act}:${step}`;
    if (!current.completedStepIds.includes(stepId)) current.completedStepIds.push(stepId);
    current.lastAct = act;
    current.lastStep = step;
    current.totalSteps = totalSteps;
    current.lastVisitedAt = new Date().toISOString();
    const completedCount = Math.max(current.completedStepIds.length, globalStep || 0);
    current.percent = Math.max(current.percent || 0, Math.min(100, Math.round(completedCount / totalSteps * 100)));
    profile.progress[courseId] = current;
  });
}

export function recordCourseActCompleted(courseId, act){
  return updateActiveProfile(profile => {
    const current = profile.progress[courseId];
    if (!current) return;
    if (!current.completedActs.includes(act)) current.completedActs.push(act);
    current.lastVisitedAt = new Date().toISOString();
  });
}

export function recordCourseCompleted(courseId){
  return updateActiveProfile(profile => {
    const current = profile.progress[courseId];
    if (!current) return;
    current.completed = true;
    current.percent = 100;
    current.completedAt = new Date().toISOString();
    current.lastVisitedAt = current.completedAt;
  });
}

export function onProfileChange(callback){
  const handler = event => callback(event.detail);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}
