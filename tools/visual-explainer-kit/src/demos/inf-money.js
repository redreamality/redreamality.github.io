registerDemo("inf-money", ({ root, copy, motion, tokens, announce }) => {
  root.innerHTML = `
    <style>
      .inf-money { display:grid; gap:1rem; min-height:22rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink};
        background:linear-gradient(160deg,color-mix(in srgb,${tokens.paper} 70%,${tokens.surface}),${tokens.surface}); }
      .inf-money-stage { display:grid; grid-template-columns:1.1fr .9fr; gap:1rem; }
      @media (max-width:640px){ .inf-money-stage { grid-template-columns:1fr; } }
      .inf-money-pile, .inf-money-basket { min-height:11rem; border:1px solid ${tokens.line}; border-radius:1rem; padding:1rem;
        background:color-mix(in srgb,${tokens.surface} 85%,${tokens.paper}); display:flex; flex-direction:column; gap:.75rem; }
      .inf-money-label { margin:0; font-size:.78rem; font-weight:800; letter-spacing:.04em; text-transform:uppercase; color:${tokens.muted}; }
      .inf-money-bills { flex:1; display:flex; align-items:flex-end; gap:.35rem; min-height:7rem; }
      .inf-money-bill { flex:1; border-radius:.25rem; background:linear-gradient(180deg,${tokens.ocean},color-mix(in srgb,${tokens.ocean} 60%,${tokens.ink}));
        transition:height 400ms ease; min-height:12%; height:20%; }
      .inf-money-outline { flex:1; border:2px dashed ${tokens.line}; border-radius:.75rem; display:grid; place-items:center;
        color:${tokens.muted}; font-weight:700; background:color-mix(in srgb,${tokens.paper} 40%,transparent); }
      .inf-money-control { display:grid; gap:.45rem; }
      .inf-money-control label { font-weight:800; font-size:.9rem; }
      .inf-money input[type="range"] { width:100%; accent-color:${tokens.ocean}; }
      .inf-money-status { margin:0; padding:.85rem 1rem; border:1px solid ${tokens.line}; border-radius:.85rem;
        background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); color:${tokens.muted}; line-height:1.5; }
      .inf-money-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
      .inf-money.is-paused .inf-money-bill { transition:none; }
    </style>
    <div class="inf-money${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="inf-money-stage">
        <div class="inf-money-pile">
          <p class="inf-money-label">${escapeHtml(copy.moneyLabel)}</p>
          <div class="inf-money-bills" data-inf-bills aria-hidden="true">
            <span class="inf-money-bill"></span><span class="inf-money-bill"></span><span class="inf-money-bill"></span><span class="inf-money-bill"></span>
            <span class="inf-money-bill"></span><span class="inf-money-bill"></span><span class="inf-money-bill"></span><span class="inf-money-bill"></span>
          </div>
        </div>
        <div class="inf-money-basket">
          <p class="inf-money-label">${escapeHtml(copy.basketLabel)}</p>
          <div class="inf-money-outline">▣</div>
        </div>
      </div>
      <div class="inf-money-control">
        <label for="inf-money-range">${escapeHtml(copy.controlLabel)}</label>
        <input id="inf-money-range" type="range" min="0" max="100" value="20" data-inf-range />
      </div>
      <p class="inf-money-status" data-inf-status role="status"></p>
      <p class="inf-money-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".inf-money");
  const billEls = [...root.querySelectorAll(".inf-money-bill")];
  const range = root.querySelector("[data-inf-range]");
  const status = root.querySelector("[data-inf-status]");

  const render = (speak = false) => {
    const v = Number(range.value);
    billEls.forEach((el, i) => {
      const h = 18 + (v / 100) * (18 + i * 8);
      el.style.height = `${Math.min(96, h)}%`;
    });
    status.textContent = v < 45 ? copy.statusLow : copy.statusHigh;
    if (speak) announce(status.textContent);
  };

  range.addEventListener("input", () => render(true));
  render();
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => { range.value = "20"; render(); },
    destroy: () => { root.innerHTML = ""; }
  };
});
