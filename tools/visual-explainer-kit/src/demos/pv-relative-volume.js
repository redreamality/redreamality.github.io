registerDemo("pv-relative-volume", ({ root, copy, tokens, announce }) => {
  root.innerHTML = `
    <style>
      .pv-relative { display:grid; gap:1rem; min-height:20rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink}; background:${tokens.surface}; }
      .pv-relative-chart { display:flex; gap:.45rem; align-items:end; min-height:11rem; padding:1rem; border:1px solid ${tokens.line}; border-radius:1rem; background:linear-gradient(to top,color-mix(in srgb,${tokens.ocean} 7%,${tokens.surface}),${tokens.surface}); }
      .pv-relative-column { flex:1; min-width:0; border-radius:.35rem .35rem .1rem .1rem; background:repeating-linear-gradient(135deg,${tokens.warm} 0 7px,color-mix(in srgb,${tokens.warm} 55%,${tokens.surface}) 7px 14px); }
      .pv-relative-column:last-child { background:${tokens.ocean}; }
      .pv-relative-periods { display:flex; flex-wrap:wrap; gap:.55rem; }
      .pv-relative-periods button { flex:1 1 8rem; padding:.7rem; border:1px solid ${tokens.line}; border-radius:.7rem; color:${tokens.ink}; background:${tokens.surface}; font:inherit; font-size:.76rem; font-weight:800; cursor:pointer; }
      .pv-relative-periods button[aria-pressed="true"] { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}; }
      .pv-relative-periods button:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .pv-relative-metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:.6rem; }
      .pv-relative-metric { padding:.75rem; border:1px solid ${tokens.line}; border-radius:.75rem; background:color-mix(in srgb,${tokens.paper} 45%,${tokens.surface}); text-align:center; }
      .pv-relative-metric strong { display:block; color:${tokens.ocean}; font-size:1.1rem; }
      .pv-relative-metric span { color:${tokens.muted}; font-size:.67rem; }
      .pv-relative-control label { display:flex; justify-content:space-between; gap:1rem; color:${tokens.muted}; font-size:.78rem; font-weight:750; }
      .pv-relative-control input { width:100%; accent-color:${tokens.ocean}; }
      .pv-relative-status { min-height:4rem; margin:0; color:${tokens.muted}; line-height:1.55; }
      .pv-relative-note { margin:0; color:${tokens.muted}; font-size:.74rem; text-align:center; }
      @media (max-width:440px) { .pv-relative-metrics { grid-template-columns:1fr; } }
    </style>
    <div class="pv-relative" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="pv-relative-chart" data-pv-relative-chart role="img"></div>
      <div class="pv-relative-periods" role="group" aria-label="${escapeHtml(copy.periodControlLabel)}">${copy.baselines.map((item,index)=>`<button type="button" data-pv-baseline="${item.key}" data-pv-baseline-index="${index}" aria-pressed="${index===0}">${escapeHtml(item.label)}</button>`).join("")}</div>
      <div class="pv-relative-control"><label for="pv-relative-input"><span>${escapeHtml(copy.controlLabel)}</span><output data-pv-output></output></label><input id="pv-relative-input" data-pv-relative-input type="range" min="30" max="180" value="100" aria-label="${escapeHtml(copy.controlAria)}"></div>
      <div class="pv-relative-metrics"><div class="pv-relative-metric"><strong data-pv-current></strong><span>${escapeHtml(copy.currentLabel)}</span></div><div class="pv-relative-metric"><strong data-pv-baseline-value></strong><span data-pv-baseline-label></span></div><div class="pv-relative-metric"><strong data-pv-ratio></strong><span>${escapeHtml(copy.ratioLabel)}</span></div></div>
      <p class="pv-relative-status" data-pv-status aria-live="polite"></p><p class="pv-relative-note">${escapeHtml(copy.syntheticNote)}</p>
    </div>`;
  const scene = root.querySelector(".pv-relative");
  const input = root.querySelector("input");
  const output = root.querySelector("output");
  const chart = root.querySelector(".pv-relative-chart");
  const current = root.querySelector("[data-pv-current]");
  const ratio = root.querySelector("[data-pv-ratio]");
  const baselineValue = root.querySelector("[data-pv-baseline-value]");
  const baselineLabel = root.querySelector("[data-pv-baseline-label]");
  const baselineButtons = [...root.querySelectorAll("[data-pv-baseline]")];
  const status = root.querySelector(".pv-relative-status");
  let activeBaseline = 0;
  const render = (speak = false) => {
    const value = Number(input.value);
    const baseline = copy.baselines[activeBaseline];
    const rvol = value / baseline.value;
    scene.dataset.period = baseline.key;
    scene.dataset.baseline = String(baseline.value);
    scene.dataset.current = String(value);
    scene.dataset.ratio = rvol.toFixed(2);
    output.textContent = `${value} ${copy.volumeUnit}`;
    current.textContent = `${value}`;
    baselineValue.textContent = `${baseline.value}`;
    baselineLabel.textContent = `${copy.baselineLabel} · ${baseline.label}`;
    ratio.textContent = `${rvol.toFixed(2)}×`;
    chart.setAttribute("aria-label", copy.chartAriaTemplate.replace("{period}",baseline.label).replace("{baseline}",String(baseline.value)).replace("{current}",String(value)).replace("{ratio}",rvol.toFixed(2)));
    chart.innerHTML = [...baseline.history, value].map((item) => `<span class="pv-relative-column" style="height:${Math.max(12,item / 1.8)}%"></span>`).join("");
    baselineButtons.forEach((button,index)=>button.setAttribute("aria-pressed",String(index===activeBaseline)));
    status.textContent = copy.statusTemplate.replace("{current}",String(value)).replace("{baseline}",String(baseline.value)).replace("{period}",baseline.label).replace("{ratio}",rvol.toFixed(2));
    if (speak) announce(status.textContent);
  };
  baselineButtons.forEach((button)=>button.addEventListener("click",()=>{activeBaseline=Number(button.dataset.pvBaselineIndex);render(true);}));
  input.addEventListener("input", () => render());
  input.addEventListener("change", () => render(true));
  render();
  return { reset:()=>{ activeBaseline=0; input.value="100"; render(); }, destroy:()=>{ root.innerHTML=""; } };
});