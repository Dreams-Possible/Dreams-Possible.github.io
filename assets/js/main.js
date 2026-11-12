import '../../data/projects.js';
import { initTheme } from './preferences.js';
import { initLocale } from './i18n.js';
import { initHome } from './pages/home.js';
import { initProjects } from './pages/projects.js';
import { initAtmosphereSettings } from './effects/settings.js';
import { initWeather } from './effects/weather.js';
import { initPointerLight } from './effects/pointer-light.js';
import { initScrollJourney } from './effects/scroll-journey.js';

const projects = Array.isArray(window.MATHRIX_PROJECTS)
  ? window.MATHRIX_PROJECTS
  : [];
const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());

initTheme();
const renderPage =
  document.body.dataset.page === 'home'
    ? initHome(projects)
    : initProjects(projects);
initLocale(renderPage);

const settings = initAtmosphereSettings();
initWeather(settings);
initPointerLight();
if (document.body.dataset.page === 'home') initScrollJourney();

document.addEventListener('visibilitychange', () => {
  document.body.classList.toggle('page-hidden', document.hidden);
});
