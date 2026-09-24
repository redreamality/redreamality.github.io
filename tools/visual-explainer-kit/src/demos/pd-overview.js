registerDemo("pd-overview", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
  const html = `
    <style>
      .pd-overview {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        font-family: system-ui, sans-serif;
        color: var(--ink, ${tokens.ink});
        min-height: 350px;
        padding: 0.5rem;
        box-sizing: border-box;
      }
      .pd-caption {
        font-size: 0.875rem;
        color: var(--muted, ${tokens.muted});
        margin: 0;
        text-align: center;
      }
      .pd-content {
        display: flex;
        flex-wrap: wrap;
        gap: 2rem;
        width: 100%;
        align-items: stretch;
      }
      .pd-grid-section {
        flex: 1 1 260px;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .pd-grid {
        display: grid;
        grid-template-columns: 2.5rem max-content 1fr 1fr;
        grid-template-rows: 2.5rem max-content 1fr 1fr;
        gap: 6px;
        width: 100%;
        max-width: 360px;
      }
      .pd-axis-partner {
        grid-column: 3 / 5;
        grid-row: 1;
        text-align: center;
        font-weight: 600;
        align-self: end;
        color: var(--coral, ${tokens.coral});
      }
      .pd-axis-you {
        grid-column: 1;
        grid-row: 3 / 5;
        writing-mode: vertical-rl;
        transform: rotate(180deg);
        text-align: center;
        font-weight: 600;
        justify-self: end;
        color: var(--ocean, ${tokens.ocean});
      }
      .pd-label-col {
        grid-row: 2;
        text-align: center;
        font-size: 0.875rem;
        color: var(--muted, ${tokens.muted});
        align-self: end;
        padding-bottom: 4px;
      }
      .pd-label-row {
        grid-column: 2;
        text-align: right;
        font-size: 0.875rem;
        color: var(--muted, ${tokens.muted});
        align-self: center;
        padding-right: 8px;
      }
      .pd-cell {
        background: var(--surface, ${tokens.surface});
        border: 2px solid var(--line, ${tokens.line});
        border-radius: 8px;
        padding: 0.75rem;
        cursor: pointer;
        transition: all 0.2s ease;
        min-height: 80px;
        position: relative;
        appearance: none;
        font-family: inherit;
      }
      .pd-cell:hover {
        border-color: var(--muted, ${tokens.muted});
      }
      .pd-cell:focus-visible {
        outline: 2px solid var(--ink, ${tokens.ink});
        outline-offset: 2px;
      }
      .pd-cell[aria-pressed="true"] {
        border-color: var(--ocean, ${tokens.ocean});
        background: var(--paper, ${tokens.paper});
        box-shadow: 0 0 0 1px var(--ocean, ${tokens.ocean});
        z-index: 2;
      }
      .pd-cell-inner {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        justify-content: space-between;
        pointer-events: none;
      }
      .pd-val-partner {
        align-self: flex-end;
        color: var(--coral, ${tokens.coral});
        font-weight: 600;
      }
      .pd-val-you {
        align-self: flex-start;
        color: var(--ocean, ${tokens.ocean});
        font-weight: 600;
      }
      .pd-panel {
        flex: 1 1 280px;
        background: var(--surface, ${tokens.surface});
        border: 1px solid var(--line, ${tokens.line});
        border-radius: 8px;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .pd-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .pd-panel-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
        color: var(--ink, ${tokens.ink});
      }
      .pd-panel-state {
        background: var(--line, ${tokens.line});
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        white-space: nowrap;
      }
      .pd-panel-payoffs {
        display: flex;
        gap: 1.5rem;
        font-size: 1.125rem;
      }
      .pd-panel-desc {
        line-height: 1.6;
        margin: 0;
        color: var(--ink, ${tokens.ink});
      }
    </style>
    
    <div class="pd-overview" role="region" aria-label="${copy.ariaLabel}">
      <p class="pd-caption" aria-hidden="true">${copy.caption}</p>
      <div class="pd-content">
        <div class="pd-grid-section">
          <div class="pd-grid" role="group" aria-label="${copy.controlLabel}">
            <div class="pd-axis-partner" aria-hidden="true">${copy.otherLabel}</div>
            <div class="pd-axis-you" aria-hidden="true">${copy.youLabel}</div>
            
            <div class="pd-label-col" style="grid-column: 3;" aria-hidden="true">${copy.coopLabel}</div>
            <div class="pd-label-col" style="grid-column: 4;" aria-hidden="true">${copy.defectLabel}</div>
            
            <div class="pd-label-row" style="grid-row: 3;" aria-hidden="true">${copy.coopLabel}</div>
            <button class="pd-cell" data-idx="0" style="grid-column: 3; grid-row: 3;"></button>
            <button class="pd-cell" data-idx="2" style="grid-column: 4; grid-row: 3;"></button>
            
            <div class="pd-label-row" style="grid-row: 4;" aria-hidden="true">${copy.defectLabel}</div>
            <button class="pd-cell" data-idx="1" style="grid-column: 3; grid-row: 4;"></button>
            <button class="pd-cell" data-idx="3" style="grid-column: 4; grid-row: 4;"></button>
          </div>
        </div>
        
        <div class="pd-panel" aria-live="polite">
          <div class="pd-panel-header">
            <h3 class="pd-panel-title"></h3>
            <span class="pd-panel-state"></span>
          </div>
          <div class="pd-panel-payoffs">
            <span class="pd-val-you pd-panel-you"></span>
            <span class="pd-val-partner pd-panel-partner"></span>
          </div>
          <p class="pd-panel-desc"></p>
        </div>
      </div>
    </div>
  `;

  root.innerHTML = html;

  const cells = Array.from(root.querySelectorAll('.pd-cell'));
  const titleEl = root.querySelector('.pd-panel-title');
  const stateEl = root.querySelector('.pd-panel-state');
  const youEl = root.querySelector('.pd-panel-you');
  const partnerEl = root.querySelector('.pd-panel-partner');
  const descEl = root.querySelector('.pd-panel-desc');

  let activeIdx = 0;
  let timer = null;
  let isPlaying = motion !== false;
  let userInteracted = false;
  
  // Cycle order visually moving clockwise: cc(0) -> cd(2) -> dd(3) -> dc(1)
  const cycle = [0, 2, 3, 1];

  cells.forEach(btn => {
    const idx = parseInt(btn.dataset.idx, 10);
    const data = copy.cells[idx];
    
    btn.setAttribute('aria-label', `${data.label}. ${copy.youLabel}: ${data.you} ${copy.yearsUnit}, ${copy.otherLabel}: ${data.other} ${copy.yearsUnit}`);
    
    btn.innerHTML = `
      <div class="pd-cell-inner">
        <div class="pd-val-partner">${data.other}${copy.yearsUnit}</div>
        <div class="pd-val-you">${data.you}${copy.yearsUnit}</div>
      </div>
    `;
    
    btn.addEventListener('click', () => {
      userInteracted = true;
      stopTimer();
      selectCell(idx);
    }, { signal });
  });

  function selectCell(idx, auto = false) {
    activeIdx = idx;
    
    cells.forEach(btn => {
      const isSelected = parseInt(btn.dataset.idx, 10) === idx;
      btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });
    
    const data = copy.cells[idx];
    titleEl.textContent = data.label;
    stateEl.textContent = data.state;
    youEl.textContent = `${copy.youLabel}: ${data.you}${copy.yearsUnit}`;
    partnerEl.textContent = `${copy.otherLabel}: ${data.other}${copy.yearsUnit}`;
    descEl.textContent = data.detail;
    
    if (!auto) {
      announce(`${data.label}. ${data.state}. ${data.detail}`);
    }
  }

  function startTimer() {
    stopTimer();
    if (!isPlaying || userInteracted) return;
    timer = setInterval(() => {
      const currentCycleIdx = cycle.indexOf(activeIdx);
      const nextIdx = cycle[(currentCycleIdx + 1) % 4];
      selectCell(nextIdx, true);
    }, 3500);
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  // Initialize
  selectCell(0, true);
  if (isPlaying) {
    startTimer();
  }

  return {
    pause() {
      isPlaying = false;
      stopTimer();
    },
    resume() {
      isPlaying = motion !== false;
      if (isPlaying && !userInteracted) {
        startTimer();
      }
    },
    reset() {
      userInteracted = false;
      isPlaying = motion !== false;
      selectCell(0, true);
      if (isPlaying) {
        startTimer();
      }
    },
    destroy() {
      stopTimer();
      root.innerHTML = '';
    },
    resize(dimensions) {
      // Dimensions are managed natively by CSS flex and grid
    }
  };
});
