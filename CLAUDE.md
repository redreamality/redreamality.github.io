# CLAUDE.md — Project guidance for AI agents

Content/SEO authoring rules live in **[AGENTS.md](./AGENTS.md)** (one-H1-per-page, frontmatter, etc.) — read it before editing markdown content.

## Architecture (post-2026 redesign)

- **Astro 5, `output: 'static'`**, Tailwind v3 with `darkMode: 'class'`. pnpm + Vite.
- **Design system** lives in `tailwind.config.mjs` (tokens: `brand`/`accent`/`ink`/`surface` colors, `font-display`=Sora, `font-sans`=Inter, `font-mono`=JetBrains Mono via self-hosted `@fontsource`) and `src/styles/global.css`.
- **Dark mode** is class-based: a pre-paint `is:inline` script in `src/layouts/Layout.astro` `<head>` adds `.js` + `.dark` (from `localStorage.theme` or OS pref) to avoid FOUC. `DarkModeToggle.astro` flips/persists it.
- **Animation**: anime.js v4 (`animejs`). All scroll-reveal logic is centralized in `src/utils/animations.ts` (`initReveals`, `prefersReducedMotion`). Elements opt in with class `reveal-init`; the hidden state is gated by `.js` so no-JS / reduced-motion users see content. `initReveals()` runs once globally from Layout. Hero constellation canvas is in `HomeHero.astro` (idle-started, paused offscreen, skipped under reduced motion).
- **Reusable components**: `src/components/shared/` (`ContentCard`, `SectionGrid`, `GardenListing`, `ProjectCard`) and `src/components/home/` (`HomeHero`, `HomeSections`). The 3 homepage files (`index.astro`, `cn/`, `ja/`) are thin shells; shared copy is in `src/utils/homeContent.ts`.
- **Sections**: blog (original tech) / notes (reading, with `source`) / **meditations = 沉思录 (personal reflections, `ink`/amber accent)** / chaos (signals) / questions / talks — all under `/garden/*` except blog/projects. Meditations collections: `meditations-{cn,en,ja}` (schema in `src/content/config.ts`, helper `getMeditations` in `src/utils/i18n.ts`).
- **Projects are data-driven**: `src/utils/projectsData.ts` (typed array, grouped by `type`: project/paper/tool/app/list). The listing pages render `ProjectCard`s and link out to GitHub/demo/paper. **`src/content/projects-*/projects.md` is the legacy overview** rendered at `/projects/projects/`.

## ⚠️ SEO guardrails (do not break)

- **NEVER rename/move/delete `src/content/projects-{cn,en,ja}/projects.md`** — its slug `projects` powers `/projects/projects/` (+ cn/ja), which is indexed. `src/pages/projects/[slug].astro` must stay.
- Existing URLs are immutable. Only ADD routes. hreflang/canonical/sitemap derive from `src/utils/i18n.ts` + `@astrojs/sitemap` automatically.
- e2e route smoke tests in `e2e/seo-routes.spec.ts` assert these stay 200 — run them after route changes.

## Testing

- Unit: `pnpm test:run` (vitest). E2E: `pnpm test:e2e` (Playwright, serves `dist` via `astro preview`; run `pnpm build` first).
- Per the global rule: after changing interaction details, add/extend e2e tests in `e2e/`.

## 🪤 Tooling pitfalls (learned the hard way — avoid re-hitting)

- **Subagents default to `claude-haiku-4-5`, which is unavailable here.** Always pass an explicit `model` (e.g. `sonnet`) when launching Explore/Plan/Task subagents, or they error out immediately.
- **Playwright `page.goto`/`reload` hang and time out (30s)** because the page's third-party scripts (Chatwoot, Google AdSense, GA) never let the `load` event settle headless. Always navigate with `{ waitUntil: 'domcontentloaded' }`. Route-status checks should use `request.get` (no resource loading) instead of `page.goto`.
- **`expect(locator).toHaveClass(/hidden/)` matches `md:hidden`** (substring). Assert visibility with `toBeVisible()` / `toBeHidden()` instead of regex-matching utility class names.
- **`fullPage` screenshots are flaky/timeout-prone on tall pages**, and capture `reveal-init` content at `opacity:0` (IntersectionObserver hasn't fired). For layout/visual checks, emulate `reducedMotion: 'reduce'` (makes reveal content visible immediately) and prefer viewport-sized captures.
- **Reduced-motion reveal assertions**: cards have `transition-all`, so opacity eases to 1 — poll (`expect.poll(...).toBe(1)`) rather than reading it once.
- `astro.config.mjs` imports `@astrojs/node` but does NOT use it (`output: 'static'`). Do not add it to `integrations` — it would switch to SSR and break every `getStaticPaths`.
