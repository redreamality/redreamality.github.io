registerDemo("bf-error", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
  const MAX_ITER = 60;
  const data = [];
  let x = 0.3;
  let y = 0.3 + 1e-12;

  for (let i = 0; i <= MAX_ITER; i++) {
    const diff = Math.abs(x - y);
    const logDiff = diff > 0 ? Math.log10(diff) : -12;
    data.push({ n: i, logDiff });
    x = 4 * x * (1 - x);
    y = 4 * y * (1 - y);
  }

  const isStatic = motion === false;
  let currentIter = isStatic ? MAX_ITER : 0;
  let isPlaying = false;
  let phase = isStatic ? 'saturated' : 'idle';
  let animId = null;
  let lastTime = 0;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let canvasDpr = 1;

  root.innerHTML = `
    <style>
      .bf-error-container {
        display: flex;
        flex-direction: column;
        width: 100%;
        min-height: 420px;
        font-family: system-ui, sans-serif;
        box-sizing: border-box;
      }
      .bf-error-status {
        padding: 0.75rem 1rem;
        color: var(--ink);
        font-size: 0.95rem;
        min-height: 3.5em;
        display: flex;
        align-items: center;
        background: var(--surface);
        border-radius: 4px;
        margin-bottom: 0.5rem;
      }
      .bf-error-canvas-box {
        position: relative;
        flex-grow: 1;
        width: 100%;
        min-height: 300px;
      }
      .bf-error-canvas-box canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: block;
      }
      .bf-error-caption {
        padding: 0.75rem;
        color: var(--muted);
        font-size: 0.85rem;
        text-align: center;
        line-height: 1.4;
      }
    </style>
    <div class="bf-error-container">
      <div class="bf-error-status" aria-live="polite">${isStatic ? copy.statusSaturated : copy.statusIdle}</div>
      <div class="bf-error-canvas-box">
        <canvas role="img" aria-label="${copy.ariaLabel}"></canvas>
      </div>
      <div class="bf-error-caption">${copy.caption}</div>
    </div>
  `;

  const canvas = root.querySelector('canvas');
  const statusDiv = root.querySelector('.bf-error-status');

  function updatePhase() {
    let newPhase = 'idle';
    if (currentIter === 0) {
      newPhase = 'idle';
    } else if (currentIter < 38) {
      newPhase = 'growing';
    } else {
      newPhase = 'saturated';
    }

    if (newPhase !== phase) {
      phase = newPhase;
      let text = '';
      if (phase === 'idle') text = copy.statusIdle;
      else if (phase === 'growing') text = copy.statusGrowing;
      else if (phase === 'saturated') text = copy.statusSaturated;

      statusDiv.textContent = text;
      if (isPlaying) {
        announce(text);
      }
    }
  }

  function draw() {
    if (!canvasWidth || !canvasHeight) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth * canvasDpr, canvasHeight * canvasDpr);

    const padLeft = 55 * canvasDpr;
    const padBottom = 45 * canvasDpr;
    const padTop = 35 * canvasDpr;
    const padRight = 20 * canvasDpr;

    const plotW = canvasWidth * canvasDpr - padLeft - padRight;
    const plotH = canvasHeight * canvasDpr - padTop - padBottom;

    const mapX = (n) => padLeft + (n / MAX_ITER) * plotW;
    const mapY = (val) => padTop + plotH - ((val + 12) / 12) * plotH;

    const colorLine = resolveColor(tokens.line);
    const colorMuted = resolveColor(tokens.muted);
    const colorOcean = resolveColor(tokens.ocean);
    const colorInk = resolveColor(tokens.ink);

    ctx.lineWidth = 1 * canvasDpr;
    ctx.strokeStyle = colorLine;
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop + plotH);
    ctx.lineTo(padLeft + plotW, padTop + plotH);
    ctx.moveTo(padLeft, padTop);
    ctx.lineTo(padLeft, padTop + plotH);
    ctx.stroke();

    ctx.fillStyle = colorMuted;
    ctx.font = `${12 * canvasDpr}px system-ui, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let v = -12; v <= 0; v += 3) {
      const y = mapY(v);
      ctx.beginPath();
      ctx.moveTo(padLeft - 5 * canvasDpr, y);
      ctx.lineTo(padLeft + plotW, y);
      ctx.strokeStyle = colorLine;
      ctx.stroke();
      ctx.fillText(v.toString(), padLeft - 10 * canvasDpr, y);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let n = 0; n <= MAX_ITER; n += 15) {
      const x = mapX(n);
      ctx.beginPath();
      ctx.moveTo(x, padTop + plotH);
      ctx.lineTo(x, padTop + plotH + 5 * canvasDpr);
      ctx.strokeStyle = colorLine;
      ctx.stroke();
      ctx.fillText(n.toString(), x, padTop + plotH + 10 * canvasDpr);
    }

    ctx.fillStyle = colorInk;
    ctx.textAlign = 'center';
    ctx.fillText(copy.xLabel, padLeft + plotW / 2, padTop + plotH + 28 * canvasDpr);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(copy.yLabel, padLeft, padTop - 12 * canvasDpr);

    if (currentIter > 0) {
      ctx.beginPath();
      ctx.strokeStyle = colorOcean;
      ctx.lineWidth = 2 * canvasDpr;
      ctx.moveTo(mapX(data[0].n), mapY(data[0].logDiff));

      const maxIdx = Math.floor(currentIter);
      for (let i = 1; i <= maxIdx; i++) {
        ctx.lineTo(mapX(data[i].n), mapY(data[i].logDiff));
      }

      if (maxIdx < MAX_ITER && currentIter > maxIdx) {
        const frac = currentIter - maxIdx;
        const p1 = data[maxIdx];
        const p2 = data[maxIdx + 1];
        const interpX = p1.n + frac * (p2.n - p1.n);
        const interpY = p1.logDiff + frac * (p2.logDiff - p1.logDiff);
        ctx.lineTo(mapX(interpX), mapY(interpY));
      }
      ctx.stroke();
    }

    if (currentIter >= 0) {
      const idx = Math.floor(currentIter);
      let cx, cy;
      if (idx < MAX_ITER && currentIter > idx) {
        const frac = currentIter - idx;
        cx = mapX(data[idx].n + frac * (data[idx+1].n - data[idx].n));
        cy = mapY(data[idx].logDiff + frac * (data[idx+1].logDiff - data[idx].logDiff));
      } else {
        cx = mapX(data[idx].n);
        cy = mapY(data[idx].logDiff);
      }

      ctx.beginPath();
      ctx.arc(cx, cy, 4 * canvasDpr, 0, Math.PI * 2);
      ctx.fillStyle = colorOcean;
      ctx.fill();
    }
  }

  function tick(now) {
    if (!isPlaying) return;
    const dt = lastTime ? (now - lastTime) : 16;
    lastTime = now;

    if (currentIter < MAX_ITER) {
      currentIter += dt * 0.015;
      if (currentIter > MAX_ITER) currentIter = MAX_ITER;
      updatePhase();
      draw();
    } else {
      isPlaying = false;
    }

    if (isPlaying) {
      animId = requestAnimationFrame(tick);
    }
  }

  return {
    pause() {
      isPlaying = false;
      if (animId) cancelAnimationFrame(animId);
      lastTime = 0;
      draw();
    },
    resume() {
      if (currentIter >= MAX_ITER) {
        currentIter = 0;
        updatePhase();
      }
      isPlaying = true;
      lastTime = performance.now();
      animId = requestAnimationFrame(tick);
    },
    reset() {
      isPlaying = false;
      if (animId) cancelAnimationFrame(animId);
      currentIter = 0;
      lastTime = 0;
      updatePhase();
      draw();
    },
    destroy() {
      isPlaying = false;
      if (animId) cancelAnimationFrame(animId);
      root.innerHTML = '';
    },
    resize({ width, height, dpr }) {
      canvasWidth = width;
      canvasHeight = height;
      canvasDpr = dpr;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      draw();
    }
  };
});
