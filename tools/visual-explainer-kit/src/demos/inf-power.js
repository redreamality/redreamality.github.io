registerDemo("inf-power", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
  root.innerHTML = `
    <style>
      .inf-power-root {
        display: flex;
        flex-direction: column;
        min-height: 400px;
        font-family: system-ui, -apple-system, sans-serif;
        position: relative;
        user-select: none;
        box-sizing: border-box;
      }
      .inf-power-controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        gap: 0.5rem;
        z-index: 10;
      }
      .inf-power-controls label {
        font-size: 0.9rem;
        font-weight: 500;
      }
      .inf-power-slider {
        width: 100%;
        max-width: 300px;
        cursor: pointer;
      }
      .inf-power-stage {
        flex: 1;
        position: relative;
        min-height: 250px;
        width: 100%;
      }
      .inf-power-canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
      .inf-power-label {
        position: absolute;
        transform: translate(-50%, -100%);
        text-align: center;
        font-size: 0.85rem;
        line-height: 1.3;
        pointer-events: none;
        width: max-content;
        max-width: 45vw;
      }
      .inf-power-label small {
        display: block;
        font-size: 0.75rem;
        opacity: 0.8;
        margin-top: 4px;
      }
      .inf-power-caption {
        text-align: center;
        padding: 1rem;
        font-size: 0.85rem;
      }
    </style>
    <div class="inf-power-root" aria-label="${copy.ariaLabel}">
      <div class="inf-power-controls">
        <label for="inf-power-slider">${copy.controlLabel}</label>
        <input type="range" id="inf-power-slider" class="inf-power-slider" min="1" max="4" step="0.01" value="1" aria-label="${copy.controlLabel}">
      </div>
      <div class="inf-power-stage">
        <canvas class="inf-power-canvas" aria-hidden="true"></canvas>
        <div class="inf-power-label" id="inf-power-wallet-label">
          ${copy.walletLabel}
          <small>${copy.walletValue}</small>
        </div>
        <div class="inf-power-label" id="inf-power-basket-label">
          ${copy.basketFillLabel}
        </div>
      </div>
      <div class="inf-power-caption" aria-live="polite">${copy.caption}</div>
    </div>
  `;

  const slider = root.querySelector('#inf-power-slider');
  const canvas = root.querySelector('.inf-power-canvas');
  const ctx = canvas.getContext('2d');

  const walletLabel = root.querySelector('#inf-power-wallet-label');
  const basketLabel = root.querySelector('#inf-power-basket-label');
  const controlsLabel = root.querySelector('.inf-power-controls label');
  const caption = root.querySelector('.inf-power-caption');

  controlsLabel.style.color = resolveColor(tokens.ink);
  walletLabel.style.color = resolveColor(tokens.ink);
  basketLabel.style.color = resolveColor(tokens.ink);
  caption.style.color = resolveColor(tokens.muted);

  let priceLevel = 1;
  let isPlaying = true;
  let isInteracting = false;
  let animFrame;
  let lastTime = performance.now();
  let animPhase = 0;

  let logicalWidth = 0;
  let logicalHeight = 0;
  let currentDpr = 1;
  let lastAnnouncedState = 'low';

  function checkAnnounce() {
    if (priceLevel < 1.5 && lastAnnouncedState !== 'low') {
      announce(copy.statusLow);
      lastAnnouncedState = 'low';
    } else if (priceLevel > 3.5 && lastAnnouncedState !== 'high') {
      announce(copy.statusHigh);
      lastAnnouncedState = 'high';
    } else if (priceLevel >= 1.5 && priceLevel <= 3.5) {
      lastAnnouncedState = 'mid';
    }
  }

  slider.addEventListener('input', (e) => {
    isInteracting = true;
    priceLevel = parseFloat(e.target.value);
    checkAnnounce();
    render();
  }, { signal });

  function render() {
    if (!ctx || !logicalWidth || !logicalHeight) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = logicalWidth;
    const h = logicalHeight;

    const boxW = Math.min(w * 0.25, 120);
    const boxH = Math.min(h * 0.5, 140);

    const walletX = w * 0.25 - boxW / 2;
    const basketX = w * 0.75 - boxW / 2;
    const boxY = h * 0.5 - boxH / 2 + 15;

    const ink = resolveColor(tokens.ink);
    const ocean = resolveColor(tokens.ocean);
    const coral = resolveColor(tokens.coral);
    const muted = resolveColor(tokens.muted);

    ctx.fillStyle = ocean;
    ctx.fillRect(walletX, boxY, boxW, boxH);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2 * currentDpr;
    ctx.strokeRect(walletX, boxY, boxW, boxH);

    const fillH = boxH / priceLevel;
    const fillY = boxY + boxH - fillH;

    ctx.fillStyle = coral;
    ctx.fillRect(basketX, fillY, boxW, fillH);

    ctx.strokeStyle = ink;
    ctx.lineWidth = 2 * currentDpr;
    ctx.strokeRect(basketX, boxY, boxW, boxH);

    ctx.beginPath();
    ctx.setLineDash([6 * currentDpr, 6 * currentDpr]);
    ctx.moveTo(walletX + boxW, boxY);
    ctx.lineTo(basketX, fillY);
    ctx.strokeStyle = muted;
    ctx.lineWidth = 2 * currentDpr;
    ctx.stroke();
    ctx.setLineDash([]);

    walletLabel.style.left = `${w * 0.25}px`;
    walletLabel.style.top = `${boxY - 15}px`;

    basketLabel.style.left = `${w * 0.75}px`;
    basketLabel.style.top = `${boxY - 15}px`;
  }

  function loop(time) {
    if (!isPlaying) {
      lastTime = time;
      animFrame = requestAnimationFrame(loop);
      return;
    }

    const dt = time - lastTime;
    lastTime = time;

    if (!isInteracting && motion !== false) {
      animPhase += dt * 0.0015;
      priceLevel = 2.5 - 1.5 * Math.cos(animPhase);
      slider.value = priceLevel;
      checkAnnounce();
      render();
    }

    animFrame = requestAnimationFrame(loop);
  }

  animFrame = requestAnimationFrame((t) => {
    lastTime = t;
    loop(t);
  });

  return {
    pause() {
      isPlaying = false;
    },
    resume() {
      isPlaying = true;
      lastTime = performance.now();
    },
    reset() {
      isInteracting = false;
      animPhase = 0;
      priceLevel = 1;
      slider.value = priceLevel;
      lastAnnouncedState = 'low';
      render();
    },
    destroy() {
      cancelAnimationFrame(animFrame);
      root.innerHTML = '';
    },
    resize({ width, height, dpr }) {
      logicalWidth = width;
      logicalHeight = height;
      currentDpr = dpr;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      render();
    }
  };
});
