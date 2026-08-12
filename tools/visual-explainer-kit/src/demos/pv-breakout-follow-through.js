registerDemo("pv-breakout-follow-through", ({ root, copy, motion, tokens, announce }) => {
  root.innerHTML = `
    <style>
      .pv-breakout { display:grid; gap:1rem; min-height:23rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink}; background:${tokens.surface}; }
      .pv-breakout-path-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.75rem; }
      .pv-breakout-card { display:grid; gap:.45rem; min-width:0; padding:.65rem; border:1px solid ${tokens.line}; border-radius:1rem; background:color-mix(in srgb,${tokens.paper} 36%,${tokens.surface}); }
      .pv-breakout-card h3 { margin:0; font-size:.78rem; }
      .pv-breakout-state { color:${tokens.muted}; font-size:.68rem; font-weight:800; }
      .pv-breakout-chart { position:relative; min-height:12rem; overflow:hidden; border:1px solid ${tokens.line}; border-radius:.7rem; background:repeating-linear-gradient(to bottom,transparent 0 31px,color-mix(in srgb,${tokens.line} 55%,transparent) 31px 32px); }
      .pv-breakout-level { position:absolute; z-index:1; top:43%; left:0; right:0; border-top:2px dashed ${tokens.coral}; color:${tokens.coral}; font-size:.68rem; font-weight:800; text-align:right; }
      .pv-breakout-path { position:absolute; inset:12% 5%; width:90%; height:76%; fill:none; stroke:${tokens.ocean}; stroke-width:5; stroke-linecap:round; stroke-linejoin:round; stroke-dasharray:520; animation:pv-breakout-draw 1.8s ease both; }
      .pv-breakout-volume { position:absolute; inset:auto 5% 5%; display:flex; gap:.35rem; align-items:end; height:25%; }
      .pv-breakout-volume span { flex:1; height:var(--pv-volume); border-radius:.2rem .2rem 0 0; background:${tokens.warm}; opacity:.72; }
      .pv-breakout-controls { display:flex; gap:.6rem; flex-wrap:wrap; }
      .pv-breakout-controls button { flex:1 1 10rem; padding:.75rem; border:1px solid ${tokens.line}; border-radius:.75rem; color:${tokens.ink}; background:${tokens.surface}; font:inherit; font-weight:800; cursor:pointer; }
      .pv-breakout-controls button[aria-pressed="true"] { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}; }
      .pv-breakout-controls button:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .pv-breakout-status { min-height:5rem; margin:0; padding:1rem; border-left:.3rem solid ${tokens.coral}; border-radius:.65rem; color:${tokens.muted}; background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); line-height:1.55; }
      .pv-breakout-note { margin:0; color:${tokens.muted}; font-size:.74rem; text-align:center; }
      .pv-breakout.is-paused .pv-breakout-path { animation-play-state:paused; }
      @keyframes pv-breakout-draw { from { stroke-dashoffset:520; } to { stroke-dashoffset:0; } }
      @media (max-width:560px) { .pv-breakout-path-grid { grid-template-columns:1fr; } }
    </style>
    <div class="pv-breakout${motion?"":" is-paused"}" role="group" aria-label="${escapeHtml(copy.ariaLabel)}"><div class="pv-breakout-path-grid">${copy.paths.map((path)=>`<section class="pv-breakout-card" data-pv-path="${path.key}" data-path-state="undetermined"><h3>${escapeHtml(path.label)}</h3><span class="pv-breakout-state" data-pv-path-state-label></span><div class="pv-breakout-chart" role="img"><span class="pv-breakout-level">${escapeHtml(copy.referenceLevel)}</span><svg viewBox="0 0 600 220" class="pv-breakout-path" preserveAspectRatio="none" aria-hidden="true"><polyline data-pv-polyline></polyline></svg><div class="pv-breakout-volume" data-pv-volume></div></div></section>`).join("")}</div><div class="pv-breakout-controls" role="group" aria-label="${escapeHtml(copy.controlLabel)}">${copy.windows.map((item,index)=>`<button type="button" data-pv-window="${item.key}" data-pv-window-index="${index}" aria-pressed="${index===0}">${escapeHtml(item.label)}</button>`).join("")}</div><p class="pv-breakout-status" data-pv-status aria-live="polite"></p><p class="pv-breakout-note">${escapeHtml(copy.syntheticNote)}</p></div>`;
  const scene=root.querySelector(".pv-breakout"); const status=root.querySelector(".pv-breakout-status"); const buttons=[...root.querySelectorAll("[data-pv-window]")]; const cards=[...root.querySelectorAll("[data-pv-path]")];
  const select=(index,speak=false)=>{const windowState=copy.windows[index];scene.dataset.window=windowState.key;cards.forEach((card,pathIndex)=>{const path=copy.paths[pathIndex];const crossingOnly=windowState.key==="crossing";const state=crossingOnly?"undetermined":path.result;const points=crossingOnly?path.crossingPoints:path.followThroughPoints;const volumes=crossingOnly?path.volumes.slice(0,path.crossingCount):path.volumes;card.dataset.pathState=state;card.dataset.visiblePoints=String(points.trim().split(/\s+/).length);card.querySelector("[data-pv-path-state-label]").textContent=copy.stateLabels[state];card.querySelector("[data-pv-polyline]").setAttribute("points",points);card.querySelector("[data-pv-volume]").innerHTML=volumes.map((item)=>`<span style="--pv-volume:${item}%"></span>`).join("");card.querySelector(".pv-breakout-chart").setAttribute("aria-label",path.aria[windowState.key]);});status.textContent=windowState.status;buttons.forEach((button,i)=>button.setAttribute("aria-pressed",String(i===index)));if(speak)announce(status.textContent);};
  buttons.forEach((button)=>button.addEventListener("click",()=>select(Number(button.dataset.pvWindowIndex),true)));select(0);
  return { pause:()=>scene.classList.add("is-paused"),resume:()=>scene.classList.remove("is-paused"),reset:()=>select(0),destroy:()=>{root.innerHTML="";} };
});