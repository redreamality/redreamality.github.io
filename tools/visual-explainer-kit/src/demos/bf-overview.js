registerDemo("bf-overview", ({ root, copy, motion, tokens, announce }) => {
  const buttons = copy.modes.map((mode, index) => `
    <button type="button" class="bf-ov-btn" data-bf-ov="${index}" aria-pressed="${index === 0}">${escapeHtml(mode.label)}</button>`).join("");

  root.innerHTML = `
    <style>
      .bf-ov { display:grid; gap:1rem; min-height:22rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink};
        background:linear-gradient(145deg,color-mix(in srgb,${tokens.ocean} 8%,${tokens.surface}),${tokens.surface} 55%,color-mix(in srgb,${tokens.warm} 10%,${tokens.surface})); }
      .bf-ov-panel { display:grid; gap:.75rem; padding:1.1rem 1.2rem; border:1px solid ${tokens.line}; border-radius:1.1rem;
        background:color-mix(in srgb,${tokens.paper} 55%,${tokens.surface}); min-height:11rem; }
      .bf-ov-badge { display:inline-flex; width:max-content; padding:.25rem .55rem; border-radius:999px; font-size:.68rem; font-weight:850;
        letter-spacing:.04em; text-transform:uppercase; color:${tokens.surface}; background:${tokens.ocean}; }
      .bf-ov-panel[data-mode="myth"] .bf-ov-badge { background:${tokens.warm}; color:${tokens.ink}; }
      .bf-ov-headline { margin:0; font-size:1.15rem; font-weight:850; line-height:1.35; }
      .bf-ov-detail { margin:0; color:${tokens.muted}; line-height:1.55; }
      .bf-ov-viz { position:relative; height:4.5rem; border-radius:.85rem; border:1px dashed ${tokens.line}; overflow:hidden;
        background:color-mix(in srgb,${tokens.surface} 80%,${tokens.paper}); }
      .bf-ov-dot { position:absolute; top:50%; width:.85rem; height:.85rem; border-radius:50%; transform:translate(-50%,-50%);
        transition:left 700ms ease, background 300ms ease; }
      .bf-ov-dot-a { left:18%; background:${tokens.ocean}; box-shadow:0 0 0 .3rem color-mix(in srgb,${tokens.ocean} 25%,transparent); }
      .bf-ov-dot-b { left:22%; background:${tokens.coral}; box-shadow:0 0 0 .3rem color-mix(in srgb,${tokens.coral} 25%,transparent); }
      .bf-ov-panel[data-mode="mechanism"] .bf-ov-dot-a { left:28%; }
      .bf-ov-panel[data-mode="mechanism"] .bf-ov-dot-b { left:78%; }
      .bf-ov-controls { display:flex; flex-wrap:wrap; gap:.55rem; }
      .bf-ov-btn { flex:1 1 8rem; padding:.75rem; border:1px solid ${tokens.line}; border-radius:.8rem; color:${tokens.ink};
        background:${tokens.surface}; font:inherit; font-weight:800; cursor:pointer; }
      .bf-ov-btn[aria-pressed="true"] { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}; }
      .bf-ov-btn:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .bf-ov-status { margin:0; padding:.85rem 1rem; border:1px solid ${tokens.line}; border-radius:.85rem;
        background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); color:${tokens.muted}; line-height:1.5; }
      .bf-ov-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
      .bf-ov.is-paused .bf-ov-dot { transition:none; }
    </style>
    <div class="bf-ov${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="bf-ov-panel" data-bf-panel data-mode="myth">
        <span class="bf-ov-badge" data-bf-badge></span>
        <h3 class="bf-ov-headline" data-bf-headline></h3>
        <p class="bf-ov-detail" data-bf-detail></p>
        <div class="bf-ov-viz" aria-hidden="true">
          <span class="bf-ov-dot bf-ov-dot-a"></span>
          <span class="bf-ov-dot bf-ov-dot-b"></span>
        </div>
      </div>
      <div class="bf-ov-controls" role="group" aria-label="${escapeHtml(copy.controlLabel)}">${buttons}</div>
      <p class="bf-ov-status" data-bf-status role="status"></p>
      <p class="bf-ov-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".bf-ov");
  const panel = root.querySelector("[data-bf-panel]");
  const badge = root.querySelector("[data-bf-badge]");
  const headline = root.querySelector("[data-bf-headline]");
  const detail = root.querySelector("[data-bf-detail]");
  const status = root.querySelector("[data-bf-status]");
  const btns = [...root.querySelectorAll("[data-bf-ov]")];

  const select = (index, speak = false) => {
    const mode = copy.modes[index];
    panel.dataset.mode = mode.key;
    badge.textContent = mode.badge;
    headline.textContent = mode.headline;
    detail.textContent = mode.detail;
    status.textContent = mode.key === "myth" ? copy.statusMyth : copy.statusMechanism;
    btns.forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
    if (speak) announce(status.textContent);
  };

  btns.forEach((b) => b.addEventListener("click", () => select(Number(b.dataset.bfOv), true)));
  select(0);
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => select(0),
    destroy: () => { root.innerHTML = ""; }
  };
});
