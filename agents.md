# Guidelines for AI Agents Working on This Codebase

This document contains important guidelines and best practices for AI agents working on this project. Following these guidelines ensures consistency, quality, and SEO optimization.

## Content Creation & Editing Guidelines

### ⚠️ CRITICAL: Avoid Duplicate H1 Tags (SEO Issue)

**Problem:** Multiple H1 tags on a page confuse search engines and hurt SEO rankings.

**Rule:** When creating or editing markdown content files, **NEVER** include an H1 (`# Title`) in the markdown content body that duplicates the frontmatter title.

#### Why This Matters
- The Astro page templates already render the frontmatter `title` as an H1 tag in the page header
- Adding another H1 in the markdown content creates duplicate H1s on the rendered page
- Search engines like Google can become confused about page hierarchy with multiple H1s
- This violates SEO best practices which recommend exactly one H1 per page

#### How Content Pages Render Titles

All content pages (`[slug].astro` templates) follow this pattern:

```astro
<header>
  <h1>{post.data.title}</h1>  <!-- Frontmatter title rendered as H1 -->
</header>
<div>
  <Content />  <!-- Markdown content rendered here -->
</div>
```

This means:
- The frontmatter `title` is **automatically** rendered as an H1
- The markdown content should start with H2 (`##`) for the first heading
- Any H1 in the content creates a **duplicate** H1

#### Correct Content Structure

**✅ CORRECT:**

```markdown
---
title: "My Article Title"
description: "Article description"
pubDate: 2025-01-15
author: "Author Name"
---

This is the introduction paragraph.

## First Section

Content of the first section...

## Second Section

Content of the second section...
```

**❌ WRONG:**

```markdown
---
title: "My Article Title"
description: "Article description"
pubDate: 2025-01-15
author: "Author Name"
---

# My Article Title

This is the introduction paragraph.

## First Section

Content of the first section...
```

### Content Types Affected

This applies to ALL content types:
- Blog posts (`/src/content/blog-en/`, `/src/content/blog-cn/`, `/src/content/blog-ja/`)
- Notes (`/src/content/notes-en/`, `/src/content/notes-cn/`, `/src/content/notes-ja/`)
- Questions (`/src/content/questions-en/`, `/src/content/questions-cn/`, `/src/content/questions-ja/`)
- Talks (`/src/content/talks-en/`, `/src/content/talks-cn/`, `/src/content/talks-ja/`)
- Projects (`/src/content/projects-en/`, `/src/content/projects-cn/`, `/src/content/projects-ja/`)

### Checklist When Creating/Editing Content

Before saving any markdown content file, verify:

1. ✅ Frontmatter contains a `title` field
2. ✅ The markdown body does NOT start with `# Title` matching the frontmatter title
3. ✅ First heading in the content (if any) starts with `## ` (H2), not `# ` (H1)
4. ✅ Python code comments using `#` are NOT affected (they're in code blocks)

### Special Note: Python Code Comments

When editing content that includes Python code:
- **DO NOT** remove `#` characters that are Python comments within code blocks
- Hash symbols in code fences are NOT markdown headers

Example:
```python
# This is a Python comment - DO NOT REMOVE
def my_function():
    # Another Python comment - DO NOT REMOVE
    pass
```

## Other Best Practices

### Markdown Heading Hierarchy
- Use semantic heading structure: H2 → H3 → H4
- Don't skip heading levels (e.g., don't jump from H2 to H4)
- Use H2 for main sections, H3 for subsections, etc.

### Frontmatter Requirements
All content files must have proper frontmatter with:
- `title`: The page title (required)
- `description`: A concise description for SEO (required)
- `pubDate` or `date`: Publication/creation date in ISO format (required)
- `author`: Author name (required for blogs/projects)
- `tags`: Array of relevant tags (optional but recommended)
- `lang`: Language code ('en', 'zh', or 'ja') for translations (optional)

### File Naming Conventions
- Use kebab-case for filenames: `my-blog-post.md`
- Keep filenames descriptive but concise
- Match filename to content slug/URL

## Summary

**The Golden Rule:** One H1 per page. The frontmatter `title` is the H1. Start markdown content with H2 (`##`) or plain text, never with H1 (`#`).

This ensures:
- ✅ Clean SEO-friendly page structure
- ✅ Proper heading hierarchy
- ✅ Better search engine rankings
- ✅ Consistent user experience

## Command and Test Pitfalls

