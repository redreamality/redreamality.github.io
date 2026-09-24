registerDemo("enso-not-typhoon", ({ root, copy, motion, tokens, announce }) => {
  const modeButtons = copy.modes.map((mode, index) => `
    <button type="button" class="enso-nt-mode" data-enso-nt-mode="${index}" aria-pressed="${index === 1}">${escapeHtml(mode.label)}</button>`).join("");

  root.innerHTML = `
    <style>
      .enso-nt { display:grid; gap:1rem; min-height:26rem; padding:clamp(1rem,4vw,2.25rem); color:${tokens.ink}; background:linear-gradient(145deg,color-mix(in srgb,${tokens.ocean} 10%,${tokens.surface}),${tokens.surface} 55%,color-mix(in srgb,${tokens.warm} 11%,${tokens.surface})); }
      .enso-nt-controls { display:flex; flex-wrap:wrap; gap:.55rem; }
      .enso-nt-mode { flex:1 1 10rem; padding:.8rem; border:1px solid ${tokens.line}; border-radius:.85rem; color:${tokens.ink}; background:${tokens.surface}; font:inherit; font-weight:850; cursor:pointer; }
      .enso-nt-mode[aria-pressed="true"] { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}; }
      .enso-nt-mode:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .enso-nt-board { display:grid; gap:.85rem; padding:1rem; border:1px solid ${tokens.line}; border-radius:1.15rem; background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); }
      .enso-nt-board h3 { margin:0; font-size:1rem; }
      .enso-nt-steps { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:.55rem; }
      .enso-nt-step { position:relative; min-height:5.5rem; padding:.75rem; border:1px solid ${tokens.line}; border-radius:.8rem; background:${tokens.surface}; font-size:.78rem; font-weight:800; line-height:1.35; }
      .enso-nt-step::after { position:absolute; top:50%; right:-.5rem; width:.55rem; height:.55rem; border-top:2px solid ${tokens.ocean}; border-right:2px solid ${tokens.ocean}; content:""; transform:translateY(-50%) rotate(45deg); opacity:.5; }
      .enso-nt-step:last-child::after { display:none; }
      .enso-nt-step.is-typhoon { border-color:${tokens.warm}; }
      .enso-nt-step.is-enso { border-color:${tokens.ocean}; }
      .enso-nt-pulse { width:.7rem; height:.7rem; margin-top:.55rem; border-radius:50%; background:${tokens.ocean}; animation:enso-nt-pulse 1.4s ease-in-out infinite; }
      .enso-nt-board[data-mode="typhoon"] .enso-nt-pulse { background:${tokens.warm}; }
      .enso-nt-status { min-height:4.2rem; margin:0; padding:1rem; border-left:.28rem solid ${tokens.ocean}; border-radius:.75rem; background:color-mix(in srgb,${tokens.paper} 42%,${tokens.surface}); color:${tokens.muted}; line-height:1.55; }
      .enso-nt-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
      .enso-nt.is-paused .enso-nt-pulse { animation-play-state:paused; }
      @keyframes enso-nt-pulse { 50% { transform:scale(1.7); opacity:.4; } }
      @media (max-width:720px) { .enso-nt-steps { grid-template-columns:repeat(2,minmax(0,1fr)); } .enso-nt-step::after { display:none; } }
    </style>
    <div class="enso-nt${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="enso-nt-controls" role="group" aria-label="${escapeHtml(copy.controlLabel)}">${modeButtons}</div>
      <div class="enso-nt-board" data-enso-nt-board>
        <h3 data-enso-nt-title></h3>
        <div class="enso-nt-steps" data-enso-nt-steps></div>
      </div>
      <p class="enso-nt-status" data-enso-nt-status aria-live="polite"></p>
      <p class="enso-nt-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".enso-nt");
  const board = root.querySelector("[data-enso-nt-board]");
  const title = root.querySelector("[data-enso-nt-title]");
  const steps = root.querySelector("[data-enso-nt-steps]");
  const status = root.querySelector("[data-enso-nt-status]");
  const buttons = [...root.querySelectorAll("[data-enso-nt-mode]")];
  const select = (index, speak = false) => {
    const mode = copy.modes[index];
    board.dataset.mode = mode.key;
    title.textContent = mode.title;
    steps.innerHTML = mode.steps.map((step) => `
      <div class="enso-nt-step is-${escapeHtml(mode.key)}">${escapeHtml(step)}<div class="enso-nt-pulse" aria-hidden="true"></div></div>`).join("");
    status.textContent = mode.status;
    buttons.forEach((button, buttonIndex) => button.setAttribute("aria-pressed", String(buttonIndex === index)));
    if (speak) announce(mode.status);
  };
  buttons.forEach((button) => button.addEventListener("click", () => select(Number(button.dataset.ensoNtMode), true)));
  select(1);
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => select(1),
    destroy: () => { root.innerHTML = ""; }
  };
});
