---
name: create-visual-work
description: Create, modify, migrate, generate, publish, or validate multilingual Visual works in this repository. Use whenever a task touches /visuals/ routes, src/data/visuals-manifest.json, Visual artifact HTML, tools/visual-explainer-kit, Gemini-generated demo adapters, Visual gallery cards, Visual interactions, or Visual-specific SEO/E2E behavior.
---

# Create Visual Work

Use the repository's shared Visual authoring and publishing seams. Do not create an isolated page shell or a second publication list.

## Start here

1. Read the project `agents.md` completely.
2. Read [references/visual-system.md](references/visual-system.md) before creating a work, changing its renderer/artifact wiring, or diagnosing the creation pipeline.
3. Inspect `git status --short` and preserve unrelated user changes.
4. Identify whether the request changes authoring inputs, generated artifacts, publication metadata, interaction behavior, or more than one layer.

## Choose the authoring path

- Use `interactive-explainer` for overview → steps → synthesis narratives. Reuse `tools/visual-explainer-kit/`.
- Use `standalone` for maps, dashboards, nonlinear stories, or layouts that do not fit the explainer contract.
- Both paths must render through the shared Astro `Layout.astro`; never publish an iframe, independent site header, or second language navigation.

## Work through the source seam

- Treat `src/data/visuals-manifest.json` as the only publication source of truth.
- For explainer content, edit the authoring manifest and `src/demos/<demo-id>.js`; do not hand-edit generated HTML as the primary change.
- Keep demo IDs unique and stable. Read all visible, dynamic, unit, status, Canvas/SVG, title, and aria copy from the locale `copy` object.
- Use Gemini only through `pnpm visual-kit:generate ...`; review and validate generated JavaScript before rebuilding an artifact.
- Keep generated adapters inside the shared runtime interface: `root`, `shadow`, `signal`, `copy`, `motion`, `tokens`, `announce`; return pause, resume, reset, destroy, and resize when size-dependent.
- Declare every remote resource in the publication manifest allowlist. Prefer no external resources.

## Publish through Astro

1. Build or update the locale artifacts under `src/assets/html-pages/`.
2. Add or update the work in `src/data/visuals-manifest.json`, including all required shared and locale fields.
3. Register a new shared Astro artifact renderer only when the artifact ID is genuinely new. Use one stable artifact ID across locales when one renderer receives `lang`.
4. Keep the shared navigation, language switcher, dark mode, SEO, sitemap, footer, CSS isolation, single H1, and full-width behavior intact.
5. Rebuild generated artifacts after changing runtime, demo adapters, authoring manifests, or shell/CSS.

## Verify in this order

Run the gates in the project-required sequence:

```powershell
pnpm build
pnpm test:run
pnpm visual-kit:test
pnpm visual-kit:build
pnpm exec playwright test --config=tools/visual-explainer-kit/playwright.config.ts
pnpm exec playwright test e2e/visuals.spec.ts --workers=1
pnpm test:e2e
git diff --check
```

Do not run preview-based E2E after a failed build. Any interaction change requires focused Playwright coverage. Inspect the final artifact in English, Chinese, and Japanese at desktop and mobile sizes.

## Handoff

Report:

- the selected renderer and source seam;
- manifest, demo, runtime, artifact, renderer, and test files changed;
- whether Gemini was actually called or only the mocked generation path was tested;
- build, unit, focused E2E, full E2E, and diff-check results;
- any legacy limitation, especially Typhoon's imported HTML/translation compatibility path.
