registerDemo("ci-horizon", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
  let width = 0, height = 0, dpr = 1;
  let isPlaying = true;
  let progress = motion === false ? 1 : 0;
  let currentIndex = 0;
  let rafId;
  let lastTime = performance.now();

  const daysList = [30, 365, 1095];
  const r = 0.003; // 0.3% daily rate for clear visual distinction
  const statuses = [copy.statusMonth, copy.statusYear, copy.statusYears];

  root.innerHTML = `
    <style>
      .ci-horizon-root {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        font-family: system-ui, sans-serif;
      }
      .ci-horizon-controls {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .ci-horizon-btn {
        padding: 0.4rem 0.8rem;
        border: 1px solid var(--line);
        background: var(--surface);
        color: var(--ink);
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        font-family: inherit;
        transition: all 0.2s;
      }
      .ci-horizon-btn[aria-pressed="true"] {
        background: var(--ocean);
        color: var(--paper);
        border-color: var(--ocean);
      }
      .ci-horizon-legend {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        color: var(--muted);
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .ci-horizon-legend-item {
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }
      .ci-horizon-swatch-line {
        width: 16px;
        height: 0;
        border-top: 2px dashed var(--muted);
      }
      .ci-horizon-swatch-curve {
        width: 16px;
        height: 3px;
        background: var(--ocean);
      }
      .ci-horizon-stage {
        position: relative;
        width: 100%;
        min-height: 280px;
      }
      .ci-horizon-stage canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
      .ci-horizon-info {
        background: var(--surface);
        padding: 1rem;
        border-radius: 6px;
        border: 1px solid var(--line);
      }
      .ci-horizon-headline {
        margin: 0 0 0.5rem 0;
        font-size: 1.05rem;
        color: var(--ink);
        font-weight: 600;
      }
      .ci-horizon-detail {
        margin: 0;
        font-size: 0.95rem;
        color: var(--muted);
        line-height: 1.5;
      }
    </style>
    <div class="ci-horizon-root">
      <div class="ci-horizon-controls" role="group" aria-label="${copy.controlLabel}">
        ${copy.windows.map((w, i) => `
          <button type="button" class="ci-horizon-btn" aria-pressed="${i === 0}" data-index="${i}">
            ${w.label}
          </button>
        `).join('')}
      </div>
      <div class="ci-horizon-legend">
        <div class="ci-horizon-legend-item">
          <div class="ci-horizon-swatch-line"></div>
          <span>${copy.rateLabel}</span>
        </div>
        <div class="ci-horizon-legend-item">
          <div class="ci-horizon-swatch-curve"></div>
          <span>${copy.endValueLabel}</span>
        </div>
      </div>
      <div class="ci-horizon-stage">
        <canvas aria-label="${copy.ariaLabel}" role="img"></canvas>
      </div>
      <div class="ci-horizon-info" aria-live="polite">
        <h3 class="ci-horizon-headline">${copy.windows[0].headline}</h3>
        <p class="ci-horizon-detail">${copy.windows[0].detail}</p>
      </div>
    </div>
  `;

  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const btns = root.querySelectorAll('.ci-horizon-btn');
  const headlineEl = root.querySelector('.ci-horizon-headline');
  const detailEl = root.querySelector('.ci-horizon-detail');

  function updateContent(index) {
    btns.forEach((b, i) => b.setAttribute('aria-pressed', i === index ? 'true' : 'false'));
    headlineEl.textContent = copy.windows[index].headline;
    detailEl.textContent = copy.windows[index].detail;
    announce(statuses[index]);
  }

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      if (idx !== currentIndex) {
        currentIndex = idx;
        if (!isPlaying || motion === false) {
          progress = 1;
        } else {
          progress = 0;
        }
        updateContent(idx);
        draw();
      }
    }, { signal });
  });

  function draw() {
    if (!width || !height) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    const padLeft = 10;
    const padRight = 60;
    const padTop = 20;
    const padBottom = 20;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const maxX = daysList[currentIndex];
    const maxY = Math.pow(1 + r, maxX);
    
    const mapX = (x) => padLeft + (x / maxX) * plotW;
    const mapY = (y) => padTop + plotH - ((y - 1) / (maxY - 1)) * plotH;

    const colorMuted = resolveColor(tokens.muted);
    const colorOcean = resolveColor(tokens.ocean);
    const colorLine = resolveColor(tokens.line);
    const colorInk = resolveColor(tokens.ink);

    ctx.beginPath();
    ctx.strokeStyle = colorLine;
    ctx.lineWidth = 1;
    ctx.moveTo(padLeft, padTop);
    ctx.lineTo(padLeft, padTop + plotH);
    ctx.lineTo(padLeft + plotW, padTop + plotH);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = colorMuted;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(mapX(0), mapY(1));
    const linearMaxY = 1 + r * maxX;
    ctx.lineTo(mapX(maxX), mapY(linearMaxY));
    ctx.stroke();
    ctx.setLineDash([]);

    const currentX = maxX * progress;
    ctx.beginPath();
    ctx.strokeStyle = colorOcean;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.moveTo(mapX(0), mapY(1));
    
    const steps = 100;
    for (let i = 1; i <= steps; i++) {
      const x = (currentX * i) / steps;
      const y = Math.pow(1 + r, x);
      ctx.lineTo(mapX(x), mapY(y));
    }
    ctx.stroke();

    const currentY = Math.pow(1 + r, currentX);
    const px = mapX(currentX);
    const py = mapY(currentY);

    ctx.beginPath();
    ctx.fillStyle = colorOcean;
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colorInk;
    ctx.font = `600 13px system-ui, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText(currentY.toFixed(2) + 'x', px + 8, py);

    ctx.restore();
  }

  function loop(time) {
    if (!rafId) return;
    
    const dt = time - lastTime;
    lastTime = time;

    if (isPlaying && progress < 1) {
      progress += dt / 1500;
      if (progress > 1) progress = 1;
      draw();
    }

    rafId = requestAnimationFrame(loop);
  }

  rafId = requestAnimationFrame((t) => {
    lastTime = t;
    loop(t);
  });

  return {
    pause() {
      isPlaying = false;
      draw();
    },
    resume() {
      isPlaying = true;
      lastTime = performance.now();
    },
    reset() {
      currentIndex = 0;
      progress = motion === false ? 1 : 0;
      updateContent(0);
      lastTime = performance.now();
      draw();
    },
    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      root.innerHTML = '';
    },
    resize(dims) {
      width = dims.width;
      height = dims.height;
      dpr = dims.dpr;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      draw();
    }
  };
});
