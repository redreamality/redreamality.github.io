(() => {
  "use strict";

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  registerDemo("overview", ({ root, copy, motion, tokens }) => {
    root.innerHTML = `
      <style>
        .overview-demo { position: relative; display: grid; place-items: center; min-height: 25rem; padding: 2rem; background: radial-gradient(circle, #e5f4f0, white 70%); }
        .loop { position: relative; width: min(82vw, 38rem); aspect-ratio: 16 / 9; }
        .ring { position: absolute; inset: 8% 14%; border: 3px dashed ${tokens.ocean}; border-radius: 50%; animation: spin 14s linear infinite; }
        .node { position: absolute; display: grid; place-items: center; width: 9.5rem; min-height: 5rem; padding: 1rem; border: 1px solid #d8ddd7; border-radius: 1.25rem; color: ${tokens.ink}; background: rgba(255,255,255,.94); box-shadow: 0 .8rem 2rem rgba(23,51,60,.1); font-weight: 850; text-align: center; }
        .node-energy { left: 0; bottom: 0; border-color: ${tokens.warm}; }
        .node-moisture { top: 0; left: 50%; transform: translateX(-50%); border-color: ${tokens.ocean}; }
        .node-storm { right: 0; bottom: 0; border-color: ${tokens.coral}; }
        .caption { position: absolute; right: 1rem; bottom: 1rem; left: 1rem; margin: 0; color: ${tokens.muted}; font-size: .8rem; text-align: center; }
        .is-paused .ring { animation-play-state: paused; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 560px) { .loop { min-height: 22rem; } .node { width: 7.5rem; font-size: .8rem; } }
      </style>
      <div class="overview-demo${motion ? "" : " is-paused"}" role="img" aria-label="${escapeHtml(copy.ariaLabel)}">
        <div class="loop">
          <div class="ring" aria-hidden="true"></div>
          <div class="node node-energy">${escapeHtml(copy.energy)}</div>
          <div class="node node-moisture">${escapeHtml(copy.moisture)}</div>
          <div class="node node-storm">${escapeHtml(copy.storm)}</div>
        </div>
        <p class="caption">${escapeHtml(copy.caption)}</p>
      </div>`;
    const scene = root.querySelector(".overview-demo");
    return {
      pause: () => scene.classList.add("is-paused"),
      resume: () => scene.classList.remove("is-paused"),
      reset: () => { scene.dataset.resetCount = String(Number(scene.dataset.resetCount || 0) + 1); },
      destroy: () => { root.innerHTML = ""; }
    };
  });

  registerDemo("energy", ({ root, copy, motion, tokens }) => {
    root.innerHTML = `
      <style>
        .energy-demo { display: grid; grid-template-columns: minmax(0, 1fr) minmax(14rem, 22rem); gap: 2rem; align-items: center; min-height: 25rem; padding: clamp(1.25rem, 5vw, 3rem); background: linear-gradient(160deg, #e8f5f2, white); }
        .ocean { position: relative; min-height: 16rem; overflow: hidden; border-radius: 1.5rem; background: linear-gradient(#cfeff0 0 42%, ${tokens.ocean} 43% 100%); }
        .sun { position: absolute; top: 1.5rem; left: 50%; width: 5rem; height: 5rem; border-radius: 50%; background: ${tokens.warm}; box-shadow: 0 0 0 1rem rgba(238,157,70,.14); animation: breathe 2.4s ease-in-out infinite alternate; }
        .meter { height: 1rem; overflow: hidden; border-radius: 99px; background: #d8ddd7; }
        .meter > span { display: block; width: 40%; height: 100%; background: linear-gradient(90deg, ${tokens.ocean}, ${tokens.warm}); transition: width .2s ease; }
        .control { display: grid; gap: .8rem; }
        .control label { font-weight: 850; }
        .range-labels { display: flex; justify-content: space-between; color: ${tokens.muted}; font-size: .78rem; }
        output { color: ${tokens.coral}; font-size: 1.7rem; font-weight: 900; }
        .caption { color: ${tokens.muted}; line-height: 1.6; }
        .is-paused .sun { animation-play-state: paused; }
        @keyframes breathe { to { transform: scale(1.1); box-shadow: 0 0 0 1.8rem rgba(238,157,70,.08); } }
        @media (max-width: 680px) { .energy-demo { grid-template-columns: 1fr; } .ocean { min-height: 13rem; } }
      </style>
      <div class="energy-demo${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
        <div class="ocean" aria-hidden="true"><div class="sun"></div></div>
        <div class="control">
          <label for="energy-range">${escapeHtml(copy.controlLabel)}</label>
          <input id="energy-range" type="range" min="0" max="100" value="40" aria-label="${escapeHtml(copy.ariaLabel)}">
          <div class="range-labels"><span>${escapeHtml(copy.lowLabel)}</span><span>${escapeHtml(copy.highLabel)}</span></div>
          <div class="meter" aria-hidden="true"><span></span></div>
          <output data-energy-value>40 ${escapeHtml(copy.unit)}</output>
          <p class="caption">${escapeHtml(copy.caption)}</p>
        </div>
      </div>`;
    const scene = root.querySelector(".energy-demo");
    const range = root.querySelector("#energy-range");
    const fill = root.querySelector(".meter > span");
    const output = root.querySelector("[data-energy-value]");
    const update = () => {
      fill.style.width = `${range.value}%`;
      output.textContent = `${range.value} ${copy.unit}`;
      scene.dataset.value = range.value;
    };
    range.addEventListener("input", update);
    update();
    return {
      pause: () => scene.classList.add("is-paused"),
      resume: () => scene.classList.remove("is-paused"),
      reset: () => { range.value = "40"; update(); },
      destroy: () => { root.innerHTML = ""; }
    };
  });

  registerDemo("organization", ({ root, copy, motion, tokens }) => {
    root.innerHTML = `
      <style>
        .organization-demo { display: grid; grid-template-rows: auto minmax(0, 1fr) auto; gap: 1rem; min-height: 25rem; padding: clamp(1.25rem, 4vw, 2.5rem); background: #f9fbfa; }
        .switcher { display: flex; justify-content: center; gap: .6rem; }
        .switcher button { padding: .55rem .9rem; border: 1px solid #d8ddd7; border-radius: 999px; color: ${tokens.ink}; background: white; font: inherit; font-weight: 800; cursor: pointer; }
        .switcher button[aria-pressed="true"] { color: white; border-color: ${tokens.ocean}; background: ${tokens.ocean}; }
        .field { position: relative; min-height: 17rem; overflow: hidden; border-radius: 1.5rem; background: radial-gradient(circle, #dff2ee, white 66%); }
        .cell { position: absolute; width: 2.6rem; height: 2.6rem; border-radius: 50%; background: ${tokens.coral}; box-shadow: 0 0 0 .6rem rgba(212,95,80,.12); animation: float 2.2s ease-in-out infinite alternate; transition: inset .6s ease, transform .6s ease; }
        .cell:nth-child(1) { top: 18%; left: 16%; }
        .cell:nth-child(2) { top: 56%; left: 27%; animation-delay: -.6s; }
        .cell:nth-child(3) { top: 26%; right: 18%; animation-delay: -1.2s; }
        .cell:nth-child(4) { right: 30%; bottom: 16%; animation-delay: -1.7s; }
        .organized .cell:nth-child(1) { top: 23%; left: 48%; transform: translate(-50%, -50%); }
        .organized .cell:nth-child(2) { top: 50%; left: 67%; transform: translate(-50%, -50%); }
        .organized .cell:nth-child(3) { top: 70%; right: 48%; transform: translate(50%, -50%); }
        .organized .cell:nth-child(4) { right: 67%; bottom: 50%; transform: translate(50%, 50%); }
        .center { position: absolute; inset: 50% auto auto 50%; width: 4rem; height: 4rem; border: 2px dashed ${tokens.ocean}; border-radius: 50%; opacity: 0; transform: translate(-50%, -50%); transition: opacity .4s ease; animation: spin 5s linear infinite; }
        .organized .center { opacity: 1; }
        .status { margin: 0; color: ${tokens.muted}; font-weight: 800; text-align: center; }
        .caption { margin: 0; color: ${tokens.muted}; font-size: .8rem; text-align: center; }
        .is-paused .cell, .is-paused .center { animation-play-state: paused; }
        @keyframes float { to { translate: 0 -1rem; } }
        @keyframes spin { to { transform: translate(-50%, -50%) rotate(360deg); } }
      </style>
      <div class="organization-demo${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
        <div class="switcher">
          <button type="button" data-mode="scattered" aria-pressed="true">${escapeHtml(copy.scatteredButton)}</button>
          <button type="button" data-mode="organized" aria-pressed="false">${escapeHtml(copy.organizedButton)}</button>
        </div>
        <div>
          <div class="field" aria-hidden="true">
            <span class="cell"></span><span class="cell"></span><span class="cell"></span><span class="cell"></span>
            <span class="center"></span>
          </div>
          <p class="status" aria-live="polite"></p>
        </div>
        <p class="caption">${escapeHtml(copy.caption)}</p>
      </div>`;
    const scene = root.querySelector(".organization-demo");
    const field = root.querySelector(".field");
    const status = root.querySelector(".status");
    const buttons = [...root.querySelectorAll("[data-mode]")];
    const setMode = (mode) => {
      const organized = mode === "organized";
      field.classList.toggle("organized", organized);
      scene.dataset.mode = mode;
      status.textContent = organized ? copy.organizedStatus : copy.scatteredStatus;
      buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.mode === mode)));
    };
    buttons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
    setMode("scattered");
    return {
      pause: () => scene.classList.add("is-paused"),
      resume: () => scene.classList.remove("is-paused"),
      reset: () => setMode("scattered"),
      destroy: () => { root.innerHTML = ""; }
    };
  });
})();
