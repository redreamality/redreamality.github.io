registerDemo("r0-spread", ({ root, copy, motion, tokens, resolveColor, announce }) => {
  root.innerHTML = `
    <style>
      .r0-sp { display:grid; gap:1rem; min-height:24rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink};
        background:linear-gradient(160deg,color-mix(in srgb,${tokens.ocean} 7%,${tokens.surface}),${tokens.surface}); }
      .r0-sp-controls { display:grid; gap:.55rem; }
      .r0-sp-label { display:flex; justify-content:space-between; gap:1rem; font-size:.85rem; font-weight:750; }
      .r0-sp-label span:last-child { color:${tokens.ocean}; font-variant-numeric:tabular-nums; }
      .r0-sp-range { width:100%; accent-color:${tokens.ocean}; }
      .r0-sp-chart { position:relative; min-height:12rem; height:12rem; border-radius:1rem; border:1px solid ${tokens.line};
        background:color-mix(in srgb,${tokens.paper} 45%,${tokens.surface}); overflow:hidden; }
      .r0-sp-chart canvas { position:absolute; inset:0; width:100%; height:100%; display:block; }
      .r0-sp-legend { display:flex; flex-wrap:wrap; gap:.85rem; justify-content:center; font-size:.78rem; color:${tokens.muted}; }
      .r0-sp-swatch { display:inline-block; width:.7rem; height:.7rem; border-radius:2px; margin-right:.3rem; vertical-align:middle; }
      .r0-sp-status { margin:0; padding:.85rem 1rem; border:1px solid ${tokens.line}; border-radius:.85rem;
        background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); color:${tokens.muted}; line-height:1.5; }
      .r0-sp-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
    </style>
    <div class="r0-sp" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="r0-sp-controls">
        <label class="r0-sp-label" for="r0-sp-range"><span>${escapeHtml(copy.controlLabel)}</span><span data-r0-sp-val></span></label>
        <input id="r0-sp-range" class="r0-sp-range" data-r0-sp-range type="range" min="0.4" max="3.2" step="0.1" value="1.8" aria-label="${escapeHtml(copy.r0Label)}" />
      </div>
      <div class="r0-sp-chart" data-r0-sp-wrap>
        <canvas data-r0-sp-canvas aria-hidden="true"></canvas>
      </div>
      <div class="r0-sp-legend" aria-hidden="true">
        <span><span class="r0-sp-swatch" style="background:${tokens.ocean}"></span>${escapeHtml(copy.casesLabel)}</span>
        <span><span class="r0-sp-swatch" style="background:${tokens.line}"></span>${escapeHtml(copy.generationLabel)}</span>
      </div>
      <p class="r0-sp-status" data-r0-sp-status role="status"></p>
      <p class="r0-sp-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const range = root.querySelector("[data-r0-sp-range]");
  const valEl = root.querySelector("[data-r0-sp-val]");
  const status = root.querySelector("[data-r0-sp-status]");
  const wrap = root.querySelector("[data-r0-sp-wrap]");
  const canvas = root.querySelector("[data-r0-sp-canvas]");
  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let dpr = 1;
  let paused = !motion;
  void paused;

  const generations = (r0) => {
    const out = [1];
    for (let i = 0; i < 7; i++) out.push(out[out.length - 1] * r0);
    return out;
  };

  const statusFor = (r0) => {
    if (r0 > 1.05) return copy.statusGrow;
    if (r0 < 0.95) return copy.statusFade;
    return copy.statusEdge;
  };

  const draw = () => {
    if (!width || !height) return;
    const r0 = Number(range.value);
    valEl.textContent = `${copy.r0Label} = ${r0.toFixed(1)}`;
    status.textContent = statusFor(r0);
    const vals = generations(r0);
    const maxV = Math.max(...vals, 1.2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const padX = 28;
    const padY = 18;
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;
    const barW = plotW / vals.length * 0.62;
    const gap = plotW / vals.length;

    const cOcean = resolveColor(tokens.ocean);
    const cCoral = resolveColor(tokens.coral);
    const cLine = resolveColor(tokens.line);
    ctx.strokeStyle = cLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, padY + plotH);
    ctx.lineTo(padX + plotW, padY + plotH);
    ctx.stroke();
    vals.forEach((v, i) => {
      const h = (v / maxV) * plotH;
      const x = padX + i * gap + (gap - barW) / 2;
      const y = padY + plotH - h;
      const growing = r0 >= 1;
      ctx.fillStyle = growing ? cCoral : cOcean;
      ctx.globalAlpha = 0.45 + i * 0.07;
      ctx.fillRect(x, y, barW, Math.max(h, 2));
      ctx.globalAlpha = 1;
    });
  };

  range.addEventListener("input", () => {
    draw();
    announce(status.textContent);
  });

  draw();
  return {
    pause: () => { paused = true; },
    resume: () => { paused = false; },
    reset: () => { range.value = "1.8"; draw(); },
    destroy: () => { root.innerHTML = ""; },
    resize: ({ width: w, height: h, dpr: ratio }) => {
      width = Math.max(1, w || wrap.getBoundingClientRect().width);
      height = Math.max(1, h || wrap.getBoundingClientRect().height);
      dpr = ratio || 1;
      draw();
    }
  };
});
