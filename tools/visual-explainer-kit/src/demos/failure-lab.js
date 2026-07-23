registerDemo("failure-lab", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
  root.innerHTML = `
    <style>
      .lab-container {
        display: flex;
        flex-direction: column;
        gap: 24px;
        min-height: 100%;
        font-family: system-ui, -apple-system, sans-serif;
        color: ${tokens.ink};
        box-sizing: border-box;
        padding: 16px;
      }
      @media (min-width: 768px) {
        .lab-container { flex-direction: row; }
        .control-panel { width: 340px; flex-shrink: 0; }
      }
      @media (max-width: 767px) {
        .visual-panel { flex: 0 0 320px; }
      }
      .visual-panel {
        flex: 1;
        min-height: 320px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      canvas {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        outline: none;
      }
      .control-panel {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .controls-header {
        font-weight: 600;
        font-size: 14px;
      }
      .buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      button {
        background: ${tokens.surface};
        color: ${tokens.ink};
        border: 1px solid ${tokens.line};
        padding: 8px 14px;
        border-radius: 16px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
      }
      button:hover {
        border-color: ${tokens.muted};
      }
      button:focus-visible {
        outline: 2px solid ${tokens.ocean};
        outline-offset: 2px;
      }
      button[aria-pressed="true"] {
        background: ${tokens.ocean};
        color: ${tokens.surface};
        border-color: ${tokens.ocean};
      }
      button[data-id]:not([data-id="healthy"])[aria-pressed="true"] {
        background: ${tokens.coral};
        border-color: ${tokens.coral};
      }
      .info-panel {
        background: ${tokens.surface};
        border: 1px solid ${tokens.line};
        border-radius: 8px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        font-size: 14px;
        line-height: 1.5;
      }
      .info-status {
        font-weight: 600;
        font-size: 15px;
      }
      .info-risk-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .risk-badge {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.5px;
      }
      .risk-low { background: ${tokens.ocean}; color: ${tokens.surface}; }
      .risk-medium { background: ${tokens.warm}; color: ${tokens.surface}; }
      .risk-critical { background: ${tokens.coral}; color: ${tokens.surface}; }
      .info-symptom, .info-repair {
        color: ${tokens.muted};
      }
      .info-symptom strong, .info-repair strong {
        color: ${tokens.ink};
      }
    </style>
    <div class="lab-container failure-lab-demo" data-component="healthy">
      <div class="visual-panel">
        <canvas role="img" aria-label="${copy.ariaLabel}"></canvas>
      </div>
      <div class="control-panel">
        <div class="controls-header">${copy.controlLabel}</div>
        <div class="buttons">
          <button type="button" data-id="healthy" aria-pressed="true">${copy.healthyButton}</button>
          ${copy.components.map(c => `<button type="button" data-id="${c.id}" aria-pressed="false">${c.label}</button>`).join('')}
        </div>
        <div class="info-panel">
          <div class="info-status"></div>
          <div class="info-risk-row">
            <span class="risk-label">${copy.riskLabel}</span>
            <span class="risk-badge"></span>
          </div>
          <div class="info-symptom">
            <strong>${copy.symptomLabel}:</strong> <span class="symptom-text"></span>
          </div>
          <div class="info-repair">
            <strong>${copy.repairLabel}:</strong> <span class="repair-text"></span>
          </div>
        </div>
      </div>
    </div>
  `;

  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const scene = root.querySelector('.failure-lab-demo');
  const buttons = root.querySelectorAll('button');
  const infoPanel = root.querySelector('.info-panel');
  const statusEl = infoPanel.querySelector('.info-status');
  const badgeEl = infoPanel.querySelector('.risk-badge');
  const symptomEl = infoPanel.querySelector('.symptom-text');
  const repairEl = infoPanel.querySelector('.repair-text');

  let activeId = 'healthy';
  let width = 0, height = 0, dpr = 1;
  let isPlaying = true;
  let frameId;
  let particles = [];
  let colors = {};

  function refreshColors() {
    colors = {
      ink: resolveColor(tokens.ink),
      muted: resolveColor(tokens.muted),
      line: resolveColor(tokens.line),
      ocean: resolveColor(tokens.ocean),
      coral: resolveColor(tokens.coral),
      surface: resolveColor(tokens.surface)
    };
    canvas.dataset.oceanColor = colors.ocean;
  }

  const nodes = copy.components.map((c, i) => ({
    ...c,
    angle: (i / copy.components.length) * Math.PI * 2 - Math.PI / 2
  }));

  function updateInfo(shouldAnnounce = false) {
    let data;
    let badgeClass = 'risk-low';
    let severityText = copy.healthyScore;

    if (activeId === 'healthy') {
      data = {
        symptom: copy.healthySymptom,
        repair: copy.healthyRepair,
        status: copy.healthyStatus
      };
    } else {
      data = copy.components.find(c => c.id === activeId);
      severityText = data.severity;
      if (data.id === 'stop' || data.id === 'human') badgeClass = 'risk-critical';
      else badgeClass = 'risk-medium';
    }

    scene.dataset.component = activeId;
    statusEl.textContent = data.status;
    badgeEl.textContent = severityText;
    badgeEl.className = `risk-badge ${badgeClass}`;
    symptomEl.textContent = data.symptom;
    repairEl.textContent = data.repair;

    buttons.forEach(btn => {
      btn.setAttribute('aria-pressed', btn.dataset.id === activeId);
    });

    if (shouldAnnounce) announce(`${data.status}. ${copy.symptomLabel}: ${data.symptom}`);
  }

  function spawnParticle() {
    const brokenIndex = activeId === 'healthy' ? -1 : nodes.findIndex(n => n.id === activeId);
    let spawnProgress = brokenIndex === -1
      ? Math.random()
      : ((brokenIndex + 1) % nodes.length) / nodes.length;

    if (brokenIndex === -1 && particles.length < 100) {
      spawnProgress = Math.random();
    }

    particles.push({
      progress: spawnProgress,
      travel: 0,
      rOffset: (Math.random() - 0.5) * 16,
      speed: 0.002 + Math.random() * 0.002,
      state: 'normal',
      x: 0, y: 0, vx: 0, vy: 0, alpha: 1
    });
  }

  function updateParticles() {
    const brokenIndex = activeId === 'healthy' ? -1 : nodes.findIndex(n => n.id === activeId);
    const cx = width / 2;
    const cy = height / 2;
    const R = Math.max(50, Math.min(width, height) / 2 - 60);

    if (particles.length < 150) {
      spawnParticle();
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      let p = particles[i];
      if (p.state === 'normal') {
        p.progress = (p.progress + p.speed) % 1;
        p.travel += p.speed;

        if (brokenIndex !== -1 && p.travel >= (nodes.length - 1) / nodes.length) {
          p.state = 'broken';
          let angle = p.progress * Math.PI * 2 - Math.PI / 2;
          let speed = 0.5 + Math.random() * 1.5;
          let scatterAngle = angle + (Math.random() - 0.5) * Math.PI;
          p.vx = Math.cos(scatterAngle) * speed;
          p.vy = Math.sin(scatterAngle) * speed;
          p.x = cx + (R + p.rOffset) * Math.cos(angle);
          p.y = cy + (R + p.rOffset) * Math.sin(angle);
        }
      } else {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }
    }
  }

  function draw() {
    if (!width || !height) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    const cx = width / 2;
    const cy = height / 2;
    const R = Math.max(50, Math.min(width, height) / 2 - 60);

    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 2;
    ctx.stroke();

    particles.forEach(p => {
      let px, py;
      if (p.state === 'normal') {
        let angle = p.progress * Math.PI * 2 - Math.PI / 2;
        let r = R + p.rOffset;
        px = cx + r * Math.cos(angle);
        py = cy + r * Math.sin(angle);
      } else {
        px = p.x;
        py = p.y;
      }

      ctx.fillStyle = p.state === 'normal' ? colors.ocean : colors.coral;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    nodes.forEach((node) => {
      let nx = cx + R * Math.cos(node.angle);
      let ny = cy + R * Math.sin(node.angle);
      let isBroken = activeId === node.id;

      ctx.beginPath();
      ctx.arc(nx, ny, 14, 0, Math.PI * 2);
      ctx.fillStyle = colors.surface;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(nx, ny, 8, 0, Math.PI * 2);
      ctx.fillStyle = isBroken ? colors.coral : (activeId === 'healthy' ? colors.ocean : colors.muted);
      ctx.fill();

      let align = 'center';
      let baseline = 'middle';
      let lx = nx, ly = ny;
      const cosA = Math.cos(node.angle);
      const sinA = Math.sin(node.angle);

      if (Math.abs(cosA) > 0.1) {
        align = cosA > 0 ? 'left' : 'right';
        lx += cosA * 22;
      } else {
        ly += sinA * 22;
      }
      if (Math.abs(sinA) > 0.1 && Math.abs(cosA) <= 0.1) {
        baseline = sinA > 0 ? 'top' : 'bottom';
      }

      ctx.textAlign = align;
      ctx.textBaseline = baseline;
      ctx.font = '12px system-ui, -apple-system, sans-serif';

      ctx.lineWidth = 4;
      ctx.strokeStyle = colors.surface;
      ctx.strokeText(node.label, lx, ly);

      ctx.fillStyle = colors.ink;
      ctx.fillText(node.label, lx, ly);
    });

    ctx.restore();
  }

  function triggerUpdate() {
    particles = [];
    for (let i = 0; i < 300; i++) updateParticles();
    draw();
  }

  function loop() {
    if (!isPlaying || !motion) return;
    updateParticles();
    draw();
    frameId = requestAnimationFrame(loop);
  }

  root.querySelector('.buttons').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    activeId = btn.dataset.id;
    updateInfo(true);
    triggerUpdate();
  }, { signal });

  updateInfo();

  return {
    pause() {
      isPlaying = false;
      cancelAnimationFrame(frameId);
      frameId = undefined;
      draw();
    },
    resume() {
      if (isPlaying && frameId) return;
      isPlaying = true;
      if (motion && !frameId) {
        frameId = requestAnimationFrame(loop);
      }
    },
    reset() {
      activeId = 'healthy';
      updateInfo();
      triggerUpdate();
    },
    destroy() {
      cancelAnimationFrame(frameId);
      root.innerHTML = '';
    },
    resize({ width: stageWidth, height: stageHeight, dpr: nextDpr }) {
      refreshColors();
      dpr = nextDpr;
      width = Math.max(220, stageWidth >= 768 ? stageWidth - 396 : stageWidth - 32);
      height = stageWidth >= 768 ? Math.max(260, stageHeight - 32) : 320;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      triggerUpdate();
    }
  };
});
