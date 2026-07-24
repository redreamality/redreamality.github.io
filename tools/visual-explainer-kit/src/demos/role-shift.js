registerDemo("role-shift", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
  // 1. Setup DOM structure
  root.innerHTML = `
    <style>
      .role-shift-container {
        display: flex;
        flex-direction: column;
        min-height: 28rem;
        width: 100%;
        font-family: system-ui, -apple-system, sans-serif;
        color: ${tokens.ink};
        background: ${tokens.surface};
        box-sizing: border-box;
      }
      .role-shift-header {
        padding: 1rem;
        display: flex;
        justify-content: center;
        align-items: center;
        border-bottom: 1px solid ${tokens.line};
        z-index: 10;
      }
      .role-shift-toggle {
        display: inline-flex;
        background: ${tokens.paper};
        border: 1px solid ${tokens.line};
        border-radius: 8px;
        overflow: hidden;
      }
      .role-shift-toggle button {
        padding: 0.5rem 1rem;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        user-select: none;
        color: ${tokens.ink};
        background: transparent;
        border: 0;
        border-right: 1px solid ${tokens.line};
        transition: background 0.2s, color 0.2s;
        outline: none;
      }
      .role-shift-toggle button:last-child {
        border-right: none;
      }
      .role-shift-toggle button:focus-visible {
        box-shadow: inset 0 0 0 2px ${tokens.ocean};
      }
      .role-shift-toggle button.active {
        background: ${tokens.ocean};
        color: ${tokens.surface};
      }
      .role-shift-canvas-wrap {
        flex: 1;
        position: relative;
        min-height: 22rem;
        overflow: hidden;
      }
      .role-shift-container canvas {
        position: absolute;
        inset: 0;
        display: block;
        width: 100%;
        height: 100%;
      }
      .role-shift-footer {
        padding: 1rem;
        background: ${tokens.paper};
        border-top: 1px solid ${tokens.line};
        min-height: 100px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .role-shift-title {
        font-weight: 600;
        font-size: 1rem;
        margin-bottom: 0.25rem;
      }
      .role-shift-desc {
        font-size: 0.875rem;
        line-height: 1.4;
        color: ${tokens.muted};
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    </style>
    <div class="role-shift-container">
      <div class="role-shift-header">
        <fieldset class="role-shift-toggle" aria-label="${copy.modeLabel}">
          <legend class="sr-only">${copy.modeLabel}</legend>
          <button type="button" class="active" data-mode="manual" aria-pressed="true">
            ${copy.manualButton}
          </button>
          <button type="button" data-mode="system" aria-pressed="false">
            ${copy.systemButton}
          </button>
        </fieldset>
      </div>
      <div class="role-shift-canvas-wrap">
        <canvas role="img" aria-label="${copy.ariaLabel}"></canvas>
      </div>
      <div class="role-shift-footer" aria-live="polite">
        <div class="role-shift-title" id="rs-title"></div>
        <div class="role-shift-desc" id="rs-desc"></div>
      </div>
    </div>
  `;

  // 2. DOM Elements & State
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const modeButtons = root.querySelectorAll('.role-shift-toggle button');
  const titleEl = root.querySelector('#rs-title');
  const descEl = root.querySelector('#rs-desc');

  let width = 0;
  let height = 0;
  let dpr = 1;
  let isPlaying = false;
  let frameId = null;
  let time = 0;
  let lastFrameTime = performance.now();

  let mode = 'manual'; // 'manual' | 'system'
  let targetProgress = 0; // 0 = manual, 1 = system
  let currentProgress = 0;

  // 3. Interaction Logic
  function updateText() {
    if (mode === 'manual') {
      titleEl.textContent = copy.manualHuman;
      descEl.textContent = `${copy.manualHumanDetail} ${copy.manualCostLabel}: ${copy.manualCost} ${copy.manualStatus}`;
    } else {
      titleEl.textContent = copy.systemHuman;
      descEl.textContent = `${copy.systemHumanDetail} ${copy.systemNote} ${copy.systemStatus}`;
    }
  }

  function setMode(newMode) {
    if (mode === newMode) return;
    mode = newMode;
    targetProgress = mode === 'manual' ? 0 : 1;

    modeButtons.forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    updateText();
    announce(mode === 'manual' ? copy.manualStatus : copy.systemStatus);

    if (!motion) {
      currentProgress = targetProgress;
      draw();
    }
  }

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setMode(button.dataset.mode);
    }, { signal });
  });

  updateText();

  // 4. Drawing Helpers
  function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const characters = Array.from(String(text));
    let line = '';
    let currentY = y;
    for (const character of characters) {
      const testLine = line + character;
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && line) {
        context.fillText(line, x, currentY);
        line = character;
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, x, currentY);
    return currentY;
  }

  function drawRoundRect(context, x, y, w, h, r) {
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + w - r, y);
    context.quadraticCurveTo(x + w, y, x + w, y + r);
    context.lineTo(x + w, y + h - r);
    context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    context.lineTo(x + r, y + h);
    context.quadraticCurveTo(x, y + h, x, y + h - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }

  function drawArrowhead(context, x, y, angle, size = 6) {
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(-size, -size * 0.6);
    context.lineTo(-size, size * 0.6);
    context.closePath();
    context.fill();
    context.restore();
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // 5. Main Draw Function
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    const cInk = resolveColor(tokens.ink);
    const cSurface = resolveColor(tokens.surface);
    const cOcean = resolveColor(tokens.ocean);
    const cCoral = resolveColor(tokens.coral);
    const cLine = resolveColor(tokens.line);
    const cMuted = resolveColor(tokens.muted);
    const cPaper = resolveColor(tokens.paper);

    const cx = width / 2;
    const cy = height / 2;
    const R = Math.min(width, height) * 0.35;
    const nodeW = Math.max(80, Math.min(120, width * 0.2));
    const nodeH = 40;

    // --- Interpolate Human Box ---
    // Manual: center circle (r=30)
    // System: large bounding box
    const boxW = R * 2 + nodeW + 40;
    const boxH = R * 2 + nodeH + 80;

    const hx = lerp(cx - 30, cx - boxW / 2, currentProgress);
    const hy = lerp(cy - 30, cy - boxH / 2, currentProgress);
    const hw = lerp(60, boxW, currentProgress);
    const hh = lerp(60, boxH, currentProgress);
    const hr = lerp(30, 16, currentProgress);

    // Draw Human Box / Center
    ctx.save();
    drawRoundRect(ctx, hx, hy, hw, hh, hr);

    // Mix colors based on progress
    ctx.fillStyle = currentProgress > 0.5 ? cPaper : cSurface;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = currentProgress > 0.5 ? cOcean : cCoral;

    // In manual, make the center human stand out
    if (currentProgress < 0.5) {
      ctx.fillStyle = cCoral;
      ctx.globalAlpha = 1 - (currentProgress * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.stroke();

    // Draw Human text/icon
    if (currentProgress < 0.5) {
      ctx.globalAlpha = 1 - (currentProgress * 2);
      ctx.fillStyle = cSurface;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      wrapText(ctx, copy.manualHuman, cx, cy - 4, Math.max(48, hw - 8), 13);
    } else {
      ctx.globalAlpha = (currentProgress - 0.5) * 2;
      ctx.fillStyle = cOcean;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(copy.boundaryLabel, cx, hy + 16);

      ctx.font = '12px sans-serif';
      ctx.fillStyle = cMuted;
      ctx.textBaseline = 'bottom';
      const bText = copy.boundaries.join(' • ');
      ctx.fillText(bText, cx, hy + hh - 16);
    }
    ctx.restore();

    // --- Draw Manual Nodes (alpha = 1 - currentProgress) ---
    if (currentProgress < 1) {
      ctx.save();
      ctx.globalAlpha = 1 - currentProgress;
      const steps = copy.manualSteps;
      const angleStep = (Math.PI * 2) / steps.length;

      for (let i = 0; i < steps.length; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const nx = cx + Math.cos(angle) * R;
        const ny = cy + Math.sin(angle) * R;

        // Lines to center
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = cLine;
        ctx.lineWidth = 1.5;
        if (!motion) {
           ctx.setLineDash([4, 4]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Static arrows if no motion
        if (!motion) {
          ctx.fillStyle = cCoral;
          // Outward arrow
          const midX1 = cx + Math.cos(angle) * (R * 0.4);
          const midY1 = cy + Math.sin(angle) * (R * 0.4);
          drawArrowhead(ctx, midX1, midY1, angle);
          // Inward arrow
          const midX2 = cx + Math.cos(angle) * (R * 0.7);
          const midY2 = cy + Math.sin(angle) * (R * 0.7);
          drawArrowhead(ctx, midX2, midY2, angle + Math.PI);
        }

        // Node box
        drawRoundRect(ctx, nx - nodeW/2, ny - nodeH/2, nodeW, nodeH, 8);
        ctx.fillStyle = cSurface;
        ctx.fill();
        ctx.strokeStyle = cLine;
        ctx.stroke();

        ctx.fillStyle = cInk;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        wrapText(ctx, steps[i], nx, ny - 4, nodeW - 10, 14);
      }
      ctx.restore();
    }

    // --- Draw System Nodes (alpha = currentProgress) ---
    if (currentProgress > 0) {
      ctx.save();
      ctx.globalAlpha = currentProgress;
      const nodes = copy.systemNodes;
      const angleStep = (Math.PI * 2) / nodes.length;

      // Draw loop connections
      for (let i = 0; i < nodes.length; i++) {
        const angle1 = i * angleStep - Math.PI / 2;
        const angle2 = ((i + 1) % nodes.length) * angleStep - Math.PI / 2;
        const nx1 = cx + Math.cos(angle1) * R;
        const ny1 = cy + Math.sin(angle1) * R;
        const nx2 = cx + Math.cos(angle2) * R;
        const ny2 = cy + Math.sin(angle2) * R;

        ctx.beginPath();
        ctx.moveTo(nx1, ny1);
        ctx.lineTo(nx2, ny2);
        ctx.strokeStyle = cOcean;
        ctx.lineWidth = 2;
        ctx.stroke();

        if (!motion) {
          ctx.fillStyle = cOcean;
          const midX = (nx1 + nx2) / 2;
          const midY = (ny1 + ny2) / 2;
          const angleLine = Math.atan2(ny2 - ny1, nx2 - nx1);
          drawArrowhead(ctx, midX, midY, angleLine, 8);
        }
      }

      // Draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const nx = cx + Math.cos(angle) * R;
        const ny = cy + Math.sin(angle) * R;

        drawRoundRect(ctx, nx - nodeW/2, ny - nodeH/2, nodeW, nodeH, 8);
        ctx.fillStyle = cSurface;
        ctx.fill();
        ctx.strokeStyle = cOcean;
        ctx.stroke();

        ctx.fillStyle = cInk;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(nodes[i].label, nx, ny);
      }
      ctx.restore();
    }

    // --- Draw Particles (only if motion is enabled) ---
    if (motion && (currentProgress < 1 || currentProgress > 0)) {
      ctx.save();

      if (currentProgress < 0.5) {
        // Manual Particles
        ctx.globalAlpha = 1 - (currentProgress * 2);
        const steps = copy.manualSteps;
        const totalSegments = steps.length * 2;
        const cycleTime = 6000;
        const t = (time % cycleTime) / cycleTime;
        const segment = Math.floor(t * totalSegments);
        const segT = (t * totalSegments) % 1;

        const stepIndex = Math.floor(segment / 2);
        const isOutward = segment % 2 === 0;

        const angle = stepIndex * ((Math.PI * 2) / steps.length) - Math.PI / 2;
        const nx = cx + Math.cos(angle) * R;
        const ny = cy + Math.sin(angle) * R;

        const startX = isOutward ? cx : nx;
        const startY = isOutward ? cy : ny;
        const endX = isOutward ? nx : cx;
        const endY = isOutward ? ny : cy;

        // Easing
        const easeT = segT < 0.5 ? 2 * segT * segT : -1 + (4 - 2 * segT) * segT;

        const px = lerp(startX, endX, easeT);
        const py = lerp(startY, endY, easeT);

        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = cCoral;
        ctx.fill();
        ctx.shadowColor = cCoral;
        ctx.shadowBlur = 10;
        ctx.fill();

      } else {
        // System Particles
        ctx.globalAlpha = (currentProgress - 0.5) * 2;
        const nodes = copy.systemNodes;
        const cycleTime = 5000;
        const t = (time % cycleTime) / cycleTime;
        const segment = Math.floor(t * nodes.length);
        const segT = (t * nodes.length) % 1;

        const angle1 = segment * ((Math.PI * 2) / nodes.length) - Math.PI / 2;
        const angle2 = ((segment + 1) % nodes.length) * ((Math.PI * 2) / nodes.length) - Math.PI / 2;

        const nx1 = cx + Math.cos(angle1) * R;
        const ny1 = cy + Math.sin(angle1) * R;
        const nx2 = cx + Math.cos(angle2) * R;
        const ny2 = cy + Math.sin(angle2) * R;

        const px = lerp(nx1, nx2, segT);
        const py = lerp(ny1, ny2, segT);

        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = cOcean;
        ctx.fill();
        ctx.shadowColor = cOcean;
        ctx.shadowBlur = 10;
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.restore();
  }

  function loop(now) {
    if (!isPlaying) return;

    const dt = now - lastFrameTime;
    lastFrameTime = now;
    time += dt;

    // Smooth transition
    if (currentProgress !== targetProgress) {
      const delta = targetProgress - currentProgress;
      currentProgress += delta * (motion ? 0.08 : 1);
      if (Math.abs(targetProgress - currentProgress) < 0.01) {
        currentProgress = targetProgress;
      }
    }

    draw();
    frameId = requestAnimationFrame(loop);
  }

  // 6. Lifecycle Contract
  return {
    resize(params) {
      width = params.width;
      height = params.height;
      dpr = params.dpr;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      draw();
    },
    pause() {
      isPlaying = false;
      if (frameId) cancelAnimationFrame(frameId);
      draw(); // Ensure knowledge state is drawn immediately
    },
    resume() {
      if (!isPlaying) {
        isPlaying = true;
        lastFrameTime = performance.now();
        if (motion) {
          frameId = requestAnimationFrame(loop);
        }
      }
    },
    reset() {
      setMode('manual');
      time = 0;
      currentProgress = 0;
      draw();
    },
    destroy() {
      isPlaying = false;
      if (frameId) cancelAnimationFrame(frameId);
      root.innerHTML = '';
    }
  };
});
