registerDemo("bf-horizon", ({ root, copy, tokens, announce }) => {
  const digitButtons = copy.digits.map((d, index) => `
    <button type="button" class="bf-hz-btn" data-bf-hz="${index}" aria-pressed="${index === 0}">${escapeHtml(d.label)}</button>`).join("");

  root.innerHTML = `
    <style>
      .bf-hz { display:grid; gap:1rem; min-height:24rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink}; }
      .bf-hz-track { position:relative; height:4.2rem; border-radius:999px; border:1px solid ${tokens.line}; overflow:hidden;
        background:linear-gradient(90deg, color-mix(in srgb,${tokens.ocean} 28%,${tokens.surface}) 0%, color-mix(in srgb,${tokens.ocean} 28%,${tokens.surface}) var(--bf-hz, 30%), color-mix(in srgb,${tokens.coral} 22%,${tokens.surface}) var(--bf-hz, 30%), color-mix(in srgb,${tokens.coral} 22%,${tokens.surface}) 100%); }
      .bf-hz-marker { position:absolute; top:0; bottom:0; left:var(--bf-hz, 30%); width:3px; background:${tokens.ink}; transform:translateX(-50%); }
      .bf-hz-labels { display:flex; justify-content:space-between; font-size:.78rem; font-weight:750; color:${tokens.muted}; }
      .bf-hz-readout { display:grid; grid-template-columns:repeat(auto-fit,minmax(9rem,1fr)); gap:.7rem; }
      .bf-hz-card { padding:.9rem 1rem; border:1px solid ${tokens.line}; border-radius:.9rem; background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); }
      .bf-hz-card b { display:block; font-size:.72rem; letter-spacing:.05em; text-transform:uppercase; color:${tokens.ocean}; margin-bottom:.35rem; }
      .bf-hz-card p { margin:0; font-size:1.35rem; font-weight:850; }
      .bf-hz-controls { display:flex; flex-wrap:wrap; gap:.55rem; }
      .bf-hz-btn { flex:1 1 6.5rem; padding:.7rem; border:1px solid ${tokens.line}; border-radius:.8rem; color:${tokens.ink};
        background:${tokens.surface}; font:inherit; font-weight:800; cursor:pointer; }
      .bf-hz-btn[aria-pressed="true"] { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}; }
      .bf-hz-btn:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .bf-hz-status { margin:0; color:${tokens.muted}; line-height:1.5; }
      .bf-hz-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
    </style>
    <div class="bf-hz" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="bf-hz-labels"><span>${escapeHtml(copy.beforeLabel)}</span><span>${escapeHtml(copy.afterLabel)}</span></div>
      <div class="bf-hz-track" data-bf-track aria-hidden="true"><span class="bf-hz-marker"></span></div>
      <div class="bf-hz-readout">
        <div class="bf-hz-card"><b>${escapeHtml(copy.controlLabel)}</b><p data-bf-digits></p></div>
        <div class="bf-hz-card"><b>${escapeHtml(copy.horizonLabel)}</b><p data-bf-horizon></p></div>
        <div class="bf-hz-card"><b>${escapeHtml(copy.errorLabel)}</b><p data-bf-thresh>10⁻¹</p></div>
      </div>
      <div class="bf-hz-controls" role="group" aria-label="${escapeHtml(copy.controlLabel)}">${digitButtons}</div>
      <p class="bf-hz-status" data-bf-status role="status"></p>
      <p class="bf-hz-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const track = root.querySelector("[data-bf-track]");
  const digitsEl = root.querySelector("[data-bf-digits]");
  const horizonEl = root.querySelector("[data-bf-horizon]");
  const status = root.querySelector("[data-bf-status]");
  const btns = [...root.querySelectorAll("[data-bf-hz]")];
  const maxH = Math.max(...copy.digits.map((d) => d.horizon));

  const select = (index, speak = false) => {
    const d = copy.digits[index];
    const pct = Math.round((d.horizon / maxH) * 100);
    track.style.setProperty("--bf-hz", `${pct}%`);
    digitsEl.textContent = String(d.digits);
    horizonEl.textContent = String(d.horizon);
    status.textContent = d.status;
    btns.forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
    if (speak) announce(d.status);
  };

  btns.forEach((b) => b.addEventListener("click", () => select(Number(b.dataset.bfHz), true)));
  select(0);
  return {
    pause: () => {},
    resume: () => {},
    reset: () => select(0),
    destroy: () => { root.innerHTML = ""; }
  };
});
