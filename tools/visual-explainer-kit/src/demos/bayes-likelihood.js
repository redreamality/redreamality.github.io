registerDemo("bayes-likelihood", ({ root, copy, motion, tokens, announce }) => {
  root.innerHTML = `
    <style>
      .bayes-lk { display:grid; gap:1rem; min-height:22rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink};
        background:linear-gradient(160deg,color-mix(in srgb,${tokens.paper} 70%,${tokens.surface}),${tokens.surface}); }
      .bayes-lk-readout { display:grid; grid-template-columns:1fr 1fr 1fr; gap:.75rem; }
      @media (max-width:640px){ .bayes-lk-readout { grid-template-columns:1fr; } }
      .bayes-lk-card { padding:.85rem 1rem; border:1px solid ${tokens.line}; border-radius:.85rem;
        background:color-mix(in srgb,${tokens.paper} 45%,${tokens.surface}); }
      .bayes-lk-card-label { margin:0 0 .25rem; font-size:.72rem; font-weight:800; letter-spacing:.04em; text-transform:uppercase; color:${tokens.muted}; }
      .bayes-lk-card-value { margin:0; font-size:1.25rem; font-weight:850; }
      .bayes-lk-card[data-accent="lr"] .bayes-lk-card-value { color:${tokens.coral}; }
      .bayes-lk-viz { position:relative; height:5.5rem; border-radius:.85rem; border:1px dashed ${tokens.line}; overflow:hidden;
        background:color-mix(in srgb,${tokens.surface} 80%,${tokens.paper}); }
      .bayes-lk-viz svg { width:100%; height:100%; display:block; }
      .bayes-lk-control { display:grid; gap:.45rem; }
      .bayes-lk-control label { font-weight:800; font-size:.9rem; }
      .bayes-lk input[type="range"] { width:100%; accent-color:${tokens.ocean}; }
      .bayes-lk-status { margin:0; padding:.85rem 1rem; border:1px solid ${tokens.line}; border-radius:.85rem;
        background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); color:${tokens.muted}; line-height:1.5; }
      .bayes-lk-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
      .bayes-lk.is-paused rect { transition:none; }
    </style>
    <div class="bayes-lk${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="bayes-lk-readout">
        <div class="bayes-lk-card">
          <p class="bayes-lk-card-label">${escapeHtml(copy.sensitivityLabel)}</p>
          <p class="bayes-lk-card-value" data-sens-val>—</p>
        </div>
        <div class="bayes-lk-card">
          <p class="bayes-lk-card-label">${escapeHtml(copy.fprLabel)}</p>
          <p class="bayes-lk-card-value" data-fpr-val>—</p>
        </div>
        <div class="bayes-lk-card" data-accent="lr">
          <p class="bayes-lk-card-label">${escapeHtml(copy.lrLabel)}</p>
          <p class="bayes-lk-card-value" data-lr-val>—</p>
        </div>
      </div>
      <div class="bayes-lk-viz" aria-hidden="true">
        <svg viewBox="0 0 320 88" preserveAspectRatio="none">
          <rect x="24" y="18" width="12" height="52" rx="4" fill="${tokens.line}" opacity=".35"/>
          <rect data-sens-bar x="48" y="18" width="80" height="52" rx="6" fill="${tokens.ocean}" style="transition:width 300ms ease"/>
          <rect x="180" y="18" width="12" height="52" rx="4" fill="${tokens.line}" opacity=".35"/>
          <rect data-fpr-bar x="204" y="40" width="40" height="30" rx="6" fill="${tokens.coral}" style="transition:width 300ms ease,y 300ms ease,height 300ms ease"/>
        </svg>
      </div>
      <div class="bayes-lk-control">
        <label for="bayes-sens">${escapeHtml(copy.sensitivityLabel)}</label>
        <input id="bayes-sens" type="range" min="60" max="99" value="90" data-sens />
      </div>
      <div class="bayes-lk-control">
        <label for="bayes-fpr">${escapeHtml(copy.fprLabel)}</label>
        <input id="bayes-fpr" type="range" min="1" max="20" value="5" data-fpr />
      </div>
      <p class="bayes-lk-status" data-bayes-lk-status role="status"></p>
      <p class="bayes-lk-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".bayes-lk");
  const sens = root.querySelector("[data-sens]");
  const fpr = root.querySelector("[data-fpr]");
  const sensVal = root.querySelector("[data-sens-val]");
  const fprVal = root.querySelector("[data-fpr-val]");
  const lrVal = root.querySelector("[data-lr-val]");
  const sensBar = root.querySelector("[data-sens-bar]");
  const fprBar = root.querySelector("[data-fpr-bar]");
  const status = root.querySelector("[data-bayes-lk-status]");

  const render = (speak = false) => {
    const s = Number(sens.value) / 100;
    const f = Number(fpr.value) / 100;
    const lr = f > 0 ? s / f : Infinity;
    sensVal.textContent = `${Math.round(s * 100)}%`;
    fprVal.textContent = `${Math.round(f * 100)}%`;
    lrVal.textContent = Number.isFinite(lr) ? `${lr.toFixed(1)}×` : "∞";
    sensBar.setAttribute("width", String(40 + s * 100));
    const fprW = 12 + f * 200;
    fprBar.setAttribute("width", String(fprW));
    fprBar.setAttribute("height", String(18 + f * 80));
    fprBar.setAttribute("y", String(70 - (18 + f * 80)));
    status.textContent = lr < 8 ? copy.statusWeak : copy.statusStrong;
    if (speak) announce(status.textContent);
  };

  sens.addEventListener("input", () => render(true));
  fpr.addEventListener("input", () => render(true));
  render();
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => { sens.value = "90"; fpr.value = "5"; render(); },
    destroy: () => { root.innerHTML = ""; }
  };
});
