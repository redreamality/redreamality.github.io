registerDemo("state-ledger", ({ root, copy, motion, tokens }) => {
  root.innerHTML = `
    <style>
      .ledger-demo { display: grid; grid-template-rows: auto 1fr auto; gap: 1.15rem; min-height: 25rem; padding: clamp(1rem, 4vw, 2.5rem); color: ${tokens.ink}; background: ${tokens.surface}; }
      .ledger-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .75rem; }
      .attempt { margin: 0; color: ${tokens.muted}; font-weight: 800; }
      .next { padding: .6rem .95rem; border: 1px solid ${tokens.ocean}; border-radius: 999px; color: ${tokens.surface}; background: ${tokens.ocean}; font: inherit; font-weight: 800; cursor: pointer; }
      .next:focus-visible { outline: 3px solid ${tokens.warm}; outline-offset: 3px; }
      .state-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
      .state-panel { min-height: 14rem; padding: 1.2rem; border: 1px solid ${tokens.line}; border-radius: 1.2rem; background: color-mix(in srgb, ${tokens.paper} 35%, ${tokens.surface}); }
      .panel-label { margin: 0 0 .85rem; color: ${tokens.muted}; font-size: .72rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
      .transient { display: grid; min-height: 9rem; place-content: center; padding: 1rem; border: 1px dashed ${tokens.line}; border-radius: 1rem; color: ${tokens.muted}; line-height: 1.55; text-align: center; animation: context-fade 2.8s ease-in-out infinite alternate; }
      .ledger { display: grid; gap: .6rem; margin: 0; padding: 0; list-style: none; }
      .ledger li { display: grid; grid-template-columns: 1.2rem 1fr; gap: .55rem; align-items: start; padding: .65rem .75rem; border: 1px solid ${tokens.line}; border-radius: .85rem; background: ${tokens.surface}; }
      .ledger li::before { color: ${tokens.ocean}; content: "◆"; font-size: .72rem; }
      .caption { min-height: 1.8rem; margin: 0; color: ${tokens.muted}; font-weight: 800; text-align: center; }
      .is-paused .transient { animation-play-state: paused; }
      @keyframes context-fade { to { opacity: .38; } }
      @media (max-width: 680px) { .state-columns { grid-template-columns: 1fr; } }
    </style>
    <div class="ledger-demo${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="ledger-head"><p class="attempt"></p><button type="button" class="next">${escapeHtml(copy.nextButton)}</button></div>
      <div class="state-columns">
        <section class="state-panel" aria-labelledby="transient-label"><p class="panel-label" id="transient-label">${escapeHtml(copy.transientLabel)}</p><div class="transient"></div></section>
        <section class="state-panel" aria-labelledby="durable-label"><p class="panel-label" id="durable-label">${escapeHtml(copy.durableLabel)}</p><ul class="ledger"></ul></section>
      </div>
      <p class="caption" aria-live="polite"></p>
    </div>`;
  const scene = root.querySelector(".ledger-demo");
  const attempt = root.querySelector(".attempt");
  const transient = root.querySelector(".transient");
  const ledger = root.querySelector(".ledger");
  const caption = root.querySelector(".caption");
  let index = 0;
  const render = () => {
    const state = copy.attempts[index];
    attempt.textContent = copy.attemptLabel.replace("{attempt}", state.attempt);
    transient.textContent = state.transient;
    ledger.innerHTML = state.durable.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    caption.textContent = state.caption;
    scene.dataset.attempt = state.attempt;
  };
  root.querySelector(".next").addEventListener("click", () => { index = (index + 1) % copy.attempts.length; render(); });
  render();
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => { index = 0; render(); },
    destroy: () => { root.innerHTML = ""; }
  };
});
