registerDemo("pv-auction-overview", ({ root, copy, motion, tokens, announce }) => {
  root.innerHTML = `
    <style>
      .pv-auction { display:grid; gap:1rem; min-height:25rem; padding:clamp(1rem,4vw,2.25rem); color:${tokens.ink}; background:linear-gradient(145deg,color-mix(in srgb,${tokens.ocean} 11%,${tokens.surface}),${tokens.surface} 52%,color-mix(in srgb,${tokens.warm} 10%,${tokens.surface})); }
      .pv-auction-board { display:grid; grid-template-columns:1fr auto 1fr; gap:.75rem; align-items:center; min-height:15rem; padding:1rem; border:1px solid ${tokens.line}; border-radius:1.25rem; background:color-mix(in srgb,${tokens.paper} 38%,${tokens.surface}); }
      .pv-auction-book { display:grid; gap:.55rem; }
      .pv-auction-book h3 { margin:0; color:${tokens.muted}; font-size:.72rem; letter-spacing:.08em; text-transform:uppercase; }
      .pv-auction-order { position:relative; display:flex; justify-content:space-between; gap:.5rem; isolation:isolate; overflow:hidden; padding:.65rem; border:1px solid ${tokens.line}; border-radius:.65rem; background:${tokens.surface}; font-size:.78rem; }
      .pv-auction-order::before { position:absolute; z-index:-1; inset:0 auto 0 0; width:var(--pv-depth); content:""; background:color-mix(in srgb,${tokens.ocean} 13%,transparent); transition:width .24s ease; }
      .pv-auction-book:last-child .pv-auction-order::before { inset:0 0 0 auto; background:color-mix(in srgb,${tokens.coral} 13%,transparent); }
      .pv-auction-order b { color:${tokens.ocean}; }
      .pv-auction-book:last-child .pv-auction-order b { color:${tokens.coral}; }
      .pv-auction-match { display:grid; place-items:center; width:5.4rem; aspect-ratio:1; border:2px solid ${tokens.warm}; border-radius:50%; background:color-mix(in srgb,${tokens.warm} 13%,${tokens.surface}); text-align:center; font-size:.7rem; font-weight:850; }
      .pv-auction-pulse { width:.65rem; height:.65rem; margin:.35rem auto 0; border-radius:50%; background:${tokens.warm}; animation:pv-auction-pulse 1.4s ease-in-out infinite; }
      .pv-auction-impact { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.55rem; }
      .pv-auction-metric { min-width:0; padding:.7rem; border:1px solid ${tokens.line}; border-radius:.7rem; background:${tokens.surface}; text-align:center; }
      .pv-auction-metric strong { display:block; overflow-wrap:anywhere; color:${tokens.ocean}; font-size:.92rem; }
      .pv-auction-metric span { color:${tokens.muted}; font-size:.66rem; }
      .pv-auction-track { position:relative; grid-column:1/-1; height:.7rem; overflow:hidden; border-radius:999px; background:color-mix(in srgb,${tokens.line} 68%,${tokens.surface}); }
      .pv-auction-track::after { position:absolute; top:0; bottom:0; left:calc(var(--pv-impact) * 1%); width:.8rem; border-radius:999px; content:""; background:${tokens.warm}; transform:translateX(-50%); transition:left .24s ease; }
      .pv-auction-controls { display:flex; flex-wrap:wrap; gap:.6rem; }
      .pv-auction-controls button { flex:1 1 9rem; padding:.75rem; border:1px solid ${tokens.line}; border-radius:.75rem; color:${tokens.ink}; background:${tokens.surface}; font:inherit; font-weight:800; cursor:pointer; }
      .pv-auction-controls button[aria-pressed="true"] { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}; }
      .pv-auction-controls button:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .pv-auction-status { min-height:5.5rem; margin:0; padding:1rem; border-left:.3rem solid ${tokens.ocean}; border-radius:.65rem; background:color-mix(in srgb,${tokens.paper} 45%,${tokens.surface}); color:${tokens.muted}; line-height:1.55; }
      .pv-auction-note { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
      .pv-auction.is-paused .pv-auction-pulse { animation-play-state:paused; }
      @keyframes pv-auction-pulse { 50% { transform:scale(1.8); opacity:.35; } }
      @media (prefers-reduced-motion:reduce) { .pv-auction-order::before,.pv-auction-track::after { transition:none; } }
      @media (max-width:560px) { .pv-auction-board { grid-template-columns:1fr; } .pv-auction-match { width:4.5rem; margin:auto; } .pv-auction-impact { grid-template-columns:1fr; } .pv-auction-track { grid-column:auto; } }
    </style>
    <div class="pv-auction${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="pv-auction-board" data-pv-book>
        <div class="pv-auction-book"><h3>${escapeHtml(copy.bidBook)}</h3>${copy.bids.map((item, index) => `<div class="pv-auction-order" data-pv-depth-side="bid" data-pv-depth-index="${index}"><span>${escapeHtml(item.price)}</span><b data-pv-size></b></div>`).join("")}</div>
        <div class="pv-auction-match"><span>${escapeHtml(copy.matchLabel)}<span class="pv-auction-pulse" aria-hidden="true"></span></span></div>
        <div class="pv-auction-book"><h3>${escapeHtml(copy.askBook)}</h3>${copy.asks.map((item, index) => `<div class="pv-auction-order" data-pv-depth-side="ask" data-pv-depth-index="${index}"><span>${escapeHtml(item.price)}</span><b data-pv-size></b></div>`).join("")}</div>
      </div>
      <div class="pv-auction-impact"><div class="pv-auction-metric"><strong data-pv-liquidity></strong><span>${escapeHtml(copy.liquidityLabel)}</span></div><div class="pv-auction-metric"><strong data-pv-execution></strong><span>${escapeHtml(copy.executionLabel)}</span></div><div class="pv-auction-metric"><strong data-pv-displacement></strong><span>${escapeHtml(copy.displacementLabel)}</span></div><div class="pv-auction-track" data-pv-impact-track aria-hidden="true"></div></div>
      <div class="pv-auction-controls" role="group" aria-label="${escapeHtml(copy.controlLabel)}">${copy.scenarios.map((item, index) => `<button type="button" data-pv-scenario="${index}" aria-pressed="${index === 0}">${escapeHtml(item.label)}</button>`).join("")}</div>
      <p class="pv-auction-status" data-pv-status aria-live="polite"></p>
      <p class="pv-auction-note">${escapeHtml(copy.syntheticNote)}</p>
    </div>`;

  const scene = root.querySelector(".pv-auction");
  const board = root.querySelector("[data-pv-book]");
  const status = root.querySelector(".pv-auction-status");
  const buttons = [...root.querySelectorAll("[data-pv-scenario]")];
  const orders = [...root.querySelectorAll("[data-pv-depth-side]")];
  const liquidity = root.querySelector("[data-pv-liquidity]");
  const execution = root.querySelector("[data-pv-execution]");
  const displacement = root.querySelector("[data-pv-displacement]");
  const impactTrack = root.querySelector("[data-pv-impact-track]");
  const select = (index, speak = false) => {
    const item = copy.scenarios[index];
    scene.dataset.scenario = item.key;
    scene.dataset.liquidity = item.key;
    scene.dataset.executionVolume = String(item.executionValue);
    scene.dataset.displacement = String(item.displacementValue);
    board.setAttribute("aria-label", item.bookAria);
    liquidity.textContent = item.liquidity;
    execution.textContent = item.execution;
    displacement.textContent = item.displacement;
    impactTrack.style.setProperty("--pv-impact", String(item.impact));
    orders.forEach((order) => {
      const side = order.dataset.pvDepthSide;
      const depthIndex = Number(order.dataset.pvDepthIndex);
      const depth = item[`${side}Depths`][depthIndex];
      order.dataset.depth = String(depth);
      order.style.setProperty("--pv-depth", `${depth}%`);
      order.querySelector("[data-pv-size]").textContent = item[`${side}Sizes`][depthIndex];
    });
    status.textContent = item.status;
    buttons.forEach((button, buttonIndex) => button.setAttribute("aria-pressed", String(buttonIndex === index)));
    if (speak) announce(item.status);
  };
  buttons.forEach((button) => button.addEventListener("click", () => select(Number(button.dataset.pvScenario), true)));
  select(0);
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => select(0),
    destroy: () => { root.innerHTML = ""; }
  };
});