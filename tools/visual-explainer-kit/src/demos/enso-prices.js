registerDemo("enso-prices", ({ root, copy, motion, tokens, announce }) => {
  const stageButtons = copy.stages.map((stage, index) => `
    <button type="button" class="enso-price-stage" data-enso-price-stage="${index}" aria-pressed="${index === 0}">${escapeHtml(stage.label)}</button>`).join("");

  root.innerHTML = `
    <style>
      .enso-prices { display:grid; gap:1rem; min-height:26rem; padding:clamp(1rem,4vw,2.25rem); color:${tokens.ink}; background:linear-gradient(145deg,color-mix(in srgb,${tokens.coral} 9%,${tokens.surface}),${tokens.surface} 55%,color-mix(in srgb,${tokens.ocean} 10%,${tokens.surface})); }
      .enso-price-sliders { display:grid; grid-template-columns:1fr 1fr; gap:.8rem; }
      .enso-price-sliders label { display:grid; gap:.45rem; padding:.85rem; border:1px solid ${tokens.line}; border-radius:.9rem; background:${tokens.surface}; font-weight:850; }
      .enso-price-sliders input { width:100%; accent-color:${tokens.coral}; }
      .enso-price-pipeline { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:.55rem; }
      .enso-price-node { display:grid; gap:.35rem; min-height:7rem; padding:.8rem; border:1px solid ${tokens.line}; border-radius:.9rem; background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); }
      .enso-price-node.is-active { border-color:${tokens.coral}; box-shadow:inset 0 0 0 1px ${tokens.coral}; }
      .enso-price-node strong { font-size:.82rem; }
      .enso-price-node span { color:${tokens.muted}; font-size:.7rem; line-height:1.4; }
      .enso-price-bar { height:.55rem; overflow:hidden; border-radius:999px; background:color-mix(in srgb,${tokens.line} 70%,${tokens.surface}); }
      .enso-price-bar i { display:block; height:100%; width:calc(var(--enso-level, 20) * 1%); background:linear-gradient(90deg,${tokens.ocean},${tokens.coral}); transition:width .25s ease; }
      .enso-price-metrics { display:grid; grid-template-columns:1fr 1fr; gap:.65rem; }
      .enso-price-metric { padding:.8rem; border:1px solid ${tokens.line}; border-radius:.8rem; background:${tokens.surface}; text-align:center; }
      .enso-price-metric small { display:block; margin-bottom:.25rem; color:${tokens.muted}; font-size:.66rem; }
      .enso-price-metric output { font-size:1.25rem; font-weight:900; color:${tokens.coral}; }
      .enso-price-controls { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:.5rem; }
      .enso-price-stage { padding:.7rem .45rem; border:1px solid ${tokens.line}; border-radius:.75rem; color:${tokens.ink}; background:${tokens.surface}; font:inherit; font-size:.74rem; font-weight:800; cursor:pointer; }
      .enso-price-stage[aria-pressed="true"] { border-color:${tokens.coral}; box-shadow:inset 0 0 0 1px ${tokens.coral}; }
      .enso-price-stage:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .enso-price-status { min-height:4.2rem; margin:0; padding:1rem; border-left:.28rem solid ${tokens.coral}; border-radius:.75rem; background:color-mix(in srgb,${tokens.paper} 42%,${tokens.surface}); color:${tokens.muted}; line-height:1.55; }
      .enso-price-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
      .enso-prices.is-paused .enso-price-bar i { transition:none; }
      @media (max-width:720px) {
        .enso-price-sliders, .enso-price-metrics, .enso-price-pipeline, .enso-price-controls { grid-template-columns:1fr 1fr; }
      }
      @media (max-width:520px) {
        .enso-price-pipeline, .enso-price-controls { grid-template-columns:1fr; }
      }
    </style>
    <div class="enso-prices${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="enso-price-sliders">
        <label>${escapeHtml(copy.shockLabel)}<input data-enso-shock type="range" min="10" max="100" value="55" aria-label="${escapeHtml(copy.shockLabel)}"></label>
        <label>${escapeHtml(copy.inventoryLabel)}<input data-enso-inventory type="range" min="0" max="100" value="40" aria-label="${escapeHtml(copy.inventoryLabel)}"></label>
      </div>
      <div class="enso-price-pipeline" data-enso-pipeline>
        ${copy.stages.map((stage, index) => `
          <article class="enso-price-node${index === 0 ? " is-active" : ""}" data-enso-price-node="${index}">
            <strong>${escapeHtml(stage.label)}</strong>
            <span data-enso-price-detail>${escapeHtml(stage.detail)}</span>
            <div class="enso-price-bar" aria-hidden="true"><i data-enso-price-bar></i></div>
          </article>`).join("")}
      </div>
      <div class="enso-price-metrics">
        <div class="enso-price-metric"><small>${escapeHtml(copy.wholesaleLabel)}</small><output data-enso-wholesale></output></div>
        <div class="enso-price-metric"><small>${escapeHtml(copy.retailLabel)}</small><output data-enso-retail></output></div>
      </div>
      <div class="enso-price-controls" role="group" aria-label="${escapeHtml(copy.controlLabel)}">${stageButtons}</div>
      <p class="enso-price-status" data-enso-price-status aria-live="polite"></p>
      <p class="enso-price-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".enso-prices");
  const shock = root.querySelector("[data-enso-shock]");
  const inventory = root.querySelector("[data-enso-inventory]");
  const wholesale = root.querySelector("[data-enso-wholesale]");
  const retail = root.querySelector("[data-enso-retail]");
  const status = root.querySelector("[data-enso-price-status]");
  const buttons = [...root.querySelectorAll("[data-enso-price-stage]")];
  const nodes = [...root.querySelectorAll("[data-enso-price-node]")];
  let stageIndex = 0;
  const formatIndex = (value) => `${Math.round(value)}`;
  const selectStage = (index, speak = false) => {
    stageIndex = index;
    buttons.forEach((button, buttonIndex) => button.setAttribute("aria-pressed", String(buttonIndex === index)));
    nodes.forEach((node, nodeIndex) => node.classList.toggle("is-active", nodeIndex === index));
    if (speak) announce(copy.stages[index].detail);
    render();
  };
  const render = () => {
    const shockValue = Number(shock.value);
    const inventoryValue = Number(inventory.value);
    const buffer = inventoryValue / 100;
    const wholesaleValue = Math.round(100 + shockValue * (0.85 - buffer * 0.45));
    const lag = 0.55 + stageIndex * 0.12;
    const retailValue = Math.round(100 + (wholesaleValue - 100) * lag * (0.9 - buffer * 0.25));
    wholesale.textContent = formatIndex(wholesaleValue);
    retail.textContent = formatIndex(retailValue);
    nodes.forEach((node, index) => {
      const level = Math.min(100, Math.round((shockValue * (0.35 + index * 0.18)) * (1 - buffer * 0.35)));
      node.querySelector("[data-enso-price-bar]").style.setProperty("--enso-level", String(level));
    });
    status.textContent = copy.statusTemplate
      .replace("{shock}", String(shockValue))
      .replace("{inventory}", String(inventoryValue))
      .replace("{wholesale}", formatIndex(wholesaleValue))
      .replace("{retail}", formatIndex(retailValue));
  };
  buttons.forEach((button) => button.addEventListener("click", () => selectStage(Number(button.dataset.ensoPriceStage), true)));
  shock.addEventListener("input", render);
  inventory.addEventListener("input", render);
  selectStage(0);
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => { shock.value = "55"; inventory.value = "40"; selectStage(0); },
    destroy: () => { root.innerHTML = ""; }
  };
});
