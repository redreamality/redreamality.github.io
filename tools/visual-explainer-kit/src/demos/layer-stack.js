registerDemo("layer-stack", ({ root, copy, tokens }) => {
  const layers = copy.layers.map((layer, index) => `
    <button type="button" class="layer layer-${index}" data-layer="${index}" aria-pressed="${index === copy.layers.length - 1}">
      <span>${escapeHtml(layer.label)}</span><small>${escapeHtml(layer.short)}</small>
    </button>`).join("");
  root.innerHTML = `
    <style>
      .layers-demo { display: grid; grid-template-columns: minmax(18rem, .9fr) minmax(0, 1.1fr); gap: 1.5rem; align-items: center; min-height: 25rem; padding: clamp(1rem, 4vw, 2.5rem); color: ${tokens.ink}; background: ${tokens.surface}; }
      .layer-map { display: grid; gap: .65rem; align-items: center; justify-items: center; }
      .layer { display: grid; gap: .25rem; min-height: 3.7rem; place-content: center; padding: .65rem 1rem; border: 1px solid ${tokens.line}; border-radius: 1rem; color: ${tokens.ink}; background: color-mix(in srgb, ${tokens.paper} 35%, ${tokens.surface}); font: inherit; font-weight: 800; text-align: center; cursor: pointer; }
      .layer-0 { width: 36%; }
      .layer-1 { width: 52%; }
      .layer-2 { width: 68%; }
      .layer-3 { width: 84%; }
      .layer-4 { width: 100%; }
      .layer small { color: ${tokens.muted}; font-size: .7rem; font-weight: 700; }
      .layer[aria-pressed="true"] { color: ${tokens.surface}; border-color: ${tokens.ocean}; background: ${tokens.ocean}; }
      .layer[aria-pressed="true"] small { color: inherit; opacity: .82; }
      .layer:focus-visible { outline: 3px solid ${tokens.warm}; outline-offset: 3px; }
      .layer-detail { min-height: 13rem; padding: 1.35rem; border: 1px solid ${tokens.line}; border-radius: 1.2rem; background: color-mix(in srgb, ${tokens.paper} 35%, ${tokens.surface}); }
      .detail-kicker { margin: 0 0 .75rem; color: ${tokens.muted}; font-size: .72rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
      .detail-title { margin: 0 0 .8rem; font-size: 1.35rem; }
      .detail-body { margin: 0; color: ${tokens.muted}; line-height: 1.65; }
      .detail-example { margin: 1rem 0 0; padding-top: 1rem; border-top: 1px solid ${tokens.line}; color: ${tokens.ink}; line-height: 1.55; }
      @media (max-width: 700px) { .layers-demo { grid-template-columns: 1fr; } .layer-map { min-width: 0; } }
    </style>
    <div class="layers-demo" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="layer-map">${layers}</div>
      <div class="layer-detail">
        <p class="detail-kicker">${escapeHtml(copy.detailLabel)}</p>
        <h3 class="detail-title"></h3>
        <p class="detail-body"></p>
        <p class="detail-example"></p>
      </div>
    </div>`;
  const scene = root.querySelector(".layers-demo");
  const title = root.querySelector(".detail-title");
  const body = root.querySelector(".detail-body");
  const example = root.querySelector(".detail-example");
  const buttons = [...root.querySelectorAll("[data-layer]")];
  const select = (index) => {
    const layer = copy.layers[index];
    title.textContent = layer.label;
    body.textContent = layer.detail;
    example.textContent = layer.example;
    scene.dataset.layer = String(index);
    buttons.forEach((button, buttonIndex) => button.setAttribute("aria-pressed", String(buttonIndex === index)));
  };
  buttons.forEach((button) => button.addEventListener("click", () => select(Number(button.dataset.layer))));
  select(copy.layers.length - 1);
  return {
    pause: () => {},
    resume: () => {},
    reset: () => select(copy.layers.length - 1),
    destroy: () => { root.innerHTML = ""; }
  };
});
