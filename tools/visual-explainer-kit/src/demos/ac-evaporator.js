registerDemo("ac-evaporator", ({ root, copy, motion, tokens }) => {
  const bubbles = Array.from({ length: 10 }, (_, index) => `<span style="--ac-bubble-index:${index}"></span>`).join("");
  root.innerHTML = `
    <style>
      .ac-evaporator-demo { --ac-load: .6; display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(15rem, .8fr); gap: 1.5rem; align-items: center; min-height: 26rem; padding: clamp(1rem, 4vw, 2.5rem); color: ${tokens.ink}; background: linear-gradient(145deg, color-mix(in srgb, ${tokens.warm} 10%, ${tokens.surface}), ${tokens.surface} 52%, color-mix(in srgb, ${tokens.ocean} 12%, ${tokens.surface})); }
      .ac-evaporator-room { position: relative; min-height: 19rem; overflow: hidden; border: 1px solid ${tokens.line}; border-radius: 1.35rem; background: color-mix(in srgb, ${tokens.paper} 35%, ${tokens.surface}); }
      .ac-evaporator-room-label { position: absolute; top: 1rem; left: 1rem; margin: 0; color: ${tokens.muted}; font-size: .72rem; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; }
      .ac-evaporator-air { position: absolute; display: grid; gap: .2rem; align-items: center; color: ${tokens.muted}; font-size: .72rem; font-weight: 800; text-align: center; }
      .ac-evaporator-air::before { display: block; font-size: 2.5rem; line-height: 1; content: "→"; }
      .ac-evaporator-air-warm { top: 40%; left: 4%; color: ${tokens.coral}; }
      .ac-evaporator-air-cool { top: 40%; right: 4%; color: ${tokens.ocean}; opacity: calc(.45 + var(--ac-load) * .55); }
      .ac-evaporator-coil { position: absolute; top: 20%; bottom: 18%; left: 50%; width: 7.5rem; transform: translateX(-50%); }
      .ac-evaporator-coil-line { position: absolute; inset: 0; border: .75rem solid color-mix(in srgb, ${tokens.ocean} 72%, ${tokens.surface}); border-right-width: 1.2rem; border-left-width: 1.2rem; border-radius: 2.2rem; box-shadow: inset 0 0 0 .2rem ${tokens.surface}, 0 0 2rem color-mix(in srgb, ${tokens.ocean} 20%, transparent); }
      .ac-evaporator-bubbles { position: absolute; inset: .9rem 1.25rem; overflow: hidden; border-radius: 1rem; }
      .ac-evaporator-bubbles span { position: absolute; bottom: -1rem; left: calc(8% + var(--ac-bubble-index) * 9%); width: calc(.35rem + var(--ac-load) * .45rem); aspect-ratio: 1; border: 2px solid ${tokens.surface}; border-radius: 50%; opacity: calc(.25 + var(--ac-load) * .65); animation: ac-evaporator-boil calc(2.8s - var(--ac-load) * 1.2s) linear infinite; animation-delay: calc(var(--ac-bubble-index) * -.23s); }
      .ac-evaporator-refrigerant-label { position: absolute; right: 1rem; bottom: 1rem; left: 1rem; display: flex; justify-content: space-between; gap: 1rem; color: ${tokens.muted}; font-size: .68rem; font-weight: 800; }
      .ac-evaporator-panel { display: grid; gap: .9rem; padding: 1.15rem; border: 1px solid ${tokens.line}; border-radius: 1.2rem; background: color-mix(in srgb, ${tokens.surface} 92%, transparent); }
      .ac-evaporator-panel label { font-weight: 850; }
      .ac-evaporator-panel input { width: 100%; accent-color: ${tokens.ocean}; }
      .ac-evaporator-range-labels { display: flex; justify-content: space-between; color: ${tokens.muted}; font-size: .72rem; }
      .ac-evaporator-readouts { display: grid; grid-template-columns: 1fr 1fr; gap: .65rem; }
      .ac-evaporator-readout { padding: .75rem; border: 1px solid ${tokens.line}; border-radius: .9rem; background: color-mix(in srgb, ${tokens.paper} 35%, ${tokens.surface}); }
      .ac-evaporator-readout small { display: block; margin-bottom: .3rem; color: ${tokens.muted}; font-size: .67rem; }
      .ac-evaporator-readout output { font-size: 1.25rem; font-weight: 900; }
      .ac-evaporator-message { min-height: 3.5rem; margin: 0; color: ${tokens.ink}; line-height: 1.55; }
      .ac-evaporator-caption { margin: 0; color: ${tokens.muted}; font-size: .76rem; line-height: 1.5; }
      .ac-evaporator-demo.is-paused .ac-evaporator-bubbles span { animation-play-state: paused; }
      @keyframes ac-evaporator-boil { from { transform: translateY(0) scale(.7); } to { transform: translateY(-12rem) scale(1.2); } }
      @media (max-width: 700px) { .ac-evaporator-demo { grid-template-columns: 1fr; } .ac-evaporator-room { min-height: 18rem; } .ac-evaporator-air::before { font-size: 1.8rem; } }
    </style>
    <div class="ac-evaporator-demo${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="ac-evaporator-room" aria-hidden="true">
        <p class="ac-evaporator-room-label">${escapeHtml(copy.roomLabel)}</p>
        <div class="ac-evaporator-air ac-evaporator-air-warm">${escapeHtml(copy.airBefore)}</div>
        <div class="ac-evaporator-coil"><div class="ac-evaporator-coil-line"></div><div class="ac-evaporator-bubbles">${bubbles}</div></div>
        <div class="ac-evaporator-air ac-evaporator-air-cool">${escapeHtml(copy.airAfter)}</div>
        <div class="ac-evaporator-refrigerant-label"><span>${escapeHtml(copy.refrigerantIn)}</span><span>${escapeHtml(copy.refrigerantOut)}</span></div>
      </div>
      <div class="ac-evaporator-panel">
        <label for="ac-evaporator-load">${escapeHtml(copy.controlLabel)}</label>
        <input id="ac-evaporator-load" type="range" min="0" max="100" value="60" aria-label="${escapeHtml(copy.controlLabel)}">
        <div class="ac-evaporator-range-labels"><span>${escapeHtml(copy.lowLabel)}</span><span>${escapeHtml(copy.highLabel)}</span></div>
        <div class="ac-evaporator-readouts">
          <div class="ac-evaporator-readout"><small>${escapeHtml(copy.loadLabel)}</small><output data-ac-load></output></div>
          <div class="ac-evaporator-readout"><small>${escapeHtml(copy.supplyLabel)}</small><output data-ac-supply></output></div>
        </div>
        <p class="ac-evaporator-message" aria-live="polite"></p>
        <p class="ac-evaporator-caption">${escapeHtml(copy.caption)}</p>
      </div>
    </div>`;

  const scene = root.querySelector(".ac-evaporator-demo");
  const range = root.querySelector("#ac-evaporator-load");
  const loadOutput = root.querySelector("[data-ac-load]");
  const supplyOutput = root.querySelector("[data-ac-supply]");
  const message = root.querySelector(".ac-evaporator-message");
  const update = () => {
    const value = Number(range.value);
    const supplyTemperature = 24 - Math.round(value * .08);
    scene.style.setProperty("--ac-load", String(value / 100));
    scene.dataset.load = String(value);
    loadOutput.textContent = `${value}${copy.loadUnit}`;
    supplyOutput.textContent = `${supplyTemperature}${copy.temperatureUnit}`;
    message.textContent = value < 34 ? copy.statusLow : value < 68 ? copy.statusMedium : copy.statusHigh;
  };
  range.addEventListener("input", update);
  update();

  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => { range.value = "60"; update(); },
    destroy: () => { root.innerHTML = ""; }
  };
});
