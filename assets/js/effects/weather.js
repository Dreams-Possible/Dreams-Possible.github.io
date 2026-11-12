export function initWeather(settings) {
  const canvas = document.querySelector('.weather-canvas');
  const context = canvas?.getContext('2d');
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const random = (min, max) => min + Math.random() * (max - min);
  if (context) {
    let width = 0;
    let height = 0;
    let lastTime = 0;
    let frame = 0;
    let drops = [];
    const meteors = [];
    function makeDrop(startAnywhere) {
      return {
        x: random(-width * 0.1, width * 1.1),
        y: startAnywhere ? random(0, height) : random(-height * 0.25, -12),
        speed: random(250, 690),
        length: random(7, 22),
        slant: random(-0.23, -0.08),
        opacity: random(0.15, 0.44),
        width: random(0.55, 1.25)
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
      drops = Array.from({ length: 960 }, () => makeDrop(true));
    }
    function draw(time) {
      frame = 0;
      if (
        document.hidden ||
        reducedMotion.matches ||
        (root.dataset.rain === 'off' && root.dataset.meteors === 'off')
      )
        return;
      const dt = Math.min((time - (lastTime || time)) / 1000, 0.05);
      lastTime = time;
      context.clearRect(0, 0, width, height);
      const dark = document.documentElement.dataset.theme === 'dark';
      const palette = dark
        ? {
            rain: [132, 218, 255],
            rainOpacity: 1,
            meteorTail: [84, 152, 255],
            meteorHead: [255, 190, 114],
            meteorOpacity: 0.92
          }
        : {
            rain: [15, 105, 164],
            rainOpacity: 0.98,
            meteorTail: [74, 80, 203],
            meteorHead: [221, 76, 125],
            meteorOpacity: 0.84
          };
      const activeDrops =
        root.dataset.rain === 'off'
          ? 0
          : Math.min(drops.length, Math.round(settings.rain * 9.6));
      const rainBatches = Array.from({ length: 15 }, () => new Path2D());
      for (let index = 0; index < activeDrops; index++) {
        const drop = drops[index];
        drop.y += drop.speed * dt;
        drop.x += drop.speed * drop.slant * dt;
        if (drop.y > height + 25 || drop.x < -30)
          drops[index] = makeDrop(false);
        const opacityBand = Math.min(
          4,
          Math.floor((drop.opacity - 0.15) / 0.06)
        );
        const widthBand = Math.min(2, Math.floor((drop.width - 0.55) / 0.24));
        const path = rainBatches[opacityBand * 3 + widthBand];
        path.moveTo(drop.x, drop.y);
        path.lineTo(drop.x - drop.slant * drop.length, drop.y - drop.length);
      }
      for (let opacityBand = 0; opacityBand < 5; opacityBand++) {
        for (let widthBand = 0; widthBand < 3; widthBand++) {
          const path = rainBatches[opacityBand * 3 + widthBand];
          context.strokeStyle = `rgba(${palette.rain.join(', ')}, ${(0.15 + opacityBand * 0.06) * palette.rainOpacity})`;
          context.lineWidth = 0.65 + widthBand * 0.28;
          context.stroke(path);
        }
      }
      if (
        root.dataset.meteors !== 'off' &&
        settings.meteors &&
        Math.random() < dt * settings.meteors * 0.0256
      ) {
        meteors.push({
          x: random(width * 0.28, width * 1.12),
          y: random(-40, height * 0.52),
          vx: random(-760, -470),
          vy: random(230, 430),
          length: random(80, 155),
          life: 0,
          duration: random(0.6, 1.05)
        });
      }
      for (let index = meteors.length - 1; index >= 0; index--) {
        const meteor = meteors[index];
        meteor.life += dt;
        meteor.x += meteor.vx * dt;
        meteor.y += meteor.vy * dt;
        if (meteor.life > meteor.duration) {
          meteors.splice(index, 1);
          continue;
        }
        const alpha =
          Math.sin((Math.PI * meteor.life) / meteor.duration) *
          palette.meteorOpacity;
        const tailX =
          meteor.x -
          (meteor.vx / Math.hypot(meteor.vx, meteor.vy)) * meteor.length;
        const tailY =
          meteor.y -
          (meteor.vy / Math.hypot(meteor.vx, meteor.vy)) * meteor.length;
        const glow = context.createLinearGradient(
          tailX,
          tailY,
          meteor.x,
          meteor.y
        );
        glow.addColorStop(0, `rgba(${palette.meteorTail.join(', ')}, 0)`);
        glow.addColorStop(
          0.58,
          `rgba(${palette.meteorTail.join(', ')}, ${alpha * 0.38})`
        );
        glow.addColorStop(
          1,
          `rgba(${palette.meteorHead.join(', ')}, ${alpha})`
        );
        context.strokeStyle = glow;
        context.lineWidth = 2.15;
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
      if (
        !document.hidden &&
        !reducedMotion.matches &&
        (root.dataset.rain !== 'off' || root.dataset.meteors !== 'off')
      )
        frame = requestAnimationFrame(draw);
    }
    resize();
    restart();
    window.addEventListener('resize', () => {
      resize();
      restart();
    });
    window.addEventListener('mathrix-motionchange', restart);
    document.addEventListener('visibilitychange', restart);
    reducedMotion.addEventListener('change', restart);
  }
}
