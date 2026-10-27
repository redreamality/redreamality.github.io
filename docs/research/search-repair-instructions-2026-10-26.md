# AGENTS.md / CLAUDE.md search-intent repair

Date: 2026-10-26, Pacific/Port_Moresby.

## Scope and changed files

Edited only the existing translations and this report:

- `src/content/blog-en/claude-md-agents-md-deep-dive.md`
- `src/content/blog-cn/claude-md-agents-md-deep-dive.md`
- `src/content/blog-ja/claude-md-agents-md-deep-dive.md`
- `docs/research/search-repair-instructions-2026-10-26.md`

No assets, new blog posts, commit, push, deployment, or full build. Other working-tree changes were left untouched.

The source research report identifies the English page's same-query decline for `agents.md vs claude.md`: clicks 10 to 2, impressions 829 to 266, position 5.2 to 6.3. This edit addresses the mismatch between that comparison query and the former history-survey opening. It does not establish the cause of the traffic decline or predict recovery.

## Reader-visible changes

The title, description, and opening now answer which file to use. The next sections cover version-specific direct loading, coexistence, fallback, verification, and copyable AGENTS/CLAUDE/settings templates. Codex gets a separate discovery explanation and fallback example.

Corrected broad native-support claims, the no-memory description, the deprecated-local-file claim, five-hop imports, the incomplete auto-memory limit, root-file path-scoping claims, automatic changelog comparison, hook-observability assumptions, and categorical second-error advice. The old false local-file heading was replaced with an accurate heading and an explicit legacy span ID.

The twelve historical sections remain. The Japanese file previously contained English for almost all of those sections; it now has Japanese prose covering the same topic sequence, with explicit old English heading IDs. The translation omits unsupported precision rather than turning old line counts and adoption counts into new claims.

Original slugs and `pubDate` values remain unchanged: Chinese 2026-04-25; English and Japanese 2026-04-26. `src/content.config.ts` supports `updatedDate`, so all three now use 2026-10-26.

## Official evidence checked

Web access was required and attempted with the web tool. Because those calls returned no usable page text in this session, the actual evidence review used direct HTTPS retrieval of the official pages, including the Markdown version of Claude's documentation. No competitor assertion was used as authority for loading behavior.

| Source | Verified facts used |
| --- | --- |
| [Claude Code memory](https://code.claude.com/docs/en/memory), also retrieved as `/docs/en/memory.md` | Direct AGENTS support begins at v2.1.277; pre-v2.1.281 session restrictions; pre-v2.1.280 visibility limitation; project/ancestor CLAUDE blockers and user/managed/rules exceptions; four instructionFiles modes; plugin ID compatibility at v2.1.285; setting scopes; deduplication; nested discovery; supported filenames; imports and four-hop limit; local-file support; memory index 200 lines or 25 KB; `/context`, `/memory`, and InstructionsLoaded exceptions. |
| [Official Codex AGENTS guide](https://developers.openai.com/codex/guides/agents-md/) | Startup chain, global and root-to-working-directory discovery, at most one non-empty file per project directory, override/default/fallback ordering, default 32 KiB budget, configuration restart, `--cd` verification, opt-in TUI logs. |
| [AGENTS.md format and FAQ](https://agents.md/) | Plain Markdown without required fields, foundation stewardship, distinction between a shared format and individual tool configuration. |

The articles use separated reference links `[1] [2] [3]`. Their rendered HTML was checked to ensure each number resolves to its own source rather than being parsed as a combined label/reference pair.

## Focused verification

Used the repository-installed `@astrojs/markdown-remark` processor, with syntax highlighting disabled, to render all three Markdown bodies without a site build. Compared rendered IDs against `git show HEAD:<path>` using the same processor.

- 50 original heading IDs per locale retained, 150 total.
- Zero missing old IDs, duplicate IDs, or broken newly added local fragment links in the rendered-body check.
- Zero body H1 elements in all locales. The page template remains responsible for the title H1.
- Frontmatter parsed successfully; original publication dates retained.
- One JSON settings example per locale parsed with `JSON.parse`.
- Initial paragraph references resolve separately to Claude memory, Codex guidance, and agents.md.
- `node scripts/check-prose-rhythm.mjs src/content/blog-cn/claude-md-agents-md-deep-dive.md`: zero short-sentence runs at either threshold, zero bookkeeping-phrase hits.
- Requested bookkeeping phrase scan and obsolete-heading/adjacent-reference scan: no matches.
- `git diff --check` for the owned files: passed.

Full build, route checks, outbound-rewrite integration, and browser viewport checks remain with the parent integration task. This body-only render does not prove final page layout or deployed routing. Examples were checked against current documentation and parsed where appropriate, but no authenticated Claude/Codex session was launched to reproduce every version branch.

## Counts and boundaries

Counts exclude frontmatter, fenced code, explicit legacy span elements, and the references section. They include headings and visible body content. English uses ASCII word tokens with internal apostrophes or hyphens; Chinese counts Unicode Han characters; Japanese counts Han, Hiragana, and Katakana characters.

| Locale | Count |
| --- | ---: |
| Chinese | 7,642 Han characters |
| English | 5,315 English word tokens |
| Japanese | 9,048 Japanese-script characters |

The Chinese and English articles remain above the normal new-post length target because this is a bounded repair of an existing long survey, and the instruction was to preserve its depth and old anchors. No new formal blog slot or Trends qualification was created. Existing historical discussion was not exhaustively re-researched; the current official loading/verification claims are the verified scope.

After publication, compare the same page/query pair over 14 and 28 days, with country/device slices where sample size permits. Treat changes in CTR, position, impressions, and clicks separately.
