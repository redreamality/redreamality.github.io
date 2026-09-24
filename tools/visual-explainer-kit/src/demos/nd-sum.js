registerDemo("nd-sum", ({ root, copy, motion, tokens, announce }) => {
  root.innerHTML = `
    <style>
      .nd-sum { display:grid; gap:1rem; min-height:24rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink};
        background:linear-gradient(160deg,color-mix(in srgb,${tokens.ocean} 7%,${tokens.surface}),${tokens.surface}); }
      .nd-sum-controls { display:grid; gap:.55rem; padding:1rem 1.1rem; border:1px solid ${tokens.line}; border-radius:1rem;
        background:color-mix(in srgb,${tokens.paper} 45%,${tokens.surface}); }
      .nd-sum-row { display:flex; flex-wrap:wrap; align-items:center; gap:.75rem; }
      .nd-sum-label { font-weight:800; font-size:.9rem; min-width:8rem; }
      .nd-sum-slider { flex:1 1 10rem; min-width:8rem; cursor:pointer; }
      .nd-sum-val { font-variant-numeric:tabular-nums; font-weight:850; min-width:2.5rem; }
      .nd-sum-canvas-wrap { position:relative; min-height:14rem; height:14rem; border-radius:1rem; border:1px solid ${tokens.line};
        background:color-mix(in srgb,${tokens.surface} 88%,${tokens.paper}); overflow:hidden; }
      .nd-sum-canvas { position:absolute; inset:0; display:block; width:100%; height:100%; }
      .nd-sum-status { margin:0; padding:.85rem 1rem; border:1px solid ${tokens.line}; border-radius:.85rem;
        background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); color:${tokens.muted}; line-height:1.5; }
      .nd-sum-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
    </style>
    <div class="nd-sum" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="nd-sum-controls">
        <div class="nd-sum-row">
          <label class="nd-sum-label" for="nd-sum-shocks">${escapeHtml(copy.shocksLabel)}</label>
          <input id="nd-sum-shocks" class="nd-sum-slider" type="range" min="1" max="12" step="1" value="2" aria-label="${escapeHtml(copy.controlLabel)}" />
          <span class="nd-sum-val" data-nd-shocks-val>2</span>
        </div>
      </div>
      <div class="nd-sum-canvas-wrap" data-nd-wrap>
        <canvas class="nd-sum-canvas" data-nd-canvas tabindex="0" aria-label="${escapeHtml(copy.ariaLabel)}"></canvas>
      </div>
      <p class="nd-sum-status" data-nd-status role="status"></p>
      <p class="nd-sum-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const slider = root.querySelector("#nd-sum-shocks");
  const shocksVal = root.querySelector("[data-nd-shocks-val]");
  const status = root.querySelector("[data-nd-status]");
  const wrap = root.querySelector("[data-nd-wrap]");
  const canvas = root.querySelector("[data-nd-canvas]");
  const ctx = canvas.getContext("2d");
  let shocks = 2;
  let playing = Boolean(motion);
  let raf = 0;
  let bins = [];
  let tick = 0;
  let width = 0;
  let height = 0;
  let dpr = 1;
  const BIN_COUNT = 41;
  const SAMPLE_BATCH = 40;
  const MAX_SAMPLES = 1200;

  const resetBins = () => {
    bins = Array.from({ length: BIN_COUNT }, () => 0);
    tick = 0;
  };

  const oneSum = (n) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += Math.random() * 2 - 1;
    return s;
  };

  const pushSamples = (count) => {
    const maxAbs = shocks;
    for (let i = 0; i < count; i++) {
      const s = oneSum(shocks);
      const t = (s + maxAbs) / (2 * maxAbs || 1);
      const idx = Math.min(BIN_COUNT - 1, Math.max(0, Math.floor(t * BIN_COUNT)));
      bins[idx] += 1;
      tick += 1;
    }
    if (tick > MAX_SAMPLES) {
      const scale = MAX_SAMPLES / tick;
      bins = bins.map((v) => v * scale);
      tick = MAX_SAMPLES;
    }
  };

  const draw = () => {
    if (!width || !height) return;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const pad = { l: 16, r: 16, t: 16, b: 28 };
    const plotW = width - pad.l - pad.r;
    const plotH = height - pad.t - pad.b;
    const maxBin = Math.max(1, ...bins);
    const barW = plotW / BIN_COUNT;

    ctx.fillStyle = `color-mix(in srgb, ${tokens.ocean} 55%, ${tokens.warm})`;
    bins.forEach((v, i) => {
      const bh = (v / maxBin) * plotH;
      const x = pad.l + i * barW;
      const y = pad.t + plotH - bh;
      ctx.fillRect(x + 1, y, Math.max(1, barW - 2), bh);
    });

    ctx.strokeStyle = tokens.line;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t + plotH);
    ctx.lineTo(pad.l + plotW, pad.t + plotH);
    ctx.stroke();

    ctx.fillStyle = tokens.muted;
    ctx.font = "12px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(Math.round(tick)), width / 2, height - 8);
  };

  const updateStatus = () => {
    status.textContent = shocks <= 3 ? copy.statusFew : copy.statusMany;
  };

  const loop = () => {
    if (!playing) return;
    pushSamples(SAMPLE_BATCH);
    draw();
    raf = requestAnimationFrame(loop);
  };

  const rebuild = (speak = false) => {
    shocks = Number(slider.value);
    shocksVal.textContent = String(shocks);
    resetBins();
    pushSamples(200);
    updateStatus();
    draw();
    if (speak) announce(status.textContent);
  };

  slider.addEventListener("input", () => rebuild(true));
  rebuild(false);
  if (playing) raf = requestAnimationFrame(loop);

  return {
    pause: () => { playing = false; if (raf) cancelAnimationFrame(raf); raf = 0; },
    resume: () => { if (playing) return; playing = true; raf = requestAnimationFrame(loop); },
    reset: () => { rebuild(false); if (playing) { cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); } },
    resize: ({ width: w, height: h, dpr: ratio }) => {
      width = wrap.clientWidth || w;
      height = wrap.clientHeight || h;
      dpr = ratio || 1;
      draw();
    },
    destroy: () => { playing = false; if (raf) cancelAnimationFrame(raf); root.innerHTML = ""; }
  };
});
