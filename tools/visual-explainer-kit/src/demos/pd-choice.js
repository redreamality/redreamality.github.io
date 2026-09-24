registerDemo("pd-choice", ({ root, copy, motion, tokens, announce }) => {
  const payoffs = {
    C: { C: [1, 1], D: [3, 0] },
    D: { C: [0, 3], D: [2, 2] }
  };

  root.innerHTML = `
    <style>
      .pd-ch { display:grid; gap:1rem; min-height:26rem; padding:clamp(1rem,4vw,2.25rem); color:${tokens.ink}; background:linear-gradient(150deg,color-mix(in srgb,${tokens.coral} 8%,${tokens.surface}),${tokens.surface} 58%,color-mix(in srgb,${tokens.ocean} 10%,${tokens.surface})); }
      .pd-ch-block { display:grid; gap:.55rem; }
      .pd-ch-block h3 { margin:0; color:${tokens.muted}; font-size:.72rem; letter-spacing:.06em; text-transform:uppercase; }
      .pd-ch-row { display:grid; grid-template-columns:1fr 1fr; gap:.55rem; }
      .pd-ch-btn { padding:.85rem; border:1px solid ${tokens.line}; border-radius:.85rem; color:${tokens.ink}; background:${tokens.surface}; font:inherit; font-weight:850; cursor:pointer; }
      .pd-ch-btn[aria-pressed="true"] { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}; }
      .pd-ch-btn.is-best[aria-pressed="true"] { border-color:${tokens.coral}; box-shadow:inset 0 0 0 1px ${tokens.coral}; }
      .pd-ch-btn:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .pd-ch-metrics { display:grid; grid-template-columns:1fr 1fr; gap:.65rem; }
      .pd-ch-metric { padding:.9rem; border:1px solid ${tokens.line}; border-radius:.85rem; background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); text-align:center; }
      .pd-ch-metric small { display:block; margin-bottom:.3rem; color:${tokens.muted}; font-size:.68rem; }
      .pd-ch-metric output { font-size:1.35rem; font-weight:900; color:${tokens.coral}; }
      .pd-ch-status { min-height:4.5rem; margin:0; padding:1rem; border-left:.28rem solid ${tokens.coral}; border-radius:.75rem; background:color-mix(in srgb,${tokens.paper} 42%,${tokens.surface}); color:${tokens.muted}; line-height:1.55; }
      .pd-ch-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
      .pd-ch-hint { height:.35rem; border-radius:999px; background:color-mix(in srgb,${tokens.line} 70%,${tokens.surface}); overflow:hidden; }
      .pd-ch-hint i { display:block; height:100%; width:var(--pd-ch-dom, 50%); background:linear-gradient(90deg,${tokens.ocean},${tokens.coral}); transition:width .25s ease; }
      .pd-ch.is-paused .pd-ch-hint i { transition:none; }
    </style>
    <div class="pd-ch${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="pd-ch-block">
        <h3>${escapeHtml(copy.partnerControlLabel)}</h3>
        <div class="pd-ch-row" role="group" aria-label="${escapeHtml(copy.partnerControlLabel)}">
          <button type="button" class="pd-ch-btn" data-pd-partner="C" aria-pressed="true">${escapeHtml(copy.coopLabel)}</button>
          <button type="button" class="pd-ch-btn" data-pd-partner="D" aria-pressed="false">${escapeHtml(copy.defectLabel)}</button>
        </div>
      </div>
      <div class="pd-ch-block">
        <h3>${escapeHtml(copy.yourControlLabel)}</h3>
        <div class="pd-ch-row" role="group" aria-label="${escapeHtml(copy.yourControlLabel)}">
          <button type="button" class="pd-ch-btn" data-pd-you="C" aria-pressed="false">${escapeHtml(copy.coopLabel)}</button>
          <button type="button" class="pd-ch-btn is-best" data-pd-you="D" aria-pressed="true">${escapeHtml(copy.defectLabel)}</button>
        </div>
        <div class="pd-ch-hint" aria-hidden="true"><i data-pd-ch-bar></i></div>
      </div>
      <div class="pd-ch-metrics">
        <div class="pd-ch-metric"><small>${escapeHtml(copy.yearsLabel)}</small><output data-pd-you-years></output></div>
        <div class="pd-ch-metric"><small>${escapeHtml(copy.partnerYearsLabel)}</small><output data-pd-partner-years></output></div>
      </div>
      <p class="pd-ch-status" data-pd-ch-status aria-live="polite"></p>
      <p class="pd-ch-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".pd-ch");
  const status = root.querySelector("[data-pd-ch-status]");
  const youYears = root.querySelector("[data-pd-you-years]");
  const partnerYears = root.querySelector("[data-pd-partner-years]");
  const bar = root.querySelector("[data-pd-ch-bar]");
  const partnerButtons = [...root.querySelectorAll("[data-pd-partner]")];
  const youButtons = [...root.querySelectorAll("[data-pd-you]")];
  let partner = "C";
  let you = "D";

  const statusKey = () => {
    if (partner === "C" && you === "C") return copy.statusCooperateVsC;
    if (partner === "C" && you === "D") return copy.statusDefectVsC;
    if (partner === "D" && you === "C") return copy.statusCooperateVsD;
    return copy.statusDefectVsD;
  };

  const render = (speak = false) => {
    const [y, p] = payoffs[you][partner];
    youYears.textContent = `${y} ${copy.yearsUnit}`;
    partnerYears.textContent = `${p} ${copy.yearsUnit}`;
    partnerButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.pdPartner === partner)));
    youButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.pdYou === you)));
    // Dominance bar: Defect always privately better → lean toward coral
    bar.style.setProperty("--pd-ch-dom", you === "D" ? "88%" : "28%");
    status.textContent = statusKey();
    if (speak) announce(status.textContent);
  };

  partnerButtons.forEach((button) => button.addEventListener("click", () => { partner = button.dataset.pdPartner; render(true); }));
  youButtons.forEach((button) => button.addEventListener("click", () => { you = button.dataset.pdYou; render(true); }));
  render();
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => { partner = "C"; you = "D"; render(); },
    destroy: () => { root.innerHTML = ""; }
  };
});
