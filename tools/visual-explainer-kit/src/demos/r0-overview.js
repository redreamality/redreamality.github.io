registerDemo("r0-overview", ({ root, copy, motion, tokens, announce }) => {
  const buttons = copy.modes.map((mode, index) => `
    <button type="button" class="r0-ov-btn" data-r0-ov="${index}" aria-pressed="${index === 0}">${escapeHtml(mode.label)}</button>`).join("");

  root.innerHTML = `
    <style>
      .r0-ov { display:grid; gap:1rem; min-height:22rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink};
        background:linear-gradient(145deg,color-mix(in srgb,${tokens.ocean} 8%,${tokens.surface}),${tokens.surface} 55%,color-mix(in srgb,${tokens.coral} 10%,${tokens.surface})); }
      .r0-ov-panel { display:grid; gap:.75rem; padding:1.1rem 1.2rem; border:1px solid ${tokens.line}; border-radius:1.1rem;
        background:color-mix(in srgb,${tokens.paper} 55%,${tokens.surface}); min-height:12rem; }
      .r0-ov-badge { display:inline-flex; width:max-content; padding:.25rem .55rem; border-radius:999px; font-size:.68rem; font-weight:850;
        letter-spacing:.04em; text-transform:uppercase; color:${tokens.surface}; background:${tokens.ocean}; }
      .r0-ov-panel[data-mode="hot"] .r0-ov-badge { background:${tokens.coral}; }
      .r0-ov-headline { margin:0; font-size:1.15rem; font-weight:850; line-height:1.35; }
      .r0-ov-detail { margin:0; color:${tokens.muted}; line-height:1.55; }
      .r0-ov-tree { display:flex; flex-direction:column; align-items:center; gap:.55rem; min-height:8.5rem;
        padding:.85rem; border-radius:.85rem; border:1px dashed ${tokens.line};
        background:color-mix(in srgb,${tokens.surface} 80%,${tokens.paper}); }
      .r0-ov-row { display:flex; flex-wrap:wrap; justify-content:center; gap:.35rem; }
      .r0-ov-node { width:1.15rem; height:1.15rem; border-radius:999px; border:1px solid ${tokens.line};
        background:color-mix(in srgb,${tokens.ocean} 55%,${tokens.surface}); transition:transform 280ms ease, background 280ms ease, opacity 280ms ease; }
      .r0-ov-panel[data-mode="hot"] .r0-ov-node { background:color-mix(in srgb,${tokens.coral} 65%,${tokens.surface}); }
      .r0-ov-node.is-seed { width:1.45rem; height:1.45rem; background:${tokens.warm}; box-shadow:0 0 0 3px color-mix(in srgb,${tokens.warm} 28%,transparent); }
      .r0-ov-controls { display:flex; flex-wrap:wrap; gap:.55rem; }
      .r0-ov-btn { flex:1 1 8rem; padding:.75rem; border:1px solid ${tokens.line}; border-radius:.8rem; color:${tokens.ink};
        background:${tokens.surface}; font:inherit; font-weight:800; cursor:pointer; }
      .r0-ov-btn[aria-pressed="true"] { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}; }
      .r0-ov-btn:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .r0-ov-status { margin:0; padding:.85rem 1rem; border:1px solid ${tokens.line}; border-radius:.85rem;
        background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); color:${tokens.muted}; line-height:1.5; }
      .r0-ov-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
      .r0-ov.is-paused .r0-ov-node { transition:none; }
    </style>
    <div class="r0-ov${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="r0-ov-panel" data-r0-panel data-mode="quiet">
        <span class="r0-ov-badge" data-r0-badge></span>
        <h3 class="r0-ov-headline" data-r0-headline></h3>
        <p class="r0-ov-detail" data-r0-detail></p>
        <div class="r0-ov-tree" data-r0-tree aria-hidden="true"></div>
      </div>
      <div class="r0-ov-controls" role="group" aria-label="${escapeHtml(copy.controlLabel)}">${buttons}</div>
      <p class="r0-ov-status" data-r0-status role="status"></p>
      <p class="r0-ov-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".r0-ov");
  const panel = root.querySelector("[data-r0-panel]");
  const badge = root.querySelector("[data-r0-badge]");
  const headline = root.querySelector("[data-r0-headline]");
  const detail = root.querySelector("[data-r0-detail]");
  const status = root.querySelector("[data-r0-status]");
  const tree = root.querySelector("[data-r0-tree]");
  const btns = [...root.querySelectorAll("[data-r0-ov]")];

  const renderTree = (key) => {
    const counts = key === "hot" ? [1, 3, 7] : [1, 1, 0];
    tree.innerHTML = counts.map((n, gen) => {
      if (n <= 0) return `<div class="r0-ov-row"></div>`;
      const nodes = Array.from({ length: n }, (_, i) =>
        `<span class="r0-ov-node${gen === 0 && i === 0 ? " is-seed" : ""}"></span>`).join("");
      return `<div class="r0-ov-row">${nodes}</div>`;
    }).join("");
  };

  const select = (index, speak = false) => {
    const mode = copy.modes[index];
    panel.dataset.mode = mode.key;
    badge.textContent = mode.badge;
    headline.textContent = mode.headline;
    detail.textContent = mode.detail;
    status.textContent = mode.key === "hot" ? copy.statusHot : copy.statusQuiet;
    renderTree(mode.key);
    btns.forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
    if (speak) announce(status.textContent);
  };

  btns.forEach((b) => b.addEventListener("click", () => select(Number(b.dataset.r0Ov), true)));
  select(0);
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => select(0),
    destroy: () => { root.innerHTML = ""; }
  };
});
