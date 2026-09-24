registerDemo("nd-curve", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
  // Initialize HTML structure and scoped CSS
  root.innerHTML = `
    <style>
      .nd-wrapper {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
        min-height: 400px;
        font-family: system-ui, sans-serif;
        box-sizing: border-box;
        user-select: none;
      }
      .nd-controls {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        flex-wrap: wrap;
        padding-top: 0.5rem;
      }
      .nd-controls button {
        padding: 0.4rem 0.8rem;
        font-size: 0.9rem;
        cursor: pointer;
        border: 1px solid ${tokens.line};
        background: ${tokens.surface};
        color: ${tokens.ink};
        border-radius: 4px;
        transition: all 0.2s ease;
      }
      .nd-controls button[aria-pressed="true"] {
        background: ${tokens.ocean};
        color: ${tokens.paper};
        border-color: ${tokens.ocean};
      }
      .nd-legend {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
        font-size: 0.85rem;
        color: ${tokens.muted};
      }
      .nd-legend-item {
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }
      .nd-swatch {
        width: 14px;
        height: 14px;
        border-radius: 2px;
      }
      .nd-canvas-container {
        position: relative;
        flex: 1;
        min-height: 250px;
        width: 100%;
      }
      .nd-canvas-container canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: block;
        touch-action: none;
      }
      .nd-status {
        text-align: center;
        color: ${tokens.ink};
        font-size: 0.95rem;
        min-height: 2.5em;
        padding: 0 1rem;
      }
      .nd-sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        border: 0;
      }
    </style>
    <div class="nd-wrapper" aria-label="${copy.ariaLabel}">
      <div class="nd-controls" role="group" aria-label="${copy.controlLabel}">
        <button type="button" data-sigma="1" aria-pressed="true">${copy.band1Label}</button>
        <button type="button" data-sigma="2" aria-pressed="false">${copy.band2Label}</button>
        <button type="button" data-sigma="3" aria-pressed="false">${copy.band3Label}</button>
      </div>
      <div class="nd-legend" aria-hidden="true">
        <div class="nd-legend-item">
          <div class="nd-swatch" style="background: ${tokens.ocean}; opacity: 0.2;"></div>
          <span>${copy.insideLabel}</span>
        </div>
        <div class="nd-legend-item">
          <div class="nd-swatch" style="border: 1px solid ${tokens.line}; background: transparent;"></div>
          <span>${copy.outsideLabel}</span>
        </div>
      </div>
      <div class="nd-canvas-container">
        <canvas role="img" aria-label="${copy.caption}"></canvas>
      </div>
      <div class="nd-status" aria-live="polite">${copy.status1}</div>
    </div>
  `;

  // DOM Elements
  const controls = root.querySelector('.nd-controls');
  const buttons = controls.querySelectorAll('button');
  const statusEl = root.querySelector('.nd-status');
  const canvasContainer = root.querySelector('.nd-canvas-container');
  const canvas = canvasContainer.querySelector('canvas');
  const ctx = canvas.getContext('2d');

  // State
  let currentSigma = 1;
  let animSigma = 1;
  let isAnimating = false;
  let rafId = null;
  let lastTime = 0;
  let paused = false;

  let canvasW = 0;
  let canvasH = 0;
  let canvasDpr = 1;

  // Coordinate mapping
  function getPos(x, y) {
    const padding = { top: 20, bottom: 40, left: 20, right: 20 };
    const innerW = canvasW - padding.left - padding.right;
    const innerH = canvasH - padding.top - padding.bottom;

    // Map x from [-3.8, 3.8] to canvas width
    const cx = padding.left + ((x + 3.8) / 7.6) * innerW;
    // Map y from [0, 1.1] to canvas height (leaving headroom)
    const cy = canvasH - padding.bottom - (y / 1.1) * innerH;

    return [cx, cy];
  }

  // Render function
  function render() {
    if (!ctx || canvasW === 0 || canvasH === 0) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(canvasDpr, canvasDpr);

    // 1. Draw baseline
    ctx.beginPath();
    let [bx1, by1] = getPos(-3.8, 0);
    let [bx2, by2] = getPos(3.8, 0);
    ctx.moveTo(bx1, by1);
    ctx.lineTo(bx2, by2);
    ctx.strokeStyle = resolveColor(tokens.line);
    ctx.lineWidth = 1;
    ctx.stroke();

    // 2. Draw ticks and mean label
    ctx.fillStyle = resolveColor(tokens.muted);
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = -3; i <= 3; i++) {
      let [tx, ty] = getPos(i, 0);
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx, ty + 5);
      ctx.strokeStyle = resolveColor(tokens.line);
      ctx.stroke();

      if (i === 0) {
        ctx.fillText(copy.meanLabel, tx, ty + 8);
      }
    }

    // 3. Draw shaded area (Inside band)
    ctx.beginPath();
    let startX = -animSigma;
    let endX = animSigma;
    let [sx, sy] = getPos(startX, 0);
    ctx.moveTo(sx, sy);

    for (let x = startX; x <= endX; x += 0.05) {
      let y = Math.exp(-0.5 * x * x);
      let [cx, cy] = getPos(x, y);
      ctx.lineTo(cx, cy);
    }

    let [ex, ey] = getPos(endX, Math.exp(-0.5 * endX * endX));
    ctx.lineTo(ex, ey);
    let [ex0, ey0] = getPos(endX, 0);
    ctx.lineTo(ex0, ey0);
    ctx.closePath();

    ctx.fillStyle = resolveColor(tokens.ocean);
    ctx.globalAlpha = 0.2;
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // 4. Draw vertical boundaries for the band
    ctx.beginPath();
    let [lx, ly] = getPos(-animSigma, Math.exp(-0.5 * animSigma * animSigma));
    let [lx0, ly0] = getPos(-animSigma, 0);
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx0, ly0);

    let [rx, ry] = getPos(animSigma, Math.exp(-0.5 * animSigma * animSigma));
    let [rx0, ry0] = getPos(animSigma, 0);
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx0, ry0);

    ctx.strokeStyle = resolveColor(tokens.ocean);
    ctx.lineWidth = 2;
    ctx.stroke();

    // 5. Draw the normal distribution curve
    ctx.beginPath();
    for (let x = -3.8; x <= 3.8; x += 0.05) {
      let y = Math.exp(-0.5 * x * x);
      let [cx, cy] = getPos(x, y);
      if (x === -3.8) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.strokeStyle = resolveColor(tokens.ink);
    ctx.lineWidth = 2;
    ctx.stroke();

    // 6. Draw the band label centered inside the curve
    let currentBandLabel = currentSigma === 1 ? copy.band1Label : (currentSigma === 2 ? copy.band2Label : copy.band3Label);
    let [lblX, lblY] = getPos(0, 0.4);

    ctx.font = '600 14px system-ui, sans-serif';
    ctx.fillStyle = resolveColor(tokens.ocean);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add a stroke to ensure text is readable against the curve if they intersect
    ctx.lineWidth = 4;
    ctx.strokeStyle = resolveColor(tokens.surface);
    ctx.strokeText(currentBandLabel, lblX, lblY);
    ctx.fillText(currentBandLabel, lblX, lblY);

    ctx.restore();
  }

  // Animation Loop
  function tick(now) {
    if (!isAnimating) return;
    if (!lastTime) lastTime = now;
    let dt = now - lastTime;
    lastTime = now;

    let diff = currentSigma - animSigma;

    if (Math.abs(diff) < 0.005) {
      animSigma = currentSigma;
      isAnimating = false;
    } else {
      // Frame-independent easing
      let factor = 1 - Math.pow(0.85, dt / 16.66);
      animSigma += diff * factor;
    }

    render();

    if (isAnimating) {
      rafId = requestAnimationFrame(tick);
    } else {
      lastTime = 0;
    }
  }

  // Update logic
  function updateDOM() {
    buttons.forEach(btn => {
      btn.setAttribute('aria-pressed', btn.dataset.sigma == currentSigma);
    });
    statusEl.textContent = copy['status' + currentSigma];
  }

  function setSigma(s) {
    if (currentSigma === s) return;
    currentSigma = s;

    updateDOM();
    announce(copy['status' + s]);

    if (motion === false || paused) {
      animSigma = s;
      isAnimating = false;
      cancelAnimationFrame(rafId);
      render();
    } else {
      isAnimating = true;
      lastTime = 0;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    }
  }

  // Event Listeners
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const s = parseInt(e.currentTarget.dataset.sigma, 10);
      setSigma(s);
    }, { signal });
  });

  // Lifecycle methods
  return {
    pause() {
      paused = true;
      isAnimating = false;
      cancelAnimationFrame(rafId);
    },
    resume() {
      paused = false;
      if (animSigma !== currentSigma) {
        isAnimating = true;
        lastTime = 0;
        rafId = requestAnimationFrame(tick);
      }
    },
    reset() {
      currentSigma = 1;
      animSigma = 1;
      isAnimating = false;
      cancelAnimationFrame(rafId);
      updateDOM();
      render();
    },
    destroy() {
      isAnimating = false;
      cancelAnimationFrame(rafId);
      root.innerHTML = '';
    },
    resize({ width, height, dpr }) {
      // Use the actual container dimensions to avoid layout feedback loops
      canvasW = canvasContainer.clientWidth;
      canvasH = canvasContainer.clientHeight;
      canvasDpr = dpr;

      canvas.width = canvasW * dpr;
      canvas.height = canvasH * dpr;

      render();
    }
  };
});
