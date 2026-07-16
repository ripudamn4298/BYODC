const THEME_KEY = 'techarium-theme';
const THEME_TOKENS = {
  light: {
    '--paper': '#E8DFC9',
    '--paper-high': '#F2ECDC',
    '--ink': '#1D2117',
    '--ink-soft': '#565D4C',
    '--ink-faint': '#989C8C',
    '--hairline': 'rgba(29,33,23,.16)',
    '--hairline-soft': 'rgba(29,33,23,.09)',
    '--hairline-strong': 'rgba(29,33,23,.34)',
    '--dark': '#181B12',
    '--dark-soft': '#242819',
    '--cream': '#EFECE0',
    '--blue': '#2946CC',
    '--blue-soft': 'rgba(41,70,204,.08)',
    '--red': '#D9481E',
    '--red-soft': 'rgba(217,72,30,.07)',
    '--amber': '#A8741F',
    '--amber-soft': 'rgba(168,116,31,.10)',
    '--green': '#5C6B45',
    '--grid-fine': 'rgba(150,96,44,.075)',
    '--grid-bold': 'rgba(150,96,44,.12)',
  },
  dark: {
    '--paper': '#111611',
    '--paper-high': '#171E18',
    '--ink': '#F6F1DD',
    '--ink-soft': '#C9D1BA',
    '--ink-faint': '#8F9A84',
    '--hairline': 'rgba(246,241,221,.18)',
    '--hairline-soft': 'rgba(246,241,221,.09)',
    '--hairline-strong': 'rgba(246,241,221,.36)',
    '--dark': '#090C09',
    '--dark-soft': '#101610',
    '--cream': '#FFF7DC',
    '--blue': '#78A7FF',
    '--blue-soft': 'rgba(120,167,255,.16)',
    '--red': '#FF714D',
    '--red-soft': 'rgba(255,113,77,.14)',
    '--amber': '#FFD166',
    '--amber-soft': 'rgba(255,209,102,.16)',
    '--green': '#9DE08F',
    '--grid-fine': 'rgba(255,247,220,.055)',
    '--grid-bold': 'rgba(255,247,220,.11)',
  },
};

export function getStoredTheme(){
  try { return localStorage.getItem(THEME_KEY); }
  catch { return null; }
}

export function preferredTheme(){
  const stored = getStoredTheme();
  if (stored === 'dark' || stored === 'light') return stored;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme){
  const next = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  Object.entries(THEME_TOKENS[next]).forEach(([name, value]) => {
    document.documentElement.style.setProperty(name, value);
  });
  const toggle = document.querySelector('#theme-toggle');
  const label = document.querySelector('#theme-label');
  if (toggle){
    toggle.setAttribute('aria-pressed', String(next === 'dark'));
    toggle.setAttribute('aria-label', next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
  if (label) label.textContent = next === 'dark' ? 'Light' : 'Dark';
}

export function setTheme(theme){
  applyTheme(theme);
  try { localStorage.setItem(THEME_KEY, theme); }
  catch { /* Theme persistence is optional. */ }
}

export function initTheme(){
  applyTheme(preferredTheme());
}

export function initThemeToggle(){
  initTheme();
  document.querySelector('#theme-toggle')?.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
  });
}

initTheme();
