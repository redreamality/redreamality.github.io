# scripts/

Utility scripts for the Astro site. See also root `agents.md` for content/SEO conventions.

## IndexNow

`indexnow.mjs` notifies IndexNow participants (Bing, Yandex, …) about published or changed URLs.

- Key file: `public/<key>.txt` (deploys to `https://redreamality.com/<key>.txt`)
- CI: after GitHub Pages deploy on `master`, submits URLs derived from `src/content/**` changes in the push

```bash
node scripts/indexnow.mjs https://redreamality.com/blog/example-slug/
node scripts/indexnow.mjs --git-diff HEAD~1 HEAD --dry-run
pnpm indexnow -- --git-diff HEAD~1 HEAD
```
