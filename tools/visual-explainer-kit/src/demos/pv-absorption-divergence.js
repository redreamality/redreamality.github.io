registerDemo("pv-absorption-divergence", ({ root, copy, tokens, announce }) => {
  root.innerHTML = `
    <style>
      .pv-absorption { display:grid; gap:1rem; min-height:22rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink}; background:${tokens.surface}; }
      .pv-absorption-stage { display:grid; grid-template-columns:repeat(2,1fr); gap:.7rem; }
      .pv-absorption-panel { min-height:10rem; padding:1rem; border:1px solid ${tokens.line}; border-radius:1rem; background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); }
      .pv-absorption-panel h3 { margin:0 0 .8rem; color:${tokens.ocean}; font-size:.82rem; }
      .pv-absorption-panel:last-child h3 { color:${tokens.coral}; }
      .pv-absorption-track { position:relative; height:5rem; border-bottom:1px solid ${tokens.line}; }
      .pv-absorption-track span { position:absolute; left:var(--pv-left); bottom:var(--pv-bottom); width:.55rem; height:.55rem; border-radius:50%; background:${tokens.warm}; transform:translate(-50%,50%); }
      .pv-absorption-controls { display:flex; gap:.6rem; flex-wrap:wrap; }
      .pv-absorption-controls button { flex:1 1 10rem; padding:.75rem; border:1px solid ${tokens.line}; border-radius:.75rem; color:${tokens.ink}; background:${tokens.surface}; font:inherit; font-weight:800; cursor:pointer; }
      .pv-absorption-controls button[aria-pressed="true"] { border-color:${tokens.warm}; box-shadow:inset 0 0 0 1px ${tokens.warm}; }
      .pv-absorption-controls button:focus-visible { outline:3px solid ${tokens.ocean}; outline-offset:2px; }
      .pv-absorption-status { min-height:5rem; margin:0; padding:1rem; border-left:.3rem solid ${tokens.warm}; border-radius:.65rem; color:${tokens.muted}; background:color-mix(in srgb,${tokens.paper} 42%,${tokens.surface}); line-height:1.55; }
      .pv-absorption-note { margin:0; color:${tokens.muted}; font-size:.74rem; text-align:center; }
      @media(max-width:500px){.pv-absorption-stage{grid-template-columns:1fr;}}
    </style>
    <div class="pv-absorption" role="group" aria-label="${escapeHtml(copy.ariaLabel)}"><div class="pv-absorption-stage"><div class="pv-absorption-panel"><h3>${escapeHtml(copy.priceLabel)}</h3><div class="pv-absorption-track" data-pv-price></div></div><div class="pv-absorption-panel"><h3>${escapeHtml(copy.volumeLabel)}</h3><div class="pv-absorption-track" data-pv-volume></div></div></div><div class="pv-absorption-controls" role="group" aria-label="${escapeHtml(copy.controlLabel)}">${copy.patterns.map((item,index)=>`<button type="button" data-pv-pattern="${index}" aria-pressed="${index===0}">${escapeHtml(item.label)}</button>`).join("")}</div><p class="pv-absorption-status" data-pv-status aria-live="polite"></p><p class="pv-absorption-note">${escapeHtml(copy.syntheticNote)}</p></div>`;
  const price=root.querySelector("[data-pv-price]");const volume=root.querySelector("[data-pv-volume]");const status=root.querySelector(".pv-absorption-status");const buttons=[...root.querySelectorAll("[data-pv-pattern]")];
  const points=(items)=>items.map((item,index)=>`<span style="--pv-left:${index*20}%;--pv-bottom:${item}%"></span>`).join("");
  const select=(index,speak=false)=>{const item=copy.patterns[index];price.innerHTML=points(item.price);volume.innerHTML=points(item.volume);status.textContent=item.status;buttons.forEach((button,i)=>button.setAttribute("aria-pressed",String(i===index)));if(speak)announce(item.status);};
  buttons.forEach((button)=>button.addEventListener("click",()=>select(Number(button.dataset.pvPattern),true)));select(0);
  return { reset:()=>select(0),destroy:()=>{root.innerHTML="";} };
});