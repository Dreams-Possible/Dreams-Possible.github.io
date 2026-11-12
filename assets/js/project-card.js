import { message, formatDate, getLocale } from './i18n.js';

export function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function projectCard(project, compact) {
  const link = node(
    'a',
    compact
      ? 'project-card project-card-compact glass-surface'
      : 'project-card glass-surface'
  );
  link.href = project.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute(
    'aria-label',
    message('repoAria').replace('{name}', project.name)
  );
  const top = node('span', 'project-meta');
  const category = node(
    'span',
    'project-category',
    message('categories')[project.category] || project.category
  );
  const time = node('time', 'project-date', formatDate(project.date));
  time.dateTime = project.date;
  top.append(category, time);
  const title = node('strong', 'project-name', project.name);
  const description = node(
    'span',
    'project-description',
    project.description?.[getLocale()] || project.description?.zh || ''
  );
  const action = node('span', 'project-card-action', message('repoAction'));
  action.append(node('span', 'project-card-arrow', '↗'));
  link.append(top, title, description, action);
  return link;
}
