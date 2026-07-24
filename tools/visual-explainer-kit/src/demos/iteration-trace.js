registerDemo("iteration-trace", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
  // 注入结构和样式
  root.innerHTML = `
    <style>
      .trace-container {
        display: flex;
        flex-wrap: wrap;
        gap: 32px;
        width: 100%;
        font-family: system-ui, -apple-system, sans-serif;
        color: var(--ink, #000);
        align-items: flex-start;
      }
      .no-motion * {
        transition: none !important;
      }
      .diagram-pane {
        flex: 1 1 280px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
        gap: 32px;
        position: relative;
        padding: 16px;
        min-height: 280px;
      }
      .track-svg {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        z-index: 1;
        pointer-events: none;
      }
      #track-path {
        stroke: var(--line, #ccc);
        stroke-width: 4;
        fill: none;
        stroke-linejoin: round;
        stroke-linecap: round;
      }
      .node {
        background: var(--surface, #fff);
        border: 2px solid var(--line, #ccc);
        border-radius: 12px;
        padding: 16px 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-weight: 600;
        font-size: 14px;
        z-index: 2;
        transition: border-color 0.3s ease, box-shadow 0.3s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      }
      .node.active {
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      }
      .token {
        position: absolute;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        z-index: 3;
        transform: translate(-50%, -50%);
        transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1),
                    top 0.6s cubic-bezier(0.4, 0, 0.2, 1),
                    background-color 0.4s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      }
      .token.attempt-1 { background: var(--coral, #ff7f50); }
      .token.attempt-2 { background: var(--ocean, #20b2aa); }

      .info-pane {
        flex: 1 1 300px;
        background: var(--paper, #f9f9f9);
        border: 1px solid var(--line, #ccc);
        border-radius: 12px;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .badge-row {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .badge {
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 700;
        color: var(--paper, #fff);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .badge.attempt-1 { background: var(--coral, #ff7f50); }
      .badge.attempt-2 { background: var(--ocean, #20b2aa); }
      .badge.phase { background: var(--ink, #000); }

      .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .field-label {
        font-size: 12px;
        text-transform: uppercase;
        color: var(--muted, #666);
        font-weight: 700;
        letter-spacing: 0.05em;
      }
      .field-value {
        font-size: 15px;
        line-height: 1.5;
      }
      .outcome {
        margin-top: 4px;
        padding: 14px;
        background: var(--surface, #fff);
        border-left: 4px solid;
        border-radius: 0 6px 6px 0;
        font-weight: 600;
        font-size: 15px;
        line-height: 1.4;
      }
      .outcome.attempt-1 { border-left-color: var(--coral, #ff7f50); }
      .outcome.attempt-2 { border-left-color: var(--ocean, #20b2aa); }

      .next-btn {
        margin-top: auto;
        padding: 10px 16px;
        background: var(--surface, #fff);
        border: 1px solid var(--line, #ccc);
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        color: var(--ink, #000);
        transition: background 0.2s, border-color 0.2s;
        align-self: flex-start;
      }
      .next-btn:hover {
        background: var(--line, #eee);
      }
      .next-btn:active {
        transform: translateY(1px);
      }
      .next-btn:focus-visible {
        outline: 3px solid var(--ocean);
        outline-offset: 2px;
      }
    </style>

    <div class="trace-container" aria-label="${copy.ariaLabel}">
      <div class="diagram-pane">
        <svg class="track-svg" aria-hidden="true"><path id="track-path" /></svg>
        <div class="node" id="node-0">${copy.phaseLabels[0]}</div>
        <div class="node" id="node-1">${copy.phaseLabels[1]}</div>
        <div class="node" id="node-3">${copy.phaseLabels[3]}</div>
        <div class="node" id="node-2">${copy.phaseLabels[2]}</div>
        <div class="token" id="anim-token"></div>
      </div>

      <div class="info-pane">
        <div class="badge-row">
          <div class="badge" id="badge-attempt"></div>
          <div class="badge phase" id="badge-phase"></div>
        </div>
        <div class="field">
          <div class="field-label">${copy.changeLabel}</div>
          <div class="field-value" id="val-change"></div>
        </div>
        <div class="field">
          <div class="field-label">${copy.evidenceLabel}</div>
          <div class="field-value" id="val-evidence"></div>
        </div>
        <div class="outcome" id="val-outcome"></div>
        <button type="button" class="next-btn" id="btn-next">${copy.nextButton}</button>
      </div>
    </div>
  `;

  const container = root.querySelector('.trace-container');
  if (!motion) {
    container.classList.add('no-motion');
  }

  // DOM 元素引用
  const diagramPane = root.querySelector('.diagram-pane');
  const trackPath = root.querySelector('#track-path');
  const tokenEl = root.querySelector('#anim-token');
  const nodes = [
    root.querySelector('#node-0'),
    root.querySelector('#node-1'),
    root.querySelector('#node-2'),
    root.querySelector('#node-3')
  ];

  const badgeAttempt = root.querySelector('#badge-attempt');
  const badgePhase = root.querySelector('#badge-phase');
  const valChange = root.querySelector('#val-change');
  const valEvidence = root.querySelector('#val-evidence');
  const valOutcome = root.querySelector('#val-outcome');
  const btnNext = root.querySelector('#btn-next');

  let stateIndex = 0;
  let timer = null;
  let userInteracted = false;
  let isPlaying = false;

  // 更新连线和 Token 位置
  function updateLayout() {
    const diagRect = diagramPane.getBoundingClientRect();
    if (diagRect.width === 0) return; // 隐藏状态

    const centers = nodes.map(n => {
      const r = n.getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - diagRect.left,
        y: r.top + r.height / 2 - diagRect.top
      };
    });

    // 绘制循环轨道 (0 -> 1 -> 2 -> 3 -> 0)
    trackPath.setAttribute('d',
      `M ${centers[0].x} ${centers[0].y}
       L ${centers[1].x} ${centers[1].y}
       L ${centers[2].x} ${centers[2].y}
       L ${centers[3].x} ${centers[3].y} Z`
    );

    // 更新 Token 坐标
    const currentState = copy.states[stateIndex];
    const targetCenter = centers[currentState.phase];
    tokenEl.style.left = `${targetCenter.x}px`;
    tokenEl.style.top = `${targetCenter.y}px`;
  }

  // 渲染当前状态
  function renderState(announceChange = false) {
    const state = copy.states[stateIndex];
    const isAttempt1 = state.attempt === "1";
    const attemptClass = isAttempt1 ? 'attempt-1' : 'attempt-2';
    const colorVar = isAttempt1 ? 'var(--coral)' : 'var(--ocean)';

    // 更新文本和样式
    badgeAttempt.textContent = copy.attemptLabel.replace('{attempt}', state.attempt);
    badgeAttempt.className = `badge ${attemptClass}`;
    badgePhase.textContent = copy.phaseLabels[state.phase];

    valChange.textContent = state.change;
    valEvidence.textContent = state.evidence;

    valOutcome.textContent = state.outcome;
    valOutcome.className = `outcome ${attemptClass}`;

    // 更新节点高亮
    nodes.forEach((n, i) => {
      if (i === state.phase) {
        n.classList.add('active');
        n.style.borderColor = colorVar;
      } else {
        n.classList.remove('active');
        n.style.borderColor = 'var(--line)';
      }
    });

    // 更新 Token 颜色与布局
    tokenEl.className = `token ${attemptClass}`;
    updateLayout();

    // 屏幕阅读器播报
    if (announceChange) {
      const attemptText = copy.attemptLabel.replace('{attempt}', state.attempt);
      const phaseText = copy.phaseLabels[state.phase];
      announce(`${attemptText}, ${phaseText}. ${copy.changeLabel}: ${state.change}. ${copy.evidenceLabel}: ${state.evidence}. ${state.outcome}`);
    }
  }

  // 自动播放调度
  function scheduleNext() {
    clearTimeout(timer);
    if (!userInteracted && isPlaying && motion) {
      timer = setTimeout(() => {
        stateIndex = (stateIndex + 1) % copy.states.length;
        renderState(false);
        scheduleNext();
      }, 4000);
    }
  }

  // 用户点击下一页
  btnNext.addEventListener('click', () => {
    userInteracted = true;
    clearTimeout(timer);
    stateIndex = (stateIndex + 1) % copy.states.length;
    renderState(true);
  }, { signal });

  // 初始化
  renderState(false);
  scheduleNext();

  return {
    pause() {
      isPlaying = false;
      clearTimeout(timer);
    },
    resume() {
      isPlaying = true;
      scheduleNext();
    },
    reset() {
      userInteracted = false;
      stateIndex = 0;
      renderState(false);
      scheduleNext();
    },
    destroy() {
      clearTimeout(timer);
      root.innerHTML = '';
    },
    resize({ width, height, dpr }) {
      updateLayout();
    }
  };
});
