registerDemo("layer-stack", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
  const palette = [tokens.ocean, tokens.coral, tokens.warm, tokens.ink, tokens.muted];
  const tokenKeys = copy.layers.map((_, index) => palette[index % palette.length]);

  root.innerHTML = `
    <style>
      .layer-stack-wrapper {
        display: flex;
        flex-direction: row;
        gap: 24px;
        width: 100%;
        min-height: 28rem;
        box-sizing: border-box;
        font-family: system-ui, -apple-system, sans-serif;
        color: ${tokens.ink};
      }
      .layer-stack-wrapper.is-mobile {
        flex-direction: column;
      }
      .canvas-container {
        flex: 1 1 50%;
        position: relative;
        min-height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .layer-stack-wrapper.is-mobile .canvas-container {
        min-height: 250px;
        flex: 0 0 auto;
      }
      .layer-stack-wrapper canvas {
        display: block;
        max-width: 100%;
        max-height: 100%;
        cursor: pointer;
        outline: none;
      }
      .layer-stack-wrapper canvas:focus-visible {
        outline: 3px solid ${tokens.ocean};
        outline-offset: 4px;
        border-radius: 50%;
      }
      .controls-container {
        flex: 1 1 50%;
        display: flex;
        flex-direction: column;
        gap: 8px;
        justify-content: center;
      }
      .buttons-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .layer-btn {
        display: block;
        width: 100%;
        text-align: left;
        padding: 12px 16px;
        background: ${tokens.paper};
        border: 2px solid ${tokens.line};
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
      }
      .layer-btn:hover {
        border-color: ${tokens.muted};
      }
      .layer-btn[aria-pressed="true"] {
        background: ${tokens.surface};
      }
      .layer-btn .label {
        font-weight: 600;
        font-size: 1rem;
        margin-bottom: 4px;
      }
      .layer-btn .short {
        font-size: 0.85rem;
        color: ${tokens.muted};
      }
      .detail-panel {
        margin-top: 12px;
        padding: 16px;
        background: ${tokens.surface};
        border-radius: 8px;
        border-left: 4px solid ${tokens.line};
        display: none;
      }
      .detail-panel.active {
        display: block;
        animation: fadeIn 0.3s ease;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .detail-label-title {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: ${tokens.muted};
        margin-bottom: 8px;
      }
      .detail-text {
        font-size: 0.95rem;
        line-height: 1.5;
        margin-bottom: 12px;
      }
      .example-text {
        font-size: 0.85rem;
        line-height: 1.4;
        color: ${tokens.muted};
        font-style: italic;
      }
    </style>
    <div class="layer-stack-wrapper">
      <div class="canvas-container">
        <canvas role="img" aria-label="${copy.ariaLabel}" tabindex="0"></canvas>
      </div>
      <div class="controls-container">
        <div class="buttons-group" role="group" aria-label="${copy.ariaLabel}"></div>
        <div class="detail-panel" aria-live="polite">
          <div class="detail-label-title">${copy.detailLabel}</div>
          <div class="detail-text"></div>
          <div class="example-text"></div>
        </div>
      </div>
    </div>
  `;

  const wrapper = root.querySelector('.layer-stack-wrapper');
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const buttonsGroup = root.querySelector('.buttons-group');
  const detailPanel = root.querySelector('.detail-panel');
  const detailText = root.querySelector('.detail-text');
  const exampleText = root.querySelector('.example-text');

  let selectedIndex = 0;
  let isPlaying = false;
  let animationId = null;
  let lastTime = 0;
  let angles = copy.layers.map(() => 0);
  let canvasW = 0, canvasH = 0, dpr = 1;
  let cachedColors = [];

  const buttonsHTML = copy.layers.map((layer, i) => `
    <button type="button" class="layer-btn" data-index="${i}" aria-pressed="${i === 0 ? 'true' : 'false'}">
      <div class="label" style="color: ${tokenKeys[i]}">${layer.label}</div>
      <div class="short">${layer.short}</div>
    </button>
  `).join('');

  buttonsGroup.innerHTML = buttonsHTML;
  const buttons = root.querySelectorAll('.layer-btn');

  function selectLayer(index) {
    selectedIndex = index;
    buttons.forEach((btn, i) => {
      const isActive = i === index;
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      btn.style.borderColor = isActive ? tokenKeys[i] : tokens.line;
    });

    const layer = copy.layers[index];
    detailText.textContent = layer.detail;
    exampleText.textContent = layer.example;
    detailPanel.style.borderLeftColor = tokenKeys[index];
    detailPanel.classList.add('active');

    if (!isPlaying || !motion) {
      draw();
    }
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.getAttribute('data-index'), 10);
      selectLayer(i);
      announce(`${copy.layers[i].label}: ${copy.layers[i].detail}`);
    }, { signal });
  });

  function draw() {
    if (!canvasW || !canvasH) return;
    ctx.clearRect(0, 0, canvasW, canvasH);

    const cx = canvasW / 2;
    const cy = canvasH / 2;
    const maxRadius = Math.min(cx, cy) * 0.9;
    const radiusStep = maxRadius / copy.layers.length;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = copy.layers.length - 1; i >= 0; i--) {
      const r = radiusStep * (i + 1);
      const isSelected = i === selectedIndex;
      const color = cachedColors[i] || '#000';

      ctx.save();
      ctx.translate(cx, cy);

      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.globalAlpha = isSelected ? 0.2 : 0.05;
      ctx.lineWidth = (isSelected ? 8 : 4) * dpr;
      ctx.stroke();

      ctx.globalAlpha = isSelected ? 1 : 0.4;
      ctx.lineWidth = (isSelected ? 4 : 2) * dpr;

      if (motion) {
        ctx.rotate(angles[i]);

        const endAngle = Math.PI * 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, endAngle);
        ctx.stroke();

        const arrowX = r * Math.cos(endAngle);
        const arrowY = r * Math.sin(endAngle);
        ctx.translate(arrowX, arrowY);
        ctx.rotate(endAngle + Math.PI / 2);

        const arrowSize = 6 * dpr;
        ctx.beginPath();
        ctx.moveTo(-arrowSize, -arrowSize * 0.7);
        ctx.lineTo(0, 0);
        ctx.lineTo(-arrowSize, arrowSize * 0.7);
        ctx.stroke();
      } else {
        ctx.setLineDash([15 * dpr, 10 * dpr]);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        for (let a = 0; a < 4; a++) {
          const theta = a * Math.PI / 2;
          ctx.save();
          const ax = r * Math.cos(theta);
          const ay = r * Math.sin(theta);
          ctx.translate(ax, ay);
          ctx.rotate(theta + Math.PI / 2);

          const arrowSize = 5 * dpr;
          ctx.beginPath();
          ctx.moveTo(-arrowSize, -arrowSize * 0.7);
          ctx.lineTo(0, 0);
          ctx.lineTo(-arrowSize, arrowSize * 0.7);
          ctx.stroke();
          ctx.restore();
        }
      }

      ctx.restore();
    }
  }

  function loop(time) {
    if (!isPlaying) return;
    if (!lastTime) lastTime = time;
    const dt = Math.min(time - lastTime, 50);
    lastTime = time;

    if (motion) {
      for (let i = 0; i < copy.layers.length; i++) {
        const speed = 0.0015 * (copy.layers.length - i);
        angles[i] += speed * dt;
      }
      draw();
    }

    animationId = requestAnimationFrame(loop);
  }

  canvas.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      selectLayer((selectedIndex - 1 + copy.layers.length) % copy.layers.length);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      selectLayer((selectedIndex + 1) % copy.layers.length);
    }
  }, { signal });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;
    const cx = canvasW / 2;
    const cy = canvasH / 2;
    const dist = Math.sqrt((x - cx)**2 + (y - cy)**2);

    const maxRadius = Math.min(cx, cy) * 0.9;
    const radiusStep = maxRadius / copy.layers.length;

    let clickedIndex = Math.round(dist / radiusStep) - 1;
    if (clickedIndex < 0) clickedIndex = 0;
    if (clickedIndex > copy.layers.length - 1) clickedIndex = copy.layers.length - 1;

    selectLayer(clickedIndex);
  }, { signal });

  selectLayer(0);

  return {
    pause() {
      isPlaying = false;
      if (animationId) cancelAnimationFrame(animationId);
      animationId = null;
      draw();
    },
    resume() {
      isPlaying = true;
      lastTime = 0;
      if (motion && !animationId) {
         animationId = requestAnimationFrame(loop);
      }
    },
    reset() {
      angles = copy.layers.map(() => 0);
      selectLayer(0);
      draw();
    },
    destroy() {
      if (animationId) cancelAnimationFrame(animationId);
      root.innerHTML = '';
    },
    resize(size) {
      if (size.width < 600) {
        wrapper.classList.add('is-mobile');
      } else {
        wrapper.classList.remove('is-mobile');
      }

      const cw = canvas.parentElement.clientWidth;
      const ch = canvas.parentElement.clientHeight;

      dpr = size.dpr;
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;

      canvasW = canvas.width;
      canvasH = canvas.height;

      cachedColors = tokenKeys.map(t => resolveColor(t));

      draw();
    }
  };
});
