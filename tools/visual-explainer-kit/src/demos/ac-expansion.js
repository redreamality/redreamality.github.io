registerDemo("ac-expansion", ({ root, copy, motion, tokens }) => {
  const particles = Array.from({ length: 14 }, (_, index) => `<span style="--ac-particle-index:${index};--ac-particle-row:${index % 4}"></span>`).join("");
  root.innerHTML = `
    <style>
      .ac-expansion-demo { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(15rem, .85fr); gap: 1.5rem; align-items: center; min-height: 26rem; padding: clamp(1rem, 4vw, 2.5rem); color: ${tokens.ink}; background: linear-gradient(145deg, color-mix(in srgb, ${tokens.warm} 10%, ${tokens.surface}), ${tokens.surface} 48%, color-mix(in srgb, ${tokens.ocean} 14%, ${tokens.surface})); }
      .ac-expansion-pipe-map { position: relative; min-height: 18rem; overflow: hidden; border: 1px solid ${tokens.line}; border-radius: 1.35rem; background: color-mix(in srgb, ${tokens.paper} 30%, ${tokens.surface}); }
      .ac-expansion-label { position: absolute; top: 1rem; left: 1rem; margin: 0; color: ${tokens.muted}; font-size: .72rem; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; }
      .ac-expansion-pipe { position: absolute; top: 48%; right: 7%; left: 7%; height: 4.2rem; transform: translateY(-50%); border: .35rem solid ${tokens.ink}; border-radius: 999px; background: linear-gradient(90deg, color-mix(in srgb, ${tokens.warm} 45%, ${tokens.surface}) 0 48%, color-mix(in srgb, ${tokens.ocean} 42%, ${tokens.surface}) 52% 100%); }
      .ac-expansion-valve { position: absolute; z-index: 3; top: 50%; left: 50%; width: 4rem; aspect-ratio: 1; transform: translate(-50%, -50%) rotate(45deg); border: .35rem solid ${tokens.ink}; border-radius: .75rem; background: ${tokens.surface}; }
      .ac-expansion-valve::after { position: absolute; inset: 33%; border-radius: 50%; background: ${tokens.coral}; content: ""; }
      .ac-expansion-particles { position: absolute; inset: .4rem; overflow: hidden; border-radius: 999px; }
      .ac-expansion-particles span { position: absolute; top: calc(14% + var(--ac-particle-row) * 22%); left: -1rem; width: .55rem; aspect-ratio: 1; border-radius: 50%; background: ${tokens.ocean}; animation: ac-expansion-flow 2.4s linear infinite; animation-delay: calc(var(--ac-particle-index) * -.18s); }
      .ac-expansion-particles span:nth-child(-n+7) { background: ${tokens.warm}; }
      .ac-expansion-side-labels { position: absolute; right: 8%; bottom: 16%; left: 8%; display: flex; justify-content: space-between; gap: 2rem; color: ${tokens.muted}; font-size: .7rem; font-weight: 850; }
      .ac-expansion-side-labels span:last-child { color: ${tokens.ocean}; text-align: right; }
      .ac-expansion-panel { display: grid; gap: .9rem; padding: 1.15rem; border: 1px solid ${tokens.line}; border-radius: 1.2rem; background: color-mix(in srgb, ${tokens.surface} 92%, transparent); }
      .ac-expansion-control-label { margin: 0; font-weight: 850; }
      .ac-expansion-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
      .ac-expansion-buttons button { min-height: 3rem; padding: .65rem; border: 1px solid ${tokens.line}; border-radius: .85rem; color: ${tokens.ink}; background: ${tokens.surface}; font: inherit; font-weight: 850; cursor: pointer; }
      .ac-expansion-buttons button[aria-pressed="true"] { color: ${tokens.surface}; border-color: ${tokens.ocean}; background: ${tokens.ocean}; }
      .ac-expansion-buttons button:focus-visible { outline: 3px solid ${tokens.warm}; outline-offset: 2px; }
      .ac-expansion-state { display: grid; gap: .55rem; min-height: 9.5rem; padding: 1rem; border: 1px solid ${tokens.line}; border-radius: .9rem; background: color-mix(in srgb, ${tokens.paper} 35%, ${tokens.surface}); }
      .ac-expansion-state strong { font-size: 1.05rem; }
      .ac-expansion-metrics { display: flex; flex-wrap: wrap; gap: .45rem; }
      .ac-expansion-metrics span { padding: .3rem .55rem; border-radius: 999px; color: ${tokens.muted}; background: ${tokens.surface}; font-size: .7rem; font-weight: 800; }
      .ac-expansion-state p { margin: 0; color: ${tokens.muted}; line-height: 1.55; }
      .ac-expansion-caption { margin: 0; color: ${tokens.muted}; font-size: .76rem; line-height: 1.5; }
      .ac-expansion-demo[data-side="downstream"] .ac-expansion-pipe-map { box-shadow: inset -10rem 0 4rem color-mix(in srgb, ${tokens.ocean} 10%, transparent); }
      .ac-expansion-demo.is-paused .ac-expansion-particles span { animation-play-state: paused; }
      @keyframes ac-expansion-flow { to { transform: translateX(34rem); } }
      @media (max-width: 700px) { .ac-expansion-demo { grid-template-columns: 1fr; } .ac-expansion-pipe-map { min-height: 17rem; } @keyframes ac-expansion-flow { to { transform: translateX(25rem); } } }
    </style>
    <div class="ac-expansion-demo${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="ac-expansion-pipe-map" aria-hidden="true">
        <p class="ac-expansion-label">${escapeHtml(copy.valveLabel)}</p>
        <div class="ac-expansion-pipe"><div class="ac-expansion-particles">${particles}</div></div>
        <div class="ac-expansion-valve"></div>
        <div class="ac-expansion-side-labels"><span>${escapeHtml(copy.upstreamShort)}</span><span>${escapeHtml(copy.downstreamShort)}</span></div>
      </div>
      <div class="ac-expansion-panel">
        <p class="ac-expansion-control-label">${escapeHtml(copy.controlLabel)}</p>
        <div class="ac-expansion-buttons">
          <button type="button" data-ac-side="upstream" aria-pressed="true">${escapeHtml(copy.upstreamButton)}</button>
          <button type="button" data-ac-side="downstream" aria-pressed="false">${escapeHtml(copy.downstreamButton)}</button>
        </div>
        <div class="ac-expansion-state" aria-live="polite"><strong></strong><div class="ac-expansion-metrics"></div><p></p></div>
        <p class="ac-expansion-caption">${escapeHtml(copy.caption)}</p>
      </div>
    </div>`;

  const scene = root.querySelector(".ac-expansion-demo");
  const title = root.querySelector(".ac-expansion-state strong");
  const metrics = root.querySelector(".ac-expansion-metrics");
  const message = root.querySelector(".ac-expansion-state p");
  const buttons = [...root.querySelectorAll("[data-ac-side]")];
  const select = (side) => {
    const downstream = side === "downstream";
    scene.dataset.side = side;
    title.textContent = downstream ? copy.downstreamTitle : copy.upstreamTitle;
    metrics.innerHTML = downstream
      ? `<span>${escapeHtml(copy.lowPressure)}</span><span>${escapeHtml(copy.coldMixture)}</span>`
      : `<span>${escapeHtml(copy.highPressure)}</span><span>${escapeHtml(copy.warmLiquid)}</span>`;
    message.textContent = downstream ? copy.downstreamStatus : copy.upstreamStatus;
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.acSide === side)));
  };
  buttons.forEach((button) => button.addEventListener("click", () => select(button.dataset.acSide)));
  select("upstream");

  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => select("upstream"),
    destroy: () => { root.innerHTML = ""; }
  };
});
