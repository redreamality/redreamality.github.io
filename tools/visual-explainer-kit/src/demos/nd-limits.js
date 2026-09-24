registerDemo("nd-limits", ({ root, copy, motion, tokens, announce }) => {
  const buttons = copy.modes.map((mode, index) => `
    <button type="button" class="nd-lim-btn" data-nd-lim="${index}" aria-pressed="${index === 0}">${escapeHtml(mode.label)}</button>`).join("");

  root.innerHTML = `
    <style>
      .nd-lim { display:grid; gap:1rem; min-height:22rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink};
        background:linear-gradient(150deg,color-mix(in srgb,${tokens.coral} 6%,${tokens.surface}),${tokens.surface}); }
      .nd-lim-panel { display:grid; gap:.75rem; padding:1.1rem 1.2rem; border:1px solid ${tokens.line}; border-radius:1.1rem;
        background:color-mix(in srgb,${tokens.paper} 55%,${tokens.surface}); }
      .nd-lim-badge { display:inline-flex; width:max-content; padding:.25rem .55rem; border-radius:999px; font-size:.68rem; font-weight:850;
        letter-spacing:.04em; text-transform:uppercase; color:${tokens.surface}; background:${tokens.ocean}; }
      .nd-lim-panel[data-mode="heavy"] .nd-lim-badge { background:${tokens.coral}; }
      .nd-lim-headline { margin:0; font-size:1.15rem; font-weight:850; line-height:1.35; }
      .nd-lim-detail { margin:0; color:${tokens.muted}; line-height:1.55; }
      .nd-lim-canvas-wrap { position:relative; min-height:10rem; height:10rem; border-radius:.85rem; border:1px dashed ${tokens.line};
        background:color-mix(in srgb,${tokens.surface} 80%,${tokens.paper}); overflow:hidden; }
      .nd-lim-canvas { position:absolute; inset:0; display:block; width:100%; height:100%; }
      .nd-lim-controls { display:flex; flex-wrap:wrap; gap:.55rem; }
      .nd-lim-btn { flex:1 1 8rem; padding:.75rem; border:1px solid ${tokens.line}; border-radius:.8rem; color:${tokens.ink};
        background:${tokens.surface}; font:inherit; font-weight:800; cursor:pointer; }
      .nd-lim-btn[aria-pressed="true"] { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}; }
      .nd-lim-btn:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .nd-lim-status { margin:0; padding:.85rem 1rem; border:1px solid ${tokens.line}; border-radius:.85rem;
        background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); color:${tokens.muted}; line-height:1.5; }
      .nd-lim-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
    </style>
    <div class="nd-lim" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="nd-lim-panel" data-nd-panel data-mode="normal">
        <span class="nd-lim-badge" data-nd-badge></span>
        <h3 class="nd-lim-headline" data-nd-headline></h3>
        <p class="nd-lim-detail" data-nd-detail></p>
        <div class="nd-lim-canvas-wrap" data-nd-wrap>
          <canvas class="nd-lim-canvas" data-nd-canvas aria-hidden="true"></canvas>
        </div>
      </div>
      <div class="nd-lim-controls" role="group" aria-label="${escapeHtml(copy.controlLabel)}">${buttons}</div>
      <p class="nd-lim-status" data-nd-status role="status"></p>
      <p class="nd-lim-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const panel = root.querySelector("[data-nd-panel]");
  const badge = root.querySelector("[data-nd-badge]");
  const headline = root.querySelector("[data-nd-headline]");
  const detail = root.querySelector("[data-nd-detail]");
  const status = root.querySelector("[data-nd-status]");
  const wrap = root.querySelector("[data-nd-wrap]");
  const canvas = root.querySelector("[data-nd-canvas]");
  const ctx = canvas.getContext("2d");
  const btns = [...root.querySelectorAll("[data-nd-lim]")];
  let modeKey = "normal";
  let width = 0;
  let height = 0;
  let dpr = 1;

  const normalPdf = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  const heavyPdf = (x) => {
    const df = 3;
    const c = 1 / (Math.sqrt(df * Math.PI) * 1.5);
    return c * Math.pow(1 + (x * x) / df, -(df + 1) / 2) * 2.2;
  };

  const draw = () => {
    if (!width || !height) return;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const padX = 16;
    const padY = 14;
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;
    const xMin = -4.5;
    const xMax = 4.5;
    const fn = modeKey === "heavy" ? heavyPdf : normalPdf;
    const yMax = Math.max(normalPdf(0), heavyPdf(0)) * 1.15;
    const toX = (x) => padX + ((x - xMin) / (xMax - xMin)) * plotW;
    const toY = (y) => padY + plotH - (y / yMax) * plotH;

    ctx.beginPath();
    for (let i = 0; i <= 140; i++) {
      const x = xMin + (i / 140) * (xMax - xMin);
      const px = toX(x);
      const py = toY(normalPdf(x));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = `color-mix(in srgb, ${tokens.muted} 45%, transparent)`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    for (let i = 0; i <= 140; i++) {
      const x = xMin + (i / 140) * (xMax - xMin);
      const px = toX(x);
      const py = toY(fn(x));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.lineTo(toX(xMax), toY(0));
    ctx.lineTo(toX(xMin), toY(0));
    ctx.closePath();
    ctx.fillStyle = modeKey === "heavy"
      ? `color-mix(in srgb, ${tokens.coral} 40%, transparent)`
      : `color-mix(in srgb, ${tokens.ocean} 40%, transparent)`;
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i <= 140; i++) {
      const x = xMin + (i / 140) * (xMax - xMin);
      const px = toX(x);
      const py = toY(fn(x));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = modeKey === "heavy" ? tokens.coral : tokens.ocean;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  };

  const select = (index, speak = false) => {
    const mode = copy.modes[index];
    modeKey = mode.key;
    panel.dataset.mode = mode.key;
    badge.textContent = mode.badge;
    headline.textContent = mode.headline;
    detail.textContent = mode.detail;
    status.textContent = mode.key === "normal" ? copy.statusNormal : copy.statusHeavy;
    btns.forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
    draw();
    if (speak) announce(status.textContent);
  };

  btns.forEach((b) => b.addEventListener("click", () => select(Number(b.dataset.ndLim), true)));
  select(0);
  return {
    pause: () => {},
    resume: () => {},
    reset: () => select(0),
    resize: ({ width: w, height: h, dpr: ratio }) => {
      width = wrap.clientWidth || w;
      height = wrap.clientHeight || h;
      dpr = ratio || 1;
      draw();
    },
    destroy: () => { root.innerHTML = ""; }
  };
});
