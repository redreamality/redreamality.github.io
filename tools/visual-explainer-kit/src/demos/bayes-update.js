registerDemo("bayes-update", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
  root.innerHTML = `
    <style>
      .bayes-container {
        display: flex;
        flex-direction: column;
        min-height: 500px;
        width: 100%;
        font-family: system-ui, -apple-system, sans-serif;
        background: var(--surface);
        color: var(--ink);
      }
      .bayes-controls {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border-bottom: 1px solid var(--line);
        flex-wrap: wrap;
      }
      .bayes-controls label {
        font-weight: 600;
        font-size: 0.95rem;
      }
      .bayes-slider {
        flex: 1;
        min-width: 150px;
        max-width: 300px;
        cursor: pointer;
      }
      .bayes-prior-val {
        font-variant-numeric: tabular-nums;
        font-weight: bold;
        min-width: 40px;
      }
      .bayes-canvas-container {
        position: relative;
        flex: 1;
        min-height: 350px;
        width: 100%;
      }
      .bayes-canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        outline: none;
      }
      .bayes-status {
        padding: 12px 16px;
        font-size: 0.9rem;
        text-align: center;
        border-top: 1px solid var(--line);
        background: var(--surface);
        min-height: 3em;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    </style>
    <div class="bayes-container">
      <div class="bayes-controls">
        <label for="bayes-prior-slider">${copy.controlLabel}</label>
        <input type="range" id="bayes-prior-slider" class="bayes-slider" min="1" max="50" value="5" step="1" aria-label="${copy.controlLabel}">
        <span class="bayes-prior-val" id="bayes-prior-val">5%</span>
      </div>
      <div class="bayes-canvas-container">
        <canvas class="bayes-canvas" tabindex="0" aria-label="${copy.ariaLabel}"></canvas>
      </div>
      <div class="bayes-status" id="bayes-status" aria-live="polite"></div>
    </div>
  `;

  const slider = root.querySelector('#bayes-prior-slider');
  const priorValEl = root.querySelector('#bayes-prior-val');
  const statusEl = root.querySelector('#bayes-status');
  const canvas = root.querySelector('.bayes-canvas');
  const ctx = canvas.getContext('2d');

  let width = 0;
  let height = 0;
  let dpr = 1;
  let isPlaying = true;
  let animationId = null;
  let particles = [];
  let prior = 0.05;

  const SENSITIVITY = 0.9;
  const FPR = 0.1;
  const TOTAL_POP = 1000;

  class Particle {
    constructor(pathId) {
      this.pathId = pathId;
      this.t = 0;
      this.speed = 0.004 + Math.random() * 0.004;
      this.offset = (Math.random() - 0.5);
    }
  }

  function getBezierXY(t, x0, y0, x1, y1, x2, y2, x3, y3) {
    const cx = 3 * (x1 - x0);
    const bx = 3 * (x2 - x1) - cx;
    const ax = x3 - x0 - cx - bx;
    const cy = 3 * (y1 - y0);
    const by = 3 * (y2 - y1) - cy;
    const ay = y3 - y0 - cy - by;
    const x = ax * t * t * t + bx * t * t + cx * t + x0;
    const y = ay * t * t * t + by * t * t + cy * t + y0;
    return { x, y };
  }

  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';

    for (let word of words) {
      if (ctx.measureText(word).width > maxWidth) {
        for (let char of word) {
          let testLine = currentLine + char;
          if (ctx.measureText(testLine).width > maxWidth && currentLine !== '') {
            lines.push(currentLine);
            currentLine = char;
          } else {
            currentLine = testLine;
          }
        }
        currentLine += ' ';
      } else {
        let testLine = currentLine + word + ' ';
        if (ctx.measureText(testLine).width > maxWidth && currentLine !== '') {
          lines.push(currentLine.trim());
          currentLine = word + ' ';
        } else {
          currentLine = testLine;
        }
      }
    }
    if (currentLine.trim() !== '') lines.push(currentLine.trim());

    let startY = y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => {
      ctx.fillText(line, x, startY + i * lineHeight);
    });
  }

  function drawCurve(ctx, x1, y1, x2, y2, thickness, color, alpha) {
    if (thickness <= 0.2) return;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const cp1x = x1 + (x2 - x1) * 0.5;
    const cp2x = x2 - (x2 - x1) * 0.5;
    ctx.bezierCurveTo(cp1x, y1, cp2x, y2, x2, y2);
    ctx.lineWidth = thickness;
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  function updateStatus() {
    priorValEl.textContent = `${Math.round(prior * 100)}%`;
    const isRare = prior < 0.15;
    const newStatus = isRare ? copy.statusRare : copy.statusCommon;
    if (statusEl.textContent !== newStatus) {
      statusEl.textContent = newStatus;
      announce(newStatus);
    }
  }

  function draw() {
    if (!width || !height) return;

    ctx.clearRect(0, 0, width, height);

    const cOcean = resolveColor(tokens.ocean);
    const cCoral = resolveColor(tokens.coral);
    const cMuted = resolveColor(tokens.muted);
    const cInk = resolveColor(tokens.ink);
    const cSurface = resolveColor(tokens.surface);

    const hasIt = prior * TOTAL_POP;
    const clear = (1 - prior) * TOTAL_POP;
    const tp = hasIt * SENSITIVITY;
    const fn = hasIt * (1 - SENSITIVITY);
    const fp = clear * FPR;
    const tn = clear * (1 - FPR);
    const posPool = tp + fp;
    const posterior = posPool > 0 ? (tp / posPool) : 0;

    const S = (height * 0.35) / TOTAL_POP; 
    
    const X0 = width * 0.1;
    const X1 = width * 0.45;
    const X2 = width * 0.85;

    const Root_y = height * 0.5;
    const Root_top = Root_y - (TOTAL_POP * S) / 2;
    const Root_to_HasIt_y = Root_top + (hasIt * S) / 2;
    const Root_to_Clear_y = Root_top + hasIt * S + (clear * S) / 2;

    const HasIt_y = height * 0.25;
    const HasIt_top = HasIt_y - (hasIt * S) / 2;
    const HasIt_to_Pool_y = HasIt_top + (tp * S) / 2;
    const HasIt_to_Fade_y = HasIt_top + tp * S + (fn * S) / 2;

    const Clear_y = height * 0.75;
    const Clear_top = Clear_y - (clear * S) / 2;
    const Clear_to_Pool_y = Clear_top + (fp * S) / 2;
    const Clear_to_Fade_y = Clear_top + fp * S + (tn * S) / 2;

    const Pool_y = height * 0.5;
    const Pool_top = Pool_y - (posPool * S) / 2;
    const Pool_in_TP_y = Pool_top + (tp * S) / 2;
    const Pool_in_FP_y = Pool_top + tp * S + (fp * S) / 2;

    // Draw Curves
    drawCurve(ctx, X0, Root_to_HasIt_y, X1, HasIt_y, hasIt * S, cOcean, 0.4);
    drawCurve(ctx, X0, Root_to_Clear_y, X1, Clear_y, clear * S, cCoral, 0.4);
    drawCurve(ctx, X1, HasIt_to_Pool_y, X2, Pool_in_TP_y, tp * S, cOcean, 0.6);
    drawCurve(ctx, X1, Clear_to_Pool_y, X2, Pool_in_FP_y, fp * S, cCoral, 0.6);
    drawCurve(ctx, X1, HasIt_to_Fade_y, X1 + (X2 - X1) * 0.5, height * 0.05, fn * S, cOcean, 0.15);
    drawCurve(ctx, X1, Clear_to_Fade_y, X1 + (X2 - X1) * 0.5, height * 0.95, tn * S, cCoral, 0.15);

    // Draw Nodes (Bars)
    ctx.fillStyle = cMuted;
    ctx.fillRect(X0 - 3, Root_top, 6, TOTAL_POP * S);
    
    ctx.fillStyle = cOcean;
    ctx.fillRect(X1 - 3, HasIt_top, 6, hasIt * S);
    
    ctx.fillStyle = cCoral;
    ctx.fillRect(X1 - 3, Clear_top, 6, clear * S);

    // Pool Stacked Bar
    ctx.fillStyle = cOcean;
    ctx.fillRect(X2 - 8, Pool_top, 16, tp * S);
    ctx.fillStyle = cCoral;
    ctx.fillRect(X2 - 8, Pool_top + tp * S, 16, fp * S);

    // Particles
    if (motion !== false) {
      ctx.fillStyle = cSurface;
      for (let p of particles) {
        let startX, startY, endX, endY, curveWidth;
        if (p.t < 0.5) {
          let localT = p.t * 2;
          startX = X0;
          if (p.pathId === 0 || p.pathId === 2) {
            startY = Root_to_HasIt_y; endX = X1; endY = HasIt_y; curveWidth = hasIt * S;
          } else {
            startY = Root_to_Clear_y; endX = X1; endY = Clear_y; curveWidth = clear * S;
          }
          const pt = getBezierXY(localT, startX, startY, startX + (endX - startX) * 0.5, startY, endX - (endX - startX) * 0.5, endY, endX, endY);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y + p.offset * curveWidth, 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          let localT = (p.t - 0.5) * 2;
          startX = X1;
          if (p.pathId === 0) {
            startY = HasIt_to_Pool_y; endX = X2; endY = Pool_in_TP_y; curveWidth = tp * S;
          } else if (p.pathId === 1) {
            startY = Clear_to_Pool_y; endX = X2; endY = Pool_in_FP_y; curveWidth = fp * S;
          } else if (p.pathId === 2) {
            startY = HasIt_to_Fade_y; endX = X1 + (X2 - X1) * 0.5; endY = height * 0.05; curveWidth = fn * S;
          } else {
            startY = Clear_to_Fade_y; endX = X1 + (X2 - X1) * 0.5; endY = height * 0.95; curveWidth = tn * S;
          }
          const pt = getBezierXY(localT, startX, startY, startX + (endX - startX) * 0.5, startY, endX - (endX - startX) * 0.5, endY, endX, endY);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y + p.offset * curveWidth, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Text Labels
    ctx.fillStyle = cInk;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fontSize = Math.max(10, Math.min(14, width / 40));
    ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
    const maxW = width * 0.25;

    drawWrappedText(ctx, copy.crowdLabel, X0, Root_top - 20, maxW, fontSize * 1.2);
    drawWrappedText(ctx, copy.hasBranchLabel, X1, HasIt_top - 20, maxW, fontSize * 1.2);
    drawWrappedText(ctx, copy.clearBranchLabel, X1, Clear_top + clear * S + 20, maxW, fontSize * 1.2);
    
    // TP / FP labels in the middle
    drawWrappedText(ctx, copy.tpLabel, X1 + (X2 - X1) * 0.4, (HasIt_to_Pool_y + Pool_in_TP_y) / 2 - 25, maxW, fontSize * 1.2);
    drawWrappedText(ctx, copy.fpLabel, X1 + (X2 - X1) * 0.4, (Clear_to_Pool_y + Pool_in_FP_y) / 2 + 25, maxW, fontSize * 1.2);

    drawWrappedText(ctx, copy.positivePoolLabel, X2, Pool_top - 25, maxW, fontSize * 1.2);
    drawWrappedText(ctx, `${copy.posteriorLabel} = ${(posterior * 100).toFixed(1)}%`, X2, Pool_top + posPool * S + 25, maxW, fontSize * 1.2);
  }

  function loop() {
    if (!isPlaying) return;

    if (motion !== false) {
      // Spawn particles
      if (Math.random() < 0.4) {
        const hasIt = prior * TOTAL_POP;
        const clear = (1 - prior) * TOTAL_POP;
        const tp = hasIt * SENSITIVITY;
        const fn = hasIt * (1 - SENSITIVITY);
        const fp = clear * FPR;
        const tn = clear * (1 - FPR);
        
        const total = tp + fp + fn + tn;
        const r = Math.random() * total;
        let pathId;
        if (r < tp) pathId = 0;
        else if (r < tp + fp) pathId = 1;
        else if (r < tp + fp + fn) pathId = 2;
        else pathId = 3;
        
        particles.push(new Particle(pathId));
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].t += particles[i].speed;
        if (particles[i].t > 1) {
          particles.splice(i, 1);
        }
      }
    }

    draw();
    animationId = requestAnimationFrame(loop);
  }

  slider.addEventListener('input', (e) => {
    prior = parseInt(e.target.value, 10) / 100;
    updateStatus();
    if (!isPlaying || motion === false) {
      draw();
    }
  }, { signal });

  updateStatus();

  return {
    pause() {
      isPlaying = false;
      if (animationId) cancelAnimationFrame(animationId);
      draw();
    },
    resume() {
      isPlaying = true;
      if (motion !== false) {
        loop();
      }
    },
    reset() {
      prior = 0.05;
      slider.value = 5;
      particles = [];
      updateStatus();
      draw();
    },
    destroy() {
      isPlaying = false;
      if (animationId) cancelAnimationFrame(animationId);
      root.innerHTML = '';
    },
    resize(dim) {
      width = dim.width;
      height = dim.height;
      dpr = dim.dpr;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      draw();
    }
  };
});
