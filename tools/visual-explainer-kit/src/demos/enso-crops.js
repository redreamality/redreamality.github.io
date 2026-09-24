registerDemo("enso-crops", ({ root, copy, motion, tokens, announce }) => {
  const cropCards = copy.crops.map((crop) => `
    <article class="enso-crop-card" data-enso-crop="${escapeHtml(crop.id)}">
      <strong>${escapeHtml(crop.name)}</strong>
      <div class="enso-crop-meter" aria-hidden="true"><i data-enso-yield-bar></i></div>
      <div class="enso-crop-meter enso-crop-meter-logistics" aria-hidden="true"><i data-enso-logistics-bar></i></div>
    </article>`).join("");

  root.innerHTML = `
    <style>
      .enso-crops { display:grid; gap:1rem; min-height:26rem; padding:clamp(1rem,4vw,2.25rem); color:${tokens.ink}; background:linear-gradient(150deg,color-mix(in srgb,${tokens.warm} 10%,${tokens.surface}),${tokens.surface} 58%,color-mix(in srgb,${tokens.ocean} 10%,${tokens.surface})); }
      .enso-crop-panel { display:grid; gap:.85rem; padding:1rem; border:1px solid ${tokens.line}; border-radius:1.1rem; background:color-mix(in srgb,${tokens.paper} 38%,${tokens.surface}); }
      .enso-crop-panel label { font-weight:850; }
      .enso-crop-panel input { width:100%; accent-color:${tokens.ocean}; }
      .enso-crop-range { display:flex; justify-content:space-between; color:${tokens.muted}; font-size:.72rem; }
      .enso-crop-metrics { display:grid; grid-template-columns:1fr 1fr; gap:.65rem; }
      .enso-crop-metric { padding:.75rem; border:1px solid ${tokens.line}; border-radius:.8rem; background:${tokens.surface}; }
      .enso-crop-metric small { display:block; margin-bottom:.25rem; color:${tokens.muted}; font-size:.66rem; }
      .enso-crop-metric output { font-size:1.2rem; font-weight:900; color:${tokens.ocean}; }
      .enso-crop-basket { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.65rem; }
      .enso-crop-card { display:grid; gap:.45rem; padding:.8rem; border:1px solid ${tokens.line}; border-radius:.85rem; background:${tokens.surface}; }
      .enso-crop-card strong { font-size:.82rem; }
      .enso-crop-meter { height:.55rem; overflow:hidden; border-radius:999px; background:color-mix(in srgb,${tokens.line} 70%,${tokens.surface}); }
      .enso-crop-meter i { display:block; height:100%; width:calc(var(--enso-fill, 20) * 1%); border-radius:inherit; background:${tokens.coral}; transition:width .2s ease; }
      .enso-crop-meter-logistics i { background:${tokens.warm}; }
      .enso-crop-status { min-height:4.5rem; margin:0; padding:1rem; border-left:.28rem solid ${tokens.warm}; border-radius:.75rem; background:color-mix(in srgb,${tokens.paper} 42%,${tokens.surface}); color:${tokens.muted}; line-height:1.55; }
      .enso-crop-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
      .enso-crops.is-paused .enso-crop-meter i { transition:none; }
      @media (max-width:560px) { .enso-crop-basket, .enso-crop-metrics { grid-template-columns:1fr; } }
    </style>
    <div class="enso-crops${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="enso-crop-panel">
        <label for="enso-crop-stress">${escapeHtml(copy.controlLabel)}</label>
        <input id="enso-crop-stress" type="range" min="0" max="100" value="35" aria-label="${escapeHtml(copy.controlLabel)}">
        <div class="enso-crop-range"><span>${escapeHtml(copy.lowLabel)}</span><span>${escapeHtml(copy.highLabel)}</span></div>
        <div class="enso-crop-metrics">
          <div class="enso-crop-metric"><small>${escapeHtml(copy.yieldLabel)}</small><output data-enso-yield></output></div>
          <div class="enso-crop-metric"><small>${escapeHtml(copy.logisticsLabel)}</small><output data-enso-logistics></output></div>
        </div>
      </div>
      <div>
        <p style="margin:0 0 .55rem; font-weight:850;">${escapeHtml(copy.basketLabel)}</p>
        <div class="enso-crop-basket">${cropCards}</div>
      </div>
      <p class="enso-crop-status" data-enso-crop-status aria-live="polite"></p>
      <p class="enso-crop-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".enso-crops");
  const range = root.querySelector("#enso-crop-stress");
  const yieldOut = root.querySelector("[data-enso-yield]");
  const logisticsOut = root.querySelector("[data-enso-logistics]");
  const status = root.querySelector("[data-enso-crop-status]");
  const cards = [...root.querySelectorAll("[data-enso-crop]")];
  let lastBand = "";
  const update = (speak = false) => {
    const value = Number(range.value);
    const yieldRisk = Math.round(18 + value * 0.72);
    const logisticsRisk = Math.round(12 + value * 0.58 + (value > 70 ? 10 : 0));
    yieldOut.textContent = `${yieldRisk}%`;
    logisticsOut.textContent = `${logisticsRisk}%`;
    cards.forEach((card, index) => {
      const bias = (index % 3) * 4;
      card.querySelector("[data-enso-yield-bar]").style.setProperty("--enso-fill", String(Math.min(100, yieldRisk + bias)));
      card.querySelector("[data-enso-logistics-bar]").style.setProperty("--enso-fill", String(Math.min(100, logisticsRisk + (2 - index % 3) * 5)));
    });
    const band = value < 34 ? "low" : value < 68 ? "medium" : "high";
    const message = band === "low" ? copy.statusLow : band === "medium" ? copy.statusMedium : copy.statusHigh;
    status.textContent = message;
    if (speak && band !== lastBand) announce(message);
    lastBand = band;
  };
  range.addEventListener("input", () => update(true));
  update();
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => { range.value = "35"; lastBand = ""; update(); },
    destroy: () => { root.innerHTML = ""; }
  };
});
