registerDemo("bayes-overview", ({ root, copy, motion, tokens, announce }) => {
  const buttons = copy.modes.map((mode, index) => `
    <button type="button" class="bayes-ov-btn" data-bayes-ov="${index}" aria-pressed="${index === 0}">${escapeHtml(mode.label)}</button>`).join("");

  root.innerHTML = `
    <style>
      .bayes-ov { display:grid; gap:1rem; min-height:22rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink};
        background:linear-gradient(145deg,color-mix(in srgb,${tokens.ocean} 8%,${tokens.surface}),${tokens.surface} 55%,color-mix(in srgb,${tokens.warm} 10%,${tokens.surface})); }
      .bayes-ov-panel { display:grid; gap:.75rem; padding:1.1rem 1.2rem; border:1px solid ${tokens.line}; border-radius:1.1rem;
        background:color-mix(in srgb,${tokens.paper} 55%,${tokens.surface}); min-height:12rem; }
      .bayes-ov-badge { display:inline-flex; width:max-content; padding:.25rem .55rem; border-radius:999px; font-size:.68rem; font-weight:850;
        letter-spacing:.04em; text-transform:uppercase; color:${tokens.surface}; background:${tokens.coral}; }
      .bayes-ov-panel[data-mode="calm"] .bayes-ov-badge { background:${tokens.ocean}; }
      .bayes-ov-headline { margin:0; font-size:1.15rem; font-weight:850; line-height:1.35; }
      .bayes-ov-detail { margin:0; color:${tokens.muted}; line-height:1.55; }
      .bayes-ov-viz { display:grid; grid-template-columns:1fr auto 1fr; gap:.75rem; align-items:end; min-height:7rem;
        padding:.75rem; border-radius:.85rem; border:1px dashed ${tokens.line};
        background:color-mix(in srgb,${tokens.surface} 80%,${tokens.paper}); }
      .bayes-ov-bar-wrap { display:grid; gap:.35rem; align-content:end; }
      .bayes-ov-bar-label { font-size:.7rem; font-weight:750; color:${tokens.muted}; text-align:center; }
      .bayes-ov-bar { height:5.5rem; border-radius:.55rem; display:flex; flex-direction:column-reverse; overflow:hidden;
        border:1px solid ${tokens.line}; background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); }
      .bayes-ov-seg-has { background:${tokens.coral}; transition:flex-basis 400ms ease; }
      .bayes-ov-seg-clear { background:color-mix(in srgb,${tokens.ocean} 55%,${tokens.surface}); transition:flex-basis 400ms ease; }
      .bayes-ov-arrow { align-self:center; font-size:1.4rem; font-weight:900; color:${tokens.warm}; padding:0 .25rem; }
      .bayes-ov-slip { align-self:center; padding:.55rem .7rem; border-radius:.65rem; border:1px solid ${tokens.line};
        background:${tokens.surface}; font-size:.78rem; font-weight:850; text-align:center; line-height:1.3; }
      .bayes-ov-slip span { display:block; color:${tokens.coral}; font-size:.95rem; }
      .bayes-ov-controls { display:flex; flex-wrap:wrap; gap:.55rem; }
      .bayes-ov-btn { flex:1 1 8rem; padding:.75rem; border:1px solid ${tokens.line}; border-radius:.8rem; color:${tokens.ink};
        background:${tokens.surface}; font:inherit; font-weight:800; cursor:pointer; }
      .bayes-ov-btn[aria-pressed="true"] { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}; }
      .bayes-ov-btn:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .bayes-ov-status { margin:0; padding:.85rem 1rem; border:1px solid ${tokens.line}; border-radius:.85rem;
        background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); color:${tokens.muted}; line-height:1.5; }
      .bayes-ov-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
      .bayes-ov.is-paused .bayes-ov-seg-has, .bayes-ov.is-paused .bayes-ov-seg-clear { transition:none; }
    </style>
    <div class="bayes-ov${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="bayes-ov-panel" data-bayes-panel data-mode="afraid">
        <span class="bayes-ov-badge" data-bayes-badge></span>
        <h3 class="bayes-ov-headline" data-bayes-headline></h3>
        <p class="bayes-ov-detail" data-bayes-detail></p>
        <div class="bayes-ov-viz" aria-hidden="true">
          <div class="bayes-ov-bar-wrap">
            <div class="bayes-ov-bar">
              <div class="bayes-ov-seg-has" data-bayes-has style="flex:0 0 55%"></div>
              <div class="bayes-ov-seg-clear" data-bayes-clear style="flex:1 1 auto"></div>
            </div>
            <div class="bayes-ov-bar-label">prior</div>
          </div>
          <div class="bayes-ov-arrow">→</div>
          <div class="bayes-ov-slip">lab<br/><span>+</span></div>
        </div>
      </div>
      <div class="bayes-ov-controls" role="group" aria-label="${escapeHtml(copy.controlLabel)}">${buttons}</div>
      <p class="bayes-ov-status" data-bayes-status role="status"></p>
      <p class="bayes-ov-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".bayes-ov");
  const panel = root.querySelector("[data-bayes-panel]");
  const badge = root.querySelector("[data-bayes-badge]");
  const headline = root.querySelector("[data-bayes-headline]");
  const detail = root.querySelector("[data-bayes-detail]");
  const status = root.querySelector("[data-bayes-status]");
  const hasSeg = root.querySelector("[data-bayes-has]");
  const btns = [...root.querySelectorAll("[data-bayes-ov]")];

  const select = (index, speak = false) => {
    const mode = copy.modes[index];
    panel.dataset.mode = mode.key;
    badge.textContent = mode.badge;
    headline.textContent = mode.headline;
    detail.textContent = mode.detail;
    status.textContent = mode.key === "afraid" ? copy.statusAfraid : copy.statusCalm;
    hasSeg.style.flex = mode.key === "afraid" ? "0 0 55%" : "0 0 8%";
    btns.forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
    if (speak) announce(status.textContent);
  };

  btns.forEach((b) => b.addEventListener("click", () => select(Number(b.dataset.bayesOv), true)));
  select(0);
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => select(0),
    destroy: () => { root.innerHTML = ""; }
  };
});
