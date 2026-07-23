# Visual system reference

## Current relationships

```text
Publication
src/data/visuals-manifest.json
  -> src/utils/visuals.ts
  -> src/pages/{locale}/visuals/
  -> src/components/VisualWorkPage.astro
  -> artifact renderer component
  -> artifact extractor
  -> shared Layout.astro

Interactive-explainer authoring
tools/visual-explainer-kit/manifest-*.json
  -> prompts/
  -> generate_demos.py (optional Gemini authoring adapter)
  -> src/demos/<demo-id>.js
  -> builder.py + shell.html + demo-runtime.js + article.css
  -> locale self-contained HTML
  -> src/assets/html-pages/<slug>/<locale>/index.html
  -> publication manifest
```

## Important files

- Publication manifest: `src/data/visuals-manifest.json`
- Manifest reader and gallery derivation: `src/utils/visuals.ts`
- Shared artifact registry: `src/components/VisualWorkPage.astro`
- Visual gallery: `src/components/VisualGallery.astro`
- Shared explainer builder: `tools/visual-explainer-kit/builder.py`
- Gemini generator: `tools/visual-explainer-kit/generate_demos.py`
- Runtime: `tools/visual-explainer-kit/src/demo-runtime.js`
- Demo adapters: `tools/visual-explainer-kit/src/demos/`
- Authoring prompts: `tools/visual-explainer-kit/prompts/`
- Site Visual E2E: `e2e/visuals.spec.ts`
- Kit E2E: `tools/visual-explainer-kit/visual-kit.spec.ts`

## Gemini commands

Generate one demo without overwriting unrelated adapters:

```powershell
pnpm visual-kit:generate --manifest manifest-loop-engineering.json --step outer-loop --locale en
```

Generate all steps incrementally:

```powershell
pnpm visual-kit:generate --manifest manifest-loop-engineering.json --all --include-overview --locale en --resume
```

The generator defaults to `gemini-3.1-pro`. It reads `NEWAPI_GEMINI_KEY`, then falls back to the gopass entry `newapi/gemini`. It writes redacted request logs under the ignored `tools/visual-explainer-kit/logs/` directory and prompt fingerprints to the ignored `.generation-state.json`.

Do not add an extra argument separator after the pnpm script name. Use `pnpm visual-kit:generate --help`, not `pnpm visual-kit:generate -- --help`.

## Renderer decision

### interactive-explainer

Use when the work has a linear explanatory sequence and benefits from the shared lifecycle, localized `copy`, pause/reset, viewport mounting, reduced motion, and optional Gemini-generated demo adapters.

### standalone

Use when the visual requires a specialized narrative or layout. Still extract its body/style into a scoped root container, pass through the external-resource policy, and render through the shared site Layout.

## Non-negotiable publication contract

- One stable kebab-case slug across locales.
- English, Chinese, and Japanese metadata and artifacts by default.
- Exactly one H1 per locale page.
- No iframe, independent header, duplicate language navigation, or global unscoped CSS.
- Keyboard-operable controls and localized accessible names.
- Pause/reset and `prefers-reduced-motion` support for animations.
- Current-language artifact selection and language switching keep the same slug.
- Manifest-derived gallery, homepage latest Visual, routes, SEO, hreflang, and sitemap.
- Build-time failure for missing artifact renderers or unregistered demos.
- Focused E2E for every interaction change.

## Legacy Typhoon note

Typhoon is currently published from `src/assets/html-pages/typhoon-zh.html` with `src/data/typhoon-translations.ts` and `src/utils/typhoon-artifact.ts`. Its original `C:\Users\Remy\Documents\typhoon\v2` authoring project used Gemini and per-demo files, but the repository retains a compatibility artifact rather than a complete structured three-locale authoring manifest. Do not assume hand-editing the generated Typhoon HTML is equivalent to editing a shared explainer source.
