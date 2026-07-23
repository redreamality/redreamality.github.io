registerDemo("outer-loop", ({ root, copy, motion, tokens }) => {
  const nodes = copy.nodes.map((node, index) => `
    <button type="button" class="loop-node" data-node="${index}" aria-pressed="${index === 0}">
      <span class="node-index">${String(index + 1).padStart(2, "0")}</span>
      <span>${escapeHtml(node.label)}</span>
    </button>`).join("");
  const guardrails = copy.guardrails.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  root.innerHTML = `
    <style>
      .outer-loop-demo { min-height: 25rem; padding: clamp(1rem, 4vw, 2.5rem); color: ${tokens.ink}; background: radial-gradient(circle at 50% 35%, color-mix(in srgb, ${tokens.ocean} 15%, ${tokens.surface}), ${tokens.surface} 58%); }
      .guardrail-label { margin: 0 0 .75rem; color: ${tokens.muted}; font-size: .75rem; font-weight: 800; letter-spacing: .08em; text-align: center; text-transform: uppercase; }
      .guardrails { display: flex; flex-wrap: wrap; justify-content: center; gap: .5rem; margin: 0 0 1.5rem; padding: 0; list-style: none; }
      .guardrails li { padding: .42rem .7rem; border: 1px solid ${tokens.line}; border-radius: 999px; color: ${tokens.muted}; background: color-mix(in srgb, ${tokens.surface} 86%, transparent); font-size: .74rem; font-weight: 800; }
      .loop-track { position: relative; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: .55rem; padding: 1.2rem; border: 1px solid ${tokens.line}; border-radius: 1.5rem; background: color-mix(in srgb, ${tokens.paper} 45%, ${tokens.surface}); }
      .loop-track::after { position: absolute; right: 7%; bottom: -.8rem; left: 7%; height: 1.6rem; border: 2px solid ${tokens.ocean}; border-top: 0; border-radius: 0 0 999px 999px; content: ""; opacity: .65; }
      .loop-node { position: relative; z-index: 1; display: grid; min-height: 6.7rem; place-content: center; gap: .45rem; padding: .8rem; border: 1px solid ${tokens.line}; border-radius: 1rem; color: ${tokens.ink}; background: ${tokens.surface}; font: inherit; font-weight: 800; text-align: center; cursor: pointer; }
      .loop-node[aria-pressed="true"] { color: ${tokens.surface}; border-color: ${tokens.ocean}; background: ${tokens.ocean}; }
      .loop-node:focus-visible { outline: 3px solid ${tokens.warm}; outline-offset: 3px; }
      .node-index { color: ${tokens.muted}; font-size: .68rem; letter-spacing: .08em; }
      .loop-node[aria-pressed="true"] .node-index { color: inherit; opacity: .78; }
      .pulse { position: absolute; z-index: 2; top: .72rem; left: .72rem; width: .7rem; height: .7rem; border-radius: 50%; background: ${tokens.warm}; box-shadow: 0 0 0 .45rem color-mix(in srgb, ${tokens.warm} 20%, transparent); animation: travel 7s ease-in-out infinite; pointer-events: none; }
      .detail { min-height: 3.2rem; margin: 2rem auto 0; max-width: 44rem; color: ${tokens.muted}; line-height: 1.6; text-align: center; }
      .is-paused .pulse { animation-play-state: paused; }
      @keyframes travel { 0%, 12% { left: 3%; } 22%, 34% { left: 23%; } 44%, 56% { left: 43%; } 66%, 78% { left: 63%; } 88%, 100% { left: 83%; } }
      @media (max-width: 720px) { .loop-track { grid-template-columns: 1fr; } .loop-track::after, .pulse { display: none; } .loop-node { min-height: 4.2rem; } }
    </style>
    <div class="outer-loop-demo${motion ? "" : " is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <p class="guardrail-label">${escapeHtml(copy.guardrailLabel)}</p>
      <ul class="guardrails">${guardrails}</ul>
      <div class="loop-track"><span class="pulse" aria-hidden="true"></span>${nodes}</div>
      <p class="detail" aria-live="polite"></p>
    </div>`;
  const scene = root.querySelector(".outer-loop-demo");
  const detail = root.querySelector(".detail");
  const buttons = [...root.querySelectorAll("[data-node]")];
  const select = (index) => {
    detail.textContent = copy.nodes[index].detail;
    scene.dataset.node = String(index);
    buttons.forEach((button, buttonIndex) => button.setAttribute("aria-pressed", String(buttonIndex === index)));
  };
  buttons.forEach((button) => button.addEventListener("click", () => select(Number(button.dataset.node))));
  select(0);
  return {
    pause: () => scene.classList.add("is-paused"),
    resume: () => scene.classList.remove("is-paused"),
    reset: () => select(0),
    destroy: () => { root.innerHTML = ""; }
  };
});
