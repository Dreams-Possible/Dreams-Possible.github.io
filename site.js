(function () {
  'use strict';
  const projects = Array.isArray(window.MATHRIX_PROJECTS) ? window.MATHRIX_PROJECTS : [];
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content != null) node.textContent = content;
    return node;
  }
  function projectCard(project, compact) {
    const article = element('article', compact ? 'project-row' : 'project-card');
    const top = element('div', 'project-top');
    top.append(element('span', 'project-category', project.category), element('time', 'project-date', project.date));
    top.lastChild.dateTime = project.date;
    const title = element('h3', 'project-title', project.name);
    const description = element('p', 'project-description', project.description);
    const link = element('a', 'project-link', '查看仓库 ↗');
    link.href = project.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `查看 ${project.name} 的 GitHub 仓库`);
    article.append(top, title, description, link);
    return article;
  }
  function shuffledFour(previous) {
    const copy = projects.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    if (previous && copy.length > 4 && copy.slice(0, 4).every(p => previous.includes(p.name))) {
      const replacement = copy.find(p => !previous.includes(p.name));
      if (replacement) copy[0] = replacement;
    }
    return copy.slice(0, 4);
  }
  if (document.body.dataset.page === 'home') {
    const container = document.getElementById('featured-projects');
    const count = document.getElementById('project-count');
    if (count) count.textContent = projects.length;
    let previous = [];
    function renderFeatured() {
      const selected = shuffledFour(previous);
      previous = selected.map(p => p.name);
      container.replaceChildren(...selected.map(p => projectCard(p, false)));
    }
    if (container) renderFeatured();
    document.getElementById('shuffle')?.addEventListener('click', renderFeatured);
  }
  if (document.body.dataset.page === 'projects') {
    const list = document.getElementById('project-list');
    const search = document.getElementById('project-search');
    const buttons = [...document.querySelectorAll('[data-view]')];
    const sorted = projects.slice().sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));
    document.getElementById('catalog-count').textContent = projects.length;
    document.getElementById('catalog-updated').textContent = sorted.length ? `最近更新 ${sorted[0].date}` : '暂无项目';
    let view = 'timeline';
    function renderCatalog() {
      const term = search.value.trim().toLocaleLowerCase();
      const visible = sorted.filter(p => `${p.name} ${p.description} ${p.category}`.toLocaleLowerCase().includes(term));
      const groups = new Map();
      for (const project of visible) {
        const key = view === 'timeline' ? project.date.slice(0, 4) : project.category;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(project);
      }
      list.replaceChildren();
      if (!visible.length) {
        list.append(element('p', 'empty-state', '没有找到匹配的项目。试试其他关键词。'));
        return;
      }
      for (const [label, items] of groups) {
        const section = element('section', 'catalog-group');
        const heading = element('h2', 'group-heading', label);
        heading.id = `group-${label.replace(/[^\w\u4e00-\u9fff]/g, '-')}`;
        section.setAttribute('aria-labelledby', heading.id);
        const grid = element('div', 'catalog-grid');
        grid.append(...items.map(p => projectCard(p, true)));
        section.append(heading, grid);
        list.append(section);
      }
    }
    buttons.forEach(button => button.addEventListener('click', () => {
      view = button.dataset.view;
      buttons.forEach(item => {
        item.classList.toggle('selected', item === button);
        item.setAttribute('aria-pressed', String(item === button));
      });
      renderCatalog();
    }));
    search.addEventListener('input', renderCatalog);
    renderCatalog();
  }
})();
