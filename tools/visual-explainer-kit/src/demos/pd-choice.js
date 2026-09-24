registerDemo("pd-choice", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
  root.innerHTML = `
    <style>
      .pd-choice-demo {
        font-family: system-ui, sans-serif;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        color: ${tokens.ink};
        container-type: inline-size;
        padding: 0.5rem;
      }
      .pd-choice-section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .pd-choice-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: ${tokens.muted};
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .pd-choice-toggle {
        display: inline-flex;
        background: ${tokens.surface};
        border: 1px solid ${tokens.line};
        border-radius: 0.375rem;
        overflow: hidden;
        align-self: flex-start;
      }
      .pd-choice-btn {
        background: transparent;
        border: none;
        padding: 0.5rem 1.25rem;
        font-size: 1rem;
        color: ${tokens.ink};
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
      }
      .pd-choice-btn:hover {
        background: ${tokens.line};
      }
      .pd-choice-btn[aria-pressed="true"] {
        background: ${tokens.ink};
        color: ${tokens.paper};
      }
      .pd-choice-cards {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .pd-choice-card {
        background: ${tokens.surface};
        border: 2px solid ${tokens.line};
        border-radius: 0.5rem;
        padding: 1rem;
        text-align: left;
        cursor: pointer;
        transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        color: ${tokens.ink};
      }
      .pd-choice-card:hover {
        border-color: ${tokens.muted};
      }
      .pd-choice-card[aria-pressed="true"] {
        border-color: ${tokens.ocean};
        background: ${tokens.paper};
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      }
      .pd-choice-card-title {
        font-weight: 600;
        font-size: 1.125rem;
      }
      .pd-choice-stats {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .pd-choice-stat {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .pd-choice-stat-label {
        width: 80px;
        font-size: 0.75rem;
        color: ${tokens.muted};
        line-height: 1.1;
      }
      .pd-choice-stat-track {
        flex: 1;
        height: 0.5rem;
        background: ${tokens.line};
        border-radius: 0.25rem;
        overflow: hidden;
      }
      .pd-choice-stat-fill {
        height: 100%;
        border-radius: 0.25rem;
        width: 0%;
      }
      .pd-choice-fill-you {
        background: ${tokens.ocean};
      }
      .pd-choice-fill-partner {
        background: ${tokens.warm};
      }
      .pd-choice-stat-val {
        width: 45px;
        text-align: right;
        font-size: 0.875rem;
        font-variant-numeric: tabular-nums;
        font-weight: 500;
      }
      .pd-choice-status {
        min-height: 4.5rem;
        padding: 1rem;
        background: ${tokens.surface};
        border-left: 4px solid ${tokens.ocean};
        border-radius: 0 0.25rem 0.25rem 0;
        font-size: 0.9375rem;
        line-height: 1.5;
      }
      ${motion ? `
      .pd-choice-stat-fill {
        transition: width 0.4s cubic-bezier(0.2, 0, 0, 1);
      }
      ` : ''}
      @container (max-width: 480px) {
        .pd-choice-cards {
          grid-template-columns: 1fr;
        }
      }
    </style>
    <div class="pd-choice-demo" aria-label="${copy.ariaLabel}">
      <div class="pd-choice-section">
        <div class="pd-choice-label" id="pd-partner-label">${copy.partnerControlLabel}</div>
        <div class="pd-choice-toggle" role="group" aria-labelledby="pd-partner-label">
          <button class="pd-choice-btn" data-actor="partner" data-move="C" aria-pressed="true">${copy.coopLabel}</button>
          <button class="pd-choice-btn" data-actor="partner" data-move="D" aria-pressed="false">${copy.defectLabel}</button>
        </div>
      </div>

      <div class="pd-choice-section">
        <div class="pd-choice-label" id="pd-you-label">${copy.yourControlLabel}</div>
        <div class="pd-choice-cards" role="group" aria-labelledby="pd-you-label">
          <button class="pd-choice-card" data-actor="you" data-move="C" aria-pressed="true">
            <div class="pd-choice-card-title">${copy.coopLabel}</div>
            <div class="pd-choice-stats">
              <div class="pd-choice-stat">
                <div class="pd-choice-stat-label">${copy.yearsLabel}</div>
                <div class="pd-choice-stat-track"><div class="pd-choice-stat-fill pd-choice-fill-you" data-fill="y-c"></div></div>
                <div class="pd-choice-stat-val" data-val="y-c"></div>
              </div>
              <div class="pd-choice-stat">
                <div class="pd-choice-stat-label">${copy.partnerYearsLabel}</div>
                <div class="pd-choice-stat-track"><div class="pd-choice-stat-fill pd-choice-fill-partner" data-fill="p-c"></div></div>
                <div class="pd-choice-stat-val" data-val="p-c"></div>
              </div>
            </div>
          </button>
          <button class="pd-choice-card" data-actor="you" data-move="D" aria-pressed="false">
            <div class="pd-choice-card-title">${copy.defectLabel}</div>
            <div class="pd-choice-stats">
              <div class="pd-choice-stat">
                <div class="pd-choice-stat-label">${copy.yearsLabel}</div>
                <div class="pd-choice-stat-track"><div class="pd-choice-stat-fill pd-choice-fill-you" data-fill="y-d"></div></div>
                <div class="pd-choice-stat-val" data-val="y-d"></div>
              </div>
              <div class="pd-choice-stat">
                <div class="pd-choice-stat-label">${copy.partnerYearsLabel}</div>
                <div class="pd-choice-stat-track"><div class="pd-choice-stat-fill pd-choice-fill-partner" data-fill="p-d"></div></div>
                <div class="pd-choice-stat-val" data-val="p-d"></div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div class="pd-choice-status" aria-live="polite"></div>
    </div>
  `;

  const payoffs = {
    C: { C: { y: 1, p: 1 }, D: { y: 3, p: 0 } },
    D: { C: { y: 0, p: 3 }, D: { y: 2, p: 2 } }
  };

  let partnerMove = 'C';
  let yourMove = 'C';

  const partnerBtns = root.querySelectorAll('.pd-choice-btn[data-actor="partner"]');
  const youCards = root.querySelectorAll('.pd-choice-card[data-actor="you"]');
  const statusBox = root.querySelector('.pd-choice-status');

  function update(announceChange = false) {
    partnerBtns.forEach(btn => {
      btn.setAttribute('aria-pressed', btn.dataset.move === partnerMove);
    });

    youCards.forEach(card => {
      const move = card.dataset.move;
      card.setAttribute('aria-pressed', move === yourMove);

      const yYears = payoffs[move][partnerMove].y;
      const pYears = payoffs[move][partnerMove].p;

      const fillY = card.querySelector('.pd-choice-fill-you');
      const fillP = card.querySelector('.pd-choice-fill-partner');
      const valY = card.querySelector(`.pd-choice-stat-val[data-val="y-${move.toLowerCase()}"]`);
      const valP = card.querySelector(`.pd-choice-stat-val[data-val="p-${move.toLowerCase()}"]`);

      fillY.style.width = `${(yYears / 3) * 100}%`;
      fillP.style.width = `${(pYears / 3) * 100}%`;

      valY.textContent = `${yYears} ${copy.yearsUnit}`;
      valP.textContent = `${pYears} ${copy.yearsUnit}`;
    });

    let statusKey = 'status';
    statusKey += yourMove === 'C' ? 'Cooperate' : 'Defect';
    statusKey += 'Vs';
    statusKey += partnerMove === 'C' ? 'C' : 'D';

    const text = copy[statusKey];
    statusBox.textContent = text;

    if (announceChange) {
      announce(text);
    }
  }

  partnerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (partnerMove !== btn.dataset.move) {
        partnerMove = btn.dataset.move;
        update(true);
      }
    }, { signal });
  });

  youCards.forEach(card => {
    card.addEventListener('click', () => {
      if (yourMove !== card.dataset.move) {
        yourMove = card.dataset.move;
        update(true);
      }
    }, { signal });
  });

  update(false);

  return {
    pause() {},
    resume() {},
    reset() {
      partnerMove = 'C';
      yourMove = 'C';
      update(false);
    },
    destroy() {
      root.innerHTML = '';
    },
    resize() {}
  };
});
