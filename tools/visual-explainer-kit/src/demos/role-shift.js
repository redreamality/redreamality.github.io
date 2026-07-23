registerDemo("role-shift", ({ root, copy, tokens }) => {
  const manualSteps = copy.manualSteps.map((step, index) => `
    <li><span>${String(index + 1).padStart(2, "0")}</span>${escapeHtml(step)}</li>`).join("");
  const systemNodes = copy.systemNodes.map((node) => `
    <li><strong>${escapeHtml(node.label)}</strong><span>${escapeHtml(node.detail)}</span></li>`).join("");
  const boundaries = copy.boundaries.map((boundary) => `<li>${escapeHtml(boundary)}</li>`).join("");

  root.innerHTML = `
    <style>
      .role-shift-demo { display: grid; gap: 1.2rem; min-height: 25rem; padding: clamp(1rem, 4vw, 2.5rem); color: ${tokens.ink}; background: radial-gradient(circle at 86% 14%, color-mix(in srgb, ${tokens.warm} 14%, transparent), transparent 18rem), ${tokens.surface}; }
      .role-shift-switch { display: grid; gap: .55rem; justify-items: center; }
      .role-shift-label { margin: 0; color: ${tokens.muted}; font-size: .72rem; font-weight: 850; letter-spacing: .09em; text-transform: uppercase; }
      .role-shift-buttons { display: flex; flex-wrap: wrap; justify-content: center; gap: .6rem; }
      .role-shift-buttons button { padding: .58rem .9rem; border: 1px solid ${tokens.line}; border-radius: 999px; color: ${tokens.ink}; background: ${tokens.surface}; font: inherit; font-weight: 850; cursor: pointer; }
      .role-shift-buttons button[aria-pressed="true"] { color: ${tokens.surface}; border-color: ${tokens.ocean}; background: ${tokens.ocean}; }
      .role-shift-buttons button:focus-visible { outline: 3px solid ${tokens.warm}; outline-offset: 3px; }
      .role-shift-scene { display: grid; grid-template-columns: minmax(11rem, .4fr) minmax(0, 1.6fr); gap: 1rem; align-items: stretch; }
      .role-shift-human, .role-shift-work { min-height: 17rem; padding: 1.2rem; border: 1px solid ${tokens.line}; border-radius: 1.2rem; background: color-mix(in srgb, ${tokens.paper} 34%, ${tokens.surface}); }
      .role-shift-human { display: grid; place-content: center; text-align: center; }
      .role-shift-avatar { display: grid; width: 4rem; aspect-ratio: 1; margin: 0 auto .9rem; place-content: center; border-radius: 50%; color: ${tokens.surface}; background: ${tokens.coral}; font-size: 1.5rem; font-weight: 900; }
      .role-shift-human strong { font-size: 1.05rem; }
      .role-shift-human p { margin: .55rem 0 0; color: ${tokens.muted}; font-size: .82rem; line-height: 1.5; }
      .role-shift-manual { display: grid; gap: .65rem; margin: 0; padding: 0; list-style: none; }
      .role-shift-manual li { display: grid; grid-template-columns: 2rem 1fr; gap: .6rem; align-items: center; padding: .72rem; border: 1px solid ${tokens.line}; border-radius: .85rem; background: ${tokens.surface}; }
      .role-shift-manual li span { color: ${tokens.coral}; font-size: .68rem; font-weight: 900; }
      .role-shift-cost { margin: .8rem 0 0; padding-top: .8rem; border-top: 1px solid ${tokens.line}; color: ${tokens.muted}; font-size: .82rem; line-height: 1.5; }
      .role-shift-boundaries { display: flex; flex-wrap: wrap; gap: .45rem; margin: 0 0 .8rem; padding: 0; list-style: none; }
      .role-shift-boundaries li { padding: .35rem .58rem; border: 1px solid color-mix(in srgb, ${tokens.ocean} 45%, ${tokens.line}); border-radius: 999px; color: ${tokens.ocean}; font-size: .7rem; font-weight: 850; }
      .role-shift-system { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .6rem; margin: 0; padding: 0; list-style: none; }
      .role-shift-system li { min-height: 6.5rem; padding: .8rem; border: 1px solid ${tokens.line}; border-radius: .9rem; background: ${tokens.surface}; }
      .role-shift-system strong, .role-shift-system span { display: block; }
      .role-shift-system strong { margin-bottom: .35rem; }
      .role-shift-system span { color: ${tokens.muted}; font-size: .76rem; line-height: 1.45; }
      .role-shift-system-note { margin: .8rem 0 0; color: ${tokens.muted}; font-size: .82rem; line-height: 1.5; }
      .role-shift-status { min-height: 1.8rem; margin: 0; color: ${tokens.muted}; font-weight: 850; text-align: center; }
      .role-shift-demo[data-mode="manual"] .role-shift-system-view, .role-shift-demo[data-mode="system"] .role-shift-manual-view { display: none; }
      @media (max-width: 720px) { .role-shift-scene { grid-template-columns: 1fr; } .role-shift-human { min-height: auto; } .role-shift-system { grid-template-columns: 1fr 1fr; } }
      @media (max-width: 480px) { .role-shift-system { grid-template-columns: 1fr; } }
    </style>
    <div class="role-shift-demo" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="role-shift-switch">
        <p class="role-shift-label">${escapeHtml(copy.modeLabel)}</p>
        <div class="role-shift-buttons">
          <button type="button" data-mode="manual" aria-pressed="true">${escapeHtml(copy.manualButton)}</button>
          <button type="button" data-mode="system" aria-pressed="false">${escapeHtml(copy.systemButton)}</button>
        </div>
      </div>
      <div class="role-shift-scene">
        <div class="role-shift-human">
          <span class="role-shift-avatar" aria-hidden="true">H</span>
          <strong data-human-title></strong>
          <p data-human-detail></p>
        </div>
        <div class="role-shift-work">
          <div class="role-shift-manual-view">
            <ol class="role-shift-manual">${manualSteps}</ol>
            <p class="role-shift-cost"><strong>${escapeHtml(copy.manualCostLabel)}:</strong> ${escapeHtml(copy.manualCost)}</p>
          </div>
          <div class="role-shift-system-view">
            <p class="role-shift-label">${escapeHtml(copy.boundaryLabel)}</p>
            <ul class="role-shift-boundaries">${boundaries}</ul>
            <ol class="role-shift-system">${systemNodes}</ol>
            <p class="role-shift-system-note">${escapeHtml(copy.systemNote)}</p>
          </div>
        </div>
      </div>
      <p class="role-shift-status" aria-live="polite"></p>
    </div>`;

  const scene = root.querySelector(".role-shift-demo");
  const humanTitle = root.querySelector("[data-human-title]");
  const humanDetail = root.querySelector("[data-human-detail]");
  const status = root.querySelector(".role-shift-status");
  const buttons = [...root.querySelectorAll("[data-mode]")];
  const setMode = (mode) => {
    const system = mode === "system";
    scene.dataset.mode = mode;
    humanTitle.textContent = system ? copy.systemHuman : copy.manualHuman;
    humanDetail.textContent = system ? copy.systemHumanDetail : copy.manualHumanDetail;
    status.textContent = system ? copy.systemStatus : copy.manualStatus;
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.mode === mode)));
  };
  buttons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
  setMode("manual");

  return {
    pause: () => {},
    resume: () => {},
    reset: () => setMode("manual"),
    destroy: () => { root.innerHTML = ""; }
  };
});
