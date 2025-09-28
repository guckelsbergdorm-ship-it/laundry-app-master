export type Theme = 'light' | 'dark';

export function setTheme(theme: Theme) {
  localStorage.setItem('theme', theme);
}

export function getTheme(): Theme {
  return localStorage.getItem('theme') as Theme || 'light';
}

export function applyCurrentTheme() {
  const theme = getTheme();
  document.documentElement.setAttribute('theme', theme);
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'light' ? '#ffffff' : '#141914');
  }
}

export function toggleTheme() {
  const current = getTheme();
  const next = current === 'light' ? 'dark' : 'light';
  setTheme(next);
  applyCurrentTheme();
}
