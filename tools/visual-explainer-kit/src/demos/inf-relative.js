registerDemo("inf-relative", ({ root, copy, motion, tokens, announce }) => {
  const buttons = copy.modes.map((mode, index) => `
    <button type="button" class="inf-rel-btn" data-inf-rel="${index}" aria-pressed="${index === 0}">${escapeHtml(mode.label)}</button>`).join("");
  const bars = copy.categories.map((label, index) => `
    <div class="inf-rel-col">
      <div class="inf-rel-bar" data-inf-bar="${index}" style="height:36%"></div>
      <span class="inf-rel-cat">${escapeHtml(label)}</span>
    </div>`).join("");

  root.innerHTML = `
    <style>
      .inf-rel { display:grid; gap:1rem; min-height:22rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink};
        background:linear-gradient(148deg,color-mix(in srgb,${tokens.warm} 8%,${tokens.surface}),${tokens.surface}); }
      .inf-rel-panel { display:grid; gap:.7rem; padding:1.1rem; border:1px solid ${tokens.line}; border-radius:1.1rem;
        background:color-mix(in srgb,${tokens.paper} 50%,${tokens.surface}); }
      .inf-rel-badge { display:inline-flex; width:max-content; padding:.25rem .55rem; border-radius:999px; font-size:.68rem; font-weight:850;
        letter-spacing:.04em; text-transform:uppercase; color:${tokens.surface}; background:${tokens.warm}; }
      .inf-rel-panel[data-mode="general"] .inf-rel-badge { background:${tokens.coral}; }
      .inf-rel-headline { margin:0; font-size:1.1rem; font-weight:850; }
      .inf-rel-detail { margin:0; color:${tokens.muted}; line-height:1.55; }
      .inf-rel-chart { display:flex; align-items:flex-end; justify-content:space-between; gap:.45rem; min-height:9rem;
        padding:.5rem .25rem 0; border-top:1px dashed ${tokens.line}; }
      .inf-rel-col { flex:1; display:flex; flex-direction:column; align-items:center; gap:.35rem; min-width:0; }
      .inf-rel-bar { width:100%; max-width:2.4rem; border-radius:.35rem .35rem 0 0; background:${tokens.ocean};
        transition:height 450ms ease, background 300ms ease; }
      .inf-rel-cat { font-size:.65rem; font-weight:700; color:${tokens.muted}; text-align:center; line-height:1.2; }
      .inf-rel-controls { display:flex; flex-wrap:wrap; gap:.55rem; }
      .inf-rel-btn { flex:1 1 8rem; padding:.75rem; border:1px solid ${tokens.line}; border-radius:.8rem; color:${tokens.ink};
        background:${tokens.surface}; font:inherit; font-weight:800; cursor:pointer; }
      .inf-rel-btn[aria-pressed="true"] { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}; }
      .inf-rel-btn:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .inf-rel-status { margin:0; padding:.85rem 1rem; border:1px solid ${tokens.line}; border-radius:.85rem;
        background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); color:${tokens.muted}; line-height:1.5; }
      .inf-rel-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
      .inf-rel.is-paused .inf-rel-bar { transition:none; }
    </style>
    <div class="inf-rel${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="inf-rel-panel" data-inf-panel data-mode="relative">
        <span class="inf-rel-badge" data-inf-badge></span>
        <h3 class="inf-rel-headline" data-inf-headline></h3>
        <p class="inf-rel-detail" data-inf-detail></p>
        <div class="inf-rel-chart" aria-hidden="true">${bars}</div>
      </div>
      <div class="inf-rel-controls" role="group" aria-label="${escapeHtml(copy.controlLabel)}">${buttons}</div>
      <p class="inf-rel-status" data-inf-status role="status"></p>
      <p class="inf-rel-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".inf-rel");
  const panel = root.querySelector("[data-inf-panel]");
  const badge = root.querySelector("[data-inf-badge]");
  const headline = root.querySelector("[data-inf-headline]");
  const detail = root.querySelector("[data-inf-detail]");
  const status = root.querySelector("[data-inf-status]");
  const barEls = [...root.querySelectorAll("[data-inf-bar]")];
  const btns = [...root.querySelectorAll("[data-inf-rel]")];

  const select = (index, speak = false) => {
    const mode = copy.modes[index];
    panel.dataset.mode = mode.key;
    badge.textContent = mode.badge;
    headline.textContent = mode.headline;
    detail.textContent = mode.detail;
    if (mode.key === "relative") {
      barEls.forEach((el, i) => {
        el.style.height = i === 1 ? "88%" : "34%";
        el.style.background = i === 1 ? tokens.coral : tokens.ocean;
      });
      status.textContent = copy.statusRelative;
    } else {
      barEls.forEach((el) => {
        el.style.height = "70%";
        el.style.background = tokens.coral;
      });
      status.textContent = copy.statusGeneral;
    }
    btns.forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
    if (speak) announce(status.textContent);
  };

  btns.forEach((b) => b.addEventListener("click", () => select(Number(b.dataset.infRel), true)));
  select(0);
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => select(0),
    destroy: () => { root.innerHTML = ""; }
  };
});
