import '../../data/i18n.js';
import { savePreference } from './preferences.js';

const messages = window.MATHRIX_I18N || {};
const root = document.documentElement;
let locale = root.lang === 'en' ? 'en' : 'zh';

export function message(key) {
  return messages[locale]?.[key] || messages.zh?.[key] || key;
}
export function getLocale() {
  return locale;
}

export function formatDate(date) {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(year, month - 1, day));
}

export function initLocale(renderPage) {
  function updateText() {
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = message(element.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((element) => {
      element.setAttribute('aria-label', message(element.dataset.i18nAria));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
      element.placeholder = message(element.dataset.i18nPlaceholder);
    });
    const home = document.body.dataset.page === 'home';
    document.title = home
      ? message('homePageTitle')
      : message('catalogPageTitle');
    const description = document.querySelector('meta[name="description"]');
    if (description)
      description.content = home ? message('homeMeta') : message('catalogMeta');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = document.title;
    const ogDescription = document.querySelector(
      'meta[property="og:description"]'
    );
    if (ogDescription)
      ogDescription.content = home
        ? message('homeMeta')
        : message('catalogMeta');
    const languageControl = document.getElementById('language-select');
    if (languageControl) languageControl.value = locale;
    renderPage();
  }
  function setLocale(value, persist) {
    locale = value === 'en' ? 'en' : 'zh';
    root.lang = locale === 'en' ? 'en' : 'zh-CN';
    if (persist) savePreference('mathrix-language', locale);
    updateText();
    window.dispatchEvent(new Event('mathrix-localechange'));
  }

  setLocale(locale, false);
  delete root.dataset.languagePending;
  document
    .getElementById('language-select')
    ?.addEventListener('change', (event) =>
      setLocale(event.target.value, true)
    );
}
