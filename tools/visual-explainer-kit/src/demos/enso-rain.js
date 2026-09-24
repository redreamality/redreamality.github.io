registerDemo("enso-rain", ({ root, copy, motion, tokens, announce }) => {
  const phaseButtons = copy.phases.map((phase, index) => `
    <button type="button" class="enso-rain-phase" data-enso-rain-phase="${index}" aria-pressed="${index === 0}">${escapeHtml(phase.label)}</button>`).join("");

  root.innerHTML = `
    <style>
      .enso-rain { display:grid; gap:1rem; min-height:26rem; padding:clamp(1rem,4vw,2.25rem); color:${tokens.ink}; background:linear-gradient(145deg,color-mix(in srgb,${tokens.ocean} 11%,${tokens.surface}),${tokens.surface} 58%,color-mix(in srgb,${tokens.warm} 9%,${tokens.surface})); }
      .enso-rain-map { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.7rem; min-height:14rem; }
      .enso-rain-region { display:grid; gap:.35rem; align-content:start; min-height:6.5rem; padding:.9rem; border:1px solid ${tokens.line}; border-radius:1rem; background:${tokens.surface}; transition:background .2s ease, border-color .2s ease; }
      .enso-rain-region[data-state="wet"] { border-color:${tokens.ocean}; background:color-mix(in srgb,${tokens.ocean} 14%,${tokens.surface}); }
      .enso-rain-region[data-state="dry"] { border-color:${tokens.coral}; background:color-mix(in srgb,${tokens.coral} 12%,${tokens.surface}); }
      .enso-rain-region strong { font-size:.88rem; }
      .enso-rain-region span { color:${tokens.muted}; font-size:.72rem; }
      .enso-rain-badge { justify-self:start; padding:.2rem .55rem; border-radius:999px; font-size:.66rem; font-weight:850; }
      .enso-rain-region[data-state="wet"] .enso-rain-badge { color:${tokens.surface}; background:${tokens.ocean}; }
      .enso-rain-region[data-state="dry"] .enso-rain-badge { color:${tokens.surface}; background:${tokens.coral}; }
      .enso-rain-drop { width:.55rem; height:.55rem; border-radius:50% 50% 45% 45%; background:${tokens.ocean}; opacity:0; animation:enso-rain-fall 1.3s linear infinite; }
      .enso-rain-region[data-state="wet"] .enso-rain-drop { opacity:.85; }
      .enso-rain-region[data-state="dry"] .enso-rain-drop { background:${tokens.coral}; opacity:.35; animation:none; transform:scale(.7); }
      .enso-rain-controls { display:flex; flex-wrap:wrap; gap:.55rem; }
      .enso-rain-phase { flex:1 1 10rem; padding:.75rem; border:1px solid ${tokens.line}; border-radius:.8rem; color:${tokens.ink}; background:${tokens.surface}; font:inherit; font-weight:800; cursor:pointer; }
      .enso-rain-phase[aria-pressed="true"] { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}; }
      .enso-rain-phase:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .enso-rain-status { min-height:4.8rem; margin:0; padding:1rem; border-left:.28rem solid ${tokens.ocean}; border-radius:.75rem; background:color-mix(in srgb,${tokens.paper} 42%,${tokens.surface}); color:${tokens.muted}; line-height:1.55; }
      .enso-rain-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
      .enso-rain.is-paused .enso-rain-drop { animation-play-state:paused; }
      @keyframes enso-rain-fall { from { transform:translateY(-.4rem); } to { transform:translateY(1.1rem); opacity:.15; } }
      @media (max-width:560px) { .enso-rain-map { grid-template-columns:1fr; } }
    </style>
    <div class="enso-rain${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="enso-rain-map" data-enso-rain-map></div>
      <div class="enso-rain-controls" role="group" aria-label="${escapeHtml(copy.controlLabel)}">${phaseButtons}</div>
      <p class="enso-rain-status" data-enso-rain-status aria-live="polite"></p>
      <p class="enso-rain-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".enso-rain");
  const map = root.querySelector("[data-enso-rain-map]");
  const status = root.querySelector("[data-enso-rain-status]");
  const buttons = [...root.querySelectorAll("[data-enso-rain-phase]")];
  const select = (index, speak = false) => {
    const phase = copy.phases[index];
    map.innerHTML = phase.regions.map((region) => `
      <article class="enso-rain-region" data-state="${escapeHtml(region.state)}">
        <strong>${escapeHtml(region.name)}</strong>
        <span class="enso-rain-badge">${escapeHtml(region.state === "wet" ? copy.wetLabel : copy.dryLabel)}</span>
        <span>${escapeHtml(region.note)}</span>
        <span class="enso-rain-drop" aria-hidden="true"></span>
      </article>`).join("");
    status.textContent = phase.status;
    buttons.forEach((button, buttonIndex) => button.setAttribute("aria-pressed", String(buttonIndex === index)));
    if (speak) announce(phase.status);
  };
  buttons.forEach((button) => button.addEventListener("click", () => select(Number(button.dataset.ensoRainPhase), true)));
  select(0);
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => select(0),
    destroy: () => { root.innerHTML = ""; }
  };
});
