// Client-side animation helpers built on anime.js v4.
// Imported by component <script> tags (Vite bundles + dedupes the library).
import { animate, stagger } from 'animejs';

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

interface RevealOptions {
  threshold?: number;
  rootMargin?: string;
  distance?: number;
  duration?: number;
  staggerMs?: number;
}

/**
 * Reveal-on-scroll for every `.reveal-init` element under `root`.
 * Idempotent: elements are marked `data-reveal-bound` once observed, so calling
 * this multiple times (or from multiple components) never double-binds.
 * Reduced-motion / no-JS users get fully visible content (see global.css).
 */
export function initReveals(root: ParentNode = document, opts: RevealOptions = {}): void {
  const {
    threshold = 0.12,
    rootMargin = '0px 0px -40px 0px',
    distance = 24,
    duration = 650,
    staggerMs = 70,
  } = opts;

  const els = Array.from(root.querySelectorAll<HTMLElement>('.reveal-init')).filter(
    (el) => !el.dataset.revealBound
  );
  if (!els.length) return;
  els.forEach((el) => {
    el.dataset.revealBound = '1';
  });

  if (prefersReducedMotion()) {
    els.forEach((el) => el.classList.add('reveal-shown'));
    return;
  }

  const reveal = (group: HTMLElement[]) => {
    animate(group, {
      opacity: [0, 1],
      translateY: [distance, 0],
      duration,
      delay: stagger(staggerMs),
      ease: 'outCubic',
      onComplete: () => group.forEach((el) => (el.style.willChange = 'auto')),
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const batch = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
      if (!batch.length) return;
      // keep DOM order so the stagger reads top-to-bottom / left-to-right
      batch.sort((a, b) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
      );
      reveal(batch);
      batch.forEach((el) => observer.unobserve(el));
    },
    { threshold, rootMargin }
  );

  els.forEach((el) => observer.observe(el));
}

/** Re-export for components that want bespoke animations. */
export { animate, stagger };
