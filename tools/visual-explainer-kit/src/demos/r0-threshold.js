registerDemo("r0-threshold", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
  root.innerHTML = `
    <style>
      .r0-t-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        min-height: 450px;
        width: 100%;
        font-family: system-ui, sans-serif;
        color: var(--ink);
        box-sizing: border-box;
      }
      .r0-t-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 1.5rem;
        padding: 1rem;
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 8px;
      }
      .r0-t-control {
        flex: 1;
        min-width: 200px;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .r0-t-label-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.875rem;
        font-weight: 600;
      }
      .r0-t-slider {
        width: 100%;
        cursor: pointer;
        accent-color: var(--ocean);
      }
      .r0-t-canvas-container {
        position: relative;
        flex: 1;
        min-height: 250px;
      }
      .r0-t-canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        touch-action: none;
      }
      .r0-t-status {
        min-height: 3rem;
        padding: 0.75rem;
        font-size: 0.875rem;
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: 6px;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    </style>
    <div class="r0-t-container">
      <div class="r0-t-controls" aria-label="${copy.controlLabel}">
        <div class="r0-t-control">
          <div class="r0-t-label-row">
            <label for="r0-t-r0">${copy.r0Label}</label>
            <span class="r0-t-val-r0">3.0</span>
          </div>
          <input id="r0-t-r0" class="r0-t-slider" type="range" min="1" max="10" step="0.1" value="3" aria-label="${copy.r0Label}">
        </div>
        <div class="r0-t-control">
          <div class="r0-t-label-row">
            <label for="r0-t-cov">${copy.coverageLabel}</label>
            <span class="r0-t-val-cov">0.50</span>
          </div>
          <input id="r0-t-cov" class="r0-t-slider" type="range" min="0" max="1" step="0.01" value="0.5" aria-label="${copy.coverageLabel}">
        </div>
      </div>
      <div class="r0-t-canvas-container">
        <canvas class="r0-t-canvas" aria-label="${copy.ariaLabel}"></canvas>
      </div>
      <div class="r0-t-status" aria-live="polite"></div>
    </div>
  `;

  const r0Slider = root.querySelector('#r0-t-r0');
  const covSlider = root.querySelector('#r0-t-cov');
  const r0Val = root.querySelector('.r0-t-val-r0');
  const covVal = root.querySelector('.r0-t-val-cov');
  const canvas = root.querySelector('.r0-t-canvas');
  const ctx = canvas.getContext('2d');
  const statusEl = root.querySelector('.r0-t-status');

  let targetR0 = 3;
  let currentR0 = 3;
  let targetCov = 0.5;
  let currentCov = 0.5;
  let lastStatus = '';

  let canvasW = 0;
  let canvasH = 0;
  let currentDpr = 1;

  let isPaused = false;
  let animationId = null;

  const isCJK = (str) => /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(str);

  function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const cjk = isCJK(text);
    const tokens = cjk ? text.split('') : text.split(' ');
    let line = '';
    const lines = [];
    
    for (let i = 0; i < tickMarks.length; i++) {
      const token = tickMarks[i];
      const testLine = line + (line && !cjk ? ' ' : '') + token;
      if (context.measureText(testLine).width > maxWidth && i > 0) {
        lines.push(line);
        line = token;
      } else {
        line = testLine;
      }
    }
    lines.push(line);
    
    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) => {
      context.fillText(l, x, startY + i * lineHeight);
    });
  }

  function updateStatus() {
    const threshold = 1 - 1 / targetR0;
    let newStatus = '';
    if (Math.abs(targetCov - threshold) < 0.05) {
      newStatus = copy.statusNear;
    } else if (targetCov > threshold) {
      newStatus = copy.statusAbove;
    } else {
      newStatus = copy.statusBelow;
    }
    if (newStatus !== lastStatus) {
      statusEl.textContent = newStatus;
      lastStatus = newStatus;
      announce(newStatus);
    }
  }

  function handleInput() {
    targetR0 = parseFloat(r0Slider.value);
    targetCov = parseFloat(covSlider.value);
    r0Val.textContent = targetR0.toFixed(1);
    covVal.textContent = targetCov.toFixed(2);
    updateStatus();
    
    if (isPaused || !motion) {
      currentR0 = targetR0;
      currentCov = targetCov;
      draw();
    } else if (!animationId) {
      loop();
    }
  }

  r0Slider.addEventListener('input', handleInput, { signal });
  covSlider.addEventListener('input', handleInput, { signal });

  function draw() {
    if (!canvasW || !canvasH) return;

    ctx.clearRect(0, 0, canvasW, canvasH);

    const ink = resolveColor(tokens.ink);
    const muted = resolveColor(tokens.muted);
    const ocean = resolveColor(tokens.ocean);
    const warm = resolveColor(tokens.warm);
    const line = resolveColor(tokens.line);
    const paper = resolveColor(tokens.paper);

    const padL = 60 * currentDpr;
    const padR = 20 * currentDpr;
    const padT = 30 * currentDpr;
    const padB = 40 * currentDpr;

    const plotW = canvasW - padL - padR;
    const plotH = canvasH - padT - padB;

    const mapX = (r0) => padL + ((r0 - 1) / 9) * plotW;
    const mapY = (p) => canvasH - padB - p * plotH;

    ctx.beginPath();
    ctx.moveTo(mapX(1), mapY(0));
    for (let x = 1; x <= 10; x += 0.1) {
      ctx.lineTo(mapX(x), mapY(1 - 1/x));
    }
    ctx.lineTo(mapX(10), mapY(0));
    ctx.closePath();
    ctx.fillStyle = warm;
    ctx.globalAlpha = 0.15;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(mapX(1), mapY(0));
    for (let x = 1; x <= 10; x += 0.1) {
      ctx.lineTo(mapX(x), mapY(1 - 1/x));
    }
    ctx.lineTo(mapX(10), mapY(1));
    ctx.lineTo(mapX(1), mapY(1));
    ctx.closePath();
    ctx.fillStyle = ocean;
    ctx.fill();
    ctx.globalAlpha = 1.0;

    ctx.beginPath();
    for (let x = 1; x <= 10; x += 0.1) {
      ctx.lineTo(mapX(x), mapY(1 - 1/x));
    }
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2 * currentDpr;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, canvasH - padB);
    ctx.lineTo(canvasW - padR, canvasH - padB);
    ctx.strokeStyle = line;
    ctx.lineWidth = 1 * currentDpr;
    ctx.stroke();

    ctx.fillStyle = ink;
    ctx.font = `${12 * currentDpr}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    [1, 5, 10].forEach(val => {
      const x = mapX(val);
      ctx.fillText(val, x, canvasH - padB + 8 * currentDpr);
      ctx.beginPath();
      ctx.moveTo(x, canvasH - padB);
      ctx.lineTo(x, canvasH - padB + 4 * currentDpr);
      ctx.strokeStyle = line;
      ctx.stroke();
    });
    ctx.fillText(copy.r0Label, padL + plotW / 2, canvasH - padB + 24 * currentDpr);

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    [0, 0.5, 1].forEach(val => {
      const y = mapY(val);
      ctx.fillText(val, padL - 8 * currentDpr, y);
      ctx.beginPath();
      ctx.moveTo(padL - 4 * currentDpr, y);
      ctx.lineTo(padL, y);
      ctx.strokeStyle = line;
      ctx.stroke();
    });

    ctx.save();
    ctx.translate(padL - 40 * currentDpr, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(copy.coverageLabel, 0, 0);
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lineHeight = 16 * currentDpr;
    
    ctx.fillStyle = ocean;
    wrapText(ctx, copy.aboveLabel, mapX(4), mapY(0.85), plotW * 0.4, lineHeight);
    
    ctx.fillStyle = warm;
    wrapText(ctx, copy.belowLabel, mapX(7), mapY(0.2), plotW * 0.4, lineHeight);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = ink;
    const tX = mapX(2.5) + 8 * currentDpr;
    const tY = mapY(1 - 1/2.5) - 8 * currentDpr;
    wrapText(ctx, copy.thresholdLabel, tX, tY, plotW * 0.4, lineHeight);

    const cx = mapX(currentR0);
    const cy = mapY(currentCov);

    ctx.beginPath();
    ctx.setLineDash([4 * currentDpr, 4 * currentDpr]);
    ctx.moveTo(cx, canvasH - padB);
    ctx.lineTo(cx, cy);
    ctx.moveTo(padL, cy);
    ctx.lineTo(cx, cy);
    ctx.strokeStyle = muted;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(cx, cy, 6 * currentDpr, 0, Math.PI * 2);
    const currentThreshold = 1 - 1 / currentR0;
    ctx.fillStyle = currentCov > currentThreshold ? ocean : warm;
    ctx.fill();
    ctx.strokeStyle = paper;
    ctx.lineWidth = 2 * currentDpr;
    ctx.stroke();
  }

  function loop() {
    if (isPaused) {
      animationId = null;
      return;
    }
    
    let needsDraw = false;
    
    if (motion) {
      const dr = targetR0 - currentR0;
      const dc = targetCov - currentCov;
      if (Math.abs(dr) > 0.01 || Math.abs(dc) > 0.001) {
        currentR0 += dr * 0.15;
        currentCov += dc * 0.15;
        needsDraw = true;
      } else {
        currentR0 = targetR0;
        currentCov = targetCov;
        needsDraw = true;
      }
    } else {
      if (currentR0 !== targetR0 || currentCov !== targetCov) {
        currentR0 = targetR0;
        currentCov = targetCov;
        needsDraw = true;
      }
    }

    if (needsDraw) {
      draw();
    }

    if (currentR0 !== targetR0 || currentCov !== targetCov) {
      animationId = requestAnimationFrame(loop);
    } else {
      animationId = null;
    }
  }

  updateStatus();

  return {
    pause() {
      isPaused = true;
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    },
    resume() {
      isPaused = false;
      if (currentR0 !== targetR0 || currentCov !== targetCov) {
        loop();
      }
    },
    reset() {
      targetR0 = 3;
      targetCov = 0.5;
      r0Slider.value = 3;
      covSlider.value = 0.5;
      r0Val.textContent = "3.0";
      covVal.textContent = "0.50";
      updateStatus();
      
      if (!motion || isPaused) {
        currentR0 = targetR0;
        currentCov = targetCov;
        draw();
      } else if (!animationId) {
        loop();
      }
    },
    destroy() {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      root.innerHTML = '';
    },
    resize({ dpr }) {
      currentDpr = dpr;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvasW = rect.width * dpr;
      canvasH = rect.height * dpr;
      canvas.width = canvasW;
      canvas.height = canvasH;
      draw();
    }
  };
});
