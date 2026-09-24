registerDemo("nd-overview", ({ root, copy, motion, tokens, announce }) => {
  const buttons = copy.modes.map((mode, index) => `
    <button type="button" class="nd-ov-btn" data-nd-ov="${index}" aria-pressed="${index === 0}">${escapeHtml(mode.label)}</button>`).join("");

  root.innerHTML = `
    <style>
      .nd-ov { display:grid; gap:1rem; min-height:22rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink};
        background:linear-gradient(145deg,color-mix(in srgb,${tokens.ocean} 8%,${tokens.surface}),${tokens.surface} 55%,color-mix(in srgb,${tokens.warm} 10%,${tokens.surface})); }
      .nd-ov-panel { display:grid; gap:.75rem; padding:1.1rem 1.2rem; border:1px solid ${tokens.line}; border-radius:1.1rem;
        background:color-mix(in srgb,${tokens.paper} 55%,${tokens.surface}); min-height:12rem; }
      .nd-ov-badge { display:inline-flex; width:max-content; padding:.25rem .55rem; border-radius:999px; font-size:.68rem; font-weight:850;
        letter-spacing:.04em; text-transform:uppercase; color:${tokens.surface}; background:${tokens.ocean}; }
      .nd-ov-panel[data-mode="tails"] .nd-ov-badge { background:${tokens.coral}; }
      .nd-ov-headline { margin:0; font-size:1.15rem; font-weight:850; line-height:1.35; }
      .nd-ov-detail { margin:0; color:${tokens.muted}; line-height:1.55; }
      .nd-ov-canvas-wrap { position:relative; min-height:9rem; height:9rem; border-radius:.85rem; border:1px dashed ${tokens.line};
        background:color-mix(in srgb,${tokens.surface} 80%,${tokens.paper}); overflow:hidden; }
      .nd-ov-canvas { position:absolute; inset:0; display:block; width:100%; height:100%; }
      .nd-ov-controls { display:flex; flex-wrap:wrap; gap:.55rem; }
      .nd-ov-btn { flex:1 1 8rem; padding:.75rem; border:1px solid ${tokens.line}; border-radius:.8rem; color:${tokens.ink};
        background:${tokens.surface}; font:inherit; font-weight:800; cursor:pointer; }
      .nd-ov-btn[aria-pressed="true"] { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}; }
      .nd-ov-btn:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .nd-ov-status { margin:0; padding:.85rem 1rem; border:1px solid ${tokens.line}; border-radius:.85rem;
        background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); color:${tokens.muted}; line-height:1.5; }
      .nd-ov-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
      .nd-ov.is-paused .nd-ov-canvas { opacity:.92; }
    </style>
    <div class="nd-ov${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="nd-ov-panel" data-nd-panel data-mode="middle">
        <span class="nd-ov-badge" data-nd-badge></span>
        <h3 class="nd-ov-headline" data-nd-headline></h3>
        <p class="nd-ov-detail" data-nd-detail></p>
        <div class="nd-ov-canvas-wrap" data-nd-wrap>
          <canvas class="nd-ov-canvas" data-nd-canvas aria-hidden="true"></canvas>
        </div>
      </div>
      <div class="nd-ov-controls" role="group" aria-label="${escapeHtml(copy.controlLabel)}">${buttons}</div>
      <p class="nd-ov-status" data-nd-status role="status"></p>
      <p class="nd-ov-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".nd-ov");
  const panel = root.querySelector("[data-nd-panel]");
  const badge = root.querySelector("[data-nd-badge]");
  const headline = root.querySelector("[data-nd-headline]");
  const detail = root.querySelector("[data-nd-detail]");
  const status = root.querySelector("[data-nd-status]");
  const wrap = root.querySelector("[data-nd-wrap]");
  const canvas = root.querySelector("[data-nd-canvas]");
  const ctx = canvas.getContext("2d");
  const btns = [...root.querySelectorAll("[data-nd-ov]")];
  let modeKey = "middle";
  let width = 0;
  let height = 0;
  let dpr = 1;

  const pdf = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

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
    const xMin = -3.6;
    const xMax = 3.6;
    const yMax = pdf(0) * 1.12;
    const toX = (x) => padX + ((x - xMin) / (xMax - xMin)) * plotW;
    const toY = (y) => padY + plotH - (y / yMax) * plotH;

    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const x = xMin + (i / 120) * (xMax - xMin);
      const px = toX(x);
      const py = toY(pdf(x));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.lineTo(toX(xMax), toY(0));
    ctx.lineTo(toX(xMin), toY(0));
    ctx.closePath();
    ctx.fillStyle = modeKey === "middle"
      ? `color-mix(in srgb, ${tokens.ocean} 35%, transparent)`
      : `color-mix(in srgb, ${tokens.muted} 18%, transparent)`;
    ctx.fill();

    if (modeKey === "tails") {
      const highlight = (a, b) => {
        ctx.beginPath();
        let started = false;
        for (let i = 0; i <= 60; i++) {
          const x = a + (i / 60) * (b - a);
          const px = toX(x);
          const py = toY(pdf(x));
          if (!started) { ctx.moveTo(px, toY(0)); ctx.lineTo(px, py); started = true; }
          else ctx.lineTo(px, py);
        }
        ctx.lineTo(toX(b), toY(0));
        ctx.closePath();
        ctx.fillStyle = `color-mix(in srgb, ${tokens.coral} 55%, transparent)`;
        ctx.fill();
      };
      highlight(xMin, -1.8);
      highlight(1.8, xMax);
    } else {
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const x = -1.2 + (i / 80) * 2.4;
        const px = toX(x);
        const py = toY(pdf(x));
        if (i === 0) { ctx.moveTo(px, toY(0)); ctx.lineTo(px, py); }
        else ctx.lineTo(px, py);
      }
      ctx.lineTo(toX(1.2), toY(0));
      ctx.closePath();
      ctx.fillStyle = `color-mix(in srgb, ${tokens.ocean} 50%, transparent)`;
      ctx.fill();
    }

    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const x = xMin + (i / 120) * (xMax - xMin);
      const px = toX(x);
      const py = toY(pdf(x));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = tokens.ink;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX(0), toY(0));
    ctx.lineTo(toX(0), toY(pdf(0)));
    ctx.strokeStyle = tokens.warm;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const select = (index, speak = false) => {
    const mode = copy.modes[index];
    modeKey = mode.key;
    panel.dataset.mode = mode.key;
    badge.textContent = mode.badge;
    headline.textContent = mode.headline;
    detail.textContent = mode.detail;
    status.textContent = mode.key === "middle" ? copy.statusMiddle : copy.statusTails;
    btns.forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
    draw();
    if (speak) announce(status.textContent);
  };

  btns.forEach((b) => b.addEventListener("click", () => select(Number(b.dataset.ndOv), true)));
  select(0);
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => select(0),
    resize: ({ width: w, height: h, dpr: ratio }) => {
      // Prefer wrap box so canvas stays bounded
      width = wrap.clientWidth || w;
      height = wrap.clientHeight || h;
      dpr = ratio || 1;
      draw();
    },
    destroy: () => { root.innerHTML = ""; }
  };
});
