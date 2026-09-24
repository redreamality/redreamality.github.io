registerDemo("enso-sst", ({ root, copy, motion, tokens, announce }) => {
  const phaseButtons = copy.phases.map((phase, index) => `
    <button type="button" class="enso-sst-phase" data-enso-phase="${index}" aria-pressed="${index === 0}">${escapeHtml(phase.label)}</button>`).join("");

  root.innerHTML = `
    <style>
      .enso-sst { display:grid; gap:1rem; min-height:26rem; padding:clamp(1rem,4vw,2.25rem); color:${tokens.ink}; background:linear-gradient(150deg,color-mix(in srgb,${tokens.ocean} 10%,${tokens.surface}),${tokens.surface} 60%,color-mix(in srgb,${tokens.coral} 8%,${tokens.surface})); }
      .enso-sst-board { position:relative; min-height:14rem; overflow:hidden; border:1px solid ${tokens.line}; border-radius:1.25rem; background:
        linear-gradient(90deg,
          color-mix(in srgb,${tokens.warm} calc(var(--enso-west, 35) * 1%), ${tokens.ocean} calc((100 - var(--enso-west, 35)) * .45%)),
          color-mix(in srgb,${tokens.coral} calc(var(--enso-east, 65) * 1%), ${tokens.ocean} calc((100 - var(--enso-east, 65)) * .4%))); }
      .enso-sst-board::after { position:absolute; inset:18% 8%; border:1px dashed color-mix(in srgb,${tokens.surface} 55%,transparent); border-radius:999px; content:""; opacity:.55; }
      .enso-sst-label { position:absolute; z-index:2; margin:0; padding:.3rem .55rem; border-radius:999px; color:${tokens.surface}; background:color-mix(in srgb,${tokens.ink} 45%,transparent); font-size:.7rem; font-weight:850; }
      .enso-sst-basin { top:.8rem; left:50%; transform:translateX(-50%); }
      .enso-sst-west { left:.8rem; bottom:.8rem; }
      .enso-sst-east { right:.8rem; bottom:.8rem; }
      .enso-sst-hint { position:absolute; z-index:2; top:42%; max-width:9rem; padding:.45rem .6rem; border-radius:.7rem; background:color-mix(in srgb,${tokens.surface} 88%,transparent); font-size:.7rem; font-weight:800; line-height:1.35; }
      .enso-sst-hint-west { left:8%; }
      .enso-sst-hint-east { right:8%; text-align:right; }
      .enso-sst-pulse { position:absolute; top:50%; left:var(--enso-pulse, 68%); width:1.1rem; height:1.1rem; border-radius:50%; background:${tokens.surface}; box-shadow:0 0 0 .35rem color-mix(in srgb,${tokens.warm} 35%,transparent); transform:translate(-50%,-50%); animation:enso-sst-breathe 1.6s ease-in-out infinite; }
      .enso-sst-controls { display:flex; flex-wrap:wrap; gap:.55rem; }
      .enso-sst-phase { flex:1 1 7rem; padding:.75rem; border:1px solid ${tokens.line}; border-radius:.8rem; color:${tokens.ink}; background:${tokens.surface}; font:inherit; font-weight:800; cursor:pointer; }
      .enso-sst-phase[aria-pressed="true"] { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}; }
      .enso-sst-phase:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .enso-sst-readout { display:grid; grid-template-columns:auto 1fr; gap:.75rem; align-items:center; padding:.9rem 1rem; border:1px solid ${tokens.line}; border-radius:.9rem; background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); }
      .enso-sst-readout b { color:${tokens.ocean}; font-size:.78rem; letter-spacing:.06em; text-transform:uppercase; }
      .enso-sst-readout p { margin:0; color:${tokens.muted}; line-height:1.5; }
      .enso-sst-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
      .enso-sst.is-paused .enso-sst-pulse { animation-play-state:paused; }
      @keyframes enso-sst-breathe { 50% { transform:translate(-50%,-50%) scale(1.35); opacity:.7; } }
      @media (max-width:560px) { .enso-sst-hint { max-width:7.2rem; font-size:.64rem; } }
    </style>
    <div class="enso-sst${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="enso-sst-board" data-enso-board>
        <p class="enso-sst-label enso-sst-basin">${escapeHtml(copy.basinLabel)}</p>
        <p class="enso-sst-label enso-sst-west">${escapeHtml(copy.westLabel)}</p>
        <p class="enso-sst-label enso-sst-east">${escapeHtml(copy.eastLabel)}</p>
        <div class="enso-sst-hint enso-sst-hint-west" data-enso-west-hint></div>
        <div class="enso-sst-hint enso-sst-hint-east" data-enso-east-hint></div>
        <span class="enso-sst-pulse" aria-hidden="true"></span>
      </div>
      <div class="enso-sst-controls" role="group" aria-label="${escapeHtml(copy.controlLabel)}">${phaseButtons}</div>
      <div class="enso-sst-readout" aria-live="polite"><b>${escapeHtml(copy.anomalyLabel)}</b><p data-enso-status></p></div>
      <p class="enso-sst-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".enso-sst");
  const board = root.querySelector("[data-enso-board]");
  const westHint = root.querySelector("[data-enso-west-hint]");
  const eastHint = root.querySelector("[data-enso-east-hint]");
  const status = root.querySelector("[data-enso-status]");
  const buttons = [...root.querySelectorAll("[data-enso-phase]")];
  const profiles = {
    "el-nino": { west: 28, east: 88, pulse: "72%" },
    neutral: { west: 48, east: 48, pulse: "50%" },
    "la-nina": { west: 82, east: 22, pulse: "28%" }
  };
  const select = (index, speak = false) => {
    const phase = copy.phases[index];
    const profile = profiles[phase.key] || profiles.neutral;
    board.style.setProperty("--enso-west", String(profile.west));
    board.style.setProperty("--enso-east", String(profile.east));
    board.style.setProperty("--enso-pulse", profile.pulse);
    westHint.textContent = phase.warmHint;
    eastHint.textContent = phase.coolHint;
    if (phase.key === "la-nina") {
      westHint.textContent = phase.warmHint;
      eastHint.textContent = phase.coolHint;
    }
    status.textContent = phase.status;
    buttons.forEach((button, buttonIndex) => button.setAttribute("aria-pressed", String(buttonIndex === index)));
    if (speak) announce(phase.status);
  };
  buttons.forEach((button) => button.addEventListener("click", () => select(Number(button.dataset.ensoPhase), true)));
  select(0);
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => select(0),
    destroy: () => { root.innerHTML = ""; }
  };
});
