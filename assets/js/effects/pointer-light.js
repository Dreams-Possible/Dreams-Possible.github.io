export function initPointerLight() {
  const root = document.documentElement;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lightRadius = 230;
  let pointer = null;
  let lightFrame = 0;
  function prepareGlass(root = document) {
    const surfaces = root.matches?.('.glass-surface')
      ? [root]
      : root.querySelectorAll?.('.glass-surface') || [];
    for (const surface of surfaces) {
      if (surface.querySelector(':scope > .glass-light')) continue;
      const light = document.createElement('span');
      light.className = 'glass-light';
      light.setAttribute('aria-hidden', 'true');
      surface.prepend(light);
    }
  }
  function updateGlass() {
    lightFrame = 0;
    if (root.dataset.pointer === 'off') pointer = null;
    for (const surface of document.querySelectorAll('.glass-surface')) {
      const light = surface.querySelector(':scope > .glass-light');
      if (!light) continue;
      if (!pointer) {
        light.style.opacity = '0';
        light.classList.remove('is-active');
        continue;
      }
      const rect = surface.getBoundingClientRect();
      const dx = pointer.x - clamp(pointer.x, rect.left, rect.right);
      const dy = pointer.y - clamp(pointer.y, rect.top, rect.bottom);
      const distance = Math.hypot(dx, dy);
      if (
        distance >= lightRadius ||
        rect.bottom < -lightRadius ||
        rect.top > innerHeight + lightRadius
      ) {
        light.style.opacity = '0';
        light.classList.remove('is-active');
        continue;
      }
      light.classList.add('is-active');
      light.style.setProperty('--light-x', `${pointer.x - rect.left}px`);
      light.style.setProperty('--light-y', `${pointer.y - rect.top}px`);
      light.style.opacity = String(
        Math.pow(1 - distance / lightRadius, 1.4) * 0.9
      );
    }
  }
  function scheduleGlass() {
    if (!lightFrame) lightFrame = requestAnimationFrame(updateGlass);
  }
  prepareGlass();
  new MutationObserver((records) => {
    for (const record of records)
      for (const child of record.addedNodes) {
        if (child.nodeType === 1 && !child.classList.contains('glass-light'))
          prepareGlass(child);
      }
    scheduleGlass();
  }).observe(document.body, { childList: true, subtree: true });
  document.addEventListener(
    'pointermove',
    (event) => {
      pointer = { x: event.clientX, y: event.clientY };
      scheduleGlass();
    },
    { passive: true }
  );
  document.addEventListener('pointerout', (event) => {
    if (!event.relatedTarget) {
      pointer = null;
      scheduleGlass();
    }
  });
  window.addEventListener('scroll', scheduleGlass, { passive: true });
  window.addEventListener('mathrix-motionchange', scheduleGlass);
}
