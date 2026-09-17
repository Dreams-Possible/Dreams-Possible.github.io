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
  function setupMotion() {
    const hero = document.getElementById('hero');
    if (!hero) return;
    document.body.classList.add('motion-ready');
    const stage = hero.querySelector('.hero-stage');
    const sourceLines = [...hero.querySelectorAll('.hero-title > span')];
    const titleLines = [...document.querySelectorAll('.journey-title > span')];
    const discovery = document.querySelector('.discovery');
    const desktop = matchMedia('(min-width: 761px)');
    let frame = 0;
    let linePaths = [];
    let settleTimer = 0;
    let journeyFrame = 0;
    let animatingJourney = false;
    let wheelIntent = 0;
    let wheelDirection = 0;
    let lastWheelAt = 0;
    const clamp = value => Math.min(1, Math.max(0, value));
    const smooth = (from, to, value) => {
      const t = clamp((value - from) / (to - from));
      return t * t * (3 - 2 * t);
    };
    function measure() {
      titleLines.forEach(line => { line.style.transform = 'none'; });
      const stageTop = stage.getBoundingClientRect().top;
      const startTop = document.querySelector('.site-header').offsetHeight;
      linePaths = titleLines.map((line, index) => {
        const source = sourceLines[index].getBoundingClientRect();
        const target = line.getBoundingClientRect();
        return {
          startX: source.left,
          startY: source.top - stageTop + startTop,
          endX: target.left,
          endY: target.top + window.scrollY
        };
      });
      schedule();
    }
    function update() {
      frame = 0;
      if (reducedMotion.matches || !desktop.matches) {
        titleLines.forEach(line => { line.style.transform = 'none'; });
        document.body.style.setProperty('--scene-x', '0px');
        document.body.style.setProperty('--scene-y', `${(window.innerHeight * .06).toFixed(1)}px`);
        document.body.style.setProperty('--scene-zoom', '1.32');
        document.body.style.setProperty('--copy-opacity', '1');
        document.body.style.setProperty('--hint-opacity', '1');
        document.body.style.setProperty('--scroll-shift', '0px');
        hero.classList.remove('hero-scrolled');
        return;
      }
      const end = Math.max(linePaths[0].endY - window.innerHeight * .27, 1);
      const progress = clamp(window.scrollY / end);
      const morph = smooth(0, 1, progress);
      const join = smooth(.02, .45, progress);
      titleLines.forEach((line, index) => {
        const path = linePaths[index];
        if (!path) return;
        const x = (path.startX - path.endX) * (1 - (index ? join : morph));
        const y = (path.startY - (path.endY - window.scrollY)) * (1 - morph);
        line.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      });
      document.body.style.setProperty('--journey', progress.toFixed(3));
      document.body.style.setProperty('--scene-x', `${(-window.innerWidth * .09 * smooth(0, 1, progress)).toFixed(1)}px`);
      document.body.style.setProperty('--scene-y', `${(window.innerHeight * (.06 + .01 * smooth(0, 1, progress))).toFixed(1)}px`);
      document.body.style.setProperty('--scene-zoom', (1.32 + .23 * smooth(0, 1, progress)).toFixed(3));
      document.body.style.setProperty('--copy-opacity', (1 - smooth(.03, .32, progress)).toFixed(3));
      document.body.style.setProperty('--hint-opacity', (1 - smooth(0, .28, progress)).toFixed(3));
      document.body.style.setProperty('--scroll-shift', `${(110 * smooth(0, .6, progress)).toFixed(1)}px`);
      hero.classList.toggle('hero-scrolled', progress > .65);
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    function sectionTop() {
      return Math.round(discovery.getBoundingClientRect().top + window.scrollY);
    }
    function snapTo(bottom) {
      clearTimeout(settleTimer);
      cancelAnimationFrame(journeyFrame);
      const start = window.scrollY;
      const target = bottom ? sectionTop() : 0;
      if (reducedMotion.matches || Math.abs(target - start) < 2) {
        animatingJourney = false;
        window.scrollTo({top: target, behavior: 'instant'});
        return;
      }
      animatingJourney = true;
      const duration = 1450;
      let startedAt = 0;
      function step(time) {
        if (!startedAt) startedAt = time;
        const progress = Math.min(1, (time - startedAt) / duration);
        const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
        window.scrollTo({top: start + (target - start) * eased, behavior: 'instant'});
        if (progress < 1) journeyFrame = requestAnimationFrame(step);
        else { journeyFrame = 0; animatingJourney = false; }
      }
      journeyFrame = requestAnimationFrame(step);
    }
    function settle() {
      clearTimeout(settleTimer);
      if (!desktop.matches || animatingJourney) return;
      settleTimer = setTimeout(() => {
        const end = sectionTop();
        if (window.scrollY > 45 && window.scrollY < end - 45) snapTo(window.scrollY >= end * .42);
      }, 240);
    }
    window.addEventListener('wheel', event => {
      if (!desktop.matches || event.ctrlKey || event.target.closest('.atmosphere-tuner')) return;
      const end = sectionTop();
      const inJourney = window.scrollY < end - 35;
      if (animatingJourney) { event.preventDefault(); return; }
      if ((event.deltaY > 0 && inJourney) || (event.deltaY < 0 && window.scrollY > 20 && window.scrollY <= end + 35)) {
        event.preventDefault();
        const now = performance.now();
        const direction = Math.sign(event.deltaY);
        if (direction !== wheelDirection || now - lastWheelAt > 500) wheelIntent = 0;
        wheelDirection = direction;
        lastWheelAt = now;
        const amount = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? window.innerHeight : 1;
        wheelIntent += Math.abs(event.deltaY * amount);
        if (wheelIntent >= 140) { wheelIntent = 0; snapTo(direction > 0); }
      }
    }, {passive: false});
    window.addEventListener('keydown', event => {
      if (!desktop.matches || event.altKey || event.ctrlKey || event.metaKey ||
          event.target.closest('input, select, textarea, [contenteditable]')) return;
      const end = sectionTop();
      if (event.key === 'ArrowDown' && window.scrollY < end - 35) {
        event.preventDefault(); snapTo(true);
      } else if (event.key === 'ArrowUp' && window.scrollY > 20 && window.scrollY <= end + 35) {
        event.preventDefault(); snapTo(false);
      }
    });
    window.addEventListener('scroll', () => { schedule(); settle(); }, {passive: true});
    window.addEventListener('resize', measure);
    reducedMotion.addEventListener('change', measure);
    desktop.addEventListener('change', measure);
    measure();
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
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('page-hidden', document.hidden);
  });
})();
