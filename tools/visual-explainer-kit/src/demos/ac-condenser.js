registerDemo("ac-condenser", ({ root, copy, motion, tokens }) => {
  root.innerHTML = `
    <style>
      .ac-condenser-demo { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(15rem, .85fr); gap: 1.5rem; align-items: center; min-height: 26rem; padding: clamp(1rem, 4vw, 2.5rem); color: ${tokens.ink}; background: linear-gradient(145deg, ${tokens.surface}, color-mix(in srgb, ${tokens.warm} 14%, ${tokens.surface})); }
      .ac-condenser-unit { position: relative; min-height: 19rem; overflow: hidden; border: 1px solid ${tokens.line}; border-radius: 1.35rem; background: color-mix(in srgb, ${tokens.paper} 32%, ${tokens.surface}); }
      .ac-condenser-unit-label { position: absolute; top: 1rem; left: 1rem; margin: 0; color: ${tokens.muted}; font-size: .72rem; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; }
      .ac-condenser-coil { position: absolute; top: 22%; right: 12%; bottom: 18%; left: 12%; border: .7rem double ${tokens.coral}; border-radius: 1.5rem; background: repeating-linear-gradient(90deg, transparent 0 1rem, color-mix(in srgb, ${tokens.coral} 28%, transparent) 1rem 1.15rem); box-shadow: 0 0 2.5rem color-mix(in srgb, ${tokens.coral} 22%, transparent); }
      .ac-condenser-fan { position: absolute; top: 50%; left: 50%; width: 7rem; aspect-ratio: 1; transform: translate(-50%, -50%); border: .4rem solid ${tokens.ink}; border-radius: 50%; background: ${tokens.surface}; }
      .ac-condenser-blade { position: absolute; inset: 13%; animation: ac-condenser-spin 1.35s linear infinite; }
      .ac-condenser-blade::before, .ac-condenser-blade::after { position: absolute; inset: 40% 2%; border-radius: 999px; background: ${tokens.ocean}; content: ""; }
      .ac-condenser-blade::after { transform: rotate(90deg); }
      .ac-condenser-hub { position: absolute; inset: 39%; z-index: 2; border-radius: 50%; background: ${tokens.ink}; }
      .ac-condenser-heat { position: absolute; top: 42%; color: ${tokens.coral}; font-size: 2rem; font-weight: 900; animation: ac-condenser-pulse 1.2s ease-in-out infinite alternate; }
      .ac-condenser-heat-left { left: 3%; }
      .ac-condenser-heat-right { right: 3%; }
      .ac-condenser-equation { position: absolute; right: 1rem; bottom: .8rem; left: 1rem; margin: 0; color: ${tokens.muted}; font-size: .72rem; font-weight: 800; text-align: center; }
      .ac-condenser-panel { display: grid; gap: .9rem; padding: 1.15rem; border: 1px solid ${tokens.line}; border-radius: 1.2rem; background: color-mix(in srgb, ${tokens.surface} 92%, transparent); }
      .ac-condenser-control-label { margin: 0; font-weight: 850; }
      .ac-condenser-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
      .ac-condenser-buttons button { min-height: 3rem; padding: .65rem; border: 1px solid ${tokens.line}; border-radius: .85rem; color: ${tokens.ink}; background: ${tokens.surface}; font: inherit; font-weight: 850; cursor: pointer; }
      .ac-condenser-buttons button[aria-pressed="true"] { color: ${tokens.surface}; border-color: ${tokens.ocean}; background: ${tokens.ocean}; }
      .ac-condenser-buttons button:focus-visible { outline: 3px solid ${tokens.warm}; outline-offset: 2px; }
      .ac-condenser-state { padding: 1rem; border: 1px solid ${tokens.line}; border-radius: .9rem; background: color-mix(in srgb, ${tokens.paper} 35%, ${tokens.surface}); }
      .ac-condenser-state strong { display: block; margin-bottom: .45rem; }
      .ac-condenser-state p { min-height: 4.6rem; margin: 0; color: ${tokens.muted}; line-height: 1.55; }
      .ac-condenser-caption { margin: 0; color: ${tokens.muted}; font-size: .76rem; line-height: 1.5; }
      .ac-condenser-demo.is-blocked .ac-condenser-blade { animation-duration: 4.5s; }
      .ac-condenser-demo.is-blocked .ac-condenser-heat { opacity: .35; animation-duration: 2.6s; }
      .ac-condenser-demo.is-blocked .ac-condenser-coil { box-shadow: 0 0 3.5rem color-mix(in srgb, ${tokens.coral} 48%, transparent); }
      .ac-condenser-demo.is-paused .ac-condenser-blade, .ac-condenser-demo.is-paused .ac-condenser-heat { animation-play-state: paused; }
      @keyframes ac-condenser-spin { to { transform: rotate(360deg); } }
      @keyframes ac-condenser-pulse { to { transform: translateX(5px); opacity: .55; } }
      @media (max-width: 700px) { .ac-condenser-demo { grid-template-columns: 1fr; } .ac-condenser-unit { min-height: 18rem; } }
    </style>
    <div class="ac-condenser-demo${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="ac-condenser-unit" aria-hidden="true">
        <p class="ac-condenser-unit-label">${escapeHtml(copy.outdoorUnitLabel)}</p>
        <div class="ac-condenser-coil"></div>
        <div class="ac-condenser-fan"><div class="ac-condenser-blade"></div><div class="ac-condenser-hub"></div></div>
        <span class="ac-condenser-heat ac-condenser-heat-left">↗</span><span class="ac-condenser-heat ac-condenser-heat-right">↗</span>
        <p class="ac-condenser-equation">${escapeHtml(copy.equation)}</p>
      </div>
      <div class="ac-condenser-panel">
        <p class="ac-condenser-control-label">${escapeHtml(copy.controlLabel)}</p>
        <div class="ac-condenser-buttons">
          <button type="button" data-ac-airflow="clear" aria-pressed="true">${escapeHtml(copy.clearButton)}</button>
          <button type="button" data-ac-airflow="blocked" aria-pressed="false">${escapeHtml(copy.blockedButton)}</button>
        </div>
        <div class="ac-condenser-state" aria-live="polite"><strong></strong><p></p></div>
        <p class="ac-condenser-caption">${escapeHtml(copy.caption)}</p>
      </div>
    </div>`;

  const scene = root.querySelector(".ac-condenser-demo");
  const title = root.querySelector(".ac-condenser-state strong");
  const message = root.querySelector(".ac-condenser-state p");
  const buttons = [...root.querySelectorAll("[data-ac-airflow]")];
  const select = (state) => {
    const blocked = state === "blocked";
    scene.classList.toggle("is-blocked", blocked);
    scene.dataset.airflow = state;
    title.textContent = blocked ? copy.blockedTitle : copy.clearTitle;
    message.textContent = blocked ? copy.blockedStatus : copy.clearStatus;
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.acAirflow === state)));
  };
  buttons.forEach((button) => button.addEventListener("click", () => select(button.dataset.acAirflow)));
  select("clear");

  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => select("clear"),
    destroy: () => { root.innerHTML = ""; }
  };
});
