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
      .organization-status { margin: 0; color: ${tokens.muted}; font-weight: 800; text-align: center; }
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
        <p class="organization-status" aria-live="polite"></p>
      </div>
      <p class="caption">${escapeHtml(copy.caption)}</p>
    </div>`;
  const scene = root.querySelector(".organization-demo");
  const field = root.querySelector(".field");
  const status = root.querySelector(".organization-status");
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
