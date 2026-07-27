registerDemo("ac-cycle-overview", ({ root, copy, motion, tokens }) => {
  const stageButtons = copy.stages.map((stage, index) => `
    <button type="button" class="ac-overview-stage-button" data-ac-stage="${index}" aria-pressed="${index === 0}">
      <span>${escapeHtml(stage.label)}</span>
      <small>${escapeHtml(stage.state)}</small>
    </button>`).join("");

  root.innerHTML = `
    <style>
      .ac-overview-demo { display: grid; gap: 1.25rem; min-height: 27rem; padding: clamp(1rem, 4vw, 2.5rem); color: ${tokens.ink}; background: linear-gradient(135deg, color-mix(in srgb, ${tokens.ocean} 9%, ${tokens.surface}), ${tokens.surface} 52%, color-mix(in srgb, ${tokens.warm} 10%, ${tokens.surface})); }
      .ac-overview-board { position: relative; min-height: 22rem; overflow: hidden; border: 1px solid ${tokens.line}; border-radius: 1.4rem; background: color-mix(in srgb, ${tokens.paper} 28%, ${tokens.surface}); }
      .ac-overview-zone { position: absolute; z-index: 2; top: .9rem; margin: 0; padding: .35rem .65rem; border-radius: 999px; color: ${tokens.muted}; background: color-mix(in srgb, ${tokens.surface} 88%, transparent); font-size: .72rem; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; }
      .ac-overview-zone-indoor { left: .9rem; }
      .ac-overview-zone-outdoor { right: .9rem; }
      .ac-overview-svg { position: absolute; inset: 2.4rem 1rem 1rem; width: calc(100% - 2rem); height: calc(100% - 3.4rem); }
      .ac-overview-pipe { fill: none; stroke: ${tokens.line}; stroke-width: 12; stroke-linecap: round; stroke-linejoin: round; }
      .ac-overview-flow { fill: none; stroke: ${tokens.ocean}; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 12 15; animation: ac-overview-dash 1.15s linear infinite; }
      .ac-overview-node { position: absolute; z-index: 3; display: grid; place-items: center; width: clamp(7.3rem, 21vw, 10rem); min-height: 4.5rem; padding: .75rem; border: 1px solid ${tokens.line}; border-radius: 1rem; color: ${tokens.ink}; background: color-mix(in srgb, ${tokens.surface} 94%, transparent); box-shadow: 0 .8rem 2rem color-mix(in srgb, ${tokens.ink} 9%, transparent); font-weight: 850; text-align: center; }
      .ac-overview-node[data-node="0"] { left: 6%; bottom: 12%; border-color: ${tokens.ocean}; }
      .ac-overview-node[data-node="1"] { right: 6%; bottom: 12%; border-color: ${tokens.coral}; }
      .ac-overview-node[data-node="2"] { right: 6%; top: 18%; border-color: ${tokens.warm}; }
      .ac-overview-node[data-node="3"] { left: 6%; top: 18%; border-color: ${tokens.ocean}; }
      .ac-overview-node.is-active { color: ${tokens.surface}; border-color: ${tokens.ocean}; background: ${tokens.ocean}; transform: translateY(-2px); }
      .ac-overview-energy { position: absolute; z-index: 4; display: grid; gap: .15rem; color: ${tokens.coral}; font-size: .72rem; font-weight: 850; text-align: center; }
      .ac-overview-energy span { font-size: 1.25rem; line-height: 1; }
      .ac-overview-heat-in { left: 29%; bottom: 18%; }
      .ac-overview-work-in { right: 29%; bottom: 18%; }
      .ac-overview-heat-out { right: 28%; top: 22%; color: ${tokens.warm}; }
      .ac-overview-controls { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .6rem; }
      .ac-overview-stage-button { display: grid; gap: .2rem; min-height: 4.5rem; padding: .65rem; border: 1px solid ${tokens.line}; border-radius: .9rem; color: ${tokens.ink}; background: ${tokens.surface}; font: inherit; text-align: left; cursor: pointer; }
      .ac-overview-stage-button span { font-size: .82rem; font-weight: 850; }
      .ac-overview-stage-button small { color: ${tokens.muted}; font-size: .68rem; line-height: 1.35; }
      .ac-overview-stage-button[aria-pressed="true"] { border-color: ${tokens.ocean}; box-shadow: inset 0 0 0 1px ${tokens.ocean}; }
      .ac-overview-stage-button:focus-visible { outline: 3px solid ${tokens.warm}; outline-offset: 2px; }
      .ac-overview-detail { min-height: 7rem; padding: 1rem 1.1rem; border-left: .28rem solid ${tokens.ocean}; border-radius: .8rem; background: color-mix(in srgb, ${tokens.paper} 38%, ${tokens.surface}); }
      .ac-overview-detail strong { display: block; margin-bottom: .45rem; font-size: 1rem; }
      .ac-overview-detail p { margin: 0; color: ${tokens.muted}; line-height: 1.6; }
      .ac-overview-caption { margin: 0; color: ${tokens.muted}; font-size: .78rem; text-align: center; }
      .ac-overview-demo.is-paused .ac-overview-flow { animation-play-state: paused; }
      @keyframes ac-overview-dash { to { stroke-dashoffset: -54; } }
      @media (max-width: 680px) {
        .ac-overview-board { min-height: 25rem; }
        .ac-overview-node { width: 7rem; min-height: 4rem; font-size: .74rem; }
        .ac-overview-controls { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .ac-overview-energy { width: 38%; padding: .2rem .3rem; border-radius: .55rem; background: color-mix(in srgb, ${tokens.surface} 84%, transparent); font-size: .58rem; line-height: 1.2; }
        .ac-overview-energy span { font-size: 1rem; }
        .ac-overview-heat-in { top: 54%; bottom: auto; left: 4%; }
        .ac-overview-work-in { top: 57%; right: 4%; bottom: auto; }
        .ac-overview-heat-out { top: 41%; right: 4%; }
      }
    </style>
    <div class="ac-overview-demo${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="ac-overview-board">
        <p class="ac-overview-zone ac-overview-zone-indoor">${escapeHtml(copy.indoorZone)}</p>
        <p class="ac-overview-zone ac-overview-zone-outdoor">${escapeHtml(copy.outdoorZone)}</p>
        <svg class="ac-overview-svg" viewBox="0 0 720 340" preserveAspectRatio="none" aria-hidden="true">
          <path class="ac-overview-pipe" d="M150 275 C85 250 85 90 150 65 H570 C635 90 635 250 570 275 Z"></path>
          <path class="ac-overview-flow" d="M150 275 C85 250 85 90 150 65 H570 C635 90 635 250 570 275 Z"></path>
        </svg>
        ${copy.stages.map((stage, index) => `<div class="ac-overview-node${index === 0 ? " is-active" : ""}" data-node="${index}">${escapeHtml(stage.label)}</div>`).join("")}
        <div class="ac-overview-energy ac-overview-heat-in"><span aria-hidden="true">↑</span>${escapeHtml(copy.heatIn)}</div>
        <div class="ac-overview-energy ac-overview-work-in"><span aria-hidden="true">↗</span>${escapeHtml(copy.workIn)}</div>
        <div class="ac-overview-energy ac-overview-heat-out"><span aria-hidden="true">↑</span>${escapeHtml(copy.heatOut)}</div>
      </div>
      <div class="ac-overview-controls" aria-label="${escapeHtml(copy.stageControlLabel)}">${stageButtons}</div>
      <div class="ac-overview-detail" aria-live="polite"><strong></strong><p></p></div>
      <p class="ac-overview-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".ac-overview-demo");
  const detailTitle = root.querySelector(".ac-overview-detail strong");
  const detailBody = root.querySelector(".ac-overview-detail p");
  const buttons = [...root.querySelectorAll("[data-ac-stage]")];
  const nodes = [...root.querySelectorAll("[data-node]")];
  const select = (index) => {
    const stage = copy.stages[index];
    detailTitle.textContent = stage.label;
    detailBody.textContent = stage.detail;
    scene.dataset.stage = String(index);
    buttons.forEach((button, buttonIndex) => button.setAttribute("aria-pressed", String(buttonIndex === index)));
    nodes.forEach((node, nodeIndex) => node.classList.toggle("is-active", nodeIndex === index));
  };
  buttons.forEach((button) => button.addEventListener("click", () => select(Number(button.dataset.acStage))));
  select(0);

  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => select(0),
    destroy: () => { root.innerHTML = ""; }
  };
});
