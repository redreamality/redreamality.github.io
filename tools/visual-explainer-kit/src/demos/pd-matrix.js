registerDemo("pd-matrix", ({ root, copy, motion, tokens, announce }) => {
  const byKey = Object.fromEntries(copy.cells.map((cell) => [cell.key, cell]));
  const order = ["cc", "cd", "dc", "dd"];

  root.innerHTML = `
    <style>
      .pd-mx { display:grid; gap:1rem; min-height:26rem; padding:clamp(1rem,4vw,2.25rem); color:${tokens.ink}; background:linear-gradient(145deg,color-mix(in srgb,${tokens.warm} 8%,${tokens.surface}),${tokens.surface} 60%,color-mix(in srgb,${tokens.ocean} 10%,${tokens.surface})); }
      .pd-mx-board { display:grid; grid-template-columns:5.5rem 1fr 1fr; grid-template-rows:auto 1fr 1fr; gap:.5rem; }
      .pd-mx-label { display:grid; place-items:center; color:${tokens.muted}; font-size:.7rem; font-weight:850; text-align:center; }
      .pd-mx-cell { display:grid; gap:.3rem; place-items:center; min-height:6.2rem; padding:.75rem; border:1px solid ${tokens.line}; border-radius:.9rem; background:${tokens.surface}; cursor:pointer; font:inherit; color:${tokens.ink}; }
      .pd-mx-cell[aria-pressed="true"] { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}, 0 0 0 .2rem color-mix(in srgb,${tokens.ocean} 18%,transparent); }
      .pd-mx-cell:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .pd-mx-cell strong { font-size:1.1rem; }
      .pd-mx-cell small { color:${tokens.muted}; font-size:.68rem; }
      .pd-mx-cell em { font-style:normal; color:${tokens.coral}; font-size:.72rem; font-weight:850; }
      .pd-mx-glow { transition:box-shadow .25s ease; }
      .pd-mx.is-paused .pd-mx-glow { transition:none; }
      .pd-mx-status { min-height:4rem; margin:0; padding:1rem; border-left:.28rem solid ${tokens.warm}; border-radius:.75rem; background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); color:${tokens.muted}; line-height:1.55; }
      .pd-mx-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
      @media (max-width:520px) { .pd-mx-board { grid-template-columns:4.2rem 1fr 1fr; } .pd-mx-cell { min-height:5.2rem; } }
    </style>
    <div class="pd-mx${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="pd-mx-board" role="group" aria-label="${escapeHtml(copy.controlLabel)}">
        <div></div>
        <div class="pd-mx-label">${escapeHtml(copy.colLabel)}<br>${escapeHtml(copy.coopLabel)}</div>
        <div class="pd-mx-label">${escapeHtml(copy.colLabel)}<br>${escapeHtml(copy.defectLabel)}</div>
        <div class="pd-mx-label">${escapeHtml(copy.rowLabel)}<br>${escapeHtml(copy.coopLabel)}</div>
        <button type="button" class="pd-mx-cell pd-mx-glow" data-pd-mx="cc" aria-pressed="true"></button>
        <button type="button" class="pd-mx-cell pd-mx-glow" data-pd-mx="cd" aria-pressed="false"></button>
        <div class="pd-mx-label">${escapeHtml(copy.rowLabel)}<br>${escapeHtml(copy.defectLabel)}</div>
        <button type="button" class="pd-mx-cell pd-mx-glow" data-pd-mx="dc" aria-pressed="false"></button>
        <button type="button" class="pd-mx-cell pd-mx-glow" data-pd-mx="dd" aria-pressed="false"></button>
      </div>
      <p class="pd-mx-status" data-pd-mx-status aria-live="polite"></p>
      <p class="pd-mx-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const scene = root.querySelector(".pd-mx");
  const status = root.querySelector("[data-pd-mx-status]");
  const cells = [...root.querySelectorAll("[data-pd-mx]")];

  cells.forEach((node) => {
    const cell = byKey[node.dataset.pdMx];
    node.innerHTML = `<em>${escapeHtml(cell.title)}</em><strong>${cell.you} , ${cell.other}</strong><small>${escapeHtml(copy.youShort)} / ${escapeHtml(copy.otherShort)} · ${escapeHtml(copy.yearsUnit)}</small>`;
  });

  const select = (key, speak = false) => {
    const cell = byKey[key];
    cells.forEach((node) => node.setAttribute("aria-pressed", String(node.dataset.pdMx === key)));
    status.textContent = `${cell.title}: ${cell.detail}`;
    if (speak) announce(cell.detail);
  };

  cells.forEach((node) => node.addEventListener("click", () => select(node.dataset.pdMx, true)));
  select("cc");
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => select("cc"),
    destroy: () => { root.innerHTML = ""; }
  };
});
