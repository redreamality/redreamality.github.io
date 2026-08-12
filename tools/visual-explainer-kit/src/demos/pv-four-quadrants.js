registerDemo("pv-four-quadrants", ({ root, copy, tokens, announce }) => {
  root.innerHTML = `
    <style>
      .pv-quadrants { display:grid; gap:1rem; min-height:24rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink}; background:${tokens.surface}; }
      .pv-quadrants-grid { display:grid; grid-template-columns:1fr 1fr; gap:.6rem; }
      .pv-quadrants-card { min-height:8rem; padding:1rem; border:1px solid ${tokens.line}; border-radius:.9rem; color:${tokens.ink}; background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); font:inherit; text-align:left; cursor:pointer; }
      .pv-quadrants-card strong { display:block; margin-bottom:.45rem; color:${tokens.ocean}; }
      .pv-quadrants-card:nth-child(2n) strong { color:${tokens.coral}; }
      .pv-quadrants-card span { color:${tokens.muted}; font-size:.76rem; line-height:1.45; }
      .pv-quadrants-card[aria-pressed="true"] { border-color:${tokens.warm}; box-shadow:inset 0 0 0 2px ${tokens.warm}; }
      .pv-quadrants-card:focus-visible { outline:3px solid ${tokens.ocean}; outline-offset:2px; }
      .pv-quadrants-status { min-height:5.5rem; margin:0; padding:1rem; border-left:.3rem solid ${tokens.warm}; border-radius:.7rem; background:color-mix(in srgb,${tokens.warm} 8%,${tokens.surface}); color:${tokens.muted}; line-height:1.55; }
      .pv-quadrants-note { margin:0; color:${tokens.muted}; font-size:.74rem; text-align:center; }
      @media(max-width:480px){ .pv-quadrants-grid{grid-template-columns:1fr;} .pv-quadrants-card{min-height:6rem;} }
    </style>
    <div class="pv-quadrants" role="group" aria-label="${escapeHtml(copy.ariaLabel)}"><div class="pv-quadrants-grid">${copy.quadrants.map((item,index)=>`<button type="button" class="pv-quadrants-card" data-pv-quadrant="${index}" aria-pressed="${index===0}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.axes)}</span></button>`).join("")}</div><p class="pv-quadrants-status" data-pv-status aria-live="polite"></p><p class="pv-quadrants-note">${escapeHtml(copy.syntheticNote)}</p></div>`;
  const buttons=[...root.querySelectorAll("[data-pv-quadrant]")];
  const status=root.querySelector(".pv-quadrants-status");
  const select=(index,speak=false)=>{ status.textContent=copy.quadrants[index].status; buttons.forEach((button,i)=>button.setAttribute("aria-pressed",String(i===index))); if(speak) announce(status.textContent); };
  buttons.forEach((button)=>button.addEventListener("click",()=>select(Number(button.dataset.pvQuadrant),true)));
  select(0);
  return { reset:()=>select(0), destroy:()=>{root.innerHTML="";} };
});