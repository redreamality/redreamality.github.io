registerDemo("nd-tails", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
  const MAX_DRAWS = 5000;
  const TAIL_THRESHOLD = 2.5;
  const STATUS_THRESHOLD = 500;

  root.innerHTML = `
    <style>
      .nd-tails-wrapper {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        min-height: 480px;
        font-family: system-ui, -apple-system, sans-serif;
        color: var(--ink);
      }
      .nd-tails-header {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .nd-tails-caption {
        margin: 0;
        font-size: 0.95rem;
        color: var(--muted);
        line-height: 1.5;
      }
      .nd-tails-controls {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        flex-wrap: wrap;
        background: var(--surface);
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid var(--line);
      }
      .nd-tails-slider-wrap {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
        min-width: 200px;
      }
      .nd-tails-slider-label {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--ink);
      }
      .nd-tails-slider-wrap input {
        width: 100%;
        cursor: pointer;
        accent-color: var(--ocean);
      }
      .nd-tails-stats {
        display: flex;
        gap: 1rem;
      }
      .nd-tails-stat-box {
        display: flex;
        flex-direction: column;
        min-width: 90px;
      }
      .nd-tails-stat-label {
        font-size: 0.75rem;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .nd-tails-stat-val {
        font-variant-numeric: tabular-nums;
        font-weight: 700;
        font-size: 1.25rem;
        color: var(--ink);
      }
      .nd-tails-stat-val.hit {
        color: var(--coral);
      }
      .nd-tails-canvas-container {
        position: relative;
        flex: 1;
        min-height: 280px;
        width: 100%;
      }
      .nd-tails-canvas-container canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: block;
        touch-action: none;
      }
      .nd-tails-status {
        font-size: 0.95rem;
        padding: 1rem;
        background: var(--surface);
        border-left: 4px solid var(--ocean);
        border-radius: 0 8px 8px 0;
        margin: 0;
        line-height: 1.5;
        transition: border-color 0.3s ease;
      }
      .nd-tails-status.large {
        border-left-color: var(--coral);
      }
    </style>
    <div class="nd-tails-wrapper">
      <div class="nd-tails-header">
        <p class="nd-tails-caption">${copy.caption}</p>
        <div class="nd-tails-controls">
          <div class="nd-tails-slider-wrap">
            <label class="nd-tails-slider-label" for="nd-tails-slider">${copy.controlLabel}</label>
            <input type="range" id="nd-tails-slider" min="10" max="${MAX_DRAWS}" step="10" value="10">
          </div>
          <div class="nd-tails-stats">
            <div class="nd-tails-stat-box">
              <span class="nd-tails-stat-label">${copy.sampleLabel}</span>
              <span class="nd-tails-stat-val" id="nd-tails-val-draws">10</span>
            </div>
            <div class="nd-tails-stat-box">
              <span class="nd-tails-stat-label">${copy.hitsLabel}</span>
              <span class="nd-tails-stat-val hit" id="nd-tails-val-hits">0</span>
            </div>
          </div>
        </div>
      </div>
      <div class="nd-tails-canvas-container">
        <canvas aria-label="${copy.ariaLabel}" role="img" tabindex="0"></canvas>
      </div>
      <div class="nd-tails-status" id="nd-tails-status" aria-live="polite"></div>
    </div>
  `;

  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const slider = root.querySelector('#nd-tails-slider');
  const valDraws = root.querySelector('#nd-tails-val-draws');
  const valHits = root.querySelector('#nd-tails-val-hits');
  const statusBox = root.querySelector('#nd-tails-status');

  let points = [];
  let currentDraws = motion ? 10 : MAX_DRAWS;
  let targetDraws = currentDraws;
  let isPlaying = true;
  let autoProgress = motion;
  let lastStatus = '';
  let canvasWidth = 0;
  let canvasHeight = 0;
  let canvasDpr = 1;
  let rafId = null;

  slider.value = currentDraws;

  for (let i = 0; i < MAX_DRAWS; i++) {
    let u = 1 - Math.random();
    let v = Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    let curveY = Math.exp(-0.5 * z * z);
    let y = Math.random() * curveY;
    points.push({ x: z, y: y, isHit: Math.abs(z) > TAIL_THRESHOLD });
  }

  function wrapText(context, text, maxWidth) {
    const isCJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(text);
    let lines = [];
    if (isCJK) {
      let currentLine = '';
      for (let char of text) {
        let testLine = currentLine + char;
        if (context.measureText(testLine).width > maxWidth && currentLine.length > 0) {
          lines.push(currentLine);
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
    } else {
      let words = text.split(' ');
      let currentLine = '';
      for (let word of words) {
        let testLine = currentLine ? currentLine + ' ' + word : word;
        if (context.measureText(testLine).width > maxWidth && currentLine.length > 0) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
    }
    return lines;
  }

  function mapX(x, padding) {
    return padding + ((x + 4) / 8) * (canvasWidth - 2 * padding);
  }

  function mapY(y, paddingTop, paddingBottom) {
    return canvasHeight - paddingBottom - (y / 1.1) * (canvasHeight - paddingTop - paddingBottom);
  }

  function draw() {
    if (!canvasWidth || !canvasHeight) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const paddingX = 40;
    const paddingTop = 40;
    const paddingBottom = 30;

    let hits = 0;
    for (let i = 0; i < currentDraws; i++) {
      if (points[i].isHit) hits++;
    }

    valDraws.textContent = Math.floor(currentDraws).toString();
    valHits.textContent = hits.toString();

    const isLarge = currentDraws >= STATUS_THRESHOLD;
    const currentStatusText = isLarge ? copy.statusLarge : copy.statusSmall;

    if (lastStatus !== currentStatusText) {
      statusBox.textContent = currentStatusText;
      if (isLarge) {
        statusBox.classList.add('large');
      } else {
        statusBox.classList.remove('large');
      }
      if (lastStatus !== '') {
        announce(currentStatusText);
      }
      lastStatus = currentStatusText;
    }

    ctx.globalAlpha = 0.15;
    ctx.fillStyle = resolveColor(tokens.coral);
    ctx.beginPath();
    ctx.moveTo(mapX(-4, paddingX), mapY(0, paddingTop, paddingBottom));
    for (let x = -4; x <= -TAIL_THRESHOLD; x += 0.05) {
      ctx.lineTo(mapX(x, paddingX), mapY(Math.exp(-0.5 * x * x), paddingTop, paddingBottom));
    }
    ctx.lineTo(mapX(-TAIL_THRESHOLD, paddingX), mapY(0, paddingTop, paddingBottom));
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(mapX(TAIL_THRESHOLD, paddingX), mapY(0, paddingTop, paddingBottom));
    for (let x = TAIL_THRESHOLD; x <= 4; x += 0.05) {
      ctx.lineTo(mapX(x, paddingX), mapY(Math.exp(-0.5 * x * x), paddingTop, paddingBottom));
    }
    ctx.lineTo(mapX(4, paddingX), mapY(0, paddingTop, paddingBottom));
    ctx.fill();
    ctx.globalAlpha = 1.0;

    ctx.beginPath();
    for (let x = -4; x <= 4; x += 0.05) {
      let px = mapX(x, paddingX);
      let py = mapY(Math.exp(-0.5 * x * x), paddingTop, paddingBottom);
      if (x === -4) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = resolveColor(tokens.ink);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    for (let i = 0; i < currentDraws; i++) {
      let p = points[i];
      if (!p.isHit) {
        ctx.rect(mapX(p.x, paddingX) - 1, mapY(p.y, paddingTop, paddingBottom) - 1, 2, 2);
      }
    }
    ctx.fillStyle = resolveColor(tokens.ocean);
    ctx.globalAlpha = 0.5;
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < currentDraws; i++) {
      let p = points[i];
      if (p.isHit) {
        let px = mapX(p.x, paddingX);
        let py = mapY(p.y, paddingTop, paddingBottom);
        ctx.moveTo(px + 2.5, py);
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      }
    }
    ctx.fillStyle = resolveColor(tokens.coral);
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.globalAlpha = 1.0;

    ctx.fillStyle = resolveColor(tokens.ink);
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const labelMaxWidth = 70;
    const lines = wrapText(ctx, copy.tailLabel, labelMaxWidth);
    const lineHeight = 16;

    const drawLabelAt = (xPos) => {
      let startY = mapY(0.7, paddingTop, paddingBottom) - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, i) => {
        ctx.fillText(line, mapX(xPos, paddingX), startY + i * lineHeight);
      });

      ctx.beginPath();
      ctx.moveTo(mapX(xPos, paddingX), startY + lines.length * lineHeight - 4);
      ctx.lineTo(mapX(xPos, paddingX), mapY(0.15, paddingTop, paddingBottom));
      ctx.strokeStyle = resolveColor(tokens.muted);
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    drawLabelAt(-3.2);
    drawLabelAt(3.2);
  }

  function loop() {
    if (isPlaying && autoProgress && motion) {
      if (currentDraws < MAX_DRAWS) {
        currentDraws += 15;
        if (currentDraws > MAX_DRAWS) currentDraws = MAX_DRAWS;
        slider.value = currentDraws;
        draw();
      } else {
        autoProgress = false;
      }
    }
    rafId = requestAnimationFrame(loop);
  }

  slider.addEventListener('input', (e) => {
    autoProgress = false;
    currentDraws = Number(e.target.value);
    draw();
  }, { signal });

  if (motion) {
    rafId = requestAnimationFrame(loop);
  } else {
    draw();
  }

  return {
    pause() {
      isPlaying = false;
      draw();
    },
    resume() {
      isPlaying = true;
      draw();
    },
    reset() {
      autoProgress = motion;
      currentDraws = motion ? 10 : MAX_DRAWS;
      slider.value = currentDraws;
      lastStatus = '';
      draw();
    },
    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      root.innerHTML = '';
    },
    resize({ width, height, dpr }) {
      canvasWidth = width;
      canvasHeight = height;
      canvasDpr = dpr;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      draw();
    }
  };
});
