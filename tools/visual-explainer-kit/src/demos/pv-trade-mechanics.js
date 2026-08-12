registerDemo("pv-trade-mechanics", ({ root, copy, motion, tokens, announce }) => {
  root.innerHTML = `
    <style>
      .pv-trade { display:grid; gap:1rem; min-height:22rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink}; background:${tokens.surface}; }
      .pv-trade-tape { display:grid; grid-template-columns:repeat(5,1fr); gap:.5rem; align-items:end; min-height:12rem; padding:1rem; border:1px solid ${tokens.line}; border-radius:1rem; background:color-mix(in srgb,${tokens.paper} 42%,${tokens.surface}); }
      .pv-trade-print { display:grid; align-content:end; gap:.35rem; height:100%; text-align:center; color:${tokens.muted}; font-size:.68rem; }
      .pv-trade-bar { min-height:1.4rem; height:var(--pv-height); border-radius:.5rem .5rem .15rem .15rem; background:repeating-linear-gradient(135deg,${tokens.warm} 0 8px,color-mix(in srgb,${tokens.warm} 60%,${tokens.surface}) 8px 16px); transform-origin:bottom; animation:pv-trade-rise .8s ease both; }
      .pv-trade-print b { color:${tokens.ocean}; font-size:.76rem; }
      .pv-trade-controls { display:flex; flex-wrap:wrap; gap:.6rem; }
      .pv-trade-controls button { flex:1 1 10rem; padding:.75rem; border:1px solid ${tokens.line}; border-radius:.75rem; color:${tokens.ink}; background:${tokens.surface}; font:inherit; font-weight:800; cursor:pointer; }
      .pv-trade-controls button[aria-pressed="true"] { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}; }
      .pv-trade-controls button:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .pv-trade-status { min-height:5rem; margin:0; padding:1rem; border-left:.3rem solid ${tokens.coral}; border-radius:.65rem; background:color-mix(in srgb,${tokens.paper} 42%,${tokens.surface}); color:${tokens.muted}; line-height:1.55; }
      .pv-trade-note { margin:0; color:${tokens.muted}; font-size:.75rem; text-align:center; }
      .pv-trade.is-paused .pv-trade-bar { animation-play-state:paused; }
      @keyframes pv-trade-rise { from { transform:scaleY(.08); opacity:.3; } }
      @media (max-width:420px) { .pv-trade-tape { gap:.25rem; padding:.65rem; } .pv-trade-print { font-size:.58rem; } }
    </style>
    <div class="pv-trade${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="pv-trade-tape" aria-label="${escapeHtml(copy.chartLabel)}"></div>
      <div class="pv-trade-controls" role="group" aria-label="${escapeHtml(copy.controlLabel)}">${copy.scenarios.map((item, index) => `<button type="button" data-pv-trade="${index}" aria-pressed="${index === 0}">${escapeHtml(item.label)}</button>`).join("")}</div>
      <p class="pv-trade-status" data-pv-status aria-live="polite"></p><p class="pv-trade-note">${escapeHtml(copy.syntheticNote)}</p>
    </div>`;
  const scene = root.querySelector(".pv-trade");
  const tape = root.querySelector(".pv-trade-tape");
  const status = root.querySelector(".pv-trade-status");
  const buttons = [...root.querySelectorAll("[data-pv-trade]")];
  const select = (index, speak = false) => {
    const item = copy.scenarios[index];
    tape.innerHTML = item.prints.map((value, printIndex) => `<div class="pv-trade-print"><b>${escapeHtml(item.prices[printIndex])}</b><div class="pv-trade-bar" style="--pv-height:${value}%"></div><span>${escapeHtml(String(value))} ${escapeHtml(copy.volumeUnit)}</span></div>`).join("");
    status.textContent = item.status;
    buttons.forEach((button, buttonIndex) => button.setAttribute("aria-pressed", String(buttonIndex === index)));
    if (speak) announce(item.status);
  };
  buttons.forEach((button) => button.addEventListener("click", () => select(Number(button.dataset.pvTrade), true)));
  select(0);
  return { pause:()=>scene.classList.add("is-paused"), resume:()=>scene.classList.remove("is-paused"), reset:()=>select(0), destroy:()=>{ root.innerHTML=""; } };
});