registerDemo("r0-chains", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
  // 注入 HTML 和 CSS
  root.innerHTML = `
    <style>
      .r0-chains {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        min-height: 480px;
        font-family: system-ui, sans-serif;
        position: relative;
        width: 100%;
      }
      .r0-chains-header {
        display: flex;
        flex-wrap: wrap;
        gap: 1.5rem;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        background: ${tokens.surface};
        border: 1px solid ${tokens.line};
        border-radius: 8px;
      }
      .r0-chains-control {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;
        min-width: 200px;
      }
      .r0-chains-control label {
        font-size: 0.9rem;
        color: ${tokens.ink};
        font-weight: 500;
        white-space: nowrap;
      }
      .r0-chains-slider {
        flex: 1;
        cursor: pointer;
        accent-color: ${tokens.ocean};
      }
      .r0-chains-legend {
        display: flex;
        gap: 1rem;
        font-size: 0.85rem;
        color: ${tokens.muted};
        flex-wrap: wrap;
      }
      .r0-chains-legend-item {
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }
      .r0-chains-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }
      .r0-chains-dot.susceptible {
        background: ${tokens.surface};
        border: 1px solid ${tokens.line};
      }
      .r0-chains-dot.immune {
        background: ${tokens.ocean};
      }
      .r0-chains-dot.infected {
        background: ${tokens.coral};
      }
      .r0-chains-canvas-wrap {
        position: relative;
        flex: 1;
        min-height: 320px;
        width: 100%;
      }
      .r0-chains-canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        outline: none;
      }
      .r0-chains-status {
        font-size: 0.95rem;
        color: ${tokens.ink};
        text-align: center;
        min-height: 1.5em;
        padding: 0 0.5rem;
      }
    </style>
    <div class="r0-chains" aria-label="${copy.ariaLabel}">
      <div class="r0-chains-header">
        <div class="r0-chains-control">
          <label for="r0-chains-slider">${copy.coverageLabel}</label>
          <input type="range" id="r0-chains-slider" class="r0-chains-slider" min="0" max="1" step="0.01" value="0.2" aria-label="${copy.controlLabel}">
        </div>
        <div class="r0-chains-legend">
          <div class="r0-chains-legend-item">
            <div class="r0-chains-dot susceptible"></div>
            <span>${copy.susceptibleLabel}</span>
          </div>
          <div class="r0-chains-legend-item">
            <div class="r0-chains-dot immune"></div>
            <span>${copy.immuneLabel}</span>
          </div>
          <div class="r0-chains-legend-item">
            <div class="r0-chains-dot infected"></div>
            <span>${copy.infectedLabel}</span>
          </div>
        </div>
      </div>
      <div class="r0-chains-canvas-wrap">
        <canvas class="r0-chains-canvas"></canvas>
      </div>
      <div class="r0-chains-status" aria-live="polite"></div>
    </div>
  `;

  // DOM 节点引用
  const slider = root.querySelector('#r0-chains-slider');
  const canvasWrap = root.querySelector('.r0-chains-canvas-wrap');
  const canvas = root.querySelector('.r0-chains-canvas');
  const statusDiv = root.querySelector('.r0-chains-status');
  const ctx = canvas.getContext('2d');

  // 状态变量
  let canvasWidth = 0;
  let canvasHeight = 0;
  let currentDpr = 1;
  let time = motion === false ? Infinity : 0;
  let isPlaying = motion !== false;
  let animationFrameId = null;
  let lastTime = performance.now();

  // 确定的随机数生成器 (SplitMix32)，保证每次重置/渲染树的结构和免疫节点分布完全一致
  function splitmix32(a) {
    return function() {
      a |= 0; a = a + 0x9e3779b9 | 0;
      let t = a ^ a >>> 16; t = Math.imul(t, 0x21f0aaad);
      t = t ^ t >>> 15; t = Math.imul(t, 0x735a2d97);
      return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
    }
  }

  // 构建树结构
  let nodes = [];
  let idCounter = 0;
  
  function buildTree() {
    nodes = [];
    idCounter = 0;
    const rng = splitmix32(42); 

    function buildNode(depth, minX, maxX, parent) {
      // 增加轻微的随机偏移，使树看起来更自然，但不超出分配的水平区间
      let x = minX + (maxX - minX) * (0.5 + (rng() - 0.5) * 0.3);
      let y = 0.1 + (depth / 4) * 0.8; 
      
      // 根节点强制居中
      if (depth === 0) {
        x = 0.5;
        y = 0.08;
      }

      let node = {
        id: idCounter++,
        depth, x, y,
        threshold: rng(), // 用于决定是否免疫的阈值
        parent, children: [],
        isImmune: false,
        linkStartTime: Infinity,
        linkEndTime: Infinity,
        infectedTime: Infinity
      };
      nodes.push(node);

      // 最大深度为 4
      if (depth < 4) {
        // 根节点 3 个分支，其余 2 个分支
        let numChildren = depth === 0 ? 3 : 2;
        let step = (maxX - minX) / numChildren;
        for (let i = 0; i < numChildren; i++) {
          let childMinX = minX + i * step;
          let childMaxX = childMinX + step;
          node.children.push(buildNode(depth + 1, childMinX, childMaxX, node));
        }
      }
      return node;
    }
    
    buildNode(0, 0.02, 0.98, null);
  }

  // 根据当前覆盖率计算每个节点的感染时间
  function updateInfectionState(coverage) {
    // 根节点始终是感染源
    nodes[0].isImmune = false;
    nodes[0].infectedTime = 0;

    // 节点在 buildTree 时按先序遍历加入，保证了拓扑排序，可以直接线性计算
    for (let i = 1; i < nodes.length; i++) {
      let n = nodes[i];
      n.isImmune = n.threshold < coverage;

      let p = n.parent;
      if (p.infectedTime < Infinity) {
        n.linkStartTime = p.infectedTime;
        n.linkEndTime = p.infectedTime + 600; // 每层传播耗时 600ms
        
        if (!n.isImmune) {
          n.infectedTime = n.linkEndTime;
        } else {
          n.infectedTime = Infinity; // 免疫节点阻断传播
        }
      } else {
        n.linkStartTime = Infinity;
        n.linkEndTime = Infinity;
        n.infectedTime = Infinity;
      }
    }
  }

  function updateStatusText(coverage) {
    const isHigh = coverage >= 0.5;
    const newText = isHigh ? copy.statusHigh : copy.statusLow;
    if (statusDiv.textContent !== newText) {
      statusDiv.textContent = newText;
    }
  }

  // 绘制函数
  function draw() {
    if (!ctx || canvasWidth === 0) return;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const surfaceColor = resolveColor(tokens.surface);
    const lineColor = resolveColor(tokens.line);
    const oceanColor = resolveColor(tokens.ocean);
    const coralColor = resolveColor(tokens.coral);

    // 1. 绘制所有潜在的传播路径（半透明底色）
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1.5 * currentDpr;
    ctx.strokeStyle = lineColor;
    ctx.beginPath();
    for (let i = 1; i < nodes.length; i++) {
      let n = nodes[i];
      let p = n.parent;
      ctx.moveTo(p.x * canvasWidth, p.y * canvasHeight);
      ctx.lineTo(n.x * canvasWidth, n.y * canvasHeight);
    }
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // 2. 绘制实际发生的感染路径（动态生长）
    ctx.lineWidth = 2.5 * currentDpr;
    ctx.strokeStyle = coralColor;
    for (let i = 1; i < nodes.length; i++) {
      let n = nodes[i];
      if (time > n.linkStartTime) {
        let p = n.parent;
        let progress = Math.min(1, (time - n.linkStartTime) / (n.linkEndTime - n.linkStartTime));
        let cx = p.x + (n.x - p.x) * progress;
        let cy = p.y + (n.y - p.y) * progress;
        
        ctx.beginPath();
        ctx.moveTo(p.x * canvasWidth, p.y * canvasHeight);
        ctx.lineTo(cx * canvasWidth, cy * canvasHeight);
        ctx.stroke();
      }
    }

    // 3. 绘制节点
    const radius = 4.5 * currentDpr;
    for (let i = 0; i < nodes.length; i++) {
      let n = nodes[i];
      let x = n.x * canvasWidth;
      let y = n.y * canvasHeight;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);

      if (n.isImmune) {
        ctx.fillStyle = oceanColor;
        ctx.fill();
      } else if (time >= n.infectedTime) {
        ctx.fillStyle = coralColor;
        ctx.fill();
      } else {
        ctx.fillStyle = surfaceColor;
        ctx.fill();
        ctx.lineWidth = 1.5 * currentDpr;
        ctx.strokeStyle = lineColor;
        ctx.stroke();
      }
    }
  }

  // 动画循环
  function loop(timestamp) {
    if (!isPlaying) return;
    let dt = timestamp - lastTime;
    lastTime = timestamp;
    
    // 防止切后台导致 dt 过大
    if (dt > 100) dt = 16;
    
    time += dt;
    draw();
    animationFrameId = requestAnimationFrame(loop);
  }

  // 事件监听
  slider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    updateInfectionState(val);
    updateStatusText(val);
    draw(); // 拖拽时立即重绘以提供实时反馈
  }, { signal });

  slider.addEventListener('change', () => {
    // 释放滑块时，朗读当前状态
    announce(statusDiv.textContent);
  }, { signal });

  // 初始化数据
  buildTree();
  updateInfectionState(parseFloat(slider.value));
  updateStatusText(parseFloat(slider.value));

  return {
    resize({ width, height, dpr }) {
      // 依据容器的实际可用区域设置 Canvas 尺寸
      canvasWidth = canvasWrap.clientWidth;
      canvasHeight = canvasWrap.clientHeight;
      currentDpr = dpr;
      
      canvas.width = canvasWidth * dpr;
      canvas.height = canvasHeight * dpr;
      
      draw();
    },
    pause() {
      isPlaying = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      draw();
    },
    resume() {
      if (!isPlaying && motion !== false) {
        isPlaying = true;
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(loop);
      }
    },
    reset() {
      slider.value = 0.2;
      updateInfectionState(0.2);
      updateStatusText(0.2);
      time = motion === false ? Infinity : 0;
      lastTime = performance.now();
      draw();
    },
    destroy() {
      isPlaying = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      root.innerHTML = '';
    }
  };
});
