import { message, formatDate } from '../i18n.js';
import { node, projectCard } from '../project-card.js';

export function initProjects(projects) {
  let currentView = 'timeline';
  function renderCatalog() {
    const container = document.getElementById('project-list');
    if (!container) return;
    const search = document.getElementById('project-search');
    const term = (search?.value || '').trim().toLocaleLowerCase();
    const sorted = projects
      .slice()
      .sort(
        (a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name)
      );
    const visible = sorted.filter((project) => {
      const category =
        message('categories')[project.category] || project.category;
      return [
        project.name,
        project.description?.zh,
        project.description?.en,
        category
      ]
        .join(' ')
        .toLocaleLowerCase()
        .includes(term);
    });
    const count = document.getElementById('catalog-count');
    const updated = document.getElementById('catalog-updated');
    const status = document.getElementById('catalog-status');
    if (count) count.textContent = String(projects.length);
    if (updated)
      updated.textContent = sorted.length
        ? `${message('latest')} ${formatDate(sorted[0].date)}`
        : '';
    if (status)
      status.textContent = message('results').replace(
        '{count}',
        String(visible.length)
      );
    container.replaceChildren();
    if (!visible.length) {
      container.append(node('p', 'empty-state', message('empty')));
      return;
    }
    const groups = new Map();
    for (const project of visible) {
      const key =
        currentView === 'timeline'
          ? project.date.slice(0, 4)
          : project.category;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(project);
    }
    for (const [key, items] of groups) {
      const section = node('section', 'catalog-group');
      const heading = node(
        'h2',
        'group-heading',
        currentView === 'timeline' ? key : message('categories')[key]
      );
      const grid = node('div', 'catalog-grid');
      grid.append(...items.map((project) => projectCard(project, true)));
      section.append(heading, grid);
      container.append(section);
    }
  }
  document
    .getElementById('project-search')
    ?.addEventListener('input', renderCatalog);
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      currentView = button.dataset.view;
      document.querySelectorAll('[data-view]').forEach((item) => {
        item.setAttribute('aria-pressed', String(item === button));
      });
      renderCatalog();
    });
  });

  return renderCatalog;
}
