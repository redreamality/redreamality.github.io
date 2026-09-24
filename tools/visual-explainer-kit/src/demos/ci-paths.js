registerDemo("ci-paths", ({ root, copy, motion, tokens, announce }) => {
  const PRINCIPAL = 100;
  const RATE_A = 0.0008;
  const RATE_B = 0.0012;
  const DAYS = 365;

  const buttons = copy.modes.map((mode, index) => `
    <button type="button" class="ci-paths-btn" data-ci-paths="${index}" aria-pressed="${index === 0}">${escapeHtml(mode.label)}</button>`).join("");

  root.innerHTML = `
    <style>
      .ci-paths { display:grid; gap:1rem; min-height:22rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink};
        background:linear-gradient(150deg,color-mix(in srgb,${tokens.ocean} 6%,${tokens.surface}),${tokens.surface}); }
      .ci-paths-panel { display:grid; gap:.65rem; padding:1rem 1.1rem; border:1px solid ${tokens.line}; border-radius:1.1rem;
        background:color-mix(in srgb,${tokens.paper} 50%,${tokens.surface}); }
      .ci-paths-badge { display:inline-flex; width:max-content; padding:.25rem .55rem; border-radius:999px; font-size:.68rem; font-weight:850;
        letter-spacing:.04em; text-transform:uppercase; color:${tokens.surface}; background:${tokens.ocean}; }
      .ci-paths-panel[data-mode="realHint"] .ci-paths-badge { background:${tokens.warm}; color:${tokens.ink}; }
      .ci-paths-headline { margin:0; font-size:1.1rem; font-weight:850; line-height:1.35; }
      .ci-paths-detail { margin:0; color:${tokens.muted}; line-height:1.55; }
      .ci-paths-stage { position:relative; min-height:11rem; border-radius:.85rem; border:1px dashed ${tokens.line}; overflow:hidden;
        background:color-mix(in srgb,${tokens.surface} 80%,${tokens.paper}); }
      .ci-paths-stage svg { width:100%; height:11rem; display:block; }
      .ci-paths-shade { opacity:0; transition:opacity 400ms ease; }
      .ci-paths-panel[data-mode="realHint"] .ci-paths-shade { opacity:.55; }
      .ci-paths-legend { display:flex; flex-wrap:wrap; gap:1rem; font-size:.78rem; font-weight:750; }
      .ci-paths-swatch { display:inline-block; width:.75rem; height:.75rem; border-radius:999px; margin-right:.35rem; vertical-align:middle; }
      .ci-paths-controls { display:flex; flex-wrap:wrap; gap:.55rem; }
      .ci-paths-btn { flex:1 1 8rem; padding:.75rem; border:1px solid ${tokens.line}; border-radius:.8rem; color:${tokens.ink};
        background:${tokens.surface}; font:inherit; font-weight:800; cursor:pointer; }
      .ci-paths-btn[aria-pressed="true"] { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}; }
      .ci-paths-btn:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .ci-paths-status { margin:0; padding:.85rem 1rem; border:1px solid ${tokens.line}; border-radius:.85rem;
        background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); color:${tokens.muted}; line-height:1.5; }
      .ci-paths-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
      .ci-paths.is-paused .ci-paths-shade { transition:none; }
    </style>
    <div class="ci-paths${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="ci-paths-panel" data-ci-panel data-mode="nominal">
        <span class="ci-paths-badge" data-ci-badge></span>
        <h3 class="ci-paths-headline" data-ci-headline></h3>
        <p class="ci-paths-detail" data-ci-detail></p>
        <div class="ci-paths-stage" aria-hidden="true">
          <svg viewBox="0 0 360 140" preserveAspectRatio="none">
            <defs>
              <linearGradient id="ci-inf-shade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${tokens.warm}" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="${tokens.warm}" stop-opacity="0.05"/>
              </linearGradient>
            </defs>
            <path class="ci-paths-shade" data-ci-shade fill="url(#ci-inf-shade)" d=""/>
            <path data-ci-a fill="none" stroke="${tokens.ocean}" stroke-width="2.5" stroke-linecap="round"/>
            <path data-ci-b fill="none" stroke="${tokens.coral}" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="ci-paths-legend">
          <span><span class="ci-paths-swatch" style="background:${tokens.ocean}"></span>${escapeHtml(copy.pathALabel)}</span>
          <span><span class="ci-paths-swatch" style="background:${tokens.coral}"></span>${escapeHtml(copy.pathBLabel)}</span>
        </div>
      </div>
      <div class="ci-paths-controls" role="group" aria-label="${escapeHtml(copy.controlLabel)}">${buttons}</div>
      <p class="ci-paths-status" data-ci-status role="status"></p>
      <p class="ci-paths-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".ci-paths");
  const panel = root.querySelector("[data-ci-panel]");
  const badge = root.querySelector("[data-ci-badge]");
  const headline = root.querySelector("[data-ci-headline]");
  const detail = root.querySelector("[data-ci-detail]");
  const status = root.querySelector("[data-ci-status]");
  const pathA = root.querySelector("[data-ci-a]");
  const pathB = root.querySelector("[data-ci-b]");
  const shade = root.querySelector("[data-ci-shade]");
  const btns = [...root.querySelectorAll("[data-ci-paths]")];

  const series = (rate) => {
    const pts = [];
    for (let d = 0; d <= DAYS; d += 5) {
      pts.push(PRINCIPAL * Math.pow(1 + rate, d));
    }
    pts.push(PRINCIPAL * Math.pow(1 + rate, DAYS));
    return pts;
  };
  const aVals = series(RATE_A);
  const bVals = series(RATE_B);
  const maxV = Math.max(...bVals);

  const toPath = (vals) => vals.map((v, i) => {
    const x = 16 + (i / (vals.length - 1)) * 328;
    const y = 120 - ((v - PRINCIPAL) / (maxV - PRINCIPAL)) * 95;
    return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");

  pathA.setAttribute("d", toPath(aVals));
  pathB.setAttribute("d", toPath(bVals));
  const top = toPath(bVals.map((v) => v * 0.92));
  const bottom = toPath(bVals).split(" ").reverse().map((p, i, arr) => {
    if (i === 0) return p.replace(/^L/, "L").replace(/^M/, "L");
    return p;
  });
  // simpler shade polygon under path B
  const shadePts = [];
  bVals.forEach((v, i) => {
    const x = 16 + (i / (bVals.length - 1)) * 328;
    const y = 120 - ((v * 0.88 - PRINCIPAL) / (maxV - PRINCIPAL)) * 95;
    shadePts.push(`${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`);
  });
  shadePts.push(`L${(16 + 328).toFixed(1)} 120 L16 120 Z`);
  shade.setAttribute("d", shadePts.join(" "));

  const select = (index, speak = false) => {
    const mode = copy.modes[index];
    panel.dataset.mode = mode.key;
    badge.textContent = mode.key === "nominal" ? "Nominal" : "Real hint";
    // Prefer localized headline fields; badge from mode isn't in copy — use headline badge-ish from key
    if (mode.badge) badge.textContent = mode.badge;
    else badge.textContent = mode.key === "nominal" ? "Nominal" : "Hint";
    headline.textContent = mode.headline;
    detail.textContent = mode.detail;
    status.textContent = mode.key === "nominal" ? copy.statusNominal : copy.statusRealHint;
    btns.forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
    if (speak) announce(status.textContent);
  };

  btns.forEach((b) => b.addEventListener("click", () => select(Number(b.dataset.ciPaths), true)));
  select(0);
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => select(0),
    destroy: () => { root.innerHTML = ""; }
  };
});
