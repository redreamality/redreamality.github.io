registerDemo("bf-noise", ({ root, copy, motion, tokens, resolveColor, announce }) => {
  const modeButtons = copy.modes.map((m, index) => `
    <button type="button" class="bf-no-btn" data-bf-no="${index}" aria-pressed="${index === 0}">${escapeHtml(m.label)}</button>`).join("");

  root.innerHTML = `
    <style>
      .bf-no { display:grid; gap:1rem; min-height:26rem; padding:clamp(1rem,4vw,2rem); color:${tokens.ink}; }
      .bf-no-frame { position:relative; min-height:14rem; border:1px solid ${tokens.line}; border-radius:1.1rem; overflow:hidden;
        background:color-mix(in srgb,${tokens.paper} 35%,${tokens.surface}); }
      .bf-no-frame canvas { display:block; width:100%; height:14rem; }
      .bf-no-legend { display:flex; flex-wrap:wrap; gap:.75rem; font-size:.78rem; font-weight:750; color:${tokens.muted}; }
      .bf-no-swatch { display:inline-block; width:.7rem; height:.7rem; border-radius:50%; margin-right:.35rem; vertical-align:middle; }
      .bf-no-controls { display:flex; flex-wrap:wrap; gap:.55rem; align-items:center; }
      .bf-no-btn, .bf-no-replay { padding:.7rem .9rem; border:1px solid ${tokens.line}; border-radius:.8rem; color:${tokens.ink};
        background:${tokens.surface}; font:inherit; font-weight:800; cursor:pointer; }
      .bf-no-btn[aria-pressed="true"] { border-color:${tokens.ocean}; box-shadow:inset 0 0 0 1px ${tokens.ocean}; }
      .bf-no-replay { background:color-mix(in srgb,${tokens.warm} 18%,${tokens.surface}); }
      .bf-no-btn:focus-visible, .bf-no-replay:focus-visible { outline:3px solid ${tokens.warm}; outline-offset:2px; }
      .bf-no-status { margin:0; color:${tokens.muted}; line-height:1.5; }
      .bf-no-note { margin:0; font-size:.8rem; font-weight:750; color:${tokens.ocean}; }
      .bf-no-caption { margin:0; color:${tokens.muted}; font-size:.76rem; text-align:center; }
    </style>
    <div class="bf-no" role="group" aria-label="${escapeHtml(copy.ariaLabel)}">
      <div class="bf-no-frame"><canvas data-bf-canvas></canvas></div>
      <div class="bf-no-legend">
        <span><i class="bf-no-swatch" style="background:${tokens.ocean}"></i>${escapeHtml(copy.seriesChaos)}</span>
        <span><i class="bf-no-swatch" style="background:${tokens.coral}"></i>${escapeHtml(copy.seriesNoise)}</span>
      </div>
      <div class="bf-no-controls" role="group" aria-label="${escapeHtml(copy.controlLabel)}">
        ${modeButtons}
        <button type="button" class="bf-no-replay" data-bf-replay>${escapeHtml(copy.replayLabel)}</button>
      </div>
      <p class="bf-no-status" data-bf-status role="status"></p>
      <p class="bf-no-note" data-bf-note></p>
      <p class="bf-no-caption">${escapeHtml(copy.caption)}</p>
    </div>`;

  const canvas = root.querySelector("[data-bf-canvas]");
  const ctx = canvas.getContext("2d");
  const status = root.querySelector("[data-bf-status]");
  const note = root.querySelector("[data-bf-note]");
  const btns = [...root.querySelectorAll("[data-bf-no]")];
  const replayBtn = root.querySelector("[data-bf-replay]");
  let modeIndex = 0;
  let noiseSeed = 1;
  let chaos = [];
  let noisy = [];
  const N = 50;
  const R = 4;

  const mulberry = (s) => {
    let t = (s + 0x6d2b79f5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const build = (seed) => {
    let x = 0.3;
    chaos = [x];
    for (let i = 0; i < N; i += 1) {
      x = R * x * (1 - x);
      chaos.push(x);
    }
    let y = 0.3;
    noisy = [y];
    let s = seed;
    for (let i = 0; i < N; i += 1) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const shock = (mulberry(s) - 0.5) * 0.08;
      y = Math.min(0.98, Math.max(0.02, y + shock));
      noisy.push(y);
    }
  };

  const draw = () => {
    const w = canvas.clientWidth || 320;
    const h = canvas.clientHeight || 224;
    canvas.width = Math.floor(w);
    canvas.height = Math.floor(h);
    ctx.clearRect(0, 0, w, h);
    const pad = { l: 28, r: 12, t: 14, b: 18 };
    const iw = w - pad.l - pad.r;
    const ih = h - pad.t - pad.b;
    ctx.strokeStyle = resolveColor(tokens.line);
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t);
    ctx.lineTo(pad.l, pad.t + ih);
    ctx.lineTo(pad.l + iw, pad.t + ih);
    ctx.stroke();
    const mode = copy.modes[modeIndex].key;
    const plot = (arr, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= N; i += 1) {
        const x = pad.l + (i / N) * iw;
        const y = pad.t + ih - arr[i] * ih;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };
    if (mode === "chaos" || mode === "both") plot(chaos, resolveColor(tokens.ocean));
    if (mode === "noise" || mode === "both") plot(noisy, resolveColor(tokens.coral));
  };

  const select = (index, speak = false) => {
    modeIndex = index;
    const m = copy.modes[index];
    status.textContent = m.status;
    note.textContent = m.replayNote;
    btns.forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
    draw();
    if (speak) announce(m.status);
  };

  const replay = () => {
    const m = copy.modes[modeIndex];
    if (m.key === "chaos") {
      build(noiseSeed);
    } else {
      noiseSeed = (noiseSeed + 97) >>> 0;
      build(noiseSeed);
    }
    draw();
    note.textContent = m.replayNote;
    announce(m.replayNote);
  };

  btns.forEach((b) => b.addEventListener("click", () => select(Number(b.dataset.bfNo), true)));
  replayBtn.addEventListener("click", replay);
  build(noiseSeed);
  select(0);

  return {
    pause: () => {},
    resume: () => {},
    reset: () => { noiseSeed = 1; build(noiseSeed); select(0); },
    resize: () => draw(),
    destroy: () => { root.innerHTML = ""; }
  };
});
