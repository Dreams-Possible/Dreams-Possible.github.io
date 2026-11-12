export function savePreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (_) {
    /* Storage is optional. */
  }
}

export function initTheme() {
  const root = document.documentElement;
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  let themeMode = root.dataset.themeMode || 'auto';
  function setTheme(mode, persist) {
    themeMode = ['auto', 'light', 'dark'].includes(mode) ? mode : 'auto';
    root.dataset.themeMode = themeMode;
    root.dataset.theme =
      themeMode === 'auto'
        ? systemTheme.matches
          ? 'dark'
          : 'light'
        : themeMode;
    const control = document.getElementById('theme-select');
    if (control) control.value = themeMode;
    if (persist) savePreference('mathrix-theme', themeMode);
  }

  setTheme(themeMode, false);
  document
    .getElementById('theme-select')
    ?.addEventListener('change', (event) => setTheme(event.target.value, true));
  systemTheme.addEventListener('change', () => {
    if (themeMode === 'auto') setTheme('auto', false);
  });
}
