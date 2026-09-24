registerDemo("r0-limits", ({ root, copy, motion, tokens, resolveColor, announce }) => {
  const buttons = copy.modes.map((mode, index) => `
    <button type="button" class="r0-lim-btn" data-r0-lim="${index}" aria-pressed="${index === 0}">${escapeHtml(mode.label)}</button>`).join("");

  root.innerHTML = `
    <style>
      .r0-lim { display:grid; gap:1rem; min-height:22rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink};
        background:linear-gradient(145deg,color-mix(in srgb,${tokens.warm} 8%,${tokens.surface}),${tokens.surface}); }
      .r0-lim-panel { display:grid; gap:.75rem; padding:1.1rem 1.2rem; border:1px solid ${tokens.line}; border-radius:1.1rem;
        background:color-mix(in srgb,${tokens.paper} 55%,${tokens.surface}); }
      .r0-lim-badge { display:inline-flex; width:max-content; padding:.25rem .55rem; border-radius:999px; font-size:.68rem; font-weight:850;
        letter-spacing:.04em; text-transform:uppercase; color:${tokens.surface}; background:${tokens.ocean}; }
      .r0-lim-panel[data-mode="messy"] .r0-lim-badge { background:${tokens.coral}; }
      .r0-lim-headline { margin:0; font-size:1.15rem; font-weight:850; line-height:1.35; }
      .r0-lim-detail { margin:0; color:${tokens.muted}; line-height:1.55; }
      .r0-lim-viz { position:relative; min-height:9.5rem; height:9.5rem; border-radius:.85rem; border:1px dashed ${tokens.line};
        background:color-mix(in srgb,${tokens.surface} 80%,${tokens.paper}); overflow:hidden; }
      .r0-lim-viz canvas { position:absolute; inset:0; width:100%; height:100%; display:block; }
      .r0-lim-controls { display:flex; flex-wrap:wrap; gap:.55rem; }
      .r0-lim-btn { flex:1 1 8rem; padding:.75rem; border:1px solid ${tokens.line}; border-radius:.8rem; color:${tokens.ink};
        background:${tokens.surface}; font:inherit; font-weight:800; cursor:pointer; }
      .r0-lim-btn[aria-pressed="true"] { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}; }
      .r0-lim-btn:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .r0-lim-status { margin:0; padding:.85rem 1rem; border:1px solid ${tokens.line}; border-radius:.85rem;
        background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); color:${tokens.muted}; line-height:1.5; }
      .r0-lim-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
      .r0-lim.is-paused canvas { opacity:.92; }
    </style>
    <div class="r0-lim${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="r0-lim-panel" data-r0-lim-panel data-mode="ideal">
        <span class="r0-lim-badge" data-r0-lim-badge></span>
        <h3 class="r0-lim-headline" data-r0-lim-headline></h3>
        <p class="r0-lim-detail" data-r0-lim-detail></p>
        <div class="r0-lim-viz" data-r0-lim-wrap>
          <canvas data-r0-lim-canvas aria-hidden="true"></canvas>
        </div>
      </div>
      <div class="r0-lim-controls" role="group" aria-label="${escapeHtml(copy.controlLabel)}">${buttons}</div>
      <p class="r0-lim-status" data-r0-lim-status role="status"></p>
      <p class="r0-lim-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".r0-lim");
  const panel = root.querySelector("[data-r0-lim-panel]");
  const badge = root.querySelector("[data-r0-lim-badge]");
  const headline = root.querySelector("[data-r0-lim-headline]");
  const detail = root.querySelector("[data-r0-lim-detail]");
  const status = root.querySelector("[data-r0-lim-status]");
  const wrap = root.querySelector("[data-r0-lim-wrap]");
  const canvas = root.querySelector("[data-r0-lim-canvas]");
  const ctx = canvas.getContext("2d");
  const btns = [...root.querySelectorAll("[data-r0-lim]")];
  let modeKey = "ideal";
  let width = 0;
  let height = 0;
  let dpr = 1;

  const draw = () => {
    if (!width || !height) return;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const pad = 18;
    const axisY = height - pad;
    const top = pad + 8;
    const left = pad;
    const right = width - pad;
    const thresholdX = left + (right - left) * 0.62;

    const cLine = resolveColor(tokens.line);
    const cOcean = resolveColor(tokens.ocean);
    const cWarm = resolveColor(tokens.warm);
    const cCoral = resolveColor(tokens.coral);
    ctx.strokeStyle = cLine;
    ctx.beginPath();
    ctx.moveTo(left, axisY);
    ctx.lineTo(right, axisY);
    ctx.stroke();

    if (modeKey === "ideal") {
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = cOcean;
      ctx.fillRect(thresholdX, top, right - thresholdX, axisY - top);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = cOcean;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(thresholdX, top);
      ctx.lineTo(thresholdX, axisY);
      ctx.stroke();
      ctx.fillStyle = cWarm;
      ctx.beginPath();
      ctx.arc(thresholdX, top + 10, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const bandL = thresholdX - 28;
      const bandR = thresholdX + 36;
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = cCoral;
      ctx.fillRect(bandL, top, bandR - bandL, axisY - top);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = cCoral;
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(thresholdX - 12, top + 6);
      ctx.lineTo(thresholdX + 18, axisY - 4);
      ctx.stroke();
      ctx.setLineDash([]);
      const hubs = [
        [left + 40, top + 30],
        [left + 90, top + 70],
        [right - 50, top + 40],
        [thresholdX + 10, top + 55]
      ];
      hubs.forEach(([x, y], i) => {
        ctx.fillStyle = i % 2 ? cCoral : cWarm;
        ctx.beginPath();
        ctx.arc(x, y, 4 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      });
    }
  };

  const select = (index, speak = false) => {
    const mode = copy.modes[index];
    modeKey = mode.key;
    panel.dataset.mode = mode.key;
    badge.textContent = mode.badge;
    headline.textContent = mode.headline;
    detail.textContent = mode.detail;
    status.textContent = mode.key === "messy" ? copy.statusMessy : copy.statusIdeal;
    btns.forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
    draw();
    if (speak) announce(status.textContent);
  };

  btns.forEach((b) => b.addEventListener("click", () => select(Number(b.dataset.r0Lim), true)));
  select(0);
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => select(0),
    destroy: () => { root.innerHTML = ""; },
    resize: ({ width: w, height: h, dpr: ratio }) => {
      width = Math.max(1, w || wrap.getBoundingClientRect().width);
      height = Math.max(1, h || wrap.getBoundingClientRect().height);
      dpr = ratio || 1;
      draw();
    }
  };
});
