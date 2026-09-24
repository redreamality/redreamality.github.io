registerDemo("bf-twins", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
  const maxIter = 50;
  const r = 4.0;

  let currentWidth = 300;
  let currentHeight = 200;
  let currentDpr = 1;

  let trajA = [];
  let trajB = [];
  let progress = 0;
  let isAnimating = false;
  let animId = null;
  let selectedIndex = 0;

  // Setup DOM
  root.innerHTML = `
    <style>
      .bf-twins-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        font-family: system-ui, sans-serif;
        color: ${tokens.ink};
        width: 100%;
      }
      .bf-twins-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        font-size: 0.875rem;
        justify-content: center;
      }
      .bf-twins-legend-item {
        display: flex;
        align-items: center;
        gap: 0.375rem;
      }
      .bf-twins-legend-color {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }
      .bf-twins-canvas-wrap {
        position: relative;
        width: 100%;
        min-height: 280px;
        background: ${tokens.surface};
        border: 1px solid ${tokens.line};
        border-radius: 4px;
        overflow: hidden;
      }
      .bf-twins-canvas-wrap canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: block;
      }
      .bf-twins-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: center;
      }
      .bf-twins-fieldset {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        border: 1px solid ${tokens.line};
        padding: 0.5rem 0.75rem;
        border-radius: 4px;
        margin: 0;
      }
      .bf-twins-fieldset legend {
        font-size: 0.75rem;
        color: ${tokens.muted};
        padding: 0 0.25rem;
      }
      .bf-twins-fieldset label {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.875rem;
        cursor: pointer;
      }
      .bf-twins-btn {
        padding: 0.5rem 1.25rem;
        background: ${tokens.ocean};
        color: ${tokens.paper};
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.875rem;
        transition: opacity 0.2s;
      }
      .bf-twins-btn:hover {
        opacity: 0.9;
      }
      .bf-twins-btn:focus-visible {
        outline: 2px solid ${tokens.ink};
        outline-offset: 2px;
      }
      .bf-twins-status {
        font-size: 0.875rem;
        color: ${tokens.muted};
        min-height: 1.25rem;
      }
      .bf-twins-caption {
        font-size: 0.875rem;
        border-left: 3px solid ${tokens.line};
        padding-left: 0.75rem;
        color: ${tokens.ink};
        line-height: 1.4;
      }
    </style>
    <div class="bf-twins-container">
      <div class="bf-twins-legend" aria-hidden="true">
        <div class="bf-twins-legend-item">
          <div class="bf-twins-legend-color" style="background: ${tokens.ocean}"></div>
          <span>${copy.seriesA}</span>
        </div>
        <div class="bf-twins-legend-item">
          <div class="bf-twins-legend-color" style="background: ${tokens.coral}"></div>
          <span>${copy.seriesB}</span>
        </div>
      </div>

      <div class="bf-twins-canvas-wrap">
        <canvas role="img" aria-label="${copy.ariaLabel}"></canvas>
      </div>

      <div class="bf-twins-controls">
        <fieldset class="bf-twins-fieldset">
          <legend>${copy.controlLabel}</legend>
          ${copy.perturbations.map((p, i) => `
            <label>
              <input type="radio" name="bf-twins-delta" value="${i}" ${i === 0 ? 'checked' : ''}>
              ${p.label}
            </label>
          `).join('')}
        </fieldset>
        <button class="bf-twins-btn" type="button">${copy.runLabel}</button>
      </div>

      <div class="bf-twins-status" aria-live="polite">${copy.statusReady}</div>
      <div class="bf-twins-caption">${copy.caption}</div>
    </div>
  `;

  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const runBtn = root.querySelector('.bf-twins-btn');
  const statusEl = root.querySelector('.bf-twins-status');
  const radios = root.querySelectorAll('input[name="bf-twins-delta"]');

  function generateTrajectories(delta) {
    trajA = [0.2];
    trajB = [0.2 + delta];
    for (let i = 0; i < maxIter; i++) {
      trajA.push(r * trajA[i] * (1 - trajA[i]));
      trajB.push(r * trajB[i] * (1 - trajB[i]));
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, currentWidth * currentDpr, currentHeight * currentDpr);

    ctx.save();
    ctx.scale(currentDpr, currentDpr);

    const padLeft = 48;
    const padBottom = 32;
    const padTop = 16;
    const padRight = 16;

    const plotW = currentWidth - padLeft - padRight;
    const plotH = currentHeight - padTop - padBottom;

    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = resolveColor(tokens.line);
    ctx.lineWidth = 1;
    ctx.moveTo(padLeft, padTop);
    ctx.lineTo(padLeft, padTop + plotH);
    ctx.lineTo(padLeft + plotW, padTop + plotH);
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = resolveColor(tokens.muted);
    ctx.font = '12px system-ui, sans-serif';

    // X label
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(copy.xLabel, padLeft + plotW / 2, padTop + plotH + 8);

    // Y label
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(copy.yLabel, padLeft - 8, padTop + plotH / 2);

    // Helpers
    const getX = (i) => padLeft + (i / maxIter) * plotW;
    const getY = (val) => padTop + plotH - val * plotH;

    function drawPath(traj, colorStr) {
      if (traj.length === 0 || progress <= 0) return;
      ctx.beginPath();
      ctx.strokeStyle = resolveColor(colorStr);
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.moveTo(getX(0), getY(traj[0]));

      const maxIdx = Math.floor(progress);
      for (let i = 1; i <= maxIdx && i <= maxIter; i++) {
        ctx.lineTo(getX(i), getY(traj[i]));
      }

      if (maxIdx < maxIter && maxIdx < progress) {
        const frac = progress - maxIdx;
        const nx = getX(maxIdx) + (getX(maxIdx + 1) - getX(maxIdx)) * frac;
        const ny = getY(traj[maxIdx]) + (getY(traj[maxIdx + 1]) - getY(traj[maxIdx])) * frac;
        ctx.lineTo(nx, ny);
      }
      ctx.stroke();
    }

    // Draw A then B
    drawPath(trajA, tokens.ocean);
    drawPath(trajB, tokens.coral);

    ctx.restore();
  }

  function loop() {
    if (!isAnimating) return;

    progress += (motion ? 0.4 : maxIter);
    if (progress >= maxIter) {
      progress = maxIter;
      isAnimating = false;
    }

    draw();

    if (isAnimating) {
      animId = requestAnimationFrame(loop);
    }
  }

  function startSimulation() {
    const selectedRadio = root.querySelector('input[name="bf-twins-delta"]:checked');
    selectedIndex = parseInt(selectedRadio.value, 10);
    const perturbation = copy.perturbations[selectedIndex];

    generateTrajectories(perturbation.delta);
    progress = 0;
    isAnimating = true;

    statusEl.textContent = perturbation.status;
    announce(perturbation.status);

    if (animId) cancelAnimationFrame(animId);
    loop();
  }

  runBtn.addEventListener('click', startSimulation, { signal });

  // Reset progress visually when user changes selection before running
  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      progress = 0;
      trajA = [];
      trajB = [];
      isAnimating = false;
      if (animId) cancelAnimationFrame(animId);
      statusEl.textContent = copy.statusReady;
      draw();
    }, { signal });
  });

  return {
    pause() {
      isAnimating = false;
      if (animId) cancelAnimationFrame(animId);
      draw();
    },
    resume() {
      if (progress > 0 && progress < maxIter) {
        isAnimating = true;
        loop();
      }
    },
    reset() {
      isAnimating = false;
      if (animId) cancelAnimationFrame(animId);
      progress = 0;
      trajA = [];
      trajB = [];
      radios[0].checked = true;
      statusEl.textContent = copy.statusReady;
      draw();
    },
    destroy() {
      isAnimating = false;
      if (animId) cancelAnimationFrame(animId);
      root.innerHTML = '';
    },
    resize({ width, height, dpr }) {
      currentWidth = width;
      // Use the container's height constraint, fallback to param height if necessary
      const wrap = root.querySelector('.bf-twins-canvas-wrap');
      if (wrap) {
        currentHeight = wrap.clientHeight || height;
      } else {
        currentHeight = height;
      }
      currentDpr = dpr;

      canvas.width = currentWidth * currentDpr;
      canvas.height = currentHeight * currentDpr;

      draw();
    }
  };
});
