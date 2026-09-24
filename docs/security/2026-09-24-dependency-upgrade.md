# Dependency security upgrade

Date: 2026-09-24

## Scope

- Baseline: GitHub reported 122 open Dependabot alerts (5 critical, 48 high,
  51 medium, 18 low), representing 103 unique advisory IDs.
- Upgrade Astro 5.12.8 to 7.3.4, Sharp to 0.35.4, Vitest and its coverage/UI
  packages to 5.0.1, and Happy DOM to 20.14.5. Refresh compatible dependency
  versions and the pnpm lockfile without advisory exclusions or overrides.
- Remove the unused Node SSR adapter. The site continues to deploy static
  output to GitHub Pages.
- Replace the Astro 5-only Tailwind integration with Tailwind 3 PostCSS and
  Autoprefixer. Preserve HTML whitespace behavior and the unified Markdown
  pipeline, including KaTeX and Shiki.
- Move all 21 collections to `src/content.config.ts` with glob loaders.
  `src/utils/content-collections.ts` preserves the site's slug/render interface
  over Astro's Content Layer API; no experimental compatibility flag remains.
- Use Node 24 and pnpm 10.28.2 in all three build/deploy workflows.
- Update storage and Node built-in mocks for the new test runtime.

## Verification

- `pnpm install --frozen-lockfile`: passed.
- `pnpm audit`: no known vulnerabilities, including development dependencies.
- `pnpm build`: passed.
- `pnpm test:run`: 96 tests passed.
- Focused Playwright: 31 tests passed, including new three-language math,
  syntax-highlighting and Tailwind checks.
- Full Playwright: 126 tests passed in the shared working directory. Nine
  belong to an unrelated, concurrently edited homepage test, not this change.
- All 322 source Markdown entries have output pages at their legacy slugs.
- Independent read-only review found no blocking issue in the upgrade.

The cached pre-upgrade sitemap was not a reliable release baseline: it
predated upstream content and tag-taxonomy changes. Route preservation was
therefore checked against current source files and the original slug
generation function, in addition to browser-level canonical/route checks.

## Command incidents and resolutions

| Symptom | Cause | Resolution / prevention |
| --- | --- | --- |
| Optional `.npmrc` probe returned nonzero | File does not exist | Check optional paths before reading; no configuration was required. |
| A quoted `rg` probe failed; another returned 1 | PowerShell quote parsing; then an expected no-match result | Use literal probes and explicitly handle expected no matches. |
| Subagent artifact-path probes failed | Guessed paths did not match repository layout | Enumerate files before reading; actual helpers are `src/utils/*-artifact.ts`. |
| Build: `Missing parameter: slug` | Astro 7.3.4's legacy configuration flag did not restore the entry API in this build | Use explicit Content Layer loaders and the site's typed adapter. Do not continue preview tests after a failed build. |
| Build: `Layout is not defined` | A test page placed an HTML comment before its Astro frontmatter | Move the comment below frontmatter; keep Astro frontmatter first. |
| Unit tests: read-only `localStorage` | New Happy DOM exposes storage through getters | Use `vi.stubGlobal` instead of assigning to the getter. |
| Unit tests: `mockImplementation` / `mockReturnValue` is not a function | Built-in module automocking no longer produced the old default-export mocks | Provide explicit `path` and `fs` mock factories. |
| Chromium download reset / timed out | CDN connection interrupted during full-browser download | Stop only the verified download process. The matching headless shell was already completely installed and passed E2E; Playwright was not downgraded. The stopped installer exited 1 intentionally. |
| Diff check: trailing whitespace | Adding a final newline exposed an existing trailing space in the deployment workflow | Remove that space and rerun the check. |
| `git fetch` could not connect to GitHub port 443 | Transient network failure | Retry the same fetch; the second attempt succeeded without changing credentials or remotes. |

No project `agent-incidents` recording tool was found. These task-specific
incidents are recorded here, not promoted to `AGENTS.md`.

## Remaining notes

- GitHub may need to refresh its dependency graph after push. A local zero
  audit is not a claim that the GitHub UI has already refreshed.
- pnpm reports an ignored esbuild install script. The packaged platform
  binary works in the verified build; broad install-script execution was not
  enabled.
- The repository still has unrelated pre-existing type-check diagnostics;
  this upgrade uses build, unit tests and browser tests as release gates.
