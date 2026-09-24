registerDemo("pd-welfare", ({ root, copy, motion, tokens, announce }) => {
  root.innerHTML = `
    <style>
      .pd-wf { display:grid; gap:1rem; min-height:26rem; padding:clamp(1rem,4vw,2.25rem); color:${tokens.ink}; background:linear-gradient(150deg,color-mix(in srgb,${tokens.warm} 9%,${tokens.surface}),${tokens.surface} 55%,color-mix(in srgb,${tokens.ocean} 9%,${tokens.surface})); }
      .pd-wf-controls { display:grid; grid-template-columns:1fr 1fr; gap:.55rem; }
      .pd-wf-btn { padding:.9rem; border:1px solid ${tokens.line}; border-radius:.85rem; color:${tokens.ink}; background:${tokens.surface}; font:inherit; font-weight:850; cursor:pointer; }
      .pd-wf-btn[aria-pressed="true"] { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}; }
      .pd-wf-btn[data-pd-wf="dd"][aria-pressed="true"] { border-color:${tokens.coral}; box-shadow:inset 0 0 0 1px ${tokens.coral}; }
      .pd-wf-btn:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .pd-wf-bars { display:grid; gap:.85rem; padding:1rem; border:1px solid ${tokens.line}; border-radius:1rem; background:${tokens.surface}; }
      .pd-wf-row { display:grid; grid-template-columns:5.5rem 1fr 3.2rem; gap:.65rem; align-items:center; }
      .pd-wf-row span { font-size:.78rem; font-weight:800; }
      .pd-wf-track { height:.85rem; overflow:hidden; border-radius:999px; background:color-mix(in srgb,${tokens.line} 65%,${tokens.surface}); }
      .pd-wf-track i { display:block; height:100%; width:calc(var(--pd-wf-w, 25) * 1%); background:linear-gradient(90deg,${tokens.ocean},${tokens.coral}); transition:width .3s ease; }
      .pd-wf.is-paused .pd-wf-track i { transition:none; }
      .pd-wf-row output { text-align:right; font-weight:900; color:${tokens.coral}; }
      .pd-wf-total { display:grid; grid-template-columns:1fr 1fr; gap:.65rem; }
      .pd-wf-metric { padding:.9rem; border:1px solid ${tokens.line}; border-radius:.85rem; background:color-mix(in srgb,${tokens.paper} 42%,${tokens.surface}); text-align:center; }
      .pd-wf-metric small { display:block; margin-bottom:.3rem; color:${tokens.muted}; font-size:.68rem; }
      .pd-wf-metric output { font-size:1.35rem; font-weight:900; color:${tokens.coral}; }
      .pd-wf-status { min-height:4.2rem; margin:0; padding:1rem; border-left:.28rem solid ${tokens.warm}; border-radius:.75rem; background:color-mix(in srgb,${tokens.paper} 42%,${tokens.surface}); color:${tokens.muted}; line-height:1.55; }
      .pd-wf-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
    </style>
    <div class="pd-wf${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="pd-wf-controls" role="group" aria-label="${escapeHtml(copy.controlLabel)}">
        <button type="button" class="pd-wf-btn" data-pd-wf="cc" aria-pressed="true">${escapeHtml(copy.ccLabel)}</button>
        <button type="button" class="pd-wf-btn" data-pd-wf="dd" aria-pressed="false">${escapeHtml(copy.ddLabel)}</button>
      </div>
      <div class="pd-wf-bars">
        <div class="pd-wf-row"><span>${escapeHtml(copy.youLabel)}</span><div class="pd-wf-track"><i data-pd-wf-you-bar></i></div><output data-pd-wf-you></output></div>
        <div class="pd-wf-row"><span>${escapeHtml(copy.otherLabel)}</span><div class="pd-wf-track"><i data-pd-wf-other-bar></i></div><output data-pd-wf-other></output></div>
      </div>
      <div class="pd-wf-total">
        <div class="pd-wf-metric"><small>${escapeHtml(copy.totalLabel)}</small><output data-pd-wf-total></output></div>
        <div class="pd-wf-metric"><small>${escapeHtml(copy.gapLabel)}</small><output data-pd-wf-gap></output></div>
      </div>
      <p class="pd-wf-status" data-pd-wf-status aria-live="polite"></p>
      <p class="pd-wf-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".pd-wf");
  const status = root.querySelector("[data-pd-wf-status]");
  const youOut = root.querySelector("[data-pd-wf-you]");
  const otherOut = root.querySelector("[data-pd-wf-other]");
  const totalOut = root.querySelector("[data-pd-wf-total]");
  const gapOut = root.querySelector("[data-pd-wf-gap]");
  const youBar = root.querySelector("[data-pd-wf-you-bar]");
  const otherBar = root.querySelector("[data-pd-wf-other-bar]");
  const buttons = [...root.querySelectorAll("[data-pd-wf]")];
  const profiles = {
    cc: { you: 1, other: 1, total: 2, gap: 0, detail: copy.ccDetail },
    dd: { you: 2, other: 2, total: 4, gap: 2, detail: copy.ddDetail }
  };

  const select = (key, speak = false) => {
    const profile = profiles[key];
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.pdWf === key)));
    youOut.textContent = `${profile.you} ${copy.yearsUnit}`;
    otherOut.textContent = `${profile.other} ${copy.yearsUnit}`;
    totalOut.textContent = `${profile.total} ${copy.yearsUnit}`;
    gapOut.textContent = `${profile.gap} ${copy.yearsUnit}`;
    youBar.style.setProperty("--pd-wf-w", String((profile.you / 4) * 100));
    otherBar.style.setProperty("--pd-wf-w", String((profile.other / 4) * 100));
    status.textContent = profile.detail;
    if (speak) announce(profile.detail);
  };

  buttons.forEach((button) => button.addEventListener("click", () => select(button.dataset.pdWf, true)));
  select("cc");
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => select("cc"),
    destroy: () => { root.innerHTML = ""; }
  };
});
