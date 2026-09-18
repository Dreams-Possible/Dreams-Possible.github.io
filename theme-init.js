// Apply the saved or system preferences before CSS paints the page.
(function () {
  const root = document.documentElement;
  let themeMode = 'auto';
  let language = '';
  const featureKeys = {fog: 'fog', 'rain-enabled': 'rain', 'meteors-enabled': 'meteors', pointer: 'pointer', 'scene-motion': 'sceneMotion', narrative: 'narrative'};
  try {
    themeMode = localStorage.getItem('mathrix-theme') || 'auto';
    language = localStorage.getItem('mathrix-language') || '';
  } catch (_) { /* Storage can be disabled; system defaults remain usable. */ }
  if (!['auto', 'light', 'dark'].includes(themeMode)) themeMode = 'auto';
  if (!['zh', 'en'].includes(language)) language = 'en';
  // The HTML fallback is Chinese. Keep it out of view until English text is ready.
  if (language === 'en') {
    root.dataset.languagePending = 'true';
    setTimeout(() => { delete root.dataset.languagePending; }, 4000);
  }
  root.dataset.themeMode = themeMode;
  root.dataset.theme = themeMode === 'auto'
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : themeMode;
  Object.entries(featureKeys).forEach(([key, dataKey]) => {
    let value = 'on';
    try { value = localStorage.getItem(`mathrix-${key}`) === 'off' ? 'off' : 'on'; } catch (_) { /* Defaults stay on. */ }
    root.dataset[dataKey] = value;
  });
  root.lang = language === 'en' ? 'en' : 'zh-CN';
})();