- Playwright's reduced-motion reveal test can fail transiently under a fully parallel run by observing `opacity: 0` before client initialization settles. When this happens, rerun the failing spec with `--workers=1`, then rerun the full suite before treating it as a product regression; in the observed case both reruns passed.
- PowerShell `Select-String -LiteralPath` does not expand wildcards such as `dist/_astro/*.css` and reports `Illegal characters in path`. Use `-Path` for wildcard expansion, or pipe files returned by `Get-ChildItem`.
- For `node -e` JavaScript in PowerShell, avoid wrapping the whole script in shell single quotes when the script also contains nested quoted values; quoting may be stripped before Node receives it. Prefer a PowerShell double-quoted argument with JavaScript single-quoted strings, or use a script file.
- A non-interactive `exec` session may not support sending Ctrl+C through `write_stdin`. Start long-running servers with an interruptible TTY when possible, or stop the verified listener by its owning PID/port.
- Tag detail routes are currently generated from blog tags that occur at least twice. New content types such as Meditations must not render unconditional `/tags/.../` links; use `getTagCounts()` and render a plain tag when the corresponding route is not generated.
- Playwright reduced-motion coverage is more deterministic when the test calls `await page.emulateMedia({ reducedMotion: 'reduce' })` before navigation. A describe-level `test.use({ reducedMotion: 'reduce' })` was observed to leak or fail to apply when files shared a worker.
- `rg` exits with status 1 when it finds no matches. For cleanup assertions where “no matches” is the expected success state, handle `$LASTEXITCODE -eq 1` explicitly instead of treating it as a command failure.
- When a shared component or data helper expands from `en | zh` to the full `Language` union, update every localized content record and route prefix in the same change. Otherwise static generation can fail only when it reaches the newly added locale, as happened with `HtmlPagesSection` missing its `ja` copy.
- Do not run Playwright's preview-based E2E suite after `pnpm build` has failed. Astro may leave `dist` incomplete, causing Playwright's `webServer` startup to wait until its 120-second timeout. Fix and rerun the build first, then start E2E.
- AntiAdblock is mounted from the shared `Layout.astro`; route exclusions must therefore be implemented centrally against normalized paths and include all localized home/About variants, rather than being scattered across individual pages.
- Test AntiAdblock delays with Playwright `page.clock` and simulate blocking by injecting CSS for the bait classes (`.adsbox`, `.ad-unit`, etc.). Do not wait 30 real seconds or depend on a browser extension in E2E.
- In PowerShell, a `foreach (...) { ... }` statement cannot always be piped directly; doing so can produce `An empty pipe element is not allowed`. Assign the loop output to a variable or wrap it as `$(foreach (...) { ... })` before piping to `Sort-Object`, `Format-Table`, or similar commands.
- A Playwright config nested below the repository root uses the config directory as the default `webServer` working directory. If the command serves a repo-root path such as `dist/...`, set `webServer.cwd` explicitly (for example `../..`), otherwise the server can start successfully but return repeated 404 responses until the startup timeout.
- ripgrep's default Rust regex engine does not recognize .NET property names such as `\p{IsCJKUnifiedIdeographs}` and exits with a regex parse error. Use explicit ranges such as `[一-龯ぁ-ゟ゠-ヿ]`, or a Unicode property name supported by ripgrep/PCRE2.
- Filesystem deletion commands such as recursive or per-file PowerShell `Remove-Item` may be rejected by the execution policy before path-validation code runs. For disposable Python caches, prevent creation with `python -B` and ignore `__pycache__/` plus `*.py[cod]`; do not respond by retrying broader deletion commands.
- `pnpm exec astro check` is not currently a clean project gate: it reports hundreds of pre-existing diagnostics across legacy layouts, admin pages, tests, and localized routes. When using it during scoped work, fix every diagnostic in touched files, record the baseline limitation, and use successful `pnpm build` plus focused tests as the completion gate instead of attempting an unrelated repo-wide type cleanup.
- Do not force a Playwright success into a shell failure merely because a TDD RED state was expected. The shared `dist` directory may already contain the implementation from an earlier build; verify build provenance first, and if the behavior is already green, accept it and continue instead of throwing an artificial error.
- On Windows, passing a wildcard filename such as `dist/sitemap-*.xml` or `src/assets/html-pages/agent-*.html` directly to `rg` does not rely on shell expansion and can produce an invalid-path error. Pass the containing directory plus an rg glob instead, for example `rg -g 'sitemap-*.xml' 'pattern' dist`, or enumerate files with PowerShell first.
- In PowerShell, a command assembled as individually quoted executable and argument tokens (for example `"git" "status"`) is parsed as string expressions and fails unless the invocation operator `&` is used. Prefer normal native command syntax for fixed commands, or invoke an argument array with `& $exe @args`.
- `rg --files` exits with an OS error when an explicitly named search root does not exist. Before passing optional directories such as `tools/` or `prototypes/`, check them with `Test-Path`, or search from the repository root using `-g` filters.
- PowerShell path cmdlets treat square brackets in Astro dynamic route filenames such as `[slug].astro` as wildcard syntax. Use `Get-Content -LiteralPath`, `Test-Path -LiteralPath`, and equivalent literal-path parameters for these files.
- Preview/test child processes can exit between PID discovery and `Stop-Process`. Treat a missing PID as successful cleanup: re-query the process immediately before stopping it and use `-ErrorAction SilentlyContinue` instead of turning this normal race into a command failure.
- Imported standalone HTML artifacts can carry source-editor trailing spaces across thousands of lines, causing `git diff --check` to fail at commit time. Run a no-BOM, line-ending-preserving trailing-whitespace cleanup on the imported artifact before staging, then rerun `git diff --check`.
- The workspace path contains a full-width bracket segment (`【homepage`). Reuse the exact resolved working directory in tool calls; a manually retyped path that drops the separator after this segment fails before the command starts with “The directory name is invalid.”
- A long PowerShell one-liner that combines port discovery, `Start-Process`, log redirection, readiness polling, and conditional cleanup can be rejected by the command policy before execution. Split background preview startup into separate commands: verify the port, launch with `Start-Process -WindowStyle Hidden`, then poll HTTP readiness independently.
