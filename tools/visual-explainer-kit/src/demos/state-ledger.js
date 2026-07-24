registerDemo("state-ledger", ({ root, shadow, signal, copy, motion, tokens, resolveColor, announce }) => {
    root.innerHTML = `
        <style>
            .sl-wrapper {
                display: flex; flex-direction: column; min-height: 26rem; width: 100%;
                background: ${tokens.surface}; color: ${tokens.ink};
                font-family: system-ui, -apple-system, sans-serif;
                box-sizing: border-box; padding: 1.5rem; gap: 1.5rem;
                overflow: hidden;
            }
            .sl-header {
                display: flex; justify-content: space-between; align-items: center;
                flex-wrap: wrap; gap: 1rem;
            }
            .sl-title {
                margin: 0; font-size: 1.1rem; font-weight: 600; color: ${tokens.ink};
            }
            .sl-btn {
                background: ${tokens.ocean}; color: ${tokens.surface};
                border: none; padding: 0.5rem 1rem; border-radius: 4px;
                cursor: pointer; font-weight: 500; font-size: 0.9rem;
                transition: opacity 0.2s;
            }
            .sl-btn:hover { opacity: 0.9; }
            .sl-btn:active { transform: scale(0.98); }
            .sl-btn:focus-visible { outline: 3px solid ${tokens.ocean}; outline-offset: 2px; }
            .sl-main {
                display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;
                flex: 1; min-height: 0; overflow-y: auto;
            }
            @media (max-width: 500px) {
                .sl-main { grid-template-columns: 1fr; }
            }
            .sl-col { display: flex; flex-direction: column; gap: 1rem; }
            .sl-col-title {
                margin: 0; font-size: 0.9rem; color: ${tokens.muted};
                text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;
            }
            .sl-transient-content, .sl-durable-content {
                display: flex; flex-direction: column; gap: 0.75rem;
            }
            .sl-transient-bubble {
                background: ${tokens.paper}; border: 1px solid ${tokens.line};
                padding: 1rem; border-radius: 8px; font-size: 0.95rem; line-height: 1.5;
                transition: opacity 0.3s ease, transform 0.3s ease;
                opacity: 1; transform: translateY(0);
            }
            .sl-durable-item {
                background: ${tokens.paper}; border-left: 4px solid ${tokens.ocean};
                padding: 0.875rem 1rem; border-radius: 4px; font-size: 0.95rem;
                line-height: 1.4; border-top: 1px solid ${tokens.line};
                border-right: 1px solid ${tokens.line}; border-bottom: 1px solid ${tokens.line};
            }
            .sl-footer {
                text-align: center; font-size: 0.95rem; color: ${tokens.coral};
                font-weight: 500; min-height: 1.5em; line-height: 1.4;
                padding-top: 0.5rem; border-top: 1px solid ${tokens.line};
            }
            .fade-in-anim { animation: fadeIn 0.4s ease forwards; }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-5px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .slide-in-anim { animation: slideIn 0.4s ease-out forwards; opacity: 0; }
            @keyframes slideIn {
                from { opacity: 0; transform: translateX(-10px); }
                to { opacity: 1; transform: translateX(0); }
            }
        </style>
        <div class="sl-wrapper" aria-label="${copy.ariaLabel}">
            <div class="sl-header">
                <h3 class="sl-title"></h3>
                <button type="button" class="sl-btn">${copy.nextButton}</button>
            </div>
            <div class="sl-main">
                <div class="sl-col">
                    <h4 class="sl-col-title">${copy.transientLabel}</h4>
                    <div class="sl-transient-content"></div>
                </div>
                <div class="sl-col">
                    <h4 class="sl-col-title">${copy.durableLabel}</h4>
                    <div class="sl-durable-content"></div>
                </div>
            </div>
            <div class="sl-footer"></div>
        </div>
    `;

    const titleEl = root.querySelector('.sl-title');
    const btnEl = root.querySelector('.sl-btn');
    const transientContent = root.querySelector('.sl-transient-content');
    const durableContent = root.querySelector('.sl-durable-content');
    const footerEl = root.querySelector('.sl-footer');

    let currentIndex = 0;
    let timer = null;
    let isPaused = true;
    let userInteracted = false;
    const TOTAL_STEPS = copy.attempts.length;

    function updateView(prevIndex, newIndex, animate) {
        const data = copy.attempts[newIndex];
        const prevData = copy.attempts[prevIndex];

        titleEl.textContent = copy.attemptLabel.replace('{attempt}', data.attempt);
        footerEl.textContent = data.caption;

        if (prevIndex !== newIndex) {
            announce(`${titleEl.textContent}. ${data.caption}`);
        }

        const useAnim = animate && motion;
        const transientHtml = `<div class="sl-transient-bubble ${useAnim ? 'fade-in-anim' : ''}">${data.transient}</div>`;

        if (useAnim && prevIndex !== newIndex) {
            const oldBubble = transientContent.querySelector('.sl-transient-bubble');
            if (oldBubble) {
                oldBubble.style.opacity = '0';
                oldBubble.style.transform = 'translateY(5px)';
                setTimeout(() => {
                    if (currentIndex === newIndex && root.contains(transientContent)) {
                        transientContent.innerHTML = transientHtml;
                    }
                }, 300);
            } else {
                transientContent.innerHTML = transientHtml;
            }
        } else {
            transientContent.innerHTML = transientHtml;
        }

        let durableHtml = '';
        const isForwardStep = useAnim && (newIndex === prevIndex + 1);
        const baselineCount = isForwardStep ? prevData.durable.length : data.durable.length;

        data.durable.forEach((itemText, i) => {
            const isNew = i >= baselineCount;
            const animClass = isNew ? 'slide-in-anim' : '';
            const delay = isNew ? (i - baselineCount) * 0.15 : 0;
            const style = isNew ? `style="animation-delay: ${delay}s"` : '';
            durableHtml += `<div class="sl-durable-item ${animClass}" ${style}>${itemText}</div>`;
        });

        durableContent.innerHTML = durableHtml;
    }

    function goToStep(index, animate) {
        const prev = currentIndex;
        currentIndex = index;
        updateView(prev, currentIndex, animate);
    }

    function scheduleNext() {
        clearTimeout(timer);
        if (isPaused || userInteracted) return;
        timer = setTimeout(() => {
            if (currentIndex < TOTAL_STEPS - 1) {
                goToStep(currentIndex + 1, true);
                scheduleNext();
            }
        }, 4000);
    }

    btnEl.addEventListener('click', () => {
        userInteracted = true;
        clearTimeout(timer);
        const nextIdx = (currentIndex + 1) % TOTAL_STEPS;
        goToStep(nextIdx, true);
    }, { signal });

    goToStep(motion ? 0 : TOTAL_STEPS - 1, false);
    scheduleNext();

    return {
        pause() {
            isPaused = true;
            clearTimeout(timer);
        },
        resume() {
            isPaused = false;
            if (!userInteracted && currentIndex < TOTAL_STEPS - 1) {
                scheduleNext();
            }
        },
        reset() {
            userInteracted = false;
            clearTimeout(timer);
            goToStep(motion ? 0 : TOTAL_STEPS - 1, false);
            if (!isPaused) scheduleNext();
        },
        destroy() {
            clearTimeout(timer);
            root.innerHTML = '';
        },
        resize(size) {}
    };
});
