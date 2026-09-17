(function () {
  'use strict';

  const canvas = document.querySelector('.weather-canvas');
  const context = canvas?.getContext('2d');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const controls = {
    rain: document.getElementById('rain-density'),
    meteors: document.getElementById('meteor-rate')
  };
  const settings = {rain: 55, meteors: 50};
  const random = (min, max) => min + Math.random() * (max - min);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  for (const [key, input] of Object.entries(controls)) {
    if (!input) continue;
    try {
      const saved = Number(localStorage.getItem(`mathrix-${key}`));
      if (Number.isFinite(saved) && localStorage.getItem(`mathrix-${key}`) !== null) settings[key] = clamp(saved, 0, 100);
    } catch (_) { /* Preferences remain available in this session. */ }
    input.value = String(settings[key]);
    const output = document.getElementById(key === 'rain' ? 'rain-value' : 'meteor-value');
    if (output) output.value = `${settings[key]}%`;
    input.addEventListener('input', () => {
      settings[key] = Number(input.value);
      if (output) output.value = `${settings[key]}%`;
      try { localStorage.setItem(`mathrix-${key}`, String(settings[key])); } catch (_) { /* Storage is optional. */ }
    });
  }

  if (context) {
    let width = 0;
    let height = 0;
    let lastTime = 0;
    let frame = 0;
    let drops = [];
    const meteors = [];
    function makeDrop(startAnywhere) {
      return {
        x: random(-width * .1, width * 1.1),
        y: startAnywhere ? random(0, height) : random(-height * .25, -12),
        speed: random(250, 690), length: random(7, 22),
        slant: random(-.23, -.08), opacity: random(.12, .38), width: random(.55, 1.25)
      };
    }
    function resize() {
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      drops = Array.from({length: 135}, () => makeDrop(true));
    }
    function draw(time) {
      frame = 0;
      if (document.hidden || reducedMotion.matches) return;
      if (lastTime && time - lastTime < 32) { frame = requestAnimationFrame(draw); return; }
      const dt = Math.min((time - (lastTime || time)) / 1000, .05);
      lastTime = time;
      context.clearRect(0, 0, width, height);
      const dark = document.documentElement.dataset.theme === 'dark';
      const activeDrops = Math.round(settings.rain * 1.35);
      for (let index = 0; index < activeDrops; index++) {
        const drop = drops[index];
        drop.y += drop.speed * dt;
        drop.x += drop.speed * drop.slant * dt;
        if (drop.y > height + 25 || drop.x < -30) drops[index] = makeDrop(false);
        context.strokeStyle = dark ? `rgba(157, 224, 241, ${drop.opacity})` : `rgba(39, 125, 156, ${drop.opacity * .73})`;
        context.lineWidth = drop.width;
        context.beginPath();
        context.moveTo(drop.x, drop.y);
        context.lineTo(drop.x - drop.slant * drop.length, drop.y - drop.length);
        context.stroke();
      }
      if (settings.meteors && Math.random() < dt * settings.meteors * .0032) {
        meteors.push({x: random(width * .28, width * 1.12), y: random(-40, height * .52),
          vx: random(-760, -470), vy: random(230, 430), length: random(80, 155), life: 0, duration: random(.6, 1.05)});
      }
      for (let index = meteors.length - 1; index >= 0; index--) {
        const meteor = meteors[index];
        meteor.life += dt;
        meteor.x += meteor.vx * dt;
        meteor.y += meteor.vy * dt;
        if (meteor.life > meteor.duration) { meteors.splice(index, 1); continue; }
        const alpha = Math.sin(Math.PI * meteor.life / meteor.duration) * (dark ? .8 : .56);
        const tailX = meteor.x - meteor.vx / Math.hypot(meteor.vx, meteor.vy) * meteor.length;
        const tailY = meteor.y - meteor.vy / Math.hypot(meteor.vx, meteor.vy) * meteor.length;
        const glow = context.createLinearGradient(tailX, tailY, meteor.x, meteor.y);
        glow.addColorStop(0, 'rgba(95, 211, 224, 0)');
        glow.addColorStop(1, `rgba(129, 229, 242, ${alpha})`);
        context.strokeStyle = glow;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(tailX, tailY);
        context.lineTo(meteor.x, meteor.y);
        context.stroke();
      }
      frame = requestAnimationFrame(draw);
    }
    function restart() {
      if (frame) cancelAnimationFrame(frame);
      context.clearRect(0, 0, width, height);
      lastTime = 0;
      if (!document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(draw);
    }
    resize();
    restart();
    window.addEventListener('resize', () => { resize(); restart(); });
    document.addEventListener('visibilitychange', restart);
    reducedMotion.addEventListener('change', restart);
  }

  const lightRadius = 230;
  let pointer = null;
  let lightFrame = 0;
  function prepareGlass(root = document) {
    const surfaces = root.matches?.('.glass-surface') ? [root] : root.querySelectorAll?.('.glass-surface') || [];
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
    for (const surface of document.querySelectorAll('.glass-surface')) {
      const light = surface.querySelector(':scope > .glass-light');
      if (!light) continue;
      if (!pointer) { light.style.opacity = '0'; light.classList.remove('is-active'); continue; }
      const rect = surface.getBoundingClientRect();
      const dx = pointer.x - clamp(pointer.x, rect.left, rect.right);
      const dy = pointer.y - clamp(pointer.y, rect.top, rect.bottom);
      const distance = Math.hypot(dx, dy);
      if (distance >= lightRadius || rect.bottom < -lightRadius || rect.top > innerHeight + lightRadius) {
        light.style.opacity = '0';
        light.classList.remove('is-active');
        continue;
      }
      light.classList.add('is-active');
      light.style.setProperty('--light-x', `${pointer.x - rect.left}px`);
      light.style.setProperty('--light-y', `${pointer.y - rect.top}px`);
      light.style.opacity = String(Math.pow(1 - distance / lightRadius, 1.4) * .9);
    }
  }
  function scheduleGlass() {
    if (!lightFrame) lightFrame = requestAnimationFrame(updateGlass);
  }
  prepareGlass();
  new MutationObserver(records => {
    for (const record of records) for (const child of record.addedNodes) {
      if (child.nodeType === 1 && !child.classList.contains('glass-light')) prepareGlass(child);
    }
    scheduleGlass();
  }).observe(document.body, {childList: true, subtree: true});
  document.addEventListener('pointermove', event => {
    pointer = {x: event.clientX, y: event.clientY};
    scheduleGlass();
  }, {passive: true});
  document.addEventListener('pointerout', event => {
    if (!event.relatedTarget) { pointer = null; scheduleGlass(); }
  });
  window.addEventListener('scroll', scheduleGlass, {passive: true});
})();
