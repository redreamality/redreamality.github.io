registerDemo("ci-compound", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
  root.innerHTML = `
    <style>
      .ci-compound-root {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        color: var(--ink);
        font-family: system-ui, sans-serif;
      }
      .ci-compound-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        font-size: 0.875rem;
        padding: 0.75rem;
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 4px;
      }
      .ci-compound-legend-item {
        display: flex;
        align-items: center;
        gap: 0.375rem;
      }
      .ci-compound-swatch {
        width: 12px;
        height: 12px;
        border-radius: 2px;
      }
      .ci-compound-chart {
        position: relative;
        width: 100%;
        min-height: 320px;
        background: var(--paper);
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid var(--line);
      }
      .ci-compound-canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        outline: none;
      }
      .ci-compound-controls {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .ci-compound-control-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.875rem;
      }
      .ci-compound-control-row label {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
      }
      .ci-compound-control-row input[type="range"] {
        flex: 1;
        min-width: 0;
      }
      .ci-compound-val {
        font-variant-numeric: tabular-nums;
        font-weight: 600;
        min-width: 3.5rem;
        text-align: right;
      }
      .ci-compound-caption {
        font-size: 0.875rem;
        color: var(--muted);
        line-height: 1.4;
      }
    </style>
    <div class="ci-compound-root">
      <div class="ci-compound-legend">
        <div class="ci-compound-legend-item">
          <div class="ci-compound-swatch" style="background: var(--ocean);"></div>
          <span class="ci-compound-l-compound"></span>: <span class="ci-compound-v-compound ci-compound-val"></span>
        </div>
        <div class="ci-compound-legend-item">
          <div class="ci-compound-swatch" style="background: var(--coral);"></div>
          <span class="ci-compound-l-linear"></span>: <span class="ci-compound-v-linear ci-compound-val"></span>
        </div>
        <div class="ci-compound-legend-item">
          <span class="ci-compound-l-factor"></span>: <span class="ci-compound-v-factor ci-compound-val"></span>
        </div>
      </div>
      <div class="ci-compound-chart">
        <canvas class="ci-compound-canvas" role="img" tabindex="0"></canvas>
      </div>
      <div class="ci-compound-controls">
        <div class="ci-compound-control-row">
          <label>
            <span class="ci-compound-l-day"></span>
            <input type="range" class="ci-compound-day-slider" min="0" max="365" value="0" step="1" />
            <span class="ci-compound-v-day ci-compound-val">0</span>
          </label>
        </div>
        <div class="ci-compound-control-row">
          <label>
            <span class="ci-compound-l-rate"></span>
            <input type="range" class="ci-compound-rate-slider" min="0.1" max="1.0" value="0.1" step="0.1" />
            <span class="ci-compound-v-rate ci-compound-val">0.1%</span>
          </label>
        </div>
      </div>
      <div class="ci-compound-caption"></div>
    </div>
  `;

  const qs = (sel) => root.querySelector(sel);
  const dom = {
    lCompound: qs('.ci-compound-l-compound'),
    lLinear: qs('.ci-compound-l-linear'),
    lFactor: qs('.ci-compound-l-factor'),
    lDay: qs('.ci-compound-l-day'),
    lRate: qs('.ci-compound-l-rate'),
    vCompound: qs('.ci-compound-v-compound'),
    vLinear: qs('.ci-compound-v-linear'),
    vFactor: qs('.ci-compound-v-factor'),
    vDay: qs('.ci-compound-v-day'),
    vRate: qs('.ci-compound-v-rate'),
    sliderDay: qs('.ci-compound-day-slider'),
    sliderRate: qs('.ci-compound-rate-slider'),
    canvas: qs('.ci-compound-canvas'),
    caption: qs('.ci-compound-caption')
  };

  dom.lCompound.textContent = copy.compoundValueLabel;
  dom.lLinear.textContent = copy.linearEstimateLabel;
  dom.lFactor.textContent = copy.factorLabel;
  dom.lDay.textContent = copy.controlLabel;
  dom.lRate.textContent = copy.rateLabel;
  dom.caption.textContent = copy.caption;
  dom.canvas.setAttribute('aria-label', copy.ariaLabel);

  const state = {
    day: motion ? 0 : 365,
    rate: 0.001,
    isPlaying: motion,
    isDestroyed: false,
    width: 0,
    height: 0,
    dpr: 1,
    lastAnnouncedStage: -1
  };

  let rafId;
  let lastTime = performance.now();

  const updateUI = () => {
    const dayInt = Math.floor(state.day);
    const ratePercent = (state.rate * 100).toFixed(1);
    const valComp = Math.pow(1 + state.rate, dayInt).toFixed(3);
    const valLin = (1 + state.rate * dayInt).toFixed(3);

    dom.vDay.textContent = dayInt;
    dom.sliderDay.value = dayInt;

    dom.vRate.textContent = `${ratePercent}%`;
    dom.sliderRate.value = ratePercent;

    dom.vCompound.textContent = valComp;
    dom.vLinear.textContent = valLin;
    dom.vFactor.textContent = `(1 + ${state.rate.toFixed(3)})^${dayInt}`;
  };

  const checkAnnounce = () => {
    let stage = -1;
    if (state.day > 10 && state.day < 150) stage = 0;
    else if (state.day >= 150 && state.day < 280) stage = 1;
    else if (state.day >= 280) stage = 2;

    if (stage !== -1 && stage !== state.lastAnnouncedStage) {
      state.lastAnnouncedStage = stage;
      if (stage === 0) announce(copy.statusEarly);
      if (stage === 1) announce(copy.statusMid);
      if (stage === 2) announce(copy.statusLate);
    }
  };

  const draw = () => {
    if (!state.width || !state.height) return;
    const ctx = dom.canvas.getContext('2d');
    ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);
    ctx.save();
    ctx.scale(state.dpr, state.dpr);

    const w = state.width;
    const h = state.height;
    const padLeft = 45;
    const padRight = 15;
    const padTop = 20;
    const padBottom = 25;
    const graphW = w - padLeft - padRight;
    const graphH = h - padTop - padBottom;

    const maxDay = 365;
    const maxVal = Math.pow(1 + state.rate, maxDay);
    const minVal = 1.0;
    const valRange = (maxVal - minVal) * 1.05;

    const getX = (d) => padLeft + (d / maxDay) * graphW;
    const getY = (v) => h - padBottom - ((v - minVal) / valRange) * graphH;

    ctx.strokeStyle = resolveColor(tokens.line);
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(padLeft, h - padBottom);
    ctx.lineTo(w - padRight, h - padBottom);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padLeft, padTop);
    ctx.lineTo(padLeft, h - padBottom);
    ctx.stroke();

    ctx.fillStyle = resolveColor(tokens.muted);
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText((1).toFixed(2), padLeft - 6, getY(1.0));
    ctx.fillText(maxVal.toFixed(2), padLeft - 6, getY(maxVal));

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(String(0), getX(0), h - padBottom + 6);
    ctx.fillText(String(365), getX(365), h - padBottom + 6);

    const currentLinear = 1 + state.rate * state.day;
    
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(1));
    ctx.lineTo(getX(state.day), getY(currentLinear));
    ctx.strokeStyle = resolveColor(tokens.coral);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(getX(0), getY(1));
    for (let d = 1; d <= state.day; d++) {
      ctx.lineTo(getX(d), getY(Math.pow(1 + state.rate, d)));
    }
    ctx.strokeStyle = resolveColor(tokens.ocean);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(getX(0), getY(1));
    for (let d = 1; d <= state.day; d++) {
      ctx.lineTo(getX(d), getY(Math.pow(1 + state.rate, d)));
    }
    ctx.lineTo(getX(state.day), getY(currentLinear));
    ctx.lineTo(getX(0), getY(1));
    ctx.fillStyle = resolveColor(tokens.ocean);
    ctx.globalAlpha = 0.15;
    ctx.fill();
    ctx.globalAlpha = 1.0;

    const currentX = getX(state.day);
    ctx.beginPath();
    ctx.moveTo(currentX, padTop);
    ctx.lineTo(currentX, h - padBottom);
    ctx.strokeStyle = resolveColor(tokens.line);
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    const drawDot = (x, y, colorToken) => {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = resolveColor(colorToken);
      ctx.fill();
    };
    drawDot(currentX, getY(currentLinear), tokens.coral);
    drawDot(currentX, getY(Math.pow(1 + state.rate, state.day)), tokens.ocean);

    ctx.restore();
  };

  const loop = (time) => {
    if (state.isDestroyed) return;
    if (!state.isPlaying) return;

    const dt = time - lastTime;
    lastTime = time;

    state.day += (365 / 4000) * dt;
    if (state.day >= 365) {
      state.day = 365;
      state.isPlaying = false;
    }
    
    updateUI();
    draw();
    checkAnnounce();

    if (state.isPlaying) {
      rafId = requestAnimationFrame(loop);
    }
  };

  dom.sliderDay.addEventListener('input', (e) => {
    state.day = parseInt(e.target.value, 10);
    state.isPlaying = false;
    if (rafId) cancelAnimationFrame(rafId);
    updateUI();
    draw();
    checkAnnounce();
  });

  dom.sliderRate.addEventListener('input', (e) => {
    state.rate = parseFloat(e.target.value) / 100;
    updateUI();
    draw();
  });

  signal.addEventListener('abort', () => {
    state.isDestroyed = true;
    if (rafId) cancelAnimationFrame(rafId);
  });

  updateUI();
  if (state.isPlaying) {
    rafId = requestAnimationFrame(loop);
  }

  return {
    pause() {
      state.isPlaying = false;
      if (rafId) cancelAnimationFrame(rafId);
      draw();
    },
    resume() {
      if (state.day >= 365) state.day = 0;
      if (!state.isPlaying) {
        state.isPlaying = true;
        lastTime = performance.now();
        rafId = requestAnimationFrame(loop);
      }
    },
    reset() {
      state.day = 0;
      state.lastAnnouncedStage = -1;
      updateUI();
      draw();
    },
    destroy() {
      state.isDestroyed = true;
      if (rafId) cancelAnimationFrame(rafId);
      root.innerHTML = '';
    },
    resize({ width, height, dpr }) {
      state.width = width;
      state.height = height;
      state.dpr = dpr;
      dom.canvas.width = width * dpr;
      dom.canvas.height = height * dpr;
      draw();
    }
  };
});
