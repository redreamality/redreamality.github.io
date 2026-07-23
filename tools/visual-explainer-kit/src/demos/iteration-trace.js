registerDemo("iteration-trace", ({ root, copy, motion, tokens }) => {
  const phases = copy.phaseLabels.map((label, index) => `<li data-phase="${index}"><span>${String(index + 1).padStart(2, "0")}</span>${escapeHtml(label)}</li>`).join("");
  root.innerHTML = `
    <style>
      .trace-demo { display: grid; grid-template-rows: auto auto 1fr auto; gap: 1.15rem; min-height: 25rem; padding: clamp(1rem, 4vw, 2.5rem); color: ${tokens.ink}; background: ${tokens.surface}; }
      .trace-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .75rem; }
      .attempt { margin: 0; color: ${tokens.muted}; font-weight: 800; }
      .next { padding: .6rem .95rem; border: 1px solid ${tokens.ocean}; border-radius: 999px; color: ${tokens.surface}; background: ${tokens.ocean}; font: inherit; font-weight: 800; cursor: pointer; }
      .next:focus-visible { outline: 3px solid ${tokens.warm}; outline-offset: 3px; }
      .phases { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .65rem; margin: 0; padding: 0; list-style: none; }
      .phases li { display: grid; gap: .35rem; min-height: 5rem; place-content: center; padding: .75rem; border: 1px solid ${tokens.line}; border-radius: 1rem; color: ${tokens.muted}; background: color-mix(in srgb, ${tokens.paper} 32%, ${tokens.surface}); text-align: center; }
      .phases li span { font-size: .68rem; letter-spacing: .08em; }
      .phases li.is-active { color: ${tokens.surface}; border-color: ${tokens.ocean}; background: ${tokens.ocean}; animation: trace-pulse 1.4s ease-in-out infinite alternate; }
      .phases li.is-complete { color: ${tokens.ink}; border-color: color-mix(in srgb, ${tokens.ocean} 55%, ${tokens.line}); }
      .evidence { display: grid; grid-template-columns: minmax(0, .72fr) minmax(0, 1.28fr); gap: 1rem; align-items: stretch; }
      .change, .observation { padding: 1.15rem; border: 1px solid ${tokens.line}; border-radius: 1.1rem; background: color-mix(in srgb, ${tokens.paper} 35%, ${tokens.surface}); }
      .panel-label { margin: 0 0 .65rem; color: ${tokens.muted}; font-size: .7rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
      .change p:last-child, .observation p:last-child { margin: 0; line-height: 1.6; }
      .outcome { min-height: 1.8rem; margin: 0; color: ${tokens.muted}; font-weight: 800; text-align: center; }
      .is-paused .phases li.is-active { animation-play-state: paused; }
      @keyframes trace-pulse { to { box-shadow: 0 0 0 .45rem color-mix(in srgb, ${tokens.ocean} 18%, transparent); } }
      @media (max-width: 680px) { .phases { grid-template-columns: 1fr 1fr; } .evidence { grid-template-columns: 1fr; } }
    </style>
    <div class="trace-demo${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="trace-head"><p class="attempt"></p><button type="button" class="next">${escapeHtml(copy.nextButton)}</button></div>
      <ol class="phases">${phases}</ol>
      <div class="evidence">
        <div class="change"><p class="panel-label">${escapeHtml(copy.changeLabel)}</p><p data-change></p></div>
        <div class="observation"><p class="panel-label">${escapeHtml(copy.evidenceLabel)}</p><p data-evidence></p></div>
      </div>
      <p class="outcome" aria-live="polite"></p>
    </div>`;
  const scene = root.querySelector(".trace-demo");
  const attempt = root.querySelector(".attempt");
  const change = root.querySelector("[data-change]");
  const evidence = root.querySelector("[data-evidence]");
  const outcome = root.querySelector(".outcome");
  const phaseItems = [...root.querySelectorAll("[data-phase]")];
  let index = 0;
  const render = () => {
    const state = copy.states[index];
    attempt.textContent = copy.attemptLabel.replace("{attempt}", state.attempt);
    change.textContent = state.change;
    evidence.textContent = state.evidence;
    outcome.textContent = state.outcome;
    scene.dataset.state = String(index);
    phaseItems.forEach((item, itemIndex) => {
      item.classList.toggle("is-active", itemIndex === state.phase);
      item.classList.toggle("is-complete", itemIndex < state.phase);
    });
  };
  root.querySelector(".next").addEventListener("click", () => { index = (index + 1) % copy.states.length; render(); });
  render();
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => { index = 0; render(); },
    destroy: () => { root.innerHTML = ""; }
  };
});
