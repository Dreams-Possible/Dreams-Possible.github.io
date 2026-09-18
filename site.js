(function () {
  'use strict';

  const projects = Array.isArray(window.MATHRIX_PROJECTS) ? window.MATHRIX_PROJECTS : [];
  const messages = window.MATHRIX_I18N || {};
  const root = document.documentElement;
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let locale = root.lang === 'en' ? 'en' : 'zh';
  let themeMode = root.dataset.themeMode || 'auto';
  let currentView = 'timeline';
  let currentFeatured = [];

  function message(key) { return messages[locale]?.[key] || messages.zh?.[key] || key; }
  function savePreference(key, value) {
    try { localStorage.setItem(key, value); } catch (_) { /* Keep this session usable without storage. */ }
  }
  function setTheme(mode, persist) {
    themeMode = ['auto', 'light', 'dark'].includes(mode) ? mode : 'auto';
    root.dataset.themeMode = themeMode;
    root.dataset.theme = themeMode === 'auto' ? (systemTheme.matches ? 'dark' : 'light') : themeMode;
    const control = document.getElementById('theme-select');
    if (control) control.value = themeMode;
    if (persist) savePreference('mathrix-theme', themeMode);
  }
  function formatDate(date) {
    const [year, month, day] = date.split('-').map(Number);
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'zh-CN', {
      year: 'numeric', month: 'short', day: 'numeric'
    }).format(new Date(year, month - 1, day));
  }
  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function projectCard(project, compact) {
    const link = node('a', compact ? 'project-card project-card-compact glass-surface' : 'project-card glass-surface');
    link.href = project.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', message('repoAria').replace('{name}', project.name));
    const top = node('span', 'project-meta');
    const category = node('span', 'project-category', message('categories')[project.category] || project.category);
    const time = node('time', 'project-date', formatDate(project.date));
    time.dateTime = project.date;
    top.append(category, time);
    const title = node('strong', 'project-name', project.name);
    const description = node('span', 'project-description', project.description?.[locale] || project.description?.zh || '');
    const action = node('span', 'project-card-action', message('repoAction'));
    action.append(node('span', 'project-card-arrow', '↗'));
    link.append(top, title, description, action);
    return link;
  }
  function chooseFeatured() {
    if (projects.length <= 6) return projects.slice();
    let selected;
    let attempts = 0;
    do {
      const copy = projects.slice();
      for (let index = copy.length - 1; index > 0; index--) {
        const random = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[random]] = [copy[random], copy[index]];
      }
      selected = copy.slice(0, 6);
      attempts++;
    } while (attempts < 4 && selected.every(project => currentFeatured.includes(project.name)));
    currentFeatured = selected.map(project => project.name);
    return selected;
  }
  let featuredProjects = [];
  function renderFeatured(shuffle) {
    const container = document.getElementById('featured-projects');
    if (!container) return;
    if (shuffle || !featuredProjects.length) featuredProjects = chooseFeatured();
    container.replaceChildren(...featuredProjects.map(project => projectCard(project, false)));
    const count = document.getElementById('project-count');
    if (count) count.textContent = String(projects.length);
    if (shuffle) {
      const status = document.getElementById('shuffle-status');
      if (status) status.textContent = message('shuffleStatus');
    }
  }
  function renderCatalog() {
    const container = document.getElementById('project-list');
    if (!container) return;
    const search = document.getElementById('project-search');
    const term = (search?.value || '').trim().toLocaleLowerCase();
    const sorted = projects.slice().sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));
    const visible = sorted.filter(project => {
      const category = message('categories')[project.category] || project.category;
      return [project.name, project.description?.zh, project.description?.en, category]
        .join(' ').toLocaleLowerCase().includes(term);
    });
    const count = document.getElementById('catalog-count');
    const updated = document.getElementById('catalog-updated');
    const status = document.getElementById('catalog-status');
    if (count) count.textContent = String(projects.length);
    if (updated) updated.textContent = sorted.length ? `${message('latest')} ${formatDate(sorted[0].date)}` : '';
    if (status) status.textContent = message('results').replace('{count}', String(visible.length));
    container.replaceChildren();
    if (!visible.length) {
      container.append(node('p', 'empty-state', message('empty')));
      return;
    }
    const groups = new Map();
    for (const project of visible) {
      const key = currentView === 'timeline' ? project.date.slice(0, 4) : project.category;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(project);
    }
    for (const [key, items] of groups) {
      const section = node('section', 'catalog-group');
      const heading = node('h2', 'group-heading', currentView === 'timeline' ? key : message('categories')[key]);
      const grid = node('div', 'catalog-grid');
      grid.append(...items.map(project => projectCard(project, true)));
      section.append(heading, grid);
      container.append(section);
    }
  }
  function updateText() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      element.textContent = message(element.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(element => {
      element.setAttribute('aria-label', message(element.dataset.i18nAria));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      element.placeholder = message(element.dataset.i18nPlaceholder);
    });
    const home = document.body.dataset.page === 'home';
    document.title = home ? message('homePageTitle') : message('catalogPageTitle');
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = home ? message('homeMeta') : message('catalogMeta');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = document.title;
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.content = home ? message('homeMeta') : message('catalogMeta');
    const languageControl = document.getElementById('language-select');
    if (languageControl) languageControl.value = locale;
    renderFeatured(false);
    renderCatalog();
  }
  function setLocale(value, persist) {
    locale = value === 'en' ? 'en' : 'zh';
    root.lang = locale === 'en' ? 'en' : 'zh-CN';
    if (persist) savePreference('mathrix-language', locale);
    updateText();
    window.dispatchEvent(new Event('resize'));
  }

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
  setTheme(themeMode, false);
  setLocale(locale, false);
  delete root.dataset.languagePending;
  document.getElementById('language-select')?.addEventListener('change', event => setLocale(event.target.value, true));
  document.getElementById('theme-select')?.addEventListener('change', event => setTheme(event.target.value, true));
  systemTheme.addEventListener('change', () => { if (themeMode === 'auto') setTheme('auto', false); });
  document.getElementById('shuffle')?.addEventListener('click', () => renderFeatured(true));
  document.getElementById('project-search')?.addEventListener('input', renderCatalog);
  document.querySelectorAll('[data-view]').forEach(button => {
    button.addEventListener('click', () => {
      currentView = button.dataset.view;
      document.querySelectorAll('[data-view]').forEach(item => {
        item.setAttribute('aria-pressed', String(item === button));
      });
      renderCatalog();
    });
  });
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('page-hidden', document.hidden);
  });

  // Read the document's position without changing it: scrolling stays fully
  // under the visitor's control while the opening scene follows along.
  function setupHomeScrollJourney() {
    const hero = document.getElementById('hero');
    const titleLines = hero?.querySelectorAll('.hero-title > span');
    const title = hero?.querySelector('.hero-title');
    const heroCopy = hero?.querySelector('.hero-copy');
    const heroStage = hero?.querySelector('.hero-stage');
    const settledSlot = document.querySelector('.settled-title-slot');
    const narrowScreen = matchMedia('(max-width: 760px)');
    if (!hero || !heroStage || !title || !settledSlot || titleLines?.length !== 2) return;
    let scheduled = false;
    let journeyGeometry = null;
    const resetTitle = () => {
      document.body.classList.remove('title-settled');
      title.removeAttribute('aria-hidden');
      settledSlot.setAttribute('aria-hidden', 'true');
    };
    const measureJourney = () => {
      if (root.dataset.narrative === 'off' || reducedMotion.matches || narrowScreen.matches) return;
      const available = Math.max(1, hero.offsetHeight - heroStage.offsetHeight);
      const baseTop = heroCopy.offsetTop + title.offsetTop;
      const landingScroll = hero.offsetTop + available * .62;
      const lineHeight = parseFloat(getComputedStyle(titleLines[0]).lineHeight) || titleLines[0].offsetHeight;
      const scale = new DOMMatrixReadOnly(getComputedStyle(title).transform).a || 1;
      const range = document.createRange();
      range.selectNodeContents(titleLines[0]);
      const joinX = range.getBoundingClientRect().width / scale + Math.max(24, parseFloat(getComputedStyle(titleLines[0]).fontSize) * .35);
      document.body.style.setProperty('--settled-title-height', `${lineHeight * .8}px`);
      document.body.style.setProperty('--title-line-two-x', `${joinX}px`);
      document.body.style.setProperty('--title-line-two-y', `${-lineHeight}px`);
      const settledTop = settledSlot.getBoundingClientRect().top + window.scrollY;
      journeyGeometry = {available, landingY: settledTop - landingScroll - baseTop, joinX, lineHeight};
    };
    const update = () => {
      scheduled = false;
      if (root.dataset.narrative === 'off' || reducedMotion.matches || narrowScreen.matches) {
        resetTitle();
        document.body.style.setProperty('--journey', '0');
        document.body.style.setProperty('--title-journey', '0');
        document.body.style.setProperty('--title-journey-y', '0px');
        document.body.style.setProperty('--support-copy-y', '0px');
        document.body.style.setProperty('--title-line-two-x', '0px');
        document.body.style.setProperty('--title-line-two-y', '0px');
        hero.classList.remove('hero-scrolled');
        return;
      }
      const geometry = journeyGeometry || (measureJourney(), journeyGeometry);
      const rawTravelled = Math.max(window.scrollY - hero.offsetTop, 0);
      const travelled = Math.min(rawTravelled, geometry.available);
      const progress = travelled / geometry.available;
      const titleProgress = Math.min(progress / .62, 1);
      document.body.style.setProperty('--journey', progress.toFixed(4));
      document.body.style.setProperty('--title-journey', titleProgress.toFixed(4));
      hero.classList.toggle('hero-scrolled', progress > .62);
      const settled = progress >= .62;
      document.body.classList.toggle('title-settled', settled);
      title.setAttribute('aria-hidden', String(settled));
      settledSlot.setAttribute('aria-hidden', String(!settled));
      const landingProgress = Math.min(Math.max((progress - .28) / .34, 0), 1);
      document.body.style.setProperty('--title-journey-y', `${geometry.landingY * landingProgress}px`);
      document.body.style.setProperty('--support-copy-y', `${-travelled}px`);
      document.body.style.setProperty('--title-line-two-x', `${geometry.joinX * titleProgress}px`);
      document.body.style.setProperty('--title-line-two-y', `${-geometry.lineHeight * titleProgress}px`);
    };
    const requestUpdate = () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(update);
      }
    };
    addEventListener('scroll', requestUpdate, { passive: true });
    addEventListener('resize', () => {
      measureJourney();
      requestUpdate();
    });
    addEventListener('mathrix-motionchange', () => {
      measureJourney();
      requestUpdate();
    });
    reducedMotion.addEventListener('change', () => { measureJourney(); requestUpdate(); });
    document.fonts?.ready.then(() => { measureJourney(); requestUpdate(); });
    measureJourney();
    requestUpdate();
  }
  setupHomeScrollJourney();
})();
