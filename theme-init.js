// Apply the saved or system preferences before CSS paints the page.
(function () {
  const root = document.documentElement;
  let themeMode = 'auto';
  let language = '';
  try {
    themeMode = localStorage.getItem('mathrix-theme') || 'auto';
    language = localStorage.getItem('mathrix-language') || '';
  } catch (_) { /* Storage can be disabled; system defaults remain usable. */ }
  if (!['auto', 'light', 'dark'].includes(themeMode)) themeMode = 'auto';
  if (!['zh', 'en'].includes(language)) language = navigator.language.toLowerCase().startsWith('en') ? 'en' : 'zh';
  root.dataset.themeMode = themeMode;
  root.dataset.theme = themeMode === 'auto'
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : themeMode;
  root.lang = language === 'en' ? 'en' : 'zh-CN';
})();
