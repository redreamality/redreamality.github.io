registerDemo("overview", ({ root, copy, motion, tokens }) => {
  root.innerHTML = `
    <style>
      .overview-demo { position: relative; display: grid; place-items: center; min-height: 25rem; padding: 2rem; background: radial-gradient(circle, #e5f4f0, white 70%); }
      .loop { position: relative; width: min(82vw, 38rem); aspect-ratio: 16 / 9; }
      .ring { position: absolute; inset: 8% 14%; border: 3px dashed ${tokens.ocean}; border-radius: 50%; animation: spin 14s linear infinite; }
      .node { position: absolute; display: grid; place-items: center; width: 9.5rem; min-height: 5rem; padding: 1rem; border: 1px solid #d8ddd7; border-radius: 1.25rem; color: ${tokens.ink}; background: rgba(255,255,255,.94); box-shadow: 0 .8rem 2rem rgba(23,51,60,.1); font-weight: 850; text-align: center; }
      .node-energy { left: 0; bottom: 0; border-color: ${tokens.warm}; }
      .node-moisture { top: 0; left: 50%; transform: translateX(-50%); border-color: ${tokens.ocean}; }
      .node-storm { right: 0; bottom: 0; border-color: ${tokens.coral}; }
      .caption { position: absolute; right: 1rem; bottom: 1rem; left: 1rem; margin: 0; color: ${tokens.muted}; font-size: .8rem; text-align: center; }
      .is-paused .ring { animation-play-state: paused; }
      @keyframes spin { to { transform: rotate(360deg); } }
      @media (max-width: 560px) { .loop { min-height: 22rem; } .node { width: 7.5rem; font-size: .8rem; } }
    </style>
    <div class="overview-demo${motion ? "" : " is-paused"}" role="img" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="loop">
        <div class="ring" aria-hidden="true"></div>
        <div class="node node-energy">${escapeHtml(copy.energy)}</div>
        <div class="node node-moisture">${escapeHtml(copy.moisture)}</div>
        <div class="node node-storm">${escapeHtml(copy.storm)}</div>
      </div>
      <p class="caption">${escapeHtml(copy.caption)}</p>
    </div>`;
  const scene = root.querySelector(".overview-demo");
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => { scene.dataset.resetCount = String(Number(scene.dataset.resetCount || 0) + 1); },
    destroy: () => { root.innerHTML = ""; }
  };
});
