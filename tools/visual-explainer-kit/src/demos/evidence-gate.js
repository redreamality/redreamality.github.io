registerDemo("evidence-gate", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
  root.innerHTML = `
    <style>
      .evidence-wrapper {
        font-family: system-ui, sans-serif;
        color: var(--ink);
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        width: 100%;
        box-sizing: border-box;
      }
      .evidence-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 1.5rem;
        background: var(--surface);
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid var(--line);
      }
      .control-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .control-label {
        font-size: 0.875rem;
        font-weight: 600;
      }
      .button-group {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .evidence-wrapper button {
        background: var(--surface);
        border: 1px solid var(--line);
        color: var(--ink);
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.875rem;
        transition: all 0.2s;
      }
      .evidence-wrapper button:hover {
        background: var(--paper);
      }
      .evidence-wrapper button[aria-pressed="true"] {
        background: var(--ink);
        color: var(--surface);
        border-color: var(--ink);
      }
      .evidence-wrapper button:focus-visible {
        outline: 2px solid var(--ocean);
        outline-offset: 2px;
      }
      .diagram-container {
        width: 100%;
        overflow-x: auto;
        padding: 1rem 0;
      }
      .diagram {
        display: grid;
        grid-template-columns: 1fr 1.5fr;
        grid-template-rows: 1fr 1fr 1fr;
        gap: 1.5rem;
        min-width: 600px;
        position: relative;
        z-index: 1;
      }
      .connections {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        z-index: -1;
        pointer-events: none;
      }
      .node {
        background: var(--surface);
        border: 2px solid var(--line);
        border-radius: 8px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: center;
        transition: border-color 0.3s, box-shadow 0.3s;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      }
      .node.gate { grid-column: 1; grid-row: 2; }
      .node.retry { grid-column: 2; grid-row: 1; }
      .node.stop { grid-column: 2; grid-row: 2; }
      .node.escalate { grid-column: 2; grid-row: 3; }

      .node-title { font-weight: 600; font-size: 0.95rem; margin-bottom: 0.35rem; }
      .node-detail { font-size: 0.8rem; color: var(--muted); line-height: 1.4; }

      .node.active-retry { border-color: var(--warm); box-shadow: 0 0 0 1px var(--warm); }
      .node.active-stop { border-color: var(--ocean); box-shadow: 0 0 0 1px var(--ocean); }
      .node.active-escalate { border-color: var(--coral); box-shadow: 0 0 0 1px var(--coral); }

      .status-bar {
        background: var(--paper);
        border-left: 4px solid var(--ocean);
        padding: 1rem;
        border-radius: 0 8px 8px 0;
        font-size: 0.95rem;
        line-height: 1.4;
        transition: border-color 0.3s;
      }
      @media (max-width: 600px) {
        .evidence-wrapper { gap: 1rem; }
        .evidence-controls { gap: .85rem; padding: .85rem; }
        .diagram-container { overflow: visible; padding: .25rem 0; }
        .diagram {
          grid-template-columns: minmax(0, 1fr);
          grid-template-rows: none;
          gap: .75rem;
          min-width: 0;
        }
        .connections { display: none; }
        .node.gate,
        .node.retry,
        .node.stop,
        .node.escalate { grid-column: 1; grid-row: auto; }
      }
    </style>
    <div class="evidence-wrapper" aria-label="${copy.ariaLabel}">
      <div class="evidence-controls">
        <div class="control-group">
          <div class="control-label" id="verifier-label">${copy.verifierLabel}</div>
          <div class="button-group" role="group" aria-labelledby="verifier-label">
            <button type="button" data-verifier="self" aria-pressed="false">${copy.selfButton}</button>
            <button type="button" data-verifier="independent" aria-pressed="true">${copy.independentButton}</button>
          </div>
        </div>
        <div class="control-group">
          <div class="control-label" id="result-label">${copy.resultLabel}</div>
          <div class="button-group" role="group" aria-labelledby="result-label">
            <button type="button" data-result="fail" aria-pressed="false">${copy.failButton}</button>
            <button type="button" data-result="pass" aria-pressed="true">${copy.passButton}</button>
            <button type="button" data-result="uncertain" aria-pressed="false">${copy.uncertainButton}</button>
          </div>
        </div>
      </div>
      <div class="diagram-container">
        <div class="diagram" aria-hidden="true">
          <canvas class="connections"></canvas>
          <div class="node gate">
            <div class="node-title"></div>
            <div class="node-detail"></div>
          </div>
          <div class="node outcome retry">
            <div class="node-title">${copy.retryTitle}</div>
            <div class="node-detail">${copy.retryDetail}</div>
          </div>
          <div class="node outcome stop">
            <div class="node-title">${copy.stopTitle}</div>
            <div class="node-detail">${copy.stopDetail}</div>
          </div>
          <div class="node outcome escalate">
            <div class="node-title">${copy.escalateTitle}</div>
            <div class="node-detail">${copy.escalateDetail}</div>
          </div>
        </div>
      </div>
      <div class="status-bar" aria-live="polite"></div>
    </div>
  `;

  const state = {
    verifier: 'independent',
    result: 'pass'
  };

  const canvas = root.querySelector('.connections');
  const ctx = canvas.getContext('2d');
  const diagram = root.querySelector('.diagram');
  const gateNode = root.querySelector('.gate');
  const statusBar = root.querySelector('.status-bar');

  let isPaused = false;
  let rafId = null;
  let lastTime = 0;
  let particles = [];
  let layout = null;

  function getActiveOutcome() {
    if (state.verifier === 'self') return 'stop';
    const map = { fail: 'retry', pass: 'stop', uncertain: 'escalate' };
    return map[state.result];
  }

  function updateUI() {
    root.querySelectorAll('[data-verifier]').forEach(btn => {
      btn.setAttribute('aria-pressed', btn.dataset.verifier === state.verifier);
    });
    root.querySelectorAll('[data-result]').forEach(btn => {
      btn.setAttribute('aria-pressed', btn.dataset.result === state.result);
    });

    const gateTitle = gateNode.querySelector('.node-title');
    const gateDetail = gateNode.querySelector('.node-detail');

    if (state.verifier === 'self') {
      gateTitle.textContent = copy.selfVerdict;
      gateDetail.textContent = copy.selfDetail;
    } else {
      gateTitle.textContent = copy.independentVerdict;
      gateDetail.textContent = copy.independentDetail;
    }

    const activeOutcome = getActiveOutcome();
    ['retry', 'stop', 'escalate'].forEach(outcome => {
      const el = root.querySelector(`.node.${outcome}`);
      el.classList.remove('active-retry', 'active-stop', 'active-escalate');
      if (outcome === activeOutcome) {
        el.classList.add(`active-${outcome}`);
      }
    });

    let statusText = '';
    if (state.verifier === 'self') {
      statusText = copy.selfStatus;
      statusBar.style.borderLeftColor = resolveColor(tokens.ocean);
    } else {
      statusText = copy.statuses[state.result];
      const colorMap = { fail: tokens.warm, pass: tokens.ocean, uncertain: tokens.coral };
      statusBar.style.borderLeftColor = resolveColor(colorMap[state.result]);
    }

    if (statusBar.textContent !== statusText) {
      statusBar.textContent = statusText;
      announce(statusText);
    }

    particles = [];
    if (!motion || isPaused) {
      draw();
    }
  }

  function drawPath(ctx, start, end, isCurve, color, lineWidth) {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    if (isCurve) {
      const cpOffset = Math.max(Math.abs(end.x - start.x) * 0.5, 20);
      ctx.bezierCurveTo(start.x + cpOffset, start.y, end.x - cpOffset, end.y, end.x, end.y);
    } else {
      ctx.lineTo(end.x, end.y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function cubicBezier(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
  }

  function draw() {
    if (!layout) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const colorLine = resolveColor(tokens.line);
    const activeOutcome = getActiveOutcome();
    const colorMap = {
      retry: resolveColor(tokens.warm),
      stop: resolveColor(tokens.ocean),
      escalate: resolveColor(tokens.coral)
    };
    const activeColor = colorMap[activeOutcome];

    drawPath(ctx, layout.start, layout.gateIn, false, colorLine, 2);
    ['retry', 'stop', 'escalate'].forEach(outcome => {
      drawPath(ctx, layout.gateOut, layout.outcomes[outcome], true, colorLine, 2);
    });

    drawPath(ctx, layout.start, layout.gateIn, false, activeColor, 4);
    drawPath(ctx, layout.gateOut, layout.outcomes[activeOutcome], true, activeColor, 4);

    if (motion) {
      particles.forEach(p => {
        let x, y;
        if (p.t <= 1) {
          x = lerp(layout.start.x, layout.gateIn.x, p.t);
          y = lerp(layout.start.y, layout.gateIn.y, p.t);
        } else {
          const t2 = p.t - 1;
          const end = layout.outcomes[p.route];
          const cpOffset = Math.max(Math.abs(end.x - layout.gateOut.x) * 0.5, 20);
          x = cubicBezier(layout.gateOut.x, layout.gateOut.x + cpOffset, end.x - cpOffset, end.x, t2);
          y = cubicBezier(layout.gateOut.y, layout.gateOut.y, end.y, end.y, t2);
        }

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = activeColor;
        ctx.fill();

        ctx.shadowColor = activeColor;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    }
  }

  function loop(time) {
    if (!lastTime) lastTime = time;
    const dt = time - lastTime;
    lastTime = time;

    if (motion && !isPaused) {
      if (Math.random() < 0.04) {
        particles.push({ t: 0, route: getActiveOutcome() });
      }
      particles.forEach(p => {
        p.t += (dt / 1000) * 1.5;
      });
      particles = particles.filter(p => p.t <= 2);
      draw();
    }

    rafId = requestAnimationFrame(loop);
  }

  function startLoop() {
    if (!rafId && motion && !isPaused) {
      lastTime = performance.now();
      rafId = requestAnimationFrame(loop);
    }
  }

  function stopLoop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.dataset.verifier) {
      state.verifier = btn.dataset.verifier;
      updateUI();
    } else if (btn.dataset.result) {
      state.result = btn.dataset.result;
      updateUI();
    }
  }, { signal });

  updateUI();

  return {
    pause() {
      isPaused = true;
      stopLoop();
      draw();
    },
    resume() {
      isPaused = false;
      startLoop();
    },
    reset() {
      state.verifier = 'independent';
      state.result = 'pass';
      updateUI();
    },
    destroy() {
      stopLoop();
      root.innerHTML = '';
    },
    resize({ width, height, dpr }) {
      const rect = diagram.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const getCenter = (el) => {
        const elRect = el.getBoundingClientRect();
        return {
          x: elRect.left - rect.left,
          y: elRect.top - rect.top,
          w: elRect.width,
          h: elRect.height
        };
      };

      const gateBox = getCenter(gateNode);
      layout = {
        start: { x: 0, y: gateBox.y + gateBox.h / 2 },
        gateIn: { x: gateBox.x, y: gateBox.y + gateBox.h / 2 },
        gateOut: { x: gateBox.x + gateBox.w, y: gateBox.y + gateBox.h / 2 },
        outcomes: {}
      };

      ['retry', 'stop', 'escalate'].forEach(outcome => {
        const box = getCenter(root.querySelector(`.node.${outcome}`));
        layout.outcomes[outcome] = { x: box.x, y: box.y + box.h / 2 };
      });

      draw();
    }
  };
});
