(function () {
  'use strict';

  const projects = Array.isArray(window.MATHRIX_PROJECTS) ? window.MATHRIX_PROJECTS : [];
  const messages = window.MATHRIX_I18N || {};
  const root = document.documentElement;
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
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
    const link = node('a', compact ? 'project-card project-card-compact' : 'project-card');
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
    if (!compact && finePointer.matches && !reducedMotion.matches) enableCardTilt(link);
    return link;
  }
  function enableCardTilt(card) {
    let frame = 0;
    let x = 0;
    let y = 0;
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      x = ((event.clientX - rect.left) / rect.width - .5) * 5;
      y = ((event.clientY - rect.top) / rect.height - .5) * -5;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        card.style.setProperty('--tilt-x', `${y.toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${x.toFixed(2)}deg`);
        card.style.setProperty('--pointer-x', `${((x / 5) + .5) * 100}%`);
        card.style.setProperty('--pointer-y', `${((y / -5) + .5) * 100}%`);
        frame = 0;
      });
    });
    card.addEventListener('pointerleave', () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
      card.style.removeProperty('--pointer-x');
      card.style.removeProperty('--pointer-y');
    });
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
  }
  function setupMotion() {
    const hero = document.getElementById('hero');
    if (!hero) return;
    let frame = 0;
    let inView = true;
    function update() {
      frame = 0;
      if (reducedMotion.matches) {
        hero.style.setProperty('--scroll-progress', '0');
        hero.style.setProperty('--scroll-shift', '0px');
        hero.style.setProperty('--scene-scale', '1');
        hero.classList.remove('motion-active');
        return;
      }
      const rect = hero.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(rect.height * .72, 1)));
      hero.style.setProperty('--scroll-progress', progress.toFixed(3));
      hero.style.setProperty('--scroll-shift', `${(-progress * 62).toFixed(1)}px`);
      hero.style.setProperty('--scene-scale', (1 + progress * .16).toFixed(3));
      hero.classList.toggle('motion-active', inView && !document.hidden);
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    const observer = new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      schedule();
    });
    observer.observe(hero);
    window.addEventListener('scroll', schedule, {passive: true});
    document.addEventListener('visibilitychange', schedule);
    reducedMotion.addEventListener('change', schedule);
    schedule();
  }

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
  setTheme(themeMode, false);
  setLocale(locale, false);
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
  setupMotion();
})();
