registerDemo("energy", ({ root, copy, motion, tokens }) => {
  root.innerHTML = `
    <style>
      .energy-demo { display: grid; grid-template-columns: minmax(0, 1fr) minmax(14rem, 22rem); gap: 2rem; align-items: center; min-height: 25rem; padding: clamp(1.25rem, 5vw, 3rem); background: linear-gradient(160deg, #e8f5f2, white); }
      .ocean { position: relative; min-height: 16rem; overflow: hidden; border-radius: 1.5rem; background: linear-gradient(#cfeff0 0 42%, ${tokens.ocean} 43% 100%); }
      .sun { position: absolute; top: 1.5rem; left: 50%; width: 5rem; height: 5rem; border-radius: 50%; background: ${tokens.warm}; box-shadow: 0 0 0 1rem rgba(238,157,70,.14); animation: breathe 2.4s ease-in-out infinite alternate; }
      .meter { height: 1rem; overflow: hidden; border-radius: 99px; background: #d8ddd7; }
      .meter > span { display: block; width: 40%; height: 100%; background: linear-gradient(90deg, ${tokens.ocean}, ${tokens.warm}); transition: width .2s ease; }
      .control { display: grid; gap: .8rem; }
      .control label { font-weight: 850; }
      .range-labels { display: flex; justify-content: space-between; color: ${tokens.muted}; font-size: .78rem; }
      output { color: ${tokens.coral}; font-size: 1.7rem; font-weight: 900; }
      .caption { color: ${tokens.muted}; line-height: 1.6; }
      .is-paused .sun { animation-play-state: paused; }
      @keyframes breathe { to { transform: scale(1.1); box-shadow: 0 0 0 1.8rem rgba(238,157,70,.08); } }
      @media (max-width: 680px) { .energy-demo { grid-template-columns: 1fr; } .ocean { min-height: 13rem; } }
    </style>
    <div class="energy-demo${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="ocean" aria-hidden="true"><div class="sun"></div></div>
      <div class="control">
        <label for="energy-range">${escapeHtml(copy.controlLabel)}</label>
        <input id="energy-range" type="range" min="0" max="100" value="40" aria-label="${escapeHtml(copy.ariaLabel)}">
        <div class="range-labels"><span>${escapeHtml(copy.lowLabel)}</span><span>${escapeHtml(copy.highLabel)}</span></div>
        <div class="meter" aria-hidden="true"><span></span></div>
        <output data-energy-value>40 ${escapeHtml(copy.unit)}</output>
        <p class="caption">${escapeHtml(copy.caption)}</p>
      </div>
    </div>`;
  const scene = root.querySelector(".energy-demo");
  const range = root.querySelector("#energy-range");
  const fill = root.querySelector(".meter > span");
  const output = root.querySelector("[data-energy-value]");
  const update = () => {
    fill.style.width = `${range.value}%`;
    output.textContent = `${range.value} ${copy.unit}`;
    scene.dataset.value = range.value;
  };
  range.addEventListener("input", update);
  update();
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => { range.value = "40"; update(); },
    destroy: () => { root.innerHTML = ""; },
    resize: ({ width, height, dpr }) => {
      scene.dataset.runtimeSize = `${Math.round(width)}x${Math.round(height)}@${dpr}`;
    }
  };
});
