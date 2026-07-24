registerDemo("outer-loop", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
  const nodesHtml = copy.nodes.map((node, i) => `
    <button type="button" class="node-btn" data-index="${i}" aria-label="${node.label}">
      <div class="node-dot"></div>
      <div class="node-label">${node.label}</div>
    </button>
  `).join('');

  const guardrailsHtml = copy.guardrails.map(g => `<span class="g-tag">${g}</span>`).join('');

  root.innerHTML = `
    <style>
      .outer-loop-wrapper {
        display: flex;
        flex-direction: row;
        width: 100%;
        min-height: 28rem;
        gap: 24px;
        color: var(--ink);
        font-family: system-ui, -apple-system, sans-serif;
        box-sizing: border-box;
        padding: 16px;
      }
      @media (max-width: 650px) {
        .outer-loop-wrapper {
          flex-direction: column;
        }
      }
      .canvas-section {
        flex: 1.2;
        position: relative;
        min-height: 320px;
        border: 2px dashed var(--line);
        border-radius: 12px;
        background: var(--surface);
      }
      .guardrail-title-badge {
        position: absolute;
        top: -12px;
        left: 16px;
        background: var(--surface);
        padding: 0 8px;
        font-size: 12px;
        font-weight: 600;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .outer-loop-wrapper canvas {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none;
      }
      .nodes-layer {
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none;
      }
      .node-btn {
        position: absolute;
        transform: translate(-50%, -50%);
        pointer-events: auto;
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        outline: none;
      }
      .node-dot {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--surface);
        border: 2px solid var(--line);
        transition: all 0.2s ease;
        box-shadow: 0 0 0 2px var(--surface);
      }
      .node-label {
        margin-top: 6px;
        font-size: 11px;
        font-weight: 500;
        color: var(--ink);
        text-align: center;
        width: max-content;
        max-width: 80px;
        line-height: 1.2;
        background: var(--surface);
        padding: 2px 4px;
        border-radius: 4px;
      }
      .node-btn:hover .node-dot, .node-btn:focus-visible .node-dot {
        border-color: var(--ocean);
        transform: scale(1.2);
      }
      .node-btn.active .node-dot {
        background: var(--ocean);
        border-color: var(--ocean);
      }
      .node-btn.active .node-label {
        color: var(--ocean);
        font-weight: 700;
      }
      .info-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 24px;
        justify-content: center;
      }
      .detail-panel {
        background: var(--paper);
        border-left: 4px solid var(--ocean);
        padding: 16px;
        border-radius: 0 8px 8px 0;
      }
      .detail-title {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
      }
      .detail-desc {
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
        color: var(--muted);
      }
      .guardrails-panel {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .g-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--muted);
        text-transform: uppercase;
      }
      .g-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .g-tag {
        font-size: 12px;
        padding: 4px 8px;
        background: var(--line);
        border-radius: 12px;
        color: var(--ink);
        opacity: 0.8;
      }
    </style>
    <div class="outer-loop-wrapper" role="region" aria-label="${copy.ariaLabel}">
      <div class="canvas-section">
        <div class="guardrail-title-badge">${copy.guardrailLabel}</div>
        <canvas></canvas>
        <div class="nodes-layer">
          ${nodesHtml}
        </div>
      </div>
      <div class="info-section">
        <div class="detail-panel" aria-live="polite">
          <h3 class="detail-title"></h3>
          <p class="detail-desc"></p>
        </div>
        <div class="guardrails-panel">
          <div class="g-title">${copy.guardrailLabel}</div>
          <div class="g-tags">${guardrailsHtml}</div>
        </div>
      </div>
    </div>
  `;

  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const canvasSection = root.querySelector('.canvas-section');
  const buttons = root.querySelectorAll('.node-btn');
  const detailTitle = root.querySelector('.detail-title');
  const detailDesc = root.querySelector('.detail-desc');

  let isPlaying = false;
  let animationFrameId;
  let lastTime = 0;
  let progress = 0;
  let activeIndex = -1;
  let pts = [];
  let cw = 0, ch = 0;

  function setActive(index, userInitiated = false) {
    if (index === activeIndex) return;
    activeIndex = index;
    const node = copy.nodes[index];
    detailTitle.textContent = node.label;
    detailDesc.textContent = node.detail;

    buttons.forEach((btn, i) => {
      const isActive = i === index;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive);
    });

    if (userInitiated) {
      announce(`${node.label}: ${node.detail}`);
    }
    draw();
  }

  buttons.forEach((btn) => {
    const handler = (e) => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      progress = idx;
      setActive(idx, e.type === 'click');
    };
    btn.addEventListener('click', handler, { signal });
    btn.addEventListener('focus', handler, { signal });
  });

  function drawArrow(p1, p2, color) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 30) return;

    const ux = dx / dist;
    const uy = dy / dist;
    const gap = 16;
    const start = { x: p1.x + ux * gap, y: p1.y + uy * gap };
    const end = { x: p2.x - ux * gap, y: p2.y - uy * gap };

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    const headlen = 8;
    const angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - headlen * Math.cos(angle - Math.PI/6), end.y - headlen * Math.sin(angle - Math.PI/6));
    ctx.lineTo(end.x - headlen * Math.cos(angle + Math.PI/6), end.y - headlen * Math.sin(angle + Math.PI/6));
    ctx.fillStyle = color;
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const nodeCount = copy.nodes.length;
    if (pts.length !== nodeCount) return;

    const colorLine = resolveColor(tokens.line);
    const colorOcean = resolveColor(tokens.ocean);

    for (let i = 0; i < nodeCount; i++) {
      drawArrow(pts[i], pts[(i + 1) % nodeCount], colorLine);
    }

    if (motion !== false) {
      const curr = Math.floor(progress) % nodeCount;
      const next = (curr + 1) % nodeCount;
      const t = progress % 1;

      const p1 = pts[curr];
      const p2 = pts[next];
      const px = p1.x + (p2.x - p1.x) * t;
      const py = p1.y + (p2.y - p1.y) * t;

      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = colorOcean;
      ctx.fill();

      ctx.shadowColor = colorOcean;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function loop(time) {
    if (!lastTime) lastTime = time;
    const dt = time - lastTime;
    lastTime = time;

    if (isPlaying && motion !== false) {
      progress = (progress + dt / 3000) % copy.nodes.length;
      const newIndex = Math.floor(progress) % copy.nodes.length;
      if (newIndex !== activeIndex) {
        setActive(newIndex);
      }
    }

    draw();

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(loop);
    }
  }

  setActive(0);

  return {
    pause() {
      isPlaying = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      draw();
    },
    resume() {
      if (!isPlaying) {
        isPlaying = true;
        lastTime = performance.now();
        loop(lastTime);
      }
    },
    reset() {
      progress = 0;
      setActive(0);
      draw();
    },
    destroy() {
      isPlaying = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      root.innerHTML = '';
    },
    resize({ width, height, dpr }) {
      cw = canvasSection.clientWidth;
      ch = canvasSection.clientHeight;
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      ctx.scale(dpr, dpr);

      const cx = cw / 2;
      const cy = ch / 2;
      const R = Math.min(cw, ch) / 2 - 40;

      pts = [];
      for (let i = 0; i < copy.nodes.length; i++) {
        const angle = -Math.PI / 2 + (Math.PI * 2 / copy.nodes.length) * i;
        const x = cx + R * Math.cos(angle);
        const y = cy + R * Math.sin(angle);
        pts.push({ x, y });

        buttons[i].style.left = `${x}px`;
        buttons[i].style.top = `${y}px`;
      }

      draw();
    }
  };
});
