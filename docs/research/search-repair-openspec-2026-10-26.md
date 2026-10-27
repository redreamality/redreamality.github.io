# OpenSpec search repair, October 26, 2026

Scope: two existing blog slugs in English, Chinese, and Japanese, plus narrowly scoped consistency updates to the existing three-language `openspec-guide` note. No new articles, commits, pushes, global installations, or full site build.

## Files and search tasks

Modified files:

- `src/content/blog-en/openspec-tutorial-cli-commands-agents-md-examples.md`
- `src/content/blog-cn/openspec-tutorial-cli-commands-agents-md-examples.md`
- `src/content/blog-ja/openspec-tutorial-cli-commands-agents-md-examples.md`
- `src/content/blog-en/openspec-1-5-stores-beta-update-guide.md`
- `src/content/blog-cn/openspec-1-5-stores-beta-update-guide.md`
- `src/content/blog-ja/openspec-1-5-stores-beta-update-guide.md`
- `src/content/notes-en/openspec-guide.md`
- `src/content/notes-cn/openspec-guide.md`
- `src/content/notes-ja/openspec-guide.md`

New files:

- `public/assets/openspec-search-repair/check-examples.mjs`
- `docs/research/search-repair-openspec-2026-10-26.md`

The CLI pages now answer `install openspec`, Windows installation, PATH conflicts, and command lookup before the historical exercise. They separate standalone and Node-based installation, package upgrade and project integration refresh, shell commands and assistant invocations, and program removal and specification history.

The Stores pages now answer `openspec multi repo`, `openspec multirepo`, and `openspec stores` with a shared contract and two independent component changes. They cover root ownership, reference discovery, pending contracts, manual Git synchronization, conflicts, stale checkouts, and missing registrations. A stable `#multi-repo-practice` anchor supports links from the tutorials and notes.

The notes only add task links, the current version distinction, and the scope of the Node prerequisite. Their existing examples and structure remain.

All original slugs, publication dates, and existing Markdown headings remain. Six blog files have `updatedDate: 2026-10-26T00:00:00.000Z`; notes have a visible maintenance date and no unsupported `updatedDate`. The English `OpenSpec Quick Start` heading and the exact 1.13.2 init fixture expected by `e2e/gsc-content.spec.ts` remain, so no test edits were necessary.

## Primary sources and release boundaries

Checked official web documentation and the official Git repository, then ran the published package:

