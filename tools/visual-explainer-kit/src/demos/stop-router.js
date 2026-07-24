registerDemo("stop-router", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
  root.innerHTML = `
    <style>
      .sr-wrapper {
        display: flex;
        flex-direction: column;
        min-height: 28rem;
        width: 100%;
        font-family: system-ui, sans-serif;
        color: var(--ink);
        background: var(--paper);
        box-sizing: border-box;
      }
      .sr-header {
        padding: 12px 16px;
        border-bottom: 1px solid var(--line);
        background: var(--surface);
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .sr-header-label {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--muted);
        margin-right: 8px;
      }
      .sr-btn {
        appearance: none;
        background: var(--paper);
        border: 1px solid var(--line);
        color: var(--ink);
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s;
      }
      .sr-btn[aria-pressed="true"] {
        background: var(--ocean);
        border-color: var(--ocean);
        color: var(--paper);
      }
      .sr-btn:hover:not([aria-pressed="true"]) {
        background: var(--surface);
      }
      .sr-btn:focus-visible {
        outline: 3px solid var(--ocean);
        outline-offset: 2px;
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
      .sr-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
      .sr-canvas-box {
        flex: 1;
        position: relative;
        min-height: 200px;
      }
      .sr-canvas-box canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: block;
      }
      .sr-footer {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        padding: 16px;
        background: var(--surface);
        border-top: 1px solid var(--line);
        font-size: 0.85rem;
        line-height: 1.5;
        overflow-y: auto;
        max-height: 45%;
      }
      .sr-box {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .sr-box-title {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--muted);
      }
      .sr-status {
        grid-column: 1 / -1;
        padding-top: 12px;
        border-top: 1px dashed var(--line);
        font-weight: 600;
        color: var(--ocean);
      }
      @media (max-width: 600px) {
        .sr-footer {
          grid-template-columns: 1fr;
        }
      }
    </style>
    <div class="sr-wrapper" data-active-route="${copy.scenarios[0].route}">
      <div class="sr-header" role="group" aria-label="${copy.scenarioLabel}">
        <div class="sr-header-label">${copy.scenarioLabel}</div>
        ${copy.scenarios.map((sc, i) => `
          <button type="button" class="sr-btn" data-idx="${i}" aria-pressed="${i === 0 ? 'true' : 'false'}">${sc.label}</button>
        `).join('')}
      </div>
      <div class="sr-body">
        <div class="sr-canvas-box">
          <canvas role="img" aria-label="${copy.ariaLabel}"></canvas>
          <ul class="sr-only">
            ${copy.routes.map((route) => `<li>${route.label}: ${route.detail}</li>`).join('')}
          </ul>
        </div>
        <div class="sr-footer">
          <div class="sr-box">
            <div class="sr-box-title">${copy.evidenceLabel}</div>
            <div class="sr-ev-text">${copy.scenarios[0].evidence}</div>
          </div>
          <div class="sr-box">
            <div class="sr-box-title">${copy.controllerLabel}</div>
            <div class="sr-dec-text">${copy.scenarios[0].decision}</div>
          </div>
          <div class="sr-status">${copy.scenarios[0].status}</div>
        </div>
      </div>
    </div>
  `;

  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const wrapper = root.querySelector('.sr-wrapper');
  const btns = root.querySelectorAll('.sr-btn');
  const evText = root.querySelector('.sr-ev-text');
  const decText = root.querySelector('.sr-dec-text');
  const statusText = root.querySelector('.sr-status');

  let width = 0;
  let height = 0;
  let dpr = 1;
  let currentScenarioIndex = 0;
  let animProgress = motion ? 0 : 1;
  let isPaused = true;
  let rafId = null;
  let lastTime = 0;

  let coords = {
    in: { x: 0, y: 0 },
    ctrl: { x: 0, y: 0 },
    outs: []
  };

  function getRouteColor(id) {
    switch (id) {
      case 'pass': return tokens.ocean;
      case 'retry': return tokens.ocean;
      case 'blocked': return tokens.warm;
      case 'escalate': return tokens.coral;
      case 'budget': return tokens.coral;
      default: return tokens.ink;
    }
  }

  function draw() {
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const sc = copy.scenarios[currentScenarioIndex];
    const activeRouteId = sc.route;
    const activeRouteIndex = copy.routes.findIndex(r => r.id === activeRouteId);
    const routeColor = getRouteColor(activeRouteId);

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Incoming path
    ctx.beginPath();
    ctx.moveTo(coords.in.x, coords.in.y);
    ctx.lineTo(coords.ctrl.x, coords.ctrl.y);
    ctx.strokeStyle = resolveColor(animProgress > 0 ? tokens.ink : tokens.line);
    ctx.stroke();

    // Outgoing paths
    copy.routes.forEach((route, i) => {
      const outPt = coords.outs[i];
      const isActive = (i === activeRouteIndex);
      const cpX = coords.ctrl.x + (outPt.x - coords.ctrl.x) / 2;

      ctx.beginPath();
      ctx.moveTo(coords.ctrl.x, coords.ctrl.y);
      ctx.bezierCurveTo(cpX, coords.ctrl.y, cpX, outPt.y, outPt.x, outPt.y);

      if (isActive && animProgress > 0.4) {
        ctx.strokeStyle = resolveColor(routeColor);
      } else {
        ctx.strokeStyle = resolveColor(tokens.line);
      }
      ctx.stroke();
    });

    // Draw Nodes
    const drawNode = (x, y, r, colorStr) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = resolveColor(tokens.surface);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = resolveColor(colorStr);
      ctx.stroke();
    };

    drawNode(coords.in.x, coords.in.y, 6, animProgress > 0 ? tokens.ink : tokens.muted);
    drawNode(coords.ctrl.x, coords.ctrl.y, 8, animProgress > 0.3 ? tokens.ink : tokens.muted);

    copy.routes.forEach((route, i) => {
      const outPt = coords.outs[i];
      const isActive = (i === activeRouteIndex);
      const isLit = isActive && animProgress >= 0.9;
      const color = isLit ? routeColor : tokens.muted;

      drawNode(outPt.x, outPt.y, 6, color);

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = resolveColor(isLit ? tokens.ink : tokens.muted);
      ctx.font = `bold 13px system-ui, sans-serif`;
      ctx.fillText(route.label, outPt.x + 16, outPt.y - 8);

      ctx.font = `12px system-ui, sans-serif`;
      ctx.fillStyle = resolveColor(tokens.muted);
      ctx.fillText(route.detail, outPt.x + 16, outPt.y + 10);
    });

    // Animated Signal
    if (animProgress > 0 && animProgress < 1) {
      let dotX, dotY;
      let showDot = true;
      let dotColor = tokens.ink;

      if (animProgress < 0.3) {
        const p = animProgress / 0.3;
        const ease = p * p * (3 - 2 * p);
        dotX = coords.in.x + (coords.ctrl.x - coords.in.x) * ease;
        dotY = coords.in.y + (coords.ctrl.y - coords.in.y) * ease;
      } else if (animProgress < 0.4) {
        dotX = coords.ctrl.x;
        dotY = coords.ctrl.y;
      } else if (animProgress < 0.9) {
        dotColor = routeColor;
        const p = (animProgress - 0.4) / 0.5;
        const ease = p * p * (3 - 2 * p);
        const outPt = coords.outs[activeRouteIndex];
        const cpX = coords.ctrl.x + (outPt.x - coords.ctrl.x) / 2;
        const t = ease;
        const mt = 1 - t;
        dotX = mt * mt * mt * coords.ctrl.x + 3 * mt * mt * t * cpX + 3 * mt * t * t * cpX + t * t * t * outPt.x;
        dotY = mt * mt * mt * coords.ctrl.y + 3 * mt * mt * t * coords.ctrl.y + 3 * mt * t * t * outPt.y + t * t * t * outPt.y;
      } else {
        showDot = false;
      }

      if (showDot) {
        ctx.beginPath();
        ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
        ctx.fillStyle = resolveColor(tokens.surface);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = resolveColor(dotColor);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
        ctx.fillStyle = resolveColor(dotColor);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function loop(time) {
    if (!lastTime) lastTime = time;
    const dt = time - lastTime;
    lastTime = time;

    if (!isPaused) {
      animProgress += dt / 1200;
      if (animProgress >= 1) {
        animProgress = 1;
        draw();
        rafId = null;
        return;
      }
      draw();
    }
    rafId = requestAnimationFrame(loop);
  }

  function selectScenario(index, animate) {
    currentScenarioIndex = index;
    btns.forEach((btn, i) => btn.setAttribute('aria-pressed', i === index ? 'true' : 'false'));

    const sc = copy.scenarios[index];
    wrapper.dataset.activeRoute = sc.route;
    evText.textContent = sc.evidence;
    decText.textContent = sc.decision;
    statusText.textContent = sc.status;

    if (animate && motion) {
      animProgress = 0;
      lastTime = 0;
      if (!rafId) rafId = requestAnimationFrame(loop);
    } else {
      animProgress = 1;
      draw();
    }
  }

  btns.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      if (currentScenarioIndex !== i) {
        announce(`${copy.scenarios[i].label}: ${copy.scenarios[i].status}`);
        selectScenario(i, true);
      }
    }, { signal });
  });

  return {
    pause() {
      isPaused = true;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      draw();
    },
    resume() {
      isPaused = false;
      if (animProgress < 1 && !rafId) {
        lastTime = 0;
        rafId = requestAnimationFrame(loop);
      }
    },
    reset() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      selectScenario(0, false);
    },
    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      root.innerHTML = '';
    },
    resize({ width: w, height: h, dpr: d }) {
      width = w;
      height = h;
      dpr = d;
      canvas.width = w * d;
      canvas.height = h * d;

      coords.in = { x: Math.max(16, w * 0.05), y: h / 2 };
      coords.ctrl = { x: w * 0.25, y: h / 2 };
      coords.outs = copy.routes.map((_, i) => ({
        x: w < 450 ? w * 0.45 : w * 0.55,
        y: h * 0.15 + (h * 0.7 * (i / (copy.routes.length - 1)))
      }));

      draw();
    }
  };
});
