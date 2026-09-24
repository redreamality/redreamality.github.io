registerDemo("bayes-prior", ({ root, copy, motion, tokens, announce }) => {
  root.innerHTML = `
    <style>
      .bayes-pr { display:grid; gap:1rem; min-height:22rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink};
        background:linear-gradient(160deg,color-mix(in srgb,${tokens.paper} 70%,${tokens.surface}),${tokens.surface}); }
      .bayes-pr-stage { display:grid; gap:.85rem; padding:1rem; border:1px solid ${tokens.line}; border-radius:1rem;
        background:color-mix(in srgb,${tokens.surface} 85%,${tokens.paper}); }
      .bayes-pr-bars { display:grid; grid-template-columns:1fr 1fr; gap:1rem; min-height:9rem; }
      @media (max-width:640px){ .bayes-pr-bars { grid-template-columns:1fr; } }
      .bayes-pr-col { display:grid; gap:.4rem; align-content:end; }
      .bayes-pr-stack { height:8rem; border-radius:.75rem; overflow:hidden; border:1px solid ${tokens.line};
        display:flex; flex-direction:column-reverse; background:${tokens.surface}; }
      .bayes-pr-has { background:${tokens.coral}; transition:flex-basis 350ms ease; }
      .bayes-pr-clear { background:color-mix(in srgb,${tokens.ocean} 50%,${tokens.surface}); transition:flex-basis 350ms ease; }
      .bayes-pr-name { margin:0; font-size:.82rem; font-weight:800; text-align:center; }
      .bayes-pr-pct { margin:0; font-size:.75rem; color:${tokens.muted}; text-align:center; }
      .bayes-pr-control { display:grid; gap:.45rem; }
      .bayes-pr-control label { font-weight:800; font-size:.9rem; }
      .bayes-pr input[type="range"] { width:100%; accent-color:${tokens.ocean}; }
      .bayes-pr-legend { display:flex; flex-wrap:wrap; gap:1rem; font-size:.78rem; font-weight:750; }
      .bayes-pr-swatch { display:inline-block; width:.75rem; height:.75rem; border-radius:999px; margin-right:.35rem; vertical-align:middle; }
      .bayes-pr-status { margin:0; padding:.85rem 1rem; border:1px solid ${tokens.line}; border-radius:.85rem;
        background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); color:${tokens.muted}; line-height:1.5; }
      .bayes-pr-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
      .bayes-pr.is-paused .bayes-pr-has, .bayes-pr.is-paused .bayes-pr-clear { transition:none; }
    </style>
    <div class="bayes-pr${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="bayes-pr-stage">
        <div class="bayes-pr-legend">
          <span><span class="bayes-pr-swatch" style="background:${tokens.coral}"></span>${escapeHtml(copy.hasLabel)}</span>
          <span><span class="bayes-pr-swatch" style="background:color-mix(in srgb,${tokens.ocean} 50%,${tokens.surface})"></span>${escapeHtml(copy.clearLabel)}</span>
        </div>
        <div class="bayes-pr-bars">
          <div class="bayes-pr-col">
            <div class="bayes-pr-stack">
              <div class="bayes-pr-has" data-rare-has style="flex:0 0 5%"></div>
              <div class="bayes-pr-clear" style="flex:1 1 auto"></div>
            </div>
            <p class="bayes-pr-name">${escapeHtml(copy.rareLabel)}</p>
            <p class="bayes-pr-pct" data-rare-pct>5%</p>
          </div>
          <div class="bayes-pr-col">
            <div class="bayes-pr-stack">
              <div class="bayes-pr-has" data-common-has style="flex:0 0 25%"></div>
              <div class="bayes-pr-clear" style="flex:1 1 auto"></div>
            </div>
            <p class="bayes-pr-name">${escapeHtml(copy.commonLabel)}</p>
            <p class="bayes-pr-pct" data-common-pct>25%</p>
          </div>
        </div>
      </div>
      <div class="bayes-pr-control">
        <label for="bayes-pr-range">${escapeHtml(copy.controlLabel)}</label>
        <input id="bayes-pr-range" type="range" min="0" max="100" value="40" data-bayes-pr-range />
      </div>
      <p class="bayes-pr-status" data-bayes-pr-status role="status"></p>
      <p class="bayes-pr-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".bayes-pr");
  const range = root.querySelector("[data-bayes-pr-range]");
  const status = root.querySelector("[data-bayes-pr-status]");
  const rareHas = root.querySelector("[data-rare-has]");
  const commonHas = root.querySelector("[data-common-has]");
  const rarePct = root.querySelector("[data-rare-pct]");
  const commonPct = root.querySelector("[data-common-pct]");

  const render = (speak = false) => {
    const t = Number(range.value) / 100;
    // Rare: 1%–8%; higher-risk: 15%–40% as dial moves toward "common"
    const rare = Math.round(1 + t * 7);
    const common = Math.round(15 + t * 25);
    rareHas.style.flex = `0 0 ${rare}%`;
    commonHas.style.flex = `0 0 ${common}%`;
    rarePct.textContent = `${rare}%`;
    commonPct.textContent = `${common}%`;
    status.textContent = t < 0.45 ? copy.statusRare : copy.statusCommon;
    if (speak) announce(status.textContent);
  };

  range.addEventListener("input", () => render(true));
  render();
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => { range.value = "40"; render(); },
    destroy: () => { root.innerHTML = ""; }
  };
});
