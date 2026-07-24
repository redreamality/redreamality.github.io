registerDemo("contract-gate", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
  root.innerHTML = `
    <style>
      .cg-container {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        font-family: system-ui, -apple-system, sans-serif;
        color: var(--ink);
        width: 100%;
      }
      .cg-controls {
        display: flex;
        gap: 0.75rem;
        justify-content: center;
        z-index: 4;
      }
      .cg-controls button {
        padding: 0.5rem 1.25rem;
        border: 1px solid var(--line);
        background: var(--surface);
        color: var(--ink);
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.95rem;
        font-weight: 500;
        transition: all 0.2s ease;
      }
      .cg-controls button:hover {
        background: var(--paper);
      }
      .cg-controls button:focus-visible {
        outline: 3px solid var(--ocean);
        outline-offset: 2px;
      }
      .cg-controls button[aria-pressed="true"] {
        background: var(--ink);
        color: var(--surface);
        border-color: var(--ink);
      }
      .cg-flow {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        position: relative;
        z-index: 1;
      }
      @media (min-width: 640px) {
        .cg-flow {
          flex-direction: row;
          align-items: stretch;
        }
      }
      #flow-canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 3;
      }
      .cg-card {
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 1.25rem;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        z-index: 2;
        transition: border-color 0.3s ease;
      }
      .cg-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--muted);
        font-weight: 600;
      }
      .cg-text {
        font-size: 0.95rem;
        line-height: 1.5;
      }
      .cg-checks {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }
      .cg-checks li {
        position: relative;
        padding-left: 1.5rem;
        font-size: 0.9rem;
        line-height: 1.4;
      }
      .cg-checks li::before {
        content: "";
        position: absolute;
        left: 0;
        top: -0.1rem;
        width: 1.2em;
        height: 1.2em;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .state-vague .cg-checks li::before {
        content: "×";
        color: var(--coral);
        font-weight: bold;
        font-size: 1.2rem;
      }
      .state-engineered .cg-checks li::before {
        content: "✓";
        color: var(--ocean);
        font-weight: bold;
        font-size: 1rem;
      }
      .state-vague #card-status {
        border-left: 4px solid var(--coral);
      }
      .state-engineered #card-status {
        border-left: 4px solid var(--ocean);
      }
    </style>
    <div class="cg-container" aria-label="${copy.ariaLabel}">
      <div class="cg-controls">
        <button type="button" id="btn-vague" aria-pressed="true">${copy.vagueButton}</button>
        <button type="button" id="btn-engineered" aria-pressed="false">${copy.engineeredButton}</button>
      </div>
      <div class="cg-flow" id="flow-box">
        <canvas id="flow-canvas"></canvas>
        <div class="cg-card" id="card-input">
          <div class="cg-label">${copy.inputLabel}</div>
          <div class="cg-text" id="text-brief"></div>
        </div>
        <div class="cg-card" id="card-gate">
          <div class="cg-label">${copy.gateLabel}</div>
          <ul class="cg-checks" id="list-checks"></ul>
        </div>
        <div class="cg-card" id="card-status">
          <div class="cg-text" id="text-status"></div>
        </div>
      </div>
    </div>
  `;

  const btnVague = root.querySelector('#btn-vague');
  const btnEngineered = root.querySelector('#btn-engineered');
  const flowBox = root.querySelector('#flow-box');
  const canvas = root.querySelector('#flow-canvas');
  const ctx = canvas.getContext('2d');
  const textBrief = root.querySelector('#text-brief');
  const listChecks = root.querySelector('#list-checks');
  const textStatus = root.querySelector('#text-status');

  let currentState = 'vague';
  let isPlaying = false;
  let animId;
  let startTime = 0;
  let pausedTime = 0;
  const DURATION = 4000;
  let canvasRect = { w: 0, h: 0, dpr: 1 };
  let waypoints = { A: { x: 0, y: 0 }, B: { x: 0, y: 0 }, C: { x: 0, y: 0 } };

  function updateWaypoints() {
    const getCenter = (id) => {
      const el = root.querySelector(id);
      return {
        x: el.offsetLeft + el.offsetWidth / 2,
        y: el.offsetTop + el.offsetHeight / 2
      };
    };
    waypoints.A = getCenter('#card-input');
    waypoints.B = getCenter('#card-gate');
    waypoints.C = getCenter('#card-status');
  }

  function getPosition(t, state) {
    const { A, B, C } = waypoints;
    if (state === 'engineered') {
      if (t < 0.45) {
        const p = t / 0.45;
        return { x: A.x + (B.x - A.x) * p, y: A.y + (B.y - A.y) * p };
      } else if (t < 0.55) {
        return { x: B.x, y: B.y };
      } else {
        const p = (t - 0.55) / 0.45;
        return { x: B.x + (C.x - B.x) * p, y: B.y + (C.y - B.y) * p };
      }
    } else {
      const p = t;
      const bx = Math.pow(1 - p, 2) * A.x + 2 * (1 - p) * p * B.x + Math.pow(p, 2) * C.x;
      const by = Math.pow(1 - p, 2) * A.y + 2 * (1 - p) * p * B.y + Math.pow(p, 2) * C.y;

      const env = Math.sin(p * Math.PI);
      const nx = Math.sin(p * Math.PI * 4) * 60 + Math.cos(p * Math.PI * 3) * 40;
      const ny = Math.cos(p * Math.PI * 5) * 60 + Math.sin(p * Math.PI * 2) * 40;

      return { x: bx + nx * env, y: by + ny * env };
    }
  }

  function draw(time) {
    if (!startTime) startTime = time - pausedTime;
    let elapsed = time - startTime;
    let t = elapsed / DURATION;

    if (t > 1) {
      startTime = time;
      elapsed = 0;
      t = 0;
    }

    if (isPlaying) {
      pausedTime = elapsed;
    }

    let renderT = motion === false ? 1 : t;

    ctx.clearRect(0, 0, canvasRect.w, canvasRect.h);

    const colorHex = currentState === 'vague' ? resolveColor(tokens.coral) : resolveColor(tokens.ocean);

    ctx.beginPath();
    const steps = motion === false ? 100 : Math.max(10, Math.floor(renderT * 100));
    for (let i = 0; i <= steps; i++) {
      const pt = i / 100;
      if (pt > renderT && motion !== false) break;
      const pos = getPosition(pt, currentState);
      if (i === 0) ctx.moveTo(pos.x, pos.y);
      else ctx.lineTo(pos.x, pos.y);
    }

    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    if (motion !== false) {
      const pos = getPosition(renderT, currentState);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = colorHex;
      ctx.fill();

      if (currentState === 'engineered' && renderT >= 0.45 && renderT < 0.55) {
        const pulse = (renderT - 0.45) / 0.1;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 6 + pulse * 18, 0, Math.PI * 2);
        ctx.strokeStyle = colorHex;
        ctx.lineWidth = 2 * (1 - pulse);
        ctx.stroke();
      }
    }

    if (isPlaying && motion !== false) {
      animId = requestAnimationFrame(draw);
    }
  }

  function setState(state, announceChange = false) {
    currentState = state;
    btnVague.setAttribute('aria-pressed', state === 'vague');
    btnEngineered.setAttribute('aria-pressed', state === 'engineered');
    flowBox.className = `cg-flow state-${state}`;

    textBrief.textContent = state === 'vague' ? copy.vagueBrief : copy.engineeredBrief;
    const checks = state === 'vague' ? copy.vagueChecks : copy.engineeredChecks;
    listChecks.innerHTML = checks.map(c => `<li>${c}</li>`).join('');
    textStatus.textContent = state === 'vague' ? copy.vagueStatus : copy.engineeredStatus;

    if (announceChange) {
      announce(state === 'vague' ? copy.vagueButton : copy.engineeredButton);
    }

    startTime = 0;
    pausedTime = 0;
    if (!isPlaying || motion === false) {
      draw(performance.now());
    }
  }

  btnVague.addEventListener('click', () => setState('vague', true), { signal });
  btnEngineered.addEventListener('click', () => setState('engineered', true), { signal });

  setState('vague');

  return {
    pause() {
      isPlaying = false;
      cancelAnimationFrame(animId);
    },
    resume() {
      if (!isPlaying && motion !== false) {
        isPlaying = true;
        startTime = performance.now() - pausedTime;
        draw(performance.now());
      }
    },
    reset() {
      setState('vague');
    },
    destroy() {
      cancelAnimationFrame(animId);
      root.innerHTML = '';
    },
    resize({ width, height, dpr }) {
      const cssW = flowBox.offsetWidth;
      const cssH = flowBox.offsetHeight;
      canvasRect.dpr = dpr;
      canvasRect.w = cssW * dpr;
      canvasRect.h = cssH * dpr;
      canvas.width = canvasRect.w;
      canvas.height = canvasRect.h;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.scale(dpr, dpr);

      updateWaypoints();
      draw(performance.now());
    }
  };
});
