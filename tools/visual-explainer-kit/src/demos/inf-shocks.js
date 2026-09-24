registerDemo("inf-shocks", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
  root.innerHTML = `
    <style>
      .inf-shocks-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        font-family: system-ui, -apple-system, sans-serif;
        color: var(--ink);
        width: 100%;
      }
      .inf-shocks-controls {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 24px;
        padding: 8px;
      }
      .inf-shocks-radio {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        user-select: none;
      }
      .inf-shocks-radio input {
        cursor: pointer;
        width: 18px;
        height: 18px;
        accent-color: var(--coral);
      }
      .inf-shocks-stage {
        position: relative;
        min-height: 280px;
        background: var(--surface);
        border-radius: 8px;
        border: 1px solid var(--line);
        overflow: hidden;
      }
      .inf-shocks-stage canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: block;
      }
      .inf-shocks-label {
        position: absolute;
        font-size: 13px;
        text-align: center;
        pointer-events: none;
        color: var(--ink);
        line-height: 1.3;
        padding: 4px 8px;
        font-weight: 500;
      }
      .inf-shocks-label-money {
        left: 2%;
        bottom: 10%;
        width: 38%;
      }
      .inf-shocks-label-demand {
        right: 2%;
        bottom: 10%;
        width: 38%;
      }
      .inf-shocks-label-price {
        left: 50%;
        top: 8%;
        transform: translateX(-50%);
        width: 50%;
      }
      .inf-shocks-info {
        text-align: center;
        min-height: 64px;
        padding: 0 16px;
      }
      .inf-shocks-info h4 {
        margin: 0 0 6px 0;
        font-size: 16px;
        color: var(--ink);
      }
      .inf-shocks-info p {
        margin: 0;
        font-size: 14px;
        color: var(--muted);
        line-height: 1.4;
      }
    </style>
    <div class="inf-shocks-container">
      <div class="inf-shocks-controls" role="radiogroup" aria-label="${copy.controlLabel}">
        ${copy.shocks.map((s, i) => `
          <label class="inf-shocks-radio">
            <input type="radio" name="inf-shocks-type" value="${s.key}" ${i === 0 ? 'checked' : ''}>
            <span>${s.label}</span>
          </label>
        `).join('')}
      </div>
      <div class="inf-shocks-stage">
        <canvas role="img" aria-label="${copy.ariaLabel}"></canvas>
        <div class="inf-shocks-label inf-shocks-label-money" aria-hidden="true">${copy.shocks[0].channel}</div>
        <div class="inf-shocks-label inf-shocks-label-demand" aria-hidden="true">${copy.shocks[1].channel}</div>
        <div class="inf-shocks-label inf-shocks-label-price" aria-hidden="true">${copy.priceLabel}</div>
      </div>
      <div class="inf-shocks-info" aria-live="polite">
        <h4 class="inf-shocks-headline"></h4>
        <p class="inf-shocks-detail"></p>
      </div>
    </div>
  `;

  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const radios = root.querySelectorAll('input[type="radio"]');
  const headlineEl = root.querySelector('.inf-shocks-headline');
  const detailEl = root.querySelector('.inf-shocks-detail');

  let activeShock = copy.shocks[0].key;
  let priceLevel = 0.2;
  const targetPriceLevel = 0.8;
  let particles = [];
  let isPlaying = true;
  let frameId;
  let width = 0, height = 0, dpr = 1;
  let lastTime = performance.now();
  let spawnTimer = 0;

  const colorLine = resolveColor(tokens.line);
  const colorCoral = resolveColor(tokens.coral);
  const colorOcean = resolveColor(tokens.ocean);
  const colorWarm = resolveColor(tokens.warm);
  const colorPaper = resolveColor(tokens.paper);

  const updateInfo = () => {
    const shock = copy.shocks.find(s => s.key === activeShock);
    headlineEl.textContent = shock.headline;
    detailEl.textContent = shock.detail;
  };

  updateInfo();

  radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        activeShock = e.target.value;
        priceLevel = 0.2;
        particles = [];
        updateInfo();

        if (activeShock === 'money') {
          announce(copy.statusMoney);
        } else {
          announce(copy.statusDemand);
        }

        if (!isPlaying) {
          draw();
        }
      }
    }, { signal });
  });

  const spawnParticle = () => {
    const isMoney = activeShock === 'money';
    const startX = isMoney ? width * 0.1 : width * 0.9;
    const endX = isMoney ? (width / 2 - 15) : (width / 2 + 15);
    const y = height * 0.7;

    particles.push({
      x: startX,
      y: y + (Math.random() * 6 - 3),
      tx: endX,
      vx: isMoney ? 2.5 : -2.5,
      color: isMoney ? colorOcean : colorWarm,
      size: 4 + Math.random() * 2
    });
  };

  const update = (time) => {
    if (!isPlaying) return;
    const dt = Math.min(time - lastTime, 32);
    lastTime = time;

    if (motion) {
      priceLevel += (targetPriceLevel - priceLevel) * 0.04 * (dt / 16);

      spawnTimer += dt;
      if (spawnTimer > 120) {
        spawnTimer = 0;
        spawnParticle();
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx * (dt / 16);

        if ((p.vx > 0 && p.x >= p.tx) || (p.vx < 0 && p.x <= p.tx)) {
          particles.splice(i, 1);
        }
      }
    } else {
      priceLevel = targetPriceLevel;
      particles = [];
      const isMoney = activeShock === 'money';
      const startX = isMoney ? width * 0.1 : width * 0.9;
      const endX = isMoney ? (width / 2 - 15) : (width / 2 + 15);
      const y = height * 0.7;

      for (let i = 0; i < 6; i++) {
        particles.push({
          x: startX + (endX - startX) * (i / 5),
          y: y,
          color: isMoney ? colorOcean : colorWarm,
          size: 5
        });
      }
    }

    draw();
    frameId = requestAnimationFrame(update);
  };

  const draw = () => {
    if (width === 0 || height === 0) return;
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const gaugeW = 36;
    const gaugeH = height * 0.50;
    const gaugeY = height * 0.25;
    const pipeY = height * 0.7;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Pipe Backgrounds
    ctx.lineWidth = 14;
    ctx.strokeStyle = colorPaper;
    ctx.beginPath();
    ctx.moveTo(width * 0.1, pipeY);
    ctx.lineTo(cx - gaugeW/2 + 2, pipeY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width * 0.9, pipeY);
    ctx.lineTo(cx + gaugeW/2 - 2, pipeY);
    ctx.stroke();

    // 2. Particles (flowing inside pipes)
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });

    // 3. Pipe Borders
    ctx.lineWidth = 2;
    ctx.strokeStyle = colorLine;

    ctx.beginPath();
    ctx.moveTo(width * 0.1, pipeY - 7);
    ctx.lineTo(cx - gaugeW/2, pipeY - 7);
    ctx.moveTo(width * 0.1, pipeY + 7);
    ctx.lineTo(cx - gaugeW/2, pipeY + 7);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width * 0.9, pipeY - 7);
    ctx.lineTo(cx + gaugeW/2, pipeY - 7);
    ctx.moveTo(width * 0.9, pipeY + 7);
    ctx.lineTo(cx + gaugeW/2, pipeY + 7);
    ctx.stroke();

    // 4. Gauge Background
    ctx.fillStyle = colorPaper;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(cx - gaugeW/2, gaugeY, gaugeW, gaugeH, 8);
    } else {
      ctx.rect(cx - gaugeW/2, gaugeY, gaugeW, gaugeH);
    }
    ctx.fill();

    // 5. Gauge Fill (Price Level)
    const fillH = priceLevel * (gaugeH - 4);
    const fillY = gaugeY + gaugeH - 2 - fillH;

    ctx.fillStyle = colorCoral;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(cx - gaugeW/2 + 2, fillY, gaugeW - 4, fillH, [0, 0, 6, 6]);
    } else {
      ctx.rect(cx - gaugeW/2 + 2, fillY, gaugeW - 4, fillH);
    }
    ctx.fill();

    // 6. Gauge Border & Marks
    ctx.strokeStyle = colorLine;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(cx - gaugeW/2, gaugeY, gaugeW, gaugeH, 8);
    } else {
      ctx.rect(cx - gaugeW/2, gaugeY, gaugeW, gaugeH);
    }
    ctx.stroke();

    ctx.lineWidth = 1;
    for(let i = 1; i < 5; i++) {
      const markY = gaugeY + (gaugeH * i / 5);
      ctx.beginPath();
      ctx.moveTo(cx - gaugeW/2, markY);
      ctx.lineTo(cx - gaugeW/2 + 8, markY);
      ctx.stroke();
    }
  };

  frameId = requestAnimationFrame(update);

  return {
    pause() {
      isPlaying = false;
      cancelAnimationFrame(frameId);
    },
    resume() {
      if (!isPlaying) {
        isPlaying = true;
        lastTime = performance.now();
        frameId = requestAnimationFrame(update);
      }
    },
    reset() {
      activeShock = copy.shocks[0].key;
      radios[0].checked = true;
      priceLevel = 0.2;
      particles = [];
      updateInfo();
      if (!isPlaying) draw();
    },
    destroy() {
      isPlaying = false;
      cancelAnimationFrame(frameId);
      root.innerHTML = '';
    },
    resize(dims) {
      width = dims.width;
      height = dims.height;
      dpr = dims.dpr;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      if (!motion) {
        particles = [];
        const isMoney = activeShock === 'money';
        const startX = isMoney ? width * 0.1 : width * 0.9;
        const endX = isMoney ? (width / 2 - 15) : (width / 2 + 15);
        const y = height * 0.7;

        for (let i = 0; i < 6; i++) {
          particles.push({
            x: startX + (endX - startX) * (i / 5),
            y: y,
            color: isMoney ? colorOcean : colorWarm,
            size: 5
          });
        }
      }

      draw();
    }
  };
});
