registerDemo("workflow-blueprint", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
  root.innerHTML = `
    <style>
      .wb-container {
        --wb-ink: ${tokens.ink};
        --wb-muted: ${tokens.muted};
        --wb-line: ${tokens.line};
        --wb-ocean: ${tokens.ocean};
        --wb-warm: ${tokens.warm};
        --wb-coral: ${tokens.coral};
        --wb-paper: ${tokens.paper};
        --wb-surface: ${tokens.surface};

        display: flex;
        flex-direction: row;
        width: 100%;
        min-height: 100%;
        box-sizing: border-box;
        font-family: system-ui, -apple-system, sans-serif;
        background: var(--wb-surface);
        color: var(--wb-ink);
        overflow: hidden;
      }
      .wb-canvas-box {
        flex: 1 1 50%;
        position: relative;
        min-height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .wb-canvas-box canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
      .wb-info-box {
        flex: 1 1 50%;
        max-width: 450px;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        border-left: 1px solid var(--wb-line);
        background: var(--wb-paper);
      }
      .wb-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      .wb-stage-label {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--wb-ocean);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .wb-next-btn {
        background: var(--wb-surface);
        color: var(--wb-ink);
        border: 1px solid var(--wb-line);
        padding: 0.4rem 0.8rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 500;
        transition: all 0.2s;
      }
      .wb-next-btn:hover {
        border-color: var(--wb-ocean);
        color: var(--wb-ocean);
      }
      .wb-next-btn:focus-visible {
        outline: 2px solid var(--wb-ocean);
        outline-offset: 2px;
      }
      .wb-phase-title {
        margin: 0 0 1.2rem 0;
        font-size: 1.4rem;
        font-weight: 700;
      }
      .wb-detail-item {
        margin-bottom: 0.8rem;
      }
      .wb-detail-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--wb-muted);
        margin-bottom: 0.2rem;
        font-weight: 600;
      }
      .wb-detail-value {
        font-size: 0.95rem;
        line-height: 1.5;
      }
      .wb-decision {
        margin-top: auto;
        padding: 1rem;
        background: var(--wb-surface);
        border-left: 4px solid var(--wb-coral);
        font-size: 0.9rem;
        line-height: 1.5;
        font-style: italic;
        border-radius: 0 4px 4px 0;
      }
      @media (max-width: 768px) {
        .wb-container {
          flex-direction: column;
        }
        .wb-info-box {
          max-width: 100%;
          border-left: none;
          border-top: 1px solid var(--wb-line);
          padding: 1rem;
        }
        .wb-canvas-box {
          min-height: 250px;
          flex: 0 0 250px;
        }
      }
    </style>
    <div class="wb-container workflow-demo" data-phase="0">
      <div class="wb-canvas-box">
        <canvas role="img"></canvas>
      </div>
      <div class="wb-info-box">
        <div class="wb-header">
          <div class="wb-stage-label workflow-stage-label" aria-live="polite"></div>
          <button type="button" class="wb-next-btn"></button>
        </div>
        <h3 class="wb-phase-title"></h3>
        <div class="wb-details">
          <div class="wb-detail-item">
            <div class="wb-detail-label actor-label"></div>
            <div class="wb-detail-value actor-value"></div>
          </div>
          <div class="wb-detail-item">
            <div class="wb-detail-label action-label"></div>
            <div class="wb-detail-value action-value"></div>
          </div>
          <div class="wb-detail-item">
            <div class="wb-detail-label artifact-label"></div>
            <div class="wb-detail-value artifact-value"></div>
          </div>
        </div>
        <div class="wb-decision"></div>
      </div>
    </div>
  `;

  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const scene = root.querySelector('.workflow-demo');
  const nextBtn = root.querySelector('.wb-next-btn');

  canvas.setAttribute('aria-label', copy.ariaLabel);
  root.querySelector('.actor-label').textContent = copy.actorLabel;
  root.querySelector('.action-label').textContent = copy.actionLabel;
  root.querySelector('.artifact-label').textContent = copy.artifactLabel;
  nextBtn.textContent = copy.nextButton;

  let stage = 0;
  let prevStage = 0;
  let isPlaying = motion !== false;
  let lastFrameTime = 0;
  let stageTimer = 0;
  let transitionStart = 0;
  let animId;
  let width = 0, height = 0, dpr = 1;
  let colors = {};

  function refreshColors() {
    colors = {
      ink: resolveColor(tokens.ink),
      line: resolveColor(tokens.line),
      ocean: resolveColor(tokens.ocean),
      coral: resolveColor(tokens.coral),
      surface: resolveColor(tokens.surface)
    };
    canvas.dataset.oceanColor = colors.ocean;
  }

  const TOTAL_STAGES = copy.phases.length;
  const STAGE_DURATION = 4000;
  const TRANSITION_DURATION = 600;

  function updateDOM(newStage, manual = false) {
    prevStage = stage;
    stage = newStage;
    transitionStart = isPlaying && motion !== false ? performance.now() : 0;

    const phase = copy.phases[stage];
    scene.dataset.phase = String(stage);

    root.querySelector('.wb-stage-label').textContent = copy.stageLabel
      .replace('{current}', stage + 1)
      .replace('{total}', TOTAL_STAGES);
    root.querySelector('.wb-phase-title').textContent = phase.label;
    root.querySelector('.actor-value').textContent = phase.actor;
    root.querySelector('.action-value').textContent = phase.action;
    root.querySelector('.artifact-value').textContent = phase.artifact;
    root.querySelector('.wb-decision').textContent = phase.decision;

    if (manual && announce) {
      announce(`${phase.label}: ${phase.action}`);
    }
  }

  function getAngle(index) {
    return index * (Math.PI * 2) / TOTAL_STAGES - Math.PI / 2;
  }

  function render(time) {
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const rx = Math.max(20, width / 2 - 35);
    const ry = Math.max(20, height / 2 - 35);
    const nodeRadius = 14;

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    let elapsed = time - transitionStart;
    let isTransitioning = isPlaying && (motion !== false) && (elapsed < TRANSITION_DURATION) && (prevStage !== stage);

    if (isTransitioning) {
      let progress = Math.max(0, Math.min(1, elapsed / TRANSITION_DURATION));
      progress = 1 - Math.pow(1 - progress, 3);

      let startAngle = getAngle(prevStage);
      let endAngle = getAngle(stage);
      if (prevStage === TOTAL_STAGES - 1 && stage === 0) {
        endAngle = startAngle + (Math.PI * 2 / TOTAL_STAGES);
      }
      let currentAngle = startAngle + (endAngle - startAngle) * progress;

      let px = cx + rx * Math.cos(currentAngle);
      let py = cy + ry * Math.sin(currentAngle);

      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = colors.coral;
      ctx.fill();
    }

    for (let i = 0; i < TOTAL_STAGES; i++) {
      let angle = getAngle(i);
      let x = cx + rx * Math.cos(angle);
      let y = cy + ry * Math.sin(angle);
      let isActive = (i === stage);

      ctx.beginPath();
      ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? colors.ocean : colors.surface;
      ctx.fill();

      ctx.strokeStyle = isActive ? colors.ocean : colors.line;
      ctx.lineWidth = isActive ? 2 : 1.5;
      ctx.stroke();

      ctx.fillStyle = isActive ? colors.surface : colors.ink;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(i + 1, x, y);

      if (isActive && motion !== false && !isTransitioning) {
        let pulse = (Math.sin(time / 200) + 1) / 2;
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius + 3 + pulse * 2, 0, Math.PI * 2);
        ctx.strokeStyle = colors.ocean;
        ctx.globalAlpha = 0.4 - pulse * 0.2;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    }
  }

  function loop(time) {
    if (!lastFrameTime) lastFrameTime = time;
    let dt = time - lastFrameTime;
    lastFrameTime = time;

    if (isPlaying && motion !== false) {
      stageTimer += dt;
      if (stageTimer > STAGE_DURATION) {
        stageTimer = 0;
        updateDOM((stage + 1) % TOTAL_STAGES);
      }
    }

    render(time);

    let elapsed = time - transitionStart;
    let isTransitioning = isPlaying && (motion !== false) && (elapsed < TRANSITION_DURATION);

    if (isPlaying || isTransitioning) {
      animId = requestAnimationFrame(loop);
    } else {
      animId = null;
    }
  }

  nextBtn.addEventListener('click', () => {
    stageTimer = 0;
    updateDOM((stage + 1) % TOTAL_STAGES, true);
    render(performance.now());
    if (isPlaying && !animId) {
      lastFrameTime = performance.now();
      animId = requestAnimationFrame(loop);
    }
  }, { signal });

  updateDOM(0);

  return {
    pause() {
      isPlaying = false;
      if (animId) cancelAnimationFrame(animId);
      animId = null;
      transitionStart = 0;
      render(performance.now());
    },
    resume() {
      if (motion !== false) {
        if (isPlaying && animId) return;
        isPlaying = true;
        lastFrameTime = 0;
        if (!animId) animId = requestAnimationFrame(loop);
      }
    },
    reset() {
      stageTimer = 0;
      updateDOM(0);
      prevStage = 0;
      transitionStart = 0;
      lastFrameTime = 0;
      render(performance.now());
      if (!animId && isPlaying) animId = requestAnimationFrame(loop);
    },
    destroy() {
      if (animId) cancelAnimationFrame(animId);
      root.innerHTML = '';
    },
    resize({ width: stageWidth, height: stageHeight, dpr: nextDpr }) {
      refreshColors();
      const compact = stageWidth <= 768;
      const infoWidth = compact ? 0 : Math.min(450, stageWidth / 2);
      width = compact ? stageWidth : Math.max(240, stageWidth - infoWidth - 1);
      height = compact ? 250 : Math.max(300, stageHeight);
      dpr = nextDpr;

      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      render(performance.now());
    }
  };
});
