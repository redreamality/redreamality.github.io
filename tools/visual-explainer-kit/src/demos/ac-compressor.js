registerDemo("ac-compressor", ({ root, copy, motion, tokens }) => {
  const molecules = Array.from({ length: 20 }, (_, index) => `<span style="--ac-molecule-index:${index}"></span>`).join("");
  root.innerHTML = `
    <style>
      .ac-compressor-demo { --ac-compression: .5; display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(15rem, .85fr); gap: 1.5rem; align-items: center; min-height: 26rem; padding: clamp(1rem, 4vw, 2.5rem); color: ${tokens.ink}; background: linear-gradient(145deg, color-mix(in srgb, ${tokens.ocean} 10%, ${tokens.surface}), ${tokens.surface} 46%, color-mix(in srgb, ${tokens.coral} 12%, ${tokens.surface})); }
      .ac-compressor-machine { position: relative; min-height: 18rem; overflow: hidden; border: 1px solid ${tokens.line}; border-radius: 1.35rem; background: color-mix(in srgb, ${tokens.paper} 30%, ${tokens.surface}); }
      .ac-compressor-label { position: absolute; top: 1rem; left: 1rem; margin: 0; color: ${tokens.muted}; font-size: .72rem; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; }
      .ac-compressor-cylinder { position: absolute; inset: 25% 8% 20%; overflow: hidden; border: .4rem solid ${tokens.ink}; border-radius: 1.2rem; background: color-mix(in srgb, ${tokens.coral} calc(8% + var(--ac-compression) * 17%), ${tokens.surface}); box-shadow: inset 0 0 2.4rem color-mix(in srgb, ${tokens.coral} calc(var(--ac-compression) * 22%), transparent); transition: background .2s ease, box-shadow .2s ease; }
      .ac-compressor-piston { position: absolute; z-index: 2; top: 0; bottom: 0; left: calc(7% + var(--ac-compression) * 34%); width: 1.1rem; background: ${tokens.ink}; box-shadow: -.5rem 0 0 color-mix(in srgb, ${tokens.ink} 35%, ${tokens.surface}); transition: left .2s ease; }
      .ac-compressor-gas { position: absolute; top: .8rem; right: .8rem; bottom: .8rem; left: calc(12% + var(--ac-compression) * 34%); display: grid; grid-template-columns: repeat(5, 1fr); gap: .35rem; align-content: space-around; padding: .5rem; transition: left .2s ease; }
      .ac-compressor-gas span { width: .55rem; aspect-ratio: 1; border-radius: 50%; background: ${tokens.coral}; box-shadow: 0 0 .8rem color-mix(in srgb, ${tokens.coral} 60%, transparent); animation: ac-compressor-jitter calc(1s - var(--ac-compression) * .45s) ease-in-out infinite alternate; animation-delay: calc(var(--ac-molecule-index) * -.04s); }
      .ac-compressor-flow-labels { position: absolute; right: 9%; bottom: 9%; left: 9%; display: flex; justify-content: space-between; gap: 1rem; color: ${tokens.muted}; font-size: .7rem; font-weight: 800; }
      .ac-compressor-flow-labels span:last-child { color: ${tokens.coral}; text-align: right; }
      .ac-compressor-panel { display: grid; gap: .9rem; padding: 1.15rem; border: 1px solid ${tokens.line}; border-radius: 1.2rem; background: color-mix(in srgb, ${tokens.surface} 92%, transparent); }
      .ac-compressor-panel label { font-weight: 850; }
      .ac-compressor-panel input { width: 100%; accent-color: ${tokens.coral}; }
      .ac-compressor-range-labels { display: flex; justify-content: space-between; color: ${tokens.muted}; font-size: .72rem; }
      .ac-compressor-readouts { display: grid; grid-template-columns: 1fr 1fr; gap: .65rem; }
      .ac-compressor-readout { padding: .75rem; border: 1px solid ${tokens.line}; border-radius: .9rem; background: color-mix(in srgb, ${tokens.paper} 35%, ${tokens.surface}); }
      .ac-compressor-readout small { display: block; margin-bottom: .3rem; color: ${tokens.muted}; font-size: .67rem; }
      .ac-compressor-readout output { color: ${tokens.coral}; font-size: 1.25rem; font-weight: 900; }
      .ac-compressor-message { min-height: 3.5rem; margin: 0; color: ${tokens.ink}; line-height: 1.55; }
      .ac-compressor-caption { margin: 0; color: ${tokens.muted}; font-size: .76rem; line-height: 1.5; }
      .ac-compressor-demo.is-paused .ac-compressor-gas span { animation-play-state: paused; }
      @keyframes ac-compressor-jitter { from { transform: translate(-2px, -2px); } to { transform: translate(3px, 2px); } }
      @media (max-width: 700px) { .ac-compressor-demo { grid-template-columns: 1fr; } .ac-compressor-machine { min-height: 17rem; } }
    </style>
    <div class="ac-compressor-demo${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="ac-compressor-machine" aria-hidden="true">
        <p class="ac-compressor-label">${escapeHtml(copy.machineLabel)}</p>
        <div class="ac-compressor-cylinder"><div class="ac-compressor-piston"></div><div class="ac-compressor-gas">${molecules}</div></div>
        <div class="ac-compressor-flow-labels"><span>${escapeHtml(copy.inletLabel)}</span><span>${escapeHtml(copy.outletLabel)}</span></div>
      </div>
      <div class="ac-compressor-panel">
        <label for="ac-compressor-level">${escapeHtml(copy.controlLabel)}</label>
        <input id="ac-compressor-level" type="range" min="1" max="5" value="3" aria-label="${escapeHtml(copy.controlLabel)}">
        <div class="ac-compressor-range-labels"><span>${escapeHtml(copy.lowLabel)}</span><span>${escapeHtml(copy.highLabel)}</span></div>
        <div class="ac-compressor-readouts">
          <div class="ac-compressor-readout"><small>${escapeHtml(copy.pressureLabel)}</small><output data-ac-pressure></output></div>
          <div class="ac-compressor-readout"><small>${escapeHtml(copy.temperatureLabel)}</small><output data-ac-temperature></output></div>
        </div>
        <p class="ac-compressor-message" aria-live="polite"></p>
        <p class="ac-compressor-caption">${escapeHtml(copy.caption)}</p>
      </div>
    </div>`;

  const scene = root.querySelector(".ac-compressor-demo");
  const range = root.querySelector("#ac-compressor-level");
  const pressureOutput = root.querySelector("[data-ac-pressure]");
  const temperatureOutput = root.querySelector("[data-ac-temperature]");
  const message = root.querySelector(".ac-compressor-message");
  const update = () => {
    const level = Number(range.value);
    const pressure = (1 + level * .8).toFixed(1);
    const temperature = 35 + level * 14;
    scene.style.setProperty("--ac-compression", String((level - 1) / 4));
    scene.dataset.compression = String(level);
    pressureOutput.textContent = `${pressure}${copy.pressureUnit}`;
    temperatureOutput.textContent = `${temperature}${copy.temperatureUnit}`;
    message.textContent = level < 3 ? copy.statusLow : level === 3 ? copy.statusMedium : copy.statusHigh;
  };
  range.addEventListener("input", update);
  update();

  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => { range.value = "3"; update(); },
    destroy: () => { root.innerHTML = ""; }
  };
});
