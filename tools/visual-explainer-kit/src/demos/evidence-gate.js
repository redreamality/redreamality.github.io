registerDemo("evidence-gate", ({ root, copy, tokens }) => {
  root.innerHTML = `
    <style>
      .evidence-demo { display: grid; gap: 1.25rem; min-height: 25rem; padding: clamp(1rem, 4vw, 2.5rem); color: ${tokens.ink}; background: ${tokens.surface}; }
      .control-group { display: grid; gap: .55rem; }
      .control-label { margin: 0; color: ${tokens.muted}; font-size: .72rem; font-weight: 800; letter-spacing: .08em; text-align: center; text-transform: uppercase; }
      .choice-row { display: flex; flex-wrap: wrap; justify-content: center; gap: .6rem; }
      .choice-row button { padding: .52rem .85rem; border: 1px solid ${tokens.line}; border-radius: 999px; color: ${tokens.ink}; background: ${tokens.surface}; font: inherit; font-weight: 800; cursor: pointer; }
      .choice-row button[aria-pressed="true"] { color: ${tokens.surface}; border-color: ${tokens.ocean}; background: ${tokens.ocean}; }
      .choice-row button:focus-visible { outline: 3px solid ${tokens.warm}; outline-offset: 3px; }
      .routing { display: grid; grid-template-columns: minmax(0, 1fr) auto repeat(3, minmax(0, .75fr)); gap: .75rem; align-items: center; }
      .verdict, .route { display: grid; min-height: 8rem; place-content: center; padding: 1rem; border: 1px solid ${tokens.line}; border-radius: 1.15rem; background: color-mix(in srgb, ${tokens.paper} 35%, ${tokens.surface}); text-align: center; }
      .verdict strong, .route strong { display: block; margin-bottom: .35rem; }
      .verdict span, .route span { color: ${tokens.muted}; font-size: .78rem; line-height: 1.45; }
      .routing-arrow { color: ${tokens.ocean}; font-size: 2rem; }
      .route.is-active { color: ${tokens.surface}; border-color: ${tokens.ocean}; background: ${tokens.ocean}; }
      .route.is-active span { color: inherit; opacity: .82; }
      .evidence-status { min-height: 2.4rem; margin: 0; color: ${tokens.muted}; font-weight: 800; line-height: 1.5; text-align: center; }
      @media (max-width: 760px) { .routing { grid-template-columns: 1fr; } .routing-arrow { rotate: 90deg; text-align: center; } .verdict, .route { min-height: 5.5rem; } }
    </style>
    <div class="evidence-demo" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="control-group"><p class="control-label">${escapeHtml(copy.verifierLabel)}</p><div class="choice-row">
        <button type="button" data-verifier="self" aria-pressed="true">${escapeHtml(copy.selfButton)}</button>
        <button type="button" data-verifier="independent" aria-pressed="false">${escapeHtml(copy.independentButton)}</button>
      </div></div>
      <div class="control-group"><p class="control-label">${escapeHtml(copy.resultLabel)}</p><div class="choice-row">
        <button type="button" data-result="fail" aria-pressed="true">${escapeHtml(copy.failButton)}</button>
        <button type="button" data-result="pass" aria-pressed="false">${escapeHtml(copy.passButton)}</button>
        <button type="button" data-result="uncertain" aria-pressed="false">${escapeHtml(copy.uncertainButton)}</button>
      </div></div>
      <div class="routing">
        <div class="verdict"><strong data-verdict-title></strong><span data-verdict-detail></span></div><span class="routing-arrow" aria-hidden="true">→</span>
        <div class="route" data-route="retry"><strong>${escapeHtml(copy.retryTitle)}</strong><span>${escapeHtml(copy.retryDetail)}</span></div>
        <div class="route" data-route="stop"><strong>${escapeHtml(copy.stopTitle)}</strong><span>${escapeHtml(copy.stopDetail)}</span></div>
        <div class="route" data-route="escalate"><strong>${escapeHtml(copy.escalateTitle)}</strong><span>${escapeHtml(copy.escalateDetail)}</span></div>
      </div>
      <p class="evidence-status" aria-live="polite"></p>
    </div>`;
  const scene = root.querySelector(".evidence-demo");
  const status = root.querySelector(".evidence-status");
  const verdictTitle = root.querySelector("[data-verdict-title]");
  const verdictDetail = root.querySelector("[data-verdict-detail]");
  const verifierButtons = [...root.querySelectorAll("[data-verifier]")];
  const resultButtons = [...root.querySelectorAll("[data-result]")];
  const routes = [...root.querySelectorAll("[data-route]")];
  let verifier = "self";
  let result = "fail";
  const render = () => {
    const independent = verifier === "independent";
    const route = independent ? { fail: "retry", pass: "stop", uncertain: "escalate" }[result] : "stop";
    verdictTitle.textContent = independent ? copy.independentVerdict : copy.selfVerdict;
    verdictDetail.textContent = independent ? copy.independentDetail : copy.selfDetail;
    status.textContent = independent ? copy.statuses[result] : copy.selfStatus;
    scene.dataset.verifier = verifier;
    scene.dataset.result = result;
    scene.dataset.route = route;
    verifierButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.verifier === verifier)));
    resultButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.result === result)));
    routes.forEach((item) => item.classList.toggle("is-active", item.dataset.route === route));
  };
  verifierButtons.forEach((button) => button.addEventListener("click", () => { verifier = button.dataset.verifier; render(); }));
  resultButtons.forEach((button) => button.addEventListener("click", () => { result = button.dataset.result; render(); }));
  render();
  return {
    pause: () => {},
    resume: () => {},
    reset: () => { verifier = "self"; result = "fail"; render(); },
    destroy: () => { root.innerHTML = ""; }
  };
});
