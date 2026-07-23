registerDemo("contract-gate", ({ root, copy, tokens }) => {
  root.innerHTML = `
    <style>
      .contract-demo { display: grid; grid-template-rows: auto 1fr auto; gap: 1.25rem; min-height: 25rem; padding: clamp(1rem, 4vw, 2.5rem); color: ${tokens.ink}; background: ${tokens.surface}; }
      .mode-switch { display: flex; flex-wrap: wrap; justify-content: center; gap: .65rem; }
      .mode-switch button { padding: .55rem .9rem; border: 1px solid ${tokens.line}; border-radius: 999px; color: ${tokens.ink}; background: ${tokens.surface}; font: inherit; font-weight: 800; cursor: pointer; }
      .mode-switch button[aria-pressed="true"] { color: ${tokens.surface}; border-color: ${tokens.ocean}; background: ${tokens.ocean}; }
      .mode-switch button:focus-visible { outline: 3px solid ${tokens.warm}; outline-offset: 3px; }
      .contract-field { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); gap: 1rem; align-items: center; }
      .brief, .gate { min-height: 13rem; padding: 1.25rem; border: 1px solid ${tokens.line}; border-radius: 1.25rem; background: color-mix(in srgb, ${tokens.paper} 38%, ${tokens.surface}); }
      .brief-label, .gate-label { margin: 0 0 .8rem; color: ${tokens.muted}; font-size: .72rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
      .brief-text { margin: 0; font-size: 1.2rem; font-weight: 850; line-height: 1.45; }
      .arrow { color: ${tokens.ocean}; font-size: 2rem; }
      .checks { display: grid; gap: .65rem; margin: 0; padding: 0; list-style: none; }
      .checks li { display: grid; grid-template-columns: 1.25rem 1fr; gap: .55rem; align-items: start; color: ${tokens.muted}; }
      .checks li::before { display: grid; width: 1.15rem; height: 1.15rem; place-content: center; border: 1px solid ${tokens.line}; border-radius: 50%; content: "×"; font-size: .72rem; }
      .is-engineered .checks li { color: ${tokens.ink}; }
      .is-engineered .checks li::before { color: ${tokens.surface}; border-color: ${tokens.ocean}; background: ${tokens.ocean}; content: "✓"; }
      .contract-status { min-height: 1.8rem; margin: 0; color: ${tokens.muted}; font-weight: 800; text-align: center; }
      @media (max-width: 680px) { .contract-field { grid-template-columns: 1fr; } .arrow { rotate: 90deg; text-align: center; } .brief, .gate { min-height: auto; } }
    </style>
    <div class="contract-demo" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="mode-switch">
        <button type="button" data-mode="vague" aria-pressed="true">${escapeHtml(copy.vagueButton)}</button>
        <button type="button" data-mode="engineered" aria-pressed="false">${escapeHtml(copy.engineeredButton)}</button>
      </div>
      <div class="contract-field">
        <div class="brief"><p class="brief-label">${escapeHtml(copy.inputLabel)}</p><p class="brief-text"></p></div>
        <span class="arrow" aria-hidden="true">→</span>
        <div class="gate"><p class="gate-label">${escapeHtml(copy.gateLabel)}</p><ul class="checks"></ul></div>
      </div>
      <p class="contract-status" aria-live="polite"></p>
    </div>`;
  const scene = root.querySelector(".contract-demo");
  const brief = root.querySelector(".brief-text");
  const checks = root.querySelector(".checks");
  const status = root.querySelector(".contract-status");
  const buttons = [...root.querySelectorAll("[data-mode]")];
  const setMode = (mode) => {
    const engineered = mode === "engineered";
    scene.classList.toggle("is-engineered", engineered);
    scene.dataset.mode = mode;
    brief.textContent = engineered ? copy.engineeredBrief : copy.vagueBrief;
    checks.innerHTML = (engineered ? copy.engineeredChecks : copy.vagueChecks).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    status.textContent = engineered ? copy.engineeredStatus : copy.vagueStatus;
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.mode === mode)));
  };
  buttons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
  setMode("vague");
  return {
    pause: () => {},
    resume: () => {},
    reset: () => setMode("vague"),
    destroy: () => { root.innerHTML = ""; }
  };
});
