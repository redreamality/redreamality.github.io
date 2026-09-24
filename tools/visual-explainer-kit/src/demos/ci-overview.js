registerDemo("ci-overview", ({ root, copy, motion, tokens, announce }) => {
  const buttons = copy.modes.map((mode, index) => `
    <button type="button" class="ci-ov-btn" data-ci-ov="${index}" aria-pressed="${index === 0}">${escapeHtml(mode.label)}</button>`).join("");

  root.innerHTML = `
    <style>
      .ci-ov { display:grid; gap:1rem; min-height:22rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink};
        background:linear-gradient(145deg,color-mix(in srgb,${tokens.ocean} 8%,${tokens.surface}),${tokens.surface} 55%,color-mix(in srgb,${tokens.warm} 10%,${tokens.surface})); }
      .ci-ov-panel { display:grid; gap:.75rem; padding:1.1rem 1.2rem; border:1px solid ${tokens.line}; border-radius:1.1rem;
        background:color-mix(in srgb,${tokens.paper} 55%,${tokens.surface}); min-height:12rem; }
      .ci-ov-badge { display:inline-flex; width:max-content; padding:.25rem .55rem; border-radius:999px; font-size:.68rem; font-weight:850;
        letter-spacing:.04em; text-transform:uppercase; color:${tokens.surface}; background:${tokens.ocean}; }
      .ci-ov-panel[data-mode="compound"] .ci-ov-badge { background:${tokens.coral}; }
      .ci-ov-headline { margin:0; font-size:1.15rem; font-weight:850; line-height:1.35; }
      .ci-ov-detail { margin:0; color:${tokens.muted}; line-height:1.55; }
      .ci-ov-viz { position:relative; height:6.5rem; border-radius:.85rem; border:1px dashed ${tokens.line}; overflow:hidden;
        background:color-mix(in srgb,${tokens.surface} 80%,${tokens.paper}); }
      .ci-ov-viz svg { width:100%; height:100%; display:block; }
      .ci-ov-line { fill:none; stroke:${tokens.ocean}; stroke-width:3; stroke-linecap:round;
        transition:opacity 400ms ease; opacity:.35; }
      .ci-ov-curve { fill:none; stroke:${tokens.coral}; stroke-width:3; stroke-linecap:round;
        transition:opacity 400ms ease; opacity:.35; }
      .ci-ov-panel[data-mode="linear"] .ci-ov-line { opacity:1; }
      .ci-ov-panel[data-mode="compound"] .ci-ov-curve { opacity:1; }
      .ci-ov-panel[data-mode="compound"] .ci-ov-line { opacity:.25; }
      .ci-ov-panel[data-mode="linear"] .ci-ov-curve { opacity:.25; }
      .ci-ov-controls { display:flex; flex-wrap:wrap; gap:.55rem; }
      .ci-ov-btn { flex:1 1 8rem; padding:.75rem; border:1px solid ${tokens.line}; border-radius:.8rem; color:${tokens.ink};
        background:${tokens.surface}; font:inherit; font-weight:800; cursor:pointer; }
      .ci-ov-btn[aria-pressed="true"] { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}; }
      .ci-ov-btn:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .ci-ov-status { margin:0; padding:.85rem 1rem; border:1px solid ${tokens.line}; border-radius:.85rem;
        background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); color:${tokens.muted}; line-height:1.5; }
      .ci-ov-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
      .ci-ov.is-paused .ci-ov-line, .ci-ov.is-paused .ci-ov-curve { transition:none; }
    </style>
    <div class="ci-ov${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="ci-ov-panel" data-ci-panel data-mode="linear">
        <span class="ci-ov-badge" data-ci-badge></span>
        <h3 class="ci-ov-headline" data-ci-headline></h3>
        <p class="ci-ov-detail" data-ci-detail></p>
        <div class="ci-ov-viz" aria-hidden="true">
          <svg viewBox="0 0 320 100" preserveAspectRatio="none">
            <path class="ci-ov-line" d="M16 78 L304 28"/>
            <path class="ci-ov-curve" d="M16 78 C 90 76, 160 70, 220 48 C 260 32, 290 18, 304 10"/>
          </svg>
        </div>
      </div>
      <div class="ci-ov-controls" role="group" aria-label="${escapeHtml(copy.controlLabel)}">${buttons}</div>
      <p class="ci-ov-status" data-ci-status role="status"></p>
      <p class="ci-ov-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".ci-ov");
  const panel = root.querySelector("[data-ci-panel]");
  const badge = root.querySelector("[data-ci-badge]");
  const headline = root.querySelector("[data-ci-headline]");
  const detail = root.querySelector("[data-ci-detail]");
  const status = root.querySelector("[data-ci-status]");
  const btns = [...root.querySelectorAll("[data-ci-ov]")];

  const select = (index, speak = false) => {
    const mode = copy.modes[index];
    panel.dataset.mode = mode.key;
    badge.textContent = mode.badge;
    headline.textContent = mode.headline;
    detail.textContent = mode.detail;
    status.textContent = mode.key === "linear" ? copy.statusLinear : copy.statusCompound;
    btns.forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
    if (speak) announce(status.textContent);
  };

  btns.forEach((b) => b.addEventListener("click", () => select(Number(b.dataset.ciOv), true)));
  select(0);
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => select(0),
    destroy: () => { root.innerHTML = ""; }
  };
});
