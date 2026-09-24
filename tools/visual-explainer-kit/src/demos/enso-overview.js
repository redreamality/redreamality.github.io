registerDemo("enso-overview", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
  // 注入作用域样式与 HTML 结构
  root.innerHTML = `
    <style>
      .eo-wrapper {
        position: relative;
        min-height: 420px;
        display: flex;
        flex-direction: column;
        font-family: system-ui, -apple-system, sans-serif;
        color: var(--ink);
        box-sizing: border-box;
        padding: 16px;
      }
      .eo-canvas {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 1;
      }
      .eo-caption {
        text-align: center;
        font-size: 0.9rem;
        color: var(--muted);
        margin-bottom: 32px;
        z-index: 2;
      }
      .eo-track {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        position: relative;
        z-index: 2;
        margin-bottom: 32px;
      }
      .eo-node {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        background: transparent;
        border: none;
        padding: 0 4px;
        cursor: pointer;
        text-align: center;
      }
      .eo-node:focus-visible {
        outline: 2px solid var(--ocean);
        outline-offset: 4px;
        border-radius: 4px;
      }
      .eo-dot {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--surface);
        border: 3px solid var(--line);
        margin-bottom: 12px;
        transition: all 0.2s ease;
        position: relative;
      }
      .eo-node.active .eo-dot {
        border-color: var(--ocean);
        background: var(--ocean);
        box-shadow: 0 0 0 4px var(--surface), 0 0 0 6px var(--ocean);
      }
      .eo-label {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--muted);
        line-height: 1.3;
        transition: color 0.2s ease;
      }
      .eo-node.active .eo-label {
        color: var(--ink);
      }
      .eo-panel {
        margin-top: auto;
        background: var(--surface);
        border: 1px solid var(--line);
        border-left: 4px solid var(--ocean);
        padding: 20px;
        border-radius: 6px;
        z-index: 2;
        min-height: 100px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .eo-state {
        font-weight: 700;
        font-size: 1.1rem;
        margin: 0 0 8px 0;
        color: var(--ink);
      }
      .eo-detail {
        margin: 0;
        font-size: 0.95rem;
        line-height: 1.5;
        color: var(--muted);
      }
    </style>
    <div class="eo-wrapper" aria-label="${copy.ariaLabel}">
      <div class="eo-caption" aria-hidden="true">${copy.caption}</div>
      <canvas class="eo-canvas"></canvas>
      <div class="eo-track" role="group" aria-label="${copy.stageControlLabel}">
        ${copy.stages.map((stage, i) => `
          <button class="eo-node" data-index="${i}" aria-pressed="${i === 0}" aria-controls="eo-panel-info">
            <div class="eo-dot"></div>
            <span class="eo-label">${stage.label}</span>
          </button>
        `).join('')}
      </div>
      <div class="eo-panel" id="eo-panel-info" aria-live="polite">
        <div class="eo-state"></div>
        <div class="eo-detail"></div>
      </div>
    </div>
  `;

  // DOM 元素引用
  const wrapper = root.querySelector('.eo-wrapper');
  const canvas = root.querySelector('.eo-canvas');
  const ctx = canvas.getContext('2d');
  const nodes = root.querySelectorAll('.eo-node');
  const stateEl = root.querySelector('.eo-state');
  const detailEl = root.querySelector('.eo-detail');

  // 内部状态
  let currentIndex = 0;
  let dots = [];
  let isPlaying = true;
  let reqId = null;
  let time = 0;
  let canvasWidth = 0;
  let canvasHeight = 0;

  // 更新面板与按钮状态
  function updatePanel(index) {
    const stage = copy.stages[index];
    stateEl.textContent = stage.state;
    detailEl.textContent = stage.detail;

    nodes.forEach((btn, i) => {
      const isActive = i === index;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive);
    });

    announce(`${stage.label}: ${stage.state}. ${stage.detail}`);
  }

  // 测量节点圆点中心位置（用于 Canvas 连线与粒子动画）
  function measureDots() {
    const wrapperRect = wrapper.getBoundingClientRect();
    dots = Array.from(nodes).map(node => {
      const dot = node.querySelector('.eo-dot');
      const rect = dot.getBoundingClientRect();
      return {
        x: rect.left - wrapperRect.left + rect.width / 2,
        y: rect.top - wrapperRect.top + rect.height / 2
      };
    });
  }

  // 获取路径上的插值坐标 (t: 0 ~ stages.length - 1)
  function getPointOnPath(t) {
    const maxIndex = dots.length - 1;
    if (t <= 0) return dots[0];
    if (t >= maxIndex) return dots[maxIndex];

    const index = Math.floor(t);
    const remainder = t - index;
    const p1 = dots[index];
    const p2 = dots[index + 1];

    return {
      x: p1.x + (p2.x - p1.x) * remainder,
      y: p1.y + (p2.y - p1.y) * remainder
    };
  }

  // 核心绘制逻辑
  function draw() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    if (dots.length < 2) return;

    const lineToken = tokens.line;
    const oceanToken = tokens.ocean;
    const mutedToken = tokens.muted;

    // 1. 绘制基础底线
    ctx.beginPath();
    ctx.moveTo(dots[0].x, dots[0].y);
    for (let i = 1; i < dots.length; i++) {
      ctx.lineTo(dots[i].x, dots[i].y);
    }
    ctx.strokeStyle = resolveColor(lineToken);
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // 2. 绘制激活路径（从起点到当前选中的节点）
    if (currentIndex > 0) {
      ctx.beginPath();
      ctx.moveTo(dots[0].x, dots[0].y);
      for (let i = 1; i <= currentIndex; i++) {
        ctx.lineTo(dots[i].x, dots[i].y);
      }
      ctx.strokeStyle = resolveColor(oceanToken);
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // 3. 绘制流动粒子（仅在允许动画时）
    if (motion !== false) {
      const speed = 0.0015;
      const numParticles = 8;
      const totalSegments = dots.length - 1;

      for (let i = 0; i < numParticles; i++) {
        // 让粒子在整个链条上循环流动
        const t = ((time * speed) + (i * (totalSegments / numParticles))) % totalSegments;
        const pt = getPointOnPath(t);

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);

        // 粒子如果在当前高亮的因果链段内，则使用主题色，否则使用弱化色
        if (t <= currentIndex) {
          ctx.fillStyle = resolveColor(oceanToken);
        } else {
          ctx.fillStyle = resolveColor(mutedToken);
        }
        ctx.fill();
      }
    }
  }

  // 动画循环
  function loop(timestamp) {
    if (!isPlaying) return;
    time = timestamp;
    draw();
    reqId = requestAnimationFrame(loop);
  }

  // 事件监听：点击节点切换因果链阶段
  const track = root.querySelector('.eo-track');
  track.addEventListener('click', (e) => {
    const btn = e.target.closest('.eo-node');
    if (btn) {
      currentIndex = parseInt(btn.dataset.index, 10);
      updatePanel(currentIndex);
      if (!isPlaying) {
        draw(); // 暂停状态下点击需立即重绘以响应交互
      }
    }
  }, { signal });

  // 初始化首个状态
  updatePanel(0);

  return {
    pause() {
      isPlaying = false;
      if (reqId) cancelAnimationFrame(reqId);
      draw(); // 确保停在清晰的静态帧
    },
    resume() {
      if (!isPlaying) {
        isPlaying = true;
        reqId = requestAnimationFrame(loop);
      }
    },
    reset() {
      currentIndex = 0;
      updatePanel(currentIndex);
      time = 0;
      draw();
    },
    destroy() {
      isPlaying = false;
      if (reqId) cancelAnimationFrame(reqId);
      root.innerHTML = '';
    },
    resize({ width, height, dpr }) {
      // 容器自身的高度由内部元素撑开，取真实渲染尺寸
      const rect = wrapper.getBoundingClientRect();
      canvasWidth = rect.width;
      canvasHeight = rect.height;

      canvas.width = canvasWidth * dpr;
      canvas.height = canvasHeight * dpr;
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      measureDots();
      draw(); // 尺寸变化后立即重绘，避免闪烁
    }
  };
});
