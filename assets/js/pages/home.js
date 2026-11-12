import { message } from '../i18n.js';
import { projectCard } from '../project-card.js';

export function initHome(projects) {
  let currentFeatured = [];
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
    } while (
      attempts < 4 &&
      selected.every((project) => currentFeatured.includes(project.name))
    );
    currentFeatured = selected.map((project) => project.name);
    return selected;
  }
  let featuredProjects = [];
  function renderFeatured(shuffle) {
    const container = document.getElementById('featured-projects');
    if (!container) return;
    if (shuffle || !featuredProjects.length)
      featuredProjects = chooseFeatured();
    container.replaceChildren(
      ...featuredProjects.map((project) => projectCard(project, false))
    );
    const count = document.getElementById('project-count');
    if (count) count.textContent = String(projects.length);
    if (shuffle) {
      const status = document.getElementById('shuffle-status');
      if (status) status.textContent = message('shuffleStatus');
    }
  }

  document
    .getElementById('shuffle')
    ?.addEventListener('click', () => renderFeatured(true));
  return () => renderFeatured(false);
}
