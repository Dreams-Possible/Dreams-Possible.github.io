const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

export function initScrollJourney() {
  const hero = document.getElementById('hero');
  const titleLines = hero?.querySelectorAll('.hero-title > span');
  const title = hero?.querySelector('.hero-title');
  const heroCopy = hero?.querySelector('.hero-copy');
  const heroStage = hero?.querySelector('.hero-stage');
  const settledSlot = document.querySelector('.settled-title-slot');
  const narrowScreen = matchMedia('(max-width: 760px)');
  if (!hero || !heroStage || !title || !settledSlot || titleLines?.length !== 2)
    return;
  let scheduled = false;
  let journeyGeometry = null;
  const resetTitle = () => {
    document.body.classList.remove('title-settled');
    title.removeAttribute('aria-hidden');
    settledSlot.setAttribute('aria-hidden', 'true');
  };
  const measureJourney = () => {
    if (
      root.dataset.narrative === 'off' ||
      reducedMotion.matches ||
      narrowScreen.matches
    )
      return;
    const available = Math.max(1, hero.offsetHeight - heroStage.offsetHeight);
    const baseTop = heroCopy.offsetTop + title.offsetTop;
    const landingScroll = hero.offsetTop + available * 0.62;
    const lineHeight =
      parseFloat(getComputedStyle(titleLines[0]).lineHeight) ||
      titleLines[0].offsetHeight;
    const scale =
      new DOMMatrixReadOnly(getComputedStyle(title).transform).a || 1;
    const range = document.createRange();
    range.selectNodeContents(titleLines[0]);
    const joinX =
      range.getBoundingClientRect().width / scale +
      Math.max(24, parseFloat(getComputedStyle(titleLines[0]).fontSize) * 0.35);
    document.body.style.setProperty(
      '--settled-title-height',
      `${lineHeight * 0.8}px`
    );
    document.body.style.setProperty('--title-line-two-x', `${joinX}px`);
    document.body.style.setProperty('--title-line-two-y', `${-lineHeight}px`);
    const settledTop = settledSlot.getBoundingClientRect().top + window.scrollY;
    journeyGeometry = {
      available,
      landingY: settledTop - landingScroll - baseTop,
      joinX,
      lineHeight
    };
  };
  const update = () => {
    scheduled = false;
    if (
      root.dataset.narrative === 'off' ||
      reducedMotion.matches ||
      narrowScreen.matches
    ) {
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
    const titleProgress = Math.min(progress / 0.62, 1);
    document.body.style.setProperty('--journey', progress.toFixed(4));
    document.body.style.setProperty(
      '--title-journey',
      titleProgress.toFixed(4)
    );
    hero.classList.toggle('hero-scrolled', progress > 0.62);
    const settled = progress >= 0.62;
    document.body.classList.toggle('title-settled', settled);
    title.setAttribute('aria-hidden', String(settled));
    settledSlot.setAttribute('aria-hidden', String(!settled));
    const landingProgress = Math.min(Math.max((progress - 0.28) / 0.34, 0), 1);
    document.body.style.setProperty(
      '--title-journey-y',
      `${geometry.landingY * landingProgress}px`
    );
    document.body.style.setProperty('--support-copy-y', `${-travelled}px`);
    document.body.style.setProperty(
      '--title-line-two-x',
      `${geometry.joinX * titleProgress}px`
    );
    document.body.style.setProperty(
      '--title-line-two-y',
      `${-geometry.lineHeight * titleProgress}px`
    );
  };
  const requestUpdate = () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(update);
    }
  };
  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('mathrix-localechange', () => {
    measureJourney();
    requestUpdate();
  });
  addEventListener('resize', () => {
    measureJourney();
    requestUpdate();
  });
  addEventListener('mathrix-motionchange', () => {
    measureJourney();
    requestUpdate();
  });
  reducedMotion.addEventListener('change', () => {
    measureJourney();
    requestUpdate();
  });
  document.fonts?.ready.then(() => {
    measureJourney();
    requestUpdate();
  });
  measureJourney();
  requestUpdate();
}
