registerDemo("ac-energy-ledger", ({ root, copy, tokens }) => {
  root.innerHTML = `
    <style>
      .ac-ledger-demo { display: grid; grid-template-columns: minmax(0, 1fr) minmax(16rem, .9fr); gap: 1.5rem; align-items: center; min-height: 26rem; padding: clamp(1rem, 4vw, 2.5rem); color: ${tokens.ink}; background: linear-gradient(145deg, color-mix(in srgb, ${tokens.ocean} 10%, ${tokens.surface}), ${tokens.surface} 52%, color-mix(in srgb, ${tokens.warm} 12%, ${tokens.surface})); }
      .ac-ledger-chart { display: grid; gap: 1rem; min-height: 19rem; align-content: center; padding: clamp(1rem, 4vw, 2rem); border: 1px solid ${tokens.line}; border-radius: 1.35rem; background: color-mix(in srgb, ${tokens.paper} 30%, ${tokens.surface}); }
      .ac-ledger-equation { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: .5rem; margin: 0 0 .5rem; font-weight: 900; text-align: center; }
      .ac-ledger-equation span { padding: .5rem .7rem; border-radius: .75rem; background: ${tokens.surface}; }
      .ac-ledger-equation b { color: ${tokens.coral}; font-size: 1.3rem; }
      .ac-ledger-row { display: grid; grid-template-columns: 8rem minmax(0, 1fr) 4rem; gap: .65rem; align-items: center; }
      .ac-ledger-row-label { color: ${tokens.muted}; font-size: .75rem; font-weight: 850; }
      .ac-ledger-track { height: 1.15rem; overflow: hidden; border-radius: 999px; background: color-mix(in srgb, ${tokens.line} 70%, ${tokens.surface}); }
      .ac-ledger-fill { display: block; width: 0; height: 100%; border-radius: inherit; transition: width .2s ease; }
      .ac-ledger-fill-work { background: ${tokens.coral}; }
      .ac-ledger-fill-room { background: ${tokens.ocean}; }
      .ac-ledger-fill-outdoor { background: ${tokens.warm}; }
      .ac-ledger-value { font-size: .78rem; font-weight: 900; text-align: right; }
      .ac-ledger-panel { display: grid; gap: .9rem; padding: 1.15rem; border: 1px solid ${tokens.line}; border-radius: 1.2rem; background: color-mix(in srgb, ${tokens.surface} 92%, transparent); }
      .ac-ledger-panel label { font-weight: 850; }
      .ac-ledger-panel input { width: 100%; accent-color: ${tokens.coral}; }
      .ac-ledger-range-labels { display: flex; justify-content: space-between; color: ${tokens.muted}; font-size: .72rem; }
      .ac-ledger-cop { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .8rem; border: 1px solid ${tokens.line}; border-radius: .9rem; background: color-mix(in srgb, ${tokens.paper} 35%, ${tokens.surface}); }
      .ac-ledger-cop strong { color: ${tokens.ocean}; font-size: 1.3rem; }
      .ac-ledger-message { min-height: 4.8rem; margin: 0; color: ${tokens.ink}; line-height: 1.55; }
      .ac-ledger-caption { margin: 0; color: ${tokens.muted}; font-size: .76rem; line-height: 1.5; }
      @media (max-width: 700px) { .ac-ledger-demo { grid-template-columns: 1fr; } .ac-ledger-row { grid-template-columns: 6.5rem minmax(0, 1fr) 3.5rem; } }
    </style>
    <div class="ac-ledger-demo" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="ac-ledger-chart">
        <p class="ac-ledger-equation"><span>${escapeHtml(copy.roomHeatShort)}</span><b>+</b><span>${escapeHtml(copy.workShort)}</span><b>=</b><span>${escapeHtml(copy.outdoorHeatShort)}</span></p>
        <div class="ac-ledger-row"><span class="ac-ledger-row-label">${escapeHtml(copy.workLabel)}</span><span class="ac-ledger-track"><span class="ac-ledger-fill ac-ledger-fill-work"></span></span><output class="ac-ledger-value" data-ac-work></output></div>
        <div class="ac-ledger-row"><span class="ac-ledger-row-label">${escapeHtml(copy.roomHeatLabel)}</span><span class="ac-ledger-track"><span class="ac-ledger-fill ac-ledger-fill-room"></span></span><output class="ac-ledger-value" data-ac-room></output></div>
        <div class="ac-ledger-row"><span class="ac-ledger-row-label">${escapeHtml(copy.outdoorHeatLabel)}</span><span class="ac-ledger-track"><span class="ac-ledger-fill ac-ledger-fill-outdoor"></span></span><output class="ac-ledger-value" data-ac-outdoor></output></div>
      </div>
      <div class="ac-ledger-panel">
        <label for="ac-ledger-power">${escapeHtml(copy.controlLabel)}</label>
        <input id="ac-ledger-power" type="range" min="5" max="20" step="5" value="10" aria-label="${escapeHtml(copy.controlLabel)}">
        <div class="ac-ledger-range-labels"><span>${escapeHtml(copy.lowLabel)}</span><span>${escapeHtml(copy.highLabel)}</span></div>
        <div class="ac-ledger-cop"><span>${escapeHtml(copy.copLabel)}</span><strong>${escapeHtml(copy.copValue)}</strong></div>
        <p class="ac-ledger-message" aria-live="polite"></p>
        <p class="ac-ledger-caption">${escapeHtml(copy.caption)}</p>
      </div>
    </div>`;

  const scene = root.querySelector(".ac-ledger-demo");
  const range = root.querySelector("#ac-ledger-power");
  const workFill = root.querySelector(".ac-ledger-fill-work");
  const roomFill = root.querySelector(".ac-ledger-fill-room");
  const outdoorFill = root.querySelector(".ac-ledger-fill-outdoor");
  const workOutput = root.querySelector("[data-ac-work]");
  const roomOutput = root.querySelector("[data-ac-room]");
  const outdoorOutput = root.querySelector("[data-ac-outdoor]");
  const message = root.querySelector(".ac-ledger-message");
  const format = (value) => `${value.toFixed(1)} ${copy.powerUnit}`;
  const update = () => {
    const work = Number(range.value) / 10;
    const roomHeat = work * 3;
    const outdoorHeat = roomHeat + work;
    scene.dataset.power = String(work);
    workFill.style.width = `${work / 2 * 25}%`;
    roomFill.style.width = `${roomHeat / 6 * 75}%`;
    outdoorFill.style.width = `${outdoorHeat / 8 * 100}%`;
    workOutput.textContent = format(work);
    roomOutput.textContent = format(roomHeat);
    outdoorOutput.textContent = format(outdoorHeat);
    message.textContent = copy.statusTemplate
      .replace("{room}", format(roomHeat))
      .replace("{work}", format(work))
      .replace("{outdoor}", format(outdoorHeat));
  };
  range.addEventListener("input", update);
  update();

  return {
    pause: () => {},
    resume: () => {},
    reset: () => { range.value = "10"; update(); },
    destroy: () => { root.innerHTML = ""; }
  };
});
