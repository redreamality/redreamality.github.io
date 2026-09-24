registerDemo("inf-prices", ({ root, copy, motion, tokens, announce }) => {
  root.innerHTML = `
    <style>
      .inf-prices { display:grid; gap:1rem; min-height:22rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink};
        background:linear-gradient(165deg,${tokens.surface},color-mix(in srgb,${tokens.warm} 8%,${tokens.surface})); }
      .inf-prices-meter { display:grid; gap:.6rem; padding:1.1rem; border:1px solid ${tokens.line}; border-radius:1rem;
        background:color-mix(in srgb,${tokens.paper} 50%,${tokens.surface}); }
      .inf-prices-row { display:flex; justify-content:space-between; gap:1rem; align-items:baseline; font-weight:800; }
      .inf-prices-bar { height:1rem; border-radius:999px; background:color-mix(in srgb,${tokens.line} 70%,${tokens.surface}); overflow:hidden; }
      .inf-prices-fill { height:100%; width:30%; border-radius:inherit; background:linear-gradient(90deg,${tokens.ocean},${tokens.coral});
        transition:width 450ms ease; }
      .inf-prices-cost { font-size:1.6rem; font-weight:900; color:${tokens.ocean}; transition:color 300ms ease; }
      .inf-prices-control { display:grid; gap:.45rem; }
      .inf-prices-control label { font-weight:800; }
      .inf-prices input[type="range"] { width:100%; accent-color:${tokens.coral}; }
      .inf-prices-status { margin:0; padding:.85rem 1rem; border:1px solid ${tokens.line}; border-radius:.85rem;
        background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); color:${tokens.muted}; line-height:1.5; }
      .inf-prices-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
      .inf-prices.is-paused .inf-prices-fill { transition:none; }
    </style>
    <div class="inf-prices${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="inf-prices-meter">
        <div class="inf-prices-row"><span>${escapeHtml(copy.indexLabel)}</span><span data-inf-index>100</span></div>
        <div class="inf-prices-bar" aria-hidden="true"><div class="inf-prices-fill" data-inf-fill></div></div>
        <div class="inf-prices-row"><span>${escapeHtml(copy.costLabel)}</span><span class="inf-prices-cost" data-inf-cost></span></div>
      </div>
      <div class="inf-prices-control">
        <label for="inf-prices-range">${escapeHtml(copy.controlLabel)}</label>
        <input id="inf-prices-range" type="range" min="80" max="180" value="100" data-inf-range />
      </div>
      <p class="inf-prices-status" data-inf-status role="status"></p>
      <p class="inf-prices-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".inf-prices");
  const range = root.querySelector("[data-inf-range]");
  const fill = root.querySelector("[data-inf-fill]");
  const indexEl = root.querySelector("[data-inf-index]");
  const costEl = root.querySelector("[data-inf-cost]");
  const status = root.querySelector("[data-inf-status]");

  const render = (speak = false) => {
    const v = Number(range.value);
    const pct = ((v - 80) / 100) * 100;
    fill.style.width = `${Math.max(12, Math.min(100, pct))}%`;
    indexEl.textContent = String(v);
    costEl.textContent = `${v}${copy.unitSuffix}`;
    costEl.style.color = v > 130 ? tokens.coral : tokens.ocean;
    status.textContent = v < 120 ? copy.statusLow : copy.statusHigh;
    if (speak) announce(status.textContent);
  };

  range.addEventListener("input", () => render(true));
  render();
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => { range.value = "100"; render(); },
    destroy: () => { root.innerHTML = ""; }
  };
});
