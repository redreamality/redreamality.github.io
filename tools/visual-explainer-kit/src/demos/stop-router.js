registerDemo("stop-router", ({ root, copy, tokens }) => {
  const scenarios = copy.scenarios.map((scenario, index) => `
    <button type="button" data-scenario="${index}" aria-pressed="${index === 0}">${escapeHtml(scenario.label)}</button>`).join("");
  const routes = copy.routes.map((route) => `
    <li data-route="${escapeHtml(route.id)}"><strong>${escapeHtml(route.label)}</strong><span>${escapeHtml(route.detail)}</span></li>`).join("");

  root.innerHTML = `
    <style>
      .stop-router-demo { display: grid; gap: 1.1rem; min-height: 25rem; padding: clamp(1rem, 4vw, 2.5rem); color: ${tokens.ink}; background: ${tokens.surface}; }
      .stop-router-label { margin: 0; color: ${tokens.muted}; font-size: .72rem; font-weight: 850; letter-spacing: .09em; text-align: center; text-transform: uppercase; }
      .stop-router-scenarios { display: flex; flex-wrap: wrap; justify-content: center; gap: .55rem; }
      .stop-router-scenarios button { padding: .52rem .8rem; border: 1px solid ${tokens.line}; border-radius: 999px; color: ${tokens.ink}; background: ${tokens.surface}; font: inherit; font-size: .8rem; font-weight: 850; cursor: pointer; }
      .stop-router-scenarios button[aria-pressed="true"] { color: ${tokens.surface}; border-color: ${tokens.ocean}; background: ${tokens.ocean}; }
      .stop-router-scenarios button:focus-visible { outline: 3px solid ${tokens.warm}; outline-offset: 3px; }
      .stop-router-observation { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); gap: 1rem; align-items: center; }
      .stop-router-panel { min-height: 9rem; padding: 1.15rem; border: 1px solid ${tokens.line}; border-radius: 1.1rem; background: color-mix(in srgb, ${tokens.paper} 34%, ${tokens.surface}); }
      .stop-router-panel strong { display: block; margin-bottom: .65rem; color: ${tokens.muted}; font-size: .7rem; letter-spacing: .08em; text-transform: uppercase; }
      .stop-router-panel p { margin: 0; line-height: 1.6; }
      .stop-router-arrow { color: ${tokens.ocean}; font-size: 2rem; }
      .stop-router-routes { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: .55rem; margin: 0; padding: 0; list-style: none; }
      .stop-router-routes li { min-height: 6.5rem; padding: .8rem; border: 1px solid ${tokens.line}; border-radius: .9rem; background: color-mix(in srgb, ${tokens.paper} 30%, ${tokens.surface}); text-align: center; }
      .stop-router-routes strong, .stop-router-routes span { display: block; }
      .stop-router-routes span { margin-top: .35rem; color: ${tokens.muted}; font-size: .72rem; line-height: 1.4; }
      .stop-router-routes li.is-active { color: ${tokens.surface}; border-color: ${tokens.ocean}; background: ${tokens.ocean}; }
      .stop-router-routes li.is-active span { color: inherit; opacity: .82; }
      .stop-router-status { min-height: 1.8rem; margin: 0; color: ${tokens.muted}; font-weight: 850; text-align: center; }
      @media (max-width: 760px) { .stop-router-observation { grid-template-columns: 1fr; } .stop-router-arrow { rotate: 90deg; text-align: center; } .stop-router-routes { grid-template-columns: 1fr 1fr; } }
      @media (max-width: 480px) { .stop-router-routes { grid-template-columns: 1fr; } }
    </style>
    <div class="stop-router-demo" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <p class="stop-router-label">${escapeHtml(copy.scenarioLabel)}</p>
      <div class="stop-router-scenarios">${scenarios}</div>
      <div class="stop-router-observation">
        <div class="stop-router-panel"><strong>${escapeHtml(copy.evidenceLabel)}</strong><p data-evidence></p></div>
        <span class="stop-router-arrow" aria-hidden="true">→</span>
        <div class="stop-router-panel"><strong>${escapeHtml(copy.controllerLabel)}</strong><p data-decision></p></div>
      </div>
      <ul class="stop-router-routes">${routes}</ul>
      <p class="stop-router-status" aria-live="polite"></p>
    </div>`;

  const scene = root.querySelector(".stop-router-demo");
  const evidence = root.querySelector("[data-evidence]");
  const decision = root.querySelector("[data-decision]");
  const status = root.querySelector(".stop-router-status");
  const buttons = [...root.querySelectorAll("[data-scenario]")];
  const routeItems = [...root.querySelectorAll("[data-route]")];
  const select = (index) => {
    const scenario = copy.scenarios[index];
    scene.dataset.scenario = scenario.id;
    scene.dataset.route = scenario.route;
    evidence.textContent = scenario.evidence;
    decision.textContent = scenario.decision;
    status.textContent = scenario.status;
    buttons.forEach((button, buttonIndex) => button.setAttribute("aria-pressed", String(buttonIndex === index)));
    routeItems.forEach((item) => item.classList.toggle("is-active", item.dataset.route === scenario.route));
  };
  buttons.forEach((button) => button.addEventListener("click", () => select(Number(button.dataset.scenario))));
  select(0);

  return {
    pause: () => {},
    resume: () => {},
    reset: () => select(0),
    destroy: () => { root.innerHTML = ""; }
  };
});
