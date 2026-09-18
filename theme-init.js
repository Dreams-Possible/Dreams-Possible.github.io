// Apply the saved or system preferences before CSS paints the page.
(function () {
  const root = document.documentElement;
  let themeMode = 'auto';
  let language = '';
  const featureKeys = ['fog', 'rain-enabled', 'meteors-enabled', 'pointer', 'narrative'];
  try {
    themeMode = localStorage.getItem('mathrix-theme') || 'auto';
    language = localStorage.getItem('mathrix-language') || '';
  } catch (_) { /* Storage can be disabled; system defaults remain usable. */ }
  if (!['auto', 'light', 'dark'].includes(themeMode)) themeMode = 'auto';
  if (!['zh', 'en'].includes(language)) language = 'en';
  root.dataset.themeMode = themeMode;
  root.dataset.theme = themeMode === 'auto'
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : themeMode;
  featureKeys.forEach(key => {
    let value = 'on';
    try { value = localStorage.getItem(`mathrix-${key}`) === 'off' ? 'off' : 'on'; } catch (_) { /* Defaults stay on. */ }
    root.dataset[key.replace('-enabled', '')] = value;
  });
  root.lang = language === 'en' ? 'en' : 'zh-CN';
})();
