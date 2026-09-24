registerDemo("bayes-contrast", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
    root.innerHTML = `
        <style>
            .bc-wrapper {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
                padding: 1.5rem;
                background: ${tokens.paper};
                color: ${tokens.ink};
                border-radius: 8px;
                font-family: system-ui, -apple-system, sans-serif;
                min-height: 450px;
                box-sizing: border-box;
            }
            .bc-sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }
            .bc-controls {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.75rem;
            }
            .bc-controls label {
                font-weight: 600;
                font-size: 1rem;
            }
            .bc-controls input[type="range"] {
                -webkit-appearance: none;
                appearance: none;
                width: 100%;
                max-width: 320px;
                height: 8px;
                background: ${tokens.surface};
                border-radius: 4px;
                outline: none;
            }
            .bc-controls input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: ${tokens.coral};
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .bc-controls input[type="range"]::-moz-range-thumb {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: ${tokens.coral};
                cursor: pointer;
                border: none;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .bc-controls input[type="range"]:focus-visible {
                outline: 2px solid ${tokens.ocean};
                outline-offset: 4px;
            }
            .bc-status {
                text-align: center;
                font-size: 0.95rem;
                color: ${tokens.ink};
                background: ${tokens.surface};
                padding: 0.75rem 1rem;
                border-radius: 8px;
                min-height: 3em;
                display: flex;
                align-items: center;
                justify-content: center;
                line-height: 1.4;
            }
            .bc-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0.5rem 2rem;
                align-items: start;
            }
            .bc-col {
                display: flex;
                flex-direction: column;
            }
            .bc-person-name {
                font-weight: bold;
                text-align: center;
                margin-bottom: 1rem;
                color: ${tokens.ink};
                font-size: 1.05rem;
            }
            .bc-bar-group {
                display: flex;
                flex-direction: column;
                gap: 0.35rem;
            }
            .bc-bar-header {
                display: flex;
                justify-content: space-between;
                font-size: 0.85rem;
                align-items: flex-end;
            }
            .bc-bar-label {
                color: ${tokens.muted};
            }
            .bc-bar-val {
                font-variant-numeric: tabular-nums;
                font-weight: 600;
                color: ${tokens.ink};
            }
            .bc-bar-track {
                height: 18px;
                background: ${tokens.surface};
                border-radius: 9px;
                overflow: hidden;
            }
            .bc-bar-fill {
                height: 100%;
                width: 0%;
                border-radius: 9px;
                will-change: width;
            }
            .bc-fill-prior { background: ${tokens.ocean}; }
            .bc-fill-post { background: ${tokens.coral}; }
            .bc-arrow-down {
                text-align: center;
                color: ${tokens.muted};
                font-size: 1.2rem;
                margin: 0.5rem 0;
                line-height: 1;
            }
            .bc-evidence-row {
                grid-column: 1 / -1;
                display: flex;
                justify-content: center;
                padding: 0.5rem 0;
                position: relative;
            }
            .bc-evidence-badge {
                background: ${tokens.paper};
                border: 2px solid ${tokens.warm};
                color: ${tokens.ink};
                padding: 0.5rem 1.5rem;
                border-radius: 20px;
                font-weight: 600;
                font-size: 0.95rem;
                text-align: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            }
            @media (max-width: 400px) {
                .bc-grid { gap: 0.5rem 1rem; }
                .bc-person-name { font-size: 0.95rem; }
                .bc-evidence-badge { padding: 0.4rem 1rem; font-size: 0.85rem; }
            }
        </style>
        <div class="bc-wrapper" role="region" aria-label="${copy.ariaLabel}">
            <div class="bc-sr-only">${copy.caption}</div>
            
            <div class="bc-controls">
                <label for="bc-slider">${copy.controlLabel}</label>
                <input type="range" id="bc-slider" min="0" max="1" step="0.01" value="1">
            </div>
            
            <div class="bc-status" aria-live="polite"></div>
            
            <div class="bc-grid">
                <div class="bc-col">
                    <div class="bc-person-name">${copy.personALabel}</div>
                </div>
                <div class="bc-col">
                    <div class="bc-person-name">${copy.personBLabel}</div>
                </div>

                <div class="bc-col">
                    <div class="bc-bar-group">
                        <div class="bc-bar-header">
                            <span class="bc-bar-label">${copy.priorLabel}</span>
                            <span class="bc-bar-val" id="bc-val-prior-a"></span>
                        </div>
                        <div class="bc-bar-track" aria-hidden="true">
                            <div class="bc-bar-fill bc-fill-prior" id="bc-fill-prior-a"></div>
                        </div>
                    </div>
                    <div class="bc-arrow-down">↓</div>
                </div>
                <div class="bc-col">
                    <div class="bc-bar-group">
                        <div class="bc-bar-header">
                            <span class="bc-bar-label">${copy.priorLabel}</span>
                            <span class="bc-bar-val" id="bc-val-prior-b"></span>
                        </div>
                        <div class="bc-bar-track" aria-hidden="true">
                            <div class="bc-bar-fill bc-fill-prior" id="bc-fill-prior-b"></div>
                        </div>
                    </div>
                    <div class="bc-arrow-down">↓</div>
                </div>

                <div class="bc-evidence-row">
                    <div class="bc-evidence-badge">${copy.evidenceLabel}</div>
                </div>

                <div class="bc-col">
                    <div class="bc-arrow-down">↓</div>
                    <div class="bc-bar-group">
                        <div class="bc-bar-header">
                            <span class="bc-bar-label">${copy.posteriorLabel}</span>
                            <span class="bc-bar-val" id="bc-val-post-a"></span>
                        </div>
                        <div class="bc-bar-track" aria-hidden="true">
                            <div class="bc-bar-fill bc-fill-post" id="bc-fill-post-a"></div>
                        </div>
                    </div>
                </div>
                <div class="bc-col">
                    <div class="bc-arrow-down">↓</div>
                    <div class="bc-bar-group">
                        <div class="bc-bar-header">
                            <span class="bc-bar-label">${copy.posteriorLabel}</span>
                            <span class="bc-bar-val" id="bc-val-post-b"></span>
                        </div>
                        <div class="bc-bar-track" aria-hidden="true">
                            <div class="bc-bar-fill bc-fill-post" id="bc-fill-post-b"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const slider = root.querySelector('#bc-slider');
    const statusEl = root.querySelector('.bc-status');

    const fillPriorA = root.querySelector('#bc-fill-prior-a');
    const fillPriorB = root.querySelector('#bc-fill-prior-b');
    const fillPostA = root.querySelector('#bc-fill-post-a');
    const fillPostB = root.querySelector('#bc-fill-post-b');

    const valPriorA = root.querySelector('#bc-val-prior-a');
    const valPriorB = root.querySelector('#bc-val-prior-b');
    const valPostA = root.querySelector('#bc-val-post-a');
    const valPostB = root.querySelector('#bc-val-post-b');

    let targetGap = 1;
    let currentGap = 1;
    let isPlaying = true;
    let animationId;
    let lastStatus = '';
    let hasInitialized = false;

    const LIKELIHOOD_RATIO = 9;

    function formatPercent(p) {
        return (p * 100).toFixed(1) + '%';
    }

    function renderState() {
        const priorA = 0.10 + 0.30 * currentGap;
        const priorB = 0.10 - 0.08 * currentGap;

        const oddsA = priorA / (1 - priorA);
        const postOddsA = oddsA * LIKELIHOOD_RATIO;
        const postA = postOddsA / (1 + postOddsA);

        const oddsB = priorB / (1 - priorB);
        const postOddsB = oddsB * LIKELIHOOD_RATIO;
        const postB = postOddsB / (1 + postOddsB);

        fillPriorA.style.width = `${priorA * 100}%`;
        fillPriorB.style.width = `${priorB * 100}%`;
        fillPostA.style.width = `${postA * 100}%`;
        fillPostB.style.width = `${postB * 100}%`;

        valPriorA.textContent = formatPercent(priorA);
        valPriorB.textContent = formatPercent(priorB);
        valPostA.textContent = formatPercent(postA);
        valPostB.textContent = formatPercent(postB);

        const newStatus = currentGap > 0.5 ? 'split' : 'aligned';
        if (newStatus !== lastStatus) {
            lastStatus = newStatus;
            const statusText = newStatus === 'split' ? copy.statusSplit : copy.statusAligned;
            statusEl.textContent = statusText;
            
            if (hasInitialized) {
                announce(statusText);
            }
        }
    }

    function loop() {
        if (!isPlaying) return;

        let needsUpdate = false;
        if (Math.abs(targetGap - currentGap) > 0.001) {
            currentGap += (targetGap - currentGap) * (motion === false ? 1 : 0.15);
            needsUpdate = true;
        } else if (currentGap !== targetGap) {
            currentGap = targetGap;
            needsUpdate = true;
        }

        if (needsUpdate) {
            renderState();
        }

        animationId = requestAnimationFrame(loop);
    }

    slider.addEventListener('input', (e) => {
        targetGap = parseFloat(e.target.value);
        if (motion === false) {
            currentGap = targetGap;
            renderState();
        }
    }, { signal });

    renderState();
    hasInitialized = true;
    loop();

    return {
        pause() {
            isPlaying = false;
        },
        resume() {
            if (!isPlaying) {
                isPlaying = true;
                loop();
            }
        },
        reset() {
            targetGap = 1;
            slider.value = 1;
            if (motion === false) {
                currentGap = 1;
                renderState();
            }
        },
        destroy() {
            isPlaying = false;
            cancelAnimationFrame(animationId);
            root.innerHTML = '';
        },
        resize({ width, height, dpr }) {
            renderState();
        }
    };
});
