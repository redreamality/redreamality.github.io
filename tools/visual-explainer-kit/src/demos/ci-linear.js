registerDemo("ci-linear", ({ root, copy, motion, tokens, announce }) => {
  const PRINCIPAL = 100;
  const RATE = 0.001;

  root.innerHTML = `
    <style>
      .ci-lin { display:grid; gap:1rem; min-height:22rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink};
        background:linear-gradient(160deg,color-mix(in srgb,${tokens.paper} 70%,${tokens.surface}),${tokens.surface}); }
      .ci-lin-meta { display:flex; flex-wrap:wrap; gap:.75rem 1.25rem; font-size:.85rem; color:${tokens.muted}; }
      .ci-lin-meta strong { color:${tokens.ink}; font-weight:850; }
      .ci-lin-stage { position:relative; min-height:12rem; border:1px solid ${tokens.line}; border-radius:1rem;
        background:color-mix(in srgb,${tokens.surface} 85%,${tokens.paper}); padding:.75rem 1rem 1.5rem; }
      .ci-lin-stage svg { width:100%; height:11rem; display:block; }
      .ci-lin-legend { display:flex; flex-wrap:wrap; gap:1rem; font-size:.78rem; font-weight:750; margin-top:.35rem; }
      .ci-lin-swatch { display:inline-block; width:.75rem; height:.75rem; border-radius:999px; margin-right:.35rem; vertical-align:middle; }
      .ci-lin-control { display:grid; gap:.45rem; }
      .ci-lin-control label { font-weight:800; font-size:.9rem; }
      .ci-lin input[type="range"] { width:100%; accent-color:${tokens.ocean}; }
      .ci-lin-readout { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
      @media (max-width:640px){ .ci-lin-readout { grid-template-columns:1fr; } }
      .ci-lin-card { padding:.85rem 1rem; border:1px solid ${tokens.line}; border-radius:.85rem;
        background:color-mix(in srgb,${tokens.paper} 45%,${tokens.surface}); }
      .ci-lin-card-label { margin:0 0 .25rem; font-size:.72rem; font-weight:800; letter-spacing:.04em; text-transform:uppercase; color:${tokens.muted}; }
      .ci-lin-card-value { margin:0; font-size:1.25rem; font-weight:850; }
      .ci-lin-status { margin:0; padding:.85rem 1rem; border:1px solid ${tokens.line}; border-radius:.85rem;
        background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); color:${tokens.muted}; line-height:1.5; }
      .ci-lin-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
      .ci-lin.is-paused path { transition:none; }
    </style>
    <div class="ci-lin${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="ci-lin-meta">
        <span>${escapeHtml(copy.principalLabel)}: <strong>${PRINCIPAL}</strong></span>
        <span>${escapeHtml(copy.rateLabel)}: <strong>0.1%/day</strong></span>
      </div>
      <div class="ci-lin-stage">
        <svg viewBox="0 0 360 140" preserveAspectRatio="none" aria-hidden="true">
          <line x1="24" y1="120" x2="340" y2="120" stroke="${tokens.line}" stroke-width="1"/>
          <line x1="24" y1="20" x2="24" y2="120" stroke="${tokens.line}" stroke-width="1"/>
          <path data-ci-lin-path fill="none" stroke="${tokens.ocean}" stroke-width="2.5" stroke-linecap="round"/>
          <path data-ci-cmp-path fill="none" stroke="${tokens.coral}" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
        <div class="ci-lin-legend">
          <span><span class="ci-lin-swatch" style="background:${tokens.ocean}"></span>${escapeHtml(copy.linearLabel)}</span>
          <span><span class="ci-lin-swatch" style="background:${tokens.coral}"></span>${escapeHtml(copy.compoundLabel)}</span>
        </div>
      </div>
      <div class="ci-lin-control">
        <label for="ci-lin-range">${escapeHtml(copy.controlLabel)}</label>
        <input id="ci-lin-range" type="range" min="0" max="365" value="30" data-ci-range />
      </div>
      <div class="ci-lin-readout">
        <div class="ci-lin-card">
          <p class="ci-lin-card-label">${escapeHtml(copy.linearLabel)}</p>
          <p class="ci-lin-card-value" data-ci-lin-val>—</p>
        </div>
        <div class="ci-lin-card">
          <p class="ci-lin-card-label">${escapeHtml(copy.compoundLabel)}</p>
          <p class="ci-lin-card-value" data-ci-cmp-val>—</p>
        </div>
      </div>
      <p class="ci-lin-status" data-ci-status role="status"></p>
      <p class="ci-lin-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".ci-lin");
  const range = root.querySelector("[data-ci-range]");
  const status = root.querySelector("[data-ci-status]");
  const linVal = root.querySelector("[data-ci-lin-val]");
  const cmpVal = root.querySelector("[data-ci-cmp-val]");
  const linPath = root.querySelector("[data-ci-lin-path]");
  const cmpPath = root.querySelector("[data-ci-cmp-path]");

  const fmt = (n) => n.toFixed(2);
  const yAt = (value, maxV) => 120 - ((value - PRINCIPAL) / (maxV - PRINCIPAL || 1)) * 90;

  const render = (speak = false) => {
    const days = Number(range.value);
    const dailyAdd = PRINCIPAL * RATE;
    const linearEnd = PRINCIPAL + dailyAdd * days;
    const compoundEnd = PRINCIPAL * Math.pow(1 + RATE, days);
    const maxV = Math.max(linearEnd, compoundEnd, PRINCIPAL * 1.01);

    const pts = (fn) => {
      const parts = [];
      const steps = Math.max(1, days);
      for (let i = 0; i <= steps; i += Math.max(1, Math.floor(steps / 48))) {
        const d = Math.min(i, days);
        const x = 24 + (d / Math.max(days, 1)) * 316;
        const y = yAt(fn(d), maxV);
        parts.push(`${parts.length ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`);
      }
      if (days > 0) {
        const x = 24 + 316;
        const y = yAt(fn(days), maxV);
        parts.push(`L${x.toFixed(1)} ${y.toFixed(1)}`);
      } else {
        parts.push(`M24 ${yAt(PRINCIPAL, maxV).toFixed(1)}`);
      }
      return parts.join(" ");
    };

    linPath.setAttribute("d", pts((d) => PRINCIPAL + dailyAdd * d));
    cmpPath.setAttribute("d", pts((d) => PRINCIPAL * Math.pow(1 + RATE, d)));
    linVal.textContent = fmt(linearEnd);
    cmpVal.textContent = fmt(compoundEnd);
    status.textContent = days < 90 ? copy.statusEarly : copy.statusLate;
    if (speak) announce(status.textContent);
  };

  range.addEventListener("input", () => render(true));
  render();
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => { range.value = "30"; render(); },
    destroy: () => { root.innerHTML = ""; }
  };
});
