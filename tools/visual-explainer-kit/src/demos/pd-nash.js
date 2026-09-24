registerDemo("pd-nash", ({ root, copy, motion, tokens, announce }) => {
  const stageButtons = copy.stages.map((stage, index) => `
    <button type="button" class="pd-nash-stage" data-pd-nash-stage="${index}" aria-pressed="${index === 0}">${escapeHtml(stage.label)}</button>`).join("");

  root.innerHTML = `
    <style>
      .pd-nash { display:grid; gap:1rem; min-height:26rem; padding:clamp(1rem,4vw,2.25rem); color:${tokens.ink}; background:linear-gradient(145deg,color-mix(in srgb,${tokens.ocean} 9%,${tokens.surface}),${tokens.surface} 55%,color-mix(in srgb,${tokens.coral} 10%,${tokens.surface})); }
      .pd-nash-players { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
      .pd-nash-card { display:grid; gap:.45rem; min-height:8rem; padding:1rem; border:1px solid ${tokens.line}; border-radius:1rem; background:${tokens.surface}; text-align:center; }
      .pd-nash-card.is-defect { border-color:${tokens.coral}; box-shadow:inset 0 0 0 1px ${tokens.coral}; }
      .pd-nash-card.is-coop { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}; }
      .pd-nash-card strong { font-size:.8rem; color:${tokens.muted}; letter-spacing:.05em; text-transform:uppercase; }
      .pd-nash-move { font-size:1.8rem; font-weight:900; }
      .pd-nash-years { color:${tokens.coral}; font-size:1.05rem; font-weight:850; }
      .pd-nash-arrow { height:.4rem; border-radius:999px; background:linear-gradient(90deg,${tokens.ocean},${tokens.coral}); transform-origin:left center; animation:pd-nash-flow 1.8s ease-in-out infinite; }
      .pd-nash.is-paused .pd-nash-arrow { animation-play-state:paused; }
      @keyframes pd-nash-flow { 50% { opacity:.45; transform:scaleX(.92); } }
      .pd-nash-controls { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:.5rem; }
      .pd-nash-stage { padding:.7rem .4rem; border:1px solid ${tokens.line}; border-radius:.75rem; color:${tokens.ink}; background:${tokens.surface}; font:inherit; font-size:.72rem; font-weight:800; cursor:pointer; }
      .pd-nash-stage[aria-pressed="true"] { border-color:${tokens.coral}; box-shadow:inset 0 0 0 1px ${tokens.coral}; }
      .pd-nash-stage:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .pd-nash-status { min-height:4.4rem; margin:0; padding:1rem; border-left:.28rem solid ${tokens.coral}; border-radius:.75rem; background:color-mix(in srgb,${tokens.paper} 42%,${tokens.surface}); color:${tokens.muted}; line-height:1.55; }
      .pd-nash-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
      @media (max-width:560px) { .pd-nash-controls { grid-template-columns:1fr 1fr; } }
    </style>
    <div class="pd-nash${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="pd-nash-players">
        <article class="pd-nash-card" data-pd-nash-you>
          <strong>${escapeHtml(copy.youLabel)}</strong>
          <div class="pd-nash-move" data-pd-nash-you-move></div>
          <div class="pd-nash-years" data-pd-nash-you-years></div>
        </article>
        <article class="pd-nash-card" data-pd-nash-other>
          <strong>${escapeHtml(copy.otherLabel)}</strong>
          <div class="pd-nash-move" data-pd-nash-other-move></div>
          <div class="pd-nash-years" data-pd-nash-other-years></div>
        </article>
      </div>
      <div class="pd-nash-arrow" aria-hidden="true"></div>
      <div class="pd-nash-controls" role="group" aria-label="${escapeHtml(copy.controlLabel)}">${stageButtons}</div>
      <p class="pd-nash-status" data-pd-nash-status aria-live="polite"></p>
      <p class="pd-nash-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".pd-nash");
  const status = root.querySelector("[data-pd-nash-status]");
  const youCard = root.querySelector("[data-pd-nash-you]");
  const otherCard = root.querySelector("[data-pd-nash-other]");
  const youMove = root.querySelector("[data-pd-nash-you-move]");
  const otherMove = root.querySelector("[data-pd-nash-other-move]");
  const youYears = root.querySelector("[data-pd-nash-you-years]");
  const otherYears = root.querySelector("[data-pd-nash-other-years]");
  const buttons = [...root.querySelectorAll("[data-pd-nash-stage]")];

  const labelMove = (move) => (move === "C" || move === "合" || move === "協" ? copy.coopLabel : copy.defectLabel);

  const select = (index, speak = false) => {
    const stage = copy.stages[index];
    buttons.forEach((button, buttonIndex) => button.setAttribute("aria-pressed", String(buttonIndex === index)));
    youMove.textContent = labelMove(stage.youMove);
    otherMove.textContent = labelMove(stage.otherMove);
    youYears.textContent = `${stage.youYears} ${copy.yearsUnit}`;
    otherYears.textContent = `${stage.otherYears} ${copy.yearsUnit}`;
    const youDefect = String(stage.youMove).toUpperCase().startsWith("D") || stage.youMove === "背" || stage.youMove === "裏";
    const otherDefect = String(stage.otherMove).toUpperCase().startsWith("D") || stage.otherMove === "背" || stage.otherMove === "裏";
    youCard.classList.toggle("is-defect", youDefect);
    youCard.classList.toggle("is-coop", !youDefect);
    otherCard.classList.toggle("is-defect", otherDefect);
    otherCard.classList.toggle("is-coop", !otherDefect);
    status.textContent = stage.detail;
    if (speak) announce(stage.detail);
  };

  buttons.forEach((button) => button.addEventListener("click", () => select(Number(button.dataset.pdNashStage), true)));
  select(0);
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => select(0),
    destroy: () => { root.innerHTML = ""; }
  };
});
