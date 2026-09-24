registerDemo("bf-metaphor", ({ root, copy, tokens, announce }) => {
  const cards = copy.cards.map((card, index) => `
    <button type="button" class="bf-met-card" data-bf-met="${index}" aria-pressed="${index === 0}">
      <span class="bf-met-label">${escapeHtml(card.label)}</span>
      <span class="bf-met-claim">${escapeHtml(card.claim)}</span>
    </button>`).join("");

  root.innerHTML = `
    <style>
      .bf-met { display:grid; gap:1rem; min-height:22rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink}; }
      .bf-met-grid { display:grid; gap:.7rem; grid-template-columns:repeat(auto-fit,minmax(10rem,1fr)); }
      .bf-met-card { display:grid; gap:.45rem; text-align:left; padding:.95rem; border:1px solid ${tokens.line}; border-radius:.95rem;
        background:${tokens.surface}; color:${tokens.ink}; font:inherit; cursor:pointer; min-height:7rem; }
      .bf-met-card[aria-pressed="true"] { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}; background:color-mix(in srgb,${tokens.ocean} 8%,${tokens.surface}); }
      .bf-met-card:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .bf-met-label { font-size:.72rem; font-weight:850; letter-spacing:.05em; text-transform:uppercase; color:${tokens.ocean}; }
      .bf-met-claim { font-weight:700; line-height:1.4; }
      .bf-met-readout { display:grid; gap:.55rem; padding:1rem 1.1rem; border:1px solid ${tokens.line}; border-radius:1rem;
        background:color-mix(in srgb,${tokens.paper} 45%,${tokens.surface}); }
      .bf-met-verdict { display:inline-flex; width:max-content; padding:.3rem .65rem; border-radius:999px; font-size:.75rem; font-weight:850;
        background:color-mix(in srgb,${tokens.ocean} 18%,${tokens.surface}); color:${tokens.ocean}; }
      .bf-met-verdict.is-over { background:color-mix(in srgb,${tokens.coral} 18%,${tokens.surface}); color:${tokens.coral}; }
      .bf-met-verdict.is-false { background:color-mix(in srgb,${tokens.warm} 22%,${tokens.surface}); color:${tokens.ink}; }
      .bf-met-detail { margin:0; color:${tokens.muted}; line-height:1.55; }
      .bf-met-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
    </style>
    <div class="bf-met" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="bf-met-grid" role="group" aria-label="${escapeHtml(copy.controlLabel)}">${cards}</div>
      <div class="bf-met-readout">
        <span class="bf-met-verdict" data-bf-verdict></span>
        <p class="bf-met-detail" data-bf-detail role="status"></p>
      </div>
      <p class="bf-met-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const verdictEl = root.querySelector("[data-bf-verdict]");
  const detailEl = root.querySelector("[data-bf-detail]");
  const btns = [...root.querySelectorAll("[data-bf-met]")];

  const select = (index, speak = false) => {
    const card = copy.cards[index];
    verdictEl.textContent = `${copy.verdictLabel}: ${card.verdict}`;
    verdictEl.classList.toggle("is-over", /over|過度|言い過ぎ/i.test(card.verdict));
    verdictEl.classList.toggle("is-false", /false|否|誤り/i.test(card.verdict));
    const status = copy.statusTemplate
      .replace("{label}", card.label)
      .replace("{verdict}", card.verdict)
      .replace("{detail}", card.detail);
    detailEl.textContent = status;
    btns.forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
    if (speak) announce(status);
  };

  btns.forEach((b) => b.addEventListener("click", () => select(Number(b.dataset.bfMet), true)));
  select(0);
  return {
    pause: () => {},
    resume: () => {},
    reset: () => select(0),
    destroy: () => { root.innerHTML = ""; }
  };
});
