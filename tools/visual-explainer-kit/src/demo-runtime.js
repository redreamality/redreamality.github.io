(() => {
  "use strict";

  const ui = Object.freeze(window.__VISUAL_I18N__);
  const registry = new Map();
  const figures = new Set();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const tokens = Object.freeze({
    ink: "var(--visual-ink, #17333c)",
    muted: "var(--visual-muted, #60747a)",
    line: "var(--visual-line, #d8ddd7)",
    ocean: "var(--visual-ocean, #0f7185)",
    warm: "var(--visual-warm, #ee9d46)",
    coral: "var(--visual-coral, #d45f50)",
    paper: "var(--visual-paper, #f4f1e8)",
    surface: "var(--visual-surface, #fffdf8)"
  });
  let globalPaused = false;

  const themeObserver = new MutationObserver(() => {
    requestAnimationFrame(() => figures.forEach((figure) => figure._resize()));
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  const call = (instance, method, value) => {
    if (instance && typeof instance[method] === "function") instance[method](value);
  };

  class InteractiveFigure extends HTMLElement {
    constructor() {
      super();
      this._shadow = this.attachShadow({ mode: "open" });
      this._abortController = new AbortController();
      this._instance = null;
      this._mounted = false;
      this._mounting = false;
      this._visible = false;
      this._localPaused = false;
    }

    connectedCallback() {
      if (this._connected) return;
      this._connected = true;
      figures.add(this);
      this._shadow.innerHTML = `
        <style>
          :host { display: block; color: ${tokens.ink}; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
          .frame { display: grid; grid-template-rows: minmax(0, 1fr) auto; min-height: inherit; background: ${tokens.surface}; }
          .stage { position: relative; min-height: 25rem; overflow: hidden; isolation: isolate; }
          .status { position: absolute; inset: 0; z-index: 3; display: grid; place-items: center; padding: 2rem; color: ${tokens.muted}; text-align: center; background: ${tokens.surface}; }
          .status[hidden] { display: none; }
          .controls { display: flex; align-items: center; gap: .75rem; min-height: 3.4rem; padding: .6rem .75rem; border-top: 1px solid ${tokens.line}; }
          .title { min-width: 0; margin-right: auto; overflow: hidden; color: ${tokens.muted}; font-size: .78rem; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }
          button { padding: .42rem .7rem; border: 1px solid ${tokens.line}; border-radius: 999px; color: ${tokens.ink}; background: ${tokens.surface}; font: inherit; font-size: .74rem; font-weight: 800; cursor: pointer; }
          button:focus-visible { outline: 3px solid ${tokens.warm}; outline-offset: 2px; }
          @media (max-width: 560px) { .controls { align-items: flex-start; } .title { padding-top: .4rem; white-space: normal; } }
        </style>
        <div class="frame">
          <div class="stage"><div class="status" role="status"></div></div>
          <div class="controls">
            <span class="title"></span>
            <button type="button" data-action="pause" aria-pressed="false"></button>
            <button type="button" data-action="reset"></button>
          </div>
        </div>`;

      this._stage = this._shadow.querySelector(".stage");
      this._status = this._shadow.querySelector(".status");
      this._title = this._shadow.querySelector(".title");
      this._pauseButton = this._shadow.querySelector('[data-action="pause"]');
      this._resetButton = this._shadow.querySelector('[data-action="reset"]');
      this._copy = JSON.parse(this.dataset.copy || "{}");
      this._title.textContent = this.dataset.title || "";
      this._pauseButton.textContent = ui.pause;
      this._resetButton.textContent = ui.reset;
      this._setStatus(ui.waiting);

      this._pauseButton.addEventListener("click", () => {
        this._localPaused = !this._localPaused;
        this._syncPlayback();
      });
      this._resetButton.addEventListener("click", () => {
        call(this._instance, "reset");
        this.dispatchEvent(new CustomEvent("demo-reset", { bubbles: true }));
      });

      this._observer = new IntersectionObserver((entries) => {
        this._visible = entries[0]?.isIntersecting ?? false;
        if (this._visible) this._mount();
        this._syncPlayback();
      }, { rootMargin: "180px 0px", threshold: .05 });
      this._observer.observe(this);

      this._resizeObserver = new ResizeObserver(() => this._resize());
      this._resizeObserver.observe(this);
    }

    disconnectedCallback() {
      figures.delete(this);
      this._observer?.disconnect();
      this._resizeObserver?.disconnect();
      this._abortController.abort();
      call(this._instance, "destroy");
    }

    async _mount() {
      if (this._mounted || this._mounting) return;
      const factory = registry.get(this.dataset.demo);
      if (!factory) return;
      this._mounting = true;
      this._setStatus(ui.loading);
      try {
        this._instance = await factory({
          root: this._stage,
          shadow: this._shadow,
          signal: this._abortController.signal,
          copy: this._copy,
          motion: !reducedMotion.matches,
          tokens,
          resolveColor: (value) => this._resolveColor(value),
          announce: (message) => this._setStatus(message)
        }) || {};
        this._mounted = true;
        this.dataset.state = "mounted";
        this._status.hidden = true;
        this._resize();
        this._syncPlayback();
        this.dispatchEvent(new CustomEvent("demo-mounted", {
          bubbles: true,
          detail: { id: this.dataset.demo }
        }));
      } catch {
        this.dataset.state = "error";
        this._setStatus(ui.error);
      } finally {
        this._mounting = false;
      }
    }

    _resize() {
      if (!this._mounted) return;
      call(this._instance, "resize", {
        width: this._stage.clientWidth,
        height: this._stage.clientHeight,
        dpr: Math.min(window.devicePixelRatio || 1, 2)
      });
    }

    _resolveColor(value) {
      if (!this._colorProbe?.isConnected) {
        this._colorProbe = document.createElement("span");
        this._colorProbe.hidden = true;
        this._colorProbe.setAttribute("aria-hidden", "true");
        this._stage.appendChild(this._colorProbe);
      }
      this._colorProbe.style.color = "";
      this._colorProbe.style.color = value;
      return getComputedStyle(this._colorProbe).color || value;
    }

    _syncPlayback() {
      const paused = globalPaused || this._localPaused || !this._visible || reducedMotion.matches;
      this.dataset.playback = paused ? "paused" : "playing";
      this._pauseButton?.setAttribute("aria-pressed", String(this._localPaused));
      if (this._pauseButton) this._pauseButton.textContent = this._localPaused ? ui.resume : ui.pause;
      call(this._instance, paused ? "pause" : "resume");
    }

    _setStatus(message) {
      this._status.hidden = false;
      this._status.textContent = message;
    }
  }

  window.registerDemo = (id, factory) => {
    if (!id || typeof factory !== "function") throw new TypeError("registerDemo(id, factory) requires an ID and factory.");
    if (registry.has(id)) throw new Error(`Duplicate demo: ${id}`);
    registry.set(id, factory);
    figures.forEach((figure) => {
      if (figure.dataset.demo === id && figure._visible) figure._mount();
    });
  };

  customElements.define("interactive-figure", InteractiveFigure);

  const globalToggle = document.querySelector("[data-global-motion]");
  const syncGlobalToggle = () => {
    if (globalToggle) {
      globalToggle.textContent = globalPaused ? ui.resumeAll : ui.pauseAll;
      globalToggle.setAttribute("aria-pressed", String(globalPaused));
    }
    figures.forEach((figure) => figure._syncPlayback());
  };
  globalToggle?.addEventListener("click", () => {
    globalPaused = !globalPaused;
    syncGlobalToggle();
  });
  reducedMotion.addEventListener("change", syncGlobalToggle);
  syncGlobalToggle();
})();
