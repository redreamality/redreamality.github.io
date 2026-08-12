registerDemo("pv-context-checklist", ({ root, copy, tokens, announce }) => {
  root.innerHTML = `
    <style>
      .pv-checklist { display:grid; gap:1rem; min-height:22rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink}; background:${tokens.surface}; }
      .pv-checklist-items { display:grid; gap:.6rem; }
      .pv-checklist-item { display:grid; grid-template-columns:auto 1fr; gap:.75rem; align-items:start; padding:.85rem; border:1px solid ${tokens.line}; border-radius:.8rem; background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); cursor:pointer; }
      .pv-checklist-item input { width:1.15rem; height:1.15rem; accent-color:${tokens.ocean}; }
      .pv-checklist-item strong { display:block; margin-bottom:.25rem; font-size:.82rem; }
      .pv-checklist-item span { color:${tokens.muted}; font-size:.73rem; line-height:1.45; }
      .pv-checklist-meter { height:.65rem; overflow:hidden; border-radius:999px; background:color-mix(in srgb,${tokens.line} 65%,${tokens.surface}); }
      .pv-checklist-meter span { display:block; width:var(--pv-width); height:100%; background:linear-gradient(90deg,${tokens.ocean},${tokens.warm}); transition:width .2s ease; }
      .pv-checklist-status { min-height:4rem; margin:0; padding:.8rem; border-left:.3rem solid ${tokens.ocean}; border-radius:.65rem; color:${tokens.ink}; background:color-mix(in srgb,${tokens.paper} 40%,${tokens.surface}); font-weight:800; line-height:1.55; }
      .pv-checklist-note { margin:0; padding:.8rem; border:1px solid color-mix(in srgb,${tokens.coral} 60%,${tokens.line}); border-radius:.7rem; color:${tokens.coral}; font-size:.76rem; font-weight:750; }
    </style>
    <div class="pv-checklist" role="group" aria-label="${escapeHtml(copy.ariaLabel)}"><div class="pv-checklist-items">${copy.items.map((item,index)=>`<label class="pv-checklist-item"><input type="checkbox" data-pv-check="${index}" data-check-key="${item.key}"><span><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.body)}</span></span></label>`).join("")}</div><div class="pv-checklist-meter" role="progressbar" aria-label="${escapeHtml(copy.meterAria)}" aria-valuemin="0" aria-valuemax="7" aria-valuenow="0"><span></span></div><p class="pv-checklist-status" data-pv-status aria-live="polite"></p><p class="pv-checklist-note">${escapeHtml(copy.educationNote)}</p></div>`;
  const scene=root.querySelector(".pv-checklist");const inputs=[...root.querySelectorAll("[data-pv-check]")];const meterRoot=root.querySelector(".pv-checklist-meter");const meter=root.querySelector(".pv-checklist-meter span");const status=root.querySelector(".pv-checklist-status");
  const render=(speak=false)=>{const checked=inputs.filter((input)=>input.checked);const count=checked.length;const keys=new Set(checked.map((input)=>input.dataset.checkKey));let outcome="limited";if(count<=2)outcome="insufficient";else if(!keys.has("followThrough"))outcome="waiting";else if(count===inputs.length)outcome="complete";scene.dataset.outcome=outcome;scene.dataset.checkedCount=String(count);meter.style.setProperty("--pv-width",`${count/inputs.length*100}%`);meterRoot.setAttribute("aria-valuenow",String(count));status.textContent=copy.outcomes[outcome];if(speak)announce(status.textContent);};
  inputs.forEach((input)=>input.addEventListener("change",()=>render(true)));render();
  return { reset:()=>{inputs.forEach((input)=>{input.checked=false;});render();},destroy:()=>{root.innerHTML="";} };
});