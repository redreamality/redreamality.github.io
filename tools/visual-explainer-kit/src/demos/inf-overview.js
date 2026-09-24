registerDemo("inf-overview", ({ root, copy, motion, tokens, announce }) => {
  const buttons = copy.modes.map((mode, index) => `
    <button type="button" class="inf-ov-btn" data-inf-ov="${index}" aria-pressed="${index === 0}">${escapeHtml(mode.label)}</button>`).join("");

  root.innerHTML = `
    <style>
      .inf-ov { display:grid; gap:1rem; min-height:22rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink};
        background:linear-gradient(145deg,color-mix(in srgb,${tokens.ocean} 8%,${tokens.surface}),${tokens.surface} 55%,color-mix(in srgb,${tokens.warm} 10%,${tokens.surface})); }
      .inf-ov-panel { display:grid; gap:.75rem; padding:1.1rem 1.2rem; border:1px solid ${tokens.line}; border-radius:1.1rem;
        background:color-mix(in srgb,${tokens.paper} 55%,${tokens.surface}); min-height:12rem; }
      .inf-ov-badge { display:inline-flex; width:max-content; padding:.25rem .55rem; border-radius:999px; font-size:.68rem; font-weight:850;
        letter-spacing:.04em; text-transform:uppercase; color:${tokens.surface}; background:${tokens.ocean}; }
      .inf-ov-panel[data-mode="real"] .inf-ov-badge { background:${tokens.coral}; }
      .inf-ov-headline { margin:0; font-size:1.15rem; font-weight:850; line-height:1.35; }
      .inf-ov-detail { margin:0; color:${tokens.muted}; line-height:1.55; }
      .inf-ov-viz { position:relative; display:grid; grid-template-columns:1fr 1fr; gap:.75rem; min-height:5.5rem; }
      .inf-ov-stack, .inf-ov-basket { border-radius:.85rem; border:1px dashed ${tokens.line}; background:color-mix(in srgb,${tokens.surface} 80%,${tokens.paper});
        display:flex; align-items:flex-end; justify-content:center; gap:.2rem; padding:.6rem; min-height:5.5rem; }
      .inf-ov-bill { width:1.1rem; border-radius:.2rem; background:${tokens.ocean}; transition:height 500ms ease, opacity 300ms ease; }
      .inf-ov-panel[data-mode="nominal"] .inf-ov-bill:nth-child(1) { height:28%; }
      .inf-ov-panel[data-mode="nominal"] .inf-ov-bill:nth-child(2) { height:42%; }
      .inf-ov-panel[data-mode="nominal"] .inf-ov-bill:nth-child(3) { height:58%; }
      .inf-ov-panel[data-mode="nominal"] .inf-ov-bill:nth-child(4) { height:74%; }
      .inf-ov-panel[data-mode="nominal"] .inf-ov-bill:nth-child(5) { height:90%; }
      .inf-ov-panel[data-mode="real"] .inf-ov-bill { height:38%; opacity:.55; }
      .inf-ov-slice { width:70%; border-radius:.35rem .35rem 0 0; background:color-mix(in srgb,${tokens.warm} 70%,${tokens.coral});
        transition:height 500ms ease; box-shadow:inset 0 0 0 1px color-mix(in srgb,${tokens.ink} 8%,transparent); }
      .inf-ov-panel[data-mode="nominal"] .inf-ov-slice { height:78%; }
      .inf-ov-panel[data-mode="real"] .inf-ov-slice { height:28%; }
      .inf-ov-controls { display:flex; flex-wrap:wrap; gap:.55rem; }
      .inf-ov-btn { flex:1 1 8rem; padding:.75rem; border:1px solid ${tokens.line}; border-radius:.8rem; color:${tokens.ink};
        background:${tokens.surface}; font:inherit; font-weight:800; cursor:pointer; }
      .inf-ov-btn[aria-pressed="true"] { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}; }
      .inf-ov-btn:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .inf-ov-status { margin:0; padding:.85rem 1rem; border:1px solid ${tokens.line}; border-radius:.85rem;
        background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); color:${tokens.muted}; line-height:1.5; }
      .inf-ov-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
      .inf-ov.is-paused .inf-ov-bill, .inf-ov.is-paused .inf-ov-slice { transition:none; }
    </style>
    <div class="inf-ov${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="inf-ov-panel" data-inf-panel data-mode="nominal">
        <span class="inf-ov-badge" data-inf-badge></span>
        <h3 class="inf-ov-headline" data-inf-headline></h3>
        <p class="inf-ov-detail" data-inf-detail></p>
        <div class="inf-ov-viz" aria-hidden="true">
          <div class="inf-ov-stack">
            <span class="inf-ov-bill"></span><span class="inf-ov-bill"></span><span class="inf-ov-bill"></span>
            <span class="inf-ov-bill"></span><span class="inf-ov-bill"></span>
          </div>
          <div class="inf-ov-basket"><span class="inf-ov-slice"></span></div>
        </div>
      </div>
      <div class="inf-ov-controls" role="group" aria-label="${escapeHtml(copy.controlLabel)}">${buttons}</div>
      <p class="inf-ov-status" data-inf-status role="status"></p>
      <p class="inf-ov-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".inf-ov");
  const panel = root.querySelector("[data-inf-panel]");
  const badge = root.querySelector("[data-inf-badge]");
  const headline = root.querySelector("[data-inf-headline]");
  const detail = root.querySelector("[data-inf-detail]");
  const status = root.querySelector("[data-inf-status]");
  const btns = [...root.querySelectorAll("[data-inf-ov]")];

  const select = (index, speak = false) => {
    const mode = copy.modes[index];
    panel.dataset.mode = mode.key;
    badge.textContent = mode.badge;
    headline.textContent = mode.headline;
    detail.textContent = mode.detail;
    status.textContent = mode.key === "nominal" ? copy.statusNominal : copy.statusReal;
    btns.forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
    if (speak) announce(status.textContent);
  };

  btns.forEach((b) => b.addEventListener("click", () => select(Number(b.dataset.infOv), true)));
  select(0);
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => select(0),
    destroy: () => { root.innerHTML = ""; }
  };
});
