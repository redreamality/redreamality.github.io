registerDemo("pd-repeat", ({ root, copy, motion, tokens, announce }) => {
  const modeButtons = copy.modes.map((mode, index) => `
    <button type="button" class="pd-rp-mode" data-pd-rp-mode="${index}" aria-pressed="${index === 0}">${escapeHtml(mode.label)}</button>`).join("");

  root.innerHTML = `
    <style>
      .pd-rp { display:grid; gap:1rem; min-height:26rem; padding:clamp(1rem,4vw,2.25rem); color:${tokens.ink}; background:linear-gradient(145deg,color-mix(in srgb,${tokens.ocean} 10%,${tokens.surface}),${tokens.surface} 55%,color-mix(in srgb,${tokens.warm} 9%,${tokens.surface})); }
      .pd-rp-controls { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.5rem; }
      .pd-rp-mode { padding:.8rem .45rem; border:1px solid ${tokens.line}; border-radius:.8rem; color:${tokens.ink}; background:${tokens.surface}; font:inherit; font-size:.78rem; font-weight:850; cursor:pointer; }
      .pd-rp-mode[aria-pressed="true"] { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}; }
      .pd-rp-mode:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .pd-rp-board { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
      .pd-rp-card { display:grid; gap:.4rem; min-height:7.5rem; padding:1rem; border:1px solid ${tokens.line}; border-radius:1rem; background:${tokens.surface}; text-align:center; }
      .pd-rp-card.is-coop { border-color:${tokens.ocean}; }
      .pd-rp-card.is-defect { border-color:${tokens.coral}; }
      .pd-rp-card strong { font-size:.72rem; color:${tokens.muted}; letter-spacing:.05em; text-transform:uppercase; }
      .pd-rp-card b { font-size:1.5rem; }
      .pd-rp-best { padding:1rem; border:1px solid ${tokens.line}; border-radius:.95rem; background:color-mix(in srgb,${tokens.paper} 42%,${tokens.surface}); text-align:center; }
      .pd-rp-best small { display:block; margin-bottom:.35rem; color:${tokens.muted}; font-size:.68rem; }
      .pd-rp-best output { font-size:1.25rem; font-weight:900; color:${tokens.ocean}; }
      .pd-rp-best.is-defect output { color:${tokens.coral}; }
      .pd-rp-timeline { display:flex; gap:.35rem; align-items:center; justify-content:center; min-height:2rem; }
      .pd-rp-dot { width:.85rem; height:.85rem; border-radius:50%; background:${tokens.line}; }
      .pd-rp-dot.is-on { background:${tokens.ocean}; box-shadow:0 0 0 .25rem color-mix(in srgb,${tokens.ocean} 25%,transparent); animation:pd-rp-pulse 1.4s ease-in-out infinite; }
      .pd-rp-dot.is-bad { background:${tokens.coral}; }
      .pd-rp.is-paused .pd-rp-dot.is-on { animation-play-state:paused; }
      @keyframes pd-rp-pulse { 50% { transform:scale(1.25); opacity:.7; } }
      .pd-rp-status { min-height:4.4rem; margin:0; padding:1rem; border-left:.28rem solid ${tokens.ocean}; border-radius:.75rem; background:color-mix(in srgb,${tokens.paper} 42%,${tokens.surface}); color:${tokens.muted}; line-height:1.55; }
      .pd-rp-note { margin:0; color:${tokens.muted}; font-size:.78rem; text-align:center; }
      .pd-rp-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
      @media (max-width:560px) { .pd-rp-controls { grid-template-columns:1fr; } }
    </style>
    <div class="pd-rp${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="pd-rp-controls" role="group" aria-label="${escapeHtml(copy.controlLabel)}">${modeButtons}</div>
      <div class="pd-rp-board">
        <article class="pd-rp-card" data-pd-rp-you><strong>${escapeHtml(copy.youLabel)}</strong><b data-pd-rp-you-move></b></article>
        <article class="pd-rp-card" data-pd-rp-other><strong>${escapeHtml(copy.otherLabel)}</strong><b data-pd-rp-other-move></b></article>
      </div>
      <div class="pd-rp-timeline" aria-hidden="true" data-pd-rp-timeline></div>
      <div class="pd-rp-best" data-pd-rp-best><small>${escapeHtml(copy.bestMoveLabel)}</small><output data-pd-rp-best-move></output></div>
      <p class="pd-rp-status" data-pd-rp-status aria-live="polite"></p>
      <p class="pd-rp-note" data-pd-rp-note></p>
      <p class="pd-rp-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".pd-rp");
  const status = root.querySelector("[data-pd-rp-status]");
  const note = root.querySelector("[data-pd-rp-note]");
  const bestWrap = root.querySelector("[data-pd-rp-best]");
  const bestMove = root.querySelector("[data-pd-rp-best-move]");
  const youCard = root.querySelector("[data-pd-rp-you]");
  const otherCard = root.querySelector("[data-pd-rp-other]");
  const youMove = root.querySelector("[data-pd-rp-you-move]");
  const otherMove = root.querySelector("[data-pd-rp-other-move]");
  const timeline = root.querySelector("[data-pd-rp-timeline]");
  const buttons = [...root.querySelectorAll("[data-pd-rp-mode]")];

  const isDefect = (move) => {
    const value = String(move);
    return value === "D" || value.includes("背") || value.includes("裏") || /defect/i.test(value);
  };
  const labelMove = (move) => (isDefect(move) ? copy.defectLabel : copy.coopLabel);

  const select = (index, speak = false) => {
    const mode = copy.modes[index];
    buttons.forEach((button, buttonIndex) => button.setAttribute("aria-pressed", String(buttonIndex === index)));
    youMove.textContent = labelMove(mode.youMove);
    otherMove.textContent = labelMove(mode.otherMove);
    const youBad = isDefect(mode.youMove);
    const otherBad = isDefect(mode.otherMove);
    youCard.classList.toggle("is-defect", youBad);
    youCard.classList.toggle("is-coop", !youBad);
    otherCard.classList.toggle("is-defect", otherBad);
    otherCard.classList.toggle("is-coop", !otherBad);
    bestMove.textContent = mode.bestMove;
    bestWrap.classList.toggle("is-defect", isDefect(mode.bestMove) || /背|裏|Defect/i.test(mode.bestMove));
    status.textContent = mode.status;
    note.textContent = mode.note;
    const dots = mode.key === "oneshot"
      ? '<span class="pd-rp-dot is-on is-bad"></span>'
      : '<span class="pd-rp-dot is-on"></span><span class="pd-rp-dot is-on"></span><span class="pd-rp-dot is-on"></span><span class="pd-rp-dot is-on"></span>';
    timeline.innerHTML = dots;
    if (speak) announce(mode.status);
  };

  buttons.forEach((button) => button.addEventListener("click", () => select(Number(button.dataset.pdRpMode), true)));
  select(0);
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => select(0),
    destroy: () => { root.innerHTML = ""; }
  };
});