- [Installation, v1.15.0](https://github.com/Fission-AI/OpenSpec/blob/v1.15.0/docs/installation.md)
- [CLI reference, v1.15.0](https://github.com/Fission-AI/OpenSpec/blob/v1.15.0/docs/cli.md)
- [Stores guide, v1.15.0](https://github.com/Fission-AI/OpenSpec/blob/v1.15.0/docs/stores-beta/user-guide.md)
- [Historical v1.5.0 changelog](https://github.com/Fission-AI/OpenSpec/blob/v1.5.0/CHANGELOG.md)
- [Current official installation page](https://openspec.dev/docs/installation)
- npm registry metadata via `pnpm view @fission-ai/openspec dist-tags --json`

Registry output:

```json
{
  "next": "0.3.0",
  "beta": "1.6.0-beta.1",
  "latest": "1.15.0"
}
```

The v1.15.0 checkout resolves to `8e0288df12d401b0e183e2f47254d22528c1dffb`. The fetched main commit was `6d04a1b58dedc95729d34e4f223d9d483aae210a`; the installation, CLI, and Stores guide files above had no diff between those two revisions. Claims are nevertheless linked to the release tag rather than assuming main is released.

Verified facts:

- Standalone installation requires no Node runtime. Package-manager installation requires Node.js 20.19.0 or newer.
- The official installers execute scripts from main but select released binary assets and check SHA256SUMS. `OPENSPEC_VERSION` pins the selected release.
- Windows standalone installation uses `%LOCALAPPDATA%\Programs\openspec`; macOS and Linux use `~/.local/bin` by default.
- `openspec install` switches to standalone. `openspec update` refreshes project integrations. There is no `openspec uninstall`.
- 1.15.0 contains `store`, `doctor`, `context`, and `workset`; the corresponding features remain Beta. The npm beta tag is not required to use them.
- `references` does not select a write root and indexes accepted main specs, not active Store changes.
- Root precedence is explicit Store, nearest real planning root, project pointer, global default. Without those, registered Stores require selection; otherwise the current-directory fallback remains.
- `doctor` does not synchronize Git. An unresolved reference can produce exit code 0 with a warning in `references[].status`.
- `/opsx:sync` concerns specification deltas, not pulling or pushing a Git repository.
- A Store does not dispatch implementation tasks to component repositories or grant an agent permission to edit them.

## Executed checks

Environment: Windows PowerShell, Node.js `v26.7.0`, pnpm `10.28.2`. Test artifacts and isolated XDG config/data directories were created under the system temporary directory.

Reproduce from this repository on Windows:

```powershell
$pnpmScript = Join-Path (Split-Path (Get-Command pnpm).Source -Parent) 'node_modules/pnpm/bin/pnpm.cjs'
node public/assets/openspec-search-repair/check-examples.mjs $pnpmScript .
```

Actual final output:

```text
PASS: 60 CLI checks. No model calls, remote Git operations, or global installation.
Evidence and practice files: C:\Users\unknown\AppData\Local\Temp\openspec-examples-sSavti
```

`results.json` in that directory records each command, version, working directory, exit code, stdout, and stderr. The downloadable script reproduces the checks and emits its own new evidence directory.

The checks cover:

- Published 1.15.0 version and relevant command help.
- Store creation without automatic Git initialization or commits.
- Strict validation of the promotion contract.
- Initializing two local Git component repositories, adding references, and creating separate local changes.
- Structured assertions on instruction output: exact component root, `promotion` spec entry, and `openspec show <spec-id> --type spec --store team-contracts` fetch recipe.
- File assertions that component changes stay local and the explicitly Store-owned change goes only into the Store.
- Context and doctor output, reading the shared spec, unregistering without deleting its files, and registering again.
- Actual missing-reference output with `code: "reference_unresolved"`, `severity: "warning"`, and exit code 0. The first checker run used an incorrect guessed diagnostic name; the assertion was corrected to the actual JSON field before the passing run.
- Extracting proposal, delta, design, and tasks from each of the three existing tutorial translations. Each was replayed on both 1.13.2 and 1.15.0 through init, change creation, status, strict delta validation, archive, and strict main-spec validation.

The archive exercise intentionally retains unchecked implementation tasks. Its success proves document processing, not an implemented authentication feature. No model, email service, API server, or UI implementation was run.

Additional focused checks passed:

- `node --check public/assets/openspec-search-repair/check-examples.mjs`
- Nine-document checks for unchanged publication dates, blog-only updatedDate, preservation of every old Markdown heading, balanced fences, no body H1 outside code, correct localized blog links, and existence of linked downloadable assets.
- `git diff --check` for owned files.
- Chinese prose-rhythm checks: no runs of four or more short sentences in either edited Chinese blog. Softer three-sentence notices remain, including code-adjacent instructions.
- Required bookkeeping-language scan found no matches in the six blog files.

## Language counts

Counts exclude frontmatter and fenced code. Chinese counts use Unicode Han characters. English counts use Latin word tokens, including inline command and link tokens. Japanese counts include Han, Hiragana, and Katakana characters. These are content counts, not model tokens.

| Existing page | English words | Chinese Han characters | Japanese characters |
| --- | ---: | ---: | ---: |
| CLI tutorial | 2,477 | 3,433 | 5,202 |
| Stores guide | 2,999 | 4,175 | 5,783 |
| OpenSpec note | 1,289 | 1,995 | 2,754 |

The Chinese blogs remain below the repository's usual 4,500–5,500-character target, and the English CLI tutorial remains below its usual target. This is a scoped repair of existing pages, not a new formal article or a full rewrite. Additional text was limited to the identified installation and multi-repository tasks rather than padding existing content to a length target.

## Limits and handoff

The official global installation scripts were documented, not executed. macOS, Linux, shell profile changes, actual package removal, private remote synchronization, and real merge conflicts were not exercised. Git synchronization guidance is based on the official Stores model; the fixture uses local repositories without remote operations.

No full build, preview, browser E2E, route generation check, commit, or push was run. Broader content and route verification belongs to the coordinating task. Existing unrelated worktree changes were left untouched.

No new search metrics were collected. These edits address the tasks identified by the October 25 report; they do not establish ranking or click improvement. Compare the same page-query pairs after release using the report's 14/28-day windows.
